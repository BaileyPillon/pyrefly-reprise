/**
 * **Belgemine's Bahamut, Yojimbo and Anima** at the Remiem Temple (the hidden Belgemine's Challenge chapter; **FFX only**): `m287`, `m288` with his dog `m266`, and `m265`, the Remiem branches as the game's bytecode runs them
 * (`research/re-ffx-belgemine-aeon-duels.md` sections 3.9 to 3.11, "RE 3.n"). Pinned to the note's harness output by `tests/unit/chapters/belgemine-ai.test.ts`; constants and sources in `./belgemine-rules.ts`.
 *
 * ```
 * Bahamut (RE 3.9)    first turn Summon. Then: gauge 100: Mega Flare on the front line, gauge 0.   Otherwise nothing: the gauge gains 20, a pass (gauge 20, 40, 60, 80, 100: five empty turns, Mega Flare on the seventh call)
 *                     every allowed hit (a counter never answers a counter) is countered with an Attack on the last attacker; the fifth, and every fifth after, with Impulse on the front line instead
 * Yojimbo (RE 3.10)  the Cavern's script (Chapter IX) with Remiem's numbers: gauge 100: Zanmato on the front line, gauge 0; 80 to 99: draw mod 4 (0 Wakizashi, 1 Kozuka, else the dog's order); 50 to 79: mod 5
 *                     (0 Wakizashi, 1 Kozuka, else the dog); 25 to 49: mod 4 (0 Kozuka, else the dog); under 25: the dog. +2 after every turn but the Summon (Zanmato's included); an allowed hit adds 3
 * Anima (RE 3.11)    gauge 100: Oblivion on the front line, gauge 0.   Else draw mod 10: 0 Dispel (one), 1 and 2 Demi (the front line), 3 to 5 Pain (one), 6 to 9 Attack (one).
 *                     Her own actions add nothing; every hit she takes adds 5, ungated (a counter-gate would be the game's, but her hook has none)
 * ```
 *
 * The dog is `ordersOnly`: it owns no turn and bites only on Yojimbo's order (`battle/ffx/orders.ts`), with its own Strength 25, the victim the game's pick over the living front line (`extra.orderedAim`).
 */

import type { Command } from '../../common/types.ts';
import { setGauge } from '../overdrive.ts';
import { rtOf } from '../state.ts';
import { gameMod, randomLiving } from './game-rolls.ts';
import { counterAllowed, react, reactionAim } from './hit-gates.ts';
import { type HitEvent, registerHitScript } from './hit-script.ts';
import { type AiContext, aiContextFor, num, registerAiScript, use } from './types.ts';
import {
  ANIMA,
  BAHAMUT,
  BELG_IDS,
  BELG_ROWS as R,
  BELG_SCRIPTS,
  BELG_SPELLS as S,
  GAUGE_FULL,
  MEM,
  YOJIMBO,
  gain,
  gaugeOf,
  summonFirst,
  victimRow,
} from './belgemine-rules.ts';

// ---------------------------------------------------------------------------
// Bahamut (m287, lmyt01_04)
// ---------------------------------------------------------------------------

/** One Bahamut turn (RE 3.9): five empty turns, then Mega Flare. */
export function bahamutAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const first = summonFirst(ai, R.summonBahamut);
  if (first !== undefined) return first;
  if (gaugeOf(self) >= GAUGE_FULL) {
    setGauge(ctx, self, 0, 'overdrive');
    return use(ai, R.megaFlare, []);
  }
  gain(ctx, self, BAHAMUT.perTurn, 'charging');
  ctx.emit({ type: 'message', text: `${self.name} gathers power`, kind: 'telegraph' }); // the game plays a charge scene on these turns
  return null;
}

/** Bahamut's `onHit` (m287 f3 @0x4c0): count the hit; the fifth is Impulse on the front line, every other an Attack on the last attacker. */
function bahamutHit({ ctx, target, attacker }: HitEvent): void {
  if (!counterAllowed(ctx, target)) return;
  const memory = rtOf(ctx, target.id).ai;
  const hits = num(memory, MEM.hits) + 1;
  const bahamut = aiContextFor(ctx, target);
  if (hits >= BAHAMUT.impulseEvery) {
    memory[MEM.hits] = 0;
    react(ctx, target, reactionAim(ctx, attacker), use(bahamut, R.impulse, []));
  } else {
    memory[MEM.hits] = hits;
    react(ctx, target, reactionAim(ctx, attacker), use(bahamut, R.attackB, [attacker.id]));
  }
}

// ---------------------------------------------------------------------------
// Yojimbo (m288 + the dog m266, lmyt01_05)
// ---------------------------------------------------------------------------

/** The move the gauge band rolls (m288 @0x3aa to 0x4fa). */
function rolledMove(ai: AiContext, gauge: number): Command {
  const { ctx } = ai;
  const dog = (): Command => use(ai, R.daigoroOrder, [BELG_IDS.dog]);
  if (gauge >= YOJIMBO.bandHeightened) {
    const d = gameMod(ctx, 4);
    return d === 0 ? victimRow(ai, R.wakizashi) : d === 1 ? victimRow(ai, R.kozuka) : dog();
  }
  if (gauge >= YOJIMBO.bandWakizashi) {
    const d = gameMod(ctx, 5);
    return d === 0 ? victimRow(ai, R.wakizashi) : d === 1 ? victimRow(ai, R.kozuka) : dog();
  }
  if (gauge >= YOJIMBO.bandKozuka) return gameMod(ctx, 4) === 0 ? victimRow(ai, R.kozuka) : dog();
  return dog();
}

/** One Yojimbo turn (RE 3.10). */
export function yojimboAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const first = summonFirst(ai, R.summonYojimbo);
  if (first !== undefined) return first;
  let command: Command;
  if (gaugeOf(self) >= GAUGE_FULL) {
    setGauge(ctx, self, 0, 'zanmato');
    command = use(ai, R.zanmato, []);
  } else command = rolledMove(ai, gaugeOf(self));
  gain(ctx, self, YOJIMBO.perTurn, 'attacking'); // after every turn but the Summon, Zanmato's included
  return command;
}

/** Yojimbo's `onHit` (m288 f3 @0x533): +3 while he can counter. */
function yojimboHit({ ctx, target }: HitEvent): void {
  if (counterAllowed(ctx, target)) gain(ctx, target, YOJIMBO.perHit, 'targeted');
}

/** The dog owns no CTB turn (RE 0); it bites on Yojimbo's order only. */
function dogAi(): Command | null {
  return null;
}

// ---------------------------------------------------------------------------
// Anima (m265, lmyt01_06)
// ---------------------------------------------------------------------------

/** One Anima turn (RE 3.11). */
export function animaAi(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  const first = summonFirst(ai, R.summonAnima);
  if (first !== undefined) return first;
  if (gaugeOf(self) >= GAUGE_FULL) {
    setGauge(ctx, self, 0, 'overdrive');
    return use(ai, R.oblivion, []);
  }
  const draw = gameMod(ctx, ANIMA.draws);
  if (draw === 0) {
    const victim = randomLiving(ctx);
    return use(ai, S.dispel, victim === undefined ? [] : [victim.id]);
  }
  if (draw <= 2) return use(ai, S.demi, []);
  return victimRow(ai, draw <= 5 ? R.pain : R.animaAttack);
}

/** Anima's `onHit` (m265 f4 @0x38d): +5 on every hit, with no counter gate. Her gauge fills from nothing else. */
function animaHit({ ctx, target }: HitEvent): void {
  gain(ctx, target, ANIMA.perHit, 'targeted');
}

registerAiScript(BELG_SCRIPTS.bahamut, bahamutAi);
registerAiScript(BELG_SCRIPTS.yojimbo, yojimboAi);
registerAiScript(BELG_SCRIPTS.dog, dogAi);
registerAiScript(BELG_SCRIPTS.anima, animaAi);
registerHitScript(BELG_SCRIPTS.bahamut, bahamutHit);
registerHitScript(BELG_SCRIPTS.yojimbo, yojimboHit);
registerHitScript(BELG_SCRIPTS.anima, animaHit);
