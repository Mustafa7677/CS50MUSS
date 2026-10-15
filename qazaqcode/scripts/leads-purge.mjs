#!/usr/bin/env node
// Сұрау (leads) сақтау мерзімі: N күннен (әдепкі 365) ескі жазбаларды өшіреді. cron-да күн сайын іске қосыңыз.
// Қолданылуы: DATABASE_URL=<иесі рөлі> node scripts/leads-purge.mjs [күн]
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL орнатылмаған"); process.exit(2); }
const days = Number(process.argv[2] ?? process.env.LEADS_RETENTION_DAYS ?? 365);
if (!Number.isInteger(days) || days < 1 || days > 3650) { console.error("күн саны 1..3650 бүтін сан болуы тиіс"); process.exit(2); }
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  const r = await c.query("select public.purge_old_leads($1) as n", [days]);
  console.log(`${days} күннен ескі ${r.rows[0].n} сұрау өшірілді`);
} finally { await c.end(); }
