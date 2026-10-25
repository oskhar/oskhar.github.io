import * as THREE from 'three';

/** A real route through the orbit scene, with flybys outside planetary surfaces. */
export function createReturnRoute(destinations,index,origin,endpoint){
 const remaining=destinations.map((d,i)=>({...d,index:i,center:new THREE.Vector3(...d.position)})).filter(d=>d.type!=='station'&&d.index!==index),flybys=[],points=[origin.clone()];let previous=origin.clone();
 while(remaining.length&&flybys.length<3){
  remaining.sort((a,b)=>a.center.distanceToSquared(previous)-b.center.distanceToSquared(previous));const planet=remaining.shift(),forward=planet.center.clone().sub(previous).normalize(),side=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();if(side.lengthSq()<.1)side.set(1,0,0);
  const offset=side.multiplyScalar(planet.radius*1.8);
  points.push(planet.center.clone().add(offset).addScaledVector(forward,-planet.radius*2.4),planet.center.clone().add(offset),planet.center.clone().add(offset).addScaledVector(forward,planet.radius*2.4));flybys.push(planet.index);previous=points.at(-1);
 }
 // Approach the original cockpit window forwards, from behind the home orbit.
 points.push(new THREE.Vector3(34,20,75),new THREE.Vector3(0,2,60),new THREE.Vector3(0,2,42),endpoint.clone());
 let curve;
 for(let pass=0;pass<32;pass++){
  curve=new THREE.CatmullRomCurve3(points,false,'centripetal');curve.arcLengthDivisions=600;
  let collision=null;for(let sample=1;sample<600&&!collision;sample++){
   const t=sample/600,point=curve.getPoint(t);
   for(const planet of destinations){const center=new THREE.Vector3(...planet.position),safe=planet.radius*1.4+3;if(point.distanceTo(center)<safe){collision={t,point,center,safe};break;}}
  }
  if(!collision)break;
  const away=collision.point.clone().sub(collision.center);if(away.lengthSq()<.001)away.set(0,1,0);const detour=collision.center.clone().add(away.normalize().multiplyScalar(collision.safe+8)),segment=Math.floor(collision.t*(points.length-1));points.splice(segment+1,0,detour);
 }
 return {curve,flybys};
}
