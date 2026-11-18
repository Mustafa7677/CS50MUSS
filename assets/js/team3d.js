/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «THE UNMADE / Жасалмаған сайт» (team/3d.html) - қараңғы кинематографиялық журнал стиліндегі 3D фильм, three.js r160 (MIT, assets/vendor/three).
   Визуал жүйесі: обсидиан, фарфор, графит - негіз; шампань-алтын - тек 5%-дық акцент. Bodoni Moda - алып тақырыптар, Inter - белгілер,
   PT Serif - қазақша жолдар. Бір үздіксіз камера кадры (~110 с), дыбыссыз:
     Постер   - «THE PEOPLE BEHIND THE FUTURE.» кеңістіктегі алып әріптер, артында қараңғыдағы бес адам; «ENTER EXPERIENCE» (не 6 с) -
                камера әріптердің, сосын адамдардың арасынан өтеді;
     I        - ауада AO17 сайты (сілтемелері шынайы): «адамдарды алып тастасақ ше?» - қабаттарға ажырайды, бос шыныға айналады;
     II-III   - бір кеңістікте бес кейіпкер: фоннан бөлінген портрет қараңғыдан жарыққа шығады, артында алып есім. Есімнің іші
                платформаның сол адам жасаған қабатымен толады (әріп → құрылым → өнім), сосын әріптер жолақтарға ажырап, тереңге кетеді;
     IV       - камера сайтқа оралады: ол қабат-қабатымен қайта жиналып, мыңдаған бөлшекке айналады; тартуға болады;
     V        - бөлшектер алып шаңыраққа бірігеді;   VI - жарықтан шынайы топ фотосы, «BUILT BY PEOPLE.»
   7.1 «фото - басты кейіпкер»: барлық фото түпнұсқа тікбұрыш (кесілмейді, фоннан бөлінбейді), рамкаға салынған зат ретінде қозғалады;
   шаңырақ пен әріптер фотоның сыртында. Қозғалыс азайса не WebGL жоқ болса - титрлер. */
import * as THREE from "../vendor/three/three.module.min.js";

const $ = (s, r = document) => r.querySelector(s);
const root = $(".um"), raw = $("#um-data");
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a, b, k) => a + (b - a) * k;
const reduced = () => document.documentElement.classList.contains("reduce-motion") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

if (root && raw) {
  const D = JSON.parse(raw.textContent);
  if (reduced() || !webgl()) root.classList.add("um-static");
  else start(D).catch((e) => { console.warn(e); root.classList.remove("um-live"); root.classList.add("um-static"); });
}

// ---------- уақыт сызығы (секунд, «ENTER»-ден кейін) ----------
const T = { story: 2.4, q: 6.5, brk: 10, strip: 17.5, act: 24, per: 11, col: 79, shan: 87.5, void: 95.5, faces: 99.5, group: 104, hand: 113, back: 115, live: 119.5, fin: 120, end: 126 };
// тараулар (секунд) - «#t=…» сілтемесі кез келгеніне апарады; seek(t) күйді уақыттан қайта есептейді
const CHAPTERS = [[0, "Кіру"], [10, "Ыдырау"], [26, "Бес автор"], [79, "Тоғысу"], [87.5, "Шаңырақ"], [95.5, "Адамдар"], [113, "Алтыншы қол"]];
const P1 = T.hand + 1;   // «алтыншы қол»: бөлік орнатылғанша уақыт осында тоқтайды
const FW = 1280, FH = 800, UW = 16, UH = 10, GAP = 1.4;
const GOLD = "#d9b468", CREAM = "#efe6d3";
const PORC = 0xece8df, CHAMP = 0xbfa276;   // Ivory, Champagne (Obsidian #08090B, Graphite #444D59 - CSS-те)
const F = { u: "Unbounded, sans-serif", s: "'PT Serif', Georgia, serif", i: "Inter, system-ui, sans-serif", m: "'JetBrains Mono', ui-monospace, monospace", b: "'Bodoni Moda', 'PT Serif', serif" };

// ---------- сайттың көрінісі: элементтер (1280×800 кадрда) және қабаттар ----------
// 0 - негіз (бет, шапка, шаңырақ суреті), 1 - типографика, 2 - интерфейс, 3 - логика (код), 4 - мазмұн (академиялар)
const EL = [
  { L: 0, k: "page", x: 0, y: 0, w: 1280, h: 800, tag: "<body>" },
  { L: 0, k: "bar", x: 0, y: 0, w: 1280, h: 76, tag: "<header>" },
  { L: 0, k: "logo", x: 40, y: 22, w: 124, h: 34, tag: "<a.logo>" },
  { L: 0, k: "nav", x: 560, y: 20, w: 680, h: 38, tag: "<nav>" },
  { L: 0, k: "art", x: 860, y: 96, w: 380, h: 220, tag: "<svg.shanyraq>" },
  { L: 1, k: "h1", x: 64, y: 122, w: 660, h: 170, tag: "<h1>" },
  { L: 1, k: "lead", x: 64, y: 312, w: 640, h: 64, tag: "<p.lead>" },
  { L: 2, k: "btn", x: 64, y: 400, w: 240, h: 54, tag: "<a.btn>", gold: 1, txt: "Академияны таңдау" },
  { L: 2, k: "btn", x: 320, y: 400, w: 226, h: 54, tag: "<a.btn>", txt: "CS50x-тен бастау" },
  { L: 2, k: "stats", x: 64, y: 486, w: 660, h: 96, tag: "<dl.stats>" },
  { L: 3, k: "code", x: 772, y: 340, w: 448, h: 250, tag: "<div.editor>" },
  { L: 4, k: "cards", x: 64, y: 618, w: 1156, h: 140, tag: "<ul.academies>" },
];
const CODE = [["def ", "salem", "(aty):"], ["    return ", "f\"Сәлем, {aty}!\""], [""], ["komanda = [", "\"Gulzat\", \"Dastan\", \"Mustafa\","], ["           ", "\"Magzhan\", \"Merey\"", "]"], ["for ", "adam ", "in komanda:"], ["    print(salem(adam))"]];
const CODE_CLR = [["#e58a96", GOLD, CREAM], ["#e58a96", "#c9d78f"], [CREAM], [CREAM, "#c9d78f"], [CREAM, "#c9d78f", CREAM], ["#e58a96", CREAM, CREAM], [CREAM]];
const OUT = ["Сәлем, Gulzat!", "Сәлем, Dastan!", "Сәлем, Mustafa!", "Сәлем, Magzhan!", "Сәлем, Merey!"];
const ACAD = [["Бағдарламалау", "#b0384a"], ["Математика", GOLD], ["English", "#6f8fb3"], ["Digital SAT", "#c9505f"], ["IELTS", "#8fae7a"], ["CS Universe", "#e8d9b8"]];
const STATS = [["9", "курс"], ["247", "дайын сабақ"], ["3307", "тапсырма"], ["1972", "тест сұрағы"], ["0 ₸", "оқушыға"]];

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function wire(c, e, a = 1) { c.save(); c.globalAlpha = a; c.setLineDash([7, 6]); c.strokeStyle = "rgba(217,180,104,.8)"; c.lineWidth = 1.4; c.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2); c.setLineDash([]); c.fillStyle = "rgba(217,180,104,.95)"; c.font = `500 13px ${F.m}`; c.fillText(e.tag, e.x + 8, e.y + 18); c.restore(); }
function bars(c, x, y, w, n, lh, col) { c.fillStyle = col; for (let i = 0; i < n; i++) { rr(c, x, y + i * lh, i === n - 1 && n > 1 ? w * .58 : w * (.86 + (i * 37 % 13) / 100), lh * .42, lh * .21); c.fill(); } }

function drawEl(c, e, S, tt) {
  const st = S.struct, de = S.design, co = S.content, ia = S.interact;
  if (!st && !de) return;
  if (st && !de) { wire(c, e); return; }
  switch (e.k) {
    case "page": { const g = c.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, "#0b0806"); g.addColorStop(1, "#1b130c"); c.fillStyle = g; c.fillRect(0, 0, FW, FH); break; }
    case "bar": c.fillStyle = "rgba(10,7,5,.92)"; c.fillRect(0, 0, FW, 76); c.fillStyle = "rgba(217,180,104,.55)"; c.fillRect(0, 75, FW, 1.5); break;
    case "logo": if (co) { c.font = `800 27px ${F.u}`; c.fillStyle = CREAM; c.textBaseline = "middle"; c.fillText("AO", 76, 40); c.fillStyle = GOLD; c.fillText("17", 76 + c.measureText("AO").width, 40); c.strokeStyle = GOLD; c.lineWidth = 2.2; c.beginPath(); c.arc(56, 40, 12, 0, 7); c.moveTo(44, 36); c.lineTo(68, 36); c.moveTo(44, 44); c.lineTo(68, 44); c.stroke(); c.textBaseline = "alphabetic"; } else bars(c, 44, 30, 110, 1, 22, "rgba(239,230,211,.22)"); break;
    case "nav": { const it = ["Курстар", "Лекциялар", "Жаттығу", "Ойындар", "Сөздік"]; let x = 580; c.font = `500 16px ${F.i}`; it.forEach((s, i) => { const w = co ? c.measureText(s).width : 74; if (i === 0) { c.strokeStyle = "rgba(217,180,104,.45)"; c.lineWidth = 1.2; rr(c, x - 14, 22, w + 28, 34, 17); c.stroke(); } if (co) { c.fillStyle = i ? "rgba(239,230,211,.82)" : CREAM; c.fillText(s, x, 45); } else bars(c, x, 32, 70, 1, 22, "rgba(239,230,211,.2)"); x += w + 40; }); c.strokeStyle = "rgba(239,230,211,.25)"; rr(c, 1120, 22, 100, 34, 10); c.stroke(); if (co) { c.fillStyle = "rgba(239,230,211,.75)"; c.fillText("⌕ Іздеу", 1134, 45); } break; }
    case "art": { const cx = 1050, cy = 160, r = 62; const g = c.createLinearGradient(0, cy, 0, 800); g.addColorStop(0, "rgba(243,213,138,.28)"); g.addColorStop(1, "rgba(224,182,100,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(cx - 40, cy); c.lineTo(cx + 40, cy); c.lineTo(cx + 210, 800); c.lineTo(cx - 230, 800); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.lineWidth = 1.2; c.globalAlpha = .6; for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; c.beginPath(); c.moveTo(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4)); c.lineTo(cx + Math.cos(a) * (r + 64), cy + Math.sin(a) * (r + 46)); c.stroke(); } c.globalAlpha = 1; c.lineWidth = 2.2; [-.42, -.16, .16, .42].forEach((d) => { const h = Math.sqrt(1 - d * d) * r; c.beginPath(); c.moveTo(cx - h, cy + d * r); c.lineTo(cx + h, cy + d * r); c.moveTo(cx + d * r, cy - h); c.lineTo(cx + d * r, cy + h); c.stroke(); }); break; }
    case "h1": if (co) { c.fillStyle = CREAM; c.font = `700 70px ${F.s}`; c.fillText("Бір шаңырақ", 64, 196); c.fillText("алты академия", 64, 276); } else bars(c, 64, 150, 560, 2, 80, "rgba(239,230,211,.2)"); break;
    case "lead": if (co) { c.fillStyle = "rgba(239,230,211,.8)"; c.font = `400 19px ${F.i}`; c.fillText("Бағдарламалау, ағылшын тілі және математика бір платформада:", 64, 334); c.fillText("түсіндірме, браузердегі код, автотексеру. Қазақ тілінде, тегін.", 64, 362); } else bars(c, 64, 322, 600, 2, 28, "rgba(239,230,211,.14)"); break;
    case "btn": { c.save(); if (e.gold) { if (ia) { c.shadowColor = "rgba(217,180,104,.8)"; c.shadowBlur = 14 + Math.sin(tt * 3) * 10; } c.fillStyle = GOLD; rr(c, e.x, e.y, e.w, e.h, 12); c.fill(); } else { c.strokeStyle = "rgba(239,230,211,.55)"; c.lineWidth = 1.4; rr(c, e.x + .5, e.y + .5, e.w - 1, e.h - 1, 12); c.stroke(); } c.restore(); if (co) { c.font = `600 17px ${F.i}`; c.fillStyle = e.gold ? "#1a1209" : CREAM; c.textAlign = "center"; c.fillText(e.txt, e.x + e.w / 2, e.y + 33); c.textAlign = "left"; } else bars(c, e.x + 30, e.y + 22, e.w - 60, 1, 22, e.gold ? "rgba(26,18,9,.35)" : "rgba(239,230,211,.2)"); break; }
    case "stats": { c.strokeStyle = "rgba(217,180,104,.32)"; c.lineWidth = 1.2; rr(c, e.x + .5, e.y + .5, e.w - 1, e.h - 1, 16); c.stroke(); const cw = e.w / 5; STATS.forEach(([n, l], i) => { const x = e.x + i * cw; if (i) { c.fillStyle = "rgba(217,180,104,.2)"; c.fillRect(x, e.y + 14, 1, e.h - 28); } if (co) { c.fillStyle = i === 4 ? GOLD : CREAM; c.font = `700 30px ${F.s}`; c.fillText(n, x + 18, e.y + 46); c.fillStyle = "rgba(239,230,211,.7)"; c.font = `400 14px ${F.i}`; c.fillText(l, x + 18, e.y + 72); } else bars(c, x + 18, e.y + 26, cw - 50, 2, 28, "rgba(239,230,211,.18)"); }); break; }
    case "code": {
      c.fillStyle = "#120d09"; rr(c, e.x, e.y, e.w, e.h, 14); c.fill(); c.strokeStyle = "rgba(217,180,104,.35)"; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = "rgba(217,180,104,.08)"; c.fillRect(e.x + 1, e.y + 1, e.w - 2, 34); ["#c9505f", GOLD, "#8fae7a"].forEach((cl, i) => { c.fillStyle = cl; c.beginPath(); c.arc(e.x + 20 + i * 16, e.y + 18, 5, 0, 7); c.fill(); });
      c.fillStyle = GOLD; rr(c, e.x + e.w - 98, e.y + 7, 86, 22, 11); c.fill();
      if (co) { c.font = `500 13px ${F.m}`; c.fillStyle = "rgba(239,230,211,.6)"; c.fillText("main.py", e.x + 76, e.y + 23); c.fillStyle = "#1a1209"; c.font = `600 12px ${F.i}`; c.fillText("▶ Іске қосу", e.x + e.w - 88, e.y + 22); }
      if (!co) { bars(c, e.x + 20, e.y + 54, 300, 6, 22, "rgba(239,230,211,.14)"); break; }
      const total = CODE.reduce((s, l) => s + l.join("").length, 0), typed = ia ? Math.floor((tt * 26) % (total + 70)) : total;
      let n = 0; c.font = `500 14px ${F.m}`;
      CODE.forEach((line, li) => { let x = e.x + 20; const y = e.y + 60 + li * 21; c.fillStyle = "rgba(239,230,211,.28)"; c.fillText(String(li + 1), e.x + 6, y); line.forEach((part, pi) => { const vis = part.slice(0, clamp(typed - n, 0, part.length)); n += part.length; c.fillStyle = CODE_CLR[li][pi] || CREAM; c.fillText(vis, x + 8, y); x += c.measureText(part).width; }); });
      const done = typed >= total, oy = e.y + 60 + CODE.length * 21 + 6;
      c.fillStyle = "rgba(217,180,104,.18)"; c.fillRect(e.x + 14, oy - 14, e.w - 28, 1);
      if (done) { const k = ia ? clamp(Math.floor(((tt * 26) % (total + 70) - total) / 10), 0, 5) : 2; c.fillStyle = "#c9d78f"; c.font = `500 13px ${F.m}`; OUT.slice(0, Math.max(1, Math.min(2, k))).forEach((s, i) => c.fillText("› " + (ia ? OUT[Math.max(0, k - 2 + i)] || s : s), e.x + 22, oy + 6 + i * 18)); }
      if (ia && !done && Math.floor(tt * 2) % 2) { c.fillStyle = GOLD; c.fillRect(e.x + 30, oy - 30, 8, 16); }
      break;
    }
    case "cards": { const gap = 16, cw = (e.w - gap * 5) / 6; ACAD.forEach(([t, cl], i) => { const x = e.x + i * (cw + gap), lift = ia && Math.floor(tt * .9) % 6 === i ? -8 : 0, y = e.y + lift; c.fillStyle = "#15100b"; rr(c, x, y, cw, e.h, 14); c.fill(); c.strokeStyle = lift ? GOLD : "rgba(217,180,104,.22)"; c.lineWidth = lift ? 2 : 1.2; c.stroke(); c.fillStyle = cl; c.beginPath(); c.arc(x + 30, y + 34, 13, 0, 7); c.fill(); if (co) { c.fillStyle = CREAM; c.font = `600 16px ${F.i}`; c.fillText(t, x + 18, y + 82); c.fillStyle = "rgba(239,230,211,.6)"; c.font = `400 13px ${F.i}`; c.fillText("Академия", x + 18, y + 106); } else bars(c, x + 18, y + 70, cw - 50, 2, 26, "rgba(239,230,211,.16)"); }); break; }
  }
  if (st && de && !co) wire(c, e, .35);
}
function drawLayer(c, L, S, tt) { c.clearRect(0, 0, FW, FH); for (const e of EL) if (e.L === L) drawEl(c, e, S, tt); }

// телефон нұсқасы (Merey): сол сайт 390×844 кадрда
function drawPhone(c, tt) {
  const W = 390, H = 844; c.clearRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b0806"); g.addColorStop(1, "#1b130c"); c.fillStyle = g; rr(c, 0, 0, W, H, 36); c.fill();
  c.fillStyle = "rgba(217,180,104,.5)"; c.fillRect(0, 70, W, 1.2);
  c.font = `800 22px ${F.u}`; c.fillStyle = CREAM; c.fillText("AO", 24, 46); c.fillStyle = GOLD; c.fillText("17", 24 + c.measureText("AO").width, 46);
  c.strokeStyle = CREAM; c.lineWidth = 2; [30, 38, 46].forEach((y) => { c.beginPath(); c.moveTo(336, y); c.lineTo(362, y); c.stroke(); });
  c.fillStyle = CREAM; c.font = `700 38px ${F.s}`; c.fillText("Бір шаңырақ", 24, 136); c.fillText("алты академия", 24, 180);
  c.fillStyle = "rgba(239,230,211,.78)"; c.font = `400 15px ${F.i}`; ["Бағдарламалау, ағылшын тілі және", "математика бір платформада.", "Қазақ тілінде, тегін."].forEach((s, i) => c.fillText(s, 24, 218 + i * 22));
  c.save(); c.shadowColor = "rgba(217,180,104,.7)"; c.shadowBlur = 10 + Math.sin(tt * 3) * 8; c.fillStyle = GOLD; rr(c, 24, 296, W - 48, 50, 12); c.fill(); c.restore();
  c.fillStyle = "#1a1209"; c.font = `600 16px ${F.i}`; c.textAlign = "center"; c.fillText("Академияны таңдау", W / 2, 327); c.strokeStyle = "rgba(239,230,211,.5)"; rr(c, 24.5, 358.5, W - 49, 49, 12); c.stroke(); c.fillStyle = CREAM; c.fillText("CS50x-тен бастау", W / 2, 389); c.textAlign = "left";
  STATS.slice(0, 4).forEach(([n, l], i) => { const x = 24 + (i % 2) * 175, y = 430 + Math.floor(i / 2) * 74; c.strokeStyle = "rgba(217,180,104,.3)"; rr(c, x, y, 167, 64, 12); c.stroke(); c.fillStyle = CREAM; c.font = `700 24px ${F.s}`; c.fillText(n, x + 14, y + 32); c.fillStyle = "rgba(239,230,211,.7)"; c.font = `400 12px ${F.i}`; c.fillText(l, x + 14, y + 52); });
  ACAD.forEach(([t, cl], i) => { const x = 24 + (i % 2) * 175, y = 590 + Math.floor(i / 2) * 76, lift = Math.floor(tt * .9) % 6 === i ? -4 : 0; c.fillStyle = "#15100b"; rr(c, x, y + lift, 167, 66, 12); c.fill(); c.strokeStyle = lift ? GOLD : "rgba(217,180,104,.22)"; c.stroke(); c.fillStyle = cl; c.beginPath(); c.arc(x + 22, y + lift + 24, 8, 0, 7); c.fill(); c.fillStyle = CREAM; c.font = `600 13px ${F.i}`; c.fillText(t, x + 14, y + lift + 52); });
}

async function start(D) {
  root.classList.add("um-live");
  const hdr = document.querySelector(".topbar"); const fitStage = () => { const st = $(".um-stage"); if (st && hdr) st.style.height = Math.max(420, innerHeight - hdr.offsetHeight) + "px"; }; fitStage(); addEventListener("resize", fitStage);
  const M = D.members, mobile = innerWidth < 760, R = mobile ? 1 : 1.25;
  const ORDER = ["sagid", "gulzat", "dastan", "magzhan", "merey"];   // қаңқа → дизайн → мазмұн → қозғалыс → телефон
  const BY = Object.fromEntries(M.map((m) => [m.slug, m]));
  const cv = $(".um-cv"), stage = $(".um-stage");
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mobile, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x08090b, 1);
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); root.classList.remove("um-live"); root.classList.add("um-static"); }, false);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x08090b, 34, 90);
  const cam = new THREE.PerspectiveCamera(50, 1, .1, 220);
  try { await Promise.all([`800 27px Unbounded`, `700 70px "PT Serif"`, `400 19px Inter`, `600 17px Inter`, `500 14px "JetBrains Mono"`, `500 120px "Bodoni Moda"`, `700 120px "Bodoni Moda"`].map((f) => document.fonts.load(f))); } catch (e) { /* әдепкі қаріп */ }

  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,253,248,1)"); gr.addColorStop(.3, "rgba(236,232,225,.55)"); gr.addColorStop(1, "rgba(236,232,225,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const mkCanvas = (w, h, r) => { const c = document.createElement("canvas"); c.width = Math.round(w * r); c.height = Math.round(h * r); const x = c.getContext("2d"); x.scale(r, r); return { c, x }; };
  const mkTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const loader = new THREE.TextureLoader();
  const load = (src) => new Promise((res) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));
  const cutTex = Object.fromEntries(await Promise.all(M.map(async (m) => [m.slug, await load(m.photo)])));   // түпнұсқа фото (assets/img/team/dark), альфасыз

  // ---------- сайттың қабаттары (I және IV) ----------
  const FULL = { struct: 1, design: 1, content: 1, interact: 0 }, EMPTY = { struct: 0, design: 0, content: 0, interact: 0 };
  const layers = [0, 1, 2, 3, 4].map((L) => {
    const g = new THREE.Group(); scene.add(g);
    const mk = () => { const cc = mkCanvas(FW, FH, R), tex = mkTex(cc.c), m = new THREE.Mesh(new THREE.PlaneGeometry(UW, UH), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = L * 3; g.add(m); return { ...cc, tex, m }; };
    const A = mk(), B = mk(); B.m.material.opacity = 0; B.m.renderOrder = L * 3 + 1;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(UW, UH, .04)), new THREE.LineBasicMaterial({ color: PORC, transparent: true, opacity: 0 })); g.add(edge);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(UW, UH), new THREE.MeshBasicMaterial({ color: PORC, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); glass.position.z = -.01; g.add(glass);
    drawLayer(A.x, L, FULL, 0); A.tex.needsUpdate = true;
    return { L, g, A, B, edge, glass, fade: null, z: 0 };
  });
  const clock = new THREE.Clock();
  let stageKey = "full";
  function setStage(next, key, stagger = .12, dur = 1.1) {
    if (key === stageKey) return; stageKey = key;
    const now = clock.elapsedTime;
    layers.forEach((l) => { if (l.fade) swap(l); drawLayer(l.B.x, l.L, next, now); l.B.tex.needsUpdate = true; l.fade = { t0: now + l.L * stagger, dur }; });
  }
  function swap(l) { const a = l.A; l.A = l.B; l.B = a; l.A.m.material.opacity = 1; l.B.m.material.opacity = 0; l.fade = null; }

  // код жолдары тартылатын жіңішке жіптер (фарфор; алтын емес)
  const W2 = (x, y) => [(x / FW - .5) * UW, -(y / FH - .5) * UH];
  const NTH = mobile ? 30 : 56, thr = new Float32Array(NTH * 6), thrSeed = [];
  for (let i = 0; i < NTH; i++) { const li = i % CODE.length, [x, y] = W2(812 + Math.random() * 300, 400 + li * 21 + (Math.random() - .5) * 6); thrSeed.push({ x, y, dx: (Math.random() - .5) * 6, dy: (Math.random() - .5) * 4, dz: -(8 + Math.random() * 16), d: Math.random() * .5 }); }
  const thrGeo = new THREE.BufferGeometry(); thrGeo.setAttribute("position", new THREE.BufferAttribute(thr, 3));
  const thrMat = new THREE.LineBasicMaterial({ color: PORC, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const threads = new THREE.LineSegments(thrGeo, thrMat); scene.add(threads);

  // ---------- постер: кеңістіктегі алып әріптер, қараңғыдағы бес адам, шаңырақ сызығы ----------
  const PZ = 92;   // постердегі камераның орны
  const textPlane = (lines, opts) => {
    const { size = 200, weight = 500, color = "#ece8e1", w = 2048, lh = 1.0, italic = false, z, y, width } = opts;
    const cc = mkCanvas(w, Math.round(size * lh * lines.length + size * .5), 1), x = cc.x;
    x.font = `${italic ? "italic " : ""}${weight} ${size}px ${F.b}`; x.fillStyle = color; x.textAlign = "center"; x.textBaseline = "alphabetic";
    lines.forEach((s, i) => x.fillText(s, w / 2, size * (i + 1) * lh));
    const tex = mkTex(cc.c), ar = cc.c.width / cc.c.height;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / ar), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    m.position.set(0, y, z); scene.add(m); return m;
  };
  const pw = mobile ? 15 : 24;
  const poster = [
    textPlane(["THE PEOPLE BEHIND"], { size: 168, z: 64, y: mobile ? 8.4 : 7.4, width: pw }),
    textPlane(["THE FUTURE."], { size: 168, z: 64, y: mobile ? -8.6 : -7.6, width: pw }),
  ];
  poster.forEach((m, i) => { m.renderOrder = 60 + i; });
  // «The Living Frame» 7.1: шынайы топ фотосы - бір тұтас, өзгертілмеген тікбұрыш; рамкасымен бірге қатты зат ретінде сәл қисаяды
  const PHZ = 46, PHW = mobile ? 15.5 : 19, PHH = PHW * 1681 / 2400;
  const gTex = await load(D.group.photo);
  if (gTex) { gTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); gTex.generateMipmaps = true; }
  const photoFrame = new THREE.Group(); photoFrame.position.set(0, 0, PHZ); scene.add(photoFrame);
  const photoBg = new THREE.Mesh(new THREE.PlaneGeometry(PHW, PHH), new THREE.MeshBasicMaterial({ map: gTex, transparent: true, depthWrite: false, fog: false }));
  photoBg.renderOrder = 48; photoFrame.add(photoBg);
  const pfLine = new THREE.LineBasicMaterial({ color: PORC, transparent: true, opacity: .35, fog: false });
  { const w = PHW / 2 + .28, h = PHH / 2 + .28; photoFrame.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w, -h, 0), new THREE.Vector3(w, -h, 0), new THREE.Vector3(w, h, 0), new THREE.Vector3(-w, h, 0)]), pfLine)); }
  const crowd = [photoBg];
  const RR = mobile ? 9.6 : 12.6;   // шаңырақ шеңбері фотодан үлкен және оның артында: адамдардың үстінен өтпейді
  const ringPts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a) * RR, Math.sin(a) * RR, 0)); }
  const ring = new THREE.Group(); ring.position.set(0, 0, PHZ - 1.5); ring.scale.setScalar(RR / 9); scene.add(ring);
  const lineMat = new THREE.LineBasicMaterial({ color: CHAMP, transparent: true, opacity: .32, fog: false });
  ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), lineMat));
  ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts.map((p) => p.clone().multiplyScalar(.93))), lineMat));
  { const lp = []; [-.3, .3].forEach((d) => { const h = Math.sqrt(1 - d * d) * 8.4; lp.push(new THREE.Vector3(d * 8.4, -h, 0), new THREE.Vector3(d * 8.4, h, 0), new THREE.Vector3(-h, d * 8.4, 0), new THREE.Vector3(h, d * 8.4, 0)); }); for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; lp.push(new THREE.Vector3(Math.cos(a) * 9.2, Math.sin(a) * 9.2, 0), new THREE.Vector3(Math.cos(a) * 13, Math.sin(a) * 13, -3)); } ring.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: PORC, transparent: true, opacity: .1, fog: false }))); }

  // ---------- II-III: бір кеңістіктегі бес кейіпкер ----------
  const PX = (i) => -36 + i * 18, PZP = -40, PH = 7;
  const NAME_K = 12;
  const nameMat = () => new THREE.ShaderMaterial({
    uniforms: { mapA: { value: null }, mapB: { value: null }, mixv: { value: 0 }, op: { value: 0 }, reveal: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D mapA; uniform sampler2D mapB; uniform float mixv; uniform float op; uniform float reveal; varying vec2 vUv; void main(){ if (vUv.y > reveal) discard; vec4 a = texture2D(mapA, vUv); vec4 b = texture2D(mapB, vUv); vec4 c = mix(a, b, mixv); gl_FragColor = vec4(c.rgb, c.a * op);\n#include <colorspace_fragment>\n}",
  });
  const people = ORDER.map((slug, i) => {
    const m = BY[slug], x = PX(i);
    const ar = cutTex[slug] && cutTex[slug].image ? cutTex[slug].image.width / cutTex[slug].image.height : .68;
    const portrait = new THREE.Mesh(new THREE.PlaneGeometry(PH * ar, PH), new THREE.MeshBasicMaterial({ map: cutTex[slug], transparent: true, depthWrite: false, color: 0x000000 }));
    { const w = PH * ar / 2 + .12, h = PH / 2 + .12; portrait.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w, -h, .01), new THREE.Vector3(w, -h, .01), new THREE.Vector3(w, h, .01), new THREE.Vector3(-w, h, .01)]), new THREE.LineBasicMaterial({ color: PORC, transparent: true, opacity: .28 }))); }
    portrait.position.set(x, 0, PZP); portrait.renderOrder = 40; scene.add(portrait);
    const key = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: PORC, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); key.scale.set(9, 10, 1); key.position.set(x, 1.8, PZP - 1.5); key.renderOrder = 30; scene.add(key);
    // алып есім: екі текстура (тұтас фарфор / ішінде платформаның қабаты), 12 көлденең жолақ
    const lines = [m.given.toUpperCase()];   // бір сөз: телефонда да басының үстінде толық оқылады (толық аты - HTML-де)
    const cw = mobile ? 1600 : 2400, size = mobile ? 360 : 420, chh = Math.round(size * .92 * lines.length + size * .3);
    const A = mkCanvas(cw, chh, 1), B = mkCanvas(cw, chh, 1);
    const fit = (x) => { let s = size; x.font = `700 ${s}px ${F.b}`; const wmax = Math.max(...lines.map((l) => x.measureText(l).width)); if (wmax > cw * .94) s = Math.floor(s * cw * .94 / wmax); x.font = `700 ${s}px ${F.b}`; return s; };
    const s0 = fit(A.x); A.x.fillStyle = "#ece8e1"; A.x.textAlign = "center"; lines.forEach((l, k) => A.x.fillText(l, cw / 2, s0 * .9 * (k + 1)));
    const texA = mkTex(A.c), texB = mkTex(B.c);
    const nw = mobile ? 6 : 17.5, nh = nw * chh / cw, strips = [];
    const grp = new THREE.Group(); grp.position.set(mobile ? x : x - 2.4, mobile ? 4.7 : 1.25, PZP - 3.2); scene.add(grp);
    for (let k = 0; k < NAME_K; k++) {
      const g = new THREE.PlaneGeometry(nw, nh / NAME_K), uv = g.attributes.uv, v0 = 1 - (k + 1) / NAME_K, v1 = 1 - k / NAME_K;
      for (let j = 0; j < uv.count; j++) uv.setY(j, uv.getY(j) > .5 ? v1 : v0);
      const mat = nameMat(); mat.uniforms.mapA.value = texA; mat.uniforms.mapB.value = texB;
      const mesh = new THREE.Mesh(g, mat); mesh.position.y = nh / 2 - (k + .5) * nh / NAME_K; mesh.renderOrder = 20; grp.add(mesh);
      strips.push({ mesh, mat, y0: mesh.position.y, dir: k % 2 ? 1 : -1, rnd: Math.random() });
    }
    return { slug, m, i, x, portrait, key, grp, strips, A, B, texA, texB, lines, cw, chh, s0, archDrawn: -1 };
  });
  // «Үзілмейтін жіп»: бес автордың сахнасы арқылы өтетін бір құрылымдық сызық; әр адамның еңбегімен ұзарады
  const thrPts = people.map((P) => new THREE.Vector3(mobile ? P.x : P.x - 2.4, mobile ? -.6 : -1.9, PZP - 3.2));
  const thread = new THREE.Line(new THREE.BufferGeometry().setFromPoints(new Array(64).fill(0).map(() => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: CHAMP, transparent: true, opacity: 0, depthWrite: false }));
  thread.frustumCulled = false; scene.add(thread);
  const threadCurve = new THREE.CatmullRomCurve3([thrPts[0].clone().add(new THREE.Vector3(-14, 0, 0)), ...thrPts, thrPts[4].clone().add(new THREE.Vector3(14, 0, 0))]);
  // есімнің ішіне - сол адам жасаған қабат: әріп → құрылым → өнім
  const STAGE = [{ struct: 1, design: 0, content: 0, interact: 0 }, { struct: 1, design: 1, content: 0, interact: 0 }, { struct: 1, design: 1, content: 1, interact: 0 }, { struct: 1, design: 1, content: 1, interact: 1 }, null];
  const tmpSite = mkCanvas(FW, FH, 1);
  const tmpPhone = mkCanvas(390, 844, 1);
  function drawArch(P, now) {
    const x = P.B.x, { cw, chh } = P; x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, cw, chh);
    x.fillStyle = "#121110"; x.fillRect(0, 0, cw, chh);
    if (STAGE[P.i]) {
      tmpSite.x.clearRect(0, 0, FW, FH); for (let L = 0; L < 5; L++) { const ly = mkLayerOnce(L, STAGE[P.i], now); tmpSite.x.drawImage(ly, 0, 0, FW, FH); }
      const sc = Math.max(cw / FW, chh / FH) * 1.05; x.drawImage(tmpSite.c, (cw - FW * sc) / 2, (chh - FH * sc) / 2, FW * sc, FH * sc);
    } else {
      drawPhone(tmpPhone.x, now); const ph = chh * 1.02, pw2 = ph * 390 / 844; for (let k = -3; k <= 3; k++) x.drawImage(tmpPhone.c, cw / 2 + k * (pw2 * 1.08) - pw2 / 2, (chh - ph) / 2, pw2, ph);
    }
    x.globalCompositeOperation = "destination-in"; x.font = `700 ${P.s0}px ${F.b}`; x.textAlign = "center"; x.fillStyle = "#000"; P.lines.forEach((l, k) => x.fillText(l, cw / 2, P.s0 * .9 * (k + 1)));
    x.globalCompositeOperation = "source-over"; x.strokeStyle = "rgba(236,232,225,.55)"; x.lineWidth = 2; x.font = `700 ${P.s0}px ${F.b}`; P.lines.forEach((l, k) => x.strokeText(l, cw / 2, P.s0 * .9 * (k + 1)));
    P.texB.needsUpdate = true;
  }
  const layerCache = [0, 1, 2, 3, 4].map(() => mkCanvas(FW, FH, 1));
  function mkLayerOnce(L, S, now) { drawLayer(layerCache[L].x, L, S, now); return layerCache[L].c; }

  // ---------- IV-V: бөлшектер мен шаңырақ ----------
  const COLS = mobile ? 30 : 46, ROWS = mobile ? 19 : 29, NF = COLS * ROWS;
  const comp = mkCanvas(FW, FH, R), compTex = mkTex(comp.c);
  const fGeo = new THREE.BoxGeometry(UW / COLS * .96, UH / ROWS * .96, .05), uvr = new Float32Array(NF * 4);
  const fMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: compTex }, op: { value: 0 }, glow: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: "attribute vec4 uvr; varying vec2 vUv; void main(){ vUv = uvr.xy + uv * uvr.zw; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D map; uniform float op; uniform float glow; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); vec3 col = mix(c.rgb, vec3(.86, .84, .8), glow); float a = max(c.a, glow * .9); gl_FragColor = vec4(col, a * op);\n#include <colorspace_fragment>\n}",
  });
  const frag = new THREE.InstancedMesh(fGeo, fMat, NF); frag.frustumCulled = false; frag.visible = false; scene.add(frag);
  const home = new Float32Array(NF * 3), off = new Float32Array(NF * 3), vel = new Float32Array(NF * 3), tgt = new Float32Array(NF * 3), tq = [], delay = new Float32Array(NF);
  for (let r = 0, i = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) { uvr.set([c / COLS, 1 - (r + 1) / ROWS, 1 / COLS, 1 / ROWS], i * 4); home.set([(c + .5) / COLS * UW - UW / 2, UH / 2 - (r + .5) / ROWS * UH, 0], i * 3); delay[i] = Math.random() * .38; }
  fGeo.setAttribute("uvr", new THREE.InstancedBufferAttribute(uvr, 4));
  const isBar = new Uint8Array(NF);   // шаңырақтың күлдіреуіші - соңғы бөлік, оны пайдаланушы орнатады
  { const RS = 7.4, order = [...Array(NF).keys()].sort(() => Math.random() - .5), n1 = Math.floor(NF * .26), n2 = Math.floor(NF * .1), n3 = Math.floor(NF * .26);
    order.forEach((idx, j) => { let x, y = -1, z, yaw = 0, pitch = -Math.PI / 2;
      if (j < n1) { const a = j / n1 * Math.PI * 2, rr2 = RS + (Math.random() - .5) * .5; x = Math.cos(a) * rr2; z = Math.sin(a) * rr2; yaw = -a; y += (Math.random() - .5) * .15; }
      else if (j < n1 + n2) { const a = (j - n1) / n2 * Math.PI * 2, rr2 = RS * .9; x = Math.cos(a) * rr2; z = Math.sin(a) * rr2; yaw = -a; }
      else if (j < n1 + n2 + n3) { const k = j - n1 - n2, bar = k % 4, f = (Math.floor(k / 4) / (n3 / 4)) * 2 - 1, d = [-.3, .3][bar % 2] * RS, h = Math.sqrt(RS * RS - d * d) * .97; if (bar < 2) { x = d; z = f * h; yaw = Math.PI / 2; } else { z = d; x = f * h; } y += .05; isBar[idx] = 1; }
      else { const k = j - n1 - n2 - n3, u = k % 36, f = Math.floor(k / 36) / Math.ceil((NF - n1 - n2 - n3) / 36), a = u / 36 * Math.PI * 2, rr2 = RS * (1.04 + f * .95); x = Math.cos(a) * rr2; z = Math.sin(a) * rr2; y -= f * 3.2; yaw = -a; pitch = -Math.PI / 2 + .35; }
      tgt.set([x, y, z], idx * 3); tq[idx] = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, 0, yaw, "XZY")); }); }
  const gems = [0, 1, 2, 3, 4].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: i === 0 ? CHAMP : PORC, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); const a = Math.PI / 2 + i / 5 * Math.PI * 2; s.position.set(Math.cos(a) * 7.4, -.8, Math.sin(a) * 7.4); s.scale.setScalar(1.4); scene.add(s); return s; });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xfffdf8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sun.position.set(0, -.5, 0); scene.add(sun);
  // соңғы бөлік: төрт күлдіреуіш, бір тұтас зат болып қалқып тұрады
  const RSx = 7.4, piece = new THREE.Group(); scene.add(piece);
  { const pm = new THREE.MeshBasicMaterial({ color: PORC, transparent: true, opacity: 0, depthWrite: false }); [-.3, .3].forEach((d) => { const h = Math.sqrt(1 - d * d) * RSx * .97 * 2; const a = new THREE.Mesh(new THREE.BoxGeometry(.3, .14, h), pm); a.position.x = d * RSx; piece.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(h, .14, .3), pm); b.position.z = d * RSx; piece.add(b); }); piece.userData.mat = pm; }
  const pieceGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: CHAMP, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); pieceGlow.scale.setScalar(10); piece.add(pieceGlow);
  const PIECE0 = new THREE.Vector3(mobile ? 0 : RSx * 1.95, -1, mobile ? -RSx * 1.6 : RSx * .55), piecePos = PIECE0.clone(), CENTER = new THREE.Vector3(0, -1, 0);
  let placed = false, placeAt = null;
  const dust = (() => { const n = mobile ? 260 : 600, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set([(Math.random() - .5) * 120, (Math.random() - .5) * 30, (Math.random() - .5) * 200], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: dot, size: .12, color: PORC, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts); return pts; })();

  // ---------- камера: бір үздіксіз, ауыр кадр ----------
  let keys = [], posC = null, lookC = null, Dd = 20;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight, asp = w / h; renderer.setSize(w, h, false);
    cam.aspect = asp; cam.fov = asp < .8 ? 68 : 50; cam.updateProjectionMatrix();
    const tn = Math.tan(cam.fov * Math.PI / 360); Dd = Math.max(UW / (.86 * 2 * tn * asp), UH / (.7 * 2 * tn));
    const V = (x, y, z) => new THREE.Vector3(x, y, z), K = [];
    K.push([0, V(0, 0, PZ), V(0, 0, 0)], [2.2, V(0, .1, 68), V(0, 0, 0)], [3.8, V(0, .2, 48), V(0, 0, 0)], [6, V(0, .1, Dd * 1.02), V(0, 0, 0)],
      [T.brk, V(0, .2, Dd * .93), V(0, 0, 0)], [13, V(Dd * .62, 1.6, Dd * .5), V(0, 0, 0)], [15.7, V(Dd * .78, 1.3, 1.2), V(0, 0, .7)],
      [17.9, V(12, .4, .7), V(0, .1, .7)], [20.1, V(-3, .2, .7), V(-14, 0, .7)], [22.3, V(-20, .6, -18), V(PX(0) - 4, .7, -48)]);
    people.forEach((P) => {
      const s0 = T.act + P.i * T.per, cx = mobile ? P.x : P.x - 2.4, cy = mobile ? 1.36 : .7, cz = PZP + (mobile ? 7.2 : 9);
      K.push([s0 + 1.2, V(cx, cy, cz), V(cx, cy, PZP - 10)], [s0 + T.per - 2.2, V(cx + (mobile ? 0 : .5), cy + .1, cz - .9), V(cx + (mobile ? 0 : .4), cy + .05, PZP - 10)]);
    });
    K.push([T.col + 1.8, V(26, 3, -10), V(0, 0, 0)], [T.col + 4.4, V(0, .3, Dd * 1.02), V(0, 0, 0)], [T.shan, V(0, .2, Dd), V(0, 0, 0)],
      [T.shan + 5.5, V(0, mobile ? 33 : 24, 9), V(0, -1, 0)], [T.void + 2, V(0, mobile ? 34 : 25, 8.5), V(0, -1, 0)], [T.hand, V(0, mobile ? 35 : 25.5, 8), V(0, -1, 0)], [P1, V(0, mobile ? 35 : 25.5, 8), V(0, -1, 0)],
      [T.back + 1.6, V(0, 9, Dd * .9), V(0, -.5, 0)], [T.back + 4, V(0, .2, Dd * 1.02), V(0, 0, 0)], [T.fin + .5, V(0, mobile ? -4.2 : -3.1, Dd * 1.42), V(0, mobile ? -4.2 : -3.1, 0)], [T.end, V(0, mobile ? -4.3 : -3.2, Dd * 1.46), V(0, mobile ? -4.3 : -3.2, 0)]);
    keys = K.map((k) => k[0]); posC = new THREE.CatmullRomCurve3(K.map((k) => k[1]), false, "centripetal"); lookC = new THREE.CatmullRomCurve3(K.map((k) => k[2]), false, "centripetal");
  }
  const camU = (t) => { let i = 0; while (i < keys.length - 2 && t > keys[i + 1]) i++; return (i + clamp((t - keys[i]) / (keys[i + 1] - keys[i]))) / (keys.length - 1); };
  addEventListener("resize", layout);
  // «мүмкін емес оралу»: финалдағы топ фотосы ашылудағы кадрдың тура орнында, тура өлшемінде (бастапқы камерадан проекциялау)
  function frameGroup() {
    const c0 = cam.clone(); c0.position.set(0, 0, PZ); c0.lookAt(0, 0, 0); c0.updateMatrixWorld(); c0.updateProjectionMatrix();
    const w = stage.clientWidth, h = stage.clientHeight, a = new THREE.Vector3(-PHW / 2, PHH / 2, PHZ).project(c0), b = new THREE.Vector3(PHW / 2, -PHH / 2, PHZ).project(c0);
    const img = $(".um-group img"); img.style.cssText = `left:${(a.x + 1) / 2 * w}px;top:${(1 - a.y) / 2 * h}px;width:${(b.x - a.x) / 2 * w}px;height:${(a.y - b.y) / 2 * h}px`;
  }

  // ---------- HTML қабаттары ----------
  const q = $(".um-q"), cap = $(".um-cap"), capK = $(".um-k"), capT = $(".um-t"), capD = $(".um-d"), hint = $(".um-hint"), site = $(".um-site"), bar0 = $(".um-bar i"), fin = $(".um-fin");
  const orbNodes = [...document.querySelectorAll(".um-orb .orb-n")], storyEl = $(".um-story"), groupEl = $(".um-group"), voidEl = $(".um-void"), facesEl = $(".um-faces"), handEl = $(".um-hand");
  const pp = $(".um-pp"), ppI = $(".um-pp-i"), ppE = $(".um-pp-e"), ppN = $(".um-pp-n"), ppR = $(".um-pp-r"), ppL = $(".um-pp-l"), ppA = $(".um-pp-a"), xrB = $(".um-xr"), xrL = $(".um-xr-l");
  const CAP = D.acts; let capKey = "", ppKey = -1;
  function caption(t) {
    const c = CAP.find((a) => t >= a.from && t < a.to) || null, key = c ? c.t : "";
    if (key === capKey) return; capKey = key; cap.classList.remove("is-on");
    if (!c) return;
    setTimeout(() => { if (capKey !== key) return; capK.textContent = c.k; capT.textContent = c.t; capD.textContent = c.d; cap.classList.add("is-on"); }, 380);
  }
  function person(t) {
    const i = Math.floor((t - T.act) / T.per), u = t - T.act - i * T.per, on = t >= T.act && t < T.col && u > 1.9 && u < T.per - 1.5;
    if (on && ppKey !== i) { ppKey = i; const P = people[i], m = P.m; ppI.textContent = `${String(i + 1).padStart(2, "0")} / 05`; ppE.textContent = m.en; ppN.textContent = m.name; ppR.textContent = m.role; ppL.textContent = m.law; ppA.href = m.slug + ".html"; xrL.replaceChildren(...m.works.map(([h, tt]) => { const li = document.createElement("li"), a = document.createElement("a"); a.href = h; a.textContent = tt; li.append(a); return li; })); }
    pp.classList.toggle("is-on", on);
    const cur = t >= T.act && t < T.col ? ORDER[i] : null; orbNodes.forEach((n) => n.classList.toggle("is-on", n.dataset.slug === cur));
    if (!on && !xrL.hidden) { xrL.hidden = true; xrB.setAttribute("aria-expanded", "false"); }
  }

  // ---------- басқару: постер → «ENTER» не 6 с → өзі ойнайды ----------
  const hashT = () => { const m = location.hash.match(/t=(\d+(?:\.\d+)?)/); return m ? +m[1] : null; };
  let back = null; try { const nav = performance.getEntriesByType("navigation")[0]; if (nav && nav.type === "back_forward") back = +sessionStorage.getItem("ao17:um-t") || null; } catch (e) { /* */ }
  const seek = hashT() ?? back ?? 0;
  let paused = false, pt = seek, started = seek > 0, onStage = true, idleT = 0, fragsBuilt = false, dragging = null, touched = false, posterT = 0;
  const begin = () => { if (started) return; started = true; root.classList.add("is-started"); };
  if (started) root.classList.add("is-started");
  function seekTo(t) { begin(); pt = clamp(t, 0, T.end); placed = pt > T.hand + 1.01; placeAt = placed ? { t: -9, from: CENTER.clone() } : null; if (!placed) piecePos.copy(PIECE0); touched = pt > T.shan; fragsBuilt = false; stageKey = ""; ppKey = -1; capKey = "x"; }
  addEventListener("hashchange", () => { const t = hashT(); if (t != null) seekTo(t); });
  addEventListener("pagehide", () => { try { sessionStorage.setItem("ao17:um-t", String(Math.round(pt))); } catch (e) { /* */ } });
  const pauseB = $(".um-pause"), chs = [...document.querySelectorAll(".um-chs a")];
  const setPause = (v) => { paused = v; pauseB.setAttribute("aria-pressed", String(v)); pauseB.textContent = v ? "Жалғастыру" : "Кідірту"; root.classList.toggle("is-paused", v); };
  pauseB.addEventListener("click", () => setPause(!paused));
  // X-Ray: таңдалған автордың сайттағы нақты беттері (licensing/team.json works); ашық тұрғанда фильм кідіреді
  xrB.addEventListener("click", () => { const open = xrL.hidden; xrL.hidden = !open; xrB.setAttribute("aria-expanded", String(open)); setPause(open); });
  addEventListener("keydown", (e) => { if (e.code === "Space" && started && !/^(A|BUTTON|INPUT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); setPause(!paused); } });
  $(".um-enter").addEventListener("click", begin);
  new IntersectionObserver((es) => { onStage = es[0].intersectionRatio > .35; }, { threshold: [0, .35, .7] }).observe(stage);
  const wake = () => { stage.classList.remove("is-idle"); clearTimeout(idleT); idleT = setTimeout(() => stage.classList.add("is-idle"), 2600); };
  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  ["pointermove", "pointerdown", "keydown"].forEach((ev) => addEventListener(ev, wake, { passive: true })); wake();
  $(".um-skip").addEventListener("click", () => { begin(); placed = true; pt = Math.max(pt, T.live - .3); });
  $(".um-replay").addEventListener("click", () => { setPause(false); history.replaceState(null, "", location.pathname); placed = false; placeAt = null; piecePos.copy(PIECE0); pt = 0; started = false; posterT = 0; root.classList.remove("is-started"); fragsBuilt = false; touched = false; stageKey = ""; setStage({ ...FULL }, "full", 0, .01); });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hitP = new THREE.Vector3();
  const toPlane = (e) => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.ray.intersectPlane(plane0, hitP) ? hitP.clone() : null; };
  // «алтыншы қол»: соңғы бөлікті сүйреп ортаға апару (не «Орнату» батырмасы)
  const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1), hitY = new THREE.Vector3(); let pieceDrag = false;
  const toY = (e) => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.ray.intersectPlane(planeY, hitY) ? hitY.clone() : null; };
  function place() { if (placed) return; placed = true; placeAt = { t: clock.elapsedTime, from: piece.position.clone() }; $(".um-hand").classList.remove("is-on"); }
  $(".um-place").addEventListener("click", place);
  cv.addEventListener("pointerdown", (e) => { if (placed || pt < T.hand) return; const p = toY(e); if (p && p.distanceTo(piece.position) < 6) { pieceDrag = true; cv.setPointerCapture(e.pointerId); root.classList.add("is-grab"); } }, true);
  cv.addEventListener("pointermove", (e) => { if (!pieceDrag) return; const p = toY(e); if (p) piecePos.set(p.x, -1, p.z); if (piecePos.distanceTo(CENTER) < 2.2) { pieceDrag = false; root.classList.remove("is-grab"); place(); } });
  const endPiece = () => { if (!pieceDrag) return; pieceDrag = false; root.classList.remove("is-grab"); if (piecePos.distanceTo(CENTER) < 4) place(); }; cv.addEventListener("pointerup", endPiece); cv.addEventListener("pointercancel", endPiece);
  cv.addEventListener("pointerdown", (e) => { if (!frag.visible || pt > T.shan) return; const p = toPlane(e); if (p) { dragging = p; touched = true; cv.setPointerCapture(e.pointerId); } });
  cv.addEventListener("pointermove", (e) => { if (!dragging) return; const p = toPlane(e); if (!p) return; push(p, p.clone().sub(dragging), 1); dragging = p; });
  const endDrag = () => { dragging = null; }; cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  function push(p, d, k) { for (let i = 0; i < NF; i++) { const dx = home[i * 3] + off[i * 3] - p.x, dy = home[i * 3 + 1] + off[i * 3 + 1] - p.y, f = Math.exp(-(dx * dx + dy * dy) / 5) * k; vel[i * 3] += d.x * f * 9; vel[i * 3 + 1] += d.y * f * 9; vel[i * 3 + 2] += (Math.abs(d.x) + Math.abs(d.y)) * f * 6; } }
  function buildFrags() { comp.x.clearRect(0, 0, FW, FH); layers.forEach((l) => comp.x.drawImage(l.A.c, 0, 0, FW, FH)); compTex.needsUpdate = true; off.fill(0); vel.fill(0); fragsBuilt = true; }

  const m4 = new THREE.Matrix4(), qI = new THREE.Quaternion(), qq = new THREE.Quaternion(), pv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), lookV = new THREE.Vector3();
  layout(); frameGroup(); addEventListener("resize", frameGroup);
  let lastDraw = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(.05, clock.getDelta()), now = clock.elapsedTime, kk = 1 - Math.exp(-dt * 4);
    if (!started && onStage) { posterT += dt; if (posterT > 6) begin(); }
    if (started && onStage && !paused) pt = Math.min(T.end, pt + dt);
    if (!placed && pt > P1) pt = P1;
    const t = pt;
    px += (tx - px) * (1 - Math.exp(-dt * 2)); py += (ty - py) * (1 - Math.exp(-dt * 2));
    // сайт: толық → бос (I) → адамдар қайта құрғаннан кейін қабат-қабатымен оралады (IV)
    let want = FULL, key = "full", stag = .12;
    if (t >= T.strip && t < T.col + 1.5) { want = EMPTY; key = "empty"; stag = .55; }
    else if (t >= T.col + 1.5) { key = "full2"; stag = .45; }
    if (key !== stageKey) setStage(want, key, stag, key === "full2" ? 1.4 : 1.1);
    layers.forEach((l) => { if (l.fade) { const k = clamp((now - l.fade.t0) / l.fade.dur); l.B.m.material.opacity = eio(k); l.A.m.material.opacity = 1 - eio(k); if (k >= 1) swap(l); } });
    const gap = GAP * eio(seg(t, T.brk, T.brk + 2.4)) * (1 - eio(seg(t, T.col + 2, T.col + 4.5))), lift = Math.sin(now * .6) * .06;
    const glassA = seg(t, 13.5, 16.5) * (1 - seg(t, T.col + 3, T.col + 4.5));
    const fragOn = t >= T.col + 4.8 && t < T.live + .4;
    const siteA = seg(t, 3.6, 5.6);
    layers.forEach((l) => { l.z = (l.L - 2) * gap; l.g.position.set(0, lift * (l.L - 2) * .3, l.z); l.g.rotation.y = gap * .02 * (l.L - 2); l.edge.material.opacity = glassA * .45; l.glass.material.opacity = glassA * .018; l.g.visible = !fragOn && siteA > .01; const dimF = siteA * (1 - .25 * seg(t, T.fin, T.fin + 1.5)); l.A.m.material.color.setScalar(dimF); l.B.m.material.color.setScalar(dimF); });
    const tg = eo(seg(t, T.brk + .6, T.brk + 3.6)), tOut = 1 - seg(t, T.strip - .5, T.strip + 1.5); thrMat.opacity = .38 * tg * tOut; threads.visible = thrMat.opacity > .01;
    if (threads.visible) { const z3 = layers[3].z; thrSeed.forEach((s, i) => { const k = clamp((tg - s.d) / (1 - s.d)); thr.set([s.x, s.y, z3, s.x + s.dx * k, s.y + s.dy * k + Math.sin(now + i) * .05 * k, z3 + s.dz * k], i * 6); }); thrGeo.attributes.position.needsUpdate = true; }
    // постер
    const pA = 1 - seg(t, 1.6, 3.4);
    poster.forEach((m, i) => { m.material.opacity = (started ? 1 : eo(posterT * 1.2 - i * .3)) * (1 - seg(cam.position.z, m.position.z + 3, m.position.z + .5)); m.visible = m.material.opacity > .01; });
    { const into = 1 - seg(cam.position.z, PHZ + 15, PHZ + 7), fadeIn = started ? 1 : eo(posterT * .7 - .2), tilt = eio(seg(t, .3, 3.2));
      photoFrame.rotation.set(-tilt * .05, tilt * .07 + px * .02, 0);   // 3-4° - тек рамкамен бірге, адамдардың пішіні өзгермейді
      photoBg.material.opacity = fadeIn * into; pfLine.opacity = .35 * fadeIn * into; photoFrame.visible = photoBg.material.opacity > .01; }
    ring.rotation.z = now * .02; lineMat.opacity = .32 * pA * (started ? 1 : eo(posterT * .6 - .3)); ring.visible = lineMat.opacity > .01;
    // кейіпкерлер
    people.forEach((P) => {
      const s0 = T.act + P.i * T.per, u = t - s0, act = u > -3 && u < T.per + 1;
      P.portrait.visible = P.key.visible = P.grp.visible = act;
      if (!act) return;
      const lit = eo(seg(u, 1.4, 4)) * (1 - seg(u, T.per - 1.2, T.per + .6)), dim = seg(u, -2.5, 1) * (1 - seg(u, T.per - .4, T.per + 1));
      P.portrait.material.color.setScalar(.16 + .84 * lit); P.portrait.material.opacity = dim;
      P.portrait.position.x = P.x + (mobile ? 0 : px * .15); P.portrait.position.y = Math.sin(now * .45) * .03;
      P.key.material.opacity = .16 * lit;
      const reveal = eo(seg(u, .6, 2.2)), mixv = eio(seg(u, 4.6, 6.4)) * (mobile ? .28 : 1), brk = eio(seg(u, 9, 10.8));
      if (mixv > 0 && (P.archDrawn < 0 || (P.i === 3 && now - P.archDrawn > .14) || (P.i === 4 && now - P.archDrawn > .2))) { drawArch(P, now); P.archDrawn = now; }
      P.strips.forEach((S, k) => { S.mat.uniforms.reveal.value = reveal * 1.02; S.mat.uniforms.mixv.value = mixv; S.mat.uniforms.op.value = (1 - seg(u, 9.6, 10.9)) * .94; S.mesh.position.set(S.dir * brk * (1.2 + S.rnd * 2.4), S.y0 + (k - NAME_K / 2) * brk * .12, -brk * (2 + S.rnd * 9)); S.mesh.rotation.y = S.dir * brk * .25; });
      P.grp.position.x = (mobile ? P.x : P.x - 2.4) + px * (mobile ? .1 : .5);
    });
    { const u = clamp((t - T.act + 1) / (T.col - T.act), 0, 1), pos = thread.geometry.attributes.position, n = pos.count;
      for (let i = 0; i < n; i++) { const p = threadCurve.getPoint(Math.min(u, i / (n - 1)) * .86 + .02); pos.setXYZ(i, p.x, p.y, p.z); }
      pos.needsUpdate = true; thread.material.opacity = .55 * seg(t, T.act - 1, T.act + 1) * (1 - seg(t, T.col - .5, T.col + 1)); thread.visible = thread.material.opacity > .01; }
    // IV: бөлшектер, тарту; V: шаңырақ
    if (fragOn && !fragsBuilt) buildFrags();
    if (!fragOn && t < T.col) fragsBuilt = false;
    frag.visible = fragOn;
    if (fragOn) {
      if (!touched && t > T.col + 7 && t < T.col + 7.1) push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(.5, .25, 0), 1.2);
      const flyF = t >= T.shan ? (t - T.shan) / 5.5 : 0, flyR = t >= T.back ? (t - T.back) / 4 : 0;
      const glow = seg(t, T.shan + 3, T.shan + 6) * .12 * (1 - seg(t, P1, P1 + .3)) + seg(t, P1, P1 + .4) * (1 - seg(t, P1 + .8, T.back + 1.2)) * .55;
      const opV = t < T.void ? 1 : t < T.hand - .5 ? 1 - seg(t, T.void, T.void + 1.6) : seg(t, T.hand - .5, T.hand + .8);
      fMat.uniforms.op.value = seg(t, T.col + 4.8, T.col + 5) * opV * (1 - seg(t, T.live, T.live + .4)); fMat.uniforms.glow.value = glow;
      const sv = new THREE.Vector3();
      for (let i = 0; i < NF; i++) {
        const j = i * 3;
        vel[j] += (-off[j] * 14 - vel[j] * 3.2) * dt; vel[j + 1] += (-off[j + 1] * 14 - vel[j + 1] * 3.2) * dt; vel[j + 2] += (-off[j + 2] * 14 - vel[j + 2] * 3.2) * dt;
        off[j] += vel[j] * dt; off[j + 1] += vel[j + 1] * dt; off[j + 2] += vel[j + 2] * dt;
        let k = eio(clamp((flyF - delay[i]) / .62)), sc = 1;
        if (flyR > 0) k = 1 - eio(clamp((flyR - (.38 - delay[i])) / .62));
        const arc = Math.sin(k * Math.PI) * 3.5;
        if (isBar[i] && t < P1 + .001 && flyR <= 0) {   // соңғы бөліктің бөлшектері: тұтас бөлікке жиналып, ішіне сіңеді
          pv.set(lerp(home[j] + off[j], piece.position.x, k), lerp(home[j + 1] + off[j + 1], piece.position.y, k) + arc, lerp(home[j + 2] + off[j + 2], piece.position.z, k)); sc = 1 - k;
        } else {
          if (isBar[i] && flyR <= 0) sc = seg(t, P1 + .2, P1 + .8);
          pv.set(lerp(home[j] + off[j], tgt[j], k), lerp(home[j + 1] + off[j + 1], tgt[j + 1], k) + arc, lerp(home[j + 2] + off[j + 2], tgt[j + 2], k));
        }
        qq.slerpQuaternions(qI, tq[i], k); sv.setScalar(Math.max(1e-3, sc)); m4.compose(pv, qq, sv); frag.setMatrixAt(i, m4);
      }
      frag.instanceMatrix.needsUpdate = true;
    }
    gems.forEach((g, i) => { g.material.opacity = seg(t, T.shan + 4.5 + i * .25, T.shan + 6 + i * .25) * (1 - seg(t, T.void, T.void + 1.2)) * (.55 + Math.sin(now * 2 + i) * .25); });
    const sA = seg(t, P1 + .15, P1 + .5) * (1 - seg(t, P1 + .6, T.back + 1)); sun.material.opacity = sA; sun.scale.setScalar(2 + sA * 30);
    const pieceA = (seg(t, T.shan + 3.5, T.shan + 5.5) * (1 - seg(t, T.void, T.void + 1.2)) + seg(t, T.hand - .3, T.hand + .8)) * (placed ? 1 - seg(t, P1 + .3, P1 + .9) : 1);
    piece.visible = pieceA > .01; piece.userData.mat.opacity = pieceA * .9; pieceGlow.material.opacity = pieceA * (.22 + Math.sin(now * 2.2) * .08);
    if (placed && placeAt) { const k = eo(clamp((now - placeAt.t) / .6)); piece.position.lerpVectors(placeAt.from, CENTER, k); piece.scale.setScalar(lerp(.62, 1, k)); piece.rotation.y *= 1 - k; }
    else { piece.position.copy(piecePos); if (!pieceDrag) piece.position.y += Math.sin(now * 1.4) * .15; piece.scale.setScalar(.62); piece.rotation.y = Math.sin(now * .5) * .2; }
    dust.rotation.y = now * .006; dust.material.opacity = .3 * (1 - seg(t, T.void, T.void + 1.5) * (1 - seg(t, T.hand, T.hand + 1)));
    // камера (постерде - тінтуірмен сәл қозғалады)
    const u = camU(t); posC.getPoint(u, cam.position); lookC.getPoint(u, lookV);
    const par = (1 - seg(t, 0, 2)) * (mobile ? .4 : 1.6); cam.position.x += px * par; cam.position.y -= py * par * .6;
    cam.lookAt(lookV);
    // HTML
    const live = (t > 5 && t < T.brk) || t > T.live; site.classList.toggle("is-on", live);
    if (live) { const a = new THREE.Vector3(-UW / 2, UH / 2, 0).project(cam), b = new THREE.Vector3(UW / 2, -UH / 2, 0).project(cam), w = stage.clientWidth, h = stage.clientHeight; site.style.cssText = `left:${(a.x + 1) / 2 * w}px;top:${(1 - a.y) / 2 * h}px;width:${(b.x - a.x) / 2 * w}px;height:${(a.y - b.y) / 2 * h}px`; }
    q.classList.toggle("is-on", t > T.q && t < T.brk + 2.2);
    hint.classList.toggle("is-on", fragOn && t < T.shan - .5 && !touched);
    caption(t); person(t);
    storyEl.classList.toggle("is-on", started && t > T.story && t < 5.6);
    groupEl.classList.toggle("is-on", t > T.group && t < T.hand - .6);
    chs.forEach((a, i) => a.classList.toggle("is-on", t >= CHAPTERS[i][0] && t < (CHAPTERS[i + 1] ? CHAPTERS[i + 1][0] : 1e9)));
    voidEl.classList.toggle("is-on", t > T.void + .8 && t < T.faces - .2);
    facesEl.classList.toggle("is-on", t > T.faces + .8 && t < T.group - .2);
    handEl.classList.toggle("is-on", t > T.hand + .4 && !placed);
    stage.style.setProperty("--fin", seg(t, T.fin, T.fin + 1).toFixed(3));
    fin.classList.toggle("is-on", t >= T.fin); fin.classList.toggle("is-end", t >= T.fin + 4);
    stage.classList.toggle("is-end", t >= T.fin);
    root.dataset.act = !started ? "0" : t < T.act ? "1" : t < T.col ? "3" : t < T.shan ? "4" : t < T.void ? "5" : t < T.hand ? "6" : !placed ? "7" : "8";
    if (bar0) bar0.style.transform = `scaleX(${(t / T.end).toFixed(4)})`;
    renderer.render(scene, cam);
    void lastDraw;
  }
  frame();
}
