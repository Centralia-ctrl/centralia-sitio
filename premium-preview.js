/* Presentation only: no network requests, tracking, financial logic or 3D changes. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.product-tool').forEach(tool=>{
    const result=tool.querySelector('.credit-inline-result,.factoring-calculator-result,.cp-results');
    if(!result)return;
    let timer;
    tool.addEventListener('input',event=>{
      if(reduced.matches||!event.target.matches('input,select'))return;
      clearTimeout(timer);
      timer=setTimeout(()=>{
        result.classList.remove('premium-result-change');
        requestAnimationFrame(()=>result.classList.add('premium-result-change'));
      },120);
    });
    result.addEventListener('animationend',()=>result.classList.remove('premium-result-change'));
  });
})();
