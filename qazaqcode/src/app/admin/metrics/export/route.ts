import { getContext } from "@/lib/context";
import { almatyToday, auditMetricsExport, platformKpis, platformOrgHealth } from "@/lib/metrics/queries";
import { FUNNEL_LABEL } from "@/components/metrics/Charts";
import { rateLimit } from "@/lib/rate-limit";
import { errorCode } from "@/lib/errors";
import { csvResponse } from "@/app/school/csv";

export const dynamic = "force-dynamic";
const TABLES = ["daily", "funnel", "retention_orgs", "retention_students", "health"] as const;
type T = (typeof TABLES)[number];

/** Метрика CSV: тек SUPER ADMIN, тек жиынтық (жеке деректі жоқ). csvCell мәтіннің алдына ' қойып формула енгізуден қорғайды. Экспорт аудитке жазылады. */
export async function GET(req: Request) {
  const ctx = await getContext();
  if (!ctx) return new Response("Жүйеге кіріңіз", { status: 401 });
  if (!ctx.isPlatformAdmin) return new Response("Рұқсат жоқ", { status: 403 });
  const u = new URL(req.url);
  const t = (u.searchParams.get("t") ?? "daily") as T;
  if (!TABLES.includes(t)) return new Response("t параметрі дұрыс емес", { status: 400 });
  const days = [7, 30, 90].includes(Number(u.searchParams.get("days"))) ? Number(u.searchParams.get("days")) : 30;
  const demo = u.searchParams.get("demo") === "1";
  try {
    await rateLimit("metrics-csv", 20, 60_000, ctx.userId);
    await auditMetricsExport(ctx.userId, null, "platform_csv");      // журналсыз экспорт берілмейді
    const file = (n: string) => `metrika-${n}-${almatyToday()}${demo ? "-demo" : ""}.csv`;
    if (t === "health") {
      const rows = await platformOrgHealth(ctx.userId, 28, demo);
      return csvResponse(file(t), ["Ұйым", "ДЕМО", "Лицензия", "Оқушы", "Белсенді оқушы", "Белсенді үлес %", "Күтілетін орындау", "Орындалған", "Орындау %", "Уақтылылық %", "Лимит қолдану (құрамдас) %", "Ұпай", "Күй", "Шағын n"],
        rows.map((o) => [o.org_name, o.is_demo ? "ДЕМО" : "", o.license_state, o.students, o.active_students, pct(o.components.active_share), o.expected, o.completed, pct(o.components.completion), pct(o.components.timeliness), pct(o.components.seats), o.score ?? "", o.band, o.small_n ? "иә" : "жоқ"]));
    }
    const k = await platformKpis(ctx.userId, days, demo);
    if (t === "daily") return csvResponse(file(t), ["Күні", "DAU", "DAU оқушы", "DAU мұғалім", "DAU әкімші", "WAU", "MAU"], k.daily.map((d) => [d.day, d.dau, d.student, d.teacher, d.school_admin, d.wau, d.mau]));
    if (t === "funnel") return csvResponse(file(t), ["Қадам", "Саны"], k.funnel.map((s) => [FUNNEL_LABEL[s.key], s.count]));
    const cohorts = t === "retention_orgs" ? k.retention_orgs : k.retention_students;
    return csvResponse(file(t), ["Когорт (апта басы)", "Көлемі", ...Array.from({ length: k.weeks }, (_, i) => `Апта +${i}`)],
      cohorts.map((c) => [c.cohort, c.size, ...Array.from({ length: k.weeks }, (_, i) => c.active[i] ?? "")]));
  } catch (e) {
    const code = errorCode(e);
    if (code === "rate_limited") return new Response("Тым жиі сұраныс", { status: 429 });
    if (code === "forbidden") return new Response("Рұқсат жоқ", { status: 403 });
    return new Response("Қате болды", { status: 500 });
  }
}
const pct = (v: number | null) => (v == null ? "" : Math.round(v * 1000) / 10);
