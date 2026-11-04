(() => {
  'use strict';
  const TERMS = [12, 18, 24, 30, 36, 42, 48, 54, 60];
  const CALCULATION_RATE = 0.02;

  const OPENING_FEE = 0.045;
  const CREDIT_LIMITS = Object.freeze({unsecured:15000000, secured:50000000});
  function credit(amount, months, kind = 'unsecured') {
    if (!Object.hasOwn(CREDIT_LIMITS,kind) || !Number.isFinite(amount) || amount <= 0 || amount > CREDIT_LIMITS[kind] || !TERMS.includes(months)) throw new RangeError('Invalid credit scenario');
    const monthly = amount * CALCULATION_RATE / (1 - Math.pow(1 + CALCULATION_RATE, -months));
    const payments = monthly * months;
    // Only the unsecured opening fee is confirmed as an illustrative assumption.
    const commission = kind === 'unsecured' ? amount * OPENING_FEE : null;
    return { monthly, payments, interest: payments - amount, commission, partialTotal: commission === null ? null : payments + commission };
  }
  const $ = selector => document.querySelector(selector);
  const dialog = $('#simulator-dialog'), amountInput = $('#sim-amount'), term = $('#sim-term'), currency = $('#sim-currency');
  let creditKind = 'unsecured';
  const kindInput = $('#sim-credit-kind');
  // Keep the shared credit calculator's supported terms consistent on all pages.
  for(const months of TERMS)if(!Array.from(term.options).some(option=>Number(option.value)===months))term.add(new Option(months+' meses',String(months)));
  const creditScope = () => creditKind === 'secured' ? 'Crédito con garantía real: hasta $50 millones MXN y hasta 60 meses. Condiciones según evaluación.' : 'Crédito sin garantía real: hasta $15 millones MXN y hasta 60 meses. Aval según evaluación.';
  let provider = null;
  let factoringDays = null;
  const compactConsultation = document.body.classList.contains('unified-contact') || document.body.classList.contains('sales-preview');
  let inquiryOnly = false, inlineReview = false;
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
  const save = () => { if(!inquiryOnly)drafts[mode === 'credit' ? 'credit' : activeCurrency] = amountInput.value; };
  function render() {
    if (inquiryOnly) {
      $('#sim-error').hidden=true;$('#sim-proposal').hidden=true;
      $('#sim-results').replaceChildren();$('#sim-results').hidden=true;
      return;
    }
    if (mode === 'suppliers') {
      $('#sim-error').hidden=true;
      $('#sim-results').hidden=false;
      $('#sim-results').textContent=step==='result'?scenario():'';
      return;
    }
    const amount = parseAmount(amountInput.value);
    const exceedsCreditLimit = mode === 'credit' && amount > CREDIT_LIMITS[creditKind];
    const valid = Number.isFinite(amount) && amount > 0 && amount <= 999999999999.99 && !exceedsCreditLimit && (mode !== 'credit' || TERMS.includes(Number(term.value)));
    $('#sim-error').hidden = valid;
    $('#sim-proposal').hidden = !exceedsCreditLimit;
    $('.sim-calculate').hidden = exceedsCreditLimit;
    $('#sim-results').hidden = !valid;
    amountInput.setAttribute('aria-invalid', String(!valid));
    term.setAttribute('aria-invalid', String(mode === 'credit' && !TERMS.includes(Number(term.value))));
    if (!valid) {
      $('#sim-results').replaceChildren();
      $('#sim-error').textContent = exceedsCreditLimit ? creditScope() : mode === 'credit' && !TERMS.includes(Number(term.value)) ? 'Selecciona uno de los plazos disponibles.' : 'Escribe un monto mayor a cero, de hasta 12 dígitos. Las comas se agregan automáticamente; para centavos usa punto y hasta dos decimales.';
      return;
    }
    if (step !== 'result') { $('#sim-results').replaceChildren(); return; }
    const fragment = document.createDocumentFragment();
    const add = (tag, cls, text, parent=fragment) => { const e=document.createElement(tag); e.className=cls; e.textContent=text; parent.append(e); return e; };
    const rows = [];
    if (mode === 'credit') {
      const result = credit(amount, Number(term.value), creditKind);
      add('p','sim-payment-label',`Mensualidad estimada · ${term.value} meses`);
      add('p','sim-payment',money(result.monthly));
      add('p','sim-result-note',creditKind === 'secured' ? 'Ejemplo con tasa ilustrativa de 2% mensual. Comisión por confirmar; no está incluida. No es una oferta. No incluye IVA, seguros ni otros cargos.' : 'Cálculo de ejemplo con 2% mensual y 4.5% de comisión de apertura. No es una oferta. No incluye IVA, seguros ni otros cargos. Puede haber diferencias de centavos por redondeo.');
      rows.push(['Capital solicitado',amount],['Intereses estimados del plazo',result.interest],['Suma de mensualidades',result.payments]);
      if(result.commission !== null)rows.push(['Comisión de apertura, antes de IVA',result.commission],['Total parcial: pagos + comisión, antes de IVA',result.partialTotal]);
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
    creditKind=kindInput?.value==='secured'?'secured':'unsecured';
    factoringDays = null;
    if(mode!=='suppliers')save(); mode = next === 'factoring' ? 'factoring' : 'credit';
    inquiryOnly=false;inlineReview=false;
    amountInput.value = drafts[mode === 'credit' ? 'credit' : activeCurrency];
    $('#simulator-title').textContent = mode === 'credit' ? 'Simula tu crédito.' : 'Calcula tu anticipo.';
    $('#simulator-intro').textContent = mode === 'credit' ? 'Elige monto y plazo. Consulta tu estimación sin compartir datos personales.' : 'Indica el valor de tus facturas. Consulta el anticipo estimado sin compartir datos personales.';
    $('#sim-amount-label').textContent = mode === 'credit' ? 'Monto de crédito · MXN' : 'Valor de las facturas';
    $('#sim-term-field').hidden = mode !== 'credit'; $('#sim-currency-field').hidden = mode === 'credit';
    if($('#sim-credit-kind-field'))$('#sim-credit-kind-field').hidden=mode!=='credit';
    $('#sim-credit-assumptions').hidden = mode !== 'credit'; $('#sim-factoring-note').hidden = mode === 'credit';
    $('#sim-scope').textContent = mode === 'credit' ? creditScope() : 'Para facturas elegibles de productos o servicios entregados y aceptados. Moneda y porcentaje sujetos a evaluación.';
    setStep('scenario');
  }
  function setStep(next) {
    step = next;
    $('.sim-steps').hidden=mode==='suppliers'||inlineReview||inquiryOnly;
    $('#sim-back').textContent=mode==='suppliers'?'← Ajustar mi compra':'← Ajustar monto y plazo';
    $('#sim-new').textContent=mode==='suppliers'?'← Volver a mi compra':'← Ajustar mi simulación';
    $('#sim-credit-assumptions').hidden = mode !== 'credit' || next === 'contact';
    $('#sim-factoring-note').hidden = mode !== 'factoring' || next === 'contact';
    $('#simulator-title').textContent = next === 'contact' ? 'Solicita asesoría.' : next === 'result' ? 'Tu estimación.' : mode === 'credit' ? 'Simula tu crédito.' : 'Calcula tu anticipo.';
    $('#simulator-intro').textContent = next === 'contact' ? 'Si quieres que revisemos tu escenario, comparte tus datos y autoriza el contacto.' : next === 'result' ? 'Un punto de partida para conversar. La propuesta final depende de la evaluación de tu empresa.' : mode === 'credit' ? 'Elige monto y plazo. Consulta tu estimación sin compartir datos personales.' : 'Indica el valor de tus facturas. Consulta el anticipo estimado sin compartir datos personales.';
    $('#sim-scenario').hidden = next !== 'scenario';
    $('#sim-contact').hidden = next !== 'contact';
    $('#sim-result-panel').hidden = next !== 'result';
    document.querySelectorAll('[data-step]').forEach(el => {
      if (el.dataset.step === next) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    if(mode==='suppliers'){
      $('#simulator-title').textContent=next==='contact'?'Revisemos tu compra.':'Tu compra.';
      $('#simulator-intro').textContent=next==='contact'?'Comparte tus datos para revisar el monto y las fechas con Centralia. No es una cotización ni una aprobación.':'Recibimos tu consulta. Conserva estos datos para la conversación.';
    }
    if(compactConsultation && next==='contact' && mode!=='suppliers'){
      $('#simulator-title').textContent=mode==='credit'?'Revisemos tu financiamiento.':'Revisemos tus facturas.';
      $('#simulator-intro').textContent=mode==='credit'?'Te contactaremos para conocer tu proyecto y orientar la revisión.':'Te contactaremos para revisar tus facturas y explicarte qué preparar.';
      $('#sim-back').textContent=inquiryOnly?'← Volver a la página':'← Ajustar mi escenario';
    }
    if(compactConsultation && (inlineReview||inquiryOnly))$('#sim-new').textContent=inquiryOnly?'← Volver a la página':'← Ajustar mi escenario';
    const supplierReceived=mode==='suppliers'&&!!$('[data-supplier-confirmation]');
    if((compactConsultation||supplierReceived) && next==='result' && !$('.sim-success').hidden){
      $('#simulator-title').textContent='Ahora, lo revisamos contigo.';
      $('#simulator-intro').textContent='Tu consulta es el primer paso. No necesitas iniciar ningún registro adicional.';
      $('.sim-confirmed-scenario').textContent=scenario();
      $('.sim-steps').hidden=true;
    }
    render();
    if((compactConsultation||supplierReceived) && next==='result' && !$('.sim-success').hidden)$('#sim-results').hidden=true;
  }
  document.querySelectorAll('[data-simulate]').forEach(button=>button.addEventListener('click',()=>{
    opener = button;
    if (!sending) selectMode(button.dataset.simulate);
    if (!$('#mobile-nav').hidden) $('.menu-toggle').click();
    dialog.showModal(); dialog.scrollTop=0;document.body.classList.add('modal-open');
    (sending ? $('#sim-send-status') : amountInput).focus({preventScroll:true});
  }));
  document.addEventListener('centralia:credit-review', event => {
    if(sending)return;
    const data=event.detail;
    const nextKind=data?.kind ?? 'unsecured';
    if(!data||!Object.hasOwn(CREDIT_LIMITS,nextKind)||!Number.isFinite(data.amount)||data.amount<=0||data.amount>CREDIT_LIMITS[nextKind]||!TERMS.includes(data.months))return;
    selectMode('credit');
    creditKind=nextKind;if(kindInput)kindInput.value=creditKind;
    $('#sim-scope').textContent=creditScope();
    amountInput.value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(data.amount);
    term.value=String(data.months);save();
    inlineReview=true;
    opener=data.opener instanceof HTMLElement?data.opener:document.getElementById('credit-inline-review');
    $('#sim-summary').textContent=scenario();
    $('#sim-send-error').hidden=true;$('#sim-send-status').textContent='';$('.sim-success').hidden=true;
    $('#sim-request-advice').hidden=false;
    setStep('contact');
    if(!$('#mobile-nav').hidden)$('.menu-toggle').click();
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;document.body.classList.add('modal-open');$('#lead-name').focus({preventScroll:true});
  });
  document.addEventListener('centralia:factoring-review', event => {
    if(sending)return;const data=event.detail;
    if(!data||!Number.isFinite(data.amount)||data.amount<=0||data.amount>999999999999.99||!['MXN','USD'].includes(data.currency)||!Number.isInteger(data.days)||data.days<1||data.days>365)return;
    selectMode('factoring');activeCurrency=data.currency;currency.value=data.currency;factoringDays=data.days;
    amountInput.value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(data.amount);save();
    inlineReview=true;
    opener=data.opener instanceof HTMLElement?data.opener:document.getElementById('factoring-inline-review');
    $('#sim-summary').textContent=scenario();$('#sim-send-error').hidden=true;$('#sim-send-status').textContent='';$('.sim-success').hidden=true;$('#sim-request-advice').hidden=false;
    setStep('contact');if(!$('#mobile-nav').hidden)$('.menu-toggle').click();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.body.classList.add('modal-open');$('#lead-name').focus({preventScroll:true});
  });
  document.addEventListener('centralia:product-inquiry',event=>{
    if(sending||!compactConsultation)return;
    const data=event.detail;if(!data||!['credit','factoring'].includes(data.product))return;
    selectMode(data.product);inquiryOnly=true;inlineReview=true;
    // No default amount, date, or currency is attached to a direct consultation.
    opener=data.opener instanceof HTMLElement?data.opener:null;
    $('#sim-summary').textContent=scenario();$('#sim-send-error').hidden=true;$('#sim-send-status').textContent='';$('.sim-success').hidden=true;$('#sim-request-advice').hidden=false;
    setStep('contact');if(!$('#mobile-nav').hidden)$('.menu-toggle').click();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.body.classList.add('modal-open');$('#lead-name').focus({preventScroll:true});
  });
  document.addEventListener('centralia:provider-scenario', event=>{
    if(sending)return;
    const data=event.detail;
    if(!data||!/^\d{4}-\d{2}-\d{2}$/.test(data.payment)||!/^\d{4}-\d{2}-\d{2}$/.test(data.collection)||!Number.isFinite(data.days))return;
    if(mode!=='suppliers')save();
    if(data.amount!==undefined&&(!Number.isFinite(data.amount)||data.amount<=0||data.amount>999999999999.99||data.currency!=='MXN'))return;
    provider={payment:data.payment,collection:data.collection,days:data.days,amount:data.amount??null};mode='suppliers';
    inquiryOnly=false;inlineReview=false;
    opener=data.opener instanceof HTMLElement?data.opener:document.querySelector('[data-calendar-review]')||document.querySelector('[data-payment-planner] button');
    $('#sim-summary').textContent=scenario();$('#sim-send-error').hidden=true;$('#sim-send-status').textContent='';$('.sim-success').hidden=true;$('#sim-request-advice').hidden=false;
    setStep('contact');dialog.showModal();dialog.scrollTop=0;document.body.classList.add('modal-open');$('#lead-name').focus({preventScroll:true});
  });
  dialog.addEventListener('close' ,()=>opener?.focus({preventScroll:true}));
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
  kindInput?.addEventListener('change',()=>{creditKind=kindInput.value==='secured'?'secured':'unsecured';$('#sim-scope').textContent=creditScope();render();});
  currency.addEventListener('change',()=>{save();activeCurrency=currency.value==='USD'?'USD':'MXN';amountInput.value=drafts[activeCurrency];render();});
  function scenario() {
    if(inquiryOnly)return (mode==='credit'?'Crédito empresarial':'Factoraje')+' · Consulta sin monto definido. Lo revisamos contigo.';
    if(mode==='suppliers')return 'Pago a proveedores'+(provider.amount===null?'':' · Compra por '+new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',currencyDisplay:'code'}).format(provider.amount))+' · Pago: '+new Date(provider.payment+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})+' · Cobro previsto: '+new Date(provider.collection+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})+' · '+(provider.days<0?'Cobro previsto '+Math.abs(provider.days)+' días antes del pago':provider.days===0?'Pago y cobro el mismo día':'Diferencia: '+provider.days+' días')+'. Intervalo de planeación, no plazo autorizado.';
    const amount = parseAmount(amountInput.value);
    return mode === 'credit'
      ? 'Crédito empresarial · ' + money(amount) + ' · ' + term.value + ' meses · ' + (creditKind==='secured'?'Con garantía real':'Sin garantía real')
      : 'Factoraje · Facturas por ' + money(amount) + (factoringDays ? ' · Cobro previsto en '+factoringDays+' días; plazo sujeto a evaluación.' : '');
  }
  function scenarioMessage() {
    const amount = parseAmount(amountInput.value);
    const figures = mode === 'credit' && !inquiryOnly ? credit(amount, Number(term.value), creditKind) : null;
    return [
      'Solicitud web PYME — Centralia Financiera', scenario(),
      inquiryOnly ? 'Consulta directa: sin importe, moneda ni plazo indicados por el visitante.' : mode==='suppliers' ? 'Fecha de pago al proveedor: '+provider.payment+'\nFecha prevista de cobro: '+provider.collection+'\nRevisión de compra; sin cálculo de tasa, costo ni monto de financiamiento autorizado.' : figures ? 'Mensualidad ilustrativa: ' + money(figures.monthly) + '. Tasa ilustrativa: 2% mensual. Comisión: ' + (figures.commission===null?'por confirmar, no incluida':money(figures.commission)) + '. Antes de IVA y otros cargos.' : 'Anticipo ilustrativo hasta 85%: ' + money(factoring(amount).advance) + ', antes de costos.',
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
  const goBack = () => {
    if(sending)return;
    if(inlineReview||inquiryOnly){
      dialog.close();
      if(!inquiryOnly){const target=mode==='credit'?$('#credit-inline-amount'):$('#factoring-inline-amount');target?.scrollIntoView({block:'center',behavior:'instant'});target?.focus({preventScroll:true});}
      return;
    }
    if(mode==='suppliers'){dialog.close();return;}
    setStep('scenario');amountInput.focus({preventScroll:true});dialog.scrollTop=0;
  };
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
    const key = JSON.stringify([values.email.toLowerCase(),values.firstname,values.company,values.phone,scenario()]);
    const focusReceipt=()=>{const target=$('.sim-success:not([hidden])[tabindex]');(target||$('#sim-results')).focus({preventScroll:true});};
    if (received.has(key)) { $('.sim-success').hidden = false; $('#sim-request-advice').hidden = true; setStep('result'); focusReceipt(); return; }
    sending = true; $('#sim-lead-fields').disabled = true;
    form.setAttribute('aria-busy','true');
    $('#sim-send-status').textContent = 'Guardando tu solicitud…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    // HubSpot's visitor cookie travels only with measurement on and current analytics consent (pixel.js),
    // checked now, at submit time. Consent to process the request is not consent to analytics.
    let analyticsAllowed = false;
    try { analyticsAllowed = typeof window.__centraliaAnalyticsAllowed === 'function' && window.__centraliaAnalyticsAllowed() === true; } catch {}
    const hubspotToken = analyticsAllowed ? (/(?:^|;\s*)hubspotutk=([0-9a-f]{32})(?:;|$)/.exec(document.cookie) || [])[1] : undefined;
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
        body:JSON.stringify({
          fields: Object.entries(values).map(([name,value])=>({objectTypeId:'0-1',name,value})),
          context:{
            ...(/^https?:$/.test(location.protocol) ? {pageUri:location.origin + location.pathname} : {}),
            ...(hubspotToken ? {hutk:hubspotToken} : {}),
            pageName:mode==='suppliers'?'Centralia PYME | Consulta de pago a proveedores':'Centralia PYME | Simulación de ' + (mode === 'credit' ? 'crédito' : 'factoraje')
          },
          legalConsentOptions:{consent:{consentToProcess:true,text:$('#lead-consent').nextElementSibling.textContent}}
        })
      });
      if (!response.ok) throw new Error('submission_failed');
      received.add(key); $('.sim-success').hidden = false; $('#sim-request-advice').hidden = true; $('#sim-send-status').textContent = '';
      try { document.dispatchEvent(new CustomEvent('centralia:lead-confirmed', {detail: {source: mode === 'credit' ? 'simulator-credit' : mode==='suppliers'?'supplier-calendar':'simulator-factoring', submissionId: 'simulator-' + received.size}})); } catch { /* Optional measurement must never affect form success. */ }
      setStep('result'); dialog.scrollTop = 0;
      if (dialog.open) focusReceipt();
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
