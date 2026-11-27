/* © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 жабық платформаның беттері: кіру/тіркелу (login.html), Super Admin панелі (admin.html), оқушы кабинеті (student.html).
// Барлық шектеу серверде (RLS, ao_* функциялары). Мұндағы тексерулер тек интерфейс үшін.
(function () {
  const AO = window.AO;
  const page = document.querySelector(".ao-page");
  if (!AO || !page) return;
  const kind = page.dataset.ao;
  const $ = (s, el) => (el || document).querySelector(s);
  const MIGR = "Бұл мүмкіндікке дерекқорды жаңарту керек: supabase/platform.sql (docs/PLATFORM.md).";
  const migr = (e) => /does not exist|could not find|schema cache|PGRST20[02]/i.test(String((e && (e.message || e.details || e.code)) || e));
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ROOT = AO.CFG && document.querySelector('script[src$="assets/js/ao-ui.js"]') ? document.querySelector('script[src$="assets/js/ao-ui.js"]').src.replace(/assets\/js\/ao-ui\.js.*$/, "") : new URL(".", location.href).href;
  const qs = new URLSearchParams(location.search);
  const COURSES = { x: "CS50x · Информатикаға кіріспе", python: "CS50P · Python", sql: "CS50 SQL", ai: "CS50 AI", web: "CS50 Web", cpp: "C++", java: "Java", en: "English A0-C1", math: "Математика", tools: "Жаттығу, ойын, емтихан", projects: "Жобалар", academy: "AO17 CS Universe", teach: "Мұғалімге: сабақ жоспарлары" };
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
      if (prof && (prof.role === "admin" || prof.role === "teacher")) return (location.href = ROOT + "admin.html");
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
    return `<div class="ao-top"><div><h1>${esc(title)}</h1><p class="ao-who">${esc(p.display_name || p.email)}${p.role === "admin" ? ' · <b>Super Admin</b>' : p.role === "teacher" ? ' · <b>Мұғалім</b>' : ""}</p></div>
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
    if (p.role !== "admin" && p.role !== "teacher") { page.innerHTML = header(p, "Рұқсат жоқ") + '<div class="ao-card"><p>Бұл бет мұғалім мен Super Admin үшін. Мұғалім аккаунтын Super Admin береді. <a href="student.html">Кабинетіңізге өтіңіз</a>.</p></div>'; bindLogout(); return; }
    if (p.must_change_password) return renderPasswordChange(p, renderAdmin);
    page.innerHTML = header(p, "Мұғалім панелі") + `
      <div class="ao-admin">
        <aside class="ao-card ao-classes">
          <h2>Кластар</h2>
          <form class="ao-inline" data-form="new"><input name="title" placeholder="Мысалы, Python 2026" maxlength="80" required aria-label="Жаңа класс атауы"><button class="btn gold" type="submit">Ашу</button></form>
          <ul class="ao-list" data-list="classes"></ul>
          ${p.role === "admin" ? `<div class="ao-teachers">
            <h2>Мұғалімдер</h2>
            <p class="ao-hint">Мұғалім алдымен өзі тіркеледі, сосын осында оның email-ін енгізесіз. Мұғалім тек өзі ашқан кластарды көреді.</p>
            <form class="ao-inline" data-form="teacher"><input name="email" type="email" placeholder="мұғалімнің email-і" required aria-label="Мұғалімнің email-і"><button class="btn" type="submit">Мұғалім ету</button></form>
            <ul class="ao-list" data-list="teachers"></ul>
          </div>` : ""}
        </aside>
        <section class="ao-card ao-detail" data-detail><p class="ao-empty">Сол жақтан класс таңдаңыз не жаңасын ашыңыз.</p></section>
      </div><p class="ao-msg" role="status" aria-live="polite" data-gmsg></p>`;
    bindLogout();
    if (p.role === "admin") bindTeachers();
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
  // ---------- мұғалімдер (тек Super Admin): тағайындау және мұғалімдікті алу ----------
  async function loadTeachers() {
    const ul = $('[data-list="teachers"]', page);
    if (!ul) return;
    let rows = [];
    try { rows = (await AO.rpc("ao_admin_teachers")) || []; } catch (err) { ul.innerHTML = `<li class="ao-empty">${esc(migr(err) ? MIGR : AO.human(err))}</li>`; return; }
    ul.innerHTML = rows.length ? rows.map((t) => `<li class="ao-teacher"><span><b>${esc(t.display_name || t.email)}</b><small>${esc(t.email)} · ${t.classes} класс</small></span>
        <button class="btn ghost danger" type="button" data-unteach="${esc(t.email)}">Мұғалімдікті алу</button></li>`).join("")
      : '<li class="ao-empty">Әзірге мұғалім жоқ.</li>';
    ul.querySelectorAll("[data-unteach]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm(b.dataset.unteach + " мұғалімдігін аласыз ба? Оның кластары сақталады, бірақ оларды тек Super Admin басқарады.")) return;
      try { await AO.rpc("ao_admin_set_role", { p_email: b.dataset.unteach, p_role: "student" }); } catch (err) { return msg($("[data-gmsg]", page), AO.human(err), true); }
      msg($("[data-gmsg]", page), "Мұғалімдігі алынды ✓");
      loadTeachers();
    }));
  }
  function bindTeachers() {
    const f = $('[data-form="teacher"]', page);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = f.email.value.trim();
      try { await AO.rpc("ao_admin_set_role", { p_email: email, p_role: "teacher" }); } catch (err) {
        return msg($("[data-gmsg]", page), /пайдаланушы жоқ/.test(String(err && err.message)) ? "Бұл email-мен тіркелген адам жоқ: алдымен ол өзі тіркелуі керек" : AO.human(err), true);
      }
      f.reset();
      msg($("[data-gmsg]", page), email + " енді мұғалім ✓");
      loadTeachers();
    });
    loadTeachers();
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
        <button type="button" role="tab" data-t="assign" aria-selected="${A.tab === "assign"}">Тапсырмалар</button>
        <button type="button" role="tab" data-t="students" aria-selected="${A.tab === "students"}">Оқушылар (${k.members})</button>
        <button type="button" role="tab" data-t="results" aria-selected="${A.tab === "results"}">Нәтижелер</button>
        <button type="button" role="tab" data-t="settings" aria-selected="${A.tab === "settings"}">Баптау</button>
      </div>
      <div data-pane></div><p class="ao-msg" role="status" aria-live="polite" data-cmsg></p>`;
    box.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => copy(b.dataset.copy, b)));
    box.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { A.tab = b.dataset.t; renderClass(k); }));
    ({ content: paneContent, assign: paneAssign, students: paneStudents, results: paneResults, settings: paneSettings })[A.tab](k, $("[data-pane]", box), $("[data-cmsg]", box));
  }

  // ---------- мазмұн: курс және бет деңгейі ----------
  async function paneContent(k, el, out) {
    el.innerHTML = '<p class="ao-empty">Жүктелуде…</p>';
    const c = await AO.client();
    const { data: grants, error } = await c.from("ao_grants").select("*").eq("class_id", k.id);
    if (error) return msg(out, AO.human(error), true);
    const g = {}; (grants || []).forEach((x) => (g[x.scope + ":" + x.target] = x));
    const byCourse = {};
    A.pages.forEach((p) => { if (p.course !== "teach") (byCourse[p.course] = byCourse[p.course] || []).push(p); });   // мұғалім жоспарлары оқушыға ашылмайды
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

  // ---------- тапсырмалар: AO17 CS сабағы не сынағы, мерзімімен (assets/js/ao17-assign.js, supabase/platform.sql: ao_assignments) ----------
  async function paneAssign(k, el, out) {
    const T = window.AO17Assign;
    el.innerHTML = '<p class="ao-empty">Жүктелуде…</p>';
    if (!T) { el.innerHTML = ""; return msg(out, "Тапсырма модулі жүктелмеді: бетті жаңартыңыз", true); }
    const c = await AO.client();
    let list, rows;
    try {
      const r = await c.from("ao_assignments").select("id,kind,target,title,due_at,created_at").eq("class_id", k.id)
        .order("due_at", { ascending: true, nullsFirst: false }).order("created_at");
      if (r.error) throw r.error;
      list = r.data || [];
      rows = (await AO.rpc("ao_admin_members", { p_class: k.id })) || [];
    } catch (err) { el.innerHTML = `<p class="ao-empty">${esc(migr(err) ? MIGR : AO.human(err))}</p>`; return; }
    const now = Date.now();
    const lessons = A.pages.map((p) => ({ id: T.lessonOf(p.path), title: p.title || p.path })).filter((x) => x.id).sort((a, b) => a.id.localeCompare(b.id));
    const weeks = {};
    lessons.forEach((x) => (weeks[x.id.split(".")[1]] = weeks[x.id.split(".")[1]] || []).push(x));
    const optTests = T.TESTS.map((m) => `<option value="test|${m}">${esc(T.testLabel(m))}</option>`).join("");
    const optLessons = Object.keys(weeks).sort().map((m) => `<optgroup label="${+m.slice(1)}-апта: сабақтар">${weeks[m].map((x) => `<option value="lesson|${x.id}">${esc(x.title)}</option>`).join("")}</optgroup>`).join("");
    const item = (a) => {
      const s = T.summary(a, rows, now);
      const past = a.due_at && Date.parse(a.due_at) < now;
      const per = rows.map((r) => ({ r, x: T.status(a, T.fromRow(r), now) }));
      return `<li class="ao-assign" data-aid="${a.id}">
        <div class="ao-assign-head"><b>${esc(a.title)}</b>
          <span>${a.due_at ? "Мерзімі: " + esc(fmt(a.due_at)) : "Мерзімсіз"}${past ? ' <span class="ao-badge overdue">мерзімі өтті</span>' : ""}</span>
          <span class="ao-assign-sum">Орындады: <b>${s.done + s.late}</b> / ${s.total}${s.late ? ` · кешікті: ${s.late}` : ""}${s.overdue ? ` · мерзімінде орындамады: ${s.overdue}` : ""}</span>
          <span class="ao-assign-acts"><a href="${esc(ROOT + T.href(a))}">Ашу</a>${T.planHref(a) ? ` · <a href="${esc(ROOT + T.planHref(a))}">Сабақ жоспары (ҚМЖ)</a>` : ""} · <button class="ao-link-btn danger" type="button" data-adel="${a.id}">Өшіру</button></span>
        </div>
        ${rows.length ? `<details><summary>Оқушылар бойынша</summary><ul class="ao-assign-st">${per.map(({ r, x }) => `<li><span>${esc(r.display_name || r.email)}</span><span class="ao-badge ${x.state}">${esc(x.label)}${x.score != null ? " · " + x.score + "%" : ""}</span></li>`).join("")}</ul></details>` : ""}
      </li>`;
    };
    el.innerHTML = `<form class="ao-assign-form" data-form="assign">
        <label>Не береміз<select name="what" required><optgroup label="AO17 CS сынақтары">${optTests}</optgroup>${optLessons}</select></label>
        <label>Мерзімі<input type="datetime-local" name="due"></label>
        <button class="btn" type="submit">Тапсырма беру</button>
      </form>
      <p class="ao-hint">Оқушы тапсырманы ашуы үшін сабақ не сынақ «Ашылатын мазмұн» қойындысында ашық болуы керек. Сынақ ${T.PASS}%-дан бастап, сабақ меңгерілгенде орындалды деп саналады.</p>
      ${lessons.length ? "" : '<p class="ao-hint">Сабақтар тізімі мазмұн каталогынан алынады. Каталог бос болса, тек сынақ беруге болады.</p>'}
      <ul class="ao-assign-list" data-alist>${list.length ? list.map(item).join("") : '<li class="ao-empty">Әзірге тапсырма жоқ.</li>'}</ul>`;
    const f = $('[data-form="assign"]', el);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const [kind, target] = f.what.value.split("|");
      const title = kind === "test" ? T.testLabel(target) : (lessons.find((x) => x.id === target) || {}).title || target;
      const due = f.due.value ? new Date(f.due.value).toISOString() : null;
      const { error } = await c.from("ao_assignments").insert({ class_id: k.id, kind, target, title, due_at: due });
      if (error) return msg(out, error.code === "23505" ? "Бұл тапсырма бұл класқа бұрын берілген" : migr(error) ? MIGR : AO.human(error), true);
      msg(out, "Тапсырма берілді ✓");
      paneAssign(k, el, out);
    });
    el.querySelectorAll("[data-adel]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Тапсырманы өшіресіз бе? Оқушылардың прогресі сақталады.")) return;
      const { error } = await c.from("ao_assignments").delete().eq("id", +b.dataset.adel);
      if (error) return msg(out, AO.human(error), true);
      msg(out, "Тапсырма өшірілді ✓");
      paneAssign(k, el, out);
    }));
  }

  // ---------- AO17 CS нәтижелері және пилот есебі (assets/js/ao17-results.js, docs/AO17-CS-PILOT.md) ----------
  async function paneResults(k, el, out) {
    const R = window.AO17Results;
    el.innerHTML = '<p class="ao-empty">Жүктелуде…</p>';
    let rows;
    try { rows = (await AO.rpc("ao_admin_members", { p_class: k.id })) || []; } catch (err) { return msg(out, AO.human(err), true); }
    if (!R) { el.innerHTML = ""; return msg(out, "Нәтиже модулі жүктелмеді: бетті жаңартыңыз", true); }
    if (!rows.length) { el.innerHTML = '<p class="ao-empty">Әзірге оқушы жоқ. Қосылу кодын не шақыру сілтемесін беріңіз.</p>'; return; }
    const S = rows.map(R.ofRow), ms = R.used(rows);
    const avgM = Math.round((S.reduce((n, s) => n + s.mastered, 0) / S.length) * 10) / 10;
    const act = R.active(rows, Date.now(), 7);
    const sum = `Оқушы: <b>${rows.length}</b> · соңғы 7 күнде белсенді: <b>${act}</b> · меңгерілген сабақ, орташа: <b>${avgM}</b>`;
    const grid = ms.length ? `<div class="ao-table-wrap"><table class="ao-table ao-results"><thead><tr><th scope="col">Оқушы</th><th scope="col">Сабақ</th>${ms.map((m) => `<th scope="col" title="${esc(R.label(m))}">${esc(R.short(m))}</th>`).join("")}</tr></thead><tbody>
      ${S.map((s) => `<tr><th scope="row">${esc(s.name)}</th><td>${s.mastered}</td>${ms.map((m) => { const x = s.ex[m]; return `<td>${x ? `${x.best == null ? "-" : x.best + "%"}${x.runs > 1 && x.first != null ? `<small>алғашқы ${x.first}%</small>` : ""}` : "-"}</td>`; }).join("")}</tr>`).join("")}
      </tbody></table></div>` : '<p class="ao-empty">Әзірге AO17 CS сынағын тапсырған оқушы жоқ.</p>';
    const sel = ms.includes(A.pilot) ? A.pilot : ms.includes("p1") ? "p1" : ms[0];
    el.innerHTML = `<p class="ao-hint">AO17 CS сынақтарының нәтижесі оқушының құрылғысынан синхрондалады. Ұяшықта - ең жақсы нәтиже, астында - алғашқы әрекет.</p>
      <p class="ao-results-sum">${sum}</p>
      ${grid}
      <h3>Пилот есебі</h3>
      <p class="ao-hint">Бастапқы деңгей - сынақтың алғашқы әрекеті (пилоттың басында), қорытынды - ең соңғы әрекеті. Есепке екі әрекеті де бар оқушылар кіреді.</p>
      ${ms.length ? `<label class="ao-inline">Сынақ <select data-pilot>${ms.map((m) => `<option value="${m}"${m === sel ? " selected" : ""}>${esc(R.label(m))}</option>`).join("")}</select></label>
      <div data-report></div>
      <p class="ao-inline"><button class="btn ghost" type="button" data-csv>Нәтижелерді CSV-ге жүктеу</button> <button class="btn" type="button" data-print>Пилот есебін басып шығару</button></p>` : ""}`;
    if (!ms.length) return;
    const box = $("[data-report]", el), pick = $("[data-pilot]", el);
    const show = () => { A.pilot = pick.value; box.innerHTML = pilotHtml(R.pilot(rows, pick.value)); };
    pick.addEventListener("change", show);
    show();
    $("[data-csv]", el).addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([R.csv(rows)], { type: "text/csv;charset=utf-8" }));
      a.download = "ao17cs-natizheler.csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
    $("[data-print]", el).addEventListener("click", () => {
      const P = R.pilot(rows, pick.value);
      const w = window.open("", "_blank");
      if (!w) return msg(out, "Терезе ашылмады: браузерде қалқымалы терезеге рұқсат беріңіз", true);
      w.document.write(`<!DOCTYPE html><html lang="kk"><head><meta charset="utf-8"><title>Пилот есебі - ${esc(k.title)}</title>
        <style>body{font:14px/1.5 system-ui,sans-serif;color:#000;margin:24px}h1{font-size:20px;margin:0 0 6px}table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #888;padding:4px 8px;text-align:left}small{display:block;color:#555}.n{color:#444;font-size:12px}</style></head><body>
        <h1>AO17 CS пилот есебі</h1>
        <p>Класс: <b>${esc(k.title)}</b> · ${esc(R.label(P.mode))} · ${esc(new Date().toISOString().slice(0, 10))}</p>
        <p>${sum}</p>
        ${pilotHtml(P)}
        <p class="n">Бастапқы деңгей - сынақтың алғашқы әрекеті, қорытынды - ең соңғы әрекеті. Нормаланған өсім g = (қорытынды − бастапқы) / (100 − бастапқы), сынып орташасы бойынша. Дерек оқушылардың құрылғысынан синхрондалған.</p>
        </body></html>`);
      w.document.close();
      w.focus();
      w.print();
    });
  }
  function pilotHtml(P) {
    const v = (x) => (x == null ? "-" : x + "%");
    const d = (x) => (x == null ? "-" : (x > 0 ? "+" : "") + x);
    const took = P.per.filter((p) => p.runs > 0);
    const head = P.both
      ? `<p data-pilot-sum>Екі әрекеті де бар оқушы: <b>${P.both}</b> / ${P.n}. Орташа: <b>${P.pre}%</b> → <b>${P.post}%</b> (айырма ${d(P.delta)}). Нормаланған өсім: <b>${P.g == null ? "-" : P.g}</b>.</p>`
      : '<p data-pilot-sum>Әзірге екі әрекеті де бар оқушы жоқ: пилоттың басында және соңында осы сынақты тапсыруды сұраңыз.</p>';
    return head + (took.length ? `<div class="ao-table-wrap"><table class="ao-table ao-pilot"><thead><tr><th scope="col">Оқушы</th><th scope="col">Бастапқы</th><th scope="col">Қорытынды</th><th scope="col">Айырма</th><th scope="col">Әрекет</th></tr></thead><tbody>
      ${took.map((p) => `<tr><th scope="row">${esc(p.name)}</th><td>${v(p.pre)}</td><td>${v(p.post)}</td><td>${d(p.delta)}</td><td>${p.runs}</td></tr>`).join("")}</tbody></table></div>` : "");
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
      ${p.role === "admin" || p.role === "teacher" ? '<p><a class="btn" href="admin.html">Мұғалім панеліне өту</a></p>' : ""}
      <div class="ao-card"><h2>Класқа қосылу</h2>
        <form class="ao-inline" data-form="join"><input name="code" placeholder="8 таңбалы код" maxlength="32" autocomplete="off" required aria-label="Қосылу коды"><button class="btn gold" type="submit">Қосылу</button></form>
        <p class="ao-msg" role="status" aria-live="polite" data-jmsg></p></div>
      <div class="ao-card"><h2>Менің тапсырмаларым</h2><div data-assign><p class="ao-empty">Жүктелуде…</p></div></div>
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
      // тапсырмалар бөлек: дерекқор әлі жаңартылмаса да кластар мен мазмұн көрінеді
      const asgP = AO.rpc("ao_my_assignments").catch(() => null);
      const [cls, acc] = await Promise.all([AO.rpc("ao_my_classes"), AO.rpc("ao_my_access")]).catch((e) => { msg(jm, AO.human(e), true); return [[], []]; });
      myAssignments(await asgP);
      $("[data-my]", page).innerHTML = (cls || []).length ? cls.map((k) => `<li><b>${esc(k.title)}</b><span>қосылған: ${esc(fmt(k.joined_at))}</span></li>`).join("") : '<li class="ao-empty">Әзірге ешбір класта емессіз. Мұғалім берген кодты жоғарыға енгізіңіз.</li>';
      const by = {};
      (acc || []).forEach((x) => (by[x.course] = by[x.course] || []).push(x));
      $("[data-access]", page).innerHTML = Object.keys(by).length ? Object.keys(by).map((cid) => `<details class="ao-course" open><summary><b>${esc(cname(cid))}</b> <small>${by[cid].length} бет</small></summary>
        <ul class="ao-pages">${by[cid].map((x) => `<li><a href="${esc(ROOT + x.path)}">${esc(x.title || x.path)}</a></li>`).join("")}</ul></details>`).join("")
        : '<p class="ao-empty">Мұғалім әзірге ештеңе ашпаған.</p>';
    }
  }

  // Оқушының тапсырмалары: күйі осы құрылғыдағы прогрестен (бұлттан тартылған) - assets/js/ao17-assign.js
  function myAssignments(asg) {
    const T = window.AO17Assign, box = $("[data-assign]", page);
    if (!box) return;
    if (!T || asg == null) { box.innerHTML = '<p class="ao-empty">Тапсырмалар әзірге қолжетімсіз.</p>'; return; }
    if (!asg.length) { box.innerHTML = '<p class="ao-empty">Әзірге тапсырма жоқ.</p>'; return; }
    let ls = null;
    try { ls = window.localStorage; } catch (e) { ls = null; }
    const data = T.fromLocal(ls), now = Date.now();
    box.innerHTML = `<ul class="ao-assign-my">${asg.filter(T.valid).map((a) => { const s = T.status(a, data, now); return `<li class="ao-assign-row ${s.state}">
        <a href="${esc(ROOT + T.href(a))}"><b>${esc(a.title)}</b></a>
        <span>${esc(a.class_title || "")} · ${a.due_at ? "мерзімі " + esc(fmt(a.due_at)) : "мерзімсіз"}</span>
        <span class="ao-badge ${s.state}">${esc(s.label)}${s.score != null ? " · " + s.score + "%" : ""}</span></li>`; }).join("")}</ul>`;
  }

  ({ login: renderLogin, admin: renderAdmin, student: renderStudent })[kind]?.();
})();
