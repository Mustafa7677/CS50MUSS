/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
 * «Ағылшын тілі A0-C1» курсының жаттығу қозғалтқышы. Vanilla JS, сыртқы кітапхана да, сыртқы қызмет те жоқ.
 *
 * Сабақ бетіндегі .en-ex блоктарын (дерек: <script type="application/json" class="en-ex-data">) интерактивті жаттығуға айналдырады:
 *   choice (көп таңдау), fill (бос орын), match (сәйкестендіру), order (сөйлем құру), write (қысқа жазба), listen (тыңдау), speak (айту).
 * Дыбыстау тек браузердің өз speechSynthesis API-імен (қолжетімсіз болса - мәтін ескертуі).
 * Сақтау: cs50kz:en:ex (жаттығу нәтижелері), cs50kz:en:draft:* (жазба қолжазбасы), cs50kz:en:vocab (сөздік күйі),
 *         check:<бет>:<id> = [true] (бар прогресс жүйесі мен кабинет тапсырма санайды).
 * Формат құжаты: docs/EN-COURSE-GUIDE.md. en-tools.js (сөздік, грамматика, т.б.) осы файлдағы window.CS50KZ_EN-ді қолданады.
 */
(function () {
  "use strict";

  /* ---------- Қарапайым көмекшілер ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* жеке режим */ } }
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  /* Мәтінде тек <b>, <i>, <em>, <strong>, <code> теңдеріне рұқсат (қалғаны экрандалады) */
  var rich = function (s) { return esc(s).replace(/&lt;(\/?)(b|i|em|strong|code)&gt;/g, "<$1$2>"); };
  /* Жауапты салыстыру: регистр, апостроф түрі, тыныс белгілері және артық бос орын ескерілмейді */
  var norm = function (s) {
    return String(s).toLowerCase().replace(/[\u2018\u2019\u02bc`\u00b4]/g, "'").replace(/[.,!?;:"\u201c\u201d]+/g, " ").replace(/\s+/g, " ").trim();
  };
  var shuffle = function (a) {
    var r = a.slice(), i, j, t;
    for (i = r.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  };
  var words = function (s) { var m = String(s).trim().match(/[A-Za-zЀ-ӿ0-9'’-]+/g); return m ? m.length : 0; };
  function h(tag, attrs) {
    var e = document.createElement(tag), k, kids = Array.prototype.slice.call(arguments, 2);
    for (k in attrs || {}) {
      var v = attrs[k];
      if (v === false || v == null) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    (function add(list) {
      for (var n = 0; n < list.length; n++) {
        var c = list[n];
        if (c == null || c === false) continue;
        if (Array.isArray(c)) add(c); else e.append(c.nodeType ? c : document.createTextNode(c));
      }
    })(kids);
    return e;
  }
  var K = function () { return window.CS50KZ || {}; };
  var UID = 0;
  /* Бет кілті: en/lectures/week-3.html -> "week-3"; басқа бет -> файл атауы */
  var pageKey = (location.pathname.match(/([\w-]+)\.html$/) || [, "page"])[1];

  /* ---------- Дыбыстау (браузердің өз speechSynthesis) ---------- */
  var TTS = {
    ok: !!(window.speechSynthesis && window.SpeechSynthesisUtterance),
    voice: null, hasEn: null,
    pick: function () {
      if (!this.ok) return;
      var vs = [];
      try { vs = speechSynthesis.getVoices() || []; } catch (e) { /* ештеңе */ }
      this.hasEn = vs.length ? vs.some(function (v) { return /^en/i.test(v.lang); }) : null;
      this.voice = vs.filter(function (v) { return /^en-US/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
    },
    say: function (text, rate) {
      if (!this.ok || !text) return false;
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text));
        u.lang = this.voice ? this.voice.lang : "en-US";
        if (this.voice) u.voice = this.voice;
        u.rate = rate || 1;
        speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    }
  };
  TTS.pick();
  if (TTS.ok && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", function () { TTS.pick(); ttsNotice(); });

  var NOTE_NO_TTS = "Бұл браузерде дыбыстау қолжетімсіз. Мәтінді өзіңіз дауыстап оқыңыз (қазақша оқылуы көрсетілген), не Chrome, Edge немесе Safari ашыңыз.";
  var NOTE_NO_VOICE = "Құрылғыңызда ағылшын дауысы табылмады, сондықтан дыбыс дұрыс шықпауы мүмкін. Құрылғы баптауларынан ағылшын дауысын қосыңыз немесе мәтінді өзіңіз оқыңыз.";
  function ttsNotice() {
    var box = document.querySelector(".en-tts-warn");
    if (!box) return;
    var msg = !TTS.ok ? NOTE_NO_TTS : TTS.hasEn === false ? NOTE_NO_VOICE : "";
    box.textContent = msg;
    box.hidden = !msg;
    document.querySelectorAll(".en-say").forEach(function (b) { if (!TTS.ok) { b.disabled = true; b.title = "Дыбыстау қолжетімсіз"; } });
  }
  function sayButton(text, label) {
    return h("button", { type: "button", class: "en-say", "data-say": text, "aria-label": (label || "Дыбыстау") + ": " + text, title: "Дыбыстау", text: "🔊" });
  }

  /* ---------- Сөздік күйі: cs50kz:en:vocab = { id: { b: 1..5, due: ms, m: 0|1 } } ---------- */
  var VKEY = "cs50kz:en:vocab";
  var DAY = 86400000;
  var BOX_DAYS = [0, 0, 1, 3, 7, 14];   // қорап -> келесі қайталауға дейін күн
  var VS = {
    all: function () { var v = LS.get(VKEY, {}); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; },
    save: function (v) { LS.set(VKEY, v); },
    learned: function (id) { var e = this.all()[id]; return !!e && (e.m === 1 || e.b >= 4); },
    setManual: function (id, on) {
      var v = this.all(), e = v[id] || { b: 1, due: 0, m: 0 };
      e.m = on ? 1 : 0;
      if (on && e.b < 4) { e.b = 4; e.due = Date.now() + BOX_DAYS[4] * DAY; }
      if (!on && e.b >= 4) { e.b = 1; e.due = 0; }
      v[id] = e; this.save(v);
    },
    /* Лейтнер: білдім -> келесі қорап, білмедім -> 1-қорап */
    review: function (id, knew) {
      var v = this.all(), e = v[id] || { b: 1, due: 0, m: 0 };
      e.b = knew ? Math.min(5, e.b + 1) : 1;
      e.due = Date.now() + BOX_DAYS[e.b] * DAY;
      if (!knew) e.m = 0;
      v[id] = e; this.save(v);
      if (K().logDay) K().logDay();
      return e;
    },
    due: function (id) { var e = this.all()[id]; return !e || (e.due || 0) <= Date.now(); },
    count: function () { var v = this.all(), n = 0; for (var k in v) if (v[k].m === 1 || v[k].b >= 4) n++; return n; }
  };

  /* ---------- Жаттығу нәтижесін сақтау ---------- */
  var EXKEY = "cs50kz:en:ex";
  function exState(key) { var all = LS.get(EXKEY, {}); return (all && all[key]) || null; }
  function exSave(key, rec) { var all = LS.get(EXKEY, {}); if (!all || typeof all !== "object") all = {}; all[key] = rec; LS.set(EXKEY, all); }

  /* ---------- Жаттығу қозғалтқышы ---------- */
  var R = {};

  function resultBox(ctx) {
    return h("p", { class: "en-ex-result", "aria-live": "polite", role: "status" });
  }
  /* Тексеру нәтижесін жазу: got - дұрыс саны, total - барлығы */
  function finish(ctx, got, total) {
    var ok = got === total && total > 0;
    var prev = exState(ctx.key) || {};
    var rec = { best: Math.max(prev.best || 0, got), total: total, ok: !!(ok || prev.ok), t: Date.now() };
    exSave(ctx.key, rec);
    ctx.result.className = "en-ex-result " + (ok ? "ok" : "bad");
    ctx.result.textContent = (ok ? "✓ Керемет! " : "Қайта көріңіз. ") + "Нәтиже: " + got + " / " + total + (ok ? "" : ". Қателерді түзетіп, қайта тексеріңіз.");
    if (ok) markDone(ctx.el, true, !prev.ok);
    return ok;
  }
  function markDone(el, on, first) {
    el.classList.toggle("is-done", !!on);
    var badge = el.querySelector(".en-ex-badge");
    if (on && !badge) {
      var hd = el.querySelector(".task-head") || el.firstElementChild;
      if (hd) hd.append(h("span", { class: "en-ex-badge", text: "✓ Орындалды" }));
    }
    if (on) {
      var id = el.dataset.id;
      LS.set("check:" + location.pathname + ":" + id, [true]);
      if (first) {
        if (K().logDay) K().logDay();
        if (K().check) K().check();
        if (K().toast) K().toast("Жаттығу орындалды ✓");
      }
    }
    updateSummary();
  }
  function updateSummary() {
    var all = document.querySelectorAll(".en-ex"), box = document.querySelector(".en-ex-sum");
    if (!box) return;
    var done = document.querySelectorAll(".en-ex.is-done").length;
    box.textContent = "Жаттығулар: " + done + " / " + all.length + " орындалды" + (done === all.length && all.length ? " ✓" : "");
  }
  function controls(ctx, onCheck, onReset, onShow) {
    var row = h("div", { class: "en-ex-ctrl" },
      h("button", { type: "button", class: "btn en-check", onclick: onCheck, text: "Тексеру" }),
      onShow ? h("button", { type: "button", class: "btn secondary en-show", onclick: onShow, text: "Жауаптарды көрсету" }) : null,
      onReset ? h("button", { type: "button", class: "btn secondary en-reset", onclick: onReset, text: "Қайта бастау" }) : null);
    ctx.result = resultBox(ctx);
    ctx.body.append(row, ctx.result);
  }
  var cls = function (el, c, on) { el.classList.toggle(c, !!on); };

  /* --- choice: [{ q, o:[...], a:индекс, e? }] --- */
  R.choice = function (ctx) {
    var items = ctx.data.items || [], list = h("ol", { class: "en-items" }), groups = [];
    items.forEach(function (it, i) {
      var name = ctx.uid + "q" + i, opts = (it.o || []).map(function (o, k) {
        return h("label", { class: "en-opt" }, h("input", { type: "radio", name: name, value: String(k) }), h("span", { html: rich(o) }));
      });
      var fs = h("fieldset", { class: "en-q" }, h("legend", { html: rich(it.q) }), opts, h("p", { class: "en-expl", hidden: true }));
      groups.push({ fs: fs, it: it, opts: opts });
      list.append(h("li", null, fs));
    });
    ctx.body.append(list);
    controls(ctx, function () {
      var got = 0;
      groups.forEach(function (g) {
        var sel = g.fs.querySelector("input:checked"), chosen = sel ? +sel.value : -1, ok = chosen === g.it.a;
        if (ok) got++;
        g.opts.forEach(function (lab, k) { cls(lab, "correct", k === g.it.a && (ok || chosen >= 0)); cls(lab, "wrong", k === chosen && !ok); });
        var ex = g.fs.querySelector(".en-expl");
        ex.hidden = !g.it.e || chosen < 0; ex.innerHTML = g.it.e ? rich(g.it.e) : "";
        g.fs.classList.toggle("is-bad", chosen < 0 || !ok);
        if (chosen < 0) ex.hidden = false, ex.textContent = "Жауапты таңдаңыз.";
      });
      finish(ctx, got, groups.length);
    }, function () {
      ctx.body.querySelectorAll("input").forEach(function (i) { i.checked = false; });
      groups.forEach(function (g) { g.opts.forEach(function (l) { l.classList.remove("correct", "wrong"); }); g.fs.classList.remove("is-bad"); g.fs.querySelector(".en-expl").hidden = true; });
      ctx.result.textContent = ""; ctx.result.className = "en-ex-result";
    });
  };

  /* --- fill: [{ t:"I ___ a student.", a:["am"] (не [["am"],["is"]] көп бос орын үшін), h?, e? }], bank? --- */
  function blanksOf(it, n) {
    var a = it.a;
    if (!Array.isArray(a)) a = [a];
    if (n > 1 || Array.isArray(a[0])) return a.map(function (x) { return Array.isArray(x) ? x : [x]; });
    return [a];
  }
  R.fill = function (ctx) {
    var items = ctx.data.items || [], list = h("ol", { class: "en-items" }), rows = [];
    if (ctx.data.bank && ctx.data.bank.length) {
      ctx.body.append(h("p", { class: "en-bank" }, h("b", { text: "Сөздер: " }), ctx.data.bank.map(function (w) { return h("span", { class: "en-chip", text: w }); })));
    }
    items.forEach(function (it, i) {
      var parts = String(it.t).split(/_{3,}/), ans = blanksOf(it, parts.length - 1), li = h("li"), inputs = [];
      parts.forEach(function (p, k) {
        if (p) li.append(h("span", { html: rich(p) }));
        if (k < parts.length - 1) {
          var longest = Math.max.apply(null, (ans[k] || [""]).map(function (x) { return String(x).length; }));
          var inp = h("input", { type: "text", class: "en-blank", autocomplete: "off", autocapitalize: "none", spellcheck: "false",
            "aria-label": "Бос орын " + (i + 1) + (parts.length > 2 ? "." + (k + 1) : ""), size: Math.max(4, Math.min(24, longest + 2)) });
          inputs.push(inp); li.append(inp);
        }
      });
      if (it.h) li.append(h("small", { class: "en-hint", html: " Кеңес: " + rich(it.h) }));
      var fb = h("span", { class: "en-fb", hidden: true });
      li.append(fb);
      rows.push({ it: it, ans: ans, inputs: inputs, fb: fb, li: li });
      list.append(li);
    });
    ctx.body.append(list);
    var check = function (reveal) {
      var got = 0;
      rows.forEach(function (r) {
        var okAll = true;
        r.inputs.forEach(function (inp, k) {
          var ok = r.ans[k].some(function (x) { return norm(x) === norm(inp.value); });
          if (!ok) okAll = false;
          cls(inp, "ok", ok); cls(inp, "bad", !ok); inp.setAttribute("aria-invalid", ok ? "false" : "true");
          if (reveal && !ok) inp.value = r.ans[k][0];
        });
        if (okAll) got++;
        r.fb.hidden = okAll && !r.it.e;
        r.fb.innerHTML = okAll ? (r.it.e ? " ✓ " + rich(r.it.e) : "") : (r.it.e ? " " + rich(r.it.e) : "");
        if (!okAll && !reveal) r.fb.hidden = !r.it.e;
      });
      return got;
    };
    controls(ctx, function () { finish(ctx, check(false), rows.length); },
      function () { rows.forEach(function (r) { r.inputs.forEach(function (i) { i.value = ""; i.classList.remove("ok", "bad"); i.removeAttribute("aria-invalid"); }); r.fb.hidden = true; }); ctx.result.textContent = ""; ctx.result.className = "en-ex-result"; },
      function () { check(true); ctx.result.className = "en-ex-result"; ctx.result.textContent = "Дұрыс жауаптар көрсетілді. Өзіңіз қайта жазып көріңіз (“Қайта бастау”)."; });
    ctx.body.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList && e.target.classList.contains("en-blank")) { e.preventDefault(); ctx.body.querySelector(".en-check").click(); } });
  };

  /* --- match: pairs:[[ағылшынша, қазақша], ...] --- */
  R.match = function (ctx) {
    var pairs = ctx.data.pairs || [], rights = shuffle(pairs.map(function (p) { return p[1]; })), list = h("ul", { class: "en-items en-match" }), rows = [];
    pairs.forEach(function (p, i) {
      var sel = h("select", { class: "en-sel", "aria-label": "Сәйкес мағына: " + p[0] },
        h("option", { value: "", text: "- таңдаңыз -" }), rights.map(function (r) { return h("option", { value: r, text: r }); }));
      var left = h("span", { class: "en-left" }, h("b", { html: rich(p[0]) }), /^[\x20-\x7e]+$/.test(String(p[0])) && TTS.ok ? sayButton(p[0]) : null);
      var li = h("li", null, left, sel);
      rows.push({ p: p, sel: sel, li: li });
      list.append(li);
    });
    ctx.body.append(list);
    controls(ctx, function () {
      var got = 0;
      rows.forEach(function (r) { var ok = r.sel.value === r.p[1]; if (ok) got++; cls(r.sel, "ok", ok); cls(r.sel, "bad", !ok); r.sel.setAttribute("aria-invalid", ok ? "false" : "true"); });
      finish(ctx, got, rows.length);
    }, function () { rows.forEach(function (r) { r.sel.value = ""; r.sel.classList.remove("ok", "bad"); r.sel.removeAttribute("aria-invalid"); }); ctx.result.textContent = ""; ctx.result.className = "en-ex-result"; },
    function () { rows.forEach(function (r) { r.sel.value = r.p[1]; cls(r.sel, "ok", true); cls(r.sel, "bad", false); }); ctx.result.className = "en-ex-result"; ctx.result.textContent = "Дұрыс жауаптар көрсетілді."; });
  };

  /* --- order: items:[{ w:[сөздер], a?:[қабылданатын сөйлемдер], kz?:"қазақша тапсырма" }] --- */
  R.order = function (ctx) {
    var items = ctx.data.items || [], rows = [], wrap = h("div", { class: "en-orders" });
    items.forEach(function (it, i) {
      var target = h("div", { class: "en-answer", role: "group", "aria-label": "Сіздің сөйлеміңіз " + (i + 1) });
      var pool = h("div", { class: "en-pool", role: "group", "aria-label": "Сөздер " + (i + 1) });
      var fb = h("p", { class: "en-fb", hidden: true });
      var row = { it: it, target: target, pool: pool, fb: fb, chips: [] };
      var order = shuffle(it.w.map(function (w, k) { return k; }));
      if (it.w.length > 1) for (var t = 0; t < 8 && order.every(function (v, k) { return v === k; }); t++) order = shuffle(order);
      order.forEach(function (k) {
        var chip = h("button", { type: "button", class: "en-chip en-word", text: it.w[k], "data-k": String(k) });
        chip.addEventListener("click", function () { (chip.parentNode === pool ? target : pool).append(chip); fb.hidden = true; target.classList.remove("ok", "bad"); });
        row.chips.push(chip); pool.append(chip);
      });
      rows.push(row);
      wrap.append(h("div", { class: "en-order" },
        h("p", { class: "en-order-q" }, h("b", { text: (i + 1) + ". " }), it.kz ? h("span", { html: rich(it.kz) }) : "Сөздерден сөйлем құраңыз."),
        target, pool, fb));
    });
    ctx.body.append(wrap);
    var sentence = function (r) { return Array.prototype.map.call(r.target.children, function (c) { return c.textContent; }).join(" "); };
    controls(ctx, function () {
      var got = 0;
      rows.forEach(function (r) {
        var acc = (r.it.a && r.it.a.length ? r.it.a : [r.it.w.join(" ")]).map(norm), s = sentence(r), ok = acc.indexOf(norm(s)) >= 0;
        if (ok) got++;
        cls(r.target, "ok", ok); cls(r.target, "bad", !ok);
        r.fb.hidden = ok && !r.it.e; r.fb.innerHTML = ok ? (r.it.e ? "✓ " + rich(r.it.e) : "") : (s ? "Сөз реті дұрыс емес. " : "Сөздерді басып сөйлем құраңыз. ") + (r.it.e ? rich(r.it.e) : "");
      });
      finish(ctx, got, rows.length);
    }, function () {
      rows.forEach(function (r) { r.chips.forEach(function (c) { r.pool.append(c); }); r.target.classList.remove("ok", "bad"); r.fb.hidden = true; });
      ctx.result.textContent = ""; ctx.result.className = "en-ex-result";
    }, function () {
      rows.forEach(function (r) {
        var ans = (r.it.a && r.it.a.length ? r.it.a[0] : r.it.w.join(" ")); r.fb.hidden = false; r.fb.textContent = "Дұрысы: " + ans;
      });
      ctx.result.className = "en-ex-result"; ctx.result.textContent = "Дұрыс жауаптар көрсетілді.";
    });
  };

  /* --- write: { prompt, min, criteria:[...], model, hint? } --- */
  R.write = function (ctx) {
    var d = ctx.data, min = d.min || 0, dkey = "cs50kz:en:draft:" + pageKey + ":" + ctx.id;
    var ta = h("textarea", { class: "en-text", rows: 6, "aria-label": "Сіздің жазбаңыз", spellcheck: "true", lang: "en" });
    var cnt = h("p", { class: "en-count", "aria-live": "off" });
    var saved = LS.get(dkey, ""); if (typeof saved === "string") ta.value = saved;
    var upd = function () { var n = words(ta.value); cnt.textContent = "Сөз: " + n + (min ? " / кемінде " + min : ""); LS.set(dkey, ta.value); };
    ta.addEventListener("input", upd); upd();
    var crit = h("fieldset", { class: "en-crit" }, h("legend", { text: "Өзін-өзі тексеру критерийлері" }),
      (d.criteria || []).map(function (c) { return h("label", { class: "en-crit-i" }, h("input", { type: "checkbox" }), h("span", { html: rich(c) })); }));
    var model = h("details", { class: "en-model" }, h("summary", { text: "Үлгі жауап" }), h("div", { class: "details-body" }, h("p", { lang: "en", html: rich(d.model || "") })));
    if (d.prompt) ctx.body.append(h("p", { class: "en-prompt", html: rich(d.prompt) }));
    if (d.hint) ctx.body.append(h("p", { class: "en-hint", html: "Кеңес: " + rich(d.hint) }));
    ctx.body.append(ta, cnt, crit);
    controls(ctx, function () {
      var n = words(ta.value), boxes = crit.querySelectorAll("input"), all = boxes.length ? Array.prototype.every.call(boxes, function (b) { return b.checked; }) : true;
      if (n < min) { ctx.result.className = "en-ex-result bad"; ctx.result.textContent = "Кемінде " + min + " сөз жазыңыз (қазір " + n + ")."; return; }
      if (!all) { ctx.result.className = "en-ex-result bad"; ctx.result.textContent = "Жазбаңызды критерийлермен салыстырып, барлығын белгілеңіз. Орындалмаған болса, жазбаңызды түзетіңіз."; return; }
      model.open = true;
      finish(ctx, 1, 1);
      ctx.result.textContent = "✓ Жазба дайын. Енді үлгі жауаппен салыстырыңыз: сіздің нұсқаңыз басқаша болуы мүмкін және бұл қалыпты.";
    }, function () { ta.value = ""; upd(); crit.querySelectorAll("input").forEach(function (b) { b.checked = false; }); ctx.result.textContent = ""; ctx.result.className = "en-ex-result"; });
    ctx.body.append(model);
  };

  /* --- listen: items:[{ say, a:["дұрыс жазылым", ...] (диктант) не a:индекс + o:[нұсқалар] (таңдау), h? }] --- */
  R.listen = function (ctx) {
    var items = ctx.data.items || [], list = h("ol", { class: "en-items" }), rows = [];
    items.forEach(function (it, i) {
      var li = h("li"), play = sayButton(it.say, "Тыңдау"), reveal = h("span", { class: "en-reveal", lang: "en", hidden: !!TTS.ok, text: it.say });
      var row = { it: it, li: li };
      li.append(h("span", { class: "en-play" }, play, h("button", { type: "button", class: "en-say slow", "data-say": it.say, "data-rate": "0.7", "aria-label": "Баяу тыңдау: " + it.say, title: "Баяу", text: "🐢" })));
      if (typeof it.a === "number" && it.o) {
        row.name = ctx.uid + "l" + i;
        row.opts = it.o.map(function (o, k) { return h("label", { class: "en-opt" }, h("input", { type: "radio", name: row.name, value: String(k) }), h("span", { html: rich(o) })); });
        li.append(h("fieldset", { class: "en-q" }, h("legend", { text: "Не естідіңіз?" }), row.opts));
      } else {
        row.inp = h("input", { type: "text", class: "en-blank wide", autocomplete: "off", autocapitalize: "none", spellcheck: "false", "aria-label": "Естігеніңізді жазыңыз " + (i + 1) });
        li.append(row.inp);
      }
      if (it.h) li.append(h("small", { class: "en-hint", html: " Кеңес: " + rich(it.h) }));
      var rb = h("button", { type: "button", class: "btn secondary en-rev", "aria-expanded": TTS.ok ? "false" : "true", text: TTS.ok ? "Мәтінді көрсету" : "Мәтін" });
      rb.addEventListener("click", function () { reveal.hidden = !reveal.hidden; rb.setAttribute("aria-expanded", String(!reveal.hidden)); });
      li.append(rb, reveal, h("span", { class: "en-fb", hidden: true }));
      row.fb = li.querySelector(".en-fb");
      rows.push(row); list.append(li);
    });
    if (!TTS.ok) ctx.body.append(h("p", { class: "callout warn", text: NOTE_NO_TTS + " Тыңдау орнына мәтінді оқып, жауап беріңіз." }));
    ctx.body.append(list);
    controls(ctx, function () {
      var got = 0;
      rows.forEach(function (r) {
        var ok;
        if (r.opts) { var s = r.li.querySelector("input:checked"); ok = !!s && +s.value === r.it.a; r.opts.forEach(function (l, k) { cls(l, "correct", k === r.it.a && !!s); cls(l, "wrong", !!s && +s.value === k && !ok); }); }
        else { var acc = (r.it.a || [r.it.say]).map(norm); ok = acc.indexOf(norm(r.inp.value)) >= 0; cls(r.inp, "ok", ok); cls(r.inp, "bad", !ok); r.inp.setAttribute("aria-invalid", ok ? "false" : "true"); }
        if (ok) got++;
        r.fb.hidden = !r.it.e; r.fb.innerHTML = r.it.e ? " " + rich(r.it.e) : "";
      });
      finish(ctx, got, rows.length);
    }, function () {
      rows.forEach(function (r) { if (r.inp) { r.inp.value = ""; r.inp.classList.remove("ok", "bad"); } r.li.querySelectorAll("input[type=radio]").forEach(function (x) { x.checked = false; }); (r.opts || []).forEach(function (l) { l.classList.remove("correct", "wrong"); }); });
      ctx.result.textContent = ""; ctx.result.className = "en-ex-result";
    });
  };

  /* --- speak: items:[{ say, kz?, p? (қазақша оқылуы) }] — үлгіні тыңдап, дауыстап қайталап, өзін-өзі белгілеу --- */
  R.speak = function (ctx) {
    var items = ctx.data.items || [], list = h("ol", { class: "en-items" }), boxes = [];
    items.forEach(function (it, i) {
      var cb = h("input", { type: "checkbox", "aria-label": "Дауыстап қайталадым: " + it.say });
      boxes.push(cb);
      list.append(h("li", null,
        h("span", { class: "en-line", lang: "en", text: it.say }), " ", sayButton(it.say, "Үлгі"),
        it.p ? h("small", { class: "en-pron", text: " Оқылуы: " + it.p }) : null, it.kz ? h("small", { class: "en-kz", text: " (" + it.kz + ")" }) : null,
        h("label", { class: "en-self" }, cb, h("span", { text: " Дауыстап 3 рет қайталадым" }))));
    });
    ctx.body.append(h("p", { class: "en-hint", text: "Тәсіл: үлгіні тыңдаңыз, бірден оған ілесе дауыстап айтыңыз, сосын өзіңіз қайталаңыз. Дауысыңызды телефонға жазып, үлгімен салыстыруға болады." }), list);
    controls(ctx, function () {
      var got = boxes.filter(function (b) { return b.checked; }).length;
      finish(ctx, got, boxes.length);
    }, function () { boxes.forEach(function (b) { b.checked = false; }); ctx.result.textContent = ""; ctx.result.className = "en-ex-result"; });
  };

  function mountEx(el) {
    if (el.dataset.enReady) return;
    el.dataset.enReady = "1";
    var sc = el.querySelector("script.en-ex-data"), type = el.dataset.type, id = el.dataset.id || "ex" + (++UID), data;
    var fail = function (m) { el.append(h("p", { class: "callout warn en-ex-err", text: "Жаттығу жүктелмеді: " + m })); if (window.console) console.warn("en-ex " + id + ": " + m); };
    if (!R[type]) return fail("белгісіз түрі “" + type + "”");
    try { data = JSON.parse(sc ? sc.textContent : ""); } catch (e) { return fail("JSON қатесі"); }
    var ctx = { el: el, id: id, key: pageKey + ":" + id, data: data, uid: "en" + (++UID), body: h("div", { class: "en-ex-body" }) };
    el.append(ctx.body);
    try { R[type](ctx); } catch (e) { return fail(e.message); }
    var st = exState(ctx.key);
    if (st && st.ok) { markDone(el, true, false); if (ctx.result) { ctx.result.className = "en-ex-result ok"; ctx.result.textContent = "✓ Бұрын орындалған (үздік нәтиже " + st.best + " / " + st.total + "). Қайта жасауға болады."; } }
  }

  /* ---------- Сабақтағы сөздік тізімі (.en-vocab) ---------- */
  function mountVocab(ul) {
    ul.querySelectorAll("li").forEach(function (li) {
      var w = li.querySelector(".en-w");
      if (w && !li.querySelector(".en-say")) w.after(" ", sayButton(w.dataset.say || w.textContent.trim(), "Дыбыстау"));
      var id = li.dataset.id;
      if (id && !li.querySelector(".en-known")) {
        var cb = h("input", { type: "checkbox", class: "en-known", "aria-label": "Жаттадым: " + (w ? w.textContent.trim() : id) });
        cb.checked = VS.learned(id);
        cb.addEventListener("change", function () { VS.setManual(id, cb.checked); if (cb.checked && K().logDay) K().logDay(); });
        li.append(h("label", { class: "en-self" }, cb, h("span", { text: " жаттадым" })));
      }
    });
  }

  function init() {
    var exs = document.querySelectorAll(".en-ex");
    var needTts = document.querySelector(".en-say, .en-vocab, .en-ex[data-type=listen], .en-ex[data-type=speak]");
    if (needTts && !document.querySelector(".en-tts-warn")) {
      var anchor = document.querySelector(".en-subnav") || document.querySelector(".lecture-head");
      if (anchor) anchor.after(h("p", { class: "en-tts-warn callout warn", role: "note", hidden: true }));
    }
    document.querySelectorAll(".en-vocab").forEach(mountVocab);
    var h2 = document.getElementById("exercises");
    if (exs.length && h2 && !document.querySelector(".en-ex-sum")) h2.after(h("p", { class: "en-ex-sum", "aria-live": "polite" }));
    exs.forEach(mountEx);
    updateSummary();
    ttsNotice();
  }
  /* Бір ортақ делегат: барлық дыбыстау батырмалары (кейін қосылғандарына да жұмыс істейді) */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".en-say[data-say]");
    if (!b || b.disabled) return;
    b.classList.add("playing");
    var ok = TTS.say(b.dataset.say, parseFloat(b.dataset.rate) || 1);
    setTimeout(function () { b.classList.remove("playing"); }, 900);
    if (!ok) ttsNotice();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.CS50KZ_EN = { LS: LS, esc: esc, rich: rich, norm: norm, shuffle: shuffle, h: h, TTS: TTS, VS: VS, sayButton: sayButton, ttsNotice: ttsNotice, words: words, exState: exState };
})();
