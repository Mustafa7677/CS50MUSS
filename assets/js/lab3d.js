/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 · 3D зертхана лекция беттері (tools/academy/lab3d.py): тест пен болжамды тексеру.
   Дұрыс жауап (алғашқы рет) INSIDE TECH-тің «inside-tech:activity» күнделігіне «problem» болып жазылады, барлық тест шешілсе - «lesson».
   Бір origin болғандықтан, бұл белсенділікті 3D қолданба да, «Менің шаңырағым» беті де көреді. Шешілген сұрақтар: «ao17:lab3d». */
(function () {
  "use strict";
  var root = document.querySelector(".l3[data-lesson]");
  if (!root) return;
  var lesson = root.getAttribute("data-lesson");
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function dayKey() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function record(kind) {
    var log = J("inside-tech:activity", { days: {} });
    if (!log || typeof log !== "object" || typeof log.days !== "object" || !log.days) log = { days: {} };
    var k = dayKey(), day = log.days[k] && typeof log.days[k] === "object" ? log.days[k] : {};
    day[kind] = Math.min(9999, (typeof day[kind] === "number" ? day[kind] : 0) + 1);
    log.days[k] = day;
    var keys = Object.keys(log.days).sort();
    while (keys.length > 400) delete log.days[keys.shift()];
    S("inside-tech:activity", log);
  }
  var solved = J("ao17:lab3d", {});
  if (!solved || typeof solved !== "object") solved = {};
  var mine = Array.isArray(solved[lesson]) ? solved[lesson] : [];
  var quizzes = root.querySelectorAll(".l3-q");
  var total = root.querySelectorAll(".l3-quiz .l3-q").length;

  function progress() {
    var done = mine.filter(function (q) { return !/:(predict|contrast)$/.test(q); }).length;
    var el = document.getElementById("l3-progress");
    if (el) el.textContent = total ? done + " / " + total + " сұрақ шешілді" : "";
  }

  Array.prototype.forEach.call(quizzes, function (q) {
    var ans = +q.getAttribute("data-answer"), id = q.getAttribute("data-qid"), fb = q.querySelector(".l3-fb"), det = q.querySelector(".l3-ans");
    var explain = det ? det.querySelectorAll("p")[1] : null;
    if (det) det.classList.add("l3-js");
    function lock(i, ok) {
      q.classList.add(ok ? "is-ok" : "is-tried");
      var b = q.querySelectorAll(".l3-opt");
      Array.prototype.forEach.call(b, function (x, k) { if (k === ans && ok) { x.classList.add("ok"); x.setAttribute("aria-pressed", "true"); } });
      if (ok && det) det.open = true;
    }
    if (mine.indexOf(id) >= 0) { lock(ans, true); fb.textContent = "Бұрын шешкенсің."; }
    Array.prototype.forEach.call(q.querySelectorAll(".l3-opt"), function (btn) {
      btn.addEventListener("click", function () {
        var i = +btn.getAttribute("data-i");
        if (q.classList.contains("is-ok")) return;
        if (i === ans) {
          lock(i, true);
          fb.textContent = "Дұрыс! " + (explain ? explain.textContent : "");
          if (mine.indexOf(id) < 0) {
            mine.push(id); solved[lesson] = mine; S("ao17:lab3d", solved);
            if (!/:(predict|contrast)$/.test(id)) {
              record("problem");
              var done = mine.filter(function (x) { return !/:(predict|contrast)$/.test(x); }).length;
              if (total && done === total) { record("lesson"); fb.textContent += " Сабақтың барлық тесті шешілді!"; }
            }
            progress();
          }
        } else {
          btn.classList.add("bad"); btn.setAttribute("aria-pressed", "false");
          q.classList.add("is-tried");
          fb.textContent = q.getAttribute("data-hint") || "Тағы ойланып көр: дәрістің осы бөлігіне қайта қара.";
        }
      });
    });
  });
  progress();
})();
