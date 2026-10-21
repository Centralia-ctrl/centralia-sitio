(() => {
  const artwork=document.querySelector('[data-solution-sculpture]');
  if(!artwork)return;
  const figure=artwork.closest('.solution-film');
  const messages=[...figure.querySelectorAll('[data-film-message]')];
  const credit=artwork.dataset.solutionSculpture==='credit-expansion';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const smooth=value=>{const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);};
  let visible=false,request=null,last=null,elapsed=0,ready=artwork.complete&&artwork.naturalWidth>0;

  function draw(){
    const t=elapsed/1000%12;
    const phase=smooth((t-4.5)/1.5)*(1-smooth((t-9.85)/1.45));
    messages[0].style.opacity=t<10?1-smooth((t-4.75)/.45):smooth((t-10.45)/.55);
    messages[1].style.opacity=t<10?smooth((t-5.20)/.55):1-smooth((t-10)/.45);
    if(reduced.matches){artwork.style.transform='none';return;}
    const breathe=Math.sin(t*Math.PI/6);
    if(credit){
      artwork.style.transform=`translate3d(0,${5-12*phase-2*breathe}px,0) rotate(${-0.35+0.7*phase}deg) scale(${0.955+0.018*phase})`;
    }else{
      const lift=(1-Math.cos(t*Math.PI/6))/2;
      artwork.style.transform=`translate3d(${1.2*breathe}%,${-2.4*lift}%,0) rotate(${4.5*breathe}deg) scale(${0.94+0.025*lift})`;
    }
  }
  function tick(now){
    if(last!==null)elapsed+=Math.min(now-last,100);
    last=now;draw();request=requestAnimationFrame(tick);
  }
  function update(){
    const running=visible&&ready&&!document.hidden&&!reduced.matches;
    if(running&&request===null)request=requestAnimationFrame(tick);
    if(!running&&request!==null){cancelAnimationFrame(request);request=null;last=null;}
    if(reduced.matches){elapsed=0;draw();}
  }
  artwork.addEventListener('load',()=>{ready=true;update();},{once:true});
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
  if('IntersectionObserver' in window){
    new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update();
    },{threshold:[0,.15]}).observe(figure);
  }else{visible=true;update();}
  draw();
})();
