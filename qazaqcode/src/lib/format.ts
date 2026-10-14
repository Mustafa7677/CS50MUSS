const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];

export function fmtDate(d: string | Date | null | undefined, withTime = false): string {
  if (!d) return "-";
  const x = typeof d === "string" ? new Date(d) : d;
  if (isNaN(+x)) return "-";
  const date = `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  return withTime ? `${date}, ${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}` : date;
}
export const fmtPct = (n: number | string | null | undefined) => (n == null || n === "" ? "-" : `${Math.round(Number(n))}%`);
export const fmtNum = (n: number | string | null | undefined) => (n == null ? "-" : String(Number(n)));
export function fmtDuration(sec: number | string | null | undefined): string {
  const s = Number(sec ?? 0);
  if (!s) return "-";
  if (s < 60) return `${s} с`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} мин` : `${Math.floor(m / 60)} сағ ${m % 60} мин`;
}
export const STATUS_LABEL: Record<string, string> = {
  not_started: "Басталмаған", in_progress: "Орындалып жатыр", submitted: "Жіберілген", under_review: "Тексеріліп жатыр", graded: "Бағаланған", overdue: "Мерзімі өткен",
  draft: "Жоба", published: "Жарияланған", archived: "Мұрағатта",
};
export const KIND_LABEL: Record<string, string> = {
  python: "Python", sql: "SQL", javascript: "JavaScript", html_css: "HTML/CSS", quiz: "Тест", file: "Файл", project: "Жобалық жұмыс",
};
export const DIFFICULTY_LABEL: Record<string, string> = { easy: "Жеңіл", medium: "Орташа", hard: "Күрделі" };
export const ROLE_LABEL: Record<string, string> = { school_admin: "Мектеп әкімшісі", teacher: "Мұғалім", student: "Оқушы" };
export const PLAN_LABEL: Record<string, string> = { starter: "STARTER", pro: "PRO", enterprise: "ENTERPRISE" };
export const LICENSE_STATE_LABEL: Record<string, string> = {
  active: "Белсенді", expired: "Мерзімі өткен", suspended: "Тоқтатылған", org_suspended: "Ұйым тоқтатылған", none: "Лицензия жоқ",
};
