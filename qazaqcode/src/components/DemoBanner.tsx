import { Banner } from "./ui";
import type { Ctx } from "@/lib/context";
import { getT } from "@/lib/i18n";

/** Демо ұйымдарда ғана (is_demo) барлық рөл аймақтарында көрінеді; нақты ұйымдарда ешқашан шықпайды. */
export async function DemoBanner({ ctx }: { ctx: Pick<Ctx, "active"> }) { const t = await getT();
  if (!ctx.active?.is_demo) return null;
  return (
    <div data-testid="demo-banner">
      <Banner tone="info">
        <strong>{t("ДЕМО ДЕРЕК:")}</strong>{" "}{t("бұл ұйымдағы мектеп, адамдар мен нәтижелердің бәрі - ойдан құрастырылған сынақ деректері, нақты клиент деректері емес.")}
      </Banner>
    </div>
  );
}
