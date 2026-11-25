const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');

for(const reduced of [true,false])test(`Credit loading is cancelled offscreen; reduced motion ${reduced}`,async()=>{
  const dom=new JSDOM(read('credito-empresarial.html'),{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window, idle=[], observers=[];let imports=0;
  w.matchMedia=()=>({matches:reduced,addEventListener(){}});
  w.IntersectionObserver=class{constructor(callback){observers.push(callback)}observe(){}};
  w.requestIdleCallback=callback=>{idle.push(callback);return idle.length;};w.cancelIdleCallback=()=>{};
  w.loadTestArtwork=()=>{imports++;return Promise.reject(Error('must not import'));};
  try{
    w.eval(read('credit-project-scenes.js').replace(/import\('\.\/credit-project-artwork\.js[^']*'\)/,'window.loadTestArtwork()'));
    observers[0]([{isIntersecting:true,intersectionRatio:.8}]);
    w.document.querySelector('[data-project="equipo"]').click();
    observers[0]([{isIntersecting:false,intersectionRatio:0}]);
    idle.forEach(callback=>callback());
    await new Promise(r=>setTimeout(r,10));
    assert.equal(imports,0);
    assert.match(w.document.querySelector('.credit-project-fallback img').src,/equipo-doble/);
    assert.equal(w.document.querySelector('#credit-project-panel-equipo').hidden,false);
  }finally{w.close()}
});


test('Home page app.js initializes without footer social links (mobile menu works)',()=>{
  const dom=new JSDOM(read('index.html'),{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addEventListener(){}});
  try{
    w.eval(read('connections.js'));
    assert.equal(w.document.querySelector('[data-social]'),null);
    w.eval(read('app.js'));
    const toggle=w.document.querySelector('.menu-toggle');
    toggle.click();
    assert.equal(w.document.querySelector('#mobile-nav').hidden,false);
  }finally{w.close()}
});
