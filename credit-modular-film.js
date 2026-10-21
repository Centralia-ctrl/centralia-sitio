(() => {
  const artwork=document.querySelector('[data-credit-modules]');
  if(!artwork)return;
  const figure=artwork.closest('.solution-film');
  const messages=[...figure.querySelectorAll('[data-film-message]')];
  const modules=[...artwork.querySelectorAll('.credit-module')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const smooth=value=>{const p=Math.max(0,Math.min(1,value));return p*p*(3-2*p);};
  let visible=false,request=null,last=null,elapsed=0;
  const ready=()=>modules.every(image=>image.complete&&image.naturalWidth>0);
  function draw(){
    const t=elapsed/1000%12;
    const angle=t*Math.PI/6;
    const expansion=(1-Math.cos(angle))/2;
    messages[0].style.opacity=t<10?1-smooth((t-4.75)/.45):smooth((t-10.45)/.55);
    messages[1].style.opacity=t<10?smooth((t-5.20)/.55):1-smooth((t-10)/.45);
    const offset=reduced.matches?0:3.3-7.3*expansion;
    const drift=reduced.matches?0:0.9*Math.sin(angle);
    const lift=reduced.matches?0:-2.3*expansion;
    modules[0].style.transform=`translate3d(${offset}%,${drift}%,0)`;
    modules[1].style.transform=`translate3d(0,${lift}%,0)`;
    modules[2].style.transform=`translate3d(${-offset}%,${-drift}%,0)`;
    artwork.dataset.phase=expansion>.98?'expanded':expansion<.02?'compact':'moving';
  }
  function tick(now){
    if(last!==null)elapsed+=Math.min(now-last,100);
    last=now;draw();request=requestAnimationFrame(tick);
  }
  function update(){
    const running=visible&&ready()&&!document.hidden&&!reduced.matches;
    if(running&&request===null)request=requestAnimationFrame(tick);
    if(!running&&request!==null){cancelAnimationFrame(request);request=null;last=null;}
    if(reduced.matches){elapsed=0;draw();}
  }
  modules.forEach(image=>image.addEventListener('load',update,{once:true}));
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
  if('IntersectionObserver' in window){
    new IntersectionObserver(([entry])=>{
      visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update();
    },{threshold:[0,.15]}).observe(figure);
  }else{visible=true;update();}
  draw();
})();
