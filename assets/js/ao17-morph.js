/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 MORPH (tools/academy/morph.py -> academy/morph.html): математиканың пішінге айналуы. Формула мен пішін екі жақты:
   1) матрица - жазықтықтың түрленуі (базис векторын сүйресең - матрица қайта есептеледі; ою кеңістікпен бірге өзгереді);
   2) комплекс функция - тордың майысуы (w нүктесін сүйресең - барлық алғы бейнесі табылады; жергілікті созылу мен бұру);
   3) Фурье - сурет айналатын шеңберлерден (суретті өзің салсаң - коэффициенттер есептеледі).
   Сақтау: «ao17cs:morph» - {m: [a,b,c,d], fn, shape, k}. */
(function () {
  "use strict";
  var root = document.querySelector("[data-morph]"), box = document.getElementById("mo-data");
  if (!root || !box) return;
  var D;
  try { D = JSON.parse(box.textContent); } catch (e) { return; }
  var KEY = "ao17cs:morph";
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function $(s) { return root.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  var st = obj(J(KEY, {}));
  function save() { S(KEY, st); }
  var still = !!(window.AO17Reveal && window.AO17Reveal.still) || document.documentElement.classList.contains("reduce-motion")
    || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function f2(x) { var v = Math.round(x * 100) / 100; return (Object.is(v, -0) ? 0 : v).toLocaleString("en-US", { maximumFractionDigits: 2 }).replace("-", "−"); }
  var COL = {};
  function colors() {
    var cs = getComputedStyle(root);
    ["bg", "grid0", "grid", "axis", "i", "j", "gold", "pos", "neg", "ink", "dim", "r", "b"].forEach(function (k) { COL[k] = cs.getPropertyValue("--mo-" + k).trim() || "#888"; });
  }
  colors();

  // ------------------------------------------------------------------ canvas көмекшісі: әлем координатасы [-R, R]² -> экран
  function Plane(cv, R) {
    var P = { cv: cv, ctx: cv.getContext("2d"), R: R, W: 300 };
    P.fit = function () {
      var w = cv.getBoundingClientRect().width || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
      P.W = w; cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr);
      P.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    P.X = function (x) { return (x + P.R) / (2 * P.R) * P.W; };
    P.Y = function (y) { return (P.R - y) / (2 * P.R) * P.W; };
    P.inv = function (ev) {
      var r = cv.getBoundingClientRect();
      return [(ev.clientX - r.left) / r.width * 2 * P.R - P.R, P.R - (ev.clientY - r.top) / r.height * 2 * P.R];
    };
    P.clear = function () { var c = P.ctx; c.fillStyle = COL.bg; c.fillRect(0, 0, P.W, P.W); };
    P.line = function (pts, color, width, dash) {
      var c = P.ctx;
      c.beginPath(); c.strokeStyle = color; c.lineWidth = width || 1; c.setLineDash(dash || []);
      pts.forEach(function (p, i) { if (i) c.lineTo(P.X(p[0]), P.Y(p[1])); else c.moveTo(P.X(p[0]), P.Y(p[1])); });
      c.stroke(); c.setLineDash([]);
    };
    P.dot = function (p, r, fill, stroke) {
      var c = P.ctx;
      c.beginPath(); c.arc(P.X(p[0]), P.Y(p[1]), r, 0, 7);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
    };
    P.arrow = function (to, color, label) {
      var c = P.ctx, x0 = P.X(0), y0 = P.Y(0), x1 = P.X(to[0]), y1 = P.Y(to[1]), a = Math.atan2(y1 - y0, x1 - x0);
      c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 13 * Math.cos(a - .4), y1 - 13 * Math.sin(a - .4)); c.lineTo(x1 - 13 * Math.cos(a + .4), y1 - 13 * Math.sin(a + .4)); c.closePath(); c.fill();
      c.beginPath(); c.arc(x1, y1, 7, 0, 7); c.fillStyle = COL.bg; c.fill(); c.lineWidth = 2.5; c.stroke();
      c.font = "700 15px Inter, system-ui, sans-serif"; c.fillStyle = color; c.fillText(label, x1 + 10, y1 - 10);
    };
    P.text = function (t, x, y, color) {   // жазу canvas-тан шықпайды
      var c = P.ctx; c.font = "600 12px Inter, system-ui, sans-serif"; c.fillStyle = color || COL.dim;
      c.fillText(t, Math.max(4, Math.min(P.W - c.measureText(t).width - 4, x)), Math.max(14, Math.min(P.W - 6, y)));
    };
    return P;
  }
  var planes = [];
  // алдымен барлық canvas-тың өлшемі, сосын сурет: комплекс сахнада бір draw() екі canvas-қа салады,
  // сондықтан fit() пен draw() аралас жүрсе, w жазықтығы өшіп қалады
  function refit() { planes.forEach(function (p) { p.P.fit(); }); planes.forEach(function (p) { p.draw(); }); }
  window.addEventListener("resize", function () { clearTimeout(refit.t); refit.t = setTimeout(refit, 120); });
  // тақырып ауысса - түстер қайта оқылады
  new MutationObserver(function () { colors(); planes.forEach(function (p) { p.draw(); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

  // ================================================================== 1. МАТРИЦА
  (function () {
    var cv = $("[data-mo-mcv]");
    if (!cv) return;
    var P = Plane(cv, 3.2), m = Array.isArray(st.m) && st.m.length === 4 ? st.m.map(Number) : [1.1, -1.0, 0.5, -0.9], t = 1, drag = null, anim = 0;
    var tIn = $("[data-mo-t]");
    function M() { return [1 + t * (m[0] - 1), t * m[1], t * m[2], 1 + t * (m[3] - 1)]; }
    function ap(A, p) { return [A[0] * p[0] + A[1] * p[1], A[2] * p[0] + A[3] * p[1]]; }
    function eig(A) {   // меншікті мәндер мен векторлар (нақты болса)
      var tr = A[0] + A[3], det = A[0] * A[3] - A[1] * A[2], disc = tr * tr - 4 * det;
      if (disc < -1e-9) return { complex: true, re: tr / 2, im: Math.sqrt(-disc) / 2 };
      var s = Math.sqrt(Math.max(0, disc)), ls = [(tr + s) / 2, (tr - s) / 2];
      return { complex: false, ls: ls, vs: ls.map(function (l) {
        var v = Math.abs(A[1]) > 1e-9 ? [A[1], l - A[0]] : Math.abs(A[2]) > 1e-9 ? [l - A[3], A[2]] : (Math.abs(l - A[0]) < 1e-9 ? [1, 0] : [0, 1]);
        var n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n];
      }) };
    }
    function draw() {
      var A = M(), c = P.ctx, det = A[0] * A[3] - A[1] * A[2], k;
      P.clear();
      for (k = -6; k <= 6; k++) { P.line([[k, -6], [k, 6]], COL.grid0); P.line([[-6, k], [6, k]], COL.grid0); }
      for (k = -6; k <= 6; k++) { P.line([ap(A, [k, -6]), ap(A, [k, 6])], COL.grid, k ? 1 : 2.2); P.line([ap(A, [-6, k]), ap(A, [6, k])], COL.grid, k ? 1 : 2.2); }
      var sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(function (p) { return ap(A, p); });
      c.beginPath(); sq.forEach(function (p, i) { if (i) c.lineTo(P.X(p[0]), P.Y(p[1])); else c.moveTo(P.X(p[0]), P.Y(p[1])); }); c.closePath();
      c.fillStyle = Math.abs(det) < 1e-9 ? "transparent" : det > 0 ? COL.pos : COL.neg; c.globalAlpha = .22; c.fill(); c.globalAlpha = 1;
      c.strokeStyle = det > 0 ? COL.pos : COL.neg; c.lineWidth = 1.5; c.stroke();
      D.ornament.forEach(function (s) { P.line(s.map(function (p) { return ap(A, p); }), COL.gold, 2.6); });
      if (t === 1) {
        var e = eig(A);
        if (!e.complex && !(Math.abs(A[1]) < 1e-9 && Math.abs(A[2]) < 1e-9 && Math.abs(A[0] - A[3]) < 1e-9)) {
          e.vs.forEach(function (v, i) {
            P.line([[-6 * v[0], -6 * v[1]], [6 * v[0], 6 * v[1]]], COL.ink, 1.4, [6, 6]);
            var lp = [2.6 * v[0] * (v[1] < 0 ? -1 : 1), 2.6 * v[1] * (v[1] < 0 ? -1 : 1)];
            P.text("λ = " + f2(e.ls[i]), P.X(lp[0]) + 6, P.Y(lp[1]) + (i ? 16 : -6), COL.ink);
          });
        }
      }
      P.arrow([A[0], A[2]], COL.i, "î"); P.arrow([A[1], A[3]], COL.j, "ĵ");
      cv.setAttribute("aria-label", "Түрленген жазықтық: анықтауыш " + f2(det) + (det < 0 ? ", бағыт аударылды" : Math.abs(det) < 1e-9 ? ", жазықтық сызыққа жаншылды" : ""));
    }
    function read() {
      var A = m, det = A[0] * A[3] - A[1] * A[2], e = eig(A), tr = A[0] + A[3];
      $("[data-mo-mat]").innerHTML = 'A = <span class="mo-mtx" role="img" aria-label="матрица ' + f2(A[0]) + ", " + f2(A[1]) + "; " + f2(A[2]) + ", " + f2(A[3]) + '"><span>' + f2(A[0]) + "</span><span>" + f2(A[1]) + "</span><span>" + f2(A[2]) + "</span><span>" + f2(A[3]) + "</span></span>";
      var area = Math.abs(det) < 1e-9 ? "Жазықтық сызыққа (не нүктеге) жаншылды: аудан 0, кері матрица жоқ." : "Кез келген фигураның ауданы " + f2(Math.abs(det)) + " есе өзгереді" + (det < 0 ? ", бағыты аударылады (айна)." : ", бағыты сақталады.");
      var ev = e.complex ? "комплекс: " + f2(e.re) + " ± " + f2(e.im) + "i - бұру бар, нақты меншікті вектор жоқ" : "λ₁ = " + f2(e.ls[0]) + ", λ₂ = " + f2(e.ls[1]) + " - пунктир сызықтардағы векторлар бұрылмайды, тек λ есе созылады";
      $("[data-mo-mread]").innerHTML = "<div><dt>Анықтауыш</dt><dd>det A = ad − bc = " + f2(det) + "</dd></div><div><dt>Аудан</dt><dd>" + area + "</dd></div><div><dt>Із</dt><dd>a + d = " + f2(tr) + "</dd></div><div><dt>Меншікті мәндер</dt><dd>" + ev + "</dd></div>";
    }
    function sync() {
      ["a", "b", "c", "d"].forEach(function (k, i) { var r = $('[data-m="' + k + '"]'), n = $('[data-mn="' + k + '"]'); r.value = String(m[i]); n.value = String(Math.round(m[i] * 100) / 100); });
      tIn.value = String(t);
      st.m = m; save();
      read(); draw();
    }
    function setM(v, animate) {
      m = v.map(function (x) { return Math.max(-3, Math.min(3, Math.round(x * 100) / 100)); });
      if (animate && !still) play(); else { t = 1; sync(); }
    }
    function play() {
      cancelAnimationFrame(anim);
      var t0 = performance.now();
      (function fr(now) {
        t = Math.min(1, (now - t0) / 1600); t = t * t * (3 - 2 * t);
        sync();
        if ((now - t0) < 1600) anim = requestAnimationFrame(fr); else { t = 1; sync(); }
      })(t0);
    }
    ["a", "b", "c", "d"].forEach(function (k, i) {
      $('[data-m="' + k + '"]').addEventListener("input", function () { cancelAnimationFrame(anim); m[i] = Number(this.value); t = 1; sync(); });
      $('[data-mn="' + k + '"]').addEventListener("change", function () { var v = Number(this.value); if (isFinite(v)) { m[i] = Math.max(-3, Math.min(3, v)); } t = 1; sync(); });
    });
    tIn.addEventListener("input", function () { cancelAnimationFrame(anim); t = Number(tIn.value); draw(); });
    $("[data-mo-tplay]").addEventListener("click", play);
    $("[data-mo-reset]").addEventListener("click", function () { setM([1, 0, 0, 1], false); });
    $$("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () { var p = D.presets.filter(function (x) { return x.id === b.getAttribute("data-preset"); })[0]; if (p) setM(p.m, true); });
    });
    // пішін -> формула: нұсқардың ұшын сүйресең, матрицаның бағаны өзгереді
    cv.addEventListener("pointerdown", function (ev) {
      var w = P.inv(ev), A = M(), di = Math.hypot(w[0] - A[0], w[1] - A[2]), dj = Math.hypot(w[0] - A[1], w[1] - A[3]), tol = 18 / P.W * 2 * P.R;
      drag = di < tol && di <= dj ? "i" : dj < tol ? "j" : null;
      if (!drag) return;
      ev.preventDefault(); cancelAnimationFrame(anim); t = 1;
      if (cv.setPointerCapture) try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* ескі браузер */ }
    });
    cv.addEventListener("pointermove", function (ev) {
      if (!drag) { var w0 = P.inv(ev), A0 = M(), tol0 = 18 / P.W * 2 * P.R; cv.style.cursor = Math.hypot(w0[0] - A0[0], w0[1] - A0[2]) < tol0 || Math.hypot(w0[0] - A0[1], w0[1] - A0[3]) < tol0 ? "grab" : ""; return; }
      var w = P.inv(ev).map(function (x) { return Math.max(-3, Math.min(3, Math.round(x * 10) / 10)); });
      if (drag === "i") { m[0] = w[0]; m[2] = w[1]; } else { m[1] = w[0]; m[3] = w[1]; }
      sync();
    });
    ["pointerup", "pointercancel"].forEach(function (e) { cv.addEventListener(e, function () { drag = null; }); });
    P.fit();
    planes.push({ P: P, draw: draw });
    sync();
  })();

  // ================================================================== 2. КОМПЛЕКС ФУНКЦИЯ
  var Cx = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1]]; },
    mul: function (a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; },
    div: function (a, b) { var d = b[0] * b[0] + b[1] * b[1]; return d ? [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d] : [Infinity, Infinity]; },
    exp: function (a) { var e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
    log: function (a, k) { return [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0]) + 2 * Math.PI * (k || 0)]; },
    sqrt: function (a) { var r = Math.sqrt(Math.hypot(a[0], a[1])), t = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; },
    abs: function (a) { return Math.hypot(a[0], a[1]); },
    s: function (a) { return f2(a[0]) + (a[1] < 0 ? " − " : " + ") + f2(Math.abs(a[1])) + "i"; }
  };
  var FN = {
    sq: { f: function (z) { return Cx.mul(z, z); }, d: function (z) { return [2 * z[0], 2 * z[1]]; }, inv: function (w) { var r = Cx.sqrt(w); return [r, [-r[0], -r[1]]]; }, why: "z² екі мәнді: w-ның екі түбірі бар (±√w), жазықтық бұрышы екі еселенеді." },
    cube: { f: function (z) { return Cx.mul(Cx.mul(z, z), z); }, d: function (z) { var q = Cx.mul(z, z); return [3 * q[0], 3 * q[1]]; },
      inv: function (w) { var r = Math.cbrt(Cx.abs(w)), t = Math.atan2(w[1], w[0]); return [0, 1, 2].map(function (k) { var a = (t + 2 * Math.PI * k) / 3; return [r * Math.cos(a), r * Math.sin(a)]; }); }, why: "z³ - әр w-ның үш алғы бейнесі бар: бұрыштар үш есе." },
    inv: { f: function (z) { return Cx.div([1, 0], z); }, d: function (z) { var q = Cx.mul(z, z); return Cx.div([-1, 0], q); }, inv: function (w) { return [Cx.div([1, 0], w)]; }, why: "1/z шеңбердің ішін сыртына айналдырады: түзулер шеңберге айналады." },
    exp: { f: Cx.exp, d: Cx.exp, inv: function (w) { return [-1, 0, 1].map(function (k) { return Cx.log(w, k); }); }, why: "eᶻ периодты: z мен z + 2πi бір нүктеге барады, сондықтан алғы бейне шексіз көп." },
    sin: { f: function (z) { return [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])]; }, d: function (z) { return [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])]; },
      inv: function (w) {   // arcsin w = -i log(iw + √(1 - w²)), және π - сол
        var iw = [-w[1], w[0]], r = Cx.sqrt(Cx.add([1, 0], Cx.mul([-1, 0], Cx.mul(w, w)))), L = Cx.log(Cx.add(iw, r)), z0 = [L[1], -L[0]];
        return [z0, [Math.PI - z0[0], -z0[1]], [z0[0] - 2 * Math.PI, z0[1]], [-Math.PI - z0[0], -z0[1]]];
      }, why: "sin z нақты осьте шектеулі, ал жорамал бағытта экспонента сияқты өседі." },
    jouk: { f: function (z) { return Cx.add(z, Cx.div([1, 0], z)); }, d: function (z) { return Cx.add([1, 0], Cx.div([-1, 0], Cx.mul(z, z))); },
      inv: function (w) { var r = Cx.sqrt(Cx.add(Cx.mul(w, w), [-4, 0])); return [[(w[0] + r[0]) / 2, (w[1] + r[1]) / 2], [(w[0] - r[0]) / 2, (w[1] - r[1]) / 2]]; },
      why: "Жуковский бейнелеуі бірлік шеңберді кесіндіге жаншиды: ұшақ қанатының профилі осылай есептелген." }
  };
  (function () {
    var zc = $("[data-mo-zcv]"), wc = $("[data-mo-wcv]");
    if (!zc || !wc) return;
    var PZ = Plane(zc, 2.2), PW = Plane(wc, 4), fn = FN[st.fn] ? st.fn : "sq", z = [0.8, 0.6], pre = null, drag = null;
    function lines() {   // тор: тік (қызыл) және көлденең (көк) сызықтар
      var L = [];
      for (var k = -8; k <= 8; k++) {
        var a = [], b = [];
        for (var j = 0; j <= 120; j++) { var s = -2 + 4 * j / 120; a.push([k / 4, s]); b.push([s, k / 4]); }
        L.push({ p: a, c: COL.r }); L.push({ p: b, c: COL.b });
      }
      return L;
    }
    function mapped(pts, F) {   // үзілістерде (полюс, кесу сызығы) сызықты бөлеміз
      var out = [], cur = [];
      pts.forEach(function (p) {
        var w = F.f(p), last = cur[cur.length - 1];
        if (!isFinite(w[0]) || !isFinite(w[1]) || Cx.abs(w) > 40 || (last && Math.hypot(w[0] - last[0], w[1] - last[1]) > 1.6)) { if (cur.length > 1) out.push(cur); cur = []; if (!isFinite(w[0]) || Cx.abs(w) > 40) return; }
        cur.push(w);
      });
      if (cur.length > 1) out.push(cur);
      return out;
    }
    function square(c, h) { return [[c[0] - h, c[1] - h], [c[0] + h, c[1] - h], [c[0] + h, c[1] + h], [c[0] - h, c[1] + h], [c[0] - h, c[1] - h]]; }
    function dense(poly) { var out = []; for (var i = 0; i < poly.length - 1; i++) for (var j = 0; j < 10; j++) out.push([poly[i][0] + (poly[i + 1][0] - poly[i][0]) * j / 10, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * j / 10]); out.push(poly[poly.length - 1]); return out; }
    function draw() {
      var F = FN[fn], L = lines();
      PZ.clear(); PW.clear();
      [PZ, PW].forEach(function (P) { P.line([[-9, 0], [9, 0]], COL.axis, 1.2); P.line([[0, -9], [0, 9]], COL.axis, 1.2); });
      L.forEach(function (l) { PZ.line(l.p, l.c, 1); mapped(l.p, F).forEach(function (s) { PW.line(s, l.c, 1); }); });
      var sq = dense(square(z, 0.12));
      PZ.line(sq, COL.gold, 2.5);
      mapped(sq, F).forEach(function (s) { PW.line(s, COL.gold, 2.5); });
      if (pre) pre.forEach(function (p) { if (Math.abs(p[0]) < 2.3 && Math.abs(p[1]) < 2.3) PZ.dot(p, 7, null, COL.gold); });
      PZ.dot(z, 6, COL.gold, COL.ink);
      var w = F.f(z);
      if (isFinite(w[0]) && Cx.abs(w) < 40) PW.dot(w, 6, COL.gold, COL.ink);
      read();
    }
    function read() {
      var F = FN[fn], w = F.f(z), d = F.d(z), ad = Cx.abs(d), title = D.funcs.filter(function (x) { return x.id === fn; })[0].title;
      var loc = !isFinite(ad) ? "бұл нүктеде функция анықталмаған (полюс)." : ad < 1e-6 ? "f′(z) = 0: бұл нүктеде бұрыштар сақталмайды." : "жергілікті созылу |f′(z)| = " + f2(ad) + " есе, бұру " + f2(Math.atan2(d[1], d[0]) * 180 / Math.PI) + "°. Алтын шаршы бейнеде де «шаршы» болып қалады: бұрыштар сақталады (конформды).";
      $("[data-mo-cread]").textContent = "f(z) = " + title + ": z = " + Cx.s(z) + " → w = " + (isFinite(w[0]) && Cx.abs(w) < 1e6 ? Cx.s(w) : "∞") + ". " + "Осы нүктеде " + loc + (pre ? " Алғы бейнелер: " + pre.filter(function (p) { return isFinite(p[0]); }).length + ". " : " ") + F.why;
      zc.setAttribute("aria-label", "z жазықтығы: z = " + Cx.s(z));
      wc.setAttribute("aria-label", "w жазықтығы: w = f(z) = " + (isFinite(w[0]) ? Cx.s(w) : "∞"));
    }
    function pick(id) {
      fn = id; st.fn = id; save(); pre = null;
      $$("[data-fn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-fn") === id)); });
      draw();
    }
    $$("[data-fn]").forEach(function (b) { b.addEventListener("click", function () { pick(b.getAttribute("data-fn")); }); });
    function grab(P, which) {
      return function (ev) {
        drag = which; ev.preventDefault();
        if (P.cv.setPointerCapture) try { P.cv.setPointerCapture(ev.pointerId); } catch (e) { /* ескі браузер */ }
        move(P)(ev);
      };
    }
    function toW(p) {   // формула кері: w-ны берсең, z-тің барлық мәні табылады; ең жақынын таңдаймыз (үзіліссіз қозғалыс)
      var all = FN[fn].inv(p).filter(function (q) { return isFinite(q[0]) && isFinite(q[1]); });
      if (!all.length) return;
      pre = all;
      z = all.slice().sort(function (a, b) { return Math.hypot(a[0] - z[0], a[1] - z[1]) - Math.hypot(b[0] - z[0], b[1] - z[1]); })[0];
      draw();
    }
    function move(P) {
      return function (ev) {
        if (!drag || (drag === "z") !== (P === PZ)) return;
        var p = P.inv(ev);
        if (drag === "z") { z = p; pre = null; draw(); } else toW(p);
      };
    }
    // пернетақта: нұсқар пернелері нүктені 0.05-ке (Shift-пен 0.25-ке) жылжытады
    function keys(P, which) {
      return function (ev) {
        var dx = { ArrowLeft: -1, ArrowRight: 1 }[ev.key] || 0, dy = { ArrowDown: -1, ArrowUp: 1 }[ev.key] || 0, s = ev.shiftKey ? 0.25 : 0.05;
        if (!dx && !dy) return;
        ev.preventDefault();
        var lim = function (v) { return Math.max(-P.R, Math.min(P.R, Math.round(v * 100) / 100)); };
        if (which === "z") { z = [lim(z[0] + dx * s), lim(z[1] + dy * s)]; pre = null; draw(); return; }
        var w = FN[fn].f(z);
        if (!isFinite(w[0]) || !isFinite(w[1]) || Cx.abs(w) > P.R * 2) w = [0, 0];
        toW([lim(w[0] + dx * s), lim(w[1] + dy * s)]);
      };
    }
    zc.addEventListener("keydown", keys(PZ, "z")); wc.addEventListener("keydown", keys(PW, "w"));
    zc.addEventListener("pointerdown", grab(PZ, "z")); zc.addEventListener("pointermove", move(PZ));
    wc.addEventListener("pointerdown", grab(PW, "w")); wc.addEventListener("pointermove", move(PW));
    ["pointerup", "pointercancel"].forEach(function (e) { zc.addEventListener(e, function () { drag = null; }); wc.addEventListener(e, function () { drag = null; }); });
    PZ.fit(); PW.fit();
    planes.push({ P: PZ, draw: draw }, { P: PW, draw: function () { /* PZ-мен бірге салынады */ } });
    pick(fn);
    root._morphComplex = { setZ: function (x, y) { z = [x, y]; pre = null; draw(); }, setW: function (u, v) { var all = FN[fn].inv([u, v]); pre = all; z = all[0]; draw(); } };   // тесттерге
  })();

  // ================================================================== 3. ФУРЬЕ
  (function () {
    var cv = $("[data-mo-fcv]");
    if (!cv) return;
    var P = Plane(cv, 1.35), kIn = $("[data-mo-k]"), shape = null, C = [], K = Number(st.k) || 24, t = 0, raf = 0, playing = !still, trace = [], drawing = null, last = 0;
    kIn.value = String(K);
    function dft(pts) {   // c_k = (1/N) Σ z_n e^{-2πikn/N}, k = -N/2 .. N/2-1; модулі бойынша кему ретімен
      var N = pts.length, out = [];
      for (var k = -N / 2; k < N / 2; k++) {
        var re = 0, im = 0;
        for (var n = 0; n < N; n++) { var a = -2 * Math.PI * k * n / N, c = Math.cos(a), s = Math.sin(a); re += pts[n][0] * c - pts[n][1] * s; im += pts[n][0] * s + pts[n][1] * c; }
        out.push({ k: k, re: re / N, im: im / N, r: Math.hypot(re, im) / N });
      }
      return out.sort(function (a, b) { return b.r - a.r; });
    }
    function at(tt, n) {   // алғашқы n мүшенің қосындысы: z(t) = Σ c_k e^{2πikt}
      var x = 0, y = 0;
      for (var i = 0; i < n && i < C.length; i++) { var c = C[i], a = 2 * Math.PI * c.k * tt, co = Math.cos(a), si = Math.sin(a); x += c.re * co - c.im * si; y += c.re * si + c.im * co; }
      return [x, y];
    }
    function approx() { var out = []; for (var i = 0; i <= 256; i++) out.push(at(i / 256, K)); return out; }
    function err() {   // орташа қате: бастапқы нүктелер мен K мүшелі жуықтау арасы
      var N = shape.length, s = 0;
      for (var n = 0; n < N; n++) { var p = at(n / N, K); s += Math.hypot(p[0] - shape[n][0], p[1] - shape[n][1]); }
      return s / N;
    }
    function draw() {
      P.clear();
      if (drawing) { P.line(drawing, COL.gold, 2.5); P.text("Сал да, жібер", 12, 22, COL.ink); return; }
      if (!shape) return;
      P.line(shape.concat([shape[0]]), COL.grid, 1.5, [4, 5]);
      P.line(approx(), COL.gold, 2.6);
      // эпициклдер: ең үлкен мүшеден бастап, әр шеңбер келесісінің центрі
      var x = 0, y = 0, c = P.ctx;
      for (var i = 0; i < K && i < C.length; i++) {
        var q = C[i], a = 2 * Math.PI * q.k * t, nx = x + q.re * Math.cos(a) - q.im * Math.sin(a), ny = y + q.re * Math.sin(a) + q.im * Math.cos(a);
        if (q.k !== 0 && q.r * P.W / (2 * P.R) > 0.8) { c.beginPath(); c.arc(P.X(x), P.Y(y), q.r * P.W / (2 * P.R), 0, 7); c.strokeStyle = COL.j; c.globalAlpha = .35; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; }
        P.line([[x, y], [nx, ny]], COL.ink, 1.2);
        x = nx; y = ny;
      }
      if (trace.length > 1) P.line(trace, COL.i, 2.4);
      P.dot([x, y], 4.5, COL.i);
    }
    function read() {
      if (!shape) return;
      var top = C.filter(function (c) { return c.k !== 0; }).slice(0, 3).map(function (c) { return "c" + (c.k < 0 ? "₋" : "") + String(Math.abs(c.k)).split("").map(function (d) { return "₀₁₂₃₄₅₆₇₈₉"[d]; }).join("") + " = " + f2(c.r); });
      $("[data-mo-fread]").textContent = "z(t) = Σ cₖ e^(2πikt): " + K + " шеңбер (" + K + " мүше). Ең үлкен мүшелер: " + top.join(", ") + ". Орташа қате: " + f2(err()) + ".";
      $("[data-mo-kout]").textContent = String(K);
      cv.setAttribute("aria-label", "Фурье эпициклдері: " + K + " шеңбер, орташа қате " + f2(err()));
    }
    function use(pts, id) {
      shape = pts; C = dft(pts); trace = []; t = 0;
      st.shape = id; save();
      $$("[data-shape]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-shape") === id)); });
      read(); draw();
    }
    function loop(now) {
      if (!playing) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      t = (t + dt / 8) % 1;
      var p = at(t, K); trace.push(p); if (trace.length > 220) trace.shift();
      draw();
      raf = requestAnimationFrame(loop);
    }
    function setPlay(on) {   // азайтылған қозғалыс режимінде өзі басталмайды, бірақ батырмамен ойнайды
      playing = on; last = 0;
      $("[data-mo-fplay]").textContent = playing ? "Тоқтату" : "Ойнату";
      cancelAnimationFrame(raf);
      if (playing) raf = requestAnimationFrame(loop); else draw();
    }
    $("[data-mo-fplay]").addEventListener("click", function () { setPlay(!playing); });
    kIn.addEventListener("input", function () { K = Number(kIn.value); st.k = K; save(); trace = []; read(); draw(); });
    $$("[data-shape]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-shape");
        if (id === "draw") { drawing = []; shape = null; trace = []; cv.classList.add("is-draw"); $$("[data-shape]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); $("[data-mo-fread]").textContent = "Тордың үстінде тышқанмен не саусақпен бір тұйық сызық сал."; draw(); return; }
        drawing = null; cv.classList.remove("is-draw");
        var s = D.shapes.filter(function (x) { return x.id === id; })[0];
        if (s) use(s.pts, id);
      });
    });
    // өз суретің -> коэффициенттер: сызықты бірдей 256 нүктеге бөліп, ортаға келтіреміз
    function resample(pts, n) {
      var ps = pts.concat([pts[0]]), seg = [], total = 0, out = [], i = 0, acc = 0;
      for (var j = 0; j < ps.length - 1; j++) { var l = Math.hypot(ps[j + 1][0] - ps[j][0], ps[j + 1][1] - ps[j][1]); seg.push(l); total += l; }
      for (var k = 0; k < n; k++) {
        var target = total * k / n;
        while (i < seg.length - 1 && acc + seg[i] < target) { acc += seg[i]; i++; }
        var tt = seg[i] ? (target - acc) / seg[i] : 0;
        out.push([ps[i][0] + (ps[i + 1][0] - ps[i][0]) * tt, ps[i][1] + (ps[i + 1][1] - ps[i][1]) * tt]);
      }
      var xs = out.map(function (p) { return p[0]; }), ys = out.map(function (p) { return p[1]; });
      var cx = (Math.max.apply(null, xs) + Math.min.apply(null, xs)) / 2, cy = (Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2;
      var sc = 1 / (Math.max(Math.max.apply(null, xs) - Math.min.apply(null, xs), Math.max.apply(null, ys) - Math.min.apply(null, ys)) / 2 || 1);
      return out.map(function (p) { return [(p[0] - cx) * sc, (p[1] - cy) * sc]; });
    }
    cv.addEventListener("pointerdown", function (ev) {
      if (!drawing) return;
      ev.preventDefault(); drawing = [P.inv(ev)];
      if (cv.setPointerCapture) try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* ескі браузер */ }
      cv._down = true; draw();
    });
    cv.addEventListener("pointermove", function (ev) { if (drawing && cv._down) { drawing.push(P.inv(ev)); draw(); } });
    ["pointerup", "pointercancel"].forEach(function (e) {
      cv.addEventListener(e, function () {
        if (!drawing || !cv._down) return;
        cv._down = false;
        if (drawing.length < 12) { $("[data-mo-fread]").textContent = "Сызық тым қысқа: тағы сал."; drawing = []; draw(); return; }
        var pts = resample(drawing, 256);
        drawing = null; cv.classList.remove("is-draw"); use(pts, "draw");
      });
    });
    P.fit();
    planes.push({ P: P, draw: draw });
    var s0 = D.shapes.filter(function (x) { return x.id === st.shape; })[0] || D.shapes[0];
    use(s0.pts, s0.id);
    setPlay(!still);
    root._morphFourier = { use: function (pts) { use(resample(pts, 256), "draw"); }, err: err };   // тесттерге
  })();
})();
