/* Prepared measurement. Intentionally OFF; no requests, cookies or queues while off.
   Activation also needs verified account IDs, consent UI, and reviewed CSP domains.
   This does not control the independent, user-submitted HubSpot Forms API. */
(function () {
  'use strict';
  const SETTINGS = Object.freeze({
    enabled: false,
    metaPixelId: '1375879946116372',
    hubspotPortalId: '9145352',
    hosts: ['centraliafinanciera.com', 'www.centraliafinanciera.com']
  });
  function start(env, settings = SETTINGS) {
    if (settings.enabled !== true || env.location.protocol !== 'https:' || !settings.hosts.includes(env.location.hostname)) return;
    if (env.__centraliaMeasurementStarted) return;
    env.__centraliaMeasurementStarted = true;
    const doc = env.document;
    let marketing = false, analytics = false, metaLoaded = false, hubspotLoaded = false;
    let marketingRevoked = false, analyticsRevoked = false;
    const leads = new Set();
    const categories = {'/credito-empresarial.html': 'Credito empresarial', '/factoraje.html': 'Factoraje', '/pago-a-proveedores.html': 'Pago a proveedores'};
    const category = categories[env.location.pathname] || 'Centralia';
    function script(id, src) {
      if (doc.getElementById(id)) return;
      const element = doc.createElement('script'); element.id = id; element.async = true; element.src = src;
      doc.head.append(element);
    }
    function loadMeta() {
      if (metaLoaded) return;
      // Avoid a second Pixel installed by another tag manager.
      if (env.fbq) return;
      const fbq = env.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      env._fbq = fbq; fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      fbq('set', 'autoConfig', false, settings.metaPixelId);
      fbq('consent', 'grant');
      fbq('init', settings.metaPixelId);
      fbq('track', 'PageView');
      script('centralia-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
      metaLoaded = true;
    }
    function loadHubSpot() {
      if (hubspotLoaded) return;
      env.hsConversationsSettings = {loadImmediately: false};
      script('hs-script-loader', 'https://js.hs-scripts.com/' + settings.hubspotPortalId + '.js');
      hubspotLoaded = true;
    }
    // Intentionally not connected to the contact/processing checkbox.
    // Future consent manager must dispatch separate analytics/marketing choices.
    doc.addEventListener('centralia:measurement-consent', event => {
      const choice = event.detail || {};
      marketing = choice.marketing === true && !marketingRevoked;
      analytics = choice.analytics === true && !analyticsRevoked;
      if (marketing) loadMeta();
      else if (metaLoaded) { env.fbq('consent', 'revoke'); marketingRevoked = true; }
      if (analytics) loadHubSpot();
      else if (hubspotLoaded) {
        (env._hsq = env._hsq || []).push(['doNotTrack']);
        (env._hsp = env._hsp || []).push(['revokeCookieConsent']);
        analyticsRevoked = true;
      }
      // A revoked channel stays off until the next page load; do not replay earlier events.
    });
    doc.addEventListener('click', event => {
      if (!marketing || !metaLoaded) return;
      const link = event.target && event.target.closest && event.target.closest('a');
      if (!link) return;
      let url;
      try { url = new URL(link.getAttribute('href'), env.location.href); } catch { return; }
      let name;
      if (url.protocol === 'https:' && ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) name = 'WhatsAppClick';
      else if (url.protocol === 'https:' && ['meetings.hubspot.com', 'meetings-na1.hubspot.com', 'meetings-eu1.hubspot.com'].includes(url.hostname)) name = 'MeetingLinkClick';
      else if (['tel:', 'mailto:'].includes(url.protocol)) name = 'ContactLinkClick';
      if (name) env.fbq('trackCustom', name, {content_category: category});
      // Never send the link's phone, email, query string, or prefilled message.
    }, true);
    // Only fixed labels cross the measurement boundary. No DOM text or visitor input.
    const interactionNames = {solution_selected:'SolutionSelected',use_case_selected:'UseCaseSelected',calendar_consultation:'CalendarConsultation',form_started:'FormStarted',form_step_completed:'FormStepCompleted'};
    const productNames = {home:'Portada',credit:'Credito empresarial',factoring:'Factoraje',suppliers:'Pago a proveedores'};
    doc.addEventListener('centralia:interaction', event => {
      if (!marketing || !metaLoaded) return;
      const detail=event.detail||{};
      if(!Object.hasOwn(interactionNames,detail.action)||!Object.hasOwn(productNames,detail.product))return;
      env.fbq('trackCustom',interactionNames[detail.action],{content_category:productNames[detail.product]});
    });
    doc.addEventListener('centralia:lead-confirmed' , event => {
      if (!marketing || !metaLoaded) return;
      const detail = event.detail || {};
      const labels = {'home': 'Formulario portada', 'simulator-credit': 'Simulador credito', 'simulator-factoring': 'Simulador factoraje', 'supplier-calendar': 'Calendario proveedores'};
      if (!Object.hasOwn(labels, detail.source) || typeof detail.submissionId !== 'string') return;
      const key = detail.source + ':' + detail.submissionId;
      if (leads.has(key)) return;
      leads.add(key);
      env.fbq('track', 'Lead', {content_name: labels[detail.source]});
      // Only a HubSpot Forms API success emits this event. No amounts or contact data.
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {start, SETTINGS};
  else start(window);
})();
