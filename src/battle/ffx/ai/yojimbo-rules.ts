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
 * ## Built on assumptions (Bailey's picks on the preflight are pending)
 *
 * Every value below that no source states is an `[estimate]`, is labelled
 * "our estimate" in {@link YOJIMBO_ASSUMPTIONS} so a guide or a widget can
 * print it, and is one named constant, never a scattered literal
 * [AGENTS.md hard rule 6]:
 *
 * - **B2** — the odds *inside* each gauge band are unsourced (§9 Y-1): split
 *   evenly; the "slightly likelier at 80 %" nudge is left out and disclosed.
 *   The gauge starts at 0 and returns to 0 after Zanmato.
 * - **Y-1** — "+3 % when targeted" is paid once per **action** that names him,
 *   not per hit (`abilities.ts` calls `onTargeted` once per target, before
 *   the hit loop). "+2 % when attacking" is paid on every turn he acts except
 *   Zanmato, **including the Daigoro order** (the research's own pseudocode,
 *   §4.2); whether the order turn counts is not sourced.
 * - **B3** — Lady Ginnem and Daigoro are on the field but untargetable, never
 *   a victory condition and never in the CTB queue (Y-5, Y-10).
 * - **B9** — Threaten fails on him (`threatenChance: 0`) until Y-3 is sourced.
 */

import type { BattleState, CombatantId, FFXCombatant } from '../../common/types.ts';
import { type ActorRuntime, type Ctx, tryActor } from '../state.ts';

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
export const YOJIMBO_KOZUKA = 'yojimbo-kozuka';
export const YOJIMBO_WAKIZASHI = 'yojimbo-wakizashi';
export const YOJIMBO_ZANMATO = 'yojimbo-zanmato';
export const DAIGORO_ATTACK = 'daigoro-attack';

// ---------------------------------------------------------------------------
// The gauge — §4.1
// ---------------------------------------------------------------------------

/** §4.1 `[single source: wiki boss page]` — "+3 %" each time the party targets him. */
export const YOJIMBO_GAUGE_PER_TARGETING = 3;
/** §4.1 / review `[single source: wiki boss page]` — "+2 % when attacking". */
export const YOJIMBO_GAUGE_PER_ATTACK = 2;
/** `[estimate]` (B2, Y-1) — no source states the starting gauge. */
export const YOJIMBO_GAUGE_START = 0;
/** `[estimate]` (B2, Y-1) — no source states the gauge after Zanmato. */
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
 * The actions open to him at a gauge value below 100, **each equally likely**
 * — B2, our estimate. The membership of each band is sourced
 * `[verified: 3 sources]`; the even split is not.
 */
export function yojimboPool(gauge: number): readonly string[] {
  if (gauge >= BAND_WAKIZASHI) return [YOJIMBO_DAIGORO_ORDER, YOJIMBO_KOZUKA, YOJIMBO_WAKIZASHI];
  if (gauge >= BAND_KOZUKA) return [YOJIMBO_DAIGORO_ORDER, YOJIMBO_KOZUKA];
  return [YOJIMBO_DAIGORO_ORDER];
}

/** The line a guide or widget prints wherever the odds are shown (B2). */
export const YOJIMBO_ODDS_NOTE =
  'Our estimate: inside each band every open move is equally likely. The game does not publish the odds.';

/** The assumptions this encounter is built on, as data, so the guide and the board can print them. */
export const YOJIMBO_ASSUMPTIONS = [
  { id: 'B2', claim: 'Inside each gauge band every open action is equally likely; the 80 % nudge is not modelled', label: 'our estimate' },
  { id: 'B2', claim: 'The gauge starts at 0 and returns to 0 after Zanmato', label: 'our estimate' },
  { id: 'Y-1', claim: '+3 % per party action that targets him, not per hit', label: 'our estimate' },
  { id: 'Y-1', claim: '+2 % on every turn he acts except Zanmato, the Daigoro order included', label: 'our estimate' },
  { id: 'B3', claim: 'Lady Ginnem and Daigoro cannot be targeted', label: 'our estimate' },
  { id: 'B9', claim: 'Threaten fails on him until a source settles it', label: 'our estimate' },
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
 * - **The +3 per targeting** rides on `ActorRuntime.gaugePerTargeting`, the
 *   capability Macalania Anima introduced (`overdrive.ts#onTargeted`).
 * - **Ginnem and Daigoro** own no CTB counter and never decide the battle.
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
  const yojimbo = actors.get(YOJIMBO_ID);
  if (yojimbo) yojimbo.gaugePerTargeting = YOJIMBO_GAUGE_PER_TARGETING;
  for (const id of [GINNEM_ID, DAIGORO_ID]) {
    const rt = actors.get(id);
    if (!rt) continue;
    rt.ordersOnly = true;
    rt.nonCombatant = true;
  }
}
