/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* Бота әлемі (tools/academy/bota.py -> academy/bota.html). Оқушы коды нағыз Python-да орындалады: Pyodide сайттың ортақ
   CS50KZ.getPyodide() арқылы жүктеледі, assets/py/bota_world.py әр әлемдегі әрекеттерді жазып береді
   ([түрі, x, y, бағыт, код жолы]), мұнда олар SVG торда анимацияланады және сол сәтте орындалып жатқан код жолы белгіленеді.
   Әлем, карта және редактор Python-сыз да жұмыс істейді: Python тек «Іске қосу» үшін керек.
   Сақтау: «ao17cs:bota» - {code: {деңгей: код}, stars: {деңгей: 1-3}, level, speed, build: {r, g}}.
   Сілтеме: bota.html#l=<деңгей>; «Өз әлемің» құрастырушысының әлемі - bota.html#w=<base64url JSON {r: жолдар, g: мақсаттар}>. */
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
  var ta = $("[data-bw-code]"), runB = $("[data-bw-run]"), stepB = $("[data-bw-step]");
  var status = $("[data-bw-status]"), out = $("[data-bw-out]"), svg = $("[data-bw-svg]"), board = $("[data-bw-board]");
  var verdict = $("[data-bw-verdict]"), tabs = $("[data-bw-tabs]"), speedSel = $("[data-bw-speed]"), bagEl = $("[data-bw-bag]"), nEl = $("[data-bw-n]");
  var still = !!(window.AO17Reveal && window.AO17Reveal.still) || document.documentElement.classList.contains("reduce-motion")
    || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var cur = null, wi = 0, result = null, play = null, py = null, B = null;
  // ортақ редактор (assets/js/ao17-editor.js): жол нөмірлері, белгіленген жол, Python шегінісі
  var ed = window.AO17Editor ? window.AO17Editor.attach(ta, { onRun: function () { go(); }, onInput: changed })
    : { mark: function () {}, refresh: function () {}, insert: function (t) { ta.value += t; changed(); } };
  if (st.speed != null && speedSel.querySelector('option[value="' + st.speed + '"]')) speedSel.value = String(st.speed);

  // ------------------------------------------------------------------ әлем: карта жолдарын талдау (bota_world.World сияқты)
  function parse(rows) {
    var w = { w: 0, h: rows.length, walls: {}, apples: {}, home: null, x: 0, y: 0, d: 0, bag: 0, bota: false };
    rows.forEach(function (row, y) {
      w.w = Math.max(w.w, row.length);
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x), k = x + "," + y;
        if (ch === "#") w.walls[k] = 1;
        else if (ch === "a") w.apples[k] = 1;
        else if (/[1-9]/.test(ch)) w.apples[k] = Number(ch);
        else if (ch === "H") w.home = [x, y];
        else if (">^<v".indexOf(ch) >= 0) { w.x = x; w.y = y; w.d = ">^<v".indexOf(ch); w.bota = true; }
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
  // әлемді салу (сахна мен құрастырушыға ортақ): тор, тау, киіз үй, алма, Бота -> түйіндер
  function paint(svgEl, g, w) {
    while (g.firstChild) g.removeChild(g.firstChild);
    svgEl.setAttribute("viewBox", "0 0 " + w.w * C + " " + w.h * C);
    svgEl.style.setProperty("--bw-ar", String(w.w / w.h));
    var tiles = el("g", { "class": "bw-tiles" }, g), deco = el("g", {}, g), things = el("g", {}, g);
    var appleG = el("g", { "class": "bw-apples" }, g), fx = el("g", { "class": "bw-fx" }, g);
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
    var P = { w: w, apples: apples, appleG: appleG, fx: fx, g: g, ang: -90 * w.d };
    if (w.bota) {
      P.bota = el("g", { "class": "bw-bota" }, g); P.body = el("g", { "class": "bw-body" }, P.bota);
      P.dir = el("g", { "class": "bw-dir" }, P.bota);
      el("path", { d: "M23 -6 L31 0 L23 6 Z" }, P.dir);
      P.spr = el("g", { "class": "bw-spr" }, P.body);
      place(P, 0); face(P, w.d); aim(P, 0);
    }
    return P;
  }
  function drawBoard(rows) {
    B = paint(svg, board, parse(rows));
    B.rows = rows; B.bag = 0; B.n = 0;
    bagEl.textContent = "0"; nEl.textContent = "0";
    describe();
  }
  function face(P, d) {
    var s = P.spr;
    while (s.firstChild) s.removeChild(s.firstChild);
    var g = el("g", d === 2 ? { transform: "scale(-1 1)" } : {}, s);
    use(d === 1 ? "bw-s-back" : d === 3 ? "bw-s-front" : "bw-s-side", -29, -34, 58, g);
  }
  function place(P, ms) {
    P.bota.style.transitionDuration = ms + "ms";
    P.bota.style.transform = "translate(" + (P.w.x * C + C / 2) + "px," + (P.w.y * C + C / 2) + "px)";
  }
  function aim(P, ms) {
    P.dir.style.transitionDuration = ms + "ms";
    P.dir.style.transform = "rotate(" + P.ang + "deg)";
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
    ed.mark(a[4], /^(bump|nopick|noput)$/.test(kind));
    if (kind === "m") {
      w.x = a[1]; w.y = a[2]; place(B, ms);
      anim(B.body, [{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }], ms);
    } else if (kind === "t") {
      w.d = a[3]; B.ang -= 90; aim(B, ms);
      if (ms) {
        anim(B.spr, [{ transform: "scaleX(1)" }, { transform: "scaleX(.15)" }, { transform: "scaleX(1)" }], ms);
        setTimeout(function (d) { return function () { if (B && B.w === w && w.d === d) face(B, d); }; }(a[3]), ms / 2);
      } else face(B, w.d);
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
      var dx = DIRS[a[3]][0], dy = DIRS[a[3]][1], tx = a[1] + dx, ty = a[2] + dy;
      if (tx < 0 || ty < 0 || tx >= w.w || ty >= w.h) { tx = a[1]; ty = a[2]; }   // шекараға соқтығысса - өз шаршысы жарқылдайды
      flash(tx, ty, ms);
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
    if (res.err && res.err.line) ed.mark(res.err.line, true);
    describe();
    if (res.out) out.textContent = res.out;
    showVerdict();
  }

  // ------------------------------------------------------------------ код өзгерді: нәтиже ескірді
  function changed() {
    if (cur) { st.code[cur.id] = ta.value; save(); }
    if (result || play) { stopPlay(); result = null; marksTabs(); verdict.hidden = true; drawBoard(cur.worlds[wi]); }
  }
  $$("[data-ins]").forEach(function (b) { b.addEventListener("click", function () { ed.insert(b.getAttribute("data-ins")); }); });

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
    if (r.ok && cur.predict) {
      var lw = parse(cur.worlds[wi]), la = w.log[w.log.length - 1];
      if (la) { lw.x = la[1]; lw.y = la[2]; lw.d = la[3]; }
      h = '<p class="bw-v-h"><b>Код аяқталды</b></p><p>Бота ' + cellLabel(lw.x, lw.y) + "да тоқтады, " + DIRNAME[lw.d] + " қарап тұр. «Қадамдап» батырмасымен әр жолды қайта бақылауға болады.</p>";
      verdict.className = "bw-verdict ok";
    } else if (r.ok && cur.custom) {
      h = '<p class="bw-v-h"><b>Өз әлеміңде өтті!</b></p><p>Кодың: ' + r.size + " команда. Әлемді досыңа жібер: «Өз әлемің» бөліміндегі «Сілтемемен бөлісу».</p>";
      verdict.className = "bw-verdict ok";
    } else if (r.ok) {
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
    if (r.lint && r.lint.length) h += '<ul class="bw-lint">' + r.lint.map(function (x) { return "<li>Ескерту (" + x.line + "-жол): " + esc(x.msg) + "</li>"; }).join("") + "</ul>";
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
    stopPlay(); wi = j; marksTabs(); ed.mark(0);
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
    st.level = id; save();
    show(lv, scroll);
    if (scroll && history.replaceState) history.replaceState(null, "", "#l=" + id);
  }
  function show(lv, scroll) {
    var id = lv.id;
    stopPlay(); cur = lv; wi = 0; result = null;
    $("[data-bw-title]").textContent = lv.custom ? lv.title : lv.n + ". " + lv.title;
    $("[data-bw-goal]").innerHTML = '<span class="bw-tag">' + esc(lv.predict ? "Болжап көр · " + lv.concept : lv.custom ? "Өз әлемің" : CH[lv.ch].title + " · " + lv.concept) + "</span> " + esc(lv.goal);
    $("[data-bw-rule]").textContent = lv.predict ? "«Қадамдап» батырмасымен кодты жол-жолымен орында: Бота әр қадамда қайда тұр?" : lv.custom ? "Бұл әлемде жұлдыз берілмейді: мақсат - тек өту." : "3 жұлдыз: " + lv.s3 + " командадан аспайтын код." + (lv.worlds.length > 1 ? " Код " + lv.worlds.length + " әлемнің бәрінде өтуі керек." : "");
    $("[data-bw-tip]").textContent = lv.hint;
    var tip = root.querySelector(".bw-tip"); if (tip) tip.open = false;
    ta.value = st.code[id] != null ? st.code[id] : lv.starter;
    ta.scrollTop = 0;
    out.textContent = ""; verdict.hidden = true;
    buildTabs(); marksTabs(); levelMarks(); ed.refresh(); ed.mark(0);
    drawBoard(lv.worlds[0]);
    if (py) setStatus("Python дайын", "ok");
    if (scroll) { var stg = root.querySelector(".bw-stage"); if (stg && stg.scrollIntoView) stg.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" }); }
  }
  $$("[data-level]").forEach(function (b) { b.addEventListener("click", function () { select(b.getAttribute("data-level"), true); }); });
  $("[data-bw-reset]").addEventListener("click", function () { if (!cur) return; ta.value = cur.starter; ed.refresh(); ed.mark(0); changed(); });
  window.addEventListener("hashchange", function () {
    var m = /^#l=([\w-]+)$/.exec(location.hash);
    if (m && LV[m[1]] && (!cur || cur.id !== m[1])) select(m[1], true);
    else if (/^#w=/.test(location.hash)) openShared(true);
  });

  // ------------------------------------------------------------------ «Болжап көр»: алдымен болжа, сосын іске қос (PRIMM)
  // Код пен әлем беріледі, оқушы Бота тоқтайтын шаршыны таңдайды. Әрекеттер build кезінде есептелген: Python керек емес.
  (function () {
    var psvg = $("[data-bw-psvg]"), pboard = $("[data-bw-pboard]"), pcode = $("[data-bw-pcode]"), pmsg = $("[data-bw-pmsg]");
    var chk = $("[data-bw-pcheck]");
    if (!psvg || !Array.isArray(D.puzzles) || !D.puzzles.length) return;
    var PZ = {}; D.puzzles.forEach(function (z, i) { z.n = i + 1; PZ[z.id] = z; });
    st.pred = obj(st.pred);
    var z = null, guess = null, cx = 0, cy = 0, P = null, timer = 0, busy = false, done = false;
    function marks() {
      $$("[data-pz]").forEach(function (b) {
        var id = b.getAttribute("data-pz"), v = st.pred[id];
        b.setAttribute("aria-pressed", String(!!z && z.id === id));
        b.classList.toggle("is-ok", v === 1); b.classList.toggle("is-bad", v === 0);
        b.querySelector("[data-sr]").textContent = v === 1 ? ": дұрыс болжадың" : v === 0 ? ": болжам қате болды" : "";
      });
    }
    function lines(code) {
      pcode.textContent = "";
      code.replace(/\n$/, "").split("\n").forEach(function (ln, i) {
        var d = document.createElement("div"), n = document.createElement("span"), c2 = document.createElement("code");
        d.className = "bw-pl"; d.setAttribute("data-ln", String(i + 1));
        n.className = "bw-pn"; n.setAttribute("aria-hidden", "true"); n.textContent = String(i + 1);
        c2.textContent = ln || " ";
        d.appendChild(n); d.appendChild(c2); pcode.appendChild(d);
      });
    }
    function hl(line) { $$(".bw-pl").forEach(function (d) { d.classList.toggle("on", Number(d.getAttribute("data-ln")) === line); }); }
    function ring(x, y, cls) { var g = el("g", { "class": cls }, pboard); el("circle", { cx: x * C + C / 2, cy: y * C + C / 2, r: 27 }, g); }
    function draw() {
      P = paint(psvg, pboard, parse(z.worlds[0]));
      if (guess) ring(guess[0], guess[1], "bw-guess");
      el("rect", { x: cx * C + 3, y: cy * C + 3, width: C - 6, height: C - 6, rx: 8, "class": "bw-cur" }, pboard);
      psvg.setAttribute("aria-label", "Болжау торы " + P.w.w + "x" + P.w.h + ". Бота " + cellLabel(P.w.x, P.w.y) + ", " + DIRNAME[P.w.d] + " қарап тұр. "
        + (guess ? "Сенің болжамың: " + cellLabel(guess[0], guess[1]) + "." : "Бота тоқтайтын шаршыны таңда."));
    }
    function open(id) {
      clearTimeout(timer); busy = false; done = false;
      z = PZ[id]; guess = null; cx = 0; cy = 0;
      $("[data-bw-ptitle]").textContent = z.n + ". " + z.title + " · " + z.concept;
      lines(z.code); hl(0); draw(); marks();
      chk.disabled = true; pmsg.textContent = ""; pmsg.className = "bw-pmsg";
      st.pz = id; save();
    }
    function choose(x, y) {
      if (busy) return;
      if (done) { done = false; pmsg.textContent = ""; pmsg.className = "bw-pmsg"; hl(0); }
      guess = [x, y]; cx = x; cy = y; draw();
      chk.disabled = false;
    }
    function cellAt(ev) {
      var pt = psvg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      var m2 = psvg.getScreenCTM(); if (!m2 || !P) return null;
      var p = pt.matrixTransform(m2.inverse()), x = Math.floor(p.x / C), y = Math.floor(p.y / C);
      return x >= 0 && y >= 0 && x < P.w.w && y < P.w.h ? [x, y] : null;
    }
    psvg.addEventListener("pointerdown", function (ev) { var c = cellAt(ev); if (!c) return; ev.preventDefault(); if (psvg.focus) psvg.focus({ preventScroll: true }); choose(c[0], c[1]); });
    psvg.addEventListener("keydown", function (ev) {
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
      if (d && P) { ev.preventDefault(); cx = Math.max(0, Math.min(P.w.w - 1, cx + d[0])); cy = Math.max(0, Math.min(P.w.h - 1, cy + d[1])); draw(); }
      else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); choose(cx, cy); }
    });
    function finish() {
      busy = false; done = true;
      var ok = guess[0] === z.fx && guess[1] === z.fy, at = cellLabel(z.fx, z.fy) + "да";
      ring(z.fx, z.fy, "bw-final");
      st.pred[z.id] = ok ? 1 : st.pred[z.id] === 1 ? 1 : 0; save(); marks();
      pmsg.className = "bw-pmsg " + (ok ? "ok" : "bad");
      pmsg.textContent = (ok ? "Дұрыс! Бота " + at + " тоқтады. " : "Бота " + at + " тоқтады, ал сенің болжамың - " + cellLabel(guess[0], guess[1]) + ". ") + z.why;
      var n = Object.keys(st.pred).filter(function (k) { return st.pred[k] === 1; }).length;
      if (ok && n === D.puzzles.length) pmsg.textContent += " Барлық " + n + " болжам дұрыс!";
    }
    chk.addEventListener("click", function () {
      if (!guess || busy) return;
      busy = true; chk.disabled = true;
      P = paint(psvg, pboard, parse(z.worlds[0])); ring(guess[0], guess[1], "bw-guess");
      var i = 0, ms = speed() ? Math.max(260, Math.min(speed(), 420)) : 0;
      (function step() {
        if (i >= z.log.length) { finish(); return; }
        var a = z.log[i++];
        hl(a[4]);
        if (a[0] === "m") { P.w.x = a[1]; P.w.y = a[2]; place(P, ms); }
        else if (a[0] === "t") { P.w.d = a[3]; P.ang -= 90; aim(P, ms); face(P, a[3]); }
        if (ms) timer = setTimeout(step, ms); else step();
      })();
    });
    $("[data-bw-pagain]").addEventListener("click", function () { if (z) open(z.id); });
    $("[data-bw-pstage]").addEventListener("click", function () {
      if (!z) return;
      show({ id: "pz-" + z.id, custom: true, predict: true, title: "Болжап көр: " + z.title, concept: z.concept, worlds: z.worlds, keys: [], s3: 999,
        goal: "Бота қай шаршыда тоқтайды? Кодты қадамдап орындап, әр жолды бақыла.", starter: z.code, hint: z.why }, true);
    });
    $$("[data-pz]").forEach(function (b) { b.addEventListener("click", function () { open(b.getAttribute("data-pz")); }); });
    open(PZ[st.pz] ? st.pz : D.puzzles[0].id);
  })();

  // ------------------------------------------------------------------ «Өз әлемің»: құрастырушы, ойнау, сілтемемен бөлісу
  var bsvg = $("[data-bw-bsvg]"), bboard = $("[data-bw-bboard]"), bmsg = $("[data-bw-bmsg]"), blive = $("[data-bw-blive]");
  var GOALS = { home: "киіз үйге жет", clean: "далада алма қалдырма", deliver: "барлық алманы киіз үйге жеткіз" };
  var DEF = [".....H", ".#....", ".#..a.", ">..a.."];
  var BL = { grid: [], tool: "wall", cx: 0, cy: 0, P: null, drag: null };
  function okRows(r) {   // сілтемеден не жадтан келген әлемді тексеру
    return Array.isArray(r) && r.length >= 1 && r.length <= 8 && r.every(function (x) { return typeof x === "string" && x.length === r[0].length && x.length >= 3 && x.length <= 10 && /^[.#aH1-9>^<v]+$/.test(x); })
      && (r.join("").match(/[>^<v]/g) || []).length <= 1 && (r.join("").match(/H/g) || []).length <= 1;
  }
  function rowsOf() { return BL.grid.map(function (r) { return r.join(""); }); }
  function goals() { return $$("[data-bw-goal-k]").filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }
  function setGoals(g) { $$("[data-bw-goal-k]").forEach(function (c) { c.checked = g.indexOf(c.value) >= 0; }); }
  function bsave() { st.build = { r: rowsOf(), g: goals() }; save(); }
  function bdraw() {
    BL.P = paint(bsvg, bboard, parse(rowsOf()));
    var w = BL.P.w;
    el("rect", { x: BL.cx * C + 3, y: BL.cy * C + 3, width: C - 6, height: C - 6, rx: 8, "class": "bw-cur" }, bboard);
    $("[data-bw-bw]").value = String(w.w); $("[data-bw-bh]").value = String(w.h);
    var n = 0; Object.keys(w.apples).forEach(function (k) { n += w.apples[k]; });
    bsvg.setAttribute("aria-label", "Әлем құрастырушы: тор " + w.w + "x" + w.h + ". " + (w.bota ? "Бота " + cellLabel(w.x, w.y) + ", " + DIRNAME[w.d] + " қарап тұр. " : "Бота әлі қойылмаған. ")
      + (w.home ? "Киіз үй: " + cellLabel(w.home[0], w.home[1]) + ". " : "Киіз үй жоқ. ") + "Алма: " + n + ", тау: " + Object.keys(w.walls).length + ".");
  }
  function load(rows, g) {
    BL.grid = rows.map(function (r) { return r.split(""); });
    BL.cx = Math.min(BL.cx, rows[0].length - 1); BL.cy = Math.min(BL.cy, rows.length - 1);
    if (g) setGoals(g);
    bdraw();
  }
  function cellName(ch) { return ch === "#" ? "тау" : ch === "H" ? "киіз үй" : ch === "a" ? "1 алма" : /[1-9]/.test(ch) ? ch + " алма" : ">^<v".indexOf(ch) >= 0 ? "Бота, " + DIRNAME[">^<v".indexOf(ch)] + " қарап тұр" : "шөп"; }
  function say(t) { bmsg.textContent = t; }
  // құралды шаршыға қолдану. again - сүйреп бояу (алма көбеймейді, Бота бұрылмайды)
  function put(x, y, again) {
    var g = BL.grid, ch = g[y][x], t = BL.tool, isB = ">^<v".indexOf(ch) >= 0;
    function clear(re) { g.forEach(function (r) { r.forEach(function (c, i) { if (re.test(c)) r[i] = "."; }); }); }
    if (t === "grass") g[y][x] = ".";
    else if (t === "wall") g[y][x] = "#";
    else if (t === "apple") {
      if (isB || ch === "H") { say("Алманы Бота не киіз үй тұрған шаршыға қоюға болмайды."); return; }
      if (again && /[a1-9]/.test(ch)) return;
      var n = ch === "a" ? 1 : /[1-9]/.test(ch) ? Number(ch) : 0;
      g[y][x] = n >= 9 ? "9" : n === 0 ? "a" : String(n + 1);
    } else if (t === "home") {
      if (isB) { say("Киіз үйді Бота тұрған шаршыға қоюға болмайды: Бота үйдің жанынан бастайды."); return; }
      clear(/H/); g[y][x] = "H";
    } else if (t === "bota") {
      if (ch === "H") { say("Ботаны киіз үйдің үстіне қоюға болмайды."); return; }
      if (isB) { if (again) return; g[y][x] = ">v<^".charAt((">v<^".indexOf(ch) + 1) % 4); }   // қайта басса - сағат тілімен бұрылады
      else { clear(/[>^<v]/); g[y][x] = ">"; }
    }
    say("");
    bdraw(); bsave();
    blive.textContent = cellLabel(x, y) + ": " + cellName(g[y][x]);
  }
  function cellAt(ev) {
    var pt = bsvg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    var m2 = bsvg.getScreenCTM(); if (!m2) return null;
    var p = pt.matrixTransform(m2.inverse()), x = Math.floor(p.x / C), y = Math.floor(p.y / C);
    return x >= 0 && y >= 0 && x < BL.grid[0].length && y < BL.grid.length ? [x, y] : null;
  }
  bsvg.addEventListener("pointerdown", function (ev) {
    var c = cellAt(ev);
    if (!c) return;
    ev.preventDefault();
    if (bsvg.focus) bsvg.focus({ preventScroll: true });   // тышқанмен бастап, көрсеткілермен жалғастыруға болсын
    BL.cx = c[0]; BL.cy = c[1];
    BL.drag = c[0] + "," + c[1];
    if (bsvg.setPointerCapture) try { bsvg.setPointerCapture(ev.pointerId); } catch (e) { /* ескі браузер */ }
    put(c[0], c[1], false);
  });
  bsvg.addEventListener("pointermove", function (ev) {
    if (!BL.drag || !(BL.tool === "wall" || BL.tool === "grass")) return;   // сүйреп тек тау мен шөп салынады
    var c = cellAt(ev);
    if (!c || c[0] + "," + c[1] === BL.drag) return;
    BL.drag = c[0] + "," + c[1]; BL.cx = c[0]; BL.cy = c[1];
    put(c[0], c[1], true);
  });
  ["pointerup", "pointercancel"].forEach(function (t) { bsvg.addEventListener(t, function () { BL.drag = null; }); });
  bsvg.addEventListener("keydown", function (ev) {
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (d) {
      ev.preventDefault();
      BL.cx = Math.max(0, Math.min(BL.grid[0].length - 1, BL.cx + d[0])); BL.cy = Math.max(0, Math.min(BL.grid.length - 1, BL.cy + d[1]));
      bdraw(); blive.textContent = cellLabel(BL.cx, BL.cy) + ": " + cellName(BL.grid[BL.cy][BL.cx]);
    } else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); put(BL.cx, BL.cy, false); }
  });
  $$("[data-bw-tool]").forEach(function (r) { r.addEventListener("change", function () { if (r.checked) BL.tool = r.value; }); });
  function resize() {
    var W = Number($("[data-bw-bw]").value), H = Number($("[data-bw-bh]").value), old = BL.grid, g = [];
    for (var y = 0; y < H; y++) { g.push([]); for (var x = 0; x < W; x++) g[y].push(old[y] && old[y][x] ? old[y][x] : "."); }
    BL.grid = g; BL.cx = Math.min(BL.cx, W - 1); BL.cy = Math.min(BL.cy, H - 1);
    bdraw(); bsave();
  }
  $("[data-bw-bw]").addEventListener("change", resize);
  $("[data-bw-bh]").addEventListener("change", resize);
  $$("[data-bw-goal-k]").forEach(function (c) { c.addEventListener("change", bsave); });
  $("[data-bw-bclear]").addEventListener("click", function () {
    var W = BL.grid[0].length, H = BL.grid.length, g = [];
    for (var y = 0; y < H; y++) { g.push([]); for (var x = 0; x < W; x++) g[y].push(x === 0 && y === H - 1 ? ">" : "."); }
    BL.grid = g; bdraw(); bsave(); say("Тор тазаланды: Бота сол жақ төменгі бұрышта.");
  });
  // ойнауға дайын ба: Бота бар, мақсат таңдалған, мақсатқа керек нәрсе бар; киіз үй мен алмаға жол бар ма (ескерту ғана)
  function problems() {
    var w = parse(rowsOf()), g = goals();
    if (!w.bota) return ["Ботаны қой: «Бота» құралын таңдап, шаршыны бас."];
    if (!g.length) return ["Кемінде бір мақсат таңда."];
    if ((g.indexOf("home") >= 0 || g.indexOf("deliver") >= 0) && !w.home) return ["Киіз үй керек: мақсатта «үйге жет» не «жеткіз» бар."];
    if ((g.indexOf("clean") >= 0 || g.indexOf("deliver") >= 0) && !Object.keys(w.apples).length) return ["Алма жоқ: бұл мақсатқа кемінде бір алма керек."];
    return [];
  }
  function unreachable() {
    var w = parse(rowsOf()), seen = {}, q = [[w.x, w.y]], miss = [];
    seen[w.x + "," + w.y] = 1;
    while (q.length) {
      var c = q.shift();
      DIRS.forEach(function (d) {
        var x = c[0] + d[0], y = c[1] + d[1], k = x + "," + y;
        if (x >= 0 && y >= 0 && x < w.w && y < w.h && !w.walls[k] && !seen[k]) { seen[k] = 1; q.push([x, y]); }
      });
    }
    if (w.home && !seen[w.home[0] + "," + w.home[1]]) miss.push("киіз үйге");
    if (Object.keys(w.apples).some(function (k) { return !seen[k]; })) miss.push("кейбір алмаға");
    return miss.length ? "Ескерту: " + miss.join(" және ") + " жол жоқ - тау жолды жауып тұр. Бұл әлемді ешкім өте алмайды." : "";
  }
  function customLevel() {
    var g = goals();
    return { id: "custom", custom: true, title: "Өз әлемің", concept: "құрастырушы", worlds: [rowsOf()], keys: g, s3: 999,
      goal: "Мақсат: " + g.map(function (k) { return GOALS[k]; }).join(", ") + ".",
      starter: "# Өз әлеміңде Ботаны жүргіз\nалға()\n", hint: "Алдымен жоспар құр: Бота қай жаққа қарап тұр, үйге дейін неше қадам, жолда тау бар ма? Қайталанатын жерді цикл не функция ет." };
  }
  function b64(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  $("[data-bw-bplay]").addEventListener("click", function () {
    var p = problems();
    if (p.length) { say(p[0]); return; }
    say(unreachable());
    show(customLevel(), true);
  });
  $("[data-bw-bshare]").addEventListener("click", function () {
    var p = problems();
    if (p.length) { say(p[0]); return; }
    var link = location.origin + location.pathname + "#w=" + b64(JSON.stringify({ r: rowsOf(), g: goals() }));
    var inp = $("[data-bw-blink]");
    inp.value = link; $("[data-bw-bsharebox]").hidden = false; inp.select();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).catch(function () { /* таңдалып тұр */ });
    say(unreachable() || "Сілтеме дайын: оны ашқан адам осы әлемде өз кодын жазады.");
  });
  // сілтемемен келген әлем: құрастырушыға жүктеліп, бірден сахнада ашылады
  function openShared(scroll) {
    var d = null;
    try { d = JSON.parse(unb64(location.hash.slice(3))); } catch (e) { d = null; }
    var g = d && Array.isArray(d.g) ? d.g.filter(function (k) { return GOALS[k]; }) : [];
    if (!d || !okRows(d.r) || !g.length) { say("Сілтемедегі әлем бүлінген: оны ашу мүмкін болмады."); return false; }
    load(d.r, g);
    if (problems().length) { say(problems()[0]); return false; }
    show(customLevel(), scroll);
    return true;
  }
  var sb = obj(st.build);
  load(okRows(sb.r) ? sb.r : DEF, Array.isArray(sb.g) ? sb.g.filter(function (k) { return GOALS[k]; }) : ["home", "clean"]);

  // ------------------------------------------------------------------ бастау: сілтемедегі әлем не деңгей > сақталған > бірінші өтілмеген
  var m = /^#l=([\w-]+)$/.exec(location.hash);
  if (!(/^#w=/.test(location.hash) && openShared(false))) {
    var first = m && LV[m[1]] ? m[1] : LV[st.level] ? st.level : (levelMarks() || ORDER[0]);
    select(first, false);
  }
  boot();
})();
