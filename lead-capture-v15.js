/* Four-field consultation. No background submission or pretend CRM success.
   Keep the existing HubSpot simulator form separate: it requires email and company.
   Automatic Make/CRM capture is pending a confirmed receiving endpoint and field mapping. */
(() => {
 'use strict';
 const form = document.getElementById('quick-lead-form');
 if (!form) return;
 const field = id => document.getElementById('quick-'+id);
 const review = field('review'), error = field('error');
 const controls = ['name','phone','amount','purpose','consent'].map(field);
 const parseAmount = text => /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text.trim()) ? Number(text.replaceAll(',','')) : NaN;
 const fail = (input, message) => { error.textContent=message; error.hidden=false; input.setAttribute('aria-invalid','true'); input.focus(); };
 controls.forEach(input => input.addEventListener('input', () => {input.removeAttribute('aria-invalid'); error.hidden=true;}));
 field('amount').addEventListener('blur', () => { const amount=parseAmount(field('amount').value); if(Number.isFinite(amount)&&amount>0) field('amount').value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(amount); });
 form.addEventListener('submit', event => {
  event.preventDefault(); error.hidden=true;
  controls.forEach(input=>input.removeAttribute('aria-invalid'));
  const name=field('name').value.trim(), phone=field('phone').value.trim(), amount=parseAmount(field('amount').value), purpose=field('purpose').value;
  if(name.length<2||name.length>100) return fail(field('name'),'Escribe tu nombre, con al menos dos caracteres.');
  const digits=phone.replace(/\D/g,'');
  if(!/^\+?[\d() .-]+$/.test(phone)||digits.length<10||digits.length>15) return fail(field('phone'),'Escribe un WhatsApp válido: 10 dígitos en México o el número con código de país.');
  if(!Number.isFinite(amount)||amount<=0||amount>999999999999.99) return fail(field('amount'),'Escribe un monto mayor a cero, con hasta dos decimales.');
  if(!purpose) return fail(field('purpose'),'Selecciona el uso que le darías al financiamiento.');
  if(!field('consent').checked) return fail(field('consent'),'Autoriza el contacto para preparar tu consulta.');
  const message = ['Hola, Centralia. Quiero orientación para financiar una necesidad de mi empresa.','',`Nombre: ${name}`,`WhatsApp de contacto: ${phone}`,`Monto aproximado: ${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',currencyDisplay:'code'}).format(amount)}`,`Uso: ${purpose}`,'','Autorizo que me contacten por WhatsApp para atender esta consulta. Entiendo que no implica una aprobación de financiamiento.'].join('\n');
  field('message').value=message;
  field('whatsapp').href='https://wa.me/525548092849?text='+encodeURIComponent(message);
  form.hidden=true; review.hidden=false; field('review-title').focus();
 });
 field('edit').addEventListener('click',()=>{review.hidden=true;form.hidden=false;field('whatsapp').removeAttribute('href');field('message').value='';field('name').focus();});
})();
