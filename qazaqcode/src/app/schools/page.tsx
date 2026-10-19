import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequestForm } from "@/components/leads/RequestForm";
import { getT } from "@/lib/i18n";
import type { TFn } from "@/lib/i18n/core";

// Жария бет (маркетинг). Ойдан шығарылған клиент, пікір, статистика ЖОҚ: тек өнімнің нақты мүмкіндіктері.
// Байланыс e-mail тек орта айнымалысынан (CONTACT_EMAIL) алынады; жоқ болса батырма көрсетілмейді.
export const dynamic = "force-dynamic";
export async function generateMetadata() { const t = await getT(); return { title: t("Мектептер мен колледждерге") }; }

const CONTACT = (process.env.CONTACT_EMAIL || "").trim();
const mailto = (t: TFn) => CONTACT ? `mailto:${CONTACT}?subject=${encodeURIComponent(t("QazaqCode: демо және пилот сұрауы"))}` : null;

const NAV = (t: TFn) => [[t("Мүмкіндіктер"), "#features"], [t("Қалай жұмыс істейді"), "#how"], [t("Жоспарлар"), "#plans"], [t("Қауіпсіздік"), "#security"], [t("Сұрақ-жауап"), "#faq"], [t("Пилот сұрау"), "#request"]];

const ROLES = (t: TFn) => [
  { icon: "👩‍🏫", t: t("Мұғалімге"), d: t("Сынып ашыңыз, тапсырма беріңіз, тестті жүйе өзі тексереді. Қалғанын бір кезекте қарап, бағалаңыз."), pts: [t("Тест: бірден автоматты баға"), t("Код жұмысы: бір тізімде тексеру кезегі"), t("Курс конструкторы: бағдарламашысыз")] },
  { icon: "🎒", t: t("Оқушыға"), d: t("Курс, тапсырма, мерзім, баға және жобалар бір кабинетте. Қиын жерде көмекші кеңес береді."), pts: [t("Сабақ бойынша прогресс"), t("Жоба галереясы"), t("Жаңа тапсырма мен бағаға хабарландыру")] },
  { icon: "🏫", t: t("Мектепке"), d: t("Нақты сандар: кім белсенді, қай тақырып қиын, лицензия қашан аяқталады. Есепті Excel не PDF-пен алыңыз."), pts: [t("Мектеп пен сынып аналитикасы"), t("Excel және PDF есеп"), t("Өз логотипіңіз бен түстеріңіз")] },
];

const FEATURES = (t: TFn) => [
  ["📊", t("Нақты аналитика"), t("Барлық сан дерекқордан есептеледі. Қолдау керек оқушылар, қиын тест сұрақтары, белсенділік графигі.")],
  ["🧩", t("Курс конструкторы"), t("Модуль, сабақ, мәтін/код/сурет/видео блоктары, сүйреп реттеу, жоба-жариялау-архив, көшірме.")],
  ["📝", t("7 түрлі тапсырма"), t("Python, SQL, JavaScript, HTML/CSS, тест, файл, жоба. Мерзім, әрекет саны, бірнеше сыныпқа тағайындау.")],
  ["✅", t("Автоматты тест"), t("Жауап кілті браузерге жіберілмейді, баға серверде есептеледі. Қайта тапсыруды басқару.")],
  ["🎨", t("Өз брендіңіз"), t("Логотип, түстер, қарсы алу мәтіні. Қараңғы режим және телефонда ыңғайлы.")],
  ["🔑", t("Лицензия мен лимит"), t("STARTER, PRO, ENTERPRISE. Мерзімі біткенде деректер жойылмайды: оқу мен экспорт сақталады.")],
  ["📥", t("Есептер"), t("Мектеп және сынып бойынша Excel мен PDF, күн аралығымен, қазақ әріптерімен.")],
  ["🔔", t("Хабарландырулар"), t("Жаңа тапсырма, баға, курс. Мұғалімге жаңа жұмыс туралы.")],
  ["🦆", t("Көмекші кеңесші"), t("Дайын шешім бермейді: қадамдар, өзіңе қоятын сұрақтар, қайдан оқу керек. Деректер сыртқа шықпайды.")],
];

const STEPS = (t: TFn) => [
  ["1", t("Мектеп қосылады"), t("SUPER ADMIN ұйым мен лицензия ашады, мектеп әкімшісі мұғалімдерді шақырады.")],
  ["2", t("Сынып пен курс"), t("Мұғалім сынып ашады, оқушылар код не сілтеме арқылы қосылады, курс пен тапсырма беріледі.")],
  ["3", t("Оқушы орындайды"), t("Сабақ оқиды, тапсырма жазады, тест бірден бағаланады, жұмыс тексеруге түседі.")],
  ["4", t("Нәтиже көрінеді"), t("Мұғалім бағалайды, әкімші аналитика мен есеп алады.")],
];

const PLANS = (t: TFn) => [
  { n: "STARTER", s: t("100 оқушы · 5 мұғалім"), d: t("Шағын мектеп, үйірме, оқу курсы"), pts: [t("Барлық негізгі мүмкіндіктер"), t("Excel/PDF есеп"), t("White-label негізгі")] },
  { n: "PRO", s: t("500 оқушы · 25 мұғалім"), d: t("Үлкен мектеп, колледж, IT академия"), pts: [t("STARTER-дегінің бәрі"), t("Көп сынып пен курс"), t("Басымдықты қолдау (келісім бойынша)")], hot: true },
  { n: "ENTERPRISE", s: t("Келісім бойынша"), d: t("Мектеп желісі, облыстық бағдарлама"), pts: [t("Жеке лимиттер"), t("Орнату мен интеграция"), t("Жеке шарттар")] },
];

const FAQ = (t: TFn) => [
  [t("Оқушы кодын платформа өзі тексере ме?"), t("Қазір тест (quiz) автоматты бағаланады. Код тапсырмасын мұғалім қолмен бағалайды. Серверде кодты автоматты іске қосу қауіпсіз орта мен тәуелсіз шолудан кейін ғана қосылады: біз оны әзірше өндіріске қоспаймыз.")],
  [t("Лицензия біткенде деректер жоғала ма?"), t("Жоқ. Деректер автоматты жойылмайды. Оқу мен экспорт сақталады, жаңа сынып, тапсырма және курс ашу ғана шектеледі.")],
  [t("Бір мектептің деректерін екінші мектеп көре ала ма?"), t("Жоқ. Оқшаулау дерекқор деңгейінде (RLS) жасалған және автоматты тесттермен тексеріледі.")],
  [t("SUPER ADMIN оқушылардың жұмысын көре ме?"), t("Жоқ. Платформа әкімшісі тек жиынтық сандарды көреді.")],
  [t("Көмекші-бот сыртқы жасанды интеллект қолдана ма?"), t("Жоқ. Бұл алдын ала жазылған қазақша кеңестер базасына негізделген ережелі көмекші. Оқушы деректері сыртқы қызметке жіберілмейді, дайын шешім берілмейді.")],
  [t("Қазір бәрі дайын ба?"), t("Негізгі платформа, курстар, аналитика, есептер, лицензия мен белгіленген демо дайын. Нақты пилотта сынау, тәуелсіз қауіпсіздік шолуы және заңгер консультациясы өндіріске шыққанға дейін қажет: біз мұны жасырмаймыз.")],
];

export default async function Schools() { const t = await getT();
  return (
    <div className="bg-surface-2">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">Qazaq<span className="text-brand">Code</span></Link>
          <nav aria-label={t("Бөлімдер")} className="hidden items-center gap-5 text-sm md:flex">
            {NAV(t).map(([l, h]) => <a key={h} href={h} className="text-ink-muted hover:text-ink">{l}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-secondary">{t("Кіру")}</Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,var(--brand-soft),transparent)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
            <div>
              <p className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">{t("Қазақ тіліндегі оқыту платформасы")}</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{t("Бағдарламалауды үйрету енді")}{" "}<span className="text-brand">{t("бір жүйеде")}</span></h1>
              <p className="mt-5 max-w-xl text-lg text-ink-muted">
                {t("Сынып, курс, тапсырма, баға және аналитика: мұғалімге уақыт үнемдейді, оқушыға түсінікті жол көрсетеді, мектепке нақты сан береді.")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {mailto(t) ? <a href={mailto(t) ?? undefined} className="btn-primary px-6 py-3 text-base">{t("Демо мен пилот сұрау")}</a> : <Link href="/login" className="btn-primary px-6 py-3 text-base">{t("Жүйеге кіру")}</Link>}
                <a href="#request" className="btn-secondary px-6 py-3 text-base">{t("Пилот сұрау формасы")}</a>
                <Link href="/join" className="btn-secondary px-6 py-3 text-base">{t("Сынып кодымен қосылу")}</Link>
              </div>
              <p className="mt-4 text-sm text-ink-muted">{t("Мектеп, колледж және IT академияларға арналған · қазақша интерфейс · қараңғы режим · телефонда да жұмыс істейді")}</p>
            </div>

            {/* Өнімнің схемалық суреті (нақты деректер емес) */}
            <figure className="card overflow-hidden p-0" aria-label={t("Мұғалім панелінің схемалық суреті")}>
              <div className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-4 py-2" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-ink-muted">{t("9А · Информатика")}</span>
              </div>
              <div className="grid gap-3 p-4" aria-hidden>
                <div className="grid grid-cols-3 gap-3">
                  {[[t("Оқушылар"), "▇▇▇"], [t("Орындалды"), "▇▇▇▇"], [t("Тексеруге"), "▇▇"]].map(([l, v]) => (
                    <div key={l} className="rounded-lg border border-line bg-surface-2 p-3"><p className="text-[11px] text-ink-muted">{l}</p><p className="mt-1 text-lg font-bold tracking-widest text-brand">{v}</p></div>
                  ))}
                </div>
                <div className="rounded-lg border border-line p-3">
                  <p className="mb-2 text-xs font-semibold text-ink-muted">{t("Белсенділік")}</p>
                  <div className="flex h-20 items-end gap-1.5">
                    {[30, 45, 38, 62, 55, 80, 70, 92, 66, 85].map((h, i) => <span key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "var(--brand)", opacity: 0.75 }} />)}
                  </div>
                </div>
                <div className="space-y-2">
                  {[t("Тест: Айнымалылар"), t("Python: Цикл есептері"), t("Жоба: Менің сайтым")].map((x, i) => (
                    <div key={x} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                      <span>{x}</span><span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{[t("бағаланды"), t("тексеру"), t("жарияланған")][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <figcaption className="border-t border-line bg-surface-2 px-4 py-2 text-xs text-ink-muted">{t("Схемалық сурет. Нақты интерфейсті демо арқылы көресіз.")}</figcaption>
            </figure>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="roles-h">
          <h2 id="roles-h" className="text-2xl font-bold sm:text-3xl">{t("Әр рөлге өз кабинеті")}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {ROLES(t).map((r) => (
              <li key={r.t} className="card p-6">
                <p className="text-3xl" aria-hidden>{r.icon}</p>
                <h3 className="mt-2 text-lg font-bold">{r.t}</h3>
                <p className="mt-1 text-sm text-ink-muted">{r.d}</p>
                <ul className="mt-4 space-y-1.5 text-sm">{r.pts.map((p) => <li key={p} className="flex gap-2"><span className="text-brand" aria-hidden>✓</span>{p}</li>)}</ul>
              </li>
            ))}
          </ul>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6" aria-labelledby="feat-h">
          <h2 id="feat-h" className="text-2xl font-bold sm:text-3xl">{t("Мектепке қажеттінің бәрі")}</h2>
          <p className="mt-2 max-w-2xl text-ink-muted">{t("Көрсетілген мүмкіндіктердің барлығы жұмыс істейді және автоматты тесттермен тексеріледі.")}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES(t).map(([i, tt, d]) => (
              <li key={tt} className="card p-5"><p className="text-2xl" aria-hidden>{i}</p><h3 className="mt-2 font-semibold">{tt}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p></li>
            ))}
          </ul>
        </section>

        <section id="how" className="scroll-mt-20 border-y border-line bg-surface" aria-labelledby="how-h">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 id="how-h" className="text-2xl font-bold sm:text-3xl">{t("Қалай жұмыс істейді")}</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-4">
              {STEPS(t).map(([n, tt, d]) => (
                <li key={n} className="rounded-xl border border-line bg-surface-2 p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-bold text-brand-ink">{n}</span>
                  <h3 className="mt-3 font-semibold">{tt}</h3><p className="mt-1 text-sm text-ink-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="plans" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6" aria-labelledby="plans-h">
          <h2 id="plans-h" className="text-2xl font-bold sm:text-3xl">{t("Лицензия жоспарлары")}</h2>
          <p className="mt-2 max-w-2xl text-ink-muted">{t("Бағасы мектептің көлеміне байланысты келісіледі. Бастау үшін пилот ұсынамыз: бір мектеп, 6-8 апта, нақты сабақтарда.")}</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {PLANS(t).map((p) => (
              <li key={p.n} className={`card flex flex-col p-6 ${p.hot ? "ring-2 ring-brand" : ""}`}>
                {p.hot && <span className="mb-2 w-fit rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-brand-ink">{t("Көп таңдалатын")}</span>}
                <h3 className="text-xl font-extrabold">{p.n}</h3>
                <p className="mt-1 font-semibold text-brand">{p.s}</p>
                <p className="mt-1 text-sm text-ink-muted">{p.d}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm">{p.pts.map((x) => <li key={x} className="flex gap-2"><span className="text-brand" aria-hidden>✓</span>{x}</li>)}</ul>
                {mailto(t) ? <a href={mailto(t) ?? undefined} className={`mt-5 ${p.hot ? "btn-primary" : "btn-secondary"}`}>{t("Ұсыныс сұрау")}</a> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">{t("Жоспар лимиттері: STARTER 100/5, PRO 500/25. Мерзімі біткенде деректер жойылмайды.")}</p>
        </section>

        <section id="security" className="scroll-mt-20 border-y border-line bg-surface" aria-labelledby="sec-h">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 id="sec-h" className="text-2xl font-bold sm:text-3xl">{t("Қауіпсіздік және деректер")}</h2>
              <p className="mt-2 text-ink-muted">{t("Балалардың деректерімен жұмыс істейтіндіктен, қорғанысты дерекқор деңгейінде жасадық.")}</p>
            </div>
            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              {[[t("Мектептер оқшауланған"), t("Бір мектеп екіншісін көрмейді: RLS + автоматты тесттер")], [t("Құқық серверде"), t("Рөлді интерфейс емес, дерекқор тексереді")], [t("Жауап кілті жасырын"), t("Тест жауабы мен жасырын тесттер оқушыға жіберілмейді")], [t("Аудит журналы"), t("Маңызды әрекеттер жазылады")], [t("Деректер аз"), t("Оқушыдан тек қажеттісі алынады, көмекші чат тарихы сақталмайды")], [t("Құпия жоқ репода"), t("Кілттер тек орта айнымалыларында")]].map(([tt, d]) => (
                <li key={tt} className="rounded-xl border border-line bg-surface-2 p-4"><p className="font-semibold">{tt}</p><p className="mt-0.5 text-ink-muted">{d}</p></li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-12 sm:px-6" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-2xl font-bold sm:text-3xl">{t("Жиі қойылатын сұрақтар")}</h2>
          <div className="mt-6 space-y-3">
            {FAQ(t).map(([q, a]) => (
              <details key={q} className="card group p-4"><summary className="cursor-pointer list-none font-semibold marker:hidden">{q}</summary><p className="mt-2 text-sm text-ink-muted">{a}</p></details>
            ))}
          </div>
        </section>

        <section id="request" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-12 sm:px-6" aria-labelledby="req-h">
          <h2 id="req-h" className="text-2xl font-bold sm:text-3xl">{t("Пилотқа сұрау")}</h2>
          <p className="mt-2 text-ink-muted">{t("Ұйымыңыз туралы қысқаша жазыңыз: біз демо мен 6-8 апталық пилот туралы хабарласамыз. Міндеттеме жоқ.")}</p>
          <div className="mt-6"><RequestForm /></div>
          <p className="mt-3 text-xs text-ink-muted">{t("Құпиялылық: тек осы форманың өрістері сақталады. Деректер пилот туралы байланысу үшін ғана, 365 күннен кейін өшіріледі, үшінші тарапқа берілмейді.")}</p>
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-brand px-6 py-10 text-center text-brand-ink">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t("Өз мектебіңізде сынап көріңіз")}</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">{t("15 минуттық демо және 6-8 апталық пилот: нақты сабақтарда, нақты нәтижемен.")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {mailto(t) ? <a href={mailto(t) ?? undefined} className="btn bg-white px-6 py-3 text-base text-slate-900 hover:opacity-90">{t("Демо сұрау")}</a> : null}
              <Link href="/login" className="btn border border-white/60 px-6 py-3 text-base text-white hover:bg-white/10">{t("Жүйеге кіру")}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted sm:px-6">
          <p>{t("© QazaqCode Platform. Барлық құқықтар қорғалған.")}</p>
          <p><Link href="/login">{t("Кіру")}</Link> · <Link href="/join">{t("Сынып кодымен қосылу")}</Link> · <Link href="/investors">{t("Инвесторларға")}</Link>{CONTACT ? <> · <a href={`mailto:${CONTACT}`}>{CONTACT}</a></> : null}</p>
        </div>
      </footer>
    </div>
  );
}
