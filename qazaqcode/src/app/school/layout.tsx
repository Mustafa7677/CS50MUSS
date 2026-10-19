import { Shell } from "@/components/Shell";
import { NotificationBell } from "@/components/NotificationBell";
import { LicenceBanner } from "@/components/LicenceBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { ActivityTouch } from "@/components/metrics/ActivityTouch";
import { requireSchoolAdmin } from "@/lib/context";
import { getT } from "@/lib/i18n";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) { const t = await getT();
  const ctx = await requireSchoolAdmin();
  return (
    <Shell ctx={ctx} active={ctx.active} area="school" nav={[
      { href: "/school", label: t("Шолу"), icon: "📊" }, { href: "/school/teachers", label: t("Мұғалімдер"), icon: "👩‍🏫" },
      { href: "/school/classes", label: t("Сыныптар"), icon: "🏷" }, { href: "/school/students", label: t("Оқушылар"), icon: "🎒" }, { href: "/school/courses", label: t("Курстар"), icon: "📚" }, { href: "/school/export", label: t("Есеп"), icon: "📥" }, { href: "/school/health", label: t("Денсаулық"), icon: "💚" }, { href: "/school/licence", label: t("Лицензия"), icon: "🪪" }, { href: "/school/ai", label: t("Көмекші"), icon: "🤖" }, { href: "/school/settings", label: t("Баптаулар"), icon: "⚙" },
    ]}>
      <div className="mb-4 flex justify-end"><NotificationBell userId={ctx.userId} /></div>
      <ActivityTouch ctx={ctx} /><DemoBanner ctx={ctx} /><LicenceBanner ctx={ctx} />
      {children}
    </Shell>
  );
}
