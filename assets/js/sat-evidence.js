/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Дәлел іздеуші»: жауап + дәлел сөйлемі. Екеуін бөлек тексеріп, сәйкессіздікті түсіндіреді.
   Алғашқы 5 мәтін - көмекпен жаттығу, соңғы 2 - көмексіз меңгеру тексерісі. */
(() => {
  "use strict";
  const D = window.SAT_EVIDENCE, T = window.AO17Tutor, { h } = window.SAT;
  const $ = (id) => document.getElementById(id);
  if (!D || !$("ev-text")) return;
  const SKILL = "sat.rw.evidence", TITLE = "SAT: Command of Evidence (Textual)";
  const CHECK_FROM = D.length - 2, L = "ABCD";
  T.badge($("ev-badge"), SKILL, TITLE);
  let i = 0, it, choice = -1, sel = new Set(), recorded = false, solved = false, hintObj = null, spoiled = false;
  const nums = (arr) => arr.map((k) => k + 1).join(", ");

  function load() {
    it = D[i]; choice = -1; sel = new Set(); recorded = false; solved = false; spoiled = false;
    const check = i >= CHECK_FROM;
    $("ev-prog").textContent = check ? `Меңгеру тексерісі: жаңа мәтін ${i - CHECK_FROM + 1} / ${D.length - CHECK_FROM} · көмексіз` : `Жаттығу мәтіні ${i + 1} / ${CHECK_FROM}`;
    $("ev-kind").textContent = it.kind;
    const p = $("ev-text"); p.innerHTML = "";
    it.s.forEach((s, k) => {
      const b = h("button", { type: "button", class: "lab-sel", "aria-pressed": "false", "data-i": k, "aria-label": `${k + 1}-сөйлем: ${s}` }, h("sup", { "aria-hidden": "true", text: String(k + 1) }), " " + s);
      b.addEventListener("click", () => toggle(k, b));
      p.append(b, " ");
    });
    $("ev-q").textContent = it.q;
    const o = $("ev-opts"); o.innerHTML = "";
    it.choices.forEach((c, k) => {
      const b = h("button", { type: "button", "aria-pressed": "false", "data-c": k }, h("i", { "aria-hidden": "true", text: L[k] }), h("span", { text: c }));
      b.setAttribute("aria-label", `${L[k]}. ${c}`);
      b.addEventListener("click", () => { if (solved) return; choice = k; o.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
      o.append(b);
    });
    paintSel();
    $("ev-fb").className = ""; $("ev-fb").textContent = "";
    $("ev-next").hidden = true; $("ev-check").disabled = false;
    const steps = [
      "Алдымен сұрақтың кілт сөзін тап (мысалы, «limitation», «authors would agree», «why»). Содан кейін дәл сол туралы айтатын сөйлемді ізде - фон немесе әдіс сипаттамасы емес.",
      "Ұқсас мысал: «The museum opened in 1990. It closed early on Friday because a storm cut the power. Visitors were given free tickets.» Сұрақ: Why did the museum close early? Дәлел - тек 2-сөйлем (себебі сонда). 1- және 3-сөйлемдер тақырыпқа жақын, бірақ себепті айтпайды.",
      `Шешім: дұрыс жауап - ${L[it.ans]}. Дәлел: ${it.sets.map((s) => nums(s) + "-сөйлем").join(" немесе ")}. ${it.partial || ""}`.trim(),
    ];
    $("ev-h").hidden = check;
    if (!hintObj) hintObj = T.hints($("ev-h"), steps, { onSolution: () => { spoiled = true; T.feedback($("ev-fb"), "info", "Шешім ашылды.", "Бұл мәтін меңгеруге саналмайды. Белгілеп, тексеріп көр де, келесі мәтінге өт."); } });
    else hintObj.reset(steps);
  }
  function toggle(k, b) {
    if (solved) return;
    sel.has(k) ? sel.delete(k) : sel.add(k);
    b.setAttribute("aria-pressed", String(sel.has(k)));
    paintSel();
  }
  function paintSel() { $("ev-sel").textContent = "Белгіленген дәлел: " + (sel.size ? [...sel].sort().map((k) => k + 1 + "-сөйлем").join(", ") : "жоқ"); }

  $("ev-check").addEventListener("click", () => {
    if (choice < 0) return T.feedback($("ev-fb"), "info", "Алдымен жауапты таңда.", "A-D нұсқаларының бірін бас.");
    if (!sel.size) return T.feedback($("ev-fb"), "info", "Дәлел сөйлемін белгіле.", "Мәтіннен жауабыңды дәлелдейтін сөйлемді (немесе сөйлемдерді) бас. SAT-та дұрыс жауаптың бәрі мәтінге сүйенеді.");
    const ansOk = choice === it.ans;
    const bad = [...sel].filter((k) => !it.allow.includes(k)).sort();
    const covered = it.sets.some((s) => s.every((k) => sel.has(k)));
    const evOk = covered && !bad.length;
    const badTxt = bad.map((k) => `${k + 1}-сөйлем: ${(it.notes && it.notes[k]) || "бұл сөйлем сұраққа жауап бермейді."}`).join(" ");
    const missing = !covered ? (it.partial || `Жауапты толық дәлелдейтін сөйлем белгіленбеді. Сұрақтың кілт сөзін тауып, сол айтылған сөйлемді ізде.`) : "";
    let kind, title, why;
    if (ansOk && evOk) { kind = "ok"; title = "Дұрыс жауап және дұрыс дәлел!"; why = `${L[it.ans]} нұсқасын ${[...sel].sort().map((k) => k + 1).join(", ")}-сөйлем тікелей дәлелдейді.`; }
    else if (ansOk) { kind = "bad"; title = "Жауап дұрыс, бірақ дәлел дұрыс емес."; why = [badTxt, missing].filter(Boolean).join(" ") + " Емтиханда «сезім бойынша» дұрыс тапқан жауап келесі жолы қате болуы мүмкін - дәлелді тауып үйрен."; }
    else if (evOk) { kind = "bad"; title = "Дәлелің дұрыс, бірақ жауап оған сай емес."; why = `Сен белгілеген сөйлем ${L[it.ans]} нұсқасын қолдайды, ал сен ${L[choice]} таңдадың. ${it.why[choice]} Белгілеген дәлелді қайта оқып, онымен сәйкес келетін нұсқаны таңда.`; }
    else { kind = "bad"; title = "Жауап та, дәлел де дұрыс емес."; why = `${L[choice]}: ${it.why[choice]} ${badTxt} ${missing}`.replace(/\s+/g, " ").trim(); }
    T.feedback($("ev-fb"), kind, title, why);
    const ok = ansOk && evOk;
    if (!recorded) {
      recorded = true;
      const hints = i >= CHECK_FROM ? 0 : spoiled ? 3 : hintObj.used();
      T.record(SKILL, { item: it.id, ok, hints, error: ok ? "" : ansOk ? "wrong-evidence" : evOk ? "wrong-answer-right-evidence" : "both", note: why, title: TITLE });
    }
    if (ok) {
      solved = true;
      $("ev-check").disabled = true;
      $("ev-text").querySelectorAll("button").forEach((b) => { const k = +b.dataset.i; if (sel.has(k)) b.classList.add("ok"); });
      $("ev-opts").querySelector(`[data-c="${it.ans}"]`).classList.add("ok");
      if (i < D.length - 1) { $("ev-next").hidden = false; $("ev-next").textContent = i === CHECK_FROM - 1 ? "Меңгеру тексерісіне өту" : "Келесі мәтін"; }
      else T.feedback($("ev-fb"), "ok", "Барлық мәтін аяқталды!", "Дағды деңгейін жоғарыдағы белгіден көр. Енді емтихан симуляторында аралас сұрақтарды байқап көр.");
    } else {
      $("ev-text").querySelectorAll("button").forEach((b) => b.classList.toggle("no", bad.includes(+b.dataset.i)));
    }
  });
  $("ev-next").addEventListener("click", () => { i++; load(); window.SAT.focus($("ev-text").querySelector("button")); });
  load();
})();
