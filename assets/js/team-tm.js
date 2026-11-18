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

  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,226,170,.55)"); g.addColorStop(.45, "rgba(214,170,104,.16)"); g.addColorStop(1, "rgba(214,170,104,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const floorTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d"), g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, "#2a2118"); g.addColorStop(.55, "#15110d"); g.addColorStop(1, "#0b0a09"); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = "rgba(191,162,118,.10)"; x.lineWidth = 1.2; for (let k = 1; k <= 6; k++) { x.beginPath(); x.arc(256, 256, k * 38, 0, Math.PI * 2); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

  const shadowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); x.filter = "blur(14px)"; x.fillStyle = "#000"; x.fillRect(26, 26, 76, 76); return new THREE.CanvasTexture(c); })();

  const cvTex = (w, h, draw, srgb) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  // күн дағы: шаңырақтың өзі - шеңбер мен айқас күлдіреуіштер - еденге көлеңке болып түседі
  const sunTex = cvTex(512, 512, (x) => {
    const g = x.createRadialGradient(256, 256, 0, 256, 256, 240); g.addColorStop(0, "rgba(255,236,196,1)"); g.addColorStop(.72, "rgba(255,214,150,.75)"); g.addColorStop(.9, "rgba(240,190,120,.25)"); g.addColorStop(1, "rgba(240,190,120,0)");
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.globalCompositeOperation = "destination-out"; x.filter = "blur(3px)"; x.fillStyle = "#000"; x.strokeStyle = "#000";
    [-.32, .32].forEach((d) => { x.fillRect(256 + d * 236 - 7, 40, 14, 432); x.fillRect(40, 256 + d * 236 - 7, 432, 14); });
    x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 214, 0, Math.PI * 2); x.stroke();
  });
  const shaftTex = cvTex(4, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.6, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,.05)"); x.fillStyle = g; x.fillRect(0, 0, 4, 256); });
  // мұражай шынысының жалтыры: диагональ жолақ, камера бұрылғанда рамканың бетімен сырғиды
  const glareImg = cvTex(512, 256, (x) => { const g = x.createLinearGradient(140, 0, 372, 256); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.42, "rgba(255,255,255,0)"); g.addColorStop(.5, "rgba(255,248,232,.9)"); g.addColorStop(.56, "rgba(255,255,255,.15)"); g.addColorStop(.62, "rgba(255,248,232,.5)"); g.addColorStop(.7, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 512, 256); });
  // қошқар мүйіз: түбірден екі жаққа бұралған ою (рамканың төрт бұрышында)
  const hornTex = cvTex(256, 256, (x) => {
    x.strokeStyle = "#fff"; x.lineWidth = 9; x.lineCap = "round";
    const spiral = (sx) => { x.beginPath(); for (let i = 0; i <= 90; i++) { const t = i / 90 * Math.PI * 2.6, rr = 62 * (1 - t / (Math.PI * 3.1)); const px = 128 + sx * (52 - rr * Math.cos(t)), py = 112 - rr * Math.sin(t); i ? x.lineTo(px, py) : x.moveTo(128, 214); if (!i) x.lineTo(px, py); } x.stroke(); };
    spiral(1); spiral(-1);
    x.beginPath(); x.moveTo(128, 214); x.lineTo(128, 150); x.stroke();
    x.beginPath(); x.moveTo(104, 236); x.quadraticCurveTo(128, 210, 152, 236); x.stroke();
  });

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
    const mats = [];   // [материал, негізгі мөлдірлік]
    const add = (m, base = 1) => { m.transparent = true; mats.push([m, base]); return m; };
    const PM = st.kind === "member" ? .34 : .26, FW = .3, FD = .22;   // паспарту, жиектеме ені мен қалыңдығы
    const mount = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * PM, h + 2 * PM), add(new THREE.MeshStandardMaterial({ color: 0xf4eee2, roughness: .9, metalness: 0 }))); mount.position.z = -.02; g.add(mount);
    const lacq = add(new THREE.MeshStandardMaterial({ color: 0x17120c, roughness: .38, metalness: .35 })), fil = add(new THREE.MeshStandardMaterial({ color: GOLD, roughness: .3, metalness: .85, emissive: new THREE.Color("#4a3418"), emissiveIntensity: .45 }));
    const ow = w + 2 * PM, oh = h + 2 * PM;
    const bar = (bw, bh, x, y, m, d, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), m); b.position.set(x, y, z); g.add(b); };
    bar(ow + 2 * FW, FW, 0, oh / 2 + FW / 2, lacq, FD, FD / 2 - .02); bar(ow + 2 * FW, FW, 0, -oh / 2 - FW / 2, lacq, FD, FD / 2 - .02);
    bar(FW, oh, -ow / 2 - FW / 2, 0, lacq, FD, FD / 2 - .02); bar(FW, oh, ow / 2 + FW / 2, 0, lacq, FD, FD / 2 - .02);
    const fw = .045; bar(ow + fw * 2, fw, 0, oh / 2 + fw / 2, fil, FD + .03, FD / 2); bar(ow + fw * 2, fw, 0, -oh / 2 - fw / 2, fil, FD + .03, FD / 2);
    bar(fw, oh, -ow / 2 - fw / 2, 0, fil, FD + .03, FD / 2); bar(fw, oh, ow / 2 + fw / 2, 0, fil, FD + .03, FD / 2);
    const lm = add(new THREE.LineBasicMaterial({ color: GOLD }), .55); { const l = rectLine(w + .04, h + .04, lm); l.position.z = .005; g.add(l); }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry((ow + 2 * FW) * 1.16, (oh + 2 * FW) * 1.16), add(new THREE.MeshBasicMaterial({ map: shadowTex, depthWrite: false }), .55)); sh.position.set(.14, -.2, -.12); g.add(sh);
    const gt = glareImg.clone(); gt.needsUpdate = true; gt.wrapS = THREE.ClampToEdgeWrapping; gt.repeat.set(.5, 1);
    const glare = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending })); glare.position.z = .03; g.add(glare);
    const hm = add(new THREE.MeshBasicMaterial({ map: hornTex, color: GOLD, depthWrite: false }), .9), hs = Math.min(.62, PM * 1.7);
    [[-1, 1, -1], [1, 1, 1], [1, -1, 3], [-1, -1, -3]].forEach(([sx, sy, q]) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(hs, hs), hm); o.position.set(sx * (ow / 2 - hs * .36), sy * (oh / 2 - hs * .36), .012); o.rotation.z = -q * Math.PI / 4; g.add(o); });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.3, h * 1.9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }));
    halo.position.set(0, h * .16, -.08); g.add(halo);
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sTex[k], transparent: true, depthWrite: false, opacity: 0 }));
    refl.scale.y = -1; refl.position.set(0, -HP - 1.8, .02); refl.renderOrder = -1; g.add(refl);
    return { g, mat, mats, w: ow + 2 * FW, h: oh + 2 * FW, pw: w, ph: h, st, halo, refl, glare, gt };
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
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RF + 4, 64), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, opacity: .82 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(C.x, -HP / 2 - .9, C.z); scene.add(floor);
  key.position.set(C.x, ringY + 2, C.z);
  const FY = -HP / 2 - .9;
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffe0a8, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }));
  sun.rotation.x = -Math.PI / 2; sun.renderOrder = 2; scene.add(sun);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(RR * .88, 2.5, 1, 48, 1, true), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffe2b0, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  shaft.renderOrder = 3; scene.add(shaft);
  const UP = new THREE.Vector3(0, 1, 0), sTop = new THREE.Vector3(C.x, ringY, C.z), sBot = new THREE.Vector3(), sDir = new THREE.Vector3();
  const DN = mobile() ? 140 : 260, dpos = new Float32Array(DN * 3), dseed = new Float32Array(DN);
  for (let i = 0; i < DN; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (RF - 1); dpos[i * 3] = C.x + Math.sin(a) * rr; dpos[i * 3 + 1] = -HP / 2 + Math.random() * (HP + 3); dpos[i * 3 + 2] = C.z - Math.cos(a) * rr; dseed[i] = Math.random() * 100; }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: glowTex, size: .16, color: 0xffe2b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(dust); const dbase = dpos.slice();

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
    const mh = Math.max(...frames.map((f) => f.h)); dOrbit = Math.max(mh / (.8 * 2 * tn), mw / (.86 * 2 * tn * asp));
    lookDrop = asp < .8 ? .14 * 2 * dOrbit * tn : .09 * 2 * dOrbit * tn;
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
  const lapPt = (u, v) => { const f = frames[workK]; return f.g.localToWorld(new THREE.Vector3((u - .5) * f.pw, (.5 - v) * f.ph, .02)); };

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
        const c = lapPt((LAP[0] + LAP[2]) / 2, (LAP[1] + LAP[3]) / 2), lw = (LAP[2] - LAP[0]) * frames[workK].pw;
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
    frames.forEach((f, k) => { const on = k === ki ? 1 : .55; f.halo.material.opacity += ((worldA * (k === ki ? .95 : .28)) - f.halo.material.opacity) * .12; f.refl.material.opacity = worldA * .14; f.mat.opacity = worldA; f.mat.color.setScalar(lerp(1, on, seg(p, P.enter, P.enter + .02))); f.mats.forEach(([m, b]) => { m.opacity = b * worldA; }); { let d = yaw - ang(k); d = Math.atan2(Math.sin(d), Math.cos(d)); f.gt.offset.x = clamp(.25 - d * .9, -.6, 1.1); f.glare.material.opacity = worldA * (Math.abs(d) < 1.2 ? .16 : 0); } f.g.visible = worldA > .01; });
    { const t = clock.elapsedTime; dust.visible = worldA > .01; dust.material.opacity = .55 * worldA;
      if (dust.visible) { for (let i = 0; i < DN; i++) { const sd = dseed[i]; dpos[i * 3] = dbase[i * 3] + Math.sin(t * .13 + sd) * .35; dpos[i * 3 + 1] = dbase[i * 3 + 1] + ((t * .05 + sd) % 3) - 1.5; dpos[i * 3 + 2] = dbase[i * 3 + 2] + Math.cos(t * .11 + sd) * .35; } dgeo.attributes.position.needsUpdate = true; } }
    gold.opacity = worldA; uykMat.opacity = .5 * worldA; floor.material.opacity = .82 * worldA; shan.visible = floor.visible = worldA > .01;
    bars.rotation.y = yaw * .35 + clock.elapsedTime * .02;
    // күн сағаты: шаңырақтан түскен сәуле уақытпен (скролл) бірге жүріп, қаралып тұрған адамның алдына түседі
    { const sy = yaw + .18 * Math.sin(p * Math.PI * 2), rad = lerp(2.2, RF - 2.8, seg(p, P.hinge, P.enter + .04));
      sBot.copy(C).addScaledVector(dirOf(sy), rad); sBot.y = FY;
      sun.position.set(sBot.x, FY + .03, sBot.z); sun.rotation.z = -sy; sun.scale.set(1, 1 + rad / RF * .55, 1);
      sun.material.opacity = .62 * worldA; sun.visible = worldA > .01;
      sDir.subVectors(sTop, sBot); const L = sDir.length(); shaft.position.addVectors(sTop, sBot).multiplyScalar(.5); shaft.quaternion.setFromUnitVectors(UP, sDir.normalize()); shaft.scale.set(1, L, 1);
      shaft.material.opacity = .065 * worldA; shaft.visible = sun.visible; }
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
    if (pc !== target || Math.abs(yawOff - yawT) > 1e-3 || (worldA > .01 && document.visibilityState === "visible")) kick();   // шаң тірі тұрсын
  }
  kick();
}
