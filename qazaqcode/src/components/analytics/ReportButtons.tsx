/**
 * Есеп жүктеу: күн аралығы формасы (GET). Батырма format мәнін жібереді; жауап attachment болғандықтан бет ауысмайды.
 * Бос күн = барлық уақыт.
 */
export function ReportButtons({ action, id = "rep" }: { action: string; id?: string }) {
  return (
    <form method="get" action={action} className="card flex flex-wrap items-end gap-3 p-4" aria-label="Есеп жүктеу" data-testid="report-form">
      <div>
        <label className="label" htmlFor={`${id}-from`}>Басталуы</label>
        <input id={`${id}-from`} name="from" type="date" className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`${id}-to`}>Аяқталуы</label>
        <input id={`${id}-to`} name="to" type="date" className="input" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="format" value="xlsx" className="btn-primary" data-testid="report-xlsx">Excel жүктеу</button>
        <button type="submit" name="format" value="pdf" className="btn-secondary" data-testid="report-pdf">PDF жүктеу</button>
      </div>
      <p className="hint basis-full">Күндерді таңдамасаңыз - барлық уақыт. Аралық 366 күннен аспауы тиіс.</p>
    </form>
  );
}
