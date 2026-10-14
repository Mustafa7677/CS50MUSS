import { env } from "../env";
import { AppError } from "../errors";
import { raw } from "../db";

export interface AuthDriver {
  signUp(email: string, password: string, fullName: string): Promise<{ userId: string; accessToken?: string }>;
  signIn(email: string, password: string): Promise<{ userId: string; accessToken?: string }>;
}

/** ЖЕРГІЛІКТІ драйвер (тек әзірлеу/тест): auth_dev.* функциялары (db/dev/auth_shim.sql). Өндірісте қолданылмайды. */
export const localDriver: AuthDriver = {
  async signUp(email, password, fullName) {
    try {
      const r = await raw<{ id: string }>("select auth_dev.sign_up($1, $2, $3) as id", [email, password, fullName]);
      return { userId: r[0].id };
    } catch (e) {
      const m = (e as Error).message;
      if (m === "email_taken" || m === "weak_password") throw new AppError(m);
      throw e;
    }
  },
  async signIn(email, password) {
    const r = await raw<{ id: string | null }>("select auth_dev.sign_in($1, $2) as id", [email, password]);
    if (!r[0]?.id) throw new AppError("invalid_credentials");
    return { userId: r[0].id };
  },
};

/**
 * SUPABASE Auth (өндіріс): GoTrue REST. Құпиясөздер мен e-mail растауы Supabase-те.
 * ЕСКЕРТУ: бұл драйвер әзірге нақты Supabase жобасына қарсы сыналмаған (тек моктелген fetch-пен). Пилот алдында тексеріңіз.
 */
export const supabaseDriver: AuthDriver = {
  async signUp(email, password, fullName) {
    const e = env();
    const res = await fetch(`${e.SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: e.SUPABASE_ANON_KEY!, "content-type": "application/json" },
      body: JSON.stringify({ email, password, data: { full_name: fullName } }),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = String(body?.msg ?? body?.error_description ?? "");
      if (/already|registered/i.test(msg)) throw new AppError("email_taken");
      if (/password/i.test(msg)) throw new AppError("weak_password");
      throw new AppError("validation");
    }
    // e-mail растауы қосулы болса, access_token бірден берілмейді: қолданушы сілтемені растауы тиіс
    if (!body?.access_token) throw new AppError("validation", "Тіркелу сәтті. E-mail-ыңызға келген растау сілтемесін ашып, кейін кіріңіз.");
    return { userId: body.user.id, accessToken: body.access_token };
  },
  async signIn(email, password) {
    const e = env();
    const res = await fetch(`${e.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: e.SUPABASE_ANON_KEY!, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok || !body?.access_token) throw new AppError("invalid_credentials");
    return { userId: body.user.id, accessToken: body.access_token };
  },
};

export const driver = (): AuthDriver => (env().AUTH_DRIVER === "supabase" ? supabaseDriver : localDriver);
