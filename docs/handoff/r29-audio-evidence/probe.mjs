// r29-audio probe: PR-0226 (cold first pause, Esc-Esc within ~150 ms), PR-0220 (pad only), PR-0203 (fresh defaults).
// usage: node probe.mjs <baseUrl> <label> [chapterId]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { currentChromiumArgs } from 'file:///D:/pyrefly-r29-audio/tools/browser-mode.mjs';
import { writeFileSync } from 'node:fs';

const [, , base, label, chapter = 'ffx2-bahamut'] = process.argv;
const out = { label, base, chapter };
const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const music = (page) => page.evaluate(() => {
  const d = window.__pyrefly.audioDebug();
  return { ready: d.ready, current: d.music.current ? d.music.current.name : null, gain: d.music.current ? +d.music.current.gain.toFixed(3) : null, fading: d.music.fading.map((f) => f.name), volumes: d.volumes };
});

try {
  // ---- PR-0220: pad only, no key, no click
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(() => {
      const start = performance.now();
      const pad = () => ({
        id: 'shim pad', index: 0, connected: true, mapping: 'standard', timestamp: performance.now(),
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, (_, i) => {
          const t = performance.now() - start;
          const pressed = i === 3 && t > 4000 && t < 4300; // Y (unmapped-ish) press at 4 s
          return { pressed, touched: pressed, value: pressed ? 1 : 0 };
        }),
      });
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad(), null, null, null] });
    });
    const page = await ctx.newPage();
    await page.goto(base);
    await page.waitForFunction(() => window.__pyrefly && window.__pyreflyReady === true, null, { timeout: 60000 });
    await sleep(2500);
    out.padBeforePress = await music(page);
    await sleep(4500);
    out.padAfterPress = await music(page);
    out.freshVolumes = out.padAfterPress.volumes;
    await ctx.close();
  }
  // ---- PR-0226: cold first pause, Esc-Esc within ~120 ms, pause.mp3 delayed 1.2 s
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.route('**/music/pause.mp3', async (route) => { await sleep(1200); await route.continue(); });
    const page = await ctx.newPage();
    await page.goto(base);
    await page.waitForFunction(() => window.__pyrefly && window.__pyreflyReady === true, null, { timeout: 60000 });
    await page.keyboard.press('Shift'); // the first gesture: unlocks audio
    await page.evaluate((id) => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter(id, { skipCutscenes: true }); }, chapter);
    await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 90000 });
    const t0 = Date.now();
    let first;
    for (;;) {
      first = await music(page);
      if (first.current && first.current.startsWith('boss')) break;
      if (Date.now() - t0 > 60000) break;
      await sleep(250);
    }
    await sleep(1500);
    const beforePause = await music(page);
    await page.keyboard.press('Escape');
    await sleep(120);
    const during = await music(page);
    await page.keyboard.press('Escape');
    await sleep(3000);
    const plus3 = await music(page);
    await sleep(3000);
    const plus6 = await music(page);
    // a slow second pause: the menu should play `pause`, resume the battle cue
    await page.keyboard.press('Escape');
    await sleep(2500);
    const slowPause = await music(page);
    await page.keyboard.press('Escape');
    await sleep(2500);
    const slowResume = await music(page);
    runs.push({ beforePause, during, plus3, plus6, slowPause, slowResume, screen: await page.evaluate(() => window.__pyrefly.screen()) });
    await ctx.close();
  }
  out.pauseRuns = runs;
} catch (e) {
  out.error = String(e && e.stack || e);
} finally {
  await browser.close();
}
writeFileSync(`D:/Tools/pyrefly-scratch/r29/audio/probe-${label}-${chapter}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
