import * as THREE from 'three';
import { createReaderSurface } from './reader-surface.js';

export function block(group,size,position,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.fromArray(position);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
const beaconTextures=new Map();
export function labelTexture(text,accent='#b8ded5',summary=''){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=224;const c=canvas.getContext('2d');
 const background=c.createLinearGradient(0,0,768,224);background.addColorStop(0,'#07141ef0');background.addColorStop(1,'#0c1a25c9');c.fillStyle=background;c.beginPath();c.roundRect(6,8,756,208,26);c.fill();c.strokeStyle=accent+'66';c.lineWidth=2;c.stroke();c.fillStyle=accent;c.fillRect(27,49,4,125);
 const words=text.split(/\s+/),lines=[''];c.font='500 43px sans-serif';for(const word of words){const n=lines.length-1,next=(lines[n]+' '+word).trim();if(c.measureText(next).width>674&&lines.length<2)lines.push(word);else lines[n]=next;}
 c.fillStyle='#eef5f3';c.textBaseline='middle';lines.forEach((line,i)=>c.fillText(line,53,lines.length===1?79:56+i*49,674));
 c.fillStyle=accent;c.font='30px sans-serif';let short=summary;while(c.measureText(short).width>674&&short.length>1)short=short.slice(0,-2);if(short!==summary)short=short.trimEnd()+'…';c.fillText(short,53,lines.length===1?143:164,674);
 const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;return texture;
}
function previewText(item,language){
 if(item.preview)return typeof item.preview==='string'?item.preview:item.preview[language]||'';
 if(item.kind==='light')return language==='id'?'Cahaya hangat · suasana rumah':'Warm lighting · home atmosphere';
 return item.stories?.(language).slice(0,3).map(chapter=>chapter[0]).join(' · ')||'';
}
function beaconTexture(accent){
 if(beaconTextures.has(accent))return beaconTextures.get(accent);const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;const c=canvas.getContext('2d'),g=c.createRadialGradient(96,96,20,96,96,95);g.addColorStop(0,accent+'77');g.addColorStop(.55,accent+'22');g.addColorStop(1,accent+'00');c.fillStyle=g;c.fillRect(0,0,192,192);c.fillStyle='#07141ef2';c.beginPath();c.arc(96,96,45,0,Math.PI*2);c.fill();c.strokeStyle=accent;c.lineWidth=3;c.stroke();c.beginPath();c.arc(96,96,59,-.7,3.9);c.stroke();c.fillStyle='#f0f7f5';c.font='500 43px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('E',96,98);const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;beaconTextures.set(accent,texture);return texture;
}
export class InteractiveLocation {
 constructor(index,language,u){
  this.index=index;this.language=language;this.universe=u;this.scene=new THREE.Scene();this.group=new THREE.Group();this.scene.add(this.group);this.interactables=[];this.boards=[];this.colliders=[];this.animations=[];this.cards=[];this.chapter=0;this.endZ=-45;
  this.scene.background=new THREE.Color('#070e1a');this.scene.add(new THREE.HemisphereLight(0xa4c8e3,0x201a25,.55));const sun=new THREE.DirectionalLight(0xffd9ab,1.8);sun.position.set(-25,40,25);sun.userData.shadowEligible=true;sun.castShadow=!u.low;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:35,bottom:-55,far:150});sun.shadow.bias=-.001;this.scene.add(sun);
  this.scene.add(u.starField.clone());const sky=u.orbit.clone();sky.name='local-orbit-sky';for(const body of sky.children)if(body.userData.destination===index)body.visible=false;this.sky=sky;sky.position.set(-25,38,-180);sky.scale.setScalar(.7);this.scene.add(sky);
 }
 model(path,position,height,{rotation=0,collide=true,maxWidth=Infinity,maxDepth=Infinity}={}){
  const anchor=new THREE.Group();anchor.position.fromArray(position);anchor.rotation.y=rotation;this.group.add(anchor);
  const promise=this.universe.loadModel(path).then(source=>{if(!source)return false;const model=source.clone(true);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=Math.min(height/Math.max(size.y,.01),maxWidth/Math.max(size.x,.01),maxDepth/Math.max(size.z,.01));model.scale.multiplyScalar(scale);model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z).multiplyScalar(scale));model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});anchor.add(model);anchor.updateMatrixWorld(true);if(collide)this.colliders.push(new THREE.Box3().setFromObject(anchor));return true;});anchor.userData.ready=promise;this.universe.assetPromises.push(promise);return anchor;
 }
 interactable({id,label,preview,activationDistance=Infinity,position,screenPosition=position,rotation=0,kind='read',stories,url,accent=0xa7dcd7,screenWidth=2.6,size=[2.4,2.8,2.4]}){
  const anchor=new THREE.Group();anchor.position.fromArray(position);this.group.add(anchor);
  const tint='#'+new THREE.Color(accent).getHexString(),height=this.index===0?Math.min(size[1]/2+.35,2.55-position[1]):size[1]/2+.35;
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:beaconTexture(tint),transparent:true,depthTest:false,depthWrite:false,sizeAttenuation:false,toneMapped:false}));halo.position.y=height;halo.scale.set(.055,.055,1);halo.renderOrder=90;anchor.add(halo);
  const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture(label[this.language],tint,previewText({preview,stories,kind},this.language)),transparent:true,depthTest:false,depthWrite:false,sizeAttenuation:false,toneMapped:false}));marker.scale.set(.25,.047,1);marker.position.y=height-.23;marker.renderOrder=91;anchor.add(marker);const markerWidth=.25;
  const cue=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.08,0),new THREE.Vector3(0,height-.16,0)]),new THREE.LineBasicMaterial({color:accent,transparent:true,opacity:.22,depthWrite:false}));anchor.add(cue);
  const target=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));anchor.add(target);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(screenWidth,screenWidth*.675),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));screen.position.fromArray(screenPosition);screen.rotation.y=rotation;screen.visible=false;this.group.add(screen);
  if(kind==='boarding'){halo.visible=false;marker.visible=false;cue.visible=false;}
  const item={id,label,preview,activationDistance,markerBaseY:height-.23,anchor,marker,markerWidth,halo,cue,target,screen,screenWidth,kind,stories,url,accent,activated:false};target.userData.item=item;this.interactables.push(item);return item;
 }
 setLanguage(language){this.language=language;for(const item of this.interactables){item.marker.material.map.dispose();item.marker.material.map=labelTexture(item.label[language],'#'+new THREE.Color(item.accent).getHexString(),previewText(item,language));}if(this.reading)this.beginReading(this.reading,true);}
 beginReading(item,keepScroll=false){
  const offset=keepScroll?(this.readOffset||0):0;if(this.reading)this.reading.screen.visible=false;cancelAnimationFrame(this.readerFrame);this.readerFrame=null;this.readSurface?.texture.dispose();this.reading=item;item.activated=true;this.chapters=item.stories(this.language);
  this.readSurface=createReaderSurface(this.chapters,item.label[this.language],'#'+new THREE.Color(item.accent).getHexString(),{mobile:this.universe.low,language:this.language});this.readOffset=Math.min(offset,this.readSurface.maxScroll);this.readSurface.draw(this.readOffset);item.screen.material.map=this.readSurface.texture;item.screen.material.needsUpdate=true;item.screen.visible=true;
 }
 scrollReading(delta,{absolute=false}={}){
  if(!this.reading||!this.readSurface)return;this.readOffset=THREE.MathUtils.clamp(absolute?delta:this.readOffset+delta,0,this.readSurface.maxScroll);
  if(!this.readerFrame)this.readerFrame=requestAnimationFrame(()=>{this.readerFrame=null;if(this.reading&&this.readSurface)this.readSurface.draw(this.readOffset);});
 }
 endReading(){if(this.reading)this.reading.screen.visible=false;cancelAnimationFrame(this.readerFrame);this.readerFrame=null;this.reading=null;}

 update(dt,time,camera,focused){
  const labels=[],width=innerWidth<760?220:248,height=width*224/768,pixelScale=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/innerHeight;
  for(const item of this.interactables){
   const distance=camera.position.distanceTo(item.anchor.position),active=focused===item.id,visible=distance<(item.kind==='boarding'?item.activationDistance:30)&&!this.reading;item.halo.visible=visible;item.cue.visible=visible;item.marker.visible=false;item.marker.material.opacity=active?1:.9;
   const pulse=1+Math.sin(time*1.7+item.anchor.position.x)*.025,scale=.045*pulse*(active?1.15:1);item.halo.scale.set(scale,scale,1);item.marker.scale.set(width*pixelScale,height*pixelScale,1);
   if(visible){const point=item.anchor.localToWorld(new THREE.Vector3(0,item.markerBaseY,0)).project(camera);if(point.z>-1&&point.z<1&&(active||(Math.abs(point.x)<1.2&&Math.abs(point.y)<1.2)))labels.push({item,point,distance,active,x:(point.x*.5+.5)*innerWidth,y:(.5-point.y*.5)*innerHeight});}
  }
  // Keep small floating captions readable when nearby objects share a sightline.
  labels.sort((a,b)=>Number(b.active)-Number(a.active)||a.distance-b.distance);const placed=[];
  for(const label of labels){
   const minY=Math.min(innerHeight*.25,190)+height/2,maxY=innerHeight-(innerWidth<760?145:85)-height/2,minX=width/2+12,maxX=innerWidth-width/2-12;
   let best=null;for(const dx of [0,-width*.72,width*.72])for(const dy of [0,-1,1,-2,2,-3,3,-4,4]){
    const x=THREE.MathUtils.clamp(label.x+dx,minX,maxX),y=THREE.MathUtils.clamp(label.y+dy*(height+9),minY,Math.max(minY,maxY));
    if(placed.some(other=>Math.abs(other.x-x)<width+8&&Math.abs(other.y-y)<height+8))continue;
    const score=Math.hypot(x-label.x,y-label.y);if(!best||score<best.score)best={x,y,score};
   }
   // A crowded narrow screen still shows every title; the closest remains on top.
   if(!best)best={x:THREE.MathUtils.clamp(label.x,minX,maxX),y:THREE.MathUtils.clamp(label.y,minY,Math.max(minY,maxY))};placed.push(best);
   const position=new THREE.Vector3(best.x/innerWidth*2-1,1-best.y/innerHeight*2,label.point.z).unproject(camera);label.item.marker.position.copy(label.item.anchor.worldToLocal(position));label.item.marker.visible=true;
   const vertices=label.item.cue.geometry.attributes.position;vertices.setXYZ(1,label.item.marker.position.x,label.item.marker.position.y,label.item.marker.position.z);vertices.needsUpdate=true;label.item.cue.frustumCulled=false;
  }

  for(const animate of this.animations)animate(dt,time);
 }
 collisions(position){
  for(const bounds of this.colliders){if(position.x>bounds.min.x-.35&&position.x<bounds.max.x+.35&&position.z>bounds.min.z-.35&&position.z<bounds.max.z+.35){const edges=[['x',bounds.min.x-.35],['x',bounds.max.x+.35],['z',bounds.min.z-.35],['z',bounds.max.z+.35]];edges.sort((a,b)=>Math.abs(position[a[0]]-a[1])-Math.abs(position[b[0]]-b[1]));position[edges[0][0]]=edges[0][1];}}
 }
}
