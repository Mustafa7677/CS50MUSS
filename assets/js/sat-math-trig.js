/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Trigonometry зертханасы: тікбұрышты үшбұрыштағы SOH-CAH-TOA (бұрышты A ↔ B ауыстырғанда қарсы/іргелес катет орын
   ауыстырады → sin A = cos B), бірлік шеңбер (cos = x, sin = y), радиан ↔ градус, sin x = cos(90° − x). */
(() => {
  "use strict";
  const { svg, num, rnd, pick, fr, F } = window.SAT;
  const M = window.SATM, T = window.AO17Tutor;
  const $ = (id) => document.getElementById(id);
  if (!$("tr-svg") || !M) return;
  const SKILL = "sat.math.trig", TITLE = "SAT Trigonometry: SOH-CAH-TOA және радиан";
  const fstr = (n, d) => fr.str(F(n, d));
  const piStr = (deg) => { const f = F(deg, 180); return f.n === 0 ? "0" : `${f.n === 1 ? "" : f.n === -1 ? "−" : fr.str(F(f.n))}π${f.d === 1 ? "" : "/" + f.d}`; };
  const d3 = (v) => num(M.round(v, 3));
  const read = (items) => { const ul = $("tr-read"); ul.innerHTML = ""; items.forEach(([k, v, hot]) => { const li = document.createElement("li"); if (hot) li.className = "hot"; li.append(k); const b = document.createElement("b"); b.textContent = v; li.append(b); ul.append(li); }); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- 1. тікбұрышты үшбұрыш ---------- */
  const RB = M.board($("tr-svg"), { x: [0, 12], y: [0, 9], W: 400, H: 300, axes: false });
  const st = { tab: "rt", adj: 8, opp: 6, at: "A", deg: 35 };
  const A0 = [1, 1];
  const P = (B, p) => [B.px(p[0]), B.py(p[1])];
  function line(B, g, p, q, cls) { const [a, b] = P(B, p), [c, d] = P(B, q); return svg("line", { class: cls, x1: a, y1: b, x2: c, y2: d }, g); }
  function text(B, g, p, t, cls, dx = 0, dy = 0) { const [a, b] = P(B, p); const e = svg("text", { class: cls, x: clamp(a + dx, 12, B.W - 12), y: clamp(b + dy, 14, B.H - 6), "text-anchor": "middle" }, g); e.textContent = t; return e; }
  function drawRt() {
    const g = RB.clear("fig"), { adj, opp, at } = st, A = A0, C = [A[0] + adj, A[1]], Bv = [A[0] + adj, A[1] + opp], hyp = Math.hypot(adj, opp);
    svg("polygon", { class: "sm-poly", points: [A, C, Bv].map((p) => P(RB, p).join(",")).join(" ") }, g);
    // A үшін: қарсы = BC, іргелес = AC; B үшін: қарсы = AC, іргелес = BC
    const oppSeg = at === "A" ? [C, Bv] : [A, C], adjSeg = at === "A" ? [A, C] : [C, Bv];
    line(RB, g, ...oppSeg, "sm-rose"); line(RB, g, ...adjSeg, "sm-mint"); line(RB, g, A, Bv, "sm-gold");
    svg("path", { class: "sm-line", d: `M${RB.px(C[0] - 0.45)} ${RB.py(C[1])}V${RB.py(C[1] + 0.45)}H${RB.px(C[0])}` }, g);
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    text(RB, g, mid(A, C), `${at === "A" ? "іргелес" : "қарсы"} ${num(adj)}`, at === "A" ? "sm-t m" : "sm-t r", 0, 18);
    text(RB, g, mid(C, Bv), `${at === "A" ? "қарсы" : "іргелес"} ${num(opp)}`, at === "A" ? "sm-t r" : "sm-t m", 34, 4);
    text(RB, g, mid(A, Bv), `гипотенуза ${d3(hyp)}`, "sm-t g", -34, -10);
    text(RB, g, A, "A", "sb-lbl", -10, 16); text(RB, g, C, "C", "sb-lbl", 10, 16); text(RB, g, Bv, "B", "sb-lbl", 12, -6);
    const th = at === "A" ? M.deg(Math.atan2(opp, adj)) : M.deg(Math.atan2(adj, opp)), o = at === "A" ? opp : adj, a = at === "A" ? adj : opp;
    const V = at === "A" ? A : Bv, [vx, vy] = P(RB, V), r = 30, ang0 = at === "A" ? 0 : Math.PI / 2, ang1 = at === "A" ? -Math.atan2(opp, adj) : Math.PI / 2 + Math.atan2(adj, opp);
    svg("path", { class: "sm-wedge", d: `M${vx} ${vy}L${vx + r * Math.cos(ang0)} ${vy + r * Math.sin(ang0)}A${r} ${r} 0 0 ${at === "A" ? 0 : 1} ${vx + r * Math.cos(ang1)} ${vy + r * Math.sin(ang1)}Z` }, g);
    read([[`θ = ∠${at}`, num(M.round(th, 1)) + "°", true], ["sin θ = қарсы/гип.", `${num(o)}/${d3(hyp)} ≈ ${d3(o / hyp)}`], ["cos θ = іргелес/гип.", `${num(a)}/${d3(hyp)} ≈ ${d3(a / hyp)}`], ["tan θ = қарсы/іргелес", `${num(o)}/${num(a)} ≈ ${d3(o / a)}`]]);
    $("tr-rt-note").textContent = `sin A = BC/AB = ${d3(opp / hyp)} және cos B = BC/AB = ${d3(opp / hyp)}: A-ға қарсы катет B-ға іргелес. A + B = 90°, сондықтан sin A = cos(90° − A) = cos B.`;
    $("tr-svg-t").textContent = `Тікбұрышты үшбұрыш: AC = ${num(adj)}, BC = ${num(opp)}, AB ≈ ${d3(hyp)}; таңдалған бұрыш ${at}, ${num(M.round(th, 1))}°.`;
  }

  /* ---------- 2. бірлік шеңбер ---------- */
  const UB = M.board($("tu-svg"), { x: [-1.35, 1.35], y: [-1.35, 1.35], grid: 0.25, label: 1 });
  function drawUc() {
    const g = UB.clear("fig"), d = st.deg, t = M.rad(d), c = Math.cos(t), s = Math.sin(t), [ox, oy] = P(UB, [0, 0]), R = UB.len(1);
    svg("circle", { class: "sm-line", cx: ox, cy: oy, r: R }, g);
    const cd = 90 - d, cc = Math.cos(M.rad(cd)), cs = Math.sin(M.rad(cd));
    line(UB, g, [0, 0], [cc, cs], "sm-dash"); svg("circle", { class: "sm-dotp", cx: UB.px(cc), cy: UB.py(cs), r: 5 }, g);
    text(UB, g, [cc, cs], `90° − θ`, "sm-t", 0, cs >= 0 ? -10 : 18);
    line(UB, g, [0, 0], [c, s], "sm-gold");
    line(UB, g, [0, 0], [c, 0], "sm-mint"); line(UB, g, [c, 0], [c, s], "sm-rose");
    const r = 26, n = ((d % 360) + 360) % 360;
    svg("path", { class: "sm-wedge", d: `M${ox} ${oy}L${ox + r} ${oy}A${r} ${r} 0 ${n > 180 ? 1 : 0} 0 ${ox + r * Math.cos(-t)} ${oy + r * Math.sin(-t)}Z` }, g);
    text(UB, g, [c / 2, 0], "cos θ", "sm-t m", 0, s >= 0 ? 16 : -8);
    text(UB, g, [c, s / 2], "sin θ", "sm-t r", c >= 0 ? 26 : -26, 4);
    read([["θ", `${d}° = ${piStr(d)} рад`, true], ["cos θ (x)", d3(c)], ["sin θ (y)", d3(s)], ["cos(90° − θ)", d3(cc), true]]);
    $("tu-svg-t").textContent = `Бірлік шеңбер: θ = ${d}°, cos θ = ${d3(c)}, sin θ = ${d3(s)}; cos(90° − θ) = ${d3(cc)} = sin θ.`;
  }
  const rt = M.dragPoint(RB, RB.layer("pts"), { cls: "", step: 0.5, get: () => [A0[0] + st.adj, A0[1] + st.opp], set: (x, y) => { st.adj = clamp(Math.round((x - A0[0]) * 2) / 2, 2, 10); st.opp = clamp(Math.round((y - A0[1]) * 2) / 2, 1, 7.5); drawRt(); rt.update(); }, label: () => `B төбесі: AC = ${num(st.adj)}, BC = ${num(st.opp)}`, onEnd: () => ($("tr-live").textContent = `sin ${st.at} ≈ ${d3((st.at === "A" ? st.opp : st.adj) / Math.hypot(st.adj, st.opp))}`) });
  const uc = M.dragPoint(UB, UB.layer("pts"), { step: 5, get: () => [Math.cos(M.rad(st.deg)), Math.sin(M.rad(st.deg))], set: (x, y, how, k) => { let d = how === "key" ? st.deg + 5 * (k[0] || k[1]) : Math.round(M.deg(Math.atan2(y, x)) / 5) * 5; st.deg = ((d % 360) + 360) % 360; drawUc(); uc.update(); syncConv(); }, label: () => `P нүктесі бірлік шеңберде, ${st.deg}°`, keyHelp: "5°-тан", onEnd: () => ($("tr-live").textContent = `θ = ${st.deg}°: sin θ = ${d3(Math.sin(M.rad(st.deg)))}, cos(90° − θ) = ${d3(Math.cos(M.rad(90 - st.deg)))}.`) });
  document.querySelectorAll("#tr-at button").forEach((b) => b.addEventListener("click", () => { st.at = b.dataset.at; document.querySelectorAll("#tr-at button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawRt(); $("tr-live").textContent = `Енді θ = ∠${st.at}: қарсы және іргелес катеттер орын ауыстырды, гипотенуза сол күйі.`; }));

  /* ---------- 3. радиан ↔ градус ---------- */
  function syncConv() { $("tr-deg").value = st.deg; convDeg(); }
  function convDeg() {
    const d = M.parse($("tr-deg").value), out = $("tr-dout");
    if (d === null) { out.textContent = "Градусты сан ретінде енгіз (мыс. 150)."; return; }
    out.textContent = `${num(d)}° · π/180 = ${Number.isInteger(d) ? piStr(d) : d3(d / 180) + "π"} ≈ ${d3(M.rad(d))} радиан`;
  }
  function convRad() {
    const k = M.parse($("tr-rad").value), out = $("tr-rout");
    if (k === null) { out.textContent = "π-дің коэффициентін енгіз (мыс. 3/4)."; return; }
    out.textContent = `${$("tr-rad").value.trim()}π · 180/π = ${num(M.round(k * 180, 3))}°`;
  }
  $("tr-deg").addEventListener("input", () => { convDeg(); const d = M.parse($("tr-deg").value); if (d !== null && Number.isInteger(d)) { st.deg = ((d % 360) + 360) % 360; drawUc(); uc.update(); } });
  $("tr-rad").addEventListener("input", convRad);

  const PANES = { rt: ["tr-p-rt", "tr-b-rt"], uc: ["tr-p-uc", "tr-b-uc"], rd: ["tr-p-rd", "tr-b-uc"] };
  const tabsCtl = M.tabs($("tr-tabs"), [["rt", "Тікбұрышты үшбұрыш"], ["uc", "Бірлік шеңбер"], ["rd", "Радиан ↔ градус"]], (id) => {
    st.tab = id; ["tr-p-rt", "tr-p-uc", "tr-p-rd", "tr-b-rt", "tr-b-uc"].forEach((e) => ($(e).hidden = !PANES[id].includes(e)));
    id === "rt" ? drawRt() : drawUc();
  });

  /* ---------- болжам ---------- */
  const lockEls = () => document.querySelectorAll("#tr-tabs button, #tr-at button, #tr-deg, #tr-rad");
  const lock = (on) => { lockEls().forEach((e) => (e.disabled = on)); [RB, UB].forEach((B) => (B.layer("pts").style.display = on ? "none" : "")); $("tr-lock").hidden = !on; };
  M.predict($("tr-predict"), {
    q: "sin 30° = 0.5. Онда cos 60° неге тең?",
    opts: [
      { id: "half", t: "0.5", ok: true, why: "30° + 60° = 90°. Тікбұрышты үшбұрышта 30°-қа қарсы катет 60°-қа іргелес, сондықтан sin 30° = cos 60°. Жалпы ереже: sin x = cos(90° − x). B бұрышына ауыстырып көр." },
      { id: "r3", t: "√3/2 ≈ 0.87", why: "√3/2 - бұл cos 30° (= sin 60°). Ал cos 60°-та 60°-қа іргелес катет - 30°-қа қарсы катет: cos 60° = sin 30° = 0.5." },
      { id: "two", t: "2", why: "Синус пен косинус - катеттің гипотенузаға қатынасы, ал катет гипотенузадан қысқа. Сондықтан −1 ≤ cos ≤ 1, 2 бола алмайды." },
      { id: "neg", t: "−0.5", why: "0° мен 90° арасындағы бұрыштардың синусы да, косинусы да оң (бірлік шеңбердің бірінші ширегі). Таңба өзгермейді: cos 60° = 0.5." },
    ],
    onDone: () => { lock(false); window.SAT.focus(rt.el); },
  });
  lock(true);
  drawUc(); syncConv(); tabsCtl.sel("rt");

  /* ---------- диагностика ---------- */
  /** f: sin|cos|tan; o, a, hy - таңдалған бұрышқа қарсы, іргелес, гипотенуза. */
  function diagRatio(f, v, o, a, hy) {
    const R = { sin: o / hy, cos: a / hy, tan: o / a }, want = R[f], tol = 0.002;
    const near = (x, y) => Math.abs(x - y) <= tol;
    if (near(v, want)) return { ok: true, why: `${f} = ${{ sin: "қарсы/гипотенуза", cos: "іргелес/гипотенуза", tan: "қарсы/іргелес" }[f]} = ${fstr(...(f === "sin" ? [o, hy] : f === "cos" ? [a, hy] : [o, a]))}.` };
    if (f === "sin" && near(v, R.cos)) return { code: "sin-cos", why: `Бұл - cos (іргелес/гипотенуза = ${fstr(a, hy)}). Синус үшін бұрышқа ҚАРСЫ катет керек: ${fstr(o, hy)}. Бұрыш қай төбеде тұрғанын тексер - қарсы катет бұрышқа тимейді.` };
    if (f === "cos" && near(v, R.sin)) return { code: "cos-sin", why: `Бұл - sin (қарсы/гипотенуза = ${fstr(o, hy)}). Косинус үшін бұрышқа ІРГЕЛЕС (оған тиіп тұрған, гипотенуза емес) катет керек: ${fstr(a, hy)}.` };
    if (f === "tan" && near(v, a / o)) return { code: "tan-inv", why: `Бөлшек төңкерілген: tan = қарсы/іргелес = ${fstr(o, a)}, ал ${fstr(a, o)} емес.` };
    if (near(v, hy / o) || near(v, hy / a)) return { code: "inverse", why: "Гипотенуза бөлімде болуы керек (sin, cos ≤ 1). Бөлшек төңкерілген." };
    if (f !== "tan" && near(v, (f === "sin" ? o : a) / (o + a))) return { code: "hyp", why: "Бөлімге катеттердің қосындысы алынды. Гипотенузаны Пифагор бойынша тап: √(a² + b²)." };
    return { code: "ratio", why: `SOH-CAH-TOA: sin = қарсы/гип., cos = іргелес/гип., tan = қарсы/іргелес. Мұнда қарсы ${o}, іргелес ${a}, гипотенуза ${hy}.` };
  }
  T.badge($("tr-badge"), SKILL, TITLE);
  M.task({
    el: $("t1"), skill: SKILL, title: TITLE, once: true,
    gen: () => ({ item: "ratios 6-8-10", text: "ABC үшбұрышында ∠C = 90°, AC = 8, BC = 6, AB = 10. sin A, cos A және tan A мәндерін бөлшекпен немесе ондық бөлшекпен енгіз.",
      fields: [{ key: "s", label: "sin A" }, { key: "c", label: "cos A" }, { key: "t", label: "tan A" }],
      check: (v) => { const r = [["sin", v.s], ["cos", v.c], ["tan", v.t]].map(([f, x]) => [f, diagRatio(f, x, 6, 8, 10)]); const bad = r.filter(([, d]) => !d.ok); return bad.length ? { code: bad.map(([, d]) => d.code).join(","), title: `${3 - bad.length} / 3 дұрыс.`, why: bad.map(([f, d]) => `${f} A: ${d.why}`).join(" ") } : { ok: true, why: "sin A = 6/10 = 0.6, cos A = 8/10 = 0.8, tan A = 6/8 = 0.75. Тексеру: sin² + cos² = 0.36 + 0.64 = 1." }; },
      hints: ["Алдымен A бұрышына қатысты қабырғаларды ата: қарсы катет A-ға тимейді, іргелес катет A-ға тиеді, гипотенуза - тік бұрышқа қарсы.", "Ұқсас мысал: AC = 12, BC = 5, AB = 13 → A-ға қарсы BC = 5, іргелес AC = 12: sin A = 5/13, cos A = 12/13, tan A = 5/12.", "Шешім: A-ға қарсы BC = 6, іргелес AC = 8, гипотенуза AB = 10. sin A = 6/10, cos A = 8/10, tan A = 6/8."] }),
  });

  const TR = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [20, 21, 29], [9, 40, 41]];
  const NICE = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 36, 72, 20, 15];
  function gen(prev) {
    const kind = pick(["ratio", "ratio", "comp", "d2r", "r2d"].filter((k) => !prev || k !== prev.kind || k === "ratio"));
    if (kind === "ratio") {
      const [p, q, r] = pick(TR), at = pick(["A", "B"]), f = pick(["sin", "cos", "tan"]), o = at === "A" ? p : q, a = at === "A" ? q : p;
      return { kind, ans: { x: { sin: o / r, cos: a / r, tan: o / a }[f] }, item: "ratio-" + f, text: `ABC үшбұрышында ∠C = 90°, BC = ${p}, AC = ${q}, AB = ${r}. ${f} ${at} неге тең?`, fields: [{ key: "x", label: `${f} ${at}` }],
        check: ({ x }) => diagRatio(f, x, o, a, r),
        hints: [`${at} бұрышына қарсы катет қайсы? Ол ${at} төбесіне тимейді.`, `Ұқсас мысал: BC = 3, AC = 4, AB = 5 болса, B-ға қарсы катет - AC = 4, іргелес - BC = 3: sin B = 4/5, cos B = 3/5, tan B = 4/3.`, `Шешім: ${at}-ға қарсы ${at === "A" ? "BC" : "AC"} = ${o}, іргелес ${at === "A" ? "AC" : "BC"} = ${a}, гипотенуза ${r}. ${f} ${at} = ${f === "sin" ? `${o}/${r}` : f === "cos" ? `${a}/${r}` : `${o}/${a}`}.`] };
    }
    if (kind === "comp") {
      const y = rnd(10, 80), f = pick(["sin", "cos"]), g2 = f === "sin" ? "cos" : "sin", x = 90 - y;
      return { kind, ans: { x }, item: "complement", text: `0° < x < 90° және ${f}(x°) = ${g2}(${y}°). x неге тең?`, fields: [{ key: "x", label: "x, °" }],
        check: ({ x: v }) => M.near(v, x) ? { ok: true, why: `${f} x = ${g2}(90° − x), сондықтан x + ${y} = 90 → x = ${x}.` } : M.near(v, y) ? { code: "same-angle", why: `${f} ${y}° ≠ ${g2} ${y}° (тек 45°-та тең). Толықтауыш бұрыштар ережесі: sin x = cos y ↔ x + y = 90°.` } : M.near(v, 180 - y) ? { code: "supplement", why: "180° - сыбайлас бұрыштар. Синус пен косинус ТОЛЫҚТАУЫШ (қосындысы 90°) бұрыштарда тең." } : { code: "calc", why: "Ереже: sin x = cos(90° − x). x + берілген бұрыш = 90°." },
        hints: ["Тікбұрышты үшбұрыштың екі сүйір бұрышын ойла: біреуіне қарсы катет екіншісіне іргелес.", "Ұқсас мысал: sin(x°) = cos(25°) → x = 90 − 25 = 65.", `Шешім: x = 90 − ${y} = ${x}.`] };
    }
    if (kind === "d2r") {
      const d = pick(NICE), f = F(d, 180);
      return { kind, ans: { x: d / 180 }, item: "deg2rad", text: `${d}° неше радиан? Жауапты π-дің коэффициенті ретінде енгіз (мыс. 3/4 → 3π/4).`, fields: [{ key: "x", label: "? · π радиан" }],
        check: ({ x }) => M.near(x, d / 180) ? { ok: true, why: `${d}° · π/180 = ${piStr(d)}.` } : M.near(x, 180 / d) ? { code: "inverted", why: `180/${d} алынды - бөлшек төңкерілді. Градустан радианға: · π/180, яғни ${d}/180.` } : M.near(x, M.rad(d)) ? { code: "decimal", why: `${d3(M.rad(d))} - радианның ондық мәні (π-мен бірге). Мұнда тек π-дің коэффициенті керек: ${fstr(f.n, f.d)}.` } : M.near(x, d / 360) ? { code: "360", why: "360-қа бөлінді. 180° = π радиан, сондықтан 180-ге бөл." } : { code: "calc", why: `Ереже: 180° = π радиан. ${d}/180 бөлшегін қысқарт.` },
        hints: ["Негізгі байланыс: 180° = π радиан.", "Ұқсас мысал: 135° → 135/180 = 3/4 → 3π/4.", `Шешім: ${d}/180 = ${fstr(f.n, f.d)}, жауап: ${piStr(d)}.`] };
    }
    const d = pick(NICE), f = F(d, 180), s = `${f.n === 1 ? "" : f.n}π${f.d === 1 ? "" : "/" + f.d}`;
    return { kind, ans: { x: d }, item: "rad2deg", text: `${s} радиан неше градус?`, fields: [{ key: "x", label: "градус" }],
      check: ({ x }) => M.near(x, d) ? { ok: true, why: `${s} · 180/π = ${d}°.` } : M.near(x, (f.n / f.d) * Math.PI) ? { code: "kept-rad", why: "Бұл - радианның ондық мәні, градус емес. π-ді 180°-қа алмастыр." } : M.near(x, (f.n / f.d) * 360) ? { code: "360", why: "π = 180°, ал 360° - бұл 2π." } : { code: "calc", why: "Ереже: π радиан = 180°. Коэффициентті 180-ге көбейт." },
      hints: ["π радианды 180°-қа алмастыр.", "Ұқсас мысал: 5π/6 = 5·180/6 = 150°.", `Шешім: ${f.n}·180/${f.d} = ${d}°.`] };
  }
  const t2 = M.task({ el: $("t2"), skill: SKILL, title: TITLE, gen });
  window.SAT.trig = { state: () => st, gen, diagRatio, t2 };
})();
