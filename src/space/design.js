import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const materials = {
 metal:new THREE.MeshStandardMaterial({color:0x18242f,metalness:.72,roughness:.33}),
 brass:new THREE.MeshStandardMaterial({color:0xbba57b,metalness:.8,roughness:.28}),
};
export function cuboid(parent,size,position,material,round=0){const mesh=new THREE.Mesh(round?new RoundedBoxGeometry(...size,3,round):new THREE.BoxGeometry(...size),material);mesh.position.fromArray(position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function cylinder(parent,radius,height,y,material,segments=64){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),material);mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function ring(parent,radius,y,color,tube=.015,rotation=[-Math.PI/2,0,0]){const mesh=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,96),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,toneMapped:false}));mesh.position.y=y;mesh.rotation.set(...rotation);parent.add(mesh);return mesh;}
let glowMap;
export function glow(parent,color,size,position=[0,0,0],opacity=.35){if(!glowMap){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#ffffff66');g.addColorStop(.6,'#ffffff12');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,128,128);glowMap=new THREE.CanvasTexture(canvas);}const mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));mesh.scale.setScalar(size);mesh.position.fromArray(position);parent.add(mesh);return mesh;}
export function altar(parent,x,z,color,{radius=1.15,height=.62}={}){
 const group=new THREE.Group();group.position.set(x,.2,z);parent.add(group);
 cylinder(group,radius+.17,.12,.06,materials.metal,12);cylinder(group,radius,.12,.18,materials.brass,12);cylinder(group,radius-.06,height-.28,(height+.28)/2,materials.metal,12);cylinder(group,radius+.03,.08,height-.04,materials.metal,64);
 const lower=ring(group,radius+.02,.25,color,.018),upper=ring(group,radius-.02,height+.005,color,.025);ring(group,radius*.65,height+.013,color,.009);
 for(let n=0;n<12;n++){const a=n*Math.PI/6;const m=cuboid(group,[.045,.16,.055],[Math.cos(a)*(radius-.01),height-.16,Math.sin(a)*(radius-.01)],new THREE.MeshBasicMaterial({color,toneMapped:false}));m.rotation.y=-a;}
 const sigil=new THREE.Group();sigil.position.y=height+.02;group.add(sigil);for(let i=0;i<3;i++){const geo=new THREE.RingGeometry(radius*.28+i*.14,radius*.285+i*.14,64,1,0,Math.PI*1.45);const arc=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.5}));arc.rotation.x=-Math.PI/2;arc.rotation.z=i*2;sigil.add(arc);}
 glow(group,color,radius*4,[0,height+.25,0],.15);
 return {group,top:.2+height,radius,update(dt,time,active){sigil.rotation.y+=dt*(active?.25:.08);upper.material.opacity=.65+Math.sin(time*1.3)*.15;lower.material.opacity=active?.9:.45;}};
}
export function crystalGeometry(){
 const positions=[],indices=[],rings=[{y:-.95,r:0},{y:-.48,r:.43},{y:.43,r:.43},{y:1,r:0}];
 rings.forEach(({y,r})=>{for(let i=0;i<6;i++){const a=i*Math.PI/3;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);}});
 for(let j=0;j<3;j++)for(let i=0;i<6;i++){const a=j*6+i,b=j*6+(i+1)%6,c=(j+1)*6+(i+1)%6,d=(j+1)*6+i;indices.push(a,b,d,b,c,d);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return geo.toNonIndexed();
}
export function magneticCrystal(parent,x,z,color,phase=0){
 const root=new THREE.Group();root.position.set(x,2.15,z);root.userData.kind='magnetic-crystal';parent.add(root);const shape=crystalGeometry();
 const shell=new THREE.Mesh(shape,new THREE.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:.2,metalness:.2,roughness:.12,clearcoat:1,clearcoatRoughness:.1,transparent:true,opacity:.78,flatShading:true}));root.add(shell);
 const inner=new THREE.Mesh(shape,new THREE.MeshBasicMaterial({color,toneMapped:false}));inner.scale.setScalar(.33);root.add(inner);
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(shape),new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));root.add(outline);
 glow(root,color,4,[0,0,0],.28);const fields=[];
 for(let n=0;n<3;n++){const field=new THREE.Group();root.add(field);const torus=ring(field,.93+n*.14,0,color,.008,[Math.PI/2+n*.5,.6+n*.7,n*.6]);fields.push(field);}
 const count=100,points=new Float32Array(count*3);for(let i=0;i<count;i++){const a=i*.37;const r=.9+(i%7)*.04;points.set([Math.cos(a)*r,(i/count-.5)*2.25,Math.sin(a)*r],i*3);}const particles=new THREE.BufferGeometry();particles.setAttribute('position',new THREE.BufferAttribute(points,3));const dust=new THREE.Points(particles,new THREE.PointsMaterial({color,size:.025,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));root.add(dust);
 const light=new THREE.PointLight(color,.65,5,1.5);light.position.set(x,1.5,z);parent.add(light);
 return {root,shell,update(dt,time,active){root.position.y=2.15+Math.sin(time*.8+phase)*.16;root.rotation.y+=dt*(active?.35:.13);fields.forEach((f,i)=>{f.rotation.y+=dt*(.16+i*.06)*(i%2?-1:1);f.rotation.z=Math.sin(time*.3+phase+i)*.18;});dust.rotation.y-=dt*.14;shell.emissiveIntensity=(active?.4:.18)+Math.sin(time*1.5+phase)*.06;}};
}
export function starship(parent,variant=0){
 const g=new THREE.Group();g.userData.vehicleClass=['interceptor','explorer','crew-shuttle','cargo-hauler'][variant];parent.add(g);
 const hull=new THREE.MeshStandardMaterial({color:[0xd0d7dc,0x758e9b,0xb8784d,0x9c8b70][variant],metalness:.42,roughness:.4}),dark=materials.metal,glass=new THREE.MeshPhysicalMaterial({color:0x235b73,metalness:.45,roughness:.12,clearcoat:1}),engine=new THREE.MeshBasicMaterial({color:variant===2?0xffc486:0x76dce8,toneMapped:false});
 const engineAt=(x,y,z,r=.16)=>{const casing=new THREE.Mesh(new THREE.CylinderGeometry(r*1.35,r*1.35,.6,20),dark);casing.rotation.x=Math.PI/2;casing.position.set(x,y,z);g.add(casing);const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,.16,20),engine);exhaust.rotation.x=Math.PI/2;exhaust.position.set(x,y,z+.35);g.add(exhaust);glow(g,engine.color,1,[x,y,z+.48],.45);};
 const gear=(x,z)=>{const strut=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.3,12),dark);strut.position.set(x,.05,z);g.add(strut);cuboid(g,[.22,.05,.26],[x,-.1,z],dark,.025);};
 if(variant===0){
  cuboid(g,[.65,.4,2.5],[0,.35,0],hull,.1);const nose=new THREE.Mesh(new THREE.ConeGeometry(.43,1.15,4),hull);nose.rotation.x=-Math.PI/2;nose.rotation.z=Math.PI/4;nose.position.set(0,.35,-1.55);g.add(nose);cuboid(g,[.49,.29,.8],[0,.61,-.48],glass,.09);
  for(const s of [-1,1]){const shape=new THREE.Shape();shape.moveTo(.25*s,-.5);shape.lineTo(1.65*s,.85);shape.lineTo(.3*s,1.2);shape.closePath();const wing=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:false}),hull);wing.rotation.x=Math.PI/2;wing.position.y=.3;g.add(wing);engineAt(s*1.05,.32,.8,.14);gear(s*.6,.5);}cuboid(g,[.06,.72,.65],[0,.75,.9],hull,.02);gear(0,-1);
 }else if(variant===1){
  cuboid(g,[.66,.53,3],[0,.45,0],hull,.13);cuboid(g,[.58,.32,.7],[0,.69,-1],glass,.08);
  for(const s of [-1,1]){cuboid(g,[.7,.09,.16],[s*.58,.38,.3],dark,.02);engineAt(s*.95,.38,.8,.22);const array=cuboid(g,[.64,.035,1.35],[s*1.18,.39,-.48],new THREE.MeshStandardMaterial({color:0x204a69,metalness:.5,roughness:.35}),.01);for(let n=0;n<5;n++)cuboid(g,[.65,.04,.012],[s*1.18,.39,-1.03+n*.27],materials.brass);gear(s*.45,.9);}
  const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.48,12),dark);antenna.position.set(0,.95,.2);g.add(antenna);const dish=new THREE.Mesh(new THREE.SphereGeometry(.25,24,10,0,Math.PI*2,0,.75),hull);dish.rotation.x=-.6;dish.position.set(0,1.21,.2);g.add(dish);gear(0,-1.1);
 }else if(variant===2){
  cuboid(g,[.95,.76,2.15],[0,.52,.1],hull,.16);const nose=new THREE.Mesh(new THREE.SphereGeometry(.48,24,16),hull);nose.scale.set(1,.73,1.25);nose.position.set(0,.52,-1.03);g.add(nose);cuboid(g,[.76,.25,.43],[0,.78,-1],glass,.08);
  for(const s of [-1,1]){const fin=cuboid(g,[.72,.07,1.2],[s*.7,.3,.3],hull,.025);fin.rotation.z=s*.28;engineAt(s*.43,.42,1.23,.16);gear(s*.48,-.65);gear(s*.48,.82);}for(let n=0;n<3;n++)cuboid(g,[.015,.2,.12],[.482,.61,-.35+n*.35],glass,.008);
 }else{
  cuboid(g,[.55,.4,3.35],[0,.3,0],dark,.07);cuboid(g,[.86,.65,.75],[0,.55,-1.4],hull,.08);cuboid(g,[.64,.2,.05],[0,.66,-1.79],glass,.01);
  for(const s of [-1,1]){cuboid(g,[.63,.77,1.85],[s*.57,.56,.05],hull,.055);for(let n=0;n<4;n++)cuboid(g,[.66,.04,.055],[s*.57,.97,-.7+n*.48],materials.brass,.005);engineAt(s*.76,.32,1.22,.22);gear(s*.55,-.6);gear(s*.55,.75);}cuboid(g,[.08,.25,2.3],[0,.7,.1],materials.brass,.01);
 }
 return g;
}
export function screenTexture(kind='code'){
 const c=document.createElement('canvas');c.width=1200;c.height=760;const x=c.getContext('2d');x.fillStyle='#0b131d';x.fillRect(0,0,1200,760);x.fillStyle='#152432';x.fillRect(0,0,1200,52);x.fillStyle='#77cbbd';x.font='22px monospace';x.fillText(kind==='code'?'oskhar / workspace / backend.service.ts':kind==='metrics'?'MISSION CONTROL / observability':'TERMINAL / local development',35,35);
 if(kind==='code'){const lines=['import { Injectable } from "@nestjs/common";','','@Injectable()','export class BackendService {','  async buildSomethingMeaningful() {','    const mission = await this.discover();','','    return {','      status: "ready",','      curiosity: true,','      destination: "beyond boundaries"','    };','  }','}'];x.font='24px monospace';lines.forEach((line,i)=>{x.fillStyle='#486174';x.fillText(String(i+1).padStart(2,'0'),25,110+i*40);x.fillStyle=i%3===0?'#c6a5e7':'#a6c9d9';x.fillText(line,85,110+i*40);});}
 else if(kind==='metrics'){for(let i=0;i<3;i++){x.fillStyle='#1b303e';x.fillRect(30+i*390,85,360,160);x.fillStyle='#8ed6c5';x.font='22px monospace';x.fillText(['API','DATABASE','EVENT BUS'][i],55+i*390,125);x.font='48px monospace';x.fillText('ONLINE',55+i*390,200);}for(let k=0;k<3;k++){x.beginPath();x.strokeStyle=['#7ed1bb','#8eb6e5','#c1a1dd'][k];for(let i=0;i<100;i++){const y=450+Math.sin(i*.12+k)*65+Math.sin(i*.7)*16;x.lineTo(35+i*11,y+k*50);}x.stroke();}}
 else{x.font='25px monospace';['$ docker compose up -d','✓ database ready','✓ cache connected','✓ message broker online','','$ npm run dev','> application started','','oskhar@workspace:~$ _'].forEach((s,i)=>{x.fillStyle=i%2?'#86cbb5':'#b5c9d7';x.fillText(s,40,120+i*58);});}
 const texture=new THREE.CanvasTexture(c);texture.encoding=THREE.sRGBEncoding;return texture;
}

/** Native geometry keeps every Nova berth populated even before assets load. */
export function landingVehicle(parent,type){
 const group=new THREE.Group();group.name=`nova-${type}`;parent.add(group);
 const hull=new THREE.MeshStandardMaterial({color:type==='lander'?0xdbbd89:0x9bb8c6,metalness:.4,roughness:.35}),glass=new THREE.MeshPhysicalMaterial({color:0x376f8a,metalness:.35,roughness:.15,clearcoat:1}),light=new THREE.MeshBasicMaterial({color:0x96e5f4}),dark=materials.metal;
 const b=(size,position,material=hull,round=.025)=>cuboid(group,size,position,material,round);
 if(type==='lander'){
  const cabin=new THREE.Mesh(new THREE.CylinderGeometry(.34,.46,.72,8),hull);cabin.position.y=.85;group.add(cabin);const window=new THREE.Mesh(new THREE.CylinderGeometry(.365,.39,.2,8),glass);window.position.y=1.02;group.add(window);b([.52,.12,.52],[0,1.28,0]);
  const engine=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,.3,24),dark);engine.position.y=.37;group.add(engine);const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.04,24),light);exhaust.position.y=.2;group.add(exhaust);
  for(const x of [-1,1])for(const z of [-1,1]){const from=new THREE.Vector3(x*.3,.65,z*.3),to=new THREE.Vector3(x*.68,.1,z*.68),direction=to.clone().sub(from),strut=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,direction.length(),12),materials.brass);strut.position.copy(from).lerp(to,.5);strut.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());group.add(strut);b([.27,.08,.27],[to.x,.04,to.z],dark);b([.11,.06,.11],[x*.42,.75,z*.42],light);}
  b([.025,.32,.025],[0,1.49,0],dark);const antenna=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),light);antenna.position.y=1.68;group.add(antenna);
 }else{
  b([1.08,.29,1.6],[0,.47,0]);b([.82,.54,.65],[0,.84,-.4],hull,.08);b([.7,.3,.025],[0,.9,-.738],glass,.025);b([.025,.28,.43],[-.43,.9,-.4],glass);b([.025,.28,.43],[.43,.9,-.4],glass);
  for(const x of [-.58,.58])for(const z of [-.56,0,.56]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.15,20),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.21,z);group.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.16,16),materials.brass);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);group.add(hub);}
  for(const x of [-.22,.22]){const tank=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.56,20),hull);tank.rotation.x=Math.PI/2;tank.position.set(x,.79,.4);group.add(tank);b([.12,.06,.03],[x,.56,-.825],light);}
  b([.025,.5,.025],[.35,1.22,.48],dark);const dish=new THREE.Mesh(new THREE.SphereGeometry(.2,20,12,0,Math.PI*2,0,.8),materials.brass);dish.rotation.x=-.5;dish.position.set(.35,1.5,.48);group.add(dish);
 }
 return group;
}
