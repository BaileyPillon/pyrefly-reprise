/**
 * **The Sinspawn Gui bench** (the hidden chapter; FFX only): what the shipped advisor line makes of the two fights on the real engine and the Ridge party, over many seeds, against the lines it must beat.
 * Human pace equals bench speed (FFX is CTB: the clock moves only on turns). **Measure, never tune**: the three monsters are the game's own rows (`research/re-ffx-ai-gui.md`) and no number of
 * theirs moves for this bench; the party's numbers are an ESTIMATE (`data/ffx/builds/mushroom-rock.ts`), so if the fight reads too hard or too easy the party estimate is what may move, inside its
 * stated range, and the move is recorded.
 *
 * The figures the tactic's header quotes (200 seeds, seeds 1 to 200): the advisor line wins the chain 97 to 98 percent, the second fight every time it is reached, attack-only none; the single lever in the game's
 * own rows is **Power Break**, which lands on the body only (RE 3.2) and halves its Attack: the same line without it wins about 65 percent. The bounds below are loose on purpose.
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { attackStrategy, intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { type Line, summarise, sweep } from '../helpers/guiBench.ts';

const SEEDS = 200;

const advisor: Line = (engine, d) => intendedStrategy(d.actorId, d.commands, engine) as Command | null;
const attackOnly: Line = (engine, d) => attackStrategy(d.actorId, d.commands, engine) as Command | null;
/** The advisor's line with Auron's Power Break taken out (he swings instead): the lever, measured by its absence. */
const noPowerBreak: Line = (engine, d) => {
  const c = intendedStrategy(d.actorId, d.commands, engine) as Command | null;
  return c && c.kind === 'ability' && c.id === 'power-break' ? null : c;
};

const rate = (runs: ReturnType<typeof sweep>): number => runs.filter((r) => r.outcome === 'victory').length / runs.length;

describe('the advisor\'s line on the real engine and the Ridge party (the tactic\'s own bench)', () => {
  const runs = sweep(() => advisor, {}, SEEDS);

  it('wins the chain on at least nine seeds in ten, and the second fight on every seed that reaches it', () => {
    // eslint-disable-next-line no-console
    console.log(`GUI BENCH advisor (${SEEDS} seeds): ${summarise(runs)}`);
    expect(rate(runs)).toBeGreaterThanOrEqual(0.9);
    const second = runs.flatMap((r) => r.links.filter((l) => l.link === 2));
    expect(second.length).toBeGreaterThan(SEEDS * 0.85);
    expect(second.filter((l) => l.outcome === 'victory').length / second.length).toBeGreaterThanOrEqual(0.98);
  });

  it('plays the fight it describes: the head is stopped most of the time it shakes, the arms fall and grow back', () => {
    const first = runs.map((r) => r.links[0]!);
    const mean = (f: (l: (typeof first)[number]) => number): number => first.reduce((a, l) => a + f(l), 0) / first.length;
    expect(mean((l) => l.cancels)).toBeGreaterThan(2);
    expect(mean((l) => l.armKills)).toBeGreaterThan(2);
    expect(mean((l) => l.thunders)).toBeGreaterThan(mean((l) => l.venoms)); // Venom is the minority: most shakes are answered
  });

  it('a defeat is always an ordinary wipe, never a stall', () => {
    for (const r of runs.filter((x) => x.outcome !== 'victory')) expect(r.links[r.links.length - 1]!.cause).toMatch(/^wipe:/);
  });
});

describe('the lines it must beat', () => {
  it('attack-only loses the first fight on every seed: the arms\' shield and Gui\'s Attack are the whole lesson', () => {
    const runs = sweep(() => attackOnly, {}, SEEDS);
    // eslint-disable-next-line no-console
    console.log(`GUI BENCH attack only (${SEEDS} seeds): ${summarise(runs)}`);
    expect(rate(runs)).toBeLessThanOrEqual(0.05);
  });

  it('the same line without Auron\'s Power Break wins clearly less: the one lever the game\'s own rows hand the player (Power Break lands on the body only)', () => {
    const withPb = rate(sweep(() => advisor, {}, SEEDS));
    const runs = sweep(() => noPowerBreak, {}, SEEDS);
    // eslint-disable-next-line no-console
    console.log(`GUI BENCH advisor without Power Break (${SEEDS} seeds): ${summarise(runs)}`);
    expect(withPb - rate(runs)).toBeGreaterThanOrEqual(0.1);
  });
});

describe('determinism', () => {
  it('the same seeds give the same chain readings', () => {
    const a = sweep(() => advisor, {}, 12).map((r) => [r.outcome, r.links.map((l) => [l.turns, l.actions])]);
    const b = sweep(() => advisor, {}, 12).map((r) => [r.outcome, r.links.map((l) => [l.turns, l.actions])]);
    expect(a).toEqual(b);
  });
});
