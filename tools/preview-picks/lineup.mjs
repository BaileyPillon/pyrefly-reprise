// Pose lineup: every pose of a figure drawn in-game at its sidecar scale, same spot, same camera, HUD off, so head height and
// feet line can be read against the girl's other dresspheres. node lineup.mjs <preview|live> <outDir>
import { openGame, enterBattle, waitMenu, sleep, OUT } from './drive.mjs';
import fs from 'node:fs';
process.env.PYREFLY_BROWSER ??= 'gpu';
const [mode = 'preview', outDir = `${OUT}/lineup`] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const g = await openGame({ mode, settings: { ffx2Atb: 'wait' } });
const { page } = g;
// girl -> dresspheres to line up (the first is her own in this chapter's staging)
const LINEUPS = {
  yuna: ['thief', 'gunner', 'white-mage'],
  rikku: ['warrior', 'thief', 'gunner'],
  paine: ['thief', 'warrior', 'gunner'],
};
const POSES = ['idle', 'ready', 'attack', 'follow', 'cast', 'item', 'hurt', 'ko', 'victory'];
try {
  await enterBattle(page, 'ffx2-leblanc');
  await waitMenu(page);
  await page.evaluate(() => window.__pyrefly.trigger?.('hud:off'));
  const meta = {};
  for (const [girl, spheres] of Object.entries(LINEUPS)) {
    for (const d of spheres) {
      await page.evaluate(async ([id, d]) => { await window.__pyrefly.app.current.stage.setArt(id, `${id}-${d}`); }, [girl, d]);
      await sleep(900);
      for (const pose of POSES) {
        const info = await page.evaluate(async ([id, pose]) => {
          const st = window.__pyrefly.app.current.stage;
          const a = st.actor(id);
          a.setPose(pose, { immediate: true });
          await new Promise((r) => setTimeout(r, 450));
          return { feet: st.project(id, 'feet'), head: st.project(id, 'head'), chest: st.project(id, 'chest'), actual: a.pose };
        }, [girl, pose]);
        const f = info.feet;
        if (!f) continue;
        // project() answers pixels or NDC: normalise
        const px = Math.abs(f.x) <= 2 ? { x: (f.x + 1) * 800, y: (1 - f.y) * 450 } : f;
        const clip = { x: Math.max(0, Math.round(px.x - 230)), y: Math.max(0, Math.round(px.y - 430)), width: 460, height: 470 };
        meta[`${girl}-${d}-${pose}`] = { info, px, clip };
        await page.screenshot({ path: `${outDir}/${girl}-${d}-${pose}.png`, clip });
      }
      await page.evaluate(([id]) => window.__pyrefly.app.current.stage.actor(id).setPose('idle', { immediate: true }), [girl]);
    }
  }
  fs.writeFileSync(`${outDir}/meta.json`, JSON.stringify(meta, null, 1));
} finally {
  console.log('errors', g.errors.slice(0, 3), 'missing', g.missing.slice(0, 5));
  await g.browser.close();
}
