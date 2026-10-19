import { withUser } from "@/lib/db";
import type { OrgHealth, PilotData, PlatformKpis } from "./types";

// Барлық аналитика дерекқордағы SECURITY DEFINER функциялар арқылы: құқықты (SUPER ADMIN / сол мектеп әкімшісі) дерекқор тексереді.
export const platformKpis = (userId: string, days: number, includeDemo: boolean) =>
  withUser(userId, async (q) => (await q<{ r: PlatformKpis }>("select public.platform_kpis($1, $2, 12) as r", [days, includeDemo]))[0].r);

export const platformOrgHealth = (userId: string, days: number, includeDemo: boolean) =>
  withUser(userId, async (q) => (await q<{ r: OrgHealth[] }>("select public.platform_org_health($1, $2) as r", [days, includeDemo]))[0].r);

export const orgHealth = (userId: string, orgId: string, days: number) =>
  withUser(userId, async (q) => (await q<{ r: OrgHealth }>("select public.org_health($1, $2) as r", [orgId, days]))[0].r);

export const pilotReport = (userId: string, orgId: string, from: string, to: string) =>
  withUser(userId, async (q) => (await q<{ r: PilotData }>("select public.pilot_report($1, $2::date, $3::date) as r", [orgId, from, to]))[0].r);

export const auditMetricsExport = (userId: string, orgId: string | null, kind: "pilot_pdf" | "pilot_xlsx" | "platform_csv") =>
  withUser(userId, async (q) => { await q("select public.audit_metrics_export($1, $2)", [orgId, kind]); });

/** Бүгінгі күн Asia/Almaty бойынша (дерекқордың metrics_today() сияқты) */
export const almatyToday = (d = new Date()): string => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty" }).format(d);
export const shiftDay = (iso: string, n: number): string => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
