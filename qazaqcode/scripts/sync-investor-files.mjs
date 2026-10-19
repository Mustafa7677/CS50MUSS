#!/usr/bin/env node
// docs/ ішіндегі инвестор файлдарын (питч дек, қаржылық модель шаблоны, FAQ) public/investors/ ішіне көшіреді.
// `node scripts/sync-investor-files.mjs [--build]`: --build алдымен деки мен моделді қайта жасайды. Файлдар репоға кіреді (қосынды ≤ 5 МБ).
import { copyFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["QazaqCode-pitch.pptx", "QazaqCode-financial-model.xlsx", "INVESTOR-FAQ.md"];
const LIMIT = 5 * 1024 * 1024;
if (process.argv.includes("--build")) for (const s of ["make-pitch-deck.mjs", "make-financial-model.mjs"]) execFileSync("node", [join(ROOT, "scripts", s)], { cwd: ROOT, stdio: "inherit" });
const dest = join(ROOT, "public/investors"); mkdirSync(dest, { recursive: true });
let total = 0;
for (const f of FILES) {
  const src = join(ROOT, "docs", f);
  if (!existsSync(src)) throw new Error(`Жоқ: ${src} (алдымен --build)`);
  copyFileSync(src, join(dest, f)); const sz = statSync(src).size; total += sz;
  if (sz > LIMIT) throw new Error(`${f} > 5 МБ`);
  console.log(`${f}: ${(sz / 1024).toFixed(0)} КБ`);
}
if (total > LIMIT) throw new Error("қосынды > 5 МБ");
console.log(`Барлығы ${(total / 1024).toFixed(0)} КБ -> public/investors/`);
