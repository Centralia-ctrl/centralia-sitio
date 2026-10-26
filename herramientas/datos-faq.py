# Rebuilds the FAQPage structured data of each page from its visible questions and answers.
# Not part of the build. Run from the repository root after editing any FAQ: python3 herramientas/datos-faq.py
import re, json, html, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://centraliafinanciera.com/'
text = lambda h: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()


def faq_entity(s, url):
    items = re.findall(r'<details class="answer-item"[^>]*><summary>(.*?)<span class="faq-indicator".*?</summary>(.*?)</details>', s, re.S)
    assert items, url
    return {'@type': 'FAQPage', '@id': url + '#preguntas', 'url': url, 'inLanguage': 'es-MX',
            'mainEntity': [{'@type': 'Question', 'name': text(q), 'acceptedAnswer': {'@type': 'Answer', 'text': text(a)}} for q, a in items]}


def add_to_graph(s, entity):
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S)
    data = json.loads(m[2])
    if '@graph' not in data:
        ctx = data.pop('@context')
        data = {'@context': ctx, '@graph': [data]}
    data['@graph'] = [g for g in data['@graph'] if g.get('@type') != 'FAQPage'] + [entity]
    return s[:m.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + s[m.end(2):]


def edit(path, fn):
    p = os.path.join(ROOT, path)
    s = open(p, encoding='utf-8', newline='').read()
    out = fn(s)
    open(p, 'w', encoding='utf-8', newline='').write(out)
    print('ok', path)


# FAQ structured data, built from the questions and answers already visible on each page.
for path, url in [('preguntas-frecuentes.html', BASE + 'preguntas-frecuentes.html'), ('index.html', BASE),
                  ('credito-empresarial.html', BASE + 'credito-empresarial.html'), ('factoraje.html', BASE + 'factoraje.html'),
                  ('pago-a-proveedores.html', BASE + 'pago-a-proveedores.html')]:
    edit(path, lambda s, url=url: add_to_graph(s, faq_entity(s, url)))

