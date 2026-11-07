import * as THREE from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cuboid,ring } from './design.js';

// Static laboratory architecture is batched by material; specimen animation stays separate.
function batchStatic(group){
 group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),batches=new Map();
 group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.transparent)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,meshes:[]});batches.get(key).meshes.push(o);});
 for(const {material,meshes} of batches.values()){
  if(meshes.length<2)continue;
  const geometries=meshes.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));});
  const merged=mergeBufferGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
  const mesh=new THREE.Mesh(merged,material);mesh.receiveShadow=true;group.add(mesh);for(const o of meshes){o.removeFromParent();o.geometry.dispose();}
 }
}
function signTexture(title,sub,accent='#96e9df'){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#102531';c.fillRect(0,0,1024,256);c.fillStyle=accent;c.fillRect(0,0,9,256);c.font='22px monospace';c.fillText(sub,35,65);c.font='500 56px sans-serif';c.fillStyle='#e1efec';c.fillText(title,35,157,950);c.fillStyle='#52717d';c.fillRect(35,205,950,1);return new THREE.CanvasTexture(canvas);
}
export function buildAtlasFacility(world){
 const root=new THREE.Group();root.name='atlas-research-facility';world.group.add(root);const shell=new THREE.Group();root.add(shell);
 if(world.sky)world.sky.visible=false;world.scene.children.filter(o=>o.isPoints).forEach(o=>o.visible=false);
 const m={
  wall:new THREE.MeshStandardMaterial({color:0x8b9fa7,roughness:.65,metalness:.18}),
  panel:new THREE.MeshStandardMaterial({color:0x637d8a,roughness:.56,metalness:.28}),
  dark:new THREE.MeshStandardMaterial({color:0x101f2c,roughness:.45,metalness:.6}),
  steel:new THREE.MeshStandardMaterial({color:0x536d7a,roughness:.33,metalness:.7}),
  white:new THREE.MeshBasicMaterial({color:0xcce7f0,toneMapped:false}),
  mint:new THREE.MeshBasicMaterial({color:0x6db7b3,toneMapped:false}),
  amber:new THREE.MeshBasicMaterial({color:0xc68f3a,toneMapped:false}),
  violet:new THREE.MeshBasicMaterial({color:0x8196d0,toneMapped:false}),
  black:new THREE.MeshStandardMaterial({color:0x0a111a,roughness:.7}),
  glass:new THREE.MeshBasicMaterial({color:0x89c8d5,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false}),
  sample:new THREE.MeshStandardMaterial({color:0x5d9f9b,emissive:0x183d40,emissiveIntensity:.3,roughness:.22,metalness:.3}),
 };
 const box=(size,pos,mat=m.dark,parent=shell,round=0)=>cuboid(parent,size,pos,mat,round);
 const cyl=(r,h,pos,mat=m.steel,parent=shell,segments=16)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat);mesh.position.fromArray(pos);parent.add(mesh);return mesh;};
 const pipe=(a,b,r=.05,mat=m.steel,parent=shell)=>{const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);const mesh=cyl(r,delta.length(),from.clone().add(to).multiplyScalar(.5).toArray(),mat,parent,12);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;};
 const sign=(title,sub,pos,width=2.8,yaw=0,accent)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:signTexture(title,sub,accent),toneMapped:false}));mesh.position.fromArray(pos);mesh.rotation.y=yaw;shell.add(mesh);return mesh;};
 const collider=(min,max)=>world.colliders.push(new THREE.Box3(new THREE.Vector3(...min),new THREE.Vector3(...max)));
 // An enclosed pressure hull. The only exit is a clear 3.6 m airlock towards the landing berth.
 box([22,.18,22],[0,.25,0],m.dark);
 for(const x of [-10.8,10.8]){box([.24,1.5,22],[x,1.1,0],m.dark);box([.24,1.2,22],[x,5.45,0],m.dark);for(const [z,depth] of [[-9.4,3.2],[-1,2.5],[8.4,5.3]])box([.24,3.1,depth],[x,3.35,z],m.panel);}box([22,5.8,.24],[0,3.1,-10.8],m.dark);
 box([9,5.8,.24],[-6.3,3.1,10.5],m.wall);box([9,5.8,.24],[6.3,3.1,10.5],m.wall);box([3.6,1.5,.24],[0,5.25,10.5],m.wall);
 box([22,.22,22],[0,6.05,0],m.dark);
 world.bounds.minX=-10.1;world.bounds.maxX=10.1;
 collider([-10.8,.2,10.25],[-1.8,6,10.7]);collider([1.8,.2,10.25],[10.8,6,10.7]);
 // Large inset wall panels, skirting, structural ribs, and a suspended service ceiling.
 for(const side of [-1,1]){
  for(const z of [-8,-4,0,4,8]){
   box([.12,1.05,3.85],[side*10.62,.95,z],m.wall);box([.14,.6,3.85],[side*10.6,5.6,z],m.panel);
   box([.18,5.6,.12],[side*10.48,3,z-2],m.steel);box([.05,.035,3.5],[side*10.48,1.5,z],m.mint);
  }
  for(const z of [-5,3]){
   // Interior observation windows look into furnished sample preparation rooms, not open space.
   box([.08,2.7,5.5],[side*10.55,3.35,z],m.glass);
   for(const dz of [-2.8,2.8])box([.24,3.1,.13],[side*10.4,3.35,z+dz],m.steel);
   for(const y of [1.8,4.9])box([.24,.13,5.7],[side*10.4,y,z],m.steel);
   box([.15,4.9,6.2],[side*12.4,2.9,z],m.panel);for(const dz of [-3.05,3.05])box([1.8,4.9,.15],[side*11.5,2.9,z+dz],m.dark);box([1.8,.14,6.2],[side*11.5,.45,z],m.steel);
   for(const dz of [-1.7,0,1.7]){box([.65,.15,.9],[side*11.45,1.65,z+dz],m.wall);cyl(.12,.5,[side*11.25,1.98,z+dz],m.sample);box([.03,.9,.5],[side*12.2,3.8,z+dz],m.white);}
  }
 }
 for(const z of [-8,-3,2,7]){
  box([21.4,.2,.28],[0,5.7,z],m.steel);
  for(const x of [-7,-2.5,2.5,7]){box([3,.09,1],[x,5.88,z+.8],m.wall);box([2.7,.045,.74],[x,5.82,z+.8],m.white);}
  for(const x of [-9,9]){box([1.1,.16,2.3],[x,5.83,z+.6],m.black);for(let j=0;j<7;j++)box([.9,.04,.065],[x,5.72,z-.3+j*.28],m.steel);}
 }
 for(const x of [-9.9,9.9])for(const y of [5.05,5.25])pipe([x,y,-10],[x,y,9],.075,m.steel);
 for(let z=-9;z<10;z+=1)for(const x of [-9.9,9.9])box([.25,.36,.07],[x,5.14,z],m.dark);
 // Recessed walking tiles and a marked clean corridor, rendered as a handful of static batches.
 for(let x=-9;x<=9;x+=2)for(let z=-9;z<=9;z+=2)box([1.97,.025,1.97],[x,.355,z],(x+z)%4===0?m.panel:m.steel);
 for(const x of [-2.05,2.05]){box([.035,.012,18],[x,.375,0],m.mint);for(let z=-8;z<9;z+=1.4)box([.18,.014,.045],[x,.38,z],m.white);}
 sign('ATLAS RESEARCH','DEPARTMENT OF EXPERIMENTAL SYSTEMS',[0,4.8,-10.65],6.5);
 sign('OBSERVATION / 01','SEALED ENVIRONMENT',[-10.36,4.55,-5],3,Math.PI/2);
 sign('SAMPLE PREPARATION','AUTHORIZED RESEARCH PERSONNEL',[10.36,4.55,3],3,-Math.PI/2);
 // Airlock columns, decontamination heads and an overhead label make the entry recognisable.
 for(const x of [-1.8,1.8]){box([.24,4.4,.65],[x,2.5,10.3],m.steel);box([.035,3.4,.7],[x*.92,2.5,10.3],m.mint);for(let y=1;y<4;y+=.6)cyl(.055,.09,[x*.9,y,10.3],m.dark);}
 box([3.8,.25,.7],[0,4.55,10.3],m.steel);sign('DECONTAMINATION','AIRLOCK / KEEP ACCESS CLEAR',[0,4.96,10.34],3.2,Math.PI);
 // Lab furniture: reagent storage, fume extraction, microscopes, sample racks and service trolleys.
 function microscope(x,z,y=1.4){box([.38,.045,.48],[x,y,z],m.steel);pipe([x,y+.05,z+.1],[x,y+.52,z-.12],.045,m.wall);pipe([x,y+.52,z-.12],[x,y+.65,z+.08],.06,m.dark);cyl(.09,.16,[x,y+.37,z+.02],m.black);box([.25,.025,.24],[x,y+.19,z],m.wall);}
 for(const [x,z] of [[-9,-7],[9,6]]){
  box([1.3,1.1,2.2],[x,.98,z],m.wall);box([1.45,.1,2.35],[x,1.57,z],m.steel);
  for(const dz of [-.7,.1,.8]){box([.5,.05,.45],[x,1.68,z+dz],m.dark);for(let i=0;i<4;i++){cyl(.035,.2,[x-.17+i*.11,1.8,z+dz],m.sample);cyl(.04,.025,[x-.17+i*.11,1.91,z+dz],m.white);}}
  microscope(x-.25,z-.25,1.64);collider([x-.73,.2,z-1.2],[x+.73,2,z+1.2]);
 }
 for(const x of [-9,9]){
  box([1.3,2.8,2],[x,1.8,-.5],m.wall);box([.09,2.2,1.65],[x+(x<0?.68:-.68),1.9,-.5],m.glass);
  for(let y=.9;y<3;y+=.55){box([1.2,.045,1.9],[x,y,-.5],m.steel);for(const dz of [-.5,.2])cyl(.12,.32,[x,y+.2,-.5+dz],m.sample);}
  collider([x-.7,.2,-1.6],[x+.7,3.3,.6]);
 }
 // Rear analysis consoles, chairs and wall instrument arrays establish human scale.
 for(const x of [-6.5,6.5]){
  box([3.2,.8,1],[x,.85,-9.5],m.wall);box([3.35,.12,1.2],[x,1.3,-9.4],m.steel);
  for(const dx of [-.8,.8]){box([1.05,.65,.1],[x+dx,1.95,-9.7],m.black);sign('ANALYSIS','LIVE TELEMETRY',[x+dx,1.95,-9.63],.95);}
  cyl(.32,.09,[x,.85,-8.6],m.dark);pipe([x,.4,-8.6],[x,.8,-8.6],.045);box([.65,.6,.09],[x,1.17,-8.9],m.dark);collider([x-1.7,.2,-10.2],[x+1.7,2.3,-8.15]);
 }
 // Wall-mounted research displays use restrained instrument traces, rather than floating UI.
 const displays=[];
 for(const x of [-6.5,6.5]){
  box([4.4,2,.12],[x,3.6,-10.53],m.dark);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=320;
  const texture=new THREE.CanvasTexture(canvas),screen=new THREE.Mesh(new THREE.PlaneGeometry(4.1,1.7),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));screen.position.set(x,3.6,-10.45);shell.add(screen);displays.push({canvas,texture});
 }
 let displayFrame=-1;
 function updateDisplays(time){const frame=Math.floor(time*5);if(frame===displayFrame)return;displayFrame=frame;
  displays.forEach(({canvas,texture},index)=>{const c=canvas.getContext('2d');c.fillStyle='#091b27';c.fillRect(0,0,768,320);c.strokeStyle='#193944';c.lineWidth=1;for(let x=20;x<750;x+=30){c.beginPath();c.moveTo(x,70);c.lineTo(x,290);c.stroke();}for(let y=80;y<300;y+=30){c.beginPath();c.moveTo(20,y);c.lineTo(748,y);c.stroke();}
   c.fillStyle='#b9d9db';c.font='18px monospace';c.fillText(index?'PROJECTION RESEARCH / ARRAY B':'SYSTEM DYNAMICS / ARRAY A',24,36);c.fillStyle='#648c9c';c.font='12px monospace';c.fillText('SIMULATED INSTRUMENT SIGNAL / ATLAS RESEARCH',24,58);
   for(let lane=0;lane<3;lane++){c.strokeStyle=['#7fc7bd','#9baed8','#c8d5d2'][lane];c.lineWidth=2;c.beginPath();for(let x=25;x<745;x+=3){const phase=x/45+time*.7+lane;const y=110+lane*65+Math.sin(phase)*(12+lane*4)+Math.cos(phase*.43+index)*9;x===25?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}
   texture.needsUpdate=true;
  });
 }
 updateDisplays(0);
 // Containment specimen: a rotating double helix enclosed by a pressure vessel.
 const chamber=new THREE.Group();chamber.position.set(0,.38,1);root.add(chamber);
 cyl(1.05,.3,[0,.15,0],m.steel,chamber,48);cyl(.98,.18,[0,3.65,0],m.steel,chamber,48);cyl(.89,3.4,[0,1.9,0],m.glass,chamber,48);
 for(const y of [.36,3.52]){const r=ring(chamber,.94,y,0x6fc6c1,.025);r.material.opacity=.8;}
 for(const a of [Math.PI/6,Math.PI*5/6,Math.PI*1.5]){const x=Math.sin(a)*.98,z=Math.cos(a)*.98;pipe([x,.2,z],[x,3.7,z],.055,m.steel,chamber);}
 const specimen=new THREE.Group();specimen.position.y=1.95;chamber.add(specimen);
 for(let strand=0;strand<2;strand++){const points=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*4+strand*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*.43,(i/80-.5)*2.5,Math.sin(a)*.43));}const curve=new THREE.CatmullRomCurve3(points);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,96,.025,6,false),strand?m.violet:m.mint);specimen.add(mesh);}
 for(let i=0;i<17;i++){const a=i/16*Math.PI*4,y=(i/16-.5)*2.5;pipe([Math.cos(a)*.43,y,Math.sin(a)*.43],[-Math.cos(a)*.43,y,-Math.sin(a)*.43],.012,m.white,specimen);}
 sign('DATA HELIX A-07','CONTAINMENT / OBSERVATION ONLY',[0,.75,2.03],1.2);
 for(const [x,z,intensity,color] of [[0,6,1.4,0xd6e8ef],[-7,-4,1.2,0xc5dde8],[7,-4,1.2,0xc5dde8]]){const light=new THREE.PointLight(color,intensity,22,1.3);light.position.set(x,4.8,z);world.scene.add(light);}
 // Each animation rig is housed in a scientific apparatus, with a clear front observation area.
 function mountRig(parent,n){
  const g=new THREE.Group();parent.add(g);
  if(n!==2&&n!==6){
   for(const x of [-1.76,1.76]){box([.08,2.15,.09],[x,2.12,-.85],m.steel,g);box([.025,1.8,1.7],[x,2.12,-.02],m.glass,g);}
   box([3.6,.14,.3],[0,3.18,-.85],m.steel,g);box([3.1,.035,.18],[0,3.08,-.85],m.white,g);
   box([3.2,.12,.55],[0,1.08,-.9],m.steel,g);
   for(const side of [-1,1]){box([.32,.18,.5],[side*1.4,1.17,.6],m.dark,g);for(let k=0;k<3;k++)cyl(.025,.035,[side*1.4,1.28,.45+k*.12],m.mint,g);}
  }
  if(n===0){pipe([-1.5,1.1,-.65],[-1.5,2.65,-.65],.07,m.wall,g);pipe([-1.5,2.65,-.65],[-.7,2.65,-.2],.07,m.wall,g);cyl(.12,.2,[-.7,2.55,-.2],m.dark,g);}
  if(n===2||n===6){for(const x of n===2?[0]:[-1.3,1.3]){const r=n===2?.98:.63;cyl(r,.18,[x,.3,0],m.steel,g,32);cyl(r,.2,[x,2.75,0],m.steel,g,32);for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(.035,.07,[x+Math.cos(a)*r*.88,2.89,Math.sin(a)*r*.88],m.black,g);}pipe([x,2.85,-.3],[x,3.25,-.3],.08,m.steel,g);}box([n===2?1.5:3.5,.17,.5],[0,3.3,-.3],m.steel,g);}
  if(n===3){box([.55,.3,.65],[0,2.8,-.25],m.wall,g);cyl(.15,.22,[0,2.55,-.05],m.dark,g);}
  if(n===4){for(const x of [-1.25,1.25]){cyl(.46,.18,[x,1.12,0],m.steel,g);cyl(.46,.18,[x,2.13,0],m.steel,g);}for(let i=0;i<12;i++){const stripe=box([.15,.015,.23],[-1.5+i*.27,1.06,.95],i%2?m.black:m.amber,g);stripe.rotation.y=-.3;}}
  if(n===5){for(const x of [-1.05,1.05]){pipe([x,2.05,-.15],[x,2.85,-.15],.035,m.steel,g);box([.8,.16,.6],[x,2.88,-.2],m.wall,g);}}
  batchStatic(g);
 }
 batchStatic(shell);
 return {mountRig,update(time){specimen.rotation.y=time*.17;updateDisplays(time);}};
}
