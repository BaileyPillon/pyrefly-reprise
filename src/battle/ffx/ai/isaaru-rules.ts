/**
 * **Isaaru's contest of aeons** (Chapter XIV, the Via Purifico) — the two
 * enemy Overdrive gauges, Spathi's count, the assumptions they rest on, and
 * the encounter's setup hook.
 *
 * Source: `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 4 (the three aeons' own
 * scripts, m284 Grothia, m254 Pterya and m287 Spathi in `bvyt09_10` to `_12`, run in the
 * note's interpreter; re-parity AI lane C), which replaced `research/ffx-isaaru-bevelle.md`
 * §4's wiki-derived pseudocode and the estimates Bailey's B9 (2026-09-25, "I'll go with all
 * your recommendations") had built where no source spoke. The rotations are `./isaaru.ts`;
 * this split keeps both files under the 400-line house limit [AGENTS.md hard rule 7].
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * What stays an owner decision is {@link ISAARU_ASSUMPTIONS}: everything else is the script's.
 */

import type { BattleState, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, tryActor } from '../state.ts';
import { applyBossOpening } from './opening.ts';

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

export const GROTHIA_SUMMON = 'grothia-summon';
export const PTERYA_SUMMON = 'pterya-summon';
export const SPATHI_SUMMON = 'spathi-summon';
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

/** m284 init (note 4.3): Grothia **starts full**, so his first turn against an aeon (after the Summon) is Hellfire. */
export const GROTHIA_GAUGE_START = 100;
/** m284 onTurn (note 4.3): +5 on every Attack and Fira, and on his attack at Yuna alone (D-15). */
export const GROTHIA_GAUGE_PER_ATTACK = 5;
/** m284 onHit (note 4.6): +3 per hit event while he can counter. */
export const GROTHIA_GAUGE_PER_HIT_EVENT = 3;
/** m254 init (note 4.4): Pterya starts empty. */
export const PTERYA_GAUGE_START = 0;
/** m254 onTurn (note 4.4): +10 on every Attack and Sonic Wings, and on her attack at Yuna alone (D-15). */
export const PTERYA_GAUGE_PER_ATTACK = 10;
/** m254 onHit (note 4.6): +15 per hit event while she can counter. */
export const PTERYA_GAUGE_PER_HIT_EVENT = 15;
/** Full: the Overdrive fires on the next turn against an aeon (note 4.3, 4.4). */
export const ENEMY_GAUGE_FULL = 100;
/** The gauge after the Overdrive fires: spent, as every Overdrive gauge is. */
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
 * m287 (note 4.5): the count **starts at 5** (five countdown turns, gauge 20 to 100, then Mega Flare; Jegged's "4 to 1" is
 * the first number shown after the Summon turn). On each count turn he shows the number and takes one off; at 0 he casts
 * Mega Flare and the count starts again. His first turn is the Summon and shows nothing.
 */
export const SPATHI_COUNT_START = 5;

/** Spathi's count right now (the start value until his first turn). */
export function spathiCount(state: Readonly<BattleState>): number {
  const v = state.flags[SPATHI_COUNT_FLAG];
  return typeof v === 'number' ? v : SPATHI_COUNT_START;
}

/**
 * The owner decisions this encounter keeps over the scripts, as data, so the guide and the board can print them. (The rest of
 * the old list is the script's now: the Attack against Fira and Sonic Wings is `mod 3`, Pterya starts at 0, Spathi counts five
 * to one with or without an aeon and has no hit reaction, and with no aeon out Grothia and Pterya attack Yuna whatever the
 * gauge says.)
 */
export const ISAARU_ASSUMPTIONS = [
  { id: 'B8', claim: 'Isaaru takes no turn and cannot be targeted', label: 'our estimate' },
  { id: 'B10', claim: 'Threaten fails on all three aeons (the wiki and Jegged against the byte, which reads landable)', label: 'owner decision' },
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
  // The formation's start hook (D-14): the aeon of this link has CTB 0 and each party slot one tick more.
  applyBossOpening(ctx, [GROTHIA_ID, PTERYA_ID, SPATHI_ID]);
}

/**
 * The runtime marks this encounter needs, read off the published state alone
 * so **a rebuilt runtime gets them too** (`simulate.ts#runtimeFor`, the
 * `markEvraeRuntime` lesson). A no-op in every other battle.
 *
 * - Isaaru owns no CTB turn and never decides the battle (B8 = a).
 * - ("+3" and "+15" when hit are the aeons' `onHit` now, `./isaaru.ts`.)
 */
export function markIsaaruRuntime(
  state: Readonly<BattleState>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  if (!isIsaaruBattle(state)) return;
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
