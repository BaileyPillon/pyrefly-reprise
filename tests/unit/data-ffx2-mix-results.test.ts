/**
 * The 53 FFX-2 Mix result rows as data (re-parity RC9, lane X2-G; **FFX-2 only**): `src/data/ffx2/command-records/mix.ts` (the game's rows as numbers),
 * `src/data/ffx2/abilities/mix-results.ts` (one ability of ours per row) and the engine's id tables (`src/battle/ffx2/adapt/mix.ts`).
 *
 * The records are pinned field by field against a numbers-only fixture read from `command.bin` of the Steam build (`tests/fixtures/parity/ffx2/mix_rows.json`; the three copies of the
 * table agree, and the fixture equals the checked note's own export on 53 of 53 rows). The names are the wiki's, found independently: the wiki oracle of `helpers/ffx2MixWiki.ts` derives
 * which name each of the 53 rows answers to from the 4,624 pairs themselves, and the abilities carry those names.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AbilityDef, FFX2CommandRecord } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { COMMAND_RECORDS_MIX } from '../../src/data/ffx2/command-records/mix.ts';
import { COMMAND_RECORDS_ITEMS } from '../../src/data/ffx2/command-records/items.ts';
import { FFX2_COMMAND_RECORDS } from '../../src/data/ffx2/command-records/index.ts';
import { mixResultAbilities } from '../../src/data/ffx2/abilities/mix-results.ts';
import { MIX_ITEM_IDS, MIX_RESULT_IDS } from '../../src/battle/ffx2/adapt/mix.ts';
import { MIX_RESULT_COMMANDS, mixRecipe } from '../../src/battle/ffx2/kernel/mix-recipe.ts';
import { deriveRecord } from '../../src/battle/ffx2/adapt/command.ts';
import { elementMask } from '../../src/battle/ffx2/adapt/words.ts';
import { resolveAbilityFx } from '../../src/engine/spellfx/SpellFxLookup.ts';
import { SPELL_FX_IDS } from '../../src/engine/spellfx/SpellFxRegistry.ts';
import { WIKI_ROWS, wikiAgreement } from './helpers/ffx2MixWiki.ts';

type Sparse = Record<string, number>;
interface Row {
  id: number; category: number; flagsTarget: number; flagsMisc: number; flagsDamage: number; damageClass: number; formula: number; critByte: number; accuracy: number; power: number;
  hits: number; shatter: number; element: number; killer: number; costMp: number; costAtb: number; costCast: number; casterAnim: number; charges: boolean; magicCancel: number;
  status1: Sparse; status2: Sparse; statusTime: Sparse;
}
const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/mix_rows.json', import.meta.url)), 'utf8')) as { stub: Record<string, number | boolean>; rows: Record<string, Row> };
const ROWS = Object.values(FIXTURE.rows);
const slug = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sparse = (s: Readonly<Record<number, number>> | undefined): Sparse => Object.fromEntries(Object.entries(s ?? {}).map(([k, v]) => [k, v]));
const byId = (): Array<[string, FFX2CommandRecord]> => Object.entries(COMMAND_RECORDS_MIX);

describe('the 53 records are the game\'s rows', () => {
  it('one record per row of the fixture, every field equal (a row whose caster animation is a cast class charges, so the cast cost 80 stands)', () => {
    expect(ROWS).toHaveLength(53);
    expect(byId()).toHaveLength(53);
    for (const [id, record] of byId()) {
      const row = FIXTURE.rows[`0x${record.id.toString(16)}`];
      expect(row, `${id}: no fixture row for 0x${record.id.toString(16)}`).toBeDefined();
      if (row === undefined) continue;
      expect(row.charges, `${id}: caster animation ${row.casterAnim} is a cast class`).toBe(true);
      expect({
        id: record.id, category: record.category, flagsTarget: record.flagsTarget, flagsMisc: record.flagsMisc, flagsDamage: record.flagsDamage, damageClass: record.damageClass,
        formula: record.formula, critByte: record.critByte, accuracy: record.accuracy, power: record.power, hits: record.hits, shatter: record.shatter, element: record.element,
        killer: record.killer, costAtb: record.costAtb, costCast: record.costCast, status1: sparse(record.status1), status2: sparse(record.status2), statusTime: sparse(record.statusTime),
      }, id).toEqual({
        id: row.id, category: row.category, flagsTarget: row.flagsTarget, flagsMisc: row.flagsMisc, flagsDamage: row.flagsDamage, damageClass: row.damageClass,
        formula: row.formula, critByte: row.critByte, accuracy: row.accuracy, power: row.power, hits: row.hits, shatter: row.shatter, element: row.element,
        killer: row.killer, costAtb: row.costAtb, costCast: row.costCast, status1: row.status1, status2: row.status2, statusTime: row.statusTime,
      });
      expect(row.magicCancel, `${id}: no magic cancel`).toBe(0);
      expect(row.costMp, `${id}: no MP cost`).toBe(0);
    }
  });

  it('what the 53 rows share, which the note states: misc flag 0x100000, accuracy formula 0 (never roll), a charged cast of 80 with no ATB cost, a first-aid-or-damage class of 0 to 3', () => {
    for (const row of ROWS) {
      expect(row.flagsMisc & 0x100000, 'the Mix flag').toBe(0x100000);
      expect((row.flagsMisc >> 3) & 7, 'accuracy formula 0').toBe(0);
      expect([row.costAtb, row.costCast, row.casterAnim]).toEqual([0, 80, 36]);
      expect(row.damageClass).toBeGreaterThanOrEqual(0);
      expect(row.damageClass).toBeLessThanOrEqual(3);
    }
    // 0x31AD is not a Mix result and 0x3058, the Mix command itself, is a stub the HUD never queues (menu byte 9, no damage)
    expect(FIXTURE.rows['0x31ad']).toBeUndefined();
    expect(FIXTURE.stub).toMatchObject({ id: 0x3058, flagsMisc: 2, costCast: 80, casterAnim: 0, charges: false });
  });

  it('the records are exactly the rows the recipe function can make, and they are merged into the catalog\'s table', () => {
    expect(byId().map(([, r]) => r.id).sort((a, b) => a - b)).toEqual([...MIX_RESULT_COMMANDS]);
    for (const [id, record] of byId()) expect(FFX2_COMMAND_RECORDS[id], id).toBe(record);
    expect(new Set(byId().map(([id]) => id)).size).toBe(53);
  });

  it('the 28 damaging rows\' powers and hit counts are the research\'s (FFX2-G06 4.4 against research/ffx2-combat-core.md 2.9.3)', () => {
    const want: Array<[number, number, number]> = [
      [0x3183, 3, 1], [0x3184, 14, 1], [0x3185, 30, 1], [0x3186, 110, 1], // Pineapple, Potato Masher, Cluster Bomb, Sunburst
      [0x3189, 2, 3], [0x318a, 4, 3], [0x318b, 8, 4], // the fire line
      [0x318e, 2, 3], [0x318f, 4, 3], [0x3190, 8, 4], [0x3193, 2, 3], [0x3194, 4, 3], [0x3195, 8, 4], [0x3198, 2, 3], [0x3199, 4, 3], [0x319a, 8, 4],
      [0x31a1, 1, 8], [0x31a2, 12, 8], // Archangel, White Hole
      [0x3187, 4, 1], [0x3188, 20, 1], // Blaster Mine, Hazardous Shell
      [0x318c, 3, 3], [0x318d, 6, 3], [0x3191, 3, 3], [0x3192, 6, 3], [0x3196, 3, 3], [0x3197, 6, 3], [0x319b, 3, 3], [0x319c, 6, 3], // the status lines
    ];
    expect(want).toHaveLength(28);
    for (const [command, power, hits] of want) {
      const row = FIXTURE.rows[`0x${command.toString(16)}`] as Row;
      expect([row.power, row.hits], `0x${command.toString(16)}`).toEqual([power, hits]);
    }
  });
});

describe('one ability of ours per row', () => {
  const abilities = (): Array<[string, AbilityDef]> => byId().map(([id]) => [id, data.ABILITIES[id] as AbilityDef]);

  it('53 abilities, ids unique and `x2-mix-<name>`, in the catalog with their record attached, on no dressphere\'s ladder', () => {
    expect(mixResultAbilities).toHaveLength(53);
    expect(new Set(mixResultAbilities.map((a) => a.id)).size).toBe(53);
    for (const [id, ability] of abilities()) {
      expect(ability, id).toBeDefined();
      expect(ability.id).toBe(id);
      expect(id).toMatch(/^x2-mix-[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ability.game).toBe('ffx2');
      expect(ability.category).toBe('item');
      expect(ability.ffx2Record, `${id}: the record is attached`).toBe(COMMAND_RECORDS_MIX[id]);
    }
    const ladder = new Set<string>();
    for (const sphere of [...Object.values(data.STANDARD_DRESSPHERES), ...Object.values(data.SPECIAL_DRESSPHERES)]) {
      for (const entry of Array.isArray(sphere.abilities) ? sphere.abilities : Object.values(sphere.abilities).flat()) ladder.add(entry.abilityId);
    }
    for (const [id] of abilities()) expect(ladder.has(id), `${id} is on no ladder: only a Mix makes it`).toBe(false);
  });

  it('the names are the wiki\'s, found independently from the pairs: each row answers to one name, and the id is the name', () => {
    const wiki = wikiAgreement(mixRecipe);
    for (const [id, record] of byId()) {
      const name = wiki.names.get(record.id);
      expect(name, `0x${record.id.toString(16)}`).toBeDefined();
      expect((data.ABILITIES[id] as AbilityDef).name).toBe(name);
      expect(id).toBe(`x2-mix-${slug(name as string)}`);
    }
  });

  it('the engine\'s id table (command to ability) is these abilities, and its item table is the game\'s 68 items in our ids, agreeing with the research list and the catalog', () => {
    expect(Object.keys(MIX_RESULT_IDS)).toHaveLength(53);
    for (const [id, record] of byId()) expect(MIX_RESULT_IDS[record.id], id).toBe(id);
    expect(MIX_ITEM_IDS).toHaveLength(68);
    expect(new Set(MIX_ITEM_IDS).size).toBe(68);
    // typed twice (the research's names in row order in the helper, the ids in the adapter) and equal
    MIX_ITEM_IDS.forEach((id, row) => expect(id, `row ${row}`).toBe(`x2-${slug((WIKI_ROWS[row] as { name: string }).name)}`));
    // the repo's own game-row records of the items (the 24 the chapters reach) pin the row of each effect ability, and so of its item
    for (const [effectId, record] of Object.entries(COMMAND_RECORDS_ITEMS)) {
      expect(MIX_ITEM_IDS[record.id - 0x2000], `${effectId} is row 0x${record.id.toString(16)}`).toBe(`x2-${effectId.slice('x2-item-'.length)}`);
    }
    // every item the catalog lets the party use in battle is one of the 68
    for (const item of Object.values(data.ITEMS)) if (item.usableInBattle) expect(MIX_ITEM_IDS, item.id).toContain(item.id);
  });

  it('each ability mirrors its row where the engine would otherwise derive it itself: the only difference is the grenade line\'s damage type, kept `other` so a grenade is not drawn as a slash', () => {
    const differences: Record<string, string[]> = {};
    for (const [id, ability] of abilities()) {
      const r = ability.ffx2Record as FFX2CommandRecord;
      const own = deriveRecord(ability);
      const d: string[] = [];
      if (own.formula !== r.formula) d.push(`formula ${own.formula}->${r.formula}`);
      if (own.power !== r.power) d.push(`power ${own.power}->${r.power}`);
      if (own.hits !== r.hits) d.push(`hits ${own.hits}->${r.hits}`);
      if (own.element !== r.element) d.push(`element ${own.element}->${r.element}`);
      if (elementMask(ability.element) !== r.element) d.push('element mask');
      if ((own.flagsDamage & 3) !== (r.flagsDamage & 3)) d.push(`type ${own.flagsDamage & 3}->${r.flagsDamage & 3}`);
      if (((own.flagsMisc >> 3) & 7) !== ((r.flagsMisc >> 3) & 7)) d.push('rolls');
      if (((own.flagsDamage & 4) !== 0) !== ((r.flagsDamage & 4) !== 0)) d.push('crit');
      if ((own.flagsDamage & 0x80) !== (r.flagsDamage & 0x80)) d.push('cap');
      if ((own.flagsDamage & 0x10) !== (r.flagsDamage & 0x10)) d.push('heals');
      if ((own.flagsDamage & 0x20) !== (r.flagsDamage & 0x20)) d.push('cleanse');
      if ((own.flagsMisc & 0x100) !== (r.flagsMisc & 0x100)) d.push('absorbs');
      if ((own.flagsTarget & 0x40) !== (r.flagsTarget & 0x40)) d.push('dead target');
      if ((own.flagsMisc & 0x40000) !== (r.flagsMisc & 0x40000)) d.push('needs dead');
      if ((own.flagsMisc & 0x4000) !== (r.flagsMisc & 0x4000)) d.push('random spread');
      if (own.shatter !== r.shatter) d.push(`shatter ${own.shatter}->${r.shatter}`);
      if (own.costAtb !== r.costAtb) d.push(`recovery ${own.costAtb}->${r.costAtb}`);
      if (own.costCast !== r.costCast) d.push(`cast ${own.costCast}->${r.costCast}`);
      if (JSON.stringify(sparse(own.status1)) !== JSON.stringify(sparse(r.status1))) d.push(`status1 ${JSON.stringify(sparse(own.status1))}->${JSON.stringify(sparse(r.status1))}`);
      if (JSON.stringify(sparse(own.status2)) !== JSON.stringify(sparse(r.status2))) d.push(`status2 ${JSON.stringify(sparse(own.status2))}->${JSON.stringify(sparse(r.status2))}`);
      if (d.length > 0) differences[id] = d;
    }
    const grenades = ['pineapple', 'potato-masher', 'cluster-bomb', 'sunburst', 'blaster-mine', 'hazardous-shell'].map((n) => `x2-mix-${n}`);
    expect(Object.keys(differences).sort()).toEqual(grenades.sort());
    for (const id of grenades) expect(differences[id]).toEqual(['type 0->1']);
  });

  it('the targeting is the row\'s: bit 1 is the opposing side, bit 2 the whole side, the spread flag picks a random target a hit', () => {
    for (const [id, ability] of abilities()) {
      const r = ability.ffx2Record as FFX2CommandRecord;
      const enemy = (r.flagsTarget & 2) !== 0;
      const all = (r.flagsTarget & 4) !== 0;
      const spread = (r.flagsMisc & 0x4000) !== 0;
      const want = spread ? 'random-enemy' : enemy ? (all ? 'all-enemies' : 'single-enemy') : all ? 'all-allies' : 'single-ally';
      expect(ability.targeting, id).toBe(want);
      expect(ability.flags.includes('can-target-dead'), id).toBe((r.flagsTarget & 0x40) !== 0);
    }
  });

  it('presentation: no new art. Every result draws a spell effect the layer already has, and says which', () => {
    const families = new Set<string>();
    for (const [id, ability] of abilities()) {
      const family = ability.extra?.['fxFamily'] as string;
      families.add(family);
      expect(resolveAbilityFx(id, 'ffx2'), id).toBe(family);
      expect(SPELL_FX_IDS as readonly string[], id).toContain(family);
    }
    expect([...families].sort()).toEqual(['bloom', 'cure', 'fire', 'holy', 'ice', 'thunder', 'water']);
  });
});
