// Clicks RENDER in the Motion Canvas editor and waits until frames stop appearing.
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const count=()=>{try{return fs.readdirSync('output/project').length}catch{return 0}};
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))console.log('CONSOLE',m.text())});
await p.goto('http://localhost:9000/');await p.waitForTimeout(4000);
await p.click('button:has-text("RENDER")');
let last=-1,stable=0,waited=0;
while(stable<6){await p.waitForTimeout(1000);waited++;const n=count();if(n===0&&waited>90){console.log('NO FRAMES - scene error');await b.close();process.exit(1)}if(n===last&&n>0)stable++;else stable=0;last=n}
console.log('frames',last);await b.close();
