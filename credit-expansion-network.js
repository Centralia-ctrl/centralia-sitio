import * as THREE from './assets/vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './assets/vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './assets/vendor/three/RoomEnvironment.js';

// Approved study 11: a headquarters connects to three new branches in ten seconds.
export function createExpansionNetwork(renderer) {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 80);
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(room, 0.035);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  generator.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6dadd, 0.9));
  const key = new THREE.DirectionalLight(0xfffcf9, 1.75);
  key.position.set(-3.5, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left:-7, right:7, top:7, bottom:-7, near:0.1, far:35 });
  Object.assign(key.shadow, { normalBias:0.02, bias:-0.00012, radius:8, blurSamples:12 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf4f7ff, 0.45);
  fill.position.set(5, 4, -5);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity:0.05 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.035;
  floor.receiveShadow = true;
  scene.add(floor);

  const pearl = new THREE.MeshPhysicalMaterial({ color:0xdde1df, roughness:0.26, metalness:0.3, clearcoat:0.42, clearcoatRoughness:0.2 });
  const porcelain = new THREE.MeshPhysicalMaterial({ color:0xf0f0eb, roughness:0.35, metalness:0.12, clearcoat:0.25 });
  const aluminum = new THREE.MeshPhysicalMaterial({ color:0xbec7cd, roughness:0.32, metalness:0.7, clearcoat:0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color:0x9baab3, roughness:0.21, metalness:0.42, clearcoat:0.55 });
  const recess = new THREE.MeshStandardMaterial({ color:0x82919a, roughness:0.55, metalness:0.25 });

  function makeGroup(parent) {
    const object = new THREE.Group();
    parent.add(object);
    return object;
  }
  function box(parent, width, height, depth, x, y, z, material = pearl, radius = 0.025) {
    const geometry = new RoundedBoxGeometry(width, height, depth, 6, Math.min(radius, width / 5, height / 5, depth / 5));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function path(start, end, width) {
    const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const pivot = makeGroup(group);
    pivot.position.set(start[0], 0.112, start[1]);
    pivot.rotation.y = -Math.atan2(end[1] - start[1], end[0] - start[0]);
    box(pivot, distance, 0.012, width, distance / 2, 0, 0, aluminum, 0.003);
    return progress => { pivot.scale.x = Math.max(0.001, progress); };
  }
  function revealVertically(building, height) {
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.1);
    building.traverse(object => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      object.material.clippingPlanes = [plane];
      object.material.clipShadows = true;
    });
    return progress => {
      building.visible = progress > 0.001;
      plane.constant = 0.1 + height * progress;
    };
  }
  function pavilion(width, height, depth) {
    const building = makeGroup(group);
    box(building, width + 0.1, 0.07, depth + 0.1, 0, 0.135, 0, porcelain);
    box(building, width, height, 0.075, 0, 0.17 + height / 2, -depth / 2 + 0.035, pearl);
    box(building, 0.075, height, depth, -width / 2 + 0.035, 0.17 + height / 2, 0, pearl);
    box(building, width - 0.12, height - 0.16, 0.025, 0, 0.17 + height / 2, depth / 2 - 0.04, glass, 0.004);
    for (const fraction of [-0.45, -0.15, 0.15, 0.45]) {
      box(building, 0.022, height - 0.08, 0.035, width * fraction, 0.17 + height / 2, depth / 2 - 0.018, aluminum, 0.004);
    }
    box(building, width - 0.08, 0.035, 0.05, 0, 0.2, depth / 2 - 0.01, pearl, 0.004);
    box(building, 0.025, height - 0.15, depth - 0.12, width / 2 - 0.035, 0.17 + height / 2, 0, glass, 0.004);
    for (const fraction of [-0.35, 0, 0.35]) {
      box(building, 0.03, height - 0.06, 0.025, width / 2 - 0.01, 0.17 + height / 2, depth * fraction, aluminum, 0.004);
    }
    box(building, width + 0.06, 0.045, depth + 0.06, 0, height + 0.17, 0, recess, 0.01);
    box(building, width + 0.2, 0.075, depth + 0.2, 0, height + 0.23, 0, porcelain);
    box(building, width * 0.25, 0.025, 0.008, -width * 0.27, height * 0.82, depth / 2 + 0.01, aluminum, 0.002);
    return building;
  }
  function phase(time, start, end) {
    const progress = Math.min(1, Math.max(0, (time - start) / (end - start)));
    return progress ** 3 * (progress * (6 * progress - 15) + 10);
  }

  box(group, 6.8, 0.1, 5.15, 0, 0.05, 0, porcelain, 0.035);
  const headquarters = pavilion(2.05, 1.55, 1.4);
  headquarters.position.z = -1.47;
  const trunk = path([0, -0.72], [0, 0.45], 0.05);
  const branches = [-2.25, 0, 2.25].map((x, index) => {
    const branch = pavilion(1.45, 1.0, 1.25);
    branch.position.set(x, 0, 1.5);
    return {
      reveal:revealVertically(branch, 1.32),
      cross:path([0, 0.43], [x || 0.001, 0.43], 0.038),
      approach:path([x, 0.43], [x, 0.84], 0.038),
      start:0.16 + index * 0.18
    };
  });

  const bounds = new THREE.Box3().setFromObject(group);
  const target = bounds.getCenter(new THREE.Vector3());
  camera.position.copy(target).add(new THREE.Vector3(7.0, 5.1, 10.4));
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const framing = { horizontal:0, vertical:0 };
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
        framing.horizontal = Math.max(framing.horizontal, Math.abs(corner.x));
        framing.vertical = Math.max(framing.vertical, Math.abs(corner.y));
      }
    }
  }
  return {
    g:group,
    scene,
    camera,
    duration:10,
    exposure:1.02,
    resize(aspect) {
      const halfHeight = Math.max(framing.vertical, framing.horizontal / aspect) * 1.1;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    },
    update(seconds) {
      const time = seconds / 10;
      trunk(phase(time, 0.04, 0.26));
      branches.forEach(({ reveal, cross, approach, start }) => {
        cross(phase(time, start, start + 0.13));
        approach(phase(time, start + 0.1, start + 0.21));
        reveal(phase(time, start + 0.16, start + 0.4));
      });
    }
  };
}
