import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/Toaster";
import { THEME_INIT } from "@/components/ThemeToggle";
import { I18nProvider } from "@/lib/i18n/client";
import { catalogFor, getI18n } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "QazaqCode Platform", template: "%s · QazaqCode" },
    description: t("Мектептер мен колледждерге арналған бағдарламалауды оқыту платформасы: сыныптар, тапсырмалар, автоматты бағалау, аналитика."),
  };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e7490" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // CSP nonce (src/middleware.ts): inline-скрипт nonce-сыз бұғатталады
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head><script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">{t("Негізгі мазмұнға өту")}</a>
        <I18nProvider locale={locale} catalog={catalogFor(locale)}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
