import * as THREE from 'three';
import { cuboid, ring, glow } from './design.js';
import { activityPanel } from './activity-panel.js';

const chapters=[
 ['Desain domain','Domain design',['Konteks A','Konteks B'],['Context A','Context B']],
 ['API & integrasi','API & integration',['Request lengkap','Field kurang'],['Complete request','Missing field']],
 ['Komunikasi event','Event communication',['Normal','Tertunda'],['Normal','Delayed']],
 ['Model data & query','Data models & queries',['Ringkasan','Detail relasi'],['Summary','Related detail']],
 ['Investigasi sistem','System investigation',['Gejala lambat','Data berbeda'],['Slow response','Data mismatch']],
 ['Container & delivery','Containers & delivery',['Uji lolos','Uji gagal'],['Tests pass','Tests fail']],
 ['Riset arsitektur','Architecture research',['Kesederhanaan','Pemisahan tanggung jawab'],['Simplicity','Separation of concerns']],
];
const outcomes=[
 [['Konteks A memilih aturan A; transport dan penyimpanan tetap terpisah.','Konteks B memilih aturan B tanpa mengganti lapisan transport.'],['Context A selects rule A; transport and storage remain separate.','Context B selects rule B without changing the transport layer.']],
 [['Kontrak contoh terpenuhi; request dapat diteruskan.','Field contoh belum lengkap; kembalikan alasan perbaikan sebelum integrasi.'],['Example contract satisfied; request can proceed.','Example field missing; return a useful reason before integration.']],
 [['Producer mengirim event; consumer memprosesnya.','Event menunggu; status pemrosesan tetap terlihat sebelum percobaan berikutnya.'],['Producer sends an event; consumer processes it.','Event waits; processing status stays visible before the next attempt.']],
 [['Query ringkasan hanya menyorot tabel utama.','Query detail melibatkan tabel utama, item, dan relasi.'],['Summary query highlights only the primary table.','Detail query includes the primary table, items and relationships.']],
 [['Telusuri konteks request, waktu tahap, lalu dependensi.','Bandingkan field awal, transformasi, dan hasil tersimpan.'],['Trace request context, stage timing, then dependencies.','Compare original fields, transformations and persisted results.']],
 [['Build dan pengujian lolos; deployment konseptual dapat dilanjutkan.','Pengujian gagal; deployment ditahan dan versi sebelumnya dipertahankan.'],['Build and tests pass; conceptual deployment can proceed.','Tests fail; deployment is held and the previous version is preserved.']],
 [['Monolit mengurangi batas layanan, tetapi modul tetap perlu disiplin.','Desain hybrid memperjelas tanggung jawab, dengan tambahan koordinasi dan operasional.'],['A monolith reduces service boundaries while still requiring modular discipline.','A hybrid design separates responsibilities with extra coordination and operations.']],
];
const flows=[
 [[['Transport','Aturan A','Persistensi'],['Transport','Aturan B','Persistensi']],[['Transport','Rule A','Persistence'],['Transport','Rule B','Persistence']]],
 [[['Request lengkap','Validasi','Response contoh'],['Request kurang','Validasi menolak','Alasan perbaikan']],[['Complete request','Validation','Example response'],['Incomplete request','Validation rejects','Correction reason']]],
 [[['Producer','Broker','Consumer: diproses'],['Producer','Broker: menunggu','Consumer: belum diproses']],[['Producer','Broker','Consumer: processed'],['Producer','Broker: waiting','Consumer: pending']]],
 [[['Tabel utama','Ringkasan'],['Tabel utama','Relasi item','Detail']],[['Primary table','Summary'],['Primary table','Item relationship','Detail']]],
 [[['Konteks request','Waktu tahap','Periksa dependensi'],['Field awal','Transformasi','Bandingkan hasil']],[['Request context','Stage timing','Inspect dependency'],['Original field','Transformation','Compare result']]],
 [[['Build: lolos','Test: lolos','Deploy: siap'],['Build: lolos','Test: gagal','Deploy: ditahan']],[['Build: passed','Test: passed','Deploy: ready'],['Build: passed','Test: failed','Deploy: held']]],
 [[['Modul dalam satu proses','Operasional sederhana','Jaga batas modul'],['Layanan + CQRS/event sourcing','Tanggung jawab terpisah','Kelola konsistensi dan koordinasi']],[['Modules in one process','Simpler operations','Preserve module boundaries'],['Services + CQRS/event sourcing','Separate responsibilities','Manage consistency and coordination']]],
];
export function atlasExamples(language){return outcomes.map(row=>row[language==='id'?0:1]);}
export function buildAtlas(world){
 world.atlasState={selected:0,choices:Array(7).fill(null)};
 world.scene.background=new THREE.Color('#04151b');world.scene.fog=new THREE.FogExp2('#04151b',.009);
 const metal=new THREE.MeshStandardMaterial({color:0x16333f,metalness:.5,roughness:.4}),trim=new THREE.MeshStandardMaterial({color:0x729c9f,metalness:.6,roughness:.35}),light=new THREE.MeshBasicMaterial({color:0x7ce6df});
 const box=(parent,size,pos,mat=metal)=>cuboid(parent,size,pos,mat);
 const places=[[-5.8,5],[5.8,5],[-5.8,.5],[-5.8,-4],[5.8,.5],[5.8,-4],[0,-6.7]];
 // A low system core, open ceiling rails and two aisles give this room a laboratory silhouette.
 for(const x of [-9,9]){box(world.group,[.18,4.5,.18],[x,2.45,-7],trim);box(world.group,[.18,.16,16],[x,4.6,.5],trim);}
 box(world.group,[18,.16,.18],[0,4.6,-7],trim);
 for(const x of [-2.4,2.4])box(world.group,[.025,.015,16],[x,.215,0],light);
 const core=new THREE.Group();core.position.set(0,.25,0);world.group.add(core);box(core,[2.2,.4,2.2],[0,.2,0]);
 for(let k=0;k<3;k++)ring(core,.55+k*.15,.55+k*.12,0x8be3da,.018);
 const nucleus=new THREE.Mesh(new THREE.OctahedronGeometry(.35),light);nucleus.position.y=1;core.add(nucleus);glow(core,0x76e9d5,3,[0,.8,0],.15);
 places.forEach(([x,z],n)=>{
  const g=new THREE.Group();g.position.set(x,.22,z);world.group.add(g);const bits=[];
  const emit=(size,pos)=>{const mesh=box(g,size,pos,light.clone());bits.push(mesh);return mesh;};
  box(g,[3,.2,2],[0,.1,0],trim);box(g,[2.7,.65,1.8],[0,.5,0]);
  if(n===0){box(g,[2.4,1.7,.12],[0,1.8,-.3],trim);for(let k=0;k<3;k++)emit([.6,.8,.08],[(k-1)*.75,1.8,-.2]);}
  if(n===1){for(const side of [-1,1]){box(g,[.9,1.5,.6],[side*.9,1.5,0]);emit([.7,.75,.06],[side*.9,1.9,.34]);}emit([1.1,.05,.05],[0,1.65,0]);}
  if(n===2){for(let k=0;k<3;k++){const node=new THREE.Mesh(new THREE.SphereGeometry(.3,k===1?6:16,12),light.clone());node.position.set((k-1)*.85,1.7+(k===1?.45:0),0);g.add(node);bits.push(node);}box(g,[2,.045,.05],[0,1.7,0],trim);}
  if(n===3){for(let k=0;k<3;k++){box(g,[.65,.07,1.15],[(k-1)*.85,1.25,0],trim);for(let row=0;row<3;row++)emit([.55,.045,.22],[(k-1)*.85,1.33+row*.13,0]);}}
  if(n===4){box(g,[2.3,1.6,.14],[0,1.8,-.2],trim);for(let k=0;k<5;k++)emit([.22,.35+k*.18,.08],[(k-2)*.4,1.6,-.1]);}
  if(n===5){for(let k=0;k<3;k++){box(g,[.65,.65,.65],[(k-1)*.85,1.3,0],trim);emit([.5,.08,.07],[(k-1)*.85,1.7,.34]);}box(g,[2.4,.05,.08],[0,1,0],light);}
  if(n===6){box(g,[.8,1.3,.8],[-.8,1.4,0],trim);emit([.6,.1,.06],[-.8,2.1,.41]);for(let k=0;k<3;k++)emit([.4,.5,.4],[.5+(k%2)*.6,1.3+Math.floor(k/2)*.7,0]);}
  let packet=null,elapsed=0;if(n===2){packet=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xffdf9e}));packet.position.set(-.85,1.8,.4);g.add(packet);}
  const item=world.addStory(n,[x,1.65,z],[x,1.65,z+1.4],0x88ded6);item.screen.rotation.y=0;
  world.colliders.push(new THREE.Box3(new THREE.Vector3(x-1.5,.2,z-1),new THREE.Vector3(x+1.5,3,z+1)));
  const cable=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.24,z),new THREE.Vector3(x*.4,.24,z),new THREE.Vector3(0,.24,0)]),new THREE.LineBasicMaterial({color:0x78bcb7,transparent:true,opacity:.25}));world.group.add(cable);
  world.animations.push((dt,time)=>{if(world.reading===item)world.atlasState.selected=n;const choice=world.atlasState.choices[n];if(packet){elapsed+=dt;packet.visible=choice!==null;packet.position.x=choice===1?0:world.universe.motion?((elapsed%2)/2)*1.7-.85:.85;}const active=world.atlasState.selected===n;bits.forEach((b,k)=>{b.material.color.set(choice===null?0x537d83:choice===1&&((n===1||n===5)&&k===1||n===4&&k>2)?0xefad83:0x84e5ce);b.scale.setScalar(active?1.04:1);if(n===0)b.visible=choice===null||k===(choice===0?0:2)||k===1;if(n===3)b.material.color.set(choice===0&&k>2?0x304b56:0x84e5ce);if(n===6)b.scale.setScalar(choice===null?1:(choice===0?k===0:k>0)?1.12:.7);});cable.material.opacity=choice===null?.18:active?.9:.5;});
 });
 world.animations.push(dt=>{nucleus.rotation.y+=dt*.2;});
 activityPanel(world,{name:'ATLAS',chapters,outcomes,state:world.atlasState,diagrams:flows,description:['Jelajahi tujuh eksperimen. Pilih skenario dan bandingkan respons sistem.','Explore seven experiments. Choose a scenario and compare the system response.']});
}
