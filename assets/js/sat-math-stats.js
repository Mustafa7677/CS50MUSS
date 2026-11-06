/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT Statistics зертханасы: сүйрелетін нүктелі диаграмма (dot plot) - орташа, медиана, құлаш, стандартты ауытқу
   интуициясы, шеткі мәннің әсері, бокс-диаграмма (box plot); іріктеме мен қателік шегі туралы сапалық сұрақтар. */
(() => {
  "use strict";
  const { svg, h, num, rnd, pick, shuffle } = window.SAT;
  const M = window.SATM, T = window.AO17Tutor;
  const $ = (id) => document.getElementById(id);
  const root = $("st-svg");
  if (!root || !M) return;
  const SKILL = "sat.math.stats", TITLE = "SAT Data: орташа, медиана, таралу";
  const B = M.board(root, { x: [-1, 21], y: [-6.5, 8], W: 400, H: 270, grid: false, axes: false });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = (v) => num(M.round(v, 2));

  /* ---------- статистика ---------- */
  const sorted = (a) => a.slice().sort((x, y) => x - y);
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const median = (a) => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
  /** Квартильдер: медианадан төмен/жоғары жартылардың медианасы (тақ n-де медиана жартыларға кірмейді). */
  const quart = (a) => { const s = sorted(a), n = s.length, lo = s.slice(0, Math.floor(n / 2)), hi = s.slice(Math.ceil(n / 2)); return [median(lo), median(hi)]; };
  const stats = (a) => { const s = sorted(a), [q1, q3] = quart(a); return { n: a.length, mean: mean(a), median: median(a), min: s[0], max: s[s.length - 1], range: s[s.length - 1] - s[0], sd: sd(a), q1, q3 }; };

  const st = { data: [4, 6, 7, 7, 8, 9, 10, 11, 13], prev: null };
  const gAx = B.layer("ax"), gFig = B.layer("fig"), gPts = B.layer("pts");
  const Y0 = 0;
  svg("line", { class: "lb-axis", x1: B.px(-0.5), y1: B.py(Y0), x2: B.px(20.5), y2: B.py(Y0) }, gAx);
  for (let x = 0; x <= 20; x++) {
    svg("line", { class: "lb-axis", x1: B.px(x), y1: B.py(Y0) - (x % 5 ? 3 : 6), x2: B.px(x), y2: B.py(Y0) + (x % 5 ? 3 : 6) }, gAx);
    if (x % 2 === 0) svg("text", { class: "sb-tick", x: B.px(x), y: B.py(Y0) + 18, "text-anchor": "middle" }, gAx).textContent = x;
  }
  const stackY = (i) => { const v = st.data[i]; let k = 0; for (let j = 0; j < i; j++) if (st.data[j] === v) k++; return 1 + k * 1.15; };
  let pts = [];
  function mkPts() {
    B.clear("pts");
    pts = st.data.map((_, i) => M.dragPoint(B, gPts, { cls: st.data[i] >= 19 && st.outlier === i ? "c" : "", r: 7, step: 1,
      get: () => [st.data[i], stackY(i)],
      set: (x, y, how, k) => { const v = how === "key" ? st.data[i] + (k[0] || 0) : Math.round(x); st.data[i] = clamp(v, 0, 20); draw(); },
      label: () => `${i + 1}-нүкте, мәні ${st.data[i]}`, keyHelp: "солға/оңға ±1", onEnd: speak }));
  }
  function tri(g, x, cls, up) { const X = B.px(x), Y = B.py(Y0) + (up ? 26 : 0); svg("polygon", { class: "sm-mark " + cls, points: `${X},${Y - 8} ${X - 7},${Y + 4} ${X + 7},${Y + 4}` }, g); }
  function draw() {
    const g = B.clear("fig"), S = stats(st.data);
    // ±1 стандартты ауытқу белдеуі
    svg("rect", { class: "sm-box", x: B.px(clamp(S.mean - S.sd, -0.5, 20.5)), y: B.py(6.6), width: Math.max(0, B.px(clamp(S.mean + S.sd, -0.5, 20.5)) - B.px(clamp(S.mean - S.sd, -0.5, 20.5))), height: 6, opacity: 0.9 }, g);
    svg("text", { class: "sm-t m", x: B.px(clamp(S.mean, 2, 18)), y: B.py(6.6) - 4, "text-anchor": "middle" }, g).textContent = "орташа ± 1 ст. ауытқу";
    tri(g, S.mean, "g", true); tri(g, S.median, "", false);
    const tm = svg("text", { class: "sm-t g", x: B.px(S.mean), y: B.py(Y0) + 44, "text-anchor": "middle" }, g); tm.textContent = "орташа " + r2(S.mean);
    // бокс-диаграмма
    const yb = -4.6, hb = 1.6, [y1, y2] = [B.py(yb + hb / 2), B.py(yb - hb / 2)], ym = B.py(yb);
    svg("line", { class: "sm-line", x1: B.px(S.min), y1: ym, x2: B.px(S.q1), y2: ym }, g);
    svg("line", { class: "sm-line", x1: B.px(S.q3), y1: ym, x2: B.px(S.max), y2: ym }, g);
    for (const v of [S.min, S.max]) svg("line", { class: "sm-line", x1: B.px(v), y1: y1 + 6, x2: B.px(v), y2: y2 - 6 }, g);
    svg("rect", { class: "sm-box", x: B.px(S.q1), y: y1, width: Math.max(1, B.px(S.q3) - B.px(S.q1)), height: y2 - y1 }, g);
    svg("line", { class: "sm-mint", x1: B.px(S.median), y1, x2: B.px(S.median), y2 }, g);
    svg("text", { class: "sb-tick", x: B.px(-0.6), y: B.py(-6.2), "text-anchor": "start" }, g).textContent = "бокс-диаграмма: min · Q1 · медиана · Q3 · max";
    pts.forEach((p) => p.update());
    const ul = $("st-read"); ul.innerHTML = "";
    const pr = st.prev;
    const delta = (k) => (pr && Math.abs(pr[k] - S[k]) > 1e-9 ? ` (${S[k] > pr[k] ? "+" : "−"}${r2(Math.abs(S[k] - pr[k]))})` : "");
    [["орташа (mean)", r2(S.mean) + delta("mean"), true], ["медиана", r2(S.median) + delta("median"), true], ["құлаш (range)", r2(S.range) + delta("range")], ["ст. ауытқу (SD)", r2(S.sd) + delta("sd")], ["Q1 · Q3", `${r2(S.q1)} · ${r2(S.q3)}`], ["n", String(S.n)]]
      .forEach(([k, v, hot]) => { const li = document.createElement("li"); if (hot) li.className = "hot"; li.append(k); const b = document.createElement("b"); b.textContent = v; li.append(b); ul.append(li); });
    $("st-svg-t").textContent = `Нүктелі диаграмма: ${sorted(st.data).join(", ")}. Орташа ${r2(S.mean)}, медиана ${r2(S.median)}, құлаш ${S.range}, стандартты ауытқу ${r2(S.sd)}.`;
  }
  function speak() { const S = stats(st.data); $("st-live").textContent = `Деректер: ${sorted(st.data).join(", ")}. Орташа ${r2(S.mean)}, медиана ${r2(S.median)}, ст. ауытқу ${r2(S.sd)}.`; }
  const setData = (d, why) => { st.prev = stats(st.data); st.data = d.slice(); st.outlier = null; mkPts(); draw(); speak(); if (why) $("st-live").textContent += " " + why; };

  /* ---------- басқару батырмалары ---------- */
  $("st-out").addEventListener("click", () => {
    if (st.data.length >= 10) { setData(st.data.filter((_, i) => i !== st.outlier).slice(0, 9), "Шеткі мән алынды: орташа қайтып оралды, медиана іс жүзінде өзгермеді."); $("st-out").textContent = "Шеткі мән қосу (20)"; return; }
    st.prev = stats(st.data); st.data.push(20); st.outlier = st.data.length - 1; mkPts(); draw();
    const S = stats(st.data); $("st-live").textContent = `20 қосылды. Орташа ${r2(st.prev.mean)} → ${r2(S.mean)}, медиана ${r2(st.prev.median)} → ${r2(S.median)}: шеткі мән орташаны өзіне тартады, медиананы аз жылжытады.`;
    $("st-out").textContent = "Шеткі мәнді алу";
  });
  $("st-pack").addEventListener("click", () => setData([8, 9, 9, 10, 10, 10, 11, 11, 12], "Мәндер ортаға жиналды - стандартты ауытқу кішірейді (таралу аз)."));
  $("st-spread").addEventListener("click", () => setData([1, 3, 5, 8, 10, 12, 15, 17, 19], "Мәндер шашыраңқы - стандартты ауытқу үлкейді. Орташа шамамен бірдей қалуы мүмкін!"));
  $("st-reset").addEventListener("click", () => { $("st-out").textContent = "Шеткі мән қосу (20)"; setData([4, 6, 7, 7, 8, 9, 10, 11, 13], "Бастапқы деректер."); });

  /* ---------- болжам ---------- */
  const ctl = () => document.querySelectorAll("#st-ctl button");
  const lock = (on) => { ctl().forEach((b) => (b.disabled = on)); gPts.style.display = on ? "none" : ""; $("st-lock").hidden = !on; };
  M.predict($("st-predict"), {
    q: "Ең үлкен мән 13-ті 20-ға жылжытсақ, қайсысы көбірек өзгереді?",
    opts: [
      { id: "mean", t: "Орташа", ok: true, why: "Орташа барлық мәннің қосындысына тәуелді: қосынды 7-ге өседі, орташа 7/9 ≈ 0.78-ге өседі. Медиана - ортадағы (5-ші) мән, ол 8 болып қалады. Енді 13 → 20 жасалды - тақтадан көр." },
      { id: "median", t: "Медиана", why: "Медиана тек ортадағы мәнге қарайды. Ең үлкен мән қаншалық үлкейсе де, ортадағы (5-ші) мән 8 болып қалады. Ал орташа өседі - тақтадан көр." },
      { id: "both", t: "Екеуі бірдей", why: "Орташа өседі (қосынды 7-ге артты), бірақ медиана өзгермейді: реттелген тізімнің ортасы сол күйі 8." },
      { id: "none", t: "Ешқайсысы", why: "Медиана шынымен өзгермейді, бірақ орташа өзгереді: қосынды 75-тен 82-ге өсті, 82/9 ≈ 9.11." },
    ],
    onDone: () => { lock(false); const i = st.data.indexOf(13); st.prev = stats(st.data); st.data[i] = 20; draw(); speak(); window.SAT.focus(pts[i].el); },
  });
  mkPts(); draw(); lock(true);

  /* ---------- 1-тапсырма: деректерді құрастыру ---------- */
  T.badge($("st-badge"), SKILL, TITLE);
  M.task({
    el: $("t1"), skill: SKILL, title: TITLE, once: true,
    gen: () => ({ item: "build mean10 median8", text: "Нүктелерді жылжытып (9 нүкте), орташасы 10, медианасы 8 болатын деректер жина. Сосын «Тексеру» бас.", fields: [],
      check: () => {
        const d = st.data, S = stats(d), errs = [], codes = [];
        if (d.length !== 9) { errs.push(`Нүкте саны ${d.length}, ал 9 керек - шеткі мәнді алып таста.`); codes.push("n"); }
        if (S.median !== 8) { errs.push(`Медиана ${r2(S.median)}: реттелген тізімнің 5-ші мәні 8 болуы керек. ${S.median > 8 ? "Ортадағы нүктелерден бірнешеуін солға жылжыт" : "Ортадағы нүктелерді оңға жылжыт"}.`); codes.push("median"); }
        if (Math.abs(S.mean - 10) > 1e-9) { const need = 90 - d.reduce((s, v) => s + v, 0); errs.push(`Орташа ${r2(S.mean)}: қосынды 9·10 = 90 болуы керек, қазір ${d.reduce((s, v) => s + v, 0)}. ${need > 0 ? `Медианадан ОҢДАҒЫ нүктелерді барлығы ${need} бірлікке оңға жылжыт` : `Барлығы ${-need} бірлікке солға жылжыт`} - сонда медиана өзгермейді.`); codes.push("mean"); }
        return errs.length ? { code: codes.join(","), why: errs.join(" ") } : { ok: true, why: `Деректер: ${sorted(d).join(", ")}. Медиана 8, орташа 90/9 = 10. Орташа медианадан үлкен - оң жақта алыс мәндер бар (оңға қисайған таралу).` };
      },
      hints: ["Екі шартты бөлек ойла: медиана - тек 5-ші (ортадағы) мән; орташа - қосынды/9. Қосынды қанша болуы керек?", "Ұқсас мысал: 5 нүкте, медиана 4, орташа 6 → қосынды 30: 2, 3, 4, 9, 12. Ортадағы 4-ке тимей, оң жақтағы мәндерді үлкейттік.", "Шешім: қосынды 90 керек, 5-ші мән 8. Мысалы: 4, 6, 7, 7, 8, 11, 13, 16, 18 (қосынды 90)."] }),
  });

  /* ---------- іріктеме мен қателік шегі (сапалық сұрақтар) ---------- */
  const MCQ = [
    { id: "moe1", q: "A random sample of 500 students at a school found that 62% walk to school, with a margin of error of 4%. Which conclusion is most appropriate?",
      o: [["Between 58% and 66% of all students at the school plausibly walk to school.", 1, "Дұрыс: 62% ± 4% - бүкіл мектептегі шын үлестің ақылға қонымды аралығы."], ["Exactly 62% of all students at the school walk to school.", 0, "Іріктеме - бағалау ғана, дәл мән емес. Сол үшін қателік шегі беріледі."], ["Between 58% and 66% of the 500 sampled students walk to school.", 0, "500 оқушының үлесі белгілі - дәл 62%. Аралық іріктеме туралы емес, бас жиынтық (бүкіл мектеп) туралы."], ["62% of students in every school in the country walk to school.", 0, "Іріктеме тек осы мектептен алынды - басқа мектептерге жалпылауға болмайды."]] },
    { id: "moe2", q: "A researcher repeats the survey with a random sample of 2,000 students instead of 500. Assuming the same method, how will the margin of error most likely change?",
      o: [["It will decrease.", 1, "Дұрыс: іріктеме үлкейген сайын бағалау дәлірек, қателік шегі кішірейеді."], ["It will increase.", 0, "Керісінше: көп дерек - аз белгісіздік."], ["It will stay the same.", 0, "Қателік шегі іріктеме көлеміне тәуелді: көлем өссе, ол кемиді."], ["It will become zero.", 0, "Нөл тек бүкіл бас жиынтықты сұрағанда (санақ) болар еді; 2,000 - әлі де іріктеме."]] },
    { id: "bias", q: "To estimate how many residents of a town read books, a volunteer surveyed 300 people visiting the town library. Why might the results be misleading?",
      o: [["The sample was not selected at random from all residents of the town.", 1, "Дұрыс: кітапханаға келушілер кітапты орташа тұрғыннан көп оқиды - іріктеме ығысқан (biased), кездейсоқ емес."], ["The sample size of 300 is too large.", 0, "Үлкен іріктеме зиян емес. Мәселе - көлемде емес, кімдер таңдалғанында."], ["The library is located in the town.", 0, "Орны маңызды емес; маңыздысы - кітапханаға келушілер барлық тұрғынды өкілдік етпейді."], ["Surveys can never be used to make estimates.", 0, "Кездейсоқ іріктеме арқылы бағалауға болады - тек ол бүкіл бас жиынтықтан алынуы керек."]] },
    { id: "exp", q: "In a study, 80 volunteers were randomly assigned to either drink green tea daily or not. After 8 weeks, the tea group had lower average stress scores. Which conclusion is best supported?",
      o: [["Drinking green tea likely caused lower stress for people similar to these volunteers.", 1, "Дұрыс: кездейсоқ бөлу (random assignment) себеп-салдар туралы қорытынды жасауға мүмкіндік береді, бірақ тек осындай еріктілерге (олар кездейсоқ таңдалмаған)."], ["Drinking green tea lowers stress for all adults in the world.", 0, "Еріктілер бас жиынтықтан кездейсоқ ТАҢДАЛМАҒАН, сондықтан бүкіл адамзатқа жалпылауға болмайды."], ["No conclusion about cause can be made because it was an experiment.", 0, "Керісінше: себеп туралы қорытынды тек кездейсоқ бөлінген тәжірибеде ғана мүмкін; бақылау зерттеуінде - жоқ."], ["Green tea and stress are unrelated.", 0, "Нәтиже байланыс бар екенін көрсетеді (шай тобында стресс төмен)."]] },
  ];
  const box = $("st-mcq");
  MCQ.forEach((it, n) => {
    const order = shuffle([0, 1, 2, 3]);
    const wrap = h("div", { class: "sm-mcq", "data-q": it.id });
    const qid = "st-mq-" + it.id;
    wrap.append(h("p", { class: "sat-q", lang: "en", id: qid }, `${n + 1}. ${it.q}`));
    const g = h("div", { class: "lab-choice", role: "group", "aria-labelledby": qid, lang: "en" });
    const fb = h("div", { "aria-live": "polite" });
    order.forEach((k) => {
      const [t, ok, why] = it.o[k];
      const b = h("button", { type: "button", "data-ok": String(!!ok) }, t);
      b.addEventListener("click", () => {
        g.querySelectorAll("button").forEach((x) => { x.disabled = true; x.classList.toggle("ok", x.dataset.ok === "true"); x.classList.toggle("no", x === b && !ok); x.setAttribute("aria-pressed", String(x === b)); });
        const right = it.o.find((o) => o[1]);
        T.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс." : "Қате.", ok ? why : `${why} Дұрысы: «${right[0]}» - ${right[2].replace(/^Дұрыс: /, "")}`);
        T.record(SKILL, { item: it.id, ok: !!ok, hints: 0, error: ok ? "" : "inference", note: ok ? "" : why, title: TITLE });
      });
      g.append(b);
    });
    wrap.append(g, fb); box.append(wrap);
  });

  /* ---------- 2-тапсырма: меңгеру ---------- */
  const list = (n, a, b) => Array.from({ length: n }, () => rnd(a, b));
  function gen(prev) {
    const kind = pick(["mean", "median", "range", "add", "sd"].filter((k) => !prev || k !== prev.kind));
    if (kind === "mean") {
      let d; do d = list(rnd(5, 6), 2, 20); while (!Number.isInteger(mean(d) * 2));
      const m = mean(d), s = d.reduce((x, y) => x + y, 0);
      return { kind, ans: { x: m }, item: "mean", text: `Деректер: ${d.join(", ")}. Орташа мәні (mean) неге тең?`, fields: [{ key: "x", label: "орташа" }],
        check: ({ x }) => M.near(x, m) ? { ok: true, why: `${s}/${d.length} = ${num(m)}.` } : M.near(x, median(d)) ? { code: "median", why: `${num(median(d))} - медиана. Орташа = қосынды/сан: ${s}/${d.length}.` } : M.near(x, s) ? { code: "sum", why: `${s} - қосынды. Оны мән санына (${d.length}) бөл.` } : M.near(x, s / (d.length - 1)) || M.near(x, s / (d.length + 1)) ? { code: "count", why: `Мән саны ${d.length} - қайта санап шық.` } : { code: "calc", why: `Қосындыны қайта есепте: ${d.join(" + ")} = ${s}.` },
        hints: ["Орташа = барлық мәннің қосындысы / мән саны.", "Ұқсас мысал: 4, 7, 7, 9, 13 → 40/5 = 8.", `Шешім: ${d.join(" + ")} = ${s}; ${s}/${d.length} = ${num(m)}.`] };
    }
    if (kind === "median") {
      const n = pick([6, 7]); let d; do d = list(n, 1, 25); while (new Set(d).size < n || sorted(d)[Math.floor(n / 2)] === d[Math.floor(n / 2)]);
      const md = median(d), s = sorted(d);
      return { kind, ans: { x: md }, item: "median" + n, text: `Деректер: ${d.join(", ")}. Медианасы неге тең?`, fields: [{ key: "x", label: "медиана" }],
        check: ({ x }) => M.near(x, md) ? { ok: true, why: `Реттелген: ${s.join(", ")}. ${n % 2 ? `Ортадағы мән ${num(md)}.` : `Ортадағы екі мән ${s[n / 2 - 1]} және ${s[n / 2]}, орташасы ${num(md)}.`}` } : (n % 2 ? M.near(x, d[(n - 1) / 2]) : M.near(x, (d[n / 2 - 1] + d[n / 2]) / 2)) ? { code: "unsorted", why: "Реттелмеген тізімнің ортасы алынды. Алдымен өсу ретімен орналастыр." } : n % 2 === 0 && (M.near(x, s[n / 2 - 1]) || M.near(x, s[n / 2])) ? { code: "even", why: `Мән саны жұп (${n}), ортада екі мән бар: ${s[n / 2 - 1]} және ${s[n / 2]}. Медиана - олардың орташасы.` } : M.near(x, mean(d)) ? { code: "mean", why: "Бұл - орташа мән. Медиана - реттелген тізімнің ортасы." } : { code: "calc", why: `Реттелген тізім: ${s.join(", ")}.` },
        hints: ["Алдымен мәндерді өсу ретімен орналастыр.", "Ұқсас мысал: 9, 2, 5, 7 → 2, 5, 7, 9 → (5 + 7)/2 = 6.", `Шешім: ${s.join(", ")} → медиана ${num(md)}.`] };
    }
    if (kind === "range") {
      const d = list(7, 3, 30), s = sorted(d), rg = s[6] - s[0];
      return { kind, ans: { x: rg }, item: "range", text: `Деректер: ${d.join(", ")}. Құлашы (range) неге тең?`, fields: [{ key: "x", label: "құлаш" }],
        check: ({ x }) => M.near(x, rg) ? { ok: true, why: `${s[6]} − ${s[0]} = ${rg}.` } : M.near(x, s[6]) ? { code: "max", why: "Бұл - ең үлкен мән. Құлаш = ең үлкен − ең кіші." } : M.near(x, Math.abs(d[6] - d[0])) ? { code: "ends", why: "Тізімнің бірінші және соңғы мәні алынды, бірақ ол реттелмеген." } : { code: "calc", why: `Ең үлкені ${s[6]}, ең кішісі ${s[0]}.` },
        hints: ["Құлаш - деректердің ең үлкен және ең кіші мәнінің айырмасы.", "Ұқсас мысал: 12, 3, 15, 8 → 15 − 3 = 12.", `Шешім: ${s[6]} − ${s[0]} = ${rg}.`] };
    }
    if (kind === "add") {
      const n = 5, m = rnd(6, 12), m2 = m + pick([1, 2, -1]), v = m2 * (n + 1) - m * n;
      return { kind, ans: { x: v }, item: "add-value", text: `${n} санның орташасы ${m}. Алтыншы сан қосылғанда орташа ${m2} болды. Алтыншы сан неге тең?`, fields: [{ key: "x", label: "алтыншы сан" }],
        check: ({ x }) => M.near(x, v) ? { ok: true, why: `Жаңа қосынды 6·${m2} = ${6 * m2}, бұрынғы 5·${m} = ${5 * m}; айырмасы ${v}.` } : M.near(x, m2) ? { code: "new-mean", why: `Қосылған сан жаңа орташаға тең емес: ол бүкіл қосындыны ${6 * m2}-ге жеткізуі керек.` } : M.near(x, 6 * m2) ? { code: "total", why: "Бұл - жаңа қосынды. Одан бұрынғы қосындыны шегер." } : { code: "calc", why: "Орташадан қосындыға өт: қосынды = орташа × сан." },
        hints: ["Орташаны қосындыға айналдыр: қосынды = орташа × мән саны.", "Ұқсас мысал: 5 санның орташасы 6 (қосынды 30), 6 санның орташасы 7 (қосынды 42) → 12.", `Шешім: 6·${m2} − 5·${m} = ${6 * m2} − ${5 * m} = ${v}.`] };
    }
    const c = rnd(8, 12), w = pick([1, 2]), W = w + rnd(3, 5);
    const A = [c - w, c, c, c, c + w], Bs = [c - W, c - 1, c, c + 1, c + W], aBig = Math.random() < 0.5;
    const [X, Y] = aBig ? [Bs, A] : [A, Bs], big = aBig ? "A" : "B";
    return { kind, ans: { x: big }, item: "sd-compare", text: `A жиыны: ${X.join(", ")}. B жиыны: ${Y.join(", ")}. Екеуінің орташасы ${c}. Қай жиынның стандартты ауытқуы үлкен? (A немесе B енгіз)`, fields: [{ key: "x", label: "A / B", raw: true, mode: "text" }],
      check: ({ x }) => { const v = String(x).trim().toUpperCase().replace("А", "A").replace("В", "B"); return v === big ? { ok: true, why: `${big} жиынының мәндері орташадан (${c}) алысырақ шашыраған - стандартты ауытқу үлкен. Есептемей-ақ көруге болады.` } : v === "A" || v === "B" ? { code: "sd", why: "Стандартты ауытқу - мәндердің орташадан ОРТАША қашықтығы. Қай жиында мәндер орташадан алыс?" } : { code: "format", why: "Тек A немесе B әрпін енгіз." }; },
      hints: ["SAT-та стандартты ауытқуды есептеу сирек, салыстыру жиі: мәндер орташа маңына жиналса - аз, шашыраса - көп.", "Ұқсас мысал: 9, 10, 10, 10, 11 және 2, 9, 10, 11, 18 - екіншісінде шеткі мәндер алыс, ст. ауытқуы үлкен.", `Шешім: ${big} жиынының шеткі мәндері ${c}-ден алысырақ. Жауап: ${big}.`] };
  }
  const t2 = M.task({ el: $("t2"), skill: SKILL, title: TITLE, gen });
  window.SAT.stats = { state: () => st, stats, gen, t2, setData };
})();
