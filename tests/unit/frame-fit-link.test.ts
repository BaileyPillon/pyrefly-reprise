/**
 * r3942-stage wave 2 repair, **FFX-2 only in effect** (the independent check of 2026-10-08; AGENTS.md rule 14): a giant's slice fit on the upright phone is its link's own.
 *
 * The finding: Chapter XIII's second link (Trema) on a 390x844 phone stood the girls 35 percent smaller than live, because the camera Paragon's fit had stood back (the whole figure, 0.7 of
 * his real height, under the boss gauge: 18.17 against the girls' 12.45) was where Trema's fit started. Mechanism: `fitRigToSlice` only stands back, from the rig it is given, and it
 * remembers the authored rig per rig object (`bases`); CHAPTER FRAMING re-registers the resting rig as a copy after every fit (`fx/mix/rigWatch.ts`), so the memory is lost and the next
 * link starts from wherever the last fit left the camera. `FrameFit.LinkFits` (held by `BattleCamera`) keeps a fit that holds a giant (a subject marked `giant`) to its own link: it puts the rig back
 * to the pose it had just before that fit when the next fit comes, and every fit with no giant in the chain is untouched (the carry-over every other chapter has is not this repair's to change).
 *
 * `BattleCamera` is the real class (no DOM); the figures are painted quads as in `frame-fit.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { LinkFits, fitRigToSlice, type FitSubject } from '../../src/engine/FrameFit.ts';

type Quad = [Vector3, Vector3, Vector3, Vector3];

/** A painted quad standing on the ground from x0 to x1, y0 to y1, at depth z. */
function box(x0: number, x1: number, y1: number, z = 0, y0 = 0): FitSubject['actor'] {
  return {
    contentQuad(out?: Quad) {
      const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
      q[0].set(x0, y0, z);
      q[1].set(x1, y0, z);
      q[2].set(x1, y1, z);
      q[3].set(x0, y1, z);
      return q;
    },
  };
}

const SLICE = 0.42;
const live = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
/** Three girls across 7 world units: wider than the slice at the authored distance, so the fit stands back for them. */
const girls = [box(-3.5, -2.5, 2), box(-0.5, 0.5, 2), box(2.5, 3.5, 2)];
/** A narrower link (the girls and one fiend close by): fits nearer than the girls' link. */
const trio = [box(-1.5, -0.5, 2), box(-0.5, 0.5, 2), box(0.5, 1.5, 2)];
/** The giant: 9 wide, behind the party, taller than the frame holds at the girls' distance. */
const giant = box(-4.5, 4.5, 8, -2);

const party = (list: FitSubject['actor'][]): FitSubject[] => list.map((actor) => ({ actor, min: 1 }));
const wholeGiant = (): FitSubject => ({ actor: giant, min: 1, giant: true });

function fresh(): BattleCamera {
  return new BattleCamera(live, { rigs: { idle: { position: [0, 1, 10], lookAt: [0, 1, 0] } }, initial: 'idle' });
}
const zOf = (bc: BattleCamera): number => (bc.getRig('idle')!.position as Vector3).z;
/** CHAPTER FRAMING's `RigWatch.install`: the resting rig re-registered as a copy at the pose it already has. */
function reRegister(bc: BattleCamera): void {
  const r = bc.getRig('idle')!;
  bc.addRig('idle', { position: (r.position as Vector3).clone(), lookAt: (r.lookAt as Vector3).clone(), ...(r.fov !== undefined ? { fov: r.fov } : {}) });
}

describe('a giant\'s phone fit is its link\'s own (FFX-2 only in effect)', () => {
  it('the mechanism: a fit from a re-registered copy starts where the last fit left the camera, so the next link inherits the giant\'s stand-back', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    const zGirls = zOf(bc);
    expect(zGirls).toBeGreaterThan(10);
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()]);
    const zGiant = zOf(bc);
    expect(zGiant).toBeGreaterThan(zGirls + 1);
    // What the independent check saw, without the repair: the plain fit on the copy.
    const r = bc.getRig('idle')!;
    const copy = { position: (r.position as Vector3).clone(), lookAt: (r.lookAt as Vector3).clone() };
    fitRigToSlice(live, copy, SLICE, party(trio));
    expect(copy.position.z).toBeCloseTo(zGiant, 6);
  });

  it('the next link after a giant starts from the rig as it stood before the giant\'s fit, through CHAPTER FRAMING\'s copy', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls)); // what every link had before the giants
    const zGirls = zOf(bc);
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19); // the giant's own
    const zGiant = zOf(bc);
    expect(zGiant).toBeGreaterThan(zGirls + 1);
    reRegister(bc);
    expect(zOf(bc)).toBeCloseTo(zGiant, 6);
    // Trema's link: the girls and the fiend, no giant
    bc.fitSlice('idle', SLICE, party(trio));
    expect(zOf(bc)).toBeLessThan(zGiant - 1);
    expect(zOf(bc)).toBeCloseTo(zGirls, 6); // the chain the girls' fit made, as it was before the giants
  });

  it('and the rig is put back whole: the position, the aim and the field of view', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    const was = bc.getRig('idle')!;
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19);
    const high = bc.getRig('idle')!;
    expect((high.lookAt as Vector3).y).toBeGreaterThan((was.lookAt as Vector3).y); // the reserve under the strip lifts the aim as well
    reRegister(bc);
    bc.fitSlice('idle', SLICE, party(girls));
    const back = bc.getRig('idle')!;
    expect((back.position as Vector3).distanceTo(was.position as Vector3)).toBeLessThan(1e-6);
    expect((back.lookAt as Vector3).distanceTo(was.lookAt as Vector3)).toBeLessThan(1e-6);
  });

  it('with no giant in the chain the carry-over is exactly as it was: no memory, no restore (every other chapter\'s camera)', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    const zGirls = zOf(bc);
    reRegister(bc);
    bc.fitSlice('idle', SLICE, party(trio)); // a narrower link inherits the wider one's distance, as live does
    expect(zOf(bc)).toBeCloseTo(zGirls, 6);
  });

  it('the same without the repair\'s memory for a plain chain: LinkFits on its own rig object equals fitRigToSlice', () => {
    const a = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    const b = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    const links = new LinkFits();
    const moved = links.fit(live, a, 'idle', SLICE, party(girls));
    expect(moved).toBe(fitRigToSlice(live, b, SLICE, party(girls)));
    expect(a.position.distanceTo(b.position)).toBeLessThan(1e-9);
  });

  it('a retry of the giant\'s fight fits the same: the girls\' fit, then the giant\'s, every time', () => {
    const bc = fresh();
    const seen: number[] = [];
    for (let i = 0; i < 3; i++) {
      bc.fitSlice('idle', SLICE, party(girls));
      seen.push(zOf(bc));
      bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19);
      seen.push(zOf(bc));
      if (i % 2 === 0) reRegister(bc); // once as a copy, once the same object
    }
    expect(seen[0]).toBeCloseTo(seen[2]!, 6);
    expect(seen[0]).toBeCloseTo(seen[4]!, 6);
    // the giant's own fit searches its stand-back by bisection from whichever base it was handed (the authored rig, or the girls' fit): the same to a thousandth, never a drift
    expect(seen[1]).toBeCloseTo(seen[3]!, 3);
    expect(seen[1]).toBeCloseTo(seen[5]!, 3);
    expect(seen[1]).toBeGreaterThan(seen[0]! + 1);
  });

  it('a rig some other hand moved after the giant\'s fit is not put back (the scene\'s own idle for a link, the Road\'s per-link camera)', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19);
    bc.addRig('idle', { position: [0.5, 1, 11], lookAt: [0, 1, 0] }); // the scene's own rig for the next link
    bc.fitSlice('idle', SLICE, party(trio));
    expect(zOf(bc)).toBeCloseTo(11, 6); // fits from the scene's rig (the trio already fits there), not from the pose before the giant's
  });

  it('a rig that was never fitted, or has no such name, is left alone', () => {
    const bc = fresh();
    expect(bc.fitSlice('nope', SLICE, party(girls))).toBe(false);
    expect(zOf(bc)).toBe(10);
  });
});
