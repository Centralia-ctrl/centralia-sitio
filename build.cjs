// Run node build.cjs after editing source styles. No dependencies required.
const fs=require('fs'),path=require('path');
// Preserve the relative order of every page's former style chain.
// Only current source layers are bundled. Historical palette studies stay outside.
const files=["styles.css","refinements.css","simulator.css","institutional.css","section-layout.css","inline-overrides.css","solutions-redesign.css","navigation-dropdown.css","product-pages.css","audit-fixes.css","company-page.css","brand-direction.css","visual-system.css","business-video.css","factoraje-film.css","solution-film.css","product-illustrations-v10.css","content-direction-v14.css","launch-readiness-v15.css","lead-capture-v17.css","home-products-v19.css","editorial-v23.css","release-v24.css"];
fs.writeFileSync(path.join(__dirname,'site.css'),files.map(f=>'/* '+f+' */\n'+fs.readFileSync(path.join(__dirname,f),'utf8')).join('\n'));
console.log('site.css rebuilt');
