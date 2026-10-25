import './style.css';
import { content } from './content.js';
import { FlightDirector } from './flight.js';
import { Universe } from './universe.js';
import { routes, exhibitsFor, worldNames } from './exhibits.js';

let language=localStorage.getItem('oskhar-language')==='id'?'id':'en';
let universe,selected=-1,worldIndex=-1,focused=null,failed=false,transitionTimer;
const copy={
 en:{aim:'Aim at a planet or satellite',locked:'DESTINATION LOCKED',enter:'Enter world',scope:'Activate scope',walk:'WASD to walk · Mouse / drag to look · Shift to run · Esc to release',aimHint:'Move the scope over a planet · Click or Enter to visit · ← → to select',return:'Return to orbits',control:'Click to look around',visit:'INTERACTIVE OBJECTS',previous:'Previous object',next:'Next object',sit:'Sit at the workstation',stand:'Return to exploring',chapter:'Chapter',loading:'Preparing your destination…',interact:'Press E or click to interact',guide:'Aim at a planet on the home page, then click to enter its own 3D world. Inside, walk with WASD and approach glowing objects and interact with their stories. In the Origin home, approach the chair and press E to sit at the workstation.',text:'Portfolio / text version',chairHint:'Approach the desk to sit and explore the full story',open:'Open link'},
 id:{aim:'Arahkan scope ke planet atau satelit',locked:'DESTINASI TERKUNCI',enter:'Masuk ke dunia',scope:'Aktifkan scope',walk:'WASD berjalan · Mouse / geser melihat · Shift berlari · Esc melepas mouse',aimHint:'Arahkan scope ke planet · Klik atau Enter untuk masuk · ← → memilih',return:'Kembali ke orbit',control:'Klik untuk melihat sekeliling',visit:'BENDA INTERAKTIF',previous:'Objek sebelumnya',next:'Objek berikutnya',sit:'Duduk di workstation',stand:'Kembali eksplorasi',chapter:'Bagian',loading:'Menyiapkan destinasi…',interact:'Tekan E atau klik untuk berinteraksi',guide:'Arahkan scope ke planet di halaman awal, lalu klik untuk memasuki dunia 3D tersendiri. Di dalamnya, berjalan dengan WASD dan dekati benda bercahaya untuk berinteraksi dengan ceritanya. Di rumah Origin, dekati kursi lalu tekan E untuk duduk dan membaca cerita lengkap melalui workstation.',text:'Portfolio / versi teks',chairHint:'Dekati meja untuk duduk dan membaca cerita lengkap',open:'Buka tautan'},
};
const c=()=>content[language],ui=()=>copy[language];
const flight=new FlightDirector();let navigation=0;
document.querySelector('#app').innerHTML=`
<canvas tabindex="0" id="universe" aria-label="3D portfolio"></canvas><div class="vignette" aria-hidden="true"></div>
<header class="header"><a class="brand" href="#/" aria-label="Oskhar — home"><span class="brand-icon" aria-hidden="true">o<span>·</span></span>oskhar</a><div class="header-actions"><button id="language" aria-label="Switch language"></button></div></header>
<main>
<section class="hero" id="hero"><div class="eyebrow"><span class="signal"></span><span data-t="journey"></span></div><h1 data-t="title"></h1><p class="hero-intro" data-t="intro"></p><div class="hero-actions"><button class="primary" id="launch"></button><button class="text-button" id="discover"><span data-t="discover"></span> →</button></div><div class="hero-meta"><span class="tiny-orbit">✳</span><span data-t="role"></span></div></section>
<div id="beacons" aria-label="Orbit destinations"></div>
<div id="scope" aria-hidden="true"><span class="scope-ring"></span><span class="scope-cross">+</span><span class="scope-axis axis-x"></span><span class="scope-axis axis-y"></span><span class="scope-tick">⌖</span></div>
<section class="target-readout" aria-live="polite"><span id="target-status"></span><h2 id="target-name"></h2><p id="target-description"></p><button id="enter-target" class="primary small" hidden></button></section>
<section class="destination-bar"><div class="destination-heading"><span data-t="map"></span><span>01 — 05</span></div><div class="destination-list"></div></section>
<section id="world-hud" hidden><div class="world-heading"><span id="world-coordinate"></span><h1 id="world-name"></h1><p id="world-subtitle"></p></div><button id="return-orbit" class="outline small"></button><button id="resume" class="outline small"></button><span class="crosshair" aria-hidden="true">+</span><div id="world-interaction" hidden><span id="interaction-label"></span><button id="interact" class="primary small"></button></div><div class="waypoints"><span id="waypoint-heading"></span><button id="previous-exhibit" class="icon-button">←</button><span id="waypoint-count"></span><button id="next-exhibit" class="icon-button">→</button></div><div id="reader-exit-cue" hidden><span aria-hidden="true">↗</span><span id="reader-exit-label"></span></div><div id="laptop-controls" hidden><div id="reader-scroll-hint"><span aria-hidden="true">⌄</span><span id="reader-scroll-label"></span></div><button id="stand" class="primary small"></button></div></section>
<div id="joystick" aria-label="Movement joystick" hidden><div></div></div><div id="arrival" hidden><span class="signal"></span><span id="arrival-label"></span></div>
<section id="reader-accessible" class="sr-only" aria-live="polite"></section><section id="text-content" class="sr-only" aria-label="Portfolio content"></section>
</main>
<footer class="footer"><span><i class="signal"></i><span data-t="location"></span><span class="utc" id="clock"></span></span><span class="footer-center" data-t="coordinates"></span><div><button id="quality"></button><button id="motion"></button><button id="help" aria-label="Guide">?</button></div></footer>
<div class="flight-hint"></div><aside id="guide" hidden><button id="close-guide" class="icon-button" aria-label="Close">✕</button><h2>Navigation</h2><p id="guide-copy"></p></aside>
`;
function localize(){
 document.documentElement.lang=language;document.querySelectorAll('[data-t]').forEach(el=>el.innerHTML=c()[el.dataset.t]);
 document.querySelector('#language').innerHTML=language==='en'?'EN <span>/ ID</span>':'ID <span>/ EN</span>';
 document.querySelector('.destination-list').innerHTML=c().destinations.map((name,i)=>`<a href="#/${routes[i]}" class="destination"><span class="planet-dot planet-${i}"></span><span class="destination-text"><small>0${i+1} / ${c().nav[i]}</small><strong>${name}</strong></span><span class="destination-arrow">↗</span></a>`).join('');
 document.querySelector('#beacons').innerHTML=c().destinations.map((name,i)=>`<button class="beacon" data-beacon="${i}" data-destination="${i}" hidden><span class="beacon-ring"></span><span>${name}<em>${c().subtitles[i]}</em><small></small></span></button>`).join('');
 document.querySelector('#launch').textContent=ui().scope+' ⌖';document.querySelector('#enter-target').textContent=ui().enter+' ↗';document.querySelector('#return-orbit').textContent='← '+ui().return;document.querySelector('#resume').textContent=ui().control;document.querySelector('#arrival-label').textContent=ui().loading;
 document.querySelector('#guide-copy').textContent=ui().guide;document.querySelector('#waypoint-heading').textContent=ui().visit;document.querySelector('#previous-exhibit').ariaLabel=ui().previous;document.querySelector('#next-exhibit').ariaLabel=ui().next;document.querySelector('#stand').textContent=ui().stand;
 universe?.setLanguage(language);updateAim(selected);updateWorld();updateSettings();renderText();updateReaderUI();
}
function updateAim(index){
 selected=index;document.querySelector('.target-readout').dataset.locked=String(index>=0);document.querySelector('#scope').classList.toggle('locked',index>=0);document.querySelector('#target-status').textContent=index>=0?ui().locked:'ORBITAL OBSERVATORY';document.querySelector('#target-name').textContent=index>=0?c().destinations[index]:ui().aim;document.querySelector('#target-description').textContent=index>=0?c().subtitles[index]:ui().aimHint;document.querySelector('#enter-target').hidden=index<0;
 document.querySelectorAll('.destination').forEach((el,i)=>el.classList.toggle('selected',i===index));document.querySelectorAll('[data-beacon]').forEach((el,i)=>el.classList.toggle('aimed',i===index));
}
let waypoint=-1;
function updateWorld(){
 const world=worldIndex>=0;document.body.classList.toggle('inside-world',world);document.body.classList.toggle('exploring',world);document.querySelector('#hero').hidden=true;document.querySelector('#world-hud').hidden=!world;document.querySelector('#scope').hidden=world;document.querySelector('.target-readout').hidden=world;document.querySelector('.destination-bar').hidden=world;document.querySelector('#joystick').hidden=!world||!matchMedia('(pointer:coarse)').matches||!!universe?.seated;
 document.querySelector('.flight-hint').textContent=world?ui().walk:ui().aimHint;
 if(world){document.querySelector('#world-coordinate').textContent=`0${worldIndex+1} / ${c().destinations[worldIndex]}`;document.querySelector('#world-name').textContent=worldNames[language][worldIndex];document.querySelector('#world-subtitle').textContent=c().subtitles[worldIndex];document.querySelector('#waypoint-count').textContent=`${Math.max(0,waypoint+1)} / ${universe?.world?.interactables.length||exhibitsFor(worldIndex,language).length}`;}
 updateInteraction(focused);
}
function updateInteraction(exhibit){
 focused=exhibit;const item=exhibit?.item;const visible=worldIndex>=0&&!universe?.seated&&!universe?.suspended&&!!item;document.querySelector('#world-interaction').hidden=!visible;
 document.querySelector('#interaction-label').textContent=item?item.label[language]:'';
 document.querySelector('#interact').textContent=item?.kind==='boarding'?(language==='id'?'E · Naik pesawat':'E · Board spacecraft'):item?.kind==='seat'?ui().sit:item?.kind==='link'?ui().open+' ↗':item?.kind==='light'?(language==='id'?'Ubah pencahayaan':'Switch the lighting'):(language==='id'?'E · Jelajahi cerita':'E · Explore the story');
}
function interact(){
 const item=focused?.item;if(!item||universe?.seated||universe?.suspended)return;
 if(item.kind==='boarding'){if(universe.camera.position.distanceTo(item.anchor.position)<=item.activationDistance)returnToOrbit();return;}
 if(item.kind==='link'){item.activated=true;universe.release();window.open(item.url,'_blank','noopener,noreferrer');}
 else if(item.kind==='light'){universe.world.toggleLights();item.activated=!!universe.world.dimmed;}
 else{universe.sit(item);updateReaderUI();updateWorld();}
}
function updateReaderHint(){const world=universe?.world;if(!world?.readSurface)return;const scrollable=world.readSurface.maxScroll>0,end=world.readOffset>=world.readSurface.maxScroll-2;document.querySelector('#reader-scroll-label').textContent=language==='id'?(!scrollable?'Seluruh penjelasan sudah terlihat':end?'Akhir penjelasan · gulir ke atas untuk membaca kembali':'Gulir ke bawah untuk membaca selengkapnya'):(!scrollable?'Full story shown':end?'End of story · scroll up to read again':'Scroll down to keep reading');document.querySelector('#reader-scroll-hint').classList.toggle('at-end',end);document.querySelector('#reader-scroll-hint').classList.toggle('not-scrollable',!scrollable);}
function scrollReader(delta,absolute=false){if(!universe?.seated||universe.suspended)return;universe.world.scrollReading(delta,{absolute});updateReaderHint();}
function updateReaderUI(){const seated=!!universe?.seated;document.querySelector('#reader-accessible').textContent=seated?universe.world.chapters.map(section=>section.join('. ')).join('\n\n'):'';document.querySelector('#laptop-controls').hidden=!seated;document.body.classList.toggle('seated',seated);if(seated)updateReaderHint();else hideReaderCue();}

function renderText(){
 const indexes=worldIndex>=0?[worldIndex]:[0,1,2,3,4];document.querySelector('#text-content').innerHTML=indexes.map(index=>`<section><h2>${worldNames[language][index]}</h2>${exhibitsFor(index,language).map(e=>`<article><h3>${e.title}</h3><p>${e.subtitle||''}</p><p>${e.body.replaceAll('\n','<br>')}</p>${e.url?`<a href="${e.url}" target="_blank" rel="noopener">${ui().open} ↗</a>`:''}</article>`).join('')}</section>`).join('');
}
async function route(){
 const slug=location.hash.replace(/^#\/?/,'').split('/')[0],next=routes.indexOf(slug);if(next===worldIndex&&universe?.mode===(next>=0?'world':'orbit'))return;
 if(failed){worldIndex=next;renderText();return;}
 const request=++navigation;universe.release();universe.suspended=true;
 try{
  if(next>=0){const result=await flight.transition(c().destinations[next],()=>universe.prepareWorld(next),{motion:universe.motion,index:next});if(result.cancelled||request!==navigation)return;universe.enterWorld(next);}
  else{if(universe.mode==='world'){const result=await flight.transition('HOME ORBIT',()=>Promise.resolve(),{motion:true,returning:true});if(result.cancelled||request!==navigation)return;}else flight.cancel();universe.home();}
  if(request!==navigation)return;worldIndex=next;waypoint=-1;focused=null;updateWorld();updateReaderUI();renderText();document.title=next>=0?`${worldNames[language][next]} — Oskhar`:'Oskhar — A universe of possibilities';
 }catch(error){console.error('Destination loading:',error);if(request===navigation){flight.cancel();universe.home();worldIndex=-1;updateWorld();}}finally{if(request===navigation){universe.suspended=false;document.querySelector('#arrival').hidden=true;}}
}
function returnToOrbit(){if(!universe||universe.suspended||universe.mode!=='world')return;if(location.hash==='#/')route();else location.hash='/';}
function go(index){location.hash='/'+routes[index];}
function aim(index){if(worldIndex>=0)return;universe.selectOrbit(index);const d=universe.orbit.children[index].position.clone().project(universe.camera);const scope=document.querySelector('#scope');scope.style.left=(d.x*.5+.5)*innerWidth+'px';scope.style.top=(-d.y*.5+.5)*innerHeight+'px';}
function updateSettings(){document.querySelector('#motion').textContent=`${c().motion} ${universe?.motion===false?'○':'●'}`;document.querySelector('#motion').setAttribute('aria-pressed',String(universe?.motion!==false));document.querySelector('#quality').textContent=`${c().quality}: ${universe?.low?'L':'H'}`;}
document.querySelector('#launch').onclick=()=>{if(failed)return;document.body.classList.add('targeting');document.querySelector('#hero').hidden=true;aim(0);};document.querySelector('#discover').onclick=()=>go(2);document.querySelector('#enter-target').onclick=()=>{if(selected>=0)go(selected);};
document.querySelector('#universe').addEventListener('pointermove',e=>{if(worldIndex<0&&!universe?.suspended){const scope=document.querySelector('#scope');scope.style.left=e.clientX+'px';scope.style.top=e.clientY+'px';}});
function readerScrollScale(){const screen=universe?.world?.reading?.screen;if(!screen)return 1;universe.camera.updateMatrixWorld();screen.updateWorldMatrix(true,false);const half=(screen.geometry.parameters.height||.675)/2,top=screen.localToWorld(universe.camera.position.clone().set(0,half,0)).project(universe.camera),bottom=screen.localToWorld(universe.camera.position.clone().set(0,-half,0)).project(universe.camera);return 1080/Math.max(100,Math.abs(top.y-bottom.y)*innerHeight/2);}
function readerHit(x,y){if(!universe?.seated||!universe.world?.reading)return false;universe.camera.updateMatrixWorld();const screen=universe.world.reading.screen;screen.updateWorldMatrix(true,false);universe.raycaster.setFromCamera(universe.pointer.clone().set(x/innerWidth*2-1,1-y/innerHeight*2),universe.camera);return universe.raycaster.intersectObject(screen,false).length>0;}
function hideReaderCue(){document.querySelector('#reader-exit-cue').hidden=true;document.body.classList.remove('reader-outside');}
function updateReaderPointer(e){if(!universe?.seated||universe.suspended||e.pointerType==='touch'||(canvasPress&&canvasDragged)){hideReaderCue();return;}const outside=!readerHit(e.clientX,e.clientY),cue=document.querySelector('#reader-exit-cue');cue.hidden=!outside;document.body.classList.toggle('reader-outside',outside);if(outside){document.querySelector('#reader-exit-label').textContent=language==='id'?'Klik untuk melanjutkan eksplorasi':'Click to resume exploring';cue.style.left=Math.max(12,Math.min(e.clientX+18,innerWidth-cue.offsetWidth-12))+'px';cue.style.top=Math.max(12,Math.min(e.clientY+18,innerHeight-cue.offsetHeight-12))+'px';}}
let canvasPress=null,canvasDragged=false,readerPointerY=0,readerDragging=false;
document.querySelector('#universe').addEventListener('pointerdown',e=>{canvasPress={x:e.clientX,y:e.clientY};readerPointerY=e.clientY;canvasDragged=false;readerDragging=readerHit(e.clientX,e.clientY);if(universe?.seated)e.currentTarget.setPointerCapture(e.pointerId);});
document.querySelector('#universe').addEventListener('pointermove',e=>{if(canvasPress&&Math.hypot(e.clientX-canvasPress.x,e.clientY-canvasPress.y)>10)canvasDragged=true;updateReaderPointer(e);if(canvasPress&&readerDragging&&universe?.seated){const delta=readerPointerY-e.clientY;readerPointerY=e.clientY;if(canvasDragged)scrollReader(delta*readerScrollScale());}});
document.querySelector('#universe').addEventListener('pointercancel',()=>{canvasPress=null;canvasDragged=true;readerDragging=false;hideReaderCue();});
document.querySelector('#universe').addEventListener('pointerup',e=>{canvasPress=null;readerDragging=false;updateReaderPointer(e);});
document.querySelector('#universe').addEventListener('pointerleave',hideReaderCue);
function resumeExploration(){if(!universe?.seated||universe.suspended||universe.mode!=='world')return;universe.stand();updateReaderUI();updateWorld();}
document.querySelector('#universe').addEventListener('click',e=>{if(universe?.suspended)return;if(worldIndex<0){const index=universe?.aimAt(e.clientX,e.clientY);if(index>=0)go(index);}else if(universe?.seated){if(!canvasDragged&&!readerHit(e.clientX,e.clientY))resumeExploration();}else universe?.pilot();canvasPress=null;});
document.querySelector('#beacons').onclick=e=>{const el=e.target.closest('[data-destination]');if(el)go(Number(el.dataset.destination));};
document.querySelector('#language').onclick=()=>{language=language==='en'?'id':'en';localStorage.setItem('oskhar-language',language);localize();};document.querySelector('#return-orbit').onclick=returnToOrbit;document.querySelector('#resume').onclick=()=>universe?.pilot();document.querySelector('#interact').onclick=interact;
for(const [id,delta] of [['previous-exhibit',-1],['next-exhibit',1]])document.querySelector('#'+id).onclick=()=>{if(!universe?.world)return;waypoint=(waypoint+delta+universe.world.cards.length)%universe.world.cards.length;universe.release();universe.visitExhibit(waypoint);updateWorld();};
document.querySelector('#stand').onclick=resumeExploration;
document.querySelector('#quality').onclick=()=>{universe?.setQuality(!universe.low);updateSettings();};document.querySelector('#motion').onclick=()=>{if(universe)universe.motion=!universe.motion;updateSettings();};document.querySelector('#help').onclick=()=>{universe?.release();document.querySelector('#guide').hidden=!document.querySelector('#guide').hidden;};document.querySelector('#close-guide').onclick=()=>document.querySelector('#guide').hidden=true;
window.addEventListener('hashchange',route);window.addEventListener('keydown',e=>{
 if(/INPUT|TEXTAREA/.test(e.target.tagName)||e.repeat||universe?.suspended)return;
 if(worldIndex<0){if(e.code==='ArrowRight'||e.code==='ArrowLeft'){e.preventDefault();aim((selected+(e.code==='ArrowRight'?1:4)+5)%5);document.querySelector('#universe').focus({preventScroll:true});}if(e.code==='Enter'&&selected>=0&&(e.target===document.body||e.target.id==='universe'))go(selected);}
 else if(e.code==='KeyE'){e.preventDefault();interact();}
 if(universe?.seated){if(e.code==='Space'&&e.target.closest('button,a'))return;const moves={ArrowDown:100,ArrowUp:-100,PageDown:620,PageUp:-620,Space:e.shiftKey?-620:620};if(e.code in moves){e.preventDefault();scrollReader(moves[e.code]);}else if(e.code==='Home'||e.code==='End'){e.preventDefault();scrollReader(e.code==='Home'?0:universe.world.readSurface.maxScroll,true);}}
});
window.addEventListener('wheel',e=>{if(!universe?.seated||universe.suspended||!readerHit(e.clientX,e.clientY))return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?28:e.deltaMode===2?innerHeight:1);scrollReader(delta*readerScrollScale());},{passive:false});
const joystick=document.querySelector('#joystick'),knob=joystick.firstElementChild;let joystickPointer=null;
function moveStick(e){if(e.pointerId!==joystickPointer)return;const box=joystick.getBoundingClientRect(),dx=e.clientX-box.left-50,dy=e.clientY-box.top-50,length=Math.max(35,Math.hypot(dx,dy)),x=dx/length,y=dy/length;knob.style.transform=`translate(${x*30}px,${y*30}px)`;if(universe)universe.stick={x,y};}
joystick.onpointerdown=e=>{joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);};joystick.onpointermove=moveStick;joystick.onpointerup=joystick.onpointercancel=()=>{joystickPointer=null;knob.style.transform='';if(universe)universe.stick={x:0,y:0};};
setInterval(()=>{if(worldIndex>=0)updateInteraction(focused);},200);
function clock(){document.querySelector('#clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'})+' WIB';}clock();setInterval(clock,30000);localize();
try{universe=new Universe(document.querySelector('#universe'),{onNear:updateAim,onMode:()=>{},onExhibit:updateInteraction,onReady:()=>document.body.classList.add('ready')});universe.setLanguage(language);flight.connect(universe);window.__portfolio={universe,go,aim,flight};updateSettings();if(routes.includes(location.hash.replace(/^#\/?/,'')))route();else{document.body.classList.add('targeting');flight.welcome(universe.motion);}}catch(error){console.error('3D initialization:',error);failed=true;document.body.classList.add('text-mode');document.querySelector('#text-content').classList.remove('sr-only');document.querySelector('#text-content').insertAdjacentHTML('afterbegin',`<p>${c().noWebGL}</p>`);}
