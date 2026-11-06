import * as THREE from './assets/vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './assets/vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './assets/vendor/three/RoomEnvironment.js';
import { createExpansionNetwork } from './credit-expansion-network.js';

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
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose(); pmrem.dispose();
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 60);
  camera.position.set(7, 5.5, 8.5); camera.lookAt(0, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc7ced4, 1.0));
  const key = new THREE.DirectionalLight(0xfffaf3, 1.9);
  key.position.set(-3, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.1, far: 20 });
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.025;
  key.shadow.radius = 5; key.shadow.blurSamples = 8; scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe9f4, 0.85); fill.position.set(4, 3, -4); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.035 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.035; floor.receiveShadow = true; scene.add(floor);
  // Broad contact shadow: the artwork meets the white page without a hard silhouette.
  const shadowPixels = new Uint8Array(96 * 96 * 4);
  for (let y=0;y<96;y++) for(let x=0;x<96;x++) {
    const r=Math.hypot((x-47.5)/47.5,(y-47.5)/47.5),offset=(y*96+x)*4;
    shadowPixels[offset]=shadowPixels[offset+1]=shadowPixels[offset+2]=42;
    shadowPixels[offset+3]=Math.round(39*Math.exp(-5*r*r)*Math.max(0,1-r));
  }
  const contactTexture=new THREE.DataTexture(shadowPixels,96,96,THREE.RGBAFormat);
  contactTexture.needsUpdate=true;contactTexture.magFilter=THREE.LinearFilter;
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(6.9,4.8),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}));
  contact.rotation.x=-Math.PI/2;contact.position.y=-.025;scene.add(contact);

  const pearl = new THREE.MeshPhysicalMaterial({ color: 0xdce0e1, metalness: 0.43, roughness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.22 });
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xa5adb4, metalness: 0.8, roughness: 0.28, clearcoat: 0.2 });
  const soft = new THREE.MeshPhysicalMaterial({ color: 0xd1d4d5, metalness: 0.33, roughness: 0.32 });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x263440, metalness: 0.45, roughness: 0.3 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x536571, metalness: 0.4, roughness: 0.45 });
  const root = new THREE.Group(); scene.add(root);
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t*t*t*(t*(t*6-15)+10); };
  const phase = (t, a, b) => smooth((t - a) / (b - a));
  function box(parent, w, h, d, x, y, z, material = pearl, radius = 0.045) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(radius, w / 3, h / 3, d / 3)), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, r, h, x, y, z, material = silver) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function group(parent = root) { const g = new THREE.Group(); parent.add(g); return g; }
  function inventory() {
    // The approved pearl study has its own lighting and framing; the other
    // projects keep their existing materials, camera and animation timing.
    const inventoryScene = new THREE.Scene();
    inventoryScene.environment = environment.texture;
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

  function equipment() {
    const g=group();
    const machine=group(g);
    box(machine,3.7,.52,2.28,0,.42,0,pearl,.09);
    for(const x of [-1.45,1.45])for(const z of [-.8,.8])box(machine,.3,.17,.3,x,.085,z,graphite,.04);
    box(machine,3.1,.08,1.83,0,.72,0,silver,.025);
    // Parallel rails and a moving precision head show equipment doing work.
    for(const z of [-.65,.65]) box(machine,3.32,.055,.065,0,.8,z,dark,.015);
    const gantry=group(machine);
    box(gantry,.32,1.48,.36,0,1.49,-.91,pearl,.05);
    box(gantry,.32,1.48,.36,0,1.49,.91,pearl,.05);
    box(gantry,.4,.26,2.18,0,2.12,0,pearl,.06);
    const head=group(gantry);
    box(head,.53,.57,.48,0,1.8,0,silver,.06);
    cylinder(head,.105,.42,0,1.34,0,dark);
    cylinder(head,.035,.17,0,1.05,0,silver);
    const workpiece=box(machine,1.64,.16,1.1,0,.88,0,soft,.07);
    const grooves=[];
    for(let i=0;i<5;i++) grooves.push(box(machine,.03,.007,.77,-.6+i*.3,.963,0,graphite,.002));
    const consoleStand=box(machine,.12,.83,.12,1.75,1.04,.85,silver);
    const screen=box(machine,.52,.37,.1,1.75,1.5,.85,dark,.045); screen.rotation.y=-.2;
    const screenFace=box(machine,.39,.22,.016,1.75,1.5,.907,soft,.015); screenFace.rotation.y=-.2;
    const displayLine=box(machine,.22,.018,.008,1.75,1.52,.922,silver,.003);displayLine.rotation.y=-.2;
    const displayLine2=box(machine,.14,.018,.008,1.71,1.47,.932,graphite,.003);displayLine2.rotation.y=-.2;
    return {g,update(t){
      const ready=phase(t,0,2.7); machine.position.y=(1-ready)*.18;
      const operation=phase(t,2.7,8.6);
      gantry.position.x=-1.22+2.44*operation;
      head.position.y=(1-phase(t,2.5,3.7))*.22+phase(t,8.6,9.6)*.22;
      head.position.z=Math.sin(operation*Math.PI*4)*.28;
      workpiece.position.x=(1-phase(t,0,2.4))*(-1.55);
      grooves.forEach((mesh,i)=>{const p=phase(operation,(i+1)/6,(i+1)/6+.11);mesh.visible=p>0;mesh.scale.z=Math.max(.001,p);});
      consoleStand.visible=screen.visible=screenFace.visible=displayLine.visible=displayLine2.visible=t>1;
      displayLine2.scale.x=.35+.65*operation;
      g.rotation.y=-.04+.11*phase(t,0,8.8);
    }};
  }

  const scenes={expansion:createExpansionNetwork(renderer),inventario:inventory(),equipo:equipment()};
  let active=scenes.expansion, elapsed=10, visible=false, playing=false, frame=0, previous=0;
  const duration=()=>active.duration??10;
  Object.values(scenes).forEach(item=>{item.g.visible=false;item.update(item.duration??10);}); active.g.visible=true;
  function render(){active.update(elapsed);renderer.toneMappingExposure=active.exposure??1.08;renderer.render(active.scene||scene,active.camera||camera);}
  function stopFrame(){if(frame)cancelAnimationFrame(frame);frame=0;previous=0;}
  function tick(now){
    frame=0;
    if(!visible||!playing)return;
    if(previous){
      const next=elapsed+Math.min(.1,(now-previous)/1000);
      elapsed=active.loop?next%duration():Math.min(duration(),next);
    }
    previous=now; render();
    if(!active.loop&&elapsed>=duration()){playing=false;previous=0;onState('finished');}
    else frame=requestAnimationFrame(tick);
  }
  function schedule(){if(visible&&playing&&!frame)frame=requestAnimationFrame(tick);}
  function resize(){
    const {width,height}=host.getBoundingClientRect(); if(!width||!height)return;
    const ratio=Math.min(Math.max(window.devicePixelRatio||1,2),2.5,3840/width);
    renderer.setPixelRatio(ratio); renderer.setSize(width,height,false);
    const aspect=width/height, vertical=Math.max(4.3,7.05/aspect);
    camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;
    camera.updateProjectionMatrix();active.resize?.(aspect);render();
  }
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();stopFrame();playing=false;host.classList.remove('is-ready');onState('unavailable');
  });
  return {
    setScene(key,animate){
      stopFrame();active.g.visible=false;active=scenes[key]||scenes.expansion;active.g.visible=true;
      elapsed=animate||active.loop?0:duration();playing=animate;onState(animate?'playing':'finished');resize();schedule();
    },
    setVisible(value){visible=value;if(!value)stopFrame();else{render();schedule();}},
    toggle(){
      if(playing){playing=false;stopFrame();onState('paused');}
      else{if(elapsed>=duration())elapsed=0;playing=true;onState('playing');schedule();}
    }
  };
}
