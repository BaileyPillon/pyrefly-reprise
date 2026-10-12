/**
 * Vegnagun — Body / Core plus the two Bulwarks (link 3)
 * [research/re-ffx2-ai-bahamut-vegnagun.md section 5; re-parity AI lane FFX-2 a]. **FFX-2 only.**
 * The decision tables of the game's own scripts (`m287`, `m288`, `m289`), in our words.
 *
 * **The Core** tests in this order and the first that applies ends the poll:
 *
 * | # | Condition | Poll |
 * |---|---|---|
 * | 1 | its first poll | a voice line (no action) |
 * | 2 | a girl has hit a Bulwark, once | a voice line |
 * | 3 | the Bulwarks have answered 4 times | three voice lines on three polls; then the count is forced to 8 and the poll goes on |
 * | 4 | it has fired Memento Mori 3 times | two voice lines on two polls; then the count is forced to 8 and the poll goes on |
 * | 5 | energy 3 | shot count +1, energy 0, Memento Mori on the party |
 * | 6 | the Right Bulwark is dead | Full-Life on it |
 * | 7 | the Left Bulwark is dead | Full-Life on it |
 * | 8 | otherwise | energy +1, Charge Core |
 *
 * So with both Bulwarks up the Core's cycle is Charge, Charge, Charge, Memento Mori; a revive replaces a charge (energy stays)
 * and cannot replace the shot. The seven voice polls are extra turns in which it does nothing (row C1); their lines have no
 * text in our story scripts, so they play silent.
 *
 * **The Core's log (row C4).** Every hostile action a girl aims at it records who and what kind: the kind is the action's
 * damage type bits, physical only, magical only, or anything else (both, neither: items, Darkness, the percent and Overdrive
 * moves). The last one wins.
 *
 * **A Bulwark** first picks its single target (the girl in the log if she is alive, else a uniform living girl; the log's "who" is
 * spent whatever happens), then acts on the log's kind: nothing logged, an idle spell; physical, Physical attack detected on the whole
 * party; magical, Magical attack detected on the whole party; other, Hostile activity detected on the picked target (rows C2, C3).
 * Each answer adds 1 to the answers count and spends the log, so one Bulwark answers a strike. The idle spells: the Right casts
 * Shell (25 %), Protect (25 %) or Regen (50 %) on a uniform living monster; the Left casts Break, Doom, Bio or Dispel (25 % each)
 * on a uniform living girl, one target each.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { speakTurn } from './idle.ts';
import { CORE_CHARGES_BEFORE_MEMENTO } from '../constants.ts';
import { resolveCommand } from '../adapt/command.ts';
import { abilityPerformedBy } from '../execute.ts';
import { scriptMod, searchUniform } from './script-rolls.ts';

const BULWARK_R = 'bulwark-r';
const BULWARK_L = 'bulwark-l';

/** The Core's one-slot attack log, parked on the shared encounter flags. */
const LOG_WHO = 'coreLogWho';
const LOG_CLASS = 'coreLogClass';
/** The Bulwarks' shared counters: a girl has hit one (`bf_halu_00`), and how many answers they have given (`bf_halu_02`). */
const BULWARK_HIT = 'coreBulwarkHit';
const ANSWERS = 'coreAnswers';

/** How a girl's action is answered: the damage type bits of the command. §3.3 */
export type MitigationClass = 'protect-reducible' | 'shell-reducible' | 'none';

/** The command row's damage bits (`flagsDamage & 3`): 1 physical only, 2 magical only, anything else (both, neither) is the third kind. */
export function classifyDamageBits(flagsDamage: number): MitigationClass {
  const bits = flagsDamage & 3;
  if (bits === 1) return 'protect-reducible';
  if (bits === 2) return 'shell-reducible';
  return 'none';
}

function findUnit(ctx: AiContext, id: string): Ffx2Unit | undefined {
  return ctx.units.find((u) => u.id === id);
}

/** What kind of command the girl's last action was, by the row it ran on; an action without a row counts as the third kind. */
function logClassOf(ctx: AiContext, attackerId: string): MitigationClass {
  const attacker = findUnit(ctx, attackerId);
  const abilityId = attacker ? abilityPerformedBy(attacker) : undefined;
  const ability = abilityId ? ctx.ability(abilityId) : undefined;
  if (!attacker || !ability) return 'none';
  return classifyDamageBits(resolveCommand(ability, attacker, 0).record.flagsDamage);
}

/** The Core's voice polls: true when this poll is a voice line (the line has no text in our story scripts yet, so the turn passes in silence). */
function coreVoices(ctx: AiContext): boolean {
  const self = ctx.self;
  if (mem(self, 'voice') === 0) {
    setMem(self, 'voice', 1);
    return true;
  }
  if (mem(self, 'voiceHit') === 0 && ctx.flags[BULWARK_HIT] === 1) {
    setMem(self, 'voiceHit', 1);
    return true;
  }
  const answers = ctx.flags[ANSWERS];
  if (typeof answers === 'number' && answers >= 4) {
    const stage = mem(self, 'voiceAnswers');
    if (stage < 3) {
      setMem(self, 'voiceAnswers', stage + 1);
      return true;
    }
    ctx.flags[ANSWERS] = 8;
  }
  if (mem(self, 'shots') >= 3) {
    const stage = mem(self, 'voiceShots');
    if (stage < 2) {
      setMem(self, 'voiceShots', stage + 1);
      return true;
    }
    setMem(self, 'shots', 8);
  }
  return false;
}

export const vegnagunBodyScript: AiScript = {
  id: 'vegnagun-body',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    if (coreVoices(ctx)) return speakTurn(self);

    const charges = mem(self, 'actionCount');
    if (charges >= CORE_CHARGES_BEFORE_MEMENTO) {
      setMem(self, 'shots', mem(self, 'shots') + 1);
      setMem(self, 'actionCount', 0);
      ctx.emit({ type: 'charge', enemyId: self.id, name: 'Memento Mori', turnsLeft: 0, stage: 2 });
      return { kind: 'ability', id: 'memento-mori', targets: [] };
    }

    // A downed Bulwark costs the Core its charge turn: the Right first, then the Left. §4.1
    const right = findUnit(ctx, BULWARK_R);
    const left = findUnit(ctx, BULWARK_L);
    if (right && !right.alive) return { kind: 'ability', id: 'full-life', targets: [right.id] };
    if (left && !left.alive) return { kind: 'ability', id: 'full-life', targets: [left.id] };

    setMem(self, 'actionCount', charges + 1);
    const turnsLeft = CORE_CHARGES_BEFORE_MEMENTO - (charges + 1);
    ctx.emit({
      type: 'charge',
      enemyId: self.id,
      name: 'Charge Core',
      turnsLeft,
      stage: turnsLeft <= 1 ? 2 : 1,
    });
    return { kind: 'ability', id: 'charge-core', targets: [] };
  },

  /** Every hostile action a girl aims at the Core is logged for the Bulwarks to answer: who, and what kind. Last one wins. */
  onTargeted(ctx: AiContext, sourceId): void {
    const attacker = findUnit(ctx, sourceId);
    if (!attacker || attacker.side !== 'party') return;
    ctx.flags[LOG_WHO] = sourceId;
    ctx.flags[LOG_CLASS] = logClassOf(ctx, sourceId);
  },
};

/** Any result a girl puts on a Bulwark is noted for the Core's voice. */
function noteBulwarkHit(ctx: AiContext, sourceId: string): void {
  const attacker = findUnit(ctx, sourceId);
  if (!attacker || attacker.side !== 'party') return;
  ctx.flags[BULWARK_HIT] = 1;
}

/** The monsters a Right Bulwark's idle spell can reach: every living, targetable monster of the link, itself included. */
function monsters(ctx: AiContext): Ffx2Unit[] {
  return ctx.units.filter((u) => u.side === 'enemy' && u.alive && !u.removed && !u.flags.untargetable);
}

function idleSpell(ctx: AiContext, isRight: boolean): Command | null {
  const roll = scriptMod(ctx.rng, 4);
  if (isRight) {
    const id = roll === 0 ? 'node-shell' : roll === 1 ? 'node-protect' : 'node-regen';
    const target = searchUniform(ctx.rng, monsters(ctx));
    return target ? { kind: 'ability', id, targets: [target.id] } : null;
  }
  const id = (['leg-break', 'bulwark-doom', 'bulwark-bio', 'dispel'] as const)[roll] ?? 'dispel';
  const target = searchUniform(ctx.rng, ctx.party());
  return target ? { kind: 'ability', id, targets: [target.id] } : null;
}

function bulwarkScript(id: string, isRight: boolean): AiScript {
  return {
    id,
    decide(ctx: AiContext): Command | null {
      // The single target is picked first, on every poll: the logged girl if she is up, else a uniform living girl.
      const who = ctx.flags[LOG_WHO];
      let target: Ffx2Unit | undefined;
      if (typeof who === 'string') {
        target = ctx.party().find((p) => p.id === who) ?? searchUniform(ctx.rng, ctx.party());
        delete ctx.flags[LOG_WHO];
      } else {
        target = searchUniform(ctx.rng, ctx.party());
      }

      const kind = ctx.flags[LOG_CLASS];
      if (typeof kind !== 'string') return idleSpell(ctx, isRight);
      delete ctx.flags[LOG_CLASS];
      const answers = ctx.flags[ANSWERS];
      ctx.flags[ANSWERS] = (typeof answers === 'number' ? answers : 0) + 1;

      if (kind === 'protect-reducible') return { kind: 'ability', id: 'physical-attack-detected', targets: [] };
      if (kind === 'shell-reducible') return { kind: 'ability', id: 'magical-attack-detected', targets: [] };
      return target ? { kind: 'ability', id: 'hostile-activity-detected', targets: [target.id] } : null;
    },
    onTargeted(ctx: AiContext, sourceId): void {
      noteBulwarkHit(ctx, sourceId);
    },
  };
}

export const vegnagunBulwarkRightScript = bulwarkScript('vegnagun-bulwark-r', true);
export const vegnagunBulwarkLeftScript = bulwarkScript('vegnagun-bulwark-l', false);

/** The data file ships one shared `aiScriptId`; slot decides which arm it is. */
export const vegnagunBulwarkScript: AiScript = {
  id: 'vegnagun-bulwark',
  decide(ctx: AiContext): Command | null {
    const isRight = ctx.self.id === BULWARK_R || ctx.self.slot % 2 === 1;
    return (isRight ? vegnagunBulwarkRightScript : vegnagunBulwarkLeftScript).decide(ctx);
  },
  onTargeted(ctx: AiContext, sourceId): void {
    noteBulwarkHit(ctx, sourceId);
  },
};
