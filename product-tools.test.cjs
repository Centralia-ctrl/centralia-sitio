const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const read=f=>fs.readFileSync(f,'utf8');
const pages=Function('return '+read('build.cjs').match(/const PAGES=(\[[^;]+\]);/)[1])();
function setup(file){
 const dom=new JSDOM(read(file),{url:'https://centraliafinanciera.com/'+file,runScripts:'outside-only'}),w=dom.window,d=w.document,calls=[];
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.fetch=async(url,o)=>{calls.push({url,body:JSON.parse(o.body)});return {ok:true}};
 const trigger=d.createElement('button');trigger.dataset.simulate='credit';d.body.append(trigger);
 for(const f of ['simulator.js','experience-v26.js'])w.eval(read(f));
 return {w,d,calls,$:s=>d.querySelector(s),close:()=>w.close()};
}
const flush=()=>new Promise(r=>setImmediate(r));
test('All 22 pages use four contact fields in the same order, with opt-in consent retained',()=>{
 for(const file of pages){const dom=new JSDOM(read(file)),d=dom.window.document;
  assert.deepEqual([...d.querySelectorAll('.sim-lead-grid input')].map(e=>[e.id,e.required]),['lead-name','lead-company','lead-email','lead-phone'].map(id=>[id,true]),file);
  assert.equal(d.querySelector('.sim-lead-grid select'),null,file);assert.equal(d.querySelector('#lead-consent').checked,false);assert.equal(d.querySelector('#lead-consent').required,true);assert.equal(d.querySelector('#lead-business').required,true);
  assert.ok(d.querySelector('.sim-success[tabindex="-1"] .sim-confirmed-scenario'));assert.doesNotMatch(d.querySelector('.sim-data-info').textContent,/tu nombre, cargo/);dom.window.close();
 }
});
test('Illustrative opening fee stays at 4.5% only for unsecured credit; visible FAQs match structured answers',()=>{
 for(const f of ['app.js','index.html','preguntas-frecuentes.html']){assert.doesNotMatch(read(f),/1%, 2% o 4%/);assert.match(read(f),/4\.5%/);}
 for(const f of ['index.html','preguntas-frecuentes.html']){const dom=new JSDOM(read(f)),d=dom.window.document;
  const graph=[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(e=>JSON.parse(e.textContent)['@graph']||[]),faq=graph.find(e=>e['@type']==='FAQPage'),answer=faq?.mainEntity.find(e=>e.name==='¿Qué tasa y comisiones pagaría mi empresa?')?.acceptedAnswer.text;
  assert.ok(answer);assert.ok(d.body.textContent.includes(answer),f);assert.match(answer,/4\.5%, antes de IVA/);assert.match(answer,/con garantía, la comisión está por confirmar/);dom.window.close();
 }
});
for(const file of ['index.html','preguntas-frecuentes.html','blog/factoraje-con-recurso-y-sin-recurso.html'])test(file+': shared dialog calculates, requests consent, confirms the scenario and focuses its visible receipt',async()=>{
 const p=setup(file);p.$('[data-simulate="credit"]').click();p.$('#sim-amount').value='1200000';p.$('#sim-term').value='36';
 p.$('#simulator-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));
 p.$('#sim-request-advice').click();
 for(const [id,v] of Object.entries({'lead-name':'Prueba Local','lead-company':'Empresa local','lead-email':'qa@example.invalid','lead-phone':'5512345678'}))p.$('#'+id).value=v;
 p.$('#lead-business').checked=true;const submit=()=>p.$('#sim-lead-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));
 submit();await flush();assert.equal(p.calls.length,0);p.$('#lead-consent').checked=true;submit();await flush();assert.equal(p.calls.length,1);
 assert.equal(p.calls[0].body.context.hutk,undefined);assert.equal(p.d.activeElement,p.$('.sim-success'));assert.equal(p.$('.sim-success').hidden,false);assert.equal(p.$('#sim-results').hidden,true);
 assert.match(p.$('.sim-confirmed-scenario').textContent,/1,200,000.00.*36 meses/);assert.match(p.calls[0].url,/1da292ee-7ccc-42e4-a427-ece646e13e65$/);p.close();
});
test('Supplier case CTA preserves amount and dates; invalid scenario stays on page and focuses the error',()=>{
 const p=setup('pago-a-proveedores.html');p.w.eval(read('supplier-calendar-preview.js'));
 p.$('#supplier-amount').value='8700000';p.$('#supplier-payment').value='2030-12-20';p.$('#supplier-collection').value='2031-01-10';
 const link=p.$('.cx-case-link');link.click();assert.equal(p.$('#simulator-dialog').open,true);assert.match(p.$('#sim-summary').textContent,/8,700,000.00.*21 días/);assert.equal(p.w.location.pathname,'/pago-a-proveedores.html');
 p.$('#sim-back').click();assert.equal(p.d.activeElement,link);p.$('#supplier-amount').value='0';link.click();assert.equal(p.$('#simulator-dialog').open,false);assert.equal(p.d.activeElement,p.$('#supplier-amount'));assert.equal(p.calls.length,0);p.close();
});
