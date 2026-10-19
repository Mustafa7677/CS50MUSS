import { Shell } from "@/components/Shell";
import { NotificationBell } from "@/components/NotificationBell";
import { LicenceBanner } from "@/components/LicenceBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { ActivityTouch } from "@/components/metrics/ActivityTouch";
import { requireStudent } from "@/lib/context";
import { getT } from "@/lib/i18n";

export default async function StudentLayout({ children }: { children: React.ReactNode }) { const t = await getT();
  const ctx = await requireStudent();
  return (
    <Shell ctx={ctx} active={ctx.active} area="student" nav={[
      { href: "/student", label: t("Басты бет"), icon: "🏠" }, { href: "/student/courses", label: t("Курстар"), icon: "📚" },
      { href: "/student/assignments", label: t("Тапсырмаларым"), icon: "📝" }, { href: "/student/projects", label: t("Жобалар"), icon: "🗂️" },
      { href: "/student/grades", label: t("Бағаларым"), icon: "🎓" }, { href: "/student/ai", label: t("Көмекші"), icon: "🤖" },
    ]}>
      <div className="mb-4 flex justify-end"><NotificationBell userId={ctx.userId} /></div>
      <ActivityTouch ctx={ctx} /><DemoBanner ctx={ctx} /><LicenceBanner ctx={ctx} />
      {children}
    </Shell>
  );
}
