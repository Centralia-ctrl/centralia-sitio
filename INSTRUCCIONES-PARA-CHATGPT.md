# Centralia Financiera · Cambios al sitio antes del lanzamiento (diciembre 2026)

Documento para aplicar sobre el paquete actual del sitio. Contiene:

- **Parte A:** cambios que debes ejecutar ya.
- **Parte B:** cambios que dependen de una decisión o confirmación de Miguel Ángel. No los apliques hasta recibirla. Mientras tanto, deja el texto actual y no inventes datos.
- **Parte C:** reglas que no se negocian.
- **Parte D:** criterios de aceptación.

Archivos adjuntos que acompañan este documento: `pixel.js` y `_headers`.

---

## PARTE C · Reglas (aplican a todo)

1. No uses la palabra "broker".
2. No inventes instituciones aliadas, certificaciones, membresías, testimonios, garantías ni cifras.
3. "Más de 10 años de experiencia" y "$4,500 millones de pesos colocados" son datos confirmados de Centralia como empresa. No los presentes como cifras auditadas.
4. Nunca menciones nombres de fondeadores o instituciones en el sitio.
5. La portada debe seguir siendo amplia y protagonista; no la comprimas para adelantar el video.
6. Menos saturación de azul, conservando la identidad. Los verdes y el azul apagado fueron pruebas: no son identidad aprobada.
7. Las tarjetas de los tres productos en la portada van sin fotos.
8. "Por qué Centralia" sale del inicio y del menú en todo el sitio. Las cifras de trayectoria permanecen en la portada.
9. Factoraje es la referencia de calidad de las animaciones. Fondo blanco integrado, sin sonido, sin logo dentro de la animación, y texto en HTML (no dentro del video), nítido y bien ubicado.

---

## PARTE A · Cambios a ejecutar

### A1. La muestra se convierte en la portada

1. `muestra-composicion-v22.html` pasa a ser el nuevo `index.html`. La `index.html` actual se archiva y no se publica.
2. En la nueva `index.html`:
   - Cambia `<title>` a `Crédito empresarial en México | Centralia Financiera`.
   - Elimina `<meta name="robots" content="noindex,nofollow">`.
   - Elimina el `<meta http-equiv="Content-Security-Policy" ...>`, que bloquea el píxel y HubSpot. La política se aplica desde `_headers`.
   - Quita las clases de estudio `white-blue-study compact-study` del `<body>`. Integra en la hoja definitiva los estilos de `muestra-blanco-azul-v21.css` y `muestra-composicion-v22.css` que sí se aprueban, sin depender de esas clases.
3. En todas las páginas, el logo y el enlace "Inicio" del breadcrumb deben apuntar a la nueva `index.html`.
4. No publiques `muestra-composicion-v22.html`, `muestra-composicion-v22.css`, `muestra-blanco-azul-v21.css` ni `por-que-centralia.html`.

### A2. Menú unificado sin "Por qué Centralia"

1. En `credito-empresarial.html`, `factoraje.html`, `pago-a-proveedores.html` y `preguntas-frecuentes.html`, elimina el enlace "Por qué Centralia" de `.desktop-nav` y de `#mobile-nav`.
2. Renumera el menú móvil igual que en la portada: "Preguntas frecuentes 02".
3. Quita `por-que-centralia.html` de `sitemap.xml` y elimina cualquier enlace interno hacia ella. Si el hosting lo permite, redirige `/por-que-centralia.html` a `/` (301).

### A3. Color: quitar restos de paletas de prueba y bajar la saturación de azul

Define una sola fuente de color, por ejemplo en `:root`:

```css
--navy:#1b224e;   /* titulares, cifras, texto fuerte */
--blue:#315de8;   /* SOLO acción principal de cada pantalla y enlaces */
--blue-hover:#254bc6;
--ink:#303647;    /* texto */
--muted:#5d6470;  /* texto secundario y etiquetas */
--line:#e4e7ee;
```

Reemplaza estos restos de pruebas:

| Archivo | Selector | Valor actual | Cambiar a |
|---|---|---|---|
| `solution-film.css` | `.solution-welcome .product-actions .button` | `#303737` / hover `#46524d` | `--blue` / `--blue-hover` |
| `solution-film.css` | `.solution-page .product-meeting .button` | `#303737` | `--blue` |
| `solution-film.css` | `.solution-page .product-meeting h2` / `p` | `#303737` / `#69716f` | `--navy` / `--muted` |
| `solution-film.css` | `.solution-welcome .film-message` | `#303737` | `--navy` |
| `solution-film.css` | `.solution-welcome .product-text-link` | `#545f59`, borde `#bac2bd` | `--muted`, borde `--line` |
| `factoraje-film.css` | Los mismos selectores con prefijo `.factoraje-` / `.factoraje-page` | `#303737`, `#46524d`, `#545f59`, `#bac2bd`, `#69716f` | Los mismos reemplazos |
| `simulator.css` | `.sim-success` | fondo `#edf5e9`, texto `#354a30`, borde `#d2dfca` | fondo `#f3f6ff`, texto `--navy`, borde `#dce2ed` |
| `simulator.css` | `.sim-summary` | `#f4f6f3` | `#f3f6ff` |
| `simulator.css` | `.sim-lead-grid label span` | `#556950` | `--muted` |
| `simulator.css` | `.sim-lead-grid input:focus` (primera regla) | `#6d805e` | `--blue` |
| `audit-fixes.css` | `:focus-visible` | `#132f26` | `--blue` |

Reglas para bajar la saturación de azul:

- Azul sólido solo en el botón principal de cada pantalla.
- Cifras grandes en `--navy`, no en azul: `$50 millones`, `85%`, `US$5 millones`. Esto aplica a `.direction-product .direction-terms>strong`, `.product-stat>strong` y `.solution-metric>strong`.
- Etiquetas de sección (`.eyebrow`) en `--muted`, no en azul.
- No toques el logo.

### A4. Titular de la portada: decir qué es Centralia

Debajo del H1 "Crédito empresarial para las empresas que mueven a México." agrega una línea breve, por ejemplo:

> Te acompañamos a encontrar, comparar y contratar financiamiento para tu empresa con instituciones financieras. Exclusivo para personas morales.

Debe ser una sola línea de apoyo, sin nombrar instituciones y sin comprimir el hero.

### A5. WhatsApp: un solo mensaje y sin tapar contenido

1. Los enlaces de WhatsApp del botón flotante (`.whatsapp-float`) y del pie (`.footer-whatsapp`) hoy dicen "Quiero agendar una reunión…", lo que choca con la agenda. Cámbialos a:
   `https://wa.me/525548092849?text=Hola%2C%20Centralia.%20Quiero%20informaci%C3%B3n%20sobre%20financiamiento%20para%20mi%20empresa.`
2. En escritorio (1440×900), `.whatsapp-float` tapa el texto derecho de `.direction-terms` en las tres páginas de producto. Ajusta su posición o tamaño, u ocúltalo mientras el recuadro de cifras está en pantalla, igual que ya hace `.capture-in-view`.

### A6. Medición: Meta Pixel y HubSpot

1. Agrega `pixel.js` (adjunto) en la raíz.
2. En el `<head>` de las 5 páginas publicadas (`index.html`, `credito-empresarial.html`, `factoraje.html`, `pago-a-proveedores.html`, `preguntas-frecuentes.html`) y en `aviso-de-privacidad.html`, agrega:

```html
<script src="pixel.js" defer></script>
<script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/9145352.js"></script>
```

3. No pongas el píxel como script en línea.
4. Reemplaza `_headers` por el adjunto. Agrega permisos para Meta y HubSpot y conserva todo lo demás.
5. `pixel.js` depende de estos IDs. No los renombres:
   - `#capture-success` (éxito del formulario de portada)
   - `.sim-success` (éxito del simulador)

### A7. Dominio definitivo y SEO técnico

1. Reemplaza `https://centralia-empresarial.youngfern64.chatgpt.site` por `https://centraliafinanciera.com` en:
   - `canonical`, `og:url` y `og:image` de todas las páginas.
   - Todos los bloques `application/ld+json`, incluidos `@id`, `url` y `logo`.
   - `sitemap.xml` y la línea `Sitemap:` de `robots.txt`.
2. Corrige los acentos mal codificados en la `meta description` y `og:description`:
   - `credito-empresarial.html`: «Explora crédito empresarial para expansión, inventario y equipo. Opciones con y sin garantía real para personas morales en México.»
   - `pago-a-proveedores.html`: «Explora financiamiento para pagar a proveedores en México y el extranjero. Revisa tu operación, plazos y condiciones con Centralia Financiera.»
3. Agrega `aviso-de-privacidad.html` al sitemap.

### A8. Página de aviso de privacidad (estructura)

1. Crea `aviso-de-privacidad.html` con el mismo encabezado, menú y pie que el resto del sitio.
2. Deja el cuerpo con un marcador visible "TEXTO LEGAL PENDIENTE". El texto lo proporciona Centralia; no lo redactes ni lo inventes.
3. Enlázala desde:
   - El consentimiento del formulario de portada. Hoy apunta a `https://centraliafinanciera.com/aviso-de-privacidad/`; cámbialo a `aviso-de-privacidad.html`.
   - El consentimiento del simulador (`#lead-consent`).
   - El pie de página de todas las páginas.
   - El diálogo "Datos y privacidad" (`info.privacy` en `app.js`).

### A9. Legibilidad y accesibilidad

1. Sube a mínimo 13 px (14 px en móvil) los textos de 11–12 px de contenido: `.showcase-note`, `.solution-metric>p`, `.direction-terms>small`, `.capture-note`, `.legal-note` y `.solution-secondary-actions>.solution-conditions`.
2. Verifica contraste AA (4.5:1) en todos los grises sobre blanco.
3. Que el foco del teclado sea visible en azul en todos los controles (ver A3).

### A10. Rendimiento

1. Convierte `assets/dm-sans-*.ttf` a WOFF2 y actualiza `@font-face`. Conserva `DM-Sans-OFL.txt`.
2. No publiques `assets/centralia-operacion-v28.webp` (1.67 MB) si `por-que-centralia.html` no se publica.
3. Consolida las hojas CSS de capas (`refinements`, `content-direction-v14`, `launch-readiness-v15`, `lead-capture-v17`, `home-products-v19`, `muestra-*`) en `site.css` mediante `build.cjs`, sin cambiar el resultado visual aprobado.

---

## PARTE B · Pendiente de decisión o confirmación de Miguel Ángel (no aplicar todavía)

### B1. Cifras y condiciones a confirmar

Están en `app.js` (`routes`), las tarjetas, los recuadros de cada producto y las preguntas frecuentes. No las cambies hasta tener confirmación; si alguna no se confirma, se elimina del sitio.

- **Crédito con garantía:** hasta $50 M MXN, línea de hasta 5 años, comisión por disposición de 1%, 2% o 4%.
- **Crédito sin garantía:** hasta $15 M MXN, modalidades de 6 a 36 meses, comisión de apertura de 4.5%, aval según evaluación.
  - **Inconsistencia a resolver:** los Costos y condiciones dicen 6 a 36 meses, pero el simulador ofrece 12, 18, 24 y 30 meses. Deben coincidir.
- **Factoraje:** anticipo de hasta 85%, en MXN o USD, con y sin recurso.
- **Pago a proveedores:** línea de hasta US$5 M, hasta 37 días, "más de 150 países", "pagos agrupados, programación de fechas y controles de autorización".
- **Simulador:** tasa ilustrativa de 2% mensual. Hay que confirmar si es representativa o si conviene mostrar un rango.
- **El símbolo ®:** en el logo (`.brand-registered`) y en "Centralia Financiera®" del pie y del diálogo. Si no hay registro ante el IMPI a nombre de la empresa, se elimina en todo el sitio.
- **Razón social:** si se confirma, se agrega en el pie de página.

### B2. Formulario único (estructura a definir en HubSpot primero)

Hoy hay dos formularios de HubSpot distintos:

| Formulario | ID | Campos |
|---|---|---|
| Portada (`lead-capture-v17.js`) | `68d091a6-92e3-4ca4-af92-9f87c41d140e` | Nombre, correo, WhatsApp, monto, solución |
| Simulador (`simulator.js`) | `1da292ee-7ccc-42e4-a427-ece646e13e65` | Nombre, empresa, correo, teléfono y el escenario en un campo de texto `message` |

Propuesta: un solo formulario con nombre, empresa, cargo, correo, WhatsApp, monto aproximado, solución, rango de ventas anuales y consentimiento. El simulador agrega su escenario (monto, plazo, mensualidad) en propiedades separadas.

**No cambies los endpoints** hasta que Miguel Ángel cree el formulario nuevo en HubSpot y te dé su ID. Decisiones pendientes:
- Mínimo de facturación anual atendido, y si se pregunta en el formulario.
- Si el cargo es obligatorio. Hoy las opciones son solo "Representante legal / Director de finanzas / Otro cargo autorizado".

### B3. Mensaje de éxito del formulario

Hoy dice "El equipo de Centralia podrá contactarte". Falta definir:
- En cuánto tiempo y por qué medio se contacta al prospecto (por ejemplo, "por WhatsApp en horario hábil").
- Si en el mensaje de éxito se ofrece el botón "Agendemos una reunión".

### B4. Simulador para montos mayores a $15 M

Hoy, con más de $15 M no calcula y manda a agendar, mientras la portada destaca $50 M. Hay dos opciones:
- **(a)** Agregar un escenario "con garantía" con sus supuestos confirmados.
- **(b)** Dejarlo así, pero mostrar el mensaje antes de que el usuario escriba el monto.

### B5. Video del almacén

`assets/centralia-almacen-preview.mp4` y `assets/centralia-almacen-poster.png` tienen marca de agua de iStock. Además, el póster tiene una franja oscura a la izquierda. Hay dos opciones:
- **(a)** Reemplazarlos por la versión licenciada (iStock ID 1273494455) con un póster limpio 16:9.
- **(b)** Sustituir el video por una imagen libre de derechos o propia.

No se publica con la marca de agua.

### B6. Animaciones de Crédito y Pago a proveedores

Deben tener la misma línea visual que Factoraje (render con volumen, esfera o forma azul, objeto blanco protagonista, acento dorado, órbitas finas, fondo blanco integrado, sin logo ni sonido, texto en HTML), con ilustración propia:

- **Crédito:** tarjeta "CAPITAL" con barras que crecen sobre una forma azul.
- **Pago a proveedores:** orden de compra que se marca como "PAGADA" y sale hacia un punto en órbita. La animación actual (aro azul sobre una pista, `supplier-track-v13.js`) no se entiende y en parte del ciclo deja la escena vacía.

Pendiente de decisión: si se producen antes del lanzamiento o después. Si van después, se publican las actuales con el ajuste de color de A3.

### B7. Titulares de producto

"Tu siguiente compra pone todo en marcha." es poco claro. El segundo mensaje, "Financia el pago a tus proveedores.", sí lo es. Propón dos alternativas más directas por producto para que Miguel Ángel elija; no las apliques sin aprobación.

---

## PARTE D · Criterios de aceptación

1. Las 5 páginas publicadas tienen el mismo menú (Soluciones · Preguntas frecuentes · Agendemos una reunión) y ningún enlace a "Por qué Centralia".
2. Los botones principales son azules en todas las páginas, y no queda ningún color verde ni gris verdoso: buscar `#303737`, `#46524d`, `#545f59`, `#bac2bd`, `#69716f`, `#edf5e9`, `#354a30`, `#f4f6f3`, `#556950`, `#6d805e` y `#132f26` debe dar cero resultados.
3. No queda ninguna referencia a `chatgpt.site`.
4. No hay acentos mal codificados (`&#195;`).
5. No hay ningún `<meta http-equiv="Content-Security-Policy">` en el HTML.
6. Al cargar cualquier página, la consola no muestra errores de CSP y existen `window.fbq` y el script de HubSpot.
7. No hay marca de agua visible en ningún recurso.
8. No hay scroll horizontal en 360 px ni en 390 px, y el botón de WhatsApp no tapa contenido.
9. El enlace al aviso de privacidad funciona desde los dos formularios y desde el pie.
10. Entrega una lista de los archivos modificados y de lo que quedó pendiente de la Parte B.
