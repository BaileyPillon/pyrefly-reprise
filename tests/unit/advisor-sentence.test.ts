/**
 * **Every claim the card makes is re-derivable from the engine.**
 *
 * The v2 reason line is assembled from at most two {@link BoardFact}s, each
 * carrying the number that produced it and what proved it. This file takes the
 * facts a real decision produced, re-runs the same preview and the same
 * forecast, and checks the figures against the engine's own answers — so a
 * sentence that drifts from the board fails the build rather than reaching a
 * player.
 *
 * It also pins the three rules the sentence is not allowed to break:
 *
 *  * **silent rather than wrong** — no fact clears, no sentence;
 *  * **no over-claim** — a bare pre-action forecast reading may not be worded
 *    as something the action caused;
 *  * **no new paint** — the confidence word rides inside the sentence, because
 *    the advisor card has no approved target tile and a chip would be a new
 *    design decision Bailey has not seen [AGENTS.md rule 9].
 *
 * ## Which game
 *
 * **Both**, and the two **absences** are the point [AGENTS.md rule 14]: an
 * FFX-2 card never prints a CTB tempo claim (X-2 has no turn list to lose
 * position in), and neither game's card prints a term whose provider the host
 * did not supply.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { CHAPTER_IDS, harnessFor, MAX_STEPS } from '../../critic/bench/advisor-v2/harness.ts';
import { simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';
import { simulateFFX2Command } from '../../src/battle/ffx2/simulate.ts';
import { buildAdvisorView, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';
import type { BoardFact } from '../../src/engine/tactics/advisor-eval.ts';
import { citedFacts, overClaims, sentenceFor } from '../../src/engine/tactics/advisor-say.ts';

function preview(
  state: Parameters<typeof buildAdvisorView>[0],
  actorId: string,
  command: Command,
  options: AdvisorOptions,
): ReturnType<typeof simulateFFXCommand> {
  if (state.game === 'ffx2') {
    return simulateFFX2Command(state, actorId, command, {
      roll: 'mid',
      ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
      ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
    }) as ReturnType<typeof simulateFFXCommand>;
  }
  return simulateFFXCommand(state, actorId, command, {
    roll: 'mid',
    ...(options.ffxContent ? { content: options.ffxContent } : {}),
  });
}

describe('every figure the card prints is the engine\'s own', () => {
  for (const chapterId of CHAPTER_IDS) {
    it(`${chapterId}: the sim-sourced facts re-derive`, () => {
      const { engine, options } = harnessFor(chapterId, 3);
      let checked = 0;
      const wrong: string[] = [];
      for (let i = 0; i < MAX_STEPS && checked < 200; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const state = engine.state();
        const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, options);
        const top = view?.suggestions[0];
        if (top) {
          const facts = (top.facts ?? []) as readonly BoardFact[];
          const out = preview(state, d.actorId, top.command, options);
          for (const f of facts) {
            checked += 1;
            if (f.source !== 'sim') continue;
            if (f.kind === 'phase' && out && f.value !== out.damageToEnemies) {
              wrong.push(`${chapterId}: said ${f.value} damage, engine says ${out.damageToEnemies}`);
            }
            if (f.kind === 'kills' && out && !out.kills.includes(f.targetId ?? '')) {
              wrong.push(`${chapterId}: claimed a kill on ${f.targetId} the engine did not make`);
            }
            if ((f.kind === 'gamble' || f.kind === 'certain-status') && (f.value <= 0 || f.value > 100)) {
              wrong.push(`${chapterId}: ${f.kind} quoted ${f.value}%, which is not a percentage`);
            }
          }
          // Rule 2: no over-claim, on every decision of every chapter.
          expect(overClaims(top.reason, facts), `${chapterId}: ${top.reason}`).toBe(false);
          // Rule 3: no confidence chip — the word is in the sentence or nowhere.
          expect(top).not.toHaveProperty('confidence');
        }
        const chosen = top?.command ?? null;
        if (!chosen) break;
        engine.submit(chosen);
      }
      expect(checked, `${chapterId} produced facts to check`).toBeGreaterThan(0);
      expect(wrong).toEqual([]);
    }, 120_000);
  }
});

describe('the sentence is silent rather than wrong', () => {
  it('says nothing when nothing clears', () => {
    expect(sentenceFor([], 'certain')).toBe('');
    expect(sentenceFor([{ kind: 'phase', text: '3 damage', value: 3, source: 'sim' }], 'certain')).toBe('');
  });

  /**
   * Context may not lead. A raise aimed at a downed Yuna once came back as
   * *"Lance of Atrophy is worth about 755"* — correctly measured, and an answer
   * to a question nobody asked.
   */
  it('never leads with the enemy\'s own move', () => {
    const facts: BoardFact[] = [
      { kind: 'incoming', text: 'Lance of Atrophy is worth about 755', value: 755, source: 'forecast' },
    ];
    expect(sentenceFor(facts, 'certain')).toBe('');
    expect(citedFacts(facts)).toEqual([]);
  });

  it('names the long plan whenever it overrules it', () => {
    const facts: BoardFact[] = [
      { kind: 'saves-from-lethal', text: 'Yuna lives through Nova', value: 300, source: 'forecast', targetId: 'yuna' },
    ];
    const said = sentenceFor(facts, 'certain', 'Slow');
    expect(said).toContain('Yuna lives through Nova');
    expect(said).toContain('the long plan is still Slow');
  });

  it('says the word gamble only when the board turns on a draw', () => {
    const gamble: BoardFact[] = [
      { kind: 'gamble', text: 'slow on Yu Pagoda lands about 40 times in 100', value: 40, source: 'sim' },
    ];
    expect(sentenceFor(gamble, 'gamble')).toContain('a gamble');
    expect(sentenceFor(gamble, 'certain')).not.toContain('a gamble');
    const certain: BoardFact[] = [
      { kind: 'certain-status', text: 'it puts slow on Yu Pagoda', value: 100, source: 'sim' },
    ];
    expect(sentenceFor(certain, 'gamble')).not.toContain('a gamble');
  });
});

describe('no game prints the other game\'s term (rule 14 absence tests)', () => {
  /**
   * Tempo is FFX's — `predictTurnOrder` is on `FFXBattleEngine` — and it is
   * supplied by a host that has an engine to ask. No host supplies it here, so
   * no card in either game may cite it.
   */
  for (const chapterId of ['ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'seymour-flux'] as const) {
    it(`${chapterId}: no tempo claim without a provider`, () => {
      const { engine, options } = harnessFor(chapterId, 1);
      let decisions = 0;
      for (let i = 0; i < MAX_STEPS && decisions < 30; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        decisions += 1;
        const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, options);
        for (const s of view?.suggestions ?? []) {
          for (const f of (s.facts ?? []) as readonly BoardFact[]) {
            expect(f.kind, `${chapterId} cited tempo with no provider`).not.toBe('tempo');
            expect(f.source).not.toBe('turnOrder');
          }
          expect(s.reason).not.toMatch(/turn order|gauge/i);
        }
        const chosen = view?.suggestions[0]?.command ?? null;
        if (!chosen) break;
        engine.submit(chosen);
      }
      expect(decisions).toBeGreaterThan(5);
    }, 60_000);
  }
});
