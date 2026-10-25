import * as THREE from 'three';
import { cuboid, screenTexture, ring, glow } from './design.js';

export function fittedKitchen(home,{offset=[0,0]}={}){
 const [dx,dz]=offset;
 const group=new THREE.Group();group.position.set(dx,0,dz);home.group.add(group);const base=new THREE.MeshStandardMaterial({color:0x344a48,roughness:.6}),stone=new THREE.MeshStandardMaterial({color:0xc4beb0,roughness:.38}),metal=new THREE.MeshStandardMaterial({color:0x939fa1,metalness:.8,roughness:.25}),black=new THREE.MeshStandardMaterial({color:0x121c23,metalness:.35,roughness:.22}),white=new THREE.MeshStandardMaterial({color:0xc9c7bc,roughness:.5});
 const b=(s,p,m=base,r=.01)=>cuboid(group,s,p,m,r);
 // Four one-metre modules share a plinth, a countertop and aligned fronts.
 b([.65,.12,4.02],[5.53,.18,3.8]);for(let n=0;n<4;n++){const z=2.3+n;b([.64,.66,.992],[5.53,.57,z]);b([.028,.64,.97],[5.195,.57,z],base);b([.025,.018,.35],[5.172,.78,z],metal);}
 const shape=new THREE.Shape();shape.moveTo(-.37,-2.01);shape.lineTo(.37,-2.01);shape.lineTo(.37,2.01);shape.lineTo(-.37,2.01);shape.closePath();const hole=new THREE.Path();hole.absellipse(0,.3,.235,.33,0,Math.PI*2,true);shape.holes.push(hole);const top=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false,curveSegments:32}),stone);top.rotation.x=-Math.PI/2;top.position.set(5.53,.9,3.8);top.receiveShadow=true;group.add(top);
 b([.42,.02,.58],[5.53,.825,3.5],metal);for(const x of [5.295,5.765])b([.025,.1,.62],[x,.875,3.5],metal);for(const z of [3.18,3.82])b([.47,.1,.025],[5.53,.875,z],metal);
 const faucetPath=new THREE.CatmullRomCurve3([new THREE.Vector3(5.78,.945,3.5),new THREE.Vector3(5.78,1.18,3.5),new THREE.Vector3(5.62,1.24,3.5),new THREE.Vector3(5.53,1.12,3.5)]);group.add(new THREE.Mesh(new THREE.TubeGeometry(faucetPath,24,.015,8,false),metal));
 b([.58,.012,.73],[5.53,.952,4.6],black);for(const x of [5.39,5.67])for(const z of [4.41,4.79]){const burner=new THREE.Mesh(new THREE.TorusGeometry(.095,.008,8,32),metal);burner.rotation.x=-Math.PI/2;burner.position.set(x,.962,z);group.add(burner);}b([.018,.39,.64],[5.173,.53,4.6],black);b([.035,.022,.47],[5.15,.71,4.6],metal);
 b([.04,.54,4.02],[5.94,1.21,3.8],stone);for(let n=0;n<4;n++){const z=2.3+n;b([.32,.63,.992],[5.8,1.86,z]);b([.025,.59,.96],[5.627,1.86,z]);b([.025,.12,.018],[5.607,1.66,z-.35],metal);}b([.34,.02,4],[5.77,1.53,3.8],new THREE.MeshBasicMaterial({color:0xffd8a4}));
 b([.72,1.85,.76],[5.52,1.045,6.2],white,.035);for(const [y,h] of [[1.64,.62],[.72,1.17]]){b([.025,h,.71],[5.145,y,6.2],white,.015);b([.04,.24,.018],[5.115,y+.06,5.92],metal);}
 group.updateWorldMatrix(true,true);home.colliders.push(new THREE.Box3().setFromObject(group));
 const support=cuboid(home.group,[.4,.001,.45],[5.53+dx,.9445,2.3+dz],new THREE.MeshBasicMaterial({visible:false}));home.mount('lib/home/kettle.fbx',support,[5.5+dx,2.3+dz],.22,{maxWidth:.22});
 return group;
}
export function diningSet(home,{offset=[0,0]}={}){
 const [dx,dz]=offset;
 const group=new THREE.Group();group.position.set(dx,0,dz);home.group.add(group);const oak=new THREE.MeshStandardMaterial({color:0x977353,roughness:.6}),legs=new THREE.MeshStandardMaterial({color:0x263638,metalness:.25,roughness:.5}),fabric=new THREE.MeshStandardMaterial({color:0x7b8478,roughness:.9});
 cuboid(group,[.85,.05,1.5],[2.75,.845,3.6],oak,.035);for(const x of [2.43,3.07])for(const z of [2.98,4.22])cuboid(group,[.045,.7,.045],[x,.47,z],legs,.01);
 for(const [z,direction] of [[2.55,1],[4.65,-1]]){const chair=new THREE.Group();chair.position.set(2.75,0,z);chair.rotation.y=direction===1?0:Math.PI;group.add(chair);cuboid(chair,[.45,.075,.44],[0,.55,0],fabric,.04);cuboid(chair,[.45,.43,.055],[0,.79,-.2],fabric,.04);for(const x of [-.17,.17])for(const dz of [-.15,.15])cuboid(chair,[.035,.39,.035],[x,.315,dz],legs,.007);}
 const vase=cuboid(group,[.12,.18,.12],[2.75,.96,3.6],new THREE.MeshStandardMaterial({color:0xc1ae8e,roughness:.5}),.035);group.updateWorldMatrix(true,true);home.colliders.push(new THREE.Box3().setFromObject(group));return group;
}
export function programmerSetup(home,{offset=[0,0]}={}){
 const [dx,dz]=offset;
 const group=new THREE.Group();group.position.set(dx,0,dz);home.group.add(group);const oak=new THREE.MeshStandardMaterial({color:0x77563f,roughness:.55}),metal=new THREE.MeshStandardMaterial({color:0x141f29,metalness:.6,roughness:.3}),glowMat=new THREE.MeshBasicMaterial({color:0x6fdcca,toneMapped:false});
 const top=cuboid(group,[3.6,.055,.9],[3.4,.8675,-5],oak,.025);for(const x of [1.7,5.1])for(const z of [-5.35,-4.65])cuboid(group,[.06,.72,.06],[x,.48,z],metal,.01);cuboid(group,[3.35,.12,.035],[3.4,.68,-5.35],metal);
 const monitors=[];for(const [x,yaw,kind] of [[2.34,.14,'terminal'],[3.35,0,'code'],[4.36,-.14,'metrics']]){const monitor=new THREE.Group();monitor.position.set(x,1.34,-5.14);monitor.rotation.y=yaw;group.add(monitor);cuboid(monitor,[1.02,.72,.035],[0,0,0],metal,.025);const panel=new THREE.Mesh(new THREE.PlaneGeometry(.96,.648),new THREE.MeshBasicMaterial({map:screenTexture(kind),toneMapped:false}));panel.position.z=.020;monitor.add(panel);cuboid(group,[.055,.13,.055],[x,.965,-5.14],metal);cuboid(group,[.32,.02,.18],[x,.905,-5.10],metal,.01);monitors.push(panel);}
 cuboid(group,[.74,.006,.32],[3.4,.899,-4.77],new THREE.MeshStandardMaterial({color:0x17272b,roughness:1}),.018);home.mount('lib/asset_3d/computerKeyboard.glb',top,[3.32+dx,-4.76+dz],.042,{maxWidth:.5,maxDepth:.2});home.mount('lib/asset_3d/computerMouse.glb',top,[3.87+dx,-4.77+dz],.035,{maxWidth:.075,maxDepth:.11});
 const pc=new THREE.Group();pc.position.set(5.4,.12,-4.9);group.add(pc);cuboid(pc,[.4,.88,.57],[0,.44,0],metal,.025);const glass=new THREE.MeshPhysicalMaterial({color:0x63acbb,transparent:true,opacity:.2,roughness:.08,metalness:.25,side:THREE.DoubleSide});cuboid(pc,[.006,.72,.45],[-.202,.46,0],glass);for(let n=0;n<3;n++){const fan=ring(pc,.1,.2+n*.24,0x7fcde9,.013,[0,0,0]);fan.position.z=.29;const blades=cuboid(pc,[.13,.018,.01],[0,.2+n*.24,.302],glowMat);home.animations.push(dt=>blades.rotation.z+=dt*3.5);}glow(pc,0x6edbd0,.8,[-.22,.45,0],.17);
 cuboid(group,[.045,.06,3.2],[5.64,2.78,-4.4],new THREE.MeshBasicMaterial({color:0x86b6d5}));
 home.mount('lib/asset_3d/laptop.glb',top,[2.0+dx,-4.9+dz],.2,{maxWidth:.4,maxDepth:.28});home.mount('lib/asset_3d/books.glb',top,[4.9+dx,-4.9+dz],.09,{maxWidth:.22,maxDepth:.25});
 const chair=new THREE.Group();chair.position.set(3.35,.12,-3.55);group.add(chair);const fabric=new THREE.MeshStandardMaterial({color:0x293b43,roughness:.9});
 for(let n=0;n<5;n++){const a=n*Math.PI*2/5;const spoke=cuboid(chair,[.04,.03,.3],[Math.sin(a)*.15,.08,Math.cos(a)*.15],metal,.008);spoke.rotation.y=a;const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.035,12),metal);wheel.rotation.z=Math.PI/2;wheel.position.set(Math.sin(a)*.29,.035,Math.cos(a)*.29);chair.add(wheel);}
 const piston=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.32,16),metal);piston.position.y=.24;chair.add(piston);cuboid(chair,[.5,.09,.48],[0,.43,0],fabric,.045);const back=cuboid(chair,[.46,.62,.06],[0,.78,.21],fabric,.04);back.rotation.x=.08;cuboid(chair,[.3,.14,.08],[0,1.15,.23],fabric,.035);for(const x of [-.29,.29]){cuboid(chair,[.035,.2,.035],[x,.54,0],metal,.007);cuboid(chair,[.075,.045,.25],[x,.66,0],fabric,.02);}
 group.updateWorldMatrix(true,true);chair.updateWorldMatrix(true,true);home.colliders.push(new THREE.Box3().setFromObject(chair));
 const pcLight=new THREE.PointLight(0x74c9d7,.25,3,1.5);pcLight.position.set(5.1+dx,.65,-4.6+dz);home.scene.add(pcLight);
 group.updateWorldMatrix(true,true);top.updateWorldMatrix(true,true);home.colliders.push(new THREE.Box3().setFromObject(top));pc.updateMatrixWorld(true);home.colliders.push(new THREE.Box3().setFromObject(pc));return {group,top,monitors,pc};
}
