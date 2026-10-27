// Studio Écrin Beauté — visuels produits composés (packshot sans texte + carte bienfaits)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = __dirname;

// ---------- Données ----------
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync('/home/claude/acilla-site/data/catalogue.js', 'utf8'), ctx);
const cat = {}; ctx.window.CATALOGUE.produits.forEach(p => cat[p.id] = p);
const items = [];
for (const [file, id, pre, name, acc, ben] of JSON.parse(fs.readFileSync(path.join(D, 'oils.json'), 'utf8')))
  items.push({ id, kind: 'huile', pre, name, acc, ben });
const LIGNE = { gammes: 'Gamme complète', nettoyants: 'Nettoyant visage', cremes: 'Soin du visage', masques: 'Masque visage', 'yeux-levres': 'Yeux et lèvres', solaires: 'Protection solaire', hydrolats: 'Hydrolat', autres: 'Hygiène dentaire' };
for (const r of JSON.parse(fs.readFileSync(path.join(D, 'soins.json'), 'utf8')))
  if (r[8]) items.push({ id: r[1], kind: 'soin', pre: r[2], name: r[3], acc: r[7], ben: r[9], sc: r[6] });

// ---------- Palettes ----------
const PAL = {
  huile: { wall1: '#F6EADB', wall2: '#EBD6BF', floor1: '#E9D2B8', floor2: '#DDBF9F', niche: 'rgba(120,80,40,.10)', label: 'Huile végétale' },
  soin:  { wall1: '#F7E9E6', wall2: '#EDD5CF', floor1: '#EBD3CB', floor2: '#DFC0B6', niche: 'rgba(120,50,50,.10)', label: 'Soin' },
};

const grain = (op, f = 0.9) => `<svg class="grain" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="g${Math.round(f*100)}"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .18  0 0 0 ${op} 0"/></filter><rect width="100%" height="100%" filter="url(#g${Math.round(f*100)})"/></svg>`;

const trav = (base, op) => `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
  <filter id="trav" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="4" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .36  0 0 0 .9 -.25" result="veins"/>
    <feTurbulence type="turbulence" baseFrequency="0.09 0.35" numOctaves="2" seed="3" result="h"/>
    <feColorMatrix in="h" type="matrix" values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .28  0 0 0 -6 3.2" result="holes"/>
    <feMerge><feMergeNode in="veins"/><feMergeNode in="holes"/></feMerge>
  </filter>
  <rect width="100%" height="100%" fill="${base}"/><rect width="100%" height="100%" filter="url(#trav)" opacity="${op}"/>
</svg>`;

const leaves = `<svg class="leaves" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><g fill="#6b4a36">
  ${Array.from({ length: 14 }, (_, i) => { const a = i * 23 - 60, x = 300 + Math.cos(i) * 170, y = 260 + Math.sin(i * 1.7) * 170; return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(50 + (i % 4) * 12)}" ry="${(16 + (i % 3) * 4)}" transform="rotate(${a} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }).join('')}
  <path d="M40 560 C 200 420, 320 300, 560 80" stroke="#6b4a36" stroke-width="7" fill="none"/></g></svg>`;

function scene(it, mode) {
  const P = PAL[it.kind];
  const img = 'file://' + path.join(D, 'cut_all', it.id + '.png');
  const isText = mode === 'benefits';
  const tag = it.kind === 'huile' ? (it.id === 'huile-anti-moustique' ? 'Aux huiles naturelles' : 'Huile végétale · 100 % naturelle') : LIGNE[it.sc];
  const p = cat[it.id] || {};
  const cont = p.contenance ? p.contenance : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:Poppins,sans-serif;color:#3A1F17}
  .wall{position:absolute;inset:0 0 330px 0;background:linear-gradient(180deg,${P.wall1} 0%,${P.wall2} 100%)}
  .floor{position:absolute;left:0;right:0;bottom:0;height:330px;background:linear-gradient(180deg,${P.floor1},${P.floor2})}
  .floor::before{content:"";position:absolute;inset:0 0 auto 0;height:2px;background:rgba(90,50,30,.10)}
  .grain{position:absolute;inset:0;mix-blend-mode:multiply;pointer-events:none}
  .light{position:absolute;left:-200px;top:-120px;width:900px;height:1500px;transform:rotate(-28deg);
    background:linear-gradient(90deg,rgba(255,250,240,0) 0%,rgba(255,250,240,.55) 30%,rgba(255,250,240,.55) 62%,rgba(255,250,240,0) 100%);filter:blur(30px);mix-blend-mode:screen}
  .bars{position:absolute;left:-120px;top:-200px;width:1400px;height:1800px;transform:rotate(-28deg);
    background:repeating-linear-gradient(90deg,rgba(110,70,45,0) 0 210px,rgba(110,70,45,.07) 210px 238px);filter:blur(14px);mix-blend-mode:multiply}
  .niche{position:absolute;left:${isText ? 560 : 250}px;width:${isText ? 460 : 580}px;top:${isText ? 300 : 170}px;bottom:330px;border-radius:999px 999px 0 0;
    background:linear-gradient(90deg,${P.niche},rgba(0,0,0,0) 40%,rgba(255,255,255,.18) 100%);box-shadow:inset 18px 10px 40px rgba(90,50,30,.12)}
  .leaves{position:absolute;right:-140px;top:-80px;width:720px;height:720px;opacity:.10;filter:blur(9px);mix-blend-mode:multiply;transform:rotate(12deg)}
  .ped{position:absolute;left:${isText ? 790 : 540}px;transform:translateX(-50%);bottom:${isText ? 200 : 190}px;width:${isText ? 400 : 560}px;height:${isText ? 150 : 175}px}
  .ped .side{position:absolute;left:0;right:0;top:${isText ? 34 : 46}px;bottom:0;border-radius:0 0 50% 50%/0 0 26% 26%;overflow:hidden}
  .ped .side svg{position:absolute;inset:0}
  .ped .side::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,250,240,.35),rgba(255,255,255,0) 30%,rgba(70,40,20,.12) 70%,rgba(60,32,16,.34)),linear-gradient(180deg,rgba(60,32,16,.18),rgba(0,0,0,0) 30%)}
  .ped .top{position:absolute;left:0;right:0;top:0;height:${isText ? 68 : 92}px;border-radius:50%;overflow:hidden}
  .ped .top svg{position:absolute;inset:0;transform:scaleY(.5)}
  .ped .top::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 30% 35%,rgba(255,255,255,.55),rgba(255,255,255,.05) 65%,rgba(60,35,20,.10));border-radius:50%;box-shadow:inset 0 -3px 0 rgba(255,255,255,.6),inset 0 2px 6px rgba(80,50,30,.10)}
  .floorshadow{position:absolute;left:${isText ? 790 : 540}px;bottom:${isText ? 168 : 150}px;width:${isText ? 520 : 720}px;height:80px;transform:translateX(-46%);border-radius:50%;background:radial-gradient(ellipse,rgba(70,40,20,.35),rgba(70,40,20,0) 70%);filter:blur(6px)}
  .prod{position:absolute;left:${isText ? 790 : 540}px;transform:translateX(-50%);bottom:${isText ? 296 : 316}px}
  .prod img.p{display:block;position:relative;z-index:2;filter:drop-shadow(-6px 10px 12px rgba(60,30,15,.18))}
  .prod img.cast{position:absolute;left:0;bottom:0;z-index:1;filter:brightness(0) blur(10px);opacity:.16;transform-origin:50% 100%;transform:skewX(-58deg) scaleY(.26)}
  .contact{position:absolute;left:50%;bottom:-10px;transform:translateX(-50%);height:26px;border-radius:50%;background:radial-gradient(ellipse,rgba(50,25,10,.55),rgba(50,25,10,0) 70%);filter:blur(3px);z-index:1}
  /* texte */
  .txt{position:absolute;left:84px;top:150px;width:470px}
  .eyebrow{font-size:20px;letter-spacing:.18em;color:#9A6B3A;font-weight:500}
  .title{font-family:'TeX Gyre Pagella';font-size:72px;line-height:1.02;margin-top:22px;color:#3A1F17}
  .title small{display:block;font-size:34px;letter-spacing:.02em;color:#7A4E3A;margin-bottom:6px}
  .rule{width:90px;height:2px;background:#B48A3C;margin:34px 0 34px}
  .ben{list-style:none;padding:0;margin:0}
  .ben li{display:flex;gap:18px;align-items:flex-start;font-size:30px;line-height:1.25;margin-bottom:26px;color:#4A2A20}
  .ben li::before{content:"";flex:0 0 14px;height:14px;margin-top:11px;border-radius:50%;background:${it.acc};box-shadow:0 0 0 5px rgba(180,138,60,.18)}
  .foot{position:absolute;left:84px;bottom:92px;font-size:22px;color:#7A4E3A;letter-spacing:.04em}
  .foot b{font-weight:600;color:#3A1F17}
  .brand{position:absolute;right:84px;bottom:92px;font-family:'TeX Gyre Chorus';font-size:44px;color:#8E1B33}
  </style></head><body>
  <div class="wall">${grain(.10)}</div><div class="floor">${grain(.14, 1.1)}</div>
  <div class="light"></div><div class="bars"></div>${leaves}
  <div class="niche"></div>
  <div class="floorshadow"></div>
  <div class="ped"><div class="side">${trav("#CFB394",.65)}</div><div class="top">${trav("#F4EADC",.28)}</div></div>
  <div class="prod"><img class="cast" src="${img}"><img class="p" src="${img}"><div class="contact"></div></div>
  ${isText ? `<div class="txt"><div class="eyebrow">${tag.toUpperCase()}</div>
     <div class="title"><small>${it.pre}</small>${it.name}</div><div class="rule"></div>
     <ul class="ben">${it.ben.map(b => `<li>${b}</li>`).join('')}</ul></div>
     <div class="foot">${cont ? `<b>${cont}</b> · ` : ''}Acilla</div>` : ''}
  <script>
   const im=[...document.querySelectorAll('.prod img')];const n=im[1];
   function fit(){const mw=${isText ? 400 : 430}, mh=${isText ? 500 : 640};const k=Math.min(mw/n.naturalWidth,mh/n.naturalHeight,${isText ? 1.6 : 1.9});
     im.forEach(i=>{i.style.width=(n.naturalWidth*k)+'px';i.style.height=(n.naturalHeight*k)+'px'});
     document.querySelector('.contact').style.width=(n.naturalWidth*k*0.95)+'px';document.body.dataset.ok=1}
   if(n.complete)fit();else n.onload=fit;
  </script></body></html>`;
}

(async () => {
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  const outDir = path.join(D, 'studio_out'); fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const it of items) {
    if (only && !only.includes(it.id)) continue;
    for (const mode of ['packshot', 'benefits']) {
      const f = path.join(D, 'tmp_studio.html'); fs.writeFileSync(f, scene(it, mode));
      await pg.goto('file://' + f); await pg.waitForSelector('body[data-ok]'); await pg.waitForTimeout(120);
      await pg.screenshot({ path: path.join(outDir, `${it.id}-${mode}.png`) });
    }
    console.log(it.id);
  }
  await b.close();
})();
