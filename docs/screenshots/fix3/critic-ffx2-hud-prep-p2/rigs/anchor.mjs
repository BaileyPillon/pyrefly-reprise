/**
 * Before/after on ONE question: does the chain chip still sit where §4.6 puts
 * it — "top-right of the enemy being chained"?
 *
 * Runs the identical probe against two dev servers: PORT (the fix, b8e3889..)
 * and PORT_PRE (a worktree at b8e3889^). Measures the chip's PLACED rect (the
 * thing `placeSlab` returns and the player sees move) against the enemy's
 * projected head. No animation is frozen — this is the resting position.
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch, newPage, OUT } from './lib.mjs';

fs.mkdirSync(OUT, { recursive: true });
const POST = Number(process.env.PORT ?? 5541);
const PRE = Number(process.env.PORT_PRE ?? 5802);

const PROBE = (count) => {
  const r = (n) => +Number(n).toFixed(1);
  const hud = window.__pyrefly.battle()?.hud;
  const stage = window.__pyrefly.battle()?.stage;
  const st = window.__pyrefly.battleState();
  const enemy = Object.keys(st.combatants).find((k) => st.combatants[k].side === 'enemy' && st.combatants[k].hp > 0);
  hud?.onEvent({ type: 'chain', targetId: enemy, count, multiplier: 1.75 });
  const chip = document.querySelector('.ffx2-chain-chip');
  if (!chip) return { error: 'no chip' };
  const b = chip.getBoundingClientRect();
  let head = null;
  try {
    head = stage.project(enemy, 'head');
  } catch {
    /* */
  }
  return {
    enemy,
    head: head ? { x: r(head.x), y: r(head.y) } : null,
    chip: { l: r(b.left), t: r(b.top), rt: r(b.right), bt: r(b.bottom), w: r(b.width), h: r(b.height) },
    split: Boolean(chip.querySelector('.ffx2chain__body')),
    rightOfHead: head ? b.left >= head.x - 1 : null,
    aboveHead: head ? b.bottom <= head.y + 1 : null,
    dxLeftMinusHead: head ? r(b.left - head.x) : null,
    dyBottomMinusHead: head ? r(b.bottom - head.y) : null,
  };
};

async function boot(page, port, chapter) {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction('window.__pyreflyReady === true', null, { timeout: 300000 });
  await page.evaluate((c) => {
    window.__pyrefly.setSeed(7);
    window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true }).catch(() => {});
  }, chapter);
  await page.waitForFunction(
    () => window.__pyrefly.screen() === 'battle' && document.querySelectorAll('.ffx2hud__party .ig-stat').length >= 3,
    null,
    { timeout: 600000 },
  );
  await page.evaluate(() => window.__pyrefly.setBattleSpeed('normal'));
  for (let i = 0; i < 40; i++) {
    const n = await page.evaluate(() => document.querySelectorAll('.ffx2hud__command .ig-cmd-stack > *').length);
    if (n > 0) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }
  await page.waitForTimeout(1200);
}

async function main() {
  const browser = await launch();
  const report = [];
  for (const [chapter, name] of [
    ['ffx2-bahamut', 'ch4'],
    ['ffx2-vegnagun-shuyin', 'ch5'],
  ]) {
    for (const vps of (process.env.VPS ?? '1280x720,2560x1440').split(',')) {
      const [w, h] = vps.split('x').map(Number);
      const row = { chapter: name, vp: vps };
      for (const [tag, port] of [
        ['pre', PRE],
        ['post', POST],
      ]) {
        const { ctx, page } = await newPage(browser, w, h);
        try {
          await boot(page, port, chapter);
          const r = await page.evaluate(PROBE, 7);
          row[tag] = r;
          await page.screenshot({ path: path.join(OUT, `anchor-${tag}-${name}-${w}x${h}.png`), timeout: 180000 });
        } catch (e) {
          row[tag] = { error: String(e).slice(0, 200) };
        }
        await ctx.close();
      }
      const fmt = (r) =>
        r?.error
          ? `ERROR ${r.error}`
          : `${r.chip.w}x${r.chip.h}@(${r.chip.l},${r.chip.t}) head(${r.head?.x},${r.head?.y}) dx=${r.dxLeftMinusHead} dyBottom=${r.dyBottomMinusHead} rightOfHead=${r.rightOfHead} aboveHead=${r.aboveHead} split=${r.split}`;
      console.log(`== ${name} ${vps}`);
      console.log(`   PRE  ${fmt(row.pre)}`);
      console.log(`   POST ${fmt(row.post)}`);
      report.push(row);
    }
  }
  fs.writeFileSync(path.join(OUT, 'anchor.json'), JSON.stringify(report, null, 1));
  await browser.close();
}
main();
