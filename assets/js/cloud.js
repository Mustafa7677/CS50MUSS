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
      p_id: K.profile().id, p_secret: s.secret, p_name: snap.n, p_class: s.cls || null,
      p_data: snap.d, p_summary: K.summary(snap.n),
    }, keepalive);
    setState({ hash: fp, at: Date.now(), cls: r.class_code, clsTitle: r.class_title, err: null });
    document.dispatchEvent(new CustomEvent("cs50kz:synced"));
    return r;
  }

  async function pull() {
    const s = state();
    const X = await sync();
    const r = await rpc("cs50kz_pull", { p_id: K.profile().id, p_secret: s.secret });
    const res = X.applyData({ v: 1, id: r.id, n: r.name, d: r.data || {} });
    setState({ pulled: Date.now(), cls: r.class_code, clsTitle: r.class_title, err: null });
    return res;
  }

  // Толық айналым: бұлттан алу → біріктіру → өзгеріс болса жіберу
  function cycle(opts = {}) {
    if (busy) return busy;
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

  async function enable() {
    setState({ on: true, secret: state().secret || rand(8), hash: null, pulled: Date.now() });
    await cycle({ force: true, throw: true });
    K.mark && K.mark("cloud");
  }
  async function login(id, secret) {
    id = id.trim().toUpperCase(); secret = secret.replace(/[\s-]/g, "").toUpperCase();
    if (!/^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(id) || !/^[0-9A-Z]{8}$/.test(secret)) throw new Error("ID (KZ-XXXX-XXXX) не 8 таңбалы код дұрыс емес");
    const r = await rpc("cs50kz_pull", { p_id: id, p_secret: secret });
    const prof = K.profile();
    if (prof.id !== id) { prof.prev = (prof.prev || []).concat(prof.id); prof.id = id; put("cs50kz:profile", prof); }
    setState({ on: true, secret, hash: null });
    const X = await sync();
    X.applyData({ v: 1, id: r.id, n: r.name, d: r.data || {} });
    setState({ pulled: Date.now(), cls: r.class_code, clsTitle: r.class_title });
    await push(true);
    K.mark && K.mark("cloud");
    K.check && K.check();
  }
  function disconnect() { const s = state(); put(ST, { on: false, lastId: K.profile().id, cls: s.cls || null }); }

  // Автоматты: бет ашылғанда, әр 45 секунд сайын (өзгеріс болса) және бет жабылғанда
  if (state().on) {
    setTimeout(() => cycle({ quiet: false }), 1200);
    setInterval(() => document.visibilityState === "visible" && cycle({ quiet: true }), 45_000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") push(false, true).catch(() => {}); });
  }
  document.addEventListener("cs50kz:cloud-login", () => cycle({ pull: true, force: true }));

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
        <div class="cl-class">${s.cls
          ? `<span>🏫 Сынып: <b>${esc(s.clsTitle || s.cls)}</b> <code>${esc(s.cls)}</code></span><button type="button" class="btn secondary cl-leave">Сыныптан шығу</button>`
          : `<input class="cl-code" maxlength="6" placeholder="Сынып коды (мұғалімнен)" autocapitalize="characters" spellcheck="false" aria-label="Сынып коды"><button type="button" class="btn gold cl-join">Сыныпқа қосылу</button>`}</div>
        <div class="pf-actions"><button type="button" class="btn secondary cl-now">↻ Қазір синхрондау</button><button type="button" class="btn secondary cl-off">Бұл құрылғыда өшіру</button></div>
        <p class="cl-msg"></p>`;
    };
    const msg = (t, bad) => { const m = box.querySelector(".cl-msg"); if (m) { m.textContent = t; m.className = "cl-msg " + (bad ? "bad" : "ok"); } };
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
            qr.addData(K.ROOT_URL.replace(/^file:.*/, "https://mustafa7677.github.io/CS50MUSS/") + `profile.html#login=${K.profile().id}.${s.secret}`);
            qr.make();
            q.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) + `<p class="pf-small">Жаңа телефонның камерасымен сканерлеңіз.</p>`;
          }
        } else if (t.classList.contains("cl-join")) {
          const code = box.querySelector(".cl-code").value.trim().toUpperCase();
          const info = await rpc("cs50kz_class_info", { p_code: code });
          if (!info) return msg("Мұндай сынып коды жоқ. Мұғаліміңізден қайта сұраңыз.", true);
          if (!confirm(`«${info.title}» сыныбына қосылу керек пе? Мұғалім атыңыз бен прогресіңізді көреді.`)) return;
          setState({ cls: info.code, clsTitle: info.title });
          await push(true); render(); msg("✓ Сыныпқа қосылдыңыз!");
        } else if (t.classList.contains("cl-leave")) {
          if (!confirm("Сыныптан шығу керек пе? Мұғалім бұдан былай сізді көрмейді.")) return;
          await rpc("cs50kz_leave_class", { p_id: K.profile().id, p_secret: s.secret });
          setState({ cls: null, clsTitle: null, hash: null }); render();
        } else if (t.classList.contains("cl-now")) {
          t.disabled = true; await cycle({ pull: true, force: true, throw: true }); render(); msg("✓ Синхрондалды");
        } else if (t.classList.contains("cl-off")) {
          if (!confirm("Бұл құрылғыда бұлтты өшіру керек пе? Деректер бұлтта қалады, кейін ID мен кодпен қайта кіре аласыз.")) return;
          disconnect(); render();
        }
      } catch (err) {
        render(); msg("Қате: " + human(err), true);
      }
    });
    document.addEventListener("cs50kz:synced", () => { if (!box.contains(document.activeElement)) render(); });
    render();
    // QR арқылы ашылған кіру сілтемесі: #login=ID.SECRET
    const m = location.hash.match(/login=(KZ-[0-9A-Z]{4}-[0-9A-Z]{4})\.([0-9A-Z]{8})/);
    if (m) {
      history.replaceState(null, "", location.pathname);
      if (confirm(`${m[1]} ретінде кіріп, прогресті осы құрылғыда жалғастыру керек пе?`)) {
        login(m[1], m[2]).then(() => { render(); msg("✓ Кірдіңіз. Прогресс осы құрылғыға біріктірілді."); }).catch((err) => { render(); msg("Қате: " + human(err), true); });
      }
    }
  }

  // ---------- Мұғалімнің жанды кестесі ----------
  function teacherPanel(box) {
    let cur = null, timer = null;
    const classes = () => get(TC, []);
    const saveClass = (c) => { const l = classes().filter((x) => x.code !== c.code); l.unshift(c); put(TC, l.slice(0, 10)); };
    const ORDER = K.ORDER || [];
    const start = () => {
      clearInterval(timer);
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
      cur = { code: v.code, title: v.title, pw };
      saveClass(cur);
      show(v);
      clearInterval(timer);
      timer = setInterval(() => document.visibilityState === "visible" && refresh(), 30_000);
    }
    async function refresh() {
      try { show(await rpc("cs50kz_class_view", { p_code: cur.code, p_teacher_secret: cur.pw })); }
      catch (e) { const st = box.querySelector(".cl-live"); if (st) st.textContent = "⚠ " + human(e); }
    }
    function show(v) {
      const rows = v.students.map((st) => {
        const d = st.summary || {}, r = (d.r || "").padEnd(12, "0");
        const qs = (d.q || "").split(",").filter(Boolean).map((x) => x.split("/").map(Number));
        const qpct = qs.length ? Math.round((qs.reduce((n, x) => n + x[0], 0) / Math.max(1, qs.reduce((n, x) => n + x[1], 0))) * 100) + "%" : "—";
        const fresh = Date.now() - new Date(st.updated_at).getTime() < 10 * 60_000;
        return `<tr><td><b>${esc(st.name || "Аты жоқ")}</b><small class="t-id">${esc(st.id)}</small></td>
          <td><div class="t-cells">${r.split("").map((c, i) => `<i class="${c === "1" ? "on" : ""}" title="${ORDER[i] || ""}"></i>`).join("")}</div><small>${(r.match(/1/g) || []).length}/12</small></td>
          <td>${qpct}</td><td>${+d.t || 0}</td><td>${d.e != null ? `<b class="${d.e >= 70 ? "t-pass" : ""}">${+d.e}%</b>` : "—"}</td><td>🏅 ${+d.a || 0}</td>
          <td><span class="cl-dot ${fresh ? "on" : ""}"></span>${ago(st.updated_at)}</td>
          <td><button type="button" class="t-del cl-rm" data-id="${esc(st.id)}" aria-label="Сыныптан шығару">✕</button></td></tr>`;
      }).join("");
      box.innerHTML = `
        <div class="cl-head"><h3>🏫 ${esc(v.title)}</h3><span class="cl-live">● Жанды · әр 30 секунд сайын жаңарады</span></div>
        <div class="cl-bigcode"><small>Сынып коды — оқушыларға беріңіз</small><b>${esc(v.code)}</b></div>
        <div class="t-actions"><button type="button" class="btn secondary cl-refresh">↻ Жаңарту</button><button type="button" class="btn secondary cl-csv">CSV</button><button type="button" class="btn secondary cl-back">← Сыныптар</button><span class="t-count">${v.students.length} оқушы</span></div>
        <div class="t-table"><table><thead><tr><th>Оқушы</th><th>Лекциялар</th><th>Тест</th><th>Тапсырма</th><th>Емтихан</th><th>Жетістік</th><th>Белсенділік</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="8" class="t-empty">Әзірге ешкім қосылмаған. Оқушылар профиль бетінде <b>${esc(v.code)}</b> кодын енгізуі керек.</td></tr>`}</tbody></table></div>`;
      box._last = v;
    }
    box.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, data = Object.fromEntries(new FormData(f));
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
