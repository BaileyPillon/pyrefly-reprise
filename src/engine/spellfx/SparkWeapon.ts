/**
 * Which weapon a blow's striker swings, for the hit sparks (motion pass, lane "fx"; `effects-painted-hit.ts`). Presentation only; nothing here is new game data (AGENTS.md rule 6): the tables are
 * the recorded SFX set's own (`audio/sfxV2/weapons.ts`, D-302), which read FFX's `weaponType` per character from `src/data/ffx/characters` and, for FFX-2, the dressphere a girl is wearing
 * (Gunner and Gun Mage a gun, Warrior a greatsword) or her own default weapon (Yuna a gun, Rikku daggers, Paine a greatsword).
 *
 * Game case (rule 14): an FFX chapter reads FFX's table, an FFX-2 chapter FFX-2's; an FFX id never resolves in an FFX-2 chapter. Anyone who is not on those tables (a boss, a foe) gets `generic`.
 *
 * Pure: no `three`, no DOM.
 */

import { FFX_WEAPON_TYPES, ffx2Weapon } from '../../audio/sfxV2/weapons.ts';
import { CHARACTERS as FFX_CHARACTERS } from '../../data/ffx/characters/index.ts';
import type { SparkKind } from './effects-painted-hit.ts';
import type { FxGame } from './SpellFxRegistry.ts';

/** The spark kind for a combatant id in `game`; `dressphere` is an FFX-2 girl's current dressphere id (optional: her own default weapon without it). */
export function sparkKindFor(game: FxGame, id: string | undefined, dressphere?: string | null): SparkKind {
  if (!id) return 'generic';
  if (game === 'ffx') {
    const def = (FFX_CHARACTERS as Record<string, { weaponType: string } | undefined>)[id];
    const w = def ? FFX_WEAPON_TYPES[def.weaponType] : undefined;
    return w ?? 'generic';
  }
  if (game === 'ffx2') return ffx2Weapon(id, dressphere) ?? 'generic';
  return 'generic';
}
