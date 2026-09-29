/**
 * **Sinspawn Genais and Sin's Core** (Sin, link 3): constants, setup, counters,
 * runtime marks, the liveness hook and `SIN_CORE_ASSUMPTIONS`.
 *
 * Source: `research/ffx-sin.md` §3.2, §3.3 (the rows) and §5.3 (the scripts),
 * built to `docs/plans/sin-two-chapters-plan.md` §2.4 and its REVIEW (must-changes
 * 1, 2 and 8, and the should-changes on Cura and the Reflect bounce). Every
 * judgement of ours is a named constant below and a row of
 * {@link SIN_CORE_ASSUMPTIONS}; nothing is tuned (AGENTS.md hard rule 6).
 *
 * ## The shape
 *
 * ```
 * Genais out of its shell   Venom, Venom, Thrashing, repeat; magic aimed at it -> Waterga on the caster
 * Genais <= 10,000 HP       on its next turn "Enters shell.": Armored and percentage-immune
 * Genais in its shell       Sigh; any action that hits it -> Cura on itself (once per action)
 * Genais >= 12,000 HP       on its next turn "Exits shell." (S-2, the wiki and the in-game Scan text)
 * Core, Genais out          "Core is inactive."
 * Core, Genais shelled      "Core gathers energy.", then Gravija on its next turn (Genais out eats it)
 * Core, Genais dead         gather, Gravija, repeat (§5.3.2 item 3)
 * Core targeted             Negation (S-12 chance), otherwise Fire, Blizzard, Thunder, Water in turn
 * while Genais lives        the Core is out of melee reach and magic-immune ("Magic absorbed.")
 * the Core dies             victory, Genais standing or not (§5.3.2 item 5)
 * ```
 *
 * ## The liveness hook (REVIEW must-change 2)
 *
 * {@link syncGenaisCoreLiveness} runs at the top of every `afterAction`
 * (`reactions.ts#runMortibsorptionIfDown`, one line), for every command kind,
 * enemy turns and a Doom KO at the start of a turn alike, and again at the top
 * of both scripts. The marks that depend on who is alive (the Core's reach and
 * magic immunity while Genais lives; `sin.core.down` and Genais a non-combatant
 * once the Core falls) are recomputed there from `isAlive`. Genais is **not**
 * marked a non-combatant at setup: the stalemate watch keeps counting its HP.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, counters, Armored.
 */

import type { AbilityDef, CombatantId, FFXCombatant, StatusId } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, has, isAlive, livingEnemies, livingFriendlies, rtOf, tryActor } from '../state.ts';
import { blockedBySilence } from '../abilities.ts';
import { NEGATION_REMOVES } from './sin-negation.ts';
import {
  SIN_CORE_ELEMENT_CYCLE, SIN_CORE_COUNTER_STEP, SIN_CORE_DOWN, SIN_CORE_ID, SIN_CORE_NEGATION, SIN_CORE_SCRIPT,
  SIN_CORE_STATE, SIN_GENAIS_CURA, SIN_GENAIS_ID, SIN_GENAIS_SCRIPT, SIN_GENAIS_SHELLED, SIN_GENAIS_WATERGA,
  SIN_MAGIC_ABSORBED, SIN_NEGATION_TAKEN, type SinCoreState, type SinCounter,
} from './sin-ids.ts';

// ---------------------------------------------------------------------------
// Sourced thresholds
// ---------------------------------------------------------------------------

/** §5.3.1 item 3 [verified: 3 sources]: it shells on its next turn at half HP or less. */
export const GENAIS_SHELL_AT = 10_000;
/** §5.3.1 item 5, S-2 default (the wiki and the in-game Scan text): it leaves at 12,000 or more. */
export const GENAIS_LEAVE_AT = 12_000;
/** The shell's two marks (§5.3.1 item 4 [verified: 3 sources]). */
const SHELL_FLAGS = ['armored', 'immune-to-percentage-damage'] as const;

// ---------------------------------------------------------------------------
// Tunables (each labelled; a bench flips them through the flag named beside it)
// ---------------------------------------------------------------------------

/**
 * S-13, **before Genais dies**: the chance the Core counters when targeted.
 * `[unsourced]`: Gestahl's "100 % of the time" is about the Core after Genais is
 * gone, and the wiki only says "more likely the lower its HP". **Our
 * extrapolation**: Gestahl's 100 % carried back (REVIEW must-change 8).
 * Flag override: {@link SIN_CORE_COUNTER_CHANCE_BEFORE}.
 */
export const CORE_COUNTER_CHANCE_BEFORE = 1;
/** S-13 after Genais dies: Gestahl (GameFAQs), "counters 100% of the time". */
export const CORE_COUNTER_CHANCE_AFTER = 1;
/**
 * Whether a spell the Core absorbs ("Magic absorbed.") still draws its counter.
 * `[unsourced]`; our estimate **yes**: the Core was targeted, and §5.3.2 item 4
 * says it counters when targeted. Flag override: {@link SIN_CORE_ABSORBED_DRAWS}.
 */
export const CORE_ABSORBED_SPELL_DRAWS_COUNTER = true;
/**
 * S-12, the Core's Negation chance per the wiki `[single source]`: +3 for each of
 * Armor and Mental Break on the Core, +1 for each Shell and each Reflect on the
 * party, +2 for each Haste, +1 / +2 for Protect on the rightmost / leftmost
 * member, subtract 3, "divided by 8". **The units are unclear**; we read the
 * quotient as a fraction of 1, as the Fins' /16 is read. Recalculated on each
 * Core turn (the wiki). Flag override {@link SIN_CORE_NEGATION_ON} = false turns
 * it off for the bench's bound.
 */
export const CORE_NEGATION_POINTS = { breakOnCore: 3, shell: 1, reflect: 1, haste: 2, protectRight: 1, protectLeft: 2, subtract: 3 } as const;
export const CORE_NEGATION_DIVISOR = 8;

// ---------------------------------------------------------------------------
// Link 3's own `state.flags` keys (beside the shared ones in `sin-ids.ts`)
// ---------------------------------------------------------------------------

/** Genais's place in Venom, Venom, Thrashing (0, 1, 2). In flags so a preview runtime keeps it. */
export const SIN_GENAIS_STEP = 'sin.genais.step';
/** The Core's Negation chance, 0 to 1, as recalculated on its last turn (S-12). */
export const SIN_CORE_NEGATION_CHANCE = 'sin.core.negationChance';
/** Bench switch: overrides {@link CORE_COUNTER_CHANCE_BEFORE} (a number 0 to 1). */
export const SIN_CORE_COUNTER_CHANCE_BEFORE = 'sin.core.counterChanceBefore';
/** Bench switch: overrides {@link CORE_ABSORBED_SPELL_DRAWS_COUNTER} (a boolean). */
export const SIN_CORE_ABSORBED_DRAWS = 'sin.core.absorbedDrawsCounter';
/** Bench switch: `false` turns the Core's Negation off (S-12's bound, not a proposal). */
export const SIN_CORE_NEGATION_ON = 'sin.core.negationOn';

/** **Estimates carried by link 3**, as data, so the handoff, the guide and the tests can print them. */
export const SIN_CORE_ASSUMPTIONS: ReadonlyArray<{ id: string; claim: string; value: unknown }> = [
  { id: 'S-2', claim: 'Genais leaves its shell on its next turn once back at 12,000 HP or more (the wiki and the in-game Scan text; bover_87 reads the other way)', value: GENAIS_LEAVE_AT },
  { id: 'S-12', claim: "The Core's Negation chance is the wiki's points less 3, over 8, read as a fraction (units unclear, single source), recalculated on each Core turn", value: CORE_NEGATION_DIVISOR },
  { id: 'S-12-runs', claim: 'The wiki\'s "one to six times in a row, three-point intervals" is not built beyond what a chance held between Core turns gives', value: false },
  { id: 'S-13-after', claim: 'After Genais dies the Core counters every time it is targeted (Gestahl, GameFAQs)', value: CORE_COUNTER_CHANCE_AFTER },
  { id: 'S-13-before', claim: 'Before Genais dies the Core also counters every time it is targeted (our extrapolation of Gestahl; unsourced)', value: CORE_COUNTER_CHANCE_BEFORE },
  { id: 'absorbed-draws-counter', claim: 'A spell the Core absorbs still draws its counter (unsourced; the Core was targeted)', value: CORE_ABSORBED_SPELL_DRAWS_COUNTER },
  { id: 'S-15', claim: 'Genais absorbs magic aimed at the Core even while shelled (three sources against Gestahl)', value: true },
  { id: 'absorb-scope', claim: "\"Magic\" the Core absorbs is magical-type damage (the engine's immunity); an aeon's special Overdrive (damage type other) is not absorbed", value: 'magical' },
  { id: 'waterga-scope', claim: 'Waterga answers a Blk or Wht Magic spell or any magical-type action aimed at Genais, Demi excluded (SinirothX), once per action', value: 'magic' },
  { id: 'cura-per-action', claim: 'Cura answers each player-side action that hits shelled Genais (deals it damage) once; the sources say "every hit" (Attack Reels is where they differ). A miss, a status-only action or an absorbed spell draws none', value: 'per-action' },
  { id: 'shell-costs-turn', claim: 'Entering and leaving the shell are the turn\'s action ("Enters shell." / "Exits shell.")', value: true },
  { id: 'rotation-resumes', claim: 'After the shell, Venom, Venom, Thrashing resumes where it stopped rather than restarting (unsourced)', value: 'resume' },
  { id: 'counter-order', claim: 'One action\'s link-3 answers run "Magic absorbed.", then the Core\'s counter, then Genais\'s Waterga or Cura (unsourced)', value: 'absorbed-core-genais' },
  { id: 'counter-step', claim: 'The Fire, Blizzard, Thunder, Water cycle moves only when an element fires; a Negation does not advance it', value: true },
  { id: 'negation-party', claim: 'Negation\'s party is the front line on the field (the aeon alone while summoned); leftmost is the first slot, rightmost the last', value: 'front-line' },
  { id: 'reflect-bounce', claim: 'The Core\'s party-wide counters never bounce (engine rule, statuses.ts#bouncesOffReflect; research §2.3 says they do: open). A single-target spell bounced onto Genais or the Core is not "aimed at" it, so it draws no counter', value: 'engine' },
  { id: 'liveness-lag', claim: "A Genais KO inside the counter phase (Zombie + Cura) is picked up at the next action's hook or at either script's turn, not before the next menu", value: 'next-action' },
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

export function genaisShelled(ctx: Ctx): boolean {
  return ctx.state.flags[SIN_GENAIS_SHELLED] === true;
}

function flagNumber(ctx: Ctx, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

function flagBool(ctx: Ctx, key: string, fallback: boolean): boolean {
  const v = ctx.state.flags[key];
  return typeof v === 'boolean' ? v : fallback;
}

function genaisAlive(ctx: Ctx): boolean {
  const g = tryActor(ctx, SIN_GENAIS_ID);
  return g !== undefined && isAlive(g);
}

/** Genais's shell on or off, on the battle's own copy (§5.3.1 item 4). */
export function setShell(ctx: Ctx, genais: FFXCombatant, on: boolean): void {
  const rest = genais.immunityFlags.filter((f) => !(SHELL_FLAGS as readonly string[]).includes(f));
  genais.immunityFlags = on ? [...rest, ...SHELL_FLAGS] : rest;
  ctx.state.flags[SIN_GENAIS_SHELLED] = on;
  const state = coreState(ctx);
  if (on && state === 'inactive') ctx.state.flags[SIN_CORE_STATE] = 'charging';
  if (!on && state === 'charging') ctx.state.flags[SIN_CORE_STATE] = 'inactive';
}

/** The Core's state after a Gravija: back to waiting on Genais, or free (§5.3.2). */
export function coreStateAfterGravija(ctx: Ctx): SinCoreState {
  if (!genaisAlive(ctx)) return 'free';
  return genaisShelled(ctx) ? 'charging' : 'inactive';
}

/** S-12: the Core's Negation chance on the board as it stands (the wiki's points, labelled). */
export function coreNegationChance(ctx: Ctx): number {
  if (!flagBool(ctx, SIN_CORE_NEGATION_ON, true)) return 0;
  const core = tryActor(ctx, SIN_CORE_ID);
  if (!core) return 0;
  const p = CORE_NEGATION_POINTS;
  let points = (has(core, 'armor-break') ? p.breakOnCore : 0) + (has(core, 'mental-break') ? p.breakOnCore : 0);
  const party = livingFriendlies(ctx);
  for (const m of party) {
    if (has(m, 'shell')) points += p.shell;
    if (has(m, 'reflect')) points += p.reflect;
    if (has(m, 'haste')) points += p.haste;
  }
  const left = party[0];
  const right = party[party.length - 1];
  if (right && has(right, 'protect')) points += p.protectRight;
  if (left && has(left, 'protect')) points += p.protectLeft;
  return Math.min(1, Math.max(0, points - p.subtract) / CORE_NEGATION_DIVISOR);
}

/** Recalculate the Negation chance (setup and each Core turn, per the wiki). */
export function refreshCoreNegationChance(ctx: Ctx): void {
  ctx.state.flags[SIN_CORE_NEGATION_CHANCE] = coreNegationChance(ctx);
}

// ---------------------------------------------------------------------------
// Setup, runtime marks, liveness
// ---------------------------------------------------------------------------

/**
 * Open link 3 (§5.3.1 item 7 [verified: 4 sources]): the Core magic-immune and
 * out of melee reach while Genais lives, Genais out of its shell, the Core
 * inactive. A no-op in every battle without both of them.
 */
export function applySinGenaisCoreSetup(ctx: Ctx): void {
  const genais = tryActor(ctx, SIN_GENAIS_ID);
  const core = tryActor(ctx, SIN_CORE_ID);
  if (!genais || !core || genais.enemy?.aiScriptId !== SIN_GENAIS_SCRIPT || core.enemy?.aiScriptId !== SIN_CORE_SCRIPT) return;
  core.flags.outOfMeleeReach = true;
  if (!core.immunityFlags.includes('immune-to-magical-damage')) core.immunityFlags.push('immune-to-magical-damage');
  ctx.state.flags[SIN_GENAIS_SHELLED] = false;
  ctx.state.flags[SIN_GENAIS_STEP] = 0;
  ctx.state.flags[SIN_CORE_STATE] = 'inactive';
  ctx.state.flags[SIN_CORE_COUNTER_STEP] = 0;
  ctx.state.flags[SIN_CORE_DOWN] = false;
  refreshCoreNegationChance(ctx);
  markSinGenaisCoreRuntime(ctx.state.flags, ctx.rt.actors);
}

/**
 * Runtime marks read off the published flags alone, so a rebuilt preview
 * runtime gets them too: both count the party's targetings ("aimed at", which
 * a miss, an absorbed spell and a status-only command are), and Genais is a
 * non-combatant once `sin.core.down`.
 */
export function markSinGenaisCoreRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (flags[SIN_CORE_STATE] === undefined) return;
  const genais = actors.get(SIN_GENAIS_ID);
  const core = actors.get(SIN_CORE_ID);
  if (genais) genais.countsPartyTargetings = true;
  if (core) core.countsPartyTargetings = true;
  if (genais && flags[SIN_CORE_DOWN] === true) genais.nonCombatant = true;
}

/** Recompute the marks that depend on who is alive (see the header). A no-op outside link 3. */
export function syncGenaisCoreLiveness(ctx: Ctx): void {
  if (!isGenaisCoreBattle(ctx)) return;
  const core = tryActor(ctx, SIN_CORE_ID);
  if (core && !isAlive(core) && ctx.state.flags[SIN_CORE_DOWN] !== true) {
    // §5.3.2 item 5 [verified: 2 sources]: the battle ends when the Core dies, Genais standing or not.
    ctx.state.flags[SIN_CORE_DOWN] = true;
    markSinGenaisCoreRuntime(ctx.state.flags, ctx.rt.actors);
  }
  if (genaisAlive(ctx) || !core) return;
  // §5.3.2 item 3 [verified: 2 sources]: with Genais gone the party reaches the Core, and magic lands.
  if (core.flags.outOfMeleeReach === true) core.flags.outOfMeleeReach = false;
  if (core.immunityFlags.includes('immune-to-magical-damage')) {
    core.immunityFlags = core.immunityFlags.filter((f) => f !== 'immune-to-magical-damage');
  }
  if (genaisShelled(ctx)) ctx.state.flags[SIN_GENAIS_SHELLED] = false;
  const state = coreState(ctx);
  if (state === 'inactive' || state === 'charging') ctx.state.flags[SIN_CORE_STATE] = 'free';
}

// ---------------------------------------------------------------------------
// Counters
// ---------------------------------------------------------------------------

/** True when this action named `id` since the last look (`overdrive.ts#onTargeted`, once per action): "aimed at". */
function newlyTargeted(ctx: Ctx, id: CombatantId): boolean {
  const c = tryActor(ctx, id);
  if (!c) return false;
  const rt = rtOf(ctx, id);
  const count = rt.partyTargetings ?? 0;
  const seen = typeof rt.ai['seenTargetings'] === 'number' ? (rt.ai['seenTargetings'] as number) : 0;
  rt.ai['seenTargetings'] = count;
  return count > seen;
}

/** "Magic" for Waterga (see `waterga-scope`): a spell or a magical-type action, Demi excluded. */
export function isMagicForWaterga(def: AbilityDef): boolean {
  if (def.formula === 'percent-current' || def.formula === 'percent-total') return false;
  return def.category === 'blackmagic' || def.category === 'whitemagic' || def.damageType === 'magical';
}

/** What the next Negation will take, per combatant (the HUD's `sin.negation.lastTaken`, §11 item 4). */
function negationTakes(ctx: Ctx): Record<CombatantId, StatusId[]> {
  const out: Record<CombatantId, StatusId[]> = {};
  for (const c of [...livingFriendlies(ctx), ...livingEnemies(ctx)]) {
    const taken = NEGATION_REMOVES.filter((s) => c.statuses[s] !== undefined && c.statuses[s]?.permanent !== true);
    if (taken.length > 0) out[c.id] = taken;
  }
  return out;
}

/** The Core's answer to being targeted (§5.3.2 item 4), or null. */
function coreCounter(ctx: Ctx, absorbed: boolean): SinCounter | null {
  const living = genaisAlive(ctx);
  if (absorbed && !flagBool(ctx, SIN_CORE_ABSORBED_DRAWS, CORE_ABSORBED_SPELL_DRAWS_COUNTER)) return null;
  const chance = living ? flagNumber(ctx, SIN_CORE_COUNTER_CHANCE_BEFORE, CORE_COUNTER_CHANCE_BEFORE) : CORE_COUNTER_CHANCE_AFTER;
  // A certain counter draws no number, so the seeded stream is the same whatever the chance reads as 1.
  if (chance <= 0 || (chance < 1 && !(ctx.rng.next() < chance))) return null;
  const negation = flagNumber(ctx, SIN_CORE_NEGATION_CHANCE, 0);
  if (negation > 0 && ctx.rng.next() < negation) {
    // `state.flags` holds scalars only, so the per-combatant map travels as JSON (`JSON.parse` to read it).
    ctx.state.flags[SIN_NEGATION_TAKEN] = JSON.stringify(negationTakes(ctx));
    return { actorId: SIN_CORE_ID, abilityId: SIN_CORE_NEGATION, cause: 'script' };
  }
  const step = flagNumber(ctx, SIN_CORE_COUNTER_STEP, 0) % SIN_CORE_ELEMENT_CYCLE.length;
  ctx.state.flags[SIN_CORE_COUNTER_STEP] = (step + 1) % SIN_CORE_ELEMENT_CYCLE.length;
  return { actorId: SIN_CORE_ID, abilityId: SIN_CORE_ELEMENT_CYCLE[step]!, cause: 'script' };
}

/**
 * Genais's answer: in the shell, Cura on itself for an action that **hit** it
 * (§5.3.1 item 4, "every hit"; per action); out of it, Waterga on the caster for
 * magic **aimed at** it (item 2).
 */
function genaisCounter(ctx: Ctx, genais: FFXCombatant, attacker: FFXCombatant, def: AbilityDef, aimed: boolean, hit: boolean): SinCounter | null {
  if (genaisShelled(ctx)) {
    if (!hit) return null;
    const cura = ctx.content.ability(SIN_GENAIS_CURA);
    if (!cura || blockedBySilence(genais, cura)) return null;
    return { actorId: SIN_GENAIS_ID, abilityId: SIN_GENAIS_CURA, cause: 'script', targets: [SIN_GENAIS_ID] };
  }
  if (!aimed || !isMagicForWaterga(def)) return null;
  const waterga = ctx.content.ability(SIN_GENAIS_WATERGA);
  if (!waterga || blockedBySilence(genais, waterga)) return null;
  // §3.2 "the caster" [verified: 4 sources]; REVIEW must-change 1: the aim is named, never left to a random pick.
  return { actorId: SIN_GENAIS_ID, abilityId: SIN_GENAIS_WATERGA, cause: 'script', targets: [attacker.id] };
}

/**
 * Link 3's reactions to one player-side action (`collectBossCounters` has
 * already refused an enemy-side attacker and a counter's own action), in the
 * order `counter-order` names. Empty outside link 3 and once the Core is down.
 */
export function collectSinGenaisCoreCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
): SinCounter[] {
  if (!isGenaisCoreBattle(ctx)) return [];
  const genaisAimed = newlyTargeted(ctx, SIN_GENAIS_ID);
  const coreAimed = newlyTargeted(ctx, SIN_CORE_ID);
  if (ctx.state.flags[SIN_CORE_DOWN] === true) return [];
  const out: SinCounter[] = [];
  const genais = tryActor(ctx, SIN_GENAIS_ID);
  const core = tryActor(ctx, SIN_CORE_ID);
  const living = genais !== undefined && isAlive(genais);
  const absorbed = coreAimed && living && def.damageType === 'magical';
  if (absorbed) out.push({ actorId: SIN_GENAIS_ID, abilityId: SIN_MAGIC_ABSORBED, cause: 'script' });
  if (coreAimed && core && isAlive(core)) {
    const c = coreCounter(ctx, absorbed);
    if (c) out.push(c);
  }
  if (genais && living) {
    const c = genaisCounter(ctx, genais, attacker, def, genaisAimed, damagedEnemyIds.includes(SIN_GENAIS_ID));
    if (c) out.push(c);
  }
  return out;
}
