/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
 * «Математика» курсының қозғалтқышы. Vanilla JS; формула көрсету - жергілікті KaTeX (assets/vendor/katex, MIT); басқа кітапхана жоқ, сыртқы қызмет жоқ.
 *
 * 1) KaTeX: бет жүктелгенде $...$ және $$...$$ автоматты рендерленеді; қате болса бет бұзылмайды (мәтін қалады).
 * 2) Қауіпсіз өрнек парсері (eval / Function ЖОҚ): токенайзер + рекурсивті түсу + AST. Сандық нүктелерде эквиваленттікті тексереді.
 * 3) Интерактив есептер: num, expr, interval, choice, tf, matrix, match, order, reveal, param (docs/MATH-COURSE-GUIDE.md).
 *    Әр есепте hint -> қадамдар -> жауап ("sol") біртіндеп ашылады. Параметрлік есептер: seeded RNG, "Жаңа нұсқа".
 * 4) Ортақ беттер (курс беті, формулалар, сөздік, жаттықтырғыш): [data-math-app].
 * Сақтау: cs50kz:math:ex (нәтиже), cs50kz:math:seed, cs50kz:math:known, cs50kz:math:practice; check:<бет жолы>:<id> = [true].
 * Node-та да жүктеледі (tools/math_verify.py парсерді sympy-мен салыстырады): module.exports.
 */
(function (root) {
  "use strict";
  var HAS_DOM = typeof document !== "undefined" && typeof window !== "undefined";
  if (HAS_DOM && window.CS50KZ_MATH) return;

  /* =====================================================================
   *  Көмекшілер
   * ===================================================================== */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* жеке режим */ } }
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* Мәтінде тек осы теңдерге рұқсат; қалғаны экрандалады. Формулалар ($...$) экрандалмайды-ақ қауіпсіз: auto-render мәтін түйінінен оқиды. */
  var plainText = function (s) { return String(s).replace(/<[^>]+>/g, "").replace(/\$/g, "").replace(/\s+/g, " ").trim() || "нұсқа"; };
  /* Дерек мәтінінде HTML мнемоникасы (&lt; &gt; &amp;) жазылса, оны таңбаға қайтарамыз: әйтпесе esc() оны екі рет экрандап, KaTeX «&lt;»-ды қате деп көрсетеді */
  var unent = function (s) { return String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); };
  var rich = function (s) { return esc(unent(s)).replace(/&lt;(\/?)(b|i|em|strong|code|sub|sup|u|small)&gt;/g, "<$1$2>").replace(/&lt;br\s*\/?&gt;/g, "<br>"); };
  function h(tag, attrs) {
    var e = document.createElement(tag), k, kids = Array.prototype.slice.call(arguments, 2);
    for (k in attrs || {}) {
      var v = attrs[k];
      if (v === false || v == null) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    (function add(list) {
      for (var n = 0; n < list.length; n++) {
        var c = list[n];
        if (c == null || c === false) continue;
        if (Array.isArray(c)) add(c); else e.append(c.nodeType ? c : document.createTextNode(c));
      }
    })(kids);
    return e;
  }
  var K = function () { return (HAS_DOM && window.CS50KZ) || {}; };
  var UID = 0;
  var cls = function (el, c, on) { el.classList.toggle(c, !!on); };

  /* mulberry32: seeded RNG */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57, i, c;
    for (i = 0; i < str.length; i++) { c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    return (h1 >>> 0);
  }
  function shuffle(a, rnd) {
    var r = a.slice(), i, j, t;
    rnd = rnd || Math.random;
    for (i = r.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }

  /* =====================================================================
   *  KaTeX
   * ===================================================================== */
  var DELIMS = [
    { left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true },
    { left: "$", right: "$", display: false }, { left: "\\(", right: "\\)", display: false }
  ];
  var katexMissing = false;
  function renderMath(el) {
    if (!HAS_DOM || !el) return;
    try {
      if (window.renderMathInElement && window.katex) {
        window.renderMathInElement(el, {
          delimiters: DELIMS, throwOnError: false, strict: "ignore", errorColor: "currentColor", trust: false,
          ignoredClasses: ["no-math"], output: "htmlAndMathml"
        });
      } else if (!katexMissing && document.querySelector('script[src*="katex"]')) {
        katexMissing = true; // KaTeX бетте күтіледі, бірақ жүктелмеді (желі/кэш қатесі)
        document.body.classList.add("math-no-katex");
      }
    } catch (e) { /* формула көрсетілмесе - мәтін қалады, бет бұзылмайды */ }
    markScrollable(el);
  }
  /* Ұзын display-формула өз ішінде айналады: пернетақтамен де айналдыруға болсын (WCAG: scrollable-region-focusable) */
  function markScrollable(root) {
    if (!HAS_DOM || !root || !root.querySelectorAll) return;
    root.querySelectorAll(".katex-display").forEach(function (d) {
      if (d.scrollWidth > d.clientWidth + 1) {
        if (!d.hasAttribute("tabindex")) { d.setAttribute("tabindex", "0"); d.setAttribute("role", "group"); d.setAttribute("aria-label", "Формула (көлденең айналады)"); }
      } else if (d.getAttribute("aria-label") === "Формула (көлденең айналады)") { d.removeAttribute("tabindex"); d.removeAttribute("role"); d.removeAttribute("aria-label"); }
    });
  }
  if (HAS_DOM) {
    var msT = 0;
    window.addEventListener("resize", function () { clearTimeout(msT); msT = setTimeout(function () { markScrollable(document); }, 200); });
  }
  /* Бір TeX жолын элементке рендерлеу (алдын ала көру үшін) */
  function renderTeX(el, tex, display) {
    try {
      if (window.katex) { window.katex.render(tex, el, { throwOnError: false, strict: "ignore", displayMode: !!display, errorColor: "currentColor", trust: false }); return true; }
    } catch (e) { /* ештеңе */ }
    el.textContent = tex;
    return false;
  }

  /* =====================================================================
   *  Қауіпсіз өрнек парсері
   * ===================================================================== */
  function PErr(msg) { this.message = msg; this.isParseError = true; }
  PErr.prototype = Object.create(Error.prototype);

  var MAX_LEN = 240, MAX_TOKENS = 400, MAX_DEPTH = 60;
  var CONSTS = { pi: Math.PI, e: Math.E, oo: Infinity };
  var FUNC1 = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, cot: function (x) { return 1 / Math.tan(x); },
    sec: function (x) { return 1 / Math.cos(x); }, csc: function (x) { return 1 / Math.sin(x); },
    asin: Math.asin, acos: Math.acos, atan: Math.atan, acot: function (x) { return Math.PI / 2 - Math.atan(x); },
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    exp: Math.exp, ln: Math.log, lg: Math.log10, lb: Math.log2, sqrt: Math.sqrt, cbrt: Math.cbrt,
    abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round, trunc: Math.trunc,
    erf: erf, Phi: function (z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  };
  /* Қате функциясы erf(x): |x| < 3 үшін Тейлор қатары, 3 ≤ |x| ≤ 6 үшін erfc-тің тізбекті бөлшегі; салыстырмалы қателігі ~1e-14 */
  function erf(x) {
    var s = x < 0 ? -1 : 1, sum, term, n, f, k;
    x = Math.abs(x);
    if (!(x === x)) return NaN;
    if (x < 3) {
      sum = x; term = x; n = 0;
      while (Math.abs(term) > 1e-17 * Math.abs(sum) && n < 200) { n++; term *= -x * x / n; sum += term / (2 * n + 1); }
      return s * 2 / Math.sqrt(Math.PI) * sum;
    }
    if (x > 6) return s;
    f = 0;
    for (k = 80; k >= 1; k--) f = (k / 2) / (x + f);
    return s * (1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f));
  }
  var ALIAS = { tg: "tan", ctg: "cot", arcsin: "asin", arccos: "acos", arctg: "atan", arctan: "atan", arcctg: "acot", arccot: "acot", sh: "sinh", ch: "cosh", th: "tanh" };
  var FUNCN = { log: 1, min: 1, max: 1, root: 1, atan2: 1, pow: 1 };
  function isFunc(n) { return Object.prototype.hasOwnProperty.call(FUNC1, n) || Object.prototype.hasOwnProperty.call(ALIAS, n) || Object.prototype.hasOwnProperty.call(FUNCN, n); }
  function canon(n) { return Object.prototype.hasOwnProperty.call(ALIAS, n) ? ALIAS[n] : n; }

  function normalizeInput(src) {
    return String(src)
      .replace(/[−‒–—]/g, "-").replace(/[×⋅·∙]/g, "*").replace(/[÷∕]/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3").replace(/¹/g, "^1").replace(/√/g, "sqrt").replace(/π/g, "pi")
      .replace(/∞/g, "oo").replace(/\*\*/g, "^").replace(/[{]/g, "(").replace(/[}]/g, ")")
      .replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=");
  }

  function tokenize(src, opts) {
    var s = normalizeInput(src), toks = [], i = 0, m, c;
    /* opts.long: автор жазған визуализация өрнегі (сенімді мазмұн, мысалы Фурье дербес қосындысы); оқушы енгізуіне шек сол күйі */
    var long = !!(opts && opts.long);
    if (s.length > (long ? 4000 : MAX_LEN)) throw new PErr("Өрнек тым ұзын.");
    while (i < s.length) {
      c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(s[i + 1] || ""))) {
        m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+(?![A-Za-z]))?/.exec(s.slice(i));
        toks.push({ t: "num", v: parseFloat(m[0]) }); i += m[0].length; continue;
      }
      if (/[A-Za-z]/.test(c)) {
        m = /^[A-Za-z]+(?:_[A-Za-z0-9]+)?/.exec(s.slice(i));
        var md = /^[A-Za-z]+\d+/.exec(s.slice(i)); /* atan2 сияқты атауында сан бар функция: әйтпесе «atan·2» болып бөлінеді */
        if (md && (FUNCN.hasOwnProperty(md[0]) || FUNC1.hasOwnProperty(md[0]))) m = md;
        toks.push({ t: "id", v: m[0] }); i += m[0].length; continue;
      }
      m = /^(<=|>=|==|!=|&&|\|\||[-+*\/^()!,|<>])/.exec(s.slice(i));
      if (m) {
        if (!(opts && opts.cmp) && /^(<=|>=|==|!=|&&|\|\||<|>)$/.test(m[0])) throw new PErr("Салыстыру белгісі мұнда қолданылмайды: " + m[0]);
        toks.push({ t: "op", v: m[0] }); i += m[0].length; continue;
      }
      if (c === "=") throw new PErr("«=» белгісі мұнда керек емес (тек өрнектің өзін жазыңыз).");
      throw new PErr("Түсініксіз таңба: «" + c + "».");
    }
    if (toks.length > (long ? 4000 : MAX_TOKENS)) throw new PErr("Өрнек тым күрделі.");
    return toks;
  }

  /* Белгісіз сөзді білінетін бөліктерге бөлу: "xsin" -> x, sin(...); "pix" -> pi, x */
  function splitIdent(name, vars) {
    var memo = {};
    function known(p) { return vars.indexOf(p) >= 0 || Object.prototype.hasOwnProperty.call(CONSTS, p) || isFunc(p); }
    function go(from) {
      if (from === name.length) return [];
      if (memo[from] !== undefined) return memo[from];
      var best = null, len;
      for (len = name.length - from; len >= 1; len--) {
        var piece = name.slice(from, from + len);
        if (!known(piece)) continue;
        if (isFunc(piece) && from + len !== name.length) continue; // функция тек соңғы бөлік (одан кейін жақша келеді)
        var rest = go(from + len);
        if (rest) { best = [piece].concat(rest); break; }
      }
      memo[from] = best;
      return best;
    }
    return go(0);
  }

  function parse(src, opts) {
    opts = opts || {};
    var vars = opts.vars || ["x"];
    var toks = tokenize(src, opts), p = 0, depth = 0, absDepth = 0;
    var peek = function () { return toks[p]; };
    var isOp = function (v) { var t = toks[p]; return t && t.t === "op" && t.v === v; };
    var eat = function (v) { if (!isOp(v)) throw new PErr("Күтілген белгі: «" + v + "»."); p++; };
    var guard = function () { if (++depth > MAX_DEPTH) throw new PErr("Жақша тым терең."); };

    function parseOr() {
      var l = parseAnd();
      while (isOp("||")) { p++; l = { t: "bin", op: "||", l: l, r: parseAnd() }; }
      return l;
    }
    function parseAnd() {
      var l = parseEq();
      while (isOp("&&")) { p++; l = { t: "bin", op: "&&", l: l, r: parseEq() }; }
      return l;
    }
    function parseEq() {
      var l = parseRel();
      while (isOp("==") || isOp("!=")) { var op = toks[p++].v; l = { t: "bin", op: op, l: l, r: parseRel() }; }
      return l;
    }
    function parseRel() {
      var l = parseAdd();
      while (isOp("<") || isOp(">") || isOp("<=") || isOp(">=")) { var op = toks[p++].v; l = { t: "bin", op: op, l: l, r: parseAdd() }; }
      return l;
    }
    function parseAdd() {
      var l = parseMul();
      while (isOp("+") || isOp("-")) { var op = toks[p++].v; l = { t: "bin", op: op, l: l, r: parseMul() }; }
      return l;
    }
    function startsPrimary() {
      var t = peek();
      if (!t) return false;
      if (t.t === "num" || t.t === "id") return true;
      if (t.t === "op" && t.v === "(") return true;
      if (t.t === "op" && t.v === "|" && absDepth === 0) return true;
      return false;
    }
    function parseMul() {
      var l = parseUnary();
      for (;;) {
        if (isOp("*") || isOp("/")) { var op = toks[p++].v; l = { t: "bin", op: op, l: l, r: parseUnary() }; }
        else if (startsPrimary()) {
          if (l.t === "num" && peek().t === "num") throw new PErr("Екі санның арасында амал белгісі жоқ.");
          l = { t: "bin", op: "*", l: l, r: parsePow(), imp: true };
        } else break;
      }
      return l;
    }
    function parseUnary() {
      if (isOp("-")) { p++; guard(); var x = parseUnary(); depth--; return { t: "neg", x: x }; }
      if (isOp("+")) { p++; return parseUnary(); }
      return parsePow();
    }
    function parsePow() {
      var base = parsePostfix();
      if (isOp("^")) {
        p++; guard();
        var ex = parseExpUnary();
        depth--;
        return { t: "bin", op: "^", l: base, r: ex };
      }
      return base;
    }
    function parseExpUnary() {
      if (isOp("-")) { p++; return { t: "neg", x: parseExpUnary() }; }
      if (isOp("+")) { p++; return parseExpUnary(); }
      return parsePow();
    }
    function parsePostfix() {
      var x = parsePrimary();
      while (isOp("!")) { p++; x = { t: "fact", x: x }; }
      return x;
    }
    function callArgs() {
      eat("(");
      guard();
      var args = [parseOrTop()];
      while (isOp(",")) { p++; args.push(parseOrTop()); }
      eat(")");
      depth--;
      return args;
    }
    function parseOrTop() { return opts.cmp ? parseOr() : parseAdd(); }
    function makeCall(name, powExp) {
      var f = canon(name), args;
      if (!isOp("(")) throw new PErr("Функция аргументін жақшамен жазыңыз: " + name + "(...).");
      args = callArgs();
      if (Object.prototype.hasOwnProperty.call(FUNC1, f)) { if (args.length !== 1) throw new PErr(name + " функциясы бір аргумент алады."); }
      else if (f === "log") { if (args.length > 2) throw new PErr("log(x) не log(x, негіз)."); }
      else if (f === "atan2" || f === "root" || f === "pow") { if (args.length !== 2) throw new PErr(name + " екі аргумент алады."); }
      var node = { t: "call", f: f, a: args };
      if (powExp) node = { t: "bin", op: "^", l: node, r: powExp };
      return node;
    }
    function resolveIdent(name) {
      // 1) функция; 2) айнымалы; 3) тұрақты; 4) бөліктеу
      var powExp = null;
      if (isFunc(name)) {
        if (isOp("^")) { // sin^2(x)
          p++; powExp = parseExpUnaryAtom();
        }
        return makeCall(name, powExp);
      }
      if (vars.indexOf(name) >= 0) return { t: "var", n: name };
      if (Object.prototype.hasOwnProperty.call(CONSTS, name) && !(name === "oo" && !opts.allowInf)) return { t: "const", n: name, v: CONSTS[name] };
      var parts = splitIdent(name, vars);
      if (parts && parts.length > 1) {
        var node = null;
        for (var i = 0; i < parts.length; i++) {
          var pc = parts[i], nd;
          if (isFunc(pc)) nd = makeCall(pc, null);
          else if (vars.indexOf(pc) >= 0) nd = { t: "var", n: pc };
          else nd = { t: "const", n: pc, v: CONSTS[pc] };
          node = node ? { t: "bin", op: "*", l: node, r: nd, imp: true } : nd;
        }
        return node;
      }
      throw new PErr(/^[a-z]$/i.test(name) ? "Белгісіз айнымалы «" + name + "». Рұқсат етілген: " + (vars.join(", ") || "-") + "." : "Белгісіз сөз «" + name + "».");
    }
    function parseExpUnaryAtom() { // sin^2(x): дәреже көрсеткіші - сан не жақшалы өрнек
      var neg = false;
      if (isOp("-")) { p++; neg = true; }
      var t = peek(), node;
      if (t && t.t === "num") { p++; node = { t: "num", v: t.v }; }
      else if (isOp("(")) { p++; guard(); node = parseOrTop(); eat(")"); depth--; }
      else throw new PErr("Дәреже көрсеткішін санмен не жақшамен жазыңыз.");
      return neg ? { t: "neg", x: node } : node;
    }
    function parsePrimary() {
      var t = peek();
      if (!t) throw new PErr("Өрнек аяқталмады.");
      if (t.t === "num") { p++; return { t: "num", v: t.v }; }
      if (t.t === "id") { p++; return resolveIdent(t.v); }
      if (t.t === "op" && t.v === "(") { p++; guard(); var e = parseOrTop(); eat(")"); depth--; return e; }
      if (t.t === "op" && t.v === "|") {
        p++; absDepth++; guard();
        var inner = parseAdd();
        if (!isOp("|")) throw new PErr("Модуль белгісі жабылмады: |...|.");
        p++; absDepth--; depth--;
        return { t: "call", f: "abs", a: [inner] };
      }
      throw new PErr("Күтпеген белгі: «" + t.v + "».");
    }

    if (!toks.length) throw new PErr("Өрнек бос.");
    var ast = opts.cmp ? parseOr() : parseAdd();
    if (p < toks.length) throw new PErr("Артық белгі: «" + toks[p].v + "».");
    return ast;
  }

  function factorial(n) {
    if (!(n >= 0) || n !== Math.floor(n) || n > 170) return NaN;
    var r = 1, i;
    for (i = 2; i <= n; i++) r *= i;
    return r;
  }
  /* AST -> JS closure (eval жоқ). env: {x:..., a:...} */
  function compile(ast) {
    switch (ast.t) {
      case "num": return function () { return ast.v; };
      case "const": return function () { return ast.v; };
      case "var": return function (e) { var v = e[ast.n]; return v === undefined ? NaN : v; };
      case "neg": { var cx = compile(ast.x); return function (e) { return -cx(e); }; }
      case "fact": { var fx = compile(ast.x); return function (e) { return factorial(fx(e)); }; }
      case "bin": {
        var l = compile(ast.l), r = compile(ast.r);
        switch (ast.op) {
          case "+": return function (e) { return l(e) + r(e); };
          case "-": return function (e) { return l(e) - r(e); };
          case "*": return function (e) { return l(e) * r(e); };
          case "/": return function (e) { return l(e) / r(e); };
          case "^": return function (e) { return Math.pow(l(e), r(e)); };
          case "<": return function (e) { return l(e) < r(e) ? 1 : 0; };
          case ">": return function (e) { return l(e) > r(e) ? 1 : 0; };
          case "<=": return function (e) { return l(e) <= r(e) + 1e-12 ? 1 : 0; };
          case ">=": return function (e) { return l(e) >= r(e) - 1e-12 ? 1 : 0; };
          case "==": return function (e) { return Math.abs(l(e) - r(e)) <= 1e-9 * Math.max(1, Math.abs(l(e))) ? 1 : 0; };
          case "!=": return function (e) { return Math.abs(l(e) - r(e)) > 1e-9 * Math.max(1, Math.abs(l(e))) ? 1 : 0; };
          case "&&": return function (e) { return l(e) && r(e) ? 1 : 0; };
          case "||": return function (e) { return l(e) || r(e) ? 1 : 0; };
        }
        throw new PErr("Белгісіз амал.");
      }
      case "call": {
        var args = ast.a.map(compile), f = ast.f;
        if (Object.prototype.hasOwnProperty.call(FUNC1, f)) { var fn = FUNC1[f], a0 = args[0]; return function (e) { return fn(a0(e)); }; }
        if (f === "log") return args.length === 1 ? function (e) { return Math.log(args[0](e)); } : function (e) { return Math.log(args[0](e)) / Math.log(args[1](e)); };
        if (f === "min") return function (e) { return Math.min.apply(null, args.map(function (a) { return a(e); })); };
        if (f === "max") return function (e) { return Math.max.apply(null, args.map(function (a) { return a(e); })); };
        if (f === "atan2") return function (e) { return Math.atan2(args[0](e), args[1](e)); };
        if (f === "pow") return function (e) { return Math.pow(args[0](e), args[1](e)); };
        if (f === "root") return function (e) { var n = args[0](e), v = args[1](e); return n % 2 === 1 && v < 0 ? -Math.pow(-v, 1 / n) : Math.pow(v, 1 / n); };
        throw new PErr("Белгісіз функция: " + f);
      }
    }
    throw new PErr("Белгісіз түйін.");
  }
  function compileSrc(src, opts) {
    var ast = parse(src, opts), fn = compile(ast);
    fn.ast = ast;
    return fn;
  }

  /* AST -> TeX (алдын ала көру үшін) */
  var TEXF = { asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan", acot: "\\operatorname{arccot}", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh", ln: "\\ln", lg: "\\lg", lb: "\\operatorname{lb}", sin: "\\sin", cos: "\\cos", tan: "\\tan", cot: "\\cot", sec: "\\sec", csc: "\\csc", exp: "\\exp", sign: "\\operatorname{sgn}" };
  function numTex(v) {
    if (v === Infinity) return "\\infty";
    var s = String(v);
    if (/e/.test(s)) { var m = /^(-?[\d.]+)e([+-]?\d+)$/.exec(s); if (m) return m[1] + "\\cdot 10^{" + parseInt(m[2], 10) + "}"; }
    return s;
  }
  function toTeX(n, prec) {
    prec = prec || 0;
    var s, par = function (str, my) { return my < prec ? "\\left(" + str + "\\right)" : str; };
    switch (n.t) {
      case "num": return numTex(n.v);
      case "const": return n.n === "pi" ? "\\pi" : n.n === "e" ? "e" : n.n === "oo" ? "\\infty" : n.n;
      case "var": return n.n.replace(/_(.+)/, "_{$1}");
      case "neg": return par("-" + toTeX(n.x, 3), 2);
      case "fact": return toTeX(n.x, 6) + "!";
      case "bin":
        switch (n.op) {
          case "+": return par(toTeX(n.l, 1) + "+" + toTeX(n.r, 1), 1);
          case "-": return par(toTeX(n.l, 1) + "-" + toTeX(n.r, 2), 1);
          case "*": return par(toTeX(n.l, 2) + (n.imp && (n.r.t === "var" || n.r.t === "const" || n.r.t === "call" || n.r.t === "bin" && n.r.op === "^") && n.l.t !== "num" ? " " : "\\cdot ") + toTeX(n.r, 3), 2);
          case "/": return "\\frac{" + toTeX(n.l, 0) + "}{" + toTeX(n.r, 0) + "}";
          case "^": return par(toTeX(n.l, 5) + "^{" + toTeX(n.r, 0) + "}", 4);
          default: return toTeX(n.l, 0) + " " + n.op + " " + toTeX(n.r, 0);
        }
      case "call":
        if (n.f === "sqrt") return "\\sqrt{" + toTeX(n.a[0], 0) + "}";
        if (n.f === "cbrt") return "\\sqrt[3]{" + toTeX(n.a[0], 0) + "}";
        if (n.f === "abs") return "\\left|" + toTeX(n.a[0], 0) + "\\right|";
        if (n.f === "log") return n.a.length === 1 ? "\\ln\\left(" + toTeX(n.a[0], 0) + "\\right)" : "\\log_{" + toTeX(n.a[1], 0) + "}\\left(" + toTeX(n.a[0], 0) + "\\right)";
        s = TEXF[n.f] || ("\\operatorname{" + n.f + "}");
        return s + "\\left(" + n.a.map(function (a) { return toTeX(a, 0); }).join(", ") + "\\right)";
    }
    return "";
  }

  /* ---------- Сандық нүктелерде эквиваленттік ---------- */
  function closeNum(u, r, tol) {
    if (!isFinite(u) || !isFinite(r)) return u === r;
    return Math.abs(u - r) <= (tol || 1e-7) * Math.max(1, Math.abs(r));
  }
  /* o: {vars:["x"], dom:[lo,hi] немесе {x:[lo,hi]}, scope:{a:2}, seed} */
  function samplePoints(vars, dom, seedStr, count) {
    var rnd = rng(hash(seedStr)), pts = [], i, v;
    var rangeOf = function (name) { var d = dom && !Array.isArray(dom) ? dom[name] : dom; return d && d.length === 2 ? d : [-4, 4]; };
    for (i = 0; i < count; i++) {
      var pt = {};
      for (v = 0; v < vars.length; v++) {
        var r = rangeOf(vars[v]);
        pt[vars[v]] = i < 3 ? [0.5, 1.5, 2][i] * (r[0] < 0 && r[1] > 0 && v % 2 ? -1 : 1) : r[0] + rnd() * (r[1] - r[0]);
        if (i < 3 && (pt[vars[v]] < r[0] || pt[vars[v]] > r[1])) pt[vars[v]] = r[0] + rnd() * (r[1] - r[0]);
      }
      pts.push(pt);
    }
    return pts;
  }
  function withScope(pt, scope) { if (!scope) return pt; var o = {}, k; for (k in scope) o[k] = scope[k]; for (k in pt) o[k] = pt[k]; return o; }
  function equivalent(userSrc, refSrc, o) {
    o = o || {};
    var vars = o.vars || ["x"], allVars = vars.concat(o.scope ? Object.keys(o.scope) : []);
    var uf = compileSrc(userSrc, { vars: vars }); // айнымалылар тек рұқсат етілгендер
    var rf = compileSrc(refSrc, { vars: allVars });
    var pts = samplePoints(vars, o.dom, String(refSrc), 48), valid = 0, i;
    for (i = 0; i < pts.length; i++) {
      var env = withScope(pts[i], o.scope), r = rf(env);
      if (!isFinite(r)) continue;
      var u = uf(env);
      if (!closeNum(u, r, o.tol)) return false;
      valid++;
    }
    return valid >= 5;
  }
  /* Теңдеу: "2x-y+1=0" ~ "y=2x+1" (F_user = k * F_ref, k != 0) */
  function parseEquation(src, vars) {
    var parts = normalizeInput(src).split("=");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) throw new PErr("Теңдеуді «сол жағы = оң жағы» түрінде жазыңыз.");
    var l = compileSrc(parts[0], { vars: vars }), r = compileSrc(parts[1], { vars: vars });
    var fn = function (e) { return l(e) - r(e); };
    fn.ast = { t: "eq", l: l.ast, r: r.ast };
    return fn;
  }
  function equivalentEq(userSrc, refSrc, o) {
    o = o || {};
    var vars = o.vars || ["x", "y"];
    var uf = parseEquation(userSrc, vars), rf = parseEquation(refSrc, vars);
    var pts = samplePoints(vars, o.dom, String(refSrc), 40), k = null, i, used = 0;
    for (i = 0; i < pts.length; i++) {
      var fr = rf(pts[i]), fu = uf(pts[i]);
      if (!isFinite(fr) || !isFinite(fu)) continue;
      if (Math.abs(fr) < 1e-9) { if (Math.abs(fu) > 1e-6) return false; continue; }
      var q = fu / fr;
      if (k === null) k = q; else if (Math.abs(q - k) > 1e-6 * Math.max(1, Math.abs(k))) return false;
      used++;
    }
    return used >= 5 && k !== null && Math.abs(k) > 1e-9;
  }
  function evalNumber(src, scope) {
    var vars = scope ? Object.keys(scope) : [];
    var f = compileSrc(src, { vars: vars, allowInf: true });
    return f(scope || {});
  }

  /* ---------- Аралықтар ---------- */
  function parseInterval(src) {
    var s = normalizeInput(src).replace(/\s+/g, "").replace(/\binf\b/gi, "oo").replace(/[Uu∪]/g, "U");
    if (/^[Rr]$/.test(s) || s === "(-oo;oo)" || s === "(-oo,oo)") return [{ lo: -Infinity, hi: Infinity, lc: false, hc: false }];
    if (s === "∅" || /^(empty|\{\})$/i.test(s)) return [];
    var sepRe = s.indexOf(";") >= 0 ? ";" : ",";
    var chunks = s.split("U"), out = [];
    chunks.forEach(function (ch) {
      var m = /^([\(\[\]])(.+?)([\)\]\[])$/.exec(ch);
      if (!m) throw new PErr("Аралықты (a; b] түрінде жазыңыз, бірнешеуін U (бірігу) белгісімен қосыңыз.");
      var body = m[2], idx = body.split(sepRe);
      if (idx.length !== 2) throw new PErr("Аралықтың екі ұшы болуы керек: (a; b).");
      var ends = idx.map(function (e) {
        var sg = 1, t = e;
        if (/^\+?oo$/.test(t)) return Infinity;
        if (/^-oo$/.test(t)) return -Infinity;
        var v = evalNumber(t.replace(/(\d),(\d)/g, "$1.$2"));
        if (!isFinite(v)) throw new PErr("Аралықтың ұшы сан болуы керек.");
        return sg * v;
      });
      var lc = m[1] === "[", hc = m[3] === "]";
      if (ends[0] === -Infinity) lc = false;
      if (ends[1] === Infinity) hc = false;
      if (ends[0] > ends[1] || (ends[0] === ends[1] && !(lc && hc))) throw new PErr("Аралықтың сол ұшы оң ұшынан үлкен болмауы керек.");
      out.push({ lo: ends[0], hi: ends[1], lc: lc, hc: hc });
    });
    return mergeIntervals(out);
  }
  function mergeIntervals(list) {
    var a = list.slice().sort(function (p, q) { return p.lo - q.lo || (q.lc ? 1 : 0) - (p.lc ? 1 : 0); }), out = [];
    a.forEach(function (iv) {
      var last = out[out.length - 1];
      if (last && (iv.lo < last.hi || (Math.abs(iv.lo - last.hi) < 1e-12 && (iv.lc || last.hc)))) {
        if (iv.hi > last.hi || (Math.abs(iv.hi - last.hi) < 1e-12 && iv.hc)) { last.hi = iv.hi; last.hc = iv.hc; }
      } else out.push({ lo: iv.lo, hi: iv.hi, lc: iv.lc, hc: iv.hc });
    });
    return out;
  }
  function sameIntervals(a, b) {
    if (a.length !== b.length) return false;
    return a.every(function (x, i) {
      var y = b[i];
      var same = function (p, q) { return p === q || Math.abs(p - q) <= 1e-9 * Math.max(1, Math.abs(q)); };
      return same(x.lo, y.lo) && same(x.hi, y.hi) && x.lc === y.lc && x.hc === y.hc;
    });
  }

  /* =====================================================================
   *  Параметрлік есептер
   * ===================================================================== */
  function genParams(spec, seed) {
    var tries, name, def, P, ok;
    var r = rng(seed);
    var defs = spec.params || {};
    for (tries = 0; tries < 400; tries++) {
      P = {}; ok = true;
      for (name in defs) {
        def = defs[name];
        var v;
        if (def.int) {
          v = def.int[0] + Math.floor(r() * (def.int[1] - def.int[0] + 1));
          if (def.nz && v === 0) v = (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * Math.max(1, Math.max(Math.abs(def.int[0]), Math.abs(def.int[1])))));
          if (def.nz && v === 0) { ok = false; break; }
          if (def.int && (v < def.int[0] || v > def.int[1])) { ok = false; break; }
          if (def.not && def.not.indexOf(v) >= 0) { ok = false; break; }
        } else if (def.pick) {
          v = def.pick[Math.floor(r() * def.pick.length)];
        } else if (def.dec) {
          var dp = def.dec[2] == null ? 1 : def.dec[2], f = Math.pow(10, dp);
          v = Math.round((def.dec[0] + r() * (def.dec[1] - def.dec[0])) * f) / f;
          if (def.nz && v === 0) { ok = false; break; }
        } else if (def.calc) {
          v = evalNumber(def.calc, P);
        } else { throw new Error("Параметр анықтамасы жарамсыз: " + name); }
        P[name] = v;
      }
      if (!ok) continue;
      if (spec.require && spec.require.some(function (cond) { var f = compileSrc(cond, { vars: Object.keys(P), cmp: true, allowInf: true }); return !f(P); })) continue;
      return P;
    }
    throw new Error("Параметр шарттарын қанағаттандыратын мән табылмады (require тым қатаң).");
  }
  function fmtNum(v) {
    if (!isFinite(v)) return String(v);
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return String(parseFloat(v.toPrecision(10)));
  }
  function toFraction(v, maxDen) {
    maxDen = maxDen || 1000;
    if (Math.abs(v - Math.round(v)) < 1e-9) return [Math.round(v), 1];
    var best = null, d;
    for (d = 2; d <= maxDen; d++) {
      var nm = Math.round(v * d);
      if (Math.abs(v - nm / d) < 1e-9) { best = [nm, d]; break; }
    }
    return best;
  }
  function fracTeX(v) {
    var fr = toFraction(v);
    if (!fr) return fmtNum(v);
    if (fr[1] === 1) return String(fr[0]);
    return (fr[0] < 0 ? "-" : "") + "\\frac{" + Math.abs(fr[0]) + "}{" + fr[1] + "}";
  }
  /* Үлгі: #{a}, #{+b}, #{p:b}, #{f:a/b}, #{expr} */
  function interpolate(tpl, P) {
    return String(tpl).replace(/#\{([^}]*)\}/g, function (_, body) {
      var mode = "", ex = body.trim(), m = /^(f|p):(.*)$/.exec(ex);
      if (m) { mode = m[1]; ex = m[2]; } else if (/^\+/.test(ex)) { mode = "+"; ex = ex.slice(1); }
      var v = evalNumber(ex, P);
      if (mode === "f") return fracTeX(v);
      if (mode === "+") return (v < 0 ? "-" : "+") + fmtNum(Math.abs(v));
      if (mode === "p") return v < 0 ? "(" + fmtNum(v) + ")" : fmtNum(v);
      return fmtNum(v);
    });
  }

  /* =====================================================================
   *  Жауапты тексеру (бір есеп элементі үшін, DOM-сыз)
   *  Қайтарады: { ok: bool, msg?: string, empty?: bool }
   * ===================================================================== */
  function checkNumeric(user, ans, tol) {
    var u;
    try { u = evalNumber(String(user).replace(/(\d),(\d)/g, "$1.$2")); } catch (e) { return { ok: false, msg: e.isParseError ? e.message : "Санды оқи алмадым." }; }
    if (!isFinite(u)) return { ok: false, msg: "Нәтиже сан болуы керек." };
    var a = typeof ans === "number" ? ans : evalNumber(ans);
    var t = tol == null ? 1e-6 : tol;
    return { ok: Math.abs(u - a) <= Math.max(t, 1e-9 * Math.abs(a)) };
  }
  function checkExpr(user, item, scope) {
    var vars = item.vars || (item.eq ? ["x", "y"] : ["x"]);
    var src = String(user);
    try {
      if (item.req) {
        var flat = normalizeInput(src).replace(/\s+/g, "");
        for (var i = 0; i < item.req.length; i++) if (!new RegExp(item.req[i]).test(flat)) return { ok: false, msg: item.reqMsg || "Өрнек сұралған түрде жазылмаған." };
      }
      if (item.forbid) {
        var flat2 = normalizeInput(src).replace(/\s+/g, "");
        for (var j = 0; j < item.forbid.length; j++) if (new RegExp(item.forbid[j]).test(flat2)) return { ok: false, msg: item.forbidMsg || "Жауапты қарапайым түрде жазыңыз." };
      }
      var ok = item.eq ? equivalentEq(src, item.a, { vars: vars, dom: item.dom }) : equivalent(src, item.a, { vars: vars, dom: item.dom, scope: scope });
      return { ok: ok };
    } catch (e) {
      if (e.isParseError) return { ok: false, msg: e.message };
      return { ok: false, msg: "Өрнекті оқи алмадым." };
    }
  }
  function checkMatrix(grid, item, scope) {
    var a = item.a, flat = Array.isArray(a[0]) ? a : a.map(function (x) { return [x]; });
    var tol = item.tol == null ? 1e-6 : item.tol;
    for (var r = 0; r < flat.length; r++) for (var c = 0; c < flat[r].length; c++) {
      var u = grid[r][c];
      if (u == null || String(u).trim() === "") return { ok: false, empty: true };
      var uv;
      try { uv = evalNumber(String(u).replace(/(\d),(\d)/g, "$1.$2")); } catch (e) { return { ok: false, msg: e.isParseError ? e.message : "Санды оқи алмадым." }; }
      var av = typeof flat[r][c] === "number" ? flat[r][c] : evalNumber(flat[r][c], scope);
      if (!(Math.abs(uv - av) <= Math.max(tol, 1e-9 * Math.abs(av)))) return { ok: false };
    }
    return { ok: true };
  }
  function answerText(item, scope) {
    switch (item.type) {
      case "num": {
        var v = typeof item.a === "number" ? item.a : evalNumber(item.a, scope);
        var fr = !item.dec && toFraction(v, 200);
        return item.dec || !fr || fr[1] === 1 ? fmtNum(v) : fr[0] + "/" + fr[1];
      }
      case "matrix": {
        var rows = Array.isArray(item.a[0]) ? item.a : item.a.map(function (x) { return [x]; });
        return rows.map(function (r) { return r.map(function (c) { return typeof c === "number" ? fmtNum(c) : fmtNum(evalNumber(c, scope)); }).join(", "); }).join(" ; ");
      }
      case "choice": return (Array.isArray(item.a) ? item.a : [item.a]).map(function (i) { return item.o[i]; }).join("; ");
      case "tf": return item.a ? "Ақиқат" : "Жалған";
      default: return String(item.a);
    }
  }

  /* =====================================================================
   *  Браузер бөлігі
   * ===================================================================== */
  var API = {
    version: 1, parse: parse, compile: compile, compileSrc: compileSrc, toTeX: toTeX, equivalent: equivalent, equivalentEq: equivalentEq,
    evalNumber: evalNumber, parseInterval: parseInterval, sameIntervals: sameIntervals, genParams: genParams, interpolate: interpolate,
    checkNumeric: checkNumeric, checkExpr: checkExpr, checkMatrix: checkMatrix, answerText: answerText, rng: rng, hash: hash, renderMath: renderMath,
    fmtNum: fmtNum, normalizeInput: normalizeInput, FUNCS: Object.keys(FUNC1).concat(Object.keys(ALIAS), Object.keys(FUNCN)), blocks: {}, ready: false
  };
  if (!HAS_DOM) { if (typeof module !== "undefined" && module.exports) module.exports = API; return; }
  window.CS50KZ_MATH = API;

  var pageKey = (location.pathname.match(/([\w-]+)\.html$/) || [, "page"])[1];
  var EXKEY = "cs50kz:math:ex", SEEDKEY = "cs50kz:math:seed";
  function exState(key) { var all = LS.get(EXKEY, {}); return (all && all[key]) || null; }
  function exSave(key, rec) { var all = LS.get(EXKEY, {}); if (!all || typeof all !== "object" || Array.isArray(all)) all = {}; all[key] = rec; LS.set(EXKEY, all); }

  /* ---------- Тексеру нәтижесі мен прогресс ---------- */
  function finish(ctx, got, total) {
    var ok = got === total && total > 0;
    var prev = exState(ctx.key) || {};
    var rec = { best: Math.max(prev.best || 0, got), total: total, ok: !!(ok || prev.ok), t: Date.now() };
    exSave(ctx.key, rec);
    ctx.result.className = "mx-result " + (ok ? "ok" : "bad");
    ctx.result.textContent = (ok ? "✓ Керемет! " : "Қайта көріңіз. ") + "Нәтиже: " + got + " / " + total + (ok ? "" : ". Қателерді түзетіп, қайта тексеріңіз.");
    if (ok) markDone(ctx.el, true, !prev.ok);
    return ok;
  }
  function markDone(el, on, first) {
    el.classList.toggle("is-done", !!on);
    var badge = el.querySelector(".mx-badge");
    if (on && !badge) {
      var hd = el.querySelector(".task-head") || el.firstElementChild;
      if (hd) hd.append(h("span", { class: "mx-badge", text: "✓ Орындалды" }));
    }
    if (on) {
      LS.set("check:" + location.pathname + ":" + el.dataset.id, [true]);
      if (first) {
        if (K().logDay) K().logDay();
        if (K().check) K().check();
        if (K().toast) K().toast("Есеп орындалды ✓");
      }
    }
    updateSummary();
  }
  function updateSummary() {
    var all = document.querySelectorAll(".math-ex"), box = document.querySelector(".mx-sum");
    if (!box) return;
    var done = document.querySelectorAll(".math-ex.is-done").length;
    box.textContent = "Есептер: " + done + " / " + all.length + " орындалды" + (done === all.length && all.length ? " ✓" : "");
  }

  /* ---------- Элемент виджеттері ---------- */
  var W = {};
  function field(label, attrs) {
    return h("input", Object.assign({ type: "text", class: "mx-input", autocomplete: "off", autocapitalize: "none", spellcheck: "false", "aria-label": label }, attrs || {}));
  }
  function previewBox() { return h("div", { class: "mx-preview", "aria-live": "polite" }); }
  function wirePreview(input, box, vars, eq) {
    var t;
    var upd = function () {
      var v = input.value.trim();
      box.className = "mx-preview";
      if (!v) { box.textContent = ""; return; }
      try {
        var tex;
        if (eq) { var ps = normalizeInput(v).split("="); if (ps.length !== 2) { box.textContent = ""; return; } tex = toTeX(parse(ps[0], { vars: vars })) + "=" + toTeX(parse(ps[1], { vars: vars })); }
        else tex = toTeX(parse(v, { vars: vars }));
        box.textContent = ""; box.append(h("span", { class: "mx-pv-lbl", text: "Сіз жаздыңыз: " }));
        var sp = h("span"); renderTeX(sp, tex, false); box.append(sp);
      } catch (e) { box.className = "mx-preview err"; box.textContent = e.isParseError ? e.message : ""; }
    };
    input.addEventListener("input", function () { clearTimeout(t); t = setTimeout(upd, 160); });
  }

  /* Әр виджет: { el, check() -> {ok,msg,empty}, reveal() -> html, reset() } */
  W.num = function (item, ctx) {
    var inp = field("Жауап (сан не өрнек)", { inputmode: "text", size: 14 }), u = item.unit ? h("span", { class: "mx-unit", text: " " + item.unit }) : null;
    var el = h("div", { class: "mx-in" }, inp, u, h("small", { class: "mx-note", text: item.round ? "Дөңгелектеңіз: " + item.round : "Бөлшекті 3/4 түрінде жаза аласыз." }));
    return {
      el: el, inp: inp,
      check: function () { var v = inp.value.trim(); if (!v) return { empty: true }; var r = checkNumeric(v, item.a, item.tol); inp.classList.toggle("ok", r.ok); inp.classList.toggle("bad", !r.ok); return r; },
      reveal: function () { return "<code>" + esc(answerText(item, ctx.scope)) + "</code>" + (item.unit ? " " + esc(item.unit) : ""); },
      reset: function () { inp.value = ""; inp.classList.remove("ok", "bad"); },
      fill: function () { inp.value = answerText(item, ctx.scope); }
    };
  };
  W.expr = function (item, ctx) {
    var vars = item.vars || (item.eq ? ["x", "y"] : ["x"]);
    var inp = field(item.eq ? "Теңдеу" : "Өрнек", { size: 24, placeholder: item.eq ? "мысалы: y = 2x + 1" : "мысалы: (x+1)^2" }), pv = previewBox();
    wirePreview(inp, pv, vars, !!item.eq);
    var el = h("div", { class: "mx-in wide" }, inp, pv, h("small", { class: "mx-note", text: "Көбейту: 2x не 2*x; дәреже: x^2; түбір: sqrt(x); бөлшек: (x+1)/(x-1); π: pi." }));
    return {
      el: el, inp: inp,
      check: function () {
        var v = inp.value.trim(); if (!v) return { empty: true };
        var r = checkExpr(v, item, ctx.scope); inp.classList.toggle("ok", r.ok); inp.classList.toggle("bad", !r.ok); return r;
      },
      reveal: function () { return "<code>" + esc(item.ad || item.a) + "</code>"; },
      reset: function () { inp.value = ""; pv.textContent = ""; inp.classList.remove("ok", "bad"); },
      fill: function () { inp.value = item.a; inp.dispatchEvent(new Event("input")); }
    };
  };
  W.interval = function (item, ctx) {
    var inp = field("Аралық", { size: 26, placeholder: "мысалы: (-oo; 3] U [5; oo)" });
    var el = h("div", { class: "mx-in wide" }, inp, h("small", { class: "mx-note", text: "Шексіздік: oo не ∞; бірігу: U не ∪; ұштарды «;» не «,» бөледі. R - барлық нақты сандар." }));
    var ans = null;
    try { ans = parseInterval(ctx.scope ? interpolate(item.a, ctx.scope) : item.a); } catch (e) { ans = null; }
    return {
      el: el, inp: inp,
      check: function () {
        var v = inp.value.trim(); if (!v) return { empty: true };
        var r;
        try { r = { ok: !!ans && sameIntervals(parseInterval(v), ans) }; } catch (e) { r = { ok: false, msg: e.isParseError ? e.message : "Аралықты оқи алмадым." }; }
        inp.classList.toggle("ok", r.ok); inp.classList.toggle("bad", !r.ok); return r;
      },
      reveal: function () { return "<code>" + esc(ctx.scope ? interpolate(item.ad || item.a, ctx.scope) : (item.ad || item.a)) + "</code>"; },
      reset: function () { inp.value = ""; inp.classList.remove("ok", "bad"); },
      fill: function () { inp.value = ctx.scope ? interpolate(item.a, ctx.scope) : item.a; }
    };
  };
  W.choice = function (item, ctx) {
    var name = "mx" + (++UID), multi = Array.isArray(item.a), order = item.o.map(function (_, i) { return i; });
    if (item.shuffle) order = shuffle(order, rng(hash(ctx.key + item.q)));
    var opts = order.map(function (k) {
      return h("label", { class: "mx-opt" }, h("input", { type: multi ? "checkbox" : "radio", name: name, value: String(k), "aria-label": plainText(item.o[k]) }), h("span", { html: rich(item.o[k]) }));
    });
    var el = h("div", { class: "mx-opts", role: multi ? "group" : "radiogroup" }, opts);
    if (multi) el.prepend(h("small", { class: "mx-note", text: "Бірнеше жауап дұрыс болуы мүмкін." }));
    var good = multi ? item.a : [item.a];
    return {
      el: el,
      check: function () {
        var sel = []; el.querySelectorAll("input:checked").forEach(function (i) { sel.push(+i.value); });
        if (!sel.length) return { empty: true };
        var ok = sel.length === good.length && good.every(function (g) { return sel.indexOf(g) >= 0; });
        opts.forEach(function (lab, idx) {
          var k = order[idx], chosen = sel.indexOf(k) >= 0, isGood = good.indexOf(k) >= 0;
          cls(lab, "correct", isGood && (ok || chosen)); cls(lab, "wrong", chosen && !isGood);
        });
        return { ok: ok };
      },
      reveal: function () { return good.map(function (g) { return rich(item.o[g]); }).join("; "); },
      reset: function () { el.querySelectorAll("input").forEach(function (i) { i.checked = false; }); opts.forEach(function (l) { l.classList.remove("correct", "wrong"); }); },
      fill: function () { el.querySelectorAll("input").forEach(function (i) { i.checked = good.indexOf(+i.value) >= 0; }); }
    };
  };
  W.tf = function (item) {
    var name = "mx" + (++UID);
    var mk = function (val, text) { return h("label", { class: "mx-opt" }, h("input", { type: "radio", name: name, value: val }), h("span", { text: text })); };
    var yes = mk("1", "Ақиқат"), no = mk("0", "Жалған"), el = h("div", { class: "mx-opts tf", role: "radiogroup" }, yes, no);
    return {
      el: el,
      check: function () {
        var s = el.querySelector("input:checked"); if (!s) return { empty: true };
        var ok = (s.value === "1") === !!item.a;
        cls(yes, "correct", item.a && (ok || s.value === "1")); cls(no, "correct", !item.a && (ok || s.value === "0"));
        cls(yes, "wrong", s.value === "1" && !item.a); cls(no, "wrong", s.value === "0" && !!item.a);
        return { ok: ok };
      },
      reveal: function () { return item.a ? "Ақиқат" : "Жалған"; },
      reset: function () { el.querySelectorAll("input").forEach(function (i) { i.checked = false; }); yes.classList.remove("correct", "wrong"); no.classList.remove("correct", "wrong"); },
      fill: function () { el.querySelector('input[value="' + (item.a ? 1 : 0) + '"]').checked = true; }
    };
  };
  W.matrix = function (item, ctx) {
    var a = item.a, two = Array.isArray(a[0]), rows = two ? a.length : (item.orient === "row" ? 1 : a.length), cols = two ? a[0].length : (item.orient === "row" ? a.length : 1);
    var norm = two ? a : (item.orient === "row" ? [a] : a.map(function (x) { return [x]; }));
    var item2 = Object.assign({}, item, { a: norm });
    var cells = [], grid = h("div", { class: "mx-matrix", style: "--cols:" + cols, role: "group", "aria-label": item.label || "Матрица" });
    for (var r = 0; r < rows; r++) { cells.push([]); for (var c = 0; c < cols; c++) { var inp = field("Элемент " + (r + 1) + "," + (c + 1), { size: 5, inputmode: "text" }); inp.classList.add("mx-cell"); cells[r].push(inp); grid.append(inp); } }
    var wrap = h("div", { class: "mx-in" }, item.name ? h("span", { class: "mx-mname", html: rich(item.name) }) : null, h("div", { class: "mx-mbrk" }, grid));
    return {
      el: wrap,
      check: function () {
        var g = cells.map(function (row) { return row.map(function (i) { return i.value; }); });
        var r = checkMatrix(g, item2, ctx.scope);
        if (r.empty) return r;
        cells.forEach(function (row, ri) { row.forEach(function (i, ci) {
          var one = checkMatrix([[g[ri][ci]]], { a: [[norm[ri][ci]]], tol: item.tol }, ctx.scope); i.classList.toggle("ok", one.ok); i.classList.toggle("bad", !one.ok);
        }); });
        return r;
      },
      reveal: function () { return "<code>" + esc(answerText(item2, ctx.scope)) + "</code>"; },
      reset: function () { cells.forEach(function (row) { row.forEach(function (i) { i.value = ""; i.classList.remove("ok", "bad"); }); }); },
      fill: function () { cells.forEach(function (row, ri) { row.forEach(function (i, ci) { var v = norm[ri][ci]; i.value = typeof v === "number" ? fmtNum(v) : fmtNum(evalNumber(v, ctx.scope)); }); }); }
    };
  };
  /* <option> ішінде KaTeX жұмыс істемейді: TeX-ті оқылатын Unicode мәтінге айналдырамыз ($\frac{a}{b}$ → a/b, \cup → ∪ ...) */
  var TEX_SYM = { cup: "∪", cap: "∩", setminus: "∖", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", emptyset: "∅", varnothing: "∅", infty: "∞", pi: "π", alpha: "α", beta: "β",
    gamma: "γ", delta: "δ", varepsilon: "ε", epsilon: "ε", lambda: "λ", mu: "μ", sigma: "σ", theta: "θ", varphi: "φ", phi: "φ", omega: "ω", Omega: "Ω", Delta: "Δ", Sigma: "Σ",
    le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈", equiv: "≡", cdot: "·", times: "×", pm: "±", to: "→", Rightarrow: "⇒", iff: "⇔", infty_: "∞",
    sum: "Σ", prod: "Π", int: "∫", partial: "∂", nabla: "∇", circ: "∘", neg: "¬", land: "∧", lor: "∨", forall: "∀", exists: "∃", mid: "|", ldots: "…", dots: "…", cdots: "⋯",
    sqrt: "√", lfloor: "⌊", rfloor: "⌋", lceil: "⌈", rceil: "⌉", langle: "⟨", rangle: "⟩", oplus: "⊕", mathbb: "", quad: " ", qquad: " " };
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "n": "ⁿ", "-": "⁻", "+": "⁺", "k": "ᵏ", "T": "ᵀ" };
  var SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "n": "ₙ", "k": "ₖ", "i": "ᵢ", "j": "ⱼ" };
  function texPlain(src) {
    var s = String(src);
    if (s.indexOf("$") < 0 && s.indexOf("\\") < 0) return s;
    var wrap = function (a) { return /[+\-−\s·]/.test(a) ? "(" + a + ")" : a; };
    var supsub = function (t) {
      return t.replace(/\^\{([^{}]*)\}/g, function (m, a) { return /^[0-9n+\-kT]+$/.test(a) ? a.split("").map(function (c) { return SUP[c]; }).join("") : "^(" + a + ")"; })
        .replace(/\^([0-9nkT])/g, function (m, c) { return SUP[c]; })
        .replace(/_\{([^{}]*)\}/g, function (m, a) { return /^[0-9nkij]+$/.test(a) ? a.split("").map(function (c) { return SUB[c]; }).join("") : "_(" + a + ")"; })
        .replace(/_([0-9nkij])/g, function (m, c) { return SUB[c]; });
    };
    s = s.replace(/\\\{/g, "\u0001").replace(/\\\}/g, "\u0002").replace(/\$/g, "").replace(/\\(?:left|right|displaystyle|textstyle|,|;|!|:)/g, "").replace(/\\(?:text|mathrm|mathbf|operatorname)\{([^{}]*)\}/g, "$1");
    s = s.replace(/\\mathbb\{?([A-Z])\}?/g, function (m, c) { return { R: "ℝ", N: "ℕ", Z: "ℤ", Q: "ℚ", C: "ℂ" }[c] || c; });
    s = s.replace(/\\(?:bar|overline)\s*([A-Za-z])/g, " $1̅");
    s = s.replace(/\\([A-Za-z]+)/g, function (m, w) { return Object.prototype.hasOwnProperty.call(TEX_SYM, w) ? TEX_SYM[w] + " " : (/^(frac|dfrac|tfrac|binom|sqrt|bar|overline|vec|hat)$/.test(w) ? m : w + " "); });
    for (var g = 0; g < 5; g++) {
      s = supsub(s);
      s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\{([^{}]*)\}/g, function (m, a, b) { return wrap(a.trim()) + "/" + wrap(b.trim()); })
        .replace(/\\binom\s*\{([^{}]*)\}\{([^{}]*)\}/g, "C($1,$2)").replace(/√ ?\{([^{}]*)\}/g, "√($1)").replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
        .replace(/\\(?:bar|overline)\s*\{([^{}]*)\}/g, "$1̅").replace(/\\(?:vec|hat)\s*\{([^{}]*)\}/g, "$1");
    }
    return s.replace(/[{}]/g, "").replace(/\u0001/g, "{").replace(/\u0002/g, "}").replace(/\s+/g, " ").replace(/ ([)\],.;:!?²³⁰¹⁴-⁹ⁿ₀-₉/])/g, "$1").replace(/([(\[/]) /g, "$1").trim();
  }
  W.match = function (item, ctx) {
    var pairs = item.pairs, rights = [];
    pairs.forEach(function (p) { if (rights.indexOf(p[1]) < 0) rights.push(p[1]); });
    rights = shuffle(rights, rng(hash(ctx.key + pairs.length)));
    var rows = pairs.map(function (p, i) {
      var sel = h("select", { class: "mx-sel", "aria-label": "Сәйкестік " + (i + 1) }, h("option", { value: "", text: "- таңдаңыз -" }),
        rights.map(function (r) { return h("option", { value: r, text: texPlain(r) }); }));
      var left = h("span", { class: "mx-left", html: rich(p[0]) });
      return { sel: sel, row: h("li", null, left, h("span", { class: "mx-arrow", "aria-hidden": "true", text: "→" }), sel), ans: p[1] };
    });
    var el = h("ul", { class: "mx-match" }, rows.map(function (r) { return r.row; }));
    return {
      el: el,
      check: function () {
        var empty = rows.every(function (r) { return !r.sel.value; });
        if (empty) return { empty: true };
        var ok = true;
        rows.forEach(function (r) { var good = r.sel.value === r.ans; if (!good) ok = false; r.sel.classList.toggle("ok", good); r.sel.classList.toggle("bad", !good); });
        return { ok: ok };
      },
      reveal: function () { return "<ul>" + pairs.map(function (p) { return "<li>" + rich(p[0]) + " → " + rich(p[1]) + "</li>"; }).join("") + "</ul>"; },
      reset: function () { rows.forEach(function (r) { r.sel.value = ""; r.sel.classList.remove("ok", "bad"); }); },
      fill: function () { rows.forEach(function (r) { r.sel.value = r.ans; }); }
    };
  };
  W.order = function (item, ctx) {
    var steps = item.steps, n = steps.length, idx = steps.map(function (_, i) { return i; });
    var rnd = rng(hash(ctx.key + (item.q || "")));
    var cur = shuffle(idx, rnd), tries = 0;
    while (cur.every(function (v, i) { return v === i; }) && tries++ < 10) cur = shuffle(idx, rnd);
    var list = h("ol", { class: "mx-order" });
    function paint() {
      list.textContent = "";
      cur.forEach(function (k, pos) {
        var li = h("li", { class: "mx-ostep", "data-k": k },
          h("span", { class: "mx-otxt", html: rich(steps[k]) }),
          h("span", { class: "mx-octl" },
            h("button", { type: "button", class: "mx-mv", "aria-label": "Жоғары жылжыту", disabled: pos === 0, text: "↑", onclick: function () { move(pos, -1); } }),
            h("button", { type: "button", class: "mx-mv", "aria-label": "Төмен жылжыту", disabled: pos === n - 1, text: "↓", onclick: function () { move(pos, 1); } })));
        list.append(li);
      });
      renderMath(list);
    }
    function move(pos, d) { var t = cur[pos]; cur[pos] = cur[pos + d]; cur[pos + d] = t; paint(); var b = list.children[pos + d] && list.children[pos + d].querySelector(d < 0 ? ".mx-mv" : ".mx-mv:last-child"); if (b && !b.disabled) b.focus(); }
    paint();
    var touched = false;
    list.addEventListener("click", function () { touched = true; });
    return {
      el: list,
      check: function () {
        var ok = cur.every(function (v, i) { return v === i; });
        Array.prototype.forEach.call(list.children, function (li, pos) { li.classList.toggle("ok", cur[pos] === pos); li.classList.toggle("bad", cur[pos] !== pos); });
        return { ok: ok, empty: false };
      },
      reveal: function () { return "<ol>" + steps.map(function (s) { return "<li>" + rich(s) + "</li>"; }).join("") + "</ol>"; },
      reset: function () { cur = shuffle(idx, rnd); paint(); },
      fill: function () { cur = idx.slice(); paint(); }
    };
  };
  W.reveal = function (item) { /* «қадамдық шешім»: тек оқу, тексеру жоқ */
    var el = h("div", { class: "mx-reveal-mark" });
    return { el: el, noCheck: true, check: function () { return { ok: true }; }, reveal: function () { return rich(item.ans || ""); }, reset: function () {}, fill: function () {} };
  };

  /* ---------- Қадамдық шешім: hint -> 1-қадам -> ... -> жауап ---------- */
  function solUI(item, ctx, widget) {
    var sol = item.sol || {}, hint = item.hint || sol.hint, steps = sol.steps || item.steps || [];
    if (item.type === "order") steps = [];
    var ans = sol.ans || (item.type === "reveal" ? item.ans : null);
    var seq = [];
    if (hint) seq.push({ k: "hint", html: rich(ctx.fmt(hint)) });
    steps.forEach(function (s, i) { seq.push({ k: "step", n: i + 1, html: rich(ctx.fmt(s)) }); });
    if (ans) seq.push({ k: "ans", html: rich(ctx.fmt(ans)) });
    if (!seq.length) return null;
    var shown = 0, box = h("ol", { class: "mx-sol", "aria-live": "polite", hidden: true });
    var btn = h("button", { type: "button", class: "btn secondary mx-solbtn" });
    var label = function () {
      if (shown >= seq.length) return "Шешім толық ашылды";
      var nxt = seq[shown];
      return nxt.k === "hint" ? "Кеңес" : nxt.k === "step" ? "Келесі қадам (" + nxt.n + "/" + steps.length + ")" : "Жауабын көрсету";
    };
    var upd = function () { btn.textContent = label(); btn.disabled = shown >= seq.length; };
    upd();
    btn.addEventListener("click", function () {
      if (shown >= seq.length) return;
      var s = seq[shown++];
      box.hidden = false;
      var li = h("li", { class: "mx-solstep " + s.k },
        h("b", { class: "mx-solk", text: s.k === "hint" ? "Кеңес: " : s.k === "step" ? s.n + "-қадам: " : "Жауабы: " }), h("span", { html: s.html }));
      box.append(li);
      renderMath(li);
      upd();
      ctx.helped = true;
      if (item.type === "reveal" && shown >= seq.length) ctx.onRevealDone && ctx.onRevealDone();
    });
    return { btn: btn, box: box, reset: function () { shown = 0; box.textContent = ""; box.hidden = true; upd(); } };
  }

  /* ---------- Блок: бір .math-ex ---------- */
  function buildItem(item, bctx, idx) {
    var type = item.type || bctx.type;
    var ctx = { key: bctx.key + ":" + idx, scope: bctx.scope, fmt: bctx.fmt };
    var it = Object.assign({}, item, { type: type });
    if (!W[type]) throw new Error("Белгісіз есеп түрі: " + type);
    var wd = W[type](it, ctx);
    var fb = h("div", { class: "mx-fb", "aria-live": "polite", hidden: true });
    var ex = h("div", { class: "mx-expl", hidden: true });
    var prompt = it.q ? h("div", { class: "mx-q", html: rich(bctx.fmt(it.q)) }) : null;
    var sol = solUI(it, ctx, wd);
    var tools = h("div", { class: "mx-tools" }, sol ? sol.btn : null);
    var li = h("div", { class: "mx-item" }, prompt, wd.el, fb, ex, tools, sol ? sol.box : null);
    return {
      el: li, wd: wd, item: it, sol: sol, fb: fb, ex: ex, ctx: ctx,
      check: function () {
        var r = wd.check();
        if (r.empty) { fb.hidden = false; fb.textContent = "Жауабын жазыңыз не таңдаңыз."; fb.className = "mx-fb warn"; cls(li, "bad", true); cls(li, "ok", false); return { ok: false, empty: true }; }
        cls(li, "ok", r.ok); cls(li, "bad", !r.ok);
        fb.hidden = false; fb.className = "mx-fb " + (r.ok ? "ok" : "bad");
        fb.textContent = r.ok ? "✓ Дұрыс" : (r.msg ? "✗ " + r.msg : "✗ Қате");
        var e = it.e ? bctx.fmt(it.e) : "";
        ex.hidden = !e || (!r.ok && !it.eAlways);
        ex.innerHTML = e && (r.ok || it.eAlways) ? rich(e) : "";
        renderMath(li);
        return r;
      },
      showAnswer: function () {
        var html = wd.reveal ? wd.reveal() : "";
        fb.hidden = false; fb.className = "mx-fb info"; fb.innerHTML = "<b>Жауабы:</b> " + html;
        if (it.e) { ex.hidden = false; ex.innerHTML = rich(bctx.fmt(it.e)); }
        renderMath(li);
      },
      reset: function () { wd.reset(); fb.hidden = true; ex.hidden = true; cls(li, "ok", false); cls(li, "bad", false); if (sol) sol.reset(); }
    };
  }

  function buildBlock(el) {
    var node = el.querySelector("script.math-ex-data");
    if (!node) return;
    var data;
    try { data = JSON.parse(node.textContent); } catch (e) { el.append(h("p", { class: "mx-err", text: "Есеп дерегі оқылмады (JSON қатесі)." })); return; }
    var type = el.dataset.type, id = el.dataset.id;
    var key = pageKey + ":" + id;
    var body = h("div", { class: "mx-body" });
    var result = h("p", { class: "mx-result", "aria-live": "polite", role: "status" });
    var ctx = { el: el, key: key, result: result, type: type };
    var items = [], fmt = function (s) { return s; };
    var api = { id: id, el: el, key: key, type: type, items: items };
    API.blocks[id] = api;

    function normalizeItems() {
      if (type === "match") return [{ q: data.q, pairs: data.pairs, sol: data.sol, hint: data.hint, e: data.e }];
      if (type === "reveal") return [data];
      return data.items || [];
    }

    function mountAll(scope, list) {
      body.textContent = "";
      items.length = 0;
      var bctx = { key: key, type: type, scope: scope || null, fmt: fmt };
      list.forEach(function (it, i) { var b = buildItem(it, bctx, i); items.push(b); body.append(b.el); });
      if (items.length > 1 || type === "param") items.forEach(function (b, i) { if (items.length > 1) b.el.insertBefore(h("span", { class: "mx-num", text: (i + 1) + ")" }), b.el.firstChild); });
      renderMath(body);
    }

    if (type === "param") {
      var spec = data.spec || data;
      var seeds = LS.get(SEEDKEY, {}); if (!seeds || typeof seeds !== "object" || Array.isArray(seeds)) seeds = {};
      var seed = seeds[key] || Math.floor(Math.random() * 2147483646) + 1;
      var P = null;
      var newVariant = function (s) {
        seed = s || Math.floor(Math.random() * 2147483646) + 1;
        seeds[key] = seed; LS.set(SEEDKEY, seeds);
        P = genParams(spec, seed);
        api.params = P; api.seed = seed;
        fmt = function (t) { return interpolate(t, P); };
        var itemType = spec.type || "num";
        var it = Object.assign({}, spec, { type: itemType, q: spec.q });
        if (itemType === "expr" || itemType === "num" || itemType === "matrix") { /* a: параметрлермен есептеледі */ }
        if (itemType === "num") it.a = evalNumber(spec.a, P);
        if (itemType === "matrix") it.a = (Array.isArray(spec.a[0]) ? spec.a : spec.a.map(function (x) { return [x]; })).map(function (r) { return r.map(function (c) { return typeof c === "number" ? c : evalNumber(c, P); }); });
        if (itemType === "expr") {
          // параметрлер тұрақты ретінде кіреді: a = "a*x+b" -> сандық мәнмен ауыстырылған мәтін
          it.a = Object.keys(P).reduce(function (s, k) { return s.replace(new RegExp("\\b" + k + "\\b", "g"), "(" + fmtNum(P[k]) + ")"); }, spec.a);
          it.ad = it.a;
        }
        if (itemType === "choice" && spec.o) it.o = spec.o.map(fmt);
        mountAll(P, [it]);
        result.textContent = ""; result.className = "mx-result";
        el.classList.remove("is-done");
        var bd = el.querySelector(".mx-badge"); if (bd) bd.remove();
      };
      try { newVariant(seeds[key]); } catch (e) { el.append(h("p", { class: "mx-err", text: "Параметрлік есепті құру мүмкін болмады: " + e.message })); return; }
      var btnNew = h("button", { type: "button", class: "btn secondary mx-new", text: "Жаңа нұсқа", onclick: function () { newVariant(); } });
      api.newVariant = newVariant; api.getAnswerText = function () { var it = items[0].item; return it.type === "interval" ? interpolate(it.a, P) : answerText(it, P); };
      api.fillCorrect = function () { items.forEach(function (b) { b.wd.fill && b.wd.fill(); }); };
      var ctrl = h("div", { class: "mx-ctrl" },
        h("button", { type: "button", class: "btn mx-check", text: "Тексеру", onclick: function () { var r = items[0].check(); if (r.empty) { result.textContent = ""; return; } finish(ctx, r.ok ? 1 : 0, 1); } }),
        btnNew,
        h("button", { type: "button", class: "btn secondary mx-show", text: "Жауабын көрсету", onclick: function () { items[0].showAnswer(); } }));
      el.append(body, ctrl, result);
    } else {
      mountAll(null, normalizeItems());
      api.fillCorrect = function () { items.forEach(function (b) { b.wd.fill && b.wd.fill(); }); };
      var isReveal = type === "reveal";
      if (isReveal) {
        items[0].ctx.onRevealDone = function () { var prev = exState(key) || {}; exSave(key, { best: 1, total: 1, ok: true, t: Date.now() }); markDone(el, true, !prev.ok); result.className = "mx-result ok"; result.textContent = "✓ Шешім толық қаралды."; };
        el.append(body, result);
      } else {
        var c = h("div", { class: "mx-ctrl" },
          h("button", { type: "button", class: "btn mx-check", text: "Тексеру", onclick: function () {
            var got = 0, empty = 0;
            items.forEach(function (b) { var r = b.check(); if (r.ok) got++; if (r.empty) empty++; });
            if (empty === items.length) { result.className = "mx-result bad"; result.textContent = "Алдымен жауап жазыңыз."; return; }
            finish(ctx, got, items.length);
          } }),
          h("button", { type: "button", class: "btn secondary mx-show", text: "Жауаптарды көрсету", onclick: function () { items.forEach(function (b) { b.showAnswer(); }); } }),
          h("button", { type: "button", class: "btn secondary mx-reset", text: "Қайта бастау", onclick: function () { items.forEach(function (b) { b.reset(); }); result.textContent = ""; result.className = "mx-result"; } }));
        el.append(body, c, result);
      }
    }
    /* Бұрын орындалған болса */
    var st = exState(key);
    if (st && st.ok) { el.classList.add("is-done"); var hd = el.querySelector(".task-head"); if (hd && !hd.querySelector(".mx-badge")) hd.append(h("span", { class: "mx-badge", text: "✓ Орындалды" })); }
  }

  function initExercises() {
    var blocks = document.querySelectorAll(".math-ex");
    if (!blocks.length) return;
    blocks.forEach(function (el) { try { buildBlock(el); } catch (e) { if (window.console) console.warn("math-ex:", e); el.append(h("p", { class: "mx-err", text: "Есеп көрсетілмеді: " + e.message })); } });
    var first = blocks[0], sum = document.querySelector(".mx-sum");
    if (!sum && first && first.parentNode) { sum = h("p", { class: "mx-sum", "aria-live": "polite" }); first.parentNode.insertBefore(sum, first); }
    updateSummary();
  }

  /* ---------- Қорытып шығару блоктары ---------- */
  function initDerive() {
    var ds = document.querySelectorAll("details.math-derive");
    if (!ds.length) return;
    var anchor = document.querySelector(".mx-derive-tools");
    if (!anchor) { anchor = h("div", { class: "mx-derive-tools" }); ds[0].parentNode.insertBefore(anchor, ds[0]); }
    var all = h("button", { type: "button", class: "btn secondary", text: "Барлық қорытуды жасыру", onclick: function () {
      var open = all.dataset.open !== "0";
      ds.forEach(function (d) { d.open = !open; });
      all.dataset.open = open ? "0" : "1";
      all.textContent = open ? "Барлық қорытуды ашу" : "Барлық қорытуды жасыру";
    } });
    all.dataset.open = "1";
    anchor.append(all);
    var anyClosed = Array.prototype.some.call(ds, function (d) { return !d.open; });
    if (anyClosed) { all.dataset.open = "0"; all.textContent = "Барлық қорытуды ашу"; }
    /* бет басып шығарылғанда барлығы ашық */
    window.addEventListener("beforeprint", function () { ds.forEach(function (d) { d.open = true; }); });
  }

  /* =====================================================================
   *  Ортақ беттер: [data-math-app]
   * ===================================================================== */
  var PLAN = function () { return window.CS50KZ_MATH_PLAN || null; };
  var DATA_LOADED = {};
  function loadData(kind, slug) { /* kind: formulas | terms | problems | exam */
    var k = kind + ":" + slug;
    if (DATA_LOADED[k]) return DATA_LOADED[k];
    DATA_LOADED[k] = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = ROOT() + "assets/data/math-" + kind + "-" + slug + ".js";
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
    return DATA_LOADED[k];
  }
  var _root = null;
  function ROOT() {
    if (_root) return _root;
    var el = document.querySelector('script[src*="math-course.js"]');
    _root = el ? new URL("../../", el.src).href : "/";
    return _root;
  }
  var GLOBAL = { formulas: "CS50KZ_MATH_FORMULAS", terms: "CS50KZ_MATH_TERMS", problems: "CS50KZ_MATH_PROBLEMS", exam: "CS50KZ_MATH_EXAM" };
  function dataOf(kind, slug) { var g = window[GLOBAL[kind]]; return g && Array.isArray(g[slug]) ? g[slug] : []; }
  function lessonHref(plan, subjNo, lesson) {
    var s = plan.subjects[subjNo - 1];
    return ROOT() + "math/lectures/week-" + (s.start + lesson - 1) + ".html";
  }
  function emptyState(msg) { return h("div", { class: "mx-empty", role: "status" }, h("p", { text: msg || "Бұл бөлімнің мазмұны жақында қосылады." })); }

  function subjOptions(plan, withAll) {
    var opts = withAll ? [h("option", { value: "all", text: "Барлық пәндер" })] : [];
    plan.subjects.forEach(function (s) { opts.push(h("option", { value: s.slug, text: s.no + ". " + s.en })); });
    return opts;
  }
  function loadSubjects(kind, plan, which) {
    var list = which === "all" ? plan.subjects.map(function (s) { return s.slug; }) : [which];
    return Promise.all(list.map(function (sl) { return loadData(kind, sl); })).then(function () { return list; });
  }

  /* --- Формулалар анықтамалығы --- */
  function appFormulas(box, plan) {
    var sel = h("select", { class: "mx-sel", "aria-label": "Пән" }, subjOptions(plan, true));
    var q = h("input", { type: "search", class: "mx-search", placeholder: "Формуланы іздеу: квадрат, туынды, Байес...", "aria-label": "Формуланы іздеу", autocomplete: "off" });
    var out = h("div", { class: "mx-flist", "aria-live": "polite" }), info = h("p", { class: "mx-count" });
    box.append(h("div", { class: "mx-filters" }, h("label", null, "Пән ", sel), q, info), out);
    var hash0 = decodeURIComponent((location.hash || "").slice(1));
    if (hash0 && plan.subjects.some(function (s) { return s.slug === hash0; })) sel.value = hash0;
    var run = function () {
      loadSubjects("formulas", plan, sel.value).then(function (list) {
        var needle = q.value.trim().toLowerCase(), n = 0;
        out.textContent = "";
        list.forEach(function (sl) {
          var s = plan.subjects.filter(function (x) { return x.slug === sl; })[0];
          var rows = dataOf("formulas", sl).filter(function (f) { return !needle || (f.name + " " + (f.tags || []).join(" ") + " " + (f.note || "") + " " + (f.cond || "")).toLowerCase().indexOf(needle) >= 0 || (f.tex || "").toLowerCase().indexOf(needle) >= 0; });
          if (!rows.length) return;
          var sec = h("section", { class: "mx-fsec", id: "fs-" + sl }, h("h2", { class: "mx-fh", id: "f-" + sl, text: s.no + ". " + s.en }));
          rows.forEach(function (f) {
            n++;
            sec.append(h("article", { class: "mx-fitem", id: f.id }, h("h3", { text: f.name }), h("div", { class: "mx-ftex", html: esc("$$" + f.tex + "$$") }),
              f.cond ? h("p", { class: "mx-fcond", html: "Шарты: " + esc("$" + f.cond + "$") }) : null, f.note ? h("p", { class: "mx-fnote", html: rich(f.note) }) : null,
              f.lesson ? h("a", { class: "mx-flink", href: lessonHref(plan, s.no, f.lesson) + (f.anchor ? "#" + f.anchor : ""), text: "Сабақ: " + s.no + "." + f.lesson + " →" }) : null));
          });
          out.append(sec);
        });
        info.textContent = n ? "Табылған формула: " + n : "";
        if (!n) out.append(emptyState(needle ? "Ештеңе табылмады. Басқа сөзбен іздеп көріңіз." : "Бұл пәннің формулалары жақында қосылады."));
        renderMath(out);
      });
    };
    sel.addEventListener("change", run); q.addEventListener("input", run);
    run();
  }

  /* --- Терминдер сөздігі --- */
  function appGlossary(box, plan) {
    var sel = h("select", { class: "mx-sel", "aria-label": "Пән" }, subjOptions(plan, true));
    var q = h("input", { type: "search", class: "mx-search", placeholder: "Терминді іздеу: туынды, derivative...", "aria-label": "Терминді іздеу", autocomplete: "off" });
    var out = h("div", { class: "mx-tlist" }), info = h("p", { class: "mx-count" });
    box.append(h("div", { class: "mx-filters" }, h("label", null, "Пән ", sel), q, info), out);
    var run = function () {
      loadSubjects("terms", plan, sel.value).then(function (list) {
        var needle = q.value.trim().toLowerCase(), rows = [];
        list.forEach(function (sl) { var s = plan.subjects.filter(function (x) { return x.slug === sl; })[0]; dataOf("terms", sl).forEach(function (t) { rows.push({ t: t, s: s }); }); });
        rows = rows.filter(function (r) { return !needle || (r.t.kz + " " + r.t.en + " " + (r.t.def || "")).toLowerCase().indexOf(needle) >= 0; });
        rows.sort(function (a, b) { return a.t.kz.localeCompare(b.t.kz, "kk"); });
        out.textContent = "";
        rows.forEach(function (r) {
          out.append(h("article", { class: "mx-term", id: r.t.id }, h("h3", null, r.t.kz, " ", h("span", { class: "mx-ten", text: "(" + r.t.en + ")" })),
            r.t.def ? h("p", { html: rich(r.t.def) }) : null,
            h("p", { class: "mx-tmeta" }, h("span", { class: "mx-chip", text: r.s.no + ". " + r.s.en }), r.t.lesson ? h("a", { href: lessonHref(plan, r.s.no, r.t.lesson), text: " " + r.s.no + "." + r.t.lesson + "-сабақ →" }) : null)));
        });
        info.textContent = rows.length ? "Термин: " + rows.length : "";
        if (!rows.length) out.append(emptyState(needle ? "Ештеңе табылмады." : "Бұл пәннің терминдері жақында қосылады."));
        renderMath(out);
      });
    };
    sel.addEventListener("change", run); q.addEventListener("input", run);
    run();
  }

  /* --- Жаттықтырғыш: кездейсоқ параметрлік есептер --- */
  function appPractice(box, plan) {
    var LV = [["all", "Барлық деңгей"], ["easy", "Жеңіл"], ["medium", "Орташа"], ["hard", "Күрделі"]];
    var sel = h("select", { class: "mx-sel", "aria-label": "Пән" }, subjOptions(plan, true));
    var lv = h("select", { class: "mx-sel", "aria-label": "Қиындық" }, LV.map(function (x) { return h("option", { value: x[0], text: x[1] }); }));
    var cnt = h("select", { class: "mx-sel", "aria-label": "Сериядағы есеп саны" }, [5, 10, 15].map(function (n) { return h("option", { value: n, text: "Серия: " + n }); }));
    var start = h("button", { type: "button", class: "btn", text: "Серияны бастау" });
    var stage = h("div", { class: "mx-pstage", "aria-live": "polite" }), best = h("p", { class: "mx-count" });
    box.append(h("div", { class: "mx-filters" }, h("label", null, "Пән ", sel), h("label", null, "Қиындық ", lv), cnt, start, best), stage);
    var st = LS.get("cs50kz:math:practice", {}); if (!st || typeof st !== "object") st = {};
    var paint = function () { best.textContent = st.best != null ? "Үздік серия: " + st.best + "%" : ""; };
    paint();
    var pool = [];
    var run = function () {
      stage.textContent = "";
      loadSubjects("problems", plan, sel.value).then(function (list) {
        pool = [];
        list.forEach(function (sl) { dataOf("problems", sl).forEach(function (p) { if (lv.value === "all" || p.lvl === lv.value) pool.push(Object.assign({ _s: sl }, p)); }); });
        if (!pool.length) { stage.append(emptyState("Таңдалған сүзгі бойынша есеп жоқ. Есептер банкі жақында толықтырылады.")); return; }
        var n = Math.min(+cnt.value, pool.length * 3), seq = [], r = Math.random, i;
        for (i = 0; i < n; i++) seq.push(pool[Math.floor(r() * pool.length)]);
        var idx = 0, score = 0;
        var ask = function () {
          stage.textContent = "";
          var p = seq[idx], spec = p, seed = Math.floor(Math.random() * 2147483646) + 1, P;
          try { P = genParams(spec, seed); } catch (e) { idx++; if (idx < seq.length) ask(); return; }
          var fmt = function (t) { return interpolate(t, P); };
          var it = Object.assign({}, spec, { type: spec.type || "num", q: spec.q });
          if (it.type === "num") it.a = evalNumber(spec.a, P);
          if (it.type === "expr") { it.a = Object.keys(P).reduce(function (s, k) { return s.replace(new RegExp("\\b" + k + "\\b", "g"), "(" + fmtNum(P[k]) + ")"); }, spec.a); }
          if (it.type === "matrix") it.a = (Array.isArray(spec.a[0]) ? spec.a : spec.a.map(function (x) { return [x]; })).map(function (r2) { return r2.map(function (c) { return typeof c === "number" ? c : evalNumber(c, P); }); });
          if (it.type === "choice" && spec.o) it.o = spec.o.map(fmt);
          var b = buildItem(it, { key: "practice:" + p.id, type: it.type, scope: P, fmt: fmt }, 0);
          var res = h("p", { class: "mx-result", role: "status" });
          var ok1 = false, locked = false;
          var next = h("button", { type: "button", class: "btn", text: idx + 1 < seq.length ? "Келесі есеп →" : "Нәтижені көру", hidden: true, onclick: function () { idx++; if (idx < seq.length) ask(); else done(); } });
          var chk = h("button", { type: "button", class: "btn", text: "Тексеру", onclick: function () {
            if (locked) return;
            var r2 = b.check(); if (r2.empty) return;
            locked = true; ok1 = !!r2.ok; if (ok1) score++;
            res.className = "mx-result " + (ok1 ? "ok" : "bad"); res.textContent = ok1 ? "✓ Дұрыс!" : "Қате. Дұрыс жауап төменде.";
            if (!ok1) b.showAnswer();
            chk.disabled = true; next.hidden = false; next.focus();
          } });
          var bar = h("div", { class: "mx-pbar" }, h("span", { style: "width:" + Math.round(idx / seq.length * 100) + "%" }));
          var s = plan.subjects.filter(function (x) { return x.slug === p._s; })[0];
          stage.append(h("div", { class: "mx-phead" }, h("span", { class: "mx-chip", text: (s ? s.no + ". " + s.en : "") }), h("span", { class: "mx-chip lv-" + (p.lvl || ""), text: (LV.filter(function (x) { return x[0] === p.lvl; })[0] || ["", ""])[1] }), h("b", { text: "Есеп " + (idx + 1) + " / " + seq.length })), bar, b.el, h("div", { class: "mx-ctrl" }, chk, next), res);
          renderMath(stage);
          var focus = stage.querySelector("input,select"); if (focus && window.matchMedia && !matchMedia("(pointer: coarse)").matches) focus.focus();
        };
        var done = function () {
          var pct = Math.round(score / seq.length * 100);
          if (st.best == null || pct > st.best) st.best = pct;
          st.n = (st.n || 0) + 1; st.last = pct; LS.set("cs50kz:math:practice", st); paint();
          if (K().logDay) K().logDay();
          stage.textContent = "";
          stage.append(h("div", { class: "mx-pdone" }, h("h3", { text: "Серия аяқталды" }), h("p", { text: "Нәтиже: " + score + " / " + seq.length + " (" + pct + "%)" }), h("button", { type: "button", class: "btn", text: "Тағы бір серия", onclick: run })));
        };
        ask();
      });
    };
    start.addEventListener("click", run);
    stage.append(h("p", { class: "mx-hint0", text: "Пән мен қиындықты таңдап, «Серияны бастау» батырмасын басыңыз. Әр есептің сандары кездейсоқ өзгереді." }));
  }

  /* --- Курс беті: пән карточкаларының оқу барысы (пәндер тәуелсіз, граф/алғышарт жоқ) --- */
  function readSet() {
    var p = (K().readJson ? K().readJson("cs50kz:progress", {}) : LS.get("cs50kz:progress", {})) || {};
    return p.read && typeof p.read === "object" ? p.read : {};
  }
  function appHome(box, plan) {
    var read = readSet();
    var stat = {};
    plan.subjects.forEach(function (s) {
      var ready = 0, rd = 0, i;
      var sec = document.getElementById("subj-" + s.no);
      for (i = 0; i < s.count; i++) {
        var id = "week-" + (s.start + i);
        var card = sec && sec.querySelector('.week-card[data-id="' + id + '"]');
        if (card && !card.classList.contains("soon")) { ready++; if (read["math:" + id]) { rd++; card.classList.add("is-read"); var stt = card.querySelector(".status"); if (stt) stt.textContent = "Оқылды ✓"; } }
      }
      stat[s.no] = { ready: ready, read: rd, plan: s.count };
      if (sec) {
        var bar = sec.querySelector(".mx-sbar i"); if (bar) bar.style.width = (s.count ? Math.round(rd / s.count * 100) : 0) + "%";
        var rdEl = sec.querySelector(".mx-sread"); if (rdEl) rdEl.textContent = rd;
      }
    });
    homeFilter();
  }

  /* Курс беті: пәндерді оқу жолының кезеңі бойынша сүзу (батырмалар: tools/math_pedagogy.py, «mfilter») */
  function homeFilter() {
    var bar = document.querySelector(".mx-filter");
    if (!bar) return;
    var KEY = "cs50kz:math:stage";
    function apply(stage) {
      bar.querySelectorAll(".mx-fchip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.stage === stage)); });
      document.querySelectorAll(".mx-subj").forEach(function (sec) { sec.classList.toggle("is-hidden", stage !== "" && sec.dataset.stage !== stage); });
      document.querySelectorAll(".mx-group-h").forEach(function (hd) {
        var any = false, el = hd.nextElementSibling;
        while (el && !el.classList.contains("mx-group-h")) { if (el.classList.contains("mx-subj") && !el.classList.contains("is-hidden")) any = true; el = el.nextElementSibling; }
        hd.classList.toggle("is-hidden", !any);
      });
      try { if (stage) sessionStorage.setItem(KEY, stage); else sessionStorage.removeItem(KEY); } catch (e) { /* жад жоқ */ }
    }
    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".mx-fchip");
      if (b) apply(b.dataset.stage);
    });
    // жасырылған пәнге сілтеме («Пәндерге өту», «Алдымен: ...») басылса, сүзгі алынады
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#subj-"]');
      var sec = a && document.getElementById(a.getAttribute("href").slice(1));
      if (sec && sec.classList.contains("is-hidden")) apply("");
    }, true);
    var saved = "";
    try { saved = sessionStorage.getItem(KEY) || ""; } catch (e) { /* жад жоқ */ }
    if (saved && bar.querySelector('.mx-fchip[data-stage="' + saved + '"]') && !location.hash) apply(saved);
  }

  /* --- Оқу жолы: оқылған сабақтарды белгілеу және келесі қадам (math/route.html, tools/math_pedagogy.py) --- */
  function appRoute(box, plan) {
    var read = readSet(), next = null, total = 0, done = 0;
    document.querySelectorAll(".mx-rsubj").forEach(function (sec) {
      var all = 0, rd = 0;
      sec.querySelectorAll("li[data-id]").forEach(function (li) {
        var a = li.querySelector("a");
        if (!a) return;
        all++; total++;
        if (read["math:" + li.dataset.id]) { rd++; done++; li.classList.add("is-read"); li.insertBefore(h("span", { class: "mx-rok", "aria-label": "оқылды", text: "✓ " }), li.firstChild); }
        else if (!next) next = { a: a, sec: sec };
      });
      if (all && rd === all) sec.classList.add("is-done");
    });
    var pct = total ? Math.round(done / total * 100) : 0;
    box.append(h("div", { class: "mx-rnow" },
      h("p", null, "Оқылды: ", h("b", { text: done + " / " + total }), " дайын сабақ (" + pct + "%)"),
      h("div", { class: "mx-pbar", "aria-hidden": "true" }, h("span", { style: "width:" + pct + "%" })),
      next ? h("p", null, done ? "Келесі қадам: " : "Бастау: ", h("a", { class: "btn", href: next.a.getAttribute("href"), text: next.sec.querySelector("h3").textContent.replace(/^\d+/, "") + " · " + next.a.textContent + " →" }))
           : h("p", { text: total ? "Барлық дайын сабақ оқылды. Пән емтихандарын тапсырыңыз." : "" })));
  }

  /* --- Пән емтиханы: әр сабақтан тест сұрағы + орташа + күрделі есеп; соңында бір рет тексеру (math/exam.html) --- */
  function appExam(box, plan) {
    var have = (box.getAttribute("data-subjects") || "").split(",").filter(Boolean);
    var subs = plan.subjects.filter(function (s) { return have.indexOf(s.slug) >= 0; });
    if (!subs.length) { box.append(emptyState("Емтихан үшін дайын пән әлі жоқ.")); return; }
    var LVN = { quiz: "Тест", easy: "Жеңіл", medium: "Орташа", hard: "Күрделі" }, MIN = { quiz: 1.5, easy: 2, medium: 4, hard: 6 };
    var sel = h("select", { class: "mx-sel", "aria-label": "Пән" }, subs.map(function (s) { return h("option", { value: s.slug, text: s.no + ". " + s.en }); }));
    var start = h("button", { type: "button", class: "btn", text: "Емтиханды бастау" });
    var best = h("p", { class: "mx-count" }), stage = h("div", { class: "mx-estage" });
    box.append(h("div", { class: "mx-filters" }, h("label", null, "Пән ", sel), start, best), stage);
    var st = LS.get("cs50kz:math:exam", {}); if (!st || typeof st !== "object") st = {};
    var paint = function () { var r = st[sel.value]; best.textContent = r ? "Үздік нәтиже: " + r.best + "% · соңғысы: " + r.last + "%" : ""; };
    var hs = ""; try { hs = new URLSearchParams(location.search).get("s") || ""; } catch (e) { /* ескі браузер */ }
    if (have.indexOf(hs) >= 0) sel.value = hs;
    paint();
    sel.addEventListener("change", function () { paint(); stage.textContent = ""; stage.append(h("p", { class: "mx-hint0", text: "«Емтиханды бастау» батырмасын басыңыз." })); try { history.replaceState(null, "", "?s=" + sel.value); } catch (e) { /* */ } });
    var pick = function (arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; };
    var run = function () {
      var slug = sel.value, s = subs.filter(function (x) { return x.slug === slug; })[0];
      stage.textContent = "";
      loadData("exam", slug).then(function () {
        var bank = dataOf("exam", slug);
        if (!bank.length) { stage.append(emptyState("Бұл пәннің емтихан банкі жүктелмеді.")); return; }
        var seq = [], l, used = {};
        for (l = 1; l <= s.count; l++) {
          var lb = bank.filter(function (x) { return x.l === l; });
          if (!lb.length) continue;
          ["quiz", "medium", "hard"].forEach(function (lv) {
            var c = pick(lb.filter(function (x) { return x.lvl === lv && !used[x.id]; })) || pick(lb.filter(function (x) { return x.lvl !== "quiz" && !used[x.id]; }));
            if (c) { used[c.id] = 1; seq.push(c); }
          });
        }
        var mins = Math.round(seq.reduce(function (m, x) { return m + (MIN[x.lvl] || 3); }, 0) / 5) * 5, t0 = Date.now();
        var clock = h("span", { class: "mx-chip", text: "0:00" });
        var tick = setInterval(function () { var t = Math.floor((Date.now() - t0) / 1000); clock.textContent = Math.floor(t / 60) + ":" + ("0" + t % 60).slice(-2); }, 1000);
        var fs = h("fieldset", { class: "mx-exam" }, h("legend", { class: "sr-only", text: s.en + " емтиханы" }));
        var built = seq.map(function (it, i) {
          var b = buildItem(Object.assign({}, it), { key: "exam:" + slug + ":" + it.id, type: it.type, scope: {}, fmt: function (x) { return x; } }, 0);
          var card = h("section", { class: "mx-eitem", "aria-label": "Сұрақ " + (i + 1) },
            h("div", { class: "mx-phead" }, h("b", { text: (i + 1) + "." }), h("span", { class: "mx-chip", text: it.l + "-сабақ" }), h("span", { class: "mx-chip lv-" + it.lvl, text: LVN[it.lvl] || "" })),
            it.ctx ? h("p", { class: "mx-ectx", html: rich(it.ctx) }) : null, b.el);
          fs.append(card);
          return { b: b, it: it, card: card };
        });
        var res = h("div", { class: "mx-eres", role: "status", "aria-live": "polite" });
        var submit = h("button", { type: "button", class: "btn gold", text: "Тапсыру және тексеру" });
        stage.append(h("div", { class: "mx-phead" }, h("b", { text: s.no + ". " + s.en }), h("span", { class: "mx-chip", text: seq.length + " сұрақ" }), h("span", { class: "mx-chip", text: "ұсынылған уақыт ≈ " + mins + " мин" }), clock),
          h("p", { class: "mx-hint0", text: "Барлық сұраққа жауап беріп, соңында «Тапсыру» батырмасын басыңыз. Жауаптар тек сонда тексеріледі; бос сұрақ қате саналады. Өту шегі - 70%." }),
          fs, h("div", { class: "mx-ctrl" }, submit), res);
        renderMath(stage);
        submit.addEventListener("click", function () {
          var empty = built.filter(function (x) { return x.b.wd.check().empty; }).length;
          if (empty && !submit.dataset.armed) { /* бос сұрақ болса, бір рет ескертіп, екінші басуды күтеміз */
            submit.dataset.armed = "1"; submit.textContent = "Бәрібір тапсыру";
            res.textContent = ""; res.append(h("p", { class: "mx-fail", text: empty + " сұраққа жауап берілмеген: олар қате саналады. Тапсыру үшін батырманы тағы бір рет басыңыз." }));
            return;
          }
          clearInterval(tick);
          var score = 0, per = {};
          built.forEach(function (x) {
            var r = x.b.check(), ok = !!(r && r.ok && !r.empty);
            if (!ok) x.b.showAnswer();
            x.card.classList.add(ok ? "ok" : "bad");
            per[x.it.l] = per[x.it.l] || [0, 0]; per[x.it.l][1]++; if (ok) { per[x.it.l][0]++; score++; }
          });
          fs.disabled = true; submit.disabled = true;
          var pct = Math.round(score / built.length * 100);
          var r0 = st[slug] || { best: 0, n: 0 };
          st[slug] = { best: Math.max(r0.best || 0, pct), last: pct, n: (r0.n || 0) + 1, ts: Date.now() };
          LS.set("cs50kz:math:exam", st); paint();
          if (K().logDay) K().logDay();
          var verdict = pct >= 85 ? "Өте жақсы: емтихан тапсырылды." : pct >= 70 ? "Емтихан тапсырылды." : "Емтихан тапсырылмады: 70%-ға жетпеді. Әлсіз сабақтарды қайталап, қайта тапсырыңыз.";
          var rows = Object.keys(per).map(function (k) {
            var p = per[k], weak = p[0] < p[1];
            return h("tr", { class: weak ? "weak" : "" }, h("td", null, h("a", { href: lessonHref(plan, s.no, +k), text: k + ". " + s.lessons[k - 1] })), h("td", { text: p[0] + " / " + p[1] }), h("td", { text: weak ? "қайталаңыз" : "✓" }));
          });
          res.textContent = "";
          res.append(h("h3", { text: "Нәтиже: " + score + " / " + built.length + " (" + pct + "%)" }), h("p", { class: pct >= 70 ? "mx-pass" : "mx-fail", text: verdict }),
            h("div", { class: "math-table" }, h("table", null, h("thead", null, h("tr", null, h("th", { text: "Сабақ" }), h("th", { text: "Дұрыс" }), h("th", { text: "" }))), h("tbody", null, rows))),
            h("p", { class: "mx-hint0", text: "Қате жауаптардың астында дұрыс жауап пен түсіндірме көрсетілді." }),
            h("button", { type: "button", class: "btn", text: "Жаңа нұсқа", onclick: run }));
          res.scrollIntoView({ block: "start" });
        });
      });
    };
    start.addEventListener("click", run);
    stage.append(h("p", { class: "mx-hint0", text: "Пәнді таңдап, «Емтиханды бастау» батырмасын басыңыз. Әр сабақтан бір тест сұрағы, бір орташа және бір күрделі есеп алынады; әр жолы сұрақтар өзгереді." }));
  }

  function initApps() {
    var box = document.querySelector("[data-math-app]");
    if (!box) return;
    var kind = box.getAttribute("data-math-app");
    var go = function () {
      var plan = PLAN();
      if (!plan) { box.append(emptyState("Курс жоспары жүктелмеді.")); return; }
      box.querySelectorAll(".mx-loading").forEach(function (n) { n.remove(); });
      try {
        if (kind === "formulas") appFormulas(box, plan);
        else if (kind === "glossary") appGlossary(box, plan);
        else if (kind === "practice") appPractice(box, plan);
        else if (kind === "home") appHome(box, plan);
        else if (kind === "route") appRoute(box, plan);
        else if (kind === "exam") appExam(box, plan);
      } catch (e) { if (window.console) console.warn("math-app:", e); box.append(emptyState("Бет жүктелмеді: " + e.message)); }
    };
    go();
  }

  function init() {
    renderMath(document.querySelector("main, .content, article") || document.body);
    initDerive();
    initExercises();
    initApps();
    API.ready = true;
    document.dispatchEvent(new CustomEvent("math:ready"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);
