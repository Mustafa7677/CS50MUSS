import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pickIp } from "../../src/lib/rate-limit-core.ts";

// .ts ішіндегі extension-сыз импорттарды (../env, ../db) шешу үшін шағын hook
register("data:text/javascript," + encodeURIComponent(`
import { existsSync } from "node:fs"; import { fileURLToPath } from "node:url";
export async function resolve(spec, ctx, next) {
  if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec) && ctx.parentURL?.split("?")[0].endsWith(".ts")) {
    const u = new URL(spec + ".ts", ctx.parentURL); if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
  }
  return next(spec, ctx);
}`));

test("pickIp: X-Forwarded-For оңнан санайды, сол жағын жалғандау әсер етпейді", () => {
  assert.equal(pickIp("1.2.3.4, 203.0.113.9", null, 1), "203.0.113.9");
  assert.equal(pickIp("6.6.6.6, 5.5.5.5, 203.0.113.9", null, 1), "203.0.113.9");
  assert.equal(pickIp("6.6.6.6, 198.51.100.1, 203.0.113.9", null, 2), "198.51.100.1");
  assert.equal(pickIp("203.0.113.9", null, 3), "203.0.113.9");
  assert.equal(pickIp(null, "9.9.9.9", 1), "9.9.9.9");
  assert.equal(pickIp(null, null, 1), "local");
  assert.equal(pickIp("1.1.1.1", "9.9.9.9", 0), "9.9.9.9");
  assert.ok(pickIp("a".repeat(500), null, 1).length <= 64);
});

const GOOD = "Zq8vK2mXp4Rt7LwN1cYb9HdFs3JgA6eU5oTiPnVa";
const base = { DATABASE_URL: "postgres://x", AUTH_DRIVER: "supabase", SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_JWT_SECRET: GOOD, APP_URL: "https://app.example.kz", COOKIE_SECURE: "true" };
async function loadEnv(vars, nodeEnv = "production") {
  for (const k of Object.keys(process.env)) if (/^(DATABASE_URL|AUTH_|SUPABASE_|APP_URL|COOKIE_SECURE|ALLOW_LOCAL|TRUSTED)/.test(k)) delete process.env[k];
  Object.assign(process.env, vars, { NODE_ENV: nodeEnv });
  return (await import("../../src/lib/env.ts?" + Math.random())).env;
}

test("env: өндірісте әлсіз/үлгі құпия, HTTP APP_URL, Secure емес cookie, local драйвер - іске қосылмайды", async () => {
  assert.ok((await loadEnv(base))().SUPABASE_URL);
  for (const bad of [{ SUPABASE_JWT_SECRET: "short" }, { SUPABASE_JWT_SECRET: "change-me-to-a-long-random-string-32chars-min" }, { SUPABASE_JWT_SECRET: "a".repeat(40) },
    { SUPABASE_JWT_SECRET: "dev-secret-dev-secret-dev-secret-1234" }, { COOKIE_SECURE: "false" }, { APP_URL: "http://app.example.kz" }, { SUPABASE_URL: "http://x.supabase.co" }]) {
    assert.throws(await loadEnv({ ...base, ...bad }), undefined, JSON.stringify(bad));
  }
  const local = { ...base, AUTH_DRIVER: "local", AUTH_JWT_SECRET: GOOD };
  assert.throws(await loadEnv(local), /өндірісте рұқсат етілмейді/);
  assert.throws(await loadEnv({ ...local, AUTH_JWT_SECRET: "x".repeat(31) }));
  assert.ok((await loadEnv({ ...local, ALLOW_LOCAL_AUTH_IN_PRODUCTION: "yes", COOKIE_SECURE: "false", APP_URL: "http://127.0.0.1:3000", AUTH_JWT_SECRET: "dev-secret-dev-secret-dev-secret-1234" }))().AUTH_DRIVER);
  assert.ok((await loadEnv({ ...local, COOKIE_SECURE: "false", APP_URL: "http://localhost:3000", AUTH_JWT_SECRET: "dev-secret-dev-secret-dev-secret-1234" }, "development"))().AUTH_DRIVER);
});

test("supabase драйвері (моктелген fetch): сәтті кіру, қате құпиясөз, e-mail расталмаған, тіркелу қателері, URL/тақырыптар", async () => {
  const env = await loadEnv(base);
  void env;
  const { supabaseDriver } = await import("../../src/lib/auth/drivers.ts?" + Math.random());
  const calls = [];
  const mock = (status, body) => { globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return new Response(JSON.stringify(body), { status }); }; };

  mock(200, { access_token: "tok", user: { id: "11111111-1111-4111-8111-111111111111" } });
  const ok = await supabaseDriver.signIn("a@b.kz", "password123");
  assert.deepEqual(ok, { userId: "11111111-1111-4111-8111-111111111111", accessToken: "tok" });
  assert.equal(calls[0].url, "https://x.supabase.co/auth/v1/token?grant_type=password");
  assert.equal(calls[0].init.headers.apikey, "anon");
  assert.equal(calls[0].init.headers.authorization, undefined, "service_role/Authorization жіберілмейді");
  assert.ok(calls[0].init.signal, "тайм-аут бар");
  assert.ok(!JSON.stringify(calls[0].init).includes(GOOD), "JWT құпиясы Supabase-ке жіберілмейді");

  mock(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
  await assert.rejects(supabaseDriver.signIn("a@b.kz", "bad"), (e) => e.code === "invalid_credentials");
  mock(200, {});
  await assert.rejects(supabaseDriver.signIn("a@b.kz", "x"), (e) => e.code === "invalid_credentials");

  mock(200, { access_token: "t2", user: { id: "22222222-2222-4222-8222-222222222222" } });
  assert.equal((await supabaseDriver.signUp("n@b.kz", "password123", "Аты Жөні")).accessToken, "t2");
  assert.equal(JSON.parse(calls.at(-1).init.body).data.full_name, "Аты Жөні");
  mock(200, { id: "x" }); // e-mail растау қосулы: access_token жоқ
  await assert.rejects(supabaseDriver.signUp("n@b.kz", "password123", "Аты"), (e) => e.code === "validation" && /растау/.test(e.message));
  mock(422, { msg: "User already registered" });
  await assert.rejects(supabaseDriver.signUp("n@b.kz", "password123", "Аты"), (e) => e.code === "email_taken");
  mock(422, { msg: "Password should be at least 6 characters" });
  await assert.rejects(supabaseDriver.signUp("n@b.kz", "p", "Аты"), (e) => e.code === "weak_password");
  mock(500, "<html>boom</html>");
  await assert.rejects(supabaseDriver.signIn("a@b.kz", "x"), (e) => e.code === "invalid_credentials");
  globalThis.fetch = async () => { throw new Error("ECONNREFUSED 10.0.0.1:443"); };
  await assert.rejects(supabaseDriver.signIn("a@b.kz", "x"), (e) => !/invalid_credentials/.test(e.code ?? ""));
});
