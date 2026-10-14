import { Shell } from "@/components/Shell";
import { NotificationBell } from "@/components/NotificationBell";
import { requireStaff } from "@/lib/context";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();
  return (
    <Shell ctx={ctx} active={ctx.active} area="teacher" nav={[
      { href: "/teacher", label: "Сыныптарым", icon: "🏷" }, { href: "/teacher/assignments", label: "Тапсырмалар", icon: "📝" }, { href: "/teacher/courses", label: "Курстар", icon: "📚" },
      { href: "/teacher/review", label: "Тексеру кезегі", icon: "✅" },
    ]}>
      <div className="mb-4 flex justify-end"><NotificationBell userId={ctx.userId} /></div>
      {children}
    </Shell>
  );
}
