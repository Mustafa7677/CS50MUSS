/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Команда» беттері: фото-фильм (камера жалпы фотода әр адамға жақындайды, кадр ауысады), көрінгенде ашылатын бөлімдер, санағыштар.
   Фильм: бейне файл жоқ - фотолар мен CSS transform. Қозғалыс азайтылса (html:not(.st-js)) - өздігінен ойнамайды, кадр бірден ауысады.
   Деректер: <script id="tf-data"> - кадрлар тізімі {img, alt, x, y, s, to?, hold, k, t, d} (tools/team_build.py жасайды). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const motion = () => document.documentElement.classList.contains("st-js");

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
  film.classList.add("is-intro");
  setTimeout(() => film.classList.remove("is-intro"), 3800);   // ашылу бір рет: кейінгі кадр ауысуында шеңбер қайталанбайды
  const start = () => { if (started) return; started = true; setTimeout(() => { if (!playing && k === 0) play(); }, 2600); };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) start(); else if (playing) pause(); }), { threshold: 0.45 }).observe(frame);
  } else start();
})();
