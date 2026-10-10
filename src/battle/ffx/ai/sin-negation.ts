/**
 * **Negation**, the Fins' and the Core's status strip, and the scores that decide it (Sin, links 1 to 3;
 * re-parity AI lane C, **FFX only**).
 *
 * **The list** is the game's (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` 5.3): **24 statuses** (Zombie, Petrify, Poison,
 * the four Breaks, Confuse, Berserk, Provoke, Threaten, Sleep, Silence, Dark, Shell, Protect, Reflect, the four Nul, Regen,
 * Haste, Slow). Negation does **not** remove Death, Doom, Curse, Auto-Life or Eject, nor the Cheer and Focus stacks, and a
 * **permanent** status (stack 255, an equipment auto-status) survives it: the row resolves through
 * `statuses.ts#removeStatus` with reason `'dispelled'`, which spares `permanent`.
 *
 * **The chance is the script's, no longer an estimate** (S-12): each Fin and the Core read the three party slots, and the
 * scores they build from them are below. A slot is Character #1, #2 or #3 in menu order, alive or not; a slot the summon
 * routine emptied reads 0 on every status, and an aeon's statuses count in its summoner's slot (note 1.2).
 *
 * | | Shell | Reflect | Protect | Haste | Fin / Core |
 * |---|---|---|---|---|---|
 * | Fin (on every hit event) | +1 each | +1 each | slot 1 +1, slot 2 0, slot 3 +2 | 0, 3, 4, 5 for 0 to 3 slots | Armor Break +2, Mental Break +1 |
 * | Core (once per Core turn) | +1 each | +1 each | slot 1 +1, slot 2 0, slot 3 +2 | +2 each | Armor Break +3, Mental Break +3 |
 *
 * The Left Fin rolls `GetRandomValue() mod 16` against `max(0, score - 3)`, the Right Fin `mod 12`; at FAR both roll
 * `mod 100 < 80` and need Mental Break on them. The Core keeps its score and lowers it by 3 on each hit event until its next
 * turn. {@link finNegationChance} is the exact probability over the 65,536 values.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { CombatantId, FFXCombatant, StatusId } from '../../common/types.ts';
import { type Ctx, has, statusOf, tryActor } from '../state.ts';
import { SIN_LEFT_FIN_ID, SIN_NEGATION_TAKEN, SIN_RIGHT_FIN_ID } from './sin-ids.ts';

/**
 * Negation's removal list (both rows, chance 255), in the research's own order. `[decompiled]` + wiki
 * `[verified: 2 sources]`.
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

/** Never removed: Death, Doom, Curse, Auto-Life, Eject; Cheer and Focus are stacks, not statuses. */
export const NEGATION_SPARES: readonly StatusId[] = ['ko', 'doom', 'curse', 'auto-life', 'eject', 'cheer', 'focus'];

/** The statuses Negation takes that the party is glad to lose, "an unexpected mercy the HUD should show" (§11 item 4). */
export const NEGATION_MERCY: readonly StatusId[] = ['poison', 'petrify', 'slow', 'darkness'];

/** The Left Fin's modulus at NEAR. */
export const NEGATION_DIVISOR_LEFT = 16;
/** The Right Fin's modulus at NEAR. */
export const NEGATION_DIVISOR_RIGHT = 12;
/** At FAR, `GetRandomValue() mod 100` under this, with Mental Break on the Fin. */
export const NEGATION_FAR_BELOW = 80;
/** Both Fins subtract 3 from the score before the roll; the Core subtracts 3 on each hit event. */
export const NEGATION_OFFSET = 3;

/**
 * A bench switch, not a proposal (plan §5, S-12 "Negation off"): set `state.flags['sin.negation.off'] = true` after `init` and
 * no Fin Negation fires. It bounds how much of the chapter's weight rests on the Negation rolls. Nothing in the game sets it.
 */
export const SIN_NEGATION_OFF = 'sin.negation.off';

/**
 * The three party slots as the scripts read them: Character #1 to #3 in menu order, whether alive or not. With an aeon out the
 * summoner's slot reads the aeon and the other slots read nothing.
 */
export function partySlots(ctx: Ctx): Array<FFXCombatant | undefined> {
  const slots = ctx.state.activeIds.slice(0, 3).map((id) => tryActor(ctx, id));
  while (slots.length < 3) slots.push(undefined);
  const aeonId = ctx.state.aeonId;
  if (aeonId === null) return slots;
  const aeon = tryActor(ctx, aeonId);
  const owner = aeon?.aeon?.ownerId;
  return slots.map((c) => (aeon !== undefined && c !== undefined && c.id === owner ? aeon : undefined));
}

/** How many of the three slots carry `status` (a status of an emptied slot reads 0). */
function slotsWith(slots: ReadonlyArray<FFXCombatant | undefined>, status: StatusId): number {
  return slots.filter((c) => c !== undefined && has(c, status)).length;
}

/** The Protect weight of the slots: slot 1 counts once, slot 2 not at all, slot 3 twice (the script reads slot 3 in two places). */
function protectWeight(slots: ReadonlyArray<FFXCombatant | undefined>): number {
  const [one, , three] = slots;
  return (one !== undefined && has(one, 'protect') ? 1 : 0) + (three !== undefined && has(three, 'protect') ? 2 : 0);
}

/** The Fin's score on a hit event (note 5.3, step 4). */
export function finScore(ctx: Ctx, fin: FFXCombatant): number {
  const slots = partySlots(ctx);
  const hasted = slotsWith(slots, 'haste');
  const hasteBonus = hasted === 0 ? 0 : hasted + 2; // 0, 3, 4, 5 for 0 to 3 slots
  return (
    slotsWith(slots, 'shell') +
    slotsWith(slots, 'reflect') +
    protectWeight(slots) +
    hasteBonus +
    (has(fin, 'armor-break') ? 2 : 0) +
    (has(fin, 'mental-break') ? 1 : 0)
  );
}

/** The Core's score, recomputed at the start of each Core turn (note 6.5). */
export function coreScore(ctx: Ctx, core: FFXCombatant): number {
  const slots = partySlots(ctx);
  return (
    slotsWith(slots, 'shell') +
    2 * slotsWith(slots, 'haste') +
    slotsWith(slots, 'reflect') +
    protectWeight(slots) +
    (has(core, 'armor-break') ? 3 : 0) +
    (has(core, 'mental-break') ? 3 : 0)
  );
}

/**
 * The exact probability, 0 to 1, that the Fin `finId` answers a hit with Negation right now (over the 65,536 values of
 * `GetRandomValue()`): at NEAR `P(mod m < max(0, S - 3))` with `m` 16 (Left) or 12 (Right), so `k/16` for the Left Fin and
 * `(5,461 k + min(k, 4)) / 65,536` for the Right; at FAR 52,436/65,536 with Mental Break on the Fin, else 0. 0 for anything that is
 * not a Fin, and while {@link SIN_NEGATION_OFF} is set.
 */
export function finNegationChance(ctx: Ctx, finId: CombatantId): number {
  if (ctx.state.flags[SIN_NEGATION_OFF] === true) return 0;
  if (finId !== SIN_LEFT_FIN_ID && finId !== SIN_RIGHT_FIN_ID) return 0;
  const fin = tryActor(ctx, finId);
  if (!fin) return 0;
  if (ctx.state.flags['airship.range'] === 'far') return has(fin, 'mental-break') ? 52_436 / 65_536 : 0;
  const k = Math.max(0, finScore(ctx, fin) - NEGATION_OFFSET);
  if (finId === SIN_LEFT_FIN_ID) return Math.min(1, k / NEGATION_DIVISOR_LEFT);
  return Math.min(1, (5_461 * k + Math.min(k, 4)) / 65_536);
}

/**
 * What a Negation on these combatants will take, per combatant: every listed status each one carries that is not permanent (the
 * dispel spares stack 255). Negation always hits (chance 255) and does not bounce (the rows are not reflectable), so this is
 * exact when read the instant before it resolves.
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
 * Publish {@link negationTakes} on `sin.negation.lastTaken` for the HUD (§11 item 4). `BattleState.flags` holds only numbers,
 * strings and booleans, so the map `Record<CombatantId, StatusId[]>` that `sin-ids.ts` names travels as its **JSON string**;
 * {@link readNegationTaken} turns it back. `'{}'` = nothing yet.
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
