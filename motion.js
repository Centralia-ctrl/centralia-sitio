(() => {
  'use strict';
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const groups = ['.hero-copy > *', '.capital-board > *', '.purpose-inner > *', '.section-heading > *', '.focused-grid > *', '.method-heading > *', '.method-grid > *', '.method-signoff', '.faq-section > *', '.closing-inner > div, .closing-cta'];
  const items = [];
  groups.forEach(selector => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 65}ms`);
      items.push(element);
    });
  });
  let observer;
  let frame = 0;
  let active = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const paint = () => {
    frame = 0;
    if (!active) return;
    const height = window.innerHeight;
    const pageLength = root.scrollHeight - height;
    root.style.setProperty('--reading-progress', pageLength > 0 ? clamp(window.scrollY / pageLength).toFixed(4) : '0');
  };
  const queuePaint = () => { if (active && !frame) frame = window.requestAnimationFrame(paint); };
  const reveal = element => {
    element.classList.add('is-visible');
    observer?.unobserve(element);
  };
  const reset = () => {
    active = false;
    observer?.disconnect();
    observer = null;
    window.cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener('scroll', queuePaint);
    window.removeEventListener('resize', queuePaint);
    root.classList.remove('motion-enabled');
    root.style.removeProperty('--reading-progress');
  };
  const setup = () => {
    reset();
    if (preference.matches || !('IntersectionObserver' in window)) return;
    try {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
      }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
      items.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) reveal(element);
        else observer.observe(element);
      });
      active = true;
      root.classList.add('motion-enabled');
      window.addEventListener('scroll', queuePaint, { passive: true });
      window.addEventListener('resize', queuePaint, { passive: true });
      queuePaint();
    } catch { reset(); }
  };
  document.addEventListener('focusin', event => {
    const element = event.target.closest?.('.scroll-reveal');
    if (element) reveal(element);
  });
  preference.addEventListener('change', setup);
  window.addEventListener('pageshow', queuePaint);
  setup();
})();
