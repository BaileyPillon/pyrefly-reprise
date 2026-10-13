/**
 * REDUCE FLASHES on the REAL `PaintedActor` (PR-0032): `flash(colour, ms, peak)` runs through `flashRules.softActorFlash` while the
 * stage-set getter `softFlash` answers true. Off (no getter, or it answers false) the flash is exactly what it always was.
 *
 * The actor is built headless the way the head-lock tests build it (`engine/head-lock-fixture.ts`); the flash is read off the shader
 * uniforms the painted planes share (`flashAmount`, `flashColor`), which is what the screen draws.
 *
 * Game case: both (shared plumbing; every flash on a fighter in both games goes through this one method).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PaintedActor, reset } from './engine/head-lock-fixture.ts';
import { FLASH_PEAK_CAP, IVORY_INT } from '../../src/engine/flashRules.ts';

afterEach(reset);

interface Uniforms {
  flashAmount: { value: number };
  flashColor: { value: { getHex(): number } };
}
const uniformsOf = (a: InstanceType<typeof PaintedActor>): Uniforms => (a as unknown as { u: Uniforms }).u;

function actor(): InstanceType<typeof PaintedActor> {
  return new PaintedActor({ name: 'tidus', worldHeight: 2, side: 'party', breathe: false, sway: false, life: false, interimYaw: false });
}

/** The flash as the shader sees it the instant it starts. */
function flashed(a: InstanceType<typeof PaintedActor>, colour: number | string, ms: number, peak: number): { amount: number; colour: number } {
  a.flash(colour, ms, peak);
  const u = uniformsOf(a);
  return { amount: u.flashAmount.value, colour: u.flashColor.value.getHex() };
}

describe('PaintedActor.flash under REDUCE FLASHES', () => {
  it('off (no getter): today\'s flash, to the digit', () => {
    const a = actor();
    expect(flashed(a, 0xffffff, 260, 1)).toEqual({ amount: 1, colour: 0xffffff }); // a crit
    expect(flashed(actor(), 0xffd0c0, 200, 0.8)).toEqual({ amount: 0.8, colour: 0xffd0c0 }); // an ordinary hit
  });

  it('off (the getter answers false): the same', () => {
    const a = actor();
    a.softFlash = () => false;
    expect(flashed(a, 0xffffff, 260, 1)).toEqual({ amount: 1, colour: 0xffffff });
  });

  it('on: a crit\'s white peak 1 becomes ivory at 0.35', () => {
    const a = actor();
    a.softFlash = () => true;
    expect(flashed(a, 0xffffff, 260, 1)).toEqual({ amount: FLASH_PEAK_CAP, colour: IVORY_INT });
  });

  it('on: every flash colour keeps its colour and peaks at 0.35 (hit, heal, revive, petrify, status, cast, the boss warnings)', () => {
    const cases: Array<[number, number]> = [
      [0xffd0c0, 0.8], // an ordinary hit
      [0x9dffc4, 0.6], // a heal
      [0xfff3c0, 0.9], // a revive
      [0xb9b4aa, 0.85], // petrify
      [0xc9a6ff, 0.5], // a status
      [0x9fd8ff, 0.45], // a cast
      [0xff6b5a, 1], // a big attack, imminent
      [0xffc46b, 0.7], // a big attack, charging
    ];
    for (const [colour, peak] of cases) {
      const a = actor();
      a.softFlash = () => true;
      expect(flashed(a, colour, 300, peak), colour.toString(16)).toEqual({ amount: FLASH_PEAK_CAP, colour });
    }
  });

  it('on: the knock-out fall\'s dark flash is not a bright flash, so it is untouched', () => {
    const a = actor();
    a.softFlash = () => true;
    expect(flashed(a, 0x4a5a78, 320, 0.7)).toEqual({ amount: 0.7, colour: 0x4a5a78 });
  });

  it('on: a flash already under the cap stays where it is', () => {
    const a = actor();
    a.softFlash = () => true;
    expect(flashed(a, 0x9fd8ff, 560, 0.2).amount).toBe(0.2);
  });

  it('the getter is read at every flash, so the pause\'s switch applies on resume without rebuilding anything', () => {
    const a = actor();
    let on = false;
    a.softFlash = () => on;
    expect(flashed(a, 0xffffff, 260, 1).amount).toBe(1);
    a.update(1); // the first flash runs out (a new flash starts from whichever is brighter, the live amount or its own peak)
    on = true;
    expect(flashed(a, 0xffffff, 260, 1).amount).toBe(FLASH_PEAK_CAP);
    a.update(1);
    on = false;
    expect(flashed(a, 0xffffff, 260, 1).amount).toBe(1);
  });

  it('on: the duration is never changed (the tween runs the ms it was given)', () => {
    const a = actor();
    a.softFlash = () => true;
    a.flash(0xffffff, 260, 1);
    // 260 ms in: gone, exactly as without the setting
    a.update(0.27);
    expect(uniformsOf(a).flashAmount.value).toBe(0);
  });
});
