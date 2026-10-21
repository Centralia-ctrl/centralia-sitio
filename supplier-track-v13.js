(() => {
 'use strict';
 const artwork=document.querySelector('[data-supplier-track]');
 if(!artwork)return;
 const path=artwork.querySelector('[data-track-path]');
 const wheel=artwork.querySelector('[data-track-wheel]');
 const shadow=artwork.querySelector('[data-track-shadow]');
 const spin=artwork.querySelector('[data-track-spin]');
 if(!path||!wheel||!shadow||!spin)return;
 const length=path.getTotalLength();
 const radius=Number(artwork.dataset.wheelRadius)||44;
 const clearance=radius+(Number(artwork.dataset.trackClearance)||13);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const messages=[...(artwork.closest('.solution-film')?.querySelectorAll('[data-film-message]')||[])];
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 function at(f){
  const distance=Math.max(0,Math.min(1,f))*length;
  const q=path.getPointAtLength(distance),a=path.getPointAtLength(Math.max(0,distance-.5)),b=path.getPointAtLength(Math.min(length,distance+.5));
  const dx=b.x-a.x,dy=b.y-a.y,m=Math.hypot(dx,dy)||1;
  return{x:q.x,y:q.y,nx:dy/m,ny:-dx/m,angle:Math.atan2(dy,dx)*180/Math.PI};
 }
 const pieces=[...artwork.querySelectorAll('[data-track-part]')].map(node=>({node,f:Number(node.dataset.trackPart),q:at(Number(node.dataset.trackPart))}));
 let visible=false,last=null,elapsed=1800,request=null,manual=null;
 function draw(time,still=false){
  const t=((time%12)+12)%12;
  const p=still?.5:Math.min(1,t/10.5);
  const q=at(p),cx=q.x+q.nx*clearance,cy=q.y+q.ny*clearance;
  const visibility=still?1:smooth(t/.45)*(1-smooth((t-10.15)/.65));
  wheel.setAttribute('transform',`translate(${cx.toFixed(3)} ${cy.toFixed(3)})`);
  wheel.style.opacity=visibility;
  spin.setAttribute('transform',`rotate(${(p*length/radius*180/Math.PI).toFixed(3)})`);
  shadow.setAttribute('transform',`translate(${(q.x+q.nx*14).toFixed(3)} ${(q.y+q.ny*14).toFixed(3)}) rotate(${q.angle.toFixed(3)})`);
  shadow.style.opacity=visibility;
  let assembled=0;
  for(const piece of pieces){
   // Each segment settles ahead of contact; the full track then clears before the next pass.
   const reveal=still?1:smooth((p+.18-piece.f)/.115);
   const clearing=still?0:smooth((t-10.8-piece.f*.28)/.65);
   const alpha=reveal*(1-clearing);
   const lift=34*(1-reveal)+18*clearing;
   const angle=piece.q.angle+7*(1-reveal);
   piece.node.setAttribute('transform',`translate(${piece.q.x.toFixed(3)} ${(piece.q.y+lift).toFixed(3)}) rotate(${angle.toFixed(3)})`);
   piece.node.style.opacity=alpha;
   if(reveal>.999&&clearing<.001)assembled++;
  }
  artwork.dataset.time=t.toFixed(2);
  artwork.dataset.progress=p.toFixed(3);
  artwork.dataset.assembled=String(assembled);
  artwork.dataset.phase=still?'quieta':t>10.8?'reinicio':t>9.5?'salida':'construccion';
  if(messages.length===2){
   messages[0].style.opacity=still?1:t<10?1-smooth((t-4.75)/.45):smooth((t-10.45)/.55);
   messages[1].style.opacity=still?0:t<10?smooth((t-5.2)/.55):1-smooth((t-10)/.45);
  }
 }
 function tick(now){if(last!==null)elapsed+=Math.min(now-last,100);last=now;draw(elapsed/1000);request=requestAnimationFrame(tick)}
 function update(){
  const run=visible&&!document.hidden&&!reduced.matches&&manual===null;
  if(run&&request===null)request=requestAnimationFrame(tick);
  if(!run&&request!==null){cancelAnimationFrame(request);request=null;last=null;}
  if(manual!==null)draw(manual);else if(reduced.matches)draw(6,true);
 }
 document.querySelector('[data-illustration-time]')?.addEventListener('input',event=>{manual=Number(event.target.value);update()});
 document.querySelector('[data-illustration-play]')?.addEventListener('click',()=>{manual=null;update()});
 document.addEventListener('visibilitychange',update);
 reduced.addEventListener('change',update);
 if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update()},{threshold:[0,.15]}).observe(artwork);
 else{visible=true;update();}
 draw(reduced.matches?6:elapsed/1000,reduced.matches);
})();
