/* Miguel Angel confirmed on 2026-11-11: 1.5% monthly,
   15-60 days and no opening fee. Taxes and any other charges remain excluded.
   Publication authorized on 2026-11-12; each request remains subject to evaluation. */
(() => {
  'use strict';
  const MONTHLY_RATE = 0.015;
  const parseAmount = value => {
    const text = String(value).trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return NaN;
    const amount = Number(text.replaceAll(',', ''));
    return amount > 0 && amount <= 999999999999.99 ? amount : NaN;
  };
  function calculate(value, days) {
    const amount = parseAmount(value);
    if (!Number.isFinite(amount)) return {error:'Escribe un monto válido mayor a cero. Puedes incluir hasta dos decimales.',field:'amount'};
    if (!Number.isInteger(days) || days < 15 || days > 60) return {error:'Elige un plazo de 15 a 60 días.',field:'days'};
    const capitalCents = Math.round(amount * 100);
    const interestCents = Math.round(capitalCents * MONTHLY_RATE * days / 30);
    return {amount:capitalCents/100,days,interest:interestCents/100,total:(capitalCents+interestCents)/100};
  }
  if (typeof module !== 'undefined' && module.exports) {module.exports={calculate,parseAmount};return;}
  const root = document.querySelector('[data-supplier-simulator]');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const amount = $('#cp-amount'), days = $('#cp-days'), error = $('#cp-error');
  const review = $('[data-calendar-review]');
  const money = value => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).format(value);
  let current = null, announcement = null;
  function update() {
    current = calculate(amount.value,Number(days.value));
    error.hidden = !current.error; error.textContent = current.error || '';
    amount.setAttribute('aria-invalid',String(current.field==='amount'));
    days.setAttribute('aria-invalid',String(current.field==='days'));
    review.disabled = !!current.error;
    root.querySelectorAll('[data-out]').forEach(node=>{
      const key = node.dataset.out === 'supplier' ? 'amount' : node.dataset.out;
      node.textContent = current.error ? '—' : money(current[key]);
    });
    const term = Number(days.value);
    $('[data-days]').textContent = term+' días';
    days.setAttribute('aria-valuetext',term+' días');
    days.style.setProperty('--supplier-range-fill',((term-15)/45*100)+'%');
    $('[data-interest-days]').textContent = '('+term+' días)';
    // Relación visible entre plazo e interés: lo que suma cada día con la misma tasa.
    $('[data-per-day]').textContent = current.error ? '' : 'Cada día de plazo suma '+money(Math.round(current.amount*100*MONTHLY_RATE/30)/100)+' de interés.';
    $('[data-repayment-label]').textContent = 'MXN · plazo de '+term+' días';
    clearTimeout(announcement);
    announcement=setTimeout(()=>{$('[data-live]').textContent=current.error?'':'Estimación a '+term+' días. Capital: '+money(current.amount)+'. Interés: '+money(current.interest)+'. Capital más interés estimado: '+money(current.total)+'. Sin comisión de apertura. Antes de impuestos y otros cargos.';},300);
  }
  amount.addEventListener('input',()=>update());
  amount.addEventListener('blur',()=>{
    const value=parseAmount(amount.value);
    if(Number.isFinite(value))amount.value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
    update();
  });
  days.addEventListener('input',()=>update());
  days.addEventListener('change',()=>update());
  function requestReview(opener=review) {
    update();
    if(current.error){(current.field==='amount'?amount:days).focus();return;}
    // Send only the visitor's amount and requested term to the existing contact flow.
    // Estimated interest/total are not submitted as approved financing terms.
    document.dispatchEvent(new CustomEvent('centralia:provider-scenario',{detail:{kind:'term-example',amount:current.amount,currency:'MXN',days:current.days,opener}}));
  }
  review.addEventListener('click',()=>requestReview());
  document.addEventListener('centralia:consult-supplier',event=>requestReview(event.detail?.opener));
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>document.body.classList.toggle('supplier-calendar-in-view',entries[0].isIntersecting)).observe(root);
  update();
})();
