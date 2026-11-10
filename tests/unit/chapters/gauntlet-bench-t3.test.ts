/**
 * **The bench of the hidden Gauntlet chapter's tier 3** (FFX only; chapter 54; stage 4: Th'uban, Neslug, the Ultima Buster), pinned on the real engine with the harness the table's tool uses
 * (`tests/unit/helpers/gauntletBench.ts`, `tools/gauntlet-bench.mjs`). The committed tables are 100 seeds a cell (`docs/handoff/ch-gauntlet.md`); this test plays a few seeds of each cell so a change to the engine, the
 * data, the tactic or the harness that moves a result shows here. **No boss row is ever touched**: a cell is a choice of line or of the party's own estimate.
 *
 * What it pins (measured, preflight section 8: the plan's target was about 70 percent per act): at the shipped preset the advisor's line wins all three acts of tier 3 and the whole nine-act chain every time, with and
 * without Yojimbo; a line without magic cannot beat Neslug (the shell stops every physical blow and the engine ends the stalemate) and a line that only Attacks the Ultima Buster loses; the stat estimate is a cliff
 * between 0.5 and 0.8 of the caps, placed differently for each act; a Death ward costs something at tier 3 whichever of the two armour abilities it replaces.
 */
import { describe, expect, it } from 'vitest';

import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { NESLUG_STATE_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { SHIPPED_LINE } from '../../../src/engine/tactics/gauntlet.ts';
import { actor, flags, newEngine, nextInput } from '../helpers/gauntletDrive.ts';
import { actRate, ablatedLine, advisorLine, carelessLine, chainRate, playChain, share, tierActs, withDeathproof, withStatFraction } from '../helpers/gauntletBench.ts';

const SEEDS = 12;
const T3 = tierActs(3);

describe('tier 3 at the shipped preset: the advisor\'s line wins every act, with Yojimbo or without', () => {
  for (const creature of T3) {
    it(`${creature}: the advisor's line, the line with no Zanmato and the line with Yojimbo against tier 3 win all ${SEEDS} seeds (100 of 100 measured each)`, () => {
      for (const [name, line] of [['advisor', advisorLine], ['no-zanmato', ablatedLine('no-zanmato')], ['zanmato-t3', ablatedLine('zanmato-t3')]] as const) {
        const r = actRate(SEEDS, creature, line);
        expect([name, r.wins, r.losses, r.escapes, r.unfinished], creature).toEqual([name, SEEDS, 0, 0, 0]);
      }
    });
  }

  it('the careless line: Th\'uban falls to it (98 of 100 measured; the party is faster), Neslug never does (the shell: the engine ends the stalemate, "escape"), the Ultima Buster always beats it (0 of 100)', () => {
    expect(share(actRate(30, 'thuban', carelessLine))).toBeGreaterThanOrEqual(0.9);
    const neslug = actRate(SEEDS, 'neslug', carelessLine);
    expect([neslug.wins, neslug.escapes, neslug.losses]).toEqual([0, SEEDS, 0]);
    const buster = actRate(SEEDS, 'ultima-buster', carelessLine);
    expect([buster.wins, buster.losses]).toEqual([0, SEEDS]);
  });

  it('the line with no magic wins Th\'uban and the Ultima Buster (the Arms first, then capped blows) and cannot win Neslug', () => {
    const none = ablatedLine('no-magic');
    expect(actRate(SEEDS, 'thuban', none).wins).toBe(SEEDS);
    expect(actRate(SEEDS, 'ultima-buster', none).wins).toBe(SEEDS);
    const neslug = actRate(SEEDS, 'neslug', none);
    expect([neslug.wins, neslug.escapes]).toEqual([0, SEEDS]);
  });

  it('the chain of the three and the whole chapter, the nine acts, are won by the advisor\'s line on every seed (100 of 100 measured; the careless line loses it at act 5, 7 or 8)', () => {
    const three = chainRate(SEEDS, advisorLine, gauntletBuild, 1, T3);
    expect([three.wins, three.lostAt]).toEqual([SEEDS, [0, 0, 0, 0]]);
    for (const seed of [1, 2]) {
      expect(playChain(seed, advisorLine).fights.map((f) => f.outcome), `seed ${seed}`).toEqual(Array(9).fill('victory'));
    }
    const careless = chainRate(SEEDS, carelessLine);
    expect(careless.wins).toBe(0);
    expect(careless.lostAt.slice(1, 5).reduce((a, b) => a + b, 0), 'never before act 5').toBe(0);
  });
});

describe("the tier-3 line's rules, one by one, on the real engine", () => {
  /** The command the line chooses for the first player input (Tidus, Yuna or Auron), after `prepare` has set the battle up. */
  function choice(seed: number, creature: 'neslug' | 'ultima-buster', line: ReturnType<typeof ablatedLine>, prepare: (e: ReturnType<typeof newEngine>) => void = () => undefined, actorId = 'tidus') {
    const engine = newEngine(seed, creature);
    prepare(engine);
    for (let guard = 0; guard < 6; guard++) {
      const d = nextInput(engine);
      if (d.actorId === actorId) return { engine, command: line(d, engine), commands: d.commands };
      engine.submit({ kind: 'defend', targets: [] }); // the members before him wait
    }
    throw new Error(`no input of ${actorId}`);
  }
  const inShell = (e: ReturnType<typeof newEngine>): void => void (flags(e)[NESLUG_STATE_FLAG] = 1);

  it('Neslug: the advisor\'s line gives Tidus\'s turn to Lulu (a Switch) from the first turn and she casts Doublecast; "shell-only" switches only once it is in its shell; "no-magic" never does', () => {
    const swap = choice(1, 'neslug', advisorLine);
    expect(swap.command).toMatchObject({ kind: 'switch', extra: { outId: 'tidus', inId: 'lulu' } });
    const standing = choice(1, 'neslug', ablatedLine('shell-only'));
    expect(standing.command?.kind).not.toBe('switch');
    expect(choice(1, 'neslug', ablatedLine('shell-only'), inShell).command).toMatchObject({ kind: 'switch', extra: { outId: 'tidus', inId: 'lulu' } });
    expect(choice(1, 'neslug', ablatedLine('no-magic'), inShell).command?.kind).not.toBe('switch');
    // Lulu already in: her action is the Doublecast.
    const e = newEngine(2, 'neslug');
    const d = nextInput(e);
    expect(d.actorId).toBe('tidus');
    e.submit(advisorLine(d, e) ?? { kind: 'defend', targets: [] });
    const dl = nextInput(e);
    expect(dl.actorId).toBe('lulu');
    expect(advisorLine(dl, e)).toMatchObject({ kind: 'ability', id: 'doublecast' });
  });

  it('the Ultima Buster: the advisor\'s line switches Lulu in from the first turn; the strikers (Auron, or Tidus without her) aim at an Arm while one stands and at the body once both are down; "no-arms-first" aims at the body', () => {
    expect(choice(1, 'ultima-buster', advisorLine).command).toMatchObject({ kind: 'switch', extra: { outId: 'tidus', inId: 'lulu' } });
    const strike = (line: ReturnType<typeof ablatedLine>, who: string, armsDown = false): string | undefined =>
      choice(1, 'ultima-buster', line, (e) => {
        if (!armsDown) return;
        for (const id of ['ultima-buster-arm-left', 'ultima-buster-arm-right']) {
          const arm = actor(e, id);
          arm.hp = 0;
          arm.alive = false;
          arm.removed = true;
        }
      }, who).command?.targets?.[0];
    expect(strike(advisorLine, 'auron')).toBe('ultima-buster-arm-left');
    expect(strike(ablatedLine('no-magic'), 'tidus')).toBe('ultima-buster-arm-left');
    expect(strike(ablatedLine('no-magic'), 'tidus', true)).toBe('ultima-buster');
    expect(strike(advisorLine, 'auron', true)).toBe('ultima-buster');
    expect(strike(ablatedLine('no-arms-first'), 'auron')).toBe('ultima-buster');
    expect(SHIPPED_LINE.magicAt).toEqual(['neslug', 'ultima-buster']);
    expect(SHIPPED_LINE.armsFirst).toBe(true);
    expect(SHIPPED_LINE.magicShell).toBe(true);
  });

  it('Yojimbo: the shipped line calls him against none of the nine acts; "zanmato-t3" has Yuna call him in against tier 3 (the first input of hers is the summon)', () => {
    expect(SHIPPED_LINE.zanmatoAt).toEqual([]);
    for (const creature of T3) {
      const e = choice(1, creature as 'neslug', ablatedLine('zanmato-t3'), () => undefined, 'yuna');
      expect(e.command, creature).toMatchObject({ kind: 'summon' });
      expect(e.commands.find((c) => c.command.kind === 'summon' && c.label === 'Yojimbo'), creature).toBeDefined();
      expect(choice(1, creature as 'neslug', advisorLine, () => undefined, 'yuna').command?.kind, creature).not.toBe('summon');
    }
  });
});

describe('the levers (tier 3): the stat estimate is a cliff between 0.5 and 0.8 of the caps, placed differently for each act; a Death ward costs something here', () => {
  it('Th\'uban holds to 0.65 (100 of 100 measured) and is lost at 0.5 (0); Neslug holds to 0.7 (97) and falls at 0.4 (0); the Ultima Buster holds at 0.8 (100) and is lost at 0.7 (0): no single estimate puts the three in the 60 to 80 percent band', () => {
    const at = (creature: 'thuban' | 'neslug' | 'ultima-buster', f: number): number => share(actRate(SEEDS, creature, advisorLine, withStatFraction(gauntletBuild, f)));
    expect(at('thuban', 0.65)).toBeGreaterThanOrEqual(0.9);
    expect(at('thuban', 0.5)).toBeLessThanOrEqual(0.1);
    expect(at('neslug', 0.7)).toBeGreaterThanOrEqual(0.9);
    expect(at('neslug', 0.4)).toBeLessThanOrEqual(0.1);
    expect(at('ultima-buster', 0.8)).toBeGreaterThanOrEqual(0.9);
    expect(at('ultima-buster', 0.7)).toBeLessThanOrEqual(0.1);
  });

  it('a Death ward in place of the Ribbon costs the tier-3 chain (92 of 100 measured, all lost at act 7: Rainbow, Slime and Contamination land); in place of Auto-Protect it costs it nothing (100 of 100)', () => {
    const ribbon = chainRate(40, advisorLine, withDeathproof(gauntletBuild, 'ribbon'), 1, T3);
    expect(ribbon.wins).toBeLessThan(40);
    const protect = chainRate(SEEDS, advisorLine, withDeathproof(gauntletBuild, 'auto-protect'), 1, T3);
    expect(protect.wins).toBe(SEEDS);
  });
});
