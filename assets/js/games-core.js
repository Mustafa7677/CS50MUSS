/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
/* AO17: ойындар орталығы. Ойын тіркеу (register), хаб, рекорд/XP сақтау, аркада shell, нәтиже экраны, дыбыс.
   Барлық ойын ӨЗ жазған, интернетсіз, AI API-сіз жұмыс істейді. Деректер тек құрылғыда (localStorage "cs50kz:games"). */
(function () {
  "use strict";
  const KEY = "cs50kz:games";
  const MUTE_KEY = "cs50kz:games:mute"; // "0" = дыбыс қосулы; жоқ/"1" = өшірулі (әдепкі)
  const defs = [];
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const sample = (a, n) => shuffle(a).slice(0, n);
  const level = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
  const lvlFloor = (l) => 40 * (l - 1) * (l - 1);
  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion"); } catch (e) { return false; } };

  /* ---------- ойындардың қосымша сипаттамасы: санат, белгі, қиындық, ұпай максимумы ---------- */
  const META = {
    runner: { cats: ["python"], tags: ["Python", "Синтаксис"], diff: 2, max: 350 },
    bughunt: { cats: ["python", "c", "cpp", "java", "web"], tags: ["C", "C++", "Java", "Python", "JS"], diff: 2, max: 150 },
    battle: { cats: ["python", "c", "cpp", "java", "web"], tags: ["Python", "C", "C++", "Java", "JS"], diff: 3, max: 300 },
    algo: { cats: ["algo"], tags: ["Алгоритм"], diff: 3, max: 500 },
    sqlescape: { cats: ["sql"], tags: ["SQL"], diff: 3, max: 90 },
    memory: { cats: ["c", "cpp"], tags: ["C", "C++", "Жад"], diff: 3, max: 60 },
    oracle: { cats: ["cpp", "java"], tags: ["C++", "Java", "Нәтиже"], diff: 2, max: 800 },
    webbuilder: { cats: ["web"], tags: ["HTML", "CSS"], diff: 1, max: 100 },
    binary: { cats: ["algo"], tags: ["Екілік", "Биттер"], diff: 2, max: 350 },
    enmatch: { cats: ["en"], tags: ["English", "Сөздік"], diff: 1, max: 250 },
    enspell: { cats: ["en"], tags: ["English", "Емле"], diff: 2, max: 130 },
    enbuild: { cats: ["en"], tags: ["English", "Сөйлем"], diff: 2, max: 120 },
    enarticle: { cats: ["en"], tags: ["English", "Артикль"], diff: 2, max: 300 },
    enbugfix: { cats: ["en"], tags: ["English", "IT-мәтін"], diff: 3, max: 120 },
  };
  const CATS = [["all", "Бәрі"], ["python", "Python"], ["c", "C"], ["cpp", "C++"], ["java", "Java"], ["sql", "SQL"], ["web", "Веб"], ["algo", "Алгоритм"]];
  CATS.push(["en", "Ағылшын"]);
  const meta = (d) => META[d.id] || { cats: ["algo"], tags: ["Ойын"], diff: 2, max: 0 };
  const GLYPHS = ["{ }", "01", "</>", ";", "( )", "#", "[ ]", "=>", "&&", "10", "0x", "++"];

  /* ---------- дыбыс (WebAudio, өз синтезі). Әдепкіде өшірулі; тек пайдаланушы әрекетінен кейін ---------- */
  let muted = true;
  try { muted = localStorage.getItem(MUTE_KEY) !== "0"; } catch (e) {}
  let ac = null, acted = false;
  const onAct = () => { acted = true; };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, onAct, { capture: true, passive: true }));
  function audio() {
    if (ac) return ac;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { ac = new C(); } catch (e) { ac = null; }
    return ac;
  }
  /** nota: [жиілік, басталуы (с), ұзақтығы (с), толқын түрі, дыбыс деңгейі] */
  const SFX = {
    ok: [[660, 0, .09, "triangle", .16], [990, .08, .14, "triangle", .16]],
    bad: [[220, 0, .14, "sawtooth", .1], [150, .11, .22, "sawtooth", .1]],
    tick: [[1100, 0, .035, "square", .05]],
    win: [[523, 0, .12, "triangle", .15], [659, .11, .12, "triangle", .15], [784, .22, .12, "triangle", .15], [1047, .33, .32, "triangle", .17]],
    record: [[523, 0, .1, "square", .08], [659, .09, .1, "square", .08], [784, .18, .1, "square", .08], [1047, .27, .1, "square", .08], [784, .38, .09, "square", .08], [1047, .46, .09, "square", .08], [1319, .55, .4, "triangle", .16]],
  };
  function sfx(name) {
    if (muted || !acted) return;
    const a = audio();
    if (!a || !SFX[name]) return;
    try {
      if (a.state === "suspended") a.resume();
      const t0 = a.currentTime + 0.01;
      SFX[name].forEach(([f, st, du, type, vol]) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + st);
        g.gain.exponentialRampToValueAtTime(vol, t0 + st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + du);
        o.connect(g); g.connect(a.destination);
        o.start(t0 + st); o.stop(t0 + st + du + 0.03);
      });
    } catch (e) {}
  }
  function setMuted(m) { muted = !!m; try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {} }

  function totals() {
    const s = read();
    let xp = 0, plays = 0, records = 0;
    Object.values(s).forEach((g) => { xp += g.xp || 0; plays += g.plays || 0; if (g.best > 0) records++; });
    return { xp, plays, records, level: level(xp), games: s };
  }
  function lvlInfo(xp) {
    const l = level(xp), lo = lvlFloor(l), hi = lvlFloor(l + 1);
    return { level: l, lo, hi, pct: Math.max(0, Math.min(100, Math.round(((xp - lo) / (hi - lo)) * 100))), need: hi - xp };
  }

  /** Ойынды тіркеу: {id, title, icon, color, blurb, how, start(root, ctx)} */
  function register(def) { if (!defs.find((d) => d.id === def.id)) defs.push(def); render(); }

  function record(def, res) {
    const s = read();
    const g = s[def.id] || { best: 0, plays: 0, xp: 0 };
    const score = Math.max(0, Math.round(res.score || 0));
    const isBest = score > (g.best || 0);
    const xp = Math.max(0, Math.min(100, Math.round(res.xp != null ? res.xp : score / 2)));
    g.best = Math.max(g.best || 0, score); g.plays = (g.plays || 0) + 1; g.xp = (g.xp || 0) + xp; g.last = Date.now();
    s[def.id] = g; write(s);
    const K = window.CS50KZ;
    if (K) { try { K.bump("trainer", 1); K.mark("games"); K.mark("game-" + def.id); K.check && K.check(); } catch (e) {} }
    document.dispatchEvent(new CustomEvent("cs50kz:games"));
    return { score, xp, isBest, best: g.best };
  }

  /* ---------- хаб ---------- */
  let root = null, current = null, introObs = null, countRaf = 0;
  const dayIndex = () => { const d = new Date(); return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate(); };
  const diffStars = (n) => `<span class="gx-diff" role="img" aria-label="Қиындық: ${n} / 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}" aria-hidden="true">★</i>`).join("")}</span>`;
  const colorVars = (c) => `--gc:${c || "#087a96"}`;

  function card(d, t, daily) {
    const g = t.games[d.id] || {}, m = meta(d);
    const rec = g.best ? `<span class="gx-rec" title="Рекорд">🏆 ${g.best}</span>` : `<span class="gx-rec gx-new">Жаңа</span>`;
    return `<a class="game-card gx-card" href="#${d.id}" style="${colorVars(d.color)}" data-cats="${m.cats.join(" ")}"${daily ? ' data-daily="1"' : ""}>
      <span class="gx-card-bg" aria-hidden="true">${d.icon}</span>
      <span class="gx-card-top"><span class="gc-ico gx-ico" aria-hidden="true">${d.icon}</span>${rec}</span>
      <span class="gc-title">${esc(d.title)}</span>
      <span class="gc-blurb">${esc(d.blurb)}</span>
      <span class="gx-tags">${m.tags.map((x) => `<span class="gx-tag">${esc(x)}</span>`).join("")}</span>
      <span class="gc-meta gx-card-foot">${diffStars(m.diff)}<span class="gx-plays">${g.plays ? `${g.plays} ойын` : "Әлі ойнамадың"}</span></span>
      <span class="gx-play-btn" aria-hidden="true">▶ Ойнау</span></a>`;
  }

  function hub() {
    document.body.classList.remove("gx-in-game");
    const t = totals(), li = lvlInfo(t.xp);
    const d0 = defs.length ? defs[dayIndex() % defs.length] : null;
    const glyphs = GLYPHS.map((g, i) => `<span style="--i:${i}">${esc(g)}</span>`).join("");
    const daily = d0 ? `<a class="gx-daily" href="#${d0.id}" style="${colorVars(d0.color)}">
        <span class="gx-daily-ico" aria-hidden="true">${d0.icon}</span>
        <span class="gx-daily-txt"><span class="gx-daily-eyebrow">⚡ Күннің ойыны</span><b>${esc(d0.title)}</b><span>${esc(d0.blurb)}</span></span>
        <span class="gx-daily-go" aria-hidden="true">▶ Ойнау</span></a>` : "";
    root.innerHTML = `<section class="gx-hero" aria-label="Ойындар орталығы">
        <div class="gx-glyphs" aria-hidden="true">${glyphs}</div>
        <div class="gx-hero-body">
          <p class="gx-eyebrow">🎮 Аркада</p>
          <h2 class="gx-hero-title">Ойна. Үйрен. <span>Деңгейіңді өсір.</span></h2>
          <p class="gx-hero-sub">Python, C, C++, Java, SQL, веб және алгоритмдер: қысқа раундтар, рекордтар мен XP. Интернетсіз, тіркелусіз.</p>
        </div>
        <div class="gx-panel" role="status">
          <div class="gx-lvl" style="--p:${li.pct}%" aria-hidden="true"><span>${li.level}</span></div>
          <div class="gx-panel-main">
            <div class="gx-panel-row"><b>Деңгей ${li.level}</b><span>${t.xp} XP</span></div>
            <div class="gx-xpbar" role="progressbar" aria-label="Келесі деңгейге дейін" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${li.pct}"><i style="width:${li.pct}%"></i></div>
            <p class="gx-panel-next">Келесі деңгейге дейін <b>${li.need}</b> XP</p>
          </div>
          <ul class="gx-mini"><li><b>${t.plays}</b><span>ойын</span></li><li><b>${t.records}</b><span>рекорд</span></li></ul>
          <a class="gx-cab" href="profile.html#cabinet">Менің кабинетім →</a>
        </div>
      </section>
      ${daily}
      <div class="gx-filters" role="group" aria-label="Ойын санаттары">${CATS.map(([k, n], i) => `<button type="button" class="gx-chip" data-cat="${k}" aria-pressed="${i === 0 ? "true" : "false"}">${n}</button>`).join("")}</div>
      <div class="games-grid gx-grid">${defs.map((d) => card(d, t, d0 && d.id === d0.id)).join("") || "<p>Ойындар жүктелуде…</p>"}</div>
      <p class="gx-empty" hidden>Бұл санатта ойын жоқ.</p>
      <p class="games-note">Барлық ойын интернетсіз, тіркелусіз, ақысыз жұмыс істейді. Нәтижелер тек осы құрылғыда сақталады.</p>`;
    const chips = [...root.querySelectorAll(".gx-chip")];
    chips.forEach((c) => (c.onclick = () => {
      chips.forEach((x) => x.setAttribute("aria-pressed", x === c ? "true" : "false"));
      const k = c.dataset.cat; let n = 0;
      root.querySelectorAll(".gx-grid .game-card").forEach((a) => { const show = k === "all" || a.dataset.cats.split(" ").includes(k); a.hidden = !show; if (show) n++; });
      root.querySelector(".gx-empty").hidden = n > 0;
    }));
  }

  /* ---------- ортақ: ережелер чиптері бар бастау экраны ---------- */
  function introHTML(def, o) {
    o = o || {};
    return `<div class="ga-intro gx-intro">
      <div class="gx-intro-ico" aria-hidden="true">${o.icon || def.icon}</div>
      <h3 class="gx-intro-title">${esc(o.title || def.title)}</h3>
      ${o.lead ? `<p class="gx-lead">${o.lead}</p>` : ""}
      <ul class="gx-rules">${(o.rules || []).map((r) => `<li><span class="gx-rule-ico" aria-hidden="true">${r[0]}</span><span>${r[1]}</span></li>`).join("")}</ul>
      ${o.extra || ""}
      <button class="btn ga-go gx-go" type="button">▶ Бастау</button>
      <p class="gx-keyhint">Enter немесе Space: бастау</p></div>`;
  }

  /* басқа ойындардың дайын .ga-intro блогын да аркада стилінде көрсету (белгіше + тақырып қосылады) */
  function watchIntro(stage, def) {
    if (introObs) introObs.disconnect();
    if (!window.MutationObserver) return;
    introObs = new MutationObserver(() => {
      const el = stage.querySelector(".ga-intro:not(.gx-intro):not(.gy-intro)");
      if (!el) return;
      el.classList.add("gx-intro");
      el.insertAdjacentHTML("afterbegin", `<div class="gx-intro-ico" aria-hidden="true">${def.icon}</div><h3 class="gx-intro-title">${esc(def.title)}</h3>`);
      const go = el.querySelector(".ga-go");
      if (go) go.classList.add("gx-go");
    });
    introObs.observe(stage, { childList: true });
  }

  function starsFor(def, res, score) {
    const max = res.max != null ? res.max : meta(def).max;
    if (score <= 0) return 0;
    if (max > 0) { const r = score / max; return r >= 0.75 ? 3 : r >= 0.4 ? 2 : 1; }
    return score >= 200 ? 3 : score >= 80 ? 2 : 1;
  }
  const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

  function countUp(el, to) {
    cancelAnimationFrame(countRaf);
    if (reduced() || to <= 0) { el.textContent = to; return; }
    const t0 = performance.now(), dur = Math.min(1400, 500 + to * 4);
    const step = (now) => {
      if (!el.isConnected) return;
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) countRaf = requestAnimationFrame(step); else el.textContent = to;
    };
    el.textContent = 0; countRaf = requestAnimationFrame(step);
    setTimeout(() => { if (el.isConnected) el.textContent = to; }, dur + 400); // сағат тоқтаса да соңғы мән шығады
  }

  /* ---------- ойын shell ---------- */
  function open(id) {
    const def = defs.find((d) => d.id === id);
    if (!def) return hub();
    current = def;
    document.body.classList.add("gx-in-game");
    const t = totals().games[id] || {};
    root.innerHTML = `<div class="game-shell gx-shell" style="${colorVars(def.color)}">
      <div class="game-bar gx-hud"><a class="game-back" href="#" aria-label="Ойындар тізіміне оралу">← Ойындар</a><h2><span class="gx-hud-ico" aria-hidden="true">${def.icon}</span> ${esc(def.title)}</h2>
        <span class="game-best">🏆 Рекорд: <b>${t.best || 0}</b></span>
        <button class="gx-mute" type="button" aria-pressed="${muted ? "false" : "true"}" aria-label="Дыбыс" title="Дыбыс қосу/өшіру">${muted ? "🔇" : "🔊"}</button></div>
      <div class="game-stage gx-stage" id="game-stage" tabindex="-1"></div></div>`;
    const stage = root.querySelector("#game-stage");
    const muteBtn = root.querySelector(".gx-mute");
    muteBtn.onclick = () => {
      setMuted(!muted);
      muteBtn.textContent = muted ? "🔇" : "🔊";
      muteBtn.setAttribute("aria-pressed", muted ? "false" : "true");
      muteBtn.setAttribute("aria-label", muted ? "Дыбыс өшірулі" : "Дыбыс қосулы");
      acted = true; sfx("tick");
    };
    muteBtn.setAttribute("aria-label", muted ? "Дыбыс өшірулі" : "Дыбыс қосулы");
    watchIntro(stage, def);
    /* Enter/Space бастау экранында ойынды іске қосады */
    const startKey = (e) => {
      if (!stage.isConnected) return document.removeEventListener("keydown", startKey);
      if ((e.key !== "Enter" && e.key !== " ") || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const tg = e.target;
      if (tg && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(tg.tagName)) return;
      const go = stage.querySelector(".gx-intro .ga-go");
      if (go) { e.preventDefault(); go.click(); }
    };
    document.addEventListener("keydown", startKey);
    const ctx = {
      esc, shuffle, sample, stage, sfx, reduced,
      /** Ережелер чиптері бар бастау экраны: {rules:[[белгі, мәтін]], lead?, note?, extra?} → «Бастау» батырмасы */
      intro(o) {
        stage.innerHTML = introHTML(def, o);
        const go = stage.querySelector(".ga-go");
        go.onclick = () => { sfx("tick"); if (o && o.onStart) o.onStart(); };
        go.focus();
        return go;
      },
      /** Ойын аяқталды: {score, xp?, title?, lines?: [string], max?: number} */
      finish(res) {
        if (introObs) introObs.disconnect();
        const before = totals(), b = lvlInfo(before.xp);
        const r = record(def, res);
        const after = totals(), a = lvlInfo(after.xp);
        const stars = starsFor(def, res, r.score);
        const leveled = a.level > b.level;
        const trophy = stars === 3 ? "🏆" : stars === 2 ? "🥈" : stars === 1 ? "🥉" : "🎯";
        const startPct = leveled ? 0 : b.pct;
        stage.innerHTML = `<div class="game-result gx-result" role="group" aria-label="Нәтиже">
          <div class="gx-trophy" aria-hidden="true">${trophy}</div>
          <p class="gr-big">${esc(res.title || "Ойын аяқталды!")}</p>
          <div class="gx-stars" role="img" aria-label="${stars} жұлдыз / 3">${[1, 2, 3].map((i) => `<span class="gx-star${i <= stars ? " on" : ""}" style="--d:${i * 0.28}s">${starSvg}</span>`).join("")}</div>
          <p class="gr-score">Ұпай: <b class="gx-count" aria-hidden="true">${r.score}</b><span class="gx-sr">${r.score}</span>${r.isBest ? "" : ` · рекорд: ${r.best}`}</p>
          ${r.isBest ? '<p class="gx-banner"><span class="gr-new">🏆 Жаңа рекорд!</span></p>' : ""}
          <p class="gr-xp">+${r.xp} XP</p>
          <div class="gx-xpcard"><div class="gx-lvl gx-lvl-s" style="--p:${a.pct}%" aria-hidden="true"><span>${a.level}</span></div>
            <div class="gx-xpcard-main"><div class="gx-panel-row"><b>Деңгей ${a.level}${leveled ? ' <em class="gx-up">Жаңа деңгей!</em>' : ""}</b><span>${after.xp} XP</span></div>
              <div class="gx-xpbar" aria-hidden="true"><i style="width:${startPct}%"></i></div>
              <p class="gx-panel-next">Келесі деңгейге дейін ${a.need} XP</p></div></div>
          ${(res.lines || []).map((l) => `<p class="gr-line">${esc(l)}</p>`).join("")}
          <div class="gr-actions"><button class="btn gr-again gx-big" type="button">↻ Қайта ойнау</button><a class="btn ghost gx-big gx-other" href="#">Басқа ойын</a></div></div>`;
        stage.querySelector(".gr-again").onclick = () => open(id);
        stage.focus();
        const cnt = stage.querySelector(".gx-count");
        countUp(cnt, r.score);
        requestAnimationFrame(() => requestAnimationFrame(() => { const f = stage.querySelector(".gx-xpbar i"); if (f) f.style.width = a.pct + "%"; }));
        sfx(r.isBest ? "record" : stars >= 2 ? "win" : stars === 0 ? "bad" : "ok");
        if ((r.isBest || stars === 3 || leveled) && window.CS50KZ && window.CS50KZ.celebrate && !reduced()) { try { window.CS50KZ.celebrate(); } catch (e) {} }
        const bb = root.querySelector(".game-best b"); if (bb) bb.textContent = r.best;
      },
    };
    stage.focus();
    try { def.start(stage, ctx); } catch (e) { stage.innerHTML = '<p class="game-err">Ойынды іске қосу мүмкін болмады. Бетті жаңартып көріңіз.</p>'; }
  }

  function route() { if (!root) return; const id = location.hash.replace("#", ""); if (id) open(id); else { current = null; hub(); } }
  function render() { if (!root) return; if (!current) route(); }

  document.addEventListener("DOMContentLoaded", () => {
    root = document.querySelector(".games-root");
    if (!root) return;
    document.body.classList.add("gx-page");
    window.addEventListener("hashchange", route);
    route();
  });
  window.CS50Games = { register, totals, esc, shuffle, sample, sfx };
})();
