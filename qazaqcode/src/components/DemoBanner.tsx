import { Banner } from "./ui";
import type { Ctx } from "@/lib/context";

/** Демо ұйымдарда ғана (is_demo) барлық рөл аймақтарында көрінеді; нақты ұйымдарда ешқашан шықпайды. */
export function DemoBanner({ ctx }: { ctx: Pick<Ctx, "active"> }) {
  if (!ctx.active?.is_demo) return null;
  return (
    <div data-testid="demo-banner">
      <Banner tone="info">
        <strong>ДЕМО ДЕРЕК:</strong> бұл ұйымдағы мектеп, адамдар мен нәтижелердің бәрі - ойдан құрастырылған сынақ деректері, нақты клиент деректері емес.
      </Banner>
    </div>
  );
}
