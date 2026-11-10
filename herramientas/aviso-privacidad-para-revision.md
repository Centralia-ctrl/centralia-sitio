# Aviso de privacidad: datos para la revisión legal

Documento interno para quien redacte el aviso de privacidad de centraliafinanciera.com. Describe qué hace el sitio con los datos personales al 10 de noviembre de 2026. No es texto legal ni sustituye la revisión profesional. No se publica.

## Responsable

- **Marca comercial:** CENTRALIA FINANCIERA® (registrada).
- **Responsable:** Martha Patricia Meza Badillo, persona física con actividad empresarial.
- **RFC:** MEBM6204279F6.
- **Domicilio:** Av. Popocatépetl 415, Sta. Cruz Atoyac, Benito Juárez, 03310, Ciudad de México.
- **Correo:** hola@centraliafinanciera.com.
- **Atención:** el sitio se dirige a empresas constituidas como personas morales. Quien llena los formularios es una persona física que actúa en nombre de su empresa (nombre, correo y teléfono son datos personales de esa persona).

## Qué datos se recaban y dónde

### 1. Formulario "Tu primer paso" (portada)
- **Datos:** nombre, empresa, correo electrónico, WhatsApp (teléfono), monto aproximado y necesidad (crédito empresarial, factoraje o pago a proveedores).
- **Consentimiento (casilla obligatoria):** "Autorizo a Centralia a usar mis datos para atender esta consulta y contactarme. He leído el aviso de privacidad."
- **Destino:** HubSpot, Inc. (CRM; cuenta 9145352), mediante su API de formularios. Se crea o actualiza un contacto.

### 2. Herramientas de Crédito, Factoraje y Pago a proveedores
- **Datos:** nombre, empresa, correo, teléfono y el escenario calculado (monto, plazo, fechas, anticipo estimado o compra). Opcionales: rango de ventas anuales y destino del capital. También se pide declarar que la empresa es persona moral.
- **Consentimiento (casilla obligatoria):** "Autorizo a Centralia Financiera a utilizar mis datos para atender mi solicitud y contactarme." El registro guarda la fecha y hora de esa autorización.
- **Destino:** HubSpot, Inc. (formulario "Centralia PYME · Simulación y cotización").

### 3. WhatsApp
- Los botones abren WhatsApp con un mensaje predefinido. La conversación ocurre en WhatsApp (Meta Platforms) con el número de Centralia.

### 4. Agenda de reuniones
- El botón "Agendemos una reunión" abre la agenda de HubSpot (Meetings), que pide nombre y correo para la cita.

### 5. Correo electrónico
- Las respuestas y el seguimiento se hacen desde hola@centraliafinanciera.com (Google Workspace).

## Finalidades que hoy tiene el tratamiento (para que el abogado las clasifique)
- Atender la consulta o solicitud y contactar a la persona.
- Orientar sobre opciones de financiamiento y, si la empresa decide avanzar, integrar su información para presentarla a instituciones financieras que evalúan, autorizan y otorgan el financiamiento.
- Seguimiento comercial de la consulta (registro en el CRM, tareas, recordatorios).
- Posible envío de información o boletines sobre financiamiento empresarial (hoy no se envían; definir si será finalidad secundaria).
- Medición del sitio y publicidad, solo si se activan y el visitante acepta las cookies (ver abajo).

## Terceros que intervienen
- **HubSpot, Inc. (Estados Unidos):** CRM, formularios, agenda. Encargado.
- **Netlify, Inc. (Estados Unidos):** alojamiento del sitio. Registros técnicos del servidor.
- **Google (Workspace y Search Console):** correo y presencia en buscadores.
- **Meta Platforms (WhatsApp y, si se activa, Meta Pixel).**
- **Instituciones financieras:** cuando la empresa decide avanzar, sus datos y documentos se comparten con la institución que evalúa la operación. Hay que definir cómo se recaba el consentimiento para esta transferencia.

## Cookies y medición
- El sitio tiene un aviso de cookies con opciones separadas de **analítica** y **marketing**. Hoy está **apagado**: no se carga ninguna cookie de terceros.
- Cuando se active:
  - **Analítica:** HubSpot (cookie `hubspotutk` y similares).
  - **Marketing:** Meta Pixel 1375879946116372.
  - Solo se cargan si el visitante acepta. La elección se guarda en el navegador (`centralia-consent-v1`) y se puede cambiar.
- Autorizar el uso de datos de la consulta **no** equivale a aceptar cookies de analítica.
- Las fuentes tipográficas se sirven desde el propio sitio. No se usa Google Analytics.

## Lo que hay que definir en el texto
- Datos que se recaban y si hay datos patrimoniales o financieros (montos, ventas anuales, estados financieros y documentos que se piden en la evaluación).
- Finalidades primarias y secundarias, y el mecanismo para negarse a las secundarias.
- Transferencias que requieren consentimiento (instituciones financieras) y las que no.
- Medio y procedimiento para derechos ARCO y revocación del consentimiento (por ejemplo, solicitud a hola@centraliafinanciera.com con requisitos y plazos).
- Opciones para limitar el uso o la divulgación.
- Uso de cookies y cómo desactivarlas.
- Procedimiento para comunicar cambios al aviso y fecha de última actualización.

## Cómo se publica cuando el texto esté listo
1. Sustituir cada bloque "pendiente" en `herramientas/aviso-privacidad-cuerpo.html` por el texto aprobado.
2. Poner `PENDIENTE = False` en `herramientas/aviso-privacidad.py` y ejecutar `python3 herramientas/aviso-privacidad.py`.
3. Agregar `aviso-de-privacidad/index.html` a `PAGES` en `build.cjs` y la dirección a `sitemap.xml`.
4. Ejecutar `node build.cjs`, revisar y publicar. Las ligas actuales ya apuntan a `/aviso-de-privacidad/`.
