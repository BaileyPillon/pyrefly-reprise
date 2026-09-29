/**
 * **Negation**, the Fins' and the Core's status strip (Sin, links 1 to 3).
 *
 * Package S wrote this file with the one sourced list both sides share and the
 * signatures package F fills (`docs/plans/sin-two-chapters-plan.md` §2.3: "if the
 * Negation tunables push `sin-fins-rules.ts` near 400 lines, they go in their own
 * `sin-negation.ts`"). Package G's Core Negation reads the same list.
 *
 * **What is sourced and built now:** the removal list, copied from §3.1
 * (`[decompiled]` + wiki, `[verified: 2 sources]`). It is **24 statuses**, not
 * the plan's "25" (REVIEW must-change 7): the data rows carry this list, and
 * `tests/unit/chapters/sin-data.test.ts` compares the rows against it, entry for
 * entry. Negation does **not** remove Death, Doom, Curse, Auto-Life or Eject,
 * nor the Cheer and Focus stacks, and a **permanent** status (stack 255, an
 * equipment auto-status such as Auto-Haste) survives it: the row resolves
 * through `statuses.ts#removeStatus` with reason `'dispelled'`, which spares
 * `permanent` statuses. The test pins that too.
 *
 * **What is a STUB until package F:** {@link finNegationChance}. The chance is
 * S-12, **open** and `[single source: wiki]`; F ships it behind named
 * `NEGATION_*` tunables listed in `SIN_FINS_ASSUMPTIONS`, never silently.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { CombatantId, StatusId } from '../../common/types.ts';
import type { Ctx } from '../state.ts';

/**
 * §3.1 "Negation's removal list" (both rows, chance 255), in the research's own
 * order: Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke,
 * Threaten, Sleep, Silence, Dark, Shell, Protect, Reflect, the four Nul, Regen,
 * Haste, Slow. `[decompiled]` + wiki `[verified: 2 sources]`.
 */
export const NEGATION_REMOVES: readonly StatusId[] = [
  'zombie',
  'petrify',
  'poison',
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
  'confuse',
  'berserk',
  'provoke',
  'threaten',
  'sleep',
  'silence',
  'darkness',
  'shell',
  'protect',
  'reflect',
  'nulblaze',
  'nulfrost',
  'nulshock',
  'nultide',
  'regen',
  'haste',
  'slow',
];

/** §3.1: never removed (Death, Doom, Curse, Auto-Life, Eject; Cheer and Focus are stacks, not statuses). */
export const NEGATION_SPARES: readonly StatusId[] = ['ko', 'doom', 'curse', 'auto-life', 'eject', 'cheer', 'focus'];

/**
 * §3.1 `[derived]`: the statuses Negation takes that the party is glad to lose,
 * "an unexpected mercy the HUD should show" (§11 item 4).
 */
export const NEGATION_MERCY: readonly StatusId[] = ['poison', 'petrify', 'slow', 'darkness'];

/**
 * **STUB (package F).** The chance, 0 to 1, that the Fin `finId` answers a
 * targeting with Negation right now (§5.1.3; S-12 open). The stub never fires.
 */
export function finNegationChance(ctx: Ctx, finId: CombatantId): number {
  void ctx;
  void finId;
  return 0;
}
