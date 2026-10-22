import { open, waitBattleMenu } from 'file:///D:/pyrefly-release55/critic/runner/lib/lib.mjs';
import sharp from 'file:///D:/pyrefly-release55/node_modules/sharp/dist/index.mjs';
import fs from 'node:fs';
const base=process.argv[2], tag=process.argv[3];
const { browser, page } = await open({ base, width:1600, height:900 });
await page.evaluate(()=>{window.__pyrefly.gotoChapter('seymour-flux',{skipCutscenes:true,skipPrep:true,seed:1});return 1});
await waitBattleMenu(page,120000);
await page.evaluate(()=>{window.__pyrefly.autoBattle('intended');window.__pyrefly.setBattleSpeed?.('normal');return 1});
const frames=[];const t0=Date.now();
while(Date.now()-t0<70000){const b=await page.screenshot({type:'jpeg',quality:70,clip:{x:850,y:0,width:700,height:620}});frames.push(b);}
console.log(tag,frames.length);
// contact sheet: 12 frames evenly
const pick=[];for(let i=0;i<12;i++)pick.push(frames[Math.floor(i*frames.length/12)]);
const tiles=await Promise.all(pick.map(b=>sharp(b).resize(350).toBuffer()));
const comps=tiles.map((t,i)=>({input:t,left:(i%4)*350,top:Math.floor(i/4)*310}));
await sharp({create:{width:1400,height:930,channels:3,background:'#000'}}).composite(comps).jpeg({quality:85}).toFile(`seymour-sheet-${tag}.jpg`);
await browser.close();
