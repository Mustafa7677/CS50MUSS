import Link from "next/link";
import { SellerForm, type SellerVal } from "@/components/admin/SellerForm";
import { Banner, PageHeader } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";

export const metadata = { title: "Сатушы профилі" };
export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const ctx = await requirePlatformAdmin();
  const v = await withUser(ctx.userId, async (q) => (await q<NonNullable<SellerVal>>(
    "select legal_name, bin_iin, address, bank_name, bik, iik, kbe, vat_payer, vat_cert, director_name, payment_terms_days, contact_email, contact_phone from public.platform_seller_profile"))[0] ?? null);
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/orders">← Тапсырыстар</Link></p>
      <PageHeader title="Сатушы профилі" subtitle="Шоттағы «Орындаушы» деректері. Реквизиттерді иесі өзі енгізеді; толтырылмаса шот берілмейді және PDF жасалмайды." />
      {!v && <Banner tone="warn">Сатушы реквизиттері әлі толтырылмаған: сатушы реквизиттерін толтырыңыз, әйтпесе шот бере алмайсыз.</Banner>}
      <SellerForm v={v} />
    </>
  );
}
