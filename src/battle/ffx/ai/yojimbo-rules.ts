/**
 * **Yojimbo, Cavern of the Stolen Fayth** — the Zanmato gauge, its bands, the
 * built-on assumptions, and the encounter's setup hook.
 *
 * Source: `research/ffx-yojimbo.md` §4 (the Overdrive-gauge script), §2.5 (the
 * formation `[mira, yojimbo, koma_inu]`), §3.1 (the action rows), and the
 * adversarial review in `docs/plans/chapter-yojimbo-review.md` ("+2 % when
 * **attacking**", Zanmato typed `'other'`, no flee via `rt.canEscape`).
 * The rotation itself lives in `./yojimbo.ts`; this split keeps both files
 * under the 400-line house limit [AGENTS.md hard rule 7].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, an enemy
 * Overdrive gauge and Ronso Rage Doom; research §0.3: "None of these facts
 * transfers across games". FFX-2's Yojimbo drops the party to 1 HP / 1 MP on
 * an action counter (§8.2) and never reaches this file.
 *
 * ## Game-script parity (re-parity, AI lane C)
 *
 * His turn and his `onHit` are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md`
 * section 3 (m288, run in the note's interpreter over all 65,536 draws), which
 * replaced the estimates this file was built on: the odds inside each band are
 * the script's exact ones (D-11, so the owner's "even split" decision D-050 is
 * answered by a source), the first turn is a Summon (D-10), Zanmato resets the
 * gauge to 0 and the turn's common +2 then makes it 2 (D-12), and the "+3" is a
 * hit event, once per action per target after its last hit, gated by
 * `isCounterattackAllowed()` (D-13). What stays an owner decision:
 *
 * - **B3** — Lady Ginnem and Daigoro are on the field but untargetable, never
 *   a victory condition and never in the CTB queue (Y-5, Y-10; the script
 *   agrees: the setup makes them untargetable and off the CTB bar).
 * - **B9** — Threaten fails on him (`threatenChance: 0`), D-057: the owner kept
 *   it over the byte, which reads landable (resistance 0).
 */

import type { BattleState, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, tryActor } from '../state.ts';
import { applyBossOpening } from './opening.ts';

// ---------------------------------------------------------------------------
// Ids — mirrored by `src/data/ffx/enemies/yojimbo.ts` (the battle layer never
// imports `src/data`; the test suite pins the two copies equal)
// ---------------------------------------------------------------------------

export const YOJIMBO_ID = 'yojimbo';
export const DAIGORO_ID = 'daigoro';
export const GINNEM_ID = 'ginnem';

/** AI script ids. */
export const YOJIMBO_SCRIPT = 'yojimbo-cavern';
/** Ginnem and Daigoro: never asked, because they own no turn. Registered so a stray call passes. */
export const YOJIMBO_BYSTANDER_SCRIPT = 'yojimbo-bystander';

/** Action row ids (`src/data/ffx/enemies/yojimbo-abilities.ts`). */
export const YOJIMBO_DAIGORO_ORDER = 'yojimbo-daigoro';
export const YOJIMBO_SUMMON = 'yojimbo-summon';
export const YOJIMBO_KOZUKA = 'yojimbo-kozuka';
export const YOJIMBO_WAKIZASHI = 'yojimbo-wakizashi';
export const YOJIMBO_ZANMATO = 'yojimbo-zanmato';
export const DAIGORO_ATTACK = 'daigoro-attack';

// ---------------------------------------------------------------------------
// The gauge — §4.1
// ---------------------------------------------------------------------------

/** m288 onHit (note 3.3): +3, capped at 100, once per action per target after its last hit, while he can counter. */
export const YOJIMBO_GAUGE_PER_HIT_EVENT = 3;
/** m288 onTurn (note 3.2): +2 at the join after every row but the first turn (Zanmato's included), capped at 100. */
export const YOJIMBO_GAUGE_PER_TURN = 2;
/** The monster setup writes 0 and his script never sets another value (note 3.1). */
export const YOJIMBO_GAUGE_START = 0;
/** Zanmato's row writes 0 before it fires; the turn's +2 then follows (D-12). */
export const YOJIMBO_GAUGE_AFTER_ZANMATO = 0;

/** §4.1 `[verified: 3 sources]` — at or above this, Kozuka joins the pool. */
export const BAND_KOZUKA = 25;
/** §4.1 `[verified: 3 sources]` — at or above this, Wakizashi joins the pool. */
export const BAND_WAKIZASHI = 50;
/**
 * §4.1 `[verified: 2 sources]` — at or above this, Kozuka and Wakizashi become
 * "slightly" likelier. **The weights are unsourced** (Y-1), so under B2 this
 * band is exposed for a widget and **changes no odds**.
 */
export const BAND_HEIGHTENED = 80;
/** §4.1 `[verified: 3 sources]` — full: Zanmato on his next turn. */
export const BAND_ZANMATO = 100;

/** The five bands a future gauge widget draws, lowest first. */
export type YojimboBand = 'daigoro' | 'kozuka' | 'wakizashi' | 'heightened' | 'zanmato';

/** Which band a gauge value sits in [§4.1]. Pure; the widget's only rule. */
export function yojimboBand(gauge: number): YojimboBand {
  if (gauge >= BAND_ZANMATO) return 'zanmato';
  if (gauge >= BAND_HEIGHTENED) return 'heightened';
  if (gauge >= BAND_WAKIZASHI) return 'wakizashi';
  if (gauge >= BAND_KOZUKA) return 'kozuka';
  return 'daigoro';
}

/**
 * The actions open to him at a gauge value below 100. The membership of each band is the script's
 * (`[verified: 3 sources]` and now read from the game); the weights are {@link yojimboOdds}.
 */
export function yojimboPool(gauge: number): readonly string[] {
  if (gauge >= BAND_WAKIZASHI) return [YOJIMBO_DAIGORO_ORDER, YOJIMBO_KOZUKA, YOJIMBO_WAKIZASHI];
  if (gauge >= BAND_KOZUKA) return [YOJIMBO_DAIGORO_ORDER, YOJIMBO_KOZUKA];
  return [YOJIMBO_DAIGORO_ORDER];
}

/**
 * The exact odds of each open move at a gauge value below 100, as counts of the 65,536 values of `GetRandomValue()`
 * (note 3.2): 80 to 99 `mod 4` (Wakizashi 0, Kozuka 1, Daigoro 2 and 3), 50 to 79 `mod 5` (Wakizashi 0, Kozuka 1,
 * Daigoro 2 to 4), 25 to 49 `mod 4` (Kozuka 0, Daigoro 1 to 3), below 25 Daigoro without a draw.
 */
export function yojimboOdds(gauge: number): ReadonlyArray<{ id: string; of65536: number }> {
  if (gauge >= BAND_HEIGHTENED) {
    return [{ id: YOJIMBO_WAKIZASHI, of65536: 16_384 }, { id: YOJIMBO_KOZUKA, of65536: 16_384 }, { id: YOJIMBO_DAIGORO_ORDER, of65536: 32_768 }];
  }
  if (gauge >= BAND_WAKIZASHI) {
    return [{ id: YOJIMBO_WAKIZASHI, of65536: 13_108 }, { id: YOJIMBO_KOZUKA, of65536: 13_107 }, { id: YOJIMBO_DAIGORO_ORDER, of65536: 39_321 }];
  }
  if (gauge >= BAND_KOZUKA) return [{ id: YOJIMBO_KOZUKA, of65536: 16_384 }, { id: YOJIMBO_DAIGORO_ORDER, of65536: 49_152 }];
  return [{ id: YOJIMBO_DAIGORO_ORDER, of65536: 65_536 }];
}

/** The owner decisions this encounter keeps over the script, as data, so the guide and the board can print them. */
export const YOJIMBO_ASSUMPTIONS = [
  { id: 'B3', claim: 'Lady Ginnem and Daigoro cannot be targeted', label: 'our estimate' },
  { id: 'B9', claim: 'Threaten fails on him (D-057; the byte reads landable)', label: 'owner decision' },
] as const;

// ---------------------------------------------------------------------------
// Setup — called once from `setup.ts#buildBattle`; a no-op in every other battle
// ---------------------------------------------------------------------------

/** True when this battle is the Cavern Yojimbo encounter at all. A cheap guard. */
export function isYojimboBattle(ctx: Ctx): boolean {
  return tryActor(ctx, YOJIMBO_ID)?.enemy?.aiScriptId === YOJIMBO_SCRIPT;
}

/**
 * Give Yojimbo his gauge and mark the two bystanders.
 *
 * - **The gauge** is `FFXCombatant.overdrive` on the published state, on the
 *   shipped 0-100 scale, with `enemyGaugeRules: 'yojimbo'` so a future widget
 *   can find the one enemy that carries it. `enemyToCombatant` builds no enemy
 *   gauge (Anima's is attached the same way). Every change emits the ordinary
 *   `overdrive-gauge` event, cause `'targeted'`, `'attacking'` or `'zanmato'`.
 * - **The +3 per hit event** is his `onHit` (`./yojimbo.ts`).
 * - **Ginnem and Daigoro** own no CTB counter and never decide the battle.
 * - **The opening** (D-14): the formation's start hook gives him First Strike and CTB 0 and each of the seven party slots
 *   one tick (`./opening.ts`), so his first turn, the Summon, comes before anyone else's.
 */
export function applyYojimboSetup(ctx: Ctx): void {
  const yojimbo = tryActor(ctx, YOJIMBO_ID);
  if (!yojimbo || !isYojimboBattle(ctx)) return;
  yojimbo.overdrive = {
    gauge: YOJIMBO_GAUGE_START,
    mode: 'stoic',
    unlockedOverdriveIds: [YOJIMBO_ZANMATO],
    enemyGaugeRules: 'yojimbo',
  };
  markYojimboRuntime(ctx.state, ctx.rt.actors);
  applyBossOpening(ctx, [YOJIMBO_ID]);
}

/**
 * The runtime marks this encounter needs, read off the published state alone
 * so **a rebuilt runtime gets them too** — the lesson `markEvraeRuntime`
 * records (`simulate.ts#runtimeFor` rebuilds `ActorRuntime` from
 * `BattleState`). A no-op in every other battle.
 */
export function markYojimboRuntime(
  state: Readonly<BattleState>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  const self = state.combatants[YOJIMBO_ID] as FFXCombatant | undefined;
  if (self?.enemy?.aiScriptId !== YOJIMBO_SCRIPT) return;
  for (const id of [GINNEM_ID, DAIGORO_ID]) {
    const rt = actors.get(id);
    if (!rt) continue;
    rt.ordersOnly = true;
    rt.nonCombatant = true;
  }
}
