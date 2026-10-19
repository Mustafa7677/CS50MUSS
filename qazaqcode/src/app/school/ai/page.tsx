import { ActionForm } from "@/components/ActionForm";
import { PageHeader, Section, StatusBadge } from "@/components/ui";
import { requireSchoolAdmin } from "@/lib/context";
import { withUser } from "@/lib/db";
import { setAiEnabledAction } from "./actions";
import { getT } from "@/lib/i18n";

export async function generateMetadata() { const t = await getT(); return { title: t("Көмекші") }; }
export const dynamic = "force-dynamic";

export default async function SchoolAiPage() { const t = await getT();
  const ctx = await requireSchoolAdmin();
  const enabled = await withUser(ctx.userId, async (q) => !!(await q<{ s: boolean }>("select public.ai_status($1) as s", [ctx.active.org_id]))[0]?.s);
  return (
    <>
      <PageHeader title={t("Көмекші (оқушыларға арналған кеңесші)")}
        subtitle={t("Оқушыларға тақырыпты түсіндіретін, қатені іздеуге бағыттайтын көмекші. Дайын шешім бермейді.")} />
      <div className="card max-w-2xl space-y-4 p-5">
        <p className="flex items-center gap-2 text-sm">{t("Қазіргі күйі:")}{" "}<StatusBadge status={enabled ? "active" : "none"} label={enabled ? t("Қосулы") : t("Өшірулі")} /></p>
        <ActionForm action={setAiEnabledAction} submitLabel={t("Сақтау")}>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={enabled} className="mt-1 h-4 w-4" />
            <span><span className="font-semibold">{t("Мектепте Көмекшіні қосу")}</span><br /><span className="text-ink-muted">{t("Қосылғанда оқушылар «Көмекші» бетін және тапсырма бетіндегі «Көмекшіден сұрау» батырмасын пайдалана алады.")}</span></span>
          </label>
        </ActionForm>
      </div>

      <Section title={t("Бұл қалай жұмыс істейді және құпиялылық")}>
        <div className="card max-w-2xl space-y-3 p-5 text-sm leading-relaxed">
          <p><strong>{t("Бұл жасанды интеллект моделі емес.")}</strong>{" "}{t("Көмекші - платформада алдын ала жазылған кеңестер базасына сүйенетін ережелі кеңесші. Ол сұрақтағы кілт сөздер мен қате мәтінін танып, сәйкес түсініктеме, қадамдар және оқуға арналған сабақ атауларын көрсетеді. Сұрағыңызды түсінбеуі не қате тақырып ұсынуы мүмкін.")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>{t("Деректер сыртқа шықпайды.")}</strong>{" "}{t("Ешқандай сыртқы AI-қызмет шақырылмайды; бәрі платформаның өз серверінде есептеледі.")}</li>
            <li><strong>{t("Әңгіме сақталмайды.")}</strong>{" "}{t("Оқушының сұрақтары мен жауаптар дерекқорда жазылмайды (тек браузер бетінде көрінеді). Сондықтан мұғалім де, әкімші де чатты көре алмайды, қолдану статистикасы да жиналмайды.")}</li>
            <li><strong>{t("Дайын шешім берілмейді.")}</strong>{" "}{t("Бұл режимді әкімші өшіре алмайды: Көмекші тек түсіндіреді, бағыттайды, басқа есеппен жалпы мысал көрсетеді. Тест тапсырмасының жауабын айтпайды.")}</li>
            <li>{t("Жауап беру үшін ол оқушының өзіне көрінетін ақпаратты ғана пайдаланады: сұрағы, ашылған тапсырманың атауы мен шарты, оқушының өз сақталған коды және оқушы көре алатын сабақ атаулары. Жауап кілті, жасырын тест жағдайлары, басқа оқушылар деректері қолданылмайды.")}</li>
          </ul>
          <p className="text-ink-muted">{t("Келешекте қалау бойынша сыртқы тіл моделін қосуға болады, бірақ ол кезде оқушы хабарламасы сыртқы провайдерге жіберіледі: ата-ана келісімі мен дербес деректер талаптарын алдын ала заңгермен нақтылау керек. Қазір ондай мүмкіндік жоқ.")}</p>
        </div>
      </Section>
    </>
  );
}
