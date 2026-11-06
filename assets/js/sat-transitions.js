/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Transitions» зертханасы: 1) қатынасты анықта, 2) сөзді таңда, 3) диаграмма + әр нұсқаның түсіндірмесі.
   12 жаттығу жұбынан кейін - 6 жаңа мәтінмен көмексіз тексеру (меңгеру). */
(() => {
  "use strict";
  const D = window.SAT_TRANS, T = window.AO17Tutor, { h, shuffle } = window.SAT;
  const $ = (id) => document.getElementById(id);
  if (!D || !$("tr-s1")) return;
  const SKILL = "sat.rw.transitions", TITLE = "SAT: Transitions";
  const R = D.rels;

  $("tr-legend").append(...Object.values(R).map((r) => h("li", {}, h("b", { text: r.sym }), " " + r.kk + ": ", r.desc.replace(/\.$/, ""))));
  T.badge($("tr-badge"), SKILL, TITLE);

  const queue = D.practice.map((x) => ({ ...x, mode: "practice" })).concat(shuffle(D.check).map((x) => ({ ...x, mode: "check" })));
  let i = 0, it = null, relFirst = null, done = false, hintObj = null, checkOk = 0;

  const sym = (rel, label) => { const s = $("tr-sym"); s.textContent = rel ? R[rel].sym : "?"; s.append(h("small", { text: label || (rel ? R[rel].kk : "қатынас") })); $("tr-diag").setAttribute("aria-label", "Қатынас диаграммасы: 1-сөйлем " + (rel ? R[rel].sym + " (" + R[rel].kk + ")" : "? (әлі анықталмаған)") + " 2-сөйлем"); };
  const short = (s) => { const w = s.split(" "); return w.length > 7 ? w.slice(0, 7).join(" ") + "…" : s; };

  function load() {
    it = queue[i]; relFirst = null; done = false;
    const check = it.mode === "check";
    $("tr-prog").textContent = check ? `Меңгеру тексерісі: жаңа мәтін ${i - D.practice.length + 1} / ${D.check.length} · көмек пен диаграмма жауаптан кейін ғана` : `Жаттығу: ${i + 1} / ${D.practice.length}`;
    $("tr-s1").textContent = it.s1; $("tr-s2").textContent = it.s2; $("tr-blank").textContent = "______";
    const boxes = $("tr-diag").querySelectorAll(".box");
    boxes[0].textContent = short(it.s1); boxes[1].textContent = short(it.s2);
    sym(null);
    $("tr-fb1").className = ""; $("tr-fb1").textContent = ""; $("tr-fb2").className = ""; $("tr-fb2").textContent = ""; $("tr-why").innerHTML = "";
    $("tr-next").hidden = true;
    $("tr-step1").hidden = check; $("tr-step2").hidden = !check;
    // 1-қадам: қатынас
    const rb = $("tr-rels"); rb.innerHTML = "";
    Object.entries(R).forEach(([k, r]) => rb.append(h("button", { type: "button", "data-rel": k, "aria-pressed": "false", onclick: () => pickRel(k) }, r.sym + " " + r.kk)));
    // 2-қадам: сөз
    const ob = $("tr-opts"); ob.innerHTML = "";
    shuffle(it.opts).forEach((w) => ob.append(h("button", { type: "button", "data-w": w, "aria-pressed": "false", onclick: () => pickWord(w) }, w)));
    const rr = R[it.rel];
    const steps = [
      "Бос орынды жауып, екі сөйлемді қатар оқы. Сұра: 2-сөйлем 1-сөйлемнің нәтижесі ме, мысалы ма, керісінше ме, жай қосымша ма, басқа нысандағы ұқсас нәрсе ме?",
      "Ұқсас мысал: «The road was icy. ___, the school opened late.» Мұз (себеп) → кешігу (салдар), сондықтан Therefore / As a result. Ал «The road was icy. ___, every bus arrived on time.» - кедергіге қарамастан: Nevertheless.",
      `Шешім: ${it.note} Бұл - «${rr.kk}» қатынасы (${rr.sym}). Нұсқалардың ішінде осы қатынасты білдіретін сөз - ${it.ans}.`,
    ];
    $("tr-h").hidden = check;
    if (!hintObj) hintObj = T.hints($("tr-h"), steps, { onSolution: () => { T.feedback($("tr-fb2"), "info", "Шешім ашылды.", "Бұл жұп меңгеруге саналмайды; келесі жұпты көмексіз шешіп көр."); } });
    else hintObj.reset(steps);
  }

  function pickRel(k) {
    if (relFirst) return;
    relFirst = k;
    const ok = k === it.rel, rr = R[it.rel];
    $("tr-rels").querySelectorAll("button").forEach((b) => { b.disabled = true; b.setAttribute("aria-pressed", b.dataset.rel === k ? "true" : "false"); if (b.dataset.rel === it.rel) b.classList.add("ok"); else if (b.dataset.rel === k) b.classList.add("no"); });
    sym(it.rel);
    T.feedback($("tr-fb1"), ok ? "ok" : "bad", ok ? `Дұрыс: ${rr.sym} ${rr.kk}.` : `Жоқ, бұл - ${rr.sym} ${rr.kk}, ал сен «${R[k].kk}» таңдадың.`, it.note + (ok ? "" : ` «${R[k].kk}» болу үшін: ${R[k].desc.toLowerCase()}`));
    $("tr-step2").hidden = false;
    window.SAT.focus($("tr-opts").querySelector("button"));
  }

  function pickWord(w) {
    if (done) return;
    done = true;
    const ok = w === it.ans, check = it.mode === "check";
    $("tr-blank").textContent = w;
    $("tr-opts").querySelectorAll("button").forEach((b) => { b.disabled = true; b.setAttribute("aria-pressed", b.dataset.w === w ? "true" : "false"); if (b.dataset.w === it.ans) b.classList.add("ok"); else if (b.dataset.w === w) b.classList.add("no"); });
    sym(it.rel);
    const rr = R[it.rel], wr = R[D.words[w]];
    T.feedback($("tr-fb2"), ok ? "ok" : "bad", ok ? `Дұрыс: ${it.ans}.` : `Сәйкес емес: «${w}» - ${wr.sym} ${wr.kk}, ал мұндағы қатынас - ${rr.sym} ${rr.kk}.`, ok ? it.note : `${it.note} Дұрыс жауап - ${it.ans}.`);
    const ul = $("tr-why"); ul.innerHTML = "";
    it.opts.forEach((o) => {
      const r = R[D.words[o]], good = o === it.ans;
      const text = good ? ` - ${r.sym} ${r.kk}. ${it.note}` : ` - ${r.sym} ${r.kk} білдіреді: ${r.desc.toLowerCase()} Мұнда олай емес. ${(it.why && it.why[o]) || ""}`;
      ul.append(h("li", { class: good ? "ok" : "no" }, h("b", { lang: "en", text: (good ? "✓ " : "✗ ") + o }), text.trim() === "" ? "" : text));
    });
    const hints = check ? 0 : hintObj.used();
    const fullOk = ok && (check || relFirst === it.rel);
    T.record(SKILL, { item: it.id, ok: fullOk, hints, error: ok ? (fullOk ? "" : "relation") : "rel-" + D.words[w] + "-for-" + it.rel, note: ok ? "" : `${w} (${wr.kk}) орнына ${it.ans} (${rr.kk})`, title: TITLE });
    if (check && ok) checkOk++;
    const last = i === queue.length - 1;
    $("tr-next").hidden = false;
    $("tr-next").textContent = last ? "Нәтиже" : i === D.practice.length - 1 ? "Меңгеру тексерісіне өту" : "Келесі сөйлем жұбы";
  }

  $("tr-next").addEventListener("click", () => {
    if (i < queue.length - 1) { i++; load(); const lab = $("tr-s1").closest(".lab"); if (lab.getBoundingClientRect().top < 0) lab.scrollIntoView({ block: "start", behavior: "instant" }); return; }
    const pass = checkOk >= D.check.length - 1;
    $("tr-next").hidden = true;
    T.feedback($("tr-fb2"), pass ? "ok" : "info", `Меңгеру тексерісі: ${checkOk} / ${D.check.length}`, pass ? "Жаңа мәтіндерде қатынасты көмексіз таптың - дағды жақсы қалыптасқан. Енді емтихан симуляторында аралас сұрақтармен тексеріп көр." : "Қатені тапқан жұптарды қайта қара: қатынасты алдымен анықта, сосын сөзді таңда. Бетті жаңартып, қайта бастауға болады.");
  });
  load();
})();
