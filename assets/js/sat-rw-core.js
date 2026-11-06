/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* SAT R&W зертханаларына ортақ көмекшілер: қадамдық анимация басқарушысы (Ойнату/Кідірту/Алдыңғы/Келесі/Басынан/Жылдамдық),
   төрт нұсқалы сұрақ батырмалары, нұсқаларды белгілеу. window.SAT (sat-core.js) үстіне құрылады. */
(() => {
  "use strict";
  const { h, reduced } = window.SAT;
  const L = "ABCD";

  /** Қадамдық көрсетілім. render(i) - i-қадамның толық күйін салады (жинақталған күй, сондықтан кез келген қадамға секіруге болады).
      Қозғалысты азайту режимінде «Ойнату» бірден соңғы (толық түсіндірілген) қадамды көрсетеді. */
  function stepper(root, { count, render, label = "Қадамдық көрсетілім" }) {
    let i = 0, n = count, timer = null, speed = 1;
    const b = (c, t) => h("button", { type: "button", class: c === "play" ? "btn gold" : "btn secondary", "data-c": c }, t);
    const play = b("play", "▶ Ойнату"), pause = b("pause", "❚❚ Кідірту"), prev = b("prev", "← Алдыңғы"), next = b("next", "Келесі →"), reset = b("reset", "↺ Басынан");
    const sp = h("select", { "data-c": "speed", "aria-label": "Жылдамдық" }, ...[["0.5", "0.5×"], ["1", "1×"], ["2", "2×"]].map(([v, t]) => h("option", v === "1" ? { value: v, selected: "" } : { value: v }, t)));
    const num = h("span", { class: "sat-small", "data-c": "n" });
    const box = h("div", { class: "lab-row rw-ctl", role: "group", "aria-label": label }, play, pause, prev, next, reset, h("label", { class: "sat-small" }, "Жылдамдық ", sp), num);
    root.append(box);
    const stop = () => { if (timer) clearInterval(timer); timer = null; play.setAttribute("aria-pressed", "false"); };
    const go = (k) => {
      i = Math.max(0, Math.min(n - 1, k));
      render(i);
      num.textContent = `Қадам ${i + 1} / ${n}`;
      prev.disabled = i === 0; next.disabled = i === n - 1;
      if (i === n - 1) stop();
    };
    play.addEventListener("click", () => {
      if (reduced()) { stop(); go(n - 1); return; }
      if (i >= n - 1) go(0);
      stop(); play.setAttribute("aria-pressed", "true");
      timer = setInterval(() => (i >= n - 1 ? stop() : go(i + 1)), 1500 / speed);
    });
    pause.addEventListener("click", stop);
    prev.addEventListener("click", () => { stop(); go(i - 1); });
    next.addEventListener("click", () => { stop(); go(i + 1); });
    reset.addEventListener("click", () => { stop(); go(0); });
    sp.addEventListener("change", () => { speed = +sp.value; if (timer) { stop(); play.click(); } });
    return { go, stop, get i() { return i; }, get n() { return n; }, reset(count2) { stop(); if (count2) n = count2; go(0); }, el: box };
  }

  /** Төрт нұсқалы сұрақ батырмалары (.sat-opts). onPick(k). */
  function options(el, choices, onPick) {
    el.innerHTML = "";
    choices.forEach((c, k) => {
      const btn = h("button", { type: "button", "aria-pressed": "false", "data-c": k, "aria-label": `${L[k]}. ${c}` }, h("i", { "aria-hidden": "true", text: L[k] }), h("span", { text: c }));
      btn.addEventListener("click", () => onPick(k, btn));
      el.append(btn);
    });
  }
  /** Жауаптан кейін: дұрысын ok, таңдалған қатені no етіп белгілеп, бәрін бұғаттайды. */
  function settle(el, ans, picked) {
    el.querySelectorAll("button").forEach((b, k) => { b.disabled = true; b.setAttribute("aria-pressed", String(k === picked)); if (k === ans) b.classList.add("ok"); else if (k === picked) b.classList.add("no"); });
  }
  /** Әр нұсқаның түсіндірмесі (.sat-why). */
  function whyList(el, choices, why, ans) {
    el.innerHTML = "";
    choices.forEach((c, k) => el.append(h("li", { class: k === ans ? "ok" : "no" }, h("b", { lang: "en", text: (k === ans ? "✓ " : "✗ ") + L[k] + ". " + c }), " - ", why[k])));
  }
  const clear = (el) => { el.className = ""; el.textContent = ""; };
  /** Лабораторияның басына жылжу (егер көрінбесе) - келесі тапсырмаға өткенде. */
  const toTop = (el) => { const r = el.getBoundingClientRect(); if (r.top < 0) el.scrollIntoView({ block: "start", behavior: "instant" }); };

  window.SATRW = { stepper, options, settle, whyList, clear, toTop, L };
})();
