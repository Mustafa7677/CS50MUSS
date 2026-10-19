#!/usr/bin/env node
// E-mail outbox сақтау мерзімі: аяқталған жолдарды N күннен (әдепкі 30) кейін өшіреді, кезекте қалғандарды 14 күннен кейін. cron-да күн сайын.
// Қолданылуы: DATABASE_URL=<иесі рөлі> node scripts/emails-purge.mjs [күн]
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL орнатылмаған"); process.exit(2); }
const days = Number(process.argv[2] ?? process.env.EMAIL_RETENTION_DAYS ?? 30);
if (!Number.isInteger(days) || days < 1 || days > 3650) { console.error("күн саны 1..3650 бүтін сан болуы тиіс"); process.exit(2); }
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  const r = await c.query("select public.purge_old_emails($1) as n", [days]);
  console.log(`${r.rows[0].n} e-mail жазбасы өшірілді`);
} finally { await c.end(); }
