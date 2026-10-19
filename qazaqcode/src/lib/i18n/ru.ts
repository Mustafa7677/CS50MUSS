// ru каталогы: кілт = қазақша бастапқы мәтін, мән = орысша аударма. Бөліктер ru/*.ts ішінде.
// Жоқ кілт -> қазақша мәтін (fallback). Қолмен жазғанда плейсхолдерлер ({name}) kk кілтімен бірдей болуы тиіс.
import type { Catalog } from "./core";
import { common } from "./ru/common";
import { ui } from "./ru/ui";
import { ops } from "./ru/ops";
import { extra } from "./ru/extra";

export const ru: Catalog = { ...common, ...ui, ...ops, ...extra };
