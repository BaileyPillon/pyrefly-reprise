/**
 * Chapters II and III's aeon rows (Bailey 2026-09-28; `src/data/ffx/builds/late-aeon-rows.ts`).
 * **Game case: FFX only** [AGENTS.md rule 14]: summoned aeons exist only in FFX.
 *
 * Every shipped number is read back from `research/ffx-combat-core.md` §6.4.3 itself (rule 6), the
 * `'floor'` arm is pinned byte for byte to the rows shipped until 2026-09-28 (the measurement path),
 * and the possessed aeons of Chapter III mirror the new inside-Sin block.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AeonBuild } from '../../src/battle/common/types.ts';
import {
  INSIDE_SIN_SOURCED_ROWS,
  LATE_AEON_ROWS,
  ZANARKAND_SOURCED_ROWS,
  armLateAeons,
  dreamsEndFloorAeons,
  zanarkandFloorAeons,
} from '../../src/data/ffx/builds/late-aeon-rows.ts';
import { GAGAZET_SOURCED_ROWS } from '../../src/data/ffx/builds/gagazet-aeon-arms.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { gardenOfPainBuild } from '../../src/data/ffx/builds/garden-of-pain.ts';

const RESEARCH = readFileSync(fileURLToPath(new URL('../../research/ffx-combat-core.md', import.meta.url)), 'utf8');
const COLS = ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'eva', 'acc', 'luck'] as const;
const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] as const;

/** The five story-aeon rows of the §6.4.3 block whose bold heading starts with `heading`. */
function block(heading: string): Record<string, Record<string, number>> {
  const start = RESEARCH.indexOf(`**${heading}`);
  expect(start, `§6.4.3 block "${heading}"`).toBeGreaterThan(-1);
  const out: Record<string, Record<string, number>> = {};
  for (const line of RESEARCH.slice(start).split(/\r?\n/).slice(1, 20)) {
    if (line.startsWith('**')) break; // the next block's heading
    const m = /^\| \*\*(\w+)\*\* \| \*\*([\d,]+)\*\* \|(.*)$/.exec(line);
    if (!m) continue;
    const rest = m[3]!.split('|').map((c) => c.trim()).filter(Boolean);
    const nums = [Number(m[2]!.replace(',', '')), ...rest.slice(0, 9).map(Number)];
    out[m[1]!.toLowerCase()] = Object.fromEntries(COLS.map((c, i) => [c, nums[i]!]));
  }
  return out;
}

const hpOf = (aeons: AeonBuild[]) => Object.fromEntries(aeons.map((a) => [a.id, a.stats.hp]));

describe('Chapters II and III: research §6.4.3 rows (FFX only)', () => {
  it('the switch ships sourced', () => {
    expect(LATE_AEON_ROWS).toBe('sourced');
  });

  it('every stat of every row is the research table, cell for cell (Gagazet, Zanarkand, inside Sin)', () => {
    const cases: [string, Readonly<Record<string, object>>][] = [
      ['Seymour Flux — Mt. Gagazet', GAGAZET_SOURCED_ROWS],
      ['Yunalesca — Zanarkand Dome', ZANARKAND_SOURCED_ROWS],
      ["Braska's Final Aeon / Yu Yevon — inside Sin", INSIDE_SIN_SOURCED_ROWS],
    ];
    for (const [heading, rows] of cases) {
      const table = block(heading);
      expect(Object.keys(table).sort()).toEqual([...AEONS].sort());
      for (const id of AEONS) expect(rows[id], `${heading} ${id}`).toEqual(table[id]);
    }
  });

  it('the builds carry the rows: every stat, HP and MP full, abilities and gauges untouched', () => {
    for (const [build, rows, floor] of [
      [zanarkandBuild, ZANARKAND_SOURCED_ROWS, zanarkandFloorAeons()],
      [dreamsEndBuild, INSIDE_SIN_SOURCED_ROWS, dreamsEndFloorAeons()],
    ] as const) {
      for (const a of build.aeons) {
        const row = rows[a.id]!;
        const old = floor.find((x) => x.id === a.id)!;
        expect(a.stats).toEqual({ ...row, maxHp: row.hp, maxMp: row.mp });
        expect([a.hp, a.mp]).toEqual([row.hp, row.mp]);
        expect({ ...a, stats: null, hp: 0, mp: 0 }).toEqual({ ...old, stats: null, hp: 0, mp: 0 });
      }
    }
    expect(gardenOfPainBuild.aeons).toEqual(dreamsEndBuild.aeons);
  });

  it("the 'floor' arm is the rows shipped until 2026-09-28, byte for byte (ffx-yunalesca.md §12)", () => {
    expect(armLateAeons(zanarkandFloorAeons(), ZANARKAND_SOURCED_ROWS, 'floor')).toEqual(zanarkandFloorAeons());
    expect(hpOf(zanarkandFloorAeons())).toEqual({ valefor: 1341, ifrit: 1797, ixion: 1787, shiva: 1596, bahamut: 2542 });
    expect(hpOf(dreamsEndFloorAeons())).toEqual({ valefor: 1465, ifrit: 2007, ixion: 1981, shiva: 1760, bahamut: 2840 });
    expect(zanarkandFloorAeons().map((a) => a.overdriveGauge)).toEqual([60, 40, 40, 55, 30]);
    expect(dreamsEndFloorAeons().map((a) => a.overdriveGauge)).toEqual([60, 55, 50, 55, 70]);
    expect(zanarkandFloorAeons()[4]!.stats).toEqual({
      hp: 2542, mp: 63, str: 33, def: 44, mag: 36, mdef: 51, agi: 19, luck: 5, eva: 29, acc: 15, maxHp: 2542, maxMp: 63,
    });
  });
});

describe("Chapter III's possessed aeons mirror the inside-Sin rows (run on the engine, FFX only)", () => {
  // Re-parity AI lane B (2026-10-09): the game's init copies Strength, Defense, Magic, Magic Defense, Agility, Evasion,
  // Accuracy and maximum HP from the player's aeon; Luck stays the monster record's 0 and MP its 1
  // (research/re-ffx-ai-yunalesca-bfa.md section 5.4, read from m163 to m169). The wiki's "Luck 1" is overruled.
  it('each possessed aeon stands up with its §6.4.3 row, Luck 0 and MP 1 (re-ffx-ai-yunalesca-bfa.md §5.4)', async () => {
    const { FFXContentRegistry, createFFXEngine } = await import('../../src/battle/ffx/index.ts');
    const { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } = await import('../../src/data/ffx/index.ts');
    for (const id of AEONS) {
      const content = new FFXContentRegistry();
      content.addAbilities(ALL_ABILITIES);
      content.addItems(Object.values(ITEMS));
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      const group = ENEMY_GROUPS_BY_ID[`possessed-${id}`]!;
      engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: group, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      const c = engine.state().combatants[`possessed-${id}`]!;
      const row = INSIDE_SIN_SOURCED_ROWS[id]!;
      expect(c.stats, id).toEqual({ ...row, luck: 0, mp: 1, maxHp: row.hp, maxMp: 1 });
      expect(c.hp, id).toBe(row.hp);
    }
  });
});
