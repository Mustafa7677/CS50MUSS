import { handleReport } from "@/lib/reports/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handleReport(req, "school");
}
