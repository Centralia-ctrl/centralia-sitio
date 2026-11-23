(() => {
  'use strict';
  const root=document.getElementById('centralia-contacto-calendario'),$=s=>root.querySelector(s),params=new URLSearchParams(location.search),zone='America/Mexico_City';
  const contract=window.centraliaContactForm;
  let inquirySending=false,inquiryAccepted=false;
  let need='',amount=null,offset=0,slots=[],dateKey='',selected=null,page=0,loading=false,loaded=false,hasMore=false,requestId='',submitting=false,uncertain=false,booked=false,serial=0;
  const parts=v=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(v).map(p=>[p.type,p.value]));
  const key=v=>{const p=parts(v);return `${p.year}-${p.month}-${p.day}`;};
  const cap=v=>v.charAt(0).toUpperCase()+v.slice(1);
  const dayText=v=>cap(new Intl.DateTimeFormat('es-MX',{timeZone:zone,weekday:'long',day:'numeric',month:'long'}).format(v));
  const timeText=v=>new Intl.DateTimeFormat('es-MX',{timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true}).format(v);
  function context(){
    const text=need+(amount!==null?' · '+(amount==='unknown'?'Monto por definir':'MXN '+new Intl.NumberFormat('es-MX',{maximumFractionDigits:2}).format(amount)):'');
    ['#cp-agenda-context','#cp-consultation-summary'].forEach(s=>{if($(s)){$(s).textContent=text;$(s).hidden=!text;}});
    $('.cp-message').textContent=need?`Hola, me gustaría revisar opciones de ${need.toLowerCase()} para mi empresa.`:'Hola, me gustaría revisar opciones de financiamiento para mi empresa.';
    $('#cp-whatsapp-link').href='https://wa.me/525548092849?text='+encodeURIComponent($('.cp-message').textContent);
  }
  function chooseNeed(value){need=value;root.querySelectorAll('[data-need]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.need===value)));context();$('#cp-error').hidden=true;}
  function channel(name){root.querySelectorAll('[data-channel]').forEach(b=>{const active=b.dataset.channel===name;b.setAttribute('aria-pressed',String(active));const p=$('#cp-'+b.dataset.channel);p.hidden=!active;p.inert=!active;});if(name==='agenda'&&!loaded&&!loading)load();}
  root.querySelectorAll('[data-channel]').forEach(b=>b.addEventListener('click',()=>channel(b.dataset.channel)));
  root.querySelectorAll('[data-need]').forEach(b=>b.addEventListener('click',()=>chooseNeed(b.dataset.need)));
  $('#cp-amount').addEventListener('input',()=>{amount=null;context();});
  $('#cp-unknown').addEventListener('change',()=>{$('#cp-amount').disabled=$('#cp-unknown').checked;amount=null;context();});
  $('#cp-continue').addEventListener('click',()=>{
    const raw=$('#cp-amount').value.trim(),numeric=contract.parseAmount(raw);
    if(!need||(!$('#cp-unknown').checked&&(!Number.isFinite(numeric)||numeric<=0||numeric>999999999999.99))){$('#cp-error').textContent=!need?'Elige lo que necesita tu empresa.':'Escribe un monto o indica que aún está por definir.';$('#cp-error').hidden=false;return;}
    amount=$('#cp-unknown').checked?'unknown':numeric;context();$('#cp-error').hidden=true;$('[data-step="one"]').hidden=true;$('[data-step="two"]').hidden=false;$('[name="name"]').focus();
  });
  $('#cp-back').addEventListener('click',()=>{if(inquirySending||inquiryAccepted)return;$('[data-step="two"]').hidden=true;$('[data-step="one"]').hidden=false;$('#cp-continue').focus();});
  $('[data-step="two"]').addEventListener('submit',async e=>{
    e.preventDefault();if(inquirySending||inquiryAccepted)return;
    const form=e.currentTarget,feedback=form.querySelector('.cp-feedback'),button=form.querySelector('[type="submit"]');
    const values={name:form.elements.name.value,company:form.elements.company.value,email:form.elements.email.value,phone:form.elements.phone.value,purpose:need,amount:amount==='unknown'?'':String(amount??''),'amount-unknown':amount==='unknown',consent:form.elements.consent.checked};
    const invalid=contract.validate(values);feedback.hidden=true;
    if(invalid){feedback.textContent=invalid[1];feedback.hidden=false;(form.elements[invalid[0]]||feedback).focus();return;}
    if(!form.reportValidity())return;
    inquirySending=true;form.setAttribute('aria-busy','true');const controls=[...form.elements];controls.forEach(x=>x.disabled=true);button.textContent='Enviando…';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const body=contract.payload(values,location.origin+location.pathname,contract.analyticsAllowed(window)?contract.hubspotToken(document.cookie):'');
      const response=await fetch(contract.ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal:controller.signal});
      if(!response.ok)throw new Error(response.status===429?'Hay demasiados intentos. Espera unos minutos.':'No pudimos registrar tu consulta. Tus datos siguen aquí; puedes volver a intentarlo.');
      inquiryAccepted=true;const sent=contract.summary(values);
      form.replaceChildren();const title=document.createElement('h2');title.textContent='Recibimos tu consulta.';title.tabIndex=-1;
      const message=document.createElement('p');message.textContent='Te contactamos a la brevedad desde hola@centraliafinanciera.com.';message.className='cp-action-note';
      const summary=document.createElement('p');summary.className='cp-context';summary.textContent=sent.purpose+' · '+sent.amount;
      const next=document.createElement('button');next.type='button';next.className='cp-back';next.textContent='Prefiero agendar una reunión';next.addEventListener('click',()=>channel('agenda'));
      const note=document.createElement('p');note.className='cp-action-note';note.textContent='El envío no implica una aprobación de financiamiento.';
      form.append(title,message,summary,next,note);title.focus();
    }catch(err){feedback.textContent=err.name==='AbortError'||err instanceof TypeError?'No pudimos confirmar la recepción. Tus datos siguen aquí. Antes de reenviar, consulta con Centralia por WhatsApp.':err.message;feedback.hidden=false;feedback.focus();}
    finally{clearTimeout(timeout);inquirySending=false;form.removeAttribute('aria-busy');if(!inquiryAccepted){controls.forEach(x=>x.disabled=false);button.textContent='Solicitar contacto';}}
  });
  function month(){const n=parts(Date.now());return new Date(Date.UTC(+n.year,+n.month-1+offset,1,12));}
  function stage(name,focus=false){
    $('#cp-choose-time').hidden=name!=='time';$('#cp-booking-details').hidden=name!=='details';$('#cp-booked').hidden=name!=='success';$('#cp-agenda-heading').hidden=name==='success';$('#cp-agenda-context').hidden=name==='success'||!need;
    $('#cp-agenda-title').textContent=name==='details'?'Completa tus datos.':'Elige tu horario.';$('#cp-agenda-step').textContent=name==='details'?'2 de 2':'1 de 2';$('#cp-agenda-step').classList.toggle('cp-step-two',name==='details');
    if(focus){const h=$(name==='success'?'#cp-booked-title':'#cp-agenda-title');h.focus({preventScroll:true});h.scrollIntoView({block:'nearest',behavior:'instant'});}
  }
  function resetSelection(){selected=null;requestId='';$('#cp-booking-details .cp-feedback').hidden=true;$('#cp-booking-details button[type="submit"]').disabled=false;}
  function calendar(){
    const m=month(),grid=$('#cp-calendar-dates'),available=new Set(slots.map(s=>key(s.start)));$('#cp-month-name').textContent=cap(new Intl.DateTimeFormat('es-MX',{timeZone:'UTC',month:'long',year:'numeric'}).format(m));$('#cp-month-prev').disabled=loading||offset===0;$('#cp-month-next').disabled=loading||offset===2||!hasMore;grid.replaceChildren();
    for(let n=0;n<(m.getUTCDay()+6)%7;n++){const gap=document.createElement('span');gap.setAttribute('aria-hidden','true');grid.append(gap);}
    for(let d=1;d<=new Date(Date.UTC(m.getUTCFullYear(),m.getUTCMonth()+1,0)).getUTCDate();d++){
      const date=new Date(Date.UTC(m.getUTCFullYear(),m.getUTCMonth(),d,18)),k=key(date),b=document.createElement('button');b.type='button';b.className='cp-day';b.textContent=d;b.disabled=loading||!available.has(k)||submitting||uncertain||booked;b.setAttribute('aria-label',dayText(date));b.setAttribute('aria-pressed',String(k===dateKey));
      b.addEventListener('click',()=>{dateKey=k;page=0;resetSelection();calendar();times();$('#cp-date-label').textContent='Fecha elegida';$('#cp-calendar').classList.remove('is-open');$('#cp-change-date').setAttribute('aria-expanded','false');if(matchMedia('(max-width:700px)').matches)$('#cp-change-date').focus({preventScroll:true});});grid.append(b);
    }
  }
  function times(){
    const daily=slots.filter(s=>key(s.start)===dateKey),list=$('.cp-time-list'),date=loading?'Consultando disponibilidad…':daily.length?dayText(daily[0].start):'Elige un día disponible';list.replaceChildren();$('#cp-selected-date').textContent=date;$('#cp-mobile-date').textContent=date;
    daily.slice(page*6,page*6+6).forEach(slot=>{const b=document.createElement('button');b.className='cp-time';b.type='button';b.textContent=timeText(slot.start);b.setAttribute('aria-label',`${timeText(slot.start)}, ${dayText(slot.start)}`);b.setAttribute('aria-pressed',String(slot.start===selected?.start));b.disabled=submitting||uncertain||booked;b.addEventListener('click',()=>{resetSelection();selected=slot;requestId=crypto.randomUUID();times();$('.cp-time[aria-pressed="true"]')?.focus({preventScroll:true});if(matchMedia('(max-width:700px)').matches)$('#cp-time-continue').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});});list.append(b);});
    $('#cp-times-prev').hidden=page===0;$('#cp-times-next').hidden=(page+1)*6>=daily.length;$('#cp-time-continue').disabled=!selected||loading||submitting||uncertain||booked;
    $('#cp-booking-summary').textContent=loading?'Consultando horarios disponibles.':selected?`${timeText(selected.start)} · 30 minutos`:'Selecciona un horario para continuar.';
    $('#cp-final-date').textContent=selected?dayText(selected.start):'';
    $('#cp-final-hour').textContent=selected?timeText(selected.start):'';
    for(const selector of ['#cp-final-date','#cp-final-hour']){
      if(selected)$(selector).dateTime=new Date(selected.start).toISOString();
      else $(selector).removeAttribute('datetime');
    }
  }
  async function getAvailability(){const res=await fetch(`/api/agenda/availability?monthOffset=${offset}`,{cache:'no-store'}),data=await res.json();if(!res.ok)throw new Error(data.message);return data;}
  async function load(){
    if(submitting||uncertain||booked)return;const current=++serial;loading=true;slots=[];dateKey='';page=0;resetSelection();$('#cp-retry').hidden=true;$('#cp-agenda-fallback').hidden=true;calendar();times();
    try{const data=await getAvailability();if(current!==serial)return;slots=data.slots;hasMore=data.hasMore;dateKey=slots.length?key(slots[0].start):'';loaded=true;}
    catch(err){if(current!==serial)return;loading=false;calendar();$('#cp-booking-summary').textContent=err.message||'No pudimos consultar la agenda.';$('#cp-mobile-date').textContent='Agenda no disponible';$('#cp-selected-date').textContent='No se pudieron cargar los horarios';$('#cp-time-continue').disabled=true;$('#cp-retry').hidden=false;$('#cp-agenda-fallback').hidden=false;return;}
    loading=false;calendar();times();if(!slots.length){$('#cp-booking-summary').textContent='No hay horarios disponibles en este mes. Prueba el siguiente.';$('#cp-calendar').classList.add('is-open');$('#cp-change-date').setAttribute('aria-expanded','true');}
  }
  $('#cp-change-date').addEventListener('click',()=>$('#cp-change-date').setAttribute('aria-expanded',String($('#cp-calendar').classList.toggle('is-open'))));
  $('#cp-month-prev').addEventListener('click',()=>{if(offset>0){offset--;load();}});$('#cp-month-next').addEventListener('click',()=>{if(offset<2&&hasMore){offset++;load();}});$('#cp-retry').addEventListener('click',load);
  $('#cp-times-prev').addEventListener('click',()=>{page--;times();});$('#cp-times-next').addEventListener('click',()=>{page++;times();});
  $('#cp-time-continue').addEventListener('click',()=>{if(selected&&!booked&&!uncertain)stage('details',true);});
  $('#cp-change-time').addEventListener('click',()=>{if(!submitting&&!uncertain&&!booked){stage('time',true);if(!loaded)load();}});
  function confirmation(data){
    booked=true;$('#cp-booked-date').textContent=dayText(new Date(data.start));$('#cp-booked-hour').textContent=`${timeText(new Date(data.start))} – ${timeText(new Date(data.end))}`;$('#cp-booked-title').textContent='Reunión confirmada.';
    try{const url=new URL(data.location);if(url.protocol==='https:'&&url.hostname==='meet.google.com'){$('#cp-meet').href=url.href;$('#cp-meet').hidden=false;}}catch{}
    $('#cp-request-change').href='mailto:hola@centraliafinanciera.com?subject='+encodeURIComponent('Solicitar cambio de mi reunión con Centralia')+'&body='+encodeURIComponent(`Hola, quisiera cambiar mi reunión del ${dayText(new Date(data.start)).toLowerCase()} a las ${timeText(new Date(data.start))}, hora de Ciudad de México.`);stage('success',true);
  }
  $('#cp-booking-details').addEventListener('submit',async event=>{
    event.preventDefault();if(!selected||submitting||uncertain||booked)return;const button=$('#cp-booking-details button[type="submit"]'),feedback=$('#cp-booking-details .cp-feedback');submitting=true;button.disabled=true;button.textContent='Confirmando…';$('#cp-change-time').disabled=true;feedback.hidden=true;
    try{
      let data;
      {const response=await fetch('/api/agenda/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:$('[name="meeting-name"]').value,lastName:$('[name="meeting-lastname"]').value,email:$('[name="meeting-email"]').value,start:selected.start,consent:$('[name="meeting-consent"]').checked,website:$('[name="website"]').value,requestId})});data=await response.json();if(!response.ok){uncertain=data.code==='UNCONFIRMED'||data.code==='PENDING';if(data.code==='OCCUPIED'){$('#cp-change-time').textContent='Elegir otro horario';selected=null;loaded=false;}throw new Error(data.message);}}
      if(data.confirmed!==true){uncertain=true;throw new Error('No pudimos comprobar la reserva.');}confirmation(data);
    }catch(err){if(err instanceof TypeError||err instanceof SyntaxError)uncertain=true;feedback.textContent=uncertain?'No pudimos comprobar la reserva. Contacta a Centralia antes de reintentar.':err.message||'No pudimos completar la reserva.';feedback.hidden=false;button.textContent=uncertain?'Pendiente de comprobar':'Volver a intentar';button.disabled=uncertain||!selected;}
    finally{submitting=false;$('#cp-change-time').disabled=uncertain;}
  });
  const incoming={credit:'Crédito empresarial',factoring:'Factoraje',suppliers:'Pago a proveedores'}[params.get('solucion')];if(incoming)chooseNeed(incoming);
  // A URL may select the product. An amount is accepted only through the visitor's Continue action.
  calendar();times();channel(params.get('canal')==='agenda'?'agenda':params.get('canal')==='whatsapp'?'whatsapp':'consulta');context();
})();
