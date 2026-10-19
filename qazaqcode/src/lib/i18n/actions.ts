"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { currentUserId } from "../auth/session";
import { withUser } from "../db";
import { env } from "../env";
import { LANG_COOKIE, isLocale } from "./core";

/** Тіл таңдау: cookie (whitelist) + кірген қолданушы болса профильге (profiles.locale) сақтау. */
export async function setLangAction(f: FormData): Promise<void> {
  const v = f.get("lang");
  if (!isLocale(v)) return;
  (await cookies()).set(LANG_COOKIE, v, { httpOnly: false, sameSite: "lax", secure: env().COOKIE_SECURE === "true", path: "/", maxAge: 60 * 60 * 24 * 365 });
  try {
    const uid = await currentUserId();
    if (uid) await withUser(uid, (q) => q("update public.profiles set locale = $1 where id = auth.uid()", [v]));
  } catch { /* профильді сақтау сәтсіз болса да cookie жеткілікті */ }
  revalidatePath("/", "layout");
}
