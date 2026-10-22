// Run node build.cjs after editing source styles. No dependencies required.
// 1) Rebuilds site.css from the source layers.
// 2) Copies to dist/ ONLY the public pages and the files they actually use.
//    Studies, samples and unused originals stay in the repository but are never published.
const fs=require('fs'),path=require('path');
const root=__dirname;
// Preserve the relative order of every page's former style chain.
// Only current source layers are bundled. Historical palette studies stay outside.
const files=["styles.css","refinements.css","simulator.css","institutional.css","section-layout.css","inline-overrides.css","solutions-redesign.css","navigation-dropdown.css","product-pages.css","audit-fixes.css","company-page.css","brand-direction.css","visual-system.css","business-video.css","factoraje-film.css","solution-film.css","product-illustrations-v10.css","content-direction-v14.css","launch-readiness-v15.css","lead-capture-v17.css","home-products-v19.css","editorial-v23.css","release-v24.css","consent.css"];
fs.writeFileSync(path.join(root,'site.css'),files.map(f=>'/* '+f+' */\n'+fs.readFileSync(path.join(root,f),'utf8')).join('\n'));
console.log('site.css rebuilt');

// Public pages. Add a page here only when it is approved for publication.
const PAGES=['index.html','credito-empresarial.html','factoraje.html','pago-a-proveedores.html','preguntas-frecuentes.html'];
const ALWAYS=['_headers','robots.txt','sitemap.xml','assets/vendor/three/LICENSE','assets/DM-Sans-OFL.txt'];
const dist=path.join(root,'dist');
fs.rmSync(dist,{recursive:true,force:true});

const seen=new Set(),missing=new Set();
const local=ref=>{
  if(!ref)return null;
  ref=ref.trim().split('#')[0].split('?')[0];
  if(!ref||/^(?:[a-z]+:|\/\/|data:|#)/i.test(ref))return null;
  return ref;
};
function refsOf(file,text){
  const out=[],ext=path.extname(file);
  const add=r=>{const l=local(r);if(l)out.push(path.posix.normalize(path.posix.join(path.posix.dirname(file),l)));};
  if(ext==='.html'){
    for(const m of text.matchAll(/\b(?:src|href|poster|content)\s*=\s*["']([^"']+)["']/g))add(m[1]);
    for(const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/g))m[1].split(',').forEach(s=>add(s.trim().split(/\s+/)[0]));
  }
  if(ext==='.html'||ext==='.css')for(const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))add(m[1]);
  if(ext==='.js'||ext==='.mjs'||ext==='.html'){
    for(const m of text.matchAll(/(?:import|export)[^'"`;]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g))add(m[1]||m[2]);
    // Plain string paths to local files used by scripts (videos, posters, images).
    for(const m of text.matchAll(/["'`]((?:\.\/)?(?:assets\/)?[\w./-]+\.(?:mp4|webm|jpg|jpeg|png|webp|svg|woff2|js|css|json))["'`]/g))add(m[1]);
  }
  return out;
}
function visit(rel){
  if(seen.has(rel))return;
  const abs=path.join(root,rel);
  if(!fs.existsSync(abs)||!fs.statSync(abs).isFile()){missing.add(rel);return;}
  seen.add(rel);
  if(/\.(html|css|js|mjs)$/.test(rel))refsOf(rel,fs.readFileSync(abs,'utf8')).forEach(visit);
}
PAGES.concat(ALWAYS).forEach(visit);
// Ignore matches that are not real files (e.g. content="..." text, page anchors).
for(const rel of seen){
  const to=path.join(dist,rel);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(path.join(root,rel),to);
}
const bytes=[...seen].reduce((t,r)=>t+fs.statSync(path.join(root,r)).size,0);
console.log(`dist/ ready: ${seen.size} files, ${(bytes/1048576).toFixed(1)} MB`);
const realMissing=[...missing].filter(r=>/\.(html|css|js|mjs|mp4|webm|jpg|jpeg|png|webp|svg|woff2|txt|xml)$/.test(r));
if(realMissing.length)console.log('Referenced but not found:\n  '+realMissing.join('\n  '));
