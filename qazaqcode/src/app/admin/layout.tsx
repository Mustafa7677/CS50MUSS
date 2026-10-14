import { Shell } from "@/components/Shell";
import { requirePlatformAdmin } from "@/lib/context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePlatformAdmin();
  return <Shell ctx={ctx} active={null} area="admin" nav={[{ href: "/admin", label: "Ұйымдар", icon: "🏫" }, { href: "/admin/audit", label: "Аудит журналы", icon: "🧾" }]}>{children}</Shell>;
}
