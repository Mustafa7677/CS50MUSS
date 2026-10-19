"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Banner } from "@/components/ui";
import { toast } from "@/components/Toaster";
import { SelfCheck, type VisibleTest } from "./SelfCheck";
import { saveDraftAction, submitAssignmentAction, type SubmitResult } from "../../actions";
import { useT } from "@/lib/i18n/client";
import type { TFn } from "@/lib/i18n/core";

function EditorLoading() { const t = useT(); return <div className="h-[420px] animate-pulse rounded-lg border border-line bg-surface-2" aria-label={t("Редактор жүктелуде")} />; }
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => <EditorLoading />,
});

export type Question = { id: string; prompt: string; options: string[]; points: number };
export type QuizResult = { score: number; max_score: number; passed: number; total: number; details: { question_id: string; correct: boolean }[] };
export type Answers = Record<string, number>;
export type WorkspaceProps = {
  userId: string; assignmentId: string; kind: string; starterCode: string; questions: Question[];
  draft: { id: string; code: string; answers: Answers; seconds: number } | null;
  last: { code: string; answers: Answers; status: string; attemptNo: number } | null;
  result: QuizResult | null;
  blocked: string | null;
  canRetry: boolean;
  /** Тек is_hidden=false кейістер (RLS + page.tsx сүзгісі): жасырындары браузерге ЕШҚАШАН берілмейді */
  visibleTests?: VisibleTest[];
};

type Status = "idle" | "saving" | "saved" | "error";
const NET_ERROR = (t: TFn) => t("Байланыс үзілді. Кодыңыз браузерде сақталып тұр.");

export function Workspace(p: WorkspaceProps) { const t = useT();
  const router = useRouter();
  const isQuiz = p.kind === "quiz";
  const [retrying, setRetrying] = useState(false);
  const editable = !p.blocked && (!!p.draft || !p.last || retrying);
  const shown = p.draft ?? (p.last && !retrying ? p.last : null);
  const [code, setCode] = useState(shown?.code ?? (retrying && p.last ? p.last.code : p.starterCode) ?? "");
  const [answers, setAnswers] = useState<Answers>(shown?.answers ?? {});
  const [status, setStatus] = useState<Status>(p.draft ? "saved" : "idle");
  const [saveErr, setSaveErr] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<SubmitResult | null>(null);
  const [restored, setRestored] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const codeRef = useRef(code); const answersRef = useRef(answers);
  const subId = useRef<string | null>(p.draft?.id ?? null);
  const dirty = useRef(false); const ver = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(p.draft?.seconds ?? 0);
  const submittingRef = useRef(false);
  const bkKey = `qc:draft:${p.userId}:${p.assignmentId}`;

  const backup = useCallback((clear = false) => {
    try {
      if (clear) localStorage.removeItem(bkKey);
      else localStorage.setItem(bkKey, JSON.stringify({ code: codeRef.current, answers: answersRef.current }));
    } catch { /* localStorage қолжетімсіз болуы мүмкін */ }
  }, [bkKey]);

  /** Серверге сақтау (кезекпен). true - сәтті. Қате болса код күйде де, браузерде де қалады. */
  const saveNow = useCallback((): Promise<boolean> => {
    const run = async (): Promise<boolean> => {
      if (!dirty.current && subId.current) return true;
      const v = ver.current;
      setStatus("saving");
      let res;
      try {
        res = await saveDraftAction({ assignmentId: p.assignmentId, code: isQuiz ? null : codeRef.current, answers: answersRef.current, seconds: Math.round(active.current) });
      } catch {
        res = { ok: false as const, error: NET_ERROR(t) };
      }
      if (!res.ok) { setStatus("error"); setSaveErr(res.error); return false; }
      subId.current = res.data!.submissionId;
      if (v === ver.current) { dirty.current = false; setStatus("saved"); setSaveErr(""); backup(true); }
      return true;
    };
    const next = chain.current.then(run, run);
    chain.current = next;
    return next as Promise<boolean>;
  }, [p.assignmentId, isQuiz, backup]);

  const schedule = useCallback(() => {
    ver.current++; dirty.current = true; setStatus("saving"); backup();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void saveNow(); }, 1500);
  }, [saveNow, backup]);

  const onCode = (v: string) => { if (v === codeRef.current) return; codeRef.current = v; setCode(v); schedule(); };
  const onAnswer = (qid: string, i: number) => {
    const n = { ...answersRef.current, [qid]: i }; answersRef.current = n; setAnswers(n); schedule();
  };

  // Белсенді уақыт (бет көрініп тұрғанда)
  useEffect(() => {
    if (!editable) return;
    const tt = setInterval(() => { if (document.visibilityState === "visible") active.current += 1; }, 1000);
    return () => clearInterval(tt);
  }, [editable]);

  // Алдыңғы сақталмаған өзгерісті қалпына келтіру
  useEffect(() => {
    if (!editable) return;
    try {
      const raw = localStorage.getItem(bkKey);
      if (!raw) return;
      const b = JSON.parse(raw) as { code?: string; answers?: Answers };
      const bc = typeof b.code === "string" ? b.code : codeRef.current;
      const ba = b.answers && typeof b.answers === "object" ? b.answers : answersRef.current;
      if (bc === codeRef.current && JSON.stringify(ba) === JSON.stringify(answersRef.current)) { localStorage.removeItem(bkKey); return; }
      codeRef.current = bc; answersRef.current = ba; setCode(bc); setAnswers(ba); setRestored(true); schedule();
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Бет жабылғанда / жасырылғанда сақтап қалу
  useEffect(() => {
    if (!editable) return;
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    const vis = () => { if (document.visibilityState === "hidden" && dirty.current) { if (timer.current) clearTimeout(timer.current); void saveNow(); } };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("visibilitychange", vis);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("visibilitychange", vis); };
  }, [editable, saveNow]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [fullscreen]);

  async function submit() {
    if (submittingRef.current) return;
    submittingRef.current = true; setSubmitting(true); setSubmitErr("");
    try {
      if (timer.current) clearTimeout(timer.current);
      const ok = await saveNow();
      if (!ok || !subId.current) { setSubmitErr(t("Жұмыс сақталмады, сондықтан жіберілмеді. Кодыңыз жоғалған жоқ: «Қайталау» батырмасын басыңыз.")); return; }
      let res;
      try { res = await submitAssignmentAction(subId.current, p.assignmentId); } catch { res = { ok: false as const, error: NET_ERROR(t) }; }
      if (!res.ok) { setSubmitErr(res.error); return; }
      backup(true); dirty.current = false; setDone(res.data ?? null); toast(t("Жұмыс жіберілді."), "ok");
      router.refresh();
    } finally { submittingRef.current = false; setSubmitting(false); }
  }

  const unanswered = isQuiz ? p.questions.filter((q) => answers[q.id] == null).length : 0;
  const emptyCode = !isQuiz && code.trim() === "";
  const resultMap = new Map((p.result?.details ?? []).map((d) => [d.question_id, d.correct]));

  const indicator = editable && (
    <div className="flex flex-wrap items-center gap-2 text-sm" role="status" aria-live="polite" data-testid="save-status">
      {status === "saving" && <span className="text-ink-muted">{t("Сақталуда...")}</span>}
      {status === "saved" && <span className="text-emerald-600">{t("Сақталды ✓")}</span>}
      {status === "idle" && <span className="text-ink-muted">{t("Автосақтау қосулы")}</span>}
      {status === "error" && (
        <>
          <span className="font-medium text-red-600">{t("Сақталмады:")}{" "}{saveErr}</span>
          <button type="button" className="btn-secondary px-3 py-1" onClick={() => void saveNow()}>{t("Қайталау")}</button>
        </>
      )}
    </div>
  );

  const submitBox = editable && (
    <div className="flex flex-wrap items-center gap-3">
      {emptyCode ? (
        <button type="button" className="btn-primary" disabled>{t("Жіберу")}</button>
      ) : (
        <ConfirmButton action={submit} label={submitting ? t("Жіберілуде...") : t("Жіберу")} className="btn-primary" danger={false} confirmLabel={t("Иә, жіберу")}
          title={t("Жұмысты жіберу?")}
          message={isQuiz
            ? t("{v}Жібергеннен кейін жауаптарды өзгерту мүмкін емес, нәтиже бірден шығады.", { v: unanswered ? t("Жауап берілмеген сұрақ: {unanswered}. ", { unanswered }) : "" })
            : t("Жібергеннен кейін кодты өзгерту мүмкін емес. Мұғалім тексеріп баға қояды.")} />
      )}
      {emptyCode && <span className="text-sm text-ink-muted">{t("Алдымен код жазыңыз.")}</span>}
    </div>
  );

  const attemptNote = !editable && p.last && (
    <p className="text-sm text-ink-muted">{p.last.attemptNo}{t("-әрекет ·")}{" "}{p.last.status === "graded" ? t("бағаланған") : p.last.status === "under_review" ? t("тексеріліп жатыр") : t("жіберілген")}</p>
  );

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col gap-3 overflow-auto bg-surface p-4" : "space-y-4"} data-testid="workspace">
      {p.blocked && <Banner tone="bad">{p.blocked}</Banner>}
      {restored && <Banner tone="info">{t("Алдыңғы сақталмаған өзгерістеріңіз браузерден қалпына келтірілді.")}</Banner>}
      {done && (
        <Banner tone="info">
          <span data-testid="submit-done">{t("Жұмыс жіберілді.")}</span>
          {done.status === "graded" && done.score != null && <>{" "}{t("Нәтиже:")}{" "}<strong>{done.score} / {done.max_score}</strong>.</>}
        </Banner>
      )}

      {isQuiz && !editable && p.result && (
        <div className="card p-4" data-testid="quiz-result">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t("Тест нәтижесі")}</p>
          <p className="mt-1 text-3xl font-bold text-brand">{p.result.score} / {p.result.max_score}</p>
          <p className="text-sm">{t("Дұрыс:")}{" "}<strong>{p.result.passed}</strong>{" "}{t("· Қате:")}{" "}<strong>{p.result.total - p.result.passed}</strong>{" "}{t("· Барлығы:")}{" "}{p.result.total}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{isQuiz ? t("Сұрақтар") : editable ? t("Шешіміңіз") : t("Жіберілген шешім")}</h2>
        <div className="flex items-center gap-3">
          {indicator}
          {!isQuiz && (
            <button type="button" className="btn-secondary px-3 py-1" aria-pressed={fullscreen} onClick={() => setFullscreen((f) => !f)}>
              {fullscreen ? t("Толық экраннан шығу") : t("Толық экран")}
            </button>
          )}
        </div>
      </div>
      {attemptNote}

      {isQuiz ? (
        <ol className="space-y-4">
          {p.questions.map((q, qi) => {
            const ok = resultMap.get(q.id);
            return (
              <li key={q.id} className="card p-4">
                <fieldset disabled={!editable} className="min-w-0">
                  <legend className="mb-2 font-medium">
                    <span>{qi + 1}. {q.prompt}</span>
                    {!editable && ok != null && (
                      <span className={`badge ml-2 align-middle ${ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"}`} data-testid={ok ? "q-correct" : "q-wrong"}>
                        {ok ? t("Дұрыс ✓") : t("Қате ✗")}
                      </span>
                    )}
                  </legend>
                  <div className="space-y-1.5">
                    {q.options.map((o, i) => (
                      <label key={i} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${answers[q.id] === i ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2"}`}>
                        <input type="radio" name={`q-${q.id}`} className="mt-0.5 accent-[var(--brand)]" checked={answers[q.id] === i} onChange={() => onAnswer(q.id, i)} />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      ) : (
        <>
          {editable && <Banner tone="info">{t("Жұмысыңызды мұғалім тексеріп баға қояды. «Сынап көру» тек жеке тексеру үшін (баға емес), «Жіберу» бұған тәуелді емес.")}</Banner>}
          <div className={`overflow-hidden rounded-lg border border-line ${fullscreen ? "flex-1" : ""}`} data-testid="editor">
            <CodeEditor value={code} onChange={onCode} kind={p.kind} readOnly={!editable} label={t("Код редакторы")}
              height={fullscreen ? "calc(100dvh - 15rem)" : "min(60vh, 480px)"} />
          </div>
        </>
      )}

      {editable && p.kind === "python" && <SelfCheck code={code} tests={p.visibleTests ?? []} />}

      {submitErr && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{submitErr}</p>}
      {submitBox}
      {!editable && p.canRetry && (
        <div>
          <button type="button" className="btn-secondary" onClick={() => {
            const c = p.last?.code ?? p.starterCode; codeRef.current = c; answersRef.current = {};
            setCode(c); setAnswers({}); setDone(null); setStatus("idle"); setRetrying(true);
          }}>{t("Қайта тапсыру")}</button>
          <p className="hint">{t("Жаңа әрекет басталады, алдыңғы жұмыс пен баға сақталады.")}</p>
        </div>
      )}
    </div>
  );
}
