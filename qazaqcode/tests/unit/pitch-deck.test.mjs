import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const JSZip = createRequire(import.meta.url)("jszip");
const FILE = join(mkdtempSync(join(tmpdir(), "deck-")), "pitch.pptx");
let zip, slides = [], notes = [];
const text = (xml) => [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")).join(" ");
before(async () => {
  execFileSync("node", [join(ROOT, "scripts/make-pitch-deck.mjs"), "--out", FILE], { cwd: ROOT, stdio: "pipe", timeout: 120000 });
  zip = await JSZip.loadAsync(readFileSync(FILE));
  const names = Object.keys(zip.files);
  const sl = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/(\d+)/g).pop()) - parseInt(b.match(/(\d+)/g).pop()));
  for (const n of sl) slides.push(text(await zip.file(n).async("string")));
  const ns = names.filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n));
  for (const n of ns) notes.push(text(await zip.file(n).async("string")));
});

test("питч деки: файл zip ретінде ашылады, 12-14 слайд, әр слайдта жазба бар", () => {
  assert.ok(zip.file("[Content_Types].xml") && zip.file("ppt/presentation.xml"));
  assert.ok(slides.length >= 12 && slides.length <= 14, "слайд саны " + slides.length);
  assert.equal(notes.length, slides.length);
  for (const t of notes) assert.ok(t.trim().length > 80, "жазба тым қысқа: " + t.slice(0, 40));
});

test("питч деки: қазақша мазмұн, міндетті тақырыптар бар", () => {
  const all = slides.join(" ").toLowerCase();
  for (const k of ["проблема", "шешім", "өнім", "жол картасы", "бизнес-модель", "тәуекел", "команда", "қаражат", "пилот"]) assert.ok(all.includes(k), k);
  assert.match(all, /ии-ассистент/);
  assert.match(all, /қазақша/);
});

// Эвристика: ақша/пайыз/нарық сипатындағы сан жолы бар слайдта "гипотеза" немесе "толтырылмаған" не "жоқ" ескертуі болуы тиіс
const MONEY = /\d[\d\s .,]*\s*(₸|тг\b|тенге|\$|usd|eur|млн|млрд|миллион|мың\s*₸|%)/i;
const MARKET = /(cagr|tam\b|sam\b|som\b|нарық\s*көлемі[^.]*\d|\d+\s*(клиент|төлеуші|пайдаланушы)\b|\d+\s*x\s*өсім|өсім[^.]*\d)/i;
test("питч деки: жалған сан эвристикасы (ақша/пайыз/нарық саны 'гипотеза' ескертуінсіз жоқ)", () => {
  slides.forEach((t, i) => {
    const hasWarn = /гипотеза|толтырылмаған|белгісіз|зерттелмеген/i.test(t);
    if (MONEY.test(t) || MARKET.test(t)) assert.ok(hasWarn, `слайд ${i + 1}: ақша/нарық саны гипотеза белгісінсіз: ${t.slice(0, 120)}`);
  });
});

test("питч деки: тыйым салынған тіркестер жоқ (мақтау, жалған клиент)", () => {
  const all = (slides.join(" ") + " " + notes.join(" ")).toLowerCase();
  for (const bad of ["лидер", "бірегей", "революция", "миллиард", "unicorn", "жүздеген мектеп", "көптеген клиент", "өсу қарқыны"]) assert.ok(!all.includes(bad), bad);
});

test("питч деки: тесттер саны репо фактісімен сәйкес (диаграмма)", async () => {
  const chart = Object.keys(zip.files).find((n) => /^ppt\/charts\/chart\d+\.xml$/.test(n));
  assert.ok(chart, "диаграмма бар");
  const xml = await zip.file(chart).async("string");
  const vals = [...xml.matchAll(/<c:v>([\d.]+)<\/c:v>/g)].map((m) => +m[1]);
  const facts = JSON.parse(execFileSync("node", [join(ROOT, "scripts/dataroom.mjs"), "--json", "--no-audit", "--no-licenses", "--out", join(tmpdir(), "dr-deck-check")], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }));
  for (const v of [facts.tests.staticCount.e2e, facts.tests.staticCount.db, facts.tests.staticCount.unit]) assert.ok(vals.includes(v), "диаграммада жоқ: " + v);
});
