/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   AO17 Кино-түсіндіру: сабақтың басындағы қысқа мультфильм.
   Әдістеме (зерттеулерде тиімділігі көрсетілген тәсілдер):
   - Сұрақ: қызығушылық саңылауы (Loewenstein) - жауапты бермей тұрып жұмбақ қою;
   - Бейне: нақтыдан дерексізге (Bruner, CRA) - тұрмыстағы ұқсастық;
   - Болжа: Predict-Observe-Explain (White, Gunstone) - фильм тоқтайды, оқушы алдымен өзі болжайды;
   - Көр: мультимедиа қағидалары (Mayer) - сегменттеу (әр қадам бөлек), белгілеу (алтынмен жану), жазу көзге жақын;
   - Түйін: бір сөйлемдік негізгі ой және жиі қате - түсінікті өзгерту (Posner).
   Деректер: ac-data.cine = {hook, props, beats, key, trap, chapters}. Сахна - SVG 640x300, мәтін көлемі ≥ 22.
   Күй әр қадамда басынан қайта есептеледі (алға-артқа еркін), өзгеріс CSS transition арқылы жүреді. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const W = 640, H = 300;
  const REDUCED = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // мәтінді жолдарға бөлу (SVG-де автоматты тасымал жоқ)
  function wrap(t, size, maxW) {
    const per = Math.max(8, Math.floor(maxW / (size * 0.56)));
    const out = [];
    String(t).split("\n").forEach((para) => {
      let line = "";
      para.split(" ").forEach((w) => {
        if ((line + " " + w).trim().length > per && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
      });
      out.push(line);
    });
    return out;
  }
  function multiText(g, t, size, anchor = "middle", maxW = 560, cls = "", maxLines = 4) {
    let lines = wrap(t, size, maxW);
    while (lines.length > maxLines && size > 18) { size -= 3; lines = wrap(t, size, maxW); }
    const tx = el("text", { "text-anchor": anchor, "font-size": size, class: cls }, g);
    const lh = size * 1.28, y0 = -((lines.length - 1) * lh) / 2 + size * 0.34;
    lines.forEach((ln, i) => { const s = el("tspan", { x: 0, y: (y0 + i * lh).toFixed(1) }, tx); s.textContent = ln; });
    return tx;
  }
  const chipW = (t, size) => Math.max(44, String(t).length * size * 0.56 + 26);

  // ---------- реквизит (props): әрқайсысы <g>, орны transform арқылы ----------
  const DRAW = {
    text(g, p, s) { g.textContent = ""; multiText(g, s.t, p.size || 26, p.anchor || "middle", p.maxW || 560, "cn-tx", p.lines || 4); },
    chip(g, p, s) {
      g.textContent = "";
      const size = p.size || 22, w = chipW(s.t, size), h = size + 18;
      el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, class: "cn-chip" }, g);
      const tx = el("text", { "text-anchor": "middle", y: size * 0.36, "font-size": size, class: "cn-tx" }, g);
      tx.textContent = s.t;
    },
    box(g, p, s) {
      g.textContent = "";
      el("rect", { x: 0, y: 0, width: p.w, height: p.h, rx: p.r ?? 10, class: "cn-line" + (p.dash ? " cn-dash" : ""), pathLength: 1 }, g);
      if (s.t) {
        const pos = p.lab || "below", size = p.size || 22;
        const y = pos === "in" ? p.h / 2 + size * 0.36 : pos === "top" ? size + 8 : pos === "above" ? -12 : p.h + size + 6;
        const tx = el("text", { x: p.w / 2, y, "text-anchor": "middle", "font-size": size, class: "cn-tx cn-lab" }, g);
        tx.textContent = s.t;
      }
    },
    arrow(g, p, s) {
      g.textContent = "";
      const dx = p.x2 - p.x, dy = p.y2 - p.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const bend = p.bend || 0, mx = dx / 2 - uy * bend, my = dy / 2 + ux * bend;
      el("path", { d: `M0 0Q${mx.toFixed(1)} ${my.toFixed(1)} ${dx} ${dy}`, class: "cn-line", pathLength: 1 }, g);
      // ұшы: соңғы бағыт бойынша
      const tx0 = dx - mx, ty0 = dy - my, tl = Math.hypot(tx0, ty0) || 1, ax = tx0 / tl, ay = ty0 / tl, k = 12;
      el("path", { d: `M${dx - ax * k - ay * k * .6} ${dy - ay * k + ax * k * .6}L${dx} ${dy}L${dx - ax * k + ay * k * .6} ${dy - ay * k - ax * k * .6}`, class: "cn-line cn-head", pathLength: 1 }, g);
      if (s.t) {
        const tt = el("text", { x: mx * (bend ? 1 : 1), y: my - 12, "text-anchor": "middle", "font-size": p.size || 20, class: "cn-tx cn-lab" }, g);
        tt.textContent = s.t;
      }
    },
    path(g, p) { g.textContent = ""; el("path", { d: p.d, class: "cn-line" + (p.dash ? " cn-dash" : "") + (p.fill ? " cn-fill" : ""), pathLength: 1 }, g); },
    bars(g, p, s) {
      g.textContent = "";
      const n = s.vals.length, gap = p.gap ?? 18, bw = (p.w - gap * (n - 1)) / n, max = p.max || Math.max(...s.vals, 1);
      el("path", { d: `M-8 0H${p.w + 8}`, class: "cn-line cn-axis", pathLength: 1 }, g);
      s.vals.forEach((v, i) => {
        const x = i * (bw + gap), b = el("g", { class: "cn-bar" + (s.mark === i ? " cn-on" : "") }, g);
        const r = el("rect", { x, y: -p.h, width: bw, height: p.h, class: "cn-barr" }, b);
        r.style.transform = `scaleY(${Math.max(0.002, v / max)})`;
        const vt = el("text", { x: x + bw / 2, y: -Math.max(0.002, v / max) * p.h - 8, "text-anchor": "middle", "font-size": p.size || 20, class: "cn-tx" }, b);
        vt.textContent = s.fmt ? s.fmt[i] : v;
        if (p.labels) { const lt = el("text", { x: x + bw / 2, y: (p.size || 20) + 8, "text-anchor": "middle", "font-size": p.size || 20, class: "cn-tx cn-lab" }, b); lt.textContent = p.labels[i]; }
      });
    },
    cells(g, p, s) {
      g.textContent = "";
      const cw = p.cw || 58, ch = p.ch || 52, size = p.size || 24;
      s.vals.forEach((v, i) => {
        const c = el("g", { class: "cn-cell" + (s.mark === i || (Array.isArray(s.mark) && s.mark.includes(i)) ? " cn-on" : "") }, g);
        el("rect", { x: i * cw, y: 0, width: cw - 6, height: ch, rx: 6, class: "cn-cellr" }, c);
        const t = el("text", { x: i * cw + (cw - 6) / 2, y: ch / 2 + size * 0.36, "text-anchor": "middle", "font-size": size, class: "cn-tx" }, c);
        t.textContent = v;
        const ix = p.idx === true ? i : Array.isArray(p.idx) ? p.idx[i] : null;
        if (ix != null) { const it = el("text", { x: i * cw + (cw - 6) / 2, y: ch + 22, "text-anchor": "middle", "font-size": 18, class: "cn-tx cn-lab" }, c); it.textContent = ix; }
      });
      if (p.label) { const lt = el("text", { x: -14, y: ch / 2 + 7, "text-anchor": "end", "font-size": 20, class: "cn-tx cn-lab" }, g); lt.textContent = p.label; }
    },
    node(g, p, s) {
      g.textContent = "";
      el("circle", { r: p.r || 24, class: "cn-node", pathLength: 1 }, g);
      const tx = el("text", { "text-anchor": "middle", y: (p.size || 22) * 0.36, "font-size": p.size || 22, class: "cn-tx" }, g);
      tx.textContent = s.t;
    },
    edge() {},
    code(g, p, s) {
      g.textContent = "";
      const size = p.size || 20, lh = size * 1.55, w = p.w || 300;
      el("rect", { x: -12, y: -size - 6, width: w, height: lh * p.lines.length + 12, rx: 8, class: "cn-codebg" }, g);
      const hl = el("rect", { x: -8, y: -size - 2 + (s.line ?? -9) * lh, width: w - 8, height: lh - 2, rx: 5, class: "cn-codehl" + (s.line == null ? " cn-off" : "") }, g);
      hl.style.transition = "y .45s ease";
      p.lines.forEach((ln, i) => { const t = el("text", { x: 0, y: i * lh + 2, "font-size": size, class: "cn-tx cn-mono" }, g); t.textContent = ln; });
    },
  };

  function Cine(root, data, pre) {
    const story = data.cine;
    const props = story.props.slice();
    // Сұрақ және Түйін - қозғалтқыш өзі қосатын реквизит
    props.unshift({ id: "_hook", type: "text", x: W / 2, y: H / 2 - 6, t: story.hook, size: 30, maxW: 580 });
    // Түйін - бөлек «карта»: сахна тазарады, тек негізгі ой қалады (Mayer: артық элемент жоқ)
    props.push({ id: "_card", type: "box", x: 36, y: 34, w: 568, h: 232, r: 14, tone: "gold" });
    props.push({ id: "_kl", type: "text", x: W / 2, y: 64, t: "ТҮЙІН", size: 18, tone: "gold" });
    props.push({ id: "_key", type: "text", x: W / 2, y: H / 2 + 14, t: story.key, size: 25, maxW: 540, lines: 5 });
    if (story.trap) {
      props.push({ id: "_tl", type: "text", x: W / 2, y: 64, t: "ЖИІ ҚАТЕ", size: 18, tone: "bad" });
      props.push({ id: "_bad", type: "text", x: W / 2, y: 112, t: "✗ " + story.trap.wrong, size: 22, maxW: 520 });
      props.push({ id: "_div", type: "path", d: "M120 152H520", tone: "dim" });
      props.push({ id: "_good", type: "text", x: W / 2, y: 204, t: "✓ " + story.trap.right, size: 22, maxW: 520 });
    }
    const ids = props.map((p) => p.id);
    const beats = story.beats.slice();
    const firstCh = beats.length ? beats[0].ch : "Сұрақ";
    beats.unshift({ ch: "Сұрақ", say: story.hookSay || story.hook, mood: "think", do: [["show", "_hook"]] });
    beats.forEach((b, i) => { if (i === 1) (b.do = b.do || []).unshift(["hide", "_hook"]); });
    if (firstCh === "Сұрақ") { /* автор өзі жалғастырған */ }
    beats.push({ ch: "Түйін", say: story.keySay || story.key, mood: "wow", do: [["clear"], ["show", "_card", "_kl", "_key"]] });
    if (story.trap) beats.push({ ch: "Түйін", say: `Жиі қате: ${story.trap.wrong} Дұрысы: ${story.trap.right}`, mood: "think", do: [["hide", "_key", "_kl"], ["show", "_tl", "_bad", "_div", "_good"], ["tone", "_card", "dim"], ["tone", "_bad", "bad"], ["tone", "_good", "good"]] });
    const chapters = [...new Set(beats.map((b) => b.ch))];

    // ---------- DOM ----------
    root.classList.add("on");
    root.innerHTML = `<div class="cn-frame">
      <div class="cn-tabs" role="group" aria-label="Фильм тараулары">${chapters.map((c, i) => `<button type="button" data-ch="${i}"><span>${i + 1}</span>${esc(c)}</button>`).join("")}</div>
      <div class="cn-stage"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Кино-түсіндірудің сахнасы"><defs><pattern id="cn-grain" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" class="cn-grain"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#cn-grain)"/><g class="cn-world"></g></svg>
        <div class="cn-poster"><p class="cn-pk">Кино-түсіндіру · ${chapters.length} тарау · ≈ ${Math.round(beats.reduce((a, b) => a + dur(b), 0) / 5) * 5} с</p><h3>${esc(data.title || "")}</h3><button type="button" class="cn-big" data-a="start"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Фильмді көру</button></div></div>
      <div class="cn-sub"><img class="cn-bota" alt="" width="64" height="64" src="${pre}bota-think.svg"><div class="cn-bubble"><p class="cn-say" aria-live="polite"></p><div class="cn-ask" hidden></div></div></div>
      <div class="cn-ctl"><button type="button" class="cn-b" data-a="play" aria-label="Ойнату"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="cn-pi" d="M8 5v14l11-7z"/></svg></button>
        <button type="button" class="cn-b" data-a="prev" aria-label="Алдыңғы көрініс"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
        <button type="button" class="cn-b" data-a="next" aria-label="Келесі көрініс"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
        <div class="cn-tl" aria-hidden="true">${beats.map((b) => `<i data-c="${chapters.indexOf(b.ch)}"><b></b></i>`).join("")}</div>
        <span class="cn-n" aria-live="off"></span></div></div>`;
    const svg = $("svg", root), world = $(".cn-world", svg), say = $(".cn-say", root), ask = $(".cn-ask", root), bota = $(".cn-bota", root);
    const segs = $$(".cn-tl i", root), tabs = $$(".cn-tabs button", root), playB = $("[data-a=play]", root), pIco = $(".cn-pi", root);
    const G = {};
    props.forEach((p) => { if (p.type === "edge") return; G[p.id] = el("g", { class: "cp", "data-id": p.id }, world); });
    const edgeLayer = el("g", { class: "cn-edges" }, world);
    world.insertBefore(edgeLayer, world.firstChild);
    props.filter((p) => p.type === "edge").forEach((p) => { G[p.id] = el("line", { class: "cp cn-line cn-edge", "data-id": p.id, pathLength: 1 }, edgeLayer); });

    const init = () => {
      const S = {};
      props.forEach((p) => { S[p.id] = { on: !!p.on, x: p.x || 0, y: p.y || 0, t: p.t || p.label || "", tone: p.tone || "", vals: p.vals ? p.vals.slice() : null, mark: p.mark ?? null, line: p.line ?? null, hl: false, dim: false, fmt: p.fmt || null }; });
      return S;
    };
    function apply(S, acts) {
      (acts || []).forEach(([op, ...a]) => {
        if (op === "show" || op === "hide") a.forEach((id) => { S[id].on = op === "show"; if (op === "show") S[id].dim = false; });
        else if (op === "move") { S[a[0]].x = a[1]; S[a[0]].y = a[2]; }
        else if (op === "text") S[a[0]].t = a[1];
        else if (op === "vals") { S[a[0]].vals = a[1].slice(); if (a[2]) S[a[0]].fmt = a[2]; }
        else if (op === "mark") S[a[0]].mark = a[1];
        else if (op === "line") S[a[0]].line = a[1];
        else if (op === "tone") S[a[0]].tone = a[1];
        else if (op === "hl") a.forEach((id) => { S[id].hl = true; });
        else if (op === "un") a.forEach((id) => { S[id].hl = false; });
        else if (op === "dim") a.forEach((id) => { S[id].dim = true; });
        else if (op === "dimall") ids.forEach((id) => { if (S[id].on) S[id].dim = true; S[id].hl = false; });
        else if (op === "clear") ids.forEach((id) => { S[id].on = false; S[id].hl = false; S[id].dim = false; });
      });
    }
    const sig = {};
    function render(S) {
      props.forEach((p) => {
        const s = S[p.id], g = G[p.id];
        if (p.type === "edge") {
          const A = S[p.a], B = S[p.b];
          g.setAttribute("x1", A.x); g.setAttribute("y1", A.y); g.setAttribute("x2", B.x); g.setAttribute("y2", B.y);
        } else {
          const k = JSON.stringify([s.t, s.vals, s.mark, s.line, s.fmt]);
          if (sig[p.id] !== k) {
            const first = sig[p.id] === undefined;
            if (p.type === "code" && !first) {
              const hl = $(".cn-codehl", g), size = p.size || 20, lh = size * 1.55;
              hl.setAttribute("y", -size - 2 + (s.line ?? -9) * lh); hl.classList.toggle("cn-off", s.line == null);
            } else { DRAW[p.type](g, p, s); if (!first && s.on) { g.classList.remove("cn-pop"); requestAnimationFrame(() => g.classList.add("cn-pop")); } }
            sig[p.id] = k;
          }
          g.style.transform = `translate(${s.x}px, ${s.y}px)`;
        }
        g.classList.toggle("cn-in", s.on);
        g.classList.toggle("cn-hl", s.hl);
        g.classList.toggle("cn-dim", s.dim);
        ["acc", "gold", "good", "bad", "dim"].forEach((t) => g.classList.toggle("t-" + t, s.tone === t));
      });
    }
    function dur(b) { return b.ask ? 0 : Math.min(9.5, Math.max(3.2, 1.6 + String(b.say || "").length * 0.052)); }

    let k = -1, timer = null, playing = false, started = false, answered = {};
    function go(n, animate = true) {
      n = Math.max(0, Math.min(beats.length - 1, n));
      const S = init();
      for (let i = 0; i <= n; i++) apply(S, beats[i].do);
      if (!animate || REDUCED()) { root.classList.add("cn-jump"); render(S); void svg.getBoundingClientRect(); requestAnimationFrame(() => root.classList.remove("cn-jump")); }
      else render(S);
      k = n;
      const b = beats[n];
      bota.src = `${pre}bota${b.mood ? "-" + b.mood : ""}.svg`;
      bota.classList.remove("talk"); void bota.offsetWidth; bota.classList.add("talk");
      say.textContent = b.say || "";
      const ci = chapters.indexOf(b.ch);
      tabs.forEach((t, i) => { t.classList.toggle("on", i === ci); t.setAttribute("aria-pressed", i === ci ? "true" : "false"); });
      segs.forEach((s, i) => { s.classList.toggle("done", i < n); s.classList.toggle("cur", i === n); s.style.setProperty("--d", dur(beats[i]) + "s"); });
      $(".cn-n", root).textContent = `${n + 1} / ${beats.length}`;
      root.classList.toggle("cn-end", n === beats.length - 1);
      renderAsk(b, n);
      schedule();
    }
    function renderAsk(b, n) {
      if (!b.ask) { ask.hidden = true; ask.innerHTML = ""; return; }
      ask.hidden = false;
      const a = b.ask, done = answered[n];
      ask.innerHTML = `<div class="cn-opts" role="group" aria-label="Болжам таңдаңыз">${a.opts.map((o, i) => `<button type="button" data-o="${i}"${done != null ? " disabled" : ""} class="${done != null ? (i === a.ans ? "ok" : i === done ? "no" : "") : ""}">${esc(o)}</button>`).join("")}</div>`
        + (done != null ? `<p class="cn-why ${done === a.ans ? "ok" : "no"}">${done === a.ans ? "Дұрыс болжадыңыз. " : "Болжам - оқудың жартысы: қате болжаған мида жақсырақ қалады. "}${esc(a.why)}</p><button type="button" class="cn-cont" data-a="cont">Жалғастыру</button>` : "");
      if (done == null) say.textContent = a.q;
      $$("[data-o]", ask).forEach((btn) => btn.addEventListener("click", () => {
        answered[n] = +btn.dataset.o;
        renderAsk(b, n);
        bota.src = `${pre}bota-${answered[n] === a.ans ? "happy" : "think"}.svg`;
        const c = $("[data-a=cont]", ask); if (c) c.focus();
      }));
      const c = $("[data-a=cont]", ask);
      if (c) c.addEventListener("click", () => { setPlaying(true); go(n + 1); });
    }
    function schedule() {
      clearTimeout(timer); timer = null;
      const b = beats[k];
      segs.forEach((s) => s.classList.remove("run"));
      if (!playing) return;
      if (b.ask && answered[k] == null) { setPlaying(false, true); return; }
      if (k >= beats.length - 1) { setPlaying(false); return; }
      if (segs[k]) { void segs[k].offsetWidth; segs[k].classList.add("run"); }
      timer = setTimeout(() => go(k + 1), dur(b) * 1000);
    }
    function setPlaying(v, waiting = false) {
      playing = v;
      pIco.setAttribute("d", v ? "M7 5h4v14H7zM13 5h4v14h-4z" : "M8 5v14l11-7z");
      playB.setAttribute("aria-label", v ? "Тоқтату" : waiting ? "Болжам күтілуде" : "Ойнату");
      root.classList.toggle("cn-playing", v);
      if (!v) { clearTimeout(timer); timer = null; segs.forEach((s) => s.classList.remove("run")); }
    }
    function start() {
      started = true; root.classList.add("cn-started");
      setPlaying(true); go(0);
      root.focus({ preventScroll: true });
    }
    $("[data-a=start]", root).addEventListener("click", start);
    playB.addEventListener("click", () => {
      if (!started) return start();
      if (playing) return setPlaying(false);
      if (k >= beats.length - 1) { answered = {}; setPlaying(true); go(0, false); return; }
      setPlaying(true); schedule();
    });
    const manual = (n) => { if (!started) { started = true; root.classList.add("cn-started"); } setPlaying(false); go(n, Math.abs(n - k) === 1 && n > k); };
    $("[data-a=prev]", root).addEventListener("click", () => manual(k - 1));
    $("[data-a=next]", root).addEventListener("click", () => manual(k + 1));
    tabs.forEach((t, i) => t.addEventListener("click", () => manual(beats.findIndex((b) => b.ch === chapters[i]))));
    segs.forEach((s, i) => s.addEventListener("click", () => manual(i)));
    root.tabIndex = 0;
    root.addEventListener("keydown", (e) => {
      if (e.target !== root) return;
      if (e.key === "ArrowRight") { e.preventDefault(); manual(k + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); manual(k - 1); }
      else if (e.key === " ") { e.preventDefault(); playB.click(); }
    });
    // экраннан шыққанда тоқтайды (оқушы оқып жатқанда фильм өздігінен жүрмейді)
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((en) => { if (!en.isIntersecting && playing) setPlaying(false); }), { threshold: 0.25 }).observe(root);
    render(init());
    say.textContent = beats[0].say;
  }

  function boot() {
    const box = $("[data-cine]");
    const raw = $("#ac-data");
    if (!box || !raw) return;
    let data;
    try { data = JSON.parse(raw.textContent); } catch (e) { return; }
    if (!data.cine) return;
    data.title = box.dataset.title || "";
    Cine(box, data, box.dataset.img || "");
  }
  window.AO17Cine = { wrap };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
