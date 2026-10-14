import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/Toaster";
import { THEME_INIT } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: { default: "QazaqCode Platform", template: "%s · QazaqCode" },
  description: "Мектептер мен колледждерге арналған бағдарламалауды оқыту платформасы: сыныптар, тапсырмалар, автоматты бағалау, аналитика.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e7490" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_INIT }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Негізгі мазмұнға өту</a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
