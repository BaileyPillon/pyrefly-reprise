/**
 * **The models' clips, driven by the battle** (`src/engine/yrp3d/clipAnalysis.ts`, `clipSequencer.ts`, `clips.ts`, `beats.ts`; the hidden 3D Bahamut chapter, FFX-2 only). What it pins, on made-up tracks and clips (the
 * real files' windows were checked offline: Yuna's strike at 2.33 s of 7.33, Rikku's at 0.73 of 3.03, Paine's at 1.23 of 2.23):
 *
 * 1. **Where a clip's action is**: the motion energy of its bone rotations, the strike (the fastest turning after the wind-up), where the motion stops, and the windows they make.
 * 2. **Which clip is which**: by name, one role a clip, `walk` and `run` unused.
 * 3. **The order they play in** (the sequencer): the attack's window sped to put the strike on the blow, the cast, the hit and the victory by pose, who interrupts whom, the fade back to the idle, a body that is down.
 * 4. **On a real mixer**: the idle loops from a phase of its own, a one-shot moves the bones and ends, a frozen rig holds its pose.
 * 5. **The beats**: the shot director tapped without changing a single camera call; the lead is the lunge's apex.
 */
import { AnimationClip, Group, Object3D, Quaternion, QuaternionKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';

import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { BattleMoments } from '../../../src/engine/BattleMoments.ts';
import type { AudioPort } from '../../../src/engine/BattlePresenterPorts.ts';
import type { ActionShot, ImpactShot, ShotDirector } from '../../../src/engine/ShotDirector.ts';
import { ENERGY_STEP, SETTLE, STRIKE_POST, STRIKE_PRE, activeEnd, angleBetween, attackWindow, motionEnergy, quatAt, smooth, strikeTime, wholeWindow, type RotationTrack } from '../../../src/engine/yrp3d/clipAnalysis.ts';
import { ClipSequencer, FADE_IN, FADE_OUT, type Windows } from '../../../src/engine/yrp3d/clipSequencer.ts';
import { ClipRig, roleClips, rotationsOf, windowsOfClips } from '../../../src/engine/yrp3d/clips.ts';
import { LUNGE_MS, tapDirector, type BeatListener } from '../../../src/engine/yrp3d/beats.ts';
import { YRP_SHOT_DIRECTOR } from '../../../src/engine/yrp3d/director.ts';
import { noSleep } from '../helpers/FakeStage.ts';
import { DirectedStage } from '../helpers/shotScript.ts';

// ------------------------------------------------------------------------ made-up tracks

const rotY = (angle: number): [number, number, number, number] => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];

/** A track that stays at rest and turns by `amount` radians about Y between `from` and `to` seconds, then stays there; `end` is the clip's length. */
function turn(from: number, to: number, amount: number, end: number): RotationTrack {
  const keys = [0, from, to, end].filter((t, i, a) => i === 0 || t > a[i - 1]!);
  const angles = keys.map((t) => (t <= from ? 0 : t >= to ? amount : (amount * (t - from)) / (to - from)));
  return { times: keys, values: keys.flatMap((_, i) => rotY(angles[i]!)) };
}

/** Two bursts: a small wind-up at 0.4 s and the strike at 2.0 to 2.2 s, in a 4 s clip. */
function strikeClipTracks(): RotationTrack[] {
  return [
    { times: [0, 0.4, 0.6, 2.0, 2.2, 4], values: [...rotY(0), ...rotY(0), ...rotY(0.6), ...rotY(0.6), ...rotY(2.4), ...rotY(2.4)] },
    { times: [0, 2.0, 2.2, 4], values: [...rotY(0), ...rotY(0), ...rotY(1.2), ...rotY(1.2)] },
  ];
}

describe('where a clip\'s action is', () => {
  it('interpolates a rotation the short way round, holds it before the first and after the last key, and measures angles', () => {
    const track: RotationTrack = { times: [0, 1], values: [...rotY(0), ...rotY(1)] };
    expect(angleBetween(quatAt(track, 0.5), rotY(0.5))).toBeCloseTo(0, 6);
    expect(angleBetween(quatAt(track, -3), rotY(0))).toBeCloseTo(0, 9);
    expect(angleBetween(quatAt(track, 9), rotY(1))).toBeCloseTo(0, 9);
    expect(angleBetween(rotY(0), rotY(0.8))).toBeCloseTo(0.8, 6);
    expect(angleBetween(rotY(0), [0, -Math.sin(0.4), 0, -Math.cos(0.4)])).toBeCloseTo(0.8, 6); // q and -q are the same turn
    expect(quatAt({ times: [], values: [] }, 1)).toEqual([0, 0, 0, 1]);
    const wrap: RotationTrack = { times: [0, 1], values: [...rotY(0), ...[0, -Math.sin(0.2), 0, -Math.cos(0.2)]] }; // the long way would be nearly a full turn
    expect(angleBetween(quatAt(wrap, 0.5), rotY(0.2))).toBeCloseTo(0, 6); // -q is the same turn as q: the middle of 0 and 0.4 radians
  });

  it('measures how fast the bones turn: nothing while they rest, the turning rate while they move', () => {
    const e = motionEnergy([turn(1, 2, 3, 4)], 4);
    expect(e).toHaveLength(Math.floor(4 / ENERGY_STEP) + 1);
    expect(e[0]).toBe(0);
    expect(e[Math.round(0.5 / ENERGY_STEP)]).toBe(0);
    expect(e[Math.round(1.5 / ENERGY_STEP)]).toBeCloseTo(3, 4); // 3 radians over 1 second
    expect(e[Math.round(3 / ENERGY_STEP)]).toBe(0);
    expect(motionEnergy([], 2).every((v) => v === 0)).toBe(true);
    expect(motionEnergy([turn(0.5, 1, 1, 2), turn(0.5, 1, 1, 2)], 2)[Math.round(0.75 / ENERGY_STEP)]).toBeCloseTo(4, 4); // summed over bones
  });

  it('finds the strike after the wind-up (the fastest turning, after the first 0.3 s), and where the motion stops', () => {
    const e = motionEnergy(strikeClipTracks(), 4);
    expect(strikeTime(e)).toBeGreaterThan(1.95);
    expect(strikeTime(e)).toBeLessThan(2.25);
    expect(activeEnd(e)).toBeGreaterThan(2.1);
    expect(activeEnd(e)).toBeLessThan(2.45);
    const early = motionEnergy([turn(0.0, 0.2, 5, 4), turn(2, 2.2, 0.5, 4)], 4); // the biggest burst is in the first 0.3 s: not the strike
    expect(strikeTime(early)).toBeGreaterThan(1.9);
    expect(strikeTime(early, 0)).toBeLessThan(0.25);
    const still = motionEnergy([{ times: [0, 3], values: [...rotY(0), ...rotY(0)] }], 3);
    expect([strikeTime(still), activeEnd(still)]).toEqual([0, 0]);
    expect(smooth(new Float64Array([0, 0, 9, 0, 0]), ENERGY_STEP * 2)[1]).toBeCloseTo(3, 9); // a box of three samples
  });

  it('cuts an attack to the second around its strike (before it, STRIKE_PRE, after it, STRIKE_POST) inside the clip, and a one-shot to where its motion stops', () => {
    const e = motionEnergy(strikeClipTracks(), 4);
    const shot = strikeTime(e);
    const w = attackWindow(e, 4);
    expect(w.shot).toBeCloseTo(shot, 9);
    expect(w.start).toBeCloseTo(shot - STRIKE_PRE, 9);
    expect(w.end).toBeCloseTo(shot + STRIKE_POST, 9);
    // a strike near the clip's start cannot start before 0, and one near its end cannot run past it
    const earlyStrike = attackWindow(motionEnergy([turn(0.28, 0.4, 3, 3)], 3), 3);
    expect(earlyStrike.start).toBeGreaterThanOrEqual(0);
    expect(earlyStrike.start).toBeLessThan(0.1);
    expect(earlyStrike.shot!).toBeGreaterThanOrEqual(earlyStrike.start);
    expect(attackWindow(motionEnergy([turn(2.7, 2.95, 3, 3)], 3), 3).end).toBeLessThanOrEqual(3);
    const whole = wholeWindow(e, 4);
    expect([whole.start, whole.end]).toEqual([0, activeEnd(e) + SETTLE]);
    expect(wholeWindow(motionEnergy([], 5), 5).end).toBe(5); // no motion: the whole clip
    expect(wholeWindow(motionEnergy([turn(0.5, 1, 1, 2)], 2), 2).end).toBeLessThanOrEqual(2);
  });
});

// ------------------------------------------------------------------------ which clip is which

const clip = (name: string, duration = 1, tracks: QuaternionKeyframeTrack[] = []): AnimationClip => new AnimationClip(name, duration, tracks);
const qTrack = (node: string, t: RotationTrack): QuaternionKeyframeTrack => new QuaternionKeyframeTrack(`${node}.quaternion`, Array.from(t.times), Array.from(t.values));

describe('which clip is which', () => {
  it('matches by name, case-blind, one role a clip; walk and run are not used', () => {
    const clips = ['Run', 'Walk', 'Hit_React', 'Victory_Dance', 'Idle_Loop', 'Spell_Cast', 'Attack_Shoot'].map((n) => clip(n));
    const roles = roleClips(clips);
    expect([...roles.entries()].map(([r, c]) => [r, c.name])).toEqual([['idle', 'Idle_Loop'], ['attack', 'Attack_Shoot'], ['hit', 'Hit_React'], ['cast', 'Spell_Cast'], ['victory', 'Victory_Dance']]);
    expect([...roleClips([clip('walk'), clip('run')]).keys()]).toEqual([]);
    expect([...roleClips([clip('idle'), clip('attack')]).keys()]).toEqual(['idle', 'attack']); // no hit, cast or victory: those roles are never played
    expect(roleClips([clip('Attack_Idle_Cast')]).get('idle')!.name).toBe('Attack_Idle_Cast'); // a clip goes to the first role it names, and to one only
    expect(roleClips([clip('Attack_Idle_Cast')]).size).toBe(1);
  });

  it('reads the bone rotations of a clip and the windows of its roles from them', () => {
    const tracks = strikeClipTracks().map((t, i) => qTrack(i ? 'Spine' : 'Hips', t));
    const attack = clip('attack', 4, tracks);
    const hit = clip('hit', 4, tracks);
    const idle = clip('idle', 4, tracks);
    expect(rotationsOf(clip('x', 1, [new QuaternionKeyframeTrack('Hips.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1])]))).toHaveLength(1);
    const windows = windowsOfClips(roleClips([idle, attack, hit]));
    expect(Object.keys(windows).sort()).toEqual(['attack', 'hit']); // the idle has no window: it loops
    expect(windows.attack!.shot).toBeGreaterThan(1.9);
    expect(windows.hit!.start).toBe(0);
    expect(windows.hit!.end).toBeGreaterThan(2.3);
  });
});

// ------------------------------------------------------------------------ the order they play in

const WINDOWS: Windows = {
  attack: { start: 2.0, end: 3.1, shot: 2.35 },
  hit: { start: 0, end: 1.6 },
  cast: { start: 0, end: 2.2 },
  victory: { start: 0, end: 7.0 },
};

describe('the sequencer', () => {
  it('plays an attack\'s window from STRIKE_PRE before the strike, at the speed that puts the strike on the blow, then at its own speed, then fades back to the idle', () => {
    const seq = new ClipSequencer(WINDOWS);
    expect(seq.current).toBe('idle');
    const cmd = seq.open('attack', 0.25)!;
    expect(cmd).toEqual({ role: 'attack', from: 2.0, speed: (2.35 - 2.0) / 0.25, fade: FADE_IN, loop: false });
    expect(seq.current).toBe('attack');
    expect(seq.speed).toBeCloseTo(1.4, 9);
    expect(seq.update(0.1)).toBeNull();
    expect(seq.at).toBeCloseTo(2.0 + 0.14, 9);
    seq.impact(); // the beat says the blow landed
    expect(seq.speed).toBe(1);
    // the rest of the window at speed 1, ending at 3.1: about 0.96 s more
    let ended: ReturnType<ClipSequencer['update']> = null;
    let t = 0;
    while (!ended && t < 5) {
      ended = seq.update(0.05);
      t += 0.05;
    }
    expect(t).toBeGreaterThan(0.9); // the 0.96 s left of the window at its own speed, in steps of 0.05
    expect(t).toBeLessThan(1.1);
    expect(ended).toEqual({ role: 'idle', from: -1, speed: 1, fade: FADE_OUT, loop: true });
    expect([seq.current, seq.speed]).toEqual(['idle', 1]);
    expect(seq.update(1)).toBeNull();
  });

  it('keeps the strike\'s speed between 0.6 and 2.5 and uses the pace rate when no blow is announced', () => {
    expect(new ClipSequencer(WINDOWS).open('attack', 0.01)!.speed).toBe(2.5);
    expect(new ClipSequencer(WINDOWS).open('attack', 5)!.speed).toBe(0.6);
    expect(new ClipSequencer(WINDOWS).open('attack', undefined, 0.83)!.speed).toBe(0.83);
    expect(new ClipSequencer(WINDOWS).open('attack', 0)!.speed).toBe(1);
  });

  it('slows back to 1 by itself when the strike passes and no beat said so', () => {
    const seq = new ClipSequencer(WINDOWS);
    seq.open('attack', 0.25);
    for (let i = 0; i < 30; i++) seq.update(0.02);
    expect(seq.at).toBeGreaterThan(2.35);
    expect(seq.speed).toBe(1);
  });

  it('a cast plays whole at the pace rate; items, defends and every unknown kind play nothing', () => {
    const seq = new ClipSequencer(WINDOWS);
    expect(seq.open('item', 0.2)).toBeNull();
    expect(seq.open('defend', undefined)).toBeNull();
    expect(seq.open('cast', undefined, 0.8)).toEqual({ role: 'cast', from: 0, speed: 0.8, fade: FADE_IN, loop: false });
    for (let i = 0; i < 200; i++) if (seq.update(0.02)) break;
    expect(seq.current).toBe('idle');
  });

  it('starts a hit and a victory on a rise to the pose, once, and an attack or cast no beat announced', () => {
    const seq = new ClipSequencer(WINDOWS);
    expect(seq.pose('ready', false)).toBeNull();
    expect(seq.pose('hurt', false)).toMatchObject({ role: 'hit', from: 0, loop: false });
    expect(seq.pose('hurt', false)).toBeNull(); // still hurt: not a restart
    expect(seq.current).toBe('hit');
    const b = new ClipSequencer(WINDOWS);
    expect(b.pose('attack', false)).toMatchObject({ role: 'attack', from: 2.0, speed: 1 });
    expect(b.pose('attack', false)).toBeNull();
    const c = new ClipSequencer(WINDOWS);
    expect(c.pose('cast', false)).toMatchObject({ role: 'cast' });
    const d = new ClipSequencer(WINDOWS);
    expect(d.pose('victory', false, 0.9)).toMatchObject({ role: 'victory', speed: 0.9 });
  });

  it('a beat that started the attack is not restarted by the attack pose that follows it', () => {
    const seq = new ClipSequencer(WINDOWS);
    seq.pose('ready', false);
    expect(seq.open('attack', 0.25)).not.toBeNull();
    expect(seq.pose('attack', false)).toBeNull();
    expect(seq.at).toBe(2.0);
  });

  it('says who interrupts whom: an action takes over a hit and the other action, a hit does not interrupt an action, and nothing interrupts a victory', () => {
    const hitThenAttack = new ClipSequencer(WINDOWS);
    hitThenAttack.pose('hurt', false);
    expect(hitThenAttack.open('attack', 0.25)).not.toBeNull();
    expect(hitThenAttack.current).toBe('attack');
    const attackThenHit = new ClipSequencer(WINDOWS);
    attackThenHit.open('attack', 0.25);
    expect(attackThenHit.pose('hurt', false)).toBeNull();
    expect(attackThenHit.current).toBe('attack');
    const castThenAttack = new ClipSequencer(WINDOWS);
    castThenAttack.open('cast', undefined);
    expect(castThenAttack.open('attack', 0.25)).not.toBeNull();
    const won = new ClipSequencer(WINDOWS);
    won.pose('victory', false);
    expect(won.open('attack', 0.25)).toBeNull();
    expect(won.pose('hurt', false)).toBeNull();
    expect(won.current).toBe('victory');
    const interrupting = new ClipSequencer(WINDOWS);
    interrupting.open('attack', 0.25);
    expect(interrupting.pose('victory', false)).not.toBeNull(); // a victory takes over anything
  });

  it('never plays a clip the model does not have', () => {
    const seq = new ClipSequencer({ attack: WINDOWS.attack! });
    expect([seq.has('attack'), seq.has('hit'), seq.has('victory')]).toEqual([true, false, false]);
    expect(seq.pose('hurt', false)).toBeNull();
    expect(seq.open('cast', undefined)).toBeNull();
    expect(new ClipSequencer({}).open('attack', 0.25)).toBeNull();
  });

  it('a body that is down stops the clips and starts none; a revive stands it up on the idle', () => {
    const seq = new ClipSequencer(WINDOWS);
    seq.open('attack', 0.25);
    expect(seq.pose('ko', true)).toBeNull();
    expect(seq.current).toBe('idle');
    expect(seq.open('attack', 0.25)).toBeNull();
    expect(seq.pose('hurt', true)).toBeNull();
    expect(seq.pose('idle', false)).toEqual({ role: 'idle', from: -1, speed: 1, fade: 0.3, loop: true });
    expect(seq.open('attack', 0.25)).not.toBeNull();
    seq.reset();
    expect(seq.current).toBe('idle');
  });
});

// ------------------------------------------------------------------------ on a real mixer

/** A model's scene with a Hips bone and clips that turn it: an idle that sways, an attack, a hit. */
function riggedScene(): { root: Group; hips: Object3D; clips: AnimationClip[] } {
  const root = new Group();
  const hips = new Object3D();
  hips.name = 'Hips';
  root.add(hips);
  const sway = qTrack('Hips', { times: [0, 0.5, 1], values: [...rotY(0), ...rotY(0.2), ...rotY(0)] });
  const strike = qTrack('Hips', { times: [0, 2, 2.2, 3], values: [...rotY(0), ...rotY(0), ...rotY(2), ...rotY(2)] });
  const flinch = qTrack('Hips', { times: [0, 0.4, 0.8], values: [...rotY(0), ...rotY(-1), ...rotY(0)] });
  return { root, hips, clips: [new AnimationClip('idle', 1, [sway]), new AnimationClip('attack', 3, [strike]), new AnimationClip('hit', 0.8, [flinch])] };
}

const yawOf = (o: Object3D): number => 2 * Math.asin(Math.max(-1, Math.min(1, o.quaternion.y))) * Math.sign(o.quaternion.w || 1);

describe('the rig on a real mixer', () => {
  it('needs an idle clip, and starts every model\'s idle at a phase of its own', () => {
    const { root, clips } = riggedScene();
    expect(() => new ClipRig(root, roleClips([clips[1]!]), 'yuna')).toThrow(/idle/);
    const phases = ['yuna', 'rikku', 'paine'].map((id) => {
      const s = riggedScene();
      const rig = new ClipRig(s.root, roleClips(s.clips), id);
      rig.update(0.0001);
      return yawOf(s.hips);
    });
    expect(new Set(phases.map((p) => p.toFixed(3))).size).toBe(3);
    expect(rig(roleClips(clips)).roles).toEqual(['idle', 'attack', 'hit']);
    function rig(map: ReturnType<typeof roleClips>): ClipRig {
      const s = riggedScene();
      return new ClipRig(s.root, map, 'yuna');
    }
  });

  it('plays the attack\'s window over the idle, moves the bones, and fades back to the idle when the window ends', () => {
    const { root, hips, clips } = riggedScene();
    const rig = new ClipRig(root, roleClips(clips), 'yuna');
    for (let i = 0; i < 10; i++) rig.update(0.05); // idle sway only: well inside +-0.2 rad
    expect(Math.abs(yawOf(hips))).toBeLessThan(0.25);
    expect(rig.current).toBe('idle');
    const window = rig.sequencer;
    expect(window.has('attack')).toBe(true);
    rig.open('attack', 0.3);
    expect(rig.current).toBe('attack');
    let peak = 0;
    for (let i = 0; i < 40; i++) {
      rig.update(0.05);
      peak = Math.max(peak, Math.abs(yawOf(hips)));
    }
    expect(peak).toBeGreaterThan(1.2); // the strike turned the hips well past anything the idle does
    expect(rig.current).toBe('idle'); // 2 s of play at least covers the window; back on the idle
    for (let i = 0; i < 20; i++) rig.update(0.05);
    expect(Math.abs(yawOf(hips))).toBeLessThan(0.25); // the attack faded out
  });

  it('starts a hit on the pose and a revive on the idle; a frozen rig holds its pose and a down body stops', () => {
    const { root, hips, clips } = riggedScene();
    const rig = new ClipRig(root, roleClips(clips), 'rikku');
    rig.pose('ready', false);
    rig.pose('hurt', false);
    expect(rig.current).toBe('hit');
    for (let i = 0; i < 6; i++) rig.update(0.05);
    expect(yawOf(hips)).toBeLessThan(-0.3); // the flinch turned the other way
    const held = hips.quaternion.clone();
    for (let i = 0; i < 6; i++) rig.update(0.05, true);
    expect(hips.quaternion.angleTo(held)).toBeLessThan(1e-3); // frozen: nothing moved (a crossfade's blend noise aside)
    rig.pose('ko', true);
    expect(rig.current).toBe('idle');
    for (let i = 0; i < 4; i++) rig.update(0.05, true);
    rig.pose('idle', false);
    expect(rig.current).toBe('idle');
    rig.dispose();
  });

  it('runs a one-shot at the speed it is told: a hit at 2x is over in half the time', () => {
    const times = [1, 2].map((speed) => {
      const s = riggedScene();
      const rig = new ClipRig(s.root, roleClips(s.clips), 'paine');
      rig.pose('hurt', false, speed);
      let t = 0;
      while (rig.current === 'hit' && t < 5) {
        rig.update(0.02);
        t += 0.02;
      }
      return t;
    });
    expect(times[0]! / times[1]!).toBeGreaterThan(1.7);
    expect(times[0]! / times[1]!).toBeLessThan(2.3);
  });
});

// ------------------------------------------------------------------------ the beats

const subject = (id: string) => ({ id, side: id === 'bahamut' ? ('enemy' as const) : ('party' as const) });
const baseCtx = (over: object = {}) => ({ camera: {} as never, speed: 'normal' as const, skipping: false, ms: (n: number) => n * 2, ...over });
const actionCtx = (actor: string, kind: string): ActionShot => ({ ...baseCtx(), actor: subject(actor), targets: [subject('bahamut')], action: { kind } }) as ActionShot;

describe('tapping the shot director', () => {
  it('tells the listener an action opened, with the seconds until the blow lands (the lunge\'s apex at the live speed), and never changes the answer', async () => {
    const told: Array<[string, string, number]> = [];
    const listener: BeatListener = { open: (id, kind, lead) => told.push([id, kind, lead]) };
    const tapped = tapDirector(undefined, listener);
    expect(await tapped.actionOpen!(actionCtx('yuna', 'attack'))).toBe(false); // no inner director: the presenter's own camera
    expect(told).toEqual([['yuna', 'attack', (2 * LUNGE_MS * ATTACK_IMPACT) / 1000]]);
    const direct = tapDirector({ actionOpen: () => true }, listener);
    expect(await direct.actionOpen!(actionCtx('rikku', 'cast'))).toBe(true);
    expect(told).toHaveLength(2);
  });

  it('waits for a promised answer before it tells the listener, so a clip starts with the lunge and not with a camera still on its way', async () => {
    const told: string[] = [];
    let arrive: (v: boolean) => void = () => undefined;
    const tapped = tapDirector({ actionOpen: () => new Promise<boolean>((r) => (arrive = r)) }, { open: (id) => told.push(id) });
    const answer = tapped.actionOpen!(actionCtx('bahamut', 'cast')) as Promise<boolean>;
    await Promise.resolve();
    expect(told).toEqual([]);
    arrive(true);
    expect(await answer).toBe(true);
    await Promise.resolve();
    expect(told).toEqual(['bahamut']);
  });

  it('tells the listener of a blow and of the close, and a listener that throws or a director that throws costs only its own report', async () => {
    const told: string[] = [];
    const tapped = tapDirector(undefined, { impact: (id) => told.push(`impact:${id}`), close: (id) => told.push(`close:${id}`), open: () => { throw new Error('boom'); } });
    expect(tapped.impact!({ ...actionCtx('yuna', 'attack'), target: subject('bahamut'), hitIndex: 0, heavy: false } as unknown as ImpactShot)).toBe(false);
    expect(await tapped.actionClose!({ ...baseCtx(), actor: subject('rikku') })).toBe(false);
    expect(await tapped.actionOpen!(actionCtx('yuna', 'attack'))).toBe(false); // the listener threw: the beat went on
    expect(told).toEqual(['impact:yuna', 'close:rikku']);
    const throwing = tapDirector({ actionOpen: () => { throw new Error('director'); } }, { open: (id) => told.push(`open:${id}`) });
    expect(() => throwing.actionOpen!(actionCtx('paine', 'attack'))).toThrow('director');
    expect(told).toContain('open:paine'); // told anyway
  });

  it('handles every beat the presenter asks (ten), answering "not taken" where the inner director has no handler', async () => {
    const tapped = tapDirector(YRP_SHOT_DIRECTOR, {});
    expect(Object.keys(tapped).sort()).toEqual(['actionClose', 'actionOpen', 'battleStart', 'formChange', 'impact', 'overdriveEnd', 'overdriveStart', 'telegraph', 'turnStart', 'victory']);
    expect(await (tapped.telegraph as (c: object) => unknown)(baseCtx())).toBe(false);
  });

  it('changes not one camera call BattleMoments makes: the tapped director plays the calls the plain one plays, and Mega Flare still takes the overdrive rig', async () => {
    const play = async (director: ShotDirector, actor: string, pose: string, ability: string): Promise<string[]> => {
      const stage = new DirectedStage(['yuna', 'rikku', 'paine'], ['bahamut']);
      stage.shotDirector = director;
      const audio: AudioPort = { playSfx: () => undefined, playMusic: () => undefined, stopMusic: () => undefined };
      const moments = new BattleMoments({ stage, audio, sleep: noSleep, speed: () => 'normal' });
      await moments.actionOpen(actor, pose, actor === 'bahamut' ? ['yuna', 'rikku', 'paine'] : ['bahamut'], { abilityId: ability, commandKind: 'ability' });
      await moments.impact(actor === 'bahamut' ? 'yuna' : 'bahamut', { hitIndex: 0, heavy: true });
      await moments.actionClose();
      return stage.calls;
    };
    const told: string[] = [];
    const tapped = tapDirector(YRP_SHOT_DIRECTOR, { open: (id, kind) => told.push(`${id}:${kind}`), impact: (id) => told.push(`impact:${id}`), close: (id) => told.push(`close:${id}`) });
    for (const [actor, pose, ability] of [['yuna', 'attack', 'attack'], ['bahamut', 'cast', 'x2-bahamut-mega-flare'], ['bahamut', 'attack', 'x2-bahamut-attack'], ['rikku', 'cast', 'x2-dark-knight-darkness']] as const) {
      expect(await play(tapped, actor, pose, ability), `${actor} ${ability}`).toEqual(await play(YRP_SHOT_DIRECTOR, actor, pose, ability));
    }
    expect(told.filter((t) => t.includes(':attack') || t.includes(':cast'))).toEqual(['yuna:attack', 'bahamut:cast', 'bahamut:attack', 'rikku:cast']); // each opening was told, in order
    expect(told).toContain('impact:yuna');
    expect(told).toContain('close:bahamut');
  });
});

void Quaternion;
