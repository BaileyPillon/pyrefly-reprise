/**
 * **The commands a formation script switches off** (re-parity RC10, lane "FFX Isaaru commands"; **FFX only**; the script call `setCommandDisabled`, `FFX.exe` 0x007A6EF0 /
 * 0x0079B470 / 0x0079A5B0; the handoff is `docs/handoff/re-parity-rc10-ffx-isaaru-commands.md`).
 *
 * The fixture (`tests/fixtures/parity/ffx/formation_commands.json`) is a static scan of the install's own battle files: the constant arguments of every `setCommandDisabled`
 * call (actor spec, command id, flag) of the 38 formation files our FFX chapters fight, in code order, with the function each sits in, and the whole-game list of files that
 * switch off an action command at battle start. Everything below runs against an oracle that imports nothing from `formation-commands.ts`:
 *
 * 1. **The game model.** The handler expands the actor spec to a set of slots (a plain number is that slot, -23 every slot that is not a monster, -21 every slot) and calls
 *    the setter on each: for a command id 0x3xxx it sets (flag non-zero) or clears (flag 0) the command's bit in the slot's disabled bitmap, which starts all clear; for an id
 *    below 0x1000 it stores the flag in the aeon's availability byte. Replaying each formation's entry-function calls on that model says which commands each slot ends with off.
 * 2. **The data** carries `commandDisables` on exactly the three Isaaru groups, and the list equals what the model says (Yuna's eight and everyone's three).
 * 3. **The engine** and **the pure rule** are `parity-ffx-isaaru-commands-engine.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { EnemyGroupDef } from '../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { ISAARU_COMMAND_DISABLES, ISAARU_GROUPS } from '../../src/data/ffx/enemies/isaaru.ts';
import { DARK_AEONS_GROUPS } from '../../src/data/ffx/enemies/dark-aeons-groups.ts';
import { OFFERING_KEYS, openerGroup, possessionGroup, yuYevonLink } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { GAME_COMMAND } from '../../src/battle/ffx/formation-commands.ts';

// ---------------------------------------------------------------------------------------------------------------------- the fixture

interface Call {
  at: string;
  fn: string;
  who: number;
  command: number;
  flag: number;
}
interface Fixture {
  specs: { everyoneNonMonster: number; everySlot: number; slots: Record<string, number> };
  chapterFormations: Record<string, { chapter: string; calls: Call[] }>;
  corpus: { filesWithCalls: number; calls: number; byCommand: Record<string, number>; entryFunctionActionDisables: { files: string[] } };
}
const FX = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx/formation_commands.json', import.meta.url)), 'utf8')) as Fixture;
const FORMATIONS = Object.keys(FX.chapterFormations);

/** The three formation files of Isaaru's contest and the engine group each one is (Fist, Wing and Sword are the first, second and third link). */
const ISAARU_FORMATIONS: Readonly<Record<string, string>> = { bvyt09_10: 'isaaru-grothia', bvyt09_11: 'isaaru-pterya', bvyt09_12: 'isaaru-spathi' };
/** The game's party slots: 0 Tidus, 1 Yuna, ... 6 Rikku, 7 Seymour, 8 Valefor, 9 Ifrit, 10 Ixion, 11 Shiva, 12 Bahamut (the character table order; the mirror lock below checks it). */
const YUNA_SLOT = 1;
const AEON_BY_SLOT: Readonly<Record<number, string>> = { 8: 'valefor', 9: 'ifrit', 10: 'ixion', 11: 'shiva', 12: 'bahamut' };

// ---------------------------------------------------------------------------------------------------------------------- the game model

const SLOT_COUNT = 31;
/** 0x0079AEF0: slots 0x14 to 0x1b are the monsters'. */
const isMonsterSlot = (slot: number): boolean => slot - 0x14 >= 0 && slot - 0x14 < 8;

/** 0x00794330 for the specs the formation scripts use: a plain slot number, -23 (not a monster), -21 (everything). */
function slotsOf(spec: number): number[] {
  const all = Array.from({ length: SLOT_COUNT }, (_, i) => i);
  if (spec === -23) return all.filter((s) => !isMonsterSlot(s));
  if (spec === -21) return all;
  if (spec >= 0 && spec < SLOT_COUNT) return [spec];
  throw new Error(`an actor spec the model does not know: ${spec}`);
}

interface World {
  /** slot -> the command ids with their bit set */
  disabled: Map<number, Set<number>>;
  /** aeon slot -> availability byte (a record's default is not modelled: only the written ones are present) */
  availability: Map<number, number>;
}

/** The handler (0x007A6EF0) and the setter (0x0079B470), replayed in code order over the calls of one function. */
function play(calls: readonly Call[], fn: string = 'w0.f0'): World {
  const w: World = { disabled: new Map(), availability: new Map() };
  for (const c of calls) {
    if (c.fn !== fn) continue;
    for (const slot of slotsOf(c.who)) {
      const high = c.command >> 12;
      if (high === 0) {
        w.availability.set(c.command & 0xfff, c.flag & 0xff); // a byte store
      } else if (high === 3) {
        const set = w.disabled.get(slot) ?? new Set<number>();
        if (c.flag === 0) set.delete(c.command);
        else set.add(c.command);
        w.disabled.set(slot, set);
      }
    }
  }
  return w;
}

const offOf = (w: World, slot: number): number[] => [...(w.disabled.get(slot) ?? [])].sort((a, b) => a - b);
const ESCAPE_FLEE: number[] = [GAME_COMMAND.escape, GAME_COMMAND.flee];

describe('the model of the game against the scan', () => {
  it('the setter\'s arithmetic, worked by hand: a flag of 1 sets the bit, 0 clears it, an id below 0x1000 is an availability byte, a monster slot is never named by -23', () => {
    const a: Call = { at: '', fn: 'w0.f0', who: 1, command: 0x3000, flag: 1 };
    expect(offOf(play([a]), 1)).toEqual([0x3000]);
    expect(offOf(play([a, { ...a, flag: 0 }]), 1)).toEqual([]);
    expect(offOf(play([a, { ...a, flag: 0 }, { ...a, command: 0x3116 }]), 1)).toEqual([0x3116]);
    expect(play([{ ...a, command: 9, flag: 0 }]).availability.get(9)).toBe(0);
    expect(slotsOf(-23)).not.toContain(0x14);
    expect(slotsOf(-23)).not.toContain(0x1b);
    expect(slotsOf(-23)).toContain(0x1c);
    expect(slotsOf(-23)).toHaveLength(SLOT_COUNT - 8);
    expect(slotsOf(-21)).toHaveLength(SLOT_COUNT);
    expect(slotsOf(1)).toEqual([1]);
  });

  it('the scan covers the 38 formation files our FFX chapters fight, every call with three constants', () => {
    expect(FORMATIONS).toHaveLength(38);
    for (const f of FORMATIONS) {
      const entry = FX.chapterFormations[f]!;
      expect(entry.calls.length, f).toBeGreaterThan(0);
      for (const c of entry.calls) {
        expect(Number.isInteger(c.who) && Number.isInteger(c.command) && Number.isInteger(c.flag), `${f} at ${c.at}`).toBe(true);
      }
    }
  });

  it('replayed on the model, each of Isaaru\'s three formations ends with Yuna\'s eight commands off and Switch, Escape and Flee off for every character and aeon', () => {
    for (const file of Object.keys(ISAARU_FORMATIONS)) {
      const w = play(FX.chapterFormations[file]!.calls);
      expect(offOf(w, YUNA_SLOT), file).toEqual([0x3000, 0x3001, 0x3002, 0x3003, 0x3004, 0x3005, 0x3018, 0x3113, 0x3114, 0x3115, 0x3116]);
      for (const slot of slotsOf(-23)) {
        if (slot === YUNA_SLOT) continue;
        expect(offOf(w, slot), `${file} slot ${slot}`).toEqual([0x3002, 0x3003, 0x3018]);
      }
      for (const slot of Array.from({ length: SLOT_COUNT }, (_, i) => i).filter(isMonsterSlot)) expect(offOf(w, slot), `${file} monster slot ${slot}`).toEqual([]);
      // Nothing touches Summon, Grand Summon or Dismiss (0x3056): the only commands in any slot's set are the eleven above.
      for (const set of w.disabled.values()) expect(set.has(0x3056), file).toBe(false);
    }
  });

  it('the twelfth call of each file is the mirror lock: aeon slot 9 (Ifrit), 8 (Valefor), 12 (Bahamut) made unavailable, the three the engine locks', () => {
    const locked = { bvyt09_10: 'ifrit', bvyt09_11: 'valefor', bvyt09_12: 'bahamut' } as const;
    for (const [file, aeon] of Object.entries(locked)) {
      const w = play(FX.chapterFormations[file]!.calls);
      expect([...w.availability].map(([slot, v]) => [AEON_BY_SLOT[slot], v])).toEqual([[aeon, 0]]);
      const g = ENEMY_GROUPS_BY_ID[ISAARU_FORMATIONS[file]!] as EnemyGroupDef;
      expect(g.lockedAeons?.map((l) => l.aeonId), file).toEqual([aeon]);
    }
  });

  it('no other chapter formation switches off anything but Escape and Flee at battle start (Switch too in two), and none switches off an action command', () => {
    const others = FORMATIONS.filter((f) => !(f in ISAARU_FORMATIONS));
    expect(others).toHaveLength(35);
    const withSwitch: string[] = [];
    for (const f of others) {
      const w = play(FX.chapterFormations[f]!.calls);
      const union = new Set<number>();
      for (const set of w.disabled.values()) for (const id of set) union.add(id);
      for (const id of union) expect([...ESCAPE_FLEE, GAME_COMMAND.switch], `${f} 0x${id.toString(16)}`).toContain(id);
      if (union.has(GAME_COMMAND.switch)) withSwitch.push(f);
      // Every one of them, and not just some, switches off Escape and Flee for somebody (the boss fights that cannot be fled).
      if (f !== 'sins03_00' && f !== 'ssbt00_00' && f !== 'ssbt01_00' && f !== 'ssbt02_00' && f !== 'ssbt03_00' && f !== 'mcyt06_00') {
        expect([...union].filter((id) => ESCAPE_FLEE.includes(id)).sort(), f).toEqual(ESCAPE_FLEE);
      }
    }
    // Sinspawn Gui's second fight (every slot) and Biran and Yenke (Kimahri's slot) also switch Switch off; `lineUp.noSwitch` and a Kimahri-alone line-up carry those.
    expect(withSwitch.sort()).toEqual(['kino03_10', 'mtgz01_10']);
  });

  it('after the entry function the scripts only toggle Talk (0x3105), and in two chapter formations', () => {
    const later = new Map<string, Set<number>>();
    for (const f of FORMATIONS) {
      for (const c of FX.chapterFormations[f]!.calls) {
        if (c.fn === 'w0.f0') continue;
        // The Isaaru formations and most others have no call outside their entry function; the sins03/ssbt/hiku15 entries sit in a later worker's first function (their own set-up).
        if (!/^w\d+\.f0$/.test(c.fn)) (later.get(f) ?? later.set(f, new Set()).get(f)!).add(c.command);
      }
    }
    expect([...later.keys()].sort()).toEqual(['mcyt06_00', 'sins06_00']);
    for (const ids of later.values()) expect([...ids]).toEqual([0x3105]);
  });

  it('the whole-game list: of the 15 battle files that switch off an action command at the start, only Isaaru\'s three are formations of our chapters', () => {
    expect(FX.corpus.filesWithCalls).toBe(120);
    expect(FX.corpus.entryFunctionActionDisables.files).toHaveLength(15);
    expect(FX.corpus.entryFunctionActionDisables.files.filter((f) => FORMATIONS.includes(f)).sort()).toEqual(Object.keys(ISAARU_FORMATIONS).sort());
  });
});

// ---------------------------------------------------------------------------------------------------------------------- the data

describe('the data carries the list on exactly the groups the model says, and it is the model\'s list', () => {
  it('the three Isaaru groups, and no other group of the game, carry commandDisables', () => {
    const marked = Object.values(ENEMY_GROUPS_BY_ID).filter((g) => g.commandDisables !== undefined).map((g) => g.id).sort();
    expect(marked).toEqual(Object.values(ISAARU_FORMATIONS).sort());
    expect(ISAARU_GROUPS.map((g) => g.commandDisables)).toEqual([ISAARU_COMMAND_DISABLES, ISAARU_COMMAND_DISABLES, ISAARU_COMMAND_DISABLES]);
  });

  it('the groups the data builds on demand (the Dark Aeons pool, the Last Summoning chain: opener, every possession link, Yu Yevon) carry none either', () => {
    const built: EnemyGroupDef[] = [...DARK_AEONS_GROUPS, openerGroup(), ...OFFERING_KEYS.map((k) => possessionGroup([k])), yuYevonLink(OFFERING_KEYS)];
    expect(built.length).toBeGreaterThan(20);
    for (const g of built) expect(g.commandDisables, g.id).toBeUndefined();
  });

  it('each group\'s list is what the model of its file says: Yuna\'s eight, everyone\'s three, numbers only', () => {
    for (const [file, id] of Object.entries(ISAARU_FORMATIONS)) {
      const w = play(FX.chapterFormations[file]!.calls);
      const everyoneIds = offOf(w, 0); // slot 0 is a plain character: what everyone has
      const yunaIds = offOf(w, YUNA_SLOT).filter((c) => !everyoneIds.includes(c));
      const expected = [...everyoneIds.map((command) => ({ who: 'everyone', command })), ...yunaIds.map((command) => ({ who: 'yuna', command }))];
      const g = ENEMY_GROUPS_BY_ID[id] as EnemyGroupDef;
      const sorted = (l: readonly { who: string; command: number }[]) => [...l].map((x) => `${x.who}:${x.command}`).sort();
      expect(sorted(g.commandDisables ?? []), file).toEqual(sorted(expected));
      for (const x of g.commandDisables ?? []) expect(typeof x.command === 'number' && Object.keys(x).sort().join() === 'command,who', file).toBe(true);
    }
  });
});

