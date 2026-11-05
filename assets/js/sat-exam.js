/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* Digital SAT емтихан симуляторы (AO17 жаттығу қозғалтқышы). Learning Mode: әр жауаптан кейін тексеру, көмек, түсіндірме.
   Exam Mode: кері санақ таймері, дұрыстығы тек соңында. Навигатор, Mark for Review, модуль шолуы, модуль ауысуы,
   10 минуттық үзіліс, Math анықтамалық парағы, қарапайым калькулятор. 2-модуль: AO17 ережесі (имитация).
   Нәтиже: домен/дағды бойынша шикі балл (200-800 балл ЕСЕПТЕЛМЕЙДІ). Дағды нәтижелері AO17Tutor.record арқылы жазылады. */
(() => {
  "use strict";
  const B = window.SAT_BANK, T = window.AO17Tutor, { h, shuffle, fr, F } = window.SAT;
  const root = document.getElementById("sx");
  if (!B || !root) return;
  const say = (t) => { const s = document.getElementById("sx-say"); if (s) { s.textContent = ""; setTimeout(() => (s.textContent = t), 30); } };

  /* ---------- құрылым: ресми сандар және қысқа нұсқа ---------- */
  const OFFICIAL = { rw: { name: "Reading and Writing", modules: 2, q: 27, min: 32 }, math: { name: "Math", modules: 2, q: 22, min: 35 }, breakMin: 10 };
  const PER_MODULE = 8, THRESHOLD = 5; // 1-модульде ≥ 5/8 дұрыс → қиынырақ пул (AO17 ережесі)
  const secTime = (s) => Math.round((OFFICIAL[s].min * 60 * PER_MODULE) / OFFICIAL[s].q);
  const mmss = (t) => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  const L = "ABCD";
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const HINT = {
    "Words in Context": "Бос орынның айналасындағы түсіндірмені ізде (қос нүкте, «although», «because»): сөздің мағынасын мәтін өзі айтады.",
    "Text Structure and Purpose": "Әр сөйлемнің қызметін қысқа атап шық (пікір, қарсы дерек, түсіндірме…), сосын ретін салыстыр.",
    "Cross-Text Connections": "Алдымен 1-мәтіннің тұжырымын, сосын 2-мәтіннің дәлелін бір сөйлеммен айт. 2-мәтін 1-мәтінді қолдай ма, жоққа шығара ма?",
    "Central Ideas and Details": "Мәтіннің бәрін қамтитын нұсқаны таңда; тым тар немесе «only», «most» сияқты артық күшті сөзі бар нұсқа - қақпан.",
    "Command of Evidence": "Тұжырымның әр бөлігін тексер: дерек ТҮГЕЛ тұжырымды қолдауы керек, жай ғана дұрыс сан жеткіліксіз.",
    "Inferences": "Мәтіндегі фактілерден ғана шығатын қорытындыны таңда; мәтінге қайшы немесе дәлелі жоқ нұсқаны сыз.",
    "Boundaries": "Бос орынның екі жағы толық сөйлем бе (бастауыш + баяндауыш)? Екеуі толық болса - нүкте не нүктелі үтір; біреуі тізім/түсіндірме болса - қос нүкте не үтір.",
    "Form, Structure, and Sense": "Етістіктің нақты бастауышын тап (үтірлер арасындағы қосымшаны елеме) және жекеше/көпше, шақты тексер.",
    "Transitions": "Екі сөйлемнің қатынасын ата: қарсы қою, себеп-салдар, мысал, қосу, ұқсастық, «қарамастан». Сосын сол қатынасты білдіретін сөзді таңда.",
    "Rhetorical Synthesis": "Тапсырмадағы МАҚСАТТЫ қайта оқы. Дұрыс нұсқа дәл сол мақсатты орындайды - жай ғана дұрыс факт жеткіліксіз.",
  };
  const DOM_HINT = { Algebra: "Белгісізді бір жаққа жинап, екі жаққа бірдей амал қолдан; жауапты бастапқы теңдеуге қойып тексер.", "Advanced Math": "Өрнекті ыңғайлы түрге келтір (жақшаны аш, көбейткіштерге жік, толық квадрат). Сұрақ x-ті ме, f(x)-ті ме сұрап тұр - тексер.", "Problem-Solving and Data Analysis": "Не неге қатысты екенін жаз (бөлім неден тұрады?) және өлшем бірліктерін қадағала.", "Geometry and Trigonometry": "Сызба сал, белгілі шамаларды жаз, анықтамалық парақтағы формуланы таңда." };

  /* ---------- күй ---------- */
  let S = null, timer = null, calcOpen = false, refOpen = false, navOpen = false;
  function prepare(q) {
    if (!q.choices || q.id.startsWith("m")) return { ...q };
    const order = shuffle([0, 1, 2, 3]);
    return { ...q, choices: order.map((k) => q.choices[k]), why: order.map((k) => q.why[k]), ans: order.indexOf(q.ans) };
  }
  function newModule(sec, n, pool) {
    return { sec, n, pool, items: B[sec][pool].map(prepare), ans: {}, mark: {}, checked: {}, hintsUsed: {}, cur: 0, left: secTime(sec), reviewing: false };
  }
  function start(mode) {
    S = { mode, mods: [], phase: "module" };
    S.mods.push(newModule("rw", 1, "m1"));
    renderModule();
    if (mode === "exam") startTimer();
    const t = document.getElementById("sx-title"); if (t) { t.tabIndex = -1; window.SAT.focus(t); }
  }
  const mod = () => S.mods[S.mods.length - 1];

  /* ---------- бағалау ---------- */
  function isRight(q, a) {
    if (a === undefined || a === null || a === "") return false;
    if (q.choices) return a === q.ans;
    const v = fr.parse(a), want = F(q.grid.value[0], q.grid.value[1]);
    if (v && fr.eq(v, want)) return true;
    return q.grid.accept.includes(String(a).trim().replace(/−/g, "-"));
  }
  function gridFormat(a) {
    const s = String(a).trim().replace(/−/g, "-");
    if (!s) return "";
    if (!/^-?(\d+\/\d+|\d*\.?\d*)$/.test(s) || s === "-" || s === ".") return "Тек сан, ондық бөлшек (.75) немесе жай бөлшек (3/4) енгізуге болады.";
    if (s.length > (s.startsWith("-") ? 6 : 5)) return "Оң жауапқа ең көбі 5, теріс жауапқа 6 таңба.";
    if (/\/0+$/.test(s)) return "Бөлім нөл бола алмайды.";
    return "";
  }

  /* ---------- таймер ---------- */
  function tick() {
    const m = mod();
    if (S.phase === "break") {
      S.breakLeft--; const el = document.getElementById("sx-break-t"); if (el) el.textContent = mmss(S.breakLeft);
      if (S.breakLeft <= 0) endBreak();
      return;
    }
    if (S.phase !== "module" || S.mode !== "exam") return;
    m.left--;
    const el = document.getElementById("sx-time");
    if (el) { el.textContent = mmss(m.left); el.classList.toggle("low", m.left <= 60); }
    if (m.left === 60) say("1 минут қалды.");
    if (m.left <= 0) { say("Уақыт бітті. Модуль автоматты түрде тапсырылды."); finishModule(true); }
  }
  const startTimer = () => { stopTimer(); timer = setInterval(tick, 1000); };
  const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };

  /* ---------- экрандар ---------- */
  function intro() {
    stopTimer();
    root.innerHTML = "";
    const tbl = h("table", { class: "sat-table" },
      h("caption", { class: "sat-small", style: "text-align:left;caption-side:top;padding-bottom:6px", text: "Құрылым: ресми Digital SAT және осы қысқа жаттығу нұсқасы" }),
      h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "" }), h("th", { scope: "col", text: "Ресми емтихан" }), h("th", { scope: "col", text: "AO17 қысқа нұсқасы" }))),
      h("tbody", {},
        h("tr", {}, h("th", { scope: "row", text: "Reading and Writing" }), h("td", { text: "2 модуль × 27 сұрақ × 32 мин" }), h("td", { text: `2 модуль × ${PER_MODULE} сұрақ × ${mmss(secTime("rw"))}` })),
        h("tr", {}, h("th", { scope: "row", text: "Үзіліс" }), h("td", { text: "10 мин" }), h("td", { text: "10 мин (ерте аяқтауға болады)" })),
        h("tr", {}, h("th", { scope: "row", text: "Math" }), h("td", { text: "2 модуль × 22 сұрақ × 35 мин" }), h("td", { text: `2 модуль × ${PER_MODULE} сұрақ × ${mmss(secTime("math"))}` })),
        h("tr", {}, h("th", { scope: "row", text: "Барлығы" }), h("td", { text: "98 сұрақ · ≈ 2 сағ 14 мин" }), h("td", { text: `${PER_MODULE * 4} сұрақ · ≈ ${Math.round((secTime("rw") * 2 + secTime("math") * 2) / 60)} мин + үзіліс` }))));
    const modes = h("fieldset", { class: "sx-modes", style: "border:0;padding:0;margin:10px 0" },
      h("legend", { class: "sat-q", text: "Режимді таңда" }),
      h("label", {}, h("input", { type: "radio", name: "sx-mode", value: "learn", checked: "" }), h("b", { text: "Learning Mode - үйрену" }), h("span", { text: "Таймер жоқ. Әр сұрақта үш деңгейлі көмек; жауапты бірден тексеріп, әр нұсқаның түсіндірмесін көресің." })),
      h("label", {}, h("input", { type: "radio", name: "sx-mode", value: "exam" }), h("b", { text: "Exam Mode - емтихан" }), h("span", { text: "Әр модульге кері санақ таймері. Дұрыс-бұрысы соңына дейін көрсетілмейді, көмек жоқ - нақты емтихандағыдай." })));
    root.append(h("div", { class: "sx-top" }, h("h2", { text: "Digital SAT · жаттығу" }), h("span", { class: "sat-small", text: "қысқа жаттығу нұсқасы" })),
      h("div", { class: "sx-body" },
        h("div", { class: "sat-scroll" }, tbl),
        h("p", { class: "lab-note" }, "Толық ұзындықтағы нұсқа (98 сұрақ) үшін AO17-де әлі жеткілікті түпнұсқа сұрақ жазылмаған. Сондықтан қазір әр модульде ", h("b", { text: `${PER_MODULE} сұрақ` }), ", уақыт ресми модуль уақытынан пропорционалды кішірейтілген (сұрақ басына уақыт ресми емтихандағыдай)."),
        h("p", {}, `2-модуль: 1-модульде ${PER_MODULE}-ден кемінде ${THRESHOLD} дұрыс болса - қиынырақ сұрақтар, әйтпесе - жеңілірек сұрақтар. Бұл College Board-тың алгоритмі емес, оның жеңілдетілген имитациясы.`),
        modes,
        h("p", { class: "lab-row" }, h("button", { type: "button", class: "btn gold", id: "sx-start", onclick: () => start(root.querySelector("input[name=sx-mode]:checked").value) }, "Бастау"))));
  }

  function topBar(m) {
    const title = `Section ${m.sec === "rw" ? 1 : 2}: ${OFFICIAL[m.sec].name} · Module ${m.n}`;
    const tools = h("div", { class: "sx-tools" });
    if (S.mode === "exam") {
      const t = h("span", { class: "lab-timer" + (m.left <= 60 ? " low" : ""), id: "sx-time", role: "timer", "aria-label": "Қалған уақыт" }, mmss(m.left));
      const hide = h("button", { type: "button", class: "sx-tool", "aria-pressed": "false", onclick: () => { const on = hide.getAttribute("aria-pressed") !== "true"; hide.setAttribute("aria-pressed", String(on)); t.style.visibility = on ? "hidden" : "visible"; hide.textContent = on ? "Таймерді көрсету" : "Таймерді жасыру"; } }, "Таймерді жасыру");
      tools.append(t, hide);
    } else tools.append(h("span", { class: "sat-small", text: "Learning Mode · таймер жоқ" }));
    if (m.sec === "math") {
      tools.append(h("button", { type: "button", class: "sx-tool", "aria-expanded": String(refOpen), "aria-controls": "sx-ref", onclick: () => { refOpen = !refOpen; renderModule(); } }, "Анықтама"),
        h("button", { type: "button", class: "sx-tool", "aria-expanded": String(calcOpen), "aria-controls": "sx-calc", onclick: () => { calcOpen = !calcOpen; renderModule(); } }, "Калькулятор"));
    }
    return h("div", { class: "sx-top" }, h("h2", { id: "sx-title", text: title }), tools);
  }

  function refSheet() {
    const F = [["Шеңбер", "A = πr², C = 2πr"], ["Тіктөртбұрыш", "A = ℓw"], ["Үшбұрыш", "A = ½bh"], ["Пифагор теоремасы", "c² = a² + b²"], ["Арнайы тікбұрышты үшбұрыштар", "30°-60°-90°: x, x√3, 2x; 45°-45°-90°: s, s, s√2"], ["Тікбұрышты параллелепипед", "V = ℓwh"], ["Цилиндр", "V = πr²h"], ["Шар", "V = (4/3)πr³"], ["Конус", "V = (1/3)πr²h"], ["Пирамида", "V = (1/3)ℓwh"], ["Шеңбердегі доға", "360° = 2π радиан"], ["Үшбұрыш бұрыштары", "қосындысы 180°"]];
    return h("section", { class: "sx-panel", id: "sx-ref", "aria-labelledby": "sx-ref-h" }, h("h3", { id: "sx-ref-h", text: "Анықтамалық парақ (Reference)" }),
      h("ul", { class: "sx-ref" }, F.map(([a, b]) => h("li", {}, h("b", { text: a + ": " }), h("span", { text: b })))),
      h("p", { class: "sat-small", text: "Ресми емтиханда да осындай формулалар парағы беріледі (r - радиус, ℓ - ұзындық, w - ені, h - биіктік, b - табаны)." }));
  }

  /* қарапайым калькулятор: қауіпсіз талдағыш (eval жоқ) */
  function calc(expr) {
    const s = expr.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "p").replace(/√/g, "r").replace(/sqrt/g, "r");
    let i = 0;
    const peek = () => s[i], eat = (c) => (s[i] === c ? (i++, true) : false);
    function num() {
      if (eat("(")) { const v = add(); if (!eat(")")) throw 0; return v; }
      if (eat("p")) return Math.PI;
      if (eat("r")) { const v = unary(); if (v < 0) throw 0; return Math.sqrt(v); }
      const m = s.slice(i).match(/^\d*\.?\d+(e[+-]?\d+)?/); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]);
    }
    function pow() { const b = num(); return eat("^") ? b ** unary() : b; }
    function unary() { if (eat("-")) return -unary(); if (eat("+")) return unary(); return pow(); }
    function mul() { let v = unary(); for (;;) { if (eat("*")) v *= unary(); else if (eat("/")) v /= unary(); else if (peek() === "(" || peek() === "p" || peek() === "r") v *= unary(); else return v; } }
    function add() { let v = mul(); for (;;) { if (eat("+")) v += mul(); else if (eat("-")) v -= mul(); else return v; } }
    const v = add(); if (i !== s.length || !Number.isFinite(v)) throw 0;
    return Math.round(v * 1e10) / 1e10;
  }
  window.SAT.calc = calc;
  function calcPanel() {
    const inp = h("input", { type: "text", id: "sx-cin", "aria-label": "Калькулятор өрнегі", autocomplete: "off", placeholder: "мыс. (175-95)/4" });
    const out = h("output", { id: "sx-cout", for: "sx-cin", "aria-live": "polite" }, " ");
    const run = () => { try { out.textContent = inp.value.trim() ? String(calc(inp.value)).replace("-", "−") : " "; } catch (e) { out.textContent = "Өрнек қате"; } };
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(); } });
    const keys = ["7", "8", "9", "÷", "(", "4", "5", "6", "×", ")", "1", "2", "3", "−", "^", "0", ".", "π", "+", "√", "C", "⌫", "=",];
    const pad = h("div", { class: "sx-keys" }, keys.map((k) => h("button", { type: "button", "aria-label": k === "⌫" ? "Өшіру" : k === "C" ? "Тазалау" : k, onclick: () => { if (k === "=") run(); else if (k === "C") { inp.value = ""; out.textContent = " "; } else if (k === "⌫") inp.value = inp.value.slice(0, -1); else inp.value += k; inp.focus(); } }, k)));
    return h("section", { class: "sx-panel sx-calc", id: "sx-calc", "aria-labelledby": "sx-calc-h" }, h("h3", { id: "sx-calc-h", text: "Калькулятор" }), out, inp, pad,
      h("p", { class: "sat-small", text: "Қарапайым есептеуіш (+ − × ÷, ^, √, π). Нақты емтиханда Bluebook-та Desmos графиктік калькуляторы кіріктірілген; рұқсат етілген өз калькуляторыңды да алып баруға болады." }));
  }

  function renderModule() {
    const m = mod();
    if (m.reviewing) return renderReview();
    const q = m.items[m.cur], k = m.cur, a = m.ans[k], checked = m.checked[k];
    root.innerHTML = "";
    root.append(topBar(m));
    if (m.sec === "math" && refOpen) root.append(h("div", { class: "sx-body", style: "padding-bottom:0" }, refSheet()));
    if (m.sec === "math" && calcOpen) root.append(h("div", { class: "sx-body", style: "padding-bottom:0" }, calcPanel()));
    const body = h("div", { class: "sx-body" });
    const split = h("div", { class: "sx-split" + (q.passage ? "" : " one") });
    if (q.passage) {
      const pass = h("div", { class: "sx-pass", lang: "en" }, q.passage.map((p) => h("p", { text: p })));
      if (q.table) pass.append(h("div", { class: "sat-scroll" }, h("table", { class: "sat-table" }, h("caption", { text: q.table.caption }), h("thead", {}, h("tr", {}, q.table.head.map((c) => h("th", { scope: "col", text: c })))), h("tbody", {}, q.table.rows.map((r) => h("tr", {}, r.map((c, j) => (j ? h("td", { class: "n", text: c }) : h("th", { scope: "row", text: c })))))))));
      split.append(pass);
    }
    const right = h("div", {});
    const markBtn = h("button", { type: "button", class: "sx-tool sx-mark", "aria-pressed": String(!!m.mark[k]), onclick: () => { m.mark[k] = !m.mark[k]; renderModule(); } }, m.mark[k] ? "⚑ Белгіленді" : "⚐ Mark for Review");
    right.append(h("div", { class: "sx-qhead" }, h("span", { class: "sx-qnum", id: "sx-qn", tabindex: "-1" }, String(k + 1)), h("span", { class: "sat-small", text: S.mode === "learn" ? `${q.domain} · ${q.skill}` : "" }), markBtn));
    right.append(h("p", { class: "sx-stem", lang: "en", id: "sx-stem", text: q.stem }));
    const lock = S.mode === "learn" && checked;
    if (q.choices) {
      const box = h("div", { class: "sat-opts", role: "group", "aria-labelledby": "sx-stem", lang: "en" });
      q.choices.forEach((c, j) => {
        const b = h("button", { type: "button", "aria-pressed": String(a === j), "aria-label": `${L[j]}. ${c}` }, h("i", { "aria-hidden": "true", text: L[j] }), h("span", { text: c }));
        if (lock) { b.disabled = true; if (j === q.ans) b.classList.add("ok"); else if (j === a) b.classList.add("no"); }
        b.addEventListener("click", () => { m.ans[k] = j; renderModule(); window.SAT.focus(root.querySelectorAll(".sat-opts button")[j]); });
        box.append(b);
      });
      right.append(box);
    } else {
      const inp = h("input", { type: "text", id: "sx-grid", maxlength: "6", inputmode: "text", autocomplete: "off", spellcheck: "false", value: a || "" });
      if (lock) inp.disabled = true;
      const err = h("p", { class: "sat-small", id: "sx-gerr", "aria-live": "polite", text: a ? gridFormat(a) || `Жауап алдын ала көрінісі: ${a}` : "" });
      inp.addEventListener("input", () => { m.ans[k] = inp.value.trim(); err.textContent = m.ans[k] ? gridFormat(m.ans[k]) || `Жауап алдын ала көрінісі: ${m.ans[k]}` : ""; });
      right.append(h("div", { class: "sx-grid" }, h("label", { for: "sx-grid", class: "sat-small", text: "Жауабыңды енгіз (мыс. 3/4, .75, −2)" }), inp, err),
        h("p", { class: "sat-small", text: "Бөлшекті де, ондық бөлшекті де енгізуге болады: 3/4 = .75 = 0.75. Ұзын ондық бөлшекті орынға толтыра кес не дөңгелекте (2/3 → .6666, .6667, 0.666, 0.667)." }));
    }
    if (S.mode === "learn") {
      const fb = h("div", { id: "sx-fb", "aria-live": "polite" });
      const hintBox = h("div", { id: "sx-hint" });
      const checkBtn = h("button", { type: "button", class: "btn", id: "sx-check", onclick: () => learnCheck(q, k, fb) }, "Жауапты тексеру");
      if (checked) checkBtn.disabled = true;
      right.append(h("div", { class: "lab-row" }, checkBtn), fb, hintBox);
      if (!checked) {
        const sol = q.choices ? `Шешім: дұрыс жауап ${L[q.ans]}. ${q.why[q.ans]}` : `Шешім: ${q.explain}`;
        const hs = T.hints(hintBox, [HINT[q.skill] || DOM_HINT[q.domain] || "Сұрақты қайта оқып, не сұралып тұрғанын бір сөзбен айт.", q.sec === "rw" || q.passage ? "Ұқсас тәсіл: әр нұсқаны мәтінмен салыстырып, мәтін дәлелдемейтінін бірінен соң бірін сыз - соңында біреуі қалады." : (DOM_HINT[q.domain] || ""), sol]);
        const hb = hintBox.querySelector("button");
        for (let x = 0; x < (m.hintsUsed[k] || 0); x++) hb.click();
        hintBox.addEventListener("click", () => (m.hintsUsed[k] = hs.used()));
      } else showLearnFb(q, k, fb);
    }
    split.append(right);
    body.append(split);
    root.append(body);
    // төменгі жолақ: навигатор, артқа, келесі
    const bottom = h("div", { class: "sx-bottom" });
    const navBtn = h("button", { type: "button", class: "sx-tool", "aria-expanded": String(navOpen), "aria-controls": "sx-nav", onclick: () => { navOpen = !navOpen; renderModule(); } }, `Сұрақ ${k + 1} / ${m.items.length} ▾`);
    const back = h("button", { type: "button", class: "btn secondary", onclick: () => go(k - 1) }, "Артқа");
    if (k === 0) back.disabled = true;
    const next = h("button", { type: "button", class: "btn", id: "sx-next", onclick: () => (k === m.items.length - 1 ? openReview() : go(k + 1)) }, k === m.items.length - 1 ? "Шолу беті" : "Келесі");
    bottom.append(navBtn, h("span", { class: "lab-row", style: "margin:0" }, back, next));
    root.append(bottom);
    if (navOpen) root.append(h("div", { class: "sx-body", id: "sx-nav", style: "padding-top:0" }, navGrid(m, false), h("button", { type: "button", class: "btn secondary", onclick: openReview }, "Шолу бетіне өту")));
  }

  function navGrid(m, final) {
    const grid = h("div", { class: "sx-navs", role: "group", "aria-label": "Сұрақтар навигаторы" });
    m.items.forEach((q, j) => {
      const answered = m.ans[j] !== undefined && m.ans[j] !== "";
      let cls = (answered ? "ans" : "") + (m.mark[j] ? " mk" : "") + (!final && j === m.cur && !m.reviewing ? " cur" : "");
      if (final || (S.mode === "learn" && m.checked[j])) cls += isRight(q, m.ans[j]) ? " ok" : " no";
      const lbl = `${j + 1}-сұрақ: ${answered ? "жауап берілді" : "жауапсыз"}${m.mark[j] ? ", қарауға белгіленген" : ""}${final ? (isRight(q, m.ans[j]) ? ", дұрыс" : ", қате") : ""}`;
      grid.append(h("button", { type: "button", class: cls.trim(), "aria-label": lbl, "aria-current": !final && j === m.cur ? "true" : "false", onclick: () => { if (final) { const el = document.getElementById("rv-" + m.sec + m.n + "-" + j); if (el) el.scrollIntoView({ behavior: "instant" }); return; } m.reviewing = false; navOpen = false; go(j); } }, String(j + 1)));
    });
    return h("div", {}, grid, h("p", { class: "sx-legend" }, h("span", { text: "▭ үзік - жауапсыз" }), h("span", { text: "▬ тұтас - жауап берілді" }), h("span", { text: "⚑ - қарауға белгіленген" }), final || S.mode === "learn" ? h("span", { text: "жасыл/қызыл сызық - дұрыс/қате" }) : null));
  }

  function go(j) {
    const m = mod();
    if (j < 0 || j >= m.items.length) return;
    m.cur = j; renderModule();
    const n = document.getElementById("sx-qn"); window.SAT.focus(n);
  }
  function openReview() { const m = mod(); m.reviewing = true; navOpen = false; renderModule(); }
  function renderReview() {
    const m = mod();
    root.innerHTML = "";
    root.append(topBar(m));
    const un = m.items.filter((_, j) => m.ans[j] === undefined || m.ans[j] === "").length, mk = m.items.filter((_, j) => m.mark[j]).length;
    root.append(h("div", { class: "sx-body" },
      h("h3", { id: "sx-rev-h", tabindex: "-1", text: "Жұмысыңды тексер (Check Your Work)" }),
      h("p", {}, `Жауапсыз: ${un} · қарауға белгіленген: ${mk}. Сұрақ нөмірін басып, оған қайта оралуға болады. Модульді тапсырған соң оған қайту мүмкін емес.`),
      navGrid(m, false),
      h("p", { class: "lab-row" }, h("button", { type: "button", class: "btn secondary", onclick: () => { m.reviewing = false; go(m.items.length - 1); } }, "Соңғы сұраққа оралу"),
        h("button", { type: "button", class: "btn gold", id: "sx-submit", onclick: () => finishModule(false) }, "Модульді тапсыру"))));
    window.SAT.focus(document.getElementById("sx-rev-h"));
  }

  function learnCheck(q, k, fb) {
    const m = mod(), a = m.ans[k];
    if (a === undefined || a === "") return T.feedback(fb, "info", "Алдымен жауап бер.", q.choices ? "Нұсқалардың бірін таңда." : "Жауапты өріске енгіз.");
    if (!q.choices && gridFormat(a)) return T.feedback(fb, "info", "Жауаптың пішімі дұрыс емес.", gridFormat(a));
    m.checked[k] = true;
    recordQ(q, a, m.hintsUsed[k] || 0);
    renderModule();
    const f = document.getElementById("sx-fb"); if (f) f.scrollIntoView({ block: "nearest", behavior: "instant" });
  }
  function showLearnFb(q, k, fb) {
    const m = mod(), a = m.ans[k], ok = isRight(q, a);
    if (q.choices) T.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс: ${L[q.ans]}.` : `Қате: сен ${L[a]} таңдадың, дұрысы - ${L[q.ans]}.`, ok ? q.why[q.ans] : `${L[a]}: ${q.why[a]} ${L[q.ans]}: ${q.why[q.ans]}`);
    else T.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс: ${a}.` : `Қате: сенің жауабың ${a}, дұрысы - ${fr.str(F(...q.grid.value))}.`, q.explain);
  }
  function recordQ(q, a, hints) {
    const ok = isRight(q, a), sec = q.id.startsWith("m") ? "math" : "rw";
    let note = "";
    if (!ok) note = q.choices ? (a === undefined ? "жауапсыз" : q.why[a]) : q.explain;
    T.record(`sat.${sec}.${slug(q.skill)}`, { item: q.id, ok, hints, error: ok ? "" : a === undefined || a === "" ? "blank" : q.choices ? "choice-" + L[a] : "grid", note, title: `SAT: ${q.skill}` });
  }

  function finishModule(timeout) {
    stopTimer();
    const m = mod();
    m.done = true; m.reviewing = false; calcOpen = false; refOpen = false; navOpen = false;
    if (S.mode === "exam") m.items.forEach((q, j) => recordQ(q, m.ans[j], 0));
    else m.items.forEach((q, j) => { if (!m.checked[j]) recordQ(q, m.ans[j], m.hintsUsed[j] || 0); });
    const correct = m.items.filter((q, j) => isRight(q, m.ans[j])).length;
    if (m.n === 1) {
      const pool = correct >= THRESHOLD ? "hard" : "easy";
      S.mods.push(newModule(m.sec, 2, pool));
      transition(m, correct, pool, timeout);
    } else if (m.sec === "rw") breakScreen(timeout);
    else results();
  }
  function transition(m, correct, pool, timeout) {
    root.innerHTML = "";
    const learn = S.mode === "learn";
    root.append(h("div", { class: "sx-center" },
      h("h3", { id: "sx-tr-h", tabindex: "-1", text: `${OFFICIAL[m.sec].name}: 1-модуль аяқталды` }),
      timeout ? h("p", { text: "Уақыт бітті - модуль автоматты түрде тапсырылды." }) : null,
      learn ? h("p", {}, `1-модульде ${PER_MODULE}-ден ${correct} дұрыс. AO17 ережесі (≥ ${THRESHOLD}) бойынша 2-модуль - `, h("b", { text: pool === "hard" ? "қиынырақ сұрақтар" : "жеңілірек сұрақтар" }), ".")
        : h("p", { text: "2-модуль 1-модульдегі нәтижеге қарай таңдалды. Нақты емтихандағыдай, қай деңгей екені соңында ғана көрсетіледі." }),
      h("p", { class: "lab-honest", style: "max-width:60ch;margin:10px auto", text: "Бұл - бейімделудің оқу имитациясы: College Board-тың нақты алгоритмі мен шекті мәндері жария емес және мұнда қолданылмайды." }),
      h("button", { type: "button", class: "btn gold", id: "sx-go", onclick: () => { S.phase = "module"; renderModule(); if (S.mode === "exam") startTimer(); } }, "2-модульді бастау")));
    window.SAT.focus(document.getElementById("sx-tr-h"));
  }
  function breakScreen(timeout) {
    S.phase = "break"; S.breakLeft = OFFICIAL.breakMin * 60;
    root.innerHTML = "";
    root.append(h("div", { class: "sx-center" },
      h("h3", { id: "sx-br-h", tabindex: "-1", text: "Үзіліс" }),
      timeout ? h("p", { text: "Reading and Writing 2-модулінің уақыты бітті - модуль тапсырылды." }) : null,
      h("p", { text: "Reading and Writing бөлімі аяқталды. Нақты емтиханда бөлімдер арасында 10 минуттық үзіліс болады: су іш, тұрып жүр, көзіңді демалдыр." }),
      h("span", { class: "lab-timer", id: "sx-break-t", role: "timer", "aria-label": "Үзілістің қалған уақыты" }, mmss(S.breakLeft)),
      h("p", {}, h("button", { type: "button", class: "btn gold", id: "sx-endbreak", onclick: endBreak }, "Үзілісті аяқтап, Math бөлімін бастау"))));
    window.SAT.focus(document.getElementById("sx-br-h"));
    startTimer();
  }
  function endBreak() {
    stopTimer();
    S.phase = "module";
    S.mods.push(newModule("math", 1, "m1"));
    renderModule();
    if (S.mode === "exam") startTimer();
    const t = document.getElementById("sx-title"); if (t) { t.tabIndex = -1; window.SAT.focus(t); }
  }

  function results() {
    stopTimer();
    S.phase = "results";
    root.innerHTML = "";
    const body = h("div", { class: "sx-body" });
    body.append(h("h3", { id: "sx-res-h", tabindex: "-1", text: "Нәтиже: домендер бойынша шикі балл" }),
      h("p", { class: "lab-honest", text: "Бұл - AO17 жаттығу нұсқасының дұрыс жауап саны ғана. 200-800 шкаласындағы балл есептелмейді: ресми шкала мен бейімделу ережелері басқа, ал мұнда сұрақ саны әлдеқайда аз." }));
    for (const sec of ["rw", "math"]) {
      const mods = S.mods.filter((m) => m.sec === sec);
      const dom = {};
      let c = 0, n = 0;
      mods.forEach((m) => m.items.forEach((q, j) => { const d = dom[q.domain] || (dom[q.domain] = { c: 0, n: 0, skills: {} }); const ok = isRight(q, m.ans[j]); d.n++; n++; if (ok) { d.c++; c++; } const s = d.skills[q.skill] || (d.skills[q.skill] = { c: 0, n: 0 }); s.n++; if (ok) s.c++; }));
      const m2 = mods[1];
      body.append(h("h4", { class: "sat-q", text: `${OFFICIAL[sec].name}: ${c} / ${n} дұрыс` }),
        h("p", { class: "sat-small", text: `2-модуль: ${m2.pool === "hard" ? "қиынырақ" : "жеңілірек"} пул (AO17 ережесі: 1-модульде ≥ ${THRESHOLD}/${PER_MODULE}).` }),
        h("div", { class: "sat-scroll" }, h("table", { class: "sat-table sx-res" },
          h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "Домен / дағды" }), h("th", { scope: "col", text: "Дұрыс" }), h("th", { scope: "col", text: "Үлес" }))),
          h("tbody", {}, Object.entries(dom).flatMap(([d, v]) => [
            h("tr", {}, h("th", { scope: "row", text: d }), h("td", { class: "n", text: `${v.c} / ${v.n}` }), h("td", { class: "bar" }, h("span", { class: "meter", role: "img", "aria-label": `${Math.round((100 * v.c) / v.n)}%` }, h("i", { style: `width:${(100 * v.c) / v.n}%` })))),
            ...Object.entries(v.skills).map(([s, w]) => h("tr", {}, h("td", { class: "sat-small", style: "padding-left:22px", text: s }), h("td", { class: "n sat-small", text: `${w.c} / ${w.n}` }), h("td", {}))),
          ])))));
    }
    body.append(h("h3", { text: "Шолу: әр сұрақтың түсіндірмесі" }));
    const filt = h("p", { class: "lab-choice", role: "group", "aria-label": "Сүзгі" });
    const list = h("ol", { class: "sx-rev" });
    const fill = (only) => {
      list.innerHTML = "";
      S.mods.forEach((m) => m.items.forEach((q, j) => {
        const a = m.ans[j], ok = isRight(q, a);
        if (only === "wrong" && ok) return;
        if (only === "marked" && !m.mark[j]) return;
        const your = a === undefined || a === "" ? "жауапсыз" : q.choices ? `${L[a]}. ${q.choices[a]}` : a;
        const right = q.choices ? `${L[q.ans]}. ${q.choices[q.ans]}` : [fr.str(F(...q.grid.value)), ...q.grid.accept].join(", ") + (q.grid.value[1] !== 1 ? " (немесе тең кез келген жазу)" : "");
        const li = h("li", { class: ok ? "ok" : "no", id: `rv-${m.sec}${m.n}-${j}` },
          h("h4", { text: `${OFFICIAL[m.sec].name} · M${m.n} · ${j + 1}-сұрақ ${ok ? "✓" : "✗"}${m.mark[j] ? " ⚑" : ""}` }),
          h("p", { class: "sat-small", text: `${q.domain} · ${q.skill} · қиындығы: ${q.diff}` }),
          q.passage ? h("p", { lang: "en", class: "sat-small", text: q.passage.join(" ") }) : null,
          h("p", { lang: "en" }, h("b", { text: q.stem })),
          h("p", {}, "Сенің жауабың: ", h("span", { lang: "en", text: your }), " · дұрыс жауап: ", h("span", { lang: "en", text: right })));
        if (q.choices) li.append(h("ul", {}, q.choices.map((c, x) => h("li", { class: x === q.ans ? "c" : "" }, h("b", { lang: "en", text: `${L[x]}. ${c} - ` }), q.why[x]))));
        else li.append(h("p", { text: q.explain }));
        list.append(li);
      }));
      if (!list.children.length) list.append(h("li", { text: "Бұл сүзгі бойынша сұрақ жоқ." }));
    };
    [["all", "Барлығы"], ["wrong", "Тек қателер"], ["marked", "Тек белгіленгендер"]].forEach(([k, t], x) => {
      const b = h("button", { type: "button", "aria-pressed": String(x === 0), onclick: () => { filt.querySelectorAll("button").forEach((y) => y.setAttribute("aria-pressed", String(y === b))); fill(k); } }, t);
      filt.append(b);
    });
    fill("all");
    body.append(filt, list, h("p", { class: "lab-row" }, h("button", { type: "button", class: "btn gold", onclick: intro }, "Қайтадан бастау"), h("a", { class: "btn secondary", href: "index.html#map" }, "Дағдылар картасы")));
    root.append(h("div", { class: "sx-top" }, h("h2", { text: "Симулятор аяқталды" }), h("span", { class: "sat-small", text: S.mode === "exam" ? "Exam Mode" : "Learning Mode" })), body);
    window.SAT.focus(document.getElementById("sx-res-h"));
  }

  intro();
  window.SAT.exam = { isRight, gridFormat, secTime, state: () => S };
})();
