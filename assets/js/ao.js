/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
// AO17 жабық платформа: аккаунт, сессия, жабық мазмұнды алу, прогресті синхрондау.
// Қауіпсіздік браузерде ЕМЕС: рұқсатты дерекқор (RLS + ao_can_view) мен ao-content функциясы шешеді.
// Бұл файл тек ыңғайлы интерфейс: оны өзгерту ешкімге жабық мазмұнды ашпайды.
(function () {
  if (window.AO) return;   // бет тегі мен main.js екеуі де қосса - бір рет
  const CFG = {
    url: "https://fuzkjjfpknnpauykzfip.supabase.co",
    key: "sb_publishable_Pc_d_L6MuzJI8_Ugs3QZ1Q_LqnRfzk_",
    adminDomain: "admin.ao17.local",   // «mustafa_admin» логині → mustafa_admin@admin.ao17.local
  };
  const FN = CFG.url + "/functions/v1/ao-content?path=";
  // Сайт түбірі: ao.js-тің өз мекенжайынан (кез келген тереңдіктегі беттен дұрыс)
  const ROOT = document.currentScript ? document.currentScript.src.replace(/assets\/js\/ao\.js.*$/, "") : ((window.CS50KZ && window.CS50KZ.ROOT_URL) || new URL(".", location.href).href);
  const root = () => ROOT;

  let clientP = null;
  function loadVendor() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = root() + "assets/vendor/supabase/supabase.js";
      s.onload = ok; s.onerror = () => fail(new Error("supabase.js жүктелмеді"));
      document.head.appendChild(s);
    });
  }
  function client() {
    return (clientP = clientP || loadVendor().then(() =>
      window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "ao17:auth" } })));
  }
  // Сессия бар ма - желісіз, тез тексеру (localStorage)
  function hasSession() { try { return !!localStorage.getItem("ao17:auth"); } catch (e) { return false; } }

  const loginToEmail = (s) => { s = String(s || "").trim(); return s.includes("@") ? s.toLowerCase() : s.toLowerCase() + "@" + CFG.adminDomain; };

  function human(e) {
    const m = (e && (e.message || e.error_description || e.error)) || String(e);
    if (/Invalid login credentials/i.test(m)) return "Логин не құпиясөз қате";
    if (/Email not confirmed/i.test(m)) return "Email әлі расталмаған: поштаңыздағы хатты ашыңыз";
    if (/already registered|already exists/i.test(m)) return "Бұл email тіркелген - кіріңіз";
    if (/Password should be|weak/i.test(m)) return "Құпиясөз тым әлсіз: кемінде 10 таңба, әріп пен сан";
    if (/rate limit|too many/i.test(m)) return "Тым көп әрекет - бір минуттан кейін қайталаңыз";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Интернет жоқ";
    if (/код қате/.test(m)) return "Код не сілтеме қате";
    if (/қосылу жабық/.test(m)) return "Бұл класқа қосылу қазір жабық";
    if (/тек әкімші/.test(m)) return "Бұл әрекет тек әкімшіге рұқсат";
    return m;
  }

  async function session() { const c = await client(); const { data } = await c.auth.getSession(); return data.session; }
  async function me() {
    const c = await client(); const s = await session(); if (!s) return null;
    const { data, error } = await c.from("ao_profiles").select("id,email,display_name,role,must_change_password").eq("id", s.user.id).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function signIn(login, password) {
    const c = await client();
    const { error } = await c.auth.signInWithPassword({ email: loginToEmail(login), password });
    if (error) throw error;
    return me();
  }
  async function signUp(email, password, name) {
    const c = await client();
    const back = new URL("login.html", root()).href;
    const { data, error } = await c.auth.signUp({ email: String(email).trim().toLowerCase(), password, options: { data: { display_name: String(name || "").trim().slice(0, 80) }, emailRedirectTo: back } });
    if (error) throw error;
    return data;   // data.session null болса - email растау керек
  }
  async function signOut() { const c = await client(); await c.auth.signOut(); try { localStorage.removeItem("ao17:auth"); } catch (e) {} }
  async function rpc(fn, args) { const c = await client(); const { data, error } = await c.rpc(fn, args || {}); if (error) throw error; return data; }

  // Жабық файлды алу: 200 - мәтін; 401 - кіру керек; 403 - ашылмаған
  async function fetchGated(path) {
    const s = await session();
    if (!s) { const e = new Error("login"); e.status = 401; throw e; }
    const res = await fetch(FN + encodeURIComponent(path), { headers: { Authorization: "Bearer " + s.access_token, apikey: CFG.key } });
    if (!res.ok) { const e = new Error(res.status === 403 ? "closed" : res.status === 401 ? "login" : "HTTP " + res.status); e.status = res.status; throw e; }
    return res.text();
  }
  const blobCache = {};
  function gatedScriptUrl(path) {
    return (blobCache[path] = blobCache[path] || fetchGated(path).then((js) => URL.createObjectURL(new Blob([js], { type: "text/javascript" }))));
  }

  // ---------- прогресс: құрылғыдағы localStorage ⇄ ao_progress ----------
  let pushT = null, lastHash = null;
  async function pushProgress() {
    const S = window.CS50KZ_SYNC; if (!S) return;
    const s = await session(); if (!s) return;
    const snap = S.snapshot(false), summary = S.summary();
    const body = JSON.stringify([snap.d, summary]);
    if (body === lastHash) return;
    const c = await client();
    const { error } = await c.from("ao_progress").upsert({ user_id: s.user.id, snapshot: snap, summary, updated_at: new Date().toISOString() });
    if (!error) lastHash = body;
  }
  async function pullProgress() {
    const S = window.CS50KZ_SYNC; const s = await session(); if (!S || !s) return;
    const c = await client();
    const { data } = await c.from("ao_progress").select("snapshot").eq("user_id", s.user.id).maybeSingle();
    if (data && data.snapshot && data.snapshot.d) S.applyData(data.snapshot);
  }
  async function startSync() {
    if (!hasSession() || startSync.on) return;
    startSync.on = true;
    const K = window.CS50KZ;
    if (!window.CS50KZ_SYNC && K && K.loadScript) await K.loadScript("assets/js/profile.js").catch(() => {});
    try { if (!sessionStorage.getItem("ao17:pulled")) { await pullProgress(); sessionStorage.setItem("ao17:pulled", "1"); } } catch (e) {}
    const later = () => { clearTimeout(pushT); pushT = setTimeout(() => pushProgress().catch(() => {}), 4000); };
    document.addEventListener("cs50kz:week", later);
    setInterval(() => pushProgress().catch(() => {}), 60000);   // өзгеріс болмаса - ештеңе жібермейді (hash)
    window.addEventListener("pagehide", () => pushProgress().catch(() => {}));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") pushProgress().catch(() => {}); });
    later();
  }

  window.AO = { CFG, client, session, me, hasSession, signIn, signUp, signOut, rpc, fetchGated, gatedScriptUrl, pushProgress, pullProgress, startSync, human, loginToEmail };
})();
