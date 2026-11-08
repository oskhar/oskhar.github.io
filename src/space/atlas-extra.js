// Small, deterministic teaching models; no network calls or production benchmarks.
const param=(key,id,en,min,max,value,unit='')=>[key,id,en,min,max,value,unit];
const define=(key,id,en,tag,params,goal)=>({key,name:[id,en],tag,params,hint:goal,action:['Kirim 12 request','Send 12 requests'],toggle:['Aktifkan','Enable']});
export const extraDefinitions=[
 define('cache','Cache TTL','TTL cache','CACHE',[param('ttl','Masa cache','Cache lifetime',1,12,4,'s')],['Bandingkan akses cache dan database. Cache kedaluwarsa setelah TTL.','Compare cache and database access. Entries expire after TTL.']),
 define('limit','Rate limiter','Rate limiter','TOKEN BUCKET',[param('limit','Token / detik','Tokens / second',1,12,4,'/s')],['Token membatasi request; sisanya ditolak, bukan ditunda.','Tokens limit requests; excess requests are rejected, not queued.']),
 define('retry','Retry & backoff','Retry & backoff','EXPONENTIAL BACKOFF',[param('fault','Gangguan','Failure rate',0,100,60,'%')],['Backoff memberi jeda antarputaran retry; maksimal empat percobaan.','Backoff spaces retries; at most four attempts per request.']),
 define('dedup','Idempotency','Idempotency','DUPLICATE REQUESTS',[param('copies','Salinan / transaksi','Copies / transaction',1,6,3)],['Kunci idempotensi mencegah satu transaksi diterapkan berulang.','Idempotency keys prevent applying a transaction more than once.']),
 define('replica','Replikasi database','Database replication','REPLICATION LAG',[param('lag','Jeda replika','Replica lag',1,10,3,'s')],['Tulisan masuk primary; replika mengejar setelah jeda. Jeda dapat dihentikan.','Writes reach the primary; replicas catch up after a delay. Replication can pause.']),
 define('shard','Sharding','Sharding','HASH PARTITIONING',[param('shards','Jumlah shard','Shard count',1,6,3)],['Bandingkan key merata dengan hot key yang menumpuk di shard pertama.','Compare distributed keys with a hot key concentrated on the first shard.']),
 define('batch','Batch processing','Batch processing','BATCH SIZE',[param('batch','Ukuran batch','Batch size',1,12,4)],['Batch mengurangi jumlah perjalanan untuk memproses pekerjaan yang sama.','Batching reduces round trips for the same workload.']),
 define('pool','Connection pool','Connection pool','BOUNDED CONCURRENCY',[param('pool','Koneksi','Connections',1,8,3)],['Koneksi dipakai ulang. Request menunggu ketika semua koneksi sibuk.','Connections are reused. Requests wait when all connections are busy.']),
 define('priority','Antrean prioritas','Priority queue','SCHEDULING',[param('urgent','Request prioritas','Priority requests',0,100,30,'%')],['Bandingkan FIFO dan prioritas. Pekerjaan biasa bisa menunggu lebih lama.','Compare FIFO with priority scheduling. Normal jobs may wait longer.']),
 define('dlq','Dead-letter queue','Dead-letter queue','POISON MESSAGES',[param('poison','Pesan rusak','Poison messages',0,100,25,'%')],['Pesan rusak dicoba tiga kali lalu dipisahkan agar antrean bisa maju.','Poison messages retry three times then move aside so the queue can progress.']),
];
export function initExtra(s){Object.assign(s,{jobs:[],bins:[0,0,0,0,0,0],tokens:4,cacheUntil:0,hits:0,reads:0,rounds:0,duplicate:0,seen:[],trail:[],nextId:0});return s;}
export function actionExtra(s){for(let i=0;i<12;i++)s.jobs.push({id:s.nextId++,ready:s.time,tries:0,urgent:i<Math.round(12*(s.params.urgent||0)/100),poison:(i%4)*25<(s.params.poison||0)});s.pulses.push({age:0});}
export function tickExtra(s,dt){
 const key=extraDefinitions[s.index-7].key,p=s.params;
 if(key==='limit')s.tokens=Math.min(p.limit,s.tokens+p.limit*dt);
 if(key==='replica'&&!s.toggle){while(s.trail.length&&s.trail[0].ready<=s.time){s.readVersion=s.trail.shift().version;}}
 if(Math.floor(s.time*4)===Math.floor((s.time-dt)*4))return;
 if(key==='pool'){
  s.active=s.active.filter(j=>{if(j.ready>s.time)return true;s.processed++;return false;});
  const capacity=s.toggle?p.pool:1;while(s.jobs.length&&s.active.length<capacity){s.active.push({ready:s.time+1});s.jobs.shift();}s.queue=s.jobs.length;return;
 }
 if(!s.jobs.length){s.queue=0;return;}
 if(key==='priority'&&s.toggle)s.jobs.sort((a,b)=>Number(b.urgent)-Number(a.urgent));
 const count=key==='batch'&&s.toggle?p.batch:1;
 const ready=s.jobs.findIndex(j=>j.ready<=s.time);if(ready<0)return;
 const jobs=s.jobs.splice(ready,count);s.rounds++;
 for(const j of jobs){s.attempts++;
  if(key==='cache'){if(s.toggle&&s.cacheUntil>s.time){s.hits++;}else{s.reads++;s.cacheUntil=s.time+p.ttl;}s.processed++;}
  else if(key==='limit'){if(!s.toggle||s.tokens>=1){if(s.toggle)s.tokens--;s.processed++;}else s.rejected++;}
  else if(key==='retry'){const fail=((j.id*37+j.tries*23)%100)<p.fault;if(!fail)s.processed++;else{j.tries++;if(j.tries>=4){s.rejected++;}else{j.ready=s.time+(s.toggle?2**(j.tries-1):.25);s.jobs.push(j);s.errors++;}}}
  else if(key==='dedup'){const transaction=Math.floor(j.id/p.copies);if(s.toggle&&s.seen.includes(transaction))s.duplicate++;else{s.seen.push(transaction);s.processed++;}}
  else if(key==='replica'){s.version++;s.processed++;s.trail.push({version:s.version,ready:s.time+p.lag});}
  else if(key==='shard'){s.bins[s.toggle?0:j.id%p.shards]++;s.processed++;}
  else if(key==='dlq'&&j.poison){j.tries++;s.errors++;if(s.toggle&&j.tries>=3)s.rejected++;else s.jobs.unshift(j);}
  else {s.processed++;if(j.urgent)s.hits++;}
 }
 s.queue=s.jobs.length;
}
export function metricsExtra(s,id){const key=extraDefinitions[s.index-7].key;const pair=(a,b,v)=>[id?a:b,v];
 const base=[pair('Menunggu','Waiting',s.jobs.length),pair('Selesai','Completed',s.processed)];
 const extra={cache:[pair('Cache hit','Cache hits',s.hits),pair('Baca database','Database reads',s.reads)],limit:[pair('Token','Tokens',s.tokens.toFixed(1)),pair('Ditolak','Rejected',s.rejected)],retry:[pair('Percobaan','Attempts',s.attempts),pair('Gagal akhir','Exhausted',s.rejected)],dedup:[pair('Duplikat dicegah','Duplicates prevented',s.duplicate)],replica:[pair('Primary','Primary',s.version),pair('Replika','Replica',s.readVersion)],shard:s.bins.map((v,i)=>['Shard '+(i+1),v]),batch:[pair('Perjalanan','Round trips',s.rounds)],pool:[pair('Koneksi sibuk','Busy connections',s.active.length)],priority:[pair('Prioritas selesai','Priority completed',s.hits)],dlq:[pair('Retry','Retries',s.errors),pair('Dead letter','Dead letters',s.rejected)]};return [...base,...extra[key]];}
export function extraToggle(s,id){const key=extraDefinitions[s.index-7].key;const names={cache:['Cache','Cache'],limit:['Pembatas','Limiter'],retry:['Backoff','Backoff'],dedup:['Deduplikasi','Deduplication'],replica:['Jeda replika','Pause replica'],shard:['Hot key','Hot key'],batch:['Batch','Batch'],pool:['Pool','Pool'],priority:['Prioritas','Priority'],dlq:['Pisahkan rusak','Isolate poison']};return names[key][id?0:1]+(s.toggle?' · ON':' · OFF');}
export function drawExtra(c,s,w,h){
 const key=extraDefinitions[s.index-7].key;
 const labels={cache:['REQUEST','CACHE','DATABASE'],limit:['REQUEST','TOKEN','ACCEPT'],retry:['REQUEST','RETRY','SERVICE'],dedup:['REQUEST','KEY','WRITE'],replica:['WRITE','PRIMARY','REPLICA'],shard:['KEY','HASH','SHARDS'],batch:['JOBS','BATCH','STORE'],pool:['REQUEST','POOL','DATABASE'],priority:['JOBS','PRIORITY','WORKER'],dlq:['JOBS','RETRY ×3','DONE / DLQ']}[key];
 const xs=[85,w/2,w-85];c.font='14px monospace';c.textAlign='center';
 xs.forEach((x,i)=>{if(i<2){c.strokeStyle='#315b78';c.beginPath();c.moveTo(x+48,85);c.lineTo(xs[i+1]-48,85);c.stroke();}c.fillStyle=i===1&&s.toggle?'#175e48':'#102e45';c.fillRect(x-48,58,96,54);c.fillStyle='#d8edf7';c.fillText(labels[i],x,90);});
 // Packets move only while actual work is pending; caller freezes travel for reduced motion.
 const count=Math.min(12,s.jobs.length+s.active.length);for(let i=0;i<count;i++){const f=(s.time*.5+i/12)%1;c.fillStyle='#f5c451';c.beginPath();c.arc(133+f*(w-266),85,4,0,7);c.fill();}
 const values=key==='shard'?s.bins.slice(0,s.params.shards):key==='replica'?[s.version,s.readVersion]:[s.jobs.length,s.processed,key==='cache'?s.hits:s.rejected];
 const names=key==='shard'?values.map((_,i)=>'S'+(i+1)):key==='replica'?['PRIMARY','REPLICA']:['WAIT','DONE',key==='cache'?'HIT':'REJECT'];
 const max=Math.max(1,...values);values.forEach((v,i)=>{const x=35+i*(w-70)/values.length;c.fillStyle=['#55aaff','#37d49a','#ffc34f','#ec6570'][i%4];c.fillRect(x,218-v/max*75,(w-90)/values.length-12,v/max*75);c.fillStyle='#c5d9e4';c.fillText(names[i]+' '+v,x+((w-90)/values.length-12)/2,242);});
}
