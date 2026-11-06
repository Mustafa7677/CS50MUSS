/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Listening Test (AO17): 4 бөлім, 40 сұрақ; speechSynthesis (en-GB басым, әр сөйлеушіге бөлек дауыс/биіктік).
   Жаттығу режимі: бөлім бойынша, қайталау, жылдамдық, транскрипт, бірден түсіндірме және дәлел-жолға секіру.
   Тест режимі: бөлімдер ретімен бір рет қана, әр бөлім алдында 30 с оқу уақыты, жалпы таймер, тексеру тек соңында,
   кейін толық шолу (транскрипт + әр сұрақтың түсіндірмесі). Нәтиже - тек 40-тан шикі балл; band-ке аудару берілмейді.
   speechSynthesis жоқ болса - адал оқу режимі (транскрипт), тест режимі өшірулі.
   AO17Tutor: ielts.listening.form, ielts.listening.mc, ielts.listening.map, ielts.listening.matching, ielts.listening.notes,
   ielts.listening.fulltest, ielts.listening.directions. */
(() => {
  "use strict";
  const D = window.IELTS_LT, I = window.IELTS, V = window.IELTS_LT_VALIDATE, M = window.IELTS_LT_MAP;
  if (!D || !I || !V || !M) return;
  const { $, $$, h } = I;
  const root = $("[data-ielts-lt]");
  if (!root) return;
  const TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const CFG = Object.assign({ read: 30, check: 120, gap: 380 }, window.__LT_CFG || {}); // __LT_CFG - тек тесттер үшін (қысқа уақыт)
  const PARTS = D.parts;
  const SKILL = { form: "ielts.listening.form", mc: "ielts.listening.mc", map: "ielts.listening.map", match: "ielts.listening.matching", notes: "ielts.listening.notes" };
  const SKILL_KK = { form: "форма толтыру", mc: "көп таңдау", map: "карта белгілеу", match: "пікірді сөйлеушіге сәйкестендіру", notes: "конспект толтыру" };
  const QS = []; // { q, g, p (0-3) }
  PARTS.forEach((pt, pi) => pt.groups.forEach((g) => g.qs.forEach((q) => QS.push({ q, g, p: pi }))));
  const lineSec = (ln) => Math.max(1.5, I.words(ln.say || ln.t) / 2.6);
  const segSec = PARTS.map((pt) => pt.segs.map((sg) => sg.lines.reduce((a, ln) => a + lineSec(ln) + 0.4, 0)));
  const partSec = segSec.map((a) => a.reduce((x, y) => x + y, 0));
  const LETTER = (i) => "ABCDEFGH"[i];

  /* ================= Дауыстар ================= */
  const FEM = /female|woman|libby|sonia|hazel|kate|serena|susan|fiona|martha|amy|emma|mia|maisie|bella|olivia|stephanie/i;
  const MAL = /\bmale\b|daniel|george|arthur|ryan|oliver|thomas|alfie|elliot|noah|harry|james|guy/i;
  let VOICES = {}, NARR = null, gbFound = false;
  function pickVoices() {
    if (!TTS) return;
    const vs = speechSynthesis.getVoices() || [];
    const gb = vs.filter((v) => /^en[-_]GB/i.test(v.lang)), en = vs.filter((v) => /^en/i.test(v.lang));
    gbFound = gb.length > 0;
    const pool = gb.length ? gb : en;
    NARR = pool[0] || null;
    VOICES = {};
    PARTS.forEach((pt, pi) => {
      const used = new Set();
      for (const [id, sp] of Object.entries(pt.speakers)) {
        const fits = (v) => (sp.g === "f" ? FEM.test(v.name) : MAL.test(v.name) && !FEM.test(v.name));
        const v = pool.find((x) => fits(x) && !used.has(x)) || pool.find((x) => !used.has(x)) || pool[0] || null;
        if (v) used.add(v);
        VOICES[pi + ":" + id] = v;
      }
    });
    paintVoices();
  }
  function paintVoices() {
    const el = $("#lt-voices"); if (!el) return;
    if (!TTS) { el.textContent = ""; return; }
    const pt = PARTS[st.p];
    const list = Object.entries(pt.speakers).map(([id, sp]) => { const v = VOICES[st.p + ":" + id]; return `${sp.name} - ${v ? v.name : "әдепкі дауыс"} (биіктік ${sp.pitch})`; });
    el.textContent = `Дауыстар: ${list.join("; ")}.${gbFound ? "" : " en-GB дауысы табылмады - басқа ағылшын дауысы қолданылды."} Бір дауыс қайталанса, сөйлеушілер дауыс биіктігімен ажыратылады.`;
  }

  /* ================= Күй ================= */
  const st = { p: 0, seg: 0, line: 0, playing: false, onlySeg: false, token: 0, speed: 1, mode: "practice",
    test: { phase: "idle", done: false }, checked: [false, false, false, false] };
  const testLocked = () => st.mode === "test" && !st.test.done;

  /* ================= Беттің бөліктері ================= */
  const tabs = $("#lt-tabs"), now = $("#lt-now"), tl = $("#lt-tl"), ptime = $("#lt-ptime");
  const bPlay = $("#lt-play"), bPrev = $("#lt-prev"), bNext = $("#lt-next"), bRep = $("#lt-replay"), speedSel = $("#lt-speed");
  const tabBtns = PARTS.map((pt, pi) => {
    const b = h("button", { type: "button", role: "tab", id: `lt-tab-${pi + 1}`, "aria-controls": `lt-panel-${pi + 1}`, "aria-selected": String(pi === 0), tabindex: pi === 0 ? "0" : "-1", onclick: () => selectPart(pi, true) }, `Part ${pt.n}`, h("span", { class: "ie-sr" }, ` - ${pt.kk}`));
    tabs.append(b); return b;
  });
  tabs.addEventListener("keydown", (e) => {
    const i = tabBtns.indexOf(document.activeElement); if (i < 0) return;
    const j = e.key === "ArrowRight" ? (i + 1) % 4 : e.key === "ArrowLeft" ? (i + 3) % 4 : e.key === "Home" ? 0 : e.key === "End" ? 3 : -1;
    if (j < 0) return; e.preventDefault(); selectPart(j, true); tabBtns[j].focus();
  });

  /* ---------- Сұрақтар ---------- */
  const F = {}; // n → { inp | sel | fs, fb, row }
  function evRow(n) { return h("div", { class: "lt-evrow", hidden: true, "data-ev": String(n) }); }
  function buildPanel(pt, pi) {
    const panel = $(`#lt-panel-${pi + 1}`);
    panel.append(h("p", { class: "lt-ctx" }, h("b", null, `Part ${pt.n}. `), pt.kk));
    pt.groups.forEach((g) => {
      const box = h("div", { class: "ie-group lt-group", "data-type": g.type });
      box.append(h("h3", null, `${g.from}-${g.to} сұрақтар · ${SKILL_KK[g.type]}`));
      box.append(h("p", { class: "ie-instr", lang: "en" }, g.instr + (g.lim ? " " + D.limits[g.lim].en : "")));
      if (g.type === "form") {
        const form = h("div", { class: "ie-form lt-form" }, h("h4", { lang: "en" }, g.head));
        g.qs.forEach((q) => {
          const inp = h("input", { type: "text", class: "ie-gap", id: `lt-a${q.n}`, autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
          const fb = h("div", { class: "ie-qfb", id: `lt-fb${q.n}`, "aria-live": "polite" });
          form.append(h("div", { class: "ie-frow" },
            h("span", { lang: "en" }, h("label", { for: inp.id }, q.label), h("span", { class: "ie-sr" }, ` (${q.n}-сұрақ)`)),
            h("span", { class: "ie-fv", lang: "en" }, q.pre ? q.pre + " " : "", h("b", { class: "ie-gapn", "aria-hidden": "true" }, String(q.n)), inp, q.post ? (/^[,.]/.test(q.post) ? "" : " ") + q.post : ""),
            fb, evRow(q.n)));
          F[q.n] = { inp, fb };
        });
        box.append(form);
      } else if (g.type === "notes") {
        const notes = h("div", { class: "ie-form lt-notes" }, h("h4", { lang: "en" }, g.head));
        g.sections.forEach((sec) => {
          notes.append(h("p", { class: "lt-nh", lang: "en" }, sec.h));
          const ul = h("ul", { lang: "en" });
          g.qs.filter((q) => q.n >= sec.from && q.n <= sec.to).forEach((q) => {
            const inp = h("input", { type: "text", class: "ie-gap", id: `lt-a${q.n}`, autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": `${q.n}-сұрақ: ${q.pre} ... ${q.post}` });
            const fb = h("div", { class: "ie-qfb", id: `lt-fb${q.n}`, "aria-live": "polite", lang: "kk" });
            ul.append(h("li", null, h("span", { class: "lt-nl" }, q.pre + " ", h("b", { class: "ie-gapn", "aria-hidden": "true" }, String(q.n)), inp, q.post ? " " + q.post : ""), fb, evRow(q.n)));
            F[q.n] = { inp, fb };
          });
          notes.append(ul);
        });
        box.append(notes);
      } else if (g.type === "mc") {
        g.qs.forEach((q) => {
          const fb = h("div", { class: "ie-qfb", id: `lt-fb${q.n}`, "aria-live": "polite" });
          const fs = h("fieldset", { class: "ie-q ie-mcq", id: `lt-a${q.n}` },
            h("legend", { lang: "en" }, `${q.n}. ${q.q}`),
            h("ul", { class: "ie-mc", lang: "en" }, ...q.opts.map((o, oi) => h("li", null, h("label", null, h("input", { type: "radio", name: `lt-r${q.n}`, value: String(oi) }), h("b", null, LETTER(oi)), " " + o)))), fb, evRow(q.n));
          box.append(fs); F[q.n] = { fs, fb };
        });
      } else if (g.type === "map") {
        const wrap = h("div", { class: "lt-mapgrid" });
        const board = h("div", { class: "lab-board lt-mapboard" });
        board.append(M.draw({ id: "lt-map-q", title: "Westmoor Country Park" }));
        const list = h("div", { class: "lt-maplist" });
        g.qs.forEach((q) => {
          const sel = h("select", { class: "ie-sel lt-msel", id: `lt-a${q.n}` }, h("option", { value: "" }, "-"), ...M.letters.map((L) => h("option", { value: L }, L)));
          const fb = h("div", { class: "ie-qfb", id: `lt-fb${q.n}`, "aria-live": "polite" });
          list.append(h("div", { class: "lt-mrow" }, h("label", { for: sel.id, lang: "en" }, h("b", null, `${q.n}. `), q.label), sel, fb, evRow(q.n)));
          F[q.n] = { sel, fb };
        });
        wrap.append(board, list); box.append(wrap);
      } else if (g.type === "match") {
        box.append(h("div", { class: "lt-opts", lang: "en" }, h("b", null, "People"), h("ul", null, ...Object.entries(g.opts).map(([k, v]) => h("li", null, h("b", null, k), " " + v)))));
        g.qs.forEach((q) => {
          const sel = h("select", { class: "ie-sel lt-msel", id: `lt-a${q.n}` }, h("option", { value: "" }, "-"), ...Object.keys(g.opts).map((k) => h("option", { value: k }, `${k} - ${g.opts[k]}`)));
          const fb = h("div", { class: "ie-qfb", id: `lt-fb${q.n}`, "aria-live": "polite" });
          box.append(h("div", { class: "lt-mrow" }, h("label", { for: sel.id, lang: "en" }, h("b", null, `${q.n}. `), q.s), sel, fb, evRow(q.n)));
          F[q.n] = { sel, fb };
        });
      }
      panel.append(box);
    });
    // Бөлімді тексеру (жаттығу) + көмек
    const ctl = h("div", { class: "lab-row lt-pctl" },
      h("button", { type: "button", class: "btn gold lt-pcheck", id: `lt-check-${pi + 1}`, onclick: () => checkPart(pi) }, `Part ${pt.n}-ді тексеру`),
      h("button", { type: "button", class: "btn secondary", onclick: () => resetPart(pi) }, "Жауаптарды тазалау"),
      h("button", { type: "button", class: "btn secondary lt-trbtn", id: `lt-trbtn-${pi + 1}`, "aria-controls": `lt-tr-${pi + 1}`, "aria-expanded": "false", onclick: () => showTr(pi, $(`#lt-tr-${pi + 1}`).hidden) }, "Транскриптті көрсету"));
    panel.append(ctl, h("div", { class: "lt-pout", id: `lt-pout-${pi + 1}`, "aria-live": "polite" }), h("div", { class: "lt-hints", id: `lt-hints-${pi + 1}` }));
    // Транскрипт
    const tr = h("div", { class: "ie-tr lt-tr", id: `lt-tr-${pi + 1}`, hidden: true, tabindex: "0", "aria-label": `Part ${pt.n} транскрипті` });
    pt.segs.forEach((sg, si) => {
      tr.append(h("p", { class: "ie-segh" }, `${si + 1}-бөлік`));
      sg.lines.forEach((ln, li) => {
        const sp = pt.speakers[ln.w];
        tr.append(h("div", { class: "ie-line", id: `lt-l-${pi}-${si}-${li}`, lang: "en" },
          h("span", { class: "ie-who lt-who-" + Object.keys(pt.speakers).indexOf(ln.w), lang: "kk" }, sp.name),
          h("p", null, ln.t),
          TTS ? h("button", { type: "button", class: "lt-from", "aria-label": `Part ${pt.n}, ${si + 1}-бөлік: осы жолдан тыңдау`, onclick: () => playFrom(pi, si, li, false) }, "▶") : ""));
      });
    });
    panel.append(tr);
  }
  PARTS.forEach(buildPanel);
  function showTr(pi, on) {
    const tr = $(`#lt-tr-${pi + 1}`), b = $(`#lt-trbtn-${pi + 1}`);
    if (on && testLocked()) return;
    tr.hidden = !on; b.setAttribute("aria-expanded", String(on)); b.textContent = on ? "Транскриптті жасыру" : "Транскриптті көрсету";
  }

  /* ---------- Көмек (әр бөлімге үш деңгей) ---------- */
  const HINTS = [
    ["Әр бос орынның алдындағы/кейінгі сөзге қараңыз: сан ба, атау ма, күн бе? Тыңдағанда «no», «actually», «used to», «but» сөздерін аңдыңыз - олардан кейін ақпарат өзгереді.",
      "Ұқсас мысал: «We meet on Mondays - well, we used to; now it's Wednesdays.» Жауап: Wednesdays. «Is that C-K? - No, just K.» Жауап әріптелгені бойынша.",
      "Қадамдап: 1) Fenwich түзетілді → Fenwick. 2) Mill Lane емес → Mill Street. 3) Saturday бас тартылды → Sunday. 4) mountain biking → leisure. 5) 40 бұрын, қазір 30. 6) станция бұрын, қазір library. 7) 23 жас < 25 → 36. 8) су бөтелкесі міндетті емес → lights. 9) 2-сі толы → 9. 10) постер емес, алғаш - colleague."],
    ["MC-де үш нұсқаның бәрі жазбада аталуы мүмкін - қайсысы ҚАЗІРГІ шындық екенін тыңдаңыз. Картада алдымен «You are here» мен бағытты (north) табыңыз: солтүстікке қарап тұрғанда сол = батыс.",
      "Ұқсас мысал: «People think it's a castle; in fact it was a prison.» Жауап: prison. «Turn left at the bridge» - солтүстікке қарап жүрсеңіз, көпірден батысқа бұрыласыз.",
      "Қадамдап: 11) In fact → quarry (B). 12) permit (C). 13) short of → school groups (B). 14) half past eight → evening (B). 15) near the lake (C). 16) B. 17) солға, соңы → C. 18) оңға, соңы → D. 19) қиылыстан кейін, солдағы кіші жол → G. 20) north shore → F."],
    ["Үш сөйлеуші бар: кім АЙТТЫ емес, кім КЕЛІСЕДІ - соны ажыратыңыз. «I'm not sure about...» = қарсы; «What I'm convinced about...» = нақты пікір.",
      "Ұқсас мысал: A: «We could use posters.» B: «Posters? Nobody reads them.» - «Posters won't work» деген пікір B-ге тиесілі, A-ға емес.",
      "Қадамдап: 21) Майяның жұмысы (B). 22) wording (B). 23) weighed (A). 24) vegetables came top (B). 25) a second week (B). 26) Maya (A). 27) Josh (B). 28) Josh (B). 29) Dr Price (C). 30) Dr Price (C)."],
    ["Дәрістің құрылымын қолданыңыз: «types → benefits → our study → future». Конспектте синоним болады: held back = kept, as much as = up to.",
      "Ұқсас мысал: «We had expected rain to be the problem, but it was the wind that damaged the crops.» → «Crops damaged by ___» = wind.",
      "Қадамдап: 31) succulents. 32) structure. 33) 70 (жаз). 34) heat. 35) insects (birds емес). 36) ultraviolet. 37) noise (also). 38) drought (frost емес). 39) native. 40) grants (taxes бас тартылды)."],
  ];
  const hintApi = PARTS.map((pt, pi) => (window.AO17Tutor ? AO17Tutor.hints($(`#lt-hints-${pi + 1}`), HINTS[pi], { onSolution: () => {
    const o = $(`#lt-pout-${pi + 1}`);
    I.feedback(o, "info", "Шешім ашылды", "Бұл бөлімнің жауаптары енді меңгеру ретінде есептелмейді (AO17Tutor көмек санын жазады). Келесі қадам: тест режимінде басқа бөлімдерді көмексіз орындаңыз немесе төмендегі «Бағыт жаттығуында» жаңа тапсырма шешіңіз.");
  } }) : null));

  /* ================= Ойнатқыш ================= */
  let segBtns = [];
  function buildTimeline() {
    tl.textContent = "";
    segBtns = PARTS[st.p].segs.map((sg, si) => {
      const b = h("button", { type: "button", class: "ie-seg", style: `--w:${segSec[st.p][si].toFixed(1)}`, "aria-label": `${si + 1}-бөлік, ≈ ${Math.round(segSec[st.p][si])} секунд`, onclick: () => playFrom(st.p, si, 0, false) }, h("i", { class: "ie-fill" }), h("span", null, String(si + 1)));
      tl.append(b); return b;
    });
  }
  function elapsed() { let t = 0; for (let i = 0; i < st.seg; i++) t += segSec[st.p][i]; const sg = PARTS[st.p].segs[st.seg]; for (let j = 0; j < st.line && sg; j++) t += lineSec(sg.lines[j]) + 0.4; return t; }
  function paint() {
    const lock = testLocked();
    segBtns.forEach((b, i) => {
      const n = PARTS[st.p].segs[i].lines.length;
      b.style.setProperty("--p", (i < st.seg ? 100 : i > st.seg ? 0 : Math.round(100 * Math.min(st.line, n) / n)) + "%");
      b.setAttribute("aria-current", String(i === st.seg));
      b.disabled = !TTS || lock;
    });
    ptime.textContent = `Part ${st.p + 1}: ≈ ${I.fmt(elapsed() / st.speed)} / ${I.fmt(partSec[st.p] / st.speed)}`;
    bPlay.textContent = st.playing ? "❚❚ Кідірту" : "▶ Ойнату";
    bPlay.setAttribute("aria-label", st.playing ? "Кідірту" : "Ойнату");
    bPlay.disabled = !TTS || lock;
    [bPrev, bNext, bRep, speedSel].forEach((x) => { x.disabled = !TTS || lock; });
    $$(".lt-from").forEach((x) => { x.disabled = lock; });
    $$(".ie-line.on").forEach((x) => x.classList.remove("on"));
    const cur = $(`#lt-l-${st.p}-${st.seg}-${st.line}`);
    if (cur && st.playing && !lock) cur.classList.add("on");
    $$(".lt-pctl").forEach((x) => { x.hidden = st.mode === "test"; });
    $$(".lt-hints").forEach((x) => { x.hidden = st.mode === "test"; });
  }
  function stopSpeech() { st.token++; if (TTS) try { speechSynthesis.cancel(); } catch (e) { /* жоқ */ } }
  /** Бір сөйлем айту; onend токенмен қорғалған. */
  function utter(text, voice, pitch, rate, done) {
    const tok = st.token;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : "en-GB"; if (voice) u.voice = voice;
    u.pitch = pitch; u.rate = rate;
    u.onend = () => { if (tok === st.token) done(); };
    u.onerror = (e) => { if (tok !== st.token) return; if (e && (e.error === "interrupted" || e.error === "canceled")) return; done(e || true); };
    try { speechSynthesis.speak(u); } catch (e) { done(e); }
  }
  let afterPart = null; // тест режимінде бөлім біткенде шақырылады
  function speakLine() {
    const pt = PARTS[st.p], sg = pt.segs[st.seg];
    if (!sg) return endPart();
    if (st.line >= sg.lines.length) {
      if (st.onlySeg) { st.playing = false; st.onlySeg = false; st.line = 0; now.textContent = `Part ${st.p + 1}, ${st.seg + 1}-бөлік қайталанды.`; paint(); return; }
      st.seg++; st.line = 0;
      if (!pt.segs[st.seg]) return endPart();
    }
    const ln = pt.segs[st.seg].lines[st.line], sp = pt.speakers[ln.w];
    now.textContent = "";
    now.append(h("b", null, `Part ${st.p + 1} · ${st.seg + 1}-бөлік · `), testLocked() ? "тыңдаңыз…" : `${sp.name}: ${ln.t}`);
    paint();
    const tok = st.token;
    utter(ln.say || ln.t, VOICES[st.p + ":" + ln.w], sp.pitch, sp.rate * st.speed, (err) => {
      if (!st.playing) return;
      if (err && err !== true && err.error) { st.playing = false; now.textContent = "Дауыс синтезінде қате шықты. Қайта ойнатып көріңіз немесе транскриптпен оқу режимін қолданыңыз."; paint(); return; }
      st.line++; paint();
      setTimeout(() => { if (tok === st.token && st.playing) speakLine(); }, CFG.gap);
    });
  }
  function endPart() {
    st.playing = false; st.seg = PARTS[st.p].segs.length - 1; st.line = PARTS[st.p].segs[st.seg].lines.length;
    paint();
    if (afterPart) { const f = afterPart; afterPart = null; f(); return; }
    now.textContent = `Part ${st.p + 1} жазбасы аяқталды.`;
  }
  function play() { if (!TTS) return; stopSpeech(); st.playing = true; speakLine(); }
  function pause() { st.playing = false; stopSpeech(); now.textContent = `Кідіртілді: Part ${st.p + 1}, ${st.seg + 1}-бөлік. «Ойнату» осы жолдан жалғастырады.`; paint(); }
  function playFrom(pi, si, li, onlySeg) {
    if (!TTS || testLocked()) return;
    if (pi !== st.p) selectPart(pi, false);
    st.seg = si; st.line = li; st.onlySeg = onlySeg; play();
  }
  bPlay.addEventListener("click", () => {
    if (testLocked()) return;
    if (st.playing) return pause();
    const pt = PARTS[st.p]; if (!pt.segs[st.seg] || st.line >= pt.segs[st.seg].lines.length && st.seg >= pt.segs.length - 1) { st.seg = 0; st.line = 0; }
    st.onlySeg = false; play();
  });
  bRep.addEventListener("click", () => playFrom(st.p, st.seg, 0, true));
  bPrev.addEventListener("click", () => playFrom(st.p, Math.max(0, st.seg - (st.line === 0 ? 1 : 0)), 0, false));
  bNext.addEventListener("click", () => playFrom(st.p, Math.min(PARTS[st.p].segs.length - 1, st.seg + 1), 0, false));
  speedSel.addEventListener("change", () => { st.speed = +speedSel.value; if (st.playing) { stopSpeech(); st.playing = true; speakLine(); } else paint(); });

  function selectPart(pi, user) {
    if (user && st.playing && !testLocked()) pause();
    const changed = pi !== st.p;
    tabBtns.forEach((b, i) => { b.setAttribute("aria-selected", String(i === pi)); b.tabIndex = i === pi ? 0 : -1; });
    PARTS.forEach((_, i) => { $(`#lt-panel-${i + 1}`).hidden = i !== pi; });
    if (changed || !segBtns.length) { if (!testLocked() || st.test.phase === "idle") { st.p = pi; st.seg = 0; st.line = 0; buildTimeline(); paintVoices(); } }
    if (testLocked()) { /* тестте ойнатқыш ағымдағы бөлімде қалады; оқушы басқа бөлімнің сұрақтарын көре алады */ }
    paint();
  }

  /* ================= Тексеру ================= */
  function answerOf(q) {
    const f = F[q.n];
    if (f.inp) return f.inp.value;
    if (f.sel) return f.sel.value;
    const r = $("input:checked", f.fs); return r ? +r.value : -1;
  }
  function correctText(x) {
    const { q, g } = x;
    if (g.type === "mc") return `${LETTER(q.a)} (${q.opts[q.a]})`;
    if (g.type === "match") return `${q.a} (${g.opts[q.a]})`;
    if (g.type === "map") return q.a;
    return q.a[0];
  }
  function result(x) { const a = answerOf(x.q); return x.g.lim ? V.gap(x.q, a, D.limits[x.g.lim]) : V.choice(x.q, a); }
  function markLines(x, ok) {
    const [s1, l1] = x.q.key; const k = $(`#lt-l-${x.p}-${s1}-${l1}`); if (k) { k.classList.add("ie-key"); k.dataset.q = (k.dataset.q ? k.dataset.q + ", " : "") + "№" + x.q.n; }
    if (x.q.trap && !(x.q.trap[0] === s1 && x.q.trap[1] === l1)) { const t = $(`#lt-l-${x.p}-${x.q.trap[0]}-${x.q.trap[1]}`); if (t) t.classList.add("lt-trap"); }
    if (!ok && k) k.classList.add("ie-flag");
  }
  function jumpTo(x) {
    if (testLocked()) return;
    selectPart(x.p, true);
    showTr(x.p, true);
    const el = $(`#lt-l-${x.p}-${x.q.key[0]}-${x.q.key[1]}`); if (!el) return;
    $$(".lt-focus").forEach((e) => e.classList.remove("lt-focus"));
    el.classList.add("lt-focus");
    el.scrollIntoView({ block: "nearest", behavior: I.reduced() ? "auto" : "smooth" });
  }
  function showFeedback(x, r) {
    const { q, g } = x, f = F[q.n];
    const ctl = f.inp || f.sel; if (ctl) { ctl.classList.toggle("ok", r.ok); ctl.classList.toggle("no", !r.ok); }
    if (f.fs) $$("label", f.fs).forEach((lb, i) => lb.classList.toggle("ok", i === q.a));
    const tail = r.ok ? "" : ` Дұрыс жауап: ${correctText(x)}.`;
    I.feedback(f.fb, r.ok ? "ok" : "bad", r.ok ? `${q.n}. Дұрыс` : `${q.n}. ${r.title}`, (r.ok ? q.why : (r.why === q.why ? q.why : `${r.why} ${q.why}`)) + tail);
    const ev = $(`[data-ev="${q.n}"]`); ev.hidden = false; ev.textContent = "";
    ev.append(h("button", { type: "button", class: "ie-evbtn", onclick: () => jumpTo(x) }, `Дәлелді транскрипттен көрсету (Part ${x.p + 1}, ${q.key[0] + 1}-бөлік)`));
    if (TTS) ev.append(h("button", { type: "button", class: "ie-evbtn", onclick: () => playFrom(x.p, q.key[0], 0, true) }, "Осы бөлікті қайта тыңдау"));
    markLines(x, r.ok);
    void g;
  }
  function recordQ(x, r, hints) {
    I.record(SKILL[x.g.type], { item: "lt" + x.q.n, ok: r.ok, hints, error: r.ok ? "" : r.code, note: r.ok ? "" : r.why, title: `IELTS Listening: ${SKILL_KK[x.g.type]}` });
  }
  function checkPart(pi) {
    if (st.mode === "test") return;
    if (st.playing) pause();
    const list = QS.filter((x) => x.p === pi); let ok = 0;
    $$(`#lt-tr-${pi + 1} .ie-line`).forEach((e) => e.classList.remove("ie-key", "ie-flag", "lt-trap", "lt-focus"));
    list.forEach((x) => { const r = result(x); if (r.ok) ok++; showFeedback(x, r); recordQ(x, r, hintApi[pi] ? hintApi[pi].used() : 0); });
    st.checked[pi] = true;
    showTr(pi, true);
    const first = list.find((x) => !result(x).ok);
    I.feedback($(`#lt-pout-${pi + 1}`), ok === list.length ? "ok" : "info", `Part ${pi + 1}: ${ok} / ${list.length}`,
      "Жаттығу нәтижесі - ресми бағалау емес. Транскриптте жасыл жиек - дәлел жолы, қызыл - қате кеткен сұрақтың жолы, үзік сызық - тұзақ айтылған жол." + (first ? ` Бірінші қате: ${first.q.n}-сұрақ.` : " Келесі бөлімге өтіңіз немесе тест режимін байқап көріңіз."));
  }
  function resetPart(pi) {
    QS.filter((x) => x.p === pi).forEach(({ q }) => {
      const f = F[q.n];
      if (f.inp) f.inp.value = ""; if (f.sel) f.sel.value = "";
      if (f.fs) { $$("input", f.fs).forEach((r) => { r.checked = false; }); $$("label", f.fs).forEach((l) => l.classList.remove("ok")); }
      [f.inp, f.sel].forEach((c) => c && c.classList.remove("ok", "no"));
      f.fb.className = "ie-qfb"; f.fb.textContent = "";
      const ev = $(`[data-ev="${q.n}"]`); ev.hidden = true; ev.textContent = "";
    });
    $$(`#lt-tr-${pi + 1} .ie-line`).forEach((e) => { e.classList.remove("ie-key", "ie-flag", "lt-trap", "lt-focus"); delete e.dataset.q; });
    const o = $(`#lt-pout-${pi + 1}`); o.className = "lt-pout"; o.textContent = "";
    st.checked[pi] = false;
    if (pi === 1) M.route($("#lt-map-q"), null);
  }

  /* ================= Режимдер ================= */
  const modeMsg = $("#lt-mode-msg"), tbar = $("#lt-testbar"), phase = $("#lt-phase"), bStart = $("#lt-start"), bSubmit = $("#lt-submit");
  const totalT = I.timer($("#lt-total"), { seconds: 0 });
  let cd = null; // кері санау
  function setMode(m) {
    if (st.playing) pause();
    afterPart = null; if (cd) cd.stop(); totalT.stop();
    st.mode = m; st.test = { phase: "idle", done: false };
    $$("[name=lt-mode]").forEach((r) => { r.checked = r.value === m; });
    tbar.hidden = m !== "test";
    $("#lt-review").hidden = true;
    PARTS.forEach((_, pi) => { resetPart(pi); showTr(pi, false); });
    if (m === "test") {
      speedSel.value = "1"; st.speed = 1;
      bStart.hidden = false; bStart.disabled = false; bSubmit.hidden = true; delete bSubmit.dataset.confirm;
      totalT.reset(0); $("#lt-cd").textContent = "--:--";
      phase.textContent = "Дайын болғанда «Тестті бастау» батырмасын басыңыз. Бөлімдер ретімен бір рет қана ойнатылады.";
      modeMsg.textContent = "Тест режимі: әр бөлім алдында 30 секунд сұрақтарды оқу уақыты беріледі (хабарланады), жазба бір рет, кідіртусіз ойнатылады, транскрипт пен тексеру - тек соңында. Басқа бөлімдердің сұрақтарын қойындылардан көре аласыз.";
    } else {
      modeMsg.textContent = "Жаттығу режимі: бөлімді таңдаңыз, кідіртіңіз, бөлікті қайталаңыз, жылдамдықты өзгертіңіз, транскриптті ашыңыз. Әр бөлімді жеке тексеріп, бірден түсіндірме аласыз.";
    }
    st.p = -1; selectPart(0, false);
  }
  $$("[name=lt-mode]").forEach((r) => r.addEventListener("change", () => setMode(r.value)));

  function sayNarr(text, done) {
    if (!TTS) return done();
    stopSpeech();
    utter(text, NARR, 1, 0.95, () => done());
  }
  function countdown(sec, label, done) {
    const el = $("#lt-cd");
    if (cd) cd.stop();
    phase.textContent = label;
    cd = I.timer(el, { seconds: sec, lowAt: 10, onEnd: done });
    cd.start();
  }
  function runPart(pi) {
    st.test.phase = "intro"; st.p = pi; st.seg = 0; st.line = 0;
    tabBtns.forEach((b, i) => { b.setAttribute("aria-selected", String(i === pi)); b.tabIndex = i === pi ? 0 : -1; });
    PARTS.forEach((_, i) => { $(`#lt-panel-${i + 1}`).hidden = i !== pi; });
    buildTimeline(); paintVoices(); paint();
    phase.textContent = `Part ${pi + 1}: хабарландыру…`;
    now.textContent = PARTS[pi].intro;
    sayNarr(PARTS[pi].intro, () => {
      if (st.mode !== "test" || st.test.done) return;
      st.test.phase = "reading";
      countdown(CFG.read, `Part ${pi + 1}: сұрақтарды оқу уақыты (${PARTS[pi].groups[0].from}-${PARTS[pi].groups[PARTS[pi].groups.length - 1].to}).`, () => {
        if (st.mode !== "test" || st.test.done) return;
        st.test.phase = "playing";
        phase.textContent = `Part ${pi + 1}: тыңдаңыз - жазба бір рет қана.`;
        $("#lt-cd").textContent = "▶";
        afterPart = () => sayNarr(`That is the end of Part ${pi + 1}.`, () => {
          if (st.mode !== "test" || st.test.done) return;
          if (pi < PARTS.length - 1) runPart(pi + 1);
          else {
            st.test.phase = "checking";
            sayNarr(D.outro, () => { if (st.mode === "test" && !st.test.done) countdown(CFG.check, "Тыңдау аяқталды. Жауаптарыңызды тексеруге 2 минут бар - содан кейін жауаптар автоматты түрде тапсырылады.", submit); });
            bSubmit.textContent = "Жауаптарды тапсыру"; bSubmit.dataset.confirm = "1";
          }
        });
        play();
      });
    });
  }
  bStart.addEventListener("click", () => {
    if (st.mode !== "test" || !TTS) return;
    bStart.hidden = true; bSubmit.hidden = false; bSubmit.textContent = "Тестті ерте аяқтау"; delete bSubmit.dataset.confirm;
    PARTS.forEach((_, pi) => resetPart(pi));
    totalT.reset(0); totalT.start();
    runPart(0);
  });
  bSubmit.addEventListener("click", () => {
    if (!bSubmit.dataset.confirm) { bSubmit.dataset.confirm = "1"; bSubmit.textContent = "Иә, қазір аяқтау (жазба тоқтайды)"; return; }
    submit();
  });

  function submit() {
    if (st.mode !== "test" || st.test.done) return;
    afterPart = null; if (cd) cd.stop(); totalT.stop();
    st.playing = false; stopSpeech();
    st.test.done = true; st.test.phase = "done";
    bSubmit.hidden = true;
    const per = [0, 0, 0, 0], byType = {}; let total = 0;
    QS.forEach((x) => {
      const r = result(x);
      if (r.ok) { total++; per[x.p]++; }
      (byType[x.g.type] = byType[x.g.type] || [0, 0])[1]++; if (r.ok) byType[x.g.type][0]++;
      showFeedback(x, r); recordQ(x, r, 0);
    });
    I.record("ielts.listening.fulltest", { item: "test1", ok: total >= 30, note: `${total}/40`, title: "IELTS Listening: толық тест (40 сұрақ)" });
    phase.textContent = `Тест аяқталды. Уақыт: ${$("#lt-total").textContent}.`;
    $("#lt-cd").textContent = "--:--";
    const rv = $("#lt-review"); rv.hidden = false;
    $("#lt-score").textContent = `${total} / 40`;
    const tb = $("#lt-rv-parts"); tb.textContent = "";
    PARTS.forEach((pt, pi) => tb.append(h("tr", null, h("th", { scope: "row" }, `Part ${pt.n}`), h("td", null, pt.kk), h("td", null, `${per[pi]} / 10`))));
    const ty = $("#lt-rv-types"); ty.textContent = "";
    Object.entries(byType).forEach(([k, [a, b]]) => ty.append(h("li", null, `${SKILL_KK[k]}: `, h("b", null, `${a} / ${b}`))));
    const ql = $("#lt-rv-list"); ql.textContent = "";
    QS.forEach((x) => {
      const r = result(x), a = answerOf(x.q);
      const shown = x.g.type === "mc" ? (a >= 0 ? LETTER(a) : "-") : (String(a).trim() || "-");
      ql.append(h("li", { class: r.ok ? "ok" : "no" }, h("button", { type: "button", class: "ie-evbtn", onclick: () => { jumpTo(x); F[x.q.n].fb.scrollIntoView({ block: "nearest" }); } }, `№${x.q.n}`), ` ${r.ok ? "✓" : "✗"} сіз: «${shown}»`, r.ok ? "" : ` · дұрыс: ${correctText(x)}`));
    });
    modeMsg.textContent = "Шолу режимі: әр сұрақтың астында түсіндірме мен дәлел батырмасы бар; транскрипттер ашық, енді бөлікті қайта тыңдауға болады.";
    PARTS.forEach((_, pi) => showTr(pi, true));
    M.route($("#lt-map-q"), null);
    selectPart(0, false); st.p = 0; buildTimeline(); paint();
    rv.scrollIntoView({ block: "start", behavior: I.reduced() ? "auto" : "smooth" });
    $("#lt-score").focus();
  }
  $("#lt-again").addEventListener("click", () => setMode("test"));

  /* ================= Бағыт жаттығуы (жаңа тапсырма генераторы) ================= */
  (function directions() {
    const box = $("#lt-dir"); if (!box) return;
    const board = h("div", { class: "lab-board lt-mapboard" }); const svg = M.draw({ id: "lt-map-d", title: "Westmoor Country Park: бағыт жаттығуы" }); board.append(svg);
    const txt = h("p", { class: "ie-qcard lt-dirtext", lang: "en", hidden: TTS }, "");
    const fb = h("div", { "aria-live": "polite" });
    const choice = h("div", { class: "lab-choice", role: "group", "aria-label": "Қай әріп?" });
    const streakEl = h("p", { class: "lab-meta" });
    let cur = null, streak = 0, answered = false, helped = false;
    function speak() { if (!TTS || !cur) return; stopSpeech(); utter(cur.text, NARR, 1, 0.92 * st.speed, () => {}); }
    function next() {
      cur = M.gen(cur); answered = false; helped = false;
      txt.textContent = cur.text; txt.hidden = TTS;
      M.route(svg, cur.start, null);
      fb.textContent = ""; fb.className = "";
      choice.textContent = "";
      M.letters.forEach((L) => choice.append(h("button", { type: "button", "data-l": L, onclick: () => answer(L) }, L)));
      if (TTS) speak();
    }
    function answer(L) {
      if (answered || !cur) return; answered = true;
      const ok = L === cur.a;
      $$("button", choice).forEach((b) => { b.disabled = true; if (b.dataset.l === cur.a) b.classList.add("ok"); if (b.dataset.l === L && !ok) b.classList.add("no"); });
      const mark = { [cur.a]: "ok" }; if (!ok) mark[L] = "no";
      M.route(svg, cur.start, cur.a, mark);
      txt.hidden = false;
      streak = ok && !helped ? streak + 1 : 0;
      I.record("ielts.listening.directions", { item: `${cur.start}-${cur.a}`, ok, hints: helped ? 1 : 0, error: ok ? "" : "left-right", note: cur.text, title: "IELTS Listening: карта бағыттары" });
      I.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс: ${cur.a}` : `Дұрысы: ${cur.a} (сіз: ${L})`, cur.why + (ok ? "" : " Кеңес: картаны өз бағытыңызға қарай ойша бұрыңыз - оңтүстікке қарап тұрсаңыз, «left» картада оң жақта болады."));
      streakEl.textContent = `Көмексіз қатарынан дұрыс: ${streak}${streak >= 3 ? " - бағытты меңгердіңіз!" : " (мақсат: 3)"}`;
      fb.append(h("button", { type: "button", class: "btn secondary ie-sm", onclick: next }, "Жаңа тапсырма"));
    }
    const ctl = h("div", { class: "lab-row" },
      h("button", { type: "button", class: "btn gold", id: "lt-dir-new", onclick: next }, "Жаңа тапсырма"),
      TTS ? h("button", { type: "button", class: "btn secondary", onclick: speak }, "Қайта тыңдау") : "",
      TTS ? h("button", { type: "button", class: "btn secondary", onclick: () => { helped = true; txt.hidden = false; } }, "Мәтінді көрсету (көмек)") : "");
    box.append(h("div", { class: "lt-mapgrid" }, board, h("div", null, ctl, txt, choice, fb, streakEl, h("span", { id: "lt-badge-dir" }))));
    if (window.AO17Tutor) AO17Tutor.badge($("#lt-badge-dir"), "ielts.listening.directions", "Карта бағыттары");
    next();
  })();

  /* ================= Іске қосу ================= */
  if (TTS) { pickVoices(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pickVoices); }
  if (!TTS) {
    $("#lt-fallback").hidden = false;
    const tr = $$("[name=lt-mode]").find((r) => r.value === "test"); if (tr) tr.disabled = true;
  }
  setMode("practice");
  if (!TTS) { PARTS.forEach((_, pi) => showTr(pi, true)); now.textContent = "Дауыс синтезі қолжетімсіз - оқу режимі: транскрипт ашық."; }
  window.addEventListener("pagehide", () => stopSpeech());
  const bd = $("#lt-badges");
  if (bd && window.AO17Tutor) Object.entries(SKILL).forEach(([k, s]) => { const b = h("span"); bd.append(b, " "); AO17Tutor.badge(b, s, SKILL_KK[k]); });
  window.__LT = { st, QS, result, submit }; // тесттер үшін
})();
