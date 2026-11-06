/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Speaking Studio: Part 1 / Part 2 (1 мин дайындық + 2 мин сөйлеу) / Part 3 сұрақтары; MediaRecorder арқылы жазу -
   тек оқушы батырманы басып, браузер рұқсатын бергеннен кейін; жазбалар ТЕК осы құрылғыда (IndexedDB), бір-бірден не бәрін өшіруге болады.
   Өзін-өзі бағалау - ресми критерийлер атауымен рефлексия; ұзақтық пен үзілістер ешқашан бағаға айналдырылмайды.
   AO17Tutor: ielts.speaking.part1, ielts.speaking.part3 (жауапты дамыту тапсырмалары). */
(() => {
  "use strict";
  const D = window.IELTS_SPEAKING, I = window.IELTS;
  if (!D || !I) return;
  const { $, $$, h, store } = I;
  if (!$("[data-ielts-speaking]")) return;
  const TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  function say(text) {
    if (!TTS) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); const v = (speechSynthesis.getVoices() || []).find((x) => /^en[-_]GB/i.test(x.lang)); u.lang = v ? v.lang : "en-GB"; if (v) u.voice = v; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) { /* дыбыссыз жалғасады */ }
  }
  const sayBtn = (getText) => TTS ? h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => say(getText()) }, "Сұрақты тыңдау") : "";

  /* ================= Жергілікті қойма (IndexedDB) ================= */
  const DB = (() => {
    let dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise((res, rej) => {
        if (!window.indexedDB) { rej(new Error("no-idb")); return; }
        const r = indexedDB.open("ao17-ielts-speaking", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("recs", { keyPath: "id" });
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      return dbp;
    }
    const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("recs", mode); const out = fn(t.objectStore("recs")); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); };
    return {
      add: (rec) => tx("readwrite", (s) => s.put(rec)),
      all: () => tx("readonly", (s) => s.getAll()),
      del: (id) => tx("readwrite", (s) => s.delete(id)),
      clear: () => tx("readwrite", (s) => s.clear()),
    };
  })();

  /* ================= Микрофон және жазу ================= */
  const micMsg = $("#sp-mic-msg"), micBtn = $("#sp-mic"), recInd = $("#sp-rec-ind");
  const Rec = { stream: null, mr: null, chunks: [], meta: null, t0: 0, onDone: null };
  const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  function micState(kind, text) { I.feedback(micMsg, kind, text.title, text.why); }
  if (!canRecord()) {
    micBtn.disabled = true;
    micState("info", { title: "Бұл браузерде дыбыс жазу мүмкін емес", why: "MediaRecorder не микрофонға қол жеткізу жоқ. Жаттығуды жазбасыз жалғастыра аласыз: таймер, сұрақтар және өзін-өзі бағалау жұмыс істейді." });
  }
  micBtn.addEventListener("click", async () => {
    if (Rec.stream) { Rec.stream.getTracks().forEach((t) => t.stop()); Rec.stream = null; micBtn.textContent = "Микрофонды қосу"; micState("info", { title: "Микрофон өшірілді", why: "Жазу мүмкіндігі тоқтатылды." }); paintRecBtns(); return; }
    micState("info", { title: "Рұқсат сұралуда…", why: "Браузер терезесінде «Рұқсат беру» (Allow) батырмасын басыңыз." });
    try {
      Rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micBtn.textContent = "Микрофонды өшіру";
      micState("ok", { title: "Микрофон қосулы", why: "Енді «Жазуды бастау» батырмалары белсенді. Жазба тек сіз басқанда басталады және тек осы құрылғыда сақталады." });
    } catch (e) {
      const n = e && e.name;
      micState("bad", n === "NotAllowedError" || n === "SecurityError"
        ? { title: "Микрофонға рұқсат берілмеді", why: "Жазусыз да жаттыға аласыз. Рұқсатты кейін браузердің мекенжай жолағындағы құлып белгішесінен өзгертуге болады." }
        : n === "NotFoundError" || n === "OverconstrainedError"
          ? { title: "Микрофон табылмады", why: "Құрылғыға микрофон қосылмаған сияқты. Таймер мен сұрақтар жазусыз да жұмыс істейді." }
          : { title: "Микрофонды қосу мүмкін болмады", why: (e && e.message) || "Белгісіз қате. Жазусыз жалғастыра аласыз." });
    }
    paintRecBtns();
  });
  function startRec(meta, onDone) {
    if (!Rec.stream || Rec.mr) return false;
    try { Rec.mr = new MediaRecorder(Rec.stream); } catch (e) { micState("bad", { title: "Жазу басталмады", why: e.message }); return false; }
    Rec.chunks = []; Rec.meta = meta; Rec.t0 = Date.now(); Rec.onDone = onDone;
    Rec.mr.ondataavailable = (e) => { if (e.data && e.data.size) Rec.chunks.push(e.data); };
    Rec.mr.onstop = async () => {
      const type = (Rec.mr && Rec.mr.mimeType) || "audio/webm";
      const blob = new Blob(Rec.chunks, { type });
      const rec = { id: "r" + Date.now(), t: Date.now(), dur: Math.round((Date.now() - Rec.t0) / 1000), type, blob, ...Rec.meta };
      Rec.mr = null; recInd.hidden = true; paintRecBtns();
      try { await DB.add(rec); listRecs(); } catch (e) { micState("bad", { title: "Жазба сақталмады", why: "Браузер жергілікті қоймаға (IndexedDB) рұқсат бермеді - мысалы, жеке режимде." }); }
      if (Rec.onDone) Rec.onDone(rec);
    };
    Rec.mr.start(); recInd.hidden = false; paintRecBtns();
    return true;
  }
  function stopRec() { if (Rec.mr && Rec.mr.state !== "inactive") Rec.mr.stop(); }
  const recBtns = [];
  function recButton(getMeta) {
    const b = h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { if (Rec.mr) stopRec(); else if (startRec(getMeta())) { b.dataset.active = "1"; paintRecBtns(); } } });
    recBtns.push(b); paintOne(b); return b;
  }
  function paintOne(b) { b.disabled = !Rec.stream || (!!Rec.mr && b.dataset.active !== "1"); b.textContent = Rec.mr && b.dataset.active === "1" ? "■ Жазуды тоқтату" : "● Жазуды бастау"; }
  function paintRecBtns() { recBtns.forEach((b) => { if (!Rec.mr) b.dataset.active = ""; paintOne(b); }); }

  async function listRecs() {
    const ul = $("#sp-recs"); let all = [];
    try { all = (await DB.all()) || []; } catch (e) { ul.textContent = ""; ul.append(h("li", null, h("span", null, "Жергілікті қойма (IndexedDB) қолжетімсіз - жазбаларды сақтау мүмкін емес."))); return; }
    all.sort((a, b) => b.t - a.t);
    $$("audio", ul).forEach((a) => URL.revokeObjectURL(a.src));
    ul.textContent = "";
    if (!all.length) { ul.append(h("li", null, h("span", null, "Жазба жоқ."))); $("#sp-del-all").disabled = true; return; }
    $("#sp-del-all").disabled = false;
    all.forEach((r) => {
      ul.append(h("li", null, h("span", null, h("b", null, `Part ${r.part}`), " · ", h("span", { lang: "en" }, r.q), h("small", null, `${new Date(r.t).toLocaleString("kk-KZ", { dateStyle: "short", timeStyle: "short" })} · ұзақтығы ${I.fmt(r.dur)}`)),
        h("button", { type: "button", class: "btn secondary ie-sm", "aria-label": "Жазбаны өшіру", onclick: async () => { await DB.del(r.id); listRecs(); } }, "Өшіру"),
        h("audio", { controls: true, src: URL.createObjectURL(r.blob), preload: "none", "aria-label": `Part ${r.part} жазбасы` })));
    });
  }
  $("#sp-del-all").addEventListener("click", async () => { if (!confirm("Барлық жазбаны осы құрылғыдан өшіреміз бе? Бұл қайтарылмайды.")) return; await DB.clear(); listRecs(); });
  listRecs();

  /* ================= Part 1 ================= */
  (function part1() {
    const sel = $("#sp-p1-topic"), card = $("#sp-p1-q"), ctl = $("#sp-p1-ctl"), tEl = $("#sp-p1-t");
    D.part1.forEach((t, i) => sel.append(h("option", { value: String(i) }, `${t.topic} · ${t.kk}`)));
    let ti = 0, qi = 0;
    const tm = I.timer(tEl, { seconds: 0 });
    const cur = () => D.part1[ti].q[qi];
    function paint() { card.textContent = cur(); $("#sp-p1-n").textContent = `${qi + 1} / ${D.part1[ti].q.length}`; tm.reset(0); }
    sel.addEventListener("change", () => { ti = +sel.value; qi = 0; paint(); });
    ctl.append(sayBtn(cur),
      h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { tm.reset(0); tm.start(); } }, "Секундомер"),
      recButton(() => ({ part: 1, q: cur() })),
      h("button", { type: "button", class: "btn ie-sm", onclick: () => { qi = (qi + 1) % D.part1[ti].q.length; if (qi === 0) { ti = (ti + 1) % D.part1.length; sel.value = String(ti); } paint(); } }, "Келесі сұрақ →"));
    paint();
  })();

  /* ================= Part 2: 1 мин дайындық → 2 мин сөйлеу ================= */
  const p2 = (function part2() {
    const sel = $("#sp-p2-card"), cue = $("#sp-cue"), phase = $("#sp-phase"), big = $("#sp-bigt"), go = $("#sp-p2-go"), stop = $("#sp-p2-stop"), auto = $("#sp-p2-auto"), after = $("#sp-p2-after");
    D.part2.forEach((c, i) => sel.append(h("option", { value: String(i) }, c.title)));
    let ci = 0, stage = "idle", tm = null;
    function paintCue() {
      const c = D.part2[ci]; cue.textContent = "";
      cue.append(h("h4", null, c.title), h("p", null, "You should say:"), h("ul", null, ...c.say.map((s) => h("li", null, s))), h("p", null, c.explain));
      p3paint();
    }
    function setStage(s) {
      stage = s;
      go.textContent = s === "idle" ? "Дайындықты бастау (1:00)" : s === "prep" ? "Дайынмын - сөйлей бастау" : s === "speak" ? "Сөйлеу жүріп жатыр" : "Қайта бастау";
      go.disabled = s === "speak"; stop.hidden = s !== "speak" && s !== "prep"; sel.disabled = s === "prep" || s === "speak";
    }
    function startPrep() {
      setStage("prep"); after.hidden = true;
      phase.textContent = "Дайындық: 1 минут. Қысқа жазбалар жасаңыз - толық сөйлем емес, кілт сөздер.";
      tm = I.timer(big, { seconds: 60, lowAt: 10, onEnd: startSpeak }); tm.start(); $("#sp-notes").focus();
    }
    function startSpeak() {
      if (tm) tm.stop();
      setStage("speak");
      const rec = auto.checked && Rec.stream ? startRec({ part: 2, q: D.part2[ci].title }) : false;
      phase.textContent = "Сөйлеңіз: 2 минутқа дейін. Емтихан алушы уақыт біткенде тоқтатады." + (rec ? " Жазылып жатыр." : auto.checked && !Rec.stream ? " (Жазу өшік: алдымен микрофонды қосыңыз.)" : "");
      tm = I.timer(big, { seconds: 120, lowAt: 20, onEnd: () => end("Уақыт бітті.") }); tm.start();
    }
    function end(msg) {
      if (tm) tm.stop(); stopRec(); setStage("done");
      phase.textContent = msg + " Енді төмендегі өзін-өзі бағалау арқылы жауабыңызға қараңыз, сосын Part 3 сұрақтарына өтіңіз.";
      after.hidden = false; $("#sp-sa-ctx").value = "2"; saCtx();
    }
    go.addEventListener("click", () => { if (stage === "idle" || stage === "done") startPrep(); else if (stage === "prep") startSpeak(); });
    stop.addEventListener("click", () => { if (stage === "prep") { tm.stop(); setStage("idle"); big.textContent = "01:00"; phase.textContent = "Тоқтатылды."; } else end("Тоқтатылды."); });
    sel.addEventListener("change", () => { ci = +sel.value; paintCue(); big.textContent = "01:00"; setStage("idle"); });
    $("#sp-p2-rand").addEventListener("click", () => { if (stage === "prep" || stage === "speak") return; ci = (ci + 1 + Math.floor(Math.random() * (D.part2.length - 1))) % D.part2.length; sel.value = String(ci); paintCue(); });
    // Part 3
    function p3paint() {
      const box = $("#sp-p3"); box.textContent = "";
      D.part2[ci].p3.forEach((q, i) => box.append(h("li", null, h("p", { class: "ie-qt", lang: "en" }, q), h("div", { class: "lab-row" }, sayBtn(() => q), recButton(() => ({ part: 3, q }))))));
    }
    paintCue(); setStage("idle");
    return { title: () => D.part2[ci].title };
  })();

  /* ================= Жауапты дамыту (тексерілетін) ================= */
  (function extend() {
    const box = $("#sp-ext"); let order = I.shuffle(D.extend.map((_, i) => i)), k = 0;
    function paint() {
      const it = D.extend[order[k % order.length]], fb = h("div", { "aria-live": "polite" });
      box.textContent = "";
      const opts = I.shuffle(it.opts);
      box.append(h("p", null, h("span", { class: "ie-tag" }, `Part ${it.part}`)), h("p", { class: "ie-qcard", lang: "en" }, it.q),
        h("p", { class: "ie-instr" }, "Қай жауап сұраққа тікелей жауап беріп, оны ең жақсы дамытады?"),
        h("div", { class: "ie-cases" }, ...opts.map((o, i) => h("div", { class: "ie-case" }, h("p", { class: "ie-case-h" }, `${"ABC"[i]} жауабы`), h("p", { class: "ie-case-t", lang: "en" }, o.t),
          h("div", { class: "lab-choice" }, h("button", { type: "button", "data-best": o.best ? "1" : "", onclick: (e) => {
            $$(".ie-case", box).forEach((c, j) => { const op = opts[j]; c.classList.add(op.best ? "ok" : "no"); $("button", c).disabled = true; c.append(h("p", { class: "ie-case-why" }, op.why)); });
            const ok = !!o.best;
            e.currentTarget.classList.add(ok ? "ok" : "no");
            I.record(`ielts.speaking.part${it.part}`, { item: it.q.slice(0, 40), ok, error: ok ? "" : "undeveloped-answer", note: o.why, title: `IELTS Speaking Part ${it.part}: жауапты дамыту` });
            I.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс таңдау." : "Бұл ең жақсы жауап емес.", ok ? o.why : o.why + " Жасыл жиектегі жауапты қараңыз.");
            fb.append(h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { k++; paint(); } }, "Келесі сұрақ"));
          } }, "Осы жауап"))))), fb);
    }
    paint();
  })();

  /* ================= Өзін-өзі бағалау және тарих ================= */
  const LV = [["yes", "Иә"], ["part", "Ішінара"], ["not", "Әлі жоқ"]];
  const form = $("#sp-sa");
  D.criteria.forEach((c, ci) => {
    const fs = h("fieldset", null, h("legend", { lang: "en" }, c.c));
    c.q.forEach((q, qi) => {
      const nm = `sp-sa-${ci}-${qi}`;
      fs.append(h("p", { id: nm + "-l" }, q), h("div", { class: "ie-rate", role: "radiogroup", "aria-labelledby": nm + "-l" }, ...LV.map(([v, t]) => h("label", null, h("input", { type: "radio", name: nm, value: v }), t))));
    });
    form.append(fs);
  });
  function saCtx() { $("#sp-sa-q").textContent = $("#sp-sa-ctx").value === "2" ? "Part 2: " + p2.title() : ""; }
  $("#sp-sa-ctx").addEventListener("change", saCtx);
  const HIST = store.get("speaking:hist", []);
  function paintHist() {
    const ul = $("#sp-hist"); ul.textContent = "";
    if (!HIST.length) { ul.append(h("li", null, h("span", null, "Әзірге жазба жоқ."))); return; }
    HIST.forEach((x) => {
      const focus = D.criteria.filter((c, ci) => c.q.some((_, qi) => x.a[`${ci}-${qi}`] === "not")).map((c) => c.c);
      const part = D.criteria.filter((c, ci) => c.q.some((_, qi) => x.a[`${ci}-${qi}`] === "part")).map((c) => c.c);
      ul.append(h("li", null, h("span", null, h("b", null, `${new Date(x.t).toLocaleString("kk-KZ", { dateStyle: "short", timeStyle: "short" })} · Part ${x.part}`),
        h("small", null, focus.length ? "Келесі назар: " + focus.join(", ") : part.length ? "Жетілдіруге болады: " + part.join(", ") : "Белгіленген әлсіз жер жоқ"), x.note ? h("small", null, "Ескерту: " + x.note) : "")));
    });
  }
  $("#sp-sa-save").addEventListener("click", () => {
    const a = {}; let n = 0;
    D.criteria.forEach((c, ci) => c.q.forEach((_, qi) => { const r = $(`input[name=sp-sa-${ci}-${qi}]:checked`); if (r) { a[`${ci}-${qi}`] = r.value; n++; } }));
    const fb = $("#sp-sa-fb");
    if (!n) { I.feedback(fb, "info", "Ең болмаса бір сұраққа жауап беріңіз", "Рефлексия - өз жазбаңызды тыңдап, әр критерий бойынша өзіңізге шынайы жауап беру."); return; }
    HIST.unshift({ t: Date.now(), part: $("#sp-sa-ctx").value, a, note: $("#sp-sa-note").value.trim() }); if (HIST.length > 50) HIST.length = 50;
    store.set("speaking:hist", HIST); paintHist();
    $$("input[type=radio]", form).forEach((r) => { r.checked = false; }); $("#sp-sa-note").value = "";
    I.feedback(fb, "ok", "Рефлексия сақталды (тек осы браузерде)", "Бұл - баға емес. «Әлі жоқ» деп белгілеген критерийді келесі жаттығуда мақсат етіп алыңыз.");
  });
  $("#sp-hist-clear").addEventListener("click", () => { if (!confirm("Рефлексия тарихын өшіреміз бе?")) return; HIST.length = 0; store.set("speaking:hist", HIST); paintHist(); });
  paintHist(); saCtx();
})();
