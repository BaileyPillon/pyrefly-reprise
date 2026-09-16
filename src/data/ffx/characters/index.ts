/**
 * FFX playable-character base records.
 *
 * Species-level catalog data only: sprite/portrait keys, weapon flavor,
 * which Overdrive minigame the character opens, and every Overdrive ability
 * id the character may ever fire (across all unlock tiers). Per-chapter
 * stats, learned abilities, equipment and Sphere Grid position are build
 * data owned by the `data-agent` working on `src/data/ffx/builds/**` and
 * `src/data/ffx/enemies/**` — this file does not duplicate any of that.
 *
 * There is no catalog type for this in `src/battle/common/types.ts` (only
 * the per-battle `FFXMemberBuild`, which bundles stats/equipment/grid state
 * that do not belong at the species level). `FFXCharacterDef` below is a
 * project-local addition — not a contract change, nothing in `types.ts` is
 * touched.
 *
 * Sprite/portrait convention (per the art pipeline, 2026-09-15): every
 * character's `spriteKey` and `portraitKey` are the plain lowercase id.
 * Art lives at `public/art/characters/<id>/<pose>.png` and
 * `public/art/portraits/<id>.png`.
 *
 * Overdrive ability ids are sourced from `research/ffx-combat-core.md` §5
 * (Swordplay §5.3, Grand Summon §5.4, Bushido §5.5, Slots §5.6, Fury §5.7,
 * Ronso Rage §5.8, Mix §5.9) via the sibling `abilities/overdrive-*.ts` and
 * `mixes/abilities.ts` files, which define these ids as `AbilityDef`
 * records — see those files for the numbers. This file only lists which
 * ids belong to which character.
 */

import type { CharacterId } from '../ids.ts';
import type { AbilityId, MinigameKind, SpriteKey, PortraitKey } from '../../../battle/common/types.ts';

export interface FFXCharacterDef {
  id: CharacterId;
  name: string;
  spriteKey: SpriteKey;
  portraitKey: PortraitKey;
  /** Flavor text only — FFX equipment carries no stat data, so this is presentation/UI copy, not a mechanical field. */
  weaponType: string;
  /** Which timed-input overlay this character's base Overdrive opens. */
  baseOverdriveMinigame: MinigameKind;
  /** Every Overdrive ability id this character may ever fire, across every unlock tier. */
  overdriveAbilityIds: AbilityId[];
}

export const CHARACTERS: Record<CharacterId, FFXCharacterDef> = {
  tidus: {
    id: 'tidus',
    name: 'Tidus',
    spriteKey: 'tidus',
    portraitKey: 'tidus',
    weaponType: 'sword',
    // ffx-combat-core §5.3 [verified: 2 sources] — Swordplay's 4 tiers, unlocked by cumulative Overdrive executions.
    baseOverdriveMinigame: 'tidus-timing',
    overdriveAbilityIds: ['spiral-cut', 'slice-and-dice', 'energy-rain', 'blitz-ace'],
  },

  yuna: {
    id: 'yuna',
    name: 'Yuna',
    spriteKey: 'yuna',
    portraitKey: 'yuna',
    weaponType: 'staff',
    // ffx-combat-core §5.4 [verified: 2 sources] — Grand Summon is Yuna's only personal Overdrive; her aeons carry their own separate Overdrives (see src/data/ffx/aeons/).
    baseOverdriveMinigame: 'yuna-grand-summon',
    overdriveAbilityIds: ['grand-summon'],
  },

  auron: {
    id: 'auron',
    name: 'Auron',
    spriteKey: 'auron',
    portraitKey: 'auron',
    weaponType: 'blade',
    // ffx-combat-core §5.5 [verified: 2 sources] — Bushido's 4 tiers, unlocked by Jecht Sphere counts.
    baseOverdriveMinigame: 'auron-sequence',
    overdriveAbilityIds: ['dragon-fang', 'shooting-star', 'banishing-blade', 'tornado'],
  },

  wakka: {
    id: 'wakka',
    name: 'Wakka',
    spriteKey: 'wakka',
    portraitKey: 'wakka',
    weaponType: 'blitzball',
    // ffx-combat-core §5.6 [verified: 2 sources] — Slots' 4 reel sets, unlocked progressively; earlier sets remain selectable once unlocked.
    baseOverdriveMinigame: 'wakka-reels',
    overdriveAbilityIds: ['element-reels', 'attack-reels', 'status-reels', 'aurochs-reels'],
  },

  lulu: {
    id: 'lulu',
    name: 'Lulu',
    spriteKey: 'lulu',
    portraitKey: 'lulu',
    weaponType: 'doll',
    // ffx-combat-core §5.7 [verified: 2 sources] — Fury casts whichever learned Black Magic spell the player selects before the stick-rotation minigame; every learnable spell has its own Fury-tier ability id (19 total, one per Black Magic spell up to Ultima).
    baseOverdriveMinigame: 'lulu-fury',
    overdriveAbilityIds: [
      'fire-fury', 'blizzard-fury', 'thunder-fury', 'water-fury',
      'fira-fury', 'blizzara-fury', 'thundara-fury', 'watera-fury',
      'firaga-fury', 'blizzaga-fury', 'thundaga-fury', 'waterga-fury',
      'bio-fury', 'demi-fury', 'death-fury', 'drain-fury', 'osmose-fury',
      'flare-fury', 'ultima-fury',
    ],
  },

  kimahri: {
    id: 'kimahri',
    name: 'Kimahri',
    spriteKey: 'kimahri',
    portraitKey: 'kimahri',
    weaponType: 'spear',
    // ffx-combat-core §5.8 [verified: 2 sources] — all 12 Ronso Rages, learned via Lancet on enemies that carry them.
    baseOverdriveMinigame: 'kimahri-rage',
    overdriveAbilityIds: [
      'jump', 'fire-breath', 'seed-cannon', 'self-destruct', 'thrust-kick',
      'stone-breath', 'aqua-breath', 'doom', 'white-wind', 'bad-breath',
      'mighty-guard', 'nova',
    ],
  },

  rikku: {
    id: 'rikku',
    name: 'Rikku',
    spriteKey: 'rikku',
    portraitKey: 'rikku',
    weaponType: 'claws',
    // ffx-combat-core §5.9 [verified: 2 sources] — Mix is one command; the resolved result ability comes from the two chosen ingredients (see src/data/ffx/mixes/).
    baseOverdriveMinigame: 'rikku-mix',
    overdriveAbilityIds: ['mix'],
  },
};

export default CHARACTERS;
