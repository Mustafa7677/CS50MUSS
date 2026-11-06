/* © 2026 Sagid Mustafa. All Rights Reserved.
   AO17 Viz: оқушы басқаратын интерактивті модельдер. Әр модель нақты есептеу жүргізеді (алгоритм, формула, backprop,
   оқу процессоры, Python-ның өз орындалуы) және КАДРЛАР тізбегін береді: {state, msg}. Ойнатқыш кадрлар бойымен
   алға/артқа жүреді, жылдамдықты өзгертеді, параметрлер өзгерсе модельді қайта есептейді; әр кадрда қазақша
   «не орындалды» деген түсіндірме бар. Пайдалану: <div data-aov="graph" data-aov-params='{"algo":"bfs"}'></div>. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REDUCED = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (x, d = 3) => (Number.isFinite(x) ? (Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(2) : String(+x.toFixed(d))) : String(x));
  const MAX_FRAMES = 2500;
  const ROOT = (() => { const sc = document.querySelector('script[src*="assets/js/ao-viz.js"]'); return sc ? sc.src.replace(/assets\/js\/ao-viz\.js.*$/, "") : new URL(".", location.href).href; })();
  let pyP = null;
  const pyReady = () => pyP || (pyP = (async () => {
    for (let i = 0; i < 50 && !(window.CS50KZ && window.CS50KZ.getPyodide); i++) await new Promise((r) => setTimeout(r, 100));   // main.js өзін инициализациялағанша
    if (!window.CS50KZ || !window.CS50KZ.getPyodide) throw new Error("Python (Pyodide) бұл бетте қолжетімсіз");
    const py = await window.CS50KZ.getPyodide();
    if (!py.globals.get("trace_lines")) { const res = await fetch(ROOT + "assets/py/ao_judge.py"); if (!res.ok) throw new Error("ao_judge.py жүктелмеді"); py.runPython(await res.text()); }
    return py;
  })().catch((e) => { pyP = null; throw new Error("Python жүктелмеді (интернет қажет, бірінші рет ~10 с): " + (e.message || e)); }));

  // ---------------------------------------------------------------- ойнатқыш
  function mount(el, type, params) {
    const M = MACHINES[type];
    if (!M) return;   // 2-кезең модельдері (ao-viz2.js) тіркелгенде init қайта шақырылады
    const P = Object.assign({}, ...M.params.map((p) => ({ [p.key]: p.value })), params || {});
    el.classList.add("aov");
    el.innerHTML = `<div class="aov-head"><b>${esc(M.title)}</b><span class="aov-tag">${esc(M.tag)}</span></div>
      <form class="aov-params" onsubmit="return false">${M.params.map((p) => field(p, P[p.key])).join("")}</form>
      <div class="aov-stage" aria-hidden="false"></div>
      <p class="aov-msg" aria-live="polite"></p>
      <div class="aov-ctl">
        <button type="button" class="btn gold" data-c="play">▶ Ойнату</button>
        <button type="button" class="btn secondary" data-c="back" aria-label="Бір қадам артқа">◀</button>
        <button type="button" class="btn secondary" data-c="fwd" aria-label="Бір қадам алға">▶|</button>
        <button type="button" class="btn secondary" data-c="reset" aria-label="Басынан">↺</button>
        <label class="aov-speed">Жылдамдық <select data-c="speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
        <input type="range" data-c="seek" min="0" max="0" value="0" aria-label="Қадам">
        <span class="aov-n"></span>
      </div>
      ${M.note ? `<p class="aov-note">${M.note}</p>` : ""}`;
    el.tabIndex = 0;
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", M.title + ": Бос орын - ойнату/тоқтату, ← → - қадам, R - басынан");
    const stage = $(".aov-stage", el), msg = $(".aov-msg", el), n = $(".aov-n", el), seek = $("[data-c=seek]", el), play = $("[data-c=play]", el);
    let frames = [], k = 0, timer = null, gen = 0;
    const speed = () => +$("[data-c=speed]", el).value;
    const show = () => {
      if (!frames.length) return;
      const f = frames[k];
      if (f.state === null) { msg.innerHTML = f.msg; n.textContent = ""; return; }
      M.render(stage, f.state, P, frames);
      msg.innerHTML = f.msg;
      n.textContent = `${k + 1} / ${frames.length}`;
      seek.max = frames.length - 1; seek.value = k;
    };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } play.textContent = k >= frames.length - 1 ? "↺ Қайта" : "▶ Ойнату"; };
    const tick = () => {
      if (k >= frames.length - 1) { stop(); return; }
      k++; show();
      timer = setTimeout(tick, (M.delay || 900) / speed());
    };
    const compute = async () => {
      stop();
      const my = ++gen;
      msg.textContent = "Есептеліп жатыр...";
      try {
        const r = await M.run(P);
        if (my !== gen) return;
        frames = r.slice(0, MAX_FRAMES);
        if (r.length > MAX_FRAMES) frames.push({ state: frames[frames.length - 1].state, msg: `Кадрлар шегі (${MAX_FRAMES}) - модель осы жерде тоқтатылды.` });
      } catch (e) {
        frames = [{ state: null, msg: `<b class="aov-bad">Қате:</b> ${esc(e.message || e)}` }];
        stage.innerHTML = "";
      }
      k = 0;
      if (frames[0] && frames[0].state !== null) show(); else { msg.innerHTML = frames[0].msg; n.textContent = ""; }
      stop();
    };
    let ready = !M.lazy;
    const ensure = async () => { if (!ready) { ready = true; await compute(); } };
    play.addEventListener("click", async () => {
      if (!ready) { play.textContent = "Жүктелуде..."; await ensure(); }
      if (timer) { stop(); return; }
      if (k >= frames.length - 1) { k = 0; show(); }
      if (REDUCED()) { k = Math.min(frames.length - 1, k + 1); show(); stop(); return; }   // қозғалыс азайтылса - ойнату бір қадам ғана жасайды
      play.textContent = "❚❚ Тоқтату";
      timer = setTimeout(tick, 250 / speed());
    });
    const step = async (d) => { if (!ready) { await ensure(); return; } stop(); k = Math.max(0, Math.min(frames.length - 1, k + d)); show(); stop(); };
    $("[data-c=back]", el).addEventListener("click", () => step(-1));
    $("[data-c=fwd]", el).addEventListener("click", () => step(1));
    $("[data-c=reset]", el).addEventListener("click", () => { stop(); k = 0; show(); stop(); });
    seek.addEventListener("input", () => { stop(); k = +seek.value; show(); stop(); });
    el.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      else if (e.key === " ") { e.preventDefault(); play.click(); }
      else if (e.key === "r" || e.key === "R") { k = 0; show(); stop(); }
    });
    $(".aov-params", el).addEventListener("change", (e) => {
      const p = M.params.find((x) => x.key === e.target.name);
      if (!p) return;
      P[p.key] = p.type === "number" || p.type === "range" ? +e.target.value : e.target.value;
      const out = $(`[data-out="${p.key}"]`, el); if (out) out.textContent = e.target.value;
      if (ready) compute();
    });
    $(".aov-params", el).addEventListener("input", (e) => { const out = $(`[data-out="${e.target.name}"]`, el); if (out) out.textContent = e.target.value; });
    if (ready) compute(); else msg.innerHTML = M.lazyMsg || "«Ойнату» басыңыз.";
  }
  function field(p, v) {
    const id = "aov-" + Math.random().toString(36).slice(2, 8);
    if (p.type === "select") return `<label for="${id}">${esc(p.label)}<select id="${id}" name="${p.key}">${p.options.map(([val, t]) => `<option value="${esc(val)}"${String(val) === String(v) ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
    if (p.type === "textarea") return `<label for="${id}" class="aov-wide">${esc(p.label)}<textarea id="${id}" name="${p.key}" rows="${p.rows || 6}" spellcheck="false">${esc(v)}</textarea></label>`;
    if (p.type === "range") return `<label for="${id}">${esc(p.label)} <output data-out="${p.key}">${esc(v)}</output><input id="${id}" type="range" name="${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${esc(v)}"></label>`;
    return `<label for="${id}">${esc(p.label)}<input id="${id}" type="${p.type === "number" ? "number" : "text"}" name="${p.key}" value="${esc(v)}"${p.min != null ? ` min="${p.min}"` : ""}${p.max != null ? ` max="${p.max}"` : ""}${p.step != null ? ` step="${p.step}"` : ""} spellcheck="false"></label>`;
  }

  // ---------------------------------------------------------------- 1. граф алгоритмдері
  const parseGraph = (txt, directed) => {
    const adj = {}, edges = [];
    const add = (a) => (adj[a] = adj[a] || []);
    txt.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean).forEach((tok) => {
      const m = tok.match(/^([^\s\-:>]+)\s*-\s*>?\s*([^\s:]+)\s*(?::\s*(-?\d+(?:\.\d+)?))?$/);
      if (!m) throw new Error(`«${tok}» - қате жазылу. Үлгі: A-B:4`);
      const [, a, b, w] = m, wt = w == null ? 1 : +w;
      add(a); add(b); adj[a].push([b, wt]); if (!directed) adj[b].push([a, wt]); edges.push([a, b, wt]);
    });
    Object.values(adj).forEach((l) => l.sort((x, y) => (x[0] < y[0] ? -1 : 1)));
    return { adj, edges, nodes: Object.keys(adj).sort() };
  };
  const GRAPH = {
    title: "Граф алгоритмдері", tag: "BFS · DFS · Дейкстра", delay: 1000,
    params: [
      { key: "algo", label: "Алгоритм", type: "select", value: "bfs", options: [["bfs", "BFS (енінен, кезек)"], ["dfs", "DFS (тереңнен, стек)"], ["dijkstra", "Дейкстра (салмақты, ең қысқа жол)"]] },
      { key: "start", label: "Бастау төбесі", type: "text", value: "A" },
      { key: "edges", label: "Қабырғалар (A-B:салмақ)", type: "textarea", rows: 3, value: "A-B:4, A-C:1, C-B:2, B-D:5, C-D:8, D-E:3, C-E:10" },
    ],
    note: "Модель - нақты алгоритм: әр кадр бір амал (кезектен алу, көршіні тексеру, қашықтықты жаңарту). Салмақтарды өзгертіп, Дейкстраның жолды қалай қайта таңдайтынын бақылаңыз.",
    run(P) {
      const G = parseGraph(P.edges, false);
      if (!G.adj[P.start]) throw new Error(`«${P.start}» төбесі графта жоқ`);
      const F = [], dist = {}, prev = {}, done = new Set(), push = (s, m) => F.push({ state: JSON.parse(JSON.stringify(s)), msg: m });
      G.nodes.forEach((v) => (dist[v] = Infinity));
      const st = { G, dist, prev, done: [], front: [], cur: null, edge: null, order: [] };
      if (P.algo === "dijkstra") {
        if (G.edges.some((e) => e[2] < 0)) throw new Error("Дейкстра теріс салмақпен дұрыс жұмыс істемейді (Level II: Беллман-Форд)");
        dist[P.start] = 0; st.front = [[0, P.start]];
        push(st, `Бастау: d(${esc(P.start)}) = 0, қалғандары ∞. Басымдық кезегінде: ${esc(P.start)}.`);
        while (st.front.length) {
          st.front.sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
          const [d, u] = st.front.shift();
          if (done.has(u)) { push(st, `${esc(u)} бұрын бекітілген (ескі жазба d = ${d}) - өткізіледі.`); continue; }
          done.add(u); st.done = [...done]; st.cur = u; st.order.push(u); st.edge = null;
          push(st, `Кезектен ең кіші қашықтықты алу: <b>${esc(u)}</b>, d = ${d}. Енді ${esc(u)} бекітілді - одан қысқа жол жоқ.`);
          for (const [v, w] of G.adj[u]) {
            if (done.has(v)) continue;
            st.edge = [u, v];
            const nd = dist[u] + w;
            if (nd < dist[v]) { const old = dist[v]; dist[v] = nd; prev[v] = u; st.front.push([nd, v]); push(st, `Қабырға ${esc(u)}→${esc(v)} (салмақ ${w}): ${dist[u]} + ${w} = ${nd} < ${old === Infinity ? "∞" : old} - d(${esc(v)}) жаңартылды.`); }
            else push(st, `Қабырға ${esc(u)}→${esc(v)} (салмақ ${w}): ${dist[u]} + ${w} = ${nd} ≥ ${dist[v]} - жақсармайды.`);
          }
        }
        st.cur = null; st.edge = null;
        push(st, `Дайын. Қашықтықтар: ${G.nodes.map((v) => `${esc(v)}=${dist[v] === Infinity ? "∞" : dist[v]}`).join(", ")}.`);
        return F;
      }
      const bfs = P.algo === "bfs";
      st.front = [P.start]; dist[P.start] = 0; const seen = new Set([P.start]);
      push(st, `Бастау: ${esc(P.start)} ${bfs ? "кезекке" : "стекке"} салынды.`);
      while (st.front.length) {
        const u = bfs ? st.front.shift() : st.front.pop();
        if (!bfs && done.has(u)) { push(st, `${esc(u)} бұрын қаралған - өткізіледі.`); continue; }
        done.add(u); st.done = [...done]; st.cur = u; st.order.push(u); st.edge = null;
        push(st, `${bfs ? "Кезектің басынан" : "Стектің үстінен"} алынды: <b>${esc(u)}</b>${bfs ? ` (қашықтық ${dist[u]})` : ""}. Қаралу реті: ${st.order.map(esc).join(" → ")}.`);
        const nb = bfs ? G.adj[u] : [...G.adj[u]].reverse();
        for (const [v] of nb) {
          st.edge = [u, v];
          if (bfs ? seen.has(v) : done.has(v)) { push(st, `Көрші ${esc(v)} бұрын ${bfs ? "кезекке түскен" : "қаралған"} - қосылмайды.`); continue; }
          if (bfs) { seen.add(v); dist[v] = dist[u] + 1; prev[v] = u; }
          st.front.push(v);
          push(st, `Көрші ${esc(v)} ${bfs ? `кезектің соңына қосылды (қашықтық ${dist[v]})` : "стекке салынды"}.`);
        }
      }
      st.cur = null; st.edge = null;
      push(st, `Дайын. Қаралу реті: ${st.order.map(esc).join(" → ")}.${bfs ? " BFS қашықтықтары - ең аз қабырға саны." : ""}`);
      return F;
    },
    render(host, s, P) {
      const N = s.G.nodes, R = 120, cx = 170, cy = 140, pos = {};
      N.forEach((v, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / N.length; pos[v] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
      const inT = (a, b) => s.prev[b] === a || s.prev[a] === b;
      const edges = s.G.edges.map(([a, b, w]) => {
        const [x1, y1] = pos[a], [x2, y2] = pos[b], on = s.edge && ((s.edge[0] === a && s.edge[1] === b) || (s.edge[0] === b && s.edge[1] === a));
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${on ? "e-on" : inT(a, b) ? "e-tree" : "e"}"/>${P.algo === "dijkstra" ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 4}" class="ew">${w}</text>` : ""}`;
      }).join("");
      const fr = new Set(s.front.map((x) => (Array.isArray(x) ? x[1] : x)));
      const nodes = N.map((v) => { const [x, y] = pos[v], c = v === s.cur ? "n-cur" : s.done.includes(v) ? "n-done" : fr.has(v) ? "n-front" : "n";
        const d = s.dist[v]; return `<g class="${c}"><circle cx="${x}" cy="${y}" r="19"/><text x="${x}" y="${y + 5}" class="nl">${esc(v)}</text>${d !== Infinity && d != null ? `<text x="${x}" y="${y + 36}" class="nd">${P.algo === "dijkstra" ? "d=" : ""}${d}</text>` : ""}</g>`; }).join("");
      const lab = P.algo === "bfs" ? "Кезек" : P.algo === "dfs" ? "Стек" : "Басымдық кезегі";
      host.innerHTML = `<div class="aov-split"><svg viewBox="0 0 340 300" class="aov-svg" role="img" aria-label="Граф: ағымдағы төбе ${esc(s.cur || "-")}">${edges}${nodes}</svg>
        <div class="aov-side"><p><b>${lab}:</b> ${s.front.length ? s.front.map((x) => (Array.isArray(x) ? `${esc(x[1])}(${x[0]})` : esc(x))).join(", ") : "бос"}</p><p><b>Қаралды:</b> ${s.order.map(esc).join(" → ") || "-"}</p>
        <p class="aov-legend"><span><i class="lg n-cur"></i>ағымдағы</span><span><i class="lg n-front"></i>${P.algo === "dfs" ? "стекте" : "кезекте"}</span><span><i class="lg n-done"></i>қаралған</span></p></div></div>`;
    },
  };

  // ---------------------------------------------------------------- 2. градиенттік түсу
  const FUNCS = {
    "x^2": { f: (x) => x * x, d: (x) => 2 * x, tex: "f(x) = x²", lo: -4, hi: 4 },
    "(x-2)^2+1": { f: (x) => (x - 2) ** 2 + 1, d: (x) => 2 * (x - 2), tex: "f(x) = (x − 2)² + 1", lo: -2, hi: 6 },
    "x^4-3x^2+x": { f: (x) => x ** 4 - 3 * x * x + x, d: (x) => 4 * x ** 3 - 6 * x + 1, tex: "f(x) = x⁴ − 3x² + x (екі шұңқыр)", lo: -2.2, hi: 2.2 },
  };
  const GD = {
    title: "Градиенттік түсу", tag: "оңтайландыру · ML негізі", delay: 700,
    params: [
      { key: "fn", label: "Функция", type: "select", value: "x^4-3x^2+x", options: Object.entries(FUNCS).map(([k, v]) => [k, v.tex]) },
      { key: "x0", label: "Бастапқы x₀", type: "range", min: -2, max: 2, step: 0.1, value: 1.6 },
      { key: "lr", label: "Оқу қадамы η", type: "range", min: 0.01, max: 1.05, step: 0.01, value: 0.05 },
      { key: "steps", label: "Қадамдар", type: "number", min: 1, max: 200, value: 30 },
    ],
    note: "Әр қадам: x ← x − η·f′(x). η тым үлкен болса, нүкте шұңқырдан секіріп кетеді (x² үшін η > 1 - алшақтау); x₀ өзгерсе, x⁴ − 3x² + x басқа (жергілікті) минимумға түсуі мүмкін.",
    run(P) {
      const F = FUNCS[P.fn]; let x = +P.x0; const path = [x], out = [];
      out.push({ state: { path: [...path] }, msg: `Бастау: x₀ = ${fmt(x)}, f(x₀) = ${fmt(F.f(x))}.` });
      for (let i = 1; i <= P.steps; i++) {
        const g = F.d(x), nx = x - P.lr * g;
        if (!Number.isFinite(nx) || Math.abs(nx) > 1e6) { out.push({ state: { path: [...path], diverged: true }, msg: `${i}-қадам: x шексіздікке кетті - <b>алшақтау</b>. η = ${P.lr} тым үлкен.` }); break; }
        out.push({ state: { path: [...path, nx], g, x }, msg: `${i}-қадам: f′(${fmt(x)}) = ${fmt(g)}; x ← ${fmt(x)} − ${P.lr}·(${fmt(g)}) = <b>${fmt(nx)}</b>, f = ${fmt(F.f(nx))}.` });
        path.push(nx); x = nx;
        if (Math.abs(g) < 1e-6) { out.push({ state: { path: [...path] }, msg: `Градиент ≈ 0 - стационар нүкте табылды: x ≈ ${fmt(x)}.` }); break; }
      }
      return out;
    },
    render(host, s, P) {
      const F = FUNCS[P.fn], W = 340, H = 220, lo = Math.min(F.lo, ...s.path.filter((v) => Math.abs(v) < 50)), hi = Math.max(F.hi, ...s.path.filter((v) => Math.abs(v) < 50));
      const xs = Array.from({ length: 121 }, (_, i) => lo + ((hi - lo) * i) / 120), ys = xs.map(F.f);
      const ymin = Math.min(...ys), ymax = Math.max(...ys), X = (x) => 20 + ((x - lo) / (hi - lo)) * (W - 40), Y = (y) => H - 20 - ((Math.min(y, ymax) - ymin) / (ymax - ymin || 1)) * (H - 40);
      const curve = xs.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(ys[i]).toFixed(1)}`).join("");
      const pts = s.path.filter((v) => v >= lo && v <= hi);
      const trail = pts.map((x, i) => `<circle cx="${X(x)}" cy="${Y(F.f(x))}" r="${i === pts.length - 1 ? 6 : 3}" class="${i === pts.length - 1 ? "p-now" : "p-old"}"/>`).join("");
      const last = s.path[s.path.length - 1];
      const tan = Number.isFinite(last) && last >= lo && last <= hi ? (() => { const g = F.d(last), d = (hi - lo) * 0.12; return `<line x1="${X(last - d)}" y1="${Y(F.f(last) - g * d)}" x2="${X(last + d)}" y2="${Y(F.f(last) + g * d)}" class="tan"/>`; })() : "";
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="aov-svg" role="img" aria-label="${esc(F.tex)}, ағымдағы x = ${fmt(last)}"><path d="${curve}" class="curve"/>${tan}${trail}<text x="${W - 22}" y="16" class="lbl" text-anchor="end">${esc(F.tex)}</text></svg>`;
    },
  };

  // ---------------------------------------------------------------- 3. нейрондық желі (2-H-1, сигмоид, толық топтамалы GD)
  const rng = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const DATA = {
    xor: () => [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]].flatMap(([a, b, y]) => [[a * 1.6 - 0.8, b * 1.6 - 0.8, y], [a * 1.6 - 0.75, b * 1.6 - 0.85, y], [a * 1.6 - 0.85, b * 1.6 - 0.72, y]]),
    circle: () => { const r = rng(7); return Array.from({ length: 60 }, () => { const x = r() * 2 - 1, y = r() * 2 - 1; return [x, y, x * x + y * y < 0.4 ? 1 : 0]; }); },
    line: () => { const r = rng(3); return Array.from({ length: 50 }, () => { const x = r() * 2 - 1, y = r() * 2 - 1; return [x, y, y > 0.5 * x + 0.1 ? 1 : 0]; }); },
  };
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const NN = {
    title: "Нейрондық желіні оқыту", tag: "backprop · шешім шекарасы", delay: 120,
    params: [
      { key: "data", label: "Деректер", type: "select", value: "xor", options: [["xor", "XOR (сызықпен бөлінбейді)"], ["circle", "Шеңбер ішінде/сыртында"], ["line", "Сызықпен бөлінеді"]] },
      { key: "hidden", label: "Жасырын нейрондар", type: "range", min: 0, max: 8, step: 1, value: 4 },
      { key: "lr", label: "Оқу қадамы η", type: "range", min: 0.1, max: 5, step: 0.1, value: 2 },
      { key: "epochs", label: "Дәуірлер", type: "number", min: 10, max: 3000, value: 600 },
    ],
    note: "Нағыз есептеу: тура өту (сигмоид), шығын - кросс-энтропия, кері тарату (backprop), барлық нүкте бойынша градиенттік қадам. Жасырын нейрон 0 болса - бұл логистикалық регрессия: XOR-ды шеше алмайды. Нейрон қосып, айырманы көріңіз.",
    run(P) {
      const D = DATA[P.data](), H = +P.hidden, r = rng(42), w = () => (r() - 0.5) * 2;
      let W1 = Array.from({ length: H }, () => [w(), w()]), b1 = Array.from({ length: H }, w), W2 = Array.from({ length: H || 2 }, w), b2 = 0;
      const fwd = (x, y) => { if (!H) return { h: [x, y], o: sig(W2[0] * x + W2[1] * y + b2) }; const h = W1.map((wi, i) => sig(wi[0] * x + wi[1] * y + b1[i])); return { h, o: sig(h.reduce((s, hi, i) => s + hi * W2[i], b2)) }; };
      const snap = (ep, loss, acc) => ({ state: { W1: W1.map((x) => [...x]), b1: [...b1], W2: [...W2], b2, H, D, loss, acc, ep }, msg: `${ep}-дәуір: шығын L = ${fmt(loss, 4)}, дәлдік ${Math.round(acc * 100)}%.${ep === 0 ? " Салмақтар кездейсоқ - шекара әзірге мағынасыз." : ""}` });
      const evalAll = () => { let L = 0, ok = 0; D.forEach(([x, y, t]) => { const o = Math.min(1 - 1e-9, Math.max(1e-9, fwd(x, y).o)); L -= t * Math.log(o) + (1 - t) * Math.log(1 - o); ok += (o > 0.5) === (t === 1); }); return [L / D.length, ok / D.length]; };
      const F = [snap(0, ...evalAll())], every = Math.max(1, Math.round(P.epochs / 120));
      for (let ep = 1; ep <= P.epochs; ep++) {
        const gW1 = W1.map(() => [0, 0]), gb1 = b1.map(() => 0), gW2 = W2.map(() => 0); let gb2 = 0;
        D.forEach(([x, y, t]) => { const { h, o } = fwd(x, y), d = o - t; gb2 += d; h.forEach((hi, i) => { gW2[i] += d * hi; if (H) { const dh = d * W2[i] * hi * (1 - hi); gW1[i][0] += dh * x; gW1[i][1] += dh * y; gb1[i] += dh; } }); });
        const n = D.length;
        W2 = W2.map((v, i) => v - (P.lr * gW2[i]) / n); b2 -= (P.lr * gb2) / n;
        if (H) { W1 = W1.map((wi, i) => [wi[0] - (P.lr * gW1[i][0]) / n, wi[1] - (P.lr * gW1[i][1]) / n]); b1 = b1.map((v, i) => v - (P.lr * gb1[i]) / n); }
        if (ep % every === 0 || ep === P.epochs) F.push(snap(ep, ...evalAll()));
      }
      const last = F[F.length - 1].state;
      F.push({ state: last, msg: `Оқыту аяқталды: ${P.epochs} дәуір, дәлдік ${Math.round(last.acc * 100)}%.${!H && P.data !== "line" ? " Жасырын қабатсыз шекара тек түзу сызық - сондықтан бұл деректер бөлінбейді." : ""}` });
      return F;
    },
    render(host, s) {
      const G = 40, S = 240, H = s.H;
      const fwd = (x, y) => { if (!H) return sig(s.W2[0] * x + s.W2[1] * y + s.b2); const h = s.W1.map((wi, i) => sig(wi[0] * x + wi[1] * y + s.b1[i])); return sig(h.reduce((a, hi, i) => a + hi * s.W2[i], s.b2)); };
      let cells = "";
      for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const x = -1 + (2 * (i + 0.5)) / G, y = 1 - (2 * (j + 0.5)) / G, o = fwd(x, y); cells += `<rect x="${(i * S) / G}" y="${(j * S) / G}" width="${S / G + 0.5}" height="${S / G + 0.5}" fill="hsl(${o > 0.5 ? 160 : 8} 45% ${92 - Math.abs(o - 0.5) * 60}%)"/>`; }
      const pts = s.D.map(([x, y, t]) => `<circle cx="${((x + 1) / 2) * S}" cy="${((1 - y) / 2) * S}" r="5" class="${t ? "pt1" : "pt0"}"/>`).join("");
      host.innerHTML = `<div class="aov-split"><svg viewBox="0 0 ${S} ${S}" class="aov-svg aov-sq" role="img" aria-label="Шешім шекарасы, дәлдік ${Math.round(s.acc * 100)}%">${cells}${pts}</svg>
        <div class="aov-side"><p><b>Дәуір:</b> ${s.ep}</p><p><b>Шығын:</b> ${fmt(s.loss, 4)}</p><p><b>Дәлдік:</b> ${Math.round(s.acc * 100)}%</p><div class="aov-bar"><i style="width:${Math.round(s.acc * 100)}%"></i></div>
        <p class="aov-legend"><span><i class="lg pt1"></i>1-сынып</span><span><i class="lg pt0"></i>0-сынып</span><span>фон - желінің болжамы</span></p></div></div>`;
    },
  };

  // ---------------------------------------------------------------- 4. оқу процессоры (AO17 Virtual Computer)
  const CPU = {
    title: "Оқу процессоры (Virtual Computer)", tag: "регистрлер · жад · PC", delay: 900,
    params: [
      { key: "prog", label: "Бағдарлама (AO17 ассемблері)", type: "textarea", rows: 9, value: "; 1 + 2 + ... + 5\n      LI  R0, 0      ; қосынды\n      LI  R1, 5      ; санағыш\nloop: JZ  R1, end\n      ADD R0, R1\n      DEC R1\n      JMP loop\nend:  STORE R0, 15\n      OUT R0\n      HALT" },
    ],
    note: "Командалар: LI r, n (сан жүктеу) · MOV r, r · ADD/SUB/MUL r, r · INC/DEC r · LOAD r, адрес · STORE r, адрес · JMP белгі · JZ r, белгі (r = 0 болса өту) · JNZ · OUT r · HALT. 4 регистр (R0-R3), 16 ұяшықты жад, 8 биттік таңбасыз мәндер (256 модулі - m05). Әр кадр - бір команданың орындалуы.",
    run(P) {
      const lines = P.prog.split("\n"), prog = [], labels = {};
      lines.forEach((raw, ln) => { let s = raw.replace(/;.*/, "").trim(); if (!s) return; const m = s.match(/^([A-Za-z_]\w*):\s*(.*)$/); if (m) { labels[m[1]] = prog.length; s = m[2].trim(); if (!s) return; }
        const [op, ...rest] = s.split(/\s+/); prog.push({ op: op.toUpperCase(), args: rest.join(" ").split(",").map((x) => x.trim()).filter(Boolean), ln: ln + 1, src: raw.trim() }); });
      const R = [0, 0, 0, 0], MEM = Array(16).fill(0), out = [];
      const reg = (a, ln) => { const m = /^R([0-3])$/i.exec(a || ""); if (!m) throw new Error(`${ln}-жол: регистр күтілді (R0-R3), «${a}» келді`); return +m[1]; };
      const num = (a, ln) => { if (!/^-?\d+$/.test(a || "")) throw new Error(`${ln}-жол: сан күтілді, «${a}» келді`); return +a; };
      const addr = (a, ln) => { const v = num(a, ln); if (v < 0 || v > 15) throw new Error(`${ln}-жол: адрес 0..15 болуы керек`); return v; };
      const lab = (a, ln) => { if (!(a in labels)) throw new Error(`${ln}-жол: «${a}» белгісі жоқ`); return labels[a]; };
      const F = [], snap = (pc, m, ch) => F.push({ state: { R: [...R], MEM: [...MEM], pc, prog, out: [...out], ch: ch || [] }, msg: m });
      let pc = 0, steps = 0;
      snap(0, "Бастау: барлық регистр мен жад 0. PC (команда санағышы) = 0.");
      while (pc < prog.length && steps < 400) {
        const I = prog[pc], a = I.args, ln = I.ln; steps++;
        let next = pc + 1, m = "", ch = [];
        switch (I.op) {
          case "LI": { const r = reg(a[0], ln); R[r] = num(a[1], ln) & 255; m = `R${r} ← ${R[r]}`; ch = ["R" + r]; break; }
          case "MOV": { const r = reg(a[0], ln), q = reg(a[1], ln); R[r] = R[q]; m = `R${r} ← R${q} = ${R[r]}`; ch = ["R" + r]; break; }
          case "ADD": case "SUB": case "MUL": { const r = reg(a[0], ln), q = reg(a[1], ln), x = R[r], y = R[q], raw = I.op === "ADD" ? x + y : I.op === "SUB" ? x - y : x * y; R[r] = ((raw % 256) + 256) % 256; m = `R${r} ← ${x} ${I.op === "ADD" ? "+" : I.op === "SUB" ? "−" : "×"} ${y} = ${raw}${raw !== R[r] ? ` → 256 модулі бойынша ${R[r]} (асып кету!)` : ""}`; ch = ["R" + r]; break; }
          case "INC": case "DEC": { const r = reg(a[0], ln), x = R[r]; R[r] = (x + (I.op === "INC" ? 1 : 255)) % 256; m = `R${r} ← ${x} ${I.op === "INC" ? "+ 1" : "− 1"} = ${R[r]}`; ch = ["R" + r]; break; }
          case "LOAD": { const r = reg(a[0], ln), d = addr(a[1], ln); R[r] = MEM[d]; m = `R${r} ← MEM[${d}] = ${R[r]}`; ch = ["R" + r, "M" + d]; break; }
          case "STORE": { const r = reg(a[0], ln), d = addr(a[1], ln); MEM[d] = R[r]; m = `MEM[${d}] ← R${r} = ${R[r]}`; ch = ["M" + d]; break; }
          case "JMP": next = lab(a[0], ln); m = `PC ← ${next} («${a[0]}» белгісі)`; break;
          case "JZ": case "JNZ": { const r = reg(a[0], ln), z = R[r] === 0, go = I.op === "JZ" ? z : !z; if (go) next = lab(a[1], ln); m = `R${r} = ${R[r]} ${z ? "= 0" : "≠ 0"} → ${go ? `өту: PC ← ${next}` : "өтпейді, келесі команда"}`; break; }
          case "OUT": { const r = reg(a[0], ln); out.push(R[r]); m = `Шығыс: ${R[r]}`; break; }
          case "HALT": m = "Тоқтау (HALT)."; next = prog.length; break;
          default: throw new Error(`${ln}-жол: белгісіз команда «${I.op}»`);
        }
        snap(pc, `<code>${esc(I.src)}</code> - ${m}`, ch); pc = next;
      }
      if (steps >= 400) snap(pc, "400 командадан кейін тоқтатылды - шексіз цикл болуы мүмкін.");
      else snap(Math.min(pc, prog.length), `Бағдарлама аяқталды: ${steps} команда орындалды. Шығыс: ${out.join(", ") || "жоқ"}.`);
      return F;
    },
    render(host, s) {
      const code = s.prog.map((I, i) => `<li class="${i === s.pc ? "on" : ""}"><code>${esc(I.src)}</code></li>`).join("");
      const regs = s.R.map((v, i) => `<div class="cell${s.ch.includes("R" + i) ? " ch" : ""}"><span>R${i}</span><b>${v}</b><small>${v.toString(2).padStart(8, "0")}</small></div>`).join("");
      const mem = s.MEM.map((v, i) => `<div class="cell m${s.ch.includes("M" + i) ? " ch" : ""}"><span>${i}</span><b>${v}</b></div>`).join("");
      host.innerHTML = `<div class="aov-split"><ol class="aov-code" start="0">${code}</ol><div class="aov-side"><p><b>PC</b> = ${s.pc}</p><div class="aov-regs">${regs}</div><p><b>Жад</b></p><div class="aov-mem">${mem}</div><p><b>Шығыс:</b> ${s.out.join(", ") || "-"}</p></div></div>`;
    },
  };

  // ---------------------------------------------------------------- 5. C жады: стек, үйме, көрсеткіш (модель)
  const SCEN = {
    swap: { t: "swap(&x, &y) - көрсеткішпен айырбас", ops: [
      ["decl", "main", "x", 1, "int x = 1;"], ["decl", "main", "y", 2, "int y = 2;"], ["call", "swap", [["a", "&x"], ["b", "&y"]], "swap(&x, &y);"],
      ["decl", "swap", "t", "*a", "int t = *a;"], ["set", "*a", "*b", "*a = *b;"], ["set", "*b", "t", "*b = t;"], ["ret", "swap", "}  // swap аяқталды"]] },
    heap: { t: "malloc / free - үйме", ops: [
      ["decl", "main", "n", 3, "int n = 3;"], ["malloc", "main", "p", 3, "int *p = malloc(n * sizeof *p);"], ["set", "p[0]", 10, "p[0] = 10;"], ["set", "p[2]", 30, "p[2] = 30;"], ["free", "p", "free(p);"], ["setnull", "p", "p = NULL;"]] },
    dangling: { t: "Ілулі көрсеткіш (use-after-free)", ops: [
      ["malloc", "main", "p", 2, "int *p = malloc(2 * sizeof *p);"], ["decl", "main", "q", "p", "int *q = p;   // көшірме"], ["set", "p[0]", 7, "p[0] = 7;"], ["free", "p", "free(p);"], ["use", "q[0]", "printf(\"%d\", q[0]);   // ҚАТЕ"]] },
  };
  const MEMM = {
    title: "C жады: стек, үйме, көрсеткіш", tag: "модель · m11", delay: 1300,
    params: [{ key: "scen", label: "Сценарий", type: "select", value: "swap", options: Object.entries(SCEN).map(([k, v]) => [k, v.t]) }],
    note: "Бұл - оқу моделі: мекенжайлар шартты (стек 1000-нан төмен, үйме 5000-нан жоғары), бірақ ережелер C-дағыдай - жақтау функциямен бірге жоғалады, үйме блогы free-ге дейін тірі, көрсеткіш - мекенжай.",
    run(P) {
      const S = SCEN[P.scen], frames = [{ name: "main", vars: [] }], heap = [];
      let saddr = 1000, haddr = 5000;
      const find = (nm) => { for (let i = frames.length - 1; i >= 0; i--) { const v = frames[i].vars.find((x) => x.n === nm); if (v) return v; } throw new Error("айнымалы жоқ: " + nm); };
      const cellAt = (addr) => { for (const f of frames) for (const v of f.vars) if (v.a === addr) return { kind: "var", v }; for (const b of heap) if (addr >= b.a && addr < b.a + b.cells.length * 4) return { kind: "heap", b, i: (addr - b.a) / 4 }; return null; };
      const valOf = (e) => { if (typeof e === "number") return e; if (e.startsWith("&")) return find(e.slice(1)).a; if (e.startsWith("*")) { const c = cellAt(find(e.slice(1)).v); return c.kind === "var" ? c.v.v : c.b.cells[c.i]; } return find(e).v; };
      const lv = (e) => { const m = e.match(/^(\w+)\[(\d+)\]$/); if (m) return { addr: find(m[1]).v + 4 * +m[2] }; if (e.startsWith("*")) return { addr: find(e.slice(1)).v }; return { addr: find(e).a }; };
      const write = (addr, val) => { const c = cellAt(addr); if (!c) throw new Error("жарамсыз мекенжай"); if (c.kind === "var") c.v.v = val; else c.b.cells[c.i] = val; return c; };
      const out = [], snap = (m, hl) => out.push({ state: { frames: JSON.parse(JSON.stringify(frames)), heap: JSON.parse(JSON.stringify(heap)), hl: hl || {} }, msg: m });
      snap("Бастау: стекте main функциясының жақтауы, үйме бос.");
      for (const op of S.ops) {
        const code = `<code>${esc(op[op.length - 1])}</code> - `;
        if (op[0] === "decl") { const [, fn, n, e] = op; const v = valOf(e); saddr -= 4; frames[frames.length - 1].vars.push({ n, a: saddr, v, ptr: typeof e === "string" && (e.startsWith("&") || (!e.startsWith("*") && !!find(e).ptr)) }); snap(code + `${esc(fn)} жақтауында ${esc(n)} (мекенжайы ${saddr}) = ${v}.`, { a: saddr }); }
        else if (op[0] === "call") { const [, fn, args] = op; const vals = args.map(([n, e]) => [n, valOf(e)]); frames.push({ name: fn, vars: [] }); vals.forEach(([n, v]) => { saddr -= 4; frames[frames.length - 1].vars.push({ n, a: saddr, v, ptr: true }); }); snap(code + `стекке ${esc(fn)} жақтауы қосылды; параметрлер - мекенжайлардың КӨШІРМЕЛЕРІ: ${vals.map(([n, v]) => `${n} = ${v}`).join(", ")}.`, { f: frames.length - 1 }); }
        else if (op[0] === "set") { const [, l, e] = op; const v = valOf(e), { addr } = lv(l); write(addr, v); snap(code + `${addr} мекенжайына ${v} жазылды${l.startsWith("*") ? ` (${esc(l.slice(1))} көрсететін орын)` : ""}.`, { a: addr }); }
        else if (op[0] === "ret") { const f = frames.pop(); saddr += 4 * f.vars.length; snap(code + `${esc(f.name)} жақтауы стектен алынды - оның айнымалылары (${f.vars.map((v) => v.n).join(", ")}) енді жоқ. main-дегі мәндер өзгерді, себебі көрсеткіш арқылы жазылды.`); }
        else if (op[0] === "malloc") { const [, , n, cnt] = op; const b = { a: haddr, cells: Array(cnt).fill("?"), live: true }; heap.push(b); haddr += 4 * cnt + 16; saddr -= 4; frames[frames.length - 1].vars.push({ n, a: saddr, v: b.a, ptr: true }); snap(code + `үймеде ${cnt} ұяшық (${4 * cnt} байт, мекенжайы ${b.a}) бөлінді, мәндері анықталмаған (?). ${esc(n)} = ${b.a}.`, { b: b.a }); }
        else if (op[0] === "free") { const p = find(op[1]); const b = heap.find((x) => x.a === p.v); b.live = false; snap(code + `${b.a} блогы босатылды. ${esc(op[1])} әлі ${p.v} мекенжайын сақтайды - бұл енді ілулі көрсеткіш.`, { b: b.a }); }
        else if (op[0] === "setnull") { const p = find(op[1]); p.v = "NULL"; snap(code + `${esc(op[1])} = NULL - енді ешқайда көрсетпейді (қос free қауіпсіз).`, { a: p.a }); }
        else if (op[0] === "use") { const m = op[1].match(/^(\w+)\[(\d+)\]$/), addr = find(m[1]).v + 4 * +m[2], c = cellAt(addr); snap(code + (c && c.kind === "heap" && !c.b.live ? `<b class="aov-bad">use-after-free:</b> ${addr} мекенжайы босатылған блокта. Нағыз C-да бұл - анықталмаған әрекет; AddressSanitizer оны ұстайды (m11 l06).` : "оқу"), { b: c && c.b && c.b.a }); }
      }
      return out;
    },
    render(host, s) {
      const fr = s.frames.map((f, i) => `<div class="aov-frame${s.hl.f === i ? " ch" : ""}"><b>${esc(f.name)}()</b>${f.vars.map((v) => `<div class="cell${s.hl.a === v.a ? " ch" : ""}"><span>${v.a}</span><i>${esc(v.n)}</i><b>${esc(v.v)}</b>${v.ptr && v.v !== "NULL" ? `<small>→ ${esc(v.v)}</small>` : ""}</div>`).join("") || "<small>бос</small>"}</div>`).reverse().join("");
      const hp = s.heap.map((b) => `<div class="aov-block${b.live ? "" : " dead"}${s.hl.b === b.a ? " ch" : ""}"><span>${b.a}${b.live ? "" : " (босатылған)"}</span>${b.cells.map((c, i) => `<div class="cell m"><span>${b.a + 4 * i}</span><b>${esc(c)}</b></div>`).join("")}</div>`).join("") || "<small>бос</small>";
      host.innerHTML = `<div class="aov-split aov-mem2"><div><p><b>Стек</b> (жоғарыда - ағымдағы жақтау)</p>${fr}</div><div><p><b>Үйме</b></p>${hp}</div></div>`;
    },
  };

  // ---------------------------------------------------------------- 6. Python Code X-Ray (нағыз орындалу, Pyodide)
  const PYX = {
    title: "Code X-Ray: Python кодының орындалуы", tag: "нағыз Python · жол-жолмен", delay: 900, lazy: true,
    lazyMsg: "Кодты өзгертіп, «Ойнату» не «▶|» басыңыз: Python браузерде нағыз орындалады (бірінші рет жүктеу ~10 с).",
    params: [{ key: "code", label: "Python коды (өзгертіңіз)", type: "textarea", rows: 8, value: "def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nnums = []\nfor i in range(1, 5):\n    nums.append(fact(i))\nprint(nums)" }],
    note: "Код браузерде нағыз Python-да (Pyodide) орындалады; әр кадр - бір жолдың алдындағы күй: жергілікті айнымалылар, шақыру тереңдігі, шығыс. Шексіз цикл болса 600 кадрдан кейін тоқтайды. Python бірінші рет жүктелгенде ~10 секунд күтіңіз.",
    async run(P) {
      const py = await pyReady();
      const r = JSON.parse(py.globals.get("trace_lines")(P.code, "", 600));
      const src = P.code.split("\n");
      const F = r.frames.map((f, i) => {
        const prev = i ? r.frames[i - 1].locals : {};
        const changed = Object.keys(f.locals).filter((k) => prev[k] !== f.locals[k] && r.frames[i - 1] && r.frames[i - 1].func === f.func);
        const what = f.event === "return" ? `<b>${esc(f.func)}</b> қайтарады: ${esc(f.ret)}` : f.event === "exception" ? `${f.line}-жолда ерекшелік` : `${f.line}-жолды орындау алдында`;
        return { state: { f, src, changed }, msg: `${what}${f.func !== "<module>" ? ` (функция ${esc(f.func)}, тереңдік ${f.depth - 1})` : ""}${changed.length ? ` · өзгерді: ${changed.map(esc).join(", ")}` : ""}` };
      });
      if (!F.length) throw new Error(r.error ? `${r.error}${r.line ? ` (${r.line}-жол)` : ""}: ${r.detail || ""}` : "Орындалатын жол жоқ");
      if (!r.ok) F.push({ state: F[F.length - 1].state, msg: `<b class="aov-bad">${esc(r.error)}</b>${r.line ? ` (${r.line}-жол)` : ""}: ${esc(r.hint || r.detail || "")}` });
      else F.push({ state: F[F.length - 1].state, msg: r.truncated ? "600 кадрдан кейін тоқтатылды (шексіз цикл болуы мүмкін)." : `Бағдарлама аяқталды. Шығыс: <code>${esc(r.out.trim() || "(жоқ)")}</code>` });
      return F;
    },
    render(host, s) {
      const { f, src, changed } = s;
      const code = src.map((l, i) => `<li class="${i + 1 === f.line ? "on" : ""}"><code>${esc(l) || " "}</code></li>`).join("");
      const vars = Object.entries(f.locals).map(([k, v]) => `<tr class="${changed.includes(k) ? "ch" : ""}"><th>${esc(k)}</th><td><code>${esc(v)}</code></td></tr>`).join("") || `<tr><td colspan="2"><small>айнымалы жоқ</small></td></tr>`;
      host.innerHTML = `<div class="aov-split"><ol class="aov-code">${code}</ol><div class="aov-side"><p><b>Кадр:</b> ${esc(f.func)}() · тереңдік ${f.depth - 1}</p><table class="aov-vars"><tbody>${vars}</tbody></table><p><b>Шығыс:</b></p><pre class="aov-out">${esc(f.out || " ")}</pre></div></div>`;
    },
  };

  // ---------------------------------------------------------------- 7. функция графигі: параметрлер не істейді
  const BASES = { sin: [Math.sin, "sin"], sq: [(x) => x * x, "x²"], abs: [Math.abs, "|x|"], exp: [Math.exp, "eˣ"], cube: [(x) => x ** 3, "x³"] };
  const FUNC = {
    title: "Функция және оның түрлендірулері", tag: "y = a·f(b·x + c) + d", delay: 120,
    params: [
      { key: "base", label: "Негізгі f", type: "select", value: "sin", options: Object.entries(BASES).map(([k, v]) => [k, v[1]]) },
      { key: "sweep", label: "Қай параметр өзгереді (ойнату)", type: "select", value: "b", options: [["a", "a - тік созу"], ["b", "b - көлденең сығу"], ["c", "c - көлденең жылжу"], ["d", "d - тік жылжу"]] },
      { key: "a", label: "a", type: "range", min: -3, max: 3, step: 0.1, value: 1 }, { key: "b", label: "b", type: "range", min: -3, max: 3, step: 0.1, value: 1 },
      { key: "c", label: "c", type: "range", min: -3, max: 3, step: 0.1, value: 0 }, { key: "d", label: "d", type: "range", min: -3, max: 3, step: 0.1, value: 0 },
    ],
    note: "Сұр сызық - бастапқы f(x), түсті - түрлендірілген. Ойнату таңдалған параметрді −3-тен 3-ке дейін жүргізеді. Неге c оң болғанда график СОЛҒА жылжиды? Себебі f(x + c) мәні f-тің x + c нүктесіндегі мәні: бұрынғы нүкте енді c бірлік ертерек келеді.",
    run(P) {
      const vals = Array.from({ length: 31 }, (_, i) => -3 + i * 0.2);
      const what = { a: "тік бағытта |a| есе созылады, a < 0 болса x осі бойынша аударылады", b: "көлденең 1/|b| есе сығылады, b < 0 болса y осі бойынша аударылады; b = 0 - тұрақты f(c)", c: "көлденең −c/b бірлікке жылжиды (c > 0 - солға, b > 0 кезде)", d: "тік бағытта d бірлікке жылжиды" }[P.sweep];
      return vals.map((v) => { const q = { ...P, [P.sweep]: +v.toFixed(1) }; return { state: q, msg: `${P.sweep} = ${q[P.sweep]}: график ${what}. y = ${q.a}·${BASES[P.base][1].replace("x", `(${q.b}x ${q.c < 0 ? "−" : "+"} ${Math.abs(q.c)})`)} ${q.d < 0 ? "−" : "+"} ${Math.abs(q.d)}` }; });
    },
    render(host, q) {
      const f = BASES[q.base][0], W = 340, H = 220, lo = -6, hi = 6, ylo = -6, yhi = 6;
      const X = (x) => ((x - lo) / (hi - lo)) * W, Y = (y) => H - ((Math.max(ylo - 1, Math.min(yhi + 1, y)) - ylo) / (yhi - ylo)) * H;
      const path = (g) => { let d = "", pen = false; for (let i = 0; i <= 300; i++) { const x = lo + ((hi - lo) * i) / 300, y = g(x); if (!Number.isFinite(y) || Math.abs(y) > 50) { pen = false; continue; } d += `${pen ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`; pen = true; } return d; };
      const grid = [-4, -2, 2, 4].map((t) => `<line x1="${X(t)}" y1="0" x2="${X(t)}" y2="${H}" class="g"/><line x1="0" y1="${Y(t)}" x2="${W}" y2="${Y(t)}" class="g"/>`).join("");
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="aov-svg" role="img" aria-label="y = a·f(bx + c) + d графигі">${grid}<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" class="ax"/><line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${H}" class="ax"/>
        <path d="${path(f)}" class="base"/><path d="${path((x) => q.a * f(q.b * x + q.c) + q.d)}" class="curve"/></svg>`;
    },
  };

  const MACHINES = { graph: GRAPH, gd: GD, nn: NN, cpu: CPU, mem: MEMM, pyx: PYX, func: FUNC };
  const init = (root = document) => root.querySelectorAll("[data-aov]:not(.aov)").forEach((el) => { let p = {}; try { p = JSON.parse(el.dataset.aovParams || "{}"); } catch (e) { /* бос */ } mount(el, el.dataset.aov, p); });
  window.AOViz = { mount, init, MACHINES };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init()); else init();
})();
