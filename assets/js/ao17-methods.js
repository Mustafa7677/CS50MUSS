/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Қалай оқыған дұрыс» (tools/academy/ao17methods.py -> academy/methods.html): «Шын ба, аңыз ба?», ми төккіш (еске түсіру),
   ұмыту қисығы (аралық қайталау), жаргон детекторы (Фейнман әдісі), ұқсастық карточкалары, фокус таймері.
   Сақтау (тек осы браузер): «ao17cs:myths», «ao17cs:recall» - ми төккіш нәтижелері, «ao17cs:explain» - түсіндірмелер,
   «ao17cs:focus» - фокус сессиялары ({total, days: {күн: саны}}). */
(function () {
  "use strict";
  var root = document.querySelector("[data-methods]"), box = document.getElementById("mt-data");
  if (!root || !box) return;
  var D;
  try { D = JSON.parse(box.textContent); } catch (e) { return; }
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(sel, el) { return (el || root).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function K() { return window.CS50KZ || {}; }

  // ------------------------------------------------------------------ Шын ба, аңыз ба?
  (function () {
    var cards = $$(".my-c"), saved = obj(J("ao17cs:myths", {})), out = $("[data-my-score]");
    function show(c, ans, keep) {
      var truth = c.getAttribute("data-truth") === "1", ok = (ans === "1") === truth;
      c.classList.add("is-open", ok ? "ok" : "bad");
      $$(".my-b", c).forEach(function (b) { b.disabled = true; b.setAttribute("aria-pressed", String(b.getAttribute("data-ans") === ans)); });
      var x = $(".my-x", c);
      x.hidden = false;
      var v = document.createElement("p");
      v.className = "my-v";
      v.textContent = (ok ? "Дұрыс таптың: " : "Шындығында: ") + (truth ? "шын." : "аңыз.");
      x.insertBefore(v, x.firstChild);
      if (!keep) { saved[c.getAttribute("data-my")] = ans; S("ao17cs:myths", saved); c.classList.add("just"); }
      score();
    }
    function score() {
      var done = cards.filter(function (c) { return c.classList.contains("is-open"); });
      var ok = done.filter(function (c) { return c.classList.contains("ok"); }).length;
      out.textContent = done.length === cards.length ? "Нәтижең: " + ok + " / " + cards.length + ". " + (ok === cards.length ? "Ғалымдармен бір пікірдесің!" : "Енді төмендегі тактикалар неге жұмыс істейтінін көр.") : "";
    }
    cards.forEach(function (c) {
      $$(".my-b", c).forEach(function (b) { b.setAttribute("aria-pressed", "false"); b.addEventListener("click", function () { show(c, b.getAttribute("data-ans")); }); });
      var a = saved[c.getAttribute("data-my")];
      if (a === "1" || a === "0") show(c, a, true);
    });
  })();

  // ------------------------------------------------------------------ Ми төккіш: 3 минут жаз, сосын апта сабақтарымен салыстыр
  (function () {
    var w = $("[data-mt-recall]");
    if (!w) return;
    var sel = $("[data-rc-week]", w), ta = $("[data-rc-text]", w), clock = $("[data-rc-clock]", w), out = $("[data-rc-out]", w), go = $("[data-rc-start]", w);
    var end = 0, t = null;
    function tick() {
      var left = (end - Date.now()) / 1000;
      clock.textContent = mmss(left);
      if (left <= 0) { clearInterval(t); t = null; clock.textContent = "0:00"; check(); }
    }
    go.addEventListener("click", function () {
      out.innerHTML = ""; ta.value = ""; ta.focus();
      end = Date.now() + 180000;
      if (t) clearInterval(t);
      t = setInterval(tick, 500); tick();
    });
    // жазылған мәтінде сабақ атауының маңызды сөзі (5+ әріп, алғашқы 5 әрпі) кездессе - автоматты белгі (оқушы түзете алады)
    function stems(s) { return (s.toLowerCase().match(/[a-zа-яәіңғүұқөһё]{5,}/g) || []).map(function (x) { return x.slice(0, 5); }); }
    function check() {
      if (t) { clearInterval(t); t = null; }
      var wk = D.weeks[Number(sel.value) - 1], words = stems(ta.value), have = {};
      words.forEach(function (x) { have[x] = 1; });
      out.innerHTML = '<p class="mt-q">Мына сабақтардың қайсысы туралы жаздың? Белгіле:</p><ul class="rc-list">' + wk.lessons.map(function (l, i) {
        var hit = stems(l[0]).some(function (x) { return have[x]; });
        return '<li><label><input type="checkbox" data-rc-i="' + i + '"' + (hit ? " checked" : "") + "> " + esc(l[0]) + '</label> <a href="' + esc(l[1]) + '">сабақ</a></li>';
      }).join("") + '</ul><p class="rc-res" data-rc-res></p>';
      function upd() {
        var n = $$("[data-rc-i]", out).filter(function (c) { return c.checked; }).length, all = wk.lessons.length;
        $("[data-rc-res]", out).textContent = "Есіңде қалғаны: " + n + " / " + all + ". " + (n === all ? "Тамаша! Апта толық бекіген." : "Белгіленбегендерге қайта оралып, ертең тағы еске түсіріп көр.");
        var h = obj(J("ao17cs:recall", {}));
        h["w" + wk.n] = { n: n, all: all, at: Date.now() };
        S("ao17cs:recall", h);
      }
      $$("[data-rc-i]", out).forEach(function (c) { c.addEventListener("change", upd); });
      upd();
    }
    $("[data-rc-check]", w).addEventListener("click", check);
  })();

  // ------------------------------------------------------------------ Ұмыту қисығы: R(t) = e^(-t/S), қайталау S-ті ұлғайтады
  (function () {
    var w = $("[data-mt-curve]");
    if (!w) return;
    // қайталау сәтінде ұмытылған сайын (R аз), бекіту көбірек: S *= 1 + 3(1 - R). Бір түнде қайталау R≈1 кезінде - пайдасы аз
    var PLANS = { once: [], cram: [0.05, 0.1, 0.15, 0.2], spaced: [1, 3, 7, 14] };
    var NAMES = { once: "Бір рет оқу", cram: "Бір түнде 5 рет", spaced: "1, 3, 7, 14-күндері" };
    var DAYS = 30, S0 = 1.5;
    function curve(reviews) {
      var pts = [], S = S0, last = 0, r = 0;
      for (var i = 0; i <= DAYS * 10; i++) {
        var t = i / 10;
        if (r < reviews.length && t >= reviews[r]) { var R = Math.exp(-(reviews[r] - last) / S); S *= 1 + 3 * (1 - R); last = reviews[r]; r++; }
        pts.push([t, Math.exp(-(t - last) / S)]);
      }
      return pts;
    }
    var anim = false, cur = "spaced";
    function draw(k) {
      cur = k;
      $$("[data-cv]", w).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cv") === k)); });
      var W = 600, H = 260, L = 44, R = 12, T = 16, B = 34;
      function X(t) { return L + (W - L - R) * t / DAYS; }
      function Y(v) { return T + (H - T - B) * (1 - v); }
      var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="cv-t"><title id="cv-t">Ұмыту қисығы: ' + esc(NAMES[k]) + "</title>";
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) { s += '<line class="g" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="ax" x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v * 100 + "%</text>"; });
      [0, 7, 14, 21, 30].forEach(function (d) { s += '<text class="ax" x="' + X(d) + '" y="' + (H - 12) + '" text-anchor="' + (d === 30 ? "end" : d === 0 ? "start" : "middle") + '">' + d + (d === 30 ? " күн" : "") + "</text>"; });
      function path(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(""); }
      if (k !== "once") s += '<path class="base" d="' + path(curve(PLANS.once)) + '"/>';
      var pts = curve(PLANS[k]);
      s += '<path class="cv" pathLength="1" d="' + path(pts) + '"/>';
      PLANS[k].forEach(function (d, j) { s += '<circle class="rv" style="--i:' + j + '" cx="' + X(d) + '" cy="' + Y(1) + '" r="4"/>'; });
      s += "</svg>";
      $("[data-cv-svg]", w).innerHTML = s;
      if (anim) $("[data-cv-svg] svg", w).classList.add("cv-anim");
      var end = Math.round(pts[pts.length - 1][1] * 100);
      $("[data-cv-cap]", w).innerHTML = "<b>" + esc(NAMES[k]) + "</b>: 30-күні есте қалғаны ≈ <b data-cv-end>" + end + "%</b>" + (k === "once" ? "" : " (сұр сызық - бір рет оқығанда)") + ".";
    }
    $$("[data-cv]", w).forEach(function (b) { b.addEventListener("click", function () { anim = true; draw(b.getAttribute("data-cv")); }); });
    draw("spaced");
    // экранға алғаш кіргенде қисық көз алдында сызылады
    if (window.AO17Motion && !window.AO17Motion.still) window.AO17Motion.onView(w, function () { anim = true; draw(cur); });
  })();

  // ------------------------------------------------------------------ Жаргон детекторы (Фейнман әдісі)
  (function () {
    var w = $("[data-mt-feynman]");
    if (!w) return;
    var sel = $("[data-fy-topic]", w), ta = $("[data-fy-text]", w), out = $("[data-fy-out]", w), cnt = $("[data-fy-count]", w);
    var saved = obj(J("ao17cs:explain", {}));
    var JG = D.jargon.slice().sort(function (a, b) { return b.length - a.length; });
    var WORD = /[a-zа-яәіңғүұқөһё0-9]+/gi;
    function load() { ta.value = (obj(saved[sel.value]).text) || ""; count(); out.innerHTML = ""; }
    function count() { var n = (ta.value.match(WORD) || []).length; cnt.textContent = n + " сөз" + (n < 40 ? " · тексеру үшін кемінде 40 сөз" : ""); }
    sel.addEventListener("change", load);
    ta.addEventListener("input", function () { count(); saved[sel.value] = { text: ta.value, at: Date.now(), ok: obj(saved[sel.value]).ok || 0 }; S("ao17cs:explain", saved); });
    function term(word) { var lw = word.toLowerCase(); for (var i = 0; i < JG.length; i++) if (lw.indexOf(JG[i]) === 0) return JG[i]; return null; }
    $("[data-fy-check]", w).addEventListener("click", function () {
      var text = ta.value.trim(), words = text.match(WORD) || [];
      if (words.length < 40) { out.innerHTML = '<p class="fy-warn">Түсіндірме тым қысқа: кемінде 40 сөз жаз (қазір ' + words.length + ").</p>"; return; }
      var sents = text.split(/[.!?…]+\s*|\n+/).map(function (x) { return x.trim(); }).filter(function (x) { return (x.match(WORD) || []).length > 0; });
      var DEF = /дегеніміз|деп аталады|деген сөз|яғни|дегенді білдіреді|деп айтамыз|деп атайды|[-—–]\s*бұл(?![а-яәіңғүұқөһё])/i;   // \b кириллицамен жұмыс істемейді
      var found = {};
      sents.forEach(function (s) {
        (s.match(WORD) || []).forEach(function (wd) {
          var t2 = term(wd);
          if (!t2) return;
          var f = found[t2] = found[t2] || { word: wd, ok: false };
          if (DEF.test(s)) f.ok = true;
        });
      });
      var terms = Object.keys(found), unexplained = terms.filter(function (k) { return !found[k].ok; });
      var avg = words.length / Math.max(1, sents.length);
      var C = [
        ["Сөйлемдер қысқа (орташа " + avg.toFixed(1) + " сөз)", avg <= 15, "Ұзын сөйлемдерді бөл: бір сөйлем - бір ой."],
        ["Мысал бар", /мысал|мәселен|айталық/i.test(text), "«Мысалы, ...» деп нақты жағдай қос."],
        ["Ұқсастық бар", /сияқты|секілді|тәрізді|ұқсас|сықылды|іспетті/i.test(text), "Ұғымды күнделікті бір нәрсеге ұқсатып көр."],
        ["Себебі айтылған", /себебі|өйткені|сондықтан|сол үшін|нәтижесінде/i.test(text), "«Неге?» деген сұраққа жауап бер: «себебі ...»."],
        [terms.length ? "Терминдер түсіндірілген (" + (terms.length - unexplained.length) + " / " + terms.length + ")" : "Терминсіз жазылған", unexplained.length === 0, "Белгіленген терминдердің мағынасын «яғни ...» деп аш не қарапайым сөзбен алмастыр."]
      ];
      var ok = C.filter(function (c) { return c[1]; }).length;
      var marked = esc(text).replace(/[a-zа-яәіңғүұқөһё0-9]+/gi, function (wd) { var t2 = term(wd); return t2 ? '<mark class="' + (found[t2] && found[t2].ok ? "ok" : "no") + '">' + wd + "</mark>" : wd; });
      out.innerHTML = '<p class="fy-score"><b>' + ok + " / 5</b> " + (ok === 5 ? "Тамаша түсіндірме! Енді оны досыңа айтып бер." : "Түзетіп, қайта тексер.") + '</p><ul class="fy-crit">'
        + C.map(function (c, k) { return '<li class="' + (c[1] ? "ok" : "no") + '" style="--i:' + k + '"><b>' + esc(c[0]) + "</b>" + (c[1] ? "" : "<span>" + esc(c[2]) + "</span>") + "</li>"; }).join("") + "</ul>"
        + (terms.length ? '<p class="mt-q">Мәтінің: <span class="fy-key"><mark class="ok">түсіндірілген термин</mark> <mark class="no">түсіндірілмеген</mark></span></p><blockquote class="fy-text">' + marked.replace(/\n/g, "<br>") + "</blockquote>" : "");
      saved[sel.value] = { text: ta.value, at: Date.now(), ok: Math.max(ok, obj(saved[sel.value]).ok || 0) };
      S("ao17cs:explain", saved);
      if (ok === 5 && typeof K().mark === "function") K().mark("ao17explain");   // «Түсіндіруші» жетістігі
    });
    load();
  })();

  // ------------------------------------------------------------------ Өзіңді бағала: сенімділік таразысы (ao17-exam.js жинайды) және оқу журналы
  (function () {
    var w = $("[data-mt-reflect]");
    if (!w) return;
    var cal = obj(J("ao17cs:calib", {})), NM = { sure: "Білемін", guess: "Шамалаймын", no: "Білмеймін" }, rows = "";
    ["sure", "guess", "no"].forEach(function (k) {
      var c = obj(cal[k]);
      if (!(c.n > 0)) return;
      var f = Math.round((Math.min(c.ok || 0, c.n) / c.n) * 100);
      rows += '<li class="cal-' + k + '"><span>' + NM[k] + '</span><span class="cal-bar"><i style="width:' + f + '%"></i></span><b>' + f + "% дұрыс</b><small>" + c.n + " сұрақ</small></li>";
    });
    $("[data-cal-out]", w).innerHTML = rows ? '<ul class="cal-list">' + rows + '</ul><p class="mt-note">«Білемін» деген жерде дұрыс жауап көп болса, өзіңді дәл бағалайсың. «Білмеймін» деген жерде де жиі дұрыс тапсаң, өзіңе көбірек сен.</p>'
      : '<p class="mt-note">Таразы әлі бос. <a href="exam.html?w=1">Апта сынағында</a> жауап бермес бұрын «Білемін», «Шамалаймын» не «Білмеймін» деп белгіле: нәтиже осында жиналады.</p>';
    var form = $("[data-jr-form]", w), list = $("[data-jr-list]", w), stat = $("[data-jr-stat]", w);
    function entries() { var e = J("ao17cs:journal", []); return Array.isArray(e) ? e.filter(function (x) { return x && typeof x.a === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.d); }) : []; }
    function streak(es) {
      var days = {}; es.forEach(function (x) { days[x.d] = 1; });
      var d = new Date(), n = 0;
      if (!days[today()]) d.setDate(d.getDate() - 1);   // бүгін әлі жазбасаң да, кешегі тізбек сақталады
      for (;;) { var k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); if (!days[k]) break; n++; d.setDate(d.getDate() - 1); }
      return n;
    }
    function render() {
      var es = entries();
      stat.textContent = es.length ? "Журналда " + es.length + " жазба · қатарынан " + streak(es) + " күн." : "Әр оқу кешінен соң үш сұраққа қысқа жауап жаз: бір аптадан кейін өсуіңді өзің көресің.";
      list.innerHTML = es.slice(-5).reverse().map(function (x) {
        return '<li><time>' + esc(x.d) + "</time><p><b>Түсіндім:</b> " + esc(x.a) + "</p>" + (x.b ? "<p><b>Түсініксіз:</b> " + esc(x.b) + "</p>" : "") + (x.c ? "<p><b>Келесі:</b> " + esc(x.c) + "</p>" : "") + "</li>";
      }).join("");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var a = form.elements.a.value.trim();
      if (!a) { form.elements.a.focus(); return; }
      var es = entries();
      es.push({ d: today(), a: a.slice(0, 2000), b: form.elements.b.value.trim().slice(0, 2000), c: form.elements.c.value.trim().slice(0, 2000), at: Date.now() });
      S("ao17cs:journal", es.slice(-365));
      form.reset();
      render();
      if (typeof K().check === "function") K().check();   // «Журнал жүргізуші» жетістігі
    });
    $("[data-jr-export]", w).addEventListener("click", function () {
      var es = entries();
      var txt = "AO17 CS - оқу журналы\n\n" + es.map(function (x) { return x.d + "\nТүсіндім: " + x.a + (x.b ? "\nТүсініксіз: " + x.b : "") + (x.c ? "\nКелесі: " + x.c : ""); }).join("\n\n") + "\n";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
      a.download = "ao17-cs-journal.txt";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    });
    render();
  })();

  // ------------------------------------------------------------------ Араластыру: блоктардан аралас ретке (FLIP)
  (function () {
    var mix = $(".mt-mix");
    if (!mix || !window.AO17Motion || window.AO17Motion.still) return;
    window.AO17Motion.onView(mix, function () {
      var rows = $$(".mt-mixrow", mix);
      if (rows.length < 2) return;
      var src = $$("i", rows[0]), dst = $$("i", rows[1]), used = {};
      dst.forEach(function (t) {
        for (var j = 0; j < src.length; j++) {
          if (!used[j] && src[j].className === t.className) {
            used[j] = 1;
            var a = src[j].getBoundingClientRect(), b = t.getBoundingClientRect();
            t.style.transition = "none";
            t.style.transform = "translate(" + Math.round(a.left - b.left) + "px," + Math.round(a.top - b.top) + "px)";
            break;
          }
        }
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          dst.forEach(function (t, k) { t.style.transition = "transform .75s var(--e-out) " + (k * 80 + 150) + "ms"; t.style.transform = ""; });
        });
      });
    });
  })();

  // ------------------------------------------------------------------ Ұқсастық карточкалары: ашу/жабу
  $$(".an-b").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(open));
      document.getElementById(b.getAttribute("aria-controls")).hidden = !open;
      b.parentNode.classList.toggle("is-open", open);
    });
  });

  // ------------------------------------------------------------------ Фокус таймері (аяқталу уақыты бойынша: бет ұйықтаса да дәл)
  (function () {
    var w = $("[data-mt-focus]");
    if (!w) return;
    var time = $("[data-fc-time]", w), phase = $("[data-fc-phase]", w), go = $("[data-fc-go]", w), stat = $("[data-fc-stat]", w), ring = $("[data-fc-ring]", w);
    var C = 2 * Math.PI * 52, mins = [25, 5], mode = "focus", end = 0, left = 25 * 60, t = null, title0 = document.title;
    ring.style.strokeDasharray = C.toFixed(1);
    function data() { var f = obj(J("ao17cs:focus", {})); f.days = obj(f.days); f.total = f.total || 0; return f; }
    function showStat() { var f = data(); stat.textContent = "Бүгін: " + (f.days[today()] || 0) + " фокус сессиясы · барлығы: " + f.total + "."; }
    function render() {
      var full = (mode === "focus" ? mins[0] : mins[1]) * 60;
      time.textContent = mmss(left);
      phase.textContent = mode === "focus" ? "Фокус" : "Үзіліс";
      ring.style.strokeDashoffset = (C * (1 - left / full)).toFixed(1);
      w.classList.toggle("is-break", mode !== "focus");
      if (t) document.title = mmss(left) + " · " + (mode === "focus" ? "Фокус" : "Үзіліс") + " - AO17";
    }
    function stop() { if (t) clearInterval(t); t = null; go.textContent = "Бастау"; document.title = title0; }
    function tick() {
      left = Math.max(0, Math.round((end - Date.now()) / 1000));
      render();
      if (left > 0) return;
      stop();
      if (mode === "focus") {
        var f = data(); f.total++; f.days[today()] = (f.days[today()] || 0) + 1; S("ao17cs:focus", f);
        if (typeof K().check === "function") K().check();   // «Фокус шебері» жетістігі
        mode = "break"; left = mins[1] * 60;
        stat.textContent = "Фокус аяқталды. Енді " + mins[1] + " минут демал: орныңнан тұр, суға шық.";
        if (typeof K().toast === "function") K().toast("Фокус аяқталды: " + mins[1] + " минут үзіліс");
      } else {
        mode = "focus"; left = mins[0] * 60;
        stat.textContent = "Үзіліс бітті. Келесі фокусқа дайынсың ба?";
      }
      render();
      setTimeout(showStat, 4000);
    }
    go.addEventListener("click", function () {
      if (t) { stop(); render(); return; }   // кідірту
      end = Date.now() + left * 1000;
      t = setInterval(tick, 1000);
      go.textContent = "Кідірту";
      render();
    });
    $("[data-fc-reset]", w).addEventListener("click", function () { stop(); mode = "focus"; left = mins[0] * 60; render(); showStat(); });
    $$("[data-fc-p]", w).forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-fc-p]", w).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        mins = b.getAttribute("data-fc-p").split(",").map(Number);
        stop(); mode = "focus"; left = mins[0] * 60; render();
      });
    });
    render(); showStat();
  })();
})();
