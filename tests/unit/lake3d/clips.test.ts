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
    for (const id of ['lake-berserk', 'blizzara', 'thundara', 'protect', 'shell']) expect(monsterRowFor('lake-guardian-b', id, 'cast'), id).toEqual({ clip: 'cast', kind: 'cast' });
    for (const id of ['lake-auto-potion', 'lake-eye-drops']) expect(monsterRowFor('lake-guardian-b', id, 'cast'), id).toEqual({ clip: 'item', kind: 'cast', alt: 'cast' }); // the game's item motion (the command row's caster animation 2)
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


describe('the game\'s own strikes (the finishing lane, 2026-11-09)', () => {
  const clips = (): AnimationClip[] => ['idle', 'hurt', 'ko', 'cast', 'item'].map((n) => burstClip(n, 1.5, 0.8)).concat([burstClip('attack', 3.5, 2.2), burstClip('combo', 2.5, 1.5)]);

  it('takes the data table\'s mark over the reading of the motion, and reads the motion for a clip with no mark', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo', { attack: 0.6, combo: 1.6333 });
    expect(rig.strikeAt('attack')).toBe(0.6);
    expect(rig.strikeAt('combo')).toBe(1.6333);
    expect(rig.strikeAt('cast')).toBeCloseTo(strikeOf(burstClip('cast', 1.5, 0.8)), 6); // no mark: read from the motion
    expect(new MonsterRig(rigRoot(), clips(), 'wendigo').strikeAt('attack')).toBeGreaterThan(1.9); // no table: the old reading
  });

  it('ignores a mark that is not a positive number', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo', { attack: 0, combo: Number.NaN });
    expect(rig.strikeAt('attack')).toBeGreaterThan(1.9);
    expect(rig.strikeAt('combo')).toBeGreaterThan(1.2);
  });

  it('starts a clip so that its marked strike lands on the lead', () => {
    const rig = new MonsterRig(rigRoot(), clips(), 'wendigo', { attack: 0.6 });
    expect(rig.windup('wendigo-punch', 'attack', 0.26)).toBe(0); // the mark is early: the lunge leaves enough
    rig.open('wendigo-punch', 'attack', 0.5);
    expect(rig.clip).toBe('attack');
  });
});

describe('a potion\'s clip', () => {
  const body = (names: string[]): AnimationClip[] => names.map((n) => burstClip(n, 1.5, 0.8));

  it('is the item row with the cast as its alternative', () => {
    expect(monsterRowFor('lake-guardian-a', 'lake-auto-potion', 'item')).toEqual({ clip: 'item', kind: 'cast', alt: 'cast' });
    expect(monsterRowFor('ifrit', 'ifrit-attack', 'attack')).toEqual({ clip: 'attack', kind: 'blow' });
    expect(monsterRowFor('valefor', 'energy-ray', undefined)).toEqual({ clip: 'cast', kind: 'cast' }); // an Overdrive plays the cast
  });

  it('plays the item clip when the file has one, the cast when it has not, and nothing when it has neither', () => {
    const withItem = new MonsterRig(rigRoot(), body(['idle', 'cast', 'item']), 'lake-guardian-a');
    withItem.open('lake-auto-potion', 'item', 0.5);
    expect(withItem.clip).toBe('item');
    const castOnly = new MonsterRig(rigRoot(), body(['idle', 'cast']), 'lake-guardian-a');
    castOnly.open('lake-auto-potion', 'item', 0.5);
    expect(castOnly.clip).toBe('cast');
    const neither = new MonsterRig(rigRoot(), body(['idle']), 'lake-guardian-a');
    neither.open('lake-auto-potion', 'item', 0.5);
    expect(neither.clip).toBe('idle');
  });
});

describe('Sleep (the game\'s sleep_00 to sleep_02)', () => {
  const names = ['idle', 'hurt', 'ko', 'attack', 'arms_up', 'stance_block1', 'stance_block2', 'sleep_in', 'sleep', 'wake'];
  const rigOf = (clipNames = names): MonsterRig => new MonsterRig(rigRoot(), clipNames.map((n) => burstClip(n, 1.5, 0.8)), 'wendigo');

  it('ends the stance on the spot: the arms are down the moment it sleeps, before any hit', () => {
    const rig = rigOf();
    rig.setStance(true);
    for (let i = 0; i < 60; i++) rig.update(0.05);
    expect(rig.armsUp).toBe(true);
    expect(rig.clip).toBe('stance_block1');
    rig.noteSleep(true);
    expect(rig.armsUp).toBe(false);
    expect(rig.sleeping).toBe(true);
    expect(rig.clip).toBe('sleep_in');
  });

  it('plays sleep_in once and holds the sleep, wakes through wake and settles in the idle', () => {
    const rig = rigOf();
    rig.noteSleep(true);
    for (let i = 0; i < 80; i++) rig.update(0.05);
    expect(rig.clip).toBe('sleep');
    rig.noteSleep(false);
    expect(rig.clip).toBe('wake');
    for (let i = 0; i < 80; i++) rig.update(0.05);
    expect(rig.clip).toBe('idle');
    expect(rig.sleeping).toBe(false);
  });

  it('does not act, raise its arms or flinch while it sleeps', () => {
    const rig = rigOf();
    rig.noteSleep(true);
    for (let i = 0; i < 80; i++) rig.update(0.05);
    rig.open('wendigo-punch', 'attack', 0.5);
    expect(rig.clip).toBe('sleep');
    expect(rig.windup('wendigo-punch', 'attack', 0.26)).toBe(0);
    rig.setStance(true);
    expect(rig.armsUp).toBe(false);
    rig.notePose('hurt', false);
    expect(rig.clip).toBe('sleep');
  });

  it('is a no-op when told twice, and a fallen body sleeps no more', () => {
    const rig = rigOf();
    rig.noteSleep(true);
    rig.noteSleep(true);
    expect(rig.clip).toBe('sleep_in');
    rig.notePose('ko', true);
    expect(rig.sleeping).toBe(false);
    expect(rig.clip).toBe('ko');
    rig.noteSleep(true);
    expect(rig.sleeping).toBe(false);
  });

  it('rests in the idle with the arms down in a file that has no sleep clips', () => {
    const rig = rigOf(['idle', 'arms_up', 'stance_block1']);
    rig.setStance(true);
    rig.noteSleep(true);
    expect(rig.armsUp).toBe(false);
    expect(rig.sleeping).toBe(true);
    expect(rig.clip).toBe('idle');
    rig.noteSleep(false);
    expect(rig.clip).toBe('idle');
  });
});
