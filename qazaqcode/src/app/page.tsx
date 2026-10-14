import Link from "next/link";
import { getContext, homeFor } from "@/lib/context";
import { redirect } from "next/navigation";

export default async function Landing() {
  const ctx = await getContext();
  if (ctx) redirect(homeFor(ctx));
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">QazaqCode Platform</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Мектептегі бағдарламалау оқытуын бір жүйеде басқарыңыз</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-muted">
        Сыныптар, тапсырмалар, оқушылардың жұмыстары, бағалар және нақты аналитика: мұғалім мен мектеп әкімшісіне арналған қазақ тіліндегі жүйе.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="btn-primary px-6 py-3">Жүйеге кіру</Link>
        <Link href="/join" className="btn-secondary px-6 py-3">Сынып кодымен қосылу</Link>
      </div>
      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {[["Мұғалімге", "Сынып ашыңыз, тапсырма беріңіз, оқушылардың кодын қарап, баға қойыңыз."],
          ["Оқушыға", "Тапсырмаларыңызды, мерзімдерді және бағаларыңызды бір кабинетте көріңіз."],
          ["Мектепке", "Мұғалімдер мен сыныптардың белсенділігі, нәтижесі және лицензия күйі."]].map(([t, d]) => (
          <li key={t} className="card p-5"><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-ink-muted">{d}</p></li>
        ))}
      </ul>
    </main>
  );
}
