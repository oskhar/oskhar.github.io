import { portfolioNotes } from './banking-notes.js';
import { content, projects } from './content.js';

export const routes = ['origin', 'chronos', 'nova', 'atlas', 'station'];
export const worldNames = {
 en:['The Origin Home','The Chronos Archive','The Nova Hangar','The Atlas Laboratory','Orbital Mission Control'],
 id:['Rumah Origin','Arsip Chronos','Hanggar Nova','Laboratorium Atlas','Pusat Kendali Orbital'],
};
export function exhibitsFor(index, language) {
 const c=content[language], id=language==='id';
 if(index===0)return [
  {title:'Muhamad Oskhar Mubarok',label:'01 / SOFTWARE ENGINEER',body:c.about,tags:['Backend engineering','Enterprise systems','West Jakarta']},
  {title:id?'Misi saat ini':'The current mission',label:'02 / OCBC INDONESIA',body:c.about2,tags:['Corporate banking','Cross-border transactions']},
  {title:c.education,label:'03 / EDUCATION',subtitle:c.school,body:c.thesis,tags:['Microservices','CQRS','Event sourcing']},
  {title:c.achievement,label:'04 / ACHIEVEMENT',body:c.achievementDetail+'\n\n'+c.community+'\n'+c.communityDetail,tags:['Problem solving','Community']},
  {title:'Web Development',label:'05 / CERTIFICATION',body:'Frontend & Backend Specialization\nGoogle Developer Student Club\nDecember 2023 – February 2024',tags:['Frontend','Backend']},
 ];
 if(index===1)return portfolioNotes(1,language);
 if(index===2)return [...projects.map((p,n)=>({title:p.name,label:`0${n+1} / ${p.category}`,body:p[language],tags:p.tags})),
  {title:id?'Pemantauan Infrastruktur Terpusat':'Centralized Infrastructure Monitoring',label:'05 / CV GHINA MULTIPRIMA',body:id?'Backend Engineer Intern pada April–Juli 2025, mengembangkan API dan layanan untuk pemantauan infrastruktur serta aplikasi terpusat. Teknologi mencakup Python, FastAPI, Express.js, dan Java. Pekerjaan mendukung pengumpulan serta pemrosesan metrik operasional, administrasi Linux, deployment Docker, pengujian, debugging, dan dokumentasi.':'Backend Engineer Intern from April to July 2025, building APIs and services for centralized infrastructure and application monitoring. Technologies included Python, FastAPI, Express.js and Java. The work supported operational metric collection and processing, Linux administration, Docker deployment, testing, debugging and documentation.',tags:['FastAPI','Monitoring','Linux']},
  {title:id?'Evaluasi Arsitektur Backend':'Backend Architecture Evaluation',label:'06 / UIN SYARIF HIDAYATULLAH JAKARTA',body:id?'Penelitian skripsi membandingkan monolit dengan arsitektur hybrid yang menggabungkan microservices, CQRS, dan event sourcing pada aplikasi intensif data. Evaluasi mempertimbangkan performa, karakteristik arsitektur, serta pengalaman pengembang. Fokusnya memahami trade-off pola arsitektur dengan kebutuhan aplikasi dan proses pengembangan.':'Thesis research comparing a monolithic baseline with a hybrid architecture combining microservices, CQRS and event sourcing in data-intensive applications. The evaluation considered performance, architectural characteristics and developer experience, focusing on trade-offs between architecture patterns, application requirements and the development process.',tags:['Research','CQRS','Event sourcing']}];
 if(index===3)return portfolioNotes(3,language);
 return [
  {title:id?'Mari berkolaborasi.':'Let’s build together.',label:'01 / COMMUNICATION',body:c.contactText+'\n\nmuhamadoskharm@gmail.com',tags:[id?'E untuk mengirim email':'E to send an email'],url:'mailto:muhamadoskharm@gmail.com'},
  {title:'GitHub / oskhar',label:'02 / SOURCE CODE',body:id?'Jelajahi repository dan karya pengembangan saya di GitHub.':'Explore my repositories and development work on GitHub.',tags:[id?'E untuk membuka GitHub':'E to open GitHub'],url:'https://github.com/oskhar'},
  {title:'LinkedIn / oskhar',label:'03 / PROFESSIONAL NETWORK',body:id?'Terhubung untuk peluang profesional dan kolaborasi.':'Connect for professional opportunities and collaboration.',tags:[id?'E untuk membuka LinkedIn':'E to open LinkedIn'],url:'https://linkedin.com/in/oskhar'},
  {title:id?'Perjalanan lengkap':'The complete journey',label:'04 / CURRICULUM VITAE',body:c.location+'\n\n'+(id?'Baca sumber CV untuk riwayat pengalaman dan pendidikan lengkap.':'Read the source CV for the full experience and education history.'),tags:[id?'E untuk membaca CV':'E to read CV'],url:import.meta.env.BASE_URL+'cv.md'},
 ];
}
