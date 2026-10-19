"use client";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { activateOrderAction, issueInvoiceAction, markPaidAction, quoteCustomAction, quoteFromListAction, rejectOrderAction } from "@/app/admin/orders/actions";

/** Тапсырыс күйіне сай SUPER ADMIN әрекеттері. Қауіпті/қайтарылмайтын әрекеттер растау диалогымен. */
export function OrderActions({ id, status, today }: { id: string; status: string; today: string }) {
  const open = status === "requested" || status === "quoted" || status === "invoiced";
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {(status === "requested" || status === "quoted") && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ActionForm action={quoteFromListAction} submitLabel={status === "quoted" ? "Бағаны тізімнен қайта ұсыну" : "Баға тізімінен ұсыну"} submitClassName="btn-secondary">
            <input type="hidden" name="id" value={id} />
            <label className="label" htmlFor={`qn-${id}`}>Мектепке ескертпе</label>
            <input id={`qn-${id}`} name="note" className="input" maxLength={1000} />
          </ActionForm>
          <details className="rounded-lg border border-line p-3">
            <summary className="cursor-pointer text-sm font-semibold">Келісілген бағамен ұсыну</summary>
            <ActionForm action={quoteCustomAction} submitLabel="Келісілген бағаны ұсыну" submitClassName="btn-secondary" className="mt-3">
              <input type="hidden" name="id" value={id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label" htmlFor={`qa-${id}`}>Сома</label><input id={`qa-${id}`} name="amount" className="input" required inputMode="decimal" placeholder="мысалы 1 250 000,00" /></div>
                <div><label className="label" htmlFor={`qc-${id}`}>Валюта</label>
                  <select id={`qc-${id}`} name="currency" className="input" defaultValue="KZT"><option>KZT</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
                <div><label className="label" htmlFor={`qv-${id}`}>ҚҚС режимі</label>
                  <select id={`qv-${id}`} name="vat_mode" className="input" defaultValue="none"><option value="none">ҚҚС жоқ</option><option value="included">Баға ҚҚС-пен</option><option value="added">ҚҚС үстіне</option></select></div>
                <div><label className="label" htmlFor={`qr-${id}`}>ҚҚС ставкасы, %</label><input id={`qr-${id}`} name="vat_rate" className="input" inputMode="decimal" placeholder="ҚҚС болса ғана" /></div>
                <div className="sm:col-span-2"><label className="label" htmlFor={`qm-${id}`}>Мектепке ескертпе</label><input id={`qm-${id}`} name="note" className="input" maxLength={1000} /></div>
              </div>
            </ActionForm>
          </details>
        </div>
      )}
      {status === "quoted" && (
        <ConfirmButton action={issueInvoiceAction} fields={{ id }} label="Шот беру" className="btn-primary" danger={false} title="Шот беру?"
          message="Шоттың нөмірі беріледі, баға мен реквизиттер снапшоты қатады: кейін өзгертуге болмайды. Сатушы профилі толтырылған болуы тиіс." confirmLabel="Шот беру" />
      )}
      {status === "invoiced" && (
        <ActionForm action={markPaidAction} submitLabel="Төленді деп белгілеу" submitClassName="btn-primary">
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor={`pr-${id}`}>Төлем құжатының нөмірі (банк)</label><input id={`pr-${id}`} name="ref" className="input" required maxLength={100} /></div>
            <div><label className="label" htmlFor={`pd-${id}`}>Төлем күні</label><input id={`pd-${id}`} name="date" type="date" className="input" required defaultValue={today} max={today} /></div>
          </div>
          <p className="hint mt-2">Төлемді банк көшірмесінен тексеріп белгілеңіз: онлайн-төлем жоқ.</p>
        </ActionForm>
      )}
      {status === "paid" && (
        <ConfirmButton action={activateOrderAction} fields={{ id }} label="Лицензияны активтендіру" className="btn-primary" danger={false} title="Лицензияны активтендіру?"
          message="Лицензия мерзімі ұзарады, пакет пен лимиттер тапсырыстағыдай қойылады. Тоқтатылған лицензия не ұйым өздігінен қосылмайды." confirmLabel="Активтендіру" />
      )}
      {open && (
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-semibold text-red-700 dark:text-red-300">Қабылдамау</summary>
          <ActionForm action={rejectOrderAction} submitLabel="Тапсырысты қабылдамау" submitClassName="btn-danger" className="mt-3">
            <input type="hidden" name="id" value={id} />
            <label className="label" htmlFor={`rj-${id}`}>Себебі (мектепке көрінеді)</label>
            <input id={`rj-${id}`} name="note" className="input" maxLength={1000} />
          </ActionForm>
        </details>
      )}
    </div>
  );
}
