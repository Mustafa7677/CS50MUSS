import { withUser } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { almatyToday } from "./queries";

// «Бүгін белсенді» белгісі: тәулігіне 1 жол (public.touch_activity, PK user_id+day). Үш қабат қорғаныс:
// 1) процесс ішіндегі кэш (қолданушы+күн): сол күні дерекқорға қайта бармайды;
// 2) rateLimit (қолданушы бойынша): кэш өтіп кетсе де минутына 6 дерекқор сұрауынан көп емес;
// 3) дерекқордағы PK + exists-тексеру: қосарланбайды, мүшелігі бар ұйым ғана жазылады.
// Қате/лимит бетті СЫНДЫРМАЙДЫ (метрика - қосымша функция). Мазмұн, IP, UA жазылмайды.
const seen = new Map<string, string>();
const MAX_CACHE = 50_000;

export async function touchActivity(userId: string, orgId: string | null | undefined): Promise<void> {
  if (!orgId) return;                      // тек платформа әкімшісі (ұйымсыз) - жазылмайды
  const day = almatyToday();
  const key = `${userId}:${orgId}`;
  if (seen.get(key) === day) return;
  try {
    await rateLimit("touch", 6, 60_000, userId);
    await withUser(userId, (q) => q("select public.touch_activity($1)", [orgId]));
    if (seen.size >= MAX_CACHE) seen.clear();
    seen.set(key, day);
  } catch {
    /* метрика бетті бұзбауы тиіс */
  }
}
