import { handleReport } from "@/lib/reports/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  return handleReport(req, "class", classId);
}
