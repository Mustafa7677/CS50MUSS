import Link from "next/link";
import { Banner } from "./ui";
import type { Ctx } from "@/lib/context";
import { withUser } from "@/lib/db";
import { brandFor } from "@/lib/brand";
import { fmtDate } from "@/lib/format";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

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

const plural = (n: number, t: TFn) => t("{n} күн", { n });

/**
 * Лицензия ескертуі (мектеп, мұғалім, оқушы аймақтарында): мерзімі өткен/тоқтатылған - қызыл,
 * 30 күннен аз қалса - сары. Әдеттегі белсенді лицензияда ештеңе көрсетпейді.
 */
export async function LicenceBanner({ ctx }: { ctx: Ctx }) { const t = await getT();
  if (!ctx.active) return null;
  const n = await notice(ctx);
  if (!n) return null;
  const admin = ctx.active.role === "school_admin";
  const shown = n.state !== "active" || (n.days_left != null && n.days_left <= NEAR_DAYS);
  const b = shown && !admin ? await brandFor(ctx.userId, ctx.active.org_id).catch(() => null) : null;
  const contact = b && (b.contact_email || b.contact_phone) ? <>{" "}{t("Байланыс: {join}.", { join: [b.contact_email, b.contact_phone].filter(Boolean).join(", ") })}</> : null;
  const student = ctx.active.role === "student";
  const more = admin
    ? <> <Link href="/school/licence" className="font-semibold underline">{t("Лицензия беті")}</Link>{t(": ұзарту үшін платформа әкімшісіне хабарласыңыз.")}</>
    : <>{" "}{t("{v} мектеп әкімшісіне хабарласыңыз.", { v: student ? t("Сұрақ болса") : t("Лицензияны ұзарту үшін") })}{contact}</>;

  if (n.state === "expired" || n.state === "suspended" || n.state === "org_suspended" || n.state === "none") {
    const label = n.state === "expired" ? t("мерзімі өткен") : n.state === "none" ? t("жоқ") : n.state === "suspended" ? t("тоқтатылған") : t("ұйым тоқтатылған");
    return (
      <div data-testid="licence-banner" data-state={n.state}>
        <Banner tone="bad">
          <strong>{t("Лицензия күйі: {label}.", { label })}</strong>{n.state === "expired" && n.valid_until ? t(" Мерзімі {fmtDate} күні аяқталды.", { fmtDate: fmtDate(n.valid_until) }) : ""}{" "}
          {student
            ? t("Жаңа тапсырма, сынып және курс ашу шектелген; жұмысыңыз бен бағаларыңыз сақталған.")
            : t("Жаңа тапсырма, сынып және курс жасау шектелген; деректер сақталған, оқуға болады, экспорт қолжетімді.")}
          {more}
        </Banner>
      </div>
    );
  }
  if (n.days_left != null && n.days_left <= NEAR_DAYS) {
    return (
      <div data-testid="licence-banner" data-state="expiring">
        <Banner tone="warn">
          <strong>{t("Лицензия мерзімі аяқталуға жақын:")}</strong> {n.days_left <= 0 ? t("бүгін аяқталады") : t("{plural} қалды", { plural: plural(n.days_left, t) })}{n.valid_until ? ` (${fmtDate(n.valid_until)})` : ""}.
          {student ? (" " + t("Мерзім біткен соң жаңа тапсырма мен курс ашу шектеледі, бар деректер сақталады.")) : (" " + t("Мерзім біткен соң жаңа сынып, тапсырма және курс жасау шектеледі; деректер өшірілмейді."))}
          {more}
        </Banner>
      </div>
    );
  }
  return null;
}
