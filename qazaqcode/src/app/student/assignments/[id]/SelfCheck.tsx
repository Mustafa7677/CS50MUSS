"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SelfCheckRunner, type CaseResult, type RunPhase, type WorkerLike } from "@/lib/selfcheck/runner";
import { useT } from "@/lib/i18n/client";
import type { TFn } from "@/lib/i18n/core";

// Өріс аты «expected» (дерекқор бағанының аты емес): RSC жүктемесінде жасырын-баған атаулары болмауы тиіс (e2e/security.spec.ts)
export type VisibleTest = { input: string; expected: string };
const WORKER_URL = "/workers/py-runner.js";
const ERR = (t: TFn): Record<string, string> => ({
  load_failed: t("Python ортасы жүктелмеді."), load_timeout: t("Python ортасы уақытында жүктелмеді."), worker_error: t("Python ортасы іске қосылмады."), busy: t("Басқа тексеру жүріп жатыр."),
});
const flag = (v: string, t: TFn) => (v === "" ? t("(бос)") : v);

/** «Жеке тексеру»: Python коды ОҚУШЫНЫҢ ӨЗ браузерінде (Pyodide, web worker) көрінетін тест кейістерімен іске қосылады.
 *  Нәтиже серверге жіберілмейді, баға емес; жасырын кейістер мұнда ешқашан келмейді. */
export function SelfCheck({ code, tests }: { code: string; tests: VisibleTest[] }) { const t = useT();
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [results, setResults] = useState<CaseResult[]>([]);
  const [err, setErr] = useState("");
  const [ranCode, setRanCode] = useState<string | null>(null);
  const [everLoaded, setEverLoaded] = useState(false);
  const runner = useRef<SelfCheckRunner | null>(null);
  const hasTests = tests.length > 0;
  const busy = phase === "loading" || phase === "running";

  useEffect(() => () => runner.current?.cancel(), []);

  async function start() {
    if (runner.current?.isBusy) return;
    setErr(""); setResults([]); setRanCode(code);
    const r = new SelfCheckRunner({
      createWorker: () => new Worker(WORKER_URL) as unknown as WorkerLike,
      onPhase: (p) => { setPhase(p); if (p === "running") setEverLoaded(true); },
      onCase: (c) => setResults((prev) => [...prev, c]),
    });
    runner.current = r;
    const cases = hasTests ? tests.map((tt) => ({ input: tt.input, expected: tt.expected })) : [{ input: "", expected: null }];
    const out = await r.run(code, cases);
    if (!out.ok) setErr(`${ERR(t)[out.reason] ?? t("Қате.")} ${out.message}`);
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const stale = ranCode !== null && ranCode !== code && !busy;
  const summary = useMemo(() => {
    if (phase !== "done" || !hasTests) return null;
    return t("{passed} / {length} көрінетін тест өтті", { passed, length: tests.length });
  }, [phase, hasTests, passed, tests.length]);

  return (
    <section className="card space-y-3 p-4" aria-label={t("Жеке тексеру")} data-testid="selfcheck">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{t("Сынап көру")}{" "}<span className="badge ml-1 bg-surface-2 align-middle text-ink-muted">{t("жеке тексеру")}</span></h3>
        <div className="flex gap-2">
          {busy && <button type="button" className="btn-secondary px-3 py-1" onClick={() => runner.current?.cancel()} data-testid="selfcheck-stop">{t("Тоқтату")}</button>}
          <button type="button" className="btn-primary px-4 py-1.5" disabled={busy || code.trim() === ""} onClick={() => void start()} data-testid="selfcheck-run">
            {busy ? t("Жұмыс істеуде...") : t("▶ Сынап көру")}
          </button>
        </div>
      </div>
      <p className="text-sm text-ink-muted" data-testid="selfcheck-note">
        {t("Бұл —")}{" "}<strong>{t("жеке тексеру, түпкілікті баға емес")}</strong>{t(". Код тек сіздің браузеріңізде орындалады, нәтиже серверге жіберілмейді.{v}", { v: hasTests ? (" " + t("Тек көрінетін мысалдар тексеріледі; мұғалімнің бағасы мен жасырын тесттер басқа.")) : (" " + t("Көрінетін тест жоқ: код бір рет іске қосылып, шығысы көрсетіледі.")) })}
      </p>
      {!everLoaded && phase === "idle" && <p className="hint" data-testid="selfcheck-size">{t("Алғашқы іске қосуда Python ортасы (~13 МБ) жүктеледі, кейін браузер кэшінен ашылады. Мобильді трафикті ескеріңіз.")}</p>}
      {phase === "loading" && (
        <p role="status" className="flex items-center gap-2 text-sm" data-testid="selfcheck-loading">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
          {t("Python ортасы жүктелуде (~13 МБ)... Баяу желіде бірнеше минут алуы мүмкін.")}
        </p>
      )}
      {phase === "running" && <p role="status" className="text-sm" data-testid="selfcheck-running">{t("Код орындалуда...")}</p>}
      {err && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200" data-testid="selfcheck-error">
          {err} <button type="button" className="underline" onClick={() => void start()}>{t("Қайталау")}</button>
          <p className="mt-1 text-xs">{t("Жұмысыңызға әсер етпейді: «Жіберу» бұған тәуелді емес.")}</p>
        </div>
      )}
      {summary && <p className="text-lg font-bold" data-testid="selfcheck-summary" aria-live="polite">{summary} <span className="text-sm font-normal text-ink-muted">{t("(жеке тексеру)")}</span></p>}
      {stale && <p className="text-sm text-amber-700 dark:text-amber-300" data-testid="selfcheck-stale">{t("Код өзгерді: төмендегі нәтиже ескірген. Қайта сынап көріңіз.")}</p>}
      {results.length > 0 && (
        <ol className="space-y-2" data-testid="selfcheck-results">
          {results.map((r) => {
            const tt = hasTests ? tests[r.index] : null;
            const ok = r.status === "pass";
            const tone = ok ? "border-emerald-300 dark:border-emerald-800" : r.status === "ran" || r.status === "skipped" ? "border-line" : "border-red-300 dark:border-red-800";
            const label = { pass: t("Өтті ✓"), fail: t("Өтпеді ✗"), error: t("Қате ✗"), timeout: t("Уақыт өтті ✗"), skipped: t("Орындалмады"), ran: t("Орындалды") }[r.status];
            return (
              <li key={r.index} className={`min-w-0 rounded-lg border p-3 text-sm ${tone}`} data-testid={`selfcheck-case-${r.status}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{hasTests ? t("Мысал {v}", { v: r.index + 1 }) : t("Нәтиже")}: {label}</span>
                  {r.status !== "skipped" && <span className="text-xs text-ink-muted">{r.ms}{" "}{t("мс")}</span>}
                </div>
                {tt && <p className="mt-1 text-xs text-ink-muted">{t("Кіріс:")}{" "}<code className="break-all font-mono">{flag(tt.input, t).replace(/\n/g, " ⏎ ")}</code></p>}
                {r.error && <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-red-50 p-2 font-mono text-xs text-red-800 dark:bg-red-950 dark:text-red-200">{r.error}</pre>}
                {r.status === "fail" && tt && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="min-w-0"><p className="text-xs text-ink-muted">{t("Күтілетін нәтиже")}</p><pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-xs">{flag(tt.expected, t)}</pre></div>
                    <div className="min-w-0"><p className="text-xs text-ink-muted">{t("Сіздің шығысыңыз")}</p><pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-xs" data-testid="selfcheck-actual">{flag(r.stdout, t)}</pre></div>
                    {r.diff.length > 0 && (
                      <ul className="col-span-full list-disc pl-5 text-xs" data-testid="selfcheck-diff">
                        {r.diff.map((d) => <li key={d.line}>{d.line}{t("-жол: күтілген")}{" "}<code className="font-mono">{d.expected == null ? t("(жол жоқ)") : flag(d.expected, t)}</code>{t(", шыққан")}{" "}<code className="font-mono">{d.actual == null ? t("(жол жоқ)") : flag(d.actual, t)}</code></li>)}
                      </ul>
                    )}
                  </div>
                )}
                {r.status === "ran" && <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-xs" data-testid="selfcheck-actual">{flag(r.stdout, t)}</pre>}
                {r.stderr && <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-amber-50 p-2 font-mono text-xs dark:bg-amber-950">{r.stderr}</pre>}
                {r.truncated && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t("Шығыс 64 КБ-қа дейін қысқартылды.")}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
