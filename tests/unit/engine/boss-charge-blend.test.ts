/**
 * r43-motion2 (round 25's PR-0378 and PR-0379 leftovers; FFX only: Evrae is Chapter VIII, Sin's fins Chapter XVII, and the range director that swaps their
 * charge painting is `BattleScreenAirship.ts`'s, FFX only; the actor's `blend` option is shared plumbing, both games, used by nothing else yet).
 *
 * What the harness found: three boss cast-to-idle changes (Evrae's Inhale, each Fin's "Core gathers energy.") were one-frame hard cuts, and the Right Fin's was a
 * 346 px whole-silhouette snap, with double images on its pose swaps (36 of the 44 severe ones). Two causes, both in the engine and neither in a painting:
 *
 * 1. The range director swaps the IDLE slot for the charge painting the moment the engine's flag rises, usually while the presenter has the figure in `cast`
 *    (the action that lit it). It did that through `loadPoses(map, 'idle')`, which forces idle at once: the pose the presenter had chosen was thrown away in one
 *    frame. Now the figure goes to idle through the actor's own blend (`PoseSwapOptions.blend`), like every other pose change.
 * 2. Release 391 registered the stance of 42 foes by the hem rule, Sin's fins included. A fin is no figure standing on its feet: its NEAR paintings are warps of the
 *    idle on the idle's own canvas (`registrationVsIdle` dx 0, dy 0). The rule read the Right Fin's attack at x 505 against the idle's 89.5 and slid that painting
 *    2.8 world units (416 painting px) left of where it was painted. The fins now stand at their canvas middle (`tools/posescale/overrides.json`): no plane is slid.
 *
 * The REAL `PaintedActor`, the REAL registration rows and the harness's own `analyzeSwap` / `figureTrack` / `detectJerks` with the policy's thresholds, stepped at
 * 60 fps through a camera 18 back (the strips' framing is not on record, so the pixel counts are this camera's: the Right Fin's centroid shift reads 263 px here
 * against the strips' 346; its overlap reads 0.098 here against 0.097 there). The masks are the paintings' own alpha (the harness's `decodeMask`) when
 * `public/art` is there, and the synthetic bars of the KO tests otherwise. "Before" is the old table's stances put back by hand and the forced swap; "after" is
 * today's table and the blend. Set PYREFLY_PRINT=1 to print the readings.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PaintedActor, cameraAt, painting, reset, viewOf, type Actor } from './head-lock-fixture.ts';
import { CFG, FRAME, anchors, record, slots } from './ko-fall-fixture.ts';
import { analyzeSwap, detectJerks, figureTrack } from '../../../critic/runner/lib/continuity-pure.mjs';
import { decodeMask, estimateCentroid } from '../../../critic/runner/lib/continuity-silhouette.mjs';
import { POSE_REGISTRATION } from '../../../src/engine/PoseRegistration.ts';
import { EVRAE_WORLD_HEIGHT } from '../../../src/scenes/evrae-airship-range.ts';

afterEach(reset);

const ART = resolve(__dirname, '..', '..', '..', 'public', 'art', 'characters');
const HAVE_ART = existsSync(resolve(ART, 'sin-right-fin', 'attack.png')) && existsSync(resolve(ART, 'evrae', 'breath-charge.png'));

interface Boss {
  who: string;
  art: string;
  worldHeight: number;
  /** The painting the idle slot changes to while the charge holds. */
  charge: string;
  /** Where the old hem rule put each painting's stance (the table before this change), or null when this boss was never mis-registered. */
  oldStance: Record<string, number> | null;
}
const BOSSES: Boss[] = [
  { who: 'Evrae', art: 'evrae', worldHeight: EVRAE_WORLD_HEIGHT, charge: 'breath-charge', oldStance: null },
  { who: 'the Left Fin', art: 'sin-left-fin', worldHeight: 6.79, charge: 'charge-near', oldStance: { idle: 859.5, attack: 863, 'charge-near': 859.5 } },
  { who: 'the Right Fin', art: 'sin-right-fin', worldHeight: 6.21, charge: 'charge-near', oldStance: { idle: 89.5, attack: 505, 'charge-near': 89.5 } },
];
const RIGHT_FIN = BOSSES[2]!;

type Mask = Awaited<ReturnType<typeof decodeMask>>;
type Tex = ReturnType<typeof painting>;
const masks = new Map<string, Mask>();
beforeAll(async () => {
  if (!HAVE_ART) return;
  for (const b of BOSSES) for (const pose of ['idle', 'attack', b.charge]) masks.set(`${b.art}/${pose}`, await decodeMask(readFileSync(resolve(ART, b.art, `${pose}.png`))));
});

/** The paintings of a boss as the director's NEAR map hands them: cast falls back to attack, hurt to idle; `old` puts the old stances back. */
function paintings(b: Boss, old: boolean): Record<'idle' | 'attack' | 'charged' | 'hurt', Tex> {
  const make = (pose: string): Tex => painting(b.art, pose, old && b.oldStance ? { stanceX: b.oldStance[pose]! } : {});
  const idle = make('idle');
  return { idle, attack: make('attack'), charged: make(b.charge), hurt: b.art === 'evrae' ? painting(b.art, 'hurt') : idle };
}

function boss(b: Boss, p: ReturnType<typeof paintings>): Actor {
  const a = new PaintedActor({ name: b.art, worldHeight: b.worldHeight, side: 'enemy', crossfadeMs: 140, breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: p.idle, attack: p.attack, cast: p.attack, hurt: p.hurt }, 'idle');
  a.position.set(2, 0, 0);
  return a;
}

/** The harness's anchors of the two planes: the registered stance, and the painting's own alpha (or the KO tests' synthetic bar) with its centroid. */
function anchorsOf(a: Actor, real: boolean): Array<Record<string, unknown>> {
  return anchors(a).map((an, k) => {
    const url = (slots(a)[k] as unknown as { painted?: { url: string } }).painted?.url ?? '';
    const key = /characters\/([^/]+)\/([^/.]+)\.png/.exec(url)?.slice(1, 3).join('/') ?? '';
    const m = ((real ? masks.get(key) : undefined) ?? an['mask']) as Mask;
    return { ...an, mask: m, centroid: estimateCentroid(m) };
  });
}

interface Reading {
  hardCut: boolean;
  snap: boolean;
  blendFrames: number;
  iou: number | null;
  centroidShiftPx: number | null;
  ghostSeverity: number;
  /** The biggest single-frame step of the figure's fade-weighted CENTROID track (the harness's reading for a figure with no head), px at 1600 wide. */
  centroidStep: number;
  jerks: number;
  /** How many frames the idle plane took from first showing to full. */
  rise: number;
}

/**
 * The scene of the harness's strips: the boss rests, the presenter puts it in `cast` (the action), it holds the cast painting, the engine's flag rises and the
 * director swaps the idle slot for the charge painting. `forced` is the old call (`adoptPoses(map, 'idle')`), the other is `{ blend: true }`.
 */
function read(b: Boss, o: { forced: boolean; old: boolean; real: boolean }): Reading {
  const p = paintings(b, o.old);
  const a = boss(b, p);
  const cam = cameraAt(2, 18);
  const step = (): void => {
    a.update(FRAME / 1000, FRAME / 1000);
    a.holdHead(viewOf(cam));
    a.updateMatrixWorld(true);
  };
  for (let i = 0; i < 8; i++) step();
  a.setPose('cast'); // the presenter's action-start
  for (let i = 0; i < 14; i++) step(); // the cast painting is whole (the harness read the swap 12 to 20 frames after the log's action-start)
  const frames: Array<{ n: number; t: number; fig: ReturnType<typeof record> }> = [];
  const push = (): void => void frames.push({ n: frames.length, t: frames.length * FRAME, fig: record({ a, cam } as never) });
  push();
  const next = { idle: p.charged, attack: p.attack, cast: p.attack, hurt: p.hurt };
  if (o.forced) a.adoptPoses(next, 'idle');
  else a.adoptPoses(next, 'idle', { blend: true });
  for (let i = 0; i < 20; i++) {
    push();
    step();
  }
  push();
  const an = anchorsOf(a, o.real);
  const idle = slots(a).findIndex((s) => s.pose === 'idle');
  const cast = slots(a).findIndex((s) => s.pose === 'cast');
  const at = frames.findIndex((f) => f.fig.s[idle]![1]! >= 0.5);
  const swap = analyzeSwap({ frames, at, swap: { from: cast, to: idle }, anchors: an as never, k1600: 1, camCut: false, cfg: CFG });
  const track = frames.map((f) => ({ n: f.n, t: f.t, feet: null, head: null, centroid: figureTrack(f.fig, an as never, true)?.centroid ?? null, cam: [0, 0] as [number, number] }));
  let centroidStep = 0;
  for (let i = 1; i < track.length; i++) {
    const c0 = track[i - 1]!.centroid;
    const c1 = track[i]!.centroid;
    if (c0 && c1) centroidStep = Math.max(centroidStep, Math.hypot(c1[0] - c0[0], c1[1] - c0[1]));
  }
  return {
    hardCut: swap.hardCut,
    snap: swap.snap,
    blendFrames: swap.blendFrames,
    iou: swap.outline?.iou ?? null,
    centroidShiftPx: swap.outline?.centroidShiftPx ?? null,
    ghostSeverity: swap.ghost.severity,
    centroidStep: Math.round(centroidStep * 10) / 10,
    jerks: detectJerks(track as never, 1, CFG).length,
    rise: frames.findIndex((f) => f.fig.s[idle]![1]! >= 1) - frames.findIndex((f) => f.fig.s[idle]![1]! > 0.02),
  };
}

const SOURCES: Array<{ name: string; real: boolean }> = [{ name: 'synthetic masks', real: false }, ...(HAVE_ART ? [{ name: "the paintings' own alpha", real: true }] : [])];

for (const src of SOURCES) {
  describe(`the three boss cast-to-idle changes, read by the continuity harness (${src.name})`, () => {
    for (const b of BOSSES) {
      it(`${b.who}: before (the forced swap) a one-frame hard cut and a snap; after, the idle comes up through the blend (no snap, 3 or more blend frames, ghost under the check's 0.40, no jerk)`, () => {
        const before = read(b, { forced: true, old: true, real: src.real });
        const after = read(b, { forced: false, old: false, real: src.real });
        // the finding, reproduced: no frame has both paintings up, and the outline changes by more than the snap rule's 5 percent
        // (the synthetic bar is one shape: where the old table slid a plane only 3.5 px, the Left Fin's, the two overlap 0.97 and the cut is no snap; the paintings' own alpha read 0.874)
        expect(before.hardCut, JSON.stringify(before)).toBe(true);
        expect(before.snap, JSON.stringify(before)).toBe(src.real || b.art !== 'sin-left-fin');
        expect(before.blendFrames).toBe(0);
        // the fix: a real-clock blend, 140 ms at 60 fps
        expect(after.hardCut, JSON.stringify(after)).toBe(false);
        expect(after.snap, JSON.stringify(after)).toBe(false);
        expect(after.blendFrames).toBeGreaterThanOrEqual(3);
        expect(after.rise).toBeGreaterThanOrEqual(7); // 140 ms is 8.4 frames
        expect(after.ghostSeverity).toBeLessThan(CFG.motion.ghostSeverityFail);
        expect(after.centroidStep, 'the fade-weighted centroid never steps 40 px in a frame').toBeLessThan(CFG.motion.jerkFailPx);
        expect(after.jerks).toBe(0);
        expect(after.centroidStep).toBeLessThan(before.centroidStep);
        if (process.env['PYREFLY_PRINT']) console.log(`${src.name} | ${b.who} | before ${JSON.stringify(before)} | after ${JSON.stringify(after)}`);
      });
    }

    it("the Right Fin: the old stances slid the attack 2.8 world units away (overlap 0.10, double images of 0.45 on a plain dissolve); today the paintings overlap and the dissolve stays under the check's 0.40", () => {
      const before = read(RIGHT_FIN, { forced: false, old: true, real: src.real });
      const after = read(RIGHT_FIN, { forced: false, old: false, real: src.real });
      expect(before.iou!).toBeLessThan(0.15);
      expect(before.centroidShiftPx!).toBeGreaterThan(200);
      // a plain dissolve shows the lesser painting at up to a half: its double image is that times the share that does not overlap (the 36 severe swaps of round 25)
      expect(before.ghostSeverity).toBeGreaterThanOrEqual(CFG.motion.ghostSeverityFail);
      // not the 0.77 of the canvases laid on each other: the engine still plants each painting's lowest opaque row on the ground (an old rule, the approved look)
      expect(after.iou!).toBeGreaterThan(src.real ? 0.3 : 0.6);
      expect(after.centroidShiftPx!).toBeLessThan(before.centroidShiftPx! / 2); // 89 px against 263 on the paintings' alpha: the planting of the lowest opaque row is what is left
      expect(after.ghostSeverity).toBeLessThan(CFG.motion.ghostSeverityFail);
      // and the tracked figure: the old slide made the blend cross its middle at 56 px a frame (a CHK-027 jerk), today it never reaches the check's 40
      expect(before.centroidStep).toBeGreaterThanOrEqual(CFG.motion.jerkFailPx);
      expect(after.centroidStep).toBeLessThan(CFG.motion.jerkFailPx);
      if (process.env['PYREFLY_PRINT']) console.log(`${src.name} | Right Fin blended | before ${JSON.stringify(before)} | after ${JSON.stringify(after)}`);
    });
  });
}

describe('the registration table no longer slides a fin (tools/posescale/overrides.json)', () => {
  for (const art of ['sin-right-fin', 'sin-left-fin']) {
    it(`${art}: every NEAR painting stands at one x, so a pose change moves no plane`, () => {
      const rows = POSE_REGISTRATION[art]!;
      const xs = ['idle', 'idle-near', 'attack', 'charge-near'].map((pose) => rows[pose]?.stanceX);
      expect(xs.every((x) => x !== undefined && x === xs[0])).toBe(true);
    });
  }

  it("through the real actor, the Right Fin's idle, attack and charge planes sit at one x (the old stances put the attack 2.8 world units from the idle)", () => {
    const slide = (old: boolean): number[] => {
      const p = paintings(RIGHT_FIN, old);
      const a = boss(RIGHT_FIN, p);
      const out: number[] = [];
      const planeX = (): number => (slots(a).find((x) => x.fade > 0.5)!.mesh as unknown as { position: { x: number } }).position.x;
      for (const pose of ['idle', 'attack'] as const) {
        a.setPose(pose, { immediate: true, force: true });
        out.push(planeX());
      }
      a.adoptPoses({ idle: p.charged, attack: p.attack, cast: p.attack, hurt: p.hurt }, 'idle');
      out.push(planeX());
      return out;
    };
    const spread = (v: number[]): number => Math.max(...v) - Math.min(...v);
    expect(spread(slide(false))).toBeLessThan(1e-9);
    expect(spread(slide(true))).toBeGreaterThan(2.5);
  });
});

describe('PoseSwapOptions.blend on the real actor: what changes under a figure and what does not', () => {
  const setup = (): { a: Actor; p: ReturnType<typeof paintings>; step: (n?: number) => void } => {
    const p = paintings(RIGHT_FIN, false);
    const a = boss(RIGHT_FIN, p);
    const cam = cameraAt(2, 18);
    const step = (n = 1): void => {
      for (let i = 0; i < n; i++) {
        a.update(FRAME / 1000, FRAME / 1000);
        a.holdHead(viewOf(cam));
        a.updateMatrixWorld(true);
      }
    };
    return { a, p, step };
  };
  const fades = (a: Actor): number[] => slots(a).map((s) => s.fade);
  const painted = (a: Actor): Array<string | undefined> => slots(a).map((s) => (s as unknown as { painted?: Tex }).painted?.url);

  it('the swap itself moves no fade and no painting that stays: the planes that show an unchanged painting are left exactly as they are', () => {
    const { a, p, step } = setup();
    a.setPose('cast');
    step(14);
    const castSlot = slots(a).findIndex((s) => s.pose === 'cast');
    const before = { fades: fades(a), cast: (slots(a)[castSlot] as unknown as { painted: Tex }).painted };
    a.adoptPoses({ idle: p.charged, attack: p.attack, cast: p.attack, hurt: p.hurt }, 'idle', { blend: true });
    expect(a.blending).toBe(true); // the idle comes up through the actor's own blend
    const after = (slots(a)[castSlot] as unknown as { painted: Tex }).painted;
    expect(after).toBe(before.cast); // the plane showing cast keeps its very texture
    expect(slots(a)[castSlot]!.fade).toBe(before.fades[castSlot]); // and its fade: the frame of the swap changes nothing on screen
    expect(a.pose).toBe('idle'); // the actor counts the new pose as the one on its way in
  });

  it('a figure that rests on idle takes the new painting in place (one name, nothing to blend between), and the default is still the forced cut', () => {
    const { a, p, step } = setup();
    step(10);
    a.adoptPoses({ idle: p.charged, attack: p.attack, cast: p.attack, hurt: p.hurt }, 'idle', { blend: true });
    expect(a.blending).toBe(false);
    expect(painted(a).filter((u) => u?.endsWith('/charge-near.png'))).toHaveLength(1);

    const b = setup();
    b.a.setPose('cast');
    b.step(14);
    b.a.adoptPoses({ idle: b.p.charged, attack: b.p.attack, cast: b.p.attack, hurt: b.p.hurt }, 'idle'); // the old call
    expect(b.a.blending).toBe(false);
    expect(b.a.pose).toBe('idle');
    expect(fades(b.a).sort()).toEqual([0, 1]); // one frame: whole new painting, nothing of the old
  });

  it('a swap in the middle of a blend leaves no plane on a replaced painting: the reversal that names idle shows the NEW idle, never the old one', () => {
    const { a, p, step } = setup();
    a.setPose('cast'); // idle goes out, cast comes in
    step(3); // mid-blend: the old idle plane is still showing
    a.adoptPoses({ idle: p.charged, attack: p.attack, cast: p.attack, hurt: p.hurt }, 'idle', { blend: true });
    step(20);
    expect(a.blending).toBe(false);
    const shown = slots(a).filter((s) => s.fade > 0.5);
    expect(shown).toHaveLength(1);
    expect((shown[0] as unknown as { painted: Tex }).painted).toBe(p.charged);
    expect(a.pose).toBe('idle');
  });

  it('only what changed is replaced: a set with nothing new is nothing at all (no pose change, no blend)', () => {
    const { a, p, step } = setup();
    a.setPose('cast');
    step(14);
    a.adoptPoses({ idle: p.idle, attack: p.attack, cast: p.attack, hurt: p.hurt }, 'idle', { blend: true });
    expect(a.blending).toBe(false);
    expect(a.pose).toBe('cast');
  });
});
