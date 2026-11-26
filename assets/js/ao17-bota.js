/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* Бота әлемі (tools/academy/bota.py -> academy/bota.html). Оқушы коды нағыз Python-да орындалады: Pyodide сайттың ортақ
   CS50KZ.getPyodide() арқылы жүктеледі, assets/py/bota_world.py әр әлемдегі әрекеттерді жазып береді
   ([түрі, x, y, бағыт, код жолы]), мұнда олар SVG торда анимацияланады және сол сәтте орындалып жатқан код жолы белгіленеді.
   Әлем, карта және редактор Python-сыз да жұмыс істейді: Python тек «Іске қосу» үшін керек.
   Сақтау: «ao17cs:bota» - {code: {деңгей: код}, stars: {деңгей: 1-3}, level, speed}. Сілтеме: bota.html#l=<деңгей>. */
(function () {
  "use strict";
  var root = document.querySelector("[data-bota]"), box = document.getElementById("bw-data");
  if (!root || !box) return;
  var D;
  try { D = JSON.parse(box.textContent); } catch (e) { return; }
  var KEY = "ao17cs:bota", NS = "http://www.w3.org/2000/svg", XL = "http://www.w3.org/1999/xlink", C = 64;
  var DIRS = [[1, 0], [0, -1], [-1, 0], [0, 1]], DIRNAME = ["шығысқа", "солтүстікке", "батысқа", "оңтүстікке"];
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function $(s) { return root.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  var st = obj(J(KEY, {}));
  st.code = obj(st.code); st.stars = obj(st.stars);
  function save() { S(KEY, st); }

  var LV = {}, ORDER = [];
  D.levels.forEach(function (l, i) { l.n = i + 1; LV[l.id] = l; ORDER.push(l.id); });
  var CH = {}; D.chapters.forEach(function (c) { CH[c.id] = c; });
  var ta = $("[data-bw-code]"), gut = $("[data-bw-gut]"), hl = $("[data-bw-hl]"), runB = $("[data-bw-run]"), stepB = $("[data-bw-step]");
  var status = $("[data-bw-status]"), out = $("[data-bw-out]"), svg = $("[data-bw-svg]"), board = $("[data-bw-board]");
  var verdict = $("[data-bw-verdict]"), tabs = $("[data-bw-tabs]"), speedSel = $("[data-bw-speed]"), bagEl = $("[data-bw-bag]"), nEl = $("[data-bw-n]");
  var still = !!(window.AO17Reveal && window.AO17Reveal.still) || document.documentElement.classList.contains("reduce-motion")
    || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var cur = null, wi = 0, result = null, play = null, py = null, B = null;
  if (st.speed != null && speedSel.querySelector('option[value="' + st.speed + '"]')) speedSel.value = String(st.speed);

  // ------------------------------------------------------------------ әлем: карта жолдарын талдау (bota_world.World сияқты)
  function parse(rows) {
    var w = { w: 0, h: rows.length, walls: {}, apples: {}, home: null, x: 0, y: 0, d: 0, bag: 0 };
    rows.forEach(function (row, y) {
      w.w = Math.max(w.w, row.length);
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x), k = x + "," + y;
        if (ch === "#") w.walls[k] = 1;
        else if (ch === "a") w.apples[k] = 1;
        else if (/[1-9]/.test(ch)) w.apples[k] = Number(ch);
        else if (ch === "H") w.home = [x, y];
        else if (">^<v".indexOf(ch) >= 0) { w.x = x; w.y = y; w.d = ">^<v".indexOf(ch); }
      }
    });
    return w;
  }

  // ------------------------------------------------------------------ сурет: тор, тау, киіз үй, алма, Бота
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "href") { e.setAttribute("href", attrs[k]); e.setAttributeNS(XL, "xlink:href", attrs[k]); } else e.setAttribute(k, attrs[k]);
    });
    if (parent) parent.appendChild(e);
    return e;
  }
  function use(id, x, y, s, parent, cls) { return el("use", { href: "#" + id, x: x, y: y, width: s, height: s, "class": cls || "" }, parent); }
  function appleNode(g, n) {
    while (g.firstChild) g.removeChild(g.firstChild);
    var inner = el("g", { "class": "bw-api" }, g);
    use("bw-s-apple", 0, 0, C, inner);
    if (n > 1) {
      el("circle", { cx: 51, cy: 13, r: 8.5, "class": "bw-badge" }, inner);
      var t = el("text", { x: 51, y: 17.2, "class": "bw-badge-t" }, inner);
      t.textContent = String(n);
    }
  }
  function drawBoard(rows) {
    var w = parse(rows);
    while (board.firstChild) board.removeChild(board.firstChild);
    svg.setAttribute("viewBox", "0 0 " + w.w * C + " " + w.h * C);
    svg.style.setProperty("--bw-ar", String(w.w / w.h));
    var tiles = el("g", { "class": "bw-tiles" }, board), deco = el("g", {}, board), things = el("g", {}, board);
    var appleG = el("g", { "class": "bw-apples" }, board), fx = el("g", { "class": "bw-fx" }, board);
    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        var k = x + "," + y;
        el("rect", { x: x * C, y: y * C, width: C, height: C, "class": "bw-t" + ((x + y) % 2 ? " alt" : "") }, tiles);
        if (w.walls[k]) use("bw-s-mtn", x * C, y * C, C, things);
        else if (!w.apples[k] && !(w.home && w.home[0] === x && w.home[1] === y) && (x * 7 + y * 13) % 5 === 1) use("bw-s-tuft", x * C + 6, y * C + 40, 18, deco);
      }
    }
    if (w.home) use("bw-s-yurt", w.home[0] * C, w.home[1] * C, C, things, "bw-home");
    var apples = {};
    Object.keys(w.apples).forEach(function (k) {
      var p = k.split(","), g = el("g", { transform: "translate(" + p[0] * C + " " + p[1] * C + ")", "class": "bw-ap" }, appleG);
      appleNode(g, w.apples[k]); apples[k] = g;
    });
    var bota = el("g", { "class": "bw-bota" }, board), body = el("g", { "class": "bw-body" }, bota);
    var dir = el("g", { "class": "bw-dir" }, bota);
    el("path", { d: "M23 -6 L31 0 L23 6 Z" }, dir);
    var spr = el("g", { "class": "bw-spr" }, body);
    B = { w: w, rows: rows, apples: apples, appleG: appleG, fx: fx, bota: bota, body: body, dir: dir, spr: spr, ang: -90 * w.d, bag: 0, n: 0 };
    place(0); face(w.d); aim(0);
    bagEl.textContent = "0"; nEl.textContent = "0";
    describe();
  }
  function face(d) {
    var s = B.spr;
    while (s.firstChild) s.removeChild(s.firstChild);
    var g = el("g", d === 2 ? { transform: "scale(-1 1)" } : {}, s);
    use(d === 1 ? "bw-s-back" : d === 3 ? "bw-s-front" : "bw-s-side", -29, -34, 58, g);
  }
  function place(ms) {
    B.bota.style.transitionDuration = ms + "ms";
    B.bota.style.transform = "translate(" + (B.w.x * C + C / 2) + "px," + (B.w.y * C + C / 2) + "px)";
  }
  function aim(ms) {
    B.dir.style.transitionDuration = ms + "ms";
    B.dir.style.transform = "rotate(" + B.ang + "deg)";
  }
  function anim(node, frames, ms) { if (ms && node.animate) node.animate(frames, { duration: ms, easing: "ease-in-out" }); }
  function cellLabel(x, y) { return (x + 1) + "-баған, " + (y + 1) + "-жол"; }
  function describe() {
    var w = B.w, n = 0;
    Object.keys(w.apples).forEach(function (k) { n += Math.max(0, w.apples[k]); });
    svg.setAttribute("aria-label", (cur && cur.worlds.length > 1 ? (wi + 1) + "-әлем. " : "") + "Тор " + w.w + "x" + w.h + ". Бота " + cellLabel(w.x, w.y) + ", " + DIRNAME[w.d] + " қарап тұр. "
      + (w.home ? "Киіз үй: " + cellLabel(w.home[0], w.home[1]) + ". " : "") + "Далада " + n + " алма, тау: " + Object.keys(w.walls).length + ", себетте: " + w.bag + ".");
  }
  function flash(x, y, ms) {
    var r = el("rect", { x: x * C + 4, y: y * C + 4, width: C - 8, height: C - 8, rx: 10, "class": "bw-hit" }, B.fx);
    setTimeout(function () { r.remove(); }, Math.max(ms, 400) + 300);
  }

  // бір әрекетті қолдану (ms = 0 - анимациясыз)
  function apply(a, ms) {
    var w = B.w, kind = a[0], k = a[1] + "," + a[2];
    hilite(a[4], /^(bump|nopick|noput)$/.test(kind));
    if (kind === "m") {
      w.x = a[1]; w.y = a[2]; place(ms);
      anim(B.body, [{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }], ms);
    } else if (kind === "t") {
      w.d = a[3]; B.ang -= 90; aim(ms);
      if (ms) {
        anim(B.spr, [{ transform: "scaleX(1)" }, { transform: "scaleX(.15)" }, { transform: "scaleX(1)" }], ms);
        setTimeout(function (d) { return function () { if (B && B.w === w && w.d === d) face(d); }; }(a[3]), ms / 2);
      } else face(w.d);
    } else if (kind === "p" || kind === "q") {
      var n = (w.apples[k] || 0) + (kind === "p" ? -1 : 1);
      w.apples[k] = n; w.bag += kind === "p" ? 1 : -1;
      if (ms && kind === "p") {   // алма Ботаның себетіне ұшады
        var ghost = el("g", { transform: "translate(" + a[1] * C + " " + a[2] * C + ")" }, B.fx), gi = el("g", { "class": "bw-api" }, ghost);
        use("bw-s-apple", 0, 0, C, gi);
        var an = gi.animate ? gi.animate([{ transform: "translateY(0) scale(1)", opacity: 1 }, { transform: "translateY(-26px) scale(.35)", opacity: 0 }], { duration: Math.max(ms, 160), easing: "ease-in" }) : null;
        if (an) an.onfinish = function () { ghost.remove(); }; else ghost.remove();
      }
      if (n > 0) {
        if (!B.apples[k]) { var p = k.split(","); B.apples[k] = el("g", { transform: "translate(" + p[0] * C + " " + p[1] * C + ")", "class": "bw-ap" }, B.appleG); }
        appleNode(B.apples[k], n);
        if (ms && kind === "q") anim(B.apples[k].firstChild, [{ transform: "scale(.2)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], ms);
      } else if (B.apples[k]) { B.apples[k].remove(); delete B.apples[k]; }
      bagEl.textContent = String(w.bag);
      if (ms) anim(bagEl, [{ transform: "scale(1)" }, { transform: "scale(1.45)" }, { transform: "scale(1)" }], Math.max(ms, 200));
    } else if (kind === "bump") {
      var dx = DIRS[a[3]][0], dy = DIRS[a[3]][1];
      flash(a[1] + dx, a[2] + dy, ms);
      anim(B.body, [{ transform: "translate(0,0)" }, { transform: "translate(" + dx * 12 + "px," + dy * 12 + "px)" }, { transform: "translate(0,0)" },
        { transform: "translate(" + dx * 6 + "px," + dy * 6 + "px)" }, { transform: "translate(0,0)" }], Math.max(ms, 380));
    } else if (kind === "nopick" || kind === "noput") {
      flash(a[1], a[2], ms);
      anim(B.body, [{ transform: "rotate(0)" }, { transform: "rotate(-8deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(0)" }], Math.max(ms, 380));
    }
    B.n++; nEl.textContent = String(B.n);
  }

  // ------------------------------------------------------------------ ойнатқыш
  function speed() { var s = Number(speedSel.value); return still || !s ? 0 : s === 2 ? 640 : s === 3 ? 110 : 300; }
  function stopPlay() { if (play && play.timer) clearTimeout(play.timer); play = null; runB.textContent = "Іске қосу"; }
  function begin(res) {
    stopPlay();
    drawBoard(cur.worlds[wi]);
    play = { res: res, log: res.log, i: 0, timer: 0 };
    verdict.hidden = true;
  }
  function tick() {
    if (!play) return;
    var log = play.log;
    if (play.i >= log.length) { finish(); return; }
    // ұзын жазбада жалпы уақыт 20 секундтан аспасын
    var ms = Math.min(speed(), Math.max(12, Math.floor(20000 / log.length)));
    if (!ms) { while (play.i < log.length) apply(log[play.i++], 0); finish(); return; }
    apply(log[play.i++], ms);
    play.timer = setTimeout(tick, ms);
  }
  function skip() {   // соңына өту
    if (!play) return;
    clearTimeout(play.timer);
    while (play.i < play.log.length) apply(play.log[play.i++], 0);
    finish();
  }
  function finish() {
    if (!play) return;
    var res = play.res;
    clearTimeout(play.timer); play = null; runB.textContent = "Іске қосу";
    if (res.err && res.err.line) hilite(res.err.line, true);
    describe();
    if (res.out) out.textContent = res.out;
    showVerdict();
  }

  // ------------------------------------------------------------------ редактор: жол нөмірлері, белгіленген жол, шегініс
  var LH = 24, PAD = 14, escTab = false;
  function gutter() {
    var n = ta.value.split("\n").length, s = "";
    for (var i = 1; i <= n; i++) s += i + "\n";
    gut.textContent = s;
    gut.scrollTop = ta.scrollTop;
    posHl();
  }
  var hlLine = 0;
  function hilite(line, bad) {
    hlLine = line || 0;
    hl.hidden = !hlLine;
    hl.classList.toggle("bad", !!bad);
    posHl();
  }
  function posHl() { if (hlLine) hl.style.transform = "translateY(" + (PAD + (hlLine - 1) * LH - ta.scrollTop) + "px)"; }
  function edit(text, s, e) {   // undo тарихы сақталсын: execCommand, болмаса тікелей
    ta.focus();
    ta.setSelectionRange(s, e);
    var ok = false;
    try { ok = document.execCommand("insertText", false, text); } catch (err) { ok = false; }
    if (!ok) { ta.value = ta.value.slice(0, s) + text + ta.value.slice(e); changed(); }   // execCommand өзі input оқиғасын шығарады
    ta.selectionStart = ta.selectionEnd = s + text.length;   // курсор әрдайым енгізілген мәтіннің соңында (жол соңындағы «\n» маңында да)
  }
  ta.addEventListener("keydown", function (e) {
    if (e.isComposing) return;
    if (e.key === "Escape") { escTab = true; return; }
    var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, ls = v.lastIndexOf("\n", s - 1) + 1, line = v.slice(ls, s);
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); go(); return; }
    if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (escTab) { escTab = false; return; }   // Esc, сосын Tab - редактордан шығу
      e.preventDefault();
      if (e.shiftKey) { var m = /^ {1,4}/.exec(v.slice(ls)); if (m) edit("", ls, ls + m[0].length); }
      else edit("    ", s, en);
      return;
    }
    escTab = false;
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {   // шегіністі сақтау, «:»-дан кейін +4
      e.preventDefault();
      var ind = /^ */.exec(line)[0];
      edit("\n" + ind + (/:\s*(#.*)?$/.test(line) ? "    " : ""), s, en);
      return;
    }
    if (e.key === "Backspace" && s === en && s > ls && /^ +$/.test(line) && line.length % 4 === 0) { e.preventDefault(); edit("", s - 4, s); }
  });
  function changed() {
    gutter();
    if (cur) { st.code[cur.id] = ta.value; save(); }
    if (result || play) { stopPlay(); result = null; marksTabs(); verdict.hidden = true; drawBoard(cur.worlds[wi]); }
    hilite(0);
  }
  ta.addEventListener("input", changed);
  ta.addEventListener("scroll", function () { gut.scrollTop = ta.scrollTop; posHl(); });
  var coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  $$("[data-ins]").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = b.getAttribute("data-ins"), s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
      var ls = v.lastIndexOf("\n", s - 1) + 1, line = v.slice(ls, s), ind = /^ */.exec(line)[0];
      var t = (line.trim() ? "\n" + ind : "") + txt.replace(/\n/g, "\n" + ind);
      if (coarse) {   // телефонда пернетақта ашылмасын: тікелей қоямыз
        ta.value = v.slice(0, s) + t + v.slice(en); ta.selectionStart = ta.selectionEnd = s + t.length; changed();
      } else edit(t, s, en);
    });
  });

  // ------------------------------------------------------------------ Python
  function setStatus(t, cls) { status.textContent = t; status.className = "bw-status" + (cls ? " " + cls : ""); }
  async function boot() {
    try {
      for (var i = 0; i < 200 && !(window.CS50KZ && typeof window.CS50KZ.getPyodide === "function"); i++) await new Promise(function (r) { setTimeout(r, 50); });
      if (!window.CS50KZ || typeof window.CS50KZ.getPyodide !== "function") throw new Error("Python жүктегіш табылмады");
      var p = await window.CS50KZ.getPyodide();
      var res = await fetch(new URL("../assets/py/bota_world.py", location.href));
      if (!res.ok) throw new Error("bota_world.py жүктелмеді");
      p.globals.set("BT_SRC", await res.text());
      p.runPython("import sys, types\n_m = types.ModuleType('bota_world')\nexec(BT_SRC, _m.__dict__)\nsys.modules['bota_world'] = _m\ndel _m");
      py = p;
      runB.disabled = false; stepB.disabled = false;
      setStatus("Python дайын", "ok");
    } catch (e) {
      setStatus("Python жүктелмеді: " + (e && e.message ? e.message : e) + ". Желіні тексеріп, бетті жаңарт.", "bad");
    }
  }
  function exec() {
    var code = ta.value, r;
    st.code[cur.id] = code; save();
    try {
      py.globals.set("BT_CODE", code);
      py.globals.set("BT_LEVEL", JSON.stringify({ worlds: cur.worlds, goal: cur.keys, s3: cur.s3 }));
      r = JSON.parse(py.runPython("import bota_world\nbota_world.run(BT_CODE, BT_LEVEL)"));
    } catch (e) {
      var msg = String(e && e.message ? e.message : e).split("\n").filter(Boolean).slice(-1)[0];
      r = { ok: false, size: 0, stars: 0, worlds: cur.worlds.map(function () { return { log: [], err: { msg: "Python қатесі.", py: msg, line: 0 }, why: [], ok: false, out: "" }; }) };
    }
    result = r;
    // бірінші құлаған әлемді көрсетеміз: қай жерде қате екені бірден көрінсін
    if (!r.ok) { var bad = r.worlds.findIndex(function (x) { return !x.ok; }); if (bad >= 0) wi = bad; }
    marksTabs(false);
    out.textContent = "";
    var nAct = r.worlds.reduce(function (n, x) { return n + x.log.length; }, 0), err = r.worlds.some(function (x) { return x.err; });
    setStatus(err ? "Қате бар" : "Орындалды: " + nAct + " әрекет", err ? "bad" : "ok");
    return r;
  }
  function go() {
    if (!py || !cur) return;
    if (play && play.timer) { skip(); return; }
    exec();
    begin(result.worlds[wi]);
    runB.textContent = "Соңына өту";
    tick();
  }
  runB.addEventListener("click", go);
  stepB.addEventListener("click", function () {
    if (!py || !cur) return;
    if (play && play.timer) { clearTimeout(play.timer); play.timer = 0; runB.textContent = "Іске қосу"; }
    if (!play) { exec(); begin(result.worlds[wi]); if (!play.log.length) { finish(); return; } }
    apply(play.log[play.i++], speed() ? 260 : 0);
    if (play.i >= play.log.length) finish();
  });
  speedSel.addEventListener("change", function () { st.speed = Number(speedSel.value); save(); });

  // ------------------------------------------------------------------ нәтиже
  function starsHtml(n) { var s = ""; for (var i = 0; i < 3; i++) s += '<i class="' + (i < n ? "on" : "") + '"></i>'; return '<span class="bw-st" aria-hidden="true">' + s + "</span>"; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function showVerdict() {
    var r = result;
    if (!r || !cur) return;
    var w = r.worlds[wi], multi = cur.worlds.length > 1, h = "";
    verdict.hidden = false;
    if (r.ok) {
      var prev = st.stars[cur.id] || 0;
      st.stars[cur.id] = Math.max(prev, r.stars); save(); levelMarks();
      var i = ORDER.indexOf(cur.id), next = ORDER[i + 1];
      h = '<p class="bw-v-h">' + starsHtml(r.stars) + "<b>" + (multi ? "Барлық " + cur.worlds.length + " әлемде өтті!" : "Деңгей өтті!") + "</b></p>"
        + "<p>Кодың: " + r.size + " команда. " + (r.stars === 3 ? "Үш жұлдыз: ең қысқа шешімдердің бірі." : "3 жұлдыз үшін " + cur.s3 + " командадан аспауы керек: қайталанатын жерді цикл не функция етіп көр.") + "</p>"
        + '<p class="bw-v-row">' + (next ? '<button class="btn gold" type="button" data-bw-next="' + next + '">Келесі деңгей: ' + esc(LV[next].title) + "</button>" : "<b>Барлық деңгей аяқталды. Керуенбасы!</b>") + "</p>";
      verdict.className = "bw-verdict ok";
      if (window.CS50KZ && typeof window.CS50KZ.check === "function") window.CS50KZ.check();   // «Керуенбасы» жетістігі
      if (!still && !prev && window.CS50KZ && typeof window.CS50KZ.celebrate === "function") window.CS50KZ.celebrate();
    } else {
      var why = w.err ? (w.err.line ? w.err.line + "-жолда: " : "") + w.err.msg : w.ok ? "" : w.why.join("; ") + ".";
      var otherBad = r.worlds.map(function (x, j) { return x.ok ? -1 : j; }).filter(function (j) { return j >= 0 && j !== wi; });
      h = '<p class="bw-v-h"><b>' + (multi ? (wi + 1) + "-әлемде өтпеді" : "Әлі өтпеді") + "</b></p><p>" + esc(why) + "</p>"
        + (w.err && w.err.py ? '<p class="bw-v-py">Python: <code>' + esc(w.err.py) + "</code></p>" : "")
        + (otherBad.length ? '<p class="bw-v-row">' + otherBad.map(function (j) { return '<button class="btn secondary" type="button" data-bw-world="' + j + '">' + (j + 1) + "-әлемді көрсету</button>"; }).join(" ") + "</p>" : "");
      verdict.className = "bw-verdict bad";
    }
    verdict.innerHTML = h;
    var nb = verdict.querySelector("[data-bw-next]");
    if (nb) nb.addEventListener("click", function () { select(nb.getAttribute("data-bw-next"), true); });
    verdict.querySelectorAll("[data-bw-world]").forEach(function (b) { b.addEventListener("click", function () { showWorld(Number(b.getAttribute("data-bw-world")), true); }); });
  }

  // ------------------------------------------------------------------ әлем қойындылары
  function marksTabs() {
    $$("[data-bw-w]").forEach(function (b) {
      var j = Number(b.getAttribute("data-bw-w")), r = result && result.worlds[j];
      b.setAttribute("aria-pressed", String(j === wi));
      b.classList.toggle("is-ok", !!(r && r.ok)); b.classList.toggle("is-bad", !!(r && !r.ok));
      b.querySelector(".sr-only").textContent = r ? (r.ok ? ": өтті" : ": өтпеді") : "";
    });
  }
  function showWorld(j, replay) {
    stopPlay(); wi = j; marksTabs(); hilite(0);
    if (result && replay) { begin(result.worlds[wi]); runB.textContent = "Соңына өту"; tick(); }
    else { drawBoard(cur.worlds[wi]); if (result) showVerdict(); }
  }
  function buildTabs() {
    tabs.innerHTML = "";
    tabs.hidden = cur.worlds.length < 2;
    cur.worlds.forEach(function (_, j) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "bw-tab"; b.setAttribute("data-bw-w", j);
      b.innerHTML = (j + 1) + '-әлем<span class="sr-only"></span>';
      b.addEventListener("click", function () { showWorld(j, true); });
      tabs.appendChild(b);
    });
  }

  // ------------------------------------------------------------------ деңгейлер картасы
  function levelMarks() {
    var total = 0, passed = 0, next = null;
    ORDER.forEach(function (id) { var s = st.stars[id] || 0; total += s; if (s) passed++; else if (!next) next = id; });
    $$("[data-level]").forEach(function (b) {
      var id = b.getAttribute("data-level"), s = st.stars[id] || 0;
      b.querySelector(".bw-lvs").setAttribute("data-stars", s);
      b.classList.toggle("is-done", s > 0); b.classList.toggle("is-next", id === next);
      b.setAttribute("aria-pressed", String(!!cur && cur.id === id));
      b.querySelector("[data-sr]").textContent = s ? ", " + s + " жұлдыз" : "";
    });
    $("[data-bw-total]").textContent = String(total);
    $("[data-bw-passed]").textContent = String(passed);
    return next;
  }
  function select(id, scroll) {
    var lv = LV[id];
    if (!lv) return;
    stopPlay(); cur = lv; wi = 0; result = null;
    st.level = id; save();
    $("[data-bw-title]").textContent = lv.n + ". " + lv.title;
    $("[data-bw-goal]").innerHTML = '<span class="bw-tag">' + esc(CH[lv.ch].title) + " · " + esc(lv.concept) + "</span> " + esc(lv.goal);
    $("[data-bw-rule]").textContent = "3 жұлдыз: " + lv.s3 + " командадан аспайтын код." + (lv.worlds.length > 1 ? " Код " + lv.worlds.length + " әлемнің бәрінде өтуі керек." : "");
    $("[data-bw-tip]").textContent = lv.hint;
    var tip = root.querySelector(".bw-tip"); if (tip) tip.open = false;
    ta.value = st.code[id] != null ? st.code[id] : lv.starter;
    ta.scrollTop = 0;
    out.textContent = ""; verdict.hidden = true;
    buildTabs(); marksTabs(); levelMarks(); gutter(); hilite(0);
    drawBoard(lv.worlds[0]);
    if (py) setStatus("Python дайын", "ok");
    if (scroll && history.replaceState) history.replaceState(null, "", "#l=" + id);
    if (scroll) { var stg = root.querySelector(".bw-stage"); if (stg && stg.scrollIntoView) stg.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" }); }
  }
  $$("[data-level]").forEach(function (b) { b.addEventListener("click", function () { select(b.getAttribute("data-level"), true); }); });
  $("[data-bw-reset]").addEventListener("click", function () { if (!cur) return; ta.value = cur.starter; changed(); });
  window.addEventListener("hashchange", function () { var m = /^#l=([\w-]+)$/.exec(location.hash); if (m && LV[m[1]] && (!cur || cur.id !== m[1])) select(m[1], true); });

  // ------------------------------------------------------------------ бастау: сілтемедегі деңгей > сақталған > бірінші өтілмеген
  var m = /^#l=([\w-]+)$/.exec(location.hash);
  var first = m && LV[m[1]] ? m[1] : LV[st.level] ? st.level : (levelMarks() || ORDER[0]);
  select(first, false);
  boot();
})();
