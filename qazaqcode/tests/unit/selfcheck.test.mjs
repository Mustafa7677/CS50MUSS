// «Жеке тексеру» (браузердегі Python): салыстыру, runner протоколы (жалған worker), worker файлының қауіпсіздік қасиеттері.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeOutput, diffLines, sameOutput } from "../../src/lib/selfcheck/runner.ts";
import { SelfCheckRunner } from "../../src/lib/selfcheck/runner.ts";

class FakeWorker {
  constructor(script) { this.script = script; this.terminated = false; this.posted = []; this.onmessage = null; this.onerror = null; setTimeout(() => this.script(this), 0); }
  emit(data) { if (!this.terminated) this.onmessage?.({ data }); }
  postMessage(m) { this.posted.push(m); this.script(this, m); }
  terminate() { this.terminated = true; }
}
const mk = (script, opts = {}) => { const ws = []; const r = new SelfCheckRunner({ createWorker: () => { const w = new FakeWorker(script); ws.push(w); return w; }, ...opts }); return { r, ws }; };
const ok = (i, stdout, extra = {}) => ({ type: "case", index: i, stdout, stderr: "", error: null, ms: 3, truncated: false, ...extra });

test("compare: жол соңы бос орындары мен соңғы бос жолдар ескерілмейді, регистр мен жол ішіндегі бос орын маңызды", () => {
  assert.equal(normalizeOutput("a  \r\nb\n\n\n"), "a\nb");
  assert.ok(sameOutput("120\n", "120"));
  assert.ok(!sameOutput("Hello", "hello"));
  assert.ok(!sameOutput("a b", "a  b"));
  assert.deepEqual(diffLines("1\n2\n3", "1\n5\n3\n4"), [{ line: 2, expected: "2", actual: "5" }, { line: 4, expected: null, actual: "4" }]);
  assert.equal(diffLines("x", "x").length, 0);
  assert.equal(diffLines("a\n".repeat(50), "b\n".repeat(50), 5).length, 5);
});

test("runner: дұрыс код өтеді, қате код өтпейді және айырмашылық көрсетіледі; ештеңе серверге жіберілмейді", async () => {
  const phases = [];
  const { r, ws } = mk((w, m) => {
    if (!m) return w.emit({ type: "ready" });
    if (m.type === "run") { w.emit(ok(0, "120\n")); w.emit(ok(1, "2\n")); w.emit({ type: "done" }); }
  }, { onPhase: (p) => phases.push(p) });
  const out = await r.run("print(1)", [{ input: "5", expected: "120" }, { input: "0", expected: "1" }]);
  assert.ok(out.ok);
  assert.deepEqual(out.results.map((x) => x.status), ["pass", "fail"]);
  assert.deepEqual(out.results[1].diff, [{ line: 1, expected: "1", actual: "2" }]);
  assert.deepEqual(phases, ["loading", "running", "done"]);
  assert.ok(ws[0].terminated, "іске қосудан кейін worker өлтіріледі (күй ағып кетпейді)");
  assert.deepEqual(ws[0].posted[0].cases, [{ input: "5" }, { input: "0" }], "worker-ге тек кіріс беріледі, күтілетін нәтиже емес");
});

test("runner: Python қатесі 'error', stdout шегі қысқартылады", async () => {
  const { r } = mk((w, m) => { if (!m) return w.emit({ type: "ready" }); w.emit(ok(0, "x".repeat(200000), { error: "NameError: x", truncated: true })); w.emit({ type: "done" }); });
  const out = await r.run("x", [{ input: "", expected: "" }]);
  assert.equal(out.results[0].status, "error"); assert.equal(out.results[0].stdout.length, 64 * 1024); assert.ok(out.results[0].truncated);
});

test("runner: шексіз цикл - таймаут, worker өлтіріледі, қалған кейістер орындалмайды", async () => {
  const { r, ws } = mk((w, m) => { if (!m) return w.emit({ type: "ready" }); /* run алынды, бірақ ешқашан жауап жоқ (шексіз цикл) */ }, { caseTimeoutMs: 50 });
  const t0 = Date.now();
  const out = await r.run("while True: pass", [{ input: "", expected: "1" }, { input: "", expected: "2" }, { input: "", expected: "3" }]);
  assert.ok(Date.now() - t0 < 1000);
  assert.deepEqual(out.results.map((x) => x.status), ["timeout", "skipped", "skipped"]);
  assert.ok(ws[0].terminated); assert.equal(r.isBusy, false);
  // кейін жаңа іске қосу жаңа worker алады
  const again = await r.run("print(1)", []);
  assert.ok(again.ok); assert.equal(ws.length, 2);
});

test("runner: бір мезгілде 1 жұмыс", async () => {
  const { r } = mk((w, m) => { if (!m) return setTimeout(() => w.emit({ type: "ready" }), 20); w.emit(ok(0, "1")); w.emit({ type: "done" }); });
  const first = r.run("print(1)", [{ input: "", expected: "1" }]);
  const second = await r.run("print(1)", [{ input: "", expected: "1" }]);
  assert.equal(second.ok, false); assert.equal(second.reason, "busy");
  assert.ok((await first).ok);
});

test("runner: жүктелу қатесі / таймауты / worker қатесі түсінікті нәтиже береді", async () => {
  let r = mk((w, m) => { if (!m) w.emit({ type: "fatal", message: "wasm жоқ" }); }).r;
  let out = await r.run("print(1)", [{ input: "", expected: "1" }]);
  assert.equal(out.ok, false); assert.equal(out.reason, "load_failed");
  r = mk(() => {}, { loadTimeoutMs: 30 }).r;
  out = await r.run("print(1)", [{ input: "", expected: "1" }]); assert.equal(out.reason, "load_timeout");
  r = mk((w, m) => { if (!m) w.onerror?.({}); }).r;
  out = await r.run("print(1)", [{ input: "", expected: "1" }]); assert.equal(out.reason, "worker_error");
  const r2 = new SelfCheckRunner({ createWorker: () => { throw new Error("CSP"); } });
  out = await r2.run("x", [{ input: "", expected: "" }]); assert.equal(out.reason, "worker_error"); assert.equal(r2.isBusy, false);
});

test("runner: cancel() жұмысты тоқтатады және worker-ді өлтіреді", async () => {
  const { r, ws } = mk((w, m) => { if (!m) w.emit({ type: "ready" }); });
  const p = r.run("x", [{ input: "", expected: "" }, { input: "", expected: "" }]);
  await new Promise((res) => setTimeout(res, 20)); r.cancel();
  const out = await p; assert.ok(ws[0].terminated); assert.ok(out.results.every((x) => x.status === "skipped"));
});

test("worker файлы: өз хостымыздан жүктейді, сыртқы URL жоқ, желі API жабылады, шектеулер бар", () => {
  const src = fs.readFileSync("public/workers/py-runner.js", "utf8");
  assert.ok(!/https?:\/\//.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "worker кодында абсолютті URL болмауы тиіс");
  assert.match(src, /importScripts\("\/vendor\/pyodide\/pyodide\.js"\)/);
  for (const api of ["fetch", "XMLHttpRequest", "WebSocket", "importScripts"]) assert.match(src, new RegExp(`"${api}"`), `${api} жабылмаған`);
  assert.match(src, /MAX_OUT = 64 \* 1024/);
  assert.match(src, /globals\.get\("dict"\)\(\)/, "әр іске қосуда таза namespace");
  assert.match(src, /busy/);
});

test("vendor: Pyodide файлдары бар, нұсқа package-пен сәйкес, лицензия жазбасы бар, жергілікті pyodide.js CDN-ге сілтемейді", () => {
  const d = "public/vendor/pyodide/";
  for (const f of ["pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json", "LICENSE-NOTICE", "VERSION"]) assert.ok(fs.existsSync(d + f), f);
  assert.equal(fs.readFileSync(d + "VERSION", "utf8").trim(), JSON.parse(fs.readFileSync("node_modules/pyodide/package.json", "utf8")).version);
  assert.match(fs.readFileSync(d + "LICENSE-NOTICE", "utf8"), /MPL-2\.0/);
});
