/**
 * Hostile test 1 — the §4.6 "one-frame full-screen flash" at chain >= 20.
 *
 * The builder's "Critic 1b" claims removing the chip's transform *restored*
 * this flash ("the flash is viewport-fixed throughout"). §4.6 asks for a
 * ONE-FRAME flash per increment. `.ffx2-chain-chip.ffx2chain--flash::after` has
 * `position: fixed; inset: 0; opacity: 0.15` and NO animation at all, so the
 * class being present is the flash being on. Un-clipping it therefore does not
 * restore a flash — it turns a pink veil over the entire game on for the whole
 * CHAIN_HOLD_MS (1400 ms), re-extended by every further increment.
 *
 * Measured, not argued: screenshot the same frame at count 12 (no flash class)
 * and count 22 (flash class), long AFTER the 0.18 s pop has finished, and diff
 * pixels in the four corners — as far from the chip as the viewport allows.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { launch, newPage, bootBattle, OUT } from './lib.mjs';

fs.mkdirSync(OUT, { recursive: true });

const FIRE = (count) => {
  const hud = window.__pyrefly.battle()?.hud;
  const st = window.__pyrefly.battleState();
  const enemy = Object.keys(st.combatants).find((k) => st.combatants[k].side === 'enemy');
  hud?.onEvent({ type: 'chain', targetId: enemy, count, multiplier: 1.75 });
  const chip = document.querySelector('.ffx2-chain-chip');
  if (!chip) return { error: 'no chip' };
  const cs = getComputedStyle(chip, '::after');
  const body = chip.querySelector('.ffx2chain__body');
  return {
    classes: chip.className,
    flash: chip.classList.contains('ffx2chain--flash'),
    afterContent: cs.content,
    afterPosition: cs.position,
    afterInset: `${cs.top} ${cs.right} ${cs.bottom} ${cs.left}`,
    afterOpacity: cs.opacity,
    afterAnimation: cs.animationName,
    afterDuration: cs.animationDuration,
    afterBg: cs.backgroundColor,
    chipTransform: getComputedStyle(chip).transform,
    bodyAnim: body ? getComputedStyle(body).animationName : null,
  };
};

async function corners(buf, w, h) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (info.width * y + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  return {
    tl: at(4, 4),
    tr: at(w - 5, 4),
    bl: at(4, h - 5),
    br: at(w - 5, h - 5),
    midL: at(4, h >> 1),
    midR: at(w - 5, h >> 1),
  };
}

async function main() {
  const browser = await launch();
  const report = { runs: [], failures: [] };
  const fail = (m) => {
    report.failures.push(m);
    console.log('  FAIL ' + m);
  };

  for (const [chapter, name] of [
    ['ffx2-bahamut', 'ch4'],
    ['ffx2-vegnagun-shuyin', 'ch5'],
  ]) {
    for (const vps of ['1280x720', '2560x1440']) {
      const [w, h] = vps.split('x').map(Number);
      const { ctx, page } = await newPage(browser, w, h);
      await bootBattle(page, chapter);
      console.log(`== ${name} ${vps}`);

      // Baseline: no chain chip at all.
      await page.evaluate(() => document.querySelector('.ffx2-chain-chip')?.remove());
      await page.waitForTimeout(120);
      const baseBuf = await page.screenshot({ path: path.join(OUT, `flash-${name}-${w}x${h}-0-none.png`), timeout: 180000 });

      // Count 12: hot tier, no flash class. 700 ms after the event, so the
      // 0.18 s pop and the 0.42 s mote burst are both long over.
      const s12 = await page.evaluate(FIRE, 12);
      await page.waitForTimeout(700);
      const buf12 = await page.screenshot({ path: path.join(OUT, `flash-${name}-${w}x${h}-1-count12.png`), timeout: 180000 });

      // Count 22: flash tier. Same 700 ms wait.
      const s22 = await page.evaluate(FIRE, 22);
      await page.waitForTimeout(700);
      const buf22 = await page.screenshot({ path: path.join(OUT, `flash-${name}-${w}x${h}-2-count22.png`), timeout: 180000 });

      // And 1200 ms in — still inside CHAIN_HOLD_MS (1400 ms).
      await page.waitForTimeout(500);
      const buf22late = await page.screenshot({ path: path.join(OUT, `flash-${name}-${w}x${h}-3-count22-at-1200ms.png`), timeout: 180000 });

      const p0 = await corners(baseBuf, w, h);
      const p12 = await corners(buf12, w, h);
      const p22 = await corners(buf22, w, h);
      const p22l = await corners(buf22late, w, h);

      const d = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k].map((v, i) => b[k][i] - v)]));
      const d12 = d(p0, p12);
      const d22 = d(p0, p22);
      const d22l = d(p0, p22l);
      const maxAbs = (o) => Math.max(...Object.values(o).flat().map(Math.abs));

      console.log(`  ::after  position=${s22.afterPosition} inset=${s22.afterInset} opacity=${s22.afterOpacity} animation=${s22.afterAnimation} (${s22.afterDuration}) bg=${s22.afterBg}`);
      console.log(`  chip transform at count 22: ${s22.chipTransform}`);
      console.log(`  corners count12 delta vs no-chip: ${JSON.stringify(d12)} maxAbs=${maxAbs(d12)}`);
      console.log(`  corners count22 delta vs no-chip: ${JSON.stringify(d22)} maxAbs=${maxAbs(d22)}`);
      console.log(`  corners count22 @1200ms delta  : ${JSON.stringify(d22l)} maxAbs=${maxAbs(d22l)}`);

      const veil22 = maxAbs(d22);
      const veil12 = maxAbs(d12);
      const veilLate = maxAbs(d22l);
      if (veil22 > 6 && veil12 <= 6) {
        fail(
          `${name} ${vps}: chain 22 paints a full-viewport wash 700 ms after the increment — every corner shifts by up to ${veil22}/255 while count 12 shifts by ${veil12}. §4.6 asks for a ONE-FRAME flash; \`.ffx2chain--flash::after\` has animation:${s22.afterAnimation} so it is simply ON for the whole ${1400} ms hold.`,
        );
      }
      if (veilLate > 6) {
        fail(`${name} ${vps}: the wash is still on 1200 ms after the increment (maxAbs ${veilLate}/255)`);
      }

      report.runs.push({ chapter: name, vp: vps, s12, s22, d12, d22, d22l, veil12, veil22, veilLate });
      await ctx.close();
    }
  }

  fs.writeFileSync(path.join(OUT, 'flash.json'), JSON.stringify(report, null, 1));
  console.log('\n==== ' + (report.failures.length ? `${report.failures.length} FAILURES` : 'no flash finding') + ' ====');
  for (const m of report.failures) console.log(' - ' + m);
  await browser.close();
}
main();
