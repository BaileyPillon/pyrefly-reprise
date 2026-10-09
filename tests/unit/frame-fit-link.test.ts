/**
 * r3942-stage wave 2 repair, **FFX-2 only in effect** (the independent check of 2026-10-08; AGENTS.md rule 14): a giant's slice fit on the upright phone is its link's own.
 *
 * The finding: Chapter XIII's second link (Trema) on a 390x844 phone stood the girls 35 percent smaller than live, because the camera Paragon's fit had stood back (the whole figure, 0.7 of
 * his real height, under the boss gauge: 18.17 against the girls' 12.45) was where Trema's fit started. Mechanism: `fitRigToSlice` only stands back, from the rig it is given, and it
 * remembers the authored rig per rig object (`bases`); CHAPTER FRAMING re-registers the resting rig as a copy after every fit (`fx/mix/rigWatch.ts`), so the memory is lost and the next
 * link starts from wherever the last fit left the camera. `FrameFit.LinkFits` (held by `BattleCamera`) keeps a fit that holds a giant (a subject marked `giant`) to its own link: the next fit of
 * the rig does not start from where the giant's fit left it (the first version put the rig back to the pose just before that fit; the second repair below changes the target and the rule), and every
 * fit with no giant in the chain is untouched (the carry-over every other chapter has is not this repair's to change).
 *
 * **Second repair (the verifier's, the same day).** The first version put the rig back only while it still stood within a thousandth of where the giant's fit left it, and to the pose
 * between the presenter's two fits. CHAPTER FRAMING moves the rig: a master 0.65 further back on a 360x740 phone, and 1.32 further once the giant has gone and the next link's figures stand,
 * so on every small phone nothing was put back (the girls 57 to 66 percent of live); and the pose between the two fits already holds the giant (at 0.75), which on a 320x568 phone stood the
 * girls at 79 percent of live where live's Trema link starts from the scene's own rig. The memory now belongs to the rig's line by identity: a registration that is the rig going on
 * (`BattleCamera.addRig`'s `continues`, which CHAPTER FRAMING passes) keeps it however far the rig has moved; the scene's own rig for the link it stages (the Road's per-link idle) is what a
 * later link starts from, and ends the memory of the giant's fit. These tests replay CHAPTER FRAMING's plans with the measured drift, several of them in a row, and require the link after a
 * giant to be the fit it would have been on a camera that never saw a giant: the link's own formation, fitted from the scene's own rig.
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
/** A second giant, narrower and taller. */
const giant2 = box(-3, 3, 11, -2);
/** A giant narrower than the slice (2 wide, 8 tall): at 0.75 the presenter's first fit counts it, and its height pulls the camera back and up (Paragon on a 320x568 phone). */
const slim = box(-1, 1, 8, -2);

const party = (list: FitSubject['actor'][]): FitSubject[] => list.map((actor) => ({ actor, min: 1 }));
const wholeGiant = (a: FitSubject['actor'] = giant): FitSubject => ({ actor: a, min: 1, giant: true });

function fresh(): BattleCamera {
  return new BattleCamera(live, { rigs: { idle: { position: [0, 1, 10], lookAt: [0, 1, 0] } }, initial: 'idle' });
}
const zOf = (bc: BattleCamera): number => (bc.getRig('idle')!.position as Vector3).z;
const poseOf = (bc: BattleCamera): number[] => {
  const r = bc.getRig('idle')!;
  return [...(r.position as Vector3).toArray(), ...(r.lookAt as Vector3).toArray()];
};

/**
 * CHAPTER FRAMING's `RigWatch.install` after a fit: the master it planned from the fitted rig, registered as the same rig going on (`continues`), `back` further along the view axis and a little
 * higher (the clearance fit's measured drift on a 360x740 phone: 0.65 back and 0.09 up per plan, 1.32 when the giant has gone and the next link's figures stand). `back` 0 is the copy at the same pose.
 */
function plan(bc: BattleCamera, back = 0): void {
  const r = bc.getRig('idle')!;
  const p = r.position as Vector3;
  const l = r.lookAt as Vector3;
  const axis = new Vector3().subVectors(p, l).normalize();
  bc.addRig('idle', { position: p.clone().addScaledVector(axis, back).setY(p.y + back * 0.14), lookAt: l.clone(), ...(r.fov !== undefined ? { fov: r.fov } : {}) }, true);
}
/** Link 1 holds a giant: the girls' fit every link had, then the giant's own (the presenter's two calls). */
function giantLink(bc: BattleCamera, big: FitSubject['actor'] = giant): void {
  bc.fitSlice('idle', SLICE, party(girls));
  bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant(big)], 0.19);
}
/** The control: the link after a giant, on a camera that never saw one: its own formation, fitted from the scene's own rig. Returns the pose that link ends on. */
function trioFromOwn(): number[] {
  const bc = fresh();
  bc.fitSlice('idle', SLICE, party(trio));
  return poseOf(bc);
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

  it('the next link after a giant starts from the scene\'s own rig, through CHAPTER FRAMING\'s copy', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls)); // what every link had before the giants
    const zGirls = zOf(bc);
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19); // the giant's own
    const zGiant = zOf(bc);
    expect(zGiant).toBeGreaterThan(zGirls + 1);
    plan(bc);
    expect(zOf(bc)).toBeCloseTo(zGiant, 6);
    // Trema's link: the girls and the fiend, no giant: it fits where it fits from the authored rig (z 10 here), not from the giant's stand-back
    bc.fitSlice('idle', SLICE, party(trio));
    expect(zOf(bc)).toBeLessThan(zGiant - 1);
    expect(zOf(bc)).toBeCloseTo(10, 6);
  });

  it('a link that needs the girls\' own stand-back after a giant gets exactly that, fitted from the scene\'s rig', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    const zGirls = zOf(bc);
    const bg = fresh();
    giantLink(bg);
    plan(bg, 0.65);
    plan(bg, 1.32);
    bg.fitSlice('idle', SLICE, party(girls));
    expect(zOf(bg)).toBeCloseTo(zGirls, 6);
  });

  it('with the drift CHAPTER FRAMING really adds (0.65 a plan, 1.32 at the link seam), the next link is still the fit it would have been on a camera that never saw a giant', () => {
    const control = trioFromOwn();
    const bc = fresh();
    giantLink(bc);
    plan(bc, 0.65); // the master planned from the giant's fit
    plan(bc, 0.65); // and the live check re-plans it
    plan(bc, 1.32); // the giant has gone, the next link's figures stand: planned again from the fitted rig, 1.32 off
    const off = zOf(bc);
    bc.fitSlice('idle', SLICE, party(trio));
    expect(off).toBeGreaterThan(control[2]! + 5);
    expect(poseOf(bc).every((n, i) => Math.abs(n - control[i]!) < 1e-6)).toBe(true);
  });

  it('whatever the drift: from a hair to a long way, in one plan or many, the link after a giant starts from the same pose', () => {
    const control = trioFromOwn();
    for (const steps of [[0.001], [0.65], [1.32], [0.65, 1.32], [0.65, 0.65, 0.65, 0.65, 0.65], [4], [0.65, 0.65, 1.32, 0.65, 0.2, 7]]) {
      const bc = fresh();
      giantLink(bc);
      for (const back of steps) plan(bc, back);
      bc.fitSlice('idle', SLICE, party(trio));
      const got = poseOf(bc);
      expect(got.every((n, i) => Math.abs(n - control[i]!) < 1e-6), `drift ${steps.join(',')}: ${got.map((n) => n.toFixed(3))} against ${control.map((n) => n.toFixed(3))}`).toBe(true);
    }
  });

  it('and the rig is put back whole: the position, the aim and the field of view', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    const was = bc.getRig('idle')!;
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19);
    const high = bc.getRig('idle')!;
    expect((high.lookAt as Vector3).y).toBeGreaterThan((was.lookAt as Vector3).y); // the reserve under the strip lifts the aim as well
    plan(bc, 0.65);
    plan(bc, 1.32);
    bc.fitSlice('idle', SLICE, party(girls));
    const back = bc.getRig('idle')!;
    expect((back.position as Vector3).distanceTo(was.position as Vector3)).toBeLessThan(1e-6);
    expect((back.lookAt as Vector3).distanceTo(was.lookAt as Vector3)).toBeLessThan(1e-6);
  });

  it('the fit reports that it moved the rig when it put it back', () => {
    const bc = fresh();
    giantLink(bc);
    plan(bc, 1.32);
    expect(bc.fitSlice('idle', SLICE, party(girls))).toBe(true);
    // and a second fit of a rig that already stands there has nothing to move
    expect(bc.fitSlice('idle', SLICE, party(girls))).toBe(false);
  });

  it('with no giant in the chain the carry-over is exactly as it was: no memory, no restore, the drift stays (every other chapter\'s camera)', () => {
    const bc = fresh();
    bc.fitSlice('idle', SLICE, party(girls));
    const zGirls = zOf(bc);
    plan(bc);
    bc.fitSlice('idle', SLICE, party(trio)); // a narrower link inherits the wider one's distance, as live does
    expect(zOf(bc)).toBeCloseTo(zGirls, 6);
    plan(bc, 0.65);
    plan(bc, 0.65);
    bc.fitSlice('idle', SLICE, party(trio)); // and the drift of CHAPTER FRAMING's plans stays, as it does on live
    expect(zOf(bc)).toBeGreaterThan(zGirls + 1.2);
  });

  it('the same without the repair\'s memory for a plain chain: LinkFits on its own rig object equals fitRigToSlice', () => {
    const a = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    const b = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    const links = new LinkFits();
    const moved = links.fit(live, a, 'idle', SLICE, party(girls));
    expect(moved).toBe(fitRigToSlice(live, b, SLICE, party(girls)));
    expect(a.position.distanceTo(b.position)).toBeLessThan(1e-9);
  });

  it('a retry of the giant\'s fight fits the same: the girls\' fit, then the giant\'s, every time, however far CHAPTER FRAMING has drifted the rig', () => {
    const bc = fresh();
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      bc.fitSlice('idle', SLICE, party(girls));
      seen.push(zOf(bc));
      bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19);
      seen.push(zOf(bc));
      plan(bc, 0.65); // the master planned from the giant's fit, a defeat and a retry later it is the rig the girls' fit starts from
      plan(bc, 0.65);
    }
    for (const k of [2, 4, 6]) expect(seen[0]).toBeCloseTo(seen[k]!, 6); // the girls' fit: never a drift
    // the giant's own fit searches its stand-back by bisection from whichever base it was handed: the same to a thousandth, never a drift
    for (const k of [3, 5, 7]) expect(seen[1]).toBeCloseTo(seen[k]!, 3);
    expect(seen[1]).toBeGreaterThan(seen[0]! + 1);
  });

  it('one link after another: the giant, then two links with none; only the first starts from the scene\'s rig, the third carries on from the second as every chain does', () => {
    const control = fresh();
    control.fitSlice('idle', SLICE, party(trio));
    plan(control);
    plan(control, 0.65);
    control.fitSlice('idle', SLICE, party(girls));
    const bc = fresh();
    giantLink(bc);
    plan(bc, 0.65);
    plan(bc, 1.32);
    bc.fitSlice('idle', SLICE, party(trio)); // from the scene's rig, then fitted
    plan(bc);
    plan(bc, 0.65);
    bc.fitSlice('idle', SLICE, party(girls)); // the carry-over, with its drift
    expect(zOf(bc)).toBeCloseTo(zOf(control), 6);
  });

  it('the pose between the presenter\'s two fits already holds the giant, so the next link does not start from it: it starts from the scene\'s rig (320x568: the girls 79 percent of live)', () => {
    const control = trioFromOwn();
    const bc = fresh();
    bc.fitSlice('idle', SLICE, [...party(girls), { actor: slim, min: 0.75 }]); // the presenter's first fit: the giant at 0.75, counted because it is narrower than the slice
    const between = zOf(bc);
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant(slim)], 0.19); // the giant's own
    expect(between).toBeGreaterThan(control[2]! + 1.5); // the pose between the fits stands further back than the scene's rig needs for the next link
    plan(bc, 0.65);
    plan(bc, 1.32);
    bc.fitSlice('idle', SLICE, party(trio));
    expect(poseOf(bc).every((n, i) => Math.abs(n - control[i]!) < 1e-6)).toBe(true);
  });

  it('two giants in a row: the second is fitted from the scene\'s rig, not from the first\'s stand-back, and the link after it starts from the scene\'s rig again', () => {
    const control = fresh();
    giantLink(control, giant2);
    const z2 = zOf(control);
    const bc = fresh();
    giantLink(bc, giant);
    plan(bc, 0.65);
    plan(bc, 1.32);
    giantLink(bc, giant2);
    expect(zOf(bc)).toBeCloseTo(z2, 2); // a giant's own link, drift or no drift before it (to the bisection's step: 12 halvings of the stand-back, about 3 thousandths of a unit here)
    plan(bc, 0.65);
    bc.fitSlice('idle', SLICE, party(trio));
    expect(poseOf(bc).every((n, i) => Math.abs(n - trioFromOwn()[i]!) < 1e-6)).toBe(true);
  });

  it('the scene\'s own rig is the one registered last: a link after a giant starts from the rig the scene made for the link it staged (the Road), not from the first one', () => {
    const bc = fresh();
    giantLink(bc);
    plan(bc, 0.65);
    bc.addRig('idle', { position: [0, 1, 12], lookAt: [0, 1, 0] }); // the Road's idle for the next link (a registration of its own: the giant's memory ends)
    giantLink(bc); // a later giant link on that rig, fitted again and remembered again
    plan(bc, 0.65);
    plan(bc, 1.32);
    bc.fitSlice('idle', SLICE, party(trio));
    expect(zOf(bc)).toBeCloseTo(12, 6); // the trio fits there already: the scene's rig of that link, not the first one (z 10)
  });

  it('a rig some other hand registered after the giant\'s fit is not put back (the scene\'s own idle for a link, the Road\'s per-link camera), drift or not', () => {
    const bc = fresh();
    giantLink(bc);
    plan(bc, 0.65);
    bc.addRig('idle', { position: [0.5, 1, 11], lookAt: [0, 1, 0] }); // the scene's own rig for the next link: a registration that is not the rig going on
    bc.fitSlice('idle', SLICE, party(trio));
    expect(zOf(bc)).toBeCloseTo(11, 6); // fits from the scene's rig (the trio already fits there), not from the pose before the giant's
  });

  it('and CHAPTER FRAMING planning from the scene\'s rig afterwards does not bring the giant\'s memory back', () => {
    const bc = fresh();
    giantLink(bc);
    bc.addRig('idle', { position: [0.5, 1, 11], lookAt: [0, 1, 0] });
    plan(bc, 0.65);
    plan(bc, 1.32);
    const z = zOf(bc);
    bc.fitSlice('idle', SLICE, party(trio));
    expect(zOf(bc)).toBeCloseTo(z, 6); // the trio fits there already: nothing is put back, nothing moves
  });

  it('a scene\'s rig registered before the giant\'s fit, in the giant\'s own link, changes nothing: the fit remembers from there', () => {
    const bc = fresh();
    bc.addRig('idle', { position: [0, 1, 11], lookAt: [0, 1, 0] });
    bc.fitSlice('idle', SLICE, party(girls));
    const before = zOf(bc);
    bc.fitSlice('idle', SLICE, [...party(girls), wholeGiant()], 0.19);
    plan(bc, 1.32);
    bc.fitSlice('idle', SLICE, party(girls));
    expect(zOf(bc)).toBeCloseTo(before, 6);
  });

  it('the memory belongs to the rig called idle: another rig registered by the scene does not end it', () => {
    const bc = fresh();
    giantLink(bc);
    bc.addRig('enemy', { position: [1, 1, 8], lookAt: [0, 1, 0] });
    bc.addRig('idle~calm', { position: [0, 1, 20], lookAt: [0, 1, 0] });
    plan(bc, 1.32);
    bc.fitSlice('idle', SLICE, party(trio));
    expect(poseOf(bc).every((n, i) => Math.abs(n - trioFromOwn()[i]!) < 1e-6)).toBe(true);
  });

  it('used on its own with no scene rig ever registered, the pose before the giant\'s fit is what the next fit starts from', () => {
    const rig = { position: new Vector3(0, 1, 10), lookAt: new Vector3(0, 1, 0) };
    const links = new LinkFits();
    links.fit(live, rig, 'idle', SLICE, [...party(girls), wholeGiant()], 0.19);
    expect(rig.position.z).toBeGreaterThan(14);
    rig.position.z += 3; // drifted by whoever
    links.fit(live, rig, 'idle', SLICE, party(trio));
    expect(rig.position.z).toBeCloseTo(10, 6);
  });

  it('a rig that was never fitted, or has no such name, is left alone', () => {
    const bc = fresh();
    expect(bc.fitSlice('nope', SLICE, party(girls))).toBe(false);
    expect(zOf(bc)).toBe(10);
  });
});
