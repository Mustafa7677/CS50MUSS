/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Команда» беттері: фото-фильм (камера жалпы фотода әр адамға жақындайды, кадр ауысады), көрінгенде ашылатын бөлімдер, санағыштар.
   Фильм: бейне файл жоқ - фотолар мен CSS transform. Қозғалыс азайтылса (html:not(.st-js)) - өздігінен ойнамайды, кадр бірден ауысады.
   Деректер: <script id="tf-data"> - кадрлар тізімі {img, alt, x, y, s, to?, hold, k, t, d} (tools/team_build.py жасайды). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const motion = () => document.documentElement.classList.contains("st-js");

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---------- скроллмен басқарылатын сахналар: data-scrub="pin" (жабысқақ сахна) | "through" (экраннан өту) ----------
  // Скроллдың нақты орны (t) мен көрсетілетін орны (c) бөлек: c әр кадрда t-ға 12%-ке жақындайды - қозғалыс «ілесіп», тегіс жүреді.
  // Тек transform мен opacity өзгереді (CSS айнымалысы --p арқылы). Қозғалыс азайтылса - c = t бірден.
  const scrubs = $$("[data-scrub]").map((el) => ({ el, pin: el.dataset.scrub === "pin", t: 0, c: -1, panels: $$(".uyq-p", el), hud: $$(".uyq-hb", el), ring: el.classList.contains("rng") ? $$(".rng-c", el) : null, now: $(".rng-now", el) }));
  if (scrubs.length) {
    let raf = 0;
    const measure = () => {
      const vh = innerHeight;
      scrubs.forEach((s) => { const r = s.el.getBoundingClientRect(); s.t = s.pin ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (r.height + vh)); });
    };
    const paint = () => {
      raf = 0;
      let moving = false;
      const mo = motion();
      scrubs.forEach((s) => {
        let c = !mo || s.c < 0 ? s.t : s.c + (s.t - s.c) * 0.12;
        if (Math.abs(c - s.t) < 0.0004) c = s.t; else moving = true;
        if (c === s.c) return;
        s.c = c;
        s.el.style.setProperty("--p", c.toFixed(4));
        if (s.ring) {   // 3D айналым: шеңбер c бойынша бұрылады; әр карточканың «алдыға қарауы» f = cos(бұрыш)
          const n = s.ring.length, rot = c * (n - 1) * (360 / n);
          s.el.style.setProperty("--rot", (-rot).toFixed(2) + "deg");
          let best = 0, bf = -2;
          s.ring.forEach((card, i) => { const f = Math.cos((i * 360 / n - rot) * Math.PI / 180); card.style.setProperty("--f", f.toFixed(3)); if (f > bf) { bf = f; best = i; } });
          if (s.now && s.now.dataset.i !== String(best)) { s.now.dataset.i = String(best); s.now.textContent = s.ring[best].dataset.name; }
        }
        if (s.panels.length) {
          const pos = c * (s.panels.length - 1);
          s.panels.forEach((p, i) => { const d = clamp(pos - i, -1.5, 1.5); p.style.setProperty("--d", d.toFixed(3)); p.style.setProperty("--a", clamp(1 - Math.abs(d)).toFixed(3)); });
          const on = Math.round(pos);
          s.hud.forEach((h, i) => { h.style.setProperty("--f", clamp(pos - i + 0.5).toFixed(3)); h.classList.toggle("is-on", i === on); h.setAttribute("aria-current", i === on ? "true" : "false"); });
        }
      });
      if (moving) raf = requestAnimationFrame(paint);
    };
    const kick = () => { measure(); if (!raf) raf = requestAnimationFrame(paint); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    kick();
    // көлденең галерея: атауды басқанда не ішіндегі сілтемеге фокус түскенде - сол адамның кадрына апару
    scrubs.filter((s) => s.panels.length).forEach((s) => {
      const go = (i, smooth) => {
        if (!motion()) return;
        const r = s.el.getBoundingClientRect(), span = s.el.offsetHeight - innerHeight;
        scrollTo({ top: scrollY + r.top + span * (i / (s.panels.length - 1)), behavior: smooth ? "smooth" : "auto" });
      };
      s.hud.forEach((h, i) => h.addEventListener("click", () => { go(i, true); if (!motion()) { const a = $("a", s.panels[i]); if (a) a.focus(); } }));
      s.panels.forEach((p, i) => p.addEventListener("focusin", () => go(i, false)));
    });
  }


  // ---------- алтын тозаң: ауада қалқыған ұсақ ұшқындар (әр .shx-dust canvas; тек көрінгенде және қозғалыс рұқсат болса) ----------
  if (motion()) $$(".shx-dust").forEach((dust) => {
    const ctx = dust.getContext("2d"), N = innerWidth < 700 ? 34 : 64;
    let W = 0, H = 0, on = false, raf2 = 0;
    const size = () => { const dpr = Math.min(2, devicePixelRatio || 1); W = dust.clientWidth; H = dust.clientHeight; dust.width = W * dpr; dust.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const P = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, v: .00025 + Math.random() * .0006, w: Math.random() * 6.28, s: .4 + Math.random() * .6 }));
    const tick = (t) => {
      raf2 = 0; if (!on) return;
      ctx.clearRect(0, 0, W, H);
      ctx.shadowColor = "rgba(242, 190, 90, .9)"; ctx.shadowBlur = 6;
      for (const q of P) {
        q.y -= q.v; q.x += Math.sin(t / 2400 + q.w) * .00018;
        if (q.y < -.02) { q.y = 1.02; q.x = Math.random(); }
        const al = (.35 + .65 * Math.abs(Math.sin(t / 900 * q.s + q.w))) * .8;
        ctx.beginPath(); ctx.arc(q.x * W, q.y * H, q.r, 0, 6.283);
        ctx.fillStyle = `rgba(242, 205, 130, ${al.toFixed(3)})`; ctx.fill();
      }
      raf2 = requestAnimationFrame(tick);
    };
    size(); addEventListener("resize", size);
    new IntersectionObserver((es) => es.forEach((e) => { on = e.isIntersecting && !document.hidden; if (on && !raf2) raf2 = requestAnimationFrame(tick); })).observe(dust);
  });

  // ---------- тақырыпты әріптерге бөлу (экран оқу құралы толық сөйлемді aria-label-дан оқиды) ----------
  $$("[data-split] > span").forEach((line) => {
    const t = line.textContent, n = t.length;
    line.setAttribute("aria-hidden", "true");
    line.innerHTML = [...t].map((ch, i) => `<span class="shx-ch" style="--ci:${i};--cn:${n}">${ch === " " ? " " : ch}</span>`).join("");
  });

  // ---------- 3D еңкею: тінтуір портреттің қай жерінде болса, сол жаққа сәл еңкейеді (тек дәл тінтуірде, қозғалыс рұқсат болса) ----------
  if (motion() && window.matchMedia && matchMedia("(pointer: fine)").matches) {
    $$("[data-tilt]").forEach((el) => {
      let raf3 = 0, ev = null;
      const paint = () => {
        raf3 = 0; if (!ev) return;
        const r = el.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        el.style.setProperty("--ry", ((x - .5) * 12).toFixed(2) + "deg"); el.style.setProperty("--rx", ((.5 - y) * 10).toFixed(2) + "deg");
        el.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      };
      el.addEventListener("pointermove", (e) => { ev = e; el.classList.add("is-tilt"); if (!raf3) raf3 = requestAnimationFrame(paint); });
      el.addEventListener("pointerleave", () => { ev = null; el.classList.remove("is-tilt"); el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  // ---------- көрінгенде ашылатын бөлімдер және санағыштар ----------
  const count = (b) => {
    const to = +b.dataset.to; if (!to || !motion()) return;
    const t0 = performance.now(), D = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); b.textContent = String(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const reveal = (el) => { el.classList.add("is-in"); $$("[data-to]", el).forEach(count); };
  const targets = $$("[data-reveal], .ta-row");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { rootMargin: "0px 0px -18% 0px" });
    targets.forEach((t) => io.observe(t));
  } else targets.forEach(reveal);

  // ---------- фото-фильм ----------
  const film = $("[data-film]"), raw = $("#tf-data");
  if (!film || !raw) return;
  let shots;
  try { shots = JSON.parse(raw.textContent); } catch (e) { return; }
  const frame = $(".tf-frame", film), cap = $(".tf-cap", film), bar = $(".tf-bar", film);
  const kE = $(".tf-k", cap), tE = $(".tf-t", cap), dE = $(".tf-d", cap);
  const A = $(".tf-l", frame), B = A.cloneNode(true);
  B.classList.remove("is-cur"); frame.insertBefore(B, A.nextSibling);
  let cur = A, k = -1, timer = 0, playing = false, started = false, t0 = 0, raf = 0;

  const ico = { play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>', pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg>', next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.6 5.4 1.4-1.4 8 8-8 8-1.4-1.4 6.6-6.6z"/></svg>' };
  const btn = (cls, label, html) => { const b = document.createElement("button"); b.type = "button"; b.className = "tf-b " + cls; b.setAttribute("aria-label", label); b.innerHTML = html; return b; };
  const playB = btn("tf-play", "Ойнату", ico.play), prevB = btn("tf-prev", "Алдыңғы кадр", ico.prev), nextB = btn("tf-next", "Келесі кадр", ico.next);
  const dots = document.createElement("div"); dots.className = "tf-dots"; dots.setAttribute("role", "group"); dots.setAttribute("aria-label", "Кадрлар");
  shots.forEach((s, i) => { const d = document.createElement("button"); d.type = "button"; d.className = "tf-dot"; d.setAttribute("aria-label", `${i + 1}-кадр: ${s.t}`); d.innerHTML = "<i></i>"; d.addEventListener("click", () => { pause(); show(i, true); }); dots.append(d); });
  const num = document.createElement("span"); num.className = "tf-n"; num.setAttribute("aria-hidden", "true");
  bar.append(playB, prevB, nextB, dots, num); bar.hidden = false;

  // нүктені (x%, y%) кадрдың ортасына әкелетін transform: scale(s) translate(...) - шеті көрінбейтіндей шектеледі
  const tf = (x, y, s) => {
    const lim = 50 - 50 / s, cl = (v) => Math.max(-lim, Math.min(lim, v));
    return `scale(${s}) translate(${cl(50 - x).toFixed(2)}%, ${cl(50 - y).toFixed(2)}%)`;
  };
  const setImg = (layer, s) => { const im = $("img", layer); if (im.getAttribute("src") !== s.img) { im.src = s.img; } im.alt = s.alt; };

  function show(i, manual) {
    if (i < 0 || i >= shots.length) return;
    const s = shots[i], prev = shots[k], fresh = !prev || prev.img !== s.img;
    const layer = prev && prev.img !== s.img ? (cur === A ? B : A) : cur, im = $("img", layer);
    const start = tf(s.x, s.y, s.s), end = s.to ? tf(s.to[0], s.to[1], s.to[2]) : start;
    setImg(layer, s);
    if (!motion()) { im.style.transition = "none"; im.style.transform = end; }
    else if (fresh) {   // жаңа сурет: бастапқы кадрдан баяу «камера» қозғалысы
      im.style.transition = "none"; im.style.transform = start; void im.offsetWidth;
      im.style.transition = `transform ${s.to ? s.hold + 1400 : 1800}ms cubic-bezier(.45, 0, .2, 1)`; im.style.transform = end;
    } else {            // сол сурет: камера қазіргі орнынан жаңа нүктеге жылжиды
      im.style.transition = `transform ${s.to ? s.hold + 1400 : 2000}ms cubic-bezier(.6, 0, .2, 1)`; im.style.transform = end;
    }
    if (layer !== cur) { layer.classList.add("is-cur"); cur.classList.remove("is-cur"); cur = layer; }
    k = i;
    kE.textContent = s.k; tE.textContent = s.t; dE.textContent = s.d;
    cap.classList.remove("is-swap"); void cap.offsetWidth; if (motion()) cap.classList.add("is-swap");
    cap.setAttribute("aria-live", manual ? "polite" : "off");
    $$(".tf-dot", dots).forEach((d, j) => { d.classList.toggle("is-done", j < i); d.classList.toggle("is-cur", j === i); d.setAttribute("aria-current", j === i ? "true" : "false"); });
    num.textContent = `${i + 1} / ${shots.length}`;
    prevB.disabled = i === 0; nextB.disabled = i === shots.length - 1;
    t0 = performance.now();
    if (playing) schedule();
  }
  const progress = () => {
    raf = 0; if (!playing) return;
    const d = $$(".tf-dot", dots)[k]; if (d) d.style.setProperty("--p", Math.min(100, (performance.now() - t0) / shots[k].hold * 100).toFixed(1) + "%");
    raf = requestAnimationFrame(progress);
  };
  function schedule() {
    clearTimeout(timer);
    if (!raf) raf = requestAnimationFrame(progress);
    timer = setTimeout(() => { if (k < shots.length - 1) show(k + 1, false); else { pause(); playB.setAttribute("aria-label", "Қайта көру"); } }, shots[k].hold);
  }
  function play() {
    if (k >= shots.length - 1) show(0, false);
    playing = true; playB.innerHTML = ico.pause; playB.setAttribute("aria-label", "Тоқтату"); schedule();
  }
  function pause() {
    playing = false; clearTimeout(timer); cancelAnimationFrame(raf); raf = 0;
    playB.innerHTML = ico.play; playB.setAttribute("aria-label", "Ойнату");
    const d = $$(".tf-dot", dots)[k]; if (d) d.style.setProperty("--p", "100%");
  }
  playB.addEventListener("click", () => (playing ? pause() : play()));
  prevB.addEventListener("click", () => { pause(); show(k - 1, true); });
  nextB.addEventListener("click", () => { pause(); show(k + 1, true); });
  frame.addEventListener("click", () => (playing ? pause() : play()));
  film.addEventListener("keydown", (e) => {
    if (e.target.closest("button") && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.key === "ArrowRight") { pause(); show(k + 1, true); } else if (e.key === "ArrowLeft") { pause(); show(k - 1, true); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) pause(); });

  show(0, false);
  if (!motion()) return;   // қозғалыс азайтылған: тек қолмен
  // фильм экранға кірген сәтте: шаңырақ сызылып, кадр ашылады (бір рет), сосын ойнай бастайды
  const start = () => {
    if (started) return; started = true;
    film.classList.add("is-intro"); setTimeout(() => film.classList.remove("is-intro"), 3800);
    setTimeout(() => { if (!playing && k === 0) play(); }, 2600);
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) start(); else if (playing) pause(); }), { threshold: 0.45 }).observe(frame);
  } else start();
})();
