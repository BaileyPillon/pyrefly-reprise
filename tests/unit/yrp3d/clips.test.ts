/**
 * **Which clip plays when, and the mixer that plays it** (`src/engine/yrp3d/clipSequencer.ts`, `clips.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only). The state machine is pure, so it is driven with
 * the durations of the real clips (the girls' bank and Bahamut's parts, from `clipmap.json`) and a made-up clock; the rig is driven on three's real `AnimationMixer` with synthetic clips named as the game names them.
 * What it pins:
 *
 * 1. **An attack** plays the end of its entry so that it finishes on the blow (a long wind-up is cut, not played in full), holds until the blow lands (or the action closes, or the hold times out), then plays its follow-through
 *    and returns to the idle. Bahamut's combo, with no hold clip, stays on its last frame until the blow.
 * 2. **A cast and an item** play their start (at up to double speed), hold while the action is on, and finish when it closes; a pose that rose before the beat said so is not started twice.
 * 3. **A hit** plays once; an attack interrupts it and it does not interrupt an attack; **a victory** plays its pose and holds for good, and nothing but a fall interrupts it.
 * 4. **A fall** plays and holds the last frame (no action starts while it is down); a revive plays the rise and returns to the idle.
 * 5. **The kneel** (low HP) kneels in, holds, and rises when the HP is back; an action stands the figure up and it kneels again after.
 * 6. **The fidget** (`idle2`) plays once every several seconds from the idle, never while kneeling, at a time that is each figure's own.
 * 7. **The rig**: the idle loops, the poses move the body, a stilled idle does not move but a fall runs to its pose, and a model with no idle clip has no rig.
 */
import { AnimationClip, Group, Mesh, VectorKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import { plansFromNames } from '../../../src/engine/yrp3d/clipMap.ts';
import { BUDGET, ClipSequencer, DEFAULT_LEAD, FADE, MAX_HOLD, type Command } from '../../../src/engine/yrp3d/clipSequencer.ts';
import { ClipRig } from '../../../src/engine/yrp3d/clips.ts';

/** A girl's clips with Yuna's real durations (seconds), and Bahamut's with his. */
const GIRL: Record<string, number> = {
  APPEAR_00: 1, IDLE2: 1, DMG1: 1, DMG2: 1, WEAK1_00: 1, WEAK1_01: 1.3, WEAK1_02: 1, DEAD_00: 2.4, DEAD_01: 0.03, DEAD_02: 3.8,
  ATTACK1_00: 0.43, ATTACK1_01: 0.03, ATTACK1_02: 0.8, MAGIC2_00: 0.63, MAGIC2_01: 0.37, MAGIC2_02: 1.47,
  ITEM_00: 0.63, ITEM_01: 0.37, ITEM_02_1: 1.47, WIN_00: 2.9, WIN_01: 0.73,
};
const BAHAMUT: Record<string, number> = {
  APPEAR_00: 1.5, IDLE2: 1.9, DMG1: 1.7, WEAK1_00: 1.4, WEAK1_01: 1, WEAK1_02: 2, DEAD_00: 1.63, DEAD_01: 1.13, DEAD_02: 1.83, DEAD_03: 0.97,
  ATTACK1_00: 1.43, ATTACK1_01: 1.2, ATTACK1_02: 0.77, ATTACK1_03: 0.83, MAGIC2_00: 1.33, MAGIC2_01: 0.63, MAGIC2_02: 2.3, WIN_00: 2.77, WIN_01: 0.73,
};

const girl = (seed = 'yuna'): ClipSequencer => new ClipSequencer(plansFromNames(Object.keys(GIRL)), GIRL, seed);
const boss = (): ClipSequencer => new ClipSequencer(plansFromNames(Object.keys(BAHAMUT)), BAHAMUT, 'bahamut');

/** Run `seq.update` for `seconds` in steps of 1/60 s, returning the commands it gave and when (the clock starts at `t0`). */
function run(seq: ClipSequencer, seconds: number, t0 = 0): Array<{ t: number; cmd: Command }> {
  const out: Array<{ t: number; cmd: Command }> = [];
  const steps = Math.round(seconds * 60);
  for (let i = 1; i <= steps; i++) {
    const cmd = seq.update(1 / 60);
    if (cmd) out.push({ t: t0 + i / 60, cmd });
  }
  return out;
}

describe('an attack', () => {
  it('plays its start so that it ends on the blow, holds, then plays the follow-through on the blow and returns to the idle', () => {
    const seq = girl();
    const open = seq.open('attack', 0.25)!;
    expect([open.clip, open.from, open.loop]).toEqual(['ATTACK1_00', 0, false]);
    expect(open.speed).toBeCloseTo(0.43 / 0.25, 3); // the start fitted into the lead
    const first = run(seq, 0.3);
    expect(first).toHaveLength(1);
    expect(first[0]!.cmd).toMatchObject({ clip: 'ATTACK1_01', loop: true, from: 0 }); // the hold
    expect(first[0]!.t).toBeCloseTo(0.25, 1); // arrives on the blow
    expect(seq.current).toBe('attack');
    const fin = seq.impact()!;
    expect(fin).toMatchObject({ clip: 'ATTACK1_02', loop: false, from: 0, fade: FADE.in });
    const back = run(seq, 1);
    expect(back).toHaveLength(1);
    expect(back[0]!.cmd).toMatchObject({ clip: 'APPEAR_00', from: -1, loop: true, fade: FADE.out });
    expect(back[0]!.t).toBeCloseTo(0.8, 1); // the follow-through at its own speed
    expect(seq.current).toBe('idle');
    expect(seq.speed).toBe(1);
  });

  it('cuts a long wind-up to the moment before the strike: from late in the start, at the top speed, so the end of it is on the blow', () => {
    const long = { ...GIRL, ATTACK1_00: 1.3 };
    const seq = new ClipSequencer(plansFromNames(Object.keys(long)), long, 'rikku');
    const open = seq.open('attack', 0.25)!;
    expect(open.speed).toBeCloseTo(2.2, 6);
    expect(open.from).toBeCloseTo(1.3 - 0.25 * 2.2, 6); // the last half second of it
    const gave = run(seq, 0.3);
    expect(gave[0]!.cmd.clip).toBe('ATTACK1_01');
    expect(gave[0]!.t).toBeCloseTo(0.25, 1);
  });

  it('plays an unannounced attack (no lead) as if the blow were DEFAULT_LEAD away', () => {
    const seq = girl();
    expect(seq.open('attack', undefined)!.speed).toBeCloseTo(0.43 / DEFAULT_LEAD, 3);
  });

  it('holds on the blow\'s absence only as long as MAX_HOLD, then plays the follow-through anyway', () => {
    const seq = girl();
    seq.open('attack', 0.25);
    const gave = run(seq, 0.25 + MAX_HOLD.attack + 0.1);
    expect(gave.map((g) => g.cmd.clip)).toEqual(['ATTACK1_01', 'ATTACK1_02']);
    expect(gave[1]!.t).toBeCloseTo(0.25 + MAX_HOLD.attack, 1);
  });

  it('goes straight to the follow-through when the blow lands before the start is over (the start is not cut off mid-way; it ends, then the finish plays)', () => {
    const seq = girl();
    seq.open('attack', 0.25);
    expect(seq.impact()).toBeNull(); // still in the start
    const gave = run(seq, 0.3);
    expect(gave[0]!.cmd.clip).toBe('ATTACK1_02'); // no hold
  });

  it('releases a held attack when the action closes, and when the actor is back at rest', () => {
    const a = girl();
    a.open('attack', 0.25);
    run(a, 0.3);
    expect(a.close()).toMatchObject({ clip: 'ATTACK1_02' });
    const b = girl();
    b.open('attack', 0.25);
    run(b, 0.3);
    expect(b.pose('idle', false, false)).toMatchObject({ clip: 'ATTACK1_02' }); // the pose left 'attack'
    const c = girl();
    c.open('attack', 0.25);
    run(c, 0.3);
    expect(c.pose('ready', false, false)).toBeNull(); // 'ready' is still the action
    expect(c.pose('attack', false, false)).toBeNull();
  });
});

describe('Bahamut\'s combo (no hold clip)', () => {
  it('plays the end of the lunge on the blow, stays on its last frame until the blow lands, then plays the recovery in order and returns to the idle', () => {
    const seq = boss();
    const open = seq.open('attack', 0.25)!;
    expect(open.clip).toBe('ATTACK1_01'); // the first part is skipped past
    expect(open.speed).toBeCloseTo(2.2, 6);
    expect(open.from).toBeCloseTo(1.43 + 1.2 - 0.25 * 2.2 - 1.43, 6);
    run(seq, 0.3);
    expect(seq.clip).toBeNull();
    expect(seq.speed).toBe(0); // held on the frame
    expect(seq.stage).toBe('hold');
    const fin = seq.impact()!;
    expect(fin.clip).toBe('ATTACK1_02');
    expect(fin.speed).toBeCloseTo((0.77 + 0.83) / BUDGET.exit, 3);
    const gave = run(seq, 2);
    expect(gave.map((g) => g.cmd.clip)).toEqual(['ATTACK1_03', 'APPEAR_00']);
    expect(gave[0]!.cmd.fade).toBe(FADE.part);
  });

  it('has no item (a monster\'s bank) and ignores a defend', () => {
    const seq = boss();
    expect(seq.open('item', undefined)).toBeNull();
    expect(seq.open('defend', undefined)).toBeNull();
    expect(seq.has('item')).toBe(false);
    expect(seq.has('attack')).toBe(true);
  });
});

describe('a cast and an item', () => {
  it('plays the start at up to double speed, holds while the action is on, and plays the finish when it closes', () => {
    const seq = girl();
    const open = seq.open('cast', undefined)!;
    expect(open.clip).toBe('MAGIC2_00');
    expect(open.speed).toBeCloseTo(Math.max(1, 0.63 / BUDGET.enter), 6);
    const gave = run(seq, 1);
    expect(gave).toHaveLength(1);
    expect(gave[0]!.cmd).toMatchObject({ clip: 'MAGIC2_01', loop: true });
    expect(run(seq, 2)).toHaveLength(0); // held
    expect(seq.current).toBe('cast');
    const fin = seq.close()!;
    expect(fin.clip).toBe('MAGIC2_02');
    expect(fin.speed).toBeCloseTo(1.47 / BUDGET.exit, 3);
    expect(run(seq, 2).map((g) => g.cmd.clip)).toEqual(['APPEAR_00']);
  });

  it('speeds a long start to double speed, and lets go of a spell that never closes after MAX_HOLD', () => {
    const slow = { ...GIRL, MAGIC2_00: 1.57 };
    const seq = new ClipSequencer(plansFromNames(Object.keys(slow)), slow, 'rikku');
    expect(seq.open('cast', undefined)!.speed).toBe(2);
    run(seq, 0.9);
    const gave = run(seq, MAX_HOLD.cast + 0.2);
    expect(gave.map((g) => g.cmd.clip)).toEqual(['MAGIC2_02']);
  });

  it('plays an item as it plays a cast: ITEM_00, a hold, ITEM_02_1', () => {
    const seq = girl();
    expect(seq.open('item', undefined)!.clip).toBe('ITEM_00');
    expect(run(seq, 1)[0]!.cmd.clip).toBe('ITEM_01');
    expect(seq.close()!.clip).toBe('ITEM_02_1');
  });

  it('does not start a cast twice when the pose rose before the beat said so', () => {
    const seq = girl();
    expect(seq.pose('cast', false, false)).toMatchObject({ clip: 'MAGIC2_00' }); // the unannounced rise
    run(seq, 0.2);
    expect(seq.open('cast', undefined)).toBeNull(); // the beat arrives late: no restart
    expect(seq.current).toBe('cast');
  });

  it('releases a held cast when the actor is back at rest (the beat of the close never came)', () => {
    const seq = girl();
    seq.open('cast', undefined);
    run(seq, 1);
    expect(seq.pose('cast', false, false)).toBeNull();
    expect(seq.pose('idle', false, false)).toMatchObject({ clip: 'MAGIC2_02' });
  });
});

describe('a hit and a victory', () => {
  it('plays a hit once, fitted into a short time, then returns to the idle; it does not interrupt an attack, and an attack interrupts it', () => {
    const seq = girl();
    const hit = seq.pose('hurt', false, false)!;
    expect(hit.clip).toBe('DMG1');
    expect(hit.speed).toBeCloseTo(1 / BUDGET.hurt, 3);
    expect(run(seq, 1).map((g) => g.cmd.clip)).toEqual(['APPEAR_00']);
    const act = girl();
    act.open('attack', 0.25);
    expect(act.pose('hurt', false, false)).toBeNull(); // the action wins
    expect(act.current).toBe('attack');
    const hurt = girl();
    hurt.pose('hurt', false, false);
    expect(hurt.open('attack', 0.25)!.clip).toBe('ATTACK1_00'); // the player's move wins
  });

  it('plays the victory pose, then holds its hold for good, and nothing but a fall interrupts it', () => {
    const seq = girl();
    expect(seq.pose('victory', false, false)).toMatchObject({ clip: 'WIN_00' });
    expect(run(seq, 3.2)[0]!.cmd).toMatchObject({ clip: 'WIN_01', loop: true });
    expect(seq.pose('hurt', false, false)).toBeNull();
    expect(seq.open('attack', 0.25)).toBeNull();
    expect(run(seq, 20)).toHaveLength(0);
    expect(seq.current).toBe('victory');
    expect(seq.settling).toBe(true);
    expect(seq.pose('victory', true, false)).toMatchObject({ clip: 'DEAD_00' }); // a body that is down does not celebrate
  });
});

describe('a fall and a revive', () => {
  it('plays the fall, holds the last frame while down (no action starts), and on a revive plays the rise and returns to the idle', () => {
    const seq = girl();
    const fall = seq.pose('ko', true, false)!;
    expect(fall).toMatchObject({ clip: 'DEAD_00', loop: false });
    expect(fall.speed).toBeCloseTo(Math.min(1.5, 2.4 / BUDGET.fall), 3);
    expect(seq.pose('ko', true, false)).toBeNull(); // not again, frame after frame
    const gave = run(seq, 2.4);
    expect(gave).toHaveLength(1);
    expect(gave[0]!.cmd).toMatchObject({ clip: 'DEAD_01', loop: true });
    expect(seq.open('attack', 0.25)).toBeNull();
    expect(seq.pose('hurt', true, false)).toBeNull();
    expect(run(seq, 10)).toHaveLength(0);
    const rise = seq.pose('idle', false, false)!;
    expect(rise).toMatchObject({ clip: 'DEAD_02', loop: false });
    expect(rise.speed).toBeGreaterThan(1.5); // the long get-up fitted into a fight's pace
    const back = run(seq, 3);
    expect(back.map((g) => g.cmd.clip)).toEqual(['APPEAR_00']);
    expect(back[0]!.cmd.fade).toBe(FADE.base);
    expect(seq.current).toBe('idle');
  });

  it('lets an action interrupt the rise (the player\'s move is the one that matters)', () => {
    const seq = girl();
    seq.pose('ko', true, false);
    run(seq, 2.4);
    seq.pose('idle', false, false);
    expect(seq.current).toBe('ko');
    expect(seq.open('attack', 0.25)!.clip).toBe('ATTACK1_00');
  });

  it('plays Bahamut\'s four-part fall and holds the last part (he has no rise: a revive goes back to the idle)', () => {
    const seq = boss();
    expect(seq.pose('ko', true, false)!.clip).toBe('DEAD_00');
    expect(run(seq, 1.63 / 1.5 + 1.13 / 1.5 + 1.83 / 1.5 + 0.1).map((g) => g.cmd.clip)).toEqual(['DEAD_01', 'DEAD_02', 'DEAD_03']);
    expect(seq.current).toBe('ko');
    expect(seq.pose('idle', false, false)).toMatchObject({ clip: 'APPEAR_00', from: -1 });
  });
});

describe('the low-HP kneel', () => {
  it('kneels in, holds the kneel, and rises when the HP is back', () => {
    const seq = girl();
    expect(seq.pose('idle', false, true)).toMatchObject({ clip: 'WEAK1_00' });
    expect(run(seq, 1.2)[0]!.cmd).toMatchObject({ clip: 'WEAK1_01', loop: true });
    expect(seq.current).toBe('critical');
    expect(run(seq, 5)).toHaveLength(0);
    expect(seq.pose('idle', false, true)).toBeNull(); // nothing changes while it stays low
    expect(seq.pose('idle', false, false)).toMatchObject({ clip: 'WEAK1_02', loop: false });
    expect(run(seq, 1.2).map((g) => g.cmd.clip)).toEqual(['APPEAR_00']);
    expect(seq.current).toBe('idle');
  });

  it('stands for an action and kneels again after it (the low-HP stance is the idle)', () => {
    const seq = girl();
    seq.pose('idle', false, true);
    run(seq, 1.2);
    expect(seq.open('attack', 0.25)!.clip).toBe('ATTACK1_00');
    run(seq, 0.3);
    seq.impact();
    const gave = run(seq, 1);
    expect(gave).toHaveLength(1);
    expect(gave[0]!.cmd).toMatchObject({ clip: 'WEAK1_01', loop: true, from: 0 }); // back to the kneel's hold, not the idle
    expect(seq.current).toBe('critical');
  });

  it('never kneels while down, and a revive at low HP goes to the kneel', () => {
    const seq = girl();
    seq.pose('ko', true, true);
    run(seq, 2.4);
    expect(seq.current).toBe('ko');
    seq.pose('idle', false, true); // revived, still low
    const gave = run(seq, 3);
    expect(gave.map((g) => g.cmd.clip)).toEqual(['WEAK1_01']);
  });
});

describe('the fidget', () => {
  it('plays IDLE2 once between 7 and 13 seconds into the idle, then the idle again; never while kneeling', () => {
    const seq = girl();
    const gave = run(seq, 14);
    expect(gave.map((g) => g.cmd.clip)).toEqual(['IDLE2', 'APPEAR_00']);
    expect(gave[0]!.t).toBeGreaterThanOrEqual(7);
    expect(gave[0]!.t).toBeLessThanOrEqual(13.1);
    expect(gave[0]!.cmd.loop).toBe(false);
    expect(gave[1]!.cmd).toMatchObject({ from: -1, loop: true });
    const kneeling = girl();
    kneeling.pose('idle', false, true);
    expect(run(kneeling, 60).map((g) => g.cmd.clip)).toEqual(['WEAK1_01']); // the kneel's hold, no fidget
  });

  it('is interrupted by anything, and each figure\'s time is its own', () => {
    const seq = girl();
    run(seq, 13.1);
    expect(seq.current).toBe('idle2');
    expect(seq.pose('hurt', false, false)!.clip).toBe('DMG1');
    const first = (seed: string): number => run(girl(seed), 14)[0]!.t;
    expect(first('yuna')).toBe(first('yuna')); // the same figure, the same time
    expect(new Set(['yuna', 'rikku', 'paine', 'bahamut'].map(first)).size).toBeGreaterThan(1);
  });
});

describe('the sequencer\'s edges', () => {
  it('does not start a pose the model has no clips for, and a reset goes back to the idle', () => {
    const idleOnly = new ClipSequencer({ idle: { enter: [], hold: 'APPEAR_00', exit: [] } }, GIRL);
    expect(idleOnly.open('attack', 0.25)).toBeNull();
    expect(idleOnly.pose('hurt', false, false)).toBeNull();
    expect(idleOnly.pose('victory', false, false)).toBeNull();
    const seq = girl();
    seq.pose('victory', false, false);
    seq.reset();
    expect(seq.current).toBe('idle');
    expect(seq.speed).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The rig on three's mixer
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** A scene with one mesh named `body`, and a clip named `name` that moves it to (x, y, 0) over `seconds`. */
function scene(): { root: Group; body: Mesh } {
  const root = new Group();
  const body = new Mesh();
  body.name = 'body';
  root.add(body);
  return { root, body };
}
const clip = (name: string, seconds: number, to: [number, number], from: [number, number] = [0, 0]): AnimationClip =>
  new AnimationClip(name, seconds, [new VectorKeyframeTrack('body.position', [0, seconds], [from[0], from[1], 0, to[0], to[1], 0])]);

/** The girl's clips on the body's position: a hit pushes along x, the fall goes to x 5 and its hold stays there, the rest nod up a little. */
const CLIPS = (): AnimationClip[] =>
  Object.entries(GIRL).map(([name, seconds]) =>
    name === 'DEAD_01' ? clip(name, seconds, [5, 0], [5, 0]) : clip(name, seconds, name.startsWith('DMG') ? [1, 0] : name === 'DEAD_00' ? [5, 0] : [0, 0.1]),
  );

describe('the rig on the mixer', () => {
  it('loops the idle from the start, plays a hit on a rise to hurt and returns to the idle, and names the pose and the clip', () => {
    const { root } = scene();
    const rig = new ClipRig(root, CLIPS(), plansFromNames(Object.keys(GIRL)), 'yuna');
    expect([rig.current, rig.clip]).toEqual(['idle', 'APPEAR_00']);
    rig.update(0.1);
    rig.pose('hurt', false, false);
    expect([rig.current, rig.clip]).toEqual(['hurt', 'DMG1']);
    for (let i = 0; i < 90; i++) rig.update(1 / 60);
    expect([rig.current, rig.clip]).toEqual(['idle', 'APPEAR_00']);
  });

  it('moves the body with the clip: a hit pushes it along x and the idle brings it back', () => {
    const { root, body } = scene();
    const rig = new ClipRig(root, CLIPS(), plansFromNames(Object.keys(GIRL)), 'yuna');
    rig.pose('hurt', false, false);
    let max = 0;
    for (let i = 0; i < 40; i++) {
      rig.update(1 / 60);
      max = Math.max(max, body.position.x);
    }
    expect(max).toBeGreaterThan(0.3);
    for (let i = 0; i < 120; i++) rig.update(1 / 60);
    expect(body.position.x).toBeLessThan(0.05); // the idle's pose again
  });

  it('plays an attack on the beats: the start, the hold, the finish on the blow', () => {
    const { root } = scene();
    const rig = new ClipRig(root, CLIPS(), plansFromNames(Object.keys(GIRL)), 'yuna');
    rig.open('attack', 0.25);
    expect(rig.clip).toBe('ATTACK1_00');
    for (let i = 0; i < 20; i++) rig.update(1 / 60);
    expect(rig.clip).toBe('ATTACK1_01');
    rig.impact();
    expect(rig.clip).toBe('ATTACK1_02');
    rig.open('cast', undefined);
    expect(rig.current).toBe('cast');
    for (let i = 0; i < 60; i++) rig.update(1 / 60);
    expect(rig.clip).toBe('MAGIC2_01'); // the hold
    rig.close();
    expect(rig.clip).toBe('MAGIC2_02');
  });

  it('stills the idle under REDUCE MOTION (the body does not move) but lets a fall run to its pose', () => {
    const { root, body } = scene();
    const rig = new ClipRig(root, CLIPS(), plansFromNames(Object.keys(GIRL)), 'yuna');
    rig.update(0.01, true);
    const rest = body.position.y;
    for (let i = 0; i < 60; i++) rig.update(1 / 60, true);
    expect(body.position.y).toBeCloseTo(rest, 6);
    expect(rig.playsKo).toBe(true);
    rig.pose('ko', true, false);
    for (let i = 0; i < 200; i++) rig.update(1 / 60, true);
    expect(rig.current).toBe('ko');
    expect(body.position.x).toBeGreaterThan(4); // it fell
  });

  it('needs an idle clip: a model with none has no rig, and a map that names a missing idle is refused', () => {
    const { root } = scene();
    expect(() => new ClipRig(root, [clip('DMG1', 1, [1, 0])], plansFromNames(['APPEAR_00', 'DMG1']), 'x')).toThrow('idle');
    expect(() => new ClipRig(root, CLIPS(), {}, 'x')).toThrow('idle');
  });
});
