#!/usr/bin/env node
// i18n кілттерін бастапқы кодтан жинау (t("...") және N("...") шақырулары, кілт = қазақша мәтін).
//   node scripts/i18n-sync.mjs            -> src/lib/i18n/kk.ts қайта жазады, ru-да жоқ кілттерді санайды
//   node scripts/i18n-sync.mjs --check    -> kk.ts ескірсе не ru-да жоқ кілт болса қатемен шығады
//   node scripts/i18n-sync.mjs --todo F   -> ru-да жоқ кілттерді F файлына жазады (id<TAB>кілт<TAB>файл)
//   node scripts/i18n-sync.mjs --merge F P C -> F (todo) + P (id<TAB>аударма жолдары) -> src/lib/i18n/ru/C.ts-ке қосу
//   (ескі сипаттама:) F ("id<TAB>аударма" жолдары, --todo нөмірлері) -> src/lib/i18n/ru/C.ts-ке қосу
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CYR = /[Ѐ-ӿ]/;
const RE = /(?<![\w$.])(?:t|N)\(\s*("(?:[^"\\\n]|\\.)*")/g;

export function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && !e.name.startsWith(".")) walk(p, out); }
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}
export function scanKeys() {
  const keys = new Map(); // key -> first file
  for (const f of walk(path.join(root, "src"))) {
    if (f.includes(`${path.sep}lib${path.sep}i18n${path.sep}`)) continue;
    const s = fs.readFileSync(f, "utf8");
    for (const m of s.matchAll(RE)) {
      let k;
      try { k = JSON.parse(m[1]); } catch { continue; }
      if (CYR.test(k) && !keys.has(k)) keys.set(k, path.relative(root, f));
    }
  }
  // errors.ts: ішіндегі барлық қазақша жолдар - көрсетілетін хабарлама (кілт)
  const ef = path.join(root, "src/lib/errors.ts");
  for (const m of fs.readFileSync(ef, "utf8").matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) {
    let k; try { k = JSON.parse(`"${m[1]}"`); } catch { continue; }
    if (CYR.test(k) && !keys.has(k)) keys.set(k, "src/lib/errors.ts");
  }
  return keys;
}
async function loadRu() {
  // ru/*.ts оқу: transform-types режимінсіз де оқылсын деп, regex арқылы "key": "value" жұптары
  const dir = path.join(root, "src/lib/i18n/ru");
  const ru = {};
  if (!fs.existsSync(dir)) return ru;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts")) continue;
    for (const line of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) {
      const m = /^\s*(".*?[^\\]"|""):\s*(".*"),?\s*$/.exec(line);
      if (m) ru[JSON.parse(m[1])] = JSON.parse(m[2]);
    }
  }
  return ru;
}
const kkSource = (keys) =>
  `// kk каталогы: кілт = мәтін (бастапқы тіл). \`node scripts/i18n-sync.mjs\` бастапқы кодтан жасайды: қолмен өзгертпеңіз.\n` +
  `import type { Catalog } from "./core";\nexport const kk: Catalog = {\n${[...keys.keys()].sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(k)},`).join("\n")}\n};\n`;

const [, , mode, a, b] = process.argv;
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const keys = scanKeys();
  const ru = await loadRu();
  const missing = [...keys.keys()].filter((k) => !ru[k]);
  const kkPath = path.join(root, "src/lib/i18n/kk.ts");
  const want = kkSource(keys);
  if (mode === "--merge") {
    const todo = fs.readFileSync(a, "utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));
    const idMap = new Map(JSON.parse(fs.readFileSync(a + ".json", "utf8")));
    const part = fs.readFileSync(b, "utf8").split("\n").filter(Boolean);
    const out = [];
    for (const l of part) {
      const i = l.indexOf("\t");
      const id = l.slice(0, i), v = l.slice(i + 1).trim();
      const k = idMap.get(id);
      if (!k || !v) { console.error("өткізілді:", id); continue; }
      out.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    }
    const target = path.join(root, "src/lib/i18n/ru", `${process.argv[5] ?? "part"}.ts`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const head = fs.existsSync(target) ? fs.readFileSync(target, "utf8").replace(/\n\};\s*$/, "\n") : `import type { Catalog } from "../core";\nexport const ${process.argv[5] ?? "part"}: Catalog = {\n`;
    fs.writeFileSync(target, head + out.join("\n") + "\n};\n");
    console.log(`қосылды: ${out.length} -> ${path.relative(root, target)}`);
  } else if (mode === "--todo") {
    const ids = [];
    fs.writeFileSync(a, missing.map((k, i) => { ids.push([String(i + 1), k]); return `${i + 1}\t${k}\t${keys.get(k)}`; }).join("\n") + "\n");
    fs.writeFileSync(a + ".json", JSON.stringify(ids));
    console.log(`аударылмаған: ${missing.length}`);
  } else if (mode === "--check") {
    const stale = !fs.existsSync(kkPath) || fs.readFileSync(kkPath, "utf8") !== want;
    const extra = Object.keys(ru).filter((k) => !keys.has(k));
    console.log(`кілт: ${keys.size}, ru-да жоқ: ${missing.length}, ru-да артық: ${extra.length}, kk.ts ескірген: ${stale}`);
    if (stale || missing.length || extra.length) process.exit(1);
  } else {
    fs.writeFileSync(kkPath, want);
    console.log(`kk.ts: ${keys.size} кілт; ru-да жоқ: ${missing.length}`);
  }
}
