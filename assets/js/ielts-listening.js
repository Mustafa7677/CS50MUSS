/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Listening Laboratory: Web Speech API (speechSynthesis) арқылы екі дауыспен оқылатын диалог, бөлік уақыт сызығы,
   жылдамдық, бөлікті қайталау; форма толтыру (NO MORE THAN TWO WORDS AND/OR A NUMBER) және көп таңдаулы сұрақтар;
   нұсқаларды қабылдайтын, сөз шегін тексеретін және бас тартуды түсіндіретін валидатор; транскриптке секіру;
   Емтихан режимі (бір рет тыңдау, таймер, транскрипт соңында). speechSynthesis жоқ болса - адал оқу режимі.
   AO17Tutor: ielts.listening.form, ielts.listening.mc, ielts.listening.predict, ielts.listening.vocab. */
(() => {
  "use strict";
  const L = window.IELTS_LISTENING, I = window.IELTS;
  if (!L || !I) return;
  const { $, $$, h } = I;
  const root = $("[data-ielts-listening]");
  if (!root) return;
  const TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const SEGS = L.segments;
  const lineSec = (ln) => Math.max(1.5, I.words(ln.say || ln.t) / 2.6); // ≈ 155 сөз/мин
  const segSec = SEGS.map((s) => s.lines.reduce((a, ln) => a + lineSec(ln) + 0.4, 0));
  const TOTAL = segSec.reduce((a, b) => a + b, 0);

  /* ---------------- Транскрипт ---------------- */
  const tr = $("#ls-transcript");
  SEGS.forEach((s, si) => {
    tr.append(h("p", { class: "ie-segh" }, `${si + 1}-бөлік`));
    s.lines.forEach((ln, li) => {
      const sp = L.speakers[ln.w];
      tr.append(h("div", { class: "ie-line", id: `ls-l-${si}-${li}`, lang: "en" },
        h("span", { class: "ie-who" + (ln.w === "C" ? " c" : ""), lang: "kk" }, sp.name),
        h("p", null, ln.t),
        TTS ? h("button", { type: "button", class: "ls-from", "aria-label": `${si + 1}-бөлік, осы жолдан тыңдау`, onclick: () => playFrom(si, li, false) }, "▶") : ""));
    });
  });

  /* ---------------- Ойнатқыш ---------------- */
  const st = { seg: 0, line: 0, playing: false, speed: 1, mode: "practice", examPlayed: false, examDone: false, onlySeg: false, token: 0, checked: false };
  const now = $("#ls-now"), btnPlay = $("#ls-play"), btnReplay = $("#ls-replay"), btnPrev = $("#ls-prev"), btnNext = $("#ls-next");
  const speedSel = $("#ls-speed"), tl = $("#ls-timeline"), ptime = $("#ls-ptime"), trBtn = $("#ls-tr-toggle"), modeMsg = $("#ls-mode-msg");
  const segBtns = SEGS.map((s, si) => {
    const b = h("button", { type: "button", class: "ie-seg", style: `--w:${segSec[si].toFixed(1)}`, "aria-label": `${si + 1}-бөлік, ≈ ${Math.round(segSec[si])} секунд`, onclick: () => playFrom(si, 0, false) },
      h("i", { class: "ie-fill" }), h("span", null, String(si + 1)));
    tl.append(b); return b;
  });
  let voices = { R: null, C: null };
  function pickVoices() {
    if (!TTS) return;
    const vs = speechSynthesis.getVoices() || [];
    const gb = vs.filter((v) => /^en[-_]GB/i.test(v.lang)), en = vs.filter((v) => /^en/i.test(v.lang));
    const pool = gb.length ? gb : en;
    voices.R = pool[0] || null;
    voices.C = pool.find((v) => v !== voices.R && /male|daniel|george|arthur|ryan|oliver/i.test(v.name) && !/female/i.test(v.name)) || pool[1] || pool[0] || null;
    const vm = $("#ls-voices");
    if (vm) vm.textContent = voices.R ? `Дауыстар: ${voices.R.name}${voices.C && voices.C !== voices.R ? " / " + voices.C.name : " (бір дауыс, екі түрлі биіктік)"}${gb.length ? "" : " - en-GB дауысы табылмады, басқа ағылшын дауысы қолданылды"}.` : "Дауыс тізімі әлі жүктелмеді - әдепкі ағылшын дауысы қолданылады.";
  }
  if (TTS) { pickVoices(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pickVoices); }

  function elapsed() {
    let t = 0; for (let i = 0; i < st.seg; i++) t += segSec[i];
    for (let j = 0; j < st.line && SEGS[st.seg]; j++) t += lineSec(SEGS[st.seg].lines[j]) + 0.4;
    return t;
  }
  function paint() {
    segBtns.forEach((b, i) => {
      const p = i < st.seg ? 100 : i > st.seg ? 0 : Math.round(100 * st.line / SEGS[i].lines.length);
      b.style.setProperty("--p", p + "%");
      b.setAttribute("aria-current", String(i === st.seg));
      b.disabled = st.mode === "exam";
    });
    ptime.textContent = `≈ ${I.fmt(elapsed() / st.speed)} / ${I.fmt(TOTAL / st.speed)}`;
    btnPlay.textContent = st.playing ? "❚❚ Кідірту" : "▶ Ойнату";
    btnPlay.setAttribute("aria-label", st.playing ? "Кідірту" : "Ойнату");
    const exam = st.mode === "exam";
    btnPlay.disabled = !TTS || (exam && (st.examPlayed && !st.playing)) || (exam && st.playing);
    [btnReplay, btnPrev, btnNext, speedSel].forEach((x) => { x.disabled = !TTS || exam; });
    $$(".ls-from", tr).forEach((x) => { x.disabled = exam && !st.checked; });
    $$(".ie-line", tr).forEach((x) => x.classList.remove("on"));
    const cur = $(`#ls-l-${st.seg}-${st.line}`);
    if (cur && st.playing) cur.classList.add("on");
  }
  function speakLine() {
    const seg = SEGS[st.seg];
    if (!seg) { finish(); return; }
    if (st.line >= seg.lines.length) {
      if (st.onlySeg) { st.playing = false; st.onlySeg = false; st.line = 0; now.textContent = `${st.seg + 1}-бөлік қайталанды.`; paint(); return; }
      st.seg++; st.line = 0;
      if (!SEGS[st.seg]) { finish(); return; }
    }
    const ln = SEGS[st.seg].lines[st.line], sp = L.speakers[ln.w];
    const tok = ++st.token;
    const u = new SpeechSynthesisUtterance(ln.say || ln.t);
    const v = voices[ln.w];
    u.lang = v ? v.lang : "en-GB"; if (v) u.voice = v;
    u.pitch = sp.pitch; u.rate = sp.rate * st.speed;
    u.onend = () => { if (tok !== st.token || !st.playing) return; st.line++; paint(); setTimeout(() => { if (tok === st.token && st.playing) speakLine(); }, 350); };
    u.onerror = (e) => { if (tok !== st.token || !st.playing) return; if (e && (e.error === "interrupted" || e.error === "canceled")) return; st.playing = false; now.textContent = "Дауыс синтезінде қате шықты. Қайта ойнатып көріңіз немесе транскриптпен оқу режимін қолданыңыз."; paint(); };
    now.textContent = "";
    now.append(h("b", null, `${st.seg + 1}-бөлік · `), st.mode === "exam" && !st.checked ? "тыңдаңыз…" : `${sp.name}: ${ln.t}`);
    paint();
    try { speechSynthesis.speak(u); } catch (e) { st.playing = false; paint(); }
  }
  function stopSpeech() { st.token++; try { speechSynthesis.cancel(); } catch (e) { /* жоқ */ } }
  function play() { if (!TTS) return; st.playing = true; if (!SEGS[st.seg]) { st.seg = 0; st.line = 0; } stopSpeech(); speakLine(); }
  function pause() { st.playing = false; stopSpeech(); now.textContent = `Кідіртілді: ${st.seg + 1}-бөлік. «Ойнату» осы жолдан жалғастырады.`; paint(); }
  function playFrom(si, li, onlySeg) {
    if (!TTS || (st.mode === "exam" && !st.checked)) return;
    st.seg = si; st.line = li; st.onlySeg = onlySeg; play();
  }
  function finish() {
    st.playing = false; st.seg = SEGS.length - 1; st.line = SEGS[st.seg].lines.length;
    now.textContent = "Жазба аяқталды.";
    if (st.mode === "exam") {
      st.examDone = true; examTimer.stop();
      modeMsg.textContent = "Жазба бір рет ойнатылды. Емтихандағыдай жауаптарды тексеріп, «Жауаптарды тексеру» батырмасын басыңыз - транскрипт содан кейін ашылады.";
    }
    paint();
  }
  btnPlay.addEventListener("click", () => {
    if (st.playing) { if (st.mode !== "exam") pause(); return; }
    if (st.mode === "exam") { st.examPlayed = true; st.seg = 0; st.line = 0; examTimer.reset(0); examTimer.start(); }
    play();
  });
  btnReplay.addEventListener("click", () => playFrom(st.seg, 0, true));
  btnPrev.addEventListener("click", () => playFrom(Math.max(0, st.seg - (st.line === 0 ? 1 : 0)), 0, false));
  btnNext.addEventListener("click", () => playFrom(Math.min(SEGS.length - 1, st.seg + 1), 0, false));
  speedSel.addEventListener("change", () => { st.speed = +speedSel.value; if (st.playing) { stopSpeech(); speakLine(); } else paint(); });

  // Режим
  const examTimer = I.timer($("#ls-exam-timer"), { seconds: 0 });
  function setMode(m) {
    if (st.playing) pause();
    st.mode = m; st.examPlayed = false; st.examDone = false; st.seg = 0; st.line = 0; st.checked = false;
    $$("[name=ls-mode]").forEach((r) => { r.checked = r.value === m; });
    const exam = m === "exam";
    $("#ls-exam-bar").hidden = !exam;
    if (exam) { speedSel.value = "1"; st.speed = 1; examTimer.reset(0); showTranscript(false); trBtn.disabled = true; modeMsg.textContent = "Емтихан режимі: жазба бір рет қана, кідіртусіз ойнатылады; транскрипт жабық. Тыңдау кезінде жауап жаза беріңіз."; }
    else { trBtn.disabled = false; modeMsg.textContent = "Жаттығу режимі: кідіртуге, бөлікті қайталауға, жылдамдықты өзгертуге және транскриптті ашуға болады."; }
    resetAnswers();
    paint();
  }
  $$("[name=ls-mode]").forEach((r) => r.addEventListener("change", () => setMode(r.value)));
  function showTranscript(on) { tr.hidden = !on; trBtn.setAttribute("aria-expanded", String(on)); trBtn.textContent = on ? "Транскриптті жасыру" : "Транскриптті көрсету"; }
  trBtn.addEventListener("click", () => showTranscript(tr.hidden));

  /* ---------------- Валидатор ---------------- */
  const NUM = /^£?\d+(?:[.,]\d+)?(?:st|nd|rd|th)?$/;
  function tokens(v) {
    const t = v.replace(/£\s+/g, "£").split(" ").filter(Boolean), out = [];
    for (const x of t) { const last = out[out.length - 1]; if (/^\d+$/.test(x) && last && /^\d+$/.test(last)) out[out.length - 1] = last + x; else out.push(x); } // 07700 900461 = бір сан
    return out;
  }
  /** Қайтарады { ok, code, title, why } */
  function validate(it, raw) {
    const v = I.norm(raw).replace(/\s*-\s*/g, "-");
    if (!v) return { ok: false, code: "blank", title: "Жауап жоқ", why: `Бос орын толтырылмады. ${it.why}` };
    const tk = tokens(v), nums = tk.filter((x) => NUM.test(x)), wds = tk.filter((x) => !NUM.test(x));
    if (wds.length > 2 || nums.length > 1) return { ok: false, code: "word-limit", title: "Сөз шегінен асты",
      why: `Нұсқау: NO MORE THAN TWO WORDS AND/OR A NUMBER - ең көбі екі сөз және бір сан. Сізде ${wds.length} сөз${nums.length ? " және " + nums.length + " сан" : ""}${wds.includes("of") || wds.includes("the") ? " («of», «the», «a» сияқты шағын сөздер де саналады)" : ""}. Мағынасы дұрыс болса да, мұндай жауап қате саналады.` };
    if (it.kind === "phone") {
      const d = v.replace(/\D/g, "");
      if (d === it.a[0]) return { ok: true };
      return { ok: false, code: "number", title: "Нөмір сәйкес емес", why: `Сіз: ${d || v}. ${it.why}${d.length !== 11 ? ` Сізде ${d.length} цифр, ал нөмірде 11 цифр.` : ""}` };
    }
    const flat = v.replace(/\s+/g, " ");
    if (it.a.includes(flat) || it.a.includes(flat.replace(/^£/, "")) || (it.kind === "money" && it.a.includes(flat.replace(/ ?pounds?$/, "")))) return { ok: true };
    const w = it.wrong && (it.wrong[flat] || it.wrong[flat.replace(/^£/, "")] || it.wrong[flat.replace(/(st|nd|rd|th)$/, "")]);
    if (w) return { ok: false, code: "distractor", title: "Тұзақ: бұл соңғы ақпарат емес", why: w };
    if (it.kind === "name" || it.kind === "word") {
      const near = it.a.find((a) => I.lev(flat, a) <= 2);
      if (near) return { ok: false, code: "spelling", title: "Емле қатесі", why: `Сіз «${raw.trim()}» деп жаздыңыз, дұрысы «${near}». IELTS Listening-те емле қатесі бар жауап дұрыс саналмайды. ${it.why}` };
    }
    return { ok: false, code: "wrong", title: "Дұрыс емес", why: it.why };
  }
  window.IELTS_LISTENING_VALIDATE = validate; // тест үшін

  /* ---------------- Форма және сұрақтар ---------------- */
  const form = $("#ls-form");
  const fItems = L.form.map((it) => {
    const inp = h("input", { type: "text", class: "ie-gap", id: "ls-f" + it.n, autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    const fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
    form.append(h("div", { class: "ie-frow" },
      h("span", { lang: "en" }, h("label", { for: inp.id }, it.label), h("span", { class: "ie-sr" }, ` (${it.n}-сұрақ)`)),
      h("span", { class: "ie-fv", lang: "en" }, it.pre ? it.pre + " " : "", h("b", { class: "ie-gapn", "aria-hidden": "true" }, String(it.n)), inp, it.post ? " " + it.post : ""), fb));
    return { it, inp, fb };
  });
  const mcBox = $("#ls-mc");
  const mItems = L.mc.map((it) => {
    const fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
    const fs = h("fieldset", { class: "ie-q ie-mcq", value: String(it.n) },
      h("legend", { lang: "en" }, `${it.n}. ${it.q}`),
      h("ul", { class: "ie-mc", lang: "en" }, ...it.opts.map((o, oi) => h("li", null, h("label", null, h("input", { type: "radio", name: "ls-mc" + it.n, value: String(oi) }), `${"ABC"[oi]}  ${o}`)))), fb);
    mcBox.append(fs);
    return { it, fs, fb };
  });

  function jumpTo([si, li], kind) {
    if (st.mode === "exam" && !st.checked) return;
    showTranscript(true);
    const el = $(`#ls-l-${si}-${li}`); if (!el) return;
    el.classList.add(kind === "ok" ? "ie-key" : "ie-flag");
    el.scrollIntoView({ block: "nearest", behavior: I.reduced() ? "auto" : "smooth" });
  }
  function evButtons(fb, key, kind) {
    const row = h("div", { class: "lab-row" },
      h("button", { type: "button", class: "ie-evbtn", onclick: () => jumpTo(key, kind) }, `Транскрипттен көрсету (${key[0] + 1}-бөлік)`),
      TTS ? h("button", { type: "button", class: "ie-evbtn", onclick: () => playFrom(key[0], 0, true) }, `${key[0] + 1}-бөлікті қайта тыңдау`) : "");
    fb.append(row);
  }
  const hintsApi = window.AO17Tutor ? AO17Tutor.hints($("#ls-hints"), [
    "Тыңдамас бұрын әр бос орынға не керек екенін болжаңыз (күн? сан? атау?). Тыңдағанда «sorry», «actually», «no, I mean» сияқты түзету сөздерін аңдыңыз - олардан кейінгі ақпарат дұрыс.",
    "Ұқсас мысал: «The meeting is on Monday - no, wait, Tuesday». Жауап: Tuesday. «Full price is £20, but students pay £15. Are you a student? - Yes.» Жауап: 15.",
    "Қадамдап: 1) 1-бөлік: Tuesday толы → Thursday. 2) 2-бөлік: 15th түзетіледі → 16th. 3) Тегі әріппен: W-H-I-T-L-O-C-K. 4) Нөмірді «double oh» = 00 деп жазыңыз. 5) Daniel мүше → мүше бағасы. 6) «You don't need a tripod» → басқа зат. 7) «website... no, actually» → түзетілген жауап.",
  ]) : null;

  const out = $("#ls-out");
  function check() {
    if (st.playing) pause();
    let ok = 0;
    fItems.forEach(({ it, inp, fb }) => {
      const r = validate(it, inp.value);
      if (r.ok) ok++;
      inp.classList.toggle("ok", r.ok); inp.classList.toggle("no", !r.ok);
      I.feedback(fb, r.ok ? "ok" : "bad", r.ok ? `${it.n}. Дұрыс` : `${it.n}. ${r.title}`, r.ok ? it.why : r.why + (r.code === "word-limit" || r.code === "blank" ? "" : ` Дұрыс жауап: ${it.kind === "phone" ? "07700 900461" : it.a[0]}.`));
      evButtons(fb, it.key, r.ok ? "ok" : "bad");
      if (!r.ok) $(`#ls-l-${it.key[0]}-${it.key[1]}`).classList.add("ie-flag");
      else $(`#ls-l-${it.key[0]}-${it.key[1]}`).classList.add("ie-key");
      I.record("ielts.listening.form", { item: "f" + it.n, ok: r.ok, hints: hintsApi ? hintsApi.used() : 0, error: r.ok ? "" : r.code, note: r.why || "", title: "IELTS Listening: форма толтыру" });
    });
    mItems.forEach(({ it, fs, fb }) => {
      const sel = $("input:checked", fs), v = sel ? +sel.value : -1, right = v === it.a;
      if (right) ok++;
      $$("label", fs).forEach((lb, i) => { lb.classList.toggle("ok", i === it.a); });
      I.feedback(fb, right ? "ok" : "bad", right ? `${it.n}. Дұрыс - ${"ABC"[it.a]}` : `${it.n}. ${v < 0 ? "Жауап таңдалмады" : "Дұрыс емес"} - дұрысы ${"ABC"[it.a]}`, (v >= 0 && !right && it.wrong[v] ? it.wrong[v] + " " : "") + it.why);
      evButtons(fb, it.key, right ? "ok" : "bad");
      $(`#ls-l-${it.key[0]}-${it.key[1]}`).classList.add(right ? "ie-key" : "ie-flag");
      I.record("ielts.listening.mc", { item: "m" + it.n, ok: right, error: right ? "" : v < 0 ? "blank" : "distractor", note: it.why, title: "IELTS Listening: көп таңдау" });
    });
    st.checked = true;
    showTranscript(true); trBtn.disabled = false;
    if (st.mode === "exam") { examTimer.stop(); modeMsg.textContent = `Емтихан аяқталды (уақыт: ${$("#ls-exam-timer").textContent}). Транскрипт ашылды: жасыл жиек - дұрыс жауаптың жолы, қызыл - қате кеткен сұрақтың жолы.`; }
    const first = [...fItems.map((x) => x.inp), ...mItems.map((x) => x.fs)].find((x) => x.classList.contains("no") || (x.tagName === "FIELDSET" && !$("label.ok input:checked", x)));
    I.feedback(out, ok === 10 ? "ok" : "info", `Нәтиже: ${ok} / 10`, "Бұл - жаттығу нәтижесі, ресми band бағасы емес. Қате жауаптардың жолдары транскриптте қызылмен белгіленді." + (first ? " Бірінші қатеге секірдік." : ""));
    if (first) {
      const n = +((first.id || "").replace("ls-f", "") || first.getAttribute("value"));
      const item = [...L.form, ...L.mc].find((x) => x.n === n);
      if (item) jumpTo(item.key, "bad");
    }
    paint();
  }
  $("#ls-check").addEventListener("click", check);
  function resetAnswers() {
    fItems.forEach(({ inp, fb }) => { inp.value = ""; inp.classList.remove("ok", "no"); fb.className = "ie-qfb"; fb.textContent = ""; });
    mItems.forEach(({ fs, fb }) => { $$("input", fs).forEach((x) => { x.checked = false; }); $$("label", fs).forEach((x) => x.classList.remove("ok")); fb.className = "ie-qfb"; fb.textContent = ""; });
    $$(".ie-line", tr).forEach((x) => x.classList.remove("ie-flag", "ie-key", "on"));
    out.className = ""; out.textContent = "";
  }
  $("#ls-reset").addEventListener("click", () => setMode(st.mode));

  /* ---------------- Болжау (тыңдамас бұрын) ---------------- */
  (function predict() {
    const box = $("#ls-predict"), fb = $("#ls-predict-fb");
    const OPTS = [["word", "сөз"], ["number", "сан"], ["name", "атау / әріптеп айтылатын сөз"]];
    const sels = L.predict.map((p) => {
      const f = L.form.find((x) => x.n === p.n);
      const s = h("select", { id: "ls-p" + p.n, class: "ie-sel" }, h("option", { value: "" }, "- таңдаңыз -"), ...OPTS.map(([v, t]) => h("option", { value: v }, t)));
      box.append(h("div", { class: "ie-frow" }, h("label", { for: s.id, lang: "en" }, `${p.n}. ${f.label}: ${f.pre} ___ ${f.post}`), s));
      return { p, s };
    });
    $("#ls-predict-check").addEventListener("click", () => {
      let ok = 0; const bad = [];
      sels.forEach(({ p, s }) => { const r = s.value === p.a; if (r) ok++; else bad.push(`${p.n} - ${p.t}`); s.classList.toggle("ok", r); s.classList.toggle("no", !r); });
      const all = ok === sels.length;
      I.record("ielts.listening.predict", { item: "predict", ok: all, error: all ? "" : "answer-type", note: bad.join("; "), title: "IELTS Listening: жауап түрін болжау" });
      I.feedback(fb, all ? "ok" : "bad", all ? "Болжам дұрыс." : `${ok} / ${sels.length} дұрыс.`, all ? "Енді тыңдағанда нені күтетініңізді білесіз: «Start date» - сан, «Surname» - әріптеп айтылуы мүмкін." : "Дұрысы: " + bad.join("; ") + ". Бос орынның алдындағы және кейінгі сөздерге қараңыз: «___ October» алдында сан тұрады.");
    });
  })();

  /* ---------------- Сөздік жаттығуы ---------------- */
  (function vocab() {
    const box = $("#ls-vocab"); let k = 0, order = I.shuffle(L.vocab);
    function paintV() {
      const v = order[k % order.length]; box.textContent = "";
      const fb = h("div", { "aria-live": "polite" });
      const opts = I.shuffle(L.vocab.map((x) => x.w)).slice(0, 4);
      if (!opts.includes(v.w)) opts[0] = v.w;
      box.append(h("p", { class: "ie-qcard", lang: "en" }, v.s), h("div", { class: "lab-choice", role: "group", "aria-label": "Бос орынға сөз" }, ...I.shuffle(opts).map((o) => h("button", { type: "button", onclick: (e) => {
        const ok = o === v.w; $$("button", e.target.parentNode).forEach((b) => { b.disabled = true; if (b.textContent === v.w) b.classList.add("ok"); });
        if (!ok) e.target.classList.add("no");
        I.record("ielts.listening.vocab", { item: v.w, ok, error: ok ? "" : "collocation", note: v.kk, title: "IELTS Listening: сөздік" });
        const g = L.vocab.find((x) => x.w === o);
        I.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс: ${v.w} - ${v.kk}` : `Дұрысы: ${v.w} (${v.kk})`, ok ? "Бұл тіркес диалогта дәл осылай естілді." : `«${o}» - ${g ? g.kk : ""}; бұл сөйлемнің мағынасына сай емес.`);
        fb.append(h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { k++; paintV(); } }, "Келесі сөйлем"));
      } }, o))), fb);
    }
    paintV();
  })();

  /* ---------------- Fallback ---------------- */
  if (!TTS) {
    $("#ls-fallback").hidden = false;
    showTranscript(true); trBtn.disabled = true;
    $$("[name=ls-mode]").forEach((r) => { r.disabled = true; });
    now.textContent = "Дауыс синтезі қолжетімсіз - оқу режимі.";
  } else showTranscript(false);
  setMode("practice");
  if (!TTS) { showTranscript(true); trBtn.disabled = true; }
  window.addEventListener("pagehide", () => { if (TTS) stopSpeech(); });
  ["ielts.listening.form", "ielts.listening.mc"].forEach((s, i) => { const b = $("#ls-badge" + i); if (b && window.AO17Tutor) AO17Tutor.badge(b, s, i ? "Көп таңдау" : "Форма толтыру"); });
})();
