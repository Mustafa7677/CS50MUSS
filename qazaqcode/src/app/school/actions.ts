"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withUser } from "@/lib/db";
import { requireSchoolAdmin } from "@/lib/context";
import { env } from "@/lib/env";
import { AppError, errorCode, errorMessage, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const str = (f: FormData, k: string) => String(f.get(k) ?? "");
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

/** Мұғалімді шақыру: токен тек осы нәтижеде бір рет қайтады */
export async function inviteTeacherAction(_: ActionResult<{ link: string }> | null, f: FormData): Promise<ActionResult<{ link: string }>> {
  const ctx = await requireSchoolAdmin();
  try {
    const p = z.object({
      email: z.union([z.literal(""), z.string().trim().toLowerCase().email().max(160)]),
      ttl: z.coerce.number().int().min(1).max(720),
    }).parse({ email: str(f, "email").trim(), ttl: str(f, "ttl") || "168" });
    await rateLimit("invite-create", 30, 15 * 60_000, ctx.userId);
    const r = await withUser(ctx.userId, (q) =>
      q<{ t: string }>("select public.create_invitation($1, 'teacher'::public.member_role, $2, $3) as t", [ctx.active.org_id, p.email || null, p.ttl]));
    revalidatePath("/school/teachers");
    return { ok: true, message: "Шақыру жасалды. Сілтемені көшіріп алыңыз.", data: { link: `${env().APP_URL.replace(/\/$/, "")}/invite/${r[0].t}` } };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("validation")) };
    return { ok: false, error: errorMessage(e) };
  }
}

async function back(path: string, key: "ok" | "err", value: string): Promise<never> {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function setTeacherStatusAction(f: FormData): Promise<void> {
  const ctx = await requireSchoolAdmin();
  let res: ["ok" | "err", string];
  try {
    const p = z.object({ user: uuid, status: z.enum(["active", "removed"]) }).parse({ user: str(f, "user_id"), status: str(f, "status") });
    await withUser(ctx.userId, async (q) => {
      // тек мұғалімдер: әкімші/оқушы күйін осы форма арқылы өзгертуге болмайды
      const m = await q("select 1 from public.organization_members where org_id = $1 and user_id = $2 and role = 'teacher'", [ctx.active.org_id, p.user]);
      if (!m.length) throw new AppError("not_found");
      await q("select public.set_member_status($1, $2, $3)", [ctx.active.org_id, p.user, p.status]);
    });
    revalidatePath("/school", "layout");
    res = ["ok", p.status === "removed" ? "removed" : "activated"];
  } catch (e) {
    res = ["err", e instanceof z.ZodError ? "validation" : errorCode(e)];
  }
  await back("/school/teachers", res[0], res[1]);
}

export async function revokeInvitationAction(f: FormData): Promise<void> {
  const ctx = await requireSchoolAdmin();
  let res: ["ok" | "err", string];
  try {
    const id = uuid.parse(str(f, "id"));
    await withUser(ctx.userId, async (q) => {
      const m = await q("select 1 from public.invitations where id = $1 and org_id = $2", [id, ctx.active.org_id]);
      if (!m.length) throw new AppError("not_found");
      await q("select public.revoke_invitation($1)", [id]);
    });
    revalidatePath("/school/teachers");
    res = ["ok", "revoked"];
  } catch (e) {
    res = ["err", e instanceof z.ZodError ? "validation" : errorCode(e)];
  }
  await back("/school/teachers", res[0], res[1]);
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "validation");
const settingsSchema = z.object({
  logo: z.string().trim().max(500).refine((v) => v === "" || (/^https:\/\//i.test(v) && URL.canParse(v)), "logo"),
  primary: hex,
  secondary: hex,
  welcome: z.string().trim().max(600),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]),
  phone: z.string().trim().max(40).regex(/^[0-9+()\-\s]*$/, "phone"),
});

export async function saveSettingsAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const ctx = await requireSchoolAdmin();
  try {
    const p = settingsSchema.parse({
      logo: str(f, "logo_url"), primary: str(f, "primary_color"), secondary: str(f, "secondary_color"),
      welcome: str(f, "welcome_text"), email: str(f, "contact_email").trim(), phone: str(f, "contact_phone"),
    });
    await withUser(ctx.userId, (q) => q("select public.update_org_settings($1, $2, $3, $4, $5, $6, $7)",
      [ctx.active.org_id, p.logo, p.primary.toLowerCase(), p.secondary.toLowerCase(), p.welcome, p.email, p.phone]));
    revalidatePath("/", "layout");
    return { ok: true, message: "Баптаулар сақталды." };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const m = e.issues[0]?.message;
      if (m === "logo") return { ok: false, error: "Логотип сілтемесі https:// деп басталуы тиіс.", field: "logo_url" };
      if (m === "phone") return { ok: false, error: "Телефонда тек сандар, +, (), - және бос орын болады.", field: "contact_phone" };
      return { ok: false, error: errorMessage(new AppError("validation")) };
    }
    return { ok: false, error: errorMessage(e) };
  }
}
