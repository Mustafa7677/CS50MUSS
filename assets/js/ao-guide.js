/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   AO17 Оқулық: IELTS және Digital SAT сабақ беттерінің интерактиві (беттерді tools/guide_build.py жасайды).
   - Болжау: түсіндірмеден бұрын оқушы жауапты өзі болжайды (Predict-Observe-Explain).
   - Қадамдық мысал: шешім қадамдары кезекпен ашылады («Келесі қадам»), соңында жауап пен қақпан.
   - Жаттығу: mc / num / gap. Қате жауапқа себебі айтылады; practice-те AO17Tutor-дың үш деңгейлі көмегі,
     толық шешім ашылса - жаттығу меңгеруге саналмайды. Mastery - көмексіз; бәрі дұрыс болса, сабақ «меңгерілді».
   JS жоқ кезде бет толық оқылады: сұрақтар мен мысалдар статикалық HTML-де тұр. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $("[data-guide]"), raw = $("#gd-data"), T = window.AO17Tutor;
  if (!main || !raw || !T) return;
  const D = JSON.parse(raw.textContent);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const norm = (s) => String(s).trim().toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const numOf = (s) => {   // 3/4, 0,75, .75, 75% - сан ретінде
    s = String(s).trim().replace(",", ".").replace(/\s+/g, "").replace(/−/g, "-");
    let m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
    if (m && +m[2] !== 0) return +m[1] / +m[2];
    m = s.match(/^(-?\d*\.?\d+)%?$/);
    return m ? +m[1] : NaN;
  };
  T.badge($("[data-gd-badge]"), D.id, D.title);

  // ---------- болжау ----------
  const pb = $("[data-gd-predict]");
  if (pb) {
    const p = D.predict, ol = $("ol", pb), fb = el("div");
    const row = el("div", "lab-choice");
    row.setAttribute("role", "group"); row.setAttribute("aria-label", "Болжамыңызды таңдаңыз");
    p.options.forEach((o, i) => {
      const b = el("button", "", o); b.type = "button";
      b.addEventListener("click", () => {
        $$("button", row).forEach((x, j) => { x.disabled = true; x.classList.toggle("ok", j === p.answer); x.classList.toggle("no", j === i && i !== p.answer); });
        T.feedback(fb, i === p.answer ? "ok" : "info", i === p.answer ? "Дұрыс болжадыңыз." : "Болжам қате шықты - бұл жақсы бастама: енді неге екенін оқыңыз.", p.why);
      });
      row.append(b);
    });
    ol.replaceWith(row); pb.append(fb);
  }

  // ---------- қадамдық мысалдар ----------
  $$("[data-worked]").forEach((w) => {
    const steps = $$(".gd-wsteps > li", w), tail = [$(".gd-ans", w), $(".gd-trap", w)];
    let k = 0;
    const bar = el("p", "lab-row"), next = el("button", "btn gold", "Бірінші қадам"), all = el("button", "btn secondary", "Бәрін көрсету"), n = el("span", "gd-n");
    next.type = all.type = "button"; n.setAttribute("aria-live", "polite");
    const paint = () => {
      steps.forEach((s, i) => { s.hidden = i >= k; s.classList.toggle("cur", i === k - 1); });
      tail.forEach((t) => { if (t) t.hidden = k < steps.length; });
      next.textContent = k === 0 ? "Бірінші қадам" : k < steps.length ? "Келесі қадам" : "Қайта бастау";
      n.textContent = `${k} / ${steps.length} қадам`;
    };
    next.addEventListener("click", () => { k = k >= steps.length ? 0 : k + 1; paint(); });
    all.addEventListener("click", () => { k = steps.length; paint(); });
    bar.append(next, all, n); $(".gd-wsteps", w).before(bar); paint();
  });

  // ---------- жаттығулар ----------
  const state = { practice: {}, mastery: {} };
  function mount(setName) {
    const list = $(`[data-gd-set="${setName}"]`), items = D[setName];
    if (!list) return;
    $$(".gd-ex", list).forEach((li, i) => {
      const ex = items[i], withHints = setName === "practice";
      const fb = el("div"), hb = el("div");
      let hintsUsed = () => 0, solved = false, spoiled = false;
      const finish = (ok, title, why, error) => {
        if (solved) return;
        T.feedback(fb, ok ? "ok" : "bad", title, why);
        if (ok) {
          solved = true; li.classList.add("done");
          $$("button, input", li).forEach((x) => { if (!x.classList.contains("tt-hbtn")) x.disabled = true; });
        }
        T.record(D.id, { item: `${setName}-${i + 1}`, ok, hints: spoiled ? 3 : hintsUsed(), error: ok ? "" : error || ex.type + "-wrong", note: ok ? "" : why, title: D.title });
        if (!(i in state[setName])) state[setName][i] = ok && !spoiled;   // тек бірінші әрекет есептеледі
        if (setName === "mastery") result();
      };
      if (ex.type === "mc") {
        const row = el("div", "gd-opts");
        row.setAttribute("role", "group"); row.setAttribute("aria-label", "Жауап нұсқалары");
        ex.options.forEach((o, j) => {
          const b = el("button", "", `${"ABCDE"[j]}. ${o}`); b.type = "button";
          b.addEventListener("click", () => {
            const ok = j === ex.answer;
            b.classList.add(ok ? "ok" : "no"); if (!ok) b.disabled = true;
            finish(ok, ok ? "Дұрыс." : "Қате.", ex.why[j], "mc-" + "abcde"[j]);
          });
          row.append(b);
        });
        $("ol", li).replaceWith(row);
      } else {
        const form = el("form", "gd-form"), inp = el("input"), btn = el("button", "btn gold", "Тексеру"), id = `gd-${setName}-${i}`;
        const lab = el("label", "sr-only", "Жауабыңыз"); lab.htmlFor = id;
        inp.id = id; inp.autocomplete = "off"; inp.spellcheck = false; inp.inputMode = ex.type === "num" ? "decimal" : "text";
        if (ex.unit) form.dataset.unit = ex.unit;
        form.append(lab, inp, ...(ex.unit ? [el("span", "gd-unit", ex.unit)] : []), btn);
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const v = inp.value;
          if (!v.trim()) return T.feedback(fb, "info", "Жауап бос.", "Алдымен жауабыңызды жазыңыз.");
          let ok, why = ex.explain, err = "";
          if (ex.type === "num") {
            const x = numOf(v);
            if (Number.isNaN(x)) return T.feedback(fb, "info", "Сан танылмады.", "Жауапты сан ретінде жазыңыз: 12, -3.5, 3/4.");
            ok = Math.abs(x - ex.value) <= Math.max(1e-9, ex.tol || 0);
            if (!ok) { const hit = Object.keys(ex.errors || {}).find((k) => Math.abs(numOf(k) - x) < 1e-9); why = hit ? ex.errors[hit] : "Есепті қайта тексеріңіз: қай шаманы тауып жатқаныңызды және амалдардың ретін қараңыз."; err = hit ? "num-" + hit : "num-other"; }
          } else {
            ok = ex.accept.some((a) => norm(a) === norm(v));
            if (!ok) { const hit = Object.keys(ex.errors || {}).find((k) => norm(k) === norm(v)); why = hit ? ex.errors[hit] : "Бұл жауап сәйкес келмейді. Сұрақтағы шартты және сөздің формасын (жазылуын) қайта қараңыз."; err = hit ? "gap-" + norm(hit) : "gap-other"; }
          }
          finish(ok, ok ? "Дұрыс." : "Қате.", why, err);
        });
        li.append(form);
      }
      li.append(fb);
      if (withHints && ex.hints) {
        const h = T.hints(hb, ex.hints, { onSolution: () => { spoiled = true; state.practice[i] = false; const p = el("p", "ac-note", "Толық шешім ашылды: бұл жаттығу меңгеруге саналмайды. Төмендегі «Меңгеруді тексеру» бөлімінде жаңа есептер бар."); hb.append(p); } });
        hintsUsed = h.used; li.append(hb);
      }
    });
  }
  function result() {
    const box = $("[data-gd-result]"), n = D.mastery.length, vals = Object.values(state.mastery);
    if (vals.length < n) return;
    const ok = vals.filter(Boolean).length;
    T.feedback(box, ok === n ? "ok" : "info", ok === n ? "Сабақ меңгерілді." : `Меңгеру тексерісі: ${ok} / ${n} бірінші әрекеттен дұрыс.`,
      ok === n ? "Барлық есепті көмексіз шештіңіз. Бұл дағды «Менің оқуым» бетіндегі қайталау жоспарына қосылды." : "Қате кеткен есептердің түсіндірмесін оқып, «Жиі қателер» бөліміне оралыңыз. Ертең қайталап көріңіз: қайталау жоспары «Менің оқуым» бетінде.");
  }
  mount("practice"); mount("mastery");
})();
