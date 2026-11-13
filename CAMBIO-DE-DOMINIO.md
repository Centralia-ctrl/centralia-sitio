# Cambio de dominio: guía para quien administra el DNS

Este documento sirve para que `centraliafinanciera.com` deje de mostrar el sitio anterior (WordPress) y muestre el sitio nuevo, publicado en Netlify. No se publica: `build.cjs` solo copia las páginas aprobadas.

El cambio toma unos minutos de trabajo. La propagación del DNS puede tardar de minutos a unas horas. Si algo sale mal, se revierte restaurando los registros anteriores.

## Lo único que se cambia

Solo los registros del **sitio web**:

| Registro | Nombre | Valor |
|---|---|---|
| `A` | `@` (raíz, `centraliafinanciera.com`) | El que indique Netlify en *Domain management*. Normalmente es `75.2.60.5`. |
| `CNAME` | `www` | `centralia-sitio.netlify.app` |

Si ya existe un `A` o un `AAAA` en `@`, o un `CNAME` o `A` en `www`, apuntando al hosting del WordPress, se reemplaza. No se agregan registros duplicados.

## Lo que NO se toca

El correo `hola@centraliafinanciera.com` funciona con Google Workspace y depende de otros registros. Si se borran, el correo deja de llegar.

- Todos los registros `MX`.
- Los `TXT` de SPF (`v=spf1 …`), DKIM (`google._domainkey`), DMARC (`_dmarc`) y verificación de Google (`google-site-verification=…`). Este último también sostiene Google Search Console.
- Cualquier otro subdominio que ya exista (por ejemplo, los que use HubSpot o el correo).

## Antes del día

1. Tomar una **captura completa de la zona DNS actual**. Es el respaldo para revertir.
2. Un día antes, bajar el TTL de los dos registros web a 300 segundos, si el proveedor lo permite. Así el cambio y una posible reversa se propagan rápido.
3. Mantener el hosting del WordPress activo al menos una semana después del cambio, por si hay que regresar.
4. Confirmar con Miguel Ángel que el aviso de privacidad nuevo ya está publicado. Los formularios enlazan a `/aviso-de-privacidad/`.

## El día del cambio

1. **Netlify:** en *Domain management*, agregar `centraliafinanciera.com` y `www.centraliafinanciera.com`. Dejar `centraliafinanciera.com` como principal. Netlify muestra los valores exactos del DNS.
2. **Proveedor del DNS:** cambiar los dos registros web de la tabla de arriba.
3. **Netlify:** esperar a que emita el certificado HTTPS (*Provision certificate*) y activar *Force HTTPS*.
4. **Verificación automática:** ejecutar desde el repositorio:

   ```
   node herramientas/verificar-dominio.cjs
   ```

   Revisa las 22 páginas del sitemap (respuesta 200, canónica correcta, sin `noindex` y un H1), las imágenes para redes, `robots.txt`, el aviso de privacidad, la redirección de `http` y `www` hacia `https://centraliafinanciera.com/`, y las redirecciones del sitio anterior que están en `_redirects`. Debe terminar con **0 fallas**.

   Si la red usa proxy, se ejecuta con `NODE_USE_ENV_PROXY=1`.
5. Seguir la sección 3 de `LANZAMIENTO.md` para las pruebas manuales en celular y computadora.
6. **Search Console:** enviar `https://centraliafinanciera.com/sitemap.xml` ese mismo día.

## Si algo sale mal

- Restaurar los dos registros web con los valores de la captura. El sitio anterior vuelve a responder cuando se propaga, y con TTL de 300 segundos tarda unos minutos.
- El correo no se ve afectado si no se tocaron `MX` ni `TXT`.

## Ensayo antes del cambio

El mismo script se puede correr hoy contra la dirección de Netlify. Revisa todo menos lo que depende del DNS:

```
node herramientas/verificar-dominio.cjs https://centralia-sitio.netlify.app
```

Ensayo del 13 de noviembre de 2026: las 22 páginas, las 5 imágenes para redes y `robots.txt` están correctos. La única falla es que `/aviso-de-privacidad/` todavía no existe (borrador en PR #68, en espera del texto legal).
