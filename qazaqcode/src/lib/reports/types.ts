// Есептердің ортақ үлгісі: бір деректен Excel де, PDF те жасалады.
export type ColType = "text" | "int" | "dec" | "pct";
export type Cell = string | number | null | { v: string | number | null; t: ColType };
export type Column = { header: string; type: ColType; width: number };
export type Sheet = { name: string; title: string; columns: Column[]; rows: Cell[][]; emptyNote?: string };
export type DateRange = { from: string; to: string };
export type Report = {
  title: string;
  orgName: string;
  generatedAt: Date;
  range: DateRange | null;
  sheets: Sheet[];
  fileBase: string;
};
