# Centralia Financiera · Sitio web

Sitio estático de Centralia Financiera, intermediario de financiamiento para PyMEs (personas morales) en México.
Lanzamiento: lanzamiento suave del 10 al 15 de diciembre de 2026 y arranque comercial en la segunda semana de enero de 2027.
Dueño y quien aprueba todo: Miguel Ángel Meza Badillo. Escríbele en español, en forma directa y breve.

## Antes de cualquier cambio

1. Lee `INSTRUCCIONES-PARA-CHATGPT.md`, que tiene el estado y las reglas. Las Partes C (reglas) y E (publicación) son obligatorias.
2. Un tema por rama y por pull request. Nunca trabajes directo en `main`.
3. Ejecuta `node build.cjs` antes de abrir el pull request y confirma que no aparece "Referenced but not found".
4. En la descripción del pull request indica qué archivos cambiaste, cómo lo verificaste y qué quedó pendiente.

## Cómo se publica

- Netlify ejecuta `node build.cjs` y publica solo `dist/`. `dist/` no se versiona (`.gitignore`).
- Páginas públicas: las 5 principales (`index.html`, `credito-empresarial.html`, `factoraje.html`, `pago-a-proveedores.html` y `preguntas-frecuentes.html`) y el blog (`blog/index.html` y 8 artículos). Para publicar otra, agrégala a `PAGES` en `build.cjs`, y solo con aprobación de Miguel Ángel.
- `site.css` se genera desde las capas de estilo listadas en `build.cjs`. No lo edites a mano: edita la capa y vuelve a construir.
- Las muestras, los estudios y los recursos originales (`muestra-*`, `por-que-centralia.html`, los videos de prueba de factoraje y otros) se quedan en el repositorio como referencia. No los borres y no los publiques.
- Blog en `blog/` (aprobado por Miguel Ángel). Sus páginas se generan con `python3 herramientas/blog.py` desde `herramientas/blog-articulos/<slug>.html` y la plantilla de `preguntas-frecuentes.html`. No las edites a mano. Para publicar un artículo: agrega su cuerpo y sus datos en `ARTICLES`, ejecuta el script, agrega la página a `PAGES` en `build.cjs` y a `sitemap.xml`, y ejecuta `node build.cjs`. Cada artículo sigue las reglas del sitio: sin instituciones ni cifras no confirmadas.
- Datos estructurados de preguntas frecuentes (`FAQPage`) en la portada, las páginas de producto y Preguntas frecuentes. Se generan desde las preguntas visibles con `python3 herramientas/datos-faq.py`; ejecútalo cada vez que cambie una pregunta o respuesta.
- Las páginas de producto tienen una sección "Guías" con tres artículos del blog, y cada artículo cierra con "Sigue leyendo" (`RELATED` en `herramientas/blog.py`). El blog publica `blog/feed.xml` (RSS).
- La vista previa es https://centralia-sitio.netlify.app. Es privada y requiere la cuenta de Netlify de Miguel Ángel.

## Reglas que no se negocian

- No uses la palabra "broker".
- No menciones fondeadores ni instituciones.
- No inventes cifras, testimonios, certificaciones, alianzas ni garantías.
- "Más de 10 años" y "$4,500 millones de pesos colocados" son datos confirmados, pero no auditados.
- Conserva el diseño y las animaciones aprobados. Cualquier cambio visual va con vista previa y aprobación.
- Paleta: navy `#1b224e`, azul `#315de8` (solo para la acción principal), hover `#254bc6`, texto `#303647`, secundario `#5d6470` y líneas `#e4e7ee`.
- Factoraje es la referencia de las animaciones: fondo blanco, sin sonido, sin logo dentro y texto en HTML.
- Nunca subas contraseñas, tokens ni claves de API.
- No envíes formularios reales a HubSpot durante las pruebas.

## Medición y formularios

- `pixel.js` (Meta Pixel 1375879946116372 y HubSpot 9145352) está cargado en todas las páginas, incluido el blog, y **apagado** (`enabled: false`). No lo actives sin instrucción.
- `consent.js` (aviso de cookies con opciones separadas de analítica y marketing) también está cargado en todas las páginas y **apagado**. Dispara `centralia:measurement-consent`. Se ve en modo de vista previa, sin guardar nada, con `?vista=cookies` en cualquier página.
- Para activar la medición hace falta: poner `enabled: true` en `consent.js` y en `pixel.js`, y agregar los dominios de Meta y HubSpot tanto en `_headers` como en la `<meta http-equiv="Content-Security-Policy">` de cada página.
- Formularios de HubSpot (cuenta 9145352):
  - Portada: `lead-capture-v17.js`, formulario "Centralia · Formulario web" (`68d091a6-…`). Envía `firstname`, `company`, `email`, `phone`, `cul_es_el_monto_que_requiere_tu_empresa` y `para_que_necesitas_el_financiamiento`.
  - Simulador: `simulator.js`, formulario "Centralia PYME · Simulación y cotización" (`1da292ee-…`). Envía `firstname`, `company`, `email`, `phone` y `message`.
  - No cambies los endpoints.
  - Los dos formularios avisan por correo a hola@centraliafinanciera.com.
  - El 26 de octubre de 2026 se descartó el borrador sin publicar del formulario del simulador; los dos formularios quedan igual que lo que envía el sitio.
  - La agenda "Meetings Link: miguelmeza1" la usa el botón "Agendemos una reunión" en todas las páginas: no la borres.
  - Limpieza de lo anterior (decisión de Miguel Ángel: nada del pasado):
    - "Hey Negocios" ya no existe.
    - "blog Comment Form" no se puede borrar sin borrar el blog de HubSpot; no afecta al sitio.
    - Las 52 reuniones de 2021 a 2026 (hipotecario y seguros) siguen ahí; su borrado es permanente y lo decide Miguel Ángel, exportando antes un respaldo.
    - Los contactos eliminados no se restauran.
- HubSpot es un plan gratuito: no permite embudos adicionales ni flujos de trabajo. El embudo de negocios predeterminado se renombró a "Financiamiento PyME", con las etapas Consulta recibida (10%) → Primera reunión (20%) → Documentación (40%) → En evaluación (60%) → Propuesta enviada (80%) → Contratado (100%) / Perdido (0%). Los negocios no se crean solos con cada formulario.

## Cola de trabajo (en orden)

1. **Video del almacén:** Miguel Ángel comprará la licencia para quitar la marca de agua; el video se queda en la portada (PR #8 cerrado). Cuando llegue el archivo licenciado, optimízalo igual que el de Factoraje y reemplaza también su póster.

## Terminado (no rehacer)

- **Factoraje optimizado** (PR #4).
  - `factoraje.html` usa:
    - `centralia-factoraje-artwork-loop-opt.mp4` (273 KB).
    - `centralia-factoraje-artwork-loop-mobile.mp4` (114 KB, para pantallas de hasta 760 px).
    - `centralia-factoraje-artwork-poster.webp` (47 KB).
  - Los originales se conservan en `assets/`.
- **Botón principal de la portada visible desde el primer instante** (PR #5). En `release-v24.css` se quitó solo la animación de entrada de `.hero-cta`; las demás animaciones siguen.
- **Legibilidad** (PR #6).
  - En `release-v24.css`, las etiquetas quedaron en mínimo 12 px y el texto de lectura en mínimo 13 px. Ningún texto se redujo.
  - Los números 01, 02 y 03 de la portada usan `#5d6470` (5.96:1).
- **Texto de lectura en computadora a 16 px** (PR #13). Solo desde 1101 px, en `release-v24.css`. Las notas, métricas y avisos legales conservan su tamaño.
- **Titular de Pago a proveedores** (PR #12): "Tus compras, pagadas a tiempo." Sustituyó a "Tu siguiente compra pone todo en marcha."
- **Imágenes para compartir en redes** (PR #11).
  - `assets/og-*.png`, de 1200×630, una por página, con `twitter:card` `summary_large_image`.
  - Están en `ALWAYS` de `build.cjs`, porque `og:image` usa URL absoluta.
  - Si cambia un titular, regenera las imágenes con `herramientas/og-imagenes.cjs`.
- **Aviso de cookies apagado** (PR #9): `consent.js` y la capa `consent.css`. Ver "Medición y formularios".
- **Lista de verificación para el lanzamiento** (PR #14): `LANZAMIENTO.md`. No se publica.
- **Plazo de 36 meses en el simulador** (PR #16). Tasa ilustrativa de 2% mensual confirmada.
- **Empresa en el formulario de la portada** (PR #17). Campo obligatorio junto a Nombre, enviado como `company`.

- **SEO técnico** (PR #19): datos estructurados `Service` y `BreadcrumbList`, logo WebP de 600 px, íconos cuadrados del símbolo y `centralia-logo.png` en `ALWAYS`.
- **Blog** (PR #20 a #28): portada y 8 artículos, "Blog" en el menú y en el pie, y generador en `herramientas/blog.py`.
- **SEO completo** (PR #27): `FAQPage` desde las preguntas visibles, sección "Guías" en las páginas de producto, "Sigue leyendo" en los artículos, RSS y `lastmod` en el sitemap.
- **Revisión completa** (PR #29):
  - 844 ligas internas sin errores, sitemap igual a las páginas publicadas y sin desbordes de 320 a 1920 px.
  - Accesibilidad WCAG 2.1 AA (axe) sin violaciones: se corrigieron el contraste del menú vacío del formulario y el subrayado de la liga del aviso de privacidad.
  - Títulos de hasta 60 caracteres y descripciones de hasta 155 en el blog.

- **Acabado de marca** (PR #33, inspirado en la referencia de Brex del PR #32): redondeo único de 12 px, superficies sin sombra y franja navy `#1b224e` de borde a borde en la parte inferior del pie (derechos y avisos legales) en todas las páginas; arriba, contacto y redes quedan en blanco. Está al final de `release-v24.css`. Preguntas frecuentes de la portada sigue en blanco.

## Decidido no hacer

- Página 404 propia (PR #10 cerrado).

## En espera (no hacer sin instrucción)

- Aviso de privacidad: se hará cuando se constituya la persona moral.
- Razón social y símbolo ®.
- Cifras y condiciones. Ya confirmado por Miguel Ángel: tasa ilustrativa del simulador de 2% mensual y plazo máximo de 36 meses (el simulador ofrece 12, 18, 24, 30 y 36).
- Formulario único de HubSpot.
- Mensaje de éxito y tiempo de respuesta.
- Simulador arriba de $15 M.
- Nuevas animaciones de Crédito y Pago a proveedores.
- Titulares de Crédito empresarial y Factoraje: sin cambios pedidos.
- Activación de la medición.
- Redirecciones del sitio anterior: en `_redirects` (PR #31). El WordPress solo tenía Inicio, Aviso de privacidad y Educación financiera (→ `/blog/`). Falta confirmar la dirección exacta de Educación financiera.
- **Aviso de privacidad antes del cambio de dominio:** los formularios enlazan a `/aviso-de-privacidad/` del WordPress, que deja de existir al cambiar el dominio. Hay que crear su página en el sitio nuevo, con el texto vigente o el nuevo, antes del lanzamiento.
- Fecha del cambio de dominio. El DNS lo administra Carlos.
- Google Search Console: dominio `centraliafinanciera.com` verificado por DNS (26 de octubre de 2026). El sitemap nuevo se envía el día del cambio de dominio, no antes, porque hoy el dominio sigue mostrando el WordPress.
- Ficha de Google Business Profile: falta saber si hay oficina o solo atención en línea.
- Meta: el Pixel 1375879946116372 está activo y hoy lo dispara el WordPress; no está conectado a HubSpot. Si hay anuncios en diciembre, conviene activar la medición desde el lanzamiento suave para no perder datos.
- Las cifras del diálogo de costos y del simulador ($50 M, $15 M, US$5 M, 37 días, 4.5% y 85%) aparecen en todas las páginas. Solo la tasa de 2% y el plazo de 36 meses están confirmados.
