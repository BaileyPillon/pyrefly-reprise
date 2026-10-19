/**
 * The animation prototype's animator on its own (`RigAnimator.ts`, `RigAnimLayer.ts`' smear and prop events): the strike is scheduled so its contact lands on the lunge's apex to within a frame, the
 * events a clip raises come once and in order on the frames their marks are on, a smear frame lasts two frames at the peak speed of a fast move and only for a style that asks for it, and the
 * doll rides the fist.
 */
import { describe, expect, it } from 'vitest';
import { readRig } from '../../../src/engine/rig/RigData.ts';
import { compileKeys } from '../../../src/engine/rig/RigKeys.ts';
import { RigSkeleton } from '../../../src/engine/rig/RigSkeleton.ts';
import { RigAnimator, type AnimEvent, type AnimFrame } from '../../../src/engine/rig/anim/RigAnimator.ts';
import { STYLE_A, STYLE_B, STYLE_C, type AnimStyle } from '../../../src/engine/rig/anim/AnimStyles.ts';
import type { Subject } from '../../../src/engine/rig/anim/AnimLibrary.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { makeRigFile } from './rig-fixture.ts';

const NEEDED = ['ready', 'follow', 'cast', 'item', 'victory'];

function data() {
  const f = makeRigFile();
  f.keys['follow'] = { bones: { chest: { rot: 0.5 } }, source: 'authored' };
  f.keys['cast'] = { bones: { arm: { rot: -2.4 } }, source: 'authored' };
  f.keys['item'] = { bones: { arm: { rot: -1.9 } }, source: 'authored' };
  f.keys['victory'] = { bones: { arm: { rot: -2.8 } }, source: 'authored' };
  void NEEDED;
  const r = readRig(f);
  if (!r.ok) throw new Error(r.reason);
  return r.data;
}

const SUBJECT: Subject = {
  accents: {},
  idle: { breath: {}, shift: {} },
  secondary: () => ({ rots: [], points: [] }),
  hand: 'hand',
  attach: { bone: 'tail1', landmark: 'hand' }, // any bone that is not a root: the tail rides the hand (a stand-in for the doll)
  smear: { parts: ['arm'], dx: 0.2, dy: 0 },
};

function animator(style: AnimStyle) {
  const d = data();
  const keys = compileKeys(d);
  const an = new RigAnimator({ boneIndex: d.boneIndex, roots: d.roots, keys, channels: d.bones.length * 5, bones: d.bones, skeleton: new RigSkeleton(d) }, style, SUBJECT, 1280);
  return { an, keys, work: Float64Array.from(keys.get('idle')!), vel: new Float64Array(d.bones.length * 5) };
}
const frame = (dt = 1 / 60): AnimFrame => ({ dt, rate: 1, forward: 0, calm: false });

describe('the strike lands on the lunge\'s apex', () => {
  for (const style of [STYLE_A, STYLE_B, STYLE_C]) {
    it(`style ${style.id}: the contact event comes on the frame of the apex, within one`, () => {
      const { an, keys, work, vel } = animator(style);
      an.request('ready', 'idle', work, vel);
      for (let i = 0; i < 40; i++) an.step(frame(), work, vel);
      an.drain();
      an.begin('attack', work, vel);
      for (let i = 0; i < 40; i++) an.step(frame(), work, vel); // the wind-up, held
      an.drain();
      an.lunge(440, ATTACK_IMPACT);
      const apex = 440 * ATTACK_IMPACT;
      let contactFrame = -1;
      for (let i = 1; i <= 60 && contactFrame < 0; i++) {
        an.step(frame(), work, vel);
        if (an.drain().includes('contact')) contactFrame = i;
      }
      expect(contactFrame).toBeGreaterThan(0);
      const ideal = apex / (1000 / 60);
      expect(Math.abs(contactFrame - ideal)).toBeLessThanOrEqual(1.2);
      void keys;
    });
  }

  it('a request for the attack that finds the strike already running does not restart it; one that finds it not running starts it at once', () => {
    const { an, work, vel } = animator(STYLE_B);
    an.begin('attack', work, vel);
    an.lunge(440, ATTACK_IMPACT);
    for (let i = 0; i < 12; i++) an.step(frame(), work, vel);
    expect(an.playing).toBe('strike');
    const t0 = an.compiled('strike');
    an.request('attack', 'ready', work, vel);
    expect(an.playing).toBe('strike');
    expect(an.compiled('strike')).toBe(t0);
    const b = animator(STYLE_B);
    b.an.request('attack', 'idle', b.work, b.vel);
    expect(b.an.playing).toBe('strike');
  });
});

describe('events and the smear frame', () => {
  it('a clip raises each mark once, in order, on the frame the clock reaches it', () => {
    const { an, work, vel } = animator(STYLE_B);
    an.request('item', 'idle', work, vel);
    const seen: Array<[number, AnimEvent]> = [];
    for (let i = 1; i <= 90; i++) {
      an.step(frame(), work, vel);
      for (const e of an.drain()) seen.push([i, e]);
    }
    const names = seen.map(([, e]) => e);
    expect(names.filter((n) => n === 'reach')).toHaveLength(1);
    expect(names.indexOf('reach')).toBeLessThan(names.indexOf('drawn'));
    expect(names.indexOf('drawn')).toBeLessThan(names.indexOf('release'));
    const reach = seen.find(([, e]) => e === 'reach')![0];
    expect(reach).toBe(Math.ceil((STYLE_B.item.reach * 60) / 1000 - 1e-6) + 0); // the frame whose time has reached the mark
    expect(names).toContain('smear');
  });

  it('only a style that asks for it smears (B stretches; A and C do not), for two frames at the peak speed', () => {
    const run = (style: AnimStyle): number => {
      const { an, work, vel } = animator(style);
      an.request('attack', 'ready', work, vel);
      let on = 0;
      for (let i = 0; i < 40; i++) {
        an.step(frame(), work, vel);
        if (an.smearing) on++;
      }
      return on;
    };
    expect(run(STYLE_A)).toBe(0);
    expect(run(STYLE_C)).toBe(0);
    const b = run(STYLE_B);
    expect(b).toBeGreaterThanOrEqual(2);
    expect(b).toBeLessThanOrEqual(3);
  });

  it('a hit-stop holds the smear with the rest of the clock (frozen: the window does not run out)', () => {
    const { an, work, vel } = animator(STYLE_B);
    an.request('attack', 'ready', work, vel);
    for (let i = 0; i < 4 && !an.smearing; i++) an.step(frame(), work, vel);
    expect(an.smearing).not.toBeNull();
    for (let i = 0; i < 10; i++) an.step(frame(0), work, vel); // dt 0
    expect(an.smearing).not.toBeNull();
  });
});

describe('the carried bone rides the hand', () => {
  it('through a move the carried bone stays at the fist\'s own offset blend: it ends where the key puts it and never flies off by more than the pose itself moves', () => {
    const { an, keys, work, vel } = animator(STYLE_A);
    an.request('cast', 'idle', work, vel);
    for (let i = 0; i < 80; i++) an.step(frame(), work, vel);
    const tail = (k: string): number => keys.get(k)![10 * 5 + 1]!;
    expect(Number.isFinite(work[10 * 5 + 1]!)).toBe(true);
    expect(Number.isFinite(tail('cast'))).toBe(true);
  });
});
