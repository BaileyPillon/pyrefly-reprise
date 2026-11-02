/**
 * r73-sinface (FFX only; `docs/handoff/r73-sinface.md`): the cut-anchor row of Chapter XVIII never shifts a plane while the swap scope is at its default, because Chapter XVIII holds the smear.
 *
 * Split out of `r73-sinface-trace.test.ts` (house rule: every file under 400 lines). The REAL `PaintedActor` with the approved paintings' silhouettes (skipped where `public/art` is absent) plays the house strike with the
 * pose swaps made on its marks, under the real chapter ids: `evrae-airship` plays the smear (the positive control), and `sin-face` (Chapter XVIII by its own id; the first version of the trace used Yunalesca as a stand-in)
 * and `yunalesca` hold it. Review of 92bb3779d, minor 2.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { coarseMask, type CoarseMask } from '../../../src/engine/PoseAlign.ts';
import { setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setCutAnchorMode } from '../../../src/engine/motion/CutAnchor.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setSwapScope } from '../../../src/engine/motion/SwapSwitch.ts';
import { resetSmearLog } from '../../../src/engine/motion/SmearLog.ts';

/** The nearest listed FFX chapter that plays the smear, and the chapter whose held smear Chapter XVIII shares. */
const PLAYS = 'evrae-airship';
const HOLDS_SMEAR = 'yunalesca';

beforeEach(() => {
  setPaceGame('ffx');
  setTreatedScope('all');
  setCurvesMode('new');
  setDemoChapter(PLAYS);
});
afterEach(() => {
  setPaceGame('other');
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  setCutAnchorMode(null);
  setSmearStyle(null);
  setSwapScope(null);
  resetSmearLog();
  reset();
});

function figure(name: string, poses: readonly string[], masks: Record<string, CoarseMask>): Actor {
  const a = new PaintedActor({ name, worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const set: Record<string, ReturnType<typeof painting>> = {};
  for (const p of poses) set[p] = painting(name, p, { silhouette: masks[p]! });
  a.adoptPoses(set, 'idle');
  a.position.set(0, 0, 0);
  return a;
}

const art = process.env['PYREFLY_ART_DIR'] ?? resolve('public/art');
const haveArt = existsSync(join(art, 'characters', 'auron', 'idle.png')) && existsSync(resolve('docs/target/pose-measure.json'));

async function silhouetteOf(file: string): Promise<CoarseMask> {
  const meta = await sharp(file).metadata();
  const sw = Math.min(meta.width!, 256);
  const sh = Math.min(meta.height!, 1024);
  const { data } = await sharp(file).ensureAlpha().resize(sw, sh, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return coarseMask(data, sw, sh, Math.round(0.35 * 255))!;
}

describe.skipIf(!haveArt)('the chapter row of the cut anchor never shifts a plane in a chapter that holds the smear (Chapter XVIII holds it: `PieceHoldsLast.ts`)', () => {
  /** The largest drift (`slot.align`, world units) either plane carries in the frames after a ready to attack swap made on a moving figure's fastest frame. */
  async function drift(chapter: string, scope: 'wide' | 'all' = 'wide'): Promise<number> {
    setDemoChapter(chapter);
    setSmearStyle('paint'); // the page's default under the pack
    setSwapScope(scope); // `wide` is the page's default (`SwapSwitch.SCOPE_DEFAULT`): the exceptions (Yunalesca, Chapter XVIII, Ixion at Djose) keep release 67's look; `all` is the measuring word that ignores them
    setCutAnchorMode('on'); // the word Chapter XVIII's row carries (`CutAnchor.CUT_ANCHOR_CHAPTERS`)
    const masks: Record<string, CoarseMask> = {};
    for (const p of ['idle', 'ready', 'attack', 'follow']) masks[p] = await silhouetteOf(join(art, 'characters', 'auron', `${p}.png`));
    const a = figure('auron', ['idle', 'ready', 'attack', 'follow'], masks);
    a.setPose('ready', { immediate: true, force: true });
    a.update(0.001, 0.001);
    let worst = 0;
    let swapped = false;
    void a.strike({
      distance: 3, game: 'ffx', timeScale: 1, arc: true,
      marks: { travelPeak: () => { swapped = true; a.setPose('attack'); }, settlePeak: () => a.setPose('follow') },
    });
    for (let i = 0; i < 90; i++) {
      a.update(1 / 60, 1 / 60);
      for (const s of slotsOf(a) as unknown as Array<{ align: number }>) worst = Math.max(worst, Math.abs(s.align));
    }
    expect(swapped, chapter).toBe(true);
    return worst;
  }

  it('where the smear plays (positive control) the anchor shifts the incoming plane; where it is held (Chapter XVIII by its own id, and Yunalesca) it never does, under the default scope', async () => {
    expect(await drift(PLAYS)).toBeGreaterThan(0.05);
    expect(await drift('sin-face')).toBe(0);
    expect(await drift(HOLDS_SMEAR)).toBe(0);
  });

  it('under the measuring scope (?swapscope=all, which ignores the exceptions) the held-smear chapters\' anchor drifts 0.29 units: no sin-face job may carry that word by habit', async () => {
    for (const chapter of [HOLDS_SMEAR, 'sin-face']) {
      const all = await drift(chapter, 'all');
      expect(all, chapter).toBeGreaterThan(0.25);
      expect(all, chapter).toBeLessThan(0.33);
    }
  });
});
