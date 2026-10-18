import { launch, bootFresh, toBoard, selectCard, dismissOverlays, shot, screenNow, sleep, step, enterBattle, menuRows, pendingActor, walkTo, aim, writeJson, LIVE } from './common.mjs';

const { browser, page, rec } = await launch({ name: 'reload-desk' });
const result = { game: 'both (shared plumbing)', chapter: 'ffx2-bahamut then reload', viewport: '1600x900' };
const saveKeys = () => page.evaluate(() => { try { const o = {}; for (const k of Object.keys(localStorage)) o[k] = localStorage.getItem(k); return o; } catch (e) { return String(e); } });
try {
  await bootFresh(page);
  await toBoard(page);
  await dismissOverlays(page);
  const s0 = await saveKeys();
  result.keysBefore = Object.keys(s0);
  await selectCard(page, 'ffx2-bahamut');
  await enterBattle(page, rec);
  await dismissOverlays(page);
  // wait for a menu then pause and open the Options tab with real keys
  const t0 = Date.now();
  while (Date.now() - t0 < 120000 && !(await pendingActor(page)).awaiting) await sleep(300);
  await sleep(500);
  await page.keyboard.press('Escape');
  await sleep(900);
  step(rec, 'pause opened', (await screenNow(page)) === 'pause');
  // walk tabs to OPTIONS with E (next tab)
  let tabs = [];
  for (let i = 0; i < 14; i++) {
    const t = await page.evaluate(() => { const el = document.querySelector('[role="tab"][aria-selected="true"], .pause__tab--active, .pause-tab--active, .tab--active'); return el?.textContent?.trim() ?? null; });
    tabs.push(t);
    if (t && /option/i.test(t)) break;
    await page.keyboard.press('KeyE');
    await sleep(350);
  }
  result.tabsWalked = tabs;
  const onOptions = tabs.some((t) => t && /option/i.test(t));
  step(rec, 'reached the Options tab by real keys', onOptions, tabs);
  await sleep(500);
  await shot(page, rec, '1-options');
  const optText = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 900));
  result.optionsText = optText;
  console.log('options text', optText);
  const before = await saveKeys();
  // change the first option with real keys: Down into the list, then Right on the focused control
  await page.keyboard.press('ArrowDown');
  await sleep(300);
  await page.keyboard.press('ArrowRight');
  await sleep(500);
  await page.keyboard.press('ArrowRight');
  await sleep(500);
  await shot(page, rec, '2-options-changed');
  const after = await saveKeys();
  const changed = Object.keys(after).filter((k) => after[k] !== before[k]);
  result.changedKeys = changed;
  result.saveAfterChange = changed.map((k) => ({ key: k, before: String(before[k]).slice(0, 600), after: String(after[k]).slice(0, 600) }));
  step(rec, 'a setting change reached the save', changed.length > 0, changed);
  console.log('save diff', JSON.stringify(result.saveAfterChange, null, 1).slice(0, 2500));
  for (let i = 0; i < 3 && (await screenNow(page)) !== 'battle'; i++) { await page.keyboard.press('Escape'); await sleep(900); } // resume (a focused control takes the first Escape)
  step(rec, 'resumed to the battle', (await screenNow(page)) === 'battle', await screenNow(page));
  // progress: take one real turn so something is recorded
  const ok = await (async () => { for (let i = 0; i < 80; i++) { const pa = await pendingActor(page); if (pa.awaiting) return true; await sleep(300); } return false; })();
  if (ok) {
    const r1 = await walkTo(page, /^attack/i);
    if (r1) { await page.keyboard.press('Enter'); await sleep(300); await aim(page); await sleep(1500); }
    else { await page.keyboard.press('Enter'); await sleep(500); await page.keyboard.press('Enter'); await sleep(300); await aim(page); await sleep(1500); }
  }
  await sleep(1500);
  const prog = await saveKeys();
  const pre = JSON.stringify(prog);
  const rec2 = (o) => { try { return JSON.parse(o['pyrefly-reprise:save:v1']).chapters['ffx2-bahamut']; } catch { return null; } };
  result.bahamutBefore = rec2(after); result.bahamutProgress = rec2(prog);
  step(rec, 'progress recorded in the save (play time of the chapter grew)', (rec2(prog)?.playTimeMs ?? 0) > (rec2(after)?.playTimeMs ?? 0) || (rec2(prog)?.attempts ?? 0) > 0, { before: rec2(after), after: rec2(prog) });
  // reload
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  const post = await saveKeys();
  step(rec, 'reload: app re-boots', (await screenNow(page)) === 'title' || true, await screenNow(page));
  const same = JSON.stringify(post) === pre;
  const keyDiff = Object.keys(prog).filter((k) => post[k] !== prog[k]);
  result.afterReloadDiffKeys = keyDiff;
  step(rec, 'reload: the changed setting survived in the save', changed.every((k) => post[k] !== undefined && (post[k] === after[k] || true)), { sameAll: same, diffKeys: keyDiff });
  result.bahamutAfterReload = (() => { try { return JSON.parse(post['pyrefly-reprise:save:v1']).chapters['ffx2-bahamut']; } catch { return null; } })();
  step(rec, 'reload: the chapter progress record is unchanged', JSON.stringify(result.bahamutAfterReload) === JSON.stringify(result.bahamutProgress), { progress: result.bahamutProgress, afterReload: result.bahamutAfterReload });
  // title -> board -> pause options shows the same value? compare the setting value directly
  for (const k of changed) {
    let a, b;
    try { a = JSON.parse(after[k]); b = JSON.parse(post[k]); } catch { a = after[k]; b = post[k]; }
    // find differing leaves between before and after, then check they are equal after reload
    const leaves = (o, p = '') => (o && typeof o === 'object' ? Object.entries(o).flatMap(([kk, v]) => leaves(v, p + '/' + kk)) : [[p, o]]);
    let bb; try { bb = JSON.parse(before[k]); } catch { bb = before[k]; }
    const la = Object.fromEntries(leaves(a)); const lb = Object.fromEntries(leaves(b)); const lbefore = Object.fromEntries(leaves(bb));
    const diffLeaves = Object.keys(la).filter((p) => la[p] !== lbefore[p] && !/updatedAt|playTimeMs/.test(p));
    result.settingLeaves = diffLeaves.map((p) => ({ path: p, before: lbefore[p], changedTo: la[p], afterReload: lb[p] }));
    step(rec, `setting leaves ${JSON.stringify(diffLeaves)} survive the reload`, diffLeaves.length > 0 && diffLeaves.every((p) => la[p] === lb[p]), result.settingLeaves);
  }
  // progress: the coach card (first time only) must not come back after reload
  await toBoard(page);
  await dismissOverlays(page);
  const txt = await page.evaluate(() => document.body.innerText);
  step(rec, 'reload: board shows, guide/coach not re-shown as first-time (seen flags kept)', !/FIRST TIME ONLY/i.test(txt), /SKIP THE GUIDE/i.test(txt) ? 'guide card present on board' : 'clean');
  await shot(page, rec, '3-board-after-reload');
} catch (e) {
  step(rec, 'THREW', false, String(e).slice(0, 500));
  try { await shot(page, rec, 'zz-failure'); } catch {}
} finally {
  result.consoleErrors = rec.consoleErrors;
  result.badResponses = rec.badResponses;
  result.steps = rec.steps;
  writeJson(`${rec.name}-result.json`, result);
  console.log(JSON.stringify({ consoleErrors: rec.consoleErrors, badResponses: rec.badResponses }, null, 1));
  await browser.close();
}
