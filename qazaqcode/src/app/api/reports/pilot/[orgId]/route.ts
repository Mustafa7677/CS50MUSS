import { handlePilotReport } from "@/lib/metrics/pilot-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  return handlePilotReport(req, (await params).orgId);
}
