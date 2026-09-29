/**
 * **PR-0245 (critic round 16): the advisor never ranks a revive on a foe or on a living ally.**
 *
 * Chapter VII (FFX) leaves a KO'd Guado Guardian on the field, not removed, and the engine lists
 * it among Phoenix Down's legal targets. The card read "Phoenix Down -> Guado Guardian A" for 16
 * turns in a row on the phone route (which cannot throw the Petrify Grenade, so the Guardians die
 * by the sword); the reticle could not reach the foe and Enter spent the Down on a full-HP Yuna.
 *
 * The cause, found by running: `scoreOutcome` priced every entry of `outcome.revives` with
 * `reviveValue`, enemies included, and `aimCandidates` aimed a revive at the first KO'd valid
 * target, which was the Guardian. Now a raised foe costs a boss kill, the aim skips foes and the
 * living, and the card's gate drops any wasted revive whichever source aimed it
 * (`advisor-guard.ts#wastedRevive`).
 *
 * Game case: **both** (shared advisor code). The FFX-2 chapters are swept too; FFX-2 defines no
 * Zombie, so the one exception (a raise on a living Zombie foe is a kill) never applies there.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState, Command, CombatantId } from '../../src/battle/common/types.ts';
import { harnessFor, fallback } from '../../critic/bench/advisor-v2/harness.ts';
import { buildAdvisorView, clearAdvisorCache, type MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { wastedRevive } from '../../src/engine/tactics/advisor-guard.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

const REVIVES = /Phoenix|Life|Mega Phoenix|Raise/i;

/** A row that names a revive and aims it at a foe, or at a living ally. */
function badRevive(state: Readonly<BattleState>, s: MoveSuggestion): string | null {
  if (!REVIVES.test(s.label)) return null;
  const targets = ((s.command.targets ?? []) as CombatantId[]).length > 0 ? (s.command.targets as CombatantId[]) : s.targetId ? [s.targetId] : [];
  for (const id of targets) {
    const c = state.combatants[id];
    if (!c) continue;
    if (c.side === 'enemy' && !(c.alive && c.statuses['zombie'])) return `${s.label} -> ${c.name} (foe, hp ${c.hp})`;
  }
  if (targets.length > 0 && targets.every((id) => state.combatants[id]?.alive && state.combatants[id]?.side !== 'enemy')) {
    return `${s.label} -> ${targets.join(',')} (living ally)`;
  }
  return null;
}

/** Follow the card; when it says Petrify Grenade, swing at a Guardian instead (the phone route of round 16). */
function playChapterVII(seed: number, v3: boolean): { bad: string[]; koBoards: number } {
  clearAdvisorCache();
  const { engine, options } = harnessFor('seymour-anima-macalania', seed);
  const bad: string[] = [];
  let koBoards = 0;
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    const state = engine.state();
    if (state.turn > 90) break;
    const guardians = ['guado-guardian-a', 'guado-guardian-b'].map((id) => state.combatants[id]);
    if (guardians.some((g) => g && !g.alive && !g.removed)) koBoards++;
    const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, { ...options, planner: true, v3 });
    for (const s of view?.suggestions ?? []) {
      const why = badRevive(state, s);
      if (why) bad.push(`seed ${seed} turn ${state.turn} ${d.actorId}: ${why}`);
    }
    const top = view?.suggestions[0];
    const atk = d.commands.find((c) => c.enabled && c.label === 'Attack');
    if (top && /Petrify/.test(top.label) && atk) {
      const g = atk.validTargets.find((id) => id.startsWith('guado-guardian')) ?? atk.validTargets[0]!;
      engine.submit({ ...atk.command, targets: [g] } as Command);
    } else {
      engine.submit(top?.command ?? fallback(d.commands) ?? ({ kind: 'defend', targets: [] } as Command));
    }
  }
  return { bad, koBoards };
}

describe('PR-0245: Chapter VII, a KO\'d Guado Guardian on the field', () => {
  for (const v3 of [false, true]) {
    it(`over 40 seeds (v3 ${v3 ? 'on' : 'off'}), no card row names a revive on a foe or a living ally`, () => {
      const bad: string[] = [];
      let koBoards = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const r = playChapterVII(seed, v3);
        bad.push(...r.bad);
        koBoards += r.koBoards;
      }
      expect(koBoards, 'the sweep must reach the KO\'d-Guardian board').toBeGreaterThan(100);
      expect(bad).toEqual([]);
    }, 240_000);
  }
});

describe('PR-0245: every chapter, following the card', () => {
  const ids = CHAPTERS.filter((c) => c.game === 'ffx' || c.game === 'ffx2').map((c) => c.id);
  it.each(ids)('%s: no card row names a revive on a foe or a living ally', (id) => {
    const bad: string[] = [];
    for (const seed of [1, 2]) {
      clearAdvisorCache();
      const { engine, options } = harnessFor(id, seed);
      let cards = 0;
      for (let i = 0; i < 20_000 && cards < 60; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') {
          engine.tick?.(100);
          continue;
        }
        const state = engine.state();
        const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, { ...options, planner: true });
        cards++;
        for (const s of view?.suggestions ?? []) {
          const why = badRevive(state, s);
          if (why) bad.push(`seed ${seed} turn ${state.turn}: ${why}`);
        }
        engine.submit(view?.suggestions[0]?.command ?? fallback(d.commands) ?? ({ kind: 'defend', targets: [] } as Command));
      }
    }
    expect(bad).toEqual([]);
  }, 120_000);
});

describe('wastedRevive', () => {
  const board = {
    combatants: {
      tidus: { id: 'tidus', side: 'party', alive: true, hp: 900, statuses: {} },
      yuna: { id: 'yuna', side: 'party', alive: false, hp: 0, statuses: { ko: {} } },
      ga: { id: 'ga', side: 'enemy', alive: false, hp: 0, statuses: { ko: {} } },
      zf: { id: 'zf', side: 'enemy', alive: true, hp: 500, statuses: { zombie: {} } },
      boss: { id: 'boss', side: 'enemy', alive: true, hp: 500, statuses: {} },
    },
  } as unknown as BattleState;
  const pd = (targets: string[]): Command => ({ kind: 'item', id: 'phoenix-down', targets } as unknown as Command);
  it('a KO\'d ally is the only revive aim; a Zombie foe may be killed with one', () => {
    expect(wastedRevive(board, pd(['yuna']), true)).toBe(false);
    expect(wastedRevive(board, pd(['zf']), true)).toBe(false);
    expect(wastedRevive(board, pd(['ga']), true)).toBe(true);
    expect(wastedRevive(board, pd(['tidus']), true)).toBe(true);
    expect(wastedRevive(board, pd(['boss']), true)).toBe(true);
    expect(wastedRevive(board, pd(['tidus', 'yuna']), true)).toBe(false); // a party-wide raise with one down
  });
  it('an outcome that raises a foe is wasted whatever aimed it', () => {
    const outcome = { revives: ['ga'] } as never;
    expect(wastedRevive(board, pd([]), false, outcome)).toBe(true);
  });
  it('a row that is not a revive is never judged', () => {
    expect(wastedRevive(board, pd(['tidus']), false)).toBe(false);
  });
});

