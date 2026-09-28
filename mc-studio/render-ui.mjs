// Clicks RENDER in the Motion Canvas editor and waits until frames stop appearing.
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const count=()=>{try{return fs.readdirSync('output/project').length}catch{return 0}};
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
await p.goto('http://localhost:9000/');await p.waitForTimeout(4000);
await p.click('button:has-text("RENDER")');
let last=-1,stable=0;
while(stable<6){await p.waitForTimeout(1000);const n=count();if(n===last&&n>0)stable++;else stable=0;last=n}
console.log('frames',last);await b.close();
