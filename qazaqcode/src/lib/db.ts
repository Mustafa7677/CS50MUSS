import { Pool } from "pg";
import { env } from "./env";

type G = typeof globalThis & { __qcPool?: Pool };
const g = globalThis as G;

export function pool(): Pool {
  if (!g.__qcPool) g.__qcPool = new Pool({ connectionString: env().DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });
  return g.__qcPool;
}

export type Q = <T = Record<string, any>>(sql: string, params?: unknown[]) => Promise<T[]>;

/**
 * Қолданушы атынан сұраныс: бөлек транзакция, `authenticated` рөлі және JWT claims (Supabase-тегідей).
 * Сондықтан RLS пен auth.uid() толық жұмыс істейді; құқық дерекқорда тексеріледі.
 */
export async function withUser<T>(userId: string | null, fn: (q: Q) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("begin");
    await c.query(userId ? "set local role authenticated" : "set local role anon");
    if (userId) await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    const q: Q = async (sql, params = []) => (await c.query(sql, params as any[])).rows as any;
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

/** Привилегиясыз рөл: тек жергілікті (local) аутентификация драйвері үшін auth_dev функцияларына. */
export async function raw<T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool().query(sql, params as any[])).rows as any;
}
