// Тест көмекшілері: нақты PostgreSQL + RLS. Әр "сұраныс" Supabase-тегідей бөлек транзакция: set role authenticated + JWT claims.
import pg from "pg";

export const URL = process.env.TEST_DATABASE_URL || "postgresql://postgres@/qc_test?host=/var/tmp/cs50pg&port=5499";
export const pool = new pg.Pool({ connectionString: URL, max: 4 });

export async function admin(sql, params = []) {
  const r = await pool.query(sql, params);
  return r.rows;
}

/** Қолданушы атынан сұраныс: fn(q) ішінде q(sql, params) -> rows. Қате шықса rollback және қатені қайтарады. */
export async function as(userId, fn) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query(userId ? "set local role authenticated" : "set local role anon");
    if (userId) await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    const q = async (sql, params = []) => (await c.query(sql, params)).rows;
    const res = await fn(q);
    await c.query("commit");
    return res;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
export const asAnon = (fn) => as(null, fn);

/** Қате хабарын (бизнес-код) күту */
export async function fails(promise, code) {
  try { await promise; } catch (e) {
    if (code === undefined || e.message === code || e.message.includes(code)) return e;
    throw new Error(`Күтілген қате "${code}", бірақ "${e.message}" шықты`);
  }
  throw new Error(`Қате күтілген (${code ?? "кез келген"}), бірақ сәтті өтті`);
}

let n = 0;
export async function newUser(name, email) {
  const e = email || `u${Date.now()}${n++}@test.kz`;
  const [r] = await admin("select auth_dev.sign_up($1, 'password123', $2) as id", [e, name]);
  return { id: r.id, email: e, name };
}

export async function reset() {
  await admin(`truncate public.audit_logs, public.grades, public.submission_results, public.submissions, public.assignment_test_cases,
    public.assignment_answer_keys, public.assignment_questions, public.assignment_targets, public.assignments, public.classroom_students,
    public.classrooms, public.invitations, public.organization_members, public.licenses, public.organization_settings,
    public.organizations, public.platform_admins, public.profiles restart identity cascade`);
  await admin("delete from auth.users");
}
export const future = (days = 365) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
export const past = (days = 5) => new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
