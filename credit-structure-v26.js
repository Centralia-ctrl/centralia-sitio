/* Three connected modules open space for the next stage. No raster scaling. */
(() => {
  'use strict';
  const art = document.querySelector('[data-credit-structure]');
  if (!art) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const modules = [...art.querySelectorAll('[data-module]')];
  const messages = [...art.closest('.solution-film').querySelectorAll('[data-film-message]')];
  const smooth = n => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n); };
  let visible = false, elapsed = 0, last = null, frame = null;
  function draw(seconds) {
    const t = seconds % 12;
    const open = reduced.matches ? 1 : smooth((t - 1.2) / 3.6) * (1 - smooth((t - 9) / 2.5));
    const positions = [[205 - 67 * open, 182 - 8 * open], [288, 135 - 24 * open], [371 + 67 * open, 182 - 8 * open]];
    modules.forEach((module, i) => {
      const [x, y] = positions[i];
      module.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    });
    art.querySelector('[data-structure-foundation]').setAttribute('d', `M${205 - 67 * open} 419H${531 + 67 * open}`);
    art.dataset.phase = open > .98 ? 'expanded' : open < .02 ? 'compact' : 'opening';
    if (messages.length === 2) {
      messages[0].style.opacity = reduced.matches ? 1 : t < 10 ? 1 - smooth((t - 4.75) / .45) : smooth((t - 10.45) / .55);
      messages[1].style.opacity = reduced.matches ? 0 : t < 10 ? smooth((t - 5.2) / .55) : 1 - smooth((t - 10) / .45);
    }
  }
  function tick(now) { if (last !== null) elapsed += Math.min(now - last, 100); last = now; draw(elapsed / 1000); frame = requestAnimationFrame(tick); }
  function update() {
    const run = visible && !document.hidden && !reduced.matches;
    if (run && frame === null) frame = requestAnimationFrame(tick);
    if (!run && frame !== null) { cancelAnimationFrame(frame); frame = null; last = null; }
    if (reduced.matches) draw(0);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting && e.intersectionRatio >= .15; update(); }, {threshold: [0, .15]}).observe(art);
  else { visible = true; update(); }
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  draw(0);
})();
