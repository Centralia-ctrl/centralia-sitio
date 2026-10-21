(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const highlightProduct = key => {
    $$('[data-offer]').forEach(card => { card.dataset.active = String(card.dataset.offer === key); });
    $$('[data-product-dot]').forEach(dot => { dot.setAttribute('aria-pressed', String(dot.dataset.productDot === key)); });
  };
  $$('[data-offer]').forEach(card => {
    card.addEventListener('pointerenter', () => highlightProduct(card.dataset.offer));
    card.addEventListener('focusin', () => highlightProduct(card.dataset.offer));
  });
  $$('[data-product-dot]').forEach((dot, index, dots) => {
    dot.addEventListener('click', () => {
      const card = $(`[data-offer="${dot.dataset.productDot}"]`);
      highlightProduct(dot.dataset.productDot);
      card.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      $('.finance-cta', card).focus({ preventScroll: true });
    });
    dot.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? dots.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + dots.length) % dots.length;
      dots[next].focus({ preventScroll: true });
      highlightProduct(dots[next].dataset.productDot);
    });
  });
  // Optional company destinations are kept out of the visitor flow until verified.
  const external = window.CENTRALIA_CONNECTIONS || {};
  const allowedHosts = {
    hubspot: ['share.hsforms.com', 'forms.hsforms.com', 'meetings.hubspot.com', 'meetings-na1.hubspot.com', 'meetings-eu1.hubspot.com'],
    facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
    instagram: ['instagram.com', 'www.instagram.com']
  };
  const verifiedDestination = key => {
    try {
      const url = new URL(external[key]);
      return url.protocol === 'https:' && allowedHosts[key].includes(url.hostname) && !url.username && !url.password && url.pathname !== '/' ? url.href : null;
    } catch { return null; }
  };
  ['facebook', 'instagram'].forEach(key => {
    const url = verifiedDestination(key);
    if (!url) return;
    const link = $(`[data-social="${key}"]`);
    link.href = url;
    link.hidden = false;
    $('.social-links').hidden = false;
  });
  const onlineDestination = verifiedDestination('hubspot');
  if (onlineDestination) {
    $$('[data-hubspot]').forEach(link => { link.href = onlineDestination; link.hidden = false; });
    $$('[data-schedule]').forEach(link => { link.href = onlineDestination; link.target = '_blank'; link.rel = 'noopener noreferrer'; });
  }
  const routes = {
    capital: {
      title: 'Capital para crecer',
      message: 'crédito empresarial para la operación o expansión de mi empresa',
      range: 'Hasta $50 millones MXN con garantía real, o hasta $15 millones sin garantía real. Exclusivo para personas morales.',
      facts: [
        ['Con garantía', 'Hasta $50 millones MXN. Línea de hasta 5 años; condiciones y disposiciones según modalidad.'],
        ['Sin garantía real', 'Hasta $15 millones MXN. Modalidades de 6 a 36 meses; aval según evaluación.'],
        ['Tasa de interés', 'Se confirma en la propuesta individual según perfil, plazo y modalidad. Pide la tasa y su periodicidad por escrito.'],
        ['Comisiones', 'Con garantía: comisión por disposición de 1%, 2% o 4%, según modalidad. Sin garantía real: comisión por apertura de 4.5%.'],
        ['Perfil de empresa', 'Persona moral. Se revisan antigüedad, facturación, historial crediticio, capacidad de pago y, cuando aplica, la garantía.']
      ],
      note: 'Montos máximos sujetos a evaluación. Las modalidades son alternativas, no se suman. La propuesta confirmará tasa, comisiones, impuestos, costo total, garantías y calendario de pagos antes de contratar.'
    },
    liquidez: {
      title: 'Factoraje empresarial',
      message: 'factoraje para anticipar el cobro de las facturas de mi empresa',
      range: 'Anticipo de hasta 85% del valor de las facturas elegibles, antes de costos y sujeto a evaluación.',
      facts: [
        ['Para quién', 'Personas morales que venden a otras empresas y tienen facturas por cobrar de productos o servicios entregados y aceptados.'],
        ['Anticipo', 'Hasta 85% sobre facturas elegibles. La línea y el porcentaje aprobado dependen de la operación y del comprador.'],
        ['Moneda', 'Alternativas para facturas en pesos mexicanos o dólares estadounidenses, según elegibilidad.'],
        ['Costo del factoraje', 'Se cotiza según el pagador, el monto y los días de financiamiento. Solicita porcentaje, base de cálculo, periodicidad y costo total.'],
        ['Liquidación', 'Al recibir el pago de la factura se libera el remanente, menos los costos aplicables conforme al contrato.']
      ],
      note: 'El cálculo del formulario es ilustrativo: multiplica el valor ingresado por 85%. No descuenta costos ni valida facturas, compradores o líneas. El anticipo efectivo se confirma en la propuesta.'
    },
    pagos: {
      title: 'Pago a proveedores',
      message: 'financiamiento para pagar a los proveedores de mi empresa en México o el extranjero',
      range: 'Línea revolvente de hasta US$5 millones, con hasta 37 días de financiamiento. Sujeta a evaluación.',
      facts: [
        ['Línea de crédito', 'Hasta US$5 millones. El monto autorizado depende del perfil y evaluación de la empresa.'],
        ['Plazo', 'Hasta 37 días. El plazo se evalúa según la operación y se confirma en la propuesta, dentro de las condiciones de la línea.'],
        ['Cobertura', 'Pagos en México y a proveedores en más de 150 países. Monedas y destinos según disponibilidad.'],
        ['Tasa y comisiones', 'Se confirman en la propuesta y antes de cada operación. El costo de financiamiento, la transferencia y el tipo de cambio se revisan por separado.'],
        ['Control de pagos', 'Pagos agrupados, programación de fechas y controles de autorización para la operación de tu empresa.']
      ],
      note: 'La línea máxima se expresa en dólares estadounidenses. Los montos en MXN del formulario son una referencia de tu necesidad, no una conversión ni una autorización. Centralia te acompaña a revisar el costo total.'
    },
    orientacion: {
      title: 'Financiamiento para mi empresa',
      message: 'la estructura de financiamiento más adecuada para mi empresa',
      range: 'Atendemos exclusivamente a personas morales. Cuéntanos tu objetivo y el monto que necesita tu empresa.'
    }
  };
  const info = {
    privacy: {
      title: 'Tu consulta, bajo tu control.',
      paragraphs: [
        'El formulario de la portada está conectado al formulario oficial de Centralia en HubSpot. Al pulsar Enviar, tus datos se remiten a Centralia para atender tu consulta. El formulario de la simulación también envía a HubSpot los datos de contacto, empresa y escenario que compartas, con la autorización de contacto indicada en ese formulario. Consulta el aviso de privacidad de Centralia para conocer el tratamiento de tus datos.',
        'Puedes consultar o solicitar la eliminación de tus datos escribiendo a hola@centraliafinanciera.com. La consulta por WhatsApp o correo prepara un mensaje que podrás revisar y enviar mediante la plataforma que elijas. Al abrir la página de reuniones de HubSpot, ingresarás tus datos directamente allí. Se aplican las condiciones y políticas de cada plataforma.',
        'La consulta no autoriza una revisión de tu historial crediticio. Antes de entregar documentos o continuar con una solicitud, pide a tu asesor el aviso de privacidad y los consentimientos correspondientes.'
      ]
    },
    service: {
      title: 'Una decisión con información.',
      paragraphs: [
        'Centralia acompaña la evaluación y contratación de financiamiento para personas morales. La autorización y el otorgamiento corresponden a la institución financiera.',
        'Los montos publicados son máximos de modalidades específicas, sujetos a perfil y evaluación. No se suman entre sí, no constituyen una oferta y no son una preaprobación. El anticipo del formulario es un cálculo ilustrativo antes de costos.',
        'La propuesta individual debe identificar a la institución otorgante y detallar tasa, periodicidad, comisiones, impuestos, plazos, garantías y costo total aplicable antes de contratar. El contacto por WhatsApp sirve para solicitar información y aclarar los siguientes pasos con Centralia.'
      ]
    }
  };
  const brief = $('#brief-dialog');
  const amount = $('#amount');
  const route = $('#route');
  const currency = $('#currency');
  const form = $('#finance-form');
  const message = $('#consult-message');
  const details = $('#details-dialog');
  const format = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
  const moneyFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
  const money = (value, code) => `${code === 'USD' ? 'US$' : '$'}${moneyFormat.format(value)} ${code}`;
  let undecided = false;
  let activeDetails = 'capital';
  let currentRoute = route.value;
  let currentCurrency = 'MXN';
  const drafts = new Map();
  const routeCurrencies = new Map();
  const returnFocus = new WeakMap();
  const numericAmount = () => {
    const text = amount.value.trim();
    return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text) && text.replaceAll(',', '').split('.')[0].length <= 12
      ? Number(text.replaceAll(',', '')) : NaN;
  };
  const factoringAdvance = value => Math.floor((Math.round(value * 100) * 85 + 50) / 100) / 100;
  const closeMenu = () => {
    $('#mobile-nav').hidden = true;
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    $('.menu-toggle').setAttribute('aria-label', 'Abrir menú');
    $('.menu-toggle use').setAttribute('href', '#i-menu');
  };
  const openDialog = (dialog, trigger = document.activeElement) => {
    closeMenu();
    returnFocus.set(dialog, trigger);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('modal-open');
  };
  $$('dialog').forEach(dialog => {
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if ($('dialog[open]')) return;
      document.body.classList.remove('modal-open');
      const trigger = returnFocus.get(dialog);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  const clearError = () => { $('#amount-error').hidden = true; amount.removeAttribute('aria-invalid'); };
  const setPresets = value => $$('[data-amount]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.amount === value)));
  const updateHint = () => {
    let hint = routes[currentRoute].range;
    const value = numericAmount();
    if (!undecided && currentRoute === 'capital') {
      if (value > 50000000) hint += ' El monto supera este máximo; lo revisaremos contigo sin prometer una autorización.';
      else if (value > 15000000) hint += ' Por el monto indicado, revisaremos la modalidad con garantía real.';
    }
    if (!undecided && currentRoute === 'pagos' && currentCurrency === 'USD' && value > 5000000) hint += ' El monto indicado supera el máximo de esta línea.';
    $('#route-hint').textContent = hint;
    const isFactoring = currentRoute === 'liquidez';
    $('#amount-label').textContent = isFactoring ? '¿Cuál es el valor de tus facturas?' : currentRoute === 'pagos' ? '¿Qué monto necesita pagar tu empresa?' : '¿Cuánto capital busca tu empresa?';
    $('#advance-estimate').hidden = !isFactoring || undecided || !Number.isFinite(value) || value <= 0;
    $('#advance-value').textContent = isFactoring && !undecided && value > 0 ? money(factoringAdvance(value), currentCurrency) : '';
    $('#amount-currency').textContent = currentCurrency;
    $('.amount-input > span').textContent = currentCurrency === 'USD' ? 'US$' : '$';
  };
  const saveDraft = () => {
    drafts.set(`${currentRoute}:${currentCurrency}`, { value: amount.value, undecided });
    routeCurrencies.set(currentRoute, currentCurrency);
  };
  const restoreDraft = () => {
    const draft = drafts.get(`${currentRoute}:${currentCurrency}`) || { value: '', undecided: false };
    undecided = draft.undecided;
    amount.value = draft.value;
    amount.disabled = undecided;
    amount.required = !undecided;
    currency.value = currentCurrency;
    $('#currency-field').hidden = !['liquidez', 'pagos'].includes(currentRoute);
    const options = currentCurrency === 'USD' ? [[250000, 'US$250 mil'], [1000000, 'US$1 millón'], [5000000, 'US$5 millones']] : [[5000000, '$5 millones'], [10000000, '$10 millones'], [25000000, '$25 millones']];
    $$('[data-amount]').slice(0, 3).forEach((button, i) => { button.dataset.amount = String(options[i][0]); button.textContent = options[i][1]; });
    amount.placeholder = currentCurrency === 'USD' ? '1,000,000' : '5,000,000';
    setPresets(undecided ? '' : amount.value ? String(numericAmount()) : null);
    clearError();
    updateHint();
  };
  const selectRoute = key => {
    saveDraft();
    currentRoute = routes[key] ? key : 'orientacion';
    route.value = currentRoute;
    currentCurrency = routeCurrencies.get(currentRoute) || 'MXN';
    restoreDraft();
    highlightProduct(currentRoute);
  };
  const showInput = () => {
    $('#brief-input').hidden = false;
    $('#brief-review').hidden = true;
    brief.setAttribute('aria-labelledby', 'brief-title');
    brief.scrollTop = 0;
  };
  const startBrief = (key, trigger) => {
    selectRoute(key);
    showInput();
    openDialog(brief, trigger);
  };
  $$('[data-start]').forEach(button => button.addEventListener('click', () => startBrief(button.dataset.start, button)));
  $$('[data-schedule]').forEach(link => link.addEventListener('click', event => {
    if (onlineDestination) return;
    event.preventDefault();
    startBrief('orientacion', link);
  }));
  route.addEventListener('change', () => selectRoute(route.value));
  currency.addEventListener('change', () => {
    saveDraft();
    currentCurrency = currency.value === 'USD' && ['liquidez', 'pagos'].includes(currentRoute) ? 'USD' : 'MXN';
    restoreDraft();
  });
  $$('[data-details]').forEach(button => button.addEventListener('click', () => {
    activeDetails = button.dataset.details;
    const product = routes[activeDetails];
    $('#details-title').textContent = product.title;
    $('#details-range').textContent = product.range;
    $('#details-note').textContent = product.note;
    $('#details-facts').replaceChildren();
    product.facts.forEach(([label, content]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label; definition.textContent = content;
      row.append(term, definition); $('#details-facts').append(row);
    });
    openDialog(details, button);
  }));
  $('#details-start').addEventListener('click', () => {
    const trigger = returnFocus.get(details);
    details.close();
    startBrief(activeDetails, trigger);
  });
  $$('[data-info]').forEach(button => button.addEventListener('click', () => {
    const copy = info[button.dataset.info];
    $('#info-title').textContent = copy.title;
    $('#info-copy').replaceChildren();
    copy.paragraphs.forEach(text => { const p = document.createElement('p'); p.textContent = text; $('#info-copy').append(p); });
    if (button.dataset.info === 'privacy') {
      const link = document.createElement('a');
      link.href = 'https://centraliafinanciera.com/aviso-de-privacidad/';
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.className = 'privacy-notice-link'; link.textContent = 'Consultar el aviso de privacidad';
      $('#info-copy').append(link);
    }
    openDialog($('#info-dialog'), button);
  }));
  $$('[data-amount]').forEach(button => button.addEventListener('click', () => {
    undecided = button.dataset.amount === '';
    amount.disabled = undecided;
    amount.required = !undecided;
    amount.value = undecided ? 'Por definir' : format.format(Number(button.dataset.amount));
    setPresets(button.dataset.amount); clearError(); updateHint();
  }));
  amount.addEventListener('input', () => {
    clearError();
    setPresets(amount.value ? String(numericAmount()) : null);
    updateHint();
  });
  amount.addEventListener('blur', () => { if (!undecided && numericAmount() > 0) amount.value = format.format(numericAmount()); });
  amount.addEventListener('invalid', () => { $('#amount-error').hidden = false; amount.setAttribute('aria-invalid', 'true'); });
  const updateContact = () => {
    const text = message.value.trim();
    $('#whatsapp-send').href = `https://wa.me/525548092849?text=${encodeURIComponent(text)}`;
    $('#email-send').href = `mailto:hola@centraliafinanciera.com?subject=${encodeURIComponent('Consulta de financiamiento · Centralia')}&body=${encodeURIComponent(text)}`;
    [$('#whatsapp-send'), $('#email-send')].forEach(link => link.setAttribute('aria-disabled', String(!text)));
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!undecided && (!Number.isFinite(numericAmount()) || numericAmount() <= 0)) {
      $('#amount-error').hidden = false; amount.setAttribute('aria-invalid', 'true'); amount.focus(); return;
    }
    if (!form.reportValidity()) return;
    clearError();
    saveDraft();
    const company = $('#company').value.trim();
    const contact = $('#contact-name').value.trim();
    if (!company || !contact) { (!company ? $('#company') : $('#contact-name')).focus(); return; }
    const context = [
      `Mi nombre es ${contact}. Mi empresa es ${company}. Somos una persona moral.`,
      $('#revenue').value ? `Ventas anuales: ${$('#revenue').value}${$('#revenue').value === 'Lo comparto en la reunión' ? '' : ' MXN'}.` : '',
      $('#purpose').value ? `Destino del capital: ${$('#purpose').value}.` : ''
    ].filter(Boolean).join('\n');
    const value = numericAmount();
    let amountText = undecided ? 'El monto está por definir.' : `Monto de referencia: ${money(value, currentCurrency)}.`;
    if (currentRoute === 'liquidez') amountText = undecided ? 'El valor de las facturas está por definir.' : `Valor de las facturas: ${money(value, currentCurrency)}. Anticipo orientativo de hasta 85%: ${money(factoringAdvance(value), currentCurrency)}, antes de costos y sujeto a evaluación.`;
    message.value = `Hola, Centralia. Quiero consultar sobre ${routes[currentRoute].message}.\n\n${context}\n${amountText}\n\nMe gustaría revisar el plazo, la tasa, las comisiones, las garantías y el costo total. ¿Qué información necesitan para revisar mi caso?`;
    updateContact();
    $('#brief-input').hidden = true;
    $('#brief-review').hidden = false;
    brief.setAttribute('aria-labelledby', 'review-title');
    brief.scrollTop = 0;
    message.focus({ preventScroll: true });
  });
  message.addEventListener('input', updateContact);
  [$('#whatsapp-send'), $('#email-send')].forEach(link => link.addEventListener('click', event => {
    if (!message.value.trim()) { event.preventDefault(); message.focus(); }
  }));
  $('#back-to-brief').addEventListener('click', () => { showInput(); route.focus({ preventScroll: true }); });
  $('.menu-toggle').addEventListener('click', () => {
    const opening = $('#mobile-nav').hidden;
    $('#mobile-nav').hidden = !opening;
    $('.menu-toggle').setAttribute('aria-expanded', String(opening));
    $('.menu-toggle').setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
    $('.menu-toggle use').setAttribute('href', opening ? '#i-close' : '#i-menu');
  });
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#mobile-nav').hidden) { closeMenu(); $('.menu-toggle').focus(); } });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  $('#year').textContent = new Date().getFullYear();
  restoreDraft();
  highlightProduct('capital');
})();
