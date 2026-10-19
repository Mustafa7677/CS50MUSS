import { N } from "./i18n/core";

// Хабарлама мәтіні = i18n кілті (қазақша): клиент/сервер t() арқылы ru-ға аударады (N() - скрипт үшін белгі).
// Дерекқордағы бизнес-қателер (exception хабары) -> қазақша түсініктеме. Белгісіз қателер клиентке ашылмайды.
const MESSAGES: Record<string, string> = {
  forbidden: N("Бұл әрекетке рұқсатыңыз жоқ."),
  unauthenticated: N("Жүйеге кіріңіз."),
  not_found: N("Табылмады немесе қолжетімсіз."),
  license_expired: N("Ұйымның лицензия мерзімі аяқталған не лицензия белсенді емес: жаңа сынып, тапсырма және қосылу уақытша шектелген. Оқу мен экспорт сақталады."),
  org_suspended: N("Ұйым уақытша тоқтатылған. Әкімшіге хабарласыңыз."),
  invalid_code: N("Сынып коды дұрыс емес немесе қосылу жабық."),
  class_full: N("Сыныптағы орын толған."),
  student_limit_reached: N("Ұйымның лицензиясындағы оқушы лимиті толған."),
  teacher_limit_reached: N("Ұйымның лицензиясындағы мұғалім лимиті толған."),
  invite_invalid: N("Шақыру жарамсыз, мерзімі өткен не қолданылған."),
  invite_email_mismatch: N("Бұл шақыру басқа e-mail мекенжайына арналған."),
  role_conflict: N("Бұл аккаунттың бұл ұйымда басқа рөлі бар."),
  deadline_passed: N("Тапсыру мерзімі өтіп кеткен."),
  attempts_exhausted: N("Әрекеттер саны таусылды."),
  already_submitted: N("Бұл жұмыс бұрын жіберілген."),
  not_submitted: N("Жұмыс әлі жіберілмеген."),
  assignment_locked: N("Бұл тапсырмаға жұмыс түскен: сұрақтары мен тест жағдайларын өзгертуге болмайды."),
  quiz_empty: N("Тестке кемінде бір сұрақ қосыңыз."),
  no_targets: N("Алдымен тапсырманы кемінде бір сыныпқа беріңіз."),
  invalid_score: N("Баға 0-ден максималды баллға дейін болуы тиіс."),
  invalid_question: N("Сұрақ пішімі қате: кемінде 2 нұсқа және дұрыс жауап керек."),
  invalid_answers: N("Жауаптар пішімі қате."),
  slug_taken: N("Бұл қысқа атау (slug) бос емес."),
  email_taken: N("Бұл e-mail тіркелген. Жүйеге кіріңіз."),
  weak_password: N("Құпиясөз кемінде 8 символ болуы тиіс."),
  invalid_credentials: N("E-mail немесе құпиясөз дұрыс емес."),
  rate_limited: N("Тым жиі әрекет. Бірнеше минуттан кейін қайталаңыз."),
  invalid_license_date: N("Лицензия мерзімі өткен күн болмауы тиіс."),
  invalid_status: N("Күй дұрыс емес."),
  invalid_ttl: N("Шақыру мерзімі 1 сағаттан 30 күнге дейін."),
  invalid_role: N("Рөл дұрыс емес."),
  cannot_remove_self: N("Өзіңізді өшіре алмайсыз."),
  invalid_range: N("Аралық дұрыс емес."),
  invalid_input: N("Енгізілген деректер дұрыс емес."),
  course_empty: N("Курсқа кемінде бір сабақ қосыңыз."),
  invalid_block: N("Сабақ блогы дұрыс емес (https сілтемесі немесе тіл түрі тексеріңіз)."),
  too_large: N("Мазмұн тым үлкен: блок немесе сабақ саны шектен асты."),
  validation: N("Енгізілген деректер дұрыс емес."),
  ai_disabled: N("Көмекші мектебіңізде қосылмаған. Мектеп әкімшісі оны баптауларда қоса алады."),
  ai_too_long: N("Хабар тым ұзын. Сұрағыңызды қысқартыңыз."),
  order_invalid_state: N("Тапсырыстың қазіргі күйінде бұл әрекет жасалмайды. Бетті жаңартып қараңыз."),
  order_snapshot_locked: N("Шот берілген тапсырыстың бағасы мен реквизиттері өзгермейді."),
  order_limit: N("Ашық тапсырыс саны шектен асты (5). Алдыңғыларын аяқтаңыз не бас тартыңыз."),
  billing_profile_missing: N("Алдымен ұйымның төлем реквизиттерін толтырыңыз (атауы, БИН/ЖСН, мекенжай, банк деректері)."),
  seller_profile_missing: N("Сатушы реквизиттерін толтырыңыз (Админ -> Сатушы профилі): онсыз шот жасалмайды."),
  price_not_set: N("Бұл пакет пен мерзімге баға қойылмаған. Баға бағдарламасын толтырыңыз не бағаны қолмен (келісім бойынша) енгізіңіз."),
  vat_mismatch: N("Сатушы ҚҚС төлеушісі емес, ал ұсыныста ҚҚС бар. Ұсынысты ҚҚС-сыз етіңіз не сатушы профилін түзетіңіз."),
  invalid_payment_date: N("Төлем күні шот күнінен бұрын не болашақта болмауы тиіс."),
  license_suspended: N("Ұйымның лицензиясы тоқтатылған: оны алдымен қолмен белсендіріңіз, содан кейін тапсырысты активтендіріңіз."),
  email_disabled: N("E-mail жіберу бұл ортада қосылмаған. Сілтемені көшіріп, өзіңіз жіберіңіз."),
};

export class AppError extends Error {
  constructor(public code: string, message?: string) { super(message ?? MESSAGES[code] ?? code); }
}

/** Қатеден қауіпсіз код шығарады (дерекқор хабары 'forbidden' сияқты код болса ғана). */
export function errorCode(e: unknown): string {
  if (e instanceof AppError) return e.code;
  const m = (e as { message?: string })?.message ?? "";
  if (/^[a-z_]+$/.test(m) && MESSAGES[m]) return m;
  const pg = e as { code?: string; constraint?: string };
  if (pg?.code === "23505") return "validation";
  if (pg?.code === "23514" || pg?.code === "22P02" || pg?.code === "22007" || pg?.code === "22008") return "validation";
  if (pg?.code === "42501") return "forbidden";
  return "internal";
}

export function errorMessage(e: unknown): string {
  const code = errorCode(e);
  if (code === "internal") { console.error("[qazaqcode] unexpected error:", e); return N("Күтпеген қате болды. Кейінірек қайталап көріңіз."); }
  return MESSAGES[code] ?? N("Қате болды.");
}

export const messageForCode = (code: string | undefined): string | null => (code && /^[a-z_]+$/.test(code) && MESSAGES[code] ? MESSAGES[code] : null);

export type ActionResult<T = unknown> = { ok: true; data?: T; message?: string } | { ok: false; error: string; field?: string };

// ?err= параметрі арқылы келген мәтін (void action-дарды бетке бағыттау). Кез келген мәтінді көрсету - контент жалғандығы (phishing
// сілтемесі: ?err=«аккаунтыңыз бұғатталды, ... хабарласыңыз»). Тек біздің белгілі хабарламалар көрсетіледі.
const EXTRA_ERR = [
  N("Енгізілген деректер дұрыс емес: атауларды (1-160 символ) тексеріңіз."),
  N("Алдымен курсты кемінде бір сыныпқа бекітіңіз."),
  N("Сабақ блогы дұрыс емес (https сілтемесі немесе тіл түрін тексеріңіз)."),
  N("Мазмұн тым үлкен: модуль, сабақ, блок саны не мәтін көлемі шектен асты."),
  N("Идентификатор дұрыс емес."),
];
const KNOWN_ERR = new Set<string>([...Object.values(MESSAGES), ...EXTRA_ERR, N("Күтпеген қате болды. Кейінірек қайталап көріңіз.")]);
export const safeErrText = (t: string | undefined): string | null => (t ? (KNOWN_ERR.has(t) ? t : /^[a-z_]+$/.test(t) && MESSAGES[t] ? MESSAGES[t] : N("Қате болды.")) : null);
