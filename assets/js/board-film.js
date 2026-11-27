/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* «Шешім фильмі» (tools/academy/inside_films.py): есептің шешімі кадр-кадрымен. Тақтаға жаңа жол әріп-әрібімен жазылады,
   астында түсіндірме (субтитр), жоғарыда Пойа жолының төрт кезеңі: Түсіну, Жоспар, Шешу, Тексеру.
   INSIDE TECH-тің шешім фильмі ойнатқышының AO17 нұсқасы. Қозғалыс азайтылған режимде жол бірден жазылады.
   Фильм экраннан толық шығып кетсе, тоқтайды: оқушы кадрды жіберіп алмайды.
   Мәтін тек textContent арқылы қойылады (innerHTML жоқ). */
(function () {
  "use strict";
  var SPEEDS = [0.75, 1, 1.5];
  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function marked(p, line, mark) {
    var parts = line.split(mark);
    parts.forEach(function (s, k) {
      if (s) p.appendChild(document.createTextNode(s));
      if (k < parts.length - 1) p.appendChild(el("mark", null, mark));
    });
  }

  function setup(root) {
    var raw = root.querySelector(".bf-data"), poster = root.querySelector(".bf-poster"), start = root.querySelector(".bf-start");
    if (!raw || !poster || !start) return;
    var film;
    try { film = JSON.parse(raw.textContent); } catch (e) { return; }
    var F = film.frames, N = F.length;
    if (!N) return;

    var player = el("div", "bf-player");
    player.hidden = true;
    var route = el("ol", "bf-route");
    route.setAttribute("aria-label", "Шешу жолы");
    var stages = film.stages.map(function (s) { var li = el("li", null, s); route.appendChild(li); return li; });
    var board = el("div", "bf-board");
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", "Тақта");
    var say = el("p", "bf-say");
    say.setAttribute("aria-live", "polite");
    var ctl = el("div", "bf-ctl");
    function btn(label, text, cls) { var b = el("button", cls || null, text); b.type = "button"; b.setAttribute("aria-label", label); return b; }
    var prev = btn("Алдыңғы кадр", "⏮", "bf-prev"), play = btn("Ойнату", "▶", "bf-pp"), next = btn("Келесі кадр", "⏭", "bf-next");
    var range = document.createElement("input");
    range.type = "range"; range.min = "0"; range.max = String(N - 1); range.value = "0"; range.className = "bf-range";
    range.setAttribute("aria-label", "Фильмнің кадры");
    var count = el("span", "bf-count"), speedB = btn("Жылдамдық: 1×", "1×", "bf-speed"), close = btn("Фильмді жабу", "✕", "bf-close");
    [prev, play, next, range, count, speedB, close].forEach(function (x) { ctl.appendChild(x); });
    [el("div", "bf-strip"), route, board, say, ctl, el("div", "bf-strip")].forEach(function (x) { player.appendChild(x); });
    poster.parentNode.insertBefore(player, poster.nextSibling);

    var i = 0, playing = false, speed = 1, typed = 0, tType = 0, tNext = 0;
    function prevLen(k) { return k > 0 ? F[k - 1].board.length : 0; }
    function newText(k) { return F[k].board.slice(prevLen(k)).join("\n"); }

    function render() {
      var f = F[i], pl = prevLen(i), done = typed >= newText(i).length, left = typed, markAt = -1, k;
      if (f.mark) for (k = f.board.length - 1; k >= 0; k--) if (f.board[k].indexOf(f.mark) >= 0) { markAt = k; break; }
      board.textContent = "";
      f.board.forEach(function (line, k) {
        var p = el("p", "bf-line"), shown = line;
        if (k >= pl) {
          p.setAttribute("data-new", "");
          shown = line.slice(0, Math.max(0, left));
          left -= line.length + 1;
          if (!shown && !done) return;
        }
        if (k === markAt && (k < pl || done)) marked(p, line, f.mark);
        else p.textContent = shown;
        if (k >= pl && !done && shown.length < line.length) p.appendChild(el("span", "bf-caret"));
        board.appendChild(p);
      });
    }
    function ui() {
      stages.forEach(function (li, k) {
        if (k < F[i].stage) li.setAttribute("data-state", "done"); else if (k === F[i].stage) li.setAttribute("data-state", "now"); else li.removeAttribute("data-state");
        if (k === F[i].stage) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
      range.value = String(i);
      count.textContent = (i + 1) + " / " + N;
      prev.disabled = i === 0;
      next.disabled = i >= N - 1;
      var end = !playing && i >= N - 1;
      play.textContent = playing ? "❚❚" : end ? "↺" : "▶";
      play.setAttribute("aria-label", playing ? "Тоқтату" : end ? "Басынан қайта ойнату" : "Ойнату");
      root.setAttribute("data-frame", String(i));
      root.classList.toggle("is-playing", playing);
      root.classList.toggle("is-end", i >= N - 1);
    }
    function schedule() {
      clearTimeout(tNext);
      if (!playing || typed < newText(i).length) return;
      if (i >= N - 1) { setPlaying(false); return; }
      tNext = setTimeout(function () { go(i + 1); }, Math.max(2200, F[i].say.length * 55) / speed);
    }
    function tick() {
      clearTimeout(tType);
      if (typed < newText(i).length) tType = setTimeout(function () { typed += 2; render(); tick(); }, 26 / speed);
      else schedule();
    }
    function go(k) {
      clearTimeout(tNext);
      i = Math.max(0, Math.min(N - 1, k));
      typed = reduced() ? newText(i).length : 0;
      say.textContent = F[i].say;
      render();
      ui();
      tick();
    }
    function setPlaying(on) {
      playing = on;
      if (!on) clearTimeout(tNext);
      ui();
      if (on) schedule();
    }

    start.hidden = false;
    start.addEventListener("click", function () {
      poster.hidden = true;
      player.hidden = false;
      go(0);
      setPlaying(true);
      play.focus();
    });
    play.addEventListener("click", function () {
      if (!playing && i >= N - 1) { go(0); setPlaying(true); } else setPlaying(!playing);
    });
    prev.addEventListener("click", function () { go(i - 1); });
    next.addEventListener("click", function () { go(i + 1); });
    range.addEventListener("input", function () { go(+range.value); });
    speedB.addEventListener("click", function () {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      speedB.textContent = speed + "×";
      speedB.setAttribute("aria-label", "Жылдамдық: " + speed + "×");
      tick();
    });
    close.addEventListener("click", function () {
      setPlaying(false);
      clearTimeout(tType);
      player.hidden = true;
      poster.hidden = false;
      start.focus();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!e.isIntersecting && playing) setPlaying(false); });
      }).observe(player);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-bf]"), setup);
})();
