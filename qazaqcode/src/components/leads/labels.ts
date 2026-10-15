export const LEAD_STATUSES = ["new", "contacted", "demo", "pilot", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABEL: Record<string, string> = { new: "Жаңа", contacted: "Байланыс орнатылды", demo: "Демо", pilot: "Пилот", won: "Сатылды", lost: "Жоғалды" };
export const LEAD_ROLE_LABEL: Record<string, string> = { director: "Директор", deputy: "Директордың орынбасары", teacher: "Мұғалім", it: "IT маманы", other: "Басқа" };
export const LEAD_TYPE_LABEL: Record<string, string> = { school: "Мектеп", college: "Колледж", academy: "Академия / оқу орталығы", other: "Басқа" };
export type LeadRow = {
  id: string; created_at: string; org_name: string; contact_name: string; email: string; phone: string | null; role: string; org_type: string;
  students_estimate: number | null; message: string | null; status: string; notes: string | null; source: string | null;
};
export const LEAD_COLS = "id, created_at, org_name, contact_name, email, phone, role, org_type, students_estimate, message, status, notes, source";
/** ILIKE үшін % _ \ экрандау */
export const likePattern = (s: string) => `%${s.replace(/[\\%_]/g, "\\$&")}%`;
