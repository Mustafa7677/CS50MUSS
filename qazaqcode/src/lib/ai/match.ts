// Сәйкестендіру: сұрақ/қате мәтінін кеңестер базасындағы жазбамен байланыстырады (ұпай жүйесі).
// Таза модуль (тәуелділіксіз). Ешқандай сыртқы сұраныс жоқ: бәрі осы процесте, деректер сыртқа шықпайды.

export type KbEntry = {
  id: string; group: "topic" | "error" | "method"; lang: string; title: string; keywords: string[]; patterns?: string[]; err?: string;
  explain: string; steps: string[]; ask: string[]; example?: string; read: string[];
};
export type Lesson = { id: string; courseId: string; title: string; courseTitle: string };
/** ТЕК осы өрістер модуль контекстіне кіреді. Жауап кілті, жасырын тест, басқа оқушылар деректері, аты/e-mail - ЕШҚАШАН. */
export type AssignmentCtx = { title: string; description: string; kind: string };
export type AdviseInput = {
  question: string;
  code?: string | null;
  assignment?: AssignmentCtx | null;
  lessons?: Lesson[];
  topicId?: string | null;
};
export type ReadLink = { title: string; course: string; href: string };
export type Card = {
  kind: "answer" | "fallback" | "intro" | "refuse";
  entryId: string | null;
  title: string;
  notes: string[];
  explain: string;
  steps: string[];
  ask: string[];
  example: string | null;
  read: ReadLink[];
  related: { id: string; title: string }[];
  askTeacher: boolean;
};
export type AdviseOpts = { fallbackId: string; chipIds: string[] };

export const MAX_QUESTION = 1000;
export const MAX_CODE = 6000;
export const MAX_DESC = 3000;

const MAP: Record<string, string> = {
  "ә": "а", "ғ": "г", "қ": "к", "ң": "н", "ө": "о", "ү": "у", "ұ": "у", "һ": "х", "і": "и", "ы": "и", "ё": "е", "й": "и", "э": "е",
  "ä": "a", "ö": "o", "ü": "u", "ş": "s", "ç": "c", "ğ": "g", "ı": "i", "ñ": "n", "ə": "a", "ё́": "е",
};
// eslint-disable-next-line no-control-regex
const CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩﻿]/g;

export function stripControl(s: string): string {
  return s.replace(/\r\n?/g, "\n").replace(CTRL, "");
}
/** Нормализация: кіші әріп + қазақ әріптерін негізгі әріпке жуықтау (ә→а, қ→к ...). */
export function fold(s: string): string {
  let out = "";
  for (const ch of stripControl(s).toLowerCase()) out += MAP[ch] ?? ch;
  return out;
}
const tokens = (folded: string) => folded.split(/[^\p{L}\p{N}_]+/u).filter(Boolean);

type Prepared = { folded: string; padded: string; toks: string[]; tokSet: Set<string> };
function prep(s: string): Prepared {
  const folded = fold(s);
  const toks = tokens(folded);
  return { folded, padded: ` ${folded.replace(/\s+/g, " ")} `, toks, tokSet: new Set(toks) };
}

function kwHit(p: Prepared, kwRaw: string): boolean {
  const kw = fold(kwRaw);
  const bare = kw.trim();
  if (!bare) return false;
  const isWord = /^[\p{L}\p{N}_]+$/u.test(kw); // шеттерінде бос орын не белгі жоқ
  if (isWord && bare.length <= 3) {
    return /^[a-z0-9_]+$/.test(bare) ? p.tokSet.has(bare) : p.toks.some((t) => t.startsWith(bare));
  }
  return p.padded.includes(kw);
}

function errNameOf(text: string): string | null {
  const re = /\b([A-Z][A-Za-z]*(?:Error|Exception))\b/g;
  let m: RegExpExecArray | null; let last: string | null = null;
  while ((m = re.exec(text))) last = m[1];
  return last;
}

const KIND_LANG: Record<string, string> = { python: "python", sql: "sql", javascript: "javascript", html_css: "html_css" };

export function scoreEntry(e: KbEntry, q: Prepared, rawQ: string, code: Prepared | null, kindLang: string | null, errName: string | null): number {
  let s = 0;
  for (const k of e.keywords) if (kwHit(q, k)) s += fold(k).trim().length >= 6 ? 3 : 2;
  for (const pat of e.patterns ?? []) { try { if (new RegExp(pat, "i").test(rawQ)) s += 6; } catch { /* қате regex еленбейді */ } }
  if (errName && e.err && e.err.toLowerCase() === errName.toLowerCase()) s += 30;
  if (s > 0 && code) { let c = 0; for (const k of e.keywords) if (c < 5 && kwHit(code, k)) c++; s += c * 0.4; }
  if (s > 0 && kindLang) {
    if (e.lang === kindLang) s += 2;
    else if (e.lang !== "general") s -= 2;
  }
  return s;
}

const mk = (src: string) => new RegExp(fold(src), "u");
const SOLUTION = [
  "шешимин\\s*(айт|жаз|бер|корсет)", "шешим\\w*\\s*(бер|жазып)", "кодин\\s*жаз", "кодты\\s*жаз", "жазып\\s*бер", "орындап\\s*бер", "дайын\\s*(жауап|код|шешим|программа)",
  "жауабин\\s*(айт|жаз|бер)", "жауабы\\s*кандай", "жауабин\\s*коре", "\\bтолик\\s*(код|шешим|жауап)", "\\bрешени", "напиши\\s*(мне\\s*)?(код|программ|функци)", "дай\\s*(мне\\s*)?(ответ|код|решение)",
  "write\\s+(me\\s+)?(the\\s+|a\\s+)?(code|program|solution|function)", "give\\s+me\\s+(the\\s+)?(answer|code|solution)", "solve\\s+(it|this)", "what\\s+is\\s+the\\s+answer", "\\bfull\\s+solution", "do\\s+my\\s+(homework|assignment)", "тапсырманы\\s*орында",
].map(mk);
const UNSAFE = [
  "вирус\\s*(жаз|жаса)", "хакер", "взлом", "\\bhack", "кейлоггер", "keylogger", "ddos", "парол\\w*\\s*(бузу|бузып|ури)", "аккаунт\\w*\\s*(бузу|кир|ури)", "ури[пл]", "ұрла", "шпион", "malware", "троян",
  "бомб\\w*\\s*жаса", "найти\\s+пароль", "украсть",
].map(mk);
const GREETING = /^(сәлем|салем|сәлеметсіз|ассалау|привет|здравствуй|hello|hi|hey|помогите|көмектес)\W*(көмекші|помощник)?\W*$/iu;

export function wantsSolution(text: string): boolean {
  const f = fold(text);
  return SOLUTION.some((re) => re.test(f));
}
export function looksUnsafe(text: string): boolean {
  const f = fold(text);
  return UNSAFE.some((re) => re.test(f));
}

function readLinks(e: KbEntry, lessons: Lesson[]): ReadLink[] {
  const terms = e.read.map((t) => fold(t).trim()).filter((t) => t.length >= 3);
  const scored: { l: Lesson; n: number }[] = [];
  for (const l of lessons) {
    const t = fold(l.title);
    const n = terms.filter((x) => t.includes(x)).length;
    if (n > 0) scored.push({ l, n });
  }
  scored.sort((a, b) => b.n - a.n);
  return scored.slice(0, 3).map(({ l }) => ({ title: l.title, course: l.courseTitle, href: `/student/courses/${l.courseId}?lesson=${l.id}` }));
}

function toCard(e: KbEntry, kind: Card["kind"], lessons: Lesson[], entries: KbEntry[], related: KbEntry[], notes: string[], askTeacher: boolean): Card {
  void entries;
  return {
    kind, entryId: e.id, title: e.title, notes, explain: e.explain, steps: e.steps, ask: e.ask, example: e.example ?? null,
    read: readLinks(e, lessons), related: related.map((r) => ({ id: r.id, title: r.title })), askTeacher,
  };
}

const NOTE_SOLUTION = "Дайын шешім немесе толық код бере алмаймын: өзің жазғанда ғана үйренесің. Төмендегі қадамдардан бастап көр, қиналсаң, нақты қай жерде тұрып қалғаныңды жаз.";
const NOTE_QUIZ = "Бұл тест тапсырмасы: дұрыс жауапты не нұсқаны айтпаймын, тек тақырыпты түсінуге көмектесемін.";
const NOTE_CODE_TRIM = "Кодың көп болғандықтан, тек бірінші бөлігі қаралды.";

/** Басты функция. Таза: дерекқорсыз, желісіз. */
export function advise(input: AdviseInput, entries: KbEntry[], opts: AdviseOpts): Card {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const fallback = byId.get(opts.fallbackId) ?? entries[0];
  const lessons = input.lessons ?? [];
  const question = stripControl(input.question ?? "").trim().slice(0, MAX_QUESTION);
  const notes: string[] = [];
  const a = input.assignment ?? null;
  const kindLang = a ? KIND_LANG[a.kind] ?? null : null;
  if (a?.kind === "quiz") notes.push(NOTE_QUIZ);
  const askedSolution = wantsSolution(question);
  if (askedSolution) notes.unshift(NOTE_SOLUTION);

  // 1) тақырып чипі
  if (input.topicId && byId.has(input.topicId)) {
    const e = byId.get(input.topicId)!;
    return toCard(e, "answer", lessons, entries, [], notes, false);
  }
  // 2) қауіпті сұрақ
  if (looksUnsafe(question)) {
    return {
      kind: "refuse", entryId: null, title: "Бұл сұраққа көмектесе алмаймын", notes: [],
      explain: "Басқа адамның деректеріне, аккаунтына кіруге не зиянды бағдарлама жасауға байланысты сұрақтарға көмектеспеймін. Ол заңсыз әрі басқаға зиян келтіреді.",
      steps: ["Бағдарламалауды жақсы көрсең, қауіпсіздік тақырыбын мұғалімнен сұра: қорғану жолдарын заңды түрде үйренуге болады.", "Ал оқу тапсырмаң бойынша сұрағың болса, сол тақырыпты жаз."],
      ask: [], example: null, read: [], related: [], askTeacher: false,
    };
  }
  // 3) сәлемдесу / бос сұрақ
  if (!question || GREETING.test(question)) {
    const chips = opts.chipIds.map((id) => byId.get(id)).filter((x): x is KbEntry => !!x).slice(0, 6);
    return {
      kind: "intro", entryId: null, title: "Сәлем! Мен QazaqCode Көмекшімін", notes,
      explain: "Мен жасанды интеллект емеспін: алдын ала жазылған кеңестер негізінде жұмыс істеймін. Тақырыпты түсіндіре аламын, қатені қалай іздеуді айта аламын, бірақ дайын шешім бермеймін.",
      steps: ["Сұрағыңды жаз немесе қате хабарламасын қой (Traceback-тің соңғы жолы жеткілікті).", "Не болып жатқанын және не күткеніңді қысқа сипатта.", "Төмендегі тақырыптардың бірін таңдауға да болады."],
      ask: [], example: null, read: [], related: chips.map((c) => ({ id: c.id, title: c.title })), askTeacher: false,
    };
  }

  const q = prep(question);
  const rawCode = typeof input.code === "string" ? stripControl(input.code) : "";
  const code = rawCode.trim() ? prep(rawCode.slice(0, MAX_CODE)) : null;
  if (rawCode.length > MAX_CODE) notes.push(NOTE_CODE_TRIM);
  const errName = errNameOf(question);

  const rank = (p: Prepared, raw: string, withCode: Prepared | null) =>
    entries.map((e) => ({ e, s: scoreEntry(e, p, raw, withCode, kindLang, errName) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s);

  let ranked = rank(q, question, code);
  const THRESH = 2;
  if (!ranked.length || ranked[0].s < THRESH) {
    // сұрақ анық емес: тапсырма атауы мен сипаттамасы бойынша тақырыпты болжау
    if (a) {
      const ctxText = `${a.title}\n${a.description.slice(0, MAX_DESC)}`;
      const r2 = rank(prep(ctxText), ctxText, null).filter((x) => x.e.group === "topic");
      if (r2.length && r2[0].s >= THRESH) {
        const best = r2[0].e;
        notes.push("Сұрағың жалпы болғандықтан, тапсырмаңның тақырыбына қарай кеңес бердім. Нақтырақ сұрасаң, дәлірек көмектесемін.");
        const rel = r2.slice(1, 3).filter((x) => x.s >= r2[0].s * 0.5).map((x) => x.e);
        return toCard(best, "answer", lessons, entries, rel, notes, false);
      }
    }
    notes.push("Сұрағыңа дәл сәйкес келетін тақырып таба алмадым. Төменде кез келген қатені іздеудің жалпы жолы берілген. Қате хабарламасын не кодыңның қысқа бөлігін қосып қайта жазсаң, дәлірек көмектесемін.");
    notes.push("Әлі де түсініксіз болса, мұғалімнен сұра: нақты қай жерде тұрып қалғаныңды көрсет.");
    const chips = opts.chipIds.map((id) => byId.get(id)).filter((x): x is KbEntry => !!x && x.id !== fallback.id).slice(0, 5);
    return toCard(fallback, "fallback", lessons, entries, chips, notes, true);
  }

  const best = ranked[0];
  const rel = ranked.slice(1).filter((x) => x.s >= Math.max(THRESH, best.s * 0.5)).slice(0, 2).map((x) => x.e);
  return toCard(best.e, "answer", lessons, entries, rel, notes, false);
}
