/**
 * The game's kill-reward rows on the FFX-2 enemy data (re-parity RC9, lane X2-C; **FFX-2 only**).
 *
 * `src/data/ffx2/monster-records/kill-rewards.ts` holds, for every monster of the FFX-2 chapters, the EXP, AP, gil, drop chance byte and the
 * two item slots of its row in `battle/kernel/monster.bin` (Steam build 25501027), and `attachMonsterRecords` lays each one on its
 * `EnemyDef` as `ffx2Record.kill`. This file pins:
 *
 *  - the table equals the numbers the reader wrote (`tests/fixtures/parity/ffx2/kill_reward_rows.json`), field for field;
 *  - every enemy and part of the eleven chapters (the seven in the list, the Experiment, Tourist Trap, Valefor at Besaid, Angra Mainyu)
 *    and of the Trema options has its row laid on it, and no enemy of any other group does;
 *  - the authored EXP, AP and gil agree with the row (the three Syndicate records that did not are fixed: Ormi in Act I, Ormi and Logos
 *    in Act II), and the authored common drop is the row's common slot;
 *  - every item id a row can drop has a game number in our table and a name that reads as the game's;
 *  - every shipped monster's reward numbers carry their row citation: the table and row of `monster.bin` / `monster2.bin`, the same row its
 *    record cites for the rest of it, naming the same monster, and the data file says where the rows come from; the rows of the hidden chapters
 *    (Tourist Trap, Valefor at Besaid, Angra Mainyu, the Experiment) equal what those chapters' own fixtures decode, a second witness.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { EnemyDef } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { KILL_REWARD_ROWS } from '../../src/data/ffx2/monster-records/kill-rewards.ts';
import { KILL_ITEM_ID } from '../../src/battle/ffx2/adapt/kill-rewards.ts';
import { itemLabel } from '../../src/ui/common/resultsMath.ts';
import { abilityWords } from '../../src/battle/ffx2/kernel/dressphere-abilities.ts';
import { autoWordsOf } from '../../src/battle/ffx2/adapt/menu.ts';
import { board } from './helpers/ffx2RewardsRig.ts';

interface Row {
  table: number;
  row: number;
  name: string;
  exp: number;
  ap: number;
  gil: number;
  dropByte: number;
  drop: number[];
}

const here = (name: string): string => fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url));
const ROWS = JSON.parse(readFileSync(here('kill_reward_rows.json'), 'utf8')) as Record<string, Row>;

/** Every group of the FFX-2 data, with its enemies and parts. */
const GROUPS = Object.values(data.ENEMY_GROUPS_BY_ID);

/** Every monster this project can put on an FFX-2 field: each enemy and part of each formation it ships. */
const ENEMIES: Array<{ key: string; enemy: EnemyDef }> = [];
for (const group of GROUPS) for (const enemy of [...group.enemies, ...(group.parts ?? [])]) ENEMIES.push({ key: `${group.id}/${enemy.id}`, enemy });

/** The game's item names as the engine's labels read them: the English copies of `item.bin`, `accessory.bin` and `important.bin` spell them, but the engine's ids have no hyphen in Gris Gris Bag and Magical Dances Vol 1 (earlier builds'), so those two labels read without one. */
const NAMES: Readonly<Record<number, string>> = {
  0x2000: 'Potion', 0x2001: 'Hi-Potion', 0x2002: 'X-Potion', 0x2003: 'Mega-Potion', 0x2008: 'Elixir', 0x2009: 'Megalixir', 0x2011: 'Grenade',
  0x2028: 'Supreme Gem', 0x202e: 'Dark Matter', 0x203f: 'Hero Drink', 0x7029: 'Reassembled Sphere', 0x7046: 'Magical Dances Vol 1',
  0x9002: 'Mythril Bangle', 0x900b: 'Kaiser Knuckles', 0x900e: 'Crystal Gloves', 0x9012: 'Pixie Dust', 0x9013: 'Crystal Ball', 0x9014: 'Defense Veil',
  0x901e: 'Regal Crown', 0x9039: 'Tetra Band', 0x9047: 'Twist Headband', 0x904b: 'Black Choker', 0x904d: 'Gris Gris Bag', 0x9053: 'Faerie Earrings',
  0x9056: 'Ribbon', 0x9058: 'Favorite Outfit', 0x905c: 'Moon Bracer', 0x9060: 'Recovery Bracer', 0x9072: 'Charm Bangle', 0x9074: 'Soul of Thamasa',
};

describe('the kill-reward rows are the game\'s', () => {
  it('the table equals the reader\'s numbers, field for field', () => {
    expect(Object.keys(KILL_REWARD_ROWS).sort()).toEqual(Object.keys(ROWS).sort());
    for (const [key, row] of Object.entries(ROWS)) {
      const got = KILL_REWARD_ROWS[key]!;
      expect({ table: got.table, row: got.row, exp: got.exp, ap: got.ap, gil: got.gil, dropByte: got.dropByte, drop: [...got.drop] }, key).toEqual({
        table: row.table, row: row.row, exp: row.exp, ap: row.ap, gil: row.gil, dropByte: row.dropByte, drop: row.drop,
      });
    }
  });

  it('the rows say what the note says (FFX2-G03 section 5.1): the partial bytes, the Syndicate records, the chapter bosses', () => {
    const at = (key: string) => KILL_REWARD_ROWS[key]!;
    expect([at('vegnagun-body/bulwark-r').dropByte, at('ffx2-leblanc-entrance/dr-goon').dropByte, at('ffx2-leblanc-last-room/logos').dropByte]).toEqual([128, 128, 192]);
    expect(at('ffx2-leblanc-entrance/ormi-entrance')).toMatchObject({ exp: 220, ap: 1, gil: 220, drop: [0x904b, 1, 0x904b, 1] }); // Black Choker
    expect(at('ffx2-leblanc-logos-room/ormi-logos-room')).toMatchObject({ exp: 240, ap: 1, gil: 230, drop: [0x9014, 1, 0x9014, 1] }); // Defense Veil
    expect(at('ffx2-leblanc-logos-room/logos-room')).toMatchObject({ exp: 240, ap: 1, gil: 230, drop: [0x9058, 1, 0x9058, 1] }); // Favorite Outfit
    expect(at('ffx2-cloister-trema/trema')).toMatchObject({ exp: 10000, ap: 50, gil: 10000, drop: [0x202e, 1, 0x202e, 2] }); // Dark Matter x1 or x2
    expect(at('ffx2-cloister-trema-arena/trema')).toMatchObject({ exp: 2000, ap: 1, gil: 3000, drop: [0x202e, 2, 0x202e, 3] });
    expect(at('ffx2-cloister-paragon-oversoul/paragon')).toMatchObject({ table: 2, exp: 13000, ap: 2, gil: 8000 });
    for (const key of ['vegnagun-head/vegnagun-head', 'vegnagun-head/redoubt-l', 'vegnagun-head/redoubt-r', 'shuyin/shuyin']) expect(at(key).dropByte, key).toBe(0);
  });
});

describe('the rows are laid on the enemy data', () => {
  const enemies = ENEMIES;

  it('every enemy that has a row wears it, and the rows are all worn by someone', () => {
    const worn = new Set<string>();
    for (const { key, enemy } of enemies) {
      const row = KILL_REWARD_ROWS[key];
      if (row === undefined) continue;
      worn.add(key);
      expect(enemy.ffx2Record?.kill, key).toEqual(row);
    }
    expect([...worn].sort()).toEqual(Object.keys(KILL_REWARD_ROWS).sort());
  });

  it('every enemy of the FFX-2 chapters is paid by a row', () => {
    const unrowed = enemies.filter(({ enemy }) => enemy.ffx2Record?.kill === undefined).map(({ key }) => key);
    expect(unrowed).toEqual([]);
  });

  it('the authored EXP, AP and gil are the row\'s, and the authored common drop is the row\'s common slot', () => {
    for (const { key, enemy } of enemies) {
      const row = KILL_REWARD_ROWS[key];
      if (row === undefined) continue;
      expect([enemy.rewards.exp ?? 0, enemy.rewards.ap, enemy.rewards.gil], key).toEqual([row.exp, row.ap, row.gil]);
      const common = row.drop[0] === 0 ? [] : [{ itemId: KILL_ITEM_ID[row.drop[0]]!, count: row.drop[1] }];
      expect(enemy.rewards.drops.map((d) => ({ itemId: d.itemId, count: d.count })), key).toEqual(common);
    }
  });
});

describe('every shipped monster\'s reward numbers carry their row citation', () => {
  /**
   * The row a monster's record (W3) cites for the rest of it is the row its rewards are read from: one row of `monster.bin` a monster. The one exception is the
   * Fiend Arena's Trema, built from the story Trema's record (row 295) and paid by its own row of the game (328, note FFX2-G03 table 5.1).
   */
  const OWN_ROW: Readonly<Record<string, number>> = { 'ffx2-cloister-trema-arena/trema': 328 };
  /** The reader spells a name as the game's file does ("Fem,Goon"); ours has a hyphen. */
  const plain = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  it('each monster wears a reward row that names its table and row, as the reader read them, and the row is that monster\'s', () => {
    expect(ENEMIES.length).toBe(Object.keys(ROWS).length);
    for (const { key, enemy } of ENEMIES) {
      const kill = enemy.ffx2Record?.kill;
      expect(kill, `${key}: no reward row`).toBeDefined();
      if (kill === undefined) continue;
      expect([1, 2], `${key}: table`).toContain(kill.table);
      expect(Number.isInteger(kill.row) && kill.row >= 1, `${key}: row ${kill.row}`).toBe(true);
      const fixture = ROWS[key];
      expect(fixture, `${key}: the reader's fixture has no row`).toBeDefined();
      expect([kill.table, kill.row], `${key}: the row the data cites is the row the reader read`).toEqual([fixture?.table, fixture?.row]);
      expect(plain(fixture?.name ?? ''), `${key}: the cited row is another monster's (${fixture?.name})`).toBe(plain(enemy.name));
      const own = OWN_ROW[key];
      expect([kill.table, kill.row], `${key}: the reward row and the record's row`).toEqual(own !== undefined ? [1, own] : [enemy.ffx2Record?.table, enemy.ffx2Record?.row]);
    }
  });

  it('no formation cites one row for two of its monsters', () => {
    for (const group of GROUPS) {
      const cited = [...group.enemies, ...(group.parts ?? [])].map((e) => `${e.ffx2Record?.kill?.table}/${e.ffx2Record?.kill?.row}`);
      expect(new Set(cited).size, `${group.id}: ${cited.join(', ')}`).toBe(cited.length);
    }
  });

  it('the data file says where its rows come from: the game file, the reader, the note and a confidence tag', () => {
    const text = readFileSync(fileURLToPath(new URL('../../src/data/ffx2/monster-records/kill-rewards.ts', import.meta.url)), 'utf8');
    for (const needle of ['monster.bin', 'monster2.bin', 'Steam', 'FFX2-G03', '[verified']) expect(text, needle).toContain(needle);
  });

  it('the rows of the hidden chapters equal what those chapters\' own fixtures decode (a second witness: the note\'s table 5.1 does not list Tourist Trap, Valefor or Angra Mainyu)', () => {
    interface Decoded {
      exp: number;
      gil: number;
      ap: number;
      dropChanceByte: number;
    }
    const read = <T>(name: string): T => JSON.parse(readFileSync(here(name), 'utf8')) as T;
    const same = (key: string, row: number, d: Decoded, drop: readonly number[]): void => {
      const got = KILL_REWARD_ROWS[key]!;
      expect({ row: got.row, exp: got.exp, gil: got.gil, ap: got.ap, dropByte: got.dropByte, drop: [...got.drop] }, key).toEqual({ row, exp: d.exp, gil: d.gil, ap: d.ap, dropByte: d.dropChanceByte, drop: [...drop] });
    };
    const trap = read<Record<'yojimbo' | 'daigoro', Decoded & { row: number; dropItem?: { id: number; common: number; rare: number } }>>('tourist_trap_rows.json');
    same('ffx2-cavern-yojimbo/x2-yojimbo', trap.yojimbo.row, trap.yojimbo, [trap.yojimbo.dropItem!.id, trap.yojimbo.dropItem!.common, trap.yojimbo.dropItem!.id, trap.yojimbo.dropItem!.rare]);
    same('ffx2-cavern-yojimbo/x2-daigoro', trap.daigoro.row, trap.daigoro, [0, 0, 0, 0]);
    const valefor = read<{ row: number; decoded: Decoded & { dropItems: number[] } }>('besaid_valefor_rows.json');
    same('ffx2-besaid-valefor/x2-valefor', valefor.row, valefor.decoded, valefor.decoded.dropItems);
    const angra = read<{ rows: Record<string, { name: string; decoded: Decoded & { dropItems: number[] } }> }>('angra_mainyu_rows.json').rows;
    same('ffx2-bikanel-angra-mainyu/x2-angra-mainyu', 268, angra['268']!.decoded, angra['268']!.decoded.dropItems);
    same('ffx2-bikanel-angra-mainyu/x2-zarich', 269, angra['269']!.decoded, angra['269']!.decoded.dropItems);
    same('ffx2-bikanel-angra-mainyu/x2-tawrich', 270, angra['270']!.decoded, angra['270']!.decoded.dropItems);
    const experiment = read<{ record: Decoded & { row: number; dropItem: { name: string; count: number } } }>('experiment_rows.json').record;
    expect(experiment.dropItem.name).toBe('Elixir'); // 0x2008 in the game's numbers
    for (const key of ['ffx2-djose-experiment-1/x2-experiment-prototype', 'ffx2-djose-experiment-2/x2-experiment']) same(key, experiment.row, experiment, [0x2008, experiment.dropItem.count, 0x2008, experiment.dropItem.count]);
  });
});

describe('the item ids', () => {
  it('every item a row can drop has a game number in our table, and a name that reads as the game\'s', () => {
    const ids = new Set<number>();
    for (const row of Object.values(KILL_REWARD_ROWS)) for (const id of [row.drop[0], row.drop[2]]) if (id !== 0) ids.add(id);
    for (const id of ids) {
      expect(KILL_ITEM_ID[id], `0x${id.toString(16)}`).toBeDefined();
      expect(itemLabel(KILL_ITEM_ID[id]!), `0x${id.toString(16)}`).toBe(NAMES[id]);
    }
    expect(Object.keys(KILL_ITEM_ID).map(Number).sort((a, b) => a - b)).toEqual([...ids].sort((a, b) => a - b)); // nothing in the table is unused
  });
});

describe('the reward abilities reach a girl\'s ability words (note FFX2-G03 section 4.8)', () => {
  /** Word 0 (`Chr+0x650`) and word 1 (`Chr+0x652`) bits the roll reads, written out by hand from the note's table. */
  const BITS: ReadonlyArray<readonly [string, number, number, number]> = [
    ['double-ap', 0x8009, 0x1000, 0],
    ['triple-ap', 0x800a, 0x2000, 0],
    ['butterfingers', 0x800e, 0, 0x0002],
    ['gillionaire', 0x800f, 0, 0x0010],
    ['double-items', 0x8010, 0, 0x0020],
    ['double-exp', 0x8011, 0, 0x0040],
    ['item-hunter', 0x8012, 0, 0x0200],
  ];

  it('each garment-grid tag sets exactly its bit, and the game\'s row for it sets the same bit', () => {
    const girl = board('ffx2-leblanc-entrance').unit('yuna');
    for (const [tag, row, word0, word1] of BITS) {
      const words = autoWordsOf(girl, [tag]);
      expect({ tag, w0: words[0] & (word0 | 0x3000), w1: words[1] & (word1 | 0x0272) }, tag).toEqual({ tag, w0: word0, w1: word1 });
      expect(abilityWords([row]).slice(0, 2), `${tag} row 0x${row.toString(16)}`).toEqual([word0, word1]);
    }
  });

  it('"double all" (row 0x8097) sets the seven except Item Hunter and Butterfingers', () => {
    const w = abilityWords([0x8097]);
    expect(w[0] & 0x3000).toBe(0x1000); // Double AP, not Triple
    expect(w[1] & 0x0272).toBe(0x0010 | 0x0020 | 0x0040); // Gillionaire, Double Items, Double EXP
  });

  it('a Thief who learned Item Hunter carries its bit; one who did not, does not', () => {
    const base = board('ffx2-leblanc-entrance');
    const yuna = base.unit('yuna');
    expect(yuna.autoWords?.[1] ?? 0).toBe(0);
    const learned = board('ffx2-leblanc-entrance', 1, {}, (member) =>
      member.id === 'yuna' ? { ...member, currentDressphere: 'thief', owned: [...new Set(['thief', ...member.owned])], abilitiesLearned: { ...member.abilitiesLearned, thief: { learned: ['x2-thief-item-hunter'], ap: 0 } } } : member,
    ).unit('yuna');
    expect((learned.autoWords?.[1] ?? 0) & 0x0200).toBe(0x0200);
  });
});
