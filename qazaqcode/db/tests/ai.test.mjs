// QazaqCode Көмекші (ережелі кеңесші): ұйым деңгейінде қосу/өшіру, құқықтар, деректі азайту (әңгіме сақталмайды).
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, asAnon, fails, newUser, reset, future } from "./helpers.mjs";

const S = {};
after(() => pool.end());

async function mkSchool(k) {
  const r = await as(S.root.id, (q) => q("select public.create_organization($1, $2, 'starter', $3) as r", [`Мектеп ${k}`, `ai-${k.toLowerCase()}`, future()]));
  S[k] = { org: r[0].r.org_id };
  S[k].admin = await newUser(`Әкімші ${k}`);
  await as(S[k].admin.id, (q) => q("select public.accept_invitation($1)", [r[0].r.admin_invite_token]));
  const t = await as(S[k].admin.id, (q) => q("select public.create_invitation($1, 'teacher') as t", [S[k].org]));
  S[k].teacher = await newUser(`Мұғалім ${k}`);
  await as(S[k].teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
  S[k].cls = (await as(S[k].teacher.id, (q) => q("select public.create_classroom($1, '9А', '2025-2026', 'Информатика') as id", [S[k].org])))[0].id;
  const code = (await admin("select join_code from classrooms where id=$1", [S[k].cls]))[0].join_code;
  S[k].student = await newUser(`Оқушы ${k}`);
  await as(S[k].student.id, (q) => q("select public.join_classroom($1)", [code]));
}
const mkAssignment = async (k, title, publish) => {
  const id = (await as(S[k].teacher.id, (q) => q("select public.upsert_assignment($1::jsonb) as id", [JSON.stringify({ org_id: S[k].org, title, description: "Сипаттама", kind: "python", max_score: 10 })])))[0].id;
  if (publish) {
    await as(S[k].teacher.id, (q) => q("select public.set_assignment_targets($1, array[$2]::uuid[])", [id, S[k].cls]));
    await as(S[k].teacher.id, (q) => q("select public.set_assignment_status($1, 'published')", [id]));
  }
  return id;
};

describe("Көмекші: құқықтар және деректі азайту", () => {
  before(async () => {
    await reset();
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    await mkSchool("A"); await mkSchool("B");
  });

  it("әдепкіде Көмекші өшірулі: ұйымның барлық мүшесі күйін көреді", async () => {
    for (const who of ["admin", "teacher", "student"]) {
      const r = await as(S.A[who].id, (q) => q("select public.ai_status($1) as s", [S.A.org]));
      assert.equal(r[0].s, false, who);
    }
  });

  it("басқа ұйым мүшесі не анонимді қолданушы күйді көре алмайды", async () => {
    await fails(as(S.B.student.id, (q) => q("select public.ai_status($1)", [S.A.org])), "forbidden");
    await fails(as(S.B.admin.id, (q) => q("select public.ai_status($1)", [S.A.org])), "forbidden");
    await fails(asAnon((q) => q("select public.ai_status($1)", [S.A.org])), "permission denied");
  });

  it("қосу/өшіру тек сол ұйымның мектеп әкімшісіне", async () => {
    await fails(as(S.A.teacher.id, (q) => q("select public.set_ai_settings($1, true)", [S.A.org])), "forbidden");
    await fails(as(S.A.student.id, (q) => q("select public.set_ai_settings($1, true)", [S.A.org])), "forbidden");
    await fails(as(S.B.admin.id, (q) => q("select public.set_ai_settings($1, true)", [S.A.org])), "forbidden");
    await fails(as(S.root.id, (q) => q("select public.set_ai_settings($1, true)", [S.A.org])), "forbidden");
    await fails(asAnon((q) => q("select public.set_ai_settings($1, true)", [S.A.org])), "permission denied");
    await fails(as(S.A.admin.id, (q) => q("select public.set_ai_settings($1, null)", [S.A.org])), "invalid_input");
    assert.equal((await admin("select count(*)::int n from ai_org_settings"))[0].n, 0, "рұқсатсыз әрекеттен жол пайда болды");
  });

  it("әкімші қосады: оқушы мен мұғалім күйді көреді, басқа ұйымға әсер етпейді; аудитке жазылады", async () => {
    await as(S.A.admin.id, (q) => q("select public.set_ai_settings($1, true)", [S.A.org]));
    for (const who of ["admin", "teacher", "student"]) {
      assert.equal((await as(S.A[who].id, (q) => q("select public.ai_status($1) as s", [S.A.org])))[0].s, true, who);
    }
    assert.equal((await as(S.B.student.id, (q) => q("select public.ai_status($1) as s", [S.B.org])))[0].s, false, "B ұйымы өзгермеуі тиіс");
    const log = await admin("select action, meta from audit_logs where org_id=$1 and action='ai.settings'", [S.A.org]);
    assert.equal(log.length, 1);
    assert.equal(log[0].meta.enabled, true);
    assert.ok(!JSON.stringify(log[0].meta).includes("Оқушы"), "аудитте жеке дерек бар");
  });

  it("қайта өшіруге болады", async () => {
    await as(S.A.admin.id, (q) => q("select public.set_ai_settings($1, false)", [S.A.org]));
    assert.equal((await as(S.A.student.id, (q) => q("select public.ai_status($1) as s", [S.A.org])))[0].s, false);
    await as(S.A.admin.id, (q) => q("select public.set_ai_settings($1, true)", [S.A.org]));
  });

  it("баптау кестесін тек сол ұйымның әкімшісі оқиды; жаза алмайды", async () => {
    assert.equal((await as(S.A.admin.id, (q) => q("select * from ai_org_settings"))).length, 1);
    for (const u of [S.A.teacher, S.A.student, S.B.admin, S.B.student, S.root]) {
      assert.equal((await as(u.id, (q) => q("select * from ai_org_settings"))).length, 0, u.name);
    }
    await fails(as(S.A.admin.id, (q) => q("update ai_org_settings set enabled = false")), "permission denied");
    await fails(as(S.A.student.id, (q) => q("insert into ai_org_settings(org_id, enabled) values ($1, true)", [S.A.org])), "permission denied");
  });

  it("деректі азайту: әңгіме/хабар/қолдану кестелері жоқ, тек екі ai_ функциясы", async () => {
    const t = await admin("select table_name from information_schema.tables where table_schema='public' and table_name like 'ai\\_%' order by 1");
    assert.deepEqual(t.map((x) => x.table_name), ["ai_org_settings"]);
    const f = await admin("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname ~ '(^|_)ai_' order by 1");
    assert.deepEqual(f.map((x) => x.proname), ["ai_status", "set_ai_settings"]);
  });

  it("Көмекшіге контекст ретінде көрінбейтін тапсырма берілмейді (RLS): жоба, басқа сынып, басқа ұйым", async () => {
    const pub = await mkAssignment("A", "Көрінетін", true);
    const draft = await mkAssignment("A", "Жоба", false);
    const other = await mkAssignment("B", "Басқа мектеп", true);
    const sel = (id) => as(S.A.student.id, (q) => q("select id, title, description from public.assignments where id = $1", [id]));
    assert.equal((await sel(pub)).length, 1);
    assert.equal((await sel(draft)).length, 0, "жоба тапсырма көрінді");
    assert.equal((await sel(other)).length, 0, "басқа ұйым тапсырмасы көрінді");
    // route пайдаланатын бірдей сұраныс: ұйым сүзгісімен
    const r = await as(S.A.student.id, (q) => q("select title from public.assignments where id = $1 and org_id = $2", [other, S.A.org]));
    assert.equal(r.length, 0);
  });

  it("оқушы басқа оқушының кодын көрмейді (Көмекші тек өз кодын алады)", async () => {
    const aid = await mkAssignment("A", "Код тапсырмасы", true);
    const s2 = await newUser("Оқушы A2");
    const code = (await admin("select join_code from classrooms where id=$1", [S.A.cls]))[0].join_code;
    await as(s2.id, (q) => q("select public.join_classroom($1)", [code]));
    await as(S.A.student.id, (q) => q("select public.save_draft($1, 'print(\"SIRLY_KOD\")', '{}'::jsonb, 1)", [aid]));
    const own = await as(S.A.student.id, (q) => q("select code from public.submissions where assignment_id=$1 and student_id = auth.uid()", [aid]));
    assert.equal(own.length, 1);
    const alien = await as(s2.id, (q) => q("select code from public.submissions where assignment_id=$1 and student_id = auth.uid()", [aid]));
    assert.equal(alien.length, 0);
    const leak = await as(s2.id, (q) => q("select code from public.submissions where code like '%SIRLY_KOD%'"));
    assert.equal(leak.length, 0, "басқа оқушы кодын көріп тұр");
  });
});
