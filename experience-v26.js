/* Local-only interactions: no storage, network calls or personal-data tracking. */
(() => {
  'use strict';
  const products = {
    credit: {name:'Crédito empresarial', page:'credito-empresarial.html', label:'Invertir en mi empresa', text:'Para una inversión en equipo, inventario o expansión, puedes empezar por conocer Crédito empresarial.'},
    factoring: {name:'Factoraje', page:'factoraje.html', label:'Anticipar facturas por cobrar', text:'Si ya entregaste y tienes facturas pendientes de cobro, puedes empezar por conocer Factoraje.'},
    suppliers: {name:'Pago a proveedores', page:'pago-a-proveedores.html', label:'Cubrir una compra', text:'Si necesitas pagar una compra antes de recibir tus cobros, puedes empezar por conocer Pago a proveedores.'}
  };
  const emit = (action, product) => document.dispatchEvent(new CustomEvent('centralia:interaction', {detail:{action,product}}));
  function calendarGap(payment, collection) {
    const parse = value => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
      const ms = Date.parse(value+'T00:00:00Z');
      return Number.isFinite(ms) && new Date(ms).toISOString().slice(0,10) === value ? ms : NaN;
    };
    return (parse(collection)-parse(payment))/86400000;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports={calendarGap,products}; return; }
  const chooser = document.querySelector('[data-need-chooser]');
  if (chooser) {
    chooser.hidden = false;
    const result = chooser.querySelector('[data-need-result]');
    chooser.querySelectorAll('[data-need]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.need, product = products[key];
      chooser.querySelectorAll('[data-need]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      result.replaceChildren();
      const p=document.createElement('p'); p.textContent=product.text;
      const view=document.createElement('a'); view.href=product.page; view.textContent='Conocer '+product.name+' →';
      const consult=document.createElement('a'); consult.href='#consulta'; consult.textContent='Compartir mi necesidad →';
      consult.addEventListener('click',()=>{
        const purpose=document.getElementById('capture-purpose'); purpose.value=product.name;
        purpose.dispatchEvent(new Event('input',{bubbles:true}));
        document.dispatchEvent(new CustomEvent('centralia:open-consultation'));
      });
      result.append(p,view,consult); result.hidden=false; emit('solution_selected',key);
    }));
  }
  const current=Object.keys(products).find(key=>location.pathname.endsWith('/'+products[key].page));
  const cases={
    credit:[
      ['Un nuevo espacio para crecer.','Abrir otra sucursal implica adecuaciones, equipo y un periodo de arranque. Conviene revisar el proyecto completo antes de definir el monto.',['La inversión','Qué necesitas para abrir y comenzar a operar.'],['El arranque','Cuándo esperas recibir ingresos de la nueva sucursal.'],['El flujo','Cómo se sostendrían los pagos durante ese periodo.']],
      ['Prepárate para tu siguiente temporada.','La mercancía se compra antes de venderse. Revisa cuánto inventario necesitas y en qué momento esperas recuperar esa inversión.',['La compra','Importe de mercancía e insumos.'],['La rotación','Cuánto tiempo tardarías en vender y cobrar.'],['El calendario','Cómo se relacionan los pagos con tus cobros previstos.']],
      ['La inversión empieza antes de producir.','Comprar una máquina también puede requerir instalación y puesta en marcha. Esos tiempos forman parte de la revisión.',['El proyecto completo','Compra, instalación y necesidades para iniciar.'],['El tiempo de arranque','Cuándo comenzaría a producir el equipo.'],['El calendario de pagos','Cómo se relacionaría con el flujo de tu empresa.']]
    ],
    factoring:[
      ['Compra antes de recibir el cobro.','Una venta ya entregada puede coexistir con la necesidad de reponer inventario. El punto de partida es la factura y su fecha prevista de cobro.'],
      ['Dale continuidad a tu operación.','Tus compromisos continúan mientras llega el cobro. Revisa la factura disponible y el importe neto que necesitarías para cubrirlos.'],
      ['Ya entregaste. Ahora viene otro pedido.','Necesitas materiales para la siguiente entrega antes de cobrar la anterior. La revisión parte de esa factura y de los tiempos del nuevo pedido.']
    ],
    suppliers:[
      ['Tu proveedor necesita el pago antes de tu próxima entrega.','Ya tienes un pedido de tu cliente, pero necesitas comprar materiales para producirlo. Tu proveedor solicita el pago antes de surtir y tu cliente pagará después de recibir. Revisamos contigo ese periodo entre compra y cobro.',['La compra','Materiales para preparar un pedido confirmado.'],['El cobro','Ingreso previsto después de entregar a tu cliente.'],['El plazo a revisar','Tiempo entre pagar los materiales y recibir ese ingreso.']],
      ['La mercancía está lista. Falta pagar al proveedor.','Tu proveedor en el extranjero pide el pago para liberar el embarque. Tu empresa recuperará la inversión al vender la mercancía. Revisamos el importe, la moneda y las fechas, incluido el tiempo de traslado.',['La compra','Importe, moneda y país del proveedor.'],['La entrega','Fecha de embarque y llegada prevista de la mercancía.'],['El cobro','Cuándo esperas vender y recibir el pago de tus clientes.']],
      ['Tus compras vencen antes de tus cobros.','Debes pagar mercancía esta semana, pero cobrarás a tus clientes más adelante. Antes de comprometer un financiamiento, revisamos si tus ingresos previstos permitirían cubrir su liquidación.',['El vencimiento','Fecha en que tu proveedor necesita recibir el pago.'],['Los ingresos','Importes y fechas de los cobros que esperas recibir.'],['La liquidación','Cómo cubrirías el financiamiento si alguno de esos cobros se retrasa.']]
    ]
  };
  const example=document.querySelector('.content-case');
  if (current && example) {
    const heading=example.querySelector('h2'), copy=example.querySelector('.content-case-story>p:not(.eyebrow)');
    const status=document.createElement('p'); status.className='sr-only'; status.setAttribute('role','status'); example.append(status);
    const link=document.createElement('a'); link.className='cx-case-link'; link.href='index.html?solucion='+current+'#consulta'; link.textContent='Cuéntanos tu necesidad →'; example.querySelector('.content-case-story').append(link);
    if(document.body.classList.contains('sales-preview')&&['credit','factoring'].includes(current)){
      link.href='#sim-contact';link.setAttribute('aria-haspopup','dialog');
      link.addEventListener('click',event=>{event.preventDefault();document.dispatchEvent(new CustomEvent('centralia:consult-product',{detail:{product:current,opener:link}}));});
    }
    if(current==='suppliers'&&document.querySelector('[data-supplier-calendar]')){
      link.href='#calendario-proveedores';link.textContent='Revisar mi compra con Centralia →';link.setAttribute('aria-haspopup','dialog');
      link.addEventListener('click',event=>{event.preventDefault();document.dispatchEvent(new CustomEvent('centralia:consult-supplier',{detail:{opener:link}}));});
    }
    document.querySelectorAll('.product-uses article').forEach((article,index)=>{
      const button=document.createElement('button'); button.type='button'; button.className='cx-case-button'; button.textContent='Ver este caso'; button.setAttribute('aria-pressed','false'); button.setAttribute('aria-controls','context-title'); button.setAttribute('aria-label','Ver caso: '+article.querySelector('h3').textContent);
      button.addEventListener('click',()=>{
        const data=cases[current][index]; heading.textContent=data[0]; copy.textContent=data[1];
        if (data.length>2) example.querySelectorAll('.content-facts>div').forEach((row,i)=>{row.querySelector('dt').textContent=data[i+2][0];row.querySelector('dd').textContent=data[i+2][1];});
        document.querySelectorAll('.cx-case-button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
        example.classList.add('cx-selected'); status.textContent='Ejemplo seleccionado: '+article.querySelector('h3').textContent;
        example.scrollIntoView({behavior:current==='credit'||matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});
        emit('use_case_selected',current);
      }); article.append(button);
    });
  }
  const planner=document.querySelector('[data-payment-planner]:not([data-supplier-calendar])');
  if (planner) {
    planner.hidden=false;
    const payment=planner.querySelector('[name=payment]'), collection=planner.querySelector('[name=collection]'), output=planner.querySelector('output'), button=planner.querySelector('button');
    const now=new Date(), today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    payment.min=collection.min=today;
    const update=()=>{
      const days=calendarGap(payment.value,collection.value);
      const valid=Number.isFinite(days)&&payment.value>=today&&collection.value>=today;
      button.disabled=!valid;
      output.replaceChildren();
      if(!payment.value||!collection.value){output.textContent='Elige las dos fechas para comparar tu calendario.';return;}
      if(!valid){output.textContent='Revisa las fechas. Usa hoy o una fecha futura para planear tu operación.';return;}
      const strong=document.createElement('strong'); strong.textContent=days>0?days+' '+(days===1?'día entre pago y cobro':'días entre pago y cobro'):days===0?'Pago y cobro el mismo día':'Tu cobro está previsto antes del pago';
      const note=document.createElement('span');note.textContent=days>0?'Este es el intervalo que necesitas revisar con tu flujo de efectivo.':'Las fechas por sí solas no muestran una diferencia que financiar. Revisa también importes y disponibilidad de efectivo.';
      output.append(strong,note);
    };
    [payment,collection].forEach(input=>input.addEventListener('change',update));
    button.addEventListener('click',()=>{update();if(button.disabled)return;document.dispatchEvent(new CustomEvent('centralia:provider-scenario',{detail:{payment:payment.value,collection:collection.value,days:calendarGap(payment.value,collection.value)}}));emit('calendar_consultation','suppliers');});
    update();
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('cx-in-view',e.isIntersecting&&!reduced.matches)),{threshold:.6});
    document.querySelectorAll('.product-process>li').forEach(el=>{el.classList.add('cx-process-step');observer.observe(el);});
  }
})();
