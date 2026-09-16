/**
 * Integration tests for `src/data/ffx/index.ts` — the module that merges
 * every FFX ability/item table into the lookup the engine and app-boot
 * `registerFFXAbilities()` call actually read.
 *
 * These tests exist because a merge like this fails silently: a duplicate
 * id quietly shadows an earlier definition (a boss move disappears behind a
 * same-named player spell, or vice versa) and an unresolved reference just
 * renders as a plain Attack in the live game with no error anywhere. Every
 * check below is designed to fail loudly and name the offending id.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, EnemyGroupDef } from '../../src/battle/common/types.ts';

import {
  ABILITIES,
  ALL_ABILITIES,
  ITEMS,
  ENEMY_GROUPS_BY_ID,
  gagazetBuild,
  zanarkandBuild,
  dreamsEndBuild,
} from '../../src/data/ffx/index.ts';

// ---------------------------------------------------------------------------
// Re-import every source module directly (independent of index.ts's own
// merge order) so the duplicate-id check is a genuine cross-check, not a
// test of index.ts against itself.
// ---------------------------------------------------------------------------

import { ABILITIES as WHITEMAGIC_CURE } from '../../src/data/ffx/abilities/whitemagic-cure.ts';
import { ABILITIES as WHITEMAGIC_REVIVAL } from '../../src/data/ffx/abilities/whitemagic-revival.ts';
import { ABILITIES as WHITEMAGIC_PROTECT } from '../../src/data/ffx/abilities/whitemagic-protect.ts';
import { ABILITIES as WHITEMAGIC_HASTE_SLOW } from '../../src/data/ffx/abilities/whitemagic-haste-slow.ts';
import { ABILITIES as BLACKMAGIC_ELEMENTAL } from '../../src/data/ffx/abilities/blackmagic-elemental.ts';
import { ABILITIES as BLACKMAGIC_ADVANCED } from '../../src/data/ffx/abilities/blackmagic-advanced.ts';
import { ABILITIES as SPECIAL_BUFFS } from '../../src/data/ffx/abilities/special-buffs.ts';
import { ABILITIES as SPECIAL_UTILITY } from '../../src/data/ffx/abilities/special-utility.ts';
import { ABILITIES as SPECIAL_RIKKU } from '../../src/data/ffx/abilities/special-rikku.ts';
import { ABILITIES as SKILL_STATUS_ATTACKS } from '../../src/data/ffx/abilities/skill-status-attacks.ts';
import { ABILITIES as SKILL_BREAKS_MISC } from '../../src/data/ffx/abilities/skill-breaks-misc.ts';
import { ABILITIES as OVERDRIVE_TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { ABILITIES as OVERDRIVE_AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as OVERDRIVE_WAKKA_1 } from '../../src/data/ffx/abilities/overdrive-wakka-1.ts';
import { ABILITIES as OVERDRIVE_WAKKA_2 } from '../../src/data/ffx/abilities/overdrive-wakka-2.ts';
import { ABILITIES as OVERDRIVE_LULU_1 } from '../../src/data/ffx/abilities/overdrive-lulu-1.ts';
import { ABILITIES as OVERDRIVE_LULU_2 } from '../../src/data/ffx/abilities/overdrive-lulu-2.ts';
import { ABILITIES as OVERDRIVE_KIMAHRI_1 } from '../../src/data/ffx/abilities/overdrive-kimahri-1.ts';
import { ABILITIES as OVERDRIVE_KIMAHRI_2 } from '../../src/data/ffx/abilities/overdrive-kimahri-2.ts';
import { ABILITIES as OVERDRIVE_YUNA } from '../../src/data/ffx/abilities/overdrive-yuna.ts';
import { ABILITIES as SPECIAL_MENU_MARKERS } from '../../src/data/ffx/abilities/special-menu-markers.ts';
import { ABILITIES as AEON_ABILITIES_CORE } from '../../src/data/ffx/aeons/abilities-core.ts';
import { ABILITIES as AEON_ABILITIES_CORE_2 } from '../../src/data/ffx/aeons/abilities-core-2.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL } from '../../src/data/ffx/aeons/abilities-optional.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL_2 } from '../../src/data/ffx/aeons/abilities-optional-2.ts';
import { ABILITIES as MIX_ABILITIES } from '../../src/data/ffx/mixes/abilities.ts';
import { SEYMOUR_FLUX_ABILITIES } from '../../src/data/ffx/enemies/seymour-flux-abilities.ts';
import { YUNALESCA_ABILITIES } from '../../src/data/ffx/enemies/yunalesca-abilities.ts';
import { BRASKAS_FINAL_AEON_ABILITIES } from '../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts';

/** Every source module that contributes to `ABILITIES`, labelled for error messages. */
const ABILITY_SOURCES: Array<[string, Record<string, AbilityDef>]> = [
  ['abilities/whitemagic-cure.ts', WHITEMAGIC_CURE],
  ['abilities/whitemagic-revival.ts', WHITEMAGIC_REVIVAL],
  ['abilities/whitemagic-protect.ts', WHITEMAGIC_PROTECT],
  ['abilities/whitemagic-haste-slow.ts', WHITEMAGIC_HASTE_SLOW],
  ['abilities/blackmagic-elemental.ts', BLACKMAGIC_ELEMENTAL],
  ['abilities/blackmagic-advanced.ts', BLACKMAGIC_ADVANCED],
  ['abilities/special-buffs.ts', SPECIAL_BUFFS],
  ['abilities/special-utility.ts', SPECIAL_UTILITY],
  ['abilities/special-rikku.ts', SPECIAL_RIKKU],
  ['abilities/skill-status-attacks.ts', SKILL_STATUS_ATTACKS],
  ['abilities/skill-breaks-misc.ts', SKILL_BREAKS_MISC],
  ['abilities/overdrive-tidus.ts', OVERDRIVE_TIDUS],
  ['abilities/overdrive-auron.ts', OVERDRIVE_AURON],
  ['abilities/overdrive-wakka-1.ts', OVERDRIVE_WAKKA_1],
  ['abilities/overdrive-wakka-2.ts', OVERDRIVE_WAKKA_2],
  ['abilities/overdrive-lulu-1.ts', OVERDRIVE_LULU_1],
  ['abilities/overdrive-lulu-2.ts', OVERDRIVE_LULU_2],
  ['abilities/overdrive-kimahri-1.ts', OVERDRIVE_KIMAHRI_1],
  ['abilities/overdrive-kimahri-2.ts', OVERDRIVE_KIMAHRI_2],
  ['abilities/overdrive-yuna.ts', OVERDRIVE_YUNA],
  ['abilities/special-menu-markers.ts', SPECIAL_MENU_MARKERS],
  ['aeons/abilities-core.ts', AEON_ABILITIES_CORE],
  ['aeons/abilities-core-2.ts', AEON_ABILITIES_CORE_2],
  ['aeons/abilities-optional.ts', AEON_ABILITIES_OPTIONAL],
  ['aeons/abilities-optional-2.ts', AEON_ABILITIES_OPTIONAL_2],
  ['mixes/abilities.ts', MIX_ABILITIES],
  ['enemies/seymour-flux-abilities.ts', SEYMOUR_FLUX_ABILITIES],
  ['enemies/yunalesca-abilities.ts', YUNALESCA_ABILITIES],
  ['enemies/braskas-final-aeon-abilities.ts', BRASKAS_FINAL_AEON_ABILITIES],
];

/** Item-effect abilities aren't full sibling modules, so check them as one extra "source". */
function itemEffectAbilitiesSource(): [string, Record<string, AbilityDef>] {
  const record: Record<string, AbilityDef> = {};
  for (const item of Object.values(ITEMS)) {
    if (typeof item.effect === 'object' && item.effect !== null) {
      record[item.effect.id] = item.effect;
    }
  }
  return ['items/** (effect abilities)', record];
}

describe('src/data/ffx/index.ts — ability catalog integrity', () => {
  it('registers a non-trivial number of abilities and items (the catalog is actually wired up)', () => {
    // This is the regression check for the original bug: an empty or
    // near-empty ABILITIES table means index.ts isn't merging anything and
    // every FFX battle silently degrades to auto-attacks.
    expect(Object.keys(ABILITIES).length).toBeGreaterThan(200);
    expect(Object.keys(ITEMS).length).toBeGreaterThan(50);
    expect(ALL_ABILITIES.length).toBe(Object.keys(ABILITIES).length);
  });

  it('has no genuinely conflicting duplicate ability ids across modules', () => {
    const allSources = [...ABILITY_SOURCES, itemEffectAbilitiesSource()];
    const seen = new Map<string, { source: string; def: AbilityDef }>();
    const conflicts: string[] = [];

    for (const [source, record] of allSources) {
      for (const [id, def] of Object.entries(record)) {
        const prior = seen.get(id);
        if (!prior) {
          seen.set(id, { source, def });
          continue;
        }
        // Allow the one documented benign case: the exact same AbilityDef
        // object (or a value-identical copy) legitimately reused across two
        // boss modules (e.g. the Yu Pagoda reusing Yunalesca's `osmose`).
        // Anything that differs in content under a shared id is a real
        // collision that would silently shadow a move.
        const identical = prior.def === def || JSON.stringify(prior.def) === JSON.stringify(def);
        if (!identical) {
          conflicts.push(
            `id "${id}" is defined differently in both "${prior.source}" and "${source}" ` +
              `(names: "${prior.def.name}" vs "${def.name}") — one will silently shadow the other when merged.`,
          );
        }
      }
    }

    expect(conflicts, conflicts.join('\n')).toEqual([]);
  });

  it('every FFX EnemyDef.abilityIds entry resolves in ABILITIES', () => {
    const missing: string[] = [];
    for (const group of Object.values(ENEMY_GROUPS_BY_ID) as EnemyGroupDef[]) {
      const allEnemyDefs = [...group.enemies, ...(group.parts ?? [])];
      for (const enemyDef of allEnemyDefs) {
        for (const abilityId of enemyDef.abilityIds) {
          if (!(abilityId in ABILITIES)) {
            missing.push(`${group.id} / ${enemyDef.id ?? enemyDef.name}: "${abilityId}"`);
          }
        }
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('every build\'s learnedAbilityIds entry resolves in ABILITIES', () => {
    const builds: Array<[string, typeof gagazetBuild]> = [
      ['gagazet', gagazetBuild],
      ['zanarkand', zanarkandBuild],
      ['dreams-end', dreamsEndBuild],
    ];
    const missing: string[] = [];
    for (const [buildName, build] of builds) {
      for (const member of build.members) {
        for (const abilityId of member.learnedAbilityIds) {
          if (!(abilityId in ABILITIES)) {
            missing.push(`${buildName} / ${member.id}: "${abilityId}"`);
          }
        }
        // Overdrive ability ids ride the same AbilityId space.
        for (const odId of member.overdrive.unlockedOverdriveIds) {
          if (!(odId in ABILITIES)) {
            missing.push(`${buildName} / ${member.id} (overdrive): "${odId}"`);
          }
        }
      }
      for (const aeonBuild of build.aeons) {
        for (const abilityId of [...aeonBuild.abilityIds, ...aeonBuild.overdriveIds]) {
          if (!(abilityId in ABILITIES)) {
            missing.push(`${buildName} / aeon ${aeonBuild.id}: "${abilityId}"`);
          }
        }
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('every ItemDef.effect resolves to an ability with category "item"', () => {
    const problems: string[] = [];
    for (const item of Object.values(ITEMS)) {
      const effect = typeof item.effect === 'string' ? ABILITIES[item.effect] : item.effect;
      if (!effect) {
        problems.push(`${item.id}: effect "${String(item.effect)}" does not resolve to any ability`);
        continue;
      }
      if (effect.category !== 'item') {
        problems.push(`${item.id}: effect ability "${effect.id}" has category "${effect.category}", expected "item"`);
      }
      // The merged catalog should expose the same ability under the item's own id too.
      if (!(item.id in ABILITIES)) {
        problems.push(`${item.id}: not reachable via ABILITIES["${item.id}"] after the merge`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('registerFFXAbilities-shaped input (Object.values(ABILITIES)) contains every enemy and player ability at least once', () => {
    const idSet = new Set(ALL_ABILITIES.map((a) => a.id));
    expect(idSet.has('fire')).toBe(true); // player Black Magic
    expect(idSet.has('cure')).toBe(true); // player White Magic
    expect(idSet.has('mix')).toBe(true); // Rikku's Overdrive selector
    expect(idSet.has('grand-summon')).toBe(true); // Yuna's Overdrive
    expect(idSet.has('mega-flare')).toBe(true); // Bahamut's aeon Overdrive
    expect(idSet.has('potion')).toBe(true); // item effect
  });
});
