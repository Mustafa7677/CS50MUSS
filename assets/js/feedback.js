/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. Harvard CS50 материалдары мен үшінші тарап компоненттері өз лицензияларымен қалады. */
// CS50 қазақша - кері байланыс: футердегі «Пікір қалдыру» арқылы (мәтінді белгілегенде батырма шықпайды).
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
  // ---------- Серіктестер беті: пилот өтінімі (сол cs50kz_feedback кестесіне, түрі "pilot") ----------
  const ROLES = { school: "Мектеп не колледж", partner: "Серіктес ұйым", investor: "Инвестор не қор" };
  document.querySelectorAll(".inv-form").forEach((f) => {
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = f.querySelector(".inv-result"), btn = f.querySelector('button[type="submit"]');
      const v = (n) => f.elements[n].value.trim();
      const miss = ["org", "contact"].filter((n) => !v(n));
      f.querySelectorAll("input").forEach((i) => i.setAttribute("aria-invalid", miss.includes(i.name) ? "true" : "false"));
      if (miss.length) {
        out.className = "inv-result bad";
        out.textContent = "Ұйым атауы мен байланысты толтырыңыз.";
        f.elements[miss[0]].focus();
        return;
      }
      const d = { kind: "pilot", page: "partners.html", section: ROLES[v("role")] || "", quote: v("org"),
        message: `Байланыс: ${v("contact")}\n${v("note")}`.trim() };
      btn.disabled = true; btn.textContent = "Жіберілуде…";
      try {
        const r = await fetch(API, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ p_kind: d.kind, p_page: d.page, p_section: d.section, p_quote: d.quote, p_message: d.message, p_student: null }) });
        if (!r.ok) throw new Error("HTTP " + r.status);
        K.track && K.track("pilot", "");
        out.className = "inv-result ok";
        out.textContent = "Өтінім жіберілді. Жақын арада хабарласамыз.";
        f.querySelectorAll("input, select, textarea").forEach((x) => { x.disabled = true; });
        btn.hidden = true;
      } catch (err) {
        out.className = "inv-result bad";
        out.innerHTML = `Жіберу мүмкін болмады. GitHub арқылы жіберіңіз: <a href="${githubUrl(d)}" target="_blank" rel="noopener">өтінім ашу</a>`;
        btn.disabled = false; btn.textContent = "Қайта жіберу";
      }
    });
  });

  window.CS50KZ_FEEDBACK = { open };
})();
