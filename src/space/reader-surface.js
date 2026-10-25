import * as THREE from 'three';

/** A bounded GPU texture showing a viewport onto the complete story. */
export function createReaderSurface(sections,label,accent,{mobile=false,language='en'}={}){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1080;const c=canvas.getContext('2d'),rows=[],top=182,bottom=916,viewport=bottom-top;let y=0;
 const add=(text,font,color,lineHeight)=>{c.font=font;for(const paragraph of String(text).split('\n')){if(!paragraph.trim()){y+=lineHeight*.55;continue;}let line='';for(const word of paragraph.split(/\s+/)){const next=(line+' '+word).trim();if(c.measureText(next).width>1380&&line){rows.push({text:line,y,font,color});y+=lineHeight;line=word;}else line=next;}if(line){rows.push({text:line,y,font,color});y+=lineHeight;}y+=lineHeight*.3;}};
 sections.forEach(([title,body],index)=>{if(index)y+=65;add(title,mobile?'500 61px sans-serif':'500 56px sans-serif','#eff6f3',mobile?79:73);y+=22;add(body,mobile?'400 49px sans-serif':'400 38px sans-serif','#c0d1dc',mobile?71:57);});
 const height=y+25,maxScroll=Math.max(0,height-viewport),texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=4;
 const draw=offset=>{
  const scroll=THREE.MathUtils.clamp(offset,0,maxScroll);c.fillStyle='#0b1520';c.fillRect(0,0,1600,1080);const gradient=c.createRadialGradient(1400,0,0,1400,0,1600);gradient.addColorStop(0,accent+'24');gradient.addColorStop(1,'#07101900');c.fillStyle=gradient;c.fillRect(0,0,1600,1080);
  c.fillStyle=accent;c.fillRect(70,75,8,24);c.font='500 27px sans-serif';c.fillText(label.toUpperCase(),105,99,1400);c.strokeStyle='#7893a444';c.beginPath();c.moveTo(75,143);c.lineTo(1525,143);c.stroke();
  c.save();c.beginPath();c.rect(75,top,1400,viewport);c.clip();c.textBaseline='top';for(const row of rows){const position=top+row.y-scroll;if(position>bottom||position+95<top)continue;c.font=row.font;c.fillStyle=row.color;c.fillText(row.text,75,position);}c.restore();
  if(maxScroll>0){const track=viewport,thumb=Math.max(60,viewport/height*track);c.fillStyle='#89afbf26';c.fillRect(1524,top,5,track);c.fillStyle=accent;c.fillRect(1524,top+(track-thumb)*scroll/maxScroll,5,thumb);}
  const atEnd=scroll>=maxScroll-2;c.fillStyle=accent;c.font=mobile?'500 32px sans-serif':'500 27px sans-serif';c.textBaseline='alphabetic';c.fillText(language==='id'?(maxScroll===0?'Seluruh penjelasan sudah terlihat':atEnd?'Akhir penjelasan · gulir ke atas':'Gulir ke bawah untuk membaca selengkapnya'):(maxScroll===0?'Full story shown':atEnd?'End of story · scroll up':'Scroll down to keep reading'),75,988,1350);
  if(!atEnd){c.strokeStyle=accent;c.lineWidth=4;c.beginPath();c.moveTo(1450,966);c.lineTo(1465,981);c.lineTo(1480,966);c.stroke();}c.fillStyle='#648392';c.font='400 20px sans-serif';c.fillText('OSKHAR / PERSONAL UNIVERSE',75,1040);c.fillText(`${maxScroll?Math.round(scroll/maxScroll*100):100}%`,1455,1040);texture.needsUpdate=true;
 };
 draw(0);return {texture,draw,maxScroll,height,viewport,sections};
}
