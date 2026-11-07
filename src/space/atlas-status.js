export const statusColors={idle:0xf1f5f9,healthy:0x53e59b,warning:0xffce55,down:0xff5965};
export const statusNames={id:{idle:'Idle / tanpa traffic',healthy:'Sehat / diproses',warning:'Beban tinggi / tertunda',down:'Down / gagal'},en:{idle:'Idle / no traffic',healthy:'Healthy / processing',warning:'High load / delayed',down:'Down / failed'}};
export function serverStatus(s,i){
 if(i>=s.params.workers)return 'idle';
 if(i>=Math.max(0,s.params.workers-s.params.down))return 'down';
 const job=s.active.find(j=>j.worker===i);if(!job)return 'idle';
 const count=Math.max(1,s.params.workers-s.params.down),load=s.params.arrival*s.params.latency/1000;
 const utilization=!s.toggle&&s.params.skew>50&&i===0?load:load/count;
 return utilization>=.85||s.queue>5?'warning':'healthy';
}
export function rigStatus(s){switch(s.index){
 case 0:return !s.changed?'idle':!s.toggle&&s.params.coupling>50?'warning':'healthy';
 case 1:return s.params.down>=s.params.workers?'down':s.queue>5?'warning':s.active.length?'healthy':'idle';
 case 2:return s.queue>=199?'down':s.toggle||s.params.producer>s.params.consumers*s.params.rate?'warning':s.queue>0||s.processed?'healthy':'idle';
 case 3:return s.running?(s.toggle?'healthy':'warning'):s.progress===1?'healthy':'idle';
 case 4:return s.params.failure===100||s.toggle&&s.breaker==='open'?'down':s.params.failure>0?'warning':s.attempts?'healthy':'idle';
 case 5:return !s.deployed?'idle':s.params.defect>=80&&s.params.canary>0?'down':s.params.defect>0&&s.params.canary>0?'warning':'healthy';
 default:return s.toggle&&s.events.length?'warning':s.events.length?'warning':s.version?'healthy':'idle';
}}
