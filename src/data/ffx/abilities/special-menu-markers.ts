/**
 * Catalog entries for three command-menu ids that the builds data agent's
 * `FFXMemberBuild.learnedAbilityIds` lists (`gagazet.ts`, `zanarkand.ts`,
 * `dreams-end.ts` all list `'flee'` and `'talk'` for Tidus; all three list
 * `'fury'` for Lulu) but that do not fire through the normal
 * `AbilityCommand` -> `AbilityDef` path described in `battle/common/types.ts`.
 * Added during the 2026-09-16 integration pass once
 * `tests/unit/data-ffx-index.test.ts` proved these three ids were the only
 * ones referenced by a build that this catalog did not resolve.
 *
 * Why they need an entry at all: `learnedAbilityIds: AbilityId[]` is how the
 * command menu enumerates what a character can do, and UI code building
 * that menu (name, category, help text) reasonably expects every listed id
 * to resolve somewhere. Each entry below documents, via `extra`, which real
 * `Command` kind actually fires — this file is deliberately NOT where the
 * mechanic lives, only where it is discoverable.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * ffx-combat-core §7.1 [verified: 2 sources] — row 24, rank 2, MP 0,
   * "Whole party escapes, guaranteed." Per `types.ts`'s own `EscapeCommand`
   * doc comment: "'party' = Flee (row 24, rank 2)" — Flee does NOT resolve
   * as an `AbilityCommand` at all. Submitting it is
   * `{ kind: 'escape', targets: [], extra: { mode: 'party' } }`, never
   * `{ kind: 'ability', id: 'flee', ... }`. This catalog entry exists purely
   * so the command menu can show a labelled, MP-costed row for it; the
   * engine must special-case the id (or, better, the UI should route a
   * "Flee" menu press straight to an `EscapeCommand` and never construct an
   * `AbilityCommand` with this id in the first place).
   */
  flee: {
    id: 'flee',
    name: 'Flee',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-flee',
    sfxKey: 'sfx-flee',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: {
      vfxKey: 'vfx-flee',
      resolvesAsCommandKind: 'escape',
      escapeMode: 'party',
      note: "Menu marker only — submit an EscapeCommand with extra.mode:'party', not an AbilityCommand with this id.",
    },
  },

  /**
   * `battle/common/types.ts`'s `TriggerCommand` doc comment, and
   * `docs/CONTRACTS.md` §"Vocabulary notes": the scripted **Talk** trigger.
   * "Seymour Flux: pre-battle, Kimahri +10 STR / Yuna +10 MDEF. Braska's
   * Final Aeon: resets his Overdrive gauge on his next turn, which he then
   * loses; usable twice, offered a useless third time." This is not an
   * `AbilityDef`-driven action at all — it is
   * `{ kind: 'trigger', id: 'talk', targets }`. This catalog entry exists
   * only so the command menu can show a labelled row for it during the
   * pre-battle window the two encounters script it in; `power`/`formula`/
   * etc. are inert placeholders, never read by the engine for a
   * `TriggerCommand`.
   */
  talk: {
    id: 'talk',
    name: 'Talk',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-talk',
    sfxKey: 'sfx-talk',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: {
      vfxKey: 'vfx-talk',
      resolvesAsCommandKind: 'trigger',
      triggerId: 'talk',
      note: "Menu marker only — submit a TriggerCommand with id:'talk', not an AbilityCommand with this id. Per-encounter effect is scripted, not data-driven here.",
    },
  },

  /**
   * `abilities/overdrive-lulu-1.ts` / `overdrive-lulu-2.ts` define Lulu's 19
   * Fury tiers (`fire-fury` .. `ultima-fury`) as the ids an `OverdriveCommand`
   * actually submits, because `MinigameResult`'s `FuryResult` shape
   * (`{ sweptDegrees, casts }`) has no field to carry which Black Magic
   * spell was chosen — the choice can ONLY be conveyed through
   * `OverdriveCommand.id` itself, unlike Mix, whose `MixResult` DOES carry
   * enough information (`ingredients`) for a single generic `'mix'` id to
   * resolve through `mixes/recipes.ts`.
   *
   * The builds data agent's `FFXMemberBuild.overdrive.unlockedOverdriveIds`
   * lists a bare `'fury'` for Lulu in all three chapter builds, mirroring
   * how Rikku's build lists a bare `'mix'`. This entry exists so that
   * reference resolves, but **it is not what an `OverdriveCommand.id` should
   * actually be for Lulu** — that must be one of the 19 tier-specific ids.
   * CROSS-AGENT GAP, flagged in this integration pass's report: either the
   * builds agent should list the specific `*-fury` ids Lulu has learned
   * (matching her learned Black Magic spells) instead of this marker, or the
   * engine/UI agent needs a submenu step that turns a generic "Fury" menu
   * press into the correct specific `OverdriveCommand.id` before submitting.
   */
  fury: {
    id: 'fury',
    name: 'Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 0,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    minigame: 'lulu-fury',
    extra: {
      vfxKey: 'vfx-fury-menu',
      isGenericMenuMarker: true,
      resolvesToOneOf: [
        'fire-fury', 'blizzard-fury', 'thunder-fury', 'water-fury',
        'fira-fury', 'blizzara-fury', 'thundara-fury', 'watera-fury',
        'firaga-fury', 'blizzaga-fury', 'thundaga-fury', 'waterga-fury',
        'bio-fury', 'demi-fury', 'death-fury', 'drain-fury', 'osmose-fury',
        'flare-fury', 'ultima-fury',
      ],
      note: 'GAP: FuryResult carries no spell choice, so a real OverdriveCommand must use one of resolvesToOneOf as its id, not this marker. See file header comment.',
    },
  },
};

export default ABILITIES;
