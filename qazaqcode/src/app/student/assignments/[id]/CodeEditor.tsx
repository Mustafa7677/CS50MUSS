"use client";
import { useEffect, useMemo, useState } from "react";
import CodeMirror, { EditorView, keymap } from "@uiw/react-codemirror";
import type { Extension } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";

function language(kind: string): Extension[] {
  switch (kind) {
    case "python": return [python()];
    case "sql": return [sql()];
    case "javascript": return [javascript()];
    case "html_css": return [html()];
    default: return [];
  }
}

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

/** Tab: 4 бос орын (Esc басқан соң Tab пернетақта фокусын келесі элементке береді - қолжетімділік). */
function tabKeys(): Extension {
  let trap = true;
  return keymap.of([
    { key: "Escape", run: () => { trap = false; return true; } },
    {
      key: "Tab",
      run: (v) => {
        if (!trap) { trap = true; return false; }
        v.dispatch(v.state.replaceSelection("    "));
        return true;
      },
    },
  ]);
}

const tokens = EditorView.theme({
  "&": { backgroundColor: "var(--surface)", fontSize: "14px" },
  ".cm-gutters": { backgroundColor: "var(--surface-2)", color: "var(--ink-muted)", borderRight: "1px solid var(--line)" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--brand) 8%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--brand) 14%, transparent)" },
  "&.cm-focused": { outline: "2px solid var(--brand)", outlineOffset: "-2px" },
  ".cm-content, .cm-gutters": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
});

export default function CodeEditor({ value, onChange, kind, readOnly, height, label }: {
  value: string; onChange: (v: string) => void; kind: string; readOnly: boolean; height: string; label: string;
}) {
  const dark = useDark();
  const extensions = useMemo(() => [...language(kind), tabKeys(), tokens, EditorView.lineWrapping, EditorView.contentAttributes.of({ "aria-label": label })], [kind, label]);
  return (
    <CodeMirror
      value={value} onChange={onChange} extensions={extensions} theme={dark ? "dark" : "light"} height={height}
      readOnly={readOnly} editable={!readOnly}
      basicSetup={{ lineNumbers: true, indentOnInput: true, autocompletion: false, highlightActiveLine: !readOnly, foldGutter: false, bracketMatching: true, closeBrackets: true }}
    />
  );
}
