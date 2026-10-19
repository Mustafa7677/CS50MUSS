"use client";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { activateOrderAction, issueInvoiceAction, markPaidAction, quoteCustomAction, quoteFromListAction, rejectOrderAction } from "@/app/admin/orders/actions";
import { useT } from "@/lib/i18n/client";

/** Тапсырыс күйіне сай SUPER ADMIN әрекеттері. Қауіпті/қайтарылмайтын әрекеттер растау диалогымен. */
export function OrderActions({ id, status, today }: { id: string; status: string; today: string }) { const t = useT();
  const open = status === "requested" || status === "quoted" || status === "invoiced";
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {(status === "requested" || status === "quoted") && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ActionForm action={quoteFromListAction} submitLabel={status === "quoted" ? t("Бағаны тізімнен қайта ұсыну") : t("Баға тізімінен ұсыну")} submitClassName="btn-secondary">
            <input type="hidden" name="id" value={id} />
            <label className="label" htmlFor={`qn-${id}`}>{t("Мектепке ескертпе")}</label>
            <input id={`qn-${id}`} name="note" className="input" maxLength={1000} />
          </ActionForm>
          <details className="rounded-lg border border-line p-3">
            <summary className="cursor-pointer text-sm font-semibold">{t("Келісілген бағамен ұсыну")}</summary>
            <ActionForm action={quoteCustomAction} submitLabel={t("Келісілген бағаны ұсыну")} submitClassName="btn-secondary" className="mt-3">
              <input type="hidden" name="id" value={id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label" htmlFor={`qa-${id}`}>{t("Сома")}</label><input id={`qa-${id}`} name="amount" className="input" required inputMode="decimal" placeholder={t("мысалы 1 250 000,00")} /></div>
                <div><label className="label" htmlFor={`qc-${id}`}>{t("Валюта")}</label>
                  <select id={`qc-${id}`} name="currency" className="input" defaultValue="KZT"><option>KZT</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
                <div><label className="label" htmlFor={`qv-${id}`}>{t("ҚҚС режимі")}</label>
                  <select id={`qv-${id}`} name="vat_mode" className="input" defaultValue="none"><option value="none">{t("ҚҚС жоқ")}</option><option value="included">{t("Баға ҚҚС-пен")}</option><option value="added">{t("ҚҚС үстіне")}</option></select></div>
                <div><label className="label" htmlFor={`qr-${id}`}>{t("ҚҚС ставкасы, %")}</label><input id={`qr-${id}`} name="vat_rate" className="input" inputMode="decimal" placeholder={t("ҚҚС болса ғана")} /></div>
                <div className="sm:col-span-2"><label className="label" htmlFor={`qm-${id}`}>{t("Мектепке ескертпе")}</label><input id={`qm-${id}`} name="note" className="input" maxLength={1000} /></div>
              </div>
            </ActionForm>
          </details>
        </div>
      )}
      {status === "quoted" && (
        <ConfirmButton action={issueInvoiceAction} fields={{ id }} label={t("Шот беру")} className="btn-primary" danger={false} title={t("Шот беру?")}
          message={t("Шоттың нөмірі беріледі, баға мен реквизиттер снапшоты қатады: кейін өзгертуге болмайды. Сатушы профилі толтырылған болуы тиіс.")} confirmLabel={t("Шот беру")} />
      )}
      {status === "invoiced" && (
        <ActionForm action={markPaidAction} submitLabel={t("Төленді деп белгілеу")} submitClassName="btn-primary">
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor={`pr-${id}`}>{t("Төлем құжатының нөмірі (банк)")}</label><input id={`pr-${id}`} name="ref" className="input" required maxLength={100} /></div>
            <div><label className="label" htmlFor={`pd-${id}`}>{t("Төлем күні")}</label><input id={`pd-${id}`} name="date" type="date" className="input" required defaultValue={today} max={today} /></div>
          </div>
          <p className="hint mt-2">{t("Төлемді банк көшірмесінен тексеріп белгілеңіз: онлайн-төлем жоқ.")}</p>
        </ActionForm>
      )}
      {status === "paid" && (
        <ConfirmButton action={activateOrderAction} fields={{ id }} label={t("Лицензияны активтендіру")} className="btn-primary" danger={false} title={t("Лицензияны активтендіру?")}
          message={t("Лицензия мерзімі ұзарады, пакет пен лимиттер тапсырыстағыдай қойылады. Тоқтатылған лицензия не ұйым өздігінен қосылмайды.")} confirmLabel={t("Активтендіру")} />
      )}
      {open && (
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-semibold text-red-700 dark:text-red-300">{t("Қабылдамау")}</summary>
          <ActionForm action={rejectOrderAction} submitLabel={t("Тапсырысты қабылдамау")} submitClassName="btn-danger" className="mt-3">
            <input type="hidden" name="id" value={id} />
            <label className="label" htmlFor={`rj-${id}`}>{t("Себебі (мектепке көрінеді)")}</label>
            <input id={`rj-${id}`} name="note" className="input" maxLength={1000} />
          </ActionForm>
        </details>
      )}
    </div>
  );
}
