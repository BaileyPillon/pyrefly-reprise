/**
 * The target-scope label the strategy guide and the move advisor both print.
 *
 * A party-wide spell (Hastega), an all-enemy one, or an item that affects the
 * whole party (Stamina Tonic) is aimed at one combatant id so the engine has
 * something to resolve — but naming that id on screen reads as "Hastega ->
 * Tidus" for a move that hits all three [critic, pre-deploy gate 2026-09-18].
 * `advisor.ts`'s `candidateFor` already knew this (its `scoped` local);
 * `guide.ts` did not, so the two panels could disagree on the very same
 * frame. This module is now the one place that decision gets made, so they
 * cannot disagree again.
 *
 * ## Why a data-table lookup, not a content registry
 *
 * The obvious mirror of `advisor.ts` would resolve the command's `AbilityDef`
 * through an `FFXContentRegistry` / FFX-2 `AbilityRegistry`, the way
 * `abilityForCommand` does. Those registries, though, are populated by
 * app-boot wiring (`src/app/screens/BattleScreenContent.ts`) or handed in by
 * whoever calls the advisor (`AdvisorOptions.ffxContent` / `.ffx2`) —
 * plumbing `guide.ts` does not have today. Its only caller
 * (`src/ui/common/StrategyGuide.ts`) calls `buildGuideView(state, decision)`
 * with no registry, and growing that call is out of scope for this fix.
 *
 * `Targeting` does not need a registry at all, though: both `AbilityDef` and
 * `ItemDef` carry it as a plain field on the record, and `src/data/ffx/index.ts`
 * / `src/data/ffx2/index.ts` already export the whole catalog as flat,
 * always-loaded maps (`ABILITIES`, `ITEMS`) — the same maps `BattleScreenContent.ts`
 * feeds into the registries at boot. Reading `ABILITIES[id].targeting` here is
 * the same record `content.ability(id).targeting` would read there, without
 * needing an engine, a registry instance, or boot-order timing.
 */

import type {
  AbilityDef,
  BattleState,
  CombatantId,
  Command,
  GameId,
  ItemDef,
  Targeting,
} from '../../battle/common/types.ts';
import { letterTagsOf } from '../../battle/ffx/letterTags.ts';
import { ABILITIES as FFX_ABILITIES, ITEMS as FFX_ITEMS } from '../../data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES, ITEMS as FFX2_ITEMS } from '../../data/ffx2/index.ts';

/**
 * The word the player sees in place of one combatant's name, for a command
 * whose ability or item hits more than one — `null` for everything else.
 *
 * Mirrors `advisor.ts`'s `scoped` local exactly, word for word: `'all-allies'`
 * reads "the party", `'all-enemies'` reads "all enemies", `'all'` reads
 * "everyone". Every other `Targeting` (`single-*`, `self`, `random-*`) names
 * the one combatant the command actually resolves to, so this returns `null`
 * and the caller falls back to that name.
 */
export function scopeWord(targeting: Targeting | undefined): string | null {
  switch (targeting) {
    case 'all-allies':
      return 'the party';
    case 'all-enemies':
      return 'all enemies';
    case 'all':
      return 'everyone';
    default:
      return null;
  }
}

/** The `Targeting` a command resolves to, read straight off the data tables. */
function targetingFor(game: GameId, command: Command): Targeting | undefined {
  const abilities: Record<string, AbilityDef> = game === 'ffx2' ? FFX2_ABILITIES : FFX_ABILITIES;
  const items: Record<string, ItemDef> = game === 'ffx2' ? FFX2_ITEMS : FFX_ITEMS;
  switch (command.kind) {
    case 'ability':
    case 'overdrive':
      return abilities[command.id]?.targeting;
    case 'item':
      return items[command.id]?.targeting;
    default:
      // Attack, Defend, Summon, Dismiss, Switch, Escape, Trigger, Spherechange:
      // none of these ever resolve to an all-party or all-enemy `Targeting`,
      // so the caller's own name (or null) is already the right answer.
      return undefined;
  }
}

/**
 * The label to print for a command's target: the scope word for a party-wide
 * or all-enemy move, `fallbackName` (normally the resolved target's own name)
 * for everything else — a single ally/enemy, `self`, or a random pick.
 */
export function targetLabel(game: GameId, command: Command, fallbackName: string | null): string | null {
  return scopeWord(targetingFor(game, command)) ?? fallbackName;
}

/**
 * The name to print for one combatant as a **target**: its own name, plus the
 * letter FFX gives duplicates of one enemy ("Yu Pagoda B"), exactly as the CTB
 * tile and the target cursor's name plate show it (`letterTagsOf`, the rule
 * `turnQueue.ts` caches for the tile). `null` for an unknown id.
 *
 * Without the letter the card read "Slow → Yu Pagoda" for a Slow the advisor
 * meant for one Pagoda in particular, and a player following it Slowed the
 * other one, the one already slowed (critic round 13 PR-0208).
 *
 * **FFX only.** FFX-2's HUD names its own duplicate parts, so on an FFX-2
 * board this is the plain name [AGENTS.md rule 14].
 */
export function targetDisplayName(state: Readonly<BattleState>, id: CombatantId | null): string | null {
  const c = id ? state.combatants[id] : undefined;
  if (!c || !id) return null;
  if (state.game !== 'ffx' || c.side !== 'enemy') return c.name;
  const letter = letterTagsOf(state).get(id);
  return letter ? `${c.name} ${letter}` : c.name;
}
