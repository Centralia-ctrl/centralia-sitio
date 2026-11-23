const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const read=f=>fs.readFileSync(f,'utf8');
// The home page has no footer social block; app.js must keep running so the menu and dialogs work.
test('la portada ejecuta app.js completo sin el bloque social del pie',()=>{
 const dom=new JSDOM(read('index.html'),{url:'https://centraliafinanciera.com/index.html',runScripts:'outside-only'}),w=dom.window,d=w.document,errors=[];
 w.addEventListener('error',e=>errors.push(e.message));
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 assert.equal(d.querySelector('[data-social]'),null);
 w.eval(read('connections.js'));
 assert.doesNotThrow(()=>w.eval(read('app.js')));
 const toggle=d.querySelector('.menu-toggle');toggle.click();
 assert.equal(toggle.getAttribute('aria-expanded'),'true');
 assert.equal(d.querySelector('#mobile-nav').hidden,false);
 d.querySelector('footer [data-info="privacy"]').click();
 assert.ok([...d.querySelectorAll('dialog')].some(x=>x.open));
 assert.deepEqual(errors,[]);
 w.close();
});
