/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Listening Test - Part 2 картасы (Westmoor Country Park, ойдан шығарылған) және «Бағыт жаттығуы»:
   SVG карта (A-H әріптері), маршрут сызу, кездейсоқ бастау нүктесі мен бағыттан жасалатын жаңа тапсырмалар
   (солтүстікке не оңтүстікке қарап тұрғанда «left/right» әлем тарабына қалай айналатынын тексереді).
   AO17Tutor: ielts.listening.directions. */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const s = (tag, attrs, ...kids) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); kids.forEach((k) => el.append(k instanceof Node ? k : document.createTextNode(k))); return el; };
  /* Координаттар (viewBox 0 0 640 470): басты жол x=320, қиылыс y=250. */
  const P = {
    VC: [320, 410], X: [320, 250], H: [320, 62], WJ: [320, 165], LJ: [320, 125], BJ: [320, 320], AJ: [320, 385],
    A: [372, 385], B: [268, 320], C: [104, 250], D: [556, 250], E: [384, 125], F: [520, 34], G: [204, 150], Ht: [320, 50],
  };
  const LETTERS = { A: P.A, B: P.B, C: P.C, D: P.D, E: P.E, F: P.F, G: P.G, H: P.Ht };
  /** Мақсатқа апаратын жол: басты жолдағы тармақ нүктесі, одан кейінгі нүктелер. */
  const CHAIN = { A: [P.AJ], B: [P.BJ], C: [P.X, [120, 250]], D: [P.X, [540, 250]], G: [P.WJ], E: [P.LJ], H: [P.H], F: [P.LJ, [392, 110], [430, 50], [505, 38]] };
  const DESC = "Саябақ картасы, жоғары жақ - солтүстік. Төменгі ортада келушілер орталығы (оңтүстік кіреберіс), оның сол жағында автотұрақ. Басты жол орталықтан тура солтүстікке, ескі қақпаға дейін созылады. Картаның ортасынан төменірек басты жолды батыстан шығысқа қарай көлденең жол қиып өтеді (қиылыс). Солтүстік-шығыста үлкен көл, солтүстік-батыста орман. Әріптер: A - басты жолдың шығыс жағы, орталықтың дәл жанында; B - басты жолдың батыс жағы, орталық пен қиылыстың арасында; C - көлденең жолдың батыс шеті; D - көлденең жолдың шығыс шеті, көлдің оңтүстігінде; E - басты жолдан көлге апаратын қысқа жолдың соңы, көлдің батыс жағалауы; F - көлдің солтүстік жағалауы; G - қиылыстан кейін басты жолдан батысқа кететін кіші жолдың соңы, орман ішінде; H - басты жолдың солтүстік шеті.";

  function draw({ id, title }) {
    const svg = s("svg", { viewBox: "0 0 640 470", role: "img", "aria-labelledby": `${id}-t ${id}-d`, class: "lt-map", id });
    svg.append(s("title", { id: `${id}-t` }, title || "Westmoor Country Park map"), s("desc", { id: `${id}-d` }, DESC));
    svg.append(s("rect", { x: 8, y: 8, width: 624, height: 454, rx: 18, class: "lt-m-edge" }));
    svg.append(s("ellipse", { cx: 505, cy: 125, rx: 105, ry: 62, class: "lt-m-lake" }));
    svg.append(s("text", { x: 505, y: 132, class: "lt-m-lbl lt-m-big", "text-anchor": "middle" }, "LAKE"));
    const trees = [[60, 60], [95, 45], [130, 70], [170, 50], [210, 75], [250, 55], [80, 110], [125, 125], [165, 105], [255, 110], [60, 160], [100, 185], [150, 190], [255, 190], [280, 145], [55, 205]];
    trees.forEach(([x, y]) => svg.append(s("circle", { cx: x, cy: y, r: 13, class: "lt-m-tree" })));
    svg.append(s("text", { x: 118, y: 92, class: "lt-m-lbl", "text-anchor": "middle" }, "WOODLAND"));
    const paths = [["M320,410 L320,62"], ["M120,250 L540,250"], ["M320,165 L218,150"], ["M320,125 L372,125"]];
    paths.forEach(([d]) => svg.append(s("path", { d, class: "lt-m-path" })));
    svg.append(s("path", { d: "M392,110 Q420,52 505,38", class: "lt-m-trail" }));
    svg.append(s("rect", { x: 262, y: 412, width: 116, height: 40, rx: 6, class: "lt-m-bld" }));
    svg.append(s("text", { x: 320, y: 437, class: "lt-m-lbl", "text-anchor": "middle" }, "Visitor centre"));
    svg.append(s("rect", { x: 120, y: 414, width: 110, height: 36, rx: 4, class: "lt-m-park" }));
    svg.append(s("text", { x: 175, y: 437, class: "lt-m-lbl lt-m-sm", "text-anchor": "middle" }, "Car park"));
    svg.append(s("text", { x: 402, y: 445, class: "lt-m-lbl lt-m-sm" }, "★ You are here"));
    svg.append(s("text", { x: 470, y: 278, class: "lt-m-lbl lt-m-sm", "text-anchor": "middle" }, "→ east"));
    svg.append(s("text", { x: 180, y: 278, class: "lt-m-lbl lt-m-sm", "text-anchor": "middle" }, "west ←"));
    const cmp = s("g", { transform: "translate(590 410)", class: "lt-m-cmp" });
    cmp.append(s("path", { d: "M0,-26 L8,0 L0,-6 L-8,0 Z" }), s("text", { x: 0, y: 18, "text-anchor": "middle", class: "lt-m-lbl" }, "N"));
    svg.append(cmp);
    svg.append(s("g", { class: "lt-m-route" }));
    for (const [L, [x, y]] of Object.entries(LETTERS)) {
      const g = s("g", { class: "lt-m-let", "data-l": L });
      g.append(s("circle", { cx: x, cy: y, r: 14 }), s("text", { x, y: y + 5, "text-anchor": "middle" }, L));
      svg.append(g);
    }
    return svg;
  }
  /** Маршрутты сызу (start: "VC" не "H"). mark: { letter: "ok"|"no" } */
  function route(svg, start, target, mark) {
    const g = svg.querySelector(".lt-m-route"); g.textContent = "";
    svg.querySelectorAll(".lt-m-let").forEach((x) => x.classList.remove("ok", "no", "start"));
    if (!target) return;
    const pts = [P[start], ...CHAIN[target], LETTERS[target]];
    g.append(s("polyline", { points: pts.map((p) => p.join(",")).join(" "), class: "lt-m-line" }));
    g.append(s("circle", { cx: P[start][0], cy: P[start][1], r: 7, class: "lt-m-startdot" }));
    if (mark) for (const [L, k] of Object.entries(mark)) { const el = svg.querySelector(`.lt-m-let[data-l="${L}"]`); if (el) el.classList.add(k); }
  }

  /* ---------- Бағыт жаттығуы: тапсырма генераторы ---------- */
  // {W}/{E} - әлем тарабы; сөйлеушінің бет алған бағытына қарай left/right-қа айналады.
  const T = {
    VC: { intro: "You are standing outside the visitor centre, facing north.", items: {
      A: ["Leave the visitor centre and stop at the first building on your {E}, right next to the path."],
      B: ["Walk north along the main path. Before you get to the crossroads, look on your {W}.", "Head up the main path, but stop before the crossroads. It's on your {W}."],
      C: ["Go up the main path to the crossroads. Turn {W} and follow that path to the very end."],
      D: ["Go up the main path to the crossroads, then turn {E} and keep going until the path ends."],
      G: ["Go straight over the crossroads and take the next small path on your {W}, into the trees."],
      E: ["Walk almost to the top of the main path, and take the short path on your {E} down to the edge of the lake."],
      H: ["Follow the main path north as far as it goes."],
    } },
    H: { intro: "You are standing at the old gate with your back to it, facing south.", items: {
      E: ["Walk a short way down the main path and take the first path on your {E}, down to the water's edge."],
      G: ["Walk down the main path. Before the crossroads, take the small path on your {W}, into the woods."],
      C: ["Walk down to the crossroads, turn {W}, and go to the end of the path."],
      D: ["Walk down to the crossroads, turn {E}, and go right to the end of the path.", "At the crossroads, turn {E}. It's at the end of that path, just south of the lake."],
      B: ["Go straight over the crossroads. Soon after it, look on your {W}."],
      A: ["Walk all the way down the main path. Just before the visitor centre, it's on your {E}."],
    } },
  };
  const side = (start, comp) => (start === "VC" ? (comp === "W" ? "left" : "right") : (comp === "W" ? "right" : "left"));
  const kkSide = (w) => (w === "left" ? "сол" : "оң");
  function gen(prev) {
    const pool = [];
    for (const start of Object.keys(T)) for (const [L, list] of Object.entries(T[start].items)) list.forEach((tpl, i) => pool.push({ start, L, tpl, i }));
    let pick; do { pick = pool[Math.floor(Math.random() * pool.length)]; } while (prev && pool.length > 1 && pick.start === prev.start && pick.L === prev.L);
    const sides = [];
    const text = pick.tpl.replace(/\{(W|E)\}/g, (_, c) => { const w = side(pick.start, c); sides.push({ c, w }); return w; });
    return { start: pick.start, a: pick.L, text: `${T[pick.start].intro} ${text}`, sides,
      why: `${pick.start === "VC" ? "Солтүстікке қарап тұрсыз: сол = батыс, оң = шығыс." : "Оңтүстікке қарап тұрсыз: сол = ШЫҒЫС, оң = БАТЫС (картаға қарағанда керісінше!)."} ${sides.map((x) => `«${x.w}» → ${x.c === "W" ? "батыс" : "шығыс"}`).join(", ")}. Маршрут картада сызылды.` };
  }

  window.IELTS_LT_MAP = { draw, route, gen, side, kkSide, letters: Object.keys(LETTERS) };
})();
