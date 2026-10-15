/**
 * Biran and Yenke (the hidden FFX chapter): the fight **measured, never tuned** (D-410; hard rule: no boss number is moved to fit a result). 100 seeds a line on the real engine with the shipped build
 * (Kimahri alone, Chapter I's preset): the advisor's line (`engine/tactics/biran-yenke.ts`) against a naive line (the plain Attack on a living brother, no potion, no Lancet, no Rage).
 *
 * What is asserted is only that every fight reaches an outcome (none hangs, none stalls), that the advisor's line beats the naive one and is faster than the attack-and-potions line; the table is printed.
 * **What it shows (printed 2026-10-14): Chapter I's Kimahri wins every seed with the advisor line, and every seed with only the plain Attack and a potion under 45 percent (25 decisions against 16); with no
 * potion and no Rage he loses every seed.** The preset is Chapter I's Kimahri, minutes later than this fight, so he is stronger than the typical player's Kimahri at the gate, whom the walkthrough calls hard-pressed; the party's
 * numbers are an estimate and the brothers' stats follow Kimahri's own (`ai/biran-yenke-stats.ts`), so a weaker Kimahri meets weaker brothers. The numbers belong to the
 * game's own rows (`research/re-ffx-biran-yenke.md`) and to Kimahri's preset (`data/ffx/builds/kimahri-trial.ts`); if the preset moves, the table moves, and the handoff's copy of it is re-measured.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, Command } from '../../../src/battle/common/types.ts';
import { biranYenke } from '../../../src/engine/tactics/biran-yenke.ts';
import * as H from '../helpers/ronsoDrive.ts';

interface Run {
  outcome: string;
  inputs: number;
  learned: number;
  breaths: number;
}

function playOne(seed: number, choose: (input: H.Input, engine: BattleEngine) => Command | null): Run {
  const engine = H.newEngine(seed);
  let inputs = 0;
  for (let i = 0; i < 600; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      const learned = H.learned(H.log(engine)).length;
      const breaths = H.log(engine).filter((e) => e.type === 'action-start' && e.actorId === H.KIM && /breath/.test(e.abilityId ?? '')).length;
      return { outcome: d.result.outcome, inputs, learned, breaths };
    }
    if (d.kind !== 'player-input') continue;
    inputs++;
    engine.submit(choose(d, engine) ?? H.defend());
  }
  return { outcome: 'unfinished', inputs, learned: 0, breaths: 0 };
}

const advisor = (d: H.Input, e: BattleEngine): Command | null => biranYenke(H.KIM, d.commands, e);
const naive = (d: H.Input): Command | null => H.swing(d, H.BIRAN) ?? H.swing(d, H.YENKE);
/** The plain Attack with a potion under 45 percent: what a player does who ignores Lancet and the Rages. */
const attackAndHeal = (d: H.Input, e: BattleEngine): Command | null => {
  const k = H.actor(e, H.KIM);
  if (k.hp / k.stats.maxHp < 0.45) {
    const potion = ['X-Potion', 'Hi-Potion', 'Potion'].map((label) => d.commands.find((c) => c.enabled && c.label === label)).find((c) => c !== undefined);
    if (potion) return { ...potion.command, targets: [H.KIM] } as Command;
  }
  return naive(d);
};

function bench(choose: (input: H.Input, engine: BattleEngine) => Command | null, seeds = 100): { wins: number; losses: number; other: number; meanInputs: number; meanLearned: number } {
  const runs = Array.from({ length: seeds }, (_, i) => playOne(i + 1, choose));
  const mean = (f: (r: Run) => number): number => Math.round((runs.reduce((a, r) => a + f(r), 0) / runs.length) * 100) / 100;
  return {
    wins: runs.filter((r) => r.outcome === 'victory').length,
    losses: runs.filter((r) => r.outcome === 'defeat').length,
    other: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
    meanInputs: mean((r) => r.inputs),
    meanLearned: mean((r) => r.learned),
  };
}

describe('the fight, measured on the real engine (100 seeds a line, Kimahri alone, the shipped preset)', () => {
  it('every fight reaches an outcome, and the advisor line does better than the naive one', () => {
    const a = bench(advisor);
    const n = bench(naive);
    const h = bench(attackAndHeal);
    console.log(`[biran-yenke bench] advisor line: ${JSON.stringify(a)}`);
    console.log(`[biran-yenke bench] attack and potions only (no Lancet, no Rage): ${JSON.stringify(h)}`);
    console.log(`[biran-yenke bench] naive line (plain Attack only): ${JSON.stringify(n)}`);
    expect(h.other, 'no attack-and-heal fight hangs').toBe(0);
    expect(a.wins).toBeGreaterThanOrEqual(h.wins);
    expect(a.meanInputs, "the advisor's line is the faster way: learning the Rages shortens the fight").toBeLessThan(h.meanInputs);
    expect(a.other, 'no advisor fight hangs or ends as anything but a win or a loss').toBe(0);
    expect(n.other, 'no naive fight hangs').toBe(0);
    expect(a.wins).toBeGreaterThan(n.wins);
    expect(a.meanLearned, 'the advisor line learns Rages: that is the chapter').toBeGreaterThan(2);
  });
});
