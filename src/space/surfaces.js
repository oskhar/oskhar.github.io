import * as THREE from 'three';
function wrap(ctx,text,x,y,maxWidth,lineHeight){
 for(const paragraph of String(text).split('\n')){let line='';for(const word of paragraph.split(' ')){const next=line+word+' ';if(ctx.measureText(next).width>maxWidth&&line){ctx.fillText(line.trim(),x,y);y+=lineHeight;line=word+' ';}else line=next;}ctx.fillText(line.trim(),x,y);y+=lineHeight;}return y;
}
export function boardTexture(card,accent,{mobile=false}={}){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1080;const c=canvas.getContext('2d');
 c.fillStyle='#0b1520';c.fillRect(0,0,1600,1080);const gradient=c.createRadialGradient(1400,0,0,1400,0,1600);gradient.addColorStop(0,accent+'24');gradient.addColorStop(1,'#07101900');c.fillStyle=gradient;c.fillRect(0,0,1600,1080);
 c.fillStyle=accent;c.fillRect(70,75,9,24);c.font='500 25px sans-serif';c.fillText(card.label.toUpperCase(),105,98);c.strokeStyle='#7893a433';c.beginPath();c.moveTo(75,143);c.lineTo(1525,143);c.stroke();
 c.font='500 73px sans-serif';c.fillStyle='#f0f5f4';let y=wrap(c,card.title,75,245,1430,88)+25;
 if(card.subtitle){c.font='400 32px sans-serif';c.fillStyle=accent;y=wrap(c,card.subtitle,75,y,1430,43)+35;}
 c.font=mobile?'400 51px sans-serif':'400 35px sans-serif';c.fillStyle='#b7c8d3';wrap(c,card.body,75,y+15,1420,mobile?73:53);
 c.font='400 24px sans-serif';c.fillStyle=accent;c.fillText((card.tags||[]).join('   /   '),75,990);c.fillStyle='#5b788a';c.font='400 19px sans-serif';c.fillText('OSKHAR   /   PERSONAL UNIVERSE',75,1040);
 const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=4;return texture;
}
