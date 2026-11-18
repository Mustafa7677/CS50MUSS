/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Уақыт машинасы» - team.html ашылуы (8.0). СКРОЛЛ - УАҚЫТ, СҮЙРЕУ - КЕҢІСТІК. three.js r160 (MIT, assets/vendor/three).
   Бүкіл сахна бір p (0..1, бетті айналдыру) мәнінен есептеледі: алға айналдырсаң - фильм алға, артқа - тура кері.
     0-0.18  Топса: түпнұсқа топ фотосы (DOM-дағы фотоның тура орнында) қатты тақта ретінде сол жақ жиегінен 70° есік сияқты ашылады,
             камера оның жанынан өтіп, артындағы киіз үйдің ішіне кіреді;
     0.18-0.82  Орбита: төбеде шаңырақ, айналада жеті рамка - бес түпнұсқа портрет, бірлескен жұмыс, дизайнерлер дуэті (кесілмейді, фонымен).
             Камера ортада тұрып, әр рамкаға кезекпен бұрылады; шаңырақтың түйіні сол адамды көрсетеді;
     0.82-0.9   Шегіну: камера көтеріліп, бүкіл құрылыс көрінеді;  0.9-1  Мүмкін емес оралу: есік жабылып, кадр ашылудағы фотоға тура оралады.
   Көлденең сүйреу (не ← →, не пернетақта) - кеңістікті бұрады және көрші рамкаға өтеді. Қозғалыс азайса не WebGL жоқ болса - статикалық ашылу. */
const root = document.querySelector(".tmx"), raw = document.getElementById("tmx-data");
const reduced = () => document.documentElement.classList.contains("reduce-motion") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
const testOn = (() => { try { return sessionStorage.getItem("ao17:test-gl") === "1"; } catch (e) { return false; } })();
if (root && raw && !reduced() && webgl() && (!navigator.webdriver || testOn)) {
  import("../vendor/three/three.module.min.js").then((THREE) => start(THREE, JSON.parse(raw.textContent))).catch((e) => { console.warn(e); root.classList.remove("tmx-live"); });
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const P = { open: .01, hinge: .1, enter: .18, orbit: .82, rise: .9, close: .98 };

async function start(THREE, D) {
  const stick = root.querySelector(".tmx-stick"), cv = root.querySelector(".tmx-cv"), photoImg = root.querySelector(".lf-photo img");
  const loader = new THREE.TextureLoader();
  const load = (src) => new Promise((res) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));
  const [gTex, altTex, ...sTex] = await Promise.all([load(D.group), load(D.alt), ...D.stops.map((s) => load(s.img))]);
  if (!gTex) return;
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
  const mobile = () => innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile() ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  [gTex, altTex, ...sTex].forEach((t) => { if (t) { t.anisotropy = maxAniso; t.needsUpdate = true; } });
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); root.classList.remove("tmx-live"); }, false);
  root.classList.add("tmx-live");

  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0b0a09, 26, 70);
  const cam = new THREE.PerspectiveCamera(42, 1, .1, 200);
  scene.add(new THREE.AmbientLight(0xfff1dc, .9));
  const key = new THREE.PointLight(0xffe2b0, 40, 40, 1.6); scene.add(key);
  const GOLD = new THREE.Color("#bfa276"), IVORY = new THREE.Color("#ece8df");

  // ---------- топ фотосы: қатты тақта, топсасы сол жақ жиегінде ----------
  const PW = 10, PH = PW / D.gar;
  const door = new THREE.Group(); door.position.set(-PW / 2, 0, 0); scene.add(door);
  const gMat = new THREE.MeshBasicMaterial({ map: gTex, transparent: true });
  const gMesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), gMat); gMesh.position.x = PW / 2; door.add(gMesh);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ color: 0x15130f, transparent: true, side: THREE.BackSide }));
  back.position.copy(gMesh.position); back.position.z = -.02; door.add(back);
  const edgeMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 });
  const rectLine = (w, h, mat) => new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w / 2, -h / 2, 0), new THREE.Vector3(w / 2, -h / 2, 0), new THREE.Vector3(w / 2, h / 2, 0), new THREE.Vector3(-w / 2, h / 2, 0)]), mat);
  { const l = rectLine(PW + .16, PH + .16, edgeMat); l.position.copy(gMesh.position); l.position.z = .01; door.add(l); }

  // есіктің артында - екінші түпнұсқа топ фотосы (басқа композиция), рамкада; камера оның оң жағынан өтеді
  const AW = 6, AH = AW / D.aar;
  const altG = new THREE.Group(); altG.position.set(-3.4, 0, -7.6); altG.rotation.y = .18; scene.add(altG);
  const altMat = new THREE.MeshBasicMaterial({ map: altTex, transparent: true, opacity: 0 });
  altG.add(new THREE.Mesh(new THREE.PlaneGeometry(AW, AH), altMat));
  const altLine = new THREE.LineBasicMaterial({ color: IVORY, transparent: true, opacity: 0 });
  { const l = rectLine(AW + .2, AH + .2, altLine); l.position.z = .01; altG.add(l); }

  // ---------- киіз үй: төбеде шаңырақ, айналада жеті рамка (түпнұсқа фото, кесілмейді) ----------
  const C = new THREE.Vector3(0, 0, -19), RF = 10, N = D.stops.length, HP = 6.2;
  const ang = (k) => k * Math.PI * 2 / N;
  const dirOf = (a) => new THREE.Vector3(Math.sin(a), 0, -Math.cos(a));
  const frames = D.stops.map((st, k) => {
    const h = st.kind === "member" ? HP : HP * .74, w = h * st.ar;
    const g = new THREE.Group(); g.position.copy(C).addScaledVector(dirOf(ang(k)), RF); g.lookAt(C); scene.add(g);
    const mat = new THREE.MeshBasicMaterial({ map: sTex[k], transparent: true });
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat));
    const mount = new THREE.Mesh(new THREE.PlaneGeometry(w + .5, h + .5), new THREE.MeshBasicMaterial({ color: 0x14120e, transparent: true })); mount.position.z = -.03; g.add(mount);
    const lm = new THREE.LineBasicMaterial({ color: IVORY, transparent: true, opacity: .3 }); const l = rectLine(w + .22, h + .22, lm); l.position.z = .01; g.add(l);
    return { g, mat, mount, lm, w, h, st };
  });
  const ringY = HP / 2 + 2.6, RR = 4.2;
  const shan = new THREE.Group(); shan.position.set(C.x, ringY, C.z); scene.add(shan);
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: .7, roughness: .35, emissive: new THREE.Color("#3a2a12"), emissiveIntensity: .5, transparent: true });
  const torus = new THREE.Mesh(new THREE.TorusGeometry(RR, .08, 14, 140), gold); torus.rotation.x = Math.PI / 2; shan.add(torus);
  const torus2 = new THREE.Mesh(new THREE.TorusGeometry(RR * .9, .035, 10, 140), gold); torus2.rotation.x = Math.PI / 2; shan.add(torus2);
  const bars = new THREE.Group(); shan.add(bars);
  [-.32, .32].forEach((d) => { const L = 2 * Math.sqrt(1 - d * d) * RR * .9; const a = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, L), gold); a.position.x = d * RR; bars.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(L, .07, .07), gold); b.position.z = d * RR; bars.add(b); });
  // уықтар: шаңырақтан әр рамканың үстіне (бес адам мен екі бірлескен кадр - бір құрылыстың бөлігі)
  const uykPts = [];
  frames.forEach((f, k) => { const a = ang(k), d = dirOf(a); uykPts.push(new THREE.Vector3(d.x * RR, 0, d.z * RR), new THREE.Vector3(d.x * (RF - .2), -ringY + f.h / 2 + .45, d.z * (RF - .2))); });
  const uykMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: .5 });
  shan.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(uykPts), uykMat));
  // бес түйін - бес автор
  const nodes = [];
  D.stops.forEach((st, k) => { if (st.kind !== "member") return; const d = dirOf(ang(k)); const s = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 16), new THREE.MeshStandardMaterial({ color: IVORY, emissive: GOLD, emissiveIntensity: .1, transparent: true })); s.position.set(d.x * RR, 0, d.z * RR); shan.add(s); nodes.push({ k, s }); });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RF + 4, 64), new THREE.MeshBasicMaterial({ color: 0x0f0d0b, transparent: true, opacity: .9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(C.x, -HP / 2 - .9, C.z); scene.add(floor);
  key.position.set(C.x, ringY + 2, C.z);

  // ---------- камера: бастапқы кадр DOM-дағы фотоның тура орнында ----------
  let W = 1, H = 1, start0 = null, look0 = null, stops = [], dOrbit = 10, lookDrop = 0;
  const stopP = (k) => P.enter + (P.orbit - P.enter) * (k + .25) / N;   // әр рамканың «тоқтау» нүктесі
  function layout() {
    W = stick.clientWidth; H = stick.clientHeight;
    renderer.setSize(W, H, false);
    const asp = W / H; cam.aspect = asp; cam.fov = asp < .8 ? 56 : 42; cam.updateProjectionMatrix();
    const tn = Math.tan(cam.fov * Math.PI / 360);
    // DOM фотоның сахнадағы орны (статикалық күйде, transform жоқ)
    const sr = stick.getBoundingClientRect(), r = photoImg.getBoundingClientRect();
    const rw = Math.max(40, r.width), cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
    const upp = PW / rw, D0 = upp * H / (2 * tn);
    start0 = new THREE.Vector3(-(cx - W / 2) * upp, (cy - H / 2) * upp, D0);
    look0 = new THREE.Vector3(start0.x, start0.y, 0);
    // орбитадағы қашықтық: портрет көрінсін (биіктігі не ені бойынша), телефонда жазуға төменде орын
    const mw = Math.max(...frames.map((f) => f.w));
    dOrbit = Math.max(HP / (.74 * 2 * tn), mw / (.86 * 2 * tn * asp));
    lookDrop = asp < .8 ? .14 * 2 * dOrbit * tn : .02 * 2 * dOrbit * tn;
  }
  layout(); addEventListener("resize", () => { layout(); kick(); });

  // ---------- басқару: скролл (уақыт), сүйреу (кеңістік) ----------
  let p = 0, pc = -1, yawOff = 0, yawT = 0, drag = null, raf = 0, visible = true;
  const prog = () => { const r = root.getBoundingClientRect(), span = root.offsetHeight - stick.offsetHeight; return clamp(-r.top / Math.max(1, span)); };
  const goP = (t) => { const span = root.offsetHeight - stick.offsetHeight; scrollTo({ top: root.getBoundingClientRect().top + scrollY + t * span, behavior: "smooth" }); };
  const curStop = () => clamp(Math.round((p - P.enter) / ((P.orbit - P.enter) / N) - .25), 0, N - 1);
  const step = (dir) => { if (p < P.enter - .02) { goP(stopP(0)); return; } const k = curStop() + dir; if (k < 0) goP(0); else if (k >= N) goP(P.rise + .02); else goP(stopP(k)); };
  root.querySelector(".tmx-prev").addEventListener("click", () => step(-1));
  root.querySelector(".tmx-replay").addEventListener("click", () => goP(0));
  root.querySelector(".tmx-next").addEventListener("click", () => step(1));
  addEventListener("keydown", (e) => { if (!visible || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (e.key === "ArrowRight") { step(1); e.preventDefault(); } if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); } });
  stick.addEventListener("pointerdown", (e) => { if (e.target.closest("a, button")) return; drag = { x: e.clientX, y: e.clientY, on: false }; });
  addEventListener("pointermove", (e) => {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.3) drag.on = true;
    if (drag.on) { yawT = clamp(-dx / W * 1.1, -.75, .75); kick(); }
  });
  const endDrag = () => { if (!drag) return; const on = drag.on; drag = null; if (on && Math.abs(yawT) > .28) step(yawT > 0 ? 1 : -1); yawT = 0; kick(); };
  addEventListener("pointerup", endDrag); addEventListener("pointercancel", endDrag);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(root);
  addEventListener("scroll", kick, { passive: true });
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  // ---------- «Камера жұмысқа кіреді»: work.jpg-дағы ноутбук → тірі AO17 беті (iframe, тек жақындағанда жүктеледі) ----------
  const workK = D.stops.findIndex((s) => s.kind === "photo" && /work\./.test(s.img));
  const LAP = D.laptop;   // [u0, v0, u1, v1] - фотодағы ноутбук экранының шамамен орны
  const wk = root.querySelector(".tmx-work"), wkFrame = wk && wk.querySelector("iframe");
  const lapPt = (u, v) => { const f = frames[workK]; return f.g.localToWorld(new THREE.Vector3((u - .5) * f.w, (.5 - v) * f.h, .02)); };

  // ---------- HTML ----------
  const cap = root.querySelector(".tmx-cap"), ck = cap.querySelector(".tmx-k"), cn = cap.querySelector(".tmx-n"), cr = cap.querySelector(".tmx-r"), ct = cap.querySelector(".tmx-t"),
    cgo = cap.querySelector(".tmx-go"), cfilm = cap.querySelector(".tmx-film"), bar = root.querySelector(".tmx-bar i"), orbLinks = [...root.querySelectorAll(".lf-orb .orb-n, .tmx-orb .orb-n")];
  let capK = -2;
  orbLinks.forEach((a) => a.addEventListener("click", (e) => { const k = D.stops.findIndex((s) => s.slug === a.dataset.slug); if (k >= 0) { e.preventDefault(); goP(stopP(k)); } }));

  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), lookV = new THREE.Vector3();
  const clock = new THREE.Clock();
  function frame() {
    raf = 0;
    const dt = Math.min(.05, clock.getDelta());
    const target = prog();
    pc = pc < 0 ? target : pc + (target - pc) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - pc) < 1e-4) pc = target;
    yawOff += (yawT - yawOff) * (1 - Math.exp(-dt * 10));
    p = pc;
    // топса: ашылу және соңында жабылу
    const hinge = eio(seg(p, P.open, P.hinge)) * (1 - eio(seg(p, P.rise + .02, P.close)));
    door.rotation.y = hinge * 70 * Math.PI / 180;
    edgeMat.opacity = .6 * Math.sin(Math.PI * clamp(hinge * 1.6));
    const doorA = 1 - seg(p, P.enter - .02, P.enter + .03) * (1 - seg(p, P.rise - .01, P.rise + .03));
    gMat.opacity = doorA; back.material.opacity = doorA; door.visible = doorA > .01;
    // камера
    const orbitT = clamp((p - P.enter) / (P.orbit - P.enter)) * N;   // 0..N
    let yaw;
    { const k = Math.min(N - 1, Math.floor(orbitT)), s = orbitT - k; yaw = ang(k) + (k < N - 1 ? eio(seg(s, .5, 1)) * (ang(k + 1) - ang(k)) : 0); }
    yaw += yawOff;
    const orbitPos = v1.copy(C).addScaledVector(dirOf(yaw), RF - dOrbit), orbitLook = v2.copy(C).addScaledVector(dirOf(yaw), RF); orbitLook.y -= lookDrop;
    if (p < P.enter) {
      const k = eio(seg(p, P.open + .01, P.enter));
      // старт → есіктің оң жағынан өту → киіз үйдің ортасы
      const a = start0, b = new THREE.Vector3(PW * .62, a.y * .4, 3.2), c = new THREE.Vector3(1.6, 0, -6.5), d = orbitPos;
      const curve = new THREE.CatmullRomCurve3([a, b, c, d.clone()], false, "centripetal");
      curve.getPoint(k, cam.position);
      lookV.lerpVectors(look0, orbitLook, eio(seg(p, P.open + .03, P.enter)));
      cam.position.x += yawOff * 2;
    } else if (p < P.orbit) {
      cam.position.copy(orbitPos); lookV.copy(orbitLook);
      if (workK >= 0 && Math.floor(orbitT) === workK) {   // ноутбукқа жақындау (қайту - кері)
        const s = orbitT - workK, k = eio(seg(s, .06, .3)) * (1 - eio(seg(s, .4, .54)));
        const c = lapPt((LAP[0] + LAP[2]) / 2, (LAP[1] + LAP[3]) / 2), lw = (LAP[2] - LAP[0]) * frames[workK].w;
        const dist = lw / (.92 * 2 * Math.tan(cam.fov * Math.PI / 360) * Math.min(cam.aspect, 1.6));
        const dir = v1.clone().sub(c).normalize(), near = c.clone().addScaledVector(dir.lengthSq() ? dir : new THREE.Vector3(0, 0, 1), Math.max(.6, dist));
        cam.position.lerp(near, k); lookV.lerp(c, k);
      }
    } else {
      const top = new THREE.Vector3(C.x, ringY + 16, C.z + RF + 15), topLook = new THREE.Vector3(C.x, 0, C.z);
      if (p < P.rise) { const k = eio(seg(p, P.orbit, P.rise)); cam.position.lerpVectors(orbitPos, top, k); lookV.lerpVectors(orbitLook, topLook, k); }
      else {
        const k = eio(seg(p, P.rise, 1));
        const curve = new THREE.CatmullRomCurve3([top, new THREE.Vector3(PW * .5, 5, 8), new THREE.Vector3(start0.x * .5, start0.y, start0.z * .85), start0.clone()], false, "centripetal");
        curve.getPoint(k, cam.position); lookV.lerpVectors(topLook, look0, k);
      }
    }
    cam.lookAt(lookV);
    // рамкалар мен шаңырақ
    const worldA = seg(p, P.hinge - .03, P.enter) * (1 - seg(p, .985, 1));
    const ki = p >= P.enter && p < P.orbit ? Math.min(N - 1, Math.round(orbitT - .25)) : -1;
    frames.forEach((f, k) => { const on = k === ki ? 1 : .55; f.mat.opacity = worldA; f.mat.color.setScalar(lerp(1, on, seg(p, P.enter, P.enter + .02))); f.mount.material.opacity = worldA; f.lm.opacity = .3 * worldA; f.g.visible = worldA > .01; });
    gold.opacity = worldA; uykMat.opacity = .5 * worldA; floor.material.opacity = .9 * worldA; shan.visible = floor.visible = worldA > .01;
    bars.rotation.y = yaw * .35;
    nodes.forEach((n) => { const on = n.k === ki; n.s.material.opacity = worldA; n.s.material.emissiveIntensity += ((on ? 2.2 : .1) - n.s.material.emissiveIntensity) * .2; n.s.scale.setScalar(on ? 1.6 : 1); });
    // DOM: бастапқы және соңғы кадр - түпнұсқа DOM фото мен мәтін (дәл сол орында)
    const still = 1 - seg(p, 0, P.open) * (1 - seg(p, .992, 1));
    root.style.setProperty("--still", still.toFixed(3));
    root.classList.toggle("is-still", still > .5);
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    const showK = ki >= 0 && (orbitT - Math.floor(orbitT)) < .55 ? ki : -1;
    if (showK !== capK) {
      capK = showK; cap.classList.toggle("is-on", showK >= 0);
      if (showK >= 0) { const st = D.stops[showK]; ck.textContent = st.k; cn.textContent = st.n; cr.textContent = st.r; ct.textContent = st.t;
        cgo.hidden = !st.href; cfilm.hidden = !st.film; if (st.href) cgo.href = st.href; if (st.film) cfilm.href = st.film; }
      orbLinks.forEach((a) => a.classList.toggle("is-on", showK >= 0 && D.stops[showK].slug === a.dataset.slug));
    }
    root.dataset.k = String(ki);
    // ноутбук экраны → тірі бет: экрандағы проекциясына дәл орналасады
    if (wk) {
      const s = workK >= 0 ? orbitT - workK : -1, on = p > P.enter && p < P.orbit && s >= 0 && s < 1 ? seg(s, .24, .32) * (1 - seg(s, .42, .5)) : 0;
      if (on > 0 && wkFrame && !wkFrame.getAttribute("src")) { try { sessionStorage.setItem("ao17:intro", "1"); } catch (e) { /* */ } wkFrame.setAttribute("src", wkFrame.dataset.src); }   // ішкі беттің кіріспе фильмі ойнамасын
      wk.style.opacity = on.toFixed(3); wk.classList.toggle("is-on", on > .5);
      if (on > 0) {
        cam.updateMatrixWorld();
        const pts = [lapPt(LAP[0], LAP[1]), lapPt(LAP[2], LAP[3])].map((v) => v.project(cam));
        const x0 = (Math.min(pts[0].x, pts[1].x) + 1) / 2 * W, x1 = (Math.max(pts[0].x, pts[1].x) + 1) / 2 * W, y0 = (1 - Math.max(pts[0].y, pts[1].y)) / 2 * H, y1 = (1 - Math.min(pts[0].y, pts[1].y)) / 2 * H;
        wk.style.setProperty("--ws", ((x1 - x0) / 1280).toFixed(4)); wk.style.left = x0 + "px"; wk.style.top = y0 + "px"; wk.style.width = (x1 - x0) + "px"; wk.style.height = (y1 - y0) + "px";
      }
    }
    { const a = seg(p, .02, .08) * (1 - seg(p, P.enter - .03, P.enter + .01)) + seg(p, P.rise, P.rise + .03) * (1 - seg(p, .97, .99)); altMat.opacity = a; altLine.opacity = .3 * a; altG.visible = a > .01; }
    renderer.render(scene, cam);
    if (pc !== target || Math.abs(yawOff - yawT) > 1e-3) kick();
  }
  kick();
}
