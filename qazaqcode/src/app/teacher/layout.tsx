import { Shell } from "@/components/Shell";
import { NotificationBell } from "@/components/NotificationBell";
import { LicenceBanner } from "@/components/LicenceBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { ActivityTouch } from "@/components/metrics/ActivityTouch";
import { requireStaff } from "@/lib/context";
import { getT } from "@/lib/i18n";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) { const t = await getT();
  const ctx = await requireStaff();
  return (
    <Shell ctx={ctx} active={ctx.active} area="teacher" nav={[
      { href: "/teacher", label: t("Сыныптарым"), icon: "🏷" }, { href: "/teacher/assignments", label: t("Тапсырмалар"), icon: "📝" }, { href: "/teacher/courses", label: t("Курстар"), icon: "📚" },
      { href: "/teacher/review", label: t("Тексеру кезегі"), icon: "✅" },
    ]}>
      <div className="mb-4 flex justify-end"><NotificationBell userId={ctx.userId} /></div>
      <ActivityTouch ctx={ctx} /><DemoBanner ctx={ctx} /><LicenceBanner ctx={ctx} />
      {children}
    </Shell>
  );
}
