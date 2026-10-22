/**
 * Release 62, decision 173b (Bailey, 2026-10-22 ~00:00 EDT; **FFX-2 only**: Chapter IV's Bahamut): Mega Flare lands harder. The beam's light floods the room, also lights the girls (the relight point lights), the camera
 * shakes harder and longer, and the frame whites out for a beat, then the room fades back; REDUCE FLASHES takes the white-out away and caps the flood.
 *
 *  1. the envelopes (`look/flare/FlareConfig.ts`): a flood that rises, holds and lets go slowly; a white-out that is short; the reduced forms;
 *  2. the listener (`look/flare/LookFlare.ts`): only a `megaflare` tap from FFX-2's layer starts a flare; the group's taps are one blast; the uniforms go to zero when it is over and when the look is off;
 *  3. the girls' light (`relight/RelightConfig.ts`): the beam's cold white-blue, stronger and wider than Fire's orange it was; FFX's and the other effects' kinds untouched;
 *  4. the shake (`MegaFlareImpact.ts`, the presenter's landing beat): FFX-2's Mega Flare shakes the camera once per blow, harder than a form change, and no FFX fight and no other ability does.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FLARE, FLARE_REDUCED, FLOOD_FAR, flareLength, flareSpec, floodAt, floodFall, whiteAt } from '../../src/engine/look/flare/FlareConfig.ts';
import { LookFlare, type FlareUniforms } from '../../src/engine/look/flare/LookFlare.ts';
import { landListeners, notifyLand, type SpellLandTap } from '../../src/engine/fx/spellTaps.ts';
import { POINT_KINDS, kindFor } from '../../src/engine/look/relight/RelightConfig.ts';
import { MEGA_FLARE_SHAKE, megaFlareBlow } from '../../src/engine/MegaFlareImpact.ts';
import { FLASH_PEAK_CAP } from '../../src/engine/flashRules.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

describe('1. the envelopes', () => {
  it('the flood rises smoothly to its peak, holds, then lets go slowly: the room fades back', () => {
    const f = FLARE.flood;
    expect(floodAt(-1, f)).toBe(0);
    expect(floodAt(0, f)).toBe(0);
    expect(floodAt(f.rise / 2, f)).toBeGreaterThan(0);
    expect(floodAt(f.rise / 2, f)).toBeLessThan(f.peak);
    expect(floodAt(f.rise, f)).toBeCloseTo(f.peak, 6);
    expect(floodAt(f.rise + f.hold / 2, f)).toBeCloseTo(f.peak, 6);
    const mid = floodAt(f.rise + f.hold + f.decay / 2, f);
    expect(mid).toBeGreaterThan(0.3 * f.peak);
    expect(mid).toBeLessThan(0.7 * f.peak);
    expect(floodAt(f.rise + f.hold + f.decay, f)).toBe(0);
    expect(f.decay).toBeGreaterThanOrEqual(1.5); // a long fall: it is the room coming back
    // monotone down after the hold
    let last = Infinity;
    for (let t = f.rise + f.hold; t <= f.rise + f.hold + f.decay; t += 0.05) {
      const v = floodAt(t, f);
      expect(v).toBeLessThanOrEqual(last + 1e-9);
      last = v;
    }
  });

  it('the white-out is short: near-instant rise, gone within about half a second', () => {
    const w = FLARE.white;
    expect(whiteAt(0, w)).toBe(0);
    expect(whiteAt(w.rise, w)).toBeCloseTo(w.peak, 6);
    expect(w.peak).toBeGreaterThanOrEqual(0.7);
    expect(w.peak).toBeLessThan(0.9); // the drawn effect's own wash is under it
    expect(w.rise + w.decay).toBeLessThan(0.5);
    expect(whiteAt(w.rise + w.decay, w)).toBe(0);
    expect(whiteAt(0.7, w)).toBe(0);
  });

  it('REDUCE FLASHES: no white-out at all, the flood capped at 35 percent and a ramp of most of a second', () => {
    const r = flareSpec(true);
    expect(r).toBe(FLARE_REDUCED);
    expect(flareSpec(false)).toBe(FLARE);
    for (let t = 0; t < 4; t += 0.01) expect(whiteAt(t, r.white)).toBe(0);
    expect(r.flood.peak).toBeLessThanOrEqual(FLASH_PEAK_CAP + 1e-9);
    expect(r.flood.rise).toBeGreaterThanOrEqual(0.5); // a slow ramp is not a flash
    let peak = 0;
    for (let t = 0; t < 5; t += 0.01) peak = Math.max(peak, floodAt(t, r.flood));
    expect(peak).toBeLessThanOrEqual(FLASH_PEAK_CAP + 1e-9);
  });

  it('the flood covers the whole room: 60 percent of it far from the blast, all of it at the blast', () => {
    expect(floodFall(0)).toBeCloseTo(1, 6);
    expect(floodFall(100)).toBeCloseTo(FLOOD_FAR, 6);
    expect(FLOOD_FAR).toBeGreaterThanOrEqual(0.6 - 1e-9);
    expect(floodFall(1)).toBeLessThan(1);
    expect(floodFall(1)).toBeGreaterThan(FLOOD_FAR);
  });

  it('a flare is kept until both envelopes are over, and no longer', () => {
    expect(flareLength(FLARE)).toBeGreaterThan(FLARE.flood.rise + FLARE.flood.hold + FLARE.flood.decay);
    expect(flareLength(FLARE)).toBeLessThan(FLARE.flood.rise + FLARE.flood.hold + FLARE.flood.decay + 0.1);
  });
});

// ------------------------------------------------------------------ the listener

interface Spy {
  u: FlareUniforms;
  flood: number[];
  white: () => number;
  col: number[];
}
function spy(): Spy {
  const flood: number[] = [0, 0, 0, 0];
  const col: number[] = [0, 0, 0];
  const u = {
    uFlood: { value: { set: (x: number, y: number, z: number, w: number) => void flood.splice(0, 4, x, y, z, w) } },
    uFloodCol: { value: { set: (x: number, y: number, z: number) => void col.splice(0, 3, x, y, z) } },
    uWhite: { value: 0 },
  } as FlareUniforms;
  return { u, flood, col, white: () => u.uWhite.value };
}
const tap = (over: Partial<SpellLandTap> = {}): SpellLandTap => ({ fx: 'megaflare', game: 'ffx2', abilityId: 'x2-bahamut-mega-flare', ms: 1400, rect: { x: 300, y: 500, w: 100, h: 200 }, view: { w: 1600, h: 900 }, ...over });

describe('2. the listener', () => {
  it('installs and removes itself on the spell layer\'s listener set (so the look being off leaves nothing behind)', () => {
    const n = landListeners.size;
    const f = new LookFlare();
    f.install();
    f.install();
    expect(landListeners.size).toBe(n + 1);
    f.remove();
    expect(landListeners.size).toBe(n);
  });

  it('a megaflare tap from FFX-2 lands a flare: nothing before the landing, the white-out at it, the flood after it, all gone at the end', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(10, false, s.u);
    notifyLand(tap({ ms: 1400 })); // lands at 11.4
    f.update(10.5, false, s.u);
    expect(s.flood[2]).toBe(0);
    expect(s.white()).toBe(0);
    f.update(11.4 + FLARE.white.rise, false, s.u);
    expect(s.white()).toBeCloseTo(FLARE.white.peak, 3);
    f.update(11.4 + FLARE.flood.rise + 0.1, false, s.u);
    expect(s.flood[2]).toBeCloseTo(FLARE.flood.peak, 3);
    expect(s.white()).toBeGreaterThan(0); // still falling away at 0.19 s
    f.update(11.4 + 0.6, false, s.u);
    expect(s.white()).toBe(0);
    expect(s.flood[2]).toBeGreaterThan(0.9 * FLARE.flood.peak); // the room is still lit: the flood outlasts the white-out
    expect(s.col).toEqual([...FLARE.flood.color]);
    // where it lands: the target's rectangle (u across, v up from the bottom: the centre of 300..400 and 0.45 down 500..700)
    expect(s.flood[0]).toBeCloseTo(350 / 1600, 6);
    expect(s.flood[1]).toBeCloseTo(1 - (500 + 90) / 900, 6);
    expect(s.flood[3]).toBe(FLARE.flood.reach);
    f.update(11.4 + flareLength(FLARE) + 0.1, false, s.u);
    expect(s.flood[2]).toBe(0);
    expect(s.white()).toBe(0);
    expect(f.stats.flares).toBe(0);
    f.remove();
  });

  it('the group effect taps once per girl a moment apart: one blast, centred on the party', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(20, false, s.u);
    notifyLand(tap({ ms: 1400, rect: { x: 100, y: 500, w: 100, h: 200 } }));
    notifyLand(tap({ ms: 1450, rect: { x: 300, y: 500, w: 100, h: 200 } }));
    notifyLand(tap({ ms: 1500, rect: { x: 500, y: 500, w: 100, h: 200 } }));
    f.update(21.4 + FLARE.flood.rise + 0.1, false, s.u);
    expect(f.stats.flares).toBe(1);
    expect(s.flood[0]).toBeCloseTo(350 / 1600, 6); // the mean of the three centres (150, 350, 550)
    f.remove();
  });

  it('the girls\' blows land up to a second or so apart (the first take of this had three white-outs half a second apart, a strobe): taps up to 1.6 s apart are still one blast, one white-out', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(25, false, s.u);
    notifyLand(tap({ ms: 1400, rect: { x: 100, y: 500, w: 100, h: 200 } }));
    notifyLand(tap({ ms: 2100, rect: { x: 300, y: 500, w: 100, h: 200 } }));
    notifyLand(tap({ ms: 2900, rect: { x: 500, y: 500, w: 100, h: 200 } }));
    f.update(25.01, false, s.u);
    expect(f.stats.flares).toBe(1);
    // the white-out comes once, at the first landing, and is over by the second girl's blow
    let peaks = 0;
    let was = 0;
    for (let t = 25; t < 30; t += 1 / 60) {
      f.update(t, false, s.u);
      if (s.white() > 0.5 && was <= 0.5) peaks++;
      was = s.white();
    }
    expect(peaks).toBe(1);
    f.remove();
  });

  it('a Mega Flare ten seconds later is another blast', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(40, false, s.u);
    notifyLand(tap({ ms: 1400 }));
    f.update(41, false, s.u);
    f.update(50, false, s.u);
    expect(f.stats.flares).toBe(0); // the first is long over
    notifyLand(tap({ ms: 1400 }));
    f.update(50.1, false, s.u);
    expect(f.stats.flares).toBe(1);
    f.remove();
  });

  it('only FFX-2\'s Mega Flare: another effect, or the same id from another game\'s layer, starts nothing', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(30, false, s.u);
    notifyLand(tap({ fx: 'fire' }));
    notifyLand(tap({ fx: 'spiral' }));
    notifyLand(tap({ game: 'ffx' }));
    notifyLand(tap({ game: 'ff7' }));
    notifyLand(tap({ rect: null }));
    f.update(32, false, s.u);
    expect(f.stats.flares).toBe(0);
    expect(s.flood[2]).toBe(0);
    f.remove();
  });

  it('REDUCE FLASHES: the white-out is never written, the flood is capped', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(40, true, s.u);
    notifyLand(tap({ ms: 1000 }));
    let maxWhite = 0;
    let maxFlood = 0;
    for (let t = 40; t < 46; t += 1 / 60) {
      f.update(t, true, s.u);
      maxWhite = Math.max(maxWhite, s.white());
      maxFlood = Math.max(maxFlood, s.flood[2]!);
    }
    expect(maxWhite).toBe(0);
    expect(maxFlood).toBeGreaterThan(0.3);
    expect(maxFlood).toBeLessThanOrEqual(FLASH_PEAK_CAP + 1e-9);
    f.remove();
  });

  it('the gain tweak scales both (0 = the old frame: the capture\'s "before"); off() zeroes the uniforms and drops the listener', () => {
    const f = new LookFlare();
    f.install();
    const s = spy();
    f.update(50, false, s.u);
    notifyLand(tap({ ms: 0 }));
    f.update(50 + FLARE.white.rise, false, s.u, 0);
    expect(s.white()).toBe(0);
    expect(s.flood[2]).toBe(0);
    f.update(50 + FLARE.white.rise, false, s.u, 0.5);
    expect(s.white()).toBeCloseTo(FLARE.white.peak * 0.5, 3);
    const n = landListeners.size;
    f.off(s.u);
    expect(landListeners.size).toBe(n - 1);
    expect(s.flood[2]).toBe(0);
    expect(s.white()).toBe(0);
  });

  it('a frame with nothing alive writes zeros (the shader skips its blocks: the frame is what it was)', () => {
    const f = new LookFlare();
    const s = spy();
    f.update(60, false, s.u);
    expect(s.flood[2]).toBe(0);
    expect(s.white()).toBe(0);
  });
});

describe('3. the girls\' light', () => {
  it('Mega Flare\'s point light is the beam\'s cold white-blue, stronger and over twice the reach (it was Fire\'s orange)', () => {
    const m = POINT_KINDS['megaflare']!;
    expect(m.color[2]).toBeGreaterThan(m.color[0]); // blue-white, not orange
    expect(m.peak).toBeGreaterThanOrEqual(2);
    expect(m.reachMul).toBeGreaterThanOrEqual(2);
    expect(m.hold + m.decay).toBeGreaterThan(1.5); // it outlasts the flood's hold and falls back with it
    expect(kindFor('megaflare')).toBe(m);
  });

  it('every other effect\'s light is exactly what it was (no reach multiplier, the same colours)', () => {
    for (const k of ['fire', 'thunder', 'ice', 'water', 'holy', 'cure', 'hit', 'spiral', 'bloom']) expect(POINT_KINDS[k]!.reachMul).toBeUndefined();
    expect(POINT_KINDS['fire']!.color).toEqual([1.0, 0.52, 0.16]);
    expect(POINT_KINDS['spiral']!.color).toEqual([0.8, 0.7, 1.0]);
  });
});

// ------------------------------------------------------------------ the shake

describe('4. the shake', () => {
  it('is Mega Flare in FFX-2 only: both of its ids, and not the same id in FFX (the aeon Bahamut\'s Overdrive), not another ability, not an unknown game', () => {
    expect(megaFlareBlow('mega-flare', 'ffx2')).toBe(true);
    expect(megaFlareBlow('x2-bahamut-mega-flare', 'ffx2')).toBe(true);
    expect(megaFlareBlow('mega-flare', 'ffx')).toBe(false);
    expect(megaFlareBlow('mega-flare', 'ff7')).toBe(false);
    expect(megaFlareBlow('mega-flare', undefined)).toBe(false);
    expect(megaFlareBlow('x2-bahamut-attack', 'ffx2')).toBe(false);
    expect(megaFlareBlow(undefined, 'ffx2')).toBe(false);
  });

  it('is harder and longer than the loudest beat the presenter had (a form change: 0.2 for 520 ms) and than a crit (0.16)', () => {
    expect(MEGA_FLARE_SHAKE.amplitude).toBeGreaterThan(0.2);
    expect(MEGA_FLARE_SHAKE.ms).toBeGreaterThanOrEqual(2 * 520);
  });

  type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
  it('the presenter\'s landing beat shakes the camera for each girl the blast lands on, with Mega Flare\'s own numbers (FFX-2); an ordinary hit does not', async () => {
    const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['bahamut']);
    const shakes: Array<[number | undefined, number | undefined]> = [];
    stage.camera.shake = (amp, ms) => void shakes.push([amp, ms]);
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve(), game: 'ffx2' });
    const abilityId = 'x2-bahamut-mega-flare';
    const targets = ['yuna', 'rikku', 'paine'] as never;
    const ev = (e: Unsequenced<BattleEvent>, i: number): BattleEvent => ({ ...e, seq: i }) as BattleEvent;
    await presenter.play([
      ev({ type: 'action-start', actorId: 'bahamut', command: { kind: 'ability', abilityId, targets } as never, abilityId, abilityName: 'Mega Flare', targets }, 0),
      ev({ type: 'damage', targetId: 'yuna', sourceId: 'bahamut', amount: 1500, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }, 1),
      ev({ type: 'damage', targetId: 'rikku', sourceId: 'bahamut', amount: 1500, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }, 2),
      ev({ type: 'action-end', actorId: 'bahamut' }, 3),
    ]);
    const mega = (): Array<[number | undefined, number | undefined]> => shakes.filter(([a, m]) => a === MEGA_FLARE_SHAKE.amplitude && m === MEGA_FLARE_SHAKE.ms); // an ordinary hit's own shakes are the presenter's, as before
    expect(mega()).toHaveLength(2);
    shakes.length = 0;
    await presenter.play([
      ev({ type: 'action-start', actorId: 'bahamut', command: { kind: 'ability', abilityId: 'x2-bahamut-attack', targets: ['yuna'] } as never, abilityId: 'x2-bahamut-attack', abilityName: 'Attack', targets: ['yuna'] as never }, 0),
      ev({ type: 'damage', targetId: 'yuna', sourceId: 'bahamut', amount: 300, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }, 1),
      ev({ type: 'action-end', actorId: 'bahamut' }, 2),
    ]);
    expect(mega()).toEqual([]);
  });

  it('the same ability id in FFX, and a presenter that was never told its game, do not shake', async () => {
    for (const game of ['ffx', undefined] as const) {
      const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['bahamut']);
      const shakes: unknown[] = [];
      stage.camera.shake = (amp, ms) => void shakes.push([amp, ms]);
      const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve(), ...(game ? { game } : {}) });
      const abilityId = 'mega-flare';
      await presenter.play([
        { type: 'action-start', actorId: 'bahamut', command: { kind: 'ability', abilityId, targets: ['yuna'] } as never, abilityId, abilityName: 'Mega Flare', targets: ['yuna'] as never, seq: 0 } as BattleEvent,
        { type: 'damage', targetId: 'yuna', sourceId: 'bahamut', amount: 1500, element: 'none', crit: false, hitIndex: 0, hitCount: 1, seq: 1 } as BattleEvent,
        { type: 'action-end', actorId: 'bahamut', seq: 2 } as BattleEvent,
      ]);
      expect((shakes as Array<[number, number]>).filter(([a, m]) => a === MEGA_FLARE_SHAKE.amplitude && m === MEGA_FLARE_SHAKE.ms), String(game)).toEqual([]);
    }
  });
});
