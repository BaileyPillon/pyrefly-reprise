/**
 * Vegnagun — the Head of link 4, with the cannon fail clock
 * [research/re-ffx2-ai-bahamut-vegnagun.md section 6.1; re-parity AI lane FFX-2 a]. **FFX-2 only.**
 * The decision table of the game's own script (`m290`), in our words; the Redoubts are `vegnagun-redoubt.ts`.
 *
 * **Init.** The Head starts untargetable with Agility 110 (the table's 36 is replaced by the script); in phase 2 it sets Agility to
 * 68 at every poll (row H3). Its first poll is a voice line (Shuyin).
 *
 * **Phase 1** (the phase flag is down), in order:
 *
 * | # | Condition | Poll |
 * |---|---|---|
 * | 1 | the Redoubts have revived each other twice, first time | a voice line (Jecht) |
 * | 2 | same, later: `random() % 4 = 0` | stage 1 a line (Auron), stage 2 two lines back to back (Braska), stage 3 nothing; else the poll goes on |
 * | 3 | both Redoubts alive | Pallida Mors at one girl (uniform) |
 * | 4 | exactly one alive | nothing |
 * | 5 | both dead | the phase flag goes up, the Head becomes targetable, Acta Est Fabula on both Redoubts (row H1) |
 *
 * **Phase 2.** Every poll: Agility 68. Then, the first that applies ends the poll:
 *
 * 1. the first phase-2 poll: a voice line (Shuyin), no clock; the third: a voice line (Jecht), no clock;
 * 2. the shared fail clock goes up by 1 (the Redoubts raise the same counter on every phase-2 poll of theirs);
 * 3. the clock is 100 or more: the cannon fires and the world ends (the bad ending) (row H2);
 * 4. the clock is 80, 60, 40 or 20 or more and that line is unspoken: it is spoken (Shuyin), highest first;
 * 5. the clock is 51 or more, once: a line (Braska in the game; the story binding here is `auron-halfway`, stale);
 * 6. HP below a fifth, once; HP below a half, once: a line each;
 * 7. `random() % 5 = 0`, then `random() % 3` picks one of three more lines, each once: spoken if unspoken, else the poll goes on;
 * 8. both Redoubts dead: Acta Est Fabula on them again;
 * 9. the attack ladder, below.
 *
 * **The ladder** (strict "below" tests on integer thresholds, a fifth of his maximum HP and its multiples): in HP band 4 (below
 * 1/5), 3 (below 2/5), 2 (below 3/5) or 1 (below 4/5), the first time the Head is in that band or a lower one that it has
 * not paid yet (`canon` below the band number), Nemo Ante Mortem Beatus on the party and `canon` becomes the band number; a
 * single hit through several bands pays only one Nemo and skips the rest (rows H4). Otherwise, with 15 or more hits taken
 * since the last one (rows H5, every damaging result counts, phase 2 only): Odi Et Amo and the count restarts; else Mors Certa.
 *
 * The lines have no text in our story scripts beyond the ones bound by name (`shuyin-line-1` to `-7`, `jecht-no-overtime`,
 * `auron-halfway`); the others play silent. Poll costs: one turn per poll, a timer row listed for lane W4.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { IDLE_UNTIL_WOKEN, WAKE_ON_ALIVE_CHANGE, idleFor, speakTurn } from './idle.ts';
import { HEAD_FIRE_AT_TURN, HEAD_HALFWAY_LINE_AT, HEAD_LINE_INTERVAL } from '../constants.ts';
import { scriptMod, searchUniform } from './script-rolls.ts';
import { HEAD_CLOCK, HEAD_PHASE, REDOUBT_L, REDOUBT_R, REDOUBT_REVIVES, redoubtOf } from './vegnagun-redoubt.ts';

/** `stat_dex` the script writes: at the start, and at every phase-2 poll. */
const PHASE_ONE_AGILITY = 110;
const PHASE_TWO_AGILITY = 68;
/** Hits the Head takes before its next Odi Et Amo. */
const ODI_ET_AMO_HITS_TAKEN = 15;

function pods(ctx: AiContext): { right: boolean; left: boolean; ids: string[] } {
  const right = redoubtOf(ctx, REDOUBT_R);
  const left = redoubtOf(ctx, REDOUBT_L);
  return {
    right: !!right && right.alive,
    left: !!left && left.alive,
    ids: [right, left].filter((u): u is Ffx2Unit => u !== undefined).map((u) => u.id),
  };
}

function actaEstFabula(ctx: AiContext): Command {
  return { kind: 'ability', id: 'acta-est-fabula', targets: pods(ctx).ids };
}

/** Phase 1, past the first poll. */
function phaseOne(ctx: AiContext): Command | null {
  const self = ctx.self;
  if ((typeof ctx.flags[REDOUBT_REVIVES] === 'number' ? ctx.flags[REDOUBT_REVIVES] : 0) >= 2) {
    const stage = mem(self, 'jectFirst');
    if (stage === 0) {
      setMem(self, 'jectFirst', 1);
      return speakTurn(self);
    }
    if (scriptMod(ctx.rng, 4) === 0) {
      if (stage === 1) {
        setMem(self, 'jectFirst', 2);
        return speakTurn(self);
      }
      if (stage === 2) {
        setMem(self, 'jectFirst', 3);
        setMem(self, 'queuedSpeech', 1); // the second of two speak commands queued together: it runs without a poll
        return speakTurn(self);
      }
    }
  }
  const alive = pods(ctx);
  if (alive.right && alive.left) {
    const target = searchUniform(ctx.rng, ctx.party());
    return target ? { kind: 'ability', id: 'pallida-mors', targets: [target.id] } : null;
  }
  if (alive.right || alive.left) return idleFor(self, IDLE_UNTIL_WOKEN, WAKE_ON_ALIVE_CHANGE); // one Redoubt left: idle until a Redoubt falls or rises (row R4, RC3)
  ctx.flags[HEAD_PHASE] = 'B';
  ctx.flags['headClockRunning'] = true;
  self.flags.untargetable = false;
  return actaEstFabula(ctx);
}

/** The clock's spoken lines, highest first: the count, the memory key, the line's number (the story triggers `shuyin-line-3` to `-6`). */
const CLOCK_LINES: ReadonlyArray<readonly [number, string, number]> = [0, 1, 2, 3].map((i) => {
  const at = HEAD_LINE_INTERVAL * (4 - i);
  return [at, `line${at}`, 6 - i] as const;
});

/** HP below `num/den` of the maximum, integer division as the script does it (`maxhp * num / den`). */
function below(self: Ffx2Unit, num: number, den: number): boolean {
  return self.hp < Math.floor((self.stats.maxHp * num) / den);
}

function ladder(ctx: AiContext): Command {
  const self = ctx.self;
  // Band number: 4 below 1/5, 3 below 2/5, 2 below 3/5, 1 below 4/5, 0 otherwise.
  const bandNumber = below(self, 1, 5) ? 4 : below(self, 2, 5) ? 3 : below(self, 3, 5) ? 2 : below(self, 4, 5) ? 1 : 0;
  if (bandNumber >= 1 && mem(self, 'canon') <= bandNumber - 1) {
    setMem(self, 'canon', bandNumber);
    return { kind: 'ability', id: 'nemo-ante-mortem-beatus', targets: [] };
  }
  if (mem(self, 'hangeki') >= ODI_ET_AMO_HITS_TAKEN) {
    setMem(self, 'hangeki', 0);
    return { kind: 'ability', id: 'odi-et-amo', targets: [] };
  }
  return { kind: 'ability', id: 'mors-certa', targets: [] };
}

/** Phase 2, past the Agility write: whether this poll spoke, ended the world, or goes on to the Redoubt check and the ladder. */
function phaseTwoTalk(ctx: AiContext): 'spoke' | 'doom' | 'go-on' {
  const self = ctx.self;
  const first = mem(self, 'phaseTwoPolls') + 1;
  setMem(self, 'phaseTwoPolls', first);
  if (first === 1) {
    ctx.emit({ type: 'script-trigger', name: 'shuyin-line-2', payload: { line: 2 } });
    return 'spoke';
  }
  if (first === 3) {
    ctx.emit({ type: 'script-trigger', name: 'jecht-no-overtime', payload: {} });
    return 'spoke';
  }
  const clock = (typeof ctx.flags[HEAD_CLOCK] === 'number' ? ctx.flags[HEAD_CLOCK] : 0) + 1;
  ctx.flags[HEAD_CLOCK] = clock;
  if (clock >= HEAD_FIRE_AT_TURN) {
    ctx.emit({ type: 'script-trigger', name: 'shuyin-line-7', payload: { line: 7 } });
    ctx.flags['badEnding'] = true;
    return 'doom';
  }
  for (const [at, key, line] of CLOCK_LINES) {
    if (clock >= at && mem(self, key) === 0) {
      setMem(self, key, 1);
      ctx.emit({ type: 'script-trigger', name: `shuyin-line-${line}`, payload: { line, clock } });
      return 'spoke';
    }
  }
  if (clock >= HEAD_HALFWAY_LINE_AT && mem(self, 'halfway') === 0) {
    setMem(self, 'halfway', 1);
    ctx.emit({ type: 'script-trigger', name: 'auron-halfway', payload: { turns: clock } });
    return 'spoke';
  }
  if (below(self, 1, 5) && mem(self, 'lowLine') === 0) {
    setMem(self, 'lowLine', 1);
    return 'spoke';
  }
  if (below(self, 1, 2) && mem(self, 'halfLine') === 0) {
    setMem(self, 'halfLine', 1);
    return 'spoke';
  }
  if (scriptMod(ctx.rng, 5) === 0) {
    const key = (['aloneLine', 'jectLine', 'braskaLine'] as const)[scriptMod(ctx.rng, 3)] ?? 'braskaLine';
    if (mem(self, key) === 0) {
      setMem(self, key, 1);
      return 'spoke';
    }
  }
  return 'go-on';
}

export const vegnagunHeadScript: AiScript = {
  id: 'vegnagun-head',
  /** The script's init writes Agility 110 before the first gauge (row H3, RC3): the opening wait is rolled on it, not on the table's 36. */
  init: { agi: PHASE_ONE_AGILITY },

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    if (mem(self, 'started') === 0) {
      setMem(self, 'started', 1);
      self.stats.agi = PHASE_ONE_AGILITY;
      self.flags.untargetable = true;
    }
    const queued = mem(self, 'queuedSpeech');
    if (queued > 0) {
      setMem(self, 'queuedSpeech', queued - 1);
      return speakTurn(self);
    }
    if (mem(self, 'opened') === 0) {
      setMem(self, 'opened', 1);
      ctx.emit({ type: 'script-trigger', name: 'shuyin-line-1', payload: { line: 1 } });
      return speakTurn(self);
    }
    if (ctx.flags[HEAD_PHASE] !== 'B') return phaseOne(ctx);

    self.stats.agi = PHASE_TWO_AGILITY;
    const talk = phaseTwoTalk(ctx);
    if (talk === 'spoke') return speakTurn(self);
    if (talk !== 'go-on') return null; // the cannon fires: the world ends
    const alive = pods(ctx);
    if (!alive.right && !alive.left) return actaEstFabula(ctx);
    return ladder(ctx);
  },

  /** Every separate HP-damaging result counts toward Odi Et Amo, in phase 2 only. */
  onDamaged(ctx: AiContext, _sourceId, _amount: number, hits = 1): void {
    if (ctx.flags[HEAD_PHASE] !== 'B') return;
    setMem(ctx.self, 'hangeki', mem(ctx.self, 'hangeki') + hits);
  },
};
