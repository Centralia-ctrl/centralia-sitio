/* Official HubSpot embed supplied by Centralia. The published form owns its
   fields, validation and submission. No mirrored or background submissions. */
(() => {
  'use strict';
  const host = document.getElementById('centralia-hubspot-form');
  if (!host) return;
  const status = document.getElementById('capture-load-status');
  const panel = host.closest('.capture-panel');
  let started = false, ready = false, timeout;
  const failed = () => {
    if (ready) return;
    panel.removeAttribute('aria-busy');
    panel.classList.add('capture-load-failed');
    status.hidden = false;
    status.textContent = 'No pudimos cargar el formulario aquí. Puedes abrirlo directamente o escribirnos por WhatsApp.';
  };
  const start = () => {
    if (started) return;
    started = true;
    panel.setAttribute('aria-busy', 'true');
    timeout = setTimeout(failed, 18000);
    try {
      const script = document.createElement('script');
      script.src = 'https://js.hsforms.net/forms/embed/v2.js';
      script.charset = 'utf-8';
      script.async = true;
      script.onerror = failed;
      script.onload = () => {
        try {
          window.hbspt.forms.create({
            portalId: '9145352',
            formId: '68d091a6-92e3-4ca4-af92-9f87c41d140e',
            region: 'na1',
            target: '#centralia-hubspot-form',
            locale: 'es-mx',
            submitText: 'Enviar mi consulta',
            onFormReady: () => {
              ready = true;
              clearTimeout(timeout);
              panel.removeAttribute('aria-busy');
              panel.classList.remove('capture-load-failed');
              status.hidden = true;
            }
          });
        } catch { failed(); }
      };
      document.head.append(script);
    } catch { failed(); }
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect(); start();
      }
    }, {rootMargin: '400px'});
    observer.observe(host);
  } else start();
})();
