/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 IELTS Academy - ортақ көмекшілер: DOM құрастыру, жергілікті сақтау, таймер, сөз санау, жүктеп алу.
   Деректер тек осы браузерде (localStorage «ao17:ielts:*»); сыртқы қызмет жоқ. */
(() => {
  "use strict";
  const PFX = "ao17:ielts:";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** h("button", {class: "btn", onclick: fn}, "мәтін", childNode) - қауіпсіз DOM құрастырушы (innerHTML жоқ). */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const store = {
    get(key, def) { try { const v = localStorage.getItem(PFX + key); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(key, val) { try { localStorage.setItem(PFX + key, JSON.stringify(val)); return true; } catch (e) { return false; } },
    del(key) { try { localStorage.removeItem(PFX + key); } catch (e) { /* жеке режим */ } },
  };

  /** Сөз саны: IELTS-тегідей бос орынмен бөлінген бөліктер («don't» = 1, «2024» = 1). */
  const words = (t) => (String(t).trim().match(/[^\s]+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const fmt = (sec) => { sec = Math.max(0, Math.round(sec)); return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0"); };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduced = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /** Левенштейн қашықтығы - емле қатесін «басқа жауаптан» ажырату үшін. */
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }

  /** Файлды жүктеп беру (сервер жоқ - бәрі браузерде жасалады). */
  function download(name, text, type = "text/plain") {
    const blob = new Blob([text], { type: type + ";charset=utf-8" });
    const a = h("a", { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /** Таймер: кері санау (seconds > 0) не тура санау (seconds = 0). el ішіне mm:ss жазады. */
  function timer(el, { seconds = 0, onEnd, onTick, lowAt = 60 } = {}) {
    let left = seconds, used = 0, id = null;
    const paint = () => {
      el.textContent = fmt(seconds ? left : used);
      el.classList.toggle("low", !!seconds && left <= lowAt);
    };
    const tick = () => {
      used++; if (seconds) left--;
      paint(); if (onTick) onTick(used, left);
      if (seconds && left <= 0) { stop(); if (onEnd) onEnd(); }
    };
    function start() { if (id == null) id = setInterval(tick, 1000); }
    function stop() { if (id != null) { clearInterval(id); id = null; } }
    function reset(s = seconds) { stop(); seconds = s; left = s; used = 0; paint(); }
    paint();
    return { start, stop, reset, running: () => id != null, used: () => used, left: () => left };
  }

  /** AO17Tutor.record қауіпсіз ораушысы (ao-tutor.js жүктелмесе де бет құламайды). */
  function record(skill, opts) { try { if (window.AO17Tutor) return window.AO17Tutor.record(skill, opts); } catch (e) { /* сақтау қатесі */ } return null; }
  /** AO17Tutor.feedback элементтің className-ін ауыстырады - өз класымызды (мыс. ie-qfb) сақтап қаламыз. */
  function feedback(el, kind, title, why) {
    if (el.dataset.keep == null) el.dataset.keep = Array.from(el.classList).filter((c) => !/^tt-/.test(c)).join(" ");
    if (window.AO17Tutor) window.AO17Tutor.feedback(el, kind, title, why);
    else { el.textContent = title + (why ? " " + why : ""); el.className = "tt-fb tt-" + kind; }
    if (el.dataset.keep) el.classList.add(...el.dataset.keep.split(" "));
  }

  /** Тізімнен дұрыс жауапты іздеу үшін қалыпқа келтіру: кіші әріп, тыныс белгілері мен артық бос орынсыз. */
  const norm = (s) => String(s).toLowerCase().normalize("NFKC").replace(/[’‘`]/g, "'").replace(/[.,;:!?"()]/g, " ").replace(/\s+/g, " ").trim();

  window.IELTS = { $, $$, h, store, words, fmt, shuffle, reduced, lev, download, timer, record, feedback, norm };
})();
