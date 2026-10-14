import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";

export const SESSION_COOKIE = "qc_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): Uint8Array {
  const e = env();
  return new TextEncoder().encode(e.AUTH_DRIVER === "supabase" ? e.SUPABASE_JWT_SECRET! : e.AUTH_JWT_SECRET!);
}

/** Сессия токені: local драйверінде өзіміз қол қоямыз; supabase-те Supabase берген access_token сақталады. */
export async function createSession(userId: string, accessToken?: string): Promise<void> {
  const e = env();
  const token = accessToken ?? await new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: e.COOKIE_SECURE === "true", path: "/", maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Тек жарамды (қолы және мерзімі тексерілген) токеннен user id. */
export async function currentUserId(): Promise<string | null> {
  const t = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
