import { requireSchoolAdmin } from "@/lib/context";
import { brandFor } from "@/lib/brand";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/ui";
import { BrandForm } from "./BrandForm";
import { saveBrandAction } from "./actions";

export const metadata = { title: "Баптаулар" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireSchoolAdmin();
  const b = await brandFor(ctx.userId, ctx.active.org_id);
  const loginUrl = `${env().APP_URL.replace(/\/$/, "")}/login?org=${encodeURIComponent(ctx.active.org_slug)}`;
  return (
    <>
      <PageHeader title="Баптаулар" subtitle="Мектептің брендингі: логотип, түстер, қарсы алу мәтіні және кіру беті. Өзгерістер сақталған соң панельде бірден қолданылады." />
      <BrandForm action={saveBrandAction} loginUrl={loginUrl}
        init={{ name: b.name, logo_url: b.logo_url ?? "", primary_color: b.primary_color, secondary_color: b.secondary_color,
          welcome_text: b.welcome_text ?? "", contact_email: b.contact_email ?? "", contact_phone: b.contact_phone ?? "" }} />
    </>
  );
}
