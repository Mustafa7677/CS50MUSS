/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe зертханалары (A тобы: Дейкстра, ОЖ жоспарлаушысы, CPU кэші мен конвейері) - ортақ көмекшілер.
   player(): алдын ала есептелген кадрларды Ойнату / Кідірту / Алдыңғы / Келесі / Басынан / Жылдамдық батырмаларымен жүргізеді.
   stepList(): барлық қадамның мәтіндік тізімі - анимацияның статикалық баламасы (prefers-reduced-motion кезінде ашық тұрады). */
(() => {
  "use strict";
  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /** Қазақша жазылу: ондық бөлшек үтірмен, артық нөлсіз (2.50 → «2,5»). */
  const num = (x, d = 2) => { const r = Math.round(x * 10 ** d) / 10 ** d; return String(r).replace(".", ","); };
  /** Оқушы енгізген санды оқу: «2,5», «2.5», «-3» */
  const parseNum = (s) => { const m = String(s).trim().replace(",", ".").match(/^[-−]?\d+(?:\.\d+)?$/); return m ? +m[0].replace("−", "-") : NaN; };

  /** box ішінде [data-c=play|pause|prev|next|reset], select[data-c=speed], .cs-n болуы керек.
      o.len() - кадр саны, o.draw(k) - k-кадрды салу, o.blocked() - болжау режимінде автоойнату тыйылады,
      o.onNext() - «Келесі» басылғанда (true қайтарса, қадамды өзі жасады), o.onReset() */
  function player(box, o) {
    let k = 0, timer = null;
    const b = (c) => box.querySelector(`[data-c=${c}]`), n = box.querySelector(".cs-n");
    const last = () => Math.max(0, o.len() - 1);
    function paint() {
      b("prev").disabled = k === 0;
      b("next").disabled = k >= last();
      b("play").disabled = (o.blocked && o.blocked()) || k >= last() || !!timer;
      b("pause").disabled = !timer;
      if (n) n.textContent = `${k} / ${last()}`;
    }
    function draw() { o.draw(k); paint(); }
    function go(x) { x = Math.max(0, Math.min(last(), x)); if (x !== k) { k = x; draw(); } else paint(); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function play() {
      if (timer || (o.blocked && o.blocked())) return;
      const sp = +b("speed").value || 1;
      timer = setInterval(() => { if (k >= last()) { stop(); paint(); return; } go(k + 1); if (k >= last()) { stop(); paint(); } }, (o.ms || 1400) / sp);
      go(k + 1); paint();
    }
    b("play").addEventListener("click", play);
    b("pause").addEventListener("click", () => { stop(); paint(); });
    b("next").addEventListener("click", () => { stop(); if (o.onNext && o.onNext()) { paint(); return; } go(k + 1); });
    b("prev").addEventListener("click", () => { stop(); go(k - 1); });
    b("reset").addEventListener("click", () => { stop(); k = 0; if (o.onReset) o.onReset(); draw(); });
    b("speed").addEventListener("change", () => { if (timer) { stop(); play(); } });
    return { get k() { return k; }, set(x) { stop(); k = Math.max(0, Math.min(last(), x)); draw(); }, go, stop, draw, paint, restart() { stop(); k = 0; draw(); }, playing: () => !!timer };
  }

  /** <details> ішіндегі <ol>-ге барлық қадам мәтінін жазады; ағымдағы қадам белгіленеді. */
  function stepList(det, msgs, cur) {
    if (!det) return;
    const ol = det.querySelector("ol");
    if (det.dataset.n !== String(msgs.length) || det.dataset.sig !== msgs[msgs.length - 1]) {
      ol.innerHTML = "";
      msgs.forEach((m, i) => { const li = document.createElement("li"); li.value = i; li.textContent = m; ol.append(li); });
      det.dataset.n = String(msgs.length); det.dataset.sig = msgs[msgs.length - 1] || "";
    }
    [...ol.children].forEach((li, i) => li.classList.toggle("on", i === cur));
  }
  function initSteps(det) { if (det && reduced()) det.open = true; }

  /** Айналатын аймақ (кең кесте, қадамдар тізімі) пернетақтамен де айналуы үшін: тек шынымен асып тұрғанда tabindex=0 қосылады. */
  function fixScroll() {
    document.querySelectorAll(".ca-scroll, .ca-steps ol").forEach((el) => {
      const over = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      const list = el.matches("ol");
      if (over) { el.tabIndex = 0; if (!el.hasAttribute("aria-label")) { if (!list) el.setAttribute("role", "region"); el.setAttribute("aria-label", list ? "Қадамдар тізімі (айналдыруға болады)" : "Кесте (көлденең айналдыруға болады)"); } }
      else if (el.getAttribute("tabindex") === "0") { el.removeAttribute("tabindex"); if (!list) el.removeAttribute("role"); el.removeAttribute("aria-label"); }
    });
  }
  let pend = false;
  const soon = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; fixScroll(); }); };
  if (typeof MutationObserver !== "undefined" && document.body) new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "hidden"] });
  window.addEventListener("resize", soon);
  window.addEventListener("load", soon);

  window.CSLabA = { fixScroll, reduced, rnd, pick, shuffle, esc, num, parseNum, player, stepList, initSteps };
})();
