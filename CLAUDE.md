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
- Hay 5 páginas públicas: `index.html`, `credito-empresarial.html`, `factoraje.html`, `pago-a-proveedores.html` y `preguntas-frecuentes.html`. Para publicar otra, agrégala a `PAGES` en `build.cjs`, y solo con aprobación de Miguel Ángel.
- `site.css` se genera desde las capas de estilo listadas en `build.cjs`. No lo edites a mano: edita la capa y vuelve a construir.
- Las muestras, los estudios y los recursos originales (`muestra-*`, `por-que-centralia.html`, los videos de prueba de factoraje y otros) se quedan en el repositorio como referencia. No los borres y no los publiques.
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

- `pixel.js` (Meta Pixel 1375879946116372 y HubSpot 9145352) está cargado en las 5 páginas y **apagado** (`enabled: false`). No lo actives sin instrucción.
- Para activar la medición hace falta: un banner de consentimiento que dispare `centralia:measurement-consent` y agregar los dominios de Meta y HubSpot tanto en `_headers` como en la `<meta http-equiv="Content-Security-Policy">` de cada página.
- Formularios de HubSpot:
  - Portada: `lead-capture-v17.js`, formulario `68d091a6-…`.
  - Simulador: `simulator.js`, formulario `1da292ee-…`.
  - No cambies los endpoints.

## Cola de trabajo (en orden)

1. **Video del almacén:** en espera del archivo licenciado. Cuando llegue, optimízalo igual que el de Factoraje y reemplaza también su póster.

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

## En espera (no hacer sin instrucción)

- Aviso de privacidad: se hará cuando se constituya la persona moral.
- Razón social y símbolo ®.
- Cifras, plazos y condiciones. Hay una inconsistencia conocida: `app.js` dice 6 a 36 meses y el simulador ofrece 12 a 30.
- Formulario único de HubSpot.
- Mensaje de éxito y tiempo de respuesta.
- Simulador arriba de $15 M.
- Nuevas animaciones de Crédito y Pago a proveedores.
- Titulares de producto.
- Activación de la medición.
