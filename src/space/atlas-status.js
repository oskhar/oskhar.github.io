export const statusColors={idle:0xf1f5f9,healthy:0x53e59b,warning:0xffce55,down:0xff5965};
export const statusNames={id:{idle:'Idle / tanpa traffic',healthy:'Sehat / diproses',warning:'Beban tinggi / tertunda',down:'Down / gagal'},en:{idle:'Idle / no traffic',healthy:'Healthy / processing',warning:'High load / delayed',down:'Down / failed'}};
export function serverStatus(s,i){
 if(i>=s.params.workers)return 'idle';
 const server=s.servers[i];if(server.downUntil>s.time)return 'down';
 const busy=s.active.some(j=>j.worker===i);if(!busy&&!server.queue)return 'idle';
 return server.queue>2||server.heat>0?'warning':'healthy';
}
export function rigStatus(s){switch(s.index){
 case 0:return !s.changed?'idle':!s.toggle&&s.params.coupling>50?'warning':'healthy';
 case 1:return s.servers.slice(0,s.params.workers).every(server=>server.downUntil>s.time)?'down':s.queue>5||s.servers.slice(0,s.params.workers).some(server=>server.downUntil>s.time)?'warning':s.active.length?'healthy':'idle';
 case 2:return s.queue>=199?'down':s.toggle||s.queue>20||s.params.producer>s.params.consumers*s.params.rate?'warning':s.queue>0||s.processed?'healthy':'idle';
 case 3:return s.running?(s.toggle?'healthy':'warning'):s.progress===1?'healthy':'idle';
 case 4:return s.params.failure===100||s.toggle&&s.breaker==='open'?'down':s.params.failure>0?'warning':s.attempts?'healthy':'idle';
 case 5:return !s.deployed?'idle':s.params.defect>=80&&s.params.canary>0?'down':s.params.defect>0&&s.params.canary>0?'warning':'healthy';
 default:return s.toggle&&s.events.length?'warning':s.events.length?'warning':s.version?'healthy':'idle';
}}
