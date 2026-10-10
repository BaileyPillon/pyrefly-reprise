/**
 * Chapter 1: Seymour Flux and the Mortiorchis, as the game's own scripts run them
 * (re-parity; `research/re-ffx-ai-seymour.md` section 2; D-01 to D-08). **Game case: FFX only.**
 *
 * Two actors, one shared state `s` (`./seymour-flux-rules.ts`). **Seymour owns the stats**: Full-Life,
 * Cross Cleave, Slowga and Total Annihilation are his commands even though the Mortiorchis performs
 * them [§3.1, §4.4.2], so the mount takes the turn and the animation and Flux's numbers do the damage.
 *
 * | `s` | Flux's turn (first cycle) | The mount's turn (Flux's answer to Command 150) |
 * |---|---|---|
 * | 1 | Lance of Atrophy, `s` := 2 | nothing |
 * | 2 | nothing | Full-Life on a Zombie member (else a living one), `s` := 3 |
 * | 3 | Lance of Atrophy, `s` := 4 | nothing |
 * | 4 | nothing | Full-Life, `s` := 5 |
 * | 5 | Dispel on the front line, `s` := 6 | nothing |
 * | 6 | nothing | Cross Cleave on the front line, `s` := 1 |
 *
 * Below 50 % the cycle has four steps: Flux Flare at himself (1), the mount's "ready" notice (2), Flux's
 * Reflect or nothing (3), the mount's Total Annihilation (4). An actor whose turn arrives on the other
 * parity wastes it and leaves `s` alone; nothing remembers who acted last (D-01). While an aeon is out the
 * mount passes and Flux's turn is Banish, whatever the aeon has done (D-02).
 *
 * The HP lines, the revive and the Delay punishment are hooks (`./seymour-flux-hooks.ts`).
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, livingEnemies, rtOf, tryActor } from '../state.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import './seymour-flux-hooks.ts';
import {
  FLUX_ID,
  MORTIORCHIS_ID,
  announceCharge,
  fluxCycle,
  fluxFrontline,
  fluxOnCommand150,
  fluxPhaseNumber,
  mountCommand,
  randomLiving,
  setFluxCycle,
  wasteTurn,
} from './seymour-flux-rules.ts';

export { fluxPhase } from './seymour-flux-rules.ts';

/** Seymour Flux's turn [section 2.3]. */
export const seymourFluxAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  // An aeon in the battle: Banish it, at once. No count of the aeon's turns (the game has none).
  const aeonId = ctx.state.aeonId;
  if (aeonId) return use(ai, 'banish', [aeonId]);

  const s = fluxCycle(ctx);
  if (fluxPhaseNumber(ctx) !== 2) {
    if (s === 1 || s === 3) {
      setFluxCycle(ctx, s + 1);
      const target = randomLiving(ctx);
      return use(ai, 'lance-of-atrophy', target ? [target.id] : []);
    }
    if (s === 5) {
      setFluxCycle(ctx, 6);
      return use(ai, 'dispel', fluxFrontline(ctx).map((c) => c.id));
    }
    return wasteTurn(ai, 'Seymour waits');
  }

  // The second cycle. Flare is always cast at himself: his Reflect decides who eats it [§4.4.1].
  if (s === 1) {
    setFluxCycle(ctx, 2);
    return use(ai, 'flare-self', [ai.self.id]);
  }
  if (s === 3) {
    setFluxCycle(ctx, 4);
    return has(ai.self, 'reflect') ? wasteTurn(ai, 'Seymour waits') : use(ai, 'reflect', [ai.self.id]);
  }
  return wasteTurn(ai, 'Seymour waits');
};

/**
 * The Mortiorchis's turn [section 2.4]: it queues Command 150 on Flux and Flux's own reaction is the
 * move. With an aeon on the field it does nothing (and does not copy Flux's counter). After its turn
 * it copies Flux's CTB counter into its own (D-08): the two stay in step.
 */
export const mortiorchisAi = (ai: AiContext): Command | null => {
  const ctx = ai.ctx;
  if (ctx.state.aeonId) return wasteTurn(ai, 'The Mortiorchis holds');

  const outcome = fluxOnCommand150(ctx);
  const flux = tryActor(ctx, FLUX_ID);
  if (flux) rtOf(ctx, ai.self.id).ctb = rtOf(ctx, flux.id).ctb;

  switch (outcome.kind) {
    case 'ready':
      announceCharge(ctx, ai.self, 'Ready To Annihilate'); // Special 1 on himself: the notice that it is ready
      return null;
    case 'total-annihilation':
      rtOf(ctx, ai.self.id).charge = null; // Special 2: back to normal
      return mountCommand(ai, outcome);
    case 'slowga':
      return use(ai, 'slowga-counter', fluxFrontline(ctx).map((c) => c.id));
    case 'nothing':
      return wasteTurn(ai, 'The Mortiorchis stirs');
    default:
      return mountCommand(ai, outcome);
  }
};

/** True while the mount is on the board, which it is for the whole fight [§2.2]. */
export function mortiorchisAlive(ai: AiContext): boolean {
  return livingEnemies(ai.ctx).some((c) => c.id === MORTIORCHIS_ID);
}

// ---------------------------------------------------------------------------
// Talk
// ---------------------------------------------------------------------------

/**
 * The **Talk** Trigger Command in this encounter [ffx-seymour-flux §4.7; the game's formation script agrees,
 * `research/re-ffx-ai-seymour.md` section 1.5]: **Kimahri +10 Strength**, **Yuna +10 Magic Defense**, once per
 * character. The bonus lands on `stats` rather than as a status: only real stat points move the cubic
 * `str^3 // 32` POWER term.
 */
const SEYMOUR_TALK_BONUS: Readonly<Record<string, { readonly stat: 'str' | 'mdef'; readonly amount: number; readonly label: string }>> = {
  kimahri: { stat: 'str', amount: 10, label: 'Strength' },
  yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
};

const TALKED = 'seymour.talked.';

/** Who still has a Talk line left, for the menu and the intent panel. */
export function seymourTalkAvailable(ctx: Ctx, talkerId: string): boolean {
  if (!(talkerId in SEYMOUR_TALK_BONUS)) return false;
  return ctx.state.flags[`${TALKED}${talkerId}`] !== true;
}

/** Spend `talker`'s one Talk line. Returns false when there is nothing to say. */
export function consumeSeymourTalk(ctx: Ctx, talker: FFXCombatant): boolean {
  const bonus = SEYMOUR_TALK_BONUS[talker.id];
  if (!bonus) return false;
  const key = `${TALKED}${talker.id}`;
  if (ctx.state.flags[key] === true) return false;
  ctx.state.flags[key] = true;
  talker.stats[bonus.stat] += bonus.amount;
  ctx.emit({
    type: 'message',
    text: `${talker.name}: +${bonus.amount} ${bonus.label}`,
    kind: 'story',
  });
  return true;
}

registerAiScript(FLUX_ID, seymourFluxAi);
registerAiScript(MORTIORCHIS_ID, mortiorchisAi);
