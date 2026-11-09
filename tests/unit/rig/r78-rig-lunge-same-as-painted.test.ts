/**
 * **Release 78, R77-5 (FFX-2 only: Rikku's Dark Knight in Chapter IV): the 137 px "worst jerk" of the rig run is the lunge of her attack, the same travel a painted figure makes; it is not a rig fault.**
 *
 * The focused review of release 77 read Chapter IV with the pilot rig on: worst one-frame step 137 px against 32 px on release 76 (painting set), CHK-027 still PASS. The frame (continuity evidence of 6429ff15e: frame
 * 19765 at 333.18 s, Rikku, tracked point the head) is: an `idle > attack` swap, rig, blended over 4 frames (no hard cut), no camera cut in the run (`cameraCuts.count` 0), a normal frame (15.9 ms, not a hitch), the whole
 * figure travelling (`commonMode`; the pose's own share of the step is 28.8 px), `kind: dash`, which the harness reports and does not gate (CHECKS.md CHK-027, "a mid-move dash is reported"). Ten such `idle > attack`
 * swaps read 120 to 137 px head steps on the rig; the painting set's same ten swaps (`idle > attack` hard cuts at the lunge's fastest frame, planned smears) read 76 to 88 px and are counted as excused swap jerks, so
 * the worst-jerk figure compared a smeared cut to a travelling dash. The count and the class moved, the lunge did not:
 *
 *  - **The body's travel is the same code for both.** `RigActor extends PaintedActor` and overrides none of the motion members (`lunge`, `strike`, `recoil`, `hop`, `shake`, `squash`); the rig's parts hang under the plane's
 *    own motion group, so a lunge carries them exactly as it carries a plane. This file runs both and compares the travel frame by frame, with the rig changing key in the same frames the presenter does.
 *  - **The step is the designed fastest frame.** The lunge's step is fastest at 0.19 of its time and that frame is a large share of the whole reach by design (`lunge`, "measured in the real game"); the registered pose
 *    offset (the attack key leans the head forward) adds to the head's reading, which is the 28.8 px `relPx` and why the rig's head reads 40 to 50 px above the feet's 93.
 *
 * Nothing was changed in the rig, the keys or the engine. Game case: FFX-2 only (the Dark Knight dressphere); the lunge and the rig actor are shared plumbing and are unchanged.
 */
import { Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig-fixture.ts';

vi.mock('../../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { PaintedActor } = await import('../../../src/engine/PaintedActor.ts');
const { RigActor } = await import('../../../src/engine/rig/RigActor.ts');
const { carrierOf } = await import('../../../src/engine/rig/RigCarrier.ts');
const { readRig } = await import('../../../src/engine/rig/RigData.ts');
type Painted = import('../../../src/engine/PaintedArt.ts').PaintedTexture;
type Opts = import('../../../src/engine/PaintedActor.ts').PaintedActorOptions;
type ActorT = import('../../../src/engine/PaintedActor.ts').PaintedActor;
type RigActorT = import('../../../src/engine/rig/RigActor.ts').RigActor;

const painting = (pose: string): Painted => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: `/art/characters/testfig/${pose}.png` });
const idlePainting = (): Painted => painting('idle');
const opts = (): Opts => ({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false });

async function rigged(): Promise<RigActorT> {
  const r = readRig(makeRigFile());
  if (!r.ok) throw new Error(r.reason);
  return RigActor.createRigged(opts(), { data: r.data, base: '/art/rigs/testfig', idlePainting: idlePainting(), loadTexture: async () => new Texture() });
}

function painted(): ActorT {
  const a = new PaintedActor(opts());
  a.adoptPoses({ idle: idlePainting(), attack: painting('attack') }, 'idle');
  return a;
}

/** The body's x each 60 Hz frame of a 320 ms lunge, with `onFrame` run before each update (the presenter's key changes land here). */
async function travel(a: ActorT, onFrame: (frame: number) => void = () => undefined): Promise<number[]> {
  const out: number[] = [];
  const done = a.lunge(0.9, 320);
  for (let f = 0; f < 30; f++) {
    onFrame(f);
    a.update(1 / 60);
    out.push(carrierOf(a).inner.position.x);
  }
  await done.catch(() => undefined);
  return out;
}

const steps = (xs: readonly number[]): number[] => xs.map((x, i) => Math.abs(x - (xs[i - 1] ?? 0)));

describe('the rig does not own the body\'s travel (FFX-2: Rikku\'s Dark Knight; shared plumbing, unchanged)', () => {
  it('RigActor overrides none of the motion members: a lunge, a strike, a recoil, a hop, a shake and a squash are PaintedActor\'s', () => {
    for (const member of ['lunge', 'strike', 'recoil', 'hop', 'shake', 'squash']) {
      expect(typeof (PaintedActor.prototype as unknown as Record<string, unknown>)[member], `PaintedActor.${member}`).toBe('function');
      expect(Object.hasOwn(RigActor.prototype, member), `RigActor must not define ${member}`).toBe(false);
    }
  });

  it('a lunge moves the rig\'s body exactly as it moves a painted figure\'s, frame by frame, with the rig folding to the attack key in the same frames', async () => {
    const figure = painted();
    const paintedTravel = await travel(figure, (f) => void (f === 3 && figure.setPose('attack'))); // the same key change in the same frame: the life layer's lean follows the pose for both
    const rig = await rigged();
    rig.update(0);
    const rigTravel = await travel(rig, (f) => {
      if (f === 3) rig.setPose('attack'); // the presenter changes key a few frames into the move
    });
    expect(rigTravel).toHaveLength(paintedTravel.length);
    for (let i = 0; i < paintedTravel.length; i++) expect(rigTravel[i], `frame ${i}`).toBeCloseTo(paintedTravel[i]!, 9);
  });

  it('the fastest frame of that travel is the same step for both and is a large share of the reach (a designed, fast first beat; the harness calls it a dash)', async () => {
    const figure = painted();
    const paintedSteps = steps(await travel(figure, (f) => void (f === 3 && figure.setPose('attack'))));
    const rig = await rigged();
    rig.update(0);
    const rigSteps = steps(await travel(rig, (f) => void (f === 3 && rig.setPose('attack'))));
    expect(Math.max(...rigSteps)).toBeCloseTo(Math.max(...paintedSteps), 9);
    const reach = Math.max(...paintedSteps.reduce<number[]>((acc, s) => [...acc, (acc.at(-1) ?? 0) + s], []));
    expect(Math.max(...paintedSteps) / reach, 'the fastest frame is a tenth of the whole reach or more').toBeGreaterThan(0.1);
  });
});
