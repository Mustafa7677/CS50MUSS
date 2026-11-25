/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 CS курс беті (academy/course.html): әр апта мен әр зертхананың прогресі және «Жалғастыру» батырмасы.
   Дерек көзі - тек осы браузер: 1-бөлім «cs50kz:academy» (academy.js: сабақ меңгерілсе - mastered),
   2-бөлім «ao17:lab3d» (lab3d.js: шешілген сұрақтар; сабақтың барлық тесті шешілсе - аяқталды). Ештеңе басталмаса, бет өзгермейді. */
(function () {
  "use strict";
  var box = document.getElementById("crs-data");
  if (!box) return;
  var D;
  try { D = JSON.parse(box.textContent); } catch (e) { return; }
  function J(k) { try { var v = JSON.parse(localStorage.getItem(k)); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  var acad = J("cs50kz:academy"), lessons = acad.lessons && typeof acad.lessons === "object" ? acad.lessons : {};
  var lab = J("ao17:lab3d");
  // 0 - басталмаған, 1 - басталған, 2 - аяқталған
  function part1(id) { var r = lessons[id]; return !r || typeof r !== "object" ? 0 : r.mastered ? 2 : (r.score || (r.ex && Object.keys(r.ex).length)) ? 1 : 0; }
  function part2(id, total) {
    var a = Array.isArray(lab[id]) ? lab[id] : [];
    var n = a.filter(function (q) { return !/:(predict|contrast)$/.test(q); }).length;
    return !a.length ? 0 : total && n >= total ? 2 : 1;
  }
  var order = [[], []], done = [0, 0], all = [0, 0];
  function paint(el, items, st) {
    var d = 0, s = 0;
    st.forEach(function (v) { if (v === 2) d++; if (v) s++; });
    if (el && s) {
      el.classList.add("has-pr");
      var bar = el.querySelector(".crs-bar i");
      if (bar) bar.style.width = Math.round((d / items.length) * 100) + "%";
      var t = el.querySelector(".crs-pr");
      if (t) t.textContent = d + " / " + items.length + " сабақ аяқталды";
    }
    return d;
  }
  function walk(group, part, idOf, state) {
    Object.keys(group).forEach(function (k) {
      var items = group[k], st = items.map(state);
      items.forEach(function (x, i) { order[part].push({ href: x[1], title: x[2], st: st[i] }); });
      done[part] += paint(document.getElementById(idOf(k)), items, st);
      all[part] += items.length;
    });
  }
  walk(D.weeks || {}, 0, function (k) { return k; }, function (x) { return part1(x[0]); });
  walk(D.labs || {}, 1, function (k) { return "lab-" + k; }, function (x) { return part2(x[0], x[3]); });

  function on(x) { return x.st > 0; }
  var s1 = order[0].some(on), s2 = order[1].some(on);
  if (!s1 && !s2) return;
  [0, 1].forEach(function (p) {
    var el = document.querySelector('.crs-pp[data-part="' + p + '"]');
    if (el) el.textContent = "Аяқталды: " + done[p] + " / " + all[p] + " сабақ";
  });
  var me = document.getElementById("crs-me");
  if (me) {
    me.hidden = false;
    me.textContent = "Сенің прогресің: 1-бөлім - " + done[0] + " / " + all[0] + " сабақ, 2-бөлім - " + done[1] + " / " + all[1] + " сабақ.";
  }
  // келесі қадам: бөлімдегі соңғы әрекеттен кейінгі бірінші аяқталмаған сабақ (болмаса - бөлімдегі бірінші аяқталмаған).
  // 1-бөлім басталып, әлі бітпесе - сонда (апталардағы 3D сілтемелері 2-бөлімге ерте апаруы мүмкін); әйтпесе 2-бөлім.
  function nextIn(list) {
    var last = -1, i;
    list.forEach(function (x, k) { if (on(x)) last = k; });
    for (i = Math.max(last, 0); i < list.length; i++) if (list[i].st !== 2) return list[i];
    for (i = 0; i < list.length; i++) if (list[i].st !== 2) return list[i];
    return null;
  }
  var next = s1 && done[0] < all[0] ? nextIn(order[0]) : nextIn(order[1]) || nextIn(order[0]);
  var go = document.getElementById("crs-go");
  if (go && next) { go.href = next.href; go.textContent = "Жалғастыру: " + next.title; }
  else if (go) { go.href = "#part2"; go.textContent = "Курс аяқталды: құттықтаймыз!"; }
})();
