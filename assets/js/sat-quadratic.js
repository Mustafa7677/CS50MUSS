/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Advanced Math: «Квадраттық функция графигі» зертханасы. y = a(x − h)² + k - жүгірткілер, SVG тақта,
   болжам, тексерілетін тапсырма (қате параметрді нақты атайды), генерацияланған меңгеру есептері. */
(() => {
  "use strict";
  const { num, svg, rnd, pick } = window.SAT;
  const T = window.AO17Tutor;
  const SKILL = "sat.math.quadratic", TITLE = "Квадраттық функция: төбе түрі";
  const $ = (id) => document.getElementById(id);
  const root = $("q-svg");
  if (!root) return;

  const S = 20, C = 200, px = (x) => C + S * x, py = (y) => C - S * y;
  const st = { a: 1, h: 0, k: 0, last: "", target: null };

  /* ---------- формула ---------- */
  function formula(a, h, k) {
    if (a === 0) return "y = " + num(k);
    const A = a === 1 ? "" : a === -1 ? "−" : num(a);
    const X = h === 0 ? "x²" : `(x ${h > 0 ? "−" : "+"} ${num(Math.abs(h))})²`;
    const K = k === 0 ? "" : ` ${k > 0 ? "+" : "−"} ${num(Math.abs(k))}`;
    return `y = ${A}${X}${K}`;
  }

  /* ---------- тақта ---------- */
  const g = { grid: svg("g", {}, root) };
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    svg("line", { class: "lb-grid", x1: px(i), y1: 0, x2: px(i), y2: 400 }, g.grid);
    svg("line", { class: "lb-grid", x1: 0, y1: py(i), x2: 400, y2: py(i) }, g.grid);
    if (i % 2 === 0) {
      svg("text", { class: "sb-tick", x: px(i), y: py(0) + 14, "text-anchor": "middle" }, g.grid).textContent = num(i);
      svg("text", { class: "sb-tick", x: px(0) - 5, y: py(i) + 4, "text-anchor": "end" }, g.grid).textContent = num(i);
    }
  }
  svg("line", { class: "lb-axis", x1: 0, y1: C, x2: 400, y2: C }, g.grid);
  svg("line", { class: "lb-axis", x1: C, y1: 0, x2: C, y2: 400 }, g.grid);
  svg("text", { class: "sb-tick", x: 392, y: C - 6, "text-anchor": "end" }, g.grid).textContent = "x";
  svg("text", { class: "sb-tick", x: C + 6, y: 12 }, g.grid).textContent = "y";
  const path = (f) => { let d = ""; for (let x = -10.5; x <= 10.5; x += 0.05) { const y = Math.max(-40, Math.min(40, f(x))); d += (d ? "L" : "M") + px(x).toFixed(1) + " " + py(y).toFixed(1); } return d; };
  svg("path", { class: "lb-ghost", d: path((x) => x * x) }, root);
  const sym = svg("line", { class: "sb-sym", y1: 0, y2: 400 }, root);
  const curve = svg("path", { class: "lb-curve" }, root);
  const tgt = svg("g", { visibility: "hidden" }, root);
  const tgtDot = svg("circle", { class: "sb-pt", r: 6 }, tgt);
  const tgtLbl = svg("text", { class: "sb-lbl" }, tgt);
  const vtx = svg("circle", { class: "sb-vtx", r: 6.5 }, root);
  const vtxLbl = svg("text", { class: "sb-lbl" }, root);

  function draw() {
    const { a, h, k } = st;
    curve.setAttribute("d", path((x) => a * (x - h) ** 2 + k));
    const vis = a !== 0 ? "visible" : "hidden";
    sym.setAttribute("x1", px(h)); sym.setAttribute("x2", px(h)); sym.setAttribute("visibility", vis);
    vtx.setAttribute("cx", px(h)); vtx.setAttribute("cy", py(k)); vtx.setAttribute("visibility", vis);
    const lx = Math.min(330, Math.max(8, px(h) + 10)), ly = Math.min(392, Math.max(16, py(k) + (a >= 0 ? 20 : -10)));
    vtxLbl.setAttribute("x", lx); vtxLbl.setAttribute("y", ly); vtxLbl.setAttribute("visibility", vis);
    vtxLbl.textContent = `(${num(h)}, ${num(k)})`;
    if (st.target) {
      const [p, q] = st.target;
      tgt.setAttribute("visibility", "visible");
      tgtDot.setAttribute("cx", px(p)); tgtDot.setAttribute("cy", py(q));
      tgtLbl.setAttribute("x", Math.min(330, px(p) + 9)); tgtLbl.setAttribute("y", Math.max(16, py(q) - 9));
      tgtLbl.textContent = `P(${num(p)}, ${num(q)})`;
    } else tgt.setAttribute("visibility", "hidden");
    const f = formula(a, h, k);
    $("q-formula").textContent = f;
    $("q-svg-t").textContent = a === 0 ? `Графикте: ${f} түзуі (a = 0, парабола емес).` : `Графикте: ${f} параболасы, төбесі (${num(h)}, ${num(k)}), ${a > 0 ? "жоғары" : "төмен"} ашылады; үзік сызық - y = x².`;
    explain();
  }

  function explain() {
    const { a, h, k, last } = st, ol = $("q-ex");
    const items = [];
    items.push(["h", h > 0 ? `h = ${num(h)}: жақшада «x − ${num(h)}», парабола ОҢҒА ${num(h)} бірлік жылжыды. Минус белгісі солға меңзейтін сияқты, бірақ төбе жақша нөлге тең болатын жерде: x − ${num(h)} = 0 → x = ${num(h)}.`
      : h < 0 ? `h = ${num(h)}: жақшада «x + ${num(-h)}» = «x − (${num(h)})», парабола СОЛҒА ${num(-h)} бірлік жылжыды (x + ${num(-h)} = 0 → x = ${num(h)}).`
      : "h = 0: көлденең жылжу жоқ, симметрия осі - y осі (x = 0)."]);
    items.push(["k", k > 0 ? `k = ${num(k)}: «+ ${num(k)}» бүкіл графикті ЖОҒАРЫ ${num(k)} бірлік көтереді.` : k < 0 ? `k = ${num(k)}: «− ${num(-k)}» бүкіл графикті ТӨМЕН ${num(-k)} бірлік түсіреді.` : "k = 0: тік жылжу жоқ."]);
    items.push(["a", a > 0 ? `a = ${num(a)} > 0: парабола жоғары ашылады (∪), төбе - ең кіші мән: y ≥ ${num(k)}.` : a < 0 ? `a = ${num(a)} < 0: парабола төмен ашылады (∩), төбе - ең үлкен мән: y ≤ ${num(k)}.` : "a = 0: x² мүшесі жоғалады, y = k - көлденең түзу. Бұл парабола емес!"]);
    if (a !== 0) { const m = Math.abs(a); items.push(["w", m > 1 ? `|a| = ${num(m)} > 1: y = x²-тен тарырақ (тік) - x бір бірлікке ауысқанда y ${num(m)} есе тез өседі.` : m < 1 ? `|a| = ${num(m)} < 1: y = x²-тен кеңірек (жайпақ).` : "|a| = 1: пішіні y = x²-пен бірдей, тек орны мен бағыты өзгеруі мүмкін."]); }
    items.push(["s", a !== 0 ? `Симметрия осі: x = ${num(h)}.` : "Симметрия осі жоқ - бұл түзу."]);
    ol.innerHTML = "";
    items.forEach(([key, t]) => { const li = document.createElement("li"); li.textContent = t; if (key === last || (last === "a" && key === "w")) li.className = "hot"; ol.append(li); });
  }

  /* ---------- басқару ---------- */
  const pairs = { a: ["q-a", "q-an"], h: ["q-h", "q-hn"], k: ["q-k", "q-kn"] };
  const LIM = { a: 5, h: 9, k: 9 };
  function set(p, v, from) {
    if (!Number.isFinite(v)) return;
    v = Math.max(-LIM[p], Math.min(LIM[p], v));
    st[p] = Object.is(v, -0) ? 0 : v; st.last = p;
    const [r, n] = pairs[p].map($);
    if (from !== r) r.value = v;
    if (from !== n) n.value = v;
    draw();
  }
  Object.entries(pairs).forEach(([p, [r, n]]) => {
    $(r).addEventListener("input", (e) => set(p, parseFloat(e.target.value), e.target));
    $(n).addEventListener("input", (e) => { const v = parseFloat(String(e.target.value).replace(",", ".")); if (Number.isFinite(v)) set(p, v, e.target); });
  });
  const ctlInputs = () => document.querySelectorAll("#q-ctl input");
  ctlInputs().forEach((i) => (i.disabled = true));

  /* ---------- болжам ---------- */
  const PW = {
    right: ["Дұрыс болжам!", "y = (x − 3)²: жақша x = 3 болғанда нөлге тең, сондықтан төбе (3, 0) - парабола оңға 3 бірлік жылжиды. Енді h = 3 қойылды - графиктен өзің тексер."],
    left: ["Бұл - ең жиі қақпан.", "«x − 3» ішіндегі минус солға меңзейтін сияқты. Бірақ төбе жақша нөлге айналатын жерде: x − 3 = 0 → x = 3. Сондықтан парабола ОҢҒА жылжиды. h = 3 қойылды - графикке қара."],
    up: ["Жоқ, бұл - k-ның жұмысы.", "Жоғары-төмен жылжуды жақшаның сыртындағы k береді. h жақшаның ішінде тұр, ол x-ке әсер етеді - яғни көлденең жылжу: x − 3 = 0 → оңға 3. h = 3 қойылды - графикке қара."],
    down: ["Жоқ, бұл - k-ның жұмысы.", "Төмен жылжу «− 3» жақшаның сыртында тұрғанда болады: y = x² − 3. h жақшаның ішінде, ол көлденең жылжытады: (x − 3)² → оңға 3. h = 3 қойылды - графикке қара."],
  };
  document.querySelectorAll("#q-predict [data-p]").forEach((b) => b.addEventListener("click", () => {
    const p = b.dataset.p;
    document.querySelectorAll("#q-predict [data-p]").forEach((x) => { x.disabled = true; x.classList.toggle("ok", x.dataset.p === "right"); x.classList.toggle("no", x === b && p !== "right"); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    T.feedback($("q-pfb"), p === "right" ? "ok" : "bad", PW[p][0], PW[p][1]);
    ctlInputs().forEach((i) => (i.disabled = false));
    $("q-lock").hidden = true;
    set("h", 3);
    window.SAT.focus($("q-h"));
  }));

  /* ---------- тексеру ---------- */
  /** want: {h, k, dir: "up"|"down"} немесе {h, k, p, q}. Қателер тізімін қайтарады: [код, түсіндірме]. */
  function diagnose(want) {
    const { a, h, k } = st, errs = [];
    if (a === 0) errs.push(["a-zero", "a = 0: онда a(x − h)² = 0 және y = k - көлденең түзу. Бұл парабола емес, оның төбесі де жоқ."]);
    if (h !== want.h) {
      if (h === -want.h && want.h !== 0) errs.push(["sign-h", `h = ${num(h)} қойылды, ал төбенің x-і ${num(want.h)}. Белгі қақпаны: төбе x = ${num(want.h)} болса, жақшада «x ${want.h > 0 ? "−" : "+"} ${num(Math.abs(want.h))}» тұрады, яғни h = ${num(want.h)}. Қазір парабола ${h > 0 ? "оңға" : "солға"} жылжыған.`]);
      else errs.push(["h-value", `h = ${num(h)}, бірақ төбенің x-координатасы ${num(want.h)} болуы керек. h төбені көлденең жылжытады.`]);
    }
    if (k !== want.k) {
      if (k === -want.k && want.k !== 0) errs.push(["sign-k", `k = ${num(k)} - таңбасы керісінше. Төбе y = ${num(want.k)} деңгейінде, сондықтан k = ${num(want.k)} (${want.k < 0 ? "төмен" : "жоғары"} жылжу). k-да белгі қақпаны жоқ: «+ k» жоғары, «− k» төмен.`]);
      else errs.push(["k-value", `k = ${num(k)}, бірақ төбенің y-координатасы ${num(want.k)}. k графикті тігінен жылжытады.`]);
    }
    if (a !== 0 && want.dir) {
      if (want.dir === "up" && a < 0) errs.push(["sign-a", `a = ${num(a)} < 0 - парабола төмен ашылып тұр. Жоғары ашылу үшін a > 0 керек (кез келген оң сан жарайды).`]);
      if (want.dir === "down" && a > 0) errs.push(["sign-a", `a = ${num(a)} > 0 - парабола жоғары ашылып тұр. Төмен ашылу үшін a < 0 керек.`]);
    }
    if (a !== 0 && want.p !== undefined && !errs.length) {
      const y = a * (want.p - h) ** 2 + k;
      if (Math.abs(y - want.q) > 1e-9) errs.push(["a-value", `Төбе дұрыс. Бірақ x = ${num(want.p)} болғанда сенің параболаң y = ${num(y)} береді, ал P нүктесінде y = ${num(want.q)}. a-ны есепте: ${num(want.q)} = a·(${num(want.p)} − ${num(h)})² + ${num(k)}. ${y > want.q ? "Қазіргі a тым үлкен" : "Қазіргі a тым кіші"}.`]);
    }
    return errs;
  }

  T.badge($("q-badge"), SKILL, TITLE);
  /* 1-тапсырма */
  let t1Spoiled = false;
  const t1h = T.hints($("t1-h"), [
    "Төбе (h, k) формуласында тікелей көрінеді: y = a(x − h)² + k. Жоғары не төмен ашылуды тек a-ның таңбасы шешеді.",
    "Ұқсас мысал: төбесі (−1, 4), төмен ашылатын парабола - y = −(x + 1)² + 4. Мұнда h = −1, сондықтан жақшада «x + 1», ал a = −1 < 0.",
    "Шешім: 1) төбенің x-і 3 → h = 3, жақшада (x − 3). 2) төбенің y-і −2 → k = −2. 3) жоғары ашылу → a > 0, мысалы a = 1. Жауап: y = (x − 3)² − 2 (a = 2 немесе 0.5 болса да дұрыс).",
  ], { onSolution: () => { t1Spoiled = true; T.feedback($("t1-fb"), "info", "Шешім ашылды.", "Бұл есеп енді меңгеруге саналмайды. Жүгірткілерді орнатып тексеріп көр, содан кейін төмендегі 2-тапсырмадағы жаңа есептерді көмексіз шеш."); } });
  $("t1-check").addEventListener("click", () => {
    const errs = diagnose({ h: 3, k: -2, dir: "up" });
    const hints = t1Spoiled ? 3 : t1h.used();
    if (!errs.length) {
      T.feedback($("t1-fb"), "ok", "Дұрыс! " + formula(st.a, st.h, st.k), `Төбесі (3, −2), a = ${num(st.a)} > 0 - жоғары ашылады. Шартта тек төбе мен бағыт берілген, сондықтан кез келген оң a дұрыс: a = 1, 2, 0.5 - бәрі жауап. ${st.a !== 1 ? "a = 1 болса, y = x²-пен пішіні бірдей болар еді." : "a-ны өзгертіп көр: төбе орнында қалады, тек ені өзгереді."}`);
    } else {
      T.feedback($("t1-fb"), "bad", errs.length > 1 ? `Әлі емес: ${errs.length} параметр түзетуді қажет етеді.` : "Әлі емес.", errs.map((e) => e[1]).join(" "));
    }
    T.record(SKILL, { item: "vertex(3,-2)up", ok: !errs.length, hints, error: errs.map((e) => e[0]).join(","), note: errs.map((e) => e[1]).join(" "), title: TITLE });
  });

  /* 2-тапсырма: генерацияланған есептер */
  let task = null, spoiled = false, solved = false, streak = 0, hintsObj = null;
  function gen() {
    if (Math.random() < 0.5) {
      let h, k;
      do { h = rnd(-5, 5); k = rnd(-5, 5); } while ((h === 0 && k === 0) || (task && task.h === h && task.k === k));
      return { type: "vertex", h, k, dir: Math.random() < 0.5 ? "up" : "down" };
    }
    for (;;) {
      const h = rnd(-4, 4), k = rnd(-4, 4), a = pick([-2, -1, -0.5, 0.5, 1, 2]), d = pick([-2, -1, 1, 2]);
      const p = h + d, q = k + a * d * d;
      if (Number.isInteger(q) && Math.abs(q) <= 9 && Math.abs(p) <= 9 && !(h === 0 && k === 0)) return { type: "point", h, k, a, p, q };
    }
  }
  function show() {
    task = gen(); spoiled = false; solved = false;
    st.target = task.type === "point" ? [task.p, task.q] : null;
    const V = `(${num(task.h)}, ${num(task.k)})`;
    $("t2-q").textContent = task.type === "vertex"
      ? `Төбесі ${V}, ${task.dir === "up" ? "жоғары" : "төмен"} ашылатын парабола құрастыр.`
      : `Төбесі ${V} және P(${num(task.p)}, ${num(task.q)}) нүктесі арқылы өтетін парабола құрастыр.`;
    $("t2-fb").className = ""; $("t2-fb").textContent = "";
    const ans = task.type === "vertex" ? formula(task.dir === "up" ? 1 : -1, task.h, task.k) : formula(task.a, task.h, task.k);
    const steps = task.type === "vertex"
      ? ["Төбе (h, k) → h мен k-ны тікелей қой. Бағытты a-ның таңбасы анықтайды.", "Ұқсас мысал: төбесі (2, 5), жоғары ашылатын - y = (x − 2)² + 5; төбесі (−4, 1), төмен ашылатын - y = −(x + 4)² + 1.", `Шешім: h = ${num(task.h)}, k = ${num(task.k)}, a ${task.dir === "up" ? "> 0 (мысалы, 1)" : "< 0 (мысалы, −1)"}. Жауап: ${ans}.`]
      : ["Алдымен төбені орнат (h мен k). Содан кейін P нүктесінің координаталарын формулаға қойып, a-ны тап.", "Ұқсас мысал: төбесі (1, 2), парабола (3, 10) арқылы өтеді: 10 = a(3 − 1)² + 2 → 8 = 4a → a = 2.",
        `Шешім: ${num(task.q)} = a(${num(task.p)} − ${num(task.h)})² + ${num(task.k)} → ${num(task.q - task.k)} = ${num((task.p - task.h) ** 2)}a → a = ${num(task.a)}. Жауап: ${ans}.`];
    if (!hintsObj) hintsObj = T.hints($("t2-h"), steps, { onSolution: () => { spoiled = true; T.feedback($("t2-fb"), "info", "Шешім ашылды - бұл есеп меңгеруге саналмайды.", "Жауапты орнатып тексеріп көр, содан кейін «Жаңа есеп» бас: келесі есепті көмексіз шеш."); } });
    else hintsObj.reset(steps);
    prog(); draw();
  }
  function prog() { const m = T.mastery(SKILL); $("t2-prog").textContent = `Көмексіз қатарынан дұрыс: ${Math.min(streak, 3)} / 3 · дағды деңгейі: ${m.level}`; }
  $("t2-check").addEventListener("click", () => {
    if (solved) { T.feedback($("t2-fb"), "info", "Бұл есеп шешілді.", "«Жаңа есеп» батырмасын бас."); return; }
    const errs = diagnose(task);
    const hints = spoiled ? 3 : hintsObj.used(), ok = !errs.length;
    if (ok) {
      solved = true; streak = hints ? 0 : streak + 1;
      T.feedback($("t2-fb"), "ok", "Дұрыс! " + formula(st.a, st.h, st.k), (task.type === "point" ? `Тексеру: x = ${num(task.p)} → y = ${num(st.a)}·(${num(task.p - task.h)})² + ${num(task.k)} = ${num(task.q)}. ` : `Төбесі (${num(task.h)}, ${num(task.k)}), a = ${num(st.a)} - ${task.dir === "up" ? "жоғары" : "төмен"} ашылады. `) + (hints ? "Көмек қолданылды, сондықтан бұл меңгеруге толық саналмайды." : "Көмексіз шешілді."));
    } else {
      streak = 0;
      T.feedback($("t2-fb"), "bad", "Әлі емес.", errs.map((e) => e[1]).join(" "));
    }
    T.record(SKILL, { item: task.type, ok, hints, error: errs.map((e) => e[0]).join(","), note: errs.map((e) => e[1]).join(" "), title: TITLE });
    prog();
  });
  $("t2-next").addEventListener("click", show);
  show();
})();
