export type Area = "teacher" | "school";
export const courseBase = (a: Area) => (a === "school" ? "/school/courses" : "/teacher/courses");

export type BlockType = "text" | "code" | "image" | "video" | "note";
export const LANGS = ["python", "sql", "javascript", "html", "css", "text"] as const;

export type TreeBlock = { type: BlockType; content: string; language?: string; caption?: string };
export type TreeLesson = { id: string; title: string; assignment_id: string | null; blocks: TreeBlock[] };
export type TreeModule = { id: string; title: string; lessons: TreeLesson[] };
export type AssignmentOption = { id: string; title: string; status: string; kind: string };
