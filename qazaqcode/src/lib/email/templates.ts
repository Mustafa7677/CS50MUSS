// E-mail шаблондары (қазақша): мәтін + қарапайым HTML (тек инлайн CSS; сыртқы сурет, пиксель, трекинг жоқ).
// Пайдаланушы мәтіні (ұйым атауы, т.б.) әрқашан escape етіледі, тақырыпта жол үзілімі жойылады.
// Бұл файл басқа модульдерді импорттамайды (worker .ts-ті тікелей жүктейді).

export type EmailTemplate = "teacher_invite" | "student_join_info" | "licence_expiry" | "lead_ack" | "order_status" | "pilot_report_ready" | "generic";
export const TEMPLATES: readonly EmailTemplate[] = ["teacher_invite", "student_join_info", "licence_expiry", "lead_ack", "order_status", "pilot_report_ready", "generic"];

// Payload интерфейстері (басқа агенттер/скрипттер enqueue_email-ге осы пішімді жібереді). Барлығы құпиясыз.
export type PayloadMap = {
  teacher_invite: { org_name: string; token: string; expires_at?: string };           // token - бір реттік, жібергеннен кейін DB-дан өшеді
  student_join_info: { org_name: string; class_name: string; join_code: string };
  licence_expiry: { org_name: string; days: 30 | 14 | 7 | 1 | number; valid_until: string };   // valid_until: YYYY-MM-DD
  lead_ack: { org_name: string };
  order_status: { order_ref: string; status: string; note?: string; link_path?: string };  // B агенті: status = created|pending_payment|paid|activated|cancelled|failed
  pilot_report_ready: { org_name?: string; report_title?: string; link_path?: string };    // A агенті
  generic: { subject: string; body: string; link_path?: string; link_label?: string };
};

export type RenderCtx = { appUrl: string; unsubscribeUrl?: string | null; locale?: string };
export type Rendered = { subject: string; text: string; html: string };

const BAD_CTRL = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u2028\\u2029\\u202A-\\u202E\\u2066-\\u2069]", "g");

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
/** Бір жолдық мәтін: басқару таңбалары мен жол үзілімі жойылады, ұзындық шектеледі. */
export function oneLine(v: unknown, max = 160): string {
  return (typeof v === "string" || typeof v === "number" ? String(v) : "").replace(BAD_CTRL, "").replace(/\s+/g, " ").trim().slice(0, max);
}
/** Көп жолдық мәтін (абзацтар сақталады). */
function multiLine(v: unknown, max = 2000): string {
  return (typeof v === "string" ? v : "").replace(/\r\n?/g, "\n").replace(BAD_CTRL, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
export function kkDate(iso: unknown): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof iso === "string" ? iso : "");
  if (!m || +m[2] < 1 || +m[2] > 12) return "";
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

/** Қолданба ішіндегі жол ғана (ашық бағыттауды болдырмау): '/' бастап, қауіпсіз таңбалар. */
function appLink(appUrl: string, path: unknown): string | null {
  if (typeof path !== "string" || !/^\/[A-Za-z0-9\-._~\/?=&%#]{0,200}$/.test(path) || path.startsWith("//")) return null;
  return appUrl.replace(/\/+$/, "") + path;
}

type Block = { p: string } | { link: string; label: string } | { list: string[] };

function layout(title: string, blocks: Block[], unsubscribeUrl: string | null | undefined): { text: string; html: string } {
  const text: string[] = [title, ""];
  const html: string[] = [];
  for (const b of blocks) {
    if ("p" in b) { text.push(b.p, ""); html.push(`<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1f2937;">${escapeHtml(b.p).replace(/\n/g, "<br>")}</p>`); }
    else if ("list" in b) {
      text.push(...b.list.map((x, i) => `${i + 1}. ${x}`), "");
      html.push(`<ol style="margin:0 0 14px;padding-left:22px;font-size:15px;line-height:1.55;color:#1f2937;">${b.list.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ol>`);
    } else {
      text.push(`${b.label}: ${b.link}`, "");
      html.push(`<p style="margin:0 0 14px;"><a href="${escapeHtml(b.link)}" style="display:inline-block;background:#0e7490;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:15px;font-weight:600;">${escapeHtml(b.label)}</a></p>`
        + `<p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:#4b5563;word-break:break-all;">Батырма ашылмаса, сілтемені браузерге көшіріңіз:<br>${escapeHtml(b.link)}</p>`);
    }
  }
  const foot = ["QazaqCode: мектептерге арналған оқыту платформасы.", "Бұл хат автоматты түрде жіберілді, оған жауап беру міндетті емес."];
  if (unsubscribeUrl) foot.push(`Бұл мекенжайға хат алғыңыз келмесе: ${unsubscribeUrl}`);
  text.push("--", ...foot);
  const footHtml = foot.slice(0, 2).map(escapeHtml).join("<br>")
    + (unsubscribeUrl ? `<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#4b5563;">Хат алудан бас тарту</a>` : "");
  const doc = `<!doctype html><html lang="kk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>`
    + `<body style="margin:0;padding:0;background:#f3f4f6;"><div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">`
    + `<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">`
    + `<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0e7490;">QazaqCode</p>`
    + `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111827;">${escapeHtml(title)}</h1>${html.join("")}</div>`
    + `<p style="margin:14px 4px 0;font-size:12px;line-height:1.5;color:#6b7280;">${footHtml}</p></div></body></html>`;
  return { text: text.join("\n"), html: doc };
}

const ORDER_STATUS: Record<string, string> = {
  created: "тапсырыс жасалды", pending_payment: "төлем күтілуде", paid: "төлем қабылданды", activated: "лицензия белсендірілді",
  cancelled: "тапсырыс бас тартылды", failed: "төлем сәтсіз аяқталды",
};

/** payload сырттан келеді (DB): әр өріс тексеріліп, escape етіледі. Белгісіз шаблон - қате. */
export function render(template: string, payload: Record<string, unknown>, ctx: RenderCtx): Rendered {
  const p = payload ?? {};
  const org = oneLine(p.org_name, 160);
  const q = (title: string, blocks: Block[], subject = title): Rendered => {
    const l = layout(title, blocks, ctx.unsubscribeUrl);
    return { subject: oneLine(subject, 200), ...l };
  };
  switch (template) {
    case "teacher_invite": {
      const tok = typeof p.token === "string" && /^[0-9a-f]{32,64}$/.test(p.token) ? p.token : null;
      if (!tok) throw new Error("teacher_invite: token жоқ");
      const link = appLink(ctx.appUrl, `/invite/${tok}`)!;
      const until = kkDate(p.expires_at);
      return q("Сізді мұғалім ретінде шақырды", [
        { p: `«${org || "Мектеп"}» ұйымы сізді QazaqCode платформасына мұғалім ретінде шақырды.` },
        { link, label: "Шақыруды қабылдау" },
        { p: (until ? `Сілтеме ${until} күніне дейін жарамды және бір рет қолданылады. ` : "Сілтеме бір рет қолданылады. ") + "Егер бұл шақыруды күтпеген болсаңыз, хатты елемеңіз." },
      ], `QazaqCode: «${org || "Мектеп"}» сізді мұғалім ретінде шақырды`);
    }
    case "student_join_info": {
      const code = oneLine(p.join_code, 20);
      const link = appLink(ctx.appUrl, "/join");
      return q("Сыныпқа қосылу", [
        { p: `«${org || "Мектеп"}» ұйымындағы «${oneLine(p.class_name, 120)}» сыныбына қосылу үшін төмендегі кодты қолданыңыз.` },
        { p: `Сынып коды: ${code}` },
        ...(link ? [{ link, label: "Қосылу бетін ашу" } as Block] : []),
      ], "QazaqCode: сыныпқа қосылу коды");
    }
    case "licence_expiry": {
      const days = Number(p.days);
      const d = Number.isInteger(days) && days >= 0 && days <= 365 ? days : 0;
      const when = d === 1 ? "ертең аяқталады" : `${d} күннен кейін аяқталады`;
      const until = kkDate(p.valid_until);
      const link = appLink(ctx.appUrl, "/school/licence")!;
      return q(`Лицензия мерзімі ${when}`, [
        { p: `«${org || "Ұйым"}» ұйымының QazaqCode лицензиясы ${until ? `${until} күні ` : ""}${when}.` },
        { p: "Мерзім аяқталған соң жаңа сынып, тапсырма ашу және қосылу шектеледі. Оқу мен экспорт сақталады." },
        { link, label: "Лицензия бетін ашу" },
      ], `QazaqCode: лицензия мерзімі ${when}`);
    }
    case "lead_ack": {
      return q("Пилот сұрауыңыз қабылданды", [
        { p: `${org ? `«${org}» үшін ` : ""}пилотқа сұрауыңыз қабылданды. Рахмет!` },
        { p: "Келесі қадамдар:" },
        { list: ["Команда сұрауды қарап, осы e-mail арқылы сізбен байланысады.", "Бірге платформаның демо нұсқасын қарап, қажеттіліктерді нақтылаймыз.", "Келіссеңіз, пилот шарттары мен мерзімін бекітеміз."] },
        { p: "Бұл сұрауды сіз жібермесеңіз, хатты елемеңіз: деректер тек байланысу үшін сақталады және 365 күннен кейін өшіріледі." },
      ], "QazaqCode: пилот сұрауыңыз қабылданды");
    }
    case "order_status": {
      const st = oneLine(p.status, 40);
      const label = ORDER_STATUS[st] ?? st;
      const link = appLink(ctx.appUrl, typeof p.link_path === "string" ? p.link_path : "/school/licence");
      const note = multiLine(p.note, 500);
      return q("Тапсырыс күйі өзгерді", [
        { p: `Тапсырыс ${oneLine(p.order_ref, 60)}: ${label}.` },
        ...(note ? [{ p: note } as Block] : []),
        ...(link ? [{ link, label: "Тапсырысты ашу" } as Block] : []),
      ], `QazaqCode: тапсырыс ${oneLine(p.order_ref, 60)} - ${label}`);
    }
    case "pilot_report_ready": {
      const title = oneLine(p.report_title, 160);
      const link = appLink(ctx.appUrl, typeof p.link_path === "string" ? p.link_path : "/school");
      return q("Пилот есебі дайын", [
        { p: `${org ? `«${org}» үшін ` : ""}пилот есебі${title ? ` («${title}»)` : ""} дайын.` },
        ...(link ? [{ link, label: "Есепті ашу" } as Block] : []),
      ], "QazaqCode: пилот есебі дайын");
    }
    case "generic": {
      const subj = oneLine(p.subject, 160);
      if (!subj) throw new Error("generic: subject жоқ");
      const link = appLink(ctx.appUrl, p.link_path);
      const body = multiLine(p.body, 2000);
      return q(subj, [
        ...body.split(/\n{2,}/).filter(Boolean).map((x) => ({ p: x }) as Block),
        ...(link ? [{ link, label: oneLine(p.link_label, 60) || "Ашу" } as Block] : []),
      ]);
    }
    default:
      throw new Error("белгісіз шаблон");
  }
}
