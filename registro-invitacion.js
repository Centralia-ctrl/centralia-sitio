/* Private registration invitation (invitacion-registro.html).
   A Centralia advisor shares this page only after reviewing the case with the person; nothing in the
   site's inquiry flow links or redirects here. The link carries only a destination id
   (?destino=<id>), never personal data. The destination, its domain and its registration link come
   only from DESTINOS below: confirmed by Centralia, https, and the link's host equal to the domain
   shown. An unknown or missing id shows no registration button. */
(() => {
  'use strict';
  // Empty until Centralia confirms a destination. Shape: id: {nombre, dominio, url}.
  const DESTINOS = {};
  function destination(search, list = DESTINOS) {
    const id = new URLSearchParams(search || '').get('destino') || '';
    if (!/^[a-z0-9-]{1,40}$/.test(id) || !Object.prototype.hasOwnProperty.call(list, id)) return null;
    const entry = list[id];
    let url;
    try { url = new URL(entry.url); } catch { return null; }
    if (url.protocol !== 'https:' || url.hostname !== entry.dominio || url.username || url.password) return null;
    return {id, nombre: entry.nombre, dominio: entry.dominio, url: url.href};
  }
  function init(doc, env, list = DESTINOS) {
    const found = destination(env.location.search, list);
    const ready = doc.getElementById('invitation-ready'), missing = doc.getElementById('invitation-missing');
    if (!ready || !missing) return;
    if (!found) { ready.hidden = true; missing.hidden = false; return; }
    doc.querySelectorAll('[data-destination-name]').forEach(node => { node.textContent = found.nombre; });
    doc.querySelectorAll('[data-destination-domain]').forEach(node => { node.textContent = found.dominio; });
    doc.getElementById('invitation-continue').href = found.url;
    missing.hidden = true; ready.hidden = false;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {destination, init, DESTINOS};
  else init(document, window);
})();
