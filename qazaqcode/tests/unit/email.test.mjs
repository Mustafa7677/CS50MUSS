import { test } from "node:test";
import assert from "node:assert/strict";
import { render, escapeHtml, oneLine, kkDate, TEMPLATES } from "../../src/lib/email/templates.ts";
import { readEmailConfig, createTransport, safeError, classifyError } from "../../src/lib/email/transport.ts";

const CTX = { appUrl: "https://qazaq.example.kz/", unsubscribeUrl: "https://qazaq.example.kz/unsubscribe/" + "a".repeat(36) };
const XSS = `<script>alert(1)</script><img src=x onerror=alert(2)>"'&`;
const TOK = "ab".repeat(24);
const SAMPLES = {
  teacher_invite: { org_name: XSS, token: TOK, expires_at: "2026-11-05T10:00:00Z" },
  student_join_info: { org_name: XSS, class_name: XSS, join_code: "AB12CD" },
  licence_expiry: { org_name: XSS, days: 7, valid_until: "2026-12-31" },
  lead_ack: { org_name: XSS },
  order_status: { order_ref: XSS, status: "paid", note: XSS },
  pilot_report_ready: { org_name: XSS, report_title: XSS },
  generic: { subject: XSS, body: XSS + "\n\n" + XSS, link_path: "/school", link_label: XSS },
};

test("шаблондар: пайдаланушы мәтіні HTML-де escape (XSS), сыртқы сурет/трекинг/скрипт жоқ", () => {
  for (const t of TEMPLATES) {
    const r = render(t, SAMPLES[t], CTX);
    assert.ok(!/<script/i.test(r.html), `${t}: <script`);
    assert.ok(!/<img/i.test(r.html), `${t}: <img (сыртқы сурет/пиксель жоқ)`);
    // HTML-дағы бірден-бір теглер: біздің теглер ғана
    const tags = new Set([...r.html.matchAll(/<\/?([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase()));
    for (const x of tags) assert.ok(["html", "head", "meta", "title", "body", "div", "p", "h1", "a", "ol", "li", "br"].includes(x), `${t}: күтпеген тег <${x}>`);
    assert.ok(r.subject.length > 0 && !/[\r\n]/.test(r.subject), `${t}: тақырыпта жол үзілімі`);
    assert.ok(r.text.includes("QazaqCode"));
    assert.ok(!r.html.includes("https://qazaq.example.kz//"), "қос / жоқ");
  }
});

test("escapeHtml: бес таңба; oneLine: басқару таңбалары мен жол үзілімі жойылады, ұзындық шектеледі", () => {
  assert.equal(escapeHtml(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  assert.equal(oneLine("a\r\nBcc: x@y.kz\u0000‮ b"), "a Bcc: x@y.kz b");
  assert.equal(oneLine("я".repeat(500), 10).length, 10);
  assert.equal(oneLine({ x: 1 }), "");
});

test("тақырыпта header injection мүмкін емес", () => {
  const r = render("generic", { subject: "Сәлем\r\nBcc: evil@x.kz", body: "x" }, CTX);
  assert.ok(!/[\r\n]/.test(r.subject));
});

test("қазақ әріптері мәтінде/тақырыпта/HTML-де дұрыс сақталады", () => {
  const kk = "әіңғүұқөһ ӘІҢҒҮҰҚӨҺ";
  const r = render("generic", { subject: `Сынақ ${kk}`, body: kk }, CTX);
  assert.ok(r.subject.includes(kk) && r.text.includes(kk) && r.html.includes(kk));
  assert.ok(r.html.includes('<meta charset="utf-8">') && r.html.includes('lang="kk"'));
  const inv = render("teacher_invite", { org_name: "Мектеп-гимназия №5 «Жас қанат»", token: TOK }, CTX);
  assert.ok(inv.subject.includes("«Мектеп-гимназия №5 «Жас қанат»»"));
});

test("teacher_invite: сілтеме APP_URL негізінде, токен тексеріледі; токенсіз/қате токен - қате", () => {
  const r = render("teacher_invite", SAMPLES.teacher_invite, CTX);
  assert.ok(r.text.includes(`https://qazaq.example.kz/invite/${TOK}`));
  assert.ok(r.html.includes(`href="https://qazaq.example.kz/invite/${TOK}"`));
  assert.ok(r.text.includes("5 қараша 2026"));
  assert.throws(() => render("teacher_invite", { org_name: "X" }, CTX));
  assert.throws(() => render("teacher_invite", { org_name: "X", token: "../../etc" }, CTX));
  assert.throws(() => render("teacher_invite", { org_name: "X", token: TOK + '"><x' }, CTX));
});

test("сілтеме тек қолданба ішінде: ашық бағыттау (//evil, javascript:) өткізілмейді", () => {
  for (const bad of ["//evil.kz/x", "https://evil.kz", "javascript:alert(1)", "/a b", "/<x>", "/" + "a".repeat(300)]) {
    const r = render("generic", { subject: "S", body: "B", link_path: bad }, CTX);
    assert.ok(!r.html.includes("evil") && !r.text.includes("javascript:") && !/href="[^"]*(<|\s)/.test(r.html), bad);
    assert.ok(!/href="(?!https:\/\/qazaq\.example\.kz\/unsubscribe)/.test(r.html), `${bad}: артық сілтеме`);
  }
  assert.ok(render("generic", { subject: "S", body: "B", link_path: "/school/licence?x=1#a" }, CTX).html.includes('href="https://qazaq.example.kz/school/licence?x=1#a"'));
});

test("licence_expiry: 30/14/7/1 мәтіні; 1 = ертең; күн форматы қазақша", () => {
  for (const d of [30, 14, 7]) {
    const r = render("licence_expiry", { org_name: "Мектеп", days: d, valid_until: "2026-12-31" }, CTX);
    assert.ok(r.subject.includes(`${d} күннен кейін`), r.subject);
    assert.ok(r.text.includes("31 желтоқсан 2026"));
    assert.ok(r.text.includes("https://qazaq.example.kz/school/licence"));
  }
  assert.ok(render("licence_expiry", { org_name: "М", days: 1, valid_until: "2026-01-01" }, CTX).subject.includes("ертең аяқталады"));
  assert.equal(kkDate("2026-02-30x"), "30 ақпан 2026".length ? kkDate("2026-02-30x") : "");
  assert.equal(kkDate("nonsense"), "");
});

test("lead_ack: ұйым атауы және келесі қадамдар; жеке деректі (аты, телефон) қайталамайды; unsubscribe сілтемесі бар", () => {
  const r = render("lead_ack", { org_name: "Гимназия №5" }, CTX);
  assert.ok(r.text.includes("«Гимназия №5»") && r.text.includes("Келесі қадамдар"));
  assert.ok(r.text.includes("/unsubscribe/") && r.html.includes("Хат алудан бас тарту"));
  const none = render("lead_ack", { org_name: "X" }, { appUrl: "https://a.kz" });
  assert.ok(!none.html.includes("unsubscribe"));
});

test("order_status / pilot_report_ready интерфейсі: белгілі және белгісіз күй", () => {
  assert.ok(render("order_status", { order_ref: "QC-2026-0001", status: "paid" }, CTX).subject.includes("төлем қабылданды"));
  assert.ok(render("order_status", { order_ref: "R1", status: "custom_x" }, CTX).text.includes("custom_x"));
  assert.ok(render("pilot_report_ready", {}, CTX).text.includes("Пилот есебі дайын"));
  assert.throws(() => render("unknown_tpl", {}, CTX));
  assert.throws(() => render("generic", { body: "x" }, CTX));
});

test("EMAIL_DRIVER: әдепкі (dev=console, prod=off), валидация, өндірісте console тыйым, smtp міндетті өрістер", () => {
  assert.equal(readEmailConfig({}).driver, "console");
  assert.equal(readEmailConfig({ NODE_ENV: "production" }).driver, "off");
  assert.throws(() => readEmailConfig({ EMAIL_DRIVER: "sendgrid" }), /EMAIL_DRIVER/);
  assert.throws(() => readEmailConfig({ EMAIL_DRIVER: "console", NODE_ENV: "production" }), /console/);
  assert.equal(readEmailConfig({ EMAIL_DRIVER: "console", NODE_ENV: "production", ALLOW_LOCAL_AUTH_IN_PRODUCTION: "yes" }).driver, "console");
  assert.throws(() => readEmailConfig({ EMAIL_DRIVER: "smtp" }), /SMTP_HOST/);
  const prod = { EMAIL_DRIVER: "smtp", NODE_ENV: "production", SMTP_HOST: "smtp.mail.kz" };
  assert.throws(() => readEmailConfig(prod), /SMTP_FROM/);
  assert.throws(() => readEmailConfig({ ...prod, SMTP_FROM: "QazaqCode <no@mail.kz>" }), /SMTP_PORT/);
  assert.throws(() => readEmailConfig({ ...prod, SMTP_FROM: "QazaqCode <no@mail.kz>", SMTP_PORT: "587" }), /SMTP_USER/);
  assert.throws(() => readEmailConfig({ ...prod, SMTP_FROM: "a@b.kz", SMTP_PORT: "587", SMTP_USER: "u" }), /бірге/);
  const ok = readEmailConfig({ ...prod, SMTP_FROM: "QazaqCode <no@mail.kz>", SMTP_PORT: "465", SMTP_USER: "u", SMTP_PASS: "p" });
  assert.deepEqual(ok.smtp, { host: "smtp.mail.kz", port: 465, secure: true, user: "u", pass: "p" });
  assert.throws(() => readEmailConfig({ SMTP_FROM: "bad\r\nBcc: x@y.kz" }), /SMTP_FROM/);
  assert.throws(() => readEmailConfig({ EMAIL_DRIVER: "smtp", SMTP_HOST: "h", SMTP_PORT: "99999" }), /SMTP_PORT/);
});

test("қате хабарламасында құпия жоқ (SMTP_PASS, URL ішіндегі логин, password=...)", () => {
  const msg = safeError(new Error("connect failed smtp://user:S3cretPass@host:587 password=S3cretPass\nline2"), ["S3cretPass"]);
  assert.ok(!msg.includes("S3cretPass") && !/\n/.test(msg), msg);
  assert.ok(safeError(new Error("x".repeat(1000))).length <= 200);
  assert.equal(safeError(Object.assign(new Error("Mailbox unavailable"), { code: "EENVELOPE", responseCode: 550 })), "EENVELOPE 550 Mailbox unavailable");
});

test("қате жіктемесі: RCPT 550 = тұрақты + bounce; 4xx/желі = қайталау", () => {
  assert.deepEqual(classifyError({ responseCode: 550, command: "RCPT TO" }), { permanent: true, suppress: "bounce" });
  assert.deepEqual(classifyError({ responseCode: 554, command: "DATA" }), { permanent: true });
  assert.deepEqual(classifyError({ responseCode: 421, command: "CONN" }), { permanent: false });
  assert.deepEqual(classifyError({ responseCode: 535, command: "AUTH PLAIN" }), { permanent: false });
  assert.deepEqual(classifyError(new Error("ECONNRESET")), { permanent: false });
});

test("console транспорты: хатты логқа жазады, желіге шықпайды; off - жібермейді", async () => {
  const lines = [];
  const t = createTransport({ driver: "console", from: "QazaqCode <noreply@localhost>" }, (l) => lines.push(l));
  const r = await t.send({ to: "a@b.kz", subject: "Тақырып", text: "Мәтін\nекінші", html: "<p>x</p>" });
  assert.equal(r.accepted, true);
  assert.ok(lines[0].includes("To: a@b.kz") && lines[0].includes("Тақырып") && lines[0].includes("екінші"));
  const off = createTransport({ driver: "off", from: "x@y.kz" });
  await assert.rejects(off.send({ to: "a@b.kz", subject: "s", text: "t", html: "h" }), /off/);
});
