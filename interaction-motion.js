/* Local presentation only. Calculations, consent and submission stay with their owners. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set(), latest = new WeakMap(), timers = new Set();
  const enabled = () => !reduced.matches && !document.hidden;
  function play(element, frames, duration = 240) {
    if (!element || !enabled() || typeof element.animate !== 'function' || !element.getClientRects().length) return;
    latest.get(element)?.cancel();
    const animation = element.animate(frames, {duration, easing:'cubic-bezier(.2,.7,.2,1)'});
    latest.set(element, animation); running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    return animation;
  }
  const enter = element => play(element, [{opacity:.65, transform:'translateY(6px)'}, {opacity:1, transform:'translateY(0)'}], 240);
  const stop = () => { running.forEach(a => a.cancel()); running.clear(); timers.forEach(clearTimeout); timers.clear(); };
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);

  function init() {
    for (const [rootSelector, outputSelector] of [
      ['#simulador-credito', '#credit-inline-payment, #credit-inline-fee'],
      ['#simulador-factoraje', '#factoring-inline-advance, #factoring-inline-retained'],
      ['[data-supplier-simulator]', '[data-out="interest"], [data-out="total"]']
    ]) {
      const root = document.querySelector(rootSelector);
      if (!root) continue;
      const outputs = [...root.querySelectorAll(outputSelector)];
      let previous = outputs.map(e => e.textContent).join('|'), pending;
      const schedule = () => {
        clearTimeout(pending); timers.delete(pending);
        pending = setTimeout(() => {
          timers.delete(pending);
          const next = outputs.map(e => e.textContent).join('|');
          if (next === previous) return;
          previous = next;
          if (root.querySelector('[aria-invalid="true"]') || !enabled()) return;
          outputs.forEach(element => {
            const color = getComputedStyle(element).color;
            play(element, [{color:'#315de8', opacity:.82, transform:'translateY(2px)'}, {color, opacity:1, transform:'translateY(0)'}], 320);
          });
        }, 110);
        timers.add(pending);
      };
      root.addEventListener('input', schedule);
      root.addEventListener('change', schedule);
    }

    const form = document.querySelector('#centralia-contact-form');
    const progress = form?.querySelector('.cx-steps');
    if (progress) {
      let step = progress.querySelector('[aria-current="step"]');
      new MutationObserver(() => {
        const next = progress.querySelector('[aria-current="step"]');
        if (next === step) return;
        step = next;
        enter(form.querySelector('.capture-fields'));
        play(next, [{opacity:.45}, {opacity:1}], 220);
      }).observe(progress, {subtree:true, attributes:true, attributeFilter:['aria-current']});
    }
    const receipt = document.querySelector('#capture-success');
    if (receipt) new MutationObserver(() => { if (!receipt.hidden) enter(receipt); }).observe(receipt, {attributes:true, attributeFilter:['hidden']});

    const dialog = document.querySelector('#simulator-dialog');
    if (!dialog) return;
    let wasOpen = dialog.open, lastStep = dialog.dataset.step, closing = false;
    new MutationObserver(() => {
      if (dialog.open && !wasOpen) enter(dialog);
      else if (dialog.open && dialog.dataset.step !== lastStep) {
        enter(dialog.querySelector(dialog.dataset.step === 'contact' ? '#sim-contact' : '#sim-result-panel'));
      }
      wasOpen = dialog.open; lastStep = dialog.dataset.step;
    }).observe(dialog, {attributes:true, attributeFilter:['open', 'data-step']});
    function closeSoftly(event) {
      if (!enabled() || !dialog.open || typeof dialog.animate !== 'function') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (closing) return;
      closing = true;
      const animation = play(dialog, [{opacity:1, transform:'translateY(0)'}, {opacity:.7, transform:'translateY(5px)'}], 140);
      const finish = () => { closing = false; if (dialog.open) dialog.close(); };
      if (animation) animation.finished.then(finish, finish); else finish();
    }
    dialog.addEventListener('cancel', closeSoftly);
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) closeSoftly(event);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
