import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_DRIVER: z.enum(["local", "supabase"]).default("local"),
  AUTH_JWT_SECRET: z.string().min(32).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
});

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;

/** Орта айнымалылары талап бойынша тексеріледі (build кезінде емес, іске қосылғанда). */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Орта айнымалылары дұрыс емес: " + parsed.error.issues.map((i) => i.path.join(".") + " - " + i.message).join("; "));
  }
  const e = parsed.data;
  if (e.AUTH_DRIVER === "local" && !e.AUTH_JWT_SECRET) throw new Error("AUTH_DRIVER=local үшін AUTH_JWT_SECRET (кемінде 32 символ) керек");
  if (e.AUTH_DRIVER === "supabase" && !(e.SUPABASE_URL && e.SUPABASE_ANON_KEY && e.SUPABASE_JWT_SECRET)) {
    throw new Error("AUTH_DRIVER=supabase үшін SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET керек");
  }
  if (e.AUTH_DRIVER === "local" && process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_AUTH_IN_PRODUCTION !== "yes") {
    throw new Error("AUTH_DRIVER=local өндірісте рұқсат етілмейді (құпиясөздер Supabase Auth-та сақталуы тиіс)");
  }
  cached = e;
  return e;
}
