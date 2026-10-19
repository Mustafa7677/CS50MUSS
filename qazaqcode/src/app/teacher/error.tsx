"use client";
import { useT } from "@/lib/i18n/client";

export default function TeacherError({ reset }: { error: Error; reset: () => void }) { const t = useT();
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center" role="alert">
      <p className="text-lg font-semibold">{t("Бетті ашу мүмкін болмады")}</p>
      <p className="mt-1 text-sm text-ink-muted">{t("Уақытша қате болды. Қайталап көріңіз немесе басқа бөлімге өтіңіз.")}</p>
      <button type="button" onClick={reset} className="btn-primary mt-5">{t("Қайталау")}</button>
    </div>
  );
}
