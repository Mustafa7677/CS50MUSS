"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { driver } from "@/lib/auth/drivers";
import { createSession, currentUserId, destroySession } from "@/lib/auth/session";
import { withUser } from "@/lib/db";
import { ORG_COOKIE, getContext, homeFor } from "@/lib/context";
import { AppError, errorCode, errorMessage, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const email = z.string().trim().toLowerCase().email().max(160);
const password = z.string().min(8, "weak_password").max(128);
const name = z.string().trim().min(2).max(120);

const fail = (e: unknown): ActionResult => ({ ok: false, error: errorMessage(e) });
const safeNext = (n: unknown) => (typeof n === "string" && /^\/(?!\/)[\w\-/?=&%.]*$/.test(n) ? n : "/app");
const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function loginAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  let next = "/app";
  try {
    const p = z.object({ email, password: z.string().min(1).max(128) }).parse({ email: str(f, "email"), password: str(f, "password") });
    await rateLimit("login", 10, 10 * 60_000, p.email);
    const r = await driver().signIn(p.email, p.password);
    await createSession(r.userId, r.accessToken);
    next = safeNext(f.get("next"));
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("invalid_credentials")) };
    return fail(e);
  }
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  (await cookies()).delete(ORG_COOKIE);
  redirect("/login");
}

const regSchema = z.object({ name, email, password });

/** Шақыру арқылы тіркелу (мұғалім / мектеп әкімшісі) */
export async function registerWithInviteAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const token = str(f, "token");
  let dest = "/app";
  try {
    const p = regSchema.parse({ name: str(f, "name"), email: str(f, "email"), password: str(f, "password") });
    await rateLimit("register", 8, 15 * 60_000);
    const pv = await withUser(null, (q) => q<{ email: string | null; expired: boolean }>("select email, expired from public.invitation_preview($1)", [token]));
    if (!pv[0] || pv[0].expired) throw new AppError("invite_invalid");
    if (pv[0].email && pv[0].email !== p.email) throw new AppError("invite_email_mismatch");
    const u = await driver().signUp(p.email, p.password, p.name);
    await createSession(u.userId, u.accessToken);
    try {
      await withUser(u.userId, (q) => q("select public.accept_invitation($1)", [token]));
    } catch (e) {
      // Аккаунт жасалып, сессия ашылды: қатені (мысалы, лимит) шақыру бетінде көрсетеміз
      dest = `/invite/${encodeURIComponent(token)}?e=${errorCode(e)}`;
    }
    if (dest === "/app") { const ctx = await getContext(); dest = ctx ? homeFor(ctx) : "/app"; }
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("validation")) + " Құпиясөз кемінде 8 символ." };
    return fail(e);
  }
  redirect(dest);
}

/** Сынып коды арқылы тіркелу (оқушы) */
export async function registerWithCodeAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const code = str(f, "code");
  let dest = "/student";
  try {
    const p = regSchema.parse({ name: str(f, "name"), email: str(f, "email"), password: str(f, "password") });
    await rateLimit("register", 8, 15 * 60_000);
    const pv = await withUser(null, (q) => q("select 1 from public.classroom_preview($1)", [code]));
    if (!pv.length) throw new AppError("invalid_code");
    const u = await driver().signUp(p.email, p.password, p.name);
    await createSession(u.userId, u.accessToken);
    try {
      await withUser(u.userId, (q) => q("select public.join_classroom($1)", [code]));
      const ctx = await getContext();
      dest = ctx ? homeFor(ctx) : "/student";
    } catch (e) {
      dest = `/join?code=${encodeURIComponent(code)}&e=${errorCode(e)}`;
    }
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("validation")) + " Құпиясөз кемінде 8 символ." };
    return fail(e);
  }
  redirect(dest);
}

/** Жүйеге кірген қолданушы үшін: шақыруды қабылдау */
export async function acceptInviteAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  let dest = "/app";
  try {
    const uid = await currentUserId();
    if (!uid) throw new AppError("unauthenticated");
    await rateLimit("invite-accept", 10, 15 * 60_000, uid);
    await withUser(uid, (q) => q("select public.accept_invitation($1)", [str(f, "token")]));
    const ctx = await getContext();
    dest = ctx ? homeFor(ctx) : "/app";
  } catch (e) { return fail(e); }
  redirect(dest);
}

/** Жүйеге кірген оқушы үшін: сыныпқа қосылу */
export async function joinClassAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  try {
    const uid = await currentUserId();
    if (!uid) throw new AppError("unauthenticated");
    await rateLimit("join", 15, 15 * 60_000, uid);
    const code = z.string().trim().min(6).max(12).parse(str(f, "code")).toUpperCase();
    await withUser(uid, (q) => q("select public.join_classroom($1)", [code]));
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: errorMessage(new AppError("invalid_code")) };
    return fail(e);
  }
  redirect("/student");
}

export async function switchOrgAction(f: FormData): Promise<void> {
  const ctx = await getContext();
  const id = str(f, "org_id");
  if (ctx?.memberships.some((m) => m.org_id === id)) (await cookies()).set(ORG_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/app");
}

