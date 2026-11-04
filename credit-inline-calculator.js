/* Uses the existing simulator's arithmetic; this file does not send or store data. */
(() => {
  'use strict';
  const section=document.getElementById('simulador-credito');
  if(!section)return;
  const amount=section.querySelector('#credit-inline-amount');
  const range=section.querySelector('#credit-inline-range');
  const error=section.querySelector('#credit-inline-error');
  const review=section.querySelector('#credit-inline-review');
  const result=section.querySelector('#credit-inline-result');
  const term=section.querySelector('#credit-inline-term');
  let months=24,kind='unsecured',hasChosenScenario=false;
  const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const parse=text=>/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text.trim())?Number(text.trim().replaceAll(',','')):NaN;
  function render(){
    const secured=kind==='secured',limit=secured?50000000:15000000;
    const principal=parse(amount.value), valid=Number.isFinite(principal)&&principal>0&&principal<=limit;
    range.max=String(limit);
    section.querySelector('#credit-inline-range-max').textContent=secured?'$50 millones MXN':'$15 millones MXN';
    section.querySelector('#credit-inline-scope').textContent=secured?'Con garantía real. Condiciones según evaluación.':'Sin garantía real. Aval según evaluación.';
    error.hidden=valid;result.hidden=!valid;review.disabled=!valid;amount.setAttribute('aria-invalid',String(!valid));
    section.querySelector('.credit-inline-assumptions').hidden=!valid;
    if(!valid){error.textContent=principal>limit?(secured?'El monto máximo con garantía real es de $50 millones MXN.':'Sin garantía real, el monto máximo es de $15 millones MXN. Puedes elegir «Con garantía real» para simular hasta $50 millones.'):'Escribe un monto mayor a cero, hasta $'+(secured?'50':'15')+' millones MXN. Para centavos, utiliza punto y hasta dos decimales.';return null;}
    const figures=window.CENTRALIA_SIMULATION.credit(principal,months,kind);
    range.value=String(principal);range.setAttribute('aria-valuetext',money(Number(range.value)));section.querySelector('#credit-inline-month-label').textContent=months+' meses';
    section.querySelector('#credit-inline-payment').textContent=money(figures.monthly);
    section.querySelector('#credit-inline-fee-label').textContent=secured?'Comisión':'Apertura, antes de IVA';
    section.querySelector('#credit-inline-fee').textContent=secured?'Por confirmar':money(figures.commission);
    section.querySelector('#credit-inline-total-label').textContent=secured?'Suma de mensualidades, sin comisiones':'Total parcial: pagos + apertura';
    section.querySelector('#credit-inline-total').textContent=money(secured?figures.payments:figures.partialTotal);
    section.querySelector('#credit-inline-assumption').textContent=secured?'Ejemplo con tasa ilustrativa de 2% mensual. Comisión por confirmar; no incluida. No es una oferta. Sin IVA, seguros ni otros cargos.':'Ejemplo ilustrativo con 2% mensual y 4.5% de apertura. No es una oferta. No incluye IVA, seguros ni otros cargos.';
    section.querySelector('#credit-inline-detail-note').textContent=secured?'La suma incluye únicamente capital e intereses estimados. No es el costo total ni equivale al CAT. La comisión y las condiciones finales se confirman tras evaluar tu empresa.':'La apertura se muestra por separado: no se financia ni se descuenta del monto solicitado. El total parcial no equivale al CAT. Las condiciones finales se confirman tras evaluar tu empresa.';
    return {amount:principal,months,kind};
  }
  amount.addEventListener('input',()=>{hasChosenScenario=true;render();});
  range.addEventListener('input',()=>{hasChosenScenario=true;amount.value=new Intl.NumberFormat('en-US').format(Number(range.value));render();});
  amount.addEventListener('blur',()=>{const principal=parse(amount.value);if(Number.isFinite(principal)&&principal>0)amount.value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(principal);render();});
  term.addEventListener('change',()=>{hasChosenScenario=true;months=Number(term.value);render();});
  section.querySelectorAll('[data-credit-kind]').forEach(button=>button.addEventListener('click',()=>{hasChosenScenario=true;kind=button.dataset.creditKind;section.querySelectorAll('[data-credit-kind]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));render();}));
  section.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const scenario=render();if(!scenario){amount.focus();return;}hasChosenScenario=true;document.dispatchEvent(new CustomEvent('centralia:credit-review',{detail:{...scenario,opener:review}}));});
  const consult=button=>{const scenario=hasChosenScenario?render():null;document.dispatchEvent(new CustomEvent(scenario?'centralia:credit-review':'centralia:product-inquiry',{detail:scenario?{...scenario,opener:button}:{product:'credit',opener:button}}));};
  document.querySelectorAll('[data-review-credit]').forEach(button=>button.addEventListener('click',()=>consult(button)));
  document.addEventListener('centralia:consult-product',event=>{if(event.detail?.product==='credit')consult(event.detail.opener);});
  // Keep the floating contact link from covering the calculator's result or CTA.
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{document.body.classList.toggle('credit-calculator-in-view',entries[0].isIntersecting);}).observe(section);
  render();
})();
