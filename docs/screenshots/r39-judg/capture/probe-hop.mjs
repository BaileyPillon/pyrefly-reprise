// Logs every change of the enemy-intent slab's box and shape over time: does it hop between spots, or flip between its two shapes
// (`.eint__panel--narrow`)? Real keys on a desktop window at a TEXT SIZE; prints a line each time the slab moves by about 6 px or
// changes width. Judgment call K of round 21 (docs/handoff/r39-judg.md): this is how the 223 px hop between two spots (a girl's head
// box moving 1 px) and the shape flips in Chapter V (a swinging tail box crossing its own head) were found.
//   node probe-hop.mjs --chapter=ffx2-bahamut --ts=1.3 [--size=1600x900] [--secs=20] [--keys=Enter,Escape,Enter]
// (the dev server's address is BASE in lib.mjs, 127.0.0.1:7200 by default; set BASE to change it)
import { launch, ready, BASE } from './lib.mjs';
const argv = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return [m[1], m[2] ?? true]; }));
const ts = Number(argv.ts ?? 1.3);
const chapter = argv.chapter ?? 'ffx2-bahamut';
const [W, H] = String(argv.size ?? '1600x900').split('x').map(Number);
const secs = Number(argv.secs ?? 20);
const { browser, ctx, page } = await launch({ width: W, height: H });
await ctx.addInitScript((t) => { const key = 'pyrefly-reprise:save:v1'; const raw = JSON.parse(localStorage.getItem(key) || 'null') || { version: 1, updatedAt: 0, chapters: {}, unlocked: [], flags: {}, seenCoach: [] }; raw.settings = { ...(raw.settings || {}), reduceMotion: false, lowEffects: false, textSize: t }; localStorage.setItem(key, JSON.stringify(raw)); }, ts);
await ready(page, `${BASE}?coach=off`);
await page.evaluate((id) => { const p = window.__pyrefly; p.setMuted(true); p.markCoachSeen?.(); p.setSeed(1); void p.gotoChapter(id, { skipCutscenes: true }); }, chapter);
await page.evaluate(async () => { for (let i = 0; i < 6000; i++) { await window.__pyrefly.frame(); const s = document.querySelector('.ig-cmd-stack'); if (s && s.getBoundingClientRect().height > 0) return; } });
const t0 = Date.now();
let last = '';
let changes = 0;
const keys = String(argv.keys ?? '').split(',').filter(Boolean);
let keyAt = 5000;
while (Date.now() - t0 < secs * 1000) {
  if (keys.length && Date.now() - t0 > keyAt) { const k = keys.shift(); await page.keyboard.press(k); console.log(((Date.now() - t0) / 1000).toFixed(1) + 's key ' + k); keyAt += 4000; }
  const info = await page.evaluate(() => {
    const p = document.querySelector('.eint__panel');
    const r = p ? p.getBoundingClientRect() : null;
    return { narrow: p?.classList.contains('eint__panel--narrow'), vis: !!r && r.width > 0, rect: r && [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
  });
  const sig = info.rect ? `${Math.round(info.rect[0] / 6)},${Math.round(info.rect[1] / 6)},${info.rect[2]}` : 'none';
  if (sig !== last) { last = sig; changes++; console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(info)); }
  await page.waitForTimeout(80);
}
console.log('changes', changes);
await browser.close();
