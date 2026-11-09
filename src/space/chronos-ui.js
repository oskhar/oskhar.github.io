import { biomes, puzzles, runes, createPuzzleState, trailPoints } from './chronos-model.js';
import './chronos.css';
export function createChronosUI(world){
 const u=world.universe,root=document.createElement('div');root.id='chronos-forest-ui';root.hidden=true;document.body.append(root);
 root.innerHTML=`<aside class="forest-hud"><small>CHRONOS / THE VIOLET WILDS</small><strong class="forest-heading"></strong><span class="forest-progress"></span><progress max="36" value="0" aria-label="Restored seals"></progress><span class="forest-bearing"></span><div class="forest-tools"><button data-action="map"></button><button data-action="checkpoint"></button></div></aside><div class="forest-toast" role="status" aria-live="polite" hidden></div><p class="forest-controls"></p><div class="forest-touch"><button data-hold="ShiftLeft">⇧</button><button data-hold="Space">↟</button></div><div class="forest-overlay" hidden><section class="forest-dialog" role="dialog" aria-modal="true" aria-labelledby="forest-dialog-title" tabindex="-1"><header><small>CHRONOS / FIELD JOURNAL</small><button data-action="close" aria-label="Close">✕</button></header><div class="forest-content"></div></section></div>`;
 const $=s=>root.querySelector(s),id=()=>world.language==='id',l=()=>world.language;let modal='',selected=0,rememberUntil=0,revealed=false,showHint=false,lastFocus=null,lastLang=l(),lastMessage='';
 const active=()=>u.world===world&&u.mode==='world'&&!u.suspended;
 function close(){modal='';world.mapOpen=false;$('.forest-overlay').hidden=true;u.keys.clear();u.stick={x:0,y:0};(lastFocus?.isConnected?lastFocus:u.canvas)?.focus?.({preventScroll:true});}
 function open(type){if(!active()||u.seated||!document.querySelector('#guide')?.hidden)return;lastFocus=document.activeElement;u.release();u.travel=null;u.stick={x:0,y:0};world.mapOpen=true;modal=type;$('.forest-overlay').hidden=false;render();$('.forest-dialog').focus();}
 function openPuzzle(n){const p=puzzles[n];if(!p||Math.hypot(u.camera.position.x-p.x,u.camera.position.z-p.z-2.7)>6)return;selected=n;world.selected=n;rememberUntil=0;revealed=false;showHint=false;open('puzzle');}
 function button(label,action,extra=''){return `<button data-action="${action}" ${extra}>${label}</button>`;}
 function render(){
  const content=$('.forest-content'),isID=id();
  if(modal==='map'){
   const point=(x,z)=>`${30+(x+330)/660*600},${30+(z+340)/395*360}`,pos=u.camera.position;
   content.innerHTML=`<h2 id="forest-dialog-title">${isID?'Atlas Hutan Ungu':'Violet Forest Atlas'}</h2><p>${isID?'36 segel tersebar di enam kawasan. Pilih tujuan, tutup peta, lalu ikuti kompas. Jembatan berada di tiga titik sungai.':'36 seals across six regions. Choose a destination, close the map and follow the compass. Three bridges cross the river.'}</p><svg class="forest-map" viewBox="0 0 660 420" role="img" aria-label="${isID?'Peta hutan, sungai, jembatan, dan teka-teki':'Forest map, river, bridges and puzzles'}"><rect x="20" y="20" width="620" height="380" rx="24" fill="#291737"/>${world.routes.map(r=>`<polyline points="${point(r.ax,r.az)} ${point(r.bx,r.bz)}" stroke="#81569e" stroke-width="2"/>`).join('')}<path d="M30 ${30+175/395*360}H630" stroke="#ad6cd4" stroke-width="8"/>${[-140,0,140].map(x=>{const [px,py]=point(x,-165).split(',');return `<path d="M${px} ${Number(py)-8}v16" stroke="#f4d4ff" stroke-width="6"/>`;}).join('')}${puzzles.map((p,n)=>`<circle cx="${point(p.x,p.z).split(',')[0]}" cy="${point(p.x,p.z).split(',')[1]}" r="${n===world.selected?6:3.5}" fill="${world.states[n].solved?'#f9dfb2':'#b386da'}"/>`).join('')}${biomes.map((b,n)=>{const [x,y]=point(b.x,b.z).split(',');return `<text x="${x}" y="${Number(y)-8}" fill="#f5d9ff" text-anchor="middle" font-size="11">0${n+1} ${b.name[l()]}</text>`;}).join('')}<text x="${point(0,-303).split(',')[0]}" y="${point(0,-303).split(',')[1]}" fill="#ffe1f8" text-anchor="middle" font-size="15">✦</text><circle cx="${point(pos.x,pos.z).split(',')[0]}" cy="${point(pos.x,pos.z).split(',')[1]}" r="5" fill="#fff" stroke="#d25fff" stroke-width="3"/><text x="30" y="410" fill="#f3caff" font-size="11">${isID?'● Putih: kamu · emas: selesai · ungu: segel':'● White: you · gold: restored · purple: seals'}</text></svg><div class="forest-regions">${biomes.map((b,n)=>`<details ${n===puzzles[world.selected].zone?'open':''}><summary>${b.name[l()]} · ${puzzles.filter(p=>p.zone===n&&world.solved.has(p.id)).length}/6</summary><div>${puzzles.map((p,i)=>p.zone===n?button(`${world.states[i].solved?'✓':'◇'} ${p.name[l()]}`,'target',`data-index="${i}" aria-pressed="${world.selected===i}"`):'').join('')}</div></details>`).join('')}</div><p>${isID?'Checkpoint aktif':'Active checkpoint'}: ${Math.round(world.checkpoint.x)}, ${Math.round(world.checkpoint.z)} · ${isID?'Progres segel tersimpan otomatis di perangkat ini.':'Seal progress saves automatically on this device.'}</p>`;
  }else if(modal==='puzzle'){
   const p=puzzles[selected],s=world.states[selected],memory=p.type==='memory',visible=performance.now()<rememberUntil;
   const intro={sequence:isID?'Baca prasasti lalu sentuh rune sesuai urutannya. Kesalahan mengulang urutan.':'Read the inscription and touch the runes in order. A mistake restarts the sequence.',riddle:p.riddle[isID?0:1],lights:isID?'Nyalakan kelima lentera. Setiap tombol membalik lentera itu dan tetangga langsungnya.':'Light all five lanterns. Each button flips itself and its immediate neighbours.',dial:isID?'Putar ketiga jam sampai sama dengan simbol pada prasasti.':'Turn all three clocks to match the inscription.',memory:isID?'Lihat kilatan rune selama 4 detik, hafalkan, lalu ulangi urutannya.':'Reveal the runes for 4 seconds, memorize them, then repeat the sequence.',trail:isID?'Ikuti lima lingkaran secara berurutan dalam 48 detik. Lari dengan Shift, lompat dengan Spasi. Hindari bola kabut yang bergerak.':'Follow five rings in order within 48 seconds. Shift to sprint, Space to jump. Avoid moving mist orbs.'};
   let controls='';
   if(p.type==='sequence'||memory){
    controls=`${!memory||visible?`<div class="forest-inscription" aria-label="Rune sequence">${p.sequence.map(v=>runes[v]).join(' → ')}</div>`:`<div class="forest-inscription">${revealed?'• '.repeat(p.sequence.length):'☾ · ✦ · ❀ · ◇'}</div>`}${memory?button(isID?'Lihat urutan (4 detik)':'Reveal sequence (4 seconds)','reveal',visible?'disabled':''):''}<div class="forest-runes">${runes.map((r,i)=>button(r,'answer',`data-value="${i}" aria-label="Rune ${i+1}" ${memory&&(!revealed||visible)?'disabled':''}`)).join('')}</div><p>${isID?'Urutanmu':'Your sequence'}: ${s.input.map(v=>runes[v]).join(' → ')||'…'} (${s.input.length}/${p.sequence.length})</p>`;
   }else if(p.type==='riddle')controls=`<div class="forest-answers">${p.riddle[isID?2:3].map((a,i)=>button(a,'answer',`data-value="${i}"`)).join('')}</div>`;
   else if(p.type==='lights')controls=`<div class="forest-lamps">${s.lamps.map((on,i)=>button(`${on?'◉':'○'} ${i+1}`,'answer',`data-value="${i}" aria-pressed="${on}" aria-label="${isID?'Lentera':'Lantern'} ${i+1}"`)).join('')}</div>`;
   else if(p.type==='dial')controls=`<div class="forest-inscription">${p.target.map(v=>runes[v]).join(' / ')}</div><div class="forest-runes">${s.dials.map((v,i)=>button(runes[v]+' ↻','answer',`data-value="${i}" aria-label="${isID?'Putar jam':'Turn clock'} ${i+1}"`)).join('')}</div>`;
   else controls=button(isID?'Mulai lintasan →':'Start trail →','trail');
   const hint=p.type==='lights'?(isID?'Tekan tombol berikut dari kondisi awal: ':'From the initial state, press: ')+[...p.scramble].reverse().map(v=>v+1).join(' → '):p.type==='riddle'?(isID?'Jawabannya: ':'The answer is: ')+p.riddle[isID?2:3][p.riddle[4]]:p.type==='trail'?(isID?'Lingkaran berdenyut adalah tujuan berikutnya. Lepas lalu tekan lagi Spasi untuk melompat. Kamu boleh memutari batang.':'The pulsing ring is next. Release and press Space again to jump. You may go around a log.'):(isID?'Ikuti simbol dari kiri ke kanan. Kamu boleh mencoba kembali tanpa kehilangan segel.':'Follow the symbols from left to right. Retry freely without losing seals.');
   content.innerHTML=`<small>${biomes[p.zone].name[l()]} / ${selected+1} OF 36</small><h2 id="forest-dialog-title">${p.name[l()]}</h2><p>${intro[p.type]}</p>${s.solved?`<div class="forest-success" role="status">✦ ${isID?'Segel dipulihkan. Checkpoint tersimpan!':'Seal restored. Checkpoint saved!'}</div>${button(isID?'Lanjutkan perjalanan →':'Continue exploring →','close')}`:`${controls}<p class="forest-feedback" role="status">${s.mistakes?(isID?`Percobaan belum cocok (${s.mistakes}). Coba lagi!`:`Not quite (${s.mistakes}). Try again!`):''}</p><div class="forest-tools">${button(isID?'Petunjuk':'Hint','hint')}${button(isID?'Ulangi puzzle':'Reset puzzle','reset')}</div>${showHint?`<p class="forest-hint">${hint}</p>`:''}`}`;
  }
 }
 root.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const a=b.dataset.action;
  if(a==='close'){close();return;}
  if(a==='map'){open('map');return;}
  if(a==='checkpoint'){if(world.mapOpen)close();world.respawn();return;}
  if(a==='target'){world.selected=Number(b.dataset.index);close();return;}
  if(a==='reveal'){rememberUntil=performance.now()+4000;revealed=true;world.states[selected].input=[];}
  if(a==='hint')showHint=!showHint;
  if(a==='reset'){world.states[selected]=createPuzzleState(puzzles[selected]);rememberUntil=0;revealed=false;}
  if(a==='answer'){const p=puzzles[selected];if(p.type==='memory'&&(!revealed||performance.now()<rememberUntil))return;world.attempt(selected,Number(b.dataset.value));}
  if(a==='trail'){world.startTrail(selected);close();return;}
  const focusAction=a,focusValue=b.dataset.value;render();root.querySelector(`[data-action="${focusAction}"]${focusValue!==undefined?`[data-value="${focusValue}"]`:''}`)?.focus();
 });
 $('.forest-overlay').addEventListener('click',e=>{if(e.target===$('.forest-overlay'))close();});
 for(const b of root.querySelectorAll('[data-hold]')){
  b.addEventListener('pointerdown',e=>{if(!active()||world.mapOpen)return;e.preventDefault();b.setPointerCapture(e.pointerId);u.keys.add(b.dataset.hold);});
  const release=()=>u.keys.delete(b.dataset.hold);b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
 }
 window.addEventListener('keydown',e=>{
  if(!active()||e.repeat||/INPUT|TEXTAREA/.test(e.target.tagName))return;
  if(e.code==='Escape'&&modal){e.preventDefault();close();return;}
  if(e.code==='KeyM'&&!u.seated&&document.querySelector('#guide')?.hidden){e.preventDefault();modal?close():open('map');}
  if(e.code==='Tab'&&modal){const buttons=[...$('.forest-dialog').querySelectorAll('button:not(:disabled),summary')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('.forest-dialog'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||!$('.forest-dialog').contains(document.activeElement))){e.preventDefault();first?.focus();}}
 });
 function update(){
  const visible=active()&&!u.seated;root.hidden=!visible;document.body.classList.toggle('chronos-forest-active',visible);
  if(!visible){if(modal)close();return;}
  if(lastLang!==l()){lastLang=l();if(modal)render();}
  if(rememberUntil&&performance.now()>=rememberUntil){rememberUntil=0;if(modal==='puzzle')render();}
  const p=puzzles[world.selected],target=world.solved.size===36?{x:0,z:-303}:p,pos=u.camera.position,distance=Math.hypot(target.x-pos.x,target.z-pos.z),heading=Math.atan2(target.x-pos.x,-(target.z-pos.z))+u.look.yaw,bearing=['↑','↗','→','↘','↓','↙','←','↖'][(Math.round(heading/(Math.PI/4))+80)%8];
  $('.forest-heading').textContent=world.finished?(id()?'Penjaga Chronos ✦':'Guardian of Chronos ✦'):biomes[p.zone].name[l()];
  $('.forest-progress').textContent=`${world.solved.size}/36 ${id()?'segel pulih':'seals restored'} · ${world.visited.size}/6 ${id()?'kawasan':'regions'}`;root.querySelector('progress').value=world.solved.size;
  $('.forest-bearing').textContent=world.solved.size===36?`${bearing} ✦ ${id()?'Jantung Hutan':'Forest Heart'} · ${Math.round(distance)} m`:world.trail?`${id()?'Lintasan':'Trail'} ${world.trail.next}/5 · ${Math.ceil(world.trail.remaining)}s`:`${bearing} ${p.name[l()]} · ${Math.round(distance)} m`;
  $('[data-action="map"]').textContent=id()?'M · Peta & tujuan':'M · Map & goals';$('[data-action="checkpoint"]').textContent=id()?'↶ Checkpoint':'↶ Checkpoint';
  $('.forest-controls').textContent=id()?'WASD berjalan · Shift lari · Spasi lompat · E interaksi · M peta':'WASD walk · Shift sprint · Space jump · E interact · M map';
  const sprint=$('[data-hold="ShiftLeft"]'),jump=$('[data-hold="Space"]');sprint.textContent=id()?'LARI':'SPRINT';jump.textContent=id()?'LOMPAT':'JUMP';sprint.ariaLabel=id()?'Tahan untuk berlari':'Hold to sprint';jump.ariaLabel=id()?'Tekan untuk melompat':'Press to jump';
  const toast=$('.forest-toast'),message=world.messages?.[l()]||world.message;toast.hidden=world.elapsed>=world.messageUntil||!world.message;if(lastMessage!==message){lastMessage=message;toast.textContent=lastMessage;}
 }
 // Keep the HUD lifecycle in sync even when flight stops updating the world.
 setInterval(update,150);window.addEventListener('hashchange',()=>{root.hidden=true;if(modal)close();});
 return {openPuzzle,update,close};
}
