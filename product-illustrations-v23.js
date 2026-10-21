(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p)};
 const illustrations=[...document.querySelectorAll('[data-illustration]')];
 let manual=null;
 const controllers=illustrations.map(art=>{
  const part=name=>art.querySelector(`[data-part="${name}"]`);
  const messages=[...(art.closest('.solution-film')?.querySelectorAll('[data-film-message]')||[])];
  const credit=art.dataset.illustration==='credit';
  let visible=false,request=null,last=null,elapsed=0;
  const move=(name,value)=>part(name)?.setAttribute('transform',value);
  function draw(time){
   const t=time%12,wave=Math.sin(t*Math.PI/6),p=smooth((t-3.2)/2)*(1-smooth((t-9.4)/1.8));
   art.dataset.phase=p>.95?'second':p<.05?'first':'transition';art.dataset.time=t.toFixed(2);
   if(messages.length===2){messages[0].style.opacity=t<10?1-smooth((t-4.75)/.45):smooth((t-10.45)/.55);messages[1].style.opacity=t<10?smooth((t-5.20)/.55):1-smooth((t-10)/.45)}
   if(credit){
    move('left',`translate(${270-80*p} ${177+10*p+wave*2}) rotate(${-14-6*p} 95 120)`);
    move('right',`translate(${342+43*p} ${170+8*p-wave*2}) rotate(${11+6*p} 100 120)`);
    move('card',`translate(${289-12*p} ${112-40*p+wave*3}) rotate(${-9+8*p} 98 122)`);
    art.querySelectorAll('[data-bar]').forEach((bar,i)=>{const h=[28,48,68][i]+[10,23,29][i]*p;bar.setAttribute('y',203-h);bar.setAttribute('height',h)});
    move('gold',`translate(${213-22*p} ${368-20*p-wave*3}) rotate(${-15+10*p} 25 25)`);
    move('small',`translate(${520+7*p} ${93-9*p+wave*3}) rotate(${13-10*p} 21 21)`);
   }else{
    move('base',`translate(${298+7*p} ${207-8*p+wave*2}) rotate(${11-7*p} 117 91)`);
    move('order',`translate(${270-23*p} ${108+37*p+wave*3}) rotate(${-12-4*p} 82 110)`);
    part('order').style.opacity=1;
    move('payment',`translate(${445-42*p} ${153-29*p-wave*2}) rotate(${9-5*p} 55 65)`);
    part('payment').style.opacity=smooth((p-.16)/.64);
    part('check').setAttribute('stroke-dashoffset',1-smooth((p-.55)/.4));
    move('gold',`translate(${238-9*p} ${368-14*p-wave*3}) rotate(${-15+10*p} 25 25)`);
    move('small',`translate(${523+8*p} ${106-15*p+wave*3}) rotate(${14-9*p} 20 20)`);
   }
  }
  function tick(now){if(last!==null)elapsed+=Math.min(now-last,100);last=now;draw(elapsed/1000);request=requestAnimationFrame(tick)}
  function update(){const run=visible&&!document.hidden&&!reduced.matches&&manual===null;if(run&&request===null)request=requestAnimationFrame(tick);if(!run&&request!==null){cancelAnimationFrame(request);request=null;last=null}if(manual!==null)draw(manual);else if(reduced.matches)draw(0)}
  if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update()},{threshold:[0,.15]}).observe(art);else{visible=true;update()}
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);draw(0);
  return{update};
 });
 document.querySelector('[data-illustration-time]')?.addEventListener('input',event=>{manual=Number(event.target.value);controllers.forEach(c=>c.update())});
 document.querySelector('[data-illustration-play]')?.addEventListener('click',()=>{manual=null;controllers.forEach(c=>c.update())});
})();
