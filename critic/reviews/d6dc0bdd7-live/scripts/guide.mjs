import { launch, bootFresh, toBoard, selectCard, dismissOverlays, shot, screenNow, sleep, step, enterBattle, pendingActor, writeJson } from './common.mjs';

const { browser, page, rec } = await launch({ name: 'guide-desk' });
const result = { game: 'FFX', chapter: 'mirror-aeons (XXVII)', viewport: '1600x900' };
try {
  await bootFresh(page);
  await toBoard(page);
  await dismissOverlays(page);
  await selectCard(page, 'mirror-aeons');
  await enterBattle(page, rec);
  await dismissOverlays(page);
  const t0 = Date.now();
  while (Date.now() - t0 < 120000 && !(await pendingActor(page)).awaiting) await sleep(300);
  await sleep(800);
  await page.keyboard.press('Escape');
  await sleep(1000);
  step(rec, 'pause opened', (await screenNow(page)) === 'pause');
  const tabs = [];
  for (let i = 0; i < 14; i++) {
    const t = await page.evaluate(() => document.querySelector('[role="tab"][aria-selected="true"], .pause__tab--active, .pause-tab--active, .tab--active')?.textContent?.trim() ?? null);
    tabs.push(t);
    if (t && /^guide/i.test(t)) break;
    await page.keyboard.press('KeyE');
    await sleep(350);
  }
  step(rec, 'reached the Guide tab by real keys', tabs.some((t) => t && /^guide/i.test(t)), tabs);
  await sleep(800);
  await shot(page, rec, '1-guide-tab');
  // collect text across the guide: page down through it
  let texts = [];
  for (let i = 0; i < 12; i++) {
    texts.push(await page.evaluate(() => document.body.innerText));
    await page.keyboard.press('PageDown');
    await sleep(300);
  }
  const all = [...new Set(texts)].join('\n');
  result.guideChars = all.length;
  result.patterns = {
    inGameDescription: /In Game Description/i.test(all),
    wrongColours: /wrong colours|called up by a Yevon/i.test(all),
    attributedQuote: /(the game|the game's own|in-game text|the game says)[^.\n]{0,40}["“]/i.test(all),
    mentionsDarkYojimbo: /Dark Yojimbo/.test(all),
    mentionsSisters: /Dark Magus Sisters/.test(all),
  };
  step(rec, 'Guide tab: no "In Game Description" for the Dark Aeons', !result.patterns.inGameDescription, result.patterns);
  step(rec, 'Guide tab: Dark Yojimbo and the Sisters both covered', result.patterns.mentionsDarkYojimbo && result.patterns.mentionsSisters, result.patterns);
  result.sample = all.slice(0, 1500).replace(/\n+/g, ' | ');
  const q = [...all.matchAll(/["“”][^"“”\n]{12,200}["“”]/g)].map((m) => m[0]).slice(0, 12);
  result.quotesOnScreen = q;
  console.log('quotes on the guide tab:', JSON.stringify(q));
} catch (e) {
  step(rec, 'THREW', false, String(e).slice(0, 500));
  try { await shot(page, rec, 'zz-failure'); } catch {}
} finally {
  result.consoleErrors = rec.consoleErrors;
  result.badResponses = rec.badResponses;
  result.steps = rec.steps;
  writeJson(`${rec.name}-result.json`, result);
  console.log(JSON.stringify({ consoleErrors: rec.consoleErrors, badResponses: rec.badResponses }));
  await browser.close();
}
