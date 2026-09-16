/**
 * Vegnagun — Head plus the two Redoubts (battle 4)
 * [ffx2-vegnagun-shuyin §4.2, §5.4].
 *
 * This battle carries **the cannon fail clock**, and the clock is not a timer
 * in the data — it is a counter of **Shuyin's seven speech events**:
 *
 * | # | When | Effect |
 * |---|---|---|
 * | 1 | battle start | Head does nothing that turn |
 * | 2 | Phase B entry | Head + both Redoubts **begin counting turns** |
 * | 3–6 | every `LINE_INTERVAL` combined enemy turns | Head does nothing |
 * | 7 | `FIRE_AT_TURN` | **Game Over, bad ending** |
 *
 * Three rules that are easy to get wrong:
 * - **The clock does not start until Phase B.** Phase A is a dead end anyway —
 *   the Head is untargetable and does nothing while either Redoubt lives — so
 *   putting a player who stalls in Phase A on the clock is both unfaithful and
 *   the frustrating option.
 * - **Never draw a number.** The original hides the remaining time; the seven
 *   lines *are* the UI (§4.2.3).
 * - `head.hp <= 0` must resolve **before** the turn-count hook, so a killing
 *   blow landing in the same frame as the seventh line wins.
 *
 * The constants live in `AbilityDef.extra.failTimer` on Acta Est Fabula — the
 * Phase B transition action — per `docs/CONTRACTS.md`: genuinely one-off
 * scripted rules go in `extra`, not on an ad-hoc `AbilityDef` boolean.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { HEAD_FIRE_AT_TURN, HEAD_LINE_INTERVAL } from '../constants.ts';

const REDOUBT_R = 'redoubt-r';
const REDOUBT_L = 'redoubt-l';

/** HP fractions that force Nemo Ante Mortem Beatus on the way down. §5.4 */
const HP_THRESHOLDS = [0.8, 0.6, 0.4, 0.2];
const ODI_ET_AMO_HITS_TAKEN = 15;

function redoubts(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.id === REDOUBT_R || u.id === REDOUBT_L);
}

/** True once both Redoubts have been downed at least once — the Phase B gate. */
function inPhaseB(ctx: AiContext): boolean {
  return ctx.flags['headPhase'] === 'B';
}

/** Timer settings, read from the ability's `extra` so data can retune them. */
function timerSettings(ctx: AiContext): { fireAtTurn: number; lineInterval: number } {
  const extra = ctx.ability('acta-est-fabula')?.extra?.['failTimer'];
  if (extra && typeof extra === 'object') {
    const t = extra as { fireAtTurn?: number; lineInterval?: number };
    return {
      fireAtTurn: t.fireAtTurn ?? HEAD_FIRE_AT_TURN,
      lineInterval: t.lineInterval ?? HEAD_LINE_INTERVAL,
    };
  }
  return { fireAtTurn: HEAD_FIRE_AT_TURN, lineInterval: HEAD_LINE_INTERVAL };
}

/** `Action1` from §5.4, in the source's own branch order. */
function headAction1(ctx: AiContext): Command {
  const self = ctx.self;
  const pods = redoubts(ctx);
  if (pods.length > 0 && pods.every((p) => !p.alive)) {
    return { kind: 'ability', id: 'acta-est-fabula', targets: pods.map((p) => p.id) };
  }

  const fraction = self.hp / Math.max(1, self.stats.maxHp);
  const crossed = mem(self, 'thresholdsCrossed');
  const next = HP_THRESHOLDS[crossed];
  if (next !== undefined && fraction <= next) {
    setMem(self, 'thresholdsCrossed', crossed + 1);
    return { kind: 'ability', id: 'nemo-ante-mortem-beatus', targets: [] };
  }

  if (mem(self, 'hitsTaken') >= ODI_ET_AMO_HITS_TAKEN) {
    setMem(self, 'hitsTaken', 0);
    return { kind: 'ability', id: 'odi-et-amo', targets: [] };
  }
  return { kind: 'ability', id: 'mors-certa', targets: [] };
}

export const vegnagunHeadScript: AiScript = {
  id: 'vegnagun-head',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    const s = mem(self, 'step');
    setMem(self, 'step', s + 1);

    if (!inPhaseB(ctx)) {
      // --- PHASE A ---------------------------------------------------------
      self.flags.untargetable = true;
      if (s === 0) {
        ctx.emit({ type: 'script-trigger', name: 'shuyin-line-1', payload: { line: 1 } });
        return null;
      }
      const pods = redoubts(ctx);
      const everyPodDowned = pods.length > 0 && pods.some((p) => !p.alive);
      if (everyPodDowned) {
        // The Redoubts have been downed once: enter Phase B on the next turn.
        ctx.flags['headPhase'] = 'B';
        setMem(self, 'step', 0);
        return null;
      }
      return { kind: 'ability', id: 'pallida-mors', targets: [] };
    }

    // --- PHASE B -----------------------------------------------------------
    if (s === 0) {
      self.flags.untargetable = false;
      ctx.flags['headTurns'] = 0;
      const pods = redoubts(ctx);
      return { kind: 'ability', id: 'acta-est-fabula', targets: pods.map((p) => p.id) };
    }
    if (s === 1) {
      ctx.emit({ type: 'script-trigger', name: 'shuyin-line-2', payload: { line: 2 } });
      ctx.flags['headClockRunning'] = true;
      return null;
    }
    if (s === 3) {
      ctx.emit({ type: 'script-trigger', name: 'jecht-no-overtime', payload: {} });
      return null;
    }
    // A line slot swallows the Head's turn entirely. §4.2.1
    if (ctx.flags['headLinePending'] === true) {
      ctx.flags['headLinePending'] = false;
      return null;
    }
    return headAction1(ctx);
  },

  /**
   * The fail clock. Counts **every** resolved turn of the Head and both
   * Redoubts, and only in Phase B. `head.hp <= 0` is checked first so a
   * killing blow in the same frame as line 7 wins.
   */
  onTurnResolved(ctx: AiContext, actor: Ffx2Unit): void {
    if (!ctx.flags['headClockRunning']) return;
    if (!ctx.self.alive) return;
    if (actor.id !== ctx.self.id && actor.id !== REDOUBT_R && actor.id !== REDOUBT_L) return;

    const { fireAtTurn, lineInterval } = timerSettings(ctx);
    const turns = (typeof ctx.flags['headTurns'] === 'number' ? ctx.flags['headTurns'] : 0) + 1;
    ctx.flags['headTurns'] = turns;

    if (turns === Math.floor(fireAtTurn / 2)) {
      ctx.emit({ type: 'script-trigger', name: 'auron-halfway', payload: { turns } });
    }
    if (turns >= fireAtTurn) {
      ctx.emit({ type: 'script-trigger', name: 'shuyin-line-7', payload: { line: 7 } });
      ctx.flags['badEnding'] = true;
      return;
    }
    if (turns % lineInterval === 0) {
      const line = 3 + turns / lineInterval - 1;
      ctx.emit({ type: 'script-trigger', name: `shuyin-line-${line}`, payload: { line } });
      ctx.flags['headLinePending'] = true;
    }
  },

  onDamaged(ctx: AiContext): void {
    setMem(ctx.self, 'hitsTaken', mem(ctx.self, 'hitsTaken') + 1);
  },
};

/**
 * Redoubts. Before Acta Est Fabula has touched it a Redoubt only revives its
 * twin; afterwards it runs a four-step rotation. Right is armoured against
 * physicals with **zero** magic defense and Left is the exact inverse, so the
 * intended play is to kill Right with magic and Left with physicals. §3.4
 */
function redoubtScript(id: string, isRight: boolean): AiScript {
  const twin = isRight ? REDOUBT_L : REDOUBT_R;
  const rotation = isRight
    ? ['lacrimosa-r', 'blind', 'flare', 'leg-break']
    : ['lacrimosa-l', 'leg-slow', 'dispel', 'demi'];

  return {
    id,
    decide(ctx: AiContext): Command | null {
      const other = ctx.units.find((u) => u.id === twin);
      if (ctx.flags['headPhase'] !== 'B') {
        if (other && !other.alive) return { kind: 'ability', id: 'full-life', targets: [other.id] };
        return null;
      }
      if (other && !other.alive) {
        const steps = mem(ctx.self, 'sinceRevive');
        if (steps >= 2) {
          setMem(ctx.self, 'sinceRevive', 0);
          return { kind: 'ability', id: 'full-life', targets: [other.id] };
        }
        setMem(ctx.self, 'sinceRevive', steps + 1);
      }
      const s = mem(ctx.self, 'step');
      setMem(ctx.self, 'step', s + 1);
      const abilityId = rotation[s % rotation.length] ?? rotation[0] ?? 'lacrimosa-r';
      const party = ctx.party();
      if (party.length === 0) return null;
      const single = abilityId !== 'demi';
      return { kind: 'ability', id: abilityId, targets: single ? [ctx.rng.pick(party).id] : [] };
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
};
