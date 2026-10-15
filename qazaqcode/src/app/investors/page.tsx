import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";

// Инвесторларға арналған ШЫНАЙЫ жағдай беті. Ойдан шығарылған клиент, пікір, нарық көлемі немесе табыс жоқ.
// Мазмұн docs/INVESTOR.md-мен келісілген; сандар тексеріледі (npm run test:db, test:unit, playwright test).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Инвесторларға", description: "QazaqCode Platform: өнімнің шынайы жағдайы, тәуекелдер және тартылымға дейінгі жол картасы." };

const CONTACT = (process.env.CONTACT_EMAIL || "").trim();

const FACTS: [string, string][] = [
  ["Сатысы", "Пилотқа дейінгі өнім. Нақты мектепте әлі сыналмаған."],
  ["Пайдаланушылар / табыс", "Әзірге жоқ. Төленген клиент жоқ."],
  ["Өнім", "Көп ұйымды платформа: 4 рөл, сыныптар, 7 тапсырма түрі, автоматты тест, курс конструкторы, аналитика, Excel/PDF, лицензия, white-label."],
  ["Код", "≈8 800 жол TypeScript, 10 миграция (PostgreSQL + RLS), ≈4 250 жол тест коды."],
  ["Тесттер", "118 E2E, 73 дерекқор, 72 unit тест (жергілікті жүгіруде өткен)."],
  ["Қауіпсіздік", "Ішкі аудит: 20 мәселе табылып түзетілген. Тәуелсіз пентест жоқ."],
];

const GAPS = [
  "Нақты мектепте пилот жүргізілмеген",
  "Supabase Auth нақты жобада сыналмаған; Docker image құрылмаған",
  "Кодты серверде автоматты тексеру (sandbox) жасалмаған: код тапсырмасын мұғалім қолмен бағалайды",
  "Дербес деректер заңы бойынша заңгер консультациясы қажет (кәмелетсіздер деректері)",
  "Авторлық құқық мәртебесі заңгерлік тексеруді қажет етеді",
  "Баға мен қаржылық модель пилоттан кейін ғана есептеледі",
];

const ROAD: [string, string][] = [
  ["1. Сұрау воронкасы", "Мектептерден пилот сұрау: нақты сандар мен статустар."],
  ["2. Пилот", "1-3 мектеп, 6-8 апта: белсенді оқушылар, тапсырма орындау үлесі, мұғалімнің тексеру уақыты, қателер."],
  ["3. Заң және қауіпсіздік", "Заңгер, тәуелсіз пентест, нақты хостинг, резервтік көшірме жаттығуы."],
  ["4. Баға сынағы", "Пилот мектептермен баға мен төлеуге дайындықты тексеру."],
  ["5. Инвестиция туралы әңгіме", "2-4 қадамнан кейін: нақты метрика мен кері байланыспен."],
];

export default function Investors() {
  return (
    <div className="bg-surface-2">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">Qazaq<span className="text-brand">Code</span></Link>
          <div className="flex items-center gap-2"><ThemeToggle /><Link href="/schools" className="btn-secondary">Мектептерге</Link></div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">Инвесторларға</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Қайда тұрмыз: ашық және тексерілетін жағдай</h1>
        <p className="mt-4 max-w-3xl text-ink-muted">
          Мұнда ойдан шығарылған клиент, пікір, нарық көлемі не табыс жоқ. Біз өнімді жасадық, бірақ тартылымды әлі алған жоқпыз: ол үшін мектептермен пилот керек.
        </p>

        <section className="mt-10" aria-labelledby="facts-h">
          <h2 id="facts-h" className="text-xl font-bold">Фактілер</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {FACTS.map(([k, v]) => (
              <div key={k} className="card p-4"><dt className="text-sm font-semibold text-brand">{k}</dt><dd className="mt-1 text-sm">{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="mt-10" aria-labelledby="gaps-h">
          <h2 id="gaps-h" className="text-xl font-bold">Әлі жоқ немесе сыналмаған</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {GAPS.map((g) => <li key={g} className="card flex gap-3 p-3"><span aria-hidden className="text-ink-muted">○</span>{g}</li>)}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="road-h">
          <h2 id="road-h" className="text-xl font-bold">Тартылымға дейінгі жол картасы</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-5">
            {ROAD.map(([t, d]) => (
              <li key={t} className="card p-4"><h3 className="text-sm font-bold">{t}</h3><p className="mt-1 text-xs text-ink-muted">{d}</p></li>
            ))}
          </ol>
        </section>

        <section className="mt-10" aria-labelledby="model-h">
          <h2 id="model-h" className="text-xl font-bold">Бизнес-модель (гипотеза)</h2>
          <p className="mt-3 max-w-3xl text-sm text-ink-muted">
            Мектеп, колледж не IT академия жылдық лицензия төлейді; оқушы төлемейді. Жоспарлар: STARTER (100 оқушы / 5 мұғалім), PRO (500 / 25), ENTERPRISE (келісім бойынша).
            Баға белгіленбеген: нарықтық дәлел жоқ, пилоттан кейін шығынмен есептеледі.
          </p>
        </section>

        <section className="mt-10 card p-6" aria-labelledby="next-h">
          <h2 id="next-h" className="text-xl font-bold">Біз қазір не іздейміз</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Бірінші кезекте - <strong>пилот серіктестер</strong> (мектеп, колледж, IT академия). Қаржылық қолдау туралы әңгіме пилот нәтижесінен кейін мағыналы болады.
            Толық құжат: <code>docs/INVESTOR.md</code> (тәуекелдер, due-diligence тізімі, қаражат бөлу категориялары).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/schools#request" className="btn-primary">Пилотқа қатысу</Link>
            {CONTACT ? <a className="btn-secondary" href={`mailto:${CONTACT}?subject=${encodeURIComponent("QazaqCode: инвестор сұрауы")}`}>Байланысу</a> : null}
          </div>
        </section>
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted sm:px-6">
          <p>© QazaqCode Platform. Бұл бет инвестициялық ұсыныс не кеңес емес.</p>
          <p><Link href="/">Басты бет</Link> · <Link href="/schools">Мектептерге</Link></p>
        </div>
      </footer>
    </div>
  );
}
