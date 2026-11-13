/* "Compartir esta estimación": arma un resumen de texto con lo que el visitante ve en la calculadora
   para que lo comparta con su socio o su contador. No pide datos, no envía nada a Centralia ni a HubSpot
   y no guarda nada en el navegador. Usa el menú de compartir del teléfono; en computadora copia el texto. */
(() => {
  'use strict';
  const NOTE = 'Estimación orientativa de Centralia Financiera. No es una cotización ni una aprobación; las condiciones se confirman en la propuesta.';
  const text = node => (node ? node.textContent.replace(/\s+/g, ' ').trim() : '');
  const valid = value => value && value !== '—';

  // Cada calculadora describe su escenario con los mismos datos que muestra en pantalla.
  const tools = {
    credit(root) {
      const amount = root.querySelector('#credit-inline-amount')?.value, payment = text(root.querySelector('#credit-inline-payment'));
      if (root.querySelector('#credit-inline-result')?.hidden || !valid(payment) || !amount) return null;
      return ['Crédito empresarial · $' + amount + ' MXN a ' + text(root.querySelector('#credit-inline-month-label')),
        'Pago mensual estimado: ' + payment,
        'Apertura del 5% (pago único): ' + text(root.querySelector('#credit-inline-fee')),
        'Tasa ilustrativa de 2% mensual. Importes antes de IVA y otros cargos.'];
    },
    factoring(root) {
      const advance = text(root.querySelector('#factoring-inline-advance'));
      if (root.querySelector('#factoring-inline-result')?.hidden || !valid(advance)) return null;
      return ['Factoraje · Facturas por ' + text(root.querySelector('#factoring-inline-invoices')),
        'Anticipo estimado de hasta 85%: ' + advance + ', antes de costos',
        'Remanente al cobro (15%): ' + text(root.querySelector('#factoring-inline-retained')),
        'Sobre facturas elegibles. Costos y plazo se confirman en la propuesta.'];
    },
    suppliers(root) {
      const total = text(root.querySelector('[data-out=total]'));
      if (!valid(total)) return null;
      return ['Pago a proveedores · Compra por ' + text(root.querySelector('[data-out=supplier]')) + ' MXN a ' + text(root.querySelector('[data-days]')),
        'Interés estimado (1.5% mensual): ' + text(root.querySelector('[data-out=interest]')),
        'Capital + interés estimado: ' + total + ' MXN',
        'Sin comisión de apertura. Antes de impuestos y otros cargos.'];
    }
  };

  function summary(kind, root, url) {
    const lines = tools[kind](root);
    return lines ? [...lines, NOTE, url].join('\n') : null;
  }

  async function share(button, env) {
    const kind = button.dataset.shareEstimate, root = button.closest(button.dataset.shareRoot) || env.document;
    const status = button.parentElement.querySelector('.estimate-share-status');
    const say = message => { if (status) status.textContent = message; };
    const body = summary(kind, root, env.location.origin + env.location.pathname);
    if (!body) return say('Corrige el monto para compartir la estimación.');
    if (typeof env.navigator.share === 'function' && env.matchMedia?.('(pointer: coarse)').matches) {
      try { await env.navigator.share({title: 'Estimación · Centralia Financiera', text: body}); say(''); return; }
      catch (error) { if (error?.name === 'AbortError') return; }
    }
    try { await env.navigator.clipboard.writeText(body); say('Estimación copiada. Lista para compartir.'); }
    catch { env.open('https://wa.me/?text=' + encodeURIComponent(body), '_blank', 'noopener'); say(''); }
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = {summary, NOTE}; return; }
  document.querySelectorAll('[data-share-estimate]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => share(button, window));
  });
})();
