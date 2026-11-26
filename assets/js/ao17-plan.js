/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 CS оқу кестесі (tools/academy/ao17plan.py -> academy/plan.html). Баптаулар: бастау күні, аптасына сағат, оқу күндері, уақыт.
   Қадамдар курстағы ретімен (сабақтар, апта сынағы, бөлім емтихандары) оқу кештеріне бөлінеді: бір кешке аптасына сағат / күн саны;
   кештен ұзақ сабақ келесі оқу күндерінің уақытын да алады, сондықтан аптасына сағат шегі сақталады.
   Прогресс тек осы браузерден: 1-бөлім «cs50kz:academy» (меңгерілген сабақ), 2-бөлім «ao17:lab3d» (барлық тест шешілген сабақ),
   сынақтар «ao17cs:exam» (70%+). Сақтау: «ao17cs:plan» - баптаулар (base - кесте құрылғанда орындалып қойған қадамдар),
   «ao17cs:plan-dates» - курс беті үшін оқу кештерінің күндері. Күнтізбе файлы (.ics) осы браузерде жасалады. */
(function () {
  "use strict";
  var KEY = "ao17cs:plan", CACHE = "ao17cs:plan-dates";
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  // күндер - жергілікті уақыттың түскі 12:00-і (жазғы уақытқа ауысу күнді жылжытпасын)
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3], 12); return d.getMonth() === +m[2] - 1 ? d : null; }
  function add(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function wd(d) { return ((d.getDay() + 6) % 7) + 1; }   // 1 - дүйсенбі ... 7 - жексенбі
  var MON = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
  var MS = ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"];
  var WD = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", "Сенбі", "Жексенбі"];
  var today = parse(ymd(new Date()));
  function fmt(d, year) { return (year || d.getFullYear() !== today.getFullYear() ? d.getFullYear() + " ж. " : "") + d.getDate() + " " + MON[d.getMonth()]; }
  function range(a, b) {
    if (a.getTime() === b.getTime()) return fmt(a);
    if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return (a.getFullYear() !== today.getFullYear() ? a.getFullYear() + " ж. " : "") + a.getDate() + "–" + b.getDate() + " " + MON[a.getMonth()];
    if (a.getFullYear() === b.getFullYear()) return fmt(a) + " – " + b.getDate() + " " + MON[b.getMonth()];   // жыл бір рет
    return fmt(a) + " – " + fmt(b);
  }
  function when(d) { var k = Math.round((d - today) / 864e5); return k === 0 ? "Бүгін" : k === 1 ? "Ертең" : WD[wd(d) - 1] + ", " + fmt(d); }

  var box = document.getElementById("plan-data"), root = document.querySelector("[data-plan]");
  if (!box || !root) return;
  var P;
  try { P = JSON.parse(box.textContent); } catch (e) { return; }

  var acad = obj(obj(J("cs50kz:academy", {})).lessons), lab = obj(J("ao17:lab3d", {})), ex = obj(J("ao17cs:exam", {}));
  function passed(k) { var r = obj(ex[k]); return typeof r.best === "number" && r.best >= P.pass; }
  function lessonDone(u, l) {
    if (u.part === 1) return !!obj(acad[l[0]]).mastered;
    var a = Array.isArray(lab[l[0]]) ? lab[l[0]] : [];
    return l[4] > 0 && a.filter(function (q) { return !/:(predict|contrast)$/.test(q); }).length >= l[4];
  }
  // кесте қадамдары курстағы ретімен: әр бірліктің сабақтары, апта сынағы, бөлім соңында емтихан
  var items = [];
  P.units.forEach(function (u, ui) {
    u.lessons.forEach(function (l) { items.push({ k: "l", key: "l:" + l[0], u: ui, href: l[1], t: l[2], m: l[3], done: lessonDone(u, l) }); });
    if (u.quiz) items.push({ k: "q", key: "q:" + u.id, u: ui, href: u.quiz, t: u.label + " сынағы", m: P.quizMin, done: passed(u.id) });
    P.exams.forEach(function (x) { if (x.after === ui) items.push({ k: "x", key: "x:" + x.id, u: ui, href: x.href, t: x.t, m: x.m, done: passed(x.id), ex: x.id }); });
  });
  var lessons = items.filter(function (it) { return it.k === "l"; });

  function load() {
    var s = obj(J(KEY, {}));
    var days = Array.isArray(s.days) ? s.days.filter(function (x, i, a) { return x === (x | 0) && x >= 1 && x <= 7 && a.indexOf(x) === i; }) : [];
    var st = {
      start: parse(s.start) ? s.start : ymd(today),
      hours: P.hours.indexOf(s.hours) >= 0 ? s.hours : 5,
      days: days.length ? days.sort(function (a, b) { return a - b; }) : [1, 2, 3, 4, 5],
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time) ? s.time : "19:00",
      base: Array.isArray(s.base) ? s.base.filter(function (k) { return typeof k === "string"; }) : []
    };
    if (Math.abs(parse(st.start) - today) > 3 * 366 * 864e5) st.start = ymd(today);   // қате енгізілген жыл
    return st;
  }

  // кесте: қадамдар оқу кештеріне (бір кеш - cap минут), кештер таңдалған күндерге
  function build(st) {
    var base = {};
    st.base.forEach(function (k) { base[k] = 1; });
    var cap = Math.max(20, Math.round((st.hours * 60) / st.days.length));
    var sessions = [], cur = null, d = parse(st.start);
    items.forEach(function (it) {
      if (base[it.key]) return;
      if (!cur || (cur.m + it.m > cap && cur.items.length)) {
        // бір кештен ұзақ сабақ келесі оқу күндерінің уақытын да алады: апталық сағат шегі сақталады
        if (cur) for (var k = Math.max(1, Math.round(cur.m / cap)) - 1; k > 0; k--) { while (st.days.indexOf(wd(d)) < 0) d = add(d, 1); d = add(d, 1); }
        while (st.days.indexOf(wd(d)) < 0) d = add(d, 1);
        cur = { date: d, items: [], m: 0 };
        sessions.push(cur);
        d = add(d, 1);
      }
      cur.items.push(it);
      cur.m += it.m;
    });
    var span = {};
    sessions.forEach(function (s) { s.items.forEach(function (it) { var x = span[it.u] = span[it.u] || { a: s.date, b: s.date }; x.b = s.date; }); });
    return { sessions: sessions, cap: cap, span: span, base: base, start: parse(st.start), end: sessions.length ? sessions[sessions.length - 1].date : parse(st.start) };
  }
  function status(pl) {
    var done = lessons.filter(function (it) { return it.done; }).length;
    var exp = lessons.filter(function (it) { return pl.base[it.key]; }).length;
    pl.sessions.forEach(function (s) { if (s.date < today) s.items.forEach(function (it) { if (it.k === "l") exp++; }); });
    return { done: done, exp: exp, diff: done - exp, all: lessons.length };
  }
  // келесі кештің мазмұны нақты прогреске қарай: орындалмаған алғашқы қадамдар, бір кештің уақытына сыйғанынша
  function upNext(cap) {
    var out = [], m = 0;
    for (var i = 0; i < items.length && out.length < 12; i++) {
      var it = items[i];
      if (it.done) continue;
      if (out.length && m + it.m > cap) break;
      out.push(it);
      m += it.m;
    }
    return out;
  }

  var form = root.querySelector("[data-plan-form]");
  var st = load();
  function fill() {
    form.elements.start.value = st.start;
    form.elements.time.value = st.time;
    Array.prototype.forEach.call(form.querySelectorAll('input[name="hours"]'), function (r) { r.checked = Number(r.value) === st.hours; });
    Array.prototype.forEach.call(form.querySelectorAll('input[name="days"]'), function (c) { c.checked = st.days.indexOf(Number(c.value)) >= 0; });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "start" && parse(t.value)) st.start = t.value;
    if (t.name === "time" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t.value)) st.time = t.value;
    if (t.name === "hours") st.hours = Number(t.value);
    if (t.name === "days") {
      var on = Array.prototype.filter.call(form.querySelectorAll('input[name="days"]'), function (c) { return c.checked; }).map(function (c) { return Number(c.value); });
      if (!on.length) { t.checked = true; return; }   // кемінде бір оқу күні
      st.days = on;
    }
    save(); render();
  });
  function save() { S(KEY, st); }

  var unitOf = function (it) { return P.units[it.u]; };
  function tag(it) { var u = unitOf(it); return '<span class="pl-tag p' + u.part + '">' + esc(it.k === "l" ? (u.part === 1 ? u.label : u.label.split(" ")[0]) : it.k === "q" ? "сынақ" : "емтихан") + "</span>"; }

  function render() {
    fill();
    var pl = build(st), s = status(pl);
    var weeks = Math.max(1, Math.ceil((Math.round((pl.end - pl.start) / 864e5) + 1) / 7));
    var sum = root.querySelector("[data-plan-sum]");
    sum.innerHTML = pl.sessions.length
      ? "Аяқталу күні: <b>" + esc(fmt(pl.end, true)) + "</b> · " + weeks + " апта · " + pl.sessions.length + " оқу кеші · кешіне ≈" + pl.cap + " минут"
      : "Курстың барлық қадамы орындалған.";
    ribbon(pl);
    next(pl, s);
    agenda(pl);
    S(CACHE, { v: 1, time: st.time, dates: pl.sessions.map(function (x) { return ymd(x.date); }), end: ymd(pl.end) });
  }

  // ------------------------------------------------------------------ таспа: курс күнтізбеде (бір пиксель - бір пиксель, мәтін әр енде оқылады)
  function ribbon(pl) {
    var fig = root.querySelector("[data-plan-rib]");
    var W = Math.max(300, Math.round(fig.clientWidth || 760)), H = 128, L = 2, R = 2, y = 52, h = 30;
    var a = pl.start, b = add(pl.end, 1), span = Math.max(864e5, b - a);
    function X(d) { return L + (W - L - R) * Math.min(1, Math.max(0, (d - a) / span)); }
    var out = [];
    // ай белгілері
    var m = new Date(a.getFullYear(), a.getMonth() + 1, 1, 12), last = -99;
    out.push('<text class="pl-mt" x="' + L + '" y="' + (y + h + 24) + '">' + esc(a.getDate() + " " + MS[a.getMonth()]) + "</text>");
    last = L + 44;
    while (m < b) {
      var x = X(m);
      out.push('<line class="pl-tk" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (y + h + 4) + '" y2="' + (y + h + 12) + '"/>');
      if (x - last > 34 && W - x > 30) { out.push('<text class="pl-mt" x="' + (x + 3).toFixed(1) + '" y="' + (y + h + 24) + '">' + MS[m.getMonth()] + (m.getMonth() === 0 ? " " + m.getFullYear() : "") + "</text>"); last = x + (m.getMonth() === 0 ? 62 : 30); }
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1, 12);
    }
    // бөлімдер
    var first2 = null;
    P.units.forEach(function (u, ui) { if (u.part === 2 && first2 == null && pl.span[ui]) first2 = ui; });
    var first1 = pl.span[0] ? 0 : null;
    if (first1 != null) out.push('<text class="pl-pt p1" x="' + X(pl.span[0].a).toFixed(1) + '" y="' + (y - 10) + '">1-бөлім</text>');
    if (first2 != null && (first1 == null || X(pl.span[first2].a) - X(pl.span[0].a) > 70)) out.push('<text class="pl-pt p2" x="' + X(pl.span[first2].a).toFixed(1) + '" y="' + (y - 10) + '">2-бөлім</text>');
    // бірліктер: таспа үзіліссіз - бірлік келесі бірлік басталғанша созылады (арадағы демалыс күндері де соған кіреді)
    var order = [];
    P.units.forEach(function (u, ui) { if (pl.span[ui]) order.push(ui); });
    P.units.forEach(function (u, ui) {
      var sp = pl.span[ui];
      if (!sp) return;
      var nx = order[order.indexOf(ui) + 1];
      var x1 = X(sp.a), x2 = nx != null ? X(pl.span[nx].a) : X(add(sp.b, 1)), w = Math.max(2, x2 - x1 - 1.5);
      var ls = lessons.filter(function (it) { return it.u === ui; }), f = ls.filter(function (it) { return it.done; }).length / ls.length;
      out.push('<g class="pl-seg p' + u.part + (f === 1 ? " full" : "") + '" style="--i:' + ui + '"><title>' + esc(u.label + ": " + u.name + ", " + range(sp.a, sp.b)) + "</title>"
        + '<rect class="bg" x="' + x1.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="3"/>'
        + (f > 0 ? '<rect class="fg" x="' + x1.toFixed(1) + '" y="' + y + '" width="' + Math.max(2, w * f).toFixed(1) + '" height="' + h + '" rx="3"/>' : "")
        + (w >= 17 ? '<text class="pl-sn" x="' + (x1 + w / 2).toFixed(1) + '" y="' + (y + h / 2 + 4) + '">' + u.n + "</text>" : "") + "</g>");
    });
    // емтихандар
    pl.sessions.forEach(function (s2) {
      s2.items.forEach(function (it) {
        if (it.k !== "x") return;
        var x = Math.min(W - R - 8, Math.max(L + 8, X(s2.date) + 3));
        out.push('<g class="pl-ex' + (it.done ? " done" : "") + '" style="--i:' + it.u + '"><title>' + esc(it.t + ": " + fmt(s2.date)) + '</title><rect x="' + (x - 5).toFixed(1) + '" y="' + (y - 7) + '" width="10" height="10" transform="rotate(45 ' + x.toFixed(1) + " " + (y - 2) + ')"/></g>');
      });
    });
    // бүгін
    if (today >= a && today < b) {
      var tx = X(today);
      out.push('<g class="pl-today"><line x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (y - 30) + '" y2="' + (y + h + 4) + '"/><text x="' + tx.toFixed(1) + '" y="' + (y - 34) + '" text-anchor="' + (tx < 30 ? "start" : tx > W - 30 ? "end" : "middle") + '">бүгін</text></g>');
    }
    var desc = "Кесте " + fmt(pl.start, true) + " басталып, " + fmt(pl.end, true) + " аяқталады. Қызыл - 1-бөлімнің апталары, көк - 2-бөлімнің зертханалары, ромб - емтихан, толтырылған бөлігі - аяқталған сабақтар.";
    fig.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="pl-rib-t pl-rib-d"><title id="pl-rib-t">Курс таспасы</title><desc id="pl-rib-d">' + esc(desc) + "</desc>" + out.join("") + "</svg>"
      + '<figcaption class="pl-leg"><span class="pl-li"><span class="k p1"></span>1-бөлім: 12 апта</span><span class="pl-li"><span class="k p2"></span>2-бөлім: 11 зертхана</span>'
      + '<span class="pl-li"><span class="k x"></span>емтихан</span><span class="pl-li"><span class="k t"></span>бүгін</span></figcaption>';
  }

  // ------------------------------------------------------------------ келесі оқу кеші
  function next(pl, s) {
    var el = root.querySelector("[data-plan-next]");
    var upcoming = null;
    for (var i = 0; i < pl.sessions.length; i++) if (pl.sessions[i].date >= today) { upcoming = pl.sessions[i]; break; }
    var todo = upNext(pl.cap);
    if (!todo.length) {
      el.innerHTML = '<p class="pl-st ok">Курстың барлық сабағы мен емтиханы орындалды. Құттықтаймыз!</p><p><a class="btn gold" href="certificate.html">Сертификат</a></p>';
      return;
    }
    var before = pl.start > today;
    var st1 = before ? { c: "", t: "Кесте " + fmt(pl.start) + " басталады." }
      : s.diff >= 3 ? { c: "ok", t: "Кестеден " + s.diff + " сабаққа алдасың." }
      : s.diff <= -3 ? { c: "bad", t: "Кестеден " + -s.diff + " сабақ артта қалдың." }
      : { c: "ok", t: "Кесте бойынша келе жатырсың." };
    var mins = todo.reduce(function (n, it) { return n + it.m; }, 0);
    var html = '<p class="pl-when">' + (upcoming ? "<b>" + esc(when(upcoming.date)) + "</b>, " + esc(st.time) : "<b>Кесте бітті</b>: курс әлі аяқталған жоқ") + " · ≈" + mins + " минут</p>"
      + '<p class="pl-st ' + st1.c + '">' + esc(st1.t) + " Аяқталған сабақ: " + s.done + " / " + s.all + ".</p>"
      + '<ol class="pl-items">' + todo.map(function (it) { return "<li>" + tag(it) + '<a href="' + esc(it.href) + '">' + esc(it.t) + "</a><small>" + it.m + " мин</small></li>"; }).join("") + "</ol>"
      + '<p class="pl-acts"><a class="btn gold" href="' + esc(todo[0].href) + '">Бастау</a>'
      + (!before && (s.diff <= -3 || !upcoming) ? ' <button class="btn secondary" type="button" data-plan-replan>Кестені бүгіннен қайта құру</button>' : "") + "</p>";
    el.innerHTML = html;
    var rb = el.querySelector("[data-plan-replan]");
    if (rb) rb.addEventListener("click", function () {
      st.start = ymd(today);
      st.base = items.filter(function (it) { return it.done; }).map(function (it) { return it.key; });
      save(); render();
      el.setAttribute("tabindex", "-1");   // жаңа кесте шыққанын экран оқу құралы да білсін: фокус карточкада
      el.focus({ preventScroll: true });
    });
  }

  // ------------------------------------------------------------------ бірліктер тізімі
  function agenda(pl) {
    var box2 = root.querySelector("[data-plan-list]");
    var parts = { 1: [], 2: [] };
    var exAt = {};
    pl.sessions.forEach(function (s2) { s2.items.forEach(function (it) { if (it.k === "x") exAt[it.ex] = s2.date; }); });
    P.units.forEach(function (u, ui) {
      var ls = lessons.filter(function (it) { return it.u === ui; }), d = ls.filter(function (it) { return it.done; }).length;
      var sp = pl.span[ui];
      var now = sp && sp.a <= today && today <= sp.b;
      var cls = "pl-u p" + u.part + (d === ls.length ? " is-done" : now ? " is-now" : "");
      parts[u.part].push('<li class="' + cls + '"><span class="pl-un" aria-hidden="true">' + u.n + "</span>"
        + '<div class="pl-ub"><a href="' + esc(u.href) + '">' + esc(u.name) + "</a><p>" + esc(u.label) + " · " + ls.length + " сабақ" + (u.quiz ? " · апта сынағы" : "") + (now ? ' · <b>қазір</b>' : "") + "</p></div>"
        + '<p class="pl-ud">' + (sp ? esc(range(sp.a, sp.b)) : "орындалған") + "</p>"
        + '<p class="pl-up"><span class="sr-only">Аяқталған сабақ: </span>' + d + " / " + ls.length + "</p></li>");
      P.exams.forEach(function (x) {
        if (x.after !== ui) return;
        parts[u.part].push('<li class="pl-xr' + (passed(x.id) ? " is-done" : "") + '"><span class="pl-xi" aria-hidden="true"></span><div class="pl-ub"><a href="' + esc(x.href) + '">' + esc(x.t) + "</a><p>" + x.m + " минут · өту шегі " + P.pass + "%</p></div>"
          + '<p class="pl-ud">' + (exAt[x.id] ? esc(fmt(exAt[x.id])) : passed(x.id) ? "тапсырылған" : "") + '</p><p class="pl-up">' + (passed(x.id) ? esc(obj(ex[x.id]).best + "%") : "") + "</p></li>");
      });
    });
    box2.innerHTML = '<h3>1-бөлім: Негіз</h3><ol class="pl-ol">' + parts[1].join("") + "</ol>"
      + '<h3>2-бөлім: Технологияның ішінен</h3><ol class="pl-ol">' + parts[2].join("") + "</ol>";
  }

  // ------------------------------------------------------------------ күнтізбе файлы (RFC 5545): CRLF, 75 октеттен бүктеу, мәтінді escape
  function icsText(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function octets(ch) { var c = ch.codePointAt(0); return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; }
  function fold(line) {
    var out = [], cur = "", n = 0;
    Array.from(line).forEach(function (ch) {
      var b = octets(ch);
      if (n + b > 75) { out.push(cur); cur = " "; n = 1; }
      cur += ch; n += b;
    });
    out.push(cur);
    return out.join("\r\n");
  }
  function stamp(d, hm, plus) {
    var p = hm.split(":"), x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +p[0], +p[1] + (plus || 0));
    return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + "T" + pad(x.getHours()) + pad(x.getMinutes()) + "00";
  }
  function ics() {
    var pl = build(st), now = new Date();
    var utc = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + "T" + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + "Z";
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AO17//AO17 CS оқу кестесі//KK", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + icsText("AO17 CS оқу кестесі")];
    var n = 0;
    pl.sessions.forEach(function (s2, k) {
      if (s2.date < today) return;
      n++;
      var u = P.units[s2.items[0].u], q = s2.items.filter(function (it) { return it.k !== "l"; }), nl = s2.items.length - q.length;
      var title = "AO17 CS: " + (u.part === 1 ? u.label + ", " + u.name : u.label) + (nl ? " · " + nl + " сабақ" : "") + (q.length ? " · " + q.map(function (it) { return it.t; }).join(", ") : "");
      var desc = s2.items.map(function (it) { return "• " + it.t + " (" + it.m + " мин): " + new URL(it.href, location.href).href; }).join("\n");
      L.push("BEGIN:VEVENT", "UID:ao17cs-" + st.start.replace(/-/g, "") + "-" + k + "@" + (location.hostname || "ao17.local"), "DTSTAMP:" + utc,
        "DTSTART:" + stamp(s2.date, st.time), "DTEND:" + stamp(s2.date, st.time, Math.max(20, s2.m)),
        "SUMMARY:" + icsText(title), "DESCRIPTION:" + icsText(desc), "URL:" + new URL(s2.items[0].href, location.href).href,
        "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT15M", "DESCRIPTION:" + icsText("AO17 CS: оқу кеші 15 минуттан кейін басталады"), "END:VALARM", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    return { text: L.map(fold).join("\r\n") + "\r\n", events: n };
  }
  root.querySelector("[data-plan-ics]").addEventListener("click", function () {
    var f = ics();
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([f.text], { type: "text/calendar;charset=utf-8" }));
    a.download = "ao17-cs-kestesi.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    save();
    if (window.CS50KZ && typeof window.CS50KZ.mark === "function") window.CS50KZ.mark("ao17plan");   // «Жоспарлы оқушы» жетістігі
  });

  // бірінші сурет: таспа солдан оңға өседі (ao17-motion.css), кейінгі өзгерістерде қайталанбайды
  var rib = root.querySelector("[data-plan-rib]");
  if (rib && window.AO17Reveal && !window.AO17Reveal.still) { rib.classList.add("ao-first"); setTimeout(function () { rib.classList.remove("ao-first"); }, 3200); }
  var rt = null;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { ribbon(build(st)); }, 150); });
  save();
  render();
})();
