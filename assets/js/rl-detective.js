/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Мәтін тергеушісі» (IELTS Reading Detective) - AO17 Reality Engine сабағы, id: ielts.reality.detective.
   Мазмұн: assets/data/rl-detective.js (window.RL_DETECTIVE). Бұл файлда тек көрсету мен тексеру логикасы бар.
   Негізгі бөліктер:
     verdict(күйлер)      - үкім ережесі: бір "no" → False; әйтпесе бір "absent" → Not Given; бәрі "ok" → True.
     shared(a, b)         - a сөйлемінің b сөйлемінде кездесетін әртүрлі сөздері (кіріспедегі «сөз аңшылығы» санағы).
     Passage              - сөйлемдері таңдалатын мәтін (тышқан, Enter/Бос орын, бағыттауыш пернелер).
     Threads              - «дәлел жібі»: мәлімдемедегі сөз бен мәтіндегі парафразды қосатын SVG сызық.
     investigate          - дәлел сөйлем → үкім (3-кезең және меңгеру); classify - үкім → дәлелді растау (тексеру кезеңі).
   Тексеруші ережеге негізделген: ешқандай сыртқы қызметке жүгінбейді. */
(() => {
  "use strict";
  const R = window.AO17Reality, D = window.RL_DETECTIVE, T = window.AO17Tutor;
  const VN = { T: "True", F: "False", NG: "Not Given" };
  const VK = { T: "мәтін растайды", F: "мәтін қарсы айтады", NG: "мәтінде айтылмаған" };
  const ST = { ok: "мәтін растайды", no: "мәтін қарсы айтады", absent: "мәтінде жоқ" };

  /* ---------- таза функциялар (тест оларды тәуелсіз іске асырумен салыстырады) ---------- */
  const words = (s) => String(s).toLowerCase().match(/[a-z0-9]+(?:['-][a-z0-9]+)*/g) || [];
  const shared = (a, b) => { const B = new Set(words(b)); return [...new Set(words(a))].filter((w) => B.has(w)); };
  const verdict = (sts) => (sts.includes("no") ? "F" : sts.includes("absent") ? "NG" : "T");
  window.RLDetective = { words, shared, verdict };

  const root = document.getElementById("rd-root");
  if (!R || !D || !root) return;
  const el = R.el, svg = R.svg;
  const fb = (box, kind, title, why) => { if (T) T.feedback(box, kind, title, why); else { box.className = "tt-fb tt-" + kind; box.textContent = title + " " + (why || ""); } };
  const en = (e) => { e.lang = "en"; return e; };
  const btn = (cls, text) => { const b = el("button", cls, text); b.type = "button"; return b; };

  /* кезең ауысқанда терезе тыңдаушыларын тазалау */
  let offs = [];
  const onWin = (ev, fn) => { addEventListener(ev, fn, { passive: true }); offs.push(() => removeEventListener(ev, fn)); };
  const reset = () => { offs.forEach((f) => f()); offs = []; };

  /** Мәтін ішіндегі тіркестерді <mark> ішіне алу. Қайтарады: { frag, marks[] } (табылмаған тіркес үшін marks[i] = null). */
  function markUp(text, phrases, cls) {
    const frag = document.createDocumentFragment(), marks = phrases.map(() => null);
    const hits = phrases.map((p, i) => ({ i, at: p ? text.indexOf(p) : -1, len: p ? p.length : 0 })).filter((h) => h.at >= 0).sort((a, b) => a.at - b.at);
    let pos = 0;
    hits.forEach((h) => {
      if (h.at < pos) return;
      frag.append(text.slice(pos, h.at));
      const m = el("mark", cls || "rd-kw", text.slice(h.at, h.at + h.len)); marks[h.i] = m; frag.append(m); pos = h.at + h.len;
    });
    frag.append(text.slice(pos));
    return { frag, marks };
  }

  /** Мәтін. o.selectable - сөйлемдер батырма сияқты таңдалады; o.only - тек осы индекстегі сөйлемдерді көрсету. */
  function Passage(P, o = {}) {
    const box = en(el("div", "lab-text rd-pass"));
    if (o.title !== false) { const h = el("p", "rd-ptitle", P.title); box.append(h); }
    const sents = [];
    const api = { el: box, sents, onPick: null,
      mark(i, phrases, cls) { const s = sents[i]; if (!s) return []; const m = markUp(P.sentences[i].t, phrases, cls); s.textContent = ""; s.append(m.frag); return m.marks; },
      clear() { sents.forEach((s, i) => { if (!s) return; s.textContent = P.sentences[i].t; s.classList.remove("ok", "no"); if (o.selectable) s.setAttribute("aria-pressed", "false"); }); },
      lock(on) { sents.forEach((s) => { if (s && o.selectable) { s.setAttribute("aria-disabled", on ? "true" : "false"); s.classList.toggle("rd-locked", !!on); } }); },
    };
    let para = null, pn = -1;
    P.sentences.forEach((S, i) => {
      if (o.only && !o.only.includes(i)) return;
      if (S.p !== pn || !para) { para = el("p"); box.append(para); pn = S.p; }
      const s = el("span", "rd-s" + (o.selectable ? " lab-sel" : ""), S.t); s.dataset.i = i; sents[i] = s;
      if (o.selectable) {
        s.setAttribute("role", "button"); s.tabIndex = 0; s.setAttribute("aria-pressed", "false");
        const pick = (kbd) => { if (s.getAttribute("aria-disabled") === "true") return; if (api.onPick) api.onPick(i, kbd); };
        s.addEventListener("click", () => pick(false));
        s.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(true); return; }
          const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const live = sents.filter(Boolean), at = live.indexOf(s), nx = live[at + d];
          if (nx) nx.focus();
        });
      }
      para.append(s, " ");
    });
    return api;
  }

  /** Дәлел жібі: host ішіндегі a және b элементтерін қисық сызықпен қосады. Өлшем не айналдыру өзгерсе, қайта есептеледі. */
  function Threads(host) {
    host.classList.add("rd-host");
    const s = svg("svg", { class: "rd-threads", "aria-hidden": "true", focusable: "false" }, host);
    let links = [];
    const draw = () => {
      if (!host.isConnected) return;
      const hb = host.getBoundingClientRect();
      links.forEach((L) => {
        const ra = L.a.isConnected && L.a.getClientRects()[0], rb = L.b.isConnected && L.b.getClientRects()[0];
        if (!ra || !rb) { L.g.setAttribute("display", "none"); return; }
        L.g.removeAttribute("display");
        let x1, y1, x2, y2, c1x, c1y, c2x, c2y;
        const hgap = Math.max(ra.left - rb.right, rb.left - ra.right), vgap = Math.max(ra.top - rb.bottom, rb.top - ra.bottom, 0);
        if (hgap > 8 && hgap > 2 * vgap) {                                // қатар тұр: көлденең шығу
          const aLeft = ra.left > rb.right;
          x1 = aLeft ? ra.left : ra.right; y1 = ra.top + ra.height / 2; x2 = aLeft ? rb.right : rb.left; y2 = rb.top + rb.height / 2;
          const k = Math.max(24, Math.abs(x2 - x1) / 2) * (aLeft ? -1 : 1);
          c1x = x1 + k; c1y = y1; c2x = x2 - k; c2y = y2;
        } else {                                                          // бірінің үстінде бірі: тік шығу
          const down = ra.top <= rb.top;
          x1 = ra.left + ra.width / 2; y1 = down ? ra.bottom : ra.top; x2 = rb.left + rb.width / 2; y2 = down ? rb.top : rb.bottom;
          const k = Math.max(18, Math.abs(y2 - y1) / 2) * (down ? 1 : -1);
          c1x = x1; c1y = y1 + k; c2x = x2; c2y = y2 - k;
        }
        const f = (v, base) => Math.round((v - base) * 10) / 10;
        const X1 = f(x1, hb.left), Y1 = f(y1, hb.top), X2 = f(x2, hb.left), Y2 = f(y2, hb.top);
        L.path.setAttribute("d", `M${X1} ${Y1} C${f(c1x, hb.left)} ${f(c1y, hb.top)} ${f(c2x, hb.left)} ${f(c2y, hb.top)} ${X2} ${Y2}`);
        L.c1.setAttribute("cx", X1); L.c1.setAttribute("cy", Y1); L.c2.setAttribute("cx", X2); L.c2.setAttribute("cy", Y2);
      });
    };
    const set = (list) => {
      s.textContent = "";
      links = list.filter((l) => l[0] && l[1]).map(([a, b, cls]) => { const g = svg("g", { class: "rd-th " + (cls || "") }, s); return { a, b, g, path: svg("path", { pathLength: 1 }, g), c1: svg("circle", { r: 3.5 }, g), c2: svg("circle", { r: 3.5 }, g) }; });
      draw();
    };
    if (window.ResizeObserver) { const ro = new ResizeObserver(draw); ro.observe(host); offs.push(() => ro.disconnect()); }
    onWin("scroll", draw); onWin("resize", draw);
    return { set, draw, clear: () => set([]), get n() { return links.length; } };
  }

  const verdictRow = (label) => {
    const g = el("div", "lab-choice rd-verdicts"); g.setAttribute("role", "group"); g.setAttribute("aria-label", label || "Үкім");
    ["T", "F", "NG"].forEach((v) => { const b = btn("", VN[v]); b.dataset.v = v; en(b); g.append(b); });
    return g;
  };
  const stamp = (v) => { const s = el("span", "rd-stamp rd-v-" + v, VN[v]); en(s); return s; };

  /** Дәлел сөйлем → үкім. items - мәлімдемелер; o: { hints, prefix, start, onStep(i), onAll(first, total) }. */
  function investigate(body, ctx, P, items, o) {
    const scene = el("div", "rd-scene"), card = el("div", "rd-card"), pass = Passage(P, { selectable: true });
    scene.append(card, pass.el); body.append(scene);
    const th = Threads(scene);
    let i = Math.min(o.start || 0, items.length - 1), first = 0;
    function show() {
      const it = items[i], item = o.prefix + (i + 1);
      let phase = "ev", clean = true, hintsUsed = () => 0, spoiled = false;
      card.textContent = ""; pass.clear(); pass.lock(false); th.clear();
      const stmt = en(el("p", "rd-stmt", it.text)); stmt.tabIndex = -1;
      const ask = el("p", "rd-ask"), ctl = el("div", "rd-ctl"), link = el("p", "rd-link"), box = el("div"), hb = el("div");
      link.setAttribute("aria-live", "polite");
      card.append(el("p", "rd-step", `Іс ${i + 1} / ${items.length}`), stmt, ask, ctl, link, box);
      if (o.hints && it.hints && T) { card.append(hb); hintsUsed = T.hints(hb, it.hints, { onSolution: () => { spoiled = true; clean = false; } }).used; }
      const miss = (error, note) => { clean = false; ctx.record(false, { item, error, note, hints: hintsUsed() }); };
      const evPhase = () => {
        ask.textContent = "1-қадам. Мәтіннен осы мәлімдемені растайтын не жоққа шығаратын сөйлемді таңда. Ондай сөйлем жоқ болса, батырманы бас.";
        ctl.textContent = "";
        const none = btn("btn secondary rd-none", "Ешбір сөйлем бұл туралы айтпайды");
        none.addEventListener("click", () => {
          if (it.verdict === "NG") { fb(box, "ok", "Дұрыс: ондай сөйлем жоқ.", "Мәтінде " + it.about + " туралы ештеңе айтылмаған. Енді үкім шығар."); verdictPhase(true); }
          else { const why = "Мәтінде " + it.about + " туралы сөйлем бар. Ол басқа сөздермен жазылған болуы мүмкін: синонимдерін ізде."; fb(box, "bad", "Сөйлем бар.", why); miss("evidence-missed", why); }
        });
        ctl.append(none);
      };
      const verdictPhase = (kbd) => {
        phase = "verdict"; pass.lock(true);
        ask.textContent = "2-қадам. Үкім шығар: мәтін растай ма, қарсы айта ма, әлде үндемей ме?";
        ctl.textContent = "";
        const g = verdictRow("Үкім");
        g.addEventListener("click", (e) => {
          const b = e.target.closest("button"); if (!b || phase !== "verdict") return;
          const v = b.dataset.v;
          if (v === it.verdict) {
            phase = "done"; b.classList.add("ok"); g.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            fb(box, "ok", `Үкім: ${VN[v]} (${VK[v]}).`, it.why);
            const good = clean && !spoiled; if (good) first++;
            ctx.record(true, { item, hints: spoiled ? 3 : hintsUsed() });
            if (o.onStep) o.onStep(i + 1);
            const last = i + 1 >= items.length, nx = btn("btn gold rd-nextcase", last ? "Қорытынды" : "Келесі іс");
            nx.addEventListener("click", () => { if (last) { finish(); } else { i++; show(); card.querySelector(".rd-stmt").focus(); } });
            ctl.append(nx);
          } else {
            b.classList.add("no"); b.disabled = true;
            const why = (it.whyNot && it.whyNot[v]) || (v === "NG" ? "Сен дәлел сөйлемді таптың: мәтін бұл туралы айтады. Айтылған нәрсе Not Given бола алмайды." : "Мәтінде бұл мәлімдемені растайтын да, жоққа шығаратын да сөйлем жоқ екенін өзің анықтадың. Дәлелсіз True не False деуге болмайды.");
            fb(box, "bad", `${VN[v]} емес.`, why); miss("verdict-" + v + "-for-" + it.verdict, why);
          }
        });
        ctl.append(g);
        if (kbd) g.querySelector("button").focus();
      };
      pass.onPick = (k, kbd) => {
        if (phase !== "ev") return;
        const s = pass.sents[k];
        pass.sents.forEach((x) => x && x.classList.remove("no"));
        if (it.ev.includes(k)) {
          s.classList.add("ok"); s.setAttribute("aria-pressed", "true");
          const lk = it.links || [], qm = markUp(it.text, lk.map((l) => l.q)), pm = pass.mark(k, lk.map((l) => l.p));
          stmt.textContent = ""; stmt.append(qm.frag);
          th.set(lk.map((l, j) => [qm.marks[j], pm[j]]));
          link.textContent = lk.length ? "Дәлел жібі: " + lk.map((l) => `«${l.q}» ↔ «${l.p}»`).join("; ") + "." : "";
          fb(box, "ok", "Дәлел табылды.", lk.length ? "Жіп мәлімдемедегі сөзді мәтіндегі парафразымен қосты." : "");
          verdictPhase(kbd);
        } else {
          s.classList.add("no");
          const tr = it.traps && it.traps[k];
          const why = tr || `Бұл сөйлем ${P.sentences[k].topic} туралы. Ал мәлімдеме ${it.about} туралы.`;
          fb(box, "bad", "Бұл дәлел емес.", why); miss(tr ? "word-match" : "evidence-wrong", why);
        }
      };
      evPhase();
    }
    function finish() {
      card.textContent = ""; pass.clear(); pass.lock(true); th.clear();
      if (o.onAll) o.onAll(first, items.length, card, () => { i = 0; first = 0; show(); });
    }
    show();
    return { scene, card };
  }

  /** Үкім → дәлелді растау (тексеру кезеңі). T/F: дәлел сөйлемді таңдау; NG: ең жақын сөйлемдердің әрқайсысы басқа нәрсе туралы екенін растау. */
  function classify(host, ctx, P, items, o) {
    const list = el("ol", "gd-exs"); host.append(list);
    let solved = 0, first = 0;
    items.forEach((it, n) => {
      const item = o.prefix + (n + 1), li = el("li", "gd-ex"), box = el("div"), step2 = el("div", "rd-step2"), hb = el("div");
      let clean = true, spoiled = false, used = () => 0;
      const miss = (error, note) => { clean = false; ctx.record(false, { item, error, note, hints: used() }); };
      const done = (why) => {
        li.classList.add("done"); solved++;
        li.querySelectorAll("button:not(.tt-hbtn)").forEach((x) => { x.disabled = true; });
        fb(box, "ok", `Іс жабылды: ${VN[it.verdict]}.`, why);
        if (clean && !spoiled) first++;
        ctx.record(true, { item, hints: spoiled ? 3 : used() });
        if (solved === items.length && o.onAll) o.onAll(first, items.length);
      };
      li.append(en(el("p", "gd-q rd-stmt", it.text)));
      const g = verdictRow("Үкім: " + it.text);
      g.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b || step2.childNodes.length) return;
        const v = b.dataset.v;
        if (v !== it.verdict) { b.classList.add("no"); b.disabled = true; fb(box, "bad", `${VN[v]} емес.`, it.whyNot[v]); miss("verdict-" + v + "-for-" + it.verdict, it.whyNot[v]); return; }
        b.classList.add("ok"); g.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        if (v === "NG") {
          fb(box, "info", "Not Given дедің. Енді оны раста.", "Мәлімдемеге ең ұқсас сөйлемдерді тексер: әрқайсысы шынымен осы мәлімдеме туралы айта ма?");
          let left = it.cands.length;
          it.cands.forEach((k) => {
            const row = el("div", "rd-cand"), q = en(el("p", "rd-quote", P.sentences[k].t)), ch = el("div", "lab-choice");
            ch.setAttribute("role", "group"); ch.setAttribute("aria-label", "Бұл сөйлем мәлімдеме туралы айта ма?");
            const yes = btn("", "Иә, осы туралы айтады"), no = btn("", "Жоқ, басқа нәрсе туралы");
            yes.dataset.a = "yes"; no.dataset.a = "no";
            yes.addEventListener("click", () => { yes.classList.add("no"); yes.disabled = true; const why = (it.traps && it.traps[k]) || `Бұл сөйлем ${P.sentences[k].topic} туралы.`; fb(box, "bad", "Қайта оқы.", why); miss("word-match", why); });
            no.addEventListener("click", () => { no.classList.add("ok"); no.disabled = true; yes.disabled = true; row.classList.add("ok"); if (--left === 0) done(it.why); else fb(box, "info", "Дұрыс, бұл сөйлем басқа нәрсе туралы.", "Қалған сөйлемді де тексер."); });
            ch.append(yes, no); row.append(q, ch); step2.append(row);
          });
        } else {
          fb(box, "info", `${VN[v]} дедің. Енді дәлелде.`, "Қай сөйлем осы үкімді дәлелдейді?");
          const ch = el("div", "gd-opts"); ch.setAttribute("role", "group"); ch.setAttribute("aria-label", "Дәлел сөйлем");
          it.cands.forEach((k) => {
            const b2 = en(btn("", P.sentences[k].t)); b2.dataset.k = k;
            b2.addEventListener("click", () => {
              if (it.ev.includes(k)) { b2.classList.add("ok"); done(it.why); }
              else { b2.classList.add("no"); b2.disabled = true; const why = `Бұл сөйлем ${P.sentences[k].topic} туралы. Ал мәлімдеме ${it.about} туралы.`; fb(box, "bad", "Бұл дәлел емес.", why); miss("evidence-wrong", why); }
            });
            ch.append(b2);
          });
          step2.append(ch);
        }
      });
      li.append(g, step2, box);
      if (o.hints && it.hints && T) { used = T.hints(hb, it.hints, { onSolution: () => { spoiled = true; } }).used; li.append(hb); }
      list.append(li);
    });
  }

  /** Парафразды сәйкестендіру: сол жақтан мәтін тіркесін, оң жақтан мағынасы бірдей сұрақ тіркесін таңдау. */
  function match(host, ctx, M, o) {
    const wrap = el("div", "rd-match"), colL = el("div", "rd-col"), colR = el("div", "rd-col"), box = el("div"), hb = el("div");
    colL.setAttribute("role", "group"); colL.setAttribute("aria-label", "Мәтіндегі тіркестер"); colR.setAttribute("role", "group"); colR.setAttribute("aria-label", "Сұрақтағы тіркестер");
    colL.append(el("p", "rd-colh", "Мәтінде")); colR.append(el("p", "rd-colh", "Сұрақта"));
    let cur = null, left = M.left.length, clean = true, spoiled = false, used = () => 0, n = 0;
    const lbs = M.left.map((L) => {
      const b = en(btn("rd-ph", L.t)); b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => { lbs.forEach((x) => x.b.setAttribute("aria-pressed", "false")); cur = L; b.setAttribute("aria-pressed", "true"); fb(box, "info", `«${L.t}» таңдалды.`, "Енді оң жақтан мағынасы дәл осындай тіркесті таңда."); });
      colL.append(b); return { L, b };
    });
    M.right.forEach((Rt) => {
      const b = en(btn("rd-ph", Rt.t));
      b.addEventListener("click", () => {
        if (!cur) { fb(box, "info", "Алдымен сол жақтан тіркес таңда.", "Сол жақта мәтіннің өз сөздері тұр, оң жақта сұрақтағы парафраздар."); return; }
        const item = "p-" + cur.id;
        if (Rt.pair === cur.id) {
          n++;
          const lb = lbs.find((x) => x.L === cur).b;
          [lb, b].forEach((x) => { x.classList.add("ok"); x.disabled = true; x.setAttribute("aria-label", `${x.textContent} (${n}-жұп)`); x.append(el("span", "rd-pn", String(n))); });
          lb.setAttribute("aria-pressed", "false");
          fb(box, "ok", "Парафраз табылды.", `«${cur.t}» = «${Rt.t}»: екеуі де «${cur.kk}» дегенді білдіреді.`);
          ctx.record(true, { item, hints: spoiled ? 3 : used() });
          cur = null;
          if (--left === 0 && o.onAll) o.onAll(clean && !spoiled);
        } else {
          clean = false;
          const why = `«${cur.t}» - «${cur.kk}», ал «${Rt.t}» - «${Rt.kk}». Мағыналары әртүрлі.`;
          fb(box, "bad", "Бұл парафраз емес.", why); ctx.record(false, { item, error: "paraphrase-wrong", note: why, hints: used() });
        }
      });
      colR.append(b);
    });
    wrap.append(colL, colR); host.append(wrap, box);
    if (M.hints && T) { used = T.hints(hb, M.hints, { onSolution: () => { spoiled = true; } }).used; host.append(hb); }
  }

  /* ================= кезеңдер ================= */
  const A = D.passageA, B = D.passageB;

  function intro(body, ctx) {
    reset();
    const I = D.intro, sent = A.sentences[I.sent].t, sh = shared(I.statement, sent), all = [...new Set(words(I.statement))];
    const scene = el("div", "rd-duo");
    const wordSpans = (text, live) => {
      const p = en(el("p", "rd-wline")), map = {};
      text.split(/(\s+)/).forEach((tok) => {
        if (!tok.trim()) { p.append(tok); return; }
        const w = words(tok)[0], s = el("span", "rd-w" + (w && sh.includes(w) ? " rd-shared" : ""), tok);
        if (w && !map[w]) map[w] = s; p.append(s);
      });
      return { p, map };
    };
    const q = wordSpans(I.statement), s = wordSpans(sent);
    const b1 = el("div", "rd-blk"), b2 = el("div", "rd-blk");
    b1.append(el("p", "rd-lbl", "Мәлімдеме"), q.p); b2.append(el("p", "rd-lbl", "Мәтіндегі сөйлем"), s.p);
    scene.append(b1, b2);
    const count = el("p", "rd-count"); count.append("Бірдей сөздер: мәлімдеменің ", el("b", "", String(all.length)), " сөзінің ", el("b", "rd-n", String(sh.length)), "-і осы сөйлемде бар (алтынмен белгіленген).");
    const ask = el("p", "gd-q", "Тергеуші, сенің үкімің қандай? Мәтін мәлімдемені растай ма?");
    const g = verdictRow("Үкім"), box = el("div"), task = el("div", "rd-task2");
    body.append(scene, count, ask, g, box, task);
    const th = Threads(scene);
    ctx.note("Сөздердің сәйкес келуі әлі дәлел емес. Алдымен өз болжамыңды айт.");
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || task.childNodes.length) return;
      const v = b.dataset.v, ok = v === I.answer;
      g.querySelectorAll("button").forEach((x) => { x.disabled = true; x.setAttribute("aria-pressed", x === b ? "true" : "false"); if (x.dataset.v === I.answer) x.classList.add("ok"); });
      if (!ok) b.classList.add("no");
      fb(box, ok ? "ok" : "bad", ok ? "Дұрыс болжам: False." : `Болжамың: ${VN[v]}. Дұрысы - False.`, I.why[v]);
      const extra = [...new Set(words(sent))].filter((w) => !sh.includes(w));
      const ch = el("div", "lab-choice"), box2 = el("div"); ch.setAttribute("role", "group"); ch.setAttribute("aria-label", "Сөйлемдегі мәлімдемеде жоқ сөздер");
      task.append(el("p", "gd-q", "Енді дәлелде: сөйлемдегі мәлімдемеде ЖОҚ сөздердің қайсысы мағынаны төңкеріп тұр?"), ch, box2);
      extra.forEach((w) => {
        const wb = en(btn("", w)); wb.dataset.w = w;
        wb.addEventListener("click", () => {
          if (w === I.flip) {
            wb.classList.add("ok"); ch.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            if (s.map[w]) s.map[w].classList.add("rd-flip");
            th.set([[q.map[I.anchor], s.map[w], "bad"]]);
            fb(box2, "ok", "Табылды.", I.flipOk);
            ctx.note("Ереже: бірдей сөз дәлел емес. Дәлел - мағынасы сәйкес келетін (немесе қайшы келетін) сөйлем.");
            ctx.done();
          } else { wb.classList.add("no"); wb.disabled = true; fb(box2, "bad", "Бұл сөз емес.", I.flipNo.replace("{w}", w)); }
        });
        ch.append(wb);
      });
      ctx.note("Сөздер бірдей, үкім - False. Себебін тап: қай сөз мағынаны өзгертті?");
    });
  }

  function concept(body, ctx) {
    reset();
    const C = D.concept, steps = 2 + C.claims.length, v = verdict(C.claims.map((c) => c.st));
    const board = el("div", "lab-board rd-board");
    const stmt = en(el("p", "rd-b-stmt", C.statement));
    const claims = el("ol", "rd-claims"); claims.setAttribute("aria-label", "Мәлімдеменің тұжырымдары");
    const chips = C.claims.map((c) => { const li = el("li", "rd-claim rd-off"), t = en(el("span", "", c.t)), m = el("span", "rd-mk"); li.append(t, m); claims.append(li); return { li, t, m }; });
    const sents = el("div", "rd-b-sents"), marks = [];
    C.sents.forEach((k) => {
      const p = en(el("p", "rd-b-sent")), mine = C.claims.map((c, j) => (c.sent === k ? j : -1)).filter((j) => j >= 0);
      const mu = markUp(A.sentences[k].t, mine.map((j) => C.claims[j].p), "rd-bm");
      mine.forEach((j, x) => { marks[j] = mu.marks[x]; }); p.append(mu.frag); sents.append(p);
    });
    const out = el("p", "rd-b-out rd-off"); out.append("Үкім: ", stamp(v));
    const cap = el("p", "rd-cap"); cap.setAttribute("aria-live", "polite");
    board.append(el("p", "rd-b-lbl", "Мәлімдеме"), stmt, el("p", "rd-b-lbl", "Тұжырымдар"), claims, el("p", "rd-b-lbl", "Мәтін"), sents, out, cap);
    body.append(board);
    const th = Threads(board);
    const ask = el("div", "rd-askbox"); ask.hidden = true;
    const g = el("div", "lab-choice"), box = el("div"); g.setAttribute("role", "group"); g.setAttribute("aria-label", C.ask);
    C.claims.forEach((c, j) => {
      const b = en(btn("", c.t));
      b.addEventListener("click", () => {
        if (c.st !== "ok") { b.classList.add("ok"); g.querySelectorAll("button").forEach((x) => { x.disabled = true; }); fb(box, "ok", "Дұрыс.", C.askOk); ctx.note("Ереже: бір тұжырым мәтінге қайшы болса - False; бір тұжырым мәтінде жоқ болса (қайшысы болмаса) - Not Given; бәрі расталса ғана - True."); ctx.done(); }
        else { b.classList.add("no"); b.disabled = true; fb(box, "bad", "Бұл емес.", C.askNo); }
      });
      g.append(b);
    });
    let seenEnd = false;
    const onStep = (k) => {
      chips.forEach((c, j) => {
        const shown = k >= 1, checked = k >= 2 + j, cl = C.claims[j];
        c.li.classList.toggle("rd-off", !shown);
        c.li.classList.toggle("rd-ok", checked && cl.st === "ok"); c.li.classList.toggle("rd-no", checked && cl.st === "no"); c.li.classList.toggle("rd-abs", checked && cl.st === "absent");
        c.li.classList.toggle("rd-cur", k === 2 + j);
        c.m.textContent = checked ? (cl.st === "ok" ? " ✓ " : cl.st === "no" ? " ✗ " : " ? ") + ST[cl.st] : "";
        if (marks[j]) marks[j].classList.toggle("on", checked);
      });
      out.classList.toggle("rd-off", k < steps);
      cap.textContent = C.caps[k] || "";
      th.set(C.claims.map((cl, j) => (k >= 2 + j && marks[j] ? [chips[j].li, marks[j], (cl.st === "ok" ? "good" : "bad") + ((k >= steps ? cl.st === "ok" : k !== 2 + j) ? " dim" : "")] : null)).filter(Boolean));
      if (k >= steps && !seenEnd) { seenEnd = true; ask.hidden = false; ctx.note("Анимация аяқталды. Енді төмендегі сұраққа жауап бер."); }
    };
    R.player(body, { steps, onStep, speed: 2200, label: "Мәлімдемені тексеру анимациясы" });
    ask.append(el("p", "gd-q", C.ask), g, box); body.append(ask);
    ctx.note("▶ бас немесе → пернесімен қадамдап өт: мәлімдеме қалай тұжырымдарға бөлінетінін көр.");
  }

  function guided(body, ctx) {
    reset();
    const n = D.guided.length, at = ctx.state.gi || 0;
    ctx.note("Алдымен дәлел сөйлем, сосын үкім. Сөйлемді тышқанмен не Tab пен Enter арқылы таңда; ↑ ↓ пернелері сөйлемдер арасында жылжытады.");
    investigate(body, ctx, A, D.guided, {
      hints: true, prefix: "g", start: at >= n ? 0 : at,
      onStep: (k) => { ctx.state.gi = k; ctx.save(); ctx.note(k < n ? `${k} / ${n} іс жабылды. Дәлелсіз үкім шығарма.` : "Төрт істің төртеуі де жабылды."); },
      onAll: (first, total, card) => {
        card.append(el("p", "rd-step", "Қорытынды"), el("p", "rd-sum", `Барлық ${total} іс жабылды. Бірінші әрекеттен, көмексіз: ${first} / ${total}.`),
          el("p", "", "True мен False үшін әрқашан бір сөйлемді көрсете аласың. Not Given үшін көрсететін сөйлем жоқ: мұны да тексеріп барып айту керек."));
        ctx.done();
      },
    });
  }

  function explore(body, ctx) {
    reset();
    const tm = R.timer(), seen = {}, touched = {};
    const track = el("p", "rd-track"); track.setAttribute("aria-live", "polite");
    const paint = () => {
      track.textContent = "";
      track.append("Табылған үкімдер: ");
      ["T", "F", "NG"].forEach((v) => { const s = el("span", "rd-chip" + (seen[v] ? " on" : ""), VN[v] + (seen[v] ? " ✓" : "")); en(s); track.append(s, " "); });
      track.append(el("span", "gd-n", `Тәжірибе саны: ${tm.read().steps}`));
    };
    body.append(el("p", "rd-lead", "Әр мәлімдемеде бір сөзді ауыстыр. Үш түрлі үкімнің үшеуін де шығар және үш мәлімдеменің әрқайсысын кем дегенде бір рет өзгертіп көр."), track);
    D.explore.forEach((E, n) => {
      const blk = el("section", "rd-exp"), line = en(el("p", "rd-stmt rd-slotline")), g = el("span", "rd-slot"), out = el("p", "rd-out"), why = el("p", "rd-why");
      blk.setAttribute("aria-label", `${n + 1}-мәлімдеме`);
      g.setAttribute("role", "group"); g.setAttribute("aria-label", "Сөзді таңда");
      out.setAttribute("aria-live", "polite");
      const quote = Passage(A, { only: E.sents, title: false }); quote.el.classList.add("rd-quote");
      line.append(E.pre + " ", g, " " + E.post);
      blk.append(el("p", "rd-step", `${n + 1}-мәлімдеме`), line, out, why, el("p", "rd-lbl", "Мәтіндегі сөйлем"), quote.el);
      body.append(blk);
      const th = Threads(blk);
      out.textContent = "Сөз таңда: үкім осында шығады.";
      E.opts.forEach((O) => {
        const b = btn("rd-opt", O.w); b.setAttribute("aria-pressed", "false"); b.dataset.w = O.w;
        b.addEventListener("click", () => {
          g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
          const v = verdict(["ok", O.st]);
          tm.step(); seen[v] = true; touched[E.id] = true;
          E.sents.forEach((k) => quote.mark(k, []));
          out.textContent = ""; out.append("Үкім: ", stamp(v), ` - ${VK[v]}.`);
          why.textContent = O.why;
          if (O.sent != null) { const m = quote.mark(O.sent, [O.p], "rd-kw " + (O.st === "ok" ? "good" : "bad")); th.set([[b, m[0], O.st === "ok" ? "good" : "bad"]]); }
          else th.clear();
          paint();
          const allV = seen.T && seen.F && seen.NG, allE = D.explore.every((x) => touched[x.id]);
          ctx.note(allV && allE ? "Бір сөз - бір тұжырым. Сөз ауысса, тексерілетін тұжырым да, үкім де ауысады: сондықтан all, some, before, after сияқты сөздерді ешқашан аттап өтпе." :
            `«${O.w}» сөзімен үкім - ${VN[v]}. ` + (!allV ? "Әлі шықпаған үкімді ізде." : "Қалған мәлімдемелерді де өзгертіп көр."));
          if (allV && allE) ctx.done();
        });
        g.append(b);
      });
    });
    paint();
    ctx.note("Сөзді бас: жіп сол сөзді мәтіндегі дәлелмен қосады, үкім мен себебі бірден өзгереді.");
  }

  function checkpoint(body, ctx) {
    reset();
    let okM = false, okC = false, firstM = false, firstC = 0;
    const fin = () => {
      if (okM && okC) { ctx.note(`Тексеру аяқталды. Бірінші әрекеттен, көмексіз: парафраз - ${firstM ? "қатесіз" : "қатемен"}, үкімдер - ${firstC} / ${D.checkpoint.length}.`); ctx.done(); }
      else ctx.note(okM ? "Парафраздар табылды. Енді бес істің үкімін шығарып, дәлелде." : "Үкімдер шығарылды. Парафраздарды да сәйкестендір.");
    };
    const det = el("details", "rd-details"); det.open = true;
    det.append(el("summary", "", "Мәтін: " + A.title), Passage(A, { title: false }).el);
    const h1 = el("h3", "rd-h", "1-бөлім. Парафразды тап"), p1 = el("p", "", "Сұрақ мәтіннің сөзін қайталамайды, оны басқа сөзбен айтады. Сол жақтан тіркес таңдап, оң жақтан мағынасы бірдей тіркесті бас. Оң жақта бір артық тіркес бар.");
    const m = el("div"), h2 = el("h3", "rd-h", "2-бөлім. Үкім шығар және дәлелде"), p2 = el("p", "", "Әр іске үкім шығар. True не False десең, дәлел сөйлемді көрсет. Not Given десең, ең жақын сөйлемдердің басқа нәрсе туралы екенін раста."), c = el("div");
    body.append(det, h1, p1, m, h2, p2, c);
    match(m, ctx, D.pairs, { onAll: (clean) => { okM = true; firstM = clean; fin(); } });
    classify(c, ctx, A, D.checkpoint, { hints: true, prefix: "c", onAll: (f) => { okC = true; firstC = f; fin(); } });
    ctx.note("Қиналсаң, «Көмек керек» батырмасы үш деңгейлі көмек береді. Шешімді ашқан іс «көмексіз» деп саналмайды.");
  }

  function mistakes(body, ctx) {
    reset();
    const quote = (label, text, lang) => `<p class="rd-mq"><b>${label}</b> <span${lang ? ' lang="en"' : ""}>${text}</span></p>`;
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    const items = D.mistakes.map((M) => ({
      type: "mc",
      passage: (M.sent != null ? quote("Мәтін:", esc(A.sentences[M.sent].t), true) : quote("Мәтін:", "(бұл тақырыпта мәтінде бірде-бір сөйлем жоқ)", false)) + quote("Мәлімдеме:", esc(M.text), true) +
        `<p class="rd-mq rd-wrong"><b>Жас тергеушінің үкімі: <span lang="en">${VN[M.said]}</span>.</b> «${esc(M.reasoning)}»</p>`,
      q: "Ол қай тұзаққа түсті?",
      options: D.traps.map((t) => t.name), answer: M.trap,
      why: D.traps.map((t, j) => (j === M.trap ? `Дәл солай: ${M.clue}. ${M.ok}` : `${t.sign} Мұнда басқаша: ${M.clue}.`)),
    }));
    body.append(el("p", "rd-lead", "Жас тергеуші бес іс бойынша қате үкім шығарды. Оның пайымын оқып, қай жерде адасқанын ата. Мәтін - бұрынғы «Tarnbrook» зерттеуі."));
    R.assess(body, items, { record: ctx.record, prefix: "m", onAll: (n, total) => { ctx.note(`Бес тұзақтың бесеуі де аталды. Бірінші әрекеттен: ${n} / ${total}. Өз жауабыңды тексергенде осы бес сұрақты қой.`); ctx.done(); } });
    ctx.note("Үкімнің өзі емес, оған апарған пайым қате. Қатенің атын тап.");
  }

  function mastery(body, ctx) {
    reset();
    const tm = R.timer(), need = D.masteryPass;
    body.append(el("p", "rd-lead", `Жаңа мәтін, жаңа алты іс, көмек жоқ. Әр істе алдымен дәлел сөйлемді (немесе оның жоқтығын), сосын үкімді көрсет. Меңгеру шегі: бірінші әрекеттен кемінде ${need} / ${D.mastery.length}.`));
    ctx.note("Көмек те, жетек те жоқ. Тек мәтін мен сенің дәлелің.");
    investigate(body, ctx, B, D.mastery, {
      hints: false, prefix: "x",
      onStep: (k) => ctx.note(`${k} / ${D.mastery.length} іс жабылды.`),
      onAll: (first, total, card, again) => {
        const t = tm.read(), pass = first >= need;
        card.append(el("p", "rd-step", "Қорытынды"), el("p", "rd-sum", `Бірінші әрекеттен дұрыс: ${first} / ${total}. Нақты уақыт: ${Math.round(t.seconds)} с.`));
        if (pass) { card.append(el("p", "", "Меңгеру шегінен өттің: дәлелсіз бірде-бір үкім шығарған жоқсың.")); ctx.note("Меңгерілді. Бұл - жаттығу нәтижесі, ресми IELTS балы емес."); ctx.done({ best: Math.max(ctx.state.best || 0, first) }); }
        else {
          const b = btn("btn gold rd-again", "Қайта өту");
          b.addEventListener("click", again);
          card.append(el("p", "", `Шекке жету үшін кемінде ${need} іс бірінші әрекеттен дұрыс болуы керек. Түсіндірмелерді оқыдың, енді сол мәтінмен қайта өтіп көр (мәтін бұл жолы жаңа емес).`), b);
          ctx.note("Шекке жетпедің. Қате кеткен істердің түсіндірмесін еске түсіріп, қайта өт.");
        }
      },
    });
  }

  R.mount(root, {
    id: "ielts.reality.detective", title: "Мәтін тергеушісі",
    stages: [
      { key: "intro", title: "Кіріспе", heading: "Сөздер бірдей, ал үкім ше?", goal: "Мәлімдеменің барлық сөзі мәтінде бар. Бұл оны True ете ме? Болжа, сосын дәлелде.", render: intro },
      { key: "concept", title: "Көр", heading: "Мәлімдеме - бірнеше тұжырым", goal: "Тергеуші мәлімдемені тұжырымдарға бөліп, әрқайсысын мәтінмен жеке тексереді. Қадамдап көр.", render: concept },
      { key: "guided", title: "Бірге жаса", heading: "Дәлел сөйлемді тап", goal: "Төрт іс. Әрқайсысында мәтіннен дәл бір сөйлемді көрсет немесе ондай сөйлемнің жоқтығын раста, сосын үкім шығар.", render: guided },
      { key: "explore", title: "Өзің зертте", heading: "Бір сөз - басқа үкім", goal: "Мәлімдемедегі бір сөзді ауыстырып, үкімнің қалай және неге өзгеретінін бақыла.", render: explore },
      { key: "checkpoint", title: "Тексер", heading: "Парафраз және үкім", goal: "Парафраздарды сәйкестендір, сосын бес іске үкім шығарып, әрқайсысын дәлелде.", render: checkpoint },
      { key: "mistakes", title: "Қатені талда", heading: "Қате пайымды әшкереле", goal: "Үкім неге қате шыққанын тап: бес түрлі тұзақ.", render: mistakes },
      { key: "mastery", title: "Меңгеру", heading: "Жаңа іс: Velmora", goal: "Бұрын көрмеген мәтін, көмексіз алты іс.", render: mastery },
    ],
  });
})();
