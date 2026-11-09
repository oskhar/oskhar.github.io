// World units are metres. District plateaus and roads share this height function.
export const NOVA_RADIUS = 190;
export const districts = [
 {id:'finance',x:-69,z:-46,color:0xffc778,biome:{id:'Mesa tembaga',en:'Copper mesas'},name:{id:'Benteng Finansial',en:'Finance Citadel'},metaphor:{id:'Empat menara CAPEX, OPEX, G-SMART dan OCX 2.0 terhubung jembatan persetujuan. Lapisan bangunan mewakili tahapan anggaran dan integrasi enterprise.',en:'Four CAPEX, OPEX, G-SMART and OCX 2.0 towers connected by approval bridges. Building tiers represent budgeting stages and enterprise integrations.'}},
 {id:'monitoring',x:62,z:-60,color:0x83dce8,biome:{id:'Ngarai observasi',en:'Observation canyon'},name:{id:'Ngarai Sentinel',en:'Sentinel Canyon'},metaphor:{id:'Menara observasi memindai koridor bus TransJakarta. Aliran cahaya menuju pusat kendali menggambarkan pemrosesan real-time, analitik AI, dan pesan Kafka.',en:'Observation towers scan a TransJakarta bus corridor. Light streams into mission control represent real-time processing, AI analytics and Kafka messaging.'}},
 {id:'commerce',x:-94,z:42,color:0xf1a47d,biome:{id:'Dataran terakota',en:'Terracotta flats'},name:{id:'Pasar Muvie',en:'Muvie Exchange'},metaphor:{id:'Tiga cabang pasar dihubungkan jalur kargo. Peti stok, terminal kasir, dan gudang pusat memvisualisasikan penjualan, perpindahan inventori, serta pelaporan multi-cabang.',en:'Three market branches linked by cargo routes. Stock crates, sales terminals and a central depot visualize sales, inventory transfers and multi-branch reporting.'}},
 {id:'health',x:78,z:49,color:0xa6e3ad,biome:{id:'Oasis kehidupan',en:'Living oasis'},name:{id:'Oasis Priuk',en:'Priuk Oasis'},metaphor:{id:'Klinik, kebun nutrisi, dan paviliun edukasi mengelilingi sumber air. Tiga pilar grafik pertumbuhan mewakili penilaian WHO Z-score dalam pencegahan stunting.',en:'A clinic, nutrition gardens and education pavilion surround a water source. Three growth-chart pillars represent WHO Z-score assessments in stunting prevention.'}},
 {id:'infrastructure',x:0,z:-122,color:0x9ab9ff,biome:{id:'Dataran garam',en:'Salt basin'},name:{id:'Stasiun Pulse',en:'Pulse Station'},metaphor:{id:'Rak server berdenyut menuju antena pusat. Panel surya dan menara telemetri mewakili pemantauan infrastruktur dan aplikasi terpusat, API, serta operasional Linux dan Docker.',en:'Server racks pulse toward a central antenna. Solar arrays and telemetry towers represent centralized infrastructure and application monitoring, APIs, Linux and Docker operations.'}},
 {id:'architecture',x:0,z:123,color:0xd0b1fa,biome:{id:'Lembah obsidian',en:'Obsidian valley'},name:{id:'Lembah Arsitektur',en:'Architecture Valley'},metaphor:{id:'Satu monolit berhadapan dengan gugus microservices. Jalur baca dan tulis yang terpisah serta cincin arsip peristiwa menggambarkan CQRS dan event sourcing sebagai objek perbandingan riset.',en:'A monolith faces a microservice cluster. Separate read and write routes and an event archive ring illustrate CQRS and event sourcing as subjects of comparative research.'}}
];
export const vehicles = [
 {id:'rover',name:'DUNE / 06',color:0xe9b980,maxSpeed:22,acceleration:10,turn:1.65,grip:7,description:{id:'Rover enam roda · stabil dan seimbang',en:'Six-wheel rover · stable and balanced'}},
 {id:'buggy',name:'SCOUT / 02',color:0x91dfd0,maxSpeed:32,acceleration:15,turn:2.2,grip:5,description:{id:'Buggy ringan · cepat dan lincah',en:'Light buggy · fast and agile'}},
 {id:'skimmer',name:'MIRAGE / 01',color:0xbeb2ff,maxSpeed:27,acceleration:12,turn:1.4,grip:3.5,description:{id:'Hovercraft · meluncur dengan lembut',en:'Hovercraft · smooth gliding'}}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function terrainHeight(x,z){
 // Flatten the hub, district interiors and radial trails; dunes rise between them.
 let flat=clamp((Math.hypot(x,z)-25)/18,0,1);
 for(const d of districts){flat=Math.min(flat,clamp((Math.hypot(x-d.x,z-d.z)-23)/13,0,1));const t=clamp((x*d.x+z*d.z)/(d.x*d.x+d.z*d.z),0,1);flat=Math.min(flat,clamp((Math.hypot(x-d.x*t,z-d.z*t)-4)/9,0,1));}
 return flat===0?0:flat*(2.2+Math.sin(x*.065+Math.sin(z*.035))*1.8+Math.sin(z*.09+x*.022)*1.5+Math.cos(x*.12-z*.045)*.6);
}
export function createDriveState(x=0,z=0,yaw=0){return {x,z,yaw,speed:0,distance:0};}
export function stepDrive(s,input,vehicle,dt,blocked=()=>false){
 dt=clamp(dt,0,.05);const throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1);
 if(throttle)s.speed+=throttle*vehicle.acceleration*dt;else s.speed*=Math.exp(-vehicle.grip*.24*dt);
 if(input.brake)s.speed*=Math.exp(-9*dt);
 s.speed=clamp(s.speed,-vehicle.maxSpeed*.38,vehicle.maxSpeed*(input.boost?1.3:1));
 s.yaw-=steer*vehicle.turn*dt*clamp(s.speed/6,-1,1);
 // Small substeps keep thin walls solid even at the fastest boost speed.
 const steps=Math.max(1,Math.ceil(Math.abs(s.speed*dt)/.25));
 for(let i=0;i<steps;i++){const dx=-Math.sin(s.yaw)*s.speed*dt/steps,dz=-Math.cos(s.yaw)*s.speed*dt/steps,nx=s.x+dx,nz=s.z+dz;
  if(Math.hypot(nx,nz)>NOVA_RADIUS-4||blocked(nx,nz)){s.speed=0;break;}s.x=nx;s.z=nz;s.distance+=Math.hypot(dx,dz);
 }
 return s;
}
