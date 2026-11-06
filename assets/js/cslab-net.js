/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe: Желі пакеттері зертханасы (academy/labs/network.html).
   1) Инкапсуляция: байт өлшемдері нақты (UTF-8 ұзындығы, TCP 20 + IP 20 + Ethernet 14 + FCS 4, ең аз кадр жүктемесі 46 байт).
   2) Маршруттау: IPv4 адрестер 32 биттік бүтін сан; сәйкестік - маска бойынша; ең ұзын префикс; әр маршрутизатор TTL-ді
      1-ге азайтады, 0 болса тастайды (RFC 1812 мағынасында: TTL = 1 келген пакет әрі жіберілмейді).
   3) TCP: дискретті уақыт симуляциясы (бір жол = 3 бірлік, RTO = 16, жаңа деректі растаған ACK таймерді қайта бастайды,
      3 қайталанған ACK - жылдам қайта жіберу, қабылдаушы ретсіз сегменттерді буферлейді, ACK жоғалмайды).
   4) DNS: итеративті шешу және кэш. 5) Тексеру тапсырмалары - сол модельдерден. */
(() => {
  "use strict";
  const C = window.CSB, T = () => window.AO17Tutor;
  if (!C) return;
  const { el, rng, pick, shuffle } = C;
  const SVGNS = "http://www.w3.org/2000/svg";
  const sv = (tag, a = {}, text) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };
  const utf8 = (s) => new TextEncoder().encode(s).length;

  // ================================================================ IPv4 көмекшілері
  const ipParse = (s) => {
    const m = String(s).trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return null;
    const o = m.slice(1).map(Number); if (o.some((x) => x > 255)) return null;
    return ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
  };
  const ipStr = (u) => [u >>> 24, (u >>> 16) & 255, (u >>> 8) & 255, u & 255].join(".");
  const mask = (len) => (len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0);
  const matches = (ip, net, len) => ((ip & mask(len)) >>> 0) === ((net & mask(len)) >>> 0);
  const bin = (u) => [24, 16, 8, 0].map((s) => ((u >>> s) & 255).toString(2).padStart(8, "0")).join(".");
  const binPrefix = (u, len) => { let b = "", i = 0; for (const ch of bin(u)) { if (ch === ".") { b += "."; continue; } b += i < len ? ch : "·"; i++; } return b; };
  /** Ең ұзын префикс: сәйкес жолдардың ішінен len ең үлкені. Қайтарады: { best, all } */
  function lpm(rows, ip) {
    const all = rows.filter((r) => matches(ip, ipParse(r.p), r.len));
    const best = all.reduce((b, r) => (!b || r.len > b.len ? r : b), null);
    return { best, all };
  }
  window.CSLabNet = { ipParse, ipStr, matches, lpm };

  // ================================================================ 1. инкапсуляция
  (() => {
    const root = document.querySelector("[data-cslab=encap]");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const A = { ip: "192.168.1.10", mac: "3c:52:a1:00:00:10" }, G = { ip: "192.168.1.1", mac: "00:1a:2b:00:01:01" }, G2 = { mac: "00:1a:2b:00:02:01" }, S = { ip: "203.0.113.80", mac: "52:54:00:00:00:80" };
    const DEV = ["Ноутбук", "R1", "Сервер"];
    const LAYERS = [[5, "Қолданбалы", "HTTP"], [4, "Көліктік", "TCP"], [3, "Желілік", "IP"], [2, "Арналық", "Ethernet"], [1, "Физикалық", "биттер"]];
    let frames = [];
    function build() {
      const msg = $("[data-k=msg]").value || "GET / HTTP/1.1";
      const N = utf8(msg), tcpLen = 20 + N, ipLen = 20 + tcpLen, pay = Math.max(46, ipLen), pad = pay - ipLen, fLen = 14 + pay + 4, ack = 1001 + N;
      const eth1 = { src: A.mac, dst: G.mac, dstName: "R1" }, eth2 = { src: G2.mac, dst: S.mac, dstName: "сервер" };
      const bitsOf = (mac) => mac.split(":").slice(0, 2).map((h) => parseInt(h, 16).toString(2).padStart(8, "0")).join(" ");
      const P = { msg, N, tcpLen, ipLen, pad, fLen, ack };
      const f = (dev, layer, pdu, extra, m) => ({ dev, layer, pdu, ...extra, msg: m, P });
      const padTxt = pad ? ` Хабар қысқа болғандықтан, кадр жүктемесі ең аз 46 байтқа дейін ${pad} байт толтырумен (padding) толықтырылды.` : "";
      frames = [
        f(0, 5, ["data"], { hi: "data", ttl: 64 }, `Браузер HTTP сұрауын құрады: «${msg}» - ${N} байт (UTF-8). Әзірге бұл жай мәтін: қай компьютерге, қай бағдарламаға жететіні жазылмаған.`),
        f(0, 4, ["tcp", "data"], { hi: "tcp", ttl: 64, ask: {
          q: "TCP тақырыбындағы қабылдаушы порт (dst port) қандай болады?", skill: "cs.net.encap", title: "Инкапсуляция: қабылдаушы порт", item: "port",
          opts: [{ id: "80", label: "80" }, { id: "51514", label: "51514" }, { id: "443", label: "443" }], answer: "80", okWhy: "Порт - серверде қай бағдарлама (қызмет) күтіп тұрғанын көрсетеді: http:// үшін веб-сервер 80-портта.",
          why: (x) => x === "51514" ? ["Бұл жіберушінің порты", "51514 - браузерге ОЖ берген уақытша (ephemeral) порт; ол жіберуші порт (src port) өрісінде тұрады, сервер жауапты соған қайтарады. Қабылдаушы порт серверде қай қызмет күтетінін көрсетеді: HTTP - 80.", "src-dst-port"]
            : ["443 - HTTPS порты", "443 - шифрланған HTTPS (TLS) қызметінің порты. Біздің сұрау шифрланбаған http:// арқылы, сондықтан қабылдаушы порт 80.", "https-port"] } },
          `TCP тақырыбы (20 байт) қосылды: жіберуші порт 51514 (браузерге берілген уақытша порт) → қабылдаушы порт 80 (веб-сервер). seq = 1001 - сегменттің бірінші байтының нөмірі; ack = 5001 - серверден күтілетін келесі байт (байланыс бұрын орнаған). Сегмент: 20 + ${N} = ${tcpLen} байт.`),
        f(0, 3, ["ip", "tcp", "data"], { hi: "ip", ttl: 64 }, `IP тақырыбы (20 байт): жіберуші ${A.ip} → қабылдаушы ${S.ip}, TTL = 64, протокол = 6 (ішінде TCP бар). Пакет: 20 + ${tcpLen} = ${ipLen} байт.`),
        f(0, 2, ["eth", "ip", "tcp", "data"], { hi: "eth", eth: eth1, ttl: 64, ask: {
          q: "Ноутбуктан шығатын Ethernet кадрында қабылдаушы MAC-адрес кімдікі?", skill: "cs.net.encap", title: "Инкапсуляция: қабылдаушы MAC", item: "mac",
          opts: [{ id: "srv", label: "Сервердікі" }, { id: "gw", label: "R1-дікі (әдепкі шлюз)" }, { id: "bc", label: "ff:ff:ff:ff:ff:ff (бәріне)" }], answer: "gw",
          okWhy: "MAC-адрес бір арнаның (бір жергілікті желінің) ішінде ғана жұмыс істейді. Сервер басқа желіде, сондықтан кадр алдымен шлюзге (R1) жіберіледі; оның MAC-ын ноутбук ARP арқылы біледі.",
          why: (x) => x === "srv" ? ["Сервер басқа желіде", `Ноутбук өз желісі 192.168.1.0/24 екенін біледі; ${S.ip} оған кірмейді. MAC-адрес тек бір арнада мағыналы - сервердің MAC-ы бұл арнада жоқ. IP-адрес «соңғы мекенжай», ал MAC - «келесі аялдама»: келесі аялдама - шлюз R1.`, "mac-end-to-end"]
            : ["Кеңтаратым мұнда қолданылмайды", "ff:ff:ff:ff:ff:ff - желідегі барлық құрылғыға арналған адрес; ол ARP сұрауында («192.168.1.1 кімдікі?») қолданылады. Жауап келген соң деректер кадры нақты шлюздің MAC-ына жіберіледі.", "broadcast"] } },
          `Ноутбук ${S.ip} өз желісінде (192.168.1.0/24) емес екенін көріп, пакетті шлюзге (R1, ${G.ip}) береді; R1-дің MAC-ын ARP арқылы біледі. Ethernet тақырыбы (14 байт): ${A.mac} → ${G.mac} (R1), түрі 0x0800 (ішінде IPv4); соңында FCS (4 байт, қате тексеру).${padTxt} Кадр: ${fLen} байт.`),
        f(0, 1, ["eth", "ip", "tcp", "data"], { hi: "bits", eth: eth1, ttl: 64, bits: bitsOf(G.mac) }, `Физикалық қабат кадрды биттерге айналдырады: ${fLen} × 8 = ${fLen * 8} бит (кадр басындағы преамбула есепке алынбады). Алғашқы биттер - қабылдаушы MAC: ${bitsOf(G.mac)} ...`),
        f(1, 2, ["ip", "tcp", "data"], { hi: "strip-eth", ttl: 64 }, `R1 биттерден кадрды жинады. Қабылдаушы MAC - өзінікі, FCS дұрыс → Ethernet тақырыбы мен FCS алынып тасталады. Ішінде - IP пакеті.`),
        f(1, 3, ["ip", "tcp", "data"], { hi: "ttl", ttl: 63, ask: {
          q: "R1 пакетті әрі жібергенде IP тақырыбындағы TTL неше болады?", num: true, label: "TTL", skill: "cs.net.encap", title: "Инкапсуляция: TTL", item: "ttl", answer: 63,
          okWhy: "Әр маршрутизатор TTL-ді 1-ге азайтады: 64 − 1 = 63. Ноутбук (хост) TTL-ді азайтпайды.",
          why: (x) => x === 64 ? ["TTL азаяды", "Маршрутизатор әр пакетті жібермес бұрын TTL-ді 1-ге азайтады - әйтпесе маршрут циклына түскен пакет желіде мәңгі айналар еді. 64 − 1 = 63.", "ttl-no-dec"]
            : x === 62 ? ["Хост TTL-ді азайтпайды", "TTL-ді тек маршрутизаторлар азайтады; ноутбук пакетті TTL = 64-пен шығарды. Әзірге бір ғана маршрутизатор (R1) өтті: 64 − 1 = 63.", "ttl-host"]
            : ["TTL бір-бірлеп азаяды", "TTL - секунд не байт емес, «секіріс» санағышы: әр маршрутизатор 1-ге азайтады. 64 − 1 = 63.", "ttl-other"] } },
          `R1 IP тақырыбын оқиды: қабылдаушы ${S.ip}. Маршрут кестесі бойынша 203.0.113.0/24 желісі R1-дің eth1 интерфейсіне тікелей қосылған. TTL 64 → 63 (тақырыптың бақылау сомасы қайта есептеледі). IP-адрестер өзгермейді. R1 TCP тақырыбын ашпайды - ол 3-қабат құрылғысы.`),
        f(1, 2, ["eth", "ip", "tcp", "data"], { hi: "eth", eth: eth2, ttl: 63, ask: {
          q: "R1 жаңа кадр құрды. Ноутбуктан шыққан кадрмен салыстырғанда не өзгерді?", skill: "cs.net.encap", title: "Инкапсуляция: жолда не өзгереді", item: "hop-change",
          opts: [{ id: "mac", label: "MAC-адрестер мен TTL; IP-адрестер сол күйі" }, { id: "ip", label: "Қабылдаушы IP енді R1-дікінен сервердікіне ауысты" }, { id: "port", label: "TCP порттары ауысты" }], answer: "mac",
          okWhy: "Әр арнада жаңа кадр: src - R1-дің eth1 MAC-ы, dst - сервердің MAC-ы. IP пакетінде тек TTL (және бақылау сомасы) өзгерді.",
          why: (x) => x === "ip" ? ["Қабылдаушы IP басынан сервердікі", `Ноутбук пакетке басынан ${S.ip} жазды - IP «соңғы мекенжай», ол жол бойы өзгермейді. Шлюзге жету үшін тек MAC-адрес (кадр) R1-дікі болды.`, "ip-per-hop"]
            : ["Маршрутизатор TCP-ге тиіспейді", "R1 тек 1-3 қабаттарды өңдейді. Порттар - 4-қабаттың (TCP) өрістері, олар тек ноутбук пен серверде оқылады.", "router-l4"] } },
          `R1 келесі арнаға жаңа кадр құрады: ${G2.mac} (R1-дің eth1) → ${S.mac} (сервер). IP пакеті ішінде: ${A.ip} → ${S.ip}, TTL = 63. Порттар мен деректер - өзгермеген.`),
        f(1, 1, ["eth", "ip", "tcp", "data"], { hi: "bits", eth: eth2, ttl: 63, bits: bitsOf(S.mac) }, `Кадр қайтадан биттерге айналып, серверге қарай кабельмен кетеді (${fLen * 8} бит).`),
        f(2, 2, ["ip", "tcp", "data"], { hi: "strip-eth", ttl: 63 }, `Сервер кадрды қабылдады: қабылдаушы MAC - өзінікі, FCS дұрыс → Ethernet тақырыбы алынды.`),
        f(2, 3, ["tcp", "data"], { hi: "strip-ip", ttl: 63 }, `Қабылдаушы IP ${S.ip} - өзінікі. TTL = 63 болып жетті. Протокол = 6 → ішіндегіні TCP модуліне береді. IP тақырыбы алынды.`),
        f(2, 4, ["data"], { hi: "strip-tcp", ttl: 63, ask: {
          q: `Сервер seq = 1001, ұзындығы ${N} байт сегментті қабылдады. Растауда (ACK) қандай ack нөмірін жібереді?`, num: true, label: "ack", skill: "cs.net.encap", title: "Инкапсуляция: ack нөмірі", item: "ack", answer: ack,
          okWhy: `ack = келесі күтілетін байт = 1001 + ${N} = ${ack}. Сегмент 1001-ден ${ack - 1}-ге дейінгі байттарды әкелді.`,
          why: (x) => x === 1001 ? ["ack - келесі күтілетін байт", `ack «осыны алдым» емес, «енді осыны күтемін» дейді: 1001 + ${N} = ${ack}.`, "ack-is-seq"]
            : x === ack + 1 ? ["Артық бір", `Байттар 1001-ден ${ack - 1}-ге дейін нөмірленген, келесі күтілетіні - ${ack}. +1 тек SYN мен FIN жалаушаларына қосылады, деректерге емес.`, "plus-one"]
            : ["seq + ұзындық", `ack = seq + деректер ұзындығы = 1001 + ${N} = ${ack}. Ұзындық - хабардың UTF-8 байт саны (${N}), тақырыптар есептелмейді.`, "ack-len"] } },
          `Қабылдаушы порт 80 → сегмент веб-сервер бағдарламасына беріледі. seq = 1001, ${N} байт → сервер ack = ${ack} жібереді. TCP тақырыбы алынды.`),
        f(2, 5, ["data"], { hi: "data", ttl: 63, done: true }, `Веб-сервер мәтінді алды: «${msg}». Барлығы ${N} байт деректер үшін ${14 + 20 + 20 + 4} байт тақырып (+ ${pad} толтыру) жіберілді - тиімділік ${Math.round((100 * N) / fLen)}%.`),
      ];
    }
    function render(F) {
      const P = F.P;
      $(".nw-path").innerHTML = "";
      DEV.forEach((d, i) => $(".nw-path").append(el("li", { class: i === F.dev ? "cur" : i < F.dev ? "past" : "", "aria-current": i === F.dev ? "step" : null, text: d })));
      $(".nw-layers").innerHTML = "";
      LAYERS.forEach(([n, name, proto]) => $(".nw-layers").append(el("li", { class: n === F.layer ? "cur" : "", "aria-current": n === F.layer ? "step" : null }, el("b", { text: `${n}` }), ` ${name} `, el("small", { text: proto }))));
      const box = (cls, label, inner, extra) => el("div", { class: "nw-l " + cls + (F.hi === cls ? " hi" : "") }, el("span", { class: "nw-tag", text: label }), inner, extra);
      let node = box("data", `Деректер · ${P.N} B`, el("code", { text: P.msg }));
      if (F.pdu.includes("tcp")) node = box("tcp", `TCP · 20 B · 51514 → 80 · seq 1001 · ack 5001 · PSH, ACK`, node);
      if (F.pdu.includes("ip")) node = box("ip", `IP · 20 B · ${A.ip} → ${S.ip} · TTL ${F.ttl} · протокол 6`, node);
      if (F.pdu.includes("eth")) node = el("div", { class: "nw-l eth" + (F.hi === "eth" || F.hi === "bits" ? " hi" : "") }, el("span", { class: "nw-tag", text: `Ethernet · 14 B · ${F.eth.src} → ${F.eth.dst} (${F.eth.dstName}) · 0x0800` }), node, P.pad ? el("span", { class: "nw-tag nw-pad", text: `толтыру · ${P.pad} B` }) : null, el("span", { class: "nw-tag nw-fcs", text: "FCS · 4 B" }));
      const pdu = $(".nw-pdu"); pdu.innerHTML = "";
      if (F.bits) pdu.append(el("p", { class: "nw-bits-line", text: `${F.bits} …` }));
      if (F.hi && F.hi.startsWith("strip")) pdu.append(el("p", { class: "nw-strip", text: { "strip-eth": "Ethernet тақырыбы мен FCS алынды ↑", "strip-ip": "IP тақырыбы алынды ↑", "strip-tcp": "TCP тақырыбы алынды ↑" }[F.hi] }));
      pdu.append(node);
      const lay = F.pdu.includes("eth") ? "кадр" : F.pdu.includes("ip") ? "IP пакеті" : F.pdu.includes("tcp") ? "TCP сегменті" : "деректер";
      pdu.setAttribute("aria-label", `${DEV[F.dev]}, ${F.layer}-қабат: ${lay}. ${F.msg}`);
      const sz = F.pdu.includes("eth") ? P.fLen : F.pdu.includes("ip") ? P.ipLen : F.pdu.includes("tcp") ? P.tcpLen : P.N;
      $("[data-k=size]").textContent = `Қазіргі өлшем: ${sz} байт (${lay}). Деректер ${P.N} B · TCP сегменті ${P.tcpLen} B · IP пакеті ${P.ipLen} B · кадр ${P.fLen} B.`;
    }
    build();
    const st = C.stepper(root, { frames: () => frames, render, delay: 1700 });
    $("[data-k=msg]").addEventListener("input", () => { build(); st.reload(); });
    st.paint();
  })();

  // ================================================================ 2. маршруттау
  const NODES = { H: [52, 180, "Ноутбук", "10.0.0.5"], R1: [180, 180, "R1"], R2: [320, 70, "R2"], R3: [320, 290, "R3"], R4: [455, 180, "R4"], LB: [492, 52, "LAN B", "10.1.0.0/16"], LC: [492, 308, "LAN C", "10.1.2.0/24"], SV: [560, 250, "Сервер", "203.0.113.0/24"] };
  const LINKS = [["H", "R1", "eth0"], ["R1", "R2", "eth1"], ["R1", "R3", "eth2"], ["R1", "R4", "eth3"], ["R2", "R3", "eth2"], ["R2", "LB", "eth0"], ["R3", "LC", "eth0"], ["R3", "R4", "eth3"], ["R4", "SV", "eth0"]];
  const LAN_NAME = { LA: "LAN A (ноутбук)", LB: "LAN B", LC: "LAN C", SV: "сервер желісі" };
  function tables(loop) {
    const r = (p, len, ifc, to, lan) => ({ p, len, ifc, to, lan });
    return {
      H: [r("10.0.0.0", 24, "eth0", null, "LA"), r("0.0.0.0", 0, "eth0", "R1")],
      R1: [r("10.0.0.0", 24, "eth0", null, "LA"), r("10.1.0.0", 16, "eth1", "R2"), loop ? r("10.1.2.0", 24, "eth1", "R2") : r("10.1.2.0", 24, "eth2", "R3"), r("0.0.0.0", 0, "eth3", "R4")],
      R2: [r("10.1.0.0", 16, "eth0", null, "LB"), loop ? r("10.1.2.0", 24, "eth1", "R1") : r("10.1.2.0", 24, "eth2", "R3"), r("10.0.0.0", 8, "eth1", "R1"), r("0.0.0.0", 0, "eth1", "R1")],
      R3: [r("10.1.2.0", 24, "eth0", null, "LC"), r("10.1.0.0", 16, "eth2", "R2"), r("10.0.0.0", 8, "eth1", "R1"), r("0.0.0.0", 0, "eth3", "R4")],
      R4: [r("203.0.113.0", 24, "eth0", null, "SV"), r("10.0.0.0", 24, "eth1", "R1"), r("10.1.0.0", 16, "eth1", "R1"), r("10.1.2.0", 24, "eth2", "R3")],
    };
  }
  const NM = (id) => ({ H: "Ноутбук", LB: "LAN B", LC: "LAN C", SV: "Сервер" })[id] || id;
  const pathStr = (p) => p.map(NM).join(" → ");
  const target = (row) => (row.to ? `${row.to} (${row.ifc})` : `тікелей: ${LAN_NAME[row.lan]} (${row.ifc})`);
  const pre = (row) => `${row.p}/${row.len}`;
  /** Маршрут симуляциясы. Қайтарады: { frames, path (түйіндер), result: delivered|ttl|noroute|local, ttlEnd, hops } */
  function routeSim(dst, ttl0, loop, opt = {}) {
    const TB = tables(loop), ip = ipParse(dst), frames = [], path = ["H"], log = [];
    const h = lpm(TB.H, ip);
    if (h.best.to == null) {
      frames.push({ at: "H", path: path.slice(), table: "H", rows: TB.H, m: h, msg: `Ноутбук өз кестесіне қарайды: ${dst} өз желісінде (10.0.0.0/24, /24 сәйкес) → маршрутизатор керек емес. Пакет ARP арқылы табылған хостқа тікелей жіберіледі, TTL = ${ttl0} өзгермейді.` });
      return { frames, path, result: "local", ttlEnd: ttl0, hops: 0, log };
    }
    frames.push({ at: "H", path: path.slice(), table: "H", rows: TB.H, m: h, msg: `Ноутбук өз кестесіне қарайды: ${dst} 10.0.0.0/24-ке кірмейді, тек 0.0.0.0/0 сәйкес → пакет әдепкі шлюзге (R1) кетеді. Хост TTL-ді азайтпайды: TTL = ${ttl0}.` });
    let at = "R1", ttl = ttl0, hop = 0, result = null;
    while (hop < 80) {
      hop++; path.push(at);
      const m = lpm(TB[at], ip), rows = TB[at], best = m.best;
      const optsSet = []; rows.forEach((r) => { const t = target(r); if (!optsSet.some((o) => o.label === t)) optsSet.push({ id: t, label: t }); });
      optsSet.push({ id: "drop", label: "Тастайды" });
      const correct = ttl <= 1 || !best ? "drop" : target(best);
      const mlist = m.all.length ? m.all.map(pre).join(", ") : "жоқ";
      const ask = opt.noAsk || hop > 3 ? null : {
        q: `${at}-ге TTL = ${ttl} пакет келді (қабылдаушы ${dst}). ${at} оны қайда жібереді?`, skill: "cs.net.route", title: "Маршруттау: келесі секіріс", item: "next-hop", opts: optsSet, answer: correct,
        okWhy: ttl <= 1 ? `TTL = ${ttl}: 1 − 1 = 0 → пакет тасталады, жіберушіге ICMP Time Exceeded кетеді.` : best ? `Сәйкес жолдар: ${mlist}. Ең ұзыны ${pre(best)} → ${target(best)}.` : `${dst}-ге сәйкес жол да, әдепкі маршрут та жоқ → тасталады.`,
        why: (x) => {
          if (correct === "drop" && ttl <= 1) return ["TTL таусылды", `${at}-ге TTL = ${ttl} келді. Маршрутизатор TTL-ді азайтады: ${ttl} − 1 = 0 - мұндай пакет әрі жіберілмейді, тасталады (ICMP Time Exceeded). Кесте бұл жерде шешпейді.`, "ttl-zero"];
          if (correct === "drop") return ["Сәйкес жол жоқ", `${at} кестесіндегі ешбір префикс ${dst}-ге сәйкес келмейді, ал әдепкі маршрут (0.0.0.0/0) бұл кестеде жоқ. Сондықтан пакет тасталады (ICMP Destination Unreachable).`, "no-route"];
          if (x === "drop") return ["Сәйкес жол бар", `Сәйкес жолдар: ${mlist}; TTL = ${ttl} > 1. Пакет ${target(best)} бағытымен жіберіледі.`, "drop-wrong"];
          const chosen = rows.filter((r) => target(r) === x);
          const anyMatch = chosen.find((r) => m.all.includes(r));
          if (!anyMatch) { const r0 = chosen[0]; return ["Бұл префикс сәйкес келмейді", `${pre(r0)} ${ipStr((ipParse(r0.p) & mask(r0.len)) >>> 0)} - ${ipStr(((ipParse(r0.p) | ~mask(r0.len)) >>> 0))} аралығын қамтиды; ${dst} оған кірмейді (алғашқы ${r0.len} биті бірдей емес). Сәйкес жолдардың ең ұзыны - ${pre(best)}.`, "no-match"]; }
          if (anyMatch.len === 0) return ["Әдепкі маршрут - соңғы амал", `0.0.0.0/0 кез келген адреске сәйкес келеді, бірақ префиксі ең қысқа (0 бит). Нақтырақ ${pre(best)} сәйкес келгенде әдепкі маршрут қолданылмайды.`, "default-first"];
          return ["Қысқарақ префикс", `${pre(anyMatch)} шынымен сәйкес келеді, бірақ ${pre(best)} одан ұзын (${best.len} > ${anyMatch.len}) - нақтырақ. Ең ұзын префикс ережесі: нақтысы жеңеді.`, "shorter-prefix"];
        },
      };
      if (ttl <= 1) {
        log.push({ at, ttl, out: "drop-ttl" });
        frames.push({ at, path: path.slice(), table: at, rows, m, ask, ttl, drop: true, msg: `${at}: TTL = ${ttl} келді, ${ttl} − 1 = 0 → пакет тасталады. ${at} жіберушіге (10.0.0.5) ICMP Time Exceeded хабарын қайтарады.${loop && hop > 2 ? " Пакет маршрут циклында айналды - TTL болмаса, ол желіде мәңгі жүрер еді." : ""}` });
        result = "ttl"; break;
      }
      if (!best) {
        log.push({ at, ttl, out: "drop-noroute" });
        frames.push({ at, path: path.slice(), table: at, rows, m, ask, ttl, drop: true, msg: `${at} кестесінде ${dst}-ге сәйкес жол жоқ, әдепкі маршрут (0.0.0.0/0) та жоқ → пакет тасталады, жіберушіге ICMP Destination Unreachable кетеді.` });
        result = "noroute"; break;
      }
      const nttl = ttl - 1;
      log.push({ at, ttl, out: best.to || best.lan });
      if (best.to == null) {
        frames.push({ at, path: path.slice(), table: at, rows, m, ask, ttl, msg: `${at}: сәйкес жолдар ${mlist}; ең ұзыны ${pre(best)} - ${LAN_NAME[best.lan]} тікелей ${best.ifc}-те. TTL ${ttl} → ${nttl}. ${at} ARP арқылы хостың MAC-ын тауып, жаңа кадрмен жеткізеді.` });
        path.push(best.lan === "LA" ? "H" : best.lan); ttl = nttl;
        frames.push({ at: best.lan, path: path.slice(), done: true, ttl, ask: opt.noAsk ? null : {
          q: `Пакет ${ttl0} TTL-мен шықты. Қабылдаушы хост оны қандай TTL-мен алады?`, num: true, label: "TTL", skill: "cs.net.route", title: "Маршруттау: TTL", item: "ttl", answer: ttl,
          okWhy: `${hop} маршрутизатор өтті: ${ttl0} − ${hop} = ${ttl}. Хосттар TTL-ді азайтпайды.`,
          why: (x) => x === ttl0 - hop - 1 ? ["Ноутбук азайтпайды", `TTL-ді тек маршрутизаторлар азайтады. Жолда ${hop} маршрутизатор: ${ttl0} − ${hop} = ${ttl}.`, "ttl-host"] : x === ttl0 ? ["TTL азаяды", `Әр маршрутизатор TTL-ді 1-ге азайтады. Жолда ${hop} маршрутизатор: ${ttl0} − ${hop} = ${ttl}.`, "ttl-no-dec"] : ["Маршрутизаторларды санаңыз", `Жол: ${path.filter((p) => p[0] === "R").join(" → ")} - ${hop} маршрутизатор. ${ttl0} − ${hop} = ${ttl}.`, "ttl-count"] },
          msg: `Жетті: ${dst} хосты пакетті TTL = ${ttl} күйінде алды (${ttl0} − ${hop}). Жол: ${pathStr(path)}. IP-адрестер жол бойы өзгермеді, ал әр арнада жаңа кадр (жаңа MAC-адрестер) болды.` });
        result = "delivered"; break;
      }
      frames.push({ at, path: path.slice(), table: at, rows, m, ask, ttl, msg: `${at}: сәйкес жолдар ${mlist}; ең ұзыны ${pre(best)} → ${best.ifc} арқылы ${best.to}-ге. TTL ${ttl} → ${nttl}.${m.all.length > 1 ? ` (${m.all.filter((r) => r !== best).map(pre).join(", ")} да сәйкес, бірақ қысқарақ.)` : ""}` });
      ttl = nttl; at = best.to;
    }
    return { frames, path, result, ttlEnd: ttl, hops: hop, log };
  }
  window.CSLabNet.routeSim = routeSim;

  (() => {
    const root = document.querySelector("[data-cslab=route]");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const PRESET = [["10.1.2.77", "10.1.2.77 (LAN C)"], ["10.1.9.4", "10.1.9.4 (LAN B)"], ["203.0.113.80", "203.0.113.80 (сервер)"], ["10.0.0.9", "10.0.0.9 (көрші ноутбук)"], ["198.51.100.7", "198.51.100.7 (белгісіз желі)"]];
    PRESET.forEach(([v, l]) => $("[data-k=dst]").append(el("option", { value: v, text: l })));
    const svg = $("svg");
    // статикалық топология
    LINKS.forEach(([a, b, ifc]) => {
      const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
      svg.append(sv("line", { class: "nw-link", "data-l": `${a}-${b}`, x1, y1, x2, y2 }));
      if (a[0] === "R") svg.append(sv("text", { class: "nw-ifc", x: x1 + (x2 - x1) * 0.24, y: y1 + (y2 - y1) * 0.24 - 6, "text-anchor": "middle" }, ifc));
    });
    Object.entries(NODES).forEach(([id, [x, y, name, sub]]) => {
      const g = sv("g", { class: "nw-node" + (id[0] === "R" ? " rt" : " lan"), "data-n": id });
      const w = id[0] === "R" ? 52 : 92, hh = id[0] === "R" ? 36 : 44;
      g.append(sv("rect", { x: x - w / 2, y: y - hh / 2, width: w, height: hh, rx: id[0] === "R" ? 18 : 8 }));
      g.append(sv("text", { x, y: sub ? y - 3 : y + 6, "text-anchor": "middle", class: "nw-nn" }, name));
      if (sub) g.append(sv("text", { x, y: y + 14, "text-anchor": "middle", class: "nw-ns" }, sub));
      svg.append(g);
    });
    const pkt = sv("circle", { class: "nw-pkt", r: 9, cx: NODES.H[0], cy: NODES.H[1] - 30 });
    const ttlT = sv("text", { class: "nw-ttl", x: 0, y: 0, "text-anchor": "middle" }, "");
    const xMark = sv("text", { class: "nw-x", x: -50, y: -50, "text-anchor": "middle" }, "✕");
    svg.append(pkt, ttlT, xMark);
    let run = null;
    function dstVal() { return $("[data-k=dst]").value; }
    function build() { run = routeSim(dstVal(), +$("[data-k=ttl]").value, $("[data-k=loop]").checked); }
    function render(F) {
      svg.querySelectorAll(".nw-link").forEach((l) => l.classList.remove("on"));
      for (let i = 1; i < F.path.length; i++) {
        const a = F.path[i - 1], b = F.path[i];
        const l = svg.querySelector(`[data-l="${a}-${b}"]`) || svg.querySelector(`[data-l="${b}-${a}"]`); if (l) l.classList.add("on");
      }
      svg.querySelectorAll(".nw-node").forEach((g) => g.classList.toggle("cur", g.dataset.n === (F.at === "LA" ? "H" : F.at)));
      const [x, y] = NODES[F.at === "LA" ? "H" : F.at];
      pkt.setAttribute("cx", x); pkt.setAttribute("cy", y - 32);
      ttlT.setAttribute("x", x); ttlT.setAttribute("y", y - 46); ttlT.textContent = F.ttl != null ? `TTL ${F.ttl}` : `TTL ${+$("[data-k=ttl]").value}`;
      if (F.drop) { xMark.setAttribute("x", x + 30); xMark.setAttribute("y", y - 22); } else { xMark.setAttribute("x", -50); xMark.setAttribute("y", -50); }
      svg.setAttribute("aria-label", `Желі топологиясы. Пакет қазір: ${NM(F.at)}. Жүрген жолы: ${pathStr(F.path)}.`);
      $("[data-k=hops]").textContent = `Жол: ${pathStr(F.path)}`;
      // кесте
      const tid = F.table, rt = $("[data-k=rt]");
      rt.innerHTML = "";
      const bits = $("[data-k=bits]"); bits.innerHTML = "";
      if (!tid) { $("[data-k=tname]").textContent = "Маршруттау кестесі"; rt.append(el("caption", { text: "Пакет жеткізілді - кесте қаралмайды." })); return; }
      $("[data-k=tname]").textContent = tid === "H" ? "Ноутбуктың маршрут кестесі" : `${tid} маршрут кестесі`;
      rt.append(el("thead", null, el("tr", null, el("th", { scope: "col", text: "Префикс" }), el("th", { scope: "col", text: "Қайда" }), el("th", { scope: "col", text: "Сәйкес пе?" }))));
      const tb = el("tbody"); const ipn = ipParse(dstVal());
      F.rows.forEach((r) => {
        const mt = F.m.all.includes(r), best = F.m.best === r && !F.drop;
        tb.append(el("tr", { class: (mt ? "mt" : "") + (best ? " best" : "") }, el("td", { text: pre(r) }), el("td", { text: tid === "H" && r.to ? "R1 (шлюз 10.0.0.1)" : target(r) }), el("td", { text: mt ? `иә, /${r.len}` + (best ? " ← ең ұзын" : "") : "жоқ" })));
      });
      rt.append(tb);
      bits.append(el("p", { class: "nw-bl" }, el("span", { text: `${dstVal()}` }), el("code", { text: bin(ipn) })));
      F.rows.forEach((r) => { const mt = F.m.all.includes(r); bits.append(el("p", { class: "nw-bl" + (mt ? " mt" : "") }, el("span", { text: `${pre(r)} ${mt ? "✓" : "✗"}` }), el("code", { text: binPrefix(ipParse(r.p), r.len) }))); });
    }
    build();
    const st = C.stepper(root, { frames: () => run.frames, render, delay: 1600 });
    const rebuild = () => { $("[data-k=err]").textContent = ""; build(); st.reload(); };
    ["dst", "ttl", "loop"].forEach((k) => $(`[data-k=${k}]`).addEventListener("change", rebuild));
    const cust = $("[data-k=custom]");
    const useCustom = () => {
      const v = cust.value.trim(); if (!v) return;
      const u = ipParse(v);
      if (u == null) { $("[data-k=err]").textContent = "IPv4 адрес нүктемен бөлінген төрт саннан тұрады (әрқайсысы 0-255), мысалы 10.1.2.130."; return; }
      let o = $("[data-k=dst] option[data-custom]");
      if (!o) { o = el("option", { "data-custom": "1" }); $("[data-k=dst]").append(o); }
      o.value = ipStr(u); o.textContent = `${ipStr(u)} (өзіңіздікі)`; $("[data-k=dst]").value = ipStr(u); rebuild();
    };
    cust.addEventListener("change", useCustom);
    cust.addEventListener("keydown", (e) => { if (e.key === "Enter") useCustom(); });
    st.paint();
  })();

  // ================================================================ 3. TCP
  /** TCP симуляциясы. Уақыт бүтін, жол D = 3. Бір уақыттағы оқиғалар реті: клиентке ACK келуі → серверге сегмент келуі → жіберу → RTO. */
  function tcpSim({ n, lost, fr, isn = 4000, sisn = 9000, mss = 100, D = 3, RTO = 16 }) {
    const msgs = [], frames = [], end = isn + 1 + n * mss;
    const ev = []; // { t, ord, type, ... }
    const push = (e) => ev.push(e);
    const sendSeg = (t, i, re, why) => { push({ t, ord: 2, type: "send", i, re, why }); };
    // қол алысу кадрлары (оқиға кезегінен тыс, қарапайым)
    let k = 0;
    const S = { una: isn + 1, dup: 0, timer: null, fast: false, est: false, sent: 0, retrans: 0 }, Rv = { nxt: isn + 1, buf: [] };
    const snap = () => ({ una: S.una, dup: S.dup, timer: S.timer, nxt: Rv.nxt, buf: Rv.buf.slice().sort((a, b) => a - b), end });
    const fpush = (o) => frames.push({ ...o, ms: msgs.length, st: snap() });
    fpush({ t: 0, msg: `Байланыс жоқ. Клиент өз бастапқы нөмірін (ISN) ${isn} деп таңдады; сервердікі - ${sisn}. Әр жол 3 уақыт бірлігі жүреді.` });
    msgs.push({ from: "c", t0: 0, t1: D, label: `SYN seq=${isn}` });
    fpush({ t: 0, cur: msgs.length - 1, msg: `t = 0. Клиент SYN жібереді: seq = ${isn}. SYN жалаушасы бір реттік нөмір «алады».` });
    msgs.push({ from: "s", t0: D, t1: 2 * D, label: `SYN-ACK seq=${sisn} ack=${isn + 1}` });
    fpush({ t: D, cur: msgs.length - 1, ask: { q: "Сервер SYN-ACK жібереді. Оның ішіндегі ack нөмірі неше?", num: true, label: "ack", skill: "cs.net.tcp", title: "TCP: қол алысудағы ack", item: "syn-ack", answer: isn + 1,
      okWhy: `SYN бір нөмір алады, сондықтан келесі күтілетіні ${isn} + 1 = ${isn + 1}.`,
      why: (x) => x === isn ? ["ack - келесі күтілетін нөмір", `Сервер ${isn}-ді алды; ack «енді мынаны күтемін» дейді: ${isn} + 1 = ${isn + 1}. SYN бір реттік нөмір алатыны осы үшін.`, "ack-is-seq"] : x === sisn + 1 ? ["Бұл клиенттің ack-і болады", `${sisn} + 1 - клиент серверге жіберетін растау (ACK). Сервер клиенттің ${isn} нөмірін растайды: ${isn + 1}.`, "ack-side"] : ["SYN + 1", `Клиенттің ISN = ${isn}, SYN бір нөмір алады → ack = ${isn + 1}.`, "ack-other"] },
      msg: `t = ${D}. Сервер SYN алды. Ол SYN-ACK жібереді: өз нөмірі seq = ${sisn} және ack = ${isn + 1} («${isn}-ді алдым, енді ${isn + 1}-ді күтемін»).` });
    msgs.push({ from: "c", t0: 2 * D, t1: 3 * D, label: `ACK seq=${isn + 1} ack=${sisn + 1}` });
    fpush({ t: 2 * D, cur: msgs.length - 1, ask: { q: "Клиент үшінші хабарды (ACK) жібереді. Ондағы ack нөмірі неше?", num: true, label: "ack", skill: "cs.net.tcp", title: "TCP: үшінші қадамдағы ack", item: "ack3", answer: sisn + 1,
      okWhy: `Клиент сервердің SYN-ін (seq = ${sisn}) растайды: ${sisn + 1}.`,
      why: (x) => x === isn + 1 ? ["Бұл клиенттің өз seq-і", `${isn + 1} - клиенттің келесі seq нөмірі. ack сервердің нөмірін растайды: ${sisn} + 1 = ${sisn + 1}.`, "ack-side"] : x === sisn ? ["+1 ұмытылды", `Сервердің SYN-і де бір нөмір алады: ack = ${sisn} + 1 = ${sisn + 1}.`, "ack-is-seq"] : ["Сервердің ISN + 1", `Сервердің ISN = ${sisn} → ack = ${sisn + 1}.`, "ack-other"] },
      msg: `t = ${2 * D}. Клиент ACK жібереді: seq = ${isn + 1}, ack = ${sisn + 1}. Клиент үшін байланыс орнады (ESTABLISHED) - ол деректерді бірден жібере бастайды.` });
    // деректер
    const t0 = 2 * D + 1;
    for (let i = 1; i <= n; i++) sendSeg(t0 + i - 1, i, false);
    let askedAck = false, askedDup = false, askedJump = false, askedRe = false;
    let guard = 0;
    while (ev.length && guard++ < 500) {
      ev.sort((a, b) => a.t - b.t || a.ord - b.ord || a.seq0 - b.seq0 || 0);
      // RTO оқиғасын тексеру: таймер ең жақын оқиғадан бұрын/тең болса
      const e0 = ev[0];
      if (S.timer != null && S.timer <= e0.t && !(S.timer === e0.t && e0.ord < 3)) { fireRto(S.timer); continue; }
      ev.shift();
      handle(e0);
      if (!ev.length && S.timer != null && S.una < end) fireRto(S.timer);
    }
    function fireRto(t) {
      const i = (S.una - isn - 1) / mss + 1;
      fpush({ t, rto: true, msg: `t = ${t}. Уақыт шегі (RTO) өтті: seq = ${S.una} сегментіне растау келмеді. Клиент ең ескі расталмаған сегментті қайта жібереді.` });
      S.timer = t + RTO;
      sendSeg(t, i, true, "rto");
    }
    function handle(e) {
      if (e.type === "send") {
        const seq = isn + 1 + (e.i - 1) * mss, isLost = e.i === lost && !e.re;
        if (S.timer == null) S.timer = e.t + RTO;
        if (e.re) S.retrans++;
        msgs.push({ from: "c", t0: e.t, t1: e.t + D, label: `seq=${seq}${e.re ? " (қайта)" : ""}`, lost: isLost, re: e.re });
        const ask = e.re && !askedRe ? (askedRe = true, { q: e.why === "fast" ? "3 қайталанған ACK келді. Клиент қазір не істейді?" : "RTO өтті. Клиент не жібереді?", skill: "cs.net.tcp", title: "TCP: қайта жіберу", item: "retransmit",
          opts: [{ id: "oldest", label: `Тек seq = ${seq} сегментін` }, { id: "all", label: `seq = ${seq}-тен бастап барлық сегментті қайта` }, { id: "last", label: "Соңғы жіберілген сегментті" }], answer: "oldest",
          okWhy: `ack = ${seq} қайталанды → дәл осы байттан бастап жоқ. TCP ең ескі расталмаған сегментті қайта жібереді; қалғандары серверде буферде тұр.`,
          why: (x) => x === "all" ? ["Бұл Go-Back-N", `Барлығын қайта жіберу - Go-Back-N хаттамасының тәсілі. TCP қабылдаушысы ретсіз келгендерді буферде сақтайды, сондықтан тек жетіспейтін seq = ${seq} қайта жіберіледі.`, "go-back-n"] : ["Жетіспейтіні - ack көрсеткен байт", `Қайталанған ack = ${seq} «${seq}-ден бастап күтемін» дейді. Соңғы сегмент жетті (ол буферде) - жетіспейтіні ${seq}.`, "which-seg"] }) : null;
        const lbl = e.re ? `қайта жібереді: seq = ${seq}` : `${e.i}-сегментті жібереді: seq = ${seq}, 100 байт (${seq}-${seq + mss - 1})`;
        fpush({ t: e.t, cur: msgs.length - 1, ask, msg: `t = ${e.t}. Клиент ${lbl}.${isLost ? " Бірақ ол желіде жоғалады (✕) - сервер оны көрмейді." : ""}${S.timer != null && !e.re && e.i === 1 ? ` RTO таймері басталды: t = ${S.timer}-да өтеді.` : ""}` });
        if (!isLost) push({ t: e.t + D, ord: 1, type: "arrS", seq, re: e.re });
      } else if (e.type === "arrS") {
        const before = Rv.nxt, inorder = e.seq === Rv.nxt;
        if (inorder) { Rv.nxt += mss; while (Rv.buf.includes(Rv.nxt)) { Rv.buf.splice(Rv.buf.indexOf(Rv.nxt), 1); Rv.nxt += mss; } }
        else if (e.seq > Rv.nxt && !Rv.buf.includes(e.seq)) Rv.buf.push(e.seq);
        const ack = Rv.nxt, jumped = inorder && ack > e.seq + mss;
        msgs.push({ from: "s", t0: e.t, t1: e.t + D, label: `ack=${ack}`, dup: !inorder });
        let ask = null;
        const mk = (item, title) => ({ q: `Сервер seq = ${e.seq} сегментін алды (күткені ${before}). Ол қандай ack жібереді?`, num: true, label: "ack", skill: "cs.net.tcp", title, item, answer: ack,
          okWhy: inorder ? (jumped ? `Келгені күтілген ${before} еді; буферде ${Array.from({ length: (ack - before) / mss - 1 }, (_, j) => before + mss * (j + 1)).join(", ")} бар → ack ${ack}-ке секіреді.` : `Күтілгені келді: ${e.seq} + 100 = ${ack}.`) : `Күтілгені ${before} - ол әлі жоқ. Жиынтық ack саңылаудан секіре алмайды → тағы ${before} (қайталанған ACK). Сегмент буферге сақталды.`,
          why: (x) => {
            if (!inorder && x === e.seq + mss) return ["Саңылаудан секіруге болмайды", `ack «${x}-ке дейінгі БАРЛЫҚ байтты алдым» дегенді білдірер еді. Бірақ ${before}-${before + mss - 1} байттары жоқ. Жиынтық ack бірінші жетіспейтін байтты көрсетеді: ${before}.`, "skip-gap"];
            if (x === e.seq) return ["ack - келесі күтілетін байт", `ack «осыны алдым» емес, «енді осыны күтемін» дейді.${inorder ? ` ${e.seq} + 100 = ${e.seq + mss}${jumped ? `, ал буферде одан кейінгілер бар → ${ack}` : ""}.` : ` Әзірге ${before} жоқ → ack = ${before}.`}`, "ack-is-seq"];
            if (jumped && x === e.seq + mss) return ["Буфер ұмытылды", `Сервер бұрын ретсіз келген сегменттерді буферде сақтап қойды. ${e.seq} келгенде саңылау жабылды, ack бүкіл үзіліссіз бөлікті қамтиды: ${ack}.`, "buffer"];
            return ["Үзіліссіз алынған байттарды санаңыз", `Күтілген: ${before}. ${inorder ? "Ол келді" : "Ол әлі жоқ"}${Rv.buf.length ? `, буферде: ${Rv.buf.join(", ")}` : ""}. Келесі жетіспейтін байт - ${ack}.`, "ack-other"];
          } });
        if (e.re && !askedJump) { askedJump = true; ask = mk("ack-jump", "TCP: қайта жіберуден кейінгі ack"); }
        else if (!inorder && !askedDup) { askedDup = true; ask = mk("dup-ack", "TCP: қайталанған ack"); }
        else if (inorder && !askedAck && !e.re) { askedAck = true; ask = mk("ack", "TCP: деректердің ack-і"); }
        const m = inorder ? (jumped ? `Жоғалған ${e.seq} келді! Буферде одан кейінгілер бар → саңылау жабылды, ack = ${ack}-ке секіреді.` : `Күтілгені осы еді → ack = ${ack} («${ack}-ден бастап күтемін»).`)
          : `Күтілгені ${before} еді - мынау ретсіз! Сервер оны буферге сақтайды (буфер: ${Rv.buf.slice().sort((a, b) => a - b).join(", ")}), бірақ ack = ${before} - қайталанған ACK.`;
        fpush({ t: e.t, cur: msgs.length - 1, ask, msg: `t = ${e.t}. Сервер seq = ${e.seq} алды. ${m}` });
        push({ t: e.t + D, ord: 0, type: "arrC", ack, seq0: e.seq });
      } else if (e.type === "arrC") {
        let m;
        if (e.ack > S.una) {
          S.una = e.ack; S.dup = 0;
          if (S.una >= end) { S.timer = null; m = `Клиент ack = ${e.ack} алды: барлық ${n * mss} байт расталды. Таймер тоқтатылды.`; }
          else { S.timer = e.t + RTO; m = `Клиент ack = ${e.ack} алды: ${e.ack - 1}-ге дейін расталды. Жаңа дерек расталғандықтан, RTO таймері қайта басталды (t = ${S.timer}).`; }
          fpush({ t: e.t, msg: `t = ${e.t}. ${m}` });
        } else {
          S.dup++;
          const fast = S.dup === 3 && fr && !S.fast;
          m = `Клиент тағы ack = ${e.ack} алды - ${S.dup}-қайталанған ACK.` + (fast ? " Үшеу болды → жылдам қайта жіберу: RTO күтпей, бірден қайта жібереді." : S.dup < 3 ? (fr ? " Жылдам қайта жіберу үшін 3 қайталанған ACK керек." : " Жылдам қайта жіберу өшірулі - RTO күтіледі.") : "");
          fpush({ t: e.t, msg: `t = ${e.t}. ${m}` });
          if (fast) { S.fast = true; sendSeg(e.t, (e.ack - isn - 1) / mss + 1, true, "fast"); }
        }
      }
    }
    const last = frames[frames.length - 1];
    frames.push({ t: last.t, done: true, msg: `Аяқталды: ${n} сегмент (${n * mss} байт) жеткізілді.${lost ? ` Жоғалған ${lost}-сегмент ${S.fast ? "жылдам қайта жіберумен (3 қайталанған ACK)" : "уақыт шегімен (RTO)"} қалпына келді.` : " Жоғалту болмады."} Қайта жіберу саны: ${S.retrans}.` });
    frames.forEach((f) => { f.st = f.st || snap(); });
    return { frames, msgs, end, retrans: S.retrans, fast: S.fast, maxT: Math.max(...msgs.map((m) => m.t1)) };
  }
  window.CSLabNet.tcpSim = tcpSim;

  function seqDiagram(svg, lanes, msgs, upto, cur, opts = {}) {
    const PX = opts.px || 13, top = 40, W = 600;
    const maxT = Math.max(opts.minT || 0, ...msgs.map((m) => m.t1));
    const H = top + maxT * PX + 26;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";
    lanes.forEach(([x, name]) => { svg.append(sv("text", { x, y: 22, "text-anchor": "middle", class: "nw-lane-t" }, name)); svg.append(sv("line", { class: "nw-lane", x1: x, y1: 30, x2: x, y2: H - 8 })); });
    if (opts.ticks) for (let t = 0; t <= maxT; t += 5) svg.append(sv("text", { x: 6, y: top + t * PX + 4, class: "nw-tick" }, `t=${t}`));
    if (opts.timer != null) { const y = top + opts.timer * PX; svg.append(sv("line", { class: "nw-rto", x1: lanes[0][0] - 40, y1: y, x2: lanes[0][0] + 6, y2: y })); svg.append(sv("text", { class: "nw-rto-t", x: lanes[0][0] - 42, y: y + 4, "text-anchor": "end" }, "RTO")); }
    msgs.slice(0, upto).forEach((m, i) => {
      const [xa] = lanes[m.a], [xb] = lanes[m.b], ya = top + m.t0 * PX, yb = top + m.t1 * PX;
      const cls = "nw-msg" + (i === cur ? " cur" : "") + (m.lost ? " lost" : "") + (m.re ? " re" : "") + (m.dup ? " dup" : "");
      const g = sv("g", { class: cls });
      const xe = m.lost ? (xa + xb) / 2 : xb, ye = m.lost ? (ya + yb) / 2 : yb;
      g.append(sv("line", { x1: xa, y1: ya, x2: xe, y2: ye }));
      if (m.lost) g.append(sv("text", { x: xe, y: ye + 6, "text-anchor": "middle", class: "nw-x2" }, "✕"));
      else { const ang = Math.atan2(ye - ya, xe - xa), L = 10; g.append(sv("path", { d: `M${xe},${ye} L${xe - L * Math.cos(ang - 0.4)},${ye - L * Math.sin(ang - 0.4)} L${xe - L * Math.cos(ang + 0.4)},${ye - L * Math.sin(ang + 0.4)} Z` })); }
      if (opts.mid) g.append(sv("text", { x: (xa + xb) / 2, y: (ya + yb) / 2 - 6, "text-anchor": "middle", class: "nw-ml" }, m.label));
      else g.append(sv("text", { x: xa + (xb > xa ? -8 : 8), y: ya + 4, "text-anchor": xb > xa ? "end" : "start", class: "nw-ml" }, m.label));
      svg.append(g);
    });
  }

  (() => {
    const root = document.querySelector("[data-cslab=tcp]");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    let run = null;
    const fillLost = () => {
      const n = +$("[data-k=n]").value, sel = $("[data-k=lost]"), prev = sel.value || "2";
      sel.innerHTML = ""; sel.append(el("option", { value: "0", text: "жоқ" }));
      for (let i = 1; i <= n; i++) sel.append(el("option", { value: String(i), text: `${i}-сегмент` }));
      sel.value = +prev <= n ? prev : "2";
    };
    function build() { run = tcpSim({ n: +$("[data-k=n]").value, lost: +$("[data-k=lost]").value, fr: $("[data-k=fr]").checked }); run.msgs.forEach((m) => { m.a = m.from === "c" ? 0 : 1; m.b = 1 - m.a; }); }
    function render(F) {
      seqDiagram($("svg"), [[200, "Клиент"], [400, "Сервер"]], run.msgs, F.ms, F.cur, { px: 18, timer: F.st.timer, minT: run.maxT });
      const s = F.st, kv = $("[data-k=state]"); kv.innerHTML = "";
      const row = (a, b) => kv.append(el("dt", { text: a }), el("dd", { text: b }));
      row("Клиент: snd.una (ең ескі расталмаған)", String(s.una));
      row("Клиент: қайталанған ACK", String(s.dup));
      row("Клиент: RTO таймері", s.timer == null ? "жоқ" : `t = ${s.timer}`);
      row("Сервер: rcv.nxt (күтілетін байт)", String(s.nxt));
      row("Сервер: буфер (ретсіз келгендер)", s.buf.length ? s.buf.join(", ") : "бос");
      $("svg").setAttribute("aria-label", `TCP диаграммасы, ${F.t ?? 0} уақыт. Жіберілген хабарлар: ` + run.msgs.slice(0, F.ms).map((m) => (m.from === "c" ? "клиент → сервер " : "сервер → клиент ") + m.label + (m.lost ? " (жоғалды)" : "")).join("; "));
    }
    fillLost(); build();
    const st = C.stepper(root, { frames: () => run.frames, render, delay: 1300 });
    $("[data-k=n]").addEventListener("change", () => { fillLost(); build(); st.reload(); });
    ["lost", "fr"].forEach((k) => $(`[data-k=${k}]`).addEventListener("change", () => { build(); st.reload(); }));
    st.paint();
  })();

  // ================================================================ 4. DNS
  (() => {
    const root = document.querySelector("[data-cslab=dns]");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const LN = [[60, "Клиент"], [180, "Резолвер"], [300, "Түбір «.»"], [420, ".example"], [540, "ns1.ao17"]];
    const NAME = "lab.ao17.example";
    let run = null;
    const whom = (ans, extra) => ({ q: "Резолвер келесі сұрауды кімге жібереді?", skill: "cs.net.dns", title: "DNS: келесі сұрау", item: "dns-next",
      opts: [{ id: "root", label: "Түбір серверге" }, { id: "tld", label: ".example TLD серверіне" }, { id: "auth", label: "ns1.ao17.example серверіне" }, { id: "cache", label: "Ешкімге - кэштен жауап береді" }], answer: ans,
      okWhy: extra,
      why: (x) => {
        if (ans === "cache") return ["Жауап кэште бар", "Резолвер бұл атауды 2 минут бұрын шешкен; жауаптың TTL-і 300 секунд, яғни әлі 180 секунд жарамды. Ешкімнен сұрамай, кэштен береді - DNS жылдамдығы осыдан.", "cache"];
        if (x === "cache") return ["Кэш бос", "Бұл атау резолвердің кэшінде жоқ (не TTL-і өткен). Сондықтан ол иерархия бойынша сұрай бастайды.", "cache-empty"];
        if (ans === "root") return ["Иерархия түбірден басталады", `Резолвер .example серверінің де, ao17.example серверінің де адресін әзірге білмейді. Тек түбір серверлердің адрестері алдын ала белгілі (root hints) - сұрау солардан басталады.`, "skip-root"];
        if (ans === "tld") return ["Түбір жолдама берді", "Түбір сервер толық жауап бермейді: ол «.example аймағын мына серверлер біледі» деп жолдама (referral) қайтарды. Келесі қадам - TLD сервері.", "referral"];
        return ["TLD жолдама берді", "TLD сервері «ao17.example аймағы ns1.ao17.example-де» деп жолдама берді. Соңғы, нақты жауапты авторитетті сервер береді.", "referral"];
      } });
    function build() {
      const warm = $("[data-k=warm]").checked, msgs = [], frames = [];
      const add = (a, b, label, f) => { const t = msgs.length * 2; msgs.push({ a, b, t0: t, t1: t + 2, label }); frames.push({ ms: msgs.length, cur: msgs.length - 1, ...f }); };
      frames.push({ ms: 0, msg: `Браузер ${NAME} адресін білмейді. ОЖ (stub resolver) өз кэшіне қарайды - жоқ. Енді провайдердің рекурсивті резолверіне сұрау жібереді.` });
      add(0, 1, `A? ${NAME}`, { msg: `Клиент резолверге рекурсивті сұрау жіберді: «${NAME} үшін A жазбасы (IPv4) керек, толық жауапты өзің тап».` });
      if (warm) {
        add(1, 0, "A 192.0.2.17 (кэштен)", { ask: whom("cache", "Жауап кэште бар әрі TTL өтпеген (300 − 120 = 180 с қалды)."), msg: "Резолвер кэшінде жауап бар: 2 минут бұрын алынған, TTL = 300 с → әлі 180 с жарамды. Бірден жауап береді: 192.0.2.17. Бірде-бір қосымша сұрау жоқ." });
      } else {
        add(1, 2, `A? ${NAME}`, { ask: whom("root", "Резолвер тек түбір серверлердің адрестерін алдын ала біледі (root hints)."), msg: "Резолвердің кэші бос. Ол түбір серверден сұрайды (итеративті сұрау: «білсең - жауап, білмесең - кімнен сұрауды айт»)." });
        add(2, 1, "жолдама: .example → a.tld.example", { msg: "Түбір: «.example аймағын a.tld.example біледі» - жолдама (NS жазбасы және оның адресі)." });
        add(1, 3, `A? ${NAME}`, { ask: whom("tld", "Түбір .example TLD серверіне жолдама берді."), msg: ".example TLD серверінен сұрайды." });
        add(3, 1, "жолдама: ao17.example → ns1", { msg: "TLD: «ao17.example аймағы - ns1.ao17.example серверінде» - тағы жолдама." });
        add(1, 4, `A? ${NAME}`, { ask: whom("auth", "TLD авторитетті серверге жолдама берді."), msg: "Авторитетті серверден сұрайды." });
        add(4, 1, "A 192.0.2.17, TTL 300", { msg: "Авторитетті сервер нақты жауап береді: 192.0.2.17, TTL = 300 секунд (жауапты 5 минут кэште сақтауға болады)." });
        add(1, 0, "A 192.0.2.17", { msg: "Резолвер жауапты кэшке (300 с) сақтап, клиентке қайтарады. Келесі 5 минутта бұл атауды сұрағандардың бәрі бірден кэштен алады." });
      }
      frames.push({ ms: msgs.length, done: true, msg: warm ? "Барлығы 2 хабар: кэш DNS-тің негізгі жылдамдатқышы. TTL өткен соң жазба кэштен өшіріліп, келесі сұрау қайтадан иерархия бойынша жүреді." : `Барлығы ${msgs.length} хабар. Енді браузер 192.0.2.17-ге TCP байланысын ашады (3-бөлімдегі қол алысу).` });
      run = { msgs, frames };
    }
    function render(F) {
      seqDiagram($("svg"), LN, run.msgs, F.ms, F.cur, { px: 22, mid: true, minT: 16 });
      $("svg").setAttribute("aria-label", "DNS диаграммасы: " + (run.msgs.slice(0, F.ms).map((m) => `${LN[m.a][1]} → ${LN[m.b][1]}: ${m.label}`).join("; ") || "әзірге хабар жоқ"));
    }
    build();
    const st = C.stepper(root, { frames: () => run.frames, render, delay: 1500 });
    $("[data-k=warm]").addEventListener("change", () => { build(); st.reload(); });
    st.paint();
  })();

  // ================================================================ 5. тексеру тапсырмасы
  (() => {
    const root = document.querySelector("[data-cslab=net-task]");
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    let R = rng(C.seed()), choice = null;
    const kindSel = $("[data-k=kind]");
    function makeLpm() {
      const a = pick(R, [10, 172, 192]), b = a === 172 ? 16 + Math.floor(R() * 16) : a === 192 ? 168 : Math.floor(R() * 200) + 1, c = Math.floor(R() * 200) + 20, d = Math.floor(R() * 250) + 2;
      const dst = ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;
      const net = (len, u = dst) => ipStr((u & mask(len)) >>> 0);
      const rows = [{ p: "0.0.0.0", len: 0 }];
      const variant = Math.floor(R() * 4);
      if (a === 10) rows.push({ p: net(8), len: 8 });
      rows.push({ p: net(16), len: 16 });
      // /24: дәл сәйкес не көрші (алдағыш)
      const near = (((dst >>> 8) + (R() < 0.5 ? 1 : -1)) << 8) >>> 0;
      if (variant !== 1) rows.push({ p: net(24), len: 24 }); else rows.push({ p: net(24, near), len: 24 });
      // /25 не /26: кейде сәйкес, кейде жартысы басқа
      const l2 = R() < 0.5 ? 25 : 26, other = (dst ^ (1 << (32 - l2))) >>> 0;
      if (variant === 2) rows.push({ p: net(l2), len: l2 }); else rows.push({ p: net(l2, other), len: l2 });
      if (variant === 3) rows.splice(1, rows.length - 1, { p: net(16, (dst ^ (1 << 16)) >>> 0), len: 16 }, { p: net(24, near), len: 24 }, { p: net(l2, other), len: l2 });
      const ifs = shuffle(R, ["eth0", "eth1", "eth2", "eth3", "eth4"]);
      const T2 = shuffle(R, rows).map((r, i) => ({ ...r, ifc: ifs[i] }));
      const m = lpm(T2, dst);
      return { kind: "lpm", dst: ipStr(dst), rows: T2, m, answer: m.best.ifc };
    }
    function makeAck() {
      const isn = 1000 + Math.floor(R() * 8000), mss = pick(R, [100, 200, 500]), n = 5, L = 1 + Math.floor(R() * 3);
      const seqs = Array.from({ length: n }, (_, i) => isn + i * mss);
      let order = seqs.filter((_, i) => i + 1 !== L);
      const late = R() < 0.5;
      if (late) { const pos = L + Math.floor(R() * (n - L)); order.splice(pos, 0, seqs[L - 1]); }
      const cut = late ? order.indexOf(seqs[L - 1]) + 1 + Math.floor(R() * (order.length - order.indexOf(seqs[L - 1]))) : L + Math.floor(R() * (n - L));
      order = order.slice(0, Math.max(2, Math.min(order.length, cut)));
      let nxt = isn; const buf = new Set(), trace = [];
      order.forEach((s) => { if (s === nxt) { nxt += mss; while (buf.has(nxt)) { buf.delete(nxt); nxt += mss; } } else if (s > nxt) buf.add(s); trace.push({ s, ack: nxt, buf: [...buf].sort((x, y) => x - y) }); });
      return { kind: "ack", isn, mss, order, trace, answer: nxt, last: order[order.length - 1] };
    }
    function makeDiag() {
      const kind = pick(R, ["ok", "ttl", "loop", "noroute"]);
      let dst, ttl, loop = false;
      if (kind === "loop") { dst = `10.1.2.${10 + Math.floor(R() * 200)}`; ttl = 5 + Math.floor(R() * 4); loop = true; }
      else if (kind === "ttl") { dst = pick(R, [`10.1.2.${10 + Math.floor(R() * 200)}`, `203.0.113.${10 + Math.floor(R() * 200)}`, `10.1.${3 + Math.floor(R() * 200)}.${1 + Math.floor(R() * 250)}`]); ttl = 1 + Math.floor(R() * 2); }
      else if (kind === "noroute") { dst = `198.51.100.${1 + Math.floor(R() * 250)}`; ttl = 64; }
      else { dst = pick(R, [`10.1.2.${10 + Math.floor(R() * 200)}`, `203.0.113.${10 + Math.floor(R() * 200)}`, `10.1.${3 + Math.floor(R() * 200)}.${1 + Math.floor(R() * 250)}`]); ttl = pick(R, [8, 64]); }
      const sim = routeSim(dst, ttl, loop, { noAsk: true });
      const answer = sim.result === "delivered" ? "ok" : sim.result === "ttl" ? (loop ? "loop" : "ttl") : sim.result;
      return { kind: "diag", dst, ttl, loop, sim, answer };
    }
    const DIAG = [{ id: "loop", label: "Маршрут циклы (кесте қатесі)" }, { id: "ttl", label: "TTL тым кіші - жол ұзынырақ" }, { id: "noroute", label: "Маршрут жоқ (кестеде сәйкес жол жоқ)" }, { id: "ok", label: "Ақау жоқ - пакет жетті" }];
    function choices(opts) {
      const box = el("div", { class: "lab-choice", role: "group", "aria-label": "Жауап нұсқалары" });
      opts.forEach((o) => box.append(el("button", { type: "button", "aria-pressed": "false", "data-a": o.id, onclick: (e) => { choice = o.id; box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); }, text: o.label })));
      return box;
    }
    function make() {
      const k = kindSel.value; choice = null;
      const q = $("[data-k=q]"), ab = $("[data-k=ansbox]"); q.innerHTML = ""; ab.innerHTML = "";
      if (k === "lpm") {
        const P = makeLpm();
        q.append(el("p", null, "Маршрутизатор ", el("b", { text: P.dst }), " адресіне пакет алды. Кестесі төменде. Пакет қай интерфейс арқылы кетеді?"));
        const t = el("table", { class: "csb-table" }, el("thead", null, el("tr", null, el("th", { scope: "col", text: "Префикс" }), el("th", { scope: "col", text: "Интерфейс" }))));
        const tb = el("tbody"); P.rows.forEach((r) => tb.append(el("tr", null, el("td", { text: pre(r) }), el("td", { text: r.ifc })))); t.append(tb);
        q.append(el("div", { class: "csb-scroll" }, t));
        ab.append(choices(P.rows.map((r) => ({ id: r.ifc, label: r.ifc })).sort((x, y) => x.id.localeCompare(y.id))));
        return P;
      }
      if (k === "ack") {
        const P = makeAck();
        q.append(el("p", null, `Сервер байланыс орнатты; клиенттен күтетін алғашқы байт нөмірі - ${P.isn}. Әр сегментте ${P.mss} байт. Сегменттер серверге мына ретпен келді (seq): `, el("b", { text: P.order.join(", ") }), ". Сервер ретсіз келгендерді буферде сақтайды. ", el("b", { text: "Соңғы сегмент келгеннен кейін" }), " ол қандай ack жібереді?"));
        const id = "nt-ack";
        ab.append(el("label", { class: "cs-field", for: id }, el("span", { text: "ack нөмірі" })), el("input", { class: "cs-in", id, "data-k": "ans", inputmode: "numeric", autocomplete: "off", onkeydown: (e) => { if (e.key === "Enter") check(); } }));
        return P;
      }
      const P = makeDiag();
      q.append(el("p", null, `Ноутбук (10.0.0.5) ${P.dst} адресіне TTL = ${P.ttl} пакет жіберді. Маршрутизаторлардың журналы (пакет қай маршрутизаторға қандай TTL-мен келді):`));
      const ol = el("ol", { class: "nw-trace" });
      P.sim.log.forEach((l) => ol.append(el("li", { text: `${l.at}: келген TTL = ${l.ttl}` + (l.out === "drop-ttl" ? " → тасталды" : l.out === "drop-noroute" ? " → тасталды" : "") })));
      q.append(ol);
      const icmp = P.sim.result === "delivered" ? `Хост ${P.dst} пакетті алды (TTL = ${P.sim.ttlEnd}).` : P.sim.result === "ttl" ? `Ноутбукқа ICMP хабары келді: Time Exceeded (жіберуші: ${P.sim.log[P.sim.log.length - 1].at}).` : `Ноутбукқа ICMP хабары келді: Destination Unreachable (жіберуші: ${P.sim.log[P.sim.log.length - 1].at}).`;
      q.append(el("p", { class: "nw-icmp", text: icmp }));
      q.append(el("p", { text: "Диагноз қандай?" }));
      ab.append(choices(DIAG));
      return P;
    }
    function hints(P) {
      if (P.kind === "lpm") {
        const lines = P.rows.map((r) => `${pre(r)}: ${P.m.all.includes(r) ? "сәйкес" : "сәйкес емес"}`).join("; ");
        return ["Әр жолды тексеріңіз: адрестің алғашқы /n биті префикспен бірдей ме? /8 - бірінші октет, /16 - алғашқы екеуі, /24 - алғашқы үшеуі бірдей болуы керек; /25, /26 үшін төртінші октетті екілікке аударыңыз. Сәйкес келгендердің ішінен n ең үлкенін алыңыз.",
          "Мысал: 10.4.7.200 үшін 10.4.0.0/16 (сәйкес), 10.4.7.0/24 (сәйкес), 10.4.7.128/25 (200 = 11001000, бірінші бит 1 → 128-255 жартысы, сәйкес), 0.0.0.0/0 (әрқашан). Ең ұзыны /25.",
          `${lines}. Ең ұзын сәйкес префикс - ${pre(P.m.best)} → ${P.m.best.ifc}. Жауап: ${P.answer}.`];
      }
      if (P.kind === "ack") {
        return ["Сервердің «күтетін байтын» (rcv.nxt) қадағалаңыз: күтілгені келсе - mss-ке өседі және буфердегі үзіліссіз жалғасын да жұтады; күтілгеннен үлкені келсе - буферге түседі, rcv.nxt өзгермейді. ack = rcv.nxt.",
          "Мысал: бастап 1000, mss 100. Келгендер: 1000 → ack 1100; 1200 (ретсіз, буфер {1200}) → ack 1100; 1100 → 1200, буфердегі 1200 → 1300; ack 1300.",
          P.trace.map((x) => `${x.s} келді → ack ${x.ack}${x.buf.length ? `, буфер {${x.buf.join(", ")}}` : ""}`).join("; ") + `. Жауап: ${P.answer}.`];
      }
      const route = P.sim.log.map((l) => l.at).join(" → ");
      return ["Журналдағы маршрутизаторлар ретіне және соңғы ICMP хабарына қараңыз. Time Exceeded - TTL таусылды; оның себебі не цикл (маршрутизаторлар қайталанады), не жол TTL-ден ұзын. Destination Unreachable - кестеде сәйкес жол жоқ.",
        "Мысал: журнал R1 (TTL 6), R2 (5), R1 (4), R2 (3), R1 (2), R2 (1) → тасталды. R1 мен R2 кезектесіп қайталанады - бұл цикл; TTL-ді үлкейту көмектеспейді, кестені түзеу керек.",
        `Жол: ${route}. ${P.answer === "loop" ? "Маршрутизаторлар қайталанды → маршрут циклы." : P.answer === "ttl" ? `Қайталану жоқ, бірақ TTL = ${P.ttl} жолдағы маршрутизаторлар санынан аз → TTL тым кіші.` : P.answer === "noroute" ? "Соңғы маршрутизатор Destination Unreachable қайтарды → маршрут жоқ." : "Хост пакетті алды → ақау жоқ."} Жауап: ${DIAG.find((d) => d.id === P.answer).label}.`];
    }
    function checkAns(P) {
      if (P.kind === "ack") {
        const raw = ($("[data-k=ans]") || {}).value || "";
        if (!/^\s*\d+\s*$/.test(raw)) return { empty: true, title: "Сан жазыңыз", why: "Жауап - бір бүтін сан (ack нөмірі)." };
        const x = +raw, ok = x === P.answer, lastT = P.trace[P.trace.length - 1], gap = lastT.buf.length > 0;
        if (ok) return { ok, title: "Дұрыс", why: `rcv.nxt = ${P.answer}${gap ? `; буферде ${lastT.buf.join(", ")} бар, бірақ ${P.answer} жетіспейді - ack одан секірмейді.` : "."}`, skillTitle: "TCP: ack нөмірі" };
        if (x === P.last) return { ok, code: "ack-is-seq", title: "ack - келесі күтілетін байт", why: `${x} - соңғы келген сегменттің seq-і. ack «енді мынаны күтемін» дейді. Дұрысы: ${P.answer}.`, skillTitle: "TCP: ack нөмірі" };
        if (gap && x === P.last + P.mss) return { ok, code: "skip-gap", title: "Саңылаудан секіруге болмайды", why: `${x} «${x}-ке дейінгі барлық байт алынды» дегенді білдірер еді, бірақ ${P.answer}-ден басталатын сегмент әлі келген жоқ. Жиынтық ack бірінші жетіспейтін байтты көрсетеді: ${P.answer}.`, skillTitle: "TCP: ack нөмірі" };
        if (!gap && x < P.answer && x === P.last + P.mss) return { ok, code: "buffer", title: "Буфер ұмытылды", why: `Соңғы келген сегмент саңылауды жапты, ал буферде одан кейінгілер тұрған еді - ack бәрін қамтып ${P.answer}-ке секіреді.`, skillTitle: "TCP: ack нөмірі" };
        if (x === P.answer + 1) return { ok, code: "plus-one", title: "Артық бір", why: `Деректер байттарына +1 қосылмайды (ол тек SYN/FIN үшін). Дұрысы: ${P.answer}.`, skillTitle: "TCP: ack нөмірі" };
        return { ok, code: "ack-other", title: "Қате", why: `Қадамдап: ${P.trace.map((t2) => `${t2.s} → ack ${t2.ack}`).join("; ")}. Дұрысы: ${P.answer}.`, skillTitle: "TCP: ack нөмірі" };
      }
      if (!choice) return { empty: true, title: "Нұсқа таңдаңыз", why: "Батырмалардың бірін басып, содан кейін «Тексеру»." };
      if (P.kind === "lpm") {
        const ok = choice === P.answer, r = P.rows.find((x) => x.ifc === choice), best = P.m.best;
        if (ok) return { ok, title: "Дұрыс", why: `Сәйкес: ${P.m.all.map(pre).join(", ")}; ең ұзыны ${pre(best)}.`, skillTitle: "Маршруттау: ең ұзын префикс" };
        if (!P.m.all.includes(r)) { const lo = ipStr((ipParse(r.p) & mask(r.len)) >>> 0), hi = ipStr((ipParse(r.p) | ~mask(r.len)) >>> 0); return { ok, code: "no-match", title: "Бұл префикс сәйкес келмейді", why: `${pre(r)} ${lo} - ${hi} аралығын қамтиды; ${P.dst} оған кірмейді. Екілікте: ${bin(ipParse(P.dst))} пен ${binPrefix(ipParse(r.p), r.len)}. Ең ұзын сәйкес префикс - ${pre(best)} (${best.ifc}).`, skillTitle: "Маршруттау: ең ұзын префикс" }; }
        if (r.len === 0) return { ok, code: "default-first", title: "Әдепкі маршрут - соңғы амал", why: `0.0.0.0/0 бәріне сәйкес, бірақ префиксі 0 бит. Нақтырақ ${pre(best)} бар → ${best.ifc}.`, skillTitle: "Маршруттау: ең ұзын префикс" };
        return { ok, code: "shorter-prefix", title: "Қысқарақ префикс", why: `${pre(r)} сәйкес келеді, бірақ ${pre(best)} ұзынырақ (${best.len} > ${r.len}) - нақтысы жеңеді → ${best.ifc}.`, skillTitle: "Маршруттау: ең ұзын префикс" };
      }
      const ok = choice === P.answer, A = P.answer;
      const WHY = {
        loop: `Журналда маршрутизаторлар қайталанады (${P.sim.log.map((l) => l.at).join(" → ")}) - пакет екі маршрутизатор арасында айналып жүр. TTL-ді үлкейтсе де жетпейді: кестені түзеу керек.`,
        ttl: `Жол дұрыс, қайталану жоқ, бірақ TTL = ${P.ttl} жолдағы маршрутизаторлар санынан аз: TTL = 1 келген маршрутизатор оны тастайды. Үлкенірек TTL жеткілікті.`,
        noroute: `${P.sim.log[P.sim.log.length - 1].at} Destination Unreachable қайтарды: оның кестесінде ${P.dst}-ге сәйкес жол да, әдепкі маршрут та жоқ.`,
        ok: `Хост пакетті TTL = ${P.sim.ttlEnd}-пен алды - ақау жоқ.`,
      };
      if (ok) return { ok, title: "Дұрыс диагноз", why: WHY[A], skillTitle: "Желі: диагноз" };
      const mis = { "loop>ttl": "Екеуінде де Time Exceeded келеді, бірақ мұнда маршрутизаторлар қайталанады - себеп TTL-дің кішілігі емес, цикл.", "ttl>loop": "Екеуінде де Time Exceeded келеді, бірақ мұнда журналда қайталану жоқ - пакет дұрыс бағытпен жүрді, тек TTL жетпеді.", "noroute>ttl": "Time Exceeded емес, Destination Unreachable келді - TTL жеткілікті, бірақ маршрутизатор жолды білмейді.", "noroute>loop": "Қайталану жоқ әрі хабар Destination Unreachable - бұл маршрут жоқтығының белгісі." };
      return { ok, code: "diag-" + choice, title: "Диагноз қате", why: (mis[`${A}>${choice}`] || "") + " " + WHY[A], skillTitle: "Желі: диагноз" };
    }
    const tk = C.task(root, { make, check: (P) => checkAns(P), hints, skill: (P) => (P.kind === "ack" ? "cs.net.tcp" : P.kind === "diag" ? "cs.net.diag" : "cs.net.route") });
    function check() { tk.run(); }
    $("[data-c=check]").addEventListener("click", check);
    $("[data-c=new]").addEventListener("click", () => tk.fresh());
    kindSel.addEventListener("change", () => tk.fresh());
    tk.fresh();
    window.CSLabNet.task = () => tk.P;
  })();

  C.badges();
})();
