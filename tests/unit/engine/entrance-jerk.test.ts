/**
 * The three entrances round 25 named, read the way the continuity harness reads a figure (round 25's PR-0380; decision 61e; E-PYRE).
 *
 * The REAL `PaintedActor` (the head-lock fixture's), the REAL `StageEntrances`, and the harness's own `figureTrack` and `detectJerks` with the policy's thresholds (the r40 and r43 motion lanes' way,
 * `boss-charge-blend.test.ts`), stepped at 60 fps through a camera that fits the placed figure (the strips' camera is not on record, so the pixel counts are this camera's; the round's own readings
 * were 967.7 px for Anima, 341.8 px for Overdrive Sin and 355.4 px for Paragon). The masks are the paintings' own alpha when `public/art` is there (the harness's `decodeMask`), a solid block otherwise.
 *
 * What each boss does today, in the order the game does it: the stage builds it small at its scene's slot, then something puts it where it will stand in ONE frame, while it is on the canvas:
 *
 * - Overdrive Sin (FFX, Chapter XVIII): `BattleScreenSinPoses` loads the head's painting and places it at its range's framing (scale 3.471, 14.23 units high at depth -30);
 * - Paragon (FFX-2, Chapter XIII): CHAPTER FRAMING's giant plan lands its size (scale 3.047) some 1.4 s after the figure is built (the probe of the running game);
 * - Anima (FFX-2, Chapter XI, link 3): the same plan lands her size (9.6 / 3.4 = 2.8235, `docs/handoff/r41-aeonjump.md`) 0.6 s after the Save Sphere's swap.
 *
 * "Before" is that. "After" is the stage holding the figure through the same step (alpha under 0.02, which the probe does not record: no frame) and the opening letting it in 2.5 s later, which is E-PYRE.
 * Two readings of "after", because the harness reads planes and not pixels: the PLANE track (what the probe records: the painting's centroid through the plane's four corners, weighted by the plane's fade;
 * a figure that does not move on its plane does not step) and the EYE track (the centroid of what the sweep has revealed so far, which does move, from the head down: the painting's alpha weighted by the
 * dissolve's own rule, `noise * 0.56 + height * 0.44` against the level, with the noise taken as uniform). No "staged arrival" flag is added to the harness: the definition of a jerk is Bailey's, so the
 * numbers are reported both ways. Set PYREFLY_PRINT=1 to print them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PerspectiveCamera, Texture, Vector3 } from 'three';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PaintedActor, reset, type Actor } from './head-lock-fixture.ts';
import { CFG, FRAME, anchors, record } from './ko-fall-fixture.ts';
import { applyH, detectJerks, figureTrack, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { decodeMask, estimateCentroid } from '../../../critic/runner/lib/continuity-silhouette.mjs';
import type { PaintedTexture } from '../../../src/engine/PaintedArt.ts';
import { StageEntrances, type EntranceHost } from '../../../src/engine/entrance/StageEntrances.ts';
import { GATHER_MS } from '../../../src/engine/entrance/entranceLook.ts';
import { OVERDRIVE_SIN_PLACEMENT } from '../../../src/app/screens/BattleScreenSinPoses.ts';
import { EVRAE_WORLD_HEIGHT, RANGE_STAGING } from '../../../src/scenes/evrae-airship-range.ts';

afterEach(reset);

const ART = resolve(__dirname, '..', '..', '..', 'public', 'art', 'characters');

interface Boss {
  who: string;
  game: 'FFX' | 'FFX-2';
  id: string;
  art: string;
  pose: string;
  /** The stage's drawn height, and where it builds the figure (the scene's slot). */
  worldHeight: number;
  spot: [number, number, number];
  /** What puts the figure where it will stand, in one frame: its scale and place afterwards. */
  scale: number;
  spot2: [number, number, number];
  /** The painting's record (the sidecar's). */
  meta: { width: number; height: number; baselineY: number; scale?: number };
  /** The round's own reading, px at 1600 wide. */
  round25: number;
  /** The scene's own camera, where the head's framing was cast from one (Sin's: the Fahrenheit deck's FAR `idle` rig, `RANGE_STAGING`); else the fitted one. */
  rig?: { position: [number, number, number]; lookAt: [number, number, number]; fov: number };
}
const sin = OVERDRIVE_SIN_PLACEMENT.far;
const BOSSES: Boss[] = [
  { who: 'Overdrive Sin', game: 'FFX', id: 'overdrive-sin', art: 'overdrive-sin', pose: 'stage-0', worldHeight: EVRAE_WORLD_HEIGHT, spot: [2.3, -0.9, -4.7], scale: sin.height / EVRAE_WORLD_HEIGHT, spot2: [...sin.spot], meta: { width: 1410, height: 745, baselineY: 678 }, round25: 341.8, rig: RANGE_STAGING.far.rigs.idle },
  { who: 'Paragon', game: 'FFX-2', id: 'paragon', art: 'paragon', pose: 'idle', worldHeight: 3.4, spot: [1.05, 0, -5.8], scale: 3.047, spot2: [1.05, 0, -5.8], meta: { width: 1150, height: 815, baselineY: 798 }, round25: 355.4 },
  { who: 'Anima', game: 'FFX-2', id: 'x2-anima', art: 'x2-anima', pose: 'idle', worldHeight: 3.4, spot: [1.12, 0, -5], scale: 9.6 / 3.4, spot2: [1.12, 0, -5], meta: { width: 873, height: 1343, baselineY: 1256, scale: 1.059 }, round25: 967.7 },
];

type Mask = Awaited<ReturnType<typeof decodeMask>>;
const masks = new Map<string, Mask>();
const solid = (): Mask => ({ w: 16, h: 16, bits: new Uint8Array(256).fill(1), srcW: 16, srcH: 16 });
const HAVE_ART = BOSSES.every((b) => existsSync(resolve(ART, b.art, `${b.pose}.png`)));
beforeAll(async () => {
  for (const b of BOSSES) masks.set(b.id, HAVE_ART ? await decodeMask(readFileSync(resolve(ART, b.art, `${b.pose}.png`))) : solid());
});

function figure(b: Boss): Actor {
  const a = new PaintedActor({ name: b.id, worldHeight: b.worldHeight, side: 'enemy', breathe: false, sway: false, shadow: false });
  const tex: PaintedTexture = { texture: new Texture(), meta: { ...b.meta }, placeholder: false, url: `/art/characters/${b.art}/${b.pose}.png` };
  a.adoptPoses({ idle: tex }, 'idle');
  a.position.set(...b.spot);
  a.updateMatrixWorld(true);
  return a;
}

/** A camera that holds the figure as it will stand (its painted quad) in the 1600 by 900 frame: 80 percent of the height, or of the width, whichever is the tighter. */
function cameraFor(b: Boss): PerspectiveCamera {
  if (b.rig) {
    const cam = new PerspectiveCamera(b.rig.fov, 16 / 9, 0.1, 400);
    cam.position.set(...b.rig.position);
    cam.lookAt(...b.rig.lookAt);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    return cam;
  }
  const a = figure(b);
  a.scale.setScalar(b.scale);
  a.position.set(...b.spot2);
  a.updateMatrixWorld(true);
  const q = a.contentQuad();
  const lo = new Vector3(Math.min(...q.map((v) => v.x)), Math.min(...q.map((v) => v.y)), 0);
  const hi = new Vector3(Math.max(...q.map((v) => v.x)), Math.max(...q.map((v) => v.y)), 0);
  const c = lo.clone().add(hi).multiplyScalar(0.5);
  const fov = 28;
  const tall = (hi.y - lo.y) / 0.8 / (2 * Math.tan((fov / 2) * (Math.PI / 180)));
  const wide = (hi.x - lo.x) / 0.8 / (2 * Math.tan((fov / 2) * (Math.PI / 180)) * (16 / 9));
  const cam = new PerspectiveCamera(fov, 16 / 9, 0.1, 400);
  cam.position.set(c.x, c.y, q[0].z + Math.max(tall, wide));
  cam.lookAt(c.x, c.y, q[0].z);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
}

const host: EntranceHost = {
  spawn: () => true,
  hush: () => undefined,
  tracked: () => true,
  comfort: () => ({ reduceMotion: false, lowEffects: false }),
  reduceFlashes: () => false,
  cameraAt: () => ({ x: 0, y: 3, z: 14 }),
  tier: () => 'full',
};

type Fig = ReturnType<typeof record>;
interface Reading {
  /** Biggest single-frame step of each track, px at 1600 wide, and the jerks (40 px or more, the policy's line) the harness finds in it. */
  planeStep: number;
  planeJerks: number;
  eyeStep: number;
  eyeJerks: number;
  /** The frame of the entrance (counted from the first frame the figure is on the canvas) that the eye's biggest step falls in. */
  eyeStepAt: number;
  /** Frames the figure was on the canvas (alpha over 0.02, the probe's rule), and the frame count of the entrance. */
  shown: number;
  gatherFrames: number;
}

/** The expected visibility of a pixel `t` down a painting at dissolve level `d`: the shader keeps it when `noise * 0.56 + height * 0.44 >= d`; with the noise uniform that is this share. */
const share = (t: number, d: number): number => Math.min(1, Math.max(0, (0.56 - d + 0.44 * (1 - t)) / 0.56));

function read(b: Boss, mode: 'before' | 'after'): Reading {
  const a = figure(b);
  const cam = cameraFor(b);
  const mask = masks.get(b.id)!;
  const ent = new StageEntrances(host);
  if (mode === 'after') ent.hold(a, b.id);
  const plane: Array<{ n: number; t: number; feet: null; head: null; centroid: [number, number] | null; cam: [number, number] }> = [];
  const eye: typeof plane = [];
  const rowSum = new Float64Array(mask.h);
  const rowU = new Float64Array(mask.h);
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.bits[y * mask.w + x]) { rowSum[y]! += 1; rowU[y]! += (x + 0.5) / mask.w; }
  const total = rowSum.reduce((x, y) => x + y, 0);
  const step = (): void => {
    a.update(FRAME / 1000, FRAME / 1000);
    ent.update(FRAME / 1000);
    a.updateMatrixWorld(true);
  };
  let n = 0;
  let shown = 0;
  let gatherFrames = 0;
  const sample = (): void => {
    const fig: Fig = record({ a, cam } as never);
    n++;
    if (!(a.alpha > 0.02)) return; // the probe records a figure only while it is showing: no frame, no sample, and a gap resets the track
    shown++;
    const an = anchors(a).map((x) => ({ ...x, mask, centroid: estimateCentroid(mask) }));
    const c = figureTrack(fig, an as never, true)?.centroid ?? null;
    plane.push({ n, t: n * FRAME, feet: null, head: null, centroid: c, cam: [0, 0] });
    // the eye: the centroid of what the sweep has revealed, through the plane that shows
    const k = fig.s.findIndex((s) => s[1]! > 0.5);
    if (k >= 0) {
      const d = a.dissolveLevel;
      let w = 0;
      let su = 0;
      let st = 0;
      for (let y = 0; y < mask.h; y++) {
        if (!rowSum[y]) continue;
        const wt = share((y + 0.5) / mask.h, d);
        w += rowSum[y]! * wt;
        su += rowU[y]! * wt;
        st += rowSum[y]! * wt * ((y + 0.5) / mask.h);
      }
      // a centroid is read once there is a shape to take it of: under 2 percent of the painting revealed is a few horn tips, not a figure (the harness reads no such thing either)
      const p = w >= 0.02 * total ? applyH(unitSquareToQuad(fig.s[k]!.slice(3, 11)), su / w, st / w) : null;
      eye.push({ n, t: n * FRAME, feet: null, head: null, centroid: p ? [p[0], p[1]] : null, cam: [0, 0] });
    }
  };
  for (let i = 0; i < 8; i++) {
    step();
    sample();
  }
  // the step: the scene puts the figure where it will stand, in one frame
  a.scale.setScalar(b.scale);
  a.position.set(...b.spot2);
  if (mode === 'before') {
    for (let i = 0; i < 40; i++) {
      step();
      sample();
    }
  } else {
    for (let i = 0; i < 150; i++) {
      step();
      sample(); // held: nothing is recorded
    }
    void ent.enter(false);
    for (let i = 0; i < Math.round(GATHER_MS / FRAME) + 12; i++) {
      step();
      if (ent.busy) gatherFrames++;
      sample();
    }
  }
  let at = 0;
  const worst = (track: typeof plane): number => {
    let m = 0;
    for (let i = 1; i < track.length; i++) {
      const p = track[i - 1]!.centroid;
      const q = track[i]!.centroid;
      if (p && q && track[i]!.n === track[i - 1]!.n + 1) {
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d > m) {
          m = d;
          at = i;
        }
      }
    }
    return Math.round(m * 10) / 10;
  };
  // the probe's coordinates are the canvas's (1600 wide): the quad's corners projected onto it (`corners` in the fixture), which `record` already does
  const planeStep = worst(plane);
  const eyeStep = worst(eye);
  return {
    planeStep,
    planeJerks: detectJerks(plane as never, 1, CFG).length,
    eyeStep,
    eyeStepAt: mode === 'before' ? 0 : at,
    eyeJerks: detectJerks(eye as never, 1, CFG).length,
    shown,
    gatherFrames,
  };
}

describe('the three entrances of round 25, as the continuity harness reads a figure', () => {
  for (const b of BOSSES) {
    it(`${b.who} (${b.game}): today one frame puts it where it stands (a jerk over the 40 px line, the round read ${b.round25} px); held through it and let in by the gather, its plane never steps and the sweep never does either`, () => {
      const before = read(b, 'before');
      const after = read(b, 'after');
      if (process.env['PYREFLY_PRINT']) console.log(`${b.who} (${b.game}) | before ${JSON.stringify(before)} | after ${JSON.stringify(after)} | the round: ${b.round25} px`);
      // BEFORE: the pop, one frame, over the policy's line, found as a jerk
      expect(before.planeStep, 'before: the plane steps').toBeGreaterThan(CFG.motion.jerkFailPx);
      expect(before.planeJerks, 'before: the harness finds the jerk').toBeGreaterThanOrEqual(1);
      // AFTER: the figure was held through the step (no sample), came in on the stage's clock, and played the page's 54 frames
      expect(after.gatherFrames).toBeGreaterThanOrEqual(Math.round(GATHER_MS / FRAME) - 1);
      expect(after.gatherFrames).toBeLessThanOrEqual(Math.round(GATHER_MS / FRAME) + 1);
      expect(after.shown, 'after: the figure is on the canvas only from the gather').toBeLessThanOrEqual(Math.round(GATHER_MS / FRAME) + 14);
      // the plane never steps: the harness reads no jerk at the entrance
      expect(after.planeStep, 'after: the plane').toBeLessThan(2);
      expect(after.planeJerks).toBe(0);
      expect(after.planeStep).toBeLessThan(before.planeStep);
      // the eye: the sweep's own reading, the same definition of a jerk applied to what is revealed
      expect(after.eyeJerks, 'after: the revealed silhouette crosses the 40 px line').toBe(0);
      expect(after.eyeStep, 'after: the revealed silhouette').toBeLessThan(CFG.motion.jerkFailPx);
    });
  }
});
