// Браузердегі Python «жеке тексеру» runner-і (main ағын жағы). Worker: public/workers/py-runner.js.
// Қасиеттері: бір мезгілде 1 жұмыс, әр іске қосуға жаңа worker (күй ағып кетпейді), әр кейіске таймаут (мерзімі өтсе worker өлтіріледі),
// жүктелу таймауты. Worker `WorkerLike` арқылы беріледі: unit-тестте жалған worker қолданылады. Серверге ештеңе жіберілмейді.

// Шығыс салыстыру: жол соңындағы бос орындар және соңындағы бос жолдар ескерілмейді; жол ішіндегі бос орындар және регистр маңызды.
// (Таза модуль: runtime импорты жоқ, сондықтан unit-тест тікелей жүктейді.)
export function normalizeOutput(s: string): string {
  const lines = s.replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(/[ \t]+$/g, ""));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export type LineDiff = { line: number; expected: string | null; actual: string | null };

/** Бірінші айырмашылықтар (ең көп `max` жол): оқушыға «қай жолда айырма бар» көрсету үшін. */
export function diffLines(expected: string, actual: string, max = 5): LineDiff[] {
  const e = normalizeOutput(expected).split("\n"), a = normalizeOutput(actual).split("\n");
  const n = Math.max(e.length, a.length), out: LineDiff[] = [];
  for (let i = 0; i < n && out.length < max; i++) {
    const x = i < e.length ? e[i] : null, y = i < a.length ? a[i] : null;
    if (x !== y) out.push({ line: i + 1, expected: x, actual: y });
  }
  return out;
}

export const sameOutput = (expected: string, actual: string) => normalizeOutput(expected) === normalizeOutput(actual);

export type WorkerLike = {
  postMessage(m: unknown): void;
  terminate(): void;
  onmessage: ((e: { data: unknown }) => void) | null;
  onerror: ((e: unknown) => void) | null;
};
export type TestCase = { input: string; expected_output: string };
export type CaseStatus = "ran" | "pass" | "fail" | "error" | "timeout" | "skipped";
export type CaseResult = {
  index: number; status: CaseStatus; ms: number; stdout: string; stderr: string; error: string | null;
  truncated: boolean; diff: LineDiff[];
};
export type RunPhase = "idle" | "loading" | "running" | "done" | "failed";
export type RunOptions = {
  createWorker: () => WorkerLike;
  caseTimeoutMs?: number;   // әр кейіске (әдепкі 5000)
  loadTimeoutMs?: number;   // Pyodide жүктелуіне (әдепкі 90000: баяу желі)
  onPhase?: (p: RunPhase) => void;
  onCase?: (r: CaseResult) => void;
};
export type RunOutcome =
  | { ok: true; results: CaseResult[] }
  | { ok: false; reason: "load_failed" | "load_timeout" | "worker_error" | "busy"; message: string; results: CaseResult[] };

export const OUTPUT_LIMIT = 64 * 1024;

type Msg = { type?: string; index?: number; stdout?: string; stderr?: string; error?: string | null; ms?: number; truncated?: boolean; message?: string };

export class SelfCheckRunner {
  private busy = false;
  private current: { cancel: () => void } | null = null;
  constructor(private opts: RunOptions) {}

  get isBusy() { return this.busy; }
  /** Жұмыс жүріп жатса тоқтатады (worker өлтіріледі). */
  cancel() { this.current?.cancel(); }

  run(code: string, cases: { input: string; expected: string | null }[]): Promise<RunOutcome> {
    if (this.busy) return Promise.resolve({ ok: false, reason: "busy", message: "Басқа тексеру жүріп жатыр.", results: [] });
    this.busy = true;
    const o = this.opts, caseMs = o.caseTimeoutMs ?? 5000, loadMs = o.loadTimeoutMs ?? 90000;
    const results: CaseResult[] = [];
    return new Promise<RunOutcome>((resolve) => {
      let w: WorkerLike | null = null, timer: ReturnType<typeof setTimeout> | null = null, finished = false;
      const clear = () => { if (timer) { clearTimeout(timer); timer = null; } };
      const kill = () => { clear(); try { w?.terminate(); } catch { /* ignore */ } w = null; };
      const finish = (out: RunOutcome, phase: RunPhase) => {
        if (finished) return; finished = true; kill(); this.busy = false; this.current = null; o.onPhase?.(phase); resolve(out);
      };
      const fail = (reason: "load_failed" | "load_timeout" | "worker_error", message: string) => finish({ ok: false, reason, message, results }, "failed");
      const skipRest = (from: number) => {
        for (let i = from; i < cases.length; i++) { const r: CaseResult = { index: i, status: "skipped", ms: 0, stdout: "", stderr: "", error: null, truncated: false, diff: [] }; results.push(r); o.onCase?.(r); }
      };
      const armCase = (i: number) => {
        clear();
        timer = setTimeout(() => {
          // Шексіз цикл/ұзақ есептеу: worker-ді өлтіреміз, қалған кейістер орындалмайды
          const r: CaseResult = { index: i, status: "timeout", ms: caseMs, stdout: "", stderr: "", error: `Уақыт шегі өтті (${Math.round(caseMs / 1000)} с). Шексіз цикл болуы мүмкін.`, truncated: false, diff: [] };
          results.push(r); o.onCase?.(r); skipRest(i + 1);
          finish({ ok: true, results }, "done");
        }, caseMs);
      };
      this.current = { cancel: () => { skipRest(results.length); finish({ ok: true, results }, "done"); } };
      o.onPhase?.("loading");
      try { w = o.createWorker(); } catch (e) { return fail("worker_error", "Worker іске қосылмады: " + String((e as Error)?.message ?? e)); }
      timer = setTimeout(() => fail("load_timeout", "Python ортасы уақытында жүктелмеді. Байланысты тексеріп, қайталап көріңіз."), loadMs);
      w.onerror = () => fail("worker_error", "Python ортасы жүктелмеді (worker қатесі).");
      w.onmessage = (ev) => {
        if (finished) return;
        const m = (ev.data ?? {}) as Msg;
        if (m.type === "ready") {
          o.onPhase?.("running");
          w!.postMessage({ type: "run", code, cases: cases.map((c) => ({ input: c.input })) });
          if (cases.length) armCase(0); else finish({ ok: true, results }, "done");
        } else if (m.type === "case" && typeof m.index === "number" && m.index === results.length) {
          const i = m.index, c = cases[i];
          const stdout = String(m.stdout ?? "").slice(0, OUTPUT_LIMIT), stderr = String(m.stderr ?? "").slice(0, OUTPUT_LIMIT);
          const error = m.error ? String(m.error) : null;
          const status: CaseStatus = error ? "error" : c.expected == null ? "ran" : sameOutput(c.expected, stdout) ? "pass" : "fail";
          const r: CaseResult = { index: i, status, ms: Math.max(0, Number(m.ms) || 0), stdout, stderr, error, truncated: !!m.truncated,
            diff: status === "fail" && c.expected != null ? diffLines(c.expected, stdout) : [] };
          results.push(r); o.onCase?.(r);
          if (results.length < cases.length) armCase(results.length);
        } else if (m.type === "done") {
          if (results.length < cases.length) skipRest(results.length);
          finish({ ok: true, results }, "done");
        } else if (m.type === "fatal") {
          fail("load_failed", String(m.message ?? "Белгісіз қате"));
        }
      };
    });
  }
}
