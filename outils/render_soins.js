const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname,'soins.json'),'utf8')).filter(r=>r[8]);
const TAG={gammes:'Gamme complète',nettoyants:'Soin nettoyant',cremes:'Soin du visage',masques:'Masque et gommage','yeux-levres':'Yeux et lèvres',solaires:'Protection solaire',hydrolats:'Hydrolat naturel',autres:'Hygiène dentaire'};
const oils = raw.map(r=>[r[1],r[1],r[2],r[3],r[7],r[9],TAG[r[6]]]);
const only = process.argv[2];
const leaf = c => `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15Z" fill="${c}" opacity=".9"/><path d="M5 19 14 10" stroke="#fff" stroke-width="1.2" fill="none"/></svg>`;
function html(o){
  const [file,id,pre,name,acc,ben,tag]=o;
  const img='file://'+path.join(__dirname,'cut_soins',file+'.png');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box} body{width:960px;height:1200px;overflow:hidden;font-family:Poppins,sans-serif}
  .bg{position:absolute;inset:0;background:
    radial-gradient(ellipse 60% 45% at 50% 52%, #FFFBF2 0%, rgba(255,248,232,.0) 70%),
    radial-gradient(ellipse 120% 90% at 50% 40%, #FBEFD8 0%, #F2DDB2 55%, #E2BE7E 100%);}
  .rays{position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 46%, rgba(255,255,255,.10) 0 4deg, rgba(255,255,255,0) 4deg 12deg);mask:radial-gradient(circle at 50% 46%, #000 0, transparent 60%);-webkit-mask:radial-gradient(circle at 50% 46%, #000 0, transparent 60%)}
  svg.swirl{position:absolute;inset:0}
  .head{position:absolute;top:150px;left:0;right:0;text-align:center;color:#3B1F12}
    .pre{font-family:'TeX Gyre Pagella';letter-spacing:.32em;text-transform:uppercase;font-size:26px;color:#7A5530}
  .name{font-family:'TeX Gyre Pagella';text-transform:uppercase;letter-spacing:.04em;font-size:72px;line-height:1.05;margin:8px auto 0;white-space:nowrap;display:inline-block}
  .rule{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px}
  .rule i{display:block;width:70px;height:1.5px;background:linear-gradient(90deg,transparent,#B48A3C)}
  .rule i:last-child{transform:scaleX(-1)}
  .script{font-family:'TeX Gyre Chorus';font-size:48px;color:#8E1B33;line-height:1}
  .stage{position:absolute;left:0;right:0;top:340px;height:690px}
  .glow{position:absolute;left:50%;top:40px;width:520px;height:520px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,#FFFDF6 0%,rgba(255,250,235,.6) 40%,rgba(255,250,235,0) 70%)}
  .ped{position:absolute;left:50%;transform:translateX(-50%);bottom:24px;width:560px;height:110px}
  .ped .top{position:absolute;inset:0 0 auto 0;height:70px;border-radius:50%;background:radial-gradient(ellipse at 40% 35%,#FFFFFF 0%,#F4ECE0 55%,#E3D3BC 100%);box-shadow:0 0 0 2px #C9A45C inset}
  .ped .side{position:absolute;left:0;right:0;top:35px;height:75px;background:linear-gradient(90deg,#D9C6A6,#F7F0E4 35%,#FFFFFF 50%,#EADCC4 75%,#CDB58C);border-radius:0 0 50% 50%/0 0 40% 40%;border-bottom:2px solid #C9A45C}
  .shadow{position:absolute;left:50%;bottom:92px;width:260px;height:30px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(60,30,10,.45),rgba(60,30,10,0) 70%)}
  .bottle{position:absolute;left:50%;bottom:100px;transform:translateX(-50%);filter:drop-shadow(0 18px 22px rgba(70,35,10,.28))}px;filter:drop-shadow(0 18px 22px rgba(70,35,10,.28))}
  .dots{position:absolute;inset:0}
  .ben{position:absolute;left:40px;right:40px;bottom:58px;display:flex;justify-content:center;gap:18px}
  .b{flex:1;max-width:280px;display:flex;align-items:center;gap:10px;background:rgba(255,252,245,.82);border:1.5px solid #D2B477;border-radius:999px;padding:12px 18px 12px 12px;font-size:21px;line-height:1.2;color:#3B1F12;font-weight:500}
  .b svg{flex:0 0 30px}
  </style></head><body>
  <div class="bg"></div><div class="rays"></div>
  <svg class="swirl" viewBox="0 0 960 1200"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#E9C77F" stop-opacity="0"/><stop offset=".5" stop-color="#C99A3E"/><stop offset="1" stop-color="#F3DCA0" stop-opacity="0"/></linearGradient></defs>
   <path d="M-40 760 C 160 600, 260 900, 470 760 S 820 560, 1000 700" stroke="url(#g)" stroke-width="22" fill="none" opacity=".55"/>
   <path d="M-40 800 C 180 660, 300 950, 500 800 S 840 620, 1000 760" stroke="url(#g)" stroke-width="6" fill="none" opacity=".7"/>
   <path d="M1000 420 C 820 520, 760 380, 620 470" stroke="url(#g)" stroke-width="10" fill="none" opacity=".45"/>
   <path d="M-40 430 C 140 520, 200 380, 340 470" stroke="url(#g)" stroke-width="10" fill="none" opacity=".45"/>
   ${[[150,560,9],[820,600,7],[200,680,5],[760,500,6],[110,470,4],[860,700,5],[300,420,4],[690,420,4]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#F7E2A8" stroke="#C99A3E" stroke-width="1.2" opacity=".85"/>`).join('')}
   ${[[120,620],[850,560],[230,520],[730,650]].map(([x,y],i)=>`<path transform="translate(${x} ${y}) rotate(${i*70-40}) scale(1.6)" d="M0 14C0 5 6 0 15 -1c-1 9-6 15-15 15Z" fill="${acc}" opacity=".55"/>`).join('')}
  </svg>
  <div class="head"><div class="pre">${pre}</div><div class="name">${name}</div>
   <div class="rule"><i></i><span class="script">${tag}</span><i></i></div></div>
  <div class="stage"><div class="glow"></div><div class="ped"><div class="side"></div><div class="top"></div></div><div class="shadow"></div><img class="bottle" src="${img}"></div>
  <div class="ben">${ben.map(t=>`<div class="b">${leaf(acc)}<span>${t}</span></div>`).join('')}</div>
  <script>const im=document.querySelector('.bottle');function fit(){const k=Math.min(660/im.naturalWidth,560/im.naturalHeight,1.9);im.style.width=(im.naturalWidth*k)+'px';im.style.height=(im.naturalHeight*k)+'px';document.body.dataset.ok=1}if(im.complete)fit();else im.onload=fit;const n=document.querySelector('.name');let f=72;while(n.offsetWidth>520&&f>30){f-=2;n.style.fontSize=f+'px'}</script></body></html>`;
}
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:960,height:1200}});
  fs.mkdirSync(path.join(__dirname,'out_soins'),{recursive:true});
  for(const o of oils){ if(only && o[1]!==only) continue;
    const f=path.join(__dirname,'tmp.html'); fs.writeFileSync(f,html(o));
    await p.goto('file://'+f); await p.waitForSelector('body[data-ok]'); await p.waitForTimeout(100);
    await p.screenshot({path:path.join(__dirname,'out_soins',o[1]+'.png')}); console.log(o[1]); }
  await b.close();
})();
