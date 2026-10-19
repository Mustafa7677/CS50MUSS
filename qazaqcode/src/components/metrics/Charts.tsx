import type { Cohort, DailyPoint, FunnelStep } from "@/lib/metrics/types";
import { retentionShare, bandOf, type Band } from "@/lib/metrics/health";
import { getT } from "@/lib/i18n";
import { N } from "@/lib/i18n/core";

// Графиктер: таза SVG/CSS, сыртқы кітапхана жоқ. Түстер тек токендер (brand/accent/ink-muted/line), қараңғы режим мен white-label үшін.
const short = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;

/** DAU бағандары + жылжымалы WAU (тұтас сызық) және MAU (үзік сызық): түс қана емес, сызық түрі де ажыратады */
export async function ActiveUsersChart({ data }: { data: DailyPoint[] }) { const t = await getT();
  const W = 640, H = 220, L = 34, R = 8, T = 10, B = 24;
  const max = Math.max(1, ...data.map((d) => Math.max(d.dau, d.wau, d.mau)));
  const n = data.length;
  const x = (i: number) => L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const bw = Math.max(1.5, ((W - L - R) / Math.max(n, 1)) * 0.6);
  const line = (k: "wau" | "mau") => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  const ticks = [0, Math.round(max / 2), max];
  const last = data[n - 1];
  return (
    <figure className="m-0" data-testid="chart-active-users">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={t("Белсенді қолданушылар: соңғы {n} күн. Бүгін DAU {v}, WAU {v2}, MAU {v3}. Толық деректер кестеде.", { n, v: last?.dau ?? 0, v2: last?.wau ?? 0, v3: last?.mau ?? 0 })}>
        {ticks.map((tt) => (
          <g key={tt}>
            <line x1={L} x2={W - R} y1={y(tt)} y2={y(tt)} className="stroke-current text-line" strokeWidth="1" />
            <text x={L - 4} y={y(tt) + 3} textAnchor="end" fontSize="10" className="fill-current text-ink-muted">{tt}</text>
          </g>
        ))}
        {data.map((d, i) => <rect key={d.day} x={x(i) - bw / 2} y={y(d.dau)} width={bw} height={Math.max(0, H - B - y(d.dau))} className="fill-current text-brand" opacity="0.55"><title>{`${short(d.day)}: DAU ${d.dau}, WAU ${d.wau}, MAU ${d.mau}`}</title></rect>)}
        <path d={line("wau")} fill="none" className="stroke-current text-accent" strokeWidth="2" />
        <path d={line("mau")} fill="none" className="stroke-current text-ink-muted" strokeWidth="2" strokeDasharray="5 3" />
        {[0, Math.floor((n - 1) / 2), n - 1].filter((i, k, a) => i >= 0 && a.indexOf(i) === k).map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="10" className="fill-current text-ink-muted">{short(data[i].day)}</text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span><span aria-hidden className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-brand align-middle opacity-60" />{t("DAU (күндік)")}</span>
        <span><span aria-hidden className="mr-1 inline-block h-0.5 w-4 bg-accent align-middle" />{t("WAU (7 күн)")}</span>
        <span><span aria-hidden className="mr-1 inline-block w-4 border-t-2 border-dashed border-ink-muted align-middle" />{t("MAU (30 күн)")}</span>
      </figcaption>
      <details className="mt-2 text-xs"><summary className="cursor-pointer text-ink-muted">{t("Деректер кестесі")}</summary>
        <div className="table-wrap mt-2 max-h-64"><table className="w-full">
          <caption className="sr-only">{t("Күн сайынғы белсенді қолданушылар")}</caption>
          <thead><tr><th scope="col" className="th">{t("Күні")}</th><th scope="col" className="th">DAU</th><th scope="col" className="th">{t("оқушы")}</th><th scope="col" className="th">{t("мұғалім")}</th><th scope="col" className="th">{t("әкімші")}</th><th scope="col" className="th">WAU</th><th scope="col" className="th">MAU</th></tr></thead>
          <tbody>{[...data].reverse().map((d) => <tr key={d.day} className="border-t border-line"><th scope="row" className="td font-normal">{d.day}</th><td className="td">{d.dau}</td><td className="td">{d.student}</td><td className="td">{d.teacher}</td><td className="td">{d.school_admin}</td><td className="td">{d.wau}</td><td className="td">{d.mau}</td></tr>)}</tbody>
        </table></div>
      </details>
    </figure>
  );
}

export const FUNNEL_LABEL: Record<FunnelStep["key"], string> = {
  leads: N("Пилот сұрауы (лид)"), org: N("Ұйым құрылды"), class: N("≥1 белсенді сынып"), assignment: N("≥1 жарияланған тапсырма"),
  submission: N("≥1 оқушы жұмысы жіберілген"), streak4: N("4 апта қатарынан белсенді"),
};

/** Воронка: көлденең бағандар. Лид пен ұйым арасында тікелей байланыс жоқ (лид ұйымға байланбаған), сондықтан лидтен ұйымға % көрсетілмейді. */
export async function Funnel({ steps }: { steps: FunnelStep[] }) { const t = await getT();
  const max = Math.max(1, ...steps.map((s) => s.count));
  const orgs = steps.find((s) => s.key === "org")?.count ?? 0;
  return (
    <ol className="space-y-3" data-testid="funnel" aria-label={t("Activation воронкасы")}>
      {steps.map((s, i) => {
        const prev = i >= 2 ? steps[i - 1].count : null;
        const conv = prev != null && prev > 0 ? Math.round((s.count / prev) * 100) : null;
        const ofOrgs = i >= 2 && orgs > 0 ? Math.round((s.count / orgs) * 100) : null;
        return (
          <li key={s.key} data-testid={`funnel-${s.key}`}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{i + 1}. {FUNNEL_LABEL[s.key]}</span>
              <span><strong>{s.count}</strong>{conv != null && <span className="ml-2 text-xs text-ink-muted">{t("алдыңғыдан {conv}%", { conv })}{ofOrgs != null && i > 2 ? t(", ұйымдардан {ofOrgs}%", { ofOrgs }) : ""}</span>}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <div className={`h-full rounded-full ${s.key === "leads" ? "bg-ink-muted opacity-60" : "bg-brand"}`} style={{ width: `${(s.count / max) * 100}%`, minWidth: s.count ? 4 : 0 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Retention жылу картасы: ұяшық = белсенді / когорт көлемі; фон интенсивтілігі = үлес (мәтін әрқашан токен-ink, контраст сақталады) */
export async function RetentionTable({ cohorts, weeks, unit }: { cohorts: Cohort[]; weeks: number; unit: string }) { const t = await getT();
  return (
    <div className="table-wrap" data-testid="retention-table">
      <table className="w-full min-w-[640px] border-collapse text-center">
        <caption className="sr-only">{t("Когорттық retention: {unit}, құрылған/алғаш белсенді болған аптасы бойынша", { unit })}</caption>
        <thead><tr><th scope="col" className="th">{t("Когорт (апта)")}</th><th scope="col" className="th">{unit}</th>
          {Array.from({ length: weeks }, (_, i) => <th key={i} scope="col" className="th text-center">{i === 0 ? "0" : `+${i}`}</th>)}</tr></thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.cohort} className="border-t border-line">
              <th scope="row" className="td whitespace-nowrap text-left font-medium">{c.cohort}</th>
              <td className="td">{c.size}{c.size < 5 && <span className="ml-1 text-xs text-ink-muted" title={t("Шағын n: үлестер сенімсіз")}>{t("(шағын n)")}</span>}</td>
              {Array.from({ length: weeks }, (_, i) => {
                const a = c.active[i];
                const s = retentionShare(a, c.size);
                return s == null
                  ? <td key={i} className="td text-ink-muted" aria-label={t("әлі жоқ")}>·</td>
                  : <td key={i} className="td text-xs font-semibold" title={`${a} / ${c.size}`}
                      style={{ background: `color-mix(in srgb, var(--brand) ${Math.round(s * 70)}%, transparent)` }}>{Math.round(s * 100)}%</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const BAND_LABEL: Record<Band, string> = { good: N("Жақсы"), watch: N("Бақылау керек"), risk: N("Қауіп"), no_data: N("Ұпай жоқ") };
const BAND_TONE: Record<Band, string> = {
  good: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  watch: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  risk: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  no_data: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};
/** Ұпай белгісі: түс + мәтін (түске ғана сүйенбейді) */
export function HealthBadge({ score, band }: { score: number | null; band?: Band }) {
  const b = band ?? bandOf(score);
  return <span className={`badge ${BAND_TONE[b]}`} data-testid="health-badge">{score == null ? "-" : score} · {BAND_LABEL[b]}</span>;
}

/** Мектеп әкімшісіне: күн сайынғы белсенді оқушы/мұғалім бағандары */
export async function OrgDailyBars({ data }: { data: { day: string; students: number; teachers: number }[] }) { const t = await getT();
  const max = Math.max(1, ...data.map((d) => Math.max(d.students, d.teachers)));
  const mid = Math.floor(data.length / 2);
  return (
    <figure className="m-0" data-testid="org-daily">
      <div role="img" aria-label={t("Күн сайынғы белсенді оқушылар мен мұғалімдер, соңғы {length} күн. Толық деректер кестеде.", { length: data.length })}>
        <div className="flex h-40 items-end gap-[2px] border-b border-line" aria-hidden>
          {data.map((d) => (
            <div key={d.day} className="flex h-full min-w-0 flex-1 items-end justify-center gap-px" title={t("{short}: оқушы {students}, мұғалім {teachers}", { short: short(d.day), students: d.students, teachers: d.teachers })}>
              <div className="w-1/2 rounded-t-sm bg-brand" style={{ height: `${(d.students / max) * 100}%`, minHeight: d.students ? 2 : 0 }} />
              <div className="w-1/2 rounded-t-sm bg-ink-muted opacity-60" style={{ height: `${(d.teachers / max) * 100}%`, minHeight: d.teachers ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-ink-muted" aria-hidden>
          <span>{data[0] ? short(data[0].day) : ""}</span><span>{data[mid] ? short(data[mid].day) : ""}</span><span>{data.length ? short(data[data.length - 1].day) : ""}</span>
        </div>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span><span aria-hidden className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-brand align-middle" />{t("Белсенді оқушы")}</span>
        <span><span aria-hidden className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-ink-muted align-middle opacity-60" />{t("Белсенді мұғалім")}</span>
        <span>{t("Ең биік мән:")}{" "}{max}</span>
      </figcaption>
      <div className="sr-only"><table>
        <caption>{t("Күн сайынғы белсенді қолданушылар")}</caption>
        <thead><tr><th scope="col">{t("Күні")}</th><th scope="col">{t("Оқушы")}</th><th scope="col">{t("Мұғалім")}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.day}><th scope="row">{d.day}</th><td>{d.students}</td><td>{d.teachers}</td></tr>)}</tbody>
      </table></div>
    </figure>
  );
}
