# © 2026 Sagid Mustafa. All Rights Reserved.
# Abstract Algebra · 3-сабақ: Қалыпты топшалар, фактор-топтар және гомоморфизмдер
from math_lesson_gen import L, D, T, F, REM, ATT, NOTE, P_, X

LESSON = L(
    intro=r"Сағаттың тілі тек $n\bmod12$-ге қарайды: $\mathbb Z$-дан $\mathbb Z_{12}$-ге өту ақпараттың бір бөлігін «ұмытады», бірақ қосуды сақтайды. Амалды сақтайтын бейнелеу - гомоморфизм, ал ол «ұмытатын» бөлік - ядро. Бұл сабақтың басты нәтижесі - бірінші изоморфизм теоремасы: гомоморфизмнің бейнесі топты ядро бойынша «желімдегенде» алынатын фактор-топпен бірдей. Бірақ әр топша бойынша желімдеуге болмайды: қосалқы кластарды көбейту дұрыс анықталуы үшін топша қалыпты болуы тиіс. Бұл сабақта гомоморфизмдердің қасиеттерін, қалыпты топшаның критерийлерін, фактор-топ құрылысын дәлелдеп, $\mathbb Z_m\to\mathbb Z_n$ гомоморфизмдерін толық санаймыз.",
    goals=[
        r"гомоморфизм мен изоморфизмді анықтап, бірлікті, кері элементті және элемент ретін сақтау қасиеттерін дәлелдеу;",
        r"ядро мен бейненің топша екенін, ал гомоморфизмнің инъективтілігі ядроның тривиалдығымен тең күшті екенін дәлелдеу;",
        r"қалыпты топшаны анықтап, критерийін және индексі $2$ топшаның қалыпты екенін дәлелдеу;",
        r"фактор-топты құрып, қосалқы кластарды көбейтудің тек қалыпты топша үшін дұрыс анықталатынын қарсы мысалмен көрсету;",
        r"бірінші изоморфизм теоремасын дәлелдеп, $\mathbb Z/n\mathbb Z\cong\mathbb Z_n$, $GL_2/SL_2\cong\mathbb R^*$ мысалдарында қолдану;",
        r"$\mathbb Z_m\to\mathbb Z_n$ гомоморфизмдерінің саны $\gcd(m,n)$ екенін дәлелдеу.",
    ],
    prereq=r"Топ, элемент реті (1-сабақ). Топша, қосалқы кластар, Лагранж теоремасы, циклдік топтар (2-сабақ). Сызықтық салыстыру және оның шешімдер саны (сандар теориясы, 3-сабақ). Анықтауыштың мультипликативтілігі (сызықтық алгебра).",
    intuition=[
        r"Гомоморфизм $\varphi:G\to H$ - топ кестесін «бұзбай» көшіретін бейнелеу: $\varphi(ab)=\varphi(a)\varphi(b)$. Мысалы $\det(AB)=\det A\det B$ - анықтауыш - матрицалар тобынан $\mathbb R^*$-ке гомоморфизм. $e^{x+y}=e^xe^y$ - экспонента қосуды көбейтуге аударады.",
        r"Ядро $\ker\varphi=\{a:\varphi(a)=e\}$ - $\varphi$ «көрмейтін» элементтер. $\varphi(a)=\varphi(b)\iff a^{-1}b\in\ker\varphi$, демек $\varphi$ бір қосалқы класс $a\ker\varphi$-ның барлық элементтерін бір нүктеге жібереді. Кластар - бейненің нүктелері: $G/\ker\varphi\cong\operatorname{im}\varphi$.",
        r"Қосалқы кластарды көбейтуді $(aN)(bN)=abN$ деп анықтағымыз келеді. Бірақ бұл класс өкілін таңдауға тәуелді болмауы керек. Мұны $N$-ның қалыпты болуы, $gNg^{-1}=N$, қамтамасыз етеді. Абелдік топта бұл әрдайым орындалады, сондықтан $\mathbb Z_{12}/\langle4\rangle$ сияқты фактор-топтарды еркін құрамыз.",
        r"Қарсы мысал: үшбұрыштың $D_3$ тобындағы бір шағылыстырудан тұратын $\{e,s\}$ топшасы - қалыпты емес. Оны бұрумен «түйіндесек», басқа осьтен шағылыстыру шығады. Мұндай топша бойынша кластарды көбейту өкілге тәуелді болып шығады.",
    ],
    theory=[
        D("Гомоморфизм", r"$G$, $H$ - топтар. $\varphi:G\to H$ - [[гомоморфизм|homomorphism]], егер барлық $a,b$ үшін $\varphi(ab)=\varphi(a)\varphi(b)$. Биективті гомоморфизм - [[изоморфизм|isomorphism]], $G\cong H$. [[Ядро|kernel]] $\ker\varphi=\{a\in G:\varphi(a)=e_H\}$, [[бейне|image]] $\operatorname{im}\varphi=\varphi(G)$."),
        T("Гомоморфизм қасиеттері", r"$\varphi:G\to H$ - гомоморфизм. (1) $\varphi(e_G)=e_H$, $\varphi(a^{-1})=\varphi(a)^{-1}$, $\varphi(a^k)=\varphi(a)^k$. (2) $\operatorname{ord}(a)&lt;\infty$ болса, $\operatorname{ord}(\varphi(a))\mid\operatorname{ord}(a)$. (3) $\ker\varphi\le G$, $\operatorname{im}\varphi\le H$. (4) $\varphi$ инъективті $\iff\ker\varphi=\{e_G\}$.", r"(2): изоморфизм элемент ретін дәл сақтайды; сондықтан $\mathbb Z_4\not\cong U(8)$ - бірінде реті $4$ элемент бар, екіншісінде жоқ."),
        D("Қалыпты топша", r"$N\le G$ - [[қалыпты топша|normal subgroup]] ($N\trianglelefteq G$), егер әр $g\in G$ үшін $gNg^{-1}=N$, мұнда $gNg^{-1}=\{gng^{-1}:n\in N\}$. Эквиваленттісі: $gN=Ng$ (сол және оң қосалқы кластар тең)."),
        T("Қалыпты топша критерийлері", r"$N\le G$. (1) $N\trianglelefteq G\iff$ әр $g\in G$, $n\in N$ үшін $gng^{-1}\in N$. (2) $G$ абелдік болса, әр топша қалыпты. (3) $[G:N]=2$ болса, $N\trianglelefteq G$. (4) Кез келген гомоморфизмнің ядросы қалыпты.", r"Қарсы мысал: $D_3$-те $\{e,s\}$ қалыпты емес: $rsr^{-1}=r^2s\ne s$."),
        T("Фактор-топ", r"$N\trianglelefteq G$. Қосалқы кластар жиынында $(aN)(bN)=(ab)N$ амалы дұрыс анықталған (өкілге тәуелсіз), және $G/N$ осы амал бойынша топ: бірлігі $N$, $(aN)^{-1}=a^{-1}N$. $G$ ақырлы болса, $|G/N|=\frac{|G|}{|N|}$. $\pi:G\to G/N$, $a\mapsto aN$ - ядросы $N$ болатын гомоморфизм.", r"[[Фактор-топ|quotient group]]. $N$ қалыпты болмаса, амал өкілге тәуелді болады."),
        T("Бірінші изоморфизм теоремасы", r"$\varphi:G\to H$ - гомоморфизм. Онда $G/\ker\varphi\cong\operatorname{im}\varphi$; изоморфизм $a\ker\varphi\mapsto\varphi(a)$.", r"[[Бірінші изоморфизм теоремасы|first isomorphism theorem]]. Ақырлы $G$ үшін: $|G|=|\ker\varphi|\cdot|\operatorname{im}\varphi|$."),
        T("Циклдік топтардың гомоморфизмдері", r"$\mathbb Z_m\to\mathbb Z_n$ гомоморфизмі $a=\varphi(1)$ мәнімен толық анықталады, $\varphi(k)=ka\bmod n$, және мұндай $a$ дұрыс гомоморфизм береді $\iff ma\equiv0\pmod n$. Гомоморфизмдер саны $\gcd(m,n)$.", r"Мысалы $\mathbb Z_{12}\to\mathbb Z_{18}$: $6$ гомоморфизм; $\mathbb Z_6\to\mathbb Z_5$: тек нөлдік."),
        F("Гомоморфизм", r"\varphi(ab)=\varphi(a)\varphi(b)", r"$\varphi(e)=e$, $\varphi(a^{-1})=\varphi(a)^{-1}$.", r""),
        F("Инъективтілік", r"\ker\varphi=\{e\}\iff\left(\varphi(a)=\varphi(b)\Rightarrow a=b\right)", r"$\varphi(a)=\varphi(b)\iff a^{-1}b\in\ker\varphi$.", r""),
        F("Қалыпты топша", r"N\trianglelefteq G\iff gng^{-1}\in N\ \ \forall g,n", r"Абелдік топта әрдайым.", r""),
        F("Фактор-топ", r"(aN)(bN)=abN,\qquad|G/N|=\frac{|G|}{|N|}", r"$N$ қалыпты.", r""),
        F("Бірінші изоморфизм теоремасы", r"G/\ker\varphi\cong\operatorname{im}\varphi", r"$|G|=|\ker\varphi|\cdot|\operatorname{im}\varphi|$.", r""),
        F("$\\mathbb Z_m\\to\\mathbb Z_n$", r"\#\operatorname{Hom}(\mathbb Z_m,\mathbb Z_n)=\gcd(m,n)", r"$\varphi(1)=a$, $ma\equiv0\pmod n$.", r""),
        REM(r"Бірінші изоморфизм теоремасын қолдану жоспары: $G/N$ қандай топ екенін білу үшін (1) ядросы дәл $N$ болатын $\varphi:G\to H$ гомоморфизмін табыңыз; (2) $\operatorname{im}\varphi$-ді анықтаңыз (көбіне $\varphi$ сюръективті); (3) нәтиже $G/N\cong\operatorname{im}\varphi$. Мысалдар: $\mathbb Z\to\mathbb Z_n$ (қалдық) береді $\mathbb Z/n\mathbb Z\cong\mathbb Z_n$; $\det:GL_2(\mathbb R)\to\mathbb R^*$ береді $GL_2/SL_2\cong\mathbb R^*$; $\mathbb R\to S^1$, $t\mapsto e^{2\pi it}$ береді $\mathbb R/\mathbb Z\cong S^1$ (шеңбер)."),
        ATT(r"(1) Кез келген бейнелеу гомоморфизм емес: $\mathbb Z_{12}\to\mathbb Z_5$, $x\mapsto x\bmod5$ - дұрыс анықталмаған ($0\equiv12$, бірақ $0\bmod5\ne12\bmod5$). Бейнелеу $\mathbb Z_m$ элементтерінде өкілге тәуелсіз болуы тиіс: $\mathbb Z_m\to\mathbb Z_n$, $x\mapsto x\bmod n$ тек $n\mid m$ болғанда дұрыс. (2) $N\trianglelefteq G$ мен $K\trianglelefteq N$ болса да, $K\trianglelefteq G$ шықпайды (қалыптылық транзитивті емес). (3) $\varphi(a)$-ның реті $\operatorname{ord}(a)$-ны бөледі, бірақ оған тең болмауы мүмкін: $\mathbb Z\to\mathbb Z_2$-да $\operatorname{ord}(1)=\infty$, $\operatorname{ord}(\varphi(1))=2$."),
    ],
    derivations=[
        ("гомоморфизм қасиеттері",
         r"Теорема 3.1-ді дәлелдеу.",
         [r"(1) $\varphi(e)=\varphi(ee)=\varphi(e)\varphi(e)$; $\varphi(e)^{-1}$-ге көбейтіп, $e_H=\varphi(e)$. $\varphi(a)\varphi(a^{-1})=\varphi(e)=e_H$, демек $\varphi(a^{-1})=\varphi(a)^{-1}$. $\varphi(a^k)=\varphi(a)^k$ - индукция.",
          r"(2) $n=\operatorname{ord}(a)$: $\varphi(a)^n=\varphi(a^n)=\varphi(e)=e$, Теорема 1.3 (1): $\operatorname{ord}(\varphi(a))\mid n$.",
          r"(3) $a,b\in\ker\varphi$: $\varphi(ab^{-1})=\varphi(a)\varphi(b)^{-1}=e$, демек $ab^{-1}\in\ker\varphi$ (Теорема 2.1). Бейне: $\varphi(a)\varphi(b)^{-1}=\varphi(ab^{-1})\in\operatorname{im}\varphi$.",
          r"(4) $\varphi(a)=\varphi(b)\iff\varphi(a^{-1}b)=e\iff a^{-1}b\in\ker\varphi$. $\ker\varphi=\{e\}$ болса, $a=b$; керісінше, инъективті болса, $\varphi(a)=e=\varphi(e)\Rightarrow a=e$. ∎"]),
        ("қалыпты топша критерийлері",
         r"Теорема 3.2-ні дәлелдеу.",
         [r"(1) $\Rightarrow$ анық. $\Leftarrow$: шарт $gNg^{-1}\subseteq N$ береді; $g^{-1}$ үшін $g^{-1}Ng\subseteq N$, демек $N=g(g^{-1}Ng)g^{-1}\subseteq gNg^{-1}$. Сонымен тең.",
          r"(2) Абелдік: $gng^{-1}=gg^{-1}n=n\in N$.",
          r"(3) $[G:N]=2$: сол жақ кластар - $N$ және $G\setminus N$, оң жақ кластар да $N$ және $G\setminus N$. $g\in N$ болса, $gN=N=Ng$; $g\notin N$ болса, $gN=G\setminus N=Ng$.",
          r"(4) $n\in\ker\varphi$: $\varphi(gng^{-1})=\varphi(g)e\varphi(g)^{-1}=e$, демек $gng^{-1}\in\ker\varphi$. ∎"]),
        ("фактор-топ",
         r"Теорема 3.3-ті дәлелдеу.",
         [r"Дұрыс анықталуы: $aN=a'N$, $bN=b'N$, яғни $a'=an_1$, $b'=bn_2$. Онда $a'b'=an_1bn_2=ab(b^{-1}n_1b)n_2$.",
          r"$N$ қалыпты: $b^{-1}n_1b\in N$, демек $a'b'\in abN$, $a'b'N=abN$.",
          r"Аксиомалар $G$-дан мұраланады: $(aN)(bN)(cN)=abcN$ (ассоциативті), $N\cdot aN=aN$ (бірлік $N=eN$), $aN\cdot a^{-1}N=N$.",
          r"Реті: Лагранж бойынша кластар саны $\frac{|G|}{|N|}$. $\pi(ab)=abN=\pi(a)\pi(b)$, $\ker\pi=\{a:aN=N\}=N$. ∎"]),
        ("бірінші изоморфизм теоремасы",
         r"Теорема 3.4-ті дәлелдеу, $K=\ker\varphi$.",
         [r"$\psi(aK)=\varphi(a)$ дұрыс анықталған: $aK=bK\iff a^{-1}b\in K\iff\varphi(a)=\varphi(b)$ (Теорема 3.1 (4)-тің дәлелі). Бұл тең күштілік инъективтілікті де береді.",
          r"Гомоморфизм: $\psi(aK\cdot bK)=\psi(abK)=\varphi(ab)=\varphi(a)\varphi(b)=\psi(aK)\psi(bK)$.",
          r"Сюръективті $\operatorname{im}\varphi$-ге: әр $\varphi(a)=\psi(aK)$.",
          r"Демек $\psi:G/K\to\operatorname{im}\varphi$ - изоморфизм. ∎ Ақырлы $G$: $\frac{|G|}{|K|}=|\operatorname{im}\varphi|$."]),
        ("$\\mathbb Z_m\\to\\mathbb Z_n$ гомоморфизмдері",
         r"Теорема 3.5-ті дәлелдеу.",
         [r"$\varphi$ гомоморфизм: $\varphi(k)=\varphi(1+\dots+1)=k\varphi(1)=ka$ - $a$ бәрін анықтайды.",
          r"Қажеттілік: $\mathbb Z_m$-да $m\cdot1=0$, демек $\mathbb Z_n$-да $ma=\varphi(0)=0$, яғни $ma\equiv0\pmod n$.",
          r"Жеткіліктілік: $ma\equiv0$ болса, $k\equiv k'\pmod m\Rightarrow ka\equiv k'a\pmod n$ ($(k-k')a$ саны $ma$-ға еселі) - $\varphi$ дұрыс анықталған; $\varphi(k+l)=(k+l)a=\varphi(k)+\varphi(l)$.",
          r"Санау: $ma\equiv0\pmod n$ - сызықтық салыстыру, $\gcd(m,n)\mid0$, шешімдер саны $\gcd(m,n)$ (сандар теориясы, Теорема 3.4). ∎"]),
    ],
    examples=[
        ("Анықтауыш", r"$\det:GL_2(\mathbb R)\to\mathbb R^*$ - ядросы мен бейнесі.",
         [r"$\det(AB)=\det A\det B$ - гомоморфизм.",
          r"$\ker\det=\{A:\det A=1\}=SL_2(\mathbb R)$ - [[арнайы сызықтық топ|special linear group]], қалыпты (Теорема 3.2 (4)).",
          r"Сюръективті: $\det\begin{pmatrix}t&amp;0\\0&amp;1\end{pmatrix}=t$.",
          r"Бірінші изоморфизм теоремасы: $GL_2(\mathbb R)/SL_2(\mathbb R)\cong\mathbb R^*$."],
         r"$GL_2/SL_2\cong\mathbb R^*$."),
        ("$\\mathbb Z_{12}\\to\\mathbb Z_4$", r"$\varphi(x)=x\bmod4$: ядро, бейне, фактор-топ.",
         [r"Дұрыс анықталған, себебі $4\mid12$; $\varphi(x+y)=\varphi(x)+\varphi(y)$.",
          r"$\ker\varphi=\{0,4,8\}=\langle4\rangle$, $\operatorname{im}\varphi=\mathbb Z_4$.",
          r"$\mathbb Z_{12}/\langle4\rangle\cong\mathbb Z_4$; тексеру: $|\mathbb Z_{12}|=3\cdot4$ ✓.",
          r"Фактор-топта $(1+H)+(3+H)=4+H=H$ - бірлік класс."],
         r"$\mathbb Z_{12}/\langle4\rangle\cong\mathbb Z_4$."),
        ("Қалыпты емес топша", r"$D_3=\{e,r,r^2,s,rs,r^2s\}$, $sr=r^{-1}s$. $N=\{e,s\}$.",
         [r"$rsr^{-1}=r(sr^{-1})=r(rs)=r^2s\notin N$ - қалыпты емес.",
          r"Кластар: $rN=\{r,rs\}$, $Nr=\{r,sr\}=\{r,r^2s\}$ - тең емес.",
          r"Көбейту өкілге тәуелді: $N=sN$, бірақ $(eN)(rN)=rN$, ал $(sN)(rN)\ni sr=r^2s$, $r^2sN=\{r^2s,r^2\}\ne rN$.",
          r"Ал $\langle r\rangle=\{e,r,r^2\}$ - индексі $2$, демек қалыпты: $D_3/\langle r\rangle\cong\mathbb Z_2$."],
         r"$\{e,s\}$ қалыпты емес, $\langle r\rangle$ қалыпты."),
        ("Гомоморфизмдерді санау", r"$\mathbb Z_{12}\to\mathbb Z_{18}$ барлық гомоморфизмдер.",
         [r"$\varphi(1)=a$, $12a\equiv0\pmod{18}$.",
          r"$\gcd(12,18)=6$: $2a\equiv0\pmod3$, $a\equiv0\pmod3$.",
          r"$a\in\{0,3,6,9,12,15\}$ - $6$ гомоморфизм.",
          r"Мысалы $a=3$: бейне $\langle3\rangle$ (реті $6$), ядро $\langle6\rangle$ (реті $2$); $12=2\cdot6$ ✓."],
         r"$6$."),
        ("Экспонента", r"$(\mathbb R,+)\to(\mathbb R_{>0},\cdot)$, $x\mapsto e^x$.",
         [r"$e^{x+y}=e^xe^y$ - гомоморфизм.",
          r"$\ker=\{x:e^x=1\}=\{0\}$ - инъективті.",
          r"Сюръективті: $y>0$ үшін $x=\ln y$.",
          r"Демек $(\mathbb R,+)\cong(\mathbb R_{>0},\cdot)$ - логарифм кестелерінің негізі: көбейтуді қосуға аударады."],
         r"Изоморфизм."),
    ],
    mistakes=[
        (r"$x\mapsto x\bmod n$ кез келген $\mathbb Z_m\to\mathbb Z_n$", r"тек $n\mid m$", r"$\mathbb Z_{12}\to\mathbb Z_5$ дұрыс емес."),
        (r"Әр топша бойынша фактор-топ бар", r"тек қалыпты топша", r"$D_3$, $\{e,s\}$."),
        (r"$\operatorname{ord}(\varphi(a))=\operatorname{ord}(a)$", r"бөледі; тек изоморфизмде тең", r"$\mathbb Z\to\mathbb Z_2$."),
        (r"Қалыптылық транзитивті", r"$K\trianglelefteq N\trianglelefteq G\not\Rightarrow K\trianglelefteq G$", r"$D_4$-те мысал бар."),
        (r"$|G/N|=|G|-|N|$", r"$\frac{|G|}{|N|}$", r"Лагранж."),
        (r"Инъективтілікті әр жұп бойынша тексеру", r"тек $\ker\varphi=\{e\}$", r"Теорема 3.1 (4)."),
    ],
    viz=[
        ("graph", "Гомоморфизм exp: қосу → көбейту", {"fns": [{"f": "exp(x)", "label": "eˣ"}, {"f": "exp(a)*exp(x-a)", "label": "eᵃ · eˣ⁻ᵃ", "color": 1, "dash": [5, 4]}], "params": [{"n": "a", "min": -2, "max": 2, "step": 0.1, "v": 1}], "view": [-3, 3, -0.5, 8]},
         r"Екі қисық барлық $a$ үшін дәл бірдей: $e^{a+(x-a)}=e^ae^{x-a}$. Бұл - $\exp:(\mathbb R,+)\to(\mathbb R_{>0},\cdot)$ гомоморфизм екенінің суреті. Ядросы $\{0\}$: тек $x=0$ нүктесінде $e^x=1$ (бірлік)."),
        ("lintrans", "SL₂(ℝ): анықтауыштың ядросы - ауданды сақтайды", {"m": [[2, 0.5], [0, 0.5]]},
         r"$\det\begin{pmatrix}2&amp;0{,}5\\0&amp;0{,}5\end{pmatrix}=1$ - бұл матрица $SL_2(\mathbb R)=\ker\det$-ке тиісті. Тор созылып қисаяды, бірақ әр ұяшықтың ауданы өзгермейді. Анықтауыш $GL_2$-дан $\mathbb R^*$-ке гомоморфизм, ал ауданды сақтайтын түрлендірулер - оның ядросы."),
    ],
    exercises=[
        X("num", "e", "Фактор-топ", r"Есептеңіз.",
          {"items": [{"q": r"$|\mathbb Z_{12}/\langle4\rangle|$", "a": 4, "v": "12 // 3", "hint": r"$|\langle4\rangle|=3$.", "sol": {"steps": [r"$\frac{12}3$."], "ans": r"$4$"}},
                     {"q": r"$\varphi:\mathbb Z_{12}\to\mathbb Z_4$, $x\mapsto x\bmod4$. $|\ker\varphi|$", "a": 3, "v": "len([x for x in range(12) if x % 4 == 0])", "hint": r"$\{0,4,8\}$.", "sol": {"steps": [r"$\frac{12}{4}$ (сюръективті)."], "ans": r"$3$"}}]}),
        X("tf", "e", "Тұжырымдар", r"Бағалаңыз.",
          {"items": [{"q": r"Абелдік топтың әр топшасы қалыпты.", "a": True, "e": r"$gng^{-1}=n$.", "hint": r"Теорема 3.2 (2)."},
                     {"q": r"Индексі $2$ топша қалыпты.", "a": True, "e": r"Сол және оң кластар бірдей.", "hint": r"Теорема 3.2 (3)."},
                     {"q": r"$D_3$-те $\{e,s\}$ қалыпты.", "a": False, "e": r"$rsr^{-1}=r^2s$.", "hint": r"Түйіндесіңіз."}]}),
        X("choice", "e", "Ядро", r"Таңдаңыз.",
          {"items": [{"q": r"$\det:GL_2(\mathbb R)\to\mathbb R^*$ ядросы", "o": [r"$SL_2(\mathbb R)$", r"$\{I\}$", r"$GL_2(\mathbb R)$", r"бос жиын"], "a": 0, "e": r"$\det A=1$.", "hint": r"Бірлік - $1$."}]}),
        X("num", "m", "Гомоморфизмдер саны", r"Табыңыз.",
          {"items": [{"q": r"$\#\operatorname{Hom}(\mathbb Z_{12},\mathbb Z_{18})$", "a": 6, "v": "len([a for a in range(18) if 12*a % 18 == 0])", "hint": r"$\gcd(12,18)$.", "sol": {"steps": [r"$a\in\{0,3,\dots,15\}$."], "ans": r"$6$"}},
                     {"q": r"$\#\operatorname{Hom}(\mathbb Z_6,\mathbb Z_5)$", "a": 1, "v": "len([a for a in range(5) if 6*a % 5 == 0])", "hint": r"$\gcd(6,5)=1$.", "sol": {"steps": [r"Тек нөлдік."], "ans": r"$1$"}}]}),
        X("num", "m", "Гомоморфизм мәндері", r"$\varphi:\mathbb Z\to\mathbb Z_7$, $\varphi(1)=3$.",
          {"items": [{"q": r"$\varphi(10)$", "a": 2, "v": "30 % 7", "hint": r"$\varphi(k)=3k\bmod7$.", "sol": {"steps": [r"$30=4\cdot7+2$."], "ans": r"$2$"}},
                     {"q": r"$|\ker\varphi\cap\{0,1,\dots,20\}|$", "a": 3, "v": "len([k for k in range(21) if 3*k % 7 == 0])", "hint": r"$\ker\varphi=7\mathbb Z$.", "sol": {"steps": [r"$0,7,14$."], "ans": r"$3$"}}]}),
        X("num", "m", "Элемент реті", r"Изоморфизм реттерді сақтайды.",
          {"items": [{"q": r"$\mathbb Z_4$-тағы реті $4$ элементтер саны", "a": 2, "v": "totient(4)", "hint": r"$1$, $3$.", "sol": {"steps": [r"Генераторлар."], "ans": r"$2$"}},
                     {"q": r"$U(8)$-дағы реті $4$ элементтер саны", "a": 0, "v": "len([a for a in [3,5,7] if pow(a,2,8) != 1])", "hint": r"$3^2\equiv5^2\equiv7^2\equiv1$.", "sol": {"steps": [r"Демек $\mathbb Z_4\not\cong U(8)$."], "ans": r"$0$"}}]}),
        X("expr", "m", "Гомоморфизм формуласы", r"$\varphi:\mathbb Z\to\mathbb Z$ гомоморфизм, $\varphi(1)=5$. $\varphi(n)$-ді $n$ арқылы ($n$-ді $x$ деп).",
          {"items": [{"q": r"$\varphi(n)=?$", "a": "5*x", "v": "5*x", "hint": r"$\varphi(n)=n\varphi(1)$.", "sol": {"steps": [r"Индукция және $\varphi(-n)=-\varphi(n)$."], "ans": r"$5n$"}}]}),
        X("match", "m", "Гомоморфизм - нәтиже", r"Сәйкестендіріңіз.",
          {"q": r"Гомоморфизм - бірінші изоморфизм теоремасының нәтижесі.", "pairs": [["ℤ → ℤₙ, қалдық", "ℤ/nℤ ≅ ℤₙ"], ["det: GL₂ → ℝ*", "GL₂/SL₂ ≅ ℝ*"], ["exp: (ℝ, +) → (ℝ>0, ·)", "изоморфизм, ядро {0}"], ["ℤ₁₂ → ℤ₄", "ℤ₁₂/⟨4⟩ ≅ ℤ₄"]],
           "hint": r"Ядро мен бейнені табыңыз.", "sol": {"steps": [r"$G/\ker\varphi\cong\operatorname{im}\varphi$."]}, "e": r"Әр жолда - Теорема 3.4."}),
        X("param", "m", "Параметрлік: гомоморфизм мәні", r"«Жаңа нұсқа» сандарды өзгертеді.",
          {"params": {"m": {"pick": [7, 11, 13]}, "a": {"int": [2, 9]}, "k": {"int": [10, 50]}}, "type": "num",
           "q": r"$\varphi:\mathbb Z\to\mathbb Z_{#{m}}$, $\varphi(1)=#{a}$. $\varphi(#{k})=?$",
           "a": "a*k - m*floor(a*k/m)", "v": "int(a)*int(k) % int(m)",
           "hint": r"$\varphi(k)=k\cdot\varphi(1)\bmod#{m}$.", "sol": {"steps": [r"$#{a*k}=#{m}\cdot#{floor(a*k/m)}+#{a*k - m*floor(a*k/m)}$."], "ans": r"$#{a*k - m*floor(a*k/m)}$"}}),
        X("param", "h", "Параметрлік: ядроның реті", r"«Жаңа нұсқа» сандарды өзгертеді.",
          {"params": {"n": {"pick": [24, 36, 48, 60]}, "m": {"pick": [2, 3, 4, 6, 12]}}, "type": "num",
           "q": r"$\varphi:\mathbb Z_{#{n}}\to\mathbb Z_{#{m}}$, $x\mapsto x\bmod#{m}$. $|\ker\varphi|=?$",
           "a": "n/m", "v": "len([x for x in range(int(n)) if x % int(m) == 0])",
           "hint": r"$#{m}\mid#{n}$, $\varphi$ сюръективті; $|G|=|\ker\varphi|\cdot|\operatorname{im}\varphi|$.", "sol": {"steps": [r"$\frac{#{n}}{#{m}}$."], "ans": r"$#{n/m}$"}}),
        X("order", "h", "Бірінші изоморфизм теоремасының дәлелі", r"Ретке келтіріңіз.",
          {"items": [{"q": r"$\varphi:G\to H$, $K=\ker\varphi$.", "steps": [r"$K$ қалыпты екенін көрсетеміз.", r"$\psi(aK)=\varphi(a)$ анықтаймыз.", r"$aK=bK\iff\varphi(a)=\varphi(b)$: дұрыс анықталған және инъективті.", r"$\psi$ гомоморфизм екенін тексереміз.", r"$\psi$ бейнеге сюръективті: $G/K\cong\operatorname{im}\varphi$."],
                      "hint": r"Теорема 3.4.", "sol": {"ans": r"$G/\ker\varphi\cong\operatorname{im}\varphi$"}}]}),
        X("reveal", "h", "Қадамдық шешім: индексі 2 топша", r"Батырмалармен ашыңыз.",
          {"q": r"$[G:N]=2$ болса, $N\trianglelefteq G$ екенін дәлелдеңіз.",
           "steps": [r"Сол жақ кластар екеу: $N$ және $G\setminus N$ (кластар бөлінеді).",
                     r"Оң жақ кластар да екеу: $N$ және $G\setminus N$.",
                     r"$g\in N$: $gN=N=Ng$. $g\notin N$: $gN\ne N$, демек $gN=G\setminus N$; дәл солай $Ng=G\setminus N$.",
                     r"Сонымен әр $g$ үшін $gN=Ng$."],
           "ans": r"$N$ қалыпты."}),
    ],
    project=dict(
        text=[r"<b>Қолданыс.</b> Гомоморфизмдер мен фактор-топтар - «қажет емес ақпаратты ұмытып», есепті кішірейту әдісі. Хэш-функциялар мен бақылау сомалары ($\mathbb Z\to\mathbb Z_n$) осылай жұмыс істейді. Кристаллографияда кеңістіктік топты трансляциялар бойынша бөлгенде нүктелік топ шығады. Кодтау теориясында сызықтық кодтың синдромы - фактор-топтың элементі.",
              r"<b>Мини-жоба: «Ядро, класс, фактор».</b> $D_3$-ті алмастырулар ретінде құрып, әр топшаның қалыпты екенін тексереміз, $\mathbb Z_{12}/\langle4\rangle$ кестесін құрамыз және $\#\operatorname{Hom}(\mathbb Z_m,\mathbb Z_n)=\gcd(m,n)$ формуласын тексереміз."],
        code=r"""
from math import gcd
from itertools import combinations

def compose(p, q):
    return tuple(p[q[i]] for i in range(len(q)))

def inverse(p):
    inv = [0] * len(p)
    for i, x in enumerate(p):
        inv[x] = i
    return tuple(inv)

e, r, s = (0, 1, 2), (1, 2, 0), (0, 2, 1)
D3 = {e}
frontier = [e]
while frontier:
    x = frontier.pop()
    for g in (r, s):
        y = compose(g, x)
        if y not in D3:
            D3.add(y)
            frontier.append(y)
D3 = sorted(D3)
print("|D3| =", len(D3))

def is_subgroup(H):
    return e in H and all(compose(a, inverse(b)) in H for a in H for b in H)

def is_normal(H):
    return all(compose(compose(g, h), inverse(g)) in H for g in D3 for h in H)

for k in (1, 2, 3, 6):
    for H in combinations(D3, k):
        H = set(H)
        if is_subgroup(H):
            print(f"  реті {k}: қалыпты = {is_normal(H)}")

H = {0, 4, 8}
cosets = sorted({frozenset((a + h) % 12 for h in H) for a in range(12)}, key=min)
print("Z_12/<4> кластары:", [sorted(c) for c in cosets])
print("фактор кестесі:", [[min({(a + b) % 12 for a in c1 for b in c2}) for c2 in cosets] for c1 in cosets])

def homs(m, n):
    return [a for a in range(n) if m * a % n == 0]

ok = all(len(homs(m, n)) == gcd(m, n) for m in range(1, 31) for n in range(1, 31))
print("Hom(Z_m, Z_n) = gcd(m, n), m, n ≤ 30:", ok, " мысал:", homs(12, 18))
""",
        tasks=[r"$D_3$-тің реті $2$ топшалары неше? Олардың ешқайсысы қалыпты емес екенін түсіндіріңіз, ал реті $3$ топша неге қалыпты?",
               r"Фактор кестесі $\mathbb Z_4$-тің қосу кестесімен бірдей екенін тексеріңіз ($0,1,2,3$ кластарын өкілдер арқылы белгілеп).",
               r"<code>homs(12, 18)</code> тізіміндегі әр $a$ үшін ядро мен бейненің реттерін есептеп, $12=|\ker|\cdot|\operatorname{im}|$ екенін тексеріңіз."]),
    summary=[
        (r"Гомоморфизм", r"$\varphi(ab)=\varphi(a)\varphi(b)$", r"$e\mapsto e$, рет бөлінеді"),
        (r"Ядро", r"$\ker\varphi\trianglelefteq G$", r"инъективті $\iff\ker=\{e\}$"),
        (r"Қалыпты топша", r"$gNg^{-1}=N$", r"абелдік, индекс 2, ядро"),
        (r"Фактор-топ", r"$(aN)(bN)=abN$", r"тек $N$ қалыпты"),
        (r"Бірінші изоморфизм", r"$G/\ker\varphi\cong\operatorname{im}\varphi$", r"$|G|=|\ker|\cdot|\operatorname{im}|$"),
        (r"$\operatorname{Hom}(\mathbb Z_m,\mathbb Z_n)$", r"$\gcd(m,n)$ дана", r"$ma\equiv0\pmod n$"),
    ],
    review=[r"Мен гомоморфизмнің негізгі қасиеттерін дәлелдей аламын.",
            r"Мен ядро мен бейненің топша екенін және инъективтілік критерийін дәлелдей аламын.",
            r"Мен қалыпты топшаның критерийлерін дәлелдеп, қалыпты емес топшаның мысалын келтіре аламын.",
            r"Мен фактор-топ амалының дұрыс анықталғанын дәлелдей аламын.",
            r"Мен бірінші изоморфизм теоремасын дәлелдеп, мысалдарда қолдана аламын.",
            r"Мен $\mathbb Z_m\to\mathbb Z_n$ гомоморфизмдерін тауып, санай аламын."],
    quiz=[
        ("Гомоморфизм анықтамасы:", ["φ(ab) = φ(a)φ(b)", "φ(a + b) = φ(a) + b", "φ биекция", "φ(a) = a"], 0, "Амалды сақтайды."),
        ("φ инъективті ⇔", ["ker φ = {e}", "im φ = H", "ker φ = G", "|G| = |H|"], 0, "Теорема 3.1."),
        ("det: GL₂(ℝ) → ℝ* ядросы:", ["SL₂(ℝ)", "{I}", "ℝ*", "диагональ матрицалар"], 0, "det A = 1."),
        ("Қай топша әрдайым қалыпты?", ["индексі 2", "реті 2", "циклдік", "кез келген"], 0, "Теорема 3.2."),
        ("ℤ₁₂/⟨4⟩ ≅", ["ℤ₄", "ℤ₃", "ℤ₁₂", "U(12)"], 0, "Бірінші изоморфизм."),
        ("#Hom(ℤ₁₂, ℤ₁₈) =", ["6", "12", "18", "1"], 0, "gcd(12, 18)."),
        ("D₃-те {e, s}:", ["қалыпты емес", "қалыпты", "ядро", "индексі 2"], 0, "rsr⁻¹ = r²s."),
        ("ℤ₁₂ → ℤ₅, x ↦ x mod 5:", ["дұрыс анықталмаған", "изоморфизм", "сюръективті гомоморфизм", "ядросы {0}"], 0, "5 ∤ 12."),
    ],
)
