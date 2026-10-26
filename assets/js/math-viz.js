/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
 * «Математика» курсының интерактивті визуализаторлары (canvas). Vanilla JS, сыртқы кітапхана жоқ; өрнектер math-course.js қауіпсіз парсерімен.
 * Беттегі <div class="math-viz" data-viz="ТҮРІ" data-title="..." data-config='{...JSON...}'></div> өздігінен қосылады.
 * Түрлері: graph (функция графигі, масштаб/жылжыту, параметр слайдері), tangent (туынды/жанама/қиюшы), riemann (Риман қосындылары),
 *          vectors (2D векторлар), lintrans (сызықтық түрлендіру), series (қатар қосындылары), taylor (Тейлор көпмүшеліктері), dist (үлестірім гистограммасы).
 * Мобильді: canvas сыйымдылығы 100%, бір саусақпен көлденең жылжыту (тік қозғалыс бетті айналдырады), екі саусақпен масштаб, батырмалар мен слайдерлер.
 */
(function () {
  "use strict";
  var M = function () { return window.CS50KZ_MATH; };
  var PAL = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];
  var REG = {}, ALL = [], UID = 0;
  var ce = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var css = function (n, d) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || d; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function fmt(v, d) {
    if (!isFinite(v)) return String(v);
    d = d == null ? 3 : d;
    var s = parseFloat(v.toFixed(d));
    if (Object.is(s, -0)) s = 0;
    return String(s).replace("-", "−");
  }
  function niceStep(range, target) {
    var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }
  function tex(el, t) { var m = M(); if (window.katex) { try { window.katex.render(t, el, { throwOnError: false, strict: "ignore" }); return; } catch (e) { /* ештеңе */ } } el.textContent = t; }
  function compile(src, vars) {
    var api = M();
    if (!api) throw new Error("math-course.js жүктелмеді");
    return api.compileSrc(src, { vars: vars });
  }
  function slider(label, o) {
    var id = "mv" + (++UID), wrap = ce("label"), nm = ce("span", null, label), inp = ce("input"), val = ce("span", "mv-val");
    inp.type = "range"; inp.id = id; inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.v;
    inp.setAttribute("aria-label", o.aria || label);
    var upd = function () { val.textContent = fmt(+inp.value, o.dp == null ? 2 : o.dp); };
    inp.addEventListener("input", upd); upd();
    wrap.append(nm, inp, val);
    return { el: wrap, inp: inp, get: function () { return +inp.value; }, set: function (v) { inp.value = v; upd(); } };
  }
  function button(txt, fn, aria) { var b = ce("button", "mv-btn", txt); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

  /* ---------- Координата жүйесі бар canvas ---------- */
  function Plot(root, opts) {
    var self = this;
    this.opts = opts || {};
    this.wrap = ce("div", "mv-canvas-wrap");
    this.cv = ce("canvas", "mv-canvas" + (opts.fixed ? " fixed" : ""));
    this.cv.tabIndex = 0;
    this.cv.setAttribute("role", "img");
    this.cv.setAttribute("aria-label", opts.aria || "График");
    this.wrap.appendChild(this.cv);
    this.ctx = this.cv.getContext("2d");
    var v = opts.view || [-6, 6, -4, 4];
    this.v0 = v.slice(); this.x0 = v[0]; this.x1 = v[1]; this.y0 = v[2]; this.y1 = v[3];
    this.W = 300; this.H = 200; this.draw = function () {};
    this.aspect = opts.aspect || 0.62;
    var pts = {}, last = null;
    this.cv.addEventListener("mv:redraw", function () { self.draw(); });
    this.cv.addEventListener("pointerdown", function (e) {
      if (opts.fixed) return;
      self.cv.setPointerCapture && self.cv.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      last = null; self.cv.classList.add("dragging");
    });
    this.cv.addEventListener("pointermove", function (e) {
      var p = pts[e.pointerId];
      if (!p) { if (opts.hover) opts.hover(self.invX(e.clientX - self.cv.getBoundingClientRect().left), self.invY(e.clientY - self.cv.getBoundingClientRect().top)); return; }
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var o = pts[ids[0] === String(e.pointerId) ? ids[1] : ids[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y);
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
        if (d0 > 0 && d1 > 0) { var r = self.cv.getBoundingClientRect(); self.zoom(d0 / d1, ((e.clientX + o.x) / 2) - r.left, ((e.clientY + o.y) / 2) - r.top); }
        return;
      }
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (e.pointerType === "touch") dy = 0; // тік қозғалыс бетті айналдырады
      self.pan(-dx, -dy);
    });
    var up = function (e) { delete pts[e.pointerId]; self.cv.classList.remove("dragging"); };
    this.cv.addEventListener("pointerup", up); this.cv.addEventListener("pointercancel", up);
    this.cv.addEventListener("wheel", function (e) {
      if (opts.fixed || document.activeElement !== self.cv) return;
      e.preventDefault();
      var r = self.cv.getBoundingClientRect();
      self.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    this.cv.addEventListener("keydown", function (e) {
      if (opts.fixed) return;
      var k = e.key, st = 40;
      if (k === "ArrowLeft") self.pan(-st, 0); else if (k === "ArrowRight") self.pan(st, 0);
      else if (k === "ArrowUp") self.pan(0, -st); else if (k === "ArrowDown") self.pan(0, st);
      else if (k === "+" || k === "=") self.zoom(1 / 1.25); else if (k === "-" || k === "_") self.zoom(1.25);
      else if (k === "0") self.reset(); else return;
      e.preventDefault();
    });
    this.fit = function () {
      var w = Math.max(220, Math.floor(self.wrap.clientWidth || root.clientWidth || 300)), hh = Math.round(clamp(w * self.aspect, 220, 440));
      var dpr = window.devicePixelRatio || 1;
      if (self.W === w && self.H === hh && self.dpr === dpr) return;
      self.W = w; self.H = hh; self.dpr = dpr;
      self.cv.width = Math.round(w * dpr); self.cv.height = Math.round(hh * dpr);
      self.cv.style.height = hh + "px";
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (self.opts.equal) self.equalize();
      self.draw();
    };
  }
  Plot.prototype.X = function (x) { return (x - this.x0) / (this.x1 - this.x0) * this.W; };
  Plot.prototype.Y = function (y) { return this.H - (y - this.y0) / (this.y1 - this.y0) * this.H; };
  Plot.prototype.invX = function (px) { return this.x0 + px / this.W * (this.x1 - this.x0); };
  Plot.prototype.invY = function (py) { return this.y0 + (this.H - py) / this.H * (this.y1 - this.y0); };
  Plot.prototype.pan = function (dpx, dpy) {
    var dx = dpx / this.W * (this.x1 - this.x0), dy = -dpy / this.H * (this.y1 - this.y0);
    this.x0 += dx; this.x1 += dx; this.y0 += dy; this.y1 += dy; this.draw();
  };
  Plot.prototype.zoom = function (f, px, py) {
    if (px == null) { px = this.W / 2; py = this.H / 2; }
    var cx = this.invX(px), cy = this.invY(py);
    var nx0 = cx + (this.x0 - cx) * f, nx1 = cx + (this.x1 - cx) * f, ny0 = cy + (this.y0 - cy) * f, ny1 = cy + (this.y1 - cy) * f;
    if (nx1 - nx0 < 1e-6 || nx1 - nx0 > 1e6) return;
    this.x0 = nx0; this.x1 = nx1; this.y0 = ny0; this.y1 = ny1; this.draw();
  };
  Plot.prototype.reset = function () { this.x0 = this.v0[0]; this.x1 = this.v0[1]; this.y0 = this.v0[2]; this.y1 = this.v0[3]; if (this.opts.equal) this.equalize(); this.draw(); };
  Plot.prototype.equalize = function () { /* бірдей масштаб (векторлар, түрлендірулер) */
    var cx = (this.x0 + this.x1) / 2, cy = (this.y0 + this.y1) / 2, wx = this.x1 - this.x0, hy = wx * this.H / this.W;
    this.y0 = cy - hy / 2; this.y1 = cy + hy / 2; this.x0 = cx - wx / 2; this.x1 = cx + wx / 2;
  };
  Plot.prototype.clear = function () {
    var c = this.ctx;
    c.clearRect(0, 0, this.W, this.H);
    c.fillStyle = css("--surface", "#fff"); c.fillRect(0, 0, this.W, this.H);
  };
  Plot.prototype.grid = function (opts) {
    opts = opts || {};
    var c = this.ctx, bd = css("--border", "#ddd"), tx = css("--muted", "#555"), ink = css("--text", "#111");
    var sx = niceStep(this.x1 - this.x0, Math.max(3, this.W / 80)), sy = niceStep(this.y1 - this.y0, Math.max(3, this.H / 60));
    c.lineWidth = 1; c.font = "11px " + css("--font", "sans-serif"); c.textBaseline = "top";
    var x, y, ax = clamp(this.Y(0), 0, this.H), ay = clamp(this.X(0), 0, this.W);
    if (!opts.noGrid) {
      c.strokeStyle = bd; c.beginPath();
      for (x = Math.ceil(this.x0 / sx) * sx; x <= this.x1; x += sx) { c.moveTo(Math.round(this.X(x)) + .5, 0); c.lineTo(Math.round(this.X(x)) + .5, this.H); }
      for (y = Math.ceil(this.y0 / sy) * sy; y <= this.y1; y += sy) { c.moveTo(0, Math.round(this.Y(y)) + .5); c.lineTo(this.W, Math.round(this.Y(y)) + .5); }
      c.stroke();
    }
    c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, ax); c.lineTo(this.W, ax); c.moveTo(ay, 0); c.lineTo(ay, this.H); c.stroke();
    c.fillStyle = tx;
    if (!opts.noLabels) {
      for (x = Math.ceil(this.x0 / sx) * sx; x <= this.x1; x += sx) { if (Math.abs(x) < sx / 2) continue; c.textAlign = "center"; c.fillText(fmt(x, 6), this.X(x), clamp(ax + 3, 2, this.H - 14)); }
      for (y = Math.ceil(this.y0 / sy) * sy; y <= this.y1; y += sy) { if (Math.abs(y) < sy / 2) continue; c.textAlign = "left"; c.fillText(fmt(y, 6), clamp(ay + 4, 2, this.W - 36), this.Y(y) - 6); }
    }
    c.textAlign = "left";
  };
  Plot.prototype.curve = function (fn, color, width, dash) {
    var c = this.ctx, n = Math.min(900, Math.round(this.W * 1.2)), i, prev = null, span = this.y1 - this.y0;
    c.strokeStyle = color; c.lineWidth = width || 2.4; c.setLineDash(dash || []); c.lineJoin = "round";
    c.beginPath();
    var open = false;
    for (i = 0; i <= n; i++) {
      var x = this.x0 + (this.x1 - this.x0) * i / n, y = fn(x);
      if (!isFinite(y) || Math.abs(y) > 1e7) { open = false; prev = null; continue; }
      var px = this.X(x), py = this.Y(y);
      if (prev !== null && Math.abs(y - prev) > span * 1.5) { open = false; }
      if (!open) { c.moveTo(px, py); open = true; } else c.lineTo(px, py);
      prev = y;
    }
    c.stroke(); c.setLineDash([]);
  };
  Plot.prototype.dot = function (x, y, r, color, stroke) {
    var c = this.ctx; c.beginPath(); c.arc(this.X(x), this.Y(y), r, 0, 6.2832); c.fillStyle = color; c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  };
  Plot.prototype.line = function (x1, y1, x2, y2, color, w, dash) {
    var c = this.ctx; c.strokeStyle = color; c.lineWidth = w || 2; c.setLineDash(dash || []); c.beginPath(); c.moveTo(this.X(x1), this.Y(y1)); c.lineTo(this.X(x2), this.Y(y2)); c.stroke(); c.setLineDash([]);
  };
  Plot.prototype.arrow = function (x1, y1, x2, y2, color, w) {
    var c = this.ctx, a = this.X(x1), b = this.Y(y1), p = this.X(x2), q = this.Y(y2), ang = Math.atan2(q - b, p - a), L = 10;
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = w || 2.4;
    c.beginPath(); c.moveTo(a, b); c.lineTo(p, q); c.stroke();
    c.beginPath(); c.moveTo(p, q); c.lineTo(p - L * Math.cos(ang - .4), q - L * Math.sin(ang - .4)); c.lineTo(p - L * Math.cos(ang + .4), q - L * Math.sin(ang + .4)); c.closePath(); c.fill();
  };
  Plot.prototype.text = function (s, x, y, color, size, align) {
    var c = this.ctx; c.fillStyle = color; c.font = "600 " + (size || 12) + "px " + css("--font", "sans-serif"); c.textAlign = align || "left"; c.textBaseline = "alphabetic"; c.fillText(s, x, y);
  };

  /* ---------- Виджет қабығы ---------- */
  function shell(root, title, plot, ctrls, readId) {
    var head = ce("div", "mv-head"), tt = ce("div", "mv-title", title || "");
    var zoomBar = ce("div");
    zoomBar.className = "mv-zoom";
    head.append(tt);
    if (plot && !plot.opts.fixed) {
      zoomBar.append(
        button("+", function () { plot.zoom(1 / 1.3); }, "Үлкейту"), button("−", function () { plot.zoom(1.3); }, "Кішірейту"),
        button("←", function () { plot.pan(-50, 0); }, "Солға жылжыту"), button("→", function () { plot.pan(50, 0); }, "Оңға жылжыту"),
        button("↑", function () { plot.pan(0, -50); }, "Жоғары жылжыту"), button("↓", function () { plot.pan(0, 50); }, "Төмен жылжыту"),
        button("↺", function () { plot.reset(); }, "Бастапқы көрініс"));
      zoomBar.style.display = "flex"; zoomBar.style.gap = "6px"; zoomBar.style.flexWrap = "wrap";
      head.append(zoomBar);
    }
    root.textContent = "";
    root.setAttribute("role", "group"); root.setAttribute("aria-label", title || "Визуализация");
    var read = ce("div", "mv-read"); read.setAttribute("aria-live", "polite");
    root.append(head);
    if (plot) root.append(plot.wrap);
    var ctrl = ce("div", "mv-ctrl"); (ctrls || []).forEach(function (c) { ctrl.append(c.el || c); });
    root.append(ctrl, read);
    return { read: read, ctrl: ctrl };
  }
  function observe(plot) {
    if (window.ResizeObserver) new ResizeObserver(function () { plot.fit(); }).observe(plot.wrap);
    else window.addEventListener("resize", function () { plot.fit(); });
    plot.fit();
  }

  /* =====================================================================
   * graph
   * config: { fns: ["x^2", {f:"a*sin(x)", label:"...", color:1}], params:[{n:"a",min:-3,max:3,step:.1,v:1}], view:[x0,x1,y0,y1] }
   * ===================================================================== */
  REG.graph = function (root, cfg, title) {
    var params = (cfg.params || []).map(function (p) { return Object.assign({ min: -5, max: 5, step: 0.1, v: 1 }, p); });
    var vars = ["x"].concat(params.map(function (p) { return p.n; }));
    var fns = (cfg.fns || []).map(function (f, i) {
      if (typeof f === "string") f = { f: f };
      var cf = compile(f.f, vars);
      return { src: f.f, fn: cf, color: PAL[(f.color != null ? f.color : i) % PAL.length], dash: f.dash, on: true, label: f.label || ("f" + (i + 1) + "(x) = " + f.f) };
    });
    var plot = new Plot(root, { view: cfg.view || [-6, 6, -4, 4], equal: !!cfg.equal, aria: title + ": " + fns.map(function (f) { return f.src; }).join("; "), hover: function (x) {
      var env = envOf(); env.x = x;
      shellRef.read.innerHTML = "";
      var parts = fns.filter(function (f) { return f.on; }).map(function (f) { var y = f.fn(env); return "<b>" + esc2(f.src) + "</b>: x = " + fmt(x, 2) + ", y = " + (isFinite(y) ? fmt(y, 3) : "анықталмаған"); });
      shellRef.read.innerHTML = parts.join("<br>") || "";
    } });
    var esc2 = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
    var sl = params.map(function (p) { var s = slider(p.n + " =", { min: p.min, max: p.max, step: p.step, v: p.v, aria: "Параметр " + p.n }); s.inp.addEventListener("input", function () { plot.draw(); }); return s; });
    var envOf = function () { var e = {}; params.forEach(function (p, i) { e[p.n] = sl[i].get(); }); return e; };
    var legend = ce("ul", "mv-legend");
    fns.forEach(function (f, i) {
      var li = ce("li"), cb = ce("input"), sw = ce("span", "mv-sw"), lab = ce("span", null, f.label);
      cb.type = "checkbox"; cb.checked = true; cb.setAttribute("aria-label", "Көрсету: " + f.src); sw.style.background = f.color;
      cb.addEventListener("change", function () { f.on = cb.checked; plot.draw(); });
      li.append(cb, sw, lab); legend.append(li);
    });
    var shellRef = shell(root, title, plot, sl);
    root.insertBefore(legend, shellRef.read);
    shellRef.read.textContent = "Графикте тінтуірді жүргізіңіз: x пен y мәні көрінеді. Жылжыту: сүйреу; масштаб: батырмалар не + / − пернелері.";
    plot.draw = function () {
      plot.clear(); plot.grid();
      var env = envOf();
      fns.forEach(function (f) { if (f.on) plot.curve(function (x) { env.x = x; return f.fn(env); }, f.color, 2.6, f.dash); });
    };
    observe(plot);
  };

  /* =====================================================================
   * tangent: { f:"x^2/4", x0:1, view:[...] }
   * ===================================================================== */
  REG.tangent = function (root, cfg, title) {
    var f = compile(cfg.f, ["x"]), F = function (x) { return f({ x: x }); };
    var dF = function (x) { var h = 1e-5; return (F(x + h) - F(x - h)) / (2 * h); };
    var view = cfg.view || [-5, 5, -3, 7];
    var plot = new Plot(root, { view: view, aria: title + ": f(x) = " + cfg.f + " графигі, жанама сызық" });
    var sx = slider("x₀ =", { min: view[0] + 0.5, max: view[1] - 0.5, step: 0.05, v: cfg.x0 == null ? 1 : cfg.x0, aria: "Нүкте x0" });
    var sh = slider("h =", { min: 0.01, max: 3, step: 0.01, v: cfg.h == null ? 1.5 : cfg.h, aria: "Қиюшы қадамы h" });
    var showSec = true, bSec = button("Қиюшы: қосулы", function () { showSec = !showSec; bSec.textContent = "Қиюшы: " + (showSec ? "қосулы" : "өшірулі"); plot.draw(); });
    var anim = null, bAnim = button("h → 0 анимациясы", function () {
      if (anim) { clearInterval(anim); anim = null; return; }
      sh.set(3); showSec = true;
      anim = setInterval(function () { var v = sh.get() * 0.93; if (v < 0.011) { clearInterval(anim); anim = null; v = 0.01; } sh.set(v); plot.draw(); }, 60);
    });
    var sh2 = shell(root, title, plot, [sx, sh, bSec, bAnim]);
    plot.draw = function () {
      plot.clear(); plot.grid();
      var x0 = sx.get(), h = sh.get(), y0 = F(x0), m = dF(x0);
      plot.curve(F, PAL[0], 2.8);
      plot.line(plot.x0, y0 + m * (plot.x0 - x0), plot.x1, y0 + m * (plot.x1 - x0), PAL[1], 2.2);
      var msec = (F(x0 + h) - y0) / h;
      if (showSec) {
        plot.line(plot.x0, y0 + msec * (plot.x0 - x0), plot.x1, y0 + msec * (plot.x1 - x0), PAL[3], 1.8, [6, 4]);
        plot.dot(x0 + h, F(x0 + h), 5, PAL[3], css("--surface", "#fff"));
      }
      plot.dot(x0, y0, 6, PAL[1], css("--surface", "#fff"));
      sh2.read.innerHTML = "<b>f(x₀)</b> = " + fmt(y0, 3) + " &nbsp; <b>Жанама көлбеуі f′(x₀)</b> ≈ " + fmt(m, 4) +
        (showSec ? " &nbsp; <b>Қиюшы көлбеуі</b> = (f(x₀+h) − f(x₀))/h = " + fmt(msec, 4) + " &nbsp; <b>айырма</b> = " + fmt(Math.abs(msec - m), 4) : "") +
        "<br>Жанама теңдеуі: y = " + fmt(m, 3) + "·(x − " + fmt(x0, 2) + ") + " + fmt(y0, 3);
    };
    sx.inp.addEventListener("input", function () { plot.draw(); }); sh.inp.addEventListener("input", function () { plot.draw(); });
    observe(plot);
  };

  /* =====================================================================
   * riemann: { f:"x^2", a:0, b:2, n:8, method:"mid", view }
   * ===================================================================== */
  REG.riemann = function (root, cfg, title) {
    var f = compile(cfg.f, ["x"]), F = function (x) { return f({ x: x }); };
    var a = cfg.a == null ? 0 : cfg.a, b = cfg.b == null ? 1 : cfg.b;
    var pad = (b - a) * 0.35 || 1;
    var ys = []; for (var i = 0; i <= 80; i++) { var y = F(a + (b - a) * i / 80); if (isFinite(y)) ys.push(y); }
    var ymin = Math.min.apply(null, ys.concat([0])), ymax = Math.max.apply(null, ys.concat([0])), yp = (ymax - ymin) * 0.15 || 1;
    var plot = new Plot(root, { view: cfg.view || [a - pad, b + pad, ymin - yp, ymax + yp], aria: title + ": f(x) = " + cfg.f + ", [" + a + "; " + b + "] кесіндісіндегі Риман қосындысы" });
    var sn = slider("n =", { min: 1, max: 200, step: 1, v: cfg.n || 6, dp: 0, aria: "Бөліктер саны n" });
    var methods = [["left", "Сол жақ"], ["right", "Оң жақ"], ["mid", "Орта нүкте"], ["trap", "Трапеция"]];
    var sel = ce("select"); sel.setAttribute("aria-label", "Қосынды түрі");
    methods.forEach(function (m) { var o = ce("option", null, m[1]); o.value = m[0]; sel.append(o); }); sel.value = cfg.method || "left";
    var lab = ce("label", null, "Түрі: "); lab.append(sel);
    var exact = 0, N = 4000, hh = (b - a) / N;
    for (i = 0; i <= N; i++) exact += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * F(a + i * hh);
    exact *= hh / 3;
    var sh = shell(root, title, plot, [sn, lab]);
    plot.draw = function () {
      plot.clear(); plot.grid();
      var n = Math.round(sn.get()), dx = (b - a) / n, mt = sel.value, sum = 0, c = plot.ctx, k;
      for (k = 0; k < n; k++) {
        var xl = a + k * dx, xr = xl + dx, hgt, poly;
        if (mt === "left") hgt = F(xl); else if (mt === "right") hgt = F(xr); else if (mt === "mid") hgt = F(xl + dx / 2);
        if (mt === "trap") {
          var yl = F(xl), yr = F(xr); sum += (yl + yr) / 2 * dx;
          c.beginPath(); c.moveTo(plot.X(xl), plot.Y(0)); c.lineTo(plot.X(xl), plot.Y(yl)); c.lineTo(plot.X(xr), plot.Y(yr)); c.lineTo(plot.X(xr), plot.Y(0)); c.closePath();
          c.fillStyle = (yl + yr) >= 0 ? "rgba(37,99,235,.28)" : "rgba(220,38,38,.28)"; c.fill(); c.strokeStyle = PAL[0]; c.lineWidth = 1; c.stroke();
        } else {
          sum += hgt * dx;
          c.beginPath(); c.rect(plot.X(xl), Math.min(plot.Y(0), plot.Y(hgt)), plot.X(xr) - plot.X(xl), Math.abs(plot.Y(hgt) - plot.Y(0)));
          c.fillStyle = hgt >= 0 ? "rgba(37,99,235,.28)" : "rgba(220,38,38,.28)"; c.fill(); c.strokeStyle = PAL[0]; c.lineWidth = 1; c.stroke();
        }
      }
      plot.curve(F, PAL[1], 2.8);
      plot.line(a, plot.y0, a, plot.y1, css("--muted", "#666"), 1, [4, 4]); plot.line(b, plot.y0, b, plot.y1, css("--muted", "#666"), 1, [4, 4]);
      sh.read.innerHTML = "<b>n</b> = " + n + " &nbsp; <b>Δx</b> = " + fmt(dx, 4) + " &nbsp; <b>Қосынды Sₙ</b> = " + fmt(sum, 5) + " &nbsp; <b>Нақты интеграл ≈</b> " + fmt(exact, 5) + " &nbsp; <b>қателік</b> = " + fmt(Math.abs(sum - exact), 5) +
        "<br>Көк аудандар оң мәнді, қызыл аудандар теріс мәнді бөліктерді көрсетеді.";
    };
    sn.inp.addEventListener("input", function () { plot.draw(); }); sel.addEventListener("change", function () { plot.draw(); });
    observe(plot);
  };

  /* =====================================================================
   * vectors: { u:[3,1], v:[1,2] }
   * ===================================================================== */
  REG.vectors = function (root, cfg, title) {
    var u = (cfg.u || [3, 1]).slice(), v = (cfg.v || [1, 2]).slice();
    var plot = new Plot(root, { view: cfg.view || [-7, 7, -5, 5], equal: true, aria: title + ": екі вектор, олардың қосындысы мен скаляр көбейтіндісі" });
    var S = { ux: slider("u₁", { min: -6, max: 6, step: 0.5, v: u[0], aria: "u вектордың бірінші координатасы" }), uy: slider("u₂", { min: -6, max: 6, step: 0.5, v: u[1], aria: "u вектордың екінші координатасы" }),
      vx: slider("v₁", { min: -6, max: 6, step: 0.5, v: v[0], aria: "v вектордың бірінші координатасы" }), vy: slider("v₂", { min: -6, max: 6, step: 0.5, v: v[1], aria: "v вектордың екінші координатасы" }) };
    var opt = { sum: true, diff: false, proj: true };
    var tg = function (k, t) { var b = button(t, function () { opt[k] = !opt[k]; b.classList.toggle("on", opt[k]); plot.draw(); }); b.classList.toggle("on", opt[k]); return b; };
    var ctrls = [S.ux, S.uy, S.vx, S.vy, tg("sum", "u + v"), tg("diff", "u − v"), tg("proj", "Проекция")];
    var sh = shell(root, title, plot, ctrls);
    Object.keys(S).forEach(function (k) { S[k].inp.addEventListener("input", function () { plot.draw(); }); });
    plot.draw = function () {
      plot.clear(); plot.grid();
      var ux = S.ux.get(), uy = S.uy.get(), vx = S.vx.get(), vy = S.vy.get(), c = plot.ctx;
      var dot = ux * vx + uy * vy, nu = Math.hypot(ux, uy), nv = Math.hypot(vx, vy);
      if (opt.sum) { plot.line(ux, uy, ux + vx, uy + vy, css("--muted", "#777"), 1.4, [5, 4]); plot.line(vx, vy, ux + vx, uy + vy, css("--muted", "#777"), 1.4, [5, 4]); plot.arrow(0, 0, ux + vx, uy + vy, PAL[2], 2.6); }
      if (opt.diff) plot.arrow(vx, vy, ux, uy, PAL[3], 2.2);
      if (opt.proj && nv > 1e-9) { var k = dot / (nv * nv), px = k * vx, py = k * vy; plot.line(ux, uy, px, py, PAL[4], 1.4, [3, 3]); plot.arrow(0, 0, px, py, PAL[4], 2.4); }
      plot.arrow(0, 0, ux, uy, PAL[0], 3); plot.arrow(0, 0, vx, vy, PAL[1], 3);
      plot.text("u", plot.X(ux) + 6, plot.Y(uy) - 6, PAL[0], 14); plot.text("v", plot.X(vx) + 6, plot.Y(vy) - 6, PAL[1], 14);
      if (opt.sum) plot.text("u+v", plot.X(ux + vx) + 6, plot.Y(uy + vy) - 6, PAL[2], 13);
      var ang = nu > 1e-9 && nv > 1e-9 ? Math.acos(clamp(dot / (nu * nv), -1, 1)) * 180 / Math.PI : NaN;
      sh.read.innerHTML = "<b>|u|</b> = " + fmt(nu, 3) + " &nbsp; <b>|v|</b> = " + fmt(nv, 3) + " &nbsp; <b>u·v</b> = " + fmt(dot, 3) + " &nbsp; <b>бұрыш</b> = " + (isFinite(ang) ? fmt(ang, 1) + "°" : "анықталмаған") +
        "<br><b>u+v</b> = (" + fmt(ux + vx, 2) + "; " + fmt(uy + vy, 2) + ") &nbsp; <b>u−v</b> = (" + fmt(ux - vx, 2) + "; " + fmt(uy - vy, 2) + ")" + (Math.abs(dot) < 1e-9 ? "<br>Векторлар ортогональ (u·v = 0)." : "");
      void c;
    };
    // тінтуірмен сүйреу (тек тінтуір/қалам; сенсорда слайдер)
    var drag = null;
    plot.cv.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      var r = plot.cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      var near = function (x, y) { return Math.hypot(plot.X(x) - mx, plot.Y(y) - my) < 14; };
      if (near(S.ux.get(), S.uy.get())) drag = "u"; else if (near(S.vx.get(), S.vy.get())) drag = "v";
      if (drag) { e.stopImmediatePropagation(); plot.cv.setPointerCapture && plot.cv.setPointerCapture(e.pointerId); }
    }, true);
    plot.cv.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var r = plot.cv.getBoundingClientRect(), x = Math.round(plot.invX(e.clientX - r.left) * 2) / 2, y = Math.round(plot.invY(e.clientY - r.top) * 2) / 2;
      x = clamp(x, -6, 6); y = clamp(y, -6, 6);
      if (drag === "u") { S.ux.set(x); S.uy.set(y); } else { S.vx.set(x); S.vy.set(y); }
      plot.draw(); e.stopImmediatePropagation();
    }, true);
    var end = function () { drag = null; };
    plot.cv.addEventListener("pointerup", end, true); plot.cv.addEventListener("pointercancel", end, true);
    observe(plot);
  };

  /* =====================================================================
   * lintrans: { m:[[1,1],[0,1]] }
   * ===================================================================== */
  REG.lintrans = function (root, cfg, title) {
    var m0 = cfg.m || [[1, 0.5], [0, 1]];
    var plot = new Plot(root, { view: cfg.view || [-6, 6, -4.5, 4.5], equal: true, aria: title + ": матрица әсерінен жазықтық торының түрленуі" });
    var S = { a: slider("a", { min: -3, max: 3, step: 0.1, v: m0[0][0], aria: "Матрица элементі a (1-жол, 1-баған)" }), b: slider("b", { min: -3, max: 3, step: 0.1, v: m0[0][1], aria: "Матрица элементі b (1-жол, 2-баған)" }),
      c: slider("c", { min: -3, max: 3, step: 0.1, v: m0[1][0], aria: "Матрица элементі c (2-жол, 1-баған)" }), d: slider("d", { min: -3, max: 3, step: 0.1, v: m0[1][1], aria: "Матрица элементі d (2-жол, 2-баған)" }) };
    var set = function (a, b, c, d) { S.a.set(a); S.b.set(b); S.c.set(c); S.d.set(d); plot.draw(); };
    var th = Math.PI / 4;
    var presets = ce("div"); presets.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
    [["Бірлік", [1, 0, 0, 1]], ["Бұру 45°", [Math.cos(th), -Math.sin(th), Math.sin(th), Math.cos(th)]], ["Созу", [2, 0, 0, 1]], ["Ығысу", [1, 1, 0, 1]], ["Шағылу (y=x)", [0, 1, 1, 0]], ["Проекция (x осі)", [1, 0, 0, 0]]].forEach(function (p) {
      presets.append(button(p[0], function () { set.apply(null, p[1].map(function (v) { return Math.round(v * 100) / 100; })); }));
    });
    var showEig = true, bEig = button("Меншікті бағыттар", function () { showEig = !showEig; bEig.classList.toggle("on", showEig); plot.draw(); }); bEig.classList.add("on");
    var sh = shell(root, title, plot, [S.a, S.b, S.c, S.d, presets, bEig]);
    Object.keys(S).forEach(function (k) { S[k].inp.addEventListener("input", function () { plot.draw(); }); });
    plot.draw = function () {
      plot.clear();
      var a = S.a.get(), b = S.b.get(), c = S.c.get(), d = S.d.get(), ctx = plot.ctx, i;
      plot.grid({ noGrid: false, noLabels: false });
      var T = function (x, y) { return [a * x + b * y, c * x + d * y]; };
      var R = 8;
      ctx.lineWidth = 1.4;
      for (i = -R; i <= R; i++) {
        var p1 = T(i, -R), p2 = T(i, R), q1 = T(-R, i), q2 = T(R, i);
        ctx.strokeStyle = i === 0 ? "rgba(147,51,234,.9)" : "rgba(147,51,234,.4)";
        ctx.beginPath(); ctx.moveTo(plot.X(p1[0]), plot.Y(p1[1])); ctx.lineTo(plot.X(p2[0]), plot.Y(p2[1])); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(plot.X(q1[0]), plot.Y(q1[1])); ctx.lineTo(plot.X(q2[0]), plot.Y(q2[1])); ctx.stroke();
      }
      var s = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)];
      ctx.beginPath(); s.forEach(function (p, k) { if (k) ctx.lineTo(plot.X(p[0]), plot.Y(p[1])); else ctx.moveTo(plot.X(p[0]), plot.Y(p[1])); }); ctx.closePath();
      ctx.fillStyle = "rgba(245,158,11,.35)"; ctx.fill(); ctx.strokeStyle = "rgb(217,119,6)"; ctx.lineWidth = 2; ctx.stroke();
      var det = a * d - b * c, tr = a + d, disc = tr * tr - 4 * det;
      if (showEig && disc >= 0) {
        [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2].forEach(function (lam, k) {
          var vx, vy;
          if (Math.abs(b) > 1e-9) { vx = b; vy = lam - a; } else if (Math.abs(c) > 1e-9) { vx = lam - d; vy = c; } else { vx = k === 0 ? 1 : 0; vy = k === 0 ? 0 : 1; }
          var nn = Math.hypot(vx, vy); if (nn < 1e-9) return; vx /= nn; vy /= nn;
          plot.line(-12 * vx, -12 * vy, 12 * vx, 12 * vy, k ? "#16a34a" : "#dc2626", 1.6, [7, 5]);
        });
      }
      plot.arrow(0, 0, a, c, PAL[0], 3); plot.arrow(0, 0, b, d, PAL[1], 3);
      plot.text("e₁′", plot.X(a) + 6, plot.Y(c) - 6, PAL[0], 13); plot.text("e₂′", plot.X(b) + 6, plot.Y(d) - 6, PAL[1], 13);
      var eig = disc >= 0 ? "λ₁ = " + fmt((tr + Math.sqrt(disc)) / 2, 3) + ", λ₂ = " + fmt((tr - Math.sqrt(disc)) / 2, 3) : "нақты меншікті мәндер жоқ (айналу сипаты)";
      sh.read.innerHTML = "<b>Матрица</b> A = [[" + fmt(a, 2) + ", " + fmt(b, 2) + "], [" + fmt(c, 2) + ", " + fmt(d, 2) + "]] &nbsp; <b>det A</b> = " + fmt(det, 3) + " &nbsp; <b>tr A</b> = " + fmt(tr, 3) +
        "<br>Бірлік шаршының ауданы |det A| = " + fmt(Math.abs(det), 3) + (det < 0 ? " (бағыт өзгерді)" : "") + (Math.abs(det) < 1e-9 ? " — жазықтық түзуге не нүктеге сығылды" : "") + "<br>" + eig;
    };
    observe(plot);
  };

  /* =====================================================================
   * series: { term:"1/n^2", start:1, N:30, limit:"pi^2/6" }
   * ===================================================================== */
  REG.series = function (root, cfg, title) {
    var term = compile(cfg.term, ["n"]), start = cfg.start == null ? 1 : cfg.start, Nmax = cfg.Nmax || 60;
    var limit = null; try { if (cfg.limit) limit = M().evalNumber(cfg.limit); } catch (e) { limit = null; }
    var plot = new Plot(root, { view: [-1, Nmax + 1, -1, 3], aria: title + ": a(n) = " + cfg.term + " қатарының дербес қосындылары", aspect: 0.55 });
    var sN = slider("N =", { min: 1, max: Nmax, step: 1, v: cfg.N || 20, dp: 0, aria: "Мүшелер саны N" });
    var sh = shell(root, title, plot, [sN]);
    var sums = [], s = 0, n;
    for (n = start; n < start + Nmax; n++) { var t = term({ n: n }); s += t; sums.push(isFinite(s) ? s : NaN); }
    var fin = sums.filter(isFinite), lo = Math.min.apply(null, fin.concat(limit != null ? [limit] : [], [0])), hi = Math.max.apply(null, fin.concat(limit != null ? [limit] : [], [0])), padY = (hi - lo) * 0.12 || 1;
    plot.v0 = [-1, Nmax + 1, lo - padY, hi + padY]; plot.reset();
    plot.draw = function () {
      plot.clear(); plot.grid();
      var N = Math.round(sN.get()), k, c = plot.ctx;
      if (limit != null) { plot.line(plot.x0, limit, plot.x1, limit, PAL[1], 1.8, [7, 5]); plot.text("қосынды = " + fmt(limit, 4), plot.X(plot.x0 + (plot.x1 - plot.x0) * 0.02), plot.Y(limit) - 6, PAL[1], 12); }
      c.strokeStyle = PAL[0]; c.lineWidth = 1.6; c.beginPath();
      for (k = 0; k < N; k++) { var X = plot.X(k + 1), Y = plot.Y(sums[k]); if (k) c.lineTo(X, Y); else c.moveTo(X, Y); }
      c.stroke();
      for (k = 0; k < N; k++) plot.dot(k + 1, sums[k], k === N - 1 ? 5 : 3, k === N - 1 ? PAL[2] : PAL[0]);
      var SN = sums[N - 1], last = term({ n: start + N - 1 });
      sh.read.innerHTML = "<b>N</b> = " + N + " &nbsp; <b>Sₙ</b> = " + fmt(SN, 6) + " &nbsp; <b>соңғы мүше aₙ</b> = " + fmt(last, 6) + (limit != null ? " &nbsp; <b>Sₙ − қосынды</b> = " + fmt(SN - limit, 6) : "") +
        "<br>Нүктелер S₁, S₂, …, Sₙ дербес қосындыларын көрсетеді. Қатар жинақталса, нүктелер бір деңгейге таяйды.";
    };
    sN.inp.addEventListener("input", function () { plot.draw(); });
    observe(plot);
  };

  /* =====================================================================
   * taylor: { kind:"sin", deg:5 }  kind: sin cos exp ln1p geom atan
   * ===================================================================== */
  var TAYLOR = {
    sin: { f: Math.sin, label: "sin x", coef: function (k) { return k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / fact(k) : 0; }, view: [-8, 8, -4, 4] },
    cos: { f: Math.cos, label: "cos x", coef: function (k) { return k % 2 ? 0 : ((k / 2) % 2 ? -1 : 1) / fact(k); }, view: [-8, 8, -4, 4] },
    exp: { f: Math.exp, label: "e^x", coef: function (k) { return 1 / fact(k); }, view: [-4, 4, -2, 8] },
    ln1p: { f: function (x) { return Math.log(1 + x); }, label: "ln(1+x)", coef: function (k) { return k === 0 ? 0 : (k % 2 ? 1 : -1) / k; }, view: [-1.2, 2.2, -3, 2] },
    geom: { f: function (x) { return 1 / (1 - x); }, label: "1/(1−x)", coef: function () { return 1; }, view: [-1.8, 1.8, -3, 6] },
    atan: { f: Math.atan, label: "arctg x", coef: function (k) { return k % 2 ? (((k - 1) / 2) % 2 ? -1 : 1) / k : 0; }, view: [-3, 3, -2.5, 2.5] }
  };
  function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  REG.taylor = function (root, cfg, title) {
    var T = TAYLOR[cfg.kind || "sin"] || TAYLOR.sin;
    var plot = new Plot(root, { view: cfg.view || T.view, aria: title + ": " + T.label + " функциясы және Маклорен көпмүшелігі" });
    var sd = slider("дәреже n =", { min: 0, max: 15, step: 1, v: cfg.deg == null ? 3 : cfg.deg, dp: 0, aria: "Көпмүшелік дәрежесі n" });
    var sh = shell(root, title, plot, [sd]);
    var poly = function (n) { return function (x) { var s = 0, k; for (k = 0; k <= n; k++) s += T.coef(k) * Math.pow(x, k); return s; }; };
    plot.draw = function () {
      plot.clear(); plot.grid();
      var n = Math.round(sd.get());
      plot.curve(T.f, PAL[0], 3);
      plot.curve(poly(n), PAL[1], 2.4, [7, 4]);
      var x = 0.5, err = Math.abs(T.f(x) - poly(n)(x));
      sh.read.innerHTML = "<b>Көк:</b> " + T.label + " &nbsp; <b>Қызыл:</b> n = " + n + " дәрежелі Маклорен көпмүшелігі &nbsp; <b>x = 0,5 нүктесіндегі қателік</b> = " + fmt(err, 8) +
        "<br>Дәреже өскен сайын көпмүшелік функцияға жинақталу аймағында жақындайды; аймақтан тыс жерде алшақтайды.";
    };
    sd.inp.addEventListener("input", function () { plot.draw(); });
    observe(plot);
  };

  /* =====================================================================
   * dist: { dist:"normal" }  normal | binomial | poisson | exp | uniform
   * ===================================================================== */
  function lgamma(x) { // Lanczos
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; var a = c[0], t = x + g + 0.5, i;
    for (i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function randn() { var u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var DISTS = {
    normal: { name: "Қалыпты N(μ, σ²)", disc: false, ps: [["μ", -3, 3, 0.1, 0], ["σ", 0.3, 3, 0.1, 1]],
      pdf: function (x, p) { return Math.exp(-(x - p[0]) * (x - p[0]) / (2 * p[1] * p[1])) / (p[1] * Math.sqrt(2 * Math.PI)); },
      sample: function (p) { return p[0] + p[1] * randn(); }, mean: function (p) { return p[0]; }, vari: function (p) { return p[1] * p[1]; }, range: function (p) { return [p[0] - 4 * p[1], p[0] + 4 * p[1]]; } },
    binomial: { name: "Биномдық B(n, p)", disc: true, ps: [["n", 1, 60, 1, 20], ["p", 0.05, 0.95, 0.05, 0.4]],
      pdf: function (k, p) { var n = p[0], q = p[1]; if (k < 0 || k > n || k !== Math.floor(k)) return 0; return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(q) + (n - k) * Math.log(1 - q)); },
      sample: function (p) { var s = 0, i; for (i = 0; i < p[0]; i++) if (Math.random() < p[1]) s++; return s; }, mean: function (p) { return p[0] * p[1]; }, vari: function (p) { return p[0] * p[1] * (1 - p[1]); }, range: function (p) { return [-0.5, p[0] + 0.5]; } },
    poisson: { name: "Пуассон Pois(λ)", disc: true, ps: [["λ", 0.5, 20, 0.5, 4]],
      pdf: function (k, p) { if (k < 0 || k !== Math.floor(k)) return 0; return Math.exp(-p[0] + k * Math.log(p[0]) - lgamma(k + 1)); },
      sample: function (p) { var L = Math.exp(-p[0]), k = 0, pr = 1; do { k++; pr *= Math.random(); } while (pr > L); return k - 1; }, mean: function (p) { return p[0]; }, vari: function (p) { return p[0]; }, range: function (p) { return [-0.5, Math.ceil(p[0] + 5 * Math.sqrt(p[0]) + 3)]; } },
    exp: { name: "Көрсеткіштік Exp(λ)", disc: false, ps: [["λ", 0.2, 3, 0.1, 1]],
      pdf: function (x, p) { return x < 0 ? 0 : p[0] * Math.exp(-p[0] * x); }, sample: function (p) { return -Math.log(1 - Math.random()) / p[0]; }, mean: function (p) { return 1 / p[0]; }, vari: function (p) { return 1 / (p[0] * p[0]); }, range: function (p) { return [-0.2 / p[0], 6 / p[0]]; } },
    uniform: { name: "Бірқалыпты U(a, b)", disc: false, ps: [["a", -3, 2, 0.5, 0], ["b", -1, 5, 0.5, 3]],
      pdf: function (x, p) { return x >= p[0] && x <= p[1] && p[1] > p[0] ? 1 / (p[1] - p[0]) : 0; }, sample: function (p) { return p[0] + Math.random() * (p[1] - p[0]); }, mean: function (p) { return (p[0] + p[1]) / 2; }, vari: function (p) { return (p[1] - p[0]) * (p[1] - p[0]) / 12; }, range: function (p) { var w = Math.max(p[1] - p[0], 0.5); return [p[0] - 0.3 * w, p[1] + 0.3 * w]; } }
  };
  REG.dist = function (root, cfg, title) {
    var cur = DISTS[cfg.dist] ? cfg.dist : "normal";
    var plot = new Plot(root, { view: [-4, 4, -0.05, 0.6], fixed: true, aria: title + ": үлестірім тығыздығы және кездейсоқ таңдама гистограммасы", aspect: 0.55 });
    var sel = ce("select"); sel.setAttribute("aria-label", "Үлестірім түрі");
    Object.keys(DISTS).forEach(function (k) { var o = ce("option", null, DISTS[k].name); o.value = k; sel.append(o); }); sel.value = cur;
    var lab = ce("label", null, "Үлестірім: "); lab.append(sel);
    var psBox = ce("div"); psBox.style.cssText = "display:flex;flex-wrap:wrap;gap:6px 16px";
    var sN = slider("таңдама көлемі", { min: 10, max: 5000, step: 10, v: cfg.N || 500, dp: 0, aria: "Таңдама көлемі" });
    var data = [], sliders = [];
    var resample = function () { var D = DISTS[sel.value], p = sliders.map(function (s) { return s.get(); }), N = Math.round(sN.get()), i; data = []; for (i = 0; i < N; i++) data.push(D.sample(p)); plot.draw(); };
    var bNew = button("Таңдама алу", resample);
    var sh = shell(root, title, plot, [lab, psBox, sN, bNew]);
    var build = function () {
      var D = DISTS[sel.value]; psBox.textContent = ""; sliders = D.ps.map(function (q) { var s = slider(q[0] + " =", { min: q[1], max: q[2], step: q[3], v: q[4], aria: "Параметр " + q[0] }); s.inp.addEventListener("input", function () { resample(); }); psBox.append(s.el); return s; });
      resample();
    };
    sel.addEventListener("change", build); sN.inp.addEventListener("change", resample);
    plot.draw = function () {
      if (!sliders.length) return; // build() әлі шақырылмаған (өлшем бақылаушысы ертерек іске қосылуы мүмкін)
      var D = DISTS[sel.value], p = sliders.map(function (s) { return s.get(); });
      if (sel.value === "uniform" && p[1] <= p[0]) { sh.read.textContent = "b мәні a мәнінен үлкен болуы керек."; plot.clear(); return; }
      var r = D.range(p), N = data.length, nb = D.disc ? Math.round(r[1] - r[0]) : 28, k;
      var bins = new Array(nb).fill(0), bw = (r[1] - r[0]) / nb;
      data.forEach(function (x) { var b = Math.floor((x - r[0]) / bw); if (b >= 0 && b < nb) bins[b]++; });
      var maxd = 0, dens = bins.map(function (c) { return c / (N * bw); });
      dens.forEach(function (d) { maxd = Math.max(maxd, d); });
      var xs = D.disc ? 0 : 0, peak = 0;
      if (D.disc) { for (k = 0; k < nb; k++) peak = Math.max(peak, D.pdf(Math.round(r[0] + (k + 0.5) * bw), p)); } else { for (k = 0; k <= 120; k++) peak = Math.max(peak, D.pdf(r[0] + (r[1] - r[0]) * k / 120, p)); }
      var top = Math.max(maxd, peak) * 1.18 || 1;
      plot.x0 = r[0]; plot.x1 = r[1]; plot.y0 = -top * 0.06; plot.y1 = top;
      plot.clear(); plot.grid();
      var c = plot.ctx;
      for (k = 0; k < nb; k++) {
        var xl = r[0] + k * bw;
        c.fillStyle = "rgba(37,99,235,.35)"; c.fillRect(plot.X(xl) + 1, plot.Y(dens[k]), plot.X(xl + bw) - plot.X(xl) - 1, plot.Y(0) - plot.Y(dens[k]));
      }
      if (D.disc) { for (k = 0; k < nb; k++) { var kk = Math.round(r[0] + (k + 0.5) * bw); plot.dot(kk, D.pdf(kk, p), 4, PAL[1]); } }
      else plot.curve(function (x) { return D.pdf(x, p); }, PAL[1], 2.8);
      void xs;
      var sm = data.reduce(function (a, b) { return a + b; }, 0) / (N || 1), sv = data.reduce(function (a, b) { return a + (b - sm) * (b - sm); }, 0) / (N > 1 ? N - 1 : 1);
      sh.read.innerHTML = "<b>Теориялық:</b> E = " + fmt(D.mean(p), 4) + ", D = " + fmt(D.vari(p), 4) + " &nbsp; <b>Таңдама:</b> орта = " + fmt(sm, 4) + ", дисперсия = " + fmt(sv, 4) + " (N = " + N + ")" +
        "<br>Көк бағандар - таңдама гистограммасы (тығыздыққа нормаланған), қызыл сызық/нүктелер - теориялық " + (D.disc ? "ықтималдықтар" : "тығыздық") + ".";
    };
    observe(plot);
    build();
  };

  /* ---------- Іске қосу ---------- */
  function mount(root) {
    if (root.__mv) return;
    root.__mv = true;
    var type = root.getAttribute("data-viz"), title = root.getAttribute("data-title") || "";
    var cfg = {};
    try { cfg = JSON.parse(root.getAttribute("data-config") || "{}"); } catch (e) { root.append(ce("p", "mv-err", "Визуализация баптауы оқылмады (JSON қатесі).")); return; }
    if (!REG[type]) { root.append(ce("p", "mv-err", "Белгісіз визуализация түрі: " + type)); return; }
    try { REG[type](root, cfg, title); ALL.push(root); } catch (e) {
      root.textContent = "";
      root.append(ce("p", "mv-err", "Визуализацияны көрсету мүмкін болмады: " + (e && e.message ? e.message : e)));
    }
  }
  function initAll() {
    var nodes = document.querySelectorAll(".math-viz[data-viz]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }
  // тақырып ауысқанда қайта сызу
  try {
    new MutationObserver(function () { ALL.forEach(function (r) { var cv = r.querySelector("canvas"); if (cv) cv.dispatchEvent(new Event("mv:redraw")); }); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  } catch (e) { /* ескі браузер */ }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll); else initAll();
  window.CS50KZ_MATHVIZ = { mount: mount, init: initAll, types: Object.keys(REG) };
})();
