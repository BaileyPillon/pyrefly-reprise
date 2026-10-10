/**
 * **The FFX-2 monster rows, laid on the enemy data** (re-parity W3; **FFX-2 only**).
 *
 * `src/data/ffx2/monster-records/` gives each enemy of the seven chapters the game's monster row
 * (`EnemyDef.ffx2Record`) and corrects, in place, the authored fields the kernels read where the row differs: the
 * Accuracy stat, the status resist bytes, the item-steal byte and the gil Pilfer Gil takes (the percent/Delay/Bribe
 * immunities are read from the row's special word by the kernels, `adapt/words.ts`). This file pins:
 *
 *  - each attached row equals the game's (`tests/fixtures/parity/ffx2/monster_rows.json`, numbers only);
 *  - every enemy and part of the seven chapters has a row, but the ones listed in {@link UNROWED};
 *  - the corrections are applied (and say what they are);
 *  - the fields the wiring does NOT correct (levels, HP, the stat bytes, the element bytes) still differ from the
 *    rows exactly where `monster_differences.json` says: a new or fixed difference must change it
 *    (regenerate with PYREFLY_UPDATE_FIXTURES=1). They are listed in `research/re-ffx2-commands.md` section 7 for Bailey.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AbilityDef, ElementId, EnemyDef, FFX2MonsterRecord } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { MONSTER_RECORDS } from '../../src/data/ffx2/monster-records/index.ts';
import { GROUP1_STATUS, GROUP2_STATUS } from '../../src/battle/ffx2/adapt/slots.ts';
import { affinityBytes } from '../../src/battle/ffx2/adapt/words.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { resolveCommand } from '../../src/battle/ffx2/adapt/command.ts';

type Sparse = Record<string, number>;
interface MonsterRow {
  table: number;
  row: number;
  name: string;
  level: number;
  hp: number;
  mp: number;
  str: number;
  def: number;
  mag: number;
  mdef: number;
  agi: number;
  acc: number;
  eva: number;
  luck: number;
  special: number;
  species: number;
  zantetsu: number;
  stealByte: number;
  stealGil: number;
  steal: number[];
  bribe: number[];
  absorb: number;
  nullify: number;
  half: number;
  weak: number;
  resist1: Sparse;
  resist2: Sparse;
  /** The id of the monster's own Attack row. */
  plainAttack?: number;
  /** The command ids the game gives this monster (monster.bin, the list its scripts choose from). */
  commands: number[];
}

const here = (name: string): string => fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url));
const ROWS = JSON.parse(readFileSync(here('monster_rows.json'), 'utf8')) as Record<string, MonsterRow>;
const sparse = (s: Readonly<Record<number, number>>): Sparse => Object.fromEntries(Object.entries(s));

/** The enemies of the seven chapters with no monster row, and why. */
const UNROWED: Readonly<Record<string, string>> = {};

interface Found { key: string; enemy: EnemyDef }

function chapterEnemies(): Found[] {
  const out: Found[] = [];
  const seen = new Set<string>();
  for (const c of CHAPTERS.filter((x) => x.game === 'ffx2')) {
    let group: string | undefined = c.enemyGroupRef.id;
    while (group !== undefined && !seen.has(group)) {
      seen.add(group);
      const g: (typeof data.ENEMY_GROUPS_BY_ID)[string] | undefined = data.ENEMY_GROUPS_BY_ID[group];
      if (g === undefined) break;
      for (const enemy of [...g.enemies, ...(g.parts ?? [])]) out.push({ key: `${g.id}/${enemy.id}`, enemy });
      group = g.nextGroupId;
    }
  }
  return out;
}

describe('FFX-2 monster rows are the game\'s rows', () => {
  it('every attached row equals the fixture row', () => {
    for (const [key, record] of Object.entries(MONSTER_RECORDS)) {
      const row = ROWS[key];
      expect(row, `${key}: no fixture row`).toBeDefined();
      if (row === undefined) continue;
      const r: FFX2MonsterRecord = record;
      expect(
        {
          row: r.row, table: r.table, acc: r.acc, special: r.special, species: r.species, zantetsu: r.zantetsu,
          stealByte: r.stealByte, stealGil: r.stealGil, steal: [...r.steal], bribe: [...r.bribe],
          resist1: sparse(r.resist1), resist2: sparse(r.resist2),
        },
        key,
      ).toEqual({
        row: row.row, table: row.table, acc: row.acc, special: row.special, species: row.species, zantetsu: row.zantetsu,
        stealByte: row.stealByte, stealGil: row.stealGil, steal: row.steal, bribe: row.bribe,
        resist1: row.resist1, resist2: row.resist2,
      });
    }
  });

  it('every enemy and part of the seven chapters has a row, except the listed ones', () => {
    const missing = chapterEnemies().filter((f) => f.enemy.ffx2Record === undefined).map((f) => f.key).sort();
    expect(missing).toEqual(Object.keys(UNROWED).sort());
  });

  it('every enemy and part carries a level, so the setup\'s default of 1 is never what a kernel reads', () => {
    // The status landing rule (+5 per level of gap) and accuracy formulas 3 to 7 read both levels; a missing one would be a silent 1.
    const missing = chapterEnemies().filter((f) => f.enemy.level === undefined).map((f) => f.key);
    expect(missing).toEqual([]);
  });

  it('every row on the catalog is one of the table (nothing attached by hand)', () => {
    for (const f of chapterEnemies()) {
      if (f.enemy.ffx2Record !== undefined) expect(f.enemy.ffx2Record, f.key).toBe(MONSTER_RECORDS[f.key]);
    }
  });
});

describe('the corrections the monster rows make to the authored enemy data', () => {
  it('Accuracy, the resist bytes, the steal byte and the stolen gil are the row\'s', () => {
    for (const { key, enemy } of chapterEnemies()) {
      const r = enemy.ffx2Record;
      if (r === undefined) continue;
      expect(enemy.stats.acc, `${key} acc`).toBe(r.acc);
      GROUP1_STATUS.forEach((status, i) => {
        if (status !== null) expect(enemy.immunities[status] ?? 0, `${key} ${status}`).toBe(r.resist1[i] ?? 0);
      });
      GROUP2_STATUS.forEach((statuses, i) => {
        for (const status of statuses) expect(enemy.immunities[status] ?? 0, `${key} ${status}`).toBe(r.resist2[i] ?? 0);
      });
      if (enemy.rewards.steal !== undefined) expect(enemy.rewards.steal.stealRate, `${key} steal byte`).toBe(r.stealByte);
      if (r.stealGil > 0) expect(enemy.rewards.stolenGil, `${key} stolen gil`).toBe(r.stealGil);
    }
  });
});

/**
 * Audit of the ability-to-row mapping against the game's own command lists (`commands` in the fixture, monster.bin): the row each enemy ability
 * runs on should be one of the commands the game gives that monster. A scripted command can be issued outside the list (a joint move, a
 * phase's special), so the exceptions are named with the reason; a new one has to be looked at. (The audit found the Oversoul's Attack on
 * the wrong row, the Left Bulwark's reactions on the Right's and Ormi's Concussive Shock of the first two acts on the Blast of the last.)
 */
const NOT_IN_ITS_LIST: Readonly<Record<string, string>> = {
  'ffx2-leblanc-logos-room/logos-room:x2-logos-hail-of-bullets': "Logos has no Hail of Bullets in the second room's list; our data gives him the third room's move (AI batch c decides)",
  'ffx2-leblanc-logos-room/ormi-logos-room:x2-ormi-concussive-blast': "Ormi's list in the second room has no Concussive move at all; our data gives him the Blast (AI batch c decides)",
  'ffx2-road-shiva/x2-shiva:x2-shiva-kick': "Shiva's list has no plain Attack; our data gives her a Kick on the generic monster Attack (AI batch b decides)",
  'ffx2-road-magus-sisters/sandy:x2-magus-delta-attack': "the sisters' joint command is issued by their script, it is in no single sister's list",
  'ffx2-road-magus-sisters/mindy:x2-magus-delta-attack': "the sisters' joint command is issued by their script, it is in no single sister's list",
  'ffx2-cloister-trema/trema:trema-demi': "Trema's Demi is cast by his script from the command table, it is not in his list",
  'ffx2-cloister-paragon-oversoul/paragon:paragon-genesis': "a phase special of the Oversoul's script, not in its list",
  'ffx2-cloister-paragon-oversoul/paragon:paragon-big-bang': "a phase special of the Oversoul's script, not in its list",
  'ffx2-cloister-paragon-oversoul/paragon:paragon-os-holy': "cast by the Oversoul's script, not in its list",
  'ffx2-den-nooj/shade-nooj:x2-den-nooj-attack': "Nooj's plain Attack is issued by his script, not in his list of three specials",
};

describe('the row each enemy ability runs on is a command the game gives that monster', () => {
  it('every ability of every enemy of the seven chapters, but the named exceptions', () => {
    const lookup = (id: string): AbilityDef | undefined => data.ABILITIES[id] ?? defaultAbilities.get(id);
    const found: string[] = [];
    let checked = 0;
    for (const { key, enemy } of chapterEnemies()) {
      const row = ROWS[key];
      if (row === undefined) continue;
      for (const abilityId of enemy.abilityIds) {
        const ability = lookup(abilityId);
        const own = enemy.ffx2Record?.commands?.[abilityId];
        const record = own ?? ability?.ffx2Record;
        if (record === undefined) continue;
        checked += 1;
        const ids = [record.id, ...(record.pickOne ?? []).map((v) => v.id)];
        if (!ids.some((id) => row.commands.includes(id))) found.push(`${key}:${abilityId}`);
      }
    }
    expect(checked).toBeGreaterThan(180);
    expect(found.sort()).toEqual(Object.keys(NOT_IN_ITS_LIST).sort());
  });
});

describe("a move the game gives a different row in a different fight runs on that fight's row (FFX2MonsterRecord.commands)", () => {
  const blast = data.ABILITIES['x2-ormi-concussive-blast'] as AbilityDef;
  const ormi = (group: string, id: string): ReturnType<typeof aiUnit> => {
    const enemy = data.ENEMY_GROUPS_BY_ID[group]!.enemies.find((e) => e.id === id)!;
    const unit = aiUnit(id, 'enemy');
    unit.enemy = { aiScriptId: '', formIndex: 0, forms: [], rewards: enemy.rewards, ...(enemy.ffx2Record !== undefined ? { ffx2Record: enemy.ffx2Record } : {}) };
    return unit;
  };

  it("Ormi's Concussive Shock (power 4) in the first room, the Blast (power 6) in the last", () => {
    const first = resolveCommand(blast, ormi('ffx2-leblanc-entrance', 'ormi-entrance')).record;
    expect([first.id, first.power]).toEqual([0x40fa, 4]);
    const last = resolveCommand(blast, ormi('ffx2-leblanc-last-room', 'ormi')).record;
    expect([last.id, last.power]).toEqual([0x40fb, 6]);
    // The second room's Ormi has no Concussive move in the game's list (it is in the exceptions above); he keeps the ability's own row.
    const second = resolveCommand(blast, ormi('ffx2-leblanc-logos-room', 'ormi-logos-room')).record;
    expect(second.id).toBe(0x40fb);
  });

  it('the Left Bulwark answers on its own three rows, the Right on the first three', () => {
    const group = data.ENEMY_GROUPS_BY_ID['vegnagun-body']!;
    const left = [...group.enemies, ...(group.parts ?? [])].find((e) => e.id === 'bulwark-l')!.ffx2Record!.commands ?? {};
    expect(Object.fromEntries(Object.entries(left).map(([k, v]) => [k, v.id]))).toEqual({
      'x2-bulwark-hostile-activity-detected': 0x4135,
      'x2-bulwark-physical-attack-detected': 0x4138,
      'x2-bulwark-magical-attack-detected': 0x4139,
    });
  });

  it("every override equals the game's row of that id (command_rows.json) and belongs to a command the monster has", () => {
    const rows = JSON.parse(readFileSync(here('command_rows.json'), 'utf8')) as Record<string, Record<string, unknown>>;
    for (const { key, enemy } of chapterEnemies()) {
      for (const [abilityId, record] of Object.entries(enemy.ffx2Record?.commands ?? {})) {
        const game = rows[`0x${record.id.toString(16)}`];
        expect(game, `${key}:${abilityId}`).toBeDefined();
        if (game === undefined) continue;
        for (const field of ['category', 'flagsTarget', 'flagsMisc', 'flagsDamage', 'damageClass', 'formula', 'critByte', 'accuracy', 'power', 'hits', 'shatter', 'element', 'killer'] as const) {
          expect(record[field], `${key}:${abilityId} ${field}`).toBe(game[field]);
        }
        expect(ROWS[key]?.commands, key).toContain(record.id);
      }
    }
  });
});

/** What the wiring leaves alone: where the authored stats and element bytes differ from the row. */
function differences(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const { key, enemy } of chapterEnemies()) {
    const row = ROWS[key];
    if (row === undefined) continue;
    const d: string[] = [];
    const pair = (name: string, ours: number, game: number): void => {
      if (ours !== game) d.push(`${name} ${ours}->${game}`);
    };
    pair('level', enemy.level ?? 1, row.level);
    pair('str', enemy.stats.str, row.str);
    pair('def', enemy.stats.def, row.def);
    pair('mag', enemy.stats.mag, row.mag);
    pair('mdef', enemy.stats.mdef, row.mdef);
    pair('eva', enemy.stats.eva, row.eva);
    pair('luck', enemy.stats.luck, row.luck);
    pair('agi', enemy.stats.agi, row.agi);
    const probe = aiUnit('probe', 'enemy');
    probe.affinities = { ...(enemy.affinities as Partial<Record<ElementId, 'weak' | 'normal' | 'resist' | 'immune' | 'absorb'>>) };
    const bytes = affinityBytes(probe);
    const flag = (name: string, ours: boolean, bit: number): void => {
      const game = (row.special & bit) !== 0;
      if (ours !== game) d.push(`${name} ${ours}->${game}`);
    };
    flag('percent-immune', enemy.immunityFlags.includes('immune-to-percentage-damage'), 0x1);
    flag('delay-immune', enemy.immunityFlags.includes('immune-to-delay'), 0x40);
    flag('bribe-immune', enemy.immunityFlags.includes('immune-to-bribe'), 0x200);
    pair('absorb', bytes.absorb, row.absorb);
    pair('null', bytes.nullify, row.nullify);
    pair('half', bytes.half, row.half);
    pair('weak', bytes.weak, row.weak);
    if (d.length > 0) out[key] = d;
  }
  return out;
}

describe('what the monster rows say that the authored data does not (left as authored)', () => {
  it('matches the pinned list (monster_differences.json)', () => {
    const now = differences();
    const path = here('monster_differences.json');
    if (process.env['PYREFLY_UPDATE_FIXTURES'] === '1') {
      const keys = Object.keys(now);
      writeFileSync(path, `{\n${keys.map((k, i) => `  ${JSON.stringify(k)}: ${JSON.stringify(now[k])}${i < keys.length - 1 ? ',' : ''}`).join('\n')}\n}\n`);
    }
    expect(now).toEqual(JSON.parse(readFileSync(path, 'utf8')) as Record<string, string[]>);
  });
});
