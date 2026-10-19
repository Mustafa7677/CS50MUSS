import { N } from "./i18n/core";
export { fmtDate, fmtPct, fmtNum, fmtDuration } from "./i18n/format";

// Белгілер (label) кілті - қазақша мәтін; көрсету кезінде t(LABEL[key]) арқылы аударылады.
export const STATUS_LABEL: Record<string, string> = {
  not_started: N("Басталмаған"), in_progress: N("Орындалып жатыр"), submitted: N("Жіберілген"), under_review: N("Тексеріліп жатыр"), graded: N("Бағаланған"), overdue: N("Мерзімі өткен"),
  draft: N("Жоба"), published: N("Жарияланған"), archived: N("Мұрағатта"),
};
export const KIND_LABEL: Record<string, string> = {
  python: N("Python"), sql: N("SQL"), javascript: N("JavaScript"), html_css: N("HTML/CSS"), quiz: N("Тест"), file: N("Файл"), project: N("Жобалық жұмыс"),
};
export const DIFFICULTY_LABEL: Record<string, string> = { easy: N("Жеңіл"), medium: N("Орташа"), hard: N("Күрделі") };
export const ROLE_LABEL: Record<string, string> = { school_admin: N("Мектеп әкімшісі"), teacher: N("Мұғалім"), student: N("Оқушы") };
export const PLAN_LABEL: Record<string, string> = { starter: N("STARTER"), pro: N("PRO"), enterprise: N("ENTERPRISE") };
export const LICENSE_STATE_LABEL: Record<string, string> = {
  active: N("Белсенді"), expired: N("Мерзімі өткен"), suspended: N("Тоқтатылған"), org_suspended: N("Ұйым тоқтатылған"), none: N("Лицензия жоқ"),
};
