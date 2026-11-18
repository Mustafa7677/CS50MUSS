/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   Басты беттің 1-сахнасы «Алаш 1917»: SVG-дегі шаңырақ пен шаң 3D-ге (WebGL, three.js r160, MIT) ауысады.
   Шаңырақ SVG-дегі орнында тұрады: уықтар бірінен соң бірі өседі, алты асыл тас - алты академия кезекпен жанады,
   жарық сәулесінде алтын шаң қалқиды. Тінтуір шаңырақты сәл бұрады, скролл оны айналдырып көтереді.
   Тек қозғалыс рұқсат етілсе (html.st-js), жеңіл режим (.lite) болмаса және WebGL бар болса; әйтпесе SVG қалады.
   Сахна экраннан шыққанда не бет жасырылғанда кадр салынбайды. Барлық пішін кодпен құрылады. */
const root = document.documentElement;
const s1 = document.querySelector(".is-home .st-s1");
const svg = s1 && s1.querySelector(".st-art17");
const testOn = (() => { try { return sessionStorage.getItem("ao17:test-gl") === "1"; } catch (e) { return false; } })();
const ok = () => {
  if (!s1 || !svg || !root.classList.contains("st-js") || root.classList.contains("lite") || root.classList.contains("reduce-motion")) return false;
  if (navigator.webdriver && !testOn) return false;   // автотесттерде (әдепкіде) SVG нұсқасы
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
};
if (ok()) {
  const go = () => import("../vendor/three/three.module.min.js").then(start).catch((e) => console.warn(e));
  if (document.readyState === "complete") setTimeout(go, 60); else addEventListener("load", () => setTimeout(go, 60), { once: true });
}

function start(THREE) {
  const mobile = innerWidth < 760;
  const seen = root.classList.contains("st-seen");
  let t0 = performance.now() + (seen ? 150 : 4300);   // «АЛАШ 1917» кіріспесі біткенде; әрекет жасалса - бірден
  const sk = () => { t0 = Math.min(t0, performance.now()); }; ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => addEventListener(ev, sk, { once: true, passive: true }));
  const cv = document.createElement("canvas"); cv.className = "st-gl"; cv.setAttribute("aria-hidden", "true");
  svg.after(cv);
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 100); cam.position.z = 20;
  scene.add(new THREE.AmbientLight(0xffe7c0, .7));
  const L1 = new THREE.PointLight(0xffd593, 90, 30, 1.5); L1.position.set(0, -6, 8); scene.add(L1);
  const L2 = new THREE.PointLight(0xb0384a, 30, 30, 1.6); L2.position.set(-6, 4, 4); scene.add(L2);
  const GOLD = new THREE.Color("#d9b468"), BURG = new THREE.Color("#b0384a");

  // ---------- шаңырақ: радиусы 1 (SVG-дегі сақинаға сәйкестендіріледі) ----------
  const shan = new THREE.Group(), spin = new THREE.Group(); shan.add(spin); scene.add(shan);
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: .75, roughness: .3, emissive: new THREE.Color("#4a3110"), emissiveIntensity: .55, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .035, 16, 128), gold), ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.07, .012, 8, 128), gold);
  spin.add(ring, ring2);
  const bars = [];
  [-.415, -.158, .158, .415].forEach((d) => { const h = 2 * Math.sqrt(1 - d * d); [0, 1].forEach((v) => { const b = new THREE.Mesh(new THREE.BoxGeometry(v ? .026 : h, v ? h : .026, .026), gold); if (v) b.position.x = d; else b.position.y = d; spin.add(b); bars.push(b); }); });
  // уықтар: сақинадан сыртқа және көрерменге қарай (күмбездің ішінен төбеге қарап тұрғандай)
  const NU = 36, uykGeo = new THREE.CylinderGeometry(.009, .016, 1, 6); uykGeo.translate(0, .5, 0);
  const uyks = new THREE.InstancedMesh(uykGeo, gold, NU), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  const uykDir = []; for (let i = 0; i < NU; i++) { const a = i / NU * Math.PI * 2; uykDir.push(new THREE.Vector3(Math.cos(a), Math.sin(a), .55).normalize()); }
  spin.add(uyks);
  const UP = new THREE.Vector3(0, 1, 0);
  const setUyks = (grow, spread) => { for (let i = 0; i < NU; i++) { const k = Math.max(0, Math.min(1, grow * 1.6 - i / NU * .6)), a = i / NU * Math.PI * 2; pos.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0); q.setFromUnitVectors(UP, uykDir[i]); sc.set(1, (1.25 + spread * .5) * (1 - Math.pow(1 - k, 3)) + 1e-4, 1); m4.compose(pos, q, sc); uyks.setMatrixAt(i, m4); } uyks.instanceMatrix.needsUpdate = true; };
  // алты асыл тас - алты академия
  const gems = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i / 6 * Math.PI * 2, g = new THREE.Mesh(new THREE.OctahedronGeometry(.055, 0), new THREE.MeshStandardMaterial({ color: i % 2 ? GOLD : BURG, emissive: i % 2 ? GOLD : BURG, emissiveIntensity: .4, metalness: .4, roughness: .3, transparent: true, opacity: 0 })); g.position.set(Math.cos(a), Math.sin(a), .03); spin.add(g); gems.push(g); }
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,250,230,1)"); gr.addColorStop(.3, "rgba(255,226,170,.7)"); gr.addColorStop(1, "rgba(255,210,140,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffe4a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(2.6); glow.position.z = -.2; shan.add(glow);
  const gemGlow = gems.map((g) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffd28a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(.45); s.position.copy(g.position); spin.add(s); return s; });

  // ---------- шаң: жарық сәулесінің ішінде (экран координатасымен) ----------
  const ND = mobile ? 220 : 620, dp = new Float32Array(ND * 3), seed = new Float32Array(ND * 4);
  for (let i = 0; i < ND; i++) { seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random() * Math.PI * 2; seed[i * 4 + 3] = .4 + Math.random() * .9; }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dMat = new THREE.PointsMaterial({ map: dot, size: mobile ? .09 : .07, color: 0xf6e2b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const dust = new THREE.Points(dGeo, dMat); scene.add(dust);

  // ---------- SVG координатасы → 3D әлем ----------
  let W = 1, H = 1, upp = 1, beam = null, narrow = false;
  const toWorld = (x, y) => [(x - W / 2) * upp, -(y - H / 2) * upp];
  function layout() {
    const r = s1.getBoundingClientRect(); W = r.width; H = r.height;
    renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
    upp = 2 * cam.position.z * Math.tan(cam.fov * Math.PI / 360) / H;
    narrow = matchMedia("(max-width: 760px)").matches;
    // орны SVG-дегі сақинаның (r = 105) нақты өлшемінен алынады (viewBox → экран), CSS ығысуын (--px, --sy) алып тастап
    const e = svg.querySelector(".s17-ring").getBoundingClientRect(), st = getComputedStyle(s1);
    const cpx = parseFloat(st.getPropertyValue("--px")) || 0, csy = parseFloat(st.getPropertyValue("--sy")) || 0;
    const k = e.width / 213.2, cx = e.left + e.width / 2 - r.left + cpx * 10, cy = e.top + e.height / 2 - r.top - csy * 70;
    const [wx, wy] = toWorld(cx, cy);
    shan.position.set(wx, wy, 0); shan.userData.base = [wx, wy]; shan.scale.setScalar(108 * k * upp);
    const P = (dx, dy) => toWorld(cx + dx * k, cy + dy * k);
    beam = { top: P(-60, 0).concat(P(60, 0)), bot: P(-330, 610).concat(P(250, 610)) };
  }
  layout(); addEventListener("resize", layout);

  // ---------- басқару ----------
  let px = 0, py = 0, tx = 0, ty = 0, vis = true, on = true, raf = 0;
  if (matchMedia("(pointer: fine)").matches) s1.addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; });
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; kick(); }).observe(s1);
  document.addEventListener("visibilitychange", () => { on = !document.hidden; kick(); });
  function kick() { if (vis && on && !raf) raf = requestAnimationFrame(frame); }
  s1.classList.add("st-3d");
  const clock = new THREE.Clock();
  const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

  function frame() {
    raf = 0; if (!vis || !on) return;
    const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime, now = performance.now();
    const life = Math.max(0, (now - t0) / 1000);
    const sy = Math.min(1, Math.max(0, -s1.getBoundingClientRect().top / H));
    px += (tx - px) * (1 - Math.exp(-dt * 3)); py += (ty - py) * (1 - Math.exp(-dt * 3));
    // ашылу: сақина → құлдырауыш → уықтар → асыл тастар
    const aR = ease(life / 1.1), aB = ease((life - .4) / 1), aU = ease((life - .7) / 1.8), aG = ease((life - 1.8) / 1);
    const dim = narrow ? .7 : 1;   // телефонда шаңырақ мәтіннің артында тұрады - күңгірттеу
    gold.opacity = aR * dim; ring.scale.setScalar(.6 + .4 * aR);
    bars.forEach((b, i) => { b.scale.setScalar(Math.max(1e-4, ease((life - .4 - i * .06) / .8))); });
    setUyks(aU, sy);
    glow.material.opacity = dim * aR * (.32 + Math.sin(t * .9) * .06) * (1 - sy * .6);
    const hot = Math.floor(t / 1.4) % 6;
    gems.forEach((g, i) => { const f = i === hot ? 1 : .25; g.material.opacity = aG * dim; g.material.emissiveIntensity += ((.35 + f * 1.4) - g.material.emissiveIntensity) * .08; g.rotation.y = t * 1.3 + i; gemGlow[i].material.opacity += ((aG * f * .9 * dim) - gemGlow[i].material.opacity) * .08; });
    // қозғалыс: баяу айналу, тінтуірмен еңкею, скроллмен көтерілу
    spin.rotation.z = t * .05 + sy * 1.4;
    shan.rotation.set(-.32 + py * .12 - sy * .5, px * .22, 0);
    const [bx, by] = shan.userData.base; shan.position.set(bx - px * .08, by + sy * 3.2, sy * 2.5);
    // шаң
    dMat.opacity = ease((life + 1) / 2) * .85 * (1 - sy);
    if (beam) {
      const [ax, ay, bx2] = beam.top, [dx, dy, cx2] = beam.bot;
      for (let i = 0; i < ND; i++) {
        const j = i * 4, k = i * 3; let v = (seed[j + 1] + t * .018 * seed[j + 3] * (1 + sy * 3)) % 1;   // төменнен жоғары
        const y = dy + (ay - dy) * v, half = (1 - v), l = ax + (dx - ax) * half, r = bx2 + (cx2 - bx2) * half;
        dp[k] = l + (r - l) * seed[j] + Math.sin(t * .5 + seed[j + 2]) * .12 * seed[j + 3] - px * .15 * seed[j + 3];
        dp[k + 1] = y + Math.cos(t * .4 + seed[j + 2]) * .08;
        dp[k + 2] = (seed[j + 2] - Math.PI) * .25;
      }
      dGeo.attributes.position.needsUpdate = true;
    }
    L1.intensity = 70 + Math.sin(t * .7) * 12;
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  kick();
}
