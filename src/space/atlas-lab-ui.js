import {extraToggle,drawExtra} from './atlas-extra.js';
import {labGoals,controlHelp,toggleLabel,labFeedback} from './atlas-guidance.js';
import {statusColors,statusNames,serverStatus} from './atlas-status.js';
import { labDefinitions,labAction,labToggle,replayProjection,labMetrics,createLabState,stepLab } from './atlas-simulation.js';
import './atlas.css';

export function createLabConsole(world,focusRig){
 const panel=document.createElement('section');panel.className='atlas-lab-console';panel.id='atlas-lab-console';panel.hidden=true;panel.setAttribute('aria-label','Atlas backend playground');document.body.append(panel);
 const toggle=document.createElement('button');toggle.className='lab-controls-toggle';toggle.textContent='☰ Atlas menu';toggle.setAttribute('aria-controls',panel.id);document.body.append(toggle);toggle.onclick=()=>{world.lab.controlsOpen=!world.lab.controlsOpen;};
 const preview=document.createElement('aside');preview.className='atlas-hover-preview';preview.hidden=true;preview.setAttribute('aria-label','Diagram preview');const previewTitle=document.createElement('span');preview.append(previewTitle);const previewCanvas=document.createElement('canvas');previewCanvas.width=640;previewCanvas.height=260;preview.append(previewCanvas);document.body.append(preview);
 let diagram=null,charts=[],histories=new Map(),chartTime=0;
 let signature='',metricTime=0;let metricNodes=[],status=null,serverNodes=[];
 const state=()=>world.lab.states[world.lab.selected];
 function render(){
  const id=world.language==='id',n=world.lab.selected,def=labDefinitions[n];const next=[id,n].join();if(signature===next)return;signature=next;
  panel.replaceChildren();
  const el=(tag,text,parent=panel)=>{const node=document.createElement(tag);if(text)node.textContent=text;parent.append(node);return node;};
  const header=el('div','');header.className='lab-console-header';el('span','ATLAS / LIVE LAB',header);const pause=el('button',world.lab.paused?(id?'▶ Lanjut':'▶ Resume'):(id?'Ⅱ Jeda':'Ⅱ Pause'),header);pause.dataset.action='pause';pause.onclick=()=>{world.lab.paused=!world.lab.paused;pause.textContent=world.lab.paused?(id?'▶ Lanjut':'▶ Resume'):(id?'Ⅱ Jeda':'Ⅱ Pause');pause.setAttribute('aria-pressed',String(world.lab.paused));};pause.setAttribute('aria-pressed',String(world.lab.paused));
  const close=el('button','✕',header);close.ariaLabel=id?'Tutup kontrol':'Close controls';close.onclick=()=>{world.lab.controlsOpen=false;window.dispatchEvent(new Event('close-atlas-controls'));};
  const legend=el('div','');legend.className='lab-legend';Object.entries(statusColors).forEach(([key,color])=>{const label=el('span',({id:{idle:'Idle',healthy:'Aktif',warning:'Tertunda',down:'Gagal'},en:{idle:'Idle',healthy:'Active',warning:'Delayed',down:'Failed'}})[id?'id':'en'][key],legend);label.style.setProperty('--status','#'+color.toString(16).padStart(6,'0'));});
  serverNodes=[];
  const nav=el('details','');nav.className='lab-catalog';
  el('summary',(id?'Eksperimen':'Experiments')+' · '+(n+1)+' / '+labDefinitions.length,nav);
  const stations=el('div','',nav);stations.className='lab-stations';
  labDefinitions.forEach((d,i)=>{const b=el('button',d.name[id?0:1],stations);b.title=d.hint[id?0:1];b.setAttribute('aria-pressed',String(i===n));b.dataset.rig=i;b.onclick=()=>{world.lab.selected=i;signature='';render();if(i<7)focusRig(i);};});
  el('small',def.tag);el('h2',def.name[id?0:1]);
  diagram=el('canvas','');diagram.width=640;diagram.height=260;diagram.className='lab-diagram';diagram.setAttribute('role','img');diagram.setAttribute('aria-label',def.name[id?0:1]);
  const help=el('details','');help.className='lab-explanation';el('summary',id?'Cara kerja':'How it works',help);el('p',labGoals[n]?.[id?0:1]||def.hint[id?0:1],help);
  status=el('p',n>=7?def.hint[id?0:1]:labFeedback(state(),id));status.hidden=n>=7;status.className='lab-status';status.setAttribute('role','status');
  const form=el('div','');form.className='lab-parameters';const advanced=el('details','');advanced.className='lab-advanced';el('summary',id?'Pengaturan lanjutan':'Advanced settings',advanced);const advancedForm=el('div','',advanced);advancedForm.className='lab-parameters';
  const select=(parent,labelText,key,options,current,change)=>{const label=el('label','',parent);el('span',labelText,label);const input=el('select','',label);input.dataset.param=key;for(const [value,text] of options){const option=el('option',text,input);option.value=value;}input.value=current;input.onchange=()=>change(input.value);return input;};
  if(n===1){
   const explain=()=>({
    'round-robin':['Mengirim request secara bergiliran. Tidak memperhitungkan perbedaan kecepatan server.','Sends requests in turn without accounting for different server speeds.'],
    'least-load':['Memilih server dengan estimasi sisa pekerjaan paling sedikit.','Chooses the server with the least estimated remaining work.'],
    single:['Menumpuk request di satu server sementara server lain menganggur. Ini contoh desain buruk.','Piles requests onto one server while others sit idle. This is a bad design example.'],
   }[state().algorithm][id?0:1]);
   select(form,id?'Cara membagi pengunjung':'How to distribute visitors','algorithm',[['round-robin','Round robin · '+(id?'bergiliran':'take turns')],['least-load',id?'Beban paling ringan':'Least remaining workload'],['single',id?'Satu server saja (contoh buruk)':'One server only (bad example)']],state().algorithm,value=>{state().algorithm=value;algorithmHelp.textContent=explain();});
   const algorithmHelp=el('small',explain(),form);algorithmHelp.className='lab-help';
   select(advancedForm,id?'Kecepatan server':'Server speeds','profile',[['uniform',id?'Semua sama cepat':'All equally fast'],['mixed',id?'Server 1 lebih lambat':'Server 1 is slower']],state().profile,value=>state().profile=value);
   el('p',id?'Aturan model: antrean >8 selama 3 detik memicu restart perlindungan selama 5 detik. Overload di sistem nyata tidak selalu menyebabkan server down.':'Model rule: a queue above 8 for 3 seconds triggers a 5-second protective restart. Real overload does not always bring a server down.',advanced).className='lab-help';
  }
  if(n===4)select(form,id?'Kondisi layanan luar':'External service condition','service',[['0',id?'Normal':'Healthy'],['50',id?'Gangguan sesekali':'Intermittent faults'],['100',id?'Tidak tersedia':'Unavailable']],String(state().params.failure),value=>{state().params.failure=Number(value);});
  if(n===5)select(advancedForm,id?'Kandidat rilis':'Release candidate','candidate',[['0',id?'Tanpa cacat dalam model':'No defects in model'],['30',id?'Memiliki bug':'Contains bugs'],['100',id?'Selalu gagal':'Always fails']],String(state().params.defect),value=>state().params.defect=Number(value));
  def.params.forEach(([key,local,english,min,max,initial,unit])=>{
   if(key==='failure'||key==='defect')return;const extra=['latency','rate','delay','coupling'].includes(key);const label=el('label','',extra?advancedForm:form);const row=el('span','',label);el('span',id?local:english,row);const value=el('output',state().params[key]+unit,row);value.htmlFor='lab-param-'+key;
   const input=el('input','',label);input.id='lab-param-'+key;input.type='range';input.min=min;input.max=max;input.step=key==='latency'||key==='delay'?50:key==='rows'?100:1;input.value=state().params[key];input.dataset.param=key;
   input.oninput=()=>{state().params[key]=Number(input.value);value.textContent=input.value+unit;if(n===3){state().running=false;state().progress=0;state().checks=0;}};if(controlHelp[key])input.title=controlHelp[key][id?0:1];
  });
  advanced.hidden=advancedForm.childElementCount===0&&advanced.querySelectorAll('p').length===0;
  const actions=el('div','');actions.className='lab-actions';
  const runLabels=[['Ubah aturan','Change rule'],['Lonjakan','Traffic spike'],['+30 event','+30 events'],['Cari','Search'],['Pulihkan','Recover'],['Luncurkan','Deploy'],['Simpan','Write']];
  const run=el('button','▶ '+(runLabels[n]?.[id?0:1]||def.action[id?0:1]),actions);run.dataset.action='run';run.onclick=()=>{labAction(state());if(n===4)panel.querySelector('[data-param="service"]').value='0';if(n===5)updateToggle();announce(id?'Eksperimen dijalankan.':'Experiment triggered.');};
  let toggle=null;
  function updateToggle(){if(toggle){toggle.textContent=(n>=7?extraToggle(state(),id):toggleLabel(state(),id));if(n!==5)toggle.setAttribute('aria-pressed',String(state().toggle));else toggle.disabled=!state().deployed;}}
  if(def.toggle){toggle=el('button',def.toggle[id?0:1],actions);toggle.dataset.action='toggle';updateToggle();toggle.onclick=()=>{labToggle(state());if(n===5){state().toggle=true;state().deployed=false;}updateToggle();announce(id?'Konfigurasi diperbarui.':'Configuration updated.');};}
  if(n===6){const replay=el('button',id?'Replay proyeksi':'Replay projection',actions);replay.dataset.action='replay';replay.onclick=()=>{replayProjection(state());announce(id?'Proyeksi dibangun ulang dari event.':'Projection rebuilding from events.');};}
  el('small',id?'TREN · 60 SAMPEL · skala per grafik':'TREND · 60 SAMPLES · scale per chart');
  const grid=el('dl','');grid.className='lab-metrics';charts=[];
  metricNodes=labMetrics(state(),id).map(([label,value],i)=>{const cell=el('div','',grid);el('dt',label,cell);const dd=el('dd',String(value),cell);
   if(Number.isFinite(parseFloat(value))){const canvas=el('canvas','',cell);canvas.width=280;canvas.height=64;canvas.className='lab-trend';canvas.setAttribute('role','img');charts.push({canvas,index:i,label});}
   return dd;});
  if(n===1){const details=el('details','');details.className='lab-server-diagnostics';el('summary',id?'Lihat status tiap server':'Inspect individual servers',details);const list=el('div','',details);list.className='lab-server-list';for(let i=0;i<8;i++)serverNodes.push(el('span','S'+(i+1),list));}
  const tools=el('div','');tools.className='lab-tools';
  const step=el('button','+1s',tools);step.dataset.action='step';step.onclick=()=>{for(let i=0;i<20;i++)stepLab(state(),.05);announce(id?'Model maju satu detik.':'Model advanced one second.');};
  const reset=el('button','↺ Reset',tools);reset.dataset.action='reset';reset.onclick=()=>{world.lab.states[n]=createLabState(n);histories.delete(n);signature='';render();panel.querySelector('[data-action="reset"]').focus({preventScroll:true});};
  const read=el('button',id?'Catatan ↗':'Notes ↗',tools);read.hidden=n>=7;read.dataset.action='read';read.onclick=()=>{world.universe.release();world.universe.sit(world.interactables[n]);window.dispatchEvent(new Event('chronos-reading'));};
  el('small',id?'MODEL EDUKASI · Angka simulasi, bukan benchmark produksi.':'TEACHING MODEL · Simulated values, not production benchmarks.').className='lab-disclaimer';
 }
 function announce(message){if(status)status.textContent=message;}
 function update(dt){
  const visible=world.universe.world===world&&world.universe.mode==='world'&&!world.universe.suspended&&!world.universe.seated;const wanted=world.universe.mobileOrbit?document.body.classList.contains('mobile-detail-open'):world.lab.controlsOpen;panel.hidden=!visible||!wanted;toggle.hidden=!visible||world.universe.mobileOrbit;toggle.textContent=world.language==='id'?'☰ Menu Atlas':'☰ Atlas menu';toggle.setAttribute('aria-expanded',String(!!wanted));
  const hovered=world.lab.hovered;preview.hidden=!visible||world.universe.mobileOrbit||wanted||hovered===null||hovered===undefined;if(!preview.hidden){previewTitle.textContent=labDefinitions[hovered].name[world.language==='id'?0:1];drawLabDiagram(previewCanvas,world.lab.states[hovered],world.universe.motion&&!world.lab.paused);}
  if(!visible||!wanted)return;
  render();if(diagram)drawLabDiagram(diagram,state(),world.universe.motion&&!world.lab.paused);metricTime+=dt||.016;if(metricTime<.1)return;metricTime=0;
  const s=state(),id=world.language==='id';serverNodes.forEach((node,i)=>{const key=serverStatus(s,i);node.textContent='S'+(i+1)+' · '+(key==='down'?(id?'Restart akibat overload':'Restarting after overload'):statusNames[id?'id':'en'][key]);node.style.borderColor='#'+statusColors[key].toString(16).padStart(6,'0');});labMetrics(s,id).forEach(([,value],i)=>{if(metricNodes[i])metricNodes[i].textContent=String(value);});
  chartTime+=.1;
  let history=histories.get(s.index);if(!history){history=labMetrics(s,id).map(()=>[]);histories.set(s.index,history);}
  if(chartTime>=.5){chartTime=0;labMetrics(s,id).forEach(([,value],i)=>{history[i].push(parseFloat(value));if(history[i].length>60)history[i].shift();});}
  charts.forEach(({canvas,index,label})=>{const points=history[index].filter(Number.isFinite),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,max=Math.max(1,...points);c.clearRect(0,0,w,h);c.strokeStyle='#234357';c.beginPath();c.moveTo(0,h-8);c.lineTo(w,h-8);c.stroke();c.strokeStyle='#55b4ff';c.fillStyle='#55b4ff';c.lineWidth=3;c.beginPath();points.forEach((v,i)=>{const x=i/59*(w-4)+2,y=h-8-v/max*(h-14);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();c.fillStyle='#95b8cf';c.font='10px monospace';c.textAlign='right';c.fillText('max '+max,w-3,11);c.fillStyle='#55b4ff';if(points.length){c.beginPath();c.arc((points.length-1)/59*(w-4)+2,h-8-points.at(-1)/max*(h-14),3,0,7);c.fill();}canvas.setAttribute('aria-label',label+': '+points.at(-1)+' · '+(id?'maximum':'maximum')+' '+max);});
  const feedback=s.index>=7?labDefinitions[s.index].hint[id?0:1]:labFeedback(s,id);if(status&&status.textContent!==feedback)status.textContent=feedback;


 }
 window.addEventListener('atlas-experiment',()=>{signature='';});
 window.addEventListener('hashchange',()=>{panel.hidden=true;preview.hidden=true;toggle.hidden=true;});
 return {update,panel};
}

export function drawLabDiagram(canvas,s,motion){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=motion?s.time:1;c.clearRect(0,0,w,h);
 c.fillStyle='#07161f';c.fillRect(0,0,w,h);c.strokeStyle='#183642';c.lineWidth=1;for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
 if(s.index>=7){drawExtra(c,motion?s:{...s,time:1},w,h);return;}
 const cyan='#53e59b',amber='#ffce55',red='#ff5965',dim='#f1f5f9';
 function line(x,y,a,b,color=dim){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();}
 function node(x,y,label,color=cyan,r=24){c.fillStyle='#112936';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=color;c.font='15px monospace';c.textAlign='center';c.fillText(label,x,y+5);}
 function text(x,y,label,color=cyan){c.fillStyle=color;c.font='16px monospace';c.textAlign='center';c.fillText(label,x,y);}
 function packet(x,y,color=amber){c.shadowBlur=12;c.shadowColor=color;c.fillStyle=color;c.beginPath();c.arc(x,y,5,0,7);c.fill();c.shadowBlur=0;}
 if(s.index===0){const affected=Number(labMetrics(s)[0][1]);for(let i=0;i<6;i++){const a=i*Math.PI/3,x=320+Math.cos(a)*170,y=130+Math.sin(a)*85;line(320,130,x,y,i<affected?amber:dim);node(x,y,'D'+(i+1),i<affected?amber:dim,20);if(s.pulses.length&&i<affected){const f=Math.min(1,s.pulses[0].age/1.5);packet(320+(x-320)*f,130+(y-130)*f);}}node(320,130,'RULE',cyan,30);}
 if(s.index===1){node(65,130,'LB');node(570,130,'OUT');for(let i=0;i<8;i++){const y=25+i*29,color='#'+statusColors[serverStatus(s,i)].toString(16).padStart(6,'0');c.setLineDash(serverStatus(s,i)==='down'?[4,5]:[]);line(90,130,320,y,color);line(347,y,545,130,color);c.setLineDash([]);node(334,y,'S'+(i+1),color,12);const job=s.active.find(j=>j.worker===i);if(job){const f=1-job.left/job.total;packet(100+f*225,130+(y-130)*f,color);}}text(160,245,'QUEUE '+Math.floor(s.queue),s.queue>5?amber:cyan);}

 if(s.index===2){node(65,130,'P');line(90,130,195,130);c.strokeStyle=cyan;c.strokeRect(200,35,220,185);const height=Math.min(170,s.queue/200*170);c.fillStyle='#61d9d333';c.fillRect(205,215-height,210,height);for(let i=0;i<Math.min(60,Math.floor(s.queue));i++)packet(218+(i%10)*20,205-Math.floor(i/10)*24,amber);for(let i=0;i<s.params.consumers;i++){const y=35+i*185/Math.max(1,s.params.consumers-1);line(420,130,550,y,s.toggle?red:dim);node(570,y,'C',s.toggle?red:cyan,15);}text(310,244,'BUFFER '+Math.floor(s.queue));}
 if(s.index===3){const count=60,visited=s.toggle?Math.ceil(s.progress*7):Math.ceil(s.progress*count);for(let i=0;i<count;i++){const x=45+(i%15)*38,y=65+Math.floor(i/15)*38;c.fillStyle=i<visited?cyan:'#22404c';c.fillRect(x,y,25,23);}if(s.toggle){line(60,30,580,30,amber);for(let i=0;i<7;i++)packet(60+i*86,30,i<visited?amber:dim);}text(320,245,(s.toggle?'INDEX SEEK':'SEQUENTIAL SCAN')+' / '+Math.ceil(s.checks));}
 if(s.index===4){node(80,130,'APP');node(320,130,s.toggle?'CB':'OFF',s.breaker==='open'?red:cyan,32);node(560,130,'DEP',s.params.failure>50?red:cyan);line(105,130,285,130);line(355,130,535,130,s.breaker==='open'?red:cyan);if(s.breaker==='open'){line(430,100,455,160,red);line(455,100,430,160,red);}else packet(110+(t%1)*420,130);text(320,225,s.toggle?s.breaker.toUpperCase():'BREAKER DISABLED',amber);}
 if(s.index===5){node(65,130,'LB');const share=s.deployed?s.params.canary:0;line(90,130,420,65,cyan);line(90,130,420,190,share?amber:dim);node(465,65,'v1',cyan,32);node(465,190,'v2',share?amber:dim,32);text(560,70,(100-share)+'%',cyan);text(560,195,share+'%',amber);for(let i=0;i<10;i++){const f=(t*.4+i*.1)%1,y=i<share/10?190:65;packet(95+f*330,130+(y-130)*f,i<share/10?amber:cyan);}}
 if(s.index===6){node(80,130,'WRITE',cyan,34);node(550,130,'READ',s.version===s.readVersion?cyan:amber,34);line(115,130,515,130);s.events.slice(0,16).forEach((event,i)=>packet(180+i*19,130,amber));text(80,205,'v'+s.version);text(550,205,'v'+s.readVersion);text(320,70,s.toggle?'PROJECTION PAUSED':'EVENT LOG',amber);}
}
