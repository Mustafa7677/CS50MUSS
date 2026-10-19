"use client";
import { useT } from "@/lib/i18n/client";
export default function StudentError({ reset }: { error: Error; reset: () => void }) { const t = useT();
  return (
    <div role="alert" className="card px-6 py-10 text-center">
      <p className="text-lg font-semibold">{t("Бетті жүктеу мүмкін болмады")}</p>
      <p className="mt-1 text-sm text-ink-muted">{t("Уақытша қате болды. Енгізген деректеріңіз жоғалған жоқ.")}</p>
      <button type="button" className="btn-primary mt-4" onClick={() => reset()}>{t("Қайталау")}</button>
    </div>
  );
}
