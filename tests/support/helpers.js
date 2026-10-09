// Ортақ көмекшілер: беттер тізімі, Pyodide-ті жергілікті файлдан беру, Supabase мок-маршруты.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const PAGES = [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")),
  ...fs.readdirSync(path.join(ROOT, "lectures")).filter((f) => f.endsWith(".html")).map((f) => "lectures/" + f),
  // Қосымша курстар: <код>/index.html және <код>/lectures/*.html
  ...["python"].filter((c) => fs.existsSync(path.join(ROOT, c))).flatMap((c) => [
    c + "/index.html",
    ...fs.readdirSync(path.join(ROOT, c, "lectures")).filter((f) => f.endsWith(".html")).map((f) => `${c}/lectures/${f}`),
  ]),
].sort();

// Pyodide CDN-і → tests/node_modules/pyodide (желісіз, тұрақты). Бумада жоқ файл болса — желіге жібереміз.
const PYDIR = path.join(__dirname, "../node_modules/pyodide/");
async function routePyodide(context) {
  await context.route(/cdn\.jsdelivr\.net\/npm\/pyodide@0\.26\.4\/full\/([^?]*)/, async (route) => {
    const f = route.request().url().match(/full\/([^?]*)/)[1];
    const file = path.join(PYDIR, f);
    if (!fs.existsSync(file)) return route.continue();
    const type = f.endsWith(".wasm") ? "application/wasm" : /\.m?js$/.test(f) ? "application/javascript" : f.endsWith(".json") ? "application/json" : "application/octet-stream";
    await route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { "content-type": type, "access-control-allow-origin": "*" } });
  });
}

// Сыртқы қаріптерді тоқтатамыз: тест жылдамырақ және желіге тәуелсіз.
// highlight.js (cdnjs) - жергілікті npm бумасынан: тесттер CI-дегідей (код бояуымен) және желісіз жүрсін.
const HLDIR = path.join(__dirname, "../node_modules/@highlightjs/cdn-assets/");
async function blockFonts(context) {
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, body: "", headers: { "content-type": "text/css" } }));
  await context.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/highlight\.js\/11\.9\.0\/(.*)$/, (r) => {
    const f = path.join(HLDIR, r.request().url().match(/11\.9\.0\/([^?]*)/)[1]);
    if (!fs.existsSync(f)) return r.continue();
    return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": f.endsWith(".css") ? "text/css" : "application/javascript", "access-control-allow-origin": "*" } });
  });
}

// Supabase → жергілікті PostgREST-мок (support/rest_mock.py), CLOUD_MOCK орнатылғанда ғана
async function routeSupabase(context, mock) {
  await context.route(/fuzkjjfpknnpauykzfip\.supabase\.co\/(.*)$/, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    const url = req.url().replace(/^https:\/\/fuzkjjfpknnpauykzfip\.supabase\.co/, mock);
    const r = await fetch(url, { method: "POST", headers: { apikey: req.headers()["apikey"] || "", "content-type": "application/json" }, body: req.postData() });
    await route.fulfill({ status: r.status, body: await r.text(), headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
  });
}

function collectErrors(page) {
  const errs = [];
  page.on("pageerror", (e) => errs.push("JS: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/net::|Failed to load resource|ERR_|favicon|Blocked autofocusing/.test(m.text())) errs.push("console: " + m.text()); });
  page.on("dialog", (d) => d.accept());
  return errs;
}

module.exports = { ROOT, PAGES, routePyodide, blockFonts, routeSupabase, collectErrors };
