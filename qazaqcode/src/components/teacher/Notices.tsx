import { Banner } from "@/components/ui";
import { safeErrText } from "@/lib/errors";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

const OK = (t: TFn): Record<string, string> => ({
  created: t("Сынып ашылды. Төмендегі кодты оқушыларға беріңіз."),
  code: t("Қосылу коды жаңартылды. Ескі код енді жұмыс істемейді."),
  removed: t("Оқушы сыныптан шығарылды."),
  saved: t("Тапсырма жоба ретінде сақталды."),
  published: t("Тапсырма жарияланды."),
  archived: t("Тапсырма мұрағатқа жіберілді."),
  restored: t("Тапсырма жобаға қайтарылды."),
  duplicated: t("Көшірме жоба ретінде жасалды. Қажет болса, сыныпқа беріңіз."),
});
/** ?ok= және ?err= параметрлерінен хабарлама (сервер әрекеттерінің нәтижесі) */
export async function Notices({ ok, err }: { ok?: string; err?: string }) { const t = await getT();
  return (
    <>
      {err && <Banner tone="bad">{t(safeErrText(err.slice(0, 300)) ?? "")}</Banner>}
      {ok && OK(t)[ok] && <Banner tone="info">{OK(t)[ok]}</Banner>}
    </>
  );
}
