import { withUser } from "./db";

export type Brand = { name: string; logo_url: string | null; primary_color: string; secondary_color: string; welcome_text: string | null; contact_email: string | null; contact_phone: string | null };
export const DEFAULT_BRAND: Brand = { name: "QazaqCode", logo_url: null, primary_color: "#0e7490", secondary_color: "#f2b705", welcome_text: null, contact_email: null, contact_phone: null };

/** Ұйымның white-label брендингі (кіру жүйесінен кейін, RLS арқылы). */
export async function brandFor(userId: string, orgId: string | null | undefined): Promise<Brand> {
  if (!orgId) return DEFAULT_BRAND;
  const r = await withUser(userId, (q) => q<Brand>(
    `select o.name, s.logo_url, s.primary_color, s.secondary_color, s.welcome_text, s.contact_email, s.contact_phone
       from organizations o join organization_settings s on s.org_id = o.id where o.id = $1`, [orgId]));
  return r[0] ?? DEFAULT_BRAND;
}

/** Анонимге: slug бойынша қауіпсіз жария брендинг (кіру беті) */
export async function publicBrand(slug: string | null | undefined): Promise<Brand> {
  if (!slug) return DEFAULT_BRAND;
  const r = await withUser(null, (q) => q<Brand>("select name, logo_url, primary_color, secondary_color, welcome_text, contact_email, contact_phone from public.org_branding($1)", [slug]));
  return r[0] ?? DEFAULT_BRAND;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Түстен оқылатын мәтін түсін таңдау (WCAG контрасты) */
export function inkFor(hex: string): string {
  if (!HEX.test(hex)) return "#ffffff";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.4 ? "#0f172a" : "#ffffff";
}
export function brandStyle(b: Brand): string {
  const p = HEX.test(b.primary_color) ? b.primary_color : DEFAULT_BRAND.primary_color;
  const a = HEX.test(b.secondary_color) ? b.secondary_color : DEFAULT_BRAND.secondary_color;
  return `:root{--brand:${p};--brand-ink:${inkFor(p)};--brand-soft:color-mix(in srgb, ${p} 12%, white);--accent:${a}}.dark{--brand-soft:color-mix(in srgb, ${p} 25%, #0f172a)}`;
}
