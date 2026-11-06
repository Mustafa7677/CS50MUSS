/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Algebra: «Сызықтық теңдеу таразысы» + «Теңдеулер жүйесі: екі түзу».
   Теңдеу: (ax + b) = (cx + d), коэффициенттер - дәл бөлшектер (SAT.fr). Блоктар тек барлық мүше кіші теріс емес бүтін сан
   және шешім оң бүтін сан болғанда салынады (физикалық таразы теріс салмақты көрсете алмайды), әйтпесе - символдық режим. */
(() => {
  "use strict";
  const { svg, h, rnd, pick, fr, F, reduced } = window.SAT;
  const T = window.AO17Tutor;
  const $ = (id) => document.getElementById(id);
  if (!$("ln-svg")) return;
  const SKILL = "sat.math.linear-eq", TITLE = "SAT: сызықтық теңдеу (бір айнымалы)";
  const ZERO = F(0), ONE = F(1);

  /* ---------- өрнектер ---------- */
  const coefX = (k) => (fr.eq(k, ONE) ? "x" : fr.eq(k, F(-1)) ? "−x" : k.d === 1 ? fr.str(k) + "x" : (k.n < 0 ? "−" : "") + "(" + Math.abs(k.n) + "/" + k.d + ")x");
  function side(s) {
    const parts = [];
    if (!fr.zero(s.x)) parts.push(coefX(s.x));
    if (!fr.zero(s.c) || !parts.length) {
      if (!parts.length) parts.push(fr.str(s.c));
      else parts.push((s.c.n < 0 ? "− " : "+ ") + fr.str(F(Math.abs(s.c.n), s.c.d)));
    }
    return parts.join(" ");
  }
  const eqStr = (e) => side(e.L) + " = " + side(e.R);
  const val = (s, x) => fr.add(fr.mul(s.x, x), s.c);
  const solution = (e) => fr.div(fr.sub(e.R.c, e.L.c), fr.sub(e.L.x, e.R.x));
  const make = (a, b, c, d) => ({ L: { x: F(a), c: F(b) }, R: { x: F(c), c: F(d) } });
  /** «2x», «-x», «1/2x», «5», «−3/4» → {x: бөлшек, c: бөлшек} */
  function term(str) {
    let s = String(str).trim().replace(/−/g, "-").replace(/\s+/g, "").replace(/[()]/g, "");
    if (/x$/i.test(s)) {
      s = s.slice(0, -1);
      const k = s === "" || s === "+" ? ONE : s === "-" ? F(-1) : fr.parse(s);
      return k ? { x: k, c: ZERO } : null;
    }
    const k = fr.parse(s);
    return k ? { x: ZERO, c: k } : null;
  }

  /* ---------- күй ---------- */
  let orig, eq, hist = [], solved = false, level = "blocks", streak = 0, hintObj = null, spoiled = false, recorded = false;
  const blocksOk = (e) => {
    const all = [e.L.x, e.L.c, e.R.x, e.R.c];
    const x0 = solution(orig);
    return all.every((k) => fr.int(k) && k.n >= 0) && fr.int(x0) && x0.n > 0 && e.L.x.n + e.L.c.n <= 12 && e.R.x.n + e.R.c.n <= 12;
  };

  /* ---------- таразы суреті ---------- */
  const root = $("ln-svg");
  svg("path", { class: "sb-stand", d: "M200 92 V232 M150 240 H250" }, root);
  const beam = svg("g", { class: "sb-beam" }, root);
  svg("line", { class: "sb-bar", x1: 40, y1: 92, x2: 360, y2: 92 }, beam);
  svg("circle", { cx: 200, cy: 92, r: 6, fill: "#f2b705" }, beam);
  const pans = [90, 310].map((cx) => {
    svg("path", { class: "sb-stand", d: `M${cx - 30} 92 L${cx - 70} 196 M${cx + 30} 92 L${cx + 70} 196`, "stroke-width": 1.5 }, beam);
    svg("path", { class: "sb-pan", d: `M${cx - 78} 196 H${cx + 78} Q${cx + 70} 214 ${cx} 214 Q${cx - 70} 214 ${cx - 78} 196 Z` }, beam);
    return { cx, g: svg("g", {}, beam) };
  });
  function drawPan(p, s, blocks) {
    p.g.innerHTML = "";
    if (!blocks) {
      const t = svg("text", { class: "sb-expr", x: p.cx, y: 182, "text-anchor": "middle" }, p.g); t.textContent = side(s);
      return;
    }
    const items = [...Array(s.x.n).fill("x"), ...Array(s.c.n).fill("1")];
    items.forEach((it, i) => {
      const col = i % 5, row = Math.floor(i / 5), x = p.cx - 70 + col * 28 + 4, y = 166 - row * 28;
      if (it === "x") { svg("rect", { class: "sb-xb", x, y, width: 24, height: 26, rx: 3 }, p.g); const t = svg("text", { class: "sb-xb-t", x: x + 12, y: y + 18, "text-anchor": "middle" }, p.g); t.textContent = "x"; }
      else { svg("circle", { class: "sb-u", cx: x + 12, cy: y + 15, r: 10 }, p.g); const t = svg("text", { class: "sb-u-t", x: x + 12, y: y + 18.5, "text-anchor": "middle" }, p.g); t.textContent = "1"; }
    });
  }
  function draw(tilt = 0, view = eq) {
    const blocks = blocksOk(eq) && blocksOk(view);
    drawPan(pans[0], view.L, blocks); drawPan(pans[1], view.R, blocks);
    beam.style.transform = `rotate(${tilt}deg)`;
    $("ln-eq").textContent = eqStr(eq);
    $("ln-svg-t").textContent = `Таразы: сол жақта ${side(view.L)}, оң жақта ${side(view.R)}${tilt ? ", таразы қисайды - теңдік бұзылды" : ", тепе-теңдікте"}.`;
    $("ln-mode").textContent = blocks ? "Блок режимі: жасыл блок - x, алтын шар - 1 бірлік."
      : "Символдық режим: теңдеуде теріс сан, бөлшек немесе тым көп мүше бар (не шешімі оң бүтін емес). Нақты таразы теріс не бөлшек салмақты адал көрсете алмайды, сондықтан мүшелер жазумен көрсетіледі - ереже сол: екі жаққа бірдей амал.";
    const ol = $("ln-steps"); ol.innerHTML = "";
    hist.forEach((st) => ol.append(h("li", {}, st.after, " ", h("span", { text: "(" + st.what + ")" }))));
  }

  /* ---------- амалдар ---------- */
  const opName = (op, t) => { const v = fr.zero(t.x) ? fr.str(t.c) : coefX(t.x); return op === "-" ? `${v} алдық` : op === "+" ? `${v} қостық` : op === "/" ? `${v}-ге бөлдік` : `${v}-ге көбейттік`; };
  function apply(s, op, t) {
    if (op === "+") return { x: fr.add(s.x, t.x), c: fr.add(s.c, t.c) };
    if (op === "-") return { x: fr.sub(s.x, t.x), c: fr.sub(s.c, t.c) };
    if (op === "*") return { x: fr.mul(s.x, t.c), c: fr.mul(s.c, t.c) };
    return { x: fr.div(s.x, t.c), c: fr.div(s.c, t.c) };
  }
  function act(op, raw, where) {
    if (solved) return T.feedback($("ln-fb"), "info", "Теңдеу шешілді.", "Жаңа теңдеу таңда немесе «Бір қадам артқа» бас.");
    const t = term(raw);
    if (!t) return T.feedback($("ln-fb"), "bad", "Мүшені түсінбедім.", "Сан (5, −2, 1/2) немесе x-мүше (x, 2x, −3x) енгіз.");
    if ((op === "*" || op === "/") && !fr.zero(t.x)) return T.feedback($("ln-fb"), "bad", "x-ке көбейтуге/бөлуге болмайды.", "x-тің мәні белгісіз - ол 0 болуы мүмкін, ал 0-ге бөлуге болмайды. x-ке көбейтсең, теңдеу сызықтық емес (x² пайда болады). Сызықтық теңдеуде тек санға көбейтеміз не бөлеміз.");
    if ((op === "*" || op === "/") && fr.zero(t.c)) return T.feedback($("ln-fb"), "bad", op === "/" ? "0-ге бөлуге болмайды." : "0-ге көбейту ақпаратты жояды.", op === "/" ? "Бөлу 0-ге анықталмаған." : "Екі жағын 0-ге көбейтсең, 0 = 0 шығады - бұл кез келген x үшін ақиқат, бастапқы теңдеу туралы бәрі жоғалады.");
    if (where !== "both") {
      const x0 = solution(orig);
      const L2 = where === "left" ? apply(eq.L, op, t) : eq.L, R2 = where === "right" ? apply(eq.R, op, t) : eq.R;
      const lv = val(L2, x0), rv = val(R2, x0);
      const heavier = fr.val(lv) > fr.val(rv) ? -1 : fr.val(lv) < fr.val(rv) ? 1 : 0;
      draw(heavier * 9, { L: L2, R: R2 });
      T.feedback($("ln-fb"), "bad", `Тек ${where === "left" ? "сол" : "оң"} жаққа: таразы қисайды!`, `Бір жаққа ғана амал жасасаң, екі жақ енді тең емес: ${side(L2)} және ${side(R2)}. Мысалы, нақты шешім x = ${fr.str(x0)} болғанда сол жақ ${fr.str(lv)}, оң жақ ${fr.str(rv)} болар еді. Теңдікті сақтау үшін дәл осы амалды екінші жаққа да жаса. Таразы бұрынғы күйіне қайтарылды.`);
      setTimeout(() => draw(0), reduced() ? 1600 : 1400);
      return;
    }
    hist.push({ prev: eq, after: "", what: "" });
    eq = { L: apply(eq.L, op, t), R: apply(eq.R, op, t) };
    hist[hist.length - 1].after = eqStr(eq); hist[hist.length - 1].what = "екі жағынан " + opName(op, t);
    draw(0);
    const isoL = fr.eq(eq.L.x, ONE) && fr.zero(eq.L.c) && fr.zero(eq.R.x), isoR = fr.eq(eq.R.x, ONE) && fr.zero(eq.R.c) && fr.zero(eq.L.x);
    if (isoL || isoR) {
      solved = true;
      const x0 = isoL ? eq.R.c : eq.L.c;
      const l = val(orig.L, x0), r = val(orig.R, x0);
      T.feedback($("ln-fb"), "ok", `x = ${fr.str(x0)} - x жалғыз қалды!`, `Бастапқы теңдеуге қойып тексер: сол жақ ${side(orig.L)} = ${fr.str(l)}, оң жақ ${side(orig.R)} = ${fr.str(r)}. Тең - шешім дұрыс. Енді жауапты төмендегі өріске енгізіп, тексер.`);
    } else {
      const tips = [];
      if (!fr.zero(eq.L.x) && !fr.zero(eq.R.x)) tips.push("x екі жақта да бар - x-мүшені бір жаққа жина");
      else if ((!fr.zero(eq.L.x) && !fr.zero(eq.L.c)) || (!fr.zero(eq.R.x) && !fr.zero(eq.R.c))) tips.push("x-тің жанындағы санды екінші жаққа шығар");
      else tips.push("x-тің коэффициентіне бөл");
      T.feedback($("ln-fb"), "info", "Таразы тепе-теңдікте.", `Екі жаққа бірдей амал жасалды, сондықтан теңдік сақталды. Келесі қадам туралы ой: ${tips[0]}.`);
    }
    quick();
  }
  function quick() {
    const q = $("ln-quick"); q.innerHTML = "";
    const opts = [["-", "x", "− x"], ["+", "x", "+ x"], ["-", "1", "− 1"], ["+", "1", "+ 1"]];
    const k = !fr.zero(eq.L.x) && fr.zero(eq.R.x) ? eq.L.x : !fr.zero(eq.R.x) && fr.zero(eq.L.x) ? eq.R.x : null;
    if (k && !fr.eq(k, ONE)) opts.push(["/", fr.str(k).replace("−", "-"), "÷ " + fr.str(k)]);
    opts.forEach(([op, v, label]) => q.append(h("button", { type: "button", "aria-label": `Екі жаққа ${label}`, onclick: () => act(op, v, "both") }, label + " (екі жаққа)")));
  }
  $("ln-both").addEventListener("click", () => act($("ln-op").value, $("ln-val").value, "both"));
  $("ln-left").addEventListener("click", () => act($("ln-op").value, $("ln-val").value, "left"));
  $("ln-right").addEventListener("click", () => act($("ln-op").value, $("ln-val").value, "right"));
  $("ln-undo").addEventListener("click", () => { const st = hist.pop(); if (!st) return; eq = st.prev; solved = false; draw(0); quick(); $("ln-fb").className = ""; $("ln-fb").textContent = ""; });

  /* ---------- жауап ---------- */
  function stepsFor(e) {
    const a = e.L.x, c = e.R.x, b = e.L.c, d = e.R.c, k = fr.sub(a, c), r = fr.sub(d, b), x0 = fr.div(r, k);
    const s1 = { L: { x: k, c: b }, R: { x: ZERO, c: d } };
    const s2 = { L: { x: k, c: ZERO }, R: { x: ZERO, c: r } };
    const out = [];
    if (!fr.zero(c)) out.push(`екі жағынан ${coefX(c)} ал: ${eqStr(s1)}`);
    if (!fr.zero(b)) out.push(`екі жағынан ${fr.str(b)} ал: ${eqStr(s2)}`);
    if (!fr.eq(k, ONE)) out.push(`екі жағын ${fr.str(k)}-ге бөл: x = ${fr.str(x0)}`);
    return out.map((t, i) => `${i + 1}) ${t}.`).join(" ") + ` Жауап: x = ${fr.str(x0)}.`;
  }
  function setHints() {
    const steps = ["Мақсат - x-ті жалғыз қалдыру. Алдымен x-мүшелерді бір жаққа жина (кіші x-мүшені екі жақтан ал), сосын сандарды екінші жаққа шығар, соңында x-тің коэффициентіне бөл.",
      "Ұқсас мысал: 5x + 2 = 3x + 10 → екі жақтан 3x: 2x + 2 = 10 → екі жақтан 2: 2x = 8 → екі жағын 2-ге бөл: x = 4.",
      "Шешім: " + stepsFor(orig)];
    if (!hintObj) hintObj = T.hints($("ln-h"), steps, { onSolution: () => { spoiled = true; T.feedback($("ln-afb"), "info", "Шешім ашылды - бұл теңдеу меңгеруге саналмайды.", "Таразыда қадамдарды өзің қайтала, содан кейін жаңа теңдеу таңда."); } });
    else hintObj.reset(steps);
  }
  $("ln-check").addEventListener("click", () => {
    const v = fr.parse($("ln-ans").value);
    if (!v) return T.feedback($("ln-afb"), "info", "Санды енгіз.", "Бүтін сан (−2), бөлшек (5/3) немесе ондық бөлшек (2.5) жарайды.");
    const x0 = solution(orig), ok = fr.eq(v, x0);
    let why;
    if (ok) why = `Тексеру: ${side(orig.L)} = ${fr.str(val(orig.L, x0))} және ${side(orig.R)} = ${fr.str(val(orig.R, x0))}.${x0.d !== 1 ? " Бөлшек жауапты SAT-та 5/3 түрінде де, 1.666 / 1.667 түрінде де енгізуге болады." : ""}`;
    else {
      const l = val(orig.L, v), r = val(orig.R, v);
      why = `x = ${fr.str(v)} қойсақ: сол жақ ${fr.str(l)}, оң жақ ${fr.str(r)} - тең емес. ` + (fr.eq(v, fr.mul(x0, F(-1))) ? "Таңба қатесі: мүшені екінші жаққа шығарғанда таңбасы өзгереді (екі жақтан алғанда)." : fr.eq(v, fr.sub(orig.R.c, orig.L.c)) ? "Сандарды дұрыс жинадың, бірақ x-тің коэффициентіне бөлуді ұмыттың." : "Таразыда қадам-қадаммен шешіп көр.");
    }
    T.feedback($("ln-afb"), ok ? "ok" : "bad", ok ? `Дұрыс: x = ${fr.str(x0)}.` : "Әлі емес.", why);
    if (!recorded) {
      const hints = spoiled ? 3 : hintObj.used();
      T.record(SKILL, { item: eqStr(orig), ok, hints, error: ok ? "" : "value", note: ok ? "" : why, title: TITLE });
      if (ok) recorded = true;
      streak = ok && !hints ? streak + 1 : 0;
      prog();
    }
  });
  const prog = () => ($("ln-prog").textContent = `Көмексіз қатарынан: ${Math.min(3, streak)} / 3 · деңгей: ${T.mastery(SKILL).level}`);

  /* ---------- генератор ---------- */
  function gen(lv) {
    for (;;) {
      let a, b, c, d;
      if (lv === "blocks") {
        const x0 = rnd(1, 5); c = rnd(0, 2); a = c + rnd(1, 3); b = rnd(0, 6); d = (a - c) * x0 + b;
        if (Math.random() < 0.5) [a, b, c, d] = [c, d, a, b]; // кейде x көп жағы оңда
        const e = make(a, b, c, d); orig = e;
        if (blocksOk(e)) return e;
      } else {
        a = rnd(-4, 6); c = rnd(-4, 6); b = rnd(-9, 9); d = rnd(-9, 9);
        if (a === c || a === 0 && c === 0) continue;
        const e = make(a, b, c, d), x0 = solution(e);
        if (lv === "neg" && fr.int(x0) && x0.n < 0 && x0.n >= -9) return e;
        if (lv === "frac" && !fr.int(x0) && x0.d <= 6 && Math.abs(fr.val(x0)) < 10) return e;
      }
    }
  }
  function load(e) {
    orig = e; eq = e; hist = []; solved = false; spoiled = false; recorded = false;
    $("ln-ans").value = ""; ["ln-fb", "ln-afb"].forEach((id) => { $(id).className = ""; $(id).textContent = ""; });
    setHints(); draw(0); quick(); prog();
  }
  document.querySelectorAll("[data-lv]").forEach((b) => b.addEventListener("click", () => {
    level = b.dataset.lv;
    document.querySelectorAll("[data-lv]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    load(gen(level));
    $("ln-eq").scrollIntoView({ block: "center", behavior: "instant" });
  }));
  T.badge($("ln-badge"), SKILL, TITLE);
  load(make(3, 5, 2, 9));

  /* ================= Теңдеулер жүйесі ================= */
  const SS = "sat.math.systems", ST = "SAT: екі айнымалылы сызықтық жүйе";
  const sy = $("sy-svg"), S = 20, C = 200, px = (x) => C + S * x, py = (y) => C - S * y;
  for (let i = -10; i <= 10; i++) {
    if (!i) continue;
    svg("line", { class: "lb-grid", x1: px(i), y1: 0, x2: px(i), y2: 400 }, sy);
    svg("line", { class: "lb-grid", x1: 0, y1: py(i), x2: 400, y2: py(i) }, sy);
    if (i % 2 === 0) { svg("text", { class: "sb-tick", x: px(i), y: C + 14, "text-anchor": "middle" }, sy).textContent = window.SAT.num(i); svg("text", { class: "sb-tick", x: C - 5, y: py(i) + 4, "text-anchor": "end" }, sy).textContent = window.SAT.num(i); }
  }
  svg("line", { class: "lb-axis", x1: 0, y1: C, x2: 400, y2: C }, sy);
  svg("line", { class: "lb-axis", x1: C, y1: 0, x2: C, y2: 400 }, sy);
  const l1 = svg("line", { class: "lb-curve" }, sy), l2 = svg("line", { class: "sb-line2" }, sy);
  const t1 = svg("text", { class: "sb-lbl" }, sy), t2 = svg("text", { class: "sb-lbl", fill: "#7fc4ad" }, sy);
  const dot = svg("circle", { class: "sb-vtx", r: 7, visibility: "hidden" }, sy);
  let sys = null, syRecorded = false, syHints = null, sySpoiled = false;
  const n = window.SAT.num;
  const sub = (A, B, inner) => `${A === 1 ? "" : A === -1 ? "−" : n(A)}x ${B < 0 ? "−" : "+"} ${Math.abs(B) === 1 ? "" : Math.abs(B) + "·"}(${inner})`;
  const lineStr = (m, b) => `${m === 1 ? "" : m === -1 ? "−" : n(m)}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`;
  const yStr = (m, b) => { const parts = []; if (m) parts.push(m === 1 ? "x" : m === -1 ? "−x" : window.SAT.num(m) + "x"); if (b || !parts.length) parts.push(parts.length ? (b < 0 ? "− " : "+ ") + Math.abs(b) : window.SAT.num(b)); return "y = " + parts.join(" "); };
  const stdStr = (A, B, Cc) => { const a = A === 1 ? "x" : A === -1 ? "−x" : window.SAT.num(A) + "x"; const b = Math.abs(B) === 1 ? "y" : Math.abs(B) + "y"; return (A ? a + (B < 0 ? " − " : " + ") + b : (B < 0 ? "−" : "") + b) + " = " + window.SAT.num(Cc); };
  function genSys() {
    for (;;) {
      const x0 = rnd(-5, 5), y0 = rnd(-5, 5), m1 = pick([-3, -2, -1, 1, 2, 3]), b1 = y0 - m1 * x0;
      const A = pick([-3, -2, -1, 1, 2, 3]), B = pick([1, 2, -1]), Cc = A * x0 + B * y0;
      if (Math.abs(b1) > 9 || Math.abs(Cc) > 15 || A + B * m1 === 0 || (sys && sys.x0 === x0 && sys.y0 === y0)) continue;
      return { x0, y0, m1, b1, A, B, C: Cc };
    }
  }
  function lineSeg(el, f) { el.setAttribute("x1", px(-11)); el.setAttribute("y1", py(f(-11))); el.setAttribute("x2", px(11)); el.setAttribute("y2", py(f(11))); }
  function showSys() {
    sys = genSys(); syRecorded = false; sySpoiled = false;
    const { m1, b1, A, B, C: Cc } = sys;
    $("sy-eqs").textContent = `${yStr(m1, b1)}  және  ${stdStr(A, B, Cc)}`;
    lineSeg(l1, (x) => m1 * x + b1); lineSeg(l2, (x) => (Cc - A * x) / B);
    const lx = 6, ly1 = m1 * lx + b1;
    t1.setAttribute("x", px(lx) + 4); t1.setAttribute("y", Math.max(14, Math.min(392, py(ly1) - 6))); t1.textContent = "(1)";
    t2.setAttribute("x", px(-lx) - 26); t2.setAttribute("y", Math.max(14, Math.min(392, py((Cc - A * -lx) / B) - 6))); t2.textContent = "(2)";
    dot.setAttribute("visibility", "hidden");
    $("sy-svg-t").textContent = `Екі түзу: (1) ${yStr(m1, b1)} - алтын, (2) ${stdStr(A, B, Cc)} - жасыл.`;
    ["sy-x", "sy-y"].forEach((id) => ($(id).value = ""));
    $("sy-fb").className = ""; $("sy-fb").textContent = "";
    $("sy-steps").hidden = true;
    const k = A + B * m1, rhs = Cc - B * b1;
    const steps = ["Шешім - екі түзудің қиылысу нүктесі. Графиктен шамамен оқып, содан кейін есеппен нақтыла: (1)-теңдеуде y өрнектелген - оны (2)-ге қой.",
      "Ұқсас мысал: y = 2x − 1 және x + y = 8. Алмастыр: x + (2x − 1) = 8 → 3x = 9 → x = 3, y = 2·3 − 1 = 5. Жауап (3, 5).",
      `Шешім: (1)-ді (2)-ге қой: ${sub(A, B, lineStr(m1, b1))} = ${n(Cc)} → ${n(k)}x = ${n(rhs)} → x = ${n(sys.x0)}, y = ${n(sys.y0)}. Жауап (${n(sys.x0)}, ${n(sys.y0)}).`];
    if (!syHints) syHints = T.hints($("sy-h"), steps, { onSolution: () => { sySpoiled = true; } }); else syHints.reset(steps);
  }
  function subSteps() {
    const { m1, b1, A, B, C: Cc, x0, y0 } = sys, ol = $("sy-steps"), k = A + B * m1, rhs = Cc - B * b1;
    ol.innerHTML = "";
    [[`(1)-ден y = ${lineStr(m1, b1)}`, "y өрнектелген"],
      [`(2)-ге қоямыз: ${sub(A, B, lineStr(m1, b1))} = ${n(Cc)}`, "алмастыру"],
      [`${n(k)}x ${B * b1 < 0 ? "−" : "+"} ${Math.abs(B * b1)} = ${n(Cc)}`, "жақшаны аштық, x-терді жинадық"],
      [`${n(k)}x = ${n(rhs)} → x = ${n(x0)}`, "екі жақтан санды алып, коэффициентке бөлдік"],
      [`y = ${n(m1)}·(${n(x0)}) ${b1 < 0 ? "−" : "+"} ${Math.abs(b1)} = ${n(y0)}`, "x-ті (1)-ге қойдық"],
      [`Тексеру (2): ${n(A)}·(${n(x0)}) + ${n(B)}·(${n(y0)}) = ${n(A * x0 + B * y0)} ✓`, "екі теңдеу де орындалды"]].forEach(([a, b]) => ol.append(h("li", {}, a, " ", h("span", { text: "(" + b + ")" }))));
    ol.hidden = false;
  }
  $("sy-check").addEventListener("click", () => {
    const x = fr.parse($("sy-x").value), y = fr.parse($("sy-y").value);
    if (!x || !y) return T.feedback($("sy-fb"), "info", "x пен y-ті енгіз.", "Екі сан да керек: жүйенің шешімі - нүкте.");
    const { m1, b1, A, B, C: Cc, x0, y0 } = sys, X = fr.val(x), Y = fr.val(y);
    const ok1 = Math.abs(Y - (m1 * X + b1)) < 1e-9, ok2 = Math.abs(A * X + B * Y - Cc) < 1e-9, ok = ok1 && ok2;
    let why;
    if (ok) why = `(${x0}, ${y0}) екі теңдеуді де қанағаттандырады - бұл түзулердің қиылысу нүктесі.`;
    else if (X === y0 && Y === x0) why = "x пен y орын ауыстырған: нүкте (x, y) ретімен жазылады.";
    else if (ok1) why = `Бұл нүкте тек (1)-түзудің бойында жатыр, (2)-ні қанағаттандырмайды: ${A}·${X} + ${B}·${Y} = ${A * X + B * Y} ≠ ${Cc}. Шешім екі түзуге де ортақ болуы керек.`;
    else if (ok2) why = `Бұл нүкте тек (2)-түзудің бойында жатыр: (1)-ге қойсақ y = ${m1 * X + b1}, ал сенде ${Y}.`;
    else why = "Бұл нүкте ешбір түзудің бойында жатқан жоқ. Графиктен қиылысуды тауып, алмастырумен тексер.";
    T.feedback($("sy-fb"), ok ? "ok" : "bad", ok ? `Дұрыс: (${x0}, ${y0}).` : "Әлі емес.", why);
    if (ok) { dot.setAttribute("cx", px(x0)); dot.setAttribute("cy", py(y0)); dot.setAttribute("visibility", "visible"); subSteps(); }
    if (!syRecorded) { T.record(SS, { item: $("sy-eqs").textContent, ok, hints: sySpoiled ? 3 : syHints.used(), error: ok ? "" : ok1 || ok2 ? "one-line" : "neither", note: ok ? "" : why, title: ST }); if (ok) syRecorded = true; }
  });
  $("sy-new").addEventListener("click", showSys);
  T.badge($("sy-badge"), SS, ST);
  showSys();
  window.SAT.linear = { orig: () => orig, eq: () => eq, sys: () => sys }; // тесттер үшін
})();
