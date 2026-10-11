/**
 * **The `ffx` skin's models move** (`src/engine/ffx3d/ffxAnimator.ts`; FFX only). Real three.js mixers on made-up models (a root with one node a clip moves along x from 0 to 1 over its length, so
 * the node's x is how far through its clip an actor is) and made-up clip names: no retail file or name is read. What this file pins:
 *
 * 1. **A model starts standing**, each at an idle phase of its own; an actor with no table or no idle clip is not animated.
 * 2. **The pose drives it**: the idle loop, the hit reaction, the fall. A clip that finishes hands over to the next of its row (the `finished` event is queued by the mixer and handled after its update),
 *    and a finished row settles to idle; a held row stays in its hold.
 * 3. **The beats drive an action**: it opens with its own row (the ability's, by id), its hold ends on the first blow, and the presenter's `ready`, `attack` and `follow` paintings during it restart
 *    nothing; hit, fall and win still take over. The strike starts part-way in to land with the hit (`lead`).
 * 4. **The airship's flights** start on the range change and the pose does not cut them.
 * 5. **Speeds follow the pacing rate**; a clip the file lacks is skipped; `dispose` frees the mixers.
 *
 * Game case: FFX only.
 */
import { AnimationClip, Object3D, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import { parseClipMap, type ClipMap } from '../../src/engine/ffx3d/clipMap.ts';
import { FfxAnimator, phaseOf, type AnimatedModel, type PoseReading } from '../../src/engine/ffx3d/ffxAnimator.ts';

const step = (clip: string, play: string, frames: number): Record<string, unknown> => ({ clip, play, frames });
const row = (sequence: unknown[], extra: Record<string, unknown> = {}): Record<string, unknown> => ({ status: 'mapped', sequence, ...extra });
const TABLE = {
  fps: 30,
  characters: {
    hero: {
      glb: 'evrae/hero-anims.glb',
      poses: {
        idle: row([step('H_IDLE', 'loop', 30)]),
        attack: row([step('H_ATK_0', 'once', 21), step('H_ATK_1', 'once', 15)], { contact: { sequenceFrame: 20 } }),
        cast: row([step('H_CAST_0', 'once', 15), step('H_CAST_1', 'loop', 15), step('H_CAST_2', 'once', 30)]),
        hurt: row([step('H_HURT', 'once', 30)]),
        ko: row([step('H_KO_0', 'once', 30), step('H_KO_1', 'loop', 3)]),
      },
    },
    beast: {
      glb: 'evrae/beast-anims.glb',
      poses: {
        idle: row([step('B_IDLE', 'loop', 60)]),
        attack: row([step('B_ATK', 'once', 30)]),
        hurt: row([step('B_HURT', 'once', 30)]),
        'poison-breath': row([step('B_BR_0', 'once', 30), step('B_BR_1', 'loop', 15), step('B_BR_2', 'once', 30)]),
        'pull-back': row([step('B_FLY', 'once', 60)]),
        'move-in': row([step('B_IN', 'once', 60)]),
      },
    },
  },
};

/** A clip of `frames` frames at 30 a second that moves `Bone.position.x` from 0 to 1 over its whole length. */
const clip = (name: string, frames: number): AnimationClip => {
  const duration = frames / 30;
  return new AnimationClip(name, duration, [new VectorKeyframeTrack('Bone.position', [0, duration], [0, 0, 0, 1, 0, 0])]);
};
const LIBRARY: Record<string, number> = { H_IDLE: 30, H_ATK_0: 21, H_ATK_1: 15, H_CAST_0: 15, H_CAST_1: 15, H_CAST_2: 30, H_HURT: 30, H_KO_0: 30, H_KO_1: 3, B_IDLE: 60, B_ATK: 30, B_HURT: 30, B_BR_0: 30, B_BR_1: 15, B_BR_2: 30, B_FLY: 60, B_IN: 60 };
const clipsFor = (prefix: string, skip: readonly string[] = []): Map<string, AnimationClip> =>
  new Map(Object.entries(LIBRARY).filter(([n]) => n.startsWith(prefix) && !skip.includes(n)).map(([n, f]) => [n, clip(n, f)] as const));

interface Rig {
  readonly animator: FfxAnimator;
  readonly bone: (id: string) => Object3D;
  readonly pose: (id: string, pose: string, life?: string) => void;
}

function rig(opts: { rate?: () => number; skip?: readonly string[]; map?: ClipMap | null } = {}): Rig {
  const map = opts.map === undefined ? parseClipMap(TABLE)! : opts.map!;
  const animator = new FfxAnimator({ map, clips: { hero: clipsFor('H_', opts.skip), beast: clipsFor('B_', opts.skip) }, ...(opts.rate ? { rate: opts.rate } : {}) });
  const poses = new Map<string, PoseReading>();
  const bones = new Map<string, Object3D>();
  for (const id of ['hero', 'beast', 'stranger']) {
    const root = new Object3D();
    const bone = new Object3D();
    bone.name = 'Bone';
    root.add(bone);
    bones.set(id, bone);
    poses.set(id, { pose: 'idle', life: 'idle' });
    const model: AnimatedModel = { id, root, read: () => poses.get(id)! };
    animator.add(model);
  }
  return { animator, bone: (id) => bones.get(id)!, pose: (id, pose, life = 'idle') => void poses.set(id, { pose, life }) };
}

/** Advance `seconds` in 1/30 s frames. */
const run = (a: FfxAnimator, seconds: number): void => {
  for (let i = 0; i < Math.round(seconds * 30); i++) a.update(1 / 30);
};

describe('a model starts standing', () => {
  it('stands in its idle, and an actor the table has nothing for is not animated', () => {
    const { animator } = rig();
    expect(animator.ids.sort()).toEqual(['beast', 'hero']); // "stranger" has no table
    expect(animator.clipOf('hero')).toBe('H_IDLE');
    expect(animator.clipOf('beast')).toBe('B_IDLE');
    expect(animator.clipOf('stranger')).toBeNull();
    expect(animator.stateOf('stranger')).toBeNull();
    expect(animator.canAnimate('stranger')).toBe(false);
  });

  it('an actor whose file lacks its idle clip is not animated, and no clip table at all animates nothing', () => {
    expect(rig({ skip: ['H_IDLE'] }).animator.ids).toEqual(['beast']);
    const none = new FfxAnimator({ map: { fps: 30, actors: {} }, clips: {} });
    expect(none.add({ id: 'hero', root: new Object3D(), read: () => ({ pose: 'idle', life: 'idle' }) })).toBe(false);
  });

  it('starts each model at a phase of its own, the same for the same id', () => {
    expect(phaseOf('hero')).toBe(phaseOf('hero'));
    expect(phaseOf('hero')).not.toBe(phaseOf('beast'));
    for (const id of ['hero', 'beast', 'tidus', 'wakka', 'rikku', 'evrae', '']) expect(phaseOf(id), id).toBeGreaterThanOrEqual(0);
    for (const id of ['hero', 'beast', 'tidus', 'wakka', 'rikku', 'evrae', '']) expect(phaseOf(id), id).toBeLessThan(1);
    const { animator, bone } = rig();
    animator.update(0);
    expect(bone('hero').position.x).toBeCloseTo(phaseOf('hero'), 2); // x is the fraction through the idle clip
  });

  it('loops the idle for as long as it is asked, never settling or restarting into something else', () => {
    const { animator } = rig();
    run(animator, 5);
    expect(animator.clipOf('hero')).toBe('H_IDLE');
    expect(animator.stateOf('hero')).toMatchObject({ key: 'idle' });
  });
});

describe('the pose drives it', () => {
  it('a finite row plays its clips in turn and settles to idle, though the pose is still the attack', () => {
    const { animator, pose } = rig();
    pose('hero', 'attack');
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_ATK_0');
    run(animator, 0.8); // 21 frames = 0.7 s
    expect(animator.clipOf('hero')).toBe('H_ATK_1');
    run(animator, 0.6); // 15 frames = 0.5 s
    expect(animator.clipOf('hero')).toBe('H_IDLE');
    run(animator, 1);
    expect(animator.clipOf('hero')).toBe('H_IDLE'); // not restarted: the same pose is not a new edge
  });

  it('the hit reaction plays in about half a second, and the idle painting coming back does not cut it', () => {
    const { animator, pose } = rig();
    pose('hero', 'hurt');
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_HURT');
    pose('hero', 'idle'); // the flinch is a third of a second
    run(animator, 0.2);
    expect(animator.clipOf('hero')).toBe('H_HURT'); // still going
    run(animator, 0.5);
    expect(animator.clipOf('hero')).toBe('H_IDLE');
  });

  it('a fallen figure plays its fall and holds the last clip until it stands again; the life state decides it', () => {
    const { animator, pose } = rig();
    pose('hero', 'ko', 'down');
    run(animator, 1.2);
    expect(animator.clipOf('hero')).toBe('H_KO_1');
    run(animator, 3);
    expect(animator.clipOf('hero')).toBe('H_KO_1');
    pose('hero', 'idle', 'idle'); // revived
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_IDLE');
  });

  it('a held row stays in its hold, and is released when the pose goes back to idle', () => {
    const { animator, pose } = rig();
    pose('hero', 'cast');
    run(animator, 1);
    expect(animator.clipOf('hero')).toBe('H_CAST_1');
    run(animator, 2);
    expect(animator.clipOf('hero')).toBe('H_CAST_1'); // held
    pose('hero', 'idle');
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_CAST_2'); // the release
    run(animator, 1.2);
    expect(animator.clipOf('hero')).toBe('H_IDLE');
  });

  it('follow carries on whatever is playing', () => {
    const { animator, pose } = rig();
    pose('hero', 'cast');
    run(animator, 1);
    pose('hero', 'follow');
    run(animator, 0.5);
    expect(animator.clipOf('hero')).toBe('H_CAST_1');
  });
});

describe('the beats drive an action', () => {
  it('opens the ability\'s own row (Evrae\'s breath by id) and holds it against the presenter\'s attack painting; the first blow releases it', () => {
    const { animator, pose } = rig();
    pose('beast', 'attack'); // an enemy's pose says attack whatever the move is
    animator.noteOpen('beast', { abilityId: 'evrae-poison-breath', kind: 'cast', lead: 0.3 });
    animator.update(1 / 30);
    expect(animator.clipOf('beast')).toBe('B_BR_0');
    run(animator, 1.2);
    expect(animator.clipOf('beast')).toBe('B_BR_1'); // the hold
    run(animator, 2);
    expect(animator.clipOf('beast')).toBe('B_BR_1');
    animator.noteImpact('beast'); // the first blow lands
    expect(animator.clipOf('beast')).toBe('B_BR_2');
    animator.noteClose('beast');
    pose('beast', 'idle');
    run(animator, 1.2);
    expect(animator.clipOf('beast')).toBe('B_IDLE');
  });

  it('a close with no blow released the hold when the pose goes back to idle', () => {
    const { animator, pose } = rig();
    pose('hero', 'cast');
    animator.noteOpen('hero', { kind: 'cast' });
    run(animator, 1);
    expect(animator.clipOf('hero')).toBe('H_CAST_1');
    pose('hero', 'idle'); // the presenter returns the idle painting first, then closes
    run(animator, 0.5);
    expect(animator.clipOf('hero')).toBe('H_CAST_1'); // the action is still open: held
    animator.noteClose('hero');
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_CAST_2');
  });

  it('the wind-up painting, the impact painting and the follow-through during one attack restart nothing', () => {
    const { animator, pose } = rig();
    pose('hero', 'ready'); // the wind-up
    animator.noteOpen('hero', { kind: 'attack', lead: 0.3 });
    expect(animator.clipOf('hero')).toBe('H_ATK_0');
    run(animator, 0.2);
    const at = animator.stateOf('hero');
    pose('hero', 'attack'); // the apex
    run(animator, 0.05);
    pose('hero', 'follow');
    run(animator, 0.1);
    pose('hero', 'idle'); // the presenter's action end
    animator.noteClose('hero');
    run(animator, 0.1);
    expect(at).toMatchObject({ key: 'attack', step: 0 });
    expect(animator.stateOf('hero')!.key).toBe('attack'); // still the one blow, playing out
    run(animator, 1);
    expect(animator.clipOf('hero')).toBe('H_IDLE');
  });

  it('starts the strike part-way in, so it lands with the hit: the contact is on frame 20 and the lead is 0.3 s', () => {
    const { animator } = rig();
    animator.noteOpen('hero', { kind: 'attack', lead: 0.3 });
    // 20 frames take 0.667 s at 1x: 2.2x wanted, capped at 1.8; it must cover 16.2 frames of the 20, so it starts at frame 3 of 21
    expect(animator.clipOf('hero')).toBe('H_ATK_0');
    expect(animator.speedOf('hero')).toBeCloseTo(1.8, 6);
    expect(animator.timeOf('hero')).toBeCloseTo(3 / 30, 6);
    run(animator, 0.1); // 0.1 s at 1.8x = 0.18 s of the clip further
    expect(animator.timeOf('hero')).toBeCloseTo(3 / 30 + 0.18, 2);
  });

  it('the lead is in real time and the clip runs at the pacing rate: at 0.5 the sequencer plans in clip time', () => {
    const { animator } = rig({ rate: () => 0.5 });
    animator.noteOpen('hero', { kind: 'attack', lead: 0.3 }); // 0.3 s real = 0.15 s of clip time at that rate
    expect(animator.speedOf('hero')).toBeCloseTo(1.8 * 0.5, 6); // the sequencer's scale (capped) times the rate
    expect(animator.timeOf('hero')).toBeCloseTo(Math.floor(20 - 0.15 * 30 * 1.8) / 30, 6); // 20 - 8.1 = 11.9 -> frame 11
  });

  it('being hit, falling and winning take over from an open action, which is then forgotten', () => {
    const { animator, pose } = rig();
    animator.noteOpen('hero', { kind: 'cast' });
    run(animator, 1);
    pose('hero', 'hurt');
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_HURT');
    pose('hero', 'idle');
    run(animator, 1);
    expect(animator.clipOf('hero')).toBe('H_IDLE'); // the cast was not resumed
  });

  it('an action of an actor that is not animated, or of a kind with no row (an Overdrive), is nothing', () => {
    const { animator } = rig();
    animator.noteOpen('stranger', { kind: 'attack' });
    animator.noteOpen('hero', { kind: 'overdrive' });
    animator.noteImpact('stranger');
    animator.noteClose('stranger');
    expect(animator.clipOf('hero')).toBe('H_IDLE');
  });
});

describe('the airship\'s flights', () => {
  it('start on the range change, are not cut by the pose, and settle to idle', () => {
    const { animator, pose } = rig();
    animator.noteRange('beast', 'far');
    expect(animator.clipOf('beast')).toBe('B_FLY');
    pose('beast', 'ready'); // the presenter's pose changes during the flight
    run(animator, 1);
    expect(animator.clipOf('beast')).toBe('B_FLY');
    run(animator, 1.5);
    expect(animator.clipOf('beast')).toBe('B_IDLE'); // done: the pose rules again
    pose('beast', 'idle');
    animator.noteRange('beast', 'near');
    expect(animator.clipOf('beast')).toBe('B_IN');
  });

  it('a painting left over from before the flight is not a new action when it ends', () => {
    const { animator, pose } = rig();
    animator.noteRange('beast', 'far');
    pose('beast', 'attack');
    run(animator, 2.5);
    expect(animator.clipOf('beast')).toBe('B_IDLE'); // not B_ATK: the attack painting was already up
    run(animator, 1);
    expect(animator.clipOf('beast')).toBe('B_IDLE');
    pose('beast', 'idle');
    pose('beast', 'attack'); // a real change after it is an edge again
    animator.update(1 / 30);
    expect(animator.clipOf('beast')).toBe('B_IDLE'); // idle was never seen between the two updates: still not an edge
    pose('beast', 'idle');
    animator.update(1 / 30);
    pose('beast', 'attack');
    animator.update(1 / 30);
    expect(animator.clipOf('beast')).toBe('B_ATK');
  });

  it('being hit takes over from a flight', () => {
    const { animator, pose } = rig();
    animator.noteRange('beast', 'far');
    pose('beast', 'hurt');
    animator.update(1 / 30);
    expect(animator.stateOf('beast')!.key).not.toBe('pull-back');
  });
});

describe('speed, missing clips and cleaning up', () => {
  it('runs the action clips at the pacing rate and the idle at its own speed', () => {
    const slow = rig({ rate: () => 0.5 });
    const fast = rig({ rate: () => 1 });
    for (const r of [slow, fast]) r.pose('beast', 'attack');
    slow.animator.update(1 / 30);
    fast.animator.update(1 / 30);
    expect(slow.animator.speedOf('beast')).toBe(0.5);
    expect(fast.animator.speedOf('beast')).toBe(1);
    expect(slow.animator.speedOf('hero')).toBe(1); // the idle is not scaled
    const t0 = slow.animator.timeOf('beast')!;
    run(slow.animator, 0.5);
    run(fast.animator, 0.5);
    expect(fast.animator.timeOf('beast')!).toBeCloseTo(0.5 + 1 / 30, 1); // half a second of a one-second clip
    expect(slow.animator.timeOf('beast')! - t0).toBeCloseTo(0.25, 1);
  });

  it('a clip the file lacks is skipped: the actor stays on what it was doing', () => {
    const { animator, pose } = rig({ skip: ['H_ATK_0'] });
    pose('hero', 'attack');
    run(animator, 0.5);
    expect(animator.clipOf('hero')).toBe('H_IDLE');
  });

  it('a rate that is not a positive number is taken as 1', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = rig({ rate: () => bad });
      r.pose('beast', 'attack');
      r.animator.update(1 / 30);
      expect(r.animator.speedOf('beast'), String(bad)).toBe(1);
    }
  });

  it('a long frame (a hidden tab coming back) advances a clip by a tenth of a second at most', () => {
    const { animator, pose } = rig();
    pose('beast', 'attack');
    animator.update(1 / 30);
    const t0 = animator.timeOf('beast')!;
    animator.update(5);
    expect(animator.timeOf('beast')! - t0).toBeCloseTo(0.1, 6); // 0.1 s of a 1 s clip
  });

  it('removing an actor, and disposing, free the mixers', () => {
    const { animator } = rig();
    animator.remove('hero');
    expect(animator.ids).toEqual(['beast']);
    animator.remove('hero'); // twice is nothing
    animator.dispose();
    expect(animator.ids).toEqual([]);
  });

  it('adding a model of the same id again replaces the first', () => {
    const { animator } = rig();
    const root = new Object3D();
    root.add(Object.assign(new Object3D(), { name: 'Bone' }));
    expect(animator.add({ id: 'hero', root, read: () => ({ pose: 'attack', life: 'idle' }) })).toBe(true);
    expect(animator.ids.filter((i) => i === 'hero')).toHaveLength(1);
    animator.update(1 / 30);
    expect(animator.clipOf('hero')).toBe('H_ATK_0');
  });
});
