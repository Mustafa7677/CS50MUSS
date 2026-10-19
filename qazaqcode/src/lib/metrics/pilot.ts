// Пилот есебі: pilot_report JSON -> Report (бар PDF/XLSX инфрақұрылымы). Тек жиынтық: оқушы/мұғалім аттары жоқ.
import type { Report, Sheet } from "../reports/types";
import { HEALTH_WEIGHTS, SMALL_N, recommendations, fmtShare } from "./health";
import type { PilotData } from "./types";

const TEXT = (header: string, width: number) => ({ header, type: "text" as const, width });
const BAND: Record<string, string> = { good: "жақсы", watch: "бақылау керек", risk: "қауіп", no_data: "ұпай жоқ" };
const share = (v: number | null) => (v == null ? "дерек жоқ" : fmtShare(v));

export function pilotRecommendations(p: PilotData): string[] {
  return recommendations({
    students: p.students, activeStudents: p.active_students, expected: p.expected, completed: p.completed,
    completedWithDeadline: p.completed_with_deadline, onTime: p.on_time, maxStudents: p.max_students,
    hasActivity: p.has_activity, hardAssignments: p.hard_assignments, lowCompletion: p.low_completion,
    studentsBelow50: p.students_below_50, gradedStudents: p.graded_students,
  });
}

export function buildPilotReport(p: PilotData, now = new Date()): Report {
  const c = p.components;
  const summary: Sheet = {
    name: "Қорытынды", title: "Негізгі көрсеткіштер",
    columns: [TEXT("Көрсеткіш", 46), TEXT("Мән", 30)],
    rows: [
      ["Белсенді оқушылар (кезеңде кіргендер)", `${p.active_students} / ${p.students}`],
      ["Белсенді мұғалімдер (кезеңде кіргендер)", `${p.active_teachers} / ${p.teachers}`],
      ["Кезеңде жарияланған/мұрағаттағы тапсырмалар", p.assignments],
      ["Оның ішінде тесттер", p.quizzes],
      ["Кезеңде жіберілген жұмыстар", p.submissions],
      ["Орындалу үлесі (мерзімі өткен тапсырмалар бойынша)", p.expected > 0 ? `${share(c.completion)} (${p.completed} / ${p.expected})` : "дерек жоқ"],
      ["Мерзімінде жіберу үлесі", p.completed_with_deadline > 0 ? `${share(c.timeliness)} (${p.on_time} / ${p.completed_with_deadline})` : "дерек жоқ"],
      ["Орташа баға (үздік әрекет, %)", p.avg_grade_pct == null ? "дерек жоқ" : `${p.avg_grade_pct}% (${p.avg_grade_n} баға)`],
      ["Орташа нәтижесі 50%-дан төмен оқушылар", p.graded_students > 0 ? `${p.students_below_50} / ${p.graded_students} (аттарсыз)` : "дерек жоқ"],
      ["Ұйым денсаулығы (ұпай)", p.score == null ? "ұпай жоқ" : `${p.score} / 100 (${BAND[p.band]})`],
    ],
  };
  const days: Sheet = {
    name: "Белсенді күндер", title: "Ең белсенді күндер (жүйеге кірген қолданушы саны)", emptyNote: "Кезеңде белсенділік журналында дерек жоқ.",
    columns: [TEXT("Күні", 16), { header: "Белсенді қолданушы", type: "int", width: 22 }],
    rows: p.top_days.map((d) => [d.day, d.users]),
  };
  const hard: Sheet = {
    name: "Қиындықтар", title: "Қиындықтар", emptyNote: "Айқын қиын не орындалмаған тапсырма табылмады (шарт: кемінде 3 оқушы).",
    columns: [TEXT("Түрі", 26), TEXT("Тапсырма", 44), TEXT("Көрсеткіш", 26)],
    rows: [
      ...p.hard_assignments.map((h) => ["Орташа нәтиже төмен", h.title, `${h.avg_pct}% (${h.n} оқушы)`]),
      ...p.low_completion.map((l) => ["Орындалуы төмен", l.title, `${l.completed} / ${l.expected} оқушы`]),
    ],
  };
  const recs: Sheet = {
    name: "Ұсыныстар", title: "Ұсыныстар (нақты сандардан автоматты ережелермен)",
    columns: [TEXT("Ұсыныс", 100)],
    rows: pilotRecommendations(p).map((r) => [r]),
  };
  const notes: Sheet = {
    name: "Түсініктеме", title: "Әдіснама және құпиялылық",
    columns: [TEXT("Ескерту", 100)],
    rows: [
      ["Барлық сан дерекқордан есептелген; болжам, баға не кіріс жорамалы жоқ."],
      ["Есепте оқушылар мен мұғалімдердің аттары, e-mail-дері не жеке нәтижелері жоқ: тек жиынтық сандар."],
      [`Белсенділік = күнде жүйеге бір рет кіргені туралы белгі (мазмұн, IP, құрылғы сақталмайды). Күн - Asia/Almaty бойынша.`],
      [`Денсаулық ұпайы салмақтары: белсенді үлес ${HEALTH_WEIGHTS.active_share}, орындау ${HEALTH_WEIGHTS.completion}, уақтылылық ${HEALTH_WEIGHTS.timeliness}, лимит қолдану ${HEALTH_WEIGHTS.seats}. Толық формула: docs/METRICS.md.`],
      ...(p.students < SMALL_N ? [[`Шағын таңдама: оқушы саны ${SMALL_N}-дан аз, көрсеткіштер ақпараттық сипатта.`]] : []),
      ...(p.is_demo ? [["ДЕМО: бұл ойдан құрастырылған сынақ ұйымы, нақты клиент нәтижесі емес."]] : []),
    ],
  };
  return {
    title: p.is_demo ? "Пилот есебі (ДЕМО)" : "Пилот есебі", orgName: p.is_demo ? `${p.org_name} (ДЕМО)` : p.org_name,
    generatedAt: now, range: { from: p.from, to: p.to }, fileBase: "pilot-esebi", sheets: [summary, days, hard, recs, notes],
  };
}
