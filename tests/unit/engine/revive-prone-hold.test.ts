/**
 * **A revived figure does not jump sideways in its first frame** (release 68, the pop the motion lane measured in live release 67; BOTH games: `ProneLay` and the actor layer are shared by the FFX
 * chapters and the FFX-2 ones).
 *
 * `ProneLay.layProneFigures` slides a lying body along the floor off a standing neighbour (once, when it goes down) and cleared that slide on the frame `isProne` turned false. `isProne` reads the ACTIVE
 * plane, and a revive (`setPose('idle')`) makes the standing plane active at once, while the KO painting is still on screen fading out (83 percent opaque after the first frame): the slide went from
 * 0.74 units to 0 in one frame, so the lying body jumped 80 to 108 px (168 to 177 px at 2560 wide) under the one getting up. The slide is now held until the lying plane has faded out.
 *
 * These tests use the REAL `PaintedActor` (Yuna's real pose records, her KO laid by a synthetic underside), the real `layProneFigures` the stage calls every frame, and the real revive call
 * (`setPose('idle')` with its crossfade, the life layer's rise on).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { layProneFigures } from '../../../src/engine/ProneLay.ts';
import { cameraAt, frame, reset, slotOf, yuna, type Actor } from './head-lock-fixture.ts';

afterEach(reset);

/** Yuna down beside a standing second figure, laid by the stage's own pass: the KO plane is slid off her neighbour (a non-zero slide, asserted by the callers). */
function fallen(): { lying: Actor; others: Actor[]; cam: ReturnType<typeof cameraAt> } {
  const cam = cameraAt(1.4);
  const lying = yuna();
  const neighbour = yuna();
  neighbour.position.set(-2 + 0.6, 0, 0);
  const others = [lying, neighbour];
  lying.setPose('ko', { immediate: true, force: true });
  frame(lying, cam);
  frame(neighbour, cam);
  layProneFigures(others, cam);
  return { lying, others, cam };
}

const koX = (a: Actor): number => slotOf(a, 'ko').mesh.matrix.elements[12]!;
const slideOf = (a: Actor): number => (a as unknown as { proneShift: number }).proneShift;

describe('the revive of a figure lying beside a neighbour (the stage calls layProneFigures every frame)', () => {
  it('the premise: the stage slid the lying body off her neighbour, so the KO plane is not at its own centre', () => {
    const { lying } = fallen();
    expect(Math.abs(slideOf(lying))).toBeGreaterThan(0.1);
  });

  it('the KO painting stays where it lay on the first revive frame and on every frame it is still showing', () => {
    const { lying, others, cam } = fallen();
    const lay = slideOf(lying);
    const x0 = koX(lying);
    lying.setPose('idle');
    const ko = slotOf(lying, 'ko');
    let shown = 0;
    for (let i = 0; i < 90; i++) {
      frame(lying, cam);
      layProneFigures(others, cam);
      if (ko.fade > 0.001) {
        shown++;
        lying.updateMatrixWorld(true);
        expect(slideOf(lying), `frame ${i}: the slide while the lying plane is still at ${ko.fade.toFixed(2)}`).toBe(lay);
        expect(Math.abs(koX(lying) - x0), `frame ${i}: the lying plane's x`).toBeLessThan(1e-6);
      }
    }
    expect(shown, 'the crossfade really ran, with the KO plane showing for several frames').toBeGreaterThan(3);
  });

  it('lets the slide go once the lying plane has faded out, so the next fall is laid afresh', () => {
    const { lying, others, cam } = fallen();
    lying.setPose('idle');
    for (let i = 0; i < 120; i++) {
      frame(lying, cam);
      layProneFigures(others, cam);
    }
    expect(slotOf(lying, 'ko').fade).toBeLessThan(0.001);
    expect(slideOf(lying)).toBe(0);
    // down again: the stage lays it once more (a non-zero slide off the same neighbour)
    lying.setPose('ko', { immediate: true, force: true });
    frame(lying, cam);
    layProneFigures(others, cam);
    expect(Math.abs(slideOf(lying))).toBeGreaterThan(0.1);
  });

  it('a figure knocked down again while the old slide is still held is laid afresh, not carried over', () => {
    const { lying, others, cam } = fallen();
    lying.setPose('idle');
    for (let i = 0; i < 3; i++) {
      frame(lying, cam);
      layProneFigures(others, cam);
    }
    expect(slotOf(lying, 'ko').fade).toBeGreaterThan(0.001); // mid-revive
    lying.setPose('ko', { immediate: true, force: true });
    frame(lying, cam);
    layProneFigures(others, cam);
    expect(Math.abs(slideOf(lying))).toBeGreaterThan(0.1);
    // and standing up from this second fall holds ITS slide the same way
    const lay = slideOf(lying);
    lying.setPose('idle');
    frame(lying, cam);
    layProneFigures(others, cam);
    expect(slideOf(lying)).toBe(lay);
  });

  it('a hard cut to the standing pose (no crossfade, the lying plane gone at once) clears the slide on the spot', () => {
    const { lying, others, cam } = fallen();
    lying.setPose('idle', { immediate: true, force: true });
    frame(lying, cam);
    layProneFigures(others, cam);
    expect(slideOf(lying)).toBe(0);
  });

  it('a figure that never lay down is never held (a standing figure is not touched)', () => {
    const cam = cameraAt(1.4);
    const a = yuna();
    frame(a, cam);
    layProneFigures([a], cam);
    expect(slideOf(a)).toBe(0);
    a.setPose('hurt');
    for (let i = 0; i < 20; i++) {
      frame(a, cam);
      layProneFigures([a], cam);
    }
    expect(slideOf(a)).toBe(0);
  });
});
