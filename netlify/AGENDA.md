# Contacto y agenda · 23 de noviembre de 2026

Página aprobada por Miguel: `contacto.html`. Conserva la muestra visual aprobada;
en móvil, Cambiar fecha es un botón y seleccionar hora acerca Continuar.
Los enlaces Contacto del menú conservan el producto de origen, nunca un monto
de ejemplo. Los demás diseños, figuras, simuladores y estilos no cambian.

## Conexiones

- Consulta: formulario publicado 68d091a6-92e3-4ca4-af92-9f87c41d140e del portal
  9145352. Mismos seis campos y consentimiento para atender la consulta.
- WhatsApp: número existente, mensaje contextual sin datos personales.
- Agenda: enlace existente miguelmeza1, 30 minutos, America/Mexico_City.
  Las funciones usan Scheduler API de HubSpot y `HUBSPOT_AGENDA_TOKEN`.
  Nunca introducir la clave en el código, archivos públicos, logs ni Git.
- Al reservar, la necesidad y el monto confirmado se guardan en las dos
  propiedades existentes del contacto devuelto por Scheduler. No se añaden
  campos al calendario. Sin elección se omite la propiedad; «Por definir»
  requiere selección explícita. Nunca se importa el monto de la URL.
- Scheduler rechaza esas propiedades en formFields si no forman parte de su
  página de reserva. Por eso se actualiza el contacto después de confirmar la
  cita, con el permiso de escritura de contactos ya autorizado. Un fallo de
  esa actualización conserva la cita y el contexto pendiente en el registro
  privado; un reintento del mismo identificador no vuelve a reservar.
- Medición: sigue apagada. El consentimiento de consulta o agenda no autoriza
  analítica. La página no carga rastreadores.

## Despliegue

La clave se configura como secreto de Netlify para producción y únicamente la
rama codex/contacto-agenda-20261123. No habilitar el secreto para todos los PR.
El plan actual permite los ámbitos Builds, Functions y Runtime juntos; la clave
solo es utilizada por las funciones. No imprimir variables del entorno.
Node 22 es requerido por la versión fijada de @netlify/blobs. `node build.cjs`
publica únicamente dist; Netlify empaqueta las funciones por separado.

El registro privado centralia-agenda-v1 evita repetir reservas entre instancias,
recargas y despliegues. Las claves usan HMAC; no contienen correos ni nombres.
Una respuesta ambigua queda bloqueada para revisión humana, nunca se reintenta
automáticamente. La disponibilidad se revisa otra vez antes de reservar.
El calendario ofrece la agenda original si la conexión no está disponible.

## Validación

`npm ci` y `npm test`. Las pruebas de reservas y formularios interceptan los
servicios y no crean contactos ni reuniones reales. Consultar disponibilidad
es lectura. Para otra reserva real de prueba, confirmar primero fecha y correo.
La reserva real previamente autorizada fue el 24/11/2026 a las 09:00 CDMX;
no repetirla. Los avisos de formularios a hola@ son un pendiente independiente
y no quedan comprobados por la prueba de calendario.

Prueba adicional autorizada: 24/11/2026, 09:45–10:15 CDMX, marcada como prueba.
Se verificaron necesidad, monto, responsable y próxima actividad en HubSpot.
No repetir la cita. La confirmación al participante llegó a spam; eso no
demuestra recepción del aviso interno al organizador, todavía sin comprobar.
