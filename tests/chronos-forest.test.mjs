import assert from 'node:assert/strict';
import { FOREST, biomes, puzzles, createPuzzleState, act, toggleLamps, trailPoints, inRiver, terrainHeight, restoreProgress } from '../src/space/chronos-model.js';
assert.equal(puzzles.length,36);assert.equal(new Set(puzzles.map(p=>p.id)).size,36);
for(const b of biomes)assert.equal(puzzles.filter(p=>p.zone===biomes.indexOf(b)).length,6);
for(const p of puzzles){
 assert.ok(p.name.id&&p.name.en);assert.ok(p.x>FOREST.minX+10&&p.x<FOREST.maxX-10&&p.z>FOREST.minZ+10&&p.z<FOREST.maxZ-10);
 const s=createPuzzleState(p);
 if(p.type==='sequence'||p.type==='memory'){
  act(p,s,(p.sequence[0]+1)%4);assert.equal(s.mistakes,1);assert.deepEqual(s.input,[]);
  for(const rune of p.sequence)act(p,s,rune);assert.ok(s.solved);
 }else if(p.type==='riddle'){
  act(p,s,(p.riddle[4]+1)%4);assert.equal(s.solved,false);act(p,s,p.riddle[4]);assert.ok(s.solved);
 }else if(p.type==='lights'){
  assert.ok(s.lamps.some(v=>!v));for(const button of [...p.scramble].reverse())act(p,s,button);assert.ok(s.solved);
 }else if(p.type==='dial'){
  for(let i=0;i<3;i++)for(let n=0;n<p.target[i];n++)act(p,s,i);assert.ok(s.solved);
 }else{
  const points=trailPoints(p);assert.equal(points.length,5);for(const t of points){assert.ok(!inRiver(t.x,t.z));assert.ok(t.z>FOREST.minZ);}
  const length=points.reduce((sum,t,i)=>sum+(i?Math.hypot(t.x-points[i-1].x,t.z-points[i-1].z):Math.hypot(t.x-p.x,t.z-p.z)),0);
  assert.ok(length/FOREST.walk<30,'Trail timer must allow recovery from obstacles');
 }
 if(p.type!=='trail'){const before=JSON.stringify(s);act(p,s,0);assert.equal(JSON.stringify(s),before,'Solved puzzles remain solved');}
}
for(let i=0;i<5;i++){const a=[true,false,true,false,true];assert.deepEqual(toggleLamps(toggleLamps(a,i),i),a);}
for(const x of [-140,0,140])assert.equal(inRiver(x,-165),false);
assert.equal(inRiver(70,-165),true);assert.equal(inRiver(70,-150),false);
for(let x=-330;x<=330;x+=10)for(let z=-340;z<=55;z+=10)assert.ok(Number.isFinite(terrainHeight(x,z)));
assert.deepEqual([...restoreProgress([puzzles[0].id,'unknown',null,puzzles[0].id])],[puzzles[0].id]);assert.equal(restoreProgress({}).size,0);
console.log('Chronos: all 36 puzzles solvable, bilingual regions, sequence recovery, immutable completion, reversible lanterns, trail timings, river bridges, terrain and saved-progress validation passed.');
