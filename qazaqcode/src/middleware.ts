import { NextResponse, type NextRequest } from "next/server";

// Content-Security-Policy (nonce): Next.js өзінің inline-скрипттеріне nonce-ты сұраныстағы CSP тақырыбынан алады.
// Барлық бет динамикалық (cookies/headers), сондықтан nonce әр сұранысқа жаңа. 'unsafe-inline' тек стильде (style="" атрибуттары
// мен бренд <style>), скриптте жоқ. /workers/ және /vendor/ (Pyodide worker) middleware-ден тыс: оларға next.config.mjs-те өз қатаң CSP қойылған. Мақсаты: XSS болса да сыртқы скрипт/форма жібермеу, clickjacking-ті жабу.
export function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",   // курс суреттері мен логотип: тек https (дерекқор + zod тексереді)
    "media-src 'self' https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",                   // «жеке тексеру» Pyodide worker-і (/workers/py-runner.js); blob: және сыртқы көз жоқ
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.COOKIE_SECURE === "true" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("content-security-policy", csp);
  return res;
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico|workers/|vendor/).*)", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] }],
};
