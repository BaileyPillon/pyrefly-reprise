/**
 * A chapter's voice for the recorded SFX set (D-302): the presenter asks with raw ids
 * (`engine/BattlePresenterSfx.ts`), this resolves them against the live engine state and the chapter's
 * game's data, and `audio/sfxV2/battleVoice.ts` picks the cue.
 *
 * Resolved here, and only from what already exists:
 * - who acts and who is hit: the combatant's side; an FFX party member's `weaponType`
 *   (`data/ffx/characters`), an FFX-2 girl's worn dressphere (`dresspheres.current`), an FFX-2
 *   enemy's aeon or machina voice (`audio/sfxV2/weapons.ts`);
 * - what the action is: its command kind, and its ability or item-effect row (element, damage type,
 *   and for FFX the `sfxKey` the row names; `audio/sfxV2/families.ts`).
 *
 * Game case (AGENTS.md rule 14): an FFX chapter gets an FFX voice, an FFX-2 chapter an FFX-2 voice;
 * FF7 gets none (`null`), so its presenter plays exactly what it played before.
 */

import type { AbilityDef, AnyCombatant, BattleEvent, BattleState, GameId, ItemDef } from '../../battle/common/types.ts';
import type { SfxAsk, SfxVoice } from '../../engine/BattlePresenterSfx.ts';
import { voiceBattle, type VoiceAction, type VoiceActor, type VoiceGame } from '../../audio/sfxV2/battleVoice.ts';
import { FFX2_ENEMY_VOICES, FFX_WEAPON_TYPES, ffx2Weapon } from '../../audio/sfxV2/weapons.ts';
import { familyOfFfx2Ability, familyOfSfxKey } from '../../audio/sfxV2/families.ts';
import { CHARACTERS as FFX_CHARACTERS } from '../../data/ffx/characters/index.ts';
import { ITEMS as FFX_ITEMS } from '../../data/ffx/index.ts';
import { ITEMS as FFX2_ITEMS } from '../../data/ffx2/index.ts';
import { abilityRowsFor } from './battleAbilityFacts.ts';

type Rows = (id: string) => AbilityDef | undefined;

function actorOf(game: VoiceGame, state: BattleState | null, id: string | null): VoiceActor | null {
  if (!id) return null;
  const c = state?.combatants[id] as (AnyCombatant & { dresspheres?: { current?: string } }) | undefined;
  const side = c?.side ?? null;
  let weapon: VoiceActor['weapon'] = null;
  if (side === 'party') {
    if (game === 'ffx') {
      const def = (FFX_CHARACTERS as Record<string, { weaponType: string } | undefined>)[id];
      weapon = def ? (FFX_WEAPON_TYPES[def.weaponType] ?? null) : null;
    } else {
      weapon = ffx2Weapon(id, c?.dresspheres?.current);
    }
  }
  const voice = game === 'ffx2' && side === 'enemy' ? (FFX2_ENEMY_VOICES[id] ?? null) : null;
  return { id, side, weapon, voice };
}

function effectOf(item: ItemDef | undefined, rows: Rows): AbilityDef | undefined {
  if (!item) return undefined;
  return typeof item.effect === 'string' ? rows(item.effect) : item.effect;
}

function actionOf(game: VoiceGame, ask: SfxAsk, rows: Rows): VoiceAction | null {
  const a = ask.action;
  if (!a) return null;
  const kind = a.command.kind;
  const items = (game === 'ffx' ? FFX_ITEMS : FFX2_ITEMS) as Record<string, ItemDef | undefined>;
  const isItem = kind === 'item';
  const def = isItem ? (effectOf(a.command.id ? items[a.command.id] : undefined, rows) ?? (a.abilityId ? rows(a.abilityId) : undefined)) : a.abilityId ? rows(a.abilityId) : undefined;
  const element = def?.element.find((e) => e !== 'none') ?? null;
  const family = game === 'ffx' ? familyOfSfxKey(def?.sfxKey) : familyOfFfx2Ability(def?.id ?? a.abilityId);
  return { commandKind: kind, element, damageType: def?.damageType ?? null, family, isItem };
}

/** The voice a chapter of `game` hands its presenter, or `null` (FF7 and anything else: no voice). */
export function sfxVoiceFor(game: GameId, state?: () => BattleState | null): SfxVoice | null {
  if (game !== 'ffx' && game !== 'ffx2') return null;
  const rows = abilityRowsFor(game) as Rows;
  return (ask) => {
    const s = state?.() ?? null;
    const e = ask.event as (BattleEvent & { element?: string; crit?: boolean; status?: string; stage?: number; to?: string }) | null;
    const voiced = voiceBattle({
      game,
      moment: ask.moment,
      actor: actorOf(game, s, ask.actorId),
      target: actorOf(game, s, ask.targetId),
      action: actionOf(game, ask, rows),
      nth: ask.nth,
      element: e?.element ?? null,
      crit: e?.crit === true,
      ...(e?.status ? { status: e.status } : {}),
      departure: ask.departure,
      ...(typeof e?.stage === 'number' ? { stage: e.stage } : {}),
      ...(e?.to ? { to: e.to } : {}),
    });
    return voiced ? { key: voiced.key, ...(voiced.gain !== undefined ? { gain: voiced.gain } : {}) } : null;
  };
}
