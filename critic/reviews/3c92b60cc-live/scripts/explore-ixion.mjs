import { launch, bootFresh, toBoard, boardSnap, selectCard, dismissOverlays, shot, screenNow, sleep, step, enterBattle, menuRows, pendingActor, waitFor, writeJson } from './common.mjs';

process.env.PYREFLY_BROWSER ??= 'gpu';
const { browser, page, rec } = await launch({ name: 'explore-ixion' });
const out = {};
try {
  await bootFresh(page);
  out.build = await page.evaluate(() => window.__pyrefly.build());
  out.renderer = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const e = gl?.getExtension('WEBGL_debug_renderer_info');
    return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : null;
  });
  await toBoard(page);
  await dismissOverlays(page);
  const b = await boardSnap(page);
  out.order = b?.order;
  await selectCard(page, 'ffx2-ixion-djose');
  await enterBattle(page, rec);
  await waitFor('first menu', async () => (await pendingActor(page)).awaiting, { ms: 120000, pollMs: 400 });
  await sleep(1500);
  out.actor = await pendingActor(page);
  out.rows = (await menuRows(page)).rows.map((r) => r.label);
  out.poseTrust = await page.evaluate(() => window.__pyrefly.poseTrust());
  out.stage = await page.evaluate(() => {
    const st = window.__pyrefly.app.current.stage;
    const o = {};
    for (const [id, v] of st.actors) o[id] = { poseNames: v.actor.poseNames, pose: v.actor.pose, side: v.side, kind: v.kind };
    return o;
  });
  out.combatants = await page.evaluate(() => {
    const c = window.__pyrefly.battleState().combatants;
    return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, { dress: v.dresssphere ?? v.dressphere ?? v.dress ?? null, keys: Object.keys(v).slice(0, 40) }]));
  });
  await shot(page, rec, 'first-menu');
} catch (e) {
  out.threw = String(e);
} finally {
  out.consoleErrors = rec.consoleErrors;
  out.bad = rec.badResponses;
  writeJson('explore-ixion.json', out);
  console.log(JSON.stringify(out, null, 1).slice(0, 7000));
  await browser.close();
}
