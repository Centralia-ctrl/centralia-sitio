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
  const months = 36;
  const limit = 20000000;
  term.replaceChildren(new Option('36 meses', '36', true, true));
  term.disabled = true;
  let hasChosenScenario=false;
  let selectedProject = null;
  document.addEventListener('centralia:credit-project-selected', event => {
    selectedProject = event.detail?.project ?? null;
  });
  const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const parse=text=>/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text.trim())?Number(text.trim().replaceAll(',','')):NaN;
  function render(){
    const principal=parse(amount.value), valid=Number.isFinite(principal)&&principal>0&&principal<=limit;
    range.max=String(limit);
    section.querySelector('#credit-inline-range-max').textContent='$20 millones MXN';
    error.hidden=valid;result.hidden=!valid;review.disabled=!valid;amount.setAttribute('aria-invalid',String(!valid));
    if(!valid){error.textContent=principal>limit?'El monto máximo es de $20 millones MXN.':'Escribe un monto mayor a cero, hasta $20 millones MXN. Para centavos, utiliza punto y hasta dos decimales.';return null;}
    const figures=window.CENTRALIA_SIMULATION.credit(principal,months);
    range.value=String(principal);range.setAttribute('aria-valuetext',money(Number(range.value)));section.querySelector('#credit-inline-month-label').textContent=months+' meses';
    range.style.setProperty('--credit-range-fill', (Number(range.value) / limit * 100) + '%');
    section.querySelector('#credit-inline-payment').textContent=money(figures.monthly);
    section.querySelector('#credit-inline-fee').textContent=money(figures.commission);
    return {amount:principal,months};
  }
  amount.addEventListener('input',()=>{hasChosenScenario=true;render();});
  range.addEventListener('input',()=>{hasChosenScenario=true;amount.value=new Intl.NumberFormat('en-US').format(Number(range.value));render();});
  amount.addEventListener('blur',()=>{const principal=parse(amount.value);if(Number.isFinite(principal)&&principal>0)amount.value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(principal);render();});
  section.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const scenario = render();
    if (!scenario) { amount.focus(); return; }
    hasChosenScenario = true;
    document.dispatchEvent(new CustomEvent('centralia:credit-review', {
      detail: { ...scenario, project: selectedProject, opener: review }
    }));
  });
  const consult = button => {
    const scenario = hasChosenScenario ? render() : null;
    if (hasChosenScenario && !scenario) {
      amount.scrollIntoView({ block: 'center', behavior: 'instant' });
      amount.focus({ preventScroll: true });
      return;
    }
    const detail = { product: 'credit', project: selectedProject, opener: button };
    if (scenario) Object.assign(detail, scenario);
    document.dispatchEvent(new CustomEvent(scenario ? 'centralia:credit-review' : 'centralia:product-inquiry', { detail }));
  };
  document.querySelectorAll('[data-review-credit]').forEach(button=>button.addEventListener('click',()=>consult(button)));
  document.addEventListener('centralia:consult-product',event=>{if(event.detail?.product==='credit')consult(event.detail.opener);});
  // Keep the floating contact link from covering the calculator's result or CTA.
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{document.body.classList.toggle('credit-calculator-in-view',entries[0].isIntersecting);}).observe(section);
  render();
  const welcome = section.closest('.credit-calculator-welcome');
  if (welcome && typeof welcome.animate === 'function') {
    const entranceObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      entranceObserver.disconnect();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      welcome.animate(reduced
        ? [{ opacity: .35 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: reduced ? 300 : 950, easing: 'cubic-bezier(.22,1,.36,1)' });
    }, { threshold: .2 });
    entranceObserver.observe(welcome);
  }
})();
