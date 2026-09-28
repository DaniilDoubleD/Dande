import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';import fs from 'fs';
const [file,out,...ts]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.cwd()+'/'+file+'?render');fs.mkdirSync(out,{recursive:true});
for(const t of ts){const d=await p.evaluate(t=>{renderAt(+t);return document.getElementById('c').toDataURL('image/png')},t);fs.writeFileSync(`${out}/s_${t}.png`,Buffer.from(d.split(',')[1],'base64'))}
await b.close();
