/**
 * Chapter XIII's **boss-side options, built and switched OFF**: option 1 (TR7 b, Oversoul Paragon)
 * and option 2 (TR1 b, Trema alone, the Fiend Arena block). `docs/plans/trema-options-2026-09-25.md`.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Nothing here changes a boss number: each is
 * another *sourced* encounter, reached only through the switches in `src/data/chapter-ffx2-trema.ts`
 * (`TREMA_PARAGON_FORM`, `TREMA_CHAPTER_SHAPE`), which ship `'normal'` and `'paragon-then-trema'`.
 * The formations are registered (`./index.ts`) so the chain and the debug API can reach them by id;
 * registering them moves nothing, because no chapter points at them.
 */

import type { AbilityDef, EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { paragonOversoul } from './paragon-oversoul.ts';
import { tremaAbilities } from './trema-abilities.ts';
import { CLOISTER_ACTION_TIME, CLOISTER_TREMA, cloisterParagonGroup, cloisterTremaGroup, trema } from './trema.ts';

export const CLOISTER_PARAGON_OVERSOUL = 'ffx2-cloister-paragon-oversoul';
export const CLOISTER_TREMA_ARENA = 'ffx2-cloister-trema-arena';

/** Option 1: link 1 is Oversoul Paragon, then Trema exactly as in the shipped chain (research §12.2). */
export const cloisterParagonOversoulGroup: EnemyGroupDef = {
  ...cloisterParagonGroup,
  id: CLOISTER_PARAGON_OVERSOUL,
  enemies: [paragonOversoul],
  nextGroupId: CLOISTER_TREMA,
};

const storyMire = tremaAbilities.find((a) => a.id === 'trema-beguiling-mire');
if (!storyMire) throw new Error('trema-abilities.ts has no trema-beguiling-mire');

/** The Fiend Arena's Beguiling Mire: 5 x3 where the story's is 4 x3 (research §4.2) [SinirothX]. */
export const tremaArenaAbilities: AbilityDef[] = [
  { ...storyMire, id: 'trema-arena-beguiling-mire', power: 5 },
];

/**
 * Trema, Fiend Arena (International / HD only), research §3.3 `[verified: 2 sources]` for the
 * block (SinirothX Colosseum entry + wiki); the AI weights `[single source]`.
 */
export const tremaArena: EnemyDef = {
  ...trema,
  stats: {
    ...trema.stats, // HP 999,999, MP 999, Str / Mag / Def / MDef 255, Eva 99 (§3.3 "same")
    agi: 95, // story 129
    luck: 128, // story 26
    acc: 26, // SinirothX only
  },
  aiScriptId: 'trema-arena', // Demi 1/6, Flare 1/12, the rest as story (`battle/ffx2/ai/trema.ts`)
  // §3.3 lists no auto-status for the arena block: the story version's Spellspring is kept, `[estimate]`
  // (without it his spells would drain his own MP, which would be easier).
  rewards: {
    ...trema.rewards,
    ap: 1, // EXP / AP / Gil / Pilfer: 2,000 / 1 / 3,000 / 3,000 [§3.3]
    apOverkill: 1,
    gil: 3000,
    stolenGil: 3000,
    exp: 2000,
    drops: [{ itemId: 'x2-dark-matter', count: 2 }], // Dark Matter x2 / x3 [§3.3]
    steal: {
      ...trema.rewards.steal!,
      stealRate: 64, // Turbo Ether / Turbo Ether x2 at rate 64 [§3.3]
      common: { itemId: 'x2-turbo-ether', count: 1 },
      rare: { itemId: 'x2-turbo-ether', count: 2 },
    },
  },
  abilityIds: trema.abilityIds.map((id) => (id === 'trema-beguiling-mire' ? 'trema-arena-beguiling-mire' : id)),
};

/**
 * Option 2: the chapter is **Trema alone**, the Fiend Arena fight, at full HP and MP with no
 * Paragon before him ("Start state: full HP and MP", wiki, §3.3). A first link: nothing carried,
 * no checkpoint of its own. Beguiling Mire's Stop still wears off on §2.8's default (method check
 * E1, this chapter's rule).
 */
export const cloisterTremaArenaGroup: EnemyGroupDef = {
  id: CLOISTER_TREMA_ARENA,
  game: 'ffx2',
  enemies: [tremaArena],
  canEscape: false,
  musicCues: cloisterTremaGroup.musicCues ?? [],
  timedAilmentDefaults: true,
  ...(CLOISTER_ACTION_TIME > 0 ? { actionTimeSeconds: CLOISTER_ACTION_TIME } : {}),
};

export const tremaOptionGroups: readonly EnemyGroupDef[] = [cloisterParagonOversoulGroup, cloisterTremaArenaGroup];
