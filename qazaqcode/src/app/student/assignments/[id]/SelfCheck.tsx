"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SelfCheckRunner, type CaseResult, type RunPhase, type WorkerLike } from "@/lib/selfcheck/runner";

// Өріс аты «expected» (дерекқор бағанының аты емес): RSC жүктемесінде жасырын-баған атаулары болмауы тиіс (e2e/security.spec.ts)
export type VisibleTest = { input: string; expected: string };
const WORKER_URL = "/workers/py-runner.js";
const ERR: Record<string, string> = {
  load_failed: "Python ортасы жүктелмеді.", load_timeout: "Python ортасы уақытында жүктелмеді.", worker_error: "Python ортасы іске қосылмады.", busy: "Басқа тексеру жүріп жатыр.",
};
const flag = (v: string) => (v === "" ? "(бос)" : v);

/** «Жеке тексеру»: Python коды ОҚУШЫНЫҢ ӨЗ браузерінде (Pyodide, web worker) көрінетін тест кейістерімен іске қосылады.
 *  Нәтиже серверге жіберілмейді, баға емес; жасырын кейістер мұнда ешқашан келмейді. */
export function SelfCheck({ code, tests }: { code: string; tests: VisibleTest[] }) {
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
    const cases = hasTests ? tests.map((t) => ({ input: t.input, expected: t.expected })) : [{ input: "", expected: null }];
    const out = await r.run(code, cases);
    if (!out.ok) setErr(`${ERR[out.reason] ?? "Қате."} ${out.message}`);
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const stale = ranCode !== null && ranCode !== code && !busy;
  const summary = useMemo(() => {
    if (phase !== "done" || !hasTests) return null;
    return `${passed} / ${tests.length} көрінетін тест өтті`;
  }, [phase, hasTests, passed, tests.length]);

  return (
    <section className="card space-y-3 p-4" aria-label="Жеке тексеру" data-testid="selfcheck">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Сынап көру <span className="badge ml-1 bg-surface-2 align-middle text-ink-muted">жеке тексеру</span></h3>
        <div className="flex gap-2">
          {busy && <button type="button" className="btn-secondary px-3 py-1" onClick={() => runner.current?.cancel()} data-testid="selfcheck-stop">Тоқтату</button>}
          <button type="button" className="btn-primary px-4 py-1.5" disabled={busy || code.trim() === ""} onClick={() => void start()} data-testid="selfcheck-run">
            {busy ? "Жұмыс істеуде..." : "▶ Сынап көру"}
          </button>
        </div>
      </div>
      <p className="text-sm text-ink-muted" data-testid="selfcheck-note">
        Бұл — <strong>жеке тексеру, түпкілікті баға емес</strong>. Код тек сіздің браузеріңізде орындалады, нәтиже серверге жіберілмейді.
        {hasTests ? " Тек көрінетін мысалдар тексеріледі; мұғалімнің бағасы мен жасырын тесттер басқа." : " Көрінетін тест жоқ: код бір рет іске қосылып, шығысы көрсетіледі."}
      </p>
      {!everLoaded && phase === "idle" && <p className="hint" data-testid="selfcheck-size">Алғашқы іске қосуда Python ортасы (~13 МБ) жүктеледі, кейін браузер кэшінен ашылады. Мобильді трафикті ескеріңіз.</p>}
      {phase === "loading" && (
        <p role="status" className="flex items-center gap-2 text-sm" data-testid="selfcheck-loading">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
          Python ортасы жүктелуде (~13 МБ)... Баяу желіде бірнеше минут алуы мүмкін.
        </p>
      )}
      {phase === "running" && <p role="status" className="text-sm" data-testid="selfcheck-running">Код орындалуда...</p>}
      {err && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200" data-testid="selfcheck-error">
          {err} <button type="button" className="underline" onClick={() => void start()}>Қайталау</button>
          <p className="mt-1 text-xs">Жұмысыңызға әсер етпейді: «Жіберу» бұған тәуелді емес.</p>
        </div>
      )}
      {summary && <p className="text-lg font-bold" data-testid="selfcheck-summary" aria-live="polite">{summary} <span className="text-sm font-normal text-ink-muted">(жеке тексеру)</span></p>}
      {stale && <p className="text-sm text-amber-700 dark:text-amber-300" data-testid="selfcheck-stale">Код өзгерді: төмендегі нәтиже ескірген. Қайта сынап көріңіз.</p>}
      {results.length > 0 && (
        <ol className="space-y-2" data-testid="selfcheck-results">
          {results.map((r) => {
            const t = hasTests ? tests[r.index] : null;
            const ok = r.status === "pass";
            const tone = ok ? "border-emerald-300 dark:border-emerald-800" : r.status === "ran" || r.status === "skipped" ? "border-line" : "border-red-300 dark:border-red-800";
            const label = { pass: "Өтті ✓", fail: "Өтпеді ✗", error: "Қате ✗", timeout: "Уақыт өтті ✗", skipped: "Орындалмады", ran: "Орындалды" }[r.status];
            return (
              <li key={r.index} className={`min-w-0 rounded-lg border p-3 text-sm ${tone}`} data-testid={`selfcheck-case-${r.status}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{hasTests ? `Мысал ${r.index + 1}` : "Нәтиже"}: {label}</span>
                  {r.status !== "skipped" && <span className="text-xs text-ink-muted">{r.ms} мс</span>}
                </div>
                {t && <p className="mt-1 text-xs text-ink-muted">Кіріс: <code className="break-all font-mono">{flag(t.input).replace(/\n/g, " ⏎ ")}</code></p>}
                {r.error && <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-red-50 p-2 font-mono text-xs text-red-800 dark:bg-red-950 dark:text-red-200">{r.error}</pre>}
                {r.status === "fail" && t && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="min-w-0"><p className="text-xs text-ink-muted">Күтілетін нәтиже</p><pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-xs">{flag(t.expected)}</pre></div>
                    <div className="min-w-0"><p className="text-xs text-ink-muted">Сіздің шығысыңыз</p><pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-xs" data-testid="selfcheck-actual">{flag(r.stdout)}</pre></div>
                    {r.diff.length > 0 && (
                      <ul className="col-span-full list-disc pl-5 text-xs" data-testid="selfcheck-diff">
                        {r.diff.map((d) => <li key={d.line}>{d.line}-жол: күтілген <code className="font-mono">{d.expected == null ? "(жол жоқ)" : flag(d.expected)}</code>, шыққан <code className="font-mono">{d.actual == null ? "(жол жоқ)" : flag(d.actual)}</code></li>)}
                      </ul>
                    )}
                  </div>
                )}
                {r.status === "ran" && <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-surface-2 p-2 font-mono text-xs" data-testid="selfcheck-actual">{flag(r.stdout)}</pre>}
                {r.stderr && <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-amber-50 p-2 font-mono text-xs dark:bg-amber-950">{r.stderr}</pre>}
                {r.truncated && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Шығыс 64 КБ-қа дейін қысқартылды.</p>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
