/**
 * Chapter X, **Kimahri's slot** on the lines that open with Jegged's two extras (`reflect-bio`; research
 * `jegged-encounter-guides-ffx-b.md` §3: "Have Lulu cast Bio on Seymour very early" and "Put Reflect ... on Natus himself so that
 * Mortibody cannot heal him much with Cura"; `ffx-seymour-natus-highbridge.md` §6.3 row 5, `[verified: 2 sources]`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * A switch gives the incoming member the outgoing member's turn at once (`src/battle/ffx/execute.ts`, `handOffTo`), so a detour
 * through the bench costs only the casts themselves. Kimahri's first turn goes to Lulu (**Bio** on Natus until the Poison is on
 * him: 1,440 a Natus turn, 4 % of his HP, and a tick never moves his pattern); Lulu's next turn goes to Rikku (**Reflect** on
 * Natus, so Mortibody's Cura, 1,200 a cast, bounces onto a guardian instead of healing him; cast after Bio, because a spell
 * aimed at a Reflected Natus bounces back at its caster); Rikku's next turn goes to Auron, who stays. The shipped line
 * sends Kimahri straight to Auron.
 *
 * Each step runs after the line's upkeep (Soft, revive, heal) and Talk, like the shipped swap, and each is skipped once it is done.
 */

import type { AvailableCommand, Command, FFXCombatant } from '../../battle/common/types.ts';
import { has } from './common.ts';
import { SEYMOUR_NATUS_ID, offered, switchTo, use } from './seymour-natus-rows.ts';

export interface DetourPlan {
  /** Lulu opens with Bio until Natus is Poisoned. */
  bio: boolean;
  /** Rikku puts Reflect on Natus once. */
  reflectNatus: boolean;
}

/**
 * The detour's command for `actorId`, or null when the detour has nothing to ask (the caller then sends Kimahri on to Auron,
 * or lets the member act as the line says).
 */
export function detourStep(actorId: string, commands: AvailableCommand[], natus: FFXCombatant, plan: DetourPlan): Command | null {
  const poisoned = has(natus, 'poison');
  const reflected = has(natus, 'reflect');
  const wantBio = plan.bio && !poisoned;
  const wantReflect = plan.reflectNatus && !reflected;
  if (actorId === 'kimahri') {
    if (wantBio) {
      const swap = switchTo(commands, 'lulu');
      if (swap) return swap;
    }
    if (wantReflect) {
      const swap = switchTo(commands, 'rikku');
      if (swap) return swap;
    }
    return null;
  }
  if (actorId === 'lulu') {
    if (wantBio && offered(commands, 'ability', 'bio', SEYMOUR_NATUS_ID)) return use('ability', 'bio', SEYMOUR_NATUS_ID);
    if (wantReflect) {
      const swap = switchTo(commands, 'rikku');
      if (swap) return swap;
    }
    return switchTo(commands, 'auron');
  }
  if (actorId === 'rikku') {
    if (wantReflect && offered(commands, 'ability', 'reflect', SEYMOUR_NATUS_ID)) return use('ability', 'reflect', SEYMOUR_NATUS_ID);
    return switchTo(commands, 'auron');
  }
  return null;
}
