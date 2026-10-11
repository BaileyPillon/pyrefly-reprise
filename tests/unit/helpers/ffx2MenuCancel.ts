/**
 * Test helper: which ability is behind a hit, and does it carry the Delay effect that closes an open FFX-2 command menu.
 *
 * Re-parity W4 (2026-10-10; FFX-2 only) deleted `src/battle/ffx2/menu-cancel.ts`: the engine no longer asks the ability's flags
 * whether a hit closes a menu, it applies the game's own rule (`apply_atb_damage`, exe 0x0061b620: a hit of the ATB class pushes
 * the target's gauge back and closes the menu it had open; nothing else does). The two tests that watch the engine from outside
 * (`ffx2-hit-closes-menu.test.ts`, `ffx2-menu-cancel-delay.test.ts`) still need to know, from the sourced rows, which abilities are
 * the Delay ones, to say which hit should have closed a menu. That question lives here, where only tests ask it.
 */

import type { AbilityDef, AbilityId, CombatantId } from '../../../src/battle/common/types.ts';
import type { EventDraft } from '../../../src/battle/ffx2/internal.ts';

/**
 * True when the row carries a Delay effect or Action-cancel: the `weak-delay` / `strong-delay` action flags, or a `delay-effect` /
 * `action-cancel` status row. In the FFX-2 chapters these are Ormi's Supercollider and Huggles and Leblanc's Mach Fan
 * (`research/ffx2-leblanc-syndicate.md` section 4) and the Vegnagun Leg's Vita Brevis (`research/ffx2-vegnagun-shuyin.md` 3.2).
 */
export function carriesMenuCancel(ability: AbilityDef | undefined): boolean {
  if (!ability) return false;
  if (ability.flags.includes('weak-delay') || ability.flags.includes('strong-delay')) return true;
  return (ability.statusEffects ?? []).some((s) => s.status === 'delay-effect' || s.status === 'action-cancel');
}

/**
 * The ability each unit is resolving, read from the event drafts. An `action-start` pushes its `abilityId`, the matching
 * `action-end` pops it; a counter resolved inside another action has its own start and end, so it nests.
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
}
