/**
 * **The loot records of the FFX monsters, as data** (re-parity RC9, lane FFX-M; **FFX only**).
 *
 * `src/data/ffx/loot/records.ts` holds, as numbers, the loot record of each of the 43 monster files the FFX chapters ship (chunk 4, 0x118 bytes, of `battle/mon/_mNNN/mNNN.bin` in
 * `FFX_Data.vbf`). This file proves four things about it, none of which reads the game's files (they are on one PC only):
 *
 * 1. **The table equals an independent read.** `tests/fixtures/parity/ffx/loot_records.json` is the private note FFX-H02's own parse of the same files (its `monsters_loot.tsv`, made with its own
 *    script); the lane's table was read again with a second script and the two agreed on all 361 records x 31 fields. Here the shipped rows equal the fixture field by field.
 * 2. **Every shipped monster has its record**, and it is the right one: the id-to-file table below is written out again from the research notes (`research/re-ffx-*.md` name each monster's file),
 *    and the rewards each monster lists (`ap`, `apOverkill`, `gil`, `drops`) are derived from it, except where the monster's own script writes over the record (Sinspawn Gui's parts), which the
 *    record's `note` says.
 * 3. **Every item the game can pay from these records has a name**: the item numbers map to the ids of the Mix chart (`kernel/mix-table.ts`), the shipped item rows exist for every one of them and
 *    for the four Distill spheres.
 * 4. **The facts the older tables got wrong or left out**, pinned from the records: Seymour's rare Special Sphere, Omnis's rare x2, Natus's Lv. 2 Key Sphere, the overkill lists.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIX_ITEM_IDS } from '../../src/battle/ffx/kernel/mix-table.ts';
import { ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { DARK_CINDY_ID, DARK_DAIGORO_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID } from '../../src/data/ffx/mirror-aeons-ids.ts';
import { BFA_LINE_FILE, dropsOfRecord, FFX_LOOT_RECORDS, ITEM_ID_OF_NUMBER, lootOf, lootRewards } from '../../src/data/ffx/loot/index.ts';

interface Row {
  gil: number; ap: number; apOverkill: number; chance: [number, number]; gearChance: number;
  items: number[]; qty: number[]; overkillItems: number[]; overkillQty: number[]; bribeItem: number; bribeFactor: number;
}
const FIXTURE = JSON.parse(readFileSync(new URL('../fixtures/parity/ffx/loot_records.json', import.meta.url), 'utf8')) as { files: number[]; rows: Record<string, Row> };

/** Which monster file each shipped enemy is, written out again from the research notes (the BFA line's are in the data layer's own table; its test below). */
const FILE_OF: Readonly<Record<string, number>> = {
  'seymour-flux': 142, mortiorchis: 143, // research/ffx-seymour-flux.md
  yunalesca: 130, // research/re-ffx-ai-yunalesca-bfa.md
  'guado-guardian-a': 141, 'guado-guardian-b': 141, 'seymour-macalania': 124, 'anima-macalania': 125, // research/ffx-seymour-anima-macalania.md
  evrae: 119, cid: 149, // research/ffx-evrae-airship.md
  yojimbo: 288, daigoro: 266, ginnem: 249, // research/ffx-yojimbo.md
  'seymour-natus': 126, mortibody: 127, // research/ffx-seymour-natus.md
  'seymour-omnis': 131, 'mortiphasm-1': 106, 'mortiphasm-2': 106, 'mortiphasm-3': 106, 'mortiphasm-4': 106, // research/ffx-seymour-omnis.md
  isaaru: 248, grothia: 284, pterya: 254, spathi: 287, // research/ffx-isaaru-bevelle.md
  'overdrive-sin': 140, 'left-fin': 136, 'right-fin': 137, 'sinspawn-genais': 139, 'sin-core': 138, // research/ffx-sin.md
  'sinspawn-gui': 117, 'sinspawn-gui-2': 117, 'sinspawn-gui-head': 160, 'sinspawn-gui-arm-left': 161, 'sinspawn-gui-arm-right': 161, // research/re-ffx-ai-gui.md
  'biran-ronso': 134, 'yenke-ronso': 135, // research/re-ffx-biran-yenke.md
  'braskas-final-aeon': 132, 'yu-pagoda-left': 173, 'yu-pagoda-right': 174, 'yu-yevon': 176, // research/re-ffx-ai-yunalesca-bfa.md
  'possessed-valefor': 163, 'possessed-ifrit': 164, 'possessed-ixion': 165, 'possessed-shiva': 166, 'possessed-bahamut': 167,
};

/** The numbers a monster's own script writes over its record, by enemy id: the values in play (`research/re-ffx-ai-gui.md` 2.3 and 3.3). */
const SCRIPT_WRITES: Readonly<Record<string, Partial<Row>>> = {
  'sinspawn-gui': { chance: [0, 0], gearChance: 0 },
  'sinspawn-gui-2': { ap: 0, apOverkill: 0 },
  'sinspawn-gui-head': { chance: [0, 0], gearChance: 0 },
  'sinspawn-gui-arm-left': { chance: [0, 0], gearChance: 0 },
  'sinspawn-gui-arm-right': { chance: [0, 0], gearChance: 0 },
};

describe('the loot records equal an independent read of the same files', () => {
  it('the table holds exactly the 43 files of the fixture, and every row equals the note\'s parse field by field', () => {
    expect(Object.keys(FFX_LOOT_RECORDS).map(Number).sort((a, b) => a - b)).toEqual(FIXTURE.files);
    expect(FIXTURE.files).toHaveLength(43);
    for (const file of FIXTURE.files) {
      const mine = FFX_LOOT_RECORDS[file]!;
      const theirs = FIXTURE.rows[String(file)]!;
      expect(mine.file, `m${file}`).toBe(file);
      expect({ gil: mine.gil, ap: mine.ap, apOverkill: mine.apOverkill, chance: [...mine.chance], gearChance: mine.gearChance, items: [...mine.items], qty: [...mine.qty], overkillItems: [...mine.overkillItems], overkillQty: [...mine.overkillQty], bribeItem: mine.bribeItem, bribeFactor: mine.bribeFactor }, `m${file}`).toEqual(theirs);
    }
  });

  it('each row names its source: the file, the chunk and a 16-digit digest of the 0x118 bytes', () => {
    for (const rec of Object.values(FFX_LOOT_RECORDS)) {
      const name = `m${String(rec.file).padStart(3, '0')}`;
      expect(rec.source, name).toMatch(new RegExp(`^FFX_Data\\.vbf battle/mon/_${name}/${name}\\.bin chunk 4 \\(0x118 bytes\\), sha256/16 [0-9a-f]{16}$`));
    }
  });

  it('a record is plain numbers: nothing is a string, a function or a Map (it is cloned with the battle)', () => {
    for (const rec of Object.values(FFX_LOOT_RECORDS)) {
      expect(structuredClone(rec)).toEqual(rec);
      for (const n of [rec.gil, rec.ap, rec.apOverkill, ...rec.chance, rec.gearChance, ...rec.items, ...rec.qty, ...rec.overkillItems, ...rec.overkillQty, rec.bribeItem, rec.bribeFactor]) expect(Number.isInteger(n)).toBe(true);
    }
  });
});

describe('every shipped monster has the right record, and its listed rewards are the record\'s', () => {
  /**
   * The Dark Aeons of Chapter XXVII (Mirror Aeons, hidden, FFX only, r50) are not among the 43 files this lane read: their rewards are the chapter's own rows (`data/ffx/enemies/dark-aeons.ts`, "RE section 2
   * loot rows": AP, AP on an Overkill, one always-dropping slot) and carry no `loot` record, so the death keeps the older path for them (`payKill` rolls only a monster that has a record). Not invented here (rule 6):
   * a record for them waits for a read of their files. The lane was built on r49, before the chapter; r51-rc names them so the table stays exact for the other enemies.
   */
  const NO_RECORD: ReadonlySet<string> = new Set([DARK_CINDY_ID, DARK_SANDY_ID, DARK_MINDY_ID, DARK_YOJIMBO_ID, DARK_DAIGORO_ID]);
  const everyone = Object.values(ENEMY_GROUPS_BY_ID).flatMap((g) => [...g.enemies, ...(g.parts ?? [])]);
  const shipped = everyone.filter((e) => !NO_RECORD.has(e.id));

  it('the Dark Aeons of Chapter XXVII carry no loot record (their rewards are the rows in their own enemy file) and every other enemy does', () => {
    const dark = everyone.filter((e) => NO_RECORD.has(e.id));
    expect(new Set(dark.map((e) => e.id))).toEqual(NO_RECORD);
    for (const e of dark) expect(e.rewards.loot, e.id).toBeUndefined();
    for (const e of shipped) expect(e.rewards.loot, e.id).toBeDefined();
  });

  it('every enemy of every FFX formation is in the id-to-file table, and carries a loot record of that file', () => {
    expect(shipped.length).toBeGreaterThan(50);
    for (const e of shipped) {
      expect(FILE_OF[e.id], `${e.id} has no file in the test's table`).toBeDefined();
      expect(e.rewards.loot, `${e.id}`).toBeDefined();
      expect(e.rewards.loot!.file, `${e.id}`).toBe(FILE_OF[e.id]);
    }
  });

  it('ap, apOverkill, gil and the chance, item and quantity lists are the record\'s (with a script\'s writes where it has them)', () => {
    for (const e of shipped) {
      const rec = FIXTURE.rows[String(FILE_OF[e.id])]!;
      const want = { ...rec, ...(SCRIPT_WRITES[e.id] ?? {}) };
      const got = e.rewards.loot!;
      expect({ gil: got.gil, ap: got.ap, apOverkill: got.apOverkill, chance: [...got.chance], gearChance: got.gearChance, items: [...got.items], qty: [...got.qty], overkillItems: [...got.overkillItems], overkillQty: [...got.overkillQty] }, e.id).toEqual({
        gil: want.gil, ap: want.ap, apOverkill: want.apOverkill, chance: want.chance, gearChance: want.gearChance, items: want.items, qty: want.qty, overkillItems: want.overkillItems, overkillQty: want.overkillQty,
      });
      expect(e.rewards.ap, `${e.id} ap`).toBe(want.ap);
      expect(e.rewards.apOverkill, `${e.id} apOverkill`).toBe(want.apOverkill);
      expect(e.rewards.gil, `${e.id} gil`).toBe(want.gil);
      expect(e.rewards.drops, `${e.id} drops`).toEqual(dropsOfRecord(got));
      if (SCRIPT_WRITES[e.id] !== undefined) expect(got.note, `${e.id} says which script writes`).toMatch(/init/);
      else expect(got.note, `${e.id} has no script writes`).toBeUndefined();
    }
  });

  it('the Braska\'s Final Aeon line\'s file table is the test\'s, entry by entry', () => {
    for (const [id, file] of Object.entries(BFA_LINE_FILE)) {
      if (FILE_OF[id] !== undefined) expect(file, id).toBe(FILE_OF[id]);
    }
    expect(BFA_LINE_FILE['possessed-anima']).toBe(168);
    expect(BFA_LINE_FILE['possessed-yojimbo']).toBe(169);
    expect([BFA_LINE_FILE['possessed-cindy'], BFA_LINE_FILE['possessed-sandy'], BFA_LINE_FILE['possessed-mindy']]).toEqual([178, 179, 180]);
  });

  it('a monster whose record pays nothing still has one: the death rolls the three stream-10 draws', () => {
    const zero = shipped.filter((e) => e.rewards.ap === 0 && e.rewards.gil === 0 && e.rewards.drops.length === 0);
    expect(zero.length).toBeGreaterThan(20);
    for (const e of zero) expect(e.rewards.loot, e.id).toBeDefined();
  });

  it('lootRewards refuses a file it has no record for, and lootOf hands out a copy (a battle cannot write through to the data)', () => {
    expect(() => lootRewards(999, { overkillThreshold: 1 })).toThrow(/no loot record/);
    const copy = lootOf(142) as unknown as { chance: number[]; items: number[] };
    copy.chance[0] = 0;
    copy.items[0] = 0;
    expect(FFX_LOOT_RECORDS[142]!.chance[0]).toBe(255);
    expect(FFX_LOOT_RECORDS[142]!.items[0]).toBe(0x2054);
  });
});

describe('every item the records can pay has a name and a row', () => {
  it('ITEM_ID_OF_NUMBER agrees with the Mix chart\'s table of the 112 items', () => {
    for (const [number, id] of Object.entries(ITEM_ID_OF_NUMBER)) expect(MIX_ITEM_IDS[Number(number) - 0x2000], `0x${Number(number).toString(16)}`).toBe(id);
  });

  it('every item number in a shipped record (drops, overkill lists, the Bribe item) is named', () => {
    for (const rec of Object.values(FFX_LOOT_RECORDS)) {
      for (const n of [...rec.items, ...rec.overkillItems, rec.bribeItem]) if (n !== 0) expect(ITEM_ID_OF_NUMBER[n], `m${rec.file}: 0x${n.toString(16)}`).toBeDefined();
    }
  });

  it('every dropped item, and each of the four spheres a Distill status makes, has an item row (the results screen prints its name)', () => {
    const ids = new Set<string>(['power-sphere', 'mana-sphere', 'speed-sphere', 'ability-sphere']);
    for (const rec of Object.values(FFX_LOOT_RECORDS)) for (const n of [...rec.items, ...rec.overkillItems]) if (n !== 0) ids.add(ITEM_ID_OF_NUMBER[n]!);
    for (const id of ids) expect(ITEMS[id], id).toBeDefined();
  });
});

describe('what the records say that the older tables did not (pinned from the records)', () => {
  const rec = (file: number) => FFX_LOOT_RECORDS[file]!;

  it('Seymour at Macalania drops a Blk Magic Sphere, or one time in eight a Special Sphere in its place', () => {
    expect([rec(124).items[0], rec(124).items[1]]).toEqual([0x204f, 0x204c]);
    expect(rec(124).overkillQty.slice(0, 2)).toEqual([2, 2]);
  });

  it('Seymour Omnis drops a Lv. 3 Key Sphere, or one time in eight two of them; two or four on an overkill', () => {
    expect([rec(131).items[0], rec(131).items[1], rec(131).qty[0], rec(131).qty[1]]).toEqual([0x2053, 0x2053, 1, 2]);
    expect(rec(131).overkillQty.slice(0, 2)).toEqual([2, 4]);
  });

  it('Seymour Natus drops two Lv. 2 Key Spheres (four on an overkill), which the older table left out', () => {
    expect([rec(126).items[0], rec(126).qty[0], rec(126).overkillQty[0]]).toEqual([0x2052, 2, 4]);
    expect(lootRewards(126, { overkillThreshold: 3500 }).drops).toEqual([{ itemId: 'lv-2-key-sphere', count: 2 }]);
  });

  it('the Ronso brothers: a Return Sphere, or one time in eight a Friend Sphere; the summary list names the rare entry', () => {
    expect(lootRewards(134, { overkillThreshold: 2500 }).drops).toEqual([{ itemId: 'return-sphere', count: 1, rare: { itemId: 'friend-sphere', count: 1, chance: 12.5 } }]);
  });

  it('every shipped record with a first slot drops it for sure (chance byte 255) and none uses the second slot', () => {
    for (const r of Object.values(FFX_LOOT_RECORDS)) {
      expect([0, 255], `m${r.file} slot 1`).toContain(r.chance[0]);
      expect(r.chance[1], `m${r.file} slot 2`).toBe(0);
    }
  });
});
