import * as THREE from 'three';

const vertex=`varying vec3 viewNormal;varying vec3 viewDirection;void main(){vec4 p=modelViewMatrix*vec4(position,1.);viewNormal=normalize(normalMatrix*normal);viewDirection=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`;
const fragment=`uniform vec3 tint;uniform float strength;uniform float time;varying vec3 viewNormal;varying vec3 viewDirection;void main(){float rim=pow(1.-abs(dot(normalize(viewNormal),normalize(viewDirection))),2.3);float breath=.93+.07*sin(time*1.8);gl_FragColor=vec4(tint,(.045+rim*.7)*strength*breath);}`;

/** Soft surface highlights for the current homepage target. No decorative orbit rings. */
export class HomeOrbitHighlight {
 constructor(scene,destinations,bodies){
  this.group=new THREE.Group();this.group.name='homepage-hover-glow';scene.add(this.group);this.time=0;
  this.highlights=destinations.map((d,index)=>{
   const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{tint:{value:new THREE.Color(d.color).lerp(new THREE.Color(0xdff7ff),.3)},strength:{value:0},time:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
   let glow;
   if(d.type==='station'){glow=bodies[index].clone(true);glow.traverse(o=>{if(o.isMesh){o.material=material;o.castShadow=false;o.receiveShadow=false;o.scale.multiplyScalar(1.035);}});}
   else{glow=new THREE.Mesh(new THREE.SphereGeometry(d.radius*1.045,48,32),material);glow.position.fromArray(d.position);}
   glow.name=`target-glow-${index}`;glow.visible=false;this.group.add(glow);return {glow,material,index,strength:0,body:bodies[index]};
  });
 }
 update(dt,visible,selected=-1,motion=true){
  this.group.visible=visible;this.time+=motion?dt:0;
  for(const highlight of this.highlights){
   const target=visible&&selected===highlight.index?1:0;highlight.strength=visible?THREE.MathUtils.lerp(highlight.strength,target,motion?1-Math.exp(-dt*14):1):0;
   if(highlight.strength<.002)highlight.strength=0;highlight.glow.visible=highlight.strength>0;highlight.material.uniforms.strength.value=highlight.strength;highlight.material.uniforms.time.value=this.time;
   if(highlight.index===4)highlight.glow.rotation.copy(highlight.body.rotation);
  }
 }
}
