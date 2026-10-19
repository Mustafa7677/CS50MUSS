import { touchActivity } from "@/lib/metrics/activity";
import type { Ctx } from "@/lib/context";

/** Рөл layout-ында: қолданушы бүгін алғаш кіргенде 1 жол жазады (көрінетін нәрсе шығармайды). */
export async function ActivityTouch({ ctx }: { ctx: Pick<Ctx, "userId" | "active"> }) {
  await touchActivity(ctx.userId, ctx.active?.org_id);
  return null;
}
