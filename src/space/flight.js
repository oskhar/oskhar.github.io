import './flight.css';

/** Coordinates real orbit-camera movement, a 3D cockpit and accessible pilot controls. */
export class FlightDirector {
 constructor(){
  this.root=document.createElement('section');this.root.id='space-loading';this.root.hidden=true;
  this.root.innerHTML=`<div class="intro-lettering"><p id="welcome-phrase"></p><h1 class="intro-name">oskhar</h1></div><div class="pilot-navigation"><span>DESTINATION LOCKED</span><h2></h2><p id="pilot-phase"></p></div><div class="pilot-instruments"><div class="pilot-top"><span>FLIGHT CONTROL</span><button id="autopilot" aria-pressed="true">AUTOPILOT ON</button></div><div class="pilot-switches">${['MASTER POWER','IGNITION','NAV ALIGN','DRIVE ARM'].map((s,i)=>`<button data-control="${i}" aria-pressed="false"><i></i><span>${s}</span><kbd>${i+1}</kbd></button>`).join('')}</div><label class="throttle-control"><span>THROTTLE</span><input id="throttle" type="range" min="0" max="100" value="0" aria-label="Engine throttle"><output>0%</output></label><p class="pilot-assist">Operate the switches in sequence, then advance the throttle.</p></div><button class="skip-flight">Explore →</button><div class="arrival-shade" aria-hidden="true"></div>`;
  document.body.append(this.root);this.skipButton=this.root.querySelector('.skip-flight');this.token=0;this.state='idle';this.universe=null;
  this.root.querySelectorAll('[data-control]').forEach(button=>button.onclick=()=>{if(!this.session||this.session.returning)return;this.session.autopilot=false;this.activate(Number(button.dataset.control));});
  this.root.querySelector('#autopilot').onclick=()=>{if(!this.session||this.session.returning)return;this.session.autopilot=!this.session.autopilot;this.session.nextAction=this.session.elapsed+.5;};
  this.root.querySelector('#throttle').oninput=e=>{if(!this.session||this.session.returning||this.session.stage<4)return;this.session.autopilot=false;this.session.throttle=Number(e.target.value)/100;};
  window.addEventListener('keydown',e=>{if(!this.session||this.session.returning||e.repeat)return;const key=Number(e.key);if(key>=1&&key<=4&&this.session.elapsed>=this.session.revealDuration){e.preventDefault();this.session.autopilot=false;this.activate(key-1);}});
 }
 connect(universe){this.universe=universe;}
 activate(index){const s=this.session;if(!s||s.elapsed<s.revealDuration||index!==s.stage||index>3)return false;s.stage++;s.lastAction=s.elapsed;s.nextAction=s.elapsed+(s.returning?.4:.5);return true;}
 cancel(){
  this.token++;cancelAnimationFrame(this.frame);this.finish?.({cancelled:true});this.finish=null;this.root.hidden=true;this.root.classList.remove('arrival');document.body.classList.remove('in-transit','intro-active');
  if(this.universe?.flightTravel)this.universe.endFlight({reset:true});this.session=null;this.state='idle';
 }
 welcome(motion=true){
  this.cancel();const token=this.token;this.state='welcome';this.root.hidden=false;this.root.className='welcome-mode';document.body.classList.add('intro-active');this.skipButton.textContent='Explore →';const phrase=this.root.querySelector('#welcome-phrase'),text='welcome to my space';const start=performance.now();phrase.textContent=motion?'':text;
  return new Promise(resolve=>{this.finish=resolve;const done=()=>{if(token!==this.token)return;cancelAnimationFrame(this.frame);this.root.hidden=true;document.body.classList.remove('intro-active');this.state='idle';this.finish=null;resolve({cancelled:false});};this.skipButton.onclick=done;const step=now=>{if(token!==this.token)return;const elapsed=(now-start)/1000;phrase.textContent=motion?text.slice(0,Math.floor(elapsed*20)):text;phrase.classList.toggle('typed',phrase.textContent===text);if(elapsed>(motion?3.5:.6)){done();return;}this.frame=requestAnimationFrame(step);};this.frame=requestAnimationFrame(step);});
 }
 transition(destination,prepare,{motion=true,index=0,returning=false}={}){
  this.cancel();if(!this.universe)throw new Error('The flight director needs a universe.');const token=this.token;this.root.hidden=false;this.root.className='flight-mode';this.root.style.setProperty('--ascent-glow',0);this.root.dataset.boarding=String(motion);document.body.classList.add('in-transit');this.root.querySelector('.pilot-navigation h2').textContent=destination;this.skipButton.textContent='Skip approach →';this.state=motion?'boarding':'ignition';
  if(returning)this.universe.beginReturn();else this.universe.beginFlight(index);const revealDuration=motion?(returning?this.universe.flightTravel.boardingDuration:1.2):0;this.session={returning,stage:motion?0:4,throttle:motion?0:1,autopilot:true,progress:0,elapsed:0,lastAction:0,revealDuration,nextAction:motion?(returning?revealDuration+.15:1.35):0};let prepared=false,error=null,skip=false,arrivalStart=null,last=performance.now();const start=last;this.updateControls(false);
  Promise.resolve().then(prepare).then(()=>prepared=true).catch(e=>{error=e;prepared=true;});
  return new Promise((resolve,reject)=>{
   this.finish=resolve;this.skipButton.onclick=()=>skip=true;
   const done=()=>{if(token!==this.token)return;cancelAnimationFrame(this.frame);try{this.universe.endFlight();}catch(e){error=error||e;}finally{this.root.hidden=true;this.root.classList.remove('arrival');document.body.classList.remove('in-transit');this.session=null;this.state='idle';this.finish=null;}if(error)reject(error);else resolve({cancelled:false});};
   const step=now=>{if(token!==this.token||!this.session)return;try{const s=this.session,dt=Math.max(0,Math.min(.25,(now-last)/1000));last=now;s.elapsed=Math.max(s.elapsed,0,(now-start)/1000);
    if(s.returning){
     // Return navigation is automatic and uses elapsed time, not rendered frames.
     const ignition=s.elapsed-s.revealDuration-.15,stage=Math.max(0,Math.min(4,Math.floor(ignition/.4)+1));
     if(stage!==s.stage){s.stage=stage;s.lastAction=s.revealDuration+.15+Math.max(0,stage-1)*.4;}
     const thrustTime=Math.max(0,s.elapsed-(s.revealDuration+.15+1.2+.65)),ramp=1.05;
     s.throttle=Math.min(1,thrustTime/ramp);const distance=thrustTime<ramp?thrustTime*thrustTime/(2*ramp):thrustTime-ramp/2;
     // Preserve takeoff and the final head movement; accelerate just the flyby leg.
     s.progress=distance<1.44?distance/7.2:distance<3.24?.2+(distance-1.44)/1.8*.7:Math.min(1,.9+(distance-3.24)/.72*.1);
    }else{
     if(s.autopilot&&s.stage<4&&s.elapsed>=s.nextAction)this.activate(s.stage);
     if(s.autopilot&&s.stage===4)s.throttle=motion?Math.max(0,Math.min(1,(s.elapsed-s.lastAction-.5)/.8)):1;
     if(s.stage===4&&s.throttle>.02)s.progress=Math.min(1,s.progress+dt*s.throttle/2.25);
    }
    if(!motion)s.progress=1;if(skip){s.stage=4;s.throttle=1;s.progress=1;}
    this.state=s.elapsed<s.revealDuration?'boarding':s.stage<4?'ignition':s.progress>.92?'approach':s.throttle>.1?'cruise':'armed';
    this.universe.updateFlight(s.progress,{stage:s.stage,throttle:s.throttle,autopilot:s.autopilot,time:s.elapsed,motion,dt});
    this.root.style.setProperty('--ascent-glow',s.returning&&motion?Math.max(0,1-Math.abs(s.progress-.2)/.035):0);
    if(!s.lastUiUpdate||s.elapsed-s.lastUiUpdate>.09){this.updateControls(prepared);s.lastUiUpdate=s.elapsed;}
    if(s.progress>=1&&prepared){if(arrivalStart===null){arrivalStart=now;this.root.classList.add('arrival');}if(now-arrivalStart>(motion&&!skip?260:0)){done();return;}}
    this.frame=requestAnimationFrame(step);
    }catch(e){error=e;done();}
   };this.frame=requestAnimationFrame(step);
  });
 }
 updateControls(prepared){
  const s=this.session;if(!s)return;this.root.querySelector('.pilot-assist').textContent=s.returning?'Automatic return flight · No input required.':'Operate the switches in sequence, then advance the throttle.';this.root.dataset.boarding=String(s.elapsed<s.revealDuration);this.root.querySelectorAll('[data-control]').forEach((el,i)=>{el.classList.toggle('online',i<s.stage);el.classList.toggle('next',i===s.stage);el.disabled=s.returning||i!==s.stage||s.elapsed<s.revealDuration;el.setAttribute('aria-pressed',String(i<s.stage));});
  const auto=this.root.querySelector('#autopilot');auto.disabled=s.returning;auto.textContent=s.returning?'RETURN AUTOPILOT':s.autopilot?'AUTOPILOT ON':'MANUAL CONTROL';auto.setAttribute('aria-pressed',String(s.autopilot));const throttle=this.root.querySelector('#throttle');throttle.disabled=s.returning||s.stage<4;if(document.activeElement!==throttle)throttle.value=Math.round(s.throttle*100);this.root.querySelector('output').textContent=Math.round(s.throttle*100)+'%';
  this.root.querySelector('#pilot-phase').textContent=s.elapsed<s.revealDuration?(s.returning?({approach:'WALKING TO THE SPACECRAFT',hatch:'AIRLOCK / OPENING HATCH',enter:'BOARDING / ENTERING CABIN',seat:'TAKING THE PILOT SEAT'}[this.universe.flightTravel?.boardingPhase]||'WALKING TO THE SPACECRAFT'):'TAKE YOUR SEAT / PREPARING FLIGHT'):s.stage<4?'PRE-FLIGHT / ENGINE START':s.progress>.9&&s.returning?'HOME ORBIT / APPROACHING WINDSHIELD':s.returning&&s.progress>.2?'INTERPLANETARY RETURN / PLANETARY FLYBYS':s.progress>.92?prepared?'FINAL APPROACH / ENTERING DESTINATION':'HOLDING APPROACH / LOADING DESTINATION':s.throttle>.1?'IN FLIGHT / ACCELERATING TO TARGET':'DRIVE ARMED / ADVANCE THROTTLE';
 }
}
