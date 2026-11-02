// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17: жабық мазмұнды беретін функцияның логикасы (тәуелділіктері сырттан беріледі - тестке ыңғайлы).
//
// GET /ao-content?path=python/lectures/week-3.html   (Authorization: Bearer <пайдаланушы JWT>)
//   1. жолды тексереді (тек .html / assets/data/*.js, «..» жоқ);
//   2. ao_can_view(path)-ты ПАЙДАЛАНУШЫНЫҢ ӨЗ JWT-сімен шақырады - шешімді тек дерекқор қабылдайды;
//   3. рұқсат болса, файлды жабық Storage бакетінен service_role-мен оқып береді.
// Кэш: private, no-store - ортақ кэштер мен CDN сақтамайды.

export interface Deps {
  allowedOrigins: string[];
  canView(jwt: string, path: string): Promise<boolean>;   // false - рұқсат жоқ; throw - JWT жарамсыз
  download(path: string): Promise<string | null>;          // null - файл жоқ
}

const PATH_RE = /^(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9_.-]*\.html$|^assets\/data\/[A-Za-z0-9_.-]+\.js$/;

export function validPath(p: string | null): p is string {
  return !!p && p.length <= 200 && PATH_RE.test(p) && !p.includes("..") && !p.includes("//");
}

function cors(origin: string | null, allowed: string[]): Record<string, string> {
  const ok = origin && allowed.includes(origin) ? origin : allowed[0] ?? "";
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const h = cors(req.headers.get("Origin"), deps.allowedOrigins);
  const json = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...h, "Content-Type": "application/json", "Cache-Control": "no-store" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "GET") return json(405, "method");

  const path = new URL(req.url).searchParams.get("path");
  if (!validPath(path)) return json(400, "path");

  const auth = req.headers.get("Authorization") ?? "";
  const m = auth.match(/^Bearer\s+([A-Za-z0-9._-]+)$/);
  if (!m) return json(401, "login");

  let ok: boolean;
  try {
    ok = await deps.canView(m[1], path);
  } catch (_e) {
    return json(401, "login");
  }
  if (!ok) return json(403, "closed");

  const body = await deps.download(path);
  if (body === null) return json(404, "missing");
  const type = path.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8";
  return new Response(body, {
    status: 200,
    headers: { ...h, "Content-Type": type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
