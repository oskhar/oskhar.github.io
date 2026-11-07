import { labDefinitions,labAction,labToggle,replayProjection,labMetrics,createLabState,stepLab } from './atlas-simulation.js';
import './atlas.css';

export function createLabConsole(world,focusRig){
 const panel=document.createElement('section');panel.className='atlas-lab-console';panel.hidden=true;panel.setAttribute('aria-label','Atlas backend playground');document.body.append(panel);
 let signature='',metricTime=0,lastAnnouncement='';let chart=null,metricNodes=[],status=null;
 const state=()=>world.lab.states[world.lab.selected];
 function render(){
  const id=world.language==='id',n=world.lab.selected,def=labDefinitions[n];const next=[id,n].join();if(signature===next)return;signature=next;
  panel.replaceChildren();
  const el=(tag,text,parent=panel)=>{const node=document.createElement(tag);if(text)node.textContent=text;parent.append(node);return node;};
  const header=el('div','');header.className='lab-console-header';el('span','ATLAS / LIVE LAB',header);const pause=el('button',world.lab.paused?(id?'Lanjut':'Resume'):(id?'Jeda':'Pause'),header);pause.dataset.action='pause';pause.onclick=()=>{world.lab.paused=!world.lab.paused;pause.textContent=world.lab.paused?(id?'Lanjut':'Resume'):(id?'Jeda':'Pause');pause.setAttribute('aria-pressed',String(world.lab.paused));};pause.setAttribute('aria-pressed',String(world.lab.paused));
  const nav=el('div','');nav.className='lab-stations';nav.setAttribute('aria-label',id?'Wahana eksperimen':'Experiment rigs');
  labDefinitions.forEach((d,i)=>{const b=el('button',String(i+1).padStart(2,'0'),nav);b.ariaLabel=d.name[id?0:1];b.title=d.name[id?0:1];b.setAttribute('aria-pressed',String(i===n));b.dataset.rig=i;b.onclick=()=>{world.lab.selected=i;signature='';render();panel.querySelector(`[data-rig="${i}"]`).focus({preventScroll:true});focusRig(i);};});
  el('small',def.tag);el('h2',def.name[id?0:1]);el('p',def.hint[id?0:1]).className='lab-hint';
  chart=el('canvas','');chart.width=640;chart.height=260;chart.className='lab-diagram';chart.setAttribute('role','img');chart.ariaLabel=id?'Diagram langsung; hasil tersedia sebagai teks di bawah.':'Live diagram; results also available as text below.';
  const form=el('div','');form.className='lab-parameters';
  def.params.forEach(([key,local,english,min,max,initial,unit])=>{
   const label=el('label','',form);const row=el('span','',label);el('span',id?local:english,row);const value=el('output',state().params[key]+unit,row);value.htmlFor='lab-param-'+key;
   const input=el('input','',label);input.id='lab-param-'+key;input.type='range';input.min=min;input.max=max;input.step=key==='latency'||key==='delay'?50:key==='rows'?100:1;input.value=state().params[key];input.dataset.param=key;
   input.oninput=()=>{state().params[key]=Number(input.value);value.textContent=input.value+unit;};
  });
  const actions=el('div','');actions.className='lab-actions';
  const run=el('button',def.action[id?0:1],actions);run.dataset.action='run';run.onclick=()=>{labAction(state());if(n===4){const input=panel.querySelector('[data-param="failure"]');input.value=0;input.previousElementSibling.querySelector('output').textContent='0%';}if(n===5)updateToggle();announce(id?'Eksperimen dijalankan.':'Experiment triggered.');};
  let toggle=null;
  function updateToggle(){if(toggle)toggle.setAttribute('aria-pressed',String(state().toggle));}
  if(def.toggle){toggle=el('button',def.toggle[id?0:1],actions);toggle.dataset.action='toggle';updateToggle();toggle.onclick=()=>{labToggle(state());if(n===5){state().toggle=true;state().deployed=false;}updateToggle();announce(id?'Konfigurasi diperbarui.':'Configuration updated.');};}
  if(n===6){const replay=el('button',id?'Replay proyeksi':'Replay projection',actions);replay.dataset.action='replay';replay.onclick=()=>{replayProjection(state());announce(id?'Proyeksi dibangun ulang dari event.':'Projection rebuilding from events.');};}
  const grid=el('dl','');grid.className='lab-metrics';metricNodes=labMetrics(state(),id).map(([label,value])=>{const cell=el('div','',grid);el('dt',label,cell);return el('dd',String(value),cell);});
  status=el('p','');status.className='lab-status';status.setAttribute('role','status');status.textContent=id?'Ubah parameter dan amati perangkat di ruang laboratorium.':'Change parameters and watch the apparatus in the laboratory.';
  const tools=el('div','');tools.className='lab-tools';
  const step=el('button',id?'+1 detik simulasi':'+1 simulation second',tools);step.dataset.action='step';step.onclick=()=>{for(let i=0;i<20;i++)stepLab(state(),.05);announce(id?'Model maju satu detik.':'Model advanced one second.');};
  const reset=el('button',id?'Reset wahana':'Reset rig',tools);reset.dataset.action='reset';reset.onclick=()=>{world.lab.states[n]=createLabState(n);signature='';render();panel.querySelector('[data-action="reset"]').focus({preventScroll:true});};
  const read=el('button',id?'Catatan engineer ↗':'Engineer notes ↗',tools);read.dataset.action='read';read.onclick=()=>{world.universe.release();world.universe.sit(world.interactables[n]);window.dispatchEvent(new Event('chronos-reading'));};
  el('small',id?'MODEL EDUKASI · Angka simulasi, bukan benchmark produksi.':'TEACHING MODEL · Simulated values, not production benchmarks.').className='lab-disclaimer';
 }
 function announce(message){if(status)status.textContent=message;}
 function update(dt){
  const visible=world.universe.world===world&&world.universe.mode==='world'&&!world.universe.suspended&&!world.universe.seated;panel.hidden=!visible;if(!visible)return;
  render();metricTime+=dt||.016;if(metricTime<.1)return;metricTime=0;
  const s=state(),id=world.language==='id';labMetrics(s,id).forEach(([,value],i)=>{if(metricNodes[i])metricNodes[i].textContent=String(value);});
  const result=s.index===3?(s.running?'query-running':s.progress===1?'query-complete':'idle'):s.index===4?s.breaker:s.index===6?s.events.length?'projecting':'synced':'';
  if(result&&lastAnnouncement!==s.index+result){lastAnnouncement=s.index+result;const messages={
   'query-running':id?'Query sedang memeriksa data.':'Query scanning data.', 'query-complete':id?'Query selesai. Bandingkan jumlah pemeriksaan dengan mengubah indeks.':'Query complete. Toggle the index and compare check counts.',
   open:id?'Circuit terbuka. Percobaan ditahan selama cooldown.':'Circuit open. Attempts held during cooldown.', 'half-open':id?'Circuit menguji pemulihan dependensi.':'Circuit probing dependency recovery.', closed:id?'Circuit tertutup. Request dapat diteruskan.':'Circuit closed. Requests can proceed.',
   projecting:id?'Read model tertinggal. Event menunggu proyeksi.':'Read model behind. Events awaiting projection.',synced:id?'Read model sudah selaras dengan sumber.':'Read model is synchronized with the source.'};announce(messages[result]||'');}
  if(chart)drawLabDiagram(chart,s,world.universe.motion&&!world.lab.paused);
 }
 window.addEventListener('hashchange',()=>{panel.hidden=true;});
 return {update,panel};
}

export function drawLabDiagram(canvas,s,motion){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=motion?s.time:1;c.clearRect(0,0,w,h);
 c.fillStyle='#07161f';c.fillRect(0,0,w,h);c.strokeStyle='#183642';c.lineWidth=1;for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
 const cyan='#78ece0',amber='#f4c486',red='#f69996',dim='#365764';
 function line(x,y,a,b,color=dim){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
 function node(x,y,label,color=cyan,r=24){c.fillStyle='#112936';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=color;c.font='15px monospace';c.textAlign='center';c.fillText(label,x,y+5);}
 function text(x,y,label,color=cyan){c.fillStyle=color;c.font='16px monospace';c.textAlign='center';c.fillText(label,x,y);}
 function packet(x,y,color=amber){c.shadowBlur=12;c.shadowColor=color;c.fillStyle=color;c.beginPath();c.arc(x,y,5,0,7);c.fill();c.shadowBlur=0;}
 if(s.index===0){const affected=Number(labMetrics(s)[0][1]);for(let i=0;i<6;i++){const a=i*Math.PI/3,x=320+Math.cos(a)*170,y=130+Math.sin(a)*85;line(320,130,x,y,i<affected?amber:dim);node(x,y,'D'+(i+1),i<affected?amber:dim,20);if(s.pulses.length&&i<affected){const f=Math.min(1,s.pulses[0].age/1.5);packet(320+(x-320)*f,130+(y-130)*f);}}node(320,130,'RULE',cyan,30);}
 if(s.index===1){node(65,130,'IN');node(570,130,'OUT');const n=s.params.workers;for(let i=0;i<n;i++){const y=35+i*190/Math.max(n-1,1);line(90,130,320,y);line(344,y,545,130);node(332,y,'W'+(i+1),i<s.active.length?cyan:dim,17);if(i<s.active.length){const f=1-s.active[i].left/s.active[i].total;packet(100+f*440,130+Math.sin(f*Math.PI)*(y-130));}}text(160,235,'QUEUE '+Math.floor(s.queue),s.queue>10?amber:cyan);}
 if(s.index===2){node(65,130,'P');line(90,130,195,130);c.strokeStyle=cyan;c.strokeRect(200,35,220,185);const height=Math.min(170,s.queue/200*170);c.fillStyle='#61d9d333';c.fillRect(205,215-height,210,height);for(let i=0;i<Math.min(60,Math.floor(s.queue));i++)packet(218+(i%10)*20,205-Math.floor(i/10)*24,amber);for(let i=0;i<s.params.consumers;i++){const y=35+i*185/Math.max(1,s.params.consumers-1);line(420,130,550,y,s.toggle?red:dim);node(570,y,'C',s.toggle?red:cyan,15);}text(310,244,'BUFFER '+Math.floor(s.queue));}
 if(s.index===3){const count=60,visited=s.toggle?Math.ceil(s.progress*7):Math.ceil(s.progress*count);for(let i=0;i<count;i++){const x=45+(i%15)*38,y=65+Math.floor(i/15)*38;c.fillStyle=i<visited?cyan:'#22404c';c.fillRect(x,y,25,23);}if(s.toggle){line(60,30,580,30,amber);for(let i=0;i<7;i++)packet(60+i*86,30,i<visited?amber:dim);}text(320,245,(s.toggle?'INDEX SEEK':'SEQUENTIAL SCAN')+' / '+Math.ceil(s.checks));}
 if(s.index===4){node(80,130,'APP');node(320,130,s.toggle?'CB':'OFF',s.breaker==='open'?red:cyan,32);node(560,130,'DEP',s.params.failure>50?red:cyan);line(105,130,285,130);line(355,130,535,130,s.breaker==='open'?red:cyan);if(s.breaker==='open'){line(430,100,455,160,red);line(455,100,430,160,red);}else packet(110+(t%1)*420,130);text(320,225,s.toggle?s.breaker.toUpperCase():'BREAKER DISABLED',amber);}
 if(s.index===5){node(65,130,'LB');const share=s.deployed?s.params.canary:0;line(90,130,420,65,cyan);line(90,130,420,190,share?amber:dim);node(465,65,'v1',cyan,32);node(465,190,'v2',share?amber:dim,32);text(560,70,(100-share)+'%',cyan);text(560,195,share+'%',amber);for(let i=0;i<10;i++){const f=(t*.4+i*.1)%1,y=i<share/10?190:65;packet(95+f*330,130+(y-130)*f,i<share/10?amber:cyan);}}
 if(s.index===6){node(80,130,'WRITE',cyan,34);node(550,130,'READ',s.version===s.readVersion?cyan:amber,34);line(115,130,515,130);s.events.slice(0,16).forEach((event,i)=>packet(180+i*19,130,amber));text(80,205,'v'+s.version);text(550,205,'v'+s.readVersion);text(320,70,s.toggle?'PROJECTION PAUSED':'EVENT LOG',amber);}
}
