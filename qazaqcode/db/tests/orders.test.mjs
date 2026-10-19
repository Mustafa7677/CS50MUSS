// Табыс арнасы (0014): RLS, күйлер ауысуы, шот нөмірі, снапшот, активтендіру, лимиттер, еске салғыштар, аудит.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { pool, admin, as, fails, newUser, reset, future, past } from "./helpers.mjs";

after(() => pool.end());
const S = {};

const BUYER = ["Мектеп-гимназия №5 КММ", "123456789012", "Астана қ., Тест көшесі 1", "Тест банк АҚ", "TESTKZKX", "KZ00TEST000000000001", "14"];
const SELLER = ["Тест Сатушы ЖШС", "210987654321", "Алматы қ., Тест даңғылы 2", "Тест банк АҚ", "TESTKZKX", "KZ00TEST000000000002", "17", true, "серия 00000", "Басшы Тестов", 7];

const setBuyer = (uid, org, over = {}) => {
  const b = [...BUYER]; Object.assign(b, over);
  return as(uid, (q) => q("select public.set_billing_profile($1,$2,$3,$4,$5,$6,$7,$8)", [org, ...b]));
};
const setSeller = (uid, over = {}) => {
  const s = [...SELLER]; Object.assign(s, over);
  return as(uid, (q) => q("select public.set_seller_profile($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", s));
};
const setPrice = (uid, o = {}) => {
  const p = { id: null, plan: "pro", months: 12, limit: 500, price: 100000000, cur: "KZT", mode: "added", bp: 1200, from: past(1), until: null, active: true, ...o };
  return as(uid, (q) => q("select public.set_price($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as id", [p.id, p.plan, p.months, p.limit, p.price, p.cur, p.mode, p.bp, p.from, p.until, p.active]));
};
const request = (uid, org, o = {}) => {
  const r = { plan: "pro", months: 12, students: 300, teachers: 10, note: null, ...o };
  return as(uid, (q) => q("select public.request_licence($1,$2,$3,$4,$5,$6) as id", [org, r.plan, r.months, r.students, r.teachers, r.note]));
};
const call = (uid, sql, params) => as(uid, (q) => q(sql, params));
const order = async (id) => (await admin("select * from public.licence_orders where id=$1", [id]))[0];

describe("licence_orders: құқықтар, ағын, снапшот", () => {
  before(async () => {
    await reset();
    await admin("truncate public.platform_prices, public.platform_seller_profile, public.invoice_counters, public.licence_reminder_log, public.notifications cascade");
    S.root = await newUser("Платформа Әкімші");
    await admin("insert into platform_admins(user_id) values ($1)", [S.root.id]);
    const mk = async (name, slug) => {
      const r = (await as(S.root.id, (q) => q("select public.create_organization($1,$2,'starter',$3) as r", [name, slug, future(20)])))[0].r;
      const a = await newUser("Әкімші " + slug);
      await as(a.id, (q) => q("select public.accept_invitation($1)", [r.admin_invite_token]));
      return { org: r.org_id, admin: a };
    };
    S.A = await mk("Мектеп A", "order-a");
    S.B = await mk("Мектеп B", "order-b");
    const t = await as(S.A.admin.id, (q) => q("select public.create_invitation($1,'teacher') as t", [S.A.org]));
    S.teacher = await newUser("Мұғалім A");
    await as(S.teacher.id, (q) => q("select public.accept_invitation($1)", [t[0].t]));
    S.outsider = await newUser("Бөтен");
  });

  it("реквизит жоқта тапсырыс берілмейді; дұрыс емес БИН/ИИК/КБе қабылданбайды", async () => {
    await fails(request(S.A.admin.id, S.A.org), "billing_profile_missing");
    await fails(setBuyer(S.A.admin.id, S.A.org, { 1: "12345" }), "invalid_input");
    await fails(setBuyer(S.A.admin.id, S.A.org, { 5: "KZ12" }), "invalid_input");
    await fails(setBuyer(S.A.admin.id, S.A.org, { 6: "1" }), "invalid_input");
    await fails(setBuyer(S.A.admin.id, S.A.org, { 0: "" }), "invalid_input");
    await setBuyer(S.A.admin.id, S.A.org);
    await setBuyer(S.B.admin.id, S.B.org, { 0: "Мектеп B КММ", 1: "999999999999" });
    const row = (await admin("select * from org_billing_profile where org_id=$1", [S.A.org]))[0];
    assert.equal(row.iik, "KZ00TEST000000000001");
  });

  it("реквизитті тек өз ұйымының әкімшісі енгізеді/көреді; мұғалім, бөтен, басқа ұйым көрмейді", async () => {
    await fails(setBuyer(S.teacher.id, S.A.org), "forbidden");
    await fails(setBuyer(S.B.admin.id, S.A.org), "forbidden");
    await fails(setBuyer(S.outsider.id, S.A.org), "forbidden");
    assert.equal((await call(S.A.admin.id, "select * from org_billing_profile")).length, 1);
    assert.equal((await call(S.teacher.id, "select * from org_billing_profile")).length, 0);
    assert.equal((await call(S.outsider.id, "select * from org_billing_profile")).length, 0);
    assert.equal((await call(S.root.id, "select * from org_billing_profile")).length, 2);
  });

  it("тапсырыс: тек өз ұйымына; валидация; күй requested; аудит қаржысыз", async () => {
    await fails(request(S.B.admin.id, S.A.org), "forbidden");
    await fails(request(S.teacher.id, S.A.org), "forbidden");
    await fails(request(S.root.id, S.A.org), "forbidden");
    await fails(request(S.A.admin.id, S.A.org, { months: 0 }), "invalid_input");
    await fails(request(S.A.admin.id, S.A.org, { months: 61 }), "invalid_input");
    await fails(request(S.A.admin.id, S.A.org, { students: 0 }), "invalid_input");
    await fails(request(S.A.admin.id, S.A.org, { teachers: 0 }), "invalid_input");
    await fails(request(S.A.admin.id, S.A.org, { note: "x".repeat(1001) }), "invalid_input");
    S.o1 = (await request(S.A.admin.id, S.A.org, { note: "Жаңарту" }))[0].id;
    const o = await order(S.o1);
    assert.equal(o.status, "requested");
    assert.equal(o.buyer_snapshot.bin_iin, "123456789012");
    assert.equal(o.price_tiyn, null);
    const log = await admin("select meta, action from audit_logs where entity_id=$1", [S.o1]);
    assert.deepEqual(log.map((l) => l.action), ["order.request"]);
    assert.ok(!JSON.stringify(log[0].meta).match(/tiyn|total|bin|iik|123456789012/));
    // SUPER ADMIN-ге хабарландыру
    assert.ok((await admin("select 1 from notifications where user_id=$1 and kind='licence'", [S.root.id])).length >= 1);
  });

  it("RLS: өз тапсырысын көреді; басқа ұйым, мұғалім, бөтен көрмейді; SUPER ADMIN көреді; тікелей жазу жоқ", async () => {
    assert.equal((await call(S.A.admin.id, "select id from licence_orders")).length, 1);
    assert.equal((await call(S.B.admin.id, "select id from licence_orders")).length, 0);
    assert.equal((await call(S.teacher.id, "select id from licence_orders")).length, 0);
    assert.equal((await call(S.outsider.id, "select id from licence_orders")).length, 0);
    assert.equal((await call(S.root.id, "select id from licence_orders")).length, 1);
    await fails(call(S.A.admin.id, "update licence_orders set status='paid'"), "permission denied");
    await fails(call(S.A.admin.id, "insert into licence_orders(org_id,plan,months,students,teachers) values ($1,'pro',1,1,1)", [S.A.org]), "permission denied");
    await fails(call(S.A.admin.id, "delete from licence_orders"), "permission denied");
    await fails(call(S.A.admin.id, "update org_billing_profile set bin_iin='111111111111'"), "permission denied");
    await fails(call(S.A.admin.id, "select * from invoice_counters"), "permission denied");
    await fails(call(S.A.admin.id, "select * from licence_reminder_log"), "permission denied");
    assert.equal((await call(S.A.admin.id, "select * from platform_prices")).length, 0);
    assert.equal((await call(S.A.admin.id, "select * from platform_seller_profile")).length, 0);
  });

  it("SUPER ADMIN емес қолданушы баға/сатушы/ұсыныс/шот/төлем/активтендіруге жете алмайды", async () => {
    const u = S.A.admin.id;
    await fails(setPrice(u), "forbidden");
    await fails(setSeller(u), "forbidden");
    await fails(call(u, "select public.quote_order($1)", [S.o1]), "forbidden");
    await fails(call(u, "select public.issue_invoice($1)", [S.o1]), "forbidden");
    await fails(call(u, "select public.mark_paid($1,'r',current_date)", [S.o1]), "forbidden");
    await fails(call(u, "select public.activate_order($1)", [S.o1]), "forbidden");
    await fails(call(u, "select public.reject_order($1)", [S.o1]), "forbidden");
    await fails(call(u, "select * from public.admin_list_orders()"), "forbidden");
    await fails(call(u, "select public.licence_reminders()"), "forbidden");
    await fails(call(u, "select public.delete_price(gen_random_uuid())"), "forbidden");
  });

  it("баға жоқта «price_not_set»; келісім бойынша ұсыныс беруге болады; баға тізімі бос", async () => {
    assert.deepEqual(await call(S.A.admin.id, "select * from public.price_list()"), []);
    await fails(call(S.root.id, "select public.quote_order($1)", [S.o1]), "price_not_set");
    await fails(call(S.root.id, "select public.quote_order($1, 5000000)", [S.o1]), "invalid_input"); // валюта/ҚҚС ашық көрсетілмеген
    await fails(call(S.root.id, "select public.quote_order($1, 5000000, 'KZT', 'none', 1200)", [S.o1]), "invalid_input");
    await call(S.root.id, "select public.quote_order($1, 5000000, 'KZT', 'none', 0, 'Келісілген')", [S.o1]);
    const o = await order(S.o1);
    assert.equal(o.status, "quoted"); assert.equal(o.price_source, "negotiated");
    assert.deepEqual([o.net_tiyn, o.vat_tiyn, o.total_tiyn].map(Number), [5000000, 0, 5000000]);
  });

  it("шот: сатушы профилі жоқта берілмейді; ҚҚС төлеушісі емес сатушы ҚҚС-ты шотқа жаза алмайды", async () => {
    await fails(call(S.root.id, "select public.issue_invoice($1)", [S.o1]), "seller_profile_missing");
    await fails(setSeller(S.root.id, { 1: "abc" }), "invalid_input");
    await fails(setSeller(S.root.id, { 8: null }), "invalid_input"); // ҚҚС төлеушісі: куәлік міндетті
    await fails(setSeller(S.root.id, { 10: 0 }), "invalid_input");
    await setSeller(S.root.id, { 7: false, 8: null });
    // ұсыныс «added 12%» болса, ҚҚС төлеушісі емес сатушы шот бере алмайды
    await call(S.root.id, "select public.quote_order($1, 5000000, 'KZT', 'added', 1200)", [S.o1]);
    await fails(call(S.root.id, "select public.issue_invoice($1)", [S.o1]), "vat_mismatch");
    await call(S.root.id, "select public.quote_order($1, 5000000, 'KZT', 'none', 0)", [S.o1]);
    await setSeller(S.root.id);
  });

  it("баға тізімі: сатылар, жарамдылық күні, белсенділік; жарамсыз мәндер қабылданбайды", async () => {
    await fails(setPrice(S.root.id, { price: 0 }), "invalid_input");
    await fails(setPrice(S.root.id, { mode: "none", bp: 1200 }), "invalid_input");
    await fails(setPrice(S.root.id, { mode: "added", bp: 0 }), "invalid_input");
    await fails(setPrice(S.root.id, { cur: "XXX" }), "invalid_input");
    await fails(setPrice(S.root.id, { until: past(10), from: past(1) }), "invalid_input");
    await fails(setPrice(S.root.id, { months: 0 }), "invalid_input");
    S.pBig = (await setPrice(S.root.id, { limit: 1000, price: 200000000 }))[0].id;
    S.pSmall = (await setPrice(S.root.id, { limit: 500, price: 100000000 }))[0].id;
    await setPrice(S.root.id, { plan: "starter", limit: 100, price: 10000, from: future(5) });       // әлі күшіне енбеген
    await setPrice(S.root.id, { plan: "starter", limit: 200, price: 10000, until: past(1), from: past(30) }); // мерзімі өткен
    await setPrice(S.root.id, { plan: "starter", limit: 300, price: 10000, active: false });           // өшірулі
    const list = await call(S.A.admin.id, "select * from public.price_list()");
    assert.deepEqual(list.map((r) => r.student_limit), [500, 1000]);
    assert.equal(Number(list[0].vat_tiyn), 12000000);
    assert.equal(Number(list[0].total_tiyn), 112000000);
  });

  it("тізімнен ұсыныс: ең кіші жеткілікті саты; сатыдан асса баға жоқ", async () => {
    const o2 = (await request(S.A.admin.id, S.A.org, { students: 600, teachers: 20 }))[0].id;
    await call(S.root.id, "select public.quote_order($1)", [o2]);
    const q = await order(o2);
    assert.equal(q.price_id, S.pBig); assert.equal(Number(q.price_tiyn), 200000000);
    assert.deepEqual([q.net_tiyn, q.vat_tiyn, q.total_tiyn].map(Number), [200000000, 24000000, 224000000]);
    const o3 = (await request(S.A.admin.id, S.A.org, { students: 5000 }))[0].id;
    await fails(call(S.root.id, "select public.quote_order($1)", [o3]), "price_not_set");
    await call(S.A.admin.id, "select public.cancel_order($1)", [o3]);
    await call(S.A.admin.id, "select public.cancel_order($1)", [o2]);
  });

  it("күйлер ауысу тәртібі: секіруге болмайды (шотсыз төлем, төлемсіз активтендіру)", async () => {
    const o = (await request(S.A.admin.id, S.A.org, { students: 400, teachers: 12 }))[0].id;
    S.o2 = o;
    await fails(call(S.root.id, "select public.issue_invoice($1)", [o]), "order_invalid_state");
    await fails(call(S.root.id, "select public.mark_paid($1,'ref',current_date)", [o]), "order_invalid_state");
    await fails(call(S.root.id, "select public.activate_order($1)", [o]), "order_invalid_state");
    await call(S.root.id, "select public.quote_order($1)", [o]);
    await fails(call(S.root.id, "select public.mark_paid($1,'ref',current_date)", [o]), "order_invalid_state");
    await fails(call(S.root.id, "select public.activate_order($1)", [o]), "order_invalid_state");
    // триггер те дерекқор деңгейінде қорғайды (RPC-ден тыс)
    await fails(admin("update licence_orders set status='paid' where id=$1", [o]), "order_invalid_state");
    await fails(admin("update licence_orders set status='activated' where id=$1", [o]), "order_invalid_state");
  });

  it("шот: дәйекті жылдық нөмір, дубликат жоқ, күні/мерзімі, снапшот; бұрынғы o1 екінші нөмір", async () => {
    const no1 = (await call(S.root.id, "select public.issue_invoice($1) as n", [S.o1]))[0].n;
    const no2 = (await call(S.root.id, "select public.issue_invoice($1) as n", [S.o2]))[0].n;
    const y = String(new Date().getUTCFullYear());
    assert.match(no1, /^\d{4}-\d{5}$/);
    const n1 = Number(no1.split("-")[1]), n2 = Number(no2.split("-")[1]);
    assert.equal(no1.split("-")[0], no2.split("-")[0]);
    assert.equal(n2, n1 + 1, "нөмірлер дәйекті");
    assert.ok(Math.abs(Number(no1.split("-")[0]) - Number(y)) <= 1);
    await fails(call(S.root.id, "select public.issue_invoice($1)", [S.o1]), "order_invalid_state"); // қайта шот жоқ
    await assert.rejects(admin("update licence_orders set invoice_no=$1 where id=$2", [no1, S.o2]), /duplicate key|order_snapshot_locked/);
    const dup = await admin("select invoice_no, count(*)::int n from licence_orders where invoice_no is not null group by 1 having count(*) > 1");
    assert.deepEqual(dup, []);
    const o = await order(S.o1);
    assert.equal(o.status, "invoiced");
    assert.equal(o.seller_snapshot.iik, "KZ00TEST000000000002");
    assert.equal(o.buyer_snapshot.legal_name, BUYER[0]);
    assert.equal(Number(o.due_date.getTime() - o.invoice_date.getTime()) / 864e5, 7);
    S.no1 = no1;
  });

  it("параллель шот беру: нөмірлер қайталанбайды", async () => {
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const id = (await request(S.B.admin.id, S.B.org, { students: 100 + i }))[0].id;
      await call(S.root.id, "select public.quote_order($1, 1000000, 'KZT', 'none', 0)", [id]);
      ids.push(id);
    }
    const res = await Promise.all(ids.map((id) => call(S.root.id, "select public.issue_invoice($1) as n", [id]).then((r) => r[0].n, (e) => e.message)));
    const nums = res.filter((x) => /^\d{4}-\d{5}$/.test(x));
    assert.equal(new Set(nums).size, nums.length);
    assert.equal(nums.length, 3, JSON.stringify(res));
    S.bOrders = ids;
  });

  it("снапшот өзгермейді: баға тізімі де, реквизит те өзгерсе шот сол күйінде", async () => {
    const before_ = await order(S.o2);
    await setPrice(S.root.id, { id: S.pBig, limit: 1000, price: 999999999, mode: "none", bp: 0 });
    await setSeller(S.root.id, { 0: "Басқа Сатушы ЖШС" });
    await setBuyer(S.A.admin.id, S.A.org, { 0: "Жаңа атау КММ" });
    const after_ = await order(S.o2);
    for (const k of ["price_tiyn", "net_tiyn", "vat_tiyn", "total_tiyn", "buyer_snapshot", "seller_snapshot", "invoice_no", "vat_rate_bp", "currency"]) {
      assert.deepEqual(after_[k], before_[k], k);
    }
    assert.equal(after_.seller_snapshot.legal_name, "Тест Сатушы ЖШС");
    assert.equal(after_.buyer_snapshot.legal_name, BUYER[0]);
    // дерекқор деңгейінде тікелей өзгерту де тыйым
    await fails(admin("update licence_orders set total_tiyn=1 where id=$1", [S.o2]), "order_snapshot_locked");
    await fails(admin("update licence_orders set seller_snapshot='{}' where id=$1", [S.o2]), "order_snapshot_locked");
    await fails(admin("update licence_orders set students=1 where id=$1", [S.o2]), "order_snapshot_locked");
    await fails(call(S.root.id, "select public.quote_order($1, 1, 'KZT', 'none', 0)", [S.o2]), "order_invalid_state");
    await setSeller(S.root.id);
    await setBuyer(S.A.admin.id, S.A.org);
    await setPrice(S.root.id, { id: S.pBig, limit: 1000, price: 200000000 });
  });

  it("басқа ұйым тапсырысты бас тарта/көре алмайды (not_found); төлем белгісі валидациясы", async () => {
    await fails(call(S.B.admin.id, "select public.cancel_order($1)", [S.o1]), "not_found");
    await fails(call(S.teacher.id, "select public.cancel_order($1)", [S.o1]), "not_found");
    await fails(call(S.root.id, "select public.mark_paid($1,'',current_date)", [S.o1]), "invalid_input");
    await fails(call(S.root.id, "select public.mark_paid($1,'x',current_date + 3)", [S.o1]), "invalid_payment_date");
    await fails(call(S.root.id, "select public.mark_paid($1,'x',current_date - 10)", [S.o1]), "invalid_payment_date");
    await fails(call(S.root.id, "select public.mark_paid($1,$2,current_date)", [S.o1, "x".repeat(101)]), "invalid_input");
  });

  it("төленді -> активтенді: лицензия ұзарады (мерзім + лимит), плана мен лимит беріледі, хабарландыру", async () => {
    const lic0 = (await admin("select * from licenses where org_id=$1", [S.A.org]))[0];
    await call(S.root.id, "select public.mark_paid($1,'ПП №77',current_date)", [S.o1]);
    let o = await order(S.o1);
    assert.equal(o.status, "paid"); assert.equal(o.paid_ref, "ПП №77");
    await fails(call(S.A.admin.id, "select public.cancel_order($1)", [S.o1]), "order_invalid_state"); // төленген соң бас тартылмайды
    await fails(call(S.root.id, "select public.reject_order($1)", [S.o1]), "order_invalid_state");
    await fails(call(S.root.id, "select public.mark_paid($1,'қайта',current_date)", [S.o1]), "order_invalid_state");
    const until = (await call(S.root.id, "select public.activate_order($1) as d", [S.o1]))[0].d;
    o = await order(S.o1);
    assert.equal(o.status, "activated");
    const lic = (await admin("select * from licenses where org_id=$1", [S.A.org]))[0];
    assert.equal(lic.plan, "pro");
    assert.equal(lic.max_students, 300); assert.equal(lic.max_teachers, 10);
    assert.equal(lic.status, "active");
    // мерзім = ескі valid_until (болашақта) + 12 ай
    const exp = new Date(lic0.valid_until); exp.setMonth(exp.getMonth() + 12);
    assert.equal(lic.valid_until.toISOString().slice(0, 10), exp.toISOString().slice(0, 10));
    assert.equal(new Date(until).toISOString().slice(0, 10), lic.valid_until.toISOString().slice(0, 10));
    await fails(call(S.root.id, "select public.activate_order($1)", [S.o1]), "order_invalid_state"); // екі рет емес
    const nt = await admin("select title from notifications where user_id=$1 and kind='licence' order by created_at", [S.A.admin.id]);
    assert.ok(nt.some((n) => n.title === "Лицензия жаңартылды"));
    // жаңа лимитпен нақты жұмыс істейді
    const [c] = await admin("select max_students from licenses where org_id=$1", [S.A.org]);
    assert.equal(c.max_students, 300);
    // аудит қаржысыз
    const log = await admin("select action, meta from audit_logs where entity_id=$1 order by id", [S.o1]);
    assert.deepEqual(log.map((l) => l.action), ["order.request", "order.quote", "order.quote", "order.quote", "order.invoice", "order.paid", "order.activate"]);
    assert.ok(!JSON.stringify(log).match(/total|tiyn|iik|123456789012|ПП/));
  });

  it("мерзімі өткен лицензия активтенгенде бүгіннен санайды; бұрын лицензия жоқ ұйымға жаңа лицензия беріледі", async () => {
    await admin("update licenses set valid_until=$2, valid_from=$2 where org_id=$1", [S.B.org, past(40)]);
    const id = S.bOrders[0];
    await call(S.root.id, "select public.mark_paid($1,'B-1',current_date)", [id]);
    const until = (await call(S.root.id, "select public.activate_order($1) as d", [id]))[0].d;
    const o = await order(id);
    const lic = (await admin("select * from licenses where org_id=$1", [S.B.org]))[0];
    const exp = new Date(); exp.setMonth(exp.getMonth() + 12);
    assert.ok(Math.abs(+lic.valid_until - +exp) <= 2 * 864e5, String(lic.valid_until));
    assert.equal(lic.max_students, o.students);
    assert.equal((await admin("select public.license_state($1) s", [S.B.org]))[0].s, "active");
    // лицензиясыз ұйым
    await admin("delete from licenses where org_id=$1", [S.B.org]);
    const id2 = S.bOrders[1];
    await call(S.root.id, "select public.mark_paid($1,'B-2',current_date)", [id2]);
    await call(S.root.id, "select public.activate_order($1)", [id2]);
    assert.equal((await admin("select public.license_state($1) s", [S.B.org]))[0].s, "active");
  });

  it("лицензия күйін құрметтейді: тоқтатылған лицензия/ұйым өздігінен қосылмайды", async () => {
    const id = S.bOrders[2];
    await call(S.root.id, "select public.mark_paid($1,'B-3',current_date)", [id]);
    await admin("update licenses set status='suspended' where org_id=$1", [S.B.org]);
    await fails(call(S.root.id, "select public.activate_order($1)", [id]), "license_suspended");
    await admin("update licenses set status='active' where org_id=$1", [S.B.org]);
    await admin("update organizations set status='suspended' where id=$1", [S.B.org]);
    await fails(call(S.root.id, "select public.activate_order($1)", [id]), "org_suspended");
    await fails(request(S.B.admin.id, S.B.org), "org_suspended");
    await admin("update organizations set status='active' where id=$1", [S.B.org]);
    await call(S.root.id, "select public.activate_order($1)", [id]);
    assert.equal((await order(id)).status, "activated");
  });

  it("бас тарту/қабылдамау: тек рұқсат етілген күйлерде; жабық күйден шығу жоқ", async () => {
    const id = (await request(S.A.admin.id, S.A.org))[0].id;
    await call(S.A.admin.id, "select public.cancel_order($1)", [id]);
    assert.equal((await order(id)).status, "cancelled");
    await fails(call(S.A.admin.id, "select public.cancel_order($1)", [id]), "order_invalid_state");
    await fails(call(S.root.id, "select public.quote_order($1, 100, 'KZT', 'none', 0)", [id]), "order_invalid_state");
    await fails(admin("update licence_orders set status='requested' where id=$1", [id]), "order_invalid_state");
    const id2 = (await request(S.A.admin.id, S.A.org))[0].id;
    await call(S.root.id, "select public.reject_order($1, 'Себеп')", [id2]);
    const o = await order(id2);
    assert.equal(o.status, "rejected"); assert.equal(o.admin_note, "Себеп");
    await fails(call(S.root.id, "select public.reject_order($1)", [id2]), "order_invalid_state");
    // шот берілген соң бас тартуға болады, нөмір сақталады
    const id3 = (await request(S.A.admin.id, S.A.org))[0].id;
    await call(S.root.id, "select public.quote_order($1, 1000, 'KZT', 'none', 0)", [id3]);
    const no = (await call(S.root.id, "select public.issue_invoice($1) as n", [id3]))[0].n;
    await call(S.A.admin.id, "select public.cancel_order($1)", [id3]);
    const c = await order(id3);
    assert.equal(c.status, "cancelled"); assert.equal(c.invoice_no, no);
  });

  it("ашық тапсырыс шегі (5) және SUPER ADMIN тізімі жеке дерексіз", async () => {
    await admin("update licence_orders set status='cancelled' where org_id=$1 and status in ('requested','quoted','invoiced')", [S.A.org]);
    const ids = [];
    for (let i = 0; i < 5; i++) ids.push((await request(S.A.admin.id, S.A.org, { students: 10 + i }))[0].id);
    await fails(request(S.A.admin.id, S.A.org), "order_limit");
    for (const id of ids) await call(S.A.admin.id, "select public.cancel_order($1)", [id]);
    const list = await call(S.root.id, "select * from public.admin_list_orders()");
    assert.ok(list.length >= 5);
    assert.ok(list[0].org_name && "buyer_bin_iin" in list[0]);
    const cols = Object.keys(list[0]).join(",");
    assert.ok(!/email|phone|password|student_id/.test(cols), cols);
    assert.ok((await call(S.root.id, "select * from public.admin_list_orders('activated')")).every((r) => r.status === "activated"));
    await fails(call(S.root.id, "select * from public.admin_list_orders('zzz')"), "invalid_status");
  });
});

describe("vat_split: дәлдік және дөңгелектеу (тиын)", () => {
  const v = async (p, m, bp) => (await admin("select net::text, vat::text, total::text from public.vat_split($1,$2,$3)", [p, m, bp]))[0];
  it("none/added/included", async () => {
    assert.deepEqual(await v(10000, "none", 0), { net: "10000", vat: "0", total: "10000" });
    assert.deepEqual(await v(10000, "added", 1200), { net: "10000", vat: "1200", total: "11200" });
    assert.deepEqual(await v(11200, "included", 1200), { net: "10000", vat: "1200", total: "11200" });
  });
  it("жартысынан жоғары дөңгелектеу; net + vat = total әрқашан", async () => {
    // 1 тиын x 12% = 0,12 -> 0; 5 x 12% = 0,6 -> 1; 4 x 12,5% = 0,5 -> 1 (half up)
    assert.equal((await v(1, "added", 1200)).vat, "0");
    assert.equal((await v(5, "added", 1200)).vat, "1");
    assert.equal((await v(4, "added", 1250)).vat, "1");
    assert.equal((await v(3, "added", 1250)).vat, "0"); // 0,375
    for (const p of [1, 7, 99, 100, 101, 12345, 99999999, 100000001])
      for (const bp of [1, 500, 1200, 1250, 1600, 2000])
        for (const m of ["added", "included"]) {
          const r = await v(p, m, bp);
          assert.equal(BigInt(r.net) + BigInt(r.vat), BigInt(r.total), `${p} ${m} ${bp}`);
          if (m === "included") assert.equal(r.total, String(p));
          else assert.equal(r.net, String(p));
        }
    // included: 11200 тиын, 12% -> vat = 11200*12/112 = 1200 нақты; 100 тиын -> 100*12/112 = 10,714 -> 11
    assert.equal((await v(100, "included", 1200)).vat, "11");
  });
  it("жарамсыз кіріс қабылданбайды", async () => {
    await fails(admin("select * from public.vat_split(-1,'none',0)"), "invalid_input");
    await fails(admin("select * from public.vat_split(1,'x',0)"), "invalid_input");
  });
});

describe("licence_reminders: 30/14/7/1, бір реттік, мерзім ұзарса қайта", () => {
  const cnt = async (org) => Number((await admin("select count(*)::int n from notifications where org_id=$1 and kind='licence' and title like 'Лицензия %аяқталады'", [org]))[0].n);
  // «Уақыт өтті» имитациясы: valid_until тұрақты болуы тиіс, сондықтан тек бүгінгі күн ығысады - журналдағы valid_until-ды да ауыстырамыз.
  // keepLog=false - мерзім ұзартылды (журнал өзгермейді, жаңа цикл).
  const setDays = async (org, d, simulateTime = true) => {
    const old = (await admin("select valid_until from licenses where org_id=$1", [org]))[0].valid_until;
    await admin("update licenses set valid_until=current_date + $2::int, valid_from=least(valid_from, current_date + $2::int) where org_id=$1", [org, d]);
    if (simulateTime) await admin("update licence_reminder_log set valid_until=current_date + $2::int where org_id=$1 and valid_until=$3", [org, d, old]);
  };
  const run = async () => Number((await admin("select public.licence_reminders() n"))[0].n);
  before(async () => {
    await admin("truncate public.licence_reminder_log; delete from notifications");
    await admin("update licenses set valid_until=current_date + 100, status='active' where org_id=$1", [S.B.org]);
  });
  it("31 күн қалса жібермейді; 30 күнде 1 рет (бірнеше әкімшіге)", async () => {
    const extra = await newUser("Әкімші 2 A");
    const inv = await as(S.root.id, (q) => q("select public.create_invitation($1,'school_admin') as t", [S.A.org]));
    await as(extra.id, (q) => q("select public.accept_invitation($1)", [inv[0].t]));
    await setDays(S.A.org, 31);
    assert.equal(await run(), 0);
    await setDays(S.A.org, 30);
    assert.equal(await run(), 2);        // екі әкімші
    assert.equal(await run(), 0);        // қайталанбайды
    assert.equal(await cnt(S.A.org), 2);
    assert.equal(await cnt(S.B.org), 0);  // B-да мерзім ұзақ
  });
  it("29..15 күн: босаға 30 бұрын жіберілген - қайталамайды; 14, 7, 1 және бүгін", async () => {
    await setDays(S.A.org, 20); assert.equal(await run(), 0);
    await setDays(S.A.org, 14); assert.equal(await run(), 2);
    await setDays(S.A.org, 10); assert.equal(await run(), 0);
    await setDays(S.A.org, 7); assert.equal(await run(), 2);
    await setDays(S.A.org, 3); assert.equal(await run(), 0);
    await setDays(S.A.org, 1); assert.equal(await run(), 2);
    await setDays(S.A.org, 0); assert.equal(await run(), 0);   // 0 күн те босаға 1: қайталанбайды
    assert.equal(await cnt(S.A.org), 8);
    const t = await admin("select title, link from notifications where org_id=$1 and kind='licence' and title like 'Лицензия %аяқталады' order by created_at, id", [S.A.org]);
    assert.equal(t.at(-1).link, "/school/licence/order");
    assert.ok(t.some((x) => x.title === "Лицензия 14 күннен кейін аяқталады"));
  });
  it("өткен күн қалып өткізіліп кетсе келесі іске қосуда жеткізіледі (босаға 14 өткізіп 10 күнде)", async () => {
    await admin("truncate public.licence_reminder_log; delete from notifications");
    await setDays(S.A.org, 10);
    assert.equal(await run(), 2);
    assert.equal(await run(), 0);
  });
  it("мерзімі өткен, тоқтатылған лицензия мен ұйымға жібермейді; мерзім ұзарса цикл қайта басталады", async () => {
    await admin("truncate public.licence_reminder_log; delete from notifications");
    await setDays(S.A.org, -1); assert.equal(await run(), 0);
    await setDays(S.A.org, 5); await admin("update licenses set status='suspended' where org_id=$1", [S.A.org]); assert.equal(await run(), 0);
    await admin("update licenses set status='active' where org_id=$1", [S.A.org]);
    await admin("update organizations set status='suspended' where id=$1", [S.A.org]); assert.equal(await run(), 0);
    await admin("update organizations set status='active' where id=$1", [S.A.org]);
    assert.equal(await run(), 2);
    await setDays(S.A.org, 200, false); assert.equal(await run(), 0);
    await setDays(S.A.org, 6, false);  // жаңа valid_until -> жаңа цикл
    assert.equal(await run(), 2);
  });
  it("тек SUPER ADMIN не тікелей DB қосылымы; мектеп әкімшісі жасай алмайды", async () => {
    await fails(call(S.A.admin.id, "select public.licence_reminders()"), "forbidden");
    await fails(call(S.teacher.id, "select public.licence_reminders()"), "forbidden");
    await call(S.root.id, "select public.licence_reminders()");
  });
});

describe("каталог: жаңа кестелер мен функциялар жабық", () => {
  it("RLS бар, anon-ға ештеңе жоқ, функциялар PUBLIC/anon-ға ашық емес", async () => {
    const t = ["platform_prices", "platform_seller_profile", "org_billing_profile", "invoice_counters", "licence_orders", "licence_reminder_log"];
    const rls = await admin("select relname from pg_class where relname = any($1) and not relrowsecurity", [t]);
    assert.deepEqual(rls, []);
    const anon = await admin("select relname from pg_class where relname = any($1) and has_table_privilege('anon', oid, 'select, insert, update, delete')", [t]);
    assert.deepEqual(anon, []);
    const fn = await admin(`select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and
      proname = any($1) and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('public', p.oid, 'execute'))`,
      [["set_billing_profile", "set_seller_profile", "set_price", "delete_price", "price_list", "request_licence", "quote_order", "issue_invoice", "mark_paid", "activate_order", "reject_order", "cancel_order", "admin_list_orders", "licence_reminders", "vat_split", "order_notify_admins", "price_lookup", "trg_licence_orders_guard"]]);
    assert.deepEqual(fn, []);
    const u = await newUser("Ішкі Тест 2");
    await fails(call(u.id, "select public.vat_split(1,'none',0)"), "permission denied");
    await fails(call(u.id, "select public.order_notify_admins(null,'x','y')"), "permission denied");
    await fails(as(null, (q) => q("select public.request_licence(gen_random_uuid(),'pro',1,1,1)")), "permission denied");
  });
});
