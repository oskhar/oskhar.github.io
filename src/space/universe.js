import * as THREE from 'three';
import { HomeOrbitHighlight } from './home-orbit.js';
import { createReturnRoute } from './return-route.js';
import { addLandingBerth } from './landing.js';
import { CockpitRig } from './cockpit.js';
import { DestinationWorld } from './worlds.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const destinations = [
 {position:[18,-5,-48],radius:16,color:0x77b8d8,type:'earth'},
 {position:[-85,65,-210],radius:19,color:0xbb9bdc,type:'gas'},
 {position:[85,46,-185],radius:22,color:0xd5a078,type:'desert'},
 {position:[-48,-30,-190],radius:18,color:0x6fb5bd,type:'ice'},
 {position:[8,40,-100],radius:7,color:0xc6d4dc,type:'station'}
];
const vertex = `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=(modelViewMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*vec4(vPosition,1.);}`;
const fragment = `uniform vec3 color;varying vec3 vNormal;varying vec3 vPosition;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(-vPosition))),3.6);gl_FragColor=vec4(color,rim*.65);}`;
function rng(seed=81){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function texture(type) {
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;
 const ctx=canvas.getContext('2d'),image=ctx.createImageData(canvas.width,canvas.height);
 const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
 const hash=(x,y,z)=>{const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n);};
 function noise(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),u=smooth(x-X),v=smooth(y-Y),w=smooth(z-Z);return mix(mix(mix(hash(X,Y,Z),hash(X+1,Y,Z),u),mix(hash(X,Y+1,Z),hash(X+1,Y+1,Z),u),v),mix(mix(hash(X,Y,Z+1),hash(X+1,Y,Z+1),u),mix(hash(X,Y+1,Z+1),hash(X+1,Y+1,Z+1),u),v),w);}
 function fbm(x,y,z){let sum=0,weight=.55;for(let o=0;o<5;o++){sum+=noise(x,y,z)*weight;x=x*2.03+13.1;y=y*2.03+7.8;z=z*2.03+3.2;weight*=.48;}return sum;}
 const palettes={earth:[[11,33,50],[44,73,65],[130,142,124]],gas:[[46,37,58],[107,90,116],[170,150,162]],desert:[[76,43,32],[151,95,65],[205,166,124]],ice:[[26,57,68],[69,113,125],[177,203,207]]};
 for(let y=0;y<canvas.height;y++){
  const lat=(y/canvas.height)*Math.PI;
  for(let x=0;x<canvas.width;x++){
   const lon=x/canvas.width*Math.PI*2,px=Math.sin(lat)*Math.cos(lon),py=Math.cos(lat),pz=Math.sin(lat)*Math.sin(lon);
   const n=fbm(px*3+10,py*3+10,pz*3+10),detail=noise(px*95+10,py*95+10,pz*95+10);let color;
   const p=palettes[type];
   if(type==='earth'){
    const land=smooth(THREE.MathUtils.clamp((n-.47)*18,0,1));const height=THREE.MathUtils.clamp((n-.5)*5,0,1);const ground=p[1].map((a,k)=>mix(a,p[2][k],height));color=p[0].map((a,k)=>mix(a+detail*8,ground[k],land));
    const cloud=THREE.MathUtils.clamp((fbm(px*8+40,py*13+40,pz*8+40)-.56)*5,0,.65);color=color.map(a=>mix(a,218,cloud));if(Math.abs(py)>.94)color=color.map(a=>mix(a,205,(Math.abs(py)-.94)*14));
   }else{
    const band=type==='gas'?.5+.28*Math.sin(py*65+n*13)+.15*Math.sin(py*170+n*8):n;
    const value=THREE.MathUtils.clamp(band,0,1);color=p[0].map((a,k)=>value<.5?mix(a,p[1][k],value*2):mix(p[1][k],p[2][k],(value-.5)*2));color=color.map(a=>a+(detail-.5)*9);
   }
   const offset=(y*canvas.width+x)*4;image.data[offset]=color[0];image.data[offset+1]=color[1];image.data[offset+2]=color[2];image.data[offset+3]=255;
  }
 }
 ctx.putImageData(image,0,0);const t=new THREE.CanvasTexture(canvas);t.encoding=THREE.sRGBEncoding;return t;
}
export class Universe {
 constructor(canvas,{onNear,onMode,onReady,onExhibit}) {
  this.onNear=onNear;this.onMode=onMode;this.onExhibit=onExhibit;this.language='en';this.worlds=new Map();this.modelCache=new Map();this.assetPromises=[];this.pointer=new THREE.Vector2(0,0);this.raycaster=new THREE.Raycaster();this.currentTarget=-1;this.canvas=canvas;this.keys=new Set();this.active=false;this.mode='orbit';this.near=-1;this.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.low=innerWidth<760;this.look={yaw:0,pitch:0};this.stick={x:0,y:0};this.clock=new THREE.Clock();
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:!this.low,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1.25:1.75));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputEncoding=THREE.sRGBEncoding;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#050810');this.camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,1600);this.camera.position.set(0,2,24);this.camera.rotation.order='YXZ';
  this.orbitScene=this.scene;this.orbit=new THREE.Group();this.scene.add(this.orbit);this.scene.add(new THREE.HemisphereLight(0xa9caff,0x101018,.25));
  const sun=new THREE.DirectionalLight(0xffe6cb,3.2);sun.position.set(-90,50,40);sun.userData.shadowEligible=true;sun.castShadow=!this.low;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.camera.far=220;sun.shadow.bias=-.001;this.scene.add(sun);
  const blue=new THREE.DirectionalLight(0x5483c9,.35);blue.position.set(50,-20,-30);this.scene.add(blue);
  this.homeRings=[];this.homeTime=0;this.planets=[];destinations.forEach((d,i)=>{
   const g=new THREE.Group();g.userData.destination=i;g.position.fromArray(d.position);this.orbit.add(g);
   if(d.type==='station')this.createStation(g);else {
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(d.radius,64,48),new THREE.MeshStandardMaterial({map:texture(d.type),roughness:.9,metalness:.05}));g.add(sphere);this.planets.push(sphere);
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(d.radius*1.035,48,32),new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{color:{value:new THREE.Color(d.color)}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.FrontSide}));g.add(atmosphere);
    if(i===1||i===3){
     const ringCanvas=document.createElement('canvas');ringCanvas.width=256;ringCanvas.height=1;const c=ringCanvas.getContext('2d');const rr=rng(42);for(let x=0;x<256;x++){c.fillStyle=`rgba(180,170,153,${rr()*.5+.08})`;c.fillRect(x,0,1,1);}
     const geo=new THREE.RingGeometry(d.radius*1.35,d.radius*2.05,160);const pos=geo.attributes.position,uv=geo.attributes.uv;for(let n=0;n<pos.count;n++){const v=new THREE.Vector3().fromBufferAttribute(pos,n);uv.setXY(n,(v.length()-d.radius*1.35)/(d.radius*.7),.5);}
     const ring=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(ringCanvas),side:THREE.DoubleSide,transparent:true,opacity:.7,roughness:1,depthWrite:false}));ring.rotation.x=-1.1;ring.rotation.y=.2;g.add(ring);this.homeRings.push(ring);
    }
   }
   // A physical beacon: the interface projects its position into an accessible label.
   d.anchor=new THREE.Vector3(d.position[0],d.position[1]+d.radius+4,d.position[2]);
  });
  this.homeOrbit=new HomeOrbitHighlight(this.orbitScene,destinations,this.orbit.children);this.stars();this.bind();this.animate();onReady();
 }
 stars(){
  const random=rng(129),count=this.low?1700:4500,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let i=0;i<count;i++){const theta=random()*Math.PI*2,z=random()*2-1,r=350+random()*350,s=Math.sqrt(1-z*z);positions.set([r*s*Math.cos(theta),r*z,r*s*Math.sin(theta)],i*3);const color=new THREE.Color().setHSL(.55+random()*.16,.1+random()*.25,.35+random()*.5);colors.set([color.r,color.g,color.b],i*3);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));this.starField=new THREE.Points(geo,new THREE.PointsMaterial({size:this.low?.7:.48,vertexColors:true,sizeAttenuation:true,transparent:true,opacity:.9}));this.scene.add(this.starField);
  // Distant galactic dust, kept sparse to preserve the night sky.
  const dustGeo=new THREE.BufferGeometry(),dust=[];for(let i=0;i<1200;i++){const x=(random()-.5)*900;dust.push(x,(random()-.5)*35+x*.26,-330-random()*100);}dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));this.scene.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x6982b0,size:1.3,transparent:true,opacity:.12,depthWrite:false})));
 }
 createStation(g){
  const material=new THREE.MeshStandardMaterial({color:0x56616f,metalness:.8,roughness:.35});
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(2,2,12,12),material);hub.rotation.z=Math.PI/2;g.add(hub);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(6,.45,10,90),material);ring.rotation.y=.35;g.add(ring);
  for(let i=0;i<4;i++){const a=i*Math.PI/2,arm=new THREE.Mesh(new THREE.BoxGeometry(.2,11,.2),material);arm.rotation.z=a;g.add(arm);}
  for(const x of [-9,9]){const panel=new THREE.Mesh(new THREE.BoxGeometry(5,.12,8),new THREE.MeshStandardMaterial({color:0x193c61,metalness:.8,roughness:.3}));panel.position.x=x;g.add(panel);for(let i=-3;i<=3;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(5,.14,.025),material);line.position.set(x,0,i);g.add(line);}}
  for(const x of [-4,4]){const light=new THREE.Mesh(new THREE.TorusGeometry(2.05,.045,6,48),new THREE.MeshBasicMaterial({color:0x8fe9ef}));light.rotation.y=Math.PI/2;light.position.x=x;g.add(light);}
 }
 loadModel(path){
  if(!this.modelCache.has(path))this.modelCache.set(path,new Promise(async resolve=>{
   try{const loader=path.endsWith('.fbx')?new (await import('three/examples/jsm/loaders/FBXLoader.js')).FBXLoader():new GLTFLoader();loader.load(`${import.meta.env.BASE_URL}${path}`,result=>resolve(result.scene||result),undefined,()=>resolve(null));}catch{resolve(null);}
  }));
  return this.modelCache.get(path);
 }
 aimAt(x,y){
  if(this.mode!=='orbit')return -1;this.pointer.set(x/innerWidth*2-1,1-y/innerHeight*2);this.camera.updateMatrixWorld();this.orbitScene.updateMatrixWorld(true);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.orbit.children,true);let selected=-1;
  for(const hit of hits){let o=hit.object;while(o&&o.userData.destination===undefined)o=o.parent;if(o){selected=o.userData.destination;break;}}
  this.currentTarget=selected;this.onNear(selected);return selected;
 }
 setLanguage(language){this.language=language;for(const world of this.worlds.values())world.setLanguage(language);}
 prepareWorld(i){
  if(!this.worlds.has(i))this.worlds.set(i,new DestinationWorld(i,this.language,this));
  addLandingBerth(this.worlds.get(i));
  return Promise.all([...this.assetPromises]).then(()=>this.worlds.get(i));
 }
 beginFlight(i){
  if(this.mode!=='orbit')this.home();this.release();this.travel=null;this.suspended=true;this.mode='flight';this.scene=this.orbitScene;this.keys.clear();this.stick={x:0,y:0};this.camera.rotation.set(this.look.pitch,this.look.yaw,0,'YXZ');
  const d=destinations[i],windowOrigin=this.camera.position.clone(),quaternion=this.camera.quaternion.clone(),backward=new THREE.Vector3(0,0,1).applyQuaternion(quaternion),origin=windowOrigin.clone().addScaledVector(backward,1.5),target=new THREE.Vector3(...d.position),radial=origin.clone().sub(target).normalize();
  const endpoint=target.clone().addScaledVector(radial,d.radius*(i===4?3:1.35));
  this.flightTravel={index:i,origin,windowOrigin,endpoint,target,quaternion,progress:0,reveal:0};
  this.flightCabin=new THREE.Group();this.flightCabin.name='spacecraft-cabin';this.flightCabin.position.copy(origin);this.flightCabin.quaternion.copy(quaternion);this.orbitScene.add(this.flightCabin);
  this.cockpit=new CockpitRig(this.camera);this.flightCabin.add(this.cockpit.group);this.camera.fov=58;this.camera.updateProjectionMatrix();this.pointerChanged=false;
  return this.flightTravel;
 }
 beginReturn(){
  const world=this.world;if(!world)return false;addLandingBerth(world);world.endReading();this.release();this.travel=null;this.seated=false;this.keys.clear();this.stick={x:0,y:0};this.suspended=true;this.mode='flight';
  for(const item of world.interactables){item.halo.visible=false;item.marker.visible=false;item.cue.visible=false;}
  const berth=world.berth,z=berth.z,seat=berth.position.clone(),target=new THREE.Vector3(...destinations[world.index].position),endpoint=new THREE.Vector3(0,2,25.5),radial=endpoint.clone().sub(target).normalize();
  const exit=world.index===0?new THREE.Vector3(0,1.65,5.95):new THREE.Vector3(0,1.85,11.3);
  const nearHatch=this.camera.position.distanceTo(berth.boarding.anchor.position)<3,approachDuration=nearHatch?.35:2.3,doorDuration=.75,entryDuration=nearHatch?1.5:1.55,boardingDuration=approachDuration+doorDuration+entryDuration;
  const hatchView=new THREE.Vector3(4.25,1.9,z+.55),hatchTarget=new THREE.Vector3(1.75,2,z+.55);
  const approach=nearHatch?new THREE.LineCurve3(this.camera.position.clone(),hatchView):new THREE.CatmullRomCurve3([this.camera.position.clone(),exit,new THREE.Vector3(3.95,1.8,z-4.6),hatchView],false,'centripetal');
  const entry=new THREE.CatmullRomCurve3([hatchView,new THREE.Vector3(3.1,2,z+.55),new THREE.Vector3(1.5,2.3,z+.55),new THREE.Vector3(0,2.3,z+.55),seat],false,'centripetal');
  const departure=new THREE.CatmullRomCurve3([seat,seat.clone().add(new THREE.Vector3(0,3,-6)),seat.clone().add(new THREE.Vector3(9,10,-12)),seat.clone().add(new THREE.Vector3(25,22,-4)),seat.clone().add(new THREE.Vector3(42,38,22))],false,'centripetal');
  const origin=target.clone().addScaledVector(radial,destinations[world.index].radius*1.8),orbital=createReturnRoute(destinations,world.index,origin,endpoint);
  this.flightTravel={returning:true,index:world.index,world,approach,entry,hatchView,hatchTarget,approachDuration,doorDuration,entryDuration,departure,orbital:orbital.curve,flybys:orbital.flybys,nearHatch,boardingDuration,boardingQuaternion:this.camera.quaternion.clone(),origin,endpoint,target,progress:0,oldShadowAutoUpdate:this.renderer.shadowMap.autoUpdate};
  berth.ship.visible=true;berth.setDoorOpen(0);this.flightCabin=new THREE.Group();this.flightCabin.name='return-spacecraft-cabin';this.flightCabin.position.copy(seat);world.scene.add(this.flightCabin);this.cockpit=new CockpitRig(this.camera);this.flightCabin.add(this.cockpit.group);
  // Keep the same physical hull and cockpit throughout walking, seating and flight.
  this.flightCabin.attach(berth.ship);this.cockpit.group.visible=true;this.renderer.shadowMap.needsUpdate=true;this.renderer.shadowMap.autoUpdate=false;return true;
 }
 updateReturn(progress,{stage,throttle,autopilot,time,motion=true,dt=.016}){
  const path=this.flightTravel,world=path.world,berth=world.berth,p=THREE.MathUtils.clamp(progress,0,1),smooth=t=>THREE.MathUtils.smoothstep(t,0,1),walkProgress=motion?THREE.MathUtils.clamp(time/path.boardingDuration,0,1):1;
  const seat=berth.position;
  if(motion&&walkProgress<1&&p===0){
   let position,focus,seatBlend=0,bob=0;
   if(time<path.approachDuration){
    path.boardingPhase='approach';const t=THREE.MathUtils.clamp(time/path.approachDuration,0,1);position=path.approach.getPointAt(t);focus=path.approach.getPointAt(Math.min(1,t+.08));if(path.nearHatch)focus.copy(path.hatchTarget);else focus.lerp(path.hatchTarget,smooth((t-.65)/.35));bob=Math.sin(time*12)*.008*Math.sin(t*Math.PI);berth.setDoorOpen(0);
   }else if(time<path.approachDuration+path.doorDuration){
    path.boardingPhase='hatch';position=path.hatchView.clone();focus=path.hatchTarget.clone();const opening=smooth((time-path.approachDuration)/path.doorDuration);berth.setDoorOpen(opening);
   }else{
    const t=THREE.MathUtils.clamp((time-path.approachDuration-path.doorDuration)/path.entryDuration,0,1),travel=t<.85?t/.85*.94:.94+.06*smooth((t-.85)/.15);path.boardingPhase=t>.75?'seat':'enter';position=path.entry.getPointAt(travel);focus=path.entry.getPointAt(Math.min(1,travel+.07));seatBlend=smooth((t-.65)/.35);berth.setDoorOpen(1-smooth((t-.85)/.14));
   }
   this.camera.position.copy(position);this.camera.position.y+=bob;const direction=focus.sub(position).normalize();if(direction.lengthSq()<.01)direction.set(0,0,-1);
   const facing=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.asin(THREE.MathUtils.clamp(direction.y,-1,1)),Math.atan2(-direction.x,-direction.z),0,'YXZ'));facing.slerp(new THREE.Quaternion(),seatBlend);this.camera.quaternion.slerp(facing,1-Math.exp(-dt*14));
   this.cockpit.left.setVisible(false);this.cockpit.right.setVisible(false);this.cockpit.update(dt,time,{stage:0,throttle:0,autopilot,progress:0,distance:0,destination:'HOME ORBIT',motion:false});
   path.progress=0;path.reveal=walkProgress;return;
  }
  berth.setDoorOpen(0);this.cockpit.left.setVisible(true);this.cockpit.right.setVisible(true);
  if(p<.2){
   this.scene=world.scene;if(this.flightCabin.parent!==this.scene)this.scene.add(this.flightCabin);
   const t=p/.2,position=path.departure.getPointAt(t),direction=path.departure.getTangentAt(t).normalize();
   const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.asin(direction.y),Math.atan2(-direction.x,-direction.z),-.14*Math.sin(t*Math.PI),'YXZ'));
   rotation.identity().slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.asin(direction.y),Math.atan2(-direction.x,-direction.z),-.14*Math.sin(t*Math.PI),'YXZ')),smooth(t/.12));
   this.flightCabin.position.copy(position);this.flightCabin.quaternion.copy(rotation);this.camera.position.copy(position);this.camera.quaternion.copy(rotation);
  }else{
   this.scene=this.orbitScene;if(this.flightCabin.parent!==this.scene)this.scene.add(this.flightCabin);
   const cruise=smooth((p-.2)/.7),position=path.orbital.getPointAt(cruise),direction=path.orbital.getTangentAt(cruise).normalize(),rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.asin(THREE.MathUtils.clamp(direction.y,-1,1)),Math.atan2(-direction.x,-direction.z),0,'YXZ'));
   rotation.slerp(new THREE.Quaternion(),smooth((p-.84)/.06));this.flightCabin.position.copy(position);this.flightCabin.quaternion.copy(rotation);this.camera.position.copy(position).add(new THREE.Vector3(0,0,-1.5*smooth((p-.9)/.1)).applyQuaternion(rotation));this.camera.quaternion.copy(rotation);
   // A small head turn keeps each flyby visible through the window on portrait screens.
   if(p<.84){let nearest=null;for(const index of path.flybys){const planet=destinations[index],toward=new THREE.Vector3(...planet.position).sub(position),distance=toward.length()/planet.radius;toward.normalize();if(toward.dot(direction)>.2&&(!nearest||distance<nearest.distance))nearest={toward,distance,alignment:toward.dot(direction)};}
    if(nearest){const weight=.62*(1-smooth((nearest.distance-2)/3))*smooth((nearest.alignment-.2)/.45)*(1-smooth((p-.8)/.04)),view=direction.clone().lerp(nearest.toward,weight).normalize();this.camera.quaternion.setFromEuler(new THREE.Euler(Math.asin(THREE.MathUtils.clamp(view.y,-1,1)),Math.atan2(-view.x,-view.z),0,'YXZ'));}
   }
  }
  if(p===1){this.camera.position.set(0,2,24);this.camera.quaternion.identity();}
  path.progress=p;path.reveal=walkProgress;const fov=motion?58+Math.sin(p*Math.PI)*7:58;if(Math.abs(this.camera.fov-fov)>.04){this.camera.fov=fov;this.camera.updateProjectionMatrix();}
  this.cockpit.update(dt,time,{stage,throttle,autopilot,progress:p,distance:this.camera.position.distanceTo(path.endpoint),destination:'HOME ORBIT',motion});
 }
 updateFlight(progress,{stage,throttle,autopilot,time,motion=true,dt=.016}){
  if(!this.flightTravel)return;if(this.flightTravel.returning){this.updateReturn(progress,{stage,throttle,autopilot,time,motion,dt});return;}const path=this.flightTravel,p=THREE.MathUtils.clamp(progress,0,1),ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  const shipPosition=path.origin.clone().lerp(path.endpoint,ease);
  if(p===0&&time>1.2&&motion)shipPosition.lerp(path.endpoint,Math.min(.002,(time-1.2)*.0003));
  const direction=path.target.clone().sub(shipPosition).normalize(),targetRotation=new THREE.Euler(Math.asin(direction.y),Math.atan2(-direction.x,-direction.z),0,'YXZ');
  const rotation=new THREE.Quaternion().setFromEuler(targetRotation),align=motion?THREE.MathUtils.smoothstep(time,1.3,3.2):1;rotation.copy(path.quaternion).slerp(new THREE.Quaternion().setFromEuler(targetRotation),align);
  const reveal=motion?THREE.MathUtils.smoothstep(time,0,1.2):1;path.reveal=reveal;
  this.flightCabin.position.copy(shipPosition);this.flightCabin.quaternion.copy(rotation);
  // The cabin stays in place while the viewer actually pulls their head back
  // 1.5 world units from the windshield into the pilot's seat.
  this.camera.position.copy(shipPosition).add(new THREE.Vector3(0,0,-1.5*(1-reveal)).applyQuaternion(rotation));this.camera.quaternion.copy(rotation);
  this.camera.fov=motion?58+Math.sin(p*Math.PI)*7:58;this.camera.updateProjectionMatrix();path.progress=p;
  this.cockpit?.update(dt,time,{stage,throttle,autopilot,progress:p,distance:this.camera.position.distanceTo(path.target),destination:['ORIGIN','CHRONOS','NOVA','ATLAS','STATION'][path.index],motion});
 }
 endFlight({reset=false}={}){
  if(this.flightTravel?.returning){const path=this.flightTravel,berth=path.world.berth;berth.pad.add(berth.ship);berth.ship.position.set(0,.13,0);berth.ship.quaternion.identity();berth.ship.visible=true;berth.setDoorOpen(0);this.renderer.shadowMap.autoUpdate=path.oldShadowAutoUpdate;this.renderer.shadowMap.needsUpdate=true;}
  if(this.cockpit){this.cockpit.dispose();this.cockpit=null;}if(this.flightCabin){this.flightCabin.removeFromParent();this.flightCabin=null;}if(this.camera.parent)this.camera.removeFromParent();this.flightTravel=null;this.camera.fov=58;this.camera.updateProjectionMatrix();
  if(this.mode==='flight')this.mode='orbit';if(reset){this.scene=this.orbitScene;this.camera.position.set(0,2,24);this.look={yaw:0,pitch:0};this.camera.rotation.set(0,0,0,'YXZ');}
 }
 enterWorld(i){
  if(this.flightTravel)this.endFlight();
  this.world?.endReading();this.focusedExhibit=null;this.seated=false;this.release();this.travel=null;this.keys.clear();this.stick={x:0,y:0};this.mode='world';this.landedAt=i;
  if(!this.worlds.has(i))this.worlds.set(i,new DestinationWorld(i,this.language,this));
  this.world=this.worlds.get(i);addLandingBerth(this.world);this.scene=this.world.scene;this.camera.position.set(0,i===0?1.85:2.1,13);this.look={yaw:0,pitch:0};if(this.world.entry){this.camera.position.fromArray(this.world.entry.position);this.look={yaw:this.world.entry.yaw,pitch:this.world.entry.pitch};}this.currentTarget=-1;this.onMode('world',i);
 }
 home(){if(this.flightTravel)this.endFlight({reset:true});this.world?.endReading();this.focusedExhibit=null;this.seated=false;this.release();this.travel=null;this.stick={x:0,y:0};this.mode='orbit';this.world=null;this.scene=this.orbitScene;this.camera.position.set(0,2,24);this.look={yaw:0,pitch:0};this.currentTarget=-1;this.onMode('orbit');}
 sit(item=this.world?.interactables.find(o=>o.kind==='seat')){
  if(!item||this.mode!=='world')return;this.release();this.seated=true;this.stick={x:0,y:0};this.beforeSeat={position:this.camera.position.clone(),look:{...this.look},quaternion:this.camera.quaternion.clone()};this.world.beginReading(item);this.scene.updateMatrixWorld(true);
  const center=item.screen.getWorldPosition(new THREE.Vector3()),normal=new THREE.Vector3(0,0,1).applyQuaternion(item.screen.getWorldQuaternion(new THREE.Quaternion()));const distance=Math.max(item.screenWidth*1.04,item.screenWidth/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*this.camera.aspect)*1.12);this.flyTo(center.clone().addScaledVector(normal,distance),center,{quaternion:item.screen.getWorldQuaternion(new THREE.Quaternion())});
 }
 stand(){if(!this.seated)return;this.world.endReading();this.seated=false;this.flyTo(this.beforeSeat.position,this.beforeSeat.position.clone().add(new THREE.Vector3(0,0,-1).applyQuaternion(this.beforeSeat.quaternion)),{quaternion:this.beforeSeat.quaternion});}
 visitExhibit(index){
  if(!this.world||this.seated)return;const item=this.world.interactables[index];if(!item)return;
  const normal=item.screen.getWorldDirection(new THREE.Vector3());normal.y=0;if(normal.length()<.1)normal.set(0,0,1);normal.normalize();const position=item.anchor.position.clone().addScaledVector(normal,this.world.index===0?1.35:2.5);position.y=this.world.index===0?1.65:1.85;this.flyTo(position,item.anchor.position);
 }
 selectOrbit(index){
  if(this.mode!=='orbit')return;
  if(this.mobileOrbit){const direction=this.orbit.children[index].position.clone().sub(this.camera.position).normalize();this.look={yaw:Math.atan2(-direction.x,-direction.z),pitch:Math.asin(direction.y)};this.clampOrbitLook();this.camera.rotation.set(this.look.pitch,this.look.yaw,0,'YXZ');this.pointer.set(0,0);this.pointerChanged=true;}
  this.currentTarget=index;this.onNear(index);
 }
 clampOrbitLook(){
  // Keep the view within the forward destination cluster, including its outer edges.
  const angles=destinations.map(d=>{const direction=new THREE.Vector3(...d.position).sub(new THREE.Vector3(0,2,24)).normalize();return {yaw:Math.atan2(-direction.x,-direction.z),pitch:Math.asin(direction.y)};});
  this.look.yaw=THREE.MathUtils.clamp(this.look.yaw,Math.min(...angles.map(a=>a.yaw))-.04,Math.max(...angles.map(a=>a.yaw))+.04);
  this.look.pitch=THREE.MathUtils.clamp(this.look.pitch,Math.min(...angles.map(a=>a.pitch))-.04,Math.max(...angles.map(a=>a.pitch))+.04);
 }
 panOrbit(dx,dy){
  if(this.mode!=='orbit'||this.suspended||!this.mobileOrbit)return;
  const radiansPerPixel=THREE.MathUtils.degToRad(this.camera.fov)/innerHeight;
  this.look.yaw+=dx*radiansPerPixel;this.look.pitch+=dy*radiansPerPixel;this.clampOrbitLook();this.pointer.set(0,0);this.pointerChanged=true;
 }
 bind(){
  const orbitMedia=matchMedia('(max-width:760px), (pointer:coarse)');
  const updateOrbitControls=()=>{this.mobileOrbit=orbitMedia.matches;document.body.classList.toggle('orbit-touch',this.mobileOrbit);if(this.mode==='orbit'){this.pointer.set(0,0);this.pointerChanged=true;if(this.mobileOrbit)this.clampOrbitLook();else this.look={yaw:0,pitch:0};}};
  updateOrbitControls();orbitMedia.addEventListener('change',updateOrbitControls);
  this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.cockpit?.resize();if(this.mode==='orbit'&&this.mobileOrbit){this.clampOrbitLook();this.pointerChanged=true;}};window.addEventListener('resize',this.resize);
  window.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName))return;if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','KeyQ','KeyE'].includes(e.code)){if(this.mode==='world'&&!this.suspended&&!this.seated&&document.querySelector('#guide').hidden){e.preventDefault();this.keys.add(e.code);this.travel=null;}}});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>{this.keys.clear();this.stick={x:0,y:0};});
  document.addEventListener('pointerlockchange',()=>{this.active=document.pointerLockElement===this.canvas;this.keys.clear();document.body.classList.toggle('piloting',this.active);});
  document.addEventListener('mousemove',e=>{if(this.active&&!this.seated){this.look.yaw-=e.movementX*.0018;this.look.pitch=THREE.MathUtils.clamp(this.look.pitch-e.movementY*.0018,-1.45,1.45);this.travel=null;}});
  let previous=null;this.canvas.addEventListener('pointerdown',e=>{if(this.suspended||previous)return;if((this.mode==='orbit'&&this.mobileOrbit)||(this.mode==='world'&&!this.active&&!this.seated)){previous={x:e.clientX,y:e.clientY,id:e.pointerId};this.canvas.setPointerCapture(e.pointerId);}});
  this.canvas.addEventListener('pointermove',e=>{
   if(this.suspended)return;
   if(this.mode==='orbit'&&!this.mobileOrbit){this.pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);this.pointerChanged=true;}
   if(previous&&previous.id===e.pointerId){const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
    if(this.mode==='orbit')this.panOrbit(dx,dy);
    else if(this.mode==='world'){this.look.yaw-=dx*.004;this.look.pitch=THREE.MathUtils.clamp(this.look.pitch-dy*.004,-1.45,1.45);this.travel=null;}
    previous={x:e.clientX,y:e.clientY,id:e.pointerId};
   }
  });
  this.canvas.addEventListener('pointerleave',()=>{if(this.mode==='orbit'&&!this.mobileOrbit){this.currentTarget=-1;this.pointerChanged=false;this.onNear(-1);}});
  const endDrag=e=>{if(previous?.id===e.pointerId)previous=null;};this.canvas.addEventListener('pointerup',endDrag);this.canvas.addEventListener('pointercancel',endDrag);this.canvas.addEventListener('lostpointercapture',endDrag);window.addEventListener('blur',()=>previous=null);
  this.canvas.addEventListener('wheel',e=>{if(this.mode!=='orbit'||!this.mobileOrbit||this.suspended)return;e.preventDefault();const scale=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;this.panOrbit(-e.deltaX*scale,-e.deltaY*scale);},{passive:false});
 }
 pilot(){if(this.mode!=='world'||this.seated||this.suspended)return;this.travel=null;if(matchMedia('(pointer:fine)').matches){const promise=this.canvas.requestPointerLock?.();promise?.catch?.(()=>{});}}
 release(){if(document.pointerLockElement)document.exitPointerLock?.();this.active=false;this.keys.clear();document.body.classList.remove('piloting');}
 flyTo(position,target,{quaternion}={}){
  const direction=target.clone().sub(position).normalize(),rotation=quaternion||new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.asin(direction.y),Math.atan2(-direction.x,-direction.z),0,'YXZ'));
  this.travel={from:this.camera.position.clone(),to:position.clone(),start:performance.now(),duration:this.motion?900:0,fromRotation:this.camera.quaternion.clone(),toRotation:rotation.clone()};
 }
 animate(){
  this.frame=requestAnimationFrame(()=>this.animate());const dt=Math.min(this.clock.getDelta(),.05),time=this.clock.elapsedTime;
  let cameraDriven=false;
  if(this.travel){const travel=this.travel,t=travel.duration?Math.min((performance.now()-travel.start)/travel.duration,1):1,s=t*t*(3-2*t);this.camera.position.lerpVectors(travel.from,travel.to,s);this.camera.quaternion.slerpQuaternions(travel.fromRotation,travel.toRotation,s);cameraDriven=true;const euler=new THREE.Euler().setFromQuaternion(this.camera.quaternion,'YXZ');this.look={yaw:euler.y,pitch:euler.x};if(t===1)this.travel=null;}
  else if(this.mode==='world'&&!this.suspended&&!this.seated&&document.querySelector('#guide').hidden){
   const dir=new THREE.Vector3((this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0)+this.stick.x,0,(this.keys.has('KeyS')?1:0)-(this.keys.has('KeyW')?1:0)+this.stick.y);if(dir.length()>1)dir.normalize();dir.applyAxisAngle(new THREE.Vector3(0,1,0),this.look.yaw);this.camera.position.addScaledVector(dir,dt*(this.world.index===0?(this.keys.has('ShiftLeft')?3.8:2.5):(this.keys.has('ShiftLeft')?5:3.2)));
   this.camera.position.x=THREE.MathUtils.clamp(this.camera.position.x,-21,21);this.camera.position.z=THREE.MathUtils.clamp(this.camera.position.z,this.world.endZ,this.world.bounds?.maxZ??14);this.camera.position.y=this.world.index===0?1.65:1.85;this.world.collisions(this.camera.position);
  }

  if(this.mode!=='flight'&&!this.seated&&!cameraDriven)this.camera.rotation.set(this.look.pitch,this.look.yaw,0,'YXZ');
  if(this.motion&&this.mode==='orbit'){
   this.homeTime+=dt;this.planets.forEach((planet,i)=>{planet.rotation.y+=dt*[.18,.12,.23,.16][i];planet.rotation.z=[.17,-.25,.11,.36][i]+Math.sin(this.homeTime*.18+i)*.025;});
   this.homeRings.forEach((ring,i)=>{ring.rotation.y=.2+Math.sin(this.homeTime*.22+i)*.09;ring.rotation.z+=dt*(i?-.035:.045);});
   const station=this.orbit.children[4];station.rotation.y+=dt*.1;station.rotation.z=Math.sin(this.homeTime*.28)*.045;
  }
  this.camera.updateMatrixWorld();this.scene.updateMatrixWorld(true);
  if(this.mode==='orbit'&&!this.suspended&&(this.pointerChanged||this.mobileOrbit)){
   if(this.mobileOrbit)this.pointer.set(0,0);
   this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.orbit.children,true);let selected=-1;
   for(const hit of hits){let o=hit.object;while(o&&o.userData.destination===undefined)o=o.parent;if(o){selected=o.userData.destination;break;}}
   if(selected!==this.currentTarget){this.currentTarget=selected;this.onNear(selected);}this.pointerChanged=false;
  }
  this.homeOrbit.update(dt,this.mode==='orbit',this.currentTarget,this.motion);
  if(this.mode==='world'){
   let item=null;
   if(!this.seated){this.raycaster.setFromCamera(new THREE.Vector2(0,0),this.camera);const hit=this.raycaster.intersectObjects(this.world.interactables.map(i=>i.target))[0];if(hit&&hit.distance<8&&this.camera.position.distanceTo(hit.object.userData.item.anchor.position)<=hit.object.userData.item.activationDistance){
     const blocking=this.raycaster.intersectObjects(this.world.group.children,true).find(h=>{if(!h.object.isMesh)return false;let node=h.object;while(node){if(!node.visible)return false;node=node.parent;}const materials=Array.isArray(h.object.material)?h.object.material:[h.object.material];return materials.some(m=>m.visible!==false&&m.colorWrite!==false&&m.opacity>.25);});
     if(!blocking||blocking.distance>=hit.distance-.08)item=hit.object.userData.item;
    }
    if(!item){const forward=this.camera.getWorldDirection(new THREE.Vector3());const nearest=this.world.interactables.map(i=>{const delta=i.anchor.position.clone().sub(this.camera.position);return {item:i,distance:delta.length(),alignment:delta.normalize().dot(forward)};}).filter(i=>i.alignment>.65&&i.distance<=i.item.activationDistance).sort((a,b)=>a.distance-b.distance)[0];if(nearest?.distance<2.5)item=nearest.item;}}
   if(!this.seated){const boarding=this.world.berth?.boarding;if(boarding&&this.camera.position.distanceTo(boarding.anchor.position)<=boarding.activationDistance)item=boarding;}
   const identifier=item?.id||null;if(identifier!==this.focusedExhibit){this.focusedExhibit=identifier;this.onExhibit?.(item?{item}:null);}
   this.world.update(this.motion?dt:0,this.motion?time:0,this.camera,this.focusedExhibit);
  }
  this.renderer.render(this.scene,this.camera);
  document.querySelectorAll('[data-beacon]').forEach(el=>{if(this.mode!=='orbit'){el.hidden=true;return;}const i=Number(el.dataset.beacon),d=destinations[i];const point=d.anchor.clone().project(this.camera);const distance=this.camera.position.distanceTo(new THREE.Vector3(...d.position));let visible=this.mode==='orbit'&&point.z<1&&point.z>-1&&Math.abs(point.x)<.94&&Math.abs(point.y)<.8; if(visible){const ray=new THREE.Ray(this.camera.position,d.anchor.clone().sub(this.camera.position).normalize());for(let j=0;j<4;j++){if(j===i)continue;const hit=ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(...destinations[j].position),destinations[j].radius),new THREE.Vector3());if(hit&&hit.distanceTo(this.camera.position)<d.anchor.distanceTo(this.camera.position)){visible=false;break;}}}el.hidden=!visible;el.style.transform=`translate(${(point.x*.5+.5)*innerWidth}px,${(-point.y*.5+.5)*innerHeight}px) translate(-50%,-50%)`;el.querySelector('small').textContent=`${distance.toFixed(0)} AU`;});
 }
 setQuality(low){
  this.low=low;this.renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.75));this.renderer.shadowMap.enabled=!low;
  for(const scene of [this.orbitScene,...Array.from(this.worlds.values(),w=>w.scene)])scene.traverse(o=>{if(o.isLight&&o.userData.shadowEligible)o.castShadow=!low;if(o.isMesh){for(const material of Array.isArray(o.material)?o.material:[o.material])material.needsUpdate=true;}});
 }
}
