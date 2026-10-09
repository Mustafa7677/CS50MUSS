// CS50 қазақша - кері байланыс: мәтінді белгілеп «Қатені хабарлау» не футердегі «Пікір қалдыру».
// Хабар Supabase-ке (cs50kz_feedback_send) жіберіледі; болмаса - GitHub issue сілтемесі ұсынылады.

(function () {
  const K = window.CS50KZ;
  const esc = K.escapeHtml;
  const API = "https://fuzkjjfpknnpauykzfip.supabase.co/rest/v1/rpc/cs50kz_feedback_send";
  const KEY = "sb_publishable_Pc_d_L6MuzJI8_Ugs3QZ1Q_LqnRfzk_";
  const REPO = "https://github.com/Mustafa7677/CS50MUSS/issues/new";
  const KINDS = [["translation", "Аударма қатесі"], ["code", "Код не мысал қатесі"], ["unclear", "Түсініксіз жер"], ["idea", "Ұсыныс"], ["other", "Басқа"]];

  const pagePath = () => location.pathname.replace(/^.*?\/(lectures\/[^/]+|[^/]+\.html)$/, "$1") || "index.html";
  function sectionOf(node) {
    let el = node && (node.nodeType === 1 ? node : node.parentElement);
    while (el && el !== document.body) {
      let p = el;
      while (p) { if (/^H[23]$/.test(p.tagName)) return p.textContent.trim().slice(0, 200); p = p.previousElementSibling; }
      el = el.parentElement;
    }
    return document.querySelector("h1")?.textContent.trim().slice(0, 200) || "";
  }

  // ---------- Белгілеу батырмасы ----------
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "fb-fab";
  fab.hidden = true;
  fab.textContent = "✏️ Қатені хабарлау";
  document.body.appendChild(fab);
  let picked = null;
  const hideFab = () => { fab.hidden = true; };
  function place() {
    const sel = document.getSelection();
    const text = sel && sel.toString().trim();
    const host = sel && sel.rangeCount && sel.getRangeAt(0).commonAncestorContainer;
    const el = host && (host.nodeType === 1 ? host : host.parentElement);
    if (!text || text.length < 3 || !el || !el.closest(".content") || el.closest("input, textarea, .fb-modal, pre.run-output, .exam")) return hideFab();
    const r = sel.getRangeAt(0).getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return hideFab();
    picked = { quote: text.slice(0, 600), section: sectionOf(sel.anchorNode) };
    fab.hidden = false;
    const top = r.top > 60 ? r.top - 44 : Math.min(innerHeight - 44, r.bottom + 8);
    fab.style.top = top + "px";
    fab.style.left = Math.min(innerWidth - 190, Math.max(8, r.left + r.width / 2 - 90)) + "px";
  }
  document.addEventListener("selectionchange", place);
  addEventListener("scroll", () => fab.hidden || requestAnimationFrame(place), { passive: true });
  fab.addEventListener("mousedown", (e) => e.preventDefault()); // белгілеу жоғалмасын
  fab.addEventListener("click", () => { hideFab(); open(picked || {}); });

  // ---------- Терезе ----------
  function githubUrl(d) {
    const title = `[${(KINDS.find((k) => k[0] === d.kind) || KINDS[4])[1]}] ${d.page}${d.section ? " - " + d.section : ""}`.slice(0, 120);
    const body = `**Бет:** ${d.page}\n**Бөлім:** ${d.section || "-"}\n\n${d.quote ? "**Үзінді:**\n> " + d.quote.replace(/\n/g, "\n> ") + "\n\n" : ""}**Ұсыныс:**\n${d.message}\n`;
    return `${REPO}?labels=feedback&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  function open(pre = {}) {
    document.querySelector(".fb-modal")?.remove();
    const m = document.createElement("div");
    m.className = "search-modal open fb-modal";
    m.innerHTML = `<div class="search-box fb-box" role="dialog" aria-modal="true" aria-label="Кері байланыс">
      <h3>${pre.quote ? "✏️ Қатені хабарлау" : "💬 Пікір қалдыру"}</h3>
      ${pre.quote ? `<blockquote class="fb-quote">${esc(pre.quote)}</blockquote>` : ""}
      <p class="fb-where">${esc(pagePath())}${pre.section ? " · " + esc(pre.section) : ""}</p>
      <div class="fb-kinds" role="radiogroup" aria-label="Түрі">${KINDS.map(([k, t], i) => `<label><input type="radio" name="fb-kind" value="${k}" ${(pre.quote ? i === 0 : k === "idea") ? "checked" : ""}> ${t}</label>`).join("")}</div>
      <textarea class="fb-msg" rows="4" maxlength="2000" placeholder="${pre.quote ? "Қалай дұрыс болады? Не неге түсініксіз?" : "Сайт туралы пікіріңіз, ұсынысыңыз не тапқан қатеңіз"}" aria-label="Хабарлама"></textarea>
      <div class="pf-actions"><button type="button" class="btn gold fb-send">Жіберу</button><button type="button" class="btn secondary fb-close">Жабу</button></div>
      <p class="fb-result" aria-live="polite"></p>
      <p class="pf-small">Хабар авторға анонимді түрде жетеді. Бұлтты қосқан болсаңыз, ID-іңіз де тіркеледі.</p>
    </div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.querySelector(".fb-close").addEventListener("click", close);
    m.addEventListener("click", (e) => e.target === m && close());
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    m.querySelector(".fb-msg").focus();
    m.querySelector(".fb-send").addEventListener("click", async (e) => {
      const d = {
        kind: m.querySelector('input[name="fb-kind"]:checked').value,
        page: pagePath(), section: pre.section || "", quote: pre.quote || "",
        message: m.querySelector(".fb-msg").value.trim(),
      };
      const out = m.querySelector(".fb-result");
      if (!d.message) { out.className = "fb-result bad"; out.textContent = "Хабарламаны жазыңыз."; return; }
      e.target.disabled = true; e.target.textContent = "Жіберілуде…";
      const cl = (() => { try { const v = JSON.parse(localStorage.getItem("cs50kz:cloud")); return v && typeof v === "object" ? v : {}; } catch (er) { return {}; } })();
      try {
        const r = await fetch(API, {
          method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ p_kind: d.kind, p_page: d.page, p_section: d.section, p_quote: d.quote, p_message: d.message, p_student: cl.on ? K.profile().id : null }),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        out.className = "fb-result ok";
        out.innerHTML = "✓ Рахмет! Хабарыңыз авторға жетті. 🙏";
        m.querySelector(".fb-msg").disabled = true;
        e.target.hidden = true;
        K.mark && K.mark("feedback");
        K.botaSay && K.botaSay("Рахмет! Бірге сайтты жақсартамыз 💛", "happy");
      } catch (err) {
        out.className = "fb-result bad";
        out.innerHTML = `Жіберу мүмкін болмады. GitHub арқылы жіберіңіз: <a href="${githubUrl(d)}" target="_blank" rel="noopener">issue ашу →</a>`;
        e.target.disabled = false; e.target.textContent = "Қайта жіберу";
      }
    });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest(".fb-open");
    if (!a) return;
    e.preventDefault();
    open({});
  });
  window.CS50KZ_FEEDBACK = { open };
})();
