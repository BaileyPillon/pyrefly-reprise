/**
 * `cite` strings for site A, one small table per chapter, per AGENTS.md hard
 * rule 6 and `docs/plans/learning-sites.md`'s "counts are computed from the
 * data at build time, never typed" — the cites are the one thing that
 * genuinely can't be read out of the data at runtime (a source-code comment
 * isn't importable), so this file exists to hold copies of them.
 *
 * Every entry below is transcribed from a comment actually present in the
 * named file, at the time this module was written — nothing here is a new
 * claim about the games. Two grains, matching how precisely the source data
 * itself cites:
 *
 *  - **Per combatant.** Each enemy/part-defining file cites its own section
 *    at the top (`vegnagun-leg.ts`: "[ffx2-vegnagun-shuyin.md §3.2]"); that
 *    section covers everything the file declares for that combatant — stats,
 *    immunities, affinities, ai script, rewards — so one entry per combatant
 *    id serves the parts-and-forms piece *and* every other system's pieces
 *    that trace back to it (an immunity's cite is its first-owning
 *    combatant's cite, etc; see `guide-notes.ts`/`systems-catalog.ts`).
 *  - **Per ability.** Most ability ids are only ever defined in one
 *    boss-only ability file, which cites its own section at the top exactly
 *    like an enemy file does — so the fallback below is "whichever file's
 *    exported list contains this id, use that file's header cite," built
 *    from the real exported arrays/records rather than a hand-typed id list.
 *    A short list of exceptions covers ids a boss reuses from the shared
 *    player-ability catalog (Seymour's own Protect/Reflect/Dispel, etc.):
 *    the *shared* ability file has no chapter-specific citation of its own,
 *    but the enemy file that reuses the id does, inline next to that id in
 *    its own `abilityIds` array — those inline sections are copied into the
 *    per-chapter override maps below.
 */

import type { ChapterId } from '../../src/data/encounters.ts';
import type { AbilityDef, AbilityId } from '../../src/battle/common/types.ts';

import { SEYMOUR_FLUX_ABILITIES } from '../../src/data/ffx/enemies/seymour-flux-abilities.ts';
import { YUNALESCA_ABILITIES } from '../../src/data/ffx/enemies/yunalesca-abilities.ts';
import { BRASKAS_FINAL_AEON_ABILITIES } from '../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts';
import { bahamutAbilities } from '../../src/data/ffx2/enemies/bahamut-abilities.ts';
import { vegnagunAbilities } from '../../src/data/ffx2/enemies/vegnagun-abilities.ts';
import { vegnagunBodyAbilities } from '../../src/data/ffx2/enemies/vegnagun-body-abilities.ts';
import { shuyinAbilities } from '../../src/data/ffx2/enemies/shuyin-abilities.ts';
import { ormiAbilities, logosAbilities, goonAbilities } from '../../src/data/ffx2/enemies/leblanc-syndicate-abilities.ts';
import { leblancAbilities } from '../../src/data/ffx2/enemies/leblanc-syndicate-leblanc-abilities.ts';
import { SEYMOUR_ANIMA_MACALANIA_ABILITIES } from '../../src/data/ffx/enemies/seymour-anima-macalania-abilities.ts';
import { EVRAE_ABILITIES } from '../../src/data/ffx/enemies/evrae-abilities.ts';
import { YOJIMBO_ABILITIES } from '../../src/data/ffx/enemies/yojimbo-abilities.ts';
import { SEYMOUR_NATUS_ABILITIES } from '../../src/data/ffx/enemies/seymour-natus-abilities.ts';
import { ISAARU_ABILITIES } from '../../src/data/ffx/enemies/isaaru-abilities.ts';
import { x2ShivaAbilities, x2AnimaAbilities } from '../../src/data/ffx2/enemies/fallen-aeons-abilities.ts';
import { magusSistersAbilities } from '../../src/data/ffx2/enemies/magus-sisters-abilities.ts';

// ---------------------------------------------------------------------------
// Per combatant — from each enemy file's own header comment.
// ---------------------------------------------------------------------------

const COMBATANT_CITES: Record<ChapterId, Record<string, string>> = {
  'seymour-flux': {
    'seymour-flux': 'research/ffx-seymour-flux.md §1.1 (src/data/ffx/enemies/seymour-flux.ts)',
    mortiorchis: 'research/ffx-seymour-flux.md §2 (src/data/ffx/enemies/seymour-flux.ts)',
  },
  yunalesca: {
    yunalesca: 'research/ffx-yunalesca.md §2.2 (src/data/ffx/enemies/yunalesca.ts)',
  },
  'braskas-final-aeon': {
    'braskas-final-aeon': 'research/ffx-bfa-yu-yevon.md §1.1 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'yu-pagoda-left': 'research/ffx-bfa-yu-yevon.md §1.4 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'yu-pagoda-right': 'research/ffx-bfa-yu-yevon.md §1.4 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'possessed-valefor': 'research/ffx-bfa-yu-yevon.md §2.2 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'possessed-ifrit': 'research/ffx-bfa-yu-yevon.md §2.2 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'possessed-ixion': 'research/ffx-bfa-yu-yevon.md §2.2 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'possessed-shiva': 'research/ffx-bfa-yu-yevon.md §2.2 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'possessed-bahamut': 'research/ffx-bfa-yu-yevon.md §2.2 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    'yu-yevon': 'research/ffx-bfa-yu-yevon.md §3.1 (src/data/ffx/enemies/braskas-final-aeon.ts)',
  },
  'ffx2-bahamut': {
    bahamut: 'research/ffx2-bahamut.md §1.1 (src/data/ffx2/enemies/bahamut.ts)',
  },
  'ffx2-vegnagun-shuyin': {
    'vegnagun-tail': 'research/ffx2-vegnagun-shuyin.md §3.1 (src/data/ffx2/enemies/vegnagun-tail.ts)',
    'vegnagun-leg': 'research/ffx2-vegnagun-shuyin.md §3.2 (src/data/ffx2/enemies/vegnagun-leg.ts)',
    'node-a': 'research/ffx2-vegnagun-shuyin.md §3.2 (src/data/ffx2/enemies/vegnagun-leg.ts)',
    'node-b': 'research/ffx2-vegnagun-shuyin.md §3.2 (src/data/ffx2/enemies/vegnagun-leg.ts)',
    'node-c': 'research/ffx2-vegnagun-shuyin.md §3.2 (src/data/ffx2/enemies/vegnagun-leg.ts)',
    'vegnagun-body': 'research/ffx2-vegnagun-shuyin.md §3.3 (src/data/ffx2/enemies/vegnagun-body.ts)',
    'bulwark-r': 'research/ffx2-vegnagun-shuyin.md §3.3 (src/data/ffx2/enemies/vegnagun-body.ts)',
    'bulwark-l': 'research/ffx2-vegnagun-shuyin.md §3.3 (src/data/ffx2/enemies/vegnagun-body.ts)',
    'vegnagun-head': 'research/ffx2-vegnagun-shuyin.md §3.4 (src/data/ffx2/enemies/vegnagun-head.ts)',
    'redoubt-r': 'research/ffx2-vegnagun-shuyin.md §3.4 (src/data/ffx2/enemies/vegnagun-head.ts)',
    'redoubt-l': 'research/ffx2-vegnagun-shuyin.md §3.4 (src/data/ffx2/enemies/vegnagun-head.ts)',
    shuyin: 'research/ffx2-vegnagun-shuyin.md §3.5 (src/data/ffx2/enemies/shuyin.ts)',
  },
  'ffx2-leblanc': {
    leblanc: 'research/ffx2-leblanc-syndicate.md §3.1 (src/data/ffx2/enemies/leblanc-syndicate.ts)',
    logos: 'research/ffx2-leblanc-syndicate.md §3.2 (src/data/ffx2/enemies/leblanc-syndicate.ts)',
    ormi: 'research/ffx2-leblanc-syndicate.md §3.3 (src/data/ffx2/enemies/leblanc-syndicate.ts)',
    'ormi-entrance': 'research/ffx2-leblanc-syndicate.md §2 (src/data/ffx2/enemies/leblanc-syndicate-acts.ts)',
    'ormi-logos-room': 'research/ffx2-leblanc-syndicate.md §2 (src/data/ffx2/enemies/leblanc-syndicate-acts.ts)',
    'logos-room': 'research/ffx2-leblanc-syndicate.md §2 (src/data/ffx2/enemies/leblanc-syndicate-acts.ts)',
    'dr-goon': 'research/ffx2-leblanc-syndicate.md §4.6 (src/data/ffx2/enemies/leblanc-syndicate-acts.ts)',
    'fem-goon': 'research/ffx2-leblanc-syndicate.md §4.6 (src/data/ffx2/enemies/leblanc-syndicate-acts.ts)',
  },
  'seymour-anima-macalania': {
    'seymour-macalania': 'research/ffx-seymour-anima-macalania.md §1.1 (src/data/ffx/enemies/seymour-anima-macalania.ts)',
    'guado-guardian-a': 'research/ffx-seymour-anima-macalania.md §2.1 (src/data/ffx/enemies/seymour-anima-macalania.ts)',
    'guado-guardian-b': 'research/ffx-seymour-anima-macalania.md §2.1 (src/data/ffx/enemies/seymour-anima-macalania.ts)',
    'anima-macalania': 'research/ffx-seymour-anima-macalania.md §3.1 (src/data/ffx/enemies/seymour-anima-macalania.ts)',
  },
  'evrae-airship': {
    evrae: 'research/ffx-evrae-airship.md §1.1 (src/data/ffx/enemies/evrae.ts)',
    cid: 'research/ffx-evrae-airship.md §2.1 (src/data/ffx/enemies/evrae.ts)',
  },
  // Chapter IX is registered but unlisted (`UNLISTED_CHAPTERS`), so the atlas,
  // which walks `CHAPTER_IDS`, never builds it yet; the cites are ready for the day it is listed.
  'yojimbo-cavern': {
    ginnem: 'research/ffx-yojimbo.md §2.5 (src/data/ffx/enemies/yojimbo.ts)',
    yojimbo: 'research/ffx-yojimbo.md §2.1 (src/data/ffx/enemies/yojimbo.ts)',
    daigoro: 'research/ffx-yojimbo.md §2.5 (src/data/ffx/enemies/yojimbo.ts)',
  },
  // Chapter X, registered but unlisted like Chapter IX.
  'seymour-natus': {
    'seymour-natus': 'research/ffx-seymour-natus-highbridge.md §1 (src/data/ffx/enemies/seymour-natus.ts)',
    mortibody: 'research/ffx-seymour-natus-highbridge.md §2 (src/data/ffx/enemies/seymour-natus.ts)',
  },
  // Chapter XI (FFX-2), registered but unlisted like Chapters IX and X.
  'ffx2-fallen-aeons': {
    'x2-shiva': 'research/ffx2-fallen-aeons.md §3.1 (src/data/ffx2/enemies/fallen-aeons-road.ts)',
    sandy: 'research/ffx2-fallen-aeons.md §3.2 (src/data/ffx2/enemies/magus-sisters.ts)',
    cindy: 'research/ffx2-fallen-aeons.md §3.2 (src/data/ffx2/enemies/magus-sisters.ts)',
    mindy: 'research/ffx2-fallen-aeons.md §3.2 (src/data/ffx2/enemies/magus-sisters.ts)',
    'x2-anima': 'research/ffx2-fallen-aeons.md §3.3 (src/data/ffx2/enemies/fallen-aeons-road.ts)',
  },
  // Chapter XIV (FFX), registered but unlisted like Chapters IX to XI.
  'isaaru-via-purifico': {
    isaaru: 'research/ffx-isaaru-bevelle.md §2.1 (src/data/ffx/enemies/isaaru.ts)',
    grothia: 'research/ffx-isaaru-bevelle.md §2.2-§2.4 (src/data/ffx/enemies/isaaru.ts)',
    pterya: 'research/ffx-isaaru-bevelle.md §2.2-§2.4 (src/data/ffx/enemies/isaaru.ts)',
    spathi: 'research/ffx-isaaru-bevelle.md §2.2-§2.4 (src/data/ffx/enemies/isaaru.ts)',
  },
};

/** The combatant `cite`, or a loud failure — every combatant this data layer ever builds a piece for must have one entered above. */
export function citeForCombatant(chapterId: ChapterId, combatantId: string): string {
  const cite = COMBATANT_CITES[chapterId]?.[combatantId];
  if (cite === undefined) {
    throw new Error(`learn/atlas/cites: no cite entered for chapter "${chapterId}" combatant "${combatantId}"`);
  }
  return cite;
}

// ---------------------------------------------------------------------------
// Per ability file — header cite, applied to every id that file exports.
// ---------------------------------------------------------------------------

interface AbilityFileCite {
  readonly ids: ReadonlySet<AbilityId>;
  readonly cite: string;
}

function fileCite(abilities: Record<AbilityId, AbilityDef> | readonly AbilityDef[], cite: string): AbilityFileCite {
  const ids = Array.isArray(abilities) ? abilities.map((a) => a.id) : Object.keys(abilities);
  return { ids: new Set(ids), cite };
}

const ABILITY_FILE_CITES: Record<ChapterId, readonly AbilityFileCite[]> = {
  'seymour-flux': [
    fileCite(SEYMOUR_FLUX_ABILITIES, 'research/ffx-seymour-flux.md §3-§5 (src/data/ffx/enemies/seymour-flux-abilities.ts)'),
  ],
  yunalesca: [
    fileCite(YUNALESCA_ABILITIES, 'research/ffx-yunalesca.md §3, §5 (src/data/ffx/enemies/yunalesca-abilities.ts)'),
  ],
  'braskas-final-aeon': [
    fileCite(
      BRASKAS_FINAL_AEON_ABILITIES,
      'research/ffx-bfa-yu-yevon.md §1.3, §1.4, §1.6, §2.2, §3.3 (src/data/ffx/enemies/braskas-final-aeon-abilities.ts)',
    ),
  ],
  'ffx2-bahamut': [fileCite(bahamutAbilities, 'research/ffx2-bahamut.md §2 (src/data/ffx2/enemies/bahamut-abilities.ts)')],
  'ffx2-vegnagun-shuyin': [
    fileCite(vegnagunAbilities, 'research/ffx2-vegnagun-shuyin.md §3.1-3.2 (src/data/ffx2/enemies/vegnagun-abilities.ts)'),
    fileCite(vegnagunBodyAbilities, 'research/ffx2-vegnagun-shuyin.md §3.3 (src/data/ffx2/enemies/vegnagun-body-abilities.ts)'),
    fileCite(shuyinAbilities, 'research/ffx2-vegnagun-shuyin.md §3.4-3.5 (src/data/ffx2/enemies/shuyin-abilities.ts)'),
  ],
  'ffx2-leblanc': [
    fileCite(ormiAbilities, 'research/ffx2-leblanc-syndicate.md §4.1, §5.1 (src/data/ffx2/enemies/leblanc-syndicate-abilities.ts)'),
    fileCite(logosAbilities, 'research/ffx2-leblanc-syndicate.md §4.2, §5.2 (src/data/ffx2/enemies/leblanc-syndicate-abilities.ts)'),
    fileCite(goonAbilities, 'research/ffx2-leblanc-syndicate.md §4.6 (src/data/ffx2/enemies/leblanc-syndicate-abilities.ts)'),
    fileCite(leblancAbilities, 'research/ffx2-leblanc-syndicate.md §4.4, §4.5 (src/data/ffx2/enemies/leblanc-syndicate-leblanc-abilities.ts)'),
  ],
  'seymour-anima-macalania': [
    fileCite(
      SEYMOUR_ANIMA_MACALANIA_ABILITIES,
      'research/ffx-seymour-anima-macalania.md §4 (src/data/ffx/enemies/seymour-anima-macalania-abilities.ts)',
    ),
  ],
  'evrae-airship': [
    fileCite(EVRAE_ABILITIES, 'research/ffx-evrae-airship.md §2.2, §3.1, §3.2 (src/data/ffx/enemies/evrae-abilities.ts)'),
  ],
  'yojimbo-cavern': [
    fileCite(YOJIMBO_ABILITIES, 'research/ffx-yojimbo.md §3.1 (src/data/ffx/enemies/yojimbo-abilities.ts)'),
  ],
  'seymour-natus': [
    fileCite(SEYMOUR_NATUS_ABILITIES, 'research/ffx-seymour-natus-highbridge.md §3 (src/data/ffx/enemies/seymour-natus-abilities.ts)'),
  ],
  'ffx2-fallen-aeons': [
    fileCite(x2ShivaAbilities, 'research/ffx2-fallen-aeons.md §4.1 (src/data/ffx2/enemies/fallen-aeons-abilities.ts)'),
    fileCite(magusSistersAbilities, 'research/ffx2-fallen-aeons.md §4.2 (src/data/ffx2/enemies/magus-sisters-abilities.ts)'),
    fileCite(x2AnimaAbilities, 'research/ffx2-fallen-aeons.md §4.3 (src/data/ffx2/enemies/fallen-aeons-abilities.ts)'),
  ],
  'isaaru-via-purifico': [
    fileCite(ISAARU_ABILITIES, 'research/ffx-isaaru-bevelle.md §3 (src/data/ffx/enemies/isaaru-abilities.ts)'),
  ],
};

/**
 * Shared player-catalog ids a boss reuses (Protect, Cura, ...): the shared
 * ability file has no chapter section of its own, so these copy the section
 * the *enemy* file cites inline, next to that id, in its own `abilityIds`
 * array.
 */
const ABILITY_OVERRIDE_CITES: Record<ChapterId, Record<string, string>> = {
  'seymour-flux': {
    protect: 'research/ffx-seymour-flux.md §3.1 (src/data/ffx/enemies/seymour-flux.ts, reusing the shared Protect)',
    reflect: 'research/ffx-seymour-flux.md §3.1 (src/data/ffx/enemies/seymour-flux.ts, reusing the shared Reflect)',
    dispel: 'research/ffx-seymour-flux.md §3.1 (src/data/ffx/enemies/seymour-flux.ts, reusing the shared Dispel)',
  },
  yunalesca: {
    cura: 'research/ffx-yunalesca.md §3.1 (src/data/ffx/enemies/yunalesca.ts, reusing the shared Cura)',
    curaga: 'research/ffx-yunalesca.md §3.1 (src/data/ffx/enemies/yunalesca.ts, reusing the shared Curaga)',
    regen: 'research/ffx-yunalesca.md §3.1 (src/data/ffx/enemies/yunalesca.ts, reusing the shared Regen)',
  },
  'braskas-final-aeon': {
    gravija: 'research/ffx-bfa-yu-yevon.md §3.3 (src/data/ffx/enemies/braskas-final-aeon.ts)',
    curaga: 'research/ffx-bfa-yu-yevon.md §3.3 (src/data/ffx/enemies/braskas-final-aeon.ts, reusing the shared Curaga)',
    osmose: 'research/ffx-bfa-yu-yevon.md §3.3 (src/data/ffx/enemies/braskas-final-aeon.ts, reusing Yunalesca’s Osmose)',
    ultima: 'research/ffx-bfa-yu-yevon.md §3.3 (src/data/ffx/enemies/braskas-final-aeon.ts, reusing the shared Ultima)',
    'yu-yevon-command-254': 'research/ffx-bfa-yu-yevon.md §3.3 (src/data/ffx/enemies/braskas-final-aeon.ts)',
  },
  'ffx2-bahamut': {},
  'ffx2-vegnagun-shuyin': {},
  // Every Leblanc/Ormi/Logos/goon ability id is `x2-`-prefixed and defined in
  // the chapter's own two ability files (no shared player-catalog reuse).
  'ffx2-leblanc': {},
  'seymour-anima-macalania': {
    shell: 'research/ffx-seymour-anima-macalania.md §4.1 (src/data/ffx/enemies/seymour-anima-macalania.ts, reusing the shared Shell)',
    protect: 'research/ffx-seymour-anima-macalania.md §4.2 (src/data/ffx/enemies/seymour-anima-macalania.ts, reusing the shared Protect)',
  },
  // Every Evrae and Cid ability id is `evrae-`/`cid-`-prefixed and defined in
  // the chapter's own ability file (no shared player-catalog reuse).
  'evrae-airship': {},
  // Every Yojimbo and Daigoro ability id is `yojimbo-`/`daigoro-`-prefixed and
  // defined in the chapter's own ability file (no shared player-catalog reuse).
  'yojimbo-cavern': {},
  'seymour-natus': {
    banish: 'research/ffx-seymour-natus-highbridge.md §3.1 (src/data/ffx/enemies/seymour-natus.ts, reusing Chapter I’s Banish)',
    protect: 'research/ffx-seymour-natus-highbridge.md §3.1 (src/data/ffx/enemies/seymour-natus.ts, reusing the shared Protect)',
    mortibsorption: 'research/ffx-seymour-natus-highbridge.md §3.2, §4.4 (src/data/ffx/enemies/seymour-natus.ts, reusing Chapter I’s Mortibsorption)',
  },
  // Every Chapter XI ability id is `x2-`-prefixed and defined in the chapter's own ability files.
  'ffx2-fallen-aeons': {},
  // Every Chapter XIV ability id is prefixed with its aeon's name and defined in the chapter's own file.
  'isaaru-via-purifico': {},
};

/** The ability's `cite`, or a loud failure — see the module doc comment for how this is resolved. */
export function citeForAbility(chapterId: ChapterId, abilityId: AbilityId): string {
  const override = ABILITY_OVERRIDE_CITES[chapterId]?.[abilityId];
  if (override !== undefined) return override;

  for (const file of ABILITY_FILE_CITES[chapterId] ?? []) {
    if (file.ids.has(abilityId)) return file.cite;
  }

  throw new Error(`learn/atlas/cites: no cite entered for chapter "${chapterId}" ability "${abilityId}"`);
}
