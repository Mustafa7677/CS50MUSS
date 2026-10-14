// Таза (DB-сіз) түс көмекшілері: клиент компоненттерден де импорттауға болады.
export const HEX = /^#[0-9a-fA-F]{6}$/;
/** Түстен оқылатын мәтін түсін таңдау (WCAG контрасты) */
export function inkFor(hex: string): string {
  if (!HEX.test(hex)) return "#ffffff";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.4 ? "#0f172a" : "#ffffff";
}
