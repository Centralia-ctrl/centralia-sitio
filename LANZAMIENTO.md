# Lista de verificación para el lanzamiento

Esta lista sirve para el día en que `centraliafinanciera.com` deje el sitio anterior y apunte a Netlify. Quien haga el cambio la sigue en orden y marca cada punto.
No se publica: `build.cjs` solo copia a `dist/` las páginas aprobadas.

## 1. Antes del día del cambio

- [ ] Netlify publica `main` en producción de forma automática. Al 9 de noviembre de 2026 las compilaciones automáticas siguen limitadas por créditos; la publicación manual sí funciona (PR #62 el 6 de noviembre; PR #63 el 9 de noviembre, despliegue `6af20b996dad529b18ea4d10`). Mientras no haya créditos, cada cambio en `main` necesita *Publish deploy* manual y comprobarlo en producción.
- [ ] Todo lo que impide el lanzamiento está integrado en `main`:
  - Aviso de privacidad propio.
  - Cifras y plazos confirmados. Ya confirmados: Crédito hasta $20 millones MXN a 36 meses, 2% mensual ilustrativo y 5% de apertura; Factoraje hasta 85% antes de costos; Pago a proveedores 1.5% mensual, 15 a 60 días y sin comisión de apertura (confirmado el 11 de noviembre de 2026).
  - Video del almacén sin marca de agua (licencia o sustituto).
- [ ] Prueba en un iPhone real con Safari: portada, las tres soluciones, formularios y animaciones. La emulación de Chrome no la sustituye.
- [ ] Todos los enlaces "Aviso de privacidad" apuntan a la página nueva y ya no a `https://centraliafinanciera.com/aviso-de-privacidad/` del sitio anterior. Están en las 5 páginas, en `consent.js` y en los formularios.
- [ ] Las redirecciones 301 del sitio anterior están en `_redirects` (ya en `ALWAYS`). Confirmar que siguen completas.
- [ ] Existe `/aviso-de-privacidad/` en el sitio nuevo: los formularios enlazan ahí y la página del WordPress desaparece con el cambio de dominio.
- [ ] Se tiene la lista de direcciones del sitio anterior, por ejemplo de su `sitemap.xml` o de Google Search Console.
- [ ] Se sabe quién administra el DNS del dominio y se tiene acceso. La guía paso a paso, con lo que no se debe tocar (correo), está en `CAMBIO-DE-DOMINIO.md`.
- [ ] Se eligió un horario de poco tráfico y está disponible quien pueda revertir el cambio.

## 2. Conectar el dominio en Netlify

- [ ] En Netlify, *Domain management*:
  - Agregar `centraliafinanciera.com` y `www.centraliafinanciera.com`.
  - Dejar `centraliafinanciera.com` como dominio principal, para que `www` redirija ahí. Es el dominio que usan el canonical, el sitemap y `pixel.js`.
- [ ] Cambiar solo los registros web del DNS (`A` en la raíz y `CNAME` en `www`) con los valores que indique Netlify. No tocar `MX` ni `TXT`: de ellos depende el correo de hola@. Detalle en `CAMBIO-DE-DOMINIO.md`.
- [ ] Esperar a que Netlify emita el certificado HTTPS y activar *Force HTTPS*.
- [ ] Quitar la protección con contraseña de la vista previa, solo para el sitio de producción.

## 3. Probar en el dominio real, en celular y en computadora

- [ ] `node herramientas/verificar-dominio.cjs` termina con 0 fallas: páginas, canónicas, `noindex`, imágenes para redes, `robots.txt`, aviso de privacidad, `http`/`www` y redirecciones del sitio anterior.
- [ ] Las 5 páginas principales y el blog (`/blog/` y sus artículos) cargan por `https://centraliafinanciera.com/`, sin avisos de certificado.
- [ ] `http://` y `www.` redirigen a `https://centraliafinanciera.com/`.
- [ ] Las direcciones del sitio anterior redirigen a su página nueva.
- [ ] Menú (Soluciones · Blog · Contacto), Preguntas frecuentes desde el pie y "Volver arriba" funcionan.
- [ ] Factoraje se reproduce, sin sonido y con fondo blanco.
- [ ] "Agendemos una reunión" abre la agenda de HubSpot.
- [ ] WhatsApp abre con el mensaje del producto en Crédito, Factoraje y Pago a proveedores, y con el mensaje general en las demás páginas.
- [ ] Los botones del pie (Facebook, Instagram y WhatsApp) abren lo que corresponde.
- [ ] Formulario de la portada:
  - Se envía una prueba en dos pasos y llega a HubSpot.
  - Se ve "Recibimos tu consulta. Te contactamos a la brevedad desde hola@centraliafinanciera.com.", con el resumen de necesidad y monto y "Ahora, lo revisamos contigo."
  - Llega el aviso por correo al destinatario definido en la sección 6.
  - El contacto aparece en la lista "Prospectos del sitio" de HubSpot.
  - Se borra después el contacto de prueba.
- [ ] Herramientas de producto (formulario "Centralia PYME · Simulación y cotización"):
  - El simulador de Crédito, el cálculo de Factoraje y el calendario de Pago a proveedores calculan.
  - La consulta de cada uno llega a HubSpot con su escenario en `message`.
  - Llega el aviso por correo al destinatario definido en la sección 6.
  - Se borra el contacto de prueba.
- [ ] La consola del navegador no muestra errores ni bloqueos de la política de seguridad (CSP).
- [ ] Al compartir una liga en WhatsApp o LinkedIn se ve la imagen de la página. Se puede revisar con el *Sharing Debugger* de Meta y el *Post Inspector* de LinkedIn.

## 4. Buscadores

- [x] Verificar el dominio en Google Search Console (hecho el 26 de octubre de 2026, por DNS).
- [ ] Enviar `https://centraliafinanciera.com/sitemap.xml` en Search Console, el mismo día del cambio.
- [ ] Actualizar `lastmod` en `sitemap.xml` con la fecha del lanzamiento. Son 22 páginas: las 5 principales, el índice del blog y 16 guías.
- [ ] Revisar que ninguna página publicada tenga `noindex`.
- [ ] Revisar en Search Console que se indexen el blog y sus artículos, y que no haya errores de datos estructurados.

## 5. Medición (cuando Miguel Ángel lo indique)

- [ ] `enabled: true` en `consent.js` y en `pixel.js`.
- [ ] Agregar los dominios de Meta y HubSpot a `_headers` y a la CSP de cada página. Las dos políticas deben coincidir.
- [ ] Confirmar que nada se carga antes de aceptar el aviso de cookies y que, al aceptar, llegan los eventos a Meta y a HubSpot.
- [ ] Con analítica aceptada, un envío de prueba lleva `context.hutk` y HubSpot muestra el origen del contacto. Con analítica rechazada o revocada no lo lleva (lo cubren las pruebas de `experience.test.cjs`).
- [ ] `node --test experience.test.cjs` (con jsdom 26) aprueba todas las pruebas.

## 6. Seguimiento de prospectos (HubSpot y Make)

- [x] Lista dinámica "Prospectos del sitio" en HubSpot (lista 130): contactos que enviaron el formulario de la portada o el del simulador (27 de octubre de 2026).
- [ ] Avisos internos de cada consulta. Estado al 9 de noviembre de 2026: **sin comprobar**.
  - En HubSpot, *Marketing → Formularios*, abrir "Centralia · Formulario web" (`68d091a6-…`) y "Centralia PYME · Simulación y cotización" (`1da292ee-…`). En *Opciones → Notificaciones*, poner un correo que alguien revise a diario.
  - Confirmar que ese usuario tiene activos los avisos de envío de formularios en sus preferencias de notificación.
  - hola@centraliafinanciera.com es un buzón aparte. La conexión de Gmail de Claude lee miguelmeza@, donde no llegó ningún aviso de formularios en 30 días. Definir quién revisa hola@ o reenviarlo.
  - Enviar una consulta de prueba desde la portada y otra desde una herramienta de producto, y comprobar que el correo llegó. Crear el contacto no prueba el aviso.
  - Desde la conexión de Claude no se pueden leer ni editar los formularios.
- [ ] Responsable y siguiente acción. El plan gratuito no tiene flujos de trabajo, así que se asignan a mano: definir quién atiende cada consulta, en cuánto tiempo, y registrar responsable y tarea en el contacto o en un negocio en "Consulta recibida".
- [ ] Contactos de prueba del 6 de noviembre (261025664276, 261050454697 y 261025667908, empresa "PRUEBA TECNICA CENTRALIA - NO CONTACTAR"): no contactar. Miguel Ángel decide si se borran antes del lanzamiento.
- [ ] En cada formulario: correo de seguimiento al prospecto desde hola@centraliafinanciera.com (*Automatización*) y etapa del contacto "Lead" (*Opciones*), si se decide usarlos.
- [ ] Si se usa Make para crear el negocio en "Consulta recibida" y la tarea de seguimiento: contratar un plan (la organización está en pausa, sin licencia) y reconectar HubSpot en Make con permisos de negocios (`deals-read` y `deals-write`); la conexión actual no los tiene.

## Si algo falla

- En Netlify, *Deploys*, se puede publicar de nuevo cualquier versión anterior con *Publish deploy*.
- Si falla el dominio, se restauran los registros DNS anteriores y el sitio anterior vuelve a responder.
