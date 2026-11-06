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
- Páginas públicas: las 5 principales (`index.html`, `credito-empresarial.html`, `factoraje.html`, `pago-a-proveedores.html` y `preguntas-frecuentes.html`) y el blog (`blog/index.html` y 16 artículos). Para publicar otra, agrégala a `PAGES` en `build.cjs`, y solo con aprobación de Miguel Ángel.
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

- **Acabado de marca** (PR #33, inspirado en la referencia de Brex del PR #32): redondeo único de 12 px, superficies sin sombra y franja navy `#1b224e` de borde a borde en la parte inferior del pie, corta y solo con derechos y ligas (el aviso legal largo del pie se quitó por decisión de Miguel Ángel, PR #51), en todas las páginas; arriba, contacto y redes quedan en blanco. Está al final de `release-v24.css`. Preguntas frecuentes de la portada sigue en blanco.
- **Guías precisadas** (PR #34): tablas, secuencia de factoraje y listas de comprobación en `blog.css`; Opciones de financiamiento va primero en el índice (`INDEX_FIRST` en `herramientas/blog.py`). Fuentes en la descripción del PR. Las guías las firma Miguel Ángel Meza Badillo, director general (`AUTHOR` en `herramientas/blog.py`, PR #39); la ficha solo lleva datos confirmados.
- **Contacto sin duplicar y WhatsApp sin tapar** (PR #35): los artículos cierran solo con su invitación contextual; `contact-visibility.js` oculta el botón flotante sobre bloques de contacto y sobre cualquier control.
- **Contacto directo del pie** (PR #36): sin correo; WhatsApp es un botón junto a Facebook e Instagram, con el mismo mensaje neutral.

- **Escaneo del 27 de octubre de 2026** (PR #43 a #47):
  - Portada: una sola raya bajo las cifras y cifras completas en celular; `site.css` normalizado para que construir no lo marque como modificado (PR #43).
  - SEO: descripción de la portada a 144 caracteres, título de Pago a proveedores a 50 y `sitemap.xml` sin BOM (PR #45).
  - Los formularios envían `context.hutk` a HubSpot para conservar el origen de cada prospecto (PR #46), solo si al enviar se cumplen las tres condiciones: medición habilitada, consentimiento de analítica explícito y vigente (`__centraliaAnalyticsAllowed()` en `pixel.js`) y cookie `hubspotutk` válida (PR #52). Autorizar el tratamiento de datos de la consulta no equivale a aceptar analítica. Pruebas en `experience.test.cjs`.
  - Blog con 16 guías: 8 nuevas sobre factoraje con y sin recurso, requisitos, factoraje o crédito, aforo, crédito simple o revolvente, flujo a 13 semanas, días de cobranza y estados financieros (PR #47). El sitemap tiene 22 páginas.

- **Mensaje de éxito** (27 de octubre de 2026, decisión de Miguel Ángel): portada: "Recibimos tu consulta. Te contactamos a la brevedad desde hola@centraliafinanciera.com."; simulador en todas las páginas: "Recibimos tu solicitud. Te contactamos a la brevedad."
- **Confirmación con revisión de Centralia** (PR #55): tras la respuesta correcta de HubSpot, la portada muestra el mensaje aprobado, el resumen de necesidad y monto, "Ahora, lo revisamos contigo." y la nota de no aprobación. No lleva botón ni redirección al registro: la invitación al registro se comparte solo después de que una persona de Centralia revisa el caso.

## Decidido no hacer

- Página 404 propia (PR #10 cerrado).

## En espera (no hacer sin instrucción)

- Aviso de privacidad: se hará cuando se constituya la persona moral.
- Razón social y símbolo ®.
- Cifras y condiciones. Ya confirmado por Miguel Ángel: tasa ilustrativa del simulador de 2% mensual, plazo máximo de 36 meses (el simulador ofrece 12, 18, 24, 30 y 36) y anticipo de factoraje de hasta 85% del valor de facturas elegibles, antes de costos (26 de octubre de 2026).
- Formulario único de HubSpot.
- Simulador arriba de $15 M.
- Nuevas animaciones de Crédito y Pago a proveedores.
- Titulares de Crédito empresarial y Factoraje: sin cambios pedidos.
- Activación de la medición.
- Redirecciones del sitio anterior: en `_redirects` (PR #31). El WordPress solo tenía Inicio, Aviso de privacidad y Educación financiera (→ `/blog/`). Falta confirmar la dirección exacta de Educación financiera.
- **Aviso de privacidad antes del cambio de dominio:** los formularios enlazan a `/aviso-de-privacidad/` del WordPress, que deja de existir al cambiar el dominio. Hay que crear su página en el sitio nuevo, con el texto vigente o el nuevo, antes del lanzamiento.
- **Página privada de invitación al registro:** en un PR en borrador aparte, sin publicar. Se activa solo cuando Miguel Ángel confirme un destino real (nombre, dominio y liga) y apruebe mostrar su nombre en esa página. Solvento fue solo una idea: no es destino.
- Fecha del cambio de dominio. El DNS lo administra Carlos.
- Google Search Console: dominio `centraliafinanciera.com` verificado por DNS (26 de octubre de 2026). El sitemap nuevo se envía el día del cambio de dominio, no antes, porque hoy el dominio sigue mostrando el WordPress.
- Ficha de Google Business Profile: falta saber si hay oficina o solo atención en línea.
- Meta: el Pixel 1375879946116372 está activo y hoy lo dispara el WordPress; no está conectado a HubSpot. Si hay anuncios en diciembre, conviene activar la medición desde el lanzamiento suave para no perder datos.
- Las cifras del diálogo de costos y del simulador ($50 M, $15 M, US$5 M, 37 días y 4.5%) aparecen en todas las páginas y siguen sin confirmar. Están confirmados la tasa de 2%, el plazo de 36 meses y el anticipo de hasta 85%.

## Publicación aprobada · 4 de noviembre de 2026

Miguel Ángel autorizó publicar la muestra comercial de las tres soluciones. Se integran el simulador de Crédito empresarial, el cálculo de Factoraje y el calendario de Pago a proveedores arriba de sus páginas; se conservan las animaciones aprobadas. Los formularios comparten nombre, empresa, correo y teléfono; mantienen sus endpoints y los consentimientos separados.

Condiciones confirmadas: hasta $15 millones sin garantía, hasta $50 millones con garantía y hasta 60 meses en Crédito empresarial. El ejemplo sin garantía usa 2% mensual y 4.5% de apertura antes de IVA. La comisión con garantía sigue por confirmar. Factoraje usa hasta 85% de anticipo bruto antes de costos. El calendario de proveedores no promete tasas ni plazos aprobados.

Las capas credit-simulator-preview.css, product-sales-preview.css y unified-tools-preview.css conservan sus nombres de la muestra y ahora forman parte de site.css. No se publica preview-guard.js ni los servidores y avisos de pruebas. El blog se regeneró desde su plantilla para unificar el formulario, sin modificar los artículos.

La medición permanece apagada. El acceso privado de Netlify no cambia. El despliegue de producción depende de reactivar los créditos de Netlify; las vistas previas siguen habilitadas.

## Navegación simplificada · 4 de noviembre de 2026

Miguel Ángel aprobó el menú «Soluciones · Blog · Contacto», tanto en escritorio como en móvil. Contacto lleva a «Tu primer paso» de la portada. Preguntas frecuentes permanece accesible desde el pie y conserva su URL, contenido y datos estructurados; las preguntas de cada producto siguen en su lugar. El generador del blog mantiene esta misma navegación.

## Crédito empresarial: proyectos interactivos · 5 de noviembre de 2026

Miguel Ángel aprobó la muestra con el simulador arriba y tres proyectos debajo: Expansión, Inventario y Equipo y operación. Cada elección muestra una escena con fondo blanco, su explicación y una consulta específica. Posteriormente eligió «Inventario en circulación» y aprobó su versión pulida: seis piezas perladas avanzan continuamente sobre una base fina, conservan su tamaño y entran y salen suavemente. Sustituye la estantería de esta muestra local. Para Expansión eligió la propuesta refinada 11, «Red de sucursales», integrada en `credit-expansion-network.js`: una sede conecta con tres nuevas sucursales en una secuencia de diez segundos. Equipo y operación conserva su escena.

La consulta conserva la necesidad elegida en el campo `message` existente de HubSpot. Un escenario editado conserva monto, plazo y modalidad; si no se usó el simulador, la consulta no atribuye sus valores de ejemplo al visitante. Un monto editado inválido devuelve al simulador para corregirlo. El mensaje de contacto sigue siendo «a la brevedad», por decisión de Miguel Ángel; no se promete un plazo.

`credit-project-scenes.css` se incorpora a `site.css` mediante `build.cjs`. La ilustración se carga al entrar en pantalla, se pausa fuera de ella y respeta la preferencia de movimiento reducido. Los originales y las otras animaciones permanecen intactos. Las anotaciones de importación de dos módulos de Three.js se omiten para evitar referencias ficticias en la compilación; su código y licencia se conservan.

Se preparó en una rama aparte, sin fusionar ni publicar. La integración de Red de sucursales e Inventario en circulación se revisa en la página completa local antes de cualquier publicación. Compilación de 73 archivos sin referencias faltantes y 33 pruebas aprobadas. Vista comprobada en Chrome a 360, 390 y 1440 px, sin desbordes; avance continuo y pausa/reanudación verificados. Por autorización expresa de Miguel Ángel se realizó anteriormente una consulta real claramente identificada como prueba técnica: llegó a HubSpot con la necesidad elegida. El aviso al correo del equipo todavía requiere comprobación. No repetir envíos reales ni cambiar notificaciones o automatizaciones sin instrucción.

Confirmación posterior de Miguel Ángel del 5 de noviembre de 2026 para ambas modalidades de crédito: plazo único de 24 meses y apertura del 5% antes de IVA. Sustituye los supuestos anteriores de hasta 60 meses, 4.5% sin garantía y comisión pendiente con garantía. La tasa ilustrativa sigue en 2% mensual. La comisión se muestra por separado. En esta vista local se retiraron los párrafos y enlaces repetidos de la bienvenida de Crédito y se integró Red de sucursales tras su elección. Sigue pendiente la autorización para publicar estos cambios.

En la revisión local posterior, el simulador muestra juntos el pago mensual y la apertura como pago único. «Continuar con este monto» confirma el escenario visible y abre un formulario con su resumen, los dos importes y «Modificar monto». La edición conserva los datos de contacto. Las consultas generales o por proyecto siguen distinguiendo un monto elegido de un ejemplo sin confirmar. En móvil, los importes del resumen se muestran completos en una columna. Se aprobaron 35 pruebas con solicitudes simuladas. Esta mejora del recorrido sigue en revisión local.

Última indicación de Miguel Ángel del 5 de noviembre de 2026 para esta vista local: plazo único de 36 meses, límite de $20 millones MXN y retirada del selector y las menciones comerciales de garantía real. Sustituye los límites de $15/$50 millones y el plazo de 24 meses de la revisión anterior. El ejemplo inicial sigue en $1 millón, con tasa ilustrativa de 2% mensual y apertura del 5% separada. Mensualidad estimada de $39,232.85 antes de IVA y otros cargos. Se actualizaron la página de Crédito, el simulador compartido, el resumen de solicitud, la ficha de la portada, las condiciones y preguntas relacionadas con sus datos estructurados. El blog se regeneró desde su plantilla compartida. Pasan 36 pruebas. Sigue siendo una muestra local para revisión.

Revisión de distribución solicitada después: título centrado verticalmente junto al simulador, cifras de monto y plazo con mayor jerarquía y entrada suave, resultado con mensualidad protagonista y comisión separada. En móvil, título y cifras preceden al simulador. Miguel Ángel confirmó expresamente que a este crédito de hasta $20 millones a 36 meses le aplican las tres condiciones «Sin garantía», «Sin penalizaciones por pagos anticipados» y «Tasa de interés fija sobre saldos insolutos». Se muestran en una franja bajo la bienvenida y se reflejan en la ficha de condiciones. Lendit fue una referencia aportada, y su nombre queda fuera del sitio. Cambios de esta revisión en credito-empresarial.html, credit-project-scenes.css, credit-inline-calculator.js y app.js, con site.css regenerado. Continúa en vista local.

Corrección posterior de ubicación: las tres condiciones pasan debajo de las cifras dentro de la columna del título, junto al simulador. Se compactan los espacios del cálculo y se ajusta la entrada de cifras y marcas de verificación. Por petición expresa se retira «Ejemplo ilustrativo.» de los tres proyectos y el control de repetición al terminar una escena. Los controles durante la reproducción permiten pausar y continuar. Miguel Ángel pidió después ideas para otra entrada de Crédito empresarial, y confirmó que se refiere a esta página. Cualquier nueva dirección de entrada queda pendiente de su elección.

## Publicación de Crédito empresarial autorizada · 6 de noviembre de 2026

Miguel Ángel autorizó integrar y publicar la propuesta premium. Se integra la bienvenida de composición sobria, los beneficios destacados debajo de las cifras y la entrada conjunta de 950 ms. Se retira «Ver detalle del cálculo» de la bienvenida. El formulario operativo conserva sus consentimientos y destino de HubSpot. La demostración independiente y su botón de previsualización quedan fuera del sitio.

La revisión incluye las escenas de Expansión e Inventario aprobadas, el límite de $20 millones a 36 meses, la apertura del 5% por separado y las condiciones comerciales confirmadas. La compilación genera 73 archivos y las 36 pruebas pasan. El 6 de noviembre, Netlify sigue mostrando producción pausada por créditos agotados, con vistas previas habilitadas. La publicación en la dirección principal depende de reactivar los créditos o del siguiente ciclo.
