#!/usr/bin/env node
// Деректер бөлмесі (data room) генераторы. `node scripts/dataroom.mjs [--run-tests] [--json] [--no-audit] [--no-licenses] [--out <қалта>]`
// Нәтиже: out/dataroom/ (git-ке кірмейді). ТЕК репо/тесттен алынған фактілер; бизнес-сандар (нарық, табыс, баға) жоқ.
// Құпия (.env, кілт) ЕШҚАШАН кірмейді: құжаттар тек ақ тізімнен (docs/*.md, ../licensing/*.md) көшіріледі және жазар алдында құпия үлгілерге сканерленеді.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { join, dirname, relative, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const optVal = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const OUT = resolve(optVal("--out") || join(ROOT, "out", "dataroom"));
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "test-results", ".git", "playwright-report"]);

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/,
  /\b(?:postgres(?:ql)?):\/\/[^\s:@/]+:[^\s@/]+@/,
  /\b(?:AUTH_JWT_SECRET|SUPABASE_JWT_SECRET|SERVICE_ROLE_KEY|SMTP_PASS(?:WORD)?|API_KEY)\s*[=:]\s*['"]?[A-Za-z0-9_\-+/=]{16,}/,
];
export function hasSecret(text) { return SECRET_PATTERNS.some((r) => r.test(text)); }

function walk(dir, pred, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, acc); else if (pred(p)) acc.push(p);
  }
  return acc;
}
const lines = (f) => { const t = readFileSync(f, "utf8"); return t === "" ? 0 : t.split("\n").length - (t.endsWith("\n") ? 1 : 0); };
const sumLines = (files) => files.reduce((a, f) => a + lines(f), 0);
const git = (...a) => { try { return execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } };

// Статикалық тест санау: test(...) / it(...) шақырулары (describe/hook емес). Циклмен жасалған тесттер бір рет есептеледі.
const TEST_CALL = /^\s*(?:test|it)(?:\.(?:only|skip|fixme|slow))?\s*\(/gm;
function countTests(files) {
  return files.map((f) => ({ file: relative(ROOT, f), tests: (readFileSync(f, "utf8").match(TEST_CALL) || []).length }));
}

function mdTitle(f) { const m = readFileSync(f, "utf8").match(/^#\s+(.+)$/m); return m ? m[1].trim() : basename(f); }

function section(text, headingRe) {
  const ls = text.split("\n"); let start = -1;
  for (let i = 0; i < ls.length; i++) if (/^##\s/.test(ls[i]) && headingRe.test(ls[i])) { start = i + 1; break; }
  if (start < 0) return [];
  const out = [];
  for (let i = start; i < ls.length && !/^##\s/.test(ls[i]); i++) out.push(ls[i]);
  return out;
}
const bullets = (ls) => ls.filter((l) => /^(\d+\.|-)\s+/.test(l)).map((l) => l.replace(/^(\d+\.|-)\s+/, "").replace(/\*\*/g, "").trim().slice(0, 300));

function collectRisks() {
  const risks = [];
  const add = (source, heading, items) => items.forEach((t) => risks.push({ source, heading, text: t }));
  const inv = join(ROOT, "docs/INVESTOR.md"), sec = join(ROOT, "docs/SECURITY-AUDIT.md"), leg = join(ROOT, "../licensing/LEGAL-REVIEW.md");
  if (existsSync(inv)) add("docs/INVESTOR.md", "§6 Негізгі тәуекелдер", bullets(section(readFileSync(inv, "utf8"), /тәуекел/i)));
  if (existsSync(sec)) add("docs/SECURITY-AUDIT.md", "§5 Тексерілмеген аймақтар", bullets(section(readFileSync(sec, "utf8"), /тексерілмеген/i)));
  if (existsSync(leg)) {
    const t = readFileSync(leg, "utf8");
    const heads = t.split("\n").filter((l) => /^##\s+\d+\./.test(l)).map((l) => l.replace(/^##\s+/, "").trim());
    add("licensing/LEGAL-REVIEW.md", "Заңгер тексеретін тақырыптар", heads.filter((h) => !/Что сделано/i.test(h)));
  }
  return risks;
}

function lastKnownTests() {
  const f = join(ROOT, "docs/INVESTOR.md");
  const t = existsSync(f) ? readFileSync(f, "utf8") : "";
  const m = t.match(/(\d+)\s*E2E[^,]*,\s*(\d+)\s*дерекқор,\s*(\d+)\s*unit/);
  return {
    source: "docs/INVESTOR.md §2 (қолмен жазылған, соңғы жергілікті жүгіруден)",
    e2e: m ? +m[1] : null, db: m ? +m[2] : null, unit: m ? +m[3] : null,
    howToRefresh: ["npm run test:unit", "TEST_DATABASE_URL=... npm run test:db", "npx playwright test (production build + seed-demo, қараңыз docs/SECURITY-AUDIT.md §7)", "немесе: node scripts/dataroom.mjs --run-tests (unit + db)"],
  };
}

function runTests() {
  const res = { ran: true, unit: null, db: null };
  const parse = (out) => { const g = (k) => +((out.match(new RegExp(`^# ${k} (\\d+)`, "m")) || [])[1] ?? NaN); return { pass: g("pass"), fail: g("fail"), tests: g("tests") }; };
  const u = spawnSync("npm", ["run", "test:unit", "--silent"], { cwd: ROOT, encoding: "utf8", timeout: 600000 });
  res.unit = { ...parse((u.stdout || "") + (u.stderr || "")), exit: u.status };
  if (!process.env.TEST_DATABASE_URL) res.db = { skipped: "TEST_DATABASE_URL орнатылмаған (жеке тест дерекқоры керек)" };
  else { const d = spawnSync("npm", ["run", "test:db", "--silent"], { cwd: ROOT, encoding: "utf8", timeout: 900000 }); res.db = { ...parse((d.stdout || "") + (d.stderr || "")), exit: d.status }; }
  return res;
}

const BAD_LIC = /(^|[\s(])(A?GPL|LGPL|SSPL|CC-BY-NC|BUSL|Commons-Clause|EUPL|OSL)/i;
const isDual = (l) => /\bOR\b/i.test(l) && /(MIT|BSD|Apache|ISC)/i.test(l);
const UNCLEAR = /^(UNKNOWN|UNLICENSED|Custom:.*|SEE LICENSE.*)$/i;

async function licenseReport() {
  try {
    const require = createRequire(import.meta.url);
    const checker = require("license-checker-rseidelsohn");
    const data = await new Promise((res, rej) => checker.init({ start: ROOT, production: true, excludePrivatePackages: true }, (e, j) => (e ? rej(e) : res(j))));
    const pkgs = Object.entries(data).map(([id, v]) => ({ id, licenses: Array.isArray(v.licenses) ? v.licenses.join(" OR ") : String(v.licenses), repository: v.repository || null }));
    const counts = {};
    for (const p of pkgs) counts[p.licenses] = (counts[p.licenses] || 0) + 1;
    return {
      available: true, productionPackages: pkgs.length, byLicense: Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1])),
      copyleftWarnings: pkgs.filter((p) => BAD_LIC.test(p.licenses) && !isDual(p.licenses)),
      copyleftOrDualReview: pkgs.filter((p) => BAD_LIC.test(p.licenses) && isDual(p.licenses)),
      unclearLicenses: pkgs.filter((p) => UNCLEAR.test(p.licenses.trim())),
      packages: pkgs.sort((a, b) => a.id.localeCompare(b.id)),
    };
  } catch (e) { return { available: false, reason: String(e.message || e).slice(0, 200) }; }
}

function auditSummary() {
  const r = spawnSync("npm", ["audit", "--omit=dev", "--json"], { cwd: ROOT, encoding: "utf8", timeout: 60000 });
  try {
    const j = JSON.parse(r.stdout);
    if (j.error || !j.metadata) return { available: false, reason: "қолжетімсіз: " + String(j.error?.summary || j.error?.code || "желі жауабы жоқ").slice(0, 160) };
    return { available: true, vulnerabilities: j.metadata.vulnerabilities, dependencies: j.metadata.dependencies, note: "npm audit --omit=dev; жүгірген сәттегі базаға сай" };
  } catch { return { available: false, reason: "қолжетімсіз (желі жоқ немесе npm audit жауап бермеді)" }; }
}

export async function collectFacts(opts = {}) {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const srcFiles = walk(join(ROOT, "src"), (p) => /\.(tsx?|css)$/.test(p));
  const tsFiles = srcFiles.filter((p) => /\.tsx?$/.test(p));
  const migFiles = walk(join(ROOT, "db/migrations"), (p) => p.endsWith(".sql")).sort();
  const dbOther = walk(join(ROOT, "db"), (p) => /\.(sql|sh|mjs)$/.test(p) && !p.includes("/migrations/") && !p.includes("/tests/"));
  const unitF = walk(join(ROOT, "tests/unit"), (p) => /\.test\.mjs$/.test(p));
  const dbF = walk(join(ROOT, "db/tests"), (p) => /\.test\.mjs$/.test(p));
  const e2eF = walk(join(ROOT, "e2e"), (p) => /\.spec\.ts$/.test(p));
  const helperF = walk(join(ROOT, "db/tests"), (p) => !/\.test\.mjs$/.test(p) && p.endsWith(".mjs"));
  const u = countTests(unitF), d = countTests(dbF), e = countTests(e2eF);
  const sum = (a) => a.reduce((x, y) => x + y.tests, 0);
  const scriptsF = walk(join(ROOT, "scripts"), (p) => /\.(mjs|sh)$/.test(p));
  const docFiles = [
    ...walk(join(ROOT, "docs"), (p) => p.endsWith(".md")),
    ...["README.md", "NOTICE.md"].map((n) => join(ROOT, n)).filter(existsSync),
    ...walk(join(ROOT, "../licensing"), (p) => p.endsWith(".md")),
  ];
  const sha = git("rev-parse", "HEAD");
  const dirty = (git("status", "--porcelain") || "").split("\n").filter(Boolean).length;
  const facts = {
    generatedAt: new Date().toISOString(),
    note: "Бұл файлдағы барлық сан репо/тест/құрал шығысынан алынған. Нарық, клиент, табыс, баға, өсім туралы мәлімет ЖОҚ: олар гипотеза/толтырылмаған.",
    commit: { sha, short: sha ? sha.slice(0, 9) : null, date: git("log", "-1", "--format=%cI"), subject: git("log", "-1", "--format=%s"), commitsTotal: Number(git("rev-list", "--count", "HEAD")) || null, uncommittedChanges: dirty },
    code: {
      srcLines: sumLines(tsFiles), srcFiles: tsFiles.length, cssLines: sumLines(srcFiles.filter((p) => p.endsWith(".css"))),
      migrationLines: sumLines(migFiles), migrationCount: migFiles.length, migrations: migFiles.map((f) => basename(f)),
      dbToolingLines: sumLines(dbOther), scriptsLines: sumLines(scriptsF),
      testLines: sumLines([...unitF, ...dbF, ...e2eF, ...helperF]),
      lineCounting: "wc -l сияқты: жаңа жол таңбасы бойынша; бос жолдар қосылған",
    },
    tests: {
      method: "статикалық санау: test(...)/it(...) шақырулары; циклмен/параметрмен жасалатын тесттер бір рет есептеледі, сондықтан нақты жүгіру саны көп болуы мүмкін",
      staticCount: { unit: sum(u), db: sum(d), e2e: sum(e), total: sum(u) + sum(d) + sum(e) },
      files: { unit: u, db: d, e2e: e },
      lastKnown: lastKnownTests(),
      run: opts.runTests ? runTests() : { ran: false, hint: "--run-tests белгісімен unit/db жүргізіледі. Әдепкіде жүргізілмейді." },
    },
    dependencies: {
      production: Object.keys(pkg.dependencies || {}).length, dev: Object.keys(pkg.devDependencies || {}).length,
      productionNames: Object.keys(pkg.dependencies || {}).sort(),
    },
    documents: docFiles.map((f) => ({ path: relative(resolve(ROOT, ".."), f), title: mdTitle(f), lines: lines(f) })),
    risks: collectRisks(),
    businessInputs: { marketSize: "гипотеза/толтырылмаған", customers: "жоқ", revenue: "жоқ", price: "белгіленбеген", growth: "жоқ", financialModel: "шаблон ғана (docs/QazaqCode-financial-model.xlsx), барлық болжам бос" },
  };
  facts.licenses = opts.licenses === false ? { available: false, reason: "өткізілді (--no-licenses)" } : await licenseReport();
  facts.audit = opts.audit === false ? { available: false, reason: "өткізілді (--no-audit)" } : auditSummary();
  return facts;
}

function factsMd(f) {
  const L = [];
  const lk = f.tests.lastKnown, sc = f.tests.staticCount, run = f.tests.run;
  L.push("# QazaqCode: FACTS (деректер бөлмесі)", "", `> ${f.note}`, "", `Жасалған уақыты: ${f.generatedAt}`, "");
  L.push("## Коммит", `- SHA: \`${f.commit.sha}\``, `- Күні: ${f.commit.date}`, `- Тақырыбы: ${f.commit.subject}`, `- Барлық коммит: ${f.commit.commitsTotal}`, `- Коммиттелмеген өзгеріс файлдары: ${f.commit.uncommittedChanges}${f.commit.uncommittedChanges ? " (SHA жұмыс көшірмесін толық сипаттамайды)" : ""}`, "");
  L.push("## Код", `- src: ${f.code.srcLines} жол (${f.code.srcFiles} TS/TSX файл), CSS ${f.code.cssLines} жол`, `- Миграциялар: ${f.code.migrationCount} файл, ${f.code.migrationLines} жол SQL`, `- Тест коды: ${f.code.testLines} жол`, `- Скрипттер: ${f.code.scriptsLines} жол`, `- Санау тәсілі: ${f.code.lineCounting}`, "");
  L.push("## Тесттер", `- Статикалық саны: unit ${sc.unit}, db ${sc.db}, e2e ${sc.e2e} (барлығы ${sc.total}). ${f.tests.method}.`);
  L.push(`- Соңғы белгілі нәтиже (${lk.source}): e2e ${lk.e2e ?? "?"}, db ${lk.db ?? "?"}, unit ${lk.unit ?? "?"}.`);
  L.push(`- Жаңарту: ${lk.howToRefresh.map((x) => "`" + x + "`").join("; ")}`);
  if (run.ran) { L.push(`- Осы жүгіру: unit pass ${run.unit.pass}/${run.unit.tests}, fail ${run.unit.fail}; db ${run.db.skipped ? run.db.skipped : `pass ${run.db.pass}/${run.db.tests}, fail ${run.db.fail}`}`); }
  else L.push(`- Осы жүгіру: жүргізілмеді. ${run.hint}`);
  L.push("", "| Топ | Файл | Статикалық тест |", "|---|---|---|");
  for (const g of ["unit", "db", "e2e"]) for (const t of f.tests.files[g]) L.push(`| ${g} | ${t.file} | ${t.tests} |`);
  L.push("", "## Тәуелділіктер", `- production (тікелей): ${f.dependencies.production}, dev: ${f.dependencies.dev}`, f.licenses.available ? `- production транзитивті пакет саны (license-checker): ${f.licenses.productionPackages}` : "", "");
  L.push("## SBOM / лицензиялар");
  if (!f.licenses.available) L.push(`- Қолжетімсіз: ${f.licenses.reason}`);
  else {
    L.push(`- Бөлінісі: ${Object.entries(f.licenses.byLicense).map(([k, v]) => `${k}: ${v}`).join("; ")}`);
    L.push(`- GPL/AGPL/копилефт ескертулері: ${f.licenses.copyleftWarnings.length ? f.licenses.copyleftWarnings.map((p) => `${p.id} (${p.licenses})`).join(", ") : "жоқ"}`);
    L.push(`- Қос лицензия (OR) бірақ копилефт нұсқасы бар, қолмен тексеру: ${f.licenses.copyleftOrDualReview.length ? f.licenses.copyleftOrDualReview.map((p) => `${p.id} (${p.licenses})`).join(", ") : "жоқ"}`);
    L.push(`- Лицензиясы нақты емес: ${f.licenses.unclearLicenses.length ? f.licenses.unclearLicenses.map((p) => `${p.id} (${p.licenses})`).join(", ") : "жоқ"}`);
  }
  L.push("", "## npm audit (production)");
  L.push(f.audit.available ? `- Осалдықтар: ${JSON.stringify(f.audit.vulnerabilities)} (${f.audit.note})` : `- ${f.audit.reason}`, "");
  L.push("## Құжаттар", "| Жол | Тақырып | Жол саны |", "|---|---|---|", ...f.documents.map((d) => `| ${d.path} | ${d.title.replace(/\|/g, "/")} | ${d.lines} |`), "");
  L.push("## Бизнес-кіріс (толтырылмаған)", ...Object.entries(f.businessInputs).map(([k, v]) => `- ${k}: ${v}`), "");
  return L.join("\n");
}

function risksMd(f) {
  const L = ["# Ашық тәуекелдер тізімі", "", "Дереккөз: docs/INVESTOR.md, docs/SECURITY-AUDIT.md, licensing/LEGAL-REVIEW.md. Мәтін автоматты алынған, мағынасы өзгертілмеген.", ""];
  let cur = "";
  for (const r of f.risks) { const h = `${r.source} / ${r.heading}`; if (h !== cur) { L.push("", `## ${h}`, ""); cur = h; } L.push(`- ${r.text}`); }
  return L.join("\n") + "\n";
}

function licensesMd(f) {
  const l = f.licenses;
  if (!l.available) return `# Лицензия есебі\n\nҚолжетімсіз: ${l.reason}\n`;
  const L = ["# Production тәуелділіктер лицензиялары (SBOM қысқаша)", "", `Пакет саны: ${l.productionPackages}`, "", "## Ескертулер", `- GPL/AGPL/копилефт: ${l.copyleftWarnings.length ? "\n" + l.copyleftWarnings.map((p) => `  - ${p.id}: ${p.licenses}`).join("\n") : "жоқ"}`, `- Қос лицензия, қолмен тексеру: ${l.copyleftOrDualReview.length ? "\n" + l.copyleftOrDualReview.map((p) => `  - ${p.id}: ${p.licenses}`).join("\n") : "жоқ"}`, `- Нақты емес лицензия: ${l.unclearLicenses.length ? "\n" + l.unclearLicenses.map((p) => `  - ${p.id}: ${p.licenses}`).join("\n") : "жоқ"}`, "", "## Бөлініс", "| Лицензия | Саны |", "|---|---|", ...Object.entries(l.byLicense).map(([k, v]) => `| ${k} | ${v} |`), "", "## Пакеттер", "| Пакет | Лицензия |", "|---|---|", ...l.packages.map((p) => `| ${p.id} | ${p.licenses} |`), ""];
  return L.join("\n");
}

function readmeMd(f) {
  return `# QazaqCode: деректер бөлмесі (data room)

Бұл қалта \`node scripts/dataroom.mjs\` арқылы жасалды (${f.generatedAt}, коммит ${f.commit.short}). Git-ке кірмейді; қайта жасауға болады.

## Құрамы
- \`FACTS.json\` / \`FACTS.md\`: коммит, код жолдары, миграциялар, тесттер (статикалық + соңғы белгілі нәтиже), тәуелділіктер, құжаттар тізімі.
- \`LICENSES.json\` / \`LICENSES.md\`: production тәуелділіктер лицензиялары, GPL/AGPL және нақты емес лицензия ескертулері.
- \`AUDIT.json\`: \`npm audit --omit=dev\` қысқа қорытындысы (желі болмаса "қолжетімсіз").
- \`DOCS-INDEX.md\`: құжаттар индексі. \`docs/\`: құжаттардың көшірмесі (ақ тізім: docs/*.md, licensing/*.md).
- \`RISKS.md\`: ашық тәуекелдер (INVESTOR, SECURITY-AUDIT, LEGAL-REVIEW ішінен).

## Не жоқ (әдейі)
Құпия, \`.env\`, кілттер, дерекқор дампы, пайдаланушы деректері. Нарық көлемі, клиент, табыс, баға, өсім: бұлар жоқ немесе гипотеза/толтырылмаған.

## Қайта жасау
\`node scripts/dataroom.mjs\` (тесттерсіз), \`--run-tests\` (unit + db; db үшін TEST_DATABASE_URL), \`--json\` (FACTS.json stdout-қа), \`--no-audit\`, \`--no-licenses\`, \`--out <қалта>\`.
`;
}

function docsIndexMd(f) {
  return ["# Құжаттар индексі", "", "| Жол | Тақырып | Жол саны |", "|---|---|---|", ...f.documents.map((d) => `| ${d.path} | ${d.title.replace(/\|/g, "/")} | ${d.lines} |`), ""].join("\n");
}

async function main() {
  const facts = await collectFacts({ runTests: flag("--run-tests"), audit: !flag("--no-audit"), licenses: !flag("--no-licenses") });
  const files = {
    "FACTS.json": JSON.stringify(facts, null, 2), "FACTS.md": factsMd(facts), "LICENSES.json": JSON.stringify(facts.licenses, null, 2), "LICENSES.md": licensesMd(facts),
    "AUDIT.json": JSON.stringify(facts.audit, null, 2), "RISKS.md": risksMd(facts), "DOCS-INDEX.md": docsIndexMd(facts), "README.md": readmeMd(facts),
  };
  for (const [n, c] of Object.entries(files)) if (hasSecret(c)) throw new Error(`Құпияға ұқсас мазмұн табылды: ${n}; жазу тоқтатылды`);
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "docs"), { recursive: true });
  for (const [n, c] of Object.entries(files)) writeFileSync(join(OUT, n), c);
  for (const d of facts.documents) {
    const src = resolve(ROOT, "..", d.path);
    if (!/\.md$/.test(src) || /(^|\/)\.env/.test(src) || hasSecret(readFileSync(src, "utf8"))) continue;
    copyFileSync(src, join(OUT, "docs", d.path.replace(/\//g, "__")));
  }
  if (flag("--json")) process.stdout.write(JSON.stringify(facts, null, 2) + "\n");
  else console.log(`Деректер бөлмесі: ${OUT}\n  коммит ${facts.commit.short}; src ${facts.code.srcLines} жол; миграция ${facts.code.migrationCount}; статикалық тест ${facts.tests.staticCount.total}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
