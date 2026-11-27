/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Бір басудың саяхаты» (academy/journey.html, tools/academy/inside_pages.py): он аялдаманың сұрақтары және уақыт шкаласы.
   Сұрақ: қате нұсқа өшеді («тағы ойлан»), дұрысы табылса - түсіндірмесі ашылады; шешілгендер «ao17:journey» кілтінде.
   Шкала: экранның ортасындағы аялдама белгіленеді, «t = ... мс» - сол аялдаманың соңына дейінгі уақыт.
   JS жоқ кезде сұрақтың жауабы ашылатын блокта оқылады. */
(function () {
  "use strict";
  var KEY = "ao17:journey";
  var root = document.querySelector(".jr");
  if (!root) return;
  var stops = Array.prototype.slice.call(root.querySelectorAll(".jr-stop"));
  var segs = Array.prototype.slice.call(root.querySelectorAll(".jr-seg"));
  var now = root.querySelector(".jr-now b"), prog = root.querySelector(".jr-prog");
  var solved;
  try { solved = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { solved = []; }
  if (!Array.isArray(solved)) solved = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(solved)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function progress() { if (prog) prog.textContent = solved.length + " / " + stops.length + " сұрақ шешілді"; }

  stops.forEach(function (li) {
    var id = li.id, q = li.querySelector(".jr-q");
    if (!q) return;
    var ans = +q.getAttribute("data-answer"), fb = q.querySelector(".jr-fb"), det = q.querySelector(".jr-ans");
    var btns = Array.prototype.slice.call(q.querySelectorAll(".jr-opts button"));
    function done() {
      btns.forEach(function (b) { b.disabled = true; if (+b.getAttribute("data-i") === ans) b.setAttribute("data-state", "right"); });
      if (det) det.open = true;
      li.classList.add("is-done");
    }
    if (solved.indexOf(id) >= 0) { done(); fb.textContent = "Шешілді."; }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (+b.getAttribute("data-i") === ans) {
          fb.textContent = "Дұрыс!";
          if (solved.indexOf(id) < 0) { solved.push(id); save(); }
          done();
          progress();
        } else {
          b.setAttribute("data-state", "wrong");
          b.disabled = true;
          fb.textContent = "Жоқ, тағы ойлан.";
        }
      });
    });
  });
  progress();

  function mark(k) {
    segs.forEach(function (s, i) {
      s.classList.toggle("is-past", i < k);
      s.classList.toggle("is-now", i === k);
    });
    stops.forEach(function (li, i) { li.classList.toggle("is-now", i === k); });
    if (now) now.textContent = "t = " + stops[k].getAttribute("data-t") + " мс";
    root.setAttribute("data-now", String(k));
  }
  if ("IntersectionObserver" in window && stops.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mark(+e.target.getAttribute("data-k")); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    stops.forEach(function (li) { io.observe(li); });
  }
})();
