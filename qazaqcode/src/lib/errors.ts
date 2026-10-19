// Дерекқордағы бизнес-қателер (exception хабары) -> қазақша түсініктеме. Белгісіз қателер клиентке ашылмайды.
const MESSAGES: Record<string, string> = {
  forbidden: "Бұл әрекетке рұқсатыңыз жоқ.",
  unauthenticated: "Жүйеге кіріңіз.",
  not_found: "Табылмады немесе қолжетімсіз.",
  license_expired: "Ұйымның лицензия мерзімі аяқталған не лицензия белсенді емес: жаңа сынып, тапсырма және қосылу уақытша шектелген. Оқу мен экспорт сақталады.",
  org_suspended: "Ұйым уақытша тоқтатылған. Әкімшіге хабарласыңыз.",
  invalid_code: "Сынып коды дұрыс емес немесе қосылу жабық.",
  class_full: "Сыныптағы орын толған.",
  student_limit_reached: "Ұйымның лицензиясындағы оқушы лимиті толған.",
  teacher_limit_reached: "Ұйымның лицензиясындағы мұғалім лимиті толған.",
  invite_invalid: "Шақыру жарамсыз, мерзімі өткен не қолданылған.",
  invite_email_mismatch: "Бұл шақыру басқа e-mail мекенжайына арналған.",
  role_conflict: "Бұл аккаунттың бұл ұйымда басқа рөлі бар.",
  deadline_passed: "Тапсыру мерзімі өтіп кеткен.",
  attempts_exhausted: "Әрекеттер саны таусылды.",
  already_submitted: "Бұл жұмыс бұрын жіберілген.",
  not_submitted: "Жұмыс әлі жіберілмеген.",
  assignment_locked: "Бұл тапсырмаға жұмыс түскен: сұрақтары мен тест жағдайларын өзгертуге болмайды.",
  quiz_empty: "Тестке кемінде бір сұрақ қосыңыз.",
  no_targets: "Алдымен тапсырманы кемінде бір сыныпқа беріңіз.",
  invalid_score: "Баға 0-ден максималды баллға дейін болуы тиіс.",
  invalid_question: "Сұрақ пішімі қате: кемінде 2 нұсқа және дұрыс жауап керек.",
  invalid_answers: "Жауаптар пішімі қате.",
  slug_taken: "Бұл қысқа атау (slug) бос емес.",
  email_taken: "Бұл e-mail тіркелген. Жүйеге кіріңіз.",
  weak_password: "Құпиясөз кемінде 8 символ болуы тиіс.",
  invalid_credentials: "E-mail немесе құпиясөз дұрыс емес.",
  rate_limited: "Тым жиі әрекет. Бірнеше минуттан кейін қайталаңыз.",
  invalid_license_date: "Лицензия мерзімі өткен күн болмауы тиіс.",
  invalid_status: "Күй дұрыс емес.",
  invalid_ttl: "Шақыру мерзімі 1 сағаттан 30 күнге дейін.",
  invalid_role: "Рөл дұрыс емес.",
  cannot_remove_self: "Өзіңізді өшіре алмайсыз.",
  invalid_range: "Аралық дұрыс емес.",
  invalid_input: "Енгізілген деректер дұрыс емес.",
  course_empty: "Курсқа кемінде бір сабақ қосыңыз.",
  invalid_block: "Сабақ блогы дұрыс емес (https сілтемесі немесе тіл түрі тексеріңіз).",
  too_large: "Мазмұн тым үлкен: блок немесе сабақ саны шектен асты.",
  validation: "Енгізілген деректер дұрыс емес.",
  ai_disabled: "Көмекші мектебіңізде қосылмаған. Мектеп әкімшісі оны баптауларда қоса алады.",
  ai_too_long: "Хабар тым ұзын. Сұрағыңызды қысқартыңыз.",
  order_invalid_state: "Тапсырыстың қазіргі күйінде бұл әрекет жасалмайды. Бетті жаңартып қараңыз.",
  order_snapshot_locked: "Шот берілген тапсырыстың бағасы мен реквизиттері өзгермейді.",
  order_limit: "Ашық тапсырыс саны шектен асты (5). Алдыңғыларын аяқтаңыз не бас тартыңыз.",
  billing_profile_missing: "Алдымен ұйымның төлем реквизиттерін толтырыңыз (атауы, БИН/ЖСН, мекенжай, банк деректері).",
  seller_profile_missing: "Сатушы реквизиттерін толтырыңыз (Админ -> Сатушы профилі): онсыз шот жасалмайды.",
  price_not_set: "Бұл пакет пен мерзімге баға қойылмаған. Баға бағдарламасын толтырыңыз не бағаны қолмен (келісім бойынша) енгізіңіз.",
  vat_mismatch: "Сатушы ҚҚС төлеушісі емес, ал ұсыныста ҚҚС бар. Ұсынысты ҚҚС-сыз етіңіз не сатушы профилін түзетіңіз.",
  invalid_payment_date: "Төлем күні шот күнінен бұрын не болашақта болмауы тиіс.",
  license_suspended: "Ұйымның лицензиясы тоқтатылған: оны алдымен қолмен белсендіріңіз, содан кейін тапсырысты активтендіріңіз.",
  email_disabled: "E-mail жіберу бұл ортада қосылмаған. Сілтемені көшіріп, өзіңіз жіберіңіз.",
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
  if (code === "internal") { console.error("[qazaqcode] күтпеген қате:", e); return "Күтпеген қате болды. Кейінірек қайталап көріңіз."; }
  return MESSAGES[code] ?? "Қате болды.";
}

export const messageForCode = (code: string | undefined): string | null => (code && /^[a-z_]+$/.test(code) && MESSAGES[code] ? MESSAGES[code] : null);

export type ActionResult<T = unknown> = { ok: true; data?: T; message?: string } | { ok: false; error: string; field?: string };

// ?err= параметрі арқылы келген мәтін (void action-дарды бетке бағыттау). Кез келген мәтінді көрсету - контент жалғандығы (phishing
// сілтемесі: ?err=«аккаунтыңыз бұғатталды, ... хабарласыңыз»). Тек біздің белгілі хабарламалар көрсетіледі.
const EXTRA_ERR = [
  "Енгізілген деректер дұрыс емес: атауларды (1-160 символ) тексеріңіз.",
  "Алдымен курсты кемінде бір сыныпқа бекітіңіз.",
  "Сабақ блогы дұрыс емес (https сілтемесі немесе тіл түрін тексеріңіз).",
  "Мазмұн тым үлкен: модуль, сабақ, блок саны не мәтін көлемі шектен асты.",
  "Идентификатор дұрыс емес.",
];
const KNOWN_ERR = new Set<string>([...Object.values(MESSAGES), ...EXTRA_ERR, "Күтпеген қате болды. Кейінірек қайталап көріңіз."]);
export const safeErrText = (t: string | undefined): string | null => (t ? (KNOWN_ERR.has(t) ? t : /^[a-z_]+$/.test(t) && MESSAGES[t] ? MESSAGES[t] : "Қате болды.") : null);
