/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: BFS және DFS зертханасы (academy/labs/bfs.html).
   Алгоритмдер нақты есептеледі, кадрлар алдын ала жазылады да, оқушы оларды алға/артқа жүргізеді.
   Келісім (UI-да айтылады): көршілер ӨСУ ретімен қаралады.
   BFS - кезек (Queue, FIFO); төбе кезекке қосылғанда «көрілді» деп белгіленеді, сондықтан кезекте қайталану жоқ.
   DFS - стек (Stack, LIFO); төбе стектен алынғанда белгіленеді, көрілмеген көршілер КЕРІ ретпен салынады - сонда ең кіші
   көрші төбеде тұрады және келу реті рекурсивті DFS-пен (өсу ретімен) дәл бірдей болады (тестте тексеріледі). */
(() => {
  "use strict";
  const root = document.querySelector("[data-cslab=bfs]");
  if (!root) return;
  const $ = (s, r = root) => r.querySelector(s);
  const T = window.AO17Tutor;
  const SVGNS = "http://www.w3.org/2000/svg";
  const W = 600, H = 400;
  // Қазақша жалғаулар (санның айтылуына қарай): табыс (-ды/-ді/-ны/-ні/-ты/-ті), шығыс (-дан/-ден/-тан/-тен), барыс (-ға/-ге/-ке)
  const ACC = { 1: "1-ді", 2: "2-ні", 3: "3-ті", 4: "4-ті", 5: "5-ті", 6: "6-ны", 7: "7-ні", 8: "8-ді", 9: "9-ды" };
  const ABL = { 1: "1-ден", 2: "2-ден", 3: "3-тен", 4: "4-тен", 5: "5-тен", 6: "6-дан", 7: "7-ден", 8: "8-ден", 9: "9-дан" };
  const DAT = { 1: "1-ге", 2: "2-ге", 3: "3-ке", 4: "4-ке", 5: "5-ке", 6: "6-ға", 7: "7-ге", 8: "8-ге", 9: "9-ға" };
  const list = (a) => a.join(", ");

  const PRESETS = {
    metro: { name: "Қала метросы (8 бекет)", pos: { 1: [80, 90], 2: [230, 60], 3: [110, 260], 4: [390, 70], 5: [270, 200], 6: [230, 345], 7: [525, 150], 8: [455, 320] },
      edges: [[1, 2], [1, 3], [2, 4], [2, 5], [3, 5], [3, 6], [4, 7], [5, 8], [6, 8], [7, 8]] },
    grid: { name: "Тор 3 × 3", pos: { 1: [150, 70], 2: [300, 70], 3: [450, 70], 4: [150, 200], 5: [300, 200], 6: [450, 200], 7: [150, 330], 8: [300, 330], 9: [450, 330] },
      edges: [[1, 2], [2, 3], [4, 5], [5, 6], [7, 8], [8, 9], [1, 4], [4, 7], [2, 5], [5, 8], [3, 6], [6, 9]] },
    ring: { name: "Сақина (6 төбе)", pos: { 1: [300, 55], 2: [430, 128], 3: [430, 272], 4: [300, 345], 5: [170, 272], 6: [170, 128] },
      edges: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [1, 6]] },
    two: { name: "Екі бөлек бөлік (7 төбе)", pos: { 1: [100, 95], 2: [255, 70], 3: [185, 225], 4: [110, 335], 5: [420, 90], 6: [510, 220], 7: [405, 330] },
      edges: [[1, 2], [1, 3], [2, 3], [3, 4], [5, 6], [6, 7]] },
  };

  // ---------------------------------------------------------------- граф және алгоритмдер
  function makeGraph(p) {
    const ids = Object.keys(p.pos).map(Number).sort((a, b) => a - b);
    const adj = {}; ids.forEach((v) => (adj[v] = new Set()));
    p.edges.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });
    return { ids, pos: p.pos, adj };
  }
  const nb = (G, u) => [...G.adj[u]].sort((a, b) => a - b);
  const edgesOf = (G) => G.ids.flatMap((a) => nb(G, a).filter((b) => b > a).map((b) => [a, b]));

  function bfs(G, s, desc = false) {
    const d = { [s]: 0 }, p = { [s]: null }, vis = new Set([s]), q = [s], order = [], tree = [];
    const snap = (extra) => ({ q: q.slice(), vis: [...vis], d: { ...d }, p: { ...p }, order: order.slice(), tree: tree.slice(), ...extra });
    const F = [snap({ cur: null, msg: `Бастау: ${ACC[s]} кезекке қойып, «көрілді» деп белгіледік; d(${s}) = 0. Келесі қадамда кезектің басынан аламыз.` })];
    while (q.length) {
      const u = q.shift(); order.push(u);
      let ns = nb(G, u); if (desc) ns = ns.reverse();
      const fresh = ns.filter((v) => !vis.has(v)), old = ns.filter((v) => vis.has(v));
      fresh.forEach((v) => { vis.add(v); d[v] = d[u] + 1; p[v] = u; q.push(v); tree.push([u, v]); });
      let msg = `${ACC[u]} кезектің басынан алдық (d = ${d[u]}). `;
      msg += ns.length ? `Көршілері (өсу ретімен): ${list(ns)}. ` : "Көршісі жоқ. ";
      if (fresh.length) msg += `${list(fresh)} әлі көрілмеген - белгілеп, кезектің соңына қосамыз (d = ${d[u] + 1}, ата-анасы ${u}). `;
      else if (ns.length) msg += "Жаңа көрші жоқ - кезекке ешкім қосылмайды. ";
      if (old.length) msg += `${list(old)} бұрын көрілген - қайта қоспаймыз.`;
      F.push(snap({ cur: u, added: fresh, msg: msg.trim() }));
    }
    const miss = G.ids.filter((v) => !vis.has(v));
    F.push(snap({ cur: null, msg: `Кезек бос - BFS аяқталды. Келу реті: ${order.join(" → ")}.` + (miss.length ? ` ${list(miss)} төбелеріне ${ABL[s]} жол жоқ (графтың басқа бөлігі).` : " Әр төбенің d мәні - оған дейінгі ең аз қабырға саны.") }));
    return { frames: F, order, d, p };
  }

  function dfs(G, s, asc = false) {
    const st = [{ v: s, p: null }], vis = new Set(), order = [], tree = [], p = {}, num = {};
    const snap = (extra) => ({ st: st.map((e) => e.v), vis: [...vis], p: { ...p }, num: { ...num }, order: order.slice(), tree: tree.slice(), ...extra });
    const F = [snap({ cur: null, msg: `Бастау: ${ACC[s]} стекке салдық. DFS-те төбені стектен АЛҒАНДА «көрілді» деп белгілейміз.` })];
    while (st.length) {
      const skipped = []; let e = null;
      while (st.length) { const x = st.pop(); if (!vis.has(x.v)) { e = x; break; } skipped.push(x.v); }
      const sk = skipped.length ? `Стектің төбесінен алынған ${list(skipped)} бұрын көрілген - тастадық. ` : "";
      if (!e) { F.push(snap({ cur: null, msg: `${sk}Стек бос - DFS аяқталды. Келу реті: ${order.join(" → ")}.` + missMsg(G, vis, s) })); return { frames: F, order, p }; }
      const u = e.v; vis.add(u); order.push(u); num[u] = order.length; p[u] = e.p;
      if (e.p != null) tree.push([e.p, u]);
      const ns = nb(G, u), fresh = ns.filter((v) => !vis.has(v));
      const push = asc ? fresh.slice() : fresh.slice().reverse();
      push.forEach((v) => st.push({ v, p: u }));
      let msg = `${sk}${ACC[u]} стектің төбесінен алдық` + (e.p != null ? ` (оған ${ABL[e.p]} келдік)` : "") + ` - бұл ${order.length}-болып көрілген төбе. `;
      msg += ns.length ? `Көршілері (өсу ретімен): ${list(ns)}. ` : "Көршісі жоқ. ";
      if (fresh.length > 1) msg += `Көрілмегендерін стекке кері ретпен (${list(push)}) саламыз - сонда ең кішісі ${fresh[0]} төбеде тұрады.`;
      else if (fresh.length) msg += `Көрілмегені ${fresh[0]} - стекке саламыз.`;
      else msg += "Көрілмеген көрші жоқ - стекте қалғанына ораламыз (кері шегіну).";
      F.push(snap({ cur: u, msg: msg.trim() }));
    }
    F.push(snap({ cur: null, msg: `Стек бос - DFS аяқталды. Келу реті: ${order.join(" → ")}.` + missMsg(G, vis, s) }));
    return { frames: F, order, p };
  }
  const missMsg = (G, vis, s) => { const m = G.ids.filter((v) => !vis.has(v)); return m.length ? ` ${list(m)} төбелеріне ${ABL[s]} жол жоқ.` : ""; };

  // ---------------------------------------------------------------- күй
  let G = makeGraph(PRESETS.metro), algo = "bfs", start = 1, run = null, k = 0, timer = null, predict = false, editing = false, sel = null, score = { ok: 0, n: 0 };
  const board = $(".cg-board"), svg = board.querySelector("svg");
  const say = $(".cs-say"), ask = $(".cs-ask"), fb = $("[data-fb=pred]");

  function recompute() { stop(); run = algo === "bfs" ? bfs(G, start) : dfs(G, start); k = 0; score = { ok: 0, n: 0 }; fb.className = ""; fb.textContent = ""; draw(); }

  function drawNodes() {
    board.querySelectorAll(".cg-node").forEach((n) => n.remove());
    G.ids.forEach((v) => {
      const [x, y] = G.pos[v], b = document.createElement("button");
      b.type = "button"; b.className = "cg-node"; b.dataset.v = v; b.textContent = v;
      b.style.left = (x / W) * 100 + "%"; b.style.top = (y / H) * 100 + "%";
      b.addEventListener("click", () => onNode(v));
      board.append(b);
    });
    const opts = G.ids.map((v) => `<option value="${v}">${v}</option>`).join("");
    ["[data-k=start]", "[data-k=ea]", "[data-k=eb]"].forEach((s, i) => { const el = $(s); const old = el.value; el.innerHTML = opts; el.value = G.adj[old] ? old : String(i === 2 ? G.ids[1] : G.ids[0]); });
    $("[data-k=start]").value = String(start);
  }

  function draw() {
    const F = run.frames[k], isB = algo === "bfs";
    const tree = new Set(F.tree.map(([a, b]) => a + "-" + b));
    const inTree = (a, b) => tree.has(a + "-" + b) || tree.has(b + "-" + a);
    const hot = (a, b) => F.cur != null && (a === F.cur || b === F.cur) && !inTree(a, b);
    let s = "";
    edgesOf(G).forEach(([a, b]) => { const [x1, y1] = G.pos[a], [x2, y2] = G.pos[b]; s += `<line class="cg-e${inTree(a, b) ? " tree" : hot(a, b) ? " hot" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; });
    const vis = new Set(F.vis), done = new Set(F.order), front = new Set((isB ? F.q : F.st).filter((v) => !done.has(v)));
    G.ids.forEach((v) => {
      const [x, y] = G.pos[v];
      let t = "";
      if (isB && F.d[v] != null) t = `d=${F.d[v]}` + (F.p[v] != null ? ` · p=${F.p[v]}` : "");
      if (!isB && F.num[v] != null) t = `#${F.num[v]}` + (F.p[v] != null ? ` · p=${F.p[v]}` : "");
      if (t) s += `<text class="cg-lab${v === F.cur ? " on" : ""}" x="${x}" y="${y + (y > 330 ? -40 : 48)}" text-anchor="middle">${t}</text>`;
    });
    svg.innerHTML = s;
    board.querySelectorAll(".cg-node").forEach((b) => {
      const v = +b.dataset.v;
      b.className = "cg-node" + (v === F.cur ? " cur" : done.has(v) || (isB && vis.has(v) && !front.has(v)) ? " vis" : "") + (front.has(v) && v !== F.cur ? " front" : "") + (editing && sel === v ? " sel" : "");
      const st = v === F.cur ? "қазір өңделуде" : done.has(v) ? "өңделді" : front.has(v) ? (isB ? "кезекте" : "стекте") : "әлі көрілмеген";
      b.setAttribute("aria-label", `Төбе ${v}: ${st}` + (isB && F.d[v] != null ? `, d = ${F.d[v]}` : ""));
      if (editing) b.setAttribute("aria-pressed", String(sel === v)); else b.removeAttribute("aria-pressed");
    });
    // жолақ: кезек немесе стек
    const items = isB ? F.q : F.st;
    $("[data-k=striplab]").textContent = isB ? "Кезек (Queue)" : "Стек (Stack)";
    $("[data-k=l]").textContent = isB ? "басы →" : "түбі";
    $("[data-k=r]").textContent = isB ? "← соңы" : "← төбесі";
    $(".cs-cells").innerHTML = items.length ? items.map((v, i) => `<b class="${(isB ? i === 0 : i === items.length - 1) ? "end" : ""}${!isB && vis.has(v) ? " dead" : ""}">${v}</b>`).join("") : "<em>бос</em>";
    $(".cs-cells").setAttribute("aria-label", (isB ? "Кезек, басынан соңына: " : "Стек, түбінен төбесіне: ") + (items.length ? items.join(", ") : "бос"));
    $("[data-k=vis]").textContent = F.vis.length ? "{" + F.vis.slice().sort((a, b) => a - b).join(", ") + "}" : "{ }";
    $("[data-k=order]").textContent = F.order.length ? F.order.join(" → ") : "-";
    $("[data-k=rule]").textContent = isB ? "Queue - FIFO: бірінші кірген бірінші шығады." : "Stack - LIFO: соңғы кірген бірінші шығады.";
    say.innerHTML = ""; const b = document.createElement("b"); b.textContent = `${k}-қадам. `; say.append(b, document.createTextNode(F.msg));
    $(".cs-n").textContent = `${k} / ${run.frames.length - 1}`;
    $("[data-c=prev]").disabled = k === 0;
    $("[data-c=next]").disabled = k >= run.frames.length - 1;
    $("[data-c=play]").disabled = predict || k >= run.frames.length - 1 || !!timer;
    $("[data-c=pause]").disabled = !timer;
    $(".cg-edges").textContent = "Қабырғалар: " + (edgesOf(G).map(([a, b]) => `${a}–${b}`).join(", ") || "жоқ");
    const nextCur = k < run.frames.length - 1 ? run.frames[k + 1].cur : null;
    ask.hidden = !(predict && nextCur != null && !editing);
    $(".cs-score").textContent = predict ? `Болжам: ${score.ok} / ${score.n} дұрыс` : "";
  }

  // ---------------------------------------------------------------- болжау
  function explainWrong(x, c) {
    const F = run.frames[k];
    if (algo === "bfs") {
      if (F.order.includes(x)) return ["Бұл төбе бұрын өңделген", `${x} кезектен бұрын алынып, өңделді. BFS әр төбені бір-ақ рет алады: «көрілді» белгісі оны кезекке қайта жібермейді. Келесісі - кезектің басындағы ${c}.`, "visited"];
      if (!F.q.includes(x)) return ["Бұл төбе әлі кезекте жоқ", `${x} әлі ешбір өңделген төбенің көршісі ретінде табылған жоқ, сондықтан кезекте тұрған жоқ. Келесі алынатын төбе тек кезектен шығады: кезектің басында ${c}.`, "undiscovered"];
      if (F.q.length > 1 && x === F.q[F.q.length - 1]) return ["DFS-ке тән жауап", `Сіз кезектің СОҢЫНДАҒЫ (ең соңғы қосылған) төбені таңдадыңыз - бұл Stack, LIFO: соңғы кірген бірінші шығады. BFS кезекпен жұмыс істейді: Queue - FIFO, бірінші кірген бірінші шығады. Кезектің басында ${c} тұр.`, "fifo-lifo"];
      return ["Кезекте бар, бірақ басында емес", `${x} кезекте тұр, бірақ одан бұрын ${c} қосылған. Queue - FIFO: ерте қосылғаны ерте шығады, сондықтан алдымен ${c} алынады.`, "queue-order"];
    }
    const live = F.st.filter((v) => !F.vis.includes(v));
    if (F.order.includes(x)) return ["Бұл төбе бұрын көрілген", `${x} бұрын көрілді (visited жиынында). Стекте оның көшірмесі қалса да, DFS оны алғанда тастап кетеді. Келесі көрілетін - стектің төбесіндегі көрілмеген ${c}.`, "visited"];
    if (!F.st.includes(x)) return ["Бұл төбе стекте жоқ", `${x} әлі ешбір көрілген төбенің көршісі ретінде стекке салынған жоқ. DFS келесі төбені тек стектің төбесінен алады: ${c}.`, "undiscovered"];
    if (live.length > 1 && x === live[0]) return ["BFS-ке тән жауап", `Сіз стектің ТҮБІНДЕГІ (ең ерте салынған) төбені таңдадыңыз - бұл Queue, FIFO: бірінші кірген бірінші шығады. DFS стекпен жұмыс істейді: Stack - LIFO, соңғы салынған бірінші шығады. Төбеде ${c} тұр.`, "fifo-lifo"];
    const same = F.cur != null && G.adj[F.cur].has(x) && G.adj[F.cur].has(c) && x > c;
    return ["Стекте бар, бірақ төбеде емес", `${x} стекте, бірақ оның үстінде ${c} жатыр. Stack - LIFO: алдымен ${c} алынады.` + (same ? ` ${F.cur} көршілері кері ретпен салынғандықтан, ең кіші нөмір ${c} төбеге шықты - сол себепті DFS көршілерді өсу ретімен аралайды.` : ""), "stack-order"];
  }
  function onPredict(x) {
    const c = run.frames[k + 1].cur, skill = algo === "bfs" ? "cs.bfs.predict" : "cs.dfs.predict";
    score.n++;
    board.querySelectorAll(".cg-node").forEach((b) => b.classList.remove("right", "wrong"));
    if (x === c) {
      score.ok++;
      T.feedback(fb, "ok", `Дұрыс: ${c}`, algo === "bfs" ? `${c} кезектің басында тұрды - Queue, FIFO.` : `${c} стектің төбесіндегі көрілмеген төбе - Stack, LIFO.`);
      T.record(skill, { item: "predict", ok: true, title: algo === "bfs" ? "BFS: келесі төбені болжау" : "DFS: келесі төбені болжау" });
    } else {
      const [title, why, code] = explainWrong(x, c);
      T.feedback(fb, "bad", `${title}. Дұрысы: ${c}`, why);
      T.record(skill, { item: "predict", ok: false, error: code, note: why, title: algo === "bfs" ? "BFS: келесі төбені болжау" : "DFS: келесі төбені болжау" });
    }
    k++; draw();
    const nb2 = board.querySelector(`.cg-node[data-v="${x}"]`); if (nb2) nb2.classList.add(x === c ? "right" : "wrong");
  }

  // ---------------------------------------------------------------- оқиғалар
  function onNode(v) {
    if (editing) {
      if (sel == null) { sel = v; draw(); say.textContent = `${v} таңдалды. Енді екінші төбені басыңыз: қабырға болса өшіріледі, болмаса қосылады.`; return; }
      if (sel === v) { sel = null; draw(); say.textContent = "Таңдау алынды."; return; }
      const a = sel; sel = null; toggleEdge(a, v); return;
    }
    if (predict && !ask.hidden) { onPredict(v); return; }
    if (k === 0 || k === run.frames.length - 1) { start = v; $("[data-k=start]").value = String(v); recompute(); say.textContent = `Бастапқы төбе: ${v}. «Келесі» не «Ойнату» басыңыз.`; return; }
    say.textContent = `${v}-төбе. Бастапқы төбені ауыстыру үшін «Басынан» басыңыз немесе тізімнен таңдаңыз.`;
  }
  function toggleEdge(a, b) {
    if (a === b) return;
    const had = G.adj[a].has(b);
    if (had) { G.adj[a].delete(b); G.adj[b].delete(a); } else { G.adj[a].add(b); G.adj[b].add(a); }
    recompute();
    say.textContent = `Қабырға ${Math.min(a, b)}–${Math.max(a, b)} ${had ? "өшірілді" : "қосылды"}. Алгоритм жаңа граф үшін басынан есептелді.`;
  }
  function step(d) { const n = Math.max(0, Math.min(run.frames.length - 1, k + d)); if (n !== k) { k = n; fb.className = ""; fb.textContent = ""; draw(); } }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function play() {
    if (timer || predict) return;
    const sp = +$("[data-c=speed]").value || 1;
    timer = setInterval(() => { if (k >= run.frames.length - 1) { stop(); draw(); return; } step(1); }, 1500 / sp);
    step(1); draw();
  }

  root.querySelector("[data-c=play]").addEventListener("click", play);
  root.querySelector("[data-c=pause]").addEventListener("click", () => { stop(); draw(); });
  root.querySelector("[data-c=next]").addEventListener("click", () => { stop(); const was = predict && !ask.hidden; step(1); if (was) T.feedback(fb, "info", "Болжамсыз көрсетілді", "Бұл қадам болжам есебіне кірмейді."); });
  root.querySelector("[data-c=prev]").addEventListener("click", () => { stop(); step(-1); });
  root.querySelector("[data-c=reset]").addEventListener("click", () => { recompute(); });
  root.querySelector("[data-c=speed]").addEventListener("change", () => { if (timer) { stop(); play(); } });
  root.querySelectorAll("[data-algo]").forEach((b) => b.addEventListener("click", () => {
    algo = b.dataset.algo; root.querySelectorAll("[data-algo]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); recompute();
  }));
  $("[data-k=start]").addEventListener("change", (e) => { start = +e.target.value; recompute(); });
  $("[data-k=preset]").addEventListener("change", (e) => { G = makeGraph(PRESETS[e.target.value]); start = G.ids[0]; sel = null; drawNodes(); recompute(); });
  $("[data-k=predict]").addEventListener("change", (e) => { predict = e.target.checked; stop(); recompute(); if (predict) say.textContent = "Болжау режимі: әр қадам алдында келесі алынатын төбені графтан басыңыз."; });
  $("[data-k=edit]").addEventListener("change", (e) => { editing = e.target.checked; sel = null; $(".cg-edit").hidden = !editing; stop(); draw(); if (editing) say.textContent = "Өңдеу режимі: екі төбені кезекпен басыңыз - арасындағы қабырға қосылады не өшіріледі."; });
  $("[data-c=toggle]").addEventListener("click", () => { const a = +$("[data-k=ea]").value, b = +$("[data-k=eb]").value; if (a === b) { say.textContent = "Екі түрлі төбе таңдаңыз."; return; } toggleEdge(a, b); });
  $("[data-c=restore]").addEventListener("click", () => { G = makeGraph(PRESETS[$("[data-k=preset]").value]); if (!G.adj[start]) start = G.ids[0]; drawNodes(); recompute(); say.textContent = "Граф бастапқы күйіне қайтарылды."; });
  $("[data-k=preset]").innerHTML = Object.entries(PRESETS).map(([id, p]) => `<option value="${id}">${p.name}</option>`).join("");
  drawNodes(); recompute();

  // ---------------------------------------------------------------- қорытынды тапсырма: жаңа граф, көмексіз
  const task = document.querySelector("[data-cslab=bfs-task]");
  if (!task) return;
  const tq = (s) => task.querySelector(s);
  // 7 орын: алтыбұрыш + орта; тек осы 12 қиылыспайтын қабырғадан таңдаймыз - сурет оқылымды болады
  const SLOT = [[300, 200], [300, 55], [440, 128], [440, 272], [300, 345], [160, 272], [160, 128]];
  const CAND = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]];
  let P = null, HN = null, helped = false;
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function randomGraph() {
    for (;;) {
      const lab = shuffle([1, 2, 3, 4, 5, 6, 7]), cand = shuffle(CAND.slice());
      const par = [0, 1, 2, 3, 4, 5, 6], find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
      const pick = [];
      cand.forEach((e0) => { const [a, b] = e0; if (find(a) !== find(b)) { par[find(a)] = find(b); pick.push(e0); } });
      cand.filter((e) => !pick.includes(e)).slice(0, 2 + rnd(2)).forEach((e) => pick.push(e));
      const pos = {}; SLOT.forEach((xy, i) => (pos[lab[i]] = xy));
      const g = makeGraph({ pos, edges: pick.map(([a, b]) => [lab[a], lab[b]]) });
      const s = 1 + rnd(7), r = bfs(g, s), far = g.ids.filter((v) => r.d[v] >= 2);
      if (far.length && bfs(g, s).order.join() !== dfs(g, s).order.join()) return { g, s, t: far[rnd(far.length)] };
    }
  }
  function newTask() {
    const kind = tq("[data-k=kind]").value;
    const { g, s, t } = randomGraph();
    const B = bfs(g, s), D = dfs(g, s);
    P = { kind, g, s, t, B, D };
    helped = false;
    let svgS = "";
    edgesOf(g).forEach(([a, b]) => { const [x1, y1] = g.pos[a], [x2, y2] = g.pos[b]; svgS += `<line class="cg-e" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; });
    g.ids.forEach((v) => { const [x, y] = g.pos[v]; const hl = v === s || (kind === "dist" && v === t); svgS += `<circle cx="${x}" cy="${y}" r="25" style="fill:${hl ? "var(--lab-gold)" : "var(--lab-night2)"};stroke:var(--lab-chalk2);stroke-width:2"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="22" font-weight="700" style="fill:${hl ? "var(--lab-night)" : "var(--lab-chalk)"}">${v}</text>`; });
    const es = edgesOf(g).map(([a, b]) => `${a}–${b}`).join(", ");
    tq("svg").innerHTML = svgS;
    tq("svg").setAttribute("aria-label", `Тапсырма графы. Қабырғалар: ${es}`);
    tq("[data-k=tedges]").textContent = "Қабырғалар: " + es;
    tq("[data-k=q]").textContent = kind === "bfs" ? `${ABL[s]} бастап BFS жүргізгенде төбелер қандай ретпен кезектен алынады? Барлық 7 төбені бос орын арқылы жазыңыз.`
      : kind === "dfs" ? `${ABL[s]} бастап DFS (стек, көршілер өсу ретімен) жүргізгенде төбелер қандай ретпен көріледі? Барлық 7 төбені жазыңыз.`
      : `${ABL[s]} ${DAT[t]} дейінгі ең қысқа жол неше қабырғадан тұрады?`;
    const inp = tq("[data-k=ans]"); inp.value = ""; inp.placeholder = kind === "dist" ? "мысалы: 2" : "мысалы: 3 1 5 ...";
    tq("[data-fb=task]").className = ""; tq("[data-fb=task]").textContent = "";
    HN = T.hints(tq("[data-k=hints]"), hintList(), { onSolution: () => { helped = true; T.feedback(tq("[data-fb=task]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. Шешімді түсінген соң «Жаңа есеп» басып, келесісін көмексіз шығарыңыз."); } });
  }
  function hintList() {
    const { kind, s, t, B, D } = P;
    if (kind === "dist") {
      const layers = {}; Object.entries(B.d).forEach(([v, d]) => (layers[d] = layers[d] || []).push(+v));
      return ["BFS графты қабат-қабатпен ашады: бастапқы төбе - 0-қабат, оның көршілері - 1-қабат, солардың әлі көрілмеген көршілері - 2-қабат. Ізделген төбе қай қабатта болса, жауап сол.",
        "Мысал: 1–2, 1–3, 2–4, 3–4 графында 1-ден 4-ке: d(1) = 0; 2 мен 3 - 1-қабат; 4 - 2-қабат. Жауап 2 (1 → 2 → 4).",
        `Қабаттар: ` + Object.keys(layers).sort((a, b) => a - b).map((d) => `${d}-қабат: ${list(layers[d].sort((a, b) => a - b))}`).join("; ") + `. ${t} ${B.d[t]}-қабатта, жол: ${pathTo(B.p, t).join(" → ")}. Жауап: ${B.d[t]}.`];
    }
    if (kind === "bfs") return ["Кезекті қағазға жазыңыз: басынан бір төбе алыңыз, оның әлі көрілмеген көршілерін өсу ретімен кезектің СОҢЫНА қосыңыз. Көрілгенді қайта қоспаңыз.",
      "Мысал: 1–2, 1–3, 2–4, 3–4 графында 1-ден: [1] → 1-ді алып 2, 3 қосамыз [2, 3] → 2-ні алып 4 қосамыз [3, 4] → 3 (жаңа көрші жоқ) [4] → 4. Реті: 1 2 3 4.",
      solution(B.frames, true) + ` Жауап: ${B.order.join(" ")}.`];
    return ["Стекті қағазға жазыңыз: төбесінен алыңыз; көрілген болса тастаңыз; әйтпесе белгілеп, көрілмеген көршілерін КЕРІ ретпен салыңыз - ең кішісі төбеде тұрсын.",
      "Мысал: 1–2, 1–3, 2–4, 3–4 графында 1-ден: [1] → 1 алынды, 3, 2 салынды [3, 2] → 2 алынды, 4 салынды [3, 4] → 4 алынды, 3 салынды [3, 3] → 3 алынды; қалған 3 - тасталады. Реті: 1 2 4 3.",
      solution(D.frames, false) + ` Жауап: ${D.order.join(" ")}.`];
  }
  const pathTo = (p, t) => { const a = []; for (let v = t; v != null; v = p[v]) a.unshift(v); return a; };
  const solution = (F, isB) => F.slice(1, -1).map((f, i) => `${i + 1}) ${f.cur} алынды → ${isB ? "кезек" : "стек"} [${list(isB ? f.q : f.st)}]`).join("; ") + ".";

  function check() {
    const { kind, s, t, B, D, g } = P, raw = tq("[data-k=ans]").value, out = tq("[data-fb=task]");
    const skill = kind === "dfs" ? "cs.dfs" : "cs.bfs", title = kind === "dfs" ? "DFS: келу реті" : kind === "bfs" ? "BFS: келу реті" : "BFS: ең қысқа қашықтық";
    const nums = (raw.match(/\d+/g) || []).map(Number);
    if (!nums.length) { T.feedback(out, "info", "Жауап бос", kind === "dist" ? "Бір сан жазыңыз - қабырғалар саны." : "Төбелердің нөмірлерін бос орын арқылы жазыңыз."); return; }
    let ok = false, ttl = "", why = "", code = "";
    if (kind === "dist") {
      const a = nums[0], d = B.d[t], dd = (() => { let c = 0; for (let v = t; D.p[v] != null; v = D.p[v]) c++; return c; })();
      ok = a === d;
      if (ok) { ttl = "Дұрыс"; why = `Ең қысқа жол: ${pathTo(B.p, t).join(" → ")} (${d} қабырға). BFS ${DAT[t]} ${d}-қабатта жетеді, ал одан қысқа жол болса, ол ертерек қабатта табылар еді.`; }
      else if (a < d) { ttl = "Мұндай қысқа жол жоқ"; code = "too-short"; why = `${a} қабырғамен ${ABL[s]} ${DAT[t]} жету мүмкін емес: ${a}-қабатқа дейінгі төбелерде ${t} жоқ. Қабаттарды бастапқы төбеден бастап қайта санаңыз.`; }
      else if (a === dd && dd !== d) { ttl = "Бұл DFS тапқан жол"; code = "dfs-path"; why = `DFS ағашында ${t} тереңдігі ${dd}, бірақ DFS ең қысқа жолды кепілдемейді: ол бір тармаққа терең кетеді. Ең қысқасын BFS береді - ол графты қабат-қабатпен ашады.`; }
      else { ttl = "Бұл ең қысқа жол емес"; code = "not-shortest"; why = `${a} қабырғалы жол болуы мүмкін, бірақ одан қысқасы бар. BFS қабаттары бойынша ${t} ертерек қабатта кездеседі.`; }
    } else {
      const want = kind === "bfs" ? B.order : D.order;
      const dup = nums.filter((v, i) => nums.indexOf(v) !== i), bad = nums.filter((v) => !g.adj[v]);
      ok = nums.join() === want.join();
      if (ok) { ttl = "Дұрыс"; why = kind === "bfs" ? "Кезек FIFO ережесімен және көршілер өсу ретімен - дәл осы рет. BFS реті қабат бойынша: алдымен 1 қабырға қашықтағылар, сосын 2 қабырға қашықтағылар..." : "Стек LIFO: әр жолы ең соңғы ашылған тармаққа тереңдеп кетеміз, тұйыққа тірелгенде ғана кері шегінеміз."; }
      else if (bad.length) { ttl = "Графта мұндай төбе жоқ"; code = "format"; why = `${list(bad)} - графта жоқ нөмір. Төбелер 1-ден 7-ге дейін.`; }
      else if (dup.length) { ttl = "Төбе қайталанды"; code = "repeat"; why = `${list([...new Set(dup)])} бірнеше рет жазылды. «Көрілді» белгісі әр төбені бір-ақ рет өңдеуге кепілдік береді.`; }
      else if (nums[0] !== s) { ttl = "Бастапқы төбеден бастаңыз"; code = "start"; why = `Рет бастапқы төбе ${ABL[s]} басталады - ол бірінші болып ${kind === "bfs" ? "кезектен" : "стектен"} алынады.`; }
      else if (kind === "bfs" && nums.join() === D.order.join()) { ttl = "Бұл DFS реті"; code = "fifo-lifo"; why = "Сіз стекпен (LIFO) жүрдіңіз: соңғы ашылған көршіге тереңдедіңіз. BFS кезекпен жұмыс істейді: Queue - FIFO, бірінші кірген бірінші шығады - сондықтан алдымен бастапқы төбенің БАРЛЫҚ көршілері, сосын олардың көршілері."; }
      else if (kind === "dfs" && nums.join() === B.order.join()) { ttl = "Бұл BFS реті"; code = "fifo-lifo"; why = "Сіз кезекпен (FIFO) жүрдіңіз: көршілерді қабат-қабатпен аштыңыз. DFS стекпен жұмыс істейді: Stack - LIFO - соңғы салынған көршіге бірден тереңдеп кетеміз."; }
      else if (kind === "bfs" && nums.join() === bfs(g, s, true).order.join()) { ttl = "Көршілердің реті кері"; code = "nb-order"; why = "Алгоритм дұрыс, бірақ көршілерді кему ретімен қостыңыз. Бұл зертханадағы келісім: көршілер өсу ретімен қаралады."; }
      else if (kind === "dfs" && nums.join() === dfs(g, s, true).order.join()) { ttl = "Көршілерді стекке кері салу керек"; code = "nb-order"; why = "Көршілерді стекке өсу ретімен салсаңыз, ең үлкені төбеде қалады да, бірінші соған барасыз. Ең кішісі төбеде тұруы үшін оларды КЕРІ ретпен салыңыз."; }
      else {
        const i = nums.findIndex((v, j) => v !== want[j]);
        code = "order"; ttl = nums.length < want.length && i === -1 ? "Барлық төбе жазылмады" : `${i + 1}-орында қате`;
        if (i === -1) why = `Алғашқы ${nums.length} төбе дұрыс, бірақ барлығы ${want.length} төбе көріледі. Жалғастырыңыз.`;
        else if (kind === "bfs") { const f = B.frames[i]; why = `Алғашқы ${i} төбе дұрыс. Сол сәтте кезек [${list(f.q)}], оның басында ${want[i]} тұр - FIFO бойынша келесі сол. Сіз ${nums[i]} жаздыңыз.`; }
        else { const f = D.frames[i], live = f.st.filter((v) => !f.vis.includes(v)); why = `Алғашқы ${i} төбе дұрыс. Сол сәтте стек (түбінен төбесіне) [${list(f.st)}]; төбедегі көрілмеген - ${live[live.length - 1]}. Сіз ${nums[i]} жаздыңыз.`; }
      }
    }
    const hints = HN.used();
    T.feedback(out, ok ? "ok" : "bad", ok ? ttl + (hints ? ` (${hints} көмекпен)` : "") : ttl, why + (ok ? " «Жаңа есеп» - келесі граф." : ""));
    T.record(skill, { item: P.kind, ok, hints: helped ? 3 : hints, error: code, note: why, title });
  }
  tq("[data-c=check]").addEventListener("click", check);
  tq("[data-k=ans]").addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
  tq("[data-c=new]").addEventListener("click", newTask);
  tq("[data-k=kind]").addEventListener("change", newTask);
  newTask();
  document.querySelectorAll("[data-badge]").forEach((el) => T.badge(el, el.dataset.badge, el.dataset.title));

  window.CSLabBFS = { bfs, dfs, makeGraph };
})();
