/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Geometry зертханасы: үшбұрыш бұрыштарының қосындысы (қадамдық дәлел), ұқсас үшбұрыштар (DE ∥ BC), Пифагор теоремасы
   (қабырғалардағы квадраттар), шеңбер: доға ұзындығы, сектор ауданы, орталық және іштей сызылған бұрыш.
   Барлық нүкте сүйреледі (тінтуір/саусақ/пернетақта), өлшемдер бірден есептеледі. */
(() => {
  "use strict";
  const { svg, num, rnd, pick } = window.SAT;
  const M = window.SATM, T = window.AO17Tutor;
  const $ = (id) => document.getElementById(id);
  const root = $("g-svg");
  if (!root || !M) return;
  const SKILL = "sat.math.geometry", TITLE = "SAT Geometry: үшбұрыш және шеңбер";
  const B = M.board(root, { x: [0, 12], y: [0, 12], axes: false });
  const r1 = (v) => num(M.round(v, 1));
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const angAt = (v, p, q) => { const a = [p[0] - v[0], p[1] - v[1]], b = [q[0] - v[0], q[1] - v[1]]; return M.deg(Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)))))); };
  const P = (p) => [B.px(p[0]), B.py(p[1])];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const snap = (v, s = 0.5) => Math.round(v / s) * s;
  /** Бұрыш доғасы (пиксельде): v төбесінде p және q бағыттары арасындағы кіші бұрыш. dir: q-ға бағыт векторы ретінде де беруге болады. */
  function wedge(g, v, p, q, r, cls, label) {
    const [X, Y] = P(v), [px, py] = P(p), [qx, qy] = P(q);
    const a1 = Math.atan2(py - Y, px - X); let d = Math.atan2(qy - Y, qx - X) - a1;
    while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
    const a2 = a1 + d;
    svg("path", { class: "sm-wedge " + (cls || ""), d: `M${X} ${Y}L${X + r * Math.cos(a1)} ${Y + r * Math.sin(a1)}A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${X + r * Math.cos(a2)} ${Y + r * Math.sin(a2)}Z` }, g);
    if (label) { const m = a1 + d / 2, t = svg("text", { class: "sm-t " + ({ "": "g", b: "m", c: "r" }[cls || ""] || ""), x: clamp(X + (r + 16) * Math.cos(m), 14, 386), y: clamp(Y + (r + 16) * Math.sin(m) + 4, 12, 396), "text-anchor": "middle" }, g); t.textContent = label; }
  }
  const poly = (g, pts, cls) => svg("polygon", { class: cls || "sm-poly", points: pts.map((p) => P(p).join(",")).join(" ") }, g);
  const seg = (g, p, q, cls) => svg("line", { class: cls || "sm-line", x1: P(p)[0], y1: P(p)[1], x2: P(q)[0], y2: P(q)[1] }, g);
  const lbl = (g, p, t, dx = 0, dy = 0, cls = "") => { const e = svg("text", { class: "sb-lbl " + cls, x: clamp(P(p)[0] + dx, 10, 390), y: clamp(P(p)[1] + dy, 14, 396), "text-anchor": "middle" }, g); e.textContent = t; return e; };
  /** Төбе атауларын центроидтан сыртқа қарай қою (бұрыш белгілерімен қабаттаспасын). */
  function vlab(g, list) {
    const cx = list.reduce((s, [p]) => s + P(p)[0], 0) / list.length, cy = list.reduce((s, [p]) => s + P(p)[1], 0) / list.length;
    list.forEach(([p, t]) => { const [X, Y] = P(p), d = Math.hypot(X - cx, Y - cy) || 1; const e = svg("text", { class: "sb-lbl", x: clamp(X + ((X - cx) / d) * 20, 10, 390), y: clamp(Y + ((Y - cy) / d) * 20 + 5, 14, 396), "text-anchor": "middle" }, g); e.textContent = t; });
  }
  const read = (items) => { const ul = $("g-read"); ul.innerHTML = ""; items.forEach(([k, v, hot]) => { const li = document.createElement("li"); if (hot) li.className = "hot"; li.append(k); const b = document.createElement("b"); b.textContent = v; li.append(b); ul.append(li); }); };
  const live = (t) => { $("g-live").textContent = t; };

  /* ---------- күй ---------- */
  const st = {
    tab: "tri", step: 0,
    tri: { A: [1.5, 1.5], B: [10.5, 2.5], C: [4.5, 9.5] },
    sim: { A: [1, 1.5], B: [11, 1.5], C: [4, 10.5], t: 0.6 },
    py: { a: 3, b: 4 },
    cir: { r: 4, p: 30, q: 120, v: 250 },
  };
  const O = [6, 6];
  const onCircle = (ang, r = st.cir.r) => [O[0] + r * Math.cos(M.rad(ang)), O[1] + r * Math.sin(M.rad(ang))];
  const gFig = B.layer("fig"), gPts = B.layer("pts");
  let pts = [];

  /* ---------- 1. үшбұрыш бұрыштары ---------- */
  const STEPS = ["Кез келген үшбұрыш: төбелерін сүйре.", "C төбесі арқылы AB-ға параллель түзу жүргіземіз.", "Айқыш бұрыштар (параллель түзулер мен AC қиюшысы): C-дағы алтын бұрыш = ∠A.", "Дәл солай BC қиюшысы үшін: жасыл бұрыш = ∠B.", "C-да үш бұрыш қатар тұр және бір түзуді құрайды: ∠A + ∠C + ∠B = 180° (жазыңқы бұрыш)."];
  function drawTri() {
    const g = B.clear("fig"), { A, B: Bv, C } = st.tri;
    poly(g, [A, Bv, C]);
    const a = angAt(A, Bv, C), b = angAt(Bv, A, C), c = 180 - a - b;
    wedge(g, A, Bv, C, 26, "", r1(a) + "°"); wedge(g, Bv, A, C, 26, "b", r1(b) + "°"); wedge(g, C, A, Bv, 30, "c", st.step >= 4 ? "" : r1(c) + "°");
    const s = st.step;
    if (s >= 1) { const d = [Bv[0] - A[0], Bv[1] - A[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L]; seg(g, [C[0] - u[0] * 30, C[1] - u[1] * 30], [C[0] + u[0] * 30, C[1] + u[1] * 30], "sm-dash"); }
    if (s >= 2) wedge(g, C, [C[0] + A[0] - Bv[0], C[1] + A[1] - Bv[1]], A, 44, "", r1(a) + "°");
    if (s >= 3) wedge(g, C, [C[0] + Bv[0] - A[0], C[1] + Bv[1] - A[1]], Bv, 44, "b", r1(b) + "°");
    if (s >= 4) { const t = lbl(g, C, "180°", 0, -44, "sm-t g"); t.setAttribute("class", "sm-t g"); }
    vlab(g, [[A, "A"], [Bv, "B"], [C, "C"]]);
    read([["∠A", r1(a) + "°"], ["∠B", r1(b) + "°"], ["∠C", r1(c) + "°"], ["∠A + ∠B + ∠C", r1(a + b + c) + "°", true]]);
    root.querySelector("title").textContent = `Үшбұрыш ABC: ∠A = ${r1(a)}°, ∠B = ${r1(b)}°, ∠C = ${r1(c)}°, қосындысы 180°.`;
    $("g-steps").querySelectorAll("li").forEach((li, i) => li.classList.toggle("on", i === s));
  }

  /* ---------- 2. ұқсас үшбұрыштар ---------- */
  function simPts() { const { A, B: Bv, C, t } = st.sim; return { A, B: Bv, C, D: [A[0] + t * (Bv[0] - A[0]), A[1] + t * (Bv[1] - A[1])], E: [A[0] + t * (C[0] - A[0]), A[1] + t * (C[1] - A[1])] }; }
  function drawSim() {
    const g = B.clear("fig"), { A, B: Bv, C, D, E } = simPts();
    poly(g, [A, Bv, C]); poly(g, [A, D, E], "sm-poly2");
    seg(g, D, E, "sm-mint"); seg(g, Bv, C, "sm-gold");
    wedge(g, A, Bv, C, 22, "c"); wedge(g, D, A, E, 18, "b"); wedge(g, Bv, A, C, 18, "b");
    vlab(g, [[A, "A"], [Bv, "B"], [C, "C"]]); lbl(g, D, "D", 0, 22); lbl(g, E, "E", -16, -4);
    const ad = dist(A, D), ab = dist(A, Bv), de = dist(D, E), bc = dist(Bv, C), ae = dist(A, E), ac = dist(A, C);
    read([["AD / AB", `${r1(ad)} / ${r1(ab)} = ${num(M.round(ad / ab, 2))}`, true], ["DE / BC", `${r1(de)} / ${r1(bc)} = ${num(M.round(de / bc, 2))}`, true], ["AE / AC", `${r1(ae)} / ${r1(ac)} = ${num(M.round(ae / ac, 2))}`, true], ["AD / DB", `${r1(ad)} / ${r1(ab - ad)} = ${num(M.round(ad / (ab - ad), 2))}`]]);
    root.querySelector("title").textContent = `DE ∥ BC: ADE және ABC ұқсас, ұқсастық коэффициенті ${num(M.round(ad / ab, 2))}.`;
  }

  /* ---------- 3. Пифагор ---------- */
  const PO = [4, 4];
  function drawPy() {
    const g = B.clear("fig"), { a, b } = st.py, Bp = [PO[0] + a, PO[1]], Cp = [PO[0], PO[1] + b], c = Math.hypot(a, b);
    poly(g, [PO, [PO[0] + a, PO[1]], [PO[0] + a, PO[1] - a], [PO[0], PO[1] - a]], "sm-sq");
    poly(g, [PO, [PO[0] - b, PO[1]], [PO[0] - b, PO[1] + b], [PO[0], PO[1] + b]], "sm-sq b");
    poly(g, [Bp, Cp, [Cp[0] + b, Cp[1] + a], [Bp[0] + b, Bp[1] + a]], "sm-sq c");
    poly(g, [PO, Bp, Cp]);
    svg("path", { class: "sm-line", d: `M${B.px(PO[0] + 0.5)} ${B.py(PO[1])}V${B.py(PO[1] + 0.5)}H${B.px(PO[0])}` }, g);
    lbl(g, [PO[0] + a / 2, PO[1] - a / 2], `a² = ${a * a}`, 0, 5, "sm-t g").setAttribute("class", "sm-t g");
    lbl(g, [PO[0] - b / 2, PO[1] + b / 2], `b² = ${b * b}`, 0, 5).setAttribute("class", "sm-t m");
    lbl(g, [PO[0] + (a + b) / 2, PO[1] + (a + b) / 2], `c² = ${a * a + b * b}`, 0, 5).setAttribute("class", "sm-t r");
    lbl(g, [PO[0] + a / 2, PO[1]], `a = ${a}`, 0, -6); lbl(g, [PO[0], PO[1] + b / 2], `b = ${b}`, 24, 4);
    const exact = Number.isInteger(c) ? String(c) : `√${a * a + b * b} ≈ ${num(M.round(c, 2))}`;
    read([["a²", String(a * a)], ["b²", String(b * b)], ["a² + b²", String(a * a + b * b), true], ["c (гипотенуза)", exact, true]]);
    root.querySelector("title").textContent = `Тікбұрышты үшбұрыш: катеттері ${a} және ${b}, гипотенузасы ${exact}. Квадраттар аудандары: ${a * a} + ${b * b} = ${a * a + b * b}.`;
  }

  /* ---------- 4. шеңбер ---------- */
  const norm = (d) => ((d % 360) + 360) % 360;
  function drawCir() {
    const g = B.clear("fig"), { r, p, q, v } = st.cir, Pp = onCircle(p), Qp = onCircle(q), Vp = onCircle(v);
    const th = norm(q - p), inMinor = norm(v - p) < th, insc = inMinor ? (360 - th) / 2 : th / 2;
    svg("circle", { class: "sm-line", cx: B.px(O[0]), cy: B.py(O[1]), r: B.len(r) }, g);
    const R = B.len(r), [X, Y] = P(O), [x1, y1] = P(Pp), [x2, y2] = P(Qp);
    // сектор (P-дан Q-ға сағат тіліне қарсы; SVG-де y төмен, сондықтан sweep = 0)
    svg("path", { class: "sm-wedge", d: `M${X} ${Y}L${x1} ${y1}A${R} ${R} 0 ${th > 180 ? 1 : 0} 0 ${x2} ${y2}Z` }, g);
    svg("path", { class: "sm-gold", d: `M${x1} ${y1}A${R} ${R} 0 ${th > 180 ? 1 : 0} 0 ${x2} ${y2}` }, g);
    seg(g, Vp, Pp, "sm-mint"); seg(g, Vp, Qp, "sm-mint");
    wedge(g, Vp, Pp, Qp, 22, "b", r1(insc) + "°");
    lbl(g, O, "O", -10, 18); lbl(g, Pp, "P", (Pp[0] - O[0]) * 5, -(Pp[1] - O[1]) * 5 + 4); lbl(g, Qp, "Q", (Qp[0] - O[0]) * 5, -(Qp[1] - O[1]) * 5 + 4); lbl(g, Vp, "V", (Vp[0] - O[0]) * 5, -(Vp[1] - O[1]) * 5 + 4);
    const tl = svg("text", { class: "sm-t g", x: X, y: Y - 12, "text-anchor": "middle" }, g); tl.textContent = r1(th) + "°";
    const k = (2 * r * th) / 360, ka = (r * r * th) / 360;
    read([["орталық ∠POQ", r1(th) + "°", true], ["іштей ∠PVQ", r1(insc) + "°", true], ["доға PQ", `${num(M.round(k, 3))}π ≈ ${num(M.round(k * Math.PI, 2))}`], ["сектор ауданы", `${num(M.round(ka, 3))}π ≈ ${num(M.round(ka * Math.PI, 2))}`], ["радиус", String(r)]]);
    $("g-cir-note").textContent = inMinor
      ? `V нүктесі алтын доғаның өзінде тұр, сондықтан ∠PVQ екінші (үлкен) доғаға тіреледі: (360° − ${r1(th)}°)/2 = ${r1(insc)}°.`
      : `∠PVQ алтын доғаға тіреледі - ол орталық бұрыштың жартысы: ${r1(th)}°/2 = ${r1(insc)}°.`;
    root.querySelector("title").textContent = `Шеңбер, радиус ${r}: орталық бұрыш ${r1(th)}°, іштей сызылған бұрыш ${r1(insc)}°, доға ${num(M.round(k, 3))}π.`;
  }

  /* ---------- нүктелер ---------- */
  function mkPts() {
    B.clear("pts"); pts = [];
    const add = (o) => pts.push(M.dragPoint(B, gPts, Object.assign({ onEnd: speak }, o)));
    const lim = (v) => clamp(snap(v), 0.5, 11.5);
    if (st.tab === "tri") for (const [n, cls] of [["A", ""], ["B", "b"], ["C", "c"]]) add({ name: n, showName: false, cls, step: 0.5, get: () => st.tri[n], set: (x, y) => { st.tri[n] = [lim(x), lim(y)]; redraw(); }, label: (x, y) => `${n} төбесі (${num(x)}, ${num(y)})` });
    if (st.tab === "sim") {
      for (const n of ["A", "B", "C"]) add({ name: "", step: 0.5, get: () => st.sim[n], set: (x, y) => { st.sim[n] = [lim(x), lim(y)]; redraw(); }, label: (x, y) => `${n} төбесі (${num(x)}, ${num(y)})` });
      add({ cls: "b", get: () => simPts().D, step: 0.05, set: (x, y, how, k) => { const { A, B: Bv } = st.sim; let t; if (how === "key") t = st.sim.t + (k[0] || k[1]) * 0.05; else { const d = [Bv[0] - A[0], Bv[1] - A[1]]; t = ((x - A[0]) * d[0] + (y - A[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2); } st.sim.t = clamp(Math.round(t * 20) / 20, 0.15, 0.9); redraw(); }, label: () => `D нүктесі AB бойында, AD/AB = ${num(st.sim.t)}`, keyHelp: "D тек AB бойымен жүреді" });
    }
    if (st.tab === "py") {
      add({ name: "", step: 1, get: () => [PO[0] + st.py.a, PO[1]], set: (x, y, how, k) => { st.py.a = clamp(how === "key" ? st.py.a + (k[0] || k[1]) : Math.round(x - PO[0]), 1, 4); redraw(); }, label: () => `a катеті = ${st.py.a}`, keyHelp: "тек көлденең" });
      add({ name: "", cls: "b", step: 1, get: () => [PO[0], PO[1] + st.py.b], set: (x, y, how, k) => { st.py.b = clamp(how === "key" ? st.py.b + (k[1] || k[0]) : Math.round(y - PO[1]), 1, 4); redraw(); }, label: () => `b катеті = ${st.py.b}`, keyHelp: "тек тік" });
    }
    if (st.tab === "cir") for (const [n, cls] of [["p", ""], ["q", ""], ["v", "b"]]) add({ cls, get: () => onCircle(st.cir[n]), set: (x, y, how, k) => { st.cir[n] = norm(how === "key" ? st.cir[n] + 5 * (k[0] || k[1]) : Math.round(M.deg(Math.atan2(y - O[1], x - O[0])) / 5) * 5); redraw(); }, label: () => `${n.toUpperCase()} нүктесі шеңберде, ${st.cir[n]}°`, keyHelp: "шеңбер бойымен 5°-тан" });
  }
  function redraw() { ({ tri: drawTri, sim: drawSim, py: drawPy, cir: drawCir })[st.tab](); pts.forEach((p) => p.update()); }
  function speak() {
    if (st.tab === "tri") { const { A, B: Bv, C } = st.tri, a = angAt(A, Bv, C), b = angAt(Bv, A, C); live(`∠A = ${r1(a)}°, ∠B = ${r1(b)}°, ∠C = ${r1(180 - a - b)}°. Қосынды әрдайым 180°.`); }
    if (st.tab === "sim") { const { A, B: Bv, D, E, C } = simPts(); live(`AD/AB = ${num(M.round(dist(A, D) / dist(A, Bv), 2))}, DE/BC = ${num(M.round(dist(D, E) / dist(Bv, C), 2))} - қатынастар тең.`); }
    if (st.tab === "py") live(`${st.py.a}² + ${st.py.b}² = ${st.py.a ** 2 + st.py.b ** 2} = c², c ≈ ${num(M.round(Math.hypot(st.py.a, st.py.b), 2))}.`);
    if (st.tab === "cir") { const th = norm(st.cir.q - st.cir.p); live(`Орталық бұрыш ${th}°, доға ${num(M.round((2 * st.cir.r * th) / 360, 3))}π.`); }
  }
  const PANES = { tri: "g-p-tri", sim: "g-p-sim", py: "g-p-py", cir: "g-p-cir" };
  const tabsCtl = M.tabs($("g-tabs"), [["tri", "Үшбұрыш бұрыштары"], ["sim", "Ұқсас үшбұрыштар"], ["py", "Пифагор"], ["cir", "Шеңбер"]], (id) => {
    st.tab = id; Object.entries(PANES).forEach(([k, e]) => ($(e).hidden = k !== id)); mkPts(); redraw(); speak();
  });
  $("g-r").addEventListener("input", (e) => { st.cir.r = +e.target.value; $("g-rv").textContent = e.target.value; redraw(); speak(); });

  /* ---------- болжам ---------- */
  const lock = (on) => { root.classList.toggle("sat-locked", on); gPts.style.display = on ? "none" : ""; $("g-tabs").querySelectorAll("button").forEach((b) => (b.disabled = on)); $("g-lock").hidden = !on; };
  lock(true);
  M.predict($("g-predict"), {
    q: "Үшбұрыштың бір төбесін алысқа тартып, оны ұзын әрі жіңішке етсек, үш бұрышының қосындысы қалай өзгереді?",
    opts: [
      { id: "up", t: "Өседі", why: "Бір бұрыш үлкейгенде қалған екеуі дәл сонша кішірейеді. Төбелерді сүйреп, қосындыны бақыла - ол 180°-тан ауытқымайды. Төмендегі қадамдық дәлел себебін көрсетеді." },
      { id: "down", t: "Кемиді", why: "Жіңішке үшбұрыштың бұрыштары кішкентай көрінеді, бірақ үшінші бұрыш 180°-қа жақындайды. Қосынды өзгермейді - тақтада тексер." },
      { id: "same", t: "180° болып қалады", ok: true, why: "Кез келген жазық үшбұрышта ∠A + ∠B + ∠C = 180°. Неге екенін қадамдық дәлел көрсетеді: үш бұрыш бір түзудің бойына жиналады." },
    ],
    onDone: () => { lock(false); window.SAT.focus(pts[2] && pts[2].el); },
  });
  M.stepper($("g-step"), { n: STEPS.length, names: STEPS.map((s) => s.split(":")[0].split(".")[0]), show: (i) => { st.step = i; if (st.tab !== "tri") tabsCtl.sel("tri"); else redraw(); } });
  const ol = $("g-steps"); STEPS.forEach((s) => { const li = document.createElement("li"); li.textContent = s; ol.append(li); });
  tabsCtl.sel("tri");

  /* ---------- 1-тапсырма: доға ұзындығы (қате түрін атайды) ---------- */
  T.badge($("g-badge"), SKILL, TITLE);
  /** Шеңбер есебінің диагностикасы. want: "arc" | "area"; r, th. Жауап π-сіз (коэффициент) күтіледі; π-мен енгізілсе де қабылданады. */
  function diagCircle(v, want, r, th) {
    const arc = (2 * r * th) / 360, area = (r * r * th) / 360, half = (r * th) / 360, dia = (4 * r * th) / 360;
    const right0 = want === "arc" ? arc : area;
    const cv = !M.near(v, right0, 0.005) && M.near(v / Math.PI, right0, 0.002) ? v / Math.PI : null;
    if (cv !== null) v = cv;
    const right = want === "arc" ? arc : area;
    if (M.near(v, right, 0.005)) return { ok: true, why: `${want === "arc" ? "Доға" : "Сектор ауданы"} = ${num(M.round(right, 3))}π.${cv !== null ? " (π-мен бірге жаздың - коэффициент " + num(M.round(right, 3)) + " болғаны дұрыс.)" : ""}` };
    if (want === "arc" && M.near(v, area, 0.005)) return { code: "area-vs-arc", why: `${num(M.round(area, 3))} - сектор АУДАНЫ (πr² · θ/360). Доға - шеңбердің бөлігі, сондықтан шеңбер ұзындығы 2πr-дан бастаймыз: 2π·${r}·${th}/360.` };
    if (want === "area" && M.near(v, arc, 0.005)) return { code: "arc-vs-area", why: `${num(M.round(arc, 3))} - доғаның ҰЗЫНДЫҒЫ (2πr · θ/360). Аудан үшін дөңгелек ауданы πr² керек: π·${r}²·${th}/360.` };
    if (want === "arc" && M.near(v, half, 0.005)) return { code: "pi-r", why: `Шеңбер ұзындығы 2πr, ал πr емес - 2 көбейткіші түсіп қалды: 2·${r}·${th}/360 = ${num(M.round(arc, 3))}.` };
    if (want === "arc" && M.near(v, dia, 0.005)) return { code: "diameter", why: `Радиустың орнына диаметр (${2 * r}) алынды. Формулада r = ${r}: 2π·${r}·${th}/360.` };
    if (want === "area" && M.near(v, (2 * r * r * th) / 360, 0.005)) return { code: "2pir2", why: "Дөңгелек ауданы πr², ал 2πr² емес." };
    if (M.near(v, th, 1e-3) || M.near(v, th / 2, 0.005)) return { code: "angle", why: `${num(v)} - бұрыштың өлшемі (градус), ұзындық не аудан емес. Бұрышты шеңбердің үлесіне айналдыр: ${th}/360.` };
    return { code: "calc", why: `Үлесті тап: ${th}/360 = ${num(M.round(th / 360, 4))}. Сосын ${want === "arc" ? `2πr = ${2 * r}π` : `πr² = ${r * r}π`} санын соған көбейт.` };
  }
  M.task({
    el: $("t1"), skill: SKILL, title: TITLE, once: true,
    gen: () => ({ item: "arc r6 120", text: "Радиусы 6 см шеңберде орталық бұрышы 120° доғаның ұзындығы неше π см?", fields: [{ key: "k", label: "доға ұзындығы = ? · π" }],
      check: (v) => diagCircle(v.k, "arc", 6, 120),
      hints: ["Доға - бүкіл шеңбердің бір бөлігі. Ол қандай үлес? Бұрыш 360°-тың қандай бөлігі екенін тап.", "Ұқсас мысал: r = 9, θ = 80°: 2π·9 = 18π, 80/360 = 2/9, доға = 18π·2/9 = 4π. (Ал 81π·2/9 = 18π - бұл сектор ауданы!)", "Шешім: шеңбер ұзындығы 2π·6 = 12π. Үлес 120/360 = 1/3. Доға = 12π/3 = 4π. Жауап: 4."] }),
  });

  /* ---------- 2-тапсырма: меңгеру (жаңа есептер) ---------- */
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]];
  const ARCS = [[6, 60], [9, 40], [10, 72], [12, 30], [4, 90], [8, 135], [3, 120], [5, 144], [15, 48], [18, 20]];
  function gen(prev) {
    const kinds = ["tri", "sim", "pyth", "arc", "area", "insc"].filter((k) => !prev || k !== prev.kind);
    const kind = pick(kinds);
    if (kind === "tri") {
      const A = rnd(25, 85), Bq = rnd(25, 150 - A), C = 180 - A - Bq;
      return { kind, ans: { x: C }, item: "tri", text: `Үшбұрыштың екі бұрышы ${A}° және ${Bq}°. Үшінші бұрышы неше градус?`, fields: [{ key: "x", label: "үшінші бұрыш, °" }],
        check: ({ x }) => M.near(x, C) ? { ok: true, why: `180 − ${A} − ${Bq} = ${C}.` } : M.near(x, A + Bq) ? { code: "sum", why: `${A + Bq} - берілген екі бұрыштың қосындысы. Үшеуінің қосындысы 180°, сондықтан оны 180-нен шегер.` } : M.near(x, 360 - A - Bq) ? { code: "360", why: "360° - төртбұрыштың бұрыштар қосындысы. Үшбұрышта 180°." } : M.near(x, 180 - A) || M.near(x, 180 - Bq) ? { code: "one", why: "Тек бір бұрыш шегерілді - екеуін де шегер." } : { code: "calc", why: `Ереже: ∠C = 180° − ∠A − ∠B. Қайта есепте: 180 − ${A} − ${Bq}.` },
        hints: ["Үшбұрыштың үш бұрышының қосындысы әрдайым бірдей. Қанша?", "Ұқсас мысал: 50° және 60° → 180 − 110 = 70°.", `Шешім: 180 − ${A} − ${Bq} = ${C}.`] };
    }
    if (kind === "sim") {
      const k = pick([[2, 3], [3, 5], [1, 3], [2, 5], [3, 4], [1, 2]]), u = rnd(1, 3), AD = k[0] * 2 * u, DB = (k[1] - k[0]) * 2 * u, AB = AD + DB, DE = k[0] * rnd(2, 4), BC = (DE * AB) / AD;
      return { kind, ans: { x: BC }, item: "sim", text: `ABC үшбұрышында D нүктесі AB-да, E нүктесі AC-да жатыр, DE ∥ BC. AD = ${AD}, DB = ${DB}, DE = ${DE}. BC неге тең?`, fields: [{ key: "x", label: "BC" }],
        check: ({ x }) => M.near(x, BC) ? { ok: true, why: `ADE ~ ABC: AD/AB = DE/BC → ${AD}/${AB} = ${DE}/BC → BC = ${num(BC)}.` } : M.near(x, (DE * DB) / AD) ? { code: "db-ad", why: "DB/AD қатынасы алынды. Ұқсас үшбұрыштар - ADE (кіші) және ABC (үлкен), сондықтан сәйкес қабырғалар AD және AB = AD + DB." } : M.near(x, (DE * AD) / DB) ? { code: "ad-db", why: `AD/DB қатынасы алынды. Үлкен үшбұрыштың қабырғасы - AB = ${AB}, DB емес.` } : M.near(x, AB) ? { code: "ab", why: `${AB} - бұл AB. BC-ны пропорциядан тап.` } : { code: "calc", why: `Пропорция: AD/AB = DE/BC, AB = ${AD} + ${DB} = ${AB}.` },
        hints: ["DE ∥ BC болса, ADE және ABC ұқсас (A бұрышы ортақ, сәйкес бұрыштар тең). Қай қабырғалар сәйкес?", "Ұқсас мысал: AD = 6, DB = 4, DE = 9 → AB = 10, 6/10 = 9/BC → BC = 15.", `Шешім: AB = ${AB}. ${AD}/${AB} = ${DE}/BC → BC = ${DE}·${AB}/${AD} = ${num(BC)}.`] };
    }
    if (kind === "pyth") {
      const [p, q, r] = pick(TRIPLES), leg = Math.random() < 0.5;
      if (!leg) return { kind, ans: { x: r }, item: "pyth-hyp", text: `Тікбұрышты үшбұрыштың катеттері ${p} және ${q}. Гипотенузасы неге тең?`, fields: [{ key: "x", label: "гипотенуза" }],
        check: ({ x }) => M.near(x, r) ? { ok: true, why: `${p}² + ${q}² = ${p * p + q * q} = ${r}².` } : M.near(x, p + q) ? { code: "add-sides", why: "Катеттер жай қосылды. Пифагор теоремасы КВАДРАТТАРДЫ қосады: c² = a² + b²." } : M.near(x, r * r) ? { code: "no-sqrt", why: `${r * r} - бұл c². Түбірін ал.` } : M.near(x, Math.sqrt(Math.abs(q * q - p * p))) ? { code: "subtract", why: "Квадраттар шегерілді. Гипотенуза ең ұзын қабырға - катеттердің квадраттары қосылады." } : { code: "calc", why: `c = √(${p}² + ${q}²). Қайта есепте.` },
        hints: ["Гипотенуза - тік бұрышқа қарсы, ең ұзын қабырға. Қай теорема?", "Ұқсас мысал: 9 және 12 → √(81 + 144) = √225 = 15.", `Шешім: √(${p * p} + ${q * q}) = √${r * r} = ${r}.`] };
      return { kind, ans: { x: q }, item: "pyth-leg", text: `Тікбұрышты үшбұрыштың гипотенузасы ${r}, бір катеті ${p}. Екінші катеті неге тең?`, fields: [{ key: "x", label: "катет" }],
        check: ({ x }) => M.near(x, q) ? { ok: true, why: `${r}² − ${p}² = ${r * r - p * p} = ${q}².` } : M.near(x, Math.sqrt(r * r + p * p)) ? { code: "add-leg", why: "Квадраттар қосылды. Катетті тапқанда гипотенузаның квадратынан белгілі катеттің квадратын шегереміз." } : M.near(x, r - p) ? { code: "sub-sides", why: "Қабырғалар жай шегерілді - квадраттарды шегеру керек." } : M.near(x, q * q) ? { code: "no-sqrt", why: `${q * q} - катеттің квадраты. Түбірін ал.` } : { code: "calc", why: `b = √(${r}² − ${p}²). Қайта есепте.` },
        hints: ["c² = a² + b²-дан белгісіз катетті өрнекте.", "Ұқсас мысал: гипотенуза 13, катет 5 → √(169 − 25) = √144 = 12.", `Шешім: √(${r * r} − ${p * p}) = √${q * q} = ${q}.`] };
    }
    const [r, th] = pick(ARCS);
    if (kind === "insc") {
      const c2 = 2 * rnd(15, 80), insc = c2 / 2;
      return Math.random() < 0.5
        ? { kind, ans: { x: insc }, item: "insc", text: `Шеңберде P мен Q нүктелері арасындағы доғаға тірелген орталық бұрыш ${c2}°. Сол доғаға тірелген іштей сызылған бұрыш неше градус?`, fields: [{ key: "x", label: "іштей бұрыш, °" }],
          check: ({ x }) => M.near(x, insc) ? { ok: true, why: `Іштей сызылған бұрыш = орталық бұрыштың жартысы: ${c2}/2 = ${insc}.` } : M.near(x, 2 * c2) ? { code: "doubled", why: "Керісінше екі еселенді. Іштей бұрыштың төбесі шеңберде, ол орталықтан алыс - бұрышы КІШІ, жартысы." } : M.near(x, c2) ? { code: "same", why: "Орталық және іштей бұрыш тең емес: іштей бұрыш - жартысы. Тақтадағы «Шеңбер» қойындысында тексер." } : { code: "calc", why: "Ереже: іштей бұрыш = тірелген доғаның орталық бұрышының жартысы." },
          hints: ["Тақтада «Шеңбер» қойындысында V-ны жылжыт: ∠PVQ мен ∠POQ арасындағы байланыс қандай?", "Ұқсас мысал: орталық бұрыш 100° → іштей 50°.", `Шешім: ${c2}/2 = ${insc}.`] }
        : { kind, ans: { x: c2 }, item: "insc-rev", text: `Шеңберге іштей сызылған бұрыш ${insc}°. Ол тірелген доғаның орталық бұрышы неше градус?`, fields: [{ key: "x", label: "орталық бұрыш, °" }],
          check: ({ x }) => M.near(x, c2) ? { ok: true, why: `Орталық бұрыш = іштей бұрыштың екі еселенгені: 2·${insc} = ${c2}.` } : M.near(x, insc / 2) ? { code: "halved", why: "Керісінше бөлінді. Орталық бұрыш іштей бұрыштан ҮЛКЕН - екі есе." } : { code: "calc", why: "Ереже: іштей = орталық/2, сондықтан орталық = 2·іштей." },
          hints: ["Іштей және орталық бұрыштың қайсысы үлкен?", "Ұқсас мысал: іштей 35° → орталық 70°.", `Шешім: 2·${insc} = ${c2}.`] };
    }
    const want = kind === "arc" ? "arc" : "area", ans = want === "arc" ? (2 * r * th) / 360 : (r * r * th) / 360;
    return { kind, ans: { k: ans }, item: kind, text: `Радиусы ${r} шеңберде орталық бұрышы ${th}°. ${want === "arc" ? "Доғаның ұзындығы" : "Сектордың ауданы"} неше π?`, fields: [{ key: "k", label: want === "arc" ? "доға = ? · π" : "аудан = ? · π" }],
      check: ({ k }) => diagCircle(k, want, r, th),
      hints: [`Бұрыш 360°-тың қандай үлесі? Сол үлесті ${want === "arc" ? "шеңбер ұзындығына (2πr)" : "дөңгелек ауданына (πr²)"} көбейт.`, want === "arc" ? "Ұқсас мысал: r = 10, θ = 90° → 20π · 1/4 = 5π." : "Ұқсас мысал: r = 6, θ = 60° → 36π · 1/6 = 6π.",
        `Шешім: ${th}/360 = ${num(M.round(th / 360, 4))}; ${want === "arc" ? `2π·${r} = ${2 * r}π` : `π·${r}² = ${r * r}π`}; көбейтінді = ${num(M.round(ans, 3))}π. Жауап: ${num(M.round(ans, 3))}.`] };
  }
  const t2 = M.task({ el: $("t2"), skill: SKILL, title: TITLE, gen });
  window.SAT.geometry = { state: () => st, gen, diagCircle, t2 };
})();
