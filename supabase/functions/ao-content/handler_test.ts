// © 2026 Sagid Mustafa. All Rights Reserved.
// deno test supabase/functions/ao-content/handler_test.ts
import { handle, validPath, type Deps } from "./handler.ts";

const FILES: Record<string, string> = { "python/lectures/week-0.html": "<h1>Python 0</h1>", "assets/data/quiz.js": "var Q=1;" };
const GOOD = "aaa.bbb.ccc";
function deps(allowed: string[]): Deps {
  return {
    allowedOrigins: ["https://mustafa7677.github.io"],
    canView: (jwt, path) => {
      if (jwt !== GOOD) return Promise.reject(new Error("bad jwt"));
      return Promise.resolve(allowed.includes(path));
    },
    download: (path) => Promise.resolve(FILES[path] ?? null),
  };
}
const req = (path: string, jwt?: string, method = "GET") =>
  new Request("https://x.supabase.co/functions/v1/ao-content?path=" + encodeURIComponent(path), {
    method, headers: { Origin: "https://mustafa7677.github.io", ...(jwt ? { Authorization: "Bearer " + jwt } : {}) },
  });
function eq(a: unknown, b: unknown, msg: string) { if (a !== b) throw new Error(`${msg}: ${a} !== ${b}`); }

Deno.test("жолды тексеру", () => {
  for (const p of ["python/lectures/week-0.html", "exam.html", "assets/data/quiz.js", "math/lectures/week-12.html"]) eq(validPath(p), true, p);
  for (const p of ["../secret.html", "python/../x.html", "/etc/passwd", "a//b.html", "assets/data/../x.js", "x.php", "assets/js/main.js", ""]) eq(validPath(p), false, p);
});

Deno.test("кірмеген - 401, рұқсатсыз - 403, рұқсатты - 200", async () => {
  const d = deps(["python/lectures/week-0.html"]);
  eq((await handle(req("python/lectures/week-0.html"), d)).status, 401, "jwt жоқ");
  eq((await handle(req("python/lectures/week-0.html", "forged.jwt.x"), d)).status, 401, "жалған jwt");
  eq((await handle(req("assets/data/quiz.js", GOOD), d)).status, 403, "ашылмаған файл");
  const ok = await handle(req("python/lectures/week-0.html", GOOD), d);
  eq(ok.status, 200, "ашық бет");
  eq(await ok.text(), "<h1>Python 0</h1>", "мазмұн");
  eq(ok.headers.get("Cache-Control"), "private, no-store", "кэш");
  eq(ok.headers.get("Content-Type"), "text/html; charset=utf-8", "тип");
});

Deno.test("жол айласы мен әдіс", async () => {
  const d = deps(["python/lectures/week-0.html"]);
  eq((await handle(req("python/../python/lectures/week-0.html", GOOD), d)).status, 400, "..");
  eq((await handle(req("python/lectures/week-0.html", GOOD, "POST"), d)).status, 405, "POST");
  eq((await handle(req("python/lectures/week-0.html", undefined, "OPTIONS"), d)).status, 204, "preflight");
});

Deno.test("рұқсат бар, файл жоқ - 404; бөтен Origin жауапқа шықпайды", async () => {
  const d = deps(["python/lectures/week-9.html"]);
  eq((await handle(req("python/lectures/week-9.html", GOOD), d)).status, 404, "жоқ файл");
  const r = new Request("https://x/f?path=python/lectures/week-9.html", { headers: { Origin: "https://evil.example", Authorization: "Bearer " + GOOD } });
  eq((await handle(r, d)).headers.get("Access-Control-Allow-Origin"), "https://mustafa7677.github.io", "CORS");
});
