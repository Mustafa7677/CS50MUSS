// © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// CS Universe зертханалары (academy/labs/): BFS/DFS, Python Execution Visualizer, екілік іздеу, хаб.
// Алгоритм нәтижелері беттің өз кодымен емес, осы файлдағы ТӘУЕЛСІЗ іске асырумен салыстырылады
// (BFS - кезек, DFS - рекурсия, екілік іздеу, Python жауаптары - кодтан қолмен есептелген формулалар).
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const { blockFonts, collectErrors, routePyodide } = require("../support/helpers");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// ---------------------------------------------------------------- тәуелсіз эталондар
const parseEdges = (txt) => {
  const adj = {};
  for (const m of txt.matchAll(/(\d+)–(\d+)/g)) { const a = +m[1], b = +m[2]; (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a); }
  return adj;
};
const nbs = (adj, u) => [...(adj[u] || [])].sort((a, b) => a - b);
function refBFS(adj, s) {
  const dist = { [s]: 0 }, q = [s], order = [];
  while (q.length) { const u = q.shift(); order.push(u); for (const v of nbs(adj, u)) if (dist[v] == null) { dist[v] = dist[u] + 1; q.push(v); } }
  return { order, dist };
}
function refDFS(adj, s) { const seen = new Set(), order = []; const go = (u) => { seen.add(u); order.push(u); nbs(adj, u).forEach((v) => !seen.has(v) && go(v)); }; go(s); return order; }
function refBin(a, t) { let lo = 0, hi = a.length - 1; const mids = []; while (lo <= hi) { const m = (lo + hi) >> 1; mids.push(m); if (a[m] === t) break; if (a[m] < t) lo = m + 1; else hi = m - 1; } return mids; }

async function open(page, url) { await blockFonts(page.context()); const errs = collectErrors(page); await page.goto(url); return errs; }

// ---------------------------------------------------------------- BFS / DFS
test("BFS/DFS: әр граф пен бастапқы төбеде рет эталонмен бірдей, өңдеу режимі графты өзгертеді", async ({ page }) => {
  const errs = await open(page, "academy/labs/bfs.html");
  const lab = page.locator("[data-cslab=bfs]");
  const runToEnd = async () => { for (let i = 0; i < 20 && (await lab.locator("[data-c=next]").isEnabled()); i++) await lab.locator("[data-c=next]").click(); };
  for (const preset of ["metro", "grid", "ring", "two"]) {
    await lab.locator("[data-k=preset]").selectOption(preset);
    const adj = parseEdges(await lab.locator(".cg-edges").textContent());
    const starts = await lab.locator("[data-k=start] option").evaluateAll((o) => o.map((x) => +x.value));
    for (const s of starts.slice(0, 3)) {
      await lab.locator("[data-k=start]").selectOption(String(s));
      await lab.locator("[data-algo=bfs]").click();
      await runToEnd();
      const r = refBFS(adj, s);
      await expect(lab.locator("[data-k=order]")).toHaveText(r.order.join(" → "));
      await expect(lab.locator(".cs-say")).toContainText("Кезек бос - BFS аяқталды");
      // d белгілері = ең қысқа қашықтық (эталон)
      for (const v of r.order) await expect(lab.locator(`.cg-node[data-v="${v}"]`)).toHaveAttribute("aria-label", new RegExp(`d = ${r.dist[v]}$`));
      await lab.locator("[data-algo=dfs]").click();
      await runToEnd();
      await expect(lab.locator("[data-k=order]")).toHaveText(refDFS(adj, s).join(" → "));
    }
  }
  // қазақша қадам түсіндірмесі
  await lab.locator("[data-k=preset]").selectOption("metro");
  await lab.locator("[data-algo=bfs]").click();
  await lab.locator("[data-c=next]").click();
  await expect(lab.locator(".cs-say")).toContainText("1-ді кезектің басынан алдық (d = 0). Көршілері (өсу ретімен): 2, 3. 2, 3 әлі көрілмеген - белгілеп, кезектің соңына қосамыз");
  await expect(lab.locator(".cs-cells b")).toHaveText(["2", "3"]);
  await lab.locator("[data-c=prev]").click();
  await expect(lab.locator(".cs-cells b")).toHaveText(["1"]);
  // өңдеу: пернетақта баламасы (select) және екі төбені басу
  await lab.locator("[data-k=edit]").check();
  await lab.locator("[data-k=ea]").selectOption("1");
  await lab.locator("[data-k=eb]").selectOption("8");
  await lab.locator("[data-c=toggle]").click();
  await expect(lab.locator(".cg-edges")).toContainText("1–8");
  await lab.locator('.cg-node[data-v="1"]').click();
  await lab.locator('.cg-node[data-v="2"]').click();
  await expect(lab.locator(".cg-edges")).not.toContainText("1–2");
  await lab.locator("[data-k=edit]").uncheck();
  const adj = parseEdges(await lab.locator(".cg-edges").textContent());
  await runToEnd();
  await expect(lab.locator("[data-k=order]")).toHaveText(refBFS(adj, 1).order.join(" → "));
  // ойнату / кідірту
  await lab.locator("[data-c=reset]").click();
  await lab.locator("[data-c=speed]").selectOption("2");
  await lab.locator("[data-c=play]").click();
  await expect(lab.locator("[data-c=pause]")).toBeEnabled();
  await lab.locator("[data-c=pause]").click();
  await expect(lab.locator("[data-c=play]")).toBeEnabled();
  expect(errs).toEqual([]);
});

test("BFS/DFS: болжау режимі - дұрыс және FIFO/LIFO шатасуына нақты түсіндірме", async ({ page }) => {
  const errs = await open(page, "academy/labs/bfs.html");
  const lab = page.locator("[data-cslab=bfs]");
  await lab.locator("[data-k=predict]").check();
  await expect(lab.locator(".cs-ask")).toBeVisible();
  await expect(lab.locator("[data-c=play]")).toBeDisabled();
  await lab.locator('.cg-node[data-v="1"]').click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  // кезек [2, 3]: соңғысын (3) таңдау - DFS-ке тән қате
  await lab.locator('.cg-node[data-v="3"]').click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-bad/);
  await expect(lab.locator("[data-fb=pred]")).toContainText("DFS-ке тән");
  await expect(lab.locator("[data-fb=pred]")).toContainText("Queue - FIFO");
  await expect(lab.locator(".cs-score")).toHaveText("Болжам: 1 / 2 дұрыс");
  // DFS: стек [1] → 1 алынып, 3, 2 салынады; түбіндегі 3 - BFS-ке тән
  await lab.locator("[data-algo=dfs]").click();
  await lab.locator('.cg-node[data-v="1"]').click();
  await lab.locator('.cg-node[data-v="3"]').click();
  await expect(lab.locator("[data-fb=pred]")).toContainText("BFS-ке тән");
  await expect(lab.locator("[data-fb=pred]")).toContainText("Stack - LIFO");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills);
  expect(st["cs.bfs.predict"].n).toBe(2);
  expect(st["cs.dfs.predict"].n).toBe(2);
  expect(errs).toEqual([]);
});

test("BFS/DFS: қорытынды тапсырма - кездейсоқ граф, тексеру, қате түрі, үш деңгейлі көмек", async ({ page }) => {
  const errs = await open(page, "academy/labs/bfs.html");
  const t = page.locator("[data-cslab=bfs-task]");
  const read = async () => ({ adj: parseEdges(await t.locator("[data-k=tedges]").textContent()), nums: ((await t.locator("[data-k=q]").textContent()).match(/\d+/g) || []).map(Number) });
  for (let i = 0; i < 4; i++) {
    const { adj, nums } = await read();
    const s = nums[0];
    await t.locator("[data-k=ans]").fill(refBFS(adj, s).order.join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/);
    // DFS ретін BFS орнына жазу - нақты диагноз (генератор BFS ≠ DFS болатын граф береді)
    await t.locator("[data-k=ans]").fill(refDFS(adj, s).join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-bad/);
    await expect(t.locator("[data-fb=task]")).toContainText("Бұл DFS реті");
    await t.locator("[data-c=new]").click();
  }
  await t.locator("[data-k=kind]").selectOption("dfs");
  { const { adj, nums } = await read();
    await t.locator("[data-k=ans]").fill(refDFS(adj, nums[0]).join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/);
    await t.locator("[data-k=ans]").fill(refBFS(adj, nums[0]).order.join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toContainText("Бұл BFS реті"); }
  await t.locator("[data-k=kind]").selectOption("dist");
  { const { adj, nums } = await read();
    const [s, target] = nums, d = refBFS(adj, s).dist[target];
    expect(d).toBeGreaterThanOrEqual(2);
    await t.locator("[data-k=ans]").fill(String(d + 1));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-bad/);
    await t.locator("[data-k=ans]").fill(String(d));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/);
    // үш деңгейлі көмек: үшіншісінен кейін «меңгеруге саналмайды»
    for (let i = 0; i < 3; i++) await t.locator(".tt-hbtn").click();
    await expect(t.locator(".tt-hlist li")).toHaveCount(3);
    await expect(t.locator(".tt-hlist li").nth(2)).toContainText(`Жауап: ${d}.`);
    await expect(t.locator("[data-fb=task]")).toContainText("меңгеруге саналмайды"); }
  const sk = await page.evaluate(() => JSON.parse(localStorage.getItem("ao17:tutor:v1")).skills);
  expect(sk["cs.bfs"].n).toBe(10);
  expect(sk["cs.dfs"].n).toBe(2);
  expect(errs).toEqual([]);
});

// ---------------------------------------------------------------- екілік іздеу
test("Екілік іздеу: mid тізбегі эталонмен бірдей, болжау және тапсырма", async ({ page }) => {
  const errs = await open(page, "academy/labs/binary-search.html");
  const lab = page.locator("[data-cslab=bsearch]");
  const arr = (await lab.locator(".bs-arr .bs-cell b").allTextContents()).map(Number);
  expect(arr).toHaveLength(15);
  expect([...arr].sort((a, b) => a - b)).toEqual(arr);
  const absent = [...Array(99)].map((_, i) => i + 1).filter((x) => !arr.includes(x));
  for (const t of [arr[0], arr[14], arr[6], arr[11], absent[0], absent[absent.length - 1]].filter((x, i, a) => a.indexOf(x) === i)) {
    await lab.locator("[data-k=t]").fill(String(t));
    await lab.locator("[data-c=go]").click();
    const mids = refBin(arr, t), seen = [];
    for (let i = 0; i < 40 && (await lab.locator("[data-c=next]").isEnabled()); i++) {
      await lab.locator("[data-c=next]").click();
      const m = (await lab.locator(".cs-say").textContent()).match(/mid = \(\d+ \+ \d+\) \/\/ 2 = (\d+)/);
      if (m) seen.push(+m[1]);
    }
    expect(seen).toEqual(mids);
    await expect(lab.locator("[data-k=bc]")).toHaveText(String(mids.length));
    const lin = arr.indexOf(t) < 0 ? 15 : arr.indexOf(t) + 1;
    await expect(lab.locator("[data-k=lc]")).toHaveText(String(lin));
    await expect(lab.locator(".cs-say")).toContainText(arr.includes(t) ? "табылды" : "тізімде жоқ");
  }
  // болжау: a[mid] < t болса - сол жағы; қате таңдауға себеп
  await lab.locator("[data-k=t]").fill(String(arr[14]));
  await lab.locator("[data-c=go]").click();
  await lab.locator("[data-k=predict]").check();
  await lab.locator("[data-c=next]").click();
  await lab.locator("[data-p=right]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-bad/);
  await expect(lab.locator("[data-fb=pred]")).toContainText(`${arr[7]} < ${arr[14]}`);
  await lab.locator("[data-c=next]").click();
  await lab.locator("[data-p=left]").click();
  await expect(lab.locator("[data-fb=pred]")).toHaveClass(/tt-ok/);
  // тапсырма
  const t = page.locator("[data-cslab=bsearch-task]");
  for (let i = 0; i < 3; i++) {
    const a = (await t.locator(".bs-cell b").allTextContents()).map(Number);
    const target = +(await t.locator("[data-k=q]").textContent()).match(/Мақсат: (\d+)/)[1];
    const want = refBin(a, target).map((m) => a[m]);
    await t.locator("[data-k=ans]").fill(want.slice(0, -1).concat([want[want.length - 1] + 1000]).join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-bad/);
    await expect(t.locator("[data-fb=task]")).toContainText("// 2");
    await t.locator("[data-k=ans]").fill(want.join(" "));
    await t.locator("[data-c=check]").click();
    await expect(t.locator("[data-fb=task]")).toHaveClass(/tt-ok/);
    await t.locator("[data-c=new]").click();
  }
  expect(errs).toEqual([]);
});

// ---------------------------------------------------------------- Python
test("Python: нағыз трасса, айнымалылар, болжау сұрақтары трассамен тексеріледі, қателер", async ({ page }) => {
  test.setTimeout(120_000);
  await routePyodide(page.context());
  const errs = await open(page, "academy/labs/python.html");
  const lab = page.locator("[data-cslab=python]"), q = page.locator("[data-cslab=python-q]");
  // 1) цикл: формуламен тәуелсіз есептейміз
  const code = await lab.locator("[data-k=code]").inputValue();
  const N = +code.match(/range\(1, (\d+)\)/)[1] - 1, K = +(code.match(/i \* (\d+)/) || [0, 1])[1];
  const m = +(await q.locator("[data-k=q]").textContent()).match(/i = (\d+)/)[1];
  const S = (x) => (K * x * (x + 1)) / 2;
  await q.locator("[data-k=ans]").fill(String(S(m - 1)));
  await q.locator("[data-c=check]").click();
  await expect(q.locator("[data-fb=q]")).toHaveClass(/tt-bad/, { timeout: 60_000 });
  await expect(q.locator("[data-fb=q]")).toContainText("ДЕЙІНГІ");
  await q.locator("[data-k=ans]").fill(String(S(m)));
  await q.locator("[data-c=check]").click();
  await expect(q.locator("[data-fb=q]")).toHaveClass(/tt-ok/);
  // қадамдау: тексеруден кейін сол қадамға секірді - total панельде
  await expect(lab.locator(".py-frame.cur tr", { hasText: "total" }).locator("td")).toHaveText(String(S(m)));
  await lab.locator("[data-c=reset]").click();
  await expect(lab.locator(".cs-n")).toHaveText(/^1 \//);
  await expect(lab.locator(".py-code li.next")).toHaveCount(1);
  await lab.locator("[data-c=step]").click();
  await lab.locator("[data-c=step]").click();
  await expect(lab.locator(".py-vars tr.ch")).not.toHaveCount(0);
  await lab.locator("[data-c=back]").click();
  await expect(lab.locator(".cs-n")).toHaveText(/^2 \//);
  await lab.locator("[data-c=end]").click();
  await expect(lab.locator(".py-out")).toHaveText(String(S(N)));
  // 2) aliasing: b = a бір нысан (#1), c = a[:] - жаңа
  await lab.locator("[data-k=preset]").selectOption("alias");
  const ac = await lab.locator("[data-k=code]").inputValue();
  const base = ac.match(/a = \[(.*)\]/)[1], p = ac.match(/b\.append\((\d+)\)/)[1];
  await q.locator("[data-k=ans]").fill(`[${base}]`);
  await q.locator("[data-c=check]").click();
  await expect(q.locator("[data-fb=q]")).toContainText("b = a көшірме жасамайды");
  await q.locator("[data-k=ans]").fill(`[${base}, ${p}]`);
  await q.locator("[data-c=check]").click();
  await expect(q.locator("[data-fb=q]")).toHaveClass(/tt-ok/);
  await expect(lab.locator("[data-c=end]")).toBeDisabled();   // тексеру соңғы күйге секірді
  const refs = await lab.locator(".py-vars tr").evaluateAll((rows) => Object.fromEntries(rows.map((r) => [r.querySelector("th").textContent, (r.querySelector(".py-ref") || {}).textContent])));
  expect(refs.a).toBe(refs.b);
  expect(refs.c).not.toBe(refs.a);
  // 3) рекурсия: ең терең сәтте N жақтау
  await lab.locator("[data-k=preset]").selectOption("fact");
  const n = +(await lab.locator("[data-k=code]").inputValue()).match(/fact\((\d+)\)\n/)[1];
  await q.locator("[data-k=ans]").fill(String(n));
  await q.locator("[data-c=check]").click();
  await expect(q.locator("[data-fb=q]")).toHaveClass(/tt-ok/);
  await expect(lab.locator(".py-frame h4", { hasText: "fact()" })).toHaveCount(n);
  await lab.locator("[data-c=end]").click();
  await expect(lab.locator(".py-out")).toHaveText(String([...Array(n)].reduce((a, _, i) => a * (i + 1), 1)));
  // 4) жол құру: көмек трассадан шығады
  await lab.locator("[data-k=preset]").selectOption("str");
  const word = (await lab.locator("[data-k=code]").inputValue()).match(/word = "(.*)"/)[1];
  const k2 = +(await q.locator("[data-k=q]").textContent()).match(/(\d+)-айналымнан/)[1];
  for (let i = 0; i < 3; i++) { await q.locator(".tt-hbtn").click(); await expect(q.locator(".tt-hlist li")).toHaveCount(i + 1); }
  await expect(q.locator(".tt-hlist li").nth(2)).toContainText(`Жауап: ${[...word].slice(0, k2).reverse().join("")}.`);
  await q.locator("[data-k=ans]").fill([...word].slice(0, k2).join(""));
  await q.locator("[data-c=check]").click();
  await expect(q.locator("[data-fb=q]")).toContainText("АЛДЫНА");
  // 5) қателер: синтаксис, орындау, қадам шегі
  await lab.locator("[data-k=preset]").selectOption("custom");
  await expect(q.locator("[data-c=check]")).toBeDisabled();
  const ta = lab.locator("[data-k=code]");
  await ta.fill("x = 1\nif x > 0\n    print(x)\n");
  await lab.locator("[data-c=step]").click();
  await expect(lab.locator(".py-err")).toContainText("SyntaxError, 2-жол");
  await expect(lab.locator(".py-gut span.err")).toHaveText("2");
  await ta.fill("a = [1, 2]\nprint(a[0])\nprint(a[5])\n");
  await lab.locator("[data-c=end]").click();
  await expect(lab.locator(".py-err")).toContainText("IndexError, 3-жол");
  await expect(lab.locator(".py-err")).toContainText("Индекс шекарадан тыс");
  await expect(lab.locator(".py-code li.err")).toHaveCount(1);
  await expect(lab.locator(".py-out")).toHaveText("1");
  await lab.locator("[data-c=edit]").click();
  await ta.fill("i = 0\nwhile i < 10:\n    i = i * 1\n");
  await lab.locator("[data-c=end]").click();
  await expect(lab.locator(".py-err")).toContainText("Қадам шегі: 1000");
  expect(errs).toEqual([]);
});

test("Python: Pyodide жүктелмесе - адал хабар", async ({ page }) => {
  await blockFonts(page.context());
  await page.context().route(/pyodide|unpkg\.com/, (r) => r.abort());
  await page.goto("academy/labs/python.html");
  await page.locator("[data-cslab=python] [data-c=step]").click();
  await expect(page.locator(".py-status")).toContainText("Pyodide) жүктелмеді", { timeout: 30_000 });
  await expect(page.locator(".py-status")).toHaveClass(/bad/);
});

// ---------------------------------------------------------------- хаб, телефон, a11y
test("Хаб: дайын зертханалар сілтемесі бар, жоспардағылар белгіленген", async ({ page }) => {
  const errs = await open(page, "academy/labs/index.html");
  for (const h of ["bfs.html", "python.html", "binary-search.html", "dijkstra.html", "scheduler.html", "cpu.html", "network.html", "database.html", "distributed.html", "../models.html#v-graph", "../models.html#v-sort", "../lab.html"]) await expect(page.locator(`.lab-map a[href="${h}"]`)).toHaveCount(1);
  // 2-пакеттен кейін жоспарда қалған зертхана жоқ: бәрі «дайын» не «модель бар»
  await expect(page.locator(".lab-map li.planned")).toHaveCount(0);
  await expect(page.locator(".lab-map li.planned a")).toHaveCount(0);
  expect(errs).toEqual([]);
});

for (const scheme of ["light", "dark"]) {
  test(`CS зертханалары (${scheme}): 360px жылжу жоқ, a11y`, async ({ browser }) => {
    test.setTimeout(120_000);
    const c = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: scheme, reducedMotion: "reduce" });
    await blockFonts(c);
    await routePyodide(c);
    const p = await c.newPage();
    const errs = collectErrors(p);
    const problems = [];
    for (const url of ["academy/labs/index.html", "academy/labs/bfs.html", "academy/labs/python.html", "academy/labs/binary-search.html"]) {
      await p.goto(url);
      if (url.endsWith("bfs.html")) { await p.locator("[data-k=predict]").check(); await p.locator("[data-k=edit]").check(); await p.locator(".tt-hbtn").click(); await p.locator("[data-cslab=bfs-task] [data-c=check]").click(); }
      if (url.endsWith("binary-search.html")) { await p.locator("[data-k=predict]").check(); await p.locator("[data-c=next]").click(); await p.locator("[data-p=found]").click(); }
      if (url.endsWith("python.html")) { await p.locator("[data-c=step]").click(); await expect(p.locator(".py-frame")).not.toHaveCount(0, { timeout: 60_000 }); await p.locator("[data-c=step]").click(); }
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), url).toBe(true);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document.querySelector("main"), { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations
        .filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")}`));
      v.forEach((x) => problems.push(`${url}: ${x}`));
    }
    expect(problems, problems.join("\n")).toEqual([]);
    expect(errs).toEqual([]);
    await c.close();
  });
}
