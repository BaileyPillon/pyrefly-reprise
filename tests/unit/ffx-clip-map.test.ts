/**
 * **From a pose, or an action, to a row of the clip table** (`src/engine/ffx3d/clipMap.ts`; FFX only). The functions are pure, and every table and clip name here is made up: no retail
 * file or name is read. What this file pins:
 *
 * 1. {@link parseClipMap} reads the converter's `clipmap.json` shape and is strict where it must be: an actor needs a safe file path and a mapped idle row, an unmapped row is left out (it plays as
 *    idle), a step with no clip name or no length drops its whole row, anything else in the file is ignored, and the contact is the frame counted from the start of the sequence.
 * 2. {@link keyForPose} is the pose to row mapping: idle and ready are the idle loop (the game has no ready motion), follow is "carry on", defend is the life state `guard` (its painting falls back to
 *    ready), `down` is the fall and `victory` the celebration whatever painting is up, Evrae's range paintings are idle, an unknown pose is idle.
 * 3. {@link actionKeyFor} names the row an action opens with: Evrae's moves by ability id, a party member's by the painted pose the presenter picked, and nothing for an Overdrive.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { KEEP, RANGE_KEYS, actionKeyFor, clipNamesOf, interrupts, keyForPose, parseClipMap } from '../../src/engine/ffx3d/clipMap.ts';

const step = (clip: string, play: string, frames: number): Record<string, unknown> => ({ clip, play, frames, role: 'x', durationSec: frames / 30 });
const mapped = (sequence: unknown[], extra: Record<string, unknown> = {}): Record<string, unknown> => ({ status: 'mapped', label: 'Read', sequence, ...extra });

const TABLE = {
  version: 1,
  fps: 30,
  characters: {
    hero: {
      glb: 'evrae/hero-anims.glb',
      poses: {
        idle: mapped([step('H_IDLE', 'loop', 28)]),
        ready: { status: 'unmapped', suggestion: { clip: 'H_IDLE' } },
        attack: mapped([step('H_ATK_0', 'once', 21), step('H_ATK_1', 'once', 15)], { contact: { clip: 'H_ATK_0', frame: 20, sequenceFrame: 20 } }),
        cast: mapped([step('H_CAST_0', 'once', 20), step('H_CAST_1', 'loop', 16), step('H_CAST_2', 'once', 39)]),
        ko: mapped([step('H_KO_0', 'once', 61), step('H_KO_1', 'loop', 1)]),
      },
    },
    beast: {
      glb: 'evrae/beast-anims.glb',
      poses: { idle: mapped([step('B_IDLE', 'loop', 80)]), 'poison-breath': mapped([step('B_SP1_0', 'once', 48)]) },
    },
  },
};

describe('reading the clip table', () => {
  it('reads each actor\'s file and mapped rows, steps as clip, loop and frames, and the contact as a frame of the whole sequence', () => {
    const map = parseClipMap(TABLE)!;
    expect(map.fps).toBe(30);
    expect(Object.keys(map.actors)).toEqual(['hero', 'beast']);
    const hero = map.actors['hero']!;
    expect(hero.file).toBe('evrae/hero-anims.glb');
    expect(Object.keys(hero.rows)).toEqual(['idle', 'attack', 'cast', 'ko']); // the unmapped ready row is left out: it plays as idle
    expect(hero.rows['idle']!.steps).toEqual([{ clip: 'H_IDLE', loop: true, frames: 28 }]);
    expect(hero.rows['cast']!.steps.map((s) => [s.clip, s.loop])).toEqual([['H_CAST_0', false], ['H_CAST_1', true], ['H_CAST_2', false]]);
    expect(hero.rows['attack']!.contact).toBe(20);
    expect(hero.rows['idle']!.contact).toBeNull();
  });

  it('lists the distinct clips an actor\'s rows use', () => {
    const hero = parseClipMap(TABLE)!.actors['hero']!;
    expect(clipNamesOf(hero).sort()).toEqual(['H_ATK_0', 'H_ATK_1', 'H_CAST_0', 'H_CAST_1', 'H_CAST_2', 'H_IDLE', 'H_KO_0', 'H_KO_1']);
  });

  it('is null for anything that is not a table, or one with no usable actor', () => {
    for (const bad of [undefined, null, 4, 'x', [], {}, { characters: 3 }, { characters: {} }]) expect(parseClipMap(bad), JSON.stringify(bad)).toBeNull();
  });

  it('leaves out an actor with an unsafe file path, or no mapped idle row, and keeps the rest', () => {
    const t = structuredClone(TABLE) as typeof TABLE & { characters: Record<string, unknown> };
    (t.characters['hero'] as { glb: string }).glb = '../outside/hero.glb';
    t.characters['noidle'] = { glb: 'evrae/noidle.glb', poses: { attack: mapped([step('A', 'once', 3)]) } };
    t.characters['broken'] = { glb: 'evrae/broken.glb', poses: 7 };
    const map = parseClipMap(t)!;
    expect(Object.keys(map.actors)).toEqual(['beast']);
  });

  it('drops a row whose step has no clip name or no length, and a row with no steps; the actor keeps its other rows', () => {
    const t = structuredClone(TABLE) as typeof TABLE;
    const poses = t.characters.hero.poses as Record<string, unknown>;
    poses['attack'] = mapped([step('H_ATK_0', 'once', 21), { play: 'once', frames: 4 }]);
    poses['cast'] = mapped([step('H_CAST_0', 'once', 0)]);
    poses['ko'] = mapped([]);
    const hero = parseClipMap(t)!.actors['hero']!;
    expect(Object.keys(hero.rows)).toEqual(['idle']);
  });

  it('takes 30 frames a second when the table does not say, and no contact when the number is not one', () => {
    const t = structuredClone(TABLE) as Record<string, unknown>;
    delete t['fps'];
    ((t['characters'] as Record<string, { poses: Record<string, unknown> }>)['hero']!.poses['attack'] as Record<string, unknown>)['contact'] = { sequenceFrame: 'twenty' };
    const map = parseClipMap(t)!;
    expect(map.fps).toBe(30);
    expect(map.actors['hero']!.rows['attack']!.contact).toBeNull();
  });
});

describe('from the presenter\'s pose to a row', () => {
  it('idle, ready, sleep, the range paintings and any unknown name are the idle loop', () => {
    for (const pose of ['idle', 'ready', 'sleep', 'idle-near', 'idle-far', 'something-new', '']) expect(keyForPose(pose, 'idle'), pose).toBe('idle');
    expect(keyForPose('ready', 'ready')).toBe('idle'); // the command menu is open: standing, weapon drawn
  });

  it('follow is "carry on"', () => {
    expect(keyForPose('follow', 'act')).toBe(KEEP);
  });

  it('attack, cast, item, hurt, critical and the breath charge are rows of their own', () => {
    for (const pose of ['attack', 'cast', 'item', 'hurt', 'critical', 'breath-charge']) expect(keyForPose(pose, 'idle'), pose).toBe(pose);
    expect(keyForPose('ko', 'idle')).toBe('ko');
    expect(keyForPose('victory', 'idle')).toBe('victory');
  });

  it('the life state decides guard, down and victory, whatever painting is up: a defend falls back to the ready painting', () => {
    expect(keyForPose('ready', 'guard')).toBe('defend');
    expect(keyForPose('idle', 'guard')).toBe('defend');
    expect(keyForPose('defend', 'idle')).toBe('defend');
    expect(keyForPose('idle', 'down')).toBe('ko'); // a body with no KO painting lies down by itself
    expect(keyForPose('hurt', 'down')).toBe('ko');
    expect(keyForPose('idle', 'victory')).toBe('victory');
  });

  it('says which rows take over from an action in hand: being hit, falling, winning', () => {
    expect(['hurt', 'ko', 'victory'].every(interrupts)).toBe(true);
    expect(['idle', 'attack', 'cast', 'item', 'defend', 'poison-breath', 'pull-back'].some(interrupts)).toBe(false);
  });
});

describe('from an action to a row', () => {
  it('names Evrae\'s moves by ability id, the whiffed breath being the breath\'s motion', () => {
    expect(actionKeyFor('evrae-attack', 'attack')).toBe('attack');
    expect(actionKeyFor('evrae-poison-breath', 'cast')).toBe('poison-breath');
    expect(actionKeyFor('evrae-out-of-breath-range', 'cast')).toBe('poison-breath');
    expect(actionKeyFor('evrae-stone-gaze', 'cast')).toBe('stone-gaze');
    expect(actionKeyFor('evrae-photon-spray', 'cast')).toBe('photon-spray');
    expect(actionKeyFor('evrae-swooping-scythe', 'attack')).toBe('swooping-scythe');
    expect(actionKeyFor('evrae-inhale', 'cast')).toBe('breath-charge');
    expect(actionKeyFor('evrae-haste', 'cast')).toBe('cast');
  });

  it('takes a party member\'s action from the painted pose the presenter picked, and nothing for an Overdrive or an unknown kind', () => {
    for (const kind of ['attack', 'cast', 'item', 'defend']) expect(actionKeyFor('some-spell', kind), kind).toBe(kind);
    expect(actionKeyFor(undefined, 'attack')).toBe('attack'); // a plain attack has no ability id
    expect(actionKeyFor('overdrive-x', 'overdrive')).toBeNull();
    expect(actionKeyFor(undefined, undefined)).toBeNull();
    expect(actionKeyFor(undefined, 'sleep')).toBeNull();
  });

  it('the airship\'s two flights: pulling back out to far, moving in to near', () => {
    expect(RANGE_KEYS.far).toBe('pull-back');
    expect(RANGE_KEYS.near).toBe('move-in');
  });
});
