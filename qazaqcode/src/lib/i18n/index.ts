// Серверлік i18n: ағымдағы тілді анықтау (cookie qc_lang -> профиль -> Accept-Language -> kk) және t().
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { currentUserId } from "../auth/session";
import { withUser } from "../db";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, localeFromAcceptLanguage, makeT, type Catalog, type Locale, type TFn } from "./core";
import { ru } from "./ru";

export * from "./core";

const CATALOGS: Record<Locale, Catalog> = { kk: {}, ru };
export const catalogFor = (l: Locale): Catalog => CATALOGS[l];

/** Ағымдағы сұраныстың тілі. Cookie тек whitelist (kk|ru) мәнін қабылдайды. */
export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLocale(c)) return c;
  try {
    const uid = await currentUserId();
    if (uid) {
      const r = await withUser(uid, (q) => q<{ locale: string }>("select locale from public.profiles where id = auth.uid()"));
      if (isLocale(r[0]?.locale) && r[0].locale !== DEFAULT_LOCALE) return r[0].locale as Locale;
    }
  } catch { /* профиль оқылмаса - Accept-Language */ }
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export const getT = cache(async (): Promise<TFn> => {
  const l = await getLocale();
  return makeT(l, CATALOGS[l]);
});

/** Бір шақырумен: { locale, t } */
export async function getI18n(): Promise<{ locale: Locale; t: TFn }> {
  const locale = await getLocale();
  return { locale, t: makeT(locale, CATALOGS[locale]) };
}
