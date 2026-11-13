/* No rates or costs are invented. Uses the site's approved 85% gross example. */
(() => {
 'use strict';
 const root=document.getElementById('simulador-factoraje');if(!root)return;
 const amount=root.querySelector('#factoring-inline-amount'),range=root.querySelector('#factoring-inline-range'),currency=root.querySelector('#factoring-inline-currency'),days=root.querySelector('#factoring-inline-days');
 const error=root.querySelector('#factoring-inline-error'),result=root.querySelector('#factoring-inline-result'),review=root.querySelector('#factoring-inline-review');
 const format=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:currency.value,currencyDisplay:'code',minimumFractionDigits:2}).format(n);
 const parse=s=>/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s.trim())?Number(s.trim().replaceAll(',','')):NaN;
 const drafts={MXN:'500,000',USD:'100,000'};let activeCurrency='MXN',hasChosenScenario=false;
 function render(){
  const principal=parse(amount.value),term=Number(days.value),validAmount=Number.isFinite(principal)&&principal>0&&principal<=999999999999.99,validDays=Number.isInteger(term)&&term>=1&&term<=365;
  amount.setAttribute('aria-invalid',String(!validAmount));days.setAttribute('aria-invalid',String(!validDays));
  error.hidden=validAmount&&validDays;result.hidden=!error.hidden;review.disabled=!error.hidden;
  if(!error.hidden){error.textContent=!validAmount?'Escribe el valor de tus facturas, mayor a cero y con hasta dos decimales.':'Indica entre 1 y 365 días para este ejemplo de calendario. El plazo disponible se confirma al revisar la operación.';return null;}
  const figures=window.CENTRALIA_SIMULATION.factoring(principal);
  root.querySelector('#factoring-inline-advance').textContent=format(figures.advance);
  root.querySelector('#factoring-inline-retained').textContent=format(figures.retained);
  root.querySelector('#factoring-inline-invoices').textContent=format(principal);
  root.querySelector('#factoring-inline-horizon').textContent='Cobro previsto en '+term+' '+(term===1?'día':'días');
  range.value=String(Math.min(principal,Number(range.max)));
  range.setAttribute('aria-valuetext',format(Number(range.value)));
  root.querySelector('#factoring-inline-range-note').textContent=principal>Number(range.max)?'El monto escrito supera el recorrido de la barra; se calcula con tu importe completo.':'Puedes escribir otro importe. La barra es una ayuda, no un límite de financiamiento.';
  return {amount:principal,currency:currency.value,days:term};
 }
 amount.addEventListener('input',()=>{hasChosenScenario=true;render();});days.addEventListener('input',()=>{hasChosenScenario=true;render();});
 amount.addEventListener('blur',()=>{const n=parse(amount.value);if(Number.isFinite(n)&&n>0)amount.value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);render();});
 range.addEventListener('input',()=>{hasChosenScenario=true;amount.value=new Intl.NumberFormat('en-US').format(Number(range.value));render();});
 currency.addEventListener('change',()=>{hasChosenScenario=true;drafts[activeCurrency]=amount.value;activeCurrency=currency.value;amount.value=drafts[activeCurrency];range.max=activeCurrency==='MXN'?'5000000':'500000';range.step=activeCurrency==='MXN'?'25000':'5000';root.querySelector('#factoring-inline-range-max').textContent=activeCurrency==='MXN'?'5 millones MXN':'500 mil USD';root.querySelector('#factoring-inline-currency-label').textContent=activeCurrency;render();});
 root.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const scenario=render();if(!scenario){(amount.getAttribute('aria-invalid')==='true'?amount:days).focus();return;}hasChosenScenario=true;document.dispatchEvent(new CustomEvent('centralia:factoring-review',{detail:{...scenario,opener:review}}));});
 const consult=button=>{const scenario=hasChosenScenario?render():null;document.dispatchEvent(new CustomEvent(scenario?'centralia:factoring-review':'centralia:product-inquiry',{detail:scenario?{...scenario,opener:button}:{product:'factoring',opener:button}}));};
 document.querySelectorAll('[data-review-factoring]').forEach(button=>button.addEventListener('click',()=>consult(button)));
 document.addEventListener('centralia:consult-product',event=>{if(event.detail?.product==='factoring')consult(event.detail.opener);});
 if(document.body.classList.contains('factoring-first-preview')&&typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{document.body.classList.toggle('factoring-calculator-in-view',entries[0].isIntersecting);}).observe(root);
 render();
})();
