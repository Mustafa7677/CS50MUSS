/* © 2026 Sagid Mustafa. All Rights Reserved.
   AO17 Viz, 2-кезең: алгоритмдер (сұрыптау, BST, үйме, хэш-кесте), математика (матрица, ықтималдық, логикалық схема),
   AI (шешім ағашы, k-means, сызықтық регрессия), жүйелер (процесс жоспарлау, TCP, компилятор). Әр модель нақты
   есептейді және кадрлар береді: {state, msg}. Ойнатқыш - assets/js/ao-viz.js (AOViz.MACHINES-ке тіркеледі). */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (x, d = 3) => (Number.isFinite(x) ? String(+x.toFixed(d)) : String(x));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const rng = (seed) => { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296); };
  const nums = (txt, max = 40) => { const a = String(txt).split(/[\s,;]+/).filter(Boolean).map(Number); if (!a.length || a.some((x) => !Number.isFinite(x))) throw new Error("Сандарды үтірмен жазыңыз, мысалы: 5, 2, 9"); if (a.length > max) throw new Error(`Ең көбі ${max} сан`); return a; };

  // ======================================================== АЛГОРИТМДЕР
  const SORT = {
    title: "Сұрыптау алгоритмдері", tag: "салыстыру · айырбас · O(n²) vs O(n log n)", delay: 500,
    params: [
      { key: "algo", label: "Алгоритм", type: "select", value: "insertion", options: [["bubble", "Көпіршік (bubble)"], ["selection", "Таңдау (selection)"], ["insertion", "Кірістіру (insertion)"], ["merge", "Біріктіру (merge)"], ["quick", "Жылдам (quick, Ломуто)"]] },
      { key: "data", label: "Тізім (үтірмен)", type: "text", value: "7, 3, 9, 1, 6, 2, 8, 4" },
    ],
    note: "Әр кадр - бір салыстыру не бір жазу. Салыстыру мен жазу санағыштары теориямен сәйкес келеді (m09 l03-l05): кірістіру сұрыптауына сұрыпталған тізім беріп, салыстыру саны n − 1 болатынын тексеріңіз.",
    run(P) {
      const a = nums(P.data, 30), F = [], st = { cmp: 0, wr: 0 };
      const snap = (m, hi, kind, extra) => F.push({ state: { a: [...a], hi: hi || [], kind: kind || "", ...st, ...(extra || {}) }, msg: m });
      const less = (i, j) => { st.cmp++; snap(`Салыстыру: a[${i}] = ${a[i]} мен a[${j}] = ${a[j]}`, [i, j], "cmp"); return a[i] < a[j]; };
      const swap = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; st.wr += 2; snap(`Айырбас: a[${i}] ↔ a[${j}]`, [i, j], "set"); };
      snap(`Бастау: n = ${a.length}.`);
      if (P.algo === "bubble") { for (let e = a.length - 1; e > 0; e--) { let sw = false; for (let i = 0; i < e; i++) if (less(i + 1, i)) { swap(i, i + 1); sw = true; } if (!sw) { snap("Бұл өтуде айырбас болмады - тізім сұрыпталған, тоқтаймыз."); break; } } }
      else if (P.algo === "selection") { for (let i = 0; i < a.length - 1; i++) { let m = i; for (let j = i + 1; j < a.length; j++) if (less(j, m)) m = j; if (m !== i) swap(i, m); snap(`${i}-орынға ең кіші элемент (${a[i]}) қойылды.`, [i], "done"); } }
      else if (P.algo === "insertion") { for (let i = 1; i < a.length; i++) { const x = a[i]; let j = i - 1; snap(`x = a[${i}] = ${x} - сол жақтағы сұрыпталған бөлікке кірістіреміз.`, [i], "cmp"); while (j >= 0) { st.cmp++; snap(`Салыстыру: a[${j}] = ${a[j]} > ${x}?`, [j], "cmp"); if (a[j] <= x) break; a[j + 1] = a[j]; st.wr++; snap(`a[${j}] оңға жылжиды`, [j + 1], "set"); j--; } a[j + 1] = x; st.wr++; snap(`x = ${x} орнына (a[${j + 1}]) қойылды.`, [j + 1], "set"); } }
      else if (P.algo === "merge") { const ms = (lo, hi) => { if (hi - lo <= 1) return; const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid, hi); const L = a.slice(lo, mid), R = a.slice(mid, hi); let i = 0, j = 0; snap(`Біріктіру: [${L}] және [${R}]`, Array.from({ length: hi - lo }, (_, t) => lo + t), "cmp"); for (let k = lo; k < hi; k++) { if (i < L.length && j < R.length) st.cmp++; a[k] = j >= R.length || (i < L.length && L[i] <= R[j]) ? L[i++] : R[j++]; st.wr++; snap(`a[${k}] ← ${a[k]}`, [k], "set"); } }; ms(0, a.length); }
      else { const qs = (lo, hi) => { if (lo >= hi) return; const p = a[hi]; snap(`Тірек: a[${hi}] = ${p}`, [hi], "pivot"); let i = lo; for (let j = lo; j < hi; j++) { st.cmp++; snap(`a[${j}] = ${a[j]} < ${p}?`, [j, hi], "cmp"); if (a[j] < p) { if (i !== j) swap(i, j); i++; } } if (i !== hi) swap(i, hi); snap(`Тірек ${p} соңғы орнында: a[${i}]`, [i], "done"); qs(lo, i - 1); qs(i + 1, hi); }; qs(0, a.length - 1); }
      snap(`Дайын: [${a.join(", ")}]. Барлығы ${st.cmp} салыстыру, ${st.wr} жазу.`, [], "fin");
      return F;
    },
    render(host, s) {
      const mx = Math.max(...s.a.map(Math.abs), 1), W = 340, H = 150, bw = W / s.a.length;
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H + 18}" class="aov-svg" role="img" aria-label="Тізім: ${s.a.join(", ")}">${s.a.map((v, i) => { const h = Math.max(3, (Math.abs(v) / mx) * H); return `<rect x="${i * bw + 1}" y="${H - h}" width="${Math.max(1, bw - 2)}" height="${h}" class="${s.hi.includes(i) ? "b-" + (s.kind || "cmp") : s.kind === "fin" ? "b-fin" : "b"}"/>${s.a.length <= 20 ? `<text x="${i * bw + bw / 2}" y="${H + 13}" class="lbl" text-anchor="middle">${v}</text>` : ""}`; }).join("")}</svg>
        <p class="aov-legend"><span>салыстыру: <b>${s.cmp}</b></span><span>жазу: <b>${s.wr}</b></span></p>`;
    },
  };

  const treeSvg = (nodes, hl, label) => {
    // nodes: [{k, l, r}] index-based; x - in-order реті, y - тереңдік
    if (!nodes.length) return `<p class="aov-note">Ағаш бос.</p>`;
    const pos = {}; let x = 0; const walk = (i, d) => { if (i == null) return; walk(nodes[i].l, d + 1); pos[i] = [x++, d]; walk(nodes[i].r, d + 1); }; walk(0, 0);
    const n = x, depth = Math.max(...Object.values(pos).map((p) => p[1])) + 1, W = Math.max(300, n * 34), H = depth * 52 + 20;
    const P = (i) => [20 + (pos[i][0] * (W - 40)) / Math.max(1, n - 1), 24 + pos[i][1] * 52];
    let e = "", c = "";
    nodes.forEach((nd, i) => { [nd.l, nd.r].forEach((ch) => { if (ch != null) { const [x1, y1] = P(i), [x2, y2] = P(ch); e += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="e"/>`; } }); });
    nodes.forEach((nd, i) => { const [cx, cy] = P(i); c += `<g class="${hl.includes(i) ? "n-cur" : "n"}"><circle cx="${cx}" cy="${cy}" r="15"/><text x="${cx}" y="${cy + 5}" class="nl">${esc(nd.k)}</text></g>`; });
    return `<svg viewBox="0 0 ${W} ${H}" class="aov-svg" role="img" aria-label="${esc(label)}">${e}${c}</svg>`;
  };
  const BST = {
    title: "Екілік іздеу ағашы (BST)", tag: "кірістіру · іздеу · тереңдік", delay: 800,
    params: [{ key: "keys", label: "Кірістіру реті", type: "text", value: "50, 30, 70, 20, 40, 60, 80, 35" }, { key: "find", label: "Іздейтін кілт", type: "number", value: 35 }],
    note: "Ереже: сол жақтағы ішкі ағашта кішілер, оң жақта үлкендер. Іздеу әр қадамда бір тармақты лақтырады - тереңдік h болса, ең көбі h + 1 салыстыру. Кілттерді сұрыпталған ретпен беріп (10, 20, 30, ...) ағаштың «тізімге» айналғанын көріңіз.",
    run(P) {
      const keys = nums(P.keys, 25), nodes = [], F = [], snap = (m, hl) => F.push({ state: { nodes: clone(nodes), hl: hl || [] }, msg: m });
      snap("Бос ағаш.");
      keys.forEach((k) => {
        if (!nodes.length) { nodes.push({ k, l: null, r: null }); snap(`${k} - түбір.`, [0]); return; }
        let i = 0, path = [];
        for (;;) { path.push(i); const nd = nodes[i]; if (k === nd.k) { snap(`${k} бар - қайталанбайды.`, path); return; } const side = k < nd.k ? "l" : "r"; snap(`${k} ${k < nd.k ? "<" : ">"} ${nd.k} → ${side === "l" ? "солға" : "оңға"}`, [...path]); if (nd[side] == null) { nodes.push({ k, l: null, r: null }); nd[side] = nodes.length - 1; snap(`${k} кірістірілді (тереңдік ${path.length}).`, [...path, nodes.length - 1]); return; } i = nd[side]; }
      });
      const t = +P.find; let i = 0, path = [], cmp = 0;
      while (i != null && nodes.length) { path.push(i); cmp++; const nd = nodes[i]; if (t === nd.k) { snap(`Іздеу: ${t} табылды, ${cmp} салыстыру.`, [...path]); return F; } snap(`Іздеу: ${t} ${t < nd.k ? "<" : ">"} ${nd.k} → ${t < nd.k ? "солға" : "оңға"}`, [...path]); i = t < nd.k ? nd.l : nd.r; }
      snap(`Іздеу: ${t} жоқ (${cmp} салыстыру, бос тармаққа жеттік).`, path);
      return F;
    },
    render(host, s) { host.innerHTML = treeSvg(s.nodes, s.hl, "Екілік іздеу ағашы"); },
  };

  const HEAP = {
    title: "Үйме (binary min-heap)", tag: "басымдық кезегі · sift-up / sift-down", delay: 800,
    params: [{ key: "keys", label: "Кірістіру реті", type: "text", value: "9, 4, 7, 1, 8, 2, 6" }, { key: "pops", label: "Неше рет ең кішісін алу", type: "number", min: 0, max: 10, value: 3 }],
    note: "Үйме - массив: i-ші түйіннің балалары 2i + 1 және 2i + 2. Қасиет: ата-ана ≤ балалары. Кірістіру - соңына қосып жоғары көтеру (sift-up), алу - түбірді соңғымен ауыстырып төмен түсіру (sift-down); екеуі де O(log n).",
    run(P) {
      const h = [], F = [], snap = (m, hl) => F.push({ state: { h: [...h], hl: hl || [] }, msg: m });
      nums(P.keys, 20).forEach((k) => {
        h.push(k); let i = h.length - 1; snap(`${k} соңына қосылды (индекс ${i}).`, [i]);
        while (i > 0) { const p = (i - 1) >> 1; if (h[p] <= h[i]) { snap(`Ата-ана ${h[p]} ≤ ${h[i]} - қасиет орындалды.`, [p, i]); break; } [h[p], h[i]] = [h[i], h[p]]; snap(`${h[p]} < ${h[i]}: ата-анамен ауыстырдық (sift-up).`, [p, i]); i = p; }
      });
      for (let t = 0; t < +P.pops && h.length; t++) {
        const top = h[0], last = h.pop(); snap(`Ең кішісі - түбір: ${top}. Оны аламыз.`, [0]);
        if (!h.length) continue;
        h[0] = last; let i = 0; snap(`Соңғы элемент ${last} түбірге қойылды.`, [0]);
        for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l] < h[m]) m = l; if (r < h.length && h[r] < h[m]) m = r; if (m === i) { snap("Балаларынан кіші не тең - қасиет орындалды.", [i]); break; } [h[i], h[m]] = [h[m], h[i]]; snap(`Кіші баламен ауыстырдық (sift-down): ${h[i]} ↑, ${h[m]} ↓`, [i, m]); i = m; }
      }
      snap(`Үйме массиві: [${h.join(", ")}].`);
      return F;
    },
    render(host, s) {
      const nodes = s.h.map((k, i) => ({ k, l: 2 * i + 1 < s.h.length ? 2 * i + 1 : null, r: 2 * i + 2 < s.h.length ? 2 * i + 2 : null }));
      host.innerHTML = treeSvg(nodes, s.hl, "Үйме ағашы") + `<div class="aov-mem" style="grid-template-columns:repeat(${Math.max(1, Math.min(10, s.h.length))},minmax(0,1fr))">${s.h.map((v, i) => `<div class="cell m${s.hl.includes(i) ? " ch" : ""}"><span>${i}</span><b>${v}</b></div>`).join("")}</div>`;
    },
  };

  const HASH = {
    title: "Хэш-кесте (тізбектер әдісі)", tag: "хэш функция · коллизия · жүктеме", delay: 900,
    params: [{ key: "keys", label: "Кілттер", type: "text", value: "алма, бал, нан, сүт, ет, май, тұз, қант" }, { key: "m", label: "Ұяшықтар саны m", type: "range", min: 1, max: 13, step: 1, value: 5 }],
    note: "h(кілт) = (әріп кодтарының қосындысы) mod m. Бір ұяшыққа түскен кілттер тізбекке қосылады (коллизия). m-ді азайтсаңыз тізбектер ұзарады - іздеу O(1)-ден O(n)-ге жақындайды; жүктеме α = n/m.",
    run(P) {
      const keys = String(P.keys).split(/[,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 20), m = +P.m, T = Array.from({ length: m }, () => []), F = [];
      const snap = (msg, hl, key) => F.push({ state: { T: clone(T), hl, key }, msg });
      snap(`m = ${m} бос ұяшық.`, -1);
      keys.forEach((k) => { const codes = [...k].map((c) => c.codePointAt(0)), sum = codes.reduce((a, b) => a + b, 0), i = sum % m; const col = T[i].length > 0; T[i].push(k); snap(`h("${esc(k)}") = (${codes.join(" + ")}) mod ${m} = ${sum} mod ${m} = <b>${i}</b>${col ? ` - коллизия: тізбектің ұзындығы ${T[i].length}` : ""}.`, i, k); });
      const longest = Math.max(...T.map((c) => c.length));
      snap(`Жүктеме α = ${keys.length}/${m} = ${fmt(keys.length / m, 2)}; ең ұзын тізбек ${longest}. Сәтсіз іздеу орташа α салыстыру жасайды.`, -1);
      return F;
    },
    render(host, s) { host.innerHTML = `<div class="aov-hash">${s.T.map((c, i) => `<div class="row${i === s.hl ? " ch" : ""}"><span class="ix">${i}</span>${c.map((k) => `<span class="it${k === s.key && i === s.hl ? " new" : ""}">${esc(k)}</span>`).join("<i>→</i>") || "<small>бос</small>"}</div>`).join("")}</div>`; },
  };

  // ======================================================== МАТЕМАТИКА
  const MATRIX = {
    title: "Матрица - жазықтықтың түрлендіруі", tag: "сызықтық алгебра · анықтауыш", delay: 90,
    params: [{ key: "a", label: "a", type: "range", min: -2, max: 2, step: 0.1, value: 1 }, { key: "b", label: "b", type: "range", min: -2, max: 2, step: 0.1, value: 1 },
      { key: "c", label: "c", type: "range", min: -2, max: 2, step: 0.1, value: 0 }, { key: "d", label: "d", type: "range", min: -2, max: 2, step: 0.1, value: 1 }],
    note: "M = [[a, b], [c, d]]: e₁ = (1, 0) векторы (a, c)-ға, e₂ = (0, 1) векторы (b, d)-ға бейнеленеді. Ойнату бірлік матрицадан M-ге дейін бірқалыпты өтеді. det M = ad − bc - аудан неше есе өзгергенін, таңбасы бағдардың (сағат тілі) сақталғанын көрсетеді; det = 0 болса жазықтық сызыққа жаншылады.",
    run(P) {
      return Array.from({ length: 31 }, (_, i) => { const t = i / 30, M = [1 + t * (P.a - 1), t * P.b, t * P.c, 1 + t * (P.d - 1)], det = M[0] * M[3] - M[1] * M[2];
        return { state: { M, t }, msg: `t = ${fmt(t, 2)}: M = [[${fmt(M[0], 2)}, ${fmt(M[1], 2)}], [${fmt(M[2], 2)}, ${fmt(M[3], 2)}]], det = ${fmt(det, 3)}${Math.abs(det) < 1e-9 ? " - жазықтық сызыққа жаншылды (кері матрица жоқ)" : det < 0 ? " - бағдар аударылды" : ` - аудан ${fmt(det, 2)} есе`}.` }; });
    },
    render(host, s) {
      const [a, b, c, d] = s.M, S = 260, k = 36, O = S / 2, T = (x, y) => [O + k * (a * x + b * y), O - k * (c * x + d * y)];
      let g = "";
      for (let i = -3; i <= 3; i++) { const [x1, y1] = T(i, -3), [x2, y2] = T(i, 3), [x3, y3] = T(-3, i), [x4, y4] = T(3, i); g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="g2"/><line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" class="g2"/>`; }
      const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => T(x, y).join(",")).join(" ");
      const [ex, ey] = T(1, 0), [fx, fy] = T(0, 1);
      host.innerHTML = `<svg viewBox="0 0 ${S} ${S}" class="aov-svg aov-sq" role="img" aria-label="Матрица түрлендіруі">${g}<polygon points="${sq}" class="sqr"/><line x1="${O}" y1="${O}" x2="${ex}" y2="${ey}" class="v1"/><line x1="${O}" y1="${O}" x2="${fx}" y2="${fy}" class="v2"/><text x="${ex + 4}" y="${ey}" class="lbl">e₁</text><text x="${fx + 4}" y="${fy}" class="lbl">e₂</text></svg>`;
    },
  };

  const PROB = {
    title: "Үлкен сандар заңы", tag: "ықтималдық · жиілік · кездейсоқ серуен", delay: 60,
    params: [{ key: "p", label: "p = P(елтаңба)", type: "range", min: 0.05, max: 0.95, step: 0.05, value: 0.5 }, { key: "n", label: "Лақтырулар саны", type: "number", min: 10, max: 2000, value: 400 }, { key: "seed", label: "Кездейсоқтық тұқымы (seed)", type: "number", value: 17 }],
    note: "Әр лақтыру - нақты (тұқымды) кездейсоқ сан. Салыстырмалы жиілік k/n сынақ саны өскен сайын p-ге жақындайды, ал ауытқу шамамен √(p(1−p)/n) жылдамдығымен кішірейеді. seed өзгертсеңіз - басқа «тарих», бірақ сол заң.",
    run(P) {
      const r = rng(+P.seed), n = Math.min(2000, +P.n), p = +P.p, F = [], freq = []; let k = 0;
      const every = Math.max(1, Math.round(n / 120));
      for (let i = 1; i <= n; i++) { const h = r() < p; k += h; freq.push(k / i); if (i % every === 0 || i === n || i <= 5) F.push({ state: { freq: [...freq], p, n }, msg: `${i} лақтыру: елтаңба ${k} рет, жиілік k/n = ${fmt(k / i, 4)}; |k/n − p| = ${fmt(Math.abs(k / i - p), 4)}, теориялық ауытқу ≈ ${fmt(Math.sqrt((p * (1 - p)) / i), 4)}.` }); }
      return F;
    },
    render(host, s) {
      const W = 340, H = 200, X = (i) => 20 + (i / (s.n - 1 || 1)) * (W - 30), Y = (v) => H - 15 - v * (H - 30);
      const path = s.freq.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="aov-svg" role="img" aria-label="Жиіліктің p-ге жақындауы"><line x1="20" y1="${Y(s.p)}" x2="${W - 10}" y2="${Y(s.p)}" class="tan"/><text x="${W - 12}" y="${Y(s.p) - 4}" class="lbl" text-anchor="end">p = ${s.p}</text><line x1="20" y1="${Y(0)}" x2="${W - 10}" y2="${Y(0)}" class="ax"/><line x1="20" y1="${Y(1)}" x2="20" y2="${Y(0)}" class="ax"/><path d="${path}" class="curve"/></svg>`;
    },
  };

  const CIRCUITS = {
    half: { t: "Жартылай қосқыш (half adder)", ins: ["A", "B"], gates: [["S", "XOR", "A", "B"], ["C", "AND", "A", "B"]], outs: ["S", "C"] },
    full: { t: "Толық қосқыш (full adder)", ins: ["A", "B", "Cin"], gates: [["X1", "XOR", "A", "B"], ["S", "XOR", "X1", "Cin"], ["A1", "AND", "A", "B"], ["A2", "AND", "X1", "Cin"], ["Cout", "OR", "A1", "A2"]], outs: ["S", "Cout"] },
    mux: { t: "Мультиплексор 2→1", ins: ["S", "D0", "D1"], gates: [["nS", "NOT", "S"], ["P0", "AND", "nS", "D0"], ["P1", "AND", "S", "D1"], ["Y", "OR", "P0", "P1"]], outs: ["Y"] },
  };
  const GATE = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NOT: (a) => 1 - a, NAND: (a, b) => 1 - (a & b) };
  const LOGIC = {
    title: "Логикалық схема", tag: "вентильдер · ақиқат кестесі · қосқыш", delay: 1100,
    params: [{ key: "c", label: "Схема", type: "select", value: "full", options: Object.entries(CIRCUITS).map(([k, v]) => [k, v.t]) }],
    note: "Әр кадр - кірістердің бір комбинациясы: сигнал вентильдер арқылы ретімен есептеледі (жанған сым = 1). Толық қосқыш - m05-тегі екілік қосудың бір разряды: S = A ⊕ B ⊕ Cin, Cout = AB + (A ⊕ B)·Cin. Кестені m01-дегі ақиқат кестесімен салыстырыңыз.",
    run(P) {
      const C = CIRCUITS[P.c], F = [], rows = [];
      for (let m = 0; m < 1 << C.ins.length; m++) {
        const v = {}; C.ins.forEach((n, i) => (v[n] = (m >> (C.ins.length - 1 - i)) & 1));
        C.gates.forEach(([o, g, x, y]) => (v[o] = GATE[g](v[x], v[y])));
        rows.push({ ...v });
        F.push({ state: { C, v, rows: clone(rows) }, msg: `${C.ins.map((n) => `${n} = ${v[n]}`).join(", ")} → ${C.gates.map(([o, g, x, y]) => `${o} = ${g}(${x}${y ? ", " + y : ""}) = ${v[o]}`).join("; ")}. Шығыс: ${C.outs.map((o) => `${o} = ${v[o]}`).join(", ")}.` });
      }
      return F;
    },
    render(host, s) {
      const { C, v } = s;
      const g = C.gates.map(([o, gt, x, y]) => `<li><span class="w${v[x] ? " on" : ""}">${esc(x)}=${v[x]}</span>${y ? `<span class="w${v[y] ? " on" : ""}">${esc(y)}=${v[y]}</span>` : ""}<b class="gt">${gt}</b><span class="w out${v[o] ? " on" : ""}">${esc(o)}=${v[o]}</span></li>`).join("");
      const cols = [...C.ins, ...C.outs];
      const tt = `<table class="aov-vars"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((r, i) => `<tr class="${i === s.rows.length - 1 ? "ch" : ""}">${cols.map((c) => `<td>${r[c]}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      host.innerHTML = `<div class="aov-split"><ol class="aov-gates">${g}</ol><div class="aov-side">${tt}</div></div>`;
    },
  };

  // ======================================================== AI / ML
  const POINTS = (seed, n, f) => { const r = rng(seed); return Array.from({ length: n }, () => { const x = r(), y = r(); return [x, y, f(x, y, r)]; }); };
  const DTREE = {
    title: "Шешім ағашы (Gini бойынша)", tag: "AI · классификация · ашкөз бөлу", delay: 1500,
    params: [{ key: "depth", label: "Ең үлкен тереңдік", type: "range", min: 1, max: 4, step: 1, value: 3 }, { key: "seed", label: "Деректер тұқымы", type: "number", value: 5 }],
    note: "Әр түйінде алгоритм барлық мүмкін бөлулерді (x < t не y < t) тексеріп, Gini қоспасын ең көп азайтатынын таңдайды: G = 1 − Σ pᵢ². Бұл - ашкөз алгоритм (m09 l07): әр қадамда жергілікті ең жақсы, жаһандық оңтайлы кепілдік жоқ. Тереңдікті арттырып, артық үйренуді (overfitting) байқаңыз.",
    run(P) {
      const D = POINTS(+P.seed, 70, (x, y, r) => ((x > 0.55 && y < 0.7) || (x < 0.3 && y > 0.6) ? 1 : 0) ^ (r() < 0.06 ? 1 : 0));
      const gini = (pts) => { if (!pts.length) return 0; const p = pts.filter((q) => q[2]).length / pts.length; return 1 - p * p - (1 - p) * (1 - p); };
      const leaves = [{ x0: 0, x1: 1, y0: 0, y1: 1, pts: D, depth: 0 }], splits = [], F = [];
      const snap = (m, hl) => F.push({ state: { D, leaves: clone(leaves.map(({ pts, ...b }) => ({ ...b, n: pts.length, ones: pts.filter((q) => q[2]).length }))), splits: clone(splits), hl }, msg: m });
      snap(`Бастау: бір түйін, ${D.length} нүкте, Gini = ${fmt(gini(D))}.`);
      let changed = true;
      while (changed) {
        changed = false;
        for (let li = 0; li < leaves.length; li++) {
          const L = leaves[li]; if (L.depth >= +P.depth || gini(L.pts) === 0 || L.pts.length < 4) continue;
          let best = null;
          for (const ax of [0, 1]) for (const q of L.pts) { const t = q[ax], A = L.pts.filter((z) => z[ax] < t), B = L.pts.filter((z) => z[ax] >= t); if (!A.length || !B.length) continue; const g = (A.length * gini(A) + B.length * gini(B)) / L.pts.length; if (!best || g < best.g - 1e-12) best = { ax, t, A, B, g }; }
          if (!best || best.g >= gini(L.pts) - 1e-9) continue;
          const bA = { ...L, pts: best.A, depth: L.depth + 1 }, bB = { ...L, pts: best.B, depth: L.depth + 1 };
          if (best.ax === 0) { bA.x1 = best.t; bB.x0 = best.t; } else { bA.y1 = best.t; bB.y0 = best.t; }
          splits.push({ ax: best.ax, t: best.t, x0: L.x0, x1: L.x1, y0: L.y0, y1: L.y1 });
          leaves.splice(li, 1, bA, bB); changed = true;
          snap(`Бөлу: ${best.ax ? "y" : "x"} < ${fmt(best.t, 2)} (тереңдік ${L.depth + 1}). Gini ${fmt(gini(L.pts))} → ${fmt(best.g)} (екі бөліктің салмақты орташасы).`, splits.length - 1);
          break;
        }
      }
      const acc = leaves.reduce((s, L) => s + Math.max(L.pts.filter((q) => q[2]).length, L.pts.filter((q) => !q[2]).length), 0) / D.length;
      snap(`Ағаш дайын: ${leaves.length} жапырақ, оқыту деректеріндегі дәлдік ${Math.round(acc * 100)}%. (Жаңа деректерде дәлдік төменірек болуы мүмкін.)`);
      return F;
    },
    render(host, s) {
      const S = 240, X = (v) => v * S, Y = (v) => S - v * S;
      const rects = s.leaves.map((L) => { const maj = L.ones * 2 >= L.n ? 1 : 0; return `<rect x="${X(L.x0)}" y="${Y(L.y1)}" width="${X(L.x1) - X(L.x0)}" height="${Y(L.y0) - Y(L.y1)}" fill="hsl(${maj ? 160 : 8} 45% 88%)" stroke="var(--border)"/>`; }).join("");
      const lines = s.splits.map((p, i) => p.ax === 0 ? `<line x1="${X(p.t)}" y1="${Y(p.y1)}" x2="${X(p.t)}" y2="${Y(p.y0)}" class="${i === s.hl ? "cut-on" : "cut"}"/>` : `<line x1="${X(p.x0)}" y1="${Y(p.t)}" x2="${X(p.x1)}" y2="${Y(p.t)}" class="${i === s.hl ? "cut-on" : "cut"}"/>`).join("");
      const pts = s.D.map(([x, y, t]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="4" class="${t ? "pt1" : "pt0"}"/>`).join("");
      host.innerHTML = `<svg viewBox="0 0 ${S} ${S}" class="aov-svg aov-sq" role="img" aria-label="Шешім ағашының бөлулері">${rects}${lines}${pts}</svg>`;
    },
  };

  const KMEANS = {
    title: "k-means кластерлеу", tag: "AI · оқытушысыз оқыту", delay: 1000,
    params: [{ key: "k", label: "k (кластерлер)", type: "range", min: 2, max: 5, step: 1, value: 3 }, { key: "seed", label: "Бастапқы орталықтар тұқымы", type: "number", value: 3 }],
    note: "Екі қадам кезектеседі: (1) әр нүкте ең жақын орталыққа беріледі; (2) әр орталық өз нүктелерінің орташасына жылжиды. Квадраттық қашықтықтар қосындысы әр қадамда кемиді (не өзгермейді) - сондықтан алгоритм тоқтайды, бірақ бастапқы орталыққа байланысты жергілікті шешімде қалуы мүмкін. seed өзгертіп көріңіз.",
    run(P) {
      const r0 = rng(11), D = []; [[0.25, 0.3], [0.7, 0.25], [0.5, 0.75]].forEach(([cx, cy]) => { for (let i = 0; i < 22; i++) D.push([cx + (r0() - 0.5) * 0.3, cy + (r0() - 0.5) * 0.3]); });
      const r = rng(+P.seed), k = +P.k; let C = Array.from({ length: k }, () => D[Math.floor(r() * D.length)].slice()); let A = D.map(() => -1);
      const sse = () => D.reduce((s, p, i) => s + (A[i] < 0 ? 0 : (p[0] - C[A[i]][0]) ** 2 + (p[1] - C[A[i]][1]) ** 2), 0);
      const F = [], snap = (m) => F.push({ state: { D, C: clone(C), A: [...A] }, msg: m });
      snap(`Бастау: ${k} орталық кездейсоқ нүктелерден таңдалды.`);
      for (let it = 1; it <= 15; it++) {
        const nA = D.map((p) => { let b = 0, bd = Infinity; C.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (d < bd) { bd = d; b = j; } }); return b; });
        const moved = nA.filter((a, i) => a !== A[i]).length; A = nA; snap(`${it}-итерация, тағайындау: ${moved} нүкте кластерін ауыстырды. SSE = ${fmt(sse(), 4)}.`);
        if (!moved && it > 1) { snap(`Ешбір нүкте ауыспады - алгоритм жинақталды (${it - 1} итерация).`); break; }
        C = C.map((c, j) => { const m = D.filter((_, i) => A[i] === j); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : c; });
        snap(`${it}-итерация, жаңарту: орталықтар өз нүктелерінің орташасына жылжыды. SSE = ${fmt(sse(), 4)}.`);
      }
      return F;
    },
    render(host, s) {
      const S = 240, H = [8, 210, 140, 280, 40];
      const pts = s.D.map(([x, y], i) => `<circle cx="${x * S}" cy="${S - y * S}" r="4" fill="${s.A[i] < 0 ? "var(--muted)" : `hsl(${H[s.A[i]]} 55% 45%)`}"/>`).join("");
      const cs = s.C.map(([x, y], j) => `<g><circle cx="${x * S}" cy="${S - y * S}" r="9" fill="none" stroke="hsl(${H[j]} 60% 35%)" stroke-width="3"/><line x1="${x * S - 5}" y1="${S - y * S}" x2="${x * S + 5}" y2="${S - y * S}" stroke="hsl(${H[j]} 60% 35%)" stroke-width="2"/></g>`).join("");
      host.innerHTML = `<svg viewBox="0 0 ${S} ${S}" class="aov-svg aov-sq" role="img" aria-label="k-means кластерлері">${pts}${cs}</svg>`;
    },
  };

  const LINREG = {
    title: "Сызықтық регрессия (градиенттік түсу)", tag: "AI · шығын функциясы · оқу қадамы", delay: 150,
    params: [{ key: "lr", label: "Оқу қадамы η", type: "range", min: 0.01, max: 1.2, step: 0.01, value: 0.3 }, { key: "epochs", label: "Дәуірлер", type: "number", min: 5, max: 500, value: 120 }, { key: "noise", label: "Шу деңгейі", type: "range", min: 0, max: 0.5, step: 0.05, value: 0.15 }],
    note: "Модель: ŷ = w·x + b, шығын MSE = (1/n)Σ(ŷ − y)². Градиенттер ∂L/∂w = (2/n)Σ(ŷ − y)x, ∂L/∂b = (2/n)Σ(ŷ − y). Шын сызық y = 0.6x + 0.2. η тым үлкен болса, шығын өсіп кетеді (алшақтау) - η = 1.2 етіп көріңіз.",
    run(P) {
      const r = rng(9), D = Array.from({ length: 30 }, () => { const x = r(); return [x, 0.6 * x + 0.2 + (r() - 0.5) * 2 * P.noise]; });
      let w = 0, b = 0; const n = D.length, loss = () => D.reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / n;
      const F = [{ state: { D, w, b, L: [loss()] }, msg: `Бастау: w = 0, b = 0, MSE = ${fmt(loss(), 4)}.` }], hist = [loss()];
      for (let e = 1; e <= P.epochs; e++) {
        let gw = 0, gb = 0; D.forEach(([x, y]) => { const d = w * x + b - y; gw += (2 / n) * d * x; gb += (2 / n) * d; });
        w -= P.lr * gw; b -= P.lr * gb; const L = loss(); hist.push(L);
        if (!Number.isFinite(L) || L > 1e6) { F.push({ state: { D, w: 0, b: 0, L: [...hist] }, msg: `${e}-дәуір: шығын шексіздікке кетті - алшақтау (η = ${P.lr} тым үлкен).` }); break; }
        if (e <= 5 || e % Math.max(1, Math.round(P.epochs / 60)) === 0 || e === P.epochs) F.push({ state: { D, w, b, L: [...hist] }, msg: `${e}-дәуір: ∂L/∂w = ${fmt(gw, 4)}, ∂L/∂b = ${fmt(gb, 4)} → w = ${fmt(w)}, b = ${fmt(b)}, MSE = ${fmt(L, 5)}.` });
      }
      return F;
    },
    render(host, s) {
      const S = 220, X = (v) => 10 + v * (S - 20), Y = (v) => S - 10 - v * (S - 20);
      const pts = s.D.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="4" class="pt1"/>`).join("");
      const Lmax = Math.max(...s.L.filter(Number.isFinite), 1e-9), W2 = 160, H2 = 90;
      const lp = s.L.map((v, i) => `${i ? "L" : "M"}${(i / Math.max(1, s.L.length - 1)) * W2} ${H2 - (Math.min(v, Lmax) / Lmax) * (H2 - 6)}`).join("");
      host.innerHTML = `<div class="aov-split"><svg viewBox="0 0 ${S} ${S}" class="aov-svg aov-sq" role="img" aria-label="Деректер мен модель сызығы">${pts}<line x1="${X(0)}" y1="${Y(s.b)}" x2="${X(1)}" y2="${Y(s.w + s.b)}" class="curve"/></svg>
        <div class="aov-side"><p><b>w</b> = ${fmt(s.w)}, <b>b</b> = ${fmt(s.b)}</p><p><b>Шығын (MSE)</b></p><svg viewBox="0 0 ${W2} ${H2}" class="aov-svg" role="img" aria-label="Шығын қисығы"><path d="${lp}" class="curve"/></svg></div></div>`;
    },
  };

  // ======================================================== ЖҮЙЕЛЕР
  const SCHED = {
    title: "Процесстерді жоспарлау (ОЖ)", tag: "FCFS · SJF · Round Robin", delay: 600,
    params: [{ key: "algo", label: "Алгоритм", type: "select", value: "rr", options: [["fcfs", "FCFS (бірінші келген - бірінші)"], ["sjf", "SJF (ең қысқасы, үзбейтін)"], ["rr", "Round Robin (уақыт кванты)"]] },
      { key: "q", label: "Квант (RR)", type: "range", min: 1, max: 6, step: 1, value: 2 }, { key: "procs", label: "Процесстер (аты:келуі:ұзақтығы)", type: "text", value: "P1:0:5, P2:1:3, P3:2:1, P4:4:2" }],
    note: "Әр кадр - бір уақыт бірлігі: процессорда қай процесс, кезекте кімдер. Соңында орташа күту уақыты есептеледі. SJF орташа күтуді азайтады, бірақ ұзын процессті «аштыққа» ұшыратуы мүмкін; RR әділ, бірақ ауысу көп.",
    run(P) {
      const ps = String(P.procs).split(/[,;]+/).map((s) => s.trim()).filter(Boolean).map((s) => { const [n, a, b] = s.split(":"); if (!n || !Number.isFinite(+a) || !(+b > 0)) throw new Error(`«${s}» - үлгі: P1:0:5`); return { n, a: +a, b: +b, rem: +b, fin: null }; }).slice(0, 8);
      const F = [], gantt = [], q = +P.q; let t = 0, cur = null, slice = 0; const ready = [];
      const arrive = () => ps.filter((p) => p.a === t).forEach((p) => ready.push(p));
      const snap = (m) => F.push({ state: { gantt: [...gantt], ready: ready.map((p) => `${p.n}(${p.rem})`), ps: clone(ps), t }, msg: m });
      arrive();
      while (ps.some((p) => p.fin === null) && t < 200) {
        let note = "";
        if (cur && cur.rem === 0) { cur.fin = t; note += `${cur.n} аяқталды. `; cur = null; }
        if (cur && P.algo === "rr" && slice >= q) { ready.push(cur); note += `${cur.n} кванты бітті - кезек соңына. `; cur = null; }
        if (!cur && ready.length) { if (P.algo === "sjf") ready.sort((x, y) => x.rem - y.rem || x.a - y.a); cur = ready.shift(); slice = 0; note += `Процессорға ${cur.n} шықты. `; }
        if (ps.every((p) => p.fin !== null)) break;
        gantt.push(cur ? cur.n : "-");
        if (cur) { cur.rem--; slice++; }
        snap(`t = ${t}: ${note}${cur ? `${cur.n} орындалып жатыр (қалды ${cur.rem})` : "процессор бос"}. Кезек: ${ready.map((p) => p.n).join(", ") || "бос"}.`);
        t++; arrive();
      }
      if (cur && cur.rem === 0 && cur.fin === null) cur.fin = t;
      const waits = ps.map((p) => p.fin - p.a - p.b);
      snap(`Барлығы аяқталды t = ${t}. Күту уақыттары: ${ps.map((p, i) => `${p.n}=${waits[i]}`).join(", ")}; орташа ${fmt(waits.reduce((a, b) => a + b, 0) / ps.length, 2)}.`);
      return F;
    },
    render(host, s) {
      const names = [...new Set(s.ps.map((p) => p.n))], H = { "-": "var(--surface-2)" };
      names.forEach((n, i) => (H[n] = `hsl(${(i * 67) % 360} 55% 62%)`));
      host.innerHTML = `<div class="aov-gantt" role="img" aria-label="Гант диаграммасы">${s.gantt.map((g, i) => `<span style="background:${H[g]}" title="t=${i}">${esc(g)}</span>`).join("")}</div><p class="aov-legend"><span>Кезек: ${s.ready.map(esc).join(", ") || "бос"}</span></p>`;
    },
  };

  const TCP = {
    title: "TCP байланысы", tag: "желі · үш қадамды қол алысу · қайта жіберу", delay: 1200,
    params: [{ key: "msg", label: "Жіберілетін мәтін", type: "text", value: "Сәлем, AO17" }, { key: "lost", label: "Жоғалатын сегмент (0 - жоқ)", type: "range", min: 0, max: 3, step: 1, value: 2 }, { key: "mss", label: "Сегмент өлшемі (байт)", type: "range", min: 2, max: 12, step: 1, value: 6 }],
    note: "Клиент пен сервер реттік нөмірлерді (seq) келіседі: SYN, SYN-ACK, ACK. Деректер сегменттерге бөлінеді; әр сегментке ack = келесі күтілетін байт нөмірі. Сегмент жоғалса, уақыт шегі өтіп, ол қайта жіберіледі - TCP сенімділігі осыдан. Байттар - UTF-8 (m05 l06): қазақ әрпі 2 байт.",
    run(P) {
      const bytes = [...new TextEncoder().encode(P.msg)], mss = +P.mss, segs = []; for (let i = 0; i < bytes.length; i += mss) segs.push(bytes.slice(i, i + mss));
      const F = [], log = [], isn = 1000, srv = 5000;
      const snap = (from, label, m, lost) => { log.push({ from, label, lost }); F.push({ state: { log: clone(log) }, msg: m }); };
      snap("c", `SYN seq=${isn}`, `Клиент: байланыс сұрайды, өз бастапқы нөмірі seq = ${isn}.`);
      snap("s", `SYN-ACK seq=${srv} ack=${isn + 1}`, `Сервер: келісті (ack = ${isn + 1}) және өз нөмірін береді seq = ${srv}.`);
      snap("c", `ACK ack=${srv + 1}`, "Клиент: растады. Байланыс орнады (ESTABLISHED).");
      let seq = isn + 1;
      segs.forEach((sg, i) => {
        const txt = new TextDecoder().decode(new Uint8Array(sg), { stream: true });
        if (i + 1 === +P.lost) { snap("c", `DATA seq=${seq} (${sg.length} B)`, `${i + 1}-сегмент жіберілді, бірақ желіде <b>жоғалды</b>.`, true); snap("c", `DATA seq=${seq} (қайта)`, `Растау келмеді - уақыт шегі өтті, сегмент қайта жіберілді.`); }
        else snap("c", `DATA seq=${seq} (${sg.length} B)`, `${i + 1}-сегмент: ${sg.length} байт [${sg.join(" ")}]${txt ? ` («${esc(txt)}» бөлігі)` : ""}.`);
        seq += sg.length;
        snap("s", `ACK ack=${seq}`, `Сервер: ${seq}-байтқа дейін бәрін алдым (ack = ${seq}).`);
      });
      snap("c", `FIN seq=${seq}`, "Клиент: жіберіп болдым (FIN).");
      snap("s", `ACK ack=${seq + 1}`, `Сервер растады. Барлығы ${bytes.length} байт, ${segs.length} сегмент, ${segs.length + (+P.lost && +P.lost <= segs.length ? 1 : 0)} деректер жіберілімі.`);
      return F;
    },
    render(host, s) { host.innerHTML = `<div class="aov-seq"><div class="hd"><b>Клиент</b><b>Сервер</b></div>${s.log.map((e, i) => `<div class="msg ${e.from === "c" ? "r" : "l"}${e.lost ? " lost" : ""}${i === s.log.length - 1 ? " now" : ""}"><span>${esc(e.label)}</span></div>`).join("")}</div>`; },
  };

  const COMP = {
    title: "Компилятор: лексер → парсер → есептеу", tag: "токендер · шунт алгоритмі · стек машинасы", delay: 900,
    params: [{ key: "expr", label: "Өрнек", type: "text", value: "3 + 4 * (2 - 1) ^ 2" }],
    note: "1-кезең (лексер): мәтін токендерге бөлінеді. 2-кезең (парсер, Дейкстраның «шунт» алгоритмі): басымдық пен жақшаларды ескеріп, кері поляк жазуына (RPN) аударады; ^ - оңнан солға. 3-кезең: RPN стек машинасында есептеледі - нағыз компиляторлар да код генерациялау алдында осындай ағаш/стек құрылымын жасайды.",
    run(P) {
      const src = String(P.expr), toks = [], F = [];
      const snap = (stage, m, extra) => F.push({ state: { stage, toks: clone(toks), ...clone(extra || {}) }, msg: m });
      const re = /\s*(\d+(?:\.\d+)?|[-+*/^()])/y; let i = 0;
      while (i < src.length) { if (/\s/.test(src[i])) { i++; continue; } re.lastIndex = i; const m = re.exec(src); if (!m) throw new Error(`${i + 1}-таңбада танылмаған символ: «${src[i]}»`); toks.push(m[1]); i = re.lastIndex; snap("lex", `Лексер: «${esc(m[1])}» - ${/\d/.test(m[1]) ? "сан" : /[()]/.test(m[1]) ? "жақша" : "оператор"}.`); }
      const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 }, out = [], ops = [];
      for (const t of toks) {
        if (/\d/.test(t)) { out.push(t); snap("parse", `Сан ${t} → шығысқа.`, { out, ops }); }
        else if (t === "(") { ops.push(t); snap("parse", "( → стекке.", { out, ops }); }
        else if (t === ")") { while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()); if (!ops.length) throw new Error("Жақшалар сәйкес емес"); ops.pop(); snap("parse", ") - стектен ( дейін шығарамыз.", { out, ops }); }
        else { while (ops.length && ops[ops.length - 1] !== "(" && (prec[ops[ops.length - 1]] > prec[t] || (prec[ops[ops.length - 1]] === prec[t] && t !== "^"))) out.push(ops.pop()); ops.push(t); snap("parse", `Оператор ${t}: басымдығы жоғары/тең операторлар шығысқа, ${t} стекке.`, { out, ops }); }
      }
      while (ops.length) { const o = ops.pop(); if (o === "(") throw new Error("Жақшалар сәйкес емес"); out.push(o); }
      snap("parse", `RPN: ${out.join(" ")}`, { out, ops });
      const st = [];
      for (const t of out) {
        if (/\d/.test(t)) { st.push(+t); snap("eval", `${t} → стекке.`, { out, st }); continue; }
        if (st.length < 2) throw new Error("Операнд жетіспейді - өрнек толық емес");
        const b = st.pop(), a = st.pop(), v = t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : t === "/" ? a / b : a ** b; st.push(v);
        snap("eval", `${a} ${t} ${b} = ${fmt(v, 6)} → стекке.`, { out, st });
      }
      if (st.length !== 1) throw new Error("Өрнек толық емес");
      snap("eval", `Нәтиже: <b>${fmt(st[0], 6)}</b>. (Тексеру: JavaScript өзі ${fmt(Function(`"use strict";return (${src.replace(/\^/g, "**")})`)(), 6)} береді.)`, { out, st });
      return F;
    },
    render(host, s) {
      const chip = (a, cls) => a.map((x) => `<span class="tok ${cls}">${esc(x)}</span>`).join("") || "<small>бос</small>";
      host.innerHTML = `<div class="aov-comp"><p><b>Токендер:</b> ${chip(s.toks, "t")}</p>${s.out ? `<p><b>Шығыс (RPN):</b> ${chip(s.out, "o")}</p>` : ""}${s.ops ? `<p><b>Оператор стегі:</b> ${chip(s.ops, "s")}</p>` : ""}${s.st ? `<p><b>Есептеу стегі:</b> ${chip(s.st.map((v) => fmt(v, 6)), "s")}</p>` : ""}</div>`;
    },
  };

  // «^» белгісі JavaScript-те XOR, сондықтан тексеруде ** қолданылады; Function тек осы модельдің санды өрнегіне (токендер тексерілген) шақырылады.
  const reg = () => { if (!window.AOViz) return setTimeout(reg, 30); Object.assign(window.AOViz.MACHINES, { sort: SORT, bst: BST, heap: HEAP, hash: HASH, matrix: MATRIX, prob: PROB, logic: LOGIC, dtree: DTREE, kmeans: KMEANS, linreg: LINREG, sched: SCHED, tcp: TCP, compiler: COMP }); window.AOViz.init(); };
  reg();
})();
