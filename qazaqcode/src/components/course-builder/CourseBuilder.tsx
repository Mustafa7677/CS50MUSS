"use client";
import { useRef, useState, useTransition } from "react";
import { saveCourseStructureAction } from "@/app/courses-actions";
import { toast } from "@/components/Toaster";
import { LANGS, type Area, type AssignmentOption, type BlockType, type TreeModule } from "./types";
import { useT } from "@/lib/i18n/client";
import type { TFn } from "@/lib/i18n/core";

type B = { key: string; type: BlockType; content: string; language: string; caption: string };
type L = { key: string; id?: string; title: string; assignment_id: string; blocks: B[]; open: boolean };
type M = { key: string; id?: string; title: string; lessons: L[] };
type Drag = { kind: "module" | "lesson" | "block"; mk?: string; lk?: string; key: string };

let seq = 0;
const nk = () => `k${++seq}`;
const LANG_LABEL = (t: TFn): Record<string, string> => ({ python: "Python", sql: "SQL", javascript: "JavaScript", html: "HTML", css: "CSS", text: t("Мәтін") });
const BLOCK_LABEL = (t: TFn): Record<BlockType, string> => ({ text: t("Мәтін"), code: t("Код"), image: t("Сурет"), video: t("Видео"), note: t("Ескерту") });
const STATUS_KK = (t: TFn): Record<string, string> => ({ draft: t("жоба"), published: t("жарияланған"), archived: t("мұрағат") });
const HTTPS = /^https:\/\/[^\s<>"']+$/i;

function fromTree(tt: TreeModule[]): M[] {
  return tt.map((m) => ({
    key: nk(), id: m.id, title: m.title,
    lessons: m.lessons.map((l) => ({
      key: nk(), id: l.id, title: l.title, assignment_id: l.assignment_id ?? "", open: false,
      blocks: l.blocks.map((b) => ({ key: nk(), type: b.type, content: b.content ?? "", language: b.language ?? "python", caption: b.caption ?? "" })),
    })),
  }));
}
function move<T>(arr: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
}

export function CourseBuilder({ courseId, area, initial, assignments }: { courseId: string; area: Area; initial: TreeModule[]; assignments: AssignmentOption[] }) { const t = useT();
  const [mods, setMods] = useState<M[]>(() => fromTree(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [over, setOver] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);

  const edit = (fn: (d: M[]) => void) => setMods((prev) => { const d = structuredClone(prev); fn(d); return d; });
  const findL = (d: M[], mk: string, lk: string) => { const m = d.find((x) => x.key === mk); return { m, l: m?.lessons.find((x) => x.key === lk) }; };

  // ---------- реттеу ----------
  const moveModule = (from: number, to: number) => edit((d) => move(d, from, to));
  const moveLessonUpDown = (mk: string, lk: string, dir: -1 | 1) => edit((d) => {
    const m = d.find((x) => x.key === mk); if (!m) return;
    const i = m.lessons.findIndex((x) => x.key === lk); move(m.lessons, i, i + dir);
  });
  const moveLessonTo = (fromMk: string, lk: string, toMk: string, toIdx: number | null) => edit((d) => {
    const fm = d.find((x) => x.key === fromMk); const tm = d.find((x) => x.key === toMk); if (!fm || !tm) return;
    const i = fm.lessons.findIndex((x) => x.key === lk); if (i < 0) return;
    if (fm === tm) { move(fm.lessons, i, toIdx === null ? fm.lessons.length - 1 : toIdx); return; }
    const [x] = fm.lessons.splice(i, 1);
    tm.lessons.splice(toIdx === null ? tm.lessons.length : toIdx, 0, x);
  });
  const moveBlock = (mk: string, lk: string, from: number, to: number) => edit((d) => { const { l } = findL(d, mk, lk); if (l) move(l.blocks, from, to); });

  // ---------- DnD ----------
  const dragStart = (e: React.DragEvent, d: Drag) => {
    e.stopPropagation();
    drag.current = d;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", d.key);
    const el = (e.currentTarget as HTMLElement).closest("[data-dnd-item]") as HTMLElement | null;
    if (el) e.dataTransfer.setDragImage(el, 12, 12);
  };
  const dragEnd = () => { drag.current = null; setOver(null); };
  const allow = (kind: Drag["kind"], match: (d: Drag) => boolean, key: string) => (e: React.DragEvent) => {
    const d = drag.current;
    if (!d || d.kind !== kind || !match(d)) return;
    e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move";
    if (over !== key) setOver(key);
  };
  const handle = (kind: Drag["kind"], label: string, d: Drag) => (
    <span draggable onDragStart={(e) => dragStart(e, d)} onDragEnd={dragEnd} title={t("{label}: сүйреп жылжыту", { label })} aria-hidden="true"
      data-testid={`drag-${kind}`} className="cursor-grab select-none px-1 text-lg leading-none text-ink-muted active:cursor-grabbing">⠿</span>
  );
  const upDown = (label: string, i: number, n: number, onMove: (dir: -1 | 1) => void) => (
    <>
      <button type="button" className="btn-secondary !px-2 !py-1" disabled={i === 0} onClick={() => onMove(-1)} aria-label={t("{label}: жоғары жылжыту", { label })} title={t("Жоғары")}>↑</button>
      <button type="button" className="btn-secondary !px-2 !py-1" disabled={i === n - 1} onClick={() => onMove(1)} aria-label={t("{label}: төмен жылжыту", { label })} title={t("Төмен")}>↓</button>
    </>
  );

  // ---------- сақтау ----------
  function save() {
    setMsg(null);
    const payload = {
      modules: mods.map((m) => ({
        ...(m.id ? { id: m.id } : {}), title: m.title,
        lessons: m.lessons.map((l) => ({
          ...(l.id ? { id: l.id } : {}), title: l.title, assignment_id: l.assignment_id || null,
          blocks: l.blocks.map((b) => ({
            type: b.type, content: b.content,
            ...(b.type === "code" ? { language: b.language } : {}),
            ...(b.type === "image" || b.type === "video" ? { caption: b.caption } : {}),
          })),
        })),
      })),
    };
    start(async () => {
      const r = await saveCourseStructureAction(courseId, area, payload);
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return; }
      const fresh = r.data ?? [];
      // жаңа id-ларды позиция бойынша қолданамыз (UI күйі: ашық сабақтар т.б. сақталады)
      setMods((prev) => prev.map((m, i) => ({ ...m, id: fresh[i]?.id ?? m.id, lessons: m.lessons.map((l, j) => ({ ...l, id: fresh[i]?.lessons[j]?.id ?? l.id })) })));
      setMsg({ ok: true, text: r.message ?? t("Сақталды.") });
      toast(r.message ?? t("Сақталды."), "ok");
    });
  }

  const total = mods.reduce((n, m) => n + m.lessons.length, 0);
  const confirmDel = (hasContent: boolean, what: string) => !hasContent || window.confirm(t("{what} өшірілсін бе? Мазмұны да өшеді (сақтағаннан кейін).", { what }));

  function renderBlock(m: M, l: L, b: B, bi: number) {
    const upd = (p: Partial<B>) => edit((d) => { const x = findL(d, m.key, l.key).l?.blocks.find((y) => y.key === b.key); if (x) Object.assign(x, p); });
    const label = t("{n}-блок ({type})", { n: bi + 1, type: BLOCK_LABEL(t)[b.type] });
    const k = `b:${b.key}`;
    return (
      <div key={b.key} data-dnd-item data-testid="block" data-block-type={b.type}
        onDragOver={allow("block", (d) => d.lk === l.key, k)} onDragLeave={() => over === k && setOver(null)}
        onDrop={(e) => { const d = drag.current; if (!d || d.kind !== "block" || d.lk !== l.key) return; e.preventDefault(); e.stopPropagation(); moveBlock(m.key, l.key, l.blocks.findIndex((x) => x.key === d.key), bi); dragEnd(); }}
        className={`rounded-lg border bg-surface-2 p-3 ${over === k ? "border-brand ring-2 ring-brand" : "border-line"}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {handle("block", label, { kind: "block", mk: m.key, lk: l.key, key: b.key })}
          <span className="badge bg-surface text-ink">{BLOCK_LABEL(t)[b.type]}</span>
          {b.type === "code" && (
            <select aria-label={t("{label}: бағдарламалау тілі", { label })} className="input !w-auto !py-1" value={b.language} onChange={(e) => upd({ language: e.target.value })}>
              {LANGS.map((x) => <option key={x} value={x}>{LANG_LABEL(t)[x]}</option>)}
            </select>
          )}
          <span className="ml-auto flex gap-1">
            {upDown(label, bi, l.blocks.length, (dir) => moveBlock(m.key, l.key, bi, bi + dir))}
            <button type="button" className="btn-secondary !px-2 !py-1 text-red-700 dark:text-red-300" aria-label={t("{label}: өшіру", { label })} onClick={() => edit((d) => { const x = findL(d, m.key, l.key).l; if (x) x.blocks = x.blocks.filter((y) => y.key !== b.key); })}>{t("Өшіру")}</button>
          </span>
        </div>
        {(b.type === "text" || b.type === "note") && (
          <textarea aria-label={t("{label}: мазмұны", { label })} rows={4} className="input" value={b.content} maxLength={20000} onChange={(e) => upd({ content: e.target.value })}
            placeholder={b.type === "note" ? t("Маңызды ескерту мәтіні") : t("Сабақ мәтіні")} />
        )}
        {b.type === "code" && (
          <textarea aria-label={t("{label}: код", { label })} rows={6} spellCheck={false} className="input font-mono" value={b.content} maxLength={20000} onChange={(e) => upd({ content: e.target.value })} placeholder={t("Код үлгісі")} />
        )}
        {(b.type === "image" || b.type === "video") && (
          <div className="grid gap-2">
            <input type="url" aria-label={t("{label}: https сілтемесі", { label })} className="input" value={b.content} onChange={(e) => upd({ content: e.target.value.trim() })}
              placeholder={b.type === "image" ? t("https://.../сурет.png") : t("https://.../бейне.mp4")} inputMode="url" />
            <input aria-label={t("{label}: атауы", { label })} className="input" value={b.caption} maxLength={200} onChange={(e) => upd({ caption: e.target.value })}
              placeholder={b.type === "image" ? t("Суреттің атауы (оқушыға alt мәтін болады)") : t("Бейне атауы")} />
            {b.content && !HTTPS.test(b.content) && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{t("Сілтеме https:// деп басталуы тиіс.")}</p>}
            {HTTPS.test(b.content) && (
              b.type === "image"
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={b.content} alt={b.caption || t("Алдын ала қарау")} data-testid="img-preview" className="max-h-48 max-w-full rounded-lg border border-line object-contain" />
                : <div className="text-sm">
                    <video src={b.content} controls preload="none" className="max-h-48 max-w-full rounded-lg border border-line" />
                    <a href={b.content} target="_blank" rel="noopener noreferrer" className="mt-1 block text-brand underline">{t("Бейнені жаңа бетте ашу")}</a>
                  </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderLesson(m: M, l: L, li: number) {
    const upd = (p: Partial<L>) => edit((d) => { const x = findL(d, m.key, l.key).l; if (x) Object.assign(x, p); });
    const name = l.title.trim() || t("{v}-сабақ", { v: li + 1 });
    const k = `l:${l.key}`;
    const known = assignments.some((a) => a.id === l.assignment_id);
    return (
      <div key={l.key} data-dnd-item data-testid="lesson"
        onDragOver={allow("lesson", () => true, k)} onDragLeave={() => over === k && setOver(null)}
        onDrop={(e) => { const d = drag.current; if (!d || d.kind !== "lesson") return; e.preventDefault(); e.stopPropagation(); moveLessonTo(d.mk!, d.key, m.key, li); dragEnd(); }}
        className={`rounded-lg border bg-surface p-3 ${over === k ? "border-brand ring-2 ring-brand" : "border-line"}`}>
        <div className="flex flex-wrap items-center gap-2">
          {handle("lesson", name, { kind: "lesson", mk: m.key, key: l.key })}
          <button type="button" className="btn-secondary !px-2 !py-1" aria-expanded={l.open} aria-label={`${name}: ${l.open ? t("жабу") : t("ашу")}`} onClick={() => upd({ open: !l.open })}>{l.open ? "▾" : "▸"}</button>
          <input aria-label={t("{v}-сабақтың атауы", { v: li + 1 })} className="input min-w-0 flex-1 basis-40" value={l.title} maxLength={160} placeholder={t("Сабақ атауы")} onChange={(e) => upd({ title: e.target.value })} />
          <span className="flex gap-1">
            {upDown(name, li, m.lessons.length, (dir) => moveLessonUpDown(m.key, l.key, dir))}
            <button type="button" className="btn-secondary !px-2 !py-1 text-red-700 dark:text-red-300" aria-label={t("{name}: өшіру", { name })}
              onClick={() => { if (confirmDel(l.blocks.length > 0, t("\"{name}\" сабағы", { name }))) edit((d) => { const mm = d.find((x) => x.key === m.key); if (mm) mm.lessons = mm.lessons.filter((x) => x.key !== l.key); }); }}>{t("Өшіру")}</button>
          </span>
        </div>
        {!l.open && (l.blocks.length > 0 || l.assignment_id) && (
          <p className="mt-1 pl-8 text-xs text-ink-muted">{l.blocks.length}{" "}{t("блок")}{l.assignment_id ? (" " + t("· тапсырма бекітілген")) : ""}</p>
        )}
        {l.open && (
          <div className="mt-3 grid gap-3 border-t border-line pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">{t("Модуль")}
                <select className="input mt-1" value={m.key} onChange={(e) => moveLessonTo(m.key, l.key, e.target.value, null)}>
                  {mods.map((x, xi) => <option key={x.key} value={x.key}>{x.title.trim() || t("{v}-модуль", { v: xi + 1 })}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">{t("Тапсырма / тест")}
                <select className="input mt-1" value={l.assignment_id} onChange={(e) => upd({ assignment_id: e.target.value })} data-testid="assignment-select">
                  <option value="">{t("Бекітілмеген")}</option>
                  {!known && l.assignment_id && <option value={l.assignment_id}>{t("Таңдалған тапсырма (тізімде жоқ)")}</option>}
                  {assignments.map((a) => <option key={a.id} value={a.id}>{a.title} ({STATUS_KK(t)[a.status] ?? a.status})</option>)}
                </select>
                <span className="hint font-normal">{t("Жоқ па?")}{" "}<a href="/teacher/assignments/new" target="_blank" rel="noopener noreferrer" className="text-brand underline">{t("Жаңа тест жасау")}</a>{" "}{t("(жаңа бетте ашылады), сосын осы бетті жаңартыңыз.")}</span>
              </label>
            </div>
            <div className="grid gap-2" data-testid="blocks">
              {l.blocks.length === 0 && <p className="text-sm text-ink-muted">{t("Блок жоқ. Төмендегі батырмалармен мәтін, код, сурет, видео не ескерту қосыңыз.")}</p>}
              {l.blocks.map((b, bi) => renderBlock(m, l, b, bi))}
            </div>
            <div role="group" aria-label={t("{name}: блок қосу", { name })} className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">{t("Блок қосу:")}</span>
              {(Object.keys(BLOCK_LABEL(t)) as BlockType[]).map((tt) => (
                <button key={tt} type="button" className="btn-secondary !px-3 !py-1" data-testid={`add-${tt}`}
                  onClick={() => edit((d) => { const x = findL(d, m.key, l.key).l; x?.blocks.push({ key: nk(), type: tt, content: "", language: "python", caption: "" }); })}>+ {BLOCK_LABEL(t)[tt]}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderModule(m: M, mi: number) {
    const name = m.title.trim() || t("{v}-модуль", { v: mi + 1 });
    const k = `m:${m.key}`; const kl = `ml:${m.key}`;
    return (
      <section key={m.key} data-dnd-item data-testid="module" aria-label={name}
        onDragOver={allow("module", () => true, k)} onDragLeave={() => over === k && setOver(null)}
        onDrop={(e) => { const d = drag.current; if (!d || d.kind !== "module") return; e.preventDefault(); e.stopPropagation(); moveModule(mods.findIndex((x) => x.key === d.key), mi); dragEnd(); }}
        className={`card p-3 sm:p-4 ${over === k ? "ring-2 ring-brand" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          {handle("module", name, { kind: "module", key: m.key })}
          <input aria-label={t("{v}-модульдің атауы", { v: mi + 1 })} className="input min-w-0 flex-1 basis-40 font-semibold" value={m.title} maxLength={160} placeholder={t("Модуль атауы")}
            onChange={(e) => edit((d) => { const x = d.find((y) => y.key === m.key); if (x) x.title = e.target.value; })} />
          <span className="flex gap-1">
            {upDown(name, mi, mods.length, (dir) => moveModule(mi, mi + dir))}
            <button type="button" className="btn-secondary !px-2 !py-1 text-red-700 dark:text-red-300" aria-label={t("{name}: өшіру", { name })}
              onClick={() => { if (confirmDel(m.lessons.length > 0, t("\"{name}\" модулі", { name }))) edit((d) => { const i = d.findIndex((x) => x.key === m.key); if (i >= 0) d.splice(i, 1); }); }}>{t("Өшіру")}</button>
          </span>
        </div>
        <div className={`mt-3 grid gap-2 rounded-lg ${over === kl ? "ring-2 ring-brand" : ""}`} data-testid="lessons"
          onDragOver={allow("lesson", () => true, kl)} onDragLeave={() => over === kl && setOver(null)}
          onDrop={(e) => { const d = drag.current; if (!d || d.kind !== "lesson") return; e.preventDefault(); e.stopPropagation(); moveLessonTo(d.mk!, d.key, m.key, null); dragEnd(); }}>
          {m.lessons.length === 0 && <p className="text-sm text-ink-muted">{t("Сабақ жоқ.")}</p>}
          {m.lessons.map((l, li) => renderLesson(m, l, li))}
        </div>
        <div className="mt-3">
          <button type="button" className="btn-secondary" data-testid="add-lesson"
            onClick={() => edit((d) => { const x = d.find((y) => y.key === m.key); x?.lessons.push({ key: nk(), title: "", assignment_id: "", blocks: [], open: true }); })}>{t("+ Сабақ қосу")}</button>
        </div>
      </section>
    );
  }

  return (
    <div data-testid="course-builder">
      <p className="mb-3 text-sm text-ink-muted">
        {t("Модульдер мен сабақтарды сүйреп (⠿) не ↑ ↓ батырмаларымен реттеңіз. Өзгерістер «Сақтау» басқанда ғана сақталады. Модуль: {length}, сабақ: {total}.", { length: mods.length, total })}
      </p>
      <div className="grid gap-4">
        {mods.length === 0 && <div className="card px-4 py-8 text-center text-sm text-ink-muted">{t("Курста әлі модуль жоқ. Алғашқы модульді қосыңыз.")}</div>}
        {mods.map((m, mi) => renderModule(m, mi))}
      </div>
      <div className="sticky bottom-0 z-10 -mx-1 mt-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-1 py-3 backdrop-blur">
        <button type="button" className="btn-secondary" data-testid="add-module" onClick={() => edit((d) => { d.push({ key: nk(), title: "", lessons: [] }); })}>{t("+ Модуль қосу")}</button>
        <button type="button" className="btn-primary" onClick={save} disabled={pending} data-testid="save-structure">{pending ? t("Сақталуда...") : t("Сақтау")}</button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
