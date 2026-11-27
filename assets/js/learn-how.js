/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Қалай оқу керек?» (academy/learn.html, tools/academy/inside_comics.py): оқу туралы жеті сенім. Әр эпизодта оқушы алдымен
   «Миф» не «Шындық» деп болжайды, сосын комикс, зерттеулердің нәтижесі және сайттағы құрал ашылады: алдын ала болжау оқуды күшейтеді.
   Болжамдар INSIDE TECH-пен ортақ кілтте («inside-tech:learn-how»: эпизод -> дұрыс па): 3D қолданбадағы «Қалай оқу керек?» те көреді.
   JS жоқ кезде бәрі бірден көрінеді (жауабы да). */
(function () {
  "use strict";
  var KEY = "inside-tech:learn-how";
  var root = document.querySelector(".lh");
  if (!root) return;
  var eps = Array.prototype.slice.call(root.querySelectorAll(".lh-ep"));
  var ids = eps.map(function (e) { return e.getAttribute("data-ep"); });
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "{}"), out = {};
      if (v && typeof v === "object") Object.keys(v).forEach(function (k) { if (ids.indexOf(k) >= 0 && typeof v[k] === "boolean") out[k] = v[k]; });
      return out;
    } catch (e) { return {}; }
  }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  var seen = load();

  function paint(ep) {
    var id = ep.getAttribute("data-ep"), fact = ep.getAttribute("data-fact") === "1", done = id in seen;
    var open = ep.querySelector(".lh-open"), locked = ep.querySelector(".lh-locked"), verdict = ep.querySelector(".lh-verdict");
    open.hidden = !done;
    locked.hidden = done;
    Array.prototype.forEach.call(ep.querySelectorAll(".lh-btns button"), function (b) {
      b.disabled = done;
      var truth = done && (b.getAttribute("data-v") === "1") === fact;
      if (truth) b.setAttribute("data-state", "truth"); else b.removeAttribute("data-state");
    });
    verdict.textContent = "";
    if (done) {
      verdict.setAttribute("data-right", seen[id] ? "1" : "0");
      verdict.appendChild(document.createTextNode((seen[id] ? "Дұрыс таптың." : "Көп адам осылай ойлайды.") + " Бұл: "));
      var b = document.createElement("b");
      b.textContent = fact ? "шындық" : "миф";
      verdict.appendChild(b);
      verdict.appendChild(document.createTextNode(". Енді комиксті оқы."));
    }
    var chip = root.querySelector('.lh-nav a[data-ep="' + id + '"]');
    if (chip) { if (done) chip.setAttribute("data-state", seen[id] ? "right" : "wrong"); else chip.removeAttribute("data-state"); }
  }
  function progress() {
    var done = ids.filter(function (k) { return k in seen; }).length, right = ids.filter(function (k) { return seen[k] === true; }).length;
    var p = root.querySelector(".lh-prog");
    if (p) p.textContent = done + " / " + ids.length + " эпизод · " + right + " дұрыс болжам";
    var fin = root.querySelector(".lh-final");
    if (fin) fin.hidden = done < ids.length;
  }

  eps.forEach(function (ep) {
    ep.classList.add("lh-js");
    Array.prototype.forEach.call(ep.querySelectorAll(".lh-btns button"), function (b) {
      b.addEventListener("click", function () {
        var id = ep.getAttribute("data-ep");
        if (id in seen) return;
        seen[id] = (b.getAttribute("data-v") === "1") === (ep.getAttribute("data-fact") === "1");
        save(seen);
        paint(ep);
        progress();
        var v = ep.querySelector(".lh-verdict");
        if (v) v.focus();
      });
    });
    paint(ep);
  });
  progress();
})();
