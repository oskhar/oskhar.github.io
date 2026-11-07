/** Shared accessible controls for destination experiments. No navigation menu changes. */
export function activityPanel(world,{name,chapters,outcomes,state,description,diagrams}){
 const panel=document.createElement('section');panel.className='chronos-console activity-panel';panel.hidden=true;panel.setAttribute('aria-label',name);document.body.append(panel);
 let signature='';
 function render(){const id=world.language==='id',n=state.selected,c=chapters[n],done=state.choices.filter(v=>v!==null).length,key=[id,n,...state.choices].join();if(key===signature)return;signature=key;
 const focusKey=panel.contains(document.activeElement)?document.activeElement.dataset.control:null;
 panel.replaceChildren();
 const add=(tag,text,parent=panel)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
 add('small',`${name} · ${done}/${chapters.length}`);
 const nav=add('div','');nav.className='chronos-chapters';nav.setAttribute('aria-label',id?'Bab aktivitas':'Activity chapters');
 const button=(parent,text,key,fn)=>{const b=add('button',text,parent);b.type='button';b.dataset.control=key;b.onclick=fn;return b;};
 chapters.forEach((ch,i)=>{const b=button(nav,String(i+1).padStart(2,'0')+(state.choices[i]!==null?' ✓':''),'chapter-'+i,()=>{state.selected=i;world.universe.release();world.universe.visitExhibit(i);render();});b.ariaLabel=ch[id?0:1];b.setAttribute('aria-pressed',String(i===n));});
 add('h2',c[id?0:1]);add('p',description[id?0:1]);
 const controls=add('div','');controls.className='chronos-options';c[id?2:3].forEach((label,i)=>{const b=button(controls,label,'choice-'+i,()=>{state.choices[n]=i;render();});b.setAttribute('aria-pressed',String(state.choices[n]===i));});
 const choice=state.choices[n];
 if(choice!==null){const diagram=add('ol','');diagram.className='activity-diagram';for(const step of diagrams[n][id?0:1][choice])add('li',step,diagram);}
 const result=add('p',choice===null?(id?'Pilih skenario untuk menjalankan demonstrasi.':'Choose a scenario to run the demonstration.'):outcomes[n][id?0:1][choice]);result.setAttribute('role','status');
 if(done===chapters.length)add('p',id?'Semua zona telah dieksplorasi. Coba skenario lain untuk membandingkan hasil.':'Every zone explored. Try another scenario to compare outcomes.');
 button(panel,id?'Baca cerita pengalaman ↗':'Read the experience ↗','read',()=>{world.universe.release();world.universe.sit(world.interactables[n]);window.dispatchEvent(new Event('chronos-reading'));});
 button(panel,id?'Ulangi bab ini':'Reset this chapter','reset',()=>{state.choices[n]=null;render();});
 add('small',id?'Ilustrasi konseptual · data dan aturan fiktif':'Conceptual illustration · fictional data and rules');
 if(focusKey)panel.querySelector(`[data-control="${focusKey}"]`)?.focus({preventScroll:true});
 }
 // World update also runs with zero delta in reduced motion; results never depend on animation.
 world.animations.push(()=>{panel.hidden=world.universe.world!==world||world.universe.mode!=='world'||world.universe.suspended||world.universe.seated;if(!panel.hidden)render();});
 // Hide immediately on route changes, including while the old world stops updating.
 window.addEventListener('hashchange',()=>{panel.hidden=true;});
 return panel;
}
