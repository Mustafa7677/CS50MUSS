// E-mail outbox (0015): RLS, claim тек бір worker-ге, suppression, backoff, unsubscribe, шақыру хаты, lead_ack триггері, purge, qc_mailer рөлі.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { parse } from "pg-connection-string";
import { pool, URL, admin, as, asAnon, fails, newUser, reset, future } from "./helpers.mjs";

const S = {};
after(() => pool.end());
const enq = (to, o = {}) => admin("select public.enqueue_email($1,$2,$3,$4::jsonb,$5,$6) as id",
  [to, o.template ?? "generic", o.locale ?? "kk", JSON.stringify(o.payload ?? { subject: "Сынақ", body: "Мәтін" }), o.key ?? null, o.ttl ?? 72]).then((r) => r[0].id);
const row = async (id) => (await admin("select * from public.email_outbox where id = $1", [id]))[0];
const claim = (n = 10, db = pool) => db.query("select * from public.claim_emails($1)", [n]).then((r) => r.rows);
const mark = (id, ok, err = null, perm = false, sup = null) => admin("select public.mark_email_result($1,$2,$3,$4,$5) as r", [id, ok, err, perm, sup]).then((r) => r[0].r);
const clean = () => admin("truncate public.email_outbox, public.email_suppressions, public.email_unsub_tokens, public.leads");
const hash = (e) => admin("select public.email_hash_of($1) h", [e]).then((r) => r[0].h);

describe("email outbox: құқықтар (RLS)", () => {
  before(async () => {
    await reset(); await clean();
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    const r = await as(S.root.id, (q) => q("select public.create_organization('Мектеп E', 'school-e', 'starter', $1) as r", [future()]));
    S.org = r[0].r.org_id;
    S.admin = await newUser("Әкімші E", "admin-e@test.kz");
    await as(S.admin.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
    S.org2 = (await as(S.root.id, (q) => q("select public.create_organization('Мектеп F', 'school-f', 'starter', $1) as r", [future()])))[0].r;
    S.admin2 = await newUser("Әкімші F");
    await as(S.admin2.id, (q) => q("select public.accept_invitation($1)", [S.org2.admin_invite_token]));
    const t = await as(S.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.org]));
    S.teacher = await newUser("Мұғалім E");
    await as(S.teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
    await enq("secret.person@example.kz");
  });

  it("anon мен authenticated (SUPER ADMIN-ді қоса) жеке письмоны оқи/жаза алмайды", async () => {
    for (const run of [asAnon, (f) => as(S.admin.id, f), (f) => as(S.teacher.id, f), (f) => as(S.root.id, f)]) {
      for (const t of ["email_outbox", "email_suppressions", "email_unsub_tokens"]) {
        await fails(run((q) => q(`select * from public.${t}`)), "permission denied");
        await fails(run((q) => q(`delete from public.${t}`)), "permission denied");
      }
      await fails(run((q) => q("insert into public.email_outbox(to_email,email_hash,template,expires_at) values ('a@b.kz','x','generic',now())")), "permission denied");
    }
  });

  it("enqueue_email, claim_emails, mark_email_result клиентке берілмейді", async () => {
    for (const run of [asAnon, (f) => as(S.admin.id, f), (f) => as(S.root.id, f)]) {
      await fails(run((q) => q("select public.enqueue_email('a@b.kz','generic','kk','{}')")), "permission denied");
      await fails(run((q) => q("select * from public.claim_emails(5)")), "permission denied");
      await fails(run((q) => q("select public.mark_email_result(gen_random_uuid(), true)")), "permission denied");
    }
    const bad = await admin(`select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace
      and p.proname in ('enqueue_email','claim_emails','mark_email_result','trg_lead_ack','email_hash_of')
      and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('public', p.oid, 'execute'))`);
    assert.deepEqual(bad, []);
  });

  it("SUPER ADMIN тек жиынтық санақты көреді; басқалар forbidden", async () => {
    const r = await as(S.root.id, (q) => q("select * from public.email_stats()"));
    assert.deepEqual(r.map((x) => x.status), ["queued", "sending", "sent", "failed", "suppressed"]);
    assert.equal(Number(r[0].total), 1);
    assert.deepEqual(Object.keys(r[0]).sort(), ["last_24h", "status", "total"]);
    await fails(as(S.admin.id, (q) => q("select * from public.email_stats()")), "forbidden");
    await fails(asAnon((q) => q("select * from public.email_stats()")), "permission denied");
  });

  it("purge_old_emails: клиент рөлі (SUPER ADMIN емес) forbidden; SUPER ADMIN рұқсат", async () => {
    await fails(as(S.admin.id, (q) => q("select public.purge_old_emails(30)")), "forbidden");
    await fails(asAnon((q) => q("select public.purge_old_emails(30)")), "permission denied");
    await fails(as(S.root.id, (q) => q("select public.purge_old_emails(0)")), "invalid_range");
    const r = await as(S.root.id, (q) => q("select public.purge_old_emails(30) as n"));
    assert.equal(r[0].n, 0);
  });
});

describe("email outbox: enqueue, claim, нәтиже, suppression", () => {
  before(clean);

  it("enqueue: e-mail кіші әріпке, валидация, dedupe_key идемпотентті", async () => {
    const id = await enq("  Aigul@Example.KZ ", { key: "k1" });
    const r = await row(id);
    assert.equal(r.to_email, "aigul@example.kz");
    assert.equal(r.status, "queued");
    assert.equal(r.attempts, 0);
    assert.ok(r.unsub_token && r.unsub_token.length === 36);
    assert.equal(await enq("aigul@example.kz", { key: "k1" }), id, "бірдей кілт = бірдей жол");
    assert.equal((await admin("select count(*)::int n from public.email_outbox"))[0].n, 1);
    for (const bad of ["жоқ", "a@b", "a b@c.kz", "x".repeat(160) + "@a.kz"]) await fails(enq(bad), "invalid_input");
    await fails(enq("v@example.kz", { template: "spam" }), "invalid_input");
    await fails(enq("v@example.kz", { locale: "xx" }), "invalid_input");
    await fails(enq("v@example.kz", { ttl: 0 }), "invalid_ttl");
    await fails(admin("select public.enqueue_email('v@example.kz','generic','kk','[]'::jsonb)"), "invalid_input");
    await fails(enq("v@example.kz", { payload: { x: "я".repeat(9000) } }), "invalid_input");
  });

  it("rate limit: бір алушыға тәулігіне ≤5 (6-шы null)", async () => {
    await clean();
    for (let i = 0; i < 5; i++) assert.ok(await enq("rl@example.kz"));
    assert.equal(await enq("rl@example.kz"), null);
    assert.ok(await enq("other@example.kz"), "басқа алушыға әсер етпейді");
    await admin("update public.email_outbox set created_at = now() - interval '25 hours' where to_email = 'rl@example.kz'");
    assert.ok(await enq("rl@example.kz"), "24 сағаттан кейін қайта ашылады");
  });

  it("жалпы rate limit: сағатына 1000", async () => {
    await clean();
    await admin(`insert into public.email_outbox(to_email,email_hash,template,expires_at)
      select 'g'||i||'@x.kz', 'h'||i, 'generic', now()+interval '1 day' from generate_series(1,1000) i`);
    assert.equal(await enq("new@example.kz"), null);
  });

  it("claim: екі worker параллель - әр жол тек біреуіне; қайта claim бос", async () => {
    await clean();
    for (let i = 0; i < 20; i++) await enq(`w${i}@example.kz`);
    const [a, b] = await Promise.all([claim(10), claim(10)]);
    assert.equal(a.length, 10);
    assert.equal(b.length, 10);
    const ids = new Set([...a, ...b].map((r) => r.id));
    assert.equal(ids.size, 20, "қиылысу жоқ");
    assert.deepEqual(await claim(10), []);
    assert.ok(a.every((r) => r.attempts === 1));
    assert.equal((await admin("select count(*)::int n from public.email_outbox where status='sending'"))[0].n, 20);
  });

  it("claim: бір транзакциядағы FOR UPDATE SKIP LOCKED басқа worker-ді бұғаттамайды", async () => {
    await clean();
    for (let i = 0; i < 4; i++) await enq(`sk${i}@example.kz`);
    const c1 = await pool.connect();
    try {
      await c1.query("begin");
      const first = (await c1.query("select * from public.claim_emails(2)")).rows;
      assert.equal(first.length, 2);
      const second = await claim(10);   // c1 әлі commit жасамаған: оның жолдарын күтпей, қалған 2-ні алады
      assert.equal(second.length, 2);
      assert.equal(new Set([...first, ...second].map((r) => r.id)).size, 4);
      await c1.query("commit");
    } finally { c1.release(); }
  });

  it("нәтиже: sent -> payload/токен тазаланады; қайталанған mark зиянсыз", async () => {
    await clean();
    const id = await enq("ok@example.kz", { payload: { subject: "С", body: "Құпия емес" } });
    const [c] = await claim(1);
    assert.equal(c.id, id);
    assert.equal(await mark(id, true), "sent");
    const r = await row(id);
    assert.equal(r.status, "sent"); assert.ok(r.sent_at);
    assert.deepEqual(r.payload, {}); assert.equal(r.unsub_token, null); assert.equal(r.last_error, null);
    assert.equal(await mark(id, false, "кеш"), "sent", "аяқталған жол өзгермейді");
  });

  it("нәтиже: қате -> backoff-пен қайта кезекке, 5 әрекеттен кейін failed", async () => {
    await clean();
    const id = await enq("retry@example.kz");
    const delays = [];
    for (let i = 1; i <= 5; i++) {
      const [c] = await claim(1);
      assert.equal(c.id, id); assert.equal(c.attempts, i);
      const st = await mark(id, false, "  connect\nECONNREFUSED  " + "x".repeat(300));
      if (i < 5) {
        assert.equal(st, "queued");
        const r = await row(id);
        delays.push(Math.round((new Date(r.next_attempt_at) - Date.now()) / 1000));
        assert.deepEqual(await claim(1), [], "backoff әлі аяқталмаған");
        await admin("update public.email_outbox set next_attempt_at = now() where id = $1", [id]);
      } else assert.equal(st, "failed");
    }
    assert.deepEqual(delays.map((d) => Math.round(d / 10)), [3, 6, 12, 24], "30/60/120/240 секунд");
    const r = await row(id);
    assert.equal(r.status, "failed"); assert.equal(r.attempts, 5);
    assert.ok(r.last_error.length <= 200 && !/\n/.test(r.last_error));
    assert.deepEqual(r.payload, {});
  });

  it("тұрақты қате (permanent) бірден failed; bounce алушыны suppression-ға қосады", async () => {
    await clean();
    const id = await enq("gone@example.kz");
    await claim(1);
    assert.equal(await mark(id, false, "550 user unknown", true, "bounce"), "failed");
    const h = await hash("gone@example.kz");
    assert.equal((await admin("select reason from public.email_suppressions where email_hash=$1", [h]))[0].reason, "bounce");
    const id2 = await enq("gone@example.kz");
    assert.equal((await row(id2)).status, "suppressed", "бас тартылған алушыға жіберілмейді");
    assert.deepEqual(await claim(5), []);
  });

  it("'sending'-те қатып қалған жол 10 минуттан кейін қайта алынады; мерзімі өткендер failed(expired)", async () => {
    await clean();
    const id = await enq("stuck@example.kz");
    await claim(1);
    assert.deepEqual(await claim(1), []);
    await admin("update public.email_outbox set locked_at = now() - interval '11 minutes' where id=$1", [id]);
    const [c] = await claim(1);
    assert.equal(c.id, id); assert.equal(c.attempts, 2);
    const e = await enq("old@example.kz", { payload: { subject: "С", body: "ескі" } });
    await admin("update public.email_outbox set expires_at = now() - interval '1 minute' where id=$1", [e]);
    assert.deepEqual(await claim(5), []);
    const r = await row(e);
    assert.equal(r.status, "failed"); assert.equal(r.last_error, "expired"); assert.deepEqual(r.payload, {});
  });

  it("suppression кезек кезінде де жұмыс істейді (claim кезінде тексеріледі)", async () => {
    await clean();
    const id = await enq("late@example.kz");
    await admin("insert into public.email_suppressions(email_hash, reason) values ($1, 'complaint')", [await hash("late@example.kz")]);
    assert.deepEqual(await claim(5), []);
    assert.equal((await row(id)).status, "suppressed");
  });
});

describe("email: unsubscribe, шақыру хаты, lead_ack, purge, qc_mailer", () => {
  before(async () => {
    await reset(); await clean();
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    const mk = async (slug, name) => {
      const r = (await as(S.root.id, (q) => q("select public.create_organization($1, $2, 'starter', $3) as r", [name, slug, future()])))[0].r;
      const a = await newUser("Әкімші " + slug);
      await as(a.id, (q) => q("select public.accept_invitation($1)", [r.admin_invite_token]));
      return { org: r.org_id, admin: a };
    };
    S.A = await mk("sch-a", "Мектеп <b>A</b>");
    S.B = await mk("sch-b", "Мектеп B");
  });

  it("unsubscribe: anon токен бойынша; жарамсыз токен false; кезектегі хаттар тоқтайды; кейінгі хаттар suppressed", async () => {
    await clean();
    const id = await enq("unsub@example.kz");
    const tok = (await row(id)).unsub_token;
    assert.equal((await asAnon((q) => q("select public.email_unsubscribe($1) r", ["0".repeat(36)])))[0].r, false);
    assert.equal((await asAnon((q) => q("select public.email_unsubscribe($1) r", ["'; drop table x;--"])))[0].r, false);
    assert.equal((await asAnon((q) => q("select public.email_unsubscribe($1) r", [tok])))[0].r, true);
    assert.equal((await asAnon((q) => q("select public.email_unsubscribe($1) r", [tok])))[0].r, true, "қайталау зиянсыз");
    assert.equal((await row(id)).status, "suppressed");
    assert.equal((await row(await enq("unsub@example.kz"))).status, "suppressed");
    assert.equal((await admin("select reason from public.email_suppressions"))[0].reason, "unsubscribed");
    // жіберілген хаттың токені outbox-тан өшкен соң да жұмыс істейді (тек хэш қалады)
    const id2 = await enq("later@example.kz"); const tok2 = (await row(id2)).unsub_token;
    await claim(5); await mark(id2, true);
    assert.equal((await row(id2)).unsub_token, null);
    assert.equal((await asAnon((q) => q("select public.email_unsubscribe($1) r", [tok2])))[0].r, true);
  });

  it("queue_invitation_email: ұйым әкімшісі ғана; токен payload-та, жіберілген соң өшеді; e-mail аудитке түспейді", async () => {
    await clean();
    const tok = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher',null,24) t", [S.A.org])))[0].t;
    await fails(as(S.B.admin.id, (q) => q("select public.queue_invitation_email($1,'t@example.kz')", [tok])), "forbidden");
    await fails(asAnon((q) => q("select public.queue_invitation_email($1,'t@example.kz')", [tok])), "permission denied");
    await fails(as(S.A.admin.id, (q) => q("select public.queue_invitation_email($1,'жоқ')", [tok])), "invalid_input");
    await fails(as(S.A.admin.id, (q) => q("select public.queue_invitation_email('deadbeef','t@example.kz')")), "not_found");
    assert.equal((await as(S.A.admin.id, (q) => q("select public.queue_invitation_email($1,'Teacher@Example.kz') r", [tok])))[0].r, true);
    const [r] = await admin("select * from public.email_outbox");
    assert.equal(r.template, "teacher_invite"); assert.equal(r.to_email, "teacher@example.kz");
    assert.equal(r.payload.token, tok); assert.equal(r.payload.org_name, "Мектеп <b>A</b>");
    assert.ok(new Date(r.expires_at) - Date.now() <= 24 * 3600e3 + 5000, "хат мерзімі шақыру мерзімінен ұзақ емес");
    const [c] = await claim(1);
    assert.equal(c.payload.token, tok);
    await mark(c.id, true);
    assert.deepEqual((await row(c.id)).payload, {}, "жіберілген соң токен DB-да жоқ");
    const au = await admin("select meta::text m from public.audit_logs where action='invitation.email'");
    assert.equal(au.length, 1); assert.ok(!au[0].m.includes("teacher@") && !au[0].m.includes(tok));
    // email-мен шектелген шақыру басқа мекенжайға жіберілмейді; кері қайтарылған/қолданылған - invite_invalid
    const t2 = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher','only@example.kz') t", [S.A.org])))[0].t;
    await fails(as(S.A.admin.id, (q) => q("select public.queue_invitation_email($1,'other@example.kz')", [t2])), "invite_email_mismatch");
    const id = (await admin("select id from public.invitations where email='only@example.kz'"))[0].id;
    await as(S.A.admin.id, (q) => q("select public.revoke_invitation($1)", [id]));
    await fails(as(S.A.admin.id, (q) => q("select public.queue_invitation_email($1,'only@example.kz')", [t2])), "invite_invalid");
    // мұғалім (әкімші емес) жібере алмайды
    const tt = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher') t", [S.A.org])))[0].t;
    const teacher = await newUser("Мұғалім");
    await as(teacher.id, (q) => q("select public.accept_invitation($1)", [tt]));
    const t3 = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher') t", [S.A.org])))[0].t;
    await fails(as(teacher.id, (q) => q("select public.queue_invitation_email($1,'x@example.kz')", [t3])), "forbidden");
  });

  it("queue_invitation_email: алушыға тәулігіне ≤5 (rate_limited)", async () => {
    await clean();
    for (let i = 0; i < 5; i++) {
      const t = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher') t", [S.A.org])))[0].t;
      await as(S.A.admin.id, (q) => q("select public.queue_invitation_email($1,'spam@example.kz')", [t]));
    }
    const t = (await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher') t", [S.A.org])))[0].t;
    await fails(as(S.A.admin.id, (q) => q("select public.queue_invitation_email($1,'spam@example.kz')", [t])), "rate_limited");
  });

  it("lead_ack: submit_lead сәтті болса триггер хат қояды; дубликат хат қоспайды; payload-та тек ұйым атауы", async () => {
    await clean();
    const submit = (email, org = "Гимназия №5") => asAnon((q) => q("select public.submit_lead($1,'Айгүл Сәрсенбай',$2,'+7 701 000 00 00','director','school',300,'Жеке хабар',true,'t') r", [org, email]));
    assert.equal((await submit("Lead@Example.kz"))[0].r, true);
    const rows = await admin("select * from public.email_outbox");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].template, "lead_ack"); assert.equal(rows[0].to_email, "lead@example.kz");
    assert.deepEqual(rows[0].payload, { org_name: "Гимназия №5" });
    assert.ok(!JSON.stringify(rows[0]).includes("Сәрсенбай") && !JSON.stringify(rows[0]).includes("701"));
    assert.equal((await submit("lead@example.kz", "Басқа"))[0].r, true, "жауап бірдей");
    assert.equal((await admin("select count(*)::int n from public.email_outbox"))[0].n, 1, "дубликатта екінші хат жоқ");
    // email жүйесі істен шықса да лид қабылданады
    await admin("alter table public.email_outbox disable trigger all");
    await admin("alter table public.email_outbox add constraint tmp_fail check (false) not valid");
    try { assert.equal((await submit("robust@example.kz"))[0].r, true); } finally { await admin("alter table public.email_outbox drop constraint tmp_fail"); await admin("alter table public.email_outbox enable trigger all"); }
    assert.equal((await admin("select count(*)::int n from public.leads where email='robust@example.kz'"))[0].n, 1);
  });

  it("purge_old_emails: аяқталғандар p_days кейін, кезектегілер 14 күннен кейін; жаңалары қалады", async () => {
    await clean();
    const ids = {};
    for (const k of ["sent_old", "sent_new", "queued_old", "queued_new", "failed_old", "supp_old"]) ids[k] = await enq(`${k}@example.kz`);
    await admin("update public.email_outbox set status='sent' where id = any($1)", [[ids.sent_old, ids.sent_new]]);
    await admin("update public.email_outbox set status='failed' where id=$1", [ids.failed_old]);
    await admin("update public.email_outbox set status='suppressed' where id=$1", [ids.supp_old]);
    await admin("update public.email_outbox set created_at = now() - interval '40 days' where id = any($1)", [[ids.sent_old, ids.failed_old, ids.supp_old]]);
    await admin("update public.email_outbox set created_at = now() - interval '15 days' where id=$1", [ids.queued_old]);
    await admin("update public.email_outbox set created_at = now() - interval '20 days' where id=$1", [ids.sent_new]);
    const n = (await admin("select public.purge_old_emails(30) n"))[0].n;
    assert.equal(n, 4);
    const left = (await admin("select to_email from public.email_outbox order by 1")).map((r) => r.to_email);
    assert.deepEqual(left, ["queued_new@example.kz", "sent_new@example.kz"]);
    assert.equal((await admin("select count(*)::int n from public.audit_logs where action='email.purge'"))[0].n, 1);
  });

  it("qc_mailer: ең аз құқықты рөл claim/mark/purge жасай алады, бірақ кестені оқи алмайды", async () => {
    await clean();
    await admin(`do $$ begin create role qc_mailer_t login password 'mailer-t' nosuperuser nobypassrls; exception when duplicate_object then null; end $$`);
    await admin("grant usage on schema public to qc_mailer_t");
    await admin("grant execute on function public.claim_emails(int), public.mark_email_result(uuid, boolean, text, boolean, text), public.purge_old_emails(int) to qc_mailer_t");
    const base = parse(URL);
    const c = new pg.Client({ host: base.host, port: base.port, database: base.database, user: "qc_mailer_t", password: "mailer-t" });
    await c.connect();
    try {
      const id = await enq("mailer@example.kz");
      const got = (await c.query("select * from public.claim_emails(5)")).rows;
      assert.equal(got.length, 1); assert.equal(got[0].id, id);
      assert.equal((await c.query("select public.mark_email_result($1, true) r", [id])).rows[0].r, "sent");
      assert.equal((await c.query("select public.purge_old_emails(30) n")).rows[0].n, 0);
      await assert.rejects(c.query("select * from public.email_outbox"), /permission denied/);
      await assert.rejects(c.query("select public.enqueue_email('a@b.kz','generic')"), /permission denied/);
    } finally { await c.end(); }
  });
});
