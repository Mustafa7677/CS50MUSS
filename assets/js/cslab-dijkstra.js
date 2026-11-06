/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: Дейкстра зертханасы (academy/labs/dijkstra.html).
   Классикалық Дейкстра: басымдық кезегі (dist, node) жазбаларымен, «жалқау өшіру» - ескірген жазба кезектен алынғанда тасталады.
   Келісімдер (UI-да айтылады): тең d болса кіші нөмірлі төбе бұрын алынады; көршілер өсу ретімен қаралады;
   d[v] тек ҚАТАҢ кіші жол табылғанда жаңарады; бекітілген төбе қайта ашылмайды (сол себепті теріс салмақ алгоритмді бұзады).
   Беллман-Форд салыстыру үшін: V − 1 айналым, әр айналымда барлық қабырға. */
(() => {
  "use strict";
  const T = window.AO17Tutor, A = window.CSLabA;
  const W = 600, H = 400;
  const INF = Infinity;
  const fd = (x) => (x === INF ? "∞" : x < 0 ? "−" + -x : String(x));
  const fw = (w) => (w < 0 ? "(−" + -w + ")" : String(w));
  const list = (a) => a.join(", ");

  const PRESETS = {
    city: { name: "Қала жолдары (6 төбе)", dir: false, pos: { 1: [70, 200], 2: [230, 80], 3: [230, 320], 4: [400, 80], 5: [400, 320], 6: [540, 200] },
      edges: [[1, 2, 7], [1, 3, 2], [2, 3, 3], [2, 4, 4], [3, 5, 8], [4, 5, 1], [4, 6, 6], [5, 6, 3]] },
    trap: { name: "Тікелей жол алдайды (5 төбе)", dir: false, pos: { 1: [70, 300], 2: [180, 110], 3: [330, 70], 4: [470, 130], 5: [530, 310] },
      edges: [[1, 5, 10], [1, 2, 1], [2, 3, 2], [3, 4, 2], [4, 5, 1], [2, 4, 6]] },
    ties: { name: "Тор 2 × 3 (тең қашықтықтар)", dir: false, pos: { 1: [100, 100], 2: [300, 100], 3: [500, 100], 4: [100, 300], 5: [300, 300], 6: [500, 300] },
      edges: [[1, 2, 2], [2, 3, 2], [1, 4, 2], [4, 5, 2], [5, 6, 2], [2, 5, 1], [3, 6, 3]] },
    neg: { name: "Теріс салмақ (бағытталған)", dir: true, pos: { 1: [80, 200], 2: [300, 80], 3: [300, 320], 4: [500, 120], 5: [520, 300] },
      edges: [[1, 2, 2], [1, 3, 5], [2, 4, 1], [3, 2, -4], [4, 5, 2]] },
  };

  // ---------------------------------------------------------------- граф және алгоритмдер
  function makeGraph(p) {
    const ids = Object.keys(p.pos).map(Number).sort((a, b) => a - b);
    return { ids, pos: p.pos, dir: !!p.dir, edges: p.edges.map(([a, b, w]) => ({ a, b, w })) };
  }
  function adjOf(G) {
    const adj = {}; G.ids.forEach((v) => (adj[v] = []));
    G.edges.forEach(({ a, b, w }) => { adj[a].push({ v: b, w }); if (!G.dir) adj[b].push({ v: a, w }); });
    G.ids.forEach((v) => adj[v].sort((x, y) => x.v - y.v));
    return adj;
  }
  const ename = (G, e) => `${e.a}${G.dir ? "→" : "–"}${e.b}`;
  const pathTo = (prev, t) => { const a = []; for (let v = t, g = 0; v != null && g < 50; v = prev[v], g++) a.unshift(v); return a; };

  function dijkstra(G, s) {
    const adj = adjOf(G), d = {}, prev = {}, fin = new Set(), pq = [], order = [], F = [];
    G.ids.forEach((v) => { d[v] = INF; prev[v] = null; });
    d[s] = 0; pq.push({ d: 0, v: s });
    const sortPQ = () => pq.sort((x, y) => x.d - y.d || x.v - y.v);
    const snap = (x) => { sortPQ(); return { d: { ...d }, prev: { ...prev }, fin: [...fin], order: order.slice(), pq: pq.map((e) => ({ d: e.d, v: e.v, stale: fin.has(e.v) || e.d > d[e.v] })), ...x }; };
    F.push(snap({ type: "init", msg: `Бастау: d[${s}] = 0, қалған төбелердің бәрі ∞ (жол әлі белгісіз). Басымдық кезегіне (0, ${s}) жазбасын салдық.` }));
    for (;;) {
      sortPQ();
      const stale = []; let e = null;
      while (pq.length) { const x = pq.shift(); if (fin.has(x.v) || x.d > d[x.v]) { stale.push(x); continue; } e = x; break; }
      if (!e) break;
      const u = e.v; fin.add(u); order.push(u);
      const st = stale.length ? stale.map((x) => `(${fd(x.d)}, ${x.v})`).join(", ") + ` - ескірген жазба: ${list([...new Set(stale.map((x) => x.v))])}-төбе бұрын бекітілген, тастадық. ` : "";
      const nb = adj[u].filter((x) => !fin.has(x.v));
      F.push(snap({ type: "extract", u, stale, msg: `${st}Кезектегі ең кіші жазба (${fd(d[u])}, ${u}) алынды: ${u}-төбе БЕКІТІЛДІ, d[${u}] = ${fd(d[u])} енді өзгермейді. ` +
        (nb.length ? `Бекітілмеген көршілері: ${list(nb.map((x) => x.v))} - әрқайсысын релаксациялаймыз.` : "Бекітілмеген көршісі жоқ.") }));
      for (const { v, w } of adj[u]) {
        const cand = d[u] + w, old = d[v];
        const formula = `d[${v}] = min(${fd(old)}, ${fd(d[u])} + ${fw(w)}) = ${fd(Math.min(old, cand))}`;
        if (fin.has(v)) {
          if (cand < old) F.push(snap({ type: "relax", u, v, w, old, cand, upd: false, missed: true, formula: `${fd(d[u])} + ${fw(w)} = ${fd(cand)} < d[${v}] = ${fd(old)}`,
            msg: `${u} → ${v} қабырғасы (w = ${fd(w)}): ${fd(d[u])} + ${fw(w)} = ${fd(cand)}, бұл d[${v}] = ${fd(old)}-ден кіші! Бірақ ${v}-төбе бекітіліп қойған - Дейкстра бекітілген төбені қайта ашпайды. Теріс салмақ алгоритмді дәл осы жерде бұзады: «бекітілген d енді кішіреймейді» деген болжам жалған болды.` }));
          continue;
        }
        const upd = cand < old;
        if (upd) { d[v] = cand; prev[v] = u; pq.push({ d: cand, v }); }
        const msg = `${u} → ${v} қабырғасы (w = ${fd(w)}): ${formula}. ` + (upd
          ? (old === INF ? `${v}-төбеге алғашқы жол табылды` : `${fd(cand)} < ${fd(old)} - қысқарақ жол табылды`) + `: prev[${v}] = ${u}, кезекке (${fd(cand)}, ${v}) салдық.`
          : cand === old ? `${fd(d[u])} + ${fw(w)} = ${fd(cand)} - бұрынғымен ТЕҢ; тек қатаң кіші жол жақсырақ, сондықтан жаңартпаймыз.` : `${fd(cand)} > ${fd(old)} - бұл жол ұзынырақ, d[${v}] өзгермейді.`);
        F.push(snap({ type: "relax", u, v, w, old, cand, upd, formula, msg }));
      }
    }
    const reach = G.ids.filter((v) => v !== s && d[v] < INF), miss = G.ids.filter((v) => d[v] === INF);
    F.push(snap({ type: "end", msg: `Кезек бос - алгоритм аяқталды. Ең қысқа жолдар (prev бойынша кері жүріп): ` + reach.map((v) => `${pathTo(prev, v).join(" → ")} = ${fd(d[v])}`).join("; ") + "." + (miss.length ? ` ${list(miss)}-төбеге жол жоқ (d = ∞).` : "") }));
    return { frames: F, d, prev, order };
  }

  function bellmanFord(G, s) {
    const d = {}, prev = {}; G.ids.forEach((v) => { d[v] = INF; prev[v] = null; }); d[s] = 0;
    const arcs = G.edges.flatMap(({ a, b, w }) => (G.dir ? [[a, b, w]] : [[a, b, w], [b, a, w]]));
    let rounds = 0;
    for (let i = 0; i < G.ids.length - 1; i++) {
      let ch = false; rounds++;
      for (const [a, b, w] of arcs) if (d[a] + w < d[b]) { d[b] = d[a] + w; prev[b] = a; ch = true; }
      if (!ch) break;
    }
    const negCycle = arcs.some(([a, b, w]) => d[a] + w < d[b]);
    return { d, prev, rounds, negCycle };
  }

  window.CSLabDijkstra = { dijkstra, bellmanFord, makeGraph, PRESETS };

  // ---------------------------------------------------------------- тақтаны салу (негізгі зертхана мен тапсырма ортақ)
  function drawEdges(G, o = {}) {
    let s = `<defs><marker id="${o.mk || "dj-ar"}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="dj-arh"/></marker></defs>`;
    G.edges.forEach((e) => {
      let [x1, y1] = G.pos[e.a], [x2, y2] = G.pos[e.b];
      if (G.dir) { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, r = 30; x1 += ux * r; y1 += uy * r; x2 -= ux * r; y2 -= uy * r; }
      const cls = o.cls ? o.cls(e) : "";
      s += `<line class="cg-e${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"${G.dir ? ` marker-end="url(#${o.mk || "dj-ar"})"` : ""}/>`;
    });
    return s;
  }
  // салмақ белгісінің орны: қабырға ортасынан сәл перпендикуляр
  function wpos(G, e) {
    const [x1, y1] = G.pos[e.a], [x2, y2] = G.pos[e.b], L = Math.hypot(x2 - x1, y2 - y1) || 1;
    let nx = -(y2 - y1) / L, ny = (x2 - x1) / L; if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; }
    return [(x1 + x2) / 2 + nx * 16, (y1 + y2) / 2 + ny * 16];
  }

  // ---------------------------------------------------------------- 1. негізгі зертхана
  const root = document.querySelector("[data-cslab=dijkstra]");
  if (root) (() => {
    const $ = (s) => root.querySelector(s);
    let pkey = "city", G = makeGraph(PRESETS.city), src = 1, run = null, predict = false, score = { ok: 0, n: 0 }, edgeSel = 0;
    const board = $(".cg-board"), svg = board.querySelector("svg"), say = $(".cs-say"), ask = $(".cs-ask"), fb = $("[data-fb=pred]"), det = $("[data-k=steps]");
    A.initSteps(det);
    const P = A.player($(".cs-ctl"), {
      len: () => run.frames.length, draw, blocked: () => predict, ms: 1500,
      onNext: () => { if (predict && pending()) { T.feedback(fb, "info", "Болжамсыз көрсетілді", "Бұл қадам болжам есебіне кірмейді."); } return false; },
      onReset: () => { fb.className = ""; fb.textContent = ""; },
    });
    const pending = () => predict && P.k < run.frames.length - 1 && ["extract", "relax"].includes(run.frames[P.k + 1].type);

    function recompute() { P.stop(); run = dijkstra(G, src); score = { ok: 0, n: 0 }; fb.className = ""; fb.textContent = ""; P.restart(); }

    function buildNodes() {
      board.querySelectorAll(".cg-node, .dj-w").forEach((n) => n.remove());
      G.ids.forEach((v) => {
        const [x, y] = G.pos[v], b = document.createElement("button");
        b.type = "button"; b.className = "cg-node"; b.dataset.v = v; b.textContent = v;
        b.style.left = (x / W) * 100 + "%"; b.style.top = (y / H) * 100 + "%";
        b.addEventListener("click", () => onNode(v));
        board.append(b);
      });
      G.edges.forEach((e, i) => {
        const [x, y] = wpos(G, e), b = document.createElement("button");
        b.type = "button"; b.className = "dj-w"; b.dataset.e = i; b.textContent = fd(e.w);
        b.style.left = (x / W) * 100 + "%"; b.style.top = (y / H) * 100 + "%";
        b.setAttribute("aria-label", `Қабырға ${ename(G, e)}, салмағы ${fd(e.w)}. Салмағын өзгерту`);
        b.addEventListener("click", () => { $("[data-k=edit]").checked = true; $(".dj-edit").hidden = false; selectEdge(i); $("[data-k=w]").focus(); });
        board.append(b);
      });
      $("[data-k=src]").innerHTML = G.ids.map((v) => `<option value="${v}">${v}</option>`).join("");
      $("[data-k=src]").value = String(src);
      fillEdgeSel();
    }
    function fillEdgeSel() {
      $("[data-k=edge]").innerHTML = G.edges.map((e, i) => `<option value="${i}">${ename(G, e)} (салмағы ${fd(e.w)})</option>`).join("");
      selectEdge(Math.min(edgeSel, G.edges.length - 1));
      $("[data-k=w]").min = G.dir ? "-9" : "0";
      $(".dj-wnote").textContent = G.dir ? "Бағытталған граф: салмақ −9 … 30 (теріс те болады)." : "Бағытсыз граф: салмақ 0 … 30. Бағытсыз графта теріс қабырға бірден теріс цикл береді (u → v → u), сондықтан рұқсат жоқ.";
    }
    function selectEdge(i) { edgeSel = i; $("[data-k=edge]").value = String(i); $("[data-k=w]").value = String(G.edges[i].w); board.querySelectorAll(".dj-w").forEach((b) => b.classList.toggle("sel", +b.dataset.e === i)); }

    function draw(k) {
      const F = run.frames[k], fin = new Set(F.fin), live = new Set(F.pq.filter((e) => !e.stale).map((e) => e.v));
      const isTree = (e) => F.prev[e.b] === e.a || (!G.dir && F.prev[e.a] === e.b);
      const isCur = (e) => F.type === "relax" && ((e.a === F.u && e.b === F.v) || (!G.dir && e.a === F.v && e.b === F.u));
      let s = drawEdges(G, { cls: (e) => (isCur(e) ? (F.missed ? " bad" : " on") : isTree(e) ? (fin.has(e.b) && (G.dir || fin.has(e.a)) ? " tree" : " hot") : "") });
      G.ids.forEach((v) => { const [x, y] = G.pos[v]; s += `<text class="cg-lab${F.type === "relax" && v === F.v ? " on" : ""}" x="${x}" y="${y + (y > 330 ? -40 : 50)}" text-anchor="middle">${F.d[v] === INF ? "∞" : "d=" + fd(F.d[v])}</text>`; });
      svg.innerHTML = s;
      board.querySelectorAll(".cg-node").forEach((b) => {
        const v = +b.dataset.v, cur = (F.type === "extract" || F.type === "relax") && v === F.u, tgt = F.type === "relax" && v === F.v;
        b.className = "cg-node" + (cur ? " cur" : fin.has(v) ? " vis" : "") + (live.has(v) && !cur && !fin.has(v) ? " front" : "") + (tgt ? " sel" : "");
        b.setAttribute("aria-label", `Төбе ${v}: ` + (cur ? "қазір өңделуде" : fin.has(v) ? "бекітілді" : live.has(v) ? "кезекте" : "әлі жол жоқ") + `, d = ${fd(F.d[v])}`);
      });
      board.querySelectorAll(".dj-w").forEach((b) => b.classList.toggle("on", isCur(G.edges[+b.dataset.e])));
      // басымдық кезегі
      const cells = $("[data-k=pq]");
      cells.innerHTML = F.pq.length ? F.pq.map((e, i) => `<b class="${e.stale ? "dead" : i === F.pq.findIndex((x) => !x.stale) ? "end" : ""}">(${fd(e.d)}, ${e.v})</b>`).join("") : "<em>бос</em>";
      cells.setAttribute("aria-label", "Басымдық кезегі, кішіден үлкенге: " + (F.pq.length ? F.pq.map((e) => `(${fd(e.d)}, ${e.v})${e.stale ? " ескірген" : ""}`).join(", ") : "бос"));
      // кесте
      $("[data-k=tab]").innerHTML = G.ids.map((v) => `<tr class="${(F.type === "relax" && v === F.v) ? "ch" : ""}${(F.type === "extract" && v === F.u) ? " cur" : ""}"><th scope="row">${v}</th><td>${fd(F.d[v])}</td><td>${F.prev[v] == null ? "-" : F.prev[v]}</td><td>${fin.has(v) ? "бекітілді ✓" : live.has(v) ? "кезекте" : F.d[v] === INF ? "жол жоқ" : "-"}</td></tr>`).join("");
      const f = $("[data-k=formula]");
      f.textContent = F.type === "relax" ? F.formula : F.type === "extract" ? `бекітілді: ${F.u}, d[${F.u}] = ${fd(F.d[F.u])}` : F.type === "init" ? `d[${src}] = 0` : "аяқталды";
      f.classList.toggle("bad", !!F.missed);
      say.innerHTML = ""; const b = document.createElement("b"); b.textContent = `${k}-қадам. `; say.append(b, document.createTextNode(F.msg));
      $("[data-k=order]").textContent = F.order.length ? F.order.join(" → ") : "-";
      $(".cg-edges").textContent = "Қабырғалар: " + G.edges.map((e) => `${ename(G, e)} (${fd(e.w)})`).join(", ");
      A.stepList(det, run.frames.map((x, i) => `${i}-қадам. ${x.msg}`), k);
      // болжау сұрағы
      const nx = pending() ? run.frames[k + 1] : null;
      ask.hidden = !nx;
      if (nx) {
        $("[data-k=askq]").textContent = nx.type === "extract" ? "Кезектен қай төбе алынып, бекітіледі? Графтағы төбені басыңыз (Tab арқылы да болады)."
          : `Релаксация: ${nx.u} → ${nx.v} (w = ${fd(nx.w)}). Қазір d[${nx.u}] = ${fd(F.d[nx.u])}, d[${nx.v}] = ${fd(F.d[nx.v])}. Дейкстра d[${nx.v}]-ны жаңарта ма?`;
        $(".dj-yn").hidden = nx.type !== "relax";
      }
      $(".cs-score").textContent = predict ? `Болжам: ${score.ok} / ${score.n} дұрыс` : "";
    }

    function judge(ok, title, why, code) {
      score.n++; if (ok) score.ok++;
      T.feedback(fb, ok ? "ok" : "bad", title, why);
      T.record("cs.dijkstra.predict", { item: code === "upd" || code === "relax" ? "relax" : "extract", ok, error: ok ? "" : code, note: why, title: "Дейкстра: келесі қадамды болжау" });
    }
    function predictExtract(x) {
      const F = run.frames[P.k], nx = run.frames[P.k + 1], c = nx.u, fin = new Set(F.fin);
      if (x === c) { judge(true, `Дұрыс: ${c}`, `Кезектегі ескірмеген жазбалардың ішінде d[${c}] = ${fd(F.d[c])} ең кішісі. Басымдық кезегі әрқашан бастапқыдан жалпы қашықтығы ең аз төбені береді.`, "extract"); }
      else if (fin.has(x)) judge(false, `${x}-төбе бекітілген. Дұрысы: ${c}`, `${x} бұрын кезектен алынып бекітілді; оның d мәні түпкілікті. Кезекте қалған (${fd(F.d[x])}, ${x}) сияқты жазба болса, ол ескірген - алынғанда тасталады.`, "finalized");
      else if (F.d[x] === INF) judge(false, `${x}-төбеге әлі жол жоқ. Дұрысы: ${c}`, `d[${x}] = ∞: ешбір бекітілген төбе оған қабырға арқылы жол ашқан жоқ, сондықтан ол кезекте жоқ. Кезектен тек жазбасы бар төбе алынады; ең кішісі - (${fd(F.d[c])}, ${c}).`, "undiscovered");
      else {
        const last = F.order[F.order.length - 1], adj = adjOf(G)[last] || [];
        const light = adj.filter((e) => !fin.has(e.v)).sort((p, q) => p.w - q.w || p.v - q.v)[0];
        if (light && light.v === x && F.d[x] > F.d[c]) judge(false, `Ең жеңіл қабырға ≠ ең жақын төбе. Дұрысы: ${c}`, `Сіз ${last}-төбеден шығатын ең жеңіл қабырғаны (w = ${fd(light.w)}) таңдадыңыз. Дейкстра қабырғаға емес, бастапқыдан ЖАЛПЫ қашықтыққа қарайды: d[${x}] = ${fd(F.d[x])}, ал d[${c}] = ${fd(F.d[c])} - кішірек.`, "edge-vs-dist");
        else if (F.d[x] === F.d[c]) judge(false, `Тең қашықтық - келісім бойынша кіші нөмір. Дұрысы: ${c}`, `d[${x}] = d[${c}] = ${fd(F.d[c])}. Бұл зертханада тең болса кіші нөмірлі төбе бұрын алынады (нәтиже өзгермейді, тек рет бірмәнді болуы үшін).`, "tie");
        else judge(false, `Кезекте бар, бірақ ең кішісі емес. Дұрысы: ${c}`, `d[${x}] = ${fd(F.d[x])} > d[${c}] = ${fd(F.d[c])}. Басымдық кезегі ең соңғы жаңарғанды емес, d ең кіші жазбаны береді.`, "pq-order");
      }
      P.go(P.k + 1);
      const nb = board.querySelector(`.cg-node[data-v="${x}"]`); if (nb) nb.classList.add(x === c ? "right" : "wrong");
    }
    function predictRelax(yes) {
      const F = run.frames[P.k], nx = run.frames[P.k + 1], du = F.d[nx.u], old = F.d[nx.v];
      const ok = yes === nx.upd;
      const calc = `${fd(du)} + ${fw(nx.w)} = ${fd(nx.cand)}, ал d[${nx.v}] = ${fd(old)}`;
      if (ok) judge(true, nx.upd ? "Дұрыс: жаңарады" : "Дұрыс: жаңармайды", nx.missed ? `${calc} - кіші, бірақ ${nx.v} бекітілген, Дейкстра оны қайта қарамайды. Нәтижесінде жауап қате болады - теріс салмақтың қаупі осы.` : `${calc}. ` + (nx.upd ? "Жаңа жол қатаң қысқа - d мен prev жаңарады." : nx.cand === old ? "Тең жол жақсырақ емес - жаңартпаймыз." : "Жаңа жол ұзынырақ."), "relax");
      else if (nx.missed) judge(false, "Жаңармайды", `Есеп бойынша ${calc} - шынында кіші. Бірақ ${nx.v}-төбе бекітіліп қойған: Дейкстра бекітілген төбеге қайта оралмайды. Сол себепті теріс салмақты графта Дейкстраның жауабы қате, Беллман-Форд керек.`, "missed-neg");
      else if (yes) judge(false, "Жаңармайды", `${calc}. ` + (nx.cand === old ? "Жаңа жол бұрынғымен ТЕҢ - d[v] тек қатаң кіші болғанда өзгереді." : `${fd(nx.cand)} > ${fd(old)}: бұл жол ұзынырақ, min(...) ескі мәнді қалдырады.`), "upd");
      else judge(false, "Жаңарады", `${calc}. ` + (old === INF ? "∞-ден кез келген сан кіші - бұл төбеге алғашқы жол." : `${fd(nx.cand)} < ${fd(old)}: d[u] + w ескі мәннен кіші, сондықтан d[${nx.v}] = ${fd(nx.cand)}, prev[${nx.v}] = ${nx.u}.`), "upd");
      P.go(P.k + 1);
    }

    function onNode(v) {
      if (pending() && run.frames[P.k + 1].type === "extract") { predictExtract(v); return; }
      if (P.k === 0 || P.k === run.frames.length - 1) { src = v; $("[data-k=src]").value = String(v); recompute(); say.textContent = `Бастапқы төбе: ${v}. «Келесі» не «Ойнату» басыңыз.`; return; }
      const F = run.frames[P.k]; say.textContent = `${v}-төбе: d = ${fd(F.d[v])}, prev = ${F.prev[v] == null ? "-" : F.prev[v]}.`;
    }
    root.querySelectorAll("[data-yn]").forEach((b) => b.addEventListener("click", () => { if (pending() && run.frames[P.k + 1].type === "relax") predictRelax(b.dataset.yn === "1"); }));
    function setPreset(k) { pkey = k; G = makeGraph(PRESETS[k]); src = G.ids[0]; edgeSel = 0; $("[data-k=preset]").value = k; buildNodes(); recompute(); }
    $("[data-k=preset]").innerHTML = Object.entries(PRESETS).map(([id, p]) => `<option value="${id}">${p.name}</option>`).join("");
    $("[data-k=preset]").addEventListener("change", (e) => setPreset(e.target.value));
    $("[data-k=src]").addEventListener("change", (e) => { src = +e.target.value; recompute(); });
    $("[data-k=predict]").addEventListener("change", (e) => { predict = e.target.checked; recompute(); if (predict) say.textContent = "Болжау режимі: әр қадам алдында келесі бекітілетін төбені басыңыз немесе релаксация d-ны жаңартатынын болжаңыз."; });
    $("[data-k=edit]").addEventListener("change", (e) => { $(".dj-edit").hidden = !e.target.checked; });
    $("[data-k=edge]").addEventListener("change", (e) => selectEdge(+e.target.value));
    const applyW = () => {
      const w = Number($("[data-k=w]").value), out = $("[data-k=wmsg]");
      if (!Number.isInteger(w) || w > 30 || w < (G.dir ? -9 : 0)) { out.textContent = G.dir ? "Салмақ -9 мен 30 аралығындағы бүтін сан болуы керек." : "Бағытсыз графта салмақ 0 мен 30 аралығындағы бүтін сан. Теріс қабырға бағытсыз графта теріс цикл жасайды: u → v → u жолы шексіз кішірейеді."; return; }
      const e = G.edges[edgeSel]; e.w = w; buildNodes(); recompute();
      out.textContent = `${ename(G, e)} салмағы = ${fd(w)}. Алгоритм басынан есептелді.`;
    };
    $("[data-c=setw]").addEventListener("click", applyW);
    $("[data-k=w]").addEventListener("keydown", (e) => { if (e.key === "Enter") applyW(); });
    $("[data-c=restore]").addEventListener("click", () => { setPreset(pkey); $("[data-k=wmsg]").textContent = "Граф бастапқы күйіне қайтарылды."; });
    window.addEventListener("dj:preset", (e) => setPreset(e.detail));
    setPreset("city");
  })();

  // ---------------------------------------------------------------- 3. теріс салмақ: Дейкстра мен Беллман-Форд
  const neg = document.querySelector("[data-cslab=dijkstra-neg]");
  if (neg) (() => {
    const G = makeGraph(PRESETS.neg), D = dijkstra(G, 1), B = bellmanFord(G, 1);
    neg.querySelector("[data-k=negtab]").innerHTML = G.ids.map((v) => { const bad = D.d[v] !== B.d[v]; return `<tr class="${bad ? "bad" : ""}"><th scope="row">${v}</th><td>${fd(D.d[v])}</td><td>${fd(B.d[v])}</td><td>${bad ? "қате ✗" : "сәйкес"}</td></tr>`; }).join("");
    neg.querySelector("[data-k=negedges]").textContent = "Қабырғалар (бағытталған): " + G.edges.map((e) => `${ename(G, e)} (${fd(e.w)})`).join(", ") + `. Беллман-Форд ${B.rounds} айналымда тұрақтанды, теріс цикл жоқ.`;
    neg.querySelector("[data-c=show]").addEventListener("click", () => { window.dispatchEvent(new CustomEvent("dj:preset", { detail: "neg" })); document.getElementById("h-run").scrollIntoView({ block: "start" }); });
    const fb = neg.querySelector("[data-fb=neg]");
    const WHY = {
      fin: [true, "Дұрыс", "2-төбе d = 2 мәнімен бекітілді. Кейін 3-төбе бекітілгенде 3 → 2 (−4) қабырғасы 5 + (−4) = 1 < 2 жолын ашты, бірақ Дейкстра бекітілген төбеге қайта оралмайды. Сондықтан d[2] және одан шығатын d[4], d[5] қате қалды. Дейкстраның дұрыстығы «бекітілген d-дан кейінгі кез келген жол ұзынырақ» деген болжамға сүйенеді - ол тек теріс емес салмақта ақиқат."],
      pq: [false, "Кезек дұрыс жұмыс істеді", "Басымдық кезегі әр қадамда шынымен ең кіші d-ны берді (тексеріңіз: 1, 2, 4, 3, 5). Мәселе кезекте емес, бекітілген төбе қайта қаралмайтынында: ол теріс қабырға пайда болғанда ғана қателікке әкеледі."],
      cyc: [false, "Теріс цикл жоқ", "Графта цикл мүлде жоқ (бағытталған: 1 → 3 → 2 → 4 → 5). Теріс цикл болса, «ең қысқа жол» анықталмас еді - Беллман-Форд мұны V-ші айналымда анықтайды. Мұнда BF жауабы бар әрі тұрақты; қателік Дейкстраның бекіту ережесінде."],
      dir: [false, "Бағыт себеп емес", "Дейкстра бағытталған графта да дұрыс жұмыс істейді - тек салмақтар теріс емес болса. Бұл графта 3 → 2 салмағын 1-ге өзгертіп көріңіз: екі алгоритм бірдей нәтиже береді."],
    };
    neg.querySelectorAll("[data-why]").forEach((b) => b.addEventListener("click", () => {
      const [ok, t, why] = WHY[b.dataset.why];
      neg.querySelectorAll("[data-why]").forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.classList.remove("ok", "no"); });
      b.classList.add(ok ? "ok" : "no");
      T.feedback(fb, ok ? "ok" : "bad", t, why);
      T.record("cs.dijkstra.neg", { item: "why", ok, error: ok ? "" : b.dataset.why, note: why, title: "Дейкстра: теріс салмақ" });
    }));
  })();

  // ---------------------------------------------------------------- 4. қорытынды тапсырма
  const task = document.querySelector("[data-cslab=dijkstra-task]");
  if (!task) return;
  const tq = (s) => task.querySelector(s);
  const SLOT = [[300, 200], [300, 55], [450, 128], [450, 272], [300, 345], [150, 272], [150, 128]];
  const CAND = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]];
  let Pz = null, HN = null, helped = false;
  // ең аз қабырғалы жолдардың ішіндегі ең жеңілінің салмағы (BFS ойымен шешкендерді тану)
  function minHopWeight(G, s, t) {
    const adj = adjOf(G), hop = { [s]: 0 }, best = { [s]: 0 }, q = [s];
    while (q.length) { const u = q.shift(); for (const { v, w } of adj[u]) { if (hop[v] == null) { hop[v] = hop[u] + 1; best[v] = best[u] + w; q.push(v); } else if (hop[v] === hop[u] + 1) best[v] = Math.min(best[v], best[u] + w); } }
    return { w: best[t], hops: hop[t] };
  }
  function greedyWalk(G, s, t) {
    const adj = adjOf(G), seen = new Set([s]); let u = s, sum = 0;
    for (let g = 0; g < 10 && u !== t; g++) { const c = adj[u].filter((e) => !seen.has(e.v)).sort((a, b) => a.w - b.w || a.v - b.v)[0]; if (!c) return null; sum += c.w; u = c.v; seen.add(u); }
    return u === t ? sum : null;
  }
  function randomTask() {
    for (let tries = 0; tries < 2000; tries++) {
      const lab = A.shuffle([1, 2, 3, 4, 5, 6, 7]), cand = A.shuffle(CAND.slice());
      const par = [0, 1, 2, 3, 4, 5, 6], find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
      const pick = [];
      cand.forEach((e) => { const [a, b] = e; if (find(a) !== find(b)) { par[find(a)] = find(b); pick.push(e); } });
      cand.filter((e) => !pick.includes(e)).slice(0, 3 + A.rnd(2)).forEach((e) => pick.push(e));
      const pos = {}; SLOT.forEach((xy, i) => (pos[lab[i]] = xy));
      const G = makeGraph({ pos, edges: pick.map(([a, b]) => [lab[a], lab[b], 1 + A.rnd(9)]) });
      const s = 1 + A.rnd(7), R = dijkstra(G, s);
      const ts = G.ids.filter((v) => v !== s && pathTo(R.prev, v).length >= 3);
      for (const t of A.shuffle(ts)) {
        const opt = R.d[t], direct = G.edges.find((e) => (e.a === s && e.b === t) || (e.a === t && e.b === s)), mh = minHopWeight(G, s, t);
        if ((direct && direct.w > opt) || mh.w > opt) return { G, s, t, R, opt, direct: direct ? direct.w : null, mh: mh.w, greedy: greedyWalk(G, s, t) };
      }
    }
    return null;
  }
  function newTask() {
    Pz = randomTask(); helped = false;
    const { G, s, t } = Pz;
    let svg = drawEdges(G, { mk: "dj-ar2" });
    G.edges.forEach((e) => { const [x, y] = wpos(G, e); svg += `<text class="dj-tw" x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" text-anchor="middle">${e.w}</text>`; });
    G.ids.forEach((v) => { const [x, y] = G.pos[v], hl = v === s || v === t; svg += `<circle cx="${x}" cy="${y}" r="25" class="dj-tn${hl ? " hl" : ""}"/><text x="${x}" y="${y + 7}" text-anchor="middle" class="dj-tl${hl ? " hl" : ""}">${v}</text>`; });
    const es = G.edges.map((e) => `${ename(G, e)} (${e.w})`).join(", ");
    tq("svg").innerHTML = svg;
    tq("svg").setAttribute("aria-label", `Тапсырма графы, бағытсыз. Қабырғалар мен салмақтар: ${es}`);
    tq("[data-k=tedges]").textContent = "Қабырғалар (салмағы жақшада): " + es;
    tq("[data-k=q]").textContent = `${s}-төбеден ${t}-төбеге дейінгі ең қысқа жолдың ұзындығы (салмақтар қосындысы) қандай және жол қай төбелер арқылы өтеді?`;
    tq("[data-k=dist]").value = ""; tq("[data-k=path]").value = ""; tq("[data-k=path]").placeholder = `мысалы: ${s} … ${t}`;
    tq("[data-fb=task]").className = ""; tq("[data-fb=task]").textContent = "";
    HN = T.hints(tq("[data-k=hints]"), hintList(), { onSolution: () => { helped = true; T.feedback(tq("[data-fb=task]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. Шешімді түсінген соң «Жаңа есеп» басып, келесісін көмексіз шығарыңыз."); } });
  }
  function hintList() {
    const { G, s, t, R } = Pz;
    const fins = R.order.map((v) => `${v} (d = ${R.d[v]}${R.prev[v] != null ? `, prev = ${R.prev[v]}` : ""})`);
    const path = pathTo(R.prev, t);
    return [
      `Тікелей қабырғаға да, қабырға санына да сенбеңіз. ${s}-төбеге 0, қалғанына ∞ жазыңыз. Әр қадамда бекітілмеген төбелердің ішінен d ең кішісін бекітіп, оның көршілеріне d[v] = min(d[v], d[u] + w) ережесін қолданыңыз. Жолды соңында prev бойынша ${t}-төбеден кері қалпына келтіресіз.`,
      "Мысал: 1–2 (4), 1–3 (1), 3–2 (2), 2–4 (1). 1-ден: d[1] = 0; 3 бекітіледі (d = 1), d[2] = min(4, 1 + 2) = 3; 2 бекітіледі (d = 3), d[4] = 3 + 1 = 4. Жол 1 → 3 → 2 → 4, ұзындығы 4 - тікелей 1–2 қабырғасы арқылы емес.",
      `Бекіту реті: ${fins.join("; ")}. ${t}-төбеден prev бойынша кері: ${path.slice().reverse().join(" ← ")}. Жауап: ұзындығы ${R.d[t]}, жол ${path.join(" ")}.`,
    ];
  }
  function check() {
    const { G, s, t, R, opt, direct, mh, greedy } = Pz, out = tq("[data-fb=task]");
    const a = A.parseNum(tq("[data-k=dist]").value), path = (tq("[data-k=path]").value.match(/\d+/g) || []).map(Number);
    if (!Number.isFinite(a)) { T.feedback(out, "info", "Ұзындық жазылмады", "Бірінші өріске бір бүтін сан жазыңыз - жолдағы салмақтардың қосындысы."); return; }
    const has = (x, y) => G.edges.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x));
    let psum = 0, pbad = null;
    for (let i = 1; i < path.length; i++) { const e = has(path[i - 1], path[i]); if (!e) { pbad = [path[i - 1], path[i]]; break; } psum += e.w; }
    const pvalid = path.length >= 2 && !pbad && path[0] === s && path[path.length - 1] === t;
    let ok = false, ttl, why, code = "";
    if (a === opt) {
      if (!path.length) { ttl = "Ұзындық дұрыс, жол жазылмады"; why = `Ұзындығы ${opt} - дұрыс. Енді жолдың өзін жазыңыз: ${s}-төбеден басталып, ${t}-төбемен аяқталатын төбелер.`; code = "no-path"; }
      else if (pbad) { ttl = "Жолда жоқ қабырға бар"; why = `${pbad[0]} мен ${pbad[1]} арасында қабырға жоқ. Жол тек графтағы қабырғалармен жүреді.`; code = "path-edge"; }
      else if (path[0] !== s || path[path.length - 1] !== t) { ttl = "Жол басы не соңы қате"; why = `Жол ${s}-төбеден басталып, ${t}-төбемен аяқталуы керек.`; code = "path-ends"; }
      else if (psum !== opt) { ttl = "Жолдың ұзындығы басқа"; why = `Жазған жолыңыздың салмақтары: ${psum}, ал ең қысқасы ${opt}. Ұзындықты дұрыс таптыңыз, бірақ жол басқа - prev бойынша ${t}-төбеден кері жүріңіз.`; code = "path-sum"; }
      else { ok = true; ttl = "Дұрыс"; why = `Ең қысқа жол ${path.join(" → ")}, ұзындығы ${opt}. ` + (direct != null && direct > opt ? `Тікелей ${s}–${t} қабырғасы (${direct}) ұзынырақ. ` : "") + (mh > opt ? `Ең аз қабырғалы жол ${mh} береді - қабырға саны емес, салмақ қосындысы маңызды.` : ""); }
    } else if (direct != null && a === direct && direct > opt) { ttl = "Тікелей қабырға ең қысқа жол емес"; code = "direct"; why = `${s}–${t} қабырғасының салмағы ${direct}, бірақ айналма жол арзанырақ болуы мүмкін. Дейкстра барлық бағытты d бойынша салыстырады: ${t}-төбе бекітілгенше оның d мәні кішірейе береді.`; }
    else if (a === mh && mh > opt) { ttl = "Аз қабырға ≠ аз салмақ"; code = "hops"; why = `${a} - ең аз қабырғалы жолдың ұзындығы (BFS ойы). Салмақты графта қабырғалар көбірек, бірақ жеңілірек жол қысқа болуы мүмкін. Сондықтан BFS емес, Дейкстра.`; }
    else if (greedy != null && a === greedy && greedy > opt) { ttl = "Ашкөз жүріс: әр қадамда ең жеңіл қабырға"; code = "greedy"; why = `Әр төбеден ең жеңіл қабырғамен жүрсеңіз, ${a} шығады. Бірақ бір жеңіл қадам кейін ауыр жолға апаруы мүмкін. Дейкстра жергілікті қабырғаны емес, бастапқыдан жалпы d мәнін салыстырады.`; }
    else if (a < opt) { ttl = "Мұндай қысқа жол жоқ"; code = "too-short"; why = pvalid ? `Жазған жолыңыздың салмақтарын қосыңыз: ${psum}. ${a} - арифметикалық қате болуы мүмкін.` : `Ұзындығы ${a} болатын жол жоқ: ең кіші қосынды үлкенірек. Салмақтарды қайта қосып шығыңыз.`; }
    else { ttl = "Бұл ең қысқа жол емес"; code = "not-shortest"; why = (pvalid ? `${path.join(" → ")} жолының ұзындығы ${psum}. ` : "") + "Одан да арзан жол бар. Дейкстраны қағазда қадамдап орындаңыз: бекітілмегендердің ішінен әрқашан d ең кішісін алыңыз."; }
    const hints = HN.used();
    T.feedback(out, ok ? "ok" : "bad", ok ? ttl + (hints ? ` (${hints} көмекпен)` : "") : ttl, why + (ok ? " «Жаңа есеп» - келесі граф." : ""));
    T.record("cs.dijkstra", { item: "path", ok, hints: helped ? 3 : hints, error: code, note: why, title: "Дейкстра: ең қысқа жол" });
  }
  tq("[data-c=check]").addEventListener("click", check);
  task.querySelectorAll("input").forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); }));
  tq("[data-c=new]").addEventListener("click", newTask);
  newTask();
  document.querySelectorAll("[data-badge]").forEach((el) => T.badge(el, el.dataset.badge, el.dataset.title));
})();
