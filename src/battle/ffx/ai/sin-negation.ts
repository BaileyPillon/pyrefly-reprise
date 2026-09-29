/**
 * **Negation**, the Fins' and the Core's status strip (Sin, links 1 to 3).
 *
 * Package S wrote this file with the one sourced list both sides share; package
 * F filled the Fins' chance (`docs/plans/sin-two-chapters-plan.md` §2.3: "if the
 * Negation tunables push `sin-fins-rules.ts` near 400 lines, they go in their own
 * `sin-negation.ts`"). Package G's Core Negation reads the same list and may use
 * {@link negationTakes} / {@link publishNegationTaken} for the shared HUD flag.
 *
 * **The list** is §3.1's (`[decompiled]` + wiki, `[verified: 2 sources]`): **24
 * statuses**, not the plan's "25" (REVIEW must-change 7). The data rows carry it
 * and `tests/unit/chapters/sin-data.test.ts` compares them entry for entry.
 * Negation does **not** remove Death, Doom, Curse, Auto-Life or Eject, nor the
 * Cheer and Focus stacks, and a **permanent** status (stack 255, an equipment
 * auto-status) survives it: the row resolves through
 * `statuses.ts#removeStatus` with reason `'dispelled'`, which spares `permanent`.
 *
 * **The chance is S-12: open, `[single source: wiki]`.** It ships behind the
 * named `NEGATION_*` tunables below, each listed in `SIN_FINS_ASSUMPTIONS`,
 * never silently. The GameFAQs guides give only the direction (bover_87: "The
 * chance of seeing Negation increases with each buff on you and each debuff on
 * the Fin", `[verified: 2 sources]` for the direction) or "random" (Gestahl).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { CombatantId, FFXCombatant, StatusId } from '../../common/types.ts';
import { type Ctx, has, livingFriendlies, statusOf, tryActor } from '../state.ts';
import { SIN_LEFT_FIN_ID, SIN_NEGATION_TAKEN, SIN_RIGHT_FIN_ID } from './sin-ids.ts';

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

// ---------------------------------------------------------------------------
// S-12: the wiki's near formula, as named tunables [single source: wiki]
// ---------------------------------------------------------------------------

/** §5.1.3 [single source: wiki]: the counter starts at 2. */
export const NEGATION_BASE = 2;
/** §5.1.3 [single source: wiki]: +2 for the first Break on the Fin. */
export const NEGATION_FIRST_BREAK = 2;
/** §5.1.3 [single source: wiki]: +1 for the second Break on the Fin (Armor and Mental are the only landable two, §2.3). */
export const NEGATION_SECOND_BREAK = 1;
/** §5.1.3 [single source: wiki]: +1 for each of these on each party member on the field. */
export const NEGATION_PARTY_BUFFS: readonly StatusId[] = ['shell', 'reflect', 'haste'];
/** §5.1.3 [single source: wiki]: +1 when the rightmost party member has Protect. */
export const NEGATION_PROTECT_RIGHTMOST = 1;
/** §5.1.3 [single source: wiki]: +2 when the leftmost party member has Protect. */
export const NEGATION_PROTECT_LEFTMOST = 2;
/** §5.1.3 [single source: wiki]: subtract 3 (never below 0). */
export const NEGATION_OFFSET = 3;
/** §5.1.3 [single source: wiki]: divide by 16 for the Left Fin. */
export const NEGATION_DIVISOR_LEFT = 16;
/** §5.2 [single source: wiki]: divide by 12 for the Right Fin ("more often"). */
export const NEGATION_DIVISOR_RIGHT = 12;
/** §5.1.3 [single source: wiki] + row 6:167 = Self [decompiled]: 80 % at FAR, only while the Fin has Mental Break. */
export const NEGATION_FAR_CHANCE = 0.8;
/** The Breaks the count reads on the Fin (only Armor and Mental land on it, §2.3). */
export const NEGATION_BREAKS: readonly StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];

/**
 * A bench switch, not a proposal (plan §5, S-12 "Negation off"): set
 * `state.flags['sin.negation.off'] = true` after `init` and no Fin Negation
 * fires. It bounds how much of the chapter's weight rests on a single-source
 * formula. Nothing in the game sets it.
 */
export const SIN_NEGATION_OFF = 'sin.negation.off';

/**
 * **Our estimate (S-12):** "rightmost" and "leftmost" read as the **last** and
 * **first** living member on the field, in slot order (an aeon alone is both).
 * The wiki's left/right weighting is odd enough that it may be a bitfield
 * artefact; nothing else sources it.
 */
function edgeMembers(ctx: Ctx): { leftmost?: FFXCombatant; rightmost?: FFXCombatant } {
  const on = livingFriendlies(ctx);
  return { leftmost: on[0], rightmost: on[on.length - 1] };
}

function range(ctx: Ctx): 'near' | 'far' {
  return ctx.state.flags['airship.range'] === 'far' ? 'far' : 'near';
}

/**
 * The raw NEAR count `c` of §5.1.3 for this Fin right now, before the offset
 * and the divisor. Exported for the tactic, the HUD and the bench.
 */
export function finNegationCount(ctx: Ctx, fin: FFXCombatant): number {
  const breaks = NEGATION_BREAKS.filter((s) => has(fin, s)).length;
  let c = NEGATION_BASE;
  if (breaks >= 1) c += NEGATION_FIRST_BREAK;
  if (breaks >= 2) c += NEGATION_SECOND_BREAK;
  for (const m of livingFriendlies(ctx)) for (const s of NEGATION_PARTY_BUFFS) if (has(m, s)) c += 1;
  const { leftmost, rightmost } = edgeMembers(ctx);
  if (rightmost && has(rightmost, 'protect')) c += NEGATION_PROTECT_RIGHTMOST;
  if (leftmost && has(leftmost, 'protect')) c += NEGATION_PROTECT_LEFTMOST;
  return c;
}

/**
 * The chance, 0 to 1, that the Fin `finId` answers a targeting with Negation
 * right now (§5.1.3, §5.2; S-12). NEAR: `max(0, c - 3) / D`, `D` 16 (Left) or
 * 12 (Right). FAR: 80 % while the Fin has Mental Break, else 0. 0 for anything
 * that is not a Fin, and while {@link SIN_NEGATION_OFF} is set.
 */
export function finNegationChance(ctx: Ctx, finId: CombatantId): number {
  if (ctx.state.flags[SIN_NEGATION_OFF] === true) return 0;
  if (finId !== SIN_LEFT_FIN_ID && finId !== SIN_RIGHT_FIN_ID) return 0;
  const fin = tryActor(ctx, finId);
  if (!fin) return 0;
  if (range(ctx) === 'far') return has(fin, 'mental-break') ? NEGATION_FAR_CHANCE : 0;
  const divisor = finId === SIN_RIGHT_FIN_ID ? NEGATION_DIVISOR_RIGHT : NEGATION_DIVISOR_LEFT;
  return Math.max(0, finNegationCount(ctx, fin) - NEGATION_OFFSET) / divisor;
}

/**
 * What a Negation on these combatants will take, per combatant: every listed
 * status each one carries that is not permanent (the dispel spares stack 255).
 * Negation always hits (chance 255, §3.1) and does not bounce (the rows are not
 * reflectable), so this is exact when read the instant before it resolves.
 */
export function negationTakes(targets: readonly FFXCombatant[]): Record<CombatantId, StatusId[]> {
  const out: Record<CombatantId, StatusId[]> = {};
  for (const t of targets) {
    const taken = NEGATION_REMOVES.filter((s) => has(t, s) && statusOf(t, s)?.permanent !== true);
    if (taken.length > 0) out[t.id] = taken;
  }
  return out;
}

/**
 * Publish {@link negationTakes} on `sin.negation.lastTaken` for the HUD (§11
 * item 4). `BattleState.flags` holds only numbers, strings and booleans, so the
 * map `Record<CombatantId, StatusId[]>` that `sin-ids.ts` names travels as its
 * **JSON string**; {@link readNegationTaken} turns it back. `'{}'` = nothing yet.
 */
export function publishNegationTaken(ctx: Ctx, targets: readonly FFXCombatant[]): void {
  ctx.state.flags[SIN_NEGATION_TAKEN] = JSON.stringify(negationTakes(targets));
}

/** The last Negation's haul, per combatant, read off the flags (`{}` when none has fired or the key is absent). */
export function readNegationTaken(flags: Readonly<Record<string, unknown>>): Record<CombatantId, StatusId[]> {
  const raw = flags[SIN_NEGATION_TAKEN];
  if (typeof raw !== 'string') return {};
  try {
    const v: unknown = JSON.parse(raw);
    return v !== null && typeof v === 'object' ? (v as Record<CombatantId, StatusId[]>) : {};
  } catch {
    return {};
  }
}
