/**
 * **The Wind Waker chapter's clips** (`src/engine/ww3d/clips.ts`, `clipSequencer.ts`, `clipAnalysis.ts`, `pose.ts`; FFX-2 only), pinned without a GPU: which of a file's clips is which role (the stance clip `idle_combat` is the base,
 * `walk` and `run` are named and never played), the root-motion lock, the strike window found from the bone rotations, the state machine that orders the clips (the event-to-clip map: attack, cast, hit, victory, a knock-out held),
 * and a rig on a made-up skeleton.
 */
import { AnimationClip, Bone, Group, Object3D, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import { attackWindow, motionEnergy, quatAt, strikeTime, wholeWindow } from '../../../src/engine/ww3d/clipAnalysis.ts';
import { FADE_IN, FADE_OUT, ClipSequencer, type Windows } from '../../../src/engine/ww3d/clipSequencer.ts';
import { ClipRig, ROLE_PATTERNS, STANCE_CLIP, UNUSED_CLIPS, flattenRoot, lockRoot, rootBoneName, roleClips, windowsOfClips } from '../../../src/engine/ww3d/clips.ts';
import { HeadTurn, hipsYaw, yawOffsetsOf } from '../../../src/engine/ww3d/pose.ts';

const empty = (name: string, duration = 2): AnimationClip => new AnimationClip(name, duration, []);

/** A bone's quaternion burst: still, a fast turn around `at`, still again. */
function burst(bone: string, at: number, duration: number, angle = 1.2): QuaternionKeyframeTrack {
  const times = [0, at - 0.1, at, at + 0.1, duration];
  const half = angle / 2;
  const q = (a: number): number[] => [0, Math.sin(a), 0, Math.cos(a)];
  return new QuaternionKeyframeTrack(`${bone}.quaternion`, times, [...q(0), ...q(0), ...q(half), ...q(0), ...q(0)]);
}

describe('which clip is which', () => {
  const names = ['idle', 'idle_combat', 'attack', 'hit', 'cast', 'victory', 'walk', 'run'];
  const clips = names.map((n) => empty(n));

  it('takes the stance clip as the idle, and the first matching clip of each other role', () => {
    const by = roleClips(clips);
    expect(by.get('idle')?.name).toBe(STANCE_CLIP);
    expect(by.get('attack')?.name).toBe('attack');
    expect(by.get('hit')?.name).toBe('hit');
    expect(by.get('cast')?.name).toBe('cast');
    expect(by.get('victory')?.name).toBe('victory');
    expect(by.has('ko')).toBe(false); // the final files carry no knock-out clip: the skin tips a downed body over
  });

  it('falls back to the plain idle when a file has no stance clip, and has no idle at all for a file with neither', () => {
    expect(roleClips(clips.filter((c) => c.name !== STANCE_CLIP)).get('idle')?.name).toBe('idle');
    expect(roleClips([empty('attack')]).has('idle')).toBe(false);
  });

  it('names walk and run and plays neither: no role takes them, whatever the order', () => {
    expect(UNUSED_CLIPS.test('walk')).toBe(true);
    expect(UNUSED_CLIPS.test('run')).toBe(true);
    const by = roleClips([empty('walk'), empty('run'), ...clips]);
    expect([...by.values()].map((c) => c.name)).not.toContain('walk');
    expect([...by.values()].map((c) => c.name)).not.toContain('run');
    // the patterns are case-blind and match what a differently named file calls its fall
    expect(ROLE_PATTERNS.ko.test('Dead')).toBe(true);
    expect(ROLE_PATTERNS.ko.test('KO')).toBe(true);
    expect(ROLE_PATTERNS.hit.test('Hurt')).toBe(true);
    expect(roleClips([empty('Idle_Combat'), empty('Faint')]).has('ko')).toBe(true);
  });
});

describe('root motion', () => {
  it('holds the root bone\'s x and z at their first value when it strays more than 2 cm, and leaves y', () => {
    const v = new Float32Array([0, 1, 0, 0.3, 1.2, 0.1, 0.5, 1.4, -0.2]);
    expect(flattenRoot(v)).toBe(true);
    expect([...v]).toEqual([0, 1, 0, 0, 1.2, 0, 0, 1.4, 0].map((n) => Math.fround(n)));
    const still = new Float32Array([0, 1, 0, 0.01, 1.1, 0.01]);
    expect(flattenRoot(still)).toBe(false);
    expect(still[3]).toBeCloseTo(0.01, 6);
  });

  it('finds the skeleton\'s root and returns a locked copy of a clip (the original is untouched), or the clip itself when there is nothing to hold', () => {
    const hips = new Bone();
    hips.name = 'Hips';
    const spine = new Bone();
    spine.name = 'Spine';
    hips.add(spine);
    const group = new Group();
    group.add(hips);
    expect(rootBoneName(group)).toBe('Hips');
    expect(rootBoneName(new Group())).toBeNull();
    const clip = new AnimationClip('attack', 1, [new VectorKeyframeTrack('Hips.position', [0, 1], [0, 1, 0, 0.5, 1, 0.5])]);
    const locked = lockRoot(clip, 'Hips');
    expect(locked).not.toBe(clip);
    expect([...locked.tracks[0]!.values]).toEqual([0, 1, 0, 0, 1, 0]);
    expect([...clip.tracks[0]!.values]).toEqual([0, 1, 0, 0.5, 1, 0.5]);
    expect(lockRoot(clip, null)).toBe(clip);
    expect(lockRoot(new AnimationClip('idle', 1, [new VectorKeyframeTrack('Hips.position', [0, 1], [0, 1, 0, 0, 1.01, 0])]), 'Hips').tracks[0]!.values[4]).toBeCloseTo(1.01, 6);
  });
});

describe('where a clip\'s action happens', () => {
  it('finds the strike where the bones turn fastest after the wind-up, and cuts the attack to the second around it', () => {
    const tracks = [burst('Arm', 2.0, 7)];
    const energy = motionEnergy(tracks.map((t) => ({ times: t.times, values: t.values })), 7);
    expect(strikeTime(energy)).toBeGreaterThan(1.8);
    expect(strikeTime(energy)).toBeLessThan(2.2);
    const w = attackWindow(energy, 7);
    expect(w.shot).toBeDefined();
    expect(w.start).toBeLessThan(w.shot!);
    expect(w.end).toBeGreaterThan(w.shot!);
    expect(w.end - w.start).toBeLessThan(1.5);
    expect(w.end).toBeLessThanOrEqual(7);
  });

  it('plays a whole one-shot to where its motion stops, and the whole clip when nothing moves', () => {
    const t = burst('Arm', 1.0, 4);
    const w = wholeWindow(motionEnergy([{ times: t.times, values: t.values }], 4), 4);
    expect(w.start).toBe(0);
    expect(w.end).toBeLessThan(2);
    expect(w.end).toBeGreaterThan(1);
    expect(wholeWindow(new Float64Array(10), 3).end).toBe(3);
    expect(quatAt({ times: [0, 1], values: [0, 0, 0, 1, 0, 1, 0, 0] }, 0.5).map((n) => Math.round(n * 1000) / 1000)).toEqual([0, 0.707, 0, 0.707]);
  });

  it('gives each role of a file a window: a strike for the attack, none for the idle, the whole fall for a knock-out', () => {
    const clips = new Map([
      ['idle' as const, empty('idle_combat')],
      ['attack' as const, new AnimationClip('attack', 3, [burst('Arm', 1.5, 3)])],
      ['ko' as const, empty('ko', 2)],
    ]);
    const w = windowsOfClips(clips);
    expect(w.idle).toBeUndefined();
    expect(w.attack?.shot).toBeDefined();
    expect(w.ko).toEqual({ start: 0, end: 2 });
  });
});

describe('which clip plays when: the battle\'s events to the clips', () => {
  const windows: Windows = { attack: { start: 1.0, end: 2.0, shot: 1.4 }, cast: { start: 0, end: 1.5 }, hit: { start: 0, end: 0.8 }, victory: { start: 0, end: 3 }, ko: { start: 0, end: 2 } };
  const seq = (w: Windows = windows): ClipSequencer => new ClipSequencer(w);

  it('starts the attack at its window, sped so the strike lands on the blow, and plays the rest at the pace after it', () => {
    const s = seq();
    const cmd = s.open('attack', 0.2, 1)!;
    expect(cmd).toMatchObject({ role: 'attack', from: 1.0, loop: false, fade: FADE_IN });
    expect(cmd.speed).toBeCloseTo(2.0, 6); // 0.4 s of clip in 0.2 s
    expect(s.speed).toBeCloseTo(2.0, 6);
    s.impact(1);
    expect(s.speed).toBe(1);
    expect(seq().open('attack', 0.05, 1)!.speed).toBe(2.5); // clamped
    expect(seq().open('attack', 5, 1)!.speed).toBe(0.6);
  });

  it('plays a cast whole at the pace, and nothing for an action it has no clip for (an item, a defend)', () => {
    expect(seq().open('cast', 1, 1.2)).toMatchObject({ role: 'cast', from: 0, speed: 1.2 });
    expect(seq().open('item', 1)).toBeNull();
    expect(seq().open('defend', 1)).toBeNull();
    expect(seq({}).open('attack', 1)).toBeNull();
  });

  it('starts the hit on a rise to hurt and the celebration on a rise to victory, and an unannounced attack or cast on its pose', () => {
    expect(seq().pose('hurt', false)).toMatchObject({ role: 'hit' });
    expect(seq().pose('victory', false)).toMatchObject({ role: 'victory' });
    expect(seq().pose('attack', false)).toMatchObject({ role: 'attack', speed: 1 });
    expect(seq().pose('cast', false)).toMatchObject({ role: 'cast' });
    expect(seq().pose('idle', false)).toBeNull();
    const s = seq();
    s.pose('hurt', false);
    expect(s.pose('hurt', false)).toBeNull(); // the same pose again is not a new rise
  });

  it('orders them: a celebration is not interrupted by a hit; an action interrupts a hit; a hit does not interrupt an action', () => {
    const celebrating = seq();
    celebrating.pose('victory', false);
    expect(celebrating.open('attack', 0.5)).toBeNull();
    expect(celebrating.pose('hurt', false)).toBeNull();
    const hurt = seq();
    hurt.pose('hurt', false);
    expect(hurt.open('attack', 0.5)).toMatchObject({ role: 'attack' });
    const attacking = seq();
    attacking.open('attack', 0.5);
    expect(attacking.pose('hurt', false)).toBeNull();
    expect(attacking.current).toBe('attack');
  });

  it('fades a clip back to the stance at the end of its window, and carries on from where the stance\'s clock stands', () => {
    const s = seq();
    s.open('attack', 0.5);
    expect(s.update(0.3)).toBeNull();
    const back = s.update(2.0);
    expect(back).toEqual({ role: 'idle', from: -1, speed: 1, fade: FADE_OUT, loop: true });
    expect(s.current).toBe('idle');
    expect(s.update(1)).toBeNull();
  });

  it('holds a knock-out where it fell, stops every other clip while a body is down, and stands it up on a revive', () => {
    const s = seq();
    s.open('cast', 1);
    expect(s.pose('idle', true)).toMatchObject({ role: 'ko', from: 0 });
    expect(s.update(5)).toBeNull(); // it never ends by itself
    expect(s.open('attack', 0.5)).toBeNull();
    expect(s.pose('hurt', true)).toBeNull();
    expect(s.pose('idle', false)).toEqual({ role: 'idle', from: -1, speed: 1, fade: 0.3, loop: true });
    expect(s.current).toBe('idle');
    // a model without a knock-out clip just stops: the actor tips the body over
    const none = seq({ attack: windows.attack! });
    expect(none.pose('idle', true)).toBeNull();
    expect(none.current).toBe('idle');
    expect(none.has('ko')).toBe(false);
  });
});

// ------------------------------------------------------------------ a rig on a made-up skeleton

/** Hips, with two legs a metre apart in x, a head and a face bone: the names the chapter reads. It faces +Z. */
function skeleton(): { root: Group; hips: Bone; head: Bone } {
  const root = new Group();
  const hips = new Bone();
  hips.name = 'Hips';
  const mk = (name: string, x: number, y: number, z: number, parent: Object3D): Bone => {
    const b = new Bone();
    b.name = name;
    b.position.set(x, y, z);
    parent.add(b);
    return b;
  };
  mk('LeftUpLeg', 0.5, 0, 0, hips); // a model facing +Z has its left side at +x
  mk('RightUpLeg', -0.5, 0, 0, hips);
  const spine = mk('Spine', 0, 0.5, 0, hips);
  const head = mk('Head', 0, 0.5, 0, spine);
  mk('headfront', 0, 0, 0.3, head);
  root.add(hips);
  root.updateMatrixWorld(true);
  return { root, hips, head };
}

describe('a rig drives the clips by the events', () => {
  const clips = new Map([
    ['idle' as const, new AnimationClip('idle_combat', 2, [new QuaternionKeyframeTrack('Spine.quaternion', [0, 2], [0, 0, 0, 1, 0, 0, 0, 1])])],
    ['attack' as const, new AnimationClip('attack', 3, [burst('Spine', 1.5, 3)])],
    ['hit' as const, new AnimationClip('hit', 1, [burst('Spine', 0.4, 1, 0.8)])],
  ]);

  it('starts on its idle, plays an attack on its beat, and is back on the idle after the window', () => {
    const { root } = skeleton();
    const rig = new ClipRig(root, clips, 'yuna');
    expect(rig.current).toBe('idle');
    expect(rig.roles).toEqual(['idle', 'attack', 'hit']);
    rig.open('attack', 0.4, 1);
    rig.update(0.016);
    expect(rig.current).toBe('attack');
    rig.impact(1);
    for (let i = 0; i < 200; i++) rig.update(0.016);
    expect(rig.current).toBe('idle');
    rig.pose('hurt', false);
    expect(rig.current).toBe('hit');
    rig.dispose();
  });

  it('refuses a file with no idle, and holds still when frozen', () => {
    const { root } = skeleton();
    expect(() => new ClipRig(root, new Map([['attack' as const, clips.get('attack')!]]), 'x')).toThrow(/idle/);
    const rig = new ClipRig(root, clips, 'rikku');
    rig.open('attack', 0.4);
    rig.update(0.5, true);
    expect(rig.current).toBe('attack'); // frozen: the window does not advance
    rig.dispose();
  });

  it('measures the pelvis\'s facing, a role\'s offset against the stance, and eases it in while the role plays and out after', () => {
    const { root, hips } = skeleton();
    expect(hipsYaw(root)).toBeCloseTo(0, 6); // facing +Z
    hips.rotation.y = 0.5;
    root.updateMatrixWorld(true);
    expect(hipsYaw(root)).toBeCloseTo(0.5, 6);
    hips.rotation.y = 0;
    // the attack clip twists the hips by 0.6 rad at its window's start: its offset is the stance's facing minus that
    const twisted = new Map(clips);
    twisted.set('attack', new AnimationClip('attack', 3, [new QuaternionKeyframeTrack('Hips.quaternion', [0, 3], [0, Math.sin(0.3), 0, Math.cos(0.3), 0, Math.sin(0.3), 0, Math.cos(0.3)])]));
    const offsets = yawOffsetsOf(root, twisted, { attack: { start: 0.5, end: 1.5, shot: 1 } });
    expect(offsets.attack).toBeCloseTo(-0.6, 5);
    expect(offsets.hit).toBeCloseTo(0, 5);
    const rig = new ClipRig(root, twisted, 'paine', offsets);
    expect(rig.yawOffset).toBe(0);
    rig.open('attack', 0.5);
    for (let i = 0; i < 40; i++) rig.update(0.016);
    expect(rig.yawOffset).toBeCloseTo(-0.6, 1);
    for (let i = 0; i < 300; i++) rig.update(0.016);
    expect(rig.current).toBe('idle');
    expect(Math.abs(rig.yawOffset)).toBeLessThan(0.02);
    rig.dispose();
  });

  it('turns the head toward the viewer by the angle the maths asks for, and is unavailable on a model with no head', () => {
    const { root } = skeleton();
    const turn = new HeadTurn(root);
    expect(turn.available).toBe(true);
    const applied = turn.apply([0, 1, 10], 0); // the lens straight ahead of a head facing +Z, the face wanted square to it: no turn
    expect(applied).toBeCloseTo(0, 6);
    const off = turn.apply([5, 1, 5], 0); // the lens 45 degrees to the right (+x): the head turns 45 degrees that way
    expect(off).toBeCloseTo(Math.PI / 4, 4);
    expect(new HeadTurn(new Group()).available).toBe(false);
    expect(new HeadTurn(new Group()).apply([0, 0, 1])).toBe(0);
  });
});
