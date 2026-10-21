import * as THREE from './assets/vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './assets/vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from './assets/vendor/three/RoomEnvironment.js';
import { toCreasedNormals } from './assets/vendor/three/BufferGeometryUtils.js';

const host=document.querySelector('[data-product-scene]');
if(host)startScene(host);

function startScene(host){
  const credit=host.dataset.productScene==='credit';
  const figure=host.closest('.solution-film')||host.parentElement;
  const messages=[...figure.querySelectorAll('[data-film-message]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(error){host.dataset.renderState='fallback';return;}
  renderer.setPixelRatio(2);
  renderer.setClearColor(0xffffff,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping;
  renderer.toneMappingExposure=.90;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.VSMShadowMap;
  renderer.domElement.className='product-scene-canvas';
  renderer.domElement.setAttribute('aria-hidden','true');
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-3,3,2.5,-2.5,.1,50);
  camera.position.set(credit?5.4:2.7,credit?3.6:1,8.5);
  camera.lookAt(0,credit?.05:0,0);
  const environment=new RoomEnvironment();
  const generator=new THREE.PMREMGenerator(renderer);
  const environmentMap=generator.fromScene(environment,.025, .1,100);
  scene.environment=environmentMap.texture;
  scene.environmentIntensity=.50;
  environment.dispose();generator.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0xb4c2e0,1.0));
  const key=new THREE.DirectionalLight(0xffffff,2.8);key.position.set(-3,7,6);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.radius=4;key.shadow.blurSamples=8;key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;
  key.shadow.normalBias=.025;key.shadow.bias=-.0001;key.shadow.intensity=.4;scene.add(key);
  const fill=new THREE.DirectionalLight(0xcad8ff,.45);fill.position.set(5,1,3);scene.add(fill);
  const edge=new THREE.DirectionalLight(0xffffff,1.0);edge.position.set(1,4,-4);scene.add(edge);
  const materials={
    blue:new THREE.MeshPhysicalMaterial({color:0x3158d5,roughness:.41,metalness:.05,clearcoat:.14,clearcoatRoughness:.42}),
    white:new THREE.MeshPhysicalMaterial({color:0xf4f6fc,roughness:.34,metalness:.02,clearcoat:.2,clearcoatRoughness:.4}),
    gold:new THREE.MeshPhysicalMaterial({color:0xe9bf6c,roughness:.29,metalness:.65,clearcoat:.12})
  };
  materials.blue.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 artworkPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nartworkPosition=position;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 artworkPosition;').replace('#include <color_fragment>','#include <color_fragment>\nfloat artworkShade=smoothstep(-2.0,2.0,artworkPosition.x+artworkPosition.z*0.5);\ndiffuseColor.rgb*=mix(1.25,0.72,artworkShade);');
  };
  const root=new THREE.Group();scene.add(root);
  function block(w,h,d,material,r=.075){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,5,r),material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
  const animate=credit?buildCredit(root,block,materials):buildSuppliers(root,block,materials);
  const shadowPixels=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const index=(y*128+x)*4,d=((x-63.5)/64)**2+((y-63.5)/64)**2;shadowPixels[index]=shadowPixels[index+1]=shadowPixels[index+2]=255;shadowPixels[index+3]=Math.round(100*Math.exp(-d*5));}
  const shadowTexture=new THREE.DataTexture(shadowPixels,128,128);shadowTexture.needsUpdate=true;
  const shadow=new THREE.Sprite(new THREE.SpriteMaterial({map:shadowTexture,color:0x8795ad,transparent:true,opacity:.24,depthWrite:false}));
  shadow.scale.set(4.2,.62,1);shadow.position.set(.2,credit?-1.73:-1.18,-.8);scene.add(shadow);
  let visible=false,request=null,last=null,elapsed=0,lost=false,manual=null;
  const frameControl=document.querySelector('[data-scene-time]');
  if(frameControl){frameControl.addEventListener('input',()=>{manual=Number(frameControl.value);draw(manual);update()});document.querySelector('[data-scene-play]')?.addEventListener('click',()=>{manual=null;update()});}
  const saveBlob=(blob,name)=>{const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
  document.querySelector('[data-scene-poster]')?.addEventListener('click',()=>{renderer.setClearColor(0xffffff,1);draw(manual??7);renderer.domElement.toBlob(blob=>saveBlob(blob,`centralia-${credit?'credito':'proveedores'}-poster-v9.png`));renderer.setClearColor(0xffffff,0);});
  document.querySelector('[data-scene-record]')?.addEventListener('click',event=>{
    const button=event.currentTarget;button.disabled=true;button.textContent='Grabando…';manual=null;elapsed=0;last=null;
    renderer.setClearColor(0xffffff,1);
    const stream=renderer.domElement.captureStream(30),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:8000000});
    recorder.addEventListener('dataavailable',event=>{if(event.data.size)chunks.push(event.data)});
    recorder.addEventListener('stop',()=>{saveBlob(new Blob(chunks,{type:'video/webm'}),`centralia-${credit?'credito':'proveedores'}-movimiento-v9.webm`);stream.getTracks().forEach(track=>track.stop());renderer.setClearColor(0xffffff,0);button.disabled=false;button.textContent='Guardar animación';});
    recorder.start();update();setTimeout(()=>recorder.stop(),12000);
  });
  function draw(t){
    const phase=smooth((t-3.4)/2.7)*(1-smooth((t-9)/2.6));
    animate(t,phase,reduced.matches);
    if(messages.length===2){
      messages[0].style.opacity=t<10?1-smooth((t-4.75)/.45):smooth((t-10.45)/.55);
      messages[1].style.opacity=t<10?smooth((t-5.20)/.55):1-smooth((t-10)/.45);
    }
    renderer.render(scene,camera);
    host.dataset.renderState='ready';host.dataset.scenePhase=phase>.95?'open':phase<.05?'closed':'transition';
    host.dataset.sceneTime=t.toFixed(2);
  }
  function resize(){const box=host.getBoundingClientRect();if(!box.width||!box.height)return;const height=credit?4.8:4.7;camera.left=-height*box.width/box.height/2;camera.right=-camera.left;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();renderer.setSize(box.width,box.height,false);draw(manual??(reduced.matches?7:elapsed/1000%12));}
  function tick(now){if(last!==null)elapsed+=Math.min(now-last,80);last=now;draw(elapsed/1000%12);request=requestAnimationFrame(tick);}
  function update(){const running=visible&&!document.hidden&&!reduced.matches&&!lost&&manual===null;if(running&&request===null)request=requestAnimationFrame(tick);if(!running&&request!==null){cancelAnimationFrame(request);request=null;last=null;}if(reduced.matches&&!lost)draw(7);}
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;host.dataset.renderState='fallback';update()});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;resize();update()});
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update()},{threshold:[0,.15]}).observe(host);
  resize();
}

function buildCredit(root,block,m){
  const layers=[];
  for(let i=0;i<3;i++){const plate=block(3,.30,1.82,i===1?m.white:m.blue,.075);root.add(plate);layers.push(plate);}
  const supports=[block(.075,1,.075,m.gold,.02),block(.075,1,.075,m.gold,.02)];
  supports[0].position.set(-1.16,0,-.57);supports[1].position.set(1.16,0,-.57);supports.forEach(mesh=>root.add(mesh));
  const inlay=block(2.64,.025,.035,m.gold,.01);inlay.position.set(0,.16,.72);layers[1].add(inlay);
  return(t,p,still)=>{
    const breathe=still?0:Math.sin(t*Math.PI/6);
    const space=.40+.72*p;
    layers[0].position.set(-.17*p,space,-.16*p);
    layers[1].position.set(.09*p,0,.10*p);
    layers[2].position.set(.17*p,-space,.16*p);
    layers[0].rotation.y=-.045*p;layers[2].rotation.y=.045*p;
    supports.forEach(mesh=>{mesh.scale.y=space*2;});
    root.rotation.y=-.08+breathe*.10;root.rotation.z=.025*breathe;root.position.y=.07*breathe;
  };
}

function roundedRectangle(path,w,h,r){
  const x=-w/2,y=-h/2;
  path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);
  path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);
  path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);
}

function buildSuppliers(root,block,m){
  const shape=new THREE.Shape();roundedRectangle(shape,2.9,1.62,.37);
  const hole=new THREE.Path();roundedRectangle(hole,2.13,.85,.15);shape.holes.push(hole);
  const sourceGeometry=new THREE.ExtrudeGeometry(shape,{depth:.30,bevelEnabled:true,bevelSegments:10,steps:1,bevelSize:.085,bevelThickness:.085,curveSegments:36});
  const geometry=toCreasedNormals(sourceGeometry,Math.PI/3);geometry.translate(0,0,-.15);
  const white=new THREE.Mesh(geometry,m.white),blue=new THREE.Mesh(geometry,m.blue);
  [white,blue].forEach(link=>{link.castShadow=true;link.receiveShadow=true;root.add(link)});
  const seam=block(.065,1.03,.48,m.gold,.025);seam.position.set(-1.24,0,0);blue.add(seam);
  return(t,p,still)=>{
    const wave=still?0:Math.sin(t*Math.PI/6);
    const tightening=.12*p;
    white.position.set(-1.01-tightening,.04*wave,0);
    blue.position.set(1.01+tightening,-.04*wave,0);
    white.rotation.set(-.89+.12*wave,0,0);
    blue.rotation.set(.68+.12*wave,0,0);
    root.rotation.set(0,-.14+.14*wave,.25+.035*wave);
    root.position.y=.075*wave;
  };
}
