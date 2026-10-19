// Ұйым денсаулығы (health score): таза функциялар. SQL-дағы public.org_health_calc формуласының айнасы (docs/METRICS.md).
// Бұл файл ештеңеге тәуелді емес: unit-тесттер тікелей импорттайды. Формуланы өзгертсеңіз, миграциядағы SQL-ды да өзгертіңіз.

export const HEALTH_WEIGHTS = { active_share: 35, completion: 30, timeliness: 15, seats: 20 } as const;
/** Лицензиядағы орынның осы үлесін толтырған ұйым «толық қолданады» деп саналады (келісім, өлшеу емес). */
export const SEAT_TARGET = 0.5;
export const GOOD_FROM = 70;
export const WATCH_FROM = 40;
/** Оқушы саны осыдан аз болса көрсеткіш статистикалық сенімсіз (шағын n). */
export const SMALL_N = 10;

export type HealthInput = {
  students: number;
  activeStudents: number;
  expected: number;
  completed: number;
  completedWithDeadline: number;
  onTime: number;
  maxStudents: number | null;
};
export type Band = "good" | "watch" | "risk" | "no_data";
export type Components = { active_share: number | null; completion: number | null; timeliness: number | null; seats: number | null };
export type HealthResult = { components: Components; score: number | null; band: Band; smallN: boolean };

export function bandOf(score: number | null): Band {
  return score == null ? "no_data" : score >= GOOD_FROM ? "good" : score >= WATCH_FROM ? "watch" : "risk";
}

export function healthComponents(i: HealthInput): Components {
  return {
    active_share: i.students > 0 ? i.activeStudents / i.students : null,
    completion: i.expected > 0 ? i.completed / i.expected : null,
    timeliness: i.completedWithDeadline > 0 ? i.onTime / i.completedWithDeadline : null,
    seats: i.maxStudents != null && i.maxStudents > 0 ? Math.min(1, i.students / i.maxStudents / SEAT_TARGET) : null,
  };
}

/** Ұпай = round(100 * Σ(салмақ*құрамдас) / Σ(салмақ)), тек есептеуге болатын құрамдастар бойынша; белсенді үлес жоқ болса (оқушы 0) - ұпай жоқ. */
export function healthScore(i: HealthInput): HealthResult {
  const components = healthComponents(i);
  let w = 0, sum = 0;
  for (const k of Object.keys(HEALTH_WEIGHTS) as (keyof Components)[]) {
    const v = components[k];
    if (v != null) { w += HEALTH_WEIGHTS[k]; sum += HEALTH_WEIGHTS[k] * v; }
  }
  const score = components.active_share == null || w === 0 ? null : Math.round((100 * sum) / w);
  return { components, score, band: bandOf(score), smallN: i.students < SMALL_N };
}

/** 0..1 -> «53%» (бүтін); null -> «-» */
export const fmtShare = (v: number | null | undefined): string => (v == null ? "-" : `${Math.round(v * 100)}%`);

/** Retention ұяшығы: белсенді / когорт көлемі (0..1); болашақ апта (null) не бос когорт -> null */
export function retentionShare(active: number | null | undefined, size: number): number | null {
  return active == null || size <= 0 ? null : active / size;
}

// ---------- Пилот есебінің ұсыныстары: тек нақты сандардан шығатын ережелер, ойдан шығарылған тұжырым жоқ ----------
export type PilotLike = HealthInput & {
  hasActivity: boolean;
  hardAssignments: { title: string; avg_pct: number; n: number }[];
  lowCompletion: { title: string; expected: number; completed: number }[];
  studentsBelow50: number;
  gradedStudents: number;
};

export function recommendations(p: PilotLike): string[] {
  const out: string[] = [];
  const c = healthComponents(p);
  if (!p.hasActivity) {
    out.push("Кезеңде белсенділік журналында дерек жоқ: пилот басталмаған не журнал жаңа қосылған. Алдымен мұғалімдер мен оқушылардың жүйеге кіруін қамтамасыз етіңіз.");
    return out;
  }
  if (p.students < SMALL_N) out.push(`Оқушы саны аз (${p.students}): көрсеткіштер ақпараттық, статистикалық қорытынды жасауға ерте. Пилотты кеңейту ұсынылады.`);
  if (c.active_share != null && c.active_share < 0.5) out.push(`Оқушылардың тек ${fmtShare(c.active_share)} кезеңде жүйеге кірген. Мұғалімге сабақта платформаны жоспарлы қолдану және сынып кодын қайта таныстыру ұсынылады.`);
  if (c.completion != null && c.completion < 0.6) out.push(`Мерзімі өткен тапсырмалардың орындалу үлесі ${fmtShare(c.completion)}. Тапсырма санын азайтып, мерзімді нақтылау және еске салу ұсынылады.`);
  if (c.timeliness != null && c.timeliness < 0.7) out.push(`Жұмыстардың ${fmtShare(c.timeliness)} ғана мерзімінде жіберілген. Мерзімді сабақ кестесімен үйлестіру ұсынылады.`);
  for (const h of p.hardAssignments.slice(0, 2)) out.push(`«${h.title}» тапсырмасында орташа нәтиже ${h.avg_pct}% (${h.n} оқушы): тақырыпты қайта түсіндіру не жеңілірек жаттығу қосу ұсынылады.`);
  for (const l of p.lowCompletion.slice(0, 2)) out.push(`«${l.title}» тапсырмасын ${l.completed}/${l.expected} оқушы ғана орындаған: нұсқаулықты және мерзімді тексеріңіз.`);
  if (p.studentsBelow50 > 0) out.push(`${p.studentsBelow50} оқушының орташа нәтижесі 50%-дан төмен (бағаланған ${p.gradedStudents} оқушының ішінде): қосымша қолдау ұйымдастыру ұсынылады. Аттары есепте көрсетілмейді.`);
  if (c.seats != null && c.seats < 0.5) out.push("Лицензиядағы оқушы орындарының аз бөлігі қолданылуда: көбірек сыныпты қосу не лицензия көлемін қайта қарау мүмкіндігін талқылаңыз.");
  if (out.length === 0) out.push("Айқын қауіп белгілері табылмады: белсенділік пен орындау қалыпты. Бақылауды жалғастырыңыз.");
  return out;
}
