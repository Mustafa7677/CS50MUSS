// QazaqCode: қауіпсіздік аудиті (3-кезең), дерекқор қабаты. Каталог тексерулері + аудит жазбалары.
// Іске қосу: TEST_DATABASE_URL=... node --test db/tests/security2.test.mjs
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, asAnon, fails, newUser, reset, future } from "./helpers.mjs";

after(() => pool.end());

const ANON_ALLOWED = ["classroom_preview", "invitation_preview", "org_branding"];
const INTERNAL = ["notify", "audit_log", "new_join_code", "handle_new_user", "audit_trigger", "audit_event_trigger", "audit_logs_guard", "require_user", "plan_limits"];

describe("каталог: RLS, грант, функциялар", () => {
  it("public схемасының БАРЛЫҚ кестесінде RLS қосулы (schema_migrations қоса)", async () => {
    const rows = await admin(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity order by 1`);
    assert.deepEqual(rows.map((r) => r.relname), [], "RLS жоқ кестелер");
  });

  it("anon-да ешбір public кестеге құқық жоқ", async () => {
    const rows = await admin(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r','p','v','m')
        and (has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger')
             or has_any_column_privilege('anon', c.oid, 'select, insert, update, references'))`);
    assert.deepEqual(rows.map((r) => r.relname), []);
  });

  it("authenticated-та тек SELECT бар (profiles.full_name/locale бағандық UPDATE-тен басқа)", async () => {
    const bad = await admin(`select c.relname, p.priv from pg_class c join pg_namespace n on n.oid = c.relnamespace
      cross join (values ('insert'),('delete'),('truncate'),('references'),('trigger')) p(priv)
      where n.nspname = 'public' and c.relkind in ('r','p') and has_table_privilege('authenticated', c.oid, p.priv)`);
    assert.deepEqual(bad, [], "артық кесте грантары");
    const upd = await admin(`select c.relname, a.attname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      where n.nspname = 'public' and c.relkind in ('r','p') and has_column_privilege('authenticated', c.oid, a.attnum, 'update') order by 1, 2`);
    assert.deepEqual(upd.map((r) => `${r.relname}.${r.attname}`), ["profiles.full_name", "profiles.locale"]);
  });

  it("schema_migrations: клиент рөлдері оқи да, жаза да алмайды", async () => {
    await fails(as(null, (q) => q("select * from public.schema_migrations")), "permission denied");
    const [u] = [await newUser("Мигр Тест")];
    await fails(as(u.id, (q) => q("select * from public.schema_migrations")), "permission denied");
    await fails(as(u.id, (q) => q("insert into public.schema_migrations(name) values ('x')")), "permission denied");
  });

  it("секвенцияларға anon/authenticated құқығы жоқ", async () => {
    const rows = await admin(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'S' and (has_sequence_privilege('anon', c.oid, 'usage,select,update')
        or has_sequence_privilege('authenticated', c.oid, 'usage,select,update'))`);
    assert.deepEqual(rows, []);
  });

  it("SECURITY DEFINER функцияларында search_path бекітілген, pg_temp бірінші емес", async () => {
    const rows = await admin(`select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')`);
    assert.ok(rows.length > 30, "SECURITY DEFINER функциялары табылмады");
    for (const r of rows) {
      const sp = (r.proconfig || []).find((c) => c.startsWith("search_path="));
      assert.ok(sp, `${r.proname}: search_path бекітілмеген`);
      assert.ok(!/^search_path=("?pg_temp|pg_temp)/.test(sp), `${r.proname}: pg_temp бірінші`);
      assert.ok(/pg_temp\s*$/.test(sp), `${r.proname}: pg_temp соңында болуы тиіс (${sp})`);
    }
  });

  it("PUBLIC-ке (және anon-ға артығымен) EXECUTE жоқ: anon тек 3 алдын ала қарау функциясын орындайды", async () => {
    const pub = await admin(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
        and has_function_privilege('public', p.oid, 'execute')`);
    assert.deepEqual(pub, [], "PUBLIC EXECUTE бар функциялар");
    const anon = await admin(`select distinct p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
        and has_function_privilege('anon', p.oid, 'execute') order by 1`);
    assert.deepEqual(anon.map((r) => r.proname), ANON_ALLOWED);
  });

  it("ішкі және триггер функцияларын authenticated орындай алмайды", async () => {
    const rows = await admin(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
        and (p.proname = any ($1) or p.proname like 'trg\\_%' or p.prorettype = 'pg_catalog.trigger'::regtype)`, [INTERNAL]);
    assert.deepEqual(rows, []);
    const u = await newUser("Ішкі Тест");
    await fails(as(u.id, (q) => q("select public.notify($1, null, 'x', 'x', 'x', null)", [u.id])), "permission denied");
    await fails(as(u.id, (q) => q("select public.audit_log(null, 'x', 'x', 'x')")), "permission denied");
  });

  it("anon қорғалған RPC-ны шақыра алмайды", async () => {
    await fails(asAnon((q) => q("select public.create_classroom(gen_random_uuid(), 'a', '2025-2026', 'b')")), "permission denied");
    await fails(asAnon((q) => q("select public.my_context()")), "permission denied");
  });

  it("әдепкі құқықтар: жаңа функция/кесте PUBLIC/anon/authenticated-ке автоматты ашылмайды", async () => {
    await admin("create table public.zz_probe_tbl (id int)");
    await admin("create function public.zz_probe_fn() returns int language sql as 'select 1'");
    try {
      const t = await admin("select has_table_privilege('anon','public.zz_probe_tbl','select') a, has_table_privilege('authenticated','public.zz_probe_tbl','select') b");
      assert.deepEqual(t[0], { a: false, b: false });
      const f = await admin("select has_function_privilege('public','public.zz_probe_fn()','execute') p, has_function_privilege('anon','public.zz_probe_fn()','execute') a, has_function_privilege('authenticated','public.zz_probe_fn()','execute') b");
      assert.deepEqual(f[0], { p: false, a: false, b: false });
    } finally {
      await admin("drop table public.zz_probe_tbl; drop function public.zz_probe_fn()");
    }
  });
});

describe("аудит журналы және тікелей жазу тыйымы", () => {
  const S = {};
  before(async () => {
    await reset();
    S.root = await newUser("Платформа");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    const r = await as(S.root.id, (q) => q("select public.create_organization('Мектеп Z', 'school-z', 'starter', $1) as r", [future()]));
    S.org = r[0].r.org_id;
    S.admin = await newUser("Әкімші Z");
    await as(S.admin.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
    const t = await as(S.admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S.org]));
    S.teacher = await newUser("Мұғалім Z");
    await as(S.teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
    S.cls = (await as(S.teacher.id, (q) => q("select public.create_classroom($1, '9А', '2025-2026', 'Информатика') as id", [S.org])))[0].id;
    S.code = (await admin("select join_code from classrooms where id=$1", [S.cls]))[0].join_code;
    S.student = await newUser("Оқушы Z");
    await as(S.student.id, (q) => q("select public.join_classroom($1)", [S.code]));
  });
  const actions = async () => (await admin("select action from audit_logs where org_id = $1", [S.org])).map((r) => r.action);

  it("клиент рөлі кестеге тікелей жаза алмайды (RLS + грант)", async () => {
    await fails(as(S.admin.id, (q) => q("update organizations set name = 'hack' where id = $1", [S.org])), "permission denied");
    await fails(as(S.teacher.id, (q) => q("insert into grades(org_id) values ($1)", [S.org])), "permission denied");
    await fails(as(S.student.id, (q) => q("delete from audit_logs")), "permission denied");
  });

  it("өз профильінің атын ауыстыра алады, бірақ басқаның профилін емес (0 жол)", async () => {
    await as(S.student.id, (q) => q("update profiles set full_name = 'Жаңа Аты' where id = $1", [S.student.id]));
    const n = await as(S.student.id, (q) => q("update profiles set full_name = 'Хак' where id = $1 returning id", [S.teacher.id]));
    assert.equal(n.length, 0);
  });

  it("код жаңарту, ату, шақыруды қайтарып алу, сынып күйі аудитке түседі", async () => {
    await as(S.teacher.id, (q) => q("select public.regenerate_join_code($1)", [S.cls]));
    await as(S.teacher.id, (q) => q("select public.update_classroom($1,'9А','2025-2026','Информатика',null,null,false,false)", [S.cls]));
    await as(S.teacher.id, (q) => q("select public.remove_student($1,$2)", [S.cls, S.student.id]));
    const tk = await as(S.admin.id, (q) => q("select public.create_invitation($1,'teacher') as t", [S.org]));
    const inv = (await admin("select id from invitations where org_id=$1 and accepted_at is null", [S.org]))[0].id;
    await as(S.admin.id, (q) => q("select public.revoke_invitation($1)", [inv]));
    const a = await actions();
    for (const x of ["classroom.join_code_regenerated", "classroom.join_toggle", "classroom.student_removed", "invitation.revoke"]) {
      assert.ok(a.includes(x), `аудитте жоқ: ${x} (бар: ${[...new Set(a)].join(", ")})`);
    }
    assert.ok(tk[0].t);
    // токен/код журналға түспейді
    const meta = JSON.stringify(await admin("select meta from audit_logs where org_id=$1", [S.org]));
    assert.ok(!meta.includes(S.code) && !meta.includes(tk[0].t));
  });

  it("audit_export: тек құрамы (staff) жаза алады, түрі тексеріледі", async () => {
    await as(S.teacher.id, (q) => q("select public.audit_export($1, 'class_csv', $2)", [S.org, S.cls]));
    assert.ok((await actions()).includes("export.class_csv"));
    await fails(as(S.student.id, (q) => q("select public.audit_export($1, 'class_csv')", [S.org])), "forbidden");
    await fails(as(S.teacher.id, (q) => q("select public.audit_export($1, 'drop table')", [S.org])), "invalid_input");
  });

  it("audit_logs өзгермейді: UPDATE/DELETE суперпайдаланушыға да тыйым", async () => {
    await fails(admin("update audit_logs set action = 'x'"), "audit_immutable");
    await fails(admin("delete from audit_logs"), "audit_immutable");
  });

  it("оқушы мұғалімнің кіру кодын/шақыру хэшін/жауап кілтін көрмейді", async () => {
    await fails(as(S.student.id, (q) => q("select token_hash from invitations")), "permission denied");
    const keys = await as(S.student.id, (q) => q("select * from assignment_answer_keys"));
    assert.equal(keys.length, 0);
  });
});
