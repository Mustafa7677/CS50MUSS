/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Кім боламын?» (academy/careers.html, tools/academy/inside_pages.py): жеті сұрақтық тест және мамандыққа апаратын жолдағы дайындық.
   Тест INSIDE TECH-тегідей: әр жауап бірнеше мамандыққа ұпай қосады, сәйкестік - мамандықтың ең көп жинай алатын ұпайының пайызы.
   Жауаптар INSIDE TECH-пен ортақ кілтте («inside-tech:career»: әр сұрақтың таңдалған нұсқасы), сондықтан 3D қолданба да көреді.
   Дайындық: жолдағы сабақтың барлық тесті шешілсе (AO17 лекция беттері, «ao17:lab3d»), ол «өтті».
   JS жоқ кезде тест жасырын, мамандықтардың бәрі оқылады. Мәтін тек textContent арқылы қойылады. */
(function () {
  "use strict";
  var KEY = "inside-tech:career";
  var root = document.querySelector(".cr");
  if (!root) return;
  var quiz = root.querySelector(".cr-quiz"), raw = root.querySelector(".cr-data");
  var data;
  try { data = JSON.parse(raw.textContent); } catch (e) { return; }
  var Q = data.quiz, N = Q.length, ids = Object.keys(data.names);
  var ask = quiz.querySelector(".cr-ask"), res = quiz.querySelector(".cr-res"), step = quiz.querySelector(".cr-step"), qt = quiz.querySelector(".cr-qt");
  var opts = quiz.querySelector(".cr-opts"), back = quiz.querySelector(".cr-back"), again = quiz.querySelector(".cr-again");
  var top = quiz.querySelector(".cr-top-name"), list = quiz.querySelector(".cr-rank");

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      return Array.isArray(v) && v.length === N && v.every(function (x) { return x === Math.floor(x) && x >= 0 && x < 4; }) ? v : null;
    } catch (e) { return null; }
  }
  function store(v) { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) { /* сақтау қолжетімсіз */ } }
  function maxScore(id) {
    return Q.reduce(function (n, q) { return n + Math.max.apply(null, [0].concat(q.options.map(function (o) { return o.adds[id] || 0; }))); }, 0);
  }
  function rank(a) {
    var sc = {};
    a.forEach(function (x, i) {
      var o = Q[i] && Q[i].options[x];
      if (o) Object.keys(o.adds).forEach(function (id) { sc[id] = (sc[id] || 0) + o.adds[id]; });
    });
    return ids.map(function (id) { var m = maxScore(id); return { id: id, p: m ? Math.round(100 * (sc[id] || 0) / m) : 0 }; })
      .sort(function (x, y) { return y.p - x.p; });
  }

  var answers = [];
  function showQ(focus) {
    ask.hidden = false;
    res.hidden = true;
    var k = answers.length;
    step.textContent = (k + 1) + " / " + N + "-сұрақ";
    qt.textContent = Q[k].q;
    opts.textContent = "";
    Q[k].options.forEach(function (o, i) {
      var b = el("button", null, o.text);
      b.type = "button";
      b.addEventListener("click", function () {
        answers.push(i);
        if (answers.length === N) { store(answers); showRes(true); } else showQ(true);
      });
      opts.appendChild(b);
    });
    back.hidden = k === 0;
    if (focus) qt.focus();
  }
  function showRes(focus) {
    ask.hidden = true;
    res.hidden = false;
    var r = rank(answers);
    top.textContent = "";
    var a = el("a", null, data.names[r[0].id]);
    a.href = "#cr-" + r[0].id;
    top.appendChild(a);
    top.appendChild(document.createTextNode(" · " + r[0].p + "% сәйкес"));
    list.textContent = "";
    r.forEach(function (x) {
      var li = el("li"), bar = el("span", "cr-rb"), fill = el("i");
      fill.style.width = x.p + "%";
      bar.appendChild(fill);
      li.appendChild(el("span", "cr-rn", data.names[x.id]));
      li.appendChild(bar);
      li.appendChild(el("b", null, x.p + "%"));
      list.appendChild(li);
    });
    r.forEach(function (x, i) {
      var card = root.querySelector('.cr-card[data-cr="' + x.id + '"]');
      if (!card) return;
      var m = card.querySelector(".cr-match");
      m.hidden = false;
      m.textContent = "Тест бойынша сәйкестігі: " + x.p + "%";
      card.classList.toggle("is-top", i === 0);
    });
    if (focus) top.focus();
  }
  back.addEventListener("click", function () { answers.pop(); showQ(true); });
  again.addEventListener("click", function () {
    answers = [];
    store(null);
    Array.prototype.forEach.call(root.querySelectorAll(".cr-card"), function (c) { c.classList.remove("is-top"); c.querySelector(".cr-match").hidden = true; });
    showQ(true);
  });
  quiz.hidden = false;
  var saved = load();
  if (saved) { answers = saved; showRes(false); } else showQ(false);

  // жолдағы дайындық: лекция бетінде сабақтың барлық тесті шешілсе - «өтті» (academy/3d/index.html-дағыдай)
  var all;
  try { all = JSON.parse(localStorage.getItem("ao17:lab3d")) || {}; } catch (e) { all = {}; }
  if (!all || typeof all !== "object") all = {};
  function real(q) { return !/:(predict|contrast)$/.test(q); }
  Array.prototype.forEach.call(root.querySelectorAll(".cr-road"), function (sec) {
    var links = sec.querySelectorAll("a[data-lid]"), done = 0;
    Array.prototype.forEach.call(links, function (a) {
      var arr = Array.isArray(all[a.getAttribute("data-lid")]) ? all[a.getAttribute("data-lid")] : [], q = +a.getAttribute("data-q");
      if (q && arr.filter(real).length >= q) { done++; a.classList.add("is-done"); a.setAttribute("title", "Сабақтың барлық тесті шешілді"); }
    });
    var s = sec.querySelector(".cr-ready");
    if (s) s.textContent = "· өттің: " + done + " / " + links.length;
  });
})();
