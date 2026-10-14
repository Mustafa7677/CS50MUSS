import { Banner } from "@/components/ui";
import { safeErrText } from "@/lib/errors";

const OK: Record<string, string> = {
  created: "Сынып ашылды. Төмендегі кодты оқушыларға беріңіз.",
  code: "Қосылу коды жаңартылды. Ескі код енді жұмыс істемейді.",
  removed: "Оқушы сыныптан шығарылды.",
  saved: "Тапсырма жоба ретінде сақталды.",
  published: "Тапсырма жарияланды.",
  archived: "Тапсырма мұрағатқа жіберілді.",
  restored: "Тапсырма жобаға қайтарылды.",
  duplicated: "Көшірме жоба ретінде жасалды. Қажет болса, сыныпқа беріңіз.",
};
/** ?ok= және ?err= параметрлерінен хабарлама (сервер әрекеттерінің нәтижесі) */
export function Notices({ ok, err }: { ok?: string; err?: string }) {
  return (
    <>
      {err && <Banner tone="bad">{safeErrText(err.slice(0, 300))}</Banner>}
      {ok && OK[ok] && <Banner tone="info">{OK[ok]}</Banner>}
    </>
  );
}
