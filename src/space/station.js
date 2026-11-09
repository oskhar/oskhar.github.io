import * as THREE from 'three';
import {InteractiveLocation,block,labelTexture} from './interactions.js';
import {exhibitsFor} from './exhibits.js';
import {sectors,spacecraft,DOCK,SPACE_RADIUS,desertHeight,createSpaceState,stepSpace,canDock,distance3} from './station-model.js';
const material=(color,metalness=.35,roughness=.55)=>new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),metalness,roughness});
const hull=material(0xc2c9c7),navy=material(0x243541),deck=material(0x354653),copper=material(0xa98361),blue=material(0x295e80,.65),light=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
export class SatelliteWorld extends InteractiveLocation{
 constructor(language,u){
  super(4,language,u);this.group.name='meridian-personal-satellite';this.scene.background=new THREE.Color('#060c1b');this.scene.fog=new THREE.FogExp2(0x091323,.0011);this.sky.position.set(-240,170,-600);this.sky.scale.setScalar(1.25);
  this.entry={position:[0,1.85,9],yaw:0,pitch:0};this.bounds={minX:-12,maxX:12,minZ:-13,maxZ:23};this.endZ=-13;this.driving=false;this.selectedVehicle=0;this.flightState=createSpaceState();this.garageOpen=false;this.mapOpen=false;this.target=0;this.cameraReady=false;this.discovered=new Set();this.spaceSolids=[];this.nearSector=-1;
  try{const saved=JSON.parse(localStorage.getItem('satellite-journal-v1')||'[]');if(Array.isArray(saved))saved.filter(id=>sectors.some(s=>s.id===id)).forEach(id=>this.discovered.add(id));}catch{}
  this.scene.children.filter(o=>o.isHemisphereLight).forEach(o=>{o.intensity=.75;o.color.set(0xbcd9ee);o.groundColor.set(0x423859);});const sun=this.scene.children.find(o=>o.isDirectionalLight);sun.intensity=1.5;sun.position.set(-50,90,60);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,far:220});
  this.buildSatellite();this.buildDesert();sectors.forEach((s,i)=>this.buildSector(s,i));this.buildCabin();this.ships=spacecraft.map((v,i)=>{const g=this.buildShip(v,i);g.visible=false;return g;});this.cards=this.interactables;this.setLanguage(language);
 }
 box(g,size,pos,mat=hull,solid=false){const mesh=block(g,size,pos,mat);if(solid){g.updateWorldMatrix(true,true);this.colliders.push(new THREE.Box3().setFromObject(mesh));}return mesh;}
 tube(g,r,h,pos,mat=navy){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mat);m.position.fromArray(pos);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 ring(g,r,pos,color=0x9fddd9,rotation=[Math.PI/2,0,0],thickness=.1){const m=new THREE.Mesh(new THREE.TorusGeometry(r,thickness,8,80),light(color));m.position.fromArray(pos);m.rotation.set(...rotation);g.add(m);return m;}
 sign(g,text,pos,width=5,summary='',color='#a7e3de'){const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width*224/768),new THREE.MeshBasicMaterial({map:labelTexture(text,color,summary),toneMapped:false,side:THREE.DoubleSide}));m.position.fromArray(pos);g.add(m);return m;}
 buildSatellite(){
  const g=this.group;this.box(g,[27,.5,29],[0,-.25,0],deck);this.box(g,[27,.5,29],[0,7.3,0],hull);
  const window=new THREE.MeshPhysicalMaterial({color:0x6aa8b9,transparent:true,opacity:.18,metalness:.2,roughness:.2,side:THREE.DoubleSide,depthWrite:false});
  for(const x of [-13,13]){this.box(g,[.5,2,29],[x,1,0],hull,true);this.box(g,[.2,4.5,28],[x,4.2,0],window);for(let z=-12;z<=12;z+=6){this.box(g,[.7,7,.7],[x,3.5,z],hull,true);this.box(g,[.1,.1,4],[x*.96,2.1,z],light(0x88cfcf));}}
  this.box(g,[26,7,.5],[0,3.5,-14],navy,true);for(const x of [-8.5,8.5])this.box(g,[9,7,.5],[x,3.5,14],hull,true);this.box(g,[6,2,.5],[0,6,14],hull);
  // Open central airlock, a safe pedestrian pier and the external docking cradle.
  this.box(g,[14,.4,10],[0,-.2,19],deck);for(const x of [-6.7,6.7]){this.box(g,[.2,1,10],[x,.5,19],hull,true);this.box(g,[.08,.08,10],[x,1.05,19],light(0xa4e6df));}
  this.sign(g,'MERIDIAN / OSK',[0,5,14.4],8,'PERSONAL ORBITAL SANCTUARY');this.ring(g,4,[0,4,28],0x97e6dc,[0,0,0],.18);this.ring(g,4.6,[0,4,28],0xedbc87,[0,0,0],.035);
  this.box(g,[12,1,10],[0,-1,30],navy);this.spaceSolids.push(new THREE.Box3(new THREE.Vector3(-6,-1.5,25),new THREE.Vector3(6,-.5,35)));this.box(g,[28,2,32],[0,-2,0],navy);this.ring(g,30,[0,-5,0],0x79b3c1,[Math.PI/2,0,0],.2);
  // Large solar wings preserve a recognizable satellite silhouette from every sector.
  for(const side of [-1,1]){this.box(g,[18,1,3],[side*23,-2,0],hull);this.box(g,[18,.35,34],[side*35,-2,0],blue);for(let x=-7;x<=7;x+=3.5)this.box(g,[.08,.06,34],[side*35+x,-1.79,0],hull);for(let z=-15;z<=15;z+=5)this.box(g,[18,.06,.08],[side*35,-1.79,z],hull);
   this.spaceSolids.push(new THREE.Box3(new THREE.Vector3(side<0?-45:25,-4,-18),new THREE.Vector3(side<0?-25:45,0,18)));
  }
  this.spaceSolids.push(new THREE.Box3(new THREE.Vector3(-14,-5,-15),new THREE.Vector3(14,8,15)));
  this.tube(g,1,10,[0,12,-6],hull);const dish=new THREE.Mesh(new THREE.SphereGeometry(5,24,12,0,Math.PI*2,0,1.1),hull);dish.position.set(0,17,-6);dish.rotation.x=.7;g.add(dish);this.ring(g,2,[0,16,-6],0xf0c492);
  this.spaceSolids.push(new THREE.Box3(new THREE.Vector3(-6,8,-12),new THREE.Vector3(6,21,0)));
  for(let z=-10;z<=10;z+=5)for(const x of [-11.8,11.8]){const lamp=new THREE.PointLight(0xa3d6e7,.6,10,2);lamp.position.set(x,4,z);this.scene.add(lamp);this.box(g,[.08,2,.12],[x,4,z],light(0xbce4ee));}
  this.box(g,[1,.03,26],[0,.02,0],light(0x599d9b));for(let z=-12;z<=12;z+=2)this.box(g,[.12,.035,.4],[0,.05,z],light(0xeac590));
 }
 buildCabin(){
  const g=this.group;this.sign(g,'MUHAMAD OSKHAR MUBAROK',[0,5,-13.6],11,'SOFTWARE ENGINEER / BACKEND ENGINEER');
  this.sign(g,'01 / THE PERSON',[0,5.8,5],5,'DISCOVER · CONNECT · EXPLORE');
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.1,1),new THREE.MeshStandardMaterial({color:0x87d5cc,wireframe:true,emissive:0x397a74,emissiveIntensity:.5}));core.position.set(0,4,-3);g.add(core);this.ring(g,1.8,[0,4,-3],0x8dcac5,[.6,0,.3]);this.animations.push(dt=>{core.rotation.y+=dt*.2;});
  sectors.forEach((s,i)=>{const x=i%2?8:-8,z=7-Math.floor(i/2)*7;this.box(g,[4,1,1.1],[x,.5,z],navy,true);this.box(g,[4,.07,1.2],[x,1.05,z],light(s.color));this.sign(g,s.name.en,[x,2,z-.2],3.8,s.title.en,'#'+s.color.toString(16));
   const item=this.interactable({id:'self-'+s.id,label:s.name,preview:s.title,position:[x,1.6,z+1.1],screenPosition:[x,2.1,z+.7],screenWidth:3,activationDistance:3.5,accent:s.color,size:[3,2,1],stories:l=>[[s.title[l],s.body[l]],[l==='id'?'Makna lanskap orbital':'The orbital landscape',s.meaning[l]]]});item.sectorIndex=i;
  });
  const links=exhibitsFor(4,this.language).filter(e=>e.url);links.forEach((e,i)=>{const x=-9+i*6;this.box(g,[3.4,.9,.9],[x,.45,-12.3],navy,true);this.box(g,[3.4,.06,1],[x,.94,-12.3],light(0x88b9d0));this.sign(g,['MAIL','GITHUB','LINKEDIN','CV'][i],[x,1.7,-12],2.8);this.interactable({id:'station-contact-'+i,kind:'link',label:{en:['Email · start a conversation','GitHub · oskhar','LinkedIn · oskhar','Read source CV'][i],id:['Email · mulai percakapan','GitHub · oskhar','LinkedIn · oskhar','Baca sumber CV'][i]},preview:{en:'Communication terminal',id:'Terminal komunikasi'},position:[x,1.5,-11],activationDistance:2.8,size:[2,2,1],url:e.url});});
 }
 buildDesert(){
  const geo=new THREE.PlaneGeometry(850,850,120,120);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=desertHeight(x,z);p.setY(i,h);const c=new THREE.Color(0xa9795f).lerp(new THREE.Color(0x39354e),Math.min(.8,Math.hypot(x,z)/600));c.convertSRGBToLinear().multiplyScalar(.9+Math.sin(x*.1+z*.07)*.1);colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;this.group.add(ground);
  let seed=910;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),copper,260),o=new THREE.Object3D();
  for(let i=0;i<260;i++){const a=rnd()*Math.PI*2,r=50+rnd()*350,x=Math.sin(a)*r,z=Math.cos(a)*r,s=2+rnd()*10;o.position.set(x,desertHeight(x,z)+s*.25,z);o.scale.set(s,s*.8,s*.6);o.rotation.set(rnd(),rnd()*6,rnd());o.updateMatrix();rocks.setMatrixAt(i,o.matrix);}this.group.add(rocks);
  // A sparse navigable asteroid field, kept away from the launch and approach corridor.
  const asteroids=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),material(0x756c7d),90);for(let i=0;i<90;i++){const a=rnd()*Math.PI*2,r=75+rnd()*200,x=Math.sin(a)*r,z=Math.cos(a)*r,y=-20+rnd()*130,s=1.2+rnd()*3;if(sectors.some(d=>Math.hypot(x-d.x,y-d.y,z-d.z)<30)){i--;continue;}o.position.set(x,y,z);o.scale.set(s,s*.75,s*.9);o.rotation.set(rnd(),rnd()*6,rnd());o.updateMatrix();asteroids.setMatrixAt(i,o.matrix);this.spaceSolids.push(new THREE.Box3(new THREE.Vector3(x-s,y-s,z-s),new THREE.Vector3(x+s,y+s,z+s)));}this.group.add(asteroids);
  const pts=[];for(let i=0;i<600;i++){const a=rnd()*Math.PI*2,r=90+rnd()*250;pts.push(Math.sin(a)*r,20+Math.sin(a*3)*35+rnd()*8,Math.cos(a)*r);}const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xafa2d5,size:.5,transparent:true,opacity:.45,depthWrite:false}));this.group.add(dust);this.animations.push(dt=>dust.rotation.y+=dt*.004);
 }
 buildSector(s,i){
  const g=new THREE.Group();g.name='orbit-'+s.id;g.position.set(s.x,s.y,s.z);this.group.add(g);const accent=light(s.color);this.tube(g,12,1,[0,-2,0],navy);this.ring(g,12.5,[0,-1.4,0],s.color);this.sign(g,s.name.en,[0,9,0],10,s.biome.en,'#'+s.color.toString(16));
  if(i===0){for(const x of [-6,6]){this.box(g,[2,9,3],[x,3,0],hull);this.box(g,[3,.4,8],[x,7,0],copper);}const arch=new THREE.Mesh(new THREE.TorusGeometry(6,.6,8,32,Math.PI),hull);arch.position.set(0,7,0);g.add(arch);this.tube(g,3,.4,[0,0,0],accent);}
  if(i===1){const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(4),material(0xb7a1de));crystal.position.y=3;g.add(crystal);for(const [angle,r] of [[.4,8],[1.2,10]]){const ring=this.ring(g,r,[0,3,0],s.color,[angle,.4,.3]);this.animations.push(dt=>ring.rotation.y+=dt*.15);}this.box(g,[3,5,3],[-6,1,-5],hull);for(let j=0;j<3;j++)this.box(g,[1,2,1],[4+j*2,0,-5],hull);}
  if(i===2){for(let j=0;j<6;j++){const a=j/6*Math.PI*2,x=Math.sin(a)*7,z=Math.cos(a)*7;this.box(g,[3,6,3],[x,1,z],hull);for(let y=0;y<4;y++)this.box(g,[2.5,.13,.1],[x,y,z+1.55],accent);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-.5,z),new THREE.Vector3(0,2,0)]),new THREE.LineBasicMaterial({color:s.color}));g.add(line);}this.tube(g,2,6,[0,1,0],blue);}
  if(i===3){this.tube(g,3,17,[0,6,0],hull);for(const x of [-6,6])this.box(g,[2,9,2],[x,3,0],copper);for(let j=0;j<4;j++)this.ring(g,4,[0,1+j*3,0],s.color);const beacon=new THREE.Mesh(new THREE.OctahedronGeometry(2.3),accent);beacon.position.y=16;g.add(beacon);this.animations.push(dt=>beacon.rotation.y+=dt*.4);}
  if(i===4){for(let j=0;j<5;j++){const a=j/5*Math.PI*2,x=Math.sin(a)*7,z=Math.cos(a)*7;this.tube(g,2,2,[x,0,z],hull);const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(2,1),material(0x6da68b));tree.position.set(x,4,z);g.add(tree);this.box(g,[.5,4,.5],[x,1,z],copper);const bridge=this.box(g,[1,.15,8],[x/2,-.7,z/2],hull);bridge.rotation.y=a;}}
  if(i===5){for(const x of [-7,7])this.box(g,[2,16,3],[x,5,0],hull);this.box(g,[16,2,3],[0,13,0],hull);this.ring(g,6,[0,5,0],s.color,[0,0,0],.25);for(let j=0;j<5;j++)this.box(g,[10-j,.15,1.5],[0,-1+j*.4,4+j*2],accent);}
  const specks=[];for(let j=0;j<65;j++){const a=j*2.39996,r=15+(j%11)*.9;specks.push(Math.sin(a)*r,-5+Math.sin(j*1.7)*6,Math.cos(a)*r);}const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(specks,3));const biomeDust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:s.color,size:.25+(i%3)*.12,transparent:true,opacity:.65,depthWrite:false}));g.add(biomeDust);this.animations.push(dt=>biomeDust.rotation.y+=dt*.025);
  if(i===1||i===3)for(let j=0;j<7;j++){const a=j/7*Math.PI*2,r=17+(j%2)*2,crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.4,0),material(s.color));crystal.scale.y=i===1?2.6:1.3;crystal.position.set(Math.sin(a)*r,-4+j%2,Math.cos(a)*r);g.add(crystal);}
  // Keep the monumental structures solid; the scan zone sits safely outside them.
  this.spaceSolids.push(new THREE.Box3(new THREE.Vector3(s.x-13,s.y-3,s.z-13),new THREE.Vector3(s.x+13,s.y+(i===3?19:15),s.z+13)));
  const trail=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-5,0),new THREE.Vector3(s.x,s.y-5,s.z)]);const path=new THREE.Line(trail,new THREE.LineDashedMaterial({color:s.color,dashSize:2,gapSize:5,transparent:true,opacity:.25}));path.computeLineDistances();this.group.add(path);
 }
 buildShip(v,i){
  const g=new THREE.Group();g.name=v.id;this.group.add(g);const body=material(v.color,.6,.35),accent=light(v.color);this.box(g,[2.4,.7,4.2],[0,0,0],body);this.box(g,[1.5,.65,2],[0,.6,-.5],blue);this.box(g,[1.7,.1,2.1],[0,1,-.5],navy);
  if(i===2){this.ring(g,2.6,[0,-.2,0],v.color,[Math.PI/2,0,0],.18);this.box(g,[3.4,.35,2],[0,-.5,0],navy);}else for(const side of [-1,1]){const wing=this.box(g,[i===1?3.2:2.4,.18,2.8],[side*2,0,.6],body);wing.rotation.y=side*.25;this.box(g,[.5,.6,3],[side*2.7,.1,1],navy);this.box(g,[.45,.45,.1],[side*2.7,.1,2.55],accent);this.box(g,[.12,.8,1],[side*2.7,.6,1.3],body);}
  for(const side of [-1,1]){this.box(g,[.08,.12,2.8],[side*1.22,.1,0],accent);for(let j=0;j<4;j++)this.box(g,[.3,.06,.08],[side*.8,.4,.6+j*.25],navy);}
  this.box(g,[1.2,.3,.1],[0,0,-2.2],light(0xe8eeee));this.box(g,[1,.35,.15],[0,0,2.2],accent);return g;
 }
 markDiscovered(i){this.discovered.add(sectors[i].id);try{localStorage.setItem('satellite-journal-v1',JSON.stringify([...this.discovered]));}catch{}}
 beginReading(item,keep=false){if(item.sectorIndex!==undefined)this.markDiscovered(item.sectorIndex);super.beginReading(item,keep);}
 launch(i=this.selectedVehicle){if(!spacecraft[i]||this.universe.seated||this.universe.suspended)return false;this.selectedVehicle=i;this.flightState=createSpaceState();this.driving=true;this.cameraReady=false;this.garageOpen=false;this.mapOpen=false;this.universe.travel=null;this.universe.keys.clear();this.universe.stick={x:0,y:0};this.universe.look={yaw:0,pitch:-.1};this.ships.forEach((g,j)=>g.visible=j===i);return true;}
 dockingReady(){return this.driving&&canDock(this.flightState);}
 exitVehicle(force=false){
  const u=this.universe;if(force&&this.docking){this.docking=null;this.garageOpen=false;}if(!this.driving)return true;if(!force&&!this.dockingReady())return false;
  this.driving=false;this.flightState.speed=0;this.flightState.vertical=0;this.ships.forEach((g,i)=>{g.visible=!force&&i===this.selectedVehicle;if(g.visible){g.position.set(DOCK.x,DOCK.y,DOCK.z);g.rotation.set(0,Math.PI,0);}});u.travel=null;u.release();u.stick={x:0,y:0};
  if(!force&&u.motion){this.garageOpen=true;this.docking={elapsed:0,rotation:u.camera.quaternion.clone(),curve:new THREE.CatmullRomCurve3([u.camera.position.clone(),new THREE.Vector3(4,7,27),new THREE.Vector3(3.4,2.5,23),new THREE.Vector3(3.4,1.85,19),new THREE.Vector3(3.4,1.85,13),new THREE.Vector3(0,1.85,11)],false,'centripetal')};}
  else{u.camera.position.set(0,1.85,11);u.look={yaw:0,pitch:0};}return true;
 }
 updateTransition(dt){const d=this.docking;if(!d)return;d.elapsed+=dt;const t=Math.min(1,d.elapsed/2.4),p=t*t*(3-2*t),u=this.universe;u.camera.position.copy(d.curve.getPointAt(p));const target=d.curve.getPointAt(Math.min(1,p+.045));if(t>.85)target.lerp(new THREE.Vector3(0,1.85,0),(t-.85)/.15);const direction=target.sub(u.camera.position).normalize(),rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.asin(THREE.MathUtils.clamp(direction.y,-1,1)),Math.atan2(-direction.x,-direction.z),0,'YXZ'));u.camera.quaternion.slerp(rotation,1-Math.exp(-dt*8));if(t===1){this.docking=null;this.garageOpen=false;u.look={yaw:0,pitch:0};u.camera.position.set(0,1.85,11);u.camera.rotation.set(0,0,0);}}

 scanReady(){const s=this.flightState;return this.driving&&this.nearSector>=0&&Math.abs(s.speed)<10&&Math.abs(s.vertical)<5;}
 scan(){if(!this.scanReady())return -1;this.markDiscovered(this.nearSector);this.flightState.speed=0;this.flightState.vertical=0;return this.nearSector;}
 blocked(x,y,z){const p=new THREE.Vector3(x,y,z);return this.spaceSolids.some(box=>p.x>box.min.x-2&&p.x<box.max.x+2&&p.y>box.min.y-1.5&&p.y<box.max.y+1.5&&p.z>box.min.z-2&&p.z<box.max.z+2);}
 drive(dt){
  const u=this.universe,s=this.flightState;stepSpace(s,{throttle:(u.keys.has('KeyW')?1:0)-(u.keys.has('KeyS')?1:0)-u.stick.y,steer:(u.keys.has('KeyD')?1:0)-(u.keys.has('KeyA')?1:0)+u.stick.x,lift:(u.keys.has('KeyQ')?1:0)-(u.keys.has('KeyE')?1:0),boost:u.keys.has('ShiftLeft'),brake:u.keys.has('Space')},spacecraft[this.selectedVehicle],dt,(x,y,z)=>this.blocked(x,y,z));
  const ship=this.ships[this.selectedVehicle];ship.position.set(s.x,s.y,s.z);ship.rotation.set(-s.vertical*.012,s.yaw,((u.keys.has('KeyD')?1:0)-(u.keys.has('KeyA')?1:0))*.12);
  const yaw=s.yaw+u.look.yaw,pitch=THREE.MathUtils.clamp(u.look.pitch,-.8,.65),chase=u.camera.aspect<.8?22:14,desired=new THREE.Vector3(s.x+Math.sin(yaw)*chase*Math.cos(pitch),s.y+5-Math.sin(pitch)*9,s.z+Math.cos(yaw)*chase*Math.cos(pitch));desired.y=Math.max(desired.y,desertHeight(desired.x,desired.z)+2);const focus=new THREE.Vector3(s.x,s.y+.6,s.z),delta=desired.clone().sub(focus),length=delta.length();
  for(let t=1;t<length;t+=.5){const p=focus.clone().addScaledVector(delta,t/length);if(this.spaceSolids.some(box=>box.containsPoint(p))){desired.copy(focus).addScaledVector(delta,Math.max(.2,(t-.7)/length));break;}}
  if(!this.cameraReady||!u.motion)u.camera.position.copy(desired);else u.camera.position.lerp(desired,1-Math.exp(-dt*7));u.camera.lookAt(focus);this.cameraReady=true;
 }
 collisions(p){p.x=THREE.MathUtils.clamp(p.x,-12.2,12.2);p.z=THREE.MathUtils.clamp(p.z,-13.2,23);if(p.z>13.5)p.x=THREE.MathUtils.clamp(p.x,-5.2,5.2);super.collisions(p);p.y=1.85;}
 update(dt,time,camera,focused){super.update(dt,time,camera,focused);this.nearSector=-1;for(const item of this.interactables){if(camera.position.distanceTo(item.anchor.position)>4.8&&focused!==item.id){item.halo.visible=false;item.marker.visible=false;item.cue.visible=false;}}if(this.driving){let min=30;sectors.forEach((d,i)=>{const dist=distance3(this.flightState,d);if(dist<min){min=dist;this.nearSector=i;}});for(const item of this.interactables){item.halo.visible=false;item.marker.visible=false;item.cue.visible=false;}}}
}
