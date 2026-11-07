import './mobile.css';

// A mobile-only shell around existing controls; world content stays untouched.
export function setupMobileUI(getUniverse){
 const media=matchMedia('(max-width:760px), (pointer:coarse)');
 const shell=document.createElement('div');shell.id='mobile-shell';
 shell.innerHTML=`<div class="mobile-top"><button id="mobile-menu" aria-haspopup="dialog" aria-expanded="false">☰ <span>Menu</span></button><span id="mobile-place"></span><button id="mobile-detail" hidden aria-expanded="false">◈</button></div><div id="mobile-backdrop" hidden></div><section id="mobile-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-title" hidden><header><h2 id="mobile-title">Menu</h2><button id="mobile-close" aria-label="Close menu">✕</button></header><div id="mobile-navigation"></div><div id="mobile-settings"></div><button id="mobile-fullscreen"></button><label id="mobile-sensitivity-label" for="mobile-sensitivity"></label><input id="mobile-sensitivity" type="range" min="30" max="100" value="55"><p id="mobile-tips"></p><p id="mobile-status" role="status"></p></section>`;
 document.body.append(shell);
 const $=s=>shell.querySelector(s),drawer=$('#mobile-drawer'),menu=$('#mobile-menu');
 const slots=[];let open=false,lastMode='',lastLanguage='',lastDetail=false;
 const ids=['previous-exhibit','next-exhibit','language','quality','motion','help','return-orbit'];
 function close(){open=false;drawer.hidden=true;$('#mobile-backdrop').hidden=true;document.body.classList.remove('mobile-menu-open');menu.setAttribute('aria-expanded','false');getUniverse()?.keys.clear();if(getUniverse())getUniverse().stick={x:0,y:0};menu.focus({preventScroll:true});}
 function show(){open=true;getUniverse()?.release();if(getUniverse())getUniverse().stick={x:0,y:0};drawer.hidden=false;$('#mobile-backdrop').hidden=false;document.body.classList.add('mobile-menu-open');menu.setAttribute('aria-expanded','true');$('#mobile-close').focus();}
 menu.onclick=()=>open?close():show();$('#mobile-close').onclick=close;$('#mobile-backdrop').onclick=close;
 drawer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const items=[...drawer.querySelectorAll('button:not([hidden]),a,input')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 $('#mobile-detail').onclick=()=>{lastDetail=!lastDetail;document.body.classList.toggle('mobile-detail-open',lastDetail);$('#mobile-detail').setAttribute('aria-expanded',String(lastDetail));};
 $('#mobile-sensitivity').oninput=e=>{const u=getUniverse();if(u)u.touchSensitivity=Number(e.target.value)/100;};
 $('#mobile-fullscreen').onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else{await document.documentElement.requestFullscreen();}}catch{ $('#mobile-status').textContent=document.documentElement.lang==='id'?'Fullscreen tidak tersedia di browser ini. Tampilan tetap menyesuaikan layar.':'Fullscreen unavailable in this browser. The layout still fits your screen.';}};
 function adapt(){document.body.classList.toggle('mobile-game',media.matches);if(media.matches){for(const id of ids){const node=document.getElementById(id);const marker=document.createComment('mobile control slot');node.before(marker);slots.push({node,marker});$('#mobile-settings').append(node);}const links=document.querySelector('.destination-list').cloneNode(true);links.className='mobile-destinations';$('#mobile-navigation').append(links);links.addEventListener('click',e=>{if(e.target.closest('a'))close();});}else{close();for(const {node,marker} of slots.splice(0)){marker.replaceWith(node);node.hidden=false;}$('#mobile-navigation').replaceChildren();document.body.classList.remove('mobile-detail-open');}}
 adapt();media.addEventListener('change',adapt);
 for(const id of ['return-orbit','help','previous-exhibit','next-exhibit'])document.getElementById(id).addEventListener('click',()=>{if(media.matches)close();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){const u=getUniverse();if(u){u.keys.clear();u.stick={x:0,y:0};}}});
 setInterval(()=>{if(!media.matches)return;const u=getUniverse(),id=document.documentElement.lang==='id',mode=u?.mode||'orbit',lang=document.documentElement.lang;
 if(mode!==lastMode){close();lastDetail=false;document.body.classList.remove('mobile-detail-open');lastMode=mode;}
 if(lang!==lastLanguage){$('#mobile-title').textContent=id?'Navigasi & pengaturan':'Navigation & settings';$('#mobile-sensitivity-label').textContent=id?'Sensitivitas kamera':'Camera sensitivity';$('#mobile-tips').textContent=id?'Joystick kiri untuk berjalan. Geser area kanan untuk melihat. Dekati objek lalu ketuk tombol aksi. Landscape memberi pandangan lebih luas.':'Left joystick to walk. Drag the right side to look. Approach an object and tap the action button. Landscape gives a wider view.';$('#mobile-close').ariaLabel=id?'Tutup menu':'Close menu';$('#mobile-detail').ariaLabel=id?'Buka panel aktivitas':'Open activity panel';const source=document.querySelectorAll('.destination-list a');$('#mobile-navigation').querySelectorAll('a').forEach((a,i)=>a.replaceChildren(...[...source[i].childNodes].map(n=>n.cloneNode(true))));lastLanguage=lang;}
 document.getElementById('return-orbit').hidden=mode!=='world';document.getElementById('previous-exhibit').hidden=mode!=='world';document.getElementById('next-exhibit').hidden=mode!=='world';
 $('#mobile-place').textContent=mode==='world'?document.querySelector('#world-name').textContent:mode==='flight'?(id?'Penerbangan':'In flight'):'Orbit';
 $('#mobile-fullscreen').hidden=!document.fullscreenEnabled;$('#mobile-fullscreen').textContent=document.fullscreenElement?(id?'Keluar fullscreen':'Exit fullscreen'):(id?'⛶ Layar penuh':'⛶ Fullscreen');
 $('#mobile-detail').hidden=mode!=='world'||u?.world?.index!==1||u?.seated;
 shell.hidden=mode==='flight';if(u?.suspended&&open)close();
 },200);
 return {close,isOpen:()=>open};
}
