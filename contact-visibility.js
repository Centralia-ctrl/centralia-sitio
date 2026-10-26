/* Keep the floating contact link clear of conditions, contact blocks, the footer and any control underneath it. */
(() => {
  'use strict';
  const groups = [
    ['terms-in-view', [...document.querySelectorAll('.direction-terms')]],
    ['footer-in-view', [...document.querySelectorAll('.site-footer')]],
    ['contact-in-view', [...document.querySelectorAll('.blog-cta, .product-meeting, .home-capture, .closing-section')]]
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

  // Outside those blocks, hide the link while any button, link or field sits under it.
  const float = document.querySelector('.whatsapp-float');
  if (!float || !document.elementsFromPoint) return;
  const controls = 'a, button, input, select, textarea, summary, label, [role="button"]';
  let pending = false;
  const check = () => {
    pending = false;
    const box = float.getBoundingClientRect();
    const fixed = getComputedStyle(float).position === 'fixed';
    let covered = false;
    if (fixed && box.width && box.bottom > 0 && box.top < window.innerHeight) {
      for (const x of [box.left + 2, box.left + box.width / 2, box.right - 2]) {
        for (const y of [box.top + 2, box.top + box.height / 2, box.bottom - 2]) {
          if (document.elementsFromPoint(x, y).some(element => !float.contains(element) && element.closest(controls))) { covered = true; break; }
        }
        if (covered) break;
      }
    }
    document.body.classList.toggle('float-over-control', covered);
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(check); } };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  document.addEventListener('toggle', schedule, true);
  check();
})();
