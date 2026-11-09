import * as THREE from 'three';
import { InteractiveLocation, block, labelTexture } from './interactions.js';
import { exhibitsFor } from './exhibits.js';
import { FOREST, biomes, puzzles, createPuzzleState, act, randomForest, trailPoints, terrainHeight, inRiver, restoreProgress } from './chronos-model.js';
import { createChronosUI } from './chronos-ui.js';
const material=(color,emissive=0)=>new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness:.9,emissive:new THREE.Color(emissive).convertSRGBToLinear(),emissiveIntensity:.3});
const bark=material(0x3d1c54),leaf=material(0x7741aa),stone=material(0x503467),pathMat=material(0x66437c),glowing=material(0xdf9bff,0x993dde);
export class ChronosWorld extends InteractiveLocation {
 constructor(language,u){
  super(1,language,u);this.group.name='chronos-violet-forest';this.bounds={...FOREST};this.endZ=FOREST.minZ;this.entry={position:[0,1.85,9],yaw:0,pitch:0};this.sky.visible=false;
  this.scene.background=new THREE.Color(0x241237);this.scene.fog=new THREE.FogExp2(0x39204f,.006);
  this.scene.children.filter(o=>o.isPoints).forEach(o=>o.visible=false);
  this.scene.children.filter(o=>o.isHemisphereLight).forEach(o=>{o.color.set(0xe7c4ff);o.groundColor.set(0x492360);o.intensity=.95;});
  const sun=this.scene.children.find(o=>o.isDirectionalLight);sun.color.set(0xd7adff);sun.intensity=1.6;sun.position.set(-50,90,15);
  this.solved=new Set();try{this.solved=restoreProgress(JSON.parse(localStorage.getItem('chronos-forest-v1')||'[]'));}catch{}
  this.states=puzzles.map(p=>({...createPuzzleState(p),solved:this.solved.has(p.id)}));this.checkpoint={x:0,z:7};this.visited=new Set();this.selected=Math.max(0,this.states.findIndex(s=>!s.solved));this.nearPuzzle=-1;this.trail=null;this.velocityY=0;this.feet=0;this.jumpHeld=false;this.elapsed=0;this.invulnerable=0;this.mapOpen=false;this.message='';this.messageUntil=0;this.finished=false;
  this.buildLandscape();this.buildPaths();this.buildForest();this.buildPuzzles();this.buildCamp();this.cards=this.interactables.filter(i=>i.kind==='read');this.setLanguage(language);this.ui=createChronosUI(this);
 }
 box(size,pos,mat=stone,solid=false){const m=block(this.group,size,pos,mat);if(solid)this.colliders.push(new THREE.Box3().setFromObject(m));return m;}
 mesh(geo,mat,pos,scale){const m=new THREE.Mesh(geo,mat);m.position.fromArray(pos);if(scale)m.scale.fromArray(scale);this.group.add(m);return m;}
 sign(text,x,y,z,width=5,subtitle=''){return this.mesh(new THREE.PlaneGeometry(width,width*224/768),new THREE.MeshBasicMaterial({map:labelTexture(text,'#e4b6ff',subtitle),side:THREE.DoubleSide}),[x,y,z]);}
 buildLandscape(){
  const geo=new THREE.PlaneGeometry(720,440,90,60);geo.rotateX(-Math.PI/2);geo.translate(0,0,-145);const a=geo.attributes.position;
  for(let n=0;n<a.count;n++)a.setY(n,terrainHeight(a.getX(n),a.getZ(n))-.05);geo.computeVertexNormals();const groundMat=material(0x56316b);groundMat.vertexColors=true;const colors=[];for(let i=0;i<a.count;i++){const variation=.52+.22*Math.sin(a.getX(i)*.13)*Math.cos(a.getZ(i)*.17)+.14*Math.sin(a.getX(i)*.3+a.getZ(i)*.1);colors.push(variation,variation*.86,variation);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const ground=this.mesh(geo,groundMat,[0,0,0]);ground.receiveShadow=true;
  this.mesh(new THREE.PlaneGeometry(660,9),new THREE.MeshStandardMaterial({color:0x9b50cc,metalness:.45,roughness:.16,emissive:0x4f186e,emissiveIntensity:.35}),[0,.02,-165]).rotation.x=-Math.PI/2;
  for(const x of [-140,0,140]){
   this.box([5.6,.25,15],[x,.1,-165],bark);
   for(let z=-171;z<=-159;z+=1)this.box([5.8,.06,.14],[x,.25,z],glowing);
   for(const side of [-1,1]){this.box([.15,1,15],[x+side*2.7,.65,-165],stone);}
   this.sign('CHRONOS',x,3,-157,5,'VIOLET RIVER');
  }
  const moon=this.mesh(new THREE.SphereGeometry(16,24,16),new THREE.MeshBasicMaterial({color:0xd3b5ed}),[-150,110,-310]);
  const halo=this.mesh(new THREE.TorusGeometry(23,.25,8,80),glowing,moon.position.toArray());halo.rotation.z=.4;
  // The final sanctuary is reachable at any point; its bloom requires all seals.
  this.mesh(new THREE.CylinderGeometry(14,16,.5,32),stone,[0,.2,-310]);
  this.mesh(new THREE.CylinderGeometry(1.7,3,20,10),bark,[0,10,-316]);
  this.finalCrown=this.mesh(new THREE.IcosahedronGeometry(1,2),material(0x9e54d0,0x6526a0),[0,25,-316],[17,11,14]);
  this.finalItem=this.interactable({id:'chronos-heart',kind:'forest-heart',label:{id:'Jantung Hutan',en:'Heart of the Forest'},preview:{id:'Pulihkan 36 segel untuk membangunkan hutan',en:'Restore 36 seals to awaken the forest'},position:[0,1.6,-303],activationDistance:5,accent:0xe3b4ff});
 }
 path(ax,az,bx,bz,width=4){const length=Math.hypot(bx-ax,bz-az);const mesh=this.box([width,.03,length],[ (ax+bx)/2,.015,(az+bz)/2],pathMat);mesh.rotation.y=Math.atan2(bx-ax,bz-az);this.routes.push({ax,az,bx,bz,width});}
 buildPaths(){
  this.routes=[];this.path(0,9,0,-310,5);
  for(const b of biomes){const bridge=b.x<-60?-140:b.x>60?140:0;
   if(b.z<-165){this.path(bridge,-165,b.x,b.z);this.path(0,-140,bridge,-153);this.path(bridge,-153,bridge,-174);}
   else this.path(0,b.z,b.x,b.z);
   for(const p of puzzles.filter(p=>p.zone===biomes.indexOf(b)))this.path(b.x,b.z,p.x,p.z,2.8);
  }
 }
 clearScenery(x,z){
  if(z>2&&Math.abs(x)<14||Math.abs(z+165)<10||Math.hypot(x,z+310)<23)return true;
  if(biomes.some(b=>Math.hypot(x-b.x,z-b.z)<13)||puzzles.some(p=>Math.hypot(x-p.x,z-p.z)<10))return true;
  if(puzzles.filter(p=>p.type==='trail').some(p=>trailPoints(p).some(t=>Math.hypot(x-t.x,z-t.z)<7)))return true;
  return this.routes.some(r=>{const dx=r.bx-r.ax,dz=r.bz-r.az,t=THREE.MathUtils.clamp(((x-r.ax)*dx+(z-r.az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-r.ax-t*dx,z-r.az-t*dz)<r.width/2+2;});
 }
 buildForest(){
  const random=randomForest(),treeCount=this.universe.low?1300:2400,trees=[];
  for(let i=0;i<treeCount*3&&trees.length<treeCount;i++){const x=(random()-.5)*650,z=45-random()*375;if(!this.clearScenery(x,z))trees.push({x,z,h:9+random()*13,r:2.7+random()*4});}
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.45,.85,1,6),bark,trees.length),crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leaf,trees.length*2),dummy=new THREE.Object3D(),color=new THREE.Color();
  trees.forEach((t,i)=>{const y=terrainHeight(t.x,t.z);dummy.position.set(t.x,y+t.h/2,t.z);dummy.scale.set(1,t.h,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   for(let k=0;k<2;k++){dummy.position.set(t.x+k*1.3,y+t.h-2+k*3,t.z);dummy.scale.set(t.r*(k?.8:1),t.r*.8,t.r);dummy.rotation.y=random()*6;dummy.updateMatrix();crowns.setMatrixAt(i*2+k,dummy.matrix);color.setHSL(.73+random()*.1,.4+random()*.2,.25+random()*.17);crowns.setColorAt(i*2+k,color);}
   this.colliders.push(new THREE.Box3(new THREE.Vector3(t.x-.5,0,t.z-.5),new THREE.Vector3(t.x+.5,t.h,t.z+.5)));
  });trunks.castShadow=true;crowns.castShadow=true;this.group.add(trunks,crowns);
  const count=this.universe.low?1000:2600,stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.1,1,5),material(0xad78ce),count),caps=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,5,0,Math.PI*2,0,Math.PI/2),glowing,count);
  for(let i=0;i<count;i++){const x=(random()-.5)*645,z=35-random()*365,y=terrainHeight(x,z),h=.3+random()*.8;dummy.rotation.set(0,random()*6,0);dummy.position.set(x,y+h/2,z);dummy.scale.set(1,h,1);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);dummy.position.y=y+h;dummy.scale.set(h*.7,h*.4,h*.7);dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);color.setHSL(.72+random()*.17,.65,.6);caps.setColorAt(i,color);}
  this.group.add(stems,caps);
  const undergrowthCount=this.universe.low?2200:5500,grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.35,1,3),material(0x8a4ca8),undergrowthCount);
  for(let i=0;i<undergrowthCount;i++){let x,z;do{x=(random()-.5)*640;z=32-random()*360;}while(this.clearScenery(x,z));dummy.position.set(x,terrainHeight(x,z)+.25,z);dummy.rotation.set((random()-.5)*.5,random()*6,(random()-.5)*.5);const size=.5+random();dummy.scale.set(size,size*.7,size);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);color.setHSL(.74+random()*.1,.4,.2+random()*.18);color.convertSRGBToLinear();grass.setColorAt(i,color);}this.group.add(grass);
  const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),material(0x674476),250);
  for(let i=0;i<250;i++){let x,z;do{x=(random()-.5)*630;z=28-random()*355;}while(this.clearScenery(x,z));dummy.position.set(x,terrainHeight(x,z)+.2,z);dummy.rotation.set(random(),random()*6,random());dummy.scale.set(.5+random(),.3+random()*.6,.5+random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}this.group.add(rocks);
  const particles=[];for(let i=0;i<900;i++)particles.push((random()-.5)*600,1+random()*15,-random()*340);
  const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.Float32BufferAttribute(particles,3));const motes=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xe8acff,size:.14,transparent:true,opacity:.7,depthWrite:false}));this.group.add(motes);this.animations.push((dt,t)=>{motes.position.y=Math.sin(t*.2)*.4;});
 }
 buildPuzzles(){
  this.puzzleMeshes=[];this.trailRings=[];this.hurdles=[];this.wisps=[];
  puzzles.forEach((p,n)=>{
   const tint=material(biomes[p.zone].color,biomes[p.zone].color),g=new THREE.Group();g.position.set(p.x,0,p.z);this.group.add(g);
   const base=new THREE.Mesh(new THREE.CylinderGeometry(2,2.4,.3,8),stone);base.position.y=.15;g.add(base);
   const relic=new THREE.Mesh(p.type==='dial'?new THREE.TorusGeometry(.9,.14,8,32):p.type==='riddle'?new THREE.OctahedronGeometry(.85):new THREE.IcosahedronGeometry(.8,1),tint);relic.position.y=2;g.add(relic);this.puzzleMeshes.push(relic);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.04,6,48),tint);ring.rotation.x=-Math.PI/2;ring.position.y=.1;g.add(ring);
   const item=this.interactable({id:p.id,kind:'forest-puzzle',label:p.name,preview:{id:'E · Buka teka-teki',en:'E · Open puzzle'},position:[p.x,1.7,p.z+2.7],activationDistance:4.5,accent:biomes[p.zone].color,size:[2,2,1]});item.puzzleIndex=n;
   if(p.type==='trail'){
    const points=trailPoints(p),rings=points.map((point,i)=>{const r=this.mesh(new THREE.TorusGeometry(1.65,.1,8,32),tint.clone(),[point.x,1.9,point.z]);r.userData.point=point;r.userData.order=i;return r;});this.trailRings.push({n,rings});
    // Jumpable fallen logs across the marked course, with room to approach.
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],x=(a.x+b.x)/2,z=(a.z+b.z)/2;const log=this.mesh(new THREE.CylinderGeometry(.43,.43,5,8),bark,[x,.43,z]);log.rotation.z=Math.PI/2;this.hurdles.push({x,z,width:5,depth:.86,height:.86});}
    const wisp=this.mesh(new THREE.SphereGeometry(.55,12,8),material(0xee8fee,0xc348bf),[p.x+7,1,p.z+(p.zone===1||p.zone===2?16:-16)]);this.wisps.push({mesh:wisp,x:p.x,z:p.z+(p.zone===1||p.zone===2?16:-16),phase:p.zone});
   }
  });
  biomes.forEach((b,n)=>{
   this.sign(b.name[this.language],b.x,5,b.z+3,9,'CHRONOS / '+String(n+1).padStart(2,'0'));
   const en=exhibitsFor(1,'en')[n],id=exhibitsFor(1,'id')[n];
   this.box([2.2,1,.8],[b.x, .5,b.z+5],bark);
   this.interactable({id:`forest-story-${n}`,label:{en:en.title,id:id.title},preview:{id:'Catatan perjalanan · cerita pengalaman',en:'Travel journal · experience story'},position:[b.x,1.6,b.z+6],screenPosition:[b.x,2,b.z+5.5],activationDistance:4,screenWidth:2.6,accent:b.color,stories:lang=>{const e=exhibitsFor(1,lang)[n];return [[e.title,e.body]];}});
   // Each clearing has its own large silhouette.
   if(n===1)for(const dx of [-7,7]){this.mesh(new THREE.CylinderGeometry(.7,1,8,8),bark,[b.x+dx,4,b.z-2]);this.mesh(new THREE.SphereGeometry(5,16,8,0,Math.PI*2,0,Math.PI/2),glowing,[b.x+dx,8,b.z-2],[1,.5,1]);}
   else if(n===2)for(const dx of [-8,8]){this.box([1.8,9,1.8],[b.x+dx,4.5,b.z-3],stone,true);this.box([4,.4,3],[b.x+dx,9,b.z-3],glowing);} 
   else if(n===3)for(let k=0;k<7;k++){const a=k/7*Math.PI*2;this.mesh(new THREE.OctahedronGeometry(1,0),glowing,[b.x+Math.sin(a)*9,3,b.z+Math.cos(a)*9],[1.4,3+k%3,1.4]);}
   else if(n===5){for(let k=0;k<5;k++){const x=b.x-12+k*6;this.box([1.3,3,14],[x,1.5,b.z-5+(k%2?4:-4)],bark,true);}this.box([26,3,1],[b.x,1.5,b.z-17],bark,true);}
   else {this.colliders.push(new THREE.Box3(new THREE.Vector3(b.x-1.5,0,b.z-8.5),new THREE.Vector3(b.x+1.5,16,b.z-5.5)));this.mesh(new THREE.CylinderGeometry(1,2,16,8),bark,[b.x,8,b.z-7]);this.mesh(new THREE.IcosahedronGeometry(8,1),material(b.color),[b.x,18,b.z-7],[1.2,.7,1]);}
  });
 }
 buildCamp(){
  this.sign('CHRONOS',-3.5,1.8,0,2.6,'THE VIOLET WILDS');this.box([.15,1.6,.15],[-3.5,.8,0],bark);this.box([8,.2,6],[0,.05,6],pathMat);
  this.sign('WASD · SHIFT · SPACE',3.5,1.8,0,2.6,'WALK / SPRINT / JUMP');this.box([.15,1.6,.15],[3.5,.8,0],bark);
  for(const x of [-5,5])this.mesh(new THREE.OctahedronGeometry(.5),glowing,[x,2,3]);
 }
 notify(id,en){this.messages={id,en};this.message=this.language==='id'?id:en;this.messageUntil=this.elapsed+6;}
 save(){try{localStorage.setItem('chronos-forest-v1',JSON.stringify([...this.solved]));}catch{}}
 solve(n){const p=puzzles[n];if(this.solved.has(p.id))return;this.states[n].solved=true;this.solved.add(p.id);this.checkpoint={x:p.x,z:p.z+5};this.save();const next=puzzles.map((other,i)=>({i,d:Math.hypot(other.x-p.x,other.z-p.z)})).filter(({i})=>!this.states[i].solved).sort((a,b)=>a.d-b.d)[0];if(next)this.selected=next.i;this.notify(`Segel dipulihkan! ${this.solved.size}/36 · Checkpoint tersimpan.`,`Seal restored! ${this.solved.size}/36 · Checkpoint saved.`);}
 attempt(n,value){if(act(puzzles[n],this.states[n],value))this.solve(n);}
 startTrail(n){if(this.states[n].solved)return;this.trail={n,next:0,remaining:48};this.notify('Lewati 5 lingkaran secara berurutan. Shift untuk lari, Spasi untuk melompati batang.','Pass 5 rings in order. Shift to sprint, Space to jump over logs.');}
 respawn(){const camera=this.universe.camera;camera.position.set(this.checkpoint.x,1.85,this.checkpoint.z);this.feet=0;this.velocityY=0;this.trail=null;this.invulnerable=3;this.universe.keys.clear();this.universe.stick={x:0,y:0};this.notify('Kembali ke checkpoint. Segel yang sudah ditemukan tetap tersimpan.','Back at the checkpoint. Your restored seals are safe.');}
 collisions(position){super.collisions(position);position.x=THREE.MathUtils.clamp(position.x,FOREST.minX,FOREST.maxX);position.z=THREE.MathUtils.clamp(position.z,FOREST.minZ,FOREST.maxZ);}
 walk(dt,dir){
  const u=this.universe,position=u.camera.position,sprint=u.keys.has('ShiftLeft')||u.keys.has('ShiftRight'),jump=u.keys.has('Space'),ground=terrainHeight(position.x,position.z);
  if(jump&&!this.jumpHeld&&this.feet<=ground+.01)this.velocityY=7;this.jumpHeld=jump;
  this.velocityY-=19*dt;this.feet=Math.max(ground,this.feet+this.velocityY*dt);if(this.feet<=ground)this.velocityY=0;
  const previous=position.clone(),distance=dt*(sprint?FOREST.sprint:FOREST.walk);position.addScaledVector(dir,distance);
  for(const h of this.hurdles)if(Math.abs(position.x-h.x)<h.width/2+.3&&Math.abs(position.z-h.z)<h.depth/2+.3&&this.feet<h.height+.05){position.x=previous.x;position.z=previous.z;break;}
  position.y=this.feet+1.85;this.collisions(position);
  if(inRiver(position.x,position.z)&&this.feet<.3){this.respawn();return;}
  this.sprinting=sprint&&dir.lengthSq()>.1;
 }
 activate(item){
  if(item.kind==='forest-puzzle'){this.ui.openPuzzle(item.puzzleIndex);return true;}
  if(item.kind==='forest-heart'){
   if(this.solved.size<36)this.notify(`Jantung hutan membutuhkan ${36-this.solved.size} segel lagi.`,`The forest heart needs ${36-this.solved.size} more seals.`);
   else {this.finished=true;this.notify('Hutan terbangun! Semua 36 segel pulih. Terima kasih, Penjaga Chronos.','The forest awakens! All 36 seals restored. Thank you, Guardian of Chronos.');}return true;
  }return false;
 }
 update(dt,time,camera,focused){
  super.update(dt,time,camera,focused);
  const now=performance.now()/1000,step=Math.min(.05,now-(this.lastTick??now));this.lastTick=now;const u=this.universe,paused=u.suspended||u.seated||this.mapOpen||!!u.travel||!document.querySelector('#guide')?.hidden||document.body.classList.contains('mobile-menu-open');
  if(!paused){this.elapsed+=step;this.invulnerable=Math.max(0,this.invulnerable-step);}
  const pos=camera.position;
  for(const b of biomes)if(Math.hypot(pos.x-b.x,pos.z-b.z)<12&&!this.visited.has(b.id)){this.visited.add(b.id);this.checkpoint={x:b.x,z:b.z+9};this.notify('Nyalakan checkpoint: '+b.name.id,'Checkpoint lit: '+b.name.en);}
  this.nearPuzzle=puzzles.findIndex(p=>Math.hypot(pos.x-p.x,pos.z-p.z-2.7)<6);
  this.puzzleMeshes.forEach((m,n)=>{m.rotation.y=time*.35;m.position.y=2+Math.sin(time+n)*.15;m.material.emissiveIntensity=this.states[n].solved?1.5:.3;});
  this.trailRings.forEach(({n,rings})=>rings.forEach((r,i)=>{const active=this.trail?.n===n;r.visible=!this.states[n].solved;r.scale.setScalar(active&&i===this.trail.next?1.12+Math.sin(time*4)*.07:1);r.material.emissiveIntensity=active&&i===this.trail.next?1:.3;}));
  if(this.trail&&!paused){const trail=this.trail;trail.remaining-=step;const p=trailPoints(puzzles[trail.n])[trail.next];if(Math.hypot(pos.x-p.x,pos.z-p.z)<1.8){trail.next++;if(trail.next===5){this.solve(trail.n);this.trail=null;}}
   if(this.trail&&trail.remaining<=0){this.trail=null;this.notify('Waktu habis. Kembali ke altar untuk mencoba lagi.','Time is up. Return to the altar to try again.');}}
  for(const w of this.wisps){w.mesh.position.x=w.x+Math.sin(this.elapsed*.7+w.phase)*7;w.mesh.position.z=w.z+Math.cos(this.elapsed*.6+w.phase)*4;if(!paused&&!this.invulnerable&&pos.distanceTo(w.mesh.position)<1.1)this.respawn();}
  this.finalCrown.material.emissiveIntensity=this.finished?2:this.solved.size/36;
  
 }
}
