(() => {
  'use strict';
  const TERMS = [12, 18, 24, 30, 36];
  const CALCULATION_RATE = 0.02;

  const OPENING_FEE = 0.045;
  function credit(amount, months) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 15000000 || !TERMS.includes(months)) throw new RangeError('Invalid credit scenario');
    const monthly = amount * CALCULATION_RATE / (1 - Math.pow(1 + CALCULATION_RATE, -months));
    const payments = monthly * months;
    const commission = amount * OPENING_FEE;
    return { monthly, payments, interest: payments - amount, commission, partialTotal: payments + commission };
  }
  const $ = selector => document.querySelector(selector);
  const dialog = $('#simulator-dialog'), amountInput = $('#sim-amount'), term = $('#sim-term'), currency = $('#sim-currency');
  let mode = 'credit', opener = null, step = 'scenario', sending = false;
  const received = new Set();
  const FORM_ENDPOINT = 'https://api.hsforms.com/submissions/v3/integration/submit/9145352/1da292ee-7ccc-42e4-a427-ece646e13e65';
  const drafts = {credit: '5,000,000', MXN: '1,000,000', USD: '100,000'};
  let activeCurrency = 'MXN';
  const parseAmount = text => {
    const clean = text.trim();
    const normalized = clean.replaceAll(',', '');
    return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(clean) && normalized.split('.')[0].length <= 12
      ? Number(normalized) : NaN;
  };
  function factoring(amount) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) throw new RangeError('Invalid factoring scenario');
    const cents = Math.round(amount * 100);
    const advanceCents = Math.floor((cents * 85 + 50) / 100);
    return {advance: advanceCents / 100, retained: (cents - advanceCents) / 100};
  }
  const money = value => new Intl.NumberFormat('es-MX', {style:'currency', currency: mode === 'credit' ? 'MXN' : activeCurrency, currencyDisplay:'code', minimumFractionDigits:2}).format(value);
  const save = () => { drafts[mode === 'credit' ? 'credit' : activeCurrency] = amountInput.value; };
  function render() {
    const amount = parseAmount(amountInput.value);
    const exceedsCreditLimit = mode === 'credit' && amount > 15000000;
    const valid = Number.isFinite(amount) && amount > 0 && amount <= 999999999999.99 && !exceedsCreditLimit && (mode !== 'credit' || TERMS.includes(Number(term.value)));
    $('#sim-error').hidden = valid;
    $('#sim-proposal').hidden = !exceedsCreditLimit;
    $('.sim-calculate').hidden = exceedsCreditLimit;
    $('#sim-results').hidden = !valid;
    amountInput.setAttribute('aria-invalid', String(!valid));
    term.setAttribute('aria-invalid', String(mode === 'credit' && !TERMS.includes(Number(term.value))));
    if (!valid) {
      $('#sim-results').replaceChildren();
      $('#sim-error').textContent = exceedsCreditLimit ? 'Este ejemplo corresponde a crédito sin garantía real, hasta $15 millones MXN. Para montos mayores, solicita una propuesta con garantía.' : mode === 'credit' && !TERMS.includes(Number(term.value)) ? 'Selecciona uno de los plazos disponibles.' : 'Escribe un monto mayor a cero, de hasta 12 dígitos. Las comas se agregan automáticamente; para centavos usa punto y hasta dos decimales.';
      return;
    }
    if (step !== 'result') { $('#sim-results').replaceChildren(); return; }
    const fragment = document.createDocumentFragment();
    const add = (tag, cls, text, parent=fragment) => { const e=document.createElement(tag); e.className=cls; e.textContent=text; parent.append(e); return e; };
    const rows = [];
    if (mode === 'credit') {
      const result = credit(amount, Number(term.value));
      add('p','sim-payment-label',`Mensualidad estimada · ${term.value} meses`);
      add('p','sim-payment',money(result.monthly));
      add('p','sim-result-note','Cálculo de ejemplo con 2% mensual y 4.5% de comisión de apertura. No es una oferta. No incluye IVA, seguros ni otros cargos. Puede haber diferencias de centavos por redondeo.');
      rows.push(['Capital solicitado',amount],['Intereses estimados del plazo',result.interest],['Suma de mensualidades',result.payments],['Comisión de apertura, antes de IVA',result.commission],['Total parcial: pagos + comisión, antes de IVA',result.partialTotal]);
    } else {
      const result = factoring(amount);
      add('p','sim-payment-label','Anticipo estimado de hasta 85%');
      add('p','sim-payment',money(result.advance));
      add('p','sim-result-note','Antes de costos y sujeto a elegibilidad. No es un importe neto autorizado.');
      rows.push(['Valor de las facturas',amount],['Retención inicial de 15%, ajustada por redondeo',result.retained]);
    }
    const dl = add('dl','sim-breakdown','');
    rows.forEach(([label,value])=>{const row=add('div','','',dl);add('dt','',label,row);add('dd','',money(value),row);});
    $('#sim-results').replaceChildren(fragment);
  }
  function selectMode(next) {
    save(); mode = next === 'factoring' ? 'factoring' : 'credit';
    amountInput.value = drafts[mode === 'credit' ? 'credit' : activeCurrency];
    $('#simulator-title').textContent = mode === 'credit' ? 'Simula tu crédito.' : 'Calcula tu anticipo.';
    $('#simulator-intro').textContent = mode === 'credit' ? 'Elige monto y plazo. Consulta tu estimación sin compartir datos personales.' : 'Indica el valor de tus facturas. Consulta el anticipo estimado sin compartir datos personales.';
    $('#sim-amount-label').textContent = mode === 'credit' ? 'Monto de crédito · MXN' : 'Valor de las facturas';
    $('#sim-term-field').hidden = mode !== 'credit'; $('#sim-currency-field').hidden = mode === 'credit';
    $('#sim-credit-assumptions').hidden = mode !== 'credit'; $('#sim-factoring-note').hidden = mode === 'credit';
    $('#sim-scope').textContent = mode === 'credit' ? 'Ejemplo de crédito sin garantía real: hasta $15 millones MXN. Aval según evaluación.' : 'Para facturas elegibles de productos o servicios entregados y aceptados. Moneda y porcentaje sujetos a evaluación.';
    setStep('scenario');
  }
  function setStep(next) {
    step = next;
    $('#sim-credit-assumptions').hidden = mode !== 'credit' || next === 'contact';
    $('#sim-factoring-note').hidden = mode === 'credit' || next === 'contact';
    $('#simulator-title').textContent = next === 'contact' ? 'Solicita asesoría.' : next === 'result' ? 'Tu estimación.' : mode === 'credit' ? 'Simula tu crédito.' : 'Calcula tu anticipo.';
    $('#simulator-intro').textContent = next === 'contact' ? 'Si quieres que revisemos tu escenario, comparte tus datos y autoriza el contacto.' : next === 'result' ? 'Un punto de partida para conversar. La propuesta final depende de la evaluación de tu empresa.' : mode === 'credit' ? 'Elige monto y plazo. Consulta tu estimación sin compartir datos personales.' : 'Indica el valor de tus facturas. Consulta el anticipo estimado sin compartir datos personales.';
    $('#sim-scenario').hidden = next !== 'scenario';
    $('#sim-contact').hidden = next !== 'contact';
    $('#sim-result-panel').hidden = next !== 'result';
    document.querySelectorAll('[data-step]').forEach(el => {
      if (el.dataset.step === next) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    render();
  }
  document.querySelectorAll('[data-simulate]').forEach(button=>button.addEventListener('click',()=>{
    opener = button;
    if (!sending) selectMode(button.dataset.simulate);
    if (!$('#mobile-nav').hidden) $('.menu-toggle').click();
    dialog.showModal(); dialog.scrollTop=0;document.body.classList.add('modal-open');
    (sending ? $('#sim-send-status') : amountInput).focus({preventScroll:true});
  }));
  dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  amountInput.addEventListener('input', () => {
    const text = amountInput.value;
    const caret = amountInput.selectionStart ?? text.length;
    const raw = text.replaceAll(',', '');
    // Format only unambiguous numbers; leave invalid text for validation.
    if (/^\d*(?:\.\d{0,2})?$/.test(raw)) {
      const position = text.slice(0, caret).replaceAll(',', '').length;
      const [integer, decimal] = raw.split('.');
      const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (decimal !== undefined ? '.' + decimal : '');
      amountInput.value = formatted;
      let index = 0, seen = 0;
      while (index < formatted.length && seen < position) {
        if (formatted[index] !== ',') seen++;
        index++;
      }
      amountInput.setSelectionRange(index, index);
    }
    $('#sim-proposal').hidden = true;
    $('.sim-calculate').hidden = false;
    $('#sim-error').hidden = true;
    amountInput.removeAttribute('aria-invalid');
    $('#sim-results').replaceChildren();
  });
  amountInput.addEventListener('blur', () => {
    const value = parseAmount(amountInput.value);
    if (Number.isFinite(value) && value > 0) amountInput.value = new Intl.NumberFormat('en-US', {maximumFractionDigits:2}).format(value);
    render();
  });
  term.addEventListener('change',render);
  currency.addEventListener('change',()=>{save();activeCurrency=currency.value==='USD'?'USD':'MXN';amountInput.value=drafts[activeCurrency];render();});
  function scenario() {
    const amount = parseAmount(amountInput.value);
    return mode === 'credit'
      ? 'Crédito empresarial · ' + money(amount) + ' · ' + term.value + ' meses'
      : 'Factoraje · Facturas por ' + money(amount);
  }
  function scenarioMessage() {
    const amount = parseAmount(amountInput.value);
    const figures = mode === 'credit' ? credit(amount, Number(term.value)) : null;
    return [
      'Solicitud web PYME — Centralia Financiera', scenario(),
      figures ? 'Mensualidad ilustrativa: ' + money(figures.monthly) + '. Comisión: ' + money(figures.commission) + '. Antes de IVA y otros cargos.' : 'Anticipo ilustrativo hasta 85%: ' + money(factoring(amount).advance) + ', antes de costos.',
      'Cargo: ' + $('#lead-role').value,
      'Destino: ' + ($('#lead-purpose').value || 'Por definir'),
      'Cuándo lo necesita: ' + ($('#lead-timing').value || 'Por definir'),
      'Declara representar una persona moral.',
      'Autorizó guardar datos y escenario en HubSpot y ser contactado para atender su solicitud.',
      'Fecha de autorización: ' + new Date().toISOString(),
      'Estimación orientativa. No es una oferta, aprobación o cotización definitiva.'
    ].join('\n');
  }
  $('#simulator-form').addEventListener('submit', event => {
    event.preventDefault(); render();
    if (!$('#sim-error').hidden) { (mode === 'credit' && !TERMS.includes(Number(term.value)) ? term : amountInput).focus(); return; }
    $('#sim-summary').textContent = scenario();
    $('#sim-send-error').hidden = true;
    $('#sim-send-status').textContent = '';
    $('.sim-success').hidden = true;
    $('#sim-request-advice').hidden = false;
    setStep('result'); $('#sim-results').focus({preventScroll:true}); dialog.scrollTop = 0;
  });
  $('#sim-request-advice').addEventListener('click', () => {
    setStep('contact'); $('#lead-name').focus({preventScroll:true}); dialog.scrollTop = 0;
  });
  const goBack = () => { if (!sending) { setStep('scenario'); amountInput.focus({preventScroll:true}); dialog.scrollTop = 0; } };
  $('#sim-back').addEventListener('click', goBack);
  $('#sim-new').addEventListener('click', goBack);
  const phone = $('#lead-phone');
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  ['lead-name', 'lead-company'].forEach(id => $('#'+id).addEventListener('input', () => $('#'+id).setCustomValidity('')));
  $('#sim-lead-form').addEventListener('submit', async event => {
    event.preventDefault(); if (sending || step !== 'contact') return;
    render();
    if (!$('#sim-error').hidden) { goBack(); return; }
    const form = event.currentTarget;
    ['lead-name','lead-company','lead-email','lead-phone'].forEach(id => { $('#'+id).value = $('#'+id).value.trim(); });
    const digits = phone.value.replace(/\D/g,'');
    phone.setCustomValidity(digits.length >= 10 && digits.length <= 15 && /^\+?[()\d\s.-]+$/.test(phone.value) ? '' : 'Escribe un teléfono válido de 10 a 15 dígitos. Usa + solo al inicio del código de país.');
    ['lead-name', 'lead-company'].forEach(id => $('#'+id).setCustomValidity($('#'+id).value.length >= 2 ? '' : 'Escribe al menos dos caracteres, sin contar espacios al inicio o al final.'));
    if (!form.reportValidity()) return;
    $('#sim-send-error').hidden = true;
    const values = { email: $('#lead-email').value, firstname: $('#lead-name').value, company: $('#lead-company').value, phone: phone.value, message: scenarioMessage() };
    const key = JSON.stringify([values.email.toLowerCase(),values.firstname,values.company,values.phone,$('#lead-role').value,scenario(),$('#lead-purpose').value,$('#lead-timing').value]);
    if (received.has(key)) { $('.sim-success').hidden = false; $('#sim-request-advice').hidden = true; setStep('result'); $('#sim-results').focus(); return; }
    sending = true; $('#sim-lead-fields').disabled = true;
    form.setAttribute('aria-busy','true');
    $('#sim-send-status').textContent = 'Guardando tu solicitud…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
        body:JSON.stringify({
          fields: Object.entries(values).map(([name,value])=>({objectTypeId:'0-1',name,value})),
          context:{
            ...(/^https?:$/.test(location.protocol) ? {pageUri:location.origin + location.pathname} : {}),
            pageName:'Centralia PYME | Simulación de ' + (mode === 'credit' ? 'crédito' : 'factoraje')
          },
          legalConsentOptions:{consent:{consentToProcess:true,text:$('#lead-consent').nextElementSibling.textContent}}
        })
      });
      if (!response.ok) throw new Error('submission_failed');
      received.add(key); $('.sim-success').hidden = false; $('#sim-request-advice').hidden = true; $('#sim-send-status').textContent = '';
      try { document.dispatchEvent(new CustomEvent('centralia:lead-confirmed', {detail: {source: mode === 'credit' ? 'simulator-credit' : 'simulator-factoring', submissionId: 'simulator-' + received.size}})); } catch { /* Optional measurement must never affect form success. */ }
      setStep('result'); dialog.scrollTop = 0;
      if (dialog.open) $('#sim-results').focus({preventScroll:true});
    } catch (error) {
      $('#sim-send-status').textContent = '';
      $('#sim-send-error').textContent = 'No pudimos confirmar el envío. Tus datos siguen aquí: revisa tu conexión e inténtalo de nuevo. También puedes contactarnos por WhatsApp desde la página.';
      $('#sim-send-error').hidden = false;
    } finally {
      clearTimeout(timeout); sending = false; $('#sim-lead-fields').disabled = false; form.removeAttribute('aria-busy');
    }
  });
  render();
  // Only pure arithmetic is exposed. Contact details stay in memory and are submitted solely with visitor consent.
  window.CENTRALIA_SIMULATION = Object.freeze({credit, factoring});
})();
