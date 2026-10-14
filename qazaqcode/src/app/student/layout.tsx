import { Shell } from "@/components/Shell";
import { requireStudent } from "@/lib/context";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStudent();
  return (
    <Shell ctx={ctx} active={ctx.active} area="student" nav={[
      { href: "/student", label: "Басты бет", icon: "🏠" }, { href: "/student/assignments", label: "Тапсырмаларым", icon: "📝" },
      { href: "/student/grades", label: "Бағаларым", icon: "🎓" },
    ]}>{children}</Shell>
  );
}
