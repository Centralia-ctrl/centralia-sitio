# Lista de verificación para el lanzamiento

Esta lista sirve para el día en que `centraliafinanciera.com` deje el sitio anterior y apunte a Netlify. Quien haga el cambio la sigue en orden y marca cada punto.
No se publica: `build.cjs` solo copia a `dist/` las páginas aprobadas.

## 1. Antes del día del cambio

- [ ] Todo lo que impide el lanzamiento está integrado en `main`:
  - Aviso de privacidad propio.
  - Cifras y plazos confirmados.
  - Video del almacén sin marca de agua.
- [ ] Todos los enlaces "Aviso de privacidad" apuntan a la página nueva y ya no a `https://centraliafinanciera.com/aviso-de-privacidad/` del sitio anterior. Están en las 5 páginas, en `consent.js` y en los formularios.
- [ ] Las redirecciones 301 del sitio anterior están en `_redirects` (ya en `ALWAYS`). Confirmar que siguen completas.
- [ ] Existe `/aviso-de-privacidad/` en el sitio nuevo: los formularios enlazan ahí y la página del WordPress desaparece con el cambio de dominio.
- [ ] Se tiene la lista de direcciones del sitio anterior, por ejemplo de su `sitemap.xml` o de Google Search Console.
- [ ] Se sabe quién administra el DNS del dominio y se tiene acceso.
- [ ] Se eligió un horario de poco tráfico y está disponible quien pueda revertir el cambio.

## 2. Conectar el dominio en Netlify

- [ ] En Netlify, *Domain management*:
  - Agregar `centraliafinanciera.com` y `www.centraliafinanciera.com`.
  - Dejar `centraliafinanciera.com` como dominio principal, para que `www` redirija ahí. Es el dominio que usan el canonical, el sitemap y `pixel.js`.
- [ ] Cambiar los registros DNS con los valores que indique Netlify.
- [ ] Esperar a que Netlify emita el certificado HTTPS y activar *Force HTTPS*.
- [ ] Quitar la protección con contraseña de la vista previa, solo para el sitio de producción.

## 3. Probar en el dominio real, en celular y en computadora

- [ ] Las 5 páginas principales y el blog (`/blog/` y sus artículos) cargan por `https://centraliafinanciera.com/`, sin avisos de certificado.
- [ ] `http://` y `www.` redirigen a `https://centraliafinanciera.com/`.
- [ ] Las direcciones del sitio anterior redirigen a su página nueva.
- [ ] Menú, Soluciones, Preguntas frecuentes, Blog y "Volver arriba" funcionan.
- [ ] Factoraje se reproduce, sin sonido y con fondo blanco.
- [ ] "Agendemos una reunión" abre la agenda de HubSpot.
- [ ] WhatsApp abre con el mensaje neutral.
- [ ] El correo y el teléfono del pie funcionan.
- [ ] Formulario de la portada:
  - Se envía una prueba y llega a HubSpot.
  - Se borra después el contacto de prueba.
- [ ] Simulador:
  - Crédito y Factoraje calculan.
  - La solicitud de asesoría llega a HubSpot.
  - Se borra el contacto de prueba.
- [ ] La consola del navegador no muestra errores ni bloqueos de la política de seguridad (CSP).
- [ ] Al compartir una liga en WhatsApp o LinkedIn se ve la imagen de la página. Se puede revisar con el *Sharing Debugger* de Meta y el *Post Inspector* de LinkedIn.

## 4. Buscadores

- [x] Verificar el dominio en Google Search Console (hecho el 26 de octubre de 2026, por DNS).
- [ ] Enviar `https://centraliafinanciera.com/sitemap.xml` en Search Console, el mismo día del cambio.
- [ ] Actualizar `lastmod` en `sitemap.xml` con la fecha del lanzamiento.
- [ ] Revisar que ninguna página publicada tenga `noindex`.
- [ ] Revisar en Search Console que se indexen el blog y sus artículos, y que no haya errores de datos estructurados.

## 5. Medición (cuando Miguel Ángel lo indique)

- [ ] `enabled: true` en `consent.js` y en `pixel.js`.
- [ ] Agregar los dominios de Meta y HubSpot a `_headers` y a la CSP de cada página. Las dos políticas deben coincidir.
- [ ] Confirmar que nada se carga antes de aceptar el aviso de cookies y que, al aceptar, llegan los eventos a Meta y a HubSpot.

## Si algo falla

- En Netlify, *Deploys*, se puede publicar de nuevo cualquier versión anterior con *Publish deploy*.
- Si falla el dominio, se restauran los registros DNS anteriores y el sitio anterior vuelve a responder.
