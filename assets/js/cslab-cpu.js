/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: CPU жад иерархиясы, кэш және конвейер зертханасы (academy/labs/cpu.html).
   Кэш: 8 биттік байт адрес; блок = ⌊адрес / B⌋, жиын (индекс) = блок mod S, тег = ⌊блок / S⌋, ығысу = адрес mod B, мұнда S = L / W.
   W = 1 - тікелей сәйкестік (direct-mapped), W = 2 - 2 жолды жиынды-ассоциативті, ығыстыру - LRU.
   Miss түрлері (3C): міндетті - блок бұрын ешқашан болмаған; қақтығыс - сол L жолды ТОЛЫҚ ассоциативті LRU кэш hit берер еді; әйтпесе - сыйымдылық.
   Конвейер: классикалық 5 саты (IF ID EX MEM WB), ретпен орындау, тек RAW тәуелділік; тоқтау ID сатысында.
   Форвардингсіз: тіркеу файлы WB-ның бірінші жартысында жазады, ID екінші жартысында оқиды → EX(i) ≥ EX(j) + 3.
   Форвардингпен: ALU нәтижесі EX(i) ≥ EX(j) + 1; lw нәтижесі MEM-нен кейін → EX(i) ≥ EX(j) + 2 (load-use: 1 тоқтау). */
(() => {
  "use strict";
  const T = window.AO17Tutor, A = window.CSLabA;
  const hex = (a) => "0x" + a.toString(16).toUpperCase().padStart(2, "0");
  const bin = (x, n) => (n ? x.toString(2).padStart(n, "0") : "");
  const lg = (x) => Math.round(Math.log2(x));
  const pct = (x) => A.num(x * 100, 1) + "%";

  // ---------------------------------------------------------------- кэш моделі
  function split(addr, cfg) {
    const S = cfg.L / cfg.W, ob = lg(cfg.B), ib = lg(S), block = Math.floor(addr / cfg.B);
    return { addr, block, off: addr % cfg.B, idx: block % S, tag: Math.floor(block / S), ob, ib, tb: 8 - ob - ib, S };
  }
  /** opt.fifo - LRU орнына FIFO; opt.inf - ешқашан ығыстырмайды; opt.exact - блок орнына нақты адресті сақтайды (ығысуды елемеу қатесі) */
  function simCache(trace, cfg, opt = {}) {
    const S = cfg.L / cfg.W, sets = [...Array(S)].map(() => [...Array(cfg.W)].map(() => ({ v: false, tag: 0, block: 0, last: -1, born: -1, addr: -1 })));
    const seen = new Set(), fa = []; const F = []; let hits = 0, miss = 0; const kinds = { comp: 0, conf: 0, cap: 0 };
    const where = {}; // блок → соңғы жүктелген қадамы
    const snap = () => sets.map((s) => s.map((w) => ({ ...w })));
    F.push({ i: -1, sets: snap(), hits, miss, kinds: { ...kinds } });
    trace.forEach((addr, i) => {
      const p = split(addr, cfg), set = sets[p.idx];
      const key = opt.exact ? addr : p.block;
      let way = set.findIndex((w) => w.v && (opt.exact ? w.addr === addr : w.tag === p.tag));
      const hit = way >= 0;
      let ev = null, kind = null, temporal = false, from = null;
      // 3C: толық ассоциативті LRU (L жол)
      const faHit = fa.includes(p.block);
      if (hit) {
        hits++; set[way].last = i; temporal = trace.slice(0, i).includes(addr); from = where[key];
      } else {
        miss++;
        kind = !seen.has(p.block) ? "comp" : faHit ? "conf" : "cap"; kinds[kind]++;
        way = set.findIndex((w) => !w.v);
        if (way < 0) {
          if (opt.inf) { set.push({ v: false, tag: 0, block: 0, last: -1, born: -1, addr: -1 }); way = set.length - 1; }
          else { way = set.reduce((m, w, j) => ((opt.fifo ? w.born < set[m].born : w.last < set[m].last) ? j : m), 0); ev = { ...set[way] }; }
        }
        set[way] = { v: true, tag: p.tag, block: p.block, last: i, born: i, addr };
        where[key] = i;
      }
      seen.add(p.block);
      const k = fa.indexOf(p.block); if (k >= 0) fa.splice(k, 1); fa.push(p.block); if (fa.length > cfg.L) fa.shift();
      F.push({ i, addr, p, hit, way, ev, kind, temporal, from, sets: snap(), hits, miss, kinds: { ...kinds } });
    });
    return { frames: F, res: F.slice(1).map((f) => (f.hit ? "H" : "M")), hits, miss, kinds, rate: trace.length ? hits / trace.length : 0 };
  }
  const blk = (b, B) => `[${b * B}–${b * B + B - 1}]`;
  const KIND = { comp: "міндетті miss: бұл блокқа алғаш рет қатынас", conf: "қақтығыс miss: дәл осы көлемдегі толық ассоциативті кэште блок сақталар еді, бірақ бір индекске тым көп блок түседі", cap: "сыйымдылық miss: кэш жалпы көлемі бұл жұмыс жиынына жетпейді" };
  function accessMsg(f, cfg, trace) {
    const p = f.p, a = `${f.addr} (${hex(f.addr)}) = ${bin(p.tag, p.tb)} | ${bin(p.idx, p.ib)} | ${bin(p.off, p.ob)} → тег ${p.tag}, индекс ${p.idx}, ығысу ${p.off}. `;
    if (f.hit) return a + `${p.idx}-жиында тег ${p.tag} бар - HIT. ` + (f.temporal ? "Дәл осы адрес жақында қолданылған (уақыттық локальдылық)." : `Блок ${blk(p.block, cfg.B)} ${f.from + 1}-қатынаста (${trace[f.from]}) жүктелген - көрші байт та сол блокта (кеңістіктік локальдылық).`);
    return a + `${p.idx}-жиында тег ${p.tag} жоқ - MISS (${KIND[f.kind]}). Жадтан ${blk(p.block, cfg.B)} блогы (${cfg.B} байт) жүктелді` +
      (f.ev ? `; жиын толы - ${cfg.W === 2 ? "ең ұзақ қолданылмаған (LRU)" : "жалғыз"} жолдағы тег ${f.ev.tag} (блок ${blk(f.ev.block, cfg.B)}) шығарылды.` : ".");
  }
  function parseTrace(s) {
    const out = [];
    for (const tok of String(s).split(/[\s,;]+/).filter(Boolean)) { const v = /^0x[0-9a-f]+$/i.test(tok) ? parseInt(tok, 16) : /^\d+$/.test(tok) ? +tok : NaN; if (!Number.isInteger(v) || v < 0 || v > 255) return { err: `«${tok}» - 0 … 255 аралығындағы сан немесе 0x00 … 0xFF болуы керек.` }; out.push(v); }
    if (!out.length) return { err: "Кемінде бір адрес жазыңыз." };
    if (out.length > 40) return { err: "Ең көбі 40 адрес." };
    return { trace: out };
  }
  const R = (n, f) => [...Array(n)].map((_, i) => f(i));
  const TRACES = {
    seq: { name: "Массивті ретімен оқу: int a[16]", tr: R(16, (i) => i * 4), note: "a[i] әр 4 байт сайын. Бір блокқа B / 4 элемент сыяды: біріншісі miss, қалғандары hit - кеңістіктік локальдылық." },
    stride: { name: "Қадаммен оқу (16 байт), екі рет", tr: R(16, (i) => (i % 8) * 16), note: "Әр қатынас жаңа блокқа түседі. 8 блок 64 байттық кэшке сыймайды - екінші айналым да miss (сыйымдылық). L = 8 етіп көріңіз." },
    row: { name: "int m[4][8]: жол бойынша (row-major)", tr: R(32, (i) => i * 4), note: "C-да m[r][c] адресі = r·32 + c·4. Жол бойынша аралау жадта ретімен жүреді - әр блок толық пайдаланылады." },
    col: { name: "int m[4][8]: баған бойынша (column-major)", tr: R(32, (i) => (i % 4) * 32 + Math.floor(i / 4) * 4), note: "Баған бойынша әр қадам 32 байт секіреді: бір блоктың 4 элементінен біреуі ғана қолданылып, блок ығыстырылады. Дәл сол есеп, циклдар орнын ауыстырғанда ғана - бірнеше есе баяу." },
    conflict: { name: "Қақтығыс: 0 мен 64 кезектесіп", tr: [0, 64, 0, 64, 0, 64, 4, 68], note: "B = 16, L = 4 тікелей сәйкестікте 0 мен 64 бір индекске (0) түседі де бірін-бірі ығыстырады. 2 жолды кэште екеуі бір жиында қатар тұрады." },
    custom: { name: "Өз тізбегім", tr: null, note: "Адрестерді бос орын не үтір арқылы жазыңыз (ондық не 0x...)." },
  };
  window.CSLabCPU = { split, simCache, TRACES };

  // ---------------------------------------------------------------- биттерді салу
  function bitsHTML(addr, cfg) {
    const p = split(addr, cfg), b = bin(addr, 8);
    const grp = (cls, s, lab) => (s.length ? `<div class="cc-grp ${cls}"><div>${[...s].map((x) => `<i>${x}</i>`).join("")}</div><small>${lab}</small></div>` : "");
    return grp("t", b.slice(0, p.tb), `<b>тег</b> ${p.tb} бит = ${p.tag}`) + grp("x", b.slice(p.tb, p.tb + p.ib), `<b>индекс</b> ${p.ib} бит = ${p.idx}`) + grp("o", b.slice(p.tb + p.ib), `ығысу ${p.ob} бит = ${p.off}`);
  }
  const bitsLabel = (addr, cfg) => { const p = split(addr, cfg); return `Адрес ${addr} екілікте ${bin(addr, 8)}: тег ${bin(p.tag, p.tb)} (${p.tag}), индекс ${bin(p.idx, p.ib)} (${p.idx}), ығысу ${bin(p.off, p.ob)} (${p.off})`; };

  // ---------------------------------------------------------------- 1-3. кэш зертханасы
  const root = document.querySelector("[data-cslab=cache]");
  if (root) (() => {
    const $ = (s) => root.querySelector(s);
    let cfg = { B: 16, L: 4, W: 1 }, tkey = "seq", trace = TRACES.seq.tr, run = null, predict = false, score = { ok: 0, n: 0 };
    const say = $(".cs-say"), ask = $(".cs-ask"), fb = $("[data-fb=pred]"), det = $("[data-k=steps]");
    A.initSteps(det);
    const P = A.player($(".cs-ctl"), {
      len: () => run.frames.length, draw, blocked: () => predict, ms: 1300,
      onNext: () => { if (pending()) T.feedback(fb, "info", "Болжамсыз көрсетілді", "Бұл қадам болжам есебіне кірмейді."); return false; },
      onReset: () => { fb.className = ""; fb.textContent = ""; },
    });
    const pending = () => predict && P.k < run.frames.length - 1;
    function readCfg() { cfg = { B: +$("[data-k=B]").value, L: +$("[data-k=L]").value, W: +$("[data-k=W]").value }; }
    function cfgText() { const p = split(0, cfg); return `Кэш: ${cfg.L} жол × ${cfg.B} байт = ${cfg.L * cfg.B} байт; ${cfg.W === 1 ? "тікелей сәйкестік" : "2 жолды ассоциативті (LRU)"}; жиын саны S = ${cfg.L} / ${cfg.W} = ${p.S}. Адрес 8 бит: ығысу log₂${cfg.B} = ${p.ob}, индекс log₂${p.S} = ${p.ib}, тег 8 − ${p.ob} − ${p.ib} = ${p.tb} бит.`; }
    function recompute() { P.stop(); run = simCache(trace, cfg); score = { ok: 0, n: 0 }; fb.className = ""; fb.textContent = ""; $("[data-k=cfgtext]").textContent = cfgText(); P.restart(); compare(); addrView(); }

    function draw(k) {
      const f = run.frames[k];
      const S = cfg.L / cfg.W;
      const lruOf = (s) => (cfg.W === 2 && s.every((w) => w.v) ? s.reduce((m, w, j) => (w.last < s[m].last ? j : m), 0) : -1);
      $("[data-k=cache]").innerHTML = `<thead><tr><th scope="col">Жиын</th>${R(cfg.W, (j) => `<th scope="col">${cfg.W === 1 ? "Жол" : j + "-жол"}</th>`).join("")}</tr></thead><tbody>` + f.sets.map((s, i) => `<tr class="${f.p && f.p.idx === i ? "ch" : ""}"><th scope="row">${i} <small>${bin(i, lg(S))}</small></th>` +
        s.map((w, j) => `<td class="way${f.p && f.p.idx === i && f.way === j ? (f.hit ? " hit" : " fill") : ""}">${w.v ? `тег ${w.tag}<small>блок ${blk(w.block, cfg.B)}${lruOf(s) === j ? " · LRU" : ""}</small>` : "бос"}</td>`).join("") + "</tr>").join("") + "</tbody>";
      $("[data-k=trace]").innerHTML = trace.map((a, i) => `<li class="${i === f.i ? "cur" : ""}${i < f.i + 1 ? (run.frames[i + 1].hit ? " h" : " m") : ""}">${a}${i <= f.i ? (run.frames[i + 1].hit ? " H" : " M") : ""}</li>`).join("");
      const n = f.i + 1;
      $("[data-k=stat]").innerHTML = `<span>Қатынас: <b>${n}</b> / ${trace.length}</span><span>Hit: <b>${f.hits}</b></span><span>Miss: <b>${f.miss}</b> (міндетті ${f.kinds.comp}, қақтығыс ${f.kinds.conf}, сыйымдылық ${f.kinds.cap})</span><span>Hit rate: <b>${n ? `${f.hits}/${n} = ${pct(f.hits / n)}` : "-"}</b></span>`;
      if (f.i >= 0) {
        $("[data-k=bits]").innerHTML = bitsHTML(f.addr, cfg); $("[data-k=bits]").setAttribute("aria-label", bitsLabel(f.addr, cfg));
        $("[data-k=res]").innerHTML = `<span class="cc-res ${f.hit ? "hit" : "miss"}">${f.hit ? "HIT" : "MISS"}</span>`;
      } else { $("[data-k=bits]").innerHTML = ""; $("[data-k=bits]").setAttribute("aria-label", "Әлі қатынас жоқ"); $("[data-k=res]").innerHTML = ""; }
      const msgs = run.frames.map((x, i) => (i === 0 ? `0-қадам. Кэш бос (барлық жол V = 0). ${cfgText()}` : `${i}-қадам. ${accessMsg(x, cfg, trace)}`));
      say.innerHTML = ""; const b = document.createElement("b"); b.textContent = `${k}-қадам. `; say.append(b, document.createTextNode(msgs[k].replace(/^\d+-қадам\. /, "")));
      if (k === run.frames.length - 1 && k > 0) say.append(document.createTextNode(` Барлығы: hit rate ${run.hits}/${trace.length} = ${pct(run.rate)}.`));
      A.stepList(det, msgs, k);
      ask.hidden = !pending();
      if (pending()) { const nx = run.frames[k + 1]; $("[data-k=askq]").textContent = `Келесі қатынас: адрес ${nx.addr} (${hex(nx.addr)}). Hit бола ма, miss па?`; }
      $(".cs-score").textContent = predict ? `Болжам: ${score.ok} / ${score.n} дұрыс` : "";
    }
    function explainPred(sayHit, nx, f) {
      const p = nx.p, tags = f.sets[p.idx].filter((w) => w.v).map((w) => w.tag);
      if (nx.hit) {
        if (nx.temporal) return [`Дұрысы: HIT`, `Дәл осы адрес ${nx.from + 1}-қатынаста қолданылып, блок әлі кэште: ${p.idx}-жиында тег ${p.tag} бар. Уақыттық локальдылық.`, "temporal"];
        return [`Дұрысы: HIT`, `Блок = ⌊${nx.addr} / ${cfg.B}⌋ = ${p.block}. Бұл блок ${blk(p.block, cfg.B)} ${nx.from + 1}-қатынаста (адрес ${trace[nx.from]}) толығымен жүктелген - тег пен индекс бірдей, тек ығысу басқа. Кэш байтты емес, БЛОКТЫ сақтайды.`, "same-block"];
      }
      const evBy = run.frames.slice(1, f.i + 2).filter((x) => x.ev && x.ev.block === p.block).pop();
      if (nx.kind === "comp") return [`Дұрысы: MISS`, `Блок ${blk(p.block, cfg.B)} бұрын ешқашан жүктелмеген - алғашқы қатынас әрқашан miss (міндетті).`, "compulsory"];
      if (evBy) return [`Дұрысы: MISS`, `Бұл блок бұрын кэште болған, бірақ ${evBy.i + 1}-қатынаста адрес ${evBy.addr} оны ығыстырды: индексі бірдей (${p.idx}), тегі басқа. Қазір ${p.idx}-жиында: тег ${tags.join(", ") || "бос"}.`, "evicted"];
      return [`Дұрысы: MISS`, `${p.idx}-жиында тег ${tags.join(", ") || "жоқ"}, ал керегі - ${p.tag}.`, "tag"];
    }
    root.querySelectorAll("[data-hm]").forEach((b) => b.addEventListener("click", () => {
      if (!pending()) return;
      const f = run.frames[P.k], nx = run.frames[P.k + 1], sayHit = b.dataset.hm === "h", ok = sayHit === nx.hit;
      score.n++; if (ok) score.ok++;
      if (ok) T.feedback(fb, "ok", `Дұрыс: ${nx.hit ? "HIT" : "MISS"}`, accessMsg(nx, cfg, trace));
      else { const [t, why] = explainPred(sayHit, nx, f); T.feedback(fb, "bad", t, why); }
      T.record("cs.cache.predict", { item: cfg.W === 1 ? "dm" : "2way", ok, error: ok ? "" : explainPred(sayHit, nx, f)[2], note: ok ? "" : explainPred(sayHit, nx, f)[1], title: "Кэш: hit не miss болжау" });
      P.go(P.k + 1);
    }));
    function compare() {
      const rows = Object.entries(TRACES).filter(([k]) => k !== "custom").map(([k, t]) => {
        const d = simCache(t.tr, { ...cfg, W: 1 }), w = simCache(t.tr, { ...cfg, W: 2 });
        return `<tr class="${k === tkey ? "cur" : ""}"><th scope="row">${t.name}</th><td>${d.hits}/${t.tr.length} = ${pct(d.rate)}</td><td>${w.hits}/${t.tr.length} = ${pct(w.rate)}</td></tr>`;
      });
      $("[data-k=cmp]").innerHTML = rows.join("");
      $("[data-k=cmpcap]").textContent = `${cfg.L} жол × ${cfg.B} байт кэш үшін hit rate`;
    }
    // адресті бөлшектеу
    function addrView() {
      const a = A.parseNum($("[data-k=addr]").value), host = $("[data-k=abits]");
      const v = /^0x/i.test($("[data-k=addr]").value.trim()) ? parseInt($("[data-k=addr]").value.trim(), 16) : a;
      if (!Number.isInteger(v) || v < 0 || v > 255) { host.innerHTML = ""; $("[data-k=amsg]").textContent = "0 … 255 аралығындағы адрес жазыңыз (ондық не 0x..)."; return; }
      const p = split(v, cfg);
      host.innerHTML = bitsHTML(v, cfg); host.setAttribute("aria-label", bitsLabel(v, cfg));
      $("[data-k=amsg]").textContent = `${v} = ${hex(v)} = ${bin(v, 8)}₂. Ығысу = ${v} mod ${cfg.B} = ${p.off}; блок = ⌊${v} / ${cfg.B}⌋ = ${p.block}; индекс = ${p.block} mod ${p.S} = ${p.idx}; тег = ⌊${p.block} / ${p.S}⌋ = ${p.tag}. Бұл адрес ${blk(p.block, cfg.B)} блогында.`;
    }
    $("[data-k=addr]").addEventListener("input", addrView);
    ["B", "L", "W"].forEach((k) => $(`[data-k=${k}]`).addEventListener("change", () => { readCfg(); recompute(); newQuiz(); }));
    $("[data-k=tsel]").innerHTML = Object.entries(TRACES).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join("");
    function setTrace(k) {
      tkey = k; $("[data-k=tsel]").value = k; $("[data-k=tnote]").textContent = TRACES[k].note; $(".cc-custom").hidden = k !== "custom";
      if (k !== "custom") { trace = TRACES[k].tr; $("[data-k=tin]").value = trace.join(" "); recompute(); }
    }
    $("[data-k=tsel]").addEventListener("change", (e) => setTrace(e.target.value));
    $("[data-c=tapply]").addEventListener("click", () => { const r = parseTrace($("[data-k=tin]").value); $("[data-k=tmsg]").textContent = r.err || `${r.trace.length} адрес жүктелді.`; if (!r.err) { trace = r.trace; recompute(); } });
    $("[data-k=predict]").addEventListener("change", (e) => { predict = e.target.checked; recompute(); if (predict) say.textContent = "Болжау режимі: әр қатынас алдында hit не miss екенін таңдаңыз."; });
    document.querySelectorAll("[data-demo]").forEach((b) => b.addEventListener("click", () => {
      const [k, B, L, W] = b.dataset.demo.split(":"); $("[data-k=B]").value = B; $("[data-k=L]").value = L; $("[data-k=W]").value = W; readCfg(); setTrace(k); newQuiz();
      document.getElementById("h-sim").scrollIntoView({ block: "start" });
    }));

    // адрес бойынша шағын тексеру
    const qz = document.querySelector("[data-cslab=cache-addr]");
    let QA = null, QH = null, qhelp = false;
    function newQuiz() {
      if (!qz) return;
      const a = A.rnd(256); QA = { a, cfg: { ...cfg }, p: split(a, cfg) }; qhelp = false;
      qz.querySelector("[data-k=qq]").textContent = `Адрес ${a} (${hex(a)}). ${cfg.L} жол × ${cfg.B} байт, ${cfg.W === 1 ? "тікелей сәйкестік" : "2 жолды ассоциативті"} кэште тег, индекс және ығысу қандай? (ондық сандармен)`;
      qz.querySelectorAll("input").forEach((i) => (i.value = ""));
      const f = qz.querySelector("[data-fb=addr]"); f.className = ""; f.textContent = "";
      const p = QA.p, b = bin(a, 8);
      QH = T.hints(qz.querySelector("[data-k=qhints]"), [
        `Адресті 8 биттік екілік санға аударыңыз. Оң жақтағы log₂B бит - ығысу, одан кейінгі log₂S бит - индекс (S = L / W - ЖИЫН саны, жол саны емес), қалғаны - тег.`,
        "Мысал: адрес 92 = 01011100₂, B = 8 (3 бит), S = 4 (2 бит): ығысу 100₂ = 4, индекс 11₂ = 3, тег 010₂ = 2. Тексеру: блок = ⌊92 / 8⌋ = 11, 11 mod 4 = 3, ⌊11 / 4⌋ = 2.",
        `${a} = ${b}₂. Ығысу (${p.ob} бит) ${bin(p.off, p.ob)}₂ = ${p.off}; индекс (${p.ib} бит) ${bin(p.idx, p.ib)}₂ = ${p.idx}; тег (${p.tb} бит) ${bin(p.tag, p.tb)}₂ = ${p.tag}. Жауап: тег ${p.tag}, индекс ${p.idx}, ығысу ${p.off}.`,
      ], { onSolution: () => { qhelp = true; T.feedback(qz.querySelector("[data-fb=addr]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. «Жаңа адрес» басып, келесісін көмексіз шығарыңыз."); } });
    }
    function checkQuiz() {
      const g = ["tag", "idx", "off"].map((k) => A.parseNum(qz.querySelector(`[data-k=${k}]`).value)), out = qz.querySelector("[data-fb=addr]");
      if (g.some((x) => !Number.isFinite(x))) { T.feedback(out, "info", "Үш сан керек", "Тег, индекс және ығысуды ондық сан етіп жазыңыз."); return; }
      const { a, p } = QA, c = QA.cfg, [tg, ix, of] = g;
      const ok = tg === p.tag && ix === p.idx && of === p.off;
      let t = "Дұрыс", why = `${a} = ${bin(a, 8)}₂ → тег ${p.tag}, индекс ${p.idx}, ығысу ${p.off}.`, code = "";
      if (!ok) {
        const pl = split(a, { ...c, W: 1 });
        if (of !== p.off) { t = "Ығысу қате"; code = "offset"; why = `Ығысу - блок ішіндегі байт нөмірі: адрес mod B = ${a} mod ${c.B} = ${p.off}, яғни соңғы ${p.ob} бит.`; }
        else if (c.W === 2 && tg === pl.tag && ix === pl.idx) { t = "Индекс жол санымен есептелді"; code = "sets"; why = `2 жолды кэште индекс ЖИЫНДЫ таңдайды: S = ${c.L} / 2 = ${p.S}, индекс ${p.ib} бит. Сіз ${c.L} жолды ${c.L} жиын деп алдыңыз.`; }
        else if (tg === p.idx && ix === p.tag) { t = "Тег пен индекс орны ауысты"; code = "swap"; why = `Индекс ығысудың дәл сол жағында тұрады (ортаңғы ${p.ib} бит), тег - ең сол жақтағы (жоғары) ${p.tb} бит.`; }
        else { t = ix !== p.idx ? "Индекс қате" : "Тег қате"; code = ix !== p.idx ? "index" : "tag"; why = `Блок = ⌊${a} / ${c.B}⌋ = ${p.block}; индекс = ${p.block} mod ${p.S} = ${p.idx}; тег = ⌊${p.block} / ${p.S}⌋ = ${p.tag}.`; }
      }
      const h = QH.used();
      T.feedback(out, ok ? "ok" : "bad", ok ? t + (h ? ` (${h} көмекпен)` : "") : t, why + (ok ? " «Жаңа адрес» - келесісі." : ""));
      T.record("cs.cache.addr", { item: "split", ok, hints: qhelp ? 3 : h, error: code, note: why, title: "Кэш: адресті тег/индекс/ығысуға бөлу" });
    }
    if (qz) {
      qz.querySelector("[data-c=qcheck]").addEventListener("click", checkQuiz);
      qz.querySelector("[data-c=qnew]").addEventListener("click", newQuiz);
      qz.querySelectorAll("input").forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") checkQuiz(); }));
    }
    readCfg(); setTrace("seq"); newQuiz();
  })();

  // ---------------------------------------------------------------- 4. конвейер
  const RTYPE = ["add", "sub", "and", "or"];
  const insText = (x) => (x.op === "lw" ? `lw  r${x.rd}, 0(r${x.rs})` : `${x.op.padEnd(3)} r${x.rd}, r${x.rs}, r${x.rt}`);
  const srcs = (x) => (x.op === "lw" ? [x.rs] : [x.rs, x.rt]);
  function pipe(prog, fwd) {
    const res = [];
    prog.forEach((ins, i) => {
      const ifF = i === 0 ? 1 : res[i - 1].idF, idF = i === 0 ? 2 : res[i - 1].ex;
      let ex = idF + 1; const deps = [];
      [...new Set(srcs(ins))].forEach((r) => {
        let j = -1; for (let k = i - 1; k >= 0; k--) if (prog[k].rd === r) { j = k; break; }
        if (j < 0) return;
        const need = fwd ? res[j].ex + (prog[j].op === "lw" ? 2 : 1) : res[j].ex + 3;
        deps.push({ r, j, need }); if (need > ex) ex = need;
      });
      deps.forEach((d) => { const gap = ex - res[d.j].ex; d.path = !fwd || gap >= 3 ? "reg" : gap === 1 ? "EX/MEM" : "MEM/WB"; });
      res.push({ ifF, idF, ex, mem: ex + 1, wb: ex + 2, stalls: ex - idF - 1, deps });
    });
    const total = res.length ? res[res.length - 1].wb : 0;
    return { res, total, stalls: res.reduce((s, x) => s + x.stalls, 0) };
  }
  function stageAt(x, c) {
    if (c >= x.ifF && c < x.idF) return [c === x.ifF ? "IF" : "IF", c > x.ifF];
    if (c >= x.idF && c < x.ex) return [c === x.idF ? "ID" : "stall", c > x.idF];
    if (c === x.ex) return ["EX", false]; if (c === x.mem) return ["MEM", false]; if (c === x.wb) return ["WB", false];
    return ["", false];
  }
  const PROGS = {
    loaduse: { name: "Load-use қаупі", prog: [{ op: "lw", rd: 1, rs: 2 }, { op: "add", rd: 3, rs: 1, rt: 4 }, { op: "sub", rd: 5, rs: 3, rt: 6 }, { op: "and", rd: 7, rs: 5, rt: 1 }] },
    alu: { name: "ALU тізбегі", prog: [{ op: "add", rd: 1, rs: 2, rt: 3 }, { op: "sub", rd: 4, rs: 1, rt: 5 }, { op: "and", rd: 6, rs: 4, rt: 1 }, { op: "or", rd: 7, rs: 2, rt: 3 }] },
    indep: { name: "Тәуелсіз командалар", prog: [{ op: "add", rd: 1, rs: 2, rt: 3 }, { op: "sub", rd: 4, rs: 5, rt: 6 }, { op: "and", rd: 7, rs: 8, rt: 9 }, { op: "or", rd: 10, rs: 1, rt: 4 }] },
  };
  window.CSLabCPU.pipe = pipe;
  const pipeSec = document.querySelector("[data-cslab=pipe]");
  if (pipeSec) (() => {
    const $ = (s) => pipeSec.querySelector(s);
    let prog = PROGS.loaduse.prog, fwd = false, S = null;
    const say = $(".cs-say"), det = $("[data-k=steps]");
    A.initSteps(det);
    const P = A.player($(".cs-ctl"), { len: () => S.total + 1, draw, ms: 1100 });
    function cycleMsg(c) {
      if (c === 0) return `0-цикл. Бағдарлама ${prog.length} командадан тұрады. ${fwd ? "Форвардинг қосулы." : "Форвардинг өшірулі: мән тек тіркеу файлы арқылы беріледі."} Идеалда ${prog.length} команда ${prog.length + 4} циклда бітеді.`;
      const parts = [];
      S.res.forEach((x, i) => {
        const [st] = stageAt(x, c); if (!st) return;
        if (st === "stall") { const d = x.deps.filter((q) => q.need > c).map((q) => `r${q.r} (${q.j + 1}-команда, ${prog[q.j].op})`); parts.push(`${i + 1}-команда ID-да күтеді (тоқтау): ${d.join(", ")} мәні әлі дайын емес`); }
        else if (st === "EX" && x.deps.length) parts.push(`${i + 1}-команда EX: ` + x.deps.map((q) => `r${q.r} ← ${q.j + 1}-командадан ${q.path === "reg" ? "тіркеу файлы арқылы (WB жазады, ID оқиды)" : q.path + " → EX форвардингі"}`).join("; "));
        else parts.push(`${i + 1}-команда ${st}${st === "IF" && c > x.ifF ? " (алдыңғы команда тұрып қалғандықтан IF-те күтеді)" : ""}`);
      });
      return `${c}-цикл. ` + parts.join(". ") + "." + (c === S.total ? ` Бітті: барлығы ${S.total} цикл, тоқтау ${S.stalls}.` : "");
    }
    function draw(k) {
      const cols = R(S.total, (c) => c + 1);
      $("[data-k=grid]").innerHTML = `<caption class="cs-small">Жол - команда, баған - такт (цикл). «stall» - ID сатысындағы тоқтау; жасыл асты сызық - форвардинг алған EX</caption><thead><tr><th scope="col">Команда</th>${cols.map((c) => `<th scope="col" class="${c === k ? "now" : ""}">${c}</th>`).join("")}</tr></thead><tbody>` +
        S.res.map((x, i) => `<tr><th scope="row">${i + 1}. ${insText(prog[i])}</th>${cols.map((c) => { if (c > k) return "<td></td>"; const [st, stl] = stageAt(x, c); const fw = st === "EX" && x.deps.some((q) => q.path !== "reg"); return `<td class="${stl ? "st" : ""}${fw ? " fw" : ""}${c === k ? " now" : ""}">${st}</td>`; }).join("")}</tr>`).join("") + "</tbody>";
      say.innerHTML = ""; const b = document.createElement("b"); const m = cycleMsg(k); b.textContent = m.match(/^\d+-цикл\. /)[0]; say.append(b, document.createTextNode(m.replace(/^\d+-цикл\. /, "")));
      $("[data-k=pstat]").innerHTML = `<span>Барлығы: <b>${S.total}</b> цикл</span><span>Тоқтау: <b>${S.stalls}</b></span><span>CPI ≈ <b>${A.num(S.total / prog.length, 2)}</b> (толтыруды қоса)</span>`;
      A.stepList(det, R(S.total + 1, cycleMsg), k);
    }
    function recompute() { P.stop(); S = pipe(prog, fwd); $("[data-k=asm]").textContent = prog.map((x, i) => `${i + 1}. ${insText(x)}`).join("\n"); P.restart(); }
    $("[data-k=psel]").innerHTML = Object.entries(PROGS).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join("");
    $("[data-k=psel]").addEventListener("change", (e) => { prog = PROGS[e.target.value].prog; recompute(); });
    $("[data-k=fwd]").addEventListener("change", (e) => { fwd = e.target.checked; recompute(); });
    recompute();

    // конвейер тапсырмасы
    const pt = document.querySelector("[data-cslab=pipe-task]");
    if (!pt) return;
    let Z = null, HN = null, helped = false;
    function gen() {
      for (let g = 0; g < 500; g++) {
        const pr = [], f = Math.random() < 0.5;
        for (let i = 0; i < 4; i++) {
          const pickSrc = () => (i > 0 && Math.random() < 0.6 ? pr[A.rnd(i)].rd : 1 + A.rnd(6));
          if (Math.random() < 0.35) pr.push({ op: "lw", rd: 1 + A.rnd(6), rs: pickSrc() });
          else pr.push({ op: A.pick(RTYPE), rd: 1 + A.rnd(6), rs: pickSrc(), rt: pickSrc() });
        }
        const a = pipe(pr, f), b = pipe(pr, !f);
        if (a.total !== b.total && a.total !== pr.length + 4 && new Set(pr.map((x) => x.rd)).size >= 3) return { prog: pr, fwd: f, S: a, other: b };
      }
    }
    function newP() {
      Z = gen(); helped = false;
      pt.querySelector("[data-k=pasm]").textContent = Z.prog.map((x, i) => `${i + 1}. ${insText(x)}`).join("\n");
      pt.querySelector("[data-k=pq]").textContent = `Форвардинг ${Z.fwd ? "ҚОСУЛЫ" : "ӨШІРУЛІ"}. Соңғы команданың WB сатысы нешінші циклда болады (бағдарлама неше циклда аяқталады)?`;
      pt.querySelector("[data-k=pans]").value = "";
      const out = pt.querySelector("[data-fb=pipe]"); out.className = ""; out.textContent = "";
      HN = T.hints(pt.querySelector("[data-k=phints]"), [
        `Әр команданың EX циклын табыңыз. Әдепкі: EX(i) = EX(i − 1) + 1, бірінші команда EX = 3. Егер i команда j-нің нәтижесін оқыса: ${Z.fwd ? "ALU → EX(i) ≥ EX(j) + 1, lw → EX(i) ≥ EX(j) + 2" : "EX(i) ≥ EX(j) + 3 (мән тек WB арқылы)"}. Тек ең жақын жазған j маңызды. Соңғы WB = соңғы EX + 2.`,
        "Мысал (форвардингсіз): 1) add r1, r2, r3 EX = 3; 2) sub r4, r1, r5 r1-ді оқиды: EX ≥ 3 + 3 = 6 (2 тоқтау); 3) or r6, r7, r8 тәуелсіз: EX = 7. Соңғы WB = 7 + 2 = 9.",
        "Шешім: " + Z.S.res.map((x, i) => `${i + 1}) EX = ${x.ex}` + (x.deps.length ? ` (${x.deps.map((d) => `r${d.r} ← ${d.j + 1}: ≥ ${d.need}`).join(", ")})` : "") + (x.stalls ? `, тоқтау ${x.stalls}` : "")).join("; ") + `. Соңғы WB = ${Z.S.res[3].ex} + 2 = ${Z.S.total}. Жауап: ${Z.S.total}.`,
      ], { onSolution: () => { helped = true; T.feedback(pt.querySelector("[data-fb=pipe]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. «Жаңа бағдарлама» басып, келесісін көмексіз шығарыңыз."); } });
    }
    function checkP() {
      const a = A.parseNum(pt.querySelector("[data-k=pans]").value), out = pt.querySelector("[data-fb=pipe]");
      if (!Number.isFinite(a)) { T.feedback(out, "info", "Жауап бос", "Бір бүтін сан жазыңыз - циклдар саны."); return; }
      const { S: s, other, fwd: f, prog: pr } = Z, ok = a === s.total;
      let t = "Дұрыс", why = `${pr.length} команда + 4 толтыру циклы + ${s.stalls} тоқтау = ${s.total}.`, code = "";
      if (!ok) {
        if (a === pr.length + 4 && a !== other.total) { t = "Қауіптер ескерілмеді"; code = "no-hazard"; why = `${pr.length + 4} - тәуелділік жоқ кездегі идеал. Мұнда RAW тәуелділік бар: ${s.res.flatMap((x, i) => x.deps.map((d) => `${i + 1}-команда r${d.r}-ді ${d.j + 1}-командадан оқиды`)).join("; ")}.`; }
        else if (a === other.total) { t = f ? "Бұл форвардингсіз жауап" : "Бұл форвардингпен жауап"; code = "fwd"; why = f ? "Форвардинг қосулы: ALU нәтижесі келесі команданың EX-іне бірден беріледі (EX/MEM → EX), тоқтау тек lw-дан кейін (load-use, 1 цикл)." : "Форвардинг ӨШІРУЛІ: мәнді тек WB тіркеу файлына жазғаннан кейін ID оқиды, сондықтан тәуелді команда EX(j) + 3-тен ерте EX-ке кіре алмайды."; }
        else if (a === s.stalls) { t = "Бұл тек тоқтау саны"; code = "stalls"; why = `Тоқтау ${s.stalls}, бірақ сұрақ - жалпы цикл саны: ${pr.length} + 4 + ${s.stalls}.`; }
        else if (f && a === pipe(pr.map((x) => ({ ...x, op: x.op === "lw" ? "add" : x.op })), true).total) { t = "Load-use тоқтауы ұмытылды"; code = "load-use"; why = "Форвардингпен де lw нәтижесі тек MEM сатысынан кейін дайын: оны бірден келесі команда пайдаланса, 1 цикл тоқтау міндетті."; }
        else { t = "Циклдар саны қате"; code = "count"; why = "Әр команданың EX циклын ретімен есептеңіз (көмектің 1-деңгейіндегі ереже), соңғы WB = соңғы EX + 2."; }
      }
      const h = HN.used();
      T.feedback(out, ok ? "ok" : "bad", ok ? t + (h ? ` (${h} көмекпен)` : "") : t, why + (ok ? " «Жаңа бағдарлама» - келесісі." : ""));
      T.record("cs.pipeline", { item: f ? "fwd" : "nofwd", ok, hints: helped ? 3 : h, error: code, note: why, title: "Конвейер: циклдар саны" });
    }
    pt.querySelector("[data-c=pcheck]").addEventListener("click", checkP);
    pt.querySelector("[data-c=pnew]").addEventListener("click", newP);
    pt.querySelector("[data-k=pans]").addEventListener("keydown", (e) => { if (e.key === "Enter") checkP(); });
    pt.querySelector("[data-c=pload]").addEventListener("click", () => { prog = Z.prog; fwd = false; $("[data-k=fwd]").checked = false; recompute(); document.getElementById("h-pipe").scrollIntoView({ block: "start" }); });
    newP();
  })();

  // ---------------------------------------------------------------- 5. қорытынды тапсырма: кэш трассасы
  const task = document.querySelector("[data-cslab=cache-task]");
  if (task) (() => {
    const tq = (s) => task.querySelector(s);
    let Z = null, HN = null, helped = false;
    function gen() {
      for (let g = 0; g < 4000; g++) {
        const B = A.pick([4, 8, 16]), W = A.pick([1, 2]), cfg = { B, L: 4, W }, nb = 256 / B;
        const b1 = A.rnd(nb), b2 = (b1 + 4 * (1 + A.rnd(3))) % nb, b3 = A.rnd(nb), b4 = (b1 + 2) % nb;
        const blocks = [b1, b2, b3, b4];
        const tr = R(8, () => { const b = A.pick(blocks); return b * B + 4 * A.rnd(B / 4); });
        const s = simCache(tr, cfg);
        if (s.hits < 2 || s.miss < 3) continue;
        const str = s.res.join("");
        if (simCache(tr, { ...cfg, W: 3 - W }).res.join("") === str) continue;
        if (simCache(tr, cfg, { exact: true }).res.join("") === str) continue;
        if (new Set(tr).size < 5) continue;
        return { tr, cfg, s };
      }
    }
    function newTask() {
      Z = gen(); helped = false;
      const { tr, cfg } = Z, S = cfg.L / cfg.W;
      tq("[data-k=q]").textContent = `Кэш: ${cfg.L} жол × ${cfg.B} байт, ${cfg.W === 1 ? "тікелей сәйкестік" : "2 жолды жиынды-ассоциативті, LRU"} (жиын саны ${S}), басында бос. Адрестер (8 бит): ${tr.join(", ")}. Әр қатынасты H (hit) не M (miss) деп белгілеп, hit rate-ті табыңыз.`;
      tq("[data-k=cls]").value = ""; tq("[data-k=rate]").value = "";
      tq("[data-fb=task]").className = ""; tq("[data-fb=task]").textContent = "";
      HN = T.hints(tq("[data-k=hints]"), hintList(), { onSolution: () => { helped = true; T.feedback(tq("[data-fb=task]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. «Жаңа есеп» басып, келесісін көмексіз шығарыңыз."); } });
    }
    function hintList() {
      const { tr, cfg, s } = Z, S = cfg.L / cfg.W;
      return [
        `Әр адрес үшін блок = ⌊адрес / ${cfg.B}⌋, индекс = блок mod ${S}, тег = ⌊блок / ${S}⌋. Кесте сызыңыз: ${S} жиын × ${cfg.W} жол. Тег жиында болса - H; болмаса - M, тегті жазыңыз${cfg.W === 2 ? " (жиын толы болса, ең ұзақ қолданылмағанын ығыстырыңыз)" : " (бұрынғысын ығыстырып)"}. Hit rate = H саны / барлық қатынас.`,
        "Мысал: B = 16, 4 жол, тікелей. 0 → блок 0, индекс 0: M. 8 → блок 0 (сол блок!): H. 64 → блок 4, индекс 0, тег 1: M, тег 0 ығыстырылды. 0 → индекс 0-де тег 1: M. Нәтиже M H M M, hit rate 1/4 = 25%.",
        "Шешім: " + s.frames.slice(1).map((f, i) => `${i + 1}) ${tr[i]}: блок ${f.p.block}, индекс ${f.p.idx}, тег ${f.p.tag} → ${f.hit ? "H" : "M"}${f.ev ? ` (тег ${f.ev.tag} ығыстырылды)` : ""}`).join("; ") + `. Жауап: ${s.res.join(" ")}; ${s.hits}/${tr.length} = ${pct(s.rate)}.`,
      ];
    }
    function parseRate(str) {
      const t = String(str).trim().replace(/\s/g, "").replace(",", ".");
      let m = t.match(/^(\d+)\/(\d+)$/); if (m && +m[2] > 0) return +m[1] / +m[2];
      m = t.match(/^(\d+(?:\.\d+)?)%$/); if (m) return +m[1] / 100;
      m = t.match(/^\d+(?:\.\d+)?$/); if (m) { const v = +t; return v > 1 ? v / 100 : v; }
      return NaN;
    }
    function check() {
      const { tr, cfg, s } = Z, out = tq("[data-fb=task]");
      const cls = (tq("[data-k=cls]").value.toUpperCase().match(/[HM]/g) || []), rate = parseRate(tq("[data-k=rate]").value);
      if (cls.length !== tr.length || !Number.isFinite(rate)) { T.feedback(out, "info", "Жауап толық емес", `${tr.length} әріп (H не M) және hit rate (мысалы 3/8, 37,5% не 0,375) керек. Қазір ${cls.length} әріп.`); return; }
      const got = cls.join(""), want = s.res.join("");
      let t = "", why = "", code = "";
      const clsOk = got === want;
      if (!clsOk) {
        if (simCache(tr, { ...cfg, W: 3 - cfg.W }).res.join("") === got) { code = "assoc"; t = cfg.W === 1 ? "Бұл 2 жолды кэштің жауабы" : "Бұл тікелей сәйкестік кэштің жауабы"; why = cfg.W === 1 ? `Тікелей сәйкестікте әр жиында бір ғана жол: индексі бірдей екі блок бірін-бірі ығыстырады. Жиын саны ${cfg.L}, индекс ${lg(cfg.L)} бит.` : `2 жолды кэште жиын саны ${cfg.L / 2} (индекс ${lg(cfg.L / 2)} бит) және әр жиында екі блок сыяды - индексі бірдей екі блок қатар тұра алады.`; }
        else if (simCache(tr, cfg, { exact: true }).res.join("") === got) { code = "same-block"; t = "Бір блоктағы көрші адрес - HIT"; why = `Кэш жеке байтты емес, ${cfg.B} байттық блокты жүктейді. Мысалы, ${tr.find((a, i) => s.res[i] === "H" && !tr.slice(0, i).includes(a))} адресінің блогы бұрынғы қатынаспен бірге жүктелген, сондықтан ол HIT.`; }
        else if (simCache(tr, cfg, { inf: true }).res.join("") === got) { code = "conflict"; t = "Ығыстыру ескерілмеді"; why = "Әр блок кэште мәңгі қалатындай белгіледіңіз. Бірақ индексі бірдей, тегі басқа блок келгенде жиын толы болса, ескі блок шығарылады - кейінгі қатынасы MISS."; }
        else if (cfg.W === 2 && simCache(tr, cfg, { fifo: true }).res.join("") === got) { code = "lru"; t = "FIFO емес, LRU"; why = "Ең ЕРТЕ жүктелгенді емес, ең ұзақ ҚОЛДАНЫЛМАҒАНДЫ ығыстыру керек: hit болған блок «жаңарады»."; }
        else { const i = [...got].findIndex((x, j) => x !== want[j]); code = "trace"; t = `${i + 1}-қатынас қате`; why = `Алғашқы ${i} белгі дұрыс. ` + accessMsg(s.frames[i + 1], cfg, tr); }
      }
      const rateOk = Math.abs(rate - s.rate) < 0.0051;
      let rwhy = "";
      if (!rateOk) {
        const own = cls.filter((x) => x === "H").length / tr.length;
        if (Math.abs(rate - s.miss / tr.length) < 0.0051) { code = code || "miss-rate"; rwhy = `Бұл miss rate (${s.miss}/${tr.length}). Hit rate = hit саны / барлық қатынас = ${s.hits}/${tr.length}.`; }
        else if (!clsOk && Math.abs(rate - own) < 0.0051) rwhy = "Hit rate өз белгілеріңізбен сәйкес есептелген - алдымен белгілерді түзетіңіз.";
        else { code = code || "rate"; rwhy = `Hit rate = H саны / ${tr.length}.`; }
      }
      const ok = clsOk && rateOk, h = HN.used();
      if (ok) T.feedback(out, "ok", "Дұрыс" + (h ? ` (${h} көмекпен)` : ""), `${want.split("").join(" ")}; hit rate ${s.hits}/${tr.length} = ${pct(s.rate)}. «Жаңа есеп» - келесі трасса.`);
      else T.feedback(out, "bad", clsOk ? "Белгілер дұрыс, hit rate қате" : t, (clsOk ? "" : why + " ") + rwhy);
      T.record("cs.cache", { item: cfg.W === 1 ? "dm" : "2way", ok, hints: helped ? 3 : h, error: ok ? "" : code, note: ok ? "" : why + " " + rwhy, title: "Кэш: трассаны жіктеу және hit rate" });
    }
    tq("[data-c=check]").addEventListener("click", check);
    task.querySelectorAll("input").forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); }));
    tq("[data-c=new]").addEventListener("click", newTask);
    newTask();
  })();
  document.querySelectorAll("[data-badge]").forEach((el) => T.badge(el, el.dataset.badge, el.dataset.title));
})();
