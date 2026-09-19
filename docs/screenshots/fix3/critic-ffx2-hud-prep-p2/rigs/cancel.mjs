/**
 * Hostile test 3 — the cancel path, beyond the one sequence the builder drove.
 *
 * The builder drove exactly one shape per chapter (ch4 = top leaf, ch5 = group)
 * and one actor per turn, whoever the ATB happened to hand it. This drives, per
 * chapter and viewport:
 *
 *  A  the builder's own sequence, but repeated on THREE consecutive turns, so
 *     Yuna, Rikku and Paine each get it (their command sets differ, and Change
 *     reaches different dresspheres from each)
 *  B  cross-stale: open Skill, Esc, open Change, Esc, THEN pick a targeted
 *     command and Esc out of it — two stale submenus deep
 *  C  Esc out of targeting must NOT open the pause menu (the cancelClaim
 *     contract the one red unit test is poking at)
 *  D  a SECOND Esc at the top level MUST open the pause menu — the claim has to
 *     be given back, not kept
 *  E  rapid presses with no settle between them: Enter/Escape/Enter back to back
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, bootBattle, READ_MENU, arrowTo, waitMenu, OUT } from './lib.mjs';

fs.mkdirSync(OUT, { recursive: true });

const ACTOR = () =>
  (document.querySelector('.ffx2hud__command')?.getAttribute('data-actor') ||
    document.querySelector('.ffx2hud__party .ig-stat--active .ig-stat__name')?.textContent ||
    document.querySelector('.mad__card .mad__who')?.textContent ||
    '?').trim();

async function openTargeting(page) {
  // Returns { title } describing where the pending command was picked from,
  // or null if targeting was never reached.
  if (!(await arrowTo(page, 'Attack'))) return null;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(420);
  let m = await page.evaluate(READ_MENU);
  let from = '';
  if (m.reticles === 0 && m.title !== '' && m.rows.length > 0) {
    from = m.title;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(420);
    m = await page.evaluate(READ_MENU);
  }
  return m.reticles > 0 ? { from, m } : null;
}

async function main() {
  const browser = await launch();
  const report = { runs: [], failures: [] };
  const fail = (m) => {
    report.failures.push(m);
    console.log('  FAIL ' + m);
  };

  const VPS = (process.env.VPS ?? '1280x720,1600x900,2000x1000,2560x1440').split(',');
  for (const [chapter, name] of [
    ['ffx2-bahamut', 'ch4'],
    ['ffx2-vegnagun-shuyin', 'ch5'],
  ]) {
    for (const vps of VPS) {
      const [w, h] = vps.split('x').map(Number);
      const { ctx, page } = await newPage(browser, w, h);
      await bootBattle(page, chapter);
      console.log(`== ${name} ${vps}`);

      // ---- A + B: three consecutive turns, alternating the staleness seeded --
      for (let turn = 0; turn < 3; turn++) {
        if (!(await waitMenu(page, 90000))) {
          console.log(`  turn ${turn}: no command window inside 90 s — skipping`);
          continue;
        }
        const actor = await page.evaluate(ACTOR);
        const before = await page.evaluate(() => (window.__pyrefly.battleLog() || []).length);

        // Seed stale submenu state. Turn 0: Change only (the builder's).
        // Turns 1-2: Skill THEN Change, so two different submenus are stale.
        const seeds = turn === 0 ? ['Change'] : ['Skill', 'Change'];
        const seeded = [];
        for (const s of seeds) {
          if (await arrowTo(page, s)) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(280);
            const inside = await page.evaluate(READ_MENU);
            if (inside.title) seeded.push(inside.title);
            // Defect 3's claim, re-measured per ACTOR: the builder only ever
            // read whichever girl the ATB handed the turn to.
            for (const row of inside.rows) {
              const L = row.label;
              if (!L) continue;
              const bad = [];
              if (L.clipped) bad.push(`elided (${L.sw} needs / ${L.cw} given)`);
              if (L.paintOutRight > 0.5) bad.push(`paints ${L.paintOutRight}px past the row's right edge`);
              if (L.paintOutLeft > 0.5) bad.push(`paints ${L.paintOutLeft}px past the row's left edge`);
              if (row.grants?.clipped) bad.push(`gate line "${row.grants.text}" elided`);
              if (bad.length) fail(`${name} ${vps} (${actor}) "${inside.title}" row "${L.text}": ${bad.join('; ')}`);
            }
            report.runs.push({
              chapter: name,
              vp: vps,
              actor,
              submenu: inside.title,
              rows: inside.rows.map((r) => ({ t: r.label?.text, gate: r.gate, sw: r.label?.sw, cw: r.label?.cw, outR: r.label?.paintOutRight, grants: r.grants?.text, gsw: r.grants?.sw, gcw: r.grants?.cw, rowH: r.row?.h })),
              stack: inside.stack,
            });
            console.log(`     submenu "${inside.title}" (${actor}): ${JSON.stringify(inside.rows.map((r) => `${r.label?.text} ${r.label?.sw}/${r.label?.cw}${r.gate ? ' [gate]' : ''}`))} stackOverflowing=${inside.stack?.overflowing}`);
            if (inside.stack?.overflowing) fail(`${name} ${vps} (${actor}): the "${inside.title}" submenu overflows the command window (scrollH ${inside.stack.scrollH} > clientH ${inside.stack.clientH})`);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(320);
            const back = await page.evaluate(READ_MENU);
            if (back.screen !== 'battle') {
              fail(`${name} ${vps} turn ${turn} (${actor}): one Esc out of the "${s}" submenu landed on screen "${back.screen}"`);
              await page.keyboard.press('Escape');
              await page.waitForTimeout(400);
            }
          }
        }

        const t = await openTargeting(page);
        if (!t) {
          console.log(`  turn ${turn} (${actor}): never reached targeting — skipping`);
          continue;
        }

        // ---- C: Esc out of targeting must not open the pause menu ----------
        await page.keyboard.press('Escape');
        await page.waitForTimeout(340);
        const after = await page.evaluate(READ_MENU);
        console.log(
          `  turn ${turn} (${actor}) seeded=${JSON.stringify(seeded)} pickedFrom=${t.from ? `"${t.from}"` : 'top leaf'} -> screen "${after.screen}" title "${after.title}" reticles ${t.m.reticles}->${after.reticles} rows ${JSON.stringify(after.rows.map((r) => r.label?.text))}`,
        );
        if (after.screen !== 'battle') fail(`${name} ${vps} turn ${turn} (${actor}): Esc out of TARGETING opened screen "${after.screen}"`);
        if (after.reticles !== 0) fail(`${name} ${vps} turn ${turn} (${actor}): ${after.reticles} reticle(s) still drawn after cancelling targeting`);
        if (after.title !== t.from) fail(`${name} ${vps} turn ${turn} (${actor}): cancel landed in "${after.title}", expected ${t.from ? `"${t.from}"` : 'the top rows'} (seeded ${JSON.stringify(seeded)})`);
        if (after.rows.length === 0) fail(`${name} ${vps} turn ${turn} (${actor}): cancel left an EMPTY command window`);

        // ---- Commit Attack and read what the engine was actually told ------
        await arrowTo(page, 'Attack');
        for (let k = 0; k < 3; k++) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(360);
          const done = await page.evaluate(() => document.querySelectorAll('.ffx2hud__command .ig-cmd').length === 0);
          if (done) break;
        }
        await page.waitForTimeout(1400);
        const log = await page.evaluate((n) => (window.__pyrefly.battleLog() || []).slice(n).map((e) => e.type), before);
        console.log(`     committed: ${JSON.stringify(log.slice(0, 8))}`);
        if (log.includes('spherechange')) fail(`${name} ${vps} turn ${turn} (${actor}): Attack after a cancel committed a SPHERECHANGE — ${JSON.stringify(log.slice(0, 10))}`);
        report.runs.push({ chapter: name, vp: vps, turn, actor, seeded, from: t.from, after: { screen: after.screen, title: after.title, reticles: after.reticles, rows: after.rows.map((r) => r.label?.text) }, log: log.slice(0, 10) });
      }

      // ---- D: the claim must be GIVEN BACK — a plain Esc at the top opens pause
      if (await waitMenu(page, 60000)) {
        const t2 = await openTargeting(page);
        if (t2) {
          await page.keyboard.press('Escape'); // out of targeting: no pause
          await page.waitForTimeout(360);
          const mid = await page.evaluate(() => window.__pyrefly.screen());
          await page.keyboard.press('Escape'); // at the top: pause SHOULD open
          await page.waitForTimeout(500);
          const end = await page.evaluate(() => window.__pyrefly.screen());
          console.log(`  give-back: after Esc#1 screen "${mid}", after Esc#2 screen "${end}"`);
          if (mid !== 'battle') fail(`${name} ${vps}: Esc#1 out of targeting opened "${mid}"`);
          if (end !== 'pause') fail(`${name} ${vps}: Esc#2 at the top row did NOT open the pause menu (screen "${end}") — the cancel claim was not given back`);
          report.runs.push({ chapter: name, vp: vps, giveBack: { mid, end } });
          await page.screenshot({ path: path.join(OUT, `cancel-giveback-${name}-${w}x${h}.png`), timeout: 180000 });
          if (end === 'pause') {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        } else {
          console.log('  give-back: never reached targeting');
        }
      }

      // ---- E: rapid presses, no settle -----------------------------------
      if (await waitMenu(page, 60000)) {
        const before = await page.evaluate(() => (window.__pyrefly.battleLog() || []).length);
        await arrowTo(page, 'Change');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Escape');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(900);
        const st = await page.evaluate(READ_MENU);
        const log = await page.evaluate((n) => (window.__pyrefly.battleLog() || []).slice(n).map((e) => e.type), before);
        console.log(`  rapid: screen "${st.screen}" title "${st.title}" rows ${st.rows.length} reticles ${st.reticles} log ${JSON.stringify(log.slice(0, 6))}`);
        if (st.screen === 'battle' && st.rows.length === 0 && st.reticles === 0 && !log.length) {
          fail(`${name} ${vps}: rapid Enter/Esc left NO command window, NO reticles and NO committed action — the turn is stuck`);
        }
        if (st.reticles > 0 && st.rows.length > 0) fail(`${name} ${vps}: rapid Enter/Esc left reticles AND a command window up at the same time`);
        await page.screenshot({ path: path.join(OUT, `cancel-rapid-${name}-${w}x${h}.png`), timeout: 180000 });
        report.runs.push({ chapter: name, vp: vps, rapid: { screen: st.screen, title: st.title, rows: st.rows.length, reticles: st.reticles, log: log.slice(0, 6) } });
      }

      await ctx.close();
    }
  }

  fs.writeFileSync(path.join(OUT, 'cancel.json'), JSON.stringify(report, null, 1));
  console.log('\n==== ' + (report.failures.length ? `${report.failures.length} FAILURES` : 'cancel matrix green') + ' ====');
  for (const m of report.failures) console.log(' - ' + m);
  await browser.close();
}
main();
