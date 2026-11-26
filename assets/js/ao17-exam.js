/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 CS бағалау жүйесі (tools/academy/ao17exam.py):
   academy/exam.html - ?w=N апта сынағы (8 сұрақ, жауаптан кейін бірден түсіндірме), ?part=1|2 бөлім емтиханы (30 мин),
   режимсіз - қорытынды емтихан (36 сұрақ: әр аптадан 2, әр зертханадан 1 және тағы 1; 45 мин). Өту шегі 70%.
   academy/certificate.html - қорытынды емтиханда 70%+ болса, атың жазылған сертификат (басып шығару / PDF).
   Сақтау (осы браузер): «ao17cs:exam» - {режим: {best, last, at, bestAt, runs}}, «ao17cs:exam-run» - тоқтаған сынақ. */
(function () {
  "use strict";
  var KEY = "ao17cs:exam", RUN = "ao17cs:exam-run", NAME = "ao17cs:name";
  function J(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function S(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* сақтау қолжетімсіз */ } }
  function D(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
  function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mmss(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var LETTERS = "ABCDEF";

  var root = document.querySelector("[data-ax]");
  if (root) exam(root);
  var cert = document.querySelector("[data-cert]");
  if (cert) certificate(cert);

  // ------------------------------------------------------------------ емтихан
  function exam(root) {
    var B;
    try { B = JSON.parse(document.getElementById("xm-bank").textContent); } catch (e) { return; }
    var byId = {}, byTopic = {};
    B.items.forEach(function (it) { byId[it.id] = it; (byTopic[it.t] = byTopic[it.t] || []).push(it); });
    var weeks = Object.keys(B.topics).filter(function (t) { return B.topics[t].part === 1; });
    var labs = Object.keys(B.topics).filter(function (t) { return B.topics[t].part === 2; });
    var qs = new URLSearchParams(location.search);
    var w = parseInt(qs.get("w"), 10), part = qs.get("part");
    var mode = B.topics["w" + w] ? "w" + w : part === "1" ? "p1" : part === "2" ? "p2" : "final";
    var M = {
      final: { title: "Қорытынды емтихан", kicker: "AO17 CS · бағалау", min: 45, fb: false,
        lede: "Курстың екі бөлімінен 36 сұрақ: әр аптадан екі, әр зертханадан бір. 45 минут. Өту шегі " + B.pass + "%, ал нәтижең сертификатты ашады." },
      p1: { title: "1-бөлім емтиханы", kicker: "AO17 CS · 1-бөлім", min: 30, fb: false, lede: "12 аптаның әрқайсысынан екі сұрақ, 24 сұрақ, 30 минут. Өту шегі " + B.pass + "%." },
      p2: { title: "2-бөлім емтиханы", kicker: "AO17 CS · 2-бөлім", min: 30, fb: false, lede: "11 зертхананың әрқайсысынан екі сұрақ, 22 сұрақ, 30 минут. Өту шегі " + B.pass + "%." }
    }[mode] || { title: B.topics[mode].name.replace(":", " сынағы:"), kicker: "AO17 CS · апта сынағы", min: 0, fb: true,
      lede: "Аптаның сабақтарынан алты сұрақ және сол аптада қолданылатын 3D зертханадан екі сұрақ. Уақыт шектелмейді, әр жауаптан кейін түсіндірмесі шығады." };
    var stage = root.querySelector("[data-ax-stage]");
    function set(sel, t) { var x = root.querySelector(sel); if (x) x.textContent = t; }
    set("[data-ax-title]", M.title); set("[data-ax-kicker]", M.kicker); set("[data-ax-lede]", M.lede); set("[data-ax-crumb]", M.title);
    document.title = M.title + " - AO17 CS";
    root.querySelectorAll("[data-mode]").forEach(function (a) { if (a.getAttribute("data-mode") === mode) { a.classList.add("on"); a.setAttribute("aria-current", "page"); } });
    var sel = root.querySelector("[data-ax-week]");
    if (sel) {
      if (mode.charAt(0) === "w") sel.value = mode.slice(1);
      sel.addEventListener("change", function () { if (sel.value) location.href = "exam.html?w=" + sel.value; });
    }
    var res = obj(J(KEY, {}));
    var rules = root.querySelector("[data-ax-rules]");
    if (rules) {
      var n = count();
      var prev = obj(res[mode]);
      rules.innerHTML = "<li><b>" + n + "</b> сұрақ</li><li><b>" + (M.min ? M.min + " мин" : "шексіз") + "</b> уақыт</li><li><b>" + B.pass + "%</b> өту шегі</li>"
        + (prev.best != null ? "<li><b>" + prev.best + "%</b> ең жақсы нәтижең</li>" : "");
    }
    var run = obj(J(RUN, null));
    var startBtn = root.querySelector("[data-ax-start]");
    // тоқтаған сынақ: уақыты бітпесе - жалғастыру; бітсе - берілген жауаптар бойынша бағалау (жауаптар жоғалмайды)
    if (run.mode === mode && fresh(run)) {
      var done = Object.keys(obj(run.ans)).length;
      var cont = el("button", "btn gold", expired(run) ? "Уақыт бітті: нәтижесін көру (" + done + " / " + run.qs.length + " жауап)"
        : "Жалғастыру (" + done + " / " + run.qs.length + ")");
      cont.type = "button";
      cont.addEventListener("click", function () { show(run); });
      startBtn.parentNode.insertBefore(cont, startBtn);
      startBtn.textContent = "Жаңадан бастау";
      startBtn.classList.remove("gold"); startBtn.classList.add("secondary");
    }
    startBtn.addEventListener("click", function () {
      run = { mode: mode, qs: build(), ans: {}, i: 0, start: Date.now(), limit: M.min * 60000 };
      S(RUN, run);
      show(run);
    });

    function count() { return mode === "final" ? weeks.length * 2 + labs.length + 1 : mode === "p1" ? weeks.length * 2 : mode === "p2" ? labs.length * 2 : 8; }
    function expired(r) { return r.limit && Date.now() - r.start > r.limit + 60000; }
    // сақталған сынақтың әр сұрағы қазіргі қорда бар және нұсқа саны сол күйі (сайт жаңарғанда қор өзгеруі мүмкін)
    function fresh(r) {
      return Array.isArray(r.qs) && r.qs.length > 0 && typeof r.i === "number" && r.qs.every(function (q) {
        var it = q && byId[q.id];
        return it && (it.k !== "mc" || (Array.isArray(q.p) && q.p.length === it.o.length));
      });
    }
    function pick(arr, k, used) {
      var out = shuffle((arr || []).filter(function (x) { return !used[x.id]; })).slice(0, k);
      out.forEach(function (x) { used[x.id] = 1; });
      return out;
    }
    function build() {
      var used = {}, list = [];
      if (mode === "final") {
        weeks.forEach(function (t) { list = list.concat(pick(byTopic[t], 2, used)); });
        labs.forEach(function (t) { list = list.concat(pick(byTopic[t], 1, used)); });
        list = list.concat(pick([].concat.apply([], labs.map(function (t) { return byTopic[t]; })), 1, used));
      } else if (mode === "p1") weeks.forEach(function (t) { list = list.concat(pick(byTopic[t], 2, used)); });
      else if (mode === "p2") labs.forEach(function (t) { list = list.concat(pick(byTopic[t], 2, used)); });
      else {
        list = pick(byTopic[mode], 6, used);
        var wl = B.weekLabs[mode] || [];
        var l3 = B.items.filter(function (it) { return it.l && wl.indexOf(it.l) >= 0; });
        list = list.concat(pick(l3.length >= 2 ? l3 : byTopic[mode], 2, used));
      }
      return shuffle(list).map(function (it) { return { id: it.id, p: it.k === "mc" ? shuffle(it.o.map(function (_, i) { return i; })) : null }; });
    }
    function right(q, v) {
      var it = byId[q.id];
      if (!it || v == null || v === "") return false;
      if (it.k === "num") return Math.abs(Number(v) - Number(it.a)) < 1e-9;
      return q.p[Number(v)] === it.a;
    }

    var timer = null;
    function show(r) {
      run = r;
      run.ans = obj(run.ans);
      root.classList.add("xm-running");
      if (timer) clearInterval(timer);
      if (r.limit) timer = setInterval(tick, 1000);
      draw();
    }
    function tick() {
      var left = run.limit - (Date.now() - run.start);
      var t = stage.querySelector("[data-ax-time]");
      if (t) { t.textContent = mmss(left); t.classList.toggle("low", left < 5 * 60000); }
      if (left <= 0) finish();
    }
    function save() { S(RUN, run); }
    function draw() {
      var keep = stage.contains(document.activeElement);   // пернетақтамен жүрген оқушының фокусы карточкада қалады
      run.i = Math.max(0, Math.min(run.qs.length - 1, run.i | 0));
      var q = run.qs[run.i], it = byId[q.id];
      var topic = B.topics[it.t] || { name: "" };
      var card = el("div", "xm-card xm-q");
      var top = el("div", "xm-top");
      top.appendChild(el("span", "xm-count", "<b>" + (run.i + 1) + "</b> / " + run.qs.length));
      top.appendChild(el("span", "xm-topic" + (topic.part === 2 ? " p2" : ""))).textContent = topic.name;
      if (run.limit) { var tm = el("span", "xm-time"); tm.setAttribute("data-ax-time", ""); tm.setAttribute("role", "timer"); top.appendChild(tm); }
      card.appendChild(top);
      var bar = el("div", "xm-bar"); bar.appendChild(el("i")).style.width = Math.round((Object.keys(run.ans).length / run.qs.length) * 100) + "%";
      card.appendChild(bar);
      var qt = el("p", "xm-qt", it.q); qt.id = "xm-qt";
      card.appendChild(qt);
      var cur = run.ans[run.i];
      var locked = M.fb && cur != null;
      if (it.k === "mc") {
        var opts = el("div", "xm-opts"); opts.setAttribute("role", "radiogroup"); opts.setAttribute("aria-labelledby", "xm-qt");
        q.p.forEach(function (orig, k) {
          var b = el("button", "xm-opt", '<span class="xm-l" aria-hidden="true">' + LETTERS[k] + "</span><span>" + it.o[orig] + "</span>");
          b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(String(cur) === String(k)));
          if (String(cur) === String(k)) b.classList.add("on");
          if (locked) { b.disabled = true; if (orig === it.a) b.classList.add("ok"); else if (String(cur) === String(k)) b.classList.add("bad"); }
          b.addEventListener("click", function () { answer(k); });
          opts.appendChild(b);
        });
        card.appendChild(opts);
      } else {
        var lab = el("label", "xm-num", "<span>Жауап (сан)</span>");
        var inp = el("input"); inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off"; inp.value = cur != null ? cur : "";
        inp.setAttribute("aria-describedby", "xm-qt");
        if (locked) inp.disabled = true;
        inp.addEventListener("input", function () { if (!M.fb) { var v = inp.value.trim().replace(",", "."); if (v === "") delete run.ans[run.i]; else run.ans[run.i] = v; save(); updBar(); } });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); if (M.fb && !locked) answer(inp.value.trim().replace(",", ".")); else go(1); } });
        lab.appendChild(inp);
        card.appendChild(lab);
        if (M.fb && !locked) { var chk = el("button", "btn secondary xm-check", "Тексеру"); chk.type = "button"; chk.addEventListener("click", function () { answer(inp.value.trim().replace(",", ".")); }); card.appendChild(chk); }
      }
      var fb = el("div", "xm-fb"); fb.setAttribute("aria-live", "polite");
      if (locked) {
        var ok = right(q, cur);
        fb.className = "xm-fb " + (ok ? "ok" : "bad");
        fb.innerHTML = "<b>" + (ok ? "Дұрыс!" : "Қате.") + "</b> " + (ok ? "" : "Дұрыс жауап: " + (it.k === "mc" ? it.o[it.a] : String(it.a)) + ". ")
          + (it.w && !ok && it.k === "mc" && it.w[q.p[Number(cur)]] ? '<span class="xm-why">' + it.w[q.p[Number(cur)]] + "</span> " : "")
          + (it.x ? '<span class="xm-x">' + it.x + "</span>" : "");
      }
      card.appendChild(fb);
      var nav = el("div", "xm-nav");
      var prev = el("button", "btn secondary", "Алдыңғы"); prev.type = "button"; prev.disabled = run.i === 0; prev.addEventListener("click", function () { go(-1); });
      var last = run.i === run.qs.length - 1;
      var next = el("button", "btn gold", last ? "Аяқтау" : "Келесі"); next.type = "button";
      next.addEventListener("click", function () { if (last) finish(true); else go(1); });
      nav.appendChild(prev); nav.appendChild(next);
      var dots = el("div", "xm-dots"); dots.setAttribute("aria-label", "Сұрақтар");
      run.qs.forEach(function (_, k) {
        var d = el("button", "xm-dot" + (run.ans[k] != null ? " done" : "") + (k === run.i ? " cur" : ""), String(k + 1));
        d.type = "button"; d.setAttribute("aria-label", (k + 1) + "-сұрақ" + (run.ans[k] != null ? ", жауап берілді" : ""));
        if (k === run.i) d.setAttribute("aria-current", "step");
        d.addEventListener("click", function () { run.i = k; save(); draw(); });
        dots.appendChild(d);
      });
      card.appendChild(nav); card.appendChild(dots);
      stage.innerHTML = "";
      stage.appendChild(card);
      if (run.limit) tick();
      var focus = card.querySelector(".xm-opt.on, .xm-opt:not([disabled]), .xm-num input:not([disabled])") || next;
      if (keep || document.activeElement === document.body) focus.focus({ preventScroll: true });
    }
    function updBar() { var b = stage.querySelector(".xm-bar i"); if (b) b.style.width = Math.round((Object.keys(run.ans).length / run.qs.length) * 100) + "%"; }
    function answer(v) {
      if (v == null || v === "") return;
      if (M.fb && run.ans[run.i] != null) return;
      run.ans[run.i] = v; save(); draw();
    }
    function go(d) {
      run.i = Math.max(0, Math.min(run.qs.length - 1, run.i + d)); save(); draw();
      if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ block: "start" });
    }
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("xm-running") || !run || run.doneAt || e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.altKey || e.ctrlKey || e.metaKey) return;
      var k = "1234".indexOf(e.key) >= 0 ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase());
      var it = byId[run.qs[run.i].id];
      if (k >= 0 && it && it.k === "mc" && k < it.o.length) { e.preventDefault(); answer(k); }
    });
    function finish(ask) {
      var miss = run.qs.length - Object.keys(run.ans).length;
      if (ask && miss > 0 && !window.confirm(miss + " сұраққа жауап берілмеді. Аяқтаймыз ба?")) return;
      if (timer) clearInterval(timer);
      run.doneAt = Date.now();
      var ok = 0, per = {}, wrong = [];
      run.qs.forEach(function (q, k) {
        var it = byId[q.id]; if (!it) return;
        var p = per[it.t] = per[it.t] || { ok: 0, n: 0 };
        p.n++;
        if (right(q, run.ans[k])) { ok++; p.ok++; } else wrong.push({ q: q, it: it, v: run.ans[k] });
      });
      var pct = Math.round((ok / run.qs.length) * 100);
      res = obj(J(KEY, {}));
      var r = obj(res[mode]);
      var best = Math.max(r.best || 0, pct);
      res[mode] = { best: best, last: pct, at: run.doneAt, bestAt: pct >= (r.best || 0) ? run.doneAt : (r.bestAt || r.at), runs: (r.runs || 0) + 1 };
      S(KEY, res);
      D(RUN);
      root.classList.remove("xm-running");
      result(pct, ok, per, wrong, best);
    }
    function result(pct, ok, per, wrong, best) {
      var pass = pct >= B.pass;
      var card = el("div", "xm-card xm-res");
      var C = 2 * Math.PI * 52;
      card.innerHTML = '<div class="xm-score ' + (pass ? "ok" : "bad") + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="tr"/>'
        + (pct > 0 ? '<circle cx="60" cy="60" r="52" class="va" stroke-dasharray="' + (C * pct / 100).toFixed(1) + " " + C.toFixed(1) + '"/>' : "") + "</svg>"
        + "<p><b>" + pct + "%</b><span>" + ok + " / " + run.qs.length + "</span></p></div>"
        + '<p class="xm-verdict ' + (pass ? "ok" : "bad") + '">' + (pct >= 90 ? "Үздік нәтиже!" : pass ? "Өттің!" : "Өту шегі " + B.pass + "%: тақырыптарды қайталап, қайта тапсыр.") + "</p>"
        + '<p class="xm-meta">Уақыт: ' + mmss(run.limit ? Math.min(run.doneAt - run.start, run.limit) : run.doneAt - run.start) + " · ең жақсы нәтижең: " + best + "%</p>";
      var topics = el("ul", "xm-topics");
      Object.keys(per).sort(function (a, b) { return (B.topics[a].part - B.topics[b].part) || (weeks.indexOf(a) - weeks.indexOf(b)) || (labs.indexOf(a) - labs.indexOf(b)); }).forEach(function (t) {
        var p = per[t], f = Math.round((p.ok / p.n) * 100);
        var li = el("li", f === 100 ? "full" : f === 0 ? "zero" : "");
        var a = el("a"); a.href = B.topics[t].href; a.textContent = B.topics[t].name;
        li.appendChild(a);
        li.appendChild(el("span", "xm-tb" + (B.topics[t].part === 2 ? " p2" : ""), '<i style="width:' + f + '%"></i>'));
        li.appendChild(el("b", "", p.ok + " / " + p.n));
        topics.appendChild(li);
      });
      card.appendChild(el("h2", "", "Тақырыптар бойынша"));
      card.appendChild(topics);
      if (wrong.length) {
        card.appendChild(el("h2", "", "Қателер мен түсіндірмелер (" + wrong.length + ")"));
        var ol = el("ol", "xm-wrong");
        wrong.forEach(function (x) {
          var mine = x.v == null || x.v === "" ? "<i>жауап берілмеді</i>" : x.it.k === "mc" ? x.it.o[x.q.p[Number(x.v)]] : String(x.v).replace(/[<>&"]/g, "");
          var why = x.it.w && x.it.k === "mc" && x.v != null && x.v !== "" ? x.it.w[x.q.p[Number(x.v)]] : "";
          var li = el("li", "", '<p class="xm-qt">' + x.it.q + "</p>"
            + '<p class="xm-mine">Сенің жауабың: ' + mine + "</p>"
            + '<p class="xm-good">Дұрыс жауап: ' + (x.it.k === "mc" ? x.it.o[x.it.a] : String(x.it.a)) + "</p>"
            + (why ? '<p class="xm-why">' + why + "</p>" : "") + (x.it.x ? '<p class="xm-x">' + x.it.x + "</p>" : ""));
          var a = el("a", "xm-back"); a.href = x.it.h; a.textContent = "Сабаққа оралу";
          li.appendChild(a);
          ol.appendChild(li);
        });
        card.appendChild(ol);
      }
      var acts = el("p", "xm-acts");
      var again = el("a", "btn " + (pass ? "secondary" : "gold"), "Қайта тапсыру"); again.href = location.pathname + location.search;
      acts.appendChild(again);
      if (mode === "final" && best >= B.pass) { var c = el("a", "btn gold", "Сертификатты алу"); c.href = "certificate.html"; acts.insertBefore(c, again); }
      var back = el("a", "btn secondary", "Курс бетіне"); back.href = "course.html" + (mode.charAt(0) === "w" ? "#" + mode : "");
      acts.appendChild(back);
      card.appendChild(acts);
      stage.innerHTML = "";
      stage.appendChild(card);
      card.setAttribute("tabindex", "-1");
      card.focus({ preventScroll: true });
      if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ block: "start" });
    }
  }

  // ------------------------------------------------------------------ сертификат
  function certificate(root) {
    var C;
    try { C = JSON.parse(document.getElementById("cert-data").textContent); } catch (e) { return; }
    var fin = obj(obj(J(KEY, {})).final);
    var gate = root.querySelector("[data-cert-gate]"), ready = root.querySelector("[data-cert-ready]");
    var st = root.querySelector("[data-cert-status]");
    if (!(fin.best >= C.pass)) {
      if (st) st.textContent = fin.best != null ? "Ең жақсы нәтижең: " + fin.best + "%. Тағы " + (C.pass - fin.best) + " пайыз қалды." : "Қорытынды емтихан әлі тапсырылмаған.";
      return;
    }
    gate.hidden = true;
    ready.hidden = false;
    var acad = obj(obj(J("cs50kz:academy", {})).lessons), lab = obj(J("ao17:lab3d", {}));
    var p1 = C.p1.filter(function (id) { return obj(acad[id]).mastered; }).length;
    var p2 = Object.keys(C.p2).filter(function (id) {
      var a = Array.isArray(lab[id]) ? lab[id] : [];
      return C.p2[id] && a.filter(function (q) { return !/:(predict|contrast)$/.test(q); }).length >= C.p2[id];
    }).length;
    function out(sel, t) { var x = root.querySelector(sel); if (x) x.textContent = t; }
    out("[data-cert-score]", fin.best + "%");
    out("[data-cert-p1]", String(p1));
    out("[data-cert-p2]", String(p2));
    var months = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
    var d = new Date(fin.bestAt || fin.at || Date.now());
    out("[data-cert-date]", d.getFullYear() + " ж. " + d.getDate() + " " + months[d.getMonth()]);
    var input = root.querySelector("[data-cert-name]");
    var prog = obj(J("cs50kz:progress", {}));
    input.value = J(NAME, "") || prog.name || "";
    function code(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36).toUpperCase().padStart(7, "0"); }
    function sync() {
      var name = input.value.trim();
      out("[data-cert-out]", name || "Аты-жөнің");
      out("[data-cert-id]", "AO17-CS-" + code(name + "|" + fin.best + "|" + (fin.bestAt || fin.at)));
      S(NAME, name);
    }
    input.addEventListener("input", sync);
    sync();
    root.querySelector("[data-cert-print]").addEventListener("click", function () { window.print(); });
  }
})();
