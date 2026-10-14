import { CHIP_IDS, FALLBACK_ID, KNOWLEDGE } from "./knowledge";
import { advise as run, type AdviseInput, type Card } from "./match";

export type { AdviseInput, Card } from "./match";

/**
 * Кеңесші интерфейсі. Қазір - ережелі іске асыру (кеңестер базасы), сыртқы API жоқ.
 * Келешекте қалау бойынша LLM провайдерін осы интерфейс арқылы қосуға болады (docs/AI-TUTOR.md): route өзгермейді.
 */
export interface Advisor { answer(input: AdviseInput): Promise<Card> }

export const ruleAdvisor: Advisor = {
  async answer(input) { return run(input, KNOWLEDGE, { fallbackId: FALLBACK_ID, chipIds: CHIP_IDS }); },
};

export const topicChips = () => CHIP_IDS.map((id) => KNOWLEDGE.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e).map((e) => ({ id: e.id, title: e.title }));
