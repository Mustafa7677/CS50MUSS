"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Card } from "@/lib/ai/match";
import { useT } from "@/lib/i18n/client";

type Msg = { id: number; role: "user" | "bot"; text?: string; card?: Card; error?: string };
type Chip = { id: string; title: string };

export function Chat({ chips, assignment }: { chips: Chip[]; assignment: { id: string; title: string; kind: string } | null }) { const t = useT();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const idRef = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const hintId = useId();

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs, busy]);

  async function ask(payload: { text?: string; topicId?: string }, label: string) {
    if (busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { id: idRef.current++, role: "user", text: label }]);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, assignmentId: assignment?.id ?? null }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.ok) setMsgs((m) => [...m, { id: idRef.current++, role: "bot", card: j.card as Card }]);
      else setMsgs((m) => [...m, { id: idRef.current++, role: "bot", error: typeof j?.error === "string" ? j.error : t("Қате болды. Кейінірек қайталап көріңіз.") }]);
    } catch {
      setMsgs((m) => [...m, { id: idRef.current++, role: "bot", error: t("Байланыс жоқ. Интернетті тексеріп, қайталап көріңіз.") }]);
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const tt = text.trim();
    if (!tt) return;
    setText("");
    void ask({ text: tt }, tt);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink-muted" data-testid="ai-disclaimer">
        <strong className="text-ink">{t("QazaqCode Көмекші - жасанды интеллект емес.")}</strong>{" "}{t("Ол алдын ала жазылған кеңестерге сүйенеді, сондықтан қателесуі не сұрағыңды түсінбеуі мүмкін. Дайын шешім бермейді: тек түсіндіреді, бағыттайды. Сұрақтарың сақталмайды.")}
      </p>
      {assignment && (
        <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm" data-testid="ai-context">
          {t("Тапсырма:")}{" "}<Link href={`/student/assignments/${assignment.id}`} className="font-semibold">{assignment.title}</Link>{t(". Сақталған кодың мен шарты ескеріледі.")}
        </p>
      )}

      <section aria-label={t("Әңгіме")} className="card min-h-[16rem] space-y-4 p-4">
        <div role="log" aria-live="polite" aria-relevant="additions" className="space-y-4" data-testid="ai-log">
          {msgs.length === 0 && (
            <div>
              <p className="text-sm text-ink-muted">{t("Сұрағыңды жаз, қате хабарламасын қой не төмендегі тақырыптардың бірін таңда.")}</p>
              <ChipList chips={chips} onPick={(c) => ask({ topicId: c.id }, c.title)} disabled={busy} label={t("Жиі тақырыптар")} />
            </div>
          )}
          {msgs.map((m) => (m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-brand-ink">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start" data-testid="ai-reply">
              {m.error ? <p role="alert" className="max-w-full rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{m.error}</p>
                : m.card && <CardView card={m.card} onPick={(c) => ask({ topicId: c.id }, c.title)} disabled={busy} />}
            </div>
          )))}
        </div>
        {busy && <p className="text-sm text-ink-muted" role="status" data-testid="ai-thinking">{t("Көмекші ойланып жатыр...")}</p>}
        <div ref={endRef} />
      </section>

      <form onSubmit={submit} className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="label">{t("Сұрағың")}</label>
          <textarea id={inputId} className="input min-h-[3rem]" rows={2} maxLength={1000} value={text} disabled={busy} aria-describedby={hintId}
            placeholder={t("Мысалы: for циклін қалай жазамын? не NameError: name 'x' is not defined")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
          <p id={hintId} className="hint mt-1">{t("Enter - жіберу, Shift+Enter - жаңа жол. Ең көбі 1000 таңба.")}</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy || !text.trim()} className="btn-primary">{t("Жіберу")}</button>
          {msgs.length > 0 && <button type="button" className="btn-secondary" disabled={busy} onClick={() => setMsgs([])}>{t("Тазалау")}</button>}
        </div>
      </form>
    </div>
  );
}

function ChipList({ chips, onPick, disabled, label }: { chips: Chip[]; onPick: (c: Chip) => void; disabled: boolean; label: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={label}>
      {chips.map((c) => <button key={c.id} type="button" disabled={disabled} className="btn-secondary px-3 py-1.5 text-xs" onClick={() => onPick(c)}>{c.title}</button>)}
    </div>
  );
}

function CardView({ card, onPick, disabled }: { card: Card; onPick: (c: Chip) => void; disabled: boolean }) { const t = useT();
  const h = "text-xs font-semibold uppercase tracking-wide text-ink-muted";
  return (
    <article className="w-full min-w-0 max-w-full space-y-3 rounded-2xl rounded-bl-sm border border-line bg-surface-2 p-4 text-sm" data-testid="ai-card" aria-label={card.title}>
      <h2 className="text-base font-bold leading-snug">{card.title}</h2>
      {card.notes.map((n, i) => <p key={i} className="rounded-lg bg-brand-soft px-3 py-2" data-testid="ai-note">{n}</p>)}
      <section><h3 className={h}>{t("Түсіндірме")}</h3><p className="mt-1 whitespace-pre-wrap break-words leading-relaxed">{card.explain}</p></section>
      {card.steps.length > 0 && (
        <section><h3 className={h}>{t("Қадамдар")}</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5">{card.steps.map((s, i) => <li key={i} className="break-words">{s}</li>)}</ol></section>
      )}
      {card.ask.length > 0 && (
        <section><h3 className={h}>{t("Өзіңе сұрақ қой")}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">{card.ask.map((s, i) => <li key={i} className="break-words">{s}</li>)}</ul></section>
      )}
      {card.example && (
        <section><h3 className={h}>{t("Жалпы мысал (сенің тапсырмаң емес)")}</h3>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs"><code>{card.example}</code></pre></section>
      )}
      {card.read.length > 0 && (
        <section><h3 className={h}>{t("Оқып шық")}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">{card.read.map((r) => <li key={r.href} className="break-words"><Link href={r.href}>{r.title}</Link> <span className="text-ink-muted">({r.course})</span></li>)}</ul></section>
      )}
      {card.askTeacher && <p className="rounded-lg border border-line bg-surface px-3 py-2">{t("Нақты жауап таппасаң, мұғалімнен сұра: қай жерде тұрып қалғаныңды көрсетсең, тез көмектеседі.")}</p>}
      {card.related.length > 0 && (
        <section><h3 className={h}>{card.kind === "answer" ? t("Байланысты тақырыптар") : t("Осыны көріп көр")}</h3>
          <ChipList chips={card.related} onPick={onPick} disabled={disabled} label={t("Байланысты тақырыптар")} /></section>
      )}
    </article>
  );
}
