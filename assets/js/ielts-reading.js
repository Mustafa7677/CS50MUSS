/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Reading Analyzer: мәтін (сол жақ) + сұрақтар (оң жақ), белгілеу, абзац ескертулері, Абзац картасы, сөздік,
   TRUE/FALSE/NOT GIVEN түсіндіргіші, Matching Headings, Summary Completion және дәлел-сөйлемді көрсететін жауап шолуы.
   Нәтижелер AO17Tutor-ға: ielts.reading.tfng, ielts.reading.tfng.concept, ielts.reading.headings, ielts.reading.summary, ielts.reading.vocab. */
(() => {
  "use strict";
  const R = window.IELTS_READING, I = window.IELTS;
  if (!R || !I) return;
  const { $, $$, h, store } = I;
  const root = $("[data-ielts-reading]");
  if (!root) return;

  const SENT = {}; // id -> мәтін
  R.paragraphs.forEach((p) => p.s.forEach((s, i) => { SENT[p.id + (i + 1)] = s; }));
  const PASS_WORDS = new Set(Object.values(SENT).join(" ").toLowerCase().match(/[a-z][a-z'-]*/g));

  /* ---------------- 1. Мәтін: сөйлемдер, белгілеу, ескертулер ---------------- */
  const pass = $("#rd-passage");
  const HL = store.get("reading:hl", {}); // { "B3": [[start,end], ...] }
  const NOTES = store.get("reading:notes", {});

  function paintSentence(span) {
    const text = SENT[span.dataset.s];
    const ranges = (HL[span.dataset.s] || []).slice().sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r.slice()); }
    HL[span.dataset.s] = merged;
    span.textContent = "";
    let pos = 0;
    for (const [a, b] of merged) {
      if (a > pos) span.append(text.slice(pos, a));
      span.append(h("mark", { class: "ie-hl", title: "Белгіні алу үшін басыңыз" }, text.slice(a, b)));
      pos = b;
    }
    if (pos < text.length) span.append(text.slice(pos));
  }

  R.paragraphs.forEach((p) => {
    const para = h("div", { class: "ie-para", id: "rd-p-" + p.id },
      h("span", { class: "ie-plet", "aria-hidden": "true" }, p.id),
      h("p", { class: "lab-text", "aria-label": "Абзац " + p.id },
        ...p.s.flatMap((s, i) => [h("span", { class: "ie-s", "data-s": p.id + (i + 1), id: "rd-s-" + p.id + (i + 1), tabindex: "-1" }), " "])));
    const ta = h("textarea", { class: "ie-note-ta", rows: 2, id: "rd-note-" + p.id, placeholder: "Мысалы: себептер тізімі; кілт сөз - calm nights" });
    ta.value = NOTES[p.id] || "";
    let tid = 0;
    ta.addEventListener("input", () => { clearTimeout(tid); tid = setTimeout(() => { NOTES[p.id] = ta.value; store.set("reading:notes", NOTES); sum.textContent = noteLabel(); }, 300); });
    const noteLabel = () => (NOTES[p.id] || ta.value).trim() ? `${p.id} абзацына ескерту ✎` : `${p.id} абзацына ескерту қосу`;
    const sum = h("summary", null, noteLabel());
    para.append(h("details", { class: "ie-note" }, sum, h("label", { class: "ie-sr", for: ta.id }, `${p.id} абзацына ескерту`), ta));
    pass.append(para);
  });
  $$(".ie-s", pass).forEach(paintSentence);

  const rdMsg = $("#rd-tool-msg");
  function doHighlight() {
    const sel = getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) { rdMsg.textContent = "Алдымен мәтіннен сөзді не сөз тіркесін тышқанмен (не саусақпен) белгілеңіз."; return; }
    const r = sel.getRangeAt(0);
    if (!pass.contains(r.commonAncestorContainer)) { rdMsg.textContent = "Белгілеуге тек оқу мәтіні жатады."; return; }
    let n = 0;
    $$(".ie-s", pass).forEach((span) => {
      if (!r.intersectsNode(span)) return;
      // span ішіндегі таңдаудың басы мен соңын таңба орнына айналдыру
      const pre = document.createRange(); pre.selectNodeContents(span);
      const len = SENT[span.dataset.s].length;
      let a = 0, b = len;
      if (span.contains(r.startContainer)) { pre.setEnd(r.startContainer, r.startOffset); a = pre.toString().length; }
      if (span.contains(r.endContainer)) { const p2 = document.createRange(); p2.selectNodeContents(span); p2.setEnd(r.endContainer, r.endOffset); b = p2.toString().length; }
      if (b > a) { (HL[span.dataset.s] = HL[span.dataset.s] || []).push([a, b]); paintSentence(span); n++; }
    });
    sel.removeAllRanges();
    store.set("reading:hl", HL);
    rdMsg.textContent = n ? "Белгіленді. Белгіні алып тастау үшін оны басыңыз." : "Таңдалған жерде мәтін жоқ.";
  }
  const hlBtn = $("#rd-hl");
  hlBtn.addEventListener("mousedown", (e) => e.preventDefault()); // таңдау жоғалмасын
  hlBtn.addEventListener("click", doHighlight);
  $("#rd-hl-clear").addEventListener("click", () => {
    Object.keys(HL).forEach((k) => delete HL[k]); store.set("reading:hl", HL); $$(".ie-s", pass).forEach(paintSentence);
    rdMsg.textContent = "Барлық белгі өшірілді.";
  });
  pass.addEventListener("click", (e) => {
    const m = e.target.closest("mark.ie-hl"); if (!m) return;
    const span = m.closest(".ie-s");
    // басылған белгінің ауқымын табу
    let pos = 0;
    for (const node of span.childNodes) { const L = node.textContent.length; if (node === m) { HL[span.dataset.s] = HL[span.dataset.s].filter((r) => !(r[0] === pos && r[1] === pos + L)); break; } pos += L; }
    paintSentence(span); store.set("reading:hl", HL);
    rdMsg.textContent = "Белгі алынды.";
  });

  // Уақыт: бір мәтінге ≈ 20 минут (емтиханда 60 минутта 3 мәтін)
  const tEl = $("#rd-timer"), tBtn = $("#rd-timer-btn");
  const T = I.timer(tEl, { seconds: 20 * 60, lowAt: 120, onEnd: () => { tBtn.textContent = "Қайта бастау"; rdMsg.textContent = "20 минут өтті. Емтиханда келесі мәтінге көшер едіңіз - қалған сұрақтарға жауап беріп, тексеріңіз."; } });
  tBtn.addEventListener("click", () => {
    if (T.running()) { T.stop(); tBtn.textContent = "Жалғастыру"; }
    else { if (T.left() <= 0) T.reset(); T.start(); tBtn.textContent = "Тоқтата тұру"; }
  });

  /* ---------------- 2. Дәлел-сөйлемді көрсету ---------------- */
  function showEvidence(id, qn, kind) {
    const s = $("#rd-s-" + id); if (!s) return;
    s.classList.add("ie-ev");
    s.classList.toggle("ie-ev-bad", kind === "bad");
    const tags = (s.dataset.q ? s.dataset.q.split(",") : []);
    if (!tags.includes(String(qn))) tags.push(String(qn));
    s.dataset.q = tags.join(",");
    s.setAttribute("data-qlabel", tags.map((t) => "№" + t).join(" "));
  }
  function goEvidence(id) {
    const s = $("#rd-s-" + id); if (!s) return;
    s.scrollIntoView({ block: "center", behavior: I.reduced() ? "auto" : "smooth" });
    s.classList.remove("ie-flash"); void s.offsetWidth; s.classList.add("ie-flash");
    s.focus({ preventScroll: true });
  }
  const evBtn = (id) => h("button", { type: "button", class: "ie-evbtn", onclick: () => goEvidence(id) }, `Дәлелді мәтіннен көрсету (${id[0]} абзацы)`);

  /* ---------------- 3. TFNG түсіндіргіші ---------------- */
  (function explainer() {
    const box = $("#rd-explainer"); if (!box) return;
    let k = store.get("reading:exk", 0) % R.explainer.length, picks = {}, hintApi = null, order = [];
    const st = $(".ie-x-st", box), grid = $(".ie-cases", box), fb = $(".ie-x-fb", box), check = $(".ie-x-check", box), next = $(".ie-x-next", box);
    const LBL = { TRUE: "келіседі", FALSE: "қайшы", "NOT GIVEN": "ақпарат жоқ" };
    function paint() {
      const set = R.explainer[k];
      picks = {}; order = I.shuffle([0, 1, 2]);
      st.textContent = set.st;
      grid.textContent = "";
      order.forEach((ci, pos) => {
        const c = set.cases[ci];
        const card = h("div", { class: "ie-case", "data-c": ci },
          h("p", { class: "ie-case-h" }, `${pos + 1}-мәтін`),
          h("p", { class: "ie-case-t", lang: "en" }, c.t),
          h("div", { class: "lab-choice", role: "group", "aria-label": `${pos + 1}-мәтінге жауап` },
            ...["TRUE", "FALSE", "NOT GIVEN"].map((v) => h("button", { type: "button", "aria-pressed": "false", "data-v": v, onclick: (e) => {
              picks[ci] = v; $$("button", e.target.parentNode).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
            } }, v))),
          h("p", { class: "ie-case-why", hidden: true }));
        grid.append(card);
      });
      fb.className = "ie-x-fb"; fb.textContent = ""; check.disabled = false; next.hidden = true;
      if (hintApi) hintApi.reset(hintList(set));
    }
    function hintList(set) {
      return [
        "Әр мәтінде тұжырымның кілт бөлігін табыңыз: кім/не, сан, жыл, мақсат. Сосын сұраңыз: мәтін осыны растай ма, теріске шығара ма, әлде мүлде айтпай ма?",
        "Ұқсас мысал: «The café opens at 8.» Мәтін: «Doors open at eight» → TRUE; «It opens at ten, not eight» → FALSE; «The café is popular with students» → NOT GIVEN (уақыт туралы ештеңе жоқ).",
        "Шешім: " + set.cases.map((c) => `«${c.t.slice(0, 48)}…» → ${c.a}: ${c.why}`).join(" "),
      ];
    }
    hintApi = window.AO17Tutor ? AO17Tutor.hints($(".ie-x-hints", box), hintList(R.explainer[k]), { onSolution: () => {
      I.feedback(fb, "info", "Шешім ашылды - бұл жиын меңгеруге саналмайды", "Төменде «Келесі тұжырым» батырмасы - жаңа жиынды көмексіз шешіп көріңіз.");
      next.hidden = false;
    } }) : null;
    check.addEventListener("click", () => {
      const set = R.explainer[k];
      if (Object.keys(picks).length < 3) { I.feedback(fb, "info", "Үш мәтіннің бәріне жауап таңдаңыз", "Салыстыру - түсіндіргіштің мәні: үшеуін қатар қарап, айырмасын көріңіз."); return; }
      let good = 0; const errs = [];
      $$(".ie-case", grid).forEach((card) => {
        const ci = +card.dataset.c, c = set.cases[ci], ok = picks[ci] === c.a;
        if (ok) good++; else errs.push(`${picks[ci]} емес, ${c.a}`);
        $$("button", card).forEach((b) => { b.disabled = true; b.classList.toggle("ok", b.dataset.v === c.a); b.classList.toggle("no", b.dataset.v === picks[ci] && !ok); });
        const w = $(".ie-case-why", card); w.hidden = false; w.textContent = `${c.a} (${LBL[c.a]}). ${c.why}`;
        card.classList.add(ok ? "ok" : "no");
      });
      const used = hintApi ? hintApi.used() : 0, all = good === 3;
      I.record("ielts.reading.tfng.concept", { item: "x" + k, ok: all, hints: used, error: all ? "" : "tfng-logic", note: errs.join("; "), title: "IELTS Reading: T/F/NG логикасы" });
      I.feedback(fb, all ? "ok" : "bad", all ? "Үшеуі де дұрыс." : `${good} / 3 дұрыс.`,
        all ? "Байқаңыз: тұжырым бір, ал жауапты тек мәтіннің не айтатыны шешеді." : "Әр мәтіннің астындағы түсіндірмені оқыңыз. Есте сақтаңыз: FALSE - тікелей қайшылық; ақпарат сенімді болса да, айтылмаса - NOT GIVEN.");
      check.disabled = true; next.hidden = false;
    });
    next.addEventListener("click", () => { k = (k + 1) % R.explainer.length; store.set("reading:exk", k); paint(); st.focus(); });
    paint();
  })();

  /* ---------------- 4. Сұрақтар ---------------- */
  const qroot = $("#rd-questions");
  let qn = 0;
  const groups = [];

  // 4a. TRUE / FALSE / NOT GIVEN
  (function tfng() {
    const g = $("#rd-g-tfng");
    const list = h("ol", { class: "ie-qlist", start: String(qn + 1) });
    const items = R.tfng.map((it) => {
      const n = ++qn, fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
      let pick = "";
      const choice = h("div", { class: "lab-choice", role: "group", "aria-label": `${n}-сұраққа жауап` },
        ...["TRUE", "FALSE", "NOT GIVEN"].map((v) => h("button", { type: "button", "aria-pressed": "false", "data-v": v, onclick: (e) => {
          pick = v; $$("button", choice).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
        } }, v)));
      list.append(h("li", { class: "ie-q", value: String(n) }, h("p", { class: "ie-qt", lang: "en" }, it.q), choice, fb));
      return { it, n, fb, choice, get pick() { return pick; } };
    });
    g.append(list);
    const hintEl = h("div"); g.append(hintEl);
    const hapi = window.AO17Tutor ? AO17Tutor.hints(hintEl, [
      "Тұжырымнан «зәкір» сөзді табыңыз (Howard, windy, Stuttgart, air-conditioning) - ол мәтіннің қай абзацында екенін көрсетеді. Сұрақтар мәтін ретімен жүреді.",
      "Ұқсас мысал: тұжырым «The museum is free on Mondays». Мәтін «Entry is free every Monday» → TRUE; «Entry costs £5 on Mondays» → FALSE; «The museum is closed on Sundays» → NOT GIVEN.",
      "Қадамдап: 1) зәкір сөзбен сөйлемді тап; 2) оны тұжырыммен бөлік-бөлікпен салыстыр (кім, не, қашан, қанша, only/always/most); 3) бәрі сәйкес → TRUE; бір бөлігі мәтінге қарсы → FALSE; мәтін ол бөлік туралы үндемейді → NOT GIVEN. Мысалы, 4-сұрақ: B7 «calm, clear nights», тұжырым «windy» → қайшы → FALSE.",
    ]) : null;
    groups.push({
      el: g, skill: "ielts.reading.tfng", title: "True/False/Not Given",
      check() {
        let ok = 0;
        items.forEach(({ it, n, fb, choice, pick }) => {
          const right = pick === it.a;
          if (right) ok++;
          $$("button", choice).forEach((b) => { b.classList.toggle("ok", b.dataset.v === it.a); b.classList.toggle("no", b.dataset.v === pick && !right); });
          const extra = !right && it.trap && it.trap[pick] ? it.trap[pick] : "";
          const why = !pick ? `Жауап берілмеді. Дұрысы: ${it.a}. ${it.why}` : right ? it.why : `Сіз: ${pick}. Дұрысы: ${it.a}. ${extra || it.why}`;
          I.feedback(fb, right ? "ok" : "bad", right ? `${n}. Дұрыс - ${it.a}` : `${n}. Дұрыс емес`, why);
          fb.append(evBtn(it.ev));
          showEvidence(it.ev, n, right ? "ok" : "bad");
          I.record("ielts.reading.tfng", { item: "q" + n, ok: right, hints: hapi ? hapi.used() : 0, error: right ? "" : (pick || "none").toLowerCase().replace(" ", "") + "-for-" + it.a.toLowerCase().replace(" ", ""), note: it.why, title: "IELTS Reading: True/False/Not Given" });
        });
        return [ok, items.length];
      },
    });
  })();

  // 4b. Matching Headings
  (function headings() {
    const g = $("#rd-g-head"), H = R.headings;
    g.append(h("div", { class: "ie-headlist", lang: "en" }, h("p", { class: "ie-hl-cap" }, "List of Headings"),
      h("ol", { class: "ie-roman" }, ...H.list.map((x) => h("li", null, h("b", null, x.id + ". "), x.t)))));
    g.append(h("p", { class: "ie-ex" }, h("b", null, "Мысал: "), `${H.example.p} абзацы → ${H.example.a}. ${H.list.find((x) => x.id === H.example.a).t}`));
    const list = h("ol", { class: "ie-qlist", start: String(qn + 1) });
    const items = H.items.map((it) => {
      const n = ++qn, fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
      const sel = h("select", { id: "rd-h-" + it.p, class: "ie-sel" }, h("option", { value: "" }, "- тақырып таңдаңыз -"),
        ...H.list.filter((x) => x.id !== H.example.a).map((x) => h("option", { value: x.id }, `${x.id}. ${x.t}`)));
      list.append(h("li", { class: "ie-q", value: String(n) }, h("label", { class: "ie-qt", for: sel.id }, `${it.p} абзацы`), sel, fb));
      return { it, n, fb, sel };
    });
    g.append(list);
    const hintEl = h("div"); g.append(hintEl);
    const hapi = window.AO17Tutor ? AO17Tutor.hints(hintEl, [
      "Абзацтың бірінші және соңғы сөйлемін оқып, «бұл абзац НЕ туралы?» деп бір жолмен айтыңыз (Абзац картасы қойындысы осы үшін). Сосын тізімнен сол ойға сай тақырыпты іздеңіз.",
      "Ұқсас мысал: абзацта «қалада көлік көп, бірақ велосипед жолы аз, ал жаяу жүргінші қауіпте» делінсе, тақырып - «Problems for people who do not drive», ал «The history of the bicycle» - тек бір сөзге сүйенген тұзақ.",
      "Қадамдап: 1) әр абзацқа өз түйініңізді жазыңыз; 2) тізімнен түйінге мағынасы жақын тақырыпты табыңыз; 3) абзацта тек бір рет аталатын сөзге (air conditioning, drought, winter) сүйенген тақырыптарды алып тастаңыз - олар артық (distractor) тақырыптар; 4) әр тақырып бір-ақ рет қолданылады.",
    ]) : null;
    groups.push({
      el: g, skill: "ielts.reading.headings", title: "Matching Headings",
      check() {
        let ok = 0;
        const counts = {}; items.forEach(({ sel }) => { if (sel.value) counts[sel.value] = (counts[sel.value] || 0) + 1; });
        items.forEach(({ it, n, fb, sel }) => {
          const v = sel.value, right = v === it.a, head = H.list.find((x) => x.id === it.a).t;
          if (right) ok++;
          sel.classList.toggle("ok", right); sel.classList.toggle("no", !right);
          let why = it.why;
          if (!right && v && it.trap && it.trap[v]) why = it.trap[v] + " " + it.why;
          if (!right && v && counts[v] > 1) why += ` Ескерту: «${v}» тақырыбын бірнеше абзацқа бердіңіз - әр тақырып бір-ақ рет қолданылады.`;
          I.feedback(fb, right ? "ok" : "bad", right ? `${n}. Дұрыс - ${it.a}. ${head}` : `${n}. Дұрыс емес. Дұрысы: ${it.a}. ${head}`, (v || right) ? why : "Жауап таңдалмады. " + why);
          fb.append(evBtn(it.ev));
          showEvidence(it.ev, n, right ? "ok" : "bad");
          I.record("ielts.reading.headings", { item: "h" + it.p, ok: right, hints: hapi ? hapi.used() : 0, error: right ? "" : v ? "detail-not-main-idea" : "blank", note: why, title: "IELTS Reading: Matching Headings" });
        });
        return [ok, items.length];
      },
    });
  })();

  // 4c. Summary Completion (NO MORE THAN TWO WORDS)
  (function summary() {
    const g = $("#rd-g-sum"), S = R.summary;
    const box = h("p", { class: "ie-summary lab-text", lang: "en" });
    const parts = S.text.split(/\{(\d)\}/);
    const inputs = {};
    parts.forEach((part, i) => {
      if (i % 2 === 0) { box.append(part); return; }
      const it = S.items.find((x) => x.n === +part), n = qn + it.n;
      const inp = h("input", { type: "text", class: "ie-gap", id: "rd-sum-" + it.n, autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": `${n}-бос орын` });
      inputs[it.n] = inp;
      box.append(h("span", { class: "ie-gapw" }, h("b", { class: "ie-gapn", "aria-hidden": "true" }, String(n)), inp));
    });
    g.append(box);
    const fbs = h("ol", { class: "ie-qlist ie-sumfb", start: String(qn + 1) });
    const items = S.items.map((it) => { const n = qn + it.n, fb = h("div", { class: "ie-qfb", "aria-live": "polite" }); fbs.append(h("li", { value: String(n) }, fb)); return { it, n, fb }; });
    qn += S.items.length;
    g.append(fbs);
    groups.push({
      el: g, skill: "ielts.reading.summary", title: "Summary Completion",
      check() {
        let ok = 0;
        items.forEach(({ it, n, fb }) => {
          const inp = inputs[it.n], raw = inp.value, v = I.norm(raw), wc = I.words(raw);
          let right = false, title, why, err = "";
          if (!v) { title = `${n}. Бос`; why = `Дұрысы: ${it.a[0]}. ${it.why}`; err = "blank"; }
          else if (wc > S.limit) { title = `${n}. Сөз шегінен асты (${wc} сөз)`; why = `Нұсқау: NO MORE THAN TWO WORDS. ${wc} сөз жазсаңыз, мағынасы дұрыс болса да жауап қате саналады. Дұрысы: ${it.a[0]}.`; err = "word-limit"; }
          else if (it.a.includes(v)) { right = true; title = `${n}. Дұрыс - ${raw.trim()}`; why = it.why; }
          else if (it.wrong && it.wrong[v]) { title = `${n}. Дұрыс емес`; why = it.wrong[v] + ` Дұрысы: ${it.a[0]}.`; err = "distractor"; }
          else if (it.a.some((a) => I.lev(v, a) <= 2)) { title = `${n}. Емле қатесі`; why = `Сіз «${raw.trim()}» деп жаздыңыз, дұрысы «${it.a[0]}». IELTS-та сөз мәтіннен дәл көшірілуі керек: қате жазылған сөз дұрыс саналмайды.`; err = "spelling"; }
          else if (v.split(" ").some((w) => !PASS_WORDS.has(w))) { title = `${n}. Сөз мәтінде жоқ`; why = `«${raw.trim()}» мәтінде кездеспейді. Summary Completion-да сөзді мәтіннен алу керек. Дұрысы: ${it.a[0]}. ${it.why}`; err = "not-from-passage"; }
          else { title = `${n}. Дұрыс емес`; why = `Дұрысы: ${it.a[0]}. ${it.why} Тексеріңіз: сөз грамматикалық тұрғыдан да бос орынға сай ма?`; err = "wrong-word"; }
          if (right) ok++;
          inp.classList.toggle("ok", right); inp.classList.toggle("no", !right);
          I.feedback(fb, right ? "ok" : "bad", title, why);
          fb.append(evBtn(it.ev));
          showEvidence(it.ev, n, right ? "ok" : "bad");
          I.record("ielts.reading.summary", { item: "s" + it.n, ok: right, error: err, note: why, title: "IELTS Reading: Summary Completion" });
        });
        return [ok, items.length];
      },
    });
  })();

  // Тексеру батырмалары
  groups.forEach((gr) => {
    const out = h("div", { class: "ie-gsum", "aria-live": "polite" });
    const btn = h("button", { type: "button", class: "btn", onclick: () => { const [ok, n] = gr.check(); I.feedback(out, ok === n ? "ok" : "info", `Нәтиже: ${ok} / ${n}`, "Мәтінде дәлел-сөйлемдер белгіленді (сұрақ нөмірімен). Әр жауаптың астындағы түсіндірмені оқыңыз."); } }, "Бұл бөлімді тексеру");
    const badge = h("p");
    gr.el.append(h("div", { class: "lab-row" }, btn), out, badge);
    if (window.AO17Tutor) AO17Tutor.badge(badge, gr.skill, gr.title);
  });
  const totalOut = $("#rd-total");
  $("#rd-check-all").addEventListener("click", () => {
    let ok = 0, n = 0;
    groups.forEach((gr) => { const [a, b] = gr.check(); ok += a; n += b; });
    I.feedback(totalOut, "info", `Барлығы: ${ok} / ${n} дұрыс`, "Бұл - жаттығу нәтижесі, ресми IELTS band бағасы емес. Қате жауаптардың дәлел-сөйлемдерін мәтіннен оқып шығыңыз - қате себебін түсіну санынан маңыздырақ.");
  });
  $("#rd-reset").addEventListener("click", () => location.reload()); // жауаптар жадта ғана - қайта жүктеу бәрін тазартады

  /* ---------------- 5. Қойындылар: Сұрақтар / Абзац картасы / Сөздік ---------------- */
  const tabs = $$("[role=tab]", root);
  function selectTab(t) {
    tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
      const nt = tabs[(i + d + tabs.length) % tabs.length]; selectTab(nt); nt.focus(); e.preventDefault();
    });
  });

  // Абзац картасы
  (function map() {
    const box = $("#rd-map"); const MAP = store.get("reading:map", {});
    R.paragraphs.forEach((p) => {
      const inp = h("input", { type: "text", id: "rd-map-" + p.id, class: "ie-mapin", value: MAP[p.id] || "", placeholder: "Бір жол: бұл абзац не туралы?" });
      const fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
      const btn = h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => {
        const wc = I.words(inp.value);
        if (wc < 3) { I.feedback(fb, "info", "Алдымен өзіңіз жазыңыз", "Үлгі түйін сіз кемінде 3 сөз жазған соң ашылады: алдымен болжау, сосын салыстыру."); return; }
        I.feedback(fb, "info", "Үлгі түйін: " + R.gist[p.id], wc > 14 ? `Сіздің түйініңіз ${wc} сөз - ұзындау. Түйін - бір қысқа жол (≈ 6-12 сөз): мәліметтер емес, басты ой.` : "Салыстырыңыз: басты ойды ұстадыңыз ба, әлде бір бөлшекті ғана жаздыңыз ба?");
      } }, "Үлгімен салыстыру");
      let tid = 0;
      inp.addEventListener("input", () => { clearTimeout(tid); tid = setTimeout(() => { MAP[p.id] = inp.value; store.set("reading:map", MAP); }, 300); });
      box.append(h("div", { class: "ie-maprow" }, h("label", { for: inp.id, class: "ie-maplet" }, p.id), inp, btn, fb));
    });
  })();

  // Сөздік және шағын тест
  (function vocab() {
    const dl = $("#rd-vocab");
    R.vocab.forEach((v) => {
      dl.append(h("div", { class: "ie-voc" }, h("dt", { lang: "en" }, v.w, " ", h("small", null, v.p + " абзацы")),
        h("dd", null, v.kk, h("br"), h("i", { lang: "en" }, "«" + v.ex + "»"), " ",
          h("button", { type: "button", class: "ie-evbtn", onclick: () => { const sid = Object.keys(SENT).find((k) => k[0] === v.p && SENT[k].includes(v.ex)); if (sid) goEvidence(sid); } }, "мәтіннен табу"))));
    });
    const q = $("#rd-vq"); let cur = null, hinted = 0;
    function next() {
      cur = I.shuffle(R.vocab)[0];
      const opts = I.shuffle([cur, ...I.shuffle(R.vocab.filter((x) => x !== cur)).slice(0, 2)]);
      q.textContent = "";
      const fb = h("div", { "aria-live": "polite" });
      q.append(h("p", null, "Мәтінде: ", h("i", { lang: "en" }, "«" + cur.ex + "»"), ". ", h("b", { lang: "en" }, cur.w), " сөзінің мағынасы?"),
        h("div", { class: "lab-choice" }, ...opts.map((o) => h("button", { type: "button", onclick: (e) => {
          const ok = o === cur;
          $$("button", e.target.parentNode).forEach((b) => { b.disabled = true; });
          e.target.classList.add(ok ? "ok" : "no");
          I.record("ielts.reading.vocab", { item: cur.w, ok, hints: hinted, error: ok ? "" : "gloss", note: cur.kk, title: "IELTS Reading: сөздік" });
          I.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс." : `Дұрыс емес: «${o.kk}» - бұл ${o.w}.`, `${cur.w} - ${cur.kk}. Контексттен табу: ${cur.p} абзацы.`);
          fb.append(h("button", { type: "button", class: "btn secondary ie-sm", onclick: next }, "Келесі сөз"));
        } }, o.kk))), fb);
    }
    next();
  })();
})();
