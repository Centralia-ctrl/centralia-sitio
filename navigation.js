/* Orientation and mobile navigation without changing natural page scrolling. */
(() => {
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  const links = [...document.querySelectorAll('.desktop-nav a[href^="#"], #mobile-nav a[href^="#"]')];
  const sections = ['soluciones', 'metodo', 'preguntas'].map(id => document.getElementById(id)).filter(Boolean);
  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    toggle.querySelector('use').setAttribute('href', '#i-menu');
  };
  document.addEventListener('click', event => {
    if (!menu.hidden && !header.contains(event.target)) closeMenu();
  });
  header.addEventListener('focusout', event => {
    if (!menu.hidden && event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
  });
  // The brand returns to the welcome and replays its entrance without reloading forms.
  const brand = header.querySelector('.brand');
  const welcome = document.querySelector('.hero');
  brand.addEventListener('click', event => {
    if (brand.getAttribute('href') !== '#inicio') return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeMenu();
    if (location.hash !== '#inicio') {
      try { history.replaceState(history.state, '', '#inicio'); } catch { location.hash = 'inicio'; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (welcome) {
      welcome.querySelectorAll('.scroll-reveal').forEach(element => element.classList.add('is-visible'));
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        welcome.classList.add('welcome-restarting');
        void welcome.offsetWidth;
        welcome.classList.remove('welcome-restarting');
      }
    }
  });
  const solutionMenus = [...header.querySelectorAll('.solutions-nav')];
  const closeSolutions = () => solutionMenus.forEach(item => { item.open = false; });
  solutionMenus.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) solutionMenus.forEach(other => { if (other !== item) other.open = false; });
    });
    item.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        item.open = false; item.querySelector('summary').focus();
      }
    });
    item.addEventListener('focusout', event => {
      if (event.relatedTarget && !item.contains(event.relatedTarget)) item.open = false;
    });
    item.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      closeSolutions();
      const href = link.getAttribute('href');
      const target = href.startsWith('#') ? document.querySelector(href) : null;
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
    }));
  });
  document.addEventListener('click', event => {
    if (!solutionMenus.some(item => item.contains(event.target))) closeSolutions();
  });
  window.matchMedia('(max-width:900px)').addEventListener('change', closeSolutions);
  let pending = false;
  const updatePosition = () => {
    pending = false;
    const boundary = header.querySelector('.header-inner').getBoundingClientRect().height + 100;
    let active = null;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= boundary && rect.bottom > boundary) active = '#' + section.id;
    }
    for (const link of links) {
      if (link.getAttribute('href') === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updatePosition);
  };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('load', schedule);
  updatePosition();
})();
