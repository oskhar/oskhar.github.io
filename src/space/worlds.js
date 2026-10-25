import * as THREE from 'three';
import { InteractiveLocation, block } from './interactions.js';
import { CozyHome } from './home.js';
import { exhibitsFor } from './exhibits.js';
import { altar, magneticCrystal, starship, landingVehicle, ring, glow, cuboid, materials, screenTexture } from './design.js';

export class DestinationWorld extends InteractiveLocation {
 constructor(index,language,u){
  super(index,language,u);if(index===0)return new CozyHome(language,u);
  this.entry={position:[0,1.85,9.3],yaw:0,pitch:0};this.bounds={minX:-10.5,maxX:10.5,minZ:-9,maxZ:9.5};this.endZ=-9;this.altars=[];this.vehicleChecks=[];
  const colors=[0xb8dfd0,0xd9bb7a,0x7fb9e0,0x77d8ef,0x9fbfdf],accent=colors[index];const metal=materials.metal,glowMat=new THREE.MeshBasicMaterial({color:accent});
  const b=(size,pos,mat=metal)=>block(this.group,size,pos,mat);const floor=new THREE.MeshStandardMaterial({color:0x132330,metalness:.35,roughness:.6});b([23,.4,23],[0,0,0],floor);
  this.scene.background=new THREE.Color(index===1?'#090b19':index===2?'#08131d':'#06131f');this.scene.fog=new THREE.FogExp2(this.scene.background,.004);
  for(let x=-10;x<=10;x+=2)for(let z=-10;z<=10;z+=2){b([1.98,.008,.012],[x,.205,z],new THREE.MeshBasicMaterial({color:0x294350}));b([.012,.008,1.98],[x,.205,z],new THREE.MeshBasicMaterial({color:0x294350}));}
  const center=ring(this.group,2.1,.218,accent,.012);ring(this.group,2.3,.218,accent,.004);
  const fill=new THREE.DirectionalLight(0x9bc4e3,.7);fill.position.set(0,4,10);this.scene.add(fill);const back=new THREE.DirectionalLight(0xf2d4b3,.45);back.position.set(0,3,-10);this.scene.add(back);
  const cards=exhibitsFor(index,language);
  if(index===1)this.archive(cards,accent);
  if(index===2)this.hangar(cards,accent);
  if(index===3)this.laboratory(cards);
  if(index===4)this.station(cards,accent,b);
  this.cards=this.interactables;this.setLanguage(language);
 }
 addAltar(x,z,color,options){const a=altar(this.group,x,z,color,options);this.altars.push(a);const box=new THREE.Box3(new THREE.Vector3(x-a.radius-.18,.2,z-a.radius-.18),new THREE.Vector3(x+a.radius+.18,a.top,z+a.radius+.18));this.colliders.push(box);return a;}
 archive(cards,color){
  // A ring of kinetic memory sculptures, not walls of text.
  cards.forEach((card,n)=>{const angle=-Math.PI/3+n*Math.PI/3,x=Math.cos(angle)*6.2,z=Math.sin(angle)*6.2;
   const base=this.addAltar(x,z,color,{radius:1.05,height:.68}),sculpture=new THREE.Group();sculpture.position.set(x,1.82,z);this.group.add(sculpture);
   const heart=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,1),new THREE.MeshPhysicalMaterial({color:0x7da7bf,emissive:0x4e7d9b,emissiveIntensity:.3,metalness:.5,roughness:.16,clearcoat:1}));sculpture.add(heart);
   const frames=[];for(let i=0;i<2;i++){const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.78+i*.25,.78+i*.25,.78+i*.25)),new THREE.LineBasicMaterial({color:i?0xc1a267:0x93c9df,transparent:true,opacity:.8}));frame.rotation.set(i*.5,i*.7,i*.3);sculpture.add(frame);frames.push(frame);}
   const orbits=[];for(let i=0;i<2;i++)orbits.push(ring(sculpture,.8+i*.17,0,color,.012,[.6+i*.9,.4+i*.4,0]));
   const beam=new THREE.Mesh(new THREE.CylinderGeometry(.04,.2,1,24,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false}));beam.position.set(x,1.17,z);this.group.add(beam);glow(sculpture,0x8cbfd8,3,[0,0,0],.22);
   const item=this.addStory(n,[x,1.6,z],this.inwardScreen(x,z,1.65,1.6),color);
   this.animations.push((dt,time)=>{base.update(dt,time,item.activated);sculpture.position.y=1.82+Math.sin(time*.7+n)*.12;heart.rotation.y+=dt*.22;frames.forEach((f,i)=>{f.rotation.x+=dt*.09*(i?1:-1);f.rotation.z+=dt*.13;});orbits.forEach((r,i)=>r.rotation.y+=dt*(i?-.18:.14));beam.material.opacity=item.activated?.18:.07;});
  });
  for(let n=0;n<6;n++){const a=n*Math.PI/3;const arch=new THREE.Mesh(new THREE.TorusGeometry(1.9,.025,8,80,Math.PI),new THREE.MeshBasicMaterial({color:0x405f75,transparent:true,opacity:.5}));arch.position.set(Math.cos(a)*8.5,0,Math.sin(a)*8.5);arch.rotation.y=-a+Math.PI/2;this.group.add(arch);}
 }
 laboratory(cards){
  cards.forEach((card,n)=>{const angle=-Math.PI/2+n*Math.PI*2/cards.length,x=Math.cos(angle)*6.2,z=Math.sin(angle)*6.2,color=new THREE.Color().setHSL(.48+n*.028,.55,.66);
   const base=this.addAltar(x,z,color,{radius:1.02,height:.6}),crystal=magneticCrystal(this.group,x,z,color,n);
   const item=this.addStory(n,[x,1.9,z],this.inwardScreen(x,z,1.85,1.6),color);
   this.animations.push((dt,time)=>{base.update(dt,time,item.activated);crystal.update(dt,time,item.activated);});
   // A thin energy path connects each magnetic chamber to the central ring.
   const end=new THREE.Vector3(x,.22,z).multiply(new THREE.Vector3(.3,1,.3)),start=new THREE.Vector3(x,.22,z);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineBasicMaterial({color,transparent:true,opacity:.28}));this.group.add(line);
   this.animations.push((dt,time)=>line.material.opacity=(item.activated?.55:.18)+Math.sin(time+n)*.06);
  });
  const nucleus=new THREE.Group();nucleus.position.set(0,.4,0);this.group.add(nucleus);for(let n=0;n<3;n++){const r=ring(nucleus,1.25+n*.2,.015*n,0x7dd8df,.008);this.animations.push(dt=>r.rotation.z+=dt*.07*(n%2?-1:1));}
 }
 hangar(cards,color){
  const variants=['interceptor','explorer','crew-shuttle','lander','rover','cargo-hauler'];this.entry.position[2]=10;this.bounds.maxZ=10.5;
  variants.forEach((variant,n)=>{const angle=-Math.PI/3+n*Math.PI/3,x=Math.cos(angle)*7,z=Math.sin(angle)*7,base=this.addAltar(x,z,color,{radius:1.75,height:.45});
   const vehicle=new THREE.Group();vehicle.position.set(x,base.top+.06,z);this.group.add(vehicle);
   if([0,1,2,5].includes(n)){const ship=starship(vehicle,n===5?3:n);ship.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(ship),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()).sub(vehicle.position),floor=box.min.y-vehicle.position.y,factor=Math.min(2.1/size.x,2.3/size.z,1.6/size.y);ship.scale.setScalar(factor);ship.position.set(-center.x*factor,-floor*factor,-center.z*factor);}
   else{
    const fallback=landingVehicle(vehicle,n===3?'lander':'rover');vehicle.userData.assetStatus='fallback';
    const path=n===3?'lib/space/lander_B.gltf':'lib/space/spacetruck.gltf',anchor=this.model(path,[0,0,0],n===3?1.6:1.1,{collide:false,maxWidth:1.8,maxDepth:2.1});this.group.remove(anchor);vehicle.add(anchor);anchor.visible=false;
    const mounted=anchor.userData.ready.then(loaded=>{if(!loaded)return false;anchor.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(anchor),size=bounds.getSize(new THREE.Vector3());let meshes=0;anchor.traverse(o=>{if(o.isMesh)meshes++;});if(!meshes||bounds.isEmpty()||!Number.isFinite(size.length())||size.y<.1)return false;
     const floor=vehicle.getWorldPosition(new THREE.Vector3()).y;anchor.position.y+=floor-bounds.min.y;anchor.updateWorldMatrix(true,true);anchor.visible=true;fallback.visible=false;vehicle.userData.assetStatus='loaded';return true;
    }).catch(()=>false);this.universe.assetPromises.push(mounted);
   }
   // A model's full rotation stays within a measured safety envelope.
   const radius=1.6,consolePos=this.inwardScreen(x,z,.2,3.35),normal=new THREE.Vector3(-x,0,-z).normalize(),yaw=Math.atan2(normal.x,normal.z);
   const console=new THREE.Group();console.position.fromArray(consolePos);console.rotation.y=yaw;this.group.add(console);cuboid(console,[.85,.82,.52],[0,.41,0],materials.metal,.045);cuboid(console,[.86,.035,.55],[0,.84,0],materials.brass,.01);
   const panel=new THREE.Mesh(new THREE.PlaneGeometry(.73,.49),new THREE.MeshBasicMaterial({map:screenTexture('metrics'),toneMapped:false}));panel.position.set(0,1.09,.03);console.add(panel);
   const screen=console.localToWorld(new THREE.Vector3(0,1.09,.037));const position=console.localToWorld(new THREE.Vector3(0,1,0));
   const item=this.addStory(n,position.toArray(),screen.toArray(),color);item.screenWidth=.73;item.screen.geometry.dispose();item.screen.geometry=new THREE.PlaneGeometry(.73,.49);item.screen.rotation.y=yaw;
   this.vehicleChecks.push({variant,radius,consoleDistance:Math.hypot(consolePos[0]-x,consolePos[2]-z),requiredDistance:radius+.5,vehicle,console});
   console.updateMatrixWorld(true);this.colliders.push(new THREE.Box3().setFromObject(console));
   this.animations.push((dt,time)=>{base.update(dt,time,item.activated);vehicle.rotation.y+=dt*(item.activated?.23:.07);});
  });
  // Balanced illumination also reaches undersides and the front of every vehicle.
  this.scene.children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=1.0);
  for(const [x,z] of [[-6,-5],[6,-5],[-6,5],[6,5]]){const light=new THREE.PointLight(0xb6d9ef,1.3,15,1.5);light.position.set(x,4.5,z);this.scene.add(light);}
  const warm=new THREE.PointLight(0xf2bf8d,.65,20,1.2);warm.position.set(0,2,0);this.scene.add(warm);
  const shell=new THREE.MeshStandardMaterial({color:0x1c2a39,metalness:.6,roughness:.45});for(const x of [-11,11]){block(this.group,[.3,6,23],[x,3,0],shell);for(let z=-8;z<=8;z+=4)block(this.group,[.34,.035,2],[x,3,z],new THREE.MeshBasicMaterial({color:0xa0cce5}));}block(this.group,[22,.25,23],[0,6,0],shell);
 }
 station(cards,accent,b){
  for(const x of [-10,10])for(let z=-9;z<=9;z+=6){b([.25,4,.25],[x,2,z]);b([.3,.03,6],[x,.8,z-3],new THREE.MeshBasicMaterial({color:accent}));}b([20,.25,23],[0,4,0]);
  const props=['lib/asset_3d/laptop.glb','lib/asset_3d/computerScreen.glb','lib/space/solarpanel.gltf','lib/asset_3d/books.glb'];cards.forEach((card,n)=>{const x=n%2?4.5:-4.5,z=n<2?-4:4;this.model('lib/asset_3d/desk.glb',[x,.2,z],.85);this.model(props[n],[x,1.05,z],n===2?.6:.4);this.interactable({id:`contact-${n}`,label:{en:['Mail terminal · send a message','Code terminal · GitHub','Network terminal · LinkedIn','Journal · source CV'][n],id:['Terminal pesan · kirim email','Terminal kode · GitHub','Terminal jaringan · LinkedIn','Jurnal · sumber CV'][n]},preview:{en:['Collaboration and new opportunities','Repositories and development work','Professional connections and collaboration','Full experience, education and skills'][n],id:['Kolaborasi dan peluang baru','Repository dan karya pengembangan','Relasi profesional dan kolaborasi','Riwayat pengalaman, pendidikan, dan keahlian'][n]},position:[x,1.2,z],kind:'link',url:card.url,accent,size:[2.5,2.2,2.5]});});
  for(const z of [-5,5]){const light=new THREE.PointLight(0x9ecde5,1.2,24,1.5);light.position.set(0,3,z);this.scene.add(light);}
 }
 collisions(position){position.x=THREE.MathUtils.clamp(position.x,this.bounds.minX,this.bounds.maxX);position.z=THREE.MathUtils.clamp(position.z,this.bounds.minZ,this.bounds.maxZ);super.collisions(position);}
 inwardScreen(x,z,y,offset){const distance=Math.hypot(x,z)||1;return [x-x/distance*offset,y,z-z/distance*offset];}
 addStory(n,position,screenPosition,accent){
  const en=exhibitsFor(this.index,'en')[n],id=exhibitsFor(this.index,'id')[n];
  return this.interactable({id:`artifact-${n}`,label:{en:en.title,id:id.title},preview:{en:en.preview||en.subtitle||en.tags?.join(' · ')||en.label,id:id.preview||id.subtitle||id.tags?.join(' · ')||id.label},position,screenPosition,rotation:Math.atan2(-position[0],-position[2]),accent,screenWidth:1.1,stories:lang=>{const c=exhibitsFor(this.index,lang)[n];return [[c.title,c.body]];},size:[1.7,2.4,1.7]});
 }
}
