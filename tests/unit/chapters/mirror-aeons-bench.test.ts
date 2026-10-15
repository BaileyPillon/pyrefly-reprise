/**
 * **The bench for the hidden Mirror Aeons chapter: the difficulty measured, never tuned** (D-410; Bailey 2026-10-15: "make the difficulty appropriate not too easy not too hard"; the plan is
 * `docs/plans/ch-mirror-aeons-review.md` section 3). The target: **with the advisor's line a full run (both acts) is won about 70 percent of the time, 60 to 80 accepted**, and a careless line mostly loses. The two
 * levers are the party preset (`data/ffx/builds/mirror-aeons.ts`) and WHICH of the game's own formations each act uses (`SISTER_LADDER`, `YOJIMBO_TIERS`); **no boss row is ever edited to fit a result**.
 *
 * ## A skeleton until the reverse-engineering session's work lands
 *
 * The ladder can only be measured with the Dark aeons' real scripts (without them the enemies play the engine's fallback, a plain Attack, and every rung is the same easy or hard fight for the wrong reason) and with
 * Yuna's Yojimbo and Magus Sisters wired (the advisor's line leans on an aeon taking the big move). So:
 *
 *  - the **harness** (`rungFigures`, the band, `pickRung`) is tested always;
 *  - a **smoke run** plays every rung of both ladders a few seeds under the fallback AI and prints the figures **labelled FALLBACK** (asserting only that every fight reaches an outcome);
 *  - **the measurement itself** (100 seeds a line per rung) is `describe.skipIf` the scripts or the summon rules are absent, and prints the ladder with the pick the plan's rule gives (`pickRung`: the rung whose advisor win rate
 *    is nearest 70 percent and inside the band; if none is, the party preset moves one lever at a time, in the order the plan lists them).
 *
 * ## What is measured today, and is not about difficulty: how far a blade and a spell reach
 *
 * The engine's hit rule is faithful to the files' rows (Dark Mindy: Evasion 240, Luck 130; Dark Sandy: Evasion 100; Dark Cindy: Evasion 0; Dark Yojimbo: Luck 114): the preset's Tidus lands **no blow on Dark Mindy, most
 * on Sandy, every one on Cindy and about two in five on Dark Yojimbo**, and a spell never misses. That is why the advisor's line sends Lulu's spells at Mindy and the blades at Cindy and Sandy.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { darkAeonsSeamStatus } from '../../../src/battle/ffx/ai/dark-aeons-seams.ts';
import { mirrorAeons } from '../../../src/engine/tactics/mirror-aeons.ts';
import { SISTER_LADDER, YOJIMBO_TIERS, sistersGroupId, yojimboGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

/** The plan's target and band (section 3): 70 percent, 60 to 80 accepted. */
export const TARGET = 0.7;
export const BAND: readonly [number, number] = [0.6, 0.8];
/** A careless line should lose; under this share of wins counts as "mostly loses". */
export const CARELESS_AT_MOST = 0.2;

export interface RungFigures {
  rung: string;
  seeds: number;
  wins: number;
  losses: number;
  other: number;
  /** Mean player inputs of the won fights (the length of a win). */
  meanInputsWon: number;
}

const rate = (f: RungFigures): number => f.wins / Math.max(1, f.seeds);
export const inBand = (x: number): boolean => x >= BAND[0] && x <= BAND[1];

/** The rung whose advisor win rate is nearest the target and inside the band; null when none is (the party preset then moves, one lever at a time). */
export function pickRung(figures: readonly RungFigures[]): string | null {
  const inside = figures.filter((f) => inBand(rate(f))).sort((a, b) => Math.abs(rate(a) - TARGET) - Math.abs(rate(b) - TARGET));
  return inside[0]?.rung ?? null;
}

const advisor = (d: H.Input, e: BattleEngine): Command | null => mirrorAeons(d.actorId, d.commands, e);

/** Play `seeds` fights of one formation with one line; the figures. */
export function rungFigures(rung: string, groupId: string, choose: (d: H.Input, e: BattleEngine) => Command | null, seeds: number): RungFigures {
  const runs = Array.from({ length: seeds }, (_, i) => H.playOne(i + 1, groupId, choose));
  const won = runs.filter((r) => r.outcome === 'victory');
  return {
    rung,
    seeds,
    wins: won.length,
    losses: runs.filter((r) => r.outcome === 'defeat').length,
    other: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
    meanInputsWon: won.length === 0 ? 0 : Math.round((won.reduce((a, r) => a + r.inputs, 0) / won.length) * 10) / 10,
  };
}

const RUNGS: ReadonlyArray<readonly [string, string]> = [
  ...SISTER_LADDER.map((f) => [f, sistersGroupId(f)] as const),
  ...YOJIMBO_TIERS.map((t) => [t.file, yojimboGroupId(t.file)] as const),
];

describe('the harness (always on)', () => {
  const fig = (rung: string, wins: number, seeds = 100): RungFigures => ({ rung, seeds, wins, losses: seeds - wins, other: 0, meanInputsWon: 0 });

  it('the band is 60 to 80 percent around a target of 70; careless is "mostly loses" under 20', () => {
    expect([TARGET, BAND, CARELESS_AT_MOST]).toEqual([0.7, [0.6, 0.8], 0.2]);
    expect([0.59, 0.6, 0.7, 0.8, 0.81].map(inBand)).toEqual([false, true, true, true, false]);
  });

  it('picks the rung nearest 70 percent inside the band, and none when no rung is inside it', () => {
    expect(pickRung([fig('a', 95), fig('b', 78), fig('c', 66), fig('d', 20)])).toBe('c'); // 66 is 4 from the target, 78 is 8
    expect(pickRung([fig('a', 95), fig('b', 40)])).toBeNull();
    expect(pickRung([])).toBeNull();
  });

  it('the ladder holds the six sister rungs and the five tiers, each a registered group', () => {
    expect(RUNGS.map(([name]) => name)).toEqual([...SISTER_LADDER, ...YOJIMBO_TIERS.map((t) => t.file)]);
    expect(RUNGS).toHaveLength(11);
    for (const [name, group] of RUNGS) expect(() => H.setup(1, group), name).not.toThrow();
  });
});

describe('what a blade and a spell can reach (measured on the real engine, the preset\'s own party; deterministic seeds)', () => {
  /** Swings (or casts) at `target` with `who`, the party kept alive and the target's HP kept huge: hits and misses over a few seeds. */
  function reach(group: string, target: string, who: string, how: 'blade' | 'spell'): { hits: number; swings: number } {
    let hits = 0;
    let swings = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const e = H.newEngine(seed, group);
      for (const id of e.state().enemyIds) {
        const c = e.state().combatants[id] as FFXCombatant;
        c.stats.maxHp = c.hp = 99_999_999;
      }
      for (let i = 0; i < 60 && swings < 40 * seed; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        for (const id of e.state().activeIds) {
          const m = e.state().combatants[id] as FFXCombatant;
          m.stats.maxHp = m.hp = 99_999;
        }
        const row = d.commands.find((c) => c.enabled && c.validTargets.includes(target) && (how === 'blade' ? c.command.kind === 'attack' : c.command.kind === 'ability' && c.label === 'Fire'));
        if (d.actorId !== who || !row) { e.submit(H.defend()); continue; }
        const events = e.submit({ ...row.command, targets: [target] } as Command);
        swings++;
        if (events.some((ev) => ev.type === 'damage' && ev.targetId === target && ev.amount > 0)) hits++;
      }
    }
    return { hits, swings };
  }

  it('a blade of Tidus lands none on Dark Mindy (Evasion 240), most on Sandy (100), all on Cindy (0), about two in five on Dark Yojimbo (Luck 114)', () => {
    const mindy = reach(H.ACT_I_GROUP, 'dark-mindy', 'tidus', 'blade');
    const sandy = reach(H.ACT_I_GROUP, 'dark-sandy', 'tidus', 'blade');
    const cindy = reach(H.ACT_I_GROUP, 'dark-cindy', 'tidus', 'blade');
    const yojimbo = reach(H.ACT_II_GROUP, 'dark-yojimbo', 'tidus', 'blade');
    for (const r of [mindy, sandy, cindy, yojimbo]) expect(r.swings).toBeGreaterThanOrEqual(20);
    expect(mindy.hits / mindy.swings).toBeLessThan(0.05);
    expect(sandy.hits / sandy.swings).toBeGreaterThan(0.55);
    expect(sandy.hits / sandy.swings).toBeLessThan(0.97);
    expect(cindy.hits / cindy.swings).toBeGreaterThan(0.97);
    expect(yojimbo.hits / yojimbo.swings).toBeGreaterThan(0.2);
    expect(yojimbo.hits / yojimbo.swings).toBeLessThan(0.7);
  });

  it('a spell of Lulu never misses, Dark Mindy included', () => {
    const spell = reach(H.ACT_I_GROUP, 'dark-mindy', 'lulu', 'spell');
    expect(spell.swings).toBeGreaterThanOrEqual(10);
    expect(spell.hits).toBe(spell.swings);
  });
});

describe('the smoke run under the fallback AI (labelled FALLBACK: it says nothing about difficulty)', () => {
  const landed = darkAeonsSeamStatus();
  it.skipIf(landed.sisters && landed.yojimbo)('every rung of both ladders plays to an outcome in three seeds, and the table is printed', () => {
    const lines: string[] = [];
    for (const [rung, group] of RUNGS) {
      const f = rungFigures(rung, group, advisor, 3);
      expect(f.other, `${rung} reaches an outcome`).toBe(0);
      lines.push(`${rung.padEnd(10)} FALLBACK advisor ${f.wins}/${f.seeds} won, ${f.losses} lost, ${f.meanInputsWon} inputs a win`);
    }
    // eslint-disable-next-line no-console
    console.info(`[mirror-aeons bench, no Dark AI yet]\n${lines.join('\n')}`);
  });
});

describe.skipIf(!(darkAeonsSeamStatus().sisters && darkAeonsSeamStatus().yojimbo))('the ladder with the real Dark AI (100 seeds a line a rung)', () => {
  const seeds = 100;
  const advisorFigures = RUNGS.map(([rung, group]) => rungFigures(rung, group, advisor, seeds));
  const carelessFigures = RUNGS.map(([rung, group]) => rungFigures(rung, group, H.careless, seeds));

  it('prints the ladder and the pick the plan\'s rule gives (the figures are the deliverable; the band is reported, not asserted)', () => {
    const pick = pickRung(advisorFigures);
    const rows = advisorFigures.map((f, i) => `${f.rung.padEnd(10)} advisor ${(rate(f) * 100).toFixed(0).padStart(3)}% (${f.meanInputsWon} inputs a win)   careless ${(rate(carelessFigures[i]!) * 100).toFixed(0).padStart(3)}%`);
    // eslint-disable-next-line no-console
    console.info(`[mirror-aeons bench]\n${rows.join('\n')}\npick: ${pick ?? 'none inside 60-80: move the party preset, one lever at a time'}`);
    for (const f of [...advisorFigures, ...carelessFigures]) expect(f.other, `${f.rung} reaches an outcome`).toBe(0);
  });

  it('the advisor\'s line beats the careless one on every rung, and the careless line mostly loses on the rung the chapter ships', () => {
    advisorFigures.forEach((f, i) => expect(rate(f), f.rung).toBeGreaterThanOrEqual(rate(carelessFigures[i]!)));
  });
});
