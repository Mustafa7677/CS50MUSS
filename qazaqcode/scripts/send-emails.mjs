#!/usr/bin/env node
// E-mail worker: email_outbox кезегін оқып, SMTP (не console) арқылы жібереді. Қосымша/RPC ешқашан желіге шықпайды.
// Қолданылуы:
//   DATABASE_URL=<иесі не qc_mailer> APP_URL=https://... EMAIL_DRIVER=smtp SMTP_HOST=... node scripts/send-emails.mjs [--once] [--batch 10] [--interval 15]
//   --once      бір реттік: кезек бос болғанша жібереді де шығады (cron/тест)
//   --interval  цикл режимінде бос кезектен кейінгі күту (секунд, әдепкі 15)
// Қайталау: қате болса backoff 30с/60с/120с/240с (DB функциясында), 5 әрекеттен кейін failed. Тұрақты қате (RCPT 550) бірден failed + бас тартқандар тізімі.
// Тоқтату: SIGTERM/SIGINT - ағымдағы хат аяқталады, қалғаны кезекке қайтарылады.
// Node 22.18+ (.ts тікелей жүктеледі, type stripping).
import pg from "pg";
import { readEmailConfig, createTransport, safeError, classifyError } from "../src/lib/email/transport.ts";
import { render } from "../src/lib/email/templates.ts";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : d; };
const ONCE = flag("--once");
const BATCH = Math.min(100, Math.max(1, opt("--batch", Number(process.env.EMAIL_BATCH) || 10)));
const INTERVAL = Math.max(1, opt("--interval", Number(process.env.EMAIL_POLL_SECONDS) || 15)) * 1000;
const DELAY = Math.max(0, Number(process.env.EMAIL_SEND_DELAY_MS) || 0);

const log = (msg) => console.log(`${new Date().toISOString()} ${msg}`);
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL орнатылмаған"); process.exit(2); }
let cfg;
try { cfg = readEmailConfig(process.env); } catch (e) { console.error("E-mail баптауы қате:", e.message); process.exit(2); }
const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const secrets = [cfg.smtp?.pass, cfg.smtp?.user, process.env.DATABASE_URL];

if (cfg.driver === "off") {
  log("EMAIL_DRIVER=off: хаттар жіберілмейді (кезек өзгермейді). smtp не console қосыңыз.");
  if (ONCE) process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const transport = createTransport(cfg, log);
let stopping = false;
let wake = null;
for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => { if (!stopping) log(`${s}: тоқтатылуда...`); stopping = true; wake?.(); });
const sleep = (ms) => new Promise((r) => { const t = setTimeout(r, ms); wake = () => { clearTimeout(t); r(); }; });

const mark = (id, ok, err = null, permanent = false, suppress = null) =>
  pool.query("select public.mark_email_result($1, $2, $3, $4, $5)", [id, ok, err, permanent, suppress]);

async function deliver(row) {
  let msg;
  try {
    const unsub = row.unsub_token ? `${APP_URL}/unsubscribe/${row.unsub_token}` : null;
    const r = render(row.template, row.payload, { appUrl: APP_URL, unsubscribeUrl: unsub, locale: row.locale });
    msg = { to: row.to_email, ...r, headers: unsub ? { "List-Unsubscribe": `<${APP_URL}/api/email/unsubscribe/${row.unsub_token}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined };
  } catch (e) {
    await mark(row.id, false, "render: " + safeError(e, secrets), true);
    log(`failed ${row.id} ${row.template} (шаблон қатесі)`);
    return "failed";
  }
  try {
    await transport.send(msg);
  } catch (e) {
    const c = classifyError(e);
    const st = (await mark(row.id, false, safeError(e, secrets), c.permanent, c.suppress ?? null)).rows[0].mark_email_result;
    log(`${st === "failed" ? "failed" : "retry"} ${row.id} ${row.template} (${safeError(e, secrets).slice(0, 80)})`);
    return st;
  }
  await mark(row.id, true);
  log(`sent ${row.id} ${row.template}`);
  return "sent";
}

async function runBatch() {
  const rows = (await pool.query("select * from public.claim_emails($1)", [BATCH])).rows;
  let n = 0;
  for (const [i, row] of rows.entries()) {
    if (stopping) { for (const r of rows.slice(i)) await mark(r.id, false, "shutdown", false).catch(() => {}); break; }
    await deliver(row); n++;
    if (DELAY) await sleep(DELAY);
  }
  return rows.length;
}

let fails = 0;
try {
  if (cfg.driver !== "off") {
    log(`worker іске қосылды: driver=${cfg.driver}, batch=${BATCH}${ONCE ? ", once" : `, interval=${INTERVAL / 1000}с`}`);
    while (!stopping) {
      try {
        const n = await runBatch();
        fails = 0;
        if (n === BATCH) continue;     // кезек әлі бар
        if (ONCE) break;
        await sleep(INTERVAL);
      } catch (e) {
        fails++;
        log(`DB қатесі: ${safeError(e, secrets)}`);
        if (ONCE) { process.exitCode = 1; break; }
        await sleep(Math.min(60_000, 1000 * 2 ** Math.min(fails, 6)));
      }
    }
  } else {
    while (!stopping) await sleep(INTERVAL * 4);
  }
} finally {
  transport.close();
  await pool.end().catch(() => {});
  log("worker тоқтады");
}
