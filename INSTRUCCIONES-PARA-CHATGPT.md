# Centralia Financiera · Estado del sitio y pendientes para el lanzamiento (diciembre 2026)

Documento para quien haga cambios en este repositorio (ChatGPT o Claude Code).
Actualizado el 22 de octubre de 2026, revisado contra el código de este repositorio.

- **Parte C:** reglas que no se negocian.
- **Parte E:** cómo se publica el sitio. Léela antes de agregar o mover archivos.
- **Parte A:** lo que ya está hecho (no rehacer) y lo que falta.
- **Parte B:** decisiones de Miguel Ángel. No apliques nada de esta parte hasta recibir su confirmación.
- **Parte D:** criterios de aceptación.

Trabaja siempre con cambios pequeños y revisables: un tema por propuesta, con vista previa antes de publicar.

## PARTE C · Reglas (aplican a todo)

1. No uses la palabra "broker".
2. No inventes instituciones aliadas, certificaciones, membresías, testimonios, garantías ni cifras.
3. "Más de 10 años de experiencia" y "$4,500 millones de pesos colocados" son datos confirmados de Centralia. No los presentes como cifras auditadas.
4. Nunca menciones nombres de fondeadores o instituciones en el sitio.
5. Conserva el diseño aprobado y las animaciones actuales. No cambies colores, tipografía, composición ni animaciones sin aprobación.
6. La portada sigue siendo amplia y protagonista.
7. Las tarjetas de los tres productos en la portada van sin fotos.
8. "Por qué Centralia" no se publica ni aparece en el menú.
9. Factoraje es la referencia de calidad de las animaciones: fondo blanco integrado, sin sonido, sin logo dentro de la animación y texto en HTML.
10. Nunca subas contraseñas, tokens ni claves de API a este repositorio.

## PARTE E · Cómo se publica

- Netlify ejecuta `node build.cjs` y publica **solo** la carpeta `dist/` (ver `netlify.toml`).
- `build.cjs` hace dos cosas:
  1. Reconstruye `site.css` a partir de las capas de estilo.
  2. Copia a `dist/` únicamente las páginas aprobadas y los archivos que esas páginas usan.
- **Páginas aprobadas:** `index.html`, `credito-empresarial.html`, `factoraje.html`, `pago-a-proveedores.html` y `preguntas-frecuentes.html`. Para publicar una página nueva, agrégala a `PAGES` en `build.cjs`.
- **Lo que se queda en el repositorio y nunca se publica:**
  - Las muestras: `muestra-*.html`, `familia-visual-v10.html`, `welcome-studio-v9.html`, `propuestas-bienvenidas-v6.html` y `por-que-centralia.html`.
  - Los videos e imágenes de prueba que no usa ninguna página.
  - No los borres: son referencia.
- **Después de editar cualquier CSS de capa:** ejecuta `node build.cjs`. No edites `site.css` a mano.
- **Antes de proponer un cambio:** ejecuta `node build.cjs` y revisa que no aparezca la sección "Referenced but not found".

## PARTE A · Estado

### Ya aplicado (no rehacer)

| Punto | Estado |
|---|---|
| A1 Portada | `index.html` es la composición aprobada (v22), sin noindex. |
| A2 Menú | Soluciones · Preguntas frecuentes · Agendemos una reunión, igual en las 5 páginas, sin "Por qué Centralia". |
| A3 Color | Sin restos verdes ni gris verdoso. Cifras en azul marino. Botón principal en azul `#315de8`. |
| A4 Posicionamiento | "Te acompañamos a encontrar, comparar y contratar financiamiento para tu empresa. Exclusivo para personas morales." |
| A5 WhatsApp | Mensaje neutral. El botón flotante se oculta cuando las condiciones o el pie están en pantalla (`contact-visibility.js`). |
| A6 Medición | `pixel.js` está cargado en las 5 páginas y **apagado** (`enabled: false`). Solo se activará con consentimiento separado (ver A6 abajo). |
| A7 Dominio y SEO | Todo apunta a `centraliafinanciera.com`. Las descripciones están sin errores de acentos. `sitemap.xml` y `robots.txt` están correctos. |
| A9 Legibilidad | Etiquetas en mínimo 12 px y texto de lectura en mínimo 13 px, sin reducir ningún texto. Números 01, 02 y 03 de la portada en `#5d6470` (5.96:1). Reglas al final de `release-v24.css` (PR #6). |
| A10 Rendimiento | Una sola hoja `site.css` generada por `build.cjs`. Fuentes WOFF2. Factoraje optimizado: video de 273 KB, versión móvil de 114 KB para hasta 760 px y póster WebP de 47 KB; los originales se conservan (PR #4). La publicación pesa unos 5.0 MB, sin archivos de prueba. |
| A11 Botón de la portada | "Agendemos una reunión" se ve desde el primer instante. Solo se quitó la animación de entrada de `.hero-cta`, en `release-v24.css`; las demás animaciones siguen (PR #5). |
| Calidad | Sin errores de JavaScript y sin scroll horizontal en 360 px, 390 px ni 1440 px. |

### Pendiente

**A8. Aviso de privacidad. EN ESPERA: no hacer todavía.**
Se hará cuando exista la persona moral. Hoy los formularios enlazan a `https://centraliafinanciera.com/aviso-de-privacidad/`, la página del sitio anterior. Antes de lanzar hay que crear `aviso-de-privacidad.html` con el texto legal que entregue Centralia y apuntar ahí todos los enlaces. No redactes ni inventes texto legal.

**A6. Activación de la medición. No hacer hasta que Miguel Ángel lo indique.**
Cuando se active, hace falta:

1. Un aviso de cookies con opciones separadas de analítica y marketing, que dispare `centralia:measurement-consent`.
2. Cambiar `enabled` a `true` en `pixel.js`.
3. Agregar a `_headers` y a la `<meta http-equiv="Content-Security-Policy">` de cada página los dominios de Meta y HubSpot. Las dos políticas deben coincidir.

## PARTE B · Pendiente de decisión de Miguel Ángel (no aplicar)

1. **Cifras y condiciones.** Deben confirmarse con los fondeadores:
   - Crédito con garantía: hasta $50 M MXN, comisión por disposición de 1%, 2% o 4%.
   - Crédito sin garantía: hasta $15 M MXN, comisión de apertura de 4.5%.
   - Factoraje: anticipo de hasta 85%.
   - Pago a proveedores: hasta US$5 M, 37 días, más de 150 países.
   - Tasa ilustrativa del simulador: 2% mensual.
   - **Inconsistencia vigente:** `app.js` dice "Modalidades de 6 a 36 meses", pero el simulador ofrece 12, 18, 24 y 30 meses. Deben coincidir.
2. **Símbolo ® y razón social.** Dependen de la constitución de la persona moral y del registro ante el IMPI.
3. **Formulario único en HubSpot.** Hoy hay dos: portada `68d091a6-…` y simulador `1da292ee-…`. No cambies los endpoints hasta que exista el formulario nuevo y su ID.
4. **Mensaje de éxito.** Falta definir en cuánto tiempo y por qué medio se contacta al prospecto.
5. **Simulador arriba de $15 M.** Elegir entre agregar un escenario con garantía o avisar del límite antes de que el usuario escriba el monto.
6. **Video del almacén.** `assets/centralia-almacen-preview.mp4` y su póster tienen marca de agua de iStock. Son una muestra pendiente de reemplazo por la versión licenciada o por material propio. No se publica en producción con la marca de agua.
7. **Animaciones de Crédito y Pago a proveedores.** Decidir si se rehacen con la línea de Factoraje antes o después del lanzamiento.
8. **Titulares de producto.** "Tu siguiente compra pone todo en marcha." es poco claro. Proponer alternativas, sin aplicarlas.

## PARTE D · Criterios de aceptación de cada cambio

1. `node build.cjs` termina sin "Referenced but not found".
2. Las 5 páginas en `dist/` se ven igual que antes del cambio, salvo lo que el cambio pretendía modificar.
3. Sin errores en la consola y sin scroll horizontal en 360 px, 390 px ni 1440 px.
4. Ningún color nuevo fuera de la paleta: `#1b224e`, `#315de8`, `#254bc6`, `#303647`, `#5d6470` y `#e4e7ee`, más los neutros existentes.
5. Ninguna referencia a `chatgpt.site`, ningún texto con acentos rotos y ninguna mención de fondeadores.
6. Cada propuesta indica los archivos modificados y lo que queda pendiente.
