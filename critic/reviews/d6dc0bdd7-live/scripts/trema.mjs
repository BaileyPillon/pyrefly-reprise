import { launch, bootFresh, toBoard, selectCard, dismissOverlays, shot, screenNow, sleep, step, enterBattle, menuRows, pendingActor, walkTo, aim, waitFor, writeJson, OUT } from './common.mjs';

const phone = process.argv.includes('--phone');
const { browser, page, rec } = await launch(phone ? { w: 390, h: 844, touch: true, name: 'trema-phone' } : { name: 'trema-desk' });
const result = { game: 'FFX-2', chapter: 'ffx2-trema (XIII)', viewport: phone ? '390x844' : '1600x900' };
const logLen = () => page.evaluate(() => window.__pyrefly.battleLog().length);
const bodyText = () => page.evaluate(() => document.body.innerText);

try {
  await bootFresh(page);
  result.build = await page.evaluate(() => window.__pyrefly.build());
  await toBoard(page);
  await dismissOverlays(page);
  await selectCard(page, 'ffx2-trema');
  await enterBattle(page, rec);
  step(rec, 'reached battle (Chapter XIII) by real keys', (await screenNow(page)) === 'battle');
  await dismissOverlays(page);

  // pass other girls' turns with real keys (Attack); stop at Rikku's menu
  let rikku = false;
  let passed = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 240000 && !rikku) {
    const pa = await pendingActor(page);
    if (pa.screen !== 'battle') break;
    if (!pa.awaiting) { await sleep(300); continue; }
    await dismissOverlays(page);
    await sleep(350);
    if (pa.actor === 'rikku') { rikku = true; break; }
    // another girl: Attack by real keys
    const rows = await menuRows(page);
    const ok = await walkTo(page, /^attack/i);
    if (ok) {
      await page.keyboard.press('Enter');
      await sleep(300);
      await aim(page);
      passed++;
      result.passedTurns = (result.passedTurns ?? []).concat([{ actor: pa.actor, rows: rows.rows.map((r) => r.label) }]);
      await sleep(1200);
    } else {
      // fall back: debug defend (declared)
      await page.evaluate(() => window.__pyrefly.forceCommand({ kind: 'defend', targets: [] }));
      result.usedForceCommand = (result.usedForceCommand ?? 0) + 1;
      await sleep(600);
    }
  }
  step(rec, "Rikku's menu reached", rikku, { passed, forceCommand: result.usedForceCommand ?? 0 });
  if (!rikku) throw new Error('no Rikku menu');
  await sleep(700);
  const top = await menuRows(page);
  result.topRows = top.rows.map((r) => ({ label: r.label, disabled: r.disabled, selected: r.selected }));
  result.actorDress = await page.evaluate(() => document.body.innerText.slice(0, 400).replace(/\n+/g, ' | '));
  await shot(page, rec, '1-rikku-top');
  console.log('top rows', JSON.stringify(result.topRows));
  // Rikku as Alchemist? read the HUD text
  const hud = await bodyText();
  result.alchemist = /alchemist/i.test(hud) || /AL/.test(hud) || result.topRows.some((r) => /^mix/i.test(r.label)); // desktop HUD shows the AL dress chip; the phone HUD shows no dress text, so the Alchemist's own command set (Attack, Mix, Item, Change) stands for it
  step(rec, "the menu is Rikku's, dressed Alchemist", result.alchemist, hud.slice(0, 200).replace(/\n+/g, ' | '));

  // Mix sits on Rikku's top menu (Attack, Mix, Item, Change): no submenu to open
  await shot(page, rec, '2-top-menu-mix-row');
  const sub = await menuRows(page);
  result.subRows = sub.rows.map((r) => ({ label: r.label, full: r.full, disabled: r.disabled, selected: r.selected, w: r.w }));
  const mix = sub.rows.find((r) => /^mix/i.test(r.label));
  step(rec, 'a Mix row exists', !!mix, mix ?? null);
  step(rec, 'Mix row is greyed (disabled)', !!mix?.disabled, mix?.cls);
  step(rec, 'Mix row says "Not built"', /not built/i.test(mix?.full ?? ''), mix?.full);
  step(rec, 'reason is not the old words', !/item picker|NEEDS THE ITE/i.test(mix?.full ?? '') && !/not built yet/i.test(mix?.full ?? ''), mix?.full);
  const mixReason = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.ig-cmd *')].filter((e) => e.children.length === 0 && /not built/i.test(e.textContent));
    return els.map((e) => ({ text: e.textContent, sw: e.scrollWidth, cw: e.clientWidth, truncated: e.scrollWidth > e.clientWidth + 1, ellipsis: getComputedStyle(e).textOverflow }));
  });
  result.mixReason = mixReason;
  step(rec, '"Not built" is whole (not cut by an ellipsis)', mixReason.length > 0 && mixReason.every((m) => !m.truncated), mixReason);

  // walk to Mix (keys) and read the help line, then positive-path press Enter, then click/tap
  const sel = await walkTo(page, /^mix/i);
  step(rec, 'arrow keys can rest on the greyed Mix row', !!sel, sel);
  await sleep(500);
  await shot(page, rec, '3-mix-selected');
  const helpText = await bodyText();
  const helpMatch = helpText.match(/[^\n]*Not built[^\n]*/gi) ?? [];
  result.helpLines = helpMatch;
  step(rec, 'help line names the reason', helpMatch.some((l) => /not built/i.test(l)), helpMatch);
  const before = { len: await logLen(), title: (await menuRows(page)).rows.map((r) => r.label).join('|'), text: (await bodyText()).length };
  await page.keyboard.press('Enter');
  await sleep(900);
  const afterKey = { len: await logLen(), title: (await menuRows(page)).rows.map((r) => r.label).join('|'), pend: (await pendingActor(page)).awaiting };
  step(rec, 'Enter on the greyed Mix opens nothing and submits nothing', afterKey.len === before.len && afterKey.title === before.title && afterKey.pend, { before, afterKey });
  await shot(page, rec, '4-after-enter');
  // click / tap the row
  const box = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.ig-cmd')].find((e) => /^mix/i.test((e.querySelector('.ffx2cmd__label')?.textContent ?? e.textContent).trim()));
    if (!row) return null;
    const r = row.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  result.rowBox = box;
  if (box) {
    if (phone) await page.touchscreen.tap(box.x, box.y); else await page.mouse.click(box.x, box.y);
    await sleep(900);
  }
  const afterClick = { len: await logLen(), rows: (await menuRows(page)).rows.map((r) => r.label).join('|'), pend: (await pendingActor(page)).awaiting, text: await bodyText() };
  const overlay = /pick an item|first item|second item|ingredient|choose.*item/i.test(afterClick.text.replace(/Not built/gi, ''));
  step(rec, `${phone ? 'Tap' : 'Click'} on the greyed Mix row opens nothing`, afterClick.len === before.len && afterClick.rows === before.title && afterClick.pend && !overlay, { before: before.len, after: afterClick.len, overlay });
  await shot(page, rec, '5-after-click');
  // positive path after the greyed row: Rikku's Attack by real keys; the cancel path is the pause key (the top menu has nothing to back out of)
  const stillTop = (await menuRows(page)).rows.map((r) => r.label);
  const ok = await walkTo(page, /^attack/i);
  step(rec, 'arrow keys leave the greyed row and rest on Attack', !!ok, stillTop);
  if (ok) {
    await page.keyboard.press('Enter');
    await sleep(300);
    const lenBefore = await logLen();
    await aim(page);
    await sleep(3000);
    step(rec, "Rikku's Attack by real keys grows the battle log", (await logLen()) > lenBefore, { before: lenBefore, after: await logLen() });
  }
  // pause/H/resume
  await page.keyboard.press('Escape');
  await sleep(900);
  let onPause = (await screenNow(page)) === 'pause';
  step(rec, 'Escape pauses', onPause, await screenNow(page));
  if (onPause) {
    const t1 = await bodyText();
    await page.keyboard.press('KeyH');
    await sleep(500);
    const t2 = await bodyText();
    await page.keyboard.press('KeyH');
    await sleep(500);
    const t3 = await bodyText();
    step(rec, 'H hides the pause panels and H restores them', t2.length < t1.length && t3.length > t2.length, { shown: t1.length, hidden: t2.length, restored: t3.length });
    await page.keyboard.press('Escape');
    await sleep(900);
    step(rec, 'Escape resumes to the battle', (await screenNow(page)) === 'battle', await screenNow(page));
    await page.keyboard.press('KeyP');
    await sleep(700);
    const viaP = (await screenNow(page)) === 'pause';
    await page.keyboard.press('KeyP');
    await sleep(700);
    step(rec, 'P pauses and P resumes', viaP && (await screenNow(page)) === 'battle', { paused: viaP, after: await screenNow(page) });
  }
  // audio: prerendered music requested
  const aud = rec.requests.filter((u) => /audio\/.*\.(mp3|ogg|m4a|wav)/i.test(u));
  result.audioRequests = [...new Set(aud)].slice(0, 8);
  const dbg = await page.evaluate(() => { try { const d = window.__pyrefly.audioDebug(); return { ready: d.ready, playing: d.playing, muted: d.muted, music: JSON.stringify(d.music).slice(0, 300), prerendered: JSON.stringify(d.prerendered).slice(0, 300) }; } catch (e) { return String(e); } });
  result.audioDebug = dbg;
  step(rec, 'prerendered music fetched', aud.length > 0, { n: aud.length, dbg });
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
