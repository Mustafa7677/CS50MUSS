/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* Ою студиясы (tools/academy/oyu.py -> academy/oyu.html). Оқушы коды нағыз Python-да орындалады: Pyodide сайттың ортақ
   CS50KZ.getPyodide() арқылы жүктеледі, assets/py/oyu_turtle.py (turtle-дің шағын көшірмесі) сызықтарды жазып береді,
   мұнда олар SVG-ге қалам сияқты сызылып салынады. Тапсырма тексерісі: сурет пен мақсат 220x220 растрға айналып, қабаттасу
   үлесі (IoU) салыстырылады - бағыты мен реті маңызды емес. Сақтау: «ao17cs:oyu» - {code: {тапсырма|free: код}, done, task}.
   Бөлісу: код сілтеменің #k= бөлігінде (base64url), сервер қажет емес. */
(function () {
  "use strict";
  var root = document.querySelector("[data-oyu]"), box = document.getElementById("oy-data");
  if (!root || !box) return;
  var D;
  try { D = JSON.parse(box.textContent); } catch (e) { return; }
  var KEY = "ao17cs:oyu", NS = "http://www.w3.org/2000/svg";
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function $(s) { return root.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  var st = obj(J(KEY, {}));
  st.code = obj(st.code); st.done = obj(st.done);
  function save() { S(KEY, st); }

  var ta = $("[data-oy-code]"), runB = $("[data-oy-run]"), status = $("[data-oy-status]"), out = $("[data-oy-out]");
  var drawG = $("[data-oy-draw]"), targetG = $("[data-oy-target]"), svg = $("[data-oy-svg]");
  var TASK = {}; D.tasks.forEach(function (t) { TASK[t.id] = t; });
  var EX = {}; D.examples.forEach(function (e) { EX[e.id] = e; });
  var mode = "free", last = [];
  var still = !!(window.AO17Reveal && window.AO17Reveal.still) || document.documentElement.classList.contains("reduce-motion");

  // ------------------------------------------------------------------ сурет: тасбақа жазбасы -> SVG (y осі жоғары)
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function pts(p) { return p.map(function (q) { return q[0] + "," + (-q[1]); }).join(" "); }
  function paint(g, items, ghost) {
    while (g.firstChild) g.removeChild(g.firstChild);
    var fills = [], strokes = [];
    items.forEach(function (it) {
      if (it.t === "f") fills.push(el("polygon", { points: pts(it.p), fill: ghost ? "currentColor" : it.f }));
      else if (it.t === "s") strokes.push(el("polyline", { points: pts(it.p), fill: "none", stroke: ghost ? "currentColor" : it.c, "stroke-width": ghost ? Math.max(6, it.w + 4) : it.w, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      else if (it.t === "d") strokes.push(el("circle", { cx: it.x, cy: -it.y, r: it.r, fill: ghost ? "currentColor" : it.c }));
    });
    fills.concat(strokes).forEach(function (e) { g.appendChild(e); });
    return { fills: fills, strokes: strokes };
  }
  function len(p) { var n = 0; for (var i = 1; i < p.length; i++) n += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return n; }
  function draw(items) {
    last = items;
    var parts = paint(drawG, items, false), speed = Number($("[data-oy-speed]").value);
    if (still || !speed || !drawG.animate) return;
    // қалам сияқты: сызықтар кезекпен, ұзындығына қарай (жалпы уақыт - қалыпты 3.5 с, баяу 9 с ішінде)
    var segs = items.filter(function (it) { return it.t !== "f"; }), total = segs.reduce(function (n, it) { return n + (it.t === "s" ? len(it.p) : 10); }, 0) || 1;
    var budget = speed === 3 ? 9000 : 3500, k = Math.min(1.6, budget / total), t = 0;
    parts.strokes.forEach(function (e, i) {
      var it = segs[i], L = it.t === "s" ? Math.max(1, len(it.p)) : 10, d = Math.max(30, L * k);
      if (it.t === "s") {
        e.style.strokeDasharray = L; e.style.strokeDashoffset = L;
        e.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: d, delay: t, fill: "forwards", easing: "linear" });
      } else e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: t, fill: "backwards" });
      t += d;
    });
    parts.fills.forEach(function (e) { e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: t, fill: "backwards" }); });
  }

  // ------------------------------------------------------------------ Python
  var py = null;
  function setStatus(t, cls) { status.textContent = t; status.className = "oy-status" + (cls ? " " + cls : ""); }
  async function boot() {
    try {
      // сайттың ортақ скрипті (main.js) CS50KZ-ті беттің соңында жариялайды: дайын болғанша күтеміз
      for (var i = 0; i < 200 && !(window.CS50KZ && typeof window.CS50KZ.getPyodide === "function"); i++) await new Promise(function (r) { setTimeout(r, 50); });
      if (!window.CS50KZ || typeof window.CS50KZ.getPyodide !== "function") throw new Error("Python жүктегіш табылмады");
      var p = await window.CS50KZ.getPyodide();
      var res = await fetch(new URL("../assets/py/oyu_turtle.py", location.href));
      if (!res.ok) throw new Error("oyu_turtle.py жүктелмеді");
      p.globals.set("OYU_SRC", await res.text());
      p.runPython("import sys, types\n_m = types.ModuleType('oyu_turtle')\nexec(OYU_SRC, _m.__dict__)\nsys.modules['oyu_turtle'] = _m\ndel _m");
      py = p;
      runB.disabled = false;
      setStatus("Python дайын", "ok");
      run();
    } catch (e) {
      setStatus("Python жүктелмеді: " + (e && e.message ? e.message : e) + ". Желіні тексеріп, бетті жаңарт.", "bad");
    }
  }
  function run() {
    if (!py) return;
    var code = ta.value;
    st.code[mode] = code; save();
    var r;
    try {
      py.globals.set("OYU_CODE", code);
      r = JSON.parse(py.runPython("import oyu_turtle\noyu_turtle.run(OYU_CODE)"));
    } catch (e) { r = { items: [], out: "", err: { msg: String(e && e.message ? e.message : e).split("\n").slice(-2).join(" "), line: 0 } }; }
    draw(r.items || []);
    var txt = r.out || "";
    if (r.err) txt += (txt ? "\n" : "") + "Қате" + (r.err.line ? " (" + r.err.line + "-жол)" : "") + ": " + r.err.msg + (r.err.hint ? "\nКеңес: " + r.err.hint : "");
    (r.warn || []).forEach(function (w) { txt += (txt ? "\n" : "") + "Ескерту (" + w.line + "-жол): " + w.msg; });
    out.textContent = txt;
    out.className = "oy-out" + (r.err ? " bad" : "");
    ed.mark(r.err && r.err.line ? r.err.line : 0, true);   // қате жолы редакторда қызылмен
    setStatus(r.err ? "Қате бар" : "Дайын: " + (r.moves || 0) + " қозғалыс", r.err ? "bad" : "ok");
    $("[data-oy-verdict]").textContent = "";
  }
  runB.addEventListener("click", run);

  // ------------------------------------------------------------------ редактор: ортақ AO17 редакторы (assets/js/ao17-editor.js)
  // жол нөмірлері, қате жолы, Python шегінісі (Enter, Tab, Backspace), Esc + Tab - шығу, Ctrl+Enter - іске қосу
  var ed = window.AO17Editor ? window.AO17Editor.attach(ta, { onRun: run, onInput: function () { st.code[mode] = ta.value; save(); } })
    : { mark: function () {}, refresh: function () {} };

  // ------------------------------------------------------------------ тапсырмалар
  var tcard = $("[data-oy-tcard]");
  function setMode(m, code) {
    mode = m;
    var t = TASK[m];
    $$("[data-task]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-task") === m)); });
    tcard.hidden = !t;
    if (t) {
      $("[data-oy-ttitle]").textContent = (D.tasks.indexOf(t) + 1) + ". " + t.title;
      $("[data-oy-tgoal]").textContent = t.goal;
      paint(targetG, $("[data-oy-showt]").checked ? t.target : [], true);
    } else paint(targetG, [], true);
    ta.value = code != null ? code : (st.code[m] != null ? st.code[m] : t ? t.starter : EX.koshkar.code);
    ed.refresh(); ed.mark(0);
    st.task = m; save();
    $("[data-oy-verdict]").textContent = "";
  }
  function marks() { $$("[data-task]").forEach(function (b) { b.classList.toggle("is-done", !!st.done[b.getAttribute("data-task")]); }); }
  $$("[data-task]").forEach(function (b) {
    b.addEventListener("click", function () { var id = b.getAttribute("data-task"); setMode(mode === id ? "free" : id); run(); });
  });
  $("[data-oy-showt]").addEventListener("change", function () { paint(targetG, this.checked && TASK[mode] ? TASK[mode].target : [], true); });
  $("[data-oy-reset]").addEventListener("click", function () { ta.value = TASK[mode] ? TASK[mode].starter : EX.koshkar.code; ed.refresh(); st.code[mode] = ta.value; save(); run(); });

  // суретті мақсатпен салыстыру: екеуі де растрға, қабаттасу үлесі (IoU)
  function raster(items) {
    var c = document.createElement("canvas"); c.width = c.height = 220;
    var g = c.getContext("2d");
    g.translate(110, 110); g.scale(0.5, -0.5);
    g.lineWidth = 7; g.lineCap = g.lineJoin = "round"; g.strokeStyle = g.fillStyle = "#000";
    items.forEach(function (it) {
      g.beginPath();
      if (it.t === "d") { g.arc(it.x, it.y, Math.max(it.r, 4), 0, 7); g.fill(); return; }
      it.p.forEach(function (q, i) { if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); });
      if (it.t === "f") { g.closePath(); g.fill(); } else g.stroke();
    });
    return g.getImageData(0, 0, 220, 220).data;
  }
  function iou(a, b) {
    var inter = 0, uni = 0;
    for (var i = 3; i < a.length; i += 4) { var x = a[i] > 40, y = b[i] > 40; if (x || y) uni++; if (x && y) inter++; }
    return uni ? inter / uni : 0;
  }
  $("[data-oy-check]").addEventListener("click", function () {
    var t = TASK[mode], v = $("[data-oy-verdict]");
    if (!t) return;
    var score = last.length ? iou(raster(last), raster(t.target)) : 0, ok = score >= 0.82;
    v.className = "oy-verdict " + (ok ? "ok" : "bad");
    v.textContent = ok ? "Дәл келді! «" + t.title + "» тапсырмасы орындалды." : "Әлі ұқсамайды: ұқсастық " + Math.round(score * 100) + "%. Сұр сызық - мақсат: қай жерде айырмашылық бар?";
    if (ok) {
      st.done[t.id] = st.done[t.id] || Date.now(); save(); marks();
      if (window.CS50KZ && typeof window.CS50KZ.check === "function") window.CS50KZ.check();   // «Оюшы» жетістігі
    }
  });

  // ------------------------------------------------------------------ галерея
  $$("[data-example]").forEach(function (b) {
    b.addEventListener("click", function () {
      var e = EX[b.getAttribute("data-example")];
      setMode("free", e.code);
      st.code.free = e.code; save();
      run();
      ta.scrollIntoView({ block: "nearest" });
    });
  });

  // ------------------------------------------------------------------ бөлісу және жүктеу
  function b64(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  $("[data-oy-share]").addEventListener("click", function () {
    var link = location.origin + location.pathname + "#k=" + b64(ta.value.slice(0, 8000));
    var inp = $("[data-oy-link]");
    inp.value = link; $("[data-oy-sharebox]").hidden = false; inp.select();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).catch(function () { /* таңдалып тұр */ });
  });
  function svgText() {
    var s = '<svg xmlns="' + NS + '" viewBox="-220 -220 440 440" width="880" height="880"><rect x="-220" y="-220" width="440" height="440" fill="#f7f0df"/>' + drawG.innerHTML.replace(/ style="[^"]*"/g, "") + "</svg>";
    return s;
  }
  function download(blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  $("[data-oy-svgdl]").addEventListener("click", function () { download(new Blob([svgText()], { type: "image/svg+xml" }), "ao17-oyu.svg"); });
  $("[data-oy-png]").addEventListener("click", function () {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas"); c.width = c.height = 880;
      c.getContext("2d").drawImage(img, 0, 0, 880, 880);
      c.toBlob(function (b) { if (b) download(b, "ao17-oyu.png"); }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText());
  });

  // ------------------------------------------------------------------ бастау: сілтемедегі код > сақталған тапсырма > еркін сурет
  var shared = null;
  if (/^#k=/.test(location.hash)) { try { shared = unb64(location.hash.slice(3)); } catch (e) { shared = null; } }
  if (shared != null) setMode("free", shared);
  else setMode(TASK[st.task] ? st.task : "free");
  marks();
  boot();
})();
