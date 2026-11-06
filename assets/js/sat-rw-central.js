/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Central Ideas and Details» + «Inferences» зертханасы:
   1) деталь карталарынан негізгі ойды құра (қай детальдар негізгі ойға кіреді?), 2) негізгі ой нұсқасын таңда,
   3) қамту тақтасы: әр нұсқа қай детальдарды қамтиды (тым тар / тым кең / мәтінде жоқ), 4) мәтінді логикалық аяқтау (inference).
   6 жаттығу мәтіні + 3 жаңа мәтін көмексіз (меңгеру). */
(() => {
  "use strict";
  const D = window.SAT_RW_CENTRAL, T = window.AO17Tutor, { h, shuffle, focus } = window.SAT, RW = window.SATRW;
  const $ = (id) => document.getElementById(id);
  if (!D || !$("ci-pass")) return;
  const SK_C = "sat.rw.central-ideas-and-details", SK_I = "sat.rw.inferences";
  const practice = D.filter((x) => !x.check), check = D.filter((x) => x.check);
  const queue = practice.map((x) => ({ ...x, mode: "p" })).concat(shuffle(check).map((x) => ({ ...x, mode: "c" })));
  let i = 0, it, mains = [], sel = new Set(), built = false, mainDone = false, infDone = false, mainOk = false, hintObj = null, spoiled = false, checkOk = 0;
  T.badge($("ci-badge"), SK_C, "SAT: Central Ideas and Details");
  T.badge($("ci-badge2"), SK_I, "SAT: Inferences");

  function coverage(picked) {
    const ul = $("ci-cov"); ul.innerHTML = "";
    mains.forEach((m, r) => {
      const bar = h("span", { class: "bar" }, ...it.cards.map((c, k) => h("i", { class: m.covers.includes(k) ? (c.core ? "hit" : "extra") : "", title: c.t, text: "№" + (k + 1) })));
      const coreHit = it.cards.filter((c, k) => c.core && m.covers.includes(k)).length, coreAll = it.cards.filter((c) => c.core).length;
      ul.append(h("li", { class: r === picked ? "pick" : "" }, h("b", { text: RW.L[r] }), h("span", {}, bar, h("span", { class: "sr-only", text: `${RW.L[r]}: ${coreAll} негізгі детальдың ${coreHit}-ін қамтиды.` })), h("span", { class: "flaw", text: `${coreHit} / ${coreAll} негізгі деталь · ${m.flaw}` })));
    });
  }
  function load() {
    it = queue[i]; sel = new Set(); built = false; mainDone = false; infDone = false; mainOk = false; spoiled = false;
    const c = it.mode === "c";
    $("ci-prog").textContent = c ? `Меңгеру тексерісі: жаңа мәтін ${i - practice.length + 1} / ${check.length} · көмексіз` : `Жаттығу мәтіні ${i + 1} / ${practice.length}`;
    $("ci-kind").textContent = it.kind;
    $("ci-pass").innerHTML = ""; it.p.forEach((p) => $("ci-pass").append(h("p", { text: p })));
    const ul = $("ci-cards"); ul.innerHTML = "";
    it.cards.forEach((cd, k) => {
      const b = h("button", { type: "button", "aria-pressed": "false", "data-k": k }, h("span", { lang: "en", text: "№" + (k + 1) + " " + cd.t }), h("small", { text: "басу - негізгі ойға қосу" }));
      b.addEventListener("click", () => { if (built) return; sel.has(k) ? sel.delete(k) : sel.add(k); b.setAttribute("aria-pressed", String(sel.has(k))); b.querySelector("small").textContent = sel.has(k) ? "негізгі ойға қосылды" : "басу - негізгі ойға қосу"; });
      ul.append(h("li", {}, b));
    });
    mains = shuffle(it.mains);
    RW.options($("ci-opts"), mains.map((m) => m.t), pickMain);
    RW.options($("ci-iopts"), it.inf.choices, pickInf);
    $("ci-itext").textContent = it.inf.text;
    ["ci-fb1", "ci-fb2", "ci-fb3"].forEach((id) => RW.clear($(id)));
    $("ci-why").innerHTML = ""; $("ci-cov").innerHTML = "";
    $("ci-s1").hidden = c; $("ci-s2").hidden = !c; $("ci-s3").hidden = true; $("ci-board").hidden = true; $("ci-next").hidden = true; $("ci-h").hidden = c;
    $("ci-build").disabled = false;
    const good = mains.findIndex((m) => m.ok), core = it.cards.map((cd, k) => (cd.core ? "№" + (k + 1) : null)).filter(Boolean);
    const steps = [
      "Әр сөйлемге сұрақ қой: оны алып тастасам, мәтіннің ойы өзгере ме? Өзгертсе - негізгі деталь; өзгертпесе (мысал, түс, сан) - қосалқы. Негізгі ой негізгі детальдардың бәрін қамтиды.",
      "Ұқсас мысал: «Bees pollinate crops. Without them, many fruits would not grow. Some bees are striped.» Негізгі ой: аралар егінге қажет. «Some bees are striped» - қосалқы деталь; оны ғана айтатын нұсқа - тым тар.",
      `Шешім: негізгі детальдар - ${core.join(", ")}. Оларды бірге қамтитын нұсқа - ${RW.L[good]}. Inference: ${RW.L[it.inf.ans]} - ${it.inf.why[it.inf.ans]}`,
    ];
    if (!hintObj) hintObj = T.hints($("ci-h"), steps, { onSolution: () => { spoiled = true; T.feedback($("ci-fb3"), "info", "Шешім ашылды.", "Бұл мәтін меңгеруге саналмайды; соңындағы жаңа мәтіндерді көмексіз шеш."); } });
    else hintObj.reset(steps);
  }
  $("ci-build").addEventListener("click", () => {
    if (built) return;
    built = true; $("ci-build").disabled = true;
    const core = it.cards.map((c, k) => (c.core ? k : -1)).filter((k) => k >= 0);
    const miss = core.filter((k) => !sel.has(k)), extra = [...sel].filter((k) => !it.cards[k].core);
    $("ci-cards").querySelectorAll("button").forEach((b) => { const k = +b.dataset.k; b.disabled = true; b.classList.add(it.cards[k].core ? "core" : "side"); if (miss.includes(k) || extra.includes(k)) b.classList.add("wrong"); b.querySelector("small").textContent = it.cards[k].core ? "негізгі деталь" : "қосалқы деталь"; });
    const ok = !miss.length && !extra.length;
    T.feedback($("ci-fb1"), ok ? "ok" : "info", ok ? "Негізгі детальдар дұрыс жиналды." : "Жинағыңды салыстыр:", (miss.length ? `Түсіп қалған негізгі деталь: ${miss.map((k) => "№" + (k + 1)).join(", ")}. ` : "") + (extra.length ? `Қосалқы деталь (мысал не жеке факт): ${extra.map((k) => "№" + (k + 1)).join(", ")} - оларсыз да мәтіннің ойы сақталады. ` : "") + "Негізгі ой нұсқасы осы негізгі детальдардың бәрін қамтуы керек.");
    $("ci-s2").hidden = false; focus($("ci-opts").querySelector("button"));
  });
  function pickMain(k) {
    if (mainDone) return;
    mainDone = true;
    const good = mains.findIndex((m) => m.ok), c = it.mode === "c";
    mainOk = k === good;
    RW.settle($("ci-opts"), good, k);
    $("ci-board").hidden = false; coverage(k);
    T.feedback($("ci-fb2"), mainOk ? "ok" : "bad", mainOk ? `Дұрыс: ${RW.L[k]}.` : `Негізгі ой емес: ${RW.L[k]}.`, mains[k].flaw.replace(/^Дұрыс: /, "") + (mainOk ? "" : ` Дұрысы - ${RW.L[good]}.`));
    T.record(SK_C, { item: it.id, ok: mainOk && !spoiled, hints: c ? 0 : spoiled ? 3 : hintObj.used(), error: mainOk ? "" : mains[k].covers.length ? "too-narrow" : "not-in-text", note: mainOk ? "" : mains[k].t, title: "SAT: Central Ideas and Details" });
    $("ci-s3").hidden = false; focus($("ci-iopts").querySelector("button"));
  }
  function pickInf(k) {
    if (infDone) return;
    infDone = true;
    const ok = k === it.inf.ans, c = it.mode === "c";
    RW.settle($("ci-iopts"), it.inf.ans, k);
    T.feedback($("ci-fb3"), ok ? "ok" : "bad", ok ? `Дұрыс: ${RW.L[k]}.` : `Қисынды емес: ${RW.L[k]}.`, it.inf.why[k] + (ok ? "" : ` Дұрысы - ${RW.L[it.inf.ans]}.`));
    RW.whyList($("ci-why"), it.inf.choices, it.inf.why, it.inf.ans);
    T.record(SK_I, { item: it.id + "-inf", ok: ok && !spoiled, hints: c ? 0 : spoiled ? 3 : hintObj.used(), error: ok ? "" : "inference", note: ok ? "" : it.inf.choices[k], title: "SAT: Inferences" });
    if (c && ok && mainOk) checkOk++;
    const last = i === queue.length - 1;
    $("ci-next").hidden = false;
    $("ci-next").textContent = last ? "Нәтиже" : i === practice.length - 1 ? "Меңгеру тексерісіне өту" : "Келесі мәтін";
  }
  $("ci-next").addEventListener("click", () => {
    if (i < queue.length - 1) { i++; load(); RW.toTop($("ci-lab")); focus($("ci-cards").querySelector("button") || $("ci-opts").querySelector("button")); return; }
    $("ci-next").hidden = true;
    const pass = checkOk >= check.length - 1;
    T.feedback($("ci-fb3"), pass ? "ok" : "info", `Меңгеру тексерісі: ${checkOk} / ${check.length} мәтін толық дұрыс (негізгі ой + inference)`, pass ? "Жаңа мәтіндерде негізгі ойды да, қорытындыны да көмексіз таптың." : "Қате мәтіндердің қамту тақтасын қайта қара: нұсқа тым тар ма, әлде мәтінде жоқ нәрсені айта ма?");
  });
  load();
  window.SATRW.central = { state: () => ({ it, mains, i }) };
})();
