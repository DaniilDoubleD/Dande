import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.env.VW||1080),height:+(process.env.VH||1920)}});
await p.goto('file://'+process.cwd()+'/'+(process.argv[2]||'index.html')+'?render');
console.log(await p.evaluate(()=>window.DATA));
fs.mkdirSync('frames',{recursive:true});
const NF=+(process.argv[3]||450);for(let i=0;i<NF;i++){const d=await p.evaluate(t=>{renderAt(t);return document.getElementById('c').toDataURL('image/png')},i/30);fs.writeFileSync(`frames/f${String(i).padStart(4,'0')}.png`,Buffer.from(d.split(',')[1],'base64'))}
await b.close();
