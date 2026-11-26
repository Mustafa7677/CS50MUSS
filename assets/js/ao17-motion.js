/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 CS беттерінің қозғалыс қабаты (курс, оқу кестесі, оқу тактикалары, емтихан, сертификат). Сайттың жалпы қозғалыс
   жүйесін (main.js: бетаралық өту, initCinema, микро-интеракциялар) толықтырады: мұнда тек мағыналы сәттер бар.
   - [data-ao-in]: экранға кіргенде бір рет .ao-in қосылады (курс картасы сызылады, мұқаба ашылады т.б., ao17-motion.css);
   - [data-ao-count]: сан 0-ден өз мәніне дейін өседі (мәтіннің соңғы түрі өзгермейді);
   - [data-ao-progress]: беттің жоғарғы жиегінде скролл жолағы;
   - [data-ao-spy]: навигацияда экрандағы бөлімнің сілтемесі белгіленеді (.is-cur).
   Қозғалысты азайту (prefers-reduced-motion не сайттағы «Анимация» баптауы, html.reduce-motion): бәрі бірден соңғы күйде.
   Басқа скрипттерге: window.AO17Motion = { still, onView(el, fn), count(scope) }. */
(function () {
  "use strict";
  var root = document.documentElement;
  var still = root.classList.contains("reduce-motion") || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !("IntersectionObserver" in window);
  root.classList.add(still ? "ao-still" : "ao-move");

  // ------------------------------------------------------------------ экранға бір рет кіру
  var waits = [];
  var io = still ? null : new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      waits = waits.filter(function (w) {
        if (w.el !== e.target) return true;
        w.fn(e.target);
        return false;
      });
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
  function onView(el, fn) {
    if (!el) return;
    if (still) { fn(el); return; }
    waits.push({ el: el, fn: fn });
    io.observe(el);
  }
  function reveal(el) { el.classList.add("ao-in"); count(el); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-ao-in]"), function (el) { onView(el, reveal); });

  // ------------------------------------------------------------------ сан өседі: «≈157», «1573», «97%» - алды мен арты сақталады
  function count(scope) {
    var els = scope.matches && scope.matches("[data-ao-count]") ? [scope] : Array.prototype.slice.call(scope.querySelectorAll("[data-ao-count]"));
    els.forEach(function (el) {
      if (el.__aoCounted) return;
      el.__aoCounted = true;
      var m = /^(\D*)(\d+)(\D*)$/.exec(el.textContent.trim());
      if (still || !m) return;
      var to = Number(m[2]), t0 = performance.now(), dur = Math.min(1400, 500 + to * 2);
      function step(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = m[1] + Math.round(to * e) + m[3];
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = m[1] + m[2] + m[3];
      }
      requestAnimationFrame(step);
    });
  }
  // сан бөлек (тақырыпта) тұрса - экранға кіргенде өседі
  Array.prototype.forEach.call(document.querySelectorAll("[data-ao-count]"), function (el) { if (!el.closest("[data-ao-in]")) onView(el, count); });

  // ------------------------------------------------------------------ скролл жолағы
  var prog = document.querySelector("[data-ao-progress]");
  if (prog) {
    var bar = document.createElement("div");
    bar.className = "ao-progress";
    bar.setAttribute("aria-hidden", "true");
    bar.appendChild(document.createElement("i"));
    document.body.appendChild(bar);
    var ticking = false;
    var upd = function () {
      ticking = false;
      var max = root.scrollHeight - innerHeight;
      bar.style.setProperty("--p", max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : "0");
    };
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener("resize", upd);
    upd();
  }

  // ------------------------------------------------------------------ бөлімдер навигациясы: экрандағы бөлім белгіленеді
  Array.prototype.forEach.call(document.querySelectorAll("[data-ao-spy]"), function (nav) {
    if (!("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) { var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) map[t.id] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-cur"); a.removeAttribute("aria-current"); });
        var a = map[e.target.id];
        if (a) {
          a.classList.add("is-cur"); a.setAttribute("aria-current", "location");
          var ul = a.closest("ul");   // бір жолдағы мазмұнда белсенді сілтеме көрініп тұрсын (бетті тігінен жылжытпай)
          if (ul && ul.scrollWidth > ul.clientWidth) ul.scrollLeft = Math.max(0, a.offsetLeft - ul.offsetLeft - 24);
        }
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  });

  window.AO17Motion = { still: still, onView: onView, count: count };
})();
