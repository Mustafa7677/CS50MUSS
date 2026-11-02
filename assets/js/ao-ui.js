/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 жабық платформаның беттері: кіру/тіркелу (login.html), Super Admin панелі (admin.html), оқушы кабинеті (student.html).
// Барлық шектеу серверде (RLS, ao_* функциялары). Мұндағы тексерулер тек интерфейс үшін.
(function () {
  const AO = window.AO;
  const page = document.querySelector(".ao-page");
  if (!AO || !page) return;
  const kind = page.dataset.ao;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ROOT = AO.CFG && document.querySelector('script[src$="assets/js/ao-ui.js"]') ? document.querySelector('script[src$="assets/js/ao-ui.js"]').src.replace(/assets\/js\/ao-ui\.js.*$/, "") : new URL(".", location.href).href;
  const qs = new URLSearchParams(location.search);
  const COURSES = { x: "CS50x · Информатикаға кіріспе", python: "CS50P · Python", sql: "CS50 SQL", ai: "CS50 AI", web: "CS50 Web", cpp: "C++", java: "Java", en: "English A0-C1", math: "Математика", tools: "Жаттығу, ойын, емтихан", projects: "Жобалар" };
  const cname = (c) => COURSES[c] || c;
  const fmt = (t) => (t ? new Date(t).toLocaleString("kk-KZ", { dateStyle: "medium", timeStyle: "short" }) : "-");
  const ago = (t) => {
    if (!t) return "әлі жоқ";
    const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
    return s < 60 ? "жаңа ғана" : s < 3600 ? Math.floor(s / 60) + " мин бұрын" : s < 86400 ? Math.floor(s / 3600) + " сағ бұрын" : Math.floor(s / 86400) + " күн бұрын";
  };
  // datetime-local ⇄ ISO (пайдаланушының жергілікті уақыты)
  const toLocal = (iso) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const fromLocal = (v) => (v ? new Date(v).toISOString() : null);
  function msg(el, text, bad) { el.textContent = text || ""; el.classList.toggle("bad", !!bad); }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); } catch (e) { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    if (btn) { const o = btn.textContent; btn.textContent = "Көшірілді ✓"; setTimeout(() => (btn.textContent = o), 1500); }
  }
  const nextUrl = () => { const n = qs.get("next"); return n && /^[a-z0-9_./?=&%#-]+$/i.test(n) && !n.startsWith("//") && !/^[a-z]+:/i.test(n) ? ROOT + n : null; };

  // ======================================================================== кіру / тіркелу
  function renderLogin() {
    page.innerHTML = `
      <div class="ao-card ao-auth">
        <div class="ao-tabs" role="tablist">
          <button type="button" role="tab" data-tab="in" aria-selected="true">Кіру</button>
          <button type="button" role="tab" data-tab="up" aria-selected="false">Тіркелу</button>
          <button type="button" role="tab" data-tab="forgot" aria-selected="false">Құпиясөзді ұмыттым</button>
        </div>
        <form class="ao-form" data-form="in">
          <label>Email не логин<input name="login" autocomplete="username" required></label>
          <label>Құпиясөз<input name="pw" type="password" autocomplete="current-password" required></label>
          <button class="btn gold" type="submit">Кіру</button>
        </form>
        <form class="ao-form" data-form="up" hidden>
          <label>Аты-жөніңіз<input name="name" autocomplete="name" maxlength="80" required></label>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          <label>Құпиясөз <small>(кемінде 10 таңба)</small><input name="pw" type="password" autocomplete="new-password" minlength="10" required></label>
          <label>Құпиясөзді қайталаңыз<input name="pw2" type="password" autocomplete="new-password" minlength="10" required></label>
          <button class="btn gold" type="submit">Аккаунт ашу</button>
        </form>
        <form class="ao-form" data-form="forgot" hidden>
          <label>Тіркелген email<input name="email" type="email" autocomplete="email" required></label>
          <button class="btn gold" type="submit">Қалпына келтіру хатын жіберу</button>
        </form>
        <form class="ao-form" data-form="reset" hidden>
          <p>Жаңа құпиясөз ойлап табыңыз.</p>
          <label>Жаңа құпиясөз<input name="pw" type="password" autocomplete="new-password" minlength="10" required></label>
          <label>Қайталаңыз<input name="pw2" type="password" autocomplete="new-password" minlength="10" required></label>
          <button class="btn gold" type="submit">Сақтау</button>
        </form>
        <p class="ao-msg" role="status" aria-live="polite"></p>
      </div>`;
    const out = $(".ao-msg", page);
    const show = (t) => {
      page.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
      page.querySelectorAll("[data-form]").forEach((f) => (f.hidden = f.dataset.form !== t));
      msg(out, "");
    };
    page.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
    if (qs.get("invite") || qs.get("join")) show("up");

    const done = async (prof) => {
      if (prof && prof.role === "admin") return (location.href = ROOT + "admin.html");
      const keep = qs.get("invite") ? "?invite=" + encodeURIComponent(qs.get("invite")) : "";
      location.href = nextUrl() || ROOT + "student.html" + keep;
    };
    $('[data-form="in"]', page).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target; msg(out, "Тексерілуде…");
      try { await done(await AO.signIn(f.login.value, f.pw.value)); } catch (err) { msg(out, AO.human(err), true); }
    });
    $('[data-form="up"]', page).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.pw.value !== f.pw2.value) return msg(out, "Құпиясөздер сәйкес емес", true);
      msg(out, "Аккаунт ашылуда…");
      try {
        const r = await AO.signUp(f.email.value, f.pw.value, f.name.value);
        if (r.session) return done(await AO.me());
        msg(out, "Дайын! " + f.email.value + " поштасына растау хаты жіберілді. Хаттағы сілтемені ашқан соң осы жерден кіріңіз.");
        f.reset();
      } catch (err) { msg(out, AO.human(err), true); }
    });
    $('[data-form="forgot"]', page).addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const c = await AO.client();
        const { error } = await c.auth.resetPasswordForEmail(e.target.email.value.trim(), { redirectTo: ROOT + "login.html?reset=1" });
        if (error) throw error;
        msg(out, "Хат жіберілді (email тіркелген болса). Поштаңызды тексеріңіз.");
      } catch (err) { msg(out, AO.human(err), true); }
    });
    $('[data-form="reset"]', page).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.pw.value !== f.pw2.value) return msg(out, "Құпиясөздер сәйкес емес", true);
      try {
        const c = await AO.client();
        const { error } = await c.auth.updateUser({ password: f.pw.value });
        if (error) throw error;
        await AO.rpc("ao_password_changed").catch(() => {});
        await done(await AO.me());
      } catch (err) { msg(out, AO.human(err), true); }
    });
    AO.client().then((c) => c.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") show("reset"); }));
    if (qs.get("reset")) show("reset");
    else AO.me().then((p) => { if (p) done(p); }).catch(() => {});
  }

  // ======================================================================== жалпы: кіру тексеруі
  async function requireUser() {
    let p = null;
    try { p = await AO.me(); } catch (e) {}
    if (!p) { location.href = ROOT + "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search); return null; }
    return p;
  }
  function header(p, title) {
    return `<div class="ao-top"><div><h1>${esc(title)}</h1><p class="ao-who">${esc(p.display_name || p.email)}${p.role === "admin" ? ' · <b>Super Admin</b>' : ""}</p></div>
      <button class="btn ghost" type="button" data-act="logout">Шығу</button></div>`;
  }
  function bindLogout() {
    page.querySelectorAll('[data-act="logout"]').forEach((b) => b.addEventListener("click", async () => { await AO.signOut(); location.href = ROOT + "login.html"; }));
  }
  function renderPasswordChange(p, after) {
    page.innerHTML = header(p, "Құпиясөзді ауыстыру") + `
      <div class="ao-card"><p>Бұл - алғашқы кіру. Уақытша құпиясөзді өзіңіз ғана білетін жаңа құпиясөзге ауыстырыңыз (кемінде 12 таңба: әріп, сан, белгі).</p>
      <form class="ao-form" data-form="chg">
        <label>Жаңа құпиясөз<input name="pw" type="password" autocomplete="new-password" minlength="12" required></label>
        <label>Қайталаңыз<input name="pw2" type="password" autocomplete="new-password" minlength="12" required></label>
        <button class="btn gold" type="submit">Сақтау</button>
      </form><p class="ao-msg" role="status" aria-live="polite"></p></div>`;
    bindLogout();
    const out = $(".ao-msg", page);
    $('[data-form="chg"]', page).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      if (f.pw.value !== f.pw2.value) return msg(out, "Құпиясөздер сәйкес емес", true);
      if (!/[A-Za-z]/.test(f.pw.value) || !/\d/.test(f.pw.value)) return msg(out, "Әріп пен сан болуы керек", true);
      try {
        const c = await AO.client();
        const { error } = await c.auth.updateUser({ password: f.pw.value });
        if (error) throw error;
        await AO.rpc("ao_password_changed");
        p.must_change_password = false;
        after();
      } catch (err) { msg(out, AO.human(err), true); }
    });
  }

  // ======================================================================== Super Admin панелі
  const A = { classes: [], pages: [], cur: null, tab: "content" };
  async function renderAdmin() {
    const p = await requireUser(); if (!p) return;
    if (p.role !== "admin") { page.innerHTML = header(p, "Рұқсат жоқ") + '<div class="ao-card"><p>Бұл бет тек Super Admin үшін. <a href="student.html">Кабинетіңізге өтіңіз</a>.</p></div>'; bindLogout(); return; }
    if (p.must_change_password) return renderPasswordChange(p, renderAdmin);
    page.innerHTML = header(p, "Мұғалім панелі") + `
      <div class="ao-admin">
        <aside class="ao-card ao-classes">
          <h2>Кластар</h2>
          <form class="ao-inline" data-form="new"><input name="title" placeholder="Мысалы, Python 2026" maxlength="80" required aria-label="Жаңа класс атауы"><button class="btn gold" type="submit">Ашу</button></form>
          <ul class="ao-list" data-list="classes"></ul>
        </aside>
        <section class="ao-card ao-detail" data-detail><p class="ao-empty">Сол жақтан класс таңдаңыз не жаңасын ашыңыз.</p></section>
      </div><p class="ao-msg" role="status" aria-live="polite" data-gmsg></p>`;
    bindLogout();
    $('[data-form="new"]', page).addEventListener("submit", async (e) => {
      e.preventDefault();
      try { const r = await AO.rpc("ao_admin_class_create", { p_title: e.target.title.value }); e.target.reset(); A.cur = r.id; await loadClasses(); }
      catch (err) { msg($("[data-gmsg]", page), AO.human(err), true); }
    });
    const c = await AO.client();
    const { data: pages } = await c.from("ao_pages").select("path,course,kind,title,sort").order("course").order("sort").order("path");
    A.pages = pages || [];
    await loadClasses();
  }
  async function loadClasses() {
    A.classes = (await AO.rpc("ao_admin_overview")) || [];
    const ul = $('[data-list="classes"]', page);
    ul.innerHTML = A.classes.length ? A.classes.map((k) => `<li><button type="button" data-class="${k.id}" aria-current="${k.id === A.cur}">
        <b>${esc(k.title)}</b><span>${k.members} оқушы · ${k.grants} ашық${k.archived ? " · мұрағат" : !k.join_open ? " · қосылу жабық" : ""}</span></button></li>`).join("")
      : '<li class="ao-empty">Әзірге класс жоқ.</li>';
    ul.querySelectorAll("[data-class]").forEach((b) => b.addEventListener("click", () => { A.cur = b.dataset.class; loadClasses(); }));
    if (A.cur) renderClass(A.classes.find((k) => k.id === A.cur));
  }
  function renderClass(k) {
    const box = $("[data-detail]", page);
    if (!k) { box.innerHTML = '<p class="ao-empty">Класс табылмады.</p>'; return; }
    const link = ROOT + "student.html?invite=" + k.invite_token;
    box.innerHTML = `
      <div class="ao-class-head">
        <h2>${esc(k.title)}</h2>
        <div class="ao-codes">
          <div><span>Қосылу коды</span><code class="ao-code">${esc(k.join_code)}</code><button class="btn ghost" type="button" data-copy="${esc(k.join_code)}">Көшіру</button></div>
          <div><span>Шақыру сілтемесі</span><code class="ao-link">${esc(link)}</code><button class="btn ghost" type="button" data-copy="${esc(link)}">Көшіру</button></div>
        </div>
      </div>
      <div class="ao-tabs" role="tablist">
        <button type="button" role="tab" data-t="content" aria-selected="${A.tab === "content"}">Ашылатын мазмұн</button>
        <button type="button" role="tab" data-t="students" aria-selected="${A.tab === "students"}">Оқушылар (${k.members})</button>
        <button type="button" role="tab" data-t="settings" aria-selected="${A.tab === "settings"}">Баптау</button>
      </div>
      <div data-pane></div><p class="ao-msg" role="status" aria-live="polite" data-cmsg></p>`;
    box.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => copy(b.dataset.copy, b)));
    box.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { A.tab = b.dataset.t; renderClass(k); }));
    ({ content: paneContent, students: paneStudents, settings: paneSettings })[A.tab](k, $("[data-pane]", box), $("[data-cmsg]", box));
  }

  // ---------- мазмұн: курс және бет деңгейі ----------
  async function paneContent(k, el, out) {
    el.innerHTML = '<p class="ao-empty">Жүктелуде…</p>';
    const c = await AO.client();
    const { data: grants, error } = await c.from("ao_grants").select("*").eq("class_id", k.id);
    if (error) return msg(out, AO.human(error), true);
    const g = {}; (grants || []).forEach((x) => (g[x.scope + ":" + x.target] = x));
    const byCourse = {};
    A.pages.forEach((p) => (byCourse[p.course] = byCourse[p.course] || []).push(p));
    if (!A.pages.length) { el.innerHTML = '<p class="ao-empty">Мазмұн каталогы бос. Алдымен tools/gate.py --upload іске қосылуы керек (docs/PLATFORM.md).</p>'; return; }
    el.innerHTML = `<p class="ao-hint">Курсты ашсаңыз, оның барлық лекциясы мен тапсырмасы ашылады. Жеке бетті бөлек жабуға не ашуға болады (курстан басым). Мерзімді берсеңіз, сол уақыт аралығында ғана ашық.</p>` +
      Object.keys(byCourse).map((cid) => {
        const cg = g["course:" + cid];
        const st = cg ? (cg.open ? "open" : "closed") : "closed";
        return `<details class="ao-course" data-course="${esc(cid)}">
          <summary><b>${esc(cname(cid))}</b> <span class="ao-badge ${st}">${st === "open" ? "ашық" : "жабық"}</span> <small>${byCourse[cid].length} бет</small></summary>
          <div class="ao-grant" data-scope="course" data-target="${esc(cid)}">
            <label>Курс<select name="state"><option value="closed"${st === "closed" ? " selected" : ""}>Жабық</option><option value="open"${st === "open" ? " selected" : ""}>Ашық</option></select></label>
            <label>Ашылады<input type="datetime-local" name="from" value="${toLocal(cg && cg.opens_at)}"></label>
            <label>Жабылады<input type="datetime-local" name="to" value="${toLocal(cg && cg.closes_at)}"></label>
            <button class="btn" type="button" data-save>Сақтау</button>
          </div>
          <ul class="ao-pages">${byCourse[cid].map((p) => {
            const pg = g["page:" + p.path];
            const v = pg ? (pg.open ? "open" : "closed") : "inherit";
            return `<li class="ao-grant" data-scope="page" data-target="${esc(p.path)}"><span title="${esc(p.path)}">${esc(p.title || p.path)}</span>
              <select name="state" aria-label="${esc(p.title || p.path)}"><option value="inherit"${v === "inherit" ? " selected" : ""}>Курс бойынша</option><option value="open"${v === "open" ? " selected" : ""}>Ашық</option><option value="closed"${v === "closed" ? " selected" : ""}>Жабық</option></select></li>`;
          }).join("")}</ul>
        </details>`;
      }).join("");
    async function save(row) {
      const scope = row.dataset.scope, target = row.dataset.target, state = row.querySelector('[name="state"]').value;
      try {
        if ((scope === "page" && state === "inherit") || (scope === "course" && state === "closed" && !row.querySelector('[name="from"]').value)) {
          const { error } = await c.from("ao_grants").delete().match({ class_id: k.id, scope, target });
          if (error) throw error;
        } else {
          const rec = { class_id: k.id, scope, target, open: state === "open", updated_at: new Date().toISOString() };
          if (scope === "course") { rec.opens_at = fromLocal(row.querySelector('[name="from"]').value); rec.closes_at = fromLocal(row.querySelector('[name="to"]').value); }
          const { error } = await c.from("ao_grants").upsert(rec, { onConflict: "class_id,scope,target" });
          if (error) throw error;
        }
        msg(out, "Сақталды ✓ " + (scope === "course" ? cname(target) : target));
        loadClasses();
      } catch (err) { msg(out, AO.human(err), true); }
    }
    el.querySelectorAll('.ao-grant[data-scope="page"] select').forEach((s) => s.addEventListener("change", () => save(s.closest(".ao-grant"))));
    el.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", () => save(b.closest(".ao-grant"))));
  }

  // ---------- оқушылар: прогресс, тест нәтижесі, шығару ----------
  async function paneStudents(k, el, out) {
    el.innerHTML = '<p class="ao-empty">Жүктелуде…</p>';
    let rows;
    try { rows = (await AO.rpc("ao_admin_members", { p_class: k.id })) || []; } catch (err) { return msg(out, AO.human(err), true); }
    if (!rows.length) { el.innerHTML = '<p class="ao-empty">Әзірге оқушы жоқ. Қосылу кодын не шақыру сілтемесін беріңіз.</p>'; return; }
    el.innerHTML = `<div class="ao-table-wrap"><table class="ao-table"><thead><tr><th>Оқушы</th><th>Оқыған</th><th>Тапсырма</th><th>Тест, %</th><th>Емтихан</th><th>Соңғы белсенділік</th><th></th></tr></thead><tbody>
      ${rows.map((r, i) => { const s = r.summary || {}; return `<tr>
        <td><button class="ao-link-btn" type="button" data-open="${i}">${esc(r.display_name || r.email)}</button><small>${esc(r.email)}</small></td>
        <td>${s.read ?? 0}</td><td>${s.tasks ?? 0}</td><td>${s.quiz ?? "-"}</td><td>${s.exam ?? "-"}</td>
        <td title="${esc(fmt(r.updated_at))}">${ago(r.updated_at)}</td>
        <td><button class="btn ghost danger" type="button" data-rm="${r.user_id}">Шығару</button></td></tr>`; }).join("")}
      </tbody></table></div><div data-student></div>`;
    el.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => studentDetail(rows[+b.dataset.open], $("[data-student]", el))));
    el.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", async () => {
      const r = rows.find((x) => x.user_id === b.dataset.rm);
      if (!confirm((r.display_name || r.email) + " оқушысын «" + k.title + "» класынан шығарасыз ба? Оның прогресі сақталады, бірақ бұл класқа ашылған мазмұн оған жабылады.")) return;
      const c = await AO.client();
      const { error } = await c.from("ao_members").delete().match({ class_id: k.id, user_id: r.user_id });
      if (error) return msg(out, AO.human(error), true);
      msg(out, "Шығарылды ✓"); loadClasses();
    }));
  }
  function studentDetail(r, el) {
    const d = (r.snapshot && r.snapshot.d) || {};
    const pr = d["cs50kz:progress"] || {};
    const quiz = Object.entries(pr.quiz || {}).sort();
    const read = Object.keys(pr.read || {}).sort();
    const exam = d["cs50kz:exam"] || {};
    const exams = Object.entries(d).filter(([key]) => /^cs50kz:exam:/.test(key));
    el.innerHTML = `<div class="ao-student"><h3>${esc(r.display_name || r.email)}</h3>
      <p>Қосылған: ${esc(fmt(r.joined_at))} · Соңғы синхрондау: ${esc(fmt(r.updated_at))}</p>
      <h4>Тест нәтижелері</h4>${quiz.length ? `<table class="ao-table"><thead><tr><th>Тест</th><th>Ең жақсы</th><th>%</th></tr></thead><tbody>${quiz.map(([q, v]) => `<tr><td>${esc(q)}</td><td>${esc(v.best)} / ${esc(v.total)}</td><td>${v.total ? Math.round((v.best / v.total) * 100) : "-"}</td></tr>`).join("")}</tbody></table>` : "<p>Әзірге тест тапсырмаған.</p>"}
      <h4>Емтихан</h4><p>${exam.best != null ? "Ең жақсы нәтиже: " + esc(exam.best) + "%" : "Әзірге жоқ"}${exams.map(([key, v]) => "<br>" + esc(key.split(":").pop()) + ": " + esc((v && v.best) ?? "-") + "%").join("")}</p>
      <h4>Оқыған лекциялар (${read.length})</h4><p class="ao-read">${read.length ? read.map(esc).join(", ") : "Әзірге жоқ"}</p></div>`;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------- баптау ----------
  function paneSettings(k, el, out) {
    el.innerHTML = `<form class="ao-form" data-form="title"><label>Класс атауы<input name="title" value="${esc(k.title)}" maxlength="80" required></label><button class="btn" type="submit">Атауын сақтау</button></form>
      <div class="ao-switches">
        <label><input type="checkbox" name="join_open"${k.join_open ? " checked" : ""}> Жаңа оқушылар қосыла алады</label>
        <label><input type="checkbox" name="archived"${k.archived ? " checked" : ""}> Мұрағат (барлық мазмұн бұл класс үшін жабылады)</label>
      </div>
      <p><button class="btn ghost" type="button" data-regen>Қосылу коды мен сілтемені жаңарту</button> <small>Ескі код пен сілтеме жұмыс істемей қалады; бар оқушылар класта қалады.</small></p>
      <p><button class="btn ghost danger" type="button" data-del>Класты жою</button></p>`;
    const upd = async (patch) => {
      const c = await AO.client();
      const { error } = await c.from("ao_classes").update(patch).eq("id", k.id);
      if (error) return msg(out, AO.human(error), true);
      msg(out, "Сақталды ✓"); loadClasses();
    };
    $('[data-form="title"]', el).addEventListener("submit", (e) => { e.preventDefault(); upd({ title: e.target.title.value.trim() }); });
    el.querySelectorAll(".ao-switches input").forEach((i) => i.addEventListener("change", () => upd({ [i.name]: i.checked })));
    $("[data-regen]", el).addEventListener("click", async () => {
      if (!confirm("Кодты жаңартасыз ба? Ескі код пен сілтеме бірден жарамсыз болады.")) return;
      try { await AO.rpc("ao_admin_regen_codes", { p_class: k.id }); msg(out, "Жаңартылды ✓"); loadClasses(); } catch (err) { msg(out, AO.human(err), true); }
    });
    $("[data-del]", el).addEventListener("click", async () => {
      if (prompt("Жою қайтарылмайды: класс, оның мүшелігі мен рұқсаттары өшеді (оқушылардың аккаунты мен прогресі қалады). Растау үшін класс атауын жазыңыз:") !== k.title) return;
      const c = await AO.client();
      const { error } = await c.from("ao_classes").delete().eq("id", k.id);
      if (error) return msg(out, AO.human(error), true);
      A.cur = null; loadClasses(); $("[data-detail]", page).innerHTML = '<p class="ao-empty">Класс жойылды.</p>';
    });
  }

  // ======================================================================== оқушы кабинеті
  async function renderStudent() {
    const p = await requireUser(); if (!p) return;
    if (p.must_change_password) return renderPasswordChange(p, renderStudent);
    page.innerHTML = header(p, "Менің кабинетім") + `
      ${p.role === "admin" ? '<p><a class="btn" href="admin.html">Мұғалім панеліне өту</a></p>' : ""}
      <div class="ao-card"><h2>Класқа қосылу</h2>
        <form class="ao-inline" data-form="join"><input name="code" placeholder="8 таңбалы код" maxlength="32" autocomplete="off" required aria-label="Қосылу коды"><button class="btn gold" type="submit">Қосылу</button></form>
        <p class="ao-msg" role="status" aria-live="polite" data-jmsg></p></div>
      <div class="ao-card"><h2>Менің кластарым</h2><ul class="ao-list" data-my></ul></div>
      <div class="ao-card"><h2>Маған ашық мазмұн</h2><div data-access><p class="ao-empty">Жүктелуде…</p></div></div>`;
    bindLogout();
    const jm = $("[data-jmsg]", page);
    const join = async (code) => {
      try {
        const r = await AO.rpc("ao_join", { p_code: code });
        msg(jm, r.already ? "Сіз «" + r.title + "» класындасыз." : "«" + r.title + "» класына қосылдыңыз ✓");
        load();
      } catch (err) { msg(jm, AO.human(err), true); }
    };
    $('[data-form="join"]', page).addEventListener("submit", (e) => { e.preventDefault(); join(e.target.code.value.trim()); e.target.reset(); });
    const inv = qs.get("invite");
    if (inv) { history.replaceState(null, "", location.pathname); await join(inv); }
    AO.startSync();
    load();
    async function load() {
      const [cls, acc] = await Promise.all([AO.rpc("ao_my_classes"), AO.rpc("ao_my_access")]).catch((e) => { msg(jm, AO.human(e), true); return [[], []]; });
      $("[data-my]", page).innerHTML = (cls || []).length ? cls.map((k) => `<li><b>${esc(k.title)}</b><span>қосылған: ${esc(fmt(k.joined_at))}</span></li>`).join("") : '<li class="ao-empty">Әзірге ешбір класта емессіз. Мұғалім берген кодты жоғарыға енгізіңіз.</li>';
      const by = {};
      (acc || []).forEach((x) => (by[x.course] = by[x.course] || []).push(x));
      $("[data-access]", page).innerHTML = Object.keys(by).length ? Object.keys(by).map((cid) => `<details class="ao-course" open><summary><b>${esc(cname(cid))}</b> <small>${by[cid].length} бет</small></summary>
        <ul class="ao-pages">${by[cid].map((x) => `<li><a href="${esc(ROOT + x.path)}">${esc(x.title || x.path)}</a></li>`).join("")}</ul></details>`).join("")
        : '<p class="ao-empty">Мұғалім әзірге ештеңе ашпаған.</p>';
    }
  }

  ({ login: renderLogin, admin: renderAdmin, student: renderStudent })[kind]?.();
})();
