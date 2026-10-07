// CS50 қазақша — бұлттық синхрондау (Supabase).
// Оқушы: ID + 8 таңбалы кіру коды → кез келген құрылғыда прогресс өзі жалғасады.
// Мұғалім: сынып коды + құпиясөз → сыныптың жанды кестесі.
// Деректер тек supabase/schema.sql-дегі қорғалған функциялар арқылы жазылады/оқылады.

(function () {
  const K = window.CS50KZ;
  const esc = K.escapeHtml;
  const API = "https://fuzkjjfpknnpauykzfip.supabase.co/rest/v1/rpc/";
  const KEY = "sb_publishable_Pc_d_L6MuzJI8_Ugs3QZ1Q_LqnRfzk_";
  const ST = "cs50kz:cloud", TC = "cs50kz:tclasses";
  const ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const state = () => get(ST, {});
  const setState = (patch) => { const s = Object.assign(state(), patch); put(ST, s); return s; };
  const rand = (n) => { const r = new Uint8Array(n); crypto.getRandomValues(r); return [...r].map((x) => ABC[x % ABC.length]).join(""); };
  const ago = (t) => {
    if (!t) return "—";
    const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
    if (s < 60) return "жаңа ғана";
    if (s < 3600) return Math.floor(s / 60) + " мин бұрын";
    if (s < 86400) return Math.floor(s / 3600) + " сағ бұрын";
    return Math.floor(s / 86400) + " күн бұрын";
  };

  async function rpc(fn, args, keepalive) {
    const res = await fetch(API + fn, {
      method: "POST", keepalive: !!keepalive,
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    const txt = await res.text();
    let j = null;
    try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!res.ok) {
      const e = new Error((j && j.message) || "HTTP " + res.status);
      e.code = j && j.code;
      e.auth = e.code === "28000";
      throw e;
    }
    return j;
  }
  // Сайттың жария мекенжайы (файлдан ашылса да QR нағыз сайтқа апарсын)
  const siteUrl = (path) => K.ROOT_URL.replace(/^file:.*/, "https://mustafa7677.github.io/CS50MUSS/") + path;
  const human = (e) => e.auth ? "ID не код қате" : e.code === "PGRST202" || /Could not find the function/i.test(e.message) ? "бұлт әлі бапталмаған — кейінірек қайталаңыз" : /Failed to fetch|NetworkError|Load failed/i.test(e.message) ? "интернет жоқ" : e.message;

  let S = null; // profile.js біріктіру функциялары
  const sync = async () => (S = S || (await K.loadScript("assets/js/profile.js"), window.CS50KZ_SYNC));

  // ---------- Синхрондау қозғалтқышы ----------
  let busy = null;
  function fingerprint(snap) {
    const s = state();
    return JSON.stringify([snap.d, snap.n, s.cls || null]).length + ":" + simpleHash(JSON.stringify([snap.d, snap.n, s.cls || null]));
  }
  function simpleHash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return h; }

  async function push(force, keepalive) {
    const s = state();
    if (!s.on || !s.secret) return null;
    const X = await sync();
    const snap = X.snapshot(false);
    delete snap.c;
    const fp = fingerprint(snap);
    if (!force && fp === s.hash) return null;
    const r = await rpc("cs50kz_push", {
      // Сынып кодын тек оқушы өзі қосылған сәтте жібереміз: әйтпесе мұғалім шығарған оқушыны ескі кэш қайта қосып жібереді
      p_id: K.profile().id, p_secret: s.secret, p_name: snap.n, p_class: s.joining ? s.cls : null,
      p_data: snap.d, p_summary: K.summary(snap.n),
    }, keepalive);
    setState({ hash: fp, at: Date.now(), cls: r.class_code, clsTitle: r.class_title, task: r.class_task || null, joining: false, err: null });
    document.dispatchEvent(new CustomEvent("cs50kz:synced"));
    return r;
  }

  async function pull() {
    const s = state();
    const X = await sync();
    const r = await rpc("cs50kz_pull", { p_id: K.profile().id, p_secret: s.secret });
    const res = X.applyData({ v: 1, id: r.id, n: r.name, d: r.data || {} });
    const now = state();
    setState({ pulled: Date.now(), cls: now.joining ? now.cls : r.class_code, clsTitle: now.joining ? now.clsTitle : r.class_title, task: now.joining ? now.task : r.class_task || null, err: null });
    return res;
  }

  // Толық айналым: бұлттан алу → біріктіру → өзгеріс болса жіберу
  function cycle(opts = {}) {
    // Жүріп жатқан айналым ескі күймен басталған болуы мүмкін: маңызды шақыру оны күтіп, қайта жүреді
    if (busy) return opts.force || opts.throw ? busy.catch(() => {}).then(() => cycle(opts)) : busy;
    busy = (async () => {
      const s = state();
      if (!s.on || !s.secret) return;
      try {
        if (opts.pull || Date.now() - (s.pulled || 0) > 60_000) {
          try {
            const r = await pull();
            if (r && r.n && !opts.quiet) K.toast && K.toast("☁️ Басқа құрылғыдағы прогресс қосылды");
          } catch (e) {
            if (!(e.auth && !s.at)) throw e; // жаңа ID: бұлтта әлі жоқ — бірінші push тіркейді
          }
        }
        await push(opts.force);
        document.dispatchEvent(new CustomEvent("cs50kz:synced"));
      } catch (e) {
        setState({ err: human(e) });
        document.dispatchEvent(new CustomEvent("cs50kz:synced"));
        if (opts.throw) throw e;
      }
    })().finally(() => (busy = null));
    return busy;
  }

  // Бұлтты қосу (профильдегі батырма не сынып сілтемесі). Бұл ID бұлтта басқа кодпен бұрыннан бар болса —
  // жаңа код ойлап таппаймыз, бұлтты қайта өшіріп, «Кіру» арқылы бұрынғы кодты сұраймыз.
  async function activate(patch = {}) {
    const st = state();
    setState(Object.assign({ on: true, secret: st.secret || rand(8), hash: null, pulled: st.on ? st.pulled : Date.now() }, patch));
    try {
      await cycle({ force: true, throw: true });
    } catch (e) {
      if (e.auth) {
        setState({ on: false, joining: false, lastId: K.profile().id });
        throw new Error("бұл ID бұлтта бұрыннан бар. Төмендегі «Кіру» арқылы бұрынғы кіру кодыңызды енгізіңіз");
      }
      throw e;
    }
    startAuto();
    K.mark && K.mark("cloud");
  }
  const enable = () => activate();
  async function login(id, secret) {
    id = id.trim().toUpperCase(); secret = secret.replace(/[\s-]/g, "").toUpperCase();
    if (!/^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(id) || !/^[0-9A-Z]{8}$/.test(secret)) throw new Error("ID (KZ-XXXX-XXXX) не 8 таңбалы код дұрыс емес");
    const r = await rpc("cs50kz_pull", { p_id: id, p_secret: secret });
    const prof = K.profile();
    if (prof.id !== id) { prof.prev = (prof.prev || []).concat(prof.id); prof.id = id; put("cs50kz:profile", prof); }
    setState({ on: true, secret, hash: null });
    const X = await sync();
    X.applyData({ v: 1, id: r.id, n: r.name, d: r.data || {} });
    setState({ pulled: Date.now(), cls: r.class_code, clsTitle: r.class_title, task: r.class_task || null });
    await push(true);
    startAuto();
    K.mark && K.mark("cloud");
    K.check && K.check();
  }
  // Өшіргенде кіру кодын сақтаймыз: қайта қосқанда сол ID-мен жалғасады (жаңа код ID-ді құлыптап тастайды)
  function disconnect() { const s = state(); put(ST, { on: false, secret: s.secret || null, lastId: K.profile().id, cls: s.cls || null }); }

  // Автоматты: бет ашылғанда, әр 45 секунд сайын (өзгеріс болса) және бет жабылғанда
  let autoOn = false;
  function startAuto() {
    if (autoOn) return;
    autoOn = true;
    setInterval(() => document.visibilityState === "visible" && state().on && cycle({ quiet: true }), 45_000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && state().on) push(false, true).catch(() => {}); });
  }
  if (state().on) {
    setTimeout(() => cycle({ quiet: false }), 1200);
    startAuto();
  }
  document.addEventListener("cs50kz:cloud-login", () => cycle({ pull: true, force: true }));

  // ---------- Мұғалім тапсырмасы ----------
  const LEC = () => window.CS50KZ_LECTURES || [];
  K.loadScript("assets/data/lectures.js").then(() => document.dispatchEvent(new CustomEvent("cs50kz:lectures"))).catch(() => {});
  const lecName = (id) => { const l = LEC().find((x) => x.id === id); return l ? `${l.num}: ${l.title}` : id; };
  function dueText(due) {
    if (!due) return "";
    // Күнтізбелік күн: бүгін мен мерзімнің арасы (уақытқа емес, күнге қараймыз)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(due + "T00:00:00") - today) / 86_400_000);
    const d = new Date(due + "T12:00:00");
    const months = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
    const when = `${d.getDate()} ${months[d.getMonth()]}`;
    if (days > 1) return `${when} дейін · ${days} күн қалды`;
    if (days === 1) return `${when} дейін · ертең соңғы күн`;
    if (days === 0) return `${when} · бүгін соңғы күн`;
    return `${when} · мерзімі өтті`;
  }
  function taskBanner(s) {
    const t = s && s.on && s.cls && s.task;
    if (!t || !t.lecture) return "";
    let read = false;
    try { read = !!(JSON.parse(localStorage.getItem("cs50kz:progress")) || {}).read?.[t.lecture]; } catch (e) {}
    const l = LEC().find((x) => x.id === t.lecture);
    return `<div class="tk-banner ${read ? "done" : ""}">
      <span class="tk-ico">${read ? "✅" : "📌"}</span>
      <div><small>${esc(s.clsTitle || "Сынып")} · мұғалім тапсырмасы</small>
        <b>${esc(lecName(t.lecture))}</b>
        <span class="tk-meta">${read ? "Орындалды — жарайсыз!" : esc(dueText(t.due) || "Мерзімі көрсетілмеген")}${t.note ? " · " + esc(t.note) : ""}</span></div>
      ${read ? "" : `<a class="btn gold" href="${K.ROOT_URL}${l ? l.url : "lectures/" + t.lecture + ".html"}">Оқу →</a>`}
    </div>`;
  }
  // Басты бетте де көрсетеміз (бұлт қосулы, сыныпта, тапсырма бар болса)
  function homeBanner() {
    const host = document.querySelector(".dashboard-wrap");
    if (!host) return;
    let box = document.querySelector(".tk-home");
    const html = taskBanner(state());
    if (!html) { box && box.remove(); return; }
    if (!box) { box = document.createElement("div"); box.className = "tk-home"; host.prepend(box); }
    box.innerHTML = html;
  }
  document.addEventListener("cs50kz:synced", homeBanner);
  document.addEventListener("cs50kz:lectures", homeBanner);
  homeBanner();

  // ---------- Сынып көрінісі (аттарсыз): орның, орташа көрсеткіш, тапсырманы орындағандар ----------
  function pulseCard(s) {
    const p = s.on && s.cls && s.pulse;
    if (!p || !p.size) return "";
    const total = (K.ORDER || []).length || 12;
    const pct = (n) => Math.round((Math.min(n, total) / total) * 100);
    const diff = Math.round((p.my_read - p.avg_read) * 10) / 10;
    const note = p.size < 2 ? "Сыныптастарыңыз қосылғанда салыстыру пайда болады."
      : p.rank === 1 ? "🏆 Сынып көшбасшысысыз! Осы қарқынмен жалғастырыңыз."
      : diff > 0 ? `Сынып орташасынан ${diff} дәріс алдасыз 💪`
      : diff < 0 ? `Сынып орташасына жету үшін тағы ${Math.ceil(-diff)} дәріс оқыңыз 📚`
      : "Сынып орташасы деңгейіндесіз — бір дәріс алға шығарады!";
    return `<div class="cp-card" aria-label="Сыныптағы орның">
      <div class="cp-rank"><small>Сыныптағы орның</small><b>${p.rank}<span>/${p.size}</span></b></div>
      <div class="cp-body">
        <div class="cp-track" role="img" aria-label="Сіз ${p.my_read} дәріс оқыдыңыз, сынып орташасы ${p.avg_read}, ең көбі ${p.max_read}">
          <i class="cp-fill" style="width:${pct(p.my_read)}%"></i>
          <i class="cp-avg ${pct(p.avg_read) < 12 ? "l" : pct(p.avg_read) > 88 ? "r" : ""}" style="left:${pct(p.avg_read)}%"><span>орташа ${p.avg_read}</span></i>
        </div>
        <div class="cp-legend"><span><b>${p.my_read}</b> / ${total} дәріс — сіз</span><span>ең көбі: ${p.max_read}</span></div>
        <p class="cp-note">${note}</p>
        <div class="cp-chips">
          <span>👥 ${p.size} оқушы</span>
          <span>🔥 осы аптада белсенді: ${p.active7}</span>
          ${p.task_done == null ? "" : `<span>📌 тапсырманы орындағандар: ${p.task_done}/${p.size}</span>`}
        </div>
      </div>
    </div>`;
  }
  let pulseAt = 0;
  async function loadPulse(force) {
    const s = state();
    if (!s.on || !s.cls || !s.secret) return;
    if (!force && Date.now() - pulseAt < 60_000) return;
    pulseAt = Date.now();
    try {
      const p = await rpc("cs50kz_class_pulse", { p_id: K.profile().id, p_secret: s.secret });
      setState({ pulse: p || null });
      document.dispatchEvent(new CustomEvent("cs50kz:pulse"));
    } catch (e) { /* бұлт әлі жаңартылмаса — жай көрсетпейміз */ }
  }

  // ---------- Оқушы панелі (профиль беті) ----------
  function studentPanel(box) {
    const render = () => {
      const s = state(), id = K.profile().id;
      if (!s.on) {
        box.innerHTML = `
          <h3>☁️ Бұлтта сақтау</h3>
          <p>Қоссаңыз, прогресіңіз бұлтта сақталады: басқа телефонда <b>ID</b> мен <b>кіру кодын</b> жазсаңыз, бәрі өзі жалғасады. Мұғаліміңіз сынып кодын берсе, ол сіздің нәтижеңізді жанды кестеден көреді. Бұлтқа тек атыңыз бен оқу прогресі жіберіледі.</p>
          <div class="pf-actions"><button type="button" class="btn gold cl-enable">☁️ Бұлтта сақтауды қосу</button></div>
          <details class="cl-login-wrap"${s.lastId ? " open" : ""}><summary>Бұрын басқа құрылғыда қосқанмын — кіру</summary>
            <div class="cl-login">
              <input class="cl-id" placeholder="KZ-XXXX-XXXX" value="${esc(s.lastId || "")}" autocapitalize="characters" spellcheck="false" aria-label="ID">
              <input class="cl-secret" placeholder="Кіру коды: XXXX-XXXX" autocapitalize="characters" spellcheck="false" aria-label="Кіру коды">
              <button type="button" class="btn gold cl-login-btn">Кіру →</button>
            </div>
          </details>
          <p class="cl-msg"></p>`;
        return;
      }
      const sec = s.secret.slice(0, 4) + "-" + s.secret.slice(4);
      box.innerHTML = `
        <div class="cl-head"><h3>☁️ Бұлтта сақталады</h3><span class="cl-status ${s.err ? "bad" : "ok"}">${s.err ? "⚠ " + esc(s.err) : "● Синхрондалған · " + ago(s.at)}</span></div>
        <div class="cl-cred">
          <div><small>ID</small><code>${esc(id)}</code></div>
          <div><small>Кіру коды</small><code class="cl-sec" data-v="${esc(sec)}">••••-••••</code><button type="button" class="cl-eye" aria-label="Кодты көрсету">👁</button></div>
          <button type="button" class="btn secondary cl-copy">Көшіру</button>
          <button type="button" class="btn secondary cl-qr-btn">📱 QR</button>
        </div>
        <div class="cl-qr" hidden></div>
        <p class="pf-small">Жаңа телефонда профиль бетін ашып, «Кіру» арқылы ID мен кодты жазыңыз не QR-ды сканерлеңіз. Кодты ешкімге бермеңіз — мұғалімге тек сынып арқылы көрінесіз.</p>
        ${taskBanner(s)}
        <div class="cl-class">${s.cls
          ? `<span>🏫 Сынып: <b>${esc(s.clsTitle || s.cls)}</b> <code>${esc(s.cls)}</code></span><button type="button" class="btn secondary cl-leave">Сыныптан шығу</button>`
          : `<input class="cl-code" maxlength="6" placeholder="Сынып коды (мұғалімнен)" autocapitalize="characters" spellcheck="false" aria-label="Сынып коды"><button type="button" class="btn gold cl-join">Сыныпқа қосылу</button>`}</div>
        ${pulseCard(s)}
        <div class="pf-actions"><button type="button" class="btn secondary cl-now">↻ Қазір синхрондау</button><button type="button" class="btn secondary cl-off">Бұл құрылғыда өшіру</button></div>
        <p class="cl-msg"></p>`;
    };
    // Хабар автоматты синхрондаудан кейінгі қайта салуда жоғалмасын (8 секунд сақталады)
    let last = null;
    const paint = () => { const m = box.querySelector(".cl-msg"); if (m && last && Date.now() < last.until) { m.textContent = last.t; m.className = "cl-msg " + (last.bad ? "bad" : "ok"); } };
    const msg = (t, bad) => { last = { t, bad, until: Date.now() + 8000 }; paint(); };
    box.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const s = state();
      try {
        if (t.classList.contains("cl-enable")) {
          t.disabled = true; t.textContent = "Қосылуда…";
          await enable(); render(); msg("✓ Бұлт қосылды. ID мен кіру кодын сақтап қойыңыз.");
        } else if (t.classList.contains("cl-login-btn")) {
          t.disabled = true;
          await login(box.querySelector(".cl-id").value, box.querySelector(".cl-secret").value);
          render(); msg("✓ Кірдіңіз. Прогресс осы құрылғыға біріктірілді."); K.celebrate && K.celebrate();
        } else if (t.classList.contains("cl-eye")) {
          const c = box.querySelector(".cl-sec"); c.textContent = c.textContent.includes("•") ? c.dataset.v : "••••-••••";
        } else if (t.classList.contains("cl-copy")) {
          await navigator.clipboard.writeText(`ID: ${K.profile().id}\nКіру коды: ${s.secret.slice(0, 4)}-${s.secret.slice(4)}`).catch(() => {});
          K.toast("Көшірілді ✓");
        } else if (t.classList.contains("cl-qr-btn")) {
          const q = box.querySelector(".cl-qr");
          q.hidden = !q.hidden;
          if (!q.hidden) {
            if (!window.qrcode) await K.loadScript("assets/vendor/qrcode/qrcode.js");
            const qr = window.qrcode(0, "M");
            qr.addData(siteUrl(`profile.html#login=${K.profile().id}.${s.secret}`));
            qr.make();
            q.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) + `<p class="pf-small">Жаңа телефонның камерасымен сканерлеңіз.</p>`;
          }
        } else if (t.classList.contains("cl-join")) {
          const code = box.querySelector(".cl-code").value.trim().toUpperCase();
          const info = await rpc("cs50kz_class_info", { p_code: code });
          if (!info) return msg("Мұндай сынып коды жоқ. Мұғаліміңізден қайта сұраңыз.", true);
          if (!confirm(`«${info.title}» сыныбына қосылу керек пе? Мұғалім атыңыз бен прогресіңізді көреді.`)) return;
          setState({ cls: info.code, clsTitle: info.title, joining: true, pulse: null }); pulseAt = 0;
          await cycle({ force: true, throw: true }); render(); msg("✓ Сыныпқа қосылдыңыз!");
        } else if (t.classList.contains("cl-leave")) {
          if (!confirm("Сыныптан шығу керек пе? Мұғалім бұдан былай сізді көрмейді.")) return;
          await rpc("cs50kz_leave_class", { p_id: K.profile().id, p_secret: s.secret });
          setState({ cls: null, clsTitle: null, joining: false, hash: null, pulse: null }); render();
        } else if (t.classList.contains("cl-now")) {
          t.disabled = true; await cycle({ pull: true, force: true, throw: true }); await loadPulse(true); render(); msg("✓ Синхрондалды");
        } else if (t.classList.contains("cl-off")) {
          if (!confirm("Бұл құрылғыда бұлтты өшіру керек пе? Деректер бұлтта қалады, кейін ID мен кодпен қайта кіре аласыз.")) return;
          disconnect(); render();
        }
      } catch (err) {
        render(); msg("Қате: " + human(err), true);
      }
    });
    document.addEventListener("cs50kz:synced", () => { loadPulse(); if (!box.contains(document.activeElement)) { render(); paint(); } });
    document.addEventListener("cs50kz:pulse", () => { if (!box.contains(document.activeElement)) { render(); paint(); } });
    document.addEventListener("cs50kz:lectures", () => { if (!box.contains(document.activeElement)) { render(); paint(); } });
    render();
    loadPulse(true);
    // QR не сілтеме: #login=ID.SECRET не #join=КОД. Бет ашылғанда да, профиль ашық тұрғанда сілтеме басылса да (hashchange)
    const handleHash = () => {
      const m = location.hash.match(/login=(KZ-[0-9A-Z]{4}-[0-9A-Z]{4})\.([0-9A-Z]{8})/);
      if (m) {
        history.replaceState(null, "", location.pathname);
        if (confirm(`${m[1]} ретінде кіріп, прогресті осы құрылғыда жалғастыру керек пе?`)) {
          login(m[1], m[2]).then(() => { render(); msg("✓ Кірдіңіз. Прогресс осы құрылғыға біріктірілді."); }).catch((err) => { render(); msg("Қате: " + human(err), true); });
        }
      }
      // Мұғалім берген сілтеме не QR: #join=СЫНЫП_КОДЫ → бұлт өзі қосылып, оқушы сыныпқа кіреді
      const j = location.hash.match(/join=([2-9A-Za-z]{6})/);
      if (j && !m) {
        history.replaceState(null, "", location.pathname);
        (async () => {
          try {
            const info = await rpc("cs50kz_class_info", { p_code: j[1].toUpperCase() });
            if (!info) return msg("Мұндай сынып коды жоқ. Мұғаліміңізден сілтемені қайта сұраңыз.", true);
            const prog = get("cs50kz:progress", {});
            let name = (prog.name || "").trim();
            if (!name) {
              name = (prompt(`«${info.title}» сыныбына қосыласыз.\nМұғалім сізді тануы үшін аты-жөніңізді жазыңыз:`) || "").trim().slice(0, 40);
              if (!name) return msg("Сыныпқа қосылу үшін аты-жөніңізді жазу керек.", true);
              prog.name = name; put("cs50kz:progress", prog);
            } else if (!confirm(`${name}, «${info.title}» сыныбына қосылу керек пе? Мұғалім атыңыз бен прогресіңізді көреді.`)) return;
            await activate({ cls: info.code, clsTitle: info.title, joining: true });
            render();
            msg(`✓ «${info.title}» сыныбына қосылдыңыз! Енді прогресіңіз мұғалімге өзі көрінеді.`);
            K.celebrate && K.celebrate();
          } catch (err) { render(); msg("Қате: " + human(err), true); }
        })();
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
  }

  // ---------- Мұғалімнің жанды кестесі ----------
  function teacherPanel(box) {
    let cur = null, timer = null, qrOpen = false;
    const classes = () => get(TC, []);
    const saveClass = (c) => { const l = classes().filter((x) => x.code !== c.code); l.unshift(c); put(TC, l.slice(0, 10)); };
    const ORDER = K.ORDER || [];
    const start = () => {
      clearInterval(timer);
      qrOpen = false;
      onlyFlagged = false;
      box.innerHTML = `
        <div class="cl-head"><h3>☁️ Бұлттағы сынып — жанды кесте</h3></div>
        <p>Сынып ашыңыз да, оқушыларға <b>сынып кодын</b> беріңіз. Олар «Профиль» бетінде бұлтты қосып, кодты енгізеді — сол сәттен бастап нәтижелері осында өзі жаңарып тұрады.</p>
        ${classes().length ? `<div class="cl-saved">${classes().map((c) => `<button type="button" class="btn secondary cl-open-saved" data-code="${esc(c.code)}">🏫 ${esc(c.title)} <code>${esc(c.code)}</code></button>`).join("")}</div>` : ""}
        <div class="cl-tforms">
          <form class="cl-new"><b>Жаңа сынып</b><input name="title" maxlength="80" placeholder="Мысалы: 10А информатика" required><input name="pw" type="password" minlength="6" placeholder="Мұғалім құпиясөзі (6+ таңба)" required><button class="btn gold">Сынып ашу</button></form>
          <form class="cl-open"><b>Бар сынып</b><input name="code" maxlength="6" placeholder="Сынып коды" autocapitalize="characters" required><input name="pw" type="password" placeholder="Құпиясөз" required><button class="btn secondary">Ашу</button></form>
        </div>
        <p class="cl-msg"></p>`;
    };
    const msg = (t, bad) => { const m = box.querySelector(".cl-msg"); if (m) { m.textContent = t; m.className = "cl-msg " + (bad ? "bad" : "ok"); } };
    async function open(code, pw) {
      const v = await rpc("cs50kz_class_view", { p_code: code, p_teacher_secret: pw });
      if (!cur || cur.code !== v.code) qrOpen = false; // басқа сыныптың QR-ы өздігінен ашылмасын
      cur = { code: v.code, title: v.title, pw };
      saveClass(cur);
      show(v);
      clearInterval(timer);
      timer = setInterval(() => document.visibilityState === "visible" && refresh(true), 30_000);
    }
    async function refresh(auto) {
      // Мұғалім форманы толтырып жатса, автоматты жаңарту оны өшірмесін
      if (auto && box.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
      try { show(await rpc("cs50kz_class_view", { p_code: cur.code, p_teacher_secret: cur.pw })); }
      catch (e) { const st = box.querySelector(".cl-live"); if (st) st.textContent = "⚠ " + human(e); }
    }
    // Қосылу QR-ы: кесте 30 секунд сайын жаңарса да ашық күйі сақталады
    async function drawQr() {
      const q = box.querySelector(".cl-join-qrbox");
      if (!q || !cur) return;
      q.hidden = !qrOpen;
      const b = box.querySelector(".cl-join-qr");
      if (b) b.textContent = qrOpen ? "✕ QR жабу" : "📱 QR көрсету";
      if (!qrOpen) return;
      if (!window.qrcode) await K.loadScript("assets/vendor/qrcode/qrcode.js");
      const qr = window.qrcode(0, "M"); qr.addData(siteUrl("profile.html#join=" + cur.code)); qr.make();
      q.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }) + `<p><b>${esc(cur.title)}</b> · <code>${esc(cur.code)}</code><br>Телефон камерасымен сканерлеңіз</p>`;
    }

    // Сынып аналитикасы: көрсеткіштер + лекциялар бойынша бағандар (бір серия, бір түс)
    function analytics(list) {
      const n = list.length;
      if (!n) return "";
      const LAB = ORDER.map((id) => (id === "ai" ? "AI" : id.replace("week-", "")));
      const nm = (l) => (l === "AI" ? "AI" : l + "-апта");
      const reads = list.map((st) => (st.summary && st.summary.r ? st.summary.r.padEnd(12, "0") : "0".repeat(12)));
      const perLec = ORDER.map((_, i) => reads.filter((r) => r[i] === "1").length);
      const avgRead = reads.reduce((a, r) => a + (r.match(/1/g) || []).length, 0) / n;
      let qa = 0, qb = 0;
      list.forEach((st) => (st.summary && st.summary.q ? st.summary.q : "").split(",").filter(Boolean).forEach((x) => { const [a, b] = x.split("/").map(Number); qa += a || 0; qb += b || 0; }));
      const examTaken = list.filter((st) => st.summary && st.summary.e != null);
      const examPass = examTaken.filter((st) => st.summary.e >= 70).length;
      const active = list.filter((st) => Date.now() - new Date(st.updated_at).getTime() < 86_400_000).length;
      // Ең үлкен құлдырау: көрші екі лекция арасында оқығандар саны ең көп азайған жер
      let drop = { d: 0, i: -1 };
      for (let i = 1; i < perLec.length; i++) if (perLec[i - 1] - perLec[i] > drop.d) drop = { d: perLec[i - 1] - perLec[i], i };
      const tiles = [
        ["Оқушы", n, ""],
        ["Орташа оқылған", avgRead.toFixed(1), "/ 12 лекция"],
        ["Тест нәтижесі", qb ? Math.round((qa / qb) * 100) + "%" : "—", "орташа"],
        ["Емтиханнан өтті", examPass, `/ ${examTaken.length} тапсырған`],
        ["Белсенді", active, "соңғы 24 сағат"],
      ];
      const cols = perLec.map((c, i) => {
        const pct = n ? (c / n) * 100 : 0;
        return `<button type="button" class="ca-col" style="--h:${pct}%" data-tip="${esc(LAB[i] === "AI" ? "AI лекциясы" : LAB[i] + "-апта")}: ${c} / ${n} оқушы (${Math.round(pct)}%)" aria-label="${esc(LAB[i])}: ${c} оқушы оқыды"><i></i><span>${esc(LAB[i])}</span></button>`;
      }).join("");
      return `<div class="ca">
        <div class="ca-tiles">${tiles.map(([l, v, sub]) => `<div><small>${l}</small><b>${v}</b>${sub ? `<em>${sub}</em>` : ""}</div>`).join("")}</div>
        <figure class="ca-chart">
          <figcaption>Әр лекцияны неше оқушы оқып шықты</figcaption>
          <div class="ca-plot"><div class="ca-axis"><span>${n}</span><span>${n % 2 ? "" : n / 2}</span><span>0</span></div><div class="ca-cols">${cols}</div><div class="ca-tip" hidden></div></div>
          ${drop.i > 0 && drop.d >= Math.max(2, n * 0.2) ? `<p class="ca-insight">⚠ Ең көп тоқтайтын жер: <b>${esc(nm(LAB[drop.i - 1]))} → ${esc(nm(LAB[drop.i]))}</b>. Оқығандар саны: ${perLec[drop.i - 1]} → ${perLec[drop.i]}. Сол лекцияға сабақта көбірек уақыт бөлген жөн.</p>` : ""}
        </figure>
      </div>`;
    }
    // Бағанға апарғанда/фокуста түсініктеме
    const tipOn = (e) => {
      const col = e.target.closest && e.target.closest(".ca-col");
      const tip = box.querySelector(".ca-tip");
      if (!tip) return;
      if (!col) { tip.hidden = true; return; }
      const plot = col.closest(".ca-plot").getBoundingClientRect(), r = col.getBoundingClientRect();
      tip.textContent = col.dataset.tip;
      tip.hidden = false;
      tip.style.left = Math.min(plot.width - 10, Math.max(10, r.left - plot.left + r.width / 2)) + "px";
    };
    box.addEventListener("mouseover", tipOn);
    box.addEventListener("focusin", tipOn);
    box.addEventListener("mouseleave", () => { const tip = box.querySelector(".ca-tip"); if (tip) tip.hidden = true; });

    // Назар аудару керек оқушылар: ұзақ кірмеген не тест нәтижесі төмен
    let onlyFlagged = false;
    function flags(st) {
      const d = st.summary || {}, out = [];
      const days = (Date.now() - new Date(st.updated_at).getTime()) / 86_400_000;
      if (days >= 7) out.push(["😴", Math.floor(days) + " күн кірмеген"]);
      const qs = (d.q || "").split(",").filter(Boolean).map((x) => x.split("/").map(Number));
      const a = qs.reduce((n, x) => n + x[0], 0), b = qs.reduce((n, x) => n + x[1], 0);
      if (qs.length >= 2 && b && a / b < 0.5) out.push(["📉", "тест " + Math.round((a / b) * 100) + "%"]);
      return out;
    }
    // Оқушының жеке картасы: әр лекция бойынша оқу мен тест
    function studentCard(st) {
      const d = st.summary || {}, r = (d.r || "").padEnd(12, "0"), q = (d.q || "").split(",");
      const read = (r.match(/1/g) || []).length;
      const qs = q.filter(Boolean).map((x) => x.split("/").map(Number));
      const qa = qs.reduce((n, x) => n + x[0], 0), qb = qs.reduce((n, x) => n + x[1], 0);
      const LAB = { ai: "AI лекциясы" };
      const lines = ORDER.map((id, i) => {
        const [x, y] = (q[i] || "").split("/").map(Number);
        const pct = y ? Math.round((x / y) * 100) : null;
        return `<li class="${r[i] === "1" ? "on" : ""}"><span class="sc-lec">${LAB[id] || id.replace("week-", "") + "-апта"}</span>
          <span class="sc-read">${r[i] === "1" ? `✓<span class="sc-w"> оқыды</span>` : "—"}</span>
          <span class="sc-quiz">${pct == null ? `<small>тест жоқ</small>` : `<i><em style="width:${pct}%" class="${pct < 50 ? "low" : ""}"></em></i><small>${x}/${y}</small>`}</span></li>`;
      }).join("");
      const m = document.createElement("div");
      m.className = "search-modal open sc-modal";
      m.innerHTML = `<div class="search-box sc-box" role="dialog" aria-modal="true" aria-label="Оқушы картасы">
        <div class="sc-head"><div><h3>${esc(st.name || "Аты жоқ")}</h3><small class="t-id">${esc(st.id)} · соңғы белсенділік: ${ago(st.updated_at)}</small></div><button type="button" class="btn secondary sc-close" aria-label="Жабу">✕</button></div>
        ${flags(st).length ? `<p class="sc-flags">${flags(st).map(([i, t]) => `<span class="cl-flag">${i} ${t}</span>`).join("")}</p>` : ""}
        <div class="sc-tiles">
          <div><small>Лекция</small><b>${read}/12</b></div>
          <div><small>Тест</small><b>${qb ? Math.round((qa / qb) * 100) + "%" : "—"}</b></div>
          <div><small>Тапсырма</small><b>${+d.t || 0}</b></div>
          <div><small>Емтихан</small><b>${d.e != null ? +d.e + "%" : "—"}</b></div>
          <div><small>Жетістік</small><b>${+d.a || 0}</b></div>
          <div><small>Стрик</small><b>🔥 ${+d.s || 0}</b></div>
        </div>
        <ol class="sc-list">${lines}</ol>
      </div>`;
      document.body.appendChild(m);
      const close = () => { m.remove(); document.removeEventListener("keydown", onKey); };
      const onKey = (e) => e.key === "Escape" && close();
      document.addEventListener("keydown", onKey);
      m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".sc-close")) close(); });
      m.querySelector(".sc-close").focus();
    }

    // Сыныпқа тапсырма: форма + орындалу прогресі
    function taskBox(v) {
      const t = v.task || null;
      const idx = t ? ORDER.indexOf(t.lecture) : -1;
      const done = idx < 0 ? [] : v.students.filter((st) => ((st.summary && st.summary.r) || "")[idx] === "1");
      const todo = idx < 0 ? [] : v.students.filter((st) => !done.includes(st));
      const n = v.students.length;
      const opts = LEC().map((l) => `<option value="${l.id}" ${t && t.lecture === l.id ? "selected" : ""}>${esc(l.num + ": " + l.title)}</option>`).join("");
      return `<section class="tk-box">
        <h4>📌 Сыныпқа тапсырма</h4>
        ${t ? `<div class="tk-now">
          <div><b>${esc(lecName(t.lecture))}</b><span class="tk-meta">${esc(dueText(t.due) || "мерзімсіз")}${t.note ? " · " + esc(t.note) : ""}</span></div>
          <div class="tk-prog"><i><em style="width:${n ? (done.length / n) * 100 : 0}%"></em></i><span>${done.length} / ${n} орындады</span></div>
          ${todo.length ? `<p class="tk-todo">Әлі оқымағандар: ${todo.slice(0, 10).map((st) => esc(st.name || st.id)).join(", ")}${todo.length > 10 ? ` және тағы ${todo.length - 10}` : ""}</p>` : n ? `<p class="tk-todo ok">Барлығы орындады 🎉</p>` : ""}
        </div>` : `<p class="pf-small">Тапсырма берілмеген. Лекцияны таңдаңыз — оқушылар оны басты бетте және профильде көреді.</p>`}
        <form class="tk-form">
          <select name="lecture" aria-label="Лекция"><option value="">— лекция таңдаңыз —</option>${opts}</select>
          <input name="due" type="date" aria-label="Мерзімі" value="${t && t.due ? esc(t.due) : ""}">
          <input name="note" maxlength="200" placeholder="Ескертпе (міндетті емес)" aria-label="Ескертпе" value="${t && t.note ? esc(t.note) : ""}">
          <button class="btn gold">${t ? "Жаңарту" : "Тапсырма беру"}</button>
          ${t ? `<button type="button" class="btn secondary tk-clear">Алып тастау</button>` : ""}
        </form>
      </section>`;
    }

    function show(v) {
      const list = onlyFlagged ? v.students.filter((st) => flags(st).length) : v.students;
      const rows = list.map((st) => {
        const d = st.summary || {}, r = (d.r || "").padEnd(12, "0");
        const qs = (d.q || "").split(",").filter(Boolean).map((x) => x.split("/").map(Number));
        const qpct = qs.length ? Math.round((qs.reduce((n, x) => n + x[0], 0) / Math.max(1, qs.reduce((n, x) => n + x[1], 0))) * 100) + "%" : "—";
        const fresh = Date.now() - new Date(st.updated_at).getTime() < 10 * 60_000;
        return `<tr><td><button type="button" class="cl-st" data-id="${esc(st.id)}"><b>${esc(st.name || "Аты жоқ")}</b><small class="t-id">${esc(st.id)}</small></button>${flags(st).map(([ico, t]) => `<span class="cl-flag" title="${t}">${ico} ${t}</span>`).join("")}</td>
          <td><div class="t-cells">${r.split("").map((c, i) => `<i class="${c === "1" ? "on" : ""}" title="${ORDER[i] || ""}"></i>`).join("")}</div><small>${(r.match(/1/g) || []).length}/12</small></td>
          <td>${qpct}</td><td>${+d.t || 0}</td><td>${d.e != null ? `<b class="${d.e >= 70 ? "t-pass" : ""}">${+d.e}%</b>` : "—"}</td><td>🏅 ${+d.a || 0}</td>
          <td><span class="cl-dot ${fresh ? "on" : ""}"></span>${ago(st.updated_at)}</td>
          <td><button type="button" class="t-del cl-rm" data-id="${esc(st.id)}" aria-label="Сыныптан шығару">✕</button></td></tr>`;
      }).join("");
      const flagged = v.students.filter((st) => flags(st).length).length;
      box.innerHTML = `
        <div class="cl-head"><h3>🏫 ${esc(v.title)}</h3><span class="cl-live">● Жанды · әр 30 секунд сайын жаңарады</span></div>
        ${analytics(v.students)}
        ${taskBox(v)}
        <div class="cl-join-box">
          <div class="cl-bigcode"><small>Сынып коды — оқушыларға беріңіз</small><b>${esc(v.code)}</b></div>
          <div class="cl-join-how">
            <b>Оқушылар қалай қосылады?</b>
            <p>Ең оңайы — QR-ды тақтаға шығарыңыз не сілтемені чатқа жіберіңіз: оқушы ашып, атын жазса болды.</p>
            <div class="pf-actions"><button type="button" class="btn gold cl-join-qr">📱 QR көрсету</button><button type="button" class="btn secondary cl-join-copy">🔗 Сілтемені көшіру</button></div>
            <p class="pf-small">Не: Профиль → «☁️ Бұлтта сақтауды қосу» → сынып коды.</p>
          </div>
        </div>
        <div class="cl-join-qrbox" hidden></div>
        <div class="t-actions"><button type="button" class="btn secondary cl-refresh">↻ Жаңарту</button><button type="button" class="btn secondary cl-csv">CSV</button><button type="button" class="btn secondary cl-back">← Сыныптар</button>${flagged ? `<button type="button" class="btn ${onlyFlagged ? "gold" : "secondary"} cl-flagged">⚠ Көмек керек: ${flagged}</button>` : ""}<span class="t-count">${v.students.length} оқушы</span></div>
        <div class="t-table"><table><thead><tr><th>Оқушы</th><th>Лекциялар</th><th>Тест</th><th>Тапсырма</th><th>Емтихан</th><th>Жетістік</th><th>Белсенділік</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="8" class="t-empty">Әзірге ешкім қосылмаған. Оқушылар профиль бетінде <b>${esc(v.code)}</b> кодын енгізуі керек.</td></tr>`}</tbody></table></div>`;
      box._last = v;
      drawQr().catch(() => { const q = box.querySelector(".cl-join-qrbox"); if (q) q.innerHTML = "<p>QR жүктелмеді — сілтемені көшіріп жіберіңіз.</p>"; });
    }
    document.addEventListener("cs50kz:lectures", () => { if (box._last && !box.contains(document.activeElement)) show(box._last); });
    box.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, data = Object.fromEntries(new FormData(f));
      if (f.classList.contains("tk-form")) {
        if (!data.lecture) { K.toast("Алдымен лекцияны таңдаңыз"); return; }
        try {
          await rpc("cs50kz_class_set_task", { p_code: cur.code, p_teacher_secret: cur.pw, p_lecture: data.lecture, p_due: data.due || null, p_note: data.note || "" });
          K.toast("📌 Тапсырма берілді");
          document.activeElement && document.activeElement.blur();
          await refresh();
        } catch (err) { K.toast("Қате: " + human(err)); }
        return;
      }
      try {
        if (f.classList.contains("cl-new")) {
          const c = await rpc("cs50kz_class_create", { p_title: data.title, p_teacher_secret: data.pw });
          await open(c.code, data.pw);
          K.toast("Сынып ашылды: " + c.code);
        } else await open(data.code.trim().toUpperCase(), data.pw);
      } catch (err) { msg("Қате: " + (err.auth ? "сынып коды не құпиясөз қате" : human(err)), true); }
    });
    box.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      try {
        const joinUrl = () => siteUrl("profile.html#join=" + cur.code);
        if (t.classList.contains("cl-join-copy")) {
          try { await navigator.clipboard.writeText(joinUrl()); K.toast("Сілтеме көшірілді ✓"); } catch (er) { prompt("Сілтемені көшіріңіз:", joinUrl()); }
          return;
        }
        if (t.classList.contains("cl-join-qr")) {
          qrOpen = !qrOpen;
          await drawQr();
          return;
        }
        if (t.classList.contains("tk-clear")) {
          if (!confirm("Тапсырманы алып тастау керек пе?")) return;
          await rpc("cs50kz_class_set_task", { p_code: cur.code, p_teacher_secret: cur.pw, p_lecture: "", p_due: null, p_note: "" });
          await refresh();
          return;
        }
        if (t.classList.contains("cl-st") && box._last) {
          const st = box._last.students.find((x) => x.id === t.dataset.id);
          if (st) studentCard(st);
          return;
        }
        if (t.classList.contains("cl-flagged") && box._last) { onlyFlagged = !onlyFlagged; show(box._last); return; }
        if (t.classList.contains("cl-open-saved")) { const c = classes().find((x) => x.code === t.dataset.code); await open(c.code, c.pw); }
        else if (t.classList.contains("cl-refresh")) await refresh();
        else if (t.classList.contains("cl-back")) start();
        else if (t.classList.contains("cl-rm")) {
          if (!confirm("Оқушыны сыныптан шығару керек пе? Оның прогресі өшпейді.")) return;
          await rpc("cs50kz_class_remove", { p_code: cur.code, p_teacher_secret: cur.pw, p_id: t.dataset.id }); await refresh();
        } else if (t.classList.contains("cl-csv") && box._last) {
          const head = ["Аты", "ID", ...ORDER, "Тест", "Тапсырма", "Емтихан", "Жетістік", "Соңғы белсенділік"];
          const lines = [head.join(",")].concat(box._last.students.map((st) => { const d = st.summary || {}; return [JSON.stringify(st.name || ""), st.id, ...(d.r || "").padEnd(12, "0").split(""), JSON.stringify(d.q || ""), +d.t || 0, d.e ?? "", +d.a || 0, st.updated_at].join(","); }));
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" }));
          a.download = `cs50kz-${box._last.code}.csv`; a.click();
        }
      } catch (err) { msg("Қате: " + human(err), true); K.toast && K.toast("Қате: " + human(err)); }
    });
    start();
  }

  window.CS50KZ_CLOUD = { rpc, push, pull, cycle, enable, login, state };
  (async () => {
    if (document.querySelector(".profile")) await sync(); // .pf-cloud орнын profile.js салады
    document.querySelectorAll(".pf-cloud").forEach(studentPanel);
    const t = document.querySelector(".teacher");
    if (t) {
      const anchor = document.getElementById("offline") || t;
      const h = document.createElement("h2");
      h.id = "cloud"; h.textContent = "Бұлттағы сынып";
      const box = document.createElement("section");
      box.className = "pf-box t-cloud";
      anchor.parentNode.insertBefore(h, anchor);
      anchor.parentNode.insertBefore(box, anchor);
      teacherPanel(box);
    }
  })();
})();
