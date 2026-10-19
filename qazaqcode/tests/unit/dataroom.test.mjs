import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(mkdtempSync(join(tmpdir(), "dataroom-")), "dr");
let facts;
before(() => {
  execFileSync("node", [join(ROOT, "scripts/dataroom.mjs"), "--out", OUT, "--no-audit"], { cwd: ROOT, stdio: "pipe", timeout: 120000 });
  facts = JSON.parse(readFileSync(join(OUT, "FACTS.json"), "utf8"));
});
const all = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? all(join(d, e.name)) : [join(d, e.name)]));

test("dataroom: FACTS.json құрылымы", () => {
  assert.match(facts.commit.sha, /^[0-9a-f]{40}$/);
  assert.ok(facts.commit.date);
  assert.ok(facts.code.srcLines > 1000 && facts.code.migrationCount >= 10);
  assert.equal(facts.code.migrations.length, facts.code.migrationCount);
  assert.equal(facts.tests.staticCount.total, facts.tests.staticCount.unit + facts.tests.staticCount.db + facts.tests.staticCount.e2e);
  assert.ok(facts.tests.staticCount.db > 0 && facts.tests.staticCount.e2e > 0);
  assert.equal(facts.tests.run.ran, false);
  assert.ok(facts.dependencies.production > 0);
  assert.ok(Array.isArray(facts.documents) && facts.documents.some((d) => d.path.endsWith("docs/INVESTOR.md")));
  assert.ok(facts.risks.length > 0);
  assert.equal(facts.audit.available, false); // --no-audit
});

test("dataroom: бизнес-сандар толтырылмаған ретінде белгіленген", () => {
  for (const k of ["marketSize", "customers", "revenue", "price", "growth"]) assert.ok(typeof facts.businessInputs[k] === "string" && !/\d/.test(facts.businessInputs[k]), k);
});

test("dataroom: лицензия есебі және ескертулер өрістері", () => {
  assert.equal(facts.licenses.available, true);
  for (const k of ["copyleftWarnings", "copyleftOrDualReview", "unclearLicenses", "byLicense"]) assert.ok(k in facts.licenses, k);
  assert.ok(existsSync(join(OUT, "LICENSES.md")) && existsSync(join(OUT, "README.md")) && existsSync(join(OUT, "RISKS.md")));
});

test("dataroom: құпия (.env, кілт) ЕШҚАШАН кірмейді", () => {
  const files = all(OUT);
  for (const f of files) {
    assert.ok(!/(^|\/)\.env/.test(f), f);
    assert.ok(!/\.(pem|key|p12|sql|dump|bak)$/i.test(f), f);
    const t = readFileSync(f, "utf8");
    assert.ok(!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(t), f);
    assert.ok(!/\bpostgres(ql)?:\/\/[^\s:@/]+:[^\s@/]+@/.test(t), "DB URL " + f);
    assert.ok(!/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\./.test(t), "JWT " + f);
  }
  for (const [k, v] of Object.entries(process.env)) if (/SECRET|PASSWORD|TOKEN|KEY/i.test(k) && v && v.length >= 12) for (const f of files) assert.ok(!readFileSync(f, "utf8").includes(v), `env ${k} ағып кетті`);
});

test("dataroom: жолдар салыстырмалы, абсолютті үй жолы жоқ; node_modules/out кірмейді", () => {
  for (const d of facts.documents) assert.ok(!d.path.startsWith("/") && !d.path.includes("node_modules"), d.path);
  for (const f of all(OUT)) assert.ok(!f.includes("node_modules"), f);
  for (const t of Object.values(facts.tests.files).flat()) assert.ok(!t.file.startsWith("/"), t.file);
  assert.ok(readFileSync(join(ROOT, ".gitignore"), "utf8").split("\n").some((l) => l.trim() === "out/"), "out/ .gitignore-да болуы керек");
});
