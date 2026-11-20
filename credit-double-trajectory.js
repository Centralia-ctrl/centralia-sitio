import * as THREE from './assets/vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './assets/vendor/three/RoundedBoxGeometry.js';

// Approved Doble trayectoria study, isolated from the other project scenes.
export function createDoubleTrajectory(environmentMap) {
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,80);
scene.environment=environmentMap;scene.environmentIntensity=.72;
scene.add(new THREE.HemisphereLight(0xffffff,0xc3cad1,.65));
const key=new THREE.DirectionalLight(0xfffcf7,2.2);key.position.set(-3,7,4.5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:6,bottom:-6,near:.1,far:30});Object.assign(key.shadow,{normalBias:.012,bias:-.0001,radius:7,blurSamples:12});scene.add(key);
const fill=new THREE.DirectionalLight(0xeaf0ff,.32);fill.position.set(5,4,-5);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.10}));floor.rotation.x=-Math.PI/2;floor.position.y=-.022;floor.receiveShadow=true;scene.add(floor);
const pearl=new THREE.MeshPhysicalMaterial({color:0xdce1e0,metalness:.4,roughness:.26,clearcoat:.3,clearcoatRoughness:.28});
const silver=new THREE.MeshPhysicalMaterial({color:0xaab6bf,metalness:.78,roughness:.27,clearcoat:.18,anisotropy:.18});
// A satin edge gives the existing thin deck definition on the white page.
const edge=pearl.clone();edge.color.copy(silver.color);edge.metalness=.55;edge.roughness=.30;
const porcelain=new THREE.MeshPhysicalMaterial({color:0xf0f0ec,metalness:.18,roughness:.3,clearcoat:.24});
const dark=new THREE.MeshPhysicalMaterial({color:0x243847,metalness:.65,roughness:.32});
const clamp=t=>Math.max(0,Math.min(1,Number.isFinite(t)?t:0));
const smooth=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
const wrap=t=>((t%1)+1)%1;
function group(parent){const g=new THREE.Group();parent.add(g);return g}
function mesh(g,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
function box(g,w,h,d,x=0,y=0,z=0,mat=pearl,r=.025){return mesh(g,new RoundedBoxGeometry(w,h,d,5,Math.min(r,w/3,h/3,d/3)),mat,x,y,z)}
function spline(points){const p=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),false,'centripetal');p.arcLengthDivisions=800;return p}
function tube(g,path,r=.007){return mesh(g,new THREE.TubeGeometry(path,192,r,12,false),silver)}
function edgeFade(u){return smooth((u-.045)/.115)*smooth((.955-u)/.115)}
function fadeGroup(g){const materials=[];g.traverse(m=>{if(!m.isMesh)return;m.material=m.material.clone();m.material.transparent=true;materials.push(m.material)});return opacity=>{opacity=clamp(opacity);g.visible=opacity>.002;materials.forEach(m=>{m.opacity=opacity;m.depthWrite=opacity>.995})}}
const routePoint=new THREE.Vector3(),routeTangent=new THREE.Vector3(),routeSide=new THREE.Vector3(),routeUp=new THREE.Vector3(),routeMatrix=new THREE.Matrix4();
function follow(piece,path,u){u=clamp(u);path.getPointAt(u,routePoint);path.getTangentAt(u,routeTangent).normalize();routeSide.set(-routeTangent.z,0,routeTangent.x).normalize();routeUp.crossVectors(routeSide,routeTangent).normalize();piece.position.copy(routePoint).addScaledVector(routeUp,.046);piece.quaternion.setFromRotationMatrix(routeMatrix.makeBasis(routeTangent,routeUp,routeSide))}
function buildTrajectory(){
  const g=group(scene);
  const outline=new THREE.Shape();outline.moveTo(-3,-.43);outline.lineTo(-.95,-.43);outline.bezierCurveTo(-.15,-.43,.72,-1.35,3,-1.35);outline.lineTo(3,-.55);outline.bezierCurveTo(1.52,-.55,.75,-.28,.2,0);outline.bezierCurveTo(.75,.28,1.52,.55,3,.55);outline.lineTo(3,1.35);outline.bezierCurveTo(.72,1.35,-.15,.43,-.95,.43);outline.lineTo(-3,.43);outline.closePath();
  // Same silhouette; total deck thickness falls from .131 to .078.
  const deckGeometry=new THREE.ExtrudeGeometry(outline,{depth:.05,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:5,curveSegments:80});deckGeometry.rotateX(-Math.PI/2);deckGeometry.translate(0,.21,0);const deck=mesh(g,deckGeometry,[pearl,edge]);deck.name='deck';
  for(const [x,z] of [[-2.5,0],[2.4,-.93],[2.4,.93]]){box(g,.48,.07,.43,x,.035,z,porcelain,.025);box(g,.19,.126,.27,x,.133,z,silver,.02)}
  const paths=[-1,1].map(side=>spline([[-3,.274,0],[-.85,.274,0],[.8,.274,side*.66],[3,.274,side*.95]]));
  for(const side of [-1,1])tube(g,spline([[-2.8,.269,side*.36],[-.8,.269,side*.36],[.9,.269,side*.99],[2.85,.269,side*1.25]]));
  const pieces=Array.from({length:3},(_,i)=>{const p=group(g);p.name='piece-'+i;box(p,.52,.085,.46,0,0,0,silver,.025);box(p,.4,.012,.34,0,.0485,0,pearl,.005);for(const z of [-.138,.138])box(p,.30,.006,.012,0,.0575,z,dark,.003);return {p,fade:fadeGroup(p),lane:i%2}});
  function update(t){t=clamp(t);pieces.forEach(({p,fade,lane},i)=>{const u=wrap(t+i/3+.16);follow(p,paths[lane],u);fade(edgeFade(u))})}
  update(0);
  return {g,update,pieces,paths,deck,outline};
}
const art=buildTrajectory();
const shadowData=new Uint8Array(128*128*4);
for(let y=0;y<128;y++)for(let x=0;x<128;x++){const r=Math.hypot((x-63.5)/63.5,(y-63.5)/63.5),k=(y*128+x)*4;shadowData[k]=shadowData[k+1]=shadowData[k+2]=42;shadowData[k+3]=Math.round(34*Math.exp(-5*r*r)*Math.max(0,1-r))}
const shadowTexture=new THREE.DataTexture(shadowData,128,128,THREE.RGBAFormat);shadowTexture.needsUpdate=true;shadowTexture.magFilter=THREE.LinearFilter;
const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(7.5,4),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false}));contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=-.012;scene.add(contactShadow);
let fit={x:3.5,y:2};
function fitArt(){const times=Array.from({length:31},(_,i)=>i/30),bounds=new THREE.Box3();for(const t of times){art.update(t);art.g.updateMatrixWorld(true);bounds.union(new THREE.Box3().setFromObject(art.g))}const center=bounds.getCenter(new THREE.Vector3());camera.position.copy(center).add(new THREE.Vector3(5.1,7.1,9.4));camera.lookAt(center);camera.updateMatrixWorld();fit={x:0,y:0};for(const t of times){art.update(t);art.g.updateMatrixWorld(true);art.g.traverse(m=>{if(!m.geometry)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).applyMatrix4(m.matrixWorld).applyMatrix4(camera.matrixWorldInverse);fit.x=Math.max(fit.x,Math.abs(p.x));fit.y=Math.max(fit.y,Math.abs(p.y))}})}contactShadow.position.set(center.x,-.012,center.z);art.update(0)}

fitArt();
return {
  g:art.g,scene,camera,exposure:1.02,loop:true,duration:10,
  resize(aspect){const half=Math.max(fit.y,fit.x/aspect)*1.12;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();},
  update(seconds){art.update((((Number.isFinite(seconds)?seconds:0)%10)+10)%10/10);}
};
}
