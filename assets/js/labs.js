// CS50 қазақша — интерактив зертханалар: визуализациялар, флэш-карточкалар,
// күннің сұрағы, аралас тест. main.js керек беттерде ғана жүктейді.

(function () {
  const K = window.CS50KZ;
  const esc = K.escapeHtml;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const store = {
    get(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch (e) { return def; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} },
  };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ================= Сұрыптау визуализациясы =================
  function* selectionSort(a) {
    const n = a.length;
    for (let i = 0; i < n; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        yield { type: "compare", i: min, j };
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; yield { type: "swap", i, j: min }; }
      yield { type: "sorted", idx: [i] };
    }
  }
  function* bubbleSort(a) {
    const n = a.length;
    for (let end = n - 1; end > 0; end--) {
      let swapped = false;
      for (let j = 0; j < end; j++) {
        yield { type: "compare", i: j, j: j + 1 };
        if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swapped = true; yield { type: "swap", i: j, j: j + 1 }; }
      }
      yield { type: "sorted", idx: [end] };
      if (!swapped) { yield { type: "sorted", idx: [...Array(end).keys()] }; return; }
    }
    yield { type: "sorted", idx: [0] };
  }
  function* mergeSort(a) {
    const n = a.length;
    for (let width = 1; width < n; width *= 2) {
      for (let lo = 0; lo < n; lo += 2 * width) {
        const mid = Math.min(lo + width, n), hi = Math.min(lo + 2 * width, n);
        const left = a.slice(lo, mid), right = a.slice(mid, hi);
        let i = 0, j = 0, k = lo;
        while (i < left.length && j < right.length) {
          yield { type: "compare", i: lo + i, j: mid + j };
          a[k] = left[i] <= right[j] ? left[i++] : right[j++];
          yield { type: "set", i: k++ };
        }
        while (i < left.length) { a[k] = left[i++]; yield { type: "set", i: k++ }; }
        while (j < right.length) { a[k] = right[j++]; yield { type: "set", i: k++ }; }
      }
    }
    yield { type: "sorted", idx: [...Array(n).keys()] };
  }
  const SORTS = {
    selection: { name: "Таңдау арқылы", fn: selectionSort, big: "O(n²)", note: "Әр айналымда ең кішісін тауып, алдыңғы орынға қояды." },
    bubble: { name: "Көпіршікті", fn: bubbleSort, big: "O(n²) · Ω(n)", note: "Көрші жұптарды салыстырып, үлкенін оңға «көпіршітеді». Ауыстыру болмаса, ерте тоқтайды." },
    merge: { name: "Біріктіру арқылы", fn: mergeSort, big: "O(n log n)", note: "Жартыларды сұрыптап, сосын біріктіреді. Мұнда төменнен жоғары (итеративті) нұсқасы." },
  };

  function vizSort(el) {
    el.innerHTML = `
      <div class="viz-head"><b>Сұрыптау визуализациясы</b><span class="viz-big"></span></div>
      <div class="viz-controls">
        <div class="seg viz-algo">${Object.entries(SORTS).map(([k, s], i) => `<button type="button" data-k="${k}" class="${i ? "" : "on"}">${s.name}</button>`).join("")}</div>
        <div class="seg viz-data"><button type="button" data-d="random" class="on">Кездейсоқ</button><button type="button" data-d="reversed">Кері ретпен</button><button type="button" data-d="sorted">Сұрыпталған</button></div>
      </div>
      <div class="viz-bars" aria-hidden="true"></div>
      <p class="viz-note"></p>
      <div class="viz-controls">
        <button type="button" class="btn gold viz-play">▶ Бастау</button>
        <button type="button" class="btn secondary viz-step">Қадам</button>
        <label class="viz-speed">Жылдамдық <input type="range" min="1" max="10" value="6"></label>
        <span class="viz-stats">Салыстыру: <b class="c">0</b> · Жазу/ауыстыру: <b class="s">0</b></span>
      </div>`;
    const barsEl = el.querySelector(".viz-bars");
    const N = window.innerWidth < 560 ? 16 : 24;
    let algo = "selection", data = "random", arr, gen, timer = null, comps = 0, swaps = 0, sorted = new Set();
    const speed = el.querySelector(".viz-speed input");

    const reset = () => {
      stop();
      arr = Array.from({ length: N }, (_, i) => Math.round(((i + 1) / N) * 100));
      if (data === "random") shuffle(arr);
      if (data === "reversed") arr.reverse();
      gen = SORTS[algo].fn(arr.slice());
      gen.arr = null;
      comps = swaps = 0; sorted = new Set();
      el.querySelector(".viz-big").textContent = SORTS[algo].big;
      el.querySelector(".viz-note").textContent = SORTS[algo].note;
      draw();
    };
    // Генератор өз көшірмесімен жұмыс істейді, біз оны көрсету үшін қайталаймыз
    let shadow;
    const draw = (hl = {}) => {
      const a = shadow || arr;
      barsEl.innerHTML = a.map((v, i) => {
        let cls = sorted.has(i) ? "sorted" : "";
        if (hl.compare && hl.compare.includes(i)) cls = "compare";
        if (hl.swap && hl.swap.includes(i)) cls = "swap";
        return `<i class="${cls}" style="height:${v}%"></i>`;
      }).join("");
      el.querySelector(".c").textContent = comps;
      el.querySelector(".s").textContent = swaps;
    };
    const step = () => {
      if (!shadow) { shadow = arr.slice(); gen = SORTS[algo].fn(shadow); }
      const r = gen.next();
      if (r.done) { stop(); el.querySelector(".viz-play").textContent = "↺ Қайта"; done = true; draw(); return false; }
      const s = r.value;
      if (s.type === "compare") { comps++; draw({ compare: [s.i, s.j] }); }
      else if (s.type === "swap") { swaps++; draw({ swap: [s.i, s.j] }); }
      else if (s.type === "set") { swaps++; draw({ swap: [s.i] }); }
      else { s.idx.forEach((i) => sorted.add(i)); draw(); }
      return true;
    };
    let done = false;
    const delay = () => [600, 400, 260, 170, 110, 70, 40, 22, 10, 3][speed.value - 1];
    const play = async () => {
      if (done) { full(); }
      if (timer) { stop(); return; }
      el.querySelector(".viz-play").textContent = "⏸ Тоқтату";
      timer = true;
      while (timer && step()) await sleep(delay());
    };
    const stop = () => { timer = null; const b = el.querySelector(".viz-play"); if (b && !done) b.textContent = "▶ Жалғастыру"; };
    const full = () => { done = false; shadow = null; reset(); el.querySelector(".viz-play").textContent = "▶ Бастау"; };

    el.querySelector(".viz-algo").addEventListener("click", (e) => {
      if (!e.target.dataset.k) return;
      el.querySelectorAll(".viz-algo button").forEach((b) => b.classList.toggle("on", b === e.target));
      algo = e.target.dataset.k; full();
    });
    el.querySelector(".viz-data").addEventListener("click", (e) => {
      if (!e.target.dataset.d) return;
      el.querySelectorAll(".viz-data button").forEach((b) => b.classList.toggle("on", b === e.target));
      data = e.target.dataset.d; full();
    });
    el.querySelector(".viz-play").addEventListener("click", play);
    el.querySelector(".viz-step").addEventListener("click", () => { if (done) full(); stop(); step(); });
    full();
  }

  // ================= Сызықтық vs екілік іздеу =================
  function vizSearch(el) {
    const N = 32;
    let arr = [];
    const make = () => {
      const set = new Set();
      while (set.size < N) set.add(1 + Math.floor(Math.random() * 99));
      arr = [...set].sort((a, b) => a - b);
    };
    el.innerHTML = `
      <div class="viz-head"><b>Сызықтық және екілік іздеу</b><span class="viz-big">O(n) vs O(log n)</span></div>
      <p class="viz-note">Сұрыпталған ${N} сан. Қай санды іздейміз? Екі алгоритм қатар жұмыс істейді: қайсысы аз қадам жасайды?</p>
      <div class="viz-controls">
        <input class="viz-input" type="number" min="1" max="99" placeholder="Сан" aria-label="Іздейтін сан">
        <button type="button" class="btn gold viz-go">⌕ Іздеу</button>
        <button type="button" class="btn secondary viz-new">Жаңа сандар</button>
      </div>
      <div class="viz-row"><span>Сызықтық</span><div class="viz-cells lin"></div><b class="lin-n">—</b></div>
      <div class="viz-row"><span>Екілік</span><div class="viz-cells bin"></div><b class="bin-n">—</b></div>
      <p class="viz-result"></p>`;
    const draw = () => ["lin", "bin"].forEach((k) => {
      el.querySelector(".viz-cells." + k).innerHTML = arr.map((v) => `<i>${v}</i>`).join("");
    });
    const mark = (k, i, cls) => el.querySelectorAll(`.viz-cells.${k} i`)[i]?.classList.add(cls);
    let running = false;
    async function go() {
      if (running) return;
      const input = el.querySelector(".viz-input");
      let target = parseInt(input.value, 10);
      if (!(target >= 1 && target <= 99)) { target = arr[Math.floor(Math.random() * N)]; input.value = target; }
      running = true; draw();
      let ls = 0, bs = 0, lf = -1, bf = -1, li = 0, lo = 0, hi = N - 1, ldone = false, bdone = false;
      el.querySelector(".viz-result").textContent = "";
      while (!ldone || !bdone) {
        if (!ldone) {
          ls++; mark("lin", li, "look");
          if (arr[li] === target) { lf = li; ldone = true; mark("lin", li, "found"); }
          else if (++li >= N) ldone = true;
        }
        if (!bdone) {
          if (lo > hi) bdone = true;
          else {
            const mid = (lo + hi) >> 1; bs++;
            el.querySelectorAll(".viz-cells.bin i").forEach((c, i) => c.classList.toggle("out", i < lo || i > hi));
            mark("bin", mid, "look");
            if (arr[mid] === target) { bf = mid; bdone = true; mark("bin", mid, "found"); }
            else if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;
          }
        }
        el.querySelector(".lin-n").textContent = ls + " қадам";
        el.querySelector(".bin-n").textContent = bs + " қадам";
        await sleep(260);
      }
      el.querySelector(".viz-result").innerHTML = lf >= 0
        ? `<b>${target}</b> табылды. Сызықтық іздеу — <b>${ls}</b> қадам, екілік іздеу — <b>${bs}</b> қадам. ${N} элементте екілік іздеу ең көбі log₂${N} ≈ ${Math.ceil(Math.log2(N + 1))} қадам жасайды.`
        : `<b>${target}</b> массивте жоқ. Сызықтық іздеу бәрін тексерді (<b>${ls}</b> қадам), екілік іздеу <b>${bs}</b> қадамда «жоқ» деп білді.`;
      running = false;
    }
    el.querySelector(".viz-go").addEventListener("click", go);
    el.querySelector(".viz-input").addEventListener("keydown", (e) => e.key === "Enter" && go());
    el.querySelector(".viz-new").addEventListener("click", () => { if (!running) { make(); draw(); el.querySelector(".lin-n").textContent = el.querySelector(".bin-n").textContent = "—"; el.querySelector(".viz-result").textContent = ""; } });
    make(); draw();
  }

  // ================= Байланысқан тізім =================
  function vizList(el) {
    let list = [1, 2, 3], busy = false;
    el.innerHTML = `
      <div class="viz-head"><b>Байланысқан тізім</b><span class="viz-big">node *list</span></div>
      <p class="viz-note">Әр түйінде сан (<code>number</code>) және келесі түйінге көрсеткіш (<code>next</code>) бар. Басына қосу — O(1), соңына қосу мен іздеу — O(n).</p>
      <div class="viz-controls">
        <input class="viz-input" type="number" min="0" max="999" placeholder="Сан" aria-label="Сан">
        <button type="button" class="btn secondary" data-op="head">Басына қосу</button>
        <button type="button" class="btn secondary" data-op="tail">Соңына қосу</button>
        <button type="button" class="btn secondary" data-op="sorted">Ретімен қосу</button>
        <button type="button" class="btn secondary" data-op="find">Іздеу</button>
        <button type="button" class="btn secondary" data-op="del">Өшіру</button>
      </div>
      <div class="viz-list"></div>
      <pre class="viz-code"></pre>`;
    const box = el.querySelector(".viz-list");
    const code = el.querySelector(".viz-code");
    const draw = (hl = -1, cls = "look", fresh = -1) => {
      box.innerHTML = `<span class="ptr">list</span><span class="arrow">→</span>` +
        list.map((v, i) => `<span class="node ${i === hl ? cls : ""} ${i === fresh ? "fresh" : ""}"><b>${v}</b><small>next</small></span><span class="arrow">→</span>`).join("") +
        `<span class="null">NULL</span>`;
    };
    const walk = async (upto, stopIf) => {
      for (let i = 0; i < upto; i++) {
        draw(i);
        await sleep(380);
        if (stopIf && stopIf(i)) return i;
      }
      return -1;
    };
    const CODE = {
      head: "node *n = malloc(sizeof(node));\nn->number = X;\nn->next = list;   // жаңа түйін бұрынғы басқа сілтейді\nlist = n;         // енді ол — тізімнің басы",
      tail: "for (node *ptr = list; ptr != NULL; ptr = ptr->next)\n{\n    if (ptr->next == NULL)   // соңғы түйінді таптық\n    {\n        ptr->next = n;\n        break;\n    }\n}",
      sorted: "// X-тен үлкен бірінші түйіннің алдына кірістіреміз\nfor (node *ptr = list; ptr != NULL; ptr = ptr->next)\n{\n    if (ptr->next == NULL || n->number < ptr->next->number)\n    {\n        n->next = ptr->next;\n        ptr->next = n;\n        break;\n    }\n}",
      find: "for (node *ptr = list; ptr != NULL; ptr = ptr->next)\n{\n    if (ptr->number == X)\n    {\n        return true;\n    }\n}\nreturn false;",
      del: "// алдыңғы түйін өшірілетін түйінді «аттап» өтеді\nprev->next = ptr->next;\nfree(ptr);",
    };
    el.querySelector(".viz-controls").addEventListener("click", async (e) => {
      const op = e.target.dataset.op;
      if (!op || busy) return;
      const input = el.querySelector(".viz-input");
      let x = parseInt(input.value, 10);
      if (Number.isNaN(x)) x = op === "find" || op === "del" ? list[Math.floor(Math.random() * list.length)] ?? 1 : Math.floor(Math.random() * 50);
      busy = true;
      code.textContent = CODE[op].replace(/X/g, x);
      if (op === "head") { list.unshift(x); draw(-1, "", 0); }
      else if (op === "tail") { await walk(list.length); list.push(x); draw(-1, "", list.length - 1); }
      else if (op === "sorted") {
        let i = 0; while (i < list.length && list[i] < x) { draw(i); await sleep(380); i++; }
        list.splice(i, 0, x); draw(-1, "", i);
      } else if (op === "find" || op === "del") {
        const at = await walk(list.length, (i) => list[i] === x);
        if (at < 0) { draw(); code.textContent += `\n\n// ${x} тізімде жоқ`; }
        else if (op === "find") draw(at, "found");
        else { draw(at, "gone"); await sleep(500); list.splice(at, 1); draw(); }
      }
      input.value = "";
      busy = false;
    });
    draw();
    code.textContent = "typedef struct node\n{\n    int number;\n    struct node *next;\n}\nnode;";
  }

  // ================= Флэш-карточкалар (Лейтнер жүйесі) =================
  async function flashcards(el) {
    await K.loadScript("assets/data/glossary.js");
    const cards = window.CS50KZ_GLOSSARY || [];
    const KEY = "cs50kz:cards";
    let boxes = store.get(KEY, {});
    let dir = "kz", deck = [], cur = 0, flipped = false;
    el.innerHTML = `
      <div class="fc-top">
        <div class="seg fc-dir"><button type="button" data-d="kz" class="on">Қазақша → English</button><button type="button" data-d="en">English → Қазақша</button></div>
        <span class="fc-progress"></span>
      </div>
      <div class="fc-mastery"><span></span></div>
      <button type="button" class="fc-card" aria-live="polite"><span class="fc-face"></span><span class="fc-hint">Аудару үшін басыңыз немесе <kbd>Space</kbd></span></button>
      <div class="fc-actions">
        <button type="button" class="btn secondary fc-no">✗ Білмедім <kbd>1</kbd></button>
        <button type="button" class="btn gold fc-yes">✓ Білемін <kbd>2</kbd></button>
      </div>
      <p class="fc-src"></p>`;
    const face = el.querySelector(".fc-face"), card = el.querySelector(".fc-card");
    const mastered = () => cards.filter((c) => (boxes[c.en] || 0) >= 3).length;
    const newDeck = () => {
      // Аз білетін карточкалар бірінші: қорап нөмірі кіші болса, жиі шығады
      deck = shuffle(cards.slice()).sort((a, b) => (boxes[a.en] || 0) - (boxes[b.en] || 0)).slice(0, 20);
      cur = 0; show();
    };
    const show = () => {
      const c = deck[cur];
      flipped = false;
      card.classList.remove("flipped");
      face.innerHTML = `<b>${esc(dir === "kz" ? c.kz : c.en)}</b>`;
      el.querySelector(".fc-progress").textContent = `${cur + 1} / ${deck.length} · Меңгерілді: ${mastered()} / ${cards.length}`;
      el.querySelector(".fc-mastery span").style.width = (mastered() / cards.length) * 100 + "%";
      el.querySelector(".fc-src").innerHTML = "";
    };
    const flip = () => {
      const c = deck[cur];
      flipped = !flipped;
      card.classList.toggle("flipped", flipped);
      face.innerHTML = flipped
        ? `<small>${esc(dir === "kz" ? c.kz : c.en)}</small><b>${esc(dir === "kz" ? c.en : c.kz)}</b>`
        : `<b>${esc(dir === "kz" ? c.kz : c.en)}</b>`;
      el.querySelector(".fc-src").innerHTML = flipped ? `Түсіндірмесі: <a href="${K.ROOT_URL + c.url}">${esc(c.src)} →</a>` : "";
    };
    const answer = (ok) => {
      const c = deck[cur];
      boxes[c.en] = ok ? Math.min(5, (boxes[c.en] || 0) + 1) : 0;
      store.set(KEY, boxes);
      if (++cur >= deck.length) {
        K.celebrate();
        el.querySelector(".fc-card").innerHTML = `<span class="fc-face"><b>Жарайсыз! 🎉</b><small>20 карточка қайталанды. Меңгерілген: ${mastered()} / ${cards.length}</small></span><span class="fc-hint">Жаңа жиынтық үшін басыңыз</span>`;
        card.onclick = () => { card.innerHTML = '<span class="fc-face"></span><span class="fc-hint">Аудару үшін басыңыз немесе <kbd>Space</kbd></span>'; card.onclick = null; location.reload(); };
        return;
      }
      show();
    };
    card.addEventListener("click", () => { if (!card.onclick) flip(); });
    el.querySelector(".fc-no").addEventListener("click", () => answer(false));
    el.querySelector(".fc-yes").addEventListener("click", () => answer(true));
    el.querySelector(".fc-dir").addEventListener("click", (e) => {
      if (!e.target.dataset.d) return;
      dir = e.target.dataset.d;
      el.querySelectorAll(".fc-dir button").forEach((b) => b.classList.toggle("on", b === e.target));
      show();
    });
    document.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === " ") { e.preventDefault(); flip(); }
      if (e.key === "1") answer(false);
      if (e.key === "2") answer(true);
    });
    newDeck();
  }

  // ================= Тест сұрағын көрсету (ортақ) =================
  function renderQuestion(box, q, onAnswer) {
    box.innerHTML = `
      <p class="mq-q">${q.q}</p>
      <div class="mq-opts">${q.o.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join("")}</div>
      <div class="mq-explain" hidden></div>`;
    box.querySelector(".mq-opts").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || box.dataset.done) return;
      box.dataset.done = 1;
      const i = +b.dataset.i, ok = i === q.a;
      box.querySelectorAll(".mq-opts button").forEach((x, j) => { x.disabled = true; if (j === q.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      const ex = box.querySelector(".mq-explain");
      ex.hidden = false;
      ex.innerHTML = `<b>${ok ? "Дұрыс! ✓" : "Қате ✗"}</b> ${q.e} <a href="${K.ROOT_URL + q.u}">${esc(q.l)} →</a>`;
      onAnswer(ok);
    });
  }

  // ================= Күннің сұрағы + стрик =================
  async function daily(el) {
    await K.loadScript("assets/data/quiz.js");
    const pool = window.CS50KZ_QUIZ || [];
    if (!pool.length) return;
    const q = pool[(dayNumber() * 37) % pool.length];
    const st = store.get("cs50kz:daily", { day: null, ok: null, streak: 0, best: 0, last: null });
    const yesterday = (() => { const d = new Date(Date.now() - 86400000); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; })();
    const alive = st.last === today() || st.last === yesterday;
    const streak = alive ? st.streak : 0;
    el.innerHTML = `
      <div class="daily-head">
        <div><span class="daily-kicker">Күннің сұрағы</span><small>${esc(q.l)}</small></div>
        <div class="streak" title="Қатарынан күндер">🔥 <b>${streak}</b> <small>күн</small></div>
      </div>
      <div class="daily-q"></div>
      <div class="daily-foot"><a href="${K.ROOT_URL}practice.html">Аралас тест →</a><a href="${K.ROOT_URL}flashcards.html">Флэш-карточкалар →</a></div>`;
    const box = el.querySelector(".daily-q");
    renderQuestion(box, q, (ok) => {
      if (st.day !== today()) {
        st.streak = alive ? st.streak + (st.last === today() ? 0 : 1) : 1;
        st.best = Math.max(st.best || 0, st.streak);
        st.last = today(); st.day = today(); st.ok = ok;
        store.set("cs50kz:daily", st);
        el.querySelector(".streak b").textContent = st.streak;
        el.querySelector(".streak").classList.add("bump");
        if (ok) K.celebrate();
      }
    });
    if (st.day === today()) {
      // Бүгін жауап берілген: нәтижені қайта көрсетеміз
      box.querySelectorAll(".mq-opts button")[st.ok ? q.a : (q.a + 1) % q.o.length].click();
    }
  }

  // ================= Аралас тест =================
  async function mixedQuiz(el) {
    await K.loadScript("assets/data/quiz.js");
    await K.loadScript("assets/data/lectures.js");
    const pool = window.CS50KZ_QUIZ || [];
    const lecs = window.CS50KZ_LECTURES || [];
    let qs = [], i = 0, score = 0, from = "all";
    el.innerHTML = `
      <div class="mq-top">
        <label>Тақырып <select class="mq-from"><option value="all">Бүкіл курс (${pool.length} сұрақ)</option>${lecs.map((l) => `<option value="${esc(l.num + ": " + l.title)}">${esc(l.num + ": " + l.title)}</option>`).join("")}</select></label>
        <span class="mq-best"></span>
      </div>
      <div class="mq-bar"><span></span></div>
      <div class="mq-box"></div>
      <div class="mq-next-wrap"><button type="button" class="btn gold mq-next" hidden>Келесі →</button></div>`;
    const box = el.querySelector(".mq-box"), next = el.querySelector(".mq-next");
    const best = store.get("cs50kz:mixed-best", 0);
    el.querySelector(".mq-best").textContent = best ? `Үздік нәтиже: ${best}/10` : "";
    const start = () => {
      const src = from === "all" ? pool : pool.filter((q) => q.l === from);
      qs = shuffle(src.slice()).slice(0, 10);
      i = 0; score = 0; ask();
    };
    const ask = () => {
      next.hidden = true;
      el.querySelector(".mq-bar span").style.width = (i / qs.length) * 100 + "%";
      box.dataset.done = "";
      const head = `<p class="mq-count">Сұрақ ${i + 1} / ${qs.length} · Ұпай: ${score}</p>`;
      const wrap = document.createElement("div");
      renderQuestion(wrap, qs[i], (ok) => { if (ok) score++; next.hidden = false; next.textContent = i + 1 < qs.length ? "Келесі →" : "Нәтижені көру"; });
      box.innerHTML = head;
      box.appendChild(wrap);
    };
    next.addEventListener("click", () => {
      if (++i < qs.length) return ask();
      el.querySelector(".mq-bar span").style.width = "100%";
      next.hidden = true;
      const pct = Math.round((score / qs.length) * 100);
      if (qs.length === 10 && score > store.get("cs50kz:mixed-best", 0)) store.set("cs50kz:mixed-best", score);
      if (pct >= 80) K.celebrate();
      box.innerHTML = `<div class="mq-final"><b>${score} / ${qs.length}</b><p>${pct >= 80 ? "Керемет нәтиже! 🎉" : pct >= 50 ? "Жақсы! Қате кеткен тақырыптарды қайталаңыз." : "Лекцияларды тағы бір оқып шығыңыз, сосын қайталаңыз."}</p><button type="button" class="btn gold mq-again">Қайта бастау</button></div>`;
      box.querySelector(".mq-again").addEventListener("click", start);
    });
    el.querySelector(".mq-from").addEventListener("change", (e) => { from = e.target.value; start(); });
    start();
  }

  const MODULES = { sort: vizSort, search: vizSearch, list: vizList };
  document.querySelectorAll(".viz[data-viz]").forEach((el) => MODULES[el.dataset.viz] && MODULES[el.dataset.viz](el));
  document.querySelectorAll(".flashcards").forEach(flashcards);
  document.querySelectorAll(".daily-card").forEach(daily);
  document.querySelectorAll(".mixed-quiz").forEach(mixedQuiz);
})();
