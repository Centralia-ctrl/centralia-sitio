const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const original=require('./lead-capture-v26.js'),contract=require('./contacto-form.js');
const NOW=Date.parse('2026-11-23T18:00:00Z'),START=Date.parse('2026-11-24T15:00:00Z');
const input={firstName:'Prueba',lastName:'Técnica',email:'prueba@example.invalid',start:START,consent:true,requestId:'00000000-0000-4000-8000-000000000001'};
const available={isOffline:false,linkType:'PERSONAL_LINK',customParams:{},linkAvailability:{linkAvailabilityByDuration:{1800000:{availabilities:[{startMillisUtc:START,endMillisUtc:START+1800000}]}},hasMore:true}};
function store(){const map=new Map();let serial=0;return {map,async get(key){return map.get(key)?.data??null;},async setJSON(key,data,condition={}){const old=map.get(key);if(condition.onlyIfNew&&old||condition.onlyIfMatch&&old?.etag!==condition.onlyIfMatch)return {modified:false};const etag=String(++serial);map.set(key,{data:structuredClone(data),etag});return {modified:true,etag};}};}
async function setup(){const {createAgenda}=await import('./netlify/lib/agenda.mjs');const ledger=store(),posts=[],patches=[];let behavior='success';
const fetchImpl=async(url,options)=>{if(options.method==='PATCH'){patches.push({url,...JSON.parse(options.body)});return {ok:behavior!=='crm-failed',status:behavior==='crm-failed'?503:200,json:async()=>({})};}if(options.method==='POST'){posts.push(JSON.parse(options.body));if(behavior==='timeout')throw new Error('offline');if(behavior==='malformed')return {ok:true,json:async()=>({isOffline:true})};return {ok:true,json:async()=>({isOffline:false,calendarEventId:'test-event',contactId:'123456',start:new Date(START).toISOString(),end:new Date(START+1800000).toISOString(),location:'https://meet.google.com/test-test-test'})};}return {ok:true,json:async()=>structuredClone(available)};};
return {ledger,posts,patches,fail(value){behavior=value;},agenda:()=>createAgenda({token:'unit-test-token-not-a-secret',store:ledger,fetchImpl,now:()=>NOW})};}
test('Contact inquiry preserves the six published fields and processing consent; no hutk without analytics',()=>{const values={name:'Persona prueba',company:'Empresa prueba',email:'prueba@example.invalid',phone:'5555555555',purpose:'Factoraje',amount:'1,500,000',consent:true};assert.deepEqual(contract.payload(values,'https://centralia-sitio.netlify.app/contacto.html',''),original.payload(values,'https://centralia-sitio.netlify.app/contacto.html',''));assert.equal(contract.validate(values),null);assert.equal(contract.analyticsAllowed({}),false);assert.equal(contract.analyticsAllowed({__centraliaAnalyticsAllowed:()=>false}),false);});
test('Ambiguous amounts rejected; unknown amount remains Por definir',()=>{assert.ok(Number.isNaN(contract.parseAmount('1,5')));assert.ok(Number.isNaN(contract.parseAmount('-100')));const p=contract.payload({...input,name:'Prueba',company:'Empresa',phone:'5555555555',purpose:'Factoraje',amount:'','amount-unknown':true},'https://centralia-sitio.netlify.app/contacto.html','');assert.equal(p.fields.find(x=>x.name==='cul_es_el_monto_que_requiere_tu_empresa').value,'Por definir');assert.equal('hutk' in p.context,false);});
test('Availability rejects offline and changed consent settings',async()=>{const {normalize}=await import('./netlify/lib/agenda.mjs');assert.throws(()=>normalize({...available,isOffline:true},NOW));assert.throws(()=>normalize({...available,customParams:{legalConsentEnabled:true}},NOW));assert.equal(normalize(available,NOW).slots.length,1);});
test('Booking rechecks slots, uses milliseconds and persists idempotency across new server instances',async()=>{const s=await setup();const result=await s.agenda().book(input);assert.equal(result.confirmed,true);assert.equal(s.posts[0].duration,1800000);assert.deepEqual(await s.agenda().book(input),result);assert.equal(s.posts.length,1);assert.ok([...s.ledger.map.keys()].every(k=>!k.includes('prueba')));});
test('Concurrent identical submissions create only one booking',async()=>{const s=await setup();const results=await Promise.allSettled([s.agenda().book(input),s.agenda().book(input)]);assert.equal(s.posts.length,1);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);});
test('Reload/new request ID cannot duplicate a successful reservation',async()=>{const s=await setup();await s.agenda().book(input);await assert.rejects(s.agenda().book({...input,requestId:input.requestId+'2'}),e=>e.code==='UNCONFIRMED');assert.equal(s.posts.length,1);});
test('Ambiguous booking stays blocked on same and new request IDs',async()=>{const s=await setup();s.fail('timeout');await assert.rejects(s.agenda().book(input));await assert.rejects(s.agenda().book(input));await assert.rejects(s.agenda().book({...input,requestId:input.requestId+'2'}));assert.equal(s.posts.length,1);});
test('Offline booking is never presented as confirmed',async()=>{const s=await setup();s.fail('malformed');await assert.rejects(s.agenda().book(input),e=>e.code==='UNCONFIRMED');});
test('Invalid or unavailable requests never create meetings',async()=>{const s=await setup();for(const data of [{...input,consent:false},{...input,website:'spam'},{...input,email:'invalid'},{...input,start:START+60000}])await assert.rejects(s.agenda().book(data));assert.equal(s.posts.length,0);});
test('Ledger failure fails closed before reservation',async()=>{const s=await setup();s.ledger.setJSON=async()=>{throw Error('storage offline');};await assert.rejects(s.agenda().book(input));assert.equal(s.posts.length,0);});
test('Booking only accepts same-origin approved site requests',async()=>{const {allowedOrigin}=await import('./netlify/lib/agenda.mjs');const req=(host,origin,method='POST')=>new Request('https://'+host+'/api/agenda/book',{method,headers:origin?{origin}:{}});assert.equal(allowedOrigin(req('centralia-sitio.netlify.app','https://centralia-sitio.netlify.app')),true);assert.equal(allowedOrigin(req('deploy-preview-123--centralia-sitio.netlify.app','https://deploy-preview-123--centralia-sitio.netlify.app')),true);assert.equal(allowedOrigin(req('centralia-sitio.netlify.app','https://evil.example')),false);assert.equal(allowedOrigin(req('centralia-sitio.netlify.app',null)),false);});
async function dom(fetchImpl){const d=new JSDOM(fs.readFileSync('contacto.html','utf8'),{url:'https://centralia-sitio.netlify.app/contacto.html?solucion=factoring&monto=999999',runScripts:'outside-only'}),w=d.window;w.matchMedia=()=>({matches:true,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.fetch=fetchImpl;w.eval(fs.readFileSync('contacto-form.js','utf8'));w.eval(fs.readFileSync('contacto.js','utf8'));return d;}
test('Contact ignores URL sample amount and shows success only after actual form response',async()=>{const calls=[];let resolve;const d=await dom((url,opts)=>{calls.push({url,opts});return new Promise(r=>resolve=r);}),w=d.window,doc=w.document;assert.equal(doc.querySelector('#cp-amount').value,'');assert.equal(doc.querySelector('[data-need="Factoraje"]').getAttribute('aria-pressed'),'true');doc.querySelector('#cp-unknown').checked=true;doc.querySelector('#cp-continue').click();const f=doc.querySelector('[data-step="two"]');for(const [name,value]of Object.entries({name:'Persona prueba',company:'Empresa prueba',email:'prueba@example.invalid',phone:'5555555555'}))f.elements[name].value=value;f.elements.consent.checked=true;f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(calls.length,1);assert.equal(f.textContent.includes('Recibimos tu consulta.'),false);resolve({ok:true});await new Promise(r=>setTimeout(r,0));assert.equal(f.textContent.includes('Recibimos tu consulta.'),true);assert.equal(JSON.parse(calls[0].opts.body).fields.length,6);assert.equal('hutk' in JSON.parse(calls[0].opts.body).context,false);d.window.close();});
test('Failed form submission retains data and WhatsApp opens the verified business number',async()=>{const d=await dom(async()=>({ok:false,status:503})),w=d.window,doc=w.document;doc.querySelector('#cp-unknown').checked=true;doc.querySelector('#cp-continue').click();const f=doc.querySelector('[data-step="two"]');for(const [name,value]of Object.entries({name:'Persona prueba',company:'Empresa prueba',email:'prueba@example.invalid',phone:'5555555555'}))f.elements[name].value=value;f.elements.consent.checked=true;f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,0));assert.equal(f.elements.name.value,'Persona prueba');assert.equal(f.querySelector('.cp-feedback').hidden,false);assert.match(doc.querySelector('#cp-whatsapp-link').href,/^https:\/\/wa.me\/525548092849\?text=/);d.window.close();});

test('Booking includes the chosen need and amount using only existing CRM properties',async()=>{
  const s=await setup();await s.agenda().book({...input,need:'Crédito empresarial',amount:2500000.50});
  assert.deepEqual(s.posts[0].formFields,[]);assert.deepEqual(s.patches[0],{url:'https://api.hubapi.com/crm/v3/objects/contacts/123456',properties:{para_que_necesitas_el_financiamiento:'Crédito empresarial',cul_es_el_monto_que_requiere_tu_empresa:'2500000.5'}});
  assert.equal(JSON.stringify(s.posts).includes('hutk'),false);
});
test('Booking omits unchosen values instead of erasing prior CRM data',async()=>{
  const {validate}=await import('./netlify/lib/agenda.mjs');
  assert.deepEqual(validate(input,NOW).formFields,[]);
  assert.deepEqual(validate({...input,need:'Factoraje',amount:null},NOW).formFields,[{name:'para_que_necesitas_el_financiamiento',value:'Factoraje'}]);
  assert.equal(validate({...input,need:'Pago a proveedores',amount:'unknown'},NOW).formFields[1].value,'Por definir');
});
test('Invalid booking context never creates meetings, including forged fields and ambiguous amounts',async()=>{
  const s=await setup();for(const ctx of [{need:'Otro'},{need:{name:'hubspot_owner_id'}},{need:'Factoraje',amount:'1,500,000'},{need:'Factoraje',amount:-1},{need:'Factoraje',amount:1e13},{need:'Factoraje',amount:Infinity},{amount:1000}])await assert.rejects(s.agenda().book({...input,...ctx}),e=>e.code==='INVALID');
  assert.equal(s.posts.length,0);
});
test('Changing booking context cannot replay the same request ID with different CRM values',async()=>{
  const s=await setup(),v={...input,need:'Factoraje',amount:500000};await s.agenda().book(v);
  await assert.rejects(s.agenda().book({...v,amount:1000000}),e=>e.code==='CONFLICT');
  assert.equal(s.posts.length,1);
});
test('Failed CRM update retains confirmed meeting and recovers without another booking',async()=>{
  const s=await setup(),v={...input,need:'Factoraje',amount:500000};s.fail('crm-failed');
  const pending=await s.agenda().book(v);assert.equal(pending.confirmed,true);assert.equal(pending.contextSaved,false);
  assert.ok([...s.ledger.map.values()].some(x=>x.data.pendingContext?.contactId==='123456'));
  s.fail('success');const done=await s.agenda().book(v);assert.equal(done.contextSaved,true);assert.equal(s.posts.length,1);
  assert.equal([...s.ledger.map.values()].some(x=>x.data.pendingContext),false);
  const count=s.patches.length;await s.agenda().book(v);assert.equal(s.patches.length,count);
});
test('An unconfirmed booking never updates contact properties',async()=>{
  const s=await setup();s.fail('malformed');await assert.rejects(s.agenda().book({...input,need:'Factoraje',amount:500000}));assert.equal(s.patches.length,0);
});
test('Agenda receives only a confirmed amount; editing it clears confirmation, never imports URL amount',async()=>{
  for(const mode of ['confirmed','unknown','edited','unconfirmed']){
    const calls=[],start=Date.now()+86400000;
    const d=await dom(async(url,opts)=>{if(opts?.method==='POST'){calls.push(JSON.parse(opts.body));return {ok:true,json:async()=>({confirmed:true,start:new Date(start).toISOString(),end:new Date(start+1800000).toISOString(),location:''})};}return {ok:true,json:async()=>({slots:[{start,end:start+1800000}],hasMore:false})};});
    const doc=d.window.document;
    if(mode!=='unconfirmed'){
      doc.querySelector('#cp-amount').value='2,500,000';
      doc.querySelector('#cp-unknown').checked=mode==='unknown';doc.querySelector('#cp-continue').click();
      if(mode==='edited'){doc.querySelector('#cp-back').click();doc.querySelector('#cp-amount').value='3,000,000';doc.querySelector('#cp-amount').dispatchEvent(new d.window.Event('input'));}
    }
    doc.querySelector('[data-channel="agenda"]').click();await new Promise(r=>setTimeout(r,0));
    doc.querySelector('.cp-time').click();doc.querySelector('#cp-time-continue').click();
    const f=doc.querySelector('#cp-booking-details');f.elements['meeting-name'].value='Prueba';f.elements['meeting-lastname'].value='Técnica';f.elements['meeting-email'].value='prueba@example.invalid';f.elements['meeting-consent'].checked=true;
    f.dispatchEvent(new d.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,0));
    assert.equal(calls.length,1);assert.equal(calls[0].need,'Factoraje');assert.equal(calls[0].amount,mode==='confirmed'?2500000:mode==='unknown'?'unknown':null);
    assert.equal(JSON.stringify(calls).includes('hutk'),false);d.window.close();
  }
});
test('Agenda failure shows a clear message, keeps retry and the WhatsApp tab, and never shows a raw error',async()=>{
 // Fallos reales: respuesta no JSON, red caída y la respuesta de la vista previa sin agenda configurada.
 const cases=[
  async()=>({ok:false,status:404,json:async()=>{throw new SyntaxError("Unexpected token 'N', \"Not found\" is not valid JSON");}}),
  async()=>{throw new TypeError('Failed to fetch');},
  async()=>({ok:false,status:503,json:async()=>({code:'NOT_CONFIGURED',message:'La agenda no está disponible en este momento.'})})
 ];
 for(const impl of cases){
  const requests=[],opened=[];
  const d=new JSDOM(fs.readFileSync('contacto.html','utf8'),{url:'https://centralia-sitio.netlify.app/contacto.html?canal=agenda&solucion=factoring',runScripts:'outside-only'}),w=d.window;
  w.matchMedia=()=>({matches:true,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.open=(...args)=>{opened.push(args);return null;};
  w.fetch=async(url,opts)=>{requests.push({url:String(url),method:opts?.method||'GET'});return String(url).includes('/api/agenda/availability')?impl():({ok:true,status:200,json:async()=>({})});};
  w.eval(fs.readFileSync('contacto-form.js','utf8'));w.eval(fs.readFileSync('contacto.js','utf8'));const doc=w.document;
  await new Promise(r=>setTimeout(r,30));
  const summary=()=>doc.querySelector('#cp-booking-summary').textContent;
  assert.match(summary(),/No pudimos consultar la agenda|La agenda no está disponible en este momento\./);assert.doesNotMatch(summary(),/Unexpected token|Failed to fetch|JSON|NOT_CONFIGURED/);
  // Opción 1: reintentar en la misma agenda.
  const retry=doc.querySelector('#cp-retry');assert.equal(retry.hidden,false);
  // El respaldo de la agenda abre la agenda de HubSpot; no es WhatsApp.
  const fallback=doc.querySelector('#cp-agenda-fallback a');assert.equal(doc.querySelector('#cp-agenda-fallback').hidden,false);
  assert.equal(fallback.textContent.trim(),'Abrir la agenda de Centralia ↗');assert.match(fallback.href,/^https:\/\/meetings\.hubspot\.com\//);assert.doesNotMatch(fallback.href,/wa\.me/);
  // Reintentar vuelve a pedir horarios y conserva un mensaje claro.
  const before=requests.filter(r=>r.url.includes('/api/agenda/availability')).length;retry.click();await new Promise(r=>setTimeout(r,30));
  assert.equal(requests.filter(r=>r.url.includes('/api/agenda/availability')).length,before+1);
  assert.doesNotMatch(summary(),/Unexpected token|Failed to fetch|JSON|NOT_CONFIGURED/);assert.equal(retry.hidden,false);
  // Opción 2: la pestaña superior de WhatsApp sigue disponible y forma el enlace con el producto, sin abrirlo.
  const tab=doc.querySelector('[data-channel="whatsapp"]');assert.ok(tab);assert.equal(tab.disabled,false);
  tab.click();assert.equal(tab.getAttribute('aria-pressed'),'true');assert.equal(doc.querySelector('#cp-whatsapp').hidden,false);assert.equal(doc.querySelector('#cp-agenda').hidden,true);
  const wa=new URL(doc.querySelector('#cp-whatsapp-link').href);assert.equal(wa.origin+wa.pathname,'https://wa.me/525548092849');
  assert.equal(wa.searchParams.get('text'),'Hola, me gustaría revisar opciones de factoraje para mi empresa.');
  // Nada se abrió ni se envió: solo consultas GET de disponibilidad.
  assert.equal(opened.length,0);assert.ok(requests.every(r=>r.method==='GET'&&r.url.includes('/api/agenda/availability')));
  d.window.close();
 }
});
