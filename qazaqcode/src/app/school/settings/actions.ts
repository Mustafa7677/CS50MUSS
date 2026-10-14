"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";
import { buttonContrast, AA } from "@/lib/brand-color";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "color");
const schema = z.object({
  logo: z.string().max(500).refine((v) => v === "" || (/^https:\/\/[^\s<>"']+$/i.test(v) && URL.canParse(v)), "logo"),
  primary: hex,
  secondary: hex,
  welcome: z.string().max(600),
  email: z.union([z.literal(""), z.string().toLowerCase().email().max(160)]),
  phone: z.string().max(40).regex(/^[0-9+()\-\s]*$/, "phone"),
});

/** Мектеп брендингін сақтау (ұйымды ТЕК сессиядағы әкімшінің белсенді ұйымынан алады: басқа ұйымға жазу мүмкін емес). */
export async function saveBrandAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireSchoolAdmin();
  try {
    const p = schema.parse({ logo: str(f, "logo_url"), primary: str(f, "primary_color"), secondary: str(f, "secondary_color"),
      welcome: str(f, "welcome_text"), email: str(f, "contact_email"), phone: str(f, "contact_phone") });
    await withUser(ctx.userId, (q) => q("select public.update_org_settings($1, $2, $3, $4, $5, $6, $7)",
      [ctx.active.org_id, p.logo, p.primary.toLowerCase(), p.secondary.toLowerCase(), p.welcome, p.email, p.phone]));
    revalidatePath("/", "layout");
    const low = buttonContrast(p.primary) < AA;
    return { ok: true, message: low ? "Баптаулар сақталды. Назар аударыңыз: негізгі түстің контрасты төмен, батырма мәтіні қиын оқылуы мүмкін." : "Баптаулар сақталды." };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const m = e.issues[0]?.message;
      if (m === "logo") return { ok: false, error: "Логотип сілтемесі https:// деп басталатын дұрыс сілтеме болуы тиіс.", field: "logo_url" };
      if (m === "phone") return { ok: false, error: "Телефонда тек сандар, +, (), - және бос орын болады.", field: "contact_phone" };
      if (m === "color") return { ok: false, error: "Түс #rrggbb пішімінде болуы тиіс (мысалы, #0e7490).", field: "primary_color" };
      return { ok: false, error: errorMessage(new AppError("validation")) };
    }
    return { ok: false, error: errorMessage(e) };
  }
}
