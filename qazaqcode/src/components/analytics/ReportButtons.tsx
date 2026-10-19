
import { getT } from "@/lib/i18n";/**
 * Есеп жүктеу: күн аралығы формасы (GET). Батырма format мәнін жібереді; жауап attachment болғандықтан бет ауысмайды.
 * Бос күн = барлық уақыт.
 */
export async function ReportButtons({ action, id = "rep" }: { action: string; id?: string }) { const t = await getT();
  return (
    <form method="get" action={action} className="card flex flex-wrap items-end gap-3 p-4" aria-label={t("Есеп жүктеу")} data-testid="report-form">
      <div>
        <label className="label" htmlFor={`${id}-from`}>{t("Басталуы")}</label>
        <input id={`${id}-from`} name="from" type="date" className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`${id}-to`}>{t("Аяқталуы")}</label>
        <input id={`${id}-to`} name="to" type="date" className="input" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="format" value="xlsx" className="btn-primary" data-testid="report-xlsx">{t("Excel жүктеу")}</button>
        <button type="submit" name="format" value="pdf" className="btn-secondary" data-testid="report-pdf">{t("PDF жүктеу")}</button>
      </div>
      <p className="hint basis-full">{t("Күндерді таңдамасаңыз - барлық уақыт. Аралық 366 күннен аспауы тиіс.")}</p>
    </form>
  );
}
