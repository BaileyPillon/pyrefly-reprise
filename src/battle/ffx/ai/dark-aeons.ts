/**
 * **The Dark Aeons' scripts** (FFX only; the hidden Mirror Aeons chapter): Dark Yojimbo (m340), the three Dark Magus Sisters (m341 Cindy, m342 Sandy, m343 Mindy) and the dog (m116), as the game's own bytecode runs them
 * (`research/re-ffx-dark-aeons.md`, "RE note section n": read from the files and run in the earlier lanes' interpreter). **No number here is ours**; they live with their sources in `./dark-aeons-rules.ts`.
 * The scripts only choose moves and move gauges; the rows (the game's command records word for word, `canMiss: false`: accuracy formula 0 on all of them) are `src/data/ffx/enemies/dark-aeons-abilities.ts`.
 *
 * ## Dark Yojimbo's turn (RE note 4.2), in this order
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | gauge 100 or more | **Zanmato** on the whole front line, no draw; the gauge is written 0 |
 * | 2 | otherwise one draw, `GetRandomValue() mod 3` | 0 **Wakizashi** (the group row 0x4109) on the whole front line; 1 **Kozuka** on one random living front-line character; 2 the **dog order** (Daigoro), aimed at the dog, whose bite then falls on a random living front-line character |
 * | 3 | after either row, **Zanmato's included** | the gauge gains the tier's step (`dark.gaugePerTurn`: 6, 10, 16, 20 or 26), capped at 100: **the gauge restarts at the step, not at 0** |
 *
 * His `onHit` adds **2** (capped) once per action of the party's that reaches him, a miss included, while he can counter and the hit is not a reaction (4.3). No HP threshold, no phase, no counter.
 *
 * ## A Sister's turn (RE note 5.2), the first rule that fires ends the turn
 *
 * | # | Condition | Cindy | Sandy | Mindy | Her gauge afterwards |
 * |---|---|---|---|---|---|
 * | 1 | **a trio formation** (`kino00_70`, `kino01_70`), all three alive, all three gauges 100 or more | **Delta Attack** on the whole front line, after writing 0 to all three gauges | coin: Razzia or Attack | coin: Passado or Calamity | Cindy: all three 0; Sandy and Mindy: + 20 (capped, so it stays 100) |
 * | 2 | her own gauge 100 or more | **Mega Graviton** on the whole front line | the same | the same | 0, nothing added |
 * | 3 | otherwise | coin: Camisade or the dispelling attack 0x412B | coin: Razzia or Attack (Petrify) | coin: Passado or Calamity | + 20 (capped) |
 *
 * The coin is `GetRandomValue() mod 2`, exact. A single-target move then picks a random living front-line character (stream 4, a draw only with two or more). Her `onHit` adds **5** (capped) under the same gate as
 * Dark Yojimbo's (5.3). **No counters, no reaction, no phase**: one Sister's death changes the others only through the trio test, which needs all three alive, so **Delta Attack is over for good** (5.3).
 *
 * ## The dog (RE note 4.4)
 *
 * It takes no turns: its turn function does nothing (here a pass nobody asks for). Its whole behaviour is the bite on the order, with its own Strength (244): `battle/ffx/orders.ts` carries it out, and the row asks for the
 * game's picker (`extra.orderedAim`) so the bite's victim is the note's stream-4 pick over the living front line.
 *
 * ## What this file does not model
 *
 * The ambushed start of the first Yojimbo tier (the monster's write lands after the opening counters and changes the intro only: RE note 2.2, 4.1) and the formation scripts' camera draws on stream 2 (RE note 7: they
 * shift the stream and are not part of the AI).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, isAlive, tryActor } from '../state.ts';
import { setGauge } from '../overdrive.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { counterAllowed } from './hit-gates.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  DARK_BATTLE_ID_FLAG,
  DARK_GAUGE_FULL,
  DARK_GAUGE_PER_TURN_FLAG,
  DARK_IDS,
  DARK_ROWS,
  DARK_SCRIPTS,
  SISTER_BASIC_MOVES,
  SISTER_DRAW_MODULO,
  SISTER_GAUGE_PER_HIT,
  SISTER_GAUGE_PER_TURN,
  TRIO_ACTOR_ORDER,
  TRIO_BATTLE_IDS,
  YOJIMBO_DRAW_MODULO,
  YOJIMBO_GAUGE_PER_HIT,
  type SisterKey,
} from './dark-aeons-rules.ts';

export * from './dark-aeons-rules.ts';

/** The Overdrive gauge of a combatant (0 when it has none). */
const gaugeOf = (c: FFXCombatant): number => c.overdrive?.gauge ?? 0;

/** `findMatchingChr` over the front line: one random living, targetable character (a draw only with two or more), as the row's one target. */
function victim(ai: AiContext, row: string): Command {
  const target = randomLiving(ai.ctx);
  return use(ai, row, target === undefined ? [] : [target.id]);
}

// ---------------------------------------------------------------------------
// Dark Yojimbo
// ---------------------------------------------------------------------------

/** The gauge Dark Yojimbo gains after each own turn: the tier's step, published by `dark-aeons-setup.ts` from the battle id (RE note 4.2 rule 3). Zero when the battle id is none of the five. */
export function tierStep(ctx: Ctx): number {
  const step = ctx.state.flags[DARK_GAUGE_PER_TURN_FLAG];
  return typeof step === 'number' ? step : 0;
}

/** One Dark Yojimbo turn (RE note 4.2). */
export function darkYojimboTurn(ai: AiContext): Command {
  const { ctx, self } = ai;
  let command: Command;
  if (gaugeOf(self) >= DARK_GAUGE_FULL) {
    // Zanmato on the whole front line, no draw; the gauge is written 0 here and the step below is added to it.
    setGauge(ctx, self, 0, 'zanmato');
    command = use(ai, DARK_ROWS.zanmato, []);
  } else {
    const draw = gameMod(ctx, YOJIMBO_DRAW_MODULO);
    command =
      draw === 0
        ? use(ai, DARK_ROWS.wakizashiAll, [])
        : draw === 1
          ? victim(ai, DARK_ROWS.kozuka)
          : use(ai, DARK_ROWS.daigoroOrder, [DARK_IDS.daigoro]);
  }
  setGauge(ctx, self, gaugeOf(self) + tierStep(ctx), 'attacking'); // after either branch, Zanmato's included: the gauge restarts at the step
  return command;
}

// ---------------------------------------------------------------------------
// The Sisters
// ---------------------------------------------------------------------------

/**
 * The trio test (RE note 5.2 row 1): a trio formation's battle id, Mindy, Sandy and Cindy (actors 20, 21, 22) all alive, and the three gauges each 100 or more. It exists only in the two trio formations, and a dead
 * Sister fails it for the rest of the fight.
 */
export function trioReady(ctx: Ctx): boolean {
  const battleId = ctx.state.flags[DARK_BATTLE_ID_FLAG];
  if (typeof battleId !== 'number' || !TRIO_BATTLE_IDS.includes(battleId)) return false;
  return TRIO_ACTOR_ORDER.every((key) => {
    const c = tryActor(ctx, DARK_IDS[key]);
    return c !== undefined && isAlive(c) && gaugeOf(c) >= DARK_GAUGE_FULL;
  });
}

/** One of the Sister's two basic moves: the coin (`GetRandomValue() mod 2`), then a random living front-line target for it (RE note 5.2). */
function basicMove(ai: AiContext, who: SisterKey): Command {
  const rows = SISTER_BASIC_MOVES[who];
  const coin = gameMod(ai.ctx, SISTER_DRAW_MODULO);
  return victim(ai, rows[coin === 0 ? 0 : 1]);
}

/** One Sister's turn (RE note 5.2: the three rules, in order). */
export function sisterTurn(ai: AiContext, who: SisterKey): Command {
  const { ctx, self } = ai;
  const grow = (): void => setGauge(ctx, self, gaugeOf(self) + SISTER_GAUGE_PER_TURN, 'attacking');

  // 1. The trio rule.
  if (trioReady(ctx)) {
    if (who === 'cindy') {
      for (const key of TRIO_ACTOR_ORDER) {
        const c = tryActor(ctx, DARK_IDS[key]);
        if (c !== undefined) setGauge(ctx, c, 0, 'delta-attack'); // she writes 0 to all three first
      }
      return use(ai, DARK_ROWS.deltaAttack, []);
    }
    const command = basicMove(ai, who);
    grow(); // a gauge already at 100 stays there
    return command;
  }

  // 2. Her own gauge is full: Mega Graviton on the whole front line, and the gauge goes to 0 (nothing is added afterwards).
  if (gaugeOf(self) >= DARK_GAUGE_FULL) {
    setGauge(ctx, self, 0, 'mega-graviton');
    return use(ai, DARK_ROWS.megaGraviton, []);
  }

  // 3. Otherwise one of her two basic moves, and her gauge grows by 20.
  const command = basicMove(ai, who);
  grow();
  return command;
}

// ---------------------------------------------------------------------------
// The hit events (RE notes 4.3 and 5.3)
// ---------------------------------------------------------------------------

/** `onHit`: the owner's gauge gains `per` (capped at 100), once per player action that reaches it, while `isCounterattackAllowed()` holds. */
function gainOnHit(per: number): (event: HitEvent) => void {
  return ({ ctx, target, attacker }) => {
    // Dark Yojimbo's own dog order lands on himself in this engine (the row is `targeting: 'self'`; the game aims it at the dog, so the dog's script hears it, not his): that is no action of the party's.
    if (attacker.id === target.id) return;
    if (!counterAllowed(ctx, target)) return;
    setGauge(ctx, target, gaugeOf(target) + per, 'targeted');
  };
}

/** The dog takes no turns (RE note 1.4): asked, it passes. Its bite is carried out by the order's own row (`battle/ffx/orders.ts`). */
const dogPass = (): Command | null => null;

registerAiScript(DARK_SCRIPTS.yojimbo, darkYojimboTurn);
registerHitScript(DARK_SCRIPTS.yojimbo, gainOnHit(YOJIMBO_GAUGE_PER_HIT));
registerAiScript(DARK_SCRIPTS.cindy, (ai) => sisterTurn(ai, 'cindy'));
registerAiScript(DARK_SCRIPTS.sandy, (ai) => sisterTurn(ai, 'sandy'));
registerAiScript(DARK_SCRIPTS.mindy, (ai) => sisterTurn(ai, 'mindy'));
for (const script of [DARK_SCRIPTS.cindy, DARK_SCRIPTS.sandy, DARK_SCRIPTS.mindy]) registerHitScript(script, gainOnHit(SISTER_GAUGE_PER_HIT));
registerAiScript(DARK_SCRIPTS.daigoro, dogPass);
