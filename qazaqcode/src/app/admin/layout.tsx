import { Shell } from "@/components/Shell";
import { requirePlatformAdmin } from "@/lib/context";
import { getT } from "@/lib/i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) { const t = await getT();
  const ctx = await requirePlatformAdmin();
  return <Shell ctx={ctx} active={null} area="admin" nav={[{ href: "/admin", label: t("Ұйымдар"), icon: "🏫" }, { href: "/admin/leads", label: t("Пилот сұраулары"), icon: "📨" }, { href: "/admin/metrics", label: t("Метрика"), icon: "📈" }, { href: "/admin/orders", label: t("Тапсырыстар"), icon: "💳" }, { href: "/admin/audit", label: t("Аудит журналы"), icon: "🧾" }]}>{children}</Shell>;
}
