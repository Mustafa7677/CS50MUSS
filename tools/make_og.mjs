// Әр лекцияға жеке Open Graph суреті (1200×630 JPEG): әлеуметтік желіде бөліскенде көрінеді.
// Іске қосу: cd tests && node ../tools/make_og.mjs   (Playwright tests/node_modules ішінде)
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "tests/package.json"));
const { chromium } = require("@playwright/test");

const src = fs.readFileSync(path.join(ROOT, "assets/data/lectures.js"), "utf8");
const lectures = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
// tools/build.py HEAD_STYLE-пен бірдей түстер
const COLOR = { "week-0": "#f2b705", "week-1": "#2b7bd6", "week-2": "#2b7bd6", "week-3": "#2b7bd6", "week-4": "#2b7bd6", "week-5": "#2b7bd6",
  "week-6": "#2fa36b", "week-7": "#8b5cf6", ai: "#e0457b", "week-8": "#f08a24", "week-9": "#f08a24", "week-10": "#c99500" };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ORN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><g fill='none' stroke='white' stroke-opacity='.13' stroke-width='2' stroke-linecap='round'><path d='M24 44 V26'/><path d='M24 26 C24 14 12 8 7 14 C3 19 9 25 13 21 C15.5 18.5 13 15.5 11 17'/><path d='M24 26 C24 14 36 8 41 14 C45 19 39 25 35 21 C32.5 18.5 35 15.5 37 17'/><path d='M24 36 C20 32 15 33 15 37 M24 36 C28 32 33 33 33 37'/><path d='M24 4 L28 9 L24 14 L20 9 Z'/></g></svg>")`;

function page(l) {
  const c = COLOR[l.id] || "#00a3c4";
  const big = l.id === "ai" ? "AI" : l.id.replace("week-", "");
  const topics = l.topics.slice(0, 4).map((t) => `<span>${esc(t.t)}</span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0}
    .og{width:1200px;height:630px;position:relative;overflow:hidden;color:#fff;font-family:Inter,"Segoe UI",Arial,sans-serif;
      background:${ORN} 0 0/64px 64px, radial-gradient(circle at 0% 100%, ${c}cc, transparent 60%), radial-gradient(circle at 100% 0%, rgba(242,183,5,.35), transparent 45%), linear-gradient(135deg, #0a5f86, #0a2f5a 75%)}
    .big{position:absolute;right:40px;bottom:-70px;font-size:${big.length > 1 ? 400 : 470}px;font-weight:900;line-height:1;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:4px rgba(255,255,255,.28)}
    .brand{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800}
    .brand i{display:inline-block;width:14px;height:44px;border-radius:7px;background:${c}}
    .brand b{color:#f2b705}
    .num{position:absolute;left:72px;top:150px;padding:8px 22px;border-radius:999px;background:#f2b705;color:#14213d;font-size:28px;font-weight:800}
    h1{position:absolute;left:72px;top:205px;width:760px;margin:0;font-size:${l.title.length > 28 ? 64 : 84}px;line-height:1.05;font-weight:900;text-shadow:0 4px 24px rgba(0,0,0,.25)}
    .topics{position:absolute;left:72px;bottom:104px;width:800px;display:flex;flex-wrap:wrap;gap:10px}
    .topics span{padding:8px 16px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);font-size:22px;font-weight:600}
    .url{position:absolute;left:72px;bottom:40px;font-size:22px;opacity:.8}
    .bar{position:absolute;left:0;right:0;bottom:0;height:12px;background:linear-gradient(90deg,#f2b705,${c},#f2b705)}
  </style></head><body><div class="og"><div class="big">${big}</div>
    <div class="brand"><i></i>CS50 <b>қазақша</b></div>
    <div class="num">${esc(l.num)} · ${l.minutes} мин</div>
    <h1>${esc(l.title)}</h1>
    <div class="topics">${topics}</div>
    <div class="url">mustafa7677.github.io/CS50MUSS</div><div class="bar"></div></div></body></html>`;
}

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const l of lectures) {
  await p.setContent(page(l));
  const out = path.join(ROOT, "assets/img/og", `${l.id}.jpg`);
  await p.screenshot({ path: out, type: "jpeg", quality: 82 });
  console.log(out.replace(ROOT + "/", ""), Math.round(fs.statSync(out).size / 1024) + " KB");
}
await browser.close();
