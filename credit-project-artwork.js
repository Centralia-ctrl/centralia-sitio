import * as THREE from './assets/vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './assets/vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './assets/vendor/three/RoomEnvironment.js';
import { createExpansionNetwork } from './credit-expansion-network.js';
import { createDoubleTrajectory } from './credit-double-trajectory.js';

// Local study: restrained sequences with a pace suited to each business need.
export function createProjectArtwork(host, onState = () => {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setClearColor(0xffffff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  let environment;
  const yieldToPage = () => new Promise(resolve => setTimeout(resolve, 0));
  function environmentTexture() {
    if (!environment) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04);
      room.dispose(); pmrem.dispose();
    }
    return environment.texture;
  }
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t*t*t*(t*(t*6-15)+10); };
  function inventory() {
    // The approved pearl study has its own lighting and framing; the other
    // projects keep their existing materials, camera and animation timing.
    const inventoryScene = new THREE.Scene();
    inventoryScene.environment = environmentTexture();
    inventoryScene.environmentIntensity = 0.85;
    const inventoryGroup = new THREE.Group();
    inventoryScene.add(inventoryGroup);
    const inventoryCamera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 80);
    const target = new THREE.Vector3(0, 0.62, 0);
    inventoryCamera.position.copy(target).add(new THREE.Vector3(6.3, 4.2, 10.8));
    inventoryCamera.lookAt(target);
    inventoryCamera.updateMatrixWorld();
    inventoryScene.add(new THREE.HemisphereLight(0xffffff, 0xd0d3d8, 1));
    const inventoryKey = new THREE.DirectionalLight(0xfffcf8, 1.8);
    inventoryKey.position.set(-3, 8, 4);
    inventoryKey.castShadow = true;
    inventoryKey.shadow.mapSize.set(2048, 2048);
    Object.assign(inventoryKey.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.1, far: 30 });
    Object.assign(inventoryKey.shadow, { normalBias: 0.035, bias: -0.00015, radius: 7, blurSamples: 12 });
    inventoryScene.add(inventoryKey);
    const inventoryFill = new THREE.DirectionalLight(0xf0f3ff, 0.5);
    inventoryFill.position.set(5, 4, -5);
    inventoryScene.add(inventoryFill);
    const inventoryFloor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.065 }));
    inventoryFloor.rotation.x = -Math.PI / 2;
    inventoryFloor.position.y = -0.03;
    inventoryFloor.receiveShadow = true;
    inventoryScene.add(inventoryFloor);

    const inventoryPearl = new THREE.MeshPhysicalMaterial({ color: 0xe0e2de, roughness: 0.3, metalness: 0.2, clearcoat: 0.38, clearcoatRoughness: 0.23 });
    const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xf0f0ed, roughness: 0.33, metalness: 0.09, clearcoat: 0.2 });
    const inventorySilver = new THREE.MeshStandardMaterial({ color: 0xc1c7cb, roughness: 0.4, metalness: 0.62 });
    const inset = new THREE.MeshStandardMaterial({ color: 0xc9cdce, roughness: 0.57, metalness: 0.22 });
    function polishedBox(parent, width, height, depth, x, y, z, material, radius) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 6, Math.min(radius, width / 5, height / 5, depth / 5)), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    polishedBox(inventoryGroup, 6.3, 0.12, 1.38, 0, 0.1, 0, porcelain, 0.045);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext('2d');
    const gradient = shadowContext.createRadialGradient(64, 64, 12, 64, 64, 63);
    gradient.addColorStop(0, 'rgba(35,42,55,0.24)');
    gradient.addColorStop(0.4, 'rgba(35,42,55,0.16)');
    gradient.addColorStop(0.75, 'rgba(35,42,55,0.045)');
    gradient.addColorStop(1, 'rgba(35,42,55,0)');
    shadowContext.fillStyle = gradient;
    shadowContext.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const count = 6, spacing = 1.1, speed = 0.42, loopLength = count * spacing;
    const packages = Array.from({ length: count }, () => {
      const pack = new THREE.Group();
      const materials = [inventoryPearl, inventorySilver, inset].map(material => {
        const local = material.clone();
        local.transparent = true;
        local.depthWrite = false;
        return local;
      });
      polishedBox(pack, 0.83, 1.08, 0.83, 0, 0.54, 0, materials[0], 0.045);
      polishedBox(pack, 0.012, 0.003, 0.71, 0, 1.0815, 0, materials[2], 0.001);
      polishedBox(pack, 0.18, 0.035, 0.004, -0.17, 0.77, 0.417, materials[1], 0.001);
      pack.children.forEach(mesh => { mesh.castShadow = false; });
      const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.22), shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.002;
      pack.add(shadow);
      pack.userData.fadeMaterials = [...materials, shadowMaterial];
      pack.position.y = 0.162;
      inventoryGroup.add(pack);
      return pack;
    });
    const framing = { horizontal: 0, vertical: 0 };
    for (const x of [-3.3, 3.3]) for (const y of [0, 1.3]) for (const z of [-0.75, 0.75]) {
      const corner = new THREE.Vector3(x, y, z).applyMatrix4(inventoryCamera.matrixWorldInverse);
      framing.horizontal = Math.max(framing.horizontal, Math.abs(corner.x));
      framing.vertical = Math.max(framing.vertical, Math.abs(corner.y));
    }
    return {
      g: inventoryGroup,
      scene: inventoryScene,
      camera: inventoryCamera,
      exposure: 1.04,
      loop: true,
      duration: loopLength / speed,
      resize(aspect) {
        const halfHeight = Math.max(framing.vertical, framing.horizontal / aspect) * 1.1;
        inventoryCamera.left = -halfHeight * aspect;
        inventoryCamera.right = halfHeight * aspect;
        inventoryCamera.top = halfHeight;
        inventoryCamera.bottom = -halfHeight;
        inventoryCamera.updateProjectionMatrix();
      },
      update(time) {
        const distance = (time * speed) % loopLength;
        packages.forEach((pack, index) => {
          const x = (index * spacing + spacing / 2 + distance) % loopLength - loopLength / 2;
          const opacity = smooth((3.05 - Math.abs(x)) / 0.85);
          pack.position.x = x;
          pack.userData.fadeMaterials.forEach(material => { material.opacity = opacity; });
          pack.visible = opacity > 0.001;
        });
      }
    };
  }

  // Keep the approved figures and materials. Allocate only the chosen scene.
  const factories = {
    expansion: () => createExpansionNetwork(renderer),
    inventario: inventory,
    equipo: () => createDoubleTrajectory(environmentTexture())
  };
  const scenes = new Map();
  let active, elapsed = 0, visible = false, playing = false, frame = 0, previous = 0, revision = 0;
  const duration = () => active?.duration ?? 10;
  async function prepare(key) {
    if (!scenes.has(key)) scenes.set(key, (async () => {
      await yieldToPage();
      const item = factories[key]();
      item.update(item.duration ?? 10);
      await yieldToPage();
      // Compile the selected scene's programs without waiting synchronously
      // for every shader to finish. The poster stays visible throughout.
      if (renderer.compileAsync) await renderer.compileAsync(item.scene, item.camera);
      await yieldToPage();
      return item;
    })());
    return scenes.get(key);
  }
  function render() {
    if (!active) return;
    active.update(elapsed);
    renderer.toneMappingExposure = active.exposure ?? 1.08;
    renderer.render(active.scene, active.camera);
  }
  function stopFrame() { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function tick(now) {
    frame = 0;
    if (!visible || !playing || !active) return;
    if (previous) {
      const next = elapsed + Math.min(.1, (now - previous) / 1000);
      elapsed = active.loop ? next % duration() : active.continuous ? next : Math.min(duration(), next);
    }
    previous = now; render();
    if (!active.loop && !active.continuous && elapsed >= duration()) { playing = false; previous = 0; onState('finished'); }
    else frame = requestAnimationFrame(tick);
  }
  function schedule() { if (visible && playing && active && !frame) frame = requestAnimationFrame(tick); }
  function resize() {
    if (!active) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5, 3840 / width);
    renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
    active.resize?.(width / height);
    render();
  }
  new ResizeObserver(resize).observe(host);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stopFrame(); playing = false;
    host.classList.remove('is-ready'); onState('unavailable');
  });
  return {
    async setScene(key, animate) {
      const request = ++revision;
      stopFrame(); playing = false;
      const item = await prepare(factories[key] ? key : 'expansion');
      if (request !== revision) return;
      active = item;
      elapsed = animate || active.loop ? 0 : duration();
      playing = animate;
      resize(); onState(animate ? 'playing' : 'finished'); schedule();
    },
    setVisible(value) { visible = value; if (!value) stopFrame(); else schedule(); },
    toggle() {
      if (playing) { playing = false; stopFrame(); onState('paused'); }
      else { if (elapsed >= duration()) elapsed = 0; playing = true; onState('playing'); schedule(); }
    }
  };
}
