import { SatelliteWorld } from './station.js';
import { NovaWorld } from './nova.js';
import { buildAtlas } from './atlas.js';
import { ChronosWorld } from './chronos-world.js';
import * as THREE from 'three';
import { InteractiveLocation, block } from './interactions.js';
import { CozyHome } from './home.js';
import { exhibitsFor } from './exhibits.js';
import { ring, materials } from './design.js';

export class DestinationWorld extends InteractiveLocation {
 constructor(index,language,u){
  super(index,language,u);if(index===0)return new CozyHome(language,u);if(index===1)return new ChronosWorld(language,u);if(index===2)return new NovaWorld(language,u);if(index===4)return new SatelliteWorld(language,u);
  this.entry={position:[0,1.85,9.3],yaw:0,pitch:0};this.bounds={minX:-10.5,maxX:10.5,minZ:-9,maxZ:9.5};this.endZ=-9;
  const colors=[0xb8dfd0,0xd9bb7a,0x7fb9e0,0x77d8ef,0x9fbfdf],accent=colors[index];const metal=materials.metal,glowMat=new THREE.MeshBasicMaterial({color:accent});
  const b=(size,pos,mat=metal)=>block(this.group,size,pos,mat);const floor=new THREE.MeshStandardMaterial({color:0x132330,metalness:.35,roughness:.6});b([23,.4,23],[0,0,0],floor);
  this.scene.background=new THREE.Color(index===1?'#090b19':index===2?'#08131d':'#06131f');this.scene.fog=new THREE.FogExp2(this.scene.background,.004);
  if(index!==1&&index!==3)for(let x=-10;x<=10;x+=2)for(let z=-10;z<=10;z+=2){b([1.98,.008,.012],[x,.205,z],new THREE.MeshBasicMaterial({color:0x294350}));b([.012,.008,1.98],[x,.205,z],new THREE.MeshBasicMaterial({color:0x294350}));}
  if(index!==1&&index!==3){ring(this.group,2.1,.218,accent,.012);ring(this.group,2.3,.218,accent,.004);}
  const fill=new THREE.DirectionalLight(0x9bc4e3,.7);fill.position.set(0,4,10);this.scene.add(fill);const back=new THREE.DirectionalLight(0xf2d4b3,.45);back.position.set(0,3,-10);this.scene.add(back);
  const cards=exhibitsFor(index,language);
  if(index===3)this.laboratory(cards);
  this.cards=this.interactables;this.setLanguage(language);
 }
 laboratory(cards){
  buildAtlas(this);
 }
 collisions(position){position.x=THREE.MathUtils.clamp(position.x,this.bounds.minX,this.bounds.maxX);position.z=THREE.MathUtils.clamp(position.z,this.bounds.minZ,this.bounds.maxZ);super.collisions(position);}
 addStory(n,position,screenPosition,accent){
  const en=exhibitsFor(this.index,'en')[n],id=exhibitsFor(this.index,'id')[n];
  return this.interactable({id:`artifact-${n}`,label:{en:en.title,id:id.title},preview:{en:en.preview||en.subtitle||en.tags?.join(' · ')||en.label,id:id.preview||id.subtitle||id.tags?.join(' · ')||id.label},position,screenPosition,rotation:Math.atan2(-position[0],-position[2]),accent,screenWidth:1.1,stories:lang=>{const c=exhibitsFor(this.index,lang)[n];return [[c.title,c.body]];},size:[1.7,2.4,1.7]});
 }
}
