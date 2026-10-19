#!/usr/bin/env node
// Pyodide-ты өз хостымызға көшіреді (сыртқы CDN жоқ): node_modules/pyodide -> public/vendor/pyodide/
// Қолданылуы: node scripts/vendor-pyodide.mjs [--check]  (--check: файлдар бар және нұсқасы package-пен сәйкес екенін тексереді)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "pyodide");
const dst = path.join(root, "public", "vendor", "pyodide");
// Тек жұмысқа қажет файлдар (console.html, *.map, .d.ts жоқ)
const FILES = ["pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

const version = JSON.parse(fs.readFileSync(path.join(src, "package.json"), "utf8")).version;
if (process.argv.includes("--check")) {
  const miss = FILES.filter((f) => !fs.existsSync(path.join(dst, f)));
  const stamp = fs.existsSync(path.join(dst, "VERSION")) ? fs.readFileSync(path.join(dst, "VERSION"), "utf8").trim() : "";
  if (miss.length || stamp !== version) { console.error(`public/vendor/pyodide ескірген/толық емес (қажет ${version}, бар "${stamp}"; жоқ: ${miss.join(", ") || "-"}). Іске қосыңыз: node scripts/vendor-pyodide.mjs`); process.exit(1); }
  console.log(`pyodide ${version}: public/vendor/pyodide дайын`); process.exit(0);
}
fs.mkdirSync(dst, { recursive: true });
let total = 0;
for (const f of FILES) { fs.copyFileSync(path.join(src, f), path.join(dst, f)); total += fs.statSync(path.join(dst, f)).size; }
fs.writeFileSync(path.join(dst, "VERSION"), version + "\n");
console.log(`pyodide ${version}: ${FILES.length} файл, ${(total / 1048576).toFixed(1)} МБ -> public/vendor/pyodide/`);
