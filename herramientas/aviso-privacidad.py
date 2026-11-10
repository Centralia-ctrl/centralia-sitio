"""Genera aviso-de-privacidad/index.html desde la plantilla de preguntas-frecuentes.html.

La página vive en /aviso-de-privacidad/, la misma dirección que ya usan los formularios, el aviso de
cookies (consent.js) y el simulador, así que al cambiar el dominio esas ligas siguen funcionando.
El cuerpo está en herramientas/aviso-privacidad-cuerpo.html. Mientras PENDIENTE sea True la página
lleva noindex y un aviso de borrador; no se agrega a PAGES en build.cjs ni a sitemap.xml hasta que
el texto legal esté aprobado.

Uso: python3 herramientas/aviso-privacidad.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://centraliafinanciera.com/'
PATH = 'aviso-de-privacidad/'
PENDIENTE = True
TITLE = 'Aviso de privacidad | Centralia Financiera'
DESCRIPTION = 'Aviso de privacidad de Centralia Financiera: responsable, datos que recabamos, finalidades y cómo ejercer tus derechos sobre tus datos personales.'


def main():
    tpl = open(os.path.join(ROOT, 'preguntas-frecuentes.html'), encoding='utf-8', newline='').read()
    body = open(os.path.join(ROOT, 'herramientas', 'aviso-privacidad-cuerpo.html'), encoding='utf-8').read()
    body = re.sub(r'<!--.*?-->\s*', '', body, flags=re.S).strip()
    url = BASE + PATH
    s = tpl
    for pattern, value in [
        (r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESCRIPTION}">'),
        (r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{TITLE}">'),
        (r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{DESCRIPTION}">'),
        (r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">'),
        (r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">'),
        (r'<title>[^<]*</title>', f'<title>{TITLE}</title>'),
        (r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{BASE}assets/og-inicio.png">'),
    ]:
        s, n = re.subn(pattern, lambda m: value, s, count=1)
        assert n == 1, pattern
    graph = [
        {'@type': 'WebPage', '@id': url + '#pagina', 'url': url, 'name': TITLE, 'inLanguage': 'es-MX', 'description': DESCRIPTION},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Aviso de privacidad', 'item': url}]},
    ]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':'))
    s = re.sub(r'(<script type="application/ld\+json">).*?(</script>)', lambda m: m[1] + ld + m[2], s, count=1, flags=re.S)
    borrador = ('<p class="aviso-borrador" role="note">Borrador en revisión legal. Esta página todavía no está publicada.</p>'
                if PENDIENTE else '')
    main_html = (
        '<main id="contenido" class="product-page direction-faq blog-page aviso-page"><div class="shell">'
        '<nav class="product-breadcrumb" aria-label="Ruta de navegación"><a href="../index.html">Inicio</a>'
        '<span aria-hidden="true">/</span><span>Aviso de privacidad</span></nav>'
        '<article class="blog-article"><header class="company-intro blog-header"><p class="eyebrow">CENTRALIA FINANCIERA</p>'
        '<h1>Aviso de privacidad.</h1></header>'
        f'<div class="blog-body">{borrador}{body}</div></article></div></main>')
    s = re.sub(r'<main id="contenido".*?</main>', lambda m: main_html, s, count=1, flags=re.S)
    s = s.replace(' aria-current="page"', '')
    if PENDIENTE:
        s = s.replace('<meta name="description"', '<meta name="robots" content="noindex, nofollow">\n  <meta name="description"', 1)

    # The page lives one folder down: template URLs climb one level.
    def fix(m):
        attr, quote, value = m.group(1), m.group(2), m.group(3)
        if re.match(r'(?:[a-z]+:|//|/|#|data:|\.\./|\./)', value, re.I):
            return m.group(0)
        return f'{attr}={quote}../{value}{quote}'
    s = re.sub(r'\b(src|href|poster)=(["\'])([^"\']*)\2', fix, s)
    os.makedirs(os.path.join(ROOT, PATH), exist_ok=True)
    with open(os.path.join(ROOT, PATH, 'index.html'), 'w', encoding='utf-8', newline='') as f:
        f.write(s)
    print('aviso-de-privacidad/index.html', 'borrador' if PENDIENTE else 'final')


if __name__ == '__main__':
    main()
