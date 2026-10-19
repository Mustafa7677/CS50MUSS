#!/usr/bin/env node
// Лицензия жаңарту еске салғыштары: мерзімі аяқталуға 30/14/7/1 күн қалғанда мектеп әкімшілеріне хабарландыру (қоңырау белгісі).
// Бір ұйымға бір мерзім үшін әр босағада ТЕК бір рет (licence_reminder_log), сондықтан күніне бірнеше рет іске қосу қауіпсіз.
// cron (күн сайын, мысалы 09:00 Asia/Almaty): DATABASE_URL=<иесі рөлі> node scripts/licence-reminders.mjs
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL орнатылмаған"); process.exit(2); }
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  const r = await c.query("select public.licence_reminders() as n");
  console.log(`Лицензия еске салғыштары: ${r.rows[0].n} хабарландыру жіберілді`);
} finally { await c.end(); }
