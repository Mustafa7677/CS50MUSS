/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Rhetorical Synthesis» зертханасы: 1) мақсатқа қай жазбалар керек екенін болжа, 2) мақсатты орындайтын сөйлемді таңда,
   3) матрица: әр нұсқа қай жазбаны қолданады және мақсатты орындай ма. 8 жаттығу + 4 жаңа жиынтық көмексіз (меңгеру). */
(() => {
  "use strict";
  const D = window.SAT_RW_RHET, T = window.AO17Tutor, { h, shuffle, focus } = window.SAT, RW = window.SATRW;
  const $ = (id) => document.getElementById(id);
  if (!D || !$("rs-notes")) return;
  const SKILL = "sat.rw.rhetorical-synthesis", TITLE = "SAT: Rhetorical Synthesis";
  const practice = D.sets.filter((s) => !s.check), check = D.sets.filter((s) => s.check);
  const queue = practice.map((s) => ({ ...s, mode: "p" })).concat(shuffle(check).map((s) => ({ ...s, mode: "c" })));
  let i = 0, it = null, opts = [], need = new Set(), predicted = false, done = false, hintObj = null, spoiled = false, checkOk = 0;
  $("rs-types").append(...Object.values(D.types).map((t) => h("li", { text: t })));
  T.badge($("rs-badge"), SKILL, TITLE);

  function matrix(picked) {
    const wrap = $("rs-mx"); wrap.innerHTML = "";
    const n = it.notes.length;
    const tbl = h("table", { class: "rw-mx" },
      h("caption", { text: "● - нұсқа осы жазбаны қолданады; алтын баған - мақсатқа міндетті жазба. Соңғы баған - мақсат орындала ма." }),
      h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "Нұсқа" }), ...it.notes.map((_, k) => h("th", { scope: "col", class: it.need.includes(k) ? "need" : "", text: "№" + (k + 1) + (it.need.includes(k) ? " ★" : "") })), h("th", { scope: "col", text: "Мақсат" }))),
      h("tbody", {}, ...opts.map((o, r) => h("tr", { class: r === picked ? "pick" : "" }, h("th", { scope: "row", text: RW.L[r] + (r === picked ? " (сен)" : "") }),
        ...Array.from({ length: n }, (_, k) => h("td", { class: (o.uses.includes(k) ? "on" : "off") + (it.need.includes(k) ? " need" : "") }, h("span", { class: "sr-only", text: o.uses.includes(k) ? "қолданады" : "жоқ" }))),
        h("td", { class: "goal " + (o.ok ? "yes" : "nope"), text: o.ok ? "✓ иә" : (it.need.every((k) => o.uses.includes(k)) ? "✗ екпін басқа" : "✗ жетпейді") })))));
    wrap.append(tbl);
  }

  function load() {
    it = queue[i]; predicted = false; done = false; spoiled = false; need = new Set();
    const c = it.mode === "c";
    $("rs-prog").textContent = c ? `Меңгеру тексерісі: жаңа жиынтық ${i - practice.length + 1} / ${check.length} · көмексіз, матрица жауаптан кейін` : `Жаттығу жиынтығы ${i + 1} / ${practice.length}`;
    $("rs-type").textContent = "Мақсат түрі: " + D.types[it.type];
    $("rs-goal").textContent = it.goal;
    const ul = $("rs-notes"); ul.innerHTML = "";
    it.notes.forEach((t, k) => {
      const b = h("button", { type: "button", "aria-pressed": "false", "data-n": k, lang: "en" }, t);
      b.addEventListener("click", () => { if (predicted || c) return; need.has(k) ? need.delete(k) : need.add(k); b.setAttribute("aria-pressed", String(need.has(k))); });
      ul.append(h("li", {}, h("i", { "aria-hidden": "true", text: "№" + (k + 1) }), b));
    });
    opts = shuffle(it.opts);
    RW.options($("rs-opts"), opts.map((o) => o.t), pickOpt);
    $("rs-s1").hidden = c; $("rs-s2").hidden = !c;
    $("rs-pcheck").disabled = false;
    ["rs-fb1", "rs-fb2"].forEach((id) => RW.clear($(id)));
    $("rs-why").innerHTML = ""; $("rs-mx").innerHTML = ""; $("rs-board").hidden = true; $("rs-next").hidden = true;
    $("rs-h").hidden = c;
    const good = opts.findIndex((o) => o.ok);
    const steps = [
      "Мақсаттағы кілт сөзді тап: «introduce» (не екенін айт), «similarity / difference» (екеуін салыстыр), «explain why / how» (себеп), «emphasize» (нені?). Сосын осы мақсатқа қай жазбалар керек екенін белгіле.",
      "Ұқсас мысал: мақсат - «екі қаланың айырмашылығын көрсету». «Both cities are on rivers» - ұқсастық (қате). «City A is older» - бір қала ғана (қате). «City A is old, while City B is new» - екеуі + қарсы қою (дұрыс).",
      `Шешім: міндетті жазбалар - ${it.need.map((k) => "№" + (k + 1)).join(", ")}. Оларды мақсатқа сай байланыстыратын нұсқа - ${RW.L[good]}. ${opts[good].why}`,
    ];
    if (!hintObj) hintObj = T.hints($("rs-h"), steps, { onSolution: () => { spoiled = true; T.feedback($("rs-fb2"), "info", "Шешім ашылды.", "Бұл жиынтық меңгеруге саналмайды; соңындағы жаңа жиынтықтарды көмексіз шеш."); } });
    else hintObj.reset(steps);
  }

  $("rs-pcheck").addEventListener("click", () => {
    if (predicted) return;
    predicted = true; $("rs-pcheck").disabled = true;
    const miss = it.need.filter((k) => !need.has(k)), extra = [...need].filter((k) => !it.need.includes(k));
    $("rs-notes").querySelectorAll("button").forEach((b) => { const k = +b.dataset.n; b.disabled = true; if (it.need.includes(k)) b.classList.add(need.has(k) ? "need" : "miss"); });
    const ok = !miss.length && !extra.length;
    T.feedback($("rs-fb1"), ok ? "ok" : "info", ok ? "Болжам дәл: мақсатқа керек жазбаларды таптың." : "Болжамды салыстыр:", (miss.length ? `Түсіп қалған міндетті жазба: ${miss.map((k) => "№" + (k + 1)).join(", ")} (қызыл жиек). ` : "") + (extra.length ? `Артық: ${extra.map((k) => "№" + (k + 1)).join(", ")} - дұрыс факт, бірақ осы мақсатқа қажет емес. ` : "") + "Дұрыс нұсқа міндетті жазбалардың бәрін мақсатқа сай байланыстырады; басқа жазбаларды қолдануы міндетті емес.");
    $("rs-s2").hidden = false; focus($("rs-opts").querySelector("button"));
  });

  function pickOpt(k) {
    if (done) return;
    done = true;
    const good = opts.findIndex((o) => o.ok), ok = k === good, c = it.mode === "c", o = opts[k];
    RW.settle($("rs-opts"), good, k);
    $("rs-board").hidden = false; matrix(k);
    const missing = it.need.filter((n) => !o.uses.includes(n));
    T.feedback($("rs-fb2"), ok ? "ok" : "bad", ok ? `Дұрыс: ${RW.L[k]}.` : `Мақсат орындалмады: ${RW.L[k]}.`, o.why + (ok ? "" : (missing.length ? ` Міндетті жазба түсіп қалған: ${missing.map((n) => "№" + (n + 1)).join(", ")}.` : "") + ` Дұрысы - ${RW.L[good]}: ${opts[good].why}`));
    RW.whyList($("rs-why"), opts.map((x) => x.t), opts.map((x) => x.why), good);
    T.record(SKILL, { item: it.id, ok: ok && !spoiled, hints: c ? 0 : spoiled ? 3 : hintObj.used(), error: ok ? "" : missing.length ? "missing-note" : "wrong-emphasis", note: ok ? "" : it.goal, title: TITLE });
    if (c && ok) checkOk++;
    const last = i === queue.length - 1;
    $("rs-next").hidden = false;
    $("rs-next").textContent = last ? "Нәтиже" : i === practice.length - 1 ? "Меңгеру тексерісіне өту" : "Келесі жиынтық";
  }
  $("rs-next").addEventListener("click", () => {
    if (i < queue.length - 1) { i++; load(); RW.toTop($("rs-lab")); focus($("rs-notes").querySelector("button") ); return; }
    $("rs-next").hidden = true;
    const pass = checkOk >= check.length - 1;
    T.feedback($("rs-fb2"), pass ? "ok" : "info", `Меңгеру тексерісі: ${checkOk} / ${check.length}`, pass ? "Жаңа жазбаларда мақсатты көмексіз таптың - дағды қалыптасқан." : "Қате жиынтықтардың матрицасын қайта қара: міндетті жазба түсіп қалды ма, әлде екпін басқа ма? Бетті жаңартып қайта бастауға болады.");
  });
  load();
  window.SATRW.rhet = { state: () => ({ it, opts, i }) };
})();
