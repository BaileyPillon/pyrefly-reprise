import { chromium } from 'playwright';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';
const LIVE='https://baileypillon.github.io/pyrefly-reprise/';
const browser=await chromium.launch({headless:true,args:[...currentChromiumArgs()]});
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage();
await page.goto(LIVE,{waitUntil:'load',timeout:90000});
await page.waitForFunction(()=>window.__pyreflyReady===true,null,{timeout:90000});
await page.evaluate(()=>{window.__pyrefly.setMuted(true);window.__pyrefly.setSeed(1);window.__pyrefly.gotoChapter('yojimbo-cavern',{skipCutscenes:true});});
const ok=await page.evaluate(async()=>{for(let i=0;i<2500;i++){await window.__pyrefly.frame();const s=document.querySelector('.ig-cmd-stack');if(s&&!s.hidden&&s.getBoundingClientRect().height>0)return true;}return false;});
console.log('menu',ok);
await page.waitForTimeout(800);
await page.screenshot({path:'D:/Tools/pyrefly-scratch/r29/options/p1.jpg',type:'jpeg',quality:70});
await page.keyboard.press('Enter');await page.waitForTimeout(500);
await page.tap('.ig-cmd-stack .ig-cmd:nth-child(3)');await page.waitForTimeout(900);
await page.screenshot({path:'D:/Tools/pyrefly-scratch/r29/options/p2.jpg',type:'jpeg',quality:70});
console.log(await page.evaluate(()=>{const st=document.querySelector('.ig-cmd-stack');const out=[];let e=st;for(let k=0;k<4&&e;k++){out.push(e.tagName+'.'+e.className+' '+JSON.stringify(e.getBoundingClientRect()));e=e.parentElement;}
const a=st.closest('.ffx-cmd-area')||st.parentElement;out.push([...a.children].map(c=>c.tagName+'.'+c.className+' '+Math.round(c.getBoundingClientRect().top)+'-'+Math.round(c.getBoundingClientRect().bottom)).join(' | '));return out.join(' \n ');}));
await browser.close();
