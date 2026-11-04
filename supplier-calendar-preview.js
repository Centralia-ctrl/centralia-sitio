/* Purchase planning only: entered amount and date gap, not a credit quote. */
(() => {
  'use strict';
  const DAY = 86400000;
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const ms = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0,10) === value ? ms : NaN;
  }
  function parseAmount(value) {
    const text = String(value).trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return NaN;
    const amount = Number(text.replaceAll(',', ''));
    return amount > 0 && amount <= 999999999999.99 ? amount : NaN;
  }
  function calendar(amount, payment, collection) {
    const value = parseAmount(amount), p = parseDate(payment), c = parseDate(collection);
    if (!Number.isFinite(value)) return {error:'Escribe un monto mayor a cero. Usa punto para los centavos, con hasta dos decimales.', field:'amount'};
    if (![p,c].every(Number.isFinite)) return {error:'Completa las fechas de pago y cobro para comparar tu compra.', field:!Number.isFinite(p)?'payment':'collection'};
    return {amount:value, currency:'MXN', payment, collection, days:(c-p)/DAY};
  }
  if (typeof module !== 'undefined' && module.exports) {module.exports={calendar,parseDate,parseAmount};return;}
  const root = document.querySelector('[data-supplier-calendar]');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const amount = $('[name=purchase-amount]'), payment = $('[name=payment]'), collection = $('[name=collection]');
  const inputs = {amount,payment,collection};
  const review = $('[data-calendar-review]'), error = $('[data-calendar-error]'), result = $('[data-calendar-result]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const now = new Date(), today = [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  const iso = ms => new Date(ms).toISOString().slice(0,10);
  const dateText = value => new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
  const plural = n => n===1?'día':'días';
  const money = value => new Intl.NumberFormat('es-MX',{minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).format(value);
  let current = null, previousKey = '', animations = [];
  payment.min = collection.min = today;
  function update(animate=false) {
    current = calendar(amount.value,payment.value,collection.value);
    if (!current.error) {
      for (const field of ['payment','collection']) {
        if (inputs[field].value < today || !inputs[field].checkValidity()) {
          current = {error:'Elige hoy o una fecha futura para planear tu pago y tu cobro.',field}; break;
        }
      }
    }
    Object.entries(inputs).forEach(([field,input])=>input.setAttribute('aria-invalid',String(current.field===field)));
    error.textContent = current.error || ''; error.hidden = !current.error;
    review.disabled = !!current.error; result.hidden = !!current.error;
    if (current.error) {previousKey='';return;}
    const days = current.days, count = Math.abs(days);
    $('[data-calendar-caption]').textContent = days<0?'Tu cobro está previsto':days===0?'Tu pago y tu cobro coinciden':'Entre tu pago y tu cobro hay';
    $('[data-calendar-days]').textContent = days<0?count+' '+plural(count)+' antes':days===0?'El mismo día':count+' '+plural(count);
    $('[data-calendar-detail]').textContent = days<0?'Cobrarías antes de pagar. Revisemos si necesitas financiamiento para esta compra.':days===0?'Revisemos los horarios de pago y la disponibilidad del dinero.':'Revisemos cómo cubrir ese intervalo sin frenar tu operación.';
    $('[data-calendar-gap]').textContent = days<0?'El cobro está previsto '+count+' '+plural(count)+' antes del pago.':days===0?'Pago y cobro previstos para el mismo día.':count+' '+plural(count)+' entre tu pago y tu cobro previsto.';
    const events = days<0?[
      ['Cobro previsto',current.collection,'collection'],['Pago al proveedor',current.payment,'payment']
    ]:[['Pago al proveedor',current.payment,'payment'],['Cobro previsto',current.collection,'collection']];
    events.forEach(([label,date,kind],i)=>{
      $('[data-event-label="'+i+'"]').textContent=label;
      $('[data-event-date="'+i+'"]').textContent=dateText(date);
      $('[data-event="'+i+'"]').dataset.kind=kind;
    });
    root.dataset.order = days<0?'collection-first':days===0?'same-day':'payment-first';
    const key = current.payment+'|'+current.collection;
    if (animate && key!==previousKey && !reduced.matches && typeof result.animate==='function') {
      animations.forEach(animation=>animation.cancel());
      animations = [
        $('[data-calendar-days]').animate([{opacity:.4,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'}),
        $('[data-calendar-line]').animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:380,easing:'cubic-bezier(.2,.6,.3,1)'})
      ];
    }
    previousKey=key;
  }
  amount.addEventListener('input',()=>update());
  amount.addEventListener('blur',()=>{const value=parseAmount(amount.value);if(Number.isFinite(value))amount.value=money(value);update();});
  for (const input of [payment,collection]) input.addEventListener('input',()=>update(true));
  for (const input of [payment,collection]) input.addEventListener('change',()=>update(true));
  function requestReview(opener=review) {
    update();
    if (current.error) {
      inputs[current.field].scrollIntoView({block:'center',behavior:'instant'});
      inputs[current.field].focus({preventScroll:true});
      return;
    }
    document.dispatchEvent(new CustomEvent('centralia:provider-scenario',{detail:{...current,opener}}));
  }
  review.addEventListener('click',()=>requestReview());
  document.addEventListener('centralia:consult-supplier',event=>requestReview(event.detail?.opener));
  if (typeof IntersectionObserver==='function') new IntersectionObserver(entries=>{
    document.body.classList.toggle('supplier-calendar-in-view',entries[0].isIntersecting);
  }).observe(root);
  amount.value='10,000,000';payment.value=today;collection.value=iso(parseDate(today)+30*DAY);update();
})();
