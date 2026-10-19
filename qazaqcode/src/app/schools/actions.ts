"use server";
import { z } from "zod";
import { withUser } from "@/lib/db";
import { errorMessage, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

const schema = (t: TFn) => z.object({
  org_name: z.string().min(2, t("Ұйым атауын жазыңыз (кемінде 2 таңба).")).max(160, t("Ұйым атауы тым ұзын (160 таңбаға дейін).")),
  contact_name: z.string().min(2, t("Байланыс адамының атын жазыңыз (кемінде 2 таңба).")).max(120, t("Аты тым ұзын (120 таңбаға дейін).")),
  email: z.string().toLowerCase().email(t("E-mail мекенжайы дұрыс емес.")).max(160, t("E-mail тым ұзын.")),
  phone: z.string().min(5, t("Телефон нөмірі тым қысқа.")).max(40, t("Телефон нөмірі тым ұзын.")).nullable(),
  role: z.enum(["director", "deputy", "teacher", "it", "other"], t("Рөлді таңдаңыз.")),
  org_type: z.enum(["school", "college", "academy", "other"], t("Ұйым түрін таңдаңыз.")),
  students: z.number(t("Оқушы саны сан болуы тиіс.")).int(t("Оқушы саны бүтін сан болуы тиіс.")).min(1, t("Оқушы саны 1-ден кем болмауы тиіс.")).max(100000, t("Оқушы саны тым үлкен.")).nullable(),
  message: z.string().max(1000, t("Хабар 1000 таңбадан аспауы тиіс.")).nullable(),
  consent: z.literal(true, t("Жалғастыру үшін деректерді өңдеуге келісім беріңіз.")),
});

/** Жария «Пилот сұрау» формасы. Бот тұзағы (honeypot), IP бойынша лимит, zod; жазу - тек submit_lead RPC. */
export async function requestPilotAction(_: ActionResult | null, f: FormData): Promise<ActionResult> { const t = await getT();
  const OK: ActionResult = { ok: true, message: t("Рахмет! Сұрауыңыз қабылданды. Біз жақын арада көрсетілген e-mail арқылы хабарласамыз.") };
  try {
    // Бот тұзағы: көрінбейтін өріс толса - қабылдағандай көрінеді, бірақ ештеңе сақталмайды
    if (str(f, "website") !== "") return OK;
    await rateLimit("lead", 4, 60 * 60_000);
    const sn = str(f, "students");
    const p = schema(t).parse({
      org_name: str(f, "org_name"), contact_name: str(f, "contact_name"), email: str(f, "email"),
      phone: str(f, "phone") || null, role: str(f, "role"), org_type: str(f, "org_type"),
      students: sn === "" ? null : Number(sn), message: str(f, "message") || null, consent: f.get("consent") === "on",
    });
    await rateLimit("lead-email", 3, 60 * 60_000, p.email, false); // IP-ге қарамай бір e-mail-ге (таратылған спам)
    await withUser(null, (q) => q("select public.submit_lead($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [p.org_name, p.contact_name, p.email, p.phone, p.role, p.org_type, p.students, p.message, p.consent, "schools-page"]));
    return OK; // қайталанған e-mail де «сәтті»: e-mail бар-жоғы ашылмайды
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? t("Енгізілген деректер дұрыс емес.") };
    return { ok: false, error: errorMessage(e) };
  }
}
