/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
   «Жасалмаған сайт» (team/3d.html) - бір үздіксіз камера кадры, өзі ойнайды (~100 с), WebGL: three.js r160 (MIT, assets/vendor/three).
     I   Беті       - ауада AO17 сайты тұр (сілтемелері шынайы); «адамдарды алып тастасақ ше?»; сайт қабаттарға ажырайды,
                      код жолдары алтын жіп болып тартылады, камера қабаттардың жанынан, сосын арасынан өтеді; сайт бос шыныға айналады;
     II  Авторлар   - бес шынайы портрет бір кеңістікте, әртүрлі тереңдікте;
     III Еңбек      - әр адамға жақындағанда құрылым сол адамның үлесімен қайта жасалады:
                      Sagid - қаңқа мен байланыстар, Gulzat - түс пен әріп, Dastan - мазмұн, Magzhan - қозғалыс, Merey - телефон;
     IV  Құлау      - сайт мыңдаған бөлшекке айналады, оны тінтуірмен не саусақпен тартуға болады, бөлшектер қайта жиналады;
     V   Шаңырақ    - камера көтеріледі, бөлшектер алып шаңыраққа бірігеді;
     VI  Ашылу      - шаңырақтың ортасынан жарық, виртуал әлем жоғалып, шынайы топ фотосы ашылады. Дыбыс жоқ.
   Барлық пішін кодпен құрылады; сайттың көрінісі canvas-та қолмен сызылады (DOM-ның суреті емес). Қозғалыс азайса не WebGL жоқ болса - титрлер. */
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

// ---------- уақыт сызығы (секунд) ----------
const T = { q: 2.2, brk: 5.5, strip: 13, auth: 18.5, act: 22, per: 9.5, col: 69.5, shan: 78, rev: 88, fin: 92, end: 100 };
const FW = 1280, FH = 800, UW = 16, UH = 10, GAP = 1.4;
const GOLD = "#d9b468", CREAM = "#efe6d3";
const F = { u: "Unbounded, sans-serif", s: "'PT Serif', Georgia, serif", i: "Inter, system-ui, sans-serif", m: "'JetBrains Mono', ui-monospace, monospace" };

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
  const M = D.members, mobile = innerWidth < 760, R = mobile ? 1 : 1.25;
  const BY = Object.fromEntries(M.map((m) => [m.slug, m]));
  const ORDER = ["sagid", "gulzat", "dastan", "magzhan", "merey"];   // құрылыстың реті: қаңқа → дизайн → мазмұн → қозғалыс → телефон
  const PLACE = { gulzat: [-11, -.3, 3], dastan: [-6, .35, 7], sagid: [0, 0, 9.5], magzhan: [6, -.2, 6.5], merey: [11, .35, 2.8] };
  const cv = $(".um-cv"), stage = $(".um-stage");
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !mobile, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x050403, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x050403, 30, 80);
  const cam = new THREE.PerspectiveCamera(50, 1, .1, 200);
  try { await Promise.all([`800 27px Unbounded`, `700 70px "PT Serif"`, `400 19px Inter`, `600 17px Inter`, `500 14px "JetBrains Mono"`].map((f) => document.fonts.load(f))); } catch (e) { /* әдепкі қаріп */ }

  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,250,232,1)"); gr.addColorStop(.3, "rgba(255,226,170,.65)"); gr.addColorStop(1, "rgba(255,210,140,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const mkCanvas = (w, h, r) => { const c = document.createElement("canvas"); c.width = Math.round(w * r); c.height = Math.round(h * r); const x = c.getContext("2d"); x.scale(r, r); return { c, x }; };
  const mkTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  // ---------- қабаттар: әрқайсысында екі бет (A - қазіргі, B - келесі күй), шыны жиегі ----------
  const FULL = { struct: 1, design: 1, content: 1, interact: 0 }, EMPTY = { struct: 0, design: 0, content: 0, interact: 0 };
  const layers = [0, 1, 2, 3, 4].map((L) => {
    const g = new THREE.Group(); scene.add(g);
    const mk = () => { const cc = mkCanvas(FW, FH, R), tex = mkTex(cc.c), m = new THREE.Mesh(new THREE.PlaneGeometry(UW, UH), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = L * 3; g.add(m); return { ...cc, tex, m }; };
    const A = mk(), B = mk(); B.m.material.opacity = 0; B.m.renderOrder = L * 3 + 1;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(UW, UH, .05)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 })); g.add(edge);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(UW, UH), new THREE.MeshBasicMaterial({ color: 0xd9b468, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); glass.position.z = -.01; g.add(glass);
    drawLayer(A.x, L, FULL, 0); A.tex.needsUpdate = true;
    return { L, g, A, B, edge, glass, fade: null, z: 0 };
  });
  let stageKey = "full", S = { ...FULL };
  function setStage(next, key, stagger = .12, dur = 1.1) {
    if (key === stageKey) return; stageKey = key; S = next;
    const now = clock.elapsedTime;
    layers.forEach((l) => { if (l.fade) { swap(l); } drawLayer(l.B.x, l.L, S, now); l.B.tex.needsUpdate = true; l.fade = { t0: now + l.L * stagger, dur }; });
  }
  function swap(l) { const a = l.A; l.A = l.B; l.B = a; l.A.m.material.opacity = 1; l.B.m.material.opacity = 0; l.fade = null; }

  // ---------- алтын жіптер: код жолдары тартылады (I) және элементтер арасындағы байланыс (III, Sagid) ----------
  const W2 = (x, y) => [(x / FW - .5) * UW, -(y / FH - .5) * UH];
  const NTH = mobile ? 36 : 70, thr = new Float32Array(NTH * 6), thrSeed = [];
  for (let i = 0; i < NTH; i++) { const li = i % CODE.length, [x, y] = W2(812 + Math.random() * 300, 400 + li * 21 + (Math.random() - .5) * 6); thrSeed.push({ x, y, dx: (Math.random() - .5) * 6, dy: (Math.random() - .5) * 4, dz: -(8 + Math.random() * 16), d: Math.random() * .5 }); }
  const thrGeo = new THREE.BufferGeometry(); thrGeo.setAttribute("position", new THREE.BufferAttribute(thr, 3));
  const thrMat = new THREE.LineBasicMaterial({ color: 0xe8c77e, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const threads = new THREE.LineSegments(thrGeo, thrMat); scene.add(threads);
  const LINKS = [[2, 3], [2, 5], [5, 6], [6, 7], [7, 8], [7, 9], [9, 11], [8, 10], [10, 11], [4, 5], [3, 10], [1, 2], [0, 1], [4, 10]];
  const cen = (i) => { const e = EL[i], [x, y] = W2(e.x + e.w / 2, e.y + e.h / 2); return [x, y, e.L]; };
  const arch = new Float32Array(LINKS.length * 6), archGeo = new THREE.BufferGeometry(); archGeo.setAttribute("position", new THREE.BufferAttribute(arch, 3));
  const archMat = new THREE.LineBasicMaterial({ color: 0xd9b468, transparent: true, opacity: 0, depthWrite: false });
  const archL = new THREE.LineSegments(archGeo, archMat); scene.add(archL);
  const nodes = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: dot, size: .55, color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  nodes.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(EL.length * 3), 3)); scene.add(nodes);

  // ---------- портреттер: шынайы фото, жиегі қараңғыға сіңеді (карточка емес) ----------
  const vig = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 320; const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 256, 320); const g = x.createRadialGradient(128, 128, 30, 128, 140, 150); g.addColorStop(0, "#fff"); g.addColorStop(.62, "#fff"); g.addColorStop(1, "#000"); x.fillStyle = g; x.fillRect(0, 0, 256, 320); const b = x.createLinearGradient(0, 230, 0, 320); b.addColorStop(0, "rgba(0,0,0,0)"); b.addColorStop(1, "rgba(0,0,0,1)"); x.fillStyle = b; x.fillRect(0, 230, 256, 90); return new THREE.CanvasTexture(c); })();
  const loader = new THREE.TextureLoader();
  const ptex = await Promise.all(M.map((m) => new Promise((res) => loader.load(m.photo, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)))));
  const sx = mobile ? .55 : 1;
  const people = {};
  M.forEach((m, i) => {
    const [x, y, z] = PLACE[m.slug], mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.25), new THREE.MeshBasicMaterial({ map: ptex[i], alphaMap: vig, transparent: true, opacity: 0, depthWrite: false }));
    mesh.position.set(x * sx, y, z); mesh.rotation.y = -x * sx * .025; mesh.renderOrder = 30; scene.add(mesh);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(6, 7, 1); halo.position.set(x * sx, y + .3, z - .4); halo.renderOrder = 29; scene.add(halo);
    people[m.slug] = { mesh, halo, p: new THREE.Vector3(x * sx, y, z) };
  });

  // ---------- телефон (Merey) ----------
  const ph = mkCanvas(390, 844, mobile ? 1.4 : 2), phTex = mkTex(ph.c);
  const phone = new THREE.Group(); scene.add(phone); phone.renderOrder = 31;
  const phScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 9.1), new THREE.MeshBasicMaterial({ map: phTex, transparent: true, opacity: 0, depthWrite: false })); phone.add(phScreen);
  const bz = new THREE.Shape(); { const w = 2.3, h = 4.75, r = .5; bz.moveTo(-w + r, -h); bz.lineTo(w - r, -h); bz.quadraticCurveTo(w, -h, w, -h + r); bz.lineTo(w, h - r); bz.quadraticCurveTo(w, h, w - r, h); bz.lineTo(-w + r, h); bz.quadraticCurveTo(-w, h, -w, h - r); bz.lineTo(-w, -h + r); bz.quadraticCurveTo(-w, -h, -w + r, -h); }
  const bezel = new THREE.Line(new THREE.BufferGeometry().setFromPoints(bz.getPoints(48)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0 })); phone.add(bezel);
  const PH_HOME = new THREE.Vector3(mobile ? 4.4 : 8.1, mobile ? 1.6 : .4, mobile ? 4.4 : 3.6);

  // ---------- IV-V: сайттың бөлшектері (бір текстура, әр бөлшек өз үзіндісін көрсетеді) ----------
  const COLS = mobile ? 30 : 46, ROWS = mobile ? 19 : 29, NF = COLS * ROWS;
  const comp = mkCanvas(FW, FH, R), compTex = mkTex(comp.c);
  const fGeo = new THREE.BoxGeometry(UW / COLS * .96, UH / ROWS * .96, .05), uvr = new Float32Array(NF * 4);
  const fMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: compTex }, op: { value: 0 }, glow: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: "attribute vec4 uvr; varying vec2 vUv; void main(){ vUv = uvr.xy + uv * uvr.zw; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D map; uniform float op; uniform float glow; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); vec3 col = mix(c.rgb, vec3(.95, .78, .45), glow); float a = max(c.a, glow * .85); gl_FragColor = vec4(col, a * op);\n#include <colorspace_fragment>\n}",
  });
  const frag = new THREE.InstancedMesh(fGeo, fMat, NF); frag.frustumCulled = false; frag.visible = false; scene.add(frag);
  const home = new Float32Array(NF * 3), off = new Float32Array(NF * 3), vel = new Float32Array(NF * 3), tgt = new Float32Array(NF * 3), tq = [], delay = new Float32Array(NF);
  for (let r = 0, i = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) { uvr.set([c / COLS, 1 - (r + 1) / ROWS, 1 / COLS, 1 / ROWS], i * 4); home.set([(c + .5) / COLS * UW - UW / 2, UH / 2 - (r + .5) / ROWS * UH, 0], i * 3); delay[i] = Math.random() * .38; }
  fGeo.setAttribute("uvr", new THREE.InstancedBufferAttribute(uvr, 4));
  // шаңырақ: сыртқы шеңбер, ішкі шеңбер, төрт күлдіреуіш, 36 уық (көлденең жатады; камера жоғарыдан көреді)
  { const RS = 7.4, order = [...Array(NF).keys()].sort(() => Math.random() - .5), n1 = Math.floor(NF * .26), n2 = Math.floor(NF * .1), n3 = Math.floor(NF * .26), up = new THREE.Euler(-Math.PI / 2, 0, 0);
    order.forEach((idx, j) => { let x, y = -1, z, yaw = 0, pitch = -Math.PI / 2;
      if (j < n1) { const a = j / n1 * Math.PI * 2, rr2 = RS + (Math.random() - .5) * .5; x = Math.cos(a) * rr2; z = Math.sin(a) * rr2; yaw = -a; y += (Math.random() - .5) * .15; }
      else if (j < n1 + n2) { const a = (j - n1) / n2 * Math.PI * 2, rr2 = RS * .9; x = Math.cos(a) * rr2; z = Math.sin(a) * rr2; yaw = -a; }
      else if (j < n1 + n2 + n3) { const k = j - n1 - n2, bar = k % 4, f = (Math.floor(k / 4) / (n3 / 4)) * 2 - 1, d = [-.3, .3][bar % 2] * RS, h = Math.sqrt(RS * RS - d * d) * .97; if (bar < 2) { x = d; z = f * h; yaw = Math.PI / 2; } else { z = d; x = f * h; } y += .05; }
      else { const k = j - n1 - n2 - n3, u = k % 36, f = Math.floor(k / 36) / Math.ceil((NF - n1 - n2 - n3) / 36), a = u / 36 * Math.PI * 2, rr2 = RS * (1.04 + f * .95); x = Math.cos(a) * rr2; z = Math.sin(a) * rr2; y -= f * 3.2; yaw = -a; pitch = -Math.PI / 2 + .35; }
      tgt.set([x, y, z], idx * 3); tq[idx] = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, 0, yaw, "XZY")); void up; }); }
  const gems = [0, 1, 2, 3, 4].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: i % 2 ? 0xffd28a : 0xff9fa8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); const a = Math.PI / 2 + i / 5 * Math.PI * 2; s.position.set(Math.cos(a) * 7.4, -.8, Math.sin(a) * 7.4); s.scale.setScalar(1.6); scene.add(s); return s; });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xfff0cf, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sun.position.set(0, -9, 0); scene.add(sun);
  const dust = (() => { const n = mobile ? 300 : 700, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set([(Math.random() - .5) * 60, (Math.random() - .5) * 30, (Math.random() - .5) * 60], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: dot, size: .14, color: 0xf3d9a4, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts); return pts; })();

  // ---------- камера: бір үздіксіз кадр (Catmull-Rom; әр кілттің уақыты бар) ----------
  let keys = [], posC = null, lookC = null, Dd = 20;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight, asp = w / h; renderer.setSize(w, h, false);
    cam.aspect = asp; cam.fov = asp < .8 ? 68 : 50; cam.updateProjectionMatrix();
    const tn = Math.tan(cam.fov * Math.PI / 360); Dd = Math.max(UW / (.86 * 2 * tn * asp), UH / (.7 * 2 * tn));
    const V = (x, y, z) => new THREE.Vector3(x, y, z), K = [];
    K.push([0, V(0, 0, Dd), V(0, 0, 0)], [T.brk, V(0, .2, Dd * .93), V(0, 0, 0)], [8.5, V(Dd * .62, 1.6, Dd * .5), V(0, 0, 0)], [11.2, V(Dd * .78, 1.3, 1.2), V(0, 0, .7)],
      [13.4, V(12, .4, .7), V(0, .1, .7)], [15.6, V(-3, .2, .7), V(-14, 0, .7)], [17.6, V(-13 * sx, 1.8, 7), V(-5 * sx, 0, 2)], [20.5, V(0, mobile ? 8 : 5.5, mobile ? 36 : 26), V(0, 0, 3.5)]);
    ORDER.forEach((slug, i) => {
      const p = people[slug].p, s0 = T.act + i * T.per, sg = Math.sign(p.x);
      const cp = mobile ? V(p.x, p.y + 1.6, p.z + 8.2) : V(p.x + sg * 1.5, p.y + .5, p.z + 6), lk = mobile ? V(p.x * .85, p.y + 1.4, p.z - 6) : V(p.x * .6, p.y + .1, p.z - 7);
      if (!mobile && !sg) { cp.set(.6, p.y + .7, p.z + 6.4); lk.set(0, p.y + .4, p.z - 7); }
      K.push([s0 + 1.6, cp, lk], [s0 + T.per - 1.4, cp.clone().add(V(-sg * .35 - (sg ? 0 : .5), .12, -.5)), lk.clone().add(V(0, .05, 0))]);
    });
    K.push([T.col + 1.5, V(0, .3, Dd * 1.02), V(0, 0, 0)], [T.shan, V(0, .2, Dd), V(0, 0, 0)], [T.shan + 5.5, V(0, mobile ? 30 : 23, 9), V(0, -1, 0)], [T.rev - 1, V(0, mobile ? 26 : 19, .5), V(0, -1, 0)], [T.rev + 2.5, V(0, 6, .01), V(0, -9, 0)], [T.end, V(0, 5, .01), V(0, -9, 0)]);
    keys = K.map((k) => k[0]); posC = new THREE.CatmullRomCurve3(K.map((k) => k[1]), false, "centripetal"); lookC = new THREE.CatmullRomCurve3(K.map((k) => k[2]), false, "centripetal");
  }
  const camU = (t) => { let i = 0; while (i < keys.length - 2 && t > keys[i + 1]) i++; return (i + clamp((t - keys[i]) / (keys[i + 1] - keys[i]))) / (keys.length - 1); };
  addEventListener("resize", layout);

  // ---------- HTML қабаттары ----------
  const q = $(".um-q"), cap = $(".um-cap"), capK = $(".um-k"), capT = $(".um-t"), capD = $(".um-d"), hint = $(".um-hint"), site = $(".um-site"), bar0 = $(".um-bar i"), fin = $(".um-fin");
  const CAP = D.acts;   // [{from, to, k, t, d}]
  let capKey = "";
  function caption(t) {
    let c = CAP.find((a) => t >= a.from && t < a.to) || null, side = "";
    const pi = Math.floor((t - T.act) / T.per);
    if (t >= T.act && t < T.col && pi >= 0 && pi < 5) { const m = BY[ORDER[pi]]; c = { k: `III · Еңбек · ${pi + 1}/5`, t: m.name, d: `${m.role}. ${m.law}` }; side = mobile ? "" : (people[ORDER[pi]].p.x < 0 ? "r" : "l"); }
    const key = c ? c.t + side : "";
    if (key === capKey) return; capKey = key;
    cap.classList.remove("is-on");
    if (!c) return;
    setTimeout(() => { if (capKey !== key) return; capK.textContent = c.k; capT.textContent = c.t; capD.textContent = c.d; cap.dataset.side = side; cap.classList.add("is-on"); }, 380);
  }

  // ---------- басқару: өзі ойнайды; «Өткізу», тарту (IV), қайта көру ----------
  let pt = +((location.hash.match(/t=(\d+(?:\.\d+)?)/) || [])[1] || 0), onStage = true, idleT = 0, fragsBuilt = false, dragging = null, touched = false;
  const clock = new THREE.Clock();
  new IntersectionObserver((es) => { onStage = es[0].intersectionRatio > .35; }, { threshold: [0, .35, .7] }).observe(stage);
  const wake = () => { stage.classList.remove("is-idle"); clearTimeout(idleT); idleT = setTimeout(() => stage.classList.add("is-idle"), 2600); };
  ["pointermove", "pointerdown", "keydown"].forEach((ev) => addEventListener(ev, wake, { passive: true })); wake();
  $(".um-skip").addEventListener("click", () => { pt = Math.max(pt, T.rev - .5); });
  $(".um-replay").addEventListener("click", () => { pt = 0; fragsBuilt = false; touched = false; stageKey = ""; setStage({ ...FULL }, "full", 0, .01); });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hitP = new THREE.Vector3();
  const toPlane = (e) => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.ray.intersectPlane(plane0, hitP) ? hitP.clone() : null; };
  cv.addEventListener("pointerdown", (e) => { if (!frag.visible || pt > T.shan) return; const p = toPlane(e); if (p) { dragging = p; touched = true; cv.setPointerCapture(e.pointerId); } });
  cv.addEventListener("pointermove", (e) => { if (!dragging) return; const p = toPlane(e); if (!p) return; push(p, p.clone().sub(dragging), 1); dragging = p; });
  const endDrag = () => { dragging = null; }; cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  function push(p, d, k) { for (let i = 0; i < NF; i++) { const dx = home[i * 3] + off[i * 3] - p.x, dy = home[i * 3 + 1] + off[i * 3 + 1] - p.y, f = Math.exp(-(dx * dx + dy * dy) / 5) * k; vel[i * 3] += d.x * f * 9; vel[i * 3 + 1] += d.y * f * 9; vel[i * 3 + 2] += (Math.abs(d.x) + Math.abs(d.y)) * f * 6; } }
  function buildFrags() { comp.x.clearRect(0, 0, FW, FH); layers.forEach((l) => comp.x.drawImage(l.A.c, 0, 0, FW, FH)); compTex.needsUpdate = true; off.fill(0); vel.fill(0); fragsBuilt = true; }

  const m4 = new THREE.Matrix4(), qI = new THREE.Quaternion(), qq = new THREE.Quaternion(), pv = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), lookV = new THREE.Vector3();
  layout();
  let lastDraw = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(.05, clock.getDelta()), now = clock.elapsedTime;
    if (onStage && !document.hidden) pt = Math.min(T.end, pt + dt);
    const t = pt;
    // күй: толық → бос → бес адам қайта құрады → толық
    let want = FULL, key = "full", stag = .12;
    if (t >= T.strip && t < T.act + 3) { want = EMPTY; key = "empty"; stag = .55; }
    else if (t >= T.act + 3 && t < T.col) { const n = Math.floor((t - T.act - 3) / T.per) + 1; want = { struct: n >= 1 ? 1 : 0, design: n >= 2 ? 1 : 0, content: n >= 3 ? 1 : 0, interact: n >= 4 ? 1 : 0 }; key = "p" + Math.min(n, 4); stag = .2; }
    else if (t >= T.col) { want = { ...FULL, interact: 0 }; key = "full2"; }
    if (key !== stageKey && !(key === "full2" && stageKey === "p4")) setStage(want, key, stag);
    if (key === "full2" && stageKey === "p4") { stageKey = "full2"; S = { ...FULL }; }
    layers.forEach((l) => {
      if (l.fade) { const k = clamp((now - l.fade.t0) / l.fade.dur); l.B.m.material.opacity = eio(k); l.A.m.material.opacity = 1 - eio(k); if (k >= 1) swap(l); }
      else if (S.interact && now - lastDraw > .09 && l.L >= 2) { drawLayer(l.A.x, l.L, S, now); l.A.tex.needsUpdate = true; }
    });
    if (S.interact && now - lastDraw > .09) lastDraw = now;
    // қабаттардың арасы: I-де ажырайды, IV-те қайта жалпақ
    const gap = GAP * eio(seg(t, T.brk, T.brk + 2.4)) * (1 - eio(seg(t, T.col, T.col + 3))), lift = Math.sin(now * .6) * .06;
    const glassA = seg(t, 9, 12) * (1 - seg(t, T.col, T.col + 2.5));
    const fragOn = t >= T.col + 3.4 && t < T.rev + 3;
    layers.forEach((l) => { l.z = (l.L - 2) * gap; l.g.position.set(0, lift * (l.L - 2) * .3, l.z); l.g.rotation.y = gap * .02 * (l.L - 2); l.edge.material.opacity = glassA * .7; l.glass.material.opacity = glassA * .035; l.g.visible = !fragOn; });
    // алтын жіптер (I)
    const tg = eo(seg(t, T.brk + .6, T.brk + 3.6)), tOut = 1 - seg(t, T.strip - .5, T.strip + 1.5); thrMat.opacity = .5 * tg * tOut; threads.visible = thrMat.opacity > .01;
    if (threads.visible) { const z3 = layers[3].z; thrSeed.forEach((s, i) => { const k = clamp((tg - s.d) / (1 - s.d)); thr.set([s.x, s.y, z3, s.x + s.dx * k, s.y + s.dy * k + Math.sin(now + i) * .05 * k, z3 + s.dz * k], i * 6); }); thrGeo.attributes.position.needsUpdate = true; }
    // байланыс желісі (Sagid): элементтер арасындағы алтын сызықтар мен түйіндер
    const archA = seg(t, T.act + 2.6, T.act + 4.5) * (1 - seg(t, T.col - 1, T.col + 1)); archMat.opacity = archA * .8; nodes.material.opacity = archA; archL.visible = nodes.visible = archA > .01;
    if (archL.visible) { const grow = eo(seg(t, T.act + 2.6, T.act + 6)); LINKS.forEach(([a, b], i) => { const A = cen(a), B = cen(b), za = layers[A[2]].z + .03, zb = layers[B[2]].z + .03, k = clamp(grow * 1.6 - i / LINKS.length * .6); arch.set([A[0], A[1], za, lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(za, zb, k)], i * 6); }); archGeo.attributes.position.needsUpdate = true; const np = nodes.geometry.attributes.position; EL.forEach((e, i) => { const c = cen(i); np.setXYZ(i, c[0], c[1], layers[c[2]].z + .05); }); np.needsUpdate = true; }
    // портреттер
    const pA = seg(t, T.auth - 1.5, T.auth + 1.5) * (1 - seg(t, T.col - .5, T.col + 1.5));
    const cur = t >= T.act && t < T.col ? ORDER[Math.floor((t - T.act) / T.per)] : null;
    M.forEach((m) => { const P = people[m.slug], f = cur ? (cur === m.slug ? 1 : .32) : 1; const kk = 1 - Math.exp(-dt * 4); P.mesh.material.opacity += ((pA * f) - P.mesh.material.opacity) * kk; P.halo.material.opacity += ((pA * (cur === m.slug ? .28 : .06)) - P.halo.material.opacity) * kk; P.mesh.position.y = PLACE[m.slug][1] + Math.sin(now * .5 + P.p.x) * .05; });
    // телефон (Merey)
    const phA = seg(t, T.act + 4 * T.per + 2.5, T.act + 4 * T.per + 4.5) * (1 - seg(t, T.col, T.col + 1.5));
    phScreen.material.opacity = phA; phScreen.renderOrder = 31; bezel.renderOrder = 32; bezel.material.opacity = phA; phone.visible = phA > .01;
    if (phone.visible) { const k = eo(phA); phone.position.lerpVectors(new THREE.Vector3(UW / 2 - 2, 0, layers[2].z), PH_HOME, k); phone.rotation.y = -.22 * k; phone.scale.setScalar(.3 + (mobile ? .16 : .22) * k); if (now - (phone.userData.d || 0) > .1) { drawPhone(ph.x, now); phTex.needsUpdate = true; phone.userData.d = now; } }
    // IV: бөлшектер, тарту, V: шаңырақ
    if (fragOn && !fragsBuilt) buildFrags();
    if (!fragOn && t < T.col) fragsBuilt = false;
    frag.visible = fragOn;
    if (fragOn) {
      if (!touched && t > T.col + 6 && t < T.col + 6.1) push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(.5, .25, 0), 1.2);   // ешкім тартпаса - өзі бір «соғылады»
      const fly = t >= T.shan ? (t - T.shan) / 5.5 : 0, glow = seg(t, T.shan + 3, T.shan + 6) * .3 + seg(t, T.rev - 2, T.rev) * .5;
      fMat.uniforms.op.value = seg(t, T.col + 3.4, T.col + 3.6) * (1 - seg(t, T.rev + .5, T.rev + 2.6)); fMat.uniforms.glow.value = glow;
      for (let i = 0; i < NF; i++) {
        const j = i * 3;
        vel[j] += (-off[j] * 14 - vel[j] * 3.2) * dt; vel[j + 1] += (-off[j + 1] * 14 - vel[j + 1] * 3.2) * dt; vel[j + 2] += (-off[j + 2] * 14 - vel[j + 2] * 3.2) * dt;
        off[j] += vel[j] * dt; off[j + 1] += vel[j + 1] * dt; off[j + 2] += vel[j + 2] * dt;
        const k = eio(clamp((fly - delay[i]) / .62)), arc = Math.sin(k * Math.PI) * 3.5;
        pv.set(lerp(home[j] + off[j], tgt[j], k), lerp(home[j + 1] + off[j + 1], tgt[j + 1], k) + arc, lerp(home[j + 2] + off[j + 2], tgt[j + 2], k));
        qq.slerpQuaternions(qI, tq[i], k); m4.compose(pv, qq, one); frag.setMatrixAt(i, m4);
      }
      frag.instanceMatrix.needsUpdate = true;
    }
    gems.forEach((g, i) => { g.material.opacity = seg(t, T.shan + 4.5 + i * .25, T.shan + 6 + i * .25) * (1 - seg(t, T.rev, T.rev + 1.5)) * (.7 + Math.sin(now * 2 + i) * .3); });
    const sA = seg(t, T.rev - 2, T.rev + 2.6); sun.material.opacity = sA; sun.scale.setScalar(2 + eio(sA) * 40);
    dust.rotation.y = now * .01; dust.material.opacity = .35 * (1 - seg(t, T.rev, T.rev + 2));
    // камера
    const u = camU(t); posC.getPoint(u, cam.position); lookC.getPoint(u, lookV); cam.lookAt(lookV);
    // HTML: сайттың шынайы сілтемелері (I-дің басында), сұрақ, тақырыптар, фото, соңғы сөз
    const live = t < T.brk; site.classList.toggle("is-on", live);
    if (live) { const a = new THREE.Vector3(-UW / 2, UH / 2, 0).project(cam), b = new THREE.Vector3(UW / 2, -UH / 2, 0).project(cam), w = stage.clientWidth, h = stage.clientHeight; site.style.cssText = `left:${(a.x + 1) / 2 * w}px;top:${(1 - a.y) / 2 * h}px;width:${(b.x - a.x) / 2 * w}px;height:${(a.y - b.y) / 2 * h}px`; }
    q.classList.toggle("is-on", t > T.q && t < T.brk + 2.2);
    hint.classList.toggle("is-on", fragOn && t < T.shan - .5 && !touched);
    caption(t);
    stage.style.setProperty("--flash", (seg(t, T.rev + .6, T.rev + 2.2) * (1 - seg(t, T.rev + 2.6, T.rev + 4))).toFixed(3));
    stage.style.setProperty("--photo", seg(t, T.rev + 2.4, T.rev + 4).toFixed(3));
    stage.style.setProperty("--fin", seg(t, T.fin, T.fin + 1).toFixed(3));
    fin.classList.toggle("is-on", t >= T.fin); fin.classList.toggle("is-end", t >= T.end - 1.5);
    stage.classList.toggle("is-end", t >= T.fin);
    root.dataset.act = t < T.auth ? "1" : t < T.act ? "2" : t < T.col ? "3" : t < T.shan ? "4" : t < T.rev ? "5" : "6";
    if (bar0) bar0.style.transform = `scaleX(${(t / T.end).toFixed(4)})`;
    renderer.render(scene, cam);
  }
  frame();
}
