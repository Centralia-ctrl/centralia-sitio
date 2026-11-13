const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(file = 'credito-empresarial.html') {
  const dom = new JSDOM(read(file), {url:'https://centraliafinanciera.com/' + file, runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window, d = w.document, calls = [];
  let response = true, resolvePending;
  w.matchMedia = () => ({matches:true, addEventListener(){}});
  w.HTMLElement.prototype.scrollIntoView = function() {};
  w.HTMLDialogElement.prototype.showModal = function() { this.open = true; };
  w.HTMLDialogElement.prototype.close = function() { this.open = false; this.dispatchEvent(new w.Event('close')); };
  w.fetch = async (url, options) => {
    calls.push({url, body:JSON.parse(options.body)});
    if (response === 'pending') return new Promise(resolve => { resolvePending = resolve; });
    return {ok:response};
  };
  w.eval(read('simulator.js'));
  const $ = selector => d.querySelector(selector);
  const open = (type = 'credit', extra = {}) => {
    $('#simulator-dialog').close();
    const detail = type === 'credit' ? {amount:1000000, months:36, ...extra} : type === 'factoring'
      ? {amount:1000000, currency:'MXN', days:30, ...extra} : {kind:'term-example', amount:10000000, currency:'MXN', days:30, ...extra};
    d.dispatchEvent(new w.CustomEvent(type === 'suppliers' ? 'centralia:provider-scenario' : 'centralia:' + type + '-review', {detail}));
  };
  const fill = () => {
    $('#lead-name').value = 'Prueba local'; $('#lead-company').value = 'Empresa de prueba';
    $('#lead-email').value = 'qa@example.invalid'; $('#lead-phone').value = '5512345678';
    $('#lead-business').checked = true; $('#lead-consent').checked = true;
  };
  const submit = () => $('#sim-lead-form').dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  return {w,d,$,calls,open,fill,submit,setResponse:value => {response = value;},resolve:() => resolvePending({ok:true}),close:() => w.close()};
}

test('Credit details unlock only after a consented, accepted submission; failure preserves data and retries', async () => {
  const p = setup();
  try {
    p.open(); p.fill();
    const detail = p.$('#sim-delivered-details');
    assert.equal(detail.hidden, true); assert.equal(detail.children.length, 0);
    p.$('#lead-consent').checked = false; p.submit(); await flush();
    assert.equal(p.calls.length, 0);
    p.$('#lead-consent').checked = true; p.setResponse(false); p.submit(); await flush();
    assert.equal(detail.hidden, true); assert.equal(detail.children.length, 0);
    assert.equal(p.$('#lead-email').value, 'qa@example.invalid');
    assert.equal(p.$('#sim-send-error').hidden, false);
    p.setResponse('pending'); p.submit(); await flush();
    assert.equal(detail.hidden, true, 'pending is not successful');
    p.resolve(); await flush();
    assert.equal(detail.hidden, false); assert.equal(detail.querySelectorAll('tbody tr').length, 36);
    assert.equal(p.$('.sim-success').contains(detail), false, '36 rows must not enter the live status region');
    assert.equal(p.d.activeElement, p.$('.sim-success'));
    assert.deepEqual(p.calls[1].body.fields.map(x => x.name), ['email','firstname','company','phone','message']);
    assert.equal(p.calls[1].body.context.hutk, undefined);
    assert.match(p.calls[1].url, /9145352\/1da292ee-7ccc-42e4-a427-ece646e13e65$/);
    assert.match(detail.textContent, /no equivale al CAT ni a una cotización aprobada/);
  } finally { p.close(); }
});

test('Changing scenario clears the table; a confirmed repeat needs no duplicate submission', async () => {
  const p = setup();
  try {
    p.open(); p.fill(); p.submit(); await flush();
    p.open(); assert.equal(p.$('#sim-delivered-details').hidden, true);
    p.submit(); await flush();
    assert.equal(p.calls.length, 1); assert.equal(p.$('#sim-delivered-details').hidden, false);
    p.open('credit', {amount:2000000});
    assert.equal(p.$('#sim-delivered-details').children.length, 0);
    p.setResponse(false); p.submit(); await flush();
    assert.equal(p.$('#sim-delivered-details').hidden, true);
  } finally { p.close(); }
});

for (const amount of [0.01, 750000.50, 1000000, 20000000]) {
  test(`Amortization ${amount}: exact principal, zero final balance, opening fee separate`, () => {
    const p = setup();
    try {
      const result = p.w.CENTRALIA_SIMULATION.amortization(amount, 36);
      assert.equal(result.rows.length, 36);
      assert.equal(result.rows.reduce((sum,row) => sum + row.principal, 0), Math.round(amount * 100));
      assert.equal(result.rows[35].balance, 0);
      assert.equal(result.commission, Math.round(amount * 100 * .05));
      assert.equal(result.payments, result.capital + result.interest);
      assert.equal(result.total, result.payments + result.commission);
      let balance = result.capital;
      for (const row of result.rows) {
        assert.equal(row.interest, Math.round(balance * .02));
        assert.equal(row.payment, row.interest + row.principal);
        assert.equal(row.balance, balance - row.principal);
        assert.ok(row.balance >= 0); balance = row.balance;
      }
      assert.throws(() => p.w.CENTRALIA_SIMULATION.amortization(amount, 24));
    } finally { p.close(); }
  });
}

test('Factoraje delivers the chosen currency and remnant without inventing costs or installments', async () => {
  const p = setup('factoraje.html');
  try {
    p.open('factoring', {amount:100000.01, currency:'USD', days:45}); p.fill(); p.submit(); await flush();
    const detail = p.$('#sim-delivered-details');
    assert.equal(detail.hidden, false); assert.match(detail.textContent, /USD.*100,000.01/);
    assert.match(detail.textContent, /85,000.01/); assert.match(detail.textContent, /15,000.00/);
    assert.match(detail.textContent, /45 días/); assert.equal(detail.querySelector('table'), null);
    assert.doesNotMatch(detail.textContent, /2%|5% de apertura|Mensualidades/);
  } finally { p.close(); }
});

test('Suppliers deliver the chosen day-based scenario, with no opening fee or monthly schedule', async () => {
  const p = setup('pago-a-proveedores.html');
  try {
    p.open('suppliers', {amount:750000.50, days:21}); p.fill(); p.submit(); await flush();
    const detail = p.$('#sim-delivered-details');
    assert.equal(detail.hidden, false); assert.match(detail.textContent, /7,875.01/);
    assert.match(detail.textContent, /757,875.51/); assert.match(detail.textContent, /21 días/);
    assert.match(detail.textContent, /Sin comisión/); assert.equal(detail.querySelector('table'), null);
  } finally { p.close(); }
});

test('A direct inquiry without a chosen amount never inherits a previous amortization', async () => {
  const p = setup();
  try {
    p.open(); p.fill(); p.submit(); await flush();
    p.$('#simulator-dialog').close();
    p.d.dispatchEvent(new p.w.CustomEvent('centralia:product-inquiry', {detail:{product:'credit', project:'inventario'}}));
    p.submit(); await flush();
    assert.equal(p.$('.sim-success').hidden, false);
    assert.equal(p.$('#sim-delivered-details').hidden, true);
    assert.equal(p.$('#sim-delivered-details').children.length, 0);
    assert.match(p.calls[1].body.fields.find(x => x.name === 'message').value, /sin importe/);
  } finally { p.close(); }
});

test('Older simulator entry points show a basic estimate, not the full interest and payment breakdown', () => {
  const p = setup('index.html');
  try {
    p.$('#simulator-form').dispatchEvent(new p.w.Event('submit', {bubbles:true, cancelable:true}));
    const text = p.$('#sim-results').textContent;
    assert.match(text, /Mensualidad estimada/); assert.match(text, /Apertura/);
    assert.doesNotMatch(text, /Suma de mensualidades|Intereses estimados del plazo|Total parcial/);
    assert.equal(p.$('#sim-delivered-details').children.length, 0);
  } finally { p.close(); }
});

test('How it works observes the actual three steps and reveals each once', () => {
  const p = setup();
  try {
    const observed = [], removed = []; let callback;
    p.w.IntersectionObserver = class {
      constructor(cb) { callback = cb; }
      observe(node) { observed.push(node); }
      unobserve(node) { removed.push(node); }
    };
    p.w.eval(read('experience-v26.js'));
    assert.equal(observed.length, 3);
    callback(observed.map(target => ({target, isIntersecting:true, intersectionRatio:.1})));
    assert.equal(removed.length, 0);
    callback(observed.map(target => ({target, isIntersecting:true, intersectionRatio:.6})));
    assert.equal(removed.length, 3); assert.ok(observed.every(node => node.classList.contains('cx-in-view')));
  } finally { p.close(); }
});

test('Simulator feedback respects reduced motion and never submits the form', async () => {
  const p = setup();
  try {
    const animations = []; const media = {matches:true, addEventListener(){}};
    p.w.matchMedia = () => media;
    p.w.HTMLElement.prototype.getClientRects = () => [{}];
    p.w.HTMLElement.prototype.animate = function() { animations.push(this.id); return {cancel(){},finished:Promise.resolve()}; };
    p.w.eval(read('interaction-motion.js')); await flush();
    const update = text => {
      p.$('#credit-inline-payment').textContent = text;
      p.$('#credit-inline-amount').dispatchEvent(new p.w.Event('input', {bubbles:true}));
    };
    update('$50,000'); await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(animations.length, 0);
    media.matches = false;
    update('$60,000'); await new Promise(resolve => setTimeout(resolve, 150));
    assert.ok(animations.includes('credit-inline-payment')); assert.equal(p.calls.length, 0);
  } finally { p.close(); }
});
