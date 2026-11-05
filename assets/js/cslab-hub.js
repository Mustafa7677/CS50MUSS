/* © 2026 Sagid Mustafa. All Rights Reserved. Дербес авторлық бағдарлама: рұқсатсыз көшіруге, таратуға, өзгертуге және коммерциялық пайдалануға болмайды. LICENSE-PROPRIETARY.md, COPYRIGHT.md. */
/* CS Universe зертханалар хабы: әр дайын зертхананың дағдылары бойынша меңгеру белгісі (AO17Tutor, тек осы браузерде). */
(() => {
  "use strict";
  if (!window.AO17Tutor) return;
  document.querySelectorAll("[data-badge]").forEach((el) => window.AO17Tutor.badge(el, el.dataset.badge, el.dataset.title));
})();
