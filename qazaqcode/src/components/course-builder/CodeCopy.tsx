"use client";
import { CopyButton } from "@/components/teacher/CopyButton";

/** Код блогының "Көшіру" батырмасы (кішкентай клиент компонент). */
export function CodeCopy({ text }: { text: string }) {
  return <CopyButton text={text} className="btn-secondary !px-2 !py-1 text-xs" />;
}
