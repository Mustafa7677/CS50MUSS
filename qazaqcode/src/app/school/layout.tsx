import { Shell } from "@/components/Shell";
import { NotificationBell } from "@/components/NotificationBell";
import { requireSchoolAdmin } from "@/lib/context";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSchoolAdmin();
  return (
    <Shell ctx={ctx} active={ctx.active} area="school" nav={[
      { href: "/school", label: "Шолу", icon: "📊" }, { href: "/school/teachers", label: "Мұғалімдер", icon: "👩‍🏫" },
      { href: "/school/classes", label: "Сыныптар", icon: "🏷" }, { href: "/school/students", label: "Оқушылар", icon: "🎒" }, { href: "/school/courses", label: "Курстар", icon: "📚" }, { href: "/school/export", label: "Есеп", icon: "📥" }, { href: "/school/settings", label: "Баптаулар", icon: "⚙" },
    ]}>
      <div className="mb-4 flex justify-end"><NotificationBell userId={ctx.userId} /></div>
      {children}
    </Shell>
  );
}
