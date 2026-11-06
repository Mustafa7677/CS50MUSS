// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// CS Universe зертханалары, B тобы: желі пакеттері, ДҚ сұрау жоспарлаушысы, таралған жүйелер.
// Беттің нәтижелері осы файлдағы ТӘУЕЛСІЗ эталондармен салыстырылады: ең ұзын префикс (биттік маска), TCP қабылдаушы
// моделі, B+ ағаштың жапырақтары мен құн формулалары (кесте деректері беттің DOM-ынан оқылады), кворум теңсіздігі,
// Raft тәрізді сайлаудың бөлек жазылған симуляциясы.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

async function open(page, url) { await blockFonts(page.context()); const errs = collectErrors(page); await page.goto(url); return errs; }
const skills = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1") || '{"skills":{}}').skills);
async function toEnd(lab, max = 120) { for (let i = 0; i < max && (await lab.locator("[data-c=next]").isEnabled()); i++) await lab.locator("[data-c=next]").click(); }

// ================================================================ эталондар: желі
const ip2n = (s) => s.split(".").reduce((a, o) => a * 256 + +o, 0);
const prefixMatch = (ip, p) => { const [net, len] = p.split("/"); const L = +len; if (L === 0) return true; const d = 2 ** (32 - L); return Math.floor(ip2n(ip) / d) === Math.floor(ip2n(net) / d); };
function refLpm(rows, ip) { let best = null; rows.forEach((r) => { if (prefixMatch(ip, r.p) && (!best || +r.p.split("/")[1] > +best.p.split("/")[1])) best = r; }); return best; }
function refAcks(n, lost, isn = 4001, mss = 100) {
  const order = []; for (let i = 1; i <= n; i++) if (i !== lost) order.push(i); if (lost) order.push(lost);
  let nxt = isn; const buf = new Set(), acks = [];
  order.forEach((i) => { const s = isn + (i - 1) * mss; if (s === nxt) { nxt += mss; while (buf.has(nxt)) { buf.delete(nxt); nxt += mss; } } else buf.add(s); acks.push(nxt); });
  return acks;
}

// ================================================================ эталондар: ДҚ
async function readTable(page, root, name) {
  const t = root.locator(".db-tables > div", { has: page.locator("h3", { hasText: name + " (" }) }).locator("table");
  const head = await t.locator("thead th").allTextContents();
  const rows = await t.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent)));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, /^\d+$/.test(r[i]) ? +r[i] : r[i]])));
}
const cmpv = (a, b) => (typeof a === "number" ? a - b : a < b ? -1 : a > b ? 1 : 0);
function refLookup(rows, col, iv) {
  const ents = rows.map((r) => [r[col], r.id]).sort((a, b) => cmpv(a[0], b[0]) || a[1] - b[1]);
  const leaves = []; for (let i = 0; i < ents.length; i += 4) leaves.push(ents.slice(i, i + 4));
  let h = 1, n = leaves.length; while (n > 1) { n = Math.ceil(n / 4); h++; }
  let start = 0;
  if (iv.lo !== undefined) leaves.forEach((l, i) => { if (i > 0 && (iv.loInc ? cmpv(l[0][0], iv.lo) < 0 : cmpv(l[0][0], iv.lo) <= 0)) start = i; });
  const ok = (k) => (iv.lo === undefined || cmpv(k, iv.lo) > 0 || (cmpv(k, iv.lo) === 0 && iv.loInc)) && (iv.hi === undefined || cmpv(k, iv.hi) < 0 || (cmpv(k, iv.hi) === 0 && iv.hiInc));
  const past = (k) => iv.hi !== undefined && (cmpv(k, iv.hi) > 0 || (cmpv(k, iv.hi) === 0 && !iv.hiInc));
  let visited = 0, m = 0;
  for (let i = start; i < leaves.length; i++) { visited++; let stop = false; for (const [k] of leaves[i]) { if (past(k)) { stop = true; break; } if (ok(k)) m++; } if (stop) break; }
  return { nodes: h - 1 + visited, m, h };
}
const treeH = (N) => { let h = 1, n = Math.ceil(N / 4); while (n > 1) { n = Math.ceil(n / 4); h++; } return h; };
function refIv(conds) { const iv = {}; conds.forEach(({ op, v }) => { if (op === "=") Object.assign(iv, { lo: v, hi: v, loInc: true, hiInc: true }); else if (op[0] === ">") { if (iv.lo === undefined || cmpv(v, iv.lo) > 0) Object.assign(iv, { lo: v, loInc: op === ">=" }); } else if (iv.hi === undefined || cmpv(v, iv.hi) < 0) Object.assign(iv, { hi: v, hiInc: op === "<=" }); }); return iv; }
const pass = (r, w) => { const d = cmpv(r[w.c], w.v); return { "=": d === 0, "<": d < 0, ">": d > 0, "<=": d <= 0, ">=": d >= 0 }[w.op]; };
function refAccess(D, table, conds, idx) {
  const rows = D[table], N = rows.length, ht = treeH(N), out = { scan: N };
  [...new Set(conds.map((w) => w.c))].forEach((c) => { if (c !== "id" && !idx.has(`${table}.${c}`)) return; const L = refLookup(rows, c, refIv(conds.filter((w) => w.c === c))); out[c] = L.nodes + (c === "id" ? 0 : L.m * ht); });
  const best = Math.min(...Object.values(out));
  return { costs: out, best, rows: rows.filter((r) => conds.every((w) => pass(r, w))) };
}
function refJoin(D, q, idx) {
  const res = {};
  for (const [o, i, oc, ic] of [["students", "classes", "class_id", "id"], ["classes", "students", "id", "class_id"]]) {
    const A = refAccess(D, o, q.where.filter((w) => w.t === o), idx), Ni = D[i].length, O = A.rows.length;
    res[`${o} → ${i}: nested loop`] = A.best + O * Ni;
    res[`${o} → ${i}: hash join`] = A.best + Ni + O;
    if (ic === "id" || idx.has(`${i}.${ic}`)) { const ht = treeH(Ni); res[`${o} → ${i}: index join (${ic === "id" ? "id" : "индекс " + ic})`] = A.best + A.rows.reduce((s, r) => { const L = refLookup(D[i], ic, { lo: r[oc], hi: r[oc], loInc: true, hiInc: true }); return s + L.nodes + (ic === "id" ? 0 : L.m * ht); }, 0); }
  }
  return res;
}
function parseSqlLite(sql) {
  const join = /JOIN classes/.test(sql), where = [];
  const w = (sql.split(" WHERE ")[1] || "").split(" ORDER BY ")[0];
  if (w) w.split(" AND ").forEach((part) => { const m = part.trim().match(/^(?:(s|c)\.)?(\w+) (>=|<=|=|>|<) (?:'(.*)'|(\d+))$/); if (!m) throw new Error("parseSqlLite: " + part); where.push({ t: m[1] === "c" ? "classes" : "students", c: m[2], op: m[3], v: m[4] != null ? m[4] : +m[5] }); });
  return { join, where };
}

// ================================================================ эталон: сайлау (бөлек жазылған симуляция)
const NN = ["A", "B", "C", "D", "E"];
const rd = (a, b) => { const d = Math.abs(NN.indexOf(a) - NN.indexOf(b)); return Math.min(d, 5 - d); };
function refElect({ crashed, leader0, t1, t2, part }) {
  const dead = new Set(crashed), st = {};
  for (const n of NN) st[n] = { role: "f", term: leader0 ? 1 : 0, vote: leader0, votes: 0, lead: leader0, k: 0, dl: null };
  const take = (n) => { const v = [t1[n], t2[n], t2[n] + 40][Math.min(st[n].k, 2)]; st[n].k++; return v; };
  let q = [], seq = 0;
  const blocked = (a, b, t) => part && t < part.heal && part.side.includes(a) !== part.side.includes(b);
  const post = (t, a, b, kind, term, ok) => { if (!dead.has(b) && !blocked(a, b, t)) q.push({ at: t + 10 * rd(a, b), o: 0, s: seq++, kind, a, b, term, ok }); };
  for (const n of NN) if (!dead.has(n) && n !== leader0) st[n].dl = take(n);
  if (leader0 && !dead.has(leader0)) { st[leader0].role = "L"; q.push({ at: 0, o: 1, s: seq++, kind: "tick", a: leader0, term: 1 }); }
  const firstCands = [];
  for (let g = 0; g < 400; g++) {
    const dl = NN.filter((n) => !dead.has(n) && st[n].dl != null).map((n) => st[n].dl);
    const t = Math.min(...q.map((e) => e.at), ...dl);
    if (!isFinite(t) || t > 1000) return { stable: false };
    const now = q.filter((e) => e.at === t).sort((x, y) => x.o - y.o || x.s - y.s); q = q.filter((e) => e.at !== t);
    for (const e of now) {
      if (e.kind === "tick") { if (st[e.a].role === "L" && st[e.a].term === e.term) { NN.forEach((m) => m !== e.a && post(t, e.a, m, "hb", e.term)); q.push({ at: t + 50, o: 1, s: seq++, kind: "tick", a: e.a, term: e.term }); } continue; }
      const me = st[e.b];
      const down = (term) => { me.term = term; if (me.role !== "f") { me.role = "f"; if (me.dl == null) me.dl = t + take(e.b); } me.vote = null; me.lead = null; me.votes = 0; };
      if (e.kind === "rv") { if (e.term > me.term) down(e.term); const ok = e.term === me.term && (me.vote == null || me.vote === e.a); if (ok) { me.vote = e.a; me.dl = t + take(e.b); } post(t, e.b, e.a, "vote", me.term, ok); }
      else if (e.kind === "vote") { if (e.term > me.term) { down(e.term); continue; } if (me.role === "C" && e.term === me.term && e.ok) { me.votes++; if (me.votes >= 3) { me.role = "L"; me.lead = e.b; me.dl = null; NN.forEach((m) => m !== e.b && post(t, e.b, m, "hb", me.term)); q.push({ at: t + 50, o: 1, s: seq++, kind: "tick", a: e.b, term: me.term }); } } }
      else if (e.kind === "hb") { if (e.term >= me.term) { if (e.term > me.term) me.vote = null; me.term = e.term; me.role = "f"; me.votes = 0; me.lead = e.a; me.dl = t + take(e.b); } else post(t, e.b, e.a, "rej", me.term); }
      else if (e.kind === "rej") { if (e.term > me.term) down(e.term); }
    }
    const woke = [];
    for (const n of NN) { const s = st[n]; if (dead.has(n) || s.dl !== t || s.role === "L") continue; s.term++; s.role = "C"; s.vote = n; s.votes = 1; s.lead = null; s.dl = t + take(n); woke.push(n); NN.forEach((m) => m !== n && post(t, n, m, "rv", s.term)); }
    if (woke.length && !firstCands.length) firstCands.push(...woke);
    if (!part || t >= part.heal) { const L = NN.filter((n) => !dead.has(n) && st[n].role === "L"); if (L.length === 1 && NN.every((n) => dead.has(n) || n === L[0] || (st[n].lead === L[0] && st[n].term === st[L[0]].term))) return { stable: true, leader: L[0], term: st[L[0]].term, firstCands }; }
  }
  return { stable: false };
}

// ================================================================ ЖЕЛІ
test("Желі: инкапсуляция - байт өлшемдері эталонмен, толтыру, болжау және себептер", async ({ page }) => {
  const errs = await open(page, "academy/labs/network.html");
  const lab = page.locator("[data-cslab=encap]");
  for (const msg of ["GET /index.html HTTP/1.1", "Сәлем, AO17!", "Hi"]) {
    await lab.locator("[data-k=msg]").fill(msg);
    const N = Buffer.byteLength(msg, "utf8"), ip = 40 + N, frame = 14 + Math.max(46, ip) + 4;
    await toEnd(lab);
    await expect(lab.locator("[data-k=size]")).toContainText(`TCP сегменті ${20 + N} B · IP пакеті ${ip} B · кадр ${frame} B`);
    await expect(lab.locator(".cs-say")).toContainText(`Веб-сервер мәтінді алды: «${msg}». Барлығы ${N} байт`);
    await lab.locator("[data-c=reset]").click();
    for (let i = 0; i < 3; i++) await lab.locator("[data-c=next]").click();
    if (ip < 46) await expect(lab.locator(".nw-pad")).toHaveText(`толтыру · ${46 - ip} B`); else await expect(lab.locator(".nw-pad")).toHaveCount(0);
    await expect(lab.locator(".nw-l.eth > .nw-tag").first()).toContainText("00:1a:2b:00:01:01 (R1)");
  }
  // артқа: TTL 63 → 64
  await lab.locator("[data-k=msg]").fill("GET /index.html HTTP/1.1");
  for (let i = 0; i < 7; i++) await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".nw-l.ip > .nw-tag")).toContainText("TTL 63");
  await lab.locator("[data-c=prev]").click(); await lab.locator("[data-c=prev]").click();
  await expect(lab.locator(".nw-l.ip > .nw-tag")).toContainText("TTL 64");
  // болжау
  await lab.locator("[data-k=predict]").check();
  await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".csb-ask")).toBeVisible();
  await expect(lab.locator("[data-c=next]")).toBeDisabled();
  await lab.locator('.csb-ask [data-a="51514"]').click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-bad/);
  await expect(lab.locator("[data-fb=pred]")).toContainText("жіберуші порт");
  await lab.locator("[data-c=next]").click(); await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="srv"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Сервер басқа желіде");
  await lab.locator("[data-c=next]").click(); await lab.locator("[data-c=next]").click(); await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("64"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("TTL азаяды");
  await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="mac"]').click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  for (let i = 0; i < 4; i++) await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill(String(1001 + 24)); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  await expect(lab.locator(".cs-score")).toHaveText("Болжам: 2 / 5 дұрыс");
  expect((await skills(page))["cs.net.encap"].n).toBe(5);
  expect(errs).toEqual([]);
});

test("Желі: маршруттау - әр кестеде ең ұзын префикс эталонмен, TTL, цикл, қате адрес, болжау", async ({ page }) => {
  const errs = await open(page, "academy/labs/network.html");
  const lab = page.locator("[data-cslab=route]");
  const cases = [["10.1.2.77", "64", false, "delivered"], ["10.1.9.4", "64", false, "delivered"], ["203.0.113.80", "8", false, "delivered"], ["10.0.0.9", "64", false, "local"], ["198.51.100.7", "64", false, "noroute"], ["10.1.2.77", "2", false, "ttl"], ["10.1.2.77", "8", true, "ttl"]];
  for (const [dst, ttl, loop, want] of cases) {
    await lab.locator("[data-k=dst]").selectOption(dst); await lab.locator("[data-k=ttl]").selectOption(ttl);
    if (loop) await lab.locator("[data-k=loop]").check(); else await lab.locator("[data-k=loop]").uncheck();
    let routers = 0;
    for (let i = 0; i < 20; i++) {
      const rows = await lab.locator("[data-k=rt] tbody tr").evaluateAll((trs) => trs.map((tr) => ({ p: tr.cells[0].textContent, m: tr.cells[2].textContent, best: tr.classList.contains("best") })));
      if (rows.length) {
        rows.forEach((r) => expect(r.m.startsWith("иә"), `${dst} ${r.p}`).toBe(prefixMatch(dst, r.p)));
        const ref = refLpm(rows, dst), drop = (await lab.locator(".cs-say").textContent()).includes("тасталады");
        const b = rows.find((r) => r.best);
        if (!drop) expect(b && b.p).toBe(ref.p);
        if ((await lab.locator("[data-k=tname]").textContent()).startsWith("R")) routers++;
      }
      if (!(await lab.locator("[data-c=next]").isEnabled())) break;
      await lab.locator("[data-c=next]").click();
    }
    const say = await lab.locator(".cs-say").textContent();
    if (want === "delivered") expect(say).toContain(`TTL = ${+ttl - routers} күйінде алды`);
    if (want === "local") expect(say).toContain("маршрутизатор керек емес");
    if (want === "noroute") expect(say).toContain("Destination Unreachable");
    if (want === "ttl") { expect(say).toContain("Time Exceeded"); expect(routers).toBe(+ttl); }
    if (loop) expect(await lab.locator("[data-k=hops]").textContent()).toContain("R1 → R2 → R1 → R2");
  }
  await lab.locator("[data-k=loop]").uncheck();
  // өз адресі: қате формат
  await lab.locator("[data-k=custom]").fill("10.1.300.4"); await lab.locator("[data-k=custom]").press("Enter");
  await expect(lab.locator("[data-k=err]")).toContainText("0-255");
  await lab.locator("[data-k=custom]").fill("10.1.2.130"); await lab.locator("[data-k=custom]").press("Enter");
  await expect(lab.locator("[data-k=dst]")).toHaveValue("10.1.2.130");
  // болжау: R1-де /16 таңдау - «қысқарақ префикс»
  await lab.locator("[data-k=dst]").selectOption("10.1.2.77"); await lab.locator("[data-k=ttl]").selectOption("64");
  await lab.locator("[data-k=predict]").check();
  await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="R2 (eth1)"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Қысқарақ префикс");
  await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="R4 (eth3)"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Әдепкі маршрут - соңғы амал");
  await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("62"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  expect((await skills(page))["cs.net.route"].n).toBe(3);
  expect(errs).toEqual([]);
});

test("Желі: TCP - ack тізбегі қабылдаушы эталонымен, жылдам қайта жіберу ережесі, болжау", async ({ page }) => {
  test.setTimeout(240_000);
  const errs = await open(page, "academy/labs/network.html");
  const lab = page.locator("[data-cslab=tcp]");
  for (const [n, lost, fr] of [[5, 2, true], [5, 2, false], [4, 1, true], [6, 4, true], [3, 0, true], [6, 6, false], [6, 3, true]]) {
    await lab.locator("[data-k=n]").selectOption(String(n)); await lab.locator("[data-k=lost]").selectOption(String(lost));
    if (fr) await lab.locator("[data-k=fr]").check(); else await lab.locator("[data-k=fr]").uncheck();
    await toEnd(lab);
    const labels = await lab.locator(".nw-msg text.nw-ml").allTextContents();
    const acks = labels.map((l) => (l.match(/^ack=(\d+)$/) || [])[1]).filter(Boolean).map(Number);
    expect(acks, `${n}/${lost}/${fr}`).toEqual(refAcks(n, lost));
    const say = await lab.locator(".cs-say").textContent();
    expect(say).toContain(`Қайта жіберу саны: ${lost ? 1 : 0}`);
    if (lost) expect(say.includes("жылдам қайта жіберумен"), `${n}/${lost}/${fr}`).toBe(fr && n - lost >= 3);
    expect(labels.filter((l) => l.includes("(қайта)")).length).toBe(lost ? 1 : 0);
  }
  await lab.locator("[data-k=n]").selectOption("5"); await lab.locator("[data-k=lost]").selectOption("2"); await lab.locator("[data-k=fr]").check();
  await lab.locator("[data-k=predict]").check();
  await lab.locator("[data-c=next]").click(); await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("4000"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("ack - келесі күтілетін нөмір");
  await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("9001"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  // бірінші ACK: 4101; қайталанған: 4101 (4301 - саңылаудан секіру қатесі)
  for (let i = 0; i < 6 && !(await lab.locator(".csb-ask").isVisible()); i++) await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("4101"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  for (let i = 0; i < 6 && !(await lab.locator(".csb-ask").isVisible()); i++) await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("4301"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Саңылаудан секіруге болмайды");
  for (let i = 0; i < 10 && !(await lab.locator(".csb-ask").isVisible()); i++) await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="all"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Go-Back-N");
  await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill(String(refAcks(5, 2).pop())); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  // ойнату / кідірту
  await lab.locator("[data-k=predict]").uncheck();
  await lab.locator("[data-c=speed]").selectOption("2"); await lab.locator("[data-c=play]").click();
  await expect(lab.locator("[data-c=pause]")).toBeEnabled();
  await lab.locator("[data-c=pause]").click();
  await expect(lab.locator("[data-c=play]")).toBeEnabled();
  expect((await skills(page))["cs.net.tcp"].n).toBe(6);
  expect(errs).toEqual([]);
});

test("Желі: DNS - итеративті шешу және кэш", async ({ page }) => {
  const errs = await open(page, "academy/labs/network.html");
  const lab = page.locator("[data-cslab=dns]");
  await expect(lab.locator(".cs-n")).toHaveText("0 / 9");
  await lab.locator("[data-k=predict]").check();
  await lab.locator("[data-c=next]").click(); await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="tld"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Иерархия түбірден");
  await lab.locator("[data-k=warm]").check();
  await expect(lab.locator(".cs-n")).toHaveText("0 / 3");
  await lab.locator("[data-c=next]").click(); await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="cache"]').click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  expect(errs).toEqual([]);
});

test("Желі: қорытынды тапсырма - LPM, ack, диагноз эталонмен, көмек", async ({ page }) => {
  const errs = await open(page, "academy/labs/network.html");
  const t = page.locator("[data-cslab=net-task]"), fb = t.locator("[data-fb=task]");
  for (let i = 0; i < 4; i++) {
    const dst = await t.locator("[data-k=q] b").first().textContent();
    const rows = await t.locator("[data-k=q] tbody tr").evaluateAll((trs) => trs.map((tr) => ({ p: tr.cells[0].textContent, ifc: tr.cells[1].textContent })));
    const ref = refLpm(rows, dst), wrong = rows.find((r) => r !== ref);
    await t.locator(`[data-a="${wrong.ifc}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-bad/);
    await expect(fb).toContainText(prefixMatch(dst, wrong.p) ? (wrong.p.endsWith("/0") ? "Әдепкі маршрут" : "Қысқарақ префикс") : "сәйкес келмейді");
    await t.locator(`[data-a="${ref.ifc}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-ok/);
    await t.locator("[data-c=new]").click();
  }
  await t.locator("[data-k=kind]").selectOption("ack");
  for (let i = 0; i < 4; i++) {
    const q = await t.locator("[data-k=q]").textContent();
    const isn = +q.match(/алғашқы байт нөмірі - (\d+)/)[1], mss = +q.match(/Әр сегментте (\d+) байт/)[1];
    const order = (await t.locator("[data-k=q] b").first().textContent()).split(", ").map(Number);
    let nxt = isn; const buf = new Set(); order.forEach((s) => { if (s === nxt) { nxt += mss; while (buf.has(nxt)) { buf.delete(nxt); nxt += mss; } } else if (s > nxt) buf.add(s); });
    await t.locator("[data-k=ans]").fill(String(order[order.length - 1])); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(order[order.length - 1] === nxt ? /tt-ok/ : /tt-bad/);
    await t.locator("[data-k=ans]").fill(String(nxt)); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-ok/);
    await t.locator("[data-c=new]").click();
  }
  await t.locator("[data-k=kind]").selectOption("diag");
  for (let i = 0; i < 8; i++) {
    const log = (await t.locator(".nw-trace li").allTextContents()).map((l) => l.split(":")[0]);
    const icmp = await t.locator(".nw-icmp").textContent();
    const want = icmp.includes("пакетті алды") ? "ok" : icmp.includes("Unreachable") ? "noroute" : new Set(log).size < log.length ? "loop" : "ttl";
    const bad = ["ok", "noroute", "loop", "ttl"].find((x) => x !== want);
    await t.locator(`[data-a="${bad}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-bad/);
    await t.locator(`[data-a="${want}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-ok/);
    await t.locator("[data-c=new]").click();
  }
  for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
  await expect(t.locator(".tt-hlist li")).toHaveCount(3);
  await expect(t.locator(".tt-hlist li").nth(2)).toContainText("Жауап:");
  await expect(fb).toContainText("меңгеруге саналмайды");
  const sk = await skills(page);
  expect(sk["cs.net.route"].n).toBe(8); expect(sk["cs.net.tcp"].n).toBeGreaterThanOrEqual(5); expect(sk["cs.net.diag"].n).toBe(16);
  expect(errs).toEqual([]);
});

// ================================================================ ДҚ
test("ДҚ: бір кесте - құндар B+ ағаш эталонымен (деректер DOM-нан), нәтиже саны, қадамдау, қате сұрау", async ({ page }) => {
  const errs = await open(page, "academy/labs/database.html");
  const lab = page.locator("[data-cslab=db-single]");
  const D = { students: await readTable(page, lab, "students") };
  expect(D.students).toHaveLength(24);
  const costsOnPage = async () => Object.fromEntries((await lab.locator(".db-bar").evaluateAll((bs) => bs.map((b) => [b.querySelector("span").textContent.replace(" ← таңдалады", ""), +b.querySelector("b").textContent]))));
  const idx = new Set((await lab.locator("[data-idx]").evaluateAll((xs) => xs.filter((x) => x.checked).map((x) => x.dataset.idx))));
  const queries = ["SELECT name, score FROM students WHERE name = 'Дана'", "SELECT * FROM students WHERE city = 'Алматы'", "SELECT name FROM students WHERE score >= 90 ORDER BY score DESC", "SELECT * FROM students WHERE id = 17", "SELECT name FROM students WHERE year = 10 AND city = 'Шымкент'", "SELECT name FROM students WHERE score < 50", "SELECT name FROM students WHERE score > 60 AND score <= 80", "SELECT * FROM students WHERE id > 20", "SELECT name FROM students WHERE name = 'Айгерім'"];
  for (const sql of queries) {
    await lab.locator("[data-k=sql]").fill(sql); await lab.locator("[data-c=run]").click();
    const q = parseSqlLite(sql), ref = refAccess(D, "students", q.where, idx), got = await costsOnPage();
    expect(got["students: толық сканерлеу (SCAN)"], sql).toBe(24);
    for (const [c, v] of Object.entries(ref.costs)) if (c !== "scan") expect(got[c === "id" ? "students: id бойынша іздеу (SEARCH USING PRIMARY KEY)" : `students: индекс ${c} (SEARCH USING INDEX)`], `${sql} ${c}`).toBe(v);
    expect(Object.keys(got)).toHaveLength(Object.keys(ref.costs).length);
    expect(+(await lab.locator(".db-bar.best b").textContent()), sql).toBe(ref.best);
    await expect(lab.locator(".db-res .cs-small")).toContainText(`Нәтиже: ${ref.rows.length} жол`);
  }
  // индекс өшірілсе, жоспар SCAN болады
  await lab.locator("[data-k=sql]").fill("SELECT name, score FROM students WHERE name = 'Дана'"); await lab.locator("[data-c=run]").click();
  await expect(lab.locator(".db-plan")).toContainText("SEARCH students USING INDEX idx_name (name = 'Дана')");
  await lab.locator('[data-idx="students.name"]').uncheck();
  await expect(lab.locator(".db-plan")).toContainText("SCAN students");
  await expect(lab.locator(".db-bar")).toHaveCount(1);
  // қадамдау: SCAN - әр қадам бір жол
  for (let i = 0; i < 3; i++) await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".db-cnt div").nth(0).locator("b")).toHaveText("3");
  await expect(lab.locator(".db-tables tr.rd")).toHaveCount(3);
  // индекс жоспары: ағашпен түсу
  await lab.locator('[data-idx="students.name"]').check();
  await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".db-tn.now")).toHaveCount(1);
  await toEnd(lab);
  await expect(lab.locator(".db-cnt div").nth(2).locator("b")).toHaveText("7");
  // қате сұраулар
  for (const [bad, msg] of [["SELECT * FROM student", "кесте жоқ"], ["SELECT * FROM students WHERE city = Алматы", "Кириллица"], ["SELECT * FROM students WHERE score = '5'", "сан баған"], ["SELECT * FROM students WHERE city = 'x' OR id = 1", "OR"], ["SELECT FROM students", "баған аты күтілді"]]) {
    await lab.locator("[data-k=sql]").fill(bad); await lab.locator("[data-c=run]").click();
    await expect(lab.locator(".db-err")).toBeVisible(); await expect(lab.locator(".db-err")).toContainText(msg);
  }
  expect(errs).toEqual([]);
});

test("ДҚ: болжау - селективтілігі төмен индекс, оқылатын жолдар", async ({ page }) => {
  const errs = await open(page, "academy/labs/database.html");
  const lab = page.locator("[data-cslab=db-single]");
  await lab.locator("[data-k=preset]").selectOption("1");
  await lab.locator("[data-k=dbpredict]").check();
  await expect(lab.locator(".db-bars")).toContainText("жасырын");
  await lab.locator(".db-pred .lab-choice button", { hasText: "индекс city" }).click();
  await expect(lab.locator(".db-pred .tt-fb").first()).toHaveClass(/tt-bad/);
  await expect(lab.locator(".db-pred .tt-fb").first()).toContainText("селективтілік 10/24");
  await lab.locator(".db-pred input").fill("24"); await lab.locator(".db-pred [data-c=rows]").click();
  await expect(lab.locator(".db-pred .tt-fb").nth(1)).toContainText("толық сканерлеудің");
  await expect(lab.locator(".db-bar")).toHaveCount(2);
  await lab.locator("[data-k=preset]").selectOption("0");
  await lab.locator(".db-pred .lab-choice button", { hasText: "индекс name" }).click();
  await expect(lab.locator(".db-pred .tt-fb").first()).toHaveClass(/tt-ok/);
  await lab.locator(".db-pred input").fill("1"); await lab.locator(".db-pred [data-c=rows]").click();
  await expect(lab.locator(".db-pred .tt-fb").nth(1)).toHaveClass(/tt-ok/);
  expect((await skills(page))["cs.db.plan"].n).toBe(4);
  // селективтілік графигі: шекара
  const s = page.locator("[data-cslab=db-sel]");
  await s.locator("[data-k=m]").fill("6");
  await expect(s.locator("[data-k=selmsg]")).toContainText("3 + 3 × 6 = 21, сканерлеу = 24 → индекс арзан");
  await s.locator("[data-k=m]").fill("8");
  await expect(s.locator("[data-k=selmsg]")).toContainText("сканерлеу арзан");
  expect(errs).toEqual([]);
});

test("ДҚ: JOIN - nested loop / hash / index join құндары эталонмен, екі рет", async ({ page }) => {
  const errs = await open(page, "academy/labs/database.html");
  const lab = page.locator("[data-cslab=db-join]");
  const D = { students: await readTable(page, lab, "students"), classes: await readTable(page, lab, "classes") };
  expect(D.classes).toHaveLength(6);
  const got = async () => Object.fromEntries((await lab.locator(".db-bar").evaluateAll((bs) => bs.map((b) => [b.querySelector("span").textContent.replace(" ← таңдалады", ""), +b.querySelector("b").textContent]))));
  for (const idxOn of [[], ["students.class_id", "classes.teacher"]]) {
    for (const k of idxOn) await lab.locator(`[data-idx="${k}"]`).check();
    const idx = new Set((await lab.locator("[data-idx]").evaluateAll((xs) => xs.filter((x) => x.checked).map((x) => x.dataset.idx))));
    for (let p = 0; p < 4; p++) {
      await lab.locator("[data-k=preset]").selectOption(String(p));
      const sql = await lab.locator("[data-k=sql]").inputValue(), q = parseSqlLite(sql.replace(/FROM classes c JOIN students s ON c\.id = s\.class_id/, "FROM students s JOIN classes c ON s.class_id = c.id"));
      const ref = refJoin(D, q, idx), g = await got();
      for (const [label, cost] of Object.entries(ref)) expect(g[label], `${sql} :: ${label}`).toBe(cost);
      expect(Object.keys(g).length).toBe(Object.keys(ref).length);
      expect(+(await lab.locator(".db-bar.best b").textContent())).toBe(Math.min(...Object.values(ref)));
      const pairs = D.students.filter((s) => q.where.filter((w) => w.t === "students").every((w) => pass(s, w))).filter((s) => { const c = D.classes.find((x) => x.id === s.class_id); return q.where.filter((w) => w.t === "classes").every((w) => pass(c, w)); });
      await expect(lab.locator(".db-res .cs-small")).toContainText(`Нәтиже: ${pairs.length} жол`);
    }
  }
  // hash join жоспарын қадамдау: хэш құру +6
  await lab.locator("[data-k=preset]").selectOption("2");
  const opts = await lab.locator("[data-k=plan] option").allTextContents();
  await lab.locator("[data-k=plan]").selectOption(String(opts.findIndex((o) => o.startsWith("classes → students: hash join"))));
  await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".cs-say")).toContainText("Хэш құру: students кестесінің барлық 24 жолы");
  expect(errs).toEqual([]);
});

test("ДҚ: қорытынды тапсырма - ең арзан индекс эталонмен, қате түрлері", async ({ page }) => {
  const errs = await open(page, "academy/labs/database.html");
  const lab = page.locator("[data-cslab=db-single]");
  const D = { students: await readTable(page, lab, "students"), classes: await readTable(page, page.locator("[data-cslab=db-join]"), "classes") };
  const t = page.locator("[data-cslab=db-task]"), fb = t.locator("[data-fb=task]");
  const OPTS = ["students.name", "students.city", "students.year", "students.class_id", "students.score", "classes.teacher"];
  const best = (q, idx) => (q.join ? Math.min(...Object.values(refJoin(D, q, idx))) : refAccess(D, "students", q.where, idx).best);
  let seenUnused = false, seenLow = false;
  for (let i = 0; i < 12; i++) {
    const sql = (await t.locator("pre.db-plan").textContent()).replace(/Көшіру$/, ""), q = parseSqlLite(sql);
    const base = best(q, new Set()), costs = OPTS.map((o) => best(q, new Set([o]))), min = Math.min(...costs);
    const answers = min < base ? OPTS.filter((_, j) => costs[j] === min) : ["none"];
    const used = (o) => { const [tb, c] = o.split("."); return q.where.some((w) => w.t === tb && w.c === c) || (q.join && (o === "students.class_id")); };
    const wrong = OPTS.find((o) => !answers.includes(o) && !used(o));
    if (wrong) { await t.locator(`[data-a="${wrong}"]`).click(); await t.locator("[data-c=check]").click(); await expect(fb).toContainText("Бұл баған сұрауда жоқ"); seenUnused = true; }
    const low = OPTS.find((o, j) => !answers.includes(o) && used(o) && costs[j] >= base);
    if (low) { await t.locator(`[data-a="${low}"]`).click(); await t.locator("[data-c=check]").click(); await expect(fb).toContainText("Селективтілігі төмен"); seenLow = true; }
    await t.locator(`[data-a="${answers[0]}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb, sql).toHaveClass(/tt-ok/);
    await t.locator("[data-c=new]").click();
  }
  expect(seenUnused).toBe(true);
  for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
  await expect(t.locator(".tt-hlist li").nth(2)).toContainText("Жауап:");
  await expect(fb).toContainText("меңгеруге саналмайды");
  expect((await skills(page))["cs.db.index"].n).toBeGreaterThanOrEqual(12);
  void seenLow;
  expect(errs).toEqual([]);
});

// ================================================================ ТАРАЛҒАН ЖҮЙЕЛЕР
test("Таралған: кворум - ескі оқу R + W ≤ N-де ғана, бөліну, өз оқу жиыны, болжау", async ({ page }) => {
  const errs = await open(page, "academy/labs/distributed.html");
  const lab = page.locator("[data-cslab=quorum]");
  const set = async (k, v) => lab.locator(`[data-k=${k}]`).fill(String(v));
  for (const N of [3, 4, 5, 7]) for (let W = 1; W <= N; W += N > 4 ? 2 : 1) for (let R = 1; R <= N; R += N > 4 ? 2 : 1) {
    await set("N", N); await set("W", W); await set("R", R);
    await toEnd(lab);
    const say = await lab.locator(".cs-say").textContent();
    expect(say, `${N}/${W}/${R}`).toContain(`x = ${R + W <= N ? 1 : 2}`);
    await expect(lab.locator("[data-k=ineq]")).toContainText(`R + W = ${R} + ${W} = ${R + W} ${R + W > N ? ">" : "≤"} N = ${N}`);
  }
  await set("N", 5); await set("W", 3); await set("R", 3);
  await lab.locator("[data-k=part]").check(); await lab.locator("[data-k=k]").selectOption("2");
  for (let i = 0; i < 2; i++) await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".cs-say")).toContainText("жазу сәтсіз");
  await lab.locator("[data-k=k]").selectOption("4"); await set("W", 2);
  await toEnd(lab);
  await expect(lab.locator(".cs-say")).toContainText("x = 2"); // k − W = 4 − 2 = 2 < R = 3 → кепілді жаңа
  await lab.locator("[data-k=part]").uncheck();
  // өз оқу жиыны: N5 W3 R3, R1, R4, R5 → қиылысу 1
  await set("W", 3);
  for (const r of ["R1", "R4", "R5"]) await lab.locator("[data-k=rpick] button", { hasText: r }).click();
  await toEnd(lab);
  await expect(lab.locator(".cs-say")).toContainText("x = 2");
  await lab.locator("[data-k=rpick] button", { hasText: "ең нашар жағдай" }).click();
  // болжау
  await lab.locator("[data-k=predict]").check();
  for (let i = 0; i < 3; i++) await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="stale"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Кворумдар міндетті түрде қиылысады");
  await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("1"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  expect((await skills(page))["cs.dist.quorum"].n).toBe(2);
  expect(errs).toEqual([]);
});

test("Таралған: бөліну кезіндегі ескі оқу шарты k − W ≥ R", async ({ page }) => {
  const errs = await open(page, "academy/labs/distributed.html");
  const lab = page.locator("[data-cslab=quorum]");
  await lab.locator("[data-k=N]").fill("7"); await lab.locator("[data-k=part]").check();
  for (const [k, W, R] of [[5, 2, 3], [5, 3, 3], [4, 1, 3], [3, 2, 2], [2, 1, 3]]) {
    await lab.locator("[data-k=k]").selectOption(String(k)); await lab.locator("[data-k=W]").fill(String(W)); await lab.locator("[data-k=R]").fill(String(R));
    await toEnd(lab);
    const say = await lab.locator(".cs-say").textContent();
    if (k < W) expect(say).toContain("x = 1"); else if (k < R) expect(say).toContain("оқу сәтсіз"); else expect(say, `${k}/${W}/${R}`).toContain(`x = ${k - W >= R ? 1 : 2}`);
  }
  expect(errs).toEqual([]);
});

test("Таралған: сайлау - сценарийлер бөлек симуляциямен, өз баптауы, болжау", async ({ page }) => {
  const errs = await open(page, "academy/labs/distributed.html");
  const lab = page.locator("[data-cslab=elect]");
  const SECOND = { A: 260, B: 240, C: 280, D: 170, E: 220 };
  const PRE = {
    crash: { crashed: ["C"], leader0: "C", t1: { A: 230, B: 160, C: 200, D: 200, E: 270 }, t2: SECOND, part: null },
    split: { crashed: ["C"], leader0: "C", t1: { A: 260, B: 150, C: 200, D: 150, E: 280 }, t2: SECOND, part: null },
    part: { crashed: [], leader0: "A", t1: { A: 250, B: 230, C: 170, D: 210, E: 260 }, t2: SECOND, part: { side: ["A", "B"], heal: 420 } },
  };
  for (const [k, cfg] of Object.entries(PRE)) {
    await lab.locator("[data-k=preset]").selectOption(k);
    const ref = refElect(cfg);
    expect(ref.stable).toBe(true);
    await toEnd(lab);
    await expect(lab.locator(".cs-say")).toContainText(`Тұрақты: ${ref.leader} - ${ref.term}-мерзімнің жалғыз көшбасшысы`);
  }
  expect(refElect(PRE.split).term).toBe(3);
  // өз баптауым (C құлаған сценарийден): B да құлады, E ең қысқа
  await lab.locator("[data-k=preset]").selectOption("crash");
  await lab.locator("[data-k=preset]").selectOption("custom");
  await lab.locator('[data-crash="B"]').check();
  await lab.locator('[data-t="E"]').selectOption("150");
  const cur = { crashed: ["C", "B"], leader0: "C", t1: { A: 230, B: 160, C: 200, D: 200, E: 150 }, t2: SECOND, part: null };
  const r2 = refElect(cur);
  await toEnd(lab);
  await expect(lab.locator(".cs-say")).toContainText(`Тұрақты: ${r2.leader} - ${r2.term}-мерзімнің`);
  // болжау: бөлінген дауыс
  await lab.locator("[data-k=preset]").selectOption("split");
  await lab.locator("[data-k=predict]").check();
  await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="A"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Таймауттарды салыстырыңыз");
  await lab.locator("[data-c=next]").click();
  await lab.locator(".csb-ask input").fill("2"); await lab.locator(".csb-ask [data-c=answer]").click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Жартысы жетпейді");
  for (let i = 0; i < 10 && !(await lab.locator(".csb-ask").isVisible()); i++) await lab.locator("[data-c=next]").click();
  await lab.locator('.csb-ask [data-a="B"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("Дауыс бөлінді");
  await expect(lab.locator("[data-k=log] li")).not.toHaveCount(0);
  expect((await skills(page))["cs.dist.election"].n).toBe(3);
  expect(errs).toEqual([]);
});

test("Таралған: қорытынды тапсырма - кворум және сайлау эталонмен", async ({ page }) => {
  const errs = await open(page, "academy/labs/distributed.html");
  const t = page.locator("[data-cslab=dist-task]"), fb = t.locator("[data-fb=task]");
  for (let i = 0; i < 8; i++) {
    const q = await t.locator("[data-k=q]").textContent();
    const [, N, W, R] = q.match(/N = (\d+) реплика, жазу кворумы W = (\d+), оқу кворумы R = (\d+)/).map(Number);
    const km = q.match(/клиент тек (\d+) репликаға/), k = km ? +km[1] : N;
    const want = k < W ? "wfail" : k < R ? "rfail" : k - W >= R ? "stale" : "fresh";
    const bad = ["wfail", "rfail", "stale", "fresh"].find((x) => x !== want);
    await t.locator(`[data-a="${bad}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-bad/);
    await t.locator(`[data-a="${want}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb, q).toHaveClass(/tt-ok/);
    await t.locator("[data-c=new]").click();
  }
  await t.locator("[data-k=kind]").selectOption("elect");
  for (let i = 0; i < 8; i++) {
    const q = await t.locator("[data-k=q]").textContent(), dead = q.match(/көшбасшысы ([A-E]) t = 0-да құлады/)[1];
    const rows = await t.locator("[data-k=q] tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.cells].map((c) => c.textContent)));
    const t1 = {}, t2 = {}; rows.forEach(([n, a, b]) => { t1[n] = +a; t2[n] = +b; }); t1[dead] = 999; t2[dead] = 999;
    const ref = refElect({ crashed: [dead], leader0: dead, t1, t2, part: null });
    expect(ref.stable).toBe(true);
    await t.locator(`[data-a="${ref.leader}-${ref.term}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb, q).toHaveClass(/tt-ok/);
    const other = (await t.locator("[data-k=ansbox] button").evaluateAll((bs) => bs.map((b) => b.dataset.a))).find((x) => x !== `${ref.leader}-${ref.term}`);
    await t.locator(`[data-a="${other}"]`).click(); await t.locator("[data-c=check]").click();
    await expect(fb).toHaveClass(/tt-bad/);
    await t.locator("[data-c=new]").click();
  }
  for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
  await expect(t.locator(".tt-hlist li").nth(2)).toContainText("Жауап:");
  expect(errs).toEqual([]);
});

// ================================================================ телефон, қараңғы режим, a11y, қозғалыс
for (const scheme of ["light", "dark"]) {
  test(`B зертханалары (${scheme}): 360px жылжу жоқ, axe таза, қозғалыс азайтылған`, async ({ browser }) => {
    test.setTimeout(120_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    const p = await c.newPage(); const errs = collectErrors(p), problems = [];
    for (const url of ["academy/labs/network.html", "academy/labs/database.html", "academy/labs/distributed.html"]) {
      await p.goto(url);
      if (scheme === "dark") await p.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
      for (const lab of await p.locator("[data-cslab] [data-k=predict]").all()) await lab.check();
      for (const nx of await p.locator("[data-cslab] [data-c=next]").all()) if (await nx.isEnabled()) await nx.click();
      await p.locator(".tt-hbtn").first().click();
      await p.locator("[data-cslab$=task] [data-c=check]").click();
      if (url.includes("database")) { await p.locator("[data-cslab=db-single] [data-k=dbpredict]").check(); await p.locator("[data-cslab=db-single] [data-k=sql]").fill("SELECT * FROM nope"); await p.locator("[data-cslab=db-single] [data-c=run]").click(); }
      if (url.includes("network")) expect(await p.evaluate(() => getComputedStyle(document.querySelector(".nw-pkt")).transitionDuration)).toMatch(/^0s/);
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
