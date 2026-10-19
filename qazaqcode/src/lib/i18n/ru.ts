// ru каталогы: кілт = қазақша бастапқы мәтін, мән = орысша аударма. Бөліктер ru/*.ts ішінде.
// Жоқ кілт -> қазақша мәтін (fallback). Қолмен жазғанда плейсхолдерлер ({name}) kk кілтімен бірдей болуы тиіс.
import type { Catalog } from "./core";
import { common } from "./ru/common";
import { ui } from "./ru/ui";

export const ru: Catalog = { ...common, ...ui };
