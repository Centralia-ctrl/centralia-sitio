# Builds blog/index.html and one page per article from herramientas/blog-articulos/<slug>.html.
# Not part of the build. Run from the repository root: python3 herramientas/blog.py
# The header, footer, dialogs and scripts come from preguntas-frecuentes.html, so the blog
# always matches the rest of the site. To publish a new article: add its body file, add it to
# ARTICLES (newest first), run this script, add blog/<slug>.html to PAGES in build.cjs and to
# sitemap.xml, then run node build.cjs.
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://centraliafinanciera.com/'
MEETING = 'https://meetings.hubspot.com/miguelmeza1'
# Every guide is signed by its author. The bio states only confirmed facts.
AUTHOR = {'name': 'Miguel Ángel Meza Badillo', 'role': 'Director general',
          'bio': 'Director general de Centralia Financiera. Acompaña a empresas en México a encontrar, comparar y contratar financiamiento.'}

ARTICLES = [
    {
        'slug': 'estados-financieros-para-credito',
        'title': 'Estados financieros para un crédito | Centralia',
        'headline': 'Qué revisan en tus estados financieros al pedir un crédito',
        'h1': ('Qué revisan en tus estados financieros', 'al pedir un crédito.'),
        'crumb': 'Estados financieros para un crédito',
        'eyebrow': 'CRÉDITO EMPRESARIAL · GUÍA',
        'tag': 'Crédito empresarial · Guía',
        'description': 'Balance, estado de resultados y flujo: qué revisa una institución en tus estados financieros al pedir crédito y cómo prepararlos.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 5,
        'image': 'og-credito-empresarial.png',
    },
    {
        'slug': 'como-reducir-dias-de-cobranza',
        'title': 'Cómo reducir tus días de cobranza | Centralia',
        'headline': 'Cómo reducir tus días de cobranza y liberar efectivo',
        'h1': ('Cómo reducir tus días de cobranza', 'y liberar efectivo.'),
        'crumb': 'Reducir días de cobranza',
        'eyebrow': 'FINANZAS DE TU EMPRESA · GUÍA',
        'tag': 'Finanzas de tu empresa · Guía',
        'description': 'Cómo medir tus días de cobranza, acciones para cobrar antes sin perder clientes y qué hacer si tus clientes imponen plazos largos.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 5,
        'image': 'og-factoraje.png',
    },
    {
        'slug': 'flujo-de-efectivo-13-semanas',
        'title': 'Flujo de efectivo a 13 semanas | Centralia',
        'headline': 'Flujo de efectivo a 13 semanas: cómo proyectarlo',
        'h1': ('Flujo de efectivo a 13 semanas:', 'cómo proyectarlo.'),
        'crumb': 'Flujo de efectivo a 13 semanas',
        'eyebrow': 'FINANZAS DE TU EMPRESA · GUÍA',
        'tag': 'Finanzas de tu empresa · Guía',
        'description': 'Cómo armar una proyección de flujo de efectivo semana por semana, leer los faltantes y decidir a tiempo si necesitas financiamiento.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 5,
        'image': 'og-inicio.png',
    },
    {
        'slug': 'credito-simple-o-revolvente',
        'title': 'Crédito simple o revolvente | Centralia',
        'headline': 'Crédito simple o revolvente: cuál conviene a tu empresa',
        'h1': ('Crédito simple o revolvente:', 'cuál conviene a tu empresa.'),
        'crumb': 'Crédito simple o revolvente',
        'eyebrow': 'CRÉDITO EMPRESARIAL · GUÍA',
        'tag': 'Crédito empresarial · Guía',
        'description': 'Diferencias entre crédito simple y línea revolvente, cuándo conviene cada uno y qué preguntar antes de contratar.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 5,
        'image': 'og-credito-empresarial.png',
    },
    {
        'slug': 'que-es-el-aforo-en-factoraje',
        'title': 'Qué es el aforo en factoraje | Centralia',
        'headline': 'Qué es el aforo en factoraje y cuánto recibes',
        'h1': ('Qué es el aforo en factoraje', 'y cuánto recibes.'),
        'crumb': 'Aforo en factoraje',
        'eyebrow': 'FACTORAJE · GUÍA',
        'tag': 'Factoraje · Guía',
        'description': 'Qué es el aforo, cómo pasar del porcentaje anticipado al anticipo neto, qué pasa con el remanente y qué preguntar antes de contratar.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 4,
        'image': 'og-factoraje.png',
    },
    {
        'slug': 'factoraje-o-credito-empresarial',
        'title': 'Factoraje o crédito empresarial | Centralia',
        'headline': 'Factoraje o crédito empresarial: cómo elegir',
        'h1': ('Factoraje o crédito empresarial:', 'cómo elegir.'),
        'crumb': 'Factoraje o crédito empresarial',
        'eyebrow': 'GUÍA PARA ELEGIR',
        'tag': 'Guía para elegir',
        'description': 'Diferencias entre factoraje y crédito empresarial, cuándo conviene cada uno y cómo combinarlos según dónde se detiene tu dinero.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 5,
        'image': 'og-inicio.png',
    },
    {
        'slug': 'requisitos-para-factoraje',
        'title': 'Requisitos para factoraje | Centralia',
        'headline': 'Requisitos para factoraje: qué te piden',
        'h1': ('Requisitos para factoraje:', 'qué te piden.'),
        'crumb': 'Requisitos para factoraje',
        'eyebrow': 'FACTORAJE · GUÍA',
        'tag': 'Factoraje · Guía',
        'description': 'Lo que suele pedirse para factoraje: de tu empresa, de tus clientes y de las facturas, y qué hace que la revisión avance.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 4,
        'image': 'og-factoraje.png',
    },
    {
        'slug': 'factoraje-con-recurso-y-sin-recurso',
        'title': 'Factoraje con recurso y sin recurso | Centralia',
        'headline': 'Factoraje con recurso y sin recurso: diferencias',
        'h1': ('Factoraje con recurso', 'y sin recurso: diferencias.'),
        'crumb': 'Con recurso y sin recurso',
        'eyebrow': 'FACTORAJE · GUÍA',
        'tag': 'Factoraje · Guía',
        'description': 'Qué cambia entre factoraje con recurso y sin recurso, quién responde si tu cliente no paga y qué revisar en el contrato.',
        'date': '2026-10-27', 'date_text': '27 de octubre de 2026', 'minutes': 4,
        'image': 'og-factoraje.png',
    },
    {
        'slug': 'historial-crediticio-de-tu-empresa',
        'title': 'Historial crediticio de tu empresa | Centralia',
        'headline': 'Historial crediticio de tu empresa: qué revisan y cómo cuidarlo',
        'h1': ('Historial crediticio de tu empresa:', 'qué revisan y cómo cuidarlo.'),
        'crumb': 'Historial crediticio',
        'eyebrow': 'ANTES DE SOLICITAR · GUÍA',
        'tag': 'Antes de solicitar · Guía',
        'description': 'Qué muestra el historial crediticio de una empresa, cómo lo usa una institución al evaluar, qué pasa si no tienes historial y cómo cuidarlo.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 6,
        'image': 'og-inicio.png',
    },
    {
        'slug': 'opciones-de-financiamiento-para-pymes',
        'title': 'Opciones de financiamiento para PyMEs en México | Centralia',
        'headline': 'Opciones de financiamiento para PyMEs en México: guía para elegir',
        'h1': ('Opciones de financiamiento', 'para PyMEs en México.'),
        'crumb': 'Opciones de financiamiento para PyMEs',
        'eyebrow': 'GUÍA PRINCIPAL',
        'tag': 'Guía principal',
        'description': 'Crédito empresarial, factoraje, pago a proveedores y otras alternativas: qué financiamiento conviene a tu PyME según para qué necesitas el dinero.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 7,
        'image': 'og-inicio.png',
    },
    {
        'slug': 'como-comparar-propuestas-de-financiamiento',
        'title': 'Cómo comparar propuestas de financiamiento | Centralia',
        'headline': 'Cómo comparar propuestas de financiamiento para tu empresa',
        'h1': ('Cómo comparar propuestas', 'de financiamiento para tu empresa.'),
        'crumb': 'Cómo comparar propuestas',
        'eyebrow': 'ANTES DE CONTRATAR · GUÍA',
        'tag': 'Antes de contratar · Guía',
        'description': 'Monto neto, tasa, CAT, comisiones, calendario de pagos y garantías: qué revisar para comparar propuestas de financiamiento antes de firmar.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 6,
        'image': 'og-inicio.png',
    },
    {
        'slug': 'capital-de-trabajo',
        'title': 'Capital de trabajo: qué es y cuánto necesitas | Centralia',
        'headline': 'Capital de trabajo: qué es y cuánto necesita tu empresa',
        'h1': ('Capital de trabajo:', 'qué es y cuánto necesita tu empresa.'),
        'crumb': 'Capital de trabajo',
        'eyebrow': 'FINANZAS DE TU EMPRESA · GUÍA',
        'tag': 'Finanzas de tu empresa · Guía',
        'description': 'Qué es el capital de trabajo, cómo calcular tu ciclo de efectivo y cuánto necesitas, y qué financiamiento conviene según dónde se detiene tu dinero.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 6,
        'image': 'og-inicio.png',
    },
    {
        'slug': 'documentos-para-credito-empresarial',
        'title': 'Documentos para un crédito empresarial | Centralia',
        'headline': 'Qué documentos te piden para un crédito empresarial',
        'h1': ('Qué documentos te piden', 'para un crédito empresarial.'),
        'crumb': 'Documentos para un crédito empresarial',
        'eyebrow': 'CRÉDITO EMPRESARIAL · GUÍA',
        'tag': 'Crédito empresarial · Guía',
        'description': 'Los documentos que suelen pedirse para un crédito empresarial: de la empresa, del representante, financieros, de garantía o aval, y cómo prepararlos.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 5,
        'image': 'og-credito-empresarial.png',
    },
    {
        'slug': 'pago-a-proveedores-en-el-extranjero',
        'title': 'Pagos a proveedores en el extranjero | Centralia',
        'headline': 'Cómo financiar el pago a proveedores en el extranjero',
        'h1': ('Cómo financiar el pago', 'a proveedores en el extranjero.'),
        'crumb': 'Pago a proveedores en el extranjero',
        'eyebrow': 'PAGO A PROVEEDORES · GUÍA',
        'tag': 'Pago a proveedores · Guía',
        'description': 'Cómo financiar el pago a proveedores en el extranjero: qué revisar en una compra internacional, las tres fechas clave y qué preguntar antes de contratar.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 5,
        'image': 'og-pago-a-proveedores.png',
    },
    {
        'slug': 'credito-con-o-sin-garantia',
        'title': 'Crédito empresarial con o sin garantía | Centralia',
        'headline': 'Crédito empresarial con o sin garantía: diferencias y cómo elegir',
        'h1': ('Crédito con o sin garantía:', 'cuál conviene a tu empresa.'),
        'crumb': 'Crédito con o sin garantía',
        'eyebrow': 'CRÉDITO EMPRESARIAL · GUÍA',
        'tag': 'Crédito empresarial · Guía',
        'description': 'Qué es una garantía real, en qué se diferencian el crédito con y sin garantía, cómo elegir la modalidad para tu empresa y qué preguntar antes de contratar.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 5,
        'image': 'og-credito-empresarial.png',
    },
    {
        'slug': 'que-es-el-factoraje',
        'title': 'Qué es el factoraje y cuándo conviene | Centralia',
        'headline': 'Qué es el factoraje y cuándo le conviene a tu empresa',
        'h1': ('Qué es el factoraje', 'y cuándo le conviene a tu empresa.'),
        'crumb': 'Qué es el factoraje',
        'eyebrow': 'FACTORAJE · GUÍA',
        'tag': 'Factoraje · Guía',
        'description': 'Qué es el factoraje, cómo funciona paso a paso, cuándo conviene, la diferencia entre con y sin recurso y qué preguntar antes de contratar.',
        'date': '2026-10-26', 'date_text': '26 de octubre de 2026', 'minutes': 5,
        'image': 'og-factoraje.png',
    },
]

# Three related reads shown at the end of each article (internal links help readers and search engines).
RELATED = {
    'estados-financieros-para-credito': ['documentos-para-credito-empresarial', 'historial-crediticio-de-tu-empresa', 'credito-simple-o-revolvente'],
    'como-reducir-dias-de-cobranza': ['flujo-de-efectivo-13-semanas', 'que-es-el-factoraje', 'capital-de-trabajo'],
    'flujo-de-efectivo-13-semanas': ['capital-de-trabajo', 'como-reducir-dias-de-cobranza', 'opciones-de-financiamiento-para-pymes'],
    'credito-simple-o-revolvente': ['credito-con-o-sin-garantia', 'factoraje-o-credito-empresarial', 'como-comparar-propuestas-de-financiamiento'],
    'que-es-el-aforo-en-factoraje': ['que-es-el-factoraje', 'factoraje-con-recurso-y-sin-recurso', 'requisitos-para-factoraje'],
    'factoraje-o-credito-empresarial': ['que-es-el-factoraje', 'credito-simple-o-revolvente', 'opciones-de-financiamiento-para-pymes'],
    'requisitos-para-factoraje': ['que-es-el-aforo-en-factoraje', 'factoraje-con-recurso-y-sin-recurso', 'que-es-el-factoraje'],
    'factoraje-con-recurso-y-sin-recurso': ['que-es-el-factoraje', 'que-es-el-aforo-en-factoraje', 'requisitos-para-factoraje'],
    'historial-crediticio-de-tu-empresa': ['documentos-para-credito-empresarial', 'credito-con-o-sin-garantia', 'que-es-el-factoraje'],
    'opciones-de-financiamiento-para-pymes': ['credito-con-o-sin-garantia', 'que-es-el-factoraje', 'pago-a-proveedores-en-el-extranjero'],
    'como-comparar-propuestas-de-financiamiento': ['opciones-de-financiamiento-para-pymes', 'credito-con-o-sin-garantia', 'documentos-para-credito-empresarial'],
    'capital-de-trabajo': ['que-es-el-factoraje', 'pago-a-proveedores-en-el-extranjero', 'opciones-de-financiamiento-para-pymes'],
    'documentos-para-credito-empresarial': ['historial-crediticio-de-tu-empresa', 'credito-con-o-sin-garantia', 'como-comparar-propuestas-de-financiamiento'],
    'pago-a-proveedores-en-el-extranjero': ['capital-de-trabajo', 'que-es-el-factoraje', 'opciones-de-financiamiento-para-pymes'],
    'credito-con-o-sin-garantia': ['documentos-para-credito-empresarial', 'como-comparar-propuestas-de-financiamiento', 'opciones-de-financiamiento-para-pymes'],
    'que-es-el-factoraje': ['capital-de-trabajo', 'como-comparar-propuestas-de-financiamiento', 'opciones-de-financiamiento-para-pymes'],
}

# The blog index opens with the main guide; the rest keep the ARTICLES order (newest first).
INDEX_FIRST = 'opciones-de-financiamiento-para-pymes'

INDEX = {
    'title': 'Blog de financiamiento empresarial | Centralia Financiera',
    'description': 'Guías claras sobre crédito empresarial, factoraje y pago a proveedores para empresas en México.',
}

# Meeting block for the blog index. Articles close with their own contextual invitation instead.
CTA = ('<section class="product-meeting"><div><h2>Hablemos de tu empresa.</h2><p>30 minutos para revisar qué quieres '
       'financiar y en qué plazo.</p></div><a class="button button-dark" data-schedule href="' + MEETING + '" target="_blank" '
       'rel="noopener noreferrer">Agendemos una reunión <svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg></a></section>')


def crumb(items):
    return '<nav class="product-breadcrumb" aria-label="Ruta de navegación">' + '<span aria-hidden="true">/</span>'.join(items) + '</nav>'


def ld(graph):
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':'))


def page(tpl, path, title, description, image, og_type, graph, main):
    url = BASE + path
    s = tpl
    for pattern, value in [
        (r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{description}">'),
        (r'<meta property="og:type" content="[^"]*">', f'<meta property="og:type" content="{og_type}">'),
        (r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{title}">'),
        (r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{description}">'),
        (r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">'),
        (r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">'),
        (r'<title>[^<]*</title>', f'<title>{title}</title>'),
        (r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{BASE}assets/{image}">'),
    ]:
        s, n = re.subn(pattern, lambda m: value, s, count=1)
        assert n == 1, pattern
    s = re.sub(r'(<script type="application/ld\+json">).*?(</script>)', lambda m: m[1] + ld(graph) + m[2], s, count=1, flags=re.S)
    s = re.sub(r'<main id="contenido".*?</main>', lambda m: main, s, count=1, flags=re.S)
    s = s.replace(' aria-current="page"', '')

    # Pages live in blog/: template URLs climb one level; links written for the blog stay local.
    def fix(m):
        attr, quote, value = m.group(1), m.group(2), m.group(3)
        if re.match(r'(?:[a-z]+:|//|/|#|data:|\.\./|\./)', value, re.I) or value.endswith('.html') and value[:-5] in SLUGS:
            return m.group(0)
        return f'{attr}={quote}../{value}{quote}'
    s = re.sub(r'\b(src|href|poster)=(["\'])([^"\']*)\2', fix, s)
    # RSS feed for readers and aggregators; added after the path fix because it lives in blog/.
    s = s.replace('</head>', '<link rel="alternate" type="application/rss+xml" title="Blog de Centralia Financiera" href="feed.xml">\n</head>', 1)
    # The header marks the blog as the current section.
    for a in ('<a href="../blog/">Blog</a></nav>', '<a href="../blog/">Blog <span>03</span></a>'):
        assert s.count(a) == 1, a
        s = s.replace(a, a.replace('href="../blog/"', 'href="./" aria-current="page"'))
    return s


SLUGS = {a['slug'] for a in ARTICLES}
BY_SLUG = {a['slug']: a for a in ARTICLES}


def related(slug):
    items = ''.join(f'<li><a href="{r}.html"><strong>{BY_SLUG[r]["headline"]}</strong><span>{BY_SLUG[r]["tag"]}</span></a></li>' for r in RELATED[slug])
    return ('<section class="product-section related-guides" aria-labelledby="related-guides-title"><div><p class="eyebrow">SIGUE LEYENDO</p>'
            '<h2 id="related-guides-title">Más guías<br>para tu empresa.</h2><a class="product-text-link" href="./">Ver todas las guías</a></div>'
            f'<ul class="related-guides-list">{items}</ul></section>')


def feed():
    import datetime
    esc = lambda t: t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    def rfc822(d):
        x = datetime.date.fromisoformat(d)
        return f'{days[x.weekday()]}, {x.day:02d} {months[x.month - 1]} {x.year} 12:00:00 -0600'
    items = ''.join(f'<item><title>{esc(a["headline"])}</title><link>{BASE}blog/{a["slug"]}.html</link>'
                    f'<guid isPermaLink="true">{BASE}blog/{a["slug"]}.html</guid><pubDate>{rfc822(a["date"])}</pubDate>'
                    f'<description>{esc(a["description"])}</description></item>' for a in ARTICLES)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Blog de Centralia Financiera</title>'
            f'<link>{BASE}blog/</link><description>{esc(INDEX["description"])}</description><language>es-MX</language>{items}</channel></rss>\n')


def main():
    tpl = open(os.path.join(ROOT, 'preguntas-frecuentes.html'), encoding='utf-8', newline='').read()
    blog_url = BASE + 'blog/'
    org = {'@type': 'Organization', '@id': BASE + '#organizacion', 'name': 'Centralia Financiera', 'url': BASE,
           'logo': {'@type': 'ImageObject', 'url': BASE + 'assets/centralia-logo.png'}}
    os.makedirs(os.path.join(ROOT, 'blog'), exist_ok=True)
    cards = []
    for a in ARTICLES:
        url = blog_url + a['slug'] + '.html'
        body = open(os.path.join(ROOT, 'herramientas', 'blog-articulos', a['slug'] + '.html'), encoding='utf-8').read()
        main_html = ('<main id="contenido" class="product-page direction-faq blog-page"><div class="shell">'
                     + crumb(['<a href="../index.html">Inicio</a>', '<a href="./">Blog</a>', f'<span aria-current="page">{a["crumb"]}</span>'])
                     + f'<article class="blog-article"><header class="company-intro blog-header"><p class="eyebrow">{a["eyebrow"]}</p>'
                     + f'<h1>{a["h1"][0]}<br><span>{a["h1"][1]}</span></h1><p class="blog-meta">Por {AUTHOR["name"]}, {AUTHOR["role"].lower()} · <time datetime="{a["date"]}">{a["date_text"]}</time>'
                     + f' · Lectura de {a["minutes"]} minutos</p></header><div class="blog-body">' + body
                     + f'<aside class="blog-author" aria-label="Autor"><p class="blog-author-name">{AUTHOR["name"]}</p><p>{AUTHOR["bio"]}</p></aside></div></article>' + related(a['slug']) + '</div></main>')
        graph = [
            {'@type': 'BlogPosting', '@id': url + '#articulo', 'headline': a['headline'], 'description': a['description'],
             'inLanguage': 'es-MX', 'datePublished': a['date'], 'dateModified': a['date'], 'url': url, 'mainEntityOfPage': url,
             'image': BASE + 'assets/' + a['image'], 'author': {'@type': 'Person', 'name': AUTHOR['name'], 'jobTitle': AUTHOR['role'], 'worksFor': {'@id': BASE + '#organizacion'}},
             'publisher': org, 'isPartOf': {'@id': blog_url + '#blog'}},
            {'@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': BASE},
                {'@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': blog_url},
                {'@type': 'ListItem', 'position': 3, 'name': a['crumb'], 'item': url}]},
        ]
        html = page(tpl, 'blog/' + a['slug'] + '.html', a['title'], a['description'], a['image'], 'article', graph, main_html)
        html = html.replace('<meta name="description"', f'<meta name="author" content="{AUTHOR["name"]}">\n  <meta name="description"', 1)
        open(os.path.join(ROOT, 'blog', a['slug'] + '.html'), 'w', encoding='utf-8', newline='').write(html)
        cards.append((a['slug'] != INDEX_FIRST, f'<li><a class="blog-card" href="{a["slug"]}.html"><span class="blog-card-tag">{a["tag"]}</span>'
                     f'<span class="blog-card-title">{a["headline"]}</span><span class="blog-card-text">{a["description"]}</span>'
                     f'<span class="blog-card-meta"><time datetime="{a["date"]}">{a["date_text"]}</time> · {a["minutes"]} min</span></a></li>'))
        print('blog/' + a['slug'] + '.html')
    index_main = ('<main id="contenido" class="product-page direction-faq blog-page"><div class="shell">'
                  + crumb(['<a href="../index.html">Inicio</a>', '<span aria-current="page">Blog</span>'])
                  + '<header class="company-intro"><p class="eyebrow">BLOG</p><h1>Financiamiento empresarial,<br><span>explicado con claridad.</span></h1>'
                  + '<p>Guías para entender tus opciones antes de la primera conversación.</p></header>'
                  + '<ul class="blog-index">' + ''.join(c for _, c in sorted(cards, key=lambda c: c[0])) + '</ul>' + CTA + '</div></main>')
    graph = [
        {'@type': 'Blog', '@id': blog_url + '#blog', 'name': 'Blog de Centralia Financiera', 'url': blog_url, 'inLanguage': 'es-MX',
         'description': INDEX['description'], 'publisher': {'@id': BASE + '#organizacion'},
         'blogPost': [{'@id': blog_url + a['slug'] + '.html#articulo'} for a in ARTICLES]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': blog_url}]},
    ]
    html = page(tpl, 'blog/', INDEX['title'], INDEX['description'], 'og-inicio.png', 'website', graph, index_main)
    open(os.path.join(ROOT, 'blog', 'index.html'), 'w', encoding='utf-8', newline='').write(html)
    print('blog/index.html')
    open(os.path.join(ROOT, 'blog', 'feed.xml'), 'w', encoding='utf-8', newline='').write(feed())
    print('blog/feed.xml')


if __name__ == '__main__':
    main()
