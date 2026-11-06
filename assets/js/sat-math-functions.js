/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Functions зертханасы: түрлендірулер y = a·f(±(x − h)) + k (жылжу, созылу, шағылыс) - бастапқы нүктенің қайда
   кететінін көрсетеді; сызықтық және экспоненциалдық өсуді салыстыру (тұрақты айырма ↔ тұрақты қатынас); екі сызықтық
   теңдеудің жүйесі - қиылысу, параллель (шешім жоқ), сәйкес (шексіз көп). */
(() => {
  "use strict";
  const { svg, num, rnd, pick } = window.SAT;
  const M = window.SATM, T = window.AO17Tutor;
  const $ = (id) => document.getElementById(id);
  if (!$("fn-svg") || !M) return;
  const SKILL = "sat.math.functions", TITLE = "SAT Functions: түрлендірулер және модельдер";
  const B = M.board($("fn-svg"), { x: [-8, 8], y: [-8, 8], grid: 1, label: 2 });
  const L = M.board($("fl-svg"), { x: [-1.6, 10.5], y: [-12, 200], grid: 1, gridY: 20, label: 2, labelY: 40 });
  const BASES = {
    sq: { name: "x²", f: (x) => x * x, key: [1, 1], k0: [0, 0] },
    abs: { name: "|x|", f: (x) => Math.abs(x), key: [2, 2], k0: [0, 0] },
    sqrt: { name: "√x", f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), key: [4, 2], k0: [0, 0] },
    exp: { name: "2^x", f: (x) => 2 ** x, key: [1, 2], k0: [0, 1] },
  };
  const st = { tab: "tf", base: "sq", a: 1, h: 0, k: 0, ry: false, target: null, m: 10, b: 20, b2: 5, r: 40, m1: 1, b1: 2, m2: -1, b2s: -2 };
  const sgn = (v, pos = "+", neg = "−") => (v < 0 ? neg : pos);
  function formula(base, a, h, k, ry) {
    const inner = h === 0 ? (ry ? "−x" : "x") : ry ? `−(x ${sgn(h, "−", "+")} ${num(Math.abs(h))})` : `x ${sgn(h, "−", "+")} ${num(Math.abs(h))}`;
    const A = a === 1 ? "" : a === -1 ? "−" : num(a);
    const K = k === 0 ? "" : ` ${sgn(k)} ${num(Math.abs(k))}`;
    const simple = inner === "x";
    const fx = { sq: simple ? "x²" : `(${inner})²`, abs: `|${inner}|`, sqrt: simple ? "√x" : `√(${inner})`, exp: simple ? "2^x" : `2^(${inner})` }[base];
    return `y = ${A}${A && base === "exp" ? "·" : ""}${fx}${K}`;
  }
  const g = (x, s = st) => s.a * BASES[s.base].f((s.ry ? -1 : 1) * (x - s.h)) + s.k;
  const mapPt = ([x0, y0], s = st) => [(s.ry ? -x0 : x0) + s.h, s.a * y0 + s.k];
  function path(Bd, f, x0 = -8.5, x1 = 8.5, dx = 0.04) {
    let d = "", pen = false;
    for (let x = x0; x <= x1 + 1e-9; x += dx) {
      const y = f(x);
      if (!Number.isFinite(y) || Math.abs(y) > 1e4) { pen = false; continue; }
      const yy = Math.max(Bd.y0 - 50, Math.min(Bd.y1 + 50, y));
      d += (pen ? "L" : "M") + Bd.px(x).toFixed(1) + " " + Bd.py(yy).toFixed(1); pen = true;
    }
    return d;
  }
  const read = (items) => { const ul = $("fn-read"); ul.innerHTML = ""; items.forEach(([k, v, hot]) => { const li = document.createElement("li"); if (hot) li.className = "hot"; li.append(k); const b = document.createElement("b"); b.textContent = v; li.append(b); ul.append(li); }); };
  const lbl = (Bd, gg, p, t, cls = "sm-t") => { const e = svg("text", { class: cls, x: Math.min(Bd.W - 8, Math.max(8, Bd.px(p[0]) + 8)), y: Math.min(Bd.H - 6, Math.max(14, Bd.py(p[1]) - 8)) }, gg); e.textContent = t; };

  function drawTf() {
    const gg = B.clear("fig"), base = BASES[st.base];
    svg("path", { class: "lb-ghost", d: path(B, base.f) }, gg);
    if (st.target) svg("path", { class: "sm-rose", "stroke-dasharray": "8 6", d: path(B, (x) => g(x, st.target)) }, gg);
    svg("path", { class: "lb-curve", d: path(B, (x) => g(x)) }, gg);
    const K = base.key, K2 = mapPt(K), K0 = base.k0, K02 = mapPt(K0);
    svg("circle", { class: "sm-dotp", cx: B.px(K[0]), cy: B.py(K[1]), r: 5, opacity: 0.6 }, gg);
    svg("line", { class: "sm-dash", x1: B.px(K[0]), y1: B.py(K[1]), x2: B.px(K2[0]), y2: B.py(K2[1]) }, gg);
    svg("circle", { class: "sm-dotp", cx: B.px(K2[0]), cy: B.py(K2[1]), r: 6 }, gg);
    lbl(B, gg, K2, `(${num(K2[0])}, ${num(K2[1])})`, "sm-t g");
    svg("circle", { class: "sb-pt", cx: B.px(K02[0]), cy: B.py(K02[1]), r: 5 }, gg);
    const fm = formula(st.base, st.a, st.h, st.k, st.ry);
    $("fn-formula").textContent = fm;
    read([["бастапқы нүкте", `(${num(K[0])}, ${num(K[1])}) → (${num(K2[0])}, ${num(K2[1])})`, true], ["x-ке не болды", `${st.ry ? "−x0 (y осі бойынша шағылыс), " : ""}${st.h ? `${st.h > 0 ? "оңға" : "солға"} ${num(Math.abs(st.h))}` : "жылжу жоқ"}`], ["y-ке не болды", `×${num(st.a)}${st.a < 0 ? " (x осі бойынша шағылыс)" : ""}${st.k ? `, ${st.k > 0 ? "жоғары" : "төмен"} ${num(Math.abs(st.k))}` : ""}`]]);
    $("fn-svg-t").textContent = `${fm} графигі; үзік сызық - y = ${base.name}. (${num(K[0])}, ${num(K[1])}) нүктесі (${num(K2[0])}, ${num(K2[1])}) нүктесіне көшті.`;
  }
  function drawLe() {
    const gg = L.clear("fig"), lin = (x) => st.b + st.m * x, ex = (x) => st.b2 * (1 + st.r / 100) ** x;
    svg("path", { class: "sm-mint", d: path(L, lin, 0, 10, 0.05) }, gg);
    svg("path", { class: "lb-curve", d: path(L, ex, 0, 10, 0.05) }, gg);
    let cross = null; for (let x = 0; x <= 10; x += 0.01) if (ex(x) > lin(x) && (x === 0 || ex(x - 0.01) <= lin(x - 0.01))) { cross = x; if (x > 0) break; }
    if (cross !== null && cross > 0) { svg("circle", { class: "sm-dotp", cx: L.px(cross), cy: L.py(Math.min(200, lin(cross))), r: 6 }, gg); }
    const tb = $("fl-tbl"); tb.innerHTML = "";
    const row = (cells, th) => { const tr = document.createElement("tr"); cells.forEach((c, i) => { const e = document.createElement(i === 0 || th ? "th" : "td"); if (i === 0 && !th) e.scope = "row"; if (th) e.scope = "col"; e.textContent = c; if (i && !th) e.className = "n"; tr.append(e); }); tb.append(tr); };
    const xs = [0, 1, 2, 3, 4, 5];
    row(["x", ...xs.map(String)], true);
    row([`y = ${num(st.b)} + ${num(st.m)}x`, ...xs.map((x) => num(M.round(lin(x), 2)))]);
    row(["айырма", "", ...xs.slice(1).map((x) => "+" + num(M.round(lin(x) - lin(x - 1), 2)))]);
    row([`y = ${num(st.b2)}·${num(1 + st.r / 100)}^x`, ...xs.map((x) => num(M.round(ex(x), 2)))]);
    row(["қатынас", "", ...xs.slice(1).map((x) => "×" + num(M.round(ex(x) / ex(x - 1), 3)))]);
    read([["сызықтық", `әр қадамда +${num(st.m)} (тұрақты айырма)`], ["экспоненциалдық", `әр қадамда ×${num(1 + st.r / 100)} (тұрақты қатынас, ${st.r}%)`], ["экспонента озады", cross !== null && cross > 0 ? `x ≈ ${num(M.round(cross, 2))}` : cross === 0 ? "басынан алда" : "x ≤ 10 аралығында озбайды", true]]);
    $("fl-svg-t").textContent = `Сызықтық y = ${num(st.b)} + ${num(st.m)}x (жасыл) және экспоненциалдық y = ${num(st.b2)}·${num(1 + st.r / 100)}^x (алтын).`;
  }
  function drawSy() {
    const gg = B.clear("fig"), { m1, b1, m2, b2s } = st;
    svg("path", { class: "lb-curve", d: path(B, (x) => m1 * x + b1) }, gg);
    svg("path", { class: "sm-mint", d: path(B, (x) => m2 * x + b2s) }, gg);
    let res;
    if (m1 === m2) res = b1 === b2s ? ["шексіз көп", "Екі теңдеу - бір түзу (көлбеуі де, y-қиылысы да бірдей). Әр нүктесі - шешім."] : ["шешім жоқ", `Көлбеулері тең (${num(m1)}), y-қиылыстары әртүрлі (${num(b1)} ≠ ${num(b2s)}) - түзулер параллель, ешқашан қиылыспайды.`];
    else { const x = (b2s - b1) / (m1 - m2), y = m1 * x + b1; svg("circle", { class: "sm-dotp", cx: B.px(x), cy: B.py(y), r: 7 }, gg); lbl(B, gg, [x, y], `(${num(M.round(x, 2))}, ${num(M.round(y, 2))})`, "sm-t g"); res = ["бір шешім", `Көлбеулері әртүрлі - түзулер бір нүктеде қиылысады: x = (${num(b2s)} − ${num(b1)})/(${num(m1)} − ${num(m2)}) = ${num(M.round(x, 3))}.`]; }
    $("fn-formula").textContent = `y = ${num(m1)}x ${sgn(b1)} ${num(Math.abs(b1))}   және   y = ${num(m2)}x ${sgn(b2s)} ${num(Math.abs(b2s))}`;
    read([["шешім саны", res[0], true], ["көлбеулер", `${num(m1)} және ${num(m2)}`], ["y-қиылыстар", `${num(b1)} және ${num(b2s)}`]]);
    $("fn-sy-note").textContent = res[1];
    $("fn-svg-t").textContent = `Екі түзу: ${$("fn-formula").textContent}. ${res[0]}.`;
  }
  const draw = () => (st.tab === "le" ? drawLe() : st.tab === "sy" ? drawSy() : drawTf());

  /* ---------- басқару ---------- */
  const pair = (rid, nid, key) => {
    const r = $(rid), n = nid && $(nid);
    const set = (v, from) => { if (!Number.isFinite(v)) return; st[key] = v; if (from !== r) r.value = v; if (n && from !== n) n.value = v; else if (!n) { const o = $(rid + "v"); if (o) o.textContent = num(v); } draw(); };
    r.addEventListener("input", () => set(parseFloat(r.value), r));
    if (n) n.addEventListener("input", () => set(M.parse(n.value), n));
  };
  pair("fn-a", "fn-an", "a"); pair("fn-h", "fn-hn", "h"); pair("fn-k", "fn-kn", "k");
  ["fl-m", "fl-b", "fl-b2", "fl-r", "fs-m1", "fs-b1", "fs-m2", "fs-b2"].forEach((id) => pair(id, null, { "fl-m": "m", "fl-b": "b", "fl-b2": "b2", "fl-r": "r", "fs-m1": "m1", "fs-b1": "b1", "fs-m2": "m2", "fs-b2": "b2s" }[id]));
  $("fn-base").addEventListener("change", (e) => { st.base = e.target.value; draw(); });
  $("fn-ry").addEventListener("change", (e) => { st.ry = e.target.checked; draw(); });
  const PANES = { tf: ["fn-p-tf", "fn-b"], le: ["fn-p-le", "fl-board"], sy: ["fn-p-sy", "fn-b"] };
  const tabsCtl = M.tabs($("fn-tabs"), [["tf", "Түрлендірулер"], ["le", "Сызықтық vs экспоненциалдық"], ["sy", "Теңдеулер жүйесі"]], (id) => {
    st.tab = id; ["fn-p-tf", "fn-p-le", "fn-p-sy", "fn-b", "fl-board"].forEach((e) => ($(e).hidden = !PANES[id].includes(e)));
    $("fn-formula").hidden = id === "le"; draw();
  });
  const setTf = (o) => { Object.assign(st, o); for (const k of ["a", "h", "k"]) { $("fn-" + k).value = st[k]; $("fn-" + k + "n").value = st[k]; } $("fn-base").value = st.base; $("fn-ry").checked = st.ry; draw(); };

  /* ---------- болжам ---------- */
  const ctl = () => document.querySelectorAll("#fn-tabs button, #fn-ctl input, #fn-ctl select");
  const lock = (on) => { ctl().forEach((e) => (e.disabled = on)); $("fn-lock").hidden = !on; };
  tabsCtl.sel("tf"); lock(true);
  M.predict($("fn-predict"), {
    q: "y = f(x − 2) графигі y = f(x) графигімен салыстырғанда қалай орналасады?",
    opts: [
      { id: "right", t: "Оңға 2", ok: true, why: "f(x − 2)-де x = 2 болғанда f(0) шығады - бастапқы (0, f(0)) нүктесі x = 2-ге көшті. Жақшаның ішіндегі өзгеріс x-ке «кері» әсер етеді. h = 2 қойылды - көр." },
      { id: "left", t: "Солға 2", title: "Бұл - ең жиі қақпан.", why: "«− 2» солға меңзейтін сияқты, бірақ f-тің ішіндегі мән x = 2 болғанда ғана 0-ге тең: график ОҢҒА жылжиды. h = 2 қойылды - көр." },
      { id: "up", t: "Жоғары 2", why: "Тік жылжу f-тің СЫРТЫНДА болады: f(x) + 2. Ал «x − 2» ішінде - көлденең жылжу (оңға 2). h = 2 қойылды - көр." },
      { id: "down", t: "Төмен 2", why: "f(x) − 2 төмен түсірер еді; бұл жерде −2 жақшаның ішінде, сондықтан график көлденең - оңға 2 жылжиды. h = 2 қойылды - көр." },
    ],
    onDone: () => { lock(false); setTf({ h: 2 }); window.SAT.focus($("fn-h")); },
  });

  /* ---------- 1-тапсырма: нысана графикті құрастыру ---------- */
  T.badge($("fn-badge"), SKILL, TITLE);
  const TGT = { base: "abs", a: -2, h: -3, k: 4, ry: false };
  function diagTf(want) {
    const e = [];
    if (st.base !== want.base) e.push(["base", `Бастапқы функция ${BASES[want.base].name} болуы керек (қазір ${BASES[st.base].name}).`]);
    if (st.h !== want.h) e.push([st.h === -want.h ? "sign-h" : "h", st.h === -want.h ? `h = ${num(st.h)} - белгі қақпаны. Нысананың «бұрышы» x = ${num(want.h)}-те, сондықтан ішінде x ${sgn(want.h, "−", "+")} ${num(Math.abs(want.h))}, яғни h = ${num(want.h)}.` : `h = ${num(st.h)}: көлденең орны дұрыс емес; нысана x = ${num(want.h)}-ке жылжыған.`]);
    if (st.k !== want.k) e.push(["k", `k = ${num(st.k)}: нысананың төбесі y = ${num(want.k)} деңгейінде.`]);
    if (st.a !== want.a) e.push([Math.sign(st.a) !== Math.sign(want.a) ? "reflect" : "stretch", Math.sign(st.a) !== Math.sign(want.a) ? `a = ${num(st.a)}: нысана ${want.a < 0 ? "төмен қарай ашылады - x осі бойынша шағылысқан, a < 0" : "жоғары ашылады, a > 0"}.` : `a = ${num(st.a)}: таңбасы дұрыс, бірақ тіктігі басқа. Төбеден 1 бірлік оңға жүргенде нысана ${num(Math.abs(want.a))} бірлікке ${want.a < 0 ? "түседі" : "көтеріледі"}.`]);
    if (st.ry !== want.ry && !(st.base === "abs" || st.base === "sq")) e.push(["reflect-y", "y осі бойынша шағылыс қажет емес."]);
    return e;
  }
  M.task({ el: $("t1"), skill: SKILL, title: TITLE, once: true,
    gen: () => ({ item: "match abs", text: "Қызғылт үзік график - нысана. Бастапқы функцияны, a, h, k-ны таңдап, графиктерді беттестір, сосын «Тексеру» бас.", fields: [],
      check: () => { const e = diagTf(TGT); return e.length ? { code: e.map((x) => x[0]).join(","), title: `${e.length} параметр түзетуді қажет етеді.`, why: e.map((x) => x[1]).join(" ") } : { ok: true, why: `${formula("abs", -2, -3, 4, false)}: «бұрыш» (−3, 4)-те, a = −2 - төмен ашылады және 2 есе тік.` }; },
      hints: ["Нысананың пішіні қандай - парабола ма, «V» ма? Ең алдымен оның төбесін (бұрышын) тап: ол (h, k).", "Ұқсас мысал: «V» төбесі (2, −1)-де, жоғары ашылады, 1 оңға жүргенде 3 көтеріледі → y = 3|x − 2| − 1.", "Шешім: f = |x|, төбе (−3, 4) → h = −3, k = 4; төмен ашылады және 1 бірлікке 2 түседі → a = −2. y = −2|x + 3| + 4."] }),
    onShow: () => { st.target = TGT; },
  });

  /* ---------- 2-тапсырма: меңгеру ---------- */
  function gen(prev) {
    const kind = pick(["map", "table", "nsol", "noSolK"].filter((k) => !prev || k !== prev.kind));
    if (kind === "map") {
      const p = rnd(-4, 4), q = rnd(-4, 4), a = pick([-3, -2, -1, 2, 3]), h = pick([-3, -2, -1, 1, 2, 3]), k = pick([-4, -2, -1, 1, 3, 5]);
      const X = p + h, Y = a * q + k, s = `y = ${a === -1 ? "−" : num(a)}f(x ${sgn(h, "−", "+")} ${Math.abs(h)}) ${sgn(k)} ${Math.abs(k)}`;
      return { kind, ans: { x: X, y: Y }, item: "point-map", text: `y = f(x) графигі (${num(p)}, ${num(q)}) нүктесі арқылы өтеді. ${s} графигі міндетті түрде өтетін нүктені тап.`, fields: [{ key: "x", label: "x" }, { key: "y", label: "y" }],
        check: ({ x, y }) => { const e = [], c = []; if (!M.near(x, X)) { c.push("x"); e.push(M.near(x, p - h) ? `x: жылжу бағыты қате. Ішкі мән ${num(p)} болуы керек: x ${sgn(h, "−", "+")} ${Math.abs(h)} = ${num(p)} → x = ${num(X)}.` : `x: ішіндегі өрнек ${num(p)}-ке тең болатын x-ті тап: x = ${num(X)}.`); }
          if (!M.near(y, Y)) { c.push("y"); e.push(M.near(y, a * (q + k)) ? `y: амалдар реті - алдымен f мәнін ${num(a)}-ге көбейт, сосын ${num(k)} қос: ${num(a)}·${num(q)} ${sgn(k)} ${Math.abs(k)} = ${num(Y)}.` : M.near(y, q + k) ? `y: ${num(a)}-ге көбейту ұмытылды.` : `y = ${num(a)}·f(${num(p)}) ${sgn(k)} ${Math.abs(k)} = ${num(a)}·${num(q)} ${sgn(k)} ${Math.abs(k)}.`); }
          return e.length ? { code: c.join(","), why: e.join(" ") } : { ok: true, why: `x ${sgn(h, "−", "+")} ${Math.abs(h)} = ${num(p)} → x = ${num(X)}; y = ${num(a)}·${num(q)} ${sgn(k)} ${Math.abs(k)} = ${num(Y)}.` }; },
        hints: ["x үшін: f-тің ішіндегі өрнек бастапқы x-ке тең болуы керек. y үшін: f мәніне сыртқы амалдарды қолдан.", "Ұқсас мысал: f (4, −1) арқылы өтеді → 2f(x + 3) − 5: x + 3 = 4 → x = 1; y = 2·(−1) − 5 = −7 → (1, −7).", `Шешім: x = ${num(p)} − (${num(-h)}) = ${num(X)}, y = ${num(a)}·${num(q)} ${sgn(k)} ${Math.abs(k)} = ${num(Y)}.`] };
    }
    if (kind === "table") {
      const lin = Math.random() < 0.5, y0 = pick([2, 3, 4, 5, 6]), d = pick([2, 3, 4, 5]), xs = [0, 1, 2, 3];
      const ys = xs.map((x) => (lin ? y0 + d * x : y0 * d ** x)), nxt = lin ? y0 + d * 4 : y0 * d ** 4, wrong = lin ? ys[3] * (ys[3] / ys[2]) : ys[3] + (ys[3] - ys[2]);
      return { kind, ans: { x: nxt }, item: lin ? "table-linear" : "table-exp", text: `Кесте: x = 0, 1, 2, 3 болғанда y = ${ys.join(", ")}. Заңдылық сақталса, x = 4 болғанда y неге тең?`, fields: [{ key: "x", label: "y(4)" }],
        check: ({ x }) => M.near(x, nxt) ? { ok: true, why: lin ? `Тұрақты айырма +${d} - сызықтық: ${ys[3]} + ${d} = ${nxt}.` : `Тұрақты қатынас ×${d} - экспоненциалдық: ${ys[3]}·${d} = ${nxt}.` } : M.near(x, wrong) ? { code: lin ? "used-ratio" : "used-difference", why: lin ? `Айырмалар тұрақты (+${d}), қатынастар емес - бұл сызықтық. Келесі мән: ${ys[3]} + ${d}.` : `Айырмалар өсіп келеді (${ys[1] - ys[0]}, ${ys[2] - ys[1]}, ${ys[3] - ys[2]}) - бұл сызықтық емес. Қатынас тұрақты: ×${d}.` } : { code: "pattern", why: "Көршілес мәндердің айырмасын да, қатынасын да тексер - қайсысы тұрақты?" },
        hints: ["Сызықтық: тұрақты АЙЫРМА. Экспоненциалдық: тұрақты ҚАТЫНАС. Екеуін де есепте.", "Ұқсас мысал: 3, 6, 12, 24 - айырмалар 3, 6, 12 (тұрақты емес), қатынас ×2 → келесі 48.", `Шешім: ${lin ? `айырма +${d}, ${ys[3]} + ${d} = ${nxt}` : `қатынас ×${d}, ${ys[3]}·${d} = ${nxt}`}.`] };
    }
    if (kind === "nsol") {
      const m = pick([-3, -2, 2, 3]), b = rnd(-5, 5), t = pick(["one", "none", "inf"]), c = pick([2, 3, -2]);
      // ax + by = c формасы: y = mx + b → mx − y = −b
      const e1 = `${num(m)}x − y = ${num(-b)}`;
      const e2 = t === "one" ? `${num(m + 1)}x − y = ${num(-b + 1)}` : t === "none" ? `${num(c * m)}x − ${c === -2 ? "(−2)" : c}y = ${num(-c * b + c * 3)}` : `${num(c * m)}x − ${c < 0 ? "(" + num(c) + ")" : c}y = ${num(-c * b)}`;
      const ans = { one: "1", none: "0", inf: "шексіз" }[t];
      return { kind, ans: { x: ans }, item: "n-solutions", text: `Жүйе: ${e1} және ${e2}. Жүйенің неше шешімі бар? (0, 1 немесе «шексіз» деп жаз)`, fields: [{ key: "x", label: "шешім саны", raw: true, mode: "text" }],
        check: ({ x }) => { const v = String(x).trim().toLowerCase(); const norm = /^(шексіз|inf|∞|infinite|infinitely many)/.test(v) ? "шексіз" : v; if (!["0", "1", "шексіз"].includes(norm)) return { code: "format", why: "0, 1 немесе «шексіз» деп жаз." };
          return norm === ans ? { ok: true, why: t === "one" ? "Көлбеулер әртүрлі - бір қиылысу нүктесі." : t === "none" ? `Екінші теңдеудің сол жағы біріншісінің ${c} еселенгені, ал оң жағы емес - параллель түзулер, шешім жоқ.` : `Екінші теңдеу - біріншісінің ${c} еселенгені (оң жағымен қоса) - бір түзу, шешім шексіз көп.` } : { code: "nsol-" + t, why: t === "one" ? "Екі теңдеуді y = mx + b түріне келтір: көлбеулер әртүрлі болса, түзулер бір рет қиылысады." : t === "none" ? `Коэффициенттер пропорционал (×${c}), бірақ бос мүшелер пропорционал емес - түзулер параллель және әртүрлі: шешім жоқ.` : `Екінші теңдеуді ${c}-ге бөл - бірінші теңдеу шығады. Бір түзу - шешім шексіз көп.` }; },
        hints: ["Екі теңдеуді де y = mx + b түріне келтір және көлбеулер мен y-қиылыстарын салыстыр.", "Ұқсас мысал: 2x − y = 3 және 4x − 2y = 6 - екіншісі ×2: бір түзу, шексіз. 4x − 2y = 7 болса - параллель, шешім жоқ.", `Шешім: ${t === "one" ? "көлбеулер әртүрлі → 1" : t === "none" ? "көлбеулер тең, қиылыстар әртүрлі → 0" : "екі теңдеу бір түзу → шексіз"}.`] };
    }
    const a = pick([2, 3, 4, 6]), bq = pick([3, 5, 7]), c2 = pick([2, 3]), k = a * c2;
    return { kind, ans: { x: k }, item: "no-solution-k", text: `Жүйе: ${a}x + ${bq}y = 10 және kx + ${bq * c2}y = 11. k-ның қандай мәнінде жүйенің шешімі жоқ?`, fields: [{ key: "x", label: "k" }],
      check: ({ x }) => M.near(x, k) ? { ok: true, why: `${a}/k = ${bq}/${bq * c2} → k = ${k}. Ал 10·${c2} = ${10 * c2} ≠ 11 - түзулер параллель және сәйкес емес.` } : M.near(x, a / c2) ? { code: "inverted", why: `Қатынас төңкерілді: y коэффициенті ${c2} есе өсті, x коэффициенті де ${c2} есе өсуі керек: ${a}·${c2}.` } : M.near(x, -k) ? { code: "sign", why: "Таңба: коэффициенттер бір бағытта пропорционал болуы керек." } : { code: "calc", why: "Шешім жоқ ↔ көлбеулер тең: x және y коэффициенттерінің қатынасы бірдей." },
      hints: ["Шешімі жоқ жүйе - параллель түзулер: x және y коэффициенттері бір санға пропорционал, бос мүшелер - жоқ.", "Ұқсас мысал: 3x + ky = 7 және 6x + 8y = 11 → 3/6 = k/8 → k = 4.", `Шешім: ${a}/k = ${bq}/${bq * c2} = 1/${c2} → k = ${k}.`] };
  }
  const t2 = M.task({ el: $("t2"), skill: SKILL, title: TITLE, gen });
  window.SAT.functions = { state: () => st, gen, formula, setTf, t2 };
})();
