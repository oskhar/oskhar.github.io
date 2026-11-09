import assert from 'node:assert/strict';
import {spacecraft,sectors,SPACE_RADIUS,DOCK,desertHeight,createSpaceState,stepSpace,canDock,distance3} from '../src/space/station-model.js';
assert.equal(spacecraft.length,3);assert.equal(sectors.length,6);assert.equal(new Set(sectors.map(s=>s.id)).size,6);
for(const s of sectors){assert.ok(s.name.en&&s.name.id&&s.body.en&&s.body.id&&s.meaning.en&&s.meaning.id);assert.ok(Math.hypot(s.x,s.z)+30<SPACE_RADIUS);assert.ok(s.y>desertHeight(s.x,s.z)+30);for(const other of sectors)if(s!==other)assert.ok(distance3(s,other)>50);}
const advance=(s,v,input,seconds,blocked)=>{for(let t=0;t<seconds;t+=.01)stepSpace(s,input,v,.01,blocked);return s;};
assert.ok(canDock(createSpaceState()));assert.ok(!canDock({...createSpaceState(),speed:10}));assert.ok(!canDock({...createSpaceState(),vertical:6}));assert.ok(!canDock({...createSpaceState(),x:20}));
for(const v of spacecraft){const s=advance(createSpaceState(),v,{throttle:1},3);assert.ok(s.z>DOCK.z);assert.ok(s.speed>0);assert.ok(!canDock(s));
 const up=advance(createSpaceState(),v,{lift:1},2);assert.ok(up.y>DOCK.y+10);const down=advance(createSpaceState(),v,{lift:-1},20);assert.ok(down.y>=desertHeight(down.x,down.z)+5);const ceiling=advance(createSpaceState(),v,{lift:1},20);assert.equal(ceiling.y,150);
 const brake=advance({...s},v,{brake:true},2);assert.ok(Math.abs(brake.speed)<.001);const right=advance(createSpaceState(),v,{throttle:1,steer:1},1);assert.ok(right.x<0,'Right steering from southward launch must face west');
 const wall=advance(createSpaceState(),v,{throttle:1,boost:true},6,(x,y,z)=>z>60&&z<60.4);assert.ok(wall.z<=60,'Fast craft must not tunnel through a thin obstacle');
 const edge=advance({...createSpaceState(),z:SPACE_RADIUS-1},v,{throttle:1},2);assert.ok(Math.hypot(edge.x,edge.z)<=SPACE_RADIUS);
 const liftWall=advance(createSpaceState(),v,{lift:1},5,(x,y)=>y>12&&y<12.4);assert.ok(liftWall.y<=12,'Vertical movement must respect collisions');
 const reverse=advance(createSpaceState(),v,{throttle:-1},2);assert.ok(reverse.z<DOCK.z);const stationary=advance(createSpaceState(),v,{steer:1},1);assert.equal(stationary.x,DOCK.x);assert.notEqual(stationary.yaw,Math.PI,'Craft can turn while hovering');
}
const a=advance(createSpaceState(),spacecraft[0],{throttle:1},2),b=advance(createSpaceState(),spacecraft[1],{throttle:1},2);assert.ok(b.distance>a.distance);
console.log('Satellite: six bilingual personal sectors, separated monuments, spacecraft handling, climb/descent, brakes, hover steering, collision substeps, desert clearance, ceiling, radial boundary and docking speed/range passed.');
