/* Crédito empresarial welcome: two curved pieces, satin blue and pearl, approach and part on a 12 s cycle.
   Geometry, materials, lights, shadows and motion follow the approved reference; the HTML messages keep
   the page's existing timing and the pieces run on the same clock. The poster image stays visible until
   the first frame renders, and remains if WebGL is unavailable. */
import * as T from './assets/vendor/three/three.module.min.js';

const art = document.querySelector('[data-credit-contrapeso]');
if (art) start(art);

function start(art) {
  const canvas = art.querySelector('canvas');
  const messages = [...art.closest('.solution-film').querySelectorAll('[data-film-message]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = n => { n = clamp(n, 0, 1); return n * n * (3 - 2 * n); };
  let scene = null, visible = false, elapsed = 0, last = null, frame = null;

  // Same message timing as before the new illustration.
  function setMessages(t) {
    if (messages.length !== 2) return;
    messages[0].style.opacity = reduced.matches ? 1 : t < 10 ? 1 - smooth((t - 4.75) / .45) : smooth((t - 10.45) / .55);
    messages[1].style.opacity = reduced.matches ? 0 : t < 10 ? smooth((t - 5.2) / .55) : 1 - smooth((t - 10) / .45);
  }
  function draw(seconds) {
    const t = seconds % 12;
    setMessages(t);
    if (scene) scene.draw(t);
  }
  function tick(now) {
    if (last !== null) elapsed += Math.min(now - last, 150);
    last = now; draw(elapsed / 1000); frame = requestAnimationFrame(tick);
  }
  function update() {
    const run = visible && !document.hidden && !reduced.matches;
    if (run && frame === null) frame = requestAnimationFrame(tick);
    if (!run && frame !== null) { cancelAnimationFrame(frame); frame = null; last = null; }
    if (reduced.matches) draw(0);
  }

  // Without WebGL the poster stays and only the messages move.
  const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  try { scene = webgl ? build(canvas) : null; } catch { scene = null; }
  if (scene) {
    const resize = () => { scene.resize(art.clientWidth, art.clientHeight); draw(elapsed / 1000); };
    new ResizeObserver(resize).observe(art);
    resize();
    art.classList.add('is-rendered');
    canvas.addEventListener('webglcontextlost', () => { scene = null; art.classList.remove('is-rendered'); });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting && e.intersectionRatio >= .15; update(); }, {threshold: [0, .15]}).observe(art);
  else { visible = true; update(); }
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  draw(0);
}

function build(canvas) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: false, powerPreference: 'low-power'});
  renderer.setClearColor('#ffffff');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;

  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-3, 3, 3, -3, .1, 40);
  camera.position.set(4.8, 2.8, 8.6);
  camera.lookAt(0, .07, 0);

  scene.add(new T.HemisphereLight('#ffffff', '#97a6c1', 1));
  const key = new T.DirectionalLight('#ffffff', 2.2);
  key.position.set(-4, 6, 7);
  scene.add(key);
  const fill = new T.DirectionalLight('#e5edff', .38);
  fill.position.set(4, 1, 4);
  scene.add(fill);

  const environment = new T.Scene();
  environment.add(new T.Mesh(new T.SphereGeometry(12, 32, 24), new T.MeshBasicMaterial({color: '#a3afc3', side: T.BackSide})));
  function softbox(w, h, xyz, color) {
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({color, side: T.DoubleSide}));
    mesh.position.set(...xyz);
    mesh.lookAt(0, 0, 0);
    environment.add(mesh);
  }
  softbox(5, 9, [-5, 4, 3], '#ffffff');
  softbox(2.5, 8, [5, 1, 2], '#e5edff');
  softbox(9, 4, [0, 8, -1], '#ffffff');
  softbox(8, 8, [0, 0, -7], '#52627b');
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, .08, .1, 30).texture;
  pmrem.dispose();

  const blue = new T.MeshPhysicalMaterial({color: '#ffffff', vertexColors: true, metalness: .20, roughness: .43, clearcoat: .025, clearcoatRoughness: .5, envMapIntensity: .65});
  const pearl = new T.MeshPhysicalMaterial({color: '#e3e9f3', metalness: .30, roughness: .38, clearcoat: .02, envMapIntensity: .85});

  // A thin curved band with both faces and closed edges.
  function curvedShell(sign, material) {
    const U = 128, V = 28, N = (U + 1) * (V + 1);
    const points = new Float32Array(N * 3), normals = new Float32Array(N * 3), positions = new Float32Array(N * 6);
    const indices = [], colors = [];
    for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
      const u = i / U, v = j / V, a = (u - .5) * 2.25, r = .80 + (v - .5) * .44, n = (i * (V + 1) + j) * 3;
      points[n] = r * Math.cos(a) * sign;
      points[n + 1] = (u - .5) * 2.65;
      points[n + 2] = r * Math.sin(a);
    }
    for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
      const n = (i * (V + 1) + j) * 3;
      const up = (Math.min(i + 1, U) * (V + 1) + j) * 3, down = (Math.max(i - 1, 0) * (V + 1) + j) * 3;
      const right = (i * (V + 1) + Math.min(j + 1, V)) * 3, left = (i * (V + 1) + Math.max(j - 1, 0)) * 3;
      const a = new T.Vector3(points[up] - points[down], points[up + 1] - points[down + 1], points[up + 2] - points[down + 2]);
      const b = new T.Vector3(points[right] - points[left], points[right + 1] - points[left + 1], points[right + 2] - points[left + 2]);
      const normal = a.cross(b).normalize();
      normal.toArray(normals, n);
      for (let side = 0; side < 2; side++) {
        const m = n + side * N * 3, s = side ? -1 : 1;
        positions[m] = points[n] + normal.x * .012 * s;
        positions[m + 1] = points[n + 1] + normal.y * .012 * s;
        positions[m + 2] = points[n + 2] + normal.z * .012 * s;
      }
    }
    for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j, b = a + V + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1, a + N, a + 1 + N, b + N, b + N, a + 1 + N, b + 1 + N);
    }
    const edge = (a, b) => indices.push(a, a + N, b, b, a + N, b + N);
    for (let i = 0; i < U; i++) { edge(i * (V + 1), (i + 1) * (V + 1)); edge((i + 1) * (V + 1) + V, i * (V + 1) + V); }
    for (let j = 0; j < V; j++) { edge(j + 1, j); edge(U * (V + 1) + j, U * (V + 1) + j + 1); }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    if (sign === 1) {
      const light = new T.Color('#7298ff'), deep = new T.Color('#2033ae');
      for (let i = 0; i < N * 2; i++) {
        const n = i * 3, k = clamp(.51 + positions[n + 1] * .20 - positions[n] * .11, 0, 1);
        const c = deep.clone().lerp(light, k);
        colors.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    }
    return new T.Mesh(geo, material);
  }

  const group = new T.Group();
  scene.add(group);
  const pieces = [curvedShell(1, blue), curvedShell(-1, pearl)];
  pieces.forEach(mesh => group.add(mesh));
  group.scale.setScalar(1.15);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 256;
  const ctx = shadowCanvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 126);
  g.addColorStop(0, 'rgba(37,49,78,.18)');
  g.addColorStop(.35, 'rgba(37,49,78,.065)');
  g.addColorStop(1, 'rgba(37,49,78,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new T.CanvasTexture(shadowCanvas);
  const shadows = pieces.map(() => {
    const mesh = new T.Mesh(new T.PlaneGeometry(2.5, 1.8), new T.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false, toneMapped: false, opacity: .85}));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1.72;
    scene.add(mesh);
    return mesh;
  });

  return {
    draw(t) {
      const q = t / 12 * Math.PI * 2, open = .5 - .5 * Math.cos(q);
      pieces.forEach((mesh, i) => {
        const sign = i ? -1 : 1;
        mesh.position.set(sign * (.24 + .13 * open), sign * .032 * Math.sin(q), 0);
        mesh.rotation.z = sign * (.16 + .055 * open);
        shadows[i].position.x = sign * (.80 + .13 * open);
        shadows[i].material.opacity = .80 - sign * .025 * Math.sin(q);
      });
      group.rotation.y = .035 * Math.sin(q);
      group.position.y = .03;
      renderer.render(scene, camera);
    },
    resize(w, h) {
      w = w || 470; h = h || 520;
      renderer.setSize(w, h, false);
      // Closer framing than the reference (4.3) for presence comparable to Factoraje; the view is
      // centered on the pieces and their shadow so neither touches the edge.
      const vertical = Math.max(3.95, 3.55 * h / w), horizontal = vertical * w / h, center = -.32;
      camera.left = -horizontal / 2; camera.right = horizontal / 2;
      camera.top = center + vertical / 2; camera.bottom = center - vertical / 2;
      camera.updateProjectionMatrix();
    }
  };
}
