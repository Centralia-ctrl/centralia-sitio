(() => {
 const artwork=document.querySelector('[data-supplier-tunnel]');if(!artwork)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const messages=[...(artwork.closest('.solution-film')?.querySelectorAll('[data-film-message]')||[])];
 const far=artwork.querySelector('[data-wheel-far]'),near=artwork.querySelector('[data-wheel-near]'),shadow=artwork.querySelector('[data-wheel-shadow]');
 const spins=[...artwork.querySelectorAll('[data-wheel-spin]')];
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 let visible=false,last=null,elapsed=0,request=null,manual=null;
 function draw(time){
  const t=time%12,progress=smooth(Math.min(t,10.8)/10.8);
  const x=232+307*progress,scale=.84+.16*progress;
  const y=330+(x-300)*50/120-56*scale;
  const roll=(x-232)/(56*.92)*180/Math.PI;
  const visibility=smooth(t/.65)*(1-smooth((t-10.6)/.85));
  // Change depth while the entire wheel fits inside the opening, so it never
  // becomes translucent as it rolls past the front edge of the tunnel.
  const front=x>=420?1:0;
  const transform=`translate(${x} ${y}) scale(${scale})`;
  far.setAttribute('transform',transform);near.setAttribute('transform',transform);
  far.style.opacity=visibility*(1-front);near.style.opacity=visibility*front;
  spins.forEach(spin=>spin.setAttribute('transform',`rotate(${roll})`));
  shadow.setAttribute('transform',`translate(${x+3} ${y+56*scale+6}) scale(${scale})`);shadow.style.opacity=visibility;
  artwork.dataset.time=t.toFixed(2);artwork.dataset.wheelX=x.toFixed(2);artwork.dataset.phase=progress<.3?'entrada':progress>.78?'salida':'interior';
  if(messages.length===2){messages[0].style.opacity=t<10?1-smooth((t-4.75)/.45):smooth((t-10.45)/.55);messages[1].style.opacity=t<10?smooth((t-5.20)/.55):1-smooth((t-10)/.45)}
 }
 function tick(now){if(last!==null)elapsed+=Math.min(now-last,100);last=now;draw(elapsed/1000);request=requestAnimationFrame(tick)}
 function update(){const run=visible&&!document.hidden&&!reduced.matches&&manual===null;if(run&&request===null)request=requestAnimationFrame(tick);if(!run&&request!==null){cancelAnimationFrame(request);request=null;last=null}if(manual!==null)draw(manual);else if(reduced.matches)draw(6)}
 document.querySelector('[data-illustration-time]')?.addEventListener('input',event=>{manual=Number(event.target.value);update()});
 document.querySelector('[data-illustration-play]')?.addEventListener('click',()=>{manual=null;update()});
 document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
 if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update()},{threshold:[0,.15]}).observe(artwork);else{visible=true;update()}
 draw(reduced.matches?6:1);
})();
