import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserId } from "./auth/session";
import { withUser } from "./db";

export type Role = "school_admin" | "teacher" | "student";
export type Membership = { org_id: string; role: Role; org_name: string; org_slug: string; license_state: string; is_demo?: boolean };
export type Ctx = {
  userId: string;
  fullName: string;
  isPlatformAdmin: boolean;
  memberships: Membership[];
  active: Membership | null;
};

export const ORG_COOKIE = "qc_org";

/** Ағымдағы қолданушы мен оның ұйым контексті (бір сұраныста бір рет). */
export const getContext = cache(async (): Promise<Ctx | null> => {
  const userId = await currentUserId();
  if (!userId) return null;
  const c = await withUser(userId, async (q) => (await q<{ c: any }>("select public.my_context() as c"))[0].c);
  const memberships: Membership[] = c.memberships ?? [];
  const pref = (await cookies()).get(ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.org_id === pref) ?? memberships[0] ?? null;
  return { userId, fullName: c.full_name ?? "Қолданушы", isPlatformAdmin: !!c.is_platform_admin, memberships, active };
});

export async function requireContext(): Promise<Ctx> {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Рөлге сәйкес басты бет */
export function homeFor(ctx: Ctx): string {
  if (ctx.isPlatformAdmin && !ctx.active) return "/admin";
  if (ctx.active?.role === "school_admin") return "/school";
  if (ctx.active?.role === "teacher") return "/teacher";
  if (ctx.active?.role === "student") return "/student";
  if (ctx.isPlatformAdmin) return "/admin";
  return "/no-access";
}

export async function requirePlatformAdmin(): Promise<Ctx> {
  const ctx = await requireContext();
  if (!ctx.isPlatformAdmin) redirect(homeFor(ctx));
  return ctx;
}
export async function requireSchoolAdmin(): Promise<Ctx & { active: Membership }> {
  const ctx = await requireContext();
  const m = ctx.memberships.find((x) => x.role === "school_admin" && x.org_id === ctx.active?.org_id) ?? ctx.memberships.find((x) => x.role === "school_admin");
  if (!m) redirect(homeFor(ctx));
  return { ...ctx, active: m };
}
/** Мұғалім не мектеп әкімшісі (сынып пен тапсырма басқара алады) */
export async function requireStaff(): Promise<Ctx & { active: Membership }> {
  const ctx = await requireContext();
  const m = ctx.active && (ctx.active.role === "teacher" || ctx.active.role === "school_admin")
    ? ctx.active : ctx.memberships.find((x) => x.role === "teacher" || x.role === "school_admin");
  if (!m) redirect(homeFor(ctx));
  return { ...ctx, active: m };
}
export async function requireStudent(): Promise<Ctx & { active: Membership }> {
  const ctx = await requireContext();
  const m = ctx.memberships.find((x) => x.role === "student" && x.org_id === ctx.active?.org_id) ?? ctx.memberships.find((x) => x.role === "student");
  if (!m) redirect(homeFor(ctx));
  return { ...ctx, active: m };
}
