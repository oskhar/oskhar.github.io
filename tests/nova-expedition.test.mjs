import assert from 'node:assert/strict';
import {districts,vehicles,terrainHeight,createDriveState,stepDrive,NOVA_RADIUS} from '../src/space/nova-model.js';
assert.equal(districts.length,6);assert.equal(new Set(districts.map(d=>d.id)).size,6);
for(const d of districts){assert.ok(d.name.id&&d.name.en&&d.metaphor.id&&d.metaphor.en);assert.ok(Math.hypot(d.x,d.z)+25<NOVA_RADIUS);assert.equal(terrainHeight(d.x,d.z),0);
 for(let t=0;t<=1;t+=.01)assert.ok(Math.abs(terrainHeight(d.x*t,d.z*t))<1e-8,'Marked roads must remain level');
 for(const other of districts)if(other!==d)assert.ok(Math.hypot(d.x-other.x,d.z-other.z)>50,'Districts must not overlap');
}
for(let x=-190;x<190;x+=3)for(let z=-190;z<190;z+=3)assert.ok(Number.isFinite(terrainHeight(x,z)));
const advance=(s,v,input,seconds,blocked)=>{for(let t=0;t<seconds;t+=.01)stepDrive(s,input,v,.01,blocked);return s;};
for(const v of vehicles){const forward=advance(createDriveState(),v,{throttle:1},4);assert.ok(forward.z<0&&forward.z>-NOVA_RADIUS);assert.equal(forward.speed,v.maxSpeed);
 const reverse=advance(createDriveState(),v,{throttle:-1},3);assert.ok(reverse.z>0);assert.ok(Math.abs(reverse.speed)<=v.maxSpeed*.38);
 const stopped=advance({...forward},v,{brake:true},2);assert.ok(Math.abs(stopped.speed)<.001);
 const wall=advance(createDriveState(),v,{throttle:1,boost:true},8,(x,z)=>z<-20&&z>-20.3);assert.ok(wall.z>=-20,'Cannot tunnel through a thin wall');
 const bound=advance(createDriveState(0,-185),v,{throttle:1},5);assert.ok(Math.hypot(bound.x,bound.z)<=NOVA_RADIUS-4);
 const steering=advance(createDriveState(),v,{throttle:1,steer:1},2);assert.ok(steering.x>0,'Right steering must turn right');
 const invalid=stepDrive(createDriveState(),{throttle:1},v,10);assert.ok(Math.abs(invalid.z)<.1,'Long frames must be clamped');
}
const slow=advance(createDriveState(),vehicles[0],{throttle:1},4),fast=advance(createDriveState(),vehicles[1],{throttle:1},4);assert.ok(fast.distance>slow.distance);
console.log('Nova: bilingual districts, flat continuous routes, non-overlapping map, finite terrain, vehicle acceleration, reverse, braking, steering, thin-wall collision and world boundary passed.');
