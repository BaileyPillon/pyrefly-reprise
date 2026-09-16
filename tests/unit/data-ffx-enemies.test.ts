/**
 * Sanity checks for the FFX enemy data transcribed from `research/*.md`
 * (Seymour Flux, Yunalesca, Braska's Final Aeon / Yu Pagodas / possessed
 * aeons / Yu Yevon). Per `docs/CONTRACTS.md` "Data agents": stats must sit
 * inside the researched ranges, every `abilityId` an `EnemyDef` references
 * must resolve to a real `AbilityDef`, every status byte must be a valid
 * 0-255 value, and every numeric block must carry a research citation.
 *
 * TypeScript already guarantees every closed-union field (`StatusId`,
 * `ImmunityFlag`, `FormulaKey`, `Targeting`, `ActionFlag`, `AutoAbilityId`,
 * ...) is a real member of its union — `npx tsc --noEmit` is the enforcement
 * for that. These tests cover what the type system cannot: numeric ranges,
 * byte bounds, and cross-references between `abilityIds` arrays and the
 * `AbilityDef` records that must back them.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { AbilityDef, EnemyDef, EnemyGroupDef, StatusApplication } from '../../src/battle/common/types.ts';

import { seymourFluxGroup } from '../../src/data/ffx/enemies/seymour-flux.ts';
import { SEYMOUR_FLUX_ABILITIES } from '../../src/data/ffx/enemies/seymour-flux-abilities.ts';
import { yunalescaGroup } from '../../src/data/ffx/enemies/yunalesca.ts';
import { YUNALESCA_ABILITIES } from '../../src/data/ffx/enemies/yunalesca-abilities.ts';
import {
  braskasFinalAeonGroup,
  buildPossessedAeonChain,
  possessedAeonGroups,
  yuYevonGroup,
} from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { BRASKAS_FINAL_AEON_ABILITIES } from '../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts';
import { MANDATORY_AEON_IDS } from '../../src/data/ffx/ids.ts';

/**
 * Ability ids referenced from an `EnemyDef.abilityIds` array that are
 * **not** defined in this data agent's own `<boss>-abilities.ts` files
 * because they are shared, player-facing spell records the abilities data
 * agent owns (`src/data/ffx/abilities`, which does not exist yet at the
 * time this file was written). Cited per enemy file's own header comments.
 */
const SHARED_ABILITY_IDS = new Set([
  'protect', // Seymour: HP<75% counter
  'reflect', // Seymour: HP<50% counter; possessed Sandy
  'dispel', // Seymour: phase-1 step 5
  'cura', // Yunalesca: identical to the player's own Cura record
  'curaga', // Yunalesca; Yu Yevon's counter-heal; possessed Cindy
  'regen', // Yunalesca
  'ultima', // Yu Yevon's escalation nuke
  'haste', // possessed Sandy
]);

const ALL_ABILITIES: Record<string, AbilityDef> = {
  ...SEYMOUR_FLUX_ABILITIES,
  ...YUNALESCA_ABILITIES,
  ...BRASKAS_FINAL_AEON_ABILITIES,
};

function resolvableAbilityIds(ids: readonly string[]): string[] {
  return ids.filter((id) => !(id in ALL_ABILITIES) && !SHARED_ABILITY_IDS.has(id));
}

function allEnemies(group: EnemyGroupDef): EnemyDef[] {
  return [...group.enemies, ...(group.parts ?? [])];
}

/** Every enemy status-resistance byte must be a valid raw 0-255 value. */
function assertByteRange(value: number, label: string): void {
  expect(value, label).toBeGreaterThanOrEqual(0);
  expect(value, label).toBeLessThanOrEqual(255);
  expect(Number.isInteger(value), `${label} must be an integer byte`).toBe(true);
}

/** `StatusApplication.chance` and `.duration` are both raw 0-255 bytes. */
function assertStatusApplication(app: StatusApplication, label: string): void {
  assertByteRange(app.chance, `${label} chance`);
  assertByteRange(app.duration, `${label} duration`);
  if (app.stacks !== undefined) {
    expect(app.stacks, `${label} stacks`).toBeGreaterThanOrEqual(0);
    expect(app.stacks, `${label} stacks`).toBeLessThanOrEqual(10);
  }
}

const ALL_GROUPS: EnemyGroupDef[] = [
  seymourFluxGroup,
  yunalescaGroup,
  braskasFinalAeonGroup,
  ...possessedAeonGroups,
  yuYevonGroup,
];

describe('FFX enemy data — structural sanity', () => {
  it('every EnemyDef.abilityIds entry resolves to an AbilityDef this file owns or a documented shared id', () => {
    for (const group of ALL_GROUPS) {
      for (const enemy of allEnemies(group)) {
        const unresolved = resolvableAbilityIds(enemy.abilityIds);
        expect(unresolved, `${group.id} / ${enemy.id} has unresolved abilityIds`).toEqual([]);
      }
    }
  });

  it('every immunities byte is a valid raw 0-255 resistance value', () => {
    for (const group of ALL_GROUPS) {
      for (const enemy of allEnemies(group)) {
        for (const [status, byte] of Object.entries(enemy.immunities)) {
          assertByteRange(byte as number, `${group.id}/${enemy.id} immunities.${status}`);
        }
      }
    }
  });

  it('every AbilityDef status application uses valid raw 0-255 bytes', () => {
    for (const ability of Object.values(ALL_ABILITIES)) {
      ability.statusEffects.forEach((app, i) => assertStatusApplication(app, `${ability.id}.statusEffects[${i}]`));
    }
  });

  it('every AbilityDef accuracy/bonusCrit/shatterChance byte, where present, is 0-255 (0-100 for bonusCrit/shatterChance)', () => {
    for (const ability of Object.values(ALL_ABILITIES)) {
      if (ability.accuracy !== undefined) assertByteRange(ability.accuracy, `${ability.id}.accuracy`);
      if (ability.bonusCrit !== undefined) {
        expect(ability.bonusCrit, `${ability.id}.bonusCrit`).toBeGreaterThanOrEqual(0);
        expect(ability.bonusCrit, `${ability.id}.bonusCrit`).toBeLessThanOrEqual(100);
      }
      if (ability.shatterChance !== undefined) {
        expect(ability.shatterChance, `${ability.id}.shatterChance`).toBeGreaterThanOrEqual(0);
        expect(ability.shatterChance, `${ability.id}.shatterChance`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('threatenChance, when set, is a non-negative percent (0 = immune)', () => {
    for (const group of ALL_GROUPS) {
      for (const enemy of allEnemies(group)) {
        if (enemy.threatenChance !== undefined) {
          expect(enemy.threatenChance, `${group.id}/${enemy.id} threatenChance`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('poisonTickPercent, when set, is a 0-100 percentage', () => {
    for (const group of ALL_GROUPS) {
      for (const enemy of allEnemies(group)) {
        if (enemy.poisonTickPercent !== undefined) {
          expect(enemy.poisonTickPercent).toBeGreaterThanOrEqual(0);
          expect(enemy.poisonTickPercent).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('every enemy id is unique within its own formation', () => {
    for (const group of ALL_GROUPS) {
      const ids = allEnemies(group).map((e) => e.id);
      expect(new Set(ids).size, `${group.id} has duplicate enemy ids`).toBe(ids.length);
    }
  });

  it('every EnemyForm.hp is positive and the enemy starting hp matches its first form', () => {
    for (const group of ALL_GROUPS) {
      for (const enemy of allEnemies(group)) {
        for (const form of enemy.forms) {
          expect(form.hp, `${group.id}/${enemy.id} form "${form.name}" hp`).toBeGreaterThan(0);
        }
        expect(enemy.hp, `${group.id}/${enemy.id} starting hp vs forms[0]`).toBe(enemy.forms[0]?.hp);
      }
    }
  });
});

describe('FFX enemy data — research-verified headline stats', () => {
  it('Seymour Flux [ffx-seymour-flux.md §1.1]', () => {
    const flux = seymourFluxGroup.enemies.find((e) => e.id === 'seymour-flux');
    expect(flux?.stats).toMatchObject({ hp: 70000, mp: 512, str: 30, def: 40, mag: 15, mdef: 40, agi: 38, luck: 15, eva: 0, acc: 100 });
    expect(flux?.rewards.ap).toBe(10000);
    expect(flux?.rewards.overkillThreshold).toBe(3500);
  });

  it('Mortiorchis [ffx-seymour-flux.md §2]', () => {
    const mort = seymourFluxGroup.enemies.find((e) => e.id === 'mortiorchis');
    expect(mort?.stats).toMatchObject({ hp: 4000, mp: 512, str: 40, def: 100, mag: 40, mdef: 0, agi: 38 });
    expect(mort?.immunityFlags).toContain('armored');
  });

  it('Yunalesca per-form HP sums to the decompiled 132,000 total [ffx-yunalesca.md §2.2]', () => {
    const yuna = yunalescaGroup.enemies[0];
    const total = yuna?.forms.reduce((sum, f) => sum + f.hp, 0) ?? 0;
    expect(total).toBe(132000);
    expect(yuna?.forms.map((f) => f.hp)).toEqual([24000, 48000, 60000]);
    expect(yuna?.forms.every((f) => f.overflowCarries === false)).toBe(true);
  });

  it('Yunalesca shared stats [ffx-yunalesca.md §2.1]', () => {
    const yuna = yunalescaGroup.enemies[0];
    expect(yuna?.stats).toMatchObject({ mp: 500, str: 20, def: 50, mag: 30, mdef: 50, agi: 40, luck: 20, eva: 0, acc: 0 });
  });

  it("Braska's Final Aeon form HP and form-2 Strength override [ffx-bfa-yu-yevon.md §0, §1.1]", () => {
    const bfa = braskasFinalAeonGroup.enemies.find((e) => e.id === 'braskas-final-aeon');
    expect(bfa?.forms.map((f) => f.hp)).toEqual([60000, 120000]);
    expect(bfa?.forms[1]?.statOverrides?.str).toBe(50);
    expect(bfa?.stats.str).toBe(45);
  });

  it('Yu Pagoda uses the 5,000 overkill-field HP, not the 65535 struct placeholder [ffx-bfa-yu-yevon.md §0, §1.4]', () => {
    const pagoda = braskasFinalAeonGroup.enemies.find((e) => e.id === 'yu-pagoda-left');
    expect(pagoda?.stats.hp).toBe(5000);
    expect(pagoda?.stats.maxHp).toBe(5000);
  });

  it('Yu Yevon [ffx-bfa-yu-yevon.md §3.1]', () => {
    const yevon = yuYevonGroup.enemies.find((e) => e.id === 'yu-yevon');
    expect(yevon?.stats).toMatchObject({ hp: 99999, mp: 1, str: 1, mag: 200, agi: 44 });
    expect(yevon?.poisonTickPercent).toBe(10);
  });

  it('buildPossessedAeonChain chains the five mandatory aeons into Yu Yevon', () => {
    const chain = buildPossessedAeonChain(MANDATORY_AEON_IDS);
    expect(chain).toHaveLength(5);
    expect(chain.map((g) => g.id)).toEqual([
      'possessed-valefor',
      'possessed-ifrit',
      'possessed-ixion',
      'possessed-shiva',
      'possessed-bahamut',
    ]);
    for (let i = 0; i < chain.length - 1; i++) {
      expect(chain[i]?.nextGroupId).toBe(chain[i + 1]?.id);
    }
    expect(chain.at(-1)?.nextGroupId).toBe('yu-yevon');
  });

  it('buildPossessedAeonChain includes the Magus Sisters trio only when owned', () => {
    const withSisters = buildPossessedAeonChain([...MANDATORY_AEON_IDS, 'magus-sisters']);
    expect(withSisters.map((g) => g.id)).toContain('possessed-cindy');
    expect(withSisters.map((g) => g.id)).toContain('possessed-sandy');
    expect(withSisters.map((g) => g.id)).toContain('possessed-mindy');
  });
});

/**
 * Every research-derived numeric block must carry a `§`-section citation
 * per `docs/CONTRACTS.md` ("a table with no tag anywhere is a defect").
 * Source comments aren't inspectable at runtime through the compiled data,
 * so this reads the source files as text as a coverage proxy: a file this
 * dense with sourced boss numbers should cite its research section
 * constantly, not as an afterthought.
 */
describe('FFX enemy data files — citation coverage', () => {
  const files = [
    '../../src/data/ffx/enemies/seymour-flux.ts',
    '../../src/data/ffx/enemies/seymour-flux-abilities.ts',
    '../../src/data/ffx/enemies/yunalesca.ts',
    '../../src/data/ffx/enemies/yunalesca-abilities.ts',
    '../../src/data/ffx/enemies/braskas-final-aeon.ts',
    '../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts',
  ];

  it.each(files)('%s cites at least 10 research sections (§) and a confidence tag', (relPath) => {
    const path = fileURLToPath(new URL(relPath, import.meta.url));
    const text = readFileSync(path, 'utf8');
    const sectionCitations = text.match(/§[\d.]+/g) ?? [];
    expect(sectionCitations.length, `${relPath} section citation count`).toBeGreaterThanOrEqual(10);
    expect(/\[(decompiled|verified|single source|estimate)/.test(text), `${relPath} confidence tag`).toBe(true);
  });
});
