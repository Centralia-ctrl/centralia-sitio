// Renders the 1200x630 share images (assets/og-*.png) with the site font, logo and palette.
// Not part of the build. Run: PW=<path to playwright> REPO=$PWD node herramientas/og-imagenes.cjs
// Uses the Chromium at /opt/pw-browsers/chromium; change executablePath if needed.
const {chromium}=require(process.env.PW);const R=process.env.REPO;
const cards=[
 ['og-inicio','FINANCIAMIENTO PARA EMPRESAS','Financiamiento para las empresas','que mueven a México.'],
 ['og-credito-empresarial','CRÉDITO EMPRESARIAL','Dale capital a tu','siguiente etapa.'],
 ['og-factoraje','FACTORAJE','Tus facturas, convertidas en','capital para operar.'],
 ['og-pago-a-proveedores','PAGO A PROVEEDORES','Financia el pago','a tus proveedores.'],
 ['og-preguntas-frecuentes','PREGUNTAS FRECUENTES','Conocer el proceso.','Decidir con claridad.']];
const fs=require('fs');const data=(f,t)=>`data:${t};base64,${fs.readFileSync(R+'/assets/'+f).toString('base64')}`;
const font=w=>`@font-face{font-family:'DM Sans';font-weight:${w};src:url(${data('dm-sans-'+w+'.woff2','font/woff2')}) format('woff2')}`;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1200,height:630}});
for(const [name,eyebrow,line,accent] of cards){
await p.setContent(`<style>${[400,500,600].map(font).join('')}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#fff;font-family:'DM Sans';color:#1b224e;position:relative;overflow:hidden}
.logo{position:absolute;left:80px;top:64px;height:52px}
.copy{position:absolute;left:80px;right:80px;top:190px}
.eyebrow{font-size:20px;font-weight:600;letter-spacing:.12em;color:#5d6470}
.eyebrow:before{content:"";display:inline-block;width:8px;height:8px;margin:0 14px 3px 0;border-radius:50%;background:#315de8}
h1{margin-top:26px;font-size:68px;font-weight:500;line-height:1.08;letter-spacing:-.035em;max-width:1040px}
h1 span{color:#315de8}
.foot{position:absolute;left:80px;right:80px;bottom:56px;padding-top:24px;border-top:1px solid #e4e7ee;display:flex;justify-content:space-between;font-size:20px;color:#5d6470}
</style><img class="logo" src="${data('centralia-horizontal-oficial.png','image/png')}"><div class="copy"><p class="eyebrow">${eyebrow}</p><h1>${line}<br><span>${accent}</span></h1></div>
<div class="foot"><span>Exclusivo para personas morales</span><span>centraliafinanciera.com</span></div>`,{waitUntil:'load'});
await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${R}/assets/${name}.png`});}
await b.close()})();
