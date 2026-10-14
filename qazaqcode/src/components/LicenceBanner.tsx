import Link from "next/link";
import { Banner } from "./ui";
import type { Ctx } from "@/lib/context";
import { withUser } from "@/lib/db";
import { brandFor } from "@/lib/brand";
import { fmtDate } from "@/lib/format";

export const NEAR_DAYS = 30;
type Notice = { state: string; valid_until: string | null; days_left: number | null };

async function notice(ctx: Ctx): Promise<Notice | null> {
  const org = ctx.active?.org_id;
  if (!org) return null;
  try {
    const r = await withUser(ctx.userId, (q) => q<Notice>("select state, valid_until::text, days_left from public.licence_notice($1)", [org]));
    return r[0] ?? { state: ctx.active!.license_state, valid_until: null, days_left: null };
  } catch { return { state: ctx.active!.license_state, valid_until: null, days_left: null }; }
}

const plural = (n: number) => `${n} күн`;

/**
 * Лицензия ескертуі (мектеп, мұғалім, оқушы аймақтарында): мерзімі өткен/тоқтатылған - қызыл,
 * 30 күннен аз қалса - сары. Әдеттегі белсенді лицензияда ештеңе көрсетпейді.
 */
export async function LicenceBanner({ ctx }: { ctx: Ctx }) {
  if (!ctx.active) return null;
  const n = await notice(ctx);
  if (!n) return null;
  const admin = ctx.active.role === "school_admin";
  const shown = n.state !== "active" || (n.days_left != null && n.days_left <= NEAR_DAYS);
  const b = shown && !admin ? await brandFor(ctx.userId, ctx.active.org_id).catch(() => null) : null;
  const contact = b && (b.contact_email || b.contact_phone) ? <> Байланыс: {[b.contact_email, b.contact_phone].filter(Boolean).join(", ")}.</> : null;
  const student = ctx.active.role === "student";
  const more = admin
    ? <> <Link href="/school/licence" className="font-semibold underline">Лицензия беті</Link>: ұзарту үшін платформа әкімшісіне хабарласыңыз.</>
    : <> {student ? "Сұрақ болса" : "Лицензияны ұзарту үшін"} мектеп әкімшісіне хабарласыңыз.{contact}</>;

  if (n.state === "expired" || n.state === "suspended" || n.state === "org_suspended" || n.state === "none") {
    const label = n.state === "expired" ? "мерзімі өткен" : n.state === "none" ? "жоқ" : n.state === "suspended" ? "тоқтатылған" : "ұйым тоқтатылған";
    return (
      <div data-testid="licence-banner" data-state={n.state}>
        <Banner tone="bad">
          <strong>Лицензия күйі: {label}.</strong>{n.state === "expired" && n.valid_until ? ` Мерзімі ${fmtDate(n.valid_until)} күні аяқталды.` : ""}{" "}
          {student
            ? "Жаңа тапсырма, сынып және курс ашу шектелген; жұмысыңыз бен бағаларыңыз сақталған."
            : "Жаңа тапсырма, сынып және курс жасау шектелген; деректер сақталған, оқуға болады, экспорт қолжетімді."}
          {more}
        </Banner>
      </div>
    );
  }
  if (n.days_left != null && n.days_left <= NEAR_DAYS) {
    return (
      <div data-testid="licence-banner" data-state="expiring">
        <Banner tone="warn">
          <strong>Лицензия мерзімі аяқталуға жақын:</strong> {n.days_left <= 0 ? "бүгін аяқталады" : `${plural(n.days_left)} қалды`}{n.valid_until ? ` (${fmtDate(n.valid_until)})` : ""}.
          {student ? " Мерзім біткен соң жаңа тапсырма мен курс ашу шектеледі, бар деректер сақталады." : " Мерзім біткен соң жаңа сынып, тапсырма және курс жасау шектеледі; деректер өшірілмейді."}
          {more}
        </Banner>
      </div>
    );
  }
  return null;
}
