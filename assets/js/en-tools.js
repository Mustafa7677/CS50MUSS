/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
 * «Ағылшын тілі A0-C1» курсының ортақ беттері: сөздік (vocab), грамматика (grammar), IT-фразалар (phrasebank), деңгей тесті (placement).
 * Дерек (assets/data/en-*.js) бос болса да беттер қате бермей, «әзірше бос» күйін көрсетеді (EmptyState).
 * Сақтау: cs50kz:en:vocab (сөздік күйі, en-course.js), cs50kz:en:placement (деңгей тесті нәтижесі).
 * Деректер форматы: docs/EN-COURSE-GUIDE.md. Бұл файл en-course.js-тен кейін жүктеледі (window.CS50KZ_EN).
 */
(function () {
  "use strict";
  var E = window.CS50KZ_EN;
  if (!E) return;
  var h = E.h, esc = E.esc, rich = E.rich, LS = E.LS, VS = E.VS, TTS = E.TTS;
  var LV = ["a0", "a1", "a2", "b1", "b2", "c1"];
  var LVN = { a0: "A0", a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1" };
  var K = function () { return window.CS50KZ || {}; };

  /* ---------- Ортақ ---------- */
  function arr(x) { return Array.isArray(x) ? x : []; }
  function lowerAll(o) { return Object.keys(o).map(function (k) { return String(o[k]); }).join(" ").toLowerCase(); }
  function empty(root, title, text) {
    root.replaceChildren(h("div", { class: "en-empty", role: "status" },
      h("p", { class: "en-empty-t", text: title }), h("p", { text: text }),
      h("p", null, h("a", { class: "btn secondary", href: "index.html#weeks", text: "Сабақтарға оралу" }))));
  }
  function chips(label, opts, cur, onPick) {
    var box = h("div", { class: "seg en-chips", role: "group", "aria-label": label });
    opts.forEach(function (o) {
      var b = h("button", { type: "button", "data-v": o.v, "aria-pressed": String(o.v === cur), class: o.v === cur ? "on" : "", text: o.t });
      b.addEventListener("click", function () {
        box.querySelectorAll("button").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
        onPick(o.v);
      });
      box.append(b);
    });
    return box;
  }
  function searchBox(ph, label, onInput) {
    var i = h("input", { type: "search", class: "en-search", placeholder: ph, "aria-label": label, autocomplete: "off" });
    i.addEventListener("input", function () { onInput(i.value.trim().toLowerCase()); });
    return i;
  }
  /* Бар сабақтар тізімі (en/data/lectures.js): сілтеме тек дайын сабаққа беріледі */
  function readyLessons() {
    var l = ((window.CS50KZ_COURSE_LECTURES || {}).en) || [];
    var s = {};
    l.forEach(function (x) { s[x.id] = x; });
    return s;
  }
  function lessonLabel(n) { return LVN[LV[Math.floor(n / 4)]] + " · " + (n % 4 + 1) + "-сабақ"; }
  function lessonLink(n) {
    if (typeof n !== "number" || n < 0 || n > 23) return null;
    var ready = readyLessons()["week-" + n];
    return ready ? h("a", { class: "en-lesson-link", href: "lectures/week-" + n + ".html", text: "Сабақ: " + lessonLabel(n) }) : h("span", { class: "en-lesson-link soon", text: lessonLabel(n) + " (сабақ жақында)" });
  }
  function levelBadge(l) { return h("span", { class: "en-lvl en-lvl-" + l, text: LVN[l] || String(l).toUpperCase() }); }

  /* =====================================================================
   * Сөздік: window.CS50KZ_EN_VOCAB = { a0: [ {id,w,pos,kz,ex,exkz?,p?,topic?,lesson?,it?} ], ... }
   * ===================================================================== */
  function vocabApp(root) {
    var D = window.CS50KZ_EN_VOCAB || {}, all = [];
    LV.forEach(function (l) { arr(D[l]).forEach(function (w) { if (w && w.id && w.w && w.kz) all.push(Object.assign({ lvl: l }, w)); }); });
    if (!all.length) return empty(root, "Сөздік әзірше бос", "Деңгей бойынша сөздер жақында қосылады.");
    var st = { lvl: "all", q: "", topic: "", status: "all", it: false, mode: "list" };
    var counts = { all: all.length };
    all.forEach(function (w) { counts[w.lvl] = (counts[w.lvl] || 0) + 1; });
    var topics = Array.from(new Set(all.map(function (w) { return w.topic; }).filter(Boolean))).sort();

    var bar = h("div", { class: "en-bar" });
    var lvChips = chips("Деңгей", [{ v: "all", t: "Барлығы (" + all.length + ")" }].concat(LV.filter(function (l) { return counts[l]; }).map(function (l) { return { v: l, t: LVN[l] + " (" + counts[l] + ")" }; })), "all", function (v) { st.lvl = v; render(); });
    var q = searchBox("Сөзді іздеңіз: hello, сәлем...", "Сөзді іздеу", function (v) { st.q = v; render(); });
    var topicSel = h("select", { class: "en-sel", "aria-label": "Тақырып" }, h("option", { value: "", text: "Барлық тақырып" }), topics.map(function (t) { return h("option", { value: t, text: t }); }));
    topicSel.addEventListener("change", function () { st.topic = topicSel.value; render(); });
    var statusSel = h("select", { class: "en-sel", "aria-label": "Күйі" }, h("option", { value: "all", text: "Барлық сөз" }), h("option", { value: "new", text: "Жатталмаған" }), h("option", { value: "known", text: "Жатталған" }));
    statusSel.addEventListener("change", function () { st.status = statusSel.value; render(); });
    var itCb = h("input", { type: "checkbox" });
    itCb.addEventListener("change", function () { st.it = itCb.checked; render(); });
    var itLab = h("label", { class: "en-self" }, itCb, h("span", { text: " Тек IT сөздері" }));
    var info = h("p", { class: "en-info", "aria-live": "polite" });
    var cardBtn = h("button", { type: "button", class: "btn en-cards-btn", text: "Карточкалармен қайталау" });
    var listBox = h("div", { class: "en-list-box" });
    var deckBox = h("div", { class: "en-deck", hidden: true });
    bar.append(lvChips, h("div", { class: "en-filters" }, q, topics.length ? topicSel : null, statusSel, itLab));
    root.replaceChildren(bar, h("div", { class: "en-row" }, info, cardBtn), listBox, deckBox);

    function filtered() {
      return all.filter(function (w) {
        if (st.lvl !== "all" && w.lvl !== st.lvl) return false;
        if (st.topic && w.topic !== st.topic) return false;
        if (st.it && !w.it) return false;
        var known = VS.learned(w.id);
        if (st.status === "known" && !known) return false;
        if (st.status === "new" && known) return false;
        if (st.q && lowerAll({ w: w.w, kz: w.kz, ex: w.ex || "", exkz: w.exkz || "" }).indexOf(st.q) < 0) return false;
        return true;
      });
    }
    function item(w) {
      var cb = h("input", { type: "checkbox", "aria-label": "Жаттадым: " + w.w });
      cb.checked = VS.learned(w.id);
      cb.addEventListener("change", function () { VS.setManual(w.id, cb.checked); if (cb.checked && K().logDay) K().logDay(); updInfo(); li.classList.toggle("known", cb.checked); });
      var li = h("li", { class: "en-vitem" + (cb.checked ? " known" : ""), "data-id": w.id },
        h("div", { class: "en-vhead" }, levelBadge(w.lvl), h("b", { class: "en-w", lang: "en", text: w.w }), w.pos ? h("span", { class: "en-pos", text: w.pos }) : null, E.sayButton(w.w, "Дыбыстау"),
          w.it ? h("span", { class: "en-tag", text: "IT" }) : null),
        h("div", { class: "en-m", text: w.kz }),
        w.p ? h("div", { class: "en-p", text: "Оқылуы: " + w.p }) : null,
        w.ex ? h("div", { class: "en-s" }, h("span", { lang: "en", text: w.ex }), w.exkz ? h("small", { text: " " + w.exkz }) : null) : null,
        h("div", { class: "en-vfoot" }, w.topic ? h("span", { class: "en-topic", text: w.topic }) : null, typeof w.lesson === "number" ? lessonLink(w.lesson) : null, h("label", { class: "en-self" }, cb, h("span", { text: " жаттадым" }))));
      return li;
    }
    function updInfo() { info.textContent = "Көрсетілген: " + filtered().length + " / " + all.length + " · Жатталған: " + VS.count(); }
    function render() {
      var f = filtered();
      updInfo();
      if (!f.length) { listBox.replaceChildren(h("div", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Ештеңе табылмады" }), h("p", { text: "Сүзгіні өзгертіп көріңіз." }))); return; }
      var ul = h("ul", { class: "en-vlist" }, f.slice(0, 400).map(item));
      listBox.replaceChildren(ul, f.length > 400 ? h("p", { class: "en-info", text: "Алғашқы 400 сөз көрсетілді; іздеу не сүзгі қолданыңыз." }) : null);
    }

    /* --- Интервалды қайталау карточкалары (Лейтнер) --- */
    var dir = "en";
    function openDeck() {
      var pool = filtered(), due = pool.filter(function (w) { return VS.due(w.id); });
      st.mode = "deck";
      listBox.hidden = true; deckBox.hidden = false; cardBtn.textContent = "Тізімге оралу";
      var order = E.shuffle(due), i = 0, knew = 0;
      var dirSel = h("select", { class: "en-sel", "aria-label": "Карточка бағыты" }, h("option", { value: "en", text: "English → Қазақша" }), h("option", { value: "kz", text: "Қазақша → English" }));
      dirSel.value = dir;
      dirSel.addEventListener("change", function () { dir = dirSel.value; draw(); });
      var stage = h("div", { class: "en-card-stage", "aria-live": "polite" });
      deckBox.replaceChildren(h("p", { class: "en-info", text: "Қайталауға дайын карточка: " + due.length + " / " + pool.length + ". «Білдім» десеңіз, карточка кейінірек (1, 3, 7, 14 күннен соң) қайта шығады." }), dirSel, stage);
      function draw() {
        if (!pool.length) { stage.replaceChildren(h("p", { text: "Қайталайтын сөз жоқ: сүзгіні өзгертіңіз." })); return; }
        if (!order.length) { stage.replaceChildren(h("div", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Бүгін қайталайтын карточка жоқ ✓" }), h("p", { text: "Кейін оралыңыз немесе тізімнен жаңа сөздерді қарап шығыңыз." }))); return; }
        if (i >= order.length) { stage.replaceChildren(h("div", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Дайын! Білдім: " + knew + " / " + order.length }), h("p", { text: "Білмеген сөздер ертең қайта шығады." }))); return; }
        var w = order[i], flipped = false;
        var front = dir === "en" ? w.w : w.kz, back = dir === "en" ? w.kz : w.w;
        var card = h("div", { class: "en-card" }, h("p", { class: "en-card-n", text: (i + 1) + " / " + order.length }),
          h("p", { class: "en-card-f", lang: dir === "en" ? "en" : "kk", text: front }),
          dir === "en" ? E.sayButton(w.w) : null,
          h("div", { class: "en-card-b", hidden: true },
            h("p", { class: "en-card-t", lang: dir === "en" ? "kk" : "en", text: back }),
            w.p ? h("p", { class: "en-p", text: "Оқылуы: " + w.p }) : null,
            w.ex ? h("p", { class: "en-s", lang: "en", text: w.ex }) : null));
        var flip = h("button", { type: "button", class: "btn", text: "Жауапты көрсету" });
        var yes = h("button", { type: "button", class: "btn en-yes", text: "Білдім", hidden: true });
        var no = h("button", { type: "button", class: "btn secondary en-no", text: "Білмедім", hidden: true });
        flip.addEventListener("click", function () { flipped = true; card.querySelector(".en-card-b").hidden = false; flip.hidden = true; yes.hidden = no.hidden = false; if (dir === "kz") TTS.say(w.w); yes.focus(); });
        yes.addEventListener("click", function () { VS.review(w.id, true); knew++; i++; draw(); });
        no.addEventListener("click", function () { VS.review(w.id, false); i++; draw(); });
        stage.replaceChildren(card, h("div", { class: "en-ex-ctrl" }, flip, yes, no));
        flip.focus();
      }
      draw();
    }
    cardBtn.addEventListener("click", function () {
      if (st.mode === "deck") { st.mode = "list"; deckBox.hidden = true; listBox.hidden = false; cardBtn.textContent = "Карточкалармен қайталау"; render(); }
      else openDeck();
    });
    render();
  }

  /* =====================================================================
   * Грамматика: window.CS50KZ_EN_GRAMMAR = { a0: [ {id,title,rule,examples:[{en,kz}],kz?,mistakes:[{bad,good,why?}],lesson?} ], ... }
   * ===================================================================== */
  function paras(text) {
    return String(text || "").split(/\n{2,}/).map(function (p) { return h("p", { html: rich(p) }); });
  }
  function grammarApp(root) {
    var D = window.CS50KZ_EN_GRAMMAR || {}, all = [];
    LV.forEach(function (l) { arr(D[l]).forEach(function (g) { if (g && g.id && g.title) all.push(Object.assign({ lvl: l }, g)); }); });
    if (!all.length) return empty(root, "Грамматика анықтамалығы әзірше бос", "Ережелер деңгей бойынша жақында қосылады.");
    var st = { lvl: "all", q: "" }, counts = {};
    all.forEach(function (g) { counts[g.lvl] = (counts[g.lvl] || 0) + 1; });
    var q = searchBox("Ережені іздеңіз: to be, Present Simple, артикль...", "Ережені іздеу", function (v) { st.q = v; render(); });
    var info = h("p", { class: "en-info", "aria-live": "polite" });
    var list = h("div", { class: "en-glist" });
    var toggle = h("button", { type: "button", class: "btn secondary", text: "Барлығын ашу" });
    toggle.addEventListener("click", function () {
      var open = toggle.dataset.open !== "1";
      list.querySelectorAll("details").forEach(function (d) { d.open = open; });
      toggle.dataset.open = open ? "1" : "0"; toggle.textContent = open ? "Барлығын жабу" : "Барлығын ашу";
    });
    root.replaceChildren(chips("Деңгей", [{ v: "all", t: "Барлығы (" + all.length + ")" }].concat(LV.filter(function (l) { return counts[l]; }).map(function (l) { return { v: l, t: LVN[l] + " (" + counts[l] + ")" }; })), "all", function (v) { st.lvl = v; render(); }),
      h("div", { class: "en-filters" }, q), h("div", { class: "en-row" }, info, toggle), list);
    function rule(g) {
      var d = h("details", { class: "en-rule", id: g.id },
        h("summary", null, levelBadge(g.lvl), h("b", { text: " " + g.title })),
        h("div", { class: "en-rule-body" },
          h("div", { class: "en-rule-text" }, paras(g.rule)),
          arr(g.examples).length ? h("ul", { class: "en-examples" }, g.examples.map(function (x) { return h("li", null, h("span", { lang: "en", text: x.en }), " ", E.sayButton(x.en, "Дыбыстау"), x.kz ? h("small", { text: " " + x.kz }) : null); })) : null,
          g.kz ? h("div", { class: "callout note en-kzcmp" }, h("span", { class: "callout-title", text: "Қазақшамен салыстыру" }), h("p", { html: rich(g.kz) })) : null,
          arr(g.mistakes).length ? h("div", { class: "en-mistakes" }, h("p", { class: "en-mt", text: "Жиі қателер" }),
            h("ul", null, g.mistakes.map(function (m) { return h("li", null, h("span", { class: "en-bad", lang: "en" }, h("span", { class: "sr-only", text: "Қате: " }), "✗ " + m.bad), " ", h("span", { class: "en-good", lang: "en" }, h("span", { class: "sr-only", text: "Дұрыс: " }), "✓ " + m.good), m.why ? h("small", { text: " " + m.why }) : null); }))) : null,
          typeof g.lesson === "number" ? h("p", null, lessonLink(g.lesson)) : null));
      return d;
    }
    function render() {
      var f = all.filter(function (g) {
        if (st.lvl !== "all" && g.lvl !== st.lvl) return false;
        if (st.q && lowerAll({ t: g.title, r: g.rule || "", k: g.kz || "", e: arr(g.examples).map(function (x) { return x.en + " " + (x.kz || ""); }).join(" "), tg: arr(g.tags).join(" ") }).indexOf(st.q) < 0) return false;
        return true;
      });
      info.textContent = "Көрсетілген ережелер: " + f.length + " / " + all.length;
      list.replaceChildren.apply(list, f.length ? f.map(rule) : [h("div", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Ештеңе табылмады" }), h("p", { text: "Іздеу сөзін не деңгейді өзгертіңіз." }))]);
      toggle.dataset.open = "0"; toggle.textContent = "Барлығын ашу";
    }
    render();
    var target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.tagName === "DETAILS") { target.open = true; target.scrollIntoView(); }
  }

  /* =====================================================================
   * IT-фразалар: window.CS50KZ_EN_PHRASES = [ {id,cat,lvl,en,kz,note?} ]
   * ===================================================================== */
  var CATS = { standup: "Stand-up", review: "Code review", bug: "Баг-репорт", commit: "Commit", email: "E-mail", interview: "Интервью", meeting: "Кездесу", docs: "Құжаттама", question: "Сұрақ қою", general: "Жалпы" };
  function copyText(text, btn) {
    var done = function (ok) { var o = btn.textContent; btn.textContent = ok ? "Көшірілді ✓" : "Көшіру мүмкін болмады"; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else {
      var t = h("textarea", { "aria-hidden": "true", tabindex: "-1", style: "position:fixed;opacity:0" }); t.value = text; document.body.append(t); t.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) { /* ештеңе */ } t.remove(); done(ok);
    }
  }
  function phraseApp(root) {
    var all = arr(window.CS50KZ_EN_PHRASES).filter(function (p) { return p && p.id && p.en && p.kz; });
    if (!all.length) return empty(root, "Фразалар жинағы әзірше бос", "Stand-up, code review, баг-репорт, e-mail және интервью тіркестері жақында қосылады.");
    var st = { cat: "all", lvl: "all", q: "" };
    var cats = Array.from(new Set(all.map(function (p) { return p.cat || "general"; })));
    var q = searchBox("Фразаны іздеңіз: blocker, review, deadline...", "Фразаны іздеу", function (v) { st.q = v; render(); });
    var lvlSel = h("select", { class: "en-sel", "aria-label": "Деңгей" }, h("option", { value: "all", text: "Барлық деңгей" }), LV.filter(function (l) { return all.some(function (p) { return p.lvl === l; }); }).map(function (l) { return h("option", { value: l, text: LVN[l] }); }));
    lvlSel.addEventListener("change", function () { st.lvl = lvlSel.value; render(); });
    var info = h("p", { class: "en-info", "aria-live": "polite" }), list = h("ul", { class: "en-plist" });
    root.replaceChildren(chips("Санат", [{ v: "all", t: "Барлығы (" + all.length + ")" }].concat(cats.map(function (c) { return { v: c, t: (CATS[c] || c) + " (" + all.filter(function (p) { return (p.cat || "general") === c; }).length + ")" }; })), "all", function (v) { st.cat = v; render(); }),
      h("div", { class: "en-filters" }, q, lvlSel), info, list);
    function render() {
      var f = all.filter(function (p) {
        return (st.cat === "all" || (p.cat || "general") === st.cat) && (st.lvl === "all" || p.lvl === st.lvl) && (!st.q || lowerAll({ a: p.en, b: p.kz, c: p.note || "" }).indexOf(st.q) >= 0);
      });
      info.textContent = "Көрсетілген фразалар: " + f.length + " / " + all.length;
      list.replaceChildren.apply(list, f.length ? f.map(function (p) {
        var cp = h("button", { type: "button", class: "btn secondary en-copy", text: "Көшіру", "aria-label": "Көшіру: " + p.en });
        cp.addEventListener("click", function () { copyText(p.en, cp); });
        return h("li", { class: "en-phrase", "data-id": p.id },
          h("div", { class: "en-vhead" }, p.lvl ? levelBadge(p.lvl) : null, h("span", { class: "en-tag", text: CATS[p.cat || "general"] || p.cat }),),
          h("p", { class: "en-pen", lang: "en", text: p.en }), h("p", { class: "en-pkz", text: p.kz }),
          p.note ? h("p", { class: "en-note", text: p.note }) : null,
          h("div", { class: "en-ex-ctrl" }, E.sayButton(p.en, "Дыбыстау"), cp));
      }) : [h("li", { class: "en-empty", role: "status" }, h("p", { class: "en-empty-t", text: "Ештеңе табылмады" }), h("p", { text: "Сүзгіні өзгертіп көріңіз." }))]);
    }
    render();
  }

  /* =====================================================================
   * Деңгей тесті: window.CS50KZ_EN_PLACEMENT = { questions:[ {id,lvl,q,o:[...],a:индекс,e?} ] }
   * Нәтиже: бірінші деңгейден бастап қатарынан >= 60% дұрыс жауап берілген ең жоғары деңгей; келесі деңгейде >= 34% болса - диапазон.
   * ===================================================================== */
  var PKEY = "cs50kz:en:placement";
  function placementScore(qs, answers) {
    var per = {};
    LV.forEach(function (l) { per[l] = [0, 0]; });
    qs.forEach(function (q, i) { if (!per[q.lvl]) return; per[q.lvl][1]++; if (answers[i] === q.a) per[q.lvl][0]++; });
    var last = -1, k;
    for (k = 0; k < LV.length; k++) {
      var p = per[LV[k]];
      if (!p[1]) continue;
      if (p[0] / p[1] >= 0.6) last = k; else break;
    }
    var nextP = last < 5 ? per[LV[last + 1]] : null;
    var upper = nextP && nextP[1] && nextP[0] / nextP[1] >= 0.34 ? last + 1 : last;
    var est = last < 0 ? 0 : last;
    var strong = last >= 0 && per[LV[last]][0] / per[LV[last]][1] >= 0.85;
    var rec = last < 0 ? 0 : (strong && last < 5 ? last + 1 : last);
    return { per: per, est: est, upper: Math.max(est, upper), below: last < 0, rec: rec, lesson: rec * 4 };
  }
  function placementApp(root) {
    var qs = arr((window.CS50KZ_EN_PLACEMENT || {}).questions).filter(function (q) { return q && q.q && Array.isArray(q.o) && q.o.length > 1 && typeof q.a === "number" && LV.indexOf(q.lvl) >= 0; });
    if (!qs.length) return empty(root, "Деңгей тесті әзірше бос", "Сұрақтар жақында қосылады. Осы кезде A0 · 1-сабақтан бастауға болады.");
    qs = qs.slice().sort(function (a, b) { return LV.indexOf(a.lvl) - LV.indexOf(b.lvl); });
    var answers = [], i = 0;
    function intro() {
      var prev = LS.get(PKEY, null);
      var kids = [h("p", null, "Тест " + qs.length + " сұрақтан тұрады, қиындығы біртіндеп өседі. Білмесеңіз, «Білмеймін» батырмасын басыңыз: жорамалдаудан гөрі дәл нәтиже береді."),
        h("p", { class: "en-info", text: qs.length < 12 ? "Назар аударыңыз: қазір сұрақ саны аз (" + qs.length + "), сондықтан нәтиже өте шамалы." : "Шамамен 10-15 минут." })];
      if (prev && typeof prev.est === "number") kids.push(h("div", { class: "callout note" }, h("span", { class: "callout-title", text: "Алдыңғы нәтиже" }), h("p", { text: describe(prev) })));
      var start = h("button", { type: "button", class: "btn gold", text: "Тестті бастау" });
      start.addEventListener("click", function () { answers = []; i = 0; ask(); });
      kids.push(h("p", null, start));
      root.replaceChildren.apply(root, kids);
    }
    function describe(r) { return "Шамамен " + (r.below ? "A0 (бастау деңгейі)" : LVN[LV[r.est]] + (r.upper > r.est ? "-" + LVN[LV[r.upper]] : "")) + "."; }
    function ask() {
      var q = qs[i], name = "pl" + i;
      var form = h("fieldset", { class: "en-q" }, h("legend", { html: "<b>" + (i + 1) + " / " + qs.length + ".</b> " + rich(q.q) }),
        q.o.map(function (o, k) { return h("label", { class: "en-opt" }, h("input", { type: "radio", name: name, value: String(k) }), h("span", { html: rich(o) })); }));
      var bar = h("div", { class: "en-progress", role: "progressbar", "aria-label": "Тест барысы", "aria-valuemin": "0", "aria-valuemax": String(qs.length), "aria-valuenow": String(i) }, h("i", { style: "width:" + Math.round(i / qs.length * 100) + "%" }));
      var next = h("button", { type: "button", class: "btn", text: i === qs.length - 1 ? "Аяқтау" : "Келесі" });
      var skip = h("button", { type: "button", class: "btn secondary", text: "Білмеймін" });
      var back = i ? h("button", { type: "button", class: "btn secondary", text: "Артқа" }) : null;
      var msg = h("p", { class: "en-ex-result", role: "status", "aria-live": "polite" });
      var go = function (v) { answers[i] = v; i++; if (i >= qs.length) finish(); else ask(); };
      next.addEventListener("click", function () { var c = form.querySelector("input:checked"); if (!c) { msg.textContent = "Жауапты таңдаңыз не «Білмеймін» басыңыз."; msg.className = "en-ex-result bad"; return; } go(+c.value); });
      skip.addEventListener("click", function () { go(-1); });
      if (back) back.addEventListener("click", function () { i--; ask(); });
      if (typeof answers[i] === "number" && answers[i] >= 0) { var pre = form.querySelector('input[value="' + answers[i] + '"]'); if (pre) pre.checked = true; }
      root.replaceChildren(bar, form, h("div", { class: "en-ex-ctrl" }, back, next, skip), msg);
      form.querySelector("input").focus({ preventScroll: true });
    }
    function finish() {
      var r = placementScore(qs, answers), total = qs.length, got = qs.filter(function (q, k) { return answers[k] === q.a; }).length;
      LS.set(PKEY, { t: Date.now(), est: r.est, upper: r.upper, below: r.below, rec: r.rec, got: got, total: total });
      if (K().logDay) K().logDay();
      var lesson = r.lesson, link = lessonLink(lesson);
      var levelLink = h("a", { href: "index.html#level-" + LV[r.rec], text: LVN[LV[r.rec]] + " деңгейінің сабақтары" });
      var rows = LV.filter(function (l) { return r.per[l][1]; }).map(function (l) {
        var p = r.per[l], pct = Math.round(p[0] / p[1] * 100);
        return h("li", null, h("span", { class: "en-lvl-name", text: LVN[l] }), h("span", { class: "en-bar-track", role: "img", "aria-label": LVN[l] + ": " + p[0] + " / " + p[1] }, h("i", { style: "width:" + pct + "%" })), h("span", { text: " " + p[0] + " / " + p[1] }));
      });
      var again = h("button", { type: "button", class: "btn secondary", text: "Қайта тапсыру" });
      again.addEventListener("click", function () { answers = []; i = 0; ask(); });
      root.replaceChildren(h("div", { class: "en-result" },
        h("h2", { id: "pl-result", text: "Нәтиже: " + describe({ est: r.est, upper: r.upper, below: r.below }) }),
        h("p", null, "Дұрыс жауап: " + got + " / " + total + "."),
        h("p", null, h("b", { text: "Қай сабақтан бастау керек: " }), lessonLabel(lesson), ". ", link || "", " ", levelLink),
        h("ul", { class: "en-levels" }, rows),
        h("div", { class: "callout warn" }, h("span", { class: "callout-title", text: "Бұл болжам" }), h("p", { text: "Нәтиже ресми емтихан деңгейі емес және IELTS/TOEFL баламасы емес. Сұрақ саны аз болғандықтан қателік жоғары. Күмән болса, бір деңгей төменнен бастаңыз немесе ағылшын тілі мұғаліміне көрсетіңіз." })),
        h("p", null, again)));
      root.querySelector("#pl-result").setAttribute("tabindex", "-1");
      root.querySelector("#pl-result").focus();
    }
    intro();
  }

  function init() {
    var root = document.getElementById("en-app");
    if (!root) return;
    var app = root.dataset.app, fn = { vocab: vocabApp, grammar: grammarApp, phrasebank: phraseApp, placement: placementApp }[app];
    if (!fn) return;
    if (!document.querySelector(".en-tts-warn") && app !== "placement") {
      var anchor = document.querySelector(".en-subnav");
      if (anchor) anchor.after(h("p", { class: "en-tts-warn callout warn", role: "note", hidden: true }));
    }
    try { fn(root); } catch (e) { if (window.console) console.warn("en-tools:", e); empty(root, "Бетті көрсету мүмкін болмады", "Бетті қайта жүктеп көріңіз."); }
    E.ttsNotice();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.CS50KZ_EN.placementScore = placementScore;
})();
