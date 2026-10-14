import { CodeCopy } from "./CodeCopy";

export type BlockData = { type: string; content: string; language?: string; caption?: string };

const LANG: Record<string, string> = { python: "Python", sql: "SQL", javascript: "JavaScript", html: "HTML", css: "CSS", text: "Мәтін" };

/** Оқушы көретін блок рендері (сервер-үйлесімді). Сурет/видео тек https. */
export function BlockView({ block }: { block: BlockData }) {
  const { type, content, language, caption } = block;
  if (type === "text") {
    return <div className="whitespace-pre-wrap break-words leading-relaxed">{content}</div>;
  }
  if (type === "note") {
    return (
      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        <p className="mb-1 font-semibold">Ескерту</p>
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    );
  }
  if (type === "code") {
    return (
      <figure className="overflow-hidden rounded-xl border border-line bg-surface-2">
        <figcaption className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5 text-xs text-ink-muted">
          <span>{LANG[language ?? "text"] ?? language ?? "Мәтін"}</span>
          <CodeCopy text={content} />
        </figcaption>
        <pre className="max-w-full overflow-x-auto p-3 text-sm leading-relaxed"><code className="font-mono">{content}</code></pre>
      </figure>
    );
  }
  if (type === "image") {
    if (!/^https:\/\//i.test(content)) return null;
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content} alt={caption ?? ""} loading="lazy" className="max-h-[32rem] max-w-full rounded-xl border border-line" />
        {caption && <figcaption className="mt-1 text-sm text-ink-muted">{caption}</figcaption>}
      </figure>
    );
  }
  if (type === "video") {
    if (!/^https:\/\//i.test(content)) return null;
    return (
      <figure>
        <video src={content} controls preload="metadata" className="max-w-full rounded-xl border border-line">
          Браузеріңіз бейнені қолдамайды.
        </video>
        <figcaption className="mt-1 text-sm text-ink-muted">
          {caption && <span>{caption} - </span>}
          <a href={content} target="_blank" rel="noopener noreferrer" className="text-brand underline">Бейнені жаңа бетте ашу</a>
        </figcaption>
      </figure>
    );
  }
  return null;
}
