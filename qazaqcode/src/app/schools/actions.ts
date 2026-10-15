"use server";
import { z } from "zod";
import { withUser } from "@/lib/db";
import { errorMessage, type ActionResult } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

const schema = z.object({
  org_name: z.string().min(2, "Ұйым атауын жазыңыз (кемінде 2 таңба).").max(160, "Ұйым атауы тым ұзын (160 таңбаға дейін)."),
  contact_name: z.string().min(2, "Байланыс адамының атын жазыңыз (кемінде 2 таңба).").max(120, "Аты тым ұзын (120 таңбаға дейін)."),
  email: z.string().toLowerCase().email("E-mail мекенжайы дұрыс емес.").max(160, "E-mail тым ұзын."),
  phone: z.string().min(5, "Телефон нөмірі тым қысқа.").max(40, "Телефон нөмірі тым ұзын.").nullable(),
  role: z.enum(["director", "deputy", "teacher", "it", "other"], "Рөлді таңдаңыз."),
  org_type: z.enum(["school", "college", "academy", "other"], "Ұйым түрін таңдаңыз."),
  students: z.number("Оқушы саны сан болуы тиіс.").int("Оқушы саны бүтін сан болуы тиіс.").min(1, "Оқушы саны 1-ден кем болмауы тиіс.").max(100000, "Оқушы саны тым үлкен.").nullable(),
  message: z.string().max(1000, "Хабар 1000 таңбадан аспауы тиіс.").nullable(),
  consent: z.literal(true, "Жалғастыру үшін деректерді өңдеуге келісім беріңіз."),
});

/** Жария «Пилот сұрау» формасы. Бот тұзағы (honeypot), IP бойынша лимит, zod; жазу - тек submit_lead RPC. */
export async function requestPilotAction(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const OK: ActionResult = { ok: true, message: "Рахмет! Сұрауыңыз қабылданды. Біз жақын арада көрсетілген e-mail арқылы хабарласамыз." };
  try {
    // Бот тұзағы: көрінбейтін өріс толса - қабылдағандай көрінеді, бірақ ештеңе сақталмайды
    if (str(f, "website") !== "") return OK;
    await rateLimit("lead", 4, 60 * 60_000);
    const sn = str(f, "students");
    const p = schema.parse({
      org_name: str(f, "org_name"), contact_name: str(f, "contact_name"), email: str(f, "email"),
      phone: str(f, "phone") || null, role: str(f, "role"), org_type: str(f, "org_type"),
      students: sn === "" ? null : Number(sn), message: str(f, "message") || null, consent: f.get("consent") === "on",
    });
    await rateLimit("lead-email", 3, 60 * 60_000, p.email, false); // IP-ге қарамай бір e-mail-ге (таратылған спам)
    await withUser(null, (q) => q("select public.submit_lead($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [p.org_name, p.contact_name, p.email, p.phone, p.role, p.org_type, p.students, p.message, p.consent, "schools-page"]));
    return OK; // қайталанған e-mail де «сәтті»: e-mail бар-жоғы ашылмайды
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Енгізілген деректер дұрыс емес." };
    return { ok: false, error: errorMessage(e) };
  }
}
