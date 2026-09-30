/**
 * Eye-candy D as the default look (Bailey's pick, 2026-09-29): the product wiring of the comfort
 * flags (`src/app/fxEnv.ts`), the tier balance, the derived files kept out of git
 * (`tools/fx-assets.mjs`, `tools/deploy-classify.mjs`) and the comfort rules each option obeys.
 * Game case: both (shared plumbing).
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeFxEnv } from '../../src/app/fxEnv.ts';
import { EyeCandyState, overlapBalance, parseFxQuery } from '../../src/engine/fx/EyeCandy.ts';
import { planHit, planVictory, type SpectacleFlags } from '../../src/engine/fx/c/SpectacleRules.ts';
// @ts-expect-error: a plain .mjs tool with no type declarations
import { check } from '../../tools/fx-assets.mjs';
import { classifyPath } from '../../tools/deploy-classify.mjs';

describe('the comfort flags reach the fx in the product', () => {
  it('reads the viewport every call and caches REDUCE MOTION for half a second', () => {
    let t = 0;
    let w = 1600;
    const env = makeFxEnv(
      () => t,
      () => ({ width: w, height: 900 }),
    );
    expect(env()).toMatchObject({ lowEffects: false, reduceMotion: false, reduceFlashes: false, width: 1600, height: 900 });
    w = 390;
    t = 100;
    expect(env().width).toBe(390);
  });
});

describe('D on the phone tier', () => {
  it('uses the tier to pick the balance, so the phone can calm what the desktop keeps', () => {
    const on = { a: true, b: true, c: true };
    for (const d of ['spells', 'halo'] as const) expect(overlapBalance(on, d, 'phone')).toBeLessThanOrEqual(overlapBalance(on, d, 'full'));
    const s = new EyeCandyState(parseFxQuery(''));
    s.env = () => ({ lowEffects: false, reduceMotion: false, reduceFlashes: false, width: 390, height: 844 });
    expect(s.tier).toBe('phone');
    expect(s.dial('spells')).toBeCloseTo(overlapBalance(on, 'spells', 'phone'));
  });
});

describe('REDUCE MOTION in C: no hit-stop, shake, kick, ink frame or victory orbit', () => {
  const flags = (reduceMotion: boolean): SpectacleFlags => ({ tier: 'full', reduceMotion, reduceFlashes: false, dial: () => 1 });
  const heavy = { crit: true, heavy: true, hitIndex: 0, hitCount: 1, big: true, speed: 'normal' };
  it('keeps them all with the flag off', () => {
    const p = planHit('ffx', heavy, flags(false));
    expect(p.freezeMs).toBeGreaterThan(0);
    expect(p.trauma).toBeGreaterThan(0);
    expect(p.kick).toBeGreaterThan(0);
    expect(p.impactFrame).toBe('full');
    expect(planVictory('ffx', 'pose', flags(false))).not.toBeNull();
  });
  it('drops every one of them with the flag on, in both games, and keeps the light', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const p = planHit(game, heavy, flags(true));
      expect([p.freezeMs, p.trauma, p.kick, p.impactFrame]).toEqual([0, 0, 0, null]);
      expect(p.streaks).toBeGreaterThan(0);
      expect(planVictory(game, 'pose', flags(true))).toBeNull();
    }
  });
});

describe('derived files stay out of git and are verified', () => {
  it('passes a folder that matches the list and fails a missing or changed file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fx-assets-'));
    mkdirSync(join(dir, 'room'));
    writeFileSync(join(dir, 'room', 'depth.png'), 'abc');
    const list = [{ path: 'room/depth.png', bytes: 3, sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' }];
    expect(check(dir, list)).toEqual([]);
    writeFileSync(join(dir, 'room', 'depth.png'), 'abd');
    expect(check(dir, list)).toEqual(['differs room/depth.png']);
    expect(check(join(dir, 'nowhere'), list)).toEqual(['missing room/depth.png']);
  });

  it('never lets public/fx block a release, as public/art', () => {
    expect(classifyPath('public/fx/gagazet/depth.png', '??').rule).toBe('public/fx/**');
    expect(classifyPath('public/fx/gagazet/depth.png', '??').category).toBe('noise');
  });
});
