import { activityPanel } from './activity-panel.js';
import * as THREE from 'three';
import { cuboid, ring, glow } from './design.js';

const chapters = [
 ['Validasi tujuan','Destination validation',['Tujuan A','Tujuan B'],['Destination A','Destination B'],'Pilih konteks tujuan sebelum menerapkan aturan.','Select destination context before applying a rule.'],
 ['Identitas rekening','Account identity',['Format umum','Konteks IBAN'],['General format','IBAN context'],'Format identitas mengikuti konteks, bukan satu aturan universal.','Identifier format follows context, not a universal rule.'],
 ['Entitas dan cabang','Entities and branches',['Institusi lokal','Cabang overseas'],['Local institution','Overseas branch'],'Relasi entitas memperjelas tanggung jawab pemrosesan.','Entity relationships clarify processing responsibilities.'],
 ['Keputusan routing','Routing decision',['Konteks A','Konteks B'],['Context A','Context B'],'Keputusan mengikuti konteks yang telah divalidasi.','Decisions follow the validated context.'],
 ['Integritas data','Data integrity',['Data konsisten','Field berbeda'],['Consistent data','Different field'],'Perbedaan data perlu ditinjau sebelum tahap berikutnya.','Data differences need review before the next stage.'],
 ['Investigasi kasus','Case investigation',['Periksa konteks','Verifikasi perubahan'],['Inspect context','Verify change'],'Hubungkan gejala, konteks, dan bukti verifikasi.','Connect symptoms, context and verification evidence.'],
];
const outcomes=[
 [['Tujuan A meminta identitas dasar. Jalur A aktif.','Tujuan B meminta konteks tambahan. Jalur B aktif.'],['Destination A requests basic identity. Path A active.','Destination B requests additional context. Path B active.']],
 [['Pemeriksaan identitas umum dipilih.','Pemeriksaan konteks IBAN dipilih; konvensi tidak diterapkan pada semua tujuan.'],['General identifier checks selected.','IBAN context selected; this convention does not apply to all destinations.']],
 [['Node institusi lokal terhubung langsung ke konteks tujuan.','Node cabang terhubung melalui entitas induk ilustratif.'],['Local institution node connects to destination context.','Branch node connects through an illustrative parent entity.']],
 [['Jalur A menghubungkan konteks ke keputusan A.','Jalur B menghubungkan konteks ke keputusan B.'],['Path A connects context to decision A.','Path B connects context to decision B.']],
 [['Ketiga tahap mempertahankan makna field yang sama.','Perbedaan field ditemukan. Tahan alur untuk peninjauan.'],['All three stages preserve field meaning.','A field differs. Hold the flow for review.']],
 [['Gejala dikaitkan dengan konteks; langkah berikutnya adalah verifikasi.','Perubahan contoh telah diperiksa terhadap skenario awal.'],['Symptom linked to context; verification is next.','Example change checked against the original scenario.']],
];
export function buildChronos(world){
 const gold=new THREE.MeshStandardMaterial({color:0xbba77b,metalness:.65,roughness:.32}),dark=new THREE.MeshStandardMaterial({color:0x172333,metalness:.5,roughness:.45}),ink=new THREE.MeshBasicMaterial({color:0x83e2e0});
 const box=(s,p,m=dark,parent=world.group)=>cuboid(parent,s,p,m);
 world.scene.background=new THREE.Color('#050b16');world.scene.fog=new THREE.FogExp2('#050b16',.012);
 // Monumental ribs frame the archive while leaving its central promenade open.
 for(const z of [7,2,-3,-8]){for(const x of [-9,9]){box([.28,5.6,.32],[x,3,z],gold);box([.055,4.6,.36],[x*.98,3,z],ink);}box([18.3,.22,.35],[0,5.8,z],gold);}
 for(const x of [-10,10])for(let z=-7;z<=6;z+=3){box([.55,3,2],[x,1.7,z]);for(let y=.6;y<3;y+=.6)box([.62,.045,2.1],[x,y,z],gold);}
 for(const x of [-1.15,1.15])box([.035,.018,18],[x,.22,0],ink);
 const places=[[-5.2,5], [5.2,4],[-5.2,.5],[5.2,-.5],[-5.2,-4],[5.2,-5]];
 world.chronosState={selected:0,choices:Array(6).fill(null)};
 const nodes=[];
 places.forEach(([x,z],n)=>{
  const g=new THREE.Group();g.position.set(x,.22,z);world.group.add(g);
  box([3,.22,2.4],[0,.11,0],gold,g);box([2.8,.65,2.2],[0,.5,0],dark,g);
  const bits=[];
  if(n===0){for(const side of [-1,1]){box([.22,2.7,.3],[side,1.7,0],gold,g);bits.push(box([.65,1.2,.12],[side*.5,1.8,0],ink,g));}box([2.3,.2,.3],[0,3,0],gold,g);}
  if(n===1){for(let k=0;k<3;k++){const p=box([1.7,1.4,.07],[k*.12,1.65+k*.18,-k*.18],k===2?ink:gold,g);p.rotation.z=-.12;bits.push(p);}}
  if(n===2){for(let k=0;k<3;k++){bits.push(box([.55,.6,.55],[(k-1)*.8,1.6+(k===1?.8:0),0],ink,g));}box([1.8,.05,.06],[0,1.8,0],gold,g);}
  if(n===3){for(const side of [-1,1]){const p=box([.07,1.8,.07],[side*.5,1.8,0],ink,g);p.rotation.z=side*-.55;bits.push(p);}box([.1,.7,.1],[0,1,0],gold,g);}
  if(n===4){for(let k=0;k<3;k++){const r=ring(g,.65,1.3+k*.5,0x86dedb,.035);bits.push(r);}}
  if(n===5){box([2.2,.12,1.3],[0,1.3,0],gold,g);for(let k=0;k<3;k++)bits.push(box([.5,.75,.08],[(k-1)*.65,1.85,0],ink,g));}
  world.colliders.push(new THREE.Box3(new THREE.Vector3(x-1.5,.2,z-1.2),new THREE.Vector3(x+1.5,3,z+1.2)));
  const item=world.addStory(n,[x,1.65,z],[x,1.65,z+1.45],0xd7c18f);item.screen.rotation.y=0;
  glow(g,0x69d5e2,3,[0,1.5,0],.15);
  const path=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.24,z),new THREE.Vector3(x*.35,.24,z),new THREE.Vector3((n-2.5)*.65,.24,-8)]),new THREE.LineBasicMaterial({color:0x7a6650,transparent:true,opacity:.35}));world.group.add(path);
  const node=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:0x566275}));node.position.set((n-2.5)*.65,1.3,-8);world.group.add(node);nodes.push(node);
  bits.forEach(b=>{b.material=b.material.clone();});
  world.animations.push((dt,time)=>{const active=world.chronosState.selected===n;bits.forEach(b=>{b.scale.setScalar(active?1.04:1);b.material.color.set(world.chronosState.choices[n]===null?0x83e2e0:world.chronosState.choices[n]===0?0xe3c68a:0x9da8ed);const choice=world.chronosState.choices[n];const k=bits.indexOf(b);b.visible=choice===null||n===4||n===5||k!==(choice===0?bits.length-1:0);if(n===4)b.material.color.set(choice===1&&k===1?0xed9b83:0x83e2e0);if(n===5)b.scale.y=choice===1?1: k===0?1:.65;});path.material.opacity=world.chronosState.choices[n]!==null?.85:.2;path.material.color.set(world.chronosState.choices[n]!==null?0xe8cc8c:0x566275);node.material.color.set(world.chronosState.choices[n]!==null?0xe8cc8c:active?0x83e2e0:0x566275);if(world.reading===item)world.chronosState.selected=n;});
 });
 box([5,.18,1.1],[0,.8,-8],gold);glow(world.group,0x7ccee2,6,[0,2,-8],.15);
 const diagrams=[
 [[['Tujuan A','Identitas dasar','Validasi konteks'],['Tujuan B','Informasi tambahan','Validasi konteks']], [['Destination A','Basic identity','Context validation'],['Destination B','Additional information','Context validation']]],
 [[['Identitas umum','Pemeriksaan format','Tinjau konteks'],['Konteks IBAN','Konvensi relevan','Tinjau konteks']], [['General identity','Format check','Review context'],['IBAN context','Relevant convention','Review context']]],
 [[['Institusi lokal','Konteks tujuan'],['Entitas induk','Cabang overseas','Konteks tujuan']], [['Local institution','Destination context'],['Parent entity','Overseas branch','Destination context']]],
 [[['Konteks A','Validasi A','Keputusan A'],['Konteks B','Validasi B','Keputusan B']], [['Context A','Validation A','Decision A'],['Context B','Validation B','Decision B']]],
 [[['Field awal: DEMO-A','Field antara: DEMO-A','Field akhir: DEMO-A'],['Field awal: DEMO-A','Field antara: DEMO-B — tinjau','Alur ditahan']], [['Initial field: DEMO-A','Intermediate field: DEMO-A','Final field: DEMO-A'],['Initial field: DEMO-A','Intermediate field: DEMO-B — review','Flow held']]],
 [[['Gejala contoh','Periksa konteks','Siapkan verifikasi'],['Skenario awal','Uji perubahan','Catat hasil verifikasi']], [['Example symptom','Inspect context','Prepare verification'],['Original scenario','Test change','Record verification']]],
 ];
 activityPanel(world,{name:'CHRONOS',chapters,outcomes,state:world.chronosState,diagrams,description:['Pulihkan enam fragmen arsip. Bandingkan dua konteks dan lihat alurnya berubah.','Restore six archive fragments. Compare two contexts and watch the flow change.']});
}

export function chronosExamples(language){return outcomes.map(row=>row[language==='id'?0:1]);}
