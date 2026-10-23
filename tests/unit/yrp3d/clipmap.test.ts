/**
 * **Which of the game's clips is which pose** (`src/engine/yrp3d/clipMap.ts`; the hidden 3D Bahamut chapter, the real-models branch, FFX-2 only), held without a renderer. What it pins:
 *
 * 1. **The words of `clipmap.json`** become plans: `loop` holds its one clip, `once` plays through, `parts` splits a combo, one word per clip opens, holds or closes, and a word list shorter than the clips that ends in
 *    `hold` holds the last (Bahamut's four `DEAD` parts).
 * 2. **The file** is read per figure, a malformed pose is left out, a figure the file does not have gives null.
 * 3. **The names built into the code** agree with the map for the four figures (the names are the game's, so a file with no map plays the same).
 * 4. **Only what the clips can play** is kept, and a model with no idle has no plans at all.
 * 5. **The real files** (local only, so skipped when they are not on disk): the map file of the four figures names clips that exist in each figure's own `<id>-anims.glb`, and the table built from the names alone gives the same plans.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planFromPlay, plansFor, plansFromClipMap, plansFromNames, usable, type PlanTable } from '../../../src/engine/yrp3d/clipMap.ts';

describe('the words of the map', () => {
  it('holds the one clip of a loop, plays a once through, and splits a combo of parts in half', () => {
    expect(planFromPlay('loop', ['APPEAR_00'])).toEqual({ enter: [], hold: 'APPEAR_00', exit: [] });
    expect(planFromPlay('once', ['DMG1'])).toEqual({ enter: ['DMG1'], hold: null, exit: [] });
    expect(planFromPlay('parts', ['A_00', 'A_01', 'A_02', 'A_03'])).toEqual({ enter: ['A_00', 'A_01'], hold: null, exit: ['A_02', 'A_03'] });
    expect(planFromPlay('parts', ['A_00', 'A_01', 'A_02'])?.enter).toEqual(['A_00', 'A_01']); // an odd run opens longer
  });

  it('gives one word per clip a part: start, fall, pose and enter open; hold and loop hold; finish, rise and exit close', () => {
    expect(planFromPlay('start,hold,finish', ['S', 'H', 'F'])).toEqual({ enter: ['S'], hold: 'H', exit: ['F'] });
    expect(planFromPlay('fall,hold,rise', ['D0', 'D1', 'D2'])).toEqual({ enter: ['D0'], hold: 'D1', exit: ['D2'] });
    expect(planFromPlay('enter,loop,exit', ['W0', 'W1', 'W2'])).toEqual({ enter: ['W0'], hold: 'W1', exit: ['W2'] });
    expect(planFromPlay('pose,hold', ['WIN0', 'WIN1'])).toEqual({ enter: ['WIN0'], hold: 'WIN1', exit: [] });
  });

  it('holds the last clip when the words are fewer than the clips and end in hold (Bahamut\'s four fall parts)', () => {
    expect(planFromPlay('fall,hold', ['D0', 'D1', 'D2', 'D3'])).toEqual({ enter: ['D0', 'D1', 'D2'], hold: 'D3', exit: [] });
  });

  it("reads the generic three words over two or four clips as one combo: a dressphere's clip map lists every ATTACK1 clip it has under start,hold,finish", () => {
    expect(planFromPlay('start,hold,finish', ['A_00', 'A_01'])).toEqual({ enter: ['A_00'], hold: null, exit: ['A_01'] }); // a staff: the raise, then the swing
    expect(planFromPlay('start,hold,finish', ['A_00', 'A_01', 'A_02', 'A_03'])).toEqual({ enter: ['A_00', 'A_01'], hold: null, exit: ['A_02', 'A_03'] }); // a sword: the entry, then the recovery (Bahamut's four parts)
    expect(planFromPlay('start,hold,finish', ['A_00', 'A_01', 'A_02', 'A_03', 'A_04'])).toEqual({ enter: ['A_00', 'A_01', 'A_02'], hold: null, exit: ['A_03', 'A_04'] });
    expect(planFromPlay('fall,hold,rise', ['D_00', 'D_01', 'D_02', 'D_03'])).toEqual({ enter: ['D_00', 'D_01'], hold: null, exit: ['D_02', 'D_03'] });
    expect(planFromPlay('enter,loop,exit', ['K_00'])).toEqual({ enter: [], hold: 'K_00', exit: [] }); // a lone clip with a hold word: looped
    expect(planFromPlay('start,hold,finish', ['I_00'])).toEqual({ enter: [], hold: 'I_00', exit: [] });
    expect(planFromPlay('start,hold,finish', ['A', 'B', 'C'])).toEqual({ enter: ['A'], hold: 'B', exit: ['C'] }); // three clips are still one word each
    // only the generic triple: two words over three clips, or a word that is no part, is still refused
    expect(planFromPlay('start,finish', ['A', 'B', 'C'])).toBeNull();
    expect(planFromPlay('sing,hold,finish', ['A', 'B'])).toBeNull();
  });

  it('refuses what it cannot read: no clips, an unknown word, a count that does not fit', () => {
    expect(planFromPlay('loop', [])).toBeNull();
    expect(planFromPlay('sing,hold', ['A', 'B'])).toBeNull();
    expect(planFromPlay('start,finish', ['A', 'B', 'C'])).toBeNull();
    expect(planFromPlay('dance', ['A'])).toBeNull();
  });
});

describe('the map file', () => {
  const file = {
    characters: {
      yuna: { poses: { idle: { play: 'loop', clips: ['APPEAR_00'] }, hurt: { play: 'once', clips: ['DMG1'] }, attack: { play: 'start,hold,finish', clips: ['A0', 'A1', 'A2'] }, ko: { play: 'banana', clips: ['K'] }, cast: { clips: ['C'] } } },
    },
  };

  it('reads a figure\'s poses and leaves out a malformed one (an unreadable play, a missing play)', () => {
    const plans = plansFromClipMap(file, 'yuna')!;
    expect(Object.keys(plans).sort()).toEqual(['attack', 'hurt', 'idle']);
    expect(plans.attack).toEqual({ enter: ['A0'], hold: 'A1', exit: ['A2'] });
  });

  it('gives null for a figure the file does not have, and for something that is not a map', () => {
    expect(plansFromClipMap(file, 'rikku')).toBeNull();
    expect(plansFromClipMap(null, 'yuna')).toBeNull();
    expect(plansFromClipMap([], 'yuna')).toBeNull();
    expect(plansFromClipMap({ characters: [] }, 'yuna')).toBeNull();
    expect(plansFromClipMap({ characters: { yuna: { poses: { idle: { play: 'loop', clips: [3] } } } } }, 'yuna')).toEqual({});
  });
});

/** The clip names of the four figures as the files carry them (the girls' bank, and Bahamut's with his parts). */
const GIRL = ['APPEAR_00', 'IDLE2', 'DMG1', 'DMG2', 'WEAK1_00', 'WEAK1_01', 'WEAK1_02', 'DEAD_00', 'DEAD_01', 'DEAD_02', 'ATTACK1_00', 'ATTACK1_01', 'ATTACK1_02', 'ITEM_00', 'ITEM_01', 'ITEM_02_1', 'WIN_00', 'WIN_01', 'RUN_00', 'AVOID_00'];
const YUNA = [...GIRL, 'MAGIC2_00', 'MAGIC2_01', 'MAGIC2_02'];
const RIKKU = [...GIRL, 'MAGIC1_00', 'MAGIC1_01', 'MAGIC1_02'];
const BAHAMUT = ['APPEAR_00', 'IDLE2', 'DMG1', 'HDMG1', 'WEAK1_00', 'WEAK1_01', 'WEAK1_02', 'DEAD_00', 'DEAD_01', 'DEAD_02', 'DEAD_03', 'ATTACK1_00', 'ATTACK1_01', 'ATTACK1_02', 'ATTACK1_03', 'MAGIC2_00', 'MAGIC2_01', 'MAGIC2_02', 'WIN_00', 'WIN_01', 'GUARD_00'];

describe('the names built into the code', () => {
  it('gives a girl every pose the battle asks for, with the game\'s clips: idle APPEAR_00, hurt DMG1, an attack of three, a fall of three, the kneel of three, a pose and a hold for the win', () => {
    const p = plansFromNames(YUNA);
    expect(p.idle).toEqual({ enter: [], hold: 'APPEAR_00', exit: [] });
    expect(p.idle2?.enter).toEqual(['IDLE2']);
    expect(p.hurt?.enter).toEqual(['DMG1']);
    expect(p.attack).toEqual({ enter: ['ATTACK1_00'], hold: 'ATTACK1_01', exit: ['ATTACK1_02'] });
    expect(p.cast).toEqual({ enter: ['MAGIC2_00'], hold: 'MAGIC2_01', exit: ['MAGIC2_02'] });
    expect(p.item).toEqual({ enter: ['ITEM_00'], hold: 'ITEM_01', exit: ['ITEM_02_1'] });
    expect(p.ko).toEqual({ enter: ['DEAD_00'], hold: 'DEAD_01', exit: ['DEAD_02'] });
    expect(p.critical).toEqual({ enter: ['WEAK1_00'], hold: 'WEAK1_01', exit: ['WEAK1_02'] });
    expect(p.victory).toEqual({ enter: ['WIN_00'], hold: 'WIN_01', exit: [] });
  });

  it('gives Rikku her Thief bank\'s MAGIC1 for the cast (Yuna and Paine have MAGIC2), and Bahamut his parts: a combo for the attack, a four-part fall that holds the last, no item', () => {
    expect(plansFromNames(RIKKU).cast?.enter).toEqual(['MAGIC1_00']);
    const b = plansFromNames(BAHAMUT);
    expect(b.attack).toEqual({ enter: ['ATTACK1_00', 'ATTACK1_01'], hold: null, exit: ['ATTACK1_02', 'ATTACK1_03'] });
    expect(b.ko).toEqual({ enter: ['DEAD_00', 'DEAD_01', 'DEAD_02'], hold: 'DEAD_03', exit: [] });
    expect(b.item).toBeUndefined();
    expect(b.hurt?.enter).toEqual(['DMG1']); // his heavy hit and his guard are not used
  });

  it('leaves out a pose whose clips the file lacks', () => {
    const p = plansFromNames(['APPEAR_00', 'DMG1', 'ATTACK1_00', 'ATTACK1_01']); // an attack with no finish
    expect(Object.keys(p).sort()).toEqual(['hurt', 'idle']);
  });
});

describe('only what the clips can play', () => {
  it('keeps the poses whose every clip is there and drops the rest', () => {
    const table: PlanTable = { idle: { enter: [], hold: 'A', exit: [] }, hurt: { enter: ['H'], hold: null, exit: [] }, attack: { enter: ['X0'], hold: 'X1', exit: ['X2'] } };
    expect(Object.keys(usable(table, ['A', 'H', 'X0', 'X1'])).sort()).toEqual(['hurt', 'idle']);
  });

  it('gives no plans at all when the idle is missing: a model with no idle has no rig', () => {
    const table: PlanTable = { idle: { enter: [], hold: 'A', exit: [] }, hurt: { enter: ['H'], hold: null, exit: [] } };
    expect(usable(table, ['H'])).toEqual({});
  });

  it('plansFor reads the map when it has the figure and the names when it has not, and either way only what the clips play', () => {
    const map = { characters: { yuna: { poses: { idle: { play: 'loop', clips: ['APPEAR_00'] }, hurt: { play: 'once', clips: ['MISSING'] } } } } };
    expect(Object.keys(plansFor('yuna', map, YUNA))).toEqual(['idle']); // the map's hurt names a clip the file does not have
    expect(Object.keys(plansFor('rikku', map, RIKKU)).length).toBeGreaterThan(5); // not in the map: the names
    expect(Object.keys(plansFor('rikku', null, RIKKU)).length).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The real files, when they are on this machine (gitignored: `public/models-exp/yrp/`)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

const DIR = 'public/models-exp/yrp';
const have = existsSync(`${DIR}/clipmap.json`) && ['yuna', 'rikku', 'paine', 'bahamut'].every((id) => existsSync(`${DIR}/${id}-anims.glb`));

/** The animation names of a binary glTF, from its JSON chunk (no loader, no textures). */
function animationNames(path: string): string[] {
  const b = readFileSync(path);
  const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')) as { animations?: Array<{ name: string }> };
  return (json.animations ?? []).map((a) => a.name);
}

describe.skipIf(!have)('the real files', () => {
  const map = have ? (JSON.parse(readFileSync(`${DIR}/clipmap.json`, 'utf8')) as unknown) : null;

  it.each(['yuna', 'rikku', 'paine', 'bahamut'])('%s: the map\'s plans name only clips that exist in its own clips file, with an idle, a hurt, an attack, a cast, a fall and a victory', (id) => {
    const names = animationNames(`${DIR}/${id}-anims.glb`);
    const raw = plansFromClipMap(map, id)!;
    const plans = plansFor(id, map, names);
    expect(Object.keys(plans).sort()).toEqual(Object.keys(raw).sort()); // nothing the map names is missing from the file
    for (const pose of ['idle', 'hurt', 'attack', 'cast', 'ko', 'victory'] as const) expect(plans[pose], pose).toBeDefined();
    if (id !== 'bahamut') for (const pose of ['item', 'critical'] as const) expect(plans[pose], pose).toBeDefined();
  });

  it.each(['yuna', 'rikku', 'paine', 'bahamut'])('%s: the table built from the clip names alone makes the same plans as the map for every pose it has', (id) => {
    const names = animationNames(`${DIR}/${id}-anims.glb`);
    const fromMap = plansFor(id, map, names);
    const fromNames = usable(plansFromNames(names), names);
    for (const [pose, plan] of Object.entries(fromNames)) expect(fromMap[pose as keyof PlanTable], `${id} ${pose}`).toEqual(plan);
  });
});
