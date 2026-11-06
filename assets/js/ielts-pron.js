/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Pronunciation Lab: минималды жұптар (тыңдап таңдау, speechSynthesis), сөз екпіні (буын блоктары), сөйлем екпіні
   және әлсіз формалар, сұрақ интонациясы (сызба), байланыстырып сөйлеу; айтып көру - SpeechRecognition болса ғана
   (шамамен браузер тануы, бағалау емес), әйтпесе MediaRecorder арқылы жазып, үлгімен салыстыру. Жазба ешқайда жіберілмейді,
   тек осы беттің жадында тұрады. AO17Tutor: ielts.pron.minimal, ielts.pron.wordstress, ielts.pron.sentstress,
   ielts.pron.intonation, ielts.pron.connected. */
(() => {
  "use strict";
  const D = window.IELTS_PRON, I = window.IELTS;
  if (!D || !I) return;
  const { $, $$, h } = I;
  if (!$("[data-ielts-pron]")) return;
  const TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const CAN_REC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const NS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, ...kids) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); kids.forEach((k) => el.append(k)); return el; };

  /* ---------- Дауыс ---------- */
  let voice = null;
  function pick() { if (!TTS) return; const vs = speechSynthesis.getVoices() || []; voice = vs.find((v) => /^en[-_]GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null; const el = $("#pr-voice"); if (el) el.textContent = voice ? `Дауыс: ${voice.name} (${voice.lang})${/^en[-_]GB/i.test(voice.lang) ? "" : " - en-GB дауысы табылмады"}.` : "Дауыс тізімі әлі жүктелмеді - әдепкі ағылшын дауысы қолданылады."; }
  if (TTS) { pick(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pick); }
  function say(text, rate = 0.9) {
    if (!TTS) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = voice ? voice.lang : "en-GB"; if (voice) u.voice = voice; u.rate = rate; speechSynthesis.speak(u); } catch (e) { /* дыбыссыз жалғасады */ }
  }
  const playBtn = (label, text, rate, extra) => TTS ? h("button", { type: "button", class: "pr-play", "aria-label": extra || `${label}: тыңдау`, onclick: () => say(typeof text === "function" ? text() : text, rate) }, label) : "";
  if (!TTS) $$(".pr-nottsmsg").forEach((x) => { x.hidden = false; });

  /* ---------- Қазақ тілділерге тән қиындықтар ---------- */
  const kz = $("#pr-kz");
  D.kazakh.forEach((c) => kz.append(h("article", { class: "pr-kcard" }, h("h3", null, c.h), h("p", null, c.p))));

  /* ================= 1. Минималды жұптар ================= */
  const C = { cur: D.contrasts[0], round: null };
  const cBox = $("#pr-contrasts"), info = $("#pr-cinfo"), pairsBox = $("#pr-pairs");
  const cBtns = D.contrasts.map((c) => { const b = h("button", { type: "button", "aria-pressed": String(c === C.cur), onclick: () => setContrast(c) }, c.t); cBox.append(b); return b; });
  function lengthViz(c) {
    if (c.viz !== "length") return "";
    const [a, b] = c.pairs[0];
    const svg = sv("svg", { viewBox: "0 0 320 84", role: "img", "aria-label": `Дыбыс ұзақтығы: ${a} - қысқа, ${b} - ұзын` });
    [[a, 70, 18], [b, 170, 56]].forEach(([w, len, y]) => {
      svg.append(sv("text", { x: 8, y: y + 4, class: "pr-vt" }, w));
      svg.append(sv("rect", { x: 80, y: y - 9, width: len, height: 18, rx: 6, class: w === a ? "pr-bar s" : "pr-bar l" }));
    });
    return h("div", { class: "lab-board pr-viz" }, svg, h("p", { class: "pr-vcap" }, "Дауысты дыбыстың шамамен ұзақтығы (схема): ұзын /iː/ қысқа /ɪ/-дан айқын ұзағырақ."));
  }
  function setContrast(c) {
    C.cur = c; cBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(D.contrasts[i] === c)));
    info.textContent = "";
    info.append(h("h3", null, `${c.t} · ${c.name}`), h("p", null, c.kk), h("p", { class: "pr-mouth" }, h("b", null, "Ауыз қалпы: "), c.mouth), lengthViz(c));
    pairsBox.textContent = "";
    c.pairs.forEach(([a, b]) => pairsBox.append(h("li", null,
      ...[a, b].map((w) => h("span", { class: "pr-wg" }, h("span", { class: "pr-w", lang: "en" }, w, " ", h("small", null, c.ipa[w])), playBtn("▶", w, 0.85, `${w}: тыңдау`), playBtn("0.6×", w, 0.6, `${w}: баяу тыңдау`))))));
    fillSpeakWords();
    newDrill();
  }
  // Тыңдап таңдау: 8 айналым
  const dOpts = $("#pr-d-opts"), dFb = $("#pr-d-fb"), dScore = $("#pr-d-score"), dStart = $("#pr-d-start"), dAgain = $("#pr-d-again");
  const N_ROUNDS = 8;
  const dHints = window.AO17Tutor ? AO17Tutor.hints($("#pr-d-hints"), ["", "", ""], { onSolution: () => { if (C.round && C.round.item) { C.round.item.helped = true; dFb.textContent = ""; I.feedback(dFb, "info", `Айтылған сөз: ${C.round.item.target}`, "Шешім ашылды - бұл айналым меңгеруге саналмайды. Тағы бір рет тыңдап, айырманы естуге тырысыңыз, сосын таңдаңыз."); } } }) : null;
  function setDrillHints() {
    if (!dHints || !C.round || !C.round.item) return;
    const c = C.cur, [a, b] = C.round.item.pair;
    dHints.reset([`Тек мағынаға емес, дыбысқа құлақ салыңыз. ${c.mouth}`, `Ұқсас мысал: ${a} ${c.ipa[a]} мен ${b} ${c.ipa[b]} - транскрипцияларын салыстырыңыз да, екеуін баяу (0.6×) тыңдаңыз жоғарыдағы тізімнен.`, `Шешім: айтылған сөз - «${C.round.item.target}».`]);
  }
  function newDrill() {
    C.round = { n: 0, ok: 0, item: null, done: false };
    dOpts.textContent = ""; dFb.className = ""; dFb.textContent = "";
    dScore.textContent = `0 / ${N_ROUNDS}`;
    dStart.hidden = false; dStart.disabled = !TTS; dStart.textContent = "Жаттығуды бастау"; dAgain.hidden = true;
    if (dHints) dHints.reset(["", "", ""]);
    $("#pr-d-hints").hidden = true;
  }
  function nextItem() {
    const R = C.round; if (!R || R.n >= N_ROUNDS) return;
    const pair = C.cur.pairs[Math.floor(Math.random() * C.cur.pairs.length)];
    const target = pair[Math.random() < 0.5 ? 0 : 1];
    R.item = { pair, target, answered: false, helped: false };
    dOpts.textContent = ""; dFb.className = ""; dFb.textContent = "";
    I.shuffle(pair).forEach((w) => dOpts.append(h("button", { type: "button", "data-w": w, lang: "en", onclick: () => answer(w) }, w)));
    dStart.hidden = true; dAgain.hidden = false;
    $("#pr-d-hints").hidden = false; setDrillHints();
    say(target, 0.85);
  }
  function answer(w) {
    const R = C.round, it = R && R.item; if (!it || it.answered) return;
    it.answered = true; R.n++;
    const ok = w === it.target; if (ok && !it.helped) R.ok++;
    $$("button", dOpts).forEach((b) => { b.disabled = true; if (b.dataset.w === it.target) b.classList.add("ok"); if (b.dataset.w === w && !ok) b.classList.add("no"); });
    const c = C.cur, other = it.pair.find((x) => x !== it.target);
    I.record("ielts.pron.minimal", { item: `${c.id}:${it.target}`, ok, hints: it.helped ? 3 : 0, error: ok ? "" : `${c.id}:${w}`, note: ok ? "" : `${it.target} ${c.ipa[it.target]} ≠ ${w} ${c.ipa[w]}`, title: `Айтылым: минималды жұп ${c.t}` });
    I.feedback(dFb, ok ? "ok" : "bad", ok ? `Дұрыс: ${it.target} ${c.ipa[it.target]}` : `Айтылғаны: ${it.target} ${c.ipa[it.target]}, сіз таңдағаны: ${w} ${c.ipa[w]}`,
      ok ? `Жұбы: ${other} ${c.ipa[other]}. ${c.mouth}` : `Айырма: ${c.mouth} Екеуін жоғарыдағы тізімнен баяу тыңдап салыстырыңыз.`);
    dScore.textContent = `${R.ok} / ${N_ROUNDS}`;
    if (R.n >= N_ROUNDS) {
      R.done = true; dAgain.hidden = true;
      const mastered = R.ok >= 7;
      dFb.append(h("p", null, h("b", null, `Айналым аяқталды: ${R.ok} / ${N_ROUNDS}. `), mastered ? "Бұл контрастты жақсы ажыратасыз - келесі контрастқа өтіңіз." : "Тағы бір айналым жасаңыз: сөздер кездейсоқ таңдалады, сондықтан бұл жаңа тапсырма."),
        h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { newDrill(); dStart.click(); } }, "Жаңа айналым"));
    } else dFb.append(h("button", { type: "button", class: "btn secondary ie-sm pr-next", onclick: nextItem }, "Келесі сөз"));
  }
  dStart.addEventListener("click", nextItem);
  dAgain.addEventListener("click", () => { if (C.round && C.round.item) say(C.round.item.target, 0.85); });

  /* ================= 2. Сөз екпіні ================= */
  (function wordStress() {
    const box = $("#pr-ws"); let order = I.shuffle(D.stress), k = 0, cur = null, done = false, streak = 0, helped = false;
    const word = h("p", { class: "pr-wsword", lang: "en" }), syl = h("div", { class: "pr-syl", role: "group", "aria-label": "Буындар: екпінді буынды таңдаңыз" });
    const fb = h("div", { "aria-live": "polite" }), meta = h("p", { class: "lab-meta" });
    const hintsEl = h("div");
    const hints = window.AO17Tutor ? AO17Tutor.hints(hintsEl, ["", "", ""], { onSolution: () => { helped = true; } }) : null;
    function paintW() {
      cur = order[k % order.length]; done = false; helped = false;
      word.textContent = cur.w; syl.textContent = ""; fb.className = ""; fb.textContent = "";
      cur.syl.forEach((s, i) => syl.append(h("button", { type: "button", class: "pr-sb", "data-i": String(i), lang: "en", onclick: () => choose(i) }, s)));
      if (hints) hints.reset(["Қазақ тілінде екпін көбіне соңғы буында - ағылшын тілінде олай емес. Жұрнаққа қараңыз: -tion, -ic, -ity, -eer екпінді белгілі бір орынға қояды.", `Ұқсас мысал: ${cur.s === cur.syl.length - 1 ? "ca-REER, Japa-NESE" : "PHO-to-graph → pho-TO-gra-phy → photo-GRA-phic"}.`, `Шешім: ${cur.syl.map((s, i) => (i === cur.s ? s.toUpperCase() : s)).join("-")} ${cur.ipa}. ${cur.rule}`]);
    }
    function choose(i) {
      if (done) return; done = true;
      const ok = i === cur.s;
      $$(".pr-sb", syl).forEach((b, j) => { b.disabled = true; b.classList.toggle("st", j === cur.s); if (j === i && !ok) b.classList.add("no"); });
      streak = ok && !helped ? streak + 1 : 0;
      I.record("ielts.pron.wordstress", { item: cur.w, ok, hints: helped ? 3 : 0, error: ok ? "" : `syllable-${i + 1}`, note: ok ? "" : `${cur.w}: ${cur.syl[cur.s]}`, title: "Айтылым: сөз екпіні" });
      I.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс: ${cur.syl.map((s, j) => (j === cur.s ? s.toUpperCase() : s)).join("-")} ${cur.ipa}` : `Екпін «${cur.syl[cur.s]}» буынында, «${cur.syl[i]}» емес: ${cur.syl.map((s, j) => (j === cur.s ? s.toUpperCase() : s)).join("-")} ${cur.ipa}`, cur.rule + (!ok && i === cur.syl.length - 1 ? " Соңғы буынды екпінді ету - қазақ тіліндегі екпін әдетінің ауысуы." : ""));
      fb.append(h("div", { class: "lab-row" }, playBtn("▶ Тыңдау", cur.say || cur.w.replace(/ \(.*\)$/, ""), 0.85, "Сөзді тыңдау"), h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { k++; paintW(); } }, "Келесі сөз")));
      meta.textContent = `Көмексіз қатарынан дұрыс: ${streak}${streak >= 5 ? " - сөз екпінін меңгеріп келесіз!" : " (мақсат: 5)"} · ${order.length} сөздің ${Math.min(k + 1, order.length)}-сі`;
    }
    box.append(h("p", { class: "ie-instr" }, "Алдымен тыңдамай болжаңыз: қай буын екпінді? Таңдаған соң дұрыс буын үлкейіп, жауап пен ереже ашылады; сосын тыңдап тексеріңіз."), word, syl, fb, meta, hintsEl, h("span", { id: "pr-badge-ws" }));
    paintW();
  })();

  /* ================= 3. Сөйлем екпіні және әлсіз формалар ================= */
  (function sentStress() {
    const box = $("#pr-ss"); let k = 0;
    const wrap = h("div"), fb = h("div", { "aria-live": "polite" });
    function paintS() {
      const it = D.sentences[k % D.sentences.length]; wrap.textContent = ""; fb.className = ""; fb.textContent = "";
      const words = it.s.split(" ");
      const btns = words.map((w, i) => h("button", { type: "button", class: "pr-wt", "aria-pressed": "false", "data-i": String(i), lang: "en", onclick: (e) => { const b = e.currentTarget; if (b.dataset.locked) return; b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); } }, w));
      const row = h("div", { class: "pr-sent", role: "group", "aria-label": "Сөйлем сөздері: екпінділерін белгілеңіз" }, ...btns);
      const check = h("button", { type: "button", class: "btn gold", id: "pr-ss-check", onclick: () => {
        const sel = btns.map((b, i) => (b.getAttribute("aria-pressed") === "true" ? i : -1)).filter((i) => i >= 0);
        const miss = it.k.filter((i) => !sel.includes(i)), extra = sel.filter((i) => !it.k.includes(i)), ok = !miss.length && !extra.length;
        btns.forEach((b, i) => { b.dataset.locked = "1"; b.classList.toggle("st", it.k.includes(i)); b.classList.toggle("no", extra.includes(i) || miss.includes(i));
          const wk = it.weak[words[i].toLowerCase().replace(/[^a-z']/g, "")]; if (wk && !it.k.includes(i)) b.append(h("small", { class: "pr-weak" }, wk)); });
        const clean = (i) => words[i].replace(/[.,?!]/g, "");
        I.record("ielts.pron.sentstress", { item: "s" + (k % D.sentences.length), ok, error: ok ? "" : extra.length ? "function-word-stressed" : "content-word-missed", note: it.s, title: "Айтылым: сөйлем екпіні" });
        I.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс: мағыналы сөздер екпінді" : "Екпін толық сәйкес емес",
          (miss.length ? `Белгіленбеген мағыналы сөз(дер): ${miss.map(clean).join(", ")} - зат есім, негізгі етістік, сын есім, сұрау сөзі әдетте екпінді. ` : "") +
          (extra.length ? `Артық белгіленген: ${extra.map(clean).join(", ")} - бұл көмекші/функциялық сөз; ол әдетте әлсіз айтылады (астында транскрипциясы). ` : "") +
          "Әлсіз формаларда дауысты көбіне /ə/ болады. Ескерту: ерекше мағына берілсе (контраст), кез келген сөз екпінді болуы мүмкін - бұл бейтарап айтылым.");
        fb.append(h("div", { class: "lab-row" }, playBtn("▶ Қалыпты", it.s, 0.95, "Сөйлемді тыңдау"), playBtn("▶ Баяу", it.s, 0.7, "Сөйлемді баяу тыңдау"), h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { k++; paintS(); } }, "Келесі сөйлем")));
      } }, "Тексеру");
      wrap.append(row, h("div", { class: "lab-row" }, check, playBtn("▶ Алдымен тыңдау", it.s, 0.85, "Сөйлемді тыңдау")));
    }
    box.append(h("p", { class: "ie-instr" }, "Екпінді (анық, ұзағырақ айтылатын) сөздерді басып белгілеңіз, сосын тексеріңіз."), wrap, fb);
    paintS();
  })();

  /* ================= 4. Интонация ================= */
  (function intonation() {
    const box = $("#pr-in"); let k = 0, order = I.shuffle(D.intonation);
    const card = h("div"), fb = h("div", { "aria-live": "polite" });
    function contour(it) {
      const words = it.q.split(" "), W = 320, step = W / words.length;
      const svg = sv("svg", { viewBox: `0 0 ${W + 20} 110`, role: "img", "aria-label": `Интонация сызбасы: соңы ${it.a === "up" ? "көтеріледі" : "түседі"}` });
      const pts = words.map((_, i) => { const x = 10 + step * (i + 0.5); const last = i === words.length - 1; const y = it.a === "up" ? (last ? 22 : i === words.length - 2 ? 62 : 58) : (last ? 92 : i === words.length - 2 ? 34 : 52); return [x, y]; });
      if (it.q.includes(" or ")) { const oi = words.findIndex((w) => w === "or"); if (oi > 0) pts[oi - 1][1] = 26; }
      svg.append(sv("polyline", { points: pts.map((p) => p.join(",")).join(" "), class: "pr-ctr" }));
      words.forEach((w, i) => svg.append(sv("text", { x: pts[i][0], y: 106, "text-anchor": "middle", class: "pr-ctw" }, w)));
      const [lx, ly] = pts[pts.length - 1];
      svg.append(sv("text", { x: lx + 6, y: ly + 4, class: "pr-ctr-a" }, it.a === "up" ? "↗" : "↘"));
      return h("div", { class: "lab-board pr-viz" }, svg);
    }
    function paintI() {
      const it = order[k % order.length]; card.textContent = ""; fb.className = ""; fb.textContent = "";
      const btns = [["up", "↗ Соңы көтеріледі"], ["down", "↘ Соңы түседі"]].map(([v, t]) => h("button", { type: "button", "data-v": v, onclick: () => {
        const ok = v === it.a; btns.forEach((b) => { b.disabled = true; if (b.dataset.v === it.a) b.classList.add("ok"); if (b.dataset.v === v && !ok) b.classList.add("no"); });
        I.record("ielts.pron.intonation", { item: it.q, ok, error: ok ? "" : "tone-" + v, note: it.why, title: "Айтылым: сұрақ интонациясы" });
        I.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс" : `Әдетте соңы ${it.a === "up" ? "көтеріледі ↗" : "түседі ↘"}`, it.why);
        fb.append(contour(it), h("div", { class: "lab-row" }, playBtn("▶ Тыңдау", it.q, 0.9, "Сұрақты тыңдау"), h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { k++; paintI(); } }, "Келесі сұрақ")));
      } }, t));
      card.append(h("p", { class: "ie-qcard", lang: "en" }, it.q), it.ctx ? h("p", { class: "ie-instr" }, "Жағдай: " + it.ctx) : "", h("div", { class: "lab-choice", role: "group", "aria-label": "Сұрақтың соңғы әуені" }, ...btns));
    }
    box.append(card, fb); paintI();
  })();

  /* ================= 5. Байланыстырып сөйлеу ================= */
  (function connected() {
    const box = $("#pr-cs"); let k = 0, order = I.shuffle(D.connected);
    const card = h("div"), fb = h("div", { "aria-live": "polite" });
    function paintC() {
      const it = order[k % order.length]; card.textContent = ""; fb.className = ""; fb.textContent = "";
      const btns = Object.entries(D.connectedTypes).map(([v, t]) => h("button", { type: "button", "data-v": v, onclick: () => {
        const ok = v === it.type; btns.forEach((b) => { b.disabled = true; if (b.dataset.v === it.type) b.classList.add("ok"); if (b.dataset.v === v && !ok) b.classList.add("no"); });
        I.record("ielts.pron.connected", { item: it.ex, ok, error: ok ? "" : v, note: it.why, title: "Айтылым: байланыстырып сөйлеу" });
        I.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс: ${D.connectedTypes[it.type]}` : `Бұл - ${D.connectedTypes[it.type]}`, it.why);
        fb.append(h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { k++; paintC(); } }, "Келесі мысал"));
      } }, t));
      card.append(h("p", { class: "ie-qcard", lang: "en" }, it.ex, h("span", { class: "pr-heard" }, " → естілуі: ", h("i", null, it.heard))),
        h("div", { class: "lab-row" }, playBtn("▶ Қалыпты жылдамдық", it.ex, 1, "Мысалды тыңдау"), playBtn("▶ Баяу", it.ex, 0.6, "Мысалды баяу тыңдау")),
        h("p", { class: "ie-instr" }, "Мұнда қандай құбылыс бар?"), h("div", { class: "lab-choice", role: "group", "aria-label": "Құбылыс түрі" }, ...btns));
    }
    box.append(card, fb); paintC();
  })();

  /* ================= 6. Айтып көру ================= */
  const spSel = $("#pr-sp-word"), spOut = $("#pr-sp-out");
  function fillSpeakWords() {
    if (!spSel) return; const keep = spSel.value; spSel.textContent = "";
    C.cur.pairs.flat().forEach((w) => spSel.append(h("option", { value: w }, `${w} ${C.cur.ipa[w]}`)));
    if ([...spSel.options].some((o) => o.value === keep)) spSel.value = keep;
  }
  const partner = (w) => { for (const p of C.cur.pairs) if (p.includes(w)) return p.find((x) => x !== w); return ""; };
  $("#pr-sp-model").disabled = !TTS;
  $("#pr-sp-model").addEventListener("click", () => say(spSel.value, 0.85));
  // SpeechRecognition (бар болса ғана)
  const srBox = $("#pr-sr"), srBtn = $("#pr-sr-go");
  if (SR) {
    srBox.hidden = false;
    let rec = null;
    srBtn.addEventListener("click", () => {
      if (rec) { try { rec.abort(); } catch (e) { /* */ } rec = null; srBtn.textContent = "🎙 Айтып көру (браузер тануы)"; return; }
      const target = spSel.value, other = partner(target);
      try { rec = new SR(); } catch (e) { I.feedback(spOut, "bad", "Тану іске қосылмады", e.message); return; }
      rec.lang = "en-GB"; rec.interimResults = false; rec.maxAlternatives = 5;
      rec.onresult = (e) => {
        const res = e.results && e.results[0]; const alts = [];
        if (res) for (let i = 0; i < res.length; i++) alts.push(String(res[i].transcript || "").trim().toLowerCase());
        const words = alts.map((a) => a.replace(/[^a-z' ]/g, "").trim());
        const hitT = words.some((a) => a.split(" ").includes(target)), hitO = other && words.some((a) => a.split(" ").includes(other));
        const top = words[0] || "-";
        I.feedback(spOut, hitT && !(hitO && words[0] && words[0].split(" ").includes(other)) ? "ok" : "info",
          hitT ? `Браузер «${target}» деп таныды` : hitO ? `Браузер «${other}» деп естіді` : `Браузер «${top}» деп естіді`,
          `Нұсқалар: ${words.filter(Boolean).join(" / ") || "-"}. ${hitO && !hitT ? `Бұл - жұптағы екінші сөз: ${C.cur.mouth} ` : ""}Ескерту: бұл браузердің шамамен тануы (құрылғыға, шуға, микрофонға тәуелді), айтылымды бағалау емес. Тану сервисін браузер өзі таңдайды: кейбір браузерлер дыбысты өз серверіне жіберуі мүмкін.`);
      };
      rec.onerror = (e) => { I.feedback(spOut, "bad", "Тану сәтсіз аяқталды", e && e.error === "not-allowed" ? "Микрофонға рұқсат берілмеді. Төмендегі жазу арқылы өзіңізді үлгімен салыстыра аласыз." : `Қате: ${(e && e.error) || "белгісіз"}. Тағы бір рет көріңіз немесе жазу тәсілін қолданыңыз.`); };
      rec.onend = () => { rec = null; srBtn.textContent = "🎙 Айтып көру (браузер тануы)"; };
      srBtn.textContent = "■ Тоқтату";
      I.feedback(spOut, "info", `Айтыңыз: «${target}»`, "Микрофонға сөзді бір рет анық айтыңыз.");
      try { rec.start(); } catch (e) { rec = null; I.feedback(spOut, "bad", "Тану іске қосылмады", e.message); }
    });
  }
  // MediaRecorder: жазып, үлгімен салыстыру (тек жадта)
  const recBtn = $("#pr-rec"), recMsg = $("#pr-rec-msg"), recList = $("#pr-rec-list");
  let stream = null, mr = null, chunks = [];
  const urls = [];
  if (!CAN_REC) { recBtn.disabled = true; I.feedback(recMsg, "info", "Бұл браузерде дыбыс жазу мүмкін емес", "MediaRecorder не микрофонға қол жеткізу жоқ. Үлгіні тыңдап, қайталап айтып жаттыға беріңіз."); }
  recBtn.addEventListener("click", async () => {
    if (mr && mr.state === "recording") { mr.stop(); return; }
    try { if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { I.feedback(recMsg, "bad", "Микрофонға рұқсат берілмеді", "Жазусыз да жаттыға аласыз: үлгіні тыңдап, дауыстап қайталаңыз."); return; }
    const word = spSel.value;
    try { mr = new MediaRecorder(stream); } catch (e) { I.feedback(recMsg, "bad", "Жазу басталмады", e.message); return; }
    chunks = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: (mr && mr.mimeType) || "audio/webm" }); mr = null;
      const url = URL.createObjectURL(blob); urls.push(url);
      const li = h("li", null, h("span", null, h("b", { lang: "en" }, word), " - сіздің жазбаңыз"), h("audio", { controls: true, src: url, "aria-label": `${word}: менің жазбам` }),
        h("div", { class: "lab-row" }, TTS ? h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => say(word, 0.85) }, "Үлгіні тыңдау") : "",
          h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { URL.revokeObjectURL(url); li.remove(); } }, "Жазбаны өшіру")));
      recList.prepend(li);
      recBtn.textContent = "● Жазу";
      I.feedback(recMsg, "ok", "Жазба дайын", "Алдымен үлгіні, сосын өз жазбаңызды тыңдап салыстырыңыз: дауыстының ұзақтығы, тілдің қалпы, соңғы дыбыс. Жазба тек осы беттің жадында - ешқайда жіберілмейді, бетті жапқанда жойылады.");
    };
    mr.start(); recBtn.textContent = "■ Тоқтату";
    I.feedback(recMsg, "info", `Жазылып жатыр: «${word}»`, "Сөзді 2-3 рет айтыңыз, сосын «Тоқтату» батырмасын басыңыз.");
  });
  window.addEventListener("pagehide", () => { urls.forEach((u) => URL.revokeObjectURL(u)); if (stream) stream.getTracks().forEach((t) => t.stop()); if (TTS) try { speechSynthesis.cancel(); } catch (e) { /* */ } });

  setContrast(D.contrasts[0]);
  const badges = [["pr-badge-min", "ielts.pron.minimal", "Минималды жұптар"], ["pr-badge-ws", "ielts.pron.wordstress", "Сөз екпіні"], ["pr-badge-ss", "ielts.pron.sentstress", "Сөйлем екпіні"], ["pr-badge-in", "ielts.pron.intonation", "Интонация"], ["pr-badge-cs", "ielts.pron.connected", "Байланыстырып сөйлеу"]];
  if (window.AO17Tutor) badges.forEach(([id, s, t]) => { const el = $("#" + id); if (el) AO17Tutor.badge(el, s, t); });
})();
