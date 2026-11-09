// Deterministic forest and puzzle rules, independent from rendering and the DOM.
export const FOREST = {minX:-330,maxX:330,minZ:-340,maxZ:55,walk:5.2,sprint:9.4};
export const biomes = [
 {id:'bloom',x:0,z:-42,name:{id:'Rimba Amethyst',en:'Amethyst Grove'},color:0xc28aff},
 {id:'spore',x:-130,z:-95,name:{id:'Lembah Jamur',en:'Mushroom Hollow'},color:0xf092db},
 {id:'echo',x:125,z:-110,name:{id:'Reruntuhan Gema',en:'Echo Ruins'},color:0xa49bff},
 {id:'crystal',x:-180,z:-235,name:{id:'Kebun Kristal',en:'Crystal Garden'},color:0xd5b1ff},
 {id:'mist',x:10,z:-235,name:{id:'Rawa Lembayung',en:'Violet Marsh'},color:0xb67cea},
 {id:'roots',x:180,z:-240,name:{id:'Labirin Akar',en:'Root Labyrinth'},color:0xefb0ff},
];
const titles={sequence:['Simfoni Rune','Rune Symphony'],riddle:['Bisikan Hutan','Forest Whisper'],lights:['Lentera Terhubung','Linked Lanterns'],dial:['Jam Bulan','Moon Clock'],memory:['Ingatan Peri','Fairy Memory'],trail:['Jejak Penjaga','Guardian Trail']};
const offsets=[[-23,17],[23,17],[-35,-12],[35,-12],[-20,-38],[20,-38]];
const riddles=[
 ['Aku mengikutimu saat terang, tetapi lenyap saat gelap. Siapakah aku?','I follow you in the light, but vanish in the dark. What am I?',['Bayangan','Angin','Akar','Bintang'],['Shadow','Wind','Root','Star'],0],
 ['Semakin banyak kau ambil dariku, semakin besar aku. Apakah aku?','The more you take away from me, the larger I become. What am I?',['Pohon','Lubang','Sungai','Batu'],['Tree','Hole','River','Stone'],1],
 ['Aku punya banyak kunci, tetapi tidak dapat membuka pintu.','I have many keys but cannot open a door.',['Peta','Jam','Piano','Buku'],['Map','Clock','Piano','Book'],2],
 ['Aku dapat pecah tanpa disentuh. Apakah aku?','I can be broken without being touched. What am I?',['Kristal','Ranting','Batu','Janji'],['Crystal','Branch','Rock','Promise'],3],
 ['Aku selalu di depanmu, tetapi tidak pernah terlihat.','I am always ahead of you, but can never be seen.',['Masa depan','Bulan','Jejak','Kabut'],['Future','Moon','Trail','Mist'],0],
 ['Aku punya kota tanpa rumah, sungai tanpa air, dan hutan tanpa pohon.','I have cities without houses, rivers without water, forests without trees.',['Mimpi','Peta','Langit','Cermin'],['Dream','Map','Sky','Mirror'],1],
];
export const puzzles=biomes.flatMap((b,zone)=>Object.keys(titles).map((type,k)=>({id:`${b.id}-${type}`,zone,type,x:b.x+offsets[k][0],z:b.z+offsets[k][1],name:{id:`${titles[type][0]} ${zone+1}`,en:`${titles[type][1]} ${zone+1}`},sequence:Array.from({length:4+zone%3},(_,i)=>(zone+i*3+Math.floor(i/2))%4),target:[(zone+1)%4,(zone*2+2)%4,Math.floor(zone/2)%4],scramble:zone===5?[0,1,4]:[zone%5,(zone+2)%5,(zone+3)%5],riddle:riddles[zone]})));
export const runes=['☾','✦','❀','◇'];
export function createPuzzleState(p){return {solved:false,input:[],lamps:initialLamps(p),dials:[0,0,0],mistakes:0};}
export function toggleLamps(lamps,index){const next=[...lamps];for(const n of [index-1,index,index+1])if(n>=0&&n<5)next[n]=!next[n];return next;}
export function initialLamps(p){return p.scramble.reduce((s,k)=>toggleLamps(s,k),Array(5).fill(true));}
export function act(p,s,value){
 if(s.solved||p.type==='trail')return s.solved;
 if(p.type==='sequence'||p.type==='memory'){
  s.input.push(value);if(value!==p.sequence[s.input.length-1]){s.input=[];s.mistakes++;return false;}s.solved=s.input.length===p.sequence.length;
 }else if(p.type==='riddle'){s.solved=value===p.riddle[4];if(!s.solved)s.mistakes++;}
 else if(p.type==='lights'){s.lamps=toggleLamps(s.lamps,value);s.solved=s.lamps.every(Boolean);}
 else if(p.type==='dial'){s.dials[value]=(s.dials[value]+1)%4;s.solved=s.dials.every((n,i)=>n===p.target[i]);}
 return s.solved;
}
export function trailPoints(p){return Array.from({length:5},(_,i)=>({x:p.x+Math.sin(i*1.1)*10,z:p.z+(p.zone===1||p.zone===2?1:-1)*(6+i*6)}));}
export function randomForest(seed=491){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function inRiver(x,z){return Math.abs(z+165)<4.5&&[-140,0,140].every(bridge=>Math.abs(x-bridge)>3);}
export function terrainHeight(x,z){return Math.max(0,(Math.abs(x)-260)/65)*Math.sin(z*.03)**2*9;}
export function restoreProgress(saved){return new Set(Array.isArray(saved)?saved.filter(id=>puzzles.some(p=>p.id===id)):[]);}
