/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: Python Execution Visualizer (academy/labs/python.html).
   Код нағыз Python-да орындалады: Pyodide академиядағыдай main.js-тегі CS50KZ.getPyodide() арқылы жүктеледі,
   assets/py/cslab_trace.py ішіндегі sys.settrace трассалаушысы әр жолдың алдындағы күйді (жақтаулар, айнымалылар, stdout)
   жазады, мұнда сол кадрлар алға/артқа ойнатылады. Болжау сұрақтарының дұрыс жауабы JS-те қолдан жазылмайды -
   әрқашан осы трассадан алынады. */
(() => {
  "use strict";
  const root = document.querySelector("[data-cslab=python]");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const T = window.AO17Tutor;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ROOT = (() => { const sc = document.querySelector('script[src*="assets/js/cslab-python.js"]'); return sc ? sc.src.replace(/assets\/js\/cslab-python\.js.*$/, "") : new URL("../../", location.href).href; })();
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const norm = (s) => String(s).trim().replace(/^["'«“]+|["'»”]+$/g, "").replace(/\s+/g, "");
  const strip = (r) => (r == null ? r : norm(r));

  // ---------------------------------------------------------------- Pyodide
  let pyP = null;
  const py = () => pyP || (pyP = (async () => {
    for (let i = 0; i < 50 && !(window.CS50KZ && window.CS50KZ.getPyodide); i++) await new Promise((r) => setTimeout(r, 100));
    if (!window.CS50KZ || !window.CS50KZ.getPyodide) throw new Error("Python ортасы бұл бетте табылмады");
    const p = await window.CS50KZ.getPyodide();
    if (!p.globals.get("cslab_trace")) {
      const res = await fetch(ROOT + "assets/py/cslab_trace.py");
      if (!res.ok) throw new Error("cslab_trace.py жүктелмеді");
      p.runPython(await res.text());
    }
    return p;
  })().catch((e) => { pyP = null; throw e; }));

  // ---------------------------------------------------------------- іздеу көмекшілері (трасса бойынша)
  const modVar = (st, name) => { const v = st && st.stack[0].vars.find((x) => x[0] === name); return v ? v[1] : null; };
  const nthHit = (R, line, n) => { let c = 0; for (let i = 0; i < R.steps.length; i++) { const s = R.steps[i]; if (s.ev === "line" && s.line === line && s.stack.length === 1 && ++c === n) return i; } return -1; };

  // ---------------------------------------------------------------- дайын мысалдар
  const PRESETS = {
    loop: {
      name: "Цикл: қосынды жинау", skill: "cs.python.trace", title: "Python: цикл трассасы",
      make() {
        const N = rnd(4, 6), K = rnd(1, 3), m = rnd(2, N - 1);
        return { N, K, m, code: `total = 0\nfor i in range(1, ${N + 1}):\n    total = total + ${K === 1 ? "i" : "i * " + K}\nprint(total)\n`,
          q: `i = ${m} болғанда 3-жол орындалып болған соң total неге тең?` };
      },
      answer(R, P) { const j = nthHit(R, 3, P.m); return j < 0 ? null : { want: modVar(R.steps[j + 1], "total"), at: j + 1 }; },
      wrong(a, want, P) {
        const S = (m) => (P.K * m * (m + 1)) / 2, n = Number(a);
        if (n === S(P.m - 1)) return ["Бұл жол орындалғанға ДЕЙІНГІ мән", `${S(P.m - 1)} - i = ${P.m} үшін 3-жол әлі орындалмаған сәт. Маркер ▶ келесі орындалатын жолды көрсетеді; жол орындалған соң total-ға ${P.m}${P.K > 1 ? " · " + P.K : ""} қосылады.`, "before-after"];
        if (n === S(P.m + 1)) return ["Бір айналым артық есептелді", `${S(P.m + 1)} - i = ${P.m + 1} айналымынан кейінгі мән. range(1, ${P.N + 1}) 1-ден басталады: i = ${P.m} - ${P.m}-айналым.`, "off-by-one"];
        if (n === S(P.N)) return ["Бұл цикл аяқталғандағы мән", `${S(P.N)} - барлық айналымнан кейін print шығаратын сан. Сұрақ i = ${P.m} айналымы туралы.`, "final"];
        if (n === P.m * P.K) return ["total қайта жазылмайды, жинақталады", `total = total + ... - жаңа мән = ЕСКІ total + i${P.K > 1 ? " · " + P.K : ""}. Сондықтан алдыңғы айналымдардың үлесі сақталады.`, "overwrite"];
        return null;
      },
      hints(P, want) {
        let t = 0; const rows = []; for (let i = 1; i <= P.m; i++) { t += i * P.K; rows.push(`i = ${i}: total = ${t - i * P.K} + ${i}${P.K > 1 ? " · " + P.K : ""} = ${t}`); }
        return ["Әр айналымда total-ға i" + (P.K > 1 ? ` · ${P.K}` : "") + " қосылады. Қағазға кесте жазыңыз: i | 3-жолдан кейінгі total.",
          "Мысал: total = 0; for i in range(1, 4): total = total + i. Сонда i = 1 → 1, i = 2 → 3, i = 3 → 6.",
          rows.join("; ") + `. Жауап: ${strip(want)}.`];
      },
    },
    alias: {
      name: "Тізім: сілтеме (aliasing) және көшірме", skill: "cs.python.alias", title: "Python: тізімге сілтеме",
      make() {
        const v = []; while (v.length < 5) { const x = rnd(1, 9); if (!v.includes(x)) v.push(x); }
        const [x, y, z, p, q] = v;
        return { x, y, z, p, q, code: `a = [${x}, ${y}, ${z}]\nb = a\nc = a[:]\nb.append(${p})\nc.append(${q})\nprint(a)\nprint(c)\n`, q: "Бірінші print(a) не шығарады? (мысалы: [1, 2, 3])" };
      },
      answer(R) { return { want: R.ok ? R.out.split("\n")[0] : null, at: R.steps.length - 1 }; },
      wrong(a, want, P) {
        const L = (...v) => "[" + v.join(",") + "]";
        if (a === L(P.x, P.y, P.z)) return ["b = a көшірме жасамайды", `b = a - жаңа тізім емес, сол тізімге екінші атау: a мен b бір нысанға (#1) сілтейді. Сондықтан b.append(${P.p}) a-ны да өзгертеді. Айнымалылар панеліндегі #белгісін салыстырыңыз.`, "alias"];
        if (a === L(P.x, P.y, P.z, P.p, P.q)) return ["a[:] - жаңа тізім (көшірме)", `c = a[:] кесіндісі ЖАҢА тізім жасайды (#2). c.append(${P.q}) тек c-ны өзгертеді, a-ға әсер етпейді.`, "copy"];
        if (a === L(P.x, P.y, P.z, P.q)) return ["Атаулар шатасты", `${P.q} c-ға қосылды, ал c - көшірме. a-ға b арқылы ${P.p} қосылды (b мен a - бір тізім).`, "swap"];
        return null;
      },
      hints(P, want) {
        return ["Қай атау қай нысанға сілтейтінін бақылаңыз: «b = a» жаңа тізім жасамайды, «a[:]» жасайды. Панельде бір нысан бір #белгімен көрсетіледі.",
          "Мысал: x = [0]; y = x; y.append(1) → x да [0, 1]. Ал z = x[:]; z.append(2) → x өзгермейді, z = [0, 1, 2].",
          `1) a = [${P.x}, ${P.y}, ${P.z}] (#1). 2) b = a → b да #1. 3) c = a[:] → жаңа тізім #2. 4) b.append(${P.p}) → #1 = [${P.x}, ${P.y}, ${P.z}, ${P.p}], яғни a да. 5) c.append(${P.q}) → тек #2. Жауап: ${want}.`];
      },
    },
    fact: {
      name: "Функция және рекурсия: факториал", skill: "cs.python.recursion", title: "Python: рекурсия және шақыру стегі",
      make() { const N = rnd(3, 6); return { N, code: `def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nresult = fact(${N})\nprint(result)\n`, q: "Ең терең сәтте шақыру стегінде fact функциясының неше жақтауы (frame) бір мезгілде тұрады?" }; },
      answer(R) {
        let best = 0, at = 0;
        R.steps.forEach((s, i) => { const c = s.stack.filter((f) => f.fn === "fact").length; if (c > best) { best = c; at = i; } });
        return { want: best ? String(best) : null, at };
      },
      wrong(a, want, P) {
        const n = Number(a);
        if (n === P.N - 1) return ["fact(1) де жеке шақыру", `Базалық жағдай fact(1) де өз жақтауында орындалады: fact(${P.N}) → ... → fact(2) → fact(1). Барлығы ${P.N} жақтау.`, "base-frame"];
        if (n === P.N + 1) return ["Глобалдық жақтау fact емес", `Стекте fact(${P.N}) ... fact(1) - ${P.N} жақтау, оның астында глобалдық (модуль) жақтау. Сұрақ тек fact жақтаулары туралы.`, "module-frame"];
        if (n === 1) return ["Әр шақыру жаңа жақтау ашады", `fact(n - 1) шақырылғанда алдыңғы жақтау жабылмайды: ол n * fact(n - 1) нәтижесін КҮТІП тұрады. Сондықтан ең терең сәтте ${P.N} жақтау қатар тұрады.`, "one-frame"];
        return null;
      },
      hints(P, want) {
        return ["Әр fact(...) шақыруы жаңа жақтау ашады, ол өз return-ы орындалғанша стекте қалады.",
          "Мысал: fact(2) → 4-жолда fact(1) шақырады. fact(1) орындалып жатқанда стекте fact(2) және fact(1) - 2 жақтау (плюс глобалдық).",
          `fact(${P.N}) → fact(${P.N - 1}) → ... → fact(1): fact(1) 3-жолда 1 қайтарғанға дейін бәрі стекте. Жақтаулар: ${Array.from({ length: P.N }, (_, i) => `fact(${P.N - i})`).join(", ")}. Жауап: ${want}.`];
      },
    },
    str: {
      name: "Жол құру: сөзді кері айналдыру", skill: "cs.python.trace", title: "Python: цикл трассасы",
      make() {
        const word = pick(["кітап", "өрнек", "жұлдыз", "тұлпар", "домбыра", "ақын"]), m = rnd(2, [...word].length - 1);
        return { word, m, code: `word = "${word}"\nrev = ""\nfor ch in word:\n    rev = ch + rev\nprint(rev)\n`, q: `${m}-айналымнан кейін (4-жол ${m}-рет орындалған соң) rev неге тең?` };
      },
      answer(R, P) { const j = nthHit(R, 4, P.m); return j < 0 ? null : { want: modVar(R.steps[j + 1], "rev"), at: j + 1 }; },
      wrong(a, want, P) {
        const w = [...P.word];
        if (a === w.slice(0, P.m).join("")) return ["Әріп соңына емес, АЛДЫНА қосылады", `rev = ch + rev: жаңа әріп ch ағымдағы rev-тің алдына қойылады, сондықтан сөз кері жиналады. Сіз rev + ch (соңына қосу) деп есептедіңіз.`, "concat-order"];
        if (a === w.slice().reverse().join("")) return ["Бұл цикл аяқталғандағы мән", `Толық кері сөз - барлық айналымнан кейін. ${P.m}-айналымнан кейін тек алғашқы ${P.m} әріп өңделген.`, "final"];
        if (a === w.slice(0, P.m - 1).reverse().join("")) return ["Бір айналым кем", `Бұл ${P.m - 1}-айналымнан кейінгі мән. ${P.m}-айналымда «${w[P.m - 1]}» әрпі алдына қосылады.`, "off-by-one"];
        return null;
      },
      hints(P, want) {
        const w = [...P.word]; let r = ""; const rows = [];
        for (let i = 0; i < P.m; i++) { rows.push(`${i + 1}) ch = '${w[i]}': rev = '${w[i]}' + '${r}' = '${w[i] + r}'`); r = w[i] + r; }
        return ["ch + rev - жаңа әріп ағымдағы rev-тің АЛДЫНА қойылады. Әр айналымды жеке жазыңыз.",
          "Мысал: word = 'абв'. 1) rev = 'а'; 2) 'б' + 'а' = 'ба'; 3) 'в' + 'ба' = 'вба'.",
          rows.join("; ") + `. Жауап: ${strip(want)}.`];
      },
    },
  };

  // ---------------------------------------------------------------- күй
  const ta = $("[data-k=code]"), gut = $(".py-gut"), list = $(".py-code"), ed = $(".py-ed");
  const say = $(".cs-say"), errBox = $(".py-err"), status = $(".py-status"), outEl = $(".py-out"), framesEl = $(".py-frames");
  const qBox = document.querySelector("[data-cslab=python-q]");
  let presetId = "loop", P = null, R = null, view = [], k = 0, traced = false, busy = false, helped = false, HN = null;

  function gutter(errLine) {
    const n = Math.max(1, ta.value.split("\n").length);
    gut.innerHTML = Array.from({ length: n }, (_, i) => `<span${i + 1 === errLine ? ' class="err"' : ""}>${i + 1}</span>`).join("");
    gut.scrollTop = ta.scrollTop;
  }
  function setMode(m) {
    traced = m === "trace";
    ed.hidden = traced; list.hidden = !traced;
    $("[data-c=edit]").hidden = !traced;
    $("[data-c=back]").disabled = !traced || k === 0;
    $("[data-c=reset]").disabled = !traced;
  }
  function invalidate() { R = null; view = []; k = 0; setMode("edit"); errBox.hidden = true; framesEl.innerHTML = '<p class="cs-small">Айнымалылар код орындалғанда көрінеді: «Қадам →» не «Соңына дейін» басыңыз.</p>'; outEl.textContent = ""; say.textContent = "Кодты оқып шығыңыз, сұраққа болжам жазыңыз, сосын қадамдап тексеріңіз."; $(".cs-n").textContent = ""; $("[data-c=step]").disabled = false; $("[data-c=end]").disabled = false; gutter(); }

  function loadPreset(id) {
    presetId = id; P = PRESETS[id].make(); ta.value = P.code; helped = false; invalidate(); paintQ();
  }
  const isCustom = () => presetId === "custom" || !P || ta.value !== P.code;

  async function ensureTrace() {
    if (R) return true;
    if (busy) return false;
    busy = true; status.className = "py-status"; status.textContent = pyP ? "Орындалып жатыр..." : "Python (Pyodide) жүктелуде - бірінші рет ~10 секунд...";
    let p;
    try { p = await py(); } catch (e) {
      busy = false; status.className = "py-status bad";
      status.textContent = "Python (Pyodide) жүктелмеді. Бұл визуализатор кодты нағыз Python-да орындайды, сондықтан алғашқы жүктеуге интернет керек (кейін браузер кэшінде қалуы мүмкін). Әзірге кодты қағазда трассалап көріңіз, байланыс болғанда қайта басыңыз.";
      return false;
    }
    let res;
    try { res = JSON.parse(p.globals.get("cslab_trace")(ta.value)); } catch (e) { busy = false; status.className = "py-status bad"; status.textContent = "Трассалау сәтсіз: " + (e.message || e); return false; }
    busy = false; status.textContent = "Python дайын. Код браузерде орындалды; төменде әр қадам.";
    R = res; view = R.steps.slice();
    const last = view[view.length - 1];
    if (!R.ok && R.error && R.line && view.length) view.push({ ev: "error", line: R.line, stack: R.errStack || last.stack, out: R.out });
    errBox.hidden = true;
    if (!R.ok) showError();
    else if (R.truncated) { errBox.hidden = false; errBox.innerHTML = `<b>Қадам шегі: ${R.limit}</b><p>Бағдарлама ${R.limit} жолдан көп орындалды, сондықтан тоқтаттық. Шексіз цикл болуы мүмкін: циклдың шарты қашан жалған болатынын, айнымалы өзгеретінін тексеріңіз. Алғашқы ${R.limit} қадамды төменде көре аласыз.</p>`; }
    if (!view.length) { gutter(R.line); return false; }
    renderList(); setMode("trace"); return true;
  }
  function showError() {
    errBox.hidden = false;
    errBox.innerHTML = `<b>${esc(R.error)}${R.line ? `, ${R.line}-жол` : ""}</b><p>${esc(R.hint || "")}</p>${R.detail ? `<p class="cs-small">Python хабары: <code>${esc(R.detail)}</code></p>` : ""}`;
    if (!view.length) { say.textContent = "Код орындалмады: Python оны оқи алмады. Қатені түзетіп, қайта басыңыз."; gutter(R.line); }
  }
  function renderList() {
    list.innerHTML = ta.value.replace(/\n$/, "").split("\n").map((l) => `<li><span class="mk" aria-hidden="true"></span><code>${esc(l) || " "}</code></li>`).join("");
  }

  function changedNames(i) {
    const cur = view[i], prev = view[i - 1], set = new Set();
    if (!prev) return set;
    cur.stack.forEach((f, d) => {
      const pf = prev.stack[d];
      if (!pf || pf.fn !== f.fn) return;
      f.vars.forEach(([n, v, r]) => { const o = pf.vars.find((x) => x[0] === n); if (!o || o[1] !== v || o[2] !== r) set.add(d + ":" + n); });
    });
    return set;
  }
  function show() {
    if (!view.length) return;
    const s = view[k], prev = view[k - 1];
    [...list.children].forEach((li, i) => {
      const ln = i + 1, mk = li.querySelector(".mk");
      li.className = ""; mk.textContent = "";
      if (prev && prev.ev === "line" && prev.line === ln && s.ev !== "error") { li.className = "prev"; mk.textContent = "✓"; }
      if (s.line === ln) { li.className = s.ev === "error" ? "err" : "next"; mk.textContent = s.ev === "error" ? "✗" : s.ev === "return" ? "↩" : "▶"; }
    });
    const ch = changedNames(k);
    framesEl.innerHTML = s.stack.map((f, d) => ({ f, d })).reverse().map(({ f, d }) => {
      const rows = f.vars.map(([n, v, r]) => `<tr class="${ch.has(d + ":" + n) ? "ch" : ""}"><th scope="row">${esc(n)}</th><td>${esc(v)}${r ? `<span class="py-ref" title="нысан белгісі">${esc(r)}</span>` : ""}</td></tr>`).join("") || '<tr><td colspan="2" class="cs-small">айнымалы жоқ</td></tr>';
      const name = f.fn === "<module>" ? "Глобалдық жақтау" : `${esc(f.fn)}()`;
      return `<div class="py-frame${d === s.stack.length - 1 ? " cur" : ""}"><h4>${name}<small>${d === s.stack.length - 1 ? "ағымдағы" : "күтіп тұр"}${f.fn !== "<module>" ? ` · деңгей ${d}` : ""}</small></h4><table class="py-vars"><tbody>${rows}</tbody></table></div>`;
    }).join("");
    outEl.textContent = s.out || "";
    const top = s.stack[s.stack.length - 1], inFn = top && top.fn !== "<module>" ? ` (${top.fn}() ішінде, стекте ${s.stack.length - 1} функция жақтауы)` : "";
    const chList = [...ch].map((x) => x.split(":")[1]);
    let msg = s.ev === "line" ? `${s.line}-жол орындалғалы тұр${inFn}.` : s.ev === "return" ? `${top.fn}() ${s.ret} қайтарады${inFn}; оның жақтауы стектен алынады.` : s.ev === "end" ? "Бағдарлама аяқталды: соңғы жолдан кейінгі күй." : `${s.line}-жолда ${R.error} қатесі шықты - орындау осында тоқтады.`;
    if (prev && prev.ev === "line" && s.ev !== "error") msg += ` Жаңа ғана ${prev.line}-жол орындалды.`;
    if (chList.length && s.ev !== "error") msg += ` Өзгерді: ${chList.join(", ")}.`;
    say.innerHTML = `<b>${k + 1}-қадам.</b> ${esc(msg)}`;
    $(".cs-n").textContent = `${k + 1} / ${view.length}`;
    $("[data-c=back]").disabled = k === 0;
    $("[data-c=step]").disabled = k >= view.length - 1;
    $("[data-c=end]").disabled = k >= view.length - 1;
  }
  async function go(fn) { if (!(await ensureTrace())) return; k = Math.max(0, Math.min(view.length - 1, fn(k))); show(); }

  $("[data-c=step]").addEventListener("click", () => { const first = !R; go((x) => (first ? 0 : x + 1)); });
  $("[data-c=back]").addEventListener("click", () => go((x) => x - 1));
  $("[data-c=end]").addEventListener("click", () => go(() => Infinity));
  $("[data-c=reset]").addEventListener("click", () => go(() => 0));
  $("[data-c=edit]").addEventListener("click", () => { invalidate(); ta.focus(); });
  ta.addEventListener("input", () => { if (R) invalidate(); gutter(); paintQ(); });
  ta.addEventListener("scroll", () => { gut.scrollTop = ta.scrollTop; });
  const sel = $("[data-k=preset]");
  sel.innerHTML = Object.entries(PRESETS).map(([id, p]) => `<option value="${id}">${p.name}</option>`).join("") + '<option value="custom">Өз кодым</option>';
  sel.addEventListener("change", () => { if (sel.value === "custom") { presetId = "custom"; ta.value = "# Өз Python кодыңызды жазыңыз\nx = 3\nprint(x * 2)\n"; invalidate(); paintQ(); } else loadPreset(sel.value); });
  $("[data-c=variant]").addEventListener("click", () => { if (presetId !== "custom") loadPreset(presetId); });

  // ---------------------------------------------------------------- болжау сұрағы
  const qq = (s) => qBox.querySelector(s);
  function paintQ() {
    const fb = qq("[data-fb=q]"); fb.className = ""; fb.textContent = "";
    const custom = isCustom();
    qq("[data-k=q]").textContent = custom ? "Бұл сұрақ дайын мысалға арналған. Код өзгерді не «Өз кодым» таңдалды - мысалды қайта таңдаңыз не «Жаңа сандар» басыңыз." : P.q;
    qq("[data-k=ans]").value = ""; qq("[data-k=ans]").disabled = custom; qq("[data-c=check]").disabled = custom;
    HN = T.hints(qq("[data-k=hints]"), custom ? ["Дайын мысалды таңдаңыз."] : ["...", "...", "..."], {
      onSolution: () => { helped = true; T.feedback(fb, "info", "Шешімді көрдіңіз", "Бұл сұрақ меңгеруге саналмайды. «Жаңа сандар» басып, жаңа нұсқаны көмексіз шешіңіз."); },
    });
    hintsReady = false;
  }
  let hintsReady = false;
  // көмек мәтіні трассадан шығады: бірінші басқанда трассаны есептеп аламыз
  qBox.addEventListener("click", async (e) => {
    if (hintsReady || isCustom() || !e.target.closest(".tt-hbtn")) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (!(await ensureTrace())) return;
    const a = PRESETS[presetId].answer(R, P);
    HN.reset(PRESETS[presetId].hints(P, a && a.want));
    hintsReady = true;
    qq(".tt-hbtn").click();
  }, true);

  async function check() {
    if (isCustom()) return;
    const fb = qq("[data-fb=q]"), raw = qq("[data-k=ans]").value;
    if (!raw.trim()) { T.feedback(fb, "info", "Жауап бос", "Алдымен болжамыңызды жазыңыз."); return; }
    if (!(await ensureTrace())) { T.feedback(fb, "info", "Тексеру мүмкін емес", "Жауап Python трассасымен тексеріледі, ал Python жүктелмеді."); return; }
    const pr = PRESETS[presetId], a = pr.answer(R, P);
    if (!a || a.want == null) { T.feedback(fb, "info", "Трассадан жауап табылмады", "Код өзгерген болуы мүмкін - мысалды қайта таңдаңыз."); return; }
    const mine = norm(raw), want = norm(a.want), ok = mine === want;
    const hints = helped ? 3 : HN.used();
    let ttl, why, code = "";
    if (ok) { ttl = "Дұрыс" + (hints ? ` (${hints} көмекпен)` : ""); why = `Трасса растайды: ${strip(a.want)}. Төменде сол қадам көрсетілді.`; }
    else {
      const w = pr.wrong(mine, want, P);
      if (w) { [ttl, why, code] = w; } else { ttl = "Трассамен сәйкес емес"; why = "Қадамдарды бір-бірлеп жүргізіп, айнымалылар панелінде мәннің қалай өзгергенін бақылаңыз."; code = "other"; }
      ttl += `. Дұрысы: ${strip(a.want)}`;
    }
    T.feedback(fb, ok ? "ok" : "bad", ttl, why);
    T.record(pr.skill, { item: presetId, ok, hints, error: code, note: why, title: pr.title });
    k = Math.min(a.at, view.length - 1); show();
  }
  qq("[data-c=check]").addEventListener("click", check);
  qq("[data-k=ans]").addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });

  loadPreset("loop");
  document.querySelectorAll("[data-badge]").forEach((el) => T.badge(el, el.dataset.badge, el.dataset.title));
})();
