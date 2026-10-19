// E-mail тасымалдау драйвері. Тек worker (scripts/send-emails.mjs) пайдаланады: қосымша/RPC ешқашан желіге шықпайды.
// EMAIL_DRIVER=console|smtp|off. Бұл файл басқа модульдерді импорттамайды (worker .ts-ті тікелей жүктейді).
import nodemailer from "nodemailer";

export type EmailDriver = "console" | "smtp" | "off";
export type SmtpConfig = { host: string; port: number; secure: boolean; user?: string; pass?: string };
export type EmailConfig = { driver: EmailDriver; from: string; smtp?: SmtpConfig };
export type OutMessage = { to: string; subject: string; text: string; html: string; headers?: Record<string, string> };
export type SendResult = { messageId?: string; accepted: boolean };
export type Transport = { driver: EmailDriver; send(m: OutMessage): Promise<SendResult>; close(): void };

const FROM_RE = /^(?:[^<>@\r\n"]{1,80}\s)?<?[^\s<>@"]+@[^\s<>@"]+>?$/;

/** Орта айнымалыларынан баптау. Қате болса Error (құпия мәндерді хабарламаға қоспай). */
export function readEmailConfig(src: Record<string, string | undefined> = process.env): EmailConfig {
  const prod = src.NODE_ENV === "production";
  const raw = (src.EMAIL_DRIVER ?? "").trim() || (prod ? "off" : "console");
  if (raw !== "console" && raw !== "smtp" && raw !== "off") throw new Error("EMAIL_DRIVER console, smtp не off болуы тиіс");
  if (raw === "console" && prod && src.ALLOW_LOCAL_AUTH_IN_PRODUCTION !== "yes") throw new Error("Өндірісте EMAIL_DRIVER=console рұқсат етілмейді (шақыру сілтемелері логқа түседі)");
  const from = (src.SMTP_FROM ?? "").trim() || "QazaqCode <noreply@localhost>";
  if (!FROM_RE.test(from) || /[\r\n]/.test(from)) throw new Error("SMTP_FROM дұрыс емес (мысалы: QazaqCode <noreply@mektep.kz>)");
  if (raw !== "smtp") return { driver: raw, from };
  const host = (src.SMTP_HOST ?? "").trim();
  if (!host) throw new Error("EMAIL_DRIVER=smtp үшін SMTP_HOST керек");
  const port = Number(src.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT дұрыс емес");
  const secure = (src.SMTP_SECURE ?? (port === 465 ? "true" : "false")) === "true";
  const user = (src.SMTP_USER ?? "").trim() || undefined;
  const pass = src.SMTP_PASS || undefined;
  if (!!user !== !!pass) throw new Error("SMTP_USER мен SMTP_PASS бірге берілуі тиіс");
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (prod && src.ALLOW_LOCAL_AUTH_IN_PRODUCTION !== "yes" && !local) {
    if (!src.SMTP_FROM?.trim()) throw new Error("Өндірісте EMAIL_DRIVER=smtp үшін SMTP_FROM керек");
    if (!src.SMTP_PORT) throw new Error("Өндірісте EMAIL_DRIVER=smtp үшін SMTP_PORT керек");
    if (!user || !pass) throw new Error("Өндірісте EMAIL_DRIVER=smtp үшін SMTP_USER және SMTP_PASS керек");
  }
  return { driver: "smtp", from, smtp: { host, port, secure, user, pass } };
}

/** Қатені журналға қауіпсіз қысқа мәтінге айналдыру: құпия, URL-дағы логин, жол үзілімі жоқ, ≤200 символ. */
export function safeError(e: unknown, secrets: Array<string | undefined> = []): string {
  const x = e as { code?: unknown; responseCode?: unknown; message?: unknown };
  let s = [typeof x?.code === "string" ? x.code : "", typeof x?.responseCode === "number" ? String(x.responseCode) : "", typeof x?.message === "string" ? x.message : String(e ?? "")]
    .filter(Boolean).join(" ");
  for (const sec of secrets) if (sec && sec.length >= 3) s = s.split(sec).join("***");
  s = s.replace(/[a-z][a-z0-9+.-]*:\/\/[^\s/@]+@/gi, "//***@").replace(/(pass(word)?|token|secret|auth)\s*[=:]\s*\S+/gi, "$1=***").replace(/\s+/g, " ").trim();
  return s.slice(0, 200) || "error";
}

/** Қайталауға болмайтын (тұрақты) қате ме, және алушыны бас тартқандарға қосу керек пе. */
export function classifyError(e: unknown): { permanent: boolean; suppress?: "bounce" } {
  const x = e as { responseCode?: number; command?: string; code?: string };
  const rc = typeof x?.responseCode === "number" ? x.responseCode : 0;
  if (rc >= 500 && rc < 600) {
    const rcpt = /RCPT/i.test(x.command ?? "");
    if (rcpt && [550, 551, 553].includes(rc)) return { permanent: true, suppress: "bounce" };
    if (rcpt || rc === 552 || rc === 554) return { permanent: true };
  }
  return { permanent: false };
}

export function createTransport(cfg: EmailConfig, log: (line: string) => void = (l) => console.log(l)): Transport {
  if (cfg.driver === "off") {
    return { driver: "off", async send() { throw new Error("EMAIL_DRIVER=off"); }, close() {} };
  }
  if (cfg.driver === "console") {
    return {
      driver: "console",
      async send(m) {
        // Тек әзірлеуге: хат мәтіні (шақыру сілтемесін қоса) консольге шығады. Өндірісте қолданбаңыз.
        log(`[email:console] From: ${cfg.from}\n  To: ${m.to}\n  Subject: ${m.subject}\n  ${m.text.replace(/\n/g, "\n  ")}`);
        return { accepted: true, messageId: "console" };
      },
      close() {},
    };
  }
  const s = cfg.smtp!;
  const t = nodemailer.createTransport({
    host: s.host, port: s.port, secure: s.secure, requireTLS: !s.secure && s.host !== "localhost" && s.host !== "127.0.0.1",
    auth: s.user ? { user: s.user, pass: s.pass } : undefined,
    connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  return {
    driver: "smtp",
    async send(m) {
      const info = await t.sendMail({ from: cfg.from, to: m.to, subject: m.subject, text: m.text, html: m.html, headers: m.headers, textEncoding: "base64" });
      const acc = Array.isArray(info.accepted) ? info.accepted.length : 0;
      if (acc === 0) throw Object.assign(new Error("recipient rejected"), { responseCode: 550, command: "RCPT TO" });
      return { accepted: true, messageId: info.messageId };
    },
    close() { t.close(); },
  };
}
