/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17: «Менің шаңырағым» - оқу прогресі қазақ үйіне айналады.
   Әр оқылған лекция, орындалған жаттығу мен сөздік жаттығуы шаңырақты өсіреді; күн қатарынан оқу шаңырақтың жарығын күшейтеді.
   Деректің бәрі осы құрылғының localStorage-інен оқылады, ешқайда жіберілмейді. Сурет (canvas) осы құрылғыда салынады.
   Басқа бет те қолдана алуы үшін window.AO17Yurt ашық: read(), stage(), draw(), shareText(). */
(function () {
  "use strict";
  var SITE = "https://mustafa7677.github.io/CS50MUSS/yurt.html";
  // Кезеңдер: [басталатын әрекет саны, атауы, сипаттамасы]
  var STAGES = [
    [0, "Орын таңдалды", "Жер белгіленді. Алғашқы әрекеттен кейін кереге қойыла бастайды."],
    [3, "Кереге тұрғызылды", "Үйдің қабырғасы өсіп жатыр: әр әрекет бір тор көз қосады."],
    [30, "Уықтар көтерілді", "Қабырға бітті, енді төбеге уықтар қойылады."],
    [70, "Шаңырақ тұтанды", "Төбенің тұтқасы орнында. Есік ашылды, оқ жарық шығады."],
    [140, "Киіз жабылды", "Үй киізбен жабылды. Енді оны оюлап әшекейлейсіз."],
    [280, "Ақ үй", "Толық Ақ үй: ою, киіз, жарқыраған шаңырақ."]
  ];
  var PAL = { prog: "#2b9fbd", eng: "#c4506a", math: "#d9a826", gold: "#bfa276", ivory: "#ece8df" };

  // ---------- деректі оқу (қате болса да бет құламайды) ----------
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function n(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : 0; }
  function size(v) { return Array.isArray(v) ? v.length : Object.keys(obj(v)).length; }
  function dayKey(d) { d = d || new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

  function readStats() {
    var prog = obj(J("cs50kz:progress", {}));
    var read = obj(prog.read), quiz = obj(prog.quiz);
    var u = { prog: 0, eng: 0, math: 0 };
    function kind(id) { return /^en:/.test(id) ? "eng" : /^math:/.test(id) ? "math" : "prog"; }
    Object.keys(read).forEach(function (id) { if (read[id]) u[kind(id)]++; });
    Object.keys(quiz).forEach(function (id) { if (quiz[id]) u[kind(id)]++; });
    // орындалған тапсырма тізімдері: check:<бет жолы>:<id> = [true, ...]
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("check:") !== 0) continue;
        var a = J(k, []);
        if (Array.isArray(a) && a.length && a.every(Boolean)) u[/\/en\//.test(k) ? "eng" : /\/math\//.test(k) ? "math" : "prog"]++;
      }
    } catch (e) { /* */ }
    // CS Universe: жаттығулар
    var lessons = obj(obj(J("cs50kz:academy", {})).lessons);
    Object.keys(lessons).forEach(function (id) { u.prog += size(obj(lessons[id]).ex); });
    // ағылшын: жаттығулар мен сөздік (10 жауап = 1 әрекет)
    u.eng += size(J("cs50kz:en:ex", {}));
    var vs = obj(J("cs50kz:en:vstats", {})), vDays = obj(vs.days), vN = 0;
    Object.keys(vDays).forEach(function (d) { vN += n(obj(vDays[d]).n); });
    u.eng += Math.floor(vN / 10);
    // математика: жаттығулар мен практика
    u.math += size(J("cs50kz:math:ex", {})) + n(obj(J("cs50kz:math:practice", {})).n);

    // серия: бүгін не кеше басталған үзіліссіз күндер (күн белсенді болса - кез келген академия)
    var days = obj(J("cs50kz:days", {})), act = {};
    Object.keys(days).forEach(function (d) { if (n(days[d])) act[d] = 1; });
    Object.keys(vDays).forEach(function (d) { if (n(obj(vDays[d]).n)) act[d] = 1; });
    var d0 = new Date(), streak = 0, best = 0, run = 0;
    if (!act[dayKey(d0)]) d0.setDate(d0.getDate() - 1);
    while (act[dayKey(d0)]) { streak++; d0.setDate(d0.getDate() - 1); }
    Object.keys(act).sort().forEach(function (d, i, all) {
      var prev = i ? new Date(all[i - 1] + "T12:00:00") : null, cur = new Date(d + "T12:00:00");
      run = prev && Math.round((cur - prev) / 86400000) === 1 ? run + 1 : 1; if (run > best) best = run;
    });
    // ойындар: ою (әшекей) деңгейі
    var plays = 0, g = obj(J("cs50kz:games", {}));
    Object.keys(g).forEach(function (id) { plays += n(obj(g[id]).plays); });

    var total = u.prog + u.eng + u.math;
    return { total: total, prog: u.prog, eng: u.eng, math: u.math, streak: streak, best: Math.max(best, streak), plays: plays, activeDays: Object.keys(act).length };
  }

  function stageOf(total) {
    var i = 0;
    for (var k = 0; k < STAGES.length; k++) if (total >= STAGES[k][0]) i = k;
    var next = STAGES[i + 1] || null;
    return { i: i, name: STAGES[i][1], text: STAGES[i][2], next: next ? next[0] : null, nextName: next ? next[1] : null, left: next ? next[0] - total : 0,
      pct: next ? Math.round(100 * (total - STAGES[i][0]) / (next[0] - STAGES[i][0])) : 100 };
  }

  // ---------- сурет ----------
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, k) { return a + (b - a) * k; }

  // Академия бөліктері: кереге панельдерінің түсі (бағдарламалау - көк, ағылшын - қызғылт, математика - алтын)
  function panelColors(st, count) {
    var parts = [["prog", st.prog], ["eng", st.eng], ["math", st.math]].filter(function (p) { return p[1] > 0; });
    if (!parts.length) return [];
    var sum = parts.reduce(function (s, p) { return s + p[1]; }, 0), out = [];
    parts.forEach(function (p) { p.q = p[1] / sum * count; p.c = Math.floor(p.q); });
    var used = parts.reduce(function (s, p) { return s + p.c; }, 0);
    parts.slice().sort(function (a, b) { return (b.q - b.c) - (a.q - a.c); }).forEach(function (p) { if (used < count) { p.c++; used++; } });
    parts.forEach(function (p) { for (var i = 0; i < p.c; i++) out.push(PAL[p[0]]); });
    return out;
  }

  /* st: readStats() нәтижесі; o: { t: уақыт (сек), card: true - мәтінмен бөлісу картасы, time: false } */
  function draw(cv, st, o) {
    o = o || {};
    var W = cv.width, H = cv.height, ctx = cv.getContext("2d"), t = o.t || 0, S = W / 1080;
    var sg = stageOf(st.total), g = clamp(st.streak / 30, 0, 1), lit = st.streak > 0;
    ctx.save(); ctx.scale(S, S); var w = 1080, h = 1350;
    ctx.clearRect(0, 0, w, h);

    // аспан: түн; серия жарықты аспанға да шығарады
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#06070a"); sky.addColorStop(.55, lit ? mix2("#14100c", "#2a1d10", g) : "#120e0a"); sky.addColorStop(1, "#1d1610");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    var r = rng(17), i;
    for (i = 0; i < 130; i++) {
      var sx = r() * w, sy = r() * h * .62, sr = .5 + r() * 1.5, ph = r() * 6.28, tw = o.time === false ? .8 : .55 + .45 * Math.sin(t * (.8 + r()) + ph);
      ctx.fillStyle = "rgba(255,240,215," + (.25 + .6 * tw * (1 - sy / (h * .7))).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.2832); ctx.fill();
    }
    // ай
    ctx.fillStyle = "rgba(245,236,214,.9)"; ctx.beginPath(); ctx.arc(w * .82, h * .13, 34, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "#07080b"; ctx.beginPath(); ctx.arc(w * .82 + 14, h * .13 - 6, 31, 0, 6.2832); ctx.fill();

    var cx = w / 2, base = h * .765, Ww = 560, Hw = 170, ty = base - Hw, ay = ty - 205, rx = 66, ry = 22;
    // дала: жер мен көлеңке
    var gr = ctx.createRadialGradient(cx, base + 30, 40, cx, base + 30, 640);
    gr.addColorStop(0, lit ? "rgba(120,86,40," + (.35 + .4 * g).toFixed(2) + ")" : "rgba(60,44,26,.4)"); gr.addColorStop(1, "rgba(10,8,6,0)");
    ctx.fillStyle = gr; ctx.fillRect(0, base - 120, w, h - base + 120);
    ctx.fillStyle = "#0c0906"; ctx.fillRect(0, base + 8, w, h - base);
    r = rng(5); ctx.strokeStyle = "rgba(191,162,118,.22)"; ctx.lineWidth = 2;
    for (i = 0; i < 70; i++) { var gx = r() * w, gy = base + 12 + r() * 90, gh = 8 + r() * 14, sw = o.time === false ? 0 : Math.sin(t * 1.1 + gx) * 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + sw, gy - gh / 2, gx + sw * 1.5 + 3, gy - gh); ctx.stroke(); }
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(cx, base + 10, Ww / 2 + 50, 22, 0, 0, 6.2832); ctx.fill();

    // шаңырақтан түсетін жарық (серия): бөлменің ішінен аспанға шоқ, айналаға жылы нұр
    var K = 1.22, rcx = cx, rcy = ay, rcyA = base + (ay - base) * K;
    if (sg.i >= 3 && lit) {
      var pulse = o.time === false ? 1 : .94 + .06 * Math.sin(t * 1.6);
      var gl = ctx.createRadialGradient(rcx, rcyA, 10, rcx, rcyA, mix(170, 700, g) * pulse);
      gl.addColorStop(0, "rgba(255,226,170," + (.55 + .3 * g).toFixed(2) + ")"); gl.addColorStop(.4, "rgba(240,190,120," + (.16 + .14 * g).toFixed(2) + ")"); gl.addColorStop(1, "rgba(240,190,120,0)");
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
      var beam = ctx.createLinearGradient(0, rcyA, 0, 0); beam.addColorStop(0, "rgba(255,232,190," + (.28 + .3 * g).toFixed(2) + ")"); beam.addColorStop(1, "rgba(255,232,190,0)");
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(rcx - rx * .6 * K, rcyA); ctx.lineTo(rcx + rx * .6 * K, rcyA); ctx.lineTo(rcx + rx * mix(1.2, 3.2, g) * K, 0); ctx.lineTo(rcx - rx * mix(1.2, 3.2, g) * K, 0); ctx.closePath(); ctx.fill();
    }

    ctx.save(); ctx.translate(cx, base); ctx.scale(K, K); ctx.translate(-cx, -base);   // үй кадрды толтырады
    // кереге: 6 панель; түсі - қай академияда өскені
    var built = clamp((st.total - 0) / 30, 0, 1) * 6, panels = Math.ceil(built - 1e-9), colors = panelColors(st, Math.max(1, panels)), pw = Ww / 6;
    ctx.fillStyle = "rgba(22,17,12,.5)"; ctx.fillRect(cx - Ww / 2, ty, Ww, Hw); if (panels < 6) { ctx.save(); ctx.setLineDash([10, 9]); ctx.strokeStyle = "rgba(191,162,118,.4)"; ctx.lineWidth = 2; ctx.strokeRect(cx - Ww / 2, ty, Ww, Hw); ctx.restore(); }
    for (i = 0; i < panels; i++) {
      var part = clamp(built - i, 0, 1), px = cx - Ww / 2 + i * pw, ph2 = Hw * part, py = base - ph2;
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph2); ctx.clip();
      ctx.strokeStyle = colors[i] || PAL.gold; ctx.lineWidth = 3.4; ctx.globalAlpha = .95;
      for (var d = -Hw; d < pw + Hw; d += 34) { ctx.beginPath(); ctx.moveTo(px + d, base); ctx.lineTo(px + d + Hw, base - Hw); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px + d + Hw, base); ctx.lineTo(px + d, base - Hw); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph2);
    }
    // жер деңгейіндегі іргетас
    ctx.fillStyle = "#2a2118"; ctx.fillRect(cx - Ww / 2 - 8, base - 3, Ww + 16, 11);

    // төбе: уықтар
    var uyks = sg.i >= 2 ? clamp(Math.floor((st.total - 30) / 2.5), 0, 36) : 0, felt = sg.i >= 4;
    function roofPath() { ctx.beginPath(); ctx.moveTo(cx - Ww / 2 - 18, ty); ctx.quadraticCurveTo(cx - Ww / 2 + 18, ty - 150, cx - rx, ay + 6); ctx.lineTo(cx + rx, ay + 6); ctx.quadraticCurveTo(cx + Ww / 2 - 18, ty - 150, cx + Ww / 2 + 18, ty); ctx.closePath(); }
    if (felt) {
      roofPath(); var fg = ctx.createLinearGradient(cx - Ww / 2, 0, cx + Ww / 2, 0);
      fg.addColorStop(0, "#b9b09c"); fg.addColorStop(.35, "#efe9da"); fg.addColorStop(.7, "#e3dccb"); fg.addColorStop(1, "#a79e8a"); ctx.fillStyle = fg; ctx.fill();
      ctx.save(); roofPath(); ctx.clip(); ctx.strokeStyle = "rgba(60,48,32,.35)"; ctx.lineWidth = 3;      // баскүр жолақтары
      for (i = 1; i < 5; i++) { var by = mix(ty, ay, i / 5); ctx.beginPath(); ctx.moveTo(cx - Ww, by); ctx.quadraticCurveTo(cx, by + 24, cx + Ww, by); ctx.stroke(); }
      ctx.restore();
      if (lit) { ctx.save(); roofPath(); ctx.clip(); var warm = ctx.createRadialGradient(rcx, rcy, 10, rcx, rcy, 330); warm.addColorStop(0, "rgba(255,214,150," + (.5 * g + .12).toFixed(2) + ")"); warm.addColorStop(1, "rgba(255,214,150,0)"); ctx.fillStyle = warm; ctx.fillRect(0, 0, w, h); ctx.restore(); }
    } else if (uyks) {
      ctx.fillStyle = "rgba(14,10,7,.55)"; roofPath(); ctx.fill();
    }
    if (uyks) {
      ctx.lineWidth = 3; ctx.lineCap = "round";
      for (i = 0; i < uyks; i++) {
        var u = (i + .5) / uyks, x0 = cx - Ww / 2 - 18 + u * (Ww + 36), x1 = cx - rx + u * rx * 2, mx = mix(x0, x1, .5) + (u - .5) * 52, my = mix(ty, ay, .5) - 22;
        ctx.strokeStyle = felt ? "rgba(90,70,40,.18)" : "rgba(191,162,118," + (.5 + .35 * (i % 2)).toFixed(2) + ")";
        ctx.beginPath(); ctx.moveTo(x0, ty); ctx.quadraticCurveTo(mx, my, x1, ay + 6); ctx.stroke();
      }
    }

    // ою: ойындар санына қарай қабырға үстіндегі қошқар мүйіз өрнегі
    var orn = clamp(Math.floor(st.plays / 3), 0, 6);
    if (orn) {
      var cells = 4 + orn * 2, cwid = Ww / cells; ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2.6; ctx.fillStyle = "#16110c";
      ctx.fillRect(cx - Ww / 2, ty - 2, Ww, 40);
      for (i = 0; i < cells; i++) {
        var ox = cx - Ww / 2 + cwid * (i + .5), oy = ty + 18, os = Math.min(13, cwid * .4);
        ctx.beginPath(); ctx.moveTo(ox, oy + os); ctx.bezierCurveTo(ox - os * 1.9, oy + os * .5, ox - os * 1.6, oy - os * 1.4, ox - os * .3, oy - os * .5);
        ctx.moveTo(ox, oy + os); ctx.bezierCurveTo(ox + os * 1.9, oy + os * .5, ox + os * 1.6, oy - os * 1.4, ox + os * .3, oy - os * .5); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(191,162,118,.55)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - Ww / 2, ty - 2); ctx.lineTo(cx + Ww / 2, ty - 2); ctx.moveTo(cx - Ww / 2, ty + 38); ctx.lineTo(cx + Ww / 2, ty + 38); ctx.stroke();
    }

    // есік: шаңырақ тұтанғанда ашылады
    if (sg.i >= 3) {
      var dw = 104, dh = 128, dx = cx - dw / 2, dy = base - dh;
      ctx.fillStyle = lit ? "#2a1b0c" : "#0a0705"; ctx.beginPath(); ctx.moveTo(dx, base); ctx.lineTo(dx, dy + 30); ctx.quadraticCurveTo(dx, dy, cx, dy); ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + 30); ctx.lineTo(dx + dw, base); ctx.closePath(); ctx.fill();
      if (lit) { var dg = ctx.createRadialGradient(cx, base, 4, cx, base - 30, 90); dg.addColorStop(0, "rgba(255,200,120,.75)"); dg.addColorStop(1, "rgba(255,200,120,0)"); ctx.fillStyle = dg; ctx.fillRect(dx, dy, dw, dh); }
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(dx - 5, base); ctx.lineTo(dx - 5, dy + 28); ctx.quadraticCurveTo(dx - 5, dy - 5, cx, dy - 5); ctx.quadraticCurveTo(dx + dw + 5, dy - 5, dx + dw + 5, dy + 28); ctx.lineTo(dx + dw + 5, base); ctx.stroke();
    }

    // шаңырақ: сақина мен айқас; серия болса - алтын жарқырайды
    if (sg.i >= 2) {
      var lim = sg.i >= 3 ? 1 : .55;
      ctx.strokeStyle = lit ? "#e8cf98" : "#7b6945"; ctx.lineWidth = sg.i >= 3 ? 8 : 5;
      ctx.beginPath(); ctx.ellipse(rcx, rcy, rx * lim, ry * lim, 0, 0, 6.2832); ctx.stroke();
      if (sg.i >= 3) {
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rcx - rx, rcy); ctx.lineTo(rcx + rx, rcy); ctx.moveTo(rcx, rcy - ry); ctx.lineTo(rcx, rcy + ry); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = lit ? "rgba(255,240,210,.8)" : "rgba(123,105,69,.6)"; ctx.beginPath(); ctx.ellipse(rcx, rcy, rx * .62, ry * .62, 0, 0, 6.2832); ctx.stroke();
      }
    } else {
      ctx.fillStyle = "rgba(191,162,118,.55)"; ctx.beginPath(); ctx.arc(cx, ty - 120, 5, 0, 6.2832); ctx.fill();
    }
    // Ақ үй: туы мен жылтыраған қақпа
    if (sg.i >= 5) {
      ctx.strokeStyle = "#e8cf98"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rcx, rcy - ry); ctx.lineTo(rcx, rcy - ry - 74); ctx.stroke();
      ctx.fillStyle = "#00afca"; ctx.beginPath(); ctx.moveTo(rcx, rcy - ry - 74); ctx.lineTo(rcx + 64, rcy - ry - 58 + (o.time === false ? 0 : Math.sin(t * 2.2) * 3)); ctx.lineTo(rcx, rcy - ry - 42); ctx.closePath(); ctx.fill();
    }

    ctx.restore();
    // бөлісу картасы: мәтін төменгі жағында
    if (o.card) {
      var fade = ctx.createLinearGradient(0, h * .8, 0, h); fade.addColorStop(0, "rgba(8,6,4,0)"); fade.addColorStop(.35, "rgba(8,6,4,.88)"); fade.addColorStop(1, "rgba(8,6,4,.96)");
      ctx.fillStyle = fade; ctx.fillRect(0, h * .8, w, h * .2);
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
      ctx.fillStyle = "#ece8df"; ctx.font = 'italic 500 70px "Bodoni Moda","PT Serif",Georgia,serif'; ctx.fillText(sg.name, 70, h - 150);
      ctx.fillStyle = "rgba(236,232,223,.78)"; ctx.font = '500 30px Inter,system-ui,sans-serif';
      ctx.fillText(st.total + " әрекет  ·  " + st.streak + " күн жарық  ·  " + st.activeDays + " белсенді күн", 70, h - 98);
      ctx.fillStyle = PAL.gold; ctx.font = '600 28px Inter,system-ui,sans-serif'; ctx.fillText("AO17", 70, h - 46);
      ctx.textAlign = "right"; ctx.fillStyle = "rgba(236,232,223,.6)"; ctx.font = '500 24px Inter,system-ui,sans-serif'; ctx.fillText("Сенің шаңырағың қандай? mustafa7677.github.io/CS50MUSS", w - 70, h - 46);
    }
    ctx.restore();
  }
  function mix2(a, b, k) { var p = function (s) { return [1, 3, 5].map(function (i) { return parseInt(s.substr(i, 2), 16); }); }, x = p(a), y = p(b); return "rgb(" + x.map(function (v, i) { return Math.round(mix(v, y[i], k)); }).join(",") + ")"; }

  function shareText(st) {
    var sg = stageOf(st.total);
    return "Менің шаңырағым: «" + sg.name + "», " + st.total + " әрекет, " + st.streak + " күн жарық 🔥 Сенікі қандай? " + SITE;
  }

  window.AO17Yurt = { read: readStats, stage: stageOf, draw: draw, shareText: shareText, STAGES: STAGES, SITE: SITE };

  // ---------- бет ----------
  function boot() {
    var cv = document.getElementById("yurt-cv"); if (!cv) return;
    var $ = function (id) { return document.getElementById(id); };
    // көрсетілім: #demo=120&streak=9 - нақты прогресс емес, бөлісу өшіріледі
    var m = /[#&]demo=(\d+)/.exec(location.hash), ms = /[#&]streak=(\d+)/.exec(location.hash), demo = !!m;
    var st = demo ? { total: +m[1], prog: Math.ceil(+m[1] * .5), eng: Math.floor(+m[1] * .3), math: Math.floor(+m[1] * .2), streak: ms ? +ms[1] : 0, best: ms ? +ms[1] : 0, plays: Math.floor(+m[1] / 8), activeDays: Math.floor(+m[1] / 4) } : readStats();
    var sg = stageOf(st.total);
    $("yurt-stage").textContent = sg.name; $("yurt-stage-t").textContent = sg.text;
    $("yurt-total").textContent = st.total; $("yurt-streak").textContent = st.streak; $("yurt-best").textContent = st.best; $("yurt-days").textContent = st.activeDays;
    $("yurt-next").textContent = sg.next ? "Келесі кезеңге («" + sg.nextName + "») " + sg.left + " әрекет қалды" : "Ең жоғарғы кезеңге жеттіңіз. Енді жарықты сөндірмеңіз: күн сайын бір әрекет.";
    var bar = $("yurt-bar"); bar.style.width = sg.pct + "%"; bar.parentNode.setAttribute("aria-valuenow", sg.pct);
    $("yurt-light").textContent = st.streak > 0 ? st.streak + " күн қатарынан: шаңырақ жарқырап тұр" : "Шаңырақ тыныш. Бүгін бір әрекет жасасаңыз, от тұтанады";
    cv.setAttribute("aria-label", "Қазақ үйі: «" + sg.name + "», " + st.total + " әрекет, " + st.streak + " күн жарық");
    [["prog", st.prog], ["eng", st.eng], ["math", st.math]].forEach(function (p) { var e = $("yurt-" + p[0]); if (e) e.textContent = p[1]; });
    var dn = $("yurt-demo"); if (dn) dn.hidden = !demo;
    document.querySelectorAll("#yurt-ladder li").forEach(function (li, i) { li.classList.toggle("is-on", i <= sg.i); li.classList.toggle("is-now", i === sg.i); });

    // экранға: DPR-ге сай, қозғалыс азайтылса - бір кадр
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    var raf = 0, t0 = performance.now(), vis = true;
    function fit() { var k = Math.min(window.devicePixelRatio || 1, 2), cw = cv.clientWidth || 540; cv.width = Math.round(cw * k); cv.height = Math.round(cw * k * 1.25); }
    function frame(now) { raf = 0; draw(cv, st, { t: (now - t0) / 1000, time: !still }); if (!still && vis) raf = requestAnimationFrame(frame); }
    fit(); frame(performance.now());
    addEventListener("resize", function () { fit(); if (!raf) frame(performance.now()); });
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf && !still) raf = requestAnimationFrame(frame); }).observe(cv);

    // бөлісу: сурет (Web Share) - болмаса жүктеу; WhatsApp пен Telegram - мәтін мен сілтеме
    var text = shareText(st);
    function cardBlob(cb) {
      var c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
      var go = function () { draw(c, st, { card: true, time: false }); c.toBlob(cb, "image/png"); };
      if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('italic 500 70px "Bodoni Moda"'), new Promise(function (r) { setTimeout(r, 800); })]).then(go, go); else go();
    }
    var wa = $("yurt-wa"), tg = $("yurt-tg"); wa.href = "https://wa.me/?text=" + encodeURIComponent(text); tg.href = "https://t.me/share/url?url=" + encodeURIComponent(SITE) + "&text=" + encodeURIComponent(text.replace(" " + SITE, ""));
    var sh = $("yurt-share"), dl = $("yurt-dl"), msg = $("yurt-msg");
    if (demo) { [sh, dl, wa, tg].forEach(function (b) { b.setAttribute("aria-disabled", "true"); b.tabIndex = -1; b.style.pointerEvents = "none"; b.style.opacity = ".45"; }); return; }
    function save(blob) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ao17-shanyrak.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); }
    dl.addEventListener("click", function () { cardBlob(function (b) { if (b) { save(b); msg.textContent = "Сурет жүктелді. Оны Instagram не WhatsApp-қа қоса аласыз."; } }); });
    sh.addEventListener("click", function () {
      cardBlob(function (b) {
        if (!b) return;
        var f = new File([b], "ao17-shanyrak.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], text: text }).catch(function () { /* пайдаланушы жапты */ });
        else { save(b); msg.textContent = "Бұл браузер суретпен бөлісуді қолдамайды: сурет жүктелді, оны өзіңіз жіберіңіз."; }
      });
    });
    if (!(navigator.canShare && window.File)) sh.textContent = "Суретті жүктеу";
    if (!(navigator.canShare && window.File)) dl.hidden = true;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
