/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* AO17 IELTS Reading Test: 3 мәтін, 40 сұрақ, 60 минут.
   Test режимі: таймер (мерзімі localStorage-та - бет жаңартылса да жалғасады), мәтін қойындылары, 40 батырмалы навигатор,
   «кейін қарау» белгісі, мәтінді белгілеу (highlight); жауаптар тек соңында тексеріледі.
   Нәтиже: тек raw score (… / 40), мәтін және сұрақ түрі бойынша. Band-ке аудару ЖОҚ (ресми кесте емес).
   Екінші әрекет: қате сұрақтарды жауабын көрмей қайта шешу. Review режимі: әр жауап, дәлел-сөйлем мәтінде белгіленеді,
   тұзақтың түсіндірмесі, сұрақ түрі бойынша стратегия (AO17Tutor.hints). AO17Tutor.record - әр сұрақ, түріне қарай skill id. */
(() => {
  "use strict";
  const R = window.IELTS_RT, I = window.IELTS;
  if (!R || !I) return;
  const { $, $$, h, store } = I;
  const root = $("[data-ielts-rt]");
  if (!root) return;

  const SENT = {}; // «1C4» -> сөйлем
  R.passages.forEach((p) => p.paras.forEach((pa) => pa.s.forEach((s, i) => { SENT[p.n + pa.id + (i + 1)] = s; })));
  const PASS_WORDS = new Set(Object.values(SENT).join(" ").toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g));
  const ITEMS = []; // { g, it }
  R.groups.forEach((g) => g.items.forEach((it) => ITEMS.push({ g, it })));
  const byN = (n) => ITEMS.find((x) => x.it.n === n);
  const TEXT_T = new Set(["sent", "short", "diagram"]);
  const CHOICE = { tfng: ["TRUE", "FALSE", "NOT GIVEN"], ynng: ["YES", "NO", "NOT GIVEN"] };

  const blank = () => ({ answers: {}, flags: {}, cur: 1, deadline: 0, untimed: false, phase: "intro", first: null, second: null, reviewed: false, retry: null });
  let S = Object.assign(blank(), store.get("rt:state", {}));
  const save = () => store.set("rt:state", S);

  const intro = $("#rt-intro"), test = $("#rt-test"), result = $("#rt-result");
  const msg = $("#rt-msg");
  const say = (t) => { msg.textContent = t; };

  /* ---------------- Бағалау ---------------- */
  function judge(g, it, raw) {
    raw = raw == null ? "" : String(raw);
    if (!TEXT_T.has(g.type)) {
      if (!raw) return { ok: false, err: "blank" };
      return { ok: raw === it.a, err: raw === it.a ? "" : "wrong-" + raw.toLowerCase().replace(/\s+/g, "") };
    }
    const v = I.norm(raw), wc = I.words(raw);
    if (!v) return { ok: false, err: "blank" };
    if (wc > g.limit) return { ok: false, err: "word-limit", wc };
    if (it.a.includes(v)) return { ok: true, err: "" };
    if (it.wrong && it.wrong[v]) return { ok: false, err: "distractor" };
    if (it.a.some((a) => I.lev(v, a) <= 2)) return { ok: false, err: "spelling" };
    if (v.split(" ").some((w) => !PASS_WORDS.has(w))) return { ok: false, err: "not-from-passage" };
    return { ok: false, err: "wrong-word" };
  }
  const keyText = (g, it) => {
    if (TEXT_T.has(g.type)) return it.a[0];
    const opts = g.options || g.box || it.opts;
    const o = opts && opts.find((x) => x[0] === it.a);
    return o ? `${it.a} (${o[1]})` : it.a;
  };
  function explain(g, it, raw, j) {
    const ans = raw == null ? "" : String(raw);
    const key = keyText(g, it);
    if (j.ok) return { title: `${it.n}. Дұрыс - ${key}`, why: it.why };
    if (j.err === "blank") return { title: `${it.n}. Жауап берілмеді. Дұрысы: ${key}`, why: it.why + " Кеңес: Reading-те бос қалдырмаңыз - қате жауапқа балл кемімейді." };
    if (j.err === "word-limit") return { title: `${it.n}. Сөз шегінен асты (${j.wc} сөз). Дұрысы: ${key}`, why: `Нұсқау ${g.limit === 1 ? "ONE WORD ONLY" : "NO MORE THAN THREE WORDS AND/OR A NUMBER"} дейді. Шектен асса, мағынасы дұрыс болса да жауап қате саналады. ${it.why}` };
    let pre = "";
    if (TEXT_T.has(g.type)) {
      const v = I.norm(ans);
      if (j.err === "distractor") pre = it.wrong[v] + " ";
      else if (j.err === "spelling") pre = `Емле қатесі: «${ans.trim()}» ≠ «${it.a[0]}». Сөз мәтіннен дәл көшірілуі керек. `;
      else if (j.err === "not-from-passage") pre = `«${ans.trim()}» сөзі мәтінде кездеспейді: жауап мәтіннен алынуы керек. `;
      else pre = "Бұл сөз мәтінде бар, бірақ бос орынның мағынасына сай емес. ";
    } else if (it.trap && it.trap[ans]) pre = it.trap[ans] + " ";
    else if (g.type === "para") pre = `${ans} абзацында бұл ақпараттың тек кілт сөзі болуы мүмкін - ақпарат түрін (себеп, сипаттама, мысал) тексеріңіз. `;
    return { title: `${it.n}. Сіз: ${ans}. Дұрысы: ${key}`, why: pre + it.why };
  }

  /* ---------------- 1. Мәтіндер және белгілеу ---------------- */
  const passBox = $("#rt-passage");
  const HL = store.get("rt:hl", {});
  function paintSentence(span) {
    const text = SENT[span.dataset.s];
    const ranges = (HL[span.dataset.s] || []).slice().sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r.slice()); }
    if (merged.length) HL[span.dataset.s] = merged; else delete HL[span.dataset.s];
    span.textContent = "";
    let pos = 0;
    for (const [a, b] of merged) {
      if (a > pos) span.append(text.slice(pos, a));
      span.append(h("mark", { class: "ie-hl", title: "Белгіні алу үшін басыңыз" }, text.slice(a, b)));
      pos = b;
    }
    if (pos < text.length) span.append(text.slice(pos));
  }
  R.passages.forEach((p) => {
    const art = h("article", { class: "rt-passage", id: "rt-p" + p.n, "data-p": p.n, hidden: p.n !== 1, "aria-labelledby": "rt-pt" + p.n },
      h("p", { class: "rt-pk" }, `Reading Passage ${p.n}`),
      h("h3", { class: "ie-ptitle", id: "rt-pt" + p.n }, p.title));
    p.paras.forEach((pa) => {
      art.append(h("div", { class: "ie-para" },
        h("span", { class: "ie-plet", "aria-hidden": "true" }, pa.id),
        h("p", { class: "lab-text", "aria-label": `Абзац ${pa.id}` },
          ...pa.s.flatMap((s, i) => [h("span", { class: "ie-s", "data-s": p.n + pa.id + (i + 1), id: "rt-s-" + p.n + pa.id + (i + 1), tabindex: "-1" }), " "]))));
    });
    passBox.append(art);
  });
  $$(".ie-s", passBox).forEach(paintSentence);

  const hlBtn = $("#rt-hl");
  hlBtn.addEventListener("mousedown", (e) => e.preventDefault());
  hlBtn.addEventListener("click", () => {
    const sel = getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) { say("Алдымен мәтіннен сөзді не сөз тіркесін таңдаңыз, сосын «Белгілеу» батырмасын басыңыз."); return; }
    const r = sel.getRangeAt(0);
    if (!passBox.contains(r.commonAncestorContainer)) { say("Белгілеуге тек оқу мәтіні жатады."); return; }
    let n = 0;
    $$(".ie-s", passBox).forEach((span) => {
      if (!r.intersectsNode(span)) return;
      const len = SENT[span.dataset.s].length;
      let a = 0, b = len;
      if (span.contains(r.startContainer)) { const pre = document.createRange(); pre.selectNodeContents(span); pre.setEnd(r.startContainer, r.startOffset); a = pre.toString().length; }
      if (span.contains(r.endContainer)) { const p2 = document.createRange(); p2.selectNodeContents(span); p2.setEnd(r.endContainer, r.endOffset); b = p2.toString().length; }
      if (b > a) { (HL[span.dataset.s] = HL[span.dataset.s] || []).push([a, b]); paintSentence(span); n++; }
    });
    sel.removeAllRanges(); store.set("rt:hl", HL);
    say(n ? "Белгіленді. Белгіні алу үшін оны басыңыз." : "Таңдалған жерде мәтін жоқ.");
  });
  $("#rt-hl-clear").addEventListener("click", () => { Object.keys(HL).forEach((k) => delete HL[k]); store.set("rt:hl", HL); $$(".ie-s", passBox).forEach(paintSentence); say("Барлық белгі өшірілді."); });
  passBox.addEventListener("click", (e) => {
    const m = e.target.closest("mark.ie-hl"); if (!m) return;
    const span = m.closest(".ie-s"); let pos = 0;
    for (const node of span.childNodes) { const L = node.textContent.length; if (node === m) { HL[span.dataset.s] = (HL[span.dataset.s] || []).filter((r) => !(r[0] === pos && r[1] === pos + L)); break; } pos += L; }
    paintSentence(span); store.set("rt:hl", HL); say("Белгі алынды.");
  });

  /* ---------------- 2. Сұрақтар ---------------- */
  const qBox = $("#rt-questions");
  const CTL = {}; // n -> { get(), set(v), disable(b), fb, li }
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, ...kids) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); kids.forEach((k) => e.append(k)); return e; };

  function onAnswer(n, v) {
    if (S.phase !== "test") return;
    if (S.retry && !S.retry.includes(n)) return;
    const store2 = S.retry ? (S.retryAns = S.retryAns || {}) : S.answers;
    if (v === "" || v == null) delete store2[n]; else store2[n] = v;
    save(); paintNav();
  }
  function flagBtn(n) {
    const b = h("button", { type: "button", class: "rt-flagb", "aria-pressed": String(!!S.flags[n]), "aria-label": `${n}-сұрақты кейін қарау үшін белгілеу` }, "⚑ кейін қарау");
    b.addEventListener("click", () => { S.flags[n] = !S.flags[n]; if (!S.flags[n]) delete S.flags[n]; b.setAttribute("aria-pressed", String(!!S.flags[n])); save(); paintNav(); });
    return b;
  }
  const qHead = (n) => h("span", { class: "rt-qn", "aria-hidden": "true" }, String(n));

  function diagramSVG() {
    // Тұман жинағыштың схемасы: mesh (23) → gutter (24) → pipe → filter (25) → tank (26) → homes
    const W = 640, H = 300;
    const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-labelledby": "rt-dg-t rt-dg-d" },
      sv("title", { id: "rt-dg-t" }, "Fog collector diagram"),
      sv("desc", { id: "rt-dg-d" }, "Wind carries fog from the left into a vertical panel numbered 23 held by two posts. Below it is a channel numbered 24. A pipe runs downhill to a box numbered 25 marked sand and gravel, then to a storage container numbered 26, then to houses at the bottom right."));
    const g = sv("g", { "font-size": "15" });
    // жел мен тұман
    [70, 110, 150].forEach((y) => g.append(sv("path", { d: `M20 ${y} q20 -10 40 0 t40 0`, fill: "none", stroke: "var(--lab-chalk2)", "stroke-width": "2", "stroke-dasharray": "4 5" })));
    g.append(sv("text", { x: 20, y: 46 }, "fog + wind →"));
    // бағандар мен тор
    g.append(sv("line", { x1: 130, y1: 40, x2: 130, y2: 210, stroke: "var(--lab-chalk)", "stroke-width": "4" }));
    g.append(sv("line", { x1: 290, y1: 40, x2: 290, y2: 210, stroke: "var(--lab-chalk)", "stroke-width": "4" }));
    const mesh = sv("g", { stroke: "var(--lab-chalk2)", "stroke-width": "1" });
    for (let x = 140; x <= 280; x += 14) mesh.append(sv("line", { x1: x, y1: 50, x2: x, y2: 170 }));
    for (let y = 50; y <= 170; y += 14) mesh.append(sv("line", { x1: 132, y1: y, x2: 288, y2: y }));
    g.append(mesh);
    g.append(sv("text", { x: 300, y: 70, fill: "var(--lab-gold)", "font-weight": "700" }, "23 ………"));
    g.append(sv("text", { x: 300, y: 90, "font-size": "13" }, "droplets stick, merge"));
    // науа
    g.append(sv("path", { d: "M132 176 h156 v12 h-156 z", fill: "none", stroke: "var(--lab-gold)", "stroke-width": "2.5" }));
    g.append(sv("text", { x: 300, y: 188, fill: "var(--lab-gold)", "font-weight": "700" }, "24 ………"));
    // құбыр
    g.append(sv("path", { d: "M280 188 C 320 240, 360 250, 400 250", fill: "none", stroke: "var(--lab-chalk)", "stroke-width": "3" }));
    g.append(sv("text", { x: 318, y: 228, "font-size": "13" }, "pipe"));
    // сүзгі
    g.append(sv("rect", { x: 400, y: 228, width: 64, height: 44, rx: 6, fill: "none", stroke: "var(--lab-gold)", "stroke-width": "2.5" }));
    for (let i = 0; i < 9; i++) g.append(sv("circle", { cx: 410 + (i % 5) * 11, cy: 244 + Math.floor(i / 5) * 14, r: 3, fill: "var(--lab-chalk2)" }));
    g.append(sv("text", { x: 400, y: 220, fill: "var(--lab-gold)", "font-weight": "700" }, "25 ………"));
    g.append(sv("text", { x: 388, y: 292, "font-size": "12" }, "sand and gravel"));
    g.append(sv("line", { x1: 464, y1: 250, x2: 494, y2: 250, stroke: "var(--lab-chalk)", "stroke-width": "3" }));
    // резервуар
    g.append(sv("rect", { x: 494, y: 214, width: 64, height: 60, rx: 8, fill: "none", stroke: "var(--lab-gold)", "stroke-width": "2.5" }));
    g.append(sv("text", { x: 486, y: 206, fill: "var(--lab-gold)", "font-weight": "700" }, "storage 26 ……"));
    // үйлер
    g.append(sv("line", { x1: 558, y1: 262, x2: 590, y2: 262, stroke: "var(--lab-chalk)", "stroke-width": "3" }));
    g.append(sv("path", { d: "M592 282 v-20 l14 -12 l14 12 v20 z", fill: "none", stroke: "var(--lab-chalk)", "stroke-width": "2" }));
    g.append(sv("text", { x: 560, y: 160, "font-size": "13" }, "downhill"));
    g.append(sv("text", { x: 560, y: 176, "font-size": "13" }, "to homes"));
    s.append(g);
    return h("figure", { class: "lab-board rt-diagram", lang: "en", tabindex: "0", "aria-label": "Fog collector diagram (Questions 23-26)" }, s);
  }

  R.groups.forEach((g, gi) => {
    const sec = h("section", { class: "ie-group rt-group", "data-p": g.passage, "data-type": g.type, id: "rt-g" + gi, "aria-labelledby": "rt-gh" + gi, hidden: g.passage !== 1 });
    sec.append(h("h3", { id: "rt-gh" + gi }, `Questions ${g.from}-${g.to}`, h("small", { class: "rt-gtype" }, " · " + R.typeNames[g.type])),
      h("p", { class: "ie-instr", lang: "en" }, g.instr));
    if (g.options) sec.append(h("div", { class: "ie-headlist", lang: "en" }, h("p", { class: "ie-hl-cap" }, g.optTitle),
      h("ul", { class: "ie-roman" }, ...g.options.map(([k, t]) => h("li", null, h("b", null, k + "  "), t)))));
    if (g.type === "diagram") sec.append(diagramSVG());
    const list = h("ol", { class: "ie-qlist" });
    if (g.type === "sumbox") {
      sec.append(h("div", { class: "ie-headlist", lang: "en" }, h("p", { class: "ie-hl-cap" }, "Word box"),
        h("ul", { class: "rt-box" }, ...g.box.map(([k, t]) => h("li", null, h("b", null, k), " " + t)))));
      const para = h("p", { class: "ie-summary lab-text rt-sumtext", lang: "en" });
      g.text.split(/\{(\d+)\}/).forEach((part, i) => {
        if (i % 2 === 0) { para.append(part); return; }
        const n = +part, it = g.items.find((x) => x.n === n);
        const sel = h("select", { class: "ie-sel rt-inl", id: "rt-a" + n, "aria-label": `${n}-бос орын` }, h("option", { value: "" }, "…"), ...g.box.map(([k, t]) => h("option", { value: k }, `${k} ${t}`)));
        sel.addEventListener("change", () => onAnswer(n, sel.value));
        const fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
        const li = h("li", { class: "ie-q rt-q", value: String(n), id: "rt-q" + n, "data-n": n }, h("span", { class: "ie-qt" }, `${n}-бос орын`), " ", flagBtn(n), fb);
        list.append(li);
        CTL[n] = { get: () => sel.value, set: (v) => { sel.value = v || ""; }, disable: (b) => { sel.disabled = b; }, fb, li, focus: () => sel.focus(), mark: (ok) => { sel.classList.toggle("ok", ok === true); sel.classList.toggle("no", ok === false); } };
        para.append(h("span", { class: "ie-gapw" }, h("b", { class: "ie-gapn", "aria-hidden": "true" }, String(n)), sel));
        void it;
      });
      sec.append(para);
    } else g.items.forEach((it) => {
      const n = it.n, fb = h("div", { class: "ie-qfb", "aria-live": "polite" });
      const li = h("li", { class: "ie-q rt-q", value: String(n), id: "rt-q" + n, "data-n": n });
      let ctl;
      if (CHOICE[g.type]) {
        let pick = "";
        const grp = h("div", { class: "lab-choice", role: "group", "aria-label": `${n}-сұраққа жауап` });
        CHOICE[g.type].forEach((v) => grp.append(h("button", { type: "button", "aria-pressed": "false", "data-v": v, onclick: () => { if (S.phase !== "test" || grp.dataset.off) return; ctl.set(v); onAnswer(n, v); } }, v)));
        li.append(h("p", { class: "ie-qt", lang: "en" }, it.q), grp);
        ctl = { get: () => pick, set: (v) => { pick = v || ""; $$("button", grp).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === pick))); },
          disable: (b) => { if (b) grp.dataset.off = "1"; else delete grp.dataset.off; $$("button", grp).forEach((x) => { x.disabled = b; }); }, focus: () => $("button", grp).focus(),
          mark: (ok) => $$("button", grp).forEach((b) => { b.classList.toggle("ok", ok != null && b.dataset.v === it.a); b.classList.toggle("no", ok === false && b.dataset.v === pick); }) };
      } else if (g.type === "mc") {
        const fs = h("fieldset", { class: "ie-mcq rt-mc" }, h("legend", { lang: "en" }, it.q));
        const ul = h("ul", { class: "ie-mc", lang: "en" });
        it.opts.forEach(([k, t]) => {
          const id = `rt-a${n}-${k}`, inp = h("input", { type: "radio", name: "rt-a" + n, id, value: k });
          inp.addEventListener("change", () => onAnswer(n, k));
          ul.append(h("li", null, h("label", { for: id }, inp, h("b", null, k), " " + t)));
        });
        fs.append(ul); li.append(fs);
        const radios = () => $$("input", ul);
        ctl = { get: () => (radios().find((r) => r.checked) || {}).value || "", set: (v) => radios().forEach((r) => { r.checked = r.value === v; }), disable: (b) => radios().forEach((r) => { r.disabled = b; }), focus: () => radios()[0].focus(),
          mark: (ok) => radios().forEach((r) => { const l = r.closest("label"); l.classList.toggle("ok", ok != null && r.value === it.a); l.classList.toggle("rt-no", ok === false && r.checked); }) };
      } else if (TEXT_T.has(g.type)) {
        const inp = h("input", { type: "text", class: "ie-gap rt-txt", id: "rt-a" + n, autocomplete: "off", autocapitalize: "off", spellcheck: "false", lang: "en" });
        inp.addEventListener("input", () => onAnswer(n, inp.value));
        if (g.type === "short") li.append(h("label", { class: "ie-qt", for: inp.id, lang: "en" }, it.q), h("br"), inp);
        else {
          const [a, b] = it.q.split("____");
          li.append(h("span", { class: "ie-qt", lang: "en" }, a, h("label", { class: "ie-sr", for: inp.id }, `${n}-бос орын`), inp, b));
        }
        ctl = { get: () => inp.value, set: (v) => { inp.value = v || ""; }, disable: (b) => { inp.disabled = b; }, focus: () => inp.focus(), mark: (ok) => { inp.classList.toggle("ok", ok === true); inp.classList.toggle("no", ok === false); } };
      } else {
        const letters = g.letters ? g.letters.split("") : g.options.map((o) => o[0]);
        const sel = h("select", { class: "ie-sel", id: "rt-a" + n }, h("option", { value: "" }, "- таңдаңыз -"), ...letters.map((k) => h("option", { value: k }, g.letters ? `Paragraph ${k}` : `${k}`)));
        sel.addEventListener("change", () => onAnswer(n, sel.value));
        li.append(h("label", { class: "ie-qt", for: sel.id, lang: "en" }, it.q), sel);
        ctl = { get: () => sel.value, set: (v) => { sel.value = v || ""; }, disable: (b) => { sel.disabled = b; }, focus: () => sel.focus(), mark: (ok) => { sel.classList.toggle("ok", ok === true); sel.classList.toggle("no", ok === false); } };
      }
      li.append(flagBtn(n), fb);
      list.append(li);
      CTL[n] = Object.assign(ctl, { fb, li });
    });
    sec.append(list);
    const hintEl = h("div", { class: "rt-strat", hidden: true });
    sec.append(hintEl);
    g._hint = hintEl;
    qBox.append(sec);
  });

  /* ---------------- 3. Навигатор және мәтін ауыстыру ---------------- */
  const nav = $("#rt-nav");
  const NB = {};
  R.passages.forEach((p) => {
    const row = h("div", { class: "rt-navrow" }, h("span", { class: "rt-navp" }, `Passage ${p.n}`));
    ITEMS.filter((x) => x.g.passage === p.n).forEach(({ it }) => {
      const b = h("button", { type: "button", class: "rt-nb", "data-n": it.n, onclick: () => goQ(it.n) }, String(it.n));
      NB[it.n] = b; row.append(b);
    });
    nav.append(row);
  });
  const ptabs = $$("#rt-ptabs button");
  function showPassage(pn) {
    S.cur = pn; save();
    $$(".rt-passage", passBox).forEach((a) => { a.hidden = +a.dataset.p !== pn; });
    $$(".rt-group", qBox).forEach((s) => { s.hidden = +s.dataset.p !== pn; });
    ptabs.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.p === pn)));
    $("#rt-prev").disabled = pn === 1; $("#rt-next").disabled = pn === 3;
    const pp = $(".ie-pass-pane", test); if (pp) pp.scrollTop = 0;
  }
  ptabs.forEach((b) => b.addEventListener("click", () => showPassage(+b.dataset.p)));
  $("#rt-prev").addEventListener("click", () => { showPassage(S.cur - 1); $("#rt-pt" + S.cur).scrollIntoView({ block: "start" }); });
  $("#rt-next").addEventListener("click", () => { showPassage(S.cur + 1); $("#rt-pt" + S.cur).scrollIntoView({ block: "start" }); });
  function goQ(n) {
    const { g } = byN(n);
    if (g.passage !== S.cur) showPassage(g.passage);
    const li = CTL[n].li;
    li.scrollIntoView({ block: "center", behavior: I.reduced() ? "auto" : "smooth" });
    if (S.phase === "test" && (!S.retry || S.retry.includes(n))) CTL[n].focus(); else { li.tabIndex = -1; li.focus({ preventScroll: true }); }
  }
  const curAns = (n) => (S.retry ? (S.retryAns || {})[n] : S.answers[n]);
  function paintNav() {
    let done = 0;
    ITEMS.forEach(({ it }) => {
      const b = NB[it.n], v = curAns(it.n), has = v != null && String(v).trim() !== "";
      if (has) done++;
      b.classList.toggle("on", has); b.classList.toggle("flag", !!S.flags[it.n]);
      const res = S.phase === "review" ? S.first[it.n] : null;
      b.classList.toggle("ok", !!(res && res.ok)); b.classList.toggle("no", !!(res && !res.ok));
      const off = S.phase === "test" && S.retry && !S.retry.includes(it.n);
      b.classList.toggle("off", !!off);
      b.setAttribute("aria-label", `${it.n}-сұрақ: ` + (res ? (res.ok ? "дұрыс" : "қате") : has ? "жауап берілді" : "жауап жоқ") + (S.flags[it.n] ? ", кейін қарауға белгіленген" : ""));
    });
    const total = S.retry ? S.retry.length : 40;
    $("#rt-count").textContent = S.phase === "review" ? "Review режимі" : `Жауап берілді: ${done} / ${total}`;
  }

  /* ---------------- 4. Таймер ---------------- */
  const tEl = $("#rt-timer");
  let tid = null, warned = {};
  function tick() {
    if (S.phase !== "test" || S.untimed || S.retry) { tEl.textContent = S.retry ? "қайта шешу" : "таймерсіз"; tEl.classList.remove("low"); return; }
    const left = Math.max(0, Math.round((S.deadline - Date.now()) / 1000));
    tEl.textContent = I.fmt(left);
    tEl.classList.toggle("low", left <= 300);
    for (const m of [10, 5, 1]) if (left <= m * 60 && left > m * 60 - 2 && !warned[m]) { warned[m] = 1; say(`${m} минут қалды.`); }
    if (left <= 0) { submit(true); }
  }
  function startClock() { clearInterval(tid); tid = setInterval(tick, 1000); tick(); }

  /* ---------------- 5. Режимдер ---------------- */
  function applyAnswers() {
    ITEMS.forEach(({ it }) => {
      const c = CTL[it.n];
      c.set(S.retry && S.retry.includes(it.n) ? (S.retryAns || {})[it.n] : S.answers[it.n]);
      c.mark(null); c.fb.textContent = ""; c.fb.className = "ie-qfb";
      c.disable(S.phase !== "test" || !!(S.retry && !S.retry.includes(it.n)));
      c.li.classList.toggle("rt-locked", !!(S.phase === "test" && S.retry && !S.retry.includes(it.n)));
    });
    $$(".ie-s", passBox).forEach((s) => { s.classList.remove("ie-ev", "ie-ev-bad"); s.removeAttribute("data-qlabel"); delete s.dataset.q; });
    R.groups.forEach((g) => { g._hint.hidden = true; });
  }
  function show(phase) {
    S.phase = phase; save();
    intro.hidden = phase !== "intro";
    test.hidden = !(phase === "test" || phase === "review");
    result.hidden = phase !== "result";
    test.classList.toggle("rt-review", phase === "review");
    $("#rt-finish").hidden = phase !== "test";
    tEl.hidden = phase !== "test";
    if (phase !== "test") say("");
    $("#rt-tores").hidden = phase !== "review";
    $("#rt-mode").textContent = phase === "review" ? "Review: жауаптар мен дәлелдер" : S.retry ? "Екінші әрекет: тек қате сұрақтар" : "Test режимі";
    if (phase === "test" || phase === "review") { applyAnswers(); showPassage(S.cur || 1); }
    if (phase === "review") paintReview();
    if (phase === "result") paintResult();
    if (phase === "intro") paintIntro();
    paintNav();
    startClock();
  }
  function paintIntro() {
    const has = Object.keys(S.answers).length;
    $("#rt-resume").hidden = !(S.deadline && has && !S.first);
  }
  $("#rt-start").addEventListener("click", () => {
    const untimed = $("#rt-untimed").checked;
    S = blank(); S.untimed = untimed; S.deadline = Date.now() + R.minutes * 60000; S.phase = "test"; warned = {};
    save(); show("test"); $("#rt-pt1").scrollIntoView({ block: "start" }); say(untimed ? "Таймерсіз жаттығу басталды." : "Сынақ басталды: 60 минут.");
  });
  $("#rt-resume").addEventListener("click", () => show("test"));

  function score(ansMap, ns) {
    const res = {};
    ns.forEach((n) => { const { g, it } = byN(n); res[n] = Object.assign(judge(g, it, ansMap[n]), { v: ansMap[n] == null ? "" : ansMap[n] }); });
    return res;
  }
  function submit(auto) {
    if (S.phase !== "test") return;
    if (S.retry) {
      const res = score(S.retryAns || {}, S.retry);
      S.second = res;
      S.retry.forEach((n) => { const { g, it } = byN(n); I.record(g.skill, { item: "rt" + n + "-2", ok: res[n].ok, hints: 1, error: res[n].err, note: "екінші әрекет", title: "IELTS Reading Test: " + R.typeNames[g.type] }); });
      S.retry = null; S.retryAns = null; save(); show("result"); return;
    }
    if (!auto) {
      const missing = ITEMS.filter(({ it }) => S.answers[it.n] == null || String(S.answers[it.n]).trim() === "").length;
      if (missing && !confirm(`${missing} сұраққа жауап берілмеген. Сынақты аяқтап, тексереміз бе?`)) return;
    }
    const res = score(S.answers, ITEMS.map((x) => x.it.n));
    S.first = res; S.autoEnded = !!auto;
    S.usedSec = S.untimed ? null : Math.min(R.minutes * 60, Math.round((Date.now() - (S.deadline - R.minutes * 60000)) / 1000));
    ITEMS.forEach(({ g, it }) => I.record(g.skill, { item: "rt" + it.n, ok: res[it.n].ok, hints: 0, error: res[it.n].err, note: it.why.slice(0, 160), title: "IELTS Reading Test: " + R.typeNames[g.type] }));
    save(); show("result");
    if (auto) say("Уақыт бітті - жауаптар автоматты түрде тексерілді.");
  }
  $("#rt-finish").addEventListener("click", () => submit(false));

  function paintResult() {
    const F = S.first; if (!F) { show("intro"); return; }
    const ok = Object.values(F).filter((x) => x.ok).length;
    $("#rt-raw").textContent = `${ok} / 40`;
    $("#rt-res-note").textContent = (S.autoEnded ? "Уақыт бітіп, сынақ автоматты аяқталды. " : "") + (S.usedSec != null ? `Жұмсалған уақыт: ${I.fmt(S.usedSec)}. ` : "Таймерсіз жаттығу. ") + "Бұл - raw score (дұрыс жауап саны). AO17 оны band-ке аудармайды: ресми аудару кестесі сынақтан сынаққа өзгеруі мүмкін және бұл - ресми сынақ емес.";
    const tb = $("#rt-bypass"); tb.textContent = "";
    R.passages.forEach((p) => { const ns = ITEMS.filter((x) => x.g.passage === p.n).map((x) => x.it.n); tb.append(h("tr", null, h("th", { scope: "row" }, `Passage ${p.n}: ${p.title}`), h("td", null, `${ns.filter((n) => F[n].ok).length} / ${ns.length}`))); });
    const tt = $("#rt-bytype"); tt.textContent = "";
    Object.keys(R.typeNames).forEach((t) => {
      const ns = ITEMS.filter((x) => x.g.type === t).map((x) => x.it.n); if (!ns.length) return;
      const k = ns.filter((n) => F[n].ok).length;
      tt.append(h("tr", { class: k === ns.length ? "rt-full" : "" }, h("th", { scope: "row", lang: "en" }, R.typeNames[t]), h("td", null, `${k} / ${ns.length}`), h("td", null, ns.map((n) => (F[n].ok ? "" : "№" + n)).filter(Boolean).join(" ") || "✓")));
    });
    const wrong = ITEMS.filter(({ it }) => !F[it.n].ok).map((x) => x.it.n);
    const sb = $("#rt-second");
    sb.hidden = !wrong.length || S.reviewed || !!S.second;
    sb.textContent = `Қате ${wrong.length} сұрақты жауабын көрмей қайта шешу`;
    const s2 = $("#rt-second-res");
    if (S.second) { const k = Object.values(S.second).filter((x) => x.ok).length; I.feedback(s2, k === Object.keys(S.second).length ? "ok" : "info", `Екінші әрекет: ${k} / ${Object.keys(S.second).length} түзетілді`, "Бірінші нәтиже (raw score) өзгермейді - емтиханда екінші мүмкіндік жоқ. Бірақ қайта тауып түзеткеніңіз - стратегияның жұмыс істегенінің белгісі. Енді Review-дан дәлелдерді қараңыз."); }
    else { s2.textContent = ""; s2.className = ""; }
  }
  $("#rt-second").addEventListener("click", () => {
    S.retry = ITEMS.filter(({ it }) => !S.first[it.n].ok).map((x) => x.it.n); S.retryAns = {};
    const first = byN(S.retry[0]).g.passage; S.cur = first;
    show("test"); say("Екінші әрекет: тек қате сұрақтар ашық. Дұрыс жауаптар әзірге көрсетілмейді.");
  });
  $("#rt-review").addEventListener("click", () => { S.reviewed = true; S.cur = 1; show("review"); $("#rt-pt1").scrollIntoView({ block: "start" }); });
  $("#rt-tores").addEventListener("click", () => show("result"));
  $$(".rt-restart").forEach((b) => b.addEventListener("click", () => { if (!confirm("Жаңа сынақ бастаймыз ба? Қазіргі жауаптар өшеді (белгілер сақталады).")) return; S = blank(); save(); show("intro"); intro.scrollIntoView({ block: "start" }); }));

  function goEvidence(id) {
    const pn = +id[0]; if (pn !== S.cur) showPassage(pn);
    const s = $("#rt-s-" + id); if (!s) return;
    s.scrollIntoView({ block: "center", behavior: I.reduced() ? "auto" : "smooth" });
    s.classList.remove("ie-flash"); void s.offsetWidth; s.classList.add("ie-flash");
    s.focus({ preventScroll: true });
  }
  function paintReview() {
    const F = S.first;
    ITEMS.forEach(({ g, it }) => {
      const r = F[it.n], c = CTL[it.n];
      c.set(r.v); c.mark(r.ok);
      const ex = explain(g, it, r.v, r);
      I.feedback(c.fb, r.ok ? "ok" : "bad", ex.title, ex.why);
      it.ev.forEach((id) => {
        const s = $("#rt-s-" + id); if (!s) return;
        s.classList.add("ie-ev"); if (!r.ok) s.classList.add("ie-ev-bad");
        const tags = s.dataset.q ? s.dataset.q.split(",") : [];
        if (!tags.includes(String(it.n))) tags.push(String(it.n));
        s.dataset.q = tags.join(","); s.setAttribute("data-qlabel", tags.map((t) => "№" + t).join(" "));
        if (tags.some((t) => !F[t].ok)) s.classList.add("ie-ev-bad"); else s.classList.remove("ie-ev-bad");
      });
      c.fb.append(h("div", { class: "lab-row" }, ...it.ev.map((id) => h("button", { type: "button", class: "ie-evbtn", onclick: () => goEvidence(id) }, `Дәлел: ${id.slice(1, 2)} абзацы, ${id.slice(2)}-сөйлем`))));
      if (it.ng) c.fb.append(h("p", { class: "lab-meta" }, "NOT GIVEN: белгіленген - оқушы іздейтін ең жақын сөйлем; онда тұжырымның шешуші бөлігі жоқ."));
    });
    R.groups.forEach((g) => {
      if (g._hint.dataset.ready) { g._hint.hidden = false; return; }
      g._hint.dataset.ready = "1"; g._hint.hidden = false;
      g._hint.append(h("p", { class: "lab-meta" }, h("b", null, "Стратегия: "), R.typeNames[g.type]));
      const box = h("div"); g._hint.append(box);
      if (window.AO17Tutor) AO17Tutor.hints(box, R.strategy[g.type]);
    });
  }

  paintIntro();
  show(S.phase === "test" && !S.first && !S.deadline ? "intro" : S.phase || "intro");
})();
