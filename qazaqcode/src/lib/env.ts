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
  // Сенімді reverse proxy саны (X-Forwarded-For оңнан санағанда): rate limit клиент IP-ін осыдан алады
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  // E-mail (тек scripts/send-emails.mjs worker жібереді; қосымша тек outbox-қа жазады). Әдепкі: өндірісте off, әйтпесе console.
  EMAIL_DRIVER: z.enum(["console", "smtp", "off"]).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  SMTP_FROM: z.string().optional(),
});

/** Әлсіз/үлгі құпия: placeholder сөздер, қайталанатын үлгі, аз әртүрлі символ */
export function isWeakSecret(v: string): boolean {
  if (v.length < 32) return true;
  if (/change.?me|dev-secret|example|password|secret-secret|your[-_]|xxxx|0000/i.test(v)) return true;
  if (new Set(v).size < 10) return true;
  const half = v.slice(0, Math.floor(v.length / 2));
  return v.length % 2 === 0 && v === half + half;
}

/** Қосымша e-mail жіберу мүмкіндігі қосулы ма (UI «E-mail-ге жіберу» батырмасы үшін). */
export function emailEnabled(): boolean {
  const d = env().EMAIL_DRIVER ?? (process.env.NODE_ENV === "production" ? "off" : "console");
  return d !== "off";
}

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
  // Өндіріс қорғаныстары. ALLOW_LOCAL_AUTH_IN_PRODUCTION=yes - тек e2e/демо ортасы үшін айқын «білемін» ауыстырғышы.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_AUTH_IN_PRODUCTION !== "yes") {
    const secret = e.AUTH_DRIVER === "supabase" ? e.SUPABASE_JWT_SECRET! : e.AUTH_JWT_SECRET!;
    if (isWeakSecret(secret)) throw new Error("JWT құпиясы әлсіз не үлгі мәні (кемінде 32 символ, кездейсоқ: openssl rand -base64 48)");
    if (e.COOKIE_SECURE !== "true") throw new Error("Өндірісте COOKIE_SECURE=true болуы тиіс (HTTPS)");
    if (!e.APP_URL.startsWith("https://")) throw new Error("Өндірісте APP_URL https:// болуы тиіс");
    if (e.AUTH_DRIVER === "supabase" && !e.SUPABASE_URL!.startsWith("https://")) throw new Error("SUPABASE_URL https:// болуы тиіс");
  }
  // E-mail: SMTP_* толық тексеруі worker-де (transport.readEmailConfig: өндірісте HOST/PORT/FROM/USER/PASS міндетті). Қосымша контейнеріне SMTP құпиясы берілмейді,
  // сондықтан мұнда тек драйвер түрі мен қауіпті комбинациялар. Мәндер қате хабарламасына қосылмайды.
  if (!!e.SMTP_USER !== !!e.SMTP_PASS) throw new Error("SMTP_USER мен SMTP_PASS бірге берілуі тиіс");
  if (e.EMAIL_DRIVER === "console" && process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_AUTH_IN_PRODUCTION !== "yes") {
    throw new Error("Өндірісте EMAIL_DRIVER=console рұқсат етілмейді (шақыру сілтемелері логқа түседі): smtp не off қолданыңыз");
  }
  cached = e;
  return e;
}
