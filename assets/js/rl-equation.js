/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Теңдеу таразысы» (Reality Engine): оқушы теңдеуді таразы ретінде қолмен шешеді.
   Модель - assets/js/rl-mathexpr.js (AO17Math), мазмұн - assets/data/rl-equation.js (RL_EQUATION), қаңқа - ao-reality.js.
   Сахна: таразы SVG-і. Заңды амал (екі жаққа бірдей) теңдікті сақтайды; бір жаққа ғана жасалған амал таразыны аударады. */
(() => {
  "use strict";
  const R = window.AO17Reality, M = window.AO17Math, D = window.RL_EQUATION, root = document.querySelector("[data-reality]");
  if (!R || !M || !D || !root) return;
  const { el, svg } = R;
  const isInt = (p) => p.d === 1;

  // ---------- таразы сахнасы ----------
  function Scale(parent) {
    const board = el("div", "lab-board eq-board");
    const s = svg("svg", { viewBox: "0 0 640 330", role: "img" }, board);
    const title = svg("title", {}, s);
    svg("path", { d: "M320 70 L290 300 H350 Z", class: "eq-stand" }, s);
    svg("line", { x1: 230, y1: 300, x2: 410, y2: 300, class: "eq-base" }, s);
    const beam = svg("g", { class: "eq-beam" }, s);
    svg("line", { x1: 110, y1: 70, x2: 530, y2: 70, class: "eq-bar" }, beam);
    svg("circle", { cx: 320, cy: 70, r: 9, class: "eq-pivot" }, s);
    const sign = svg("text", { x: 320, y: 44, "text-anchor": "middle", class: "eq-sign" }, s);
    const pans = [110, 530].map((cx) => {
      const g = svg("g", { class: "eq-pan" }, s);
      svg("path", { d: `M${cx} 70 L${cx - 78} 196 M${cx} 70 L${cx + 78} 196`, class: "eq-rope" }, g);
      svg("path", { d: `M${cx - 96} 196 H${cx + 96} L${cx + 80} 212 H${cx - 80} Z`, class: "eq-plate" }, g);
      const items = svg("g", {}, g), label = svg("text", { x: cx, y: 246, "text-anchor": "middle", class: "eq-label" }, g);
      return { g, items, label, cx };
    });
    parent.append(board);
    function fill(pan, side) {
      pan.items.innerHTML = "";
      pan.label.textContent = M.fmtSide(side);
      const a = side.a, b = side.b;
      if (!isInt(a) || !isInt(b) || Math.abs(a.n) > 6 || Math.abs(b.n) > 14) return false;   // суретке сыймайды: тек өрнек көрсетіледі
      const na = Math.abs(a.n), nb = Math.abs(b.n), bw = 24, x0 = pan.cx - (na * (bw + 4) - 4) / 2;
      for (let i = 0; i < na; i++) {
        const x = x0 + i * (bw + 4);
        svg("rect", { x, y: 196 - bw, width: bw, height: bw, rx: 3, class: "eq-box" + (a.n < 0 ? " neg" : "") }, pan.items);
        svg("text", { x: x + bw / 2, y: 196 - 7, "text-anchor": "middle", class: "eq-x" }, pan.items).textContent = "x";
      }
      const perRow = 7, base = na ? 196 - bw - 10 : 196 - 9;
      for (let i = 0; i < nb; i++) {
        const row = Math.floor(i / perRow), inRow = Math.min(perRow, nb - row * perRow), col = i % perRow;
        svg("circle", { cx: pan.cx - ((inRow - 1) * 20) / 2 + col * 20, cy: base - row * 19, r: 8, class: "eq-unit" + (b.n < 0 ? " neg" : "") }, pan.items);
      }
      return true;
    }
    /** eq - теңдеу; tilt: −1 (оң жақ ауыр), 0, 1 (сол жақ ауыр); extra - сипаттамаға қосымша сөйлем */
    function draw(eq, tilt = 0, extra = "") {
      const drawn = [fill(pans[0], eq.L), fill(pans[1], eq.R)];
      const ang = tilt * 7, dy = Math.sin((ang * Math.PI) / 180) * 210;
      beam.style.transform = `rotate(${-ang}deg)`;
      pans[0].g.style.transform = `translateY(${dy}px)`; pans[1].g.style.transform = `translateY(${-dy}px)`;
      sign.textContent = tilt === 0 ? "=" : "≠";
      board.classList.toggle("eq-off", tilt !== 0);
      const neg = eq.L.a.n < 0 || eq.L.b.n < 0 || eq.R.a.n < 0 || eq.R.b.n < 0;
      title.textContent = `Таразы. Сол табақ: ${M.fmtSide(eq.L)}. Оң табақ: ${M.fmtSide(eq.R)}. ` + (tilt === 0 ? "Таразы тең тұр." : tilt > 0 ? "Сол жақ ауыр: таразы солға ауды." : "Оң жақ ауыр: таразы оңға ауды.") + (extra ? " " + extra : "");
      legend.textContent = (drawn.every(Boolean) ? "Қорап - белгісіз x, дөңгелек - бір бірлік." : "Бұл сандар суретке сыймайды, сондықтан табақтарда тек өрнек жазылған.") + (neg && drawn.every(Boolean) ? " Үзік сызықты пішін - теріс шама (қарыз)." : "");
    }
    const legend = el("p", "eq-legend"); parent.append(legend);
    return { draw, board };
  }

  // ---------- амал тақтасы + шешу жолы (guided және explore) ----------
  function bench(parent, ctx, o) {
    const x0 = M.solve(o.eq), scale = Scale(parent);
    let hist = [{ eq: o.eq, op: null }], hintsUsed = 0, finished = false;
    const cur = () => hist[hist.length - 1].eq;
    const log = el("ol", "eq-log"); log.setAttribute("aria-label", "Шешу жолы");
    const form = el("form", "eq-ops"), sel = el("select"), inp = el("input"), where = el("select"), go = el("button", "btn gold", "Қолдану"), undo = el("button", "btn secondary", "Қайтару"), fb = el("div");
    const uid = "eq-" + Math.random().toString(36).slice(2, 7);
    const lab = (text, node, id) => { const l = el("label", "", text); node.id = id; l.htmlFor = id; const w = el("span", "eq-f"); w.append(l, node); return w; };
    [["sub", "азайту (−)"], ["add", "қосу (+)"], ["subx", "x-терді азайту (− kx)"], ["addx", "x-терді қосу (+ kx)"], ["div", "бөлу (÷)"], ["mul", "көбейту (×)"]].forEach(([v, t]) => { const op = el("option", "", t); op.value = v; sel.append(op); });
    [["both", "екі жаққа"], ["left", "тек сол жаққа"], ["right", "тек оң жаққа"]].forEach(([v, t]) => { const op = el("option", "", t); op.value = v; where.append(op); });
    inp.autocomplete = "off"; inp.inputMode = "text"; inp.placeholder = "сан"; inp.size = 5;
    undo.type = "button";
    form.append(lab("Амал", sel, uid + "o"), lab("Сан (k)", inp, uid + "k"));
    if (o.allowSide) form.append(lab("Қай жаққа", where, uid + "w"));
    form.append(go, undo);
    parent.append(log, form, fb);
    let hintBtn = null;
    if (o.coach) {
      hintBtn = el("button", "btn secondary", "Дәл амалды көрсету"); hintBtn.type = "button";
      hintBtn.addEventListener("click", () => { const s = M.suggest(cur()); if (!s || cur().broken) return; hintsUsed++; ctx.tutor.feedback(fb, "info", "Келесі амал", `${s.why} Яғни: ${M.describe(s.op)}.`); });
      form.append(hintBtn);
    }
    function paint(msg) {
      const eq = cur(), t = eq.broken && x0.kind === "one" ? M.tilt(eq, x0.x) || 1 : 0;
      scale.draw(eq, t);
      log.innerHTML = "";
      hist.forEach((h, i) => { const li = el("li"); li.append(el("b", "", M.fmt(h.eq))); if (h.op) li.append(el("span", "", " ← " + h.op)); if (i === hist.length - 1) li.className = "cur"; log.append(li); });
      undo.disabled = hist.length < 2;
      const spec = M.solve(eq), flat = eq.L.a.n === 0 && eq.R.a.n === 0;
      if (eq.broken) ctx.note("Тепе-теңдік бұзылды: амал бір жаққа ғана жасалды, сондықтан бұл енді басқа теңдеу. «Қайтару» түймесін басыңыз.");
      else if (M.isSolved(eq)) {
        const best = (() => { let e = o.eq, n = 0; while (!M.isSolved(e) && n < 9) { e = M.apply(e, M.suggest(e).op); n++; } return n; })();
        ctx.note(`Шешілді: ${M.fmt(eq)}. Сіз ${hist.length - 1} амал жасадыңыз; ең қысқа жол - ${best} амал. Тексеру: бастапқы теңдеуге қойсақ, екі жақ та ${M.fmtF(M.evalSide(o.eq.L, spec.x))} болады.`);
        if (!finished) { finished = true; ctx.record(true, { item: o.item, hints: hintsUsed }); o.onDone({ steps: hist.length - 1, best }); }
      } else if (spec.kind !== "one" && flat) {
        ctx.note(spec.kind === "none" ? `x жойылып, ${M.fmt(eq)} қалды. Бұл жалған теңдік: ешбір x оны түзете алмайды, шешім жоқ.` : `x жойылып, ${M.fmt(eq)} қалды. Бұл әрқашан ақиқат: кез келген x - шешім.`);
        if (!finished) { finished = true; o.onDone({ special: spec.kind }); }
      } else if (msg) ctx.note(msg);
      else if (o.coach) { const s = M.suggest(eq); ctx.note(s ? s.why : ""); }
      else ctx.note(spec.kind === "one" ? "Мақсат: бір жақта жалғыз x, екінші жақта сан қалсын. Кез келген амалды қолданып көріңіз." : "Екі жақтағы x-тердің коэффициенті бірдей. x-терді азайтып көріңіз: не қалады?");
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault(); fb.innerHTML = "";
      const k = M.parse(inp.value);
      if (!k) return ctx.tutor.feedback(fb, "info", "Сан танылмады.", "k орнына сан жазыңыз: 5, −3, 1/2.");
      const v = sel.value, op = { t: v === "sub" ? "add" : v === "subx" ? "addx" : v, k: v === "sub" || v === "subx" ? M.neg(k) : k };
      let next;
      try { next = M.apply(cur(), op, o.allowSide ? where.value : "both"); } catch (err) { return ctx.tutor.feedback(fb, "bad", "Бұл амал мүмкін емес.", err.message.charAt(0).toUpperCase() + err.message.slice(1) + "."); }
      if (next.broken && !cur().broken) ctx.record(false, { item: o.item, error: "one-side", note: "Амал бір жаққа ғана қолданылды" });
      hist.push({ eq: next, op: M.describe(op).replace(/^екі /, !o.allowSide || where.value === "both" ? "екі " : where.value === "left" ? "тек сол " : "тек оң ") });
      inp.value = ""; paint(next.broken ? "" : `Орындалды: ${hist[hist.length - 1].op}. Таразы тең қалды.`);
    });
    undo.addEventListener("click", () => { if (hist.length > 1) { hist.pop(); fb.innerHTML = ""; paint("Соңғы амал қайтарылды."); } });
    paint();
    return { reset: (eq) => { o.eq = eq; hist = [{ eq, op: null }]; finished = false; paint(); } };
  }

  const E = (q) => M.make(...q);
  const stages = [
    { key: "intro", title: "Кіріспе", heading: "Қорапта неше тас бар?", goal: "Жабық қораптардағы тас санын (x) өзгертіп, таразыны теңестіріңіз.",
      render(body, ctx) {
        const eq = E(D.intro.eq), scale = Scale(body), ctl = el("div", "lab-ctl"), l = el("label"), r = el("input"), out = el("output");
        r.type = "range"; r.min = 0; r.max = D.intro.max; r.step = 1; r.value = 0; r.id = "eq-x"; l.htmlFor = "eq-x"; out.htmlFor = "eq-x";
        l.append(el("span", "", "x"), r, out); ctl.append(l); body.append(ctl);
        let tries = 0;
        const paint = () => {
          const x = +r.value, L = M.val(M.evalSide(eq.L, x)), Rv = M.val(M.evalSide(eq.R, x)), t = Math.sign(L - Rv);
          out.textContent = String(x); r.setAttribute("aria-valuetext", `x = ${x}`);
          scale.draw(eq, t, `Қазір x = ${x}.`);
          if (t === 0) { ctx.note(`x = ${x}: сол жақ ${L}, оң жақ ${Rv}. Таразы теңесті - бұл теңдеудің шешімі. Сіз оны ${tries} рет сынап таптыңыз; келесі кезеңде сынамай-ақ табатын әдісті көресіз.`); ctx.done(); }
          else ctx.note(`x = ${x}: сол жақ ${L}, оң жақ ${Rv}. ${t > 0 ? "Сол" : "Оң"} жақ ауыр.`);
        };
        r.addEventListener("input", () => { tries++; paint(); });
        paint();
      } },
    { key: "concept", title: "Көр", heading: "Сынамай табу: екі жаққа бірдей амал", goal: "Қадамдарды өзіңіз жүргізіңіз: әр амалдан кейін таразы неге тең қалатынын бақылаңыз.",
      render(body, ctx) {
        const scale = Scale(body), line = el("p", "lab-formula eq-line"); line.setAttribute("aria-live", "polite"); body.append(line);
        const states = [E(D.concept.eq)]; D.concept.ops.forEach((op) => states.push(M.apply(states[states.length - 1], op)));
        R.player(body, { steps: states.length, label: "Шешу қадамдары", onStep(k) {
          const eq = states[Math.min(k, states.length - 1)];
          scale.draw(eq, 0); line.textContent = k === states.length ? `${M.fmt(states[0])}, x = ${D.concept.x} ✓` : M.fmt(eq);
          ctx.note(D.concept.captions[k]);
          if (k === states.length) ctx.done();
        } });
      } },
    { key: "guided", title: "Бірге жаса", heading: "Енді өзіңіз: 5x − 3 = 2x + 9", goal: "Амалды таңдап, санын жазып, «Қолдану» түймесін басыңыз. Төмендегі жол бағытты айтады.",
      render(body, ctx) { bench(body, ctx, { eq: E(D.guided.eq), coach: true, item: "guided", onDone: () => ctx.done() }); } },
    { key: "explore", title: "Өзің зертте", heading: "Өз теңдеуіңізді құрыңыз - және таразыны бұзып көріңіз", goal: "Коэффициенттерді өзгертіңіз, амалды бір жаққа ғана қолданып көріңіз, содан кейін бір теңдеуді соңына дейін шешіңіз.",
      render(body, ctx) {
        const form = el("form", "eq-make"), ins = ["a", "b", "c", "d"].map((n, i) => { const x = el("input"); x.type = "number"; x.min = -9; x.max = 9; x.step = 1; x.value = D.explore.eq[i]; x.id = "eq-m" + n; x.setAttribute("aria-label", { a: "сол жақтағы x-тің коэффициенті", b: "сол жақтағы сан", c: "оң жақтағы x-тің коэффициенті", d: "оң жақтағы сан" }[n]); return x; });
        const build = el("button", "btn secondary", "Теңдеуді құру");
        form.append(ins[0], el("span", "", "x +"), ins[1], el("span", "", "="), ins[2], el("span", "", "x +"), ins[3], build);
        body.append(form);
        const wrap = el("div"); body.append(wrap);
        const b = bench(wrap, ctx, { eq: E(D.explore.eq), allowSide: true, item: "explore", onDone: () => ctx.done() });
        form.addEventListener("submit", (e) => { e.preventDefault(); const v = ins.map((x) => Math.max(-9, Math.min(9, Math.round(+x.value || 0)))); ins.forEach((x, i) => { x.value = v[i]; }); b.reset(E(v)); });
      } },
    { key: "checkpoint", title: "Тексер", heading: "Тексеру: төрт есеп", goal: "Қате жауапқа нақты себебі айтылады. Көмек үш деңгейлі.",
      render(body, ctx) { R.assess(body, D.checkpoint, { hints: true, prefix: "cp", record: ctx.record, onAll: (n, all) => { ctx.note(`Бірінші әрекеттен дұрыс: ${n} / ${all}.`); ctx.done(); } }); } },
    { key: "mistakes", title: "Қатені талда", heading: "Қате қай жолда?", goal: "Әр шешімде бір жол қате. Сол жолды табыңыз, содан кейін қатенің түрін атаңыз.",
      render(body, ctx) {
        let left = D.mistakes.length;
        D.mistakes.forEach((c, ci) => {
          const box = el("section", "eq-case"), fb = el("div"), list = el("ol", "eq-lines");
          box.append(el("h3", "", `${c.title}: ${c.task}`), list, fb); body.append(box);
          let tries = 0;
          c.lines.forEach((l, i) => {
            const li = el("li"), b = el("button", "", M.fmt(E(l))); b.type = "button";
            if (i === 0) { b.disabled = true; b.title = "Берілген теңдеу"; }
            b.addEventListener("click", () => {
              if (i !== c.wrong) { tries++; b.classList.add("no"); b.disabled = true; ctx.record(false, { item: `mis${ci + 1}`, error: "wrong-line", note: "Қате жол дұрыс табылмады" }); return ctx.tutor.feedback(fb, "bad", "Бұл жол қате емес.", i < c.wrong ? "Ол алдыңғы жолдан заңды амалмен шыққан. Әр жолды алдыңғысымен салыстырыңыз: екі жаққа бірдей амал жасалған ба?" : "Бұл жол алдыңғысынан дұрыс шыққан, бірақ алдыңғысының өзі қате болуы мүмкін. Қате алғаш пайда болған жолды іздеңіз."); }
              b.classList.add("ok"); list.querySelectorAll("button").forEach((x) => { x.disabled = true; });
              ctx.tutor.feedback(fb, "ok", "Иә, қате осы жолда пайда болды.", "Енді қатенің түрін таңдаңыз.");
              const row = el("div", "gd-opts"); row.setAttribute("role", "group"); row.setAttribute("aria-label", "Қатенің түрі");
              c.traps.forEach((t, j) => { const tb = el("button", "", t); tb.type = "button"; tb.addEventListener("click", () => {
                const ok = j === c.trap; tb.classList.add(ok ? "ok" : "no"); tb.disabled = true;
                ctx.tutor.feedback(fb, ok ? "ok" : "bad", ok ? `Дұрыс жауап: x = ${M.fmtF(M.F(c.right))}.` : "Қатенің түрі басқа.", c.trapWhy[j]);
                ctx.record(ok, { item: `mis${ci + 1}`, hints: tries, error: "wrong-trap", note: c.trapWhy[j] });
                if (ok) { row.querySelectorAll("button").forEach((x) => { x.disabled = true; }); box.classList.add("done"); if (--left === 0) { ctx.note("Үш шешімдегі қатені де таптыңыз. Өз шешіміңізді де осылай тексеріңіз: әр жол алдыңғысынан екі жаққа бірдей амалмен шыға ма?"); ctx.done(); } }
              }); row.append(tb); });
              box.insertBefore(row, fb);
            });
            li.append(b); list.append(li);
          });
        });
      } },
    { key: "mastery", title: "Меңгеру", heading: "Меңгеру: жаңа есептер, көмексіз", goal: "Төрт жаңа есеп. Мұнда көмек жоқ - тек сіз және таразы ережесі.",
      render(body, ctx) { R.assess(body, D.mastery, { prefix: "ms", record: ctx.record, onAll: (n, all) => { ctx.note(n === all ? "Барлығы бірінші әрекеттен дұрыс. Дағды меңгерілді." : `Бірінші әрекеттен дұрыс: ${n} / ${all}. Қате кеткен есептердің түсіндірмесін оқып, ертең қайталаңыз.`); ctx.done({ mastery: n }); } }); } },
  ];
  R.mount(root, { id: D.id, title: D.title, stages, next: { title: "SAT: сызықтық теңдеу сабағы", href: "../sat/lesson-linear-equations.html" } });
})();
