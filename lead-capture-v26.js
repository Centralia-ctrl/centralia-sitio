/* Custom presentation, official HubSpot Forms API, same published form.
   No analytics cookies, background submissions, or automatic retries. */
(() => {
  'use strict';
  const ENDPOINT = 'https://api.hsforms.com/submissions/v3/integration/submit/9145352/68d091a6-92e3-4ca4-af92-9f87c41d140e';
  const PURPOSES = ['Crédito empresarial', 'Factoraje', 'Pago a proveedores'];
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
    if (!/^\+?[\d() .-]+$/.test(values.phone.trim()) || digits.length < 10 || digits.length > 15) return ['phone', 'Escribe un WhatsApp de 10 dígitos o incluye el código de tu país.'];
    const amount = parseAmount(values.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) return ['amount', 'Indica un monto mayor a cero. Por ejemplo: 1,000,000.'];
    if (!PURPOSES.includes(values.purpose)) return ['purpose', 'Selecciona la solución que te interesa.'];
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
  function payload(values, pageUri, hutk) {
    return {
      fields: [
        ['firstname', values.name.trim()], ['company', values.company.trim()], ['email', values.email.trim()],
        ['phone', values.phone.trim()],
        ['cul_es_el_monto_que_requiere_tu_empresa', String(parseAmount(values.amount))],
        ['para_que_necesitas_el_financiamiento', values.purpose]
      ].map(([name, value]) => ({objectTypeId: '0-1', name, value})),
      context: {pageUri, pageName: 'Centralia | Consulta de financiamiento', ...(hutk ? {hutk} : {})},
      legalConsentOptions: {consent: {consentToProcess: true, text: CONSENT}}
    };
  }
  function init(doc, env) {
    const form = doc.getElementById('centralia-contact-form');
    if (!form) return;
    const field = name => doc.getElementById('capture-' + name);
    const controls = ['name', 'company', 'email', 'phone', 'amount', 'purpose', 'consent'].map(field);
    const button = field('submit'), buttonText = field('submit-text');
    const error = field('error'), fallback = field('fallback'), success = field('success');
    let sending = false, accepted = false, step = 'need';
    const emit = action => doc.dispatchEvent(new env.CustomEvent('centralia:interaction', {detail:{action,product:'home'}}));
    const group = doc.createElement('ol'); group.className='cx-steps'; group.setAttribute('aria-label','Pasos de tu consulta');
    for (const text of ['1 · Tu necesidad','2 · Tus datos']) {const li=doc.createElement('li');li.textContent=text;group.append(li);}
    form.querySelector('.capture-form-meta').after(group);
    const personal=['name','company','email','phone'].map(name=>field(name).closest('label'));
    const need=['amount','purpose'].map(name=>field(name).closest('label'));
    const back=doc.createElement('button');back.type='button';back.className='cx-back';back.textContent='← Volver a mi necesidad';button.after(back);
    function showStep(next,focus=true) {
      step=next; clearErrors();
      personal.forEach(label=>{label.hidden=next!=='contact';});
      need.forEach(label=>{label.hidden=next!=='need';});
      field('consent').closest('label').hidden=next!=='contact';
      back.hidden=next!=='contact';buttonText.textContent=next==='need'?'Continuar':'Enviar mi consulta';
      [...group.children].forEach((li,index)=>{if(index===(next==='need'?0:1))li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
      if(focus)field(next==='need'?'amount':'name').focus();
    }
    back.addEventListener('click',()=>{if(!sending)showStep('need');});
    doc.addEventListener('centralia:open-consultation',()=>{if(!sending&&!accepted)showStep('need',false);});
    const selected={credit:'Crédito empresarial',factoring:'Factoraje',suppliers:'Pago a proveedores'}[new URLSearchParams(env.location.search).get('solucion')];
    if(selected)field('purpose').value=selected;
    let started=false; form.addEventListener('input',()=>{if(!started){started=true;emit('form_started');}},{passive:true});
    function clearErrors() {
      controls.forEach(control => {control.removeAttribute('aria-invalid'); control.removeAttribute('aria-describedby');});
      error.hidden = true;
    }
    function fail(message, control) {
      error.textContent = message; error.hidden = false;
      if (control) {control.setAttribute('aria-invalid', 'true'); control.setAttribute('aria-describedby', 'capture-error'); control.focus();}
    }
    controls.forEach(control => control.addEventListener('input', clearErrors));
    const amountInput = field('amount');
    let amountWasValid = isEditableAmount(amountInput.value);
    amountInput.addEventListener('beforeinput', event => {
      amountWasValid = isEditableAmount(amountInput.value);
      const start = amountInput.selectionStart, end = amountInput.selectionEnd;
      // Backspace/Delete beside an automatic separator also removes the
      // adjacent digit, instead of repeatedly removing/reinserting the comma.
      if (start !== end || event.isComposing) return;
      if (event.inputType === 'deleteContentBackward' && amountInput.value[start - 1] === ',') amountInput.setSelectionRange(Math.max(0, start - 2), start);
      if (event.inputType === 'deleteContentForward' && amountInput.value[start] === ',') amountInput.setSelectionRange(start, start + 2);
    });
    const formatWhileEditing = event => {
      if (event.isComposing) return;
      const pasted = event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop';
      // A pasted ambiguous amount (e.g. 1,5) must be corrected explicitly.
      if ((pasted || !amountWasValid) && !isEditableAmount(amountInput.value)) return;
      const formatted = formatAmountInput(amountInput.value, amountInput.selectionStart, amountInput.selectionEnd);
      if (!formatted) return;
      if (formatted.value !== amountInput.value) {
        amountInput.value = formatted.value;
        amountInput.setSelectionRange(formatted.start, formatted.end);
      }
    };
    amountInput.addEventListener('input', formatWhileEditing);
    amountInput.addEventListener('compositionend', formatWhileEditing);
    field('amount').addEventListener('blur', () => {
      const amount = parseAmount(field('amount').value);
      if (Number.isFinite(amount) && amount > 0) field('amount').value = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(amount);
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending || accepted) return;
      clearErrors(); fallback.hidden = true;
      const values = Object.fromEntries(controls.map(control => [control.id.replace('capture-', ''), control.type === 'checkbox' ? control.checked : control.value]));
      if(step==='need') {
        const amount=parseAmount(values.amount);
        if(!Number.isFinite(amount)||amount<=0||amount>999999999999.99){fail('Indica un monto mayor a cero. Por ejemplo: 1,000,000.',field('amount'));return;}
        if(!PURPOSES.includes(values.purpose)){fail('Selecciona la solución que te interesa.',field('purpose'));return;}
        showStep('contact');emit('form_step_completed');return;
      }
      const invalid = validate(values);
      if (invalid) {if(['amount','purpose'].includes(invalid[0]))showStep('need',false);fail(invalid[1], field(invalid[0])); return;}
      if (!form.checkValidity()) {form.reportValidity(); return;}
      sending = true; back.disabled=true; button.disabled = true; controls.forEach(control => {control.disabled = true;});
      form.setAttribute('aria-busy', 'true'); buttonText.textContent = 'Enviando tu consulta…';
      const controller = new env.AbortController();
      const timeout = env.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await env.fetch(ENDPOINT, {
          method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'omit',
          body: JSON.stringify(payload(values, env.location.origin + env.location.pathname, analyticsAllowed(env) ? hubspotToken(doc.cookie) : '')), signal: controller.signal
        });
        if (!response.ok) {
          fail(response.status === 429 ? 'Hay demasiados intentos. Espera unos minutos antes de volver a enviar.' : 'No pudimos registrar la consulta. Tus datos siguen aquí; puedes intentarlo de nuevo o abrir el formulario alternativo.');
          fallback.hidden = false; return;
        }
        accepted = true; form.hidden = true; success.hidden = false; field('success-title').focus();
        try { doc.dispatchEvent(new env.CustomEvent('centralia:lead-confirmed', {detail: {source: 'home', submissionId: 'home'}})); } catch { /* Optional measurement must never affect form success. */ }
      } catch {
        fail('No pudimos confirmar la recepción. Tus datos siguen aquí. Antes de reenviar, puedes consultar con nosotros por WhatsApp.');
        fallback.hidden = false;
      } finally {
        env.clearTimeout(timeout); sending = false; form.removeAttribute('aria-busy');
        controls.forEach(control => {control.disabled = false;});
        back.disabled=false; button.disabled = accepted; buttonText.textContent = 'Enviar mi consulta';
      }
    });
    showStep('need',false);
    form.noValidate = true;
    button.disabled = false;
    if ('IntersectionObserver' in env) {
      const observer = new env.IntersectionObserver(entries => {
        doc.body.classList.toggle('capture-in-view', entries.some(entry => entry.isIntersecting));
      }, {threshold: 0.1});
      observer.observe(doc.getElementById('consulta'));
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {validate, payload, init, formatAmountInput, hubspotToken, analyticsAllowed};
  else init(document, window);
})();
