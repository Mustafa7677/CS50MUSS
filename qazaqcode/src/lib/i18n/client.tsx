"use client";
// Клиент компоненттері үшін: <I18nProvider> түбірде (layout.tsx), ішінде useT() / useLocale().
import { createContext, useContext, useMemo } from "react";
import { makeT, type Catalog, type Locale, type TFn } from "./core";

const Ctx = createContext<{ locale: Locale; t: TFn }>({ locale: "kk", t: makeT("kk", {}) });

export function I18nProvider({ locale, catalog, children }: { locale: Locale; catalog: Catalog; children: React.ReactNode }) {
  const v = useMemo(() => ({ locale, t: makeT(locale, catalog) }), [locale, catalog]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export const useT = (): TFn => useContext(Ctx).t;
export const useLocale = (): Locale => useContext(Ctx).locale;
