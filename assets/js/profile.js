// CS50 қазақша — Менің профилім: жеке ID, прогресті басқа құрылғыға көшіру (код, QR, файл).
// Деректер біріктіріледі (merge): ешнәрсе өшірілмейді, әр көрсеткіштің ең жақсысы сақталады.
// main.js .profile бар бетте ғана жүктейді.

(function () {
  const K = window.CS50KZ;
  const esc = K.escapeHtml;
  const PREFIX = "KZP1.";

  // ---------- localStorage көмекшілері ----------
  const raw = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const get = (k, d) => { try { return JSON.parse(raw(k)) ?? d; } catch (e) { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const keys = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {} return out; };

  // Прогресс кілттері (QR-ға сыятын «жеңіл» бөлік) және код жобалары (тек файлда)
  const SKIP = new Set(["cs50kz:prefs", "cs50kz:exam-run", "cs50kz:class", "cs50kz:profile", "flask:url", "cs50kz:theme"]);
  const isProgress = (k) => !SKIP.has(k) && (k.startsWith("cs50kz:") || k.startsWith("check:"));
  const isDraft = (k) => !SKIP.has(k) && /^(ag|pg|hp|flask):/.test(k);

  function snapshot(full) {
    const d = {};
    keys().forEach((k) => {
      if (isProgress(k) || (full && isDraft(k))) {
        const v = raw(k);
        try { d[k] = JSON.parse(v); } catch (e) { d[k] = v; }
      }
    });
    const p = K.profile();
    return { v: 1, id: p.id, n: (get("cs50kz:progress", {}).name || ""), t: Date.now(), d };
  }

  // ---------- Сығу (deflate) + base64url ----------
  const b64 = (bytes) => { let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); const bin = atob(s + "===".slice((s.length + 3) % 4)); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); };
  async function pipe(bytes, stream) {
    const out = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
    return new Uint8Array(out);
  }
  async function encode(obj) {
    const json = new TextEncoder().encode(JSON.stringify(obj));
    if ("CompressionStream" in window) return PREFIX + "z" + b64(await pipe(json, new CompressionStream("deflate-raw")));
    return PREFIX + "j" + b64(json);
  }
  async function decode(code) {
    const m = String(code).trim().match(/KZP1\.([zj])([A-Za-z0-9_-]+)/);
    if (!m) throw new Error("KZP1. деп басталатын код табылмады");
    let obj;
    try {
      let bytes = unb64(m[2]);
      if (m[1] === "z") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
      obj = JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { throw new Error("код бүлінген не толық көшірілмеген"); }
    if (!obj || obj.v !== 1 || typeof obj.d !== "object") throw new Error("Код бүлінген");
    return obj;
  }

  // ---------- Біріктіру ережелері ----------
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  const maxNum = (a, b) => Math.max(+a || 0, +b || 0);
  function unionObj(a, b) { return Object.assign({}, b || {}, a || {}); } // бар мәндер сақталады
  function mergeKey(k, mine, theirs) {
    if (mine == null) return theirs;
    if (theirs == null) return mine;
    if (k.startsWith("check:") && Array.isArray(mine) && Array.isArray(theirs)) {
      const n = Math.max(mine.length, theirs.length);
      return Array.from({ length: n }, (_, i) => !!(mine[i] || theirs[i]));
    }
    switch (k) {
      case "cs50kz:progress": {
        const quiz = Object.assign({}, theirs.quiz || {});
        Object.entries(mine.quiz || {}).forEach(([id, q]) => { if (!quiz[id] || (q.best || 0) >= (quiz[id].best || 0)) quiz[id] = q; });
        return { read: unionObj(mine.read, theirs.read), quiz, last: mine.last || theirs.last || null, name: mine.name || theirs.name || "" };
      }
      case "cs50kz:cards": {
        const out = Object.assign({}, theirs);
        Object.entries(mine).forEach(([id, box]) => (out[id] = maxNum(box, out[id])));
        return out;
      }
      case "cs50kz:daily": {
        const base = (theirs.best || 0) > (mine.best || 0) ? theirs : mine;
        return Object.assign({}, base, { best: maxNum(mine.best, theirs.best), streak: maxNum(mine.streak, theirs.streak) });
      }
      case "cs50kz:exam": {
        const seen = new Set(), tries = [];
        [...(theirs.tries || []), ...(mine.tries || [])].forEach((t) => { const s = JSON.stringify(t); if (!seen.has(s)) { seen.add(s); tries.push(t); } });
        const best = Math.max(mine.best ?? -1, theirs.best ?? -1);
        return { best: best < 0 ? null : best, tries: tries.slice(-20) };
      }
      case "cs50kz:week": {
        if (mine.id !== theirs.id) return (mine.id || "") > (theirs.id || "") ? mine : theirs;
        const out = Object.assign({}, mine);
        Object.keys(theirs).forEach((x) => { if (typeof theirs[x] === "number") out[x] = maxNum(mine[x], theirs[x]); });
        out.done = !!(mine.done || theirs.done);
        return out;
      }
      case "cs50kz:mystery": case "cs50kz:mystery2":
        return Object.assign({}, theirs, mine, { solved: !!(mine.solved || theirs.solved), hints: maxNum(mine.hints, theirs.hints), notes: mine.notes || theirs.notes || "", q: mine.q || theirs.q || "" });
    }
    if (typeof mine === "number" || typeof theirs === "number") return maxNum(mine, theirs);
    if (Array.isArray(mine) && Array.isArray(theirs)) return [...new Set([...theirs, ...mine].map((x) => JSON.stringify(x)))].map((x) => JSON.parse(x));
    if (isObj(mine) && isObj(theirs)) return unionObj(mine, theirs);
    return mine; // код жобалары мен мәтіндер: бар нұсқа сақталады
  }

  function summary() {
    const p = get("cs50kz:progress", {});
    let tasks = 0;
    keys().forEach((k) => { if (k.startsWith("check:")) { const a = get(k, []); if (a.length && a.every(Boolean)) tasks++; } });
    const q = Object.values(p.quiz || {});
    return {
      read: Object.keys(p.read || {}).length,
      tasks,
      quiz: q.length ? Math.round((q.reduce((n, x) => n + x.best, 0) / q.reduce((n, x) => n + x.total, 0)) * 100) : null,
      exam: get("cs50kz:exam", {}).best ?? null,
      ach: document.querySelectorAll ? (K.achievements ? K.achievements().filter((a) => a.done).length : null) : null,
    };
  }

  async function importCode(code) {
    const obj = await decode(code);
    const before = summary();
    let n = 0;
    Object.entries(obj.d).forEach(([k, v]) => {
      if (!(isProgress(k) || isDraft(k))) return;
      const merged = mergeKey(k, get(k, null), v);
      if (JSON.stringify(merged) !== raw(k)) { put(k, merged); n++; }
    });
    // ID: бір оқушы — бір ID. Келген кодтың ID-і қабылданады.
    if (/^KZ-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(obj.id || "")) {
      const prof = K.profile();
      if (prof.id !== obj.id) { prof.prev = prof.prev || []; prof.prev.push(prof.id); prof.id = obj.id; }
      prof.synced = Date.now();
      put("cs50kz:profile", prof);
    }
    const p = get("cs50kz:progress", {});
    if (!p.name && obj.n) { p.name = obj.n; put("cs50kz:progress", p); }
    const after = summary();
    K.check && K.check();
    return { n, before, after, from: obj };
  }

  // ---------- Бет ----------
  async function page(el) {
    const prof = K.profile();
    const render = () => {
      const s = summary(), p = get("cs50kz:progress", {});
      el.querySelector(".pf-id").textContent = K.profile().id;
      el.querySelector(".pf-stats").innerHTML = [
        ["📖", `${s.read}/12`, "лекция"], ["✅", s.tasks, "тапсырма"], ["📝", s.quiz != null ? s.quiz + "%" : "—", "тест"],
        ["🎓", s.exam != null ? s.exam + "%" : "—", "емтихан"], ["🏅", s.ach ?? "—", "жетістік"],
      ].map(([i, v, t]) => `<div><span>${i}</span><b>${esc(String(v))}</b><small>${t}</small></div>`).join("");
      const nm = el.querySelector(".pf-name");
      if (document.activeElement !== nm) nm.value = p.name || "";
    };
    el.innerHTML = `
      <div class="pf-card">
        <div class="pf-avatar"><img src="${K.ROOT_URL}assets/img/bota-happy.svg" alt="" width="84" height="84"></div>
        <div class="pf-main">
          <label class="pf-label">Аты-жөніңіз<input class="pf-name" type="text" maxlength="40" placeholder="Мысалы: Аружан Серікқызы" autocomplete="name"></label>
          <div class="pf-idrow"><span class="pf-label">Жеке ID</span><code class="pf-id"></code><button type="button" class="btn secondary pf-copy-id">Көшіру</button></div>
          <p class="pf-note">ID — сіздің оқушы нөміріңіз. Ол мұғалімге жіберілетін кодта да тұрады, сондықтан мұғалім сізді басқа телефоннан жіберсеңіз де таниды.</p>
        </div>
      </div>
      <div class="pf-stats"></div>

      <div class="pf-grid">
        <section class="pf-box">
          <h3>📤 Басқа құрылғыға көшіру</h3>
          <p>Код барлық прогресіңізді (лекциялар, тесттер, тапсырмалар, емтихан, жетістіктер) сақтайды. Жаңа телефонда QR-ды камерамен сканерлеңіз не кодты көшіріп қойыңыз.</p>
          <button type="button" class="btn gold pf-make">Кодты жасау</button>
          <div class="pf-out" hidden>
            <div class="pf-qr"></div>
            <div class="share-code"><code class="pf-code"></code><button type="button" class="btn gold pf-copy">Көшіру</button></div>
            <p class="pf-small">Код ұзын болса, QR орнына оны мессенджермен өзіңізге жіберіңіз.</p>
          </div>
          <hr>
          <p><b>Толық көшірме файлы</b> — прогреспен бірге жазған кодтарыңызды да (сынақ алаңы, автотексеруші, Flask, Homepage) сақтайды.</p>
          <button type="button" class="btn secondary pf-file">⬇ Файлды жүктеп алу</button>
        </section>
        <section class="pf-box">
          <h3>📥 Осы құрылғыда жалғастыру</h3>
          <p>Басқа құрылғыда жасалған кодты қойыңыз не көшірме файлын таңдаңыз. Деректер <b>біріктіріледі</b>: осы құрылғыдағы прогресс өшпейді, әр көрсеткіштің ең жақсысы сақталады.</p>
          <textarea class="pf-in" rows="4" placeholder="KZP1.…" spellcheck="false" aria-label="Прогресс коды"></textarea>
          <div class="pf-actions">
            <button type="button" class="btn gold pf-import">Жалғастыру →</button>
            <label class="btn secondary pf-upload">📄 Файлдан<input type="file" accept=".json,application/json" hidden></label>
          </div>
          <div class="pf-result" aria-live="polite"></div>
        </section>
      </div>

      <section class="pf-box pf-teacher">
        <h3>👩‍🏫 Мұғалімге</h3>
        <p>Мұғалімге қысқа есеп-код жіберіңіз: ол оны <a href="${K.ROOT_URL}teacher.html">мұғалім бетіне</a> қосады. Код ID-ді қамтиды, сондықтан әр жаңа жіберілім сыныптағы сол оқушының жолын жаңартады.</p>
        <button type="button" class="btn secondary share-progress">📤 Мұғалімге жіберу</button>
      </section>`;

    el.querySelector(".pf-name").addEventListener("input", (e) => {
      const p = get("cs50kz:progress", {}); p.name = e.target.value.trim(); put("cs50kz:progress", p);
    });
    const copy = async (t) => { try { await navigator.clipboard.writeText(t); K.toast("Көшірілді ✓"); } catch (e) { K.toast("Көшіру мүмкін болмады"); } };
    el.querySelector(".pf-copy-id").addEventListener("click", () => copy(K.profile().id));

    el.querySelector(".pf-make").addEventListener("click", async () => {
      const code = await encode(snapshot(false));
      const out = el.querySelector(".pf-out");
      out.hidden = false;
      el.querySelector(".pf-code").textContent = code;
      const url = K.ROOT_URL.replace(/^file:.*/, "https://mustafa7677.github.io/CS50MUSS/") + "profile.html#import=" + code;
      const qrBox = el.querySelector(".pf-qr");
      qrBox.innerHTML = "";
      try {
        if (!window.qrcode) await K.loadScript("assets/vendor/qrcode/qrcode.js");
        const qr = window.qrcode(0, "L");
        qr.addData(url);
        qr.make();
        qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch (e) {
        qrBox.innerHTML = `<p class="pf-small">Прогресс тым көп, QR-ға сыймады — кодты не файлды қолданыңыз.</p>`;
      }
      K.mark && K.mark("sync");
    });
    el.querySelector(".pf-copy").addEventListener("click", () => copy(el.querySelector(".pf-code").textContent));
    el.querySelector(".pf-file").addEventListener("click", async () => {
      const blob = new Blob([JSON.stringify({ format: "cs50kz-backup", code: await encode(snapshot(true)) })], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cs50kz-${K.profile().id}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });

    async function doImport(code) {
      const res = el.querySelector(".pf-result");
      try {
        const r = await importCode(code);
        const d = (k) => r.after[k] - r.before[k];
        res.className = "pf-result ok";
        res.innerHTML = `<b>✓ Прогресс біріктірілді.</b> ` +
          (r.n ? `Лекция: ${r.after.read}/12${d("read") ? ` (+${d("read")})` : ""} · тапсырма: ${r.after.tasks}${d("tasks") ? ` (+${d("tasks")})` : ""}` +
            (r.after.exam != null ? ` · емтихан: ${r.after.exam}%` : "") : "Жаңа дерек жоқ — бұл құрылғыда бәрі бар екен.") +
          (r.from.n ? `<br><small>Оқушы: ${esc(r.from.n)} · ID ${esc(r.from.id || "—")}</small>` : "");
        el.querySelector(".pf-in").value = "";
        K.celebrate && r.n && K.celebrate();
        render();
      } catch (e) {
        res.className = "pf-result bad";
        res.textContent = "Код оқылмады: " + (e.message || e) + ". Кодты басынан аяғына дейін толық көшіргеніңізді тексеріңіз.";
      }
    }
    el.querySelector(".pf-import").addEventListener("click", () => doImport(el.querySelector(".pf-in").value));
    el.querySelector(".pf-upload input").addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try { const j = JSON.parse(await f.text()); doImport(j.code || ""); } catch (err) { doImport(""); }
      e.target.value = "";
    });

    // QR арқылы ашылған сілтеме: #import=KZP1...
    const m = location.hash.match(/import=(KZP1\.[A-Za-z0-9_-]+)/);
    if (m) {
      history.replaceState(null, "", location.pathname);
      el.querySelector(".pf-in").value = m[1];
      if (confirm("Басқа құрылғыдан келген прогресті осы құрылғыға біріктіру керек пе?")) doImport(m[1]);
    }
    render();
    document.addEventListener("cs50kz:week", render);
  }

  window.CS50KZ_SYNC = { encode, decode, importCode, snapshot, mergeKey };
  document.querySelectorAll(".profile").forEach(page);
})();
