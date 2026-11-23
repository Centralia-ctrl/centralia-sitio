/* The published homepage form contract, reused without changing its fields or destination. */
(function(env){'use strict';
  const ENDPOINT = 'https://api.hsforms.com/submissions/v3/integration/submit/9145352/68d091a6-92e3-4ca4-af92-9f87c41d140e';
  const PURPOSES = ['Crédito empresarial', 'Factoraje', 'Pago a proveedores'];
  // Who does not know the amount yet still reaches HubSpot: the amount property is free text, so it receives this value.
  const AMOUNT_UNKNOWN = 'Por definir';
  const CONSENT = 'Autorizo a Centralia a usar mis datos para atender esta consulta y contactarme. He leído el aviso de privacidad.';
  const parseAmount = value => /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value.trim()) ? Number(value.replaceAll(',', '')) : NaN;
  const isEditableAmount = value => value === '' || /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{0,2})?$/.test(value);
  function formatAmountInput(value, start = value.length, end = start) {
    // Preserve invalid or over-precise input so validation can explain it;
    // never silently remove signs, letters or decimal digits.
    if (!/^[\d,]*(?:\.\d{0,2})?$/.test(value)) return null;
    const raw = value.replaceAll(',', '');
    const [integer, fraction] = raw.split('.');
    const addedZero = raw.startsWith('.') ? 1 : 0;
    const grouped = (integer || (addedZero ? '0' : '')).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = grouped + (fraction === undefined ? '' : '.' + fraction);
    function position(offset) {
      let remaining = value.slice(0, offset).replaceAll(',', '').length + (offset > 0 ? addedZero : 0);
      let cursor = 0;
      while (cursor < formatted.length && remaining > 0) {if (formatted[cursor] !== ',') remaining--; cursor++;}
      return cursor;
    }
    return {value: formatted, start: position(start), end: position(end)};
  }
  function validate(values) {
    if (values.name.trim().length < 2) return ['name', 'Escribe tu nombre con al menos dos caracteres.'];
    if (values.company.trim().length < 2) return ['company', 'Escribe el nombre de tu empresa con al menos dos caracteres.'];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return ['email', 'Escribe un correo electrónico válido.'];
    const digits = values.phone.replace(/\D/g, '');
    if (!/^\+?[\d() .-]+$/.test(values.phone.trim()) || digits.length < 10 || digits.length > 15) return ['phone', 'Escribe un teléfono de 10 dígitos o incluye el código de tu país.'];
    if (!PURPOSES.includes(values.purpose)) return ['purpose', 'Selecciona la solución que te interesa.'];
    const amount = parseAmount(values.amount);
    if (!values['amount-unknown'] && (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99)) return ['amount', 'Indica un monto mayor a cero o marca "Todavía no sé cuánto necesito".'];
    if (!values.consent) return ['consent', 'Autoriza el uso de tus datos para que podamos atender tu consulta.'];
    return null;
  }
  // HubSpot's visitor cookie; with it, the lead keeps its source. It travels only if analyticsAllowed() says so.
  function hubspotToken(cookie) {
    const match = /(?:^|;\s*)hubspotutk=([0-9a-f]{32})(?:;|$)/.exec(cookie || '');
    return match ? match[1] : '';
  }
  // Asked at submit time: measurement on and current analytics consent (pixel.js). Consent to process the
  // inquiry is not consent to analytics.
  function analyticsAllowed(env) {
    try { return typeof env.__centraliaAnalyticsAllowed === 'function' && env.__centraliaAnalyticsAllowed() === true; }
    catch { return false; }
  }
  // What the confirmation repeats back: only what the person just sent, never a link onward.
  function summary(values) {
    if (values['amount-unknown']) return {purpose: values.purpose, amount: AMOUNT_UNKNOWN};
    return {purpose: values.purpose, amount: '$' + new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(parseAmount(values.amount)) + ' MXN'};
  }
  function payload(values, pageUri, hutk) {
    return {
      fields: [
        ['firstname', values.name.trim()], ['company', values.company.trim()], ['email', values.email.trim()],
        ['phone', values.phone.trim()],
        ['cul_es_el_monto_que_requiere_tu_empresa', values['amount-unknown'] ? AMOUNT_UNKNOWN : String(parseAmount(values.amount))],
        ['para_que_necesitas_el_financiamiento', values.purpose]
      ].map(([name, value]) => ({objectTypeId: '0-1', name, value})),
      context: {pageUri, pageName: 'Centralia | Consulta de financiamiento', ...(hutk ? {hutk} : {})},
      legalConsentOptions: {consent: {consentToProcess: true, text: CONSENT}}
    };
  }

const contract={ENDPOINT,CONSENT,parseAmount,validate,payload,summary,analyticsAllowed,hubspotToken};if(typeof module!=='undefined'&&module.exports)module.exports=contract;else env.centraliaContactForm=contract;
})(typeof window==='undefined'?{}:window);
