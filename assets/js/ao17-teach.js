// © 2026 AO17 командасы. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md.
// AO17 CS: мұғалімге сабақ жоспарлары (academy/teach/, tools/academy/teach.py).
//  * Басып шығару: бір жоспар (body[data-tp-print="one"] + .is-print) не аптаның барлық жоспары.
//  * КТЖ: аптасына сағат -> «Апта» бағаны мен қорытынды жол; CSV жүктеу (Excel үшін «;» бөлгіш, UTF-8 BOM, бос «Күні» бағаны).
//    Ұяшық «=», «+», «-», «@» белгісімен басталса, алдына «'» қойылады: Excel оны формула деп орындамайды.
(function () {
  "use strict";
  const root = document.querySelector("[data-teach]");
  if (!root) return;

  const clearPrint = () => {
    document.body.removeAttribute("data-tp-print");
    root.querySelectorAll(".tp-plan.is-print").forEach((x) => x.classList.remove("is-print"));
  };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tp-print]");
    if (!b) return;
    clearPrint();
    const id = b.getAttribute("data-tp-print");
    if (id === "all") {
      document.body.setAttribute("data-tp-print", "all");
    } else {
      const plan = document.getElementById(id);
      if (!plan) return;
      plan.classList.add("is-print");
      document.body.setAttribute("data-tp-print", "one");
    }
    window.print();
  });
  window.addEventListener("afterprint", clearPrint);

  const ktp = root.querySelector("[data-ktp]");
  if (!ktp) return;
  const rows = Array.from(ktp.querySelectorAll("tbody tr[data-i]"));
  const sum = ktp.querySelector("[data-ktp-sum]");
  const pace = () => {
    const r = ktp.querySelector('input[name="tp-pace"]:checked');
    return r ? Number(r.value) : 2;
  };
  const apply = () => {
    const h = pace();
    rows.forEach((r) => { r.querySelector("[data-week]").textContent = String(Math.ceil(Number(r.dataset.i) / h)); });
    if (sum) sum.textContent = `${rows.length} сабақ, аптасына ${h} сағат: ${Math.ceil(rows.length / h)} апта.`;
  };
  ktp.querySelectorAll('input[name="tp-pace"]').forEach((x) => x.addEventListener("change", apply));
  apply();

  const cell = (v) => {
    let s = String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const btn = ktp.querySelector("[data-ktp-csv]");
  if (btn) btn.addEventListener("click", () => {
    const head = ["№", "Апта", "Апта тақырыбы", "Сабақтың тақырыбы", "Оқу мақсаты (бағалау критерийі)", "Сағат", "Күні", "Сабақ жоспары (ҚМЖ)"];
    const lines = [head.map(cell).join(";")].concat(rows.map((r) => [
      r.dataset.i, r.querySelector("[data-week]").textContent, r.dataset.mod, r.dataset.title, r.dataset.goal, "1", "",
      new URL(r.dataset.href, location.href).href,
    ].map(cell).join(";")));
    const blob = new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ao17cs-ktzh-${pace()}-sagat.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  });
})();
