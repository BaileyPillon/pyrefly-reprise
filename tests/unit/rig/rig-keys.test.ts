import { describe, expect, it } from 'vitest';
import { compileKey, compileKeys, poseChain, resolveKeyName, RigTransition } from '../../../src/engine/rig/RigKeys.ts';
import { CH, C_OX, C_ROT, C_SX, bindPose } from '../../../src/engine/rig/RigSkeleton.ts';
import { makeRig } from './rig-fixture.ts';

const keys = (...n: string[]): ReadonlySet<string> => new Set(n);

describe('pose names resolve down the game chain to the nearest key', () => {
  it('a key the rig has is used as it is', () => {
    expect(resolveKeyName('attack', keys('idle', 'attack'))).toBe('attack');
  });

  it('attack falls to ready then idle; cast to attack; ko to hurt; follow to attack; defend to guard', () => {
    expect(resolveKeyName('attack', keys('idle', 'ready'))).toBe('ready');
    expect(resolveKeyName('attack', keys('idle'))).toBe('idle');
    expect(resolveKeyName('cast', keys('idle', 'attack'))).toBe('attack');
    expect(resolveKeyName('ko', keys('idle', 'hurt'))).toBe('hurt');
    expect(resolveKeyName('follow', keys('idle', 'attack', 'ready'))).toBe('attack');
    expect(resolveKeyName('follow', keys('idle', 'follow', 'attack'))).toBe('follow');
    expect(resolveKeyName('defend', keys('idle', 'guard'))).toBe('guard');
    expect(resolveKeyName('sleep', keys('idle'))).toBe('idle');
    expect(resolveKeyName('telegraph', keys('idle', 'ready'))).toBe('idle');
  });

  it('FFX-2 dresspheres never borrow another action: cast, item and ko go straight to the idle (D-179); FFX keeps its chain', () => {
    const k = keys('idle', 'attack', 'hurt');
    expect(resolveKeyName('cast', k, true)).toBe('idle');
    expect(resolveKeyName('ko', k, true)).toBe('idle');
    expect(resolveKeyName('item', k, true)).toBe('idle');
    expect(resolveKeyName('attack', k, true)).toBe('attack');
    expect(resolveKeyName('cast', k, false)).toBe('attack');
    expect(resolveKeyName('ko', k, false)).toBe('hurt');
  });

  it('a name the game has no chain for resolves only if the rig has a key of that name; otherwise null (the figure stays as it is)', () => {
    expect(resolveKeyName('od-meteor', keys('idle', 'attack'))).toBeNull();
    expect(resolveKeyName('od-meteor', keys('idle', 'od-meteor'))).toBe('od-meteor');
    expect(poseChain('od-meteor')).toEqual(['od-meteor']);
  });

  it('idle always resolves', () => {
    for (const n of ['idle', 'ready', 'attack', 'cast', 'item', 'hurt', 'ko', 'defend', 'guard', 'victory', 'follow', 'sleep', 'critical', 'telegraph']) {
      expect(resolveKeyName(n, keys('idle')), n).toBe('idle');
    }
  });
});

describe('compileKey', () => {
  it('writes radians, offsets and scales per bone, and the root block on every root bone', () => {
    const d = makeRig();
    const a = compileKey(d, d.keys.get('attack')!);
    const arm = d.boneIndex.get('arm')! * CH;
    expect(a[arm + C_ROT]).toBe(-1.2);
    expect(a[arm + C_SX]).toBe(1);
    const ko = compileKey(d, d.keys.get('ko')!);
    expect(ko[0 * CH + C_ROT]).toBe(1.4);
    expect(ko[0 * CH + 2]).toBe(-20);
    expect(ko[1 * CH + C_ROT]).toBe(0); // only the root bone
  });

  it('idle is the bind pose', () => {
    const d = makeRig();
    expect([...compileKey(d, d.keys.get('idle')!)]).toEqual([...bindPose(d.bones.length)]);
    expect(compileKeys(d).size).toBe(5);
  });
});

describe('RigTransition: the game ease, and a start that keeps the speed the figure had', () => {
  const rest = bindPose(2);
  const away = Float64Array.from(rest);
  away[C_ROT] = 1;
  away[CH + C_OX] = 40;

  it('reaches the target at the end of its time, not before, and holds with dt 0 (a hit-stop)', () => {
    const t = new RigTransition(2 * CH, rest);
    t.retarget(away, 200);
    t.step(0);
    expect(t.current[C_ROT]).toBe(0);
    t.step(0.1);
    expect(t.current[C_ROT]).toBeCloseTo(0.5, 6); // quadInOut at the middle
    expect(t.busy).toBe(true);
    t.step(0.0999);
    expect(t.busy).toBe(true);
    t.step(0.001);
    expect(t.current[C_ROT]).toBe(1);
    expect(t.current[CH + C_OX]).toBe(40);
    expect(t.busy).toBe(false);
    expect([...t.velocity].every((v) => v === 0)).toBe(true);
  });

  it('a move from rest starts at rest and ends at rest (no jerk at either end)', () => {
    const t = new RigTransition(2 * CH, rest);
    t.retarget(away, 200);
    t.step(1 / 600);
    expect(Math.abs(t.velocity[C_ROT]!)).toBeLessThan(0.5); // a 1 rad move in 0.2 s peaks near 10 rad/s; 1.7 ms in it is still crawling
    t.step(0.1);
    const mid = t.velocity[C_ROT]!;
    expect(mid).toBeGreaterThan(4); // 2 per 0.2 s at the middle of quadInOut: 1 rad over 0.2 s peaks at 10 rad/s
    t.step(0.0983);
    expect(Math.abs(t.velocity[C_ROT]!)).toBeLessThan(0.3);
  });

  it('a retarget in mid-move is continuous in value AND velocity: the new move starts at the speed the old one had', () => {
    const t = new RigTransition(2 * CH, rest);
    t.retarget(away, 200);
    for (let i = 0; i < 7; i++) t.step(1 / 60); // 117 ms in
    const value = t.current[C_ROT]!;
    const speed = t.velocity[C_ROT]!;
    expect(speed).toBeGreaterThan(3);
    const back = Float64Array.from(rest);
    t.retarget(back, 160);
    expect(t.current[C_ROT]).toBe(value); // nothing has jumped
    t.step(1e-5); // the first instant of the new move
    expect(t.velocity[C_ROT]!).toBeCloseTo(speed, 2);
    expect(Math.abs(t.current[C_ROT]! - value)).toBeLessThan(Math.abs(speed) * 1e-5 * 1.5);
    // and it still arrives, at rest
    for (let i = 0; i < 20; i++) t.step(1 / 60);
    expect(t.current[C_ROT]).toBe(0);
    expect(t.busy).toBe(false);
  });

  it('frame to frame the value never steps more than the speed allows, through a chain of retargets', () => {
    const t = new RigTransition(2 * CH, rest);
    const targets = [away, rest, away, rest];
    let prev = t.current[C_ROT]!;
    let worst = 0;
    targets.forEach((tg, k) => {
      t.retarget(tg, 120 + k * 20);
      for (let i = 0; i < 4; i++) {
        t.step(1 / 60);
        worst = Math.max(worst, Math.abs(t.current[C_ROT]! - prev));
        prev = t.current[C_ROT]!;
      }
    });
    expect(worst).toBeLessThan(0.3); // a 1 rad swing in 120 ms is at most 0.17 a frame; a retarget adds no jump
  });

  it('ms 0 snaps; snap clears the speed', () => {
    const t = new RigTransition(2 * CH, rest);
    t.retarget(away, 0);
    expect(t.current[C_ROT]).toBe(1);
    expect(t.busy).toBe(false);
    t.retarget(rest, 100);
    t.step(0.05);
    t.snap(away);
    expect(t.velocity[C_ROT]).toBe(0);
    expect(t.current[C_ROT]).toBe(1);
  });
});
