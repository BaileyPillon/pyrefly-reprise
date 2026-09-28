/**
 * **A lethal save, proved on the clock** (advisor v3, FFX-2 only).
 *
 * Bailey's 2026-09-21 rule is "saves-from-lethal first" (PR-0197): when the enemy's next move
 * kills a girl and a row on the menu keeps her alive, that row outranks the chapter's line. The
 * `saves-from-lethal` fact (`./advisor-eval.ts`) proves it by arithmetic on HP: it does not know
 * whether the row **lands before the hit**. FFX-2 is ATB: the row charges, the girls' commands
 * already in flight land in their own time, and the enemy moves on its own clock
 * [research/ffx2-combat-core.md §1.1, §1.3]. So the arithmetic both over-claims (a heal that lands
 * after the hit saves nobody) and cannot tell the chapter's line to step aside when it should.
 *
 * Measured (adversarial check FM4, docs/handoff/advisor-v3.md REPAIR; the fork probe presses the
 * top row and every saving row on 4 forks and runs to the enemy's hit): of v3's 187 arithmetic
 * "misses" on Chapters V, VI, XI and XV (40 seeds), the top row kept the girl alive as often as
 * any saving row in 170; in 6 a saving row the card ranked below the chapter's line kept her alive
 * in at least half the futures more (Vigor or Pray before an Attack, a Hi-Potion before Terror of
 * Zanarkand). With this rule: 2 of 183 (v2: 1 of 61 on its own path).
 *
 * {@link provedSave} runs that test inside the card: when the forecast names a girl the enemy
 * kills and some row other than the top one carries the fact (the top row may carry it too: the
 * arithmetic does not know it lands in time), up to {@link MAX_SAVERS} of them and the top row are
 * **pressed on forks** of the live battle (`FFX2Engine.fork`, each
 * with its own fixed seed: {@link SEEDS}), the clock is run until the enemy's move against her
 * has resolved, and a saving row goes on top only when she lives in at least {@link MARGIN} more
 * of the futures than with the top row. Everything else stands as ranked.
 *
 * **Never the real battle** [AGENTS.md rule 1]: forks only, their own random streams, the live
 * engine only read. Bounded by counts, never by a clock, so the same board gets the same card.
 * **FFX-2 only** [rule 14]: FFX's CTB orders the turns exactly, and its forecast already says who
 * moves first [research/ffx-combat-core.md §1.1]; FFX boards have no engine to fork here.
 */

import type { BattleEvent, BattleState, CombatantId, Command } from '../../battle/common/types.ts';
import type { BoardFact } from './advisor-eval.ts';
import type { InFlightSource } from './advisor-inflight.ts';

/** The rows this reads: `advisor.ts`'s `Candidate`, structurally. */
export interface SaveRow {
  suggestion: { command: Command };
  facts: readonly BoardFact[];
}

/** Futures sampled per row (fixed seeds: the same board always gets the same answer). */
const SEEDS = [0x5afe_0001, 0x5afe_0002, 0x5afe_0003, 0x5afe_0004] as const;
/** How many more of the futures a saving row must keep her alive in than the top row. */
const MARGIN = 0.5;
/** The most saving rows pressed per decision. */
export const MAX_SAVERS = 3;
/** Clock steps per future (100 ms each): past 12 s the question is no longer "the next move". */
const STEP_MS = 100;
const MAX_STEPS = 120;
/** Enemy actions a future may watch before it stops (a harmless one can come first). */
const MAX_ENEMY_ACTIONS = 3;

/** Fraction of the sampled futures in which every threatened girl is standing after the hit. */
function lives(source: InFlightSource, actorId: CombatantId, command: Command, threatened: ReadonlySet<CombatantId>): number {
  let alive = 0;
  for (const seed of SEEDS) {
    const fork = source.fork(seed);
    fork.setAtbMode('active');
    fork.setMenuLevel('top');
    if (!fork.inputValid(actorId)) return -1;
    fork.submit(command);
    let enemyActions = 0;
    let struck = false;
    for (let step = 0; step < MAX_STEPS; step++) {
      const events: readonly BattleEvent[] = fork.tick(STEP_MS, { throughInput: true });
      const s = fork.state();
      let over = !!s.result;
      for (const e of events) {
        if (e.type === 'damage' && threatened.has(e.targetId) && e.sourceId !== undefined && s.combatants[e.sourceId]?.side === 'enemy') struck = true;
        if (e.type === 'ko' && threatened.has(e.targetId)) over = true;
        if (e.type === 'action-end' && s.combatants[e.actorId]?.side === 'enemy') {
          enemyActions += 1;
          if (struck || enemyActions >= MAX_ENEMY_ACTIONS) over = true;
        }
      }
      if (over) break;
    }
    const s = fork.state();
    if ([...threatened].every((id) => s.combatants[id]?.alive !== false)) alive += 1;
  }
  return alive / SEEDS.length;
}

/**
 * The saving row the forks prove, to go on top, or `null` (the ranking stands). `ordered` is the
 * card's ranking after every other rule; `excluded` rows (a Zombie ally hurt) are never promoted;
 * `factsOf` reads a row's facts (the card passes a re-evaluation against the real board's threat
 * when the enemy moves before what is in flight lands).
 */
export function provedSave<C extends SaveRow>(
  board: Readonly<BattleState>,
  actorId: CombatantId,
  source: InFlightSource | null,
  ordered: readonly C[],
  excluded: (c: C) => boolean = () => false,
  factsOf: (c: C) => readonly BoardFact[] = (c) => c.facts,
): C | null {
  const top = ordered[0];
  const saves = (c: C): boolean => factsOf(c).some((f) => f.kind === 'saves-from-lethal');
  if (!source || board.game !== 'ffx2' || !top) return null;
  // A top row that claims the save is tested too: the arithmetic does not know it lands in time.
  const savers = ordered.filter((c) => c !== top && saves(c) && !excluded(c)).slice(0, MAX_SAVERS);
  if (savers.length === 0) return null;
  if (source.state().nextSeq !== board.nextSeq) return null;
  const topCommand = top.suggestion.command;
  try {
    // The top row's rate, once per set of girls a saver speaks for.
    const baseFor = new Map<string, number>();
    let best: C | null = null;
    let bestGain = MARGIN;
    for (const c of savers) {
      const threatened = new Set<CombatantId>();
      for (const f of factsOf(c)) if (f.kind === 'saves-from-lethal' && f.targetId) threatened.add(f.targetId);
      if (threatened.size === 0) continue;
      const key = [...threatened].sort().join(',');
      let base = baseFor.get(key);
      if (base === undefined) {
        base = lives(source, actorId, topCommand, threatened);
        baseFor.set(key, base);
      }
      if (base < 0) return null;
      if (base >= 1) continue;
      const gain = lives(source, actorId, c.suggestion.command, threatened) - base;
      if (gain >= bestGain) {
        best = c;
        bestGain = gain + 1e-9;
      }
    }
    return best;
  } catch {
    return null; // a fork is never worth a card: the ranking stands
  }
}
