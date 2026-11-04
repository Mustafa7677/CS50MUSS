/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 CS Universe: сабақ беті, логика зертханалары, тапсырма тексеру, меңгеру, қайталау, білім картасы.
// Барлық тексеру браузерде, AOLogic қозғалтқышымен (assets/js/academy-logic.js). Сыртқы AI/API жоқ.
// Прогресс: localStorage «cs50kz:academy» (нұсқасы v). Кірген оқушыда ao.js оны серверге өзі синхрондайды.
(function () {
  "use strict";
  const L = window.AOLogic;
  const AR = window.AOArith;
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
    else if (ex.type === "counterexample") body = `<label class="ac-num"><span>Қарсы мысал n</span><input type="number" inputmode="numeric" step="1"></label>`;
    else if (ex.type === "closedform") body = `<p class="ac-formula">Σ f(i), i = ${ex.start}..n, мұнда f(n) = ${esc(ex.term)}</p>`;
    else if (ex.type === "recurrence") body = `<p class="ac-formula">a(${ex.start}) = ${ex.first}, a(n) = ${esc(ex.rule.replace(/a/g, "a(n−1)"))}</p>`;
    else if (ex.type === "order") body = `<ol class="ac-order">${shuffled(ex.steps, key + ex.q).map((i) => `<li data-i="${i}"><span>${esc(ex.steps[i])}</span><button type="button" class="ac-up" aria-label="Жоғары">↑</button><button type="button" class="ac-down" aria-label="Төмен">↓</button></li>`).join("")}</ol>`;
    else if (ex.type === "truthtable") body = `<p class="ac-formula">${esc(ex.formula)}</p><div class="ac-tt-wrap"><table class="ac-tt ac-fill"><thead><tr>${ttVars.vars.map((v) => `<th>${esc(v)}</th>`).join("")}<th class="res">мәні</th></tr></thead><tbody>${ttVars.rows.map((r, i) => `<tr>${ttVars.vars.map((v) => `<td>${b01(r.env[v])}</td>`).join("")}<td class="res"><button type="button" class="ac-cell" data-row="${i}" aria-label="${i + 1}-жолдың мәні">?</button></td></tr>`).join("")}</tbody></table></div><p class="ac-note">Ұяшықты басыңыз: ? → 0 → 1.</p>`;
    box.innerHTML = `<p class="ac-qt">${esc(ex.q)}</p>${body}<div class="ac-qa"><button type="button" class="btn gold ac-check">Тексеру</button><button type="button" class="btn secondary ac-hint">Кеңес</button><button type="button" class="btn secondary ac-reveal" hidden>Жауабын көрсету</button><span class="ac-st"></span></div><div class="ac-hints"></div><p class="ac-fb" role="status" aria-live="polite"></p>`;
    let fi = null;
    if (ex.type === "formula") { fi = formulaInput("", "Сіздің өрнегіңіз", null); box.insertBefore(fi, $(".ac-qa", box)); }
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
    $(".ac-check", box).addEventListener("click", () => {
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
      recur: { lab: "recur", first: 1, start: 1, rule: "2a + 1", closed: "2^n - 1" } };
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

  const run = () => { lessonPage(); labPage(); homePage(); mapPage(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  window.AOAcademy = { checkFormula, load, KEY, VERSION };
})();
