import * as THREE from 'three';
import { cuboid,ring,glow } from './design.js';
import { labDefinitions,createLabState,stepLab,labMetrics } from './atlas-simulation.js';
import { createLabConsole } from './atlas-lab-ui.js';

export function atlasExamples(language){const id=language==='id';return labDefinitions.map(d=>[d.hint[id?0:1],id?'Model edukasi dengan parameter yang dapat diubah; angka bukan benchmark.':'Interactive teaching model; values are not benchmarks.']);}

function plaque(title,subtitle){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle='#0b1d28';c.fillRect(0,0,768,160);c.fillStyle='#8ce9d8';c.fillRect(0,0,5,160);c.font='20px monospace';c.fillText(subtitle,28,46);c.fillStyle='#e0f6ef';c.font='500 36px sans-serif';c.fillText(title,28,108,710);const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;return texture;}

export function buildAtlas(world){
 const u=world.universe;world.lab={selected:0,paused:false,states:labDefinitions.map((_,i)=>createLabState(i))};
 world.scene.background=new THREE.Color('#040d17');world.scene.fog=new THREE.FogExp2('#040d17',.014);
 world.scene.traverse(o=>{if(o.isDirectionalLight)o.intensity*=.38;if(o.isHemisphereLight)o.intensity=.65;});
 const ceramic=new THREE.MeshStandardMaterial({color:0x9dbdbd,metalness:.28,roughness:.48});
 const navy=new THREE.MeshStandardMaterial({color:0x102735,metalness:.6,roughness:.38});
 const edge=new THREE.MeshStandardMaterial({color:0x365968,metalness:.65,roughness:.35});
 const white=new THREE.MeshBasicMaterial({color:0xc6f9e7});
 const accents=[0x9eaff5,0x7de7dd,0x80d7ff,0xc2e49b,0xefb49f,0xe0b5f5,0x8de6d0];
 const glass=new THREE.MeshBasicMaterial({color:0x76dccc,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false});
 const box=(p,size,pos,mat=navy)=>cuboid(p,size,pos,mat);
 const tube=(parent,radius,height,position,material)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,24,1,true),material);m.position.fromArray(position);parent.add(m);return m;};
 const line=(parent,points,color=0x4c7987)=>{const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:true,opacity:.7}));parent.add(l);return l;};
 const sphere=(parent,r,pos,material)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),material);m.position.fromArray(pos);parent.add(m);return m;};
 // Architectural scale: sealed specimen bays, clerestory windows, ceiling luminaires and a service spine.
 box(world.group,[22,.06,22],[0,.23,0],new THREE.MeshStandardMaterial({color:0x071b28,roughness:.52,metalness:.48}));
 for(const x of [-10.4,10.4]){
  box(world.group,[.25,1.15,20],[x,.85,0],ceramic);
  for(const z of [-7,-2,3,8]){box(world.group,[.25,5.2,.16],[x,2.8,z],edge);box(world.group,[.035,2.7,4.7],[x,3.4,z-2.4],glass);box(world.group,[.07,.06,4.8],[x*.99,4.85,z-2.4],white);}
 }
 for(const z of [-7,-1,5]){for(const x of [-8,8])box(world.group,[.15,5.2,.2],[x,2.8,z],edge);box(world.group,[16.2,.16,.28],[0,5.4,z],edge);for(const x of [-4,4]){box(world.group,[4,.1,.6],[x,5.25,z],ceramic);box(world.group,[3.6,.025,.4],[x,5.18,z],white);}}
 box(world.group,[20,1.3,.25],[0,.9,-10],ceramic);box(world.group,[19,2.7,.04],[0,3.5,-10],glass);
 const title=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.15),new THREE.MeshBasicMaterial({map:plaque('BACKEND OBSERVATORY','ATLAS / EXPERIMENTAL SYSTEMS'),toneMapped:false}));title.position.set(0,4,-9.8);world.group.add(title);
 for(const x of [-2.1,2.1]){box(world.group,[.025,.015,18],[x,.27,0],new THREE.MeshBasicMaterial({color:0x497f83}));for(let z=-8;z<8;z+=1.2)box(world.group,[.2,.018,.035],[x,.28,z],white);}
 // Low central kinetic sculpture leaves sightlines open and provides an orientation landmark.
 const core=new THREE.Group();core.position.set(0,.28,1);world.group.add(core);tube(core,1,.18,[0,.1,0],edge);const rings=[];for(let i=0;i<3;i++)rings.push(ring(core,.6+i*.18,.4+i*.1,0x8ce8d2,.018,[.3+i*.7,.5,0]));sphere(core,.23,[0,.65,0],white);glow(core,0x86e9db,3,[0,.65,0],.12);
 world.colliders.push(new THREE.Box3(new THREE.Vector3(-1,.2,0),new THREE.Vector3(1,1.5,2)));
 const positions=[[-6,5],[6,5],[-6,0],[-6,-5],[6,0],[6,-5],[0,-7]];
 const rigs=[];
 positions.forEach(([x,z],n)=>{
  const root=new THREE.Group();root.position.set(x,.28,z);root.name='atlas-rig-'+labDefinitions[n].key;world.group.add(root);
  const color=accents[n],lit=new THREE.MeshBasicMaterial({color}),muted=lit.clone();muted.color.multiplyScalar(.3);
  // Individual apparatus silhouettes, rather than seven copies of a console.
  if(n!==2&&n!==6){box(root,[3.7,.12,2.6],[0,.08,0],edge);for(const side of [-1,1])box(root,[.16,.8,2],[side*1.45,.5,0],ceramic);box(root,[3.5,.14,2.4],[0,.95,0],ceramic);box(root,[3.2,.035,2.1],[0,1.035,0],navy);}
  const bits=[],paths=[],parts={};
  if(n===0){
   const points=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,pos=[Math.cos(a)*1.25,2+Math.sin(a)*.75,0];points.push(pos);bits.push(sphere(root,.18,pos,lit.clone()));paths.push(line(root,[[0,2,0],pos],color));}parts.hub=sphere(root,.26,[0,2,0],white);parts.points=points;
   ring(root,1.55,2,color,.013,[Math.PI/2,0,0]);
  }
  if(n===1){
   parts.portals=[];for(const sx of [-1.4,1.4]){const portal=ring(root,.72,1.9,color,.055,[0,Math.PI/2,0]);portal.position.x=sx;parts.portals.push(portal);box(root,[.15,.7,.9],[sx,1.35,0],edge);}
   for(let i=0;i<8;i++){const m=box(root,[.12,.35,.35],[-.8+(i%4)*.5,1.65+Math.floor(i/4)*.65,0],lit.clone());bits.push(m);}line(root,[[-1.5,1.9,0],[1.5,1.9,0]],color);
  }
  if(n===2){
   tube(root,1.05,.2,[0,.15,0],edge);tube(root,.88,2.4,[0,1.5,0],glass);ring(root,.9,.3,color,.04);ring(root,.9,2.7,color,.04);
   parts.fluid=tube(root,.83,1,[0,.5,0],new THREE.MeshBasicMaterial({color,transparent:true,opacity:.24,depthWrite:false}));
   for(let i=0;i<6;i++){const a=i*Math.PI/3,pos=[Math.cos(a)*1.5,1.1,Math.sin(a)*1.1];bits.push(sphere(root,.14,pos,lit.clone()));line(root,[[0,1.1,0],pos],color);}
   tube(root,.07,1.2,[-1.6,1.9,0],lit);box(root,[1.6,.1,.1],[-.8,2.5,0],lit);
  }
  if(n===3){
   const geometry=new THREE.BoxGeometry(.19,.12,.25);parts.cells=new THREE.InstancedMesh(geometry,lit,60);parts.cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(parts.cells);const dummy=new THREE.Object3D();for(let i=0;i<60;i++){dummy.position.set(-1.35+(i%10)*.3,1.2+Math.floor(i/10)*.18,0);dummy.updateMatrix();parts.cells.setMatrixAt(i,dummy.matrix);parts.cells.setColorAt(i,new THREE.Color(0x365b65));}
   parts.seek=box(root,[.05,1.4,.04],[-1.5,1.7,.3],white);parts.arch=box(root,[3.15,.07,.12],[0,2.4,0],edge);
  }
  if(n===4){
   parts.gate=box(root,[.08,1.25,.12],[0,1.8,0],lit.clone());for(const sx of [-1.25,1.25]){tube(root,.4,.9,[sx,1.55,0],edge);ring(root,.4,2.02,color,.025);bits.push(sphere(root,.22,[sx,1.75,0],lit.clone()));}line(root,[[-1.25,1.8,0],[1.25,1.8,0]],color);
   ring(root,.75,1.8,color,.014,[Math.PI/2,0,0]);
  }
  if(n===5){
   for(const sx of [-1.05,1.05]){box(root,[.7,.9,.8],[sx,1.55,0],edge);for(let i=0;i<4;i++)bits.push(box(root,[.6,.08,.06],[sx,1.25+i*.2,.44],lit.clone()));}
   line(root,[[0,1.2,1],[-1.05,1.8,0]],color);line(root,[[0,1.2,1],[1.05,1.8,0]],color);parts.balance=box(root,[2.6,.045,.08],[0,2.3,0],lit);
  }
  if(n===6){
   for(const sx of [-1.3,1.3]){tube(root,.65,.22,[sx,.15,0],edge);tube(root,.55,2.4,[sx,1.45,0],glass);for(let i=0;i<3;i++)ring(root,.55,.3+i*1.1,color,.035);}
   for(let i=0;i<12;i++)bits.push(box(root,[.65,.08,.45],[i<6?-1.3:1.3,.5+(i%6)*.3,0],lit.clone()));line(root,[[-1.3,1.65,0],[1.3,1.65,0]],color);
   box(root,[3.4,.14,1.7],[0,.13,0],edge);
  }
  const label=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.58),new THREE.MeshBasicMaterial({map:plaque(labDefinitions[n].name[1],String(n+1).padStart(2,'0')+' / '+labDefinitions[n].tag),toneMapped:false}));label.position.set(0,.7,1.32);root.add(label);
  glow(root,color,3,[0,1.1,0],.09);
  const packets=new THREE.InstancedMesh(new THREE.SphereGeometry(.045,6,5),new THREE.MeshBasicMaterial({color:0xf7d7a5}),32);packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);packets.frustumCulled=false;if(n===4||n===5)for(let i=0;i<32;i++)packets.setColorAt(i,new THREE.Color(0xffffff));root.add(packets);
  const item=world.addStory(n,[x,1.65,z],[x,1.65,z+1.55],color);item.screen.rotation.y=0;item.kind='experiment';item.labIndex=n;item.label={id:labDefinitions[n].name[0],en:labDefinitions[n].name[1]};item.preview={id:labDefinitions[n].hint[0],en:labDefinitions[n].hint[1]};
  world.colliders.push(new THREE.Box3(new THREE.Vector3(x-1.85,.2,z-1.25),new THREE.Vector3(x+1.85,3,z+1.25)));
  rigs.push({root,bits,paths,parts,packets,label,item,color});
 });
 const consoleUI=createLabConsole(world,n=>{const [x,z]=positions[n];u.release();u.flyTo(new THREE.Vector3(x,1.85,z+3.25),new THREE.Vector3(x,1.7,z));});
 const dummy=new THREE.Object3D(),tint=new THREE.Color();let language=world.language,visualTime=0,lastFrame=performance.now();
 world.animations.push((dt)=>{
  const active=u.world===world&&u.mode==='world'&&!u.suspended&&!u.seated;
  const now=performance.now(),clockDelta=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
  const simDelta=active&&!document.hidden&&!world.lab.paused&&!document.body.classList.contains('mobile-menu-open')?clockDelta:0;
  if(simDelta>0)world.lab.states.forEach(s=>stepLab(s,simDelta));
  // Reduced motion freezes visual travel, while the teaching models continue to report outcomes.
  visualTime+=simDelta;const t=u.motion?visualTime:1;
  rings.forEach((r,i)=>{r.rotation.y=t*(.1+i*.035);});
  rigs.forEach((rig,n)=>{
   const s=world.lab.states[n],p=s.params,{bits,parts}=rig;
   if(world.reading===rig.item)world.lab.selected=n;
   if(language!==world.language){rig.label.material.map.dispose();rig.label.material.map=plaque(labDefinitions[n].name[world.language==='id'?0:1],String(n+1).padStart(2,'0')+' / '+labDefinitions[n].tag);}
   const affected=Number(labMetrics(s)[0][1]);
   if(n===0){bits.forEach((b,i)=>{b.material.color.set(i<affected?0xf2c48b:rig.color);b.scale.setScalar(i<affected&&s.pulses.length?1.15:1);rig.paths[i].material.opacity=i<affected?.9:.16;});parts.hub.rotation.y=t*.3;}
   if(n===1)bits.forEach((b,i)=>{b.visible=i<p.workers;b.material.color.set(i<s.active.length?0x8ce8d8:0x294b59);});
   if(n===2){const level=Math.max(.04,Math.min(2.2,s.queue/200*2.2));parts.fluid.scale.y=level;parts.fluid.position.y=.35+level/2;bits.forEach((b,i)=>{b.visible=i<p.consumers;b.material.color.set(s.toggle?0xe99892:rig.color);});}
   if(n===3){const visited=s.toggle?Math.ceil(s.progress*7):Math.ceil(s.progress*60);for(let i=0;i<60;i++)parts.cells.setColorAt(i,tint.set(i<visited?rig.color:0x294b59));parts.cells.instanceColor.needsUpdate=true;parts.seek.position.x=-1.5+s.progress*3;parts.arch.material=s.toggle?white:edge;}
   if(n===4){parts.gate.rotation.z=s.toggle&&s.breaker==='open'?Math.PI/2:0;parts.gate.material.color.set(s.breaker==='open'?0xee9d95:rig.color);bits[1].material.color.set(p.failure>50?0xee9d95:rig.color);}
   if(n===5){const share=s.deployed?p.canary:0;bits.forEach((b,i)=>{b.material.color.set(i>=4?(s.deployed?0xe3bef5:0x294b59):0x8ce8d8);});parts.balance.rotation.z=(share-50)/100*.35;}
   if(n===6)bits.forEach((b,i)=>{const v=i<6?s.version:s.readVersion;b.visible=i%6<Math.min(6,v);b.material.color.set(i<6||s.version===s.readVersion?rig.color:0xf2c48b);});
   for(let i=0;i<32;i++){
    let x=0,y=-10,z=0;const f=(t*.35+i/16)%1;
    if(n===0&&s.changed&&i<6&&i<affected){const pos=parts.points[i];x=pos[0]*f;y=2+(pos[1]-2)*f;}
    if(n===1){if(i<s.active.length){const job=s.active[i],progress=1-job.left/job.total;x=-1.25+progress*2.5;y=1.9+(i%2?.3:-.3);z=(i%3-1)*.12;}else if(i<s.active.length+Math.min(24,Math.floor(s.queue))){const q=i-s.active.length;x=-1.65-(q%3)*.09;y=1.3+Math.floor(q/3)*.14;z=.15;}}
    if(n===2&&i<Math.min(32,Math.floor(s.queue))){const a=i*2.4+t*.2;x=Math.cos(a)*.65;y=.4+(i%8)*.23;z=Math.sin(a)*.65;}
    if(n===3&&s.running&&i<6){x=-1.5+f*3;y=1.25+i*.18;z=.35;}
    if(n===4&&!(s.toggle&&s.breaker==='open')&&i<8){const failed=(i*37+Math.floor(s.time*5))%100<p.failure;x=-1.25+f*(failed?1.3:2.5);y=1.8;z=(i%2)*.12;rig.packets.setColorAt(i,tint.set(failed?0xff8888:0x8ce8d8));}
    if(n===5&&i<16){const isNew=s.deployed&&i/16*100<p.canary;x=f*(isNew?1.05:-1.05);y=1.2+f*.6;z=1-f;rig.packets.setColorAt(i,tint.set(isNew?(i*37%100<p.defect?0xff8888:0xe0b5f5):0x8ce8d8));}
    if(n===6&&i<Math.min(16,s.events.length)){x=s.toggle?-.7+i*.09:-1.2+f*2.4;y=1.65;z=.15;}
    dummy.position.set(x,y,z);dummy.updateMatrix();rig.packets.setMatrixAt(i,dummy.matrix);
   }
   rig.packets.instanceMatrix.needsUpdate=true;if(rig.packets.instanceColor)rig.packets.instanceColor.needsUpdate=true;
  });language=world.language;consoleUI.update(clockDelta);
 });
}
