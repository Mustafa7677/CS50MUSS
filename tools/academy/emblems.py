# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe: модуль эмблемалары - әр модульдің ұғымын көрсететін сызба (SVG, viewBox 0 0 160 120).
# Сызықтар бет ашылғанда бір рет «сызылады» (stroke-dashoffset, assets/css/academy.css); қозғалыс азайтылса - бірден көрінеді.
# Түстер: currentColor (модуль реңі) және var(--ac-gold) (екпін). Тек геометрия - мәтін, сурет, шрифт жоқ.

# модуль -> (рең, SVG ішкі мазмұны). Рең - AO17 академия палитрасынан (жарық режимде AA контраст).
EMBLEMS = {
    # m01 логика: екі кіріс -> AND вентилі -> шығыс
    "m01": ("#173e35", '<path class="em-d" d="M14 40h34M14 80h34"/><path class="em-d" d="M48 26v68h26a34 34 0 0 0 0-68z"/><path class="em-d" d="M108 60h38"/>'
            '<circle class="em-g" cx="14" cy="40" r="4"/><circle class="em-g" cx="14" cy="80" r="4"/><circle class="em-g" cx="146" cy="60" r="5"/>'),
    # m02 дәлелдеу: индукция баспалдағы және ∎
    "m02": ("#733c3c", '<path class="em-d" d="M16 100h28v-22h28v-22h28v-22h28"/><path class="em-d" d="M30 92l8-8M58 70l8-8M86 48l8-8"/><rect class="em-g" x="128" y="20" width="16" height="16"/>'),
    # m03 дискретті құрылымдар: Венн шеңберлері
    "m03": ("#2a5f7a", '<circle class="em-d" cx="62" cy="58" r="34"/><circle class="em-d" cx="98" cy="58" r="34"/><path class="em-g" d="M80 30a34 34 0 0 1 0 56a34 34 0 0 1 0-56z"/>'),
    # m04 алгоритмдік ойлау: блок-схема (бастау -> шарт -> цикл)
    "m04": ("#5b4a8a", '<rect class="em-d" x="54" y="8" width="52" height="20" rx="10"/><path class="em-d" d="M80 28v12M80 40l22 18-22 18-22-18z"/><path class="em-d" d="M80 76v16M102 58h30v-44h-26"/>'
            '<rect class="em-d" x="58" y="92" width="44" height="20" rx="3"/><circle class="em-g" cx="80" cy="58" r="4"/>'),
    # m05 екілік жүйе: 8 бит ұяшығы, кейбірі жанған
    "m05": ("#8a5a14", '<path class="em-d" d="M12 44h136v32H12zM29 44v32M46 44v32M63 44v32M80 44v32M97 44v32M114 44v32M131 44v32"/>'
            '<rect class="em-g" x="15" y="47" width="11" height="26"/><rect class="em-g" x="66" y="47" width="11" height="26"/><rect class="em-g" x="100" y="47" width="11" height="26"/><rect class="em-g" x="134" y="47" width="11" height="26"/>'),
    # m06 Python негіздері: терминал терезесі және >>> курсоры
    "m06": ("#1f5f8b", '<rect class="em-d" x="14" y="18" width="132" height="84" rx="8"/><path class="em-d" d="M14 36h132"/><path class="em-d" d="M30 56l12 10-12 10M50 78h30"/>'
            '<circle class="em-g" cx="26" cy="27" r="3"/><circle class="em-g" cx="36" cy="27" r="3"/><rect class="em-g" x="86" y="72" width="10" height="6"/>'),
    # m07 функциялар: рекурсия ағашы
    "m07": ("#2f6b4f", '<circle class="em-d" cx="80" cy="18" r="9"/><path class="em-d" d="M74 25L46 52M86 25l28 27"/><circle class="em-d" cx="42" cy="58" r="9"/><circle class="em-d" cx="118" cy="58" r="9"/>'
            '<path class="em-d" d="M37 66L24 92M47 66l13 26M113 66l-13 26M123 66l13 26"/><circle class="em-g" cx="22" cy="98" r="6"/><circle class="em-g" cx="62" cy="98" r="6"/><circle class="em-g" cx="98" cy="98" r="6"/><circle class="em-g" cx="138" cy="98" r="6"/>'),
    # m08 деректер құрылымдары: тізім ұяшықтары және сөздік кілт -> мән
    "m08": ("#7a3b5c", '<path class="em-d" d="M14 24h132v24H14zM47 24v24M80 24v24M113 24v24"/><path class="em-d" d="M22 76h36v24H22zM102 76h36v24h-36zM58 88h44"/><path class="em-d" d="M94 82l8 6-8 6"/>'
            '<rect class="em-g" x="84" y="28" width="25" height="16"/>'),
    # m09 алгоритмдер: сұрыпталатын бағандар
    "m09": ("#173e35", '<path class="em-d" d="M10 108h140"/><path class="em-d" d="M22 108V80M44 108V64M66 108V52M88 108V40M110 108V28M132 108V16" style="stroke-width:12"/>'
            '<path class="em-g" d="M66 52h-2v56h4V52z"/><path class="em-d" d="M40 22c14-12 30-12 44 0" /><path class="em-d" d="M78 16l6 6-8 3"/>'),
    # m10 C: жақшалар және компиляция көрсеткісі
    "m10": ("#3d4f6e", '<path class="em-d" d="M40 16c-12 0-14 8-14 18v14c0 8-6 12-12 12 6 0 12 4 12 12v14c0 10 2 18 14 18"/><path class="em-d" d="M120 16c12 0 14 8 14 18v14c0 8 6 12 12 12-6 0-12 4-12 12v14c0 10-2 18-14 18"/>'
            '<path class="em-d" d="M58 60h40M88 50l10 10-10 10"/><circle class="em-g" cx="52" cy="60" r="4"/>'),
    # m11 жады: ұяшықтар және көрсеткіш доғасы
    "m11": ("#6b3a2a", '<path class="em-d" d="M12 70h136v28H12zM46 70v28M80 70v28M114 70v28"/><circle class="em-g" cx="29" cy="84" r="5"/><path class="em-d" d="M29 66C34 20 118 20 128 64"/><path class="em-d" d="M120 58l8 8 4-10"/>'
            '<path class="em-d" d="M20 108h18M54 108h18M88 108h18M122 108h18" style="stroke-dasharray:3 4"/>'),
    # m12 жүйелік интеграция: конвейер түйіндері
    "m12": ("#4a5a2a", '<circle class="em-d" cx="22" cy="60" r="12"/><rect class="em-d" x="56" y="44" width="32" height="32" rx="6"/><path class="em-d" d="M122 44l16 16-16 16-16-16z"/>'
            '<path class="em-d" d="M34 60h22M88 60h18"/><path class="em-d" d="M50 55l6 5-6 5M100 55l6 5-6 5"/><circle class="em-g" cx="22" cy="60" r="4"/><circle class="em-g" cx="122" cy="60" r="4"/>'),
    # --- Senior сатысы ---
    # s01 архитектура: үш қабат және оларды тесіп өтетін тәуелділік бағыты (ішке қарай)
    "s01": ("#173e35", '<rect class="em-d" x="14" y="14" width="132" height="92" rx="6"/><rect class="em-d" x="38" y="32" width="84" height="56" rx="5"/><rect class="em-d" x="62" y="48" width="36" height="24" rx="4"/>'
            '<path class="em-d" d="M26 60h30M134 60h-30"/><rect class="em-g" x="74" y="56" width="12" height="8"/>'),
    # s02 таралған жүйелер: шеңбер бойындағы бес түйін және репликация жебелері
    "s02": ("#2a5f7a", '<circle class="em-d" cx="80" cy="60" r="42"/><path class="em-d" d="M80 18L120 47M120 47L105 94M105 94H55M55 94L40 47M40 47L80 18"/>'
            '<circle class="em-g" cx="80" cy="18" r="7"/><circle class="em-g" cx="120" cy="47" r="5"/><circle class="em-g" cx="105" cy="94" r="5"/><circle class="em-g" cx="55" cy="94" r="5"/><circle class="em-g" cx="40" cy="47" r="5"/>'),
    # s03 сенімділік: SLO шегі және оның астындағы кешігу графигі
    "s03": ("#6b3a2a", '<path class="em-d" d="M14 100h132M14 100V14"/><path class="em-d" d="M14 36h132" stroke-dasharray="4 6"/><path class="em-d" d="M18 86l18-6 16 4 18-20 14 10 16-30 14 24 16-8 12 6"/>'
            '<circle class="em-g" cx="102" cy="44" r="5"/>'),
    # s04 көшбасшылық: баспалдақ және ұсынылған қол (жоғары көтеру)
    "s04": ("#733c3c", '<path class="em-d" d="M14 104h30V80h30V56h30V32h30"/><circle class="em-d" cx="118" cy="18" r="8"/><path class="em-d" d="M88 74l14-14M102 60h-10M102 60v10"/>'
            '<rect class="em-g" x="20" y="92" width="16" height="8"/>'),
    # s05 компиляторлар: мәтін -> ағаш -> командалар
    "s05": ("#5b4a8a", '<path class="em-d" d="M12 30h40M12 44h28M12 58h36"/><path class="em-d" d="M58 44h14M66 38l6 6-6 6"/><circle class="em-d" cx="98" cy="24" r="8"/>'
            '<path class="em-d" d="M93 30l-10 20M103 30l10 20"/><circle class="em-d" cx="80" cy="56" r="7"/><circle class="em-d" cx="116" cy="56" r="7"/><path class="em-d" d="M70 88h76M70 100h60"/><rect class="em-g" x="94" y="20" width="8" height="8"/>'),
    # s06 веб қауіпсіздігі: қалқан және кілт тесігі
    "s06": ("#7a3b5c", '<path class="em-d" d="M80 12l46 16v30c0 28-20 46-46 54-26-8-46-26-46-54V28z"/><circle class="em-d" cx="80" cy="54" r="10"/><path class="em-d" d="M80 64v18"/>'
            '<circle class="em-g" cx="80" cy="54" r="4"/>'),
    # s07 MLOps: тұйық цикл - дерек, оқыту, беру, бақылау
    "s07": ("#1f5f8b", '<path class="em-d" d="M80 20a40 40 0 0 1 40 40"/><path class="em-d" d="M120 60a40 40 0 0 1-40 40"/><path class="em-d" d="M80 100a40 40 0 0 1-40-40"/><path class="em-d" d="M40 60a40 40 0 0 1 40-40"/>'
            '<path class="em-d" d="M114 48l6 12 8-10"/><circle class="em-g" cx="80" cy="20" r="6"/><circle class="em-g" cx="120" cy="60" r="6"/><circle class="em-g" cx="80" cy="100" r="6"/><circle class="em-g" cx="40" cy="60" r="6"/>'),
    # s08 сенімді AI: таразы
    "s08": ("#2f6b4f", '<path class="em-d" d="M80 16v84M50 104h60M30 34h100"/><path class="em-d" d="M30 34l-16 34h32zM130 34l-16 34h32z"/><path class="em-d" d="M14 68a16 8 0 0 0 32 0M114 68a16 8 0 0 0 32 0"/>'
            '<circle class="em-g" cx="80" cy="16" r="6"/>'),
    # s09 зерттеу: деректер нүктелері, болжам сызығы және сенімділік белдеуі
    "s09": ("#8a5a14", '<path class="em-d" d="M14 104h132M14 104V14"/><path class="em-d" d="M22 92L138 30"/><path class="em-d" d="M22 78L138 18M22 104L138 44" stroke-dasharray="3 6"/>'
            '<circle class="em-g" cx="40" cy="80" r="4"/><circle class="em-g" cx="62" cy="74" r="4"/><circle class="em-g" cx="84" cy="58" r="4"/><circle class="em-g" cx="104" cy="52" r="4"/><circle class="em-g" cx="126" cy="34" r="4"/>'),
}


def _core(mid):
    import curriculum as C
    return next(tuple(M["emblem"]) for M in C.CORE_MODULES if M["id"] == mid)


def svg(mid):
    hue, inner = EMBLEMS[mid] if mid in EMBLEMS else _core(mid)
    return (f'<svg class="ac-emblem" viewBox="0 0 160 120" role="img" aria-hidden="true" focusable="false" style="color:{hue}">'
            f'<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{inner}</g></svg>')


def hue(mid):
    return EMBLEMS[mid][0] if mid in EMBLEMS else _core(mid)[0]
