import { Shell } from "@/components/Shell";
import { requireStaff } from "@/lib/context";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();
  return (
    <Shell ctx={ctx} active={ctx.active} area="teacher" nav={[
      { href: "/teacher", label: "Сыныптарым", icon: "🏷" }, { href: "/teacher/assignments", label: "Тапсырмалар", icon: "📝" },
      { href: "/teacher/review", label: "Тексеру кезегі", icon: "✅" },
    ]}>{children}</Shell>
  );
}
