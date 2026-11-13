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
test('Credit uses 36 months and 5% opening; visible FAQs match structured answers',()=>{
 for(const f of pages){const dom=new JSDOM(read(f)),d=dom.window.document;
  assert.equal(d.querySelector('#sim-credit-kind'),null,f);assert.equal(d.querySelector('#sim-term').value,'36',f);assert.match(d.querySelector('#sim-scope').textContent,/20 millones.*36 meses/);dom.window.close();
 }
 for(const f of ['app.js','index.html','preguntas-frecuentes.html']){assert.doesNotMatch(read(f),/4\.5%|comisión por confirmar/);assert.match(read(f),/5%/);}
 for(const f of ['preguntas-frecuentes.html']){const dom=new JSDOM(read(f)),d=dom.window.document;
  const graph=[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(e=>JSON.parse(e.textContent)['@graph']||[]),faq=graph.find(e=>e['@type']==='FAQPage'),answer=faq?.mainEntity.find(e=>e.name==='¿Qué tasa y comisiones pagaría mi empresa?')?.acceptedAnswer.text;
  assert.ok(answer);assert.ok(d.body.textContent.includes(answer),f);assert.match(answer,/36 meses/);assert.match(answer,/apertura del 5% por separado, antes de IVA/);dom.window.close();
 }
});
for(const file of ['index.html','preguntas-frecuentes.html','blog/factoraje-con-recurso-y-sin-recurso.html'])test(file+': shared dialog calculates, requests consent, delivers the table and focuses its visible title',async()=>{
 const p=setup(file);p.$('[data-simulate="credit"]').click();p.$('#sim-amount').value='1200000';
 assert.equal(p.$('#sim-term').disabled,true);assert.deepEqual([...p.$('#sim-term').options].map(option=>option.value),['36']);
 p.$('#simulator-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));
 p.$('#sim-request-advice').click();
 for(const [id,v] of Object.entries({'lead-name':'Prueba Local','lead-company':'Empresa local','lead-email':'qa@example.invalid','lead-phone':'5512345678'}))p.$('#'+id).value=v;
 p.$('#lead-business').checked=true;const submit=()=>p.$('#sim-lead-form').dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));
 submit();await flush();assert.equal(p.calls.length,0);p.$('#lead-consent').checked=true;submit();await flush();assert.equal(p.calls.length,1);
 assert.equal(p.calls[0].body.context.hutk,undefined);assert.equal(p.d.activeElement,p.$('#simulator-title'));assert.equal(p.$('.sim-success').hidden,true);assert.equal(p.$('#sim-results').hidden,true);
 assert.equal(p.$('#sim-delivered-details details').open,true);assert.match(p.$('#sim-delivered-details').textContent,/1,200,000.00/);assert.match(p.calls[0].url,/1da292ee-7ccc-42e4-a427-ece646e13e65$/);p.close();
});
test('Supplier case CTA preserves amount and requested term; invalid scenario stays on page and focuses the error',()=>{
 const p=setup('pago-a-proveedores.html');p.w.eval(read('supplier-simulator-preview.js'));
 p.$('#cp-amount').value='8700000';p.$('#cp-days').value='21';
 const link=p.$('.cx-case-link');link.click();assert.equal(p.$('#simulator-dialog').open,true);assert.match(p.$('#sim-summary').textContent,/8,700,000.00.*21 días/);assert.equal(p.w.location.pathname,'/pago-a-proveedores.html');
 p.$('#sim-back').click();assert.equal(p.d.activeElement,link);p.$('#cp-amount').value='0';link.click();assert.equal(p.$('#simulator-dialog').open,false);assert.equal(p.d.activeElement,p.$('#cp-amount'));assert.equal(p.calls.length,0);p.close();
});
test('Supplier estimate uses confirmed rate and term range without implying tax-inclusive or approved pricing',()=>{
 const p=setup('pago-a-proveedores.html');p.w.eval(read('supplier-simulator-preview.js'));
 for(const [days,expected] of [[15,'$10,075,000'],[30,'$10,150,000'],[60,'$10,300,000']]){
  p.$('#cp-days').value=String(days);p.$('#cp-days').dispatchEvent(new p.w.Event('input'));
  assert.equal(p.$('[data-out=total]').textContent,expected);
  assert.match(p.$('.cp-demo').textContent,/Sin comisión de apertura.*Sujeto a evaluación/);
  assert.match(p.$('.cp-pending').textContent,/Antes de impuestos y otros cargos/);
  assert.equal(p.$('.cp-total dt').textContent,'Capital + interés estimado');
  assert.equal(p.$('[data-calendar-review]').disabled,false);
 }
 const graph=JSON.parse(p.$('script[type="application/ld+json"]').textContent);
 const faq=graph['@graph'].find(node=>node['@type']==='FAQPage');
 const visible=[...p.d.querySelectorAll('.product-faq details')].map(detail=>({question:detail.querySelector('summary').textContent.trim(),answer:detail.querySelector('p').textContent.trim()}));
 assert.deepEqual(faq.mainEntity.map(item=>({question:item.name,answer:item.acceptedAnswer.text})),visible);
 assert.doesNotMatch(p.d.body.textContent,/US\$5 millones|hasta 37 días/);
 assert.equal(p.calls.length,0);p.close();
});
