/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS General Training Task 1 - Letter Studio.
   1) Регистрді болжау (адресатқа қарап), 2) Tone lab: ашылу, мақсат сөйлемі, өтініш/ұсыныс, аяқталу - әр нұсқаның түсіндірмесімен,
   3) жаңа жағдай генераторы (меңгеру: ашылу+аяқталу ережемен тексеріледі), 4) редактор (≥150 сөз, 20 мин таймер, тарих),
   5) мақсат пен 3 тармақты қамту тексерісі: оқушы әр абзацқа қай тармаққа жауап беретінін белгілейді, 6) ереже тексерісі,
   7) ресми критерий атауларымен өзін-өзі тексеру, мұғалімге экспорт. Band бағасы жоқ. Skill id: ielts.writing.gt.*. */
(() => {
  "use strict";
  const D = window.IELTS_WTL, I = window.IELTS, W = window.IELTS_WT;
  if (!D || !I || !W) return;
  const { $, $$, h, store } = I;
  const root = $("[data-ielts-wtl]");
  if (!root) return;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- Ереже: адресат → ашылу/аяқталу ---------- */
  function expectedOpen(sc) { return sc.reg === "formal" ? "Dear Sir or Madam," : sc.reg === "semi" ? `Dear ${sc.title} ${sc.last},` : `Dear ${sc.first},`; }
  function openOptions(sc) {
    const s = new Set([expectedOpen(sc), "Dear Sir or Madam,"]);
    if (sc.reg === "semi") { s.add(`Dear ${sc.title} ${sc.first},`); s.add(`Dear ${sc.first},`); }
    else if (sc.reg === "informal") { s.add(`Dear Ms ${sc.first},`); s.add("To whom it may concern,"); }
    else { s.add("Dear Manager,"); s.add("Hi there,"); }
    return I.shuffle([...s]);
  }
  function whyOpen(sc, o) {
    const ok = o === expectedOpen(sc);
    if (ok) return sc.reg === "formal" ? "Аты белгісіз адресат → Dear Sir or Madam." : sc.reg === "semi" ? "Аты белгілі, бірақ жақын емес → Dear + атақ (Mr/Ms/Dr) + ТЕГІ." : "Дос/туыс → Dear + АТЫ.";
    if (o === "Dear Sir or Madam,") return "Адресаттың аты белгілі - Dear Sir or Madam тек аты белгісіз болғанда қолданылады.";
    if (/^Dear (Mr|Ms|Dr) [A-Z][a-z]+,$/.test(o) && sc.reg === "semi") return "Атақ (Mr/Ms/Dr) атпен емес, ТЕГІМЕН қолданылады: " + expectedOpen(sc);
    if (sc.reg === "semi") return "Жақын емес адамға тек атымен жазу тым бейресми болуы мүмкін - атақ + тегі: " + expectedOpen(sc);
    if (sc.reg === "informal") return "Досқа атақ (Ms) пен ресми формулалар сай емес - Dear + аты.";
    return "Аты белгісіз ресми хат: Dear Sir or Madam. «Dear Manager» мен «Hi there» - стандартты емес не тым бейресми.";
  }
  const closeOptions = ["Yours faithfully,", "Yours sincerely,", "Best wishes,"];
  const expectedClose = (sc) => (sc.reg === "formal" ? "Yours faithfully," : sc.reg === "semi" ? "Yours sincerely," : "Best wishes,");
  const whyClose = (sc, o) => o === expectedClose(sc) ? (sc.reg === "formal" ? "Dear Sir or Madam → Yours faithfully." : sc.reg === "semi" ? "Аты аталған ресми/жартылай ресми хат → Yours sincerely (не Kind regards)." : "Досқа → Best wishes (Take care, All the best).")
    : o === "Yours faithfully," ? "Yours faithfully - тек Dear Sir or Madam-мен (аты белгісіз)." : o === "Yours sincerely," ? (sc.reg === "formal" ? "Аты белгісіз адресатқа - Yours faithfully. Sincerely - аты аталғанда." : "Досқа тым ресми.") : "Best wishes - бейресми; ресми хатта сай емес.";

  /* ---------- Тапсырма таңдау ---------- */
  const BUILT = {};
  const tabs = $("#wtl-tasks"), host = $("#wtl-host");
  const tb = D.tasks.map((t) => { const b = h("button", { type: "button", "aria-pressed": "false", "data-t": t.id, onclick: () => show(t.id, true) }, t.title); tabs.append(b); return b; });

  function build(T) {
    const K = "gt-" + T.id, sk = (s) => `ielts.writing.gt.${s}`;
    const panel = h("div", { class: "wtl-panel", id: "wtl-" + T.id });
    const lines = T.prompt.split("\n");
    panel.append(h("section", { class: "lab", "aria-labelledby": `wtl-h-${T.id}` },
      h("h2", { id: `wtl-h-${T.id}` }, T.title),
      h("div", { class: "ie-qcard ie-prompt", lang: "en" }, h("p", { style: "margin:0" }, lines[0]),
        h("ul", { class: "wt-bul" }, ...lines.filter((l) => l.startsWith("•")).map((l) => h("li", null, l.slice(2)))),
        h("p", { style: "margin:0" }, lines[lines.length - 1])),
      h("p", { class: "ie-instr" }, T.note)));

    /* ---- 1-2. Tone lab ---- */
    const lab = h("section", { class: "lab", "aria-labelledby": `wtl-th-${T.id}` }, h("h2", { id: `wtl-th-${T.id}` }, "Tone lab: регистрді таңдау"),
      h("p", { class: "lab-goal" }, h("b", null, "Мақсат: "), "адресатқа қарап хаттың регистрін анықтау және ашылу, мақсат, өтініш, аяқталу сөйлемдерін соған сай таңдау."));
    panel.append(lab);
    // Болжау
    const pfb = h("div", { "aria-live": "polite" }), qWrap = h("div", { hidden: true });
    lab.append(h("p", null, h("b", null, "Алдымен болжаңыз: "), "бұл хат қандай регистрде жазылуы керек?"),
      W.choice(Object.entries(D.regNames).map(([k, t]) => ({ t, k })), "Регистрді болжау", (o, btn) => {
        const ok = o.k === T.reg;
        btn.classList.add(ok ? "ok" : "no");
        I.record(sk("register"), { item: T.id, ok, error: ok ? "" : `${o.k}-for-${T.reg}`, title: "GT хат: регистрді анықтау" });
        I.feedback(pfb, ok ? "ok" : "bad", ok ? "Дұрыс болжам" : `Дұрысы: ${D.regNames[T.reg]}`, T.reg === "formal" ? "Компанияға жазасыз, адресаттың атын білмейсіз - ресми регистр: толық формалар, сыпайы өтініштер, қысқартусыз." : T.reg === "semi" ? "Басшының атын білесіз, бірақ ол дос емес - жартылай ресми: сыпайы, бірақ тым ауыр емес; Dear Ms Ruiz." : "Досқа жазасыз - бейресми: жылы тон, қысқартулар (I'm, can't) және сұрақтар табиғи.");
        qWrap.hidden = false;
      }), pfb, qWrap);
    $$(".lab-choice button", lab).forEach((b) => b.setAttribute("lang", "kk"));
    const answered = {};
    T.lab.forEach((q, qi) => {
      const fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
      qWrap.append(h("h3", null, `${qi + 1}. ${q.q}`), W.choice(I.shuffle(q.opts).map(([t, ok, why]) => ({ t, ok, why })), q.q, (o, btn) => {
        $$("button", btn.parentNode).forEach((b) => b.classList.remove("ok", "no"));
        btn.classList.add(o.ok ? "ok" : "no");
        const first = !(qi in answered); answered[qi] = answered[qi] || o.ok;
        if (first) I.record(sk("tone"), { item: `${T.id}-${qi}`, ok: !!o.ok, hints: hapi ? hapi.used() : 0, error: o.ok ? "" : "register-mismatch", note: o.why, title: "GT хат: тон мен регистр" });
        I.feedback(fb, o.ok ? "ok" : "bad", o.ok ? "Дұрыс" : "Регистрге сай емес", o.why);
      }), fb);
    });
    const hEl = h("div");
    qWrap.append(hEl);
    const hapi = window.AO17Tutor ? AO17Tutor.hints(hEl, [
      "Үш сұрақ қойыңыз: адресаттың атын білемін бе? Ол маған жақын ба? Мен одан не сұраймын? Осыдан регистр шығады.",
      "Ұқсас мысал: банкке (аты белгісіз) - «Dear Sir or Madam, … I would be grateful if you could… Yours faithfully». Апаға - «Dear Aliya, … Could you…? Love,».",
      `Шешім (${T.title}): ` + T.lab.map((q) => `${q.q} → «${q.opts.find((o) => o[1])[0]}»`).join("; "),
    ], { onSolution: () => { newScenario(); I.feedback(sFb, "info", "Шешім ашылды", "Төмендегі жаңа жағдайды көмексіз шешіңіз - меңгеру тек соған саналады."); } }) : null;

    // Жаңа жағдай (меңгеру)
    const sBox = h("div"), sFb = h("div", { "aria-live": "polite" });
    let sc = null, sel = {};
    function newScenario() {
      sc = pick(D.scenarios.filter((x) => x !== sc)); sel = {};
      sBox.textContent = ""; sFb.textContent = ""; sFb.className = "";
      sBox.append(h("p", { class: "wt-scn" }, h("span", { lang: "en" }, "You are writing to " + sc.who + ".")),
        h("p", { class: "ie-instr" }, "Ашылу:"), W.choice(openOptions(sc).map((t) => ({ t })), "Ашылуды таңдау", (o) => { sel.open = o.t; }),
        h("p", { class: "ie-instr" }, "Аяқталу:"), W.choice(closeOptions.map((t) => ({ t })), "Аяқталуды таңдау", (o) => { sel.close = o.t; }));
    }
    lab.append(h("div", { class: "lab-task" }, h("b", null, "Жаңа жағдай (көмексіз): "), "адресатқа сай ашылу мен аяқталуды таңдаңыз. Жағдайлар кездейсоқ - әр жолы жаңа.", sBox,
      h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => {
        if (!sel.open || !sel.close) { I.feedback(sFb, "info", "Екеуін де таңдаңыз", "Ашылу мен аяқталу бір-біріне сай болуы керек - сондықтан екеуі бірге тексеріледі."); return; }
        const o1 = sel.open === expectedOpen(sc), o2 = sel.close === expectedClose(sc), ok = o1 && o2;
        I.record(sk("tone.new"), { item: sc.who, ok, error: ok ? "" : !o1 ? "salutation" : "closing", title: "GT хат: жаңа адресат" });
        I.feedback(sFb, ok ? "ok" : "bad", ok ? "Дұрыс: ашылу мен аяқталу сай" : "Әлі емес", `Ашылу: ${whyOpen(sc, sel.open)} Аяқталу: ${whyClose(sc, sel.close)}`);
      } }, "Тексеру"), h("button", { type: "button", class: "btn secondary", onclick: newScenario }, "Жаңа жағдай")), sFb));
    newScenario();

    /* ---- 3. Редактор ---- */
    const edSec = h("section", { class: "lab", "aria-labelledby": `wtl-eh-${T.id}` }, h("h2", { id: `wtl-eh-${T.id}` }, "Хатты жазу"),
      h("p", { class: "ie-instr" }, "Құрылым ұсынысы: ашылу → мақсат (1-абзац) → әр тармаққа бір абзац → қорытынды сөйлем → аяқталу → аты. Абзацтарды бос жолмен бөліңіз. Емтиханда Task 1-ге ≈ 20 минут."));
    panel.append(edSec);
    const edBox = h("div"); edSec.append(edBox);
    const ed = W.editor(edBox, { key: K, target: 150, minutes: 20, label: "Хат мәтіні" });

    /* ---- 4. Қамту тексерісі ---- */
    const TAGS = store.get(`wt:${K}:tags`, {});
    const covList = h("ol", { class: "wt-cov" }), covFb = h("div", { "aria-live": "polite" });
    const isFrame = (p) => /^(dear|hi|hello)\b/i.test(p.trim()) && I.words(p) <= 5 || D.closings.formal.concat(D.closings.semi, D.closings.informal).some((c) => p.trim().toLowerCase().startsWith(c)) && I.words(p) <= 6;
    const paras = () => ed.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).filter((p) => !isFrame(p));
    const tagKey = (p) => p.slice(0, 40);
    const LABELS = [["purpose", "Мақсат"], ["b0", "1-тармақ"], ["b1", "2-тармақ"], ["b2", "3-тармақ"]];
    function paintCov() {
      covList.textContent = ""; covFb.textContent = ""; covFb.className = "";
      const ps = paras();
      if (!ps.length) { covList.append(h("li", null, "Алдымен хатты жазыңыз (абзацтарды бос жолмен бөліңіз), сосын «Абзацтарды көрсету» батырмасын басыңыз.")); return; }
      ps.forEach((p, i) => {
        const tk = tagKey(p), cur = TAGS[tk] || [];
        const fs = h("fieldset", null, h("legend", null, `${i + 1}-абзац жауап береді:`));
        LABELS.forEach(([v, t]) => {
          const id = `wtl-${T.id}-p${i}-${v}`, cb = h("input", { type: "checkbox", id, value: v, checked: cur.includes(v) });
          cb.addEventListener("change", () => { const a = new Set(TAGS[tk] || []); if (cb.checked) a.add(v); else a.delete(v); TAGS[tk] = [...a]; store.set(`wt:${K}:tags`, TAGS); });
          fs.append(h("label", { for: id }, cb, t));
        });
        covList.append(h("li", null, h("p", { class: "wt-ptext", lang: "en" }, p.length > 160 ? p.slice(0, 157) + "…" : p), fs));
      });
    }
    function checkCov() {
      const ps = paras(), R = [];
      if (!ps.length) { W.rules(covFb, [["no", "Абзац табылмады."]], "Қамту тексерісі", "Хатты жазып, абзацтарды бос жолмен бөліңіз."); return null; }
      const tagged = ps.map((p) => TAGS[tagKey(p)] || []);
      const where = (v) => tagged.map((t, i) => (t.includes(v) ? i : -1)).filter((i) => i >= 0);
      const pw = where("purpose");
      const pre = new RegExp(D.purposeRe[T.reg], "i");
      if (!pw.length) R.push(["no", "Ешбір абзац «Мақсат» деп белгіленбеді. Хаттың неге жазылғанын бірінші абзацта айтыңыз."]);
      else if (pw[0] !== 0) R.push(["no", `Мақсат ${pw[0] + 1}-абзацта. Оқырман оны БІРІНШІ абзацтан білуі керек.`]);
      else R.push(pre.test(ps[0]) ? ["ok", "Мақсат бірінші абзацта және мақсат тіркесі бар."] : ["info", "Бірінші абзац «Мақсат» деп белгіленген, бірақ мақсат тіркесі (" + (T.reg === "informal" ? "Thanks for…, I'm sorry but…" : "I am writing to…") + ") табылмады. Мақсат анық па - өзіңіз тексеріңіз."]);
      let allB = true;
      T.bullets.forEach((b, bi) => {
        const w = where("b" + bi);
        if (!w.length) { allB = false; R.push(["no", `${bi + 1}-тармақ («${b.t}») ешбір абзацта белгіленбеді. Тармақ жоқ болса, Task Achievement төмендейді.`]); return; }
        const hit = w.some((i) => b.key.some((k) => ps[i].toLowerCase().includes(k)));
        const len = Math.max(...w.map((i) => I.words(ps[i])));
        R.push(hit ? (len >= 25 ? ["ok", `${bi + 1}-тармақ: ${w.map((i) => i + 1).join(", ")}-абзац, тақырып сөздері бар.`] : ["info", `${bi + 1}-тармақ белгіленді, бірақ абзац қысқа (${len} сөз). Тармақты дамытыңыз: себеп, мысал, бөлшек.`])
          : ["info", `${bi + 1}-тармақ ${w.map((i) => i + 1).join(", ")}-абзацқа белгіленген, бірақ тармаққа тән сөздер табылмады («${b.t}»). Абзац шынымен осы тармаққа жауап бере ме?`]);
      });
      const untagged = tagged.map((t, i) => (t.length ? -1 : i)).filter((i) => i >= 0);
      if (untagged.length) R.push(["info", `${untagged.map((i) => i + 1).join(", ")}-абзац ешқандай тармаққа белгіленбеді. Қорытынды сөйлем болса - қалыпты; әйтпесе бұл абзац тапсырмаға қатысты ма?`]);
      const ok = !!pw.length && pw[0] === 0 && allB;
      I.record(sk("coverage"), { item: T.id, ok, error: ok ? "" : !pw.length || pw[0] !== 0 ? "purpose" : "missing-bullet", title: "GT хат: мақсат пен тармақтарды қамту" });
      W.rules(covFb, R, "Мақсат пен 3 тармақ (баға емес)", "Бұл тексеріс сіздің белгілеріңізге және кілт сөздерге сүйенеді - мағынаны түсінбейді. Әр тармақ шынымен дамытылғанын өзіңіз оқып тексеріңіз.");
      return R;
    }
    const covSec = h("section", { class: "lab", "aria-labelledby": `wtl-ch-${T.id}` }, h("h2", { id: `wtl-ch-${T.id}` }, "Мақсат пен 3 тармақ: қамту тексерісі"),
      h("p", { class: "lab-goal" }, h("b", null, "Мақсат: "), "әр абзацтың қай тармаққа жауап беретінін өзіңіз белгілеп, ешбір тармақ қалып қоймағанын көру."),
      h("ol", { class: "wt-bul" }, ...T.bullets.map((b, i) => h("li", { lang: "en" }, `${b.t}`))),
      h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn secondary", onclick: paintCov }, "Абзацтарды көрсету"), h("button", { type: "button", class: "btn", onclick: checkCov }, "Қамтуды тексеру")),
      covList, covFb);
    panel.append(covSec);
    paintCov();

    /* ---- 5. Ереже тексерісі ---- */
    function rules(t) {
      const low = t.toLowerCase(), n = I.words(t), R = [];
      const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
      R.push(n >= 150 ? ["ok", `${n} сөз - 150 талабы орындалды.`] : ["no", `${n} сөз. Кемінде 150 сөз керек.`]);
      const first = (lines[0] || "").toLowerCase();
      const wantOpen = T.lab[0].opts.find((o) => o[1])[0].toLowerCase().replace(/,$/, "");
      if (!/^(dear|hi|hello)\b/.test(first)) R.push(["no", "Хат «Dear …,» деп басталуы керек (тапсырма солай сұрайды)."]);
      else if (T.reg === "formal" && !first.startsWith("dear sir or madam")) R.push(["no", `Ашылу «${lines[0]}» - аты белгісіз адресатқа: Dear Sir or Madam,`]);
      else if (T.reg === "semi" && !/^dear (ms|mrs|miss) ruiz/.test(first)) R.push(["no", `Ашылу «${lines[0]}» - басшыға: Dear Ms Ruiz,`]);
      else if (T.reg === "informal" && /(sir|madam|mr|ms|concern)/.test(first)) R.push(["no", `Ашылу «${lines[0]}» досқа тым ресми: Dear Sam,`]);
      else R.push(["ok", `Ашылу регистрге сай (${wantOpen} түрі).`]);
      const allClose = Object.entries(D.closings);
      const found = allClose.map(([reg, cs]) => [reg, cs.find((c) => new RegExp("(^|\\n)\\s*" + c + "\\b", "i").test(t))]).filter((x) => x[1]);
      if (!found.length) R.push(["no", "Аяқталу формуласы табылмады (Yours faithfully / Yours sincerely / Best wishes)."]);
      else {
        const [reg, c] = found[found.length - 1];
        const okc = reg === T.reg || (T.reg === "semi" && reg === "semi");
        R.push(okc ? ["ok", `Аяқталу «${c}» - регистрге сай.`] : ["no", `Аяқталу «${c}» бұл хатқа сай емес: ${T.reg === "formal" ? "Dear Sir or Madam → Yours faithfully" : T.reg === "semi" ? "Dear Ms Ruiz → Yours sincerely / Kind regards" : "досқа → Best wishes / Take care"}.`]);
        const last = lines[lines.length - 1] || "";
        R.push(lines.length >= 2 && !allClose.some(([, cs]) => cs.some((x) => last.toLowerCase().startsWith(x))) && I.words(last) <= 4 ? ["ok", `Қолтаңба (аты) бар: «${last}».`] : ["info", "Аяқталудан кейін жаңа жолға атыңызды жазыңыз (ресми хатта - толық аты-жөні, досқа - тек аты)."]);
      }
      if (T.reg !== "informal") {
        const slang = ["gonna", "wanna", "stuff", "guys", "asap", "cool", "hey", "btw", "kinda", "yeah", "!!"].filter((w) => low.includes(w));
        if (slang.length) R.push(["no", `Бейресми сөздер: ${slang.join(", ")}. ${T.reg === "formal" ? "Ресми" : "Жартылай ресми"} хатқа сай емес.`]);
        const contr = (t.match(/\b\w+'(m|re|s|ve|ll|d|t)\b/gi) || []).filter((x) => !/^(it's|that's)$/i.test(x) || true);
        if (T.reg === "formal" && contr.length) R.push(["info", `Қысқартулар (${[...new Set(contr)].slice(0, 4).join(", ")}): ресми хатта толық түрі жөн (I am, cannot).`]);
        R.push(/\b(would be grateful|could you|would you|i would like|i would appreciate|please)\b/.test(low) ? ["ok", "Сыпайы өтініш құрылымы бар."] : ["info", "Сыпайы өтініш құрылымы табылмады (I would be grateful if you could…, Could you…?)."]);
      } else {
        const stiff = ["i am writing to inform", "yours faithfully", "kindly", "i would be grateful if you could", "please find", "hereby"].filter((w) => low.includes(w));
        if (stiff.length) R.push(["no", `Досқа тым ресми тіркестер: ${stiff.join(", ")}.`]);
        R.push(/\b\w+'(m|re|s|ve|ll|d|t)\b/i.test(t) || /\?/.test(t) ? ["ok", "Бейресми белгілер бар (қысқартулар не сұрақтар)."] : ["info", "Досқа хат тым құрғақ болуы мүмкін: қысқартулар (I'm, can't) мен сұрақтар (How are you?) табиғи."]);
      }
      const ps = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
      R.push(ps >= 4 ? ["ok", `${ps} бөлік (ашылу, абзацтар, аяқталу).`] : ["info", `${ps} бөлік. Әр тармақты жеке абзацқа бөліп, бос жол қалдырыңыз.`]);
      return R;
    }
    const rFb = h("div", { "aria-live": "polite" });
    edSec.append(h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn", onclick: () => { const R = rules(ed.value); W.rules(rFb, R, "Ереже тексерісі (баға емес)", "Тек өлшенетін нәрселер: сөз саны, ашылу мен аяқталудың регистрге сай болуы, регистрге жат сөздер. Тонның табиғилығын өзіңіз бағалаңыз."); I.record(sk("rules"), { item: T.id, ok: !R.some((r) => r[0] === "no"), error: R.filter((r) => r[0] === "no").length ? "rules" : "", title: "GT хат: ереже тексерісі" }); } }, "Ережемен тексеру")), rFb);

    /* ---- 6. Өзін-өзі тексеру және экспорт ---- */
    const sc2 = h("section", { class: "lab", "aria-labelledby": `wtl-sh-${T.id}` }, h("h2", { id: `wtl-sh-${T.id}` }, "Өзін-өзі тексеру және мұғалімге жіберу"),
      h("p", { class: "ie-instr" }, "Ресми критерийлер атауымен рефлексия сұрақтары. AO17 band бағасын қоймайды: ресми бағаны тек сертификатталған емтихан алушы қояды."));
    const chkBox = h("div"), expBox = h("div");
    sc2.append(chkBox, h("h3", null, "Экспорт"), expBox);
    panel.append(sc2);
    const getChk = W.checklist(chkBox, D.checklist, K);
    W.exporter(expBox, { name: "ielts-gt-letter-" + T.id, getBundle: () => {
      const ps = paras();
      return { app: "AO17 IELTS GT Letter Studio", task: T.id, register: T.reg, exported: new Date().toISOString(), note: "Тәжірибелік жұмыс. Ресми IELTS бағасы емес.", prompt: T.prompt, text: ed.value, words: I.words(ed.value),
        paragraphTags: ps.map((p) => ({ start: p.slice(0, 60), tags: (TAGS[tagKey(p)] || []).map((v) => LABELS.find((l) => l[0] === v)[1]) })), ruleCheck: rules(ed.value), selfCheck: getChk(),
        history: ed.history().map((x) => ({ t: new Date(x.t).toISOString(), words: x.wc, why: x.why })) };
    }, toText: (b) => [`AO17 IELTS GT Letter Studio - ${new Date().toLocaleString("kk-KZ")}`, "Тәжірибелік жұмыс, ресми IELTS бағасы емес.", "", "ТАПСЫРМА", b.prompt, "", `Регистр: ${D.regNames[b.register]}`, "", "ХАТ", b.text || "(бос)", "", `Сөз саны: ${b.words}`, "",
      "АБЗАЦ БЕЛГІЛЕРІ", ...b.paragraphTags.map((p, i) => `  ${i + 1}) «${p.start}…» → ${p.tags.join(", ") || "-"}`), "", "ЕРЕЖЕ ТЕКСЕРІСІ", ...b.ruleCheck.map(([k, x]) => `  [${k === "ok" ? "✓" : k === "no" ? "!" : "i"}] ${x}`), "", "ӨЗІН-ӨЗІ ТЕКСЕРУ", W.ckText(b.selfCheck), ""].join("\n") });
    return panel;
  }

  function show(id, focus) {
    const T = D.tasks.find((t) => t.id === id) || D.tasks[0];
    if (!BUILT[T.id]) { BUILT[T.id] = build(T); host.append(BUILT[T.id]); }
    Object.entries(BUILT).forEach(([k, el]) => { el.hidden = k !== T.id; });
    tb.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === T.id)));
    store.set("wt:gt:task", T.id);
    if (focus) { history.replaceState(null, "", "#" + T.id); const hh = $("h2", BUILT[T.id]); hh.setAttribute("tabindex", "-1"); hh.focus(); }
  }
  const fromHash = location.hash.slice(1);
  show(D.tasks.some((t) => t.id === fromHash) ? fromHash : store.get("wt:gt:task", "formal"));
})();
