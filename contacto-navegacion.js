/* Contacto usa el encabezado común del sitio. En las demás páginas, app.js abre el menú móvil,
   pero app.js depende de formularios que Contacto no tiene. Este archivo solo abre y cierra el menú;
   navigation.js conserva el resto del comportamiento común. No envía ni guarda datos. */
(() => {
  'use strict';
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  if (!menu || !toggle) return;
  const icon = toggle.querySelector('use');
  const setOpen = open => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (icon) icon.setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  toggle.addEventListener('click', () => setOpen(menu.hidden));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) setOpen(false); });
})();
