/**
 * Vegnagun — the two Redoubts of link 4 [research/re-ffx2-ai-bahamut-vegnagun.md section 6.2; re-parity AI lane FFX-2 a].
 * **FFX-2 only.** The decision tables of the game's own scripts (`m291` Right, `m292` Left), in our words.
 *
 * **Phase 1** (the Head's phase flag is down): if the other Redoubt is dead, Full-Life on it and the revive count (which
 * the Head's talk reads) goes up by 1; otherwise the Redoubt does **nothing**. They never attack in phase 1 (rows R2, R4). In
 * the game that idle poll comes round every logic step, so a revive is queued within one step of the twin's death; here a poll
 * that issues nothing spends a turn, so the revive can start up to one turn late (a timer row, listed for lane W4).
 *
 * **Phase 2** (after the Head's Acta Est Fabula): every poll adds 1 to the Redoubt's own turn counter and to the shared fail
 * clock, then:
 *
 * - if the other Redoubt is alive, it acts by the turn counter;
 * - if the other is dead and its revive counter is 2 or more, the counter is spent and it casts Full-Life on the twin (the turn
 *   counter has still moved on, so a revive uses up one place of the four); otherwise the revive counter goes up by 1 and it
 *   acts by the turn counter. So with the twin dead the pattern is act, act, revive.
 *
 * | Turn | Right | Left |
 * |---|---|---|
 * | 1 | Break on a girl who is not Petrified (else any living girl) | MP beam at one girl |
 * | 2 | HP beam at one girl | Slow on a girl without Slow (else any) |
 * | 3 | Blind on a girl without Darkness (else any) | Dispel at one girl |
 * | 4 or more | Flare at one girl, counter back to 0 | Demi on the whole party, counter back to 0 |
 *
 * Every pick is the uniform search. **A Redoubt's death sets its turn counter to 1 (Right) or 0 (Left)** (rows R1, R3): phase 2
 * can only begin once both have died, so the Right's first action in phase 2 is the HP beam (turn 2), not Break (the note's
 * R1 text says Break; the script's death entry makes it the beam, which is what this module's older rotation had), and the Left
 * starts at its MP beam. When the second of the two falls the Head becomes targetable at once, before it polls.
 */

import type { Command, StatusId } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { lacking, searchUniform } from './script-rolls.ts';
import { IDLE_UNTIL_WOKEN, WAKE_ON_ALIVE_CHANGE, idleFor } from './idle.ts';

export const REDOUBT_R = 'redoubt-r';
export const REDOUBT_L = 'redoubt-l';
const HEAD = 'vegnagun-head';

/** The shared encounter flags the link's scripts use (the game's battle-local `bf_*` variables). */
export const HEAD_PHASE = 'headPhase';
export const HEAD_CLOCK = 'headTurns';
export const REDOUBT_REVIVES = 'redoubtRevives';

export function redoubtOf(ctx: AiContext, id: string): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === id);
}

/** The party's girls and the shared clock helpers. */
function clockUp(ctx: AiContext): number {
  const now = (typeof ctx.flags[HEAD_CLOCK] === 'number' ? ctx.flags[HEAD_CLOCK] : 0) + 1;
  ctx.flags[HEAD_CLOCK] = now;
  return now;
}

/** One uniform girl, preferring those who lack `status`; any living girl when none does. */
function pickLacking(ctx: AiContext, status: StatusId): Ffx2Unit | undefined {
  const girls = ctx.party();
  return searchUniform(ctx.rng, lacking(girls, status)) ?? searchUniform(ctx.rng, girls);
}

function oneGirl(ctx: AiContext): Ffx2Unit | undefined {
  return searchUniform(ctx.rng, ctx.party());
}

function at(target: Ffx2Unit | undefined, id: string): Command | null {
  return target ? { kind: 'ability', id, targets: [target.id] } : null;
}

/** The Right Redoubt's move for a turn counter of `turn` (it resets the counter after turn 4 or more). */
function rightMove(ctx: AiContext, turn: number): Command | null {
  if (turn === 1) return at(pickLacking(ctx, 'petrify'), 'leg-break');
  if (turn === 2) return at(oneGirl(ctx), 'lacrimosa-r');
  if (turn === 3) return at(pickLacking(ctx, 'darkness'), 'blind');
  setMem(ctx.self, 'turn', 0);
  return at(oneGirl(ctx), 'flare');
}

/** The Left Redoubt's move for a turn counter of `turn`. */
function leftMove(ctx: AiContext, turn: number): Command | null {
  if (turn === 1) return at(oneGirl(ctx), 'lacrimosa-l');
  if (turn === 2) return at(pickLacking(ctx, 'slow'), 'leg-slow');
  if (turn === 3) return at(oneGirl(ctx), 'dispel');
  setMem(ctx.self, 'turn', 0);
  return { kind: 'ability', id: 'demi', targets: [] };
}

/** Note a Redoubt's death for its script (the death entry resets its counter at its next poll) and unlock the Head at the second one. */
function noteFall(ctx: AiContext, twinId: string): void {
  if (ctx.self.alive) return;
  setMem(ctx.self, 'fell', 1);
  const twin = redoubtOf(ctx, twinId);
  const head = ctx.units.find((u) => u.id === HEAD);
  if (head && (!twin || !twin.alive)) head.flags.untargetable = false;
}

function redoubtScript(id: string, isRight: boolean): AiScript {
  const twinId = isRight ? REDOUBT_L : REDOUBT_R;
  return {
    id,
    decide(ctx: AiContext): Command | null {
      const self = ctx.self;
      if (mem(self, 'fell') === 1) {
        setMem(self, 'fell', 0);
        setMem(self, 'turn', isRight ? 1 : 0); // the death entry
      }
      const twin = redoubtOf(ctx, twinId);
      const revive = (): Command | null => (twin ? { kind: 'ability', id: 'full-life', targets: [twin.id] } : null);
      if (ctx.flags[HEAD_PHASE] !== 'B') {
        if (twin && !twin.alive) {
          ctx.flags[REDOUBT_REVIVES] = (typeof ctx.flags[REDOUBT_REVIVES] === 'number' ? ctx.flags[REDOUBT_REVIVES] : 0) + 1;
          return revive();
        }
        // Phase 1, twin standing: the game's idle poll comes round every step, so the revive is queued within one step of the twin's fall (row R4,
        // RC3): wait for any unit to fall or rise (ai/idle.ts WAKE_ON_ALIVE_CHANGE) instead of spending a turn of the Redoubt's own runway.
        return idleFor(self, IDLE_UNTIL_WOKEN, WAKE_ON_ALIVE_CHANGE);
      }
      const turn = mem(self, 'turn') + 1;
      setMem(self, 'turn', turn);
      clockUp(ctx);
      const move = (): Command | null => (isRight ? rightMove(ctx, turn) : leftMove(ctx, turn));
      if (!twin || twin.alive) return move();
      const raise = mem(self, 'raise');
      if (raise >= 2) {
        setMem(self, 'raise', 0);
        return revive();
      }
      setMem(self, 'raise', raise + 1);
      return move();
    },
    onDamaged(ctx: AiContext): void {
      noteFall(ctx, twinId);
    },
    onTurnResolved(ctx: AiContext): void {
      noteFall(ctx, twinId);
    },
  };
}

export const vegnagunRedoubtRightScript = redoubtScript('vegnagun-redoubt-r', true);
export const vegnagunRedoubtLeftScript = redoubtScript('vegnagun-redoubt-l', false);

/** The data file ships one shared `aiScriptId`; the id decides which pod it is. */
export const vegnagunRedoubtScript: AiScript = {
  id: 'vegnagun-redoubt',
  decide(ctx: AiContext): Command | null {
    const isRight = ctx.self.id === REDOUBT_R || ctx.self.slot % 2 === 1;
    return (isRight ? vegnagunRedoubtRightScript : vegnagunRedoubtLeftScript).decide(ctx);
  },
  onDamaged(ctx: AiContext): void {
    noteFall(ctx, ctx.self.id === REDOUBT_R || ctx.self.slot % 2 === 1 ? REDOUBT_L : REDOUBT_R);
  },
  onTurnResolved(ctx: AiContext): void {
    noteFall(ctx, ctx.self.id === REDOUBT_R || ctx.self.slot % 2 === 1 ? REDOUBT_L : REDOUBT_R);
  },
};
