/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // Content-Security-Policy (nonce) src/middleware.ts-те қойылады (әр сұранысқа жаңа nonce керек)
];
// Pyodide worker (public/workers, public/vendor/pyodide): оқушы коды осында орындалады. Worker-дің өз CSP-і (жауап тақырыбынан):
// тек өз көзі, WebAssembly үшін 'wasm-unsafe-eval' (unsafe-eval ЖОҚ), сыртқы желіге шығу жоқ (connect-src 'self' тек өз файлдарын алу үшін).
const workerCsp = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; base-uri 'none'; form-action 'none'";
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // standalone трассировка шрифтті (path.join(process.cwd(), ...)) жіберіп алмауы үшін айқын тізім
  outputFileTracingIncludes: { "/api/reports/**": ["./assets/fonts/**"] },
  // Docker образы үшін ғана (NEXT_OUTPUT=standalone); `next start` standalone-мен дұрыс жұмыс істемейді
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/workers/:path*", headers: [{ key: "Content-Security-Policy", value: workerCsp }, { key: "Cache-Control", value: "public, max-age=300, must-revalidate" }] },
      { source: "/vendor/pyodide/:path*", headers: [{ key: "Content-Security-Policy", value: workerCsp }, { key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
export default nextConfig;
