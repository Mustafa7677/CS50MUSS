// i18n өзегі: таза (cookies/headers жоқ) - сервер де, клиент те, тесттер де қолдана алады.
// Кілт = қазақша бастапқы мәтін (kk режимі байт-байт сол күйінде); ru - src/lib/i18n/ru.ts каталогында.
// Каталогта жоқ кілт -> қазақша мәтін (fallback), сондықтан аударылмаған бет сынбайды.

export const LOCALES = ["kk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "kk";
export const LANG_COOKIE = "qc_lang";
/** Орыс тілі әлі бета: тіл ауыстырғышта «бета» белгісі көрінеді. Толық аударылғанда false қылыңыз. */
export const I18N_BETA = true;

export const isLocale = (v: unknown): v is Locale => v === "kk" || v === "ru";
export const toLocale = (v: unknown): Locale => (isLocale(v) ? v : DEFAULT_LOCALE);

export type Params = Record<string, string | number | null | undefined>;
export type TFn = ((key: string, params?: Params) => string) & { readonly locale: Locale };
export type Catalog = Record<string, string>;

/** Көптік санат: kk - көптік жоқ (әрқашан other); ru - 1 / 2-4 / 5+ (one / few / many). */
export function pluralCategory(locale: Locale, n: number): "one" | "few" | "many" | "other" {
  if (locale !== "ru") return "other";
  if (!Number.isInteger(n)) return "other";
  const a = Math.abs(n), m10 = a % 10, m100 = a % 100;
  if (m10 === 1 && m100 !== 11) return "one";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "few";
  return "many";
}

function matchBrace(s: string, open: number): number {
  let d = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "{") d++;
    else if (s[i] === "}" && --d === 0) return i;
  }
  return -1;
}

/** Жеңіл ICU: {name} және {n, plural, one {# ..} few {# ..} many {# ..} other {# ..}}. params жоқ болса мәтін өзгермейді. */
export function interpolate(locale: Locale, tpl: string, params?: Params): string {
  if (!params || !tpl.includes("{")) return tpl;
  let out = "";
  let i = 0;
  while (i < tpl.length) {
    const ch = tpl[i];
    if (ch !== "{") { out += ch; i++; continue; }
    const end = matchBrace(tpl, i);
    if (end < 0) { out += tpl.slice(i); break; }
    const inner = tpl.slice(i + 1, end);
    const pm = /^\s*([A-Za-z_]\w*)\s*,\s*plural\s*,([\s\S]*)$/.exec(inner);
    if (pm) {
      const n = Number(params[pm[1]] ?? 0);
      const forms: Record<string, string> = {};
      const body = pm[2];
      let j = 0;
      while (j < body.length) {
        const m = /\s*([A-Za-z_=0-9]+)\s*\{/.exec(body.slice(j));
        if (!m) break;
        const open = j + m[0].length - 1;
        const close = matchBrace(body, open);
        if (close < 0) break;
        forms[m[1]] = body.slice(open + 1, close);
        j = close + 1;
      }
      const f = forms[`=${n}`] ?? forms[pluralCategory(locale, n)] ?? forms.other ?? forms.many ?? "";
      out += interpolate(locale, f.replace(/#/g, String(n)), params);
    } else if (/^[A-Za-z_]\w*$/.test(inner) && inner in params) {
      out += String(params[inner] ?? "");
    } else {
      out += tpl.slice(i, end + 1);
    }
    i = end + 1;
  }
  return out;
}

export function makeT(locale: Locale, dict: Catalog): TFn {
  const t = (key: string, params?: Params) => {
    const v = locale === "kk" ? key : dict[key];
    return interpolate(locale, v ? v : key, params);
  };
  return Object.assign(t, { locale });
}

/** Жолды аудармай белгілеу (құрам/кестедегі тұрақтылар үшін): шығарып алу скрипті кілтті табады, мәтін өзгермейді. */
export const N = (key: string): string => key;

/** Accept-Language: ең жоғары басымды тіл ru болса ғана ru, әйтпесе kk. */
export function localeFromAcceptLanguage(h: string | null | undefined): Locale {
  if (!h) return DEFAULT_LOCALE;
  let best: { tag: string; q: number } | null = null;
  for (const part of h.split(",")) {
    const [tagRaw, ...ps] = part.trim().split(";");
    const tag = tagRaw.trim().toLowerCase();
    if (!tag || tag === "*") continue;
    const qp = ps.map((x) => x.trim()).find((x) => x.startsWith("q="));
    const q = qp ? Number(qp.slice(2)) : 1;
    if (!Number.isFinite(q) || q <= 0) continue;
    if (!best || q > best.q) best = { tag, q };
  }
  if (!best) return DEFAULT_LOCALE;
  return best.tag === "ru" || best.tag.startsWith("ru-") ? "ru" : DEFAULT_LOCALE;
}

/** Каталог кілттерінің {плейсхолдер} аттары (plural-дың санағышы да кіреді) - паритет тесті үшін. */
export function placeholders(tpl: string): string[] {
  const names = new Set<string>();
  const scan = (s: string) => {
    let i = 0;
    while (i < s.length) {
      if (s[i] !== "{") { i++; continue; }
      const end = matchBrace(s, i);
      if (end < 0) break;
      const inner = s.slice(i + 1, end);
      const pm = /^\s*([A-Za-z_]\w*)\s*,\s*plural\s*,([\s\S]*)$/.exec(inner);
      if (pm) { names.add(pm[1]); scan(pm[2]); }
      else if (/^[A-Za-z_]\w*$/.test(inner)) names.add(inner);
      i = end + 1;
    }
  };
  scan(tpl);
  return [...names].sort();
}
