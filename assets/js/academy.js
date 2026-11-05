/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: сабақ беті, логика зертханалары, тапсырма тексеру, меңгеру, қайталау, білім картасы.
// Барлық тексеру браузерде, AOLogic қозғалтқышымен (assets/js/academy-logic.js). Сыртқы AI/API жоқ.
// Прогресс: localStorage «cs50kz:academy» (нұсқасы v). Кірген оқушыда ao.js оны серверге өзі синхрондайды.
(function () {
  "use strict";
  const L = window.AOLogic;
  const AR = window.AOArith;
  const DS = window.AODisc;
  const PS = window.AOPseudo;
  const BI = window.AOBits;
  // ---------------- AO17 Judge: Pyodide + assets/py/ao_judge.py (build кезінде де дәл осы файл тексеріледі)
  const SCRIPT_ROOT = (() => { const sc = document.querySelector('script[src*="assets/js/academy.js"]'); return sc ? sc.src.replace(/assets\/js\/academy\.js.*$/, "") : new URL(".", location.href).href; })();
  let judgeP = null;
  function judgeReady() {
    if (!judgeP) {
      judgeP = (async () => {
        if (!window.CS50KZ || !window.CS50KZ.getPyodide) throw new Error("Python ортасы табылмады");
        const py = await window.CS50KZ.getPyodide();
        const res = await fetch(SCRIPT_ROOT + "assets/py/ao_judge.py");
        if (!res.ok) throw new Error("ao_judge.py жүктелмеді");
        py.runPython(await res.text());
        return py;
      })().catch((e) => { judgeP = null; throw e; });
    }
    return judgeP;
  }
  async function pyJudge(code, spec) { const py = await judgeReady(); return JSON.parse(py.globals.get("judge_json")(code, JSON.stringify(spec))); }
  async function pyJudgeTests(code, spec) { const py = await judgeReady(); return JSON.parse(py.globals.get("judge_tests_json")(code, JSON.stringify(spec))); }
  async function pyTrace(code, call) { const py = await judgeReady(); return JSON.parse(py.globals.get("trace_calls")(code, call)); }
  async function pySort(code, func, data) { const py = await judgeReady(); return JSON.parse(py.globals.get("trace_sort")(code, func, JSON.stringify(data))); }
  async function pyRun(code, stdin) { const py = await judgeReady(); return JSON.parse(py.globals.get("run_json")(code, stdin || "")); }
  const PY_FAIL = "Python жүктелмеді (интернет қажет, бірінші рет ~10 секунд). Байланысты тексеріп, қайта басыңыз.";
  function codeArea(value, rows) {
    const ta = document.createElement("textarea");
    ta.className = "ac-pyed"; ta.spellcheck = false; ta.setAttribute("autocapitalize", "off"); ta.setAttribute("aria-label", "Код өрісі (Tab - шегініс)"); ta.rows = rows || Math.min(18, Math.max(4, String(value).split("\n").length + 1));
    ta.value = value;
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); const a = ta.selectionStart; ta.setRangeText("    ", a, ta.selectionEnd, "end"); }
      else if (e.key === "Enter") {
        const a = ta.selectionStart, line = ta.value.slice(0, a).split("\n").pop();
        let ind = (/^\s*/.exec(line) || [""])[0];
        if (/:\s*$/.test(line)) ind += "    ";
        if (ind) { e.preventDefault(); ta.setRangeText("\n" + ind, a, ta.selectionEnd, "end"); }
      }
    });
    return ta;
  }
  const pyVal = (v) => (v === null ? "None" : v === true ? "True" : v === false ? "False" : typeof v === "string" ? JSON.stringify(v).replace(/^"|"$/g, "'") : Array.isArray(v) ? "[" + v.map(pyVal).join(", ") + "]" : String(v));
  function bitsKey(ex) {
    if (ex.type === "convert") return BI.convert(ex.value, ex.from, ex.to);
    if (ex.type === "bitop") return String(BI.bitExpr(ex.expr, ex.width));
    if (ex.kind === "twos") return BI.twos(ex.input, ex.bits);
    if (ex.kind === "utf8") return BI.utf8Hex(ex.input);
    if (ex.kind === "parity") return BI.parity(ex.input);
    if (ex.kind === "float32") return BI.float32(ex.input).bits;
    if (ex.kind === "rle") return BI.rle(ex.input);
    throw new Error("белгісіз түр");
  }
  const fmtVal = (v) => (v === true ? "true" : v === false ? "false" : Array.isArray(v) ? "[" + v.map(fmtVal).join(", ") + "]" : String(v));
  function traceKey(ex) {
    const r = PS.run(ex.code, ex.inputs || {});
    if (ex.ask === "result") return fmtVal(r.result);
    if (ex.ask === "output") return r.output.join("\n");
    return fmtVal(r.env[ex.ask]);
  }
  const GROWTH = { "1": () => 1, "log2(n)": (n) => Math.log2(n), "sqrt(n)": (n) => Math.sqrt(n), n: (n) => n, "n*log2(n)": (n) => n * Math.log2(n), "n^2": (n) => n * n, "n^3": (n) => n ** 3, "2^n": (n) => 2 ** n, "100*n": (n) => 100 * n, "n!": (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; } };
  const PROPN = { reflexive: "рефлексивті", symmetric: "симметриялы", antisymmetric: "антисимметриялы", transitive: "транзитивті" };
  const FUNCN = { bijective: "биекция", injective: "инъекция (бірақ сюръекция емес)", surjective: "сюръекция (бірақ инъекция емес)", neither: "функция, бірақ инъекция да, сюръекция да емес", notfunction: "функция емес" };
  const elText = (arr) => arr.join(", ");
  if (!L) return;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const b01 = (v) => (v ? "1" : "0");
  const KIND = { tautology: "тавтология", contradiction: "қайшылық", contingent: "бейтарап (орындалымды)" };
  const OPNAME = { not: "¬ (емес)", and: "∧ (және)", or: "∨ (немесе)", xor: "⊕ (не...не)", imp: "→ (импликация)", iff: "↔ (эквиваленттік)" };
  const MAX_ROWS = 64;

  // ================================================================ прогресс
  const KEY = "cs50kz:academy";
  const VERSION = 1;
  const DAY = 86400000;
  const INTERVALS = [2, 7, 21, 60];   // қайталау аралықтары (күн)
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; }
    if (!d || typeof d !== "object" || d.v !== VERSION) d = { v: VERSION, lessons: {} };
    d.lessons = d.lessons || {};
    return d;
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("cs50kz:week"));   // ao.js: серверге синхрондау (кірген болса)
  }
  const lessonRec = (d, id) => (d.lessons[id] = d.lessons[id] || { ex: {}, reflect: {}, seen: Date.now() });

  // ================================================================ формула енгізу
  const KEYS = ["¬", "∧", "∨", "→", "↔", "⊕", "(", ")"];
  function formulaInput(value, label, onInput) {
    const w = document.createElement("div");
    w.className = "ac-fin";
    w.innerHTML = `<label><span>${esc(label)}</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" value="${esc(value)}"></label>
      <div class="ac-keys" role="group" aria-label="Логикалық белгілер">${KEYS.map((k) => `<button type="button" data-k="${k}" aria-label="${k} енгізу">${k}</button>`).join("")}</div>
      <p class="ac-err" role="alert"></p>`;
    const inp = $("input", w);
    $$("[data-k]", w).forEach((b) => b.addEventListener("click", () => {
      const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? inp.value.length;
      const k = b.dataset.k, pad = /[∧∨→↔⊕]/.test(k) ? " " + k + " " : k;
      inp.value = inp.value.slice(0, s) + pad + inp.value.slice(e);
      inp.focus();
      inp.setSelectionRange(s + pad.length, s + pad.length);
      inp.dispatchEvent(new Event("input"));
    }));
    if (onInput) inp.addEventListener("input", () => onInput(inp.value));
    w.input = inp;
    w.error = (m) => { $(".ac-err", w).textContent = m || ""; };
    return w;
  }

  function exprInput(value, label, onInput) {
    const w = document.createElement("div");
    w.className = "ac-fin";
    w.innerHTML = `<label><span>${esc(label)}</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" inputmode="text" value="${esc(value)}"></label><p class="ac-err" role="alert"></p>`;
    const inp = $("input", w);
    if (onInput) inp.addEventListener("input", () => onInput(inp.value));
    w.input = inp;
    w.error = (m) => { $(".ac-err", w).textContent = m || ""; };
    return w;
  }
  // Детерминистік араластыру: қадамдар ешқашан дұрыс ретпен көрсетілмейді
  function shuffled(arr, seed) {
    const idx = arr.map((_, i) => i);
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    for (let i = idx.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    if (idx.every((v, i) => v === i)) idx.push(idx.shift());
    return idx;
  }

  // ================================================================ көрсету құралдары
  function tableHtml(src, opts) {
    const tt = L.truthTable(src);
    const cols = opts && opts.final ? [] : tt.columns.slice(0, -1);
    const shown = tt.rows.slice(0, MAX_ROWS);
    const head = tt.vars.map((v) => `<th scope="col">${esc(v)}</th>`).join("") + cols.map((c) => `<th scope="col" class="sub">${esc(c)}</th>`).join("") + `<th scope="col" class="res">${esc(L.toStr(tt.tree))}</th>`;
    const body = shown.map((r) => `<tr>${tt.vars.map((v) => `<td>${b01(r.env[v])}</td>`).join("")}${r.cols.slice(0, cols.length).map((x) => `<td class="sub">${b01(x)}</td>`).join("")}<td class="res v${b01(r.value)}">${b01(r.value)}</td></tr>`).join("");
    const more = tt.rows.length > MAX_ROWS ? `<p class="ac-note">Кестеде ${tt.rows.length} жол; алғашқы ${MAX_ROWS} жол көрсетілді.</p>` : "";
    const cl = L.classify(tt.tree);
    return `<div class="ac-tt-wrap"><table class="ac-tt"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${more}
      <p class="ac-verdict k-${cl.kind}">Түрі: <b>${KIND[cl.kind]}</b> · ақиқат жолдар: ${cl.trueRows} / ${cl.rows}</p>`;
  }
  function treeHtml(t) {
    if (t.op === "var") return `<li><span class="nd var">${esc(t.name)}</span></li>`;
    if (t.op === "const") return `<li><span class="nd var">${t.v ? 1 : 0}</span></li>`;
    const kids = t.op === "not" ? [t.a] : [t.a, t.b];
    return `<li><span class="nd op" title="${esc(OPNAME[t.op])}">${esc(L.OPS[t.op])}</span><ul>${kids.map(treeHtml).join("")}</ul></li>`;
  }
  const envText = (env, vars) => vars.map((v) => `${v} = ${env[v] ? 1 : 0}`).join(", ");

  // ================================================================ зертханалар
  const QUANT = {
    even: ["жұп сан", (x) => x % 2 === 0], odd: ["тақ сан", (x) => Math.abs(x % 2) === 1],
    prime: ["жай сан", (x) => { if (x < 2) return false; for (let i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; }],
    positive: ["оң сан", (x) => x > 0], gt3: ["x > 3", (x) => x > 3], square: ["толық квадрат", (x) => x >= 0 && Math.round(Math.sqrt(x)) ** 2 === x],
  };
  function lab(el, spec) {
    el.innerHTML = "";
    el.classList.add("ac-lab-" + spec.lab);
    const out = document.createElement("div");
    out.className = "ac-lab-out";
    out.setAttribute("aria-live", "polite");
    const guard = (fn, inp) => { try { inp && inp.error(""); fn(); } catch (e) { if (inp) inp.error(e.message); else out.innerHTML = `<p class="ac-err">${esc(e.message)}</p>`; } };
    if (spec.lab === "truthtable" || spec.lab === "tree" || spec.lab === "normal") {
      const fi = formulaInput(spec.formula, "Формула", () => draw());
      const draw = () => guard(() => {
        const t = L.parse(fi.input.value);
        if (spec.lab === "truthtable") out.innerHTML = tableHtml(t);
        else if (spec.lab === "tree") out.innerHTML = `<p>Бас амал: <b>${esc(t.op === "var" || t.op === "const" ? "жоқ (атомар формула)" : OPNAME[t.op])}</b> · жақшамен толық жазылуы: <code>${esc(L.toStr(t))}</code></p><ul class="ac-tree">${treeHtml(t)}</ul>`;
        else { const nf = L.normalForms(t); out.innerHTML = `<p><b>Канондық ДҚФ</b> (${nf.minterms} минтерм):</p><p class="ac-formula">${esc(nf.dnf)}</p><p><b>Канондық КҚФ</b> (${nf.maxterms} дизъюнкт):</p><p class="ac-formula">${esc(nf.cnf)}</p>` + tableHtml(t, { final: true }); }
      }, fi);
      el.append(fi, out); draw();
    } else if (spec.lab === "equiv") {
      const fa = formulaInput(spec.a, "A", () => draw()), fb = formulaInput(spec.b, "B", () => draw());
      const draw = () => guard(() => {
        let ta, tb;
        try { ta = L.parse(fa.input.value); fa.error(""); } catch (e) { fa.error(e.message); throw e; }
        try { tb = L.parse(fb.input.value); fb.error(""); } catch (e) { fb.error(e.message); throw e; }
        const r = L.equivalent(ta, tb);
        out.innerHTML = r.equivalent
          ? `<p class="ac-verdict k-tautology">A ≡ B: барлық ${1 << r.vars.length} бағалауда мәндері бірдей.</p>` + tableHtml(`(${L.toStr(ta)}) ↔ (${L.toStr(tb)})`)
          : `<p class="ac-verdict k-contradiction">A ≢ B. Қарсы мысал: ${esc(envText(r.counterexample, r.vars))} → A = ${b01(r.left)}, B = ${b01(r.right)}.</p>` + tableHtml(`(${L.toStr(ta)}) ↔ (${L.toStr(tb)})`);
      });
      el.append(fa, fb, out); draw();
    } else if (spec.lab === "argument") {
      const ps = document.createElement("div");
      const inputs = [];
      const add = (v) => { const f = formulaInput(v, `Алғышарт ${inputs.length + 1}`, () => draw()); inputs.push(f); ps.append(f); };
      (spec.premises || ["p → q", "p"]).forEach(add);
      const fc = formulaInput(spec.conclusion || "q", "Қорытынды ∴", () => draw());
      const plus = document.createElement("button");
      plus.type = "button"; plus.className = "btn secondary ac-small"; plus.textContent = "+ алғышарт";
      plus.addEventListener("click", () => { if (inputs.length < 5) { add(""); } });
      const draw = () => guard(() => {
        const prem = inputs.map((f) => f.input.value.trim()).filter(Boolean);
        const r = L.validArgument(prem, fc.input.value);
        out.innerHTML = r.valid
          ? `<p class="ac-verdict k-tautology">Аргумент ДҰРЫС: алғышарттардың бәрі ақиқат, ал қорытынды жалған болатын бағалау жоқ.</p>`
          : `<p class="ac-verdict k-contradiction">Аргумент ДҰРЫС ЕМЕС. Қарсы мысал: ${esc(envText(r.counterexample, r.vars))} - алғышарттар ақиқат, қорытынды жалған.</p>`;
      });
      el.append(ps, plus, fc, out); draw();
    } else if (spec.lab === "search") {
      const fe = exprInput(spec.expr, "Өрнек f(n)", () => draw());
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Қасиет: f(n) ...</span><select>${Object.entries(AR.PROPS).filter(([k]) => k !== "any").map(([k, v]) => `<option value="${k}"${k === spec.prop ? " selected" : ""}>${esc(v[0])}</option>`).join("")}</select></label>
        <label><span>n облысы</span><input type="text" value="${spec.domain[0]}..${spec.domain[1]}"></label>`;
      const draw = () => guard(() => {
        const m = /^\s*(-?\d+)\s*\.\.\s*(-?\d+)\s*$/.exec($("input", w).value);
        if (!m) throw new Error("Облыс: мысалы 0..40");
        const lo = +m[1], hi = Math.min(+m[2], +m[1] + 200);
        const sp = { expr: fe.input.value, prop: $("select", w).value, where: spec.where, domain: [lo, hi] };
        AR.parse(sp.expr);
        const cells = [];
        let bad = 0;
        for (let n = lo; n <= hi; n++) {
          if (sp.where && !AR.PROPS[sp.where][1](AR.Q(BigInt(n)))) continue;
          let v;
          try { v = AR.val(sp.expr, n); } catch (e) { cells.push(`<span class="n" title="${esc(e.message)}">${n}: ?</span>`); continue; }
          const ok = AR.PROPS[sp.prop][1](v);
          bad += !ok;
          cells.push(`<span class="${ok ? "y" : "n"}" title="f(${n}) = ${esc(AR.str(v))}">${n}: ${esc(AR.str(v))}</span>`);
        }
        out.innerHTML = `<div class="ac-qd ac-search">${cells.join("")}</div><p class="ac-verdict ${bad ? "k-contradiction" : "k-tautology"}">${bad ? `${bad} қарсы мысал табылды (қызыл). Тұжырым «барлық n үшін» жалған.` : "Бұл облыста қарсы мысал жоқ. Бұл - дәлелдеу емес, тек тексеріс."}</p>`;
      }, fe);
      $$("input, select", w).forEach((x) => x.addEventListener("input", draw));
      el.append(fe, w, out); draw();
    } else if (spec.lab === "induction" || spec.lab === "recur") {
      const ind = spec.lab === "induction";
      const f1 = exprInput(ind ? spec.term : spec.rule, ind ? "Мүше f(n)" : "Ереже: a(n) = ... (a - алдыңғы мүше)", () => draw());
      const f2 = exprInput(spec.closed, "Жабық формула g(n)", () => draw());
      const draw = () => guard(() => {
        const r = ind ? AR.checkClosedForm(f1.input.value, f2.input.value, spec.start, 12) : AR.checkRecurrence({ first: spec.first, start: spec.start, rule: f1.input.value }, f2.input.value, 12);
        const rows = r.rows.map((x, i) => {
          let step = "";
          if (ind && i + 1 < r.rows.length) {
            const nxt = r.rows[i + 1];
            const stepOk = AR.eq(AR.sub(nxt.closed, x.closed), AR.sub(nxt.sum, x.sum));
            step = `<td class="${stepOk ? "v1" : "v0"}">${stepOk ? "✓" : "✗"}</td>`;
          } else if (ind) step = "<td></td>";
          return `<tr><td>${x.N}</td><td>${esc(AR.str(ind ? x.sum : x.a))}</td><td>${esc(AR.str(x.closed))}</td><td class="${x.ok ? "v1" : "v0"}">${x.ok ? "=" : "≠"}</td>${step}</tr>`;
        }).join("");
        const base = r.rows[0].ok;
        out.innerHTML = `<div class="ac-tt-wrap"><table class="ac-tt"><thead><tr><th>n</th><th>${ind ? "Σ f(i), i ≤ n" : "a(n)"}</th><th>g(n)</th><th></th>${ind ? "<th>қадам g(n+1) − g(n) = f(n+1)</th>" : ""}</tr></thead><tbody>${rows}</tbody></table></div>
          <p class="ac-verdict ${r.ok ? "k-tautology" : "k-contradiction"}">${r.ok ? `Алғашқы ${r.rows.length} мәнде сәйкес. Негіз ${base ? "ақиқат" : "жалған"}.` : `n = ${r.first.N}-де сәйкес емес${base ? "" : " (негіздің өзі жалған)"}.`} Бұл - сандық тексеріс; дәлелдеу үшін индукция керек.</p>`;
      }, f1);
      el.append(f1, f2, out); draw();
    } else if (spec.lab === "trace") {
      const w = document.createElement("div");
      w.className = "ac-trace";
      const inp = spec.inputs || {};
      w.innerHTML = `<label class="ac-codebox"><span>Псевдокод</span><textarea rows="${Math.min(16, spec.code.split("\n").length + 1)}" spellcheck="false" autocapitalize="off">${esc(spec.code)}</textarea></label>
        ${Object.keys(inp).length ? `<div class="ac-quant">${Object.entries(inp).map(([k, v]) => `<label><span>Кіріс ${esc(k)}</span><input type="text" data-in="${esc(k)}" value="${esc(fmtVal(v))}"></label>`).join("")}</div>` : ""}
        <div class="ac-qa"><button type="button" class="btn gold" data-run>▶ Орындау</button><button type="button" class="btn secondary" data-prev>← Қадам</button><button type="button" class="btn secondary" data-next>Қадам →</button><span class="ac-st" data-pos></span></div>
        <p class="ac-note">Бұл - AO17 оқу псевдокодының интерпретаторы: әр орындалған жолдан кейінгі айнымалылар күйі көрсетіледі.</p>`;
      let res = null, pos = 0;
      const show = () => {
        if (!res) return;
        const t = res.trace, n = t.length;
        pos = Math.max(0, Math.min(pos, n - 1));
        const cur = t[pos] || { line: 0, env: {} };
        const lines = $("textarea", w).value.split("\n");
        const vars = Object.keys(res.env);
        const shown = vars.map((v) => `<tr><th>${esc(v)}</th><td>${v in cur.env ? esc(fmtVal(cur.env[v])) : "-"}</td></tr>`).join("");
        out.innerHTML = `<div class="ac-trace-grid"><ol class="ac-codeview">${lines.map((l, i) => `<li class="${i + 1 === cur.line ? "cur" : ""}"><span class="cnt" title="орындалу саны">${res.counts[i + 1] || ""}</span><code>${esc(l) || " "}</code></li>`).join("")}</ol>
          <div><table class="ac-tt"><thead><tr><th>айнымалы</th><th>мәні</th></tr></thead><tbody>${shown || "<tr><td colspan=2>-</td></tr>"}</tbody></table>
          ${cur.cond !== undefined ? `<p>Шарт: <b>${cur.cond ? "ақиқат" : "жалған"}</b></p>` : ""}${res.output.length ? `<p>Шығыс: <code>${esc(res.output.join(" | "))}</code></p>` : ""}${res.result !== undefined ? `<p>Нәтиже (return): <b>${esc(fmtVal(res.result))}</b></p>` : ""}</div></div>`;
        $("[data-pos]", w).textContent = `${pos + 1} / ${n} қадам · барлығы ${res.steps} нұсқау`;
      };
      const runIt = () => guard(() => {
        const inputs = {};
        $$("[data-in]", w).forEach((x) => { const v = x.value.trim(); inputs[x.dataset.in] = /^\[/.test(v) ? JSON.parse(v) : v === "true" ? true : v === "false" ? false : Number(v); });
        res = PS.run($("textarea", w).value, inputs);
        pos = res.trace.length - 1;
        show();
      });
      $("[data-run]", w).addEventListener("click", runIt);
      $("[data-prev]", w).addEventListener("click", () => { pos--; show(); });
      $("[data-next]", w).addEventListener("click", () => { pos++; show(); });
      el.append(w, out); runIt();
    } else if (spec.lab === "growth") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>n шекарасы</span><input type="number" min="2" max="200" value="${spec.max || 20}"></label>
        <div class="ac-opts">${Object.keys(GROWTH).map((f) => `<label><input type="checkbox" value="${esc(f)}"${spec.fns.includes(f) ? " checked" : ""}> ${esc(f)}</label>`).join("")}</div>`;
      const COLORS = ["#173e35", "#733c3c", "#8a6a2f", "#2563eb", "#7c3aed", "#0f766e", "#b45309", "#be123c", "#4d7c0f", "#475569"];
      const draw = () => guard(() => {
        const N = Math.max(2, Math.min(200, +$("input[type=number]", w).value || 20));
        const fs = $$("input[type=checkbox]:checked", w).map((c) => c.value);
        const W = 340, H = 220, pad = 28;
        const ymax = Math.max(...fs.map((f) => GROWTH[f](N)), 1);
        const lg = (v) => Math.log10(Math.max(v, 1e-9) + 1);
        const Y = (v) => H - pad - (lg(v) / lg(ymax)) * (H - 2 * pad);
        const X = (n) => pad + ((n - 1) / (N - 1)) * (W - 2 * pad);
        const paths = fs.map((f, i) => { const pts = []; for (let n = 1; n <= N; n++) { const v = GROWTH[f](n); if (Number.isFinite(v)) pts.push(`${X(n).toFixed(1)},${Y(v).toFixed(1)}`); } return `<polyline fill="none" stroke="${COLORS[Object.keys(GROWTH).indexOf(f)]}" stroke-width="2" points="${pts.join(" ")}"/>`; }).join("");
        const rows = [1, 2, 5, 10, 20, 50, 100, 200].filter((n) => n <= N).map((n) => `<tr><td>${n}</td>${fs.map((f) => { const v = GROWTH[f](n); return `<td>${v < 1e6 ? (Number.isInteger(v) ? v : v.toFixed(2)) : v.toExponential(2)}</td>`; }).join("")}</tr>`).join("");
        out.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="ac-graph" role="img" aria-label="Өсу функцияларының графигі (логарифмдік шкала)"><line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" class="ge"/><line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" class="ge"/>${paths}<text x="${W - pad}" y="${H - 8}" text-anchor="end" class="gl">n = ${N}</text></svg>
          <p class="ac-note">Тік ось - логарифмдік (log₁₀). Түстер: ${fs.map((f) => `<b><i class="ac-sw" style="background:${COLORS[Object.keys(GROWTH).indexOf(f)]}"></i>${esc(f)}</b>`).join(", ")}</p>
          <div class="ac-tt-wrap"><table class="ac-tt"><thead><tr><th>n</th>${fs.map((f) => `<th>${esc(f)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
      });
      $$("input", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    } else if (spec.lab === "pyrun") {
      const ta = codeArea(spec.code);
      const w = document.createElement("div");
      w.className = "ac-pyrun";
      w.innerHTML = `<label class="ac-codebox"><span>Енгізу (stdin), әр жолға бір мән</span><textarea class="ac-stdin" rows="2" spellcheck="false">${esc(spec.stdin || "")}</textarea></label><div class="ac-qa"><button type="button" class="btn gold" data-run>▶ Іске қосу</button><span class="ac-st" data-st></span></div>`;
      const run = async () => {
        $("[data-st]", w).textContent = "Орындалып жатыр...";
        try {
          const r = await pyRun(ta.value, $(".ac-stdin", w).value);
          out.innerHTML = `<pre class="run-output${r.ok ? "" : " err"}">${esc(r.out || (r.ok ? "(шығыс жоқ)" : ""))}${r.ok ? "" : `\n${esc(r.error)}${r.line ? ` (${r.line}-жол)` : ""}: ${esc(r.detail || "")}`}</pre>${r.err ? `<div class="ac-out"><span>stderr</span><pre class="run-output err">${esc(r.err)}</pre></div>` : ""}${r.ok ? "" : `<p class="ac-fb bad">${esc(r.hint)}</p>`}`;
          $("[data-st]", w).textContent = "";
        } catch (e) { $("[data-st]", w).textContent = PY_FAIL; }
      };
      $("[data-run]", w).addEventListener("click", run);
      out.innerHTML = '<p class="ac-note">«Іске қосу» басыңыз: нағыз Python (Pyodide) браузерде орындалады.</p>';
      el.append(ta, w, out);
    } else if (spec.lab === "calltree") {
      const ta = codeArea(spec.code);
      const w = document.createElement("div");
      w.className = "ac-pyrun";
      w.innerHTML = `<label class="ac-codebox"><span>Шақыру</span><input type="text" class="ac-stdin" value="${esc(spec.call)}" spellcheck="false"></label><div class="ac-qa"><button type="button" class="btn gold" data-run>Ағашты салу</button><span class="ac-st" data-st></span></div>`;
      const run = async () => {
        $("[data-st]", w).textContent = "Орындалып жатыр...";
        try {
          const r = await pyTrace(ta.value, $(".ac-stdin", w).value);
          const kids = {};
          r.nodes.forEach((n) => (kids[n.parent] = kids[n.parent] || []).push(n));
          const draw = (n) => `<li><span class="nd op">${esc(n.func)}(${esc(Object.values(n.args).join(", "))})</span>${n.ret != null ? ` <span class="nd var">→ ${esc(n.ret)}</span>` : ""}${kids[n.id] ? `<ul>${kids[n.id].map(draw).join("")}</ul>` : ""}</li>`;
          const depth = (() => { let d = 0; const dep = {}; r.nodes.forEach((n) => { dep[n.id] = n.parent == null ? 1 : dep[n.parent] + 1; d = Math.max(d, dep[n.id]); }); return d; })();
          out.innerHTML = r.ok ? `<p>Шақырулар: <b>${r.nodes.length}</b> · тереңдік: <b>${depth}</b>${r.truncated ? " · <b>400 шақырудан кейін тоқтатылды</b> (шексіз рекурсия болуы мүмкін)" : ` · нәтиже: <code>${esc(r.value)}</code>`}</p><div class="ac-tree-wrap"><ul class="ac-tree">${(kids[null] || []).slice(0, 1).map(draw).join("")}</ul></div>`
            : `<p class="ac-fb bad">${esc(r.error)}${r.line ? ` (${r.line}-жол)` : ""}: ${esc(r.hint)}</p>`;
          $("[data-st]", w).textContent = "";
        } catch (e) { $("[data-st]", w).textContent = PY_FAIL; }
      };
      $("[data-run]", w).addEventListener("click", run);
      out.innerHTML = '<p class="ac-note">«Ағашты салу» басыңыз: Python шақыруларды нақты орындап, әрқайсысын жазады.</p>';
      el.append(ta, w, out);
    } else if (spec.lab === "arena") {
      const ta = codeArea(spec.code);
      const w = document.createElement("div");
      w.className = "ac-pyrun";
      w.innerHTML = `<label class="ac-codebox"><span>Функция және кіріс тізімі (үтірмен)</span><span class="ac-arena-in"><input type="text" class="ac-stdin" data-fn value="${esc(spec.func)}" spellcheck="false" aria-label="Функция аты"><input type="text" class="ac-stdin" data-data value="${esc(spec.data.join(", "))}" spellcheck="false" aria-label="Кіріс тізімі"></span></label><div class="ac-qa"><button type="button" class="btn gold" data-run>▶ Орындау</button><span class="ac-st" data-st></span></div>`;
      let R = null, base = [], k = 0, timer = null;
      const stateAt = (n) => { let a = base.slice(); let hi = [], kind = ""; for (let i = 0; i < n; i++) { const e = R.events[i]; if (e.op === "set") a[e.i] = e.v; else if (e.op === "all") a = e.arr.slice(); } const e = R.events[n - 1]; if (e) { kind = e.op; if (e.op === "set") hi = [e.i]; else if (e.op === "cmp") { const ia = a.indexOf(e.a); const ib = a.findIndex((v, j) => v === e.b && j !== ia); hi = [ia, ib].filter((x) => x >= 0); } } return { a, hi, kind, e }; };
      const counts = (n) => { let c = 0, wr = 0; for (let i = 0; i < n; i++) { if (R.events[i].op === "cmp") c++; else wr++; } return [c, wr]; };
      const bars = (a, hi, kind) => { const mx = Math.max(...a.map((v) => Math.abs(+v) || 0), 1), W = 340, H = 150, bw = W / Math.max(a.length, 1); return `<svg viewBox="0 0 ${W} ${H + 18}" class="ac-graph ac-arena" role="img" aria-label="Тізім күйі: ${esc(a.join(", "))}">${a.map((v, i) => { const h = Math.max(3, (Math.abs(+v) / mx) * H); return `<rect x="${(i * bw + 1).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${Math.max(bw - 2, 1).toFixed(1)}" height="${h.toFixed(1)}" class="${hi.includes(i) ? (kind === "set" ? "ar-set" : "ar-cmp") : "ar"}"/>${a.length <= 24 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H + 13}" text-anchor="middle" class="gl">${esc(v)}</text>` : ""}`; }).join("")}</svg>`; };
      const show = () => {
        const st = stateAt(k), [c, wr] = counts(k);
        const what = !st.e ? "Бастапқы күй" : st.e.op === "cmp" ? `Салыстыру: ${st.e.a} ? ${st.e.b}` : st.e.op === "set" ? `Жазу: a[${st.e.i}] = ${st.e.v}` : "Кесіндіге жазу";
        $("[data-view]", out).innerHTML = bars(st.a, st.hi, st.kind) + `<p class="ac-note">Қадам <b>${k}</b> / ${R.events.length} · ${esc(what)} · салыстыру: <b>${c}</b> · жазу: <b>${wr}</b></p>`;
        $("input[type=range]", out).value = k;
      };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; $("[data-play]", out).textContent = "▶ Ойнату"; } };
      const run = async () => {
        stop();
        $("[data-st]", w).textContent = "Орындалып жатыр...";
        try {
          base = $("[data-data]", w).value.split(",").map((x) => x.trim()).filter(Boolean).map((x) => (isNaN(+x) ? x : +x));
          if (base.length > 60) throw new Error("big");
          R = await pySort(ta.value, $("[data-fn]", w).value.trim(), base);
          $("[data-st]", w).textContent = "";
          if (!R.ok) { out.innerHTML = `<p class="ac-fb bad">${esc(R.error)}${R.line ? ` (${R.line}-жол)` : ""}: ${esc(R.hint)}${R.detail ? `<br><small>${esc(R.detail)}</small>` : ""}</p>`; return; }
          const fin = R.returned || R.final;
          out.innerHTML = `<div data-view></div><div class="ac-qa"><button type="button" class="btn secondary" data-prev aria-label="Артқа">◀</button><button type="button" class="btn secondary" data-play>▶ Ойнату</button><button type="button" class="btn secondary" data-next aria-label="Алға">▶|</button><input type="range" min="0" max="${R.events.length}" value="0" aria-label="Қадам"></div>
            <p class="ac-note">${R.truncated ? "<b>4000 оқиғадан кейін тоқтатылды</b> (шексіз цикл болуы мүмкін). " : `Барлығы: <b>${R.stats.cmp}</b> салыстыру, <b>${R.stats.write}</b> жазу. Нәтиже ${R.sorted ? "<b>сұрыпталған</b>" : "<b>сұрыпталмаған!</b>"}: <code>${esc(fin.join(", "))}</code>. `}${R.returned ? "Функция ЖАҢА тізім қайтарды: бастапқы тізімге жазу болмаса, бағандар тек салыстыруларды көрсетеді." : ""}</p>`;
          k = 0; show();
          $("[data-prev]", out).addEventListener("click", () => { stop(); k = Math.max(0, k - 1); show(); });
          $("[data-next]", out).addEventListener("click", () => { stop(); k = Math.min(R.events.length, k + 1); show(); });
          $("input[type=range]", out).addEventListener("input", (e) => { stop(); k = +e.target.value; show(); });
          $("[data-play]", out).addEventListener("click", () => { if (timer) return stop(); if (k >= R.events.length) k = 0; $("[data-play]", out).textContent = "❚❚ Тоқтату"; timer = setInterval(() => { if (k >= R.events.length || !out.isConnected) return stop(); k++; show(); }, Math.max(40, 2400 / Math.max(R.events.length, 1))); });
        } catch (e) { $("[data-st]", w).textContent = e.message === "big" ? "Кіріс 60 элементтен аспасын." : PY_FAIL; }
      };
      $("[data-run]", w).addEventListener("click", run);
      out.innerHTML = '<p class="ac-note">«Орындау» басыңыз: Python функцияны нақты орындап, әр салыстыру мен әр жазуды тіркейді. Бағандар - тізімнің сол сәттегі нақты күйі.</p>';
      el.append(ta, w, out);
    } else if (spec.lab === "cshow") {
      const w = document.createElement("div");
      w.className = "ac-pyrun";
      w.innerHTML = `<pre class="ac-pseudo ac-c"><code>${spec.code.split("\n").map((l, i) => `<span class="ln">${i + 1}</span>${esc(l)}`).join("\n")}</code></pre>${spec.args ? `<p class="ac-note">Іске қосу: <code>./prog ${esc(spec.args.join(" "))}</code></p>` : ""}${spec.stdin ? `<p class="ac-note">stdin: <code>${esc(spec.stdin).replace(/\n/g, "↵")}</code></p>` : ""}<label class="ac-codebox"><span>Алдымен болжаңыз: бағдарлама не шығарады?</span><textarea rows="3" spellcheck="false"></textarea></label><div class="ac-qa"><button type="button" class="btn gold" data-run>Шығысты көрсету</button></div>`;
      $("[data-run]", w).addEventListener("click", () => {
        const guess = $("textarea", w).value.replace(/\s+$/, "");
        const same = guess && guess.split("\n").map((l) => l.trimEnd()).join("\n") === spec.output.replace(/\s+$/, "");
        out.innerHTML = `<div class="ac-out"><span>Шығыс (build кезінде gcc -std=c11 арқылы алынған${spec.cflags ? ", " + esc(spec.cflags.join(" ")) : ""})</span><pre class="run-output">${esc(spec.output)}</pre></div>${spec.stderrShow ? `<div class="ac-out"><span>stderr</span><pre class="run-output err">${esc(spec.stderrShow)}</pre></div>` : ""}${guess ? `<p class="ac-fb ${same ? "good" : "bad"}">${same ? "Болжамыңыз дәл сәйкес." : "Болжам сәйкес емес - қай жолда айырмашылық бар екенін табыңыз."}</p>` : ""}`;
      });
      out.innerHTML = '<p class="ac-note">Браузерде C компиляторы жоқ. Бұл бағдарламаның шығысы сайтты құрастыру кезінде нағыз gcc-мен алынып, тексерілген.</p>';
      el.append(w, out);
    } else if (spec.lab === "base") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Сан</span><input type="text" data-v value="${esc(spec.value)}" autocapitalize="characters"></label><label><span>Негізі</span><select data-b>${[2, 8, 10, 16].map((b) => `<option value="${b}"${b === spec.from ? " selected" : ""}>${b}</option>`).join("")}</select></label>`;
      const draw = () => guard(() => {
        const b = +$("[data-b]", w).value, raw = $("[data-v]", w).value.trim();
        const v = BI.fromBase(raw, b);
        const rows = [[2, "екілік"], [8, "сегіздік"], [10, "ондық"], [16, "он алтылық"]].map(([bb, n]) => `<tr><th>${n} (${bb})</th><td><code>${esc(BI.toBase(v, bb))}</code></td></tr>`).join("");
        let tw = "";
        [8, 16, 32].forEach((bits) => { try { tw += `<tr><th>қосымша код, ${bits} бит</th><td><code>${BI.twos(v, bits).replace(/(.{4})(?=.)/g, "$1 ")}</code></td></tr>`; } catch (e) {} });
        out.innerHTML = `<div class="ac-tt-wrap"><table class="ac-tt ac-left"><tbody>${rows}${tw}</tbody></table></div>${v >= 0n ? `<p class="ac-note">Жайылу: ${esc(raw.toUpperCase())}<sub>${b}</sub> = ${esc(BI.expansion(raw.replace(/^-/, ""), b))} = ${esc(String(v))}</p>` : ""}<p class="ac-note">Биттер саны: ${v >= 0n ? BI.toBase(v, 2).length : "-"}</p>`;
      });
      $$("input, select", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    } else if (spec.lab === "bitpanel") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>a</span><input type="text" data-a value="${esc(spec.a)}"></label><label><span>Амал</span><select data-op>${["&", "|", "^", "+", "-", "<<", ">>"].map((o) => `<option${o === spec.op ? " selected" : ""}>${o}</option>`).join("")}</select></label><label><span>b</span><input type="text" data-bb value="${esc(spec.b)}"></label><label><span>Ені (бит)</span><select data-w>${[4, 8, 16].map((x) => `<option${x === spec.width ? " selected" : ""}>${x}</option>`).join("")}</select></label>`;
      const draw = () => guard(() => {
        const W = +$("[data-w]", w).value, op = $("[data-op]", w).value;
        const a = BI.bitExpr($("[data-a]", w).value, W), b = BI.bitExpr($("[data-bb]", w).value, W), r = BI.bitExpr(`${a} ${op} ${b}`, W);
        const bin = (x) => BI.toBase(x, 2).padStart(W, "0");
        const cells = (x) => [...bin(x)].map((c) => `<span class="bt b${c}">${c}</span>`).join("");
        const ones = (x) => [...bin(x)].filter((c) => c === "1").length;
        const signed = (x) => String(BI.fromTwos(bin(x)));
        const raw = op === "+" ? a + b : op === "-" ? a - b : null;
        out.innerHTML = `<div class="ac-bits"><div><span>a</span>${cells(a)}<em>${a} · таңбалы ${signed(a)}</em></div><div><span>${esc(op)}</span>${op === "<<" || op === ">>" ? `<em>${b} орын</em>` : cells(b) + `<em>${b}</em>`}</div><div class="res"><span>=</span>${cells(r)}<em>${r} · таңбалы ${signed(r)} · 0x${BI.toBase(r, 16)}</em></div></div>
          <p class="ac-note">Бірліктер саны: a - ${ones(a)}, нәтиже - ${ones(r)} (жұптылық: ${ones(r) % 2 ? "тақ" : "жұп"}).${raw !== null && (raw < 0n || raw >= 1n << BigInt(W)) ? ` <b>Таңбасыз асып кету:</b> нақты нәтиже ${raw}, ${W} битке сыймады.` : ""}</p>`;
      });
      $$("input, select", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    } else if (spec.lab === "utf8" || spec.lab === "rle") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Мәтін</span><input type="text" data-t value="${esc(spec.text)}"></label>`;
      const draw = () => guard(() => {
        const t = $("[data-t]", w).value;
        if (spec.lab === "rle") {
          const c = BI.rle(t), n = [...t].length;
          out.innerHTML = `<p class="ac-formula">${esc(c) || "∅"}</p><p>Бастапқы: ${n} символ · RLE: ${[...c].length} символ · коэффициент ${n ? ([...c].length / n).toFixed(2) : "-"} ${[...c].length > n ? "(ұзарды!)" : ""}</p>`;
        } else {
          const u = BI.utf8(t);
          out.innerHTML = `<div class="ac-tt-wrap"><table class="ac-tt"><thead><tr><th>символ</th><th>код нүктесі</th><th>байттар (hex)</th><th>байттар (екілік)</th></tr></thead><tbody>${u.map((x) => `<tr><td>${esc(x.ch === " " ? "␠" : x.ch)}</td><td><code>${x.hex}</code></td><td><code>${x.bytesHex}</code></td><td><code>${x.bytes.map((b) => b.toString(2).padStart(8, "0")).join(" ")}</code></td></tr>`).join("")}</tbody></table></div><p>Символ: ${u.length} · байт: ${u.reduce((s, x) => s + x.bytes.length, 0)}</p>`;
        }
      });
      $("input", w).addEventListener("input", draw);
      el.append(w, out); draw();
    } else if (spec.lab === "float") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Ондық сан</span><input type="text" data-f value="${esc(spec.value)}" inputmode="decimal"></label>`;
      const draw = () => guard(() => {
        const x = Number($("[data-f]", w).value.replace(",", "."));
        if (Number.isNaN(x) && $("[data-f]", w).value.trim().toLowerCase() !== "nan") throw new Error("Сан енгізіңіз (мысалы 0.1, -2.5, 1e10)");
        const f = BI.float32(x);
        out.innerHTML = `<div class="ac-bits ac-float"><div><span>s</span>${[...f.sign].map((c) => `<span class="bt b${c} ac-fs">${c}</span>`).join("")}<em>таңба (1 бит)</em></div><div><span>e</span>${[...f.exponent].map((c) => `<span class="bt b${c} ac-fe">${c}</span>`).join("")}<em>дәреже (8 бит)</em></div><div class="wrap"><span>m</span>${[...f.mantissa].map((c) => `<span class="bt b${c} ac-fm">${c}</span>`).join("")}</div><p class="ac-note">мантисса (23 бит)</p></div>
          <p>Таңба: ${f.sign === "1" ? "теріс" : "оң"} · дәреже өрісі ${f.e} → 2^${f.unbiased} · түрі: ${esc(f.kind)}</p>
          <p>Сақталған мән: <code>${esc(String(f.stored))}</code> ${f.stored === x ? "(дәл)" : "<b>(дәл емес - жуықтау)</b>"}</p>`;
      });
      $("input", w).addEventListener("input", draw);
      el.append(w, out); draw();
    } else if (spec.lab === "venn") {
      const names = Object.keys(spec.sets);
      const fe = exprInput(spec.expr, "Жиын өрнегі (∪ ∩ \\ △ ')", () => draw());
      const keys = document.createElement("div");
      keys.className = "ac-keys";
      keys.innerHTML = ["∪", "∩", "\\", "△", "'", "(", ")", "U", "∅", ...names].map((k) => `<button type="button" data-k="${esc(k)}">${esc(k)}</button>`).join("");
      $$("button", keys).forEach((b) => b.addEventListener("click", () => { const i = fe.input; i.value += (b.dataset.k.length === 1 && /[∪∩△\\]/.test(b.dataset.k)) ? " " + b.dataset.k + " " : b.dataset.k; i.dispatchEvent(new Event("input")); i.focus(); }));
      const sw = document.createElement("div");
      sw.className = "ac-quant";
      sw.innerHTML = names.map((n) => `<label><span>${n}</span><input type="text" data-set="${n}" value="${esc(elText(spec.sets[n]))}"></label>`).join("") + `<label><span>U</span><input type="text" data-set="U" value="${esc(elText(spec.U))}"></label>`;
      const cv = document.createElement("canvas");
      cv.width = 360; cv.height = 240; cv.className = "ac-venn"; cv.setAttribute("role", "img");
      const draw = () => guard(() => {
        const sets = {};
        names.forEach((n) => (sets[n] = DS.parseSet($(`[data-set="${n}"]`, sw).value)));
        const U = DS.parseSet($('[data-set="U"]', sw).value);
        const tree = DS.parseExpr(fe.input.value);
        const res = DS.evalSet(tree, sets, U);
        const logic = L.parse(DS.toLogic(tree));
        // аймақтарды бояу: әр пиксел үшін мүшелік шарты (2-3 жиын)
        const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
        const C = names.length === 2 ? [[140, 120], [220, 120]] : [[145, 95], [215, 95], [180, 155]];
        const R = names.length === 2 ? 85 : 72;
        const css = getComputedStyle(document.body);
        const fill = css.getPropertyValue("--ac-green").trim() || "#173e35", line = css.getPropertyValue("--text").trim() || "#222";
        const img = ctx.createImageData(W, H);
        const hex = fill.replace("#", ""); const fr = parseInt(hex.slice(0, 2), 16), fg = parseInt(hex.slice(2, 4), 16), fb = parseInt(hex.slice(4, 6), 16);
        const memo = {};
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const env = {}; let code = "";
          names.forEach((n, i) => { const inside = (x - C[i][0]) ** 2 + (y - C[i][1]) ** 2 <= R * R; env[n.toLowerCase()] = inside; code += inside ? 1 : 0; });
          const v = code in memo ? memo[code] : (memo[code] = L.evaluate(logic, env));
          if (v) { const o = (y * W + x) * 4; img.data[o] = fr; img.data[o + 1] = fg; img.data[o + 2] = fb; img.data[o + 3] = 110; }
        }
        ctx.putImageData(img, 0, 0);
        ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.strokeRect(1, 1, W - 2, H - 2);
        ctx.fillStyle = line; ctx.font = "bold 15px sans-serif";
        C.forEach((c, i) => { ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, 2 * Math.PI); ctx.stroke(); ctx.fillText(names[i], c[0] + (i === 0 ? -R + 6 : i === 1 ? R - 18 : -5), c[1] + (i === 2 ? R - 8 : -R + 20)); });
        ctx.fillText("U", 10, 22);
        cv.setAttribute("aria-label", `Венн диаграммасы: ${fe.input.value} аймағы боялған`);
        out.innerHTML = `<p class="ac-formula">${esc(fe.input.value)} = ${esc(DS.fmt(res))}</p><p class="ac-note">Мүшелік шарты: ${esc(L.toStr(logic).replace(/\b([a-z])\b/g, (m) => "x ∈ " + m.toUpperCase()))}</p>`;
      }, fe);
      $$("input", sw).forEach((x) => x.addEventListener("input", draw));
      el.append(fe, keys, sw, cv, out); draw();
    } else if (spec.lab === "relation") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Жиын S</span><input type="text" data-s value="${esc(elText(spec.S))}"></label><label><span>Жұптар R</span><input type="text" data-r value="${esc(spec.R)}"></label>`;
      const draw = () => guard(() => {
        const S = DS.parseSet($("[data-s]", w).value), R = DS.parsePairs($("[data-r]", w).value);
        const has = (a, b) => R.some(([x, y]) => String(x) === String(a) && String(y) === String(b));
        const P = DS.relProps(S, R);
        const tbl = `<table class="ac-tt"><thead><tr><th>R</th>${S.map((b) => `<th>${esc(b)}</th>`).join("")}</tr></thead><tbody>${S.map((a) => `<tr><th>${esc(a)}</th>${S.map((b) => `<td class="${has(a, b) ? "v1" : ""}">${has(a, b) ? "●" : ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
        const why = { reflexive: () => { const a = S.find((x) => !has(x, x)); return a !== undefined ? `(${a}, ${a}) жоқ` : ""; },
          symmetric: () => { const p = R.find(([a, b]) => !has(b, a)); return p ? `(${p[0]}, ${p[1]}) бар, (${p[1]}, ${p[0]}) жоқ` : ""; },
          antisymmetric: () => { const p = R.find(([a, b]) => String(a) !== String(b) && has(b, a)); return p ? `(${p[0]}, ${p[1]}) және (${p[1]}, ${p[0]})` : ""; },
          transitive: () => (P.transWitness ? `(${P.transWitness[0]}, ${P.transWitness[1]}), (${P.transWitness[1]}, ${P.transWitness[2]}) бар, (${P.transWitness[0]}, ${P.transWitness[2]}) жоқ` : "") };
        out.innerHTML = `<div class="ac-tt-wrap">${tbl}</div><ul class="ac-props">${Object.keys(PROPN).map((k) => `<li class="${P[k] ? "y" : "n"}">${P[k] ? "✓" : "✗"} ${PROPN[k]}${P[k] ? "" : ": " + esc(why[k]())}</li>`).join("")}</ul>`
          + (P.equivalence ? `<p class="ac-verdict k-tautology">Эквиваленттік қатынас. Кластары: ${P.classes.map(DS.fmt).join(", ")}</p>` : P.partialOrder ? `<p class="ac-verdict k-contingent">Ішінара реттілік.</p>` : "");
      });
      $$("input", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    } else if (spec.lab === "graph") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Төбелер V</span><input type="text" data-v value="${esc(elText(spec.V))}"></label><label><span>Қабырғалар (u-v, үтірмен)</span><input type="text" data-e value="${esc(spec.E)}"></label>`;
      const draw = () => guard(() => {
        const V = DS.parseSet($("[data-v]", w).value), E = DS.parseEdges($("[data-e]", w).value);
        const g = DS.graphInfo(V, E);
        const n = g.vertices.length, cx = 170, cy = 120, r = n > 1 ? 90 : 0;
        const pos = {};
        g.vertices.forEach((v, i) => (pos[String(v)] = [cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)]));
        const lines = E.map(([a, b]) => { const p = pos[String(a)], q = pos[String(b)]; return String(a) === String(b) ? `<circle cx="${p[0]}" cy="${p[1] - 18}" r="12" class="ge"/>` : `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="ge"/>`; }).join("");
        const dots = g.vertices.map((v) => { const p = pos[String(v)]; return `<g class="gv"><circle cx="${p[0]}" cy="${p[1]}" r="15"/><text x="${p[0]}" y="${p[1] + 5}" text-anchor="middle">${esc(v)}</text></g>`; }).join("");
        out.innerHTML = `<svg viewBox="0 0 340 240" class="ac-graph" role="img" aria-label="Граф: ${n} төбе, ${g.edges} қабырға">${lines}${dots}</svg>
          <p>Төбе: <b>${n}</b> · қабырға: <b>${g.edges}</b> · дәрежелер: ${Object.entries(g.degrees).map(([v, d]) => `${esc(v)}:${d}`).join(", ")} · Σ deg = ${g.degreeSum} = 2·${g.edges}</p>
          <p>Компоненттер: ${g.components.map(DS.fmt).join(", ")} · ${g.connected ? "байланысқан" : "байланыспаған"} · ${g.tree ? "<b>ағаш</b>" : g.acyclic ? "орман (циклсыз)" : g.simple ? "циклы бар" : "қарапайым емес (тұзақ не еселі қабырға)"}</p>`;
      });
      $$("input", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    } else if (spec.lab === "func") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>X</span><input type="text" data-x value="${esc(elText(spec.X))}"></label><label><span>Y</span><input type="text" data-y value="${esc(elText(spec.Y))}"></label><label><span>f жұптары</span><input type="text" data-p value="${esc(spec.pairs)}"></label>`;
      const draw = () => guard(() => {
        const X = DS.parseSet($("[data-x]", w).value), Y = DS.parseSet($("[data-y]", w).value), Pp = DS.parsePairs($("[data-p]", w).value);
        const k = DS.funcKind(X, Y, Pp);
        const h = Math.max(X.length, Y.length) * 34 + 20;
        const yx = (i, n) => 20 + i * ((h - 40) / Math.max(1, n - 1)) + (n === 1 ? (h - 40) / 2 : 0);
        const px = {}, py = {};
        X.forEach((x, i) => (px[String(x)] = yx(i, X.length)));
        Y.forEach((y, i) => (py[String(y)] = yx(i, Y.length)));
        const arrows = Pp.filter(([a, b]) => String(a) in px && String(b) in py).map(([a, b]) => `<line x1="70" y1="${px[String(a)]}" x2="250" y2="${py[String(b)]}" class="ge" marker-end="url(#ah)"/>`).join("");
        out.innerHTML = `<svg viewBox="0 0 320 ${h}" class="ac-graph" role="img" aria-label="f: X → Y сызбасы"><defs><marker id="ah" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="gah"/></marker></defs>${arrows}
          ${X.map((x) => `<g class="gv"><circle cx="55" cy="${px[String(x)]}" r="14"/><text x="55" y="${px[String(x)] + 5}" text-anchor="middle">${esc(x)}</text></g>`).join("")}
          ${Y.map((y) => `<g class="gv"><circle cx="265" cy="${py[String(y)]}" r="14"/><text x="265" y="${py[String(y)] + 5}" text-anchor="middle">${esc(y)}</text></g>`).join("")}</svg>
          <p class="ac-verdict ${k.kind === "bijective" ? "k-tautology" : k.kind === "notfunction" ? "k-contradiction" : "k-contingent"}">${esc(FUNCN[k.kind])}${k.why ? ": " + esc(k.why) : ""}</p>`;
      });
      $$("input", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    } else if (spec.lab === "quant") {
      const w = document.createElement("div");
      w.className = "ac-quant";
      w.innerHTML = `<label><span>Облыс D (сандар, үтірмен)</span><input type="text" inputmode="numeric" value="${esc((spec.domain || []).join(", "))}"></label>
        <label><span>Предикат P(x)</span><select>${Object.entries(QUANT).map(([k, v]) => `<option value="${k}"${k === spec.pred ? " selected" : ""}>${esc(v[0])}</option>`).join("")}</select></label>`;
      const draw = () => {
        const D = $("input", w).value.split(/[,\s]+/).filter(Boolean).map(Number).filter((x) => Number.isInteger(x)).slice(0, 40);
        const [name, P] = QUANT[$("select", w).value];
        const yes = D.filter(P), no = D.filter((x) => !P(x));
        out.innerHTML = `<div class="ac-qd">${D.map((x) => `<span class="${P(x) ? "y" : "n"}">${x}</span>`).join("") || "<em>бос облыс</em>"}</div>
          <p><b>∀x P(x)</b> = ${b01(no.length === 0)} ${no.length ? `(қарсы мысал: x = ${no[0]})` : D.length ? "(қарсы мысал жоқ)" : "(бос облыс: бос ақиқат)"}</p>
          <p><b>∃x P(x)</b> = ${b01(yes.length > 0)} ${yes.length ? `(куә: x = ${yes[0]}; барлығы ${yes.length})` : "(куә жоқ)"}</p>
          <p><b>¬∀x P(x) ≡ ∃x ¬P(x)</b> = ${b01(no.length > 0)} · P(x): «x - ${esc(name)}»</p>`;
      };
      $$("input, select", w).forEach((x) => x.addEventListener("input", draw));
      el.append(w, out); draw();
    }
  }

  // ================================================================ тапсырмалар
  function checkFormula(ex, answer) {
    let t;
    try { t = L.parse(answer); } catch (e) { return { ok: false, msg: e.message }; }
    const used = L.opsUsed(t);
    if (ex.allowed) {
      const bad = used.filter((o) => !ex.allowed.includes(o));
      if (bad.length) return { ok: false, msg: `Бұл тапсырмада ${bad.map((o) => L.OPS[o]).join(", ")} қолдануға болмайды. Рұқсат: ${ex.allowed.map((o) => L.OPS[o]).join(" ")}.` };
    }
    const negOnly = (n) => (n.op === "not" && n.a.op !== "var" && n.a.op !== "const" ? false : [n.a, n.b].filter(Boolean).every(negOnly));
    if (ex.noNegatedGroups && !negOnly(t)) return { ok: false, msg: "¬ тек айнымалының алдында тұруы керек (жақшаны терістеуді Де Морганмен ашыңыз)." };
    const leaves = (n) => (n.op === "var" || n.op === "const" ? 1 : [n.a, n.b].filter(Boolean).reduce((s, x) => s + leaves(x), 0));
    if (ex.maxLength && leaves(t) > ex.maxLength) return { ok: false, msg: `Тым ұзын: ең көбі ${ex.maxLength} айнымалы кірісі болуы керек. Ықшамдаңыз.` };
    const literal = (n) => n.op === "var" || (n.op === "not" && n.a.op === "var");
    const flat = (n, op) => (n.op === op ? [...flat(n.a, op), ...flat(n.b, op)] : [n]);
    if (ex.form) {
      const [outer, inner] = ex.form === "dnf" ? ["or", "and"] : ["and", "or"];
      if (!flat(t, outer).every((term) => flat(term, inner).every(literal)))
        return { ok: false, msg: ex.form === "dnf" ? "Бұл ДҚФ емес: литерал конъюнкцияларының дизъюнкциясы болуы керек." : "Бұл КҚФ емес: литерал дизъюнкцияларының конъюнкциясы болуы керек." };
    }
    const nand = (n) => n.op === "var" || n.op === "const" || (n.op === "not" && n.a.op === "and" && nand(n.a.a) && nand(n.a.b));
    if (ex.nandOnly && !nand(t)) return { ok: false, msg: "Тек ¬(x ∧ y) түріндегі NAND бөліктері рұқсат." };
    if (ex.requireVars) {
      const vs = L.vars(t), miss = ex.requireVars.filter((v) => !vs.includes(v));
      if (miss.length) return { ok: false, msg: `Өрнекте ${miss.join(", ")} айнымалысы болуы керек.` };
    }
    const r = L.equivalent(t, ex.target);
    if (!r.equivalent) return { ok: false, msg: `Эквивалент емес. Қарсы мысал: ${envText(r.counterexample, r.vars)} болғанда сіздің өрнек = ${b01(r.left)}, ал керегі = ${b01(r.right)}.` };
    return { ok: true, msg: "Дұрыс: барлық бағалауда мақсатпен бірдей және шектеулер сақталған." };
  }

  function renderExercise(ex, key, rec, onResult) {
    const box = document.createElement("div");
    box.className = "ac-q";
    box.dataset.type = ex.type;
    const st = rec.ex[key] || {};
    let body = "";
    const ttVars = ex.type === "truthtable" ? L.truthTable(ex.formula) : null;
    if (ex.type === "mc") body = `<div class="ac-opts" role="radiogroup">${ex.options.map((o, i) => `<label><input type="radio" name="${esc(key)}" value="${i}"> <span>${esc(o)}</span></label>`).join("")}</div>`;
    else if (ex.type === "value") body = `<p class="ac-formula">${esc(ex.formula)}</p><p>Мәндер: ${esc(Object.entries(ex.env).map(([k, v]) => `${k} = ${v ? 1 : 0}`).join(", "))}</p><div class="ac-opts" role="radiogroup"><label><input type="radio" name="${esc(key)}" value="1"> 1 (ақиқат)</label><label><input type="radio" name="${esc(key)}" value="0"> 0 (жалған)</label></div>`;
    else if (ex.type === "classify") body = `<p class="ac-formula">${esc(ex.formula)}</p><div class="ac-opts" role="radiogroup">${Object.entries(KIND).map(([k, v]) => `<label><input type="radio" name="${esc(key)}" value="${k}"> ${esc(v)}</label>`).join("")}</div>`;
    else if (ex.type === "argument") body = `<p class="ac-formula">${esc(ex.premises.join(",  "))}  ⊨  ${esc(ex.conclusion)}</p><div class="ac-opts" role="radiogroup"><label><input type="radio" name="${esc(key)}" value="1"> Дұрыс аргумент</label><label><input type="radio" name="${esc(key)}" value="0"> Дұрыс емес</label></div>`;
    else if (ex.type === "number") body = `<label class="ac-num"><span>Жауап</span><input type="number" inputmode="numeric" step="1"></label>`;
    else if (ex.type === "coutput") body = `<pre class="ac-pseudo ac-c"><code>${ex.code.split("\n").map((l, i) => `<span class="ln">${i + 1}</span>${esc(l)}`).join("\n")}</code></pre>${ex.args ? `<p class="ac-note">Іске қосу: <code>./prog ${esc(ex.args.join(" "))}</code></p>` : ""}${ex.stdin ? `<p class="ac-note">stdin: <code>${esc(ex.stdin).replace(/\n/g, "↵")}</code></p>` : ""}<label class="ac-codebox"><span>Бағдарлама не шығарады? (әр жол - жеке жол)</span><textarea class="ac-setin ac-cout" rows="${Math.min(8, ex.answer.split("\n").length + 1)}" spellcheck="false" autocomplete="off"></textarea></label><p class="ac-note">Дұрыс жауап build кезінде нағыз gcc (C11) арқылы алынған. Браузерде C компиляторы жоқ - өзіңіз тексеру үшін: <code>gcc -Wall -o prog prog.c && ./prog</code></p>`;
    else if (ex.type === "trace" || ex.type === "count") body = `<pre class="ac-pseudo"><code>${ex.code.split("\n").map((l, i) => `<span class="ln">${i + 1}</span>${esc(l)}`).join("\n")}</code></pre>${Object.keys(ex.inputs || {}).length ? `<p class="ac-note">Кіріс: ${esc(Object.entries(ex.inputs).map(([k, v]) => k + " = " + fmtVal(v)).join(", "))}</p>` : ""}<label class="ac-num"><span>${ex.type === "count" ? ex.line + "-жол неше рет орындалады" : ex.ask === "result" ? "Нәтиже (return)" : ex.ask === "output" ? "Шығыс (print)" : ex.ask + " мәні"}</span><input type="text" class="ac-setin" autocomplete="off"></label>`;
    else if (ex.type === "convert") body = `<p class="ac-formula">${esc(ex.value)}<sub>${ex.from}</sub> → ?<sub>${ex.to}</sub></p><label class="ac-num"><span>${ex.to}-лік жүйедегі жазылуы</span><input type="text" class="ac-setin" autocomplete="off" autocapitalize="characters"></label>`;
    else if (ex.type === "bitop") body = `<p class="ac-formula">${esc(ex.expr)} <small>(${ex.width} бит)</small></p><label class="ac-num"><span>Нәтиже (ондық, 0b... не 0x...)</span><input type="text" class="ac-setin" autocomplete="off"></label>`;
    else if (ex.type === "encode") body = `<label class="ac-num"><span>${ex.kind === "twos" ? ex.bits + " бит (0 және 1)" : ex.kind === "utf8" ? "Байттар (он алтылық, бос орынмен)" : ex.kind === "parity" ? "Жұптық бит (0 не 1)" : ex.kind === "float32" ? "32 бит (бос орындарға рұқсат)" : "RLE коды"}</span><input type="text" class="ac-setin" autocomplete="off" autocapitalize="characters"></label>`;
    else if (ex.type === "setexpr") body = `<p class="ac-formula">${esc(ex.expr)}</p><label class="ac-num"><span>Жиын (мысалы: {1, 3, 5} не ∅)</span><input type="text" class="ac-setin" autocomplete="off"></label>`;
    else if (ex.type === "setid") body = `<p class="ac-formula">${esc(ex.target)}</p>${ex.forbid ? `<p class="ac-note">Тыйым салынған: ${esc(ex.forbid.join(" "))}</p>` : ""}<label class="ac-num"><span>Тепе-тең өрнек (A, B, C, ∪ ∩ \\ △ ')</span><input type="text" class="ac-setin" autocomplete="off"></label>`;
    else if (ex.type === "props") body = `<p class="ac-formula">S = {${esc(ex.S.join(", "))}}, R = {${esc(ex.R || "")}}</p><div class="ac-opts">${Object.entries(PROPN).map(([k, v]) => `<label><input type="checkbox" value="${k}"> ${esc(v)}</label>`).join("")}</div>`;
    else if (ex.type === "func") body = `<div class="ac-opts" role="radiogroup">${Object.entries(FUNCN).map(([k, v]) => `<label><input type="radio" name="${esc(key)}" value="${k}"> ${esc(v)}</label>`).join("")}</div>`;
    else if (ex.type === "counterexample") body = `<label class="ac-num"><span>Қарсы мысал n</span><input type="number" inputmode="numeric" step="1"></label>`;
    else if (ex.type === "closedform") body = `<p class="ac-formula">Σ f(i), i = ${ex.start}..n, мұнда f(n) = ${esc(ex.term)}</p>`;
    else if (ex.type === "recurrence") body = `<p class="ac-formula">a(${ex.start}) = ${ex.first}, a(n) = ${esc(ex.rule.replace(/a/g, "a(n−1)"))}</p>`;
    else if (ex.type === "order") body = `<ol class="ac-order">${shuffled(ex.steps, key + ex.q).map((i) => `<li data-i="${i}"><span>${esc(ex.steps[i])}</span><button type="button" class="ac-up" aria-label="Жоғары">↑</button><button type="button" class="ac-down" aria-label="Төмен">↓</button></li>`).join("")}</ol>`;
    else if (ex.type === "truthtable") body = `<p class="ac-formula">${esc(ex.formula)}</p><div class="ac-tt-wrap"><table class="ac-tt ac-fill"><thead><tr>${ttVars.vars.map((v) => `<th>${esc(v)}</th>`).join("")}<th class="res">мәні</th></tr></thead><tbody>${ttVars.rows.map((r, i) => `<tr>${ttVars.vars.map((v) => `<td>${b01(r.env[v])}</td>`).join("")}<td class="res"><button type="button" class="ac-cell" data-row="${i}" aria-label="${i + 1}-жолдың мәні">?</button></td></tr>`).join("")}</tbody></table></div><p class="ac-note">Ұяшықты басыңыз: ? → 0 → 1.</p>`;
    box.innerHTML = `<p class="ac-qt">${esc(ex.q)}</p>${body}<div class="ac-qa"><button type="button" class="btn gold ac-check">Тексеру</button><button type="button" class="btn secondary ac-hint">Кеңес</button><button type="button" class="btn secondary ac-reveal" hidden>Жауабын көрсету</button><span class="ac-st"></span></div><div class="ac-hints"></div><p class="ac-fb" role="status" aria-live="polite"></p>`;
    let fi = null;
    if (ex.type === "formula") { fi = formulaInput("", "Сіздің өрнегіңіз", null); box.insertBefore(fi, $(".ac-qa", box)); }
    let pyEd = null;
    if (ex.type === "pycode" || ex.type === "pytests") {
      const saved = rec.ex[key] && rec.ex[key].code;
      pyEd = codeArea(saved != null ? saved : ex.starter || "");
      box.insertBefore(pyEd, $(".ac-qa", box));
      const tl = document.createElement("p");
      tl.className = "ac-note";
      tl.textContent = ex.type === "pytests" ? `Сіз ТЕСТ жазасыз: test_ деп басталатын функциялар, ішінде assert. Тексерілетін функция: ${ex.func}(...) - ол дайын, оны жазбаңыз. Кемінде ${ex.min_tests || 1} тест; олар дұрыс іске асыруда өтуі және ${ex.mutants.length} әдейі қате нұсқаның (мутанттың) әрқайсысын «ұстауы» керек.` : `${ex.mode === "func" ? `Функция: ${ex.func}(...). ` : "Бағдарлама: енгізу/шығару. "}Тесттер: ${ex.tests.length} (ашық, браузерде тексеріледі).`;
      box.insertBefore(tl, pyEd);
    }
    if (ex.type === "closedform" || ex.type === "recurrence") { fi = exprInput("", "g(n) = (мысалы: n(n+1)/2, 2^n - 1)", null); box.insertBefore(fi, $(".ac-qa", box)); }
    $$(".ac-order li", box).forEach((li) => {
      $(".ac-up", li).addEventListener("click", () => { if (li.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling); $(".ac-up", li).focus(); });
      $(".ac-down", li).addEventListener("click", () => { if (li.nextElementSibling) li.parentNode.insertBefore(li.nextElementSibling, li); $(".ac-down", li).focus(); });
    });
    $$(".ac-cell", box).forEach((c) => c.addEventListener("click", () => { c.textContent = c.textContent === "?" ? "0" : c.textContent === "0" ? "1" : "?"; c.classList.remove("bad", "good"); }));
    const fb = $(".ac-fb", box), stEl = $(".ac-st", box);
    const showState = (s) => {
      box.classList.toggle("solved", !!s.ok);
      stEl.textContent = s.ok ? (s.rev ? "шешімі көрсетілді" : "✓ дұрыс") : s.tries ? `${s.tries} әрекет` : "";
      if (!s.ok && s.tries >= 2) $(".ac-reveal", box).hidden = false;
    };
    showState(st);
    let hintN = 0;
    $(".ac-hint", box).addEventListener("click", () => {
      if (hintN >= ex.hints.length) return;
      const p = document.createElement("p");
      p.textContent = `Кеңес ${hintN + 1}/${ex.hints.length}: ${ex.hints[hintN++]}`;
      $(".ac-hints", box).append(p);
      if (hintN >= ex.hints.length) $(".ac-hint", box).disabled = true;
    });
    const picked = () => { const r = $("input[type=radio]:checked", box); return r ? r.value : null; };
    function evaluate() {
      switch (ex.type) {
        case "mc": { const v = picked(); if (v == null) return null; const i = +v; return { ok: i === ex.answer, msg: ex.why[i] }; }
        case "value": { const v = picked(); if (v == null) return null; const want = L.evaluate(L.parse(ex.formula), ex.env); return { ok: (v === "1") === want, msg: (v === "1") === want ? "Дұрыс." : `Қате: өрнектің мәні ${b01(want)}. Ішкі жақшадан бастап қадамдап есептеңіз.` }; }
        case "classify": { const v = picked(); if (v == null) return null; const c = L.classify(ex.formula); return { ok: v === c.kind, msg: v === c.kind ? `Дұрыс: ${c.trueRows}/${c.rows} жол ақиқат.` : `Қате. Ақиқат жолдар саны: ${c.trueRows} / ${c.rows}. Кестені зертханада тексеріңіз.` }; }
        case "argument": { const v = picked(); if (v == null) return null; const r = L.validArgument(ex.premises, ex.conclusion); const ok = (v === "1") === r.valid; return { ok, msg: r.valid ? (ok ? "Дұрыс: қарсы мысал жоқ." : "Қате: аргумент дұрыс - алғышарттар ақиқат болатын әр жолда қорытынды да ақиқат.") : (ok ? `Дұрыс. Қарсы мысал: ${envText(r.counterexample, r.vars)}.` : `Қате: қарсы мысал бар - ${envText(r.counterexample, r.vars)}: алғышарттар ақиқат, қорытынды жалған.`) }; }
        case "number": { const v = $("input[type=number]", box).value; if (v === "") return null; return { ok: Number(v) === ex.answer, msg: Number(v) === ex.answer ? "Дұрыс." : "Қате. Кеңесті ашып көріңіз." }; }
        case "truthtable": {
          const cells = $$(".ac-cell", box);
          if (cells.some((c) => c.textContent === "?")) return { ok: false, msg: "Барлық ұяшықты толтырыңыз.", soft: true };
          let wrong = 0;
          cells.forEach((c, i) => { const good = (c.textContent === "1") === ttVars.rows[i].value; c.classList.toggle("bad", !good); c.classList.toggle("good", good); wrong += !good; });
          return { ok: !wrong, msg: wrong ? `${wrong} жол қате (қызылмен белгіленді).` : "Дұрыс: барлық жол сәйкес." };
        }
        case "formula": return checkFormula(ex, fi.input.value);
        case "counterexample": {
          const v = $("input[type=number]", box).value;
          if (v === "") return null;
          try { const r = AR.isCounterexample(ex, Number(v)); return { ok: r.ok, msg: r.msg }; } catch (e) { return { ok: false, msg: e.message, soft: true }; }
        }
        case "closedform": case "recurrence": {
          if (!fi.input.value.trim()) return null;
          try {
            const r = ex.type === "closedform" ? AR.checkClosedForm(ex.term, fi.input.value, ex.start, 30) : AR.checkRecurrence(ex, fi.input.value, 30);
            if (r.ok) return { ok: true, msg: `Дұрыс: n = ${ex.start}..${ex.start + 29} мәндерінің бәрінде сәйкес. Енді оны индукциямен дәлелдеп көріңіз.` };
            const b = r.first;
            return { ok: false, msg: `n = ${b.N} болғанда сіздің формула ${AR.str(b.closed)}, ал керегі ${AR.str(ex.type === "closedform" ? b.sum : b.a)}.` };
          } catch (e) { return { ok: false, msg: e.message, soft: true }; }
        }
        case "pycode": case "pytests": return { async: true };
        case "convert": case "encode": case "bitop": {
          const v = $(".ac-setin", box).value.trim(); if (!v) return null;
          const want = bitsKey(ex);
          let ok;
          if (ex.type === "bitop") { try { ok = BI.bitExpr(v, 64) === BigInt(want); } catch (e) { return { ok: false, msg: "Санды ондық, 0b... не 0x... түрінде жазыңыз", soft: true }; } }
          else if (ex.type === "encode" && ex.kind === "rle") ok = v === want;
          else ok = v.replace(/\s+/g, "").toUpperCase().replace(/^0+(?=.)/, ex.type === "convert" ? "" : "$&") === want.replace(/\s+/g, "").toUpperCase();
          if (ok) return { ok: true, msg: "Дұрыс: " + want };
          const hint = ex.type === "encode" && (ex.kind === "twos" || ex.kind === "float32") && v.replace(/\s+/g, "").length !== (ex.kind === "twos" ? ex.bits : 32) ? ` Ұзындығы ${ex.kind === "twos" ? ex.bits : 32} бит болуы керек.` : "";
          return { ok: false, msg: "Қате." + hint + " Зертханада тексеріп көріңіз." };
        }
        case "coutput": {
          const v = $(".ac-setin", box).value; if (!v.trim()) return null;
          const lines = (x) => x.replace(/\r/g, "").replace(/\s+$/, "").split("\n").map((l) => l.replace(/\s+$/, ""));
          const got = lines(v), want = lines(ex.answer);
          const bad = want.findIndex((l, i) => l !== got[i]);
          if (bad < 0 && got.length === want.length) return { ok: true, msg: "Дұрыс: шығыс gcc нәтижесімен дәл сәйкес." };
          const at = bad < 0 ? want.length : bad;
          return { ok: false, msg: `${at + 1}-жолдан бастап айырмашылық бар${got[at] != null ? ` (сіздікі: «${got[at]}»)` : " (жол жетіспейді)"}. Типтерді, бүтін бөлуді және printf форматын қайта тексеріңіз.` };
        }
        case "trace": case "count": {
          const v = $(".ac-setin", box).value.trim(); if (!v) return null;
          const want = ex.type === "count" ? String(PS.run(ex.code, ex.inputs || {}).counts[ex.line] || 0) : traceKey(ex);
          const norm = (x) => x.replace(/\s+/g, "").toLowerCase();
          return norm(v) === norm(want) ? { ok: true, msg: "Дұрыс." } : { ok: false, msg: "Қате. Зертханада бағдарламаны қадамдап орындап, айнымалыларды бақылаңыз." };
        }
        case "setexpr": {
          const v = $(".ac-setin", box).value; if (!v.trim()) return null;
          try {
            const got = DS.parseSet(v), want = DS.evalSet(ex.expr, ex.sets, ex.U);
            if (DS.eqSet(got, want)) return { ok: true, msg: "Дұрыс: " + DS.fmt(want) };
            const extra = got.filter((x) => !want.some((y) => String(y) === String(x))), miss = want.filter((x) => !got.some((y) => String(y) === String(x)));
            return { ok: false, msg: `Қате.${extra.length ? " Артық: " + extra.join(", ") + "." : ""}${miss.length ? " Жетіспейді: " + miss.length + " элемент." : ""}` };
          } catch (e) { return { ok: false, msg: e.message, soft: true }; }
        }
        case "setid": {
          const v = $(".ac-setin", box).value; if (!v.trim()) return null;
          try {
            DS.parseExpr(v);
            const bad = (ex.forbid || []).find((o) => v.includes(o));
            if (bad) return { ok: false, msg: `Бұл тапсырмада «${bad}» қолдануға болмайды.` };
            const r = DS.identical(v, ex.target);
            return r.identical ? { ok: true, msg: "Дұрыс: барлық мүшелік жағдайында тең (тепе-теңдік)." } : { ok: false, msg: `Тепе-тең емес. Қарсы мысал аймағы: x ${r.region} болғанда сіздің өрнекте x ${r.left ? "бар" : "жоқ"}, ал мақсатта ${r.right ? "бар" : "жоқ"}.` };
          } catch (e) { return { ok: false, msg: e.message, soft: true }; }
        }
        case "props": {
          const P = DS.relProps(ex.S, DS.parsePairs(ex.R || ""));
          const chosen = new Set($$("input[type=checkbox]:checked", box).map((c) => c.value));
          const wrong = Object.keys(PROPN).filter((k) => P[k] !== chosen.has(k));
          return wrong.length ? { ok: false, msg: `Қате белгіленген қасиет саны: ${wrong.length}. Әр қасиетті анықтамасымен қайта тексеріңіз.` } : { ok: true, msg: "Дұрыс." + (P.equivalence ? " Бұл - эквиваленттік қатынас." : P.partialOrder ? " Бұл - ішінара реттілік." : "") };
        }
        case "func": {
          const v = picked(); if (v == null) return null;
          const k = DS.funcKind(ex.X, ex.Y, DS.parsePairs(ex.pairs));
          return { ok: v === k.kind, msg: v === k.kind ? "Дұрыс" + (k.why ? ": " + k.why : ".") : "Қате. Алдымен функция екенін, сосын инъекция мен сюръекцияны бөлек тексеріңіз." };
        }
        case "order": {
          const lis = $$(".ac-order li", box);
          const order = lis.map((li) => +li.dataset.i);
          lis.forEach((li, pos) => { li.classList.toggle("good", +li.dataset.i === pos); li.classList.toggle("bad", +li.dataset.i !== pos); });
          const firstBad = order.findIndex((v, i) => v !== i);
          return firstBad < 0 ? { ok: true, msg: "Дұрыс: дәлелдеу логикалық ретпен құрылды." } : { ok: false, msg: `${firstBad + 1}-қадамнан бастап рет бұзылған (қызыл белгіленді). Әр қадам тек өзінен бұрынғыларға сүйенуі керек.` };
        }
      }
      return null;
    }
    async function checkPy() {
      const s = rec.ex[key] = rec.ex[key] || {};
      s.code = pyEd.value;
      fb.textContent = "Python тексеріп жатыр..."; fb.className = "ac-fb";
      let r;
      if (ex.type === "pytests") return checkTests(s);
      try { r = await pyJudge(pyEd.value, { mode: ex.mode, func: ex.func, tests: ex.tests, suffix: ex.suffix, files: ex.files }); }
      catch (e) { fb.textContent = PY_FAIL; fb.className = "ac-fb bad"; return; }
      s.tries = (s.tries || 0) + 1;
      if (r.ok && !s.ok) { s.ok = true; s.rev = false; s.t = Date.now(); }
      const rows = r.results.map((t) => {
        const inp = ex.mode === "func" ? `${ex.func}(${t.args.map(pyVal).join(", ")})` : `stdin: ${JSON.stringify(t.stdin || "")}`;
        if (t.passed) return `<li class="y">✓ ${esc(inp)}</li>`;
        if (t.error) return `<li class="n">✗ ${esc(inp)} → <b>${esc(t.error)}</b>${t.line ? ` (${t.line}-жол)` : ""}: ${esc(t.hint)}${t.detail ? `<br><small>${esc(t.detail)}</small>` : ""}</li>`;
        return `<li class="n">✗ ${esc(inp)} → күтілгені <code>${esc(ex.mode === "func" ? pyVal(t.expect) : t.expect)}</code>, сіздікі <code>${esc(ex.mode === "func" ? pyVal(t.got) : t.got)}</code></li>`;
      }).join("");
      fb.innerHTML = `<b>${r.passed} / ${r.total} тест өтті</b>${r.ok ? " - дұрыс!" : ""}<ul class="ac-props">${rows}</ul>`;
      fb.className = "ac-fb " + (r.ok ? "good" : "bad");
      showState(s);
      onResult();
    }
    async function checkTests(s) {
      let r;
      try { r = await pyJudgeTests(pyEd.value, { impl: ex.impl, mutants: ex.mutants, min_tests: ex.min_tests || 1 }); }
      catch (e) { fb.textContent = PY_FAIL; fb.className = "ac-fb bad"; return; }
      s.tries = (s.tries || 0) + 1;
      if (r.ok && !s.ok) { s.ok = true; s.rev = false; s.t = Date.now(); }
      let html;
      if (r.stage === "load") html = `<b>Тест коды іске қосылмады</b>: <b>${esc(r.error)}</b>${r.line ? ` (${r.line}-жол)` : ""} - ${esc(r.hint || "")}${r.detail ? `<br><small>${esc(r.detail)}</small>` : ""}`;
      else {
        const rows = (r.on_correct || []).map((t) => t.ok ? `<li class="y">✓ ${esc(t.name)} дұрыс кодта өтті</li>` : `<li class="n">✗ ${esc(t.name)} ДҰРЫС кодта құлады (${esc(t.error)}${t.detail ? ": " + esc(t.detail) : ""}) - тесттің өзі қате</li>`).join("");
        const ms = (r.mutants || []).map((m) => { const d = ex.mutants.find((x) => x.name === m.name); return `<li class="${m.killed ? "y" : "n"}">${m.killed ? "✓ ұсталды" : "✗ ұсталмады"}: ${esc(d && d.desc ? d.desc : m.name)}</li>`; }).join("");
        const head = r.stage === "count" ? `Тест саны ${r.count}, кемінде ${ex.min_tests || 1} керек. test_ деп басталатын функциялар жазыңыз.` : r.stage === "correct" ? "Кейбір тест дұрыс іске асыруда құлады." : `${(r.mutants || []).filter((m) => m.killed).length} / ${ex.mutants.length} мутант ұсталды${r.ok ? " - тесттеріңіз күшті!" : ""}`;
        html = `<b>${esc(head)}</b><ul class="ac-props">${rows}${ms}</ul>`;
      }
      fb.innerHTML = html;
      fb.className = "ac-fb " + (r.ok ? "good" : "bad");
      showState(s);
      onResult();
    }
    $(".ac-check", box).addEventListener("click", () => {
      if (ex.type === "pycode" || ex.type === "pytests") { checkPy(); return; }
      const r = evaluate();
      if (!r) { fb.textContent = "Алдымен жауап беріңіз."; fb.className = "ac-fb"; return; }
      const s = rec.ex[key] = rec.ex[key] || {};
      if (!r.soft) s.tries = (s.tries || 0) + 1;
      if (r.ok && !s.ok) { s.ok = true; s.rev = false; s.t = Date.now(); }
      fb.textContent = r.msg || "";
      fb.className = "ac-fb " + (r.ok ? "good" : "bad");
      showState(s);
      onResult();
    });
    $(".ac-reveal", box).addEventListener("click", () => {
      let ans = "";
      if (ex.type === "mc") ans = ex.options[ex.answer] + ". " + ex.why[ex.answer];
      else if (ex.type === "value") ans = b01(L.evaluate(L.parse(ex.formula), ex.env));
      else if (ex.type === "classify") ans = KIND[L.classify(ex.formula).kind];
      else if (ex.type === "argument") ans = L.validArgument(ex.premises, ex.conclusion).valid ? "Дұрыс аргумент" : "Дұрыс емес";
      else if (ex.type === "number") ans = String(ex.answer);
      else if (ex.type === "truthtable") ans = ttVars.rows.map((r) => b01(r.value)).join(" ");
      else if (ex.type === "formula") ans = ex.solution + " (басқа эквивалент жауап та қабылданады)";
      else if (ex.type === "closedform" || ex.type === "recurrence") ans = ex.solution + " (эквивалент жазылу да қабылданады)";
      else if (ex.type === "counterexample") ans = "n = " + AR.searchCounterexamples(ex, 1)[0];
      else if (ex.type === "convert" || ex.type === "encode" || ex.type === "bitop") ans = bitsKey(ex);
      else if (ex.type === "pycode" || ex.type === "pytests") { ans = "төмендегі эталон шешім (өзіңіз түсініп, қайта жазыңыз)"; const pre = document.createElement("pre"); pre.className = "ac-pseudo"; pre.textContent = ex.solution; fb.after(pre); }
      else if (ex.type === "trace") ans = traceKey(ex);
      else if (ex.type === "coutput") { ans = "төмендегі шығыс (gcc)"; const pre = document.createElement("pre"); pre.className = "ac-pseudo"; pre.textContent = ex.answer; fb.after(pre); }
      else if (ex.type === "count") ans = String(PS.run(ex.code, ex.inputs || {}).counts[ex.line] || 0);
      else if (ex.type === "setexpr") ans = DS.fmt(DS.evalSet(ex.expr, ex.sets, ex.U));
      else if (ex.type === "setid") ans = ex.solution;
      else if (ex.type === "props") { const P = DS.relProps(ex.S, DS.parsePairs(ex.R || "")); ans = Object.keys(PROPN).filter((k) => P[k]).map((k) => PROPN[k]).join(", ") || "ешқайсысы"; }
      else if (ex.type === "func") ans = FUNCN[DS.funcKind(ex.X, ex.Y, DS.parsePairs(ex.pairs)).kind];
      else if (ex.type === "order") ans = ex.steps.map((s, i) => `${i + 1}) ${s}`).join(" ");
      fb.textContent = "Жауабы: " + ans;
      fb.className = "ac-fb";
      const s = rec.ex[key] = rec.ex[key] || {};
      s.rev = true;
      showState(s);
      onResult();
    });
    return box;
  }

  // ================================================================ сабақ беті
  function lessonPage() {
    const node = $("#ac-data");
    if (!node) return;
    const data = JSON.parse(node.textContent);
    const d = load();
    const rec = lessonRec(d, data.id);
    rec.seen = Date.now();
    save(d);
    $$(".ac-lab[data-lab]").forEach((el) => lab(el, data[el.dataset.lab]));
    const all = [...data.exercises.map((e, i) => ["exercises:" + i, e]), ...data.assessment.map((e, i) => ["assessment:" + i, e])];
    const update = () => {
      const solved = all.filter(([k]) => rec.ex[k] && rec.ex[k].ok && !rec.ex[k].rev).length;
      const assessOk = data.assessment.every((_, i) => { const s = rec.ex["assessment:" + i]; return s && s.ok && !s.rev; });
      const was = rec.mastered;
      rec.score = Math.round((solved / all.length) * 100);
      if (assessOk && !rec.mastered) { rec.mastered = Date.now(); rec.review = { step: 0, due: Date.now() + INTERVALS[0] * DAY }; }
      else if (assessOk && rec.review && Date.now() >= rec.review.due) {   // қайталау уақытында қайта тапсырды
        rec.review.step = Math.min(rec.review.step + 1, INTERVALS.length - 1);
        rec.review.due = Date.now() + INTERVALS[rec.review.step] * DAY;
      }
      save(d);
      const m = $("[data-ac-mastery] b");
      if (m) m.textContent = rec.mastered ? "меңгерілді ✓" : rec.score + "%";
      if (!was && rec.mastered) {
        const n = document.createElement("p");
        n.className = "ac-fb good"; n.textContent = "Сабақ меңгерілді ✓ Қайталау " + INTERVALS[0] + " күннен кейін ұсынылады.";
        $('[data-set="assessment"]').after(n);
      }
    };
    $$(".ac-exs").forEach((box) => {
      const set = box.dataset.set;
      data[set].forEach((ex, i) => box.append(renderExercise(ex, set + ":" + i, rec, update)));
    });
    const rf = $("[data-ac-reflect]");
    if (rf) {
      data.reflection.forEach((q, i) => {
        const w = document.createElement("label");
        w.className = "ac-reflect";
        w.innerHTML = `<span>${esc(q)}</span><textarea rows="3" maxlength="2000"></textarea><small>Осы құрылғыда сақталады.</small>`;
        const ta = $("textarea", w);
        ta.value = rec.reflect[i] || "";
        let t = null;
        ta.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { rec.reflect[i] = ta.value; save(d); }, 500); });
        rf.append(w);
      });
    }
    update();
  }

  // ================================================================ лабораториялар беті
  function labPage() {
    const el = $('.ac-lab[data-lab="page"]');
    if (!el) return;
    const presets = { truthtable: { lab: "truthtable", formula: "(p → q) ∧ (q → r) → (p → r)" }, equiv: { lab: "equiv", a: "¬(p ∧ q)", b: "¬p ∨ ¬q" },
      argument: { lab: "argument", premises: ["p → q", "¬q"], conclusion: "¬p" }, normal: { lab: "normal", formula: "p ⊕ q ⊕ r" },
      tree: { lab: "tree", formula: "¬p ∨ q ∧ r → s" }, quant: { lab: "quant", domain: [1, 2, 3, 4, 5, 6, 7, 8, 9], pred: "prime" },
      search: { lab: "search", expr: "n^2 + n + 41", prop: "prime", domain: [0, 45] }, induction: { lab: "induction", term: "n^2", closed: "n(n+1)(2n+1)/6", start: 1 },
      recur: { lab: "recur", first: 1, start: 1, rule: "2a + 1", closed: "2^n - 1" },
      venn: { lab: "venn", sets: { A: [1, 2, 3, 4], B: [3, 4, 5, 6], C: [2, 4, 6, 8] }, U: [1, 2, 3, 4, 5, 6, 7, 8], expr: "(A ∪ B)' ∩ C" },
      relation: { lab: "relation", S: [1, 2, 3, 4], R: "(1,1), (2,2), (3,3), (4,4), (1,2), (2,1)" }, graph: { lab: "graph", V: [1, 2, 3, 4, 5, 6], E: "1-2, 1-3, 2-4, 2-5, 3-6" },
      func: { lab: "func", X: [1, 2, 3], Y: ["a", "b", "c"], pairs: "(1,a), (2,c), (3,b)" },
      trace: { lab: "trace", code: "a ← 84\nb ← 36\nwhile b ≠ 0 do\n  t ← b\n  b ← a mod b\n  a ← t\nend\nreturn a", inputs: {} },
      growth: { lab: "growth", fns: ["log2(n)", "n", "n*log2(n)", "n^2", "2^n"], max: 30 },
      base: { lab: "base", value: "2026", from: 10 }, bitpanel: { lab: "bitpanel", a: "0b11001010", b: "0b10100110", op: "^", width: 8 },
      utf8: { lab: "utf8", text: "Қазақ тілі 😀" }, float: { lab: "float", value: "0.1" } };
    const show = (k) => {
      $$("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === k)));
      el.className = "ac-lab ac-lab-big";
      lab(el, presets[k]);
    };
    $$("[data-tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
    show("truthtable");
  }

  // ================================================================ басты бет: прогресс, ұсыныс, экспорт
  function homePage() {
    const box = $("[data-ac-progress]");
    if (!box) return;
    const d = load();
    const done = $$("li.done[data-lid]");
    const ids = done.map((li) => li.dataset.lid);
    done.forEach((li) => { const r = d.lessons[li.dataset.lid]; if (r) li.classList.add(r.mastered ? "mastered" : "started"); });
    const mastered = ids.filter((id) => d.lessons[id] && d.lessons[id].mastered);
    const due = ids.filter((id) => { const r = d.lessons[id]; return r && r.review && Date.now() >= r.review.due; });
    const next = done.find((li) => !(d.lessons[li.dataset.lid] && d.lessons[li.dataset.lid].mastered));
    const link = (id) => { const a = $(`li[data-lid="${id}"] a`); return a ? `<a href="${a.getAttribute("href")}">${esc(a.textContent)}</a>` : esc(id); };
    box.innerHTML = `<div class="ac-prog"><p>Меңгерілген: <b>${mastered.length}</b> / ${ids.length} дайын сабақ</p>
      <div class="ac-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${ids.length}" aria-valuenow="${mastered.length}"><i style="width:${ids.length ? (mastered.length / ids.length) * 100 : 0}%"></i></div>
      ${next ? `<p>Келесі ұсыныс: ${link(next.dataset.lid)} <small>(алғышарттары ретімен)</small></p>` : ids.length ? "<p>Дайын сабақтардың бәрі меңгерілді ✓</p>" : ""}
      ${due.length ? `<p>Қайталау уақыты келді: ${due.map(link).join(", ")}</p>` : ""}
      <p class="ac-note">Прогресс осы браузерде сақталады: браузер деректерін тазаласаңыз, ол өшеді. Сақтық көшірме жасаңыз. AO17 аккаунтымен кірсеңіз, прогресс серверге де синхрондалады.</p>
      <p><button type="button" class="btn secondary" data-exp>Прогресті жүктеп алу (JSON)</button> <label class="btn secondary ac-imp">Прогресті жүктеу<input type="file" accept="application/json" hidden></label> <span data-imp-msg></span></p></div>`;
    $("[data-exp]", box).addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(load(), null, 1)], { type: "application/json" }));
      a.download = "ao17-academy-progress.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $(".ac-imp input", box).addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const msg = $("[data-imp-msg]", box);
      try {
        const x = JSON.parse(await f.text());
        if (!x || x.v !== VERSION || typeof x.lessons !== "object") throw new Error("файл AO17 прогресі емес не нұсқасы басқа");
        const cur = load();
        Object.entries(x.lessons).forEach(([id, r]) => { if (!cur.lessons[id] || (r.mastered && !cur.lessons[id].mastered) || (r.score || 0) > (cur.lessons[id].score || 0)) cur.lessons[id] = r; });
        save(cur);
        msg.textContent = "Жүктелді ✓"; setTimeout(() => location.reload(), 600);
      } catch (err) { msg.textContent = "Қате: " + err.message; }
    });
  }

  // ================================================================ білім картасы
  function mapPage() {
    const box = $("[data-ac-map]"), node = $("#ac-map-data");
    if (!box || !node) return;
    const mods = JSON.parse(node.textContent);
    const d = load();
    const ls = (id) => d.lessons[id];
    const state = (m) => {
      const done = m.lessons.filter((x) => x.done);
      if (!done.length) return "plan";
      if (done.every((x) => ls(x.id) && ls(x.id).mastered) && done.length === m.lessons.length) return "mastered";
      if (done.some((x) => ls(x.id))) return "started";
      return "ready";
    };
    // тереңдік: алғышарттардың ең ұзын тізбегі
    const depth = {};
    const dep = (id) => depth[id] ?? (depth[id] = Math.max(0, ...(mods.find((m) => m.id === id).pre.map((p) => dep(p) + 1))));
    mods.forEach((m) => dep(m.id));
    const cols = {};
    mods.forEach((m) => (cols[depth[m.id]] = cols[depth[m.id]] || []).push(m));
    const W = 170, H = 70, GX = 40, GY = 26;
    const maxD = Math.max(...Object.keys(cols).map(Number));
    const pos = {};
    Object.entries(cols).forEach(([c, list]) => list.forEach((m, i) => (pos[m.id] = { x: 10 + c * (W + GX), y: 10 + i * (H + GY) })));
    const width = 20 + (maxD + 1) * (W + GX), height = 20 + Math.max(...Object.values(cols).map((l) => l.length)) * (H + GY);
    const edges = mods.flatMap((m) => m.pre.map((p) => { const a = pos[p], b = pos[m.id]; return `<path d="M${a.x + W} ${a.y + H / 2} C${a.x + W + GX / 2} ${a.y + H / 2}, ${b.x - GX / 2} ${b.y + H / 2}, ${b.x} ${b.y + H / 2}" />`; })).join("");
    const nodes = mods.map((m) => { const p = pos[m.id], s = state(m), done = m.lessons.filter((x) => x.done).length, mast = m.lessons.filter((x) => ls(x.id) && ls(x.id).mastered).length;
      return `<g class="mn ${s}" tabindex="0" role="button" data-m="${m.id}" aria-label="${esc(m.kk)}: ${mast} меңгерілді, ${done} дайын, 10 жоспарда" transform="translate(${p.x} ${p.y})"><rect width="${W}" height="${H}" rx="10"/><text x="12" y="24" class="t1">${esc(m.id.slice(1))} · ${esc(m.kk.length > 18 ? m.kk.slice(0, 17) + "…" : m.kk)}</text><text x="12" y="44" class="t2">${esc(m.en)}</text><text x="12" y="60" class="t3">${done ? `${mast} меңгерілді · ${done}/10 дайын` : "жоспарда · 0/10 дайын"}</text></g>`; }).join("");
    box.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Level I модульдерінің алғышарттар картасы"><g class="edges">${edges}</g>${nodes}</svg>`;
    const det = $("[data-ac-map-detail]");
    const open = (id) => {
      const m = mods.find((x) => x.id === id);
      det.innerHTML = `<h2>${esc(m.kk)} <small>${esc(m.en)}</small></h2><p>Алғышарт модульдер: ${m.pre.map((p) => esc(mods.find((x) => x.id === p).kk)).join(", ") || "жоқ"}</p><ol class="ac-mlist">${m.lessons.map((x) => { const r = ls(x.id); const c = !x.done ? "plan" : r && r.mastered ? "mastered" : r ? "started" : "ready";
        return `<li class="${c}">${x.done ? `<a href="${x.href}">${esc(x.t)}</a>` : esc(x.t)} <small>${c === "plan" ? "жоспарда" : c === "mastered" ? "меңгерілді" : c === "started" ? (r.score || 0) + "%" : "ашық"}</small></li>`; }).join("")}</ol>`;
    };
    $$("g.mn", box).forEach((g) => { g.addEventListener("click", () => open(g.dataset.m)); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(g.dataset.m); } }); });
    open("m01");
  }

  // ---------- сабақ бетінің анимациялық түсіндіруі (барлық сабақта: derivation қадамдары, дәлелдеу сөйлемдері) ----------
  const REDUCED = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function animPlayers() {
    $$("[data-anim]").forEach((box) => {
      const ol = $("ol", box), items = $$("li", ol);
      if (!items.length) return;
      box.classList.add("on");
      let k = REDUCED() ? items.length : 0, timer = null;
      const bar = document.createElement("div");
      bar.className = "ac-anim-ctl";
      bar.innerHTML = `<button type="button" class="btn gold" data-a="play">▶ Ойнату</button><button type="button" class="btn secondary" data-a="prev" aria-label="Алдыңғы қадам">←</button><button type="button" class="btn secondary" data-a="next" aria-label="Келесі қадам">→</button><button type="button" class="btn secondary" data-a="all">Бәрін көрсету</button><span class="ac-anim-n" aria-live="polite"></span><span class="ac-anim-p" aria-hidden="true"><i></i></span>`;
      box.append(bar);
      const play = $("[data-a=play]", bar);
      const show = () => {
        items.forEach((li, i) => { li.classList.toggle("shown", i < k); li.classList.toggle("cur", i === k - 1); });
        $(".ac-anim-n", bar).textContent = `${k} / ${items.length} қадам`;
        $(".ac-anim-p i", bar).style.width = (100 * k / items.length) + "%";
        box.classList.toggle("done", k === items.length);
      };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } play.textContent = k >= items.length ? "↺ Қайта ойнату" : "▶ Ойнату"; };
      const step = (d) => { k = Math.max(0, Math.min(items.length, k + d)); show(); if (k >= items.length) stop(); };
      play.addEventListener("click", () => {
        if (timer) { stop(); return; }
        if (k >= items.length) k = 0;
        step(1);
        if (k >= items.length) return;
        play.textContent = "❚❚ Тоқтату";
        timer = setInterval(() => { if (k >= items.length || !box.isConnected) stop(); else step(1); }, 2600);
      });
      $("[data-a=prev]", bar).addEventListener("click", () => { stop(); step(-1); stop(); });
      $("[data-a=next]", bar).addEventListener("click", () => { stop(); step(1); stop(); });
      $("[data-a=all]", bar).addEventListener("click", () => { stop(); k = items.length; show(); stop(); });
      box.tabIndex = 0;
      box.setAttribute("aria-label", "Анимациялық түсіндіру: → келесі қадам, ← алдыңғы");
      box.addEventListener("keydown", (e) => {
        if (e.target !== box) return;
        if (e.key === "ArrowRight") { e.preventDefault(); stop(); step(1); stop(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); step(-1); stop(); }
      });
      // экранға бірінші рет кіргенде бірінші қадам өзі ашылады (бір рет; қозғалыс азайтылса - бәрі бірден көрінеді)
      if (!REDUCED() && "IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); if (k === 0) { step(1); stop(); } } }, { threshold: 0.4 });
        io.observe(box);
      }
      show(); stop();
    });
  }
  // дәлелдеуді сөйлем-сөйлеммен оқу: әр сөйлем кезекпен жанады, ∎ - соңында
  function proofSteppers() {
    $$(".ac-proof").forEach((card) => {
      const ps = $$("p", card);
      if (!ps.length) return;
      const parts = [];
      ps.forEach((p) => {
        const pieces = p.innerHTML.split(/(?<=[.!?∎])\s+(?=[A-ZА-ЯӘҒҚҢӨҰҮҺІ(«<0-9])/u);
        if (pieces.length < 2) { parts.push(p); return; }
        p.innerHTML = pieces.map((x) => `<span class="ac-ps">${x}</span>`).join(" ");
        parts.push(...$$(".ac-ps", p));
      });
      if (parts.length < 3) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn secondary ac-proof-btn"; b.textContent = "Қадамдап оқу";
      $("h4", card).after(b);
      let k = -1;
      b.addEventListener("click", () => {
        if (k === -1) card.classList.add("stepping");
        k++;
        parts.forEach((x, i) => { x.classList.toggle("lit", i <= k); x.classList.toggle("now", i === k); });
        if (k >= parts.length - 1) { b.textContent = "Дәлелдеу толық ашылды ∎"; b.disabled = true; card.classList.add("proved"); }
        else b.textContent = `Келесі сөйлем (${k + 1}/${parts.length})`;
      });
    });
  }
  // мазмұн: оқып жатқан бөлім белгіленеді, оқылғандары белгі алады
  function tocSpy() {
    const links = $$(".ac-toc li a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        seen.add(e.target.id);
        links.forEach((a) => { a.classList.remove("on"); a.removeAttribute("aria-current"); });
        const a = map.get(e.target.id);
        if (a) { a.classList.add("on"); a.setAttribute("aria-current", "location"); }
      });
      map.forEach((a, id) => a.classList.toggle("read", seen.has(id)));
    }, { rootMargin: "-20% 0px -70% 0px" });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  const run = () => { lessonPage(); labPage(); homePage(); mapPage(); if ($("[data-lesson]")) { animPlayers(); proofSteppers(); tocSpy(); } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  window.AOAcademy = { checkFormula, load, KEY, VERSION };
})();
