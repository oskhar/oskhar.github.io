// Deliberately simplified teaching models. Values are simulated, never benchmarks.
export const labDefinitions = [
 {key:'domain',name:['Ruang domain','Domain loom'],tag:'BOUNDARIES',hint:['Geser ketergantungan lintas domain. Isolasi aturan untuk melihat seberapa jauh perubahan merambat.','Adjust cross-domain dependencies. Isolate rules to see how far a change propagates.'],params:[['coupling','Ketergantungan','Coupling',0,100,55,'%']],action:['Ubah satu aturan','Change one rule'],toggle:['Isolasi domain','Isolate domains']},
 {key:'api',name:['Load balancer & server','Load balancer & servers'],tag:'TRAFFIC',hint:['Tambah traffic atau perlambat layanan. Jumlah worker membatasi berapa request yang bisa diproses bersamaan.','Increase traffic or slow the service. Worker count limits simultaneous requests.'],params:[['arrival','Request / detik','Requests / second',0,30,4,'/s'],['latency','Waktu layanan','Service time',100,2000,500,'ms'],['workers','Server aktif','Active servers',1,8,3,''],['down','Server down','Servers down',0,8,0,''],['skew','Bias ke server pertama','First-server bias',0,100,0,'%']],action:['Kirim lonjakan +20','Send burst +20'],toggle:['Distribusi merata','Balanced routing']},
 {key:'events',name:['Reservoir event','Event reservoir'],tag:'BACKPRESSURE',hint:['Seimbangkan producer dan consumer. Antrean menyimpan selisih; jeda consumer untuk mengamati backpressure.','Balance producer and consumers. The queue stores the difference; pause consumers to observe backpressure.'],params:[['producer','Event / detik','Events / second',1,25,4,'/s'],['consumers','Consumer','Consumers',1,6,2,''],['rate','Kapasitas / consumer','Capacity / consumer',1,8,3,'/s']],action:['Tambahkan 30 event','Add 30 events'],toggle:['Jeda consumer','Pause consumers']},
 {key:'data',name:['Kebun indeks','Index garden'],tag:'QUERY PLANNER',hint:['Pilih ukuran dataset dan aktifkan indeks. Jalankan query untuk membandingkan jumlah pemeriksaan dalam model ini.','Choose dataset size and enable an index. Run a query to compare checks in this model.'],params:[['rows','Jumlah baris','Rows',100,10000,2400,'']],action:['Jalankan query','Run query'],toggle:['Gunakan indeks','Use index']},
 {key:'reliability',name:['Ruang gangguan','Failure chamber'],tag:'RESILIENCE',hint:['Suntikkan gangguan ke dependensi. Circuit breaker membatasi percobaan saat kegagalan berulang, lalu menguji pemulihan.','Inject dependency faults. A circuit breaker limits repeated failures, then probes recovery.'],params:[['failure','Peluang gagal','Failure probability',0,100,0,'%']],action:['Pulihkan dependensi','Recover dependency'],toggle:['Circuit breaker','Circuit breaker']},
 {key:'delivery',name:['Peluncur canary','Canary launcher'],tag:'RELEASE CONTROL',hint:['Atur porsi traffic ke versi baru dan tingkat cacatnya. Luncurkan canary, amati error, lalu putuskan rollback.','Set new-version traffic share and defect rate. Launch a canary, observe errors, then decide whether to roll back.'],params:[['canary','Traffic versi baru','New-version traffic',0,100,20,'%'],['defect','Cacat versi baru','New-version defects',0,100,30,'%']],action:['Luncurkan versi baru','Launch new version'],toggle:['Rollback ke versi stabil','Roll back to stable']},
 {key:'architecture',name:['Mesin read model','Read-model engine'],tag:'EVENTUAL CONSISTENCY',hint:['Tulis perubahan ke sumber data. Atur jeda proyeksi dan lihat read model mengejar event. Replay membangun ulang proyeksi.','Write changes to the source. Adjust projection delay and watch the read model catch up. Replay rebuilds the projection.'],params:[['delay','Jeda proyeksi','Projection delay',0,5000,1500,'ms']],action:['Tulis perubahan','Write a change'],toggle:['Jeda proyeksi','Pause projection']},
];

export function createLabState(index){
 const params=Object.fromEntries(labDefinitions[index].params.map(p=>[p[0],p[5]]));
 return {index,params,toggle:false,time:0,accumulator:0,queue:0,processed:0,rejected:0,active:[],pulses:[],changed:0,checks:0,progress:0,running:false,breaker:'closed',failures:0,cooldown:0,attempts:0,errors:0,blocked:0,deployed:false,version:0,readVersion:0,events:[],seed:100+index,cursor:0};
}
function random(s){s.seed=(1664525*s.seed+1013904223)>>>0;return s.seed/4294967296;}
export function labAction(s){
 if(s.index===0){s.changed++;s.pulses=[{age:0}];}
 if(s.index===1)s.queue=Math.min(200,s.queue+20);
 if(s.index===2)s.queue=Math.min(200,s.queue+30);
 if(s.index===3){s.checks=0;s.progress=0;s.running=true;}
 if(s.index===4){s.params.failure=0;s.failures=0;s.cooldown=0;s.breaker='closed';}
 if(s.index===5){s.deployed=true;s.toggle=false;s.attempts=0;s.errors=0;}
 if(s.index===6){s.version++;s.events.push({version:s.version,ready:s.time+s.params.delay/1000});}
}
export function labToggle(s){s.toggle=!s.toggle;if(s.index===4&&!s.toggle){s.breaker='closed';s.failures=0;}if(s.index===5&&s.toggle)s.deployed=false;}
export function replayProjection(s){s.readVersion=0;s.events=Array.from({length:s.version},(_,i)=>({version:i+1,ready:s.time+(i+1)*Math.max(.05,s.params.delay/1000)}));}
export function stepLab(s,delta){
 // Bounded fixed steps make the models independent from render frame rate.
 s.accumulator+=Math.min(Math.max(delta,0),.25);
 while(s.accumulator>=.05){s.accumulator-=.05;tick(s,.05);}
}
function tick(s,dt){
 s.time+=dt;const p=s.params;
 s.pulses=s.pulses.filter(a=>(a.age+=dt)<2);
 if(s.index===1){
  s.queue+=p.arrival*dt;
  s.active=s.active.filter(job=>{if(job.worker>=Math.max(0,p.workers-p.down)){s.queue++;return false;}job.left-=dt;if(job.left<=0){s.processed++;return false;}return true;});
  while(s.queue>=1){const count=Math.max(0,p.workers-p.down),free=Array.from({length:count},(_,i)=>i).filter(i=>!s.active.some(j=>j.worker===i));if(!free.length)break;let worker=free[s.cursor++%free.length];if(!s.toggle&&random(s)*100<p.skew){if(!free.includes(0))break;worker=0;}s.queue--;s.active.push({worker,left:p.latency/1000,total:p.latency/1000});}
  if(s.queue>200){s.rejected+=s.queue-200;s.queue=200;}
 }
 if(s.index===2){s.queue+=p.producer*dt;const take=s.toggle?0:Math.min(s.queue,p.consumers*p.rate*dt);s.queue-=take;s.processed+=take;if(s.queue>200){s.rejected+=s.queue-200;s.queue=200;}}
 if(s.index===3&&s.running){const target=s.toggle?Math.ceil(Math.log2(p.rows))+1:p.rows;s.checks=Math.min(target,s.checks+(s.toggle?20:600)*dt);s.progress=s.checks/target;if(s.progress>=1){s.running=false;s.processed++;}}
 if(s.index===4){
  if(s.breaker==='open'){s.cooldown-=dt;if(s.cooldown<=0)s.breaker='half-open';}
  if(Math.floor(s.time*5)!==Math.floor((s.time-dt)*5)){
   if(s.toggle&&s.breaker==='open')s.blocked++;
   else{s.attempts++;const fail=random(s)*100<p.failure;if(fail){s.errors++;s.failures++;}else{s.processed++;s.failures=0;}
    if(s.toggle&&(s.failures>=3||s.breaker==='half-open'&&fail)){s.breaker='open';s.cooldown=3;}else if(s.breaker==='half-open'&&!fail)s.breaker='closed';
   }
  }
 }
 if(s.index===5&&s.deployed&&Math.floor(s.time*10)!==Math.floor((s.time-dt)*10)){s.attempts++;if(random(s)*100<p.canary&&random(s)*100<p.defect)s.errors++;else s.processed++;}
 if(s.index===6&&!s.toggle){while(s.events.length&&s.events[0].ready<=s.time){s.readVersion=s.events.shift().version;s.processed++;}}
}
export function labMetrics(s,id=false){const p=s.params;switch(s.index){
 case 0:return [[id?'Domain terdampak':'Affected domains',s.changed?1+Math.round((s.toggle?0:p.coupling)/100*5):0],[id?'Perubahan aturan':'Rule changes',s.changed]];
 case 1:return [[id?'Antrean':'Queue',Math.floor(s.queue)],[id?'Worker aktif':'Busy workers',s.active.length+'/'+p.workers],[id?'Selesai':'Completed',s.processed],[id?'Ditolak (buffer penuh)':'Rejected (buffer full)',Math.floor(s.rejected)]];
 case 2:return [[id?'Antrean':'Queue',Math.floor(s.queue)],[id?'Kapasitas':'Capacity',(s.toggle?0:p.consumers*p.rate)+'/s'],[id?'Diproses':'Processed',Math.floor(s.processed)],[id?'Overflow':'Overflow',Math.floor(s.rejected)]];
 case 3:return [[id?'Pemeriksaan':'Checks',Math.ceil(s.checks)],[id?'Target model':'Model target',s.toggle?Math.ceil(Math.log2(p.rows))+1:p.rows],[id?'Progres':'Progress',Math.round(s.progress*100)+'%']];
 case 4:return [['Circuit',s.toggle?s.breaker:'disabled'],[id?'Percobaan':'Attempts',s.attempts],[id?'Gagal':'Failures',s.errors],[id?'Diblokir':'Blocked',s.blocked]];
 case 5:return [[id?'Versi aktif':'Active release',s.deployed?'stable + canary':'stable'],[id?'Sampel':'Samples',s.attempts],[id?'Error teramati':'Observed errors',s.errors],[id?'Estimasi model':'Model expectation',(s.deployed?p.canary*p.defect/100:0).toFixed(1)+'%']];
 default:return [['Source version',s.version],['Read version',s.readVersion],[id?'Event tertunda':'Pending events',s.events.length]];
 }}
