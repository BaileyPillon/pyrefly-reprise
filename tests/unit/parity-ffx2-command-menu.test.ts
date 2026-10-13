/**
 * Golden vectors for the FFX-2 command menu: the command-table builder (exe 0x00625fc0), the whole refresh tail (builder, list writer 0x00628900
 * and stable sort 0x00646ea0) and the usability test (0x0061a840 with 0x006252d0 and 0x0061acd0 under it)
 * (`src/battle/ffx2/kernel/command-menu.ts`, `command-usable.ts`, `command-menu-rows.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). A vector is the answer of the REAL game
 * function: the emulator harness (Unicorn) runs it on the live exe over the real `battle/kernel` tables and records what it returned. The two
 * files are a stratified pick of the runs of the checked note FFX2-G02 (12,000 builder vectors, 2,400 whole-menu vectors and 60,000 usability
 * vectors matched with no difference in that note; the independent model of the note agreed with every vector kept here):
 *   command_menu    204 worlds of the dress sweep (every dressphere on every girl, nothing learned and everything learned) plus 220 random
 *                   worlds in the note's classes (plain, mastery all / none, dress sweep, edge AP, a Wildcat child of the 0xff quirk);
 *                   per world the bitfield (builder), the greyed-parent block and the sorted lists (refresh tail)
 *   command_usable  480 answers of the usability test in twelve classes: Silence, Itch, Curse on a dress command, Spellspring, Half / One MP Cost,
 *                   Magic Booster (on any row and on the spell menus), rows paid in HP, MP edges, blocked bits and the dress block
 *                   (category 3 and 5 ids only; the other branches are read only)
 * The mutation check of this lane (the rule broken on purpose, a fixture failing) is in `docs/handoff/re-parity-rc7-x2cmd.md`.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FFX2_COMMAND_ROWS, menuRow } from '../../src/battle/ffx2/kernel/command-menu-rows.ts';
import { buildMenuTable, menuBit, menuLists, partyCommandList, type Ffx2MenuWorld } from '../../src/battle/ffx2/kernel/command-menu.ts';
import { commandUsable, silenceable } from '../../src/battle/ffx2/kernel/command-usable.ts';

interface MenuRec {
  job: number;
  plate: number;
  acc: [number, number];
  saveWord: number;
  gate: number[];
  cmd: string;
  abl: string;
}
interface MenuVector {
  cls: string;
  idx: number;
  records: Record<string, MenuRec>;
  keyItems: number[];
  debug: number;
  bits: Record<string, number>;
  flags: Record<string, number>;
  lists: Record<string, number[]>;
}
interface UsableVector {
  cls: string;
  status: number;
  hp: number;
  mp: number;
  maxHp: number;
  w0: number;
  w2: number;
  blocked: Record<string, number>;
  flagBlock: Record<string, number>;
  dressBlocked: Record<string, number>;
  command: number;
  extra: number;
  menuView: number;
  debug: number;
  out: number;
}

const menu = JSON.parse(readFileSync(new URL('../fixtures/parity/ffx2/command_menu.json', import.meta.url), 'utf8')) as { vectors: MenuVector[] };
const usable = JSON.parse(readFileSync(new URL('../fixtures/parity/ffx2/command_usable.json', import.meta.url), 'utf8')) as { vectors: UsableVector[] };

function bitOf(hex: string, i: number): boolean {
  if (hex === 'all') return true;
  if (hex === 'none') return false;
  return ((parseInt(hex[i >> 2] as string, 16) >> (i & 3)) & 1) === 1;
}

function worldOf(v: MenuVector): Ffx2MenuWorld {
  const rec = (i: number): MenuRec => {
    const r = v.records[String(i)];
    if (!r) throw new Error(`vector reads record ${i}, which the fixture does not hold`);
    return r;
  };
  return {
    record: (i) => {
      const r = rec(i);
      return { job: r.job, plate: r.plate, accessories: r.acc, saveWord: r.saveWord, gate: r.gate, level: 1 };
    },
    learnedCommand: (i, low) => bitOf(rec(i).cmd, low),
    learnedAbility: (i, low) => bitOf(rec(i).abl, low),
    keyItem: (bit) => v.keyItems.includes(bit),
    debugDresspheres: v.debug !== 0,
  };
}

const sparse = (words: readonly number[]): Record<string, number> => Object.fromEntries(words.map((x, i) => [String(i), x]).filter(([, x]) => x !== 0));

describe('golden vectors: the command-table builder, the list writer and the sort (tests/fixtures/parity/ffx2/command_menu.json)', () => {
  it('the fixture holds the dress sweep and the random classes', () => {
    expect(menu.vectors.length).toBeGreaterThanOrEqual(400);
    expect(menu.vectors.filter((v) => v.cls.startsWith('sweep-')).length).toBe(204);
    expect(new Set(menu.vectors.map((v) => v.cls))).toEqual(
      new Set(['sweep-none', 'sweep-all', 'plain', 'mastery_all', 'mastery_none', 'dress_sweep', 'edge', 'ff_child']),
    );
    expect(FFX2_COMMAND_ROWS).toBe(554);
  });

  it('the builder: the command bitfield and the greyed-parent block equal the real function on every world', () => {
    let compared = 0;
    for (const [n, v] of menu.vectors.entries()) {
      const t = buildMenuTable(worldOf(v), v.idx);
      try {
        expect(sparse(t.bits)).toEqual(v.bits);
        expect(sparse(t.flags)).toEqual(v.flags);
        expect(t.rows).toBe(554);
      } catch (e) {
        throw new Error(`world ${n} (${v.cls}, record ${v.idx}): ${(e as Error).message}`);
      }
      compared += 1;
    }
    expect(compared).toBe(menu.vectors.length);
  });

  it('the refresh tail: every sorted list (main, shortcut, the nine group lists) equals the real function on every world', () => {
    let entries = 0;
    for (const [n, v] of menu.vectors.entries()) {
      const got = menuLists(worldOf(v), v.idx);
      const shown = Object.fromEntries(Object.entries(got).map(([k, list]) => [k, list.filter((e) => e !== 0xff)]));
      // a blank (0xff) sorts last: nothing but blanks follows the entries
      for (const [k, list] of Object.entries(got)) expect(list.slice((shown[k] as number[]).length).every((e) => e === 0xff), `world ${n} list ${k}`).toBe(true);
      try {
        expect(shown).toEqual(v.lists);
      } catch (e) {
        throw new Error(`world ${n} (${v.cls}, record ${v.idx}): ${(e as Error).message}`);
      }
      entries += Object.values(shown).reduce((a, l) => a + l.length, 0);
    }
    expect(entries).toBeGreaterThan(4500);
  });

  it('the fixture exercises the rules the note found: free pairs, parents hidden without a child, the 0xff child, the Special forms without Item and Escape', () => {
    const sweepFresh = menu.vectors.filter((v) => v.cls === 'sweep-none');
    // a Warrior with nothing learned already lists Swordplay (Power Break is a free pair of that group) but not Assault
    const warrior = sweepFresh.find((v) => v.idx === 0 && v.records['0']?.job === 0x5004);
    expect(warrior).toBeDefined();
    const w = worldOf(warrior!);
    expect(menuBit(buildMenuTable(w, 0), 0x301f)).toBe(true);
    expect(menuBit(buildMenuTable(w, 0), 0x3063)).toBe(false);
    // the main unit of a Special has no save-word bits: no Item (0x3000), no Escape (0x3001), no Dresspheres (0x3002)
    const fallal = sweepFresh.find((v) => v.idx === 0 && v.records['0']?.job === 0x500f);
    expect(fallal).toBeDefined();
    const t = buildMenuTable(worldOf(fallal!), 0);
    for (const id of [0x3000, 0x3001, 0x3002]) expect(menuBit(t, id)).toBe(false);
    expect(partyCommandList(worldOf(fallal!), 0)).toContain(0x3030); // the Special's own Attack
    // the note's Wildcat quirk (second pass skips child index 0xff): a Gunner whose only listed child is 0x30ff does not get Wildcat
    expect(menu.vectors.filter((v) => v.cls === 'ff_child').length).toBeGreaterThanOrEqual(20);
  });

  it('the order key sorts each list: Attack first, the parents next, Item then Dresspheres last (a Gunner at mastery)', () => {
    const gunner = menu.vectors.find((v) => v.cls === 'sweep-all' && v.idx === 0 && v.records['0']?.job === 0x5001);
    expect(gunner).toBeDefined();
    const lists = menuLists(worldOf(gunner!), 0);
    const main = (lists[0] as readonly number[]).filter((e) => e !== 0xff);
    expect(main).toEqual([0x302c, 0x3032, 0x3008, 0x3000, 0x3002]); // Attack, Trigger Happy, Gunplay, Item, Dresspheres
    expect((lists[0x16] as readonly number[]).filter((e) => e !== 0xff)).toEqual([0x3001]); // Escape is the shortcut
    expect(menuRow(0x3000 & 0xfff).order).toBeGreaterThan(menuRow(0x3008 & 0xfff).order);
  });
});

describe('golden vectors: the usability test (tests/fixtures/parity/ffx2/command_usable.json)', () => {
  it('the answer (-1 or the cost) equals the real function on every vector', () => {
    const outcomes = { unusable: 0, free: 0, cost: 0 };
    for (const [n, v] of usable.vectors.entries()) {
      const arr = (m: Record<string, number>, len: number): number[] => Array.from({ length: len }, (_, i) => m[String(i)] ?? 0);
      const got = commandUsable({
        status1: v.status,
        hp: v.hp,
        mp: v.mp,
        maxHp: v.maxHp,
        word0: v.w0,
        word2: v.w2,
        blocked: arr(v.blocked, 0x4a),
        flagBlock: arr(v.flagBlock, 0x4a),
        dressBlocked: arr(v.dressBlocked, 2),
        command: v.command,
        extra: v.extra,
        menuView: v.menuView !== 0,
        debugFree: v.debug !== 0,
      });
      try {
        expect(got).toBe(v.out);
      } catch (e) {
        throw new Error(`vector ${n} (${v.cls}, command ${v.command.toString(16)}): ${(e as Error).message}`);
      }
      if (got < 0) outcomes.unusable += 1;
      else if (got === 0) outcomes.free += 1;
      else outcomes.cost += 1;
    }
    // the run must reach all three outcomes in numbers that make a broken rule visible
    expect(outcomes.unusable).toBeGreaterThan(150);
    expect(outcomes.free).toBeGreaterThan(50);
    expect(outcomes.cost).toBeGreaterThan(150);
  });

  it('Silence blocks exactly the rows with the silenceable bit: 88 rows; no parent is silenceable', () => {
    const rows = Array.from({ length: FFX2_COMMAND_ROWS }, (_, i) => 0x3000 + i).filter((id) => silenceable(id));
    expect(rows).toHaveLength(88);
    for (const id of rows) expect(menuRow(id & 0xfff).flags & 0xf8).toBe(0);
    // Black Magic's parent (0x3023) stays openable under Silence; its spell Fire (0x30a5) does not
    expect(silenceable(0x3023)).toBe(false);
    expect(silenceable(0x30a5)).toBe(true);
    // a Gunplay move, a Swordplay move and Mix are not silenceable
    for (const id of [0x3033, 0x3065, 0x3058]) expect(silenceable(id)).toBe(false);
  });
});
