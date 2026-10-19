// Интеграция: scripts/send-emails.mjs --once + жергілікті SMTP (smtp-server). Толық ағын: outbox -> worker -> SMTP -> MIME тексеру.
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { SMTPServer } from "smtp-server";
import { pool, URL as DBURL, admin } from "./helpers.mjs";

const APP = "https://qazaq.example.kz";
const TOK = "cd".repeat(24);
let srv, port, got = [], rejectRcpt = new Set(), authUser = null;

function startSmtp() {
  return new Promise((resolve) => {
    srv = new SMTPServer({
      authOptional: true, allowInsecureAuth: true, disabledCommands: ["STARTTLS"], logger: false,
      onAuth(a, _s, cb) { return authUser && a.username === authUser.user && a.password === authUser.pass ? cb(null, { user: a.username }) : cb(new Error("Invalid login")); },
      onRcptTo(addr, _s, cb) {
        if (authUser && !_s.user) return cb(Object.assign(new Error("auth required"), { responseCode: 530 }));
        return rejectRcpt.has(addr.address) ? cb(Object.assign(new Error("Mailbox unavailable"), { responseCode: 550 })) : cb();
      },
      onData(stream, session, cb) {
        const ch = []; stream.on("data", (c) => ch.push(c));
        stream.on("end", () => { got.push({ raw: Buffer.concat(ch).toString("utf8"), to: session.envelope.rcptTo.map((r) => r.address), from: session.envelope.mailFrom.address, user: session.user }); cb(); });
      },
    });
    srv.listen(0, "127.0.0.1", () => { port = srv.server.address().port; resolve(); });
  });
}

// ---- шағын MIME оқушы ----
function parseHeaders(block) {
  const h = {};
  for (const line of block.replace(/\r\n[ \t]+/g, " ").split(/\r\n/)) { const i = line.indexOf(":"); if (i > 0) h[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim(); }
  return h;
}
const decodeWords = (s) => s.replace(/=\?UTF-8\?([BQ])\?([^?]*)\?=(\s+(?==\?))?/gi, (_, e, t) => e.toUpperCase() === "B" ? Buffer.from(t, "base64").toString("utf8") : Buffer.from(t.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_m, x) => String.fromCharCode(parseInt(x, 16))), "latin1").toString("utf8"));
function decodeBody(body, enc) {
  if (/base64/i.test(enc)) return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
  if (/quoted-printable/i.test(enc)) return Buffer.from(body.replace(/=\r\n/g, "").replace(/=([0-9A-F]{2})/gi, (_m, x) => String.fromCharCode(parseInt(x, 16))), "latin1").toString("utf8");
  return body;
}
function parseMime(raw) {
  const [hb, ...rest] = raw.split("\r\n\r\n");
  const headers = parseHeaders(hb); const body = rest.join("\r\n\r\n");
  const m = /boundary="?([^";\s]+)"?/i.exec(headers["content-type"] ?? "");
  if (!m) return { headers, parts: [{ type: headers["content-type"], text: decodeBody(body, headers["content-transfer-encoding"] ?? "") }] };
  const parts = body.split("--" + m[1]).slice(1).filter((p) => !p.startsWith("--")).map((p) => {
    const [ph, ...pb] = p.replace(/^\r\n/, "").split("\r\n\r\n"); const h = parseHeaders(ph);
    return { type: h["content-type"], enc: h["content-transfer-encoding"], text: decodeBody(pb.join("\r\n\r\n").replace(/\r\n$/, ""), h["content-transfer-encoding"] ?? "") };
  });
  return { headers, parts };
}

function runWorker(args = ["--once"], env = {}) {
  const child = spawn(process.execPath, ["scripts/send-emails.mjs", ...args], {
    env: { PATH: process.env.PATH, DATABASE_URL: DBURL, APP_URL: APP, EMAIL_DRIVER: "smtp", SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port), SMTP_FROM: "QazaqCode <noreply@qazaq.example.kz>", NODE_NO_WARNINGS: "1", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = ""; child.stdout.on("data", (d) => (out += d)); child.stderr.on("data", (d) => (out += d));
  const done = once(child, "exit").then(([code]) => ({ code, out }));
  return { child, done };
}
const enq = (to, template, payload, key = null) => admin("select public.enqueue_email($1,$2,'kk',$3::jsonb,$4,72) id", [to, template, JSON.stringify(payload), key]).then((r) => r[0].id);
const row = async (id) => (await admin("select * from public.email_outbox where id=$1", [id]))[0];

describe("send-emails.mjs --once + жергілікті SMTP", () => {
  before(startSmtp);
  after(async () => { await new Promise((r) => srv.close(r)); await pool.end(); });
  beforeEach(async () => { got = []; rejectRcpt = new Set(); authUser = null; await admin("truncate public.email_outbox, public.email_suppressions, public.email_unsub_tokens"); });

  it("толық ағын: жіберілді, MIME дұрыс (multipart/alternative, UTF-8), тақырып қазақша, сілтемелер мен List-Unsubscribe", async () => {
    const id = await enq("mugalim@example.kz", "teacher_invite", { org_name: "Мектеп-гимназия №5 «Жас қанат»", token: TOK, expires_at: "2026-11-05T10:00:00Z" });
    const lead = await enq("aigul@example.kz", "lead_ack", { org_name: "Әл-Фараби атындағы лицей <b>x</b>" });
    const r = await runWorker().done;
    assert.equal(r.code, 0, r.out);
    assert.equal(got.length, 2);
    for (const i of [id, lead]) { const x = await row(i); assert.equal(x.status, "sent", r.out); assert.deepEqual(x.payload, {}); assert.equal(x.unsub_token, null); assert.ok(x.sent_at); }

    const m = got.find((g) => g.to[0] === "mugalim@example.kz");
    assert.equal(m.from, "noreply@qazaq.example.kz");
    const mime = parseMime(m.raw);
    assert.match(mime.headers["content-type"], /multipart\/alternative/i);
    assert.equal(decodeWords(mime.headers.subject), "QazaqCode: «Мектеп-гимназия №5 «Жас қанат»» сізді мұғалім ретінде шақырды");
    assert.match(mime.headers.subject, /=\?UTF-8\?/i, "тақырып RFC 2047-мен кодталған");
    assert.match(mime.headers.from, /QazaqCode/);
    const [plain, html] = mime.parts;
    assert.match(plain.type, /text\/plain/i); assert.match(plain.type, /utf-8/i);
    assert.match(html.type, /text\/html/i); assert.match(html.type, /utf-8/i);
    for (const p of [plain.text, html.text]) {
      assert.ok(p.includes(`${APP}/invite/${TOK}`), "шақыру сілтемесі");
      assert.ok(p.includes("шақырды"), "қазақша мәтін бұзылмаған");
    }
    assert.ok(plain.text.includes("5 қараша 2026"));
    assert.match(mime.headers["list-unsubscribe"], new RegExp(`^<${APP}/api/email/unsubscribe/[0-9a-f]{36}>$`));
    assert.equal(mime.headers["list-unsubscribe-post"], "List-Unsubscribe=One-Click");
    assert.match(html.text, /href="https:\/\/qazaq\.example\.kz\/unsubscribe\/[0-9a-f]{36}"/);

    const l = parseMime(got.find((g) => g.to[0] === "aigul@example.kz").raw);
    assert.ok(l.parts[1].text.includes("Әл-Фараби атындағы лицей &lt;b&gt;x&lt;/b&gt;"), "пайдаланушы мәтіні HTML-де escape");
    assert.ok(!l.parts[1].text.includes("<b>x</b>"));
    assert.ok(!/Сәрсенбай|\+7/.test(l.parts[0].text));
  });

  it("кезек бос болса жібермейді; екінші іске қосу бұрын жіберілгенді қайталамайды", async () => {
    await enq("one@example.kz", "generic", { subject: "Бір", body: "Мәтін" });
    assert.equal((await runWorker().done).code, 0);
    assert.equal((await runWorker().done).code, 0);
    assert.equal(got.length, 1);
  });

  it("екі worker параллель: әр хат тек бір рет жіберіледі", async () => {
    for (let i = 0; i < 12; i++) await enq(`p${i}@example.kz`, "generic", { subject: `Хат ${i}`, body: "Мәтін" });
    const rs = await Promise.all([runWorker(["--once", "--batch", "3"]).done, runWorker(["--once", "--batch", "3"]).done]);
    for (const r of rs) assert.equal(r.code, 0, r.out);
    assert.equal(got.length, 12);
    assert.equal(new Set(got.map((g) => g.to[0])).size, 12, "қайталану жоқ");
    assert.equal((await admin("select count(*)::int n from public.email_outbox where status='sent'"))[0].n, 12);
  });

  it("RCPT 550: бірден failed, алушы bounce ретінде suppression-ға түседі; келесі хат suppressed", async () => {
    rejectRcpt.add("gone@example.kz");
    const id = await enq("gone@example.kz", "generic", { subject: "С", body: "М" });
    const r = await runWorker().done;
    assert.equal(r.code, 0, r.out);
    const x = await row(id);
    assert.equal(x.status, "failed"); assert.match(x.last_error, /550/);
    assert.equal((await admin("select reason from public.email_suppressions"))[0].reason, "bounce");
    assert.equal((await row(await enq("gone@example.kz", "generic", { subject: "С", body: "М" }))).status, "suppressed");
  });

  it("SMTP авторизация: дұрыс логинмен жіберіледі; қате құпиясөз - қайта кезекке, құпиясөз логта/DB-да жоқ", async () => {
    authUser = { user: "mailer", pass: "Sup3rS3cretPw" };
    const id = await enq("a@example.kz", "generic", { subject: "Авторизация", body: "М" });
    const good = await runWorker(["--once"], { SMTP_USER: "mailer", SMTP_PASS: "Sup3rS3cretPw" }).done;
    assert.equal(good.code, 0, good.out);
    assert.equal((await row(id)).status, "sent"); assert.equal(got[0].user, "mailer");
    const id2 = await enq("b@example.kz", "generic", { subject: "Қате", body: "М" });
    const bad = await runWorker(["--once"], { SMTP_USER: "mailer", SMTP_PASS: "WrongPassword99" }).done;
    assert.equal(bad.code, 0, bad.out);
    const x = await row(id2);
    assert.equal(x.status, "queued"); assert.equal(x.attempts, 1); assert.ok(x.last_error);
    assert.ok(!bad.out.includes("WrongPassword99") && !x.last_error.includes("WrongPassword99") && !bad.out.includes("Sup3rS3cretPw"), "құпия сыртқа шықпады");
  });

  it("EMAIL_DRIVER=off: ештеңе жібермейді, кезек өзгермейді; console: консольге шығарады, 'sent' белгілейді", async () => {
    const id = await enq("off@example.kz", "generic", { subject: "Off", body: "М" });
    const off = await runWorker(["--once"], { EMAIL_DRIVER: "off" }).done;
    assert.equal(off.code, 0); assert.equal(got.length, 0);
    assert.equal((await row(id)).status, "queued"); assert.equal((await row(id)).attempts, 0);
    const con = await runWorker(["--once"], { EMAIL_DRIVER: "console" }).done;
    assert.equal(con.code, 0, con.out);
    assert.ok(con.out.includes("To: off@example.kz") && con.out.includes("Subject: Off"));
    assert.equal((await row(id)).status, "sent"); assert.equal(got.length, 0);
  });

  it("қате баптау (өндірісте console, smtp хостсыз) - бірден қатемен шығады", async () => {
    const r = await runWorker(["--once"], { EMAIL_DRIVER: "smtp", SMTP_HOST: "" }).done;
    assert.equal(r.code, 2); assert.match(r.out, /SMTP_HOST/);
    const p = await runWorker(["--once"], { NODE_ENV: "production", EMAIL_DRIVER: "console" }).done;
    assert.equal(p.code, 2);
  });

  it("шаблон қатесі (жарамсыз payload) бірден failed, worker құламайды", async () => {
    const id = await enq("bad@example.kz", "teacher_invite", { org_name: "X", token: "../../x" });
    const ok = await enq("good@example.kz", "generic", { subject: "Дұрыс", body: "М" });
    const r = await runWorker().done;
    assert.equal(r.code, 0, r.out);
    assert.equal((await row(id)).status, "failed"); assert.match((await row(id)).last_error, /render/);
    assert.equal((await row(ok)).status, "sent");
  });

  it("циклдік режим: SIGTERM-де таза тоқтайды (код 0); жаңа хатты бір интервалда жібереді", async () => {
    const w = runWorker([ "--interval", "1" ]);
    await new Promise((r) => setTimeout(r, 1200));
    await enq("loop@example.kz", "generic", { subject: "Цикл", body: "М" });
    for (let i = 0; i < 40 && got.length === 0; i++) await new Promise((r) => setTimeout(r, 250));
    assert.equal(got.length, 1);
    w.child.kill("SIGTERM");
    const r = await w.done;
    assert.equal(r.code, 0, r.out); assert.match(r.out, /тоқтады/);
  });
});
