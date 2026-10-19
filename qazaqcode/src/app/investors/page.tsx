import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

import { LangSwitch } from "@/components/LangSwitch";
// Инвесторларға арналған ШЫНАЙЫ жағдай беті. Ойдан шығарылған клиент, пікір, нарық көлемі немесе табыс жоқ.
// Мазмұн docs/INVESTOR.md-мен келісілген; сандар тексеріледі (npm run test:db, test:unit, playwright test).
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const t = await getT(); return { title: t("Инвесторларға"), description: t("QazaqCode Platform: өнімнің шынайы жағдайы, тәуекелдер және тартылымға дейінгі жол картасы.") }; }

const CONTACT = (process.env.CONTACT_EMAIL || "").trim();

// Сандар коммит 84918e1 күйінде `node scripts/dataroom.mjs --json` шығысынан алынған (docs/INVESTOR.md-пен келісілген).
// Бұл СТАТИКАЛЫҚ мәтін: код өзгерсе, `node scripts/dataroom.mjs` қайта жүргізіліп, осы жер мен INVESTOR.md жаңартылады.
// "Тесттер" саны - соңғы белгілі жергілікті жүгіру (tests.lastKnown); статикалық санау (test()/it() шақырулары) аз: циклмен жасалған тесттер бір рет есептеледі.
const SNAPSHOT = "коммит 84918e1, 2026-10-19";
const FACTS = (t: TFn): [string, string][] => ([
  [t("Сатысы"), t("Пилотқа дейінгі өнім. Нақты мектепте әлі сыналмаған.")],
  [t("Пайдаланушылар / табыс"), t("Әзірге жоқ. Төленген клиент жоқ.")],
  [t("Өнім"), t("Көп ұйымды платформа: 4 рөл, сыныптар, 7 тапсырма түрі, автоматты тест, курс конструкторы, аналитика, Excel/PDF, лицензия, white-label.")],
  [t("Код"), t("≈9 200 жол TypeScript/TSX (src), 11 миграция (≈2 000 жол SQL, PostgreSQL + RLS), ≈4 700 жол тест коды.")],
  [t("Тесттер"), t("131 E2E, 85 дерекқор, 72 unit (соңғы белгілі жергілікті жүгіру). Статикалық санау (test() шақырулары): 128 E2E, 85 дерекқор, 32 unit.")],
  [t("Қауіпсіздік"), t("Ішкі аудит: 20 мәселе табылып түзетілген. Тәуелсіз пентест жоқ.")],
]);

const DATAROOM: [string, string][] = [
  ["FACTS.json / FACTS.md", "коммит SHA мен күні, код жолдары, миграция саны, тесттер, тәуелділіктер саны, құжаттар тізімі"],
  ["LICENSES.md / .json", "production тәуелділіктердің лицензиялары (SBOM қысқаша); GPL/LGPL және нақты емес лицензиялар бөлек ескертіледі"],
  ["AUDIT.json", "npm audit --omit=dev қысқа қорытындысы (желі болмаса \"қолжетімсіз\")"],
  ["RISKS.md, DOCS-INDEX.md", "ашық тәуекелдер (INVESTOR, SECURITY-AUDIT, LEGAL-REVIEW ішінен) және құжаттар индексі"],
];

const DOWNLOADS: [string, string, string][] = [
  ["/investors/QazaqCode-pitch.pptx", "Питч дек (PPTX, 14 слайд)", "Қазақша; ойдан шығарылған сан жоқ, слайд жазбаларында сұрақтарға жауап."],
  ["/investors/QazaqCode-financial-model.xlsx", "Қаржылық модель шаблоны (XLSX)", "Барлық болжам БОС (гипотеза). Формулалар тірі; сіз өз сандарыңызды енгізесіз."],
  ["/investors/INVESTOR-FAQ.md", "Инвестор сұрақтары (MD, 30 сұрақ)", "Шынайы жауаптар: команда, IP, деректер заңы, қауіпсіздік, масштаб, баға."],
];

const READY: [string, string, boolean][] = [
  ["Репозиторий мен сәулет құжаттары", "Дайын", true],
  ["Автоматты тесттер", "Дайын (CI нәтижесін GitHub Actions-та тексеру керек)", true],
  ["Деректер бөлмесі (FACTS, лицензия, тәуекел)", "Дайын: node scripts/dataroom.mjs", true],
  ["Питч дек, FAQ, қаржылық модель шаблоны", "Дайын (модель болжамдары бос)", true],
  ["Қауіпсіздік аудиті (ішкі)", "Дайын; тәуелсіз пентест жоқ", false],
  ["Лицензиялық тазалық / IP тізілімі", "Дайын (COPYRIGHT.md); заңгер растауы жоқ", false],
  ["Нақты метрика, пилот есебі", "Жоқ", false],
  ["Толтырылған қаржылық модель (баға, шығын, маржа)", "Жоқ: баға мен шығын расталмаған", false],
  ["Команда мен рөлдер", "1 адам", false],
  ["Шарттар, құпиялылық саясаты, SLA", "Жоқ (заңгер)", false],
];

const FAQ: [string, string][] = [
  ["Кодты кім жазды?", "Негізін қалаушы тапсырма беріп, тексеріп, қабылдады; код пен тесттің көп бөлігін ИИ-ассистент (Claude) жазды. Бұл IP тәуекелі ретінде ашық көрсетілген: заңгер тексеруі керек."],
  ["Нарық көлемі қанша?", "Білмейміз. Нарық зерттелмеген, расталған дереккөзсіз сан келтірмейміз."],
  ["Баға қанша?", "Белгіленбеген. Лицензия деңгейлері өнімде бар, ал баға - пилоттан кейін есептелетін гипотеза."],
  ["Бәсекелестер кімдер?", "Жүйелі талдау жасалмаған. Артықшылығымызды дәлелденген деп айтпаймыз."],
  ["Код тапсырмасын автоматты тексересіздер ме?", "Серверде жоқ (sandbox жасалмаған). Тест түрлері автоматты бағаланады, код тапсырмасын мұғалім қолмен бағалайды."],
  ["Дербес деректер заңы?", "Техникалық чеклист бар, заңгер растауы жоқ. Келісім механизмі және оқушы деректерін өшіру/экспорт интерфейсі жоқ."],
];

const GAPS = (t: TFn) => [
  t("Нақты мектепте пилот жүргізілмеген"),
  t("Supabase Auth нақты жобада сыналмаған; Docker image құрылмаған"),
  t("Кодты серверде автоматты тексеру (sandbox) жасалмаған: код тапсырмасын мұғалім қолмен бағалайды"),
  t("Дербес деректер заңы бойынша заңгер консультациясы қажет (кәмелетсіздер деректері)"),
  t("Авторлық құқық мәртебесі заңгерлік тексеруді қажет етеді"),
  t("Баға мен қаржылық модель пилоттан кейін ғана есептеледі"),
];

const ROAD = (t: TFn): [string, string][] => [
  [t("1. Сұрау воронкасы"), t("Мектептерден пилот сұрау: нақты сандар мен статустар.")],
  [t("2. Пилот"), t("1-3 мектеп, 6-8 апта: белсенді оқушылар, тапсырма орындау үлесі, мұғалімнің тексеру уақыты, қателер.")],
  [t("3. Заң және қауіпсіздік"), t("Заңгер, тәуелсіз пентест, нақты хостинг, резервтік көшірме жаттығуы.")],
  [t("4. Баға сынағы"), t("Пилот мектептермен баға мен төлеуге дайындықты тексеру.")],
  [t("5. Инвестиция туралы әңгіме"), t("2-4 қадамнан кейін: нақты метрика мен кері байланыспен.")],
];

export default async function Investors() { const t = await getT();
  return (
    <div className="bg-surface-2">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">Qazaq<span className="text-brand">Code</span></Link>
          <div className="flex items-center gap-2"><LangSwitch /><ThemeToggle /><Link href="/schools" className="btn-secondary">{t("Мектептерге")}</Link></div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">{t("Инвесторларға")}</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("Қайда тұрмыз: ашық және тексерілетін жағдай")}</h1>
        <p className="mt-4 max-w-3xl text-ink-muted">
          {t("Мұнда ойдан шығарылған клиент, пікір, нарық көлемі не табыс жоқ. Біз өнімді жасадық, бірақ тартылымды әлі алған жоқпыз: ол үшін мектептермен пилот керек.")}
        </p>

        <section className="mt-10" aria-labelledby="facts-h">
          <h2 id="facts-h" className="text-xl font-bold">{t("Фактілер")}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {FACTS(t).map(([k, v]) => (
              <div key={k} className="card p-4"><dt className="text-sm font-semibold text-brand">{k}</dt><dd className="mt-1 text-sm">{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="mt-10" aria-labelledby="gaps-h">
          <h2 id="gaps-h" className="text-xl font-bold">{t("Әлі жоқ немесе сыналмаған")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {GAPS(t).map((g) => <li key={g} className="card flex gap-3 p-3"><span aria-hidden className="text-ink-muted">○</span>{g}</li>)}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="dr-h">
          <h2 id="dr-h" className="text-xl font-bold">{t("Деректер бөлмесі (data room)")}</h2>
          <p className="mt-3 max-w-3xl text-sm text-ink-muted">
            Техникалық due-diligence бір командамен жасалады: <code>node scripts/dataroom.mjs</code> (нәтиже <code>out/dataroom/</code>, git-ке кірмейді). Тек репо мен тесттен алынған фактілер; құпия, <code>.env</code>, кілттер кірмейді.
            Тесттерді қайта жүргізу: <code>--run-tests</code>. Төмендегі сандар: {SNAPSHOT}.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {DATAROOM.map(([k, v]) => <li key={k} className="card p-4"><p className="text-sm font-semibold text-brand">{k}</p><p className="mt-1 text-sm">{t(v)}</p></li>)}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="dl-h">
          <h2 id="dl-h" className="text-xl font-bold">{t("Жүктеу")}</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {DOWNLOADS.map(([href, title, d]) => (
              <li key={href} className="card flex flex-col p-4">
                <h3 className="text-sm font-bold">{t(title)}</h3>
                <p className="mt-1 flex-1 text-xs text-ink-muted">{t(d)}</p>
                <a className="btn-secondary mt-3 text-center" href={href} download>{t("Жүктеу")}</a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">Қаржылық модельдегі барлық болжам - гипотеза/толтырылмаған. Питч дек пен FAQ-тағы сандар тек репо мен тесттен.</p>
        </section>

        <section className="mt-10" aria-labelledby="ready-h">
          <h2 id="ready-h" className="text-xl font-bold">{t("Дайын / жоқ")}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line text-ink-muted"><th className="py-2 pr-4 font-semibold">{t("Тармақ")}</th><th className="py-2 pr-4 font-semibold">{t("Күйі")}</th></tr></thead>
              <tbody>
                {READY.map(([k, v, ok]) => (
                  <tr key={k} className="border-b border-line align-top">
                    <td className="py-2 pr-4">{t(k)}</td>
                    <td className="py-2 pr-4"><span aria-hidden className="mr-2">{ok ? "●" : "○"}</span>{t(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="road-h">
          <h2 id="road-h" className="text-xl font-bold">{t("Тартылымға дейінгі жол картасы")}</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-5">
            {ROAD(t).map(([tt, d]) => (
              <li key={tt} className="card p-4"><h3 className="text-sm font-bold">{tt}</h3><p className="mt-1 text-xs text-ink-muted">{d}</p></li>
            ))}
          </ol>
        </section>

        <section className="mt-10" aria-labelledby="model-h">
          <h2 id="model-h" className="text-xl font-bold">{t("Бизнес-модель (гипотеза)")}</h2>
          <p className="mt-3 max-w-3xl text-sm text-ink-muted">
            {t("Мектеп, колледж не IT академия жылдық лицензия төлейді; оқушы төлемейді. Жоспарлар: STARTER (100 оқушы / 5 мұғалім), PRO (500 / 25), ENTERPRISE (келісім бойынша). Баға белгіленбеген: нарықтық дәлел жоқ, пилоттан кейін шығынмен есептеледі.")}
          </p>
        </section>

        <section className="mt-10" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-xl font-bold">{t("Қысқа FAQ")}</h2>
          <div className="mt-4 space-y-2">
            {FAQ.map(([q, a]) => (
              <details key={q} className="card p-4">
                <summary className="cursor-pointer text-sm font-semibold">{t(q)}</summary>
                <p className="mt-2 text-sm text-ink-muted">{t(a)}</p>
              </details>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">Барлық 30 сұрақ: <a href="/investors/INVESTOR-FAQ.md" download>INVESTOR-FAQ.md</a>.</p>
        </section>

        <section className="mt-10 card p-6" aria-labelledby="next-h">
          <h2 id="next-h" className="text-xl font-bold">{t("Біз қазір не іздейміз")}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {t("Бірінші кезекте -")}{" "}<strong>{t("пилот серіктестер")}</strong>{" "}{t("(мектеп, колледж, IT академия). Қаржылық қолдау туралы әңгіме пилот нәтижесінен кейін мағыналы болады. Толық құжат:")}{" "}<code>docs/INVESTOR.md</code>{" "}{t("(тәуекелдер, due-diligence тізімі, қаражат бөлу категориялары: сомасыз, заңгер, қауіпсіздік шолуы, пилоттар, сату).")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/schools#request" className="btn-primary">{t("Пилотқа қатысу")}</Link>
            {CONTACT ? <a className="btn-secondary" href={`mailto:${CONTACT}?subject=${encodeURIComponent(t("QazaqCode: инвестор сұрауы"))}`}>{t("Байланысу")}</a> : null}
          </div>
        </section>
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted sm:px-6">
          <p>{t("© QazaqCode Platform. Бұл бет инвестициялық ұсыныс не кеңес емес.")}</p>
          <p><Link href="/">{t("Басты бет")}</Link> · <Link href="/schools">{t("Мектептерге")}</Link></p>
        </div>
      </footer>
    </div>
  );
}
