/* Cookie consent for measurement. Intentionally OFF, like pixel.js.
   Turn on together with pixel.js: set enabled to true in both files.
   It dispatches centralia:measurement-consent with separate analytics and marketing choices.
   Preview without enabling: open any page with ?vista=cookies (nothing is saved). */
(() => {
  'use strict';
  const SETTINGS = Object.freeze({
    enabled: false,
    storageKey: 'centralia-consent-v1',
    privacyUrl: 'https://centraliafinanciera.com/aviso-de-privacidad/'
  });
  const preview = new URLSearchParams(location.search).get('vista') === 'cookies';
  if (!SETTINGS.enabled && !preview) return;

  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS.storageKey));
      return saved && typeof saved.analytics === 'boolean' && typeof saved.marketing === 'boolean' ? saved : null;
    } catch { return null; }
  };
  const apply = choice => {
    document.dispatchEvent(new CustomEvent('centralia:measurement-consent', {
      detail: {analytics: choice.analytics, marketing: choice.marketing}
    }));
  };
  const save = choice => {
    if (!preview) {
      try { localStorage.setItem(SETTINGS.storageKey, JSON.stringify({...choice, date: new Date().toISOString()})); } catch {}
    }
    apply(choice);
  };

  let banner;
  const close = () => { banner?.remove(); banner = null; };
  const open = () => {
    if (banner) return;
    const saved = read() || {analytics: false, marketing: false};
    banner = document.createElement('section');
    banner.className = 'consent-banner';
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.innerHTML = `
      <div class="consent-copy">
        <h2 id="consent-title">Tu privacidad</h2>
        <p>Usamos cookies propias y de terceros para medir el uso del sitio y mostrar anuncios relevantes. Solo se activan si lo aceptas. Consulta el <a href="${SETTINGS.privacyUrl}" target="_blank" rel="noopener noreferrer">aviso de privacidad</a>.</p>
      </div>
      <form class="consent-options" hidden>
        <label><input type="checkbox" name="analytics"${saved.analytics ? ' checked' : ''}><span><strong>Analítica</strong>Nos ayuda a entender cómo se usa el sitio.</span></label>
        <label><input type="checkbox" name="marketing"${saved.marketing ? ' checked' : ''}><span><strong>Marketing</strong>Permite medir y mostrar anuncios en redes sociales.</span></label>
      </form>
      <div class="consent-actions">
        <button type="button" class="consent-button" data-consent="reject">Rechazar</button>
        <button type="button" class="consent-button consent-accept" data-consent="accept">Aceptar</button>
        <button type="button" class="consent-link" data-consent="configure" aria-expanded="false">Configurar</button>
      </div>`;
    const options = banner.querySelector('.consent-options');
    const configure = banner.querySelector('[data-consent="configure"]');
    banner.addEventListener('click', event => {
      const action = event.target.closest('[data-consent]')?.dataset.consent;
      if (action === 'reject') { save({analytics: false, marketing: false}); close(); }
      else if (action === 'accept') { save({analytics: true, marketing: true}); close(); }
      else if (action === 'save') {
        save({analytics: options.elements.analytics.checked, marketing: options.elements.marketing.checked});
        close();
      } else if (action === 'configure') {
        options.hidden = false;
        configure.setAttribute('aria-expanded', 'true');
        configure.textContent = 'Guardar selección';
        configure.dataset.consent = 'save';
        options.querySelector('input').focus();
      }
    });
    document.body.append(banner);
  };

  const start = () => {
    // Lets anyone change the choice later from the footer.
    const links = document.querySelector('.footer-bottom > div');
    if (links && !links.querySelector('.consent-reopen')) {
      const reopen = document.createElement('button');
      reopen.type = 'button';
      reopen.className = 'consent-reopen';
      reopen.textContent = 'Preferencias de cookies';
      reopen.addEventListener('click', open);
      links.insertBefore(reopen, links.querySelector('a[href="#inicio"]'));
    }
    const saved = preview ? null : read();
    if (saved) apply(saved);
    else open();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
