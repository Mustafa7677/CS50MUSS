#!/usr/bin/env node
// Белсенділік журналының (activity_days) сақтау мерзімі: N күннен (әдепкі 400) ескі жолдарды өшіреді. cron-да күн сайын іске қосыңыз.
// Қолданылуы: DATABASE_URL=<иесі рөлі> node scripts/activity-purge.mjs [күн]
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL орнатылмаған"); process.exit(2); }
const days = Number(process.argv[2] ?? process.env.ACTIVITY_RETENTION_DAYS ?? 400);
if (!Number.isInteger(days) || days < 1 || days > 3650) { console.error("күн саны 1..3650 бүтін сан болуы тиіс"); process.exit(2); }
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  const r = await c.query("select public.purge_activity($1) as n", [days]);
  console.log(`${days} күннен ескі ${r.rows[0].n} белсенділік жолы өшірілді`);
} finally { await c.end(); }
