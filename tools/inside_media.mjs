// © 2026 AO17 командасы. All Rights Reserved.
// INSIDE TECH (AO17 командасының 3D платформасы) комикстері мен оқиғаларын JSON-ға шығарады - AO17-нің өз беттерінде көрсету үшін:
//   labComics   - зертханалардың ашылу комикстері (әр зертхананың 1-2 сабағы, lib/comics.ts);
//   filmComics  - кино-комикстер (3-сабақ, lib/films.ts);
//   lessonComics - сабақтардың өз комикстері (математика курсы және бірнеше IT сабағы);
//   board       - «тақта фильмдері»: шешімді қадамдап көрсететін фильмдер (сабақ қадамының film өрісі);
//   episodes    - «Қалай оқу керек?» эпизодтары (lib/learnHow.ts); stories - «Тірі заттар» әңгімелері (lib/stories.ts);
//   journey     - «Бір басудың саяхаты» (lib/journey.ts); careers, careerQuiz - мамандықтар мен мамандық тесті (lib/careers.ts);
//   problems    - «Есептер залы»: қиын есеп, шешім фильмі, стратегия, егіз есеп (lib/problems.ts);
//   cards, cardIntervals - «Есте сақтау карточкалары» және Лейтнер жәшіктерінің аралықтары (lib/cards.ts).
// AO17-де Ұстаз кейіпкері жоқ: оның сөзін Бота айтады (who: "ustaz" -> "bota"), мәтіндегі «Ұстаз» де «Бота» болады.
// Сондықтан бұл шығару strip_ustaz-тан БҰРЫН, таза клонда жүреді (tools/sync_inside.py).
// Қолдану: node tools/inside_media.mjs <3d-learning- қалтасы> <шығыс.json>
import { writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const [dir, out] = process.argv.slice(2);
if (!dir || !out) {
  console.error("қолдану: node tools/inside_media.mjs <3d-learning- қалтасы> <шығыс.json>");
  process.exit(2);
}
const web = resolve(dir, "apps/web");
const { build } = await import(pathToFileURL(resolve(web, "node_modules/esbuild/lib/main.js")).href);
const entry = `
import { LAB_COMICS } from "@/lib/comics";
import { FILM_COMICS } from "@/lib/films";
import { EPISODES } from "@/lib/learnHow";
import { STORIES } from "@/lib/stories";
import { JOURNEY } from "@/lib/journey";
import { CAREERS, QUIZ } from "@/lib/careers";
import { PROBLEMS } from "@/lib/problems";
import { CARDS, INTERVAL_DAYS } from "@/lib/cards";
import { lessonEntries } from "@/lib/lessons";
const clean = (v) => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === "function" || k === "onEnter" ? undefined : x)));
const lessonComics = {}, board = {};
for (const e of lessonEntries) for (const s of e.lesson.steps) {
  if (s.comic) lessonComics[e.lesson.id] = { step: s.id, comic: s.comic };
  if (s.film) board[e.lesson.id] = { step: s.id, film: s.film };
}
process.stdout.write(JSON.stringify(clean({ labComics: LAB_COMICS, filmComics: FILM_COMICS, lessonComics, board, episodes: EPISODES, stories: STORIES,
  journey: JOURNEY, careers: CAREERS, careerQuiz: QUIZ, problems: PROBLEMS, cards: CARDS, cardIntervals: INTERVAL_DAYS })));
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
const raw = execFileSync(process.execPath, [tmp], { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
await unlink(tmp);

// Ұстаз -> Бота: сөйлеуші және мәтіндегі атауы (септік жалғауымен: Ұстазға -> Ботаға, ...)
const FORMS = [["Ұстаздың", "Ботаның"], ["Ұстазға", "Ботаға"], ["Ұстазды", "Ботаны"], ["Ұстаздан", "Ботадан"], ["Ұстазбен", "Ботамен"],
  ["Ұстазда", "Ботада"], ["Ұстазым", "Ботам"], ["Ұстаз", "Бота"], ["ұстаз", "бота"]];
const data = JSON.parse(raw, (k, v) => {
  if (k === "who" && v === "ustaz") return "bota";
  if (Array.isArray(v) && k === "with") return v.map((w) => (w === "ustaz" ? "bota" : w));
  if (typeof v === "string") return FORMS.reduce((s, [a, b]) => s.split(a).join(b), v);
  return v;
});
const left = JSON.stringify(data).match(/[Ұұ]стаз|ustaz/g);
if (left) {
  console.error("inside_media: Ұстаз қалды:", left.length);
  process.exit(1);
}
// Тұрақты шығыс (build қайталанғанда diff болмайды)
await writeFile(out, JSON.stringify(data) + "\n");
const n = (o) => Object.keys(o).length;
console.log("inside_media:", out, `- комикс: ${n(data.labComics)} + ${n(data.filmComics)} + ${n(data.lessonComics)}, тақта фильмі: ${n(data.board)},`,
  `эпизод: ${data.episodes.length}, әңгіме: ${data.stories.length}, саяхат: ${data.journey.length}, мамандық: ${data.careers.length},`,
  `есеп: ${data.problems.length}, карточка: ${data.cards.length}`);
