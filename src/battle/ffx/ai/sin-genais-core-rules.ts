/**
 * **Sinspawn Genais and Sin's Core** (Sin, link 3): constants, setup, runtime marks, the shell, the liveness hook and
 * `SIN_CORE_ASSUMPTIONS` (re-parity AI lane C, **FFX only**).
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 6 (m139 Genais, m138 the Core in `ssbt02_00`, run in the note's
 * interpreter over all 16,384 buff layouts and the 36,000-wide modulus), which replaced `research/ffx-sin.md` §5.3 and the
 * estimates of `docs/plans/sin-two-chapters-plan.md` §2.4. The two rotations and their `onHit` hooks are `./sin-genais-core.ts`.
 *
 * ## The shape (the script's)
 *
 * ```
 * Genais starts IN its shell (Armored, percentage-immune); its first turn exits it (HP > 12,000, strict).
 * Out of the shell   Venom, Venom, Thrashing, repeat (the cycle restarts when the shell is entered); a spell (formula byte 3)
 *                    that hits it is answered with Waterga on the caster; below 10,000 (strict) it enters the shell.
 * In the shell       Sigh; every hit event except the Core's Gravija (a miss and a status-only action included) is answered
 *                    with Cura on itself; above 12,000 (strict) it exits.
 * Core, charged      Gravija on the front line AND Genais, whatever Genais is doing now.
 * Core, otherwise    the charge dummy while Genais is shelled or dead; "inactive" while it is out.
 * Core, targeted     while Genais lives and is OUT of its shell a magical-type command is absorbed ("Magic absorbed.", no hit
 *                    event, nothing happens); otherwise every hit event rolls Negation against the stored score (lowered by 3
 *                    each time) or, failing that, a counter with the odds P(draw mod 36,000 > HP): Fire, Blizzard, Thunder, Water.
 * ```
 *
 * ## The liveness hook (REVIEW must-change 2)
 *
 * {@link syncGenaisCoreLiveness} runs at the top of every `afterAction` (`reactions.ts#runMortibsorptionIfDown`, one line), for
 * every command kind, and again at the top of both scripts. The marks that depend on who is alive (the Core's reach and magic
 * absorption while Genais lives; `sin.core.down` and Genais a non-combatant once the Core falls) are recomputed there from
 * `isAlive`. A dead Genais has left the battle (its death animation value is 1): the Core takes magic normally and its distance
 * is 0.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, counters, Armored.
 */

import type { CombatantId, FFXCombatant } from '../../common/types.ts';
import { baseCtb } from '../math.ts';
import { type ActorRuntime, type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { applyBossOpening } from './opening.ts';
import {
  SIN_CORE_COUNTER_STEP, SIN_CORE_DOWN, SIN_CORE_GUARD, SIN_CORE_ID, SIN_CORE_SCORE, SIN_CORE_SCRIPT, SIN_CORE_STATE,
  SIN_GENAIS_ID, SIN_GENAIS_SCRIPT, SIN_GENAIS_SHELLED, type SinCoreState,
} from './sin-ids.ts';

// ---------------------------------------------------------------------------
// The script's thresholds (strict)
// ---------------------------------------------------------------------------

/** m139 @0x124: in the shell, `HP > 12,000` (60 %) and it exits on its next turn. */
export const GENAIS_EXIT_ABOVE = 12_000;
/** m139 @0x1b8: out of the shell, `HP < 10,000` (50 %) and it enters on its next turn. */
export const GENAIS_ENTER_BELOW = 10_000;
/** The shell's two marks: Armored, and immune to percentage damage (Demi, the Core's Gravija do nothing to it). */
const SHELL_FLAGS = ['armored', 'immune-to-percentage-damage'] as const;
/** The Venom count at which Thrashing comes (Venom, Venom, Thrashing). */
export const VENOM_BEFORE_THRASHING = 2;

// ---------------------------------------------------------------------------
// Link 3's own `state.flags` keys (beside the shared ones in `sin-ids.ts`)
// ---------------------------------------------------------------------------

/** Genais's Venom count (`v5`, 0 to 2); entering the shell zeroes it. In flags so a preview runtime keeps it. */
export const SIN_GENAIS_STEP = 'sin.genais.step';
/** Bench switch: `false` turns the Core's Negation off (S-12's bound, not a proposal). */
export const SIN_CORE_NEGATION_ON = 'sin.core.negationOn';

/** **Estimates and owner decisions carried by link 3**, as data, so the handoff, the guide and the tests can print them. */
export const SIN_CORE_ASSUMPTIONS: ReadonlyArray<{ id: string; claim: string; value: unknown }> = [
  { id: 'S-2', claim: 'Genais exits its shell on its next turn above 12,000 HP and enters it below 10,000, both strict (the script)', value: GENAIS_EXIT_ABOVE },
  { id: 'S-12', claim: "The Core's Negation is the script's stored score (shell, haste, reflect, protect, breaks) lowered by 3 on each hit event until its next turn, against `GetRandomValue() mod 8`", value: 8 },
  { id: 'S-13', claim: 'The Core counters with the probability that GetRandomValue() mod 36,000 exceeds its HP (0 % at full HP, 45.07 % at half), after a failed Negation roll', value: 36_000 },
  { id: 'S-15', claim: 'Genais absorbs magic aimed at the Core only while it is OUT of its shell; the script has no absorption in the shell (three secondary sources said otherwise)', value: 'out-of-shell' },
  { id: 'cura-per-hit-event', claim: 'Cura answers every hit event on shelled Genais except the Core\'s Gravija: a miss and a status-only action too; it does not chain (the Cura is a reaction)', value: 'every-event' },
  { id: 'counter-step', claim: 'The Fire, Blizzard, Thunder, Water cycle moves only when an element fires; a Negation does not advance it', value: true },
  { id: 'reflect-bounce', claim: "The Core's party-wide counters never bounce (engine rule, statuses.ts#bouncesOffReflect; research §2.3 says they do: open)", value: 'engine' },
  { id: 'liveness-lag', claim: "A Genais KO inside the counter phase (Zombie + Cura) is picked up at the end of that same action (`ticks.ts#onTurnEnd` runs the hook again after the counters), before the next menu", value: 'same-action' },
];

// ---------------------------------------------------------------------------
// Reading the board
// ---------------------------------------------------------------------------

/** True while this battle is link 3 (the setup published the Core's state). */
export function isGenaisCoreBattle(ctx: Ctx): boolean {
  return ctx.state.flags[SIN_CORE_STATE] !== undefined;
}

export function coreState(ctx: Ctx): SinCoreState {
  return (ctx.state.flags[SIN_CORE_STATE] as SinCoreState | undefined) ?? 'inactive';
}

/** Genais is in its shell (`bv0x04` = 0). */
export function genaisShelled(ctx: Ctx): boolean {
  return ctx.state.flags[SIN_GENAIS_SHELLED] === true;
}

export function genaisAlive(ctx: Ctx): boolean {
  const g = tryActor(ctx, SIN_GENAIS_ID);
  return g !== undefined && isAlive(g);
}

/** The Core absorbs magical-type commands while Genais lives and is out of its shell (note 6.5, `onTargeted`). */
export function coreAbsorbsMagic(ctx: Ctx): boolean {
  return genaisAlive(ctx) && !genaisShelled(ctx);
}

/** Keep the Core's magical immunity equal to {@link coreAbsorbsMagic}: the kernel then nullifies a magical-type command on it. */
function syncCoreAbsorption(ctx: Ctx): void {
  const core = tryActor(ctx, SIN_CORE_ID);
  if (!core) return;
  const has = core.immunityFlags.includes('immune-to-magical-damage');
  const want = coreAbsorbsMagic(ctx);
  if (want && !has) core.immunityFlags.push('immune-to-magical-damage');
  if (!want && has) core.immunityFlags = core.immunityFlags.filter((f) => f !== 'immune-to-magical-damage');
}

/** Set the shell's marks on the battle's own copy of Genais. */
function shellMarks(genais: FFXCombatant, on: boolean): void {
  const rest = genais.immunityFlags.filter((f) => !(SHELL_FLAGS as readonly string[]).includes(f));
  genais.immunityFlags = on ? [...rest, ...SHELL_FLAGS] : rest;
}

/**
 * Genais's shell on or off (`bv0x04`): the marks, Agility +1 out of it and -1 into it (m139 @0x124 to 0x204), the Venom count
 * zeroed on entering, the Core's state and its absorption kept in step.
 */
export function setShell(ctx: Ctx, genais: FFXCombatant, on: boolean): void {
  const was = genaisShelled(ctx);
  shellMarks(genais, on);
  ctx.state.flags[SIN_GENAIS_SHELLED] = on;
  if (was !== on) {
    genais.stats.agi += on ? -1 : 1;
    rtOf(ctx, genais.id).base = baseCtb(genais.stats.agi);
  }
  if (on) ctx.state.flags[SIN_GENAIS_STEP] = 0;
  const state = coreState(ctx);
  if (on && state === 'inactive') ctx.state.flags[SIN_CORE_STATE] = 'charging';
  if (!on && state === 'charging') ctx.state.flags[SIN_CORE_STATE] = 'inactive';
  syncCoreAbsorption(ctx);
}

/** The Core's state after a Gravija: back to waiting on Genais, or free (note 6.4). */
export function coreStateAfterGravija(ctx: Ctx): SinCoreState {
  if (!genaisAlive(ctx)) return 'free';
  return genaisShelled(ctx) ? 'charging' : 'inactive';
}

// ---------------------------------------------------------------------------
// Setup, runtime marks, liveness
// ---------------------------------------------------------------------------

/**
 * Open link 3 (note 6.1): Genais **starts in its shell** (Armored, percentage-immune; its first turn exits it), the Core is out of
 * melee reach (distance 3) with no absorption yet (Genais is shelled), its score 0 and its state charging. The formation's start
 * hook: Genais at CTB 0 and each party counter one tick later (D-14). A no-op in every battle without both of them.
 */
export function applySinGenaisCoreSetup(ctx: Ctx): void {
  const genais = tryActor(ctx, SIN_GENAIS_ID);
  const core = tryActor(ctx, SIN_CORE_ID);
  if (!genais || !core || genais.enemy?.aiScriptId !== SIN_GENAIS_SCRIPT || core.enemy?.aiScriptId !== SIN_CORE_SCRIPT) return;
  core.flags.outOfMeleeReach = true;
  shellMarks(genais, true);
  ctx.state.flags[SIN_GENAIS_SHELLED] = true;
  ctx.state.flags[SIN_GENAIS_STEP] = 0;
  ctx.state.flags[SIN_CORE_STATE] = 'charging';
  ctx.state.flags[SIN_CORE_COUNTER_STEP] = 0;
  ctx.state.flags[SIN_CORE_DOWN] = false;
  ctx.state.flags[SIN_CORE_SCORE] = 0;
  ctx.state.flags[SIN_CORE_GUARD] = false;
  syncCoreAbsorption(ctx);
  markSinGenaisCoreRuntime(ctx.state.flags, ctx.rt.actors);
  applyBossOpening(ctx, [SIN_GENAIS_ID]);
}

/**
 * Runtime marks read off the published flags alone, so a rebuilt preview runtime gets them too: Genais is a non-combatant once
 * `sin.core.down`.
 */
export function markSinGenaisCoreRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (flags[SIN_CORE_STATE] === undefined) return;
  const genais = actors.get(SIN_GENAIS_ID);
  if (genais && flags[SIN_CORE_DOWN] === true) genais.nonCombatant = true;
}

/** Recompute the marks that depend on who is alive (see the header). A no-op outside link 3. */
export function syncGenaisCoreLiveness(ctx: Ctx): void {
  if (!isGenaisCoreBattle(ctx)) return;
  const core = tryActor(ctx, SIN_CORE_ID);
  if (core && !isAlive(core) && ctx.state.flags[SIN_CORE_DOWN] !== true) {
    // The battle ends when the Core dies, Genais standing or not.
    ctx.state.flags[SIN_CORE_DOWN] = true;
    markSinGenaisCoreRuntime(ctx.state.flags, ctx.rt.actors);
  }
  if (genaisAlive(ctx) || !core) return;
  // Genais's death (note 6.3): the Core's distance is 0, so the party reaches it, and magic lands.
  if (core.flags.outOfMeleeReach === true) core.flags.outOfMeleeReach = false;
  syncCoreAbsorption(ctx);
  if (genaisShelled(ctx)) ctx.state.flags[SIN_GENAIS_SHELLED] = false;
  const state = coreState(ctx);
  if (state === 'inactive' || state === 'charging') ctx.state.flags[SIN_CORE_STATE] = 'free';
}
