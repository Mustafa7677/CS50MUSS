"use server";
import { revalidatePath } from "next/cache";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { errorMessage, type ActionResult } from "@/lib/errors";
import { getT } from "@/lib/i18n";

/** Көмекшіні ұйымда қосу/өшіру. Ұйым ТЕК сессиядағы әкімшінің белсенді ұйымынан алынады. */
export async function setAiEnabledAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const ctx = await requireSchoolAdmin();
  try {
    const enabled = f.get("enabled") === "on";
    await withUser(ctx.userId, (q) => q("select public.set_ai_settings($1, $2)", [ctx.active.org_id, enabled]));
    revalidatePath("/school/ai"); revalidatePath("/student/ai");
    return { ok: true, message: enabled ? t("Көмекші қосылды.") : t("Көмекші өшірілді.") };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
