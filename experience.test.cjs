// Run with Node's test runner and jsdom 26 available on NODE_PATH (or locally).
// External resources are never loaded; every submission uses a fetch double.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const capture=require('./lead-capture-v26.js');
const {calendarGap}=require('./experience-v26.js');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
function page(name){
 const dom=new JSDOM(read(name),{url:'https://centraliafinanciera.com/'+name,runScripts:'outside-only'});
 const w=dom.window;w.matchMedia=()=>({matches:true,addEventListener(){}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const calls=[];w.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true};};
 return {dom,w,d:w.document,calls};
}
const submit=(w,form)=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Calendar arithmetic: month/year boundaries, leap day, same day, reversed and invalid dates',()=>{
 assert.equal(calendarGap('2026-12-20','2027-01-10'),21);
 assert.equal(calendarGap('2028-02-28','2028-03-01'),2);
 assert.equal(calendarGap('2026-10-26','2026-10-26'),0);
 assert.equal(calendarGap('2026-11-02','2026-10-26'),-7);
 assert.ok(Number.isNaN(calendarGap('2026-02-30','2026-03-10')));
 assert.ok(Number.isNaN(calendarGap('','2026-03-10')));
});
test('Home form: no submission on step one, missing consent, or invalid contact; back preserves values',async()=>{
 const {dom,w,d,calls}=page('index.html');capture.init(d,w);
 const f=n=>d.getElementById('capture-'+n), form=d.getElementById('centralia-contact-form');
 submit(w,form);assert.equal(calls.length,0);assert.match(f('error').textContent,/monto/);
 f('amount').value='1,000,000';f('purpose').value='Factoraje';submit(w,form);
 assert.equal(calls.length,0);assert.equal(f('name').closest('label').hidden,false);
 f('name').value='Prueba Local';f('company').value='Empresa de prueba';f('email').value='invalid';f('phone').value='5512345678';
 submit(w,form);assert.equal(calls.length,0);assert.match(f('error').textContent,/correo/);
 f('email').value='qa@example.invalid';submit(w,form);assert.equal(calls.length,0);assert.match(f('error').textContent,/Autoriza/);
 d.querySelector('.cx-back').click();assert.equal(f('amount').value,'1,000,000');assert.equal(f('name').value,'Prueba Local');
 submit(w,form);f('consent').checked=true;submit(w,form);await flush();
 assert.equal(calls.length,1);assert.match(calls[0].url,/68d091a6-/);
 assert.deepEqual(calls[0].body.fields.map(x=>x.name),['firstname','company','email','phone','cul_es_el_monto_que_requiere_tu_empresa','para_que_necesitas_el_financiamiento']);
 assert.equal(calls[0].body.fields[4].value,'1000000');assert.equal(calls[0].body.legalConsentOptions.consent.consentToProcess,true);
 submit(w,form);await flush();assert.equal(calls.length,1);assert.equal(f('success').hidden,false);dom.window.close();
});
test('Home form: failed API keeps values and permits explicit retry',async()=>{
 const {dom,w,d,calls}=page('index.html');w.fetch=async()=>({ok:false,status:500});capture.init(d,w);
 const f=n=>d.getElementById('capture-'+n),form=d.getElementById('centralia-contact-form');
 f('amount').value='500000';f('purpose').value='Crédito empresarial';submit(w,form);
 for(const [name,value] of Object.entries({name:'Prueba',company:'Empresa',email:'qa@example.invalid',phone:'5512345678'}))f(name).value=value;
 f('consent').checked=true;submit(w,form);await flush();
 assert.equal(form.hidden,false);assert.equal(f('email').value,'qa@example.invalid');assert.equal(f('submit').disabled,false);assert.equal(f('fallback').hidden,false);dom.window.close();
});
test('Provider planner: no network before explicit consent; dates reach only the existing message field',async()=>{
 const {dom,w,d,calls}=page('pago-a-proveedores.html');w.eval(read('simulator.js'));w.eval(read('experience-v26.js'));
 d.querySelector('[name=payment]').value='2030-12-20';d.querySelector('[name=collection]').value='2031-01-10';d.querySelector('[name=collection]').dispatchEvent(new w.Event('change'));
 assert.match(d.querySelector('output').textContent,/21 días/);assert.equal(calls.length,0);
 d.querySelector('[data-payment-planner] button').click();assert.equal(d.querySelector('dialog#simulator-dialog').open,true);assert.match(d.getElementById('sim-summary').textContent,/20 dic 2030/);
 const form=d.getElementById('sim-lead-form');submit(w,form);assert.equal(calls.length,0);
 for(const [id,value] of Object.entries({'lead-name':'Prueba Local','lead-company':'Empresa','lead-email':'qa@example.invalid','lead-phone':'5512345678','lead-role':'Representante legal'}))d.getElementById(id).value=value;
 d.getElementById('lead-business').checked=true;submit(w,form);assert.equal(calls.length,0);
 d.getElementById('lead-consent').checked=true;submit(w,form);await flush();
 assert.equal(calls.length,1);assert.match(calls[0].url,/1da292ee-/);
 const fields=Object.fromEntries(calls[0].body.fields.map(x=>[x.name,x.value]));
 assert.deepEqual(Object.keys(fields),['email','firstname','company','phone','message']);
 assert.match(fields.message,/Pago a proveedores/);assert.match(fields.message,/2031-01-10/);assert.match(fields.message,/21 días/);assert.doesNotMatch(fields.message,/85%|Mensualidad ilustrativa/);
 assert.equal(d.querySelector('.sim-success').hidden,false);assert.equal(d.querySelector('.sim-steps').hidden,true);dom.window.close();
});
test('Credit and factoring arithmetic still uses the existing limits and percentages',()=>{
 const {dom,w,d}=page('pago-a-proveedores.html');w.eval(read('simulator.js'));
 const c=w.CENTRALIA_SIMULATION.credit(100000,12);assert.ok(c.monthly>9000&&c.monthly<10000);
 assert.equal(w.CENTRALIA_SIMULATION.factoring(100000).advance,85000);
 assert.throws(()=>w.CENTRALIA_SIMULATION.credit(15000001,12));
 assert.throws(()=>w.CENTRALIA_SIMULATION.credit(100000,13));dom.window.close();
});
test('Switching from a provider calendar to credit and factoring restores the correct screens',()=>{
 const {dom,w,d}=page('pago-a-proveedores.html');
 for(const mode of ['credit','factoring']){const button=d.createElement('button');button.dataset.simulate=mode;d.body.append(button);}
 w.eval(read('simulator.js'));
 d.dispatchEvent(new w.CustomEvent('centralia:provider-scenario',{detail:{payment:'2030-12-20',collection:'2031-01-10',days:21}}));
 d.getElementById('simulator-dialog').close();
 d.querySelector('[data-simulate=credit]').click();
 assert.equal(d.querySelector('.sim-steps').hidden,false);assert.equal(d.getElementById('sim-credit-assumptions').hidden,false);
 submit(w,d.getElementById('simulator-form'));assert.match(d.getElementById('sim-results').textContent,/Mensualidad estimada/);
 d.getElementById('simulator-dialog').close();d.querySelector('[data-simulate=factoring]').click();
 submit(w,d.getElementById('simulator-form'));assert.match(d.getElementById('sim-results').textContent,/Anticipo estimado/);dom.window.close();
});
test('Measurement stays off by default and filters input before any future consented event',()=>{
 const {dom,w,d}=page('index.html');const {start,SETTINGS}=require('./pixel.js');
 start(w);assert.equal(w.fbq,undefined);assert.equal(d.querySelector('#centralia-meta-pixel'),null);
 start(w,{...SETTINGS,enabled:true});
 const emit=detail=>d.dispatchEvent(new w.CustomEvent('centralia:interaction',{detail}));
 emit({action:'form_started',product:'home'});assert.equal(w.fbq,undefined);
 d.dispatchEvent(new w.CustomEvent('centralia:measurement-consent',{detail:{marketing:true,analytics:false}}));
 const before=w.fbq.queue.length;
 emit({action:'form_started',product:'home',email:'private@example.invalid',amount:99999,query:'secret'});
 assert.equal(w.fbq.queue.length,before+1);const event=Array.from(w.fbq.queue.at(-1));
 assert.equal(JSON.stringify(event),'["trackCustom","FormStarted",{"content_category":"Portada"}]');
 emit({action:'form_started',product:'private@example.invalid'});assert.equal(w.fbq.queue.length,before+1);
 d.dispatchEvent(new w.CustomEvent('centralia:measurement-consent',{detail:{marketing:false,analytics:false}}));
 const after=w.fbq.queue.length;emit({action:'form_started',product:'home'});assert.equal(w.fbq.queue.length,after);dom.window.close();
});

test('Home form: HubSpot visitor token travels only when its cookie exists',()=>{
 const values={name:'Ana Pérez',company:'Empresa SA',email:'ana@example.invalid',phone:'5512345678',amount:'1,000,000',purpose:'Factoraje',consent:true};
 const token='0123456789abcdef0123456789abcdef';
 assert.equal(capture.hubspotToken('a=1; hubspotutk='+token+'; b=2'),token);
 assert.equal(capture.hubspotToken('hubspotutk=not-a-token; a=1'),'');
 assert.equal(capture.hubspotToken(''),'');
 assert.equal(capture.payload(values,'https://example.invalid/',token).context.hutk,token);
 assert.equal('hutk' in capture.payload(values,'https://example.invalid/','').context,false);
});

// HubSpot visitor cookie (hutk): only with measurement on, current analytics consent and a valid cookie.
const pixelModule=require('./pixel.js');
const HUTK='0123456789abcdef0123456789abcdef';
function measuredPage(name,{enabled=true,cookie,stored,choices=[]}={}){
 const p=page(name);
 if(cookie!==undefined)p.d.cookie='hubspotutk='+cookie;
 if(stored!==undefined)p.w.localStorage.setItem('centralia-consent-v1',JSON.stringify(stored));
 pixelModule.start(p.w,{...pixelModule.SETTINGS,enabled});
 for(const choice of choices)p.d.dispatchEvent(new p.w.CustomEvent('centralia:measurement-consent',{detail:choice}));
 return p;
}
async function homeContext(setup,beforeSend=()=>{}){
 const p=measuredPage('index.html',setup);capture.init(p.d,p.w);
 const f=n=>p.d.getElementById('capture-'+n),form=p.d.getElementById('centralia-contact-form');
 f('amount').value='1,000,000';f('purpose').value='Factoraje';submit(p.w,form);
 for(const [k,v] of Object.entries({name:'Prueba Local',company:'Empresa',email:'qa@example.invalid',phone:'5512345678'}))f(k).value=v;
 f('consent').checked=true;beforeSend(p);submit(p.w,form);await flush();
 assert.equal(p.calls.length,1);assert.equal(f('success').hidden,false);const context=p.calls[0].body.context;p.dom.window.close();return context;
}
async function simulatorContext(setup,beforeSend=()=>{}){
 const p=measuredPage('pago-a-proveedores.html',setup);p.w.eval(read('simulator.js'));p.w.eval(read('experience-v26.js'));
 const d=p.d;d.querySelector('[name=payment]').value='2030-12-20';d.querySelector('[name=collection]').value='2031-01-10';d.querySelector('[name=collection]').dispatchEvent(new p.w.Event('change'));
 d.querySelector('[data-payment-planner] button').click();
 for(const [id,value] of Object.entries({'lead-name':'Prueba Local','lead-company':'Empresa','lead-email':'qa@example.invalid','lead-phone':'5512345678','lead-role':'Representante legal'}))d.getElementById(id).value=value;
 d.getElementById('lead-business').checked=true;d.getElementById('lead-consent').checked=true;beforeSend(p);
 submit(p.w,d.getElementById('sim-lead-form'));await flush();
 assert.equal(p.calls.length,1);assert.equal(d.querySelector('.sim-success').hidden,false);const context=p.calls[0].body.context;p.dom.window.close();return context;
}
const accepted={analytics:true,marketing:false}, rejected={analytics:false,marketing:false};
for(const [label,send] of [['Home form',homeContext],['Simulator',simulatorContext]]){
 test(label+': no hutk with the cookie when analytics consent is rejected or absent',async()=>{
  assert.equal('hutk' in await send({cookie:HUTK,stored:rejected,choices:[rejected]}),false);
  assert.equal('hutk' in await send({cookie:HUTK}),false);
  assert.equal('hutk' in await send({cookie:HUTK,choices:[accepted]}),false,'accepted in memory but never stored');
 });
 test(label+': no hutk when analytics consent is revoked before sending',async()=>{
  const revoke=p=>{p.w.localStorage.setItem('centralia-consent-v1',JSON.stringify(rejected));p.d.dispatchEvent(new p.w.CustomEvent('centralia:measurement-consent',{detail:rejected}));};
  assert.equal('hutk' in await send({cookie:HUTK,stored:accepted,choices:[accepted]},revoke),false);
 });
 test(label+': no hutk while measurement is off',async()=>{
  assert.equal('hutk' in await send({enabled:false,cookie:HUTK,stored:accepted,choices:[accepted]}),false);
 });
 test(label+': no hutk when the cookie is missing or invalid',async()=>{
  assert.equal('hutk' in await send({stored:accepted,choices:[accepted]}),false);
  assert.equal('hutk' in await send({cookie:'not-a-hubspot-token',stored:accepted,choices:[accepted]}),false);
 });
 test(label+': hutk travels when measurement is on, analytics is accepted and the cookie is valid',async()=>{
  assert.equal((await send({cookie:HUTK,stored:accepted,choices:[accepted]})).hutk,HUTK);
 });
}
test('Home confirmation: summary of what was sent, human review next, and no way onward to registration',async()=>{
 const {dom,w,d,calls}=page('index.html');const opened=[];w.open=(...a)=>{opened.push(a);return null;};capture.init(d,w);
 const f=n=>d.getElementById('capture-'+n),form=d.getElementById('centralia-contact-form');
 assert.equal(f('success').hidden,true);
 f('amount').value='2,500,000';f('purpose').value='Pago a proveedores';submit(w,form);
 for(const [name,value] of Object.entries({name:'Prueba',company:'Empresa',email:'qa@example.invalid',phone:'5512345678'}))f(name).value=value;
 f('consent').checked=true;submit(w,form);await flush();
 assert.equal(calls.length,1);assert.equal(f('success').hidden,false);assert.equal(form.hidden,true);
 assert.equal(f('summary-purpose').textContent,'Pago a proveedores');assert.equal(f('summary-amount').textContent,'$2,500,000 MXN');
 const text=f('success').textContent;
 assert.match(text,/Recibimos tu consulta\.Te contactamos a la brevedad desde hola@centraliafinanciera\.com\./);
 assert.match(text,/Ahora, lo revisamos contigo\./);assert.match(text,/te compartiremos una invitación al registro/);
 assert.match(text,/El envío no implica una aprobación de financiamiento\./);
 assert.equal(f('success').querySelector('a[href^="mailto:"]').getAttribute('href'),'mailto:hola@centraliafinanciera.com');
 assert.equal(d.querySelector('.first-step-meeting').getAttribute('href'),'https://meetings.hubspot.com/miguelmeza1');
 assert.equal(d.querySelectorAll('#consulta a[href*="registro"],#consulta button[data-registro]').length,0);
 assert.equal(opened.length,0);assert.equal(w.location.href,'https://centraliafinanciera.com/index.html');
 assert.ok(!/registro/i.test(read('lead-capture-v26.js')));dom.window.close();
});
test('Home confirmation never appears when HubSpot does not confirm (error or network failure)',async()=>{
 for(const fetcher of [async()=>({ok:false,status:400}),async()=>{throw new Error('offline');}]){
  const {dom,w,d}=page('index.html');w.fetch=fetcher;capture.init(d,w);
  const f=n=>d.getElementById('capture-'+n),form=d.getElementById('centralia-contact-form');
  f('amount').value='500000';f('purpose').value='Factoraje';submit(w,form);
  for(const [name,value] of Object.entries({name:'Prueba',company:'Empresa',email:'qa@example.invalid',phone:'5512345678'}))f(name).value=value;
  f('consent').checked=true;submit(w,form);await flush();
  assert.equal(f('success').hidden,true);assert.equal(f('summary-amount').textContent,'');assert.equal(f('amount').value,'500000');
  assert.equal(f('error').hidden,false);assert.equal(f('submit').disabled,false);dom.window.close();
 }
});
test('Crédito empresarial: new illustration keeps the HTML messages, poster fallback and no demo controls',()=>{
 const html=read('credito-empresarial.html'),js=read('credit-welcome-3d.js');
 const d=new JSDOM(html).window.document;
 assert.deepEqual([...d.querySelectorAll('[data-film-message]')].map(m=>m.textContent),['Dale capitala tu siguienteetapa.','Invierte en equipo,inventario yexpansión.']);
 const art=d.querySelector('[data-credit-art]');
 assert.equal(art.getAttribute('aria-label'),'Dale capital a tu siguiente etapa. Invierte en equipo, inventario y expansión.');
 assert.equal(art.querySelector('img').getAttribute('src'),'assets/credito-bienvenida-poster.webp');assert.equal(art.querySelector('img').getAttribute('alt'),'');
 assert.equal(art.querySelector('canvas').getAttribute('aria-hidden'),'true');
 assert.ok(d.querySelector('script[type="module"][src="credit-welcome-3d.js"]'));assert.ok(!html.includes('credit-structure-v26.js'));
 assert.ok(!/contrapeso/i.test(html+js));
 assert.ok(!/data-preview|Tweak|window\.THREE/.test(js));assert.match(js,/from '\.\/assets\/vendor\/three\/three\.module\.min\.js'/);
 assert.match(js,/prefers-reduced-motion: reduce/);
});
