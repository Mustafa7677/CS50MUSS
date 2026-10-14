# QazaqCode: әзірлеуші нұсқаулығы (ішкі)

Next.js 15 (App Router) + TypeScript (5.7) + Tailwind 3 + PostgreSQL (RLS). Барлық UI мәтіні **қазақша**.

## Іске қосу (жергілікті)

```bash
cd qazaqcode
# 1) Өз дерекқорыңызды жасаңыз (бөлек атпен: басқа әзірлеушімен соқтығыспау үшін)
export DATABASE_URL=$(db/create-db.sh qc_mine)           # миграциялар + auth shim
DATABASE_URL=$DATABASE_URL node scripts/seed-demo.mjs    # демо дерек (құпиясөз: DemoPass123)
# 2) Сервер (өз портыңыз бен өз .next қалтаңыз)
DATABASE_URL=$DATABASE_URL AUTH_DRIVER=local AUTH_JWT_SECRET=dev-secret-dev-secret-dev-secret-1234 \
  NEXT_DIST_DIR=.next-mine APP_URL=http://127.0.0.1:3199 npx next dev -p 3199
# 3) Тексеру
npx tsc --noEmit
E2E_BASE_URL=http://127.0.0.1:3199 npx playwright test e2e/<сіздің>.spec.ts
```

Демо аккаунттар (бәрінің құпиясөзі `DemoPass123`): `root@demo.qazaqcode.kz` (SUPER ADMIN), `admin@demo...` (мектеп әкімшісі),
`teacher1@demo...` (9А сыныбы), `teacher2@demo...` (10Ә), `student1@demo...` ... `student20@demo...` (тақ нөмірлі = 9А, жұп = 10Ә).

## Архитектура ережелері (МІНДЕТТІ)

1. **Оқу**: `withUser(ctx.userId, (q) => q("select ...", [params]))` - RLS автоматты қолданылады. Басқа ұйымның деректері ешқашан келмейді.
2. **Жазу**: ТЕК `public.*` RPC функциялары арқылы (төмендегі тізім). Кестеге тікелей INSERT/UPDATE/DELETE жасамаңыз (рұқсат жоқ).
3. **Құқық**: беттің `layout.tsx`-і рөлді тексереді (`requireStaff`, `requireStudent`, `requireSchoolAdmin`). Бірақ шешуші - дерекқор (RLS + функциялар). UI-да жасырын батырма қауіпсіздік емес.
4. **Server action**: `"use server"` файлында тек async функциялар экспортталады. Үлгі: `src/app/actions.ts`. Нәтиже `ActionResult` (`{ok:true,message}` | `{ok:false,error}`); қатені `errorMessage(e)` қазақшаға аударады.
   `redirect()` ны try/catch-тан ТЫСҚАРЫ шақырыңыз. Жазудан кейін `revalidatePath(...)`.
5. **Валидация**: `zod`-пен (сервер жағында). Клиенттік `required/minLength` - тек ыңғайлылық үшін.
6. **UI**: `src/components/ui.tsx` (PageHeader, StatCard, StatusBadge, EmptyState, Section, Banner, ProgressBar, LinkButton), `ActionForm`, `ConfirmButton`, Tailwind кластары `globals.css`-те (`card`, `btn-primary`, `btn-secondary`, `btn-danger`, `input`, `label`, `hint`, `badge`, `th`, `td`, `table-wrap`).
   Түстер тек токендер арқылы (`bg-brand`, `text-ink-muted`, `border-line`, `bg-surface`): бұл white-label және қараңғы режим үшін міндетті.
   Әр бетте: жүктелу/бос/қате күйлері (EmptyState, error boundary `error.tsx`), 390px экранда жұмыс істеуі, `<label>`, `aria-*`, пернетақтамен басқару.
7. **Жалған деректер жоқ**: барлық сан дерекқордан. Бос болса - EmptyState.
8. **Қазақша** мәтін, ұзын сызықша « - » (— емес). CS50-ге/Гарвардқа қатысты ешқандай контент жоқ (`node scripts/check-licence.mjs` тексереді).
9. Тек өз бағытыңыздағы файлдарды өзгертіңіз. `db/`, `src/lib/*`, `src/components/{Shell,ui,ActionForm,...}.tsx` өзгертпеңіз; жаңа ортақ компонент керек болса, өз қалтаңызда (`src/components/<аймақ>/`) жасаңыз. Өзгерістің қажеттілігін есепте жазыңыз.

## RPC функциялары (қолданылуы)

| Функция | Кім | Не істейді |
|---|---|---|
| `create_classroom(org, name, year, subject, description, limit) -> uuid` | мұғалім/әкімші | сынып ашады, join_code автоматты |
| `update_classroom(class, name, year, subject, description, limit, join_enabled, archived)` | сынып ұстазы/әкімші | |
| `regenerate_join_code(class) -> text` | сынып ұстазы/әкімші | кодты жаңартады |
| `remove_student(class, student)` | сынып ұстазы/әкімші | оқушыны сыныптан шығарады |
| `create_invitation(org, role, email, ttl_hours) -> token` | әкімші | мұғалім шақыру (токен ТЕК осында көрінеді: сілтеме `APP_URL/invite/<token>`) |
| `revoke_invitation(id)`, `set_member_status(org, user, 'active'/'removed')` | әкімші | |
| `update_org_settings(org, logo_url, primary, secondary, welcome, email, phone)` | әкімші | white-label |
| `upsert_assignment(jsonb) -> uuid` | мұғалім/әкімші | қара: төмендегі пішім |
| `set_assignment_targets(assignment, class_ids[])` | жасаушы/әкімші | қай сыныптарға |
| `set_assignment_status(assignment, 'draft'/'published'/'archived')` | жасаушы/әкімші | жариялау: сұрақ және ≥1 сынып қажет |
| `save_draft(assignment, code, answers jsonb, seconds) -> submission_id` | оқушы | авто сақтау (бір ашық жоба) |
| `submit_assignment(submission) -> jsonb` | оқушы | тест болса бірден бағаланады; өзгесі `submitted` |
| `begin_review(submission)`, `grade_submission(submission, score, feedback)` | сынып ұстазы/әкімші | |

`upsert_assignment` JSON: `{id?, org_id, title, description, kind(python|sql|javascript|html_css|quiz|file|project), difficulty(easy|medium|hard), max_score, starter_code, max_attempts|null, deadline(ISO)|null, allow_late, hints:[text], questions:[{prompt, options:[..], correct_index, explanation, points}], test_cases:[{input, expected_output, is_hidden, points}]}`.
`questions`/`test_cases` кілті жібермесеңіз - өзгермейді; жұмыс түскен соң оларды өзгерту `assignment_locked` қатесін береді.

## Оқу функциялары (security invoker)

`my_assignments()` (оқушы), `class_students_overview(class)`, `class_assignments_overview(class)`, `class_grade_distribution(class)`, `org_overview(org)`, `activity_series(org, days)`;
`platform_usage()` (SUPER ADMIN, тек жиынтық). Кестелер: `classrooms`, `classroom_students`, `assignments`, `assignment_targets`, `assignment_questions` (`options` бар, дұрыс жауап ЖОҚ),
`assignment_answer_keys` (тек ұстаз/әкімші), `assignment_test_cases`, `submissions`, `submission_results`, `grades`, `profiles` (ұстаз өз оқушыларын, әкімші ұйымды көреді).
Тест жауабы (`answers`) пішімі: `{ "<question_id>": <таңдалған_индекс> }`.

## Тапсырма түрлері (1-кезең)

`quiz` - сервер автоматты бағалайды (жауап кілті браузерге жіберілмейді). `python|sql|javascript|html_css|project|file` - оқушы код/мәтін жазып жібереді (`code`), мұғалім қолмен бағалайды.
Серверде кодты автоматты іске қосу ӘЗІРГЕ ЖОҚ (қауіпсіз sandbox - 3-кезең, docs/SANDBOX.md): "Іске қосу"/"Автотексеру" сияқты жұмыс істемейтін батырмалар көрсетпеңіз.

## Белгілі тұзақтар (тәжірибеден)

- **`loading.tsx` қоспаңыз** рөл сегменттерінде (`teacher/`, `student/`): өндірістік build-те Next 15.5 server action `redirect()` жауабын кейде өткізіп жібереді (формалар "қатып" қалады), және `notFound()` 404 орнына 200 қайтарады. Тұрақты тексерумен дәлелденген (8/8 қате -> 8/8 дұрыс).
- E2E және `next start` үшін: `ALLOW_LOCAL_AUTH_IN_PRODUCTION=yes` (local auth драйвері), `RATE_LIMIT_DISABLED=yes` (көп кіру әрекеті). Тек тест ортасында. `output: "standalone"` тек Docker build-те (`NEXT_OUTPUT=standalone`), әйтпесе `next start` дұрыс жұмыс істемейді.
- TypeScript 5.7 (6.x Next 15-пен үйлеспейді).
- Playwright E2E бір дерекқорда: `db/create-db.sh qc_e2e && node scripts/seed-demo.mjs`, содан `npx playwright test` (30 тест: school, student, teacher, scenario).
