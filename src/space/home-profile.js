import { content } from './content.js';
import './home-profile.css';

export function setupHomeProfile(getUniverse) {
 const home=document.createElement('section');home.id='home-profile';home.setAttribute('aria-labelledby','home-profile-title');
 home.innerHTML=`<div class="transmission-tag"><span aria-hidden="true"></span><span data-profile="signal"></span><span aria-hidden="true">001</span></div><h1 id="home-profile-title">THE HUMAN<br> BEHIND THE <em>CODE.</em></h1><p class="transmission-name">OSKHAR <span>/ SOFTWARE ENGINEER</span></p><div class="transmission-actions"><button id="open-profile" aria-haspopup="dialog"><span class="transmission-icon" aria-hidden="true">◎</span><span><small data-profile="identify"></small><strong data-profile="about"></strong></span><span aria-hidden="true">↗</span></button><a href="./cv.pdf" download="Muhamad-Oskhar-Mubarok-CV.pdf" id="download-cv"><span class="transmission-icon" aria-hidden="true">↓</span><span><small>PDF / CV</small><strong data-profile="download"></strong></span><span aria-hidden="true">↘</span></a></div><span class="transmission-caption" data-profile="caption"></span>`;
 document.querySelector('main').prepend(home);
 const dialog=document.createElement('dialog');dialog.id='profile-dialog';dialog.setAttribute('aria-labelledby','profile-title');
 dialog.innerHTML=`<div class="profile-orbit" aria-hidden="true"></div><header><span class="profile-eyebrow" data-profile="dossier"></span><button id="close-profile" autofocus>✕</button></header><div class="profile-body"><div class="profile-classification"><span aria-hidden="true">✦</span> <span data-profile="signal"></span></div><p class="profile-number" aria-hidden="true">OSK / 001</p><h2 id="profile-title">MUHAMAD<br>OSKHAR <em>MUBAROK.</em></h2><p class="profile-role">SOFTWARE ENGINEER <span>×</span> BACKEND ENGINEER</p><div class="profile-facts"><span><strong>03+</strong><small data-profile="experience"></small></span><span><strong>JAKARTA</strong><small>06° S / 106° E</small></span><span><strong>BACKEND</strong><small>API / SYSTEMS / DATA</small></span></div><p id="profile-about"></p><p id="profile-current"></p><div class="profile-education"><span aria-hidden="true">⌖</span><div><strong id="profile-degree"></strong></div></div><div class="profile-footer"><a href="./cv.pdf" download="Muhamad-Oskhar-Mubarok-CV.pdf"><span data-profile="download"></span> ↓</a></div></div>`;
 document.body.append(dialog);
 const copy={
  en:{signal:'PERSONAL TRANSMISSION',identify:'MEET THE ENGINEER',about:'Who am I?',download:'Download CV',caption:'A HUMAN STORY. AN ENTIRE UNIVERSE TO EXPLORE.',dossier:'PERSONNEL FILE / DECLASSIFIED',experience:'YEARS OF EXPERIENCE',close:'Close profile'},
  id:{signal:'TRANSMISI PRIBADI',identify:'KENALI SOSOKNYA',about:'Siapa Saya',download:'Download CV',caption:'SEBUAH CERITA. SELURUH SEMESTA UNTUK DIJELAJAHI.',dossier:'ARSIP PERSONAL / AKSES TERBUKA',experience:'TAHUN PENGALAMAN',close:'Tutup profil'},
 };
 function localize(){const language=document.documentElement.lang==='id'?'id':'en',text=copy[language],c=content[language];for(const root of [home,dialog])root.querySelectorAll('[data-profile]').forEach(el=>el.textContent=text[el.dataset.profile]);dialog.querySelector('#close-profile').ariaLabel=text.close;dialog.querySelector('#profile-about').textContent=c.about;dialog.querySelector('#profile-current').textContent=c.about2;dialog.querySelector('#profile-degree').textContent=c.education;}
 let wasSuspended=false,openedUniverse=null;
 home.querySelector('#open-profile').onclick=()=>{const u=getUniverse();openedUniverse=u;wasSuspended=!!u?.suspended;if(u){u.release();u.keys.clear();u.stick={x:0,y:0};u.suspended=true;}localize();dialog.showModal();document.body.classList.add('profile-open');};
 function restore(){document.body.classList.remove('profile-open');if(openedUniverse){openedUniverse.suspended=wasSuspended;openedUniverse=null;}home.querySelector('#open-profile').focus({preventScroll:true});}
 function dismiss(){dialog.close();restore();}
 dialog.querySelector('#close-profile').onclick=dismiss;
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismiss();}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
 dialog.addEventListener('close',restore);
 window.addEventListener('hashchange',()=>{if(dialog.open){openedUniverse=null;dismiss();}});
 new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});localize();
}
