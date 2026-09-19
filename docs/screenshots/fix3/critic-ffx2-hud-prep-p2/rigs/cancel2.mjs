/**
 * Hostile test 3 (rig v2) — the cancel path, across ACTORS, not just chapters.
 *
 * v1 burned ~2.5 s per turn scanning for a "Skill" row that a given girl does
 * not have, and the ATB turn lapsed before targeting was reached — the rig
 * artefact the builder's handoff warns about. v2 reads the row labels first and
 * only opens submenus that are actually on screen, so every press is spent
 * inside the turn it belongs to.
 *
 * Per chapter x viewport it drives up to FIVE consecutive turns, so all three
 * girls get the sequence, and for each turn:
 *   - seeds every submenu on the row list (stale `subItems`/`subCategory`)
 *   - measures the submenu's row labels (defect 3, per actor)
 *   - picks a targeted command, Escs out, and asserts where it lands
 *   - commits and reads the engine log for a spherechange that nobody asked for
 *   - checks Esc-out-of-targeting does not pause, and a second Esc does
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, bootBattle, READ_MENU, waitMenu, OUT } from './lib.mjs';

fs.mkdirSync(OUT, { recursive: true });

const ROWS = () =>
  [...document.querySelectorAll('.ffx2hud__command .ig-cmd')].map((r) => ({
    label: (r.querySelector('.ffx2cmd__label')?.textContent || '').trim(),
    group: Boolean(r.querySelector('.ffx2cmd__arrow')),
    disabled: r.classList.contains('ig-cmd--disabled'),
    sel: r.classList.contains('ig-cmd--selected'),
  }));

const ACTOR = () => {
  const n = document.querySelector('.mad__who, .ffx2hud__command [data-actor]');
  return (n?.textContent || n?.getAttribute?.('data-actor') || '').trim() || '?';
};

/** Move the cursor onto row `i` with real arrow presses, shortest way round. */
async function selectRow(page, i) {
  const rows = await page.evaluate(ROWS);
  const cur = rows.findIndex((r) => r.sel);
  if (cur < 0 || i < 0 || i >= rows.length) return false;
  const n = rows.length;
  const down = (i - cur + n) % n;
  const up = (cur - i + n) % n;
  const key = down <= up ? 'ArrowDown' : 'ArrowUp';
  for (let k = 0; k < Math.min(down, up); k++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
  const after = await page.evaluate(ROWS);
  return after.findIndex((r) => r.sel) === i;
}

async function main() {
  const browser = await launch();
  const report = { runs: [], labels: [], failures: [] };
  const fail = (m) => {
    report.failures.push(m);
    console.log('  FAIL ' + m);
  };

  const VPS = (process.env.VPS ?? '1280x720,2560x1440').split(',');
  for (const [chapter, name] of [
    ['ffx2-bahamut', 'ch4'],
    ['ffx2-vegnagun-shuyin', 'ch5'],
  ]) {
    for (const vps of VPS) {
      const [w, h] = vps.split('x').map(Number);
      const { ctx, page } = await newPage(browser, w, h);
      await bootBattle(page, chapter);
      console.log(`== ${name} ${vps}`);
      const seenActors = new Set();

      for (let turn = 0; turn < 5; turn++) {
        if (!(await waitMenu(page, 90000))) break;
        const actor = await page.evaluate(ACTOR);
        seenActors.add(actor);
        const top = await page.evaluate(ROWS);
        const before = await page.evaluate(() => (window.__pyrefly.battleLog() || []).length);

        // 1. Seed every submenu that exists on this actor's row list, and
        //    measure its labels on the way through.
        const seeded = [];
        for (let i = 0; i < top.length; i++) {
          if (!top[i].group || top[i].disabled) continue;
          if (!(await selectRow(page, i))) continue;
          await page.keyboard.press('Enter');
          await page.waitForTimeout(260);
          const inside = await page.evaluate(READ_MENU);
          if (!inside.title) continue;
          seeded.push(inside.title);
          console.log(
            `     [${actor}] submenu "${inside.title}": ${JSON.stringify(inside.rows.map((r) => `${r.label?.text} ${r.label?.sw}/${r.label?.cw}${r.gate ? ' gate' : ''}${r.label?.paintOutRight > 0.5 ? ` OUT+${r.label.paintOutRight}` : ''}`))} overflow=${inside.stack?.overflowing}`,
          );
          report.labels.push({ chapter: name, vp: vps, actor, submenu: inside.title, rows: inside.rows, stack: inside.stack });
          for (const row of inside.rows) {
            const L = row.label;
            if (!L) continue;
            if (L.clipped) fail(`${name} ${vps} [${actor}] "${inside.title}" row "${L.text}" is elided (${L.sw} needs / ${L.cw} given)`);
            if (L.paintOutRight > 0.5) fail(`${name} ${vps} [${actor}] "${inside.title}" row "${L.text}" paints ${L.paintOutRight}px past the row box`);
            if (row.grants?.clipped) fail(`${name} ${vps} [${actor}] "${inside.title}" gate line "${row.grants.text}" is elided`);
          }
          if (inside.stack?.overflowing) fail(`${name} ${vps} [${actor}]: "${inside.title}" overflows the command window (scrollH ${inside.stack.scrollH} > clientH ${inside.stack.clientH})`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(280);
          const back = await page.evaluate(() => window.__pyrefly.screen());
          if (back !== 'battle') {
            fail(`${name} ${vps} [${actor}]: one Esc out of the "${inside.title}" submenu opened screen "${back}"`);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(400);
          }
        }

        // 2. Find a row that leads to target selection and take it there.
        let from = null;
        for (let i = 0; i < top.length && from === null; i++) {
          if (top[i].disabled) continue;
          if (!(await selectRow(page, i))) continue;
          await page.keyboard.press('Enter');
          await page.waitForTimeout(380);
          let m = await page.evaluate(READ_MENU);
          let title = '';
          if (m.reticles === 0 && m.title !== '' && m.rows.length > 0) {
            title = m.title;
            await page.keyboard.press('Enter');
            await page.waitForTimeout(380);
            m = await page.evaluate(READ_MENU);
          }
          if (m.reticles > 0) from = { title, row: top[i].label, m };
          else if (m.rows.length === 0) break; // the command committed — turn gone
        }
        if (!from) {
          console.log(`  turn ${turn} [${actor}]: no row reached target selection`);
          continue;
        }

        // 3. Esc out of targeting.
        await page.keyboard.press('Escape');
        await page.waitForTimeout(340);
        const after = await page.evaluate(READ_MENU);
        console.log(
          `  turn ${turn} [${actor}] seeded=${JSON.stringify(seeded)} picked "${from.row}" from ${from.title ? `submenu "${from.title}"` : 'the top rows'} -> screen "${after.screen}" title "${after.title}" reticles ${from.m.reticles}->${after.reticles} rows ${JSON.stringify(after.rows.map((r) => r.label?.text))}`,
        );
        if (after.screen !== 'battle') fail(`${name} ${vps} [${actor}]: Esc out of TARGETING opened screen "${after.screen}"`);
        if (after.reticles !== 0) fail(`${name} ${vps} [${actor}]: ${after.reticles} reticle(s) still drawn after cancelling targeting`);
        if (after.title !== from.title) fail(`${name} ${vps} [${actor}]: cancel landed in "${after.title}", expected ${from.title ? `"${from.title}"` : 'the top rows'} (seeded ${JSON.stringify(seeded)})`);
        if (after.rows.length === 0) fail(`${name} ${vps} [${actor}]: cancel left an EMPTY command window`);
        const moved = await page.evaluate(() => {
          const r = document.querySelector('.ffx2hud__command .ig-cmd--selected');
          return r ? r.getAttribute('data-idx') : null;
        });
        if (moved === null) fail(`${name} ${vps} [${actor}]: no row is selected after cancelling — the window is inert`);

        // 4. A second Esc at the top must hand the claim back to the pause menu.
        if (after.title === '') {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(520);
          const scr = await page.evaluate(() => window.__pyrefly.screen());
          console.log(`     give-back: Esc at the top row -> "${scr}"`);
          if (scr !== 'pause') fail(`${name} ${vps} [${actor}]: Esc at the top row after a cancel did NOT open the pause menu (screen "${scr}") — the cancel claim was never given back`);
          else {
            await page.screenshot({ path: path.join(OUT, `cancel-pause-${name}-${w}x${h}-t${turn}.png`), timeout: 180000 });
            await page.keyboard.press('Escape');
            await page.waitForTimeout(600);
          }
        }

        // 5. Commit and read what the engine was told.
        for (let k = 0; k < 4; k++) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(340);
          const done = await page.evaluate(() => document.querySelectorAll('.ffx2hud__command .ig-cmd').length === 0);
          if (done) break;
        }
        await page.waitForTimeout(1300);
        const log = await page.evaluate((n) => (window.__pyrefly.battleLog() || []).slice(n).map((e) => e.type), before);
        const sc = await page.evaluate((n) => (window.__pyrefly.battleLog() || []).slice(n).filter((e) => e.type === 'spherechange'), before);
        console.log(`     committed: ${JSON.stringify(log.slice(0, 8))}`);
        if (sc.length) fail(`${name} ${vps} [${actor}]: committing after a cancel produced a SPHERECHANGE nobody chose — ${JSON.stringify(sc)}`);
        report.runs.push({ chapter: name, vp: vps, turn, actor, seeded, from: from.title, row: from.row, after: { screen: after.screen, title: after.title, reticles: after.reticles, rows: after.rows.map((r) => r.label?.text) }, log: log.slice(0, 10) });
      }
      console.log(`  actors covered: ${JSON.stringify([...seenActors])}`);
      await ctx.close();
    }
  }

  fs.writeFileSync(path.join(OUT, 'cancel2.json'), JSON.stringify(report, null, 1));
  console.log('\n==== ' + (report.failures.length ? `${report.failures.length} FAILURES` : 'cancel matrix green') + ' ====');
  for (const m of report.failures) console.log(' - ' + m);
  await browser.close();
}
main();
