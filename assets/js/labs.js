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
    el.querySelector(".viz-play").addEventListener("click", () => { K.mark && K.mark("viz-sort"); play(); });
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
    el.querySelector(".viz-go").addEventListener("click", () => { K.mark && K.mark("viz-search"); go(); });
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
      K.mark && K.mark("viz-list");
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
      K.bump && K.bump("cards");
      K.check && K.check();
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
        K.bump && K.bump("daily");
        store.set("cs50kz:daily", st);
        K.check && K.check();
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
      K.check && K.check();
      if (pct >= 80) K.celebrate();
      box.innerHTML = `<div class="mq-final"><b>${score} / ${qs.length}</b><p>${pct >= 80 ? "Керемет нәтиже! 🎉" : pct >= 50 ? "Жақсы! Қате кеткен тақырыптарды қайталаңыз." : "Лекцияларды тағы бір оқып шығыңыз, сосын қайталаңыз."}</p><button type="button" class="btn gold mq-again">Қайта бастау</button></div>`;
      box.querySelector(".mq-again").addEventListener("click", start);
    });
    el.querySelector(".mq-from").addEventListener("change", (e) => { from = e.target.value; start(); });
    start();
  }

  // ================= Екілік жүйе (0-апта) =================
  function vizBinary(el) {
    const bits = Array(8).fill(0);
    let target = 0;
    el.innerHTML = `
      <div class="viz-head"><b>Екілік жүйе: шамдарды жағыңыз</b><span class="viz-big">8 бит = 1 байт</span></div>
      <p class="viz-note">Әр бит — шам: қосулы (1) не өшік (0). Шамды басып, санды құрастырыңыз. Әр орынның мәні — 2-нің дәрежесі.</p>
      <div class="bin-bits">${[128, 64, 32, 16, 8, 4, 2, 1].map((v, i) => `<button type="button" data-i="${i}"><span class="bulb"></span><b>0</b><small>${v}</small></button>`).join("")}</div>
      <div class="bin-out">
        <div><small>Ондық</small><b class="dec">0</b></div>
        <div><small>Он алтылық</small><b class="hex">0x00</b></div>
        <div><small>ASCII</small><b class="chr">—</b></div>
      </div>
      <div class="viz-controls">
        <span class="bin-goal"></span>
        <button type="button" class="btn secondary bin-new">Жаңа тапсырма</button>
        <button type="button" class="btn secondary bin-clear">Бәрін өшіру</button>
      </div>`;
    const newGoal = () => {
      target = 1 + Math.floor(Math.random() * 126);
      el.querySelector(".bin-goal").innerHTML = `Тапсырма: <b>${target}</b> санын жасаңыз`;
    };
    const render = () => {
      const n = bits.reduce((acc, b) => acc * 2 + b, 0);
      el.querySelectorAll(".bin-bits button").forEach((b, i) => { b.classList.toggle("on", !!bits[i]); b.querySelector("b").textContent = bits[i]; });
      el.querySelector(".dec").textContent = n;
      el.querySelector(".hex").textContent = "0x" + n.toString(16).toUpperCase().padStart(2, "0");
      el.querySelector(".chr").textContent = n >= 33 && n <= 126 ? String.fromCharCode(n) : n === 32 ? "␣" : "—";
      if (n === target) {
        el.querySelector(".bin-goal").innerHTML = `<b>${target}</b> = ${bits.join("")} ✓ Жарайсыз!`;
        K.celebrate(); target = -1;
        setTimeout(newGoal, 1800);
      }
    };
    el.querySelector(".bin-bits").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      bits[b.dataset.i] ^= 1; render(); K.mark && K.mark("viz-binary");
    });
    el.querySelector(".bin-new").addEventListener("click", newGoal);
    el.querySelector(".bin-clear").addEventListener("click", () => { bits.fill(0); render(); });
    newGoal(); render();
  }

  // ================= Жад: swap мәнмен vs көрсеткішпен (4-апта) =================
  function vizSwap(el) {
    const PROGS = {
      value: {
        code: ["void swap(int a, int b)", "{", "    int tmp = a;", "    a = b;", "    b = tmp;", "}", "", "int main(void)", "{", "    int x = 1;", "    int y = 2;", "    swap(x, y);", '    printf("x is %i, y is %i\\n", x, y);', "}"],
        steps: [
          { line: 9, main: { x: 1 }, note: "main стектің түбінде: x айнымалысына 1 жазылды." },
          { line: 10, main: { x: 1, y: 2 }, note: "y айнымалысына 2 жазылды." },
          { line: 0, main: { x: 1, y: 2 }, swap: { a: 1, b: 2 }, note: "swap шақырылды: стекке жаңа кадр қосылды. a мен b — x пен y-тің КӨШІРМЕЛЕРІ." },
          { line: 2, main: { x: 1, y: 2 }, swap: { a: 1, b: 2, tmp: 1 }, ch: ["tmp"], note: "tmp = a = 1." },
          { line: 3, main: { x: 1, y: 2 }, swap: { a: 2, b: 2, tmp: 1 }, ch: ["a"], note: "a = b. Көшірме ғана өзгерді!" },
          { line: 4, main: { x: 1, y: 2 }, swap: { a: 2, b: 1, tmp: 1 }, ch: ["b"], note: "b = tmp. swap ішінде мәндер ауысты..." },
          { line: 5, main: { x: 1, y: 2 }, note: "swap аяқталды: оның кадры стектен «жойылды». x пен y өзгерген жоқ!" },
          { line: 12, main: { x: 1, y: 2 }, out: "x is 1, y is 2", note: "Қате! Мәнмен беру (by value) көшірмелерді ғана ауыстырады." },
        ],
      },
      ref: {
        code: ["void swap(int *a, int *b)", "{", "    int tmp = *a;", "    *a = *b;", "    *b = tmp;", "}", "", "int main(void)", "{", "    int x = 1;", "    int y = 2;", "    swap(&x, &y);", '    printf("x is %i, y is %i\\n", x, y);', "}"],
        steps: [
          { line: 9, main: { x: 1 }, note: "x = 1." },
          { line: 10, main: { x: 1, y: 2 }, note: "y = 2." },
          { line: 0, main: { x: 1, y: 2 }, swap: { a: "&x", b: "&y" }, note: "swap-қа x пен y-тің МЕКЕНЖАЙЛАРЫ берілді: a мен b — көрсеткіштер." },
          { line: 2, main: { x: 1, y: 2 }, swap: { a: "&x", b: "&y", tmp: 1 }, ch: ["tmp"], note: "tmp = *a: a көрсететін жерге барып (x), 1-ді аламыз." },
          { line: 3, main: { x: 2, y: 2 }, swap: { a: "&x", b: "&y", tmp: 1 }, ch: ["x"], note: "*a = *b: x-тің өзіне 2 жазылды!" },
          { line: 4, main: { x: 2, y: 1 }, swap: { a: "&x", b: "&y", tmp: 1 }, ch: ["y"], note: "*b = tmp: y-ке 1 жазылды." },
          { line: 5, main: { x: 2, y: 1 }, note: "swap кадры жойылды, бірақ өзгерістер main-де қалды." },
          { line: 12, main: { x: 2, y: 1 }, out: "x is 2, y is 1", note: "Дұрыс! Сілтеме бойынша беру (by reference)." },
        ],
      },
    };
    const ADDR = { x: "0x7ffc1c", y: "0x7ffc18", a: "0x7ffbf8", b: "0x7ffbf0", tmp: "0x7ffbec" };
    let prog = "value", i = 0;
    el.innerHTML = `
      <div class="viz-head"><b>Жад: swap мәнмен және көрсеткішпен</b><span class="viz-big">стек</span></div>
      <div class="viz-controls"><div class="seg sw-mode"><button type="button" data-p="value" class="on">Мәнмен (қате)</button><button type="button" data-p="ref">Көрсеткішпен (дұрыс)</button></div></div>
      <div class="sw-grid">
        <pre class="sw-code"></pre>
        <div class="sw-mem"></div>
      </div>
      <p class="sw-note"></p>
      <div class="viz-controls">
        <button type="button" class="btn secondary sw-prev">← Артқа</button>
        <button type="button" class="btn gold sw-next">Келесі қадам →</button>
        <span class="viz-stats sw-count"></span>
      </div>`;
    const frame = (name, vars, ch = []) => `<div class="sw-frame"><div class="sw-fname">${name}</div>${Object.entries(vars).map(([k, v]) => {
      const ptr = typeof v === "string";
      return `<div class="sw-var ${ch.includes(k) ? "ch" : ""}"><span class="sw-addr">${ADDR[k]}</span><span class="sw-name">${k}</span><span class="sw-val">${ptr ? ADDR[v.slice(1)] + ` <em>→ ${v.slice(1)}</em>` : v}</span></div>`;
    }).join("")}</div>`;
    const render = () => {
      const P = PROGS[prog], st = P.steps[i];
      el.querySelector(".sw-code").innerHTML = P.code.map((l, n) => `<span class="${n === st.line ? "cur" : ""}">${esc(l) || " "}</span>`).join("\n");
      el.querySelector(".sw-mem").innerHTML = `<div class="sw-label">Стек ↑</div>` + (st.swap ? frame("swap", st.swap, st.ch) : "") + frame("main", st.main, st.ch) +
        `<div class="sw-term"><small>Терминал</small>${st.out ? "$ ./swap<br>" + esc(st.out) : "$ ./swap"}</div>`;
      el.querySelector(".sw-note").textContent = st.note;
      el.querySelector(".sw-count").textContent = `Қадам ${i + 1} / ${P.steps.length}`;
      el.querySelector(".sw-prev").disabled = i === 0;
      el.querySelector(".sw-next").textContent = i === P.steps.length - 1 ? "↺ Басынан" : "Келесі қадам →";
    };
    el.querySelector(".sw-next").addEventListener("click", () => { i = i === PROGS[prog].steps.length - 1 ? 0 : i + 1; render(); K.mark && K.mark("viz-swap"); });
    el.querySelector(".sw-prev").addEventListener("click", () => { if (i) { i--; render(); } });
    el.querySelector(".sw-mode").addEventListener("click", (e) => {
      if (!e.target.dataset.p) return;
      prog = e.target.dataset.p; i = 0;
      el.querySelectorAll(".sw-mode button").forEach((b) => b.classList.toggle("on", b === e.target));
      render();
    });
    render();
  }

  // ================= Стек және кезек (5-апта) =================
  function vizStackQueue(el) {
    let mode = "stack", items = [], next = 1;
    el.innerHTML = `
      <div class="viz-head"><b>Стек және кезек</b><span class="viz-big sq-big">LIFO</span></div>
      <div class="viz-controls"><div class="seg sq-mode"><button type="button" data-m="stack" class="on">Стек (LIFO)</button><button type="button" data-m="queue">Кезек (FIFO)</button></div></div>
      <p class="viz-note sq-note"></p>
      <div class="sq-box"></div>
      <div class="viz-controls">
        <button type="button" class="btn gold sq-in"></button>
        <button type="button" class="btn secondary sq-out"></button>
        <span class="viz-stats sq-msg"></span>
      </div>`;
    const TXT = {
      stack: { big: "LIFO", note: "Last In, First Out — соңғы кірген бірінші шығады. Асханадағы науалар сияқты: үстіне қоясыз, үстінен аласыз. Gmail жәшігі де — стек.", in: "push (үстіне қою)", out: "pop (үстінен алу)" },
      queue: { big: "FIFO", note: "First In, First Out — бірінші кірген бірінші шығады. Дүкендегі кезек сияқты: соңына тұрасыз, басынан шығасыз.", in: "enqueue (соңына)", out: "dequeue (басынан)" },
    };
    const render = (fresh = -1) => {
      const t = TXT[mode];
      el.querySelector(".sq-big").textContent = t.big;
      el.querySelector(".sq-note").textContent = t.note;
      el.querySelector(".sq-in").textContent = t.in;
      el.querySelector(".sq-out").textContent = t.out;
      const box = el.querySelector(".sq-box");
      box.className = "sq-box " + mode;
      box.innerHTML = items.length
        ? items.map((v, i) => `<span class="${i === fresh ? "fresh" : ""}">${v}</span>`).join("")
        : `<em>${mode === "stack" ? "Стек бос" : "Кезек бос"}</em>`;
    };
    el.querySelector(".sq-in").addEventListener("click", () => {
      if (items.length >= 8) { el.querySelector(".sq-msg").textContent = "Толы! (сыйымдылығы 8)"; return; }
      items.push(next++); render(items.length - 1);
      el.querySelector(".sq-msg").textContent = `${items[items.length - 1]} қосылды`;
      K.mark && K.mark("viz-stackqueue");
    });
    el.querySelector(".sq-out").addEventListener("click", () => {
      if (!items.length) { el.querySelector(".sq-msg").textContent = "Бос — алатын ештеңе жоқ"; return; }
      const v = mode === "stack" ? items.pop() : items.shift();
      el.querySelector(".sq-msg").textContent = `${v} шықты`;
      render();
    });
    el.querySelector(".sq-mode").addEventListener("click", (e) => {
      if (!e.target.dataset.m) return;
      mode = e.target.dataset.m; items = []; next = 1;
      el.querySelectorAll(".sq-mode button").forEach((b) => b.classList.toggle("on", b === e.target));
      el.querySelector(".sq-msg").textContent = "";
      render();
    });
    [1, 2, 3].forEach(() => items.push(next++));
    render();
  }

  // ================= Хэш-кесте (5-апта) =================
  function vizHash(el) {
    const table = Array.from({ length: 26 }, () => []);
    el.innerHTML = `
      <div class="viz-head"><b>Хэш-кесте</b><span class="viz-big">hash(name) = name[0] − 'A'</span></div>
      <p class="viz-note">26 «шелек» (bucket), әрқайсысы — байланысқан тізім. Хэш-функция атты бірінші әрпі бойынша шелекке жібереді. Бір шелекке түскен аттар — <b>коллизия</b>: олар тізімге тізбектеледі.</p>
      <div class="viz-controls">
        <input class="viz-input hs-in" type="text" maxlength="14" placeholder="Аты: Aruzhan" aria-label="Аты" style="width:170px">
        <button type="button" class="btn gold hs-add">Қосу</button>
        <button type="button" class="btn secondary hs-find">Іздеу</button>
      </div>
      <p class="viz-result hs-msg"></p>
      <div class="hs-table"></div>`;
    const hash = (w) => w.toUpperCase().charCodeAt(0) - 65;
    const render = (hb = -1, hi = -1, cls = "look") => {
      el.querySelector(".hs-table").innerHTML = table.map((chain, b) => `
        <div class="hs-row ${b === hb ? "hl" : ""} ${chain.length ? "" : "empty"}"><span class="hs-idx">${b}<small>${String.fromCharCode(65 + b)}</small></span>
        ${chain.map((w, i) => `<span class="hs-node ${b === hb && i === hi ? cls : ""}">${esc(w)}</span>`).join('<span class="arrow">→</span>')}</div>`).join("");
    };
    const msg = (t) => (el.querySelector(".hs-msg").innerHTML = t);
    const valid = (w) => /^[A-Za-z][A-Za-z'-]*$/.test(w);
    el.querySelector(".hs-add").addEventListener("click", () => {
      const inp = el.querySelector(".hs-in"), w = inp.value.trim();
      if (!valid(w)) return msg("Латын әрпінен басталатын ат жазыңыз (мысалы, Hermione).");
      const b = hash(w);
      if (table[b].some((x) => x.toLowerCase() === w.toLowerCase())) return msg(`${esc(w)} кестеде бар.`);
      table[b].push(w[0].toUpperCase() + w.slice(1));
      render(b, table[b].length - 1, "fresh");
      msg(`hash("${esc(w)}") = <b>${b}</b>. ${table[b].length > 1 ? `Коллизия! ${b}-шелекте енді ${table[b].length} ат.` : "Шелек бос еді — O(1)."}`);
      inp.value = ""; K.mark && K.mark("viz-hash");
    });
    el.querySelector(".hs-find").addEventListener("click", async () => {
      const w = el.querySelector(".hs-in").value.trim();
      if (!valid(w)) return msg("Іздейтін атты жазыңыз.");
      const b = hash(w);
      for (let i = 0; i < table[b].length; i++) {
        render(b, i); await sleep(400);
        if (table[b][i].toLowerCase() === w.toLowerCase()) { render(b, i, "found"); return msg(`Табылды: ${b}-шелек, ${i + 1}-қадам. Бүкіл кестені емес, тек бір шелекті тексердік.`); }
      }
      render(b); msg(`${esc(w)} жоқ: ${b}-шелекте ${table[b].length} атты тексердік.`);
    });
    el.querySelector(".hs-in").addEventListener("keydown", (e) => e.key === "Enter" && el.querySelector(".hs-add").click());
    ["Aigerim", "Arman", "Bauyrzhan", "Bolat", "Dana", "Dauren", "Erlan", "Nurlan", "Saule", "Zhanna", "Timur"].forEach((w) => table[hash(w)].push(w));
    render();
  }

  // ================= Екілік іздеу ағашы (5-апта) =================
  function vizBst(el) {
    let root = null;
    const ins = (node, v) => {
      if (!node) return { v, l: null, r: null };
      if (v < node.v) node.l = ins(node.l, v); else if (v > node.v) node.r = ins(node.r, v);
      return node;
    };
    const height = (n) => (n ? 1 + Math.max(height(n.l), height(n.r)) : 0);
    const count = (n) => (n ? 1 + count(n.l) + count(n.r) : 0);
    el.innerHTML = `
      <div class="viz-head"><b>Екілік іздеу ағашы</b><span class="viz-big bst-big"></span></div>
      <p class="viz-note">Сол жақтағы бала кіші, оң жақтағы бала үлкен. Іздегенде әр қадамда ағаштың жартысын тастаймыз — теңдестірілген ағашта O(log n). Бірақ сандарды ретімен қоссаңыз, ағаш «тізімге» айналады: O(n).</p>
      <div class="viz-controls">
        <input class="viz-input bst-in" type="number" min="0" max="99" placeholder="Сан" aria-label="Сан">
        <button type="button" class="btn gold bst-add">Қосу</button>
        <button type="button" class="btn secondary bst-find">Іздеу</button>
        <button type="button" class="btn secondary bst-good">Теңдестірілген</button>
        <button type="button" class="btn secondary bst-bad">Ретімен (нашар)</button>
      </div>
      <p class="viz-result bst-msg"></p>
      <div class="bst-svg"></div>`;
    const render = (path = [], found = null) => {
      const nodes = [], edges = [];
      let idx = 0;
      const walk = (n, d) => { if (!n) return; walk(n.l, d + 1); n.x = idx++; n.d = d; nodes.push(n); walk(n.r, d + 1); };
      walk(root, 0);
      const W = Math.max(1, nodes.length), H = height(root);
      const X = (n) => 30 + (n.x + 0.5) * (Math.max(320, W * 52) - 60) / W, Y = (n) => 30 + n.d * 62;
      nodes.forEach((n) => [n.l, n.r].forEach((c) => c && edges.push(`<line x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`)));
      const w = Math.max(320, W * 52), h = Math.max(80, H * 62);
      el.querySelector(".bst-svg").innerHTML = root
        ? `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${edges.join("")}${nodes.map((n) => `<g class="${n === found ? "found" : path.includes(n) ? "look" : ""}"><circle cx="${X(n)}" cy="${Y(n)}" r="19"/><text x="${X(n)}" y="${Y(n) + 5}">${n.v}</text></g>`).join("")}</svg>`
        : '<p class="viz-note">Ағаш бос.</p>';
      el.querySelector(".bst-big").textContent = `n = ${count(root)}, биіктігі = ${H}`;
    };
    const fill = (arr) => { root = null; arr.forEach((v) => (root = ins(root, v))); render(); };
    el.querySelector(".bst-add").addEventListener("click", () => {
      const inp = el.querySelector(".bst-in"); let v = parseInt(inp.value, 10);
      if (Number.isNaN(v)) v = Math.floor(Math.random() * 99);
      root = ins(root, v); render(); inp.value = "";
      el.querySelector(".bst-msg").textContent = `${v} қосылды.`;
      K.mark && K.mark("viz-bst");
    });
    el.querySelector(".bst-find").addEventListener("click", async () => {
      const v = parseInt(el.querySelector(".bst-in").value, 10);
      if (Number.isNaN(v)) { el.querySelector(".bst-msg").textContent = "Іздейтін санды жазыңыз."; return; }
      K.mark && K.mark("viz-bst");
      const path = []; let n = root;
      while (n) {
        path.push(n); render(path); await sleep(450);
        if (v === n.v) { render(path, n); el.querySelector(".bst-msg").textContent = `${v} табылды: ${path.length} салыстыру.`; return; }
        n = v < n.v ? n.l : n.r;
      }
      el.querySelector(".bst-msg").textContent = `${v} жоқ: ${path.length} салыстырудан кейін NULL-ға жеттік.`;
    });
    el.querySelector(".bst-good").addEventListener("click", () => { fill([50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43]); el.querySelector(".bst-msg").textContent = "11 түйін, биіктігі 4 ≈ log₂11."; });
    el.querySelector(".bst-bad").addEventListener("click", () => { fill([10, 20, 30, 40, 50, 60]); el.querySelector(".bst-msg").textContent = "Ретімен қосылды: ағаш байланысқан тізімге айналды, биіктігі = n."; });
    fill([50, 25, 75, 12, 37, 62, 87]);
  }

  // ================= Сурет сүзгілері (4-апта, Filter) =================
  function drawSteppe(ctx, W, H) {
    // Кодпен салынған түпнұсқа сурет: дала, күн, тау, киіз үй
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    sky.addColorStop(0, "#1d6fa5"); sky.addColorStop(1, "#9fd8ef");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.78, H * 0.22, 4, W * 0.78, H * 0.22, H * 0.16);
    sun.addColorStop(0, "#fff6c2"); sun.addColorStop(1, "#f2b705");
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.22, H * 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = "#5f7f9c";
    ctx.beginPath(); ctx.moveTo(0, H * 0.62);
    [[0.12, 0.38], [0.24, 0.55], [0.38, 0.32], [0.52, 0.56], [0.66, 0.44], [0.8, 0.6], [1, 0.48]].forEach(([x, y]) => ctx.lineTo(W * x, H * y));
    ctx.lineTo(W, H * 0.7); ctx.lineTo(0, H * 0.7); ctx.fill();
    ctx.fillStyle = "#eef4f7";
    [[0.38, 0.32], [0.12, 0.38]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(W * x, H * y); ctx.lineTo(W * (x - 0.04), H * (y + 0.07)); ctx.lineTo(W * (x + 0.04), H * (y + 0.07)); ctx.fill(); });
    const grass = ctx.createLinearGradient(0, H * 0.62, 0, H);
    grass.addColorStop(0, "#7fb24a"); grass.addColorStop(1, "#3e7a2c");
    ctx.fillStyle = grass; ctx.fillRect(0, H * 0.64, W, H);
    // киіз үй
    const yx = W * 0.3, yy = H * 0.66, yw = W * 0.2;
    ctx.fillStyle = "#f4ead6"; ctx.fillRect(yx - yw / 2, yy, yw, H * 0.16);
    ctx.fillStyle = "#c4342d"; ctx.beginPath(); ctx.moveTo(yx - yw / 2 - 4, yy + 2); ctx.quadraticCurveTo(yx, yy - H * 0.17, yx + yw / 2 + 4, yy + 2); ctx.fill();
    ctx.fillStyle = "#c4342d"; ctx.fillRect(yx - yw / 2, yy + H * 0.04, yw, 4);
    ctx.fillStyle = "#6b3e1f"; ctx.fillRect(yx - 9, yy + H * 0.07, 18, H * 0.09);
    ctx.strokeStyle = "#f2b705"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(yx, yy - H * 0.085, 6, 0, 7); ctx.stroke();
    // шөп пен гүлдер (кездейсоқ, бірақ тұрақты)
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = H * 0.66 + r() * H * 0.34;
      ctx.strokeStyle = r() > 0.5 ? "#2f6b22" : "#9cc95a"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r() * 4 - 2, y - 4 - r() * 6); ctx.stroke();
    }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = ["#f2b705", "#ffffff", "#e0457b"][i % 3]; ctx.beginPath(); ctx.arc(r() * W, H * 0.72 + r() * H * 0.26, 2.2, 0, 7); ctx.fill(); }
  }

  const FILTERS = {
    original: { name: "Түпнұсқа", code: "// Сүзгіні таңдаңыз" },
    grayscale: {
      name: "Grayscale",
      code: "int avg = round((r + g + b) / 3.0);\nimage[i][j].rgbtRed = avg;\nimage[i][j].rgbtGreen = avg;\nimage[i][j].rgbtBlue = avg;",
      fn(d) { for (let i = 0; i < d.length; i += 4) { const a = Math.round((d[i] + d[i + 1] + d[i + 2]) / 3); d[i] = d[i + 1] = d[i + 2] = a; } },
    },
    sepia: {
      name: "Sepia",
      code: "int sr = round(.393 * r + .769 * g + .189 * b);\nint sg = round(.349 * r + .686 * g + .168 * b);\nint sb = round(.272 * r + .534 * g + .131 * b);\n// 255-тен асса, 255 етіп шектейміз\nimage[i][j].rgbtRed = sr > 255 ? 255 : sr;",
      fn(d) {
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
          d[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));
          d[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b));
          d[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b));
        }
      },
    },
    reflect: {
      name: "Reflect",
      code: "for (int j = 0; j < width / 2; j++)\n{\n    RGBTRIPLE tmp = image[i][j];\n    image[i][j] = image[i][width - 1 - j];\n    image[i][width - 1 - j] = tmp;\n}",
      fn(d, w, h) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) {
          const a = (y * w + x) * 4, b = (y * w + (w - 1 - x)) * 4;
          for (let k = 0; k < 3; k++) [d[a + k], d[b + k]] = [d[b + k], d[a + k]];
        }
      },
    },
    blur: {
      name: "Blur",
      code: "// 3×3 «қорап»: көршілердің орташасы\n// бастапқы суреттің КӨШІРМЕСІНЕН оқимыз!\nfor (int di = -1; di <= 1; di++)\n    for (int dj = -1; dj <= 1; dj++)\n        if (ішінде) { sum += copy[i+di][j+dj]; count++; }\nimage[i][j] = sum / count;",
      fn(d, w, h) {
        const src = d.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          let s = [0, 0, 0], n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
            const o = (yy * w + xx) * 4; s[0] += src[o]; s[1] += src[o + 1]; s[2] += src[o + 2]; n++;
          }
          const o = (y * w + x) * 4;
          for (let k = 0; k < 3; k++) d[o + k] = Math.round(s[k] / n);
        }
      },
    },
    edges: {
      name: "Edges",
      code: "// Собель операторы: Gx және Gy ядролары\n// Gx = {{-1,0,1},{-2,0,2},{-1,0,1}}\n// Gy = {{-1,-2,-1},{0,0,0},{1,2,1}}\n// шетінен тыс пиксель = қара (0)\nint v = round(sqrt(gx * gx + gy * gy));\nimage[i][j].rgbtRed = v > 255 ? 255 : v;",
      fn(d, w, h) {
        const src = d.slice();
        const GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1], GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const o = (y * w + x) * 4;
          for (let k = 0; k < 3; k++) {
            let gx = 0, gy = 0, t = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++, t++) {
              const yy = y + dy, xx = x + dx;
              const v = yy < 0 || yy >= h || xx < 0 || xx >= w ? 0 : src[(yy * w + xx) * 4 + k];
              gx += GX[t] * v; gy += GY[t] * v;
            }
            d[o + k] = Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));
          }
        }
      },
    },
  };

  function vizFilter(el) {
    el.innerHTML = `
      <div class="viz-head"><b>Сурет сүзгілері</b><span class="viz-big">Problem Set 4: Filter</span></div>
      <p class="viz-note">Сурет — пиксельдер торы, әр пиксель — үш байт: қызыл, жасыл, көк (RGB). Сүзгіні таңдаңыз, ал тышқанды (не саусақты) суреттің үстіне апарып, пиксельдің мәнін көріңіз.</p>
      <div class="viz-controls">
        <div class="seg ft-seg">${Object.entries(FILTERS).map(([k, f], i) => `<button type="button" data-f="${k}" class="${i ? "" : "on"}">${f.name}</button>`).join("")}</div>
        <label class="btn secondary ft-upload">📷 Өз суретім<input type="file" accept="image/*" hidden></label>
      </div>
      <div class="ft-grid">
        <div class="ft-canvas"><canvas width="480" height="300"></canvas><div class="ft-pixel"><span class="sw"></span><code>x, y</code><code>RGB</code><code>#</code></div></div>
        <pre class="ft-code"></pre>
      </div>`;
    const cv = el.querySelector("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    let base, cur = "original";
    const loadBase = () => { base = ctx.getImageData(0, 0, cv.width, cv.height); apply(); };
    const apply = () => {
      const img = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
      if (FILTERS[cur].fn) FILTERS[cur].fn(img.data, img.width, img.height);
      ctx.putImageData(img, 0, 0);
      el.querySelector(".ft-code").textContent = FILTERS[cur].code;
    };
    el.querySelector(".ft-seg").addEventListener("click", (e) => {
      if (!e.target.dataset.f) return;
      cur = e.target.dataset.f;
      el.querySelectorAll(".ft-seg button").forEach((b) => b.classList.toggle("on", b === e.target));
      apply(); K.mark && K.mark("viz-filter");
    });
    el.querySelector(".ft-upload input").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 480 / img.width, 360 / img.height);
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(img.src);
        loadBase();
      };
      img.src = URL.createObjectURL(f);
    });
    const inspect = (ev) => {
      const r = cv.getBoundingClientRect(), t = ev.touches ? ev.touches[0] : ev;
      const x = Math.floor(((t.clientX - r.left) / r.width) * cv.width), y = Math.floor(((t.clientY - r.top) / r.height) * cv.height);
      if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;
      const [R, G, B] = ctx.getImageData(x, y, 1, 1).data;
      const hex = [R, G, B].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
      const c = el.querySelectorAll(".ft-pixel code");
      el.querySelector(".ft-pixel .sw").style.background = "#" + hex;
      c[0].textContent = `[${y}][${x}]`; c[1].textContent = `R ${R} · G ${G} · B ${B}`; c[2].textContent = "#" + hex;
    };
    cv.addEventListener("mousemove", inspect);
    cv.addEventListener("touchmove", (e) => { inspect(e); }, { passive: true });
    drawSteppe(ctx, cv.width, cv.height);
    loadBase();
  }

  // ================= «Қатені тап» тренажері =================
  async function bugHunt(el) {
    await K.loadScript("assets/data/bugs.js");
    const all = window.CS50KZ_BUGS || [];
    const KEY = "cs50kz:bugs";
    const solved = store.get(KEY, {});
    let i = all.findIndex((b, k) => !solved[k]); if (i < 0) i = 0;
    let tries = 0;
    el.innerHTML = `
      <div class="bh-top"><div class="bh-dots"></div><span class="bh-score"></span></div>
      <div class="bh-card">
        <div class="bh-meta"></div>
        <p class="bh-task"><span class="bota-mini" aria-hidden="true"></span>Бұл кодта бір қате бар. <b>Қате жолды басыңыз.</b></p>
        <pre class="bh-code"></pre>
        <div class="bh-result" hidden></div>
        <div class="bh-nav"><button type="button" class="btn secondary bh-prev">← Алдыңғы</button><button type="button" class="btn gold bh-next">Келесі →</button></div>
      </div>`;
    const render = () => {
      const b = all[i];
      tries = 0;
      const done = Object.keys(solved).length;
      el.querySelector(".bh-score").textContent = `Табылды: ${done} / ${all.length}`;
      el.querySelector(".bh-dots").innerHTML = all.map((x, k) => `<button type="button" data-k="${k}" class="${solved[k] ? "ok" : ""} ${k === i ? "cur" : ""}" aria-label="${k + 1}-жаттығу">${k + 1}</button>`).join("");
      el.querySelector(".bh-meta").innerHTML = `<span>${esc(b.w)}</span><b>${esc(b.t)}</b><code>${{ c: "C", python: "Python", sql: "SQL", html: "HTML", javascript: "JavaScript" }[b.lang] || b.lang}</code>`;
      el.querySelector(".bh-code").innerHTML = b.code.map((l, n) => `<span class="bh-line" data-n="${n}"><i>${n + 1}</i>${esc(l) || " "}</span>`).join("");
      el.querySelector(".bh-result").hidden = true;
      el.querySelector(".bh-code").classList.remove("solved");
    };
    const reveal = (ok) => {
      const b = all[i];
      el.querySelector(".bh-code").classList.add("solved");
      el.querySelectorAll(".bh-line")[b.bug].classList.add("bug");
      const r = el.querySelector(".bh-result");
      r.hidden = false;
      r.innerHTML = `<p><b>${ok ? "Дұрыс! ✓" : `Қате жол — ${b.bug + 1}-жол.`}</b> ${b.why}</p><p class="bh-fixlabel">Түзетілгені:</p><pre class="bh-fix">${esc(b.fix)}</pre>`;
      if (ok && !solved[i]) K.bump && K.bump("trainer");
      if (ok) { solved[i] = 1; store.set(KEY, solved); K.mark && K.mark("bughunt"); if (Object.keys(solved).length === all.length) K.celebrate(); }
      el.querySelector(".bh-score").textContent = `Табылды: ${Object.keys(solved).length} / ${all.length}`;
      el.querySelectorAll(".bh-dots button")[i].classList.toggle("ok", !!solved[i]);
    };
    el.querySelector(".bh-code").addEventListener("click", (e) => {
      const line = e.target.closest(".bh-line");
      if (!line || el.querySelector(".bh-code").classList.contains("solved")) return;
      const n = +line.dataset.n;
      if (n === all[i].bug) { line.classList.add("hit"); reveal(true); }
      else {
        line.classList.add("miss");
        if (++tries >= 2) reveal(false);
      }
    });
    el.querySelector(".bh-next").addEventListener("click", () => { i = (i + 1) % all.length; render(); });
    el.querySelector(".bh-prev").addEventListener("click", () => { i = (i - 1 + all.length) % all.length; render(); });
    el.querySelector(".bh-dots").addEventListener("click", (e) => { if (e.target.dataset.k) { i = +e.target.dataset.k; render(); } });
    render();
  }

  // ================= «Не шығарады?» тренажері =================
  async function traceQuiz(el) {
    await K.loadScript("assets/data/trace.js");
    const all = window.CS50KZ_TRACE || [];
    const KEY = "cs50kz:trace";
    const solved = store.get(KEY, {});
    let i = all.findIndex((t, k) => !solved[k]); if (i < 0) i = 0;
    el.innerHTML = `
      <div class="bh-top"><div class="bh-dots"></div><span class="bh-score"></span></div>
      <div class="bh-card">
        <div class="bh-meta"></div>
        <p class="bh-task"><span class="bota-mini" aria-hidden="true"></span>Кодты іске қоспай, басыңызда «орындаңыз». <b>Экранға не шығады?</b></p>
        <pre class="tr-code"><code></code></pre>
        <div class="tr-q"></div>
        <div class="bh-nav"><button type="button" class="btn secondary bh-prev">← Алдыңғы</button><button type="button" class="btn gold bh-next">Келесі →</button></div>
      </div>`;
    const render = () => {
      const t = all[i];
      el.querySelector(".bh-score").textContent = `Шешілді: ${Object.keys(solved).length} / ${all.length}`;
      el.querySelector(".bh-dots").innerHTML = all.map((x, k) => `<button type="button" data-k="${k}" class="${solved[k] ? "ok" : ""} ${k === i ? "cur" : ""}">${k + 1}</button>`).join("");
      el.querySelector(".bh-meta").innerHTML = `<span>${esc(t.w)}</span><code>${t.lang === "c" ? "C" : "Python"}</code>`;
      const code = el.querySelector(".tr-code code");
      code.className = "language-" + (t.lang === "c" ? "c" : "python");
      code.textContent = t.code;
      if (window.hljs) { code.removeAttribute("data-highlighted"); window.hljs.highlightElement(code); }
      const box = el.querySelector(".tr-q");
      box.dataset.done = "";
      box.innerHTML = `<div class="mq-opts tr-opts">${t.o.map((o, k) => `<button type="button" data-i="${k}"><code>${esc(o)}</code></button>`).join("")}</div><div class="mq-explain" hidden></div>`;
    };
    el.querySelector(".tr-q").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]"), box = el.querySelector(".tr-q");
      if (!b || box.dataset.done) return;
      box.dataset.done = 1;
      const t = all[i], ok = +b.dataset.i === t.a;
      box.querySelectorAll("button").forEach((x, k) => { x.disabled = true; if (k === t.a) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      const ex = box.querySelector(".mq-explain");
      ex.hidden = false;
      ex.innerHTML = `<b>${ok ? "Дұрыс! ✓" : "Қате ✗"}</b> ${esc(t.e)}`;
      if (ok && !solved[i]) K.bump && K.bump("trainer");
      if (ok) { solved[i] = 1; store.set(KEY, solved); K.mark && K.mark("trace"); if (Object.keys(solved).length === all.length) K.celebrate(); }
      el.querySelector(".bh-score").textContent = `Шешілді: ${Object.keys(solved).length} / ${all.length}`;
      el.querySelectorAll(".bh-dots button")[i].classList.toggle("ok", !!solved[i]);
    });
    el.querySelector(".bh-next").addEventListener("click", () => { i = (i + 1) % all.length; render(); });
    el.querySelector(".bh-prev").addEventListener("click", () => { i = (i - 1 + all.length) % all.length; render(); });
    el.querySelector(".bh-dots").addEventListener("click", (e) => { if (e.target.dataset.k) { i = +e.target.dataset.k; render(); } });
    render();
  }

  // ================= Автотексеруші (check50 браузерде) =================
  async function autograder(el) {
    await K.loadScript("assets/data/checks.js");
    const keys = el.dataset.check.split(",");
    let key = keys[0];
    const norm = (t) => t.replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
    el.innerHTML = `
      <div class="ag-head"><b>✅ Автотексеруші</b><span>check50 сияқты, бірақ браузерде</span></div>
      ${keys.length > 1 ? `<div class="seg ag-seg">${keys.map((k, i) => `<button type="button" data-k="${k}" class="${i ? "" : "on"}">${esc(window.CS50KZ_CHECKS[k].title.replace("Sentimental: ", ""))}</button>`).join("")}</div>` : ""}
      <p class="ag-note">Шешіміңізді (<code class="ag-file"></code>) осында қойып, «Тексеру» басыңыз. Бағдарлама жасырын кірістермен бірнеше рет іске қосылып, шығысы күтілген нәтижемен салыстырылады. Код браузеріңізде сақталады.</p>
      <textarea class="pg-editor ag-code" spellcheck="false" autocapitalize="off" aria-label="Python коды"></textarea>
      <div class="pg-actions"><button type="button" class="btn gold ag-run">▶ Тексеру</button><span class="ag-score"></span></div>
      <ul class="ag-results"></ul>`;
    const ed = el.querySelector(".ag-code");
    const load = () => {
      const c = window.CS50KZ_CHECKS[key];
      el.querySelector(".ag-file").textContent = c.file;
      ed.value = store.get("ag:" + key, null) ?? c.starter;
      el.querySelector(".ag-results").innerHTML = c.tests.map((t) => `<li class="wait"><span class="ag-ico">○</span>${esc(t.n)}</li>`).join("");
      el.querySelector(".ag-score").textContent = "";
    };
    ed.addEventListener("input", () => store.set("ag:" + key, ed.value));
    ed.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); ed.setRangeText("    ", ed.selectionStart, ed.selectionEnd, "end"); store.set("ag:" + key, ed.value); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    el.querySelector(".ag-seg")?.addEventListener("click", (e) => {
      if (!e.target.dataset.k) return;
      key = e.target.dataset.k;
      el.querySelectorAll(".ag-seg button").forEach((b) => b.classList.toggle("on", b === e.target));
      load();
    });
    async function run() {
      const c = window.CS50KZ_CHECKS[key], list = el.querySelector(".ag-results"), btn = el.querySelector(".ag-run");
      btn.disabled = true;
      el.querySelector(".ag-score").textContent = "Python жүктелуде...";
      let py;
      try { py = await K.getPyodide(); } catch (e) {
        el.querySelector(".ag-score").textContent = "Python жүктелмеді. Интернетті тексеріп, қайта көріңіз.";
        btn.disabled = false; return;
      }
      const runOne = py.globals.get("__cs50kz_run");
      let pass = 0;
      el.querySelector(".ag-score").textContent = "Тексерілуде...";
      const items = [...list.children];
      for (let i = 0; i < c.tests.length; i++) {
        const t = c.tests[i], li = items[i];
        await sleep(30);
        let out = "", err = null;
        try { [out, err] = runOne(ed.value, py.toPy(t.in)).toJs(); } catch (e) { err = String(e.message || e); }
        const ok = !err && norm(out) === norm(t.out);
        if (ok) pass++;
        li.className = ok ? "ok" : "bad";
        li.innerHTML = `<span class="ag-ico">${ok ? "✓" : "✗"}</span>${esc(t.n)}` + (ok ? "" :
          `<div class="ag-diff"><div><small>Кіріс</small><pre>${esc(t.in.join("\n"))}</pre></div><div><small>Күтілген</small><pre>${esc(t.out)}</pre></div><div><small>Сіздің шығысыңыз</small><pre>${esc(err ? (out ? out + "\n" : "") + err : out || "(бос)")}</pre></div></div>`);
      }
      el.querySelector(".ag-score").textContent = `${pass} / ${c.tests.length} тест өтті`;
      if (pass === c.tests.length) {
        K.celebrate();
        const g = store.get("cs50kz:graded", {}); g[key] = Date.now(); store.set("cs50kz:graded", g);
        K.check && K.check();
      }
      btn.disabled = false;
    }
    el.querySelector(".ag-run").addEventListener("click", run);
    load();
  }

  // ================= Апталық челлендж =================
  function weekly(el) {
    const GOALS = [
      { k: "read", n: 2, ico: "📖", t: "2 лекция оқу" },
      { k: "cards", n: 30, ico: "🃏", t: "30 карточка қайталау" },
      { k: "trainer", n: 5, ico: "🐞", t: "5 тренажер жаттығуы" },
      { k: "daily", n: 4, ico: "🔥", t: "4 күн «Күннің сұрағы»" },
    ];
    const render = () => {
      const id = window.CS50KZ_weekId();
      let w = store.get("cs50kz:week", {});
      if (w.id !== id) w = { id };
      const done = GOALS.filter((g) => (w[g.k] || 0) >= g.n).length;
      const d = new Date(), left = 7 - (d.getDay() || 7);
      el.innerHTML = `<div class="wk-head"><b>🎯 Апталық челлендж</b><span>${done === GOALS.length ? "Орындалды! 🏆" : `${done}/4 · ${left ? left + " күн қалды" : "бүгін соңғы күн"}`}</span></div>
        <div class="wk-goals">${GOALS.map((g) => { const v = Math.min(w[g.k] || 0, g.n); return `<div class="wk-goal ${v >= g.n ? "done" : ""}"><span>${g.ico}</span><div><b>${g.t}</b><i><em style="width:${(v / g.n) * 100}%"></em></i><small>${v} / ${g.n}</small></div></div>`; }).join("")}</div>`;
      if (done === GOALS.length && !w.done) {
        w.done = true; store.set("cs50kz:week", w);
        const wins = store.get("cs50kz:weeks-won", 0) + 1; store.set("cs50kz:weeks-won", wins);
        K.celebrate(); K.check && K.check();
      }
    };
    document.addEventListener("cs50kz:week", render);
    render();
  }

  // ================= Курс картасы =================
  async function courseMap(el) {
    await K.loadScript("assets/data/lectures.js");
    const lecs = window.CS50KZ_LECTURES || [];
    const p = store.get("cs50kz:progress", {}) || {};
    const read = p.read || {}, quiz = p.quiz || {};
    const LANG = { "week-0": "Scratch", "week-1": "C", "week-2": "C", "week-3": "C", "week-4": "C", "week-5": "C", "week-6": "Python", "week-7": "SQL", ai: "AI", "week-8": "HTML · CSS · JS", "week-9": "Flask", "week-10": "🎓" };
    const next = lecs.find((l) => !read[l.id]);
    el.innerHTML = `<div class="map-legend"><span class="lg read">Оқылды</span><span class="lg next">Келесі</span><span class="lg todo">Алда</span></div>` +
      lecs.map((l, k) => {
        const st = read[l.id] ? "read" : l === next ? "next" : "todo";
        const q = quiz[l.id];
        return `<div class="map-stop ${st} ${k % 2 ? "right" : "left"}">
          <div class="map-dot">${read[l.id] ? "✓" : k}</div>
          <div class="map-card">
            <div class="map-top"><span class="map-num">${esc(l.num)}</span><span class="map-lang">${esc(LANG[l.id] || "")}</span></div>
            <a class="map-title" href="${K.ROOT_URL + l.url}">${esc(l.title)}</a>
            <div class="map-topics">${l.topics.slice(0, 8).map((t) => `<a href="${K.ROOT_URL + l.url}#${t.id}">${esc(t.t)}</a>`).join("")}</div>
            <div class="map-foot"><span>⏱ ${l.minutes} мин</span>${q ? `<span>📝 ${q.best}/${q.total}</span>` : ""}${st === "next" ? `<a class="btn gold" href="${K.ROOT_URL + l.url}">Бастау →</a>` : ""}</div>
          </div>
        </div>`;
      }).join("");
  }

  const MODULES = { filter: vizFilter, sort: vizSort, search: vizSearch, list: vizList, binary: vizBinary, swap: vizSwap, stackqueue: vizStackQueue, hash: vizHash, bst: vizBst };
  document.querySelectorAll(".viz[data-viz]").forEach((el) => MODULES[el.dataset.viz] && MODULES[el.dataset.viz](el));
  document.querySelectorAll(".flashcards").forEach(flashcards);
  document.querySelectorAll(".daily-card").forEach(daily);
  document.querySelectorAll(".mixed-quiz").forEach(mixedQuiz);
  document.querySelectorAll(".bug-hunt").forEach(bugHunt);
  document.querySelectorAll(".trace-quiz").forEach(traceQuiz);
  document.querySelectorAll(".autograder").forEach(autograder);
  document.querySelectorAll(".weekly").forEach(weekly);
  document.querySelectorAll(".course-map").forEach(courseMap);
})();
