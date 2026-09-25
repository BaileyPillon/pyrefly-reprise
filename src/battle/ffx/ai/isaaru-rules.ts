/**
 * **Isaaru's contest of aeons** (Chapter XIV, the Via Purifico) — the two
 * enemy Overdrive gauges, Spathi's count, the assumptions they rest on, and
 * the encounter's setup hook.
 *
 * Source: `research/ffx-isaaru-bevelle.md` §4 (the AI, from the wiki's
 * per-aeon pages, GameFAQs and Jegged; the decompile holds no AI script) and
 * §4.5's reference pseudocode, with Bailey's B9 (2026-09-25, "I'll go with all
 * your recommendations"): **build every unsourced piece, each labelled our
 * estimate**. The rotations are `./isaaru.ts`; this split keeps both files
 * under the 400-line house limit [AGENTS.md hard rule 7].
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * Every value no source states is one named constant, listed in
 * {@link ISAARU_ASSUMPTIONS} as "our estimate" so a guide or widget can print
 * it [AGENTS.md hard rule 6].
 */

import type { BattleState, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, tryActor } from '../state.ts';

// ---------------------------------------------------------------------------
// Ids — mirrored by `src/data/ffx/enemies/isaaru{,-abilities}.ts` (the battle
// layer never imports `src/data`; the tests pin the two copies equal)
// ---------------------------------------------------------------------------

export const ISAARU_ID = 'isaaru';
export const GROTHIA_ID = 'grothia';
export const PTERYA_ID = 'pterya';
export const SPATHI_ID = 'spathi';

export const ISAARU_BYSTANDER_SCRIPT = 'isaaru-bystander';
export const GROTHIA_SCRIPT = 'grothia';
export const PTERYA_SCRIPT = 'pterya';
export const SPATHI_SCRIPT = 'spathi';

export const GROTHIA_ATTACK = 'grothia-attack';
export const GROTHIA_ATTACK_YUNA = 'grothia-attack-yuna';
export const GROTHIA_FIRA = 'grothia-fira';
export const GROTHIA_HELLFIRE = 'grothia-hellfire';
export const PTERYA_ATTACK = 'pterya-attack';
export const PTERYA_ATTACK_YUNA = 'pterya-attack-yuna';
export const PTERYA_SONIC_WINGS = 'pterya-sonic-wings';
export const PTERYA_ENERGY_RAY = 'pterya-energy-ray';
export const SPATHI_COUNTDOWN = 'spathi-countdown';
export const SPATHI_MEGA_FLARE = 'spathi-mega-flare';

/**
 * The tag a gauge widget finds these two enemy gauges by (plan T3 / T8 and
 * review E6: `enemyGaugeRules` is only a string tag, and today only the
 * Zanmato widget reads its own value, `'yojimbo'`).
 */
export const ISAARU_GAUGE_RULES = 'isaaru-aeon';

// ---------------------------------------------------------------------------
// The gauges — §4.1, §4.2
// ---------------------------------------------------------------------------

/** §4.1 [single source: wiki] — Grothia **starts full**, so his first turn against an aeon is Hellfire. */
export const GROTHIA_GAUGE_START = 100;
/** §4.1 [single source: wiki] — "+5 %" when he attacks (Attack or Fira on an aeon). */
export const GROTHIA_GAUGE_PER_ATTACK = 5;
/** §4.1 [single source: wiki] — "+3 %" each time the party targets him. */
export const GROTHIA_GAUGE_PER_TARGETING = 3;
/** O-9 `[estimate]` (B9) — Pterya's starting gauge is unsourced; the wiki calls out a full start only for Grothia. */
export const PTERYA_GAUGE_START = 0;
/** §4.2 [single source: wiki] — "+10 %" when she attacks. */
export const PTERYA_GAUGE_PER_ATTACK = 10;
/** §4.2 [single source: wiki] — "+15 %" each time she is targeted. */
export const PTERYA_GAUGE_PER_TARGETING = 15;
/** Full: the Overdrive fires on the next turn against an aeon [§4.1, §4.2, verified: 2 sources]. */
export const ENEMY_GAUGE_FULL = 100;
/** The gauge after the Overdrive fires: spent, as every Overdrive gauge is (§4.5 pseudocode). */
export const ENEMY_GAUGE_AFTER_OVERDRIVE = 0;

// ---------------------------------------------------------------------------
// Spathi's count — §4.3
// ---------------------------------------------------------------------------

/**
 * `state.flags` key holding Spathi's count, published so a HUD can show "the
 * count as numbers over Spathi" (B20, O-5 B) and an intent dry run reads it.
 */
export const SPATHI_COUNT_FLAG = 'isaaru.count';
/**
 * §4.3 [verified: 2 sources: wiki + GameFAQs] — the count **starts at 5**.
 * Jegged's "4 to 1" is the I-5 conflict; built as 5 and labelled (B9), with a
 * footage check owed before listing. On each count turn he shows the number
 * and takes one off; at 0 he casts Mega Flare and the count starts again.
 */
export const SPATHI_COUNT_START = 5;

/** Spathi's count right now (the start value until his first turn). */
export function spathiCount(state: Readonly<BattleState>): number {
  const v = state.flags[SPATHI_COUNT_FLAG];
  return typeof v === 'number' ? v : SPATHI_COUNT_START;
}

/** The assumptions this encounter is built on, as data, so the guide and the board can print them. */
export const ISAARU_ASSUMPTIONS = [
  { id: 'O-5', claim: "Grothia's Attack and Fira, and Pterya's Attack and Sonic Wings, are equally likely", label: 'our estimate' },
  { id: 'O-9', claim: "Pterya's gauge starts at 0", label: 'our estimate' },
  { id: 'I-5', claim: "Spathi's count starts at 5 (Jegged reads 4 to 1)", label: 'our estimate' },
  { id: 'O-6', claim: 'With no aeon out, Spathi keeps counting and Mega Flares Yuna at 0', label: 'our estimate' },
  { id: 'I-4', claim: "Spathi's counterattack rows are not built: no source describes them", label: 'our estimate' },
  { id: 'B8', claim: 'Isaaru takes no turn and cannot be targeted', label: 'our estimate' },
  { id: 'B10', claim: 'Threaten fails on all three aeons (the wiki and Jegged against the byte)', label: 'our estimate' },
  { id: '§4.5', claim: 'With no aeon out, Grothia and Pterya always use their attack on Yuna, even on a full gauge', label: 'our estimate' },
] as const;

// ---------------------------------------------------------------------------
// Setup — called once from `setup.ts#buildBattle`; a no-op in every other battle
// ---------------------------------------------------------------------------

function isIsaaruBattle(state: Readonly<BattleState>): boolean {
  const self = state.combatants[ISAARU_ID] as FFXCombatant | undefined;
  return self?.enemy?.aiScriptId === ISAARU_BYSTANDER_SCRIPT;
}

/** Attach an enemy Overdrive gauge (`enemyToCombatant` builds none), Yojimbo's pattern. */
function giveGauge(c: FFXCombatant | undefined, start: number, overdriveId: string): void {
  if (!c) return;
  c.overdrive = { gauge: start, mode: 'stoic', unlockedOverdriveIds: [overdriveId], enemyGaugeRules: ISAARU_GAUGE_RULES };
}

/**
 * Give Grothia and Pterya their gauges, start Spathi's count, and mark
 * Isaaru. Only the aeon of this link is present, so each line is a no-op in
 * the other two links; the whole hook is a no-op in every other battle.
 */
export function applyIsaaruSetup(ctx: Ctx): void {
  if (!isIsaaruBattle(ctx.state)) return;
  giveGauge(tryActor(ctx, GROTHIA_ID), GROTHIA_GAUGE_START, GROTHIA_HELLFIRE);
  giveGauge(tryActor(ctx, PTERYA_ID), PTERYA_GAUGE_START, PTERYA_ENERGY_RAY);
  if (tryActor(ctx, SPATHI_ID)) ctx.state.flags[SPATHI_COUNT_FLAG] = SPATHI_COUNT_START;
  markIsaaruRuntime(ctx.state, ctx.rt.actors);
}

/**
 * The runtime marks this encounter needs, read off the published state alone
 * so **a rebuilt runtime gets them too** (`simulate.ts#runtimeFor`, the
 * `markEvraeRuntime` lesson). A no-op in every other battle.
 *
 * - "+3 %" / "+15 %" when targeted ride on `ActorRuntime.gaugePerTargeting`
 *   (`overdrive.ts#onTargeted`, once per player-side action that names him).
 * - Isaaru owns no CTB turn and never decides the battle (B8 = a).
 */
export function markIsaaruRuntime(
  state: Readonly<BattleState>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (!isIsaaruBattle(state)) return;
  const grothia = actors.get(GROTHIA_ID);
  if (grothia) grothia.gaugePerTargeting = GROTHIA_GAUGE_PER_TARGETING;
  const pterya = actors.get(PTERYA_ID);
  if (pterya) pterya.gaugePerTargeting = PTERYA_GAUGE_PER_TARGETING;
  const isaaru = actors.get(ISAARU_ID);
  if (isaaru) {
    isaaru.ordersOnly = true;
    isaaru.nonCombatant = true;
  }
}

/** True when an aeon of Yuna's holds the field (the enemies' "aeon out" branch, §4.5). */
export function aeonOut(ctx: Ctx): boolean {
  const id = ctx.state.aeonId;
  if (id === null) return false;
  const aeon = tryActor(ctx, id);
  return aeon !== undefined && aeon.hp > 0;
}
