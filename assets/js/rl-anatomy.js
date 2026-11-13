/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Сұрақ анатомиясы» (sat.reality.anatomy): Digital SAT үлгісіндегі сұрақты бөлшектеу сабағы - AO17 Reality Engine.
   Мазмұн (сұрақтар, тұзақ түрлері, түсіндірмелер) assets/data/rl-anatomy.js ішінде; мұнда тек көрсету мен тексеру логикасы.
   Кезеңдер: intro (жылдам жауап → ажырататын бөлікті табу) → concept (AO17Reality.player-мен бөлшектеу анимациясы)
   → guided (бөліктерді белгілеу, жауап, әр қате нұсқаның тұзағы) → explore (сұрақ сөйлеміндегі бір сөзді ауыстыру)
   → checkpoint (үш деңгейлі көмегі бар тексеру) → mistakes (қате шешімді талдау) → mastery (жаңа сұрақтар, көмексіз). */
(() => {
  "use strict";
  const root = document.getElementById("an-root"), R = window.AO17Reality, D = window.RL_ANATOMY;
  if (!root || !R || !D) return;
  const T = window.AO17Tutor, el = R.el, Q = D.questions, ABC = "ABCD";
  const say = (box, kind, title, why) => {
    if (T) return T.feedback(box, kind, title, why);
    box.className = "tt-fb tt-" + kind; box.textContent = title + (why ? " " + why : "");
  };
  const group = (cls, label) => { const g = el("div", cls); g.setAttribute("role", "group"); g.setAttribute("aria-label", label); return g; };
  const btn = (cls, text) => { const b = el("button", cls, text); b.type = "button"; return b; };
  const en = (node) => { node.lang = "en"; return node; };

  /** Сұрақты бөліктерге бөліп салу. onSeg берілсе, рөлі бар бөліктер батырма болады. */
  function qView(q, onSeg) {
    const box = en(el("div", "an-q")), pass = q.kind === "rw" ? el("div", "an-pass") : null, stem = el("p", "an-stem"), segs = [];
    q.segs.forEach((s, i) => {
      let n;
      if (s.role && onSeg) { n = btn("an-seg", s.t); n.setAttribute("aria-pressed", "false"); n.addEventListener("click", () => onSeg(i, n)); }
      else n = el("span", s.role ? "an-seg" : "an-fill", s.t);
      n.dataset.i = i;
      (pass && s.role === "given" ? pass : stem).append(n, " ");
      segs[i] = n;
    });
    if (pass) box.append(pass);
    box.append(stem);
    return { box, segs, stem };
  }
  const tagSeg = (n, role) => { n.classList.add("ok", "an-r-" + role); const t = el("span", "an-tag", D.roles[role].short); t.lang = "kk"; n.append(" ", t); };

  /** Жауап нұсқалары (батырмалар). */
  function choiceButtons(texts, onPick) {
    const g = group("gd-opts an-opts", "Жауап нұсқалары");
    const bs = texts.map((t, j) => { const b = en(btn("", `${ABC[j]}. ${t}`)); b.dataset.c = j; b.addEventListener("click", () => onPick(j, b)); g.append(b); return b; });
    return { g, bs };
  }

  /** Бір әрекет бірлігін Tutor-ға жазу: бірінші қате бірден жазылады; қатесіз шешілсе - дұрыс деп жазылады. */
  function unit(ctx, stats, item) {
    let bad = false;
    return {
      bad(error, note) { stats.wrong++; if (!bad) { bad = true; ctx.record(false, { item, error, note }); } },
      good() { stats.units++; if (!bad) { stats.first++; ctx.record(true, { item }); } },
    };
  }

  /** Толық бөлшектеу: 1) бөліктерді белгілеу, 2) жауапты таңдау, 3) әр қате нұсқаның тұзағын анықтау.
      o: { title, guided (нұсқау мен бөліктің түсіндірмесі), note (ctx.note-ты жаңарту), stats, tick, onDone } */
  function dissect(host, q, ctx, o) {
    const card = el("section", "an-card"); card.dataset.q = q.id;
    const h = el("h3", "an-h", o.title); card.append(h); host.append(card);
    const real = el("p", "an-real");
    const setReal = (t) => { real.textContent = ""; real.append(el("b", "", "Сұрақ шынында не сұрайды: "), document.createTextNode(t)); if (o.note) ctx.note(t); };
    const traps = D.traps[q.kind], roles = D.roles, need = q.segs.filter((s) => s.role).length;
    let sel = -1, have = 0;
    const got = {}, uLab = unit(ctx, o.stats, q.id + "-parts"), fb1 = el("div");
    const step1 = el("p", "an-do", o.guided ? "1-қадам. Сұрақтың бір бөлігін бас, сосын оның атын таңда." : "1. Бөліктерді белгіле.");
    const view = qView(q, (i, n) => {
      if (n.dataset.done) return;
      view.segs.forEach((x) => { if (x.tagName === "BUTTON" && !x.dataset.done) x.setAttribute("aria-pressed", "false"); });
      sel = i; n.setAttribute("aria-pressed", "true"); labs.forEach((b) => { b.disabled = false; });
    });
    const labRow = group("lab-choice an-labs", "Таңдалған бөліктің аты");
    const labs = Object.keys(roles).map((k) => {
      const b = btn("", roles[k].name); b.dataset.role = k; b.disabled = true;
      b.addEventListener("click", () => {
        if (sel < 0) return;
        o.tick();
        const s = q.segs[sel], n = view.segs[sel];
        if (s.role !== k) {
          const why = `Бұл бөлік «${roles[k].name}» емес. ${roles[k].def}` + (o.guided ? " " + s.why : "");
          uLab.bad("part-" + s.role + "-as-" + k, why);
          return say(fb1, "bad", "Қате.", why);
        }
        n.dataset.done = k; n.setAttribute("aria-pressed", "false"); tagSeg(n, k);
        sel = -1; have++; got[k] = true; labs.forEach((x) => { x.disabled = true; });
        say(fb1, "ok", "Дұрыс.", s.why);
        if (have === need) { setReal(q.ask.real); uLab.good(); labRow.hidden = true; answer(); }
        else if (o.guided) setReal([got.task ? "Тапсырма: " + q.ask.task : "", got.asked ? "Нысан: " + q.ask.asked : ""].filter(Boolean).join(" ") || `Әзірге белгісіз: ${need - have} бөлік қалды.`);
        else setReal(`${have} / ${need} бөлік белгіленді.`);
      });
      labRow.append(b); return b;
    });
    card.append(step1, view.box, labRow, fb1, real);
    setReal(o.guided ? "әзірге белгісіз. Бөліктерді белгілеген сайын осы жол толығады." : `0 / ${need} бөлік белгіленді.`);

    function answer() {
      const uAns = unit(ctx, o.stats, q.id + "-answer"), fb2 = el("div");
      card.append(el("p", "an-do", o.guided ? "2-қадам. Енді жауабын таңда." : "2. Жауабын таңда."));
      const ch = choiceButtons(q.choices.map((c) => c.t), (j, b) => {
        o.tick();
        const c = q.choices[j];
        if (!c.ok) { b.classList.add("no"); b.disabled = true; uAns.bad("answer-" + c.trap, c.why); return say(fb2, "bad", "Қате.", c.why); }
        b.classList.add("ok"); ch.bs.forEach((x) => { x.disabled = true; });
        say(fb2, "ok", "Дұрыс.", c.why); uAns.good(); match();
      });
      card.append(ch.g, fb2);
    }

    function match() {
      card.append(el("p", "an-do", o.guided ? "3-қадам. Қалған үш нұсқа кездейсоқ емес: әрқайсысының артында белгілі бір тұзақ тұр. Әр нұсқаға тұзағын таңдап, «Тексеру» бас." : "3. Әр қате нұсқаның тұзағын анықта."));
      const list = el("ul", "an-match"), rows = [];
      q.choices.forEach((c, j) => {
        if (c.ok) return;
        const li = el("li"), id = `an-s-${q.id}-${j}`, lab = el("label", "", ""), s = el("select"), fb = el("div");
        lab.htmlFor = id; lab.append(el("b", "", ABC[j] + ". "), en(el("span", "", c.t)));
        s.id = id; s.dataset.c = j;
        const o0 = el("option", "", "- тұзақты таңда -"); o0.value = ""; s.append(o0);
        Object.keys(traps).forEach((k) => { const op = el("option", "", traps[k].name); op.value = k; s.append(op); });
        li.append(lab, s, fb); list.append(li);
        rows.push({ c, j, s, fb, li, ok: false, u: unit(ctx, o.stats, `${q.id}-trap-${ABC[j]}`) });
      });
      const check = btn("btn gold an-check", "Тексеру"), fb3 = el("div");
      check.addEventListener("click", () => {
        o.tick();
        rows.forEach((r) => {
          if (r.ok) return;
          const v = r.s.value;
          if (!v) return say(r.fb, "info", "Тұзақ таңдалмады.", "");
          if (v === r.c.trap || v === r.c.alt) {
            r.ok = true; r.s.disabled = true; r.li.classList.add("done"); r.u.good();
            return say(r.fb, "ok", traps[v].name + ".", r.c.why + (r.c.alt ? ` (Бұл нұсқаны «${traps[v === r.c.trap ? r.c.alt : r.c.trap].name}» деп те атауға болады.)` : ""));
          }
          const why = `«${traps[v].name}» бұл нұсқаға келмейді. ${traps[v].test}`;
          r.u.bad(`trap-${r.c.trap}-as-${v}`, why); say(r.fb, "bad", "Қате.", why);
        });
        if (rows.every((r) => r.ok)) { check.disabled = true; card.classList.add("done"); say(fb3, "ok", "Сұрақ толық бөлшектелді.", q.ask.real); o.onDone(); }
      });
      card.append(list, check, fb3);
    }
  }

  /* ---------- 1. Кіріспе: жылдам жауап, сосын жауапты ажырататын бөлікті табу ---------- */
  function intro(body, ctx) {
    const q = Q[D.intro.q], t = R.timer(), fb = el("div"), fb2 = el("div"), part = el("div");
    body.append(el("p", "an-do", D.intro.lead));
    const view = qView(q); body.append(view.box);
    let picked = false;
    const ch = choiceButtons(q.choices.map((c) => c.t), (j, b) => {
      if (picked) return;
      picked = true;
      const c = q.choices[j], m = t.read();
      ch.bs.forEach((x, k) => { x.disabled = true; if (q.choices[k].ok) x.classList.add("ok"); });
      if (!c.ok) b.classList.add("no");
      ctx.state.introPick = j; ctx.save();
      say(fb, c.ok ? "ok" : "bad", c.ok ? "Дұрыс." : "Қате.", `${c.why} Сіз ${m.seconds} с ішінде жауап бердіңіз (нақты өлшенген уақыт).`);
      ctx.note("Қате нұсқалардың әрқайсысы да бір нәрсенің есептелген мәні. Олар кездейсоқ қойылмаған.");
      second();
    });
    body.append(ch.g, fb, part);
    ctx.note("Алдымен жауап бер: дұрыс па, қате ме - маңызды емес, бұл тек бастама.");
    function second() {
      part.append(el("p", "an-do", D.intro.turn));
      const g = group("an-parts", "Сұрақтың бөліктері");
      q.segs.forEach((s) => {
        if (!s.role) return;
        const b = en(btn("an-seg", s.t)); b.dataset.role = s.role;
        b.addEventListener("click", () => {
          if (s.role !== "asked") { b.classList.add("no"); ctx.record(false, { item: "intro-part", error: "part-" + s.role, note: s.why }); return say(fb2, "bad", "Бұл бөлік емес.", s.why + " 8 бен 25 екеуі де осы бөлікпен үйлеседі, сондықтан оларды бұл ажыратпайды."); }
          tagSeg(b, "asked"); g.querySelectorAll("button").forEach((x) => { x.disabled = true; });
          say(fb2, "ok", "Дұрыс.", D.intro.done);
          ctx.note("Шын сұрақ: " + q.ask.real);
          ctx.done();
        });
        g.append(b);
      });
      part.append(g, fb2);
    }
  }

  /* ---------- 2. Көр: бөлшектеу анимациясы (SVG сызба + сұрақ мәтіні + қысқа жазба) ---------- */
  function concept(body, ctx) {
    const qs = D.concept.map((id) => Q[id]), seen = {};
    const tabs = group("lab-choice", "Сұрақ түрі"), split = el("div", "an-split"), board = el("div", "lab-board an-board"), side = el("div"), cap = el("p", "an-cap"), ph = el("div");
    cap.setAttribute("aria-live", "polite");
    let player = null;
    const tabBtns = qs.map((q, i) => { const b = btn("", q.kind === "rw" ? "Reading and Writing сұрағы" : "Math сұрағы"); b.addEventListener("click", () => show(i)); tabs.append(b); return b; });
    split.append(board, side); body.append(tabs, split, cap, ph);

    function show(qi) {
      const q = qs[qi], traps = D.traps[q.kind];
      if (player) player.stop();
      tabBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === qi)));
      board.innerHTML = ""; side.innerHTML = ""; ph.innerHTML = "";
      const sv = R.svg("svg", { viewBox: "0 0 360 196", role: "img" }, board);
      const box = (x, y, w, h, label, dy) => { const g = R.svg("g", { class: "an-b" }, sv); R.svg("rect", { x, y, width: w, height: h, rx: 7 }, g); const t = R.svg("text", { x: x + w / 2, y: y + (dy || h / 2 + 4.5), "text-anchor": "middle", "font-size": 13 }, g); t.textContent = label; return g; };
      const gGiven = box(8, 8, 344, 32, D.roles.given.short), gStem = box(8, 48, 344, 70, "Сұрақ сөйлемі (stem)", 17);
      const gTask = box(16, 72, 160, 36, D.roles.task.short), gAsked = box(184, 72, 160, 36, D.roles.asked.short);
      const okIdx = q.choices.findIndex((c) => c.ok), wrong = q.choices.map((c, j) => j).filter((j) => j !== okIdx);
      const gCh = q.choices.map((c, j) => {
        const g = box(8 + j * 88, 126, 80, 30, ABC[j]);
        const tag = R.svg("text", { x: 48 + j * 88, y: 178, "text-anchor": "middle", "font-size": 11.5, class: "an-trap" }, g);
        tag.textContent = c.ok ? "дұрыс" : traps[c.trap].short;
        R.svg("line", { x1: 48 + j * 88, y1: 156, x2: 48 + j * 88, y2: 165 }, g);
        return g;
      });
      const view = qView(q); side.append(view.box);
      const ol = en(el("ol", "an-chs")); const lis = q.choices.map((c, j) => { const li = el("li", "", `${ABC[j]}. ${c.t}`); const tg = el("span", "an-tag", c.ok ? "дұрыс" : traps[c.trap].name); tg.lang = "kk"; tg.hidden = true; li.append(" ", tg); ol.append(li); return { li, tg }; });
      side.append(ol);
      const order = [null, "given", "stem", "task", "asked", okIdx, ...wrong], steps = order.length - 1;
      const caption = (k) => {
        if (k === 0) return D.conceptCaps.whole;
        const s = order[k];
        if (s === "given") return `${D.roles.given.name}: ${q.cap.given} Бұл бөлік ештеңе сұрамайды.`;
        if (s === "stem") return D.conceptCaps.stem;
        if (s === "task") return `${D.roles.task.name}: ${q.ask.task}`;
        if (s === "asked") return `${D.roles.asked.name}: ${q.ask.asked}`;
        const c = q.choices[s];
        return c.ok ? `Дұрыс жауап - ${ABC[s]}. ${c.why}` : `${ABC[s]} - «${traps[c.trap].name}» тұзағы. ${c.why}`;
      };
      const mark = (node, at, k) => { node.classList.toggle("on", at === k); node.classList.toggle("seen", at < k); };
      const onStep = (k) => {
        const at = (name) => order.indexOf(name);
        mark(gGiven, at("given"), k); mark(gStem, at("stem"), k); mark(gTask, at("task"), k); mark(gAsked, at("asked"), k);
        q.segs.forEach((s, i) => { if (s.role) mark(view.segs[i], at(s.role), k); });
        mark(view.stem, at("stem"), k);
        q.choices.forEach((c, j) => { const a = order.indexOf(j, 5); mark(gCh[j], a, k); mark(lis[j].li, a, k); lis[j].tg.hidden = k < a; });
        const text = caption(k);
        cap.textContent = text;
        sv.setAttribute("aria-label", `Сұрақтың сызбасы: берілген дерек, сұрақ сөйлемі (тапсырма сөзі және сұралатын нәрсе), төрт жауап нұсқасы. ${k}-қадам / ${steps}. ${text}`);
        if (k === steps) {
          seen[q.id] = true;
          const left = qs.filter((x) => !seen[x.id]);
          if (left.length) ctx.note(`Шын сұрақ: ${q.ask.real} Енді екінші сұрақ түрін де бөлшекте.`);
          else { ctx.note(`Шын сұрақ: ${q.ask.real} Екі сұрақ та бөлшектелді: құрылымы бірдей, тұзақтары әртүрлі.`); ctx.done(); }
        }
      };
      player = R.player(ph, { steps, onStep, label: "Бөлшектеу анимациясын басқару" });
    }
    ctx.note("▶ бас немесе → батырмасымен қадамдап өт. Екі сұрақ түрін де соңына дейін бөлшекте.");
    show(0);
  }

  /* ---------- 3. Бірге жаса: екі сұрақты толық бөлшектеу ---------- */
  function guided(body, ctx) {
    const ids = D.guided, stats = { wrong: 0, units: 0, first: 0 };
    let k = 0;
    const next = () => {
      if (k >= ids.length) { ctx.note(`Екі сұрақ та бөлшектелді. Бірінші әрекеттен дұрыс: ${stats.first} / ${stats.units}.`); return ctx.done(); }
      const q = Q[ids[k]];
      dissect(body, q, ctx, { title: `${k + 1}-сұрақ · ${q.kind === "rw" ? "Reading and Writing" : "Math"}`, guided: true, note: true, stats, tick() {}, onDone: () => { k++; next(); } });
    };
    next();
  }

  /* ---------- 4. Өзің зертте: сұрақ сөйлеміндегі бір сөзді ауыстыру ---------- */
  function explore(body, ctx) {
    const X = D.explore, tried = ctx.state.explore || (ctx.state.explore = { math: [], rw: [] });
    const need = 2;
    const status = () => {
      const ok = tried.math.length >= need && tried.rw.length >= need;
      if (ok) ctx.done();
      return ok;
    };
    function panel(key, title, variants, label, render) {
      const card = el("section", "an-card"); card.dataset.x = key; body.append(card);
      card.append(el("h3", "an-h", title));
      const qbox = en(el("div", "an-q")), vg = group("lab-choice an-vars", "Сұрақ сөйлеміндегі сөзді ауыстыру"), ask = el("p", "an-do"), chHost = el("div"), fb = el("div"), notes = el("ul", "an-notes"), cnt = el("p", "gd-n");
      card.append(el("p", "an-do", "Сұрақ сөйлеміндегі белгіленген сөзді ауыстыр:"), vg, qbox, ask, chHost, fb, notes, cnt);
      const paintCnt = () => { cnt.textContent = `Зерттелген нұсқа: ${tried[key].length} / ${variants.length} (кезеңді ашу үшін әр сұрақта кемінде ${need}).`; };
      const vb = variants.map((v, i) => { const b = en(btn("", label(v))); b.dataset.v = v.id; b.addEventListener("click", () => pick(i)); vg.append(b); return b; });
      function pick(i) {
        const v = variants[i], r = render(v, qbox);
        vb.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
        ask.textContent = "Енді қай нұсқа дұрыс? Болжап, бас."; fb.className = ""; fb.textContent = ""; notes.innerHTML = ""; chHost.innerHTML = "";
        const ch = choiceButtons(r.choices, (j, b) => {
          ch.bs.forEach((x, m) => { x.disabled = true; if (m === r.ok) x.classList.add("ok"); });
          if (j !== r.ok) b.classList.add("no");
          ctx.record(j === r.ok, { item: `explore-${key}-${v.id}`, error: "explore-" + key, note: r.why });
          say(fb, j === r.ok ? "ok" : "bad", j === r.ok ? "Болжам дұрыс." : `Болжам қате: дұрысы - ${ABC[r.ok]}.`, r.why);
          r.notes.forEach((t, m) => { const li = el("li", m === r.ok ? "ok" : ""); li.append(el("b", "", ABC[m] + ": "), document.createTextNode(t)); notes.append(li); });
          if (!tried[key].includes(v.id)) { tried[key].push(v.id); ctx.save(); }
          paintCnt();
          const all = status();
          ctx.note(`«${label(v)}» сұралғанда дұрыс жауап - ${ABC[r.ok]}. ` + (tried[key].length === variants.length ? X[key].moral : all ? "Басқа сөздерді де ауыстырып көр." : "Тағы бір сөзді ауыстырып көр."));
        });
        chHost.append(ch.g);
      }
      paintCnt(); pick(0);
    }
    const M = X.math, x = (M.eq.c - M.eq.b) / M.eq.a, val = (v) => v.p * x + v.q;
    panel("math", "Math: бір теңдеу, төрт түрлі сұрақ", M.variants, (v) => v.t, (v, qbox) => {
      qbox.innerHTML = ""; const p = el("p", "an-stem"); p.append(M.given + " " + M.pre, el("mark", "", v.t), M.post); qbox.append(p);
      const ok = M.choices.indexOf(val(v));
      return { choices: M.choices.map(String), ok, why: `Теңдеуден x = ${x}. Сұралғаны ${v.t}, оның мәні ${val(v)}.`,
        notes: M.choices.map((c) => { const w = M.variants.find((u) => val(u) === c); return w === v ? `${c} - дәл қазір сұралып тұрған «${v.t}» мәні.` : w ? `${c} - «${w.t}» сұралғанда дұрыс болар еді.` : `${c} - ешбір сұраққа сәйкес келмейді.`; }) };
    });
    const W = X.rw;
    panel("rw", "Reading and Writing: бір мәтін, үш түрлі сұрақ", W.variants, (v) => v.key, (v, qbox) => {
      qbox.innerHTML = ""; const p = el("p", "an-stem"); p.append(v.pre, el("mark", "", v.key), v.post); qbox.append(el("div", "an-pass", W.passage), p);
      return { choices: W.choices, ok: v.ok, why: v.why, notes: v.notes };
    });
    ctx.note("Мәтін мен нұсқалар өзгермейді. Тек сұрақ сөйлеміндегі бір сөзді ауыстырып, дұрыс жауаптың қалай көшетінін бақыла.");
    status();
  }

  /* ---------- 5. Тексер: үш деңгейлі көмегі бар сұрақтар ---------- */
  function checkpoint(body, ctx) {
    ctx.note("Әр сұраққа алдымен көмексіз жауап беріп көр. Қате жауаптың себебі бірден түсіндіріледі.");
    R.assess(body, D.checkpoint, { hints: true, record: ctx.record, prefix: "check", onAll: (n, all) => { ctx.note(`Бірінші әрекеттен, көмексіз дұрыс: ${n} / ${all}.`); ctx.done(); } });
  }

  /* ---------- 6. Қатені талда: берілген қате шешімдегі қате қадам мен тұзақты табу ---------- */
  function mistakes(body, ctx) {
    let solved = 0;
    ctx.note("Бұл шешімдердің әрқайсысы қате жауапқа әкелді. Қай қадам қате және ол қай тұзақ?");
    const list = el("ol", "gd-exs"); body.append(list);
    D.mistakes.forEach((m) => {
      const li = el("li", "gd-ex"), traps = D.traps[m.kind], fb = el("div"), fb2 = el("div"), two = el("div");
      li.dataset.m = m.id;
      if (m.passage) li.append(en(el("div", "an-pass", m.passage)));
      li.append(en(el("p", "gd-q", m.q)));
      if (m.picked) { const p = el("p", "an-picked"); p.append("Оқушы таңдаған нұсқа: ", en(el("i", "", m.picked))); li.append(p); }
      li.append(el("p", "an-do", "Оқушының шешімі. Қате қадамды бас:"));
      const sg = group("an-steps", "Шешім қадамдары"); let tries = 0;
      const sb = m.steps.map((s, i) => {
        const b = btn("", `${i + 1}) ${s.t}`); b.dataset.s = i;
        b.addEventListener("click", () => {
          if (!s.bad) { tries++; b.classList.add("no"); b.disabled = true; ctx.record(false, { item: m.id + "-step", error: "step-" + (i + 1), note: s.ok }); return say(fb, "bad", "Бұл қадам қате емес.", s.ok); }
          b.classList.add("bad"); sb.forEach((x) => { x.disabled = true; });
          if (!tries) ctx.record(true, { item: m.id + "-step" });
          say(fb, "ok", "Иә, қате осы қадамда.", "Енді оның атын тап.");
          name();
        });
        sg.append(b); return b;
      });
      li.append(sg, fb, two);
      function name() {
        two.append(el("p", "an-do", "Бұл қай тұзақ?"));
        const g = group("lab-choice", "Тұзақ түрі"); let miss = 0;
        Object.keys(traps).forEach((k) => {
          const b = btn("", traps[k].name); b.dataset.t = k;
          b.addEventListener("click", () => {
            if (k !== m.trap) { miss++; b.classList.add("no"); b.disabled = true; const why = `«${traps[k].name}» емес. ${traps[k].test}`; ctx.record(false, { item: m.id + "-trap", error: `trap-${m.trap}-as-${k}`, note: why }); return say(fb2, "bad", "Қате.", why); }
            b.classList.add("ok"); g.querySelectorAll("button").forEach((x) => { x.disabled = true; });
            if (!miss) ctx.record(true, { item: m.id + "-trap" });
            say(fb2, "ok", traps[k].name + ".", m.fix); li.classList.add("done"); solved++;
            ctx.note(`Талданған шешім: ${solved} / ${D.mistakes.length}. ${traps[k].name}: ${traps[k].def}`);
            if (solved === D.mistakes.length) ctx.done();
          });
          g.append(b);
        });
        two.append(g, fb2);
      }
      list.append(li);
    });
  }

  /* ---------- 7. Меңгеру: жаңа сұрақтар, көмексіз; уақыт пен әрекет саны нақты өлшенеді ---------- */
  function mastery(body, ctx) {
    const ids = D.mastery, stats = { wrong: 0, units: 0, first: 0 }, t = R.timer(), res = el("div");
    let k = 0;
    ctx.note("Жаңа сұрақтар. Көмек жоқ: бөліктерді белгіле, жауап бер, әр қате нұсқаның тұзағын ата.");
    const next = () => {
      if (k >= ids.length) {
        const m = t.read();
        body.append(res);
        say(res, stats.wrong ? "info" : "ok", stats.wrong ? "Аяқталды." : "Қатесіз аяқталды.", `Бірінші әрекеттен дұрыс: ${stats.first} / ${stats.units}. Қате әрекет: ${stats.wrong}. Нақты өлшенген уақыт: ${m.seconds} с, әрекет саны: ${m.steps}.`);
        ctx.note(stats.wrong ? "Қате кеткен тұзақ түрлері «Менің оқуым» бетіндегі қателер дәптеріне жазылды." : "Екі жаңа сұрақ та көмексіз, қатесіз бөлшектелді.");
        return ctx.done({ mastery: { first: stats.first, units: stats.units, wrong: stats.wrong } });
      }
      const q = Q[ids[k]];
      dissect(body, q, ctx, { title: `Жаңа сұрақ ${k + 1} / ${ids.length} · ${q.kind === "rw" ? "Reading and Writing" : "Math"}`, guided: false, note: false, stats, tick: t.step, onDone: () => { k++; next(); } });
    };
    next();
  }

  R.mount(root, {
    id: "sat.reality.anatomy", title: "Сұрақ анатомиясы",
    stages: [
      { key: "intro", heading: "Дұрыс есептеп, қате жауап беруге бола ма?", goal: "Бір сұраққа жылдам жауап бер, сосын жауапты шын мәнінде қай бөлік анықтайтынын тап.", render: intro },
      { key: "concept", heading: "Сұрақтың анатомиясы", goal: "Сұрақ дерекке, сұрақ сөйлеміне және төрт нұсқаға бөлінеді; әр қате нұсқаның артында бір тұзақ бар.", render: concept },
      { key: "guided", heading: "Сұрақты өзің бөлшекте", goal: "Екі сұрақтың бөліктерін белгіле, жауап бер және әр қате нұсқаға тұзағын сәйкестендір.", render: guided },
      { key: "explore", heading: "Бір сөзді ауыстыр - жауап көшеді", goal: "Сұрақ сөйлеміндегі бір сөзді өзгертіп, қай нұсқаның дұрыс болатынын алдын ала болжа.", render: explore },
      { key: "checkpoint", heading: "Өзіңді тексер", goal: "Бес сұрақ. Қиналсаң, үш деңгейлі көмек бар.", render: checkpoint },
      { key: "mistakes", heading: "Қате шешімдерді талда", goal: "Бес дайын шешім қате жауапқа әкелді. Қате қадамды тауып, тұзақты ата.", render: mistakes },
      { key: "mastery", heading: "Жаңа сұрақтар, көмексіз", goal: "Бұрын көрмеген екі сұрақты басынан аяғына дейін өзің бөлшекте.", render: mastery },
    ],
    next: { title: "Digital SAT картасы", href: "index.html" },
  });
})();
