(() => {
  'use strict';
  const section = document.querySelector('.credit-projects');
  if (!section) return;
  const buttons = [...section.querySelectorAll('[data-project]')];
  const stories = [...section.querySelectorAll('.credit-project-story')];
  const art = section.querySelector('.credit-project-art');
  const poster = art.querySelector('.credit-project-fallback');
  const posters = {
    expansion: ['assets/centralia-credito-expansion-poster-desktop-20261117.webp', 'assets/centralia-credito-expansion-poster-mobile-20261117.webp'],
    inventario: ['assets/centralia-credito-inventario-poster-desktop-20261117.webp', 'assets/centralia-credito-inventario-poster-mobile-20261117.webp'],
    equipo: ['assets/centralia-credito-equipo-doble-poster-desktop-20261118-v2.webp', 'assets/centralia-credito-equipo-doble-poster-mobile-20261118-v2.webp']
  };
  const inquiry = section.querySelector('#credit-project-inquiry');
  const inquiryLabel = inquiry.querySelector('.credit-project-cta-label');
  const inquiryLabels = {
    expansion: 'Quiero financiar mi expansión',
    inventario: 'Quiero financiar mi inventario',
    equipo: 'Quiero financiar equipo y operación'
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = {
    expansion: 'Una sede abre conexiones hacia tres nuevas sucursales, que se incorporan una por una.',
    inventario: 'Mercancía de acabado perlado avanza continuamente sobre una plataforma, con entradas y salidas suaves por los extremos.',
    equipo: 'Una línea satinada se divide en dos recorridos. Tres piezas avanzan con separación uniforme y entradas y salidas suaves.'
  };
  let active = 'expansion', controller, loading, visible = false, transitionRevision = 0, idleJob;
  const canPrepare = () => visible && !document.hidden && !reduced.matches && !document.querySelector('dialog[open]');
  const yieldToPage = () => new Promise(resolve => setTimeout(resolve, 0));
  function cancelPreparation() {
    if (idleJob === undefined) return;
    if ('cancelIdleCallback' in window) cancelIdleCallback(idleJob);
    else clearTimeout(idleJob);
    idleJob = undefined;
  }
  function queuePreparation() {
    if (!canPrepare() || idleJob !== undefined) return;
    const prepare = () => {
      idleJob = undefined;
      if (canPrepare()) ensureArt();
    };
    idleJob = 'requestIdleCallback' in window ? requestIdleCallback(prepare, { timeout: 1200 }) : setTimeout(prepare, 80);
  }
  async function ensureArt() {
    if (!canPrepare()) return;
    if (controller) return changeScene(active);
    if (loading) return loading;
    loading = import('./credit-project-artwork.js?v=20261120-carga-visible').then(async ({ createProjectArtwork }) => {
      await yieldToPage();
      if (!canPrepare()) return;
      controller = await createProjectArtwork(art);
      await changeScene(active);
      return controller;
    }).catch(() => null).finally(() => { loading = null; });
    return loading;
  }
  async function changeScene(key) {
    const revision = ++transitionRevision;
    art.classList.remove('is-ready');
    controller.setVisible(false);
    try {
      await controller.setScene(key, !reduced.matches);
      if (revision !== transitionRevision || key !== active || reduced.matches) return;
      art.classList.add('is-ready');
      controller.setVisible(visible && !document.hidden);
    } catch { art.classList.remove('is-ready'); }
  }
  function select(key) {
    document.dispatchEvent(new CustomEvent('centralia:credit-project-selected', {
      detail: { project: key }
    }));
    if (key === active) return;
    active = key;
    inquiryLabel.textContent = inquiryLabels[key];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.project === key)));
    stories.forEach(story => {
      story.hidden = story.id !== `credit-project-panel-${key}`;
      story.classList.toggle('is-entering', !story.hidden);
    });
    art.setAttribute('aria-label', descriptions[key]);
    poster.querySelector('source').srcset = posters[key][1];
    poster.querySelector('img').src = posters[key][0];
    section.querySelector('[role="status"]').textContent = `${buttons.find(b => b.dataset.project === key).querySelector('.credit-project-choice-title>span').textContent}: ${section.querySelector('.credit-project-story:not([hidden]) h3').textContent}`;
    art.classList.remove('is-ready');
    controller?.setVisible(false);
    queuePreparation();
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button.dataset.project));
    button.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
      if (target === null) return;
      event.preventDefault(); buttons[target].focus(); select(buttons[target].dataset.project);
    });
  });
  inquiry.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('centralia:credit-project-selected', {
      detail: { project: active }
    }));
    document.dispatchEvent(new CustomEvent('centralia:consult-product', {
      detail: { product: 'credit', opener: inquiry }
    }));
  });
  // The poster is the initial state. Do not allocate WebGL while the visitor
  // is using the calculator above, or when reduced motion is preferred.
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
    if (visible && !art.classList.contains('is-ready')) queuePreparation();
    if (!visible) cancelPreparation();
    controller?.setVisible(visible && !document.hidden && !reduced.matches);
  }, { threshold: [0,.35] }).observe(art);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelPreparation();
    else if (!art.classList.contains('is-ready')) queuePreparation();
    controller?.setVisible(visible && !document.hidden && !reduced.matches);
  });
  reduced.addEventListener('change', () => {
    transitionRevision++;
    cancelPreparation();
    controller?.setVisible(false);
    art.classList.remove('is-ready');
    queuePreparation();
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', queuePreparation));
  window.addEventListener('pagehide', () => { cancelPreparation(); controller?.setVisible(false); });
  window.addEventListener('pageshow', () => { if (!art.classList.contains('is-ready')) queuePreparation(); else controller?.setVisible(visible && !document.hidden && !reduced.matches); });
})();
