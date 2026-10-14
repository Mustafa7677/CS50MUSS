import { getContext, type Ctx } from "@/lib/context";
import { errorCode } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { loadClassReport, loadSchoolReport } from "./data";
import { parseRange } from "./range";
import { buildPdf } from "./pdf";
import { buildXlsx } from "./xlsx";
import type { Report } from "./types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

const MIME = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

async function render(report: Report, format: "xlsx" | "pdf", suffix: string): Promise<Response> {
  const body = format === "xlsx" ? await buildXlsx(report) : await buildPdf(report);
  const day = report.generatedAt.toISOString().slice(0, 10);
  const name = `${report.fileBase}${suffix ? `-${suffix}` : ""}-${day}.${format}`;
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": MIME[format],
      "content-disposition": `attachment; filename="${name}"`,
      "content-length": String(body.length),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

/** Ортақ: сессия -> құқық -> rate limit -> параметрлер -> дерек -> файл. Қателер JSON-сыз, қарапайым мәтін. */
export async function handleReport(req: Request, kind: "school" | "class", classId?: string): Promise<Response> {
  try {
    const ctx: Ctx | null = await getContext();
    if (!ctx) return text(401, "Жүйеге кіріңіз.");

    const admin = ctx.memberships.find((m) => m.role === "school_admin" && m.org_id === ctx.active?.org_id) ?? ctx.memberships.find((m) => m.role === "school_admin");
    if (kind === "school" && !admin) return text(403, "Рұқсат жоқ.");
    if (kind === "class" && (!classId || !UUID_RE.test(classId))) return text(404, "Табылмады.");
    if (kind === "class" && !ctx.memberships.some((m) => m.role === "school_admin" || m.role === "teacher")) return text(403, "Рұқсат жоқ.");

    await rateLimit("report", 20, 60_000, ctx.userId);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") ?? "xlsx";
    if (format !== "xlsx" && format !== "pdf") return text(400, "format параметрі xlsx не pdf болуы тиіс.");
    const r = parseRange(url.searchParams.get("from"), url.searchParams.get("to"));
    if (!r.ok) return text(400, r.error);

    if (kind === "school") {
      const report = await loadSchoolReport(ctx.userId, admin!, r.range);
      return await render(report, format, "");
    }
    const res = await loadClassReport(ctx, classId!, r.range);
    if (res.status === "not_found") return text(404, "Табылмады.");
    if (res.status === "forbidden") return text(403, "Рұқсат жоқ.");
    return await render(res.report, format, classId!.slice(0, 8));
  } catch (e) {
    const code = errorCode(e);
    if (code === "rate_limited") return text(429, "Тым жиі сұраныс. Біраздан кейін қайталаңыз.");
    if (code === "forbidden") return text(403, "Рұқсат жоқ.");
    console.error("[qazaqcode] есеп қатесі:", e);
    return text(500, "Есепті жасау мүмкін болмады.");
  }
}
