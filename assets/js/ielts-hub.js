/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* IELTS Academy хабы: AO17Tutor-дағы ielts.* дағдыларының меңгеру белгілері (тек осы браузер). Band бағасы емес. */
(() => {
  "use strict";
  const ul = document.getElementById("ie-prog");
  if (!ul || !window.AO17Tutor || !window.IELTS) return;
  const { h } = window.IELTS;
  function paint() {
    const list = AO17Tutor.skills().filter((s) => s.id.startsWith("ielts.")).sort((a, b) => a.id.localeCompare(b.id));
    if (!list.length) return;
    ul.textContent = "";
    list.forEach((s) => { const li = h("li"); const b = h("span"); li.append(b); ul.append(li); AO17Tutor.badge(b, s.id, s.title); });
  }
  paint();
})();
