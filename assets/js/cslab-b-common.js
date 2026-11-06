/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe зертханалары, B тобы (желі, ДҚ, таралған жүйелер): ортақ көмекшілер.
   CSB.stepper - кадрлар ойнатқышы (Ойнату / Кідірту / Алдыңғы / Келесі / Басынан / Жылдамдық) және болжау сұрақтары:
   болжау режимі қосулы болса, сұрағы бар кадрға өтпес бұрын ойнатқыш тоқтап, оқушыдан жауап сұрайды; жауап тексеріліп
   (AO17Tutor.feedback + record), содан кейін ғана кадр ашылады. Кадрлар алдын ала есептеледі - артқа жүру нақты. */
(() => {
  "use strict";
  const T = () => window.AO17Tutor;
  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return e;
  }
  // Қайталанатын кездейсоқ сандар (mulberry32)
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const seed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

  /* Ойнатқыш. root ішінде: .cs-ctl [data-c=play|pause|prev|next|reset|speed], .cs-n, .cs-say (түсіндірме),
     [data-k=predict] (checkbox, міндетті емес), .csb-ask (сұрақ панелі), [data-fb=pred], .cs-score.
     opt.frames() → кадрлар массиві; кадр: { msg, ask? }; opt.render(frame, k). ask: { q, skill, title, item,
     opts: [{ id, label }] | null, num?: true, answer, okWhy, why(x) → [тақырып, себеп, қате коды] }. */
  function stepper(root, opt) {
    const $ = (s) => root.querySelector(s);
    const say = $(".cs-say"), askEl = $(".csb-ask"), fb = $("[data-fb=pred]"), pr = $("[data-k=predict]");
    let k = 0, timer = null, pending = null, answered = new Set(), score = { ok: 0, n: 0 };
    const F = () => opt.frames();
    const predictOn = () => !!(pr && pr.checked);
    function paint() {
      const fr = F(), f = fr[k];
      opt.render(f, k);
      if (say) { say.textContent = ""; say.append(el("b", { text: `${k}-қадам. ` }), document.createTextNode(f.msg || "")); }
      const n = $(".cs-n"); if (n) n.textContent = `${k} / ${fr.length - 1}`;
      $("[data-c=prev]").disabled = k === 0;
      $("[data-c=next]").disabled = k >= fr.length - 1 || !!pending;
      $("[data-c=play]").disabled = k >= fr.length - 1 || !!timer || !!pending;
      $("[data-c=pause]").disabled = !timer;
      const sc = $(".cs-score"); if (sc) sc.textContent = predictOn() && score.n ? `Болжам: ${score.ok} / ${score.n} дұрыс` : "";
    }
    function hideAsk() { pending = null; if (askEl) askEl.hidden = true; }
    function go(n) { const fr = F(); n = Math.max(0, Math.min(fr.length - 1, n)); hideAsk(); if (n !== k) { k = n; } paint(); }
    function showAsk(target) {
      const a = F()[target].ask; pending = target; stop();
      askEl.hidden = false; askEl.innerHTML = "";
      askEl.append(el("p", null, el("b", { text: "Болжа: " }), a.q));
      const answer = (x) => {
        const ok = a.num ? Number(x) === a.answer : x === a.answer;
        score.n++; if (ok) score.ok++;
        if (ok) { T().feedback(fb, "ok", "Дұрыс" + (a.okTitle ? ": " + a.okTitle : ""), a.okWhy || ""); T().record(a.skill, { item: a.item || "predict", ok: true, title: a.title }); }
        else { const [t, why, code] = a.why(x); T().feedback(fb, "bad", t, why); T().record(a.skill, { item: a.item || "predict", ok: false, error: code, note: why, title: a.title }); }
        answered.add(target); pending = null; askEl.hidden = true; k = target; paint();
        if (opt.onAnswered) opt.onAnswered(ok, a);
      };
      if (a.num) {
        const id = "csb-in-" + Math.random().toString(36).slice(2, 8);
        const inp = el("input", { class: "cs-in", id, inputmode: "numeric", autocomplete: "off" });
        const go2 = () => { if (!/^\s*-?\d+\s*$/.test(inp.value)) { T().feedback(fb, "info", "Сан жазыңыз", "Жауап - бір бүтін сан."); return; } answer(+inp.value); };
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go2(); });
        askEl.append(el("div", { class: "lab-row" }, el("label", { class: "cs-field", for: id }, el("span", { text: a.label || "Жауабыңыз" })), inp, el("button", { type: "button", class: "btn gold", "data-c": "answer", onclick: go2, text: "Тексеру" })));
      } else {
        const box = el("div", { class: "lab-choice" });
        a.opts.forEach((o) => box.append(el("button", { type: "button", "data-a": o.id, onclick: () => answer(o.id), text: o.label })));
        askEl.append(box);
      }
      askEl.append(el("p", { class: "cs-small" }, el("button", { type: "button", class: "btn secondary csb-skip", "data-c": "skip", onclick: () => { answered.add(target); pending = null; askEl.hidden = true; k = target; paint(); T().feedback(fb, "info", "Болжамсыз көрсетілді", "Бұл қадам болжам есебіне кірмейді."); }, text: "Болжамсыз көрсету" })));
      fb.className = ""; fb.textContent = "";
      paint();
      const first = askEl.querySelector("input, .lab-choice button"); if (first && !opt.noFocus) first.focus({ preventScroll: true });
    }
    function next() {
      const fr = F(); if (k >= fr.length - 1 || pending) return false;
      const t = k + 1;
      if (predictOn() && fr[t].ask && !answered.has(t) && askEl) { showAsk(t); return false; }
      if (fb && !timer) { fb.className = ""; fb.textContent = ""; }
      k = t; paint(); return true;
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function play() {
      if (timer || pending) return;
      const sp = +$("[data-c=speed]").value || 1;
      if (!next()) { paint(); return; }
      timer = setInterval(() => { if (k >= F().length - 1 || !next()) { stop(); paint(); } }, (opt.delay || 1400) / sp);
      paint();
    }
    $("[data-c=play]").addEventListener("click", play);
    $("[data-c=pause]").addEventListener("click", () => { stop(); paint(); });
    $("[data-c=next]").addEventListener("click", () => { stop(); next(); });
    $("[data-c=prev]").addEventListener("click", () => { stop(); go(k - 1); });
    $("[data-c=reset]").addEventListener("click", () => { stop(); answered = new Set(); go(0); if (fb) { fb.className = ""; fb.textContent = ""; } });
    $("[data-c=speed]").addEventListener("change", () => { if (timer) { stop(); play(); } });
    if (pr) pr.addEventListener("change", () => { stop(); hideAsk(); answered = new Set(); score = { ok: 0, n: 0 }; go(0); });
    return {
      reload() { stop(); hideAsk(); answered = new Set(); k = 0; if (fb) { fb.className = ""; fb.textContent = ""; } paint(); },
      go, paint, get k() { return k; }, stop,
    };
  }

  /* Тапсырма көмекшісі: тексеру + үш деңгейлі көмек + шешімнен кейін «меңгеруге саналмайды». */
  function task(root, { make, check, hints, skill }) {
    const out = root.querySelector("[data-fb=task]");
    let P = null, HN = null, helped = false;
    function fresh() {
      P = make(); helped = false;
      out.className = ""; out.textContent = "";
      HN = T().hints(root.querySelector("[data-k=hints]"), hints(P), { onSolution: () => { helped = true; T().feedback(out, "info", "Шешімді көрдіңіз", "Бұл есеп меңгеруге саналмайды. Шешімді түсінген соң «Жаңа есеп» басып, келесісін көмексіз шығарыңыз."); } });
    }
    function run(ans) {
      const r = check(P, ans);
      if (r.empty) { T().feedback(out, "info", r.title, r.why); return r; }
      const h = HN.used();
      T().feedback(out, r.ok ? "ok" : "bad", r.ok ? r.title + (h ? ` (${h} көмекпен)` : "") : r.title, r.why + (r.ok ? " «Жаңа есеп» - келесісі." : ""));
      T().record(typeof skill === "function" ? skill(P) : skill, { item: P.kind || "task", ok: r.ok, hints: helped ? 3 : h, error: r.code || "", note: r.why, title: r.skillTitle || "" });
      return r;
    }
    return { fresh, run, get P() { return P; } };
  }

  function badges() { document.querySelectorAll("[data-badge]").forEach((e) => T().badge(e, e.dataset.badge, e.dataset.title)); }

  window.CSB = { el, esc, rng, pick, shuffle, seed, reduced, stepper, task, badges };
})();
