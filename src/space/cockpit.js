import * as THREE from 'three';
import { cuboid } from './design.js';

const up=new THREE.Vector3(0,1,0);
function readout(title){const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;return {canvas,texture,title,last:''};}
function paint(screen,lines){const signature=lines.join('|');if(screen.last===signature)return;screen.last=signature;const c=screen.canvas.getContext('2d');c.fillStyle='#08151b';c.fillRect(0,0,640,320);c.strokeStyle='#335664';c.strokeRect(8,8,624,304);c.fillStyle='#7eafa8';c.font='18px monospace';c.fillText(screen.title,30,42);lines.forEach((line,i)=>{c.fillStyle=i===0?'#c1e6df':'#7ba3b5';c.font=i===0?'28px monospace':'20px monospace';c.fillText(line,30,100+i*53);});screen.texture.needsUpdate=true;}
function panel(parent,screen,position,width=.39,height=.195){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:screen.texture,toneMapped:false}));mesh.position.fromArray(position);parent.add(mesh);return mesh;}
function armSegment(parent,material,radius){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*.92,1,16),material);parent.add(mesh);return mesh;}
function connect(mesh,from,to){const direction=to.clone().sub(from);mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(up,direction.normalize());}
function astronautHand(parent,side){
 const sleeve=new THREE.MeshStandardMaterial({color:0x788995,roughness:.85}),glove=new THREE.MeshStandardMaterial({color:0x18272e,roughness:.75}),seam=new THREE.MeshStandardMaterial({color:0xbd9260,roughness:.6});
 const upper=armSegment(parent,sleeve,.049),forearm=armSegment(parent,sleeve,.044),hand=new THREE.Group();parent.add(hand);cuboid(hand,[.095,.042,.115],[0,0,0],glove,.018);const fingers=[];
 for(let i=0;i<4;i++){const finger=cuboid(hand,[.018,.025,.065],[-.033+i*.022,-.003,-.065],glove,.008);fingers.push(finger);cuboid(hand,[.014,.004,.014],[-.033+i*.022,.023,-.025],seam,.002);}
 const thumb=cuboid(hand,[.025,.03,.055],[side*.052,-.009,-.014],glove,.009);thumb.rotation.y=side*.55;cuboid(hand,[.097,.012,.018],[0,.005,.061],seam,.004);
 let initialized=false;return {hand,fingers,setVisible(visible){upper.visible=visible;forearm.visible=visible;hand.visible=visible;},update(position,grip=0,dt=.016){if(!initialized){hand.position.copy(position);initialized=true;}else hand.position.lerp(position,1-Math.exp(-Math.max(dt,.001)*15));hand.rotation.set(-.1-grip*.18,side*.12,side*.08);fingers.forEach((f,i)=>{f.rotation.x=-grip*(.45+i*.035);});const shoulder=new THREE.Vector3(side*.77,-.96,-.32),elbow=shoulder.clone().lerp(hand.position,.48);elbow.x+=side*.05;elbow.y-=.055;connect(upper,shoulder,elbow);connect(forearm,elbow,hand.position.clone().add(new THREE.Vector3(0,-.005,.08)));}};
}

/** Camera-local cockpit; everything beyond its open windshield is the real orbit scene. */
export class CockpitRig {
 constructor(camera){
  this.group=new THREE.Group();this.group.name='flight-cockpit';this.group.position.y=.22;camera.add(this.group);this.camera=camera;
  const metal=new THREE.MeshStandardMaterial({color:0x25333b,metalness:.46,roughness:.45}),edge=new THREE.MeshStandardMaterial({color:0x667881,metalness:.6,roughness:.35}),rubber=new THREE.MeshStandardMaterial({color:0x101c23,roughness:.85}),amber=new THREE.MeshStandardMaterial({color:0xa77f51,metalness:.5,roughness:.4});
  const dash=cuboid(this.group,[1.91,.32,.43],[0,-.62,-1.06],metal,.055);dash.rotation.x=.09;cuboid(this.group,[1.77,.025,.31],[0,-.452,-1.025],rubber,.015);
  // Windshield structural frames are genuine geometry, with no image behind the glass.
  for(const side of [-1,1]){const pillar=cuboid(this.group,[.055,1.58,.065],[side*.87,.02,-1.25],metal,.016);pillar.rotation.z=side*-.17;const trim=cuboid(this.group,[.009,1.5,.01],[side*.83,.02,-1.205],edge,.003);trim.rotation.z=side*-.17;cuboid(this.group,[.22,.14,.35],[side*.91,-.57,-.71],metal,.04);}
  cuboid(this.group,[1.95,.055,.07],[0,.74,-1.34],metal,.014);cuboid(this.group,[1.88,.025,.05],[0,.705,-1.3],rubber,.01);
  // Two displays are physically installed in the instrument panel.
  this.leftScreen=readout('POWER / PROPULSION');this.rightScreen=readout('NAVIGATION / APPROACH');panel(this.group,this.leftScreen,[-.43,-.49,-.82]);panel(this.group,this.rightScreen,[.18,-.49,-.82]);
  this.switches=[];this.switchPositions=[];this.lamps=[];this.covers=[];
  for(let i=0;i<4;i++){
   const x=-.69+i*.25,base=new THREE.Group();base.position.set(x,-.48,-.99);this.group.add(base);const collar=new THREE.Mesh(new THREE.CylinderGeometry(.023,.026,.013,20),edge);base.add(collar);
   const lever=new THREE.Group();lever.rotation.x=.55;base.add(lever);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.057,12),edge);shaft.position.y=.026;lever.add(shaft);const tip=new THREE.Mesh(new THREE.SphereGeometry(.011,12,8),amber);tip.position.y=.056;lever.add(tip);this.switches.push(lever);this.switchPositions.push(new THREE.Vector3(x,-.425,-.99));
   const lamp=new THREE.Mesh(new THREE.SphereGeometry(.009,10,6),new THREE.MeshBasicMaterial({color:0x6d4339}));lamp.position.set(x,-.441,-1.10);this.group.add(lamp);this.lamps.push(lamp);
   const cover=new THREE.Group();cover.position.set(x,-.468,-1.035);this.group.add(cover);const coverMat=new THREE.MeshPhysicalMaterial({color:0xba684e,transparent:true,opacity:.32,roughness:.24,side:THREE.DoubleSide});cuboid(cover,[.065,.012,.11],[0,.023,.045],coverMat,.008);this.covers.push(cover);
  }
  // Detented throttle with a real slider track and a moving grip.
  cuboid(this.group,[.16,.012,.35],[.65,-.442,-.91],rubber,.02);for(const x of [.6,.7])cuboid(this.group,[.009,.018,.32],[x,-.43,-.91],edge,.003);
  this.throttle=new THREE.Group();this.throttle.position.set(.65,-.41,-.77);this.group.add(this.throttle);cuboid(this.throttle,[.15,.065,.075],[0,0,0],rubber,.019);cuboid(this.throttle,[.11,.008,.014],[0,.035,-.02],amber,.003);
  // Small physical rotary knobs and an illuminated panel rim.
  for(let i=0;i<7;i++){const knob=new THREE.Mesh(new THREE.CylinderGeometry(.013,.015,.02,16),edge);knob.position.set(-.76+i*.12,-.62,-.815);knob.rotation.x=Math.PI/2;this.group.add(knob);}
  const rim=cuboid(this.group,[1.7,.004,.008],[0,-.445,-1.18],new THREE.MeshBasicMaterial({color:0x71a6a8}),.001);
  const light=new THREE.PointLight(0xa0c9d6,.9,3,1.5);light.position.set(0,.1,-.35);this.group.add(light);const warm=new THREE.PointLight(0xd2ac7b,.3,1.8,1.2);warm.position.set(.65,-.15,-.6);this.group.add(warm);
  this.left=astronautHand(this.group,-1);this.right=astronautHand(this.group,1);this.switchState=[0,0,0,0];this.lastStage=0;this.lastAction=0;this.resize();
  this.group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 }
 resize(){this.group.scale.x=this.camera.aspect/1.44;}
 update(dt,time,{stage,throttle,autopilot,progress,distance,destination,motion=true}){
  if(stage!==this.lastStage){this.lastStage=stage;this.lastAction=time;}
  this.switches.forEach((lever,i)=>{const goal=i<stage?-.62:.55;this.switchState[i]+=((i<stage?1:0)-this.switchState[i])*Math.min(1,dt*8);lever.rotation.x=.55-this.switchState[i]*1.17;this.covers[i].rotation.x=-this.switchState[i]*1.3;this.lamps[i].material.color.set(i<stage?0x8bd3bd:0x6d4339);});
  this.throttle.position.z=-.77-throttle*.27;
  const idleL=new THREE.Vector3(-.64,-.66,-.62),idleR=new THREE.Vector3(.65,-.66,-.62);const action=Math.max(0,1-(time-this.lastAction)/.8);const reach=motion?Math.sin(action*Math.PI):0;const last=Math.max(0,stage-1);
  if(last<2&&stage>0)idleL.lerp(this.switchPositions[last].clone().add(new THREE.Vector3(0,.035,.025)),reach);
  if(last>=2&&(stage<4||time-this.lastAction<.6))idleR.lerp(this.switchPositions[last].clone().add(new THREE.Vector3(0,.035,.025)),reach);
  if(stage===4&&time-this.lastAction>=.6){idleR.lerp(new THREE.Vector3(.65,-.35,this.throttle.position.z+.01),motion?Math.min(1,(time-this.lastAction)*2):1);}
  this.left.update(idleL,reach*.6,dt);this.right.update(idleR,stage===4?.8:reach*.6,dt);
  if(this.lastPaint===undefined||time-this.lastPaint>.1){this.lastPaint=time;
  paint(this.leftScreen,[`${stage}/4 SYSTEMS ONLINE`,`THRUST ${Math.round(throttle*100)}%`,autopilot?'AUTO SEQUENCE':'MANUAL CONTROL']);
  paint(this.rightScreen,[destination,`RANGE ${distance.toFixed(1)} u`,progress>.92?'FINAL APPROACH':stage<4?'ALIGNING FLIGHT PATH':'NAVIGATION LOCKED']);}
 }
 dispose(){this.group.removeFromParent();this.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});}
}
