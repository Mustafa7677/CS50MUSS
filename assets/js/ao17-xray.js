/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 X-RAY (tools/academy/xray.py -> academy/xray.html): Python кодының рентгені. Код нағыз Python-да (Pyodide, сайттың
   ортақ CS50KZ.getPyodide()) орындалады, assets/py/xray_trace.py әр байт-код нұсқауының алдындағы күйді жазады. Мұнда бір
   уақыт жолағы жеті қабатты бірге жылжытады: бастапқы кодтағы нақты өрнек, AST түйіні, байт-код нұсқауы, шақыру стегі,
   шақыру ағашы, есептеу, машина деңгейі (3D зертхана). Айнымалының атын басса - мәні жазылған нұсқауға кері оралады.
   Сақтау: «ao17cs:xray» - {code: {мысал|free: код}, ex, runs}. Сілтеме: xray.html#ex=<мысал>. */
(function () {
  "use strict";
  var root = document.querySelector("[data-xray]"), box = document.getElementById("xr-data");
  if (!root || !box) return;
  var D;
  try { D = JSON.parse(box.textContent); } catch (e) { return; }
  var KEY = "ao17cs:xray", NS = "http://www.w3.org/2000/svg";
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function $(s) { return root.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var st = obj(J(KEY, {}));
  st.code = obj(st.code);
  function save() { S(KEY, st); }
  var EX = {}; D.examples.forEach(function (e) { EX[e.id] = e; });
  var ta = $("[data-xr-code]"), runB = $("[data-xr-run]"), status = $("[data-xr-status]"), src = $("[data-xr-src]"), outEl = $("[data-xr-out]");
  var slider = $("[data-xr-slider]"), posEl = $("[data-xr-pos]"), gran = $("[data-xr-gran]"), playB = $("[data-xr-play]");
  var still = !!(window.AO17Reveal && window.AO17Reveal.still) || document.documentElement.classList.contains("reduce-motion")
    || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var cur = "fact", R = null, step = 0, timer = 0, py = null, AN = [], lines = [], lineOf = [], callEv = [], lastCode = -1;
  var ed = window.AO17Editor ? window.AO17Editor.attach(ta, { onRun: function () { go(); }, onInput: function () { st.code[cur] = ta.value; save(); } })
    : { mark: function () {}, refresh: function () {} };

  // ------------------------------------------------------------------ байт-код нұсқауларының қазақша түсіндірмесі
  var OPS = {
    RESUME: "Функцияның басы: виртуал машина орындауды бастайды (қызмет нұсқауы).",
    NOP: "Ештеңе істемейді.",
    LOAD_FAST: "Жергілікті айнымалының мәнін мәндер стегіне салады.",
    LOAD_FAST_LOAD_FAST: "Екі жергілікті айнымалыны қатар стекке салады.",
    LOAD_FAST_CHECK: "Айнымалыны (мәні барын тексеріп) стекке салады.",
    LOAD_FAST_AND_CLEAR: "Айнымалыны стекке салып, өзін тазалайды (тізім өрнегі ішінде).",
    LOAD_CONST: "Тұрақты мәнді (сан, жол, None) стекке салады.",
    LOAD_GLOBAL: "Глобал атауды (функция не айнымалы) тауып, стекке салады.",
    LOAD_NAME: "Атаудың мәнін (модуль деңгейінде) стекке салады.",
    LOAD_ATTR: "Нысанның қасиетін не әдісін алады: x.append сияқты.",
    LOAD_DEREF: "Сыртқы функцияның айнымалысын алады (тұйықталу).",
    STORE_FAST: "Стектің жоғарғы мәнін жергілікті айнымалыға жазады: x = ...",
    STORE_FAST_STORE_FAST: "Стектің екі мәнін екі айнымалыға жазады.",
    STORE_FAST_LOAD_FAST: "Бір айнымалыға жазып, екіншісін стекке салады.",
    STORE_NAME: "Стектің жоғарғы мәнін модуль айнымалысына жазады: x = ...",
    STORE_GLOBAL: "Мәнді глобал айнымалыға жазады.",
    STORE_SUBSCR: "Тізім не сөздік элементіне жазады: x[i] = ...",
    STORE_DEREF: "Сыртқы функцияның айнымалысына жазады.",
    BINARY_OP: "Стектің екі жоғарғы мәнімен амал жасап, нәтижені стекке салады.",
    BINARY_SUBSCR: "Элементті алады: x[i].",
    COMPARE_OP: "Екі мәнді салыстырып, True не False салады.",
    CONTAINS_OP: "in / not in тексерісі.",
    IS_OP: "is / is not тексерісі.",
    TO_BOOL: "Мәнді True не False-қа айналдырады (шартқа дайындық).",
    UNARY_NEGATIVE: "Таңбаны ауыстырады: -x.",
    UNARY_NOT: "Логикалық терісі: not x.",
    POP_JUMP_IF_FALSE: "Шарт жалған болса, көрсетілген нұсқауға секіреді: if-тің ішін аттап өтеді.",
    POP_JUMP_IF_TRUE: "Шарт ақиқат болса, көрсетілген нұсқауға секіреді.",
    POP_JUMP_IF_NONE: "Мән None болса, секіреді.",
    POP_JUMP_IF_NOT_NONE: "Мән None болмаса, секіреді.",
    JUMP_FORWARD: "Алға секіреді: else бөлігін аттап өтеді.",
    JUMP_BACKWARD: "Артқа секіреді: циклдің басына оралу. Цикл деген - осы кері секіріс.",
    JUMP_BACKWARD_NO_INTERRUPT: "Артқа секіреді (қызмет циклі).",
    GET_ITER: "Тізбектен итератор жасайды: for циклінің дайындығы.",
    FOR_ITER: "Итератордан келесі мәнді алады; мән таусылса, циклден шығып кетеді.",
    END_FOR: "Цикл бітті: итераторды стектен алып тастайды.",
    CALL: "Функцияны шақырады: стекке жаңа жақтау қосылады.",
    CALL_KW: "Функцияны атаулы аргументтермен шақырады.",
    CALL_INTRINSIC_1: "Python-ның ішкі қызметтік функциясы.",
    PUSH_NULL: "Шақыруға дайындық (қызмет нұсқауы).",
    KW_NAMES: "Атаулы аргументтердің аттары.",
    RETURN_VALUE: "Функциядан мән қайтарады: жақтау жабылады, стек кішірейеді.",
    RETURN_CONST: "Тұрақты мәнді қайтарады: жақтау жабылады.",
    POP_TOP: "Стектің жоғарғы мәнін тастайды (мысалы, print() қайтарған None).",
    COPY: "Стектегі мәннің көшірмесін жасайды.",
    SWAP: "Стектегі екі мәннің орнын ауыстырады.",
    MAKE_FUNCTION: "def: код нысанынан функция жасайды (функция әлі шақырылған жоқ).",
    SET_FUNCTION_ATTRIBUTE: "Функцияның қосымша бөлігін орнатады.",
    BUILD_LIST: "Стектегі мәндерден тізім жасайды.",
    BUILD_TUPLE: "Стектегі мәндерден кортеж жасайды.",
    BUILD_MAP: "Сөздік жасайды.",
    BUILD_SET: "Жиын жасайды.",
    BUILD_STRING: "f-жолдың бөліктерін біріктіреді.",
    LIST_APPEND: "Тізімге элемент қосады.",
    LIST_EXTEND: "Тізімді кеңейтеді.",
    FORMAT_VALUE: "f-жолдағы мәнді мәтінге айналдырады.",
    FORMAT_SIMPLE: "f-жолдағы мәнді мәтінге айналдырады.",
    CONVERT_VALUE: "Мәнді str/repr арқылы түрлендіреді.",
    UNPACK_SEQUENCE: "Тізбекті бөлшектеп, бірнеше айнымалыға береді: a, b = ...",
    RETURN_GENERATOR: "Генератор жасайды.",
    YIELD_VALUE: "Генератор мәнді береді де, кідіреді.",
    MAKE_CELL: "Тұйықталу айнымалысына орын дайындайды.",
    COPY_FREE_VARS: "Сыртқы айнымалыларды көшіреді (тұйықталу).",
    LOAD_BUILD_CLASS: "class жасауға дайындық.",
    PUSH_EXC_INFO: "Қатені өңдеуге кірісу (try/except).",
    POP_EXCEPT: "Қатені өңдеу бітті.",
    CHECK_EXC_MATCH: "Қате except-тегі түрге сәйкес пе.",
    RERAISE: "Қатені қайта лақтырады.",
    RAISE_VARARGS: "Қате лақтырады: raise.",
    EXTENDED_ARG: "Үлкен аргументке арналған қызмет нұсқауы."
  };
  var BIN = { "+": "қосу", "-": "азайту", "*": "көбейту", "/": "бөлу", "//": "бүтін бөлу", "%": "қалдық", "**": "дәреже", "+=": "қосып жазу", "-=": "азайтып жазу", "*=": "көбейтіп жазу" };
  function opText(op, arg) {
    var t = OPS[op] || "Python виртуал машинасының нұсқауы.";
    if (op === "BINARY_OP" && BIN[arg]) t = "Стектің екі жоғарғы мәнін алып, " + BIN[arg] + " амалын (" + arg + ") жасайды да, нәтижені стекке салады.";
    return t;
  }
  // машина деңгейі: нұсқауды орындайтын аппаратура (3D зертхана сабағы)
  var HW = {}; (D.machine || []).forEach(function (m) { HW[m.id] = m; });
  function machine(op, arg) {
    var id, why;
    if (op === "BINARY_OP" && /^[+-]=?$/.test(arg)) { id = "arch-4-adder"; why = "Қосу мен азайтуды процессордың қосындылағышы орындайды: ол логикалық элементтерден құралған."; }
    else if (op === "BINARY_OP") { id = "arch-2-arith"; why = "Көбейту мен бөлу - екілік арифметика: процессор оны жылжыту мен қосу арқылы жасайды."; }
    else if (/JUMP|FOR_ITER|COMPARE_OP|TO_BOOL/.test(op)) { id = "arch-11-branch"; why = "Шартты секіріс процессор үшін қымбат: ол қай жаққа секіретінін алдын ала болжауға тырысады."; }
    else if (/^(CALL|RETURN|RESUME|PUSH_NULL)/.test(op)) { id = "arch-6-asm"; why = "Функция шақыру ассемблерде стек пен қайту адресі арқылы жасалады."; }
    else if (/^(LOAD|STORE)/.test(op)) { id = "arch-7-memory"; why = "Айнымалы - жадтағы мекенжай: оқу мен жазу жад пен кэш арқылы өтеді."; }
    else { id = "arch-5-cpu"; why = "Әр нұсқау процессорда «алу - декодтау - орындау» циклымен жүреді."; }
    var m = HW[id] || { href: "3d/arch/" + id + ".html", title: "3D зертхана" };
    return '<a href="' + esc(m.href) + '">' + esc(m.title) + "</a> - " + esc(why);
  }

  // ------------------------------------------------------------------ Python
  function setStatus(t, cls) { status.textContent = t; status.className = "xr-status" + (cls ? " " + cls : ""); }
  async function boot() {
    try {
      for (var i = 0; i < 200 && !(window.CS50KZ && typeof window.CS50KZ.getPyodide === "function"); i++) await new Promise(function (r) { setTimeout(r, 50); });
      if (!window.CS50KZ || typeof window.CS50KZ.getPyodide !== "function") throw new Error("Python жүктегіш табылмады");
      var p = await window.CS50KZ.getPyodide();
      var res = await fetch(new URL("../assets/py/xray_trace.py", location.href));
      if (!res.ok) throw new Error("xray_trace.py жүктелмеді");
      p.globals.set("XR_SRC", await res.text());
      p.runPython("import sys, types\n_m = types.ModuleType('xray_trace')\nexec(XR_SRC, _m.__dict__)\nsys.modules['xray_trace'] = _m\ndel _m");
      py = p;
      runB.disabled = false;
      setStatus("Python дайын", "ok");
    } catch (e) {
      setStatus("Python жүктелмеді: " + (e && e.message ? e.message : e) + ". Желіні тексеріп, бетті жаңарт.", "bad");
    }
  }
  function go() {
    if (!py) return;
    var code = ta.value;
    st.code[cur] = code; st.runs = (st.runs || 0) + 1; save();
    try {
      py.globals.set("XR_CODE", code);
      R = JSON.parse(py.runPython("import xray_trace\nxray_trace.xray(XR_CODE)"));
    } catch (e) {
      R = { ast: null, codes: [], snaps: [], steps: [], calls: [], out: "", total: { ins: 0, calls: 0, depth: 0 }, err: { msg: "Python қатесі.", py: String(e && e.message ? e.message : e).split("\n").filter(Boolean).slice(-1)[0], line: 0 } };
    }
    R.src = code;
    prepare();
    if (R.err && !R.steps.length) {
      setStatus("Қате бар", "bad");
      outEl.textContent = "Қате" + (R.err.line ? " (" + R.err.line + "-жол)" : "") + ": " + R.err.msg + (R.err.py ? "\nPython: " + R.err.py : "");
      outEl.className = "xr-out bad";
      ed.mark(R.err.line || 0, true);
      return;
    }
    edit(false);
    setStatus(R.err ? "Қатемен тоқтады: " + R.total.ins + " нұсқау" : "Рентген дайын: " + R.total.ins + " нұсқау, " + R.total.calls + " шақыру", R.err ? "bad" : "ok");
    $("[data-xr-time]").hidden = false;
    slider.max = String(Math.max(0, R.steps.length - 1));
    renderAst(); renderTree();
    lastCode = -1;
    show(0);
    var cp = $(".xr-p-code");
    if (cp && !still) { cp.classList.remove("scan"); void cp.offsetWidth; cp.classList.add("scan"); }
    if (window.CS50KZ && typeof window.CS50KZ.check === "function") window.CS50KZ.check();
  }
  runB.addEventListener("click", go);

  // ------------------------------------------------------------------ дайындық: жолдар, AST тізімі, қадам индекстері
  function prepare() {
    lines = String(R.src || "").replace(/\n$/, "").split("\n");
    AN = [];
    (function flat(n, parent, depth) {
      if (!n) return;
      AN[n.i] = { n: n, p: parent, d: depth };
      (n.k || []).forEach(function (k) { flat(k, n.i, depth + 1); });
    })(R.ast, -1, 0);
    lineOf = []; var last = 0;
    R.steps.forEach(function (s, i) { var ins = insAt(s); var l = ins && ins[3] > 0 ? ins[3] : last; lineOf[i] = l; last = l; });
    var ev = {};
    R.calls.forEach(function (c) { if (c.fn !== "<module>") { ev[c.s] = 1; if (c.e != null) ev[c.e] = 1; } });
    callEv = Object.keys(ev).map(Number).sort(function (a, b) { return a - b; });
  }
  function insAt(s) {
    var co = R.codes[s[0]];
    if (!co) return null;
    if (!co._by) { co._by = {}; co.ins.forEach(function (x, j) { co._by[x[0]] = j; }); }
    var j = co._by[s[1]];
    return j == null ? null : co.ins[j];
  }

  // ------------------------------------------------------------------ 1. бастапқы код: нақты өрнек
  function edit(on, focus) {
    ta.parentNode.hidden = !on; src.hidden = on; $("[data-xr-editrow]").hidden = on;
    if (on) { stop(); if (focus) ta.focus(); }
  }
  $("[data-xr-edit]").addEventListener("click", function () { edit(true, true); });
  function drawSrc(ins, bad) {
    var h = "", l1 = ins ? ins[3] : -1, c1 = ins ? ins[4] : -1, l2 = ins ? ins[5] : -1, c2 = ins ? ins[6] : -1;
    lines.forEach(function (ln, k) {
      var n = k + 1, body;
      var inside = l1 > 0 && n >= l1 && n <= l2;
      if (inside && c1 >= 0 && c2 >= 0 && l1 === l2) body = esc(ln.slice(0, c1)) + "<mark>" + esc(ln.slice(c1, c2) || " ") + "</mark>" + esc(ln.slice(c2));
      else if (inside && l1 !== l2) body = esc(ln.slice(0, n === l1 && c1 >= 0 ? c1 : 0)) + "<mark>" + esc(ln.slice(n === l1 && c1 >= 0 ? c1 : 0, n === l2 && c2 >= 0 ? c2 : ln.length) || " ") + "</mark>" + esc(n === l2 && c2 >= 0 ? ln.slice(c2) : "");
      else body = esc(ln) || " ";
      h += '<div class="xr-ln' + (n === lineOf[step] ? " on" : "") + (bad && n === bad ? " bad" : "") + '"><span class="xr-lnn" aria-hidden="true">' + n + "</span><code>" + body + "</code></div>";
    });
    src.innerHTML = h;
  }

  // ------------------------------------------------------------------ 2. AST
  function renderAst() {
    var box = $("[data-xr-ast]");
    if (!R.ast) { box.innerHTML = '<p class="xr-empty">AST жоқ.</p>'; return; }
    function li(n) {
      return '<li><span class="xr-an" data-ai="' + n.i + '"><b>' + esc(n.t) + "</b>" + (n.v ? " <i>" + esc(n.v) + "</i>" : "") + "</span>"
        + (n.k ? "<ul>" + n.k.map(li).join("") + "</ul>" : "") + "</li>";
    }
    box.innerHTML = '<ul class="xr-tree-l">' + li(R.ast) + "</ul>";
  }
  function before(a1, b1, a2, b2) { return a1 < a2 || (a1 === a2 && b1 <= b2); }
  function astAt(ins) {   // нұсқаудың аралығын қамтитын ең терең түйін
    if (!ins || ins[3] < 1 || ins[4] < 0) return -1;
    var best = -1, bd = -1;
    AN.forEach(function (a, i) {
      var p = a && a.n.p;
      if (!p) return;
      if (before(p[0], p[1], ins[3], ins[4]) && before(ins[5], ins[6], p[2], p[3]) && a.d > bd) { best = i; bd = a.d; }
    });
    return best;
  }
  function markAst(ins) {
    var box = $("[data-xr-ast]"), id = astAt(ins), path = {};
    for (var i = id; i >= 0; i = AN[i] ? AN[i].p : -1) path[i] = 1;
    $$(".xr-an").forEach(function (s) { var k = Number(s.getAttribute("data-ai")); s.classList.toggle("on", k === id); s.classList.toggle("path", !!path[k] && k !== id); });
    var on = box.querySelector(".xr-an.on");
    if (on) box.scrollTop = Math.max(0, on.offsetTop - box.clientHeight / 2);
  }

  // ------------------------------------------------------------------ 3. байт-код
  function drawBc(s) {
    var co = R.codes[s[0]], list = $("[data-xr-bc]");
    if (s[0] !== lastCode) {
      lastCode = s[0];
      $("[data-xr-bcfn]").textContent = co.n === "<module>" ? "Модульдің байт-коды" : co.n + " функциясының байт-коды";
      list.innerHTML = co.ins.map(function (x) {
        return '<li data-off="' + x[0] + '"><span class="xr-off">' + x[0] + "</span><b>" + esc(x[1]) + "</b>" + (x[2] ? ' <span class="xr-arg">' + esc(x[2]) + "</span>" : "") + "</li>";
      }).join("");
    }
    var on = null;
    Array.prototype.forEach.call(list.children, function (li) { var k = Number(li.getAttribute("data-off")) === s[1]; li.classList.toggle("on", k); if (k) on = li; });
    if (on) list.scrollTop = Math.max(0, on.offsetTop - list.clientHeight / 2);
    var ins = insAt(s);
    $("[data-xr-op]").innerHTML = ins ? "<b>" + esc(ins[1]) + "</b>" + (ins[2] ? " " + esc(ins[2]) : "") + ": " + esc(opText(ins[1], ins[2])) : "";
    $("[data-xr-hwl]").innerHTML = ins ? machine(ins[1], ins[2]) : "";
  }

  // ------------------------------------------------------------------ 4. шақыру стегі
  function callLabel(cid) {
    var c = R.calls[cid];
    if (cid === 0 || (c && c.fn === "<module>")) return "Модуль (глобал айнымалылар)";
    return c ? c.fn + "(" + c.a + ")" : "…";
  }
  function drawStack(s, prev) {
    var snap = R.snaps[s[3]] || [], old = {}, h = "";
    if (prev) (R.snaps[prev[3]] || []).forEach(function (f) { f[1].forEach(function (v) { old[f[0] + "|" + v[0]] = v[1]; }); });
    for (var j = snap.length - 1; j >= 0; j--) {
      var f = snap[j], top = j === snap.length - 1;
      h += '<div class="xr-fr' + (top ? " top" : "") + '"><p class="xr-frh">' + esc(callLabel(f[0])) + (top ? " <span>қазір</span>" : "") + "</p>";
      h += f[1].length ? '<dl class="xr-vars">' + f[1].map(function (v) {
        var chg = prev && old[f[0] + "|" + v[0]] !== v[1];
        return '<div class="' + (chg ? "chg" : "") + '"><dt><button type="button" class="xr-var" data-cid="' + f[0] + '" data-name="' + esc(v[0]) + '" title="Бұл мән қай нұсқауда жазылды?">' + esc(v[0]) + "</button></dt><dd><code>" + esc(v[1]) + "</code></dd></div>";
      }).join("") + "</dl>" : '<p class="xr-none">айнымалы жоқ</p>';
      h += "</div>";
    }
    $("[data-xr-stack]").innerHTML = h;
  }
  // уақытты кері айналдыру: айнымалының мәні соңғы рет жазылған нұсқауға оралу
  function valAt(i, cid, name) {
    var snap = R.snaps[R.steps[i][3]] || [];
    for (var j = 0; j < snap.length; j++) if (snap[j][0] === cid) { for (var k = 0; k < snap[j][1].length; k++) if (snap[j][1][k][0] === name) return snap[j][1][k][1]; return undefined; }
    return null;   // жақтау әлі жоқ
  }
  $("[data-xr-stack]").addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".xr-var");
    if (!b || !R) return;
    var cid = Number(b.getAttribute("data-cid")), name = b.getAttribute("data-name"), now = valAt(step, cid, name), t = step - 1;
    while (t >= 0 && valAt(t, cid, name) === now) t--;
    var msg = $("[data-xr-travel]");
    if (t < 0) { msg.textContent = "«" + name + "» мәні рентгеннің басынан бері өзгерген жоқ: " + now + "."; return; }
    var was = valAt(t, cid, name), ins = insAt(R.steps[t]);
    stop(); show(t);
    msg.textContent = "Уақыт кері айналды: «" + name + "» мәнін осы нұсқау жазады" + (ins ? " (" + lineOf[t] + "-жол, " + ins[1] + ")" : "") + ": "
      + (was === undefined || was === null ? "жоқ" : was) + " → " + now + ". Жаңа мән келесі қадамда стекте көрінеді.";
  });

  // ------------------------------------------------------------------ 5. шақыру ағашы (рекурсия)
  var TN = [];
  function short(c) { return c.fn + "(" + String(c.a || "").replace(/[^\s=,(]+=/g, "") + ")"; }
  function renderTree() {
    var boxT = $("[data-xr-tree]"), calls = R.calls.filter(function (c) { return c.fn !== "<module>"; }).slice(0, 255);
    TN = calls;
    if (!calls.length) { boxT.innerHTML = '<p class="xr-empty">Бұл кодта функция шақырылмайды: ағаш бос. «Факториал» не «Фибоначчи» мысалын аш.</p>'; return; }
    var kids = {}, rootIds = [], ids = {};
    calls.forEach(function (c) { ids[c.i] = c; });
    calls.forEach(function (c) { if (ids[c.p]) (kids[c.p] = kids[c.p] || []).push(c); else rootIds.push(c); });
    var leaf = 0, maxD = 0, W = 96, H = 70, P = {};
    function place(c, d) {
      var ks = kids[c.i] || [];
      maxD = Math.max(maxD, d);
      if (!ks.length) { P[c.i] = [leaf++, d]; return; }
      ks.forEach(function (k) { place(k, d + 1); });
      P[c.i] = [(P[ks[0].i][0] + P[ks[ks.length - 1].i][0]) / 2, d];
    }
    rootIds.forEach(function (r) { place(r, 0); });
    var vw = Math.max(1, leaf) * W, vh = (maxD + 1) * H + 10, s = "";
    calls.forEach(function (c) {
      var p = ids[c.p] && P[c.p];
      if (p) s += '<line class="xr-te" data-ci="' + c.i + '" x1="' + (p[0] * W + W / 2) + '" y1="' + (p[1] * H + 40) + '" x2="' + (P[c.i][0] * W + W / 2) + '" y2="' + (P[c.i][1] * H + 14) + '"/>';
    });
    calls.forEach(function (c) {
      var x = P[c.i][0] * W + W / 2, y = P[c.i][1] * H + 14, label = short(c);
      s += '<g class="xr-tn" data-ci="' + c.i + '" tabindex="0" role="button" aria-label="' + esc(c.fn + "(" + c.a + ")" + (c.r != null ? ", жауабы " + c.r : "") + ": жауап қайтарған сәтке бару") + '" transform="translate(' + x + " " + y + ')"><rect x="-44" y="0" width="88" height="26" rx="8"/><text y="17">' + esc(label.length > 14 ? label.slice(0, 13) + "…" : label) + "</text>"
        + '<text class="xr-tr" y="42">' + esc(c.r != null ? "→ " + c.r : "") + "</text><title>" + esc(c.fn + "(" + c.a + ")" + (c.r != null ? " → " + c.r : "")) + "</title></g>";
    });
    // табиғи өлшем: түйін оқылатындай; кең ағаш көлденең жылжиды, тар ағаш (тізбек) ортада тұрады
    boxT.innerHTML = '<svg viewBox="0 0 ' + vw + " " + vh + '" width="' + Math.round(vw * 1.1) + '" height="' + Math.round(vh * 1.1) + '" role="group" aria-label="Шақыру ағашы: ' + calls.length + ' шақыру">' + s + "</svg>"
      + (R.total.calls > calls.length ? '<p class="xr-more">Ағашта алғашқы ' + calls.length + " шақыру көрсетілді, барлығы " + R.total.calls + ".</p>" : "");
  }
  // ағаштағы шақыруды басса: сол шақыру жауап қайтарған нұсқауға (не әлі жүріп жатса - басына) бару
  function toCall(g) {
    var c = R && R.calls[Number(g.getAttribute("data-ci"))];
    if (!c || !g.classList.contains("seen")) return;
    stop();
    var t = c.e != null ? Math.max(c.s, c.e - 1) : c.s;
    show(t);
    $("[data-xr-travel]").textContent = c.e != null ? c.fn + "(" + c.a + ") осы нұсқауда " + c.r + " қайтарады. Стектегі айнымалыны бассаң, оның мәні қай жерде жазылғанын көресің."
      : c.fn + "(" + c.a + ") осы нұсқаудан басталды.";
  }
  $("[data-xr-tree]").addEventListener("click", function (e) { var g = e.target.closest && e.target.closest(".xr-tn"); if (g) toCall(g); });
  $("[data-xr-tree]").addEventListener("keydown", function (e) {
    var g = e.target.closest && e.target.closest(".xr-tn");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toCall(g); }
  });
  function markTree(i, s) {
    var snap = R.snaps[s[3]] || [], live = {};
    snap.forEach(function (f) { live[f[0]] = 1; });
    $$(".xr-tn").forEach(function (g) {
      var c = R.calls[Number(g.getAttribute("data-ci"))];
      var seen = c.s <= i, back = c.e != null && i >= c.e;
      g.classList.toggle("seen", seen); g.classList.toggle("back", back); g.classList.toggle("live", !!live[c.i] && !back);
      g.classList.toggle("cur", c.i === s[2]);
    });
    $$(".xr-te").forEach(function (l) { var c = R.calls[Number(l.getAttribute("data-ci"))]; l.classList.toggle("seen", c.s <= i); });
  }

  // ------------------------------------------------------------------ 6. есептеу
  function drawStats(i, s) {
    var calls = 0, rootC = null;
    R.calls.forEach(function (c) {
      if (c.fn === "<module>") return;
      if (c.s <= i) calls++;
      if (!rootC && (c.p === 0 || c.p === -1)) rootC = c;
    });
    var depth = Math.max(0, (R.snaps[s[3]] || []).length - 1), last = i >= R.steps.length - 1;
    var out = R.out.slice(0, s[4]).trim().split("\n").pop();
    $('[data-st="calls"]').textContent = calls + " / " + R.total.calls;
    $('[data-st="depth"]').textContent = depth + " (ең көбі " + R.total.depth + ")";
    $('[data-st="ins"]').textContent = (i + 1) + " / " + R.total.ins + (R.more ? " (алғашқы " + R.steps.length + " жазылды)" : "");
    $('[data-st="res"]').textContent = rootC && rootC.e != null && i >= rootC.e ? rootC.r : rootC ? "…" : (last ? (R.out.trim().split("\n").pop() || "-") : (out || "…"));
  }

  // ------------------------------------------------------------------ бәрін бір қадамға
  function show(i) {
    if (!R || !R.steps.length) return;
    i = Math.max(0, Math.min(R.steps.length - 1, i));
    var prev = R.steps[step] && step !== i ? R.steps[step] : null;
    step = i;
    var s = R.steps[i], ins = insAt(s), last = i === R.steps.length - 1;
    slider.value = String(i);
    drawSrc(ins, R.err && last ? R.err.line : 0);
    markAst(ins); drawBc(s); drawStack(s, prev); markTree(i, s); drawStats(i, s);
    var o = R.out.slice(0, s[4]);
    if (last) o = R.out + (R.err ? (R.out ? "\n" : "") + "Қате (" + R.err.line + "-жол): " + R.err.msg + (R.err.py ? "\nPython: " + R.err.py : "") : "");
    outEl.textContent = o; outEl.className = "xr-out" + (R.err && last ? " bad" : "");
    posEl.textContent = "Қадам " + (i + 1) + " / " + R.steps.length + " · " + lineOf[i] + "-жол" + (ins ? " · " + ins[1] : "");
  }
  function nextIdx(dir) {
    var g = gran.value, i = step;
    if (g === "ins") return i + dir;
    if (g === "line") {
      var l = lineOf[i], c = R.steps[i][2], j = i + dir;
      while (j > 0 && j < R.steps.length - 1 && lineOf[j] === l && R.steps[j][2] === c) j += dir;
      return j;
    }
    if (dir > 0) { for (var k = 0; k < callEv.length; k++) if (callEv[k] > i) return callEv[k]; return R.steps.length - 1; }
    for (var m = callEv.length - 1; m >= 0; m--) if (callEv[m] < i) return callEv[m];
    return 0;
  }
  function stop() { clearTimeout(timer); timer = 0; playB.textContent = "▶"; playB.setAttribute("aria-label", "Ойнату"); }
  function play() {
    if (timer) { stop(); return; }
    if (step >= R.steps.length - 1) show(0);
    playB.textContent = "⏸"; playB.setAttribute("aria-label", "Тоқтату");
    (function tick() {
      if (step >= R.steps.length - 1) { stop(); return; }
      $("[data-xr-travel]").textContent = "";
      show(nextIdx(1));
      timer = setTimeout(tick, gran.value === "ins" ? 380 : 700);
    })();
  }
  playB.addEventListener("click", play);
  slider.addEventListener("input", function () { stop(); $("[data-xr-travel]").textContent = ""; show(Number(slider.value)); });
  $$("[data-xr-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!R) return;
      stop(); $("[data-xr-travel]").textContent = "";
      var g = b.getAttribute("data-xr-go");
      show(g === "first" ? 0 : g === "last" ? R.steps.length - 1 : nextIdx(g === "next" ? 1 : -1));
    });
  });

  // ------------------------------------------------------------------ мысалдар
  function pick(id, keepCode) {
    var e = EX[id];
    cur = e ? id : "free";
    $$("[data-ex]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-ex") === cur)); });
    $("[data-xr-note]").textContent = e ? e.note : "";
    if (!keepCode) { ta.value = st.code[cur] != null ? st.code[cur] : e ? e.code : ""; ed.refresh(); ed.mark(0); }
    st.ex = cur; save();
    R = null; stop(); edit(true);
    $("[data-xr-time]").hidden = true;
    outEl.textContent = ""; outEl.className = "xr-out"; $("[data-xr-travel]").textContent = "";
  }
  $$("[data-ex]").forEach(function (b) {
    b.addEventListener("click", function () { var id = b.getAttribute("data-ex"); ta.value = EX[id].code; st.code[id] = ta.value; pick(id, false); if (py) go(); });
  });
  var m = /^#ex=([\w-]+)$/.exec(location.hash);
  pick(m && EX[m[1]] ? m[1] : EX[st.ex] ? st.ex : "fact", false);
  ta.parentNode.hidden = false;
  boot().then(function () { if (py && m && EX[m[1]]) go(); });
})();
