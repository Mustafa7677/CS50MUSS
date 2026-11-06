/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Writing Task 1 Visuals: процесс диаграммасы, карталар (бұрын/кейін), кесте, дөңгелек диаграммалар.
   Әр түрге 5 қадам: 1) анықтау (кезеңдер реті / карта өзгерістері / деректерден автоматты тұжырымдар),
   2) топтау, 3) шолу (overview), 4) тіл (ырықсыз етіс және рет сөздері / орын және өзгеріс / салыстыру / үлес) + жаңа есеп,
   5) жазу: редактор (≥150 сөз, 20 мин таймер, тарих), ереже тексерісі, ресми критерий атауларымен өзін-өзі тексеру, экспорт.
   Band бағасы ЕШҚАШАН шығарылмайды. AO17Tutor skill id: ielts.writing.t1.<түрі>.<қадам>. */
(() => {
  "use strict";
  const D = window.IELTS_WTV, I = window.IELTS, W = window.IELTS_WT;
  if (!D || !I || !W) return;
  const { $, $$, h, store } = I;
  const root = $("[data-ielts-wtv]");
  if (!root) return;
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, ...kids) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); kids.forEach((k) => e.append(k)); return e; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const KINDS = [["process", "Процесс"], ["map", "Карталар"], ["table", "Кесте"], ["pie", "Дөңгелек диаграмма"]];
  const STEPS = ["1 · Анықтау", "2 · Топтау", "3 · Шолу", "4 · Тіл", "5 · Жазу"];
  const narrow = () => window.matchMedia && matchMedia("(max-width: 560px)").matches;

  /* ================= Суреттер ================= */
  function drawProcess(box) {
    const st = D.process.stages, tall = narrow();
    const cols = tall ? 1 : 2, bw = tall ? 290 : 270, bh = 54, gx = 60, gy = 26;
    const rows = Math.ceil(st.length / cols);
    const Wd = tall ? 360 : cols * bw + (cols - 1) * gx + 40, Hd = rows * (bh + gy) + 30;
    const s = sv("svg", { viewBox: `0 0 ${Wd} ${Hd}`, role: "img", "aria-labelledby": "wtv-pt wtv-pd" },
      sv("title", { id: "wtv-pt" }, "Seaweed packaging: production process"),
      sv("desc", { id: "wtv-pd" }, "Ten stages: " + st.map((x, i) => `${i + 1}. ${x.t}`).join(" ") + " Faulty items return from stage 8 to stage 5."),
      sv("defs", null, sv("marker", { id: "wtv-ar", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, sv("path", { d: "M0 0 L10 5 L0 10 z", fill: "var(--lab-chalk2)" }))));
    // Жылан тәрізді орналасу: екі баған болса, кезеңдер солдан оңға, келесі жол оңнан солға емес - бағандар бойынша жоғарыдан төмен
    const pos = st.map((_, i) => {
      if (cols === 1) return [30, 15 + i * (bh + gy)];
      const c = i < rows ? 0 : 1, r = c === 0 ? i : i - rows;
      return [20 + c * (bw + gx), 15 + r * (bh + gy)];
    });
    st.forEach((x, i) => {
      const [px, py] = pos[i];
      const g = sv("g", null);
      g.append(sv("rect", { x: px, y: py, width: bw, height: bh, rx: 10, fill: "rgba(238,241,228,.06)", stroke: x.id === "check" ? "var(--lab-gold)" : "var(--lab-chalk2)", "stroke-width": x.id === "check" ? 2.5 : 1.5 }));
      g.append(sv("circle", { cx: px + 20, cy: py + bh / 2, r: 13, fill: "var(--lab-gold)" }));
      g.append(sv("text", { x: px + 20, y: py + bh / 2 + 5, "text-anchor": "middle", fill: "#14213d", "font-weight": "700", "font-size": "14" }, String(i + 1)));
      const [l1, l2] = x.label.split("|");
      g.append(sv("text", { x: px + 42, y: py + (l2 ? 23 : 32), "font-size": "14.5", "font-weight": "700" }, l1));
      if (l2) g.append(sv("text", { x: px + 42, y: py + 42, "font-size": "13", fill: "var(--lab-chalk2)" }, l2));
      s.append(g);
      if (i < st.length - 1) {
        const [qx, qy] = pos[i + 1];
        if (qx === px) s.append(sv("line", { x1: px + bw / 2, y1: py + bh + 2, x2: qx + bw / 2, y2: qy - 3, stroke: "var(--lab-chalk2)", "stroke-width": 2, "marker-end": "url(#wtv-ar)" }));
        else s.append(sv("path", { d: `M${px + bw} ${py + 14} C ${px + bw + gx} ${py + 14}, ${qx - gx} ${qy + bh / 2}, ${qx - 3} ${qy + bh / 2}`, fill: "none", stroke: "var(--lab-chalk2)", "stroke-width": 2, "marker-end": "url(#wtv-ar)" }));
      }
    });
    // цикл: 8 → 5
    const [ax, ay] = pos[7], [bx, by] = pos[4];
    const mid = ax - gx / 2;
    const loop = cols === 1
      ? `M${ax + bw} ${ay + bh / 2} C ${ax + bw + 26} ${ay + bh / 2}, ${bx + bw + 26} ${by + bh / 2}, ${bx + bw + 3} ${by + bh / 2}`
      : `M${ax} ${ay + bh / 2} H ${mid} V ${by + bh - 12} H ${bx + bw + 3}`;
    s.append(sv("path", { d: loop, fill: "none", stroke: "var(--lab-gold)", "stroke-width": 2, "stroke-dasharray": "6 5", "marker-end": "url(#wtv-ar)" }));
    s.append(sv("text", { x: cols === 1 ? 30 : bx + 40, y: Hd - 6, "font-size": "12.5", fill: "var(--lab-gold)" }, "faulty items → back to stage 5"));
    box.textContent = "";
    box.append(h("figcaption", null, "Seaweed packaging: from coastal farm to compost"), s);
  }

  function drawMap(box) {
    const P = D.map.places;
    const one = (year, after) => {
      const s = sv("svg", { viewBox: "0 0 300 260", role: "img", "aria-labelledby": `wtv-m${year} wtv-md${year}` },
        sv("title", { id: "wtv-m" + year }, `Kestrel Bay in ${year}`),
        sv("desc", { id: "wtv-md" + year }, after
          ? "2025: housing estate north of the river; bridge across the river; railway line and station in the west; market square and extended school in the centre; car park where the western edge of the forest was; marina with café on the coast."
          : "2000: farmland north of the river; no bridge; no railway; market square and small school in the centre; forest in the south-east; fishing harbour on the coast."));
      const X = (x) => x * 3, Y = (y) => y * 2.6;
      s.append(sv("rect", { x: 0, y: Y(80), width: 300, height: 260 - Y(80), fill: "rgba(57,135,229,.28)" }));
      s.append(sv("text", { x: 250, y: 248, "font-size": "11", fill: "var(--lab-chalk2)" }, "SEA"));
      s.append(sv("path", { d: `M0 ${Y(30)} C 80 ${Y(26)}, 160 ${Y(36)}, 300 ${Y(30)}`, fill: "none", stroke: "rgba(57,135,229,.7)", "stroke-width": 12 }));
      s.append(sv("text", { x: 230, y: Y(30) + 4, "font-size": "10", fill: "var(--lab-chalk)" }, "river"));
      s.append(sv("line", { x1: 0, y1: Y(74), x2: 300, y2: Y(74), stroke: "var(--lab-chalk2)", "stroke-width": 3 }));
      s.append(sv("text", { x: 16, y: Y(74) - 4, "font-size": "10", fill: "var(--lab-chalk2)" }, "coast road"));
      const lbl = (x, y, t, o = {}) => s.append(sv("text", Object.assign({ x: X(x), y: Y(y), "text-anchor": "middle", "font-size": "11.5" }, o), t));
      const area = (x, y, w, hh, fill, dash) => s.append(sv("rect", Object.assign({ x: X(x), y: Y(y), width: X(w), height: Y(hh), rx: 6, fill, stroke: "var(--lab-chalk2)", "stroke-width": 1.2 }, dash ? { "stroke-dasharray": "4 3" } : {})));
      // солтүстік
      if (after) { area(28, 4, 30, 18, "rgba(217,89,38,.35)"); lbl(43, 15, "housing estate"); }
      else { area(10, 4, 80, 18, "rgba(25,158,112,.18)", true); lbl(50, 15, "farmland"); }
      // орталық
      area(34, 46, 18, 16, "rgba(201,133,0,.3)"); lbl(43, 56, "market square");
      area(56, 47, after ? 12 : 7, after ? 15 : 10, "rgba(213,81,129,.35)"); lbl(after ? 62 : 59.5, 45, after ? "school (extended)" : "school", { "font-size": "10.5" });
      // орман / көлік тұрағы
      const fx = after ? 78 : 70;
      area(fx, 44, 98 - fx, 26, "rgba(25,158,112,.4)"); lbl((fx + 98) / 2, 60, "forest");
      if (after) { area(68, 46, 9, 12, "rgba(238,241,228,.15)"); lbl(72.5, 66, "car park", { "font-size": "10.5" }); }
      // жағалау
      if (after) { area(34, 82, 18, 10, "rgba(238,241,228,.14)"); lbl(43, 97, "marina + café", { "font-size": "11" }); }
      else { area(36, 82, 14, 8, "rgba(238,241,228,.1)"); lbl(43, 97, "fishing harbour", { "font-size": "11" }); }
      if (after) {
        s.append(sv("rect", { x: X(40), y: Y(25), width: X(5), height: Y(12), fill: "var(--lab-chalk)" }));
        lbl(52, 41, "bridge", { "font-size": "10.5" });
        s.append(sv("line", { x1: X(3), y1: 0, x2: X(3), y2: Y(74), stroke: "var(--lab-chalk)", "stroke-width": 2.5, "stroke-dasharray": "8 4" }));
        area(6, 44, 14, 10, "rgba(57,135,229,.4)"); lbl(13, 41, "station", { "font-size": "11" });
      }
      // компас
      s.append(sv("path", { d: "M282 14 l5 14 l-5 -4 l-5 4 z", fill: "var(--lab-gold)" }));
      s.append(sv("text", { x: 282, y: 40, "text-anchor": "middle", "font-size": "11", fill: "var(--lab-gold)" }, "N"));
      return h("figure", { class: "lab-board wt-fig", style: "margin:0" }, h("figcaption", null, `Kestrel Bay ${year}`), s);
    };
    box.textContent = "";
    box.append(h("div", { class: "wt-maps" }, one(2000, false), one(2025, true)));
  }

  function drawTable(box) {
    const T = D.table;
    box.textContent = "";
    box.append(h("div", { class: "wt-tblwrap" }, h("table", { class: "wt-tbl", lang: "en" },
      h("caption", null, "Average daily water use per person (litres)"),
      h("thead", null, h("tr", null, h("th", { scope: "col" }, "City"), ...T.years.map((y) => h("th", { scope: "col" }, String(y))))),
      h("tbody", null, ...T.rows.map((r) => h("tr", null, h("th", { scope: "row" }, r.name), ...r.v.map((v) => h("td", null, String(v)))))))));
  }

  function drawPie(box) {
    const P = D.pie;
    const tip = h("div", { class: "wt-tip", hidden: true, role: "presentation" });
    const one = (yi) => {
      const year = P.years[yi], R = 92, cx = 120, cy = 112;
      const s = sv("svg", { viewBox: "0 0 240 230", role: "img", "aria-labelledby": `wtv-pie${yi}` },
        sv("title", { id: "wtv-pie" + yi }, `Household energy use in ${year}: ` + P.cats.map((c) => `${c.name} ${c.v[yi]}%`).join(", ")));
      let a0 = -Math.PI / 2;
      P.cats.forEach((c, ci) => {
        const v = c.v[yi], a1 = a0 + (v / 100) * 2 * Math.PI, large = a1 - a0 > Math.PI ? 1 : 0;
        const p = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R);
        const slice = sv("path", { d: `M${cx} ${cy} L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`, fill: P.colors[ci], stroke: "var(--lab-night)", "stroke-width": 2, "data-c": c.id });
        slice.append(sv("title", null, `${c.name}: ${v}%`));
        slice.addEventListener("mousemove", (e) => { const r = box.getBoundingClientRect(); tip.hidden = false; tip.textContent = `${year} · ${c.name}: ${v}%`; tip.style.left = (e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top + 12) + "px"; });
        slice.addEventListener("mouseleave", () => { tip.hidden = true; });
        s.append(slice);
        const am = (a0 + a1) / 2, [lx, ly] = p(am, v >= 10 ? R * 0.62 : R + 14);
        s.append(sv("text", { x: lx.toFixed(1), y: (ly + 5).toFixed(1), "text-anchor": "middle", "font-size": v >= 10 ? "14" : "12.5", "font-weight": "700", fill: v >= 10 ? "#fff" : "var(--lab-chalk)", "pointer-events": "none", style: v >= 10 ? "paint-order:stroke;stroke:rgba(0,0,0,.3);stroke-width:2px" : "" }, `${v}%`));
        a0 = a1;
      });
      return h("figure", { class: "lab-board wt-fig", style: "margin:0" }, h("figcaption", null, `${year}`), s);
    };
    box.textContent = "";
    box.style.position = "relative";
    box.append(h("div", { class: "wt-pies" }, one(0), one(1)),
      h("ul", { class: "wt-legend lab-board", lang: "en", "aria-label": "Шартты белгілер" }, ...P.cats.map((c, ci) => h("li", null, h("i", { style: `background:${P.colors[ci]}` }), c.name))), tip,
      h("details", { class: "ie-note", style: "margin:8px 0" }, h("summary", null, "Деректер кестесі (%)"),
        h("table", { class: "wt-tbl", lang: "en" }, h("thead", null, h("tr", null, h("th", { scope: "col" }, "Use"), ...P.years.map((y) => h("th", { scope: "col" }, String(y))))),
          h("tbody", null, ...P.cats.map((c) => h("tr", null, h("th", { scope: "row" }, c.name), ...c.v.map((v) => h("td", null, v + "%"))))))));
  }
  const DRAW = { process: drawProcess, map: drawMap, table: drawTable, pie: drawPie };

  /* ================= Деректерден тұжырымдар (кесте, дөңгелек диаграмма) ================= */
  function genTable() {
    const T = D.table, Y = T.years, out = [];
    const rs = I.shuffle(T.rows);
    const yi = Math.floor(Math.random() * 3), [a, b] = rs;
    const more = Math.random() < 0.5;
    out.push({ t: `In ${Y[yi]}, ${a.name} used ${more ? "more" : "less"} water per person than ${b.name}.`, ok: more ? a.v[yi] > b.v[yi] : a.v[yi] < b.v[yi], why: `${Y[yi]}: ${a.name} - ${a.v[yi]}, ${b.name} - ${b.v[yi]} литр.` });
    const c = rs[2], d = c.v[2] - c.v[0], lie = Math.random() < 0.5, dd = lie ? Math.abs(d) + pick([5, 10, -3]) : Math.abs(d);
    out.push({ t: `Between ${Y[0]} and ${Y[2]}, consumption in ${c.name} ${d >= 0 ? "rose" : "fell"} by ${dd} litres.`, ok: dd === Math.abs(d), why: `${c.name}: ${c.v[0]} → ${c.v[2]}, айырма ${Math.abs(d)} литр (${d >= 0 ? "өсу" : "азаю"}).` });
    const y2 = Math.floor(Math.random() * 3), low = T.rows.reduce((m, r) => (r.v[y2] < m.v[y2] ? r : m)), cand = pick(T.rows);
    out.push({ t: `${cand.name} had the lowest figure in ${Y[y2]}.`, ok: cand === low, why: `${Y[y2]} жылы ең аз - ${low.name} (${low.v[y2]}).` });
    const e = rs[3], rising = e.v[2] > e.v[0], claimRise = Math.random() < 0.5;
    out.push({ t: `Water use in ${e.name} was higher in ${Y[2]} than in ${Y[0]}.`, ok: e.v[2] > e.v[0], why: `${e.name}: ${Y[0]} - ${e.v[0]}, ${Y[2]} - ${e.v[2]}.` });
    void rising; void claimRise;
    return out.some((x) => x.ok) && out.some((x) => !x.ok) ? out : genTable();
  }
  function genPie() {
    const P = D.pie, Y = P.years, out = [];
    const cs = I.shuffle(P.cats), yi = Math.floor(Math.random() * 2), [a, b] = cs;
    out.push({ t: `In ${Y[yi]}, ${a.name.toLowerCase()} accounted for a larger share than ${b.name.toLowerCase()}.`, ok: a.v[yi] > b.v[yi], why: `${Y[yi]}: ${a.name} - ${a.v[yi]}%, ${b.name} - ${b.v[yi]}%.` });
    const c = cs[2], lie = Math.random() < 0.5, to = lie ? c.v[1] + pick([3, -3, 5]) : c.v[1];
    out.push({ t: `The share of ${c.name.toLowerCase()} changed from ${c.v[0]}% to ${to}%.`, ok: to === c.v[1], why: `${c.name}: ${c.v[0]}% → ${c.v[1]}%.` });
    const d = cs[3], y2 = Math.floor(Math.random() * 2);
    out.push({ t: `In ${Y[y2]}, ${d.name.toLowerCase()} made up more than a quarter of the total.`, ok: d.v[y2] > 25, why: `A quarter = 25%. ${d.name} ${Y[y2]}: ${d.v[y2]}%.` });
    const e = cs[4];
    out.push({ t: `The proportion of energy used for ${e.name.toLowerCase()} fell between ${Y[0]} and ${Y[1]}.`, ok: e.v[1] < e.v[0], why: `${e.name}: ${e.v[0]}% → ${e.v[1]}%.` });
    return out.some((x) => x.ok) && out.some((x) => !x.ok) ? out : genPie();
  }
  // Карта: орын сұрақтары (2025 жылғы нысандар координаттарынан есептеледі)
  function dirOf(a, b) { // a нысаны b-ге қатысты қайда?
    const dx = a[0] - b[0], dy = b[1] - a[1]; // dy > 0 → a солтүстікте
    const ns = dy > 0 ? "north" : "south", ew = dx > 0 ? "east" : "west";
    if (Math.abs(dx) > 2 * Math.abs(dy)) return "to the " + ew + " of";
    if (Math.abs(dy) > 2 * Math.abs(dx)) return "to the " + ns + " of";
    return `to the ${ns}-${ew} of`;
  }
  function genLoc() {
    const P = D.map.places, keys = Object.keys(P).filter((k) => k !== "bridge");
    const [a, b] = I.shuffle(keys);
    const right = dirOf(P[a].at, P[b].at);
    const all = ["to the north of", "to the south of", "to the east of", "to the west of", "to the north-east of", "to the north-west of", "to the south-east of", "to the south-west of"];
    const opts = I.shuffle([right, ...I.shuffle(all.filter((x) => x !== right)).slice(0, 3)]);
    return { q: `In 2025, the ${P[a].t} is ____ the ${P[b].t}.`, right, opts, a: P[a], b: P[b] };
  }

  /* ================= Бір түрдің зертханасы ================= */
  const BUILT = {};
  function build(kind) {
    const V = D[kind], panel = h("section", { class: "lab wt-panel", id: "wtv-" + kind, "aria-labelledby": `wtv-h-${kind}` });
    const SK = (step) => `ielts.writing.t1.${kind}.${step}`;
    panel.append(h("h2", { id: `wtv-h-${kind}` }, "Task 1 · " + V.title),
      h("p", { class: "ie-qcard ie-prompt", lang: "en" }, V.prompt), h("p", { class: "ie-instr" }, V.note));
    const fig = h("figure", { class: kind === "process" ? "lab-board wt-fig" : "wt-figbox", style: "margin:0", id: `wtv-fig-${kind}` });
    panel.append(fig); DRAW[kind](fig);
    if (kind === "process" && window.matchMedia) { let was = narrow(); matchMedia("(max-width: 560px)").addEventListener("change", () => { if (narrow() !== was) { was = narrow(); drawProcess(fig); } }); }

    const DONE = store.get(`wt:${kind}:steps`, {});
    const nav = h("ol", { class: "ie-steps", "aria-label": "Қадамдар" });
    const btns = STEPS.map((t, i) => { const b = h("button", { type: "button", class: DONE[i] ? "done" : "", onclick: () => go(i) }, t); nav.append(h("li", null, b)); return b; });
    const steps = [];
    const markDone = (i) => { DONE[i] = true; store.set(`wt:${kind}:steps`, DONE); btns[i].classList.add("done"); };
    function go(i) { steps.forEach((s, k) => { s.hidden = k !== i; }); btns.forEach((b, k) => { if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); }); const hh = $("h3", steps[i]); if (hh) hh.focus({ preventScroll: true }); store.set(`wt:${kind}:cur`, i); }
    panel.append(nav);
    const step = (title, instr) => { const s = h("div", { class: "wt-stage", hidden: true }, h("h3", { tabindex: "-1" }, title), instr ? h("p", { class: "ie-instr" }, instr) : null); steps.push(s); panel.append(s); return s; };
    const nextBtn = (i) => h("button", { type: "button", class: "btn secondary", onclick: () => go(i + 1) }, "Келесі қадам →");

    /* ---- 1. Анықтау ---- */
    if (kind === "process") {
      const s1 = step("1-қадам. Кезеңдерді ретке келтіру", "Кезеңдер араласып кеткен. Диаграммаға қарап, ↑ ↓ батырмаларымен дұрыс ретке қойыңыз. Алдымен басы мен соңын табыңыз - процесс неден басталып, немен аяқталады?");
      let order = store.get("wt:process:order", null);
      if (!order || order.length !== V.stages.length) { do order = I.shuffle(V.stages.map((x) => x.id)); while (order.every((id, i) => id === V.stages[i].id)); }
      const ol = h("ol", { class: "wt-order", lang: "en" }), fb = h("div", { "aria-live": "polite" }), hEl = h("div");
      const paint = (focusIdx, dir) => {
        ol.textContent = "";
        order.forEach((id, i) => {
          const st = V.stages.find((x) => x.id === id);
          const up = h("button", { type: "button", "aria-label": `«${st.t}» жоғары`, disabled: i === 0, onclick: () => mv(i, -1) }, "↑");
          const dn = h("button", { type: "button", "aria-label": `«${st.t}» төмен`, disabled: i === order.length - 1, onclick: () => mv(i, 1) }, "↓");
          ol.append(h("li", { "data-id": id }, h("span", null, st.t), h("div", { class: "wt-mv" }, up, dn)));
        });
        if (focusIdx != null) { const li = ol.children[focusIdx]; const b = $$("button", li)[dir < 0 ? 0 : 1]; (b && !b.disabled ? b : $$("button", li).find((x) => !x.disabled)).focus(); }
      };
      const mv = (i, d) => { [order[i], order[i + d]] = [order[i + d], order[i]]; store.set("wt:process:order", order); paint(i + d, d); };
      paint();
      const hapi = window.AO17Tutor ? AO17Tutor.hints(hEl, [
        "Шикізаттан бастаңыз: зауытқа не келеді? Сосын әр кезең үшін сұраңыз: бұл кезеңге алдыңғы кезеңнің НӘТИЖЕСІ керек пе? (сүзу үшін гель керек, гель үшін қайнату керек).",
        "Ұқсас мысал (нан пісіру): ұн мен су араластырылады → қамыр илектеледі → пішінге салынады → пешке қойылады → салқындатылады → оралады. «Қамыр» болмай илемейсіз - нәтиже-тізбекті іздеңіз.",
        "Шешім: " + V.stages.map((x, i) => `${i + 1}) ${x.t}`).join(" "),
      ], { onSolution: () => { order = I.shuffle(order); store.set("wt:process:order", order); paint(); I.feedback(fb, "info", "Шешім ашылды - кезеңдер қайта араластырылды", "Енді диаграммаға қарамай-ақ, есте сақтағаныңызбен қайта реттеп көріңіз - бұл меңгеруге саналады."); } }) : null;
      s1.append(ol, h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        let good = 0; const bad = [];
        order.forEach((id, i) => { const ok = V.stages[i].id === id; ol.children[i].classList.toggle("ok", ok); ol.children[i].classList.toggle("no", !ok); if (ok) good++; else bad.push(V.stages.find((x) => x.id === id)); });
        const all = good === order.length;
        I.record(SK("order"), { item: "order", ok: all, hints: hapi ? hapi.used() : 0, error: all ? "" : "sequence", note: `${good}/10`, title: "Task 1 процесс: кезеңдер реті" });
        I.feedback(fb, all ? "ok" : "bad", all ? "Рет дұрыс: 10 / 10" : `${good} / 10 кезең өз орнында`, all ? "Енді кезеңдерді топтарға бөлеміз - абзацтар сол топтардан шығады." : "Қызыл кезеңдер орнында емес. Себебі: " + bad.slice(0, 3).map((b) => `«${b.t.slice(0, 40)}…» - ${b.clue}`).join(" "));
        if (all) markDone(0);
      } }, "Ретті тексеру"), nextBtn(0)), fb, hEl);
    } else {
      const s1 = step(kind === "map" ? "1-қадам. Не өзгерді?" : "1-қадам. Деректерді оқу", kind === "map" ? "Екі картаны салыстырып, әр тұжырым картаға сай ма - анықтаңыз." : "Әр тұжырым деректерге сай ма? Тұжырымдар сандардан автоматты құрастырылады - «Жаңа тұжырымдар» жаңа жиын береді.");
      const list = h("ul", { class: "wt-rows", lang: "en" }), fb = h("div", { "aria-live": "polite" }), hEl = h("div");
      let set = [], picks = {};
      const paint = () => {
        set = kind === "map" ? I.shuffle(V.facts).slice(0, 5) : kind === "table" ? genTable() : genPie();
        picks = {}; list.textContent = ""; fb.textContent = ""; fb.className = "";
        set.forEach((x, i) => {
          const rfb = h("div", { class: "ie-qfb", "aria-live": "polite" });
          list.append(h("li", { "data-ok": String(x.ok) }, h("span", null, x.t), W.choice([{ t: "Сай", v: true }, { t: "Сай емес", v: false }], `${i + 1}-тұжырым`, (o) => { picks[i] = o.v; }), rfb));
        });
      };
      paint();
      const hapi = window.AO17Tutor ? AO17Tutor.hints(hEl, kind === "map" ? [
        "Әр тұжырымдағы нысанды (forest, school, bridge) екі картадан да табыңыз: 2000 жылы қандай еді, 2025 жылы қандай?",
        "Ұқсас мысал: 2000 - «park», 2025 - «park + playground». «The park was removed» - сай емес (саябақ қалды, ойын алаңы қосылды).",
        "Шешім: тұжырымдағы шектеу сөздерге қараңыз (completely, all, new). Мысалы, «completely removed» - орман тек бір бөлігінен айырылды, демек сай емес. Картада мүлде жоқ нысан (hospital) - әрқашан сай емес.",
      ] : [
        "Тұжырымдағы жылды және нысандарды табыңыз, сосын кестеден (не диаграммадан) екі санды оқып, салыстырыңыз.",
        kind === "table" ? "Ұқсас мысал: «In 2005, Arden used more than Corvel» → 165 > 140 → сай. «rose by 10» - айырманы есептеңіз: соңғы − алғашқы." : "Ұқсас мысал: «more than a quarter» → 25%-дан көп пе? 24% - сай емес, 38% - сай.",
        "Шешім: әр тұжырымның астындағы түсіндірме тексергеннен кейін ашылады. Сосын «Жаңа тұжырымдар» батырмасы жаңа жиын береді - оны көмексіз шешіңіз.",
      ], { onSolution: () => { paint(); I.feedback(fb, "info", "Жаңа жиын берілді", "Шешім ашылған соң бұл жиын меңгеруге саналмайды - жаңасын көмексіз шешіңіз."); } }) : null;
      s1.append(list, h("div", { class: "lab-row" },
        h("button", { type: "button", class: "btn", onclick: () => {
          if (Object.keys(picks).length < set.length) { I.feedback(fb, "info", "Барлық тұжырымға жауап беріңіз", "Әрқайсысына «Сай» не «Сай емес» таңдаңыз."); return; }
          let good = 0;
          set.forEach((x, i) => { const ok = picks[i] === x.ok; if (ok) good++; const li = list.children[i]; I.feedback($(".ie-qfb", li), ok ? "ok" : "bad", ok ? "Дұрыс" : (x.ok ? "Бұл тұжырым сай" : "Бұл тұжырым сай емес"), x.why); });
          const all = good === set.length;
          I.record(SK("identify"), { item: set.map((x) => x.t.slice(0, 20)).join("|"), ok: all, hints: hapi ? hapi.used() : 0, error: all ? "" : "misread-data", title: `Task 1 ${V.title}: деректерді оқу` });
          I.feedback(fb, all ? "ok" : "bad", `${good} / ${set.length} дұрыс`, all ? "Дерекке негізделген салыстыру - Task Achievement-тің өзегі." : "Қате тұжырымның астындағы санды не картадағы нысанды қайта қараңыз. Шектеу сөздері (completely, all, only) мен сандардың дәлдігі - жиі тұзақ.");
          if (all) markDone(0);
        } }, "Тексеру"),
        h("button", { type: "button", class: "btn secondary", onclick: () => { paint(); if (hapi) hapi.reset(); } }, "Жаңа тұжырымдар"), nextBtn(0)), fb, hEl);
    }

    /* ---- 2. Топтау ---- */
    {
      const items = kind === "process" ? V.stages.map((x, i) => ({ id: x.id, t: `${i + 1}. ${x.t}`, a: x.phase }))
        : kind === "map" ? V.changes.map((x) => ({ id: x.id, t: x.t, a: x.type }))
        : kind === "table" ? V.rows.map((r) => { const d = r.v[2] - r.v[0]; return { id: r.id, t: `${r.name}: ${r.v.join(" → ")}`, a: Math.abs(d) <= 5 ? "stable" : d > 0 ? "rose" : "fell", why: `${r.v[0]} → ${r.v[2]}: айырма ${d > 0 ? "+" : ""}${d}.` }; })
        : V.cats.map((c) => { const d = c.v[1] - c.v[0]; return { id: c.id, t: `${c.name}: ${c.v[0]}% → ${c.v[1]}%`, a: Math.abs(d) <= 2 ? "flat" : d > 0 ? "up" : "down", why: `Айырма ${d > 0 ? "+" : ""}${d} пайыздық тармақ.` }; });
      const s2 = step("2-қадам. Топтау", kind === "process" ? "Абзацтар кезеңдер тобынан құралады. Әр кезеңді үш фазаның біріне жатқызыңыз." : kind === "map" ? "Өзгерістерді түріне қарай топтаңыз: негізгі абзацтарды осы топтармен құрасыз." : "Ұқсас өзгерістерді бір топқа жинаңыз - бір абзацта бір топ.");
      const ul = h("ul", { class: "wt-rows", lang: "en" }), fb = h("div", { "aria-live": "polite" }), hEl = h("div");
      const sels = items.map((it) => {
        const sel = h("select", { class: "ie-sel", id: `wtv-g-${kind}-${it.id}`, lang: "kk" }, h("option", { value: "" }, "- топ -"), ...V.groups.map((g) => h("option", { value: g.id }, g.t)));
        const rfb = h("div", { class: "ie-qfb", "aria-live": "polite" });
        ul.append(h("li", null, h("label", { for: sel.id }, it.t), sel, rfb));
        return { it, sel, rfb };
      });
      const hapi = window.AO17Tutor ? AO17Tutor.hints(hEl, [
        kind === "process" ? "Фазалар - кезеңдердің ретті блоктары: дайындау аяқталған соң өндіріс басталады. Шекараны тап: шикізат қай кезде «материалға» айналады?" : kind === "map" ? "Әр өзгеріске сұрақ: бұрын бұл жерде ештеңе болмады ма (жаңа)? Бір нәрсе басқаға айналды ма? Тек көлемі өзгерді ме? Мүлде өзгермеді ме?" : "Әр қатар үшін соңғы мән − алғашқы мән = айырма. Белгісі мен шамасына қараңыз.",
        kind === "process" ? "Ұқсас мысал (кофе): жинау, кептіру, қуыру - дайындау; ұнтақтау, орау - өндіру; жеткізу - тарату." : kind === "map" ? "Ұқсас мысал: «The cinema was turned into a library» - басқаға айналды; «A new road was built» - жаңа; «The park was made smaller» - көлемі." : "Ұқсас мысал: 80 → 82 → 79 - шамалы өзгеріс; 50 → 70 - өсу; 90 → 60 - азаю.",
        "Шешім: " + items.map((it) => `${it.t.slice(0, 34)}… → ${V.groups.find((g) => g.id === it.a).t}`).join("; "),
      ]) : null;
      s2.append(ul, h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        let good = 0;
        sels.forEach(({ it, sel, rfb }) => {
          const ok = sel.value === it.a; if (ok) good++;
          sel.classList.toggle("ok", ok); sel.classList.toggle("no", !ok);
          const right = V.groups.find((g) => g.id === it.a).t;
          I.feedback(rfb, ok ? "ok" : "bad", ok ? "Дұрыс" : `Дұрысы: ${right}`, it.why || (kind === "process" ? V.stages.find((x) => x.id === it.id).clue : !sel.value ? "Топ таңдалмады." : "Екі картадағы осы нысанды қайта салыстырыңыз: жаңа ма, басқаға айналды ма, тек өлшемі өзгерді ме?"));
        });
        const all = good === items.length;
        I.record(SK("group"), { item: "group", ok: all, hints: hapi ? hapi.used() : 0, error: all ? "" : "grouping", note: `${good}/${items.length}`, title: `Task 1 ${V.title}: топтау` });
        I.feedback(fb, all ? "ok" : "bad", `${good} / ${items.length} дұрыс`, all ? "Топтар дайын: әр топ - бір негізгі абзац. Абзацтар саны 2-3 болғаны жеткілікті." : "Қате жолдардың түсіндірмесін оқыңыз.");
        if (all) markDone(1);
      } }, "Топтауды тексеру"), nextBtn(1)), fb, hEl);
    }

    /* ---- 3. Шолу ---- */
    {
      const s3 = step("3-қадам. Шолу (overview)", "Қай сөйлемдер шолу бола алады? Дұрыс ЖӘНЕ жалпы сөйлемдердің бәрін белгілеңіз.");
      const ul = h("ul", { class: "ie-chk", lang: "en" }), fb = h("div", { "aria-live": "polite" });
      const ov = I.shuffle(V.overview);
      const cbs = ov.map((o, i) => { const id = `wtv-ov-${kind}-${i}`, cb = h("input", { type: "checkbox", id }); ul.append(h("li", null, cb, h("label", { for: id }, o.t))); return { o, cb }; });
      s3.append(ul, h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        let good = 0; const notes = [];
        cbs.forEach(({ o, cb }) => {
          const want = o.kind === "overview", ok = cb.checked === want; if (ok) good++;
          const li = cb.closest("li"); li.classList.toggle("ok", want); li.classList.toggle("no", cb.checked && !want);
          if (!ok) notes.push(`«${o.t.slice(0, 44)}…» - ${o.why}`);
        });
        const all = good === cbs.length;
        const err = cbs.find(({ o, cb }) => cb.checked && o.kind === "false") ? "accepted-false-overview" : cbs.find(({ o, cb }) => cb.checked && o.kind === "detail") ? "detail-as-overview" : all ? "" : "missed-overview";
        I.record(`ielts.writing.t1.overview`, { item: kind, ok: all, error: err, title: "Task 1: шолу (overview)" });
        I.feedback(fb, all ? "ok" : "bad", all ? "Дұрыс: екі шолу сөйлемі таңдалды." : `${good} / ${cbs.length} дұрыс`, all ? "Шолуда - бүкіл суреттің басты ерекшеліктері, нақты сан мен бөлшек жоқ. Жасыл сөйлемдер - шолу." : notes.join(" "));
        if (all) markDone(2);
      } }, "Тексеру"), nextBtn(2)), fb);
    }

    /* ---- 4. Тіл ---- */
    {
      const L = V.lang, s4 = step("4-қадам. " + L.title, L.intro);
      const box = h("div"), fb = h("div", { "aria-live": "polite" });
      const answers = {};
      L.items.forEach((it, i) => {
        const [a, b] = it.s.split("{}");
        const sel = h("select", { class: "ie-sel", id: `wtv-l-${kind}-${i}`, "aria-label": `${i + 1}-сөйлемдегі бос орын` }, h("option", { value: "" }, "…"), ...I.shuffle(it.opts).map((o) => h("option", { value: o[0] }, o[0])));
        sel.addEventListener("change", () => { answers[i] = sel.value; });
        const rfb = h("div", { class: "ie-qfb", "aria-live": "polite" });
        box.append(h("p", { class: "wt-gap", lang: "en" }, `${i + 1}. `, a, sel, b), rfb);
        it._sel = sel; it._fb = rfb;
      });
      s4.append(box, h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        let good = 0;
        L.items.forEach((it, i) => {
          const v = it._sel.value, o = it.opts.find((x) => x[0] === v), right = it.opts.find((x) => x[1]);
          const ok = !!(o && o[1]); if (ok) good++;
          it._sel.classList.toggle("ok", ok); it._sel.classList.toggle("no", !ok);
          I.feedback(it._fb, ok ? "ok" : "bad", ok ? "Дұрыс" : `Дұрысы: ${right[0]}`, o ? o[2] : "Нұсқа таңдалмады. " + right[2]);
        });
        const all = good === L.items.length;
        I.record(SK("language"), { item: "lang", ok: all, error: all ? "" : "form", note: `${good}/${L.items.length}`, title: `Task 1 ${V.title}: тіл` });
        I.feedback(fb, all ? "ok" : "bad", `${good} / ${L.items.length} дұрыс`, all ? "Тіл құралдары дайын. Төменде - көмексіз жаңа есеп (меңгеру)." : "Әр қатенің астында - қандай форма/мағына шатасқанын түсіндіретін жазба.");
        if (all) markDone(3);
      } }, "Тексеру"), nextBtn(3)), fb);

      // Жаңа есеп (меңгеру)
      const m = h("div", { class: "lab-task" }, h("b", null, "Жаңа есеп (көмексіз): "));
      const mBody = h("div"), mFb = h("div", { "aria-live": "polite" });
      m.append(mBody, mFb);
      s4.append(m);
      if (kind === "process") {
        let cur = null;
        const inp = h("input", { type: "text", class: "ie-in", id: "wtv-tr-in", lang: "en", autocomplete: "off", style: "width:100%" });
        const q = h("p", { class: "wt-gap", lang: "en" });
        const newQ = () => { cur = pick(L.transform.filter((x) => x !== cur)); q.textContent = cur.a; inp.value = ""; inp.className = "ie-in"; mFb.textContent = ""; mFb.className = ""; };
        mBody.append(h("span", null, "Белсенді сөйлемді ырықсыз етіске (passive) айналдырыңыз:"), q, h("label", { for: inp.id, class: "ie-sr" }, "Ырықсыз етістегі сөйлем"), inp,
          h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => {
            const v = I.norm(inp.value).replace(/\.$/, "");
            const ok = cur.accept.includes(v);
            let why;
            if (ok) why = "Объект бастауышқа айналды, ал is/are + V3 әрекетті көрсетеді. «by …» - міндетті емес: процесте орындаушы көбіне маңызды емес.";
            else if (!v) why = "Сөйлем жазыңыз.";
            else if (/\b(was|were)\b/.test(v)) why = "Өткен шақ (was/were): процесс - үнемі қайталанатын әрекет, осы шақ керек (is/are).";
            else if (!/\b(is|are)\b/.test(v)) why = "Көмекші етістік (is/are) жоқ - ырықсыз етіс: be + V3.";
            else if (/\bis\b/.test(v) && /^(faulty items|items)/.test(v)) why = "Бастауыш көпше - are керек.";
            else if (cur.accept[0].split(" ").slice(0, 2).join(" ") !== v.split(" ").slice(0, 2).join(" ")) why = `Бастауыш - бастапқы сөйлемнің объектісі болуы керек: «${cur.accept[0].split(" ").slice(0, cur.accept[0].indexOf(" is ") > 0 ? cur.accept[0].slice(0, cur.accept[0].indexOf(" is ")).split(" ").length : 2).join(" ")} …».`;
            else why = `Құрылымды тексеріңіз. Үлгі: «${cur.accept[0][0].toUpperCase() + cur.accept[0].slice(1)}.»`;
            inp.classList.toggle("ok", ok); inp.classList.toggle("no", !ok);
            I.record(SK("passive"), { item: cur.a, ok, error: ok ? "" : "passive-form", title: "Task 1 процесс: ырықсыз етіс" });
            I.feedback(mFb, ok ? "ok" : "bad", ok ? "Дұрыс" : "Әлі емес", why);
          } }, "Тексеру"), h("button", { type: "button", class: "btn secondary", onclick: newQ }, "Жаңа сөйлем")));
        newQ();
      } else if (kind === "map") {
        const paintLoc = () => {
          const g = genLoc(); mBody.textContent = ""; mFb.textContent = ""; mFb.className = "";
          mBody.append(h("p", { class: "wt-gap", lang: "en" }, g.q), W.choice(g.opts.map((o) => ({ t: o, ok: o === g.right })), "Орын тіркесі", (o, btn) => {
            const ok = o.ok;
            I.record(SK("location"), { item: g.q, ok, error: ok ? "" : "direction", title: "Task 1 карта: орын тілі" });
            I.feedback(mFb, ok ? "ok" : "bad", ok ? "Дұрыс" : `Дұрысы: ${g.right}`, `2025 картасында ${g.a.t} - ${g.b.t}-ге қатысты ${g.right.replace("to the ", "").replace(" of", "")} жақта. Солтүстік - карта жоғарысы (N белгісі). ${ok ? "" : "Есте сақтаңыз: X is to the west of Y - X Y-тің СОЛ жағында."}`);
            btn.classList.add(ok ? "ok" : "no");
          }), h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn secondary", onclick: paintLoc }, "Жаңа сұрақ")));
        };
        paintLoc();
      } else {
        const paintNum = () => {
          mBody.textContent = ""; mFb.textContent = ""; mFb.className = "";
          let q, right, opts, why;
          if (kind === "table") {
            const r = pick(D.table.rows), d = r.v[2] - r.v[0];
            q = `Between 2005 and 2025, water use in ${r.name} ${d >= 0 ? "rose" : "fell"} by ____ litres.`;
            right = String(Math.abs(d)); opts = I.shuffle([...new Set([right, String(Math.abs(d) + 5), String(Math.abs(r.v[1] - r.v[0])), String(r.v[2])])]).slice(0, 4);
            if (!opts.includes(right)) opts[0] = right;
            why = `${r.v[0]} → ${r.v[2]}: ${Math.abs(d)}. «by» + айырма; «to» + соңғы мән (${r.v[2]}).`;
          } else {
            const c = pick(D.pie.cats.filter((x) => x.v[1] !== x.v[0]));
            const ratio = c.v[1] / c.v[0];
            q = `Between 1995 and 2025, the share of ${c.name.toLowerCase()} ____ (${c.v[0]}% → ${c.v[1]}%).`;
            right = ratio >= 2 ? "more than doubled" : ratio > 1 ? "rose moderately" : ratio <= 0.5 ? "fell by more than half" : "fell moderately";
            opts = I.shuffle(["more than doubled", "rose moderately", "fell by more than half", "fell moderately"]);
            why = `${c.v[1]} ÷ ${c.v[0]} ≈ ${ratio.toFixed(2)}. ≥ 2 → more than doubled; ≤ 0,5 → fell by more than half.`;
          }
          mBody.append(h("p", { class: "wt-gap", lang: "en" }, q), W.choice(opts.map((o) => ({ t: o, ok: o === right })), "Жауап нұсқалары", (o, btn) => {
            I.record(SK("numbers"), { item: q, ok: o.ok, error: o.ok ? "" : "calc", title: `Task 1 ${V.title}: сандармен сипаттау` });
            I.feedback(mFb, o.ok ? "ok" : "bad", o.ok ? "Дұрыс" : `Дұрысы: ${right}`, why);
            btn.classList.add(o.ok ? "ok" : "no");
          }), h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn secondary", onclick: paintNum }, "Жаңа сұрақ")));
        };
        paintNum();
      }
    }

    /* ---- 5. Жазу ---- */
    {
      const s5 = step("5-қадам. Толық жауап", "Құрылым ұсынысы: кіріспе (тапсырманы өз сөзіңізбен) → шолу → 2-3 негізгі абзац (2-қадамдағы топтар). Task 1-де қорытынды-пікір жазылмайды.");
      const edBox = h("div"), fb = h("div", { "aria-live": "polite" }), chkBox = h("div"), expBox = h("div");
      s5.append(edBox);
      const ed = W.editor(edBox, { key: "t1-" + kind, target: 150, minutes: 20, label: `Task 1 (${V.title}) мәтіні` });
      s5.append(h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => { const R = check(kind, ed.value); W.rules(fb, R, "Ереже тексерісі (баға емес)", "Бұл тек өлшенетін нәрселерді көреді: сөз саны, шолу белгісі, кезеңдер/өзгерістер қамтылуы, сандардың дәлдігі, тіл белгілері. Сапаны төмендегі тізіммен өзіңіз бағалаңыз."); if (!R.some((r) => r[0] === "no")) markDone(4); } }, "Ережемен тексеру")), fb,
        h("h3", null, "Өзін-өзі тексеру"), h("p", { class: "ie-instr" }, "Ресми критерийлер атауымен рефлексия сұрақтары. Белгілер тек осы браузерде сақталады. AO17 band бағасын қоймайды."), chkBox,
        h("h3", null, "Мұғалімге жіберу"), expBox);
      const getChk = W.checklist(chkBox, D.checklist, "t1-" + kind);
      W.exporter(expBox, { name: "ielts-task1-" + kind, getBundle: () => ({ app: "AO17 IELTS Task 1 Visuals", kind, exported: new Date().toISOString(), note: "Тәжірибелік жұмыс. Ресми IELTS бағасы емес.", prompt: V.prompt, steps: store.get(`wt:${kind}:steps`, {}), text: ed.value, words: I.words(ed.value), ruleCheck: check(kind, ed.value), selfCheck: getChk(), history: ed.history().map((x) => ({ t: new Date(x.t).toISOString(), words: x.wc, why: x.why })) }),
        toText: (b) => [`AO17 IELTS Task 1 Visuals (${V.title}) - ${new Date().toLocaleString("kk-KZ")}`, "Тәжірибелік жұмыс, ресми IELTS бағасы емес.", "", "ТАПСЫРМА", V.prompt, "", "МӘТІН", b.text || "(бос)", "", `Сөз саны: ${b.words}`, `Аяқталған қадамдар: ${Object.keys(b.steps).map((k) => STEPS[k]).join(", ") || "-"}`, "", "ЕРЕЖЕ ТЕКСЕРІСІ", ...b.ruleCheck.map(([k, x]) => `  [${k === "ok" ? "✓" : k === "no" ? "!" : "i"}] ${x}`), "", "ӨЗІН-ӨЗІ ТЕКСЕРУ", W.ckText(b.selfCheck), ""].join("\n") });
    }

    go(Math.min(4, store.get(`wt:${kind}:cur`, 0)));
    return panel;
  }

  /* ================= Ереже тексерісі ================= */
  const PASSIVE = /\b(is|are|was|were|be|been|being)\s+(\w+ly\s+)?(\w+ed|built|made|put|cut|sent|kept|left|held|brought|taken|given|done|shown|grown|ground|dug|laid)\b/g;
  function numCheck(t, allowed) {
    const nums = (t.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((x) => +x.replace(/,/g, ""));
    const bad = [...new Set(nums.filter((x) => !allowed.has(x)))];
    return { nums, bad };
  }
  function check(kind, t) {
    const V = D[kind], low = t.toLowerCase(), n = I.words(t), R = [];
    R.push(n >= 150 ? ["ok", `${n} сөз - 150 талабы орындалды.`] : ["no", `${n} сөз. Кемінде 150 сөз керек: аз болса, Task Achievement бойынша төмендетілуі мүмкін.`]);
    R.push(/\b(overall|in general|generally|it is clear|in summary|to summarise|to summarize)\b/.test(low) ? ["ok", "Шолу белгісі бар (overall / in general / it is clear). Шолуда басты ерекшеліктер айтылғанын өзіңіз тексеріңіз."] : ["no", "Шолу (overview) белгісі табылмады. «Overall, ...» деп басталатын жеке сөйлем қосыңыз."]);
    const pfirst = V.prompt.split(". ")[0].toLowerCase().replace(/^the \w+ below /, "");
    if (pfirst.length > 30 && low.includes(pfirst.slice(0, 40))) R.push(["no", "Кіріспе тапсырма мәтінін сөзбе-сөз көшіреді - өз сөзіңізбен жазыңыз (synonyms: shows → illustrates, how … is produced → the process of producing …)."]);
    if (/\b(i think|i believe|in my opinion|i feel|in my view)\b/.test(low)) R.push(["no", "Task 1-де жеке пікір жазылмайды - тек суреттегі ақпарат."]);
    if (/\b(because|due to|caused by|the reason)\b/.test(low)) R.push(["info", "Себеп сөздері бар. Суретте себеп көрсетілмесе, ойдан себеп қоспаңыз."]);
    const passives = (low.match(PASSIVE) || []).length;
    if (kind === "process") {
      const cov = V.stages.filter((s) => s.key.some((k) => low.includes(k)));
      R.push(cov.length >= 9 ? ["ok", `${cov.length} / 10 кезең аталды.`] : ["no", `${cov.length} / 10 кезең аталды. Жетіспейді: ${V.stages.filter((s) => !cov.includes(s)).map((s) => s.t.replace(/\.$/, "")).slice(0, 4).join("; ")}.`]);
      R.push(passives >= 5 ? ["ok", `Ырықсыз етіс: ${passives} рет (is/are + V3).`] : ["no", `Ырықсыз етіс тек ${passives} рет. Процесте көбіне is/are + V3: «The seaweed is washed…».`]);
      const seq = ["first", "firstly", "then", "next", "after this", "after that", "afterwards", "once", "following", "subsequently", "finally", "before", "at the next stage", "at this stage", "lastly"].filter((w) => new RegExp("\\b" + w + "\\b").test(low));
      R.push(seq.length >= 4 ? ["ok", `Рет сөздері (${seq.length}): ${seq.join(", ")}.`] : ["no", `Рет сөздері аз (${seq.length}): first, then, once, after this, finally - кезеңдердің ретін көрсетіңіз.`]);
      R.push(/\b(crush|return|recycl|back to|faulty)/.test(low) ? ["ok", "Цикл (ақаулы бұйымдардың қайтуы) аталды."] : ["no", "Диаграммадағы цикл аталмады: ақаулы бұйымдар ұнтақталып, араластыру кезеңіне қайтады."]);
      const past = (low.match(/\b(was|were)\b/g) || []).length;
      if (past >= 3) R.push(["info", `was/were ${past} рет. Процесс - жалпы ақиқат: осы шақ (is/are) қолданылады.`]);
      const { bad } = numCheck(t, new Set([12, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
      if (bad.length) R.push(["no", `Диаграммада жоқ сан: ${bad.join(", ")}.`]);
    } else if (kind === "map") {
      R.push(/2000/.test(t) && /2025/.test(t) ? ["ok", "Екі жыл да (2000, 2025) аталды."] : ["no", "Екі картаның жылын (2000 және 2025) атаңыз."]);
      const cov = V.changes.filter((c) => c.key.some((k) => low.includes(k)));
      R.push(cov.length >= 6 ? ["ok", `${cov.length} / 7 өзгеріс аталды.`] : ["no", `${cov.length} / 7 өзгеріс аталды. Жетіспейді: ${V.changes.filter((c) => !cov.includes(c)).map((c) => c.t.replace(/\.$/, "")).slice(0, 3).join("; ")}.`]);
      const loc = ["north", "south", "east", "west", "next to", "opposite", "near", "beside", "between", "across", "along", "centre", "center"].filter((w) => low.includes(w));
      R.push(loc.length >= 3 ? ["ok", `Орын сөздері (${loc.length}): ${loc.join(", ")}.`] : ["no", `Орын сөздері аз (${loc.length}). to the north of, next to, across the river - оқырман нысанның ҚАЙДА екенін білуі керек.`]);
      const chv = ["replaced", "converted", "built", "constructed", "extended", "enlarged", "expanded", "demolished", "cleared", "added", "removed", "turned into", "developed", "made way"].filter((w) => low.includes(w));
      R.push(chv.length >= 4 ? ["ok", `Өзгеріс етістіктері (${chv.length}): ${chv.join(", ")}.`] : ["no", `Өзгеріс етістіктері аз (${chv.length}): was replaced by, was converted into, was extended, was built.`]);
      R.push(/\b(remain|unchanged|still|same)\b/.test(low) ? ["ok", "Өзгермеген нысан (market square) аталды."] : ["info", "Өзгермеген нысанды да атаған жөн: «The market square remained unchanged»."]);
      R.push(passives >= 3 ? ["ok", `Ырықсыз етіс: ${passives} рет.`] : ["info", `Ырықсыз етіс ${passives} рет. Картада: «A bridge was built…».`]);
      const { bad } = numCheck(t, new Set([2000, 2025, 25]));
      if (bad.length) R.push(["no", `Картада жоқ сан: ${bad.join(", ")}.`]);
    } else {
      const ents = kind === "table" ? V.rows.map((r) => r.name.toLowerCase()) : V.cats.map((c) => c.name.toLowerCase());
      const miss = ents.filter((e) => !low.includes(kind === "pie" ? e.split(" ").pop() : e));
      R.push(!miss.length ? ["ok", "Барлық нысан аталды."] : ["no", "Аталмаған: " + miss.join(", ") + "."]);
      const vals = kind === "table" ? V.rows.flatMap((r) => r.v) : V.cats.flatMap((c) => c.v);
      const allowed = new Set([...vals, ...V.years, 2, 3, 4, 5, 10, 20, 25, 30, 50, 100]);
      const groupsV = kind === "table" ? [...V.rows.map((r) => r.v), ...V.years.map((_, yi) => V.rows.map((r) => r.v[yi]))] : [...V.cats.map((c) => c.v), ...V.years.map((_, yi) => V.cats.map((c) => c.v[yi]))];
      groupsV.forEach((g) => g.forEach((a) => g.forEach((b) => { allowed.add(Math.abs(a - b)); if (b) { allowed.add(Math.round(100 * Math.abs(a - b) / b)); } })));
      if (kind === "pie") V.years.forEach((_, yi) => V.cats.forEach((c) => allowed.add(100 - c.v[yi])));
      const { nums, bad } = numCheck(t, allowed);
      const vnum = nums.filter((x) => !V.years.includes(x));
      R.push(!vnum.length ? ["no", "Мәтінде сан жоқ. Басты ерекшеліктерді сандармен дәлелдеңіз."] : bad.length ? ["no", `Деректерде жоқ сан(дар): ${bad.join(", ")}. Кестені қайта тексеріңіз (айырмалар мен пайыздық өзгерістер де қабылданады).`] : ["ok", `${vnum.length} сан деректерге сай келеді.`]);
      R.push(/\b(than|whereas|while|compared|in contrast|by contrast|twice|times as|the highest|the lowest|the largest|the smallest)\b/.test(low) ? ["ok", "Салыстыру тілі бар."] : ["no", "Салыстыру сөздері жоқ. Тапсырма «make comparisons» дейді."]);
      if (kind === "pie") R.push(/\b(share|proportion|accounted for|made up|percentage|per cent|percent|%)/.test(low) ? ["ok", "Үлес тілі бар (share / proportion / accounted for)."] : ["no", "Үлес тілі жоқ: the share of, accounted for, made up."]);
      if (kind === "pie" && /\b(less energy|more energy|used less|used more|total (amount|consumption))\b/.test(low)) R.push(["info", "Ескерту: диаграмма тек үлесті көрсетеді. «used less energy» деп жалпы мөлшер туралы қорытынды жасамаңыз."]);
    }
    const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
    R.push(paras >= 3 ? ["ok", `${paras} абзац.`] : ["info", `${paras} абзац. Әдетте: кіріспе, шолу, 2-3 негізгі абзац - бос жолмен бөліңіз.`]);
    return R;
  }

  /* ================= Түр ауыстыру ================= */
  const host = $("#wtv-host"), kinds = $("#wtv-kinds");
  const kb = KINDS.map(([k, t]) => { const b = h("button", { type: "button", "aria-pressed": "false", "data-k": k, onclick: () => show(k, true) }, t); kinds.append(b); return b; });
  function show(k, focus) {
    if (!BUILT[k]) { BUILT[k] = build(k); host.append(BUILT[k]); }
    Object.entries(BUILT).forEach(([kk, el]) => { el.hidden = kk !== k; });
    kb.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === k)));
    store.set("wt:kind", k);
    if (focus) { history.replaceState(null, "", "#" + k); $("h2", BUILT[k]).setAttribute("tabindex", "-1"); $("h2", BUILT[k]).focus(); }
  }
  const fromHash = location.hash.slice(1);
  show(KINDS.some(([k]) => k === fromHash) ? fromHash : store.get("wt:kind", "process"));
  window.addEventListener("hashchange", () => { const k = location.hash.slice(1); if (KINDS.some(([x]) => x === k)) show(k); });
  window.IELTS_WTV_CHECK = check; // тесттер үшін
})();
