export const ORDER_STATUSES = ["requested", "quoted", "invoiced", "paid", "activated", "rejected", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABEL: Record<string, string> = {
  requested: "Сұралды", quoted: "Баға ұсынылды", invoiced: "Шот берілді", paid: "Төленді", activated: "Активтенді", rejected: "Қабылданбады", cancelled: "Бас тартылды",
};
export const ORDER_TONE: Record<string, string> = {
  requested: "in_progress", quoted: "submitted", invoiced: "under_review", paid: "graded", activated: "active", rejected: "overdue", cancelled: "archived",
};
export const VAT_MODE_LABEL: Record<string, string> = { none: "ҚҚС жоқ", included: "ҚҚС бағаға кіреді", added: "ҚҚС үстіне қосылады" };
export const OPEN_STATUSES = ["requested", "quoted", "invoiced"];
export const CAN_CANCEL = (s: string) => OPEN_STATUSES.includes(s);

export type Requisites = {
  legal_name: string; bin_iin: string; address: string; bank_name: string; bik: string; iik: string; kbe: string;
  contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null;
  vat_payer?: boolean; vat_cert?: string | null; director_name?: string; payment_terms_days?: number;
};
