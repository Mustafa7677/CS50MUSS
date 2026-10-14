// Таза (DB-сіз) түс көмекшілері: клиент компоненттерден де импорттауға болады.
// WCAG 2.x: мәтін/фон контрасты кемінде 4.5:1 (AA).
export const HEX = /^#[0-9a-fA-F]{6}$/;
export const AA = 4.5;
/** Беттің фондары (globals.css токендерімен бірдей): ашық және қараңғы режим */
export const LIGHT_SURFACE = "#ffffff", LIGHT_SURFACE_2 = "#f4f6f8";
export const DARK_SURFACE = "#0f172a", DARK_SURFACE_2 = "#162033";
export const DARK_INK = "#0f172a";

type RGB = [number, number, number];
const toRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

/** Салыстырмалы жарықтық (WCAG) */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Екі түстің контраст қатынасы (1..21) */
export function contrast(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 1;
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** a*t + b*(1-t) (sRGB, color-mix(in srgb) сияқты) */
export function mix(a: string, b: string, t: number): string {
  const [p, q] = [toRgb(a), toRgb(b)];
  return toHex([0, 1, 2].map((i) => p[i] * t + q[i] * (1 - t)) as RGB);
}

/** Түстен оқылатын мәтін түсін таңдау (WCAG контрасты) */
export function inkFor(hex: string): string {
  if (!HEX.test(hex)) return "#ffffff";
  // ақ не қою мәтін: контрасты жоғарысы (өтпелі аймақта да оқылатын)
  return contrast(hex, DARK_INK) > contrast(hex, "#ffffff") ? DARK_INK : "#ffffff";
}

/** Негізгі түс пен оның үстіндегі батырма мәтіні арасындағы контраст */
export function buttonContrast(primary: string): number {
  return contrast(primary, inkFor(primary));
}

/** Түсті мәтін ретінде (сілтеме, тақырып) ақ және қараңғы фонда оқылатындай ету: [ашық режим, қараңғы режим] */
export function linkColors(brand: string): { light: string; dark: string } {
  let light = brand;
  for (let t = 0; t <= 1 && Math.min(contrast(light, LIGHT_SURFACE), contrast(light, LIGHT_SURFACE_2)) < AA; t += 0.02) light = mix("#000000", brand, t);
  // қараңғы режим: globals.css-тегі әдепкі (55% түс + ақ) нүктеден бастап ашамыз
  let dark = mix(brand, "#ffffff", 0.55);
  for (let t = 0.55; t >= 0 && Math.min(contrast(dark, DARK_SURFACE), contrast(dark, DARK_SURFACE_2)) < AA; t -= 0.02) dark = mix(brand, "#ffffff", Math.max(0, t));
  return { light, dark };
}

/**
 * Негізгі түсті батырма мәтінімен AA контрастқа жеткізетін ең жақын түс:
 * не күңгірттейді (ақ мәтін), не ашады (қою мәтін); аз өзгеретінін таңдайды.
 */
export function fixPrimary(hex: string): string {
  if (!HEX.test(hex)) return hex;
  const h = hex.toLowerCase();
  if (buttonContrast(h) >= AA) return h;
  const search = (target: string, ink: string) => {
    for (let t = 0; t <= 1.0001; t += 0.01) { const c = mix(target, h, Math.min(1, t)); if (contrast(c, ink) >= AA) return { c, t }; }
    return { c: target, t: 1 };
  };
  const dark = search("#000000", "#ffffff"), light = search("#ffffff", DARK_INK);
  return dark.t <= light.t ? dark.c : light.c;
}
