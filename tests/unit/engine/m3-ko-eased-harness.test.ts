/**
 * Release 68 made `?kotopple=eased` (MF-17) the default (the driver's call under Bailey's delegation, 2026-10-28; both games). This reads the EASED fall and the EASED revive through the continuity harness's own maths
 * on the real `PaintedActor` under the real `LivingFigure`, for the twelve figures in both tempos, the way `ko-fall-actor.test.ts` and `ko-revive-actor.test.ts` read release 67's (those two files now name `today`).
 *
 * What it finds (2026-10-28, the unit model; the masks are synthetic, so it is evidence and not the harness's reading of the real paintings):
 * - the eased REVIVE is clean for all 24 (no jerk event, no step of 40 px, every ghost under the limit; the biggest tracked step falls from 23 to 49 px (today) to 21 to 38 (eased));
 * - the eased FALL has the biggest tracked head step at the cut of 15 to 26 px for 22 of the 24 (today 28 to 57), but **Kimahri's is 46.8 px (FFX tempo) and 46.3 (FFX-2 tempo)**: a single-frame step of the head when the lying painting
 *   takes over, ratio 6.7 against the steps around it, over `jerkFailPx` (40): the harness would GATE it (CHK-027: a jerk at a pose swap is gateable). It is not new geometry: the standing plane's toppled head and the lying painting's
 *   head are that far apart for him in both arms, but today's turn is still fast when the lying painting arrives, so the step is part of a ramp (today's biggest step for him is 37.1 and no event), where the eased turn has come to
 *   rest and the same step stands alone. **Lulu's is 24.9 and 24.5 px**, a reported jerk event just over `jerkMinPx` (24) and well under the 40 px fail line.
 * - none of this acts in Chapter I and Chapter IV under release 67's `?curves=real-snappy` default for a figure the real-motion table covers (the real buckle plays, `KoFall.fallRun`'s `buckleMs`), so the eased FALL is read where no
 *   real clip is (the other chapters, `?pack=off`, a phone, a figure not in the table).
 *
 * So the first test pins what is clean and the second pins the two figures as they are NOW, by name, so a change to the eased fall (a longer cross, a residual speed at the cut, a per-figure end angle) shows up here and the list is
 * edited in the same commit. Open question 1 of `docs/handoff/m3-flips.md`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { reset } from './head-lock-fixture.ts';
import { CFG, FRAME, analyzeSwap, anchors, fall, index, lying, revive, rig, slots, standing } from './ko-fall-fixture.ts';
import { detectJerks, figureTrack } from '../../../critic/runner/lib/continuity-pure.mjs';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';

beforeEach(() => setMoveWord('kotopple', 'eased'));
afterEach(() => {
  reset();
  setMoveWord('kotopple', null);
});

const PARTY = ['tidus', 'yuna', 'auron', 'kimahri', 'lulu', 'wakka', 'rikku', 'rikku-thief', 'yuna-gunner', 'paine-warrior', 'yuna-white-mage', 'rikku-gunner'];
const GAMES = ['ffx', 'ffx2'] as const;
type Frames = ReturnType<typeof fall>;
const idle = (r: ReturnType<typeof rig>) => slots(r.a).find((s) => s.pose === 'idle')!;

interface Read {
  snap: boolean;
  hardCut: boolean;
  blendFrames: number;
  ghost: number;
  peak: number;
  failHead: boolean;
  worst: number;
  jerks: Array<{ part: string; px: number }>;
}
function read(r: ReturnType<typeof rig>, rec: Frames, from: number, to: number): Read {
  const frames = rec.map((fig, n) => ({ n, t: n * FRAME, fig }));
  const an = anchors(r.a);
  const at = frames.findIndex((f) => f.fig.s[to]![1]! >= 0.5);
  const swap = analyzeSwap({ frames, at, swap: { from, to }, anchors: an as never, k1600: 1, camCut: false, cfg: CFG });
  const track = frames.map((f) => {
    const t = figureTrack(f.fig, an as never);
    return { n: f.n, t: f.t, feet: t?.feet ?? null, head: t?.head ?? null, cam: [0, 0] as [number, number] };
  });
  let worst = 0;
  for (let i = 1; i < track.length; i++) {
    for (const part of ['feet', 'head'] as const) {
      const a = track[i - 1]![part];
      const b = track[i]![part];
      if (a && b) worst = Math.max(worst, Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
  }
  const jerks = (detectJerks(track, 1, CFG) as Array<{ part: string; px: number }>).map((j) => ({ part: j.part, px: j.px }));
  return { snap: swap.snap, hardCut: swap.hardCut, blendFrames: swap.blendFrames, ghost: swap.ghost.severity, peak: swap.ghost.peak, failHead: swap.failHead, worst, jerks };
}

function eased(game: (typeof GAMES)[number], subject: string): { fall: Read; revive: Read } {
  const r = rig(subject, { game });
  const played = fall(r, 40); // the planes exist once the figure has been knocked out
  const fallRead = read(r, played, index(r.a, standing(r.a)), index(r.a, lying(r.a)));
  const down = revive(r, 40);
  const reviveRead = read(r, down, index(r.a, lying(r.a)), index(r.a, idle(r)));
  return { fall: fallRead, revive: reviveRead };
}

describe('the eased fall and revive, read as the continuity harness reads them (twelve figures, both tempos)', () => {
  const all = GAMES.flatMap((game) => PARTY.map((subject) => ({ game, subject, ...eased(game, subject) })));

  it('no snap, no hard cut, blend frames, every ghost under the limit and the head held, for the fall and the revive of all 24', () => {
    for (const { game, subject, fall: f, revive: v } of all) {
      const why = `${game} ${subject}`;
      for (const [what, x] of [['fall', f], ['revive', v]] as const) {
        expect(x.snap, `${why} ${what}`).toBe(false);
        expect(x.hardCut, `${why} ${what}`).toBe(false);
        expect(x.blendFrames, `${why} ${what}`).toBeGreaterThanOrEqual(2);
        expect(x.ghost, `${why} ${what}`).toBeLessThan(CFG.motion.ghostSeverityFail);
        expect(x.peak, `${why} ${what}`).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-3);
        expect(x.failHead, `${why} ${what}`).toBe(false);
      }
    }
  });

  it('the eased revive has no jerk event and no tracked step of 40 px, for all 24 (today: 23 to 49 px)', () => {
    for (const { game, subject, revive: v } of all) {
      expect(v.jerks, `${game} ${subject}`).toEqual([]);
      expect(v.worst, `${game} ${subject}`).toBeLessThan(CFG.motion.jerkFailPx);
    }
  });

  it('OPEN (CHK-027, see the header): the eased fall\'s one-frame head step at the cut is flagged for Kimahri (over the 40 px fail line) and Lulu (a reported event under it) in both tempos, and for nobody else', () => {
    const flagged = all.filter((x) => x.fall.jerks.length > 0).map((x) => `${x.game} ${x.subject}`);
    expect(flagged).toEqual(['ffx kimahri', 'ffx lulu', 'ffx2 kimahri', 'ffx2 lulu']);
    for (const x of all) {
      const px = Math.max(0, ...x.fall.jerks.map((j) => j.px));
      if (x.subject === 'kimahri') expect(px, `${x.game} kimahri`).toBeGreaterThanOrEqual(CFG.motion.jerkFailPx);
      else if (x.subject === 'lulu') expect(px, `${x.game} lulu`).toBeLessThan(CFG.motion.jerkFailPx);
      else expect(x.fall.worst, `${x.game} ${x.subject}`).toBeLessThan(27); // the biggest tracked step: 15 to 26 px against today's 28 to 57
    }
  });
});
