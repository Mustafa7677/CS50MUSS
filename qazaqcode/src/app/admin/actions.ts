"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError, errorMessage, type ActionResult } from "@/lib/errors";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => { const v = str(f, k); return v === "" ? null : Number(v); };
const plan = z.enum(["starter", "pro", "enterprise"]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function uid(): Promise<string> {
  const u = await currentUserId();
  if (!u) throw new AppError("unauthenticated");
  return u;
}
const inviteLink = (token: string) => `${env().APP_URL.replace(/\/$/, "")}/invite/${token}`;

export async function createOrganizationAction(_: ActionResult | null, f: FormData): Promise<ActionResult<{ link: string }>> {
  try {
    const p = z.object({
      name: z.string().min(2).max(160), slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/), plan, valid_until: date,
    }).parse({ name: str(f, "name"), slug: str(f, "slug").toLowerCase(), plan: str(f, "plan"), valid_until: str(f, "valid_until") });
    const ms = num(f, "max_students"), mt = num(f, "max_teachers");
    const r = await withUser(await uid(), (q) => q<{ r: { org_id: string; admin_invite_token: string } }>(
      "select public.create_organization($1,$2,$3::license_plan,$4::date,$5::int,$6::int) as r", [p.name, p.slug, p.plan, p.valid_until, ms, mt]));
    revalidatePath("/admin");
    return { ok: true, message: "Мектеп тіркелді. Мектеп әкімшісіне шақыру сілтемесін жіберіңіз (ол тек қазір көрсетіледі).", data: { link: inviteLink(r[0].r.admin_invite_token) } };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Деректер дұрыс емес: атауы 2+ символ, slug тек кішкентай латын әріп/сан/сызықша (3-40), күні толтырылған болуы тиіс." };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function setLicenseAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const p = z.object({
      org: z.string().uuid(), plan, valid_until: date, status: z.enum(["active", "suspended"]),
      max_students: z.number().int().min(0).max(100000), max_teachers: z.number().int().min(0).max(10000),
    }).parse({ org: str(f, "org"), plan: str(f, "plan"), valid_until: str(f, "valid_until"), status: str(f, "status"), max_students: num(f, "max_students"), max_teachers: num(f, "max_teachers") });
    await withUser(await uid(), (q) => q("select public.set_license($1,$2::license_plan,$3,$4,$5::date,$6,$7)",
      [p.org, p.plan, p.max_students, p.max_teachers, p.valid_until, p.status, str(f, "notes") || null]));
    revalidatePath("/admin"); revalidatePath(`/admin/orgs/${p.org}`);
    return { ok: true, message: "Лицензия жаңартылды." };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Лицензия деректері дұрыс емес (лимиттер - бүтін сан, күн толтырылған)." };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function setOrgStatusAction(f: FormData): Promise<void> {
  const org = z.string().uuid().parse(str(f, "org")); const status = z.enum(["active", "suspended"]).parse(str(f, "status"));
  await withUser(await uid(), (q) => q("select public.set_org_status($1,$2)", [org, status]));
  revalidatePath("/admin"); revalidatePath(`/admin/orgs/${org}`);
}

/** Лицензия мерзімін ұзарту (қолданыстағы мерзімнен не бүгіннен, қайсысы кеш): +N ай. */
export async function extendLicenseAction(f: FormData): Promise<void> {
  const org = z.string().uuid().parse(str(f, "org")); const months = z.coerce.number().int().min(1).max(60).parse(str(f, "months"));
  await withUser(await uid(), (q) => q("select public.extend_license($1,$2)", [org, months]));
  revalidatePath("/admin"); revalidatePath(`/admin/orgs/${org}`);
}

export async function inviteSchoolAdminAction(_: ActionResult | null, f: FormData): Promise<ActionResult<{ link: string }>> {
  try {
    const org = z.string().uuid().parse(str(f, "org"));
    const email = str(f, "email").toLowerCase() || null;
    const t = await withUser(await uid(), (q) => q<{ t: string }>("select public.create_invitation($1,'school_admin',$2,336) as t", [org, email]));
    return { ok: true, message: "Шақыру жасалды (14 күн жарамды). Сілтеме тек қазір көрсетіледі.", data: { link: inviteLink(t[0].t) } };
  } catch (e) { return { ok: false, error: errorMessage(e) }; }
}
