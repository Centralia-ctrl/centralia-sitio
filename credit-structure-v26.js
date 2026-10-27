/* Approved architectural arches: native 3D with a sharp SVG fallback. */
(async () => {
  'use strict';
  const art = document.querySelector('[data-credit-structure]');
  if (!art) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const messages = [...art.closest('.solution-film').querySelectorAll('[data-film-message]')];
  const smooth = n => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n); };
  let visible = false, elapsed = 0, last = null, frame = null;
  let renderer, scene, camera, arches, rail, contextLost = false;

  try {
    const T = await import('./assets/vendor/three/three.module.min.js');
    renderer = new T.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    scene = new T.Scene();
    camera = new T.OrthographicCamera(-3, 3, 2.5, -2.5, .1, 50);
    camera.position.set(-7, 5, 14);
    camera.lookAt(1.6, 1.5, .4);
    const pmrem = new T.PMREMGenerator(renderer);
    const studio = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(20, 16, 20), new T.MeshBasicMaterial({color:0xbfc4ce, side:T.BackSide}));
    studio.add(room);
    for (const [x, y, z, width, height] of [[-5,6,4,5,8], [5,4,-3,3,6], [0,7,0,6,4]]) {
      const panel = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({color:new T.Color(4,4,4), side:T.DoubleSide}));
      panel.position.set(x,y,z);
      panel.lookAt(0,1,0);
      studio.add(panel);
    }
    scene.environment = pmrem.fromScene(studio, .04).texture;
    scene.environmentIntensity = .7;
    studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0xe4e7ee, 1.5));
    const key = new T.DirectionalLight(0xffffff, 2);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {left:-6, right:6, top:6, bottom:-6, near:.1, far:20});
    key.shadow.bias = -.0005;
    key.shadow.normalBias = .025;
    key.shadow.radius = 4;
    scene.add(key);
    const floor = new T.Mesh(new T.PlaneGeometry(30, 30), new T.ShadowMaterial({color:0x303647, opacity:.045}));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.045;
    floor.receiveShadow = true;
    scene.add(floor);
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = contactCanvas.height = 128;
    const contactContext = contactCanvas.getContext('2d');
    const contactGradient = contactContext.createRadialGradient(64,64,4,64,64,64);
    contactGradient.addColorStop(0,'rgba(48,54,71,.4)');
    contactGradient.addColorStop(.45,'rgba(48,54,71,.12)');
    contactGradient.addColorStop(1,'rgba(48,54,71,0)');
    contactContext.fillStyle = contactGradient;
    contactContext.fillRect(0,0,128,128);
    const contactTexture = new T.CanvasTexture(contactCanvas);

    function arch(height, color) {
      const w = 2.52, h = height, beam = .43, r = .16, inner = .12;
      const s = new T.Shape();
      s.moveTo(-w/2, 0);
      s.lineTo(-w/2, h-r);
      s.quadraticCurveTo(-w/2, h, -w/2+r, h);
      s.lineTo(w/2-r, h);
      s.quadraticCurveTo(w/2, h, w/2, h-r);
      s.lineTo(w/2, 0);
      s.lineTo(w/2-beam, 0);
      s.lineTo(w/2-beam, h-beam-inner);
      s.quadraticCurveTo(w/2-beam, h-beam, w/2-beam-inner, h-beam);
      s.lineTo(-w/2+beam+inner, h-beam);
      s.quadraticCurveTo(-w/2+beam, h-beam, -w/2+beam, h-beam-inner);
      s.lineTo(-w/2+beam, 0);
      s.closePath();
      const geometry = new T.ExtrudeGeometry(s, {depth:.36, bevelEnabled:true, bevelSegments:4, steps:1, bevelSize:.028, bevelThickness:.028, curveSegments:18});
      const material = new T.MeshStandardMaterial({color, metalness:.22, roughness:.3});
      const mesh = new T.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      for (const x of [-w/2+beam/2, w/2-beam/2]) {
        const contact = new T.Mesh(new T.PlaneGeometry(.9,.9), new T.MeshBasicMaterial({map:contactTexture, transparent:true, depthWrite:false}));
        contact.rotation.x = -Math.PI/2;
        contact.position.set(x,-.034,.18);
        mesh.add(contact);
      }
      scene.add(mesh);
      return mesh;
    }
    arches = [arch(3.2, 0x1b224e), arch(2.93, 0xf4f5f7), arch(2.68, 0xa9afba)];
    rail = new T.Mesh(new T.BoxGeometry(.14, .035, 1), new T.MeshStandardMaterial({color:0x1b224e, metalness:.24, roughness:.35}));
    rail.position.set(.25, -.005, 0);
    rail.castShadow = true;
    scene.add(rail);
    renderer.domElement.className = 'credit-arches-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    art.append(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      contextLost = true;
      art.classList.remove('has-credit-3d');
      update();
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      contextLost = false;
      resize();
      update();
    });
    function resize() {
      const width = art.clientWidth, height = art.clientHeight;
      if (!width || !height) return;
      const aspect = width / height, span = Math.max(4.55, 5.9 / aspect);
      camera.left = -span * aspect / 2; camera.right = span * aspect / 2;
      camera.top = span / 2; camera.bottom = -span / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      draw(elapsed / 1000);
    }
    new ResizeObserver(resize).observe(art);
    resize();
  } catch {
    // The SVG remains visible if WebGL or the local module cannot load.
    renderer?.dispose();
    renderer?.domElement.remove();
    renderer = null;
    return;
  }

  function draw(seconds) {
    if (!renderer || !arches || contextLost) return;
    const t = seconds % 12;
    const open = reduced.matches ? 1 : smooth((t - 1.2) / 3.6) * (1 - smooth((t - 9) / 2.5));
    const gap = 1.2 + .55 * open;
    arches.forEach((arch, i) => { arch.position.set(i * gap, 0, 1.3 - i * .55); });
    rail.scale.z = Math.hypot(gap * 2, 1.1) + .7;
    rail.rotation.y = Math.atan2(gap * 2, -1.1);
    rail.position.set(gap, -.005, .75);
    art.dataset.phase = open > .98 ? 'expanded' : open < .02 ? 'compact' : 'opening';
    if (messages.length === 2) {
      messages[0].style.opacity = reduced.matches ? 1 : t < 10 ? 1 - smooth((t - 4.75) / .45) : smooth((t - 10.45) / .55);
      messages[1].style.opacity = reduced.matches ? 0 : t < 10 ? smooth((t - 5.2) / .55) : 1 - smooth((t - 10) / .45);
    }
    renderer.render(scene, camera);
    art.classList.add('has-credit-3d');
  }
  function tick(now) {
    if (last !== null) elapsed += Math.min(now - last, 100);
    last = now;
    draw(elapsed / 1000);
    frame = requestAnimationFrame(tick);
  }
  function update() {
    const run = visible && !document.hidden && !reduced.matches && !contextLost;
    if (run && frame === null) frame = requestAnimationFrame(tick);
    if (!run && frame !== null) { cancelAnimationFrame(frame); frame = null; last = null; }
    if (reduced.matches) draw(0);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && e.intersectionRatio >= .15;
    update();
  }, {threshold: [0, .15]}).observe(art);
  else { visible = true; update(); }
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  draw(0);
})();
