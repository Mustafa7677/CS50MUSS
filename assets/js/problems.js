/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Есептер залы» (academy/problems.html, tools/academy/inside_pages.py): әр қиын есеп үш қадам.
   1) Талдау - маманның шешімі фильм болып (assets/js/board-film.js). 2) Стратегия - егіз есепке қай идея керек.
   3) Өзің шығар - егіз есеп қадам-қадаммен: жауап сан («62,8», «62.8», «1/7», «−3»), рұқсат етілген дәлдікпен тексеріледі.
   Жұлдыз INSIDE TECH-тегідей: 3, әр кеңес және қате стратегия (бір рет) бір жұлдызды алады, ең азы 1.
   Күннің есебі барлығына бірдей (2026-01-01-ден бергі күн нөмірі), шешкен күндер қатарға тізіледі (стрик).
   Жұлдыздар мен күндер INSIDE TECH-пен ортақ кілтте: «inside-tech:problems» = {stars: {есеп: 1..3}, streak: {days: ["2026-11-27", ...]}}.
   JS жоқ кезде бәрі ашық: идея, дұрыс стратегия және әр қадамның жауабы ашылатын блоктарда. */
(function () {
  "use strict";
  var KEY = "inside-tech:problems";
  var root = document.querySelector(".pr");
  if (!root) return;
  var arts = Array.prototype.slice.call(root.querySelectorAll(".pr-p"));
  var ids = arts.map(function (a) { return a.getAttribute("data-pr"); });
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function prevKey(k) { var p = k.split("-").map(Number); return dayKey(new Date(p[0], p[1] - 1, p[2] - 1)); }
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "{}") || {}, stars = {};
      if (v.stars && typeof v.stars === "object") Object.keys(v.stars).forEach(function (k) {
        var n = v.stars[k];
        if (ids.indexOf(k) >= 0 && typeof n === "number" && n >= 1 && n <= 3) stars[k] = n;
      });
      var days = v.streak && Array.isArray(v.streak.days) ? v.streak.days.filter(function (d) { return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d); }) : [];
      return { stars: stars, streak: { days: days } };
    } catch (e) { return { stars: {}, streak: { days: [] } }; }
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function streak(today) {
    var set = {}, k = dayKey(today), n = 0;
    S.streak.days.forEach(function (d) { set[d] = 1; });
    if (!set[k]) k = prevKey(k);
    while (set[k]) { n++; k = prevKey(k); }
    return n;
  }
  function best() {
    var days = S.streak.days.filter(function (d, i, a) { return a.indexOf(d) === i; }).sort(), b = 0, run = 0, last = "";
    days.forEach(function (d) { run = last && prevKey(d) === last ? run + 1 : 1; b = Math.max(b, run); last = d; });
    return b;
  }
  function daily(d) {
    var days = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
    return ids[((days % ids.length) + ids.length) % ids.length];
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function starText(n) { return "★★★".slice(0, n) + "☆☆☆".slice(n); }
  function readNumber(text) {
    var t = String(text).trim().replace(/\s+/g, "").replace(",", ".").replace("−", "-");
    if (!t) return null;
    var f = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(t);
    if (f) return Number(f[2]) === 0 ? null : Number(f[1]) / Number(f[2]);
    var n = Number(t);
    return isFinite(n) ? n : null;
  }

  // ---- жоғарғы тақта: күннің есебі, соңғы жеті күн, жұлдыздар мен күндер қатары
  var hud = root.querySelector(".pr-hud"), today = new Date(), todayId = daily(today);
  function paintHud() {
    if (!hud) return;
    hud.hidden = false;
    var dl = hud.querySelector(".pr-daily"), wk = hud.querySelector(".pr-week"), sc = hud.querySelector(".pr-score");
    var t = root.querySelector("#pr-" + todayId + " h2");
    dl.textContent = "Бүгінгі есеп: ";
    var a = el("a", null, t ? t.textContent : todayId);
    a.href = "#pr-" + todayId;
    dl.appendChild(a);
    wk.textContent = "";
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i), k = dayKey(d), solved = S.streak.days.indexOf(k) >= 0;
      var li = el("li", (solved ? "is-solved" : "") + (i === 0 ? " is-today" : ""), String(d.getDate()));
      li.setAttribute("aria-label", pad(d.getDate()) + "." + pad(d.getMonth() + 1) + ": " + (solved ? "есеп шешілді" : "есеп шешілмеді"));
      wk.appendChild(li);
    }
    var total = ids.reduce(function (n, k) { return n + (S.stars[k] || 0); }, 0);
    sc.textContent = "Жұлдыз: " + total + " / " + ids.length * 3 + " · күндер қатары: " + streak(today) + " · ең ұзағы: " + best();
  }
  var dart = root.querySelector("#pr-" + todayId);
  if (dart) {
    dart.classList.add("is-daily");
    var k = dart.querySelector(".pr-k");
    if (k) k.insertBefore(el("span", "pr-badge", "Бүгінгі есеп"), k.firstChild);
  }

  // ---- әр есеп: стратегия -> егіз есеп
  arts.forEach(function (a) {
    var id = a.getAttribute("data-pr"), misses = 0, hints = 0, chosen = false;
    var opts = Array.prototype.slice.call(a.querySelectorAll(".pr-opts button")), fb = a.querySelector(".pr-fb"), why = a.querySelector(".pr-why");
    var twin = a.querySelector(".pr-twin"), lock = a.querySelector(".pr-lock"), close = a.querySelector(".pr-close");
    var steps = Array.prototype.slice.call(a.querySelectorAll(".pr-step")), starsP = a.querySelector(".pr-stars");
    a.classList.add("pr-js");
    close.hidden = true;
    lock.hidden = false;
    twin.classList.add("is-locked");
    function paintStars() { starsP.textContent = S.stars[id] ? "Шешілді: " + starText(S.stars[id]) : ""; }
    function activate(k) {
      steps.forEach(function (li, i) {
        var on = chosen && i === k, inp = li.querySelector("input");
        li.classList.toggle("is-now", on);
        li.classList.toggle("is-wait", !on && !li.classList.contains("is-done"));
        if (!li.classList.contains("is-done")) {
          inp.disabled = !on;
          Array.prototype.forEach.call(li.querySelectorAll("button"), function (b) { b.disabled = !on || (b.classList.contains("pr-hint-b") && li.hasAttribute("data-hinted")); });
        }
      });
    }
    function finish() {
      var n = Math.max(1, 3 - hints - Math.min(misses, 1));
      S.stars[id] = Math.max(S.stars[id] || 0, n);
      var k = dayKey(new Date());
      if (S.streak.days.indexOf(k) < 0) S.streak.days = S.streak.days.concat([k]).slice(-400);
      save();
      close.hidden = false;
      var res = el("p", "pr-result", "Есеп шешілді: " + starText(n) + (n < 3 ? " (кеңес не қате стратегия бір жұлдыз алады)" : ""));
      res.setAttribute("role", "status");
      close.parentNode.insertBefore(res, close);
      paintStars();
      paintHud();
    }
    opts.forEach(function (b) {
      b.addEventListener("click", function () {
        if (chosen) return;
        if (b.getAttribute("data-ok") === "1") {
          chosen = true;
          b.setAttribute("data-state", "right");
          opts.forEach(function (x) { x.disabled = true; });
          fb.textContent = "Дұрыс идея. Енді егіз есепті шығар.";
          why.open = true;
          lock.hidden = true;
          twin.classList.remove("is-locked");
          activate(0);
          var first = steps[0] && steps[0].querySelector("input");
          if (first) first.focus();
        } else {
          misses++;
          b.setAttribute("data-state", "wrong");
          b.disabled = true;
          fb.textContent = "Бұл идея бұл есепке келмейді. Тағы ойлан.";
        }
      });
    });
    steps.forEach(function (li, i) {
      var inp = li.querySelector("input"), sfb = li.querySelector(".pr-sfb"), hint = li.querySelector(".pr-hint");
      var ans = Number(li.getAttribute("data-answer")), tol = Number(li.getAttribute("data-tol")) || 1e-9;
      li.querySelector(".pr-ans").hidden = true;   // жауап - кеңес арқылы; JS жоқ кезде ғана ашық
      function check() {
        var n = readNumber(inp.value);
        if (n === null) { sfb.textContent = "Санды жаз: мысалы 62,8 не 1/7."; return; }
        if (Math.abs(n - ans) <= tol) {
          li.classList.add("is-done");
          li.classList.remove("is-now");
          inp.disabled = true;
          Array.prototype.forEach.call(li.querySelectorAll("button"), function (b) { b.disabled = true; });
          sfb.textContent = "Дұрыс!";
          if (i + 1 < steps.length) { activate(i + 1); steps[i + 1].querySelector("input").focus(); } else finish();
        } else sfb.textContent = "Әлі емес. Қайта есепте не кеңесті аш.";
      }
      li.querySelector(".pr-check").addEventListener("click", check);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
      li.querySelector(".pr-hint-b").addEventListener("click", function () {
        if (li.hasAttribute("data-hinted")) return;
        li.setAttribute("data-hinted", "");
        hints++;
        hint.hidden = false;
        this.disabled = true;
      });
    });
    activate(-1);
    paintStars();
  });
  paintHud();
})();
