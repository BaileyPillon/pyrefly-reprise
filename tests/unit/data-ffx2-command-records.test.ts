/**
 * **The FFX-2 command records, attached to the ability catalog** (re-parity W3; **FFX-2 only**).
 *
 * `src/data/ffx2/command-records/` (and `src/battle/ffx2/fallback-records.ts`, `adapt/attack-records.ts`) give each
 * ability the game's own command row, which the parity kernels read. This file pins:
 *
 *  - every attached record is the game's row, field for field: `tests/fixtures/parity/ffx2/command_rows.json` holds the
 *    206 rows the seven chapters can reach (numbers only; `research/re-ffx2-commands.md`; Osmose's row was added by AI-FFX2-b); the deliberate
 *    overrides are listed in {@link OVERRIDES} (none is left: both Triple Attacks are the game's rows since re-parity AI lanes b and c);
 *  - every ability the seven chapters can reach has a record or is on the short list of ours that have none;
 *  - the numbers an ability carries itself that differ from its record (the record wins in the engine) are a fixture,
 *    `ability_differences.json`: a new or fixed difference must change it (regenerate with PYREFLY_UPDATE_FIXTURES=1);
 *  - AGENTS.md rule 5 (magic never rolls): which reachable magical rows the game rolls, and that the engine holds them;
 *  - the assumptions the adapter makes about data (a random-target move's targeting agrees with the row's flag).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AbilityDef, FFX2CommandRecord } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { FFX2_COMMAND_RECORDS, NO_COMMAND_RECORD } from '../../src/data/ffx2/command-records/index.ts';
import { MONSTER_RECORDS } from '../../src/data/ffx2/monster-records/index.ts';
import { FALLBACK_RECORDS } from '../../src/battle/ffx2/fallback-records.ts';
import { FALLBACK_ABILITY_IDS, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { partyAttackRecord } from '../../src/battle/ffx2/adapt/attack-records.ts';
import { FORMULA_NUMBER, accuracyFormula, deriveRecord, resolveCommand } from '../../src/battle/ffx2/adapt/command.ts';
import { elementMask } from '../../src/battle/ffx2/adapt/words.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../src/battle/ffx2/adapt/slots.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';

type Sparse = Record<string, number>;
interface Row {
  id: number;
  name: string;
  category: number;
  flagsTarget: number;
  flagsMisc: number;
  flagsDamage: number;
  damageClass: number;
  formula: number;
  critByte: number;
  accuracy: number;
  power: number;
  hits: number;
  shatter: number;
  element: number;
  killer: number;
  /** `Cmd+0x22` and `Cmd+0x24`, and whether the row's caster animation is a cast class (re-parity W4): a row that is not never charges. */
  costAtb: number;
  costCast: number;
  charges: boolean;
  status1: Sparse;
  status2: Sparse;
  statusTime: Sparse;
}

const here = (name: string): string => fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url));
const ROWS = JSON.parse(readFileSync(here('command_rows.json'), 'utf8')) as Record<string, Row>;
const rowOf = (id: number): Row | undefined => ROWS[`0x${id.toString(16)}`];

/**
 * The records that deliberately differ from the game's row, with the row's value, and why. Each is a decision that
 * waits for Bailey (never tune a boss number), not a bug the wiring may fix.
 */
const OVERRIDES: Readonly<Record<string, Partial<Row>>> = {
  // (Mega Flare was held at the authored 24 over the row's 14 until Bailey, 2026-10-09: "Use 14 from the files". Both of its
  // records carry the row's power now, so neither is an override any more; the Mega Flare test below pins the 14.)
  // (Both Triple Attacks were overrides, the game queues Chain Attack three times: Shiva's is three polls of the one-hit Chain Attack since AI-FFX2-b, Baralai's three Chain Attack commands at three fixed girls since AI lane C, each the exact row 0x4100, so neither is an override any more.)
};

const sparse = (s: Readonly<Record<number, number>> | undefined): Sparse => {
  const out: Sparse = {};
  for (const [k, v] of Object.entries(s ?? {})) out[k] = v;
  return out;
};

function expectIsRow(label: string, record: FFX2CommandRecord, override: Partial<Row> = {}): void {
  // The hidden Experiment's seven rows are the new-chapters RE lane's, pinned field by field against their own numbers-only fixture (tests/fixtures/parity/ffx2/experiment_rows.json,
  // tests/unit/chapters/experiment-engine.test.ts); this fixture holds the 205 rows the seven listed chapters can reach.
  if (label.startsWith('x2-experiment-')) return;
  // The hidden Tourist Trap's five rows (0x40a1 to 0x40a5) are the RE review's, pinned against their own numbers-only fixture (tests/fixtures/parity/ffx2/tourist_trap_rows.json, tests/unit/chapters/tourist-trap-engine.test.ts).
  if (label.startsWith('x2-yojimbo-') || label.startsWith('x2-daigoro-')) return;
  // The hidden Valefor at Besaid's three rows (monmagic 0x4091 to 0x4093) are the RE review's, pinned against their own numbers-only fixture (tests/fixtures/parity/ffx2/besaid_valefor_rows.json, tests/unit/chapters/besaid-valefor-data.test.ts).
  if (label.startsWith('x2-valefor-')) return;
  // The Alchemist's 53 Mix result rows (0x3183 to 0x31B8 except 0x31AD, re-parity RC9 lane X2-G) are pinned against their own numbers-only fixture (tests/fixtures/parity/ffx2/mix_rows.json, tests/unit/data-ffx2-mix-results.test.ts).
  if (label.startsWith('x2-mix-')) return;
  // The hidden Angra Mainyu's fifteen rows (the boss's eight, Zarich's five, Tawrich's two: monmagic 0x4129 to 0x412d, 0x41f1 to 0x41f4, the Leblanc Osmose 0x406d and six party rows) are the RE note's, pinned
  // against their own numbers-only fixture (tests/fixtures/parity/ffx2/angra_mainyu_rows.json, tests/unit/chapters/angra-mainyu-data.test.ts).
  if (label.startsWith('x2-angra-') || label.startsWith('x2-zarich-') || label.startsWith('x2-tawrich-')) return;
  const row = rowOf(record.id);
  expect(row, `${label}: no game row 0x${record.id.toString(16)}`).toBeDefined();
  if (!row) return;
  const want = { ...row, ...override };
  expect({
    id: record.id,
    category: record.category,
    flagsTarget: record.flagsTarget,
    flagsMisc: record.flagsMisc,
    flagsDamage: record.flagsDamage,
    damageClass: record.damageClass,
    formula: record.formula,
    critByte: record.critByte,
    accuracy: record.accuracy,
    power: record.power,
    hits: record.hits,
    shatter: record.shatter,
    element: record.element,
    killer: record.killer,
    costAtb: record.costAtb,
    costCast: record.costCast,
    status1: sparse(record.status1),
    status2: sparse(record.status2),
    statusTime: sparse(record.statusTime),
  }, label).toEqual({
    id: want.id,
    category: want.category,
    flagsTarget: want.flagsTarget,
    flagsMisc: want.flagsMisc,
    flagsDamage: want.flagsDamage,
    damageClass: want.damageClass,
    formula: want.formula,
    critByte: want.critByte,
    accuracy: want.accuracy,
    power: want.power,
    hits: want.hits,
    shatter: want.shatter,
    element: want.element,
    killer: want.killer,
    costAtb: want.costAtb,
    costCast: want.charges ? want.costCast : 0, // a row whose caster animation is not a cast class (Mix, a menu stub) never charges
    status1: want.status1,
    status2: want.status2,
    statusTime: want.statusTime,
  });
}

/** Every ability the seven FFX-2 chapters can reach: the party kits, the bags, and what the enemies are given. */
function reachableIds(): Set<string> {
  const byId = new Map<string, AbilityDef>(Object.values(data.ABILITIES).map((a) => [a.id, a]));
  for (const id of FALLBACK_ABILITY_IDS) {
    const a = defaultAbilities.get(id);
    if (a !== undefined) byId.set(id, a);
  }
  const used = new Set<string>(['attack']);
  const chapters = CHAPTERS.filter((c) => c.game === 'ffx2');
  for (const c of chapters) {
    const build = c.buildRef as unknown as {
      members: Array<{ abilitiesLearned?: Record<string, { learned?: string[] }> }>;
      inventory?: Array<{ itemId: string }>;
    };
    for (const m of build.members) {
      for (const v of Object.values(m.abilitiesLearned ?? {})) for (const id of v.learned ?? []) used.add(id);
    }
    for (const it of build.inventory ?? []) {
      const item = data.ITEMS[it.itemId];
      if (item !== undefined && typeof item.effect === 'string') used.add(item.effect);
    }
    let group: string | undefined = c.enemyGroupRef.id;
    while (group !== undefined) {
      const g: (typeof data.ENEMY_GROUPS_BY_ID)[string] | undefined = data.ENEMY_GROUPS_BY_ID[group];
      if (g === undefined) break;
      for (const e of [...g.enemies, ...(g.parts ?? [])]) for (const id of e.abilityIds) used.add(id);
      group = g.nextGroupId;
    }
  }
  for (let changed = true; changed; ) {
    changed = false;
    for (const id of [...used]) {
      const walk = (v: unknown): void => {
        if (typeof v === 'string') {
          if (byId.has(v) && !used.has(v)) { used.add(v); changed = true; }
        } else if (Array.isArray(v)) v.forEach(walk);
        else if (v !== null && typeof v === 'object') Object.values(v).forEach(walk);
      };
      walk(byId.get(id)?.extra ?? {});
    }
  }
  return used;
}

function withRecord(id: string): AbilityDef | undefined {
  return data.ABILITIES[id] ?? defaultAbilities.get(id);
}

describe('FFX-2 command records are the game\'s rows', () => {
  it('every data-layer record equals its row', () => {
    for (const [id, record] of Object.entries(FFX2_COMMAND_RECORDS)) expectIsRow(id, record, OVERRIDES[id]);
  });

  it("Mega Flare is the game's power 14 in both of its ids, record and ability (Bailey, 2026-10-09: \"Use 14 from the files\")", () => {
    expect(rowOf(0x409c)?.power, "the game's row").toBe(14);
    expect(FFX2_COMMAND_RECORDS['x2-bahamut-mega-flare']?.power, "the data ability's record").toBe(14);
    expect(FALLBACK_RECORDS['mega-flare']?.power, "the engine table's record").toBe(14);
    expect(data.ABILITIES['x2-bahamut-mega-flare']?.power, 'the data ability').toBe(14);
    expect(defaultAbilities.get('mega-flare')?.power, "the engine table's ability").toBe(14);
    expect(OVERRIDES['x2-bahamut-mega-flare'] ?? OVERRIDES['mega-flare'], 'no override holds it back').toBeUndefined();
  });

  it('Russian Roulette is the game\'s five rows in the script\'s order, one picked per cast, not their union', () => {
    const roulette = FFX2_COMMAND_RECORDS['x2-logos-russian-roulette']!;
    // 0 Death 30, 1 Curse 100, 2 Silence 100 (the script calls it Slow; the row builds slot 3), 3 Petrify 30, 4 Poison 100.
    expect(roulette.pickOne?.map((v) => v.id)).toEqual([0x40e9, 0x40ea, 0x40eb, 0x40ee, 0x40ef]);
    expect(roulette.pickOne?.map((v) => sparse(v.status1))).toEqual([{ '0': 30 }, { '8': 100 }, { '3': 100 }, { '1': 30 }, { '5': 100 }]);
    for (const variant of roulette.pickOne ?? []) expectIsRow(`roulette 0x${variant.id.toString(16)}`, variant);
    expectIsRow('roulette', roulette); // the record itself is the first row
    // Each row carries exactly one status chance, so the command inflicts at most one per cast.
    for (const variant of roulette.pickOne ?? []) expect(Object.keys(variant.status1 ?? {}).length).toBe(1);
    // ...and the five rows cost the same, which is why the engine reads the first row's costs before the pick (`adapt/command.ts commandCosts`).
    for (const variant of roulette.pickOne ?? []) expect([variant.costAtb, variant.costCast]).toEqual([roulette.costAtb, roulette.costCast]);
  });

  it('every fallback record equals its row', () => {
    for (const [id, record] of Object.entries(FALLBACK_RECORDS)) expectIsRow(`fallback ${id}`, record, OVERRIDES[id]);
  });

  it('the party Attack rows and each monster\'s own Attack row equal theirs', () => {
    for (const d of ['gunner', 'warrior', 'thief', 'trainer', 'floral-fallal', 'full-throttle', 'machina-maw', 'gun-mage']) {
      expectIsRow(`attack of ${d}`, partyAttackRecord(d));
    }
    for (const [key, monster] of Object.entries(MONSTER_RECORDS)) {
      if (monster.plainAttack !== undefined) expectIsRow(`plain attack of ${key}`, monster.plainAttack);
    }
  });

  it('the attached records are the ones the catalog serves, and only the overrides differ', () => {
    for (const [id, record] of Object.entries(FFX2_COMMAND_RECORDS)) {
      const ability = data.ABILITIES[id];
      if (ability === undefined) continue; // a record for an ability the catalog does not carry would be dead data
      expect(ability.ffx2Record, id).toBe(record);
    }
    const unreachable = Object.keys(FFX2_COMMAND_RECORDS).filter((id) => data.ABILITIES[id] === undefined && defaultAbilities.get(id) === undefined);
    expect(unreachable).toEqual([]);
  });
});

describe('what a command costs (re-parity W4): the ATB cost sets the recovery, the cast cost the charge', () => {
  it('the rows the chapters lean on: Attack 70 / 0, Fire 0 / 70, an item 40 / 40, Steal 50 / 0, Trigger Happy 120 / 0, the Warrior Breaks 0 / 70', () => {
    const cost = (id: number): [number | undefined, number | undefined] => {
      const r = rowOf(id);
      return [r?.costAtb, r?.charges ? r.costCast : 0];
    };
    expect(cost(0x302d)).toEqual([70, 0]);
    expect(cost(0x30a5)).toEqual([0, 70]);
    expect(cost(0x2000)).toEqual([40, 40]);
    expect(cost(0x30bf)).toEqual([50, 0]);
    expect(cost(0x3032)).toEqual([120, 0]);
    for (const id of [0x3065, 0x3066, 0x3067, 0x3068]) expect(cost(id), `0x${id.toString(16)}`).toEqual([0, 70]);
  });

  it('the Alchemist Mix row says 80 but its caster animation (0) is not a cast class, so it never charges; every other row with a cast cost does', () => {
    const rows = Object.entries(ROWS).filter(([, r]) => r.costCast > 0 && !r.charges).map(([k, r]) => `${k} ${r.name}`);
    expect(rows).toEqual(['0x3058 Mix']);
  });

  it('every record the engine can run carries both costs (a record without them would fall back to the ability old tier)', () => {
    const all = [
      ...Object.entries(FFX2_COMMAND_RECORDS),
      ...Object.entries(FALLBACK_RECORDS),
      ...Object.entries(MONSTER_RECORDS).flatMap(([k, m]) => [
        ...(m.plainAttack !== undefined ? [[`${k} attack`, m.plainAttack] as const] : []),
        ...Object.entries(m.commands ?? {}).map(([c, r]) => [`${k} ${c}`, r] as const),
      ]),
    ];
    const bare = all.filter(([, r]) => r.costAtb === undefined || r.costCast === undefined).map(([k]) => k);
    expect(bare).toEqual([]);
    expect(all.length).toBeGreaterThan(250);
  });
});

describe('FFX-2 command record coverage', () => {
  const used = reachableIds();

  it('reaches the abilities the chapters use (a sanity floor, so an empty set cannot pass)', () => {
    expect(used.size).toBeGreaterThan(150);
  });

  it('every reachable ability has a record, or is on the short list of ours the game has no row for', () => {
    const missing: string[] = [];
    for (const id of used) {
      const a = withRecord(id);
      if (a === undefined || a.ffx2Record !== undefined) continue;
      if (id === 'attack' || NO_COMMAND_RECORD[id] !== undefined) continue;
      missing.push(id);
    }
    expect(missing).toEqual([]);
  });

  it('no id is both recorded and on the no-record list', () => {
    expect(Object.keys(NO_COMMAND_RECORD).filter((id) => FFX2_COMMAND_RECORDS[id] !== undefined || FALLBACK_RECORDS[id] !== undefined)).toEqual([]);
  });

  it('a random-target ability is a random-target row, and a row that deals one hit per target is not', () => {
    const wrong: string[] = [];
    for (const id of used) {
      const a = withRecord(id);
      const r = a?.ffx2Record;
      if (a === undefined || r === undefined) continue;
      const randomAbility = a.targeting === 'random-enemy' || a.targeting === 'random-ally';
      const randomRow = (r.flagsMisc & 0x4000) !== 0;
      if (randomAbility !== randomRow) wrong.push(`${id}: ability ${a.targeting}, row ${randomRow ? 'random' : 'not random'}`);
    }
    expect(wrong).toEqual(KNOWN_TARGETING_DIFFERENCES);
  });

  it('the engine spreads the hits of every random-target ability over random targets, whatever its row says', () => {
    const user = aiUnit('spreader', 'enemy');
    for (const id of used) {
      const a = withRecord(id);
      if (a === undefined || (a.targeting !== 'random-enemy' && a.targeting !== 'random-ally')) continue;
      expect(resolveCommand(a, user).hit.randomTargets, id).toBe(true);
    }
  });
});

/**
 * Reachable abilities whose targeting and row disagree about random targets. Black Sky is an all-enemies ability whose row
 * spreads its hits over random targets: the row (the game) wins. The four others are scripts that pick a random target
 * each hit while the game's row is an ordinary single-target command: the engine's targeting asks for the random pick
 * (`adapt/command.ts resolveCommand`), so they keep hitting one random target per hit, not every target.
 */
const KNOWN_TARGETING_DIFFERENCES: string[] = [
  'x2-dark-knight-black-sky: ability all-enemies, row random',
  'x2-shuyin-attack: ability random-enemy, row not random',
  'x2-anima-oblivion: ability random-enemy, row not random',
];

describe('AGENTS.md rule 5 (magic never rolls) against the game\'s rows', () => {
  const used = reachableIds();
  const user = aiUnit('rule5-user', 'party');

  it('lists the reachable magical rows the game rolls: Enchanted Ammo (agrees, canMiss) and Death (held)', () => {
    const rolling: string[] = [];
    for (const id of used) {
      const r = withRecord(id)?.ffx2Record;
      if (r === undefined) continue;
      if ((r.flagsDamage & 3) === 2 && accuracyFormula(r.flagsMisc) !== 0) rolling.push(`${id}:f${accuracyFormula(r.flagsMisc)}`);
    }
    expect(rolling.sort()).toEqual(['x2-dark-knight-death:f4', 'x2-gunner-enchanted-ammo:f2']);
  });

  it('holds Death at formula 0 (rule 5) and lets Enchanted Ammo roll (its sourced canMiss: true)', () => {
    const death = withRecord('x2-dark-knight-death')!;
    const ammo = withRecord('x2-gunner-enchanted-ammo')!;
    const heldDeath = resolveCommand(death, user);
    expect(heldDeath.ruleFive).toBe(true);
    expect(heldDeath.accuracyFormula).toBe(0);
    const rollingAmmo = resolveCommand(ammo, user);
    expect(rollingAmmo.ruleFive).toBe(false);
    expect(rollingAmmo.accuracyFormula).toBe(2);
  });

  it('holds no physical row: every reachable physical row rolls the formula the game gives it', () => {
    for (const id of used) {
      const a = withRecord(id);
      const r = a?.ffx2Record;
      if (a === undefined || r === undefined || (r.flagsDamage & 3) !== 1) continue;
      expect(resolveCommand(a, user).accuracyFormula, id).toBe(accuracyFormula(r.flagsMisc));
    }
  });
});

describe('where an ability\'s own numbers differ from its record (the record wins)', () => {
  const used = reachableIds();
  const FIELDS = ['formula', 'power', 'hits', 'element'] as const;

  function differences(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const id of [...used].sort()) {
      const a = withRecord(id);
      const r = a?.ffx2Record;
      if (a === undefined || r === undefined) continue;
      const d: string[] = [];
      const derived = deriveRecord(a);
      if (a.formula !== 'none' && FORMULA_NUMBER[a.formula] !== undefined && derived.formula !== r.formula) d.push(`formula ${derived.formula}->${r.formula}`);
      if (a.formula === 'none' && r.damageClass !== 0 && r.power !== 0) d.push(`none->class ${r.damageClass} formula ${r.formula} power ${r.power}`);
      if (a.formula !== 'none' && derived.power !== r.power && a.formula !== 'multiple') d.push(`power ${derived.power}->${r.power}`);
      if (derived.hits !== r.hits && r.hits !== 0) d.push(`hits ${derived.hits}->${r.hits}`);
      if (elementMask(a.element) !== r.element) d.push(`element ${elementMask(a.element)}->${r.element}`);
      if ((derived.flagsDamage & 3) !== (r.flagsDamage & 3) && a.formula !== 'none') d.push(`type ${derived.flagsDamage & 3}->${r.flagsDamage & 3}`);
      const ownRolls = accuracyFormula(derived.flagsMisc) !== 0;
      const gameRolls = accuracyFormula(r.flagsMisc) !== 0;
      if (ownRolls !== gameRolls) d.push(`rolls ${ownRolls}->${gameRolls}`);
      if (((derived.flagsDamage & 4) !== 0) !== ((r.flagsDamage & 4) !== 0)) d.push(`crit ${(derived.flagsDamage & 4) !== 0}->${(r.flagsDamage & 4) !== 0}`);
      // The ATB cost and the cast cost (re-parity W4): the ability's own recovery value (70, 140 for 2xRT) and charge tier, against the row's.
      if ((derived.costAtb ?? 70) !== (r.costAtb ?? 70)) d.push(`recovery ${derived.costAtb ?? 70}->${r.costAtb ?? 70}`);
      if ((derived.costCast ?? 0) !== (r.costCast ?? 0)) d.push(`cast ${derived.costCast ?? 0}->${r.costCast ?? 0}`);
      // The damage limit: only whether the row forces 99999 (0x80) matters; a forced 9999 and the default are the same for an attacker without
      // Break Damage Limit. A move our data says breaks the limit but whose row lacks the bit still breaks it (the cast's authored flag
      // stands in for a monster's word, `resolve-strike.ts`); the list says which.
      if (((derived.flagsDamage & 0x80) !== 0) !== ((r.flagsDamage & 0x80) !== 0)) d.push(`cap ${(derived.flagsDamage & 0x80) !== 0 ? 99999 : 'default'}->${(r.flagsDamage & 0x80) !== 0 ? 99999 : 'default'}`);
      // Status chance bytes and cleanse sets: the game's row against the row our own fields give (timed amounts are not compared: a derived
      // row has none of its own). A byte of 255 lands even through a resist of 255, which our authored 254 does not.
      for (const group of [1, 2] as const) {
        const ours = (group === 1 ? derived.status1 : derived.status2) ?? {};
        const game = (group === 1 ? r.status1 : r.status2) ?? {};
        const slots = [...new Set([...Object.keys(ours), ...Object.keys(game)].map(Number))].sort((x, y) => x - y);
        for (const i of slots) {
          const o = ours[i] ?? 0;
          const g = game[i] ?? 0;
          if (o === g) continue;
          const name = (group === 1 ? GROUP1_STATUS[i] : GROUP2_STATUS[i]?.[0]) ?? `slot${group}.${i}`;
          d.push(o === 0 ? `status +${name} ${g}` : g === 0 ? `status -${name} ${o}` : `status ${name} ${o}->${g}`);
        }
      }
      if (((derived.flagsDamage & 0x20) !== 0) !== ((r.flagsDamage & 0x20) !== 0)) d.push(`cleanse ${(derived.flagsDamage & 0x20) !== 0}->${(r.flagsDamage & 0x20) !== 0}`);
      if (d.length > 0) out[id] = d;
    }
    return out;
  }

  it('matches the pinned list (ability_differences.json)', () => {
    const now = differences();
    const path = here('ability_differences.json');
    if (process.env['PYREFLY_UPDATE_FIXTURES'] === '1') {
      const keys = Object.keys(now);
      writeFileSync(path, `{\n${keys.map((k, i) => `  ${JSON.stringify(k)}: ${JSON.stringify(now[k])}${i < keys.length - 1 ? ',' : ''}`).join('\n')}\n}\n`);
    }
    const pinned = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string[]>;
    expect(now).toEqual(pinned);
    expect(FIELDS.length).toBe(4);
  });
});
