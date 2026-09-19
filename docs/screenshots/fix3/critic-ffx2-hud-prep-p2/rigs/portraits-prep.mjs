/**
 * Carried-over defects 1, 2 and 3 from the original brief, re-checked live on
 * THIS build rather than taken on the previous critic pass's word:
 *
 *  1  FFX-2 party rows must show painted portraits, not a monogram chip
 *  2  the FFX-2 prep screen must have a real tab set reading real loadout data
 *  3  portrait crops must be faces — Auron's especially — on every live tile
 *
 * Plus the FFX-side defect-4 check (no raw kebab ids on the Equipment tab) and
 * its FFX-2 mirror (no raw kebab ids on the X-2 prep tabs either).
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, PORT, OUT } from './lib.mjs';

fs.mkdirSync(OUT, { recursive: true });
const RAW = /^[a-z0-9]+(-[a-z0-9]+)+$/;

const READ_FACES = () => {
  const r = (n) => +Number(n).toFixed(1);
  return [...document.querySelectorAll('.ffx2hud__party .ig-stat, .ffxhud .ig-stat, .ig-stat')].map((row) => {
    const img = row.querySelector('img');
    const name = (row.querySelector('.ig-stat__name')?.textContent || '').trim();
    const b = img?.getBoundingClientRect();
    return {
      name,
      hasImg: Boolean(img),
      src: img?.currentSrc || img?.src || null,
      complete: img?.complete ?? null,
      natural: img ? [img.naturalWidth, img.naturalHeight] : null,
      painted: b ? { w: r(b.width), h: r(b.height) } : null,
      // The fallback chip is what shows when no painting resolves.
      fallbackVisible: Boolean(row.querySelector('.ig-stat__initial, .ffx2-portrait__fallback')),
    };
  });
};

const READ_PREP = () => ({
  screen: window.__pyrefly.screen(),
  tabs: [...document.querySelectorAll('.prep__tab')].map((t) => (t.textContent || '').trim()),
  selected: (document.querySelector('.prep__tab--sel, .prep__tab[aria-selected="true"]')?.textContent || '').trim(),
  chips: [...document.querySelectorAll('.ffxprep-chip')].map((c) => (c.textContent || '').trim()),
  bodyText: (document.querySelector('.prep__body')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000),
});

async function gotoPrep(page, chapter) {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction('window.__pyreflyReady === true', null, { timeout: 300000 });
  await page.evaluate((c) => {
    window.__pyrefly.setSeed(7);
    // skipPrep DEFAULTS TO TRUE — it has to be turned off explicitly.
    window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: false }).catch(() => {});
  }, chapter);
  await page.waitForFunction(() => window.__pyrefly.screen() === 'party-prep', null, { timeout: 300000 });
  await page.waitForTimeout(1400);
}

async function main() {
  const browser = await launch();
  const report = { prep: [], hud: [], failures: [] };
  const fail = (m) => {
    report.failures.push(m);
    console.log('  FAIL ' + m);
  };

  // ---------------------------------------------------------- prep screens
  for (const [chapter, name] of [
    ['seymour-flux', 'ch1-ffx'],
    ['braskas-final-aeon', 'ch3-ffx'],
    ['ffx2-bahamut', 'ch4-ffx2'],
    ['ffx2-vegnagun-shuyin', 'ch5-ffx2'],
  ]) {
    for (const vps of ['1280x720', '2560x1440']) {
      const [w, h] = vps.split('x').map(Number);
      const { ctx, page } = await newPage(browser, w, h);
      try {
        await gotoPrep(page, chapter);
        const base = await page.evaluate(READ_PREP);
        console.log(`== ${name} ${vps} tabs ${JSON.stringify(base.tabs)}`);
        if (base.tabs.length < 2) fail(`${name} ${vps}: the prep screen has ${base.tabs.length} tab(s) — ${JSON.stringify(base.tabs)}`);
        const perTab = [];
        for (let i = 0; i < base.tabs.length; i++) {
          await page.evaluate((k) => document.querySelectorAll('.prep__tab')[k].click(), i);
          await page.waitForTimeout(500);
          const t = await page.evaluate(READ_PREP);
          const rawChips = t.chips.filter((c) => RAW.test(c));
          const rawWords = [...new Set((t.bodyText.match(/\b[a-z0-9]+(?:-[a-z0-9]+)+\b/g) || []))].filter(
            (word) => !/^\d/.test(word) && word.length > 4,
          );
          console.log(`   tab "${base.tabs[i]}" chips ${t.chips.length}${rawChips.length ? ` RAW-CHIPS ${JSON.stringify(rawChips)}` : ''}${rawWords.length ? ` RAW-WORDS ${JSON.stringify(rawWords.slice(0, 8))}` : ''}`);
          if (rawChips.length) fail(`${name} ${vps} tab "${base.tabs[i]}": raw kebab ids on chips — ${JSON.stringify(rawChips)}`);
          if (rawWords.length) fail(`${name} ${vps} tab "${base.tabs[i]}": raw kebab ids in the panel text — ${JSON.stringify(rawWords.slice(0, 8))}`);
          perTab.push({ tab: base.tabs[i], chips: t.chips, rawChips, rawWords });
          await page.screenshot({ path: path.join(OUT, `prep-${name}-${w}x${h}-tab${i}.png`), timeout: 180000 });
        }
        report.prep.push({ chapter: name, vp: vps, tabs: base.tabs, perTab });
      } catch (e) {
        fail(`${name} ${vps}: prep check threw — ${String(e).slice(0, 180)}`);
      }
      await ctx.close();
    }
  }

  // ------------------------------------------------------ live HUD portraits
  for (const [chapter, name] of [
    ['seymour-flux', 'ch1-ffx'],
    ['braskas-final-aeon', 'ch3-ffx'],
    ['ffx2-bahamut', 'ch4-ffx2'],
    ['ffx2-vegnagun-shuyin', 'ch5-ffx2'],
  ]) {
    const { ctx, page } = await newPage(browser, 1600, 900);
    try {
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction('window.__pyreflyReady === true', null, { timeout: 300000 });
      await page.evaluate((c) => {
        window.__pyrefly.setSeed(7);
        window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true }).catch(() => {});
      }, chapter);
      await page.waitForFunction(() => window.__pyrefly.screen() === 'battle' && document.querySelectorAll('.ig-stat').length >= 2, null, { timeout: 600000 });
      await page.waitForTimeout(2000);
      const faces = await page.evaluate(READ_FACES);
      console.log(`== HUD ${name}`);
      for (const f of faces) {
        console.log(`   ${f.name || '(no name)'} img=${f.hasImg} natural=${JSON.stringify(f.natural)} fallback=${f.fallbackVisible} src=${(f.src || '').split('/').slice(-2).join('/')}`);
        if (!f.hasImg || !f.natural || f.natural[0] === 0) fail(`HUD ${name}: party row "${f.name}" has no resolved painting (img=${f.hasImg}, natural=${JSON.stringify(f.natural)})`);
      }
      report.hud.push({ chapter: name, faces });
      await page.screenshot({ path: path.join(OUT, `hud-${name}-1600x900.png`), timeout: 180000 });
      // A zoom on the party stack, where the crops actually have to read.
      const box = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.ig-stat')];
        if (!rows.length) return null;
        const b = rows.map((r) => r.getBoundingClientRect());
        const left = Math.min(...b.map((x) => x.left));
        const top = Math.min(...b.map((x) => x.top));
        const right = Math.max(...b.map((x) => x.right));
        const bottom = Math.max(...b.map((x) => x.bottom));
        return { x: Math.floor(left), y: Math.floor(top), width: Math.ceil(right - left), height: Math.ceil(bottom - top) };
      });
      if (box && box.width > 0 && box.height > 0) {
        await page.screenshot({ path: path.join(OUT, `hud-${name}-party-zoom.png`), clip: box, timeout: 180000 });
      }
    } catch (e) {
      fail(`HUD ${name}: threw — ${String(e).slice(0, 180)}`);
    }
    await ctx.close();
  }

  fs.writeFileSync(path.join(OUT, 'portraits-prep.json'), JSON.stringify(report, null, 1));
  console.log('\n==== ' + (report.failures.length ? `${report.failures.length} FAILURES` : 'prep + portraits green') + ' ====');
  for (const m of report.failures) console.log(' - ' + m);
  await browser.close();
}
main();
