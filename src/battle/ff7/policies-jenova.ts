/**
 * The scripted players for the Jenova LIFE bench (hidden chapter 44) and the counts the bench reads off a log.
 *
 * Like `simulate.ts#FF7_POLICIES` these model players and are **ours, not game data**: no number in them is FF7's, and
 * every threshold is labelled as our choice (`research/ff7-jenova-life.md` §10; `docs/plans/ch-jenova-life-review.md` §8,
 * whose bands were fixed before the first run). Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 *
 * - **sensible**: revive a KO'd ally; heal the most hurt ally under 45% (Cure2 if the actor has it and the MP, else a
 *   Hi-Potion); use the Limit when full; otherwise Attack. **Never casts into a standing Reflect** (it never casts an
 *   attack spell at all). `sensibleQuake` adds Cloud's free opener: Quake2 on the weakness until her Reflect is up.
 * - **distracted** ("a party playing badly", the note's wording): half the turns Attack (or the Limit), three in ten a
 *   Magic attack whatever her Reflect says, two in ten Defend; it heals only under 25%; it still raises the fallen.
 * - **spamMagic**: every member casts its best attack spell it can afford at 28 MP or less every turn, otherwise Attacks;
 *   it never heals. It loses by arithmetic (the bounces kill the caster): the lesson, reported and not gated.
 */

import { SeededRng } from '../common/rng.ts';
import type { AvailableCommand, BattleEvent, BattleState, Command, Ff7Combatant } from '../common/types.ts';
import { hasStatus } from './statuses.ts';
import type { Ff7Policy, Ff7PolicyView, Ff7Run } from './simulate.ts';

const BOSS = 'jenova-life';
/** Our heal thresholds (share of Max HP): the sensible player at 45%, the distracted one at 25%. */
const SENSIBLE_HEAL = 0.45;
const DISTRACTED_HEAL = 0.25;
/** The costliest attack spell the scripted players cast on their own: the second tier (Quake2 is 28 MP). */
const SPELL_MP_CAP = 28;
/** Attack spells by id, strongest tier first within a family. */
const ATTACK_SPELLS: readonly string[] = ['bolt3', 'ice3', 'fire3', 'quake3', 'quake2', 'bolt2', 'ice2', 'fire2', 'bolt', 'ice', 'fire', 'quake'];

function party(state: Readonly<BattleState>): Ff7Combatant[] {
  return state.activeIds.map((id) => state.combatants[id] as Ff7Combatant);
}

function boss(state: Readonly<BattleState>): Ff7Combatant | undefined {
  return state.enemyIds.map((id) => state.combatants[id] as Ff7Combatant).find((c) => c.alive);
}

function reflected(state: Readonly<BattleState>): boolean {
  const b = boss(state);
  return !!b && hasStatus(b, 'reflect');
}

const find = (view: Ff7PolicyView, pick: (r: AvailableCommand) => boolean): AvailableCommand | undefined => view.commands.find((r) => r.enabled && pick(r));
const isKind = (kind: Command['kind'], id?: string) => (r: AvailableCommand): boolean =>
  r.command.kind === kind && (id === undefined || ('id' in r.command && r.command.id === id));

function aim(row: AvailableCommand, target?: string): Command {
  const t = target ?? row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

/** Attack, or the Limit in its place when full. */
function strike(view: Ff7PolicyView): Command {
  const row = find(view, isKind('limit')) ?? find(view, isKind('attack'));
  return row ? aim(row, boss(view.state)?.id) : { kind: 'defend', targets: [] };
}

/** Phoenix Down on a KO'd ally when one is carried. */
function raise(view: Ff7PolicyView): Command | null {
  const row = find(view, isKind('item', 'phoenix-down'));
  const down = party(view.state).find((c) => !c.alive);
  return row && down ? aim(row, down.id) : null;
}

/** Heal the most hurt ally under `share` of Max HP: Cure2 first when the actor can, else a Hi-Potion, else a Potion. */
function heal(view: Ff7PolicyView, share: number): Command | null {
  const hurt = party(view.state)
    .filter((c) => c.alive && c.hp < c.stats.maxHp * share)
    .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  if (!hurt) return null;
  const row = find(view, isKind('ability', 'cure2')) ?? find(view, isKind('item', 'hi-potion')) ?? find(view, isKind('item', 'potion'));
  return row ? aim(row, hurt.id) : null;
}

/** The best attack spell the actor can cast now at `SPELL_MP_CAP` MP or less, or null. */
function bestSpell(view: Ff7PolicyView): AvailableCommand | null {
  for (const id of ATTACK_SPELLS) {
    const row = find(view, isKind('ability', id));
    if (row && row.mpCost <= SPELL_MP_CAP) return row;
  }
  return null;
}

export const jenovaSensiblePolicy: Ff7Policy = (view) => raise(view) ?? heal(view, SENSIBLE_HEAL) ?? strike(view);

/** Sensible, with Cloud opening on the weakness: Quake2 (or Quake) until her Reflect is up. */
export const sensibleQuakePolicy: Ff7Policy = (view) => {
  const fix = raise(view) ?? heal(view, SENSIBLE_HEAL);
  if (fix) return fix;
  if (view.actorId === 'cloud' && !reflected(view.state) && !find(view, isKind('limit'))) {
    const quake = find(view, isKind('ability', 'quake2')) ?? find(view, isKind('ability', 'quake'));
    if (quake) return aim(quake, boss(view.state)?.id);
  }
  return strike(view);
};

/** Attack-only: Attack (or the Limit when full) every turn and never a heal, an item or a spell: the first e2e player (`tests/e2e/support/ff7-play.ts` 'naive') and the floor of the bench. Reported, not gated. */
export const attackOnlyPolicy: Ff7Policy = (view) => strike(view);

/** Spam-magic: the best affordable attack spell every turn, into the Reflect. */
export const spamMagicPolicy: Ff7Policy = (view) => {
  const row = bestSpell(view);
  return row ? aim(row, boss(view.state)?.id) : strike(view);
};

/** A distracted player; the dice are seeded so a run replays (`seed` is the battle's, offset so it never shares its stream). */
export function distractedPolicy(seed: number): Ff7Policy {
  const rng = new SeededRng(seed * 7919 + 17);
  return (view) => {
    const fix = raise(view) ?? heal(view, DISTRACTED_HEAL);
    if (fix) return fix;
    const roll = rng.int(0, 9); // 0..4 Attack, 5..7 Magic, 8..9 Defend
    if (roll >= 8) return { kind: 'defend', targets: [] };
    if (roll >= 5) {
      const row = bestSpell(view);
      if (row) return aim(row, boss(view.state)?.id);
    }
    return strike(view);
  };
}

/** Everything the bench counts in one battle's log. */
export interface JenovaRunSummary {
  outcome: Ff7Run['result']['outcome'];
  turns: number;
  partyTurns: number;
  bossTurns: number;
  ticks: number;
  blueLights: number;
  /** Blue Light uses beyond the first of a turn: the double. */
  doubleBlueLights: number;
  blueFlames: number;
  aqualungs: number;
  reflectsCast: number;
  /** Hits a party spell turned back onto its own caster. */
  reflectedCasts: number;
  /** HP the bounced spells took from the party. */
  reflectedDamage: number;
  limitsUsed: number;
  kos: number;
  /** Jenova's MP when the battle ended. */
  mpLeft: number;
  /** HP the party has left (the living) when the battle ended. */
  hpLeft: number;
}

/** Count what happened in one run's log. */
export function summarizeJenovaRun(run: Ff7Run): JenovaRunSummary {
  const s: JenovaRunSummary = {
    outcome: run.result.outcome, turns: run.result.turns, partyTurns: 0, bossTurns: 0, ticks: run.result.elapsedTicks,
    blueLights: 0, doubleBlueLights: 0, blueFlames: 0, aqualungs: 0, reflectsCast: 0, reflectedCasts: 0, reflectedDamage: 0,
    limitsUsed: 0, kos: 0, mpLeft: (run.state.combatants[BOSS] as Ff7Combatant | undefined)?.mp ?? 0,
    hpLeft: party(run.state).reduce((n, c) => n + (c.alive ? c.hp : 0), 0),
  };
  let actor: string | null = null;
  let usesThisTurn = 0;
  const partyIds = new Set(run.state.activeIds);
  for (const e of run.log as readonly BattleEvent[]) {
    if (e.type === 'turn-start') {
      if (run.state.enemyIds.includes(e.actorId)) s.bossTurns++;
      else s.partyTurns++;
      usesThisTurn = 0;
    } else if (e.type === 'action-start') {
      actor = e.actorId;
      if (e.command.kind === 'limit') s.limitsUsed++;
      if (e.abilityId === 'blue-light') {
        s.blueLights++;
        if (++usesThisTurn > 1) s.doubleBlueLights++;
      } else if (e.abilityId === 'blue-flame') s.blueFlames++;
      else if (e.abilityId === 'aqualung') s.aqualungs++;
    } else if (e.type === 'counter' && e.abilityId === 'jenova-reflect') {
      s.reflectsCast++;
    } else if (e.type === 'action-end') {
      actor = null;
    } else if (e.type === 'damage' && actor !== null && partyIds.has(actor) && partyIds.has(e.targetId) && e.sourceId === BOSS && e.amount > 0) {
      s.reflectedCasts++;
      s.reflectedDamage += e.amount;
    } else if (e.type === 'ko' && partyIds.has(e.targetId)) {
      s.kos++;
    }
  }
  return s;
}
