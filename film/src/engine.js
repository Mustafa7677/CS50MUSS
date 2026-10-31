/* © 2026 Sagid Mustafa. AO17 фильмдерінің ортақ қозғалтқышы (академия фильмдері осыны қолданады).
   «Шақыру» фильмінің (film/src/film.html) архитектурасы, деректермен басқарылатын түрде:
   - Бір уақыт ойнатқышы: бүкіл кадр render(t), t секундпен. Autoplay, скролл/тач/перне және шкала бір t-ны басқарады;
     әрекет біткен соң 0.9 с кейін фильм сол жерден жалғасады.
   - Сахна = {a, b}. Көршілер T секунд қабаттасады: шығатын камера өз [data-focus] элементіне кіреді, келесі сахна
     сол нүктеден дөңгелек терезе болып ашылады.
   - Әр фильм өзі береді: DUR (сахна ұзақтығы), inner[i](p, s) (сахна ішіндегі қозғалыс, камераны қайтарады),
     setup() (бір реттік дайындық), beat(ch) (тарау басындағы ұрма), drone (дыбыс жиіліктері), ambient (шаң түсі). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const io = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const eo = (k) => 1 - Math.pow(1 - k, 3);
  const ei = (k) => k * k * k;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  window.AO17Kit = { $, $$, clamp, lerp, io, eo, ei, seg };

  window.AO17Engine = function (cfg) {
    const root = document.documentElement;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) root.classList.add("still");
    const BEAT = 60 / (cfg.bpm || 72), BAR = BEAT * 4, T = 1.6;
    const scenes = $$(".sc").map((el, i) => ({ el, i, cam: $(".cam", el), lyrs: $$(".lyr", el), focus: $("[data-focus]", el) }));
    let acc = 0;
    scenes.forEach((s, i) => { s.a = acc; s.b = acc + cfg.dur[i]; acc = s.b - (i < scenes.length - 1 ? T : 0); });
    const LAST = scenes.length - 1, END = scenes[LAST].b;
    const CH = scenes.map((s) => s.a + (s.i ? T * .5 : 0));
    const ctx = { BEAT, T, still, get portrait() { return portrait; }, get W() { return W; }, get H() { return H; }, flash };

    // ---------- Ойнатқыш ----------
    let t = 0, target = 0, playing = !still, lastInput = -1e9, interacting = false, wasPlaying = false;
    const now = () => performance.now() / 1000;
    function seek(v, smooth = true) { target = clamp(v, 0, END); if (!smooth) t = target; lastInput = now(); interacting = true; }
    function setPlaying(v) {
      playing = v;
      $("#play").setAttribute("aria-label", v ? "Тоқтату" : "Ойнату");
      $("#playIco").setAttribute("d", v ? "M7 5h4v14H7zM13 5h4v14h-4z" : "M8 5v14l11-7z");
    }
    const chapterAt = (x) => { let c = 0; CH.forEach((v, i) => { if (x >= v - .01) c = i; }); return c; };

    // ---------- Енгізу ----------
    const K_WHEEL = 0.0065, K_TOUCH = 0.022, SAFE = "#ui, .top, .cta";
    addEventListener("wheel", (e) => { if (e.target.closest && e.target.closest(".cta")) return; e.preventDefault(); seek(target + e.deltaY * K_WHEEL * (e.deltaMode === 1 ? 30 : 1)); hideHint(); }, { passive: false });
    let ty = null, tvel = 0, tlast = 0;
    addEventListener("touchstart", (e) => { if (e.target.closest(SAFE)) return; ty = e.touches[0].clientY; tvel = 0; tlast = now(); seek(t); }, { passive: true });
    addEventListener("touchmove", (e) => {
      if (ty == null) return;
      const y = e.touches[0].clientY, dy = ty - y, n = now();
      tvel = dy / Math.max(.008, n - tlast); tlast = n; ty = y;
      seek(target + dy * K_TOUCH); hideHint();
    }, { passive: true });
    addEventListener("touchend", () => { if (ty == null) return; ty = null; seek(target + clamp(tvel * K_TOUCH * .12, -3, 3)); });
    addEventListener("keydown", (e) => {
      if (e.target.closest && e.target.closest("a, input")) return;
      const cur = chapterAt(t);
      if (e.key === " " && !e.target.closest("button")) { e.preventDefault(); setPlaying(!playing); }
      else if (["ArrowDown", "ArrowRight", "PageDown"].includes(e.key)) { e.preventDefault(); seek(CH[Math.min(LAST, cur + 1)]); }
      else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); seek(t - CH[cur] > 1.2 ? CH[cur] : CH[Math.max(0, cur - 1)]); }
      else if (e.key === "End") seek(END - .01);
      else if (e.key === "Home") seek(0);
    });
    const tl = $("#tl");
    const tlSeek = (x) => { const r = tl.getBoundingClientRect(); seek(clamp((x - r.left) / r.width) * END, false); };
    tl.addEventListener("pointerdown", (e) => { tl.setPointerCapture(e.pointerId); tlSeek(e.clientX); });
    tl.addEventListener("pointermove", (e) => { if (tl.hasPointerCapture(e.pointerId)) tlSeek(e.clientX); });
    CH.forEach((c) => { const d = document.createElement("i"); d.className = "tick"; d.style.left = (c / END * 100) + "%"; tl.appendChild(d); });
    const ticks = $$(".tick", tl);
    $("#play").addEventListener("click", () => setPlaying(!playing));
    // Академияға кірер алдындағы пролог (?intro=1): «Өткізу» бірден академияға апарады,
    // фильм біткен соң академия 4 с кейін өзі ашылады (кез келген әрекет мұны тоқтатады - таңдау адамда қалады).
    const intro = /[?&]intro=1/.test(location.search), home = $(".cta a.go") && $(".cta a.go").href;
    $("#skip").addEventListener("click", () => { if (intro && home) location.href = home; else seek(CH[LAST]); });
    let autoGo = 0, autoOff = false;
    function armAuto() {
      if (!intro || !home || autoOff || autoGo) return;
      root.classList.add("auto");
      autoGo = setTimeout(() => { location.href = home; }, 4000);
    }
    function cancelAuto() { clearTimeout(autoGo); autoGo = 0; root.classList.remove("auto"); }
    // Басқару фильм жүріп тұрғанда жасырылады; тышқан, тач не перне қайта көрсетеді. Шетте тек «Өткізу» қалады.
    let idleT = 0;
    function wake(e) {
      root.classList.remove("idle"); clearTimeout(idleT);
      if (e && e.type !== "focusin" && t > END - .3) { autoOff = true; cancelAuto(); }
      idleT = setTimeout(() => { if (playing && chapterAt(t) < LAST && !$("#ui").contains(document.activeElement)) root.classList.add("idle"); else wake(); }, 2600);
    }
    ["pointerdown", "keydown", "touchstart", "wheel", "focusin"].forEach((ev) => addEventListener(ev, wake, { passive: true }));
    addEventListener("pointermove", () => { root.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => wake(), 0); }, { passive: true });
    $("#skipLink").addEventListener("click", (e) => { e.preventDefault(); seek(END - .01, false); setTimeout(() => $(".cta a").focus(), 50); });
    let hinted = false;
    function hideHint() { if (!hinted) { hinted = true; $("#hint").classList.add("off"); } }
    setTimeout(hideHint, 7000);
    document.addEventListener("visibilitychange", () => { if (document.hidden) { wasPlaying = playing; setPlaying(false); } else if (wasPlaying) setPlaying(true); });

    // ---------- Композиция ----------
    let W = innerWidth, H = innerHeight, portrait = H > W * 1.05;
    function resize() { W = innerWidth; H = innerHeight; portrait = H > W * 1.05; root.classList.toggle("portrait", portrait); sizeCanvas(); scenes.forEach((s) => s.fRect = null); }
    addEventListener("resize", resize);

    // ---------- Рендер ----------
    let px = 0, py = 0, lastCh = -1, irisX = 50, irisY = 50;
    if (matchMedia("(pointer: fine)").matches && !still) addEventListener("pointermove", (e) => { px = e.clientX / W - .5; py = e.clientY / H - .5; });
    const stage = $("#stage");
    function render(tt, rt) {
      if (!still) { stage.style.setProperty("--ppx", (px * -26).toFixed(2) + "px"); stage.style.setProperty("--ppy", (py * -18).toFixed(2) + "px"); }
      scenes.forEach((s, i) => {
        const vis = tt >= s.a - .001 && tt <= s.b + .001;
        s.el.classList.toggle("on", vis);
        if (!vis) return;
        const p = clamp((tt - s.a) / (s.b - s.a));
        const c = (cfg.inner[i] && cfg.inner[i](p, s, ctx, rt)) || { z: 1, x: 0, y: 0 };
        let z = c.z, x = c.x, y = c.y, op = 1, clip = "none", origin = "50% 50%";
        if (i > 0 && tt < s.a + T) {
          const q = (tt - s.a) / T;
          clip = still ? "none" : `circle(${io(seg(q, .42, 1)) * 150}% at ${irisX.toFixed(1)}% ${irisY.toFixed(1)}%)`;
          op = still ? seg(q, .45, .55) : 1;
          z *= still ? 1 : lerp(1.35, 1, eo(q));
        }
        if (i < LAST && tt > s.b - T && s.focus && !still) {
          const q = (tt - (s.b - T)) / T;
          const f = s.fRect || (s.fRect = s.focus.getBoundingClientRect());
          const fx = f.left + f.width / 2, fy = f.top + f.height / 2;
          origin = `${fx}px ${fy}px`;
          const fill = clamp(Math.max(W / Math.max(8, f.width), H / Math.max(8, f.height)) * 1.4, 2, 16);
          const e = ei(q);
          z *= lerp(1, fill, e);
          x += (W / 2 - fx) * e; y += (H / 2 - fy) * e;
          irisX = (fx + (W / 2 - fx) * e) / W * 100; irisY = (fy + (H / 2 - fy) * e) / H * 100;
        } else s.fRect = null;
        s.cam.style.transformOrigin = origin;
        s.cam.style.transform = still ? "none" : `translate3d(${x + px * -14}px, ${y + py * -10}px, 0) scale(${z})`;
        s.el.style.clipPath = clip;
        s.el.style.opacity = op;
        s.el.style.zIndex = i;
      });
      const lb = (1 - seg(tt, scenes[LAST].a, scenes[LAST].a + T)) * seg(tt, 1, 4) * (portrait ? 0 : 1);
      $("#lbT").style.height = $("#lbB").style.height = (lb * 5.2) + "vh";
      $("#fill").style.width = (tt / END * 100) + "%";
      const ch = chapterAt(tt);
      tl.setAttribute("aria-valuenow", Math.round(tt / END * 100));
      tl.setAttribute("aria-valuetext", scenes[ch].el.dataset.title);
      ticks.forEach((k, i) => k.classList.toggle("done", i <= ch));
      if (ch !== lastCh) { if (ch > 0) hideHint(); lastCh = ch; $("#skip").hidden = ch === LAST; $("#capCh").textContent = scenes[ch].el.dataset.title; $("#capSrc").textContent = scenes[ch].el.dataset.src; if (cfg.beat) cfg.beat(ch, thump); }
    }

    // ---------- Монтаж жарқылы ----------
    function flash() { if (still) return; $("#flash").animate([{ opacity: .55 }, { opacity: 0 }], { duration: 260, easing: "ease-out" }); thump(640, .25, .08); }

    // ---------- Шаң мен түйіршік ----------
    const dc = $("#dust"), dx = dc.getContext("2d"), gc = $("#grain"), gx = gc.getContext("2d");
    const mote = cfg.ambient || "246,226,176";
    let motes = [];
    function sizeCanvas() {
      const r = Math.min(devicePixelRatio || 1, 1.5);
      dc.width = W * r; dc.height = H * r; dx.setTransform(r, 0, 0, r, 0, 0);
      motes = Array.from({ length: still ? 0 : Math.round(Math.min(60, W * H / 24000)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .4 + Math.random() * 1.5, v: .05 + Math.random() * .22, ph: Math.random() * 6.28 }));
    }
    const grainImg = gx.createImageData(160, 160);
    function drawAmbient(rt, tt) {
      dx.clearRect(0, 0, W, H);
      if (tt < scenes[LAST].a + T * .5) motes.forEach((m) => {
        m.y -= m.v; m.x += Math.sin(rt * .4 + m.ph) * .15;
        if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
        const a = (.1 + .5 * Math.max(0, 1 - Math.abs(m.x - W * .55) / (W * .4))) * (.6 + .4 * Math.sin(rt * 1.3 + m.ph));
        dx.fillStyle = `rgba(${mote},${a.toFixed(3)})`; dx.beginPath(); dx.arc(m.x, m.y, m.r, 0, 6.283); dx.fill();
      });
      if ((rt * 24 | 0) % 2 === 0) {
        const d = grainImg.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
        gx.putImageData(grainImg, 0, 0);
      }
    }

    // ---------- Дыбыс (WebAudio, әдепкіде өшірулі) ----------
    let ac = null, master = null;
    function audioOn() {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      master.gain.linearRampToValueAtTime(.5, ac.currentTime + 2);
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.connect(master);
      (cfg.drone || [55, 82.4, 110.2]).forEach((f, i) => { const o = ac.createOscillator(); o.type = i ? "triangle" : "sine"; o.frequency.value = f; o.detune.value = (i - 1) * 6; const g = ac.createGain(); g.gain.value = i ? .05 : .09; o.connect(g); g.connect(lp); o.start(); });
    }
    function audioOff() { if (master) { master.gain.linearRampToValueAtTime(0, ac.currentTime + .6); const m = master; setTimeout(() => m.disconnect(), 700); master = null; } }
    function thump(freq = 52, dur = 1.1, vol = .5) {
      if (!master) return;
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(freq * 2, ac.currentTime); o.frequency.exponentialRampToValueAtTime(freq, ac.currentTime + .12);
      g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + dur); o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + dur);
    }
    $("#snd").addEventListener("click", (e) => {
      const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
      e.currentTarget.setAttribute("aria-pressed", on); e.currentTarget.setAttribute("aria-label", on ? "Дыбыс: қосулы" : "Дыбыс: өшірулі");
      on ? audioOn() : audioOff();
    });

    // ---------- Цикл ----------
    let prev = now(), lastBar = -1;
    function frame() {
      const n = now(), dt = Math.min(.05, n - prev); prev = n;
      if (interacting) {
        t += (target - t) * (1 - Math.pow(.0009, dt));
        if (n - lastInput > .9 && Math.abs(target - t) < .01) interacting = false;
      } else if (playing) { t = Math.min(END, t + dt); target = t; if (t >= END) { setPlaying(false); armAuto(); } }
      const bar = Math.floor(t / BAR);
      if (bar !== lastBar) { if (playing && !interacting && master && bar > lastBar) thump(49, .9, .16); lastBar = bar; }
      render(t, n);
      drawAmbient(n, t);
      requestAnimationFrame(frame);
    }

    $$(".lyr").forEach((l) => { if (l.dataset.depth) l.style.setProperty("--d", l.dataset.depth); });
    $$("[data-draw]").forEach((p) => { p.setAttribute("pathLength", 1); p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1; });
    resize();
    if (cfg.setup) cfg.setup(ctx);
    setPlaying(playing);
    wake();
    if (still) $("#hint").textContent = "Тарауларды шкаладан не ← → пернелерімен ауыстырыңыз";
    Promise.all([document.fonts ? document.fonts.ready : 0, ...$$("img").map((i) => i.decode ? i.decode().catch(() => 0) : 0)]).then(() => { prev = now(); requestAnimationFrame(frame); });
    window.AO17Film = { seek: (v) => seek(v, false), get t() { return t; }, END, CH, scenes };
  };
})();
