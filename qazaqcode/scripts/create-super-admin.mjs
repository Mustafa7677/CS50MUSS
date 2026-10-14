#!/usr/bin/env node
// Платформа әкімшісін (SUPER ADMIN) жасау.
//   Жергілікті (AUTH_DRIVER=local):  DATABASE_URL=... node scripts/create-super-admin.mjs email@x.kz "Аты Жөні" "құпиясөз"
//   Supabase: алдымен Supabase Auth-та қолданушыны жасаңыз, сосын:  DATABASE_URL=... node scripts/create-super-admin.mjs email@x.kz
import pg from "pg";
const [email, name, password] = process.argv.slice(2);
if (!process.env.DATABASE_URL || !email) { console.error("Қолдану: DATABASE_URL=... node scripts/create-super-admin.mjs <email> [аты] [құпиясөз]"); process.exit(1); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
let id = (await pool.query("select id from auth.users where email=$1", [email.toLowerCase()])).rows[0]?.id;
if (!id) {
  if (!password) { console.error("Қолданушы табылмады. Жергілікті режимде аты мен құпиясөзді беріңіз; Supabase-те алдымен Auth-та жасаңыз."); process.exit(1); }
  id = (await pool.query("select auth_dev.sign_up($1,$2,$3) as id", [email, password, name || "Платформа әкімшісі"])).rows[0].id;
}
await pool.query("insert into public.platform_admins(user_id) values ($1) on conflict do nothing", [id]);
console.log(`SUPER ADMIN дайын: ${email} (${id})`);
await pool.end();
