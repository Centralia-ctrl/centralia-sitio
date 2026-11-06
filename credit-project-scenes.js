(() => {
  'use strict';
  const section = document.querySelector('.credit-projects');
  if (!section) return;
  const buttons = [...section.querySelectorAll('[data-project]')];
  const stories = [...section.querySelectorAll('.credit-project-story')];
  const art = section.querySelector('.credit-project-art');
  const replay = section.querySelector('.credit-project-replay');
  const caption = section.querySelector('.credit-project-caption');
  const inquiry = section.querySelector('#credit-project-inquiry');
  const inquiryLabel = inquiry.querySelector('.credit-project-cta-label');
  const inquiryLabels = {
    expansion: 'Quiero financiar mi expansión',
    inventario: 'Quiero financiar mi inventario',
    equipo: 'Quiero financiar equipo y operación'
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {
    expansion: ['Red de sucursales', 'Una sede abre conexiones hacia tres nuevas sucursales, que se incorporan una por una.'],
    inventario: ['Inventario en circulación', 'Mercancía de acabado perlado avanza continuamente sobre una plataforma, con entradas y salidas suaves por los extremos.'],
    equipo: ['Del equipo a la operación', 'Un equipo de precisión se pone en marcha y trabaja sobre una pieza.']
  };
  let active = 'expansion', controller, loading, visible = false, transition, transitionRevision=0;
  function state(mode) {
    replay.hidden = mode === 'unavailable' || mode === 'finished';
    if (replay.hidden) return;
    replay.innerHTML = mode === 'playing' ? 'Pausar movimiento <span aria-hidden="true">Ⅱ</span>' : 'Continuar movimiento <span aria-hidden="true">▷</span>';
    replay.dataset.mode = mode;
  }
  async function ensureArt() {
    if (controller) return controller;
    if (loading) return loading;
    loading = import('./credit-project-artwork.js?v=20261105-branch-network').then(({ createProjectArtwork }) => {
      controller = createProjectArtwork(art, state);
      art.classList.add('is-ready');
      replay.hidden = false;
      controller.setScene(active, !reduced.matches);
      controller.setVisible(visible && !document.hidden);
      return controller;
    }).catch(() => {
      art.querySelector('.credit-project-fallback p').textContent = 'Elige un proyecto para conocer el ejemplo.';
      state('finished');
      return null;
    });
    return loading;
  }
  function changeScene(key) {
    const revision=++transitionRevision;
    const canvas=art.querySelector('canvas');
    const opacity=canvas?getComputedStyle(canvas).opacity:1;
    transition?.cancel();
    if(reduced.matches||!canvas){replay.disabled=false;controller.setScene(key,false);return;}
    replay.disabled=true;
    transition=canvas.animate([{opacity},{opacity:0}],{duration:140,easing:'ease-out',fill:'forwards'});
    transition.finished.then(()=>{
      if(revision!==transitionRevision)return;
      controller.setScene(key,true);transition.cancel();
      transition=canvas.animate([{opacity:0},{opacity:1}],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'});
      replay.disabled=false;
    }).catch(()=>{});
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
    caption.textContent = labels[key][0];
    art.setAttribute('aria-label', labels[key][1]);
    art.querySelector('.credit-project-fallback p').textContent = labels[key][0];
    section.querySelector('[role="status"]').textContent = `${buttons.find(b => b.dataset.project === key).querySelector('.credit-project-choice-title>span').textContent}: ${section.querySelector('.credit-project-story:not([hidden]) h3').textContent}`;
    if (controller) changeScene(key);
    else ensureArt();
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button.dataset.project));
    button.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
      if (target === null) return;
      event.preventDefault(); buttons[target].focus(); select(buttons[target].dataset.project);
    });
  });
  replay.addEventListener('click', () => controller?.toggle());
  inquiry.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('centralia:credit-project-selected', {
      detail: { project: active }
    }));
    document.dispatchEvent(new CustomEvent('centralia:consult-product', {
      detail: { product: 'credit', opener: inquiry }
    }));
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) ensureArt();
    controller?.setVisible(visible && !document.hidden);
  }, { threshold: 0.08 }).observe(art);
  document.addEventListener('visibilitychange', () => controller?.setVisible(visible && !document.hidden));
  reduced.addEventListener('change', () => { if (reduced.matches) {transitionRevision++;transition?.cancel();replay.disabled=false;controller?.setScene(active, false);} });
  window.addEventListener('pagehide', () => controller?.setVisible(false));
  window.addEventListener('pageshow', () => controller?.setVisible(visible && !document.hidden));
})();
