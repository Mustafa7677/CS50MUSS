/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W «Words in Context» зертханасы: 1) контекст белгісін (clue) сөйлемнен бас, 2) сигнал түрін ата (қарсылық / қайталау / себеп / мысал),
   3) «мағына көпірі» тақтасы: clue → сигнал → бос орын, 4) сөзді таңда. 12 жаттығу + 6 жаңа сөйлем көмексіз (меңгеру). */
(() => {
  "use strict";
  const D = window.SAT_RW_VOCAB, T = window.AO17Tutor, { h, shuffle, focus } = window.SAT, RW = window.SATRW;
  const $ = (id) => document.getElementById(id);
  if (!D || !$("vc-toks")) return;
  const SKILL = "sat.rw.words-in-context", TITLE = "SAT: Words in Context";
  const practice = D.items.filter((x) => !x.check), check = D.items.filter((x) => x.check);
  const queue = practice.map((x) => ({ ...x, mode: "p" })).concat(shuffle(check).map((x) => ({ ...x, mode: "c" })));
  const RX = /______|[A-Za-z0-9'’-]+|[:;—,.!?"]/g;
  const tok = (s) => s.match(RX) || [];
  const find = (toks, part) => { const p = tok(part).map((x) => x.toLowerCase()); for (let i = 0; i + p.length <= toks.length; i++) if (p.every((w, j) => toks[i + j].toLowerCase() === w)) return [i, i + p.length]; return [-1, -1]; };
  let i = 0, it, toks, sigR, clueR, clueOk = null, typeOk = null, done = false, hintObj = null, spoiled = false, checkOk = 0;

  $("vc-legend").append(...Object.entries(D.types).map(([k, t]) => h("li", {}, h("span", { class: "rw-sig-" + k, text: t.op + " " + t.kk }), " - " + t.desc)));
  T.badge($("vc-badge"), SKILL, TITLE);

  function paintMarks(reveal) {
    $("vc-toks").querySelectorAll("[data-i]").forEach((b) => {
      const k = +b.dataset.i, inS = k >= sigR[0] && k < sigR[1], inC = k >= clueR[0] && k < clueR[1];
      b.className = reveal && (inS || inC) ? "rw-anim rw-sig-" + it.type + (inC ? " rw-clue" : "") : "rw-anim";
    });
  }
  function bridge(stage) {
    const t = D.types[it.type];
    $("vc-cl").innerHTML = ""; $("vc-op").innerHTML = ""; $("vc-bl").innerHTML = "";
    $("vc-cl").append(h("small", { text: "Контекст (clue)" }), stage >= 1 ? h("span", { lang: "en", text: "«" + it.clue + "»" }) : "?");
    $("vc-op").append(stage >= 1 ? t.op : "?", h("small", { text: stage >= 1 ? t.kk + " · «" + it.sig + "»" : "сигнал" }));
    $("vc-bl").append(h("small", { text: "Бос орынның мағынасы" }), stage >= 2 ? it.mean : t && stage >= 1 ? (t.op === "≠" ? "clue-ға қарама-қарсы сөз" : t.op === "=" ? "clue-мен мағыналас сөз" : t.op === "→" ? "себеп-салдарға сай сөз" : "мысалдарды жинақтайтын сөз") : "?");
    $("vc-board").setAttribute("aria-label", stage >= 1 ? `Мағына көпірі: «${it.clue}» ${t.op} бос орын (${t.kk})${stage >= 2 ? ", мағынасы: " + it.mean : ""}` : "Мағына көпірі: әлі ашылмаған");
  }
  function load() {
    it = queue[i]; clueOk = null; typeOk = null; done = false; spoiled = false;
    const c = it.mode === "c";
    $("vc-prog").textContent = c ? `Меңгеру тексерісі: жаңа сөйлем ${i - practice.length + 1} / ${check.length} · көмексіз, белгілер жауаптан кейін` : `Жаттығу: ${i + 1} / ${practice.length}`;
    toks = tok(it.s); sigR = find(toks, it.sig); clueR = find(toks, it.clue);
    const box = $("vc-toks"); box.innerHTML = "";
    let pos = 0;
    [...it.s.matchAll(RX)].forEach((m, k) => {
      if (m.index > pos) box.append(it.s.slice(pos, m.index));
      pos = m.index + m[0].length;
      const w = m[0];
      if (w === "______") { box.append(h("span", { class: "blank", id: "vc-blank", text: "______" })); return; }
      const b = h("button", { type: "button", "data-i": k, "aria-pressed": "false" }, w); b.addEventListener("click", () => pickClue(k, b)); box.append(b);
    });
    const tb = $("vc-types"); tb.innerHTML = "";
    Object.entries(D.types).forEach(([k, t]) => { const b = h("button", { type: "button", "data-t": k, "aria-pressed": "false" }, t.op + " " + t.kk); b.addEventListener("click", () => pickType(k, b)); tb.append(b); });
    RW.options($("vc-opts"), it.opts, pickWord);
    ["vc-fb1", "vc-fb2", "vc-fb3"].forEach((id) => RW.clear($(id)));
    $("vc-why").innerHTML = ""; $("vc-next").hidden = true;
    $("vc-s1").hidden = c; $("vc-s2").hidden = true; $("vc-s3").hidden = !c; $("vc-board").hidden = c; $("vc-h").hidden = c;
    paintMarks(false); bridge(0);
    const t = D.types[it.type];
    const steps = [
      "Бос орынның маңайынан сигналды ізде: although/but/unlike (қарсылық), қос нүкте/сызықша/that is (түсіндіру), because/so/since (себеп), for example/including (мысал). Сигналдан кейінгі (не алдындағы) бөлік - clue.",
      "Ұқсас мысал: «Unlike her noisy cousins, Mira was ______.» Сигнал - Unlike (≠), clue - noisy. Демек бос орын - «noisy»-дің керісі: quiet, calm.",
      `Шешім: сигнал «${it.sig}» (${t.kk}), clue - «${it.clue}». Бос орынның мағынасы - ${it.mean}; ол «${it.opts[it.ans]}».`,
    ];
    if (!hintObj) hintObj = T.hints($("vc-h"), steps, { onSolution: () => { spoiled = true; T.feedback($("vc-fb3"), "info", "Шешім ашылды.", "Бұл сөйлем меңгеруге саналмайды; соңындағы жаңа сөйлемдерді көмексіз шеш."); } });
    else hintObj.reset(steps);
  }
  function pickClue(k, b) {
    if (clueOk !== null || it.mode === "c") return;
    clueOk = (k >= clueR[0] && k < clueR[1]) || (k >= sigR[0] && k < sigR[1]);
    b.setAttribute("aria-pressed", "true");
    $("vc-toks").querySelectorAll("button").forEach((x) => { x.disabled = true; });
    paintMarks(true);
    T.feedback($("vc-fb1"), clueOk ? "ok" : "bad", clueOk ? `Дұрыс: «${toks[k]}» - контекст белгісінің бөлігі.` : `«${toks[k]}» бос орынның мағынасын айтпайды.`, `Сигнал - «${it.sig}», мағынаны айтатын clue - «${it.clue}» (сөйлемде боялды). ${clueOk ? "" : "Бос орынға сөз таңдағанда дәл осы бөлікке сүйен; тақырып сөздері (зат, орын) мағынаны айтпайды."}`);
    $("vc-s2").hidden = false; focus($("vc-types").querySelector("button"));
  }
  function pickType(k, b) {
    if (typeOk !== null) return;
    typeOk = k === it.type;
    $("vc-types").querySelectorAll("button").forEach((x) => { x.disabled = true; x.setAttribute("aria-pressed", String(x === b)); if (x.dataset.t === it.type) x.classList.add("ok"); else if (x === b) x.classList.add("no"); });
    bridge(1);
    const t = D.types[it.type];
    T.feedback($("vc-fb2"), typeOk ? "ok" : "bad", typeOk ? `Дұрыс: ${t.op} ${t.kk}.` : `Жоқ: бұл - ${t.op} ${t.kk}, ал сен «${D.types[k].kk}» таңдадың.`, `«${it.sig}»: ${t.desc}`);
    $("vc-s3").hidden = false; focus($("vc-opts").querySelector("button"));
  }
  function pickWord(k) {
    if (done) return;
    done = true;
    const ok = k === it.ans, c = it.mode === "c";
    RW.settle($("vc-opts"), it.ans, k);
    $("vc-blank").textContent = it.opts[k];
    paintMarks(true); $("vc-board").hidden = false; bridge(2);
    T.feedback($("vc-fb3"), ok ? "ok" : "bad", ok ? `Дұрыс: «${it.opts[k]}».` : `Сәйкес емес: «${it.opts[k]}».`, it.why[k] + (ok ? "" : ` Дұрысы - «${it.opts[it.ans]}» (${it.mean}).`));
    RW.whyList($("vc-why"), it.opts, it.why, it.ans);
    const full = ok && (c || (clueOk && typeOk)) && !spoiled;
    T.record(SKILL, { item: it.id, ok: full, hints: c ? 0 : spoiled ? 3 : hintObj.used(), error: ok ? (full ? "" : "clue-or-signal") : "word-" + it.type, note: ok ? "" : `${it.opts[k]} орнына ${it.opts[it.ans]}`, title: TITLE });
    if (c && ok) checkOk++;
    const last = i === queue.length - 1;
    $("vc-next").hidden = false;
    $("vc-next").textContent = last ? "Нәтиже" : i === practice.length - 1 ? "Меңгеру тексерісіне өту" : "Келесі сөйлем";
  }
  $("vc-next").addEventListener("click", () => {
    if (i < queue.length - 1) { i++; load(); RW.toTop($("vc-lab")); focus($("vc-toks").querySelector("button") || $("vc-opts").querySelector("button")); return; }
    $("vc-next").hidden = true;
    const pass = checkOk >= check.length - 1;
    T.feedback($("vc-fb3"), pass ? "ok" : "info", `Меңгеру тексерісі: ${checkOk} / ${check.length}`, pass ? "Жаңа сөйлемдерде мағынаны контекстен көмексіз таптың." : "Қате сөйлемдерде алдымен сигнал мен clue-ды тап: сөзді «білемін» деп емес, мәтін не айтып тұрғанына қарап таңда.");
  });
  load();
  window.SATRW.vocab = { state: () => ({ it, sigR, clueR, i }) };
})();
