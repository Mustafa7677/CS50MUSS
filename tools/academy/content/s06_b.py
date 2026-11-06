# © 2026 Sagid Mustafa. All Rights Reserved.
# AO17 CS Universe · Senior · s06 Web Security · 6-10 сабақтар. Авторлық мазмұн (AO17 үшін жаңадан жазылған).
# Барлық мысал - қорғаныс мақсатында, оқу моделінде.

from s06_a import META, REFS

# ---------------------------------------------------------------- 6-сабақ
CSRF = ("import hmac, secrets\n\n"
        "def site_of(origin):\n"
        "    # жеңілдетілген «сайт»: тіркелетін доменнің соңғы екі бөлігі\n"
        "    host = origin.split('://')[1].split('/')[0]\n"
        "    return '.'.join(host.split('.')[-2:])\n\n"
        "def cookie_sent(samesite, request_origin, target, top_level_get):\n"
        "    same = site_of(request_origin) == site_of(target)\n"
        "    if same or samesite == 'None':\n"
        "        return True\n"
        "    if samesite == 'Lax':\n"
        "        return top_level_get          # сілтеме бойынша өту (GET) - жіберіледі\n"
        "    return False                      # Strict\n\n"
        "target = 'https://bank.kz/transfer'\n"
        "cases = [('https://bank.kz', False), ('https://evil.example', False), ('https://evil.example', True)]\n"
        "for mode in ('None', 'Lax', 'Strict'):\n"
        "    row = [cookie_sent(mode, o, target, g) for o, g in cases]\n"
        "    print(f'SameSite={mode:6}: өз сайты POST {row[0]!s:5} | бөгде POST {row[1]!s:5} | бөгде сілтеме GET {row[2]}')\n\n"
        "# Синхрондалған токен: сессияға байланған кездейсоқ мән, әр формада\n"
        "session_token = secrets.token_hex(16)\n"
        "def accept(form_token):\n"
        "    return hmac.compare_digest(form_token or '', session_token)\n"
        "print('өз формасы:', accept(session_token), ' бөгде сайттың формасы:', accept(''), ' болжам:', accept('0' * 32))")

L06 = {
    **META, "id": "ao17-senior.s06.l06", "slug": "l06", "title": "CSRF, SameSite және CORS", "difficulty": 4, "minutes": 55,
    "objectives": [
        "Сұрау жалғандауының (CSRF) шартын түсіндіру: браузер бөгде сайттан келген сұрауға cookie-ді автоматты қосады.",
        "SameSite (Strict, Lax, None) ережелерін бағалап, синхрондалған CSRF токенінің қорғанысын дәлелдеу.",
        "CORS-тың не қорғайтынын (оқуды) және не қорғамайтынын (жіберуді) ажырату.",
    ],
    "prerequisites": ["ao17-senior.s06.l05"],
    "concept": "<p>Сіз bank.kz-ке кірдіңіз - браузерде сессия cookie бар. Енді басқа қойындыда evil.example сайты ашылды, онда көрінбейтін форма бар: <code>POST bank.kz/transfer</code>. Браузер бұл сұрауға bank.kz cookie-ін <b>автоматты түрде</b> қосады. Банк сервері үшін бұл - сіздің сұрауыңыз. Бұл - <b>CSRF</b> (Cross-Site Request Forgery): шабуылдаушы сіздің құқығыңызбен сұрау <i>жібертеді</i>, бірақ жауапты оқи алмайды.</p>"
               "<p>Қорғаныс екі қабатты. <b>SameSite cookie</b>: браузерге «бұл cookie-ді бөгде сайттан келген сұрауға қоспа» дейміз (Lax - әдепкі заманауи браузерлерде, Strict - ең қатаң). <b>CSRF токені</b>: сессияға байланған кездейсоқ мән әр формада жасырын өріс ретінде беріледі; бөгде сайт оны біле алмайды. Ал <b>CORS</b> басқа нәрсе: ол бөгде сайттың жауапты <i>оқуын</i> басқарады, сұраудың жіберілуін емес - сондықтан CSRF-тен өздігінен қорғамайды.</p>",
    "theory": [
        {"kind": "definition", "title": "CSRF шарттары", "body": "<p>CSRF сәтті болуы үшін: (1) әрекет тек cookie арқылы аутентификацияланады; (2) браузер бөгде сайттан келген сұрауға cookie-ді қосады; (3) сұраудың барлық параметрін шабуылдаушы алдын ала біледі. Қорғаныс кемінде бір шартты бұзуы керек (AND ағашы, s06 l01).</p>"},
        {"kind": "theorem", "title": "Синхрондалған токеннің қорғанысы", "body": "<p>Сервер әр сессияға t биттік біркелкі кездейсоқ токен беріп, тек токені дұрыс сұрауларды қабылдаса, ал бөгде сайт токенді оқи алмаса (бір көз саясаты), онда q жалғандау әрекетінің кемінде біреуінің сәттілік ықтималдығы q·2<sup>−t</sup>-тен аспайды.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Бөгде сайт токенді оқи алмайды: бір көз саясаты (same-origin policy) бөгде беттің жауабын не DOM-ын оқуға тыйым салады, ал токен тек сол жауаптарда бар. Сондықтан шабуылдаушының токен туралы ақпараты жоқ - оған токен біркелкі кездейсоқ t-биттік жол. Кез келген таңдалған мәннің дұрыс болу ықтималдығы 2<sup>−t</sup>; q әрекетте бірігу шегі бойынша (s06 l03) ≤ q·2<sup>−t</sup>. t = 128-де бұл практикада нөл. ∎ Бұл (3) шартты бұзады: шабуылдаушы сұраудың бір параметрін (токен) білмейді. SameSite болса (2) шартты бұзады - екі тәуелсіз қабат.</p>"},
        {"kind": "note", "title": "CORS не қорғайды", "body": "<p>CORS - бөгде көздің жауапты оқуына рұқсат беру тетігі (Access-Control-Allow-Origin). «Қарапайым» сұраулар (форма POST) preflight-сыз жіберіледі - сервер оны бәрібір өңдейді. Сондықтан CORS-ты дұрыс баптау CSRF токенін не SameSite-ты алмастырмайды. Ең қауіпті қате - Allow-Origin-ге сұраудың Origin-ін автоматты қайталау және Allow-Credentials: true.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": CSRF, "stdin": "",
               "caption": "SameSite=None бөгде POST-қа cookie береді - CSRF мүмкін. Lax бөгде POST-ты тоқтатады, бірақ сілтеме бойынша өтуде (GET) жібереді - сондықтан GET ешқашан күйді өзгертпеуі керек. Токенсіз не болжанған токенмен форма қабылданбайды."},
    "derivation": [
        "Күйді өзгертетін барлық әрекетті табу (POST, PUT, DELETE) - GET ешқашан күйді өзгертпейді.",
        "Сессия cookie-іне SameSite=Lax (не Strict), Secure, HttpOnly қою.",
        "Әр сессияға 128 биттік кездейсоқ CSRF токенін жасап, әр формаға қосу.",
        "Серверде токенді тұрақты уақытта тексеру; токенсіз сұрауды қабылдамау.",
        "CORS-ты тек керек көздерге, Credentials-ты тек сенімді көздерге ашу.",
    ],
    "examples": [
        {"title": "Қауіпті CORS баптауы", "lang": "python",
         "code": "ALLOWED = {'https://ao17.kz', 'https://app.ao17.kz'}\n\ndef cors_bad(origin):\n    return {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true'}\n\ndef cors_good(origin):\n    if origin in ALLOWED:\n        return {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Vary': 'Origin'}\n    return {}\n\nfor o in ['https://app.ao17.kz', 'https://evil.example']:\n    print(o)\n    print('   жаман: ', cors_bad(o))\n    print('   дұрыс: ', cors_good(o))",
         "output": "https://app.ao17.kz\n   жаман:  {'Access-Control-Allow-Origin': 'https://app.ao17.kz', 'Access-Control-Allow-Credentials': 'true'}\n   дұрыс:  {'Access-Control-Allow-Origin': 'https://app.ao17.kz', 'Access-Control-Allow-Credentials': 'true', 'Vary': 'Origin'}\nhttps://evil.example\n   жаман:  {'Access-Control-Allow-Origin': 'https://evil.example', 'Access-Control-Allow-Credentials': 'true'}\n   дұрыс:  {}",
         "explain": "Жаман нұсқа кез келген сайтқа пайдаланушының cookie-імен жауапты оқуға рұқсат береді - бұл CSRF-тен де ауыр: жеке деректер ағып кетеді. Дұрыс нұсқа - нақты allowlist."},
    ],
    "experiment": {"lab": "pyrun", "code": CSRF.replace("def accept(form_token):\n    return hmac.compare_digest(form_token or '', session_token)", "def accept(form_token):\n    return form_token is not None      # ҚАТЕ: тек токеннің бар-жоғын тексереді"), "stdin": "",
                   "task": "Тексеріс «токен бар ма» дегенге ғана қалды. Бөгде сайттың бос токені мен болжамы енді өте ме? Теорема қандай ұйғарымға (сервер токеннің мәнін тексереді) сүйенген еді? Бұл қатені қандай тест ұстар еді?"},
    "exercises": [
        {"type": "pycode", "q": "cookie_sent(samesite, same_site, method, top_level) - samesite ∈ {'None','Lax','Strict'}, same_site: сұрау өз сайтынан ба, method: 'GET'|'POST', top_level: жоғарғы деңгейдегі өту (сілтеме) ме. Браузер cookie-ді жібере ме - True/False.", "mode": "func", "func": "cookie_sent",
         "starter": "def cookie_sent(samesite, same_site, method, top_level):\n    return samesite != 'Strict'\n",
         "tests": [{"args": ["Lax", False, "POST", False], "expect": False}, {"args": ["Lax", False, "GET", True], "expect": True}, {"args": ["Strict", False, "GET", True], "expect": False},
                   {"args": ["None", False, "POST", False], "expect": True}, {"args": ["Strict", True, "POST", False], "expect": True}],
         "solution": "def cookie_sent(samesite, same_site, method, top_level):\n    if same_site or samesite == 'None':\n        return True\n    if samesite == 'Lax':\n        return method == 'GET' and top_level\n    return False",
         "hints": ["Өз сайтынан - әрқашан жіберіледі.", "Lax: тек жоғарғы деңгейдегі GET."]},
        {"type": "number", "q": "CSRF токені 64 бит. Шабуылдаушы 2³² әрекет жасайды. Сәттілік ықтималдығының шегі 2⁻ᵏ; k неге тең?", "answer": 32, "check": "64 - 32", "hints": ["q·2⁻ᵗ."]},
        {"type": "mc", "q": "CORS-ты қатаң баптадық. Бұл CSRF-тен қорғай ма?", "options": ["Иә, толық.", "Жоқ: CORS бөгде сайттың жауапты оқуын шектейді, ал қарапайым форма POST бәрібір жіберіледі және өңделеді.", "Иә, себебі preflight әрқашан бар.", "CORS пен CSRF бір нәрсе."],
         "answer": 1, "why": ["Жіберу шектелмейді.", "Дұрыс.", "Қарапайым сұрауларда preflight жоқ.", "Әртүрлі."], "hints": ["CSRF-ке жауап оқу керек емес."]},
    ],
    "reasoning": "<p>CSRF - «шатасқан өкіл» (confused deputy) мәселесі: браузер өз еркімен пайдаланушының құқығын бөгде сайтқа «қарызға» береді. Қорғаныстар AND ағашының шарттарын бұзады: SameSite - cookie-дің автоматты жіберілуін, токен - параметрлердің болжамдылығын. Теорема токеннің күшін бір көз саясатына және кездейсоқтыққа байлайды; эксперимент көрсеткендей, тексерістің өзі әлсіресе, кез келген криптографиялық күш мағынасыз.</p>",
    "mistakes": [
        {"mistake": "GET сұрауымен күйді өзгерту (/delete?id=5).", "why": "SameSite=Lax оны жібереді; сілтеме не сурет тегі жеткілікті.", "fix": "Күйді өзгертетін әрекеттер - тек POST/PUT/DELETE + токен."},
        {"mistake": "Access-Control-Allow-Origin-ге Origin-ді автоматты қайталау.", "why": "Кез келген сайт пайдаланушы деректерін оқи алады.", "fix": "Нақты allowlist және Vary: Origin."},
    ],
    "assessment": [
        {"type": "pycode", "q": "csrf_check(request, session) - request: {'method', 'origin', 'token'}, session: {'token', 'site'}. GET/HEAD - әрқашан 'ok'. Басқа әдістер: origin сессияның site-іне тең болмаса 'bad-origin', токен сессиядағымен (тұрақты уақытта) тең болмаса 'bad-token', әйтпесе 'ok'.", "mode": "func", "func": "csrf_check",
         "starter": "def csrf_check(request, session):\n    return 'ok'\n",
         "tests": [{"args": [{"method": "POST", "origin": "https://bank.kz", "token": "ab"}, {"token": "ab", "site": "https://bank.kz"}], "expect": "ok"},
                   {"args": [{"method": "POST", "origin": "https://evil.example", "token": "ab"}, {"token": "ab", "site": "https://bank.kz"}], "expect": "bad-origin"},
                   {"args": [{"method": "DELETE", "origin": "https://bank.kz", "token": ""}, {"token": "ab", "site": "https://bank.kz"}], "expect": "bad-token"},
                   {"args": [{"method": "GET", "origin": "https://evil.example", "token": ""}, {"token": "ab", "site": "https://bank.kz"}], "expect": "ok"}],
         "solution": "import hmac\n\ndef csrf_check(request, session):\n    if request['method'] in ('GET', 'HEAD'):\n        return 'ok'\n    if request['origin'] != session['site']:\n        return 'bad-origin'\n    if not hmac.compare_digest(request.get('token') or '', session['token']):\n        return 'bad-token'\n    return 'ok'",
         "hints": ["Екі тәуелсіз тексеріс: Origin тақырыбы және токен."]},
        {"type": "mc", "q": "Токен дәлелінде бөгде сайт неге токенді оқи алмайды?", "options": ["Бір көз саясаты бөгде беттің жауабы мен DOM-ын оқуға тыйым салады.", "Токен шифрланған.", "Токен cookie-де.", "Токен қысқа."],
         "answer": 0, "why": ["Дұрыс.", "Міндетті емес.", "Cookie-де болса, ол автоматты жіберілер еді - бұл басқа схема.", "Ұзындық маңызды, бірақ себебі емес."], "hints": ["Same-origin policy."]},
    ],
    "reflection": ["Сіз қолданатын бір сайттың cookie-лерін браузердің әзірлеуші құралдарында қараңыз (тек өзіңіздікі). Олардың SameSite, Secure, HttpOnly белгілері қандай?"],
    "further": {"honors": ["Өз Flask оқу жобаңызға CSRF токенін (Flask-WTF не қолмен) қосып, токенсіз POST-ты қабылдамайтынын тестпен тексеріңіз."],
                "research": ["«Login CSRF» шабуылы: шабуылдаушы құрбанды өз аккаунтына кіргізеді. Бұл неге қауіпті және оған қарсы қорғаныс қандай?"]},
    "references": REFS + ["OWASP Cross-Site Request Forgery Prevention Cheat Sheet.", "RFC 6265bis, Cookies: HTTP State Management Mechanism (SameSite)."],
}

# ---------------------------------------------------------------- 7-сабақ
ACL = ("ROLES = {\n"
       "    'student': {'grade:read:own', 'homework:submit:own'},\n"
       "    'teacher': {'grade:read:class', 'grade:write:class', 'homework:read:class'},\n"
       "    'admin':   {'user:manage:any'},\n"
       "}\n"
       "users = {'aigul': ('student', '9A'), 'bekzat': ('student', '9B'), 'dana': ('teacher', '9A')}\n"
       "grades = {101: ('aigul', '9A', 5), 102: ('bekzat', '9B', 4)}\n\n"
       "def can(user, action, grade_id):\n"
       "    \"\"\"әдепкі бойынша бас тарту: тек нақты рұқсат ережесі ашады\"\"\"\n"
       "    role, klass = users[user]\n"
       "    owner, g_class, _ = grades[grade_id]\n"
       "    perms = ROLES[role]\n"
       "    if f'grade:{action}:own' in perms and owner == user:\n"
       "        return True\n"
       "    if f'grade:{action}:class' in perms and g_class == klass:\n"
       "        return True\n"
       "    return False\n\n"
       "def get_grade_vulnerable(user, grade_id):\n"
       "    return grades[grade_id][2]                  # IDOR: тек id бойынша, иесін тексермейді\n\n"
       "def get_grade(user, grade_id):\n"
       "    return grades[grade_id][2] if can(user, 'read', grade_id) else 'тыйым (403)'\n\n"
       "for u, gid in [('aigul', 101), ('aigul', 102), ('dana', 101), ('dana', 102)]:\n"
       "    print(f'{u:6} -> баға #{gid}: осал {get_grade_vulnerable(u, gid)} | тексерілген {get_grade(u, gid)}')")

L07 = {
    **META, "id": "ao17-senior.s06.l07", "slug": "l07", "title": "Қолжетімділікті басқару", "difficulty": 4, "minutes": 50,
    "objectives": [
        "IDOR (нысанға тікелей сілтеме) осалдығын тауып, әр сұрауда иелік пен рұқсатты тексеру.",
        "Рөлге негізделген қолжетімділікті (RBAC) «әдепкі бойынша бас тарту» қағидасымен жобалау және оның қасиеттерін дәлелдеу.",
        "Ең аз артықшылық қағидасын пайдаланушыларға, сервистерге және токендерге қолдану.",
    ],
    "prerequisites": ["ao17-senior.s06.l06"],
    "concept": "<p>OWASP Top 10 тізімінде бірінші орындағы осалдық - <b>бұзылған қолжетімділікті басқару</b>. Ең жиі түрі - <b>IDOR</b>: URL-де <code>/grades/101</code>, пайдаланушы оны <code>/grades/102</code> етіп өзгертеді - және басқа оқушының бағасын көреді. Сервер пайдаланушыны аутентификациялады (кім екенін біледі), бірақ <b>авторизацияламады</b> (оған бұл нысан рұқсат етілген бе?).</p>"
               "<p>Дұрыс жобалау үш қағидаға сүйенеді. <b>Әдепкі бойынша бас тарту</b>: ешбір ереже рұқсат бермесе - тыйым. <b>Әр сұрауда тексеру</b>: тек UI-да батырманы жасыру жеткіліксіз, сервер әр нысанға иелікті тексереді. <b>Ең аз артықшылық</b>: әр пайдаланушы, сервис және токен тек өзіне керек құқықтарды алады. RBAC (рөлдер арқылы) мұны басқарылатын етеді.</p>",
    "theory": [
        {"kind": "definition", "title": "RBAC моделі", "body": "<p>Пайдаланушы u-ға рөлдер жиыны R(u), әр рөлге рұқсаттар жиыны P(r). u-ның рұқсаттары Perm(u) = ∪<sub>r∈R(u)</sub> P(r). Шешім: can(u, a, o) = ∃ ереже ρ ∈ Perm(u), ρ (a, o) жұбына сай келеді (мысалы, «өз бағасын оқу»: o.owner = u). Ешбір ереже сай келмесе - тыйым.</p>"},
        {"kind": "theorem", "title": "Әдепкі бас тартудың қасиеттері", "body": "<p>(1) <b>Қауіпсіз әдепкі</b>: рұқсаттар жиыны бос пайдаланушыға кез келген әрекет тыйым салынады; жаңа әрекет түрі қосылғанда, оған ереже жазылмайынша ол бәріне тыйым. (2) <b>Монотондылық</b>: рөл қосу рұқсаттарды ешқашан азайтпайды, рөлді алу ешқашан көбейтпейді. Демек ең аз артықшылықты тексеру - рұқсат етілген әрекеттерді көзбен шолу жеткілікті.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>(1) can(u, a, o) - Perm(u) бойынша экзистенциал кванторы (m01). Perm(u) = ∅ болса, ∃ ρ ∈ ∅ жалған, демек тыйым. Жаңа әрекет a′ үшін ешбір ережеде a′ жоқ болса, ешбір ρ сай келмейді - тыйым. (2) R(u) ⊆ R′(u) болса, Perm(u) = ∪<sub>r∈R(u)</sub>P(r) ⊆ ∪<sub>r∈R′(u)</sub>P(r) = Perm′(u) (бірігу монотонды). ∃ ρ ∈ Perm(u) орындалса, сол ρ Perm′(u)-да да бар - рұқсат сақталады. Кері бағыт симметриялы. ∎ Салдар: «тыйым ережелері» (deny rules) монотондылықты бұзады - рөл қосу рұқсатты азайтуы мүмкін, жүйені түсіну қиындайды. Сондықтан қарапайым RBAC тек рұқсат ережелерінен тұрады.</p>"},
        {"kind": "note", "title": "Ең аз артықшылық", "body": "<p>Пайдаланушыларға ғана емес: дерекқор пайдаланушысы (s06 l04), бұлттық сервистің ролі, CI токені, үшінші тарап интеграциясы - әрқайсысы тек керек әрекеттерге. Токенге мерзім мен ауқым (scope) беріледі: «тек оқу, тек осы репозиторий, 1 сағат».</p>"},
    ],
    "visual": {"lab": "pyrun", "code": ACL, "stdin": "",
               "caption": "Осал нұсқа id бойынша кез келген бағаны береді: Айгүл Бекзаттың бағасын көрді. Тексерілген нұсқада Айгүл тек өз бағасын, Дана мұғалім тек өз сыныбының (9A) бағасын көреді; 9B - тыйым."},
    "derivation": [
        "Нысандарды және олардың иелік қатынастарын анықтау (баға → оқушы → сынып).",
        "Рөлдерді және олардың рұқсаттарын ауқыммен жазу (own, class, any).",
        "Әр эндпоинтта нысанды жүктегеннен кейін can(u, әрекет, нысан) тексерісін қою.",
        "Әдепкі бас тарту: ереже табылмаса - 403 (не нысанның барын жасыру үшін 404).",
        "Тест: әр рөл үшін рұқсат етілген және тыйым салынған әрекеттер матрицасы.",
    ],
    "examples": [
        {"title": "Рұқсаттар матрицасын тестпен тексеру", "lang": "python",
         "code": ACL.split("def get_grade_vulnerable")[0] + "expected = {\n    ('aigul', 'read', 101): True, ('aigul', 'read', 102): False, ('aigul', 'write', 101): False,\n    ('dana', 'read', 101): True, ('dana', 'write', 101): True, ('dana', 'read', 102): False,\n}\nbad = [k for k, v in expected.items() if can(*k) != v]\nprint('матрица тексерілді:', len(expected), 'жағдай, қате:', bad)",
         "output": "матрица тексерілді: 6 жағдай, қате: []",
         "explain": "Әр рөл үшін «не рұқсат, не тыйым» кестесі - қолжетімділіктің ең пайдалы тесті. Жаңа эндпоинт қосылғанда оның жолы кестеге қосылмаса, шолуда бірден көрінеді."},
    ],
    "experiment": {"lab": "pyrun", "code": ACL.replace("    if f'grade:{action}:class' in perms and g_class == klass:\n        return True\n", "    if f'grade:{action}:class' in perms:\n        return True                     # ҚАТЕ: сыныбын тексермейді\n"), "stdin": "",
                   "task": "Мұғалім ережесінен сынып тексерісі түсіп қалды. Дана енді не көреді? Бұл қате неге қауіпті (басқа сыныптағы оқушылардың деректері)? Жұмыс мысалындағы матрица-тест оны ұстар ма еді?"},
    "exercises": [
        {"type": "pycode", "q": "can(user, action, obj, roles, user_roles) - roles: {рөл: [ережелер]}, ереже 'әрекет:own' не 'әрекет:any'; user_roles: {пайдаланушы: [рөлдер]}; obj: {'owner': ...}. Әдепкі бас тарту ережесімен True/False қайтарсын.", "mode": "func", "func": "can",
         "starter": "def can(user, action, obj, roles, user_roles):\n    return True\n",
         "tests": [{"args": ["aigul", "read", {"owner": "aigul"}, {"student": ["read:own"]}, {"aigul": ["student"]}], "expect": True},
                   {"args": ["aigul", "read", {"owner": "bek"}, {"student": ["read:own"]}, {"aigul": ["student"]}], "expect": False},
                   {"args": ["root", "delete", {"owner": "x"}, {"admin": ["delete:any"]}, {"root": ["admin"]}], "expect": True},
                   {"args": ["ghost", "read", {"owner": "ghost"}, {"student": ["read:own"]}, {}], "expect": False}],
         "solution": "def can(user, action, obj, roles, user_roles):\n    for r in user_roles.get(user, []):\n        for rule in roles.get(r, []):\n            a, scope = rule.split(':')\n            if a == action and (scope == 'any' or (scope == 'own' and obj['owner'] == user)):\n                return True\n    return False",
         "hints": ["Рөлі жоқ пайдаланушы - бос жиын, тыйым.", "own ауқымында иелікті тексеріңіз."]},
        {"type": "mc", "q": "Неге батырманы UI-да жасыру қолжетімділікті басқару емес?", "options": ["Себебі UI әдемі емес.", "Себебі шабуылдаушы сұрауды тікелей (curl, әзірлеуші құралдары) жібере алады - тексеріс серверде болуы керек.", "Себебі батырма жылдам.", "Себебі UI шифрланған."],
         "answer": 1, "why": ["Қатысы жоқ.", "Дұрыс.", "Қатысы жоқ.", "Қате."], "hints": ["Клиент - сенімсіз аймақ (сенім шекарасы, 1-сабақ)."]},
        {"type": "mc", "q": "Монотондылық теоремасы бойынша пайдаланушыға жаңа рөл қосылды. Не болуы мүмкін емес?", "options": ["Жаңа әрекетке рұқсат пайда болуы.", "Бұрын рұқсат етілген әрекетке тыйым салынуы.", "Ештеңе өзгермеуі.", "Рұқсаттар жиынының үлкеюі."],
         "answer": 1, "why": ["Мүмкін.", "Дұрыс: Perm ⊆ Perm′.", "Мүмкін (рөлдің рұқсаттары бұрыннан бар болса).", "Мүмкін."], "hints": ["Тек рұқсат ережелері, тыйым ережелері жоқ."]},
    ],
    "reasoning": "<p>Әдепкі бас тартудың дәлелі m01-дегі логикаға қайтады: рұқсат - экзистенциал квантор, ал бос жиын бойынша квантор жалған. Бұл қарапайым факт практикада «ұмытылған ереже - ашық есік» емес, «ұмытылған ереже - жабық есік» дегенді білдіреді: қате қолжетімділікті жоғалтады, бірақ деректі ағызбайды. Монотондылық жүйені түсінікті етеді - сондықтан тыйым ережелерінен аулақ боламыз.</p>",
    "mistakes": [
        {"mistake": "Нысанды id бойынша алып, иелікті тексермеу (IDOR).", "why": "Кез келген пайдаланушы id-ді өзгертіп, басқаның деректерін көреді.", "fix": "Әр сұрауда can(u, әрекет, нысан)."},
        {"mistake": "Әкімші рөлін «ыңғайлы болу үшін» көп адамға беру.", "why": "Бір аккаунт ұрланса - бүкіл жүйе.", "fix": "Ең аз артықшылық, тар рөлдер, уақытша құқықтар."},
    ],
    "assessment": [
        {"type": "pycode", "q": "excess_permissions(granted, used) - granted: {пайдаланушы: [рұқсаттар]}, used: {пайдаланушы: [соңғы 90 күнде қолданылған рұқсаттар]}. Әр пайдаланушының қолданылмаған (алынуы тиіс) рұқсаттарын {пайдаланушы: [сұрыпталған тізім]} етіп, тек бос емес тізімдермен қайтарсын.", "mode": "func", "func": "excess_permissions",
         "starter": "def excess_permissions(granted, used):\n    return {}\n",
         "tests": [{"args": [{"ci": ["repo:read", "repo:write", "secrets:read"]}, {"ci": ["repo:read"]}], "expect": {"ci": ["repo:write", "secrets:read"]}},
                   {"args": [{"a": ["x"]}, {"a": ["x"]}], "expect": {}}, {"args": [{"b": ["y", "z"]}, {}], "expect": {"b": ["y", "z"]}}],
         "solution": "def excess_permissions(granted, used):\n    out = {}\n    for u, perms in granted.items():\n        extra = sorted(set(perms) - set(used.get(u, [])))\n        if extra:\n            out[u] = extra\n    return out",
         "hints": ["Жиындардың айырмасы."]},
        {"type": "mc", "q": "Қауіпсіз әдепкі қасиетінің дәлелі қай логикалық фактіге сүйенеді?", "options": ["Бос жиын бойынша экзистенциал квантор жалған.", "Бос жиын бойынша жалпылық кванторы жалған.", "Де Морган заңы.", "Контрапозиция."],
         "answer": 0, "why": ["Дұрыс: ∃ρ ∈ ∅ - жалған.", "Керісінше, ∀ бос жиында ақиқат - сондықтан «барлық тыйым ережесі орындалмаса рұқсат» схемасы қауіпті.", "Тікелей емес.", "Тікелей емес."], "hints": ["can = ∃ ереже."]},
    ],
    "reflection": ["Сіздің мектебіңіздің электронды күнделігінде қандай рөлдер бар? Ата-ана рөліне қандай ереже керек (бірнеше бала, тек өз балалары)?"],
    "further": {"honors": ["ABAC (атрибуттарға негізделген қолжетімділік) моделін іске асырыңыз: ереже уақыт, IP, құрылғы сияқты атрибуттарға тәуелді. RBAC-пен салыстырғанда тестілеу қаншалықты қиындайды?"],
                "research": ["Google Zanzibar (ReBAC - қатынастарға негізделген): миллиардтаған нысанның рұқсаттарын қалай консистентті және жылдам тексереді?"]},
    "references": REFS + ["NIST RBAC Standard (ANSI INCITS 359-2004).", "OWASP Authorization Cheat Sheet."],
}

# ---------------------------------------------------------------- 8-сабақ
CRYPTO = ("import hashlib\n\n"
          "def keystream(key, nonce, n):\n"
          "    \"\"\"оқу моделі: SHA-256 негізіндегі ағынды шифр (нақты жүйеде - AES-GCM не ChaCha20)\"\"\"\n"
          "    out, counter = b'', 0\n"
          "    while len(out) < n:\n"
          "        out += hashlib.sha256(key + nonce + counter.to_bytes(4, 'big')).digest()\n"
          "        counter += 1\n"
          "    return out[:n]\n\n"
          "def xor(a, b):\n"
          "    return bytes(x ^ y for x, y in zip(a, b))\n\n"
          "key = b'k' * 32\n"
          "p1 = b'TRANSFER 500 TO AIGUL'\n"
          "p2 = b'TRANSFER 900 TO BEKZA'\n"
          "c1 = xor(p1, keystream(key, b'nonce-01', len(p1)))\n"
          "c2_reused = xor(p2, keystream(key, b'nonce-01', len(p2)))     # ҚАТЕ: nonce қайталанды\n"
          "c2_fresh = xor(p2, keystream(key, b'nonce-02', len(p2)))\n"
          "print('шифрмәтін c1:', c1.hex()[:24], '...')\n"
          "print('c1 ⊕ c2 (nonce қайталанған) = p1 ⊕ p2:', xor(c1, c2_reused) == xor(p1, p2))\n"
          "# шабуылдаушы p1-ді болжаса (мысалы, үлгі белгілі), p2-ні толық алады:\n"
          "print('қалпына келтірілген p2:', xor(xor(c1, c2_reused), p1).decode())\n"
          "print('жаңа nonce кезінде:', xor(xor(c1, c2_fresh), p1)[:12])\n\n"
          "# Диффи-Хеллман: ортақ құпияны ашық арнамен келісу (оқу үшін шағын сандар)\n"
          "p, g = 2_147_483_647, 7\n"
          "a, b = 1_234_567, 7_654_321              # құпия, әрқайсысы өзінде\n"
          "A, B = pow(g, a, p), pow(g, b, p)         # ашық жіберіледі\n"
          "print('ортақ құпия бірдей:', pow(B, a, p) == pow(A, b, p))")

L08 = {
    **META, "id": "ao17-senior.s06.l08", "slug": "l08", "title": "Криптография практикада", "difficulty": 5, "minutes": 60,
    "objectives": [
        "Симметриялық және асимметриялық шифрлауды, хэш пен MAC-ты мақсаттары бойынша ажырату.",
        "Ағынды шифрда nonce қайталанса, c₁ ⊕ c₂ = p₁ ⊕ p₂ болатынын дәлелдеп, nonce-тың рөлін түсіндіру.",
        "Диффи-Хеллман келісімінің дұрыстығын дәлелдеп, TLS-тің не қорғайтынын (құпиялылық, бүтіндік, түпнұсқалық) сипаттау.",
    ],
    "prerequisites": ["ao17-senior.s06.l07"],
    "concept": "<p>Криптографияның бірінші ережесі: <b>өз алгоритміңізді ойлап таппаңыз</b>. Екінші ережесі: дайын алгоритмді дұрыс қолданыңыз - өйткені нақты бұзылулардың көбі алгоритмде емес, оның қолданылуында. Бұл сабақ құралдарды мақсаты бойынша ажыратады: <b>хэш</b> (бүтіндік, кілтсіз), <b>MAC</b> (бүтіндік + түпнұсқалық, ортақ кілт, 3-сабақ), <b>симметриялық шифр</b> (құпиялылық, ортақ кілт: AES-GCM), <b>асимметриялық</b> (кілт алмасу мен қолтаңба, ашық/жеке кілт жұбы).</p>"
               "<p>Ең жиі, ең ауыр қолдану қатесін тетігімен көреміз: <b>nonce-ты қайталау</b>. Заманауи шифрлар (AES-GCM, ChaCha20) кілт пен nonce-тан «кілт ағынын» жасап, оны мәтінмен XOR етеді. Бір кілт пен бір nonce екі рет қолданылса, екі шифрмәтінді XOR ету кілтті толық жояды - қалғаны екі ашық мәтіннің XOR-ы. Сосын ортақ кілтті ашық арнамен қалай келісеміз - Диффи-Хеллман.</p>",
    "theory": [
        {"kind": "definition", "title": "Ағынды шифр", "body": "<p>Кілт ағыны z = KS(k, n) (k - кілт, n - nonce). Шифрлау c = p ⊕ z, шешу p = c ⊕ z. Nonce («бір рет қолданылатын сан») әр хабарға бірегей болуы керек.</p>"},
        {"kind": "theorem", "title": "Nonce қайталау және DH дұрыстығы", "body": "<p>(1) c₁ = p₁ ⊕ KS(k, n), c₂ = p₂ ⊕ KS(k, n) болса, c₁ ⊕ c₂ = p₁ ⊕ p₂ - кілттен тәуелсіз; p₁ белгілі болса, p₂ = c₁ ⊕ c₂ ⊕ p₁. (2) Диффи-Хеллман: A = g<sup>a</sup> mod p, B = g<sup>b</sup> mod p болса, B<sup>a</sup> ≡ A<sup>b</sup> ≡ g<sup>ab</sup> (mod p).</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>(1) XOR ассоциативті, коммутативті, x ⊕ x = 0, x ⊕ 0 = x. c₁ ⊕ c₂ = (p₁ ⊕ z) ⊕ (p₂ ⊕ z) = p₁ ⊕ p₂ ⊕ (z ⊕ z) = p₁ ⊕ p₂ ⊕ 0 = p₁ ⊕ p₂. Сосын (p₁ ⊕ p₂) ⊕ p₁ = p₂ ⊕ (p₁ ⊕ p₁) = p₂. Кілт z қысқарып кетті - оның күші маңызды емес. (2) Модуль бойынша көбейту ассоциативті және коммутативті: B<sup>a</sup> = (g<sup>b</sup>)<sup>a</sup> = g<sup>ba</sup> = g<sup>ab</sup> = (g<sup>a</sup>)<sup>b</sup> = A<sup>b</sup> (mod p). ∎ Ескертулер: (1)-ден nonce құпия болудың қажеті жоқ, бірақ бірегей болуы міндетті. (2) тек дұрыстықты дәлелдейді; қауіпсіздік g<sup>a</sup>-дан a-ны табудың (дискретті логарифм) қиындығына сүйенеді, ал нақты p кемінде 2048 бит не эллипстік қисық (X25519). Аутентификациясыз DH «ортадағы адам» шабуылына осал - сондықтан TLS-те ол сертификатпен қолтаңбаланады.</p>"},
        {"kind": "note", "title": "TLS не береді", "body": "<p>TLS 1.3: (1) DH (ECDHE) арқылы ортақ кілт - әр сессияға жаңа (алға қарай құпиялылық); (2) сервер сертификаты мен қолтаңбасы - түпнұсқалық (сіз шынымен bank.kz-пен сөйлесесіз); (3) AEAD шифры (AES-GCM, ChaCha20-Poly1305) - құпиялылық пен бүтіндік. TLS трафикті жолда қорғайды, бірақ серверде сақталған деректерді емес (2-сабақ) және қосымша осалдықтарын емес (4-7 сабақтар).</p>"},
    ],
    "visual": {"lab": "pyrun", "code": CRYPTO, "stdin": "",
               "caption": "Оқу моделі. Nonce қайталанғанда c₁ ⊕ c₂ = p₁ ⊕ p₂: бірінші хабарды білетін шабуылдаушы екіншісін кілтсіз оқиды. Жаңа nonce-та бұл мағынасыз байттар береді. DH: екі тарап ашық A, B арқылы бірдей құпияға келді."},
    "derivation": [
        "Мақсатты атау: құпиялылық, бүтіндік, түпнұсқалық - қайсысы керек?",
        "Құралды таңдау: AEAD шифр (екеуі бірге), MAC, қолтаңба, құпиясөз хэші (2-сабақ).",
        "Дайын, тексерілген кітапхананы қолдану (cryptography, libsodium) - өз іске асыруыңыз емес.",
        "Nonce-ты бірегей ету: санағыш не жеткілікті ұзын кездейсоқ (96 бит), ешқашан қайталамау.",
        "Кілттерді басқару: генерация, сақтау (құпия менеджері), айналдыру, жою.",
    ],
    "examples": [
        {"title": "Хэш бүтіндікті тексереді, бірақ түпнұсқалықты емес", "lang": "python",
         "code": "import hashlib, hmac\n\nfile = b'update-v2.bin: ...binary...'\npublished_hash = hashlib.sha256(file).hexdigest()\n# шабуылдаушы файлды да, хэшті де ауыстыра алса - хэш көмектеспейді:\nevil = b'update-v2.bin: ...malware...'\nprint('хэш тексерісі (шабуылдаушының хэшімен):', hashlib.sha256(evil).hexdigest() == hashlib.sha256(evil).hexdigest())\n# MAC: шабуылдаушы кілтті білмейді\nkey = b'release-signing-key'\ntag = hmac.new(key, file, hashlib.sha256).hexdigest()\nprint('MAC тексерісі (жалған файл):', hmac.compare_digest(hmac.new(key, evil, hashlib.sha256).hexdigest(), tag))\nprint('MAC тексерісі (түпнұсқа):  ', hmac.compare_digest(hmac.new(key, file, hashlib.sha256).hexdigest(), tag))",
         "output": "хэш тексерісі (шабуылдаушының хэшімен): True\nMAC тексерісі (жалған файл): False\nMAC тексерісі (түпнұсқа):   True",
         "explain": "Хэш файлдың «жолда бұзылмағанын» тек хэштің өзі сенімді арнамен келгенде ғана растайды. Түпнұсқалыққа кілт керек: ортақ кілтпен - MAC, ашық кілтпен - цифрлық қолтаңба (9-сабақтағы пакеттер)."},
    ],
    "experiment": {"lab": "pyrun", "code": CRYPTO.replace("a, b = 1_234_567, 7_654_321", "a, b = 1_234_567, 7_654_321\nmallory = 42                             # ортадағы адам өз құпиясымен").replace("print('ортақ құпия бірдей:', pow(B, a, p) == pow(A, b, p))", "M = pow(g, mallory, p)\n# Mallory A мен B-ны ұстап алып, екі жаққа да өз M-ін жібереді\nprint('Әлия мен Mallory кілті:', pow(M, a, p) == pow(A, mallory, p))\nprint('Бекзат пен Mallory кілті:', pow(M, b, p) == pow(B, mallory, p))\nprint('Әлия мен Бекзат кілттері бірдей ме:', pow(M, a, p) == pow(M, b, p))"), "stdin": "",
                   "task": "Ортадағы адам (Mallory) екі тарапқа өз ашық мәнін жіберді. Ол екеуімен де бөлек құпия келісті. Неге DH-тың дұрыстық теоремасы бұл шабуылдан қорғамайды? TLS бұл мәселені қалай шешеді (сертификат, қолтаңба)?"},
    "exercises": [
        {"type": "pycode", "q": "recover(c1_hex, c2_hex, p1) - бір кілт пен бір nonce-пен шифрланған екі шифрмәтін (он алтылық) және бірінші ашық мәтін (жол) берілген. Екінші ашық мәтінді жол етіп қайтарсын (ұзындықтар бірдей).", "mode": "func", "func": "recover",
         "starter": "def recover(c1_hex, c2_hex, p1):\n    return p1\n",
         "tests": [{"args": ["0a1b2c", "0b1c2f", "abc"], "expect": "`e`"}, {"args": ["00000000", "00000000", "wxyz"], "expect": "wxyz"}],
         "solution": "def recover(c1_hex, c2_hex, p1):\n    c1, c2 = bytes.fromhex(c1_hex), bytes.fromhex(c2_hex)\n    return bytes(a ^ b ^ c for a, b, c in zip(c1, c2, p1.encode())).decode()",
         "hints": ["p₂ = c₁ ⊕ c₂ ⊕ p₁, байт бойынша.", "bytes.fromhex және .encode()."]},
        {"type": "pycode", "q": "dh_shared(p, g, a, b) - Диффи-Хеллман: екі тараптың ортақ құпиясын (pow арқылы) есептеп, [A, B, ортақ_құпия] қайтарсын; екі тарап есептеген мәндер бірдей екенін тексеріңіз (бірдей болмаса None).", "mode": "func", "func": "dh_shared",
         "starter": "def dh_shared(p, g, a, b):\n    return [g * a, g * b, g * a * b]\n",
         "tests": [{"args": [23, 5, 6, 15], "expect": [8, 19, 2]}, {"args": [2147483647, 7, 1234567, 7654321], "expect": [pow(7, 1234567, 2147483647), pow(7, 7654321, 2147483647), pow(7, 1234567 * 7654321, 2147483647)]}],
         "solution": "def dh_shared(p, g, a, b):\n    A, B = pow(g, a, p), pow(g, b, p)\n    s1, s2 = pow(B, a, p), pow(A, b, p)\n    return [A, B, s1] if s1 == s2 else None",
         "hints": ["pow(base, exp, mod) - тиімді модуль бойынша дәреже.", "Классикалық мысал: p = 23, g = 5, a = 6, b = 15 → ортақ құпия 2."]},
        {"type": "mc", "q": "AES-GCM-де nonce туралы қай тұжырым дұрыс?", "options": ["Nonce құпия болуы керек.", "Nonce бір кілтпен ешқашан қайталанбауы керек, бірақ оны ашық жіберуге болады.", "Nonce-ты кілтпен бірдей ету жақсы.", "Nonce маңызды емес."],
         "answer": 1, "why": ["Құпиялылық талап етілмейді.", "Дұрыс: теореманың (1) бөлігі.", "Қате.", "Қайталану кілт ағынын жояды."], "hints": ["c₁ ⊕ c₂ = p₁ ⊕ p₂."]},
    ],
    "reasoning": "<p>XOR-дың қарапайым алгебрасы (x ⊕ x = 0) күшті шифрдың бір қолдану қатесінде толық құлайтынын көрсетеді: кілт қаншалықты ұзын болса да, ол қысқарып кетеді. Бұл - «алгоритм емес, қолдану бұзылады» дегеннің ең таза мысалы. DH теоремасы дұрыстықты береді, бірақ эксперимент оның шекарасын ашады: аутентификациясыз келісім ортадағы адамды да «дұрыс» қамтиды. Senior тәсілі - дайын протоколдар (TLS 1.3, libsodium) және олардың инварианттарын (бірегей nonce, аутентификацияланған кілт) бұзбау.</p>",
    "mistakes": [
        {"mistake": "Nonce-ты тұрақты не кездейсоқ, бірақ тым қысқа ету.", "why": "Қайталану - кілт ағыны жойылады (теорема).", "fix": "Санағыш не 96+ бит кездейсоқ; кітапхананың өзі басқарғаны жақсы."},
        {"mistake": "Шифрлауды бүтіндіксіз қолдану (AES-CBC MAC-сыз).", "why": "Шабуылдаушы шифрмәтінді өзгертіп, ашық мәтінге болжамды әсер ете алады.", "fix": "AEAD (AES-GCM, ChaCha20-Poly1305)."},
    ],
    "assessment": [
        {"type": "pycode", "q": "nonce_reuse(messages) - messages: [[кілт_id, nonce], ...] шифрланған хабарлар тізімі. Бір кілтпен бір nonce қайталанған жұптардың (бірінші және кейінгі кездесу индекстері) [[i, j], ...] тізімін қайтарсын.", "mode": "func", "func": "nonce_reuse",
         "starter": "def nonce_reuse(messages):\n    return []\n",
         "tests": [{"args": [[["k1", "n1"], ["k1", "n2"], ["k1", "n1"], ["k2", "n1"]]], "expect": [[0, 2]]},
                   {"args": [[["a", "x"], ["a", "x"], ["a", "x"]]], "expect": [[0, 1], [0, 2]]}, {"args": [[["k", "1"], ["k", "2"]]], "expect": []}],
         "solution": "def nonce_reuse(messages):\n    first, out = {}, []\n    for i, (k, n) in enumerate(messages):\n        if (k, n) in first:\n            out.append([first[(k, n)], i])\n        else:\n            first[(k, n)] = i\n    return out",
         "hints": ["Әртүрлі кілттерде бір nonce - қауіпсіз.", "(кілт, nonce) жұбы бойынша бірінші индексті сақтаңыз."]},
        {"type": "mc", "q": "Nonce қайталау дәлелінде кілттің ұзындығы неге маңызды емес?", "options": ["Себебі z ⊕ z = 0: кілт ағыны толық қысқарады.", "Себебі кілт қысқа.", "Себебі XOR коммутативті емес.", "Себебі nonce құпия."],
         "answer": 0, "why": ["Дұрыс.", "Кез келген ұзындық.", "Коммутативті.", "Құпия емес."], "hints": ["(p₁ ⊕ z) ⊕ (p₂ ⊕ z)."]},
    ],
    "reflection": ["Браузерде https сайттың құлып белгісін басып, сертификатты қараңыз (өз браузеріңізде). Ол кімге берілген, кім қолтаңбалаған, мерзімі қашан бітеді?"],
    "further": {"honors": ["Python-ның cryptography кітапханасымен (өз компьютеріңізде) AES-GCM арқылы файлды шифрлап, шифрмәтіннің бір байтын өзгертіп, шешуде тег қатесін алыңыз. Бүтіндіктің тәжірибелік көрінісі."],
                "research": ["Кванттық компьютерлер DH пен RSA-ны неге бұзады (Шор алгоритмі) және постквант криптографиясы (ML-KEM, NIST 2024) не ұсынады?"]},
    "references": REFS + ["W. Diffie, M. Hellman, New Directions in Cryptography, IEEE Trans. Information Theory 22(6), 1976.", "RFC 8446, The Transport Layer Security (TLS) Protocol Version 1.3."],
}

# ---------------------------------------------------------------- 9-сабақ
SUPPLY = ("from collections import deque\n\n"
          "deps = {  # пакет -> тікелей тәуелділіктер (нұсқасымен)\n"
          "    'app@1.0':        ['web@3.2', 'report@1.1'],\n"
          "    'web@3.2':        ['template@2.0', 'http@1.4'],\n"
          "    'report@1.1':     ['pdfgen@0.9', 'http@1.4'],\n"
          "    'pdfgen@0.9':     ['imaging@5.1'],\n"
          "    'template@2.0':   [], 'http@1.4': [], 'imaging@5.1': [],\n"
          "}\n"
          "advisories = {'imaging': ('<', '5.2', 'буфер асып кетуі'), 'http': ('<', '1.3', 'тақырып инъекциясы')}\n\n"
          "def ver(v):\n"
          "    return tuple(int(x) for x in v.split('.'))\n\n"
          "def vulnerable(pkg):\n"
          "    name, v = pkg.split('@')\n"
          "    if name in advisories:\n"
          "        op, bound, desc = advisories[name]\n"
          "        if ver(v) < ver(bound):\n"
          "            return desc\n"
          "    return None\n\n"
          "def paths_to_vulns(root):\n"
          "    \"\"\"BFS: түбірден әр осал пакетке ең қысқа жол\"\"\"\n"
          "    parent, q, found = {root: None}, deque([root]), {}\n"
          "    while q:\n"
          "        u = q.popleft()\n"
          "        if vulnerable(u):\n"
          "            path, x = [], u\n"
          "            while x:\n"
          "                path.append(x); x = parent[x]\n"
          "            found[u] = list(reversed(path))\n"
          "        for v in deps[u]:\n"
          "            if v not in parent:\n"
          "                parent[v] = u; q.append(v)\n"
          "    return found\n\n"
          "for pkg, path in paths_to_vulns('app@1.0').items():\n"
          "    print(f'{pkg}: {vulnerable(pkg)}')\n"
          "    print('   жол:', ' -> '.join(path))\n"
          "print('барлық тәуелділік (транзитивті):', len([p for p in deps if p != 'app@1.0']), ', тікелей:', len(deps['app@1.0']))")

L09 = {
    **META, "id": "ao17-senior.s06.l09", "slug": "l09", "title": "Тәуелділіктер және жеткізу тізбегі", "difficulty": 4, "minutes": 50,
    "objectives": [
        "Транзитивті тәуелділіктер графын құрып, осал пакетке апаратын жолды BFS арқылы табу.",
        "Нұсқаларды бекіту (lock файл) мен бүтіндік хэшінің не қорғайтынын түсіндіру.",
        "BFS барлық қолжетімді пакетті табатынын дәлелдеп, тәуелділіктерді жаңарту саясатын жобалау.",
    ],
    "prerequisites": ["ao17-senior.s06.l08"],
    "concept": "<p>Сіздің қосымшаңыздың кодының 90%-ы сізге тиесілі емес - ол тәуелділіктердің тәуелділіктері. Сіз 2 пакетті орнаттыңыз, ал олар тағы 40-ын әкелді. Олардың біреуінде осалдық болса (не біреуін біреу әдейі зиянды нұсқамен ауыстырса), ол сіздің қосымшаңызда. Бұл - <b>жеткізу тізбегінің</b> тәуекелі: шабуыл сіздің кодыңызға емес, сіз сенетін кодқа.</p>"
               "<p>Қорғаныс құралдары: (1) <b>тәуелділік графы</b> мен осалдықтар базасы - қай осал пакет, қай жолмен келді; (2) <b>нұсқаларды бекіту</b> (lock файл: package-lock.json, poetry.lock) - әр орнату дәл бірдей нұсқаларды алады; (3) <b>бүтіндік хэші</b> - жүктелген файл lock файлдағы хэшке сай келмесе, орнату тоқтайды; (4) <b>жаңарту саясаты</b> - жиі, кішкентай, автоматты тексерілген жаңартулар (s04 l08-тегі пакет моделі осында да жұмыс істейді).</p>",
    "theory": [
        {"kind": "definition", "title": "Тәуелділік графы", "body": "<p>Түйіндер - пакет@нұсқа, қабырға u → v - «u v-ге тікелей тәуелді». Қосымшаның транзитивті тәуелділіктері - түбірден қолжетімді түйіндер жиыны Reach(root). Осалдық базасы әр пакетке осал нұсқалар ауқымын береді.</p>"},
        {"kind": "theorem", "title": "BFS толықтығы және ең қысқа жол", "body": "<p>BFS түбірден бастағанда (1) Reach(root)-тағы әр түйінді дәл бір рет көреді; (2) parent тізбегі бойынша қалпына келтірілген жол түбірден сол түйінге қабырға саны бойынша ең қысқа жол.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>(1) Түйін кезекке тек parent-ке қосылғанда кіреді, ал parent-тегі түйін қайта қосылмайды - сондықтан әр түйін ең көп бір рет өңделеді. Толықтық: v ∈ Reach(root) және root = x₀ → x₁ → … → x<sub>k</sub> = v жолы бар болсын. k бойынша индукция: x₀ көрілді; x<sub>i</sub> көрілсе, ол өңделгенде x<sub>i+1</sub>-ді қарайды, ол не бұрыннан көрілген, не енді қосылады. Демек v көріледі. (2) BFS түйіндерді түбірден қашықтық бойынша (0, 1, 2, …) кему емес ретпен өңдейді (кезек FIFO, m09). v алғаш d(v) қашықтықтағы түйіннен табылады, сондықтан parent жолының ұзындығы d(v). ∎ Практикалық салдар: осал пакетке апаратын ең қысқа жол «қай тікелей тәуелділікті жаңарту керек?» сұрағына жауап береді - мұнда pdfgen арқылы report.</p>"},
        {"kind": "note", "title": "Бүтіндік және lock файл", "body": "<p>Lock файл нұсқаны ғана емес, әр файлдың хэшін (sha256/sha512) сақтайды. Тізілімде пакет ауыстырылса (не жолда өзгертілсе), хэш сәйкес келмейді - орнату тоқтайды. Бірақ хэш тек «lock жасалған кездегімен бірдей» екенін кепілдейді; сол кезде пакет зиянды болса, хэш оны «бекітеді». Сондықтан жаңа тәуелділікті қосу - шолу (s04 l02) талап ететін шешім.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": SUPPLY, "stdin": "",
               "caption": "Қосымша 2 пакетке тікелей тәуелді, бірақ барлығы 6 пакет. imaging@5.1 (осал) pdfgen → report арқылы келді: оны жаңарту үшін report не pdfgen жаңаруы керек. http@1.4 1.3-тен жаңа - осал емес."},
    "derivation": [
        "Lock файлдан толық тәуелділік графын құру.",
        "Әр түйінді осалдық базасымен (нұсқа ауқымы) салыстыру.",
        "BFS арқылы әр осал пакетке ең қысқа жолды табу - қай тікелей тәуелділік жауапты.",
        "Бүтіндік хэштерін тексеріп орнату (npm ci, pip --require-hashes).",
        "Жаңарту саясаты: автоматты PR-лар (Dependabot), тесттер, кішкентай жиі жаңартулар.",
    ],
    "examples": [
        {"title": "Бүтіндік хэшін тексеру", "lang": "python",
         "code": "import hashlib\n\nlock = {'imaging-5.2.tar.gz': hashlib.sha256(b'official release 5.2').hexdigest()}\n\ndef install(name, data):\n    got = hashlib.sha256(data).hexdigest()\n    if got != lock[name]:\n        return f'ТОҚТАТЫЛДЫ: {name} хэші сәйкес емес ({got[:12]}... != {lock[name][:12]}...)'\n    return f'орнатылды: {name}'\n\nprint(install('imaging-5.2.tar.gz', b'official release 5.2'))\nprint(install('imaging-5.2.tar.gz', b'official release 5.2 + backdoor'))",
         "output": "орнатылды: imaging-5.2.tar.gz\nТОҚТАТЫЛДЫ: imaging-5.2.tar.gz хэші сәйкес емес (a3b60f7fd7fa... != c0fc24023418...)",
         "explain": "Бір байтқа өзгерген пакет орнатылмайды. Бұл - 8-сабақтағы хэштің бүтіндік қасиеті; ал хэштің өзі сенімді болуы үшін lock файл репозиторийде шолумен өзгертіледі."},
    ],
    "experiment": {"lab": "pyrun", "code": SUPPLY.replace("'pdfgen@0.9':     ['imaging@5.1'],", "'pdfgen@0.9':     ['imaging@5.1', 'http@1.2'],").replace("'template@2.0':   [], 'http@1.4': [], 'imaging@5.1': [],", "'template@2.0':   [], 'http@1.4': [], 'imaging@5.1': [], 'http@1.2': [],"), "stdin": "",
                   "task": "pdfgen ескі http@1.2-ні әкелді - енді графта http-тің екі нұсқасы бар. Қай нұсқа осал? Оған апаратын жол қандай? Неге бір пакеттің екі нұсқасы болуы қауіпсіздік шолуын қиындатады?"},
    "exercises": [
        {"type": "pycode", "q": "affected(deps, vulnerable) - deps: {пакет: [тәуелділіктер]}, vulnerable: осал пакеттер тізімі. Транзитивті түрде кемінде бір осал пакетке тәуелді (не өзі осал) пакеттердің сұрыпталған тізімін қайтарсын.", "mode": "func", "func": "affected",
         "starter": "def affected(deps, vulnerable):\n    return sorted(p for p in deps if set(deps[p]) & set(vulnerable))\n",
         "tests": [{"args": [{"app": ["web", "rep"], "web": ["tpl"], "rep": ["pdf"], "pdf": ["img"], "tpl": [], "img": []}, ["img"]], "expect": ["app", "img", "pdf", "rep"]},
                   {"args": [{"a": ["b"], "b": []}, []], "expect": []}, {"args": [{"x": ["y"], "y": ["z"], "z": []}, ["z"]], "expect": ["x", "y", "z"]}],
         "solution": "def affected(deps, vulnerable):\n    bad = set(vulnerable)\n    memo = {}\n    def hit(p):\n        if p not in memo:\n            memo[p] = p in bad or any(hit(q) for q in deps.get(p, []))\n        return memo[p]\n    return sorted(p for p in deps if hit(p))",
         "hints": ["Starter тек тікелей тәуелділікті көреді.", "Рекурсия + мемоизация (граф циклсыз деп ұйғарамыз)."]},
        {"type": "pycode", "q": "in_range(version, op, bound) - нұсқа жолдарын сан ретінде салыстырып (1.10 > 1.9), op ∈ {'<', '<=', '>=', '=='} бойынша True/False қайтарсын.", "mode": "func", "func": "in_range",
         "starter": "def in_range(version, op, bound):\n    return eval(f'{version!r} {op} {bound!r}')\n",
         "tests": [{"args": ["1.9", "<", "1.10"], "expect": True}, {"args": ["5.1", "<", "5.2"], "expect": True}, {"args": ["2.0.1", ">=", "2.0"], "expect": True}, {"args": ["3.2", "==", "3.2.0"], "expect": True}],
         "solution": "def in_range(version, op, bound):\n    a = [int(x) for x in version.split('.')]\n    b = [int(x) for x in bound.split('.')]\n    n = max(len(a), len(b))\n    a += [0] * (n - len(a)); b += [0] * (n - len(b))\n    return {'<': a < b, '<=': a <= b, '>=': a >= b, '==': a == b}[op]",
         "hints": ["Жолдарды салыстыру: '1.9' > '1.10' (лексикографиялық) - қате.", "Ұзындықтарды 0-мен теңестіріңіз: 3.2 == 3.2.0."]},
        {"type": "mc", "q": "Lock файлдағы бүтіндік хэші нені кепілдейді?", "options": ["Пакетте осалдық жоқ екенін.", "Орнатылған файл lock жасалған кездегі файлмен бірдей екенін.", "Пакет авторының адал екенін.", "Пакеттің жылдамдығын."],
         "answer": 1, "why": ["Хэш мазмұнды бағаламайды.", "Дұрыс.", "Кепілдемейді.", "Қатысы жоқ."], "hints": ["Хэш - өзгеріссіздіктің дәлелі, сапаның емес."]},
    ],
    "reasoning": "<p>Жеткізу тізбегі - қауіп моделіндегі (1-сабақ) ең үлкен сенім шекарасы: біз мыңдаған бөгде адамның кодына сенеміз. BFS теоремасы бұл сенімді көрінетін етеді: әр осал пакет пен оның қосымшаға жеткен жолы. Хэштер мен lock файлдар өзгеріссіздікті кепілдейді, бірақ сапаны емес - сондықтан жаңа тәуелділікті қосу шолу мен ADR-ге (s01 l09) лайық шешім.</p>",
    "mistakes": [
        {"mistake": "Нұсқаларды бекітпеу (^ не * ауқымдары, lock файлсыз).", "why": "Әр орнату әртүрлі нұсқа алады; зиянды жаңа нұсқа автоматты кіреді.", "fix": "Lock файл, хэштер, жаңартуды тек PR арқылы."},
        {"mistake": "Нұсқаларды жол ретінде салыстыру.", "why": "'1.9' > '1.10' - осал нұсқа «жаңа» болып көрінеді.", "fix": "Сандар кортежі не semver кітапханасы."},
    ],
    "assessment": [
        {"type": "pycode", "q": "shortest_path(deps, root, target) - тәуелділік графында root-тан target-қа ең қысқа жолды (пакеттер тізімі) BFS арқылы қайтарсын; жол жоқ болса []. Көршілерді тізімдегі ретімен қарау.", "mode": "func", "func": "shortest_path",
         "starter": "def shortest_path(deps, root, target):\n    return [root, target]\n",
         "tests": [{"args": [{"app": ["web", "rep"], "web": ["http"], "rep": ["pdf", "http"], "pdf": ["img"], "http": [], "img": []}, "app", "img"], "expect": ["app", "rep", "pdf", "img"]},
                   {"args": [{"app": ["web", "rep"], "web": ["http"], "rep": ["pdf", "http"], "pdf": ["img"], "http": [], "img": []}, "app", "http"], "expect": ["app", "web", "http"]},
                   {"args": [{"a": [], "b": []}, "a", "b"], "expect": []}],
         "solution": "from collections import deque\n\ndef shortest_path(deps, root, target):\n    parent, q = {root: None}, deque([root])\n    while q:\n        u = q.popleft()\n        if u == target:\n            path = []\n            while u is not None:\n                path.append(u); u = parent[u]\n            return path[::-1]\n        for v in deps.get(u, []):\n            if v not in parent:\n                parent[v] = u; q.append(v)\n    return []",
         "hints": ["parent сөздігі арқылы жолды қалпына келтіру.", "http-ке екі жол бар; BFS web арқылы ертерек табады."]},
        {"type": "mc", "q": "BFS ең қысқа жолды неге береді?", "options": ["Себебі кезек FIFO: түйіндер түбірден қашықтық бойынша кемімейтін ретпен өңделеді, әр түйін ең аз қашықтықта алғаш табылады.", "Себебі граф ағаш.", "Себебі DFS-тен жылдам.", "Себебі қабырғалар салмақты."],
         "answer": 0, "why": ["Дұрыс.", "Міндетті емес.", "Жылдамдық емес, рет.", "Салмақсыз (салмақты - Дейкстра, s02 модельдері)."], "hints": ["Қабаттар бойынша аралау."]},
    ],
    "reflection": ["Өз Python жобаңызда pip list не pipdeptree арқылы неше транзитивті тәуелділік бар екенін санаңыз (өз компьютеріңізде). Олардың қаншасын білесіз?"],
    "further": {"honors": ["pip-audit не npm audit нәтижесін (өз жобаңызда) талдап, әр осалдыққа ең қысқа жолды және «қай тікелей тәуелділікті жаңарту жеткілікті» деген ұсынысты беретін скрипт жазыңыз."],
                "research": ["SolarWinds (2020) және xz-utils (2024) оқиғалары: жеткізу тізбегіне шабуыл қалай ұйымдастырылды және қандай қорғаныс (қайталанатын жинақтар, SLSA, Sigstore) оны тоқтатар еді?"]},
    "references": REFS + ["SLSA (Supply-chain Levels for Software Artifacts) сипаттамасы.", "OWASP Top 10 2021: A06 Vulnerable and Outdated Components."],
}

# ---------------------------------------------------------------- 10-сабақ
REVIEW = ("FINDINGS = [  # (атауы, ықтималдық 1-5, әсер 1-5, түзету құны (күн), қауіп түрі)\n"
          "    ('IDOR бағалар API-де',          4, 5, 1, 'E'),\n"
          "    ('токен мерзімі шексіз',          3, 4, 1, 'S'),\n"
          "    ('CSP жоқ',                       2, 3, 2, 'T'),\n"
          "    ('құпиясөз SHA-256 тұзсыз',       2, 5, 3, 'I'),\n"
          "    ('қате хабарында SQL мәтіні',     3, 2, 1, 'I'),\n"
          "    ('ескі imaging@5.1',              2, 4, 1, 'T'),\n"
          "]\n\n"
          "def severity(p, i):\n"
          "    r = p * i\n"
          "    return 'шұғыл' if r >= 15 else 'жоғары' if r >= 8 else 'орташа' if r >= 4 else 'төмен'\n\n"
          "ranked = sorted(FINDINGS, key=lambda f: (-(f[1] * f[2]) / f[3], -(f[1] * f[2]), f[0]))\n"
          "print(f'{\"табылған\":28} {\"тәуекел\":>7} {\"деңгей\":>8} {\"күн\":>4}  басымдық (тәуекел/күн)')\n"
          "for name, p, i, cost, kind in ranked:\n"
          "    print(f'{name:28} {p * i:7} {severity(p, i):>8} {cost:4}  {p * i / cost:.1f}')\n"
          "covered = sorted({f[4] for f in FINDINGS})\n"
          "print('STRIDE қамтылуы:', covered, '- тексерілмегені:', sorted(set('STRIDE') - set(covered)))")

L10 = {
    **META, "id": "ao17-senior.s06.l10", "slug": "l10", "title": "Қауіпсіздік шолуы", "difficulty": 4, "minutes": 60,
    "objectives": [
        "Жүйенің қауіпсіздік шолуын қауіп моделінен бастап, табылғандарды тәуекел бойынша жіктеп жүргізу.",
        "Табылғандарды тәуекел/құн қатынасы бойынша түзету ретіне қою (s04 l05-тегі Смит ережесінің қолданысы).",
        "Модуль бойы жинаған қорғаныстарды бір шолу есебіне біріктіріп, жауапты ашу (responsible disclosure) қағидаларын сақтау.",
    ],
    "prerequisites": ["ao17-senior.s06.l09"],
    "concept": "<p>Қауіпсіздік шолуы - модульдің барлық құралын бір жүйеге қолдану: қауіп моделі (1), құпиясөздер (2), токендер (3), инъекциялар (4, 5), CSRF (6), қолжетімділік (7), криптография (8), тәуелділіктер (9). Шолудың нәтижесі - «осалдықтар тізімі» емес, <b>шешімдер үшін ақпарат</b>: не қаншалықты қауіпті, оны түзету қаншаға түседі, қай ретпен түзетеміз.</p>"
               "<p>Екі практикалық қағида. (1) <b>Басымдық</b>: тәуекел (ықтималдық × әсер) бойынша ғана емес, тәуекел/түзету құны бойынша - бұл s04 l05-тегі WSJF ережесі: бір күнде түзетілетін ауыр IDOR үш күндік кемшіліктен бұрын. (2) <b>Жауапты ашу</b>: бөгде жүйеде осалдық тапсаңыз, оны тек иесіне, жария етпей, түзетуге уақыт беріп хабарлайсыз; рұқсатсыз тексеру - заң бұзушылық. Бұл модульдегі барлық тәжірибе - өз кодыңызда және өз оқу ортаңызда.</p>",
    "theory": [
        {"kind": "definition", "title": "Табылған және оның тәуекелі", "body": "<p>Әр табылған f: ықтималдық p<sub>f</sub> (1-5), әсер i<sub>f</sub> (1-5), түзету құны c<sub>f</sub> (күн). Тәуекел R<sub>f</sub> = p<sub>f</sub>·i<sub>f</sub>. Түзетулер ретпен орындалады; f түзетілгенше оның тәуекелі уақыт бірлігіне R<sub>f</sub> «шығын» береді.</p>"},
        {"kind": "theorem", "title": "Түзету реті", "body": "<p>Жалпы «тәуекелдің ашық тұрған уақыты» Σ R<sub>f</sub>·C<sub>f</sub> (C<sub>f</sub> - f-тің түзетілу уақыты) минималды болатын рет - R<sub>f</sub>/c<sub>f</sub> кемуі бойынша.</p>"},
        {"kind": "proof", "title": "Дәлелдеу", "body": "<p>Бұл s04 l05-тегі салмақталған аяқталу уақыты есебі: салмақ w = R<sub>f</sub>, ұзақтық d = c<sub>f</sub>. Көрші екі табылған f, g (f бірінші) үшін R<sub>f</sub>/c<sub>f</sub> &lt; R<sub>g</sub>/c<sub>g</sub> болса, оларды ауыстыру жалпы шамаға R<sub>g</sub>c<sub>f</sub> − R<sub>f</sub>c<sub>g</sub> &gt; 0 үнем береді (алмастыру аргументі); сондықтан оңтайлы ретте ешбір көрші жұп бұл шартты бұзбайды - рет R/c кемуі бойынша. ∎ Түсіндірме: теорема «ең қауіптіні бірінші» деген интуицияны нақтылайды - арзан түзетілетін орташа қауіп қымбат түзетілетін жоғары қауіптен бұрын болуы мүмкін. Бірақ «шұғыл» деңгейдегілер (белсенді шабуыл) ретке қарамай бірден жабылады.</p>"},
        {"kind": "note", "title": "Шолу есебі", "body": "<p>Ауқым (не тексерілді, не тексерілмеді); әдіс (қауіп моделі, код шолуы, автоматты сканерлер, тест); әр табылған: сипаттама, қайталау қадамдары (өз ортасында), тәуекел, ұсынылған түзету; STRIDE қамтылуы - қай санат мүлде тексерілмеді; түзету жоспары (басымдық реті, иелері). Есеп кінә іздемейді (s03 l09) - жүйені жақсартады.</p>"},
    ],
    "visual": {"lab": "pyrun", "code": REVIEW, "stdin": "",
               "caption": "Тәуекел бойынша ең жоғарысы IDOR (20), бірақ басымдықта тәуекел/күн шешеді: бір күндік түзетулер жоғары тұр, үш күндік құпиясөз көші-қоны кейінірек. STRIDE-тің R (бас тарту) мен D (қызметтен бас тарту) санаттары тексерілмеген - есепте бұл ашық айтылады."},
    "derivation": [
        "Ауқымды бекіту және қауіп моделін жаңарту (1-сабақ).",
        "Әр санатты тексеру: аутентификация, инъекциялар, CSRF, қолжетімділік, криптография, тәуелділіктер.",
        "Әр табылғанға тәуекел (p × i) және түзету құнын беру.",
        "Түзету ретін R/c кемуі бойынша құру; шұғылдарын бірден.",
        "Есепті жазу: STRIDE қамтылуы, тексерілмегендер, түзету жоспары мен иелері.",
    ],
    "examples": [
        {"title": "Шолу чек-тізімін кодпен тексеру", "lang": "python",
         "code": "app = {\n    'cookie_flags': {'HttpOnly', 'Secure', 'SameSite=Lax'},\n    'password_hash': 'pbkdf2_sha256$600000',\n    'csp': None,\n    'sql_params': True,\n    'lockfile_hashes': True,\n}\nchecks = [\n    ('cookie: HttpOnly, Secure, SameSite', {'HttpOnly', 'Secure'} <= app['cookie_flags'] and any(f.startswith('SameSite') for f in app['cookie_flags'])),\n    ('құпиясөз: баяу хэш, ≥ 600k итерация', app['password_hash'].startswith('pbkdf2') and int(app['password_hash'].split('$')[1]) >= 600000),\n    ('CSP тақырыбы бар', app['csp'] is not None),\n    ('SQL параметрленген', app['sql_params']),\n    ('lock файлда хэштер', app['lockfile_hashes']),\n]\nfor name, ok in checks:\n    print(('✓' if ok else '✗'), name)\nprint(f'{sum(ok for _, ok in checks)}/{len(checks)} тексерістен өтті')",
         "output": "✓ cookie: HttpOnly, Secure, SameSite\n✓ құпиясөз: баяу хэш, ≥ 600k итерация\n✗ CSP тақырыбы бар\n✓ SQL параметрленген\n✓ lock файлда хэштер\n4/5 тексерістен өтті",
         "explain": "Шолудың бір бөлігін автоматтандыруға болады: баптаулар мен тақырыптар CI-де тексеріледі. Бірақ IDOR сияқты логикалық осалдықтар адамның шолуын (және 7-сабақтағы матрица-тестті) талап етеді."},
    ],
    "experiment": {"lab": "pyrun", "code": REVIEW.replace("('құпиясөз SHA-256 тұзсыз',       2, 5, 3, 'I'),", "('құпиясөз SHA-256 тұзсыз',       2, 5, 3, 'I'),\n    ('логтарда әрекет иесі жоқ',       2, 3, 1, 'R'),\n    ('сұрау жылдамдығына шек жоқ',     3, 3, 1, 'D'),"), "stdin": "",
                   "task": "R мен D санаттарына екі табылған қостық. Басымдық реті қалай өзгерді? STRIDE толық қамтылды ма? Бұл табылғандарды қандай тексеріс тапқан болар еді (логтарды шолу, жүктеме тесті)?"},
    "exercises": [
        {"type": "pycode", "q": "fix_order(findings) - findings: [[атауы, p, i, құн], ...]. Атауларды R/c = p·i/құн кемуі бойынша (тең болса - тәуекел p·i кемуі бойынша, сосын атауы бойынша) тізім етіп қайтарсын.", "mode": "func", "func": "fix_order",
         "starter": "def fix_order(findings):\n    return [f[0] for f in sorted(findings, key=lambda f: -f[1] * f[2])]\n",
         "tests": [{"args": [[["IDOR", 4, 5, 1], ["hash", 2, 5, 3], ["CSP", 2, 3, 2], ["token", 3, 4, 1]]], "expect": ["IDOR", "token", "hash", "CSP"]},
                   {"args": [[["a", 5, 5, 10], ["b", 2, 2, 1]]], "expect": ["b", "a"]}, {"args": [[["x", 2, 3, 1], ["y", 3, 2, 1]]], "expect": ["x", "y"]}],
         "solution": "def fix_order(findings):\n    return [f[0] for f in sorted(findings, key=lambda f: (-(f[1] * f[2]) / f[3], -(f[1] * f[2]), f[0]))]",
         "hints": ["Starter тек тәуекел бойынша сұрыптайды - екінші тестте қате.", "hash: 10/3 = 3.3, CSP: 6/2 = 3."]},
        {"type": "pycode", "q": "stride_gaps(findings_kinds, tested_kinds) - findings_kinds: табылғандардың STRIDE әріптері, tested_kinds: шолуда тексерілген санаттар. {'found': табылған санаттар (сұрыпталған, бірегей), 'untested': STRIDE-тен тексерілмегендер (сұрыпталған)} қайтарсын.", "mode": "func", "func": "stride_gaps",
         "starter": "def stride_gaps(findings_kinds, tested_kinds):\n    return {'found': findings_kinds, 'untested': []}\n",
         "tests": [{"args": [["E", "S", "I", "I"], ["S", "T", "I", "E"]], "expect": {"found": ["E", "I", "S"], "untested": ["D", "R"]}}, {"args": [[], list("STRIDE")], "expect": {"found": [], "untested": []}}],
         "solution": "def stride_gaps(findings_kinds, tested_kinds):\n    return {'found': sorted(set(findings_kinds)), 'untested': sorted(set('STRIDE') - set(tested_kinds))}",
         "hints": ["Табылмаған ≠ тексерілмеген: тексерілген, бірақ таза санат - жақсы нәтиже."]},
        {"type": "mc", "q": "Бөгде сайтта (рұқсатсыз) осалдық байқадыңыз. Дұрыс әрекет қайсы?", "options": ["Әлеуметтік желіде бірден жариялау.", "Тереңірек тексеріп, деректерді жүктеп алу.", "Тексеруді тоқтатып, иесіне жауапты ашу арнасы (security.txt, bug bounty) арқылы жария етпей хабарлау.", "Ештеңе істемеу және ешкімге айтпау."],
         "answer": 2, "why": ["Пайдаланушыларға зиян келтіреді.", "Рұқсатсыз қолжетімділік - заң бұзушылық.", "Дұрыс: жауапты ашу.", "Осалдық басқаларға зиян келтіруі мүмкін."], "hints": ["Рұқсат пен жауапкершілік."]},
    ],
    "reasoning": "<p>s06 модулі веб қауіпсіздігін бір қағидаға жинады: дерек пен кодты, сенімді мен сенімсізді ажырат. Әр сабақ оның бір көрінісін дәлелмен бекітті: шабуыл ағашы (1), тұздың бағасы (2), MAC-тың бірігу шегі (3), параметрлеудің құрылымды бекітуі (4), экрандаудың контекстен шығармауы (5), CSRF токенінің кездейсоқтығы (6), әдепкі бас тартудың логикасы (7), XOR-дың алгебрасы (8), BFS толықтығы (9). Шолу (10) оларды тәуекел мен құнға аударып, Смит ережесімен ретке қояды - қауіпсіздік инженериясы осылай шешім қабылдау пәніне айналады.</p>",
    "mistakes": [
        {"mistake": "Шолу есебін тек табылғандар тізімімен шектеу.", "why": "Не тексерілмегені белгісіз - жалған сенімділік.", "fix": "Ауқым, әдіс және STRIDE қамтылуы ашық жазылады."},
        {"mistake": "Бөгде жүйені рұқсатсыз «тексеру».", "why": "Заң бұзушылық және иелеріне зиян.", "fix": "Тек өз жүйеңіз, оқу ортасы не ресми bug bounty; табылғанды жауапты ашу."},
    ],
    "assessment": [
        {"type": "pycode", "q": "review_summary(findings) - findings: [[атауы, p, i, құн, STRIDE әрпі], ...]. {'critical': тәуекелі ≥ 15 атаулар (сұрыпталған), 'order': fix_order ережесімен рет, 'days': барлық түзетудің жалпы күні} қайтарсын.", "mode": "func", "func": "review_summary",
         "starter": "def review_summary(findings):\n    return {'critical': [], 'order': [f[0] for f in findings], 'days': 0}\n",
         "tests": [{"args": [[["IDOR", 4, 5, 1, "E"], ["hash", 2, 5, 3, "I"], ["CSP", 2, 3, 2, "T"], ["token", 3, 4, 1, "S"]]], "expect": {"critical": ["IDOR"], "order": ["IDOR", "token", "hash", "CSP"], "days": 7}},
                   {"args": [[["a", 1, 1, 1, "D"]]], "expect": {"critical": [], "order": ["a"], "days": 1}}],
         "solution": "def review_summary(findings):\n    order = [f[0] for f in sorted(findings, key=lambda f: (-(f[1] * f[2]) / f[3], -(f[1] * f[2]), f[0]))]\n    return {'critical': sorted(f[0] for f in findings if f[1] * f[2] >= 15), 'order': order, 'days': sum(f[3] for f in findings)}",
         "hints": ["fix_order ережесін қайта қолданыңыз."]},
        {"type": "mc", "q": "Түзету реті теоремасы қай бұрынғы нәтижеге сүйенеді?", "options": ["s04 l05-тегі Смит ережесі (алмастыру аргументі).", "CAP теоремасы.", "Литтл заңы.", "Каталан сандары."],
         "answer": 0, "why": ["Дұрыс: w = R, d = c.", "Қатысы жоқ.", "Қатысы жоқ.", "Қатысы жоқ."], "hints": ["Салмақталған аяқталу уақыты."]},
    ],
    "project": {
        "title": "Өз веб-қосымшаңыздың қауіпсіздік шолуы",
        "statement": "Өзіңіз жазған веб-қосымшаның (мысалы, CS50 Flask тапсырмасы не s01-дегі жоба) толық қауіпсіздік шолуын жасап, табылған осалдықтарды түзетіңіз. Барлық тексеріс тек өз кодыңызда және өз жергілікті ортаңызда.",
        "requirements": ["Қауіп моделі: активтер, сенім шекаралары, STRIDE кестесі, кемінде бір шабуыл ағашы.", "Құпиясөздер мен токендер: баяу тұзды хэш, HMAC/сессия, мерзім, тұрақты уақытты салыстыру.", "Инъекциялар: барлық SQL параметрленген (find_unsafe тәрізді тексеріс CI-де), шаблонда автоматты экрандау, CSP.", "CSRF токені және SameSite cookie; CORS allowlist.", "Қолжетімділік матрицасы-тест (әр рөл × әрекет).", "Тәуелділіктер: lock файл, хэштер, осалдық сканері және ең қысқа жол есебі."],
        "milestones": ["1-апта: қауіп моделі және шолу жоспары.", "2-апта: аутентификация, инъекциялар.", "3-апта: CSRF, қолжетімділік, тәуелділіктер.", "4-апта: түзетулер, есеп, қорғау."],
        "acceptance": ["Әр табылғанның қайталау тесті түзетуге дейін құлап, кейін өтеді.", "Есепте STRIDE қамтылуы мен тексерілмеген аймақтар ашық көрсетілген.", "Түзету реті тәуекел/құн бойынша негізделген."],
        "rubric": ["Қауіп моделінің толықтығы - 20%.", "Табылғандардың сапасы мен қайталанатындығы - 25%.", "Түзетулердің дұрыстығы және тесттер - 30%.", "Есеп және басымдық - 15%.", "Этика және ауқымды сақтау - 10%."],
    },
    "reflection": ["Бұл модульден кейін сіз жазған кодқа қарай қалай өзгердіңіз? Ең алдымен қай әдетіңізді өзгертер едіңіз?"],
    "further": {"honors": ["OWASP ASVS (Application Security Verification Standard) 1-деңгейінің талаптарымен өз жобаңызды салыстырып, сәйкессіздіктер кестесін жасаңыз."],
                "research": ["Bug bounty бағдарламалары мен жауапты ашу саясаттары (ISO/IEC 29147): компаниялар зерттеушілерді заң тұрғысынан қалай қорғайды (safe harbor)?"]},
    "references": REFS + ["OWASP Application Security Verification Standard (ASVS) 4.0.", "ISO/IEC 29147:2018, Vulnerability disclosure."],
}

LESSONS = [L06, L07, L08, L09, L10]
