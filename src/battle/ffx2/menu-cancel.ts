/**
 * **Which hit closes an open command menu: the menu-cancel correction.** FFX-2 only (AGENTS.md
 * rule 14; FFX has no running clock under a menu).
 *
 * Release 17 closes a girl's open menu on any enemy hit that deals her damage (decision sheet
 * 2026-09-25 item 4 A1, `active.ts` `closesOpenMenu`), from `research/ffx2-combat-core.md` §1.1.
 * §9.2 (commit `ea05f877`, `[verified: 2 sources]`) corrects §1.1: the menu closes only when the
 * hit carries a **Delay effect** (DELEF, Split_Infinity G1041) or **Action-cancel** (ACTIC, G1042),
 * both named per ability. This file answers "does the ability behind this hit carry one?" from the
 * ability's own sourced row, and remembers which ability each unit is resolving so the engine can
 * ask. It is read only while `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES (OFF) or the engine
 * option `menuCancelOnlyDelayAbilities` is on.
 *
 * Pure, DOM-free and deterministic: it reads event drafts and never writes state or events, so no
 * log moves while the switch is off.
 */

import type { AbilityDef, AbilityId, CombatantId } from '../common/types.ts';
import type { EventDraft } from './internal.ts';

/**
 * True when the row carries a Delay effect or Action-cancel: the `weak-delay` / `strong-delay`
 * action flags, or a `delay-effect` / `action-cancel` status row. In the FFX-2 chapters these are
 * Ormi's Supercollider and Huggles and Leblanc's Mach Fan (`research/ffx2-leblanc-syndicate.md`
 * §4, `[verified: 2 sources]`) and the Vegnagun Leg's Vita Brevis (`research/ffx2-vegnagun-shuyin.md`
 * §3.2). No row is given the flag here: an unknown ability (undefined) carries nothing.
 */
export function carriesMenuCancel(ability: AbilityDef | undefined): boolean {
  if (!ability) return false;
  if (ability.flags.includes('weak-delay') || ability.flags.includes('strong-delay')) return true;
  return (ability.statusEffects ?? []).some((s) => s.status === 'delay-effect' || s.status === 'action-cancel');
}

/**
 * The ability each unit is resolving, read from the drafts the engine emits. An `action-start`
 * pushes its `abilityId` (a charged ability's start is emitted when its charge begins, and no
 * second start comes when it fires); the matching `action-end` pops it. A counter resolved inside
 * another action (`engineHooks.ts` `resolveAsCounter`) has its own start and end, so it nests.
 */
export class ActingAbilities {
  private readonly stacks = new Map<CombatantId, Array<AbilityId | undefined>>();

  note(draft: EventDraft): void {
    if (draft.type === 'action-start') {
      const stack = this.stacks.get(draft.actorId) ?? [];
      stack.push(draft.abilityId);
      this.stacks.set(draft.actorId, stack);
    } else if (draft.type === 'action-end') {
      this.stacks.get(draft.actorId)?.pop();
    }
  }

  /** The ability `actorId` is resolving right now, if any. */
  current(actorId: CombatantId | undefined): AbilityId | undefined {
    if (!actorId) return undefined;
    const stack = this.stacks.get(actorId);
    return stack && stack.length > 0 ? stack[stack.length - 1] : undefined;
  }

  clear(): void {
    this.stacks.clear();
  }
}
