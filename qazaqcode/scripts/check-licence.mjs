#!/usr/bin/env node
// Лицензиялық шекара: qazaqcode/ ішінде CS50-тен алынған контент белгілері болмауы керек.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".next", "test-results", "playwright-report", ".git", "docs", "out"]); // out/: dataroom генераторының нәтижесі (git-ке кірмейді); docs/: шекараны түсіндіретін құжаттар
const SKIP_PREFIX = [".next-"];
const SKIP_FILES = new Set(["NOTICE.md", "check-licence.mjs", "LICENSE", "README.md", "package-lock.json", "INVESTOR-FAQ.md"]);
// CS50 контентінің айқын белгілері (құқықтық ескерту құжаттарынан басқа файлдарда болмауы тиіс)
const FORBIDDEN = [/\bCS50\b/i, /Harvard|Гарвард/i, /David\s+J\.?\s+Malan|\bMalan\b/i, /cs50\.harvard\.edu/i, /cs50kz/i, /CS50\s+қазақша/i];
const EXT = /\.(mjs|js|ts|tsx|jsx|css|json|md|sql|sh|html|yml|yaml|txt|env|example)$/i;
const hits = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || SKIP_PREFIX.some((x) => e.name.startsWith(x))) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (SKIP_FILES.has(e.name) || !EXT.test(e.name)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const re of FORBIDDEN) { const m = text.match(re); if (m) hits.push(`${path.relative(root, p)}: "${m[0]}"`); }
  }
})(root);
if (hits.length) {
  console.error("ЛИЦЕНЗИЯЛЫҚ ШЕКАРА БҰЗЫЛҒАН: қалта ішінде CS50 контентінің белгілері табылды:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("лицензиялық шекара таза: CS50 контентінің белгілері жоқ");
