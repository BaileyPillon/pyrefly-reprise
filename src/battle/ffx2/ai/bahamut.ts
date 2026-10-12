/**
 * Bahamut — Bevelle Underground, Chapter 4 [research/re-ffx2-ai-bahamut-vegnagun.md section 2; re-parity AI lane FFX-2 a].
 * **FFX-2 only.** The decision table of the game's own script (`m168`), in our words:
 *
 * | Poll | Condition | Command |
 * |---|---|---|
 * | the first poll of the battle | some living girl lacks Curse | Curse on one such girl (near-weighted search), and the poll ends |
 * | the first poll, no such girl | | go on to the rotation in the same poll |
 * | any poll with the countdown armed | | see below: no command until the count runs out, then Mega Flare |
 * | rotation 1, 2, 3 | | Attack on a girl without Poison (near-weighted); all poisoned, on any living girl (near-weighted) |
 * | rotation 4 | | Impulse on the party |
 * | rotation 5 | | rotation back to 0, arm the countdown, Impulse on the party |
 *
 * So Curse comes once, at his very first action, and the loop is six actions: Attack, Attack, Attack, Impulse, Impulse, the
 * countdown, Mega Flare (rows B1, B2, B5). Nothing in it reads his HP, his status or the party's HP.
 *
 * **The countdown (rows B3, B4) is a timer row, on the logic step since RC3.** In the game it is five steps of 150 AI polls, 750 polls
 * (25.03 s of running clock), counted on every logic step he is ready, so Slow and Haste do not change it. The engine's clock is the
 * logic step now, so each countdown turn is an idle wait (ai/idle.ts idleFor) of exactly the steps to the next window: the first poll
 * after the second Impulse is poll 1 and says nothing, the 5 shows at poll 150, the 4 at 300, the 3 at 450, the 2 at 600 and the 1 comes
 * with the cast at poll 750 (149 steps from poll 1 to poll 150, then 150 each). The unit sits the wait out executing, takes no recovery
 * and thinks nothing, so Slow, Haste, a fallen girl and his own gauge do not move it, and a Wait menu stops it with every other clock.
 * Only what is shown follows the scene's number windows: there is no 0 and the 1 comes with the cast. charge events keep turnsLeft as the
 * turns until the cast.
 * shown moved (there is no 0 any more). `charge` events keep `turnsLeft` as the turns until the cast.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { idleFor } from './idle.ts';
import { BAHAMUT_COUNTDOWN_START, BAHAMUT_POLLS_PER_COUNTDOWN_STEP } from '../constants.ts';
import { lacking, searchNear, SCENES } from './script-rolls.ts';

/** The turns of the countdown, counted from the one after the second Impulse: five steps, the last of them the cast. */
const COUNTDOWN_TURNS = BAHAMUT_COUNTDOWN_START + 1;

function girls(ctx: AiContext): Ffx2Unit[] {
  return ctx.party();
}

/** `searchr(poison, not)`, else `searchr(alive)`: both near-weighted. */
function attackTarget(ctx: AiContext): Ffx2Unit | undefined {
  const all = girls(ctx);
  return searchNear(ctx.rng, lacking(all, 'poison'), SCENES.bahamut) ?? searchNear(ctx.rng, all, SCENES.bahamut);
}

function countdownTurn(ctx: AiContext): Command | null {
  const self = ctx.self;
  const turn = mem(self, 'countdownTurn') + 1;
  if (turn < COUNTDOWN_TURNS) {
    setMem(self, 'countdownTurn', turn);
    if (turn >= 2) {
      const shown = BAHAMUT_COUNTDOWN_START - (turn - 2); // 5, 4, 3, 2
      ctx.emit({ type: 'charge', enemyId: self.id, name: String(shown), turnsLeft: shown - 1, stage: shown <= 2 ? 2 : 1 });
      ctx.flags['bahamutCountdown'] = shown;
    }
    // The polls between the numbers issue nothing: wait for the next window (poll 150, 300, ...; the first poll is poll 1, so 149 steps).
    return idleFor(self, turn === 1 ? BAHAMUT_POLLS_PER_COUNTDOWN_STEP - 1 : BAHAMUT_POLLS_PER_COUNTDOWN_STEP);
  }
  setMem(self, 'countdownTurn', 0);
  setMem(self, 'megaArmed', 0);
  ctx.emit({ type: 'charge', enemyId: self.id, name: '1', turnsLeft: 0, stage: 2 });
  ctx.flags['bahamutCountdown'] = 1;
  return { kind: 'ability', id: 'mega-flare', targets: [] };
}

function rotation(ctx: AiContext): Command | null {
  const self = ctx.self;
  if (mem(self, 'megaArmed') === 1) return countdownTurn(ctx);

  const step = mem(self, 'normalAttack') + 1;
  setMem(self, 'normalAttack', step);
  if (step <= 3) {
    if (step === 1) ctx.flags['bahamutCountdown'] = 0; // the window has gone out
    const target = attackTarget(ctx);
    return target ? { kind: 'ability', id: 'attack', targets: [target.id] } : null;
  }
  if (step === 4) return { kind: 'ability', id: 'impulse', targets: [] };
  setMem(self, 'normalAttack', 0);
  setMem(self, 'megaArmed', 1);
  setMem(self, 'countdownTurn', 0);
  return { kind: 'ability', id: 'impulse', targets: [] };
}

export const bahamutScript: AiScript = {
  id: 'ffx2-bahamut',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    if (mem(self, 'firstCurse') === 0) {
      setMem(self, 'firstCurse', 1);
      const target = searchNear(ctx.rng, lacking(girls(ctx), 'curse'), SCENES.bahamut);
      if (target) return { kind: 'ability', id: 'bahamut-curse', targets: [target.id] };
      // Every girl already carries Curse: the same poll goes on to the rotation.
    }
    return rotation(ctx);
  },
};

export default bahamutScript;
