/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 Python редакторы: Ою студиясы (ao17-oyu.js) мен Бота әлеміне (ao17-bota.js) ортақ. Кәдімгі textarea-ны байытады:
   - жол нөмірлері және белгіленген жол (орындалып жатқан не қате жол: mark(жол, қате));
   - Enter шегіністі сақтайды, «:»-дан кейін 4 бос орын қосады; Backspace бір шегініс деңгейін өшіреді;
   - Tab - шегініс, Shift+Tab - шегіністі азайту; Esc, сосын Tab - редактордан шығу (пернетақта тұзағы болмасын);
   - Ctrl/Cmd+Enter - opts.onRun(); insert(мәтін) - курсорға шегіністі сақтап қою (команда түймелері үшін).
   Өзгерістер execCommand арқылы енгізіледі: Ctrl+Z жұмыс істей береді. Мәнді кодпен ауыстырсаң, refresh() шақыр.
   window.AO17Editor.attach(textarea, { onRun, onInput }) -> { mark, insert, refresh }. */
(function () {
  "use strict";
  function attach(ta, opts) {
    opts = opts || {};
    var wrap = document.createElement("div"), gut = document.createElement("div"), hl = document.createElement("div");
    wrap.className = "ae"; gut.className = "ae-gut"; hl.className = "ae-hl";
    gut.setAttribute("aria-hidden", "true"); hl.setAttribute("aria-hidden", "true"); hl.hidden = true;
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(gut); wrap.appendChild(hl); wrap.appendChild(ta);
    ta.classList.add("ae-ta");
    ta.setAttribute("wrap", "off");
    var line = 0, escTab = false, coarse = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    function metrics() { var cs = getComputedStyle(ta); return { lh: parseFloat(cs.lineHeight) || 24, pad: parseFloat(cs.paddingTop) || 0 }; }
    function place() {
      if (!line) return;
      var m = metrics();
      hl.style.height = m.lh + "px";
      hl.style.transform = "translateY(" + (m.pad + (line - 1) * m.lh - ta.scrollTop) + "px)";
    }
    function refresh() {
      var n = ta.value.split("\n").length, s = "";
      for (var i = 1; i <= n; i++) s += i + "\n";
      if (gut.textContent !== s) gut.textContent = s;
      gut.scrollTop = ta.scrollTop;
      place();
    }
    function mark(n, bad) {
      line = n > 0 ? n : 0;
      hl.hidden = !line;
      hl.classList.toggle("bad", !!bad);
      place();
    }
    function edit(text, s, e) {
      ta.focus();
      ta.setSelectionRange(s, e);
      var ok = false;
      try { ok = document.execCommand("insertText", false, text); } catch (err) { ok = false; }
      if (!ok) { ta.value = ta.value.slice(0, s) + text + ta.value.slice(e); changed(); }   // execCommand өзі input оқиғасын шығарады
      ta.selectionStart = ta.selectionEnd = s + text.length;
    }
    function changed() { refresh(); mark(0); if (opts.onInput) opts.onInput(); }
    ta.addEventListener("input", changed);
    ta.addEventListener("scroll", function () { gut.scrollTop = ta.scrollTop; place(); });
    ta.addEventListener("keydown", function (e) {
      if (e.isComposing) return;
      if (e.key === "Escape") { escTab = true; return; }
      var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, ls = v.lastIndexOf("\n", s - 1) + 1, cur = v.slice(ls, s);
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (opts.onRun) opts.onRun(); return; }
      if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (escTab) { escTab = false; return; }   // Esc, сосын Tab - келесі элементке
        e.preventDefault();
        if (e.shiftKey) { var m = /^ {1,4}/.exec(v.slice(ls)); if (m) edit("", ls, ls + m[0].length); }
        else edit("    ", s, en);
        return;
      }
      escTab = false;
      if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        edit("\n" + /^ */.exec(cur)[0] + (/:\s*(#.*)?$/.test(cur) ? "    " : ""), s, en);
        return;
      }
      if (e.key === "Backspace" && s === en && s > ls && /^ +$/.test(cur) && cur.length % 4 === 0) { e.preventDefault(); edit("", s - 4, s); }
    });
    function insert(text) {
      var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
      var ls = v.lastIndexOf("\n", s - 1) + 1, cur = v.slice(ls, s), ind = /^ */.exec(cur)[0];
      var t = (cur.trim() ? "\n" + ind : "") + text.replace(/\n/g, "\n" + ind);
      if (coarse) {   // телефонда пернетақта ашылмасын: тікелей қоямыз
        ta.value = v.slice(0, s) + t + v.slice(en); ta.selectionStart = ta.selectionEnd = s + t.length; changed();
      } else edit(t, s, en);
    }
    refresh();
    return { mark: mark, insert: insert, refresh: refresh, el: wrap };
  }
  window.AO17Editor = { attach: attach };
})();
