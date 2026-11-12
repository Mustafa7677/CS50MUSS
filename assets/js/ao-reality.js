/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   AO17 Reality Engine: интерактивті сабақтың ортақ қаңқасы (IELTS, Digital SAT, CS Universe, Математика).
   Қағида: оқушы түсіндірмені «көрмейді» - ұғымның ішіне кіріп, оны өзі қозғайды. Видео, аудио, ұзақ мәтін жоқ.
   Әр сабақ сегіз кезеңнен тұрады (кейбірі біріктірілуі мүмкін):
     intro (интерактивті кіріспе) → concept (көрнекі түсіндіру) → guided (жетектелген тәжірибе) → explore (еркін зерттеу)
     → checkpoint (білімді тексеру) → mistakes (қатені талдау) → mastery (меңгеру) → прогресс (өздігінен сақталады).
   Қолдану:
     AO17Reality.mount(rootEl, { id: "sat.anatomy.linear", title, stages: [
       { key: "intro", title: "Кіріспе", goal: "бір сөйлем", render(el, ctx) { ...; ctx.done(); } }, ... ] });
   ctx: done(data?) - кезең орындалды (келесі кезең ашылады); state - сабақтың сақталатын күйі (ctx.save() арқылы жазылады);
        tutor - AO17Tutor; reduced - қозғалыс азайтылған ба; note(text) - кезең астындағы түсіндірме жолы;
        record(ok, {item, hints, error, note}) - жауапты Tutor-ға жазу (дағды = сабақ id).
   Көмекшілер: AO17Reality.svg(tag, attrs, parent), .assess(el, items, {hints, onAll}) - тексерілетін сұрақтар (mc / num / gap),
               .player(el, {steps, onStep, speed}) - Play/Pause/Алдыңғы/Келесі/Басынан/Жылдамдық бар қадам ойнатқышы,
               .timer() - нақты өлшенген уақыт (ойдан шығарылған баға емес).
   Күй: localStorage «ao17:reality:v1» (сабақ id бойынша: ашылған кезеңдер, күй, уақыт). */
(() => {
  "use strict";
  const KEY = "ao17:reality:v1", NS = "http://www.w3.org/2000/svg";
  const STAGE_NAMES = { intro: "Кіріспе", concept: "Көр", guided: "Бірге жаса", explore: "Өзің зертте", checkpoint: "Тексер", mistakes: "Қатені талда", mastery: "Меңгеру" };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const svg = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const reduced = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const loadAll = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const saveAll = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* жеке режим */ } };
  const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const numOf = (s) => { s = String(s).trim().replace(",", ".").replace(/\s+/g, "").replace(/−/g, "-"); const m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/); return m && +m[2] ? +m[1] / +m[2] : /^-?\d*\.?\d+%?$/.test(s) ? parseFloat(s) : NaN; };

  function mount(root, cfg) {
    const T = window.AO17Tutor, all = loadAll();
    const rec = all[cfg.id] || (all[cfg.id] = { done: {}, state: {}, ms: 0 });
    const persist = () => { all[cfg.id] = rec; saveAll(all); };
    root.classList.add("rl");
    root.innerHTML = "";
    const nav = el("ol", "rl-nav"); nav.setAttribute("aria-label", "Сабақ кезеңдері");
    const head = el("div", "rl-head"), body = el("div", "rl-body"), foot = el("div", "rl-foot");
    const prog = el("div", "rl-prog"); prog.setAttribute("role", "progressbar"); prog.setAttribute("aria-label", "Сабақ барысы"); prog.setAttribute("aria-valuemin", "0"); prog.setAttribute("aria-valuemax", String(cfg.stages.length));
    prog.append(el("i"));
    const badge = el("span");
    if (T) T.badge(badge, cfg.id, cfg.title);
    root.append(prog, nav, head, body, foot);
    let cur = -1, t0 = Date.now();
    const unlocked = (i) => i === 0 || !!rec.done[cfg.stages[i - 1].key];
    const tabs = cfg.stages.map((s, i) => {
      const li = el("li"), b = el("button"); b.type = "button";
      b.append(el("span", "rl-i", String(i + 1)), document.createTextNode(s.title || STAGE_NAMES[s.key] || s.key));
      b.addEventListener("click", () => go(i));
      li.append(b); nav.append(li); return b;
    });
    function paintNav() {
      const n = cfg.stages.filter((s) => rec.done[s.key]).length;
      prog.firstChild.style.width = (100 * n / cfg.stages.length) + "%"; prog.setAttribute("aria-valuenow", String(n));
      tabs.forEach((b, i) => {
        const s = cfg.stages[i];
        b.disabled = !unlocked(i); b.classList.toggle("on", i === cur); b.classList.toggle("ok", !!rec.done[s.key]);
        b.setAttribute("aria-current", i === cur ? "step" : "false");
        b.title = b.disabled ? "Алдымен алдыңғы кезеңді аяқтаңыз" : "";
      });
      root.classList.toggle("rl-complete", n === cfg.stages.length);
    }
    function go(i) {
      if (i < 0 || i >= cfg.stages.length || !unlocked(i)) return;
      rec.ms += Date.now() - t0; t0 = Date.now();
      cur = i; rec.at = i; persist();
      const s = cfg.stages[i];
      head.innerHTML = ""; body.innerHTML = ""; foot.innerHTML = "";
      const h = el("h2", "rl-title", s.heading || s.title || STAGE_NAMES[s.key]); h.tabIndex = -1;
      head.append(el("p", "rl-kick", `${i + 1}-кезең / ${cfg.stages.length} · ${STAGE_NAMES[s.key] || ""}`), h);
      if (s.goal) head.append(el("p", "rl-goal", s.goal));
      const note = el("p", "rl-note"); note.setAttribute("aria-live", "polite");
      const next = el("button", "btn gold rl-next", i + 1 < cfg.stages.length ? "Келесі кезең" : "Сабақты аяқтау"); next.type = "button";
      next.disabled = !rec.done[s.key];
      next.addEventListener("click", () => { if (i + 1 < cfg.stages.length) { go(i + 1); h2focus(); } else finish(); });
      const h2focus = () => { const t = root.querySelector(".rl-title"); if (t) t.focus({ preventScroll: false }); };
      foot.append(note, next);
      const ctx = {
        state: rec.state, reduced: reduced(), tutor: T, svg, el,
        save: persist,
        note: (t) => { note.textContent = t; },
        done: (data) => { if (data) Object.assign(rec.state, data); if (!rec.done[s.key]) { rec.done[s.key] = Date.now(); } persist(); next.disabled = false; paintNav(); },
        record: (ok, o = {}) => T && T.record(cfg.id, { item: o.item || s.key, ok, hints: o.hints || 0, error: ok ? "" : o.error || s.key + "-wrong", note: ok ? "" : o.note || "", title: cfg.title }),
      };
      try { s.render(body, ctx); } catch (e) {   // бір кезеңнің қатесі бүкіл сабақты құлатпасын
        body.append(el("p", "tt-fb tt-bad", "Бұл кезең жүктелмеді. Бетті жаңартып көріңіз; мәселе қайталанса, келесі кезеңге өте аласыз."));
        console.error(e); next.disabled = false;
      }
      paintNav();
    }
    function finish() {
      rec.finished = rec.finished || Date.now(); rec.ms += Date.now() - t0; t0 = Date.now(); persist();
      body.innerHTML = ""; head.innerHTML = ""; foot.innerHTML = "";
      const box = el("div", "rl-fin");
      box.append(el("h2", "rl-title", "Сабақ аяқталды"), el("p", "", `Барлық ${cfg.stages.length} кезеңнен өттіңіз. Нақты жұмсалған уақыт: ${Math.max(1, Math.round(rec.ms / 60000))} мин. Дағды «Менің оқуым» бетіндегі қайталау жоспарына қосылды.`));
      const again = el("button", "btn secondary", "Басынан қайта өту"); again.type = "button";
      again.addEventListener("click", () => { rec.done = {}; rec.state = {}; rec.finished = 0; persist(); go(0); });
      const row = el("p", "lab-row"); row.append(badge, again);
      if (cfg.next) { const a = el("a", "btn gold", cfg.next.title); a.href = cfg.next.href; row.append(a); }
      box.append(row); body.append(box); paintNav();
    }
    addEventListener("pagehide", () => { rec.ms += Date.now() - t0; t0 = Date.now(); persist(); });
    go(Math.min(rec.at || 0, cfg.stages.length - 1));
    return { go, get stage() { return cur; }, rec };
  }

  /** Тексерілетін сұрақтар: mc {q, options, answer, why[]}, num {q, value, tol?, explain, errors?}, gap {q, accept[], explain, errors?}.
      opts.hints - true болса, сұрақтағы hints[3] AO17Tutor көмегі ретінде шығады; opts.onAll(n дұрыс бірінші әрекеттен, барлығы). */
  function assess(root, items, opts = {}) {
    const T = window.AO17Tutor, first = {};
    const list = el("ol", "gd-exs"); root.append(list);
    items.forEach((ex, i) => {
      const li = el("li", "gd-ex"), fb = el("div"), hb = el("div");
      let solved = false, spoiled = false, used = () => 0;
      if (ex.passage) { const p = el("div", "gd-pass"); p.innerHTML = ex.passage; li.append(p); }
      li.append(el("p", "gd-q", ex.q));
      const finish = (ok, why, err) => {
        if (solved) return;
        if (T) T.feedback(fb, ok ? "ok" : "bad", ok ? "Дұрыс." : "Қате.", why);
        if (!(i in first)) first[i] = ok && !spoiled;
        if (opts.record) opts.record(ok, { item: (opts.prefix || "q") + (i + 1), hints: spoiled ? 3 : used(), error: err, note: why });
        if (ok) { solved = true; li.classList.add("done"); li.querySelectorAll("button, input").forEach((x) => { if (!x.classList.contains("tt-hbtn")) x.disabled = true; }); }
        if (opts.onAll && Object.keys(first).length === items.length && items.every((_, k) => first[k] !== undefined) && list.querySelectorAll(".gd-ex.done").length === items.length) opts.onAll(Object.values(first).filter(Boolean).length, items.length);
      };
      if (ex.type === "mc") {
        const row = el("div", "gd-opts"); row.setAttribute("role", "group"); row.setAttribute("aria-label", "Жауап нұсқалары");
        ex.options.forEach((o, j) => { const b = el("button", "", `${"ABCDE"[j]}. ${o}`); b.type = "button"; b.addEventListener("click", () => { const ok = j === ex.answer; b.classList.add(ok ? "ok" : "no"); if (!ok) b.disabled = true; finish(ok, ex.why[j], "mc-" + "abcde"[j]); }); row.append(b); });
        li.append(row);
      } else {
        const form = el("form", "gd-form"), inp = el("input"), btn = el("button", "btn gold", "Тексеру"), id = "rl-in-" + Math.random().toString(36).slice(2, 8), lab = el("label", "sr-only", "Жауабыңыз");
        lab.htmlFor = id; inp.id = id; inp.autocomplete = "off"; inp.inputMode = ex.type === "num" ? "decimal" : "text";
        form.append(lab, inp, btn);
        form.addEventListener("submit", (e) => {
          e.preventDefault(); const v = inp.value; if (!v.trim()) return;
          let ok, why = ex.explain, err = "";
          if (ex.type === "num") { const x = numOf(v); if (Number.isNaN(x)) { if (T) T.feedback(fb, "info", "Сан танылмады.", "Мысалы: 12, -3.5, 3/4."); return; } ok = Math.abs(x - ex.value) <= Math.max(1e-9, ex.tol || 0); if (!ok) { const hit = Object.keys(ex.errors || {}).find((k) => Math.abs(numOf(k) - x) < 1e-9); why = hit ? ex.errors[hit] : "Қай шаманы тауып жатқаныңызды және амалдардың ретін қайта тексеріңіз."; err = "num-" + (hit || "other"); } }
          else { ok = ex.accept.some((a) => norm(a) === norm(v)); if (!ok) { const hit = Object.keys(ex.errors || {}).find((k) => norm(k) === norm(v)); why = hit ? ex.errors[hit] : "Сәйкес келмейді. Шартты және сөздің жазылуын қайта қараңыз."; err = "gap-" + (hit ? norm(hit) : "other"); } }
          finish(ok, why, err);
        });
        li.append(form);
      }
      li.append(fb);
      if (opts.hints && ex.hints && T) { const h = T.hints(hb, ex.hints, { onSolution: () => { spoiled = true; first[i] = false; } }); used = h.used; li.append(hb); }
      list.append(li);
    });
    return { first };
  }

  /** Қадам ойнатқышы: steps - қадам саны; onStep(k) - k-қадамның күйін салу (0..steps). Қозғалыс азайтылса, Play бірден соңына апарады. */
  function player(root, { steps, onStep, speed = 1400, label = "Анимацияны басқару" }) {
    let k = 0, timer = null, sp = 1;
    const bar = el("div", "rl-player"); bar.setAttribute("role", "group"); bar.setAttribute("aria-label", label);
    const mk = (t, a) => { const b = el("button", "btn secondary", t); b.type = "button"; b.setAttribute("aria-label", a); bar.append(b); return b; };
    const play = mk("▶", "Ойнату"), prev = mk("←", "Алдыңғы қадам"), next = mk("→", "Келесі қадам"), reset = mk("↺", "Басынан");
    const sel = el("select"); sel.setAttribute("aria-label", "Жылдамдық"); [["0.5×", .5], ["1×", 1], ["2×", 2]].forEach(([t, v]) => { const o = el("option", "", t); o.value = v; if (v === 1) o.selected = true; sel.append(o); });
    const n = el("span", "gd-n"); n.setAttribute("aria-live", "polite"); bar.append(sel, n); root.append(bar);
    const stop = () => { clearInterval(timer); timer = null; play.textContent = "▶"; play.setAttribute("aria-label", "Ойнату"); };
    const set = (v) => { k = Math.max(0, Math.min(steps, v)); n.textContent = `${k} / ${steps}`; onStep(k); if (k >= steps) stop(); };
    play.addEventListener("click", () => { if (timer) return stop(); if (reduced()) return set(steps); if (k >= steps) set(0); play.textContent = "❚❚"; play.setAttribute("aria-label", "Тоқтату"); timer = setInterval(() => set(k + 1), speed / sp); });
    prev.addEventListener("click", () => { stop(); set(k - 1); }); next.addEventListener("click", () => { stop(); set(k + 1); }); reset.addEventListener("click", () => { stop(); set(0); });
    sel.addEventListener("change", () => { sp = +sel.value; if (timer) { stop(); play.click(); } });
    set(0);
    return { set, get k() { return k; }, stop };
  }

  const timer = () => { const t = performance.now(); let steps = 0; return { step: () => ++steps, read: () => ({ seconds: Math.round((performance.now() - t) / 100) / 10, steps }) }; };

  window.AO17Reality = { mount, assess, player, timer, svg, el, numOf, STAGE_NAMES, _key: KEY };
})();
