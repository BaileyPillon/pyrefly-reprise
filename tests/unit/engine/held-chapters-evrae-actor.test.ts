/**
 * Evrae on the REAL `PaintedActor` with his real registration rows and the silhouettes of his real paintings (held-chapters lane, 2026-10-29; FFX only; needs the art on this disk, as `pose-scale-art.test.ts` does).
 *
 * The planner's big-change test read the distance between two heads along x only, so Evrae's `cast>idle` (his attack painting to his idle, the head 57 px lower: 0.12 of his height, 0.03 of it sideways, the coil
 * outlines overlapping 0.7) was a "close" pair and got the 50 ms three-frame blend, which steps the weighted head 0.6 of that distance in one frame. In the chapter (`BLEND_HEAD_CHAPTERS`) that pair, and `hurt>idle`
 * (the head rears 100 painting px when he is hit), now keep today's blend; in a chapter that is not named, with the same figure, they are the 50 ms blend, so the guard is the chapter's and not the figure's.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { EVRAE_WORLD_HEIGHT } from '../../../src/scenes/evrae-airship-range.ts';
import { coarseMask, type CoarseMask } from '../../../src/engine/PoseAlign.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { resetSmearLog } from '../../../src/engine/motion/SmearLog.ts';
import { resetSwapLog, swapLog } from '../../../src/engine/motion/SwapLog.ts';
import { setCauseMode, setStanceMode, setSwapScope } from '../../../src/engine/motion/SwapSwitch.ts';

const art = process.env['PYREFLY_ART_DIR'] ?? resolve('public/art');
const haveArt = existsSync(join(art, 'characters', 'evrae', 'idle.png')) && existsSync(resolve('docs/target/pose-measure.json'));

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
  setSmearStyle('paint');
});
afterEach(() => {
  setSmearStyle(null);
  setMomentsMode(null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setPaceGame('other');
  resetSmearLog();
  resetSwapLog();
  reset();
});

/** The silhouette the engine would read from a painting: the file at most 256 wide and 1024 tall, the alpha cut at 0.35, on the 48-cell grid. */
async function silhouetteOf(file: string): Promise<CoarseMask> {
  const meta = await sharp(file).metadata();
  const sw = Math.min(meta.width!, 256), sh = Math.min(meta.height!, 1024);
  const { data } = await sharp(file).ensureAlpha().resize(sw, sh, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return coarseMask(data, sw, sh, Math.round(0.35 * 255))!;
}

async function evrae(): Promise<Actor> {
  const a = new PaintedActor({ name: 'evrae', worldHeight: EVRAE_WORLD_HEIGHT, side: 'enemy', breathe: false, sway: false, shadow: false });
  const dir = join(art, 'characters', 'evrae');
  const paint = async (file: string) => painting('evrae', file, { silhouette: await silhouetteOf(join(dir, `${file}.png`)) }, `/art/characters/evrae/${file}.png`);
  // the near range's poses: `cast` draws his attack painting, as the recorded chapter does
  a.adoptPoses({ idle: await paint('idle'), cast: await paint('attack'), hurt: await paint('hurt') }, 'idle');
  a.position.set(2, 0, 0);
  return a;
}

/** Ask for `pose`, step until the blend ends; the frames in which both paintings show, and how long it took (ms). */
function play(a: Actor, pose: string): { both: number; ms: number } {
  a.setPose(pose);
  let both = 0;
  let i = 0;
  for (; i < 60; i++) {
    a.update(1 / 60);
    const [p, q] = slotsOf(a);
    if (p.fade > 1e-6 && q.fade > 1e-6) both++;
    if (!a.blending && i > 1) break;
  }
  return { both, ms: (i + 1) * (1000 / 60) };
}

describe.skipIf(!haveArt)('Evrae\'s two returns to his idle, on his real paintings and registration', () => {
  const back = async (chapter: string, from: 'cast' | 'hurt'): Promise<{ both: number; ms: number; designed: string[] }> => {
    setCurvesChapter(chapter);
    setSwapScope('all'); // the measuring word: the looks play in every chapter, the held ones too
    setCauseMode('pick');
    const a = await evrae();
    play(a, from); // the cut in (a glow, a hit): not what is read here
    for (let i = 0; i < 30; i++) a.update(1 / 60);
    resetSwapLog();
    const r = play(a, 'idle');
    return { ...r, designed: swapLog().designed.map((d) => `${d.from}>${d.to} ${d.cls} ${d.ms}`) };
  };

  it('in his own chapter, cast>idle keeps today\'s blend: nothing designed, and the two paintings share the screen for most of 100 ms', async () => {
    const r = await back('evrae-airship', 'cast');
    expect(r.designed).toEqual([]);
    expect(r.both).toBeGreaterThanOrEqual(5);
  });

  it('in his own chapter, hurt>idle keeps today\'s blend too', async () => {
    const r = await back('evrae-airship', 'hurt');
    expect(r.designed).toEqual([]);
    expect(r.both).toBeGreaterThanOrEqual(5);
  });

  it('the same figure in a chapter the table does not name gets the 50 ms three-frame blend for both (so the guard is the chapter\'s, and the pair really is one the planner calls close)', async () => {
    for (const from of ['cast', 'hurt'] as const) {
      const r = await back('seymour-natus', from);
      expect(r.designed, from).toEqual([from === 'cast' ? 'cast>idle castEnd 50' : 'hurt>idle recover 50']);
      expect(r.both, from).toBeLessThanOrEqual(3);
    }
  });
});
