import Link from "next/link";
import { unsubscribeAction } from "./actions";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Хат алудан бас тарту"), robots: { index: false, follow: false } }; }
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ s?: string }> }) { const t = await getT();
  const { token } = await params;
  const s = (await searchParams).s;
  const valid = /^[0-9a-f]{36}$/.test(token);
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-md p-7">
        {s === "done" ? (
          <>
            <h1 className="text-2xl font-bold" data-testid="unsub-done">{t("Бас тарту орындалды")}</h1>
            <p className="mt-2 text-sm text-ink-muted">{t("Бұл мекенжайға QazaqCode хаттары енді жіберілмейді. Қате болса, мектеп әкімшісіне не қолдау қызметіне хабарласыңыз.")}</p>
          </>
        ) : s === "rate" ? (
          <>
            <h1 className="text-2xl font-bold">{t("Тым жиі әрекет")}</h1>
            <p className="mt-2 text-sm text-ink-muted">{t("Бірнеше минуттан кейін қайталаңыз.")}</p>
          </>
        ) : !valid || s === "invalid" ? (
          <>
            <h1 className="text-2xl font-bold" data-testid="unsub-invalid">{t("Сілтеме жарамсыз")}</h1>
            <p className="mt-2 text-sm text-ink-muted">{t("Бас тарту сілтемесі қате немесе ескірген. Хаттың төменгі жағындағы сілтемені қайта ашып көріңіз.")}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{t("Хат алудан бас тарту")}</h1>
            <p className="mt-2 text-sm text-ink-muted">{t("Растасаңыз, осы сілтеме жіберілген e-mail мекенжайына QazaqCode платформасынан хат жіберу тоқтатылады.")}</p>
            <form action={unsubscribeAction} className="mt-5 flex gap-2">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary">{t("Бас тартуды растау")}</button>
              <Link href="/" className="btn-secondary">{t("Бас тартпау")}</Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
