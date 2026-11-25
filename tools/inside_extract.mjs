// © 2026 AO17 командасы. All Rights Reserved.
// INSIDE TECH (AO17 командасының 3D платформасы) сабақтарын JSON-ға шығарады: сабақ, қадам, дәріс, тест, болжам, мысал, «қатені тап».
// Тексеру функциялары мен симуляция әрекеттері (onEnter) алынып тасталады: AO17 оларды 3D қолданбаның ішінде ғана қолданады.
// Қолдану (tools/sync_inside.py шақырады): node tools/inside_extract.mjs <3d-learning- қалтасы> <шығыс.json>
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [dir, out] = process.argv.slice(2);
if (!dir || !out) {
  console.error("қолдану: node tools/inside_extract.mjs <3d-learning- қалтасы> <шығыс.json>");
  process.exit(2);
}
const web = resolve(dir, "apps/web");
const { build } = await import(pathToFileURL(resolve(web, "node_modules/esbuild/lib/main.js")).href);
const entry = `
import { lessonEntries } from "@/lib/lessons";
import { labs } from "@/lib/catalog";
const clean = (v) => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === "function" || k === "onEnter" ? undefined : x)));
process.stdout.write(JSON.stringify({ labs: clean(labs), lessons: lessonEntries.map((e) => ({ labId: e.labId, lesson: clean(e.lesson) })) }));
`;
const res = await build({
  stdin: { contents: entry, resolveDir: web, loader: "ts" }, bundle: true, platform: "node", format: "esm", write: false, logLevel: "error",
  jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "alias", setup(b) {
    b.onResolve({ filter: /^@\// }, (a) => b.resolve("./" + a.path.slice(2), { resolveDir: resolve(web, "src"), kind: a.kind }));
    b.onResolve({ filter: /\.(css|png|svg|jpg|woff2?)$/ }, (a) => ({ path: a.path, namespace: "empty" }));
    b.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "export default ''", loader: "js" }));
  } }],
});
const tmp = resolve(out + ".bundle.mjs");
await writeFile(tmp, res.outputFiles[0].text);
const { execFileSync } = await import("node:child_process");
const json = execFileSync(process.execPath, [tmp], { maxBuffer: 64 * 1024 * 1024 });
const { unlink } = await import("node:fs/promises");
await unlink(tmp);
// Тұрақты шығыс (build қайталанғанда diff болмайды): кілттер реті сақталады, отступ 0
await writeFile(out, JSON.stringify(JSON.parse(json.toString("utf8"))) + "\n");
console.log("inside_extract:", out);
