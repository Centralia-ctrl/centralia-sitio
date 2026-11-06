const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const site = __dirname;
const read = name => fs.readFileSync(path.join(site, name), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup() {
  const dom = new JSDOM(read('credito-empresarial.html'), {
    url: 'https://centraliafinanciera.com/credito-empresarial.html',
    runScripts: 'outside-only'
  });
  const window = dom.window;
  const document = window.document;
  const calls = [];
  let responseOk = true;
  window.matchMedia = () => ({ matches: true, addEventListener() {} });
  window.IntersectionObserver = class { observe() {} };
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new window.Event('close'));
  };
  window.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: responseOk };
  };
  for (const script of ['simulator.js', 'credit-inline-calculator.js', 'credit-project-scenes.js']) window.eval(read(script));
  const query = selector => document.querySelector(selector);
  const input = (selector, value, type = 'input') => {
    query(selector).value = value;
    query(selector).dispatchEvent(new window.Event(type, { bubbles: true }));
  };
  const submit = () => query('#sim-lead-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  const fillContact = () => {
    input('#lead-name', 'Prueba local');
    input('#lead-company', 'Empresa de prueba');
    input('#lead-email', 'qa@example.invalid');
    input('#lead-phone', '5512345678');
    query('#lead-business').checked = true;
  };
  return { window, document, query, input, submit, fillContact, calls, setResponse: value => { responseOk = value; }, close: () => dom.window.close() };
}

for (const [project, label] of [['expansion', 'Expansión'], ['inventario', 'Inventario'], ['equipo', 'Equipo y operación']]) {
  test(`${label}: the scene CTA carries the selected need into the consented HubSpot payload`, async () => {
    const page = setup();
    try {
      page.query(`[data-project="${project}"]`).click();
      page.query('#credit-project-inquiry').click();
      assert.equal(page.query('#simulator-dialog').open, true);
      assert.match(page.query('#sim-summary').textContent, new RegExp(label));
      assert.doesNotMatch(page.query('#sim-summary').textContent, /1,000,000|36 meses/);
      page.fillContact();
      page.submit();
      await flush();
      assert.equal(page.calls.length, 0, 'contact consent remains required');
      page.query('#lead-consent').checked = true;
      page.submit();
      await flush();
      const payload = page.calls[0].body;
      const message = payload.fields.find(field => field.name === 'message').value;
      assert.match(message, new RegExp(label));
      assert.match(message, /Consulta sin monto definido/);
      assert.doesNotMatch(message, /1,000,000|36 meses/);
      assert.deepEqual(payload.fields.map(field => field.name), ['email', 'firstname', 'company', 'phone', 'message']);
      assert.equal(payload.context.hutk, undefined);
      assert.match(page.calls[0].url, /1da292ee-7ccc-42e4-a427-ece646e13e65$/);
      assert.match(page.query('.sim-confirmed-scenario').textContent, new RegExp(label));
      assert.equal(page.query('#sim-credit-assumptions').hidden, true, 'the receipt does not show assumptions from an unrequested calculation');
    } finally { page.close(); }
  });
}

test('A chosen credit scenario includes the need from either the scene CTA or the calculator CTA', () => {
  const page = setup();
  try {
    page.input('#credit-inline-amount', '2000000');
    assert.equal(page.query('#credit-inline-term').disabled, true);
    assert.deepEqual([...page.query('#credit-inline-term').options].map(option => option.value), ['36']);
    page.query('[data-project="inventario"]').click();
    page.query('#credit-project-inquiry').click();
    assert.match(page.query('#sim-summary').textContent, /Inventario.*2,000,000.00.*36 meses/);
    page.query('#simulator-dialog').close();
    page.query('[data-project="equipo"]').click();
    page.query('#credit-inline-review').click();
    assert.match(page.query('#sim-summary').textContent, /Equipo y operación.*2,000,000.00.*36 meses/);
    assert.doesNotMatch(page.query('#sim-summary').textContent, /Inventario/);
  } finally { page.close(); }
});

test('An invalid edited amount returns the visitor to the calculator', () => {
  const page = setup();
  try {
    page.input('#credit-inline-amount', '0');
    page.query('#credit-project-inquiry').click();
    assert.equal(page.query('#simulator-dialog').open, false);
    assert.equal(page.document.activeElement, page.query('#credit-inline-amount'));
    assert.equal(page.calls.length, 0);
  } finally { page.close(); }
});

test('Credit accepts up to twenty million at 36 months without a guarantee selector or guarantee in the summary', () => {
  const page = setup();
  try {
    assert.equal(page.query('[data-credit-kind]'), null);
    assert.equal(page.query('#sim-credit-kind'), null);
    assert.equal(page.query('#credit-inline-range').max, '20000000');
    page.input('#credit-inline-amount', '20000000');
    assert.equal(page.query('#credit-inline-review').disabled, false);
    page.query('#credit-inline-review').click();
    assert.match(page.query('#sim-summary').textContent, /20,000,000\.00.*36 meses/);
    assert.doesNotMatch(page.query('#sim-summary').textContent, /garantía/i);
    assert.match(page.query('#sim-credit-costs').textContent, /784,657\.05/);
    page.query('#simulator-dialog').close();
    page.input('#credit-inline-amount', '20000000.01');
    assert.equal(page.query('#credit-inline-review').disabled, true);
    assert.match(page.query('#credit-inline-error').textContent, /máximo.*20 millones/);
    assert.equal(page.calls.length, 0);
  } finally { page.close(); }
});

test('Untouched credit and a later Factoraje inquiry do not inherit a visual default or a stale need', () => {
  const page = setup();
  try {
    page.query('#credit-inline-review').click();
    assert.doesNotMatch(page.query('#sim-summary').textContent, /Expansión|Inventario|Equipo y operación/);
    page.query('#simulator-dialog').close();
    page.query('[data-project="inventario"]').click();
    page.query('#credit-project-inquiry').click();
    page.query('#simulator-dialog').close();
    page.document.dispatchEvent(new page.window.CustomEvent('centralia:product-inquiry', { detail: { product: 'factoring' } }));
    assert.match(page.query('#sim-summary').textContent, /^Factoraje/);
    assert.doesNotMatch(page.query('#sim-summary').textContent, /Inventario/);
  } finally { page.close(); }
});

test('A failed submission retains need and contact details for retry, and a different need is a separate inquiry', async () => {
  const page = setup();
  try {
    page.query('[data-project="inventario"]').click();
    page.query('#credit-project-inquiry').click();
    page.fillContact();
    page.query('#lead-consent').checked = true;
    page.setResponse(false);
    page.submit();
    await flush();
    assert.equal(page.query('#sim-send-error').hidden, false);
    assert.equal(page.query('#lead-email').value, 'qa@example.invalid');
    assert.match(page.query('#sim-summary').textContent, /Inventario/);
    page.setResponse(true);
    page.submit();
    await flush();
    assert.equal(page.query('.sim-success').hidden, false);
    page.query('#simulator-dialog').close();
    page.query('[data-project="equipo"]').click();
    page.query('#credit-project-inquiry').click();
    page.submit();
    await flush();
    assert.equal(page.calls.length, 3);
    assert.match(page.calls[2].body.fields.find(field => field.name === 'message').value, /Equipo y operación/);
  } finally { page.close(); }
});

test('The credit contact step shows the chosen payment and opening fee, and editing preserves contact details', () => {
  const page = setup();
  try {
    assert.ok(page.query('#credit-inline-result').contains(page.query('#credit-inline-fee')));
    page.query('#credit-inline-review').click();
    assert.equal(page.query('#sim-credit-costs').hidden, false);
    assert.match(page.query('#sim-credit-costs').textContent, /39,232\.85/);
    assert.match(page.query('#sim-credit-costs').textContent, /50,000\.00/);
    assert.equal(page.query('#sim-back').parentElement.id, 'sim-contact-overview');
    page.fillContact();
    page.query('#sim-back').click();
    assert.equal(page.query('#simulator-dialog').open, false);
    assert.equal(page.document.activeElement, page.query('#credit-inline-amount'));
    page.input('#credit-inline-amount', '2000000');
    page.query('#credit-inline-review').click();
    assert.match(page.query('#sim-summary').textContent, /2,000,000\.00/);
    assert.match(page.query('#sim-credit-costs').textContent, /78,465\.71/);
    assert.match(page.query('#sim-credit-costs').textContent, /100,000\.00/);
    assert.equal(page.query('#lead-email').value, 'qa@example.invalid');
    assert.equal(page.calls.length, 0);
  } finally { page.close(); }
});

test('Direct inquiries and Factoraje do not inherit credit payment details or its editing control', () => {
  const page = setup();
  try {
    page.query('#credit-inline-review').click();
    page.query('#simulator-dialog').close();
    page.document.dispatchEvent(new page.window.CustomEvent('centralia:product-inquiry', { detail: { product:'credit' } }));
    assert.equal(page.query('#sim-credit-costs').hidden, true);
    assert.equal(page.query('#sim-credit-costs').textContent, '');
    assert.equal(page.query('#sim-back').closest('fieldset').id, 'sim-lead-fields');
    page.query('#simulator-dialog').close();
    page.document.dispatchEvent(new page.window.CustomEvent('centralia:factoring-review', { detail: { amount:15000, currency:'USD', days:30 } }));
    assert.equal(page.query('#sim-credit-costs').hidden, true);
    assert.equal(page.query('#simulator-dialog').dataset.product, 'factoring');
    assert.match(page.query('#sim-summary').textContent, /Factoraje.*15,000/);
    assert.match(page.query('#sim-lead-submit').textContent, /Enviar mi consulta/);
  } finally { page.close(); }
});
