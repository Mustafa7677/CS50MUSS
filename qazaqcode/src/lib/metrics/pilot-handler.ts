import { getContext } from "@/lib/context";
import { errorCode } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { parseRange } from "@/lib/reports/range";
import { buildPdf } from "@/lib/reports/pdf";
import { buildXlsx } from "@/lib/reports/xlsx";
import { almatyToday, auditMetricsExport, pilotReport, shiftDay } from "./queries";
import { buildPilotReport } from "./pilot";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_DAYS = 28;
const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
const MIME = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", pdf: "application/pdf" } as const;

/**
 * Пилот есебі: SUPER ADMIN не сол ұйымның мектеп әкімшісі. Құқықты дерекқор (pilot_report) шешеді, мұнда тек алдын ала тексеру.
 * Тек жиынтық дерек: SUPER ADMIN жеке оқушы деректерін көрмейді. Экспорт аудит журналына жазылады (журналсыз файл берілмейді).
 */
export async function handlePilotReport(req: Request, orgId: string): Promise<Response> {
  try {
    const ctx = await getContext();
    if (!ctx) return text(401, "Жүйеге кіріңіз.");
    if (!UUID_RE.test(orgId)) return text(404, "Табылмады.");
    if (!ctx.isPlatformAdmin && !ctx.memberships.some((m) => m.role === "school_admin" && m.org_id === orgId)) return text(403, "Рұқсат жоқ.");

    await rateLimit("pilot-report", 10, 60_000, ctx.userId);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") ?? "pdf";
    if (format !== "xlsx" && format !== "pdf") return text(400, "format параметрі xlsx не pdf болуы тиіс.");
    const today = almatyToday();
    const r = parseRange(url.searchParams.get("from"), url.searchParams.get("to"), today);
    if (!r.ok) return text(400, r.error);
    const range = r.range ?? { from: shiftDay(today, -(DEFAULT_DAYS - 1)), to: today };

    const data = await pilotReport(ctx.userId, orgId, range.from, range.to);
    await auditMetricsExport(ctx.userId, orgId, format === "pdf" ? "pilot_pdf" : "pilot_xlsx");
    const report = buildPilotReport(data);
    const body = format === "xlsx" ? await buildXlsx(report) : await buildPdf(report);
    return new Response(new Uint8Array(body), {
      headers: {
        "content-type": MIME[format],
        "content-disposition": `attachment; filename="${report.fileBase}-${orgId.slice(0, 8)}-${range.to}.${format}"`,
        "content-length": String(body.length),
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    const code = errorCode(e);
    if (code === "rate_limited") return text(429, "Тым жиі сұраныс. Біраздан кейін қайталаңыз.");
    if (code === "forbidden") return text(403, "Рұқсат жоқ.");
    if (code === "not_found") return text(404, "Табылмады.");
    if (code === "invalid_range") return text(400, "Күн аралығы дұрыс емес (ең көбі 366 күн).");
    console.error("[qazaqcode] пилот есебі қатесі:", e);
    return text(500, "Есепті жасау мүмкін болмады.");
  }
}
