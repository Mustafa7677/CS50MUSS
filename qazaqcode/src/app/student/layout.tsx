import { Shell } from "@/components/Shell";
import { NotificationBell } from "@/components/NotificationBell";
import { LicenceBanner } from "@/components/LicenceBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { requireStudent } from "@/lib/context";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStudent();
  return (
    <Shell ctx={ctx} active={ctx.active} area="student" nav={[
      { href: "/student", label: "Басты бет", icon: "🏠" }, { href: "/student/courses", label: "Курстар", icon: "📚" },
      { href: "/student/assignments", label: "Тапсырмаларым", icon: "📝" }, { href: "/student/projects", label: "Жобалар", icon: "🗂️" },
      { href: "/student/grades", label: "Бағаларым", icon: "🎓" },
    ]}>
      <div className="mb-4 flex justify-end"><NotificationBell userId={ctx.userId} /></div>
      <DemoBanner ctx={ctx} /><LicenceBanner ctx={ctx} />
      {children}
    </Shell>
  );
}
