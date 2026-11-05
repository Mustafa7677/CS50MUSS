/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: екілік іздеу зертханасы (academy/labs/binary-search.html).
   Алгоритм: lo = 0, hi = n − 1; lo ≤ hi болғанша mid = (lo + hi) // 2; a[mid] = t → табылды; a[mid] < t → lo = mid + 1;
   әйтпесе hi = mid − 1. «Бір салыстыру» = a[mid]-ті мақсатпен бір рет салыстыру (нәтижесі: тең, кіші не үлкен).
   Сызықтық іздеу: сол жақтан бастап әр элементпен салыстырады (табылса - индекс + 1, табылмаса - n салыстыру). */
(() => {
  "use strict";
  const root = document.querySelector("[data-cslab=bsearch]");
  if (!root) return;
  const T = window.AO17Tutor;
  const $ = (s, r = root) => r.querySelector(s);
  const N = 15;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function makeArr() { const s = new Set(); while (s.size < N) s.add(rnd(1, 99)); return [...s].sort((a, b) => a - b); }
  function randTarget(a) { return Math.random() < 0.75 ? a[rnd(0, a.length - 1)] : (() => { let t; do t = rnd(1, 99); while (a.includes(t)); return t; })(); }

  /** Екілік іздеу трассасы. ceil - mid-ті жоғары дөңгелету (диагностика үшін ғана). */
  function search(a, t, ceil = false) {
    let lo = 0, hi = a.length - 1, comps = 0;
    const F = [{ lo, hi, mid: null, phase: "start", comps, msg: `Бастау: бүкіл тізім, lo = 0, hi = ${hi}. Тізім өсу ретімен сұрыпталған - екілік іздеудің шарты осы.` }];
    const mids = [];
    while (lo <= hi && comps < 20) {
      const mid = ceil ? Math.ceil((lo + hi) / 2) : Math.floor((lo + hi) / 2), v = a[mid];
      comps++; mids.push(mid);
      const rel = v === t ? "=" : v < t ? "<" : ">";
      F.push({ lo, hi, mid, phase: "mid", rel, comps, msg: `${comps}-салыстыру: mid = (${lo} + ${hi}) // 2 = ${mid}, a[${mid}] = ${v}. Мақсат ${t}: ${v} ${rel} ${t}.` });
      if (v === t) { F.push({ lo, hi, mid, phase: "found", comps, msg: `a[${mid}] = ${t} - табылды! ${comps} салыстыру жеткілікті болды.` }); return { F, mids, found: mid, comps }; }
      if (v < t) { const was = lo; lo = mid + 1; F.push({ lo, hi, mid, phase: "cut", side: "left", comps, msg: `${v} < ${t}: сұрыпталған тізімде ${t} тек mid-тің ОҢ жағында болуы мүмкін. Сол жағын (${was}..${mid} индекстері, mid қоса) тастаймыз: lo = mid + 1 = ${lo}.` + (lo > hi ? ` Енді lo > hi - аралық бос: ${t} тізімде жоқ.` : "") }); }
      else { const was = hi; hi = mid - 1; F.push({ lo, hi, mid, phase: "cut", side: "right", comps, msg: `${v} > ${t}: ${t} тек mid-тің СОЛ жағында болуы мүмкін. Оң жағын (${mid}..${was} индекстері, mid қоса) тастаймыз: hi = mid − 1 = ${hi}.` + (lo > hi ? ` Енді lo > hi - аралық бос: ${t} тізімде жоқ.` : "") }); }
    }
    return { F, mids, found: -1, comps };
  }
  const linear = (a, t) => { const i = a.indexOf(t); return i < 0 ? a.length : i + 1; };

  let A = makeArr(), tgt = randTarget(A), run = null, k = 0, timer = null, predict = false, score = { ok: 0, n: 0 };
  const fb = $("[data-fb=pred]");
  function recompute() { stop(); run = search(A, tgt); k = 0; score = { ok: 0, n: 0 }; fb.className = ""; fb.textContent = ""; $("[data-k=t]").value = String(tgt); draw(); }

  function draw() {
    const f = run.F[k], arr = $(".bs-arr"), ptr = $(".bs-ptr");
    arr.style.setProperty("--n", A.length); ptr.style.setProperty("--n", A.length);
    arr.innerHTML = A.map((v, i) => {
      const out = i < f.lo || i > f.hi || (f.phase === "cut" && i === f.mid);
      const cls = f.phase === "found" && i === f.mid ? "hit" : f.phase === "mid" && i === f.mid ? "mid" : out ? "out" : "";
      return `<div class="bs-cell ${cls}"><b>${v}</b><small>${i}</small></div>`;
    }).join("");
    arr.setAttribute("aria-label", `Тізім: ${A.join(", ")}. Іздеу аралығы: ${f.lo > f.hi ? "бос" : `${f.lo}..${f.hi} индекстері`}` + (f.mid != null && f.phase !== "cut" ? `, mid = ${f.mid}` : ""));
    ptr.innerHTML = A.map((_, i) => {
      const t = []; if (i === f.lo && f.lo <= f.hi) t.push("lo"); if (f.mid === i && f.phase !== "cut") t.push("mid"); if (i === f.hi && f.lo <= f.hi) t.push("hi");
      return `<span class="${t.includes("mid") ? "" : "lohi"}">${t.join("\n")}</span>`;
    }).join("");
    const say = $(".cs-say"); say.innerHTML = ""; const b = document.createElement("b"); b.textContent = `${k}-қадам. `; say.append(b, document.createTextNode(f.msg));
    $(".cs-n").textContent = `${k} / ${run.F.length - 1}`;
    const end = k >= run.F.length - 1, lin = linear(A, tgt), bound = Math.ceil(Math.log2(A.length + 1));
    $("[data-k=bc]").textContent = f.comps; $("[data-k=bbar]").style.width = (f.comps / A.length) * 100 + "%";
    $("[data-k=lc]").textContent = end ? lin : "?"; $("[data-k=lbar]").style.width = end ? (lin / A.length) * 100 + "%" : "0%";
    $("[data-k=sum]").textContent = end ? `Екілік іздеу: ${run.comps} салыстыру; сызықтық іздеу осы мақсатқа ${lin} салыстыру жасар еді. ${A.length} элементте екілік іздеу ең көбі ⌈log₂(${A.length} + 1)⌉ = ${bound} салыстыру жасайды, ал сызықтық - ${A.length}.` : "Сызықтық іздеумен салыстыру соңында көрсетіледі.";
    $("[data-c=prev]").disabled = k === 0; $("[data-c=next]").disabled = end;
    $("[data-c=play]").disabled = predict || end || !!timer; $("[data-c=pause]").disabled = !timer;
    const ask = $(".bs-ask"); ask.hidden = !(predict && f.phase === "mid");
    if (!ask.hidden) $("[data-k=askq]").textContent = `a[mid] = ${A[f.mid]}, мақсат ${tgt}. Келесі қадамда не болады?`;
    $(".cs-score").textContent = predict ? `Болжам: ${score.ok} / ${score.n} дұрыс` : "";
  }
  function onPredict(ch) {
    const f = run.F[k], v = A[f.mid], want = f.rel === "=" ? "found" : f.rel === "<" ? "left" : "right";
    score.n++;
    const ok = ch === want;
    let why;
    if (ok) why = want === "found" ? `a[${f.mid}] = ${v} мақсатқа тең.` : want === "left" ? `${v} < ${tgt}: сол жақтағылардың бәрі ${v}-ден кіші, демек ${tgt}-ден де кіші.` : `${v} > ${tgt}: оң жақтағылардың бәрі ${v}-ден үлкен, демек ${tgt}-ден де үлкен.`;
    else if (ch === "found") why = `a[mid] = ${v}, ал мақсат ${tgt}: ${v} ≠ ${tgt}. Тек тең болғанда ғана тоқтаймыз.`;
    else if (want === "found") why = `a[mid] = ${v} мақсатқа дәл тең - ештеңе тастамаймыз, іздеу аяқталды.`;
    else if (want === "left") why = `${v} < ${tgt}. Тізім өсу ретімен сұрыпталған: mid-тің СОЛ жағындағылар ${v}-ден кіші, сондықтан ${tgt} сол жақта бола алмайды. Сол жағын (mid қоса) тастаймыз: lo = mid + 1. Сіз керісінше, ${tgt} кіші жақта деп ойладыңыз.`;
    else why = `${v} > ${tgt}. mid-тің ОҢ жағындағылар ${v}-ден үлкен, ${tgt} онда бола алмайды. Оң жағын (mid қоса) тастаймыз: hi = mid − 1.`;
    if (ok) score.ok++;
    T.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс" : "Қате болжам", why);
    T.record("cs.binsearch.predict", { item: "predict", ok, error: ok ? "" : ch === "found" || want === "found" ? "equal" : "direction", note: why, title: "Екілік іздеу: қай жартысы тасталады" });
    k++; draw();
  }
  function step(d) { const n = Math.max(0, Math.min(run.F.length - 1, k + d)); if (n !== k) { k = n; fb.className = ""; fb.textContent = ""; draw(); } }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function play() { if (timer || predict) return; const sp = +$("[data-c=speed]").value || 1; timer = setInterval(() => { if (k >= run.F.length - 1) { stop(); draw(); return; } step(1); }, 1400 / sp); step(1); draw(); }
  $("[data-c=play]").addEventListener("click", play);
  $("[data-c=pause]").addEventListener("click", () => { stop(); draw(); });
  $("[data-c=next]").addEventListener("click", () => { stop(); step(1); });
  $("[data-c=prev]").addEventListener("click", () => { stop(); step(-1); });
  $("[data-c=reset]").addEventListener("click", recompute);
  $("[data-c=speed]").addEventListener("change", () => { if (timer) { stop(); play(); } });
  $("[data-c=newarr]").addEventListener("click", () => { A = makeArr(); tgt = randTarget(A); recompute(); });
  $("[data-c=go]").addEventListener("click", () => {
    const v = parseInt($("[data-k=t]").value, 10);
    if (!(v >= 1 && v <= 99)) { $(".cs-say").textContent = "1-ден 99-ға дейінгі бүтін сан жазыңыз."; return; }
    tgt = v; recompute();
  });
  $("[data-k=t]").addEventListener("keydown", (e) => { if (e.key === "Enter") $("[data-c=go]").click(); });
  $("[data-k=predict]").addEventListener("change", (e) => { predict = e.target.checked; recompute(); });
  root.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => onPredict(b.dataset.p)));
  recompute();

  // ---------------------------------------------------------------- тексеру: жаңа тізім, көмексіз
  const task = document.querySelector("[data-cslab=bsearch-task]");
  const tq = (s) => task.querySelector(s);
  let P = null, HN = null, helped = false;
  function newTask() {
    const a = makeArr(), t = randTarget(a), r = search(a, t);
    P = { a, t, r };
    helped = false;
    tq("[data-k=arr]").innerHTML = a.map((v, i) => `<div class="bs-cell"><b>${v}</b><small>${i}</small></div>`).join("");
    tq("[data-k=arr]").style.setProperty("--n", a.length);
    tq("[data-k=arr]").setAttribute("aria-label", "Тізім (индекс 0-ден): " + a.join(", "));
    tq("[data-k=q]").textContent = `Мақсат: ${t}. Екілік іздеу қандай a[mid] мәндерімен салыстырады? Салыстырылған сандарды ретімен, бос орын арқылы жазыңыз (тізімде жоқ болуы да мүмкін).`;
    tq("[data-k=ans]").value = ""; tq("[data-fb=task]").className = ""; tq("[data-fb=task]").textContent = "";
    const steps = r.F.filter((f) => f.phase === "mid").map((f) => `lo = ${f.lo}, hi = ${f.hi} → mid = ${f.mid}, a[mid] = ${a[f.mid]} (${a[f.mid]} ${f.rel} ${t})`);
    HN = T.hints(tq("[data-k=hints]"), [
      "Индекстерді 0-ден санаңыз. Әр қадамда mid = (lo + hi) // 2 (төменге дөңгелектейміз), a[mid]-ті мақсатпен салыстырыңыз, сосын mid-ті ҚОСА тастаңыз: lo = mid + 1 не hi = mid − 1.",
      "Мысал: [2, 5, 8, 12, 16, 23, 38], мақсат 23. lo = 0, hi = 6 → mid = 3, a[3] = 12 < 23 → lo = 4. mid = (4 + 6) // 2 = 5, a[5] = 23 - табылды. Жауап: 12 23.",
      steps.join("; ") + (r.found < 0 ? "; lo > hi - жоқ" : " - табылды") + `. Жауап: ${r.mids.map((m) => a[m]).join(" ")}.`,
    ], { onSolution: () => { helped = true; T.feedback(tq("[data-fb=task]"), "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. «Жаңа есеп» басып, келесісін көмексіз шығарыңыз."); } });
  }
  function check() {
    const { a, t, r } = P, out = tq("[data-fb=task]"), nums = (tq("[data-k=ans]").value.match(/\d+/g) || []).map(Number);
    if (!nums.length) { T.feedback(out, "info", "Жауап бос", "Салыстырылған a[mid] мәндерін бос орын арқылы жазыңыз."); return; }
    const want = r.mids.map((m) => a[m]), ok = nums.join() === want.join();
    let ttl, why, code = "";
    if (ok) { ttl = "Дұрыс"; why = `${want.length} салыстыру` + (r.found < 0 ? `, сосын lo > hi - ${t} тізімде жоқ.` : ` - ${t} табылды (индекс ${r.found}).`) + ` Сызықтық іздеу ${linear(a, t)} салыстыру жасар еді.`; }
    else {
      const ce = search(a, t, true).mids.map((m) => a[m]);
      const i = nums.findIndex((v, j) => v !== want[j]);
      if (nums.join() === ce.join()) { ttl = "mid жоғары дөңгелектелді"; code = "ceil"; why = "Сіз mid-ті жоғары дөңгелектедіңіз. Бұл зертханада (және Python-да) mid = (lo + hi) // 2 - бүтін бөлу, төменге дөңгелектейді: (0 + 14) // 2 = 7, (8 + 14) // 2 = 11."; }
      else if (i === -1) { ttl = "Тізбек толық емес"; code = "short"; why = `Алғашқы ${nums.length} сан дұрыс, бірақ іздеу ${want.length} салыстыру жасайды.` + (r.found < 0 ? " Аралық бос болғанша (lo > hi) жалғастырыңыз." : ` ${t} табылғанша жалғастырыңыз.`); }
      else {
        const f = r.F.filter((x) => x.phase === "mid")[i];
        ttl = `${i + 1}-салыстыруда қате`; code = i === 0 ? "first-mid" : "range";
        why = f ? `Сол сәтте lo = ${f.lo}, hi = ${f.hi}, сондықтан mid = (${f.lo} + ${f.hi}) // 2 = ${f.mid}, a[${f.mid}] = ${a[f.mid]}. Сіз ${nums[i]} жаздыңыз.` + (i > 0 ? " Алдыңғы қадамда mid-ті қоса тастағаныңызды тексеріңіз (lo = mid + 1 не hi = mid − 1)." : " Индекс 0-ден басталады: 15 элементте hi = 14.")
          : `Іздеу ${want.length} салыстырудан кейін тоқтайды` + (r.found < 0 ? " (lo > hi)." : " (табылды).");
      }
      ttl += `. Дұрысы: ${want.join(" ")}`;
    }
    const hints = helped ? 3 : HN.used();
    T.feedback(out, ok ? "ok" : "bad", ok && hints ? `${ttl} (${hints} көмекпен)` : ttl, why);
    T.record("cs.binsearch", { item: "mids", ok, hints, error: code, note: why, title: "Екілік іздеу: mid тізбегі" });
  }
  tq("[data-c=check]").addEventListener("click", check);
  tq("[data-k=ans]").addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
  tq("[data-c=new]").addEventListener("click", newTask);
  newTask();
  document.querySelectorAll("[data-badge]").forEach((el) => T.badge(el, el.dataset.badge, el.dataset.title));
  window.CSLabBSearch = { search, linear };
})();
