import * as THREE from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cuboid, ring, materials } from './design.js';

// Batch static hull panels by material; leave the moving door and glass separate.
function batchHull(ship,door){
 ship.updateWorldMatrix(true,true);const inverse=ship.matrixWorld.clone().invert(),batches=new Map();
 ship.traverse(mesh=>{if(!mesh.isMesh||mesh.material.transparent)return;let node=mesh;while(node){if(node===door)return;node=node.parent;}const key=mesh.material.uuid;if(!batches.has(key))batches.set(key,{material:mesh.material,meshes:[]});batches.get(key).meshes.push(mesh);});
 for(const {material,meshes} of batches.values()){
  if(meshes.length<2)continue;const geometries=meshes.map(mesh=>{const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));});
  const geometry=mergeBufferGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geometry)continue;const merged=new THREE.Mesh(geometry,material);merged.castShadow=true;merged.receiveShadow=true;ship.add(merged);for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}
 }
}

/** A human-sized shuttle with a real side hatch, ramp and open cabin. */
export function addLandingBerth(world){
 if(world.berth)return;
 const z=world.index===0?11.5:17.5,pad=new THREE.Group();pad.name='visitor-landing-berth';pad.position.set(0,.12,z);world.group.add(pad);
 const deck=new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.65,.22,64),materials.metal);deck.receiveShadow=true;pad.add(deck);ring(pad,5.2,.12,0x89dce8,.025);ring(pad,4.9,.125,0xbda979,.012);
 const hull=new THREE.MeshStandardMaterial({color:0xc3cbd0,metalness:.48,roughness:.34}),trim=materials.metal,lightMat=new THREE.MeshBasicMaterial({color:0x9ae9ee}),glass=new THREE.MeshPhysicalMaterial({color:0x72b2ca,transparent:true,opacity:.06,roughness:.08,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
 for(let n=0;n<12;n++){const a=n*Math.PI/6;const light=cuboid(pad,[.3,.055,.14],[Math.sin(a)*5.3,.14,Math.cos(a)*5.3],lightMat);light.rotation.y=a;}
 const ship=new THREE.Group();ship.name='visitor-spacecraft';ship.position.y=.13;pad.add(ship);
 const b=(size,position,material=hull,round=.04)=>cuboid(ship,size,position,material,round);
 // The nose and windshield face -Z: toward the destination's content.
 b([3.6,.3,7.4],[0,.3,0]);b([3.6,.22,7.4],[0,3.15,0]);b([.18,2.65,7.4],[-1.72,1.75,0]);
 b([.18,2.65,3.1],[1.72,1.75,-2.15]);b([.18,2.65,2.2],[1.72,1.75,2.6]);b([3.5,2.65,.18],[0,1.75,3.6]);
 b([3.5,.75,.2],[0,.8,-3.6]);b([3.5,.2,.2],[0,2.95,-3.6]);for(const x of [-1.65,1.65])b([.1,1.9,.16],[x,1.94,-3.6],trim);
 const windshield=b([3.3,1.85,.035],[0,1.95,-3.61],glass,0);windshield.name='panoramic-windshield';b([3.3,.05,6.9],[0,.48,0],trim);
 for(const x of [-1.48,1.48])b([.035,.035,6.6],[x,.52,0],lightMat,.005);
 for(const x of [-2.15,2.15]){b([1.1,.22,3.8],[x,.55,.75]);b([.65,.65,1.6],[x,1,2.7],trim);b([.48,.48,.08],[x,1,3.53],lightMat);for(const dz of [-2.3,2.3]){b([.16,.25,.2],[x*.7,.01,dz],trim);b([.6,.09,.7],[x*.7,-.12,dz],trim);}}
 // Swept wings, a tapered nose and engine nozzles preserve a spacecraft silhouette.
 const noseGeometry=new THREE.BufferGeometry();noseGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1.8,.4,-3.6,1.8,.4,-3.6,0,.45,-5.1,-1.8,1.15,-3.6,0,.45,-5.1,1.8,1.15,-3.6,-1.8,.4,-3.6,0,.45,-5.1,-1.8,1.15,-3.6,1.8,.4,-3.6,1.8,1.15,-3.6,0,.45,-5.1],3));noseGeometry.computeVertexNormals();const nose=new THREE.Mesh(noseGeometry,hull);nose.material=hull.clone();nose.material.side=THREE.DoubleSide;ship.add(nose);
 for(const side of [-1,1]){
  const shape=new THREE.Shape();shape.moveTo(side*1.6,-2.7);shape.lineTo(side*4.5,2.8);shape.lineTo(side*1.6,3.2);shape.closePath();const wing=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,steps:1}),hull);wing.rotation.x=Math.PI/2;wing.position.y=.18;ship.add(wing);
  b([.13,1.9,2.8],[side*1.82,1.72,-2.05],trim,.08);b([.16,.13,2.65],[side*1.91,1.05,-2.05],lightMat,.02);
  for(let n=0;n<5;n++)b([.16,.035,.4],[side*1.92,1.5+n*.11,-2.7],hull,.008);
  const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.42,.52,.6,32,1,true),trim);nozzle.rotation.x=Math.PI/2;nozzle.position.set(side*2.15,1,3.7);ship.add(nozzle);const engineRing=new THREE.Mesh(new THREE.TorusGeometry(.35,.045,12,48),lightMat);engineRing.position.set(side*2.15,1,4.02);ship.add(engineRing);
  b([.08,1.3,1.6],[side*2.2,1.9,2.4],hull,.04);
 }
 const insignia=document.createElement('canvas');insignia.width=768;insignia.height=256;const ink=insignia.getContext('2d');ink.fillStyle='#162631';ink.fillRect(0,0,768,256);ink.fillStyle='#b6e8ee';ink.font='500 70px sans-serif';ink.fillText('OSK / 01',40,110);ink.font='25px monospace';ink.fillText('ORBITAL EXPLORER',43,175);const marking=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.45),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(insignia),toneMapped:false}));marking.rotation.y=Math.PI/2;marking.position.set(1.905,2.1,-1.7);ship.add(marking);
 // A split airlock slides into the side panels, leaving the entrance fully clear.
 const door=new THREE.Group();door.name='split-airlock';door.position.set(1.75,1.75,.55);ship.add(door);const leaves=[];
 for(const side of [-1,1]){const leaf=new THREE.Group();leaf.position.z=side*.475;door.add(leaf);cuboid(leaf,[.14,2.65,.93],[0,0,0],hull,.04);cuboid(leaf,[.03,.08,.72],[.085,-.9,0],lightMat,.01);cuboid(leaf,[.035,.72,.025],[.085,0,-side*.43],trim,.005);leaves.push({leaf,side});}
 const statusMat=new THREE.MeshBasicMaterial({color:0xffc784});const status=b([.08,.5,.04],[1.88,1.6,1.77],statusMat,.008);status.name='airlock-status';
 const setDoorOpen=value=>{const amount=THREE.MathUtils.clamp(value,0,1);door.userData.openAmount=amount;for(const {leaf,side} of leaves)leaf.position.z=side*(.475+1.08*amount);statusMat.color.setRGB(1-.4*amount,.78+.15*amount,.52+.4*amount);};setDoorOpen(0);
 for(const dz of [-.48,1.58])b([.22,2.85,.12],[1.75,1.75,dz],trim);b([.2,.12,2.15],[1.75,3.2,.55],lightMat);
 const ramp=b([2.8,.12,1.9],[3.05,.23,.55],trim);ramp.rotation.z=-.18;for(const dz of [-.3,1.4]){const strip=b([2.8,.025,.035],[3.05,.315,dz],lightMat,.005);strip.rotation.z=-.18;}
 b([.72,.7,.72],[0,.9,-1.9],trim,.1);b([.72,1,.15],[0,1.55,-1.58],trim,.08);
 const bridgeLength=z-(world.index===0?5.5:11);cuboid(world.group,[2,.24,bridgeLength],[0,0,z-bridgeLength/2],trim);
 for(const x of [-.85,.85])cuboid(world.group,[.035,.025,bridgeLength],[x,.14,z-bridgeLength/2],lightMat);
 // A lit side approach supports the walking route all the way to the ramp.
 const approach=[[0,world.index===0?5.95:11.3],[3.95,z-4.6],[4.45,z+.55]];
 for(let i=0;i<approach.length-1;i++){const [ax,az]=approach[i],[bx,bz]=approach[i+1],length=Math.hypot(bx-ax,bz-az),walkway=new THREE.Group();walkway.position.set((ax+bx)/2,0,(az+bz)/2);walkway.rotation.y=Math.atan2(bx-ax,bz-az);world.group.add(walkway);cuboid(walkway,[1.8,.24,length+.4],[0,0,0],trim);for(const x of [-.8,.8])cuboid(walkway,[.025,.02,length+.3],[x,.14,0],lightMat);}
 const light=new THREE.PointLight(0xb8e6ff,2,16,2);light.position.set(2.5,5,z);world.scene.add(light);const cabinLight=new THREE.PointLight(0xffdfb3,1.4,8,2);cabinLight.position.set(0,2.8,0);ship.add(cabinLight);
 batchHull(ship,door);
 world.berth={pad,ship,door,setDoorOpen,doorClosedY:door.position.y,position:new THREE.Vector3(0,2.05,z-2),quaternion:new THREE.Quaternion(),z,boardingDuration:4.6};
 const boarding=world.interactable({id:'visitor-shuttle',kind:'boarding',label:{en:'Visitor shuttle · return to orbit',id:'Pesawat pengunjung · kembali ke orbit'},preview:{en:'Board the spacecraft and fly home',id:'Naik pesawat dan terbang ke orbit'},position:[3.15,1.7,z+.55],accent:0x9ae9ee,activationDistance:1.15,size:[.65,.8,.65]});world.berth.boarding=boarding;
 const original={...world.bounds};world.bounds.maxZ=z+5.2;world.bounds.minX=Math.min(original.minX,-5.2);world.bounds.maxX=Math.max(original.maxX,5.2);
 const collide=world.collisions.bind(world);world.collisions=position=>{collide(position);if(position.z<(world.index===0?5.1:11)){position.x=THREE.MathUtils.clamp(position.x,original.minX,original.maxX);}else position.x=THREE.MathUtils.clamp(position.x,position.z<z-5?-.7:-5.2,position.z<z-5?.7:5.2);};
 world.colliders.push(new THREE.Box3(new THREE.Vector3(-2.6,.2,z-3.8),new THREE.Vector3(2.6,3.5,z+3.8)));
}
