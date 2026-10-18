import { launch, bootFresh, toBoard, selectCard, dismissOverlays, shot, screenNow, sleep, step, enterBattle, menuRows, pendingActor, walkTo, aim, waitFor, writeJson } from './common.mjs';

const chapter = process.argv[2];
const game = process.argv[3]; // ffx | ffx2
const phone = process.argv.includes('--phone');
const turnsWanted = Number((process.argv.find((a) => a.startsWith('--turns=')) ?? '--turns=4').split('=')[1]);
const { browser, page, rec } = await launch(phone ? { w: 390, h: 844, touch: true, name: `${chapter}-phone` } : { name: `${chapter}-desk` });
const result = { game: game.toUpperCase(), chapter, viewport: phone ? '390x844' : '1600x900', menus: [] };
const logLen = () => page.evaluate(() => window.__pyrefly.battleLog().length);
let odDone = false;

try {
  await bootFresh(page);
  result.build = await page.evaluate(() => window.__pyrefly.build());
  await toBoard(page);
  await dismissOverlays(page);
  await selectCard(page, chapter);
  await sleep(600);
  await shot(page, rec, '1-board');
  await enterBattle(page, rec, { onPrep: async () => { await shot(page, rec, '2-prep'); } });
  step(rec, `reached battle (${chapter}) by real keys`, (await screenNow(page)) === 'battle');
  await dismissOverlays(page);
  let turns = 0;
  const t0 = Date.now();
  while (turns < turnsWanted && Date.now() - t0 < 300000) {
    const pa = await pendingActor(page);
    if (pa.screen !== 'battle') break;
    if (!pa.awaiting) { await sleep(300); continue; }
    await dismissOverlays(page);
    await sleep(400);
    const rows = (await menuRows(page)).rows;
    const labels = rows.map((r) => r.label + (r.overdrive ? '*OD' : '') + (r.disabled ? '(off)' : ''));
    result.menus.push({ actor: pa.actor, rows: labels });
    console.log('menu', pa.actor, JSON.stringify(labels));
    if (turns === 0) await shot(page, rec, '3-first-menu');
    const lenBefore = await logLen();
    const od = rows.find((r) => r.overdrive || /^overdrive/i.test(r.label));
    if (game === 'ffx' && od && !odDone && !od.disabled) {
      odDone = true;
      const row = await walkTo(page, /^overdrive/i);
      if (!row) {
        // the row has another label: walk by the overdrive flag
        for (let i = 0; i < 12; i++) {
          const cur = (await menuRows(page)).rows;
          const sel = cur.findIndex((r) => r.selected);
          const want = cur.findIndex((r) => r.overdrive);
          if (sel === want) break;
          await page.keyboard.press(want > sel ? 'ArrowDown' : 'ArrowUp');
          await sleep(120);
        }
      }
      await page.keyboard.press('Enter');
      await sleep(800);
      const sub = (await menuRows(page)).rows.map((r) => r.label + (r.disabled ? '(off)' : ''));
      result.overdriveSubmenu = { actor: pa.actor, rows: sub };
      console.log('overdrive submenu', JSON.stringify(sub));
      await shot(page, rec, '4-overdrive-submenu');
      step(rec, `Overdrive row opens a submenu (${pa.actor})`, sub.length > 0 && JSON.stringify(sub) !== JSON.stringify(labels.map((l) => l.replace('*OD', '').replace('(off)', ''))), sub);
      // cancel path
      await page.keyboard.press('Escape');
      await sleep(600);
      const back = (await menuRows(page)).rows.map((r) => r.label);
      step(rec, 'cancel path: Escape backs out of the Overdrive list to the top menu', back.length > 0 && back.includes('Attack') || back.some((l) => /attack/i.test(l)), back);
      // positive path: open again, pick the first row, aim
      for (let i = 0; i < 12; i++) {
        const cur = (await menuRows(page)).rows;
        const sel = cur.findIndex((r) => r.selected);
        const want = cur.findIndex((r) => r.overdrive);
        if (sel === want) break;
        await page.keyboard.press(want > sel ? 'ArrowDown' : 'ArrowUp');
        await sleep(120);
      }
      await page.keyboard.press('Enter');
      await sleep(700);
      await page.keyboard.press('Enter'); // first Overdrive
      await sleep(500);
      await aim(page);
      await sleep(2500);
      const lenAfter = await logLen();
      step(rec, `Overdrive used by real keys (${pa.actor}): the battle log grew`, lenAfter > lenBefore, { before: lenBefore, after: lenAfter });
      await shot(page, rec, '5-after-overdrive');
      turns++;
      continue;
    }
    let ok = await walkTo(page, /^attack/i);
    if (!ok) {
      // a Mage's menu has no Attack: open the first row that is not the dressphere Change, take its first entry, aim
      const cur = (await menuRows(page)).rows;
      const idx = cur.findIndex((r) => !/^change/i.test(r.label) && !r.disabled);
      const sel = cur.findIndex((r) => r.selected);
      for (let i = 0; i < Math.abs(idx - sel); i++) { await page.keyboard.press(idx > sel ? 'ArrowDown' : 'ArrowUp'); await sleep(120); }
      await page.keyboard.press('Enter');
      await sleep(700);
      result.fallbackRow = (result.fallbackRow ?? []).concat([{ actor: pa.actor, opened: cur[idx]?.label, sub: (await menuRows(page)).rows.map((r) => r.label) }]);
      await page.keyboard.press('Enter');
      await sleep(300);
      await aim(page);
      await sleep(2200);
      const lenAfter2 = await logLen();
      step(rec, `turn ${turns}: ${pa.actor} ${cur[idx]?.label} (first entry) by real keys grows the log`, lenAfter2 > lenBefore, { before: lenBefore, after: lenAfter2 });
      turns++;
      continue;
    }
    await page.keyboard.press('Enter');
    await sleep(300);
    await aim(page);
    await sleep(2200);
    const lenAfter = await logLen();
    step(rec, `turn ${turns}: ${pa.actor} Attack by real keys grows the log`, lenAfter > lenBefore, { before: lenBefore, after: lenAfter });
    turns++;
  }
  step(rec, `${turns} player turns played`, turns >= Math.min(turnsWanted, 2), turns);
  await shot(page, rec, '6-after-turns');
  // pause round trip
  await page.keyboard.press('Escape');
  await sleep(900);
  const onPause = (await screenNow(page)) === 'pause';
  step(rec, 'Escape pauses', onPause, await screenNow(page));
  if (onPause) {
    await page.keyboard.press('Escape');
    await sleep(900);
    step(rec, 'Escape resumes', (await screenNow(page)) === 'battle', await screenNow(page));
  }
  const aud = rec.requests.filter((u) => /audio\/.*\.(mp3|ogg|m4a|wav)/i.test(u));
  const dbg = await page.evaluate(() => { const d = window.__pyrefly.audioDebug(); return { playing: d.playing, current: d.music?.current?.name ?? null, prerenderedCues: d.prerendered?.cues ?? null, spriteDecoded: d.prerendered?.spriteDecoded ?? null }; });
  result.audio = { fetched: [...new Set(aud)].slice(0, 6), dbg };
  step(rec, 'prerendered music fetched and playing', aud.length > 0 && dbg.spriteDecoded === true, { n: aud.length, dbg });
} catch (e) {
  step(rec, 'THREW', false, String(e).slice(0, 500));
  try { await shot(page, rec, 'zz-failure'); } catch {}
} finally {
  result.consoleErrors = rec.consoleErrors;
  result.badResponses = rec.badResponses;
  result.failed = rec.failed;
  result.htmlAsMedia = rec.htmlAsMedia;
  result.steps = rec.steps;
  writeJson(`${rec.name}-result.json`, result);
  console.log(JSON.stringify({ consoleErrors: rec.consoleErrors, badResponses: rec.badResponses, htmlAsMedia: rec.htmlAsMedia, failedCount: rec.failed.length }, null, 1));
  await browser.close();
}
