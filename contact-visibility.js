/* Keep the floating contact link clear of conditions and footer contact links. */
(() => {
  'use strict';
  const groups = [
    ['terms-in-view', [...document.querySelectorAll('.direction-terms')]],
    ['footer-in-view', [...document.querySelectorAll('.site-footer')]]
  ];
  if ('IntersectionObserver' in window) {
    for (const [className, elements] of groups) {
      const visible = new Set();
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
        document.body.classList.toggle(className, visible.size > 0);
      }, {threshold: 0});
      elements.forEach(element => observer.observe(element));
    }
  } else {
    let pending = false;
    const update = () => {
      pending = false;
      for (const [className, elements] of groups) document.body.classList.toggle(className, elements.some(element => {
        const box = element.getBoundingClientRect();
        return box.bottom > 0 && box.top < window.innerHeight;
      }));
    };
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule); update();
  }
})();
