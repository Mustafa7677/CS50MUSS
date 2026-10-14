import Link from "next/link";
import { getContext, homeFor } from "@/lib/context";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

// Басты бет: оқу платформасы (оқушы мен мұғалімге). Мектептерге арналған ұсыныс бөлек бетте: /schools.
export const dynamic = "force-dynamic";

const LEARN = [
  ["📚", "Курстар", "Модульдер мен сабақтар: мәтін, код мысалдары, суреттер, видео. Прогресіңіз сақталады."],
  ["📝", "Тапсырмалар", "Python, SQL, JavaScript, HTML/CSS, тесттер мен жобалар. Мерзімі мен әрекет санын көресіз."],
  ["✅", "Бірден нәтиже", "Тест тапсырсаңыз, баға сол сәтте шығады. Код жұмысын мұғалім тексеріп, пікір жазады."],
  ["🦆", "Көмекші", "Қатты қиналсаңыз, көмекші дайын жауап бермейді: қадамдар мен өзіңе қоятын сұрақтарды ұсынады."],
  ["🏆", "Жобалар", "Орындаған жобаларыңыз бір жерде тұрады, мұғалімнің пікірімен."],
  ["🔔", "Хабарландыру", "Жаңа тапсырма, баға және курс туралы бірден хабар аласыз."],
];

export default async function Home() {
  const ctx = await getContext();
  if (ctx) redirect(homeFor(ctx));
  return (
    <div className="bg-surface-2">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">Qazaq<span className="text-brand">Code</span></Link>
          <div className="flex items-center gap-2"><ThemeToggle /><Link href="/login" className="btn-primary">Кіру</Link></div>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,var(--brand-soft),transparent)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">Бағдарламалауды қазақша үйрен</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Оқу, тапсырма, нәтиже: <span className="text-brand">бәрі бір жерде</span></h1>
            <p className="mt-5 max-w-2xl text-lg text-ink-muted">
              QazaqCode - қазақ тіліндегі бағдарламалау оқу платформасы. Курсты оқы, тапсырманы орында, нәтижеңді көр. Мұғалім сенің жұмысыңды қарап, кеңес береді.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary px-6 py-3 text-base">Кіру</Link>
              <Link href="/join" className="btn-secondary px-6 py-3 text-base">Сынып кодымен қосылу</Link>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Мұғалімің берген 8 әріпті кодты енгізсең, сыныпқа қосыласың.</p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6" aria-labelledby="learn-h">
          <h2 id="learn-h" className="text-2xl font-bold">Платформада не істейсің</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEARN.map(([i, t, d]) => (
              <li key={t} className="card p-5"><p className="text-2xl" aria-hidden>{i}</p><h3 className="mt-2 font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p></li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6" aria-labelledby="how-h">
          <h2 id="how-h" className="text-2xl font-bold">Қалай бастаймын</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {[["1", "Код ал", "Мұғалімнен сынып кодын немесе шақыру сілтемесін сұра."], ["2", "Қосыл", "«Сынып кодымен қосылу» арқылы тіркел."], ["3", "Оқы мен орында", "Курсты оқы, тапсырманы жібер, нәтижеңді көр."]].map(([n, t, d]) => (
              <li key={n} className="card p-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-bold text-brand-ink">{n}</span><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p></li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted sm:px-6">
          <p>© QazaqCode Platform</p>
          <p><Link href="/login">Кіру</Link> · <Link href="/join">Сынып кодымен қосылу</Link> · <Link href="/schools">Мектептер мен колледждерге</Link></p>
        </div>
      </footer>
    </div>
  );
}
