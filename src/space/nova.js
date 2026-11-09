import * as THREE from 'three';
import { InteractiveLocation, block, labelTexture } from './interactions.js';
import { exhibitsFor } from './exhibits.js';
import { districts, vehicles, terrainHeight, createDriveState, stepDrive, NOVA_RADIUS } from './nova-model.js';

const mat=(color,metalness=0,roughness=.8)=>new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),metalness,roughness});
const sand=mat(0xc28b58),stone=mat(0x9b6043),dark=mat(0x26343d,.55),ivory=mat(0xe6cba0,.15),glass=mat(0x296275,.7,.22);
const lit=color=>new THREE.MeshBasicMaterial({color});
export class NovaWorld extends InteractiveLocation {
 constructor(language,u){
  super(2,language,u);this.group.name='nova-project-expedition';this.scene.background=new THREE.Color(0xc29879);this.scene.fog=new THREE.FogExp2(0xc29879,.0048);this.sky.visible=false;this.scene.children.filter(o=>o.isPoints).forEach(o=>o.visible=false);
  this.entry={position:[0,1.85,9],yaw:0,pitch:0};this.bounds={minX:-190,maxX:190,minZ:-190,maxZ:190};this.endZ=-190;
  this.discovered=new Set();this.driving=false;this.driveState=createDriveState();this.selectedVehicle=0;this.target=0;this.nearDistrict=-1;this.wheels=[];this.garageOpen=false;this.mapOpen=false;this.cameraReady=false;
  try{const saved=JSON.parse(localStorage.getItem('nova-expedition-v1')||'[]');if(Array.isArray(saved))saved.filter(v=>districts.some(d=>d.id===v)).forEach(v=>this.discovered.add(v));}catch{}
  this.scene.children.filter(o=>o.isHemisphereLight).forEach(o=>{o.color.set(0xb9dbec);o.groundColor.set(0xa2643d);o.intensity=.65;});
  const sun=this.scene.children.find(o=>o.isDirectionalLight);sun.position.set(-65,95,45);sun.intensity=1.35;Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,far:260});sun.shadow.mapSize.set(2048,2048);
  this.buildTerrain();this.buildHub();districts.forEach((d,n)=>this.buildDistrict(d,n));this.buildScenery();
  this.buildBiomeDetails();
  this.fleet=vehicles.map((v,n)=>{const model=this.buildVehicle(v,n);model.position.set((n-1)*6,.15,1);return model;});
  this.cards=this.interactables;this.setLanguage(language);
 }
 box(group,size,pos,material=ivory,solid=false){const mesh=block(group,size,pos,material);if(solid){group.updateWorldMatrix(true,true);this.colliders.push(new THREE.Box3().setFromObject(mesh));}return mesh;}
 cylinder(group,r,h,pos,material,segments=16){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);mesh.position.fromArray(pos);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 sign(group,text,pos,width=7,accent='#ffd09a',subtitle=''){const map=labelTexture(text,accent,subtitle),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width*224/768),new THREE.MeshBasicMaterial({map,toneMapped:false,side:THREE.DoubleSide}));mesh.position.fromArray(pos);group.add(mesh);return mesh;}
 buildTerrain(){
  const geo=new THREE.PlaneGeometry(460,460,180,180);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=terrainHeight(x,z);p.setY(i,h-.04);const c=new THREE.Color(0xc99964).lerp(new THREE.Color(0xa46b48),Math.min(.65,h/9));
   for(const d of districts){const distance=Math.hypot(x-d.x,z-d.z);if(distance<34)c.lerp(new THREE.Color(d.id==='health'?0x8c9b69:d.id==='infrastructure'?0xe7d9bd:d.id==='architecture'?0x77677b:0xba8058),(1-distance/34)*.7);}
   c.convertSRGBToLinear().multiplyScalar(1+Math.sin(x*3+z*5)*.025);colors.push(c.r,c.g,c.b);
  }geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;this.group.add(ground);
  // Every route leads from the hub to an actual project and stays traversable.
  for(const d of districts){const length=Math.hypot(d.x,d.z),route=new THREE.Group();route.rotation.y=Math.atan2(d.x,d.z);this.group.add(route);
   this.box(route,[5,.025,length],[0,-.005,length/2],mat(0xaf8057));
   for(let z=24;z<length-20;z+=12)for(const x of [-3.4,3.4]){this.box(route,[.14,.85,.14],[x,.4,z],dark);this.box(route,[.2,.1,.2],[x,.84,z],lit(d.color));}
  }
 }
 buildHub(){
  this.cylinder(this.group,18,.16,[0,0,0],mat(0x806d59),64);this.cylinder(this.group,13,.18,[0,.04,0],mat(0xb69a76),64);
  for(const x of [-11,11]){this.box(this.group,[.65,6,.65],[x,3,-6],dark,true);this.box(this.group,[1,6.4,.3],[x,3.2,-6],ivory);}
  this.box(this.group,[23,.6,3],[0,6,-6],ivory);this.sign(this.group,'NOVA / EXPEDITION',[0,6,-4.45],12,'#ffcd93','PROJECTS BEYOND THE HORIZON');
  for(const x of [-6,0,6]){this.box(this.group,[4.7,.08,6],[x,.15,1],dark);this.box(this.group,[4.7,.03,.09],[x,.21,4],lit(0xffca85));}
  this.sign(this.group,'BASECAMP / 00',[0,2.2,-7.5],5,'#ffcd93','GARAGE · SHUTTLE · EXPEDITION');
  // Shade sails, repair crates and solar canopy make the hub readable from afar.
  for(const x of [-15,15]){this.box(this.group,[.2,4,.2],[x,2,4],dark);this.box(this.group,[4,.16,10],[x,4,0],glass);for(let n=0;n<4;n++)this.box(this.group,[3.8,.03,.06],[x,4.1,-4+n*2.5],ivory);}
  for(let n=0;n<5;n++)this.box(this.group,[1.1,.8,1],[13+n%2*1.2,.4+Math.floor(n/2)*.8,-5],n%2?dark:stone,true);
 }
 buildDistrict(d,n){
  const g=new THREE.Group();g.name=d.id;g.position.set(d.x,0,d.z);this.group.add(g);const accent=lit(d.color);
  this.cylinder(g,23,.12,[0,0,0],mat(d.id==='architecture'?0x675768:d.id==='health'?0x8a9763:0x96765b),64);
  // A front-facing, unobstructed story terminal works both on foot and after parking.
  this.box(g,[3.4,1.1,1],[0,.6,16],dark,true);this.box(g,[3.6,.1,1.1],[0,1.2,16],accent);
  const en=exhibitsFor(2,'en')[n],id=exhibitsFor(2,'id')[n];
  const item=this.interactable({id:'nova-'+d.id,label:{en:d.name.en,id:d.name.id},preview:{en:en.title,id:id.title},position:[d.x,1.7,d.z+17.2],screenPosition:[d.x,2.3,d.z+16.6],activationDistance:5,accent:d.color,screenWidth:3.2,size:[3.5,3,2],stories:lang=>{const e=exhibitsFor(2,lang)[n];return [[e.title,e.body], [lang==='id'?'Lanskap sebagai cerita proyek':'The landscape tells the project story',d.metaphor[lang]],[lang==='id'?'Teknologi & konteks':'Technology & context',e.tags.join(' · ')+'\n\n'+(lang==='id'?'Representasi konseptual dari pengalaman dalam CV; bukan replika sistem internal atau metrik produksi.':'A conceptual representation of CV experience; not a replica of internal systems or production metrics.')]];}});
  item.novaDistrict=n;
  this.sign(g,d.name.en,[0,7.8,2],11,'#'+new THREE.Color(d.color).getHexString(),en.title);
  if(n===0){
   ['CAPEX','OPEX','G-SMART','OCX 2.0'].forEach((name,i)=>{const x=(i%2?1:-1)*8,z=i<2?-9:3,h=[12,9,7,10][i];this.box(g,[6,h,6],[x,h/2,z],ivory,true);for(let y=1.8;y<h;y+=2)this.box(g,[6.1,.22,6.1],[x,y,z],accent);this.box(g,[4,h*.5,.12],[x,h*.5,z+3.06],glass);this.sign(g,name,[x,h+1,z+3.1],5);});
   for(const z of [-9,3])this.box(g,[12,.5,2],[0,5,z],dark);this.box(g,[2,.5,14],[-8,5,-3],dark);
  }else if(n===1){
   this.box(g,[13,5,7],[0,2.5,-7],dark,true);this.box(g,[11,2.2,.15],[0,3,-3.4],glass);this.box(g,[11,.12,.2],[0,4.4,-3.2],accent);
   for(const x of [-15,15]){this.box(g,[1.2,14,1.2],[x,7,-5],ivory,true);this.box(g,[4,1.5,2],[x,14,-5],dark);const scanner=new THREE.Mesh(new THREE.ConeGeometry(3,13,24,1,true),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide}));scanner.position.set(x,7,0);scanner.rotation.x=.45;g.add(scanner);this.animations.push((dt,t)=>scanner.rotation.z=Math.sin(t*.45)*.35);}
   this.box(g,[27,.06,4],[0,.15,7],dark);for(let x=-12;x<13;x+=3)this.box(g,[1,.02,.08],[x,.2,7],ivory);
   const bus=new THREE.Group();g.add(bus);this.box(bus,[5,2.3,1.8],[0,1.4,0],ivory);this.box(bus,[4.4,.8,1.85],[0,1.8,0],glass);this.box(bus,[5,.3,1.86],[0,.7,0],accent);for(const x of [-1.6,1.6])for(const z of [-.85,.85])this.cylinder(bus,.4,.2,[x,.45,z],dark).rotation.x=Math.PI/2;
   this.animations.push((dt,t)=>{bus.position.set(Math.sin(t*.17)*9,0,7);bus.rotation.y=Math.cos(t*.17)<0?Math.PI:0;});
  }else if(n===2){
   for(const x of [-12,0,12]){this.box(g,[8,3.5,7],[x,1.75,-6],ivory,true);this.box(g,[9,.2,10],[x,3.6,-4.5],mat(0xb35f43));this.sign(g,'MUVIE / '+(x===0?'HUB':x<0?'A':'B'),[x,2.4,-2.4],5);this.box(g,[6,.8,1.6],[x,.4,.7],dark,true);for(let i=0;i<3;i++)this.box(g,[1,.8,.9],[x-2+i*1.8,1.2,.7],i%2?stone:ivory);}
   for(let i=0;i<10;i++)this.box(g,[1.5,1.3,1.5],[-15+i%5*2, .65+Math.floor(i/5)*1.3,9],i%2?stone:ivory,true);
  }else if(n===3){
   const pool=new THREE.Mesh(new THREE.CircleGeometry(7,48),new THREE.MeshStandardMaterial({color:0x469c9f,metalness:.65,roughness:.17}));pool.rotation.x=-Math.PI/2;pool.position.set(-7,.2,2);g.add(pool);
   this.box(g,[12,4,8],[6,2,-6],ivory,true);this.box(g,[13,.3,9],[6,4.2,-6],mat(0x72875c));this.box(g,[1,2,.1],[6,3,-1.9],accent);this.box(g,[2,.7,.1],[6,3,-1.85],accent);
   for(let i=0;i<4;i++){this.box(g,[2,.3,5],[10+i*2.5,.3,6],stone);for(let j=0;j<4;j++)this.cylinder(g,.45,.7,[10+i*2.5,.75,4+j*1.2],mat(0x69885a),6);}
   for(let i=0;i<3;i++){this.box(g,[1.2,2+i,1.2],[-5+i*2,1+i*.5,-11],accent);}
   for(const [x,z] of [[-15,-8],[-15,8],[-4,-17]]){this.cylinder(g,.25,6,[x,3,z],stone);for(let j=0;j<8;j++){const vertices=[];for(let k=0;k<5;k++){const a=k/5,b=(k+1)/5;const section=t=>[Math.sin(j)*t*4,6+Math.sin(t*Math.PI)*.8-t*.8,Math.cos(j)*t*4];const A=section(a),B=section(b),wa=Math.sin(a*Math.PI)*.55,wb=Math.sin(b*Math.PI)*.55;vertices.push(A[0]-Math.cos(j)*wa,A[1],A[2]+Math.sin(j)*wa,A[0]+Math.cos(j)*wa,A[1],A[2]-Math.sin(j)*wa,B[0]-Math.cos(j)*wb,B[1],B[2]+Math.sin(j)*wb,A[0]+Math.cos(j)*wa,A[1],A[2]-Math.sin(j)*wa,B[0]+Math.cos(j)*wb,B[1],B[2]-Math.sin(j)*wb,B[0]-Math.cos(j)*wb,B[1],B[2]+Math.sin(j)*wb);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const material=mat(0x547b43);material.side=THREE.DoubleSide;const leaf=new THREE.Mesh(geometry,material);leaf.position.set(x,0,z);g.add(leaf);}}
  }else if(n===4){
   this.box(g,[14,1,12],[0,.5,-3],dark,true);for(const x of [-5,0,5]){this.box(g,[3,5,4],[x,3,-3],ivory,true);for(let y=1.5;y<5;y+=.7)this.box(g,[2.5,.12,.08],[x,y,-.92],accent);}
   this.cylinder(g,.4,17,[0,8.5,-12],dark);const dish=new THREE.Mesh(new THREE.SphereGeometry(4,24,12,0,Math.PI*2,0,.9),ivory);dish.position.set(0,16,-12);dish.rotation.x=.6;g.add(dish);
   for(const x of [-15,15])for(let z=-10;z<8;z+=6){this.box(g,[6,.2,4],[x,2,z],glass).rotation.z=x<0?.2:-.2;this.box(g,[.3,2,.3],[x,1,z],dark,true);}
  }else{
   this.box(g,[7,15,7],[-11,7.5,-5],mat(0x4a414d),true);this.sign(g,'MONOLITH',[-11,16,-1.4],7,'#d0b1fa');
   for(let i=0;i<6;i++){const x=5+i%3*5,z=-9+Math.floor(i/3)*9;this.box(g,[3.2,4+i%3,3.2],[x,2+i%3/2,z],ivory,true);this.box(g,[3.3,.15,3.3],[x,4+i%3,z],accent);}
   const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.18,8,64),accent);ring.rotation.x=Math.PI/2;ring.position.set(10,.3,-4);g.add(ring);
   for(const z of [9,11])this.box(g,[26,.09,.3],[0,.2,z],lit(z===9?0x7dd7d4:0xffc77d));
  }
  // Incoming event packets connect the physical metaphor to the terminal.
  const packet=new THREE.Mesh(new THREE.SphereGeometry(.17,8,6),accent);g.add(packet);this.animations.push((dt,t)=>packet.position.set(Math.sin(t*.7+n)*10,1,10+Math.cos(t*.7+n)*2));
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.5,28,8),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.2,depthWrite:false}));beam.position.set(0,16,0);g.add(beam);
 }
 buildScenery(){
  let seed=319;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const count=360,rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),stone,count),o=new THREE.Object3D();let placed=0;
  for(let i=0;i<count*4&&placed<count;i++){const x=(random()-.5)*420,z=(random()-.5)*420;if(Math.hypot(x,z)<28||districts.some(d=>Math.hypot(x-d.x,z-d.z)<29))continue;
   // Keep rocks off all marked trails.
   if(districts.some(d=>{const t=Math.max(0,Math.min(1,(x*d.x+z*d.z)/(d.x*d.x+d.z*d.z)));return Math.hypot(x-t*d.x,z-t*d.z)<7;}))continue;
   const edge=Math.hypot(x,z)>174,s=edge?5+random()*11:.4+random()*2;o.position.set(x,terrainHeight(x,z)+s*.25,z);o.scale.set(s,s*(.5+random()),s*.7);o.rotation.set(random(),random()*6,random());o.updateMatrix();rocks.setMatrixAt(placed++,o.matrix);if(Math.hypot(x,z)<NOVA_RADIUS-5)this.colliders.push(new THREE.Box3(new THREE.Vector3(x-s*.55,-1,z-s*.4),new THREE.Vector3(x+s*.55,o.position.y+s,z+s*.4)));
  }rocks.count=placed;rocks.castShadow=true;rocks.receiveShadow=true;this.group.add(rocks);
  const positions=[];for(let i=0;i<300;i++)positions.push((random()-.5)*350,random()*18,(random()-.5)*350);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.dust=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffe0af,size:.12,transparent:true,opacity:.32,depthWrite:false}));this.group.add(this.dust);this.animations.push((dt)=>{this.dust.position.x=(this.dust.position.x+dt*.7)%20;});
  // Distant sun and layered mesa silhouettes give the desert a horizon.
  const sun=new THREE.Mesh(new THREE.SphereGeometry(13,24,16),lit(0xffddaa));sun.position.set(-180,104,-280);this.scene.add(sun);
  for(let i=0;i<38;i++){const a=i/38*Math.PI*2,r=230+random()*35,h=15+random()*30;const mesa=new THREE.Mesh(new THREE.CylinderGeometry(9+random()*9,18+random()*12,h,5),mat(i%2?0xa47b65:0x98745f));mesa.position.set(Math.sin(a)*r,h/2-3,Math.cos(a)*r);this.group.add(mesa);}
 }
 buildBiomeDetails(){
  for(const [n,d] of districts.entries()){
   const g=new THREE.Group();g.position.set(d.x,0,d.z);this.group.add(g);
   if(n===0||n===1)for(const side of [-1,1])for(let j=0;j<5;j++){const x=side*(27+j%2*3),z=-25+j*10,h=6+Math.sin(j*2+n)*3;const rock=new THREE.Mesh(new THREE.CylinderGeometry(2.8,5,h,5),n===0?stone:mat(0x75564a));rock.position.set(x,terrainHeight(d.x+x,d.z+z)+h/2,z);g.add(rock);}
   if(n===5)for(let j=0;j<11;j++){const a=j/11*Math.PI*1.4+Math.PI*.3,x=Math.sin(a)*28,z=Math.cos(a)*28,h=4+j%4*2;const column=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.6,h,6),mat(0x45414f,.3));column.position.set(x,terrainHeight(d.x+x,d.z+z)+h/2,z);g.add(column);}
   if(n===4)for(let j=0;j<12;j++){const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.2,0),mat(0xd5d8cb,.2));const a=j/12*Math.PI*2,x=Math.sin(a)*26,z=Math.cos(a)*26;crystal.scale.y=1.8;crystal.position.set(x,terrainHeight(d.x+x,d.z+z)+1,z);g.add(crystal);}
  }
 }
 buildVehicle(v,n){
  const g=new THREE.Group();g.name=v.id;this.group.add(g);const body=mat(v.color,.4,.45),tires=mat(0x242c30,.1),glow=lit(v.color);const b=(s,p,m=body)=>this.box(g,s,p,m);
  b([2.4,.5,3.6],[0,.85,0]);b([1.65,.8,1.8],[0,1.4,.1],dark);b([1.6,.65,.06],[0,1.5,-.84],glass);b([1.9,.12,2.1],[0,1.88,.1]);b([2.7,.2,.2],[0,.65,-1.9],dark);
  for(const x of [-.85,.85])b([.45,.15,.1],[x,1,-1.84],lit(0xffe6bd));
  if(n<2){const axles=n===0?[-1.3,0,1.3]:[-1.25,1.25];for(const z of axles)for(const x of [-1.3,1.3]){const wheel=this.cylinder(g,.57,.36,[x,.57,z],tires,12);wheel.rotation.z=Math.PI/2;const hub=this.cylinder(g,.25,.38,[x,.57,z],body,10);hub.rotation.z=Math.PI/2;this.wheels.push({wheel,vehicle:n});}}
  else{for(const x of [-1.4,1.4]){b([.6,.35,4],[x,.5,0],dark);b([.62,.08,3.6],[x,.3,0],glow);}b([1.3,.13,1],[0,1.1,2],glow);}
  for(const x of [-1.21,1.21]){b([.04,.15,2.8],[x,1,0],glow);b([.08,.4,.5],[x,1.4,.2],ivory);}for(let i=0;i<5;i++)b([1.2,.06,.08],[0,1.13,1+i*.13],dark);
  if(n===1){for(const x of [-.85,.85]){b([.1,1.2,.1],[x,1.5,1],dark);b([.1,.1,2.1],[x,2.1,0],dark);}g.scale.setScalar(.88);}
  return g;
 }
 blocked(x,z,r=1.6){return this.colliders.some(b=>x>b.min.x-r&&x<b.max.x+r&&z>b.min.z-r&&z<b.max.z+r)||this.fleet?.some((g,i)=>i!==this.selectedVehicle&&Math.abs(x-g.position.x)<1.4+r&&Math.abs(z-g.position.z)<1.9+r);}
 selectVehicle(n){
  if(!vehicles[n]||this.universe.seated||this.universe.suspended)return;
  this.selectedVehicle=n;this.driving=true;this.driveState=createDriveState(0,5,0);this.cameraReady=false;this.universe.travel=null;this.universe.look={yaw:0,pitch:-.12};this.universe.keys.clear();this.universe.stick={x:0,y:0};this.fleet.forEach((g,i)=>{g.position.set((i-1)*6,.15,1);g.rotation.set(0,0,0);});this.garageOpen=false;
 }
 exitVehicle(){
  if(!this.driving)return true;const s=this.driveState,u=this.universe;
  for(const offset of [Math.PI/2,-Math.PI/2,Math.PI,0]){const x=s.x+Math.sin(s.yaw+offset)*3.7,z=s.z+Math.cos(s.yaw+offset)*3.7;if(Math.hypot(x,z)<186&&!this.blocked(x,z,.45)){this.driving=false;s.speed=0;u.camera.position.set(x,terrainHeight(x,z)+1.85,z);u.look={yaw:s.yaw,pitch:0};u.keys.clear();u.stick={x:0,y:0};return true;}}
  return false;
 }
 drive(dt){
  const u=this.universe,s=this.driveState,v=vehicles[this.selectedVehicle];stepDrive(s,{throttle:(u.keys.has('KeyW')?1:0)-(u.keys.has('KeyS')?1:0)-u.stick.y,steer:(u.keys.has('KeyD')?1:0)-(u.keys.has('KeyA')?1:0)+u.stick.x,brake:u.keys.has('Space'),boost:u.keys.has('ShiftLeft')},v,dt,(x,z)=>this.blocked(x,z));
  const model=this.fleet[this.selectedVehicle],h=terrainHeight(s.x,s.z);model.position.set(s.x,h+(v.id==='skimmer'?.35:.12),s.z);model.rotation.set(0,s.yaw,0);
  const ahead=terrainHeight(s.x-Math.sin(s.yaw)*1.3,s.z-Math.cos(s.yaw)*1.3),behind=terrainHeight(s.x+Math.sin(s.yaw)*1.3,s.z+Math.cos(s.yaw)*1.3);model.rotation.x=Math.atan2(behind-ahead,2.6);
  // Orbit look is independent of steering; a reset-view button restores the chase view.
  const yaw=s.yaw+u.look.yaw,pitch=Math.max(-.6,Math.min(.45,u.look.pitch)),back=9*Math.cos(pitch),desired=new THREE.Vector3(s.x+Math.sin(yaw)*back,h+4.5-Math.sin(pitch)*6,s.z+Math.cos(yaw)*back);desired.y=Math.max(desired.y,terrainHeight(desired.x,desired.z)+1.5);
  // Pull the chase camera forward when a building would occlude the vehicle.
  const focus=new THREE.Vector3(s.x,h+1.4,s.z),delta=desired.clone().sub(focus),length=delta.length();for(let t=1;t<length;t+=.5){const point=focus.clone().addScaledVector(delta,t/length);if(this.colliders.some(b=>b.containsPoint(point))){desired.copy(focus).addScaledVector(delta,Math.max(.2,(t-.7)/length));break;}}
  if(!this.cameraReady||!u.motion)u.camera.position.copy(desired);else u.camera.position.lerp(desired,1-Math.exp(-dt*9));this.cameraReady=true;u.camera.lookAt(focus);
 }
 collisions(position){
  const radius=Math.hypot(position.x,position.z);if(radius>NOVA_RADIUS){position.x*=NOVA_RADIUS/radius;position.z*=NOVA_RADIUS/radius;}super.collisions(position);const limit=Math.hypot(position.x,position.z);if(limit>NOVA_RADIUS){position.x*=NOVA_RADIUS/limit;position.z*=NOVA_RADIUS/limit;}position.y=terrainHeight(position.x,position.z)+1.85;
 }
 beginReading(item,keepScroll=false){if(item.novaDistrict!==undefined){this.discovered.add(districts[item.novaDistrict].id);try{localStorage.setItem('nova-expedition-v1',JSON.stringify([...this.discovered]));}catch{}}super.beginReading(item,keepScroll);}
 update(dt,time,camera,focused){super.update(dt,time,camera,focused);const s=this.driving?this.driveState:camera.position;let nearest=-1,min=Infinity;districts.forEach((d,i)=>{const distance=Math.hypot(s.x-d.x,s.z-d.z);if(distance<min){min=distance;nearest=i;}});this.nearDistrict=min<30?nearest:-1;for(const {wheel,vehicle} of this.wheels)if(this.driving&&vehicle===this.selectedVehicle)wheel.rotation.x-=this.driveState.speed*dt/.57;}
}
