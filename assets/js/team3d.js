/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Ертеңнің сәулетшілері» - команда бетінің 3D режиссер нұсқасы (team/3d.html). WebGL: three.js r160 (MIT, assets/vendor/three).
   Жеті көрініс бір уақыт сызығында (t = 0..1, скроллмен не «Режиссер нұсқасы» батырмасымен):
     01 Мүмкін емес құрылыс - AO17 бөлшектерге ыдырайды, бес жарық қалады;   02 Бесеуі - жарықтар шаңырақ құрайды, камера ортасынан өтеді;
     03 Жасаушылар әлемі - бес портал-әлем, тінтуірмен бұруға, басып кіруге болады;   04 Тоғысу - бес әлемнің бөлшектері бір нүктеге ағады;
     05 Құрастыру - шаңырақ жарыққа толады;   06 Кодтың артында - шынайы фото;   07 Келесі тарау - соңғы сөз.
   Дыбыс жоқ. Қозғалыс азайтылса не WebGL жоқ болса - статикалық нұсқа (.t3-fb). Барлық геометрия кодпен құрылады (модель файлдары жоқ). */
import * as THREE from "../vendor/three/three.module.min.js";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = $(".t3"), raw = $("#t3-data");
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const reduced = () => document.documentElement.classList.contains("reduce-motion") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

if (root && raw) {
  const D = JSON.parse(raw.textContent);
  if (reduced() || !webgl()) { root.classList.add("t3-static"); }
  else start(D).catch((e) => { console.warn(e); root.classList.add("t3-static"); });
}

async function start(D) {
  root.classList.add("t3-live");
  const M = D.members, N = M.length, mobile = innerWidth < 760;
  const GOLD = new THREE.Color("#d9b468"), BURG = new THREE.Color("#b0384a"), CREAM = new THREE.Color("#efe6d3");
  const cv = $(".t3-cv"), stage = $(".t3-stage"), scroller = $(".t3-scroll");
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mobile, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x0a0705, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0705, 10, 46);
  const cam = new THREE.PerspectiveCamera(55, 1, .1, 200);
  scene.add(new THREE.AmbientLight(0xfff1d6, .55));
  const key = new THREE.PointLight(0xffd79a, 60, 40, 1.6); key.position.set(0, 6, 8); scene.add(key);

  try { await Promise.all([document.fonts.load("800 160px Unbounded"), document.fonts.load("700 48px Unbounded"), document.fonts.load("italic 400 48px 'PT Serif'")]); } catch (e) { /* қаріп жоқ - әдепкі */ }

  // ---------- текстуралар ----------
  const dotTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(255,240,210,.8)"); gr.addColorStop(1, "rgba(255,220,160,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const label = (txt, font, color, w = 1024, h = 128) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.font = font; g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const archAlpha = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 320; const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(0, 320); g.lineTo(0, 128); g.arc(128, 128, 128, Math.PI, 0); g.lineTo(256, 320); g.closePath(); g.fill(); return new THREE.CanvasTexture(c); })();
  const loader = new THREE.TextureLoader();
  const loadTex = (src) => new Promise((res) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));

  // ---------- 01: AO17 бөлшектері ----------
  const pts = (() => {
    const W = 1100, H = 520, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "800 230px Unbounded, sans-serif"; g.fillText("AO17", W / 2, 205);
    g.font = "600 34px Unbounded, sans-serif"; g.fillText("БІР ШАҢЫРАҚ · БЕС АДАМ", W / 2, 360);
    g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(40, 30, W - 80, H - 60);
    [[140, 430], [380, 430], [620, 430], [860, 430]].forEach(([x, y]) => { g.fillRect(x, y, 120, 22); });
    const img = g.getImageData(0, 0, W, H).data, cand = [];
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (img[(y * W + x) * 4 + 3] > 128) cand.push([x, y]);
    const n = Math.min(cand.length, mobile ? 4200 : 9000), pos = new Float32Array(n * 3), base = new Float32Array(n * 3), dir = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const [x, y] = cand[Math.floor(Math.random() * cand.length)];
      base[i * 3] = (x / W - .5) * 14; base[i * 3 + 1] = -(y / H - .5) * 6.6; base[i * 3 + 2] = (Math.random() - .5) * .2;
      const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), r = 6 + Math.random() * 18;
      dir[i * 3] = Math.sin(b) * Math.cos(a) * r; dir[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r; dir[i * 3 + 2] = Math.cos(b) * r - 4;
      const k = Math.random(), cc = k < .12 ? BURG : k < .7 ? GOLD : CREAM; col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
    }
    pos.set(base);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: mobile ? .07 : .055, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Points(geo, mat); scene.add(p);
    return { p, geo, mat, pos, base, dir, n };
  })();

  // ---------- 02: бес жарық және шаңырақ ----------
  const HUB = new THREE.Vector3(0, 0, -16);
  const lights = M.map((m, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: i === 2 ? CREAM : GOLD, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(1.4); scene.add(s); return s; });
  const lightStart = M.map((_, i) => new THREE.Vector3((i - 2) * 2.8, Math.sin(i * 2.1) * 1.4, 1.5));
  const shan = new THREE.Group(); scene.add(shan);
  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: .85, roughness: .32, emissive: new THREE.Color("#5a3d12"), emissiveIntensity: .4, transparent: true });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3, .1, 20, 160), gold); shan.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.72, .035, 12, 160), gold); shan.add(ring2);
  const bar = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .08), gold); b.position.set(x, y, 0); shan.add(b); return b; };
  const bars = [bar(5.4, .07, 0, .85), bar(5.4, .07, 0, -.85), bar(.07, 5.4, .85, 0), bar(.07, 5.4, -.85, 0)];
  const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(.32, 0), new THREE.MeshStandardMaterial({ color: BURG, emissive: BURG, emissiveIntensity: .6, metalness: .3, roughness: .4, transparent: true })); shan.add(diamond);
  const uyks = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, u = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 3.4, 6), gold); u.position.set(Math.cos(a) * 4.7, Math.sin(a) * 4.7, -.9); u.rotation.z = a - Math.PI / 2; u.rotation.x = .35 * Math.sin(a); shan.add(u); uyks.push(u); }
  shan.position.set(0, 0, -2);
  const ringSlots = M.map((_, i) => { const a = Math.PI / 2 - i * Math.PI * 2 / N; return new THREE.Vector3(Math.cos(a) * 3, Math.sin(a) * 3, -2); });

  // ---------- 03: бес портал-әлем ----------
  const R = mobile ? 5.4 : 6.4;
  const portals = await Promise.all(M.map(async (m, i) => {
    const grp = new THREE.Group(), a = i * Math.PI * 2 / N;
    grp.position.set(HUB.x + Math.sin(a) * R, HUB.y, HUB.z - Math.cos(a) * R); grp.lookAt(HUB);
    const tex = await loadTex(m.photo);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), new THREE.MeshBasicMaterial({ map: tex, alphaMap: archAlpha, transparent: true, fog: false }));
    face.userData.i = i; grp.add(face);
    const sh = new THREE.Shape(); sh.moveTo(-1.26, -1.56); sh.lineTo(-1.26, .34); sh.absarc(0, .34, 1.26, Math.PI, 0, true); sh.lineTo(1.26, -1.56); sh.lineTo(-1.26, -1.56);
    const frame = new THREE.Line(new THREE.BufferGeometry().setFromPoints(sh.getPoints(64)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true })); frame.position.z = .02; grp.add(frame);
    const nm = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(m.name, "700 64px Unbounded, sans-serif", "#efe6d3"), transparent: true, depthWrite: false })); nm.scale.set(4.4, .55, 1); nm.position.set(0, -2.05, .1); grp.add(nm);
    const rl = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(m.role, "italic 400 52px 'PT Serif', serif", "#d9b468"), transparent: true, depthWrite: false })); rl.scale.set(4.4, .55, 1); rl.position.set(0, -2.55, .1); grp.add(rl);
    grp.add(world(m.sig, i));
    scene.add(grp);
    return { grp, face, frame, nm, rl, a };
  }));

  // әр адамның әлемі - өз «физикасы»: оюлар, қалқыған білім, желі, тартылыс, экрандар
  function world(sig, i) {
    const w = new THREE.Group(); w.position.z = -.6; w.userData.tick = () => {};
    const ptsMat = (c, s = .09) => new THREE.PointsMaterial({ size: s, map: dotTex, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    if (sig === "palette") {
      const cols = ["#8c2433", "#8a6634", "#d9b468", "#efe6d3"];
      cols.forEach((c, k) => { const n = 90, p = new Float32Array(n * 3); for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2, r = 1.9 + k * .38; p[j * 3] = Math.cos(a) * r; p[j * 3 + 1] = Math.sin(a) * r; p[j * 3 + 2] = -k * .15; } const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const o = new THREE.Points(g, ptsMat(c, .1)); w.add(o); });
      w.userData.tick = (t) => { w.children.forEach((o, k) => { o.rotation.z = t * (k % 2 ? -.12 : .1) * (1 + k * .3); }); };
    } else if (sig === "stats") {
      const words = ["2x + 5 = 17", "IELTS", "√2", "Reading", "SAT", "x²", "Grammar", "π r²", "Listening", "7 × 8", "Essay", "f(x)"];
      words.forEach((s, k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(s, k % 3 ? "600 54px Unbounded, sans-serif" : "italic 400 60px 'PT Serif', serif", k % 4 ? "#d9b468" : "#efe6d3", 640, 110), transparent: true, depthWrite: false })); const a = k / words.length * Math.PI * 2; sp.userData.a = a; sp.userData.r = 2.2 + (k % 3) * .45; sp.scale.set(1.9, .33, 1); w.add(sp); });
      w.userData.tick = (t) => { w.children.forEach((sp, k) => { const a = sp.userData.a + t * .12; sp.position.set(Math.cos(a) * sp.userData.r, Math.sin(a * 1.3) * 1.5 + Math.sin(t * .8 + k) * .15, Math.sin(a) * .9 - .4); }); };
    } else if (sig === "flow") {
      const nodes = []; for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 12), new THREE.MeshBasicMaterial({ color: k % 3 ? GOLD : BURG })); const a = k / 9 * Math.PI * 2; m.position.set(Math.cos(a) * (2 + (k % 2) * .6), Math.sin(a) * (1.9 + (k % 2) * .5), -.3 - (k % 3) * .2); w.add(m); nodes.push(m); }
      const lp = []; nodes.forEach((n, k) => { lp.push(n.position, nodes[(k + 1) % 9].position, n.position, nodes[(k + 4) % 9].position); });
      w.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: .35 })));
      const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: CREAM, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pulse.scale.setScalar(.6); w.add(pulse);
      w.userData.tick = (t) => { const k = Math.floor(t * 1.2) % 9, f = (t * 1.2) % 1; pulse.position.lerpVectors(nodes[k].position, nodes[(k + 1) % 9].position, f); nodes.forEach((n, j) => n.scale.setScalar(j === k ? 1.8 : 1)); };
    } else if (sig === "code") {
      const balls = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1 + Math.random() * .08, 14, 14), new THREE.MeshStandardMaterial({ color: k % 4 ? GOLD : BURG, metalness: .6, roughness: .3 })); m.userData.v = new THREE.Vector3((Math.random() - .5) * 2, Math.random() * 2, 0); m.position.set((Math.random() - .5) * 4, Math.random() * 3, -.3); w.add(m); balls.push(m); }
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 4.2, .1)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: .3 })); box.position.z = -.3; w.add(box);
      let last = 0; w.userData.tick = (t) => { const dt = Math.min(.05, t - last); last = t; balls.forEach((b) => { b.userData.v.y -= 4.5 * dt; b.position.addScaledVector(b.userData.v, dt); if (b.position.y < -2) { b.position.y = -2; b.userData.v.y *= -.86; } if (Math.abs(b.position.x) > 2.4) { b.position.x = Math.sign(b.position.x) * 2.4; b.userData.v.x *= -1; } if (b.userData.v.y < .2 && b.position.y <= -1.99 && Math.random() < .01) b.userData.v.y = 4 + Math.random() * 2; }); };
    } else {
      const sizes = [[1.6, 1], [1.1, .8], [.5, .9], [1.4, .9], [.45, .8]];
      sizes.forEach(([sw, shh], k) => { const s = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(sw, shh)), new THREE.LineBasicMaterial({ color: k % 2 ? GOLD : CREAM, transparent: true, opacity: .7 })); const a = k / 5 * Math.PI * 2; s.position.set(Math.cos(a) * 2.4, Math.sin(a) * 1.8, -.4); s.userData.base = [sw, shh]; w.add(s); });
      w.userData.tick = (t) => { w.children.forEach((s, k) => { const f = (Math.sin(t * .9 + k) + 1) / 2; s.scale.set(lerp(1, .32, f), lerp(1, 1.5, f), 1); s.position.y += Math.sin(t + k) * .002; }); };
    }
    return w;
  }

  // ---------- 04: тоғысу ағындары ----------
  const flow = (() => {
    const n = mobile ? 900 : 2000, pos = new Float32Array(n * 3), from = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const k = i % N, p = portals[k].grp.position; from[i * 3] = p.x + (Math.random() - .5) * 3; from[i * 3 + 1] = p.y + (Math.random() - .5) * 3.4; from[i * 3 + 2] = p.z + (Math.random() - .5) * 2; const c = k === 0 || k === 4 ? BURG : k === 2 ? CREAM : GOLD; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    pos.set(from);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: .09, map: dotTex, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Points(geo, mat); scene.add(p); return { p, geo, mat, pos, from, n };
  })();

  // ---------- уақыт сызығы, басқару ----------
  const CH = D.chapters;   // [{k, t, d, at}]
  const cap = { k: $(".t3-k"), t: $(".t3-t"), d: $(".t3-d") }, enter = $(".t3-enter"), dots = $$(".t3-ch"), bar0 = $(".t3-bar i");
  const people = $(".t3-people"), pbtn = $$(".t3-people button");
  let tT = 0, tC = 0, yawDrag = 0, focus = 0, chap = -1, who = -1;
  const range = () => { const r = scroller.getBoundingClientRect(); return clamp(-r.top / Math.max(1, scroller.offsetHeight - innerHeight)); };
  const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < .8 ? 70 : 55; cam.updateProjectionMatrix(); };
  addEventListener("resize", resize); resize();
  addEventListener("scroll", () => { tT = range(); }, { passive: true }); tT = range();
  const goT = (t, smooth = true) => { const top = scroller.getBoundingClientRect().top + scrollY + t * (scroller.offsetHeight - innerHeight); scrollTo({ top, behavior: smooth ? "smooth" : "auto" }); };
  dots.forEach((b, i) => b.addEventListener("click", () => { stopDir(); goT(CH[i].at); }));
  pbtn.forEach((b, i) => b.addEventListener("click", () => openWorld(i)));
  // тінтуірмен (саусақпен) әлемдерді бұру
  let drag = null;
  cv.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: 0, y0: yawDrag, moved: false }; });
  addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; yawDrag = drag.y0 - dx / innerWidth * Math.PI; });
  addEventListener("pointerup", (e) => { if (drag && !drag.moved) pick(e); drag = null; });
  const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
  function pick(e) { const r = cv.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mv, cam); const hit = ray.intersectObjects(portals.map((p) => p.face))[0]; if (hit && tC > .26 && tC < .66) openWorld(hit.object.userData.i); }
  // әлемге кіру: HTML терезе - адамның тірі қолтаңбасы және жеке беті
  const dlg = $(".t3-world");
  function openWorld(i) {
    const m = M[i]; stopDir();
    $(".t3w-img", dlg).src = m.photo; $(".t3w-img", dlg).alt = m.name + ", портрет";
    $(".t3w-k", dlg).textContent = `${String(i + 1).padStart(2, "0")} · ${m.kind_kk} · ${m.age} жас`;
    $(".t3w-n", dlg).textContent = m.name; $(".t3w-r", dlg).textContent = m.role; $(".t3w-t", dlg).textContent = m.tag; $(".t3w-a", dlg).textContent = m.areas;
    const dm = $(".t3w-demo", dlg); dm.innerHTML = m.demo; dm.querySelectorAll(".dm").forEach((x) => { x.classList.remove("is-act"); void x.offsetWidth; x.classList.add("is-act"); }); dm.classList.add("is-act");
    $(".t3w-go", dlg).href = m.slug + ".html";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  $(".t3w-x", dlg).addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  enter.addEventListener("click", () => openWorld(who < 0 ? 0 : who));
  // режиссер нұсқасы: бет өзі баяу ағады (~3 минут); кез келген әрекет тоқтатады
  const dirB = $(".t3-dir"); let dir = false, dirRaf = 0, lastTs = 0;
  const stopDir = () => { if (!dir) return; dir = false; cancelAnimationFrame(dirRaf); dirB.textContent = "▶ Режиссер нұсқасы"; dirB.setAttribute("aria-pressed", "false"); };
  const dirStep = (ts) => { if (!dir) return; const dt = lastTs ? ts - lastTs : 16; lastTs = ts; const span = scroller.offsetHeight - innerHeight, slow = tC > .3 && tC < .62 ? .55 : 1; scrollBy(0, span / 180000 * dt * slow); if (range() >= .999) { stopDir(); return; } dirRaf = requestAnimationFrame(dirStep); };
  dirB.addEventListener("click", () => { if (dir) { stopDir(); return; } dir = true; lastTs = 0; dirB.textContent = "❚❚ Тоқтату"; dirB.setAttribute("aria-pressed", "true"); if (range() >= .99) goT(0, false); dirRaf = requestAnimationFrame(dirStep); });
  ["wheel", "touchstart", "keydown"].forEach((ev) => addEventListener(ev, (e) => { if (ev === "keydown" && e.target === dirB) return; stopDir(); }, { passive: true }));

  // ---------- кадр ----------
  const v = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
  let visible = true; document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) loop(); });
  const clock = new THREE.Clock();
  function loop() {
    if (!visible) return;
    requestAnimationFrame(loop);
    const dtF = Math.min(.1, clock.getDelta()), time = clock.elapsedTime;
    tC += (tT - tC) * (1 - Math.exp(-dtF * 5)); if (Math.abs(tT - tC) < 1e-5) tC = tT;
    const t = tC;
    // 01: ыдырау
    const e1 = ease(seg(t, .02, .13));
    { const { pos, base, dir: d, n, mat, geo } = pts; for (let i = 0; i < n * 3; i += 3) { pos[i] = base[i] + d[i] * e1 + Math.sin(time * .6 + i) * .015; pos[i + 1] = base[i + 1] + d[i + 1] * e1; pos[i + 2] = base[i + 2] + d[i + 2] * e1; } geo.attributes.position.needsUpdate = true; mat.opacity = 1 - seg(t, .08, .16); pts.p.visible = mat.opacity > .01; pts.p.rotation.y = Math.sin(time * .15) * .05 * (1 - e1); }
    // жарықтар: 01 соңында пайда болады, 02-де шаңырақтың орындарына ұшады
    const lA = seg(t, .09, .14), lB = ease(seg(t, .15, .24)), lC = seg(t, .25, .3);
    lights.forEach((s, i) => { s.position.lerpVectors(lightStart[i], ringSlots[i], lB); s.position.x += Math.sin(time * 1.3 + i) * .08 * (1 - lB); s.material.opacity = lA * (1 - lC); s.scale.setScalar(1.2 + Math.sin(time * 3 + i) * .15 + lB * .8); });
    // шаңырақ: пайда болуы, айналуы, кейін тоғысуда HUB-қа көшуі
    const sA = ease(seg(t, .19, .27)), conv = ease(seg(t, .62, .74)), assem = ease(seg(t, .74, .86));
    gold.opacity = sA; diamond.material.opacity = sA; shan.visible = sA > .01;
    shan.scale.setScalar(lerp(.6, 1, sA) * lerp(1, 1.25, assem));
    shan.rotation.z = time * .05 + (1 - sA) * 1.2;
    bars.forEach((b, k) => { b.scale.set(k < 2 ? sA : 1, k < 2 ? 1 : sA, 1); });
    uyks.forEach((u, k) => { u.scale.y = clamp(sA * 1.4 - k * .03); });
    tmp.set(0, 0, -2); v.copy(HUB).add(new THREE.Vector3(0, 3.2, 0)); shan.position.lerpVectors(tmp, v, conv);
    shan.rotation.x = lerp(0, -Math.PI / 2, conv);
    gold.emissiveIntensity = .4 + assem * 2.2 + seg(t, .62, .7) * .6;
    // камера
    const fly = ease(seg(t, .22, .32)), inside = seg(t, .3, .62);
    focus = inside * (N - 1);
    const yaw = focus * Math.PI * 2 / N + yawDrag;
    if (t < .32) {
      cam.position.set(Math.sin(time * .1) * .3, Math.cos(time * .13) * .2, lerp(12, -9, fly)); look.set(0, 0, lerp(-2, HUB.z, fly));
    } else if (t < .62) {
      const d = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
      cam.position.copy(HUB).addScaledVector(d, -1.6 + Math.sin(time * .4) * .1); cam.position.y += .2; look.copy(HUB).addScaledVector(d, R);
    } else {
      const k = ease(seg(t, .62, .8)), d = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
      tmp.copy(HUB).addScaledVector(d, -1.6); v.copy(HUB).add(new THREE.Vector3(0, -1.5, 11)); cam.position.lerpVectors(tmp, v, k);
      tmp.copy(HUB).addScaledVector(d, R); look.lerpVectors(tmp, new THREE.Vector3(HUB.x, HUB.y + 2.2, HUB.z), k);
      if (t > .8) { const up = ease(seg(t, .8, .88)); cam.position.y = lerp(cam.position.y, HUB.y - 2.5, up); cam.position.z = lerp(cam.position.z, HUB.z + 2.5, up); look.set(HUB.x, HUB.y + 3.2, HUB.z); }
    }
    cam.lookAt(look);
    // порталдар
    const pIn = seg(t, .26, .34), pOut = conv;
    portals.forEach((p, i) => {
      const op = pIn * (1 - pOut * .85) * (1 - assem), near = clamp(1 - Math.abs(((focus + yawDrag / (Math.PI * 2 / N)) - i + N * 10) % N > N / 2 ? N - (((focus + yawDrag / (Math.PI * 2 / N)) - i + N * 10) % N) : ((focus + yawDrag / (Math.PI * 2 / N)) - i + N * 10) % N));
      p.face.material.opacity = op; p.frame.material.opacity = op; p.nm.material.opacity = op * (.4 + .6 * near); p.rl.material.opacity = op * near;
      p.face.material.color.setScalar(.45 + .55 * near);
      const w = p.grp.children[p.grp.children.length - 1]; w.visible = op > .02 && near > .05; w.userData.tick(time); w.children.forEach((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = (o.material.userData.o ?? (o.material.userData.o = o.material.opacity)) * op * near; } });
      p.grp.visible = op > .01;
      p.grp.scale.setScalar(1 - pOut * .4);
    });
    // 04: ағындар
    const f = ease(seg(t, .63, .76)); flow.mat.opacity = seg(t, .6, .64) * (1 - seg(t, .8, .86));
    { const { pos, from, n } = flow, c = HUB; for (let i = 0; i < n; i++) { const j = i * 3, k = clamp(f * 1.4 - (i % 37) / 37 * .4); pos[j] = lerp(from[j], c.x + Math.sin(i + time) * .3 * (1 - k), k); pos[j + 1] = lerp(from[j + 1], c.y + 3.2 + Math.cos(i * 1.7 + time) * .3 * (1 - k), k); pos[j + 2] = lerp(from[j + 2], c.z, k); } flow.geo.attributes.position.needsUpdate = true; flow.p.visible = flow.mat.opacity > .01; }
    key.intensity = 60 + assem * 260;
    // HTML қабаттары
    stage.style.setProperty("--flash", (seg(t, .82, .87) * (1 - seg(t, .88, .92))).toFixed(3));
    stage.style.setProperty("--photo", (seg(t, .87, .9) * (1 - seg(t, .94, .96))).toFixed(3));
    stage.style.setProperty("--end", seg(t, .955, .985).toFixed(3));
    stage.style.setProperty("--cvo", (1 - seg(t, .86, .9)).toFixed(3));
    stage.classList.toggle("is-photo", t > .88 && t < .95); stage.classList.toggle("is-end", t > .97);
    if (bar0) bar0.style.transform = `scaleX(${t.toFixed(4)})`;
    // тарау мен адам
    let c = 0; CH.forEach((ch, i) => { if (t >= ch.at - .001) c = i; });
    const w = Math.round(focus + yawDrag / (Math.PI * 2 / N)); const wi = ((w % N) + N) % N, inWorlds = t > .3 && t < .62;
    if (c !== chap || (inWorlds && wi !== who)) {
      chap = c; who = inWorlds ? wi : -1;
      const ch = CH[c], m = who >= 0 ? M[who] : null;
      cap.k.textContent = ch.k; cap.t.textContent = m ? m.name : ch.t; cap.d.textContent = m ? `${m.role} · ${m.tag}` : ch.d;
      root.dataset.chap = String(c + 1);
      dots.forEach((b, i) => { b.classList.toggle("is-on", i === c); b.setAttribute("aria-current", i === c ? "step" : "false"); });
      enter.hidden = !inWorlds; people.hidden = !inWorlds;
      pbtn.forEach((b, i) => b.classList.toggle("is-on", i === who));
      $(".t3-cap").classList.remove("is-swap"); void $(".t3-cap").offsetWidth; $(".t3-cap").classList.add("is-swap");
    }
    renderer.render(scene, cam);
  }
  loop();
}
