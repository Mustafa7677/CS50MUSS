#!/usr/bin/env node
// Инвестор питч деки: docs/QazaqCode-pitch.pptx. `node scripts/make-pitch-deck.mjs [--out файл]`
// ШЫНАЙЫЛЫҚ: сандар тек репо/тесттен (scripts/dataroom.mjs collectFacts). Нарық, клиент, табыс, баға, өсім: ЖОҚ немесе "гипотеза/толтырылмаған".
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
const require = createRequire(import.meta.url);
const PptxGenJS = require("pptxgenjs");
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const OUT = resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : join(ROOT, "docs/QazaqCode-pitch.pptx"));
const { collectFacts } = await import(pathToFileURL(join(ROOT, "scripts/dataroom.mjs")).href);
const F = await collectFacts({ audit: false, licenses: false });
const lk = F.tests.lastKnown, sc = F.tests.staticCount;
const round50 = (n) => Math.round(n / 50) * 50;
const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const C = { brand: "0E7490", dark: "0F172A", soft: "E0F2F6", accent: "F2B705", muted: "5B6676", line: "E3E8ee", bg: "FFFFFF", red: "B42318", ok: "15803D", grey: "F4F6F8" };
const FONT = "Calibri";
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pptx.title = "QazaqCode Platform: инвестор питчі (пилотқа дейінгі сатыда)";
pptx.author = "QazaqCode"; pptx.company = "QazaqCode";

let n = 0;
function slide(title, kicker, notes, opts = {}) {
  const s = pptx.addSlide(); n++;
  s.background = { color: opts.dark ? C.dark : C.bg };
  if (!opts.dark) {
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: C.brand }, line: { color: C.brand } });
    if (kicker) s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.35, w: 9, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: C.brand, charSpacing: 2 });
    s.addText(title, { x: 0.6, y: 0.65, w: 12.1, h: 0.9, fontFace: FONT, fontSize: 30, bold: true, color: C.dark, valign: "top" });
    s.addText(`QazaqCode  |  ${n}`, { x: 10.2, y: 7.05, w: 2.8, h: 0.3, fontFace: FONT, fontSize: 10, color: C.muted, align: "right" });
    s.addText("Пилотқа дейінгі өнім. Бизнес-сандар - гипотеза/толтырылмаған.", { x: 0.6, y: 7.05, w: 8, h: 0.3, fontFace: FONT, fontSize: 10, color: C.muted });
  }
  s.addNotes(notes);
  return s;
}
const card = (s, x, y, w, h, head, body, o = {}) => {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: o.fill || C.grey }, line: { color: o.line || C.line, width: 1 }, rectRadius: 0.08 });
  s.addText(head, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.45, fontFace: FONT, fontSize: o.hs || 15, bold: true, color: o.hc || C.brand, valign: "top" });
  if (body) s.addText(body, { x: x + 0.2, y: y + (o.off || 0.6), w: w - 0.4, h: h - (o.off || 0.6) - 0.1, fontFace: FONT, fontSize: o.bs || 13, color: C.dark, valign: "top", paraSpaceAfter: 4 });
};
const tag = (s, text, x, y, w, color) => { s.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.38, fill: { color }, line: { color }, rectRadius: 0.19 }); s.addText(text, { x, y, w, h: 0.38, fontFace: FONT, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" }); };
const bullets = (arr, o = {}) => arr.map((t) => ({ text: t, options: { bullet: { indent: 16 }, breakLine: true, ...o } }));

// 1. Титул
{
  const s = slide("", "", "Ашылу сөзі (20 сек): QazaqCode - мектептерге арналған қазақ тілді бағдарламалау оқыту платформасы. Біз ашық айтамыз: бұл пилотқа дейінгі өнім, нақты мектепте әлі сыналмаған, клиент пен табыс жоқ. Бұл дек - нені жасағанымыз, нені дәлелдемегенімізді көрсету. Сұрақ: 'Неге ашық айтасыздар?' - себебі due-diligence кезінде бәрібір тексеріледі, бізге сенім маңызды.", { dark: true });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: C.brand }, line: { color: C.brand } });
  s.addText([{ text: "Qazaq", options: { color: "FFFFFF" } }, { text: "Code", options: { color: C.accent } }], { x: 0.9, y: 1.7, w: 11, h: 1.2, fontFace: FONT, fontSize: 60, bold: true });
  s.addText("Мектептерге арналған бағдарламалауды оқыту және тапсырмаларды автоматты тексеру платформасы", { x: 0.9, y: 3.0, w: 10.5, h: 1.0, fontFace: FONT, fontSize: 24, color: "E8EDF5" });
  tag(s, "Сатысы: пилотқа дейінгі өнім", 0.9, 4.4, 3.9, C.accent);
  s.addText(`Инвестор материалы  |  коммит ${F.commit.short}  |  ${F.commit.date.slice(0, 10)}`, { x: 0.9, y: 5.1, w: 11, h: 0.4, fontFace: FONT, fontSize: 14, color: "9AA8BD" });
  s.addText("Нарық көлемі, клиент, табыс, баға: жоқ немесе гипотеза. Инвестициялық ұсыныс емес.", { x: 0.9, y: 6.4, w: 11.5, h: 0.4, fontFace: FONT, fontSize: 13, italic: true, color: "9AA8BD" });
}

// 2. Проблема
{
  const s = slide("Проблема: мұғалімнің қолмен тексеру жүктемесі", "Проблема", "Мұнда сан жоқ - әдейі. Біз мұғалімдер мен мектептер арасында сауалнама жүргізген жоқпыз, сондықтан '%' не 'сағат' айтпаймыз. Бұл сапалық гипотеза, пилотта өлшейміз (мұғалімнің тексеру уақыты). Сұрақ: 'Мәселе қаншалықты үлкен?' - жауап: білмейміз, пилот соны өлшеуі керек. Сұрақ: 'Бәсекелестер?' - зерттелмеген, FAQ-та ашық жазылған.");
  card(s, 0.6, 1.9, 3.9, 2.9, "Қолмен тексеру", "Бағдарламалау тапсырмалары мен тест жұмыстарын мұғалім қолмен тексереді; сынып көбейген сайын уақыт көп кетеді.");
  card(s, 4.7, 1.9, 3.9, 2.9, "Көрінбейтін нәтиже", "Сынып пен оқушы прогресі бір жерде жиналмаса, әкімшіге жалпы көрініс жоқ.");
  card(s, 8.8, 1.9, 3.9, 2.9, "Қазақ тіліндегі орта", "Қазақша интерфейс пен тапсырмалары бар оқу ортасына қажеттілік - біздің гипотеза, нарық зерттелмеген.");
  tag(s, "Сапалық сипаттама: сан жоқ", 0.6, 5.2, 3.2, C.accent);
  s.addText("Пилотта өлшейміз: мұғалімнің тексеру уақыты, оқушының тапсырма орындау үлесі. Қазір бұл деректер жоқ.", { x: 0.6, y: 5.7, w: 12, h: 0.7, fontFace: FONT, fontSize: 15, color: C.muted });
}

// 3. Шешім
{
  const s = slide("Шешім: тапсырма беруден есепке дейінгі бір орта", "Шешім", "Ағын: мұғалім тапсырма жасайды (7 түрі), оқушы орындайды, тест түрлері автоматты бағаланады, нәтиже аналитика мен Excel/PDF есепке түседі. Маңызды шектеу: код тапсырмасын сервердегі sandbox-та автоматты тексеру ЖАСАЛМАҒАН - қазір мұғалім қолмен бағалайды. Сұрақ: 'Код автоматты тексеріле ме?' - тест түрлері иә, код орындауды сервердегі sandbox әлі жоқ (docs/SANDBOX.md).");
  const steps = [["1", "Мұғалім", "тапсырма / курс жасайды"], ["2", "Оқушы", "орындайды, жауап жібереді"], ["3", "Автоматты тест", "тест түрлері бағаланады"], ["4", "Аналитика", "сынып, оқушы, Excel/PDF"]];
  steps.forEach(([k, h, d], i) => {
    const x = 0.6 + i * 3.15;
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.1, y: 2.2, w: 0.9, h: 0.9, fill: { color: C.brand }, line: { color: C.brand } });
    s.addText(k, { x: x + 0.1, y: 2.2, w: 0.9, h: 0.9, fontFace: FONT, fontSize: 28, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    s.addText(h, { x, y: 3.25, w: 2.8, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: C.dark });
    s.addText(d, { x, y: 3.7, w: 2.8, h: 0.7, fontFace: FONT, fontSize: 14, color: C.muted, valign: "top" });
    if (i < 3) s.addShape(pptx.ShapeType.rightArrow, { x: x + 2.55, y: 2.45, w: 0.5, h: 0.4, fill: { color: C.accent }, line: { color: C.accent } });
  });
  card(s, 0.6, 4.9, 12.1, 1.5, "Ашық шектеу", "Код тапсырмасын серверде автоматты тексеру (sandbox) жасалмаған: қазір мұғалім қолмен бағалайды.", { fill: "FEF3F2", line: "FDA29B", hc: C.red });
}

// 4. Өнім
{
  const s = slide("Өнім: нақты бар функциялар", "Өнім", "Барлығы репода бар және тесттермен қамтылған (сандар 7-слайдта). 'Көмекші' - ЖАСАНДЫ ИНТЕЛЛЕКТ ЕМЕС: ережелі кеңесші, алдын ала жазылған қазақша кеңестер базасы, сыртқы сервиске сұраныс жібермейді (docs/AI-TUTOR.md). Скриншот қойылмаған: нақты мектепте көрсетілген нұсқа жоқ, демо дерек 'ДЕМО' деп белгіленеді. Сұрақ: 'Бұл LLM ба?' - жоқ, ережелі.");
  const items = [["4 рөл", "SUPER ADMIN, мектеп әкімшісі, мұғалім, оқушы"], ["7 тапсырма түрі", "автоматты тест бағалау"], ["Курс конструкторы", "сабақ, тапсырма, оқушы кабинеті"], ["Аналитика", "Excel және PDF есеп"], ["Лицензия", "STARTER / PRO / ENTERPRISE лимиттері"], ["White-label", "мектептің өз брендімен"], ["Көмекші", "ережелі кеңесші, LLM емес"], ["Пилот сұрауы", "мектеп өтінім беті және әкімші воронкасы"]];
  items.forEach(([h, d], i) => card(s, 0.6 + (i % 4) * 3.05, 1.9 + Math.floor(i / 4) * 2.2, 2.9, 2.0, h, d, { hs: 15, bs: 13 }));
  s.addText("Қазақша интерфейс. Скриншот жоқ: нақты мектепте көрсетілген нұсқа әлі жоқ.", { x: 0.6, y: 6.4, w: 12, h: 0.4, fontFace: FONT, fontSize: 13, italic: true, color: C.muted });
}

// 5. Сәулет
{
  const s = slide("Қауіпсіздік дерекқор деңгейінде", "Сәулет", "Негізгі идея: деректер оқшаулауы қолданба кодында емес, PostgreSQL-де (RLS). Оқу тек RLS арқылы, жазу тек SECURITY DEFINER функциялар арқылы. e2e/security.spec.ts автоматты тексереді: барлық public кестеде RLS бар, PUBLIC execute жоқ, search_path бекітілген. ТЕХНИКАЛЫҚ ШЕКТЕУ: Supabase Auth нақты жобада сыналмаған; Docker image құрылмаған; тәуелсіз пентест жоқ. Rate limit жадта (көп данада Redis керек).");
  const box = (x, y, w, h, t, d, fill, col = "FFFFFF") => { s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 }); s.addText([{ text: t, options: { bold: true, fontSize: 16, breakLine: true } }, { text: d, options: { fontSize: 12 } }], { x: x + 0.1, y, w: w - 0.2, h, fontFace: FONT, color: col, align: "center", valign: "middle" }); };
  box(0.6, 2.2, 2.7, 1.5, "Браузер", "қазақша UI", C.grey, C.dark);
  box(3.9, 2.2, 3.0, 1.5, "Next.js 15 + TS", "nonce-CSP, zod, rate limit", C.brand);
  box(7.5, 1.7, 2.6, 1.1, "withUser: оқу", "RLS сүзгісі", C.dark);
  box(7.5, 3.1, 2.6, 1.1, "RPC: жазу", "SECURITY DEFINER", C.dark);
  box(10.6, 2.2, 2.2, 1.5, "PostgreSQL", `RLS, ${F.code.migrationCount} миграция`, C.accent, C.dark);
  [[3.3, 2.85], [6.9, 2.85], [10.1, 2.25], [10.1, 3.65]].forEach(([x, y]) => s.addShape(pptx.ShapeType.rightArrow, { x, y, w: 0.5, h: 0.3, fill: { color: C.muted }, line: { color: C.muted } }));
  card(s, 0.6, 4.7, 5.9, 1.9, "Тексерілген", "Ішкі аудит: 20 мәселе табылып түзетілген. Автоматты e2e: RLS, PUBLIC execute, search_path.", { fill: C.soft });
  card(s, 6.8, 4.7, 5.9, 1.9, "Сыналмаған", "Тәуелсіз пентест, нақты Supabase, Docker image, жүктеме тесті.", { fill: "FEF3F2", line: "FDA29B", hc: C.red });
}

// 6. Сатысы
{
  const s = slide("Сатысы: өнім бар, тартылым жоқ", "Қазіргі күй", "Негізгі хабар: біз MVP-ден асқан прототипті жасадық, бірақ нақты мектепте сыналмаған. Пайдаланушы, табыс, төленген клиент жоқ. Инвестор сұрайтын тартылымды алу жолы - келесі слайдтардағы пилот. Демо дерек тек 'ДЕМО' белгісімен.");
  const st = [["Прототип", true], ["Ішкі аудит", true], ["Пилот (1-3 мектеп)", false], ["Баға сынағы", false], ["Алғашқы келісім", false]];
  s.addShape(pptx.ShapeType.line, { x: 1.1, y: 2.7, w: 11, h: 0, line: { color: C.line, width: 3 } });
  st.forEach(([t, d], i) => {
    const x = 0.8 + i * 2.55;
    s.addShape(pptx.ShapeType.ellipse, { x, y: 2.4, w: 0.6, h: 0.6, fill: { color: d ? C.ok : "FFFFFF" }, line: { color: d ? C.ok : C.muted, width: 2 } });
    s.addText(d ? "+" : "", { x, y: 2.4, w: 0.6, h: 0.6, fontFace: FONT, fontSize: 20, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    s.addText(t, { x: x - 0.5, y: 3.15, w: 2.2, h: 0.6, fontFace: FONT, fontSize: 14, bold: true, color: d ? C.dark : C.muted, align: "center" });
  });
  const rows = [["Көрсеткіш", "Күйі"], ["Нақты пайдаланушылар", "Жоқ"], ["Табыс", "Жоқ"], ["Төленген клиент / шарт", "Жоқ"], ["Нарықты растау", "Жүргізілмеген"]];
  s.addTable(rows.map((r, i) => r.map((t) => ({ text: t, options: { bold: i === 0, color: i === 0 ? "FFFFFF" : C.dark, fill: { color: i === 0 ? C.brand : C.grey }, fontFace: FONT, fontSize: 14 } }))), { x: 0.8, y: 4.3, w: 8, colW: [4.5, 3.5], border: { type: "solid", color: C.line, pt: 1 } });
}

// 7. Сенім сигналдары
{
  const s = slide("Сенім сигналдары: тексерілетін фактілер", "Дәлел", `Барлық сан репо мен тесттен: scripts/dataroom.mjs --json. Жолдар: src ${nf(F.code.srcLines)} жол, тест коды ${nf(F.code.testLines)} жол. Диаграмма статикалық санау (test()/it() шақырулары), циклмен жасалған тесттер бір рет есептелген, сондықтан соңғы жергілікті жүгіру саны (${lk.e2e} e2e, ${lk.db} db, ${lk.unit} unit) көп. Сұрақ: 'CI-да жасыл ма?' - нәтижесін GitHub Actions-та қарап растау керек, бұл деректе дәлелденбеген. Сұрақ: 'Тәуелсіз аудит?' - жоқ, тек ішкі аудит (20 мәселе түзетілген).`);
  s.addChart(pptx.charts.BAR, [{ name: "Соңғы жергілікті жүгіру", labels: ["E2E", "Дерекқор", "Unit"], values: [lk.e2e, lk.db, lk.unit] }, { name: "Статикалық санау", labels: ["E2E", "Дерекқор", "Unit"], values: [sc.e2e, sc.db, sc.unit] }], { x: 0.6, y: 1.8, w: 7.0, h: 4.6, barDir: "col", barGrouping: "clustered", chartColors: [C.brand, C.accent], showLegend: true, legendPos: "b", legendFontSize: 12, showValue: true, dataLabelFontSize: 12, catAxisLabelFontSize: 13, valAxisLabelFontSize: 11, valGridLine: { color: C.line, size: 0.5 }, showTitle: true, title: "Автоматты тесттер", titleFontSize: 14 });
  const k = [[`~${nf(round50(F.code.srcLines))}`, "жол TypeScript (src)"], [String(F.code.migrationCount), "миграция (PostgreSQL + RLS)"], ["20", "аудитте табылып түзетілген мәселе"], [String(F.documents.length), "құжат (репо мен лицензиялау)"]];
  k.forEach(([v, d], i) => { const y = 1.8 + i * 1.18; s.addShape(pptx.ShapeType.roundRect, { x: 8.0, y, w: 4.7, h: 1.05, fill: { color: C.soft }, line: { color: C.soft }, rectRadius: 0.08 }); s.addText(v, { x: 8.15, y, w: 1.6, h: 1.05, fontFace: FONT, fontSize: 28, bold: true, color: C.brand, valign: "middle" }); s.addText(d, { x: 9.75, y, w: 2.9, h: 1.05, fontFace: FONT, fontSize: 13, color: C.dark, valign: "middle" }); });
  s.addText("Тәуелсіз пентест жоқ. Тесттің статикалық саны циклмен жасалған тесттерді бір рет есептейді.", { x: 0.6, y: 6.5, w: 12, h: 0.4, fontFace: FONT, fontSize: 12, italic: true, color: C.muted });
}

// 8. Құжаттар
{
  const s = slide("Құжаттар мен деректер бөлмесі", "Due-diligence", "Деректер бөлмесі node scripts/dataroom.mjs арқылы бір командамен жасалады: FACTS (коммит, жолдар, тесттер), SBOM және лицензия есебі (GPL/AGPL ескертулері бөлек), npm audit қорытындысы, тәуекелдер тізімі. Құпия (.env, кілт) ешқашан кірмейді - тест бар. Лицензия есебінде LGPL (sharp-libvips, платформалық бинарлар) және қос лицензиялы jszip бөлек белгіленеді, оларды заңгер қарауы керек.");
  const rows = [["Құжат", "Мазмұны"], ["INVESTOR.md", "шынайы жағдай, тәуекелдер, жол картасы"], ["ARCHITECTURE.md / SECURITY.md", "сәулет және қауіпсіздік модельдері"], ["SECURITY-AUDIT.md", "ішкі аудит, тексерілмеген аймақтар"], ["LEGAL-REVIEW.md", "заңгерге сұрақтар (авторлық құқық, деректер)"], ["AUTHORSHIP.md", "авторлықты растау қадамдары"], ["INVESTOR-FAQ.md", "30 сұрақ пен ашық жауап"], ["Деректер бөлмесі", "FACTS, лицензия/SBOM, npm audit, тәуекелдер"]];
  s.addTable(rows.map((r, i) => r.map((t) => ({ text: t, options: { bold: i === 0, color: i === 0 ? "FFFFFF" : C.dark, fill: { color: i === 0 ? C.brand : i % 2 ? C.grey : "FFFFFF" }, fontFace: FONT, fontSize: 14 } }))), { x: 0.6, y: 1.9, w: 12.1, colW: [4.6, 7.5], border: { type: "solid", color: C.line, pt: 1 } });
  s.addText("Бір команда: node scripts/dataroom.mjs  ->  out/dataroom/", { x: 0.6, y: 6.2, w: 12, h: 0.4, fontFace: "Consolas", fontSize: 14, color: C.brand });
}

// 9. Жол картасы
{
  const s = slide("Жол картасы: тартылымға дейін", "Жол картасы", "Бұл жоспар, нәтиже емес. Әр қадамның өлшенетін нәтижесі бар. Инвестиция туралы әңгіме 2-5 қадамнан кейін мағыналы болады, өйткені сонда нақты метрика болады. Мерзімдер пилот серіктестің табылуына тәуелді; нақты күн айтпаймыз.");
  const r = [["1", "Сұрау воронкасы", "мектеп өтінімдері: нақты сан мен статус"], ["2", "Пилот", "1-3 мектеп, 6-8 апта: белсенділік, тексеру уақыты, қателер"], ["3", "Заң және қауіпсіздік", "заңгер, тәуелсіз пентест, хостинг, backup жаттығуы"], ["4", "Баға сынағы", "пилот мектептермен төлеуге дайындық"], ["5", "Инвестиция әңгімесі", "нақты метрика мен кері байланыспен"]];
  r.forEach(([k, h, d], i) => { const x = 0.6 + i * 2.45; card(s, x, 2.1, 2.3, 3.6, `${k}. ${h}`, d, { hs: 14, bs: 13, off: 1.0 }); });
  s.addText("Қадамдар жоспар: орындалмаған. Мерзім пилот серіктеске тәуелді.", { x: 0.6, y: 6.1, w: 12, h: 0.4, fontFace: FONT, fontSize: 13, italic: true, color: C.muted });
}

// 10. Бизнес-модель
{
  const s = slide("Бизнес-модель (гипотеза)", "Бизнес-модель", "Бүкіл слайд - гипотеза. Баға белгіленбеген, себебі нарықтық дәлел жоқ. Қаржылық модель шаблоны (docs/QazaqCode-financial-model.xlsx) бар, бірақ барлық болжамы бос: сіз өз гипотезаңызды енгізе аласыз. Сұрақ: 'Баға қанша?' - белгіленбеген, пилоттан кейін шығынмен және төлеуге дайындықпен есептеледі. Сұрақ: 'LTV/CAC?' - толтырылмаған.");
  tag(s, "ГИПОТЕЗА: пилотта тексеріледі", 0.6, 1.8, 4.2, C.accent);
  card(s, 0.6, 2.4, 3.9, 2.4, "Кім төлейді", "Мектеп, колледж не IT академия жылдық лицензия төлейді. Оқушы төлемейді.");
  card(s, 4.7, 2.4, 3.9, 2.4, "Лицензия деңгейлері", "STARTER: 100 оқушы / 5 мұғалім. PRO: 500 / 25. ENTERPRISE: келісім бойынша. Лимиттер өнімде жүзеге асқан.");
  card(s, 8.8, 2.4, 3.9, 2.4, "Баға", "Белгіленбеген / толтырылмаған. Нарықтық дәлел жоқ; пилоттан кейін есептеледі.", { fill: "FEF3F2", line: "FDA29B", hc: C.red });
  s.addText("Қаржылық модель шаблоны: docs/QazaqCode-financial-model.xlsx. Барлық болжам бос (гипотеза), формулалар тірі.", { x: 0.6, y: 5.2, w: 12, h: 0.6, fontFace: FONT, fontSize: 15, color: C.dark });
  s.addText("Төлем мен шот-фактура әлі жасалмаған: лицензияны қолмен береміз.", { x: 0.6, y: 5.8, w: 12, h: 0.5, fontFace: FONT, fontSize: 14, color: C.muted });
}

// 11. Нарыққа шығу
{
  const s = slide("Нарыққа шығу: пилот жоспары", "Нарыққа шығу", "Нарық көлемін айтпаймыз: зерттелмеген. Қазақстан мектептеріндегі сатып алу тәртібі (тендер, мемлекеттік бағдарламалар) және бәсекелестер зерттелмеген. Бірінші қадам - сенімді бір-үш серіктес мектеп. Өлшейтін метрикалар алдын ала жазылған, нәтиже оң болмаса да ашық жариялаймыз.");
  card(s, 0.6, 1.9, 5.9, 2.3, "Кімнен бастаймыз", "Пилот серіктестер: мектеп, колледж, IT академия. Арна: /schools бетіндегі өтінім формасы және әкімші воронкасы.");
  card(s, 6.8, 1.9, 5.9, 2.3, "Не өлшейміз", "Белсенді оқушы үлесі, тапсырма орындау үлесі, мұғалімнің тексеру уақыты, қателер, пилоттан кейінгі төлеуге дайындық.");
  card(s, 0.6, 4.4, 5.9, 2.0, "Нарық көлемі", "Белгісіз / зерттелмеген. Расталған дереккөзсіз сан келтірмейміз.", { fill: "FEF3F2", line: "FDA29B", hc: C.red });
  card(s, 6.8, 4.4, 5.9, 2.0, "Бәсекелестер", "Зерттелмеген. Жүйелі талдау пилотқа дейінгі міндеттердің бірі.", { fill: "FEF3F2", line: "FDA29B", hc: C.red });
}

// 12. Тәуекелдер
{
  const s = slide("Негізгі тәуекелдер (ашық)", "Тәуекелдер", "Ең маңыздысы - авторлық құқық: код пен контенттің охрана және иелік мәртебесін заңгер растауы керек (licensing/LEGAL-REVIEW.md §1, AUTHORSHIP.md). Екіншісі - бір адамға тәуелділік. Үшіншісі - кәмелетсіздер деректері бойынша ҚР заңы. Коммерциялық код қазір ашық репода - сатуға дейін жеке репоға көшіру керек. Мұның бәрі docs/INVESTOR.md §6 және деректер бөлмесіндегі RISKS.md-де.");
  const rows = [["Тәуекел", "Жағдайы"], ["Тартылым жоқ", "Пайдаланушы, табыс жоқ; гипотезалар тексерілмеген"], ["Авторлық құқық мәртебесі", "Заңгер растауы керек"], ["Бір адамға тәуелділік", "Команда, қолдау, сату бір адамда"], ["Дербес деректер заңы", "Мектеп оқушылары, кәмелетсіздер; заңгер консультациясы"], ["Қауіпсіздік", "Тәуелсіз пентест жоқ; нақты Supabase сыналмаған"], ["Нарық", "Сатып алу тәртібі мен бәсекелестер зерттелмеген"], ["Ашық репо", "Коммерциялық код сатуға дейін жеке репоға көшірілуі тиіс"]];
  s.addTable(rows.map((r, i) => r.map((t, j) => ({ text: t, options: { bold: i === 0 || j === 0, color: i === 0 ? "FFFFFF" : C.dark, fill: { color: i === 0 ? C.brand : i % 2 ? C.grey : "FFFFFF" }, fontFace: FONT, fontSize: 13 } }))), { x: 0.6, y: 1.8, w: 12.1, colW: [3.6, 8.5], border: { type: "solid", color: C.line, pt: 1 } });
}

// 13. Команда
{
  const s = slide("Команда: 1 негізін қалаушы", "Команда", "Ашық айтамыз: команда - бір адам (Sagid Mustafa). Бұл бір адамға тәуелділік тәуекелі (12-слайд). Ұсыныс: пилот табысты болса, бірінші жалдау - қолдау/сату және техникалық серіктес. Қаржыландыруды сомасыз категориямен ғана талқылаймыз.");
  card(s, 0.6, 1.9, 12.1, 3.0, "Негізін қалаушы", "Sagid Mustafa: идея, өнім құрылымы, талаптар, шешімдер, тексеру және қабылдау.");
  card(s, 0.6, 5.2, 12.1, 1.4, "Командадағы олқылық", "Қолдау, сату, DevOps, заң бойынша адам жоқ.", { fill: "FEF3F2", line: "FDA29B", hc: C.red });
}

// 14. Қаражат және қадамдар
{
  const s = slide("Қаражат категориялары және келесі қадамдар", "Қадамдар", "Сома жоқ, себебі шығын мен баға расталмаған. Категориялар басымдық тәртібімен. Келесі қадам инвесторға: пилот серіктес табуға көмек не интро, немесе пилот нәтижесіне дейін күту. Біз қаржыны пилот нәтижесінсіз сұрамаймыз деп уәде бермейміз, бірақ мағыналы әңгіме пилоттан кейін екенін ашық айтамыз.");
  s.addText("Қаражат категориялары (сомасыз, басымдық бойынша)", { x: 0.6, y: 1.8, w: 6, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: C.brand });
  s.addText(bullets(["Заңгерлік жұмыс: деректер, авторлық құқық, шарттар", "Тәуелсіз қауіпсіздік шолуы және инфрақұрылым", "Пилоттарды жүргізу, мектептерді оқыту, қолдау", "Код орындау ортасы (sandbox): тек шолудан кейін", "Сату және серіктестік"], { fontFace: FONT, fontSize: 15, color: C.dark, paraSpaceAfter: 6 }), { x: 0.6, y: 2.3, w: 6, h: 3.6, valign: "top" });
  s.addText("Келесі қадамдар", { x: 7.0, y: 1.8, w: 5.7, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: C.brand });
  s.addText(bullets(["Пилот серіктес мектептермен байланыс", "Заңгер консультациясы (IP, деректер)", "Деректер бөлмесін өзіңіз тексеріңіз: FACTS, лицензия, тәуекел", "Инвесторға: сұрақтар мен FAQ-ты талқылау"], { fontFace: FONT, fontSize: 15, color: C.dark, paraSpaceAfter: 6 }), { x: 7.0, y: 2.3, w: 5.7, h: 3.6, valign: "top" });
  s.addText("Бұл бет инвестициялық ұсыныс не кеңес емес. Сома, баға, нарық көлемі: толтырылмаған.", { x: 0.6, y: 6.3, w: 12, h: 0.4, fontFace: FONT, fontSize: 13, italic: true, color: C.muted });
}

await pptx.writeFile({ fileName: OUT });
console.log("Жазылды:", OUT, `(${n} слайд)`);
