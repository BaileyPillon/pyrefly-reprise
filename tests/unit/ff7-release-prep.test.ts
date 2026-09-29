/**
 * **FF7 release prep (the phase-3 judge's item 2 and the P3 check's P3C-2)**: the boss stays opaque through every
 * hit, and every Film key stands where it was registered.
 *
 * 1. The see-through boss. The planes were opaque (alpha 1 at every pixel, measured against white and black
 *    backgrounds), but the target's cast light (0.75 for 680 ms after the white hit flash) lifted every dark texel
 *    by the shader's flash floor, so the shaded belly and legs went a flat pale that matched the dark grating behind
 *    them: the lower body read as see-through for about half a second after every hit. The cast now carries no floor
 *    (light on what the painting shows), and B1's white pop keeps half of it.
 * 2. Barret's aim (1302x1130, wider than 1.15:1) was taken for a KO body: the house rest placement rolled it 0.30 rad
 *    and ProneLay slid it along the floor, about 90 px left of his idle. Cloud's strike and the boss's idle and
 *    recoil were rolled too. The FF7 scene now sets `restPoses: false`.
 *
 * **Game case: FF7 only** [AGENTS.md rule 14]; the shared hooks are optional and unset for FFX and FFX-2 (pinned).
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FF7_CAST, FF7_HIT_FLOOR_CUT, Ff7FxDirector } from '../../src/app/screens/battleFf7Fx.ts';
import { computePoseScale } from '../../src/engine/PaintedScale.ts';
import { poseScalingOf } from '../../src/engine/StageFacing.ts';
import { paintedFragmentShader } from '../../src/engine/shaders/PaintedShader.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import { SECTOR1_SLOTS } from '../../src/scenes/sector1-reactor.ts';
import { SECTOR1_DESK, SECTOR1_PHONE, sector1Staging } from '../../src/scenes/sector1-reactor-staging.ts';
import { CAVERN_STOLEN_FAYTH_SLOTS } from '../../src/scenes/cavern-stolen-fayth.ts';
import { FakeStage } from './helpers/FakeStage.ts';

const ART = 'public/art/characters';
const FILM_POSES: Record<string, string[]> = {
  'ff7-film-cloud': ['idle', 'windup', 'attack', 'follow', 'victory', 'spin', 'back', 'hurt'],
  'ff7-film-barret': ['idle', 'aim', 'attack', 'victory', 'punch', 'hurt'],
  'ff7-film-guard-scorpion': ['idle', 'hurt'],
  'ff7-film-guard-scorpion-tail-up': ['idle', 'hurt'],
};
const haveArt = existsSync(`${ART}/ff7-film-barret/aim.json`);

describe('item 2: the boss stays opaque through every hit (the cast light is light, not a veil)', () => {
  function rig() {
    const stage = new FakeStage(['cloud', 'barret'], ['guard-scorpion']);
    const flashes: Array<{ id: string; peak: number; floorCut: number; ms: number }> = [];
    for (const id of ['cloud', 'barret', 'guard-scorpion']) {
      const a = stage.actor(id)!;
      a.flash = (_c?: number | string, ms = 0, peak = 1, floorCut = 0): void => void flashes.push({ id, peak, floorCut, ms });
    }
    const timers: Array<() => void> = [];
    const d = new Ff7FxDirector(() => stage, () => 1, () => null, () => false, (fn) => void timers.push(fn));
    return { d, flashes, run: () => timers.splice(0).forEach((f) => f()) };
  }

  it('every cast (the target after the white pop, and each fighter nearby) drops the whole flash floor', () => {
    for (const fx of ['ff7-shot', 'ff7-slash', 'ff7-bolt', 'ff7-ice', 'ff7-braver', 'ff7-bigshot', 'ff7-rifle'] as const) {
      const { d, flashes, run } = rig();
      d.onLand(fx, 'guard-scorpion', 0, { action: 1 });
      run(); // the hit
      run(); // the cast on the target, FF7_CAST.afterWhiteMs later
      const white = flashes[0]!;
      expect(white, fx).toMatchObject({ id: 'guard-scorpion', floorCut: FF7_HIT_FLOOR_CUT });
      expect(white.ms, fx).toBeLessThanOrEqual(150); // B1's pop stays short
      const casts = flashes.slice(1);
      expect(casts.some((c) => c.id === 'guard-scorpion' && c.ms === FF7_CAST.ms), fx).toBe(true);
      for (const c of casts) expect(c.floorCut, `${fx} ${c.id}`).toBe(1);
    }
    expect(FF7_HIT_FLOOR_CUT).toBeGreaterThan(0);
  });

  it('the shader drops the floor by the uniform, and an unset uniform (every FFX and FFX-2 flash) keeps it whole', () => {
    expect(paintedFragmentShader).toContain('uniform float flashFloorCut;');
    expect(paintedFragmentShader).toMatch(/FLASH_FLOOR = 0\.34 \* \(1\.0 - clamp\(flashFloorCut, 0\.0, 1\.0\)\)/);
  });

  it('the lift a dark texel gets at the cast peak: a veil with the house floor, next to nothing without it', () => {
    // CPU mirror of the shader's flash (PaintedShader.ts): reflectance = mix(floor, c, 1 - floor), lift = amount * 0.85 * reflectance.
    const lift = (c: number, amount: number, cut: number): number => {
      const floor = 0.34 * (1 - cut);
      return amount * 0.85 * (floor + (1 - floor) * c);
    };
    const belly = 0.05; // the shaded belly and legs, linear
    expect(lift(belly, FF7_CAST.target, 0)).toBeGreaterThan(0.2); // the old cast: a flat pale veil
    expect(lift(belly, FF7_CAST.target, 1)).toBeLessThan(0.04); // now: the darks stay dark
    expect(lift(0.5, FF7_CAST.target, 1)).toBeGreaterThan(0.3); // and a lit plate still catches the light
  });
});

describe('P3C-2: every FF7 Film key stands where it was registered (none laid to rest by its aspect)', () => {
  it('the FF7 staging (desk and phone) sets restPoses: false, and the stage turns it into an infinite prone aspect', () => {
    for (const layout of [SECTOR1_DESK, SECTOR1_PHONE]) expect(sector1Staging(layout).restPoses, layout.name).toBe(false);
    expect(SECTOR1_SLOTS.restPoses).toBe(false);
    expect(stagingOf({ restPoses: false }).restPoses).toBe(false);
    expect(poseScalingOf(SECTOR1_SLOTS)).toEqual({ poseScaling: { maxExtent: 3.2, proneAspect: Number.POSITIVE_INFINITY } });
  });

  it('FFX and FFX-2 scenes keep the house rest placement (no switch, no option)', () => {
    expect(CAVERN_STOLEN_FAYTH_SLOTS.restPoses).toBeUndefined();
    expect(poseScalingOf(CAVERN_STOLEN_FAYTH_SLOTS)).toEqual({});
    expect(stagingOf({}).restPoses).toBeUndefined();
  });

  it.skipIf(!haveArt)('with the switch no Film pose is prone; without it Barret\'s aim was (the root cause)', () => {
    for (const [art, poses] of Object.entries(FILM_POSES)) {
      const idle = JSON.parse(readFileSync(`${ART}/${art}/idle.json`, 'utf8')) as { width: number; height: number; baselineY: number };
      for (const pose of poses) {
        const meta = JSON.parse(readFileSync(`${ART}/${art}/${pose}.json`, 'utf8')) as { width: number; height: number; baselineY: number };
        const ff7 = computePoseScale(meta, { worldHeight: 1.8, reference: idle, maxExtent: 3.2, proneAspect: Number.POSITIVE_INFINITY });
        expect(ff7.prone, `${art} ${pose}`).toBe(false);
      }
    }
    const aim = JSON.parse(readFileSync(`${ART}/ff7-film-barret/aim.json`, 'utf8')) as { width: number; height: number; baselineY: number };
    expect(computePoseScale(aim, { worldHeight: 1.8 }).prone).toBe(true);
  });
});
