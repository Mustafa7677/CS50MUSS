/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Math зертханаларына (geometry, trig, stats, percent, functions) ортақ көмекшілер: координаталық тақта, сүйрелетін нүкте
   (тінтуір, саусақ және пернетақта), қойындылар, болжам блогы, қадамдық ойнатқыш (Play/Pause/Артқа/Алға/Басынан/Жылдамдық),
   тексерілетін тапсырма + үш деңгейлі көмек + меңгеру есептері (AO17Tutor). sat-core.js-тен кейін жүктеледі. */
(() => {
  "use strict";
  const { svg, h, num, fr, reduced } = window.SAT;
  const T = window.AO17Tutor;

  /** Санды енгізуді оқу: «3», «−2.5», «3/4», «1,5». Қате болса null. */
  const parse = (s) => { const f = fr.parse(String(s || "").replace(/\s+/g, "")); return f ? f.n / f.d : null; };
  const near = (a, b, tol = 1e-6) => a !== null && b !== null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
  const deg = (r) => (r * 180) / Math.PI, rad = (d) => (d * Math.PI) / 180;

  /** Координаталық тақта. o: { x:[min,max], y:[min,max], W, H, grid, label, axes, pad } */
  function board(root, o = {}) {
    const W = o.W || 400, H = o.H || 400, [x0, x1] = o.x || [-10, 10], [y0, y1] = o.y || [-10, 10];
    root.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const sx = W / (x1 - x0), sy = H / (y1 - y0);
    const B = { W, H, x0, x1, y0, y1, root, px: (x) => (x - x0) * sx, py: (y) => H - (y - y0) * sy, ux: (p) => p / sx + x0, uy: (p) => (H - p) / sy + y0, len: (d) => d * sx, layers: {} };
    const grid = svg("g", { "aria-hidden": "true" }, root);
    if (o.grid !== false) {
      const st = o.grid || 1, lb = o.label || 2;
      for (let x = Math.ceil(x0 / st) * st; x <= x1 + 1e-9; x += st) {
        svg("line", { class: "lb-grid", x1: B.px(x), y1: 0, x2: B.px(x), y2: H }, grid);
        if (o.axes !== false && Math.abs(x) > 1e-9 && Math.abs(x / lb - Math.round(x / lb)) < 1e-9 && x > x0 && x < x1) svg("text", { class: "sb-tick", x: B.px(x), y: Math.min(H - 4, Math.max(12, B.py(0) + 14)), "text-anchor": "middle" }, grid).textContent = num(x);
      }
      const sY = o.gridY || st, lY = o.labelY || lb;
      for (let y = Math.ceil(y0 / sY) * sY; y <= y1 + 1e-9; y += sY) {
        svg("line", { class: "lb-grid", x1: 0, y1: B.py(y), x2: W, y2: B.py(y) }, grid);
        if (o.axes !== false && Math.abs(y) > 1e-9 && Math.abs(y / lY - Math.round(y / lY)) < 1e-9 && y > y0 && y < y1) svg("text", { class: "sb-tick", x: Math.max(14, Math.min(W - 4, B.px(0) - 5)), y: B.py(y) + 4, "text-anchor": "end" }, grid).textContent = num(y);
      }
    }
    if (o.axes !== false) {
      if (y0 <= 0 && y1 >= 0) svg("line", { class: "lb-axis", x1: 0, y1: B.py(0), x2: W, y2: B.py(0) }, grid);
      if (x0 <= 0 && x1 >= 0) svg("line", { class: "lb-axis", x1: B.px(0), y1: 0, x2: B.px(0), y2: H }, grid);
    }
    B.layer = (name) => B.layers[name] || (B.layers[name] = svg("g", {}, root));
    B.clear = (name) => { const g = B.layer(name); while (g.firstChild) g.firstChild.remove(); return g; };
    /** Клиент координатасынан (тінтуір) тақта бірлігіне. */
    B.fromClient = (cx, cy) => { const p = root.createSVGPoint(); p.x = cx; p.y = cy; const q = p.matrixTransform(root.getScreenCTM().inverse()); return [B.ux(q.x), B.uy(q.y)]; };
    return B;
  }

  /** Сүйрелетін нүкте. o: { get():[x,y], set(x,y), label(x,y): aria-мәтін, step, name, onEnd(), cls } */
  function dragPoint(B, parent, o) {
    const g = svg("g", { class: "sm-drag " + (o.cls || ""), tabindex: "0", role: "button", "aria-roledescription": "сүйрелетін нүкте" }, parent);
    const halo = svg("circle", { class: "sm-halo", r: 18 }, g);
    const dot = svg("circle", { class: "sm-dot", r: o.r || 8 }, g);
    const txt = o.name && o.showName !== false ? svg("text", { class: "sb-lbl sm-name", "aria-hidden": "true" }, g) : null;
    if (txt) txt.textContent = o.name;
    const step = o.step || 1;
    const upd = () => {
      const [x, y] = o.get();
      const X = B.px(x), Y = B.py(y);
      halo.setAttribute("cx", X); halo.setAttribute("cy", Y); dot.setAttribute("cx", X); dot.setAttribute("cy", Y);
      if (txt) { const [dx, dy] = o.nameOff ? o.nameOff() : [12, -12]; txt.setAttribute("x", Math.min(B.W - 14, Math.max(4, X + dx))); txt.setAttribute("y", Math.min(B.H - 4, Math.max(14, Y + dy))); }
      g.setAttribute("aria-label", (o.label ? o.label(x, y) : `${o.name || "нүкте"} (${num(x)}, ${num(y)})`) + ". Жылжыту: бағыт пернелері" + (o.keyHelp ? ", " + o.keyHelp : "") + ".");
    };
    let dragging = false;
    g.addEventListener("pointerdown", (e) => { dragging = true; g.setPointerCapture(e.pointerId); g.classList.add("on"); e.preventDefault(); });
    g.addEventListener("pointermove", (e) => { if (!dragging) return; const [x, y] = B.fromClient(e.clientX, e.clientY); o.set(x, y, "drag"); });
    const end = () => { if (!dragging) return; dragging = false; g.classList.remove("on"); if (o.onEnd) o.onEnd(); };
    g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
    g.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (!k) return;
      e.preventDefault();
      const m = e.shiftKey ? 5 : 1, [x, y] = o.get();
      o.set(x + k[0] * step * m, y + k[1] * step * m, "key", k);
      if (o.onEnd) o.onEnd();
    });
    upd();
    return { el: g, update: upd };
  }

  /** Қойындылар: aria-pressed батырмалары. tabs = [[id, мәтін]]. */
  function tabs(el, list, onChange) {
    el.classList.add("lab-choice", "sm-tabs");
    el.setAttribute("role", "group");
    const bs = list.map(([id, t]) => { const b = h("button", { type: "button", "data-tab": id, "aria-pressed": "false" }, t); b.addEventListener("click", () => sel(id)); el.append(b); return b; });
    function sel(id) { bs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === id))); onChange(id); }
    return { sel };
  }

  /** Болжам: o = { q, opts:[{id, t, ok, title, why}], onDone(id) }. Болжамнан кейін ғана басқару ашылады. */
  function predict(el, o) {
    el.classList.add("sat-predict");
    const qid = "pq-" + Math.random().toString(36).slice(2, 8);
    el.append(h("b", { text: "Алдымен болжа: " }), h("span", { id: qid, text: o.q }));
    const box = h("div", { class: "lab-choice", role: "group", "aria-labelledby": qid });
    const fb = h("div", { "aria-live": "polite" });
    o.opts.forEach((p) => {
      const b = h("button", { type: "button", "data-p": p.id }, p.t);
      b.addEventListener("click", () => {
        box.querySelectorAll("button").forEach((x) => { const q = o.opts.find((z) => z.id === x.dataset.p); x.disabled = true; x.classList.toggle("ok", !!q.ok); x.classList.toggle("no", x === b && !p.ok); x.setAttribute("aria-pressed", String(x === b)); });
        T.feedback(fb, p.ok ? "ok" : "bad", p.title || (p.ok ? "Дұрыс болжам!" : "Болжам расталмады."), p.why);
        if (o.onDone) o.onDone(p.id);
      });
      box.append(b);
    });
    el.append(box, fb);
  }

  /** Қадамдық ойнатқыш. o = { n, show(i), names?:[] }. Қайтарады { go(i), cur() }. */
  function stepper(el, o) {
    let i = 0, timer = null;
    el.classList.add("sm-stepper");
    const mk = (t, lbl, f) => { const b = h("button", { type: "button", class: "sx-tool", "aria-label": lbl }, t); b.addEventListener("click", f); return b; };
    const play = mk("▶ Ойнату", "Ойнату", () => (timer ? pause() : run()));
    const prev = mk("◀ Артқа", "Алдыңғы қадам", () => { pause(); go(i - 1); });
    const next = mk("Алға ▶", "Келесі қадам", () => { pause(); go(i + 1); });
    const reset = mk("⟲ Басынан", "Басынан бастау", () => { pause(); go(0); });
    const sp = h("select", { "aria-label": "Жылдамдық" }, h("option", { value: "2200", text: "баяу" }), h("option", { value: "1400", text: "орташа", selected: "" }), h("option", { value: "800", text: "жылдам" }));
    const pos = h("span", { class: "sat-small", "aria-live": "polite" });
    el.append(h("div", { class: "lab-row sm-steprow" }, play, prev, next, reset, h("label", { class: "sat-small" }, "Жылдамдық ", sp), pos));
    function go(j) { i = Math.max(0, Math.min(o.n - 1, j)); prev.disabled = i === 0; next.disabled = i === o.n - 1; pos.textContent = `Қадам ${i + 1} / ${o.n}` + (o.names ? ": " + o.names[i] : ""); o.show(i); }
    function run() { if (i >= o.n - 1) go(0); play.textContent = "⏸ Кідірту"; play.setAttribute("aria-label", "Кідірту"); timer = setInterval(() => { if (i >= o.n - 1) return pause(); go(i + 1); }, +sp.value); }
    function pause() { if (timer) clearInterval(timer); timer = null; play.textContent = "▶ Ойнату"; play.setAttribute("aria-label", "Ойнату"); }
    go(0);
    return { go, cur: () => i, pause };
  }

  /** Тексерілетін тапсырма және меңгеру. o = { el, skill, title, gen(prev) → есеп, once?:bool, badge? }
      Есеп: { text, fields:[{key, label, ph}], check(vals) → {ok, code, why}, hints:[бағыт, мысал, шешім], item }
      once: бір тұрақты есеп (1-тапсырма), «Жаңа есеп» жоқ. Әйтпесе қатарынан 3 көмексіз дұрыс - меңгеру. */
  function task(o) {
    const el = o.el, id = el.id || "t" + Math.random().toString(36).slice(2, 7);
    const q = h("p", { class: "sat-big", id: id + "-q", "aria-live": "polite" });
    const inputs = h("div", { class: "sm-fields" });
    const check = h("button", { type: "button", class: "btn", id: id + "-check" }, "Тексеру");
    const nxt = o.once ? null : h("button", { type: "button", class: "btn secondary", id: id + "-next" }, "Жаңа есеп");
    const fb = h("div", { id: id + "-fb", "aria-live": "polite" });
    const hb = h("div", { id: id + "-h" });
    const prog = o.once ? null : h("p", { class: "sat-prog", id: id + "-prog" });
    el.append(...[q, inputs, h("div", { class: "lab-row" }, check, nxt), fb, hb, prog].filter(Boolean));
    let P = null, spoiled = false, solved = false, streak = 0, H = null;
    function show() {
      P = o.gen(P); spoiled = false; solved = false;
      q.textContent = P.text;
      inputs.innerHTML = "";
      P.fields.forEach((f, j) => {
        const fid = `${id}-${f.key}`;
        inputs.append(h("label", { for: fid }, h("span", { text: f.label }), h("input", { type: "text", id: fid, inputmode: f.mode || "decimal", autocomplete: "off", spellcheck: "false", placeholder: f.ph || "" })));
      });
      fb.className = ""; fb.textContent = "";
      const onSolution = () => { spoiled = true; T.feedback(fb, "info", "Шешім ашылды - бұл есеп меңгеруге саналмайды.", o.once ? "Жауапты енгізіп тексеріп көр, сосын төмендегі меңгеру есептерін көмексіз шеш." : "Жауапты енгізіп тексеріп көр, сосын «Жаңа есеп» бас: келесісін көмексіз шеш."); };
      if (!H) H = T.hints(hb, P.hints, { onSolution }); else H.reset(P.hints);
      paint();
      if (o.onShow) o.onShow(P);
    }
    function paint() { if (!prog) return; const m = T.mastery(o.skill); prog.textContent = `Көмексіз қатарынан дұрыс: ${Math.min(streak, 3)} / 3 · дағды деңгейі: ${m.level}`; }
    check.addEventListener("click", () => {
      if (solved && !o.once) { T.feedback(fb, "info", "Бұл есеп шешілді.", "«Жаңа есеп» батырмасын бас."); return; }
      const vals = {}; let empty = false;
      P.fields.forEach((f) => { const v = document.getElementById(`${id}-${f.key}`).value; vals[f.key] = f.raw ? v.trim() : parse(v); if (!String(v).trim()) empty = true; else if (!f.raw && vals[f.key] === null) empty = "bad"; });
      if (empty) return T.feedback(fb, "info", empty === "bad" ? "Санды түсінбедім." : "Алдымен жауапты енгіз.", empty === "bad" ? "Бүтін сан, ондық бөлшек (2.5) немесе жай бөлшек (3/4) енгіз. π-ді жазба - тек оның коэффициентін." : "Барлық өрісті толтыр.");
      const r = P.check(vals), hints = spoiled ? 3 : H.used();
      if (r.ok) { solved = true; streak = hints ? 0 : streak + 1; T.feedback(fb, "ok", r.title || "Дұрыс!", (r.why || "") + (hints ? " Көмек қолданылды, сондықтан бұл меңгеруге толық саналмайды." : o.once ? "" : " Көмексіз шешілді.")); }
      else { streak = 0; T.feedback(fb, "bad", r.title || "Әлі емес.", r.why); }
      T.record(o.skill, { item: P.item || "task", ok: !!r.ok, hints, error: r.ok ? "" : r.code || "wrong", note: r.ok ? "" : r.why, title: o.title });
      paint();
      if (o.onCheck) o.onCheck(r, P);
    });
    if (nxt) nxt.addEventListener("click", () => { show(); window.SAT.focus(P.fields.length ? document.getElementById(`${id}-${P.fields[0].key}`) : q); });
    show();
    return { cur: () => P, show };
  }

  window.SATM = { parse, near, round, deg, rad, board, dragPoint, tabs, predict, stepper, task, reduced };
})();
