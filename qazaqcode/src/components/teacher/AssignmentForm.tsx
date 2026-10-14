"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Banner } from "@/components/ui";
import { toast } from "@/components/Toaster";
import type { ActionResult } from "@/lib/errors";

export type QuestionInit = { prompt: string; options: string[]; correct_index: number; explanation: string; points: number };
export type TestInit = { input: string; expected_output: string; is_hidden: boolean; points: number };
export type AssignmentInit = {
  id: string | null; title: string; description: string; kind: string; difficulty: string; max_score: number; starter_code: string;
  max_attempts: number | null; deadline: string | null; allow_late: boolean; hints: string[]; status: "new" | "draft" | "published" | "archived";
  questions: QuestionInit[]; test_cases: TestInit[]; class_ids: string[];
};
export type ClassOption = { id: string; name: string; subject: string; academic_year: string };
type Q = { key: number; prompt: string; options: { key: number; text: string }[]; correct: number; explanation: string; points: string };
type T = { key: number; input: string; expected: string; hidden: boolean; points: string };

const KIND_OPTIONS: [string, string][] = [["python", "Python"], ["sql", "SQL"], ["javascript", "JavaScript"], ["html_css", "HTML/CSS"], ["quiz", "Тест (quiz)"], ["file", "Файл"], ["project", "Жобалық жұмыс"]];
const DIFF: [string, string][] = [["easy", "Жеңіл"], ["medium", "Орташа"], ["hard", "Күрделі"]];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

export function AssignmentForm({
  init, classes, locked, action,
}: { init: AssignmentInit; classes: ClassOption[]; locked: boolean; action: (prev: ActionResult | null, f: FormData) => Promise<ActionResult> }) {
  const keyRef = useRef(1000);
  const nk = () => ++keyRef.current;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  const [title, setTitle] = useState(init.title);
  const [description, setDescription] = useState(init.description);
  const [kind, setKind] = useState(init.kind);
  const [difficulty, setDifficulty] = useState(init.difficulty);
  const [maxScore, setMaxScore] = useState(String(init.max_score));
  const [starter, setStarter] = useState(init.starter_code);
  const [attempts, setAttempts] = useState(init.max_attempts == null ? "" : String(init.max_attempts));
  const [deadline, setDeadline] = useState("");
  const [allowLate, setAllowLate] = useState(init.allow_late);
  const [hints, setHints] = useState<{ key: number; text: string }[]>(() => init.hints.map((t, i) => ({ key: i + 1, text: t })));
  const [qs, setQs] = useState<Q[]>(() => init.questions.map((q, i) => ({
    key: i + 1, prompt: q.prompt, correct: q.correct_index, explanation: q.explanation, points: String(q.points),
    options: q.options.map((t, j) => ({ key: (i + 1) * 100 + j, text: t })),
  })));
  const [tcs, setTcs] = useState<T[]>(() => init.test_cases.map((t, i) => ({ key: i + 1, input: t.input, expected: t.expected_output, hidden: t.is_hidden, points: String(t.points) })));
  const [classIds, setClassIds] = useState<string[]>(init.class_ids);

  // Мерзім: браузердің жергілікті уақыты бойынша (SSR-мен сәйкессіздік болмауы үшін mount-тан кейін)
  useEffect(() => { setDeadline(toLocalInput(init.deadline)); }, [init.deadline]);
  useEffect(() => { if (state?.ok && state.message) toast(state.message, "ok"); }, [state]);

  const isQuiz = kind === "quiz";
  const structLocked = locked;
  const upd = <K,>(arr: K[], i: number, patch: Partial<K>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));
  const move = <K,>(arr: K[], i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= arr.length) return arr;
    const c = arr.slice(); [c[i], c[j]] = [c[j], c[i]]; return c;
  };
  const newQuestion = (): Q => ({ key: nk(), prompt: "", options: [{ key: nk(), text: "" }, { key: nk(), text: "" }], correct: 0, explanation: "", points: "1" });

  const payload = JSON.stringify({
    id: init.id,
    title, description, kind, difficulty,
    max_score: Number(maxScore.replace(",", ".")),
    starter_code: starter,
    max_attempts: numOrNull(attempts),
    deadline: deadline ? new Date(deadline).toISOString() : null,
    allow_late: allowLate,
    hints: hints.map((h) => h.text.trim()).filter(Boolean),
    questions: qs.map((q) => ({ prompt: q.prompt, options: q.options.map((o) => o.text), correct_index: q.correct, explanation: q.explanation, points: Number(q.points.replace(",", ".")) })),
    test_cases: tcs.map((t) => ({ input: t.input, expected_output: t.expected, is_hidden: t.hidden, points: Number(t.points.replace(",", ".")) })),
    class_ids: classIds,
  });
  const totalPoints = qs.reduce((s, q) => s + (Number(q.points.replace(",", ".")) || 0), 0);
  const published = init.status === "published";
  const saveLabel = init.status === "new" || init.status === "draft" ? "Жоба ретінде сақтау" : "Өзгерістерді сақтау";
  const publishLabel = published ? "Сақтау және қайта жариялау" : init.status === "archived" ? "Қайта жариялау" : "Жариялау";

  return (
    <form action={formAction} className="space-y-6" data-testid="assignment-form">
      <input type="hidden" name="payload" value={payload} />

      {locked && (
        <Banner tone="warn">
          <strong>Бұл тапсырмаға жұмыс түскен.</strong> Әділдік үшін түрі, максималды балл, сұрақтар мен тест жағдайлары енді өзгермейді (өрістер құлыпталған).
          Тақырыпты, сипаттаманы, мерзімді, кеңестерді және берілетін сыныптарды өзгертуге болады. Құрылымды өзгерту керек болса, «Көшіру» арқылы жаңа тапсырма жасаңыз.
        </Banner>
      )}

      <section className="card p-5" aria-labelledby="f-main">
        <h2 id="f-main" className="mb-4 text-lg font-semibold">Негізгі</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="a-title">Тақырыбы</label>
            <input id="a-title" required minLength={2} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="a-desc">Сипаттамасы</label>
            <textarea id="a-desc" rows={6} maxLength={20000} value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
            <p className="hint">Қарапайым мәтін: абзацтар (бос жолдар) сақталады, форматтау белгілері қажет емес.</p>
          </div>
          <div>
            <label className="label" htmlFor="a-kind">Түрі</label>
            <select id="a-kind" value={kind} disabled={structLocked} onChange={(e) => setKind(e.target.value)} className="input">
              {KIND_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="a-diff">Қиындығы</label>
            <select id="a-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input">
              {DIFF.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="a-max">Максималды балл</label>
            <input id="a-max" type="number" required min={1} max={1000} step="any" inputMode="decimal" value={maxScore} disabled={structLocked} onChange={(e) => setMaxScore(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="a-att">Әрекет лимиті</label>
            <input id="a-att" type="number" min={1} max={100} inputMode="numeric" value={attempts} onChange={(e) => setAttempts(e.target.value)} className="input" placeholder="Шектеусіз" />
          </div>
          <div>
            <label className="label" htmlFor="a-dl">Тапсыру мерзімі</label>
            <input id="a-dl" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
            <p className="hint">Бос қалдырсаңыз, мерзім шектелмейді.</p>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" /> Мерзімнен кейін де қабылдау</label>
          </div>
        </div>
      </section>

      <section className="card p-5" aria-labelledby="f-hints">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="f-hints" className="text-lg font-semibold">Кеңестер (hints)</h2>
          <button type="button" className="btn-secondary text-xs" onClick={() => setHints([...hints, { key: nk(), text: "" }])} disabled={hints.length >= 20}>Кеңес қосу</button>
        </div>
        {hints.length === 0 && <p className="text-sm text-ink-muted">Кеңес жоқ. Оқушыға көмектесетін қысқа ұсыныстар қосуға болады.</p>}
        <ul className="space-y-2">
          {hints.map((h, i) => (
            <li key={h.key} className="flex gap-2">
              <label className="sr-only" htmlFor={`h-${h.key}`}>Кеңес {i + 1}</label>
              <input id={`h-${h.key}`} value={h.text} maxLength={500} onChange={(e) => setHints(upd(hints, i, { text: e.target.value }))} className="input" placeholder={`Кеңес ${i + 1}`} />
              <button type="button" className="btn-secondary px-3" aria-label={`Кеңес ${i + 1} өшіру`} onClick={() => setHints(hints.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
      </section>

      {!isQuiz && (
        <>
          <section className="card p-5" aria-labelledby="f-code">
            <h2 id="f-code" className="mb-3 text-lg font-semibold">Бастапқы код</h2>
            <label className="label" htmlFor="a-starter">Оқушы ашқанда көретін шаблон</label>
            <textarea id="a-starter" rows={8} spellCheck={false} maxLength={20000} value={starter} onChange={(e) => setStarter(e.target.value)} className="input font-mono" />
          </section>

          <section className="card p-5" aria-labelledby="f-tests">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="f-tests" className="text-lg font-semibold">Тест жағдайлары</h2>
              <button type="button" className="btn-secondary text-xs" disabled={structLocked || tcs.length >= 50} onClick={() => setTcs([...tcs, { key: nk(), input: "", expected: "", hidden: false, points: "1" }])}>Тест қосу</button>
            </div>
            <Banner tone="info">Автоматты іске қосу кейін қосылады; қазір мұғалім қолмен бағалайды, ашық мысалдар оқушыға көрінеді. «Жасырын» жағдайлар оқушыға көрінбейді.</Banner>
            {tcs.length === 0 && <p className="text-sm text-ink-muted">Тест жағдайы жоқ. Міндетті емес: ашық мысалдар оқушыға тапсырманы түсінуге көмектеседі.</p>}
            <ul className="space-y-3">
              {tcs.map((t, i) => (
                <li key={t.key} className="rounded-xl border border-line p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="label" htmlFor={`ti-${t.key}`}>Кіріс {i + 1}</label><textarea id={`ti-${t.key}`} rows={2} spellCheck={false} disabled={structLocked} maxLength={5000} value={t.input} onChange={(e) => setTcs(upd(tcs, i, { input: e.target.value }))} className="input font-mono" /></div>
                    <div><label className="label" htmlFor={`to-${t.key}`}>Күтілетін шығыс {i + 1}</label><textarea id={`to-${t.key}`} rows={2} spellCheck={false} disabled={structLocked} maxLength={5000} value={t.expected} onChange={(e) => setTcs(upd(tcs, i, { expected: e.target.value }))} className="input font-mono" /></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={structLocked} checked={t.hidden} onChange={(e) => setTcs(upd(tcs, i, { hidden: e.target.checked }))} className="h-4 w-4 accent-[var(--brand)]" /> Жасырын</label>
                    <label className="flex items-center gap-2 text-sm">Балл <input type="number" min={0} step="any" disabled={structLocked} value={t.points} onChange={(e) => setTcs(upd(tcs, i, { points: e.target.value }))} className="input w-24" aria-label={`Тест ${i + 1} баллы`} /></label>
                    <button type="button" className="btn-secondary ml-auto text-xs" disabled={structLocked} onClick={() => setTcs(tcs.filter((_, j) => j !== i))}>Өшіру</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {isQuiz && (
        <section className="card p-5" aria-labelledby="f-q">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="f-q" className="text-lg font-semibold">Сұрақтар</h2>
              <p className="text-xs text-ink-muted">Тест автоматты бағаланады. Сұрақтар: {qs.length}, ұпайлар қосындысы: {totalPoints}. Баға осы ұпайлардың үлесіне қарай максималды баллға келтіріледі.</p>
            </div>
            <button type="button" className="btn-secondary text-xs" disabled={structLocked || qs.length >= 100} onClick={() => setQs([...qs, newQuestion()])}>Сұрақ қосу</button>
          </div>
          {qs.length === 0 && <p className="rounded-lg bg-surface-2 p-4 text-center text-sm text-ink-muted">Сұрақ жоқ. Жариялау үшін кемінде бір сұрақ қосыңыз.</p>}
          <ol className="space-y-4">
            {qs.map((q, i) => (
              <li key={q.key} className="rounded-xl border border-line p-4" data-testid="question">
                <fieldset disabled={structLocked} className="min-w-0 border-0 p-0">
                  <legend className="sr-only">Сұрақ {i + 1}</legend>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-brand">Сұрақ {i + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" className="btn-secondary px-2 py-1 text-xs" aria-label={`Сұрақ ${i + 1} жоғары`} disabled={i === 0} onClick={() => setQs(move(qs, i, -1))}>↑</button>
                      <button type="button" className="btn-secondary px-2 py-1 text-xs" aria-label={`Сұрақ ${i + 1} төмен`} disabled={i === qs.length - 1} onClick={() => setQs(move(qs, i, 1))}>↓</button>
                      <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => setQs(qs.filter((_, j) => j !== i))}>Өшіру</button>
                    </div>
                  </div>
                  <label className="label" htmlFor={`qp-${q.key}`}>Сұрақ мәтіні</label>
                  <textarea id={`qp-${q.key}`} rows={2} required maxLength={2000} value={q.prompt} onChange={(e) => setQs(upd(qs, i, { prompt: e.target.value }))} className="input" />
                  <p className="label mt-3" id={`qo-${q.key}`}>Жауап нұсқалары (дұрысын белгілеңіз)</p>
                  <div role="radiogroup" aria-labelledby={`qo-${q.key}`} className="space-y-2">
                    {q.options.map((o, j) => (
                      <div key={o.key} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${q.key}`} checked={q.correct === j} onChange={() => setQs(upd(qs, i, { correct: j }))} aria-label={`${j + 1}-нұсқа дұрыс жауап`} className="h-4 w-4 shrink-0 accent-[var(--brand)]" />
                        <input value={o.text} required maxLength={500} aria-label={`${j + 1}-нұсқа мәтіні`} placeholder={`Нұсқа ${j + 1}`} onChange={(e) => setQs(upd(qs, i, { options: q.options.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)) }))} className="input" />
                        <button type="button" className="btn-secondary px-2 py-1 text-xs" aria-label={`${j + 1}-нұсқаны өшіру`} disabled={q.options.length <= 2}
                          onClick={() => setQs(upd(qs, i, { options: q.options.filter((_, k) => k !== j), correct: q.correct === j ? 0 : q.correct > j ? q.correct - 1 : q.correct }))}>✕</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn-ghost mt-2 text-xs" disabled={q.options.length >= 8} onClick={() => setQs(upd(qs, i, { options: [...q.options, { key: nk(), text: "" }] }))}>+ Нұсқа қосу (2-8)</button>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <div><label className="label" htmlFor={`qe-${q.key}`}>Түсіндірме (міндетті емес)</label><input id={`qe-${q.key}`} maxLength={2000} value={q.explanation} onChange={(e) => setQs(upd(qs, i, { explanation: e.target.value }))} className="input" /></div>
                    <div><label className="label" htmlFor={`qpt-${q.key}`}>Ұпай</label><input id={`qpt-${q.key}`} type="number" min={0.5} step="any" required value={q.points} onChange={(e) => setQs(upd(qs, i, { points: e.target.value }))} className="input" /></div>
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card p-5" aria-labelledby="f-targets">
        <h2 id="f-targets" className="mb-1 text-lg font-semibold">Қай сыныптарға беру</h2>
        <p className="mb-3 text-sm text-ink-muted">Жариялау үшін кемінде бір сынып таңдаңыз.</p>
        {classes.length === 0 ? <p className="text-sm text-ink-muted">Сыныбыңыз жоқ. Алдымен «Сыныптарым» бетінде сынып ашыңыз.</p> : (
          <fieldset>
            <legend className="sr-only">Сыныптар</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {classes.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2">
                  <input type="checkbox" checked={classIds.includes(c.id)} onChange={(e) => setClassIds(e.target.checked ? [...classIds, c.id] : classIds.filter((x) => x !== c.id))} className="h-4 w-4 accent-[var(--brand)]" />
                  <span><strong>{c.name}</strong> <span className="text-ink-muted">· {c.subject}, {c.academic_year}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </section>

      {state && !state.ok && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{state.error}</p>}
      {state?.ok && state.message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{state.message}</p>}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:mx-0 lg:rounded-xl lg:border">
        <button type="submit" name="intent" value="save" disabled={pending} className="btn-secondary">{pending ? "Күтіңіз..." : saveLabel}</button>
        <button type="submit" name="intent" value="publish" disabled={pending} className="btn-primary" data-testid="publish-btn">{publishLabel}</button>
        {init.status === "new" && <span className="text-xs text-ink-muted">Жоба оқушыларға көрінбейді.</span>}
      </div>
    </form>
  );
}
