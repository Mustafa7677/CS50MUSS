import Link from "next/link";
import { STATUS_LABEL } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  const c = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "bad" ? "text-red-600" : "text-brand";
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${c}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

const TONES: Record<string, string> = {
  graded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  submitted: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  under_review: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  not_started: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  archived: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  expired: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  org_suspended: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  none: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`badge ${TONES[status] ?? TONES.none}`}>{label ?? STATUS_LABEL[status] ?? status}</span>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div aria-hidden className="mb-3 text-4xl">📭</div>
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Banner({ tone = "warn", children }: { tone?: "warn" | "bad" | "info"; children: React.ReactNode }) {
  const c = tone === "bad" ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    : tone === "info" ? "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
    : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100";
  return <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return <Link href={href} className={variant === "primary" ? "btn-primary" : "btn-secondary"}>{children}</Link>;
}
