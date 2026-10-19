"use client";
import { useT } from "@/lib/i18n/client";
export default function SchoolError({ reset }: { error: Error; reset: () => void }) { const t = useT();
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center" role="alert">
      <h1 className="text-lg font-bold">{t("Бетті жүктеу мүмкін болмады")}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t("Күтпеген қате болды. Қайталап көріңіз; қате сақталса, платформа әкімшісіне хабарласыңыз.")}</p>
      <button type="button" onClick={reset} className="btn-primary mt-4">{t("Қайталау")}</button>
    </div>
  );
}
