#!/usr/bin/env node
// Verificación del cambio de dominio. No envía formularios ni modifica nada: solo hace solicitudes GET/HEAD.
//
// Uso el día del cambio:   node herramientas/verificar-dominio.cjs
// Ensayo antes del cambio: node herramientas/verificar-dominio.cjs https://centralia-sitio.netlify.app
//
// Con el dominio real revisa también www, http y las redirecciones del sitio anterior.
// En el ensayo solo revisa lo que no depende del DNS: páginas, canónicas, noindex e imágenes para redes.
'use strict';
const fs = require('fs'), path = require('path');

const DOMINIO = 'https://centraliafinanciera.com';
const base = (process.argv[2] || DOMINIO).replace(/\/$/, '');
const real = base === DOMINIO;
const raiz = path.join(__dirname, '..');
let fallas = 0, avisos = 0;

const ok = m => console.log('  ✓ ' + m);
const mal = m => { fallas++; console.log('  ✗ ' + m); };
const aviso = m => { avisos++; console.log('  ! ' + m); };
const enBase = url => url.replace(DOMINIO, base);

async function pedir(url, opciones = {}) {
  try {
    return await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'centralia-verificacion/1.0' }, ...opciones });
  } catch (e) {
    return { status: 0, error: e.cause?.code || e.message, headers: new Headers(), text: async () => '' };
  }
}

async function paginas() {
  console.log('\n1. Páginas del sitemap');
  const r = await pedir(base + '/sitemap.xml');
  if (r.status !== 200) return mal(`sitemap.xml respondió ${r.status || r.error}`);
  const urls = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  const locales = fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8').match(/<loc>/g).length;
  urls.length === locales ? ok(`sitemap con ${urls.length} páginas, igual que el del repositorio`)
    : mal(`el sitemap publicado tiene ${urls.length} páginas y el del repositorio ${locales}`);
  if (urls.some(u => !u.startsWith(DOMINIO + '/'))) mal('hay direcciones del sitemap fuera de ' + DOMINIO);

  const imagenes = new Set();
  for (const url of urls) {
    const res = await pedir(enBase(url));
    const ruta = url.replace(DOMINIO, '') || '/';
    if (res.status !== 200) { mal(`${ruta} respondió ${res.status || res.error}`); continue; }
    const html = await res.text();
    const canon = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/) || [])[1];
    const robots = (html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/) || [])[1] || '';
    const problemas = [];
    if (canon !== url) problemas.push(`canónica ${canon || 'ausente'}`);
    if (/noindex/i.test(robots)) problemas.push('tiene noindex');
    if ((html.match(/<h1[\s>]/g) || []).length !== 1) problemas.push('no tiene exactamente un H1');
    for (const m of html.matchAll(/<meta[^>]+(?:property="og:image"|name="twitter:image")[^>]+content="([^"]+)"/g)) imagenes.add(m[1]);
    problemas.length ? mal(`${ruta}: ${problemas.join('; ')}`) : ok(ruta);
  }

  console.log('\n2. Imágenes para compartir en redes');
  for (const img of imagenes) {
    const res = await pedir(enBase(img), { method: 'HEAD' });
    const tipo = res.headers.get('content-type') || '';
    res.status === 200 && tipo.startsWith('image/') ? ok(img.replace(DOMINIO, ''))
      : mal(`${img} respondió ${res.status || res.error} (${tipo || 'sin tipo'})`);
  }
  if (!real) aviso('En el ensayo, og:image apunta a ' + DOMINIO + '; se comprobó el mismo archivo en ' + base + '.');
}

async function robots() {
  console.log('\n3. robots.txt');
  const r = await pedir(base + '/robots.txt');
  const t = r.status === 200 ? await r.text() : '';
  if (r.status !== 200) return mal(`robots.txt respondió ${r.status || r.error}`);
  /Disallow:\s*\/\s*$/m.test(t) ? mal('robots.txt bloquea todo el sitio') : ok('no bloquea el sitio');
  t.includes(`Sitemap: ${DOMINIO}/sitemap.xml`) ? ok('declara el sitemap') : mal('no declara el sitemap del dominio');
}

async function aviso_privacidad() {
  console.log('\n4. Aviso de privacidad');
  const r = await pedir(base + '/aviso-de-privacidad/');
  if (r.status !== 200) return mal(`/aviso-de-privacidad/ respondió ${r.status || r.error}: los formularios enlazan ahí`);
  const html = await r.text();
  /noindex|Borrador en revisión legal/i.test(html) ? mal('/aviso-de-privacidad/ sigue como borrador') : ok('/aviso-de-privacidad/ publicado');
}

async function redirecciones() {
  console.log('\n5. Dominio y redirecciones del sitio anterior');
  if (!real) return aviso('Se omite: solo aplica en ' + DOMINIO + ' después del cambio de DNS.');
  const destino = async (url, esperado) => {
    const r = await pedir(url);
    const loc = r.headers.get('location') || '';
    const final = new URL(loc || url, url).href;
    [301, 308].includes(r.status) && final === esperado ? ok(`${url} → ${esperado}`)
      : mal(`${url} respondió ${r.status || r.error}${loc ? ' hacia ' + loc : ''}; se esperaba 301 hacia ${esperado}`);
  };
  await destino('http://centraliafinanciera.com/', DOMINIO + '/');
  await destino('https://www.centraliafinanciera.com/', DOMINIO + '/');
  await destino('http://www.centraliafinanciera.com/', DOMINIO + '/');
  for (const linea of fs.readFileSync(path.join(raiz, '_redirects'), 'utf8').split(/\r?\n/)) {
    const [desde, hacia, codigo] = linea.trim().split(/\s+/);
    if (!desde || desde.startsWith('#') || codigo !== '301') continue;
    await destino(DOMINIO + desde.replace('*', 'prueba'), DOMINIO + hacia);
  }
}

(async () => {
  console.log(`Verificación de ${base}${real ? '' : ' (ensayo)'}`);
  await paginas();
  await robots();
  await aviso_privacidad();
  await redirecciones();
  console.log(`\nResultado: ${fallas} fallas, ${avisos} avisos.`);
  process.exit(fallas ? 1 : 0);
})();
