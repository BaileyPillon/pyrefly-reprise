/**
 * The lake's clip maps and the monsters' rig (`src/engine/lake3d/clipMap.ts`, `monsterRig.ts`; FFX only): the party's plan table from the kit's names, the monsters' action rows, and the rig on synthetic clips (no model).
 */
import { AnimationClip, Bone, Group, Object3D, QuaternionKeyframeTrack } from 'three';
import { describe, expect, it } from 'vitest';
import { WENDIGO_ROWS as WENDIGO_DATA_ROWS } from '../../../src/data/ffx/wendigo-ids.ts';
import { WENDIGO_ROWS, monsterRowFor, partyPlans, stanceChange } from '../../../src/engine/lake3d/clipMap.ts';
import { CAST_LEAD, MonsterRig, SPEED_MAX, strikeOf } from '../../../src/engine/lake3d/monsterRig.ts';

const KIT = ['meshy_walk', 'meshy_run', 'idle1', 'idle2', 'stand', 'walk', 'run', 'esc', 'weak1_00', 'weak1_01', 'weak1_02', 'guard_00', 'dead_00', 'dead_01', 'dead_02', 'attack1_00', 'attack1_01', 'attack1_02', 'attack1_03', 'attack2', 'magic2_00', 'magic2_01', 'magic2_02', 'item_00', 'item_01', 'item_02_1', 'win_00', 'win_01', 'dmg1'];

describe('the party\'s plans', () => {
  it('map the real FFX kit\'s names onto the sequencer\'s poses', () => {
    const p = partyPlans(KIT);
    expect(p.idle).toEqual({ enter: [], hold: 'idle1', exit: [] });
    expect(p.idle2?.enter).toEqual(['idle2']);
    expect(p.hurt?.enter).toEqual(['dmg1']);
    expect(p.critical).toEqual({ enter: ['weak1_00'], hold: 'weak1_01', exit: ['weak1_02'] });
    expect(p.ko).toEqual({ enter: ['dead_00'], hold: 'dead_01', exit: ['dead_02'] });
    expect(p.cast).toEqual({ enter: ['magic2_00'], hold: 'magic2_01', exit: ['magic2_02'] });
    expect(p.item).toEqual({ enter: ['item_00'], hold: 'item_01', exit: ['item_02_1'] });
    expect(p.victory).toEqual({ enter: ['win_00'], hold: 'win_01', exit: [] });
  });

  it('reads four attack parts as the run-in and strike, then the return (the game\'s combo)', () => {
    expect(partyPlans(KIT).attack).toEqual({ enter: ['attack1_00', 'attack1_01'], hold: null, exit: ['attack1_02', 'attack1_03'] });
  });

  it('reads three attack parts (Lulu\'s) as a start, a hold and a finish', () => {
    const lulu = KIT.filter((n) => n !== 'attack1_03');
    expect(partyPlans(lulu).attack).toEqual({ enter: ['attack1_00'], hold: 'attack1_01', exit: ['attack1_02'] });
  });

  it('leaves out a pose whose clips the file lacks, and everything when there is no idle', () => {
    const noItem = KIT.filter((n) => !n.startsWith('item'));
    expect(partyPlans(noItem).item).toBeUndefined();
    expect(partyPlans(noItem).cast).toBeDefined();
    expect(partyPlans(KIT.filter((n) => n !== 'idle1'))).toEqual({});
  });
});

describe('the monsters\' rows', () => {
  it('copies the Wendigo\'s ability ids the data file names', () => {
    expect(WENDIGO_ROWS.punch).toBe(WENDIGO_DATA_ROWS.punch);
    expect(WENDIGO_ROWS.haymaker).toBe(WENDIGO_DATA_ROWS.haymaker);
    expect(WENDIGO_ROWS.counterPunch).toBe(WENDIGO_DATA_ROWS.counterPunch);
    expect(WENDIGO_ROWS.raiseArms).toBe(WENDIGO_DATA_ROWS.raiseArms);
    expect(WENDIGO_ROWS.lowerArms).toBe(WENDIGO_DATA_ROWS.lowerArms);
  });

  it('plays the Punch, the plain Attack and the Counter Punch as the swing and the Double Punch as the combo', () => {
    expect(monsterRowFor('wendigo', 'wendigo-punch', 'attack')).toEqual({ clip: 'attack', kind: 'blow' });
    expect(monsterRowFor('wendigo', 'attack', 'attack')).toEqual({ clip: 'attack', kind: 'blow' });
    expect(monsterRowFor('wendigo', 'wendigo-counter-punch', 'attack')).toEqual({ clip: 'attack', kind: 'blow' });
    expect(monsterRowFor('wendigo', 'wendigo-haymaker', 'attack')).toEqual({ clip: 'combo', kind: 'blow' });
  });

  it('gives the stance its own state, not a one-shot', () => {
    expect(monsterRowFor('wendigo', 'wendigo-raise-arms', 'cast')).toBeNull();
    expect(stanceChange('wendigo', 'wendigo-raise-arms')).toBe(true);
    expect(stanceChange('wendigo', 'wendigo-lower-arms')).toBe(false);
    expect(stanceChange('wendigo', 'wendigo-punch')).toBeNull();
    expect(stanceChange('lake-guardian-a', 'wendigo-raise-arms')).toBeNull();
  });

  it('plays a Guardian\'s blow as the swing and every spell, potion and eye drop as the cast', () => {
    expect(monsterRowFor('lake-guardian-a', undefined, 'attack')).toEqual({ clip: 'attack', kind: 'blow' });
    for (const id of ['lake-berserk', 'blizzara', 'thundara', 'lake-auto-potion', 'lake-eye-drops', 'protect', 'shell']) expect(monsterRowFor('lake-guardian-b', id, 'cast'), id).toEqual({ clip: 'cast', kind: 'cast' });
    expect(monsterRowFor('lake-guardian-a', undefined, 'defend')).toBeNull();
  });
});

/** A clip of `seconds` with one rotation track whose bone turns fastest at `peak` seconds (a burst of quick turning there). */
function burstClip(name: string, seconds: number, peak: number): AnimationClip {
  const times: number[] = [];
  const values: number[] = [];
  for (let t = 0; t <= seconds + 1e-9; t += 1 / 30) {
    times.push(t);
    const a = Math.sin(((t - peak) * Math.PI) / 0.3) * Math.exp(-Math.pow((t - peak) / 0.12, 2)) * 1.4 + t * 0.2; // a sharp swing about `peak` over a slow drift
    values.push(0, Math.sin(a / 2), 0, Math.cos(a / 2));
  }
  return new AnimationClip(name, seconds, [new QuaternionKeyframeTrack('Hips.quaternion', times, values)]);
}

function rigRoot(): Object3D {
  const g = new Group();
  const bone = new Bone();
  bone.name = 'Hips';
  g.add(bone);
  return g;
}

describe('strikeOf', () => {
  it('finds the swing\'s peak after the wind-up', () => {
    expect(strikeOf(burstClip('attack', 3.5, 2.2))).toBeGreaterThan(1.9);
    expect(strikeOf(burstClip('attack', 3.5, 2.2))).toBeLessThan(2.5);
  });
  it('falls back to 40 percent of the length for a clip with no rotation tracks', () => {
    expect(strikeOf(new AnimationClip('x', 2, []))).toBeCloseTo(0.8, 6);
  });
});

describe('MonsterRig', () => {
  const clips = (): AnimationClip[] => ['idle', 'hurt', 'ko', 'cast', 'arms_up', 'stance_block1', 'stance_block2'].map((n) => burstClip(n, 1.5, 0.8)).concat([burstClip('attack', 3.5, 2.2), burstClip('combo', 2.5, 1.5)]);

  it('refuses a file with no idle', () => {
    expect(() => new MonsterRig(rigRoot(), [burstClip('attack', 1, 0.5)], 'wendigo')).toThrow(/idle/);
  });

  it('stands in its idle, and a blow\'s wind-up is what the lead leaves (a long clip needs the director\'s hold)', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo');
    expect(rig.clip).toBe('idle');
    expect(rig.playsKo).toBe(true);
    const wait = rig.windup('wendigo-punch', 'attack', 0.26);
    expect(wait).toBeGreaterThan(0.3);
    expect(wait).toBeCloseTo(rig.strikeAt('attack') / SPEED_MAX - 0.3, 6);
    expect(rig.windup(undefined, 'cast', 0.26)).toBe(0); // a cast has no blow to wait for
    expect(rig.windup('lake-berserk', 'cast', 0.26)).toBe(0);
  });

  it('starts an action so its strike lands on the lead, and settles back to the idle when the clip ends', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo');
    rig.open('wendigo-punch', 'attack', 1.5);
    expect(rig.clip).toBe('attack');
    expect(rig.acting).toBe(true);
    for (let i = 0; i < 200; i++) rig.update(0.05);
    expect(rig.clip).toBe('idle');
    expect(rig.acting).toBe(false);
  });

  it('plays the double punch as the combo', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo');
    rig.open('wendigo-haymaker', 'attack', 1);
    expect(rig.clip).toBe('combo');
  });

  it('raises the arms through arms_up into the held block, keeps it through a counter punch, and lowers them through the second block into the idle', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo');
    rig.setStance(true);
    expect(rig.clip).toBe('arms_up');
    for (let i = 0; i < 80; i++) rig.update(0.05);
    expect(rig.clip).toBe('stance_block1');
    expect(rig.armsUp).toBe(true);
    rig.open('wendigo-counter-punch', 'attack', 1);
    expect(rig.clip).toBe('attack');
    for (let i = 0; i < 100; i++) rig.update(0.05);
    expect(rig.clip).toBe('stance_block1');
    rig.setStance(false);
    expect(rig.clip).toBe('stance_block2');
    for (let i = 0; i < 80; i++) rig.update(0.05);
    expect(rig.clip).toBe('idle');
    expect(rig.armsUp).toBe(false);
  });

  it('plays a hit over the idle and never over an action', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo');
    rig.notePose('hurt', false);
    expect(rig.clip).toBe('hurt');
    for (let i = 0; i < 60; i++) rig.update(0.05);
    expect(rig.clip).toBe('idle');
    rig.notePose('idle', false);
    rig.open('wendigo-punch', 'attack', 1);
    rig.notePose('hurt', false);
    expect(rig.clip).toBe('attack');
  });

  it('falls and holds the last frame, drops the stance, and gets up on a revive', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo');
    rig.setStance(true);
    rig.notePose('idle', true);
    expect(rig.clip).toBe('ko');
    expect(rig.armsUp).toBe(false);
    for (let i = 0; i < 100; i++) rig.update(0.05);
    expect(rig.clip).toBe('ko');
    rig.notePose('idle', false);
    expect(rig.clip).toBe('idle');
  });

  it('ignores an action once down, and gives a cast its own lead', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'lake-guardian-a');
    rig.open(undefined, 'cast', 0.2);
    expect(rig.clip).toBe('cast');
    expect(CAST_LEAD).toBeGreaterThan(0.5);
    rig.notePose('idle', true);
    rig.open(undefined, 'attack', 0.2);
    expect(rig.clip).toBe('ko');
  });
});
