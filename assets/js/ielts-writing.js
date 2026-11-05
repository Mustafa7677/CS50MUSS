/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Writing Studio.
   Task 1 Graph Studio: деректерден SVG сызықтық график; 5 қадам (тенденция → салыстыру → шолу → жоспар → толық жауап),
   әр қадамның тексерісі ережеге негізделген (салыстыру тұжырымдарының ақиқаты деректерден есептеледі).
   Task 2 Argument Builder: тезис, Claim-Reason-Evidence-Explanation блоктары, аргумент картасы, абзац жоспары, эссе редакторы.
   Редактор: сөз санағыш, міндетті емес таймер, localStorage-та автосақтау, нұсқалар тарихы, қалпына келтіру және салыстыру.
   Өзін-өзі тексеру - ресми критерий атауларымен рефлексия; band бағасы ЕШҚАШАН шығарылмайды. Сервер жоқ - экспорт .txt/.json. */
(() => {
  "use strict";
  const W = window.IELTS_WRITING, I = window.IELTS;
  if (!W || !I) return;
  const { $, $$, h, store } = I;
  if (!$("[data-ielts-writing]")) return;
  const T1 = W.task1, T2 = W.task2;
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, ...kids) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); kids.forEach((k) => e.append(k)); return e; };
  const val = (sid, y) => T1.series.find((s) => s.id === sid).v[T1.years.indexOf(y)];
  const sName = (sid) => "the " + T1.series.find((s) => s.id === sid).name; // ағылшынша сөйлем ішінде: «the Science Museum»
  const nm = (sid) => T1.series.find((s) => s.id === sid).name;

  /* ================= Task 1: график ================= */
  const STY = [
    { stroke: "var(--lab-gold)", dash: "", mark: "circle" },
    { stroke: "#9fd8c4", dash: "8 5", mark: "square" },
    { stroke: "var(--lab-chalk)", dash: "2 5", mark: "tri" },
  ];
  (function chart() {
    const box = $("#wr-chart");
    const Wd = 640, Hd = 340, L = 56, R = 120, Tp = 20, B = 44, max = 250;
    const x = (i) => L + i * (Wd - L - R) / (T1.years.length - 1), y = (v) => Tp + (Hd - Tp - B) * (1 - v / max);
    const svg = sv("svg", { viewBox: `0 0 ${Wd} ${Hd}`, role: "img", "aria-labelledby": "wr-chart-t" });
    svg.append(sv("title", { id: "wr-chart-t" }, document.createTextNode("Lakeford: үш нысанға келушілер саны (мың), 2004-2024. Толық сандар төмендегі кестеде.")));
    for (let v = 0; v <= max; v += 50) {
      svg.append(sv("line", { class: "lb-grid", x1: L, x2: Wd - R, y1: y(v), y2: y(v) }));
      svg.append(sv("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", "font-size": 12 }, document.createTextNode(String(v))));
    }
    svg.append(sv("line", { class: "lb-axis", x1: L, x2: Wd - R, y1: y(0), y2: y(0) }), sv("line", { class: "lb-axis", x1: L, x2: L, y1: Tp, y2: y(0) }));
    T1.years.forEach((yr, i) => svg.append(sv("text", { x: x(i), y: Hd - B + 20, "text-anchor": "middle", "font-size": 12 }, document.createTextNode(String(yr)))));
    svg.append(sv("text", { x: 14, y: Tp + (Hd - Tp - B) / 2, transform: `rotate(-90 14 ${Tp + (Hd - Tp - B) / 2})`, "text-anchor": "middle", "font-size": 12 }, document.createTextNode("visitors (thousands)")));
    T1.series.forEach((s, si) => {
      const st = STY[si];
      svg.append(sv("polyline", { points: s.v.map((v, i) => `${x(i)},${y(v)}`).join(" "), fill: "none", stroke: st.stroke, "stroke-width": 3, "stroke-dasharray": st.dash, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      s.v.forEach((v, i) => {
        const cx = x(i), cy = y(v);
        const m = st.mark === "circle" ? sv("circle", { cx, cy, r: 4.5, fill: st.stroke }) : st.mark === "square" ? sv("rect", { x: cx - 4, y: cy - 4, width: 8, height: 8, fill: st.stroke }) : sv("path", { d: `M${cx} ${cy - 5}L${cx + 5} ${cy + 4}H${cx - 5}Z`, fill: st.stroke });
        m.append(sv("title", {}, document.createTextNode(`${s.name}, ${T1.years[i]}: ${v} 000`)));
        svg.append(m);
      });
      const last = s.v[s.v.length - 1];
      const ly = { museum: 4, garden: 4, aquarium: 4 }[s.id] + y(last);
      svg.append(sv("text", { class: "ie-endlbl", x: x(T1.years.length - 1) + 10, y: ly, "font-size": 12.5, fill: st.stroke }, document.createTextNode(s.name)));
    });
    box.append(svg);
    const lg = h("ul", { class: "ie-legend", "aria-hidden": "true" });
    T1.series.forEach((s, si) => { const st = STY[si]; const k = sv("svg", { viewBox: "0 0 28 10" }, sv("line", { x1: 1, x2: 27, y1: 5, y2: 5, stroke: st.stroke, "stroke-width": 3, "stroke-dasharray": st.dash })); const li = h("li"); li.append(k, s.name); lg.append(li); });
    box.append(lg);
    // кесте (қолжетімділік және дәл сандар)
    const tb = $("#wr-table");
    tb.append(h("thead", null, h("tr", null, h("th", { scope: "col" }, "Year"), ...T1.series.map((s) => h("th", { scope: "col" }, s.name)))),
      h("tbody", null, ...T1.years.map((yr, i) => h("tr", null, h("th", { scope: "row" }, String(yr)), ...T1.series.map((s) => h("td", null, String(s.v[i])))))));
  })();

  /* ---------- Task 1 қадамдары ---------- */
  const stepsNav = $$("#wr-steps button"), panels = $$(".wr-step");
  const DONE = store.get("writing:t1steps", {});
  function goStep(k) {
    stepsNav.forEach((b, i) => { if (i === k) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); b.classList.toggle("done", !!DONE[i]); });
    panels.forEach((p, i) => { p.hidden = i !== k; });
  }
  stepsNav.forEach((b, i) => b.addEventListener("click", () => { goStep(i); $("h3", panels[i]).focus(); }));
  const markDone = (i) => { DONE[i] = true; store.set("writing:t1steps", DONE); stepsNav[i].classList.add("done"); };
  $$(".wr-next").forEach((b) => b.addEventListener("click", () => { const k = +b.dataset.to; goStep(k); $("h3", panels[k]).focus(); }));
  goStep(0);

  // 1-қадам: тенденция (ереже: соңғы/бастапқы өзгеріс > 20% - өсті/азайды; әйтпесе ауытқу ≤ 10% - тұрақты; әйтпесе - құбылмалы)
  const trendOf = (v) => { const ch = (v[v.length - 1] - v[0]) / v[0], mean = v.reduce((a, b) => a + b, 0) / v.length; if (ch > 0.2) return "rose"; if (ch < -0.2) return "fell"; return (Math.max(...v) - Math.min(...v)) / mean <= 0.1 ? "stable" : "fluct"; };
  const TR = { rose: "өсті (rose)", fell: "азайды (fell)", stable: "шамамен тұрақты (remained stable)", fluct: "құбылды (fluctuated)" };
  (function step1() {
    const box = $("#wr-trend"), fb = $("#wr-trend-fb");
    const sels = T1.series.map((s) => {
      const sel = h("select", { id: "wr-tr-" + s.id, class: "ie-sel" }, h("option", { value: "" }, "- таңдаңыз -"), ...Object.entries(TR).map(([k, t]) => h("option", { value: k }, t)));
      box.append(h("div", { class: "ie-frow" }, h("label", { for: sel.id, lang: "en" }, s.name), sel));
      return { s, sel };
    });
    $("#wr-trend-check").addEventListener("click", () => {
      let ok = 0; const notes = [];
      sels.forEach(({ s, sel }) => {
        const a = trendOf(s.v), right = sel.value === a, first = s.v[0], last = s.v[s.v.length - 1], pct = Math.round(100 * (last - first) / first);
        if (right) ok++;
        sel.classList.toggle("ok", right); sel.classList.toggle("no", !right);
        notes.push(`${s.name}: ${first} → ${last} (${pct > 0 ? "+" : ""}${pct}%) - ${TR[a]}${!right && sel.value === "fluct" && a === "stable" ? "; 150-160 аралығындағы шағын өзгеріс «құбылу» емес, тұрақтылық" : ""}${!right && sel.value === "stable" && a !== "stable" ? "; бұл өзгеріс тұрақты деуге тым үлкен" : ""}`);
        I.record("ielts.writing.task1.trend", { item: s.id, ok: right, error: right ? "" : "trend-" + (sel.value || "blank"), note: notes[notes.length - 1], title: "IELTS Writing Task 1: тенденция" });
      });
      I.feedback(fb, ok === 3 ? "ok" : "bad", `${ok} / 3 дұрыс`, notes.join(". ") + ". Ереже: басынан соңына дейін 20%-дан көп өзгерсе - өсу/азаю; ауытқу орташа мәннің 10%-ынан аспаса - тұрақты.");
      if (ok === 3) markDone(0);
    });
  })();

  // 2-қадам: деректерден есептелетін салыстыру тұжырымдары
  const compare = (function step2() {
    const box = $("#wr-cmp"), fb = $("#wr-cmp-fb"); let items = [], hintApi = null;
    const ids = T1.series.map((s) => s.id), Y = T1.years;
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    function gen() {
      const out = [], seen = new Set();
      const makers = [
        () => { const yr = pick(Y), [a, b] = I.shuffle(ids); const va = val(a, yr), vb = val(b, yr); if (va === vb) return null; return { t: `In ${yr}, ${sName(a)} attracted more visitors than ${sName(b)}.`, ok: va > vb, why: `${yr}: ${nm(a)} ${va}, ${nm(b)} ${vb}.` }; },
        () => { const a = pick(ids); let i = Math.floor(Math.random() * (Y.length - 1)), j = i + 1 + Math.floor(Math.random() * (Y.length - 1 - i)); const d = val(a, Y[j]) - val(a, Y[i]); if (!d) return null; const lie = Math.random() < 0.5, shown = lie ? Math.abs(d) + pick([10, 20, -10]) : Math.abs(d); if (shown <= 0) return null; return { t: `Between ${Y[i]} and ${Y[j]}, the number of visitors to ${sName(a)} ${d > 0 ? "rose" : "fell"} by ${shown},000.`, ok: shown === Math.abs(d), why: `${nm(a)}: ${val(a, Y[i])} → ${val(a, Y[j])}, айырма ${Math.abs(d)} мың.` }; },
        () => { const yr = pick(Y), [a, b] = I.shuffle(ids); const r = val(a, yr) / val(b, yr); if (r < 1.3) return null; const k = Math.round(r * 2) / 2; if (Math.abs(r - k) >= 0.15) return null; const lie = Math.random() < 0.4, shown = lie ? k + 1 : k; const word = { 1.5: "one and a half times", 2: "twice", 2.5: "two and a half times", 3: "three times", 3.5: "three and a half times", 4: "four times" }[shown]; if (!word) return null; return { t: `In ${yr}, ${sName(a)} had roughly ${word} as many visitors as ${sName(b)}.`, ok: Math.abs(r - shown) < 0.2, why: `${val(a, yr)} ÷ ${val(b, yr)} ≈ ${r.toFixed(2)}.` }; },
        () => { const yr = pick(Y), [a, b] = I.shuffle(ids); const va = val(a, yr), vb = val(b, yr); return { t: `In ${yr}, ${sName(a)} and ${sName(b)} had the same number of visitors.`, ok: va === vb, why: `${yr}: ${va} және ${vb}.` }; },
        () => { const a = pick(ids), m = Math.max(...T1.series.find((s) => s.id === a).v), yr = Y[T1.series.find((s) => s.id === a).v.indexOf(m)], claim = Math.random() < 0.5 ? yr : pick(Y); return { t: `The ${sName(a).slice(4)} reached its highest figure in ${claim}.`, ok: claim === yr, why: `${nm(a)} ең жоғары мәні: ${m} (${yr}).` }; },
      ];
      for (let guard = 0; out.length < 5 && guard < 200; guard++) {
        const s = pick(makers)(); if (!s || seen.has(s.t)) continue;
        const nOk = out.filter((x) => x.ok).length, nNo = out.length - nOk;
        if ((s.ok && nOk >= 3) || (!s.ok && nNo >= 3)) continue;
        seen.add(s.t); out.push(s);
      }
      return out;
    }
    function paint() {
      items = gen(); box.textContent = ""; fb.className = ""; fb.textContent = "";
      items.forEach((it, i) => {
        const grp = h("div", { class: "lab-choice", role: "group", "aria-label": `${i + 1}-тұжырым` },
          ...[["1", "Деректерге сай"], ["0", "Деректерге қайшы"]].map(([v, t]) => h("button", { type: "button", "aria-pressed": "false", "data-v": v, onclick: (e) => { it.pick = v === "1"; $$("button", grp).forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); } }, t)));
        it.el = grp; it.fb = h("p", { class: "ie-case-why" });
        box.append(h("div", { class: "ie-q", value: String(i + 1) }, h("p", { class: "ie-qt", lang: "en" }, it.t), grp, it.fb));
      });
    }
    hintApi = window.AO17Tutor ? AO17Tutor.hints($("#wr-cmp-hints"), [
      "Әр тұжырымда жыл мен нысанды тауып, графиктің астындағы кестеден нақты санды оқыңыз. «twice as many» - бөлу, «rose by» - азайту.",
      "Ұқсас мысал: A = 60, B = 30 болса, «A had twice as many as B» - дұрыс (60 ÷ 30 = 2); «A rose by 40 from 20 to 50» - қате (50 - 20 = 30).",
      "Қадамдап: 1) тұжырымдағы жылды/жылдарды белгілеңіз; 2) кестеден екі санды алыңыз; 3) тұжырымдағы амалды орындаңыз (салыстыру, айырма, қатынас); 4) нәтиже тұжырыммен бірдей ме? Бұл жиынның шешімі тексергеннен кейін әр тұжырымның астында шығады.",
    ], { onSolution: () => { I.feedback(fb, "info", "Шешім жолы ашылды", "Тексеріп, түсіндірмелерді оқыңыз, сосын «Жаңа тұжырымдар» батырмасымен жаңа жиынды көмексіз шешіңіз."); } }) : null;
    $("#wr-cmp-check").addEventListener("click", () => {
      if (items.some((it) => it.pick == null)) { I.feedback(fb, "info", "Барлық тұжырымға жауап беріңіз", "Әрқайсысы бойынша «сай» не «қайшы» таңдаңыз."); return; }
      let ok = 0;
      items.forEach((it) => {
        const right = it.pick === it.ok; if (right) ok++;
        $$("button", it.el).forEach((b) => { b.classList.toggle("ok", (b.dataset.v === "1") === it.ok); b.classList.toggle("no", (b.dataset.v === "1") === it.pick && !right); b.disabled = true; });
        it.fb.textContent = (it.ok ? "Деректерге сай. " : "Деректерге қайшы. ") + it.why;
        I.record("ielts.writing.task1.compare", { item: it.t.slice(0, 40), ok: right, hints: hintApi ? hintApi.used() : 0, error: right ? "" : "data-reading", note: it.why, title: "IELTS Writing Task 1: салыстыру" });
      });
      I.feedback(fb, ok === items.length ? "ok" : "bad", `${ok} / ${items.length} дұрыс`, ok === items.length ? "Негізгі абзацтарда тек осындай тексерілген салыстыруларды қолданыңыз." : "Қате кеткендерінің астындағы есептеуді қараңыз: сан графиктен дәл алынуы керек.");
      if (ok === items.length) markDone(1);
    });
    $("#wr-cmp-new").addEventListener("click", () => { paint(); if (hintApi) hintApi.reset(); });
    paint();
    return { regen: paint };
  })();

  // 3-қадам: шолу
  (function step3() {
    const box = $("#wr-ov"), fb = $("#wr-ov-fb");
    const order = I.shuffle(T1.overview.map((_, i) => i));
    order.forEach((oi) => {
      const o = T1.overview[oi];
      box.append(h("li", { "data-i": oi }, h("input", { type: "checkbox", id: "wr-ov-" + oi }), h("label", { for: "wr-ov-" + oi, lang: "en" }, o.t)));
    });
    $("#wr-ov-check").addEventListener("click", () => {
      let good = true; const notes = [];
      $$("li", box).forEach((li) => {
        const o = T1.overview[+li.dataset.i], on = $("input", li).checked, should = o.kind === "overview", right = on === should;
        if (!right) good = false;
        li.classList.toggle("ok", should); li.classList.toggle("no", on && !should);
        if (on !== should || on) notes.push((should ? "✓ " : "✗ ") + o.why);
      });
      I.record("ielts.writing.task1.overview", { item: "ov", ok: good, error: good ? "" : "overview-vs-detail", note: notes.join(" "), title: "IELTS Writing Task 1: шолу (overview)" });
      I.feedback(fb, good ? "ok" : "bad", good ? "Дұрыс: екі шолу сөйлемі таңдалды." : "Таңдау толық емес не артық.", notes.join(" ") + " Шолу - Task Achievement үшін маңызды: оқырман басты өзгерісті бір қарағанда көруі керек.");
      if (good) markDone(2);
    });
  })();

  // 4-қадам: негізгі абзацтар жоспары
  const KEYF = [
    { id: "m-ends", t: "Museum: 220,000 (2004) → 130,000 (2024)", core: true },
    { id: "g-ends", t: "Garden: 80,000 (2004) → 240,000 (2024), i.e. three times as many", core: true },
    { id: "a-range", t: "Aquarium: between 150,000 and 160,000 every year", core: true },
    { id: "cross", t: "Between 2016 and 2020 the garden overtook both the aquarium and the museum", core: true },
    { id: "m-2008", t: "Museum: 200,000 in 2008", core: false },
    { id: "a-2012", t: "Aquarium: 150,000 in 2012", core: false },
    { id: "g-2008", t: "Garden: 95,000 in 2008", core: false },
  ];
  (function step4() {
    const grp = $("#wr-plan-groups"), kf = $("#wr-plan-keys"), fb = $("#wr-plan-fb");
    const sels = T1.series.map((s) => {
      const sel = h("select", { id: "wr-pg-" + s.id, class: "ie-sel" }, h("option", { value: "" }, "- абзац -"), h("option", { value: "1" }, "1-негізгі абзац"), h("option", { value: "2" }, "2-негізгі абзац"));
      grp.append(h("div", { class: "ie-frow" }, h("label", { for: sel.id, lang: "en" }, s.name), sel)); return { s, sel };
    });
    KEYF.forEach((k) => kf.append(h("li", null, h("input", { type: "checkbox", id: "wr-kf-" + k.id, value: k.id }), h("label", { for: "wr-kf-" + k.id, lang: "en" }, k.t))));
    $("#wr-plan-check").addEventListener("click", () => {
      const rules = [];
      const g1 = sels.filter((x) => x.sel.value === "1"), g2 = sels.filter((x) => x.sel.value === "2"), blank = sels.filter((x) => !x.sel.value);
      rules.push(blank.length ? ["no", "Әр нысанды бір абзацқа бөліңіз: " + blank.map((x) => x.s.name).join(", ") + " бөлінбеді."] : ["ok", "Үш нысанның бәрі жоспарда бар."]);
      rules.push(g1.length && g2.length ? ["ok", "Екі абзацтың екеуінде де мазмұн бар."] : ["no", "Бір абзацқа бәрін жинамаңыз: екі негізгі абзац оқуды жеңілдетеді."]);
      const same = (a, b) => sels.find((x) => x.s.id === a).sel.value === sels.find((x) => x.s.id === b).sel.value;
      if (!blank.length && g1.length && g2.length) rules.push(same("museum", "garden") ? ["ok", "Логикалық топ: орын алмасқан екі нысан (мұражай мен бақ) бірге, тұрақты аквариум бөлек - салыстыру оңай."] : ["info", "Бұл топтау да мүмкін. Бірақ ойланыңыз: бақ пен мұражай бір-бірін «кесіп өтеді» - оларды бір абзацта салыстыру ыңғайлырақ болмас па?"]);
      const chosen = $$("input:checked", kf).map((x) => x.value), core = KEYF.filter((k) => k.core).map((k) => k.id);
      const miss = core.filter((c) => !chosen.includes(c)), minor = chosen.filter((c) => !core.includes(c));
      rules.push(miss.length ? ["no", "Негізгі ерекшеліктер жетпейді: " + miss.map((m) => KEYF.find((k) => k.id === m).t).join("; ") + "."] : ["ok", "Басты сандар (басы, соңы, кесіп өту нүктесі) таңдалды."]);
      if (minor.length) rules.push(["info", `${minor.length} ұсақ дерек таңдалды. Олар қате емес, бірақ 150 сөзде бәрін тізу маңызды ерекшеліктерді көмескілейді.`]);
      const ok = rules.every((r) => r[0] !== "no");
      const ul = h("ul", { class: "ie-rules" }, ...rules.map(([k, t]) => h("li", { class: k }, t)));
      I.feedback(fb, ok ? "ok" : "bad", ok ? "Жоспар дайын." : "Жоспарды толықтырыңыз.", "Бір ғана «дұрыс» топтау жоқ - ережелер тек жоспардың толық әрі қисынды екенін тексереді.");
      fb.append(ul);
      I.record("ielts.writing.task1.plan", { item: "plan", ok, error: ok ? "" : miss.length ? "missing-key-features" : "grouping", note: rules.map((r) => r[1]).join(" "), title: "IELTS Writing Task 1: абзац жоспары" });
      if (ok) { markDone(3); store.set("writing:t1plan", { g: sels.map((x) => [x.s.name, x.sel.value]), k: chosen }); }
    });
  })();

  /* ================= Редактор (екі тапсырмаға ортақ) ================= */
  function editor(mount, { key, target, minutes, onChange }) {
    const ta = h("textarea", { class: "lab-editor", id: `wr-ed-${key}`, spellcheck: "true", lang: "en", "aria-describedby": `wr-wc-${key}` });
    const lbl = h("label", { for: ta.id, class: "ie-sr" }, `Task ${key === "t1" ? 1 : 2} мәтіні`);
    const wc = h("span", { class: "ie-wc", id: `wr-wc-${key}`, "aria-live": "polite" }), meter = h("span", { class: "ie-meter", "aria-hidden": "true" }, h("i"));
    const tEl = h("span", { class: "lab-timer", role: "timer" }, I.fmt(minutes * 60));
    const tm = I.timer(tEl, { seconds: minutes * 60, lowAt: 180, onEnd: () => { tBtn.textContent = "Қайта бастау"; saved.textContent = `${minutes} минут өтті - емтиханда жазуды аяқтау уақыты. Мәтін сақталды.`; snapshot("уақыт бітті"); } });
    const tBtn = h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { if (tm.running()) { tm.stop(); tBtn.textContent = "Жалғастыру"; } else { if (tm.left() <= 0) tm.reset(); tm.start(); tBtn.textContent = "Тоқтата тұру"; } } }, `${minutes} мин таймер (міндетті емес)`);
    const saved = h("span", { class: "lab-meta", "aria-live": "polite" });
    const hist = h("ol", { class: "ie-hist", "aria-label": "Нұсқалар тарихы" }), diff = h("div", { class: "ie-diff", hidden: true, "aria-live": "polite" });
    const H = store.get(`writing:${key}:hist`, []);
    ta.value = store.get(`writing:${key}:draft`, "");
    function count() {
      const n = I.words(ta.value), p = Math.min(100, Math.round(100 * n / target));
      wc.textContent = `${n} сөз / кемінде ${target}`; wc.classList.toggle("ok", n >= target);
      meter.style.setProperty("--p", p + "%"); meter.classList.toggle("ok", n >= target);
      return n;
    }
    function snapshot(why) {
      const text = ta.value; if (!text.trim() || (H[0] && H[0].text === text)) return false;
      H.unshift({ t: Date.now(), text, wc: I.words(text), why }); if (H.length > 30) H.length = 30;
      store.set(`writing:${key}:hist`, H); paintHist(); return true;
    }
    function paintHist() {
      hist.textContent = "";
      if (!H.length) { hist.append(h("li", null, h("span", null, "Әзірге сақталған нұсқа жоқ. «Нұсқа сақтау» не 2 минут сайынғы автосақтау тізімге қосады."))); return; }
      H.forEach((v, i) => hist.append(h("li", null, h("span", null, `${new Date(v.t).toLocaleString("kk-KZ", { dateStyle: "short", timeStyle: "short" })} · ${v.wc} сөз${v.why ? " · " + v.why : ""}`),
        h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => showDiff(v) }, "Қазіргімен салыстыру"),
        h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { snapshot("қалпына келтіру алдында"); ta.value = v.text; save(); diff.hidden = true; saved.textContent = "Нұсқа қалпына келтірілді (алдыңғы мәтін тарихқа сақталды)."; } }, "Қалпына келтіру"))));
    }
    function showDiff(v) {
      const a = v.text.split(/\s+/).filter(Boolean), b = ta.value.split(/\s+/).filter(Boolean);
      const n = a.length, m = b.length;
      if (n * m > 1.5e6) { diff.hidden = false; diff.textContent = "Мәтін тым ұзын - салыстыру мүмкін емес."; return; }
      const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      diff.textContent = ""; diff.hidden = false;
      let i = 0, j = 0, add = 0, del = 0;
      const out = h("p", { lang: "en" });
      while (i < n || j < m) {
        if (i < n && j < m && a[i] === b[j]) { out.append(a[i] + " "); i++; j++; }
        else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { out.append(h("ins", null, b[j]), " "); j++; add++; }
        else { out.append(h("del", null, a[i]), " "); i++; del++; }
      }
      diff.append(h("p", { class: "lab-meta" }, `Таңдалған нұсқадан қазіргіге: +${add} сөз қосылды (жасыл), −${del} сөз алынды (сызылған).`), out);
    }
    let tid = 0;
    function save() { store.set(`writing:${key}:draft`, ta.value); saved.textContent = "Автосақталды " + new Date().toLocaleTimeString("kk-KZ", { hour: "2-digit", minute: "2-digit" }); count(); if (onChange) onChange(ta.value); }
    ta.addEventListener("input", () => { count(); clearTimeout(tid); tid = setTimeout(save, 600); if (onChange) onChange(ta.value); });
    setInterval(() => { if (snapshot("автосақтау")) saved.textContent = "Нұсқа тарихқа автоматты қосылды."; }, 120000);
    mount.append(lbl, ta, h("div", { class: "ie-edbar" }, wc, meter, tEl, tBtn),
      h("div", { class: "ie-edbar" }, h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => { saved.textContent = snapshot("қолмен") ? "Нұсқа сақталды." : "Өзгеріс жоқ - жаңа нұсқа қажет емес."; } }, "Нұсқа сақтау"), saved),
      h("details", { class: "ie-note" }, h("summary", null, "Нұсқалар тарихы және салыстыру"), hist, diff));
    count(); paintHist();
    return { ta, get value() { return ta.value; }, set value(v) { ta.value = v; save(); }, count };
  }

  /* ---------- 5-қадам: Task 1 толық жауап және ереже тексерісі ---------- */
  const ed1 = editor($("#wr-ed1"), { key: "t1", target: 150, minutes: 20 });
  const ALLV = new Set(T1.series.flatMap((s) => s.v));
  $("#wr-t1-check").addEventListener("click", () => {
    const t = ed1.value, low = t.toLowerCase(), n = I.words(t), R = [];
    R.push(n >= 150 ? ["ok", `${n} сөз - 150 талабы орындалды.`] : ["no", `${n} сөз. Кемінде 150 сөз керек: аз болса, Task Achievement бойынша төмендетілуі мүмкін.`]);
    R.push(/\b(overall|in general|generally|it is clear|in summary|to sum up)\b/.test(low) ? ["ok", "Шолу белгісі бар (overall / in general / it is clear...). Шолуда басты тенденция айтылғанын өзіңіз тексеріңіз."] : ["no", "Шолу (overview) белгісі табылмады. «Overall, ...» деп басталатын жеке сөйлем қосыңыз."]);
    const miss = [["museum", "Science Museum"], ["garden", "Botanical Garden"], ["aquarium", "City Aquarium"]].filter(([w]) => !low.includes(w));
    R.push(miss.length ? ["no", "Аталмаған нысан: " + miss.map((m) => m[1]).join(", ") + "."] : ["ok", "Үш нысан да аталды."]);
    const nums = (t.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((x) => +x.replace(/,/g, ""));
    const yrs = nums.filter((x) => x >= 1990 && x <= 2030), vals = nums.filter((x) => !(x >= 1990 && x <= 2030));
    const bad = vals.filter((x) => !ALLV.has(x) && !ALLV.has(x / 1000) && ![2, 3, 4, 20].includes(x) && !(x > 0 && x < 100 && /%/.test(t)));
    R.push(!vals.length ? ["no", "Мәтінде сан жоқ. Task 1-де басты ерекшеліктерді графиктегі сандармен дәлелдеу керек."] : bad.length ? ["no", `Графикте жоқ сан(дар): ${[...new Set(bad)].join(", ")}. Санды кестеден қайта тексеріңіз (бірлік - мың).`] : ["ok", `${vals.length} сан графикке сай келеді.`]);
    const badY = yrs.filter((x) => !T1.years.includes(x));
    if (badY.length) R.push(["no", `Графикте жоқ жыл: ${[...new Set(badY)].join(", ")}. Деректер тек ${T1.years.join(", ")} жылдарына берілген.`]);
    R.push(/\b(than|whereas|while|compared|in contrast|by contrast|twice|times as)\b/.test(low) ? ["ok", "Салыстыру тілі бар (than / whereas / twice as many...)."] : ["no", "Салыстыру сөздері жоқ. Тапсырма «make comparisons» дейді."]);
    if (/\b(i think|i believe|in my opinion|i feel)\b/.test(low)) R.push(["no", "Task 1-де жеке пікір жазылмайды - тек графиктегі ақпарат."]);
    if (/\b(because|due to|caused by)\b/.test(low)) R.push(["info", "Себеп сөздері бар (because / due to). Графикте себеп көрсетілмеген - ойдан себеп қоспаңыз."]);
    if (low.includes("shows the number of visitors to three attractions in the city of lakeford")) R.push(["no", "Кіріспе тапсырма мәтінін сөзбе-сөз көшіреді - өз сөзіңізбен жазыңыз."]);
    const paras = t.split(/\n\s*\n/).filter((p) => p.trim()).length;
    R.push(paras >= 3 ? ["ok", `${paras} абзац.`] : ["info", `${paras} абзац. Әдетте: кіріспе, шолу, 1-2 негізгі абзац - бос жолмен бөліңіз.`]);
    const fb = $("#wr-t1-fb");
    I.feedback(fb, R.some((r) => r[0] === "no") ? "bad" : "ok", "Ереже тексерісі (баға емес)", "Бұл тек өлшенетін нәрселерді тексереді: сөз саны, шолу, сандардың дәлдігі. Сапаны (дәлдік, сөз қоры, грамматика) төмендегі тізіммен өзіңіз бағалаңыз.");
    fb.append(h("ul", { class: "ie-rules" }, ...R.map(([k, x]) => h("li", { class: k }, x))));
    if (!R.some((r) => r[0] === "no")) markDone(4);
  });

  /* ================= Task 2: Argument Builder ================= */
  const A = store.get("writing:t2arg", { stance: "", r1: "", r2: "", thesis: "", p: [{}, {}], counter: "", rebut: "", order: ["intro", "b0", "b1", "counter", "concl"] });
  const saveA = () => store.set("writing:t2arg", A);
  // Тезис
  (function thesis() {
    const st = $("#wr-stance"), r1 = $("#wr-r1"), r2 = $("#wr-r2"), th = $("#wr-thesis"), pats = $("#wr-pats"), fb = $("#wr-th-fb");
    T2.stances.forEach((s) => st.append(h("label", null, h("input", { type: "radio", name: "wr-stance", value: s.id, checked: A.stance === s.id }), " " + s.t)));
    r1.value = A.r1; r2.value = A.r2; th.value = A.thesis;
    T2.patterns.forEach((p) => pats.append(h("button", { type: "button", class: "btn secondary ie-sm", onclick: () => {
      if (!A.stance) { I.feedback(fb, "info", "Алдымен позицияны таңдаңыз", "Тезис - позицияңыздың бір сөйлемдік нұсқасы."); return; }
      th.value = p.f(A.stance, r1.value.trim(), r2.value.trim()); A.thesis = th.value; saveA(); paintMap(); th.focus();
    } }, "Бастама: " + p.t)));
    st.addEventListener("change", () => { A.stance = $("input:checked", st).value; saveA(); paintMap(); });
    [[r1, "r1"], [r2, "r2"], [th, "thesis"]].forEach(([el, k]) => el.addEventListener("input", () => { A[k] = el.value; saveA(); paintMap(); }));
    $("#wr-th-check").addEventListener("click", () => {
      const t = th.value.toLowerCase(), n = I.words(t), R = [];
      R.push(A.stance ? ["ok", "Позиция таңдалды."] : ["no", "Позиция таңдалмады."]);
      R.push(n >= 12 && n <= 45 ? ["ok", `${n} сөз - бір сөйлемдік тезиске лайық.`] : ["no", n < 12 ? `${n} сөз - тым қысқа: позиция мен негізгі себептерді қамтыңыз.` : `${n} сөз - тым ұзын: тезис бір анық сөйлем болғаны жөн.`]);
      R.push(T2.topicWords.some((w) => new RegExp("\\b" + w + "\\b").test(t)) ? ["ok", "Тезис тапсырма тақырыбына сілтейді."] : ["no", "Тезисте тақырып сөздері (course, subject, student...) жоқ - ол нақты сұраққа жауап беруі керек."]);
      const agreeW = /\b(agree|support|benefit|worthwhile|should be required|good idea)\b/.test(t), disW = /\b(disagree|should not|shouldn't|oppose|harm|unnecessary|not be compulsory)\b/.test(t), partW = /\b(partly|to some extent|although|while|only if|however)\b/.test(t);
      if (A.stance === "agree" && disW && !partW) R.push(["no", "Позиция «келісемін», бірақ тезисте қарсылық сөздері бар - оқырман шатасуы мүмкін."]);
      else if (A.stance === "disagree" && !disW) R.push(["no", "Позиция «келіспеймін», бірақ тезисте қарсылық анық айтылмаған (disagree / should not...)."]);
      else if (A.stance === "partly" && !partW) R.push(["no", "«Ішінара» позициясы шекараны көрсетуі керек: although / only if / to some extent."]);
      else if (A.stance) R.push(["ok", "Тезис таңдалған позицияға сай."]);
      if (/…/.test(th.value)) R.push(["no", "Бастамадағы «…» орындарын өз себептеріңізбен толтырыңыз."]);
      const ok = R.every((r) => r[0] !== "no");
      I.feedback(fb, ok ? "ok" : "bad", ok ? "Тезис анық." : "Тезисті нақтылаңыз.", "Бұл бастамалар міндетті үлгі емес: кез келген анық, позициясы бар сөйлем жарайды.");
      fb.append(h("ul", { class: "ie-rules" }, ...R.map(([k, x]) => h("li", { class: k }, x))));
      I.record("ielts.writing.task2.thesis", { item: "thesis", ok, error: ok ? "" : "unclear-position", note: R.filter((r) => r[0] === "no").map((r) => r[1]).join(" "), title: "IELTS Writing Task 2: тезис" });
    });
  })();
  // Claim → Reason → Evidence → Explanation
  const PARTS = [["claim", "Claim · тұжырым", "Абзацтың басты ойы (topic sentence)."], ["reason", "Reason · себеп", "Неліктен бұл рас?"], ["evidence", "Evidence · дәлел/мысал", "Нақты мысал, жағдай, тәжірибе."], ["explain", "Explanation · түсіндіру", "Мысал тезисті қалай дәлелдейді?"]];
  (function cree() {
    const box = $("#wr-cree");
    [0, 1].forEach((pi) => {
      const fs = h("fieldset", { class: "ie-block" }, h("legend", null, `${pi + 1}-негізгі абзац`));
      const grid = h("div", { class: "ie-cree" });
      PARTS.forEach(([k, t, hint]) => {
        const ta = h("textarea", { id: `wr-c${pi}-${k}`, rows: 3, lang: "en" }); ta.value = (A.p[pi] || {})[k] || "";
        ta.addEventListener("input", () => { A.p[pi] = A.p[pi] || {}; A.p[pi][k] = ta.value; saveA(); paintMap(); paintPlan(); });
        grid.append(h("div", null, h("label", { for: ta.id, class: "ie-blabel" }, h("b", null, t)), h("small", null, hint), ta));
      });
      fs.append(grid); box.append(fs);
    });
    const cfs = h("fieldset", { class: "ie-block" }, h("legend", null, "Қарсы пікір және жауап (міндетті емес)"));
    const c1 = h("textarea", { id: "wr-counter", rows: 2, lang: "en" }), c2 = h("textarea", { id: "wr-rebut", rows: 2, lang: "en" });
    c1.value = A.counter; c2.value = A.rebut;
    c1.addEventListener("input", () => { A.counter = c1.value; saveA(); paintMap(); paintPlan(); });
    c2.addEventListener("input", () => { A.rebut = c2.value; saveA(); paintMap(); paintPlan(); });
    cfs.append(h("div", { class: "ie-cree" }, h("div", null, h("label", { for: c1.id }, h("b", null, "Counter-argument")), h("small", null, "Қарсы жақтың ең күшті дәлелі."), c1), h("div", null, h("label", { for: c2.id }, h("b", null, "Rebuttal")), h("small", null, "Неліктен ол сіздің позицияңызды жоққа шығармайды?"), c2)));
    box.append(cfs);
    $("#wr-cree-check").addEventListener("click", () => {
      const fb = $("#wr-cree-fb"), R = [];
      const thesisW = new Set((A.thesis.toLowerCase().match(/[a-z]{5,}/g) || []));
      [0, 1].forEach((pi) => {
        const p = A.p[pi] || {}, nm = `${pi + 1}-абзац`;
        const empty = PARTS.filter(([k]) => !(p[k] || "").trim()).map(([, t]) => t.split(" · ")[0]);
        R.push(empty.length ? ["no", `${nm}: толтырылмаған - ${empty.join(", ")}.`] : ["ok", `${nm}: төрт блок та бар.`]);
        if ((p.claim || "").trim() && I.words(p.claim) > 30) R.push(["info", `${nm}: Claim ${I.words(p.claim)} сөз - басты ойды қысқа, бір сөйлеммен айтқан жөн.`]);
        if ((p.evidence || "").trim()) R.push(/\b(for example|for instance|such as|when|study|survey|percent|%|\d)\b/i.test(p.evidence) ? ["ok", `${nm}: дәлелде нақты мысал белгісі бар.`] : ["info", `${nm}: дәлел жалпы сияқты - нақты мысал (for example, нақты жағдай, сан) қосыңыз.`]);
        if ((p.explain || "").trim()) { const link = /\b(this shows|this means|therefore|as a result|which means|thus|so|consequently)\b/i.test(p.explain) || (p.explain.toLowerCase().match(/[a-z]{5,}/g) || []).some((w) => thesisW.has(w)); R.push(link ? ["ok", `${nm}: түсіндіру тезиске байланады.`] : ["info", `${nm}: түсіндіру тезиске қайтып оралмайды - «This shows that...» сияқты байлам қосыңыз.`]); }
        if (p.claim && pi === 1 && A.p[0] && A.p[0].claim && I.norm(p.claim) === I.norm(A.p[0].claim)) R.push(["no", "Екі абзацтың тұжырымы бірдей - әр абзацқа жаңа ой керек."]);
      });
      if (A.counter.trim() && !A.rebut.trim()) R.push(["no", "Қарсы пікір бар, бірақ оған жауап (rebuttal) жоқ - бұл позицияңызды әлсіретеді."]);
      const ok = R.every((r) => r[0] !== "no");
      I.feedback(fb, ok ? "ok" : "bad", ok ? "Аргументтер құрылымы толық." : "Аргументтерді толықтырыңыз.", "Блоктар - ойлау құралы, абзацтың міндетті формасы емес: соңғы мәтінде оларды еркін біріктіре аласыз.");
      fb.append(h("ul", { class: "ie-rules" }, ...R.map(([k, x]) => h("li", { class: k }, x))));
      I.record("ielts.writing.task2.argument", { item: "cree", ok, error: ok ? "" : "incomplete-argument", note: R.filter((r) => r[0] === "no").map((r) => r[1]).join(" "), title: "IELTS Writing Task 2: аргумент құрылымы" });
    });
  })();
  // Аргумент картасы
  function node(kind, text, cls) { return h("span", { class: "ie-node" + (text && text.trim() ? "" : " empty") + (cls ? " " + cls : "") }, h("b", null, kind), text && text.trim() ? text.trim() : "(әлі жазылмаған)"); }
  function paintMap() {
    const m = $("#wr-map"); m.textContent = "";
    const st = T2.stances.find((s) => s.id === A.stance);
    const ul = h("ul", null, h("li", null, node("Thesis" + (st ? " · " + st.en : ""), A.thesis, "thesis"),
      h("ul", null, ...[0, 1].map((pi) => { const p = A.p[pi] || {}; return h("li", null, node(`Claim ${pi + 1}`, p.claim), h("ul", null, h("li", null, node("Reason", p.reason)), h("li", null, node("Evidence", p.evidence)), h("li", null, node("Explanation", p.explain)))); }),
        A.counter.trim() || A.rebut.trim() ? h("li", null, node("Counter-argument", A.counter), h("ul", null, h("li", null, node("Rebuttal", A.rebut)))) : "")));
    m.append(ul);
  }
  // Абзац жоспары
  const PL = { intro: ["Introduction", () => A.thesis ? "Тезис: " + A.thesis : "Тақырыпты өз сөзіңізбен + тезис"], b0: ["Body 1", () => (A.p[0] || {}).claim || "1-тұжырым"], b1: ["Body 2", () => (A.p[1] || {}).claim || "2-тұжырым"], counter: ["Counter-argument + rebuttal", () => A.counter || "(міндетті емес)"], concl: ["Conclusion", () => "Позицияны қайталау, жаңа идеясыз"] };
  function paintPlan() {
    const ol = $("#wr-plan"); ol.textContent = "";
    if (!A.order || A.order.length !== 5) A.order = ["intro", "b0", "b1", "counter", "concl"];
    A.order.forEach((k, i) => {
      const [t, d] = PL[k];
      ol.append(h("li", null, h("span", null, h("b", null, `${i + 1}. ${t}`), h("small", { lang: "en" }, d())),
        h("span", { class: "ie-mv" }, h("button", { type: "button", "aria-label": `${t} жоғары`, disabled: i === 0, onclick: () => move(i, -1) }, "↑"), h("button", { type: "button", "aria-label": `${t} төмен`, disabled: i === A.order.length - 1, onclick: () => move(i, 1) }, "↓"))));
    });
    const note = $("#wr-plan-note"), o = A.order;
    const msgs = [];
    if (o[0] !== "intro") msgs.push("Кіріспе бірінші болмаса, оқырман позицияңызды кеш біледі.");
    if (o[o.length - 1] !== "concl") msgs.push("Қорытынды соңында болғаны қисынды.");
    if (A.counter.trim() && o.indexOf("counter") === 1) msgs.push("Қарсы пікірден бастау да мүмкін - бірақ оған бірден жауап беріңіз.");
    note.textContent = msgs.length ? msgs.join(" ") : "Рет қисынды. Бұл - ұсыныс: эссе құрылымы бір ғана үлгімен шектелмейді.";
  }
  function move(i, d) { const o = A.order; [o[i], o[i + d]] = [o[i + d], o[i]]; saveA(); paintPlan(); $$("#wr-plan button")[2 * (i + d) + (d < 0 ? 0 : 1)]?.focus(); }
  paintMap(); paintPlan();

  // Эссе редакторы
  const ed2 = editor($("#wr-ed2"), { key: "t2", target: 250, minutes: 40 });
  $("#wr-plan-insert").addEventListener("click", () => {
    const parts = A.order.map((k) => {
      if (k === "intro") return A.thesis;
      if (k === "b0" || k === "b1") { const p = A.p[+k[1]] || {}; return PARTS.map(([x]) => (p[x] || "").trim()).filter(Boolean).join(" "); }
      if (k === "counter") return [A.counter, A.rebut].map((x) => x.trim()).filter(Boolean).join(" ");
      return "In conclusion, ";
    }).filter((x) => x && x.trim());
    if (ed2.value.trim() && !confirm("Редакторда мәтін бар. Жоспарды соңына қосамыз ба?")) return;
    ed2.value = (ed2.value.trim() ? ed2.value.trim() + "\n\n" : "") + parts.join("\n\n");
    $("#wr-ins-msg").textContent = "Жоспар жоба ретінде қосылды. Енді оны толыққанды абзацтарға айналдырыңыз: байланыстырғыштар қосып, сөйлемдерді біріктіріңіз.";
  });

  /* ---------- Өзін-өзі тексеру (екі тапсырма) және автоматты бақылау ---------- */
  function checklist(mount, list, key, getText) {
    const S = store.get(`writing:${key}:chk`, {});
    const wrap = h("div", { class: "ie-crit" });
    list.forEach((c, ci) => {
      const fs = h("fieldset", null, h("legend", { lang: "en" }, c.c));
      const ul = h("ul", { class: "ie-chk" });
      c.q.forEach((q, qi) => {
        const id = `wr-${key}-c${ci}-${qi}`;
        const cb = h("input", { type: "checkbox", id, checked: !!S[id] });
        cb.addEventListener("change", () => { S[id] = cb.checked; store.set(`writing:${key}:chk`, S); });
        ul.append(h("li", null, cb, h("label", { for: id }, q)));
      });
      fs.append(ul);
      wrap.append(fs);
    });
    const auto = h("div", { "aria-live": "polite" });
    mount.append(wrap, h("div", { class: "lab-row" }, h("button", { type: "button", class: "btn secondary", onclick: () => analyse(getText(), auto) }, "Мәтінді автоматты бақылау")), auto);
    return () => Object.fromEntries(list.map((c, ci) => [c.c, c.q.map((q, qi) => ({ q, done: !!S[`wr-${key}-c${ci}-${qi}`] }))]));
  }
  function analyse(text, out) {
    const low = text.toLowerCase(), n = I.words(text);
    const sents = text.split(/(?<=[.!?])\s+/).filter((s) => I.words(s) > 0), lens = sents.map((s) => I.words(s));
    const links = W.linkers.filter((l) => new RegExp("\\b" + l + "\\b").test(low));
    const STOP = new Set("the a an and or of to in on for is are was were be been that this it as with by at from which who their they there these those than more most also can will would should not have has had its into such".split(" "));
    const freq = {}; (low.match(/[a-z']+/g) || []).forEach((w) => { if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
    const rep = Object.entries(freq).filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const paras = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    const R = [
      ["info", `Сөз: ${n}; абзац: ${paras}; сөйлем: ${sents.length}; орташа сөйлем ұзындығы: ${avg.toFixed(1)} сөз (ең қысқасы ${lens.length ? Math.min(...lens) : 0}, ең ұзыны ${lens.length ? Math.max(...lens) : 0}).`],
      [links.length >= 4 ? "ok" : "info", `Байланыстырғыштар (${links.length}): ${links.join(", ") || "жоқ"}. Coherence and Cohesion үшін маңыздысы - саны емес, орынды болуы.`],
      [rep.length ? "info" : "ok", rep.length ? `Жиі қайталанатын сөздер: ${rep.map(([w, c]) => `${w} ×${c}`).join(", ")}. Синоним не сілтеме (it, this) қолдануға бола ма?` : "Мазмұнды сөздердің артық қайталануы байқалмады."],
      [lens.length && Math.max(...lens) - Math.min(...lens) >= 8 ? "ok" : "info", "Сөйлем ұзындығының әртүрлілігі - күрделі және қарапайым құрылымдардың белгісі болуы мүмкін (тек белгі, грамматикалық дәлдікті тексермейді)."],
    ];
    if (/\b(dont|cant|wont|doesnt|isnt|didnt)\b/.test(low)) R.push(["no", "Апострофсыз қысқартулар бар (dont, cant): емлені тексеріңіз."]);
    if (/\b(don't|can't|won't|isn't|it's)\b/.test(low)) R.push(["info", "Қысқартулар (don't, it's) бар. Академиялық жазуда толық түрі (do not, it is) жиірек қолданылады."]);
    out.textContent = "";
    I.feedback(out, "info", "Автоматты бақылау - баға емес", "Бұл сандар тек мәтінге назар аудартады. AO17 band бағасын шығармайды: ресми бағаны тек сертификатталған емтихан алушы қояды.");
    out.append(h("ul", { class: "ie-rules" }, ...R.map(([k, x]) => h("li", { class: k }, x))));
  }
  const chk1 = checklist($("#wr-chk1"), W.checklist.task1, "t1", () => ed1.value);
  const chk2 = checklist($("#wr-chk2"), W.checklist.task2, "t2", () => ed2.value);

  /* ---------- Мұғалімге жіберу: экспорт ---------- */
  function bundle() {
    return {
      app: "AO17 IELTS Writing Studio", exported: new Date().toISOString(), note: "Тәжірибелік жұмыс. Ресми IELTS бағасы емес.",
      task1: { prompt: T1.prompt, plan: store.get("writing:t1plan", null), text: ed1.value, words: I.words(ed1.value), selfCheck: chk1() },
      task2: { prompt: T2.prompt, stance: A.stance, thesis: A.thesis, paragraphs: A.p, counter: A.counter, rebuttal: A.rebut, order: A.order, text: ed2.value, words: I.words(ed2.value), selfCheck: chk2() },
    };
  }
  const stamp = () => new Date().toISOString().slice(0, 10);
  $("#wr-exp-json").addEventListener("click", () => { I.download(`ao17-ielts-writing-${stamp()}.json`, JSON.stringify(bundle(), null, 2), "application/json"); $("#wr-exp-msg").textContent = "JSON файлы жүктелді. Оны мұғаліміңізге өзіңіз жіберіңіз (пошта, мессенджер)."; });
  $("#wr-exp-txt").addEventListener("click", () => {
    const b = bundle(), t2 = b.task2;
    const ck = (o) => Object.entries(o).map(([c, qs]) => `  ${c}:\n` + qs.map((x) => `    [${x.done ? "x" : " "}] ${x.q}`).join("\n")).join("\n");
    const txt = [`AO17 IELTS Writing Studio - ${new Date().toLocaleString("kk-KZ")}`, "Тәжірибелік жұмыс, ресми IELTS бағасы емес.", "",
      "=== TASK 1 ===", T1.prompt, "", b.task1.text || "(бос)", "", `Сөз саны: ${b.task1.words}`, "Өзін-өзі тексеру:", ck(b.task1.selfCheck), "",
      "=== TASK 2 ===", T2.prompt, "", "ЖОСПАР", `Позиция: ${t2.stance || "-"}`, `Тезис: ${t2.thesis || "-"}`,
      ...t2.paragraphs.map((p, i) => `Абзац ${i + 1}:\n  Claim: ${p.claim || "-"}\n  Reason: ${p.reason || "-"}\n  Evidence: ${p.evidence || "-"}\n  Explanation: ${p.explain || "-"}`),
      `Counter-argument: ${t2.counter || "-"}`, `Rebuttal: ${t2.rebuttal || "-"}`, `Абзац реті: ${t2.order.map((k) => PL[k][0]).join(" → ")}`, "",
      "ЭССЕ", t2.text || "(бос)", "", `Сөз саны: ${t2.words}`, "Өзін-өзі тексеру:", ck(t2.selfCheck), ""].join("\n");
    I.download(`ao17-ielts-writing-${stamp()}.txt`, txt, "text/plain");
    $("#wr-exp-msg").textContent = "TXT файлы жүктелді. Оны мұғаліміңізге өзіңіз жіберіңіз.";
  });
})();
