/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Percentages зертханасы: бағаналы модель (bar model). Пайыздық өзгеріс (бастапқы мәнге қатысты), қатарынан пайыздар
   (қадамдық ойнатқыш: +20% сосын −20% ≠ 0), кері пайыз (өзгерістен кейінгі мәннен бастапқыны табу). */
(() => {
  "use strict";
  const { svg, num, rnd, pick } = window.SAT;
  const M = window.SATM, T = window.AO17Tutor;
  const $ = (id) => document.getElementById(id);
  const root = $("pc-svg");
  if (!root || !M) return;
  const SKILL = "sat.math.percent", TITLE = "SAT Percentages: пайыздық өзгеріс";
  root.setAttribute("viewBox", "0 0 400 260");
  const money = (v) => num(M.round(v, 2)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const pct = (v) => (v > 0 ? "+" : "") + num(M.round(v, 2)) + "%";
  const st = { tab: "succ", step: 3, V: 100000, p1: 20, p2: -20, old: 40, nw: 52, F: 18000, p: -25 };

  function bars(rows, maxPct) {
    while (root.lastChild && root.lastChild.tagName !== "title") root.lastChild.remove();
    const W = 330 / Math.max(100, maxPct), x0 = 12;
    rows.forEach((r, i) => {
      const y = 18 + i * 60;
      svg("text", { class: "sm-t", x: x0, y, "text-anchor": "start" }, root).textContent = r.label;
      const g = svg("g", { class: "sm-anim" }, root);
      svg("rect", { class: "sm-bar " + (r.cls || ""), x: x0, y: y + 8, width: Math.max(2, r.pct * W), height: 26, rx: 4 }, g);
      if (r.seg) svg("rect", { class: "sm-bar " + r.seg.cls, x: x0 + r.seg.from * W, y: y + 8, width: Math.max(2, Math.abs(r.seg.len) * W), height: 26, rx: 4 }, g);
      for (let k = 10; k < r.pct - 0.01; k += 10) svg("line", { class: "lb-grid", x1: x0 + k * W, y1: y + 8, x2: x0 + k * W, y2: y + 34 }, g);
      const t = svg("text", { class: "sm-t g", x: Math.min(388, x0 + r.pct * W + 6), y: y + 26, "text-anchor": r.pct * W > 250 ? "end" : "start" }, root);
      if (r.pct * W > 250) t.setAttribute("x", x0 + r.pct * W - 6), t.setAttribute("class", "sm-t");
      t.textContent = r.text;
    });
    svg("line", { class: "sm-dash", x1: 12 + 100 * W, y1: 4, x2: 12 + 100 * W, y2: 256 }, root);
    svg("text", { class: "sb-tick", x: 12 + 100 * W + 4, y: 254 }, root).textContent = "100% (бастапқы)";
  }
  const read = (items) => { const ul = $("pc-read"); ul.innerHTML = ""; items.forEach(([k, v, hot]) => { const li = document.createElement("li"); if (hot) li.className = "hot"; li.append(k); const b = document.createElement("b"); b.textContent = v; li.append(b); ul.append(li); }); };

  const SNAMES = ["Бастапқы баға", "1-өзгеріс", "2-өзгеріс жаңа бағадан", "Бастапқымен салыстыру"];
  function draw() {
    const t = $("pc-svg-t");
    if (st.tab === "succ") {
      const { V, p1, p2, step } = st, a = 100 + p1, b = (a * (100 + p2)) / 100, v1 = (V * a) / 100, v2 = (V * b) / 100;
      const rows = [{ label: "бастапқы", pct: 100, text: money(V) }];
      if (step >= 1) rows.push({ label: `${pct(p1)} → ×${num(M.round(a / 100, 4))}`, pct: a, cls: p1 >= 0 ? "m" : "r", text: money(v1), seg: p1 >= 0 ? { from: 100, len: p1, cls: "g" } : null });
      if (step >= 2) rows.push({ label: `${pct(p2)} жаңа бағадан → ×${num(M.round((100 + p2) / 100, 4))}`, pct: b, cls: p2 >= 0 ? "m" : "r", text: money(v2), seg: p2 >= 0 ? { from: a, len: (a * p2) / 100, cls: "g" } : null });
      if (step >= 3) rows.push({ label: `қорытынды: ×${num(M.round(b / 100, 4))} = ${pct(b - 100)}`, pct: b, cls: "g", text: money(v2) });
      bars(rows, Math.max(100, a, b));
      read([["1-қадам", `${money(V)} × ${num(M.round(a / 100, 4))} = ${money(v1)}`], ["2-қадам", `${money(v1)} × ${num(M.round((100 + p2) / 100, 4))} = ${money(v2)}`], ["жалпы көбейткіш", `${num(M.round(a / 100, 4))} × ${num(M.round((100 + p2) / 100, 4))} = ${num(M.round(b / 100, 4))}`, true], ["жалпы өзгеріс", pct(b - 100), true]]);
      $("pc-note").textContent = p1 === -p2 && p1 !== 0 ? `Қақпан: ${pct(p1)} пен ${pct(p2)} бір-бірін жоймайды! ${p2 < 0 ? "Азаю" : "Өсу"} үлкенірек/кішірек ЖАҢА бағадан есептеледі: соңында ${pct(b - 100)}.` : `Пайыздар қосылмайды: ${pct(p1)} + ${pct(p2)} = ${pct(p1 + p2)} емес, ${pct(b - 100)}. Көбейткіштер көбейтіледі.`;
      t.textContent = `Бағаналы модель: ${money(V)}, ${pct(p1)}, сосын ${pct(p2)} → ${money(v2)} (${pct(b - 100)}).`;
    } else if (st.tab === "chg") {
      const { old, nw } = st, ch = ((nw - old) / old) * 100, r = (nw / old) * 100;
      bars([{ label: "ескі мән", pct: 100, text: money(old) }, { label: "жаңа мән", pct: r, cls: nw >= old ? "m" : "r", text: money(nw), seg: nw >= old ? { from: 100, len: r - 100, cls: "g" } : null }, { label: `айырма ${money(nw - old)} / ескі ${money(old)}`, pct: Math.abs(ch), cls: "g", text: pct(ch) }], Math.max(100, r));
      read([["айырма", money(nw - old)], ["өзгеріс = айырма / ЕСКІ", pct(ch), true], ["жаңа / ескі", num(M.round(nw / old, 4))], ["айырма / жаңа (қақпан)", pct(((nw - old) / nw) * 100)]]);
      $("pc-note").textContent = `Пайыздық өзгеріс әрдайым БАСТАПҚЫ (ескі) мәнге бөлінеді: (${money(nw)} − ${money(old)}) / ${money(old)} = ${pct(ch)}. Жаңа мәнге бөлсең ${pct(((nw - old) / nw) * 100)} шығады - бұл SAT-тағы қақпан нұсқа.`;
      t.textContent = `Ескі ${money(old)}, жаңа ${money(nw)}: өзгеріс ${pct(ch)}.`;
    } else {
      const { F, p } = st, o = F / (1 + p / 100);
      bars([{ label: `өзгерістен кейін: ${100 + p}%`, pct: 100 + p, cls: p >= 0 ? "m" : "r", text: money(F) }, { label: "бастапқы: 100%", pct: 100, cls: "g", text: money(o) }, { label: `1% = ${money(F)} / ${100 + p}`, pct: 1, cls: "g", text: money(o / 100) }], Math.max(100, 100 + p));
      read([["соңғы мән", `${money(F)} = ${100 + p}%`], ["1% (бір бөлік)", money(o / 100)], ["бастапқы = соңғы / " + num((100 + p) / 100), money(o), true], ["қақпан: соңғы × " + num((100 - p) / 100), money((F * (100 - p)) / 100)]]);
      $("pc-note").textContent = `Кері пайыз: соңғы мән - бастапқының ${100 + p}%-ы, сондықтан ${money(F)} / ${num((100 + p) / 100)} = ${money(o)}. ${p < 0 ? `${money(F)}-ге ${-p}% қосу (× ${num((100 - p) / 100)}) басқа сан береді - ${-p}% соңғы мәннен емес, бастапқыдан алынған.` : ""}`;
      t.textContent = `Кері пайыз: ${money(F)} - бастапқының ${100 + p}%-ы, бастапқы ${money(o)}.`;
    }
  }

  /* ---------- басқару ---------- */
  const bind = (id, key, out) => { const e = $(id); e.addEventListener("input", () => { const v = M.parse(e.value); if (v === null || (["V", "old", "F"].includes(key) && v <= 0)) return; st[key] = v; if (out) $(out).textContent = pct(v); draw(); }); };
  bind("pc-V", "V"); bind("pc-p1", "p1", "pc-p1v"); bind("pc-p2", "p2", "pc-p2v"); bind("pc-old", "old"); bind("pc-new", "nw"); bind("pc-F", "F"); bind("pc-p", "p", "pc-pv");
  const PANES = { succ: "pc-p-succ", chg: "pc-p-chg", rev: "pc-p-rev" };
  const tabsCtl = M.tabs($("pc-tabs"), [["succ", "Қатарынан пайыздар"], ["chg", "Пайыздық өзгеріс"], ["rev", "Кері пайыз"]], (id) => { st.tab = id; Object.entries(PANES).forEach(([k, e]) => ($(e).hidden = k !== id)); draw(); });
  const stp = M.stepper($("pc-step"), { n: 4, names: SNAMES, show: (i) => { st.step = i; if (st.tab === "succ") draw(); } });

  /* ---------- болжам ---------- */
  const ctl = () => document.querySelectorAll("#pc-tabs button, #pc-ctl input, #pc-step button, #pc-step select");
  const lock = (on) => { ctl().forEach((e) => (e.disabled = on)); $("pc-lock").hidden = !on; };
  tabsCtl.sel("succ"); stp.go(0); lock(true);
  M.predict($("pc-predict"), {
    q: "Тауардың бағасы 20%-ға өсті, кейін жаңа бағасы 20%-ға төмендеді. Соңғы баға бастапқымен салыстырғанда қандай?",
    opts: [
      { id: "same", t: "Бастапқымен бірдей", title: "Бұл - SAT-тың классикалық қақпаны.", why: "+20% пен −20% бір-бірін жоймайды: −20% үлкейген (120%) бағадан алынады. 1.2 × 0.8 = 0.96 - баға 4%-ға арзандады. Қадамдап көр." },
      { id: "less4", t: "4%-ға арзан", ok: true, why: "1.2 × 0.8 = 0.96, яғни бастапқының 96%-ы - 4%-ға кем. Азаю 120%-дан есептелгендіктен, ол өсімнен үлкен (24 > 20)." },
      { id: "more4", t: "4%-ға қымбат", why: "Керісінше: −20% үлкенірек бағадан алынады (120-ның 20%-ы = 24), ал өсім тек 20 болды. 100 → 120 → 96." },
      { id: "less40", t: "40%-ға арзан", why: "Пайыздар қосылмайды да, азаймайды да - көбейткіштер көбейтіледі: 1.2 × 0.8 = 0.96, яғни −4%." },
    ],
    onDone: () => { lock(false); Object.assign(st, { V: 100000, p1: 20, p2: -20 }); $("pc-V").value = 100000; $("pc-p1").value = 20; $("pc-p2").value = -20; $("pc-p1v").textContent = "+20%"; $("pc-p2v").textContent = "−20%"; stp.go(0); window.SAT.focus($("pc-step").querySelector("button")); },
  });

  /* ---------- 1-тапсырма: кері пайыз ---------- */
  T.badge($("pc-badge"), SKILL, TITLE);
  function diagRev(x, F, p) {
    const o = F / (1 + p / 100);
    if (M.near(x, o, 1e-6)) return { ok: true, why: `${money(F)} - бастапқының ${100 + p}%-ы: ${money(F)} / ${num((100 + p) / 100)} = ${money(o)}. Тексеру: ${money(o)} × ${num((100 + p) / 100)} = ${money(F)}.` };
    if (M.near(x, (F * (100 - p)) / 100, 1e-6)) return { code: "reverse-apply", why: `${money(F)}-ге ${Math.abs(p)}%-ды кері қолдандың (× ${num((100 - p) / 100)}). Бірақ ${Math.abs(p)}% соңғы бағадан емес, БАСТАПҚЫ бағадан есептелген. Соңғы баға = бастапқы × ${num((100 + p) / 100)}, сондықтан бөлу керек.` };
    if (M.near(x, (F * (100 + p)) / 100, 1e-6)) return { code: "applied-again", why: `Өзгеріс тағы бір рет қолданылды (× ${num((100 + p) / 100)}). Сұрақ өзгеріске ДЕЙІНГІ бағаны сұрайды.` };
    if (M.near(x, F - p, 1e-6) || M.near(x, F + p, 1e-6)) return { code: "percent-as-number", why: "Пайыз сан ретінде қосылды/шегерілді. Пайыз - үлес: бастапқының 100%-ы." };
    return { code: "calc", why: `Теңдеу құр: бастапқы × ${num((100 + p) / 100)} = ${money(F)}.` };
  }
  M.task({ el: $("t1"), skill: SKILL, title: TITLE, once: true,
    gen: () => ({ item: "reverse 18000 -25", text: "Жеңілдіктен кейін 25%-ға арзандаған куртка 18 000 теңге тұрады. Оның бастапқы бағасы қанша теңге?", fields: [{ key: "x", label: "бастапқы баға, ₸" }],
      check: ({ x }) => diagRev(x, 18000, -25),
      hints: ["18 000 - бастапқы бағаның қанша пайызы? (100% − 25%)", "Ұқсас мысал: 20% жеңілдіктен кейін баға 64 → 0.8·p = 64 → p = 80. 64·1.2 = 76.8 - қате!", "Шешім: 0.75·p = 18 000 → p = 18 000 / 0.75 = 24 000 ₸. «Кері пайыз» қойындысында F = 18000, p = −25 қойып тексер."] }) });

  /* ---------- 2-тапсырма: меңгеру ---------- */
  function gen(prev) {
    const kind = pick(["chg", "succ", "rev", "of"].filter((k) => !prev || k !== prev.kind));
    if (kind === "chg") {
      const old = pick([20, 25, 40, 50, 60, 80, 120, 150, 200, 250]), p = pick([-40, -25, -20, -10, 10, 15, 20, 30, 50, 75]), nw = (old * (100 + p)) / 100;
      return { kind, ans: { x: p }, item: "change", text: `Мән ${old}-ден ${num(nw)}-ге өзгерді. Неше пайызға өзгерді? (азайса - теріс сан)`, fields: [{ key: "x", label: "өзгеріс, %" }],
        check: ({ x }) => M.near(x, p) ? { ok: true, why: `(${num(nw)} − ${old}) / ${old} = ${num(p / 100)} = ${pct(p)}.` } : M.near(x, ((nw - old) / nw) * 100, 1e-3) ? { code: "divided-by-new", why: `Айырма жаңа мәнге (${num(nw)}) бөлінді. Пайыздық өзгеріс ЕСКІ мәнге қатысты: / ${old}.` } : M.near(x, -p) ? { code: "sign", why: `Таңба: мән ${p > 0 ? "өсті" : "азайды"}, сондықтан ${pct(p)}.` } : M.near(x, nw - old) ? { code: "difference", why: `${num(nw - old)} - айырма, пайыз емес. Оны ${old}-ге бөліп, 100-ге көбейт.` } : M.near(x, (nw / old) * 100) ? { code: "ratio", why: `${num((nw / old) * 100)}% - жаңа мәннің ескіге қатынасы; өзгеріс одан 100%-ды шегергенде шығады.` } : { code: "calc", why: "Өзгеріс = (жаңа − ескі) / ескі × 100%." },
        hints: ["Пайыздық өзгеріс = (жаңа − ескі) / ЕСКІ × 100%.", "Ұқсас мысал: 40 → 52: 12/40 = 0.3 → +30%. (12/52 ≈ 23% - қате, жаңаға бөлінген.)", `Шешім: (${num(nw)} − ${old}) / ${old} = ${num(p / 100)} → ${pct(p)}.`] };
    }
    if (kind === "succ") {
      let p1, p2; do { p1 = pick([10, 20, 25, 30, 50, -10, -20, -25, -50]); p2 = pick([10, 20, 25, 40, 50, -10, -20, -25, -40]); } while (p1 === p2);
      const tot = ((100 + p1) * (100 + p2)) / 100 - 100;
      return { kind, ans: { x: tot }, item: "successive", text: `Баға алдымен ${pct(p1)}, сосын жаңа бағадан ${pct(p2)} өзгерді. Бастапқымен салыстырғанда жалпы неше пайыз өзгерді? (азайса - теріс)`, fields: [{ key: "x", label: "жалпы өзгеріс, %" }],
        check: ({ x }) => M.near(x, tot, 1e-6) ? { ok: true, why: `${num((100 + p1) / 100)} × ${num((100 + p2) / 100)} = ${num(M.round((100 + tot) / 100, 4))} → ${pct(tot)}.` } : M.near(x, p1 + p2) ? { code: "added", why: `Пайыздар қосылды: ${pct(p1)} + ${pct(p2)}. Бірақ 2-өзгеріс ЖАҢА бағадан есептеледі - көбейткіштерді көбейт: ${num((100 + p1) / 100)} × ${num((100 + p2) / 100)}.` } : M.near(x, (100 + p1) * (100 + p2) / 100) ? { code: "factor", why: `${num((100 + p1) * (100 + p2) / 100)}% - соңғы бағаның бастапқыға қатынасы. Өзгеріс = одан 100%-ды шегер.` } : { code: "calc", why: "Әр өзгерісті көбейткішке айналдыр (+20% → 1.2, −20% → 0.8) да, көбейт." },
        hints: ["Әр пайыздық өзгерісті көбейткішке айналдыр: +p% → 1 + p/100, −p% → 1 − p/100.", "Ұқсас мысал: +20%, сосын −20%: 1.2 × 0.8 = 0.96 → −4%.", `Шешім: ${num((100 + p1) / 100)} × ${num((100 + p2) / 100)} = ${num(M.round((100 + tot) / 100, 4))} → ${pct(tot)}.`] };
    }
    if (kind === "rev") {
      const p = pick([-40, -25, -20, -10, 10, 20, 25, 50]), o = pick([800, 1200, 2000, 4000, 6000, 12000, 24000]), F = (o * (100 + p)) / 100;
      return { kind, ans: { x: o }, item: "reverse", text: `${p < 0 ? `${-p}% жеңілдіктен` : `${p}% қымбаттаудан`} кейін баға ${money(F)} теңге болды. Бастапқы баға қанша?`, fields: [{ key: "x", label: "бастапқы баға" }],
        check: ({ x }) => diagRev(x, F, p),
        hints: [`${money(F)} - бастапқы бағаның ${100 + p}%-ы. Теңдеу құр.`, "Ұқсас мысал: 25% жеңілдіктен кейін 18 000 → 0.75p = 18 000 → p = 24 000.", `Шешім: p · ${num((100 + p) / 100)} = ${money(F)} → p = ${money(F)} / ${num((100 + p) / 100)} = ${money(o)}.`] };
    }
    const p = pick([12, 15, 35, 45, 60, 75, 125, 8]), y = pick([40, 60, 80, 120, 200, 240, 360, 500]), v = (p * y) / 100;
    return { kind, ans: { x: v }, item: "percent-of", text: `${y}-нің ${p}%-ы неге тең?`, fields: [{ key: "x", label: "жауап" }],
      check: ({ x }) => M.near(x, v) ? { ok: true, why: `${num(p / 100)} × ${y} = ${num(v)}.` } : M.near(x, (y / p) * 100) || M.near(x, y / p) ? { code: "divided", why: `${y}-ні ${p}-ке бөлдің. «${p}%-ы» = ${num(p / 100)}-ге КӨБЕЙТУ.` } : M.near(x, y + v) ? { code: "increase", why: `${num(y + v)} - ${p}%-ға ӨСКЕН мән. Сұрақ тек ${p}%-ын сұрайды.` } : { code: "calc", why: `p% = p/100: ${num(p / 100)} × ${y}.` },
      hints: ["«p%-ы» = p/100-ге көбейту.", "Ұқсас мысал: 260-тың 35%-ы = 0.35 × 260 = 91.", `Шешім: ${num(p / 100)} × ${y} = ${num(v)}.`] };
  }
  const t2 = M.task({ el: $("t2"), skill: SKILL, title: TITLE, gen });
  window.SAT.percent = { state: () => st, gen, diagRev, stepper: stp, t2 };
})();
