/**
 * **The bench of the hidden Gauntlet chapter's tiers 1 and 2** (FFX only; chapter 54; stages 2 and 3), pinned on the real engine with the harness the table's tool uses (`tests/unit/helpers/gauntletBench.ts`,
 * `tools/gauntlet-bench.mjs`). The committed tables are 100 seeds a cell (`docs/handoff/ch-gauntlet.md`); this test plays a few seeds of each cell so a change to the engine, the data, the tactic or the party that moves
 * a result shows here. **No boss row is ever touched**: a cell is a choice of line or of the party's own estimate.
 *
 * What it pins (all measured, preflight section 8: the plan's target was about 70 percent per act): at the shipped preset the six creatures of tiers 1 and 2 are won every time by the advisor's line, with Yojimbo's
 * Zanmato and without, and by the careless line, except the Greater Sphere, which a line that never heals loses about a third of the time (66 of 100 measured); the party's stat estimate is the lever that moves them
 * (tier 1: a cliff far below the caps; tier 2: a cliff just under them, differently placed for each act), and a Death ward is a lever for Earth Eater's punch alone.
 */
import { describe, expect, it } from 'vitest';

import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { SHIPPED_LINE, lineWith } from '../../../src/engine/tactics/gauntlet.ts';
import { EATER_DOWN_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { actor, flags, newEngine, nextInput, playOne } from '../helpers/gauntletDrive.ts';

import {
  ABLATIONS, BUILT, actRate, ablatedLine, advisorLine, carelessLine, chainRate, playChain, share, tierActs, withDeathproof, withKills, withStatFraction,
} from '../helpers/gauntletBench.ts';

const SEEDS = 12;

describe('the harness', () => {
  it('the acts built are the nine of the three tiers; a tier is its three; every named ablation builds a line; an unknown one is refused', () => {
    expect(BUILT).toEqual(['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster']);
    expect(tierActs(1)).toEqual(['cactuar-king', 'don-tonberry', 'jormungand']);
    expect(tierActs(2)).toEqual(['earth-eater', 'greater-sphere', 'catastrophe']);
    expect(tierActs(3)).toEqual(['thuban', 'neslug', 'ultima-buster']);
    for (const name of Object.keys(ABLATIONS)) expect(typeof ablatedLine(name)).toBe('function');
    expect(typeof ablatedLine('no-zanmato', 'no-fodder')).toBe('function');
    expect(() => ablatedLine('nonsense')).toThrow(/no ablation/);
  });

  it('stage 5: `bare` is the careless line\'s other half (every rule taken away, a Phoenix Down for the fallen), and `bare+zanmato-all` is its "with Zanmato": both win the Cactuar King, and neither is the plain careless line (the Greater Sphere tells them apart: 135 and 174 of 200 measured)', () => {
    expect(ABLATIONS['bare']).toMatchObject({ fodder: false, tonberryWait: false, useOverdrives: false, magicShell: false, magicAt: [], armsFirst: false, healUnder: 0, itemHealUnder: 0 });
    for (const name of ['bare', 'bare+zanmato-all']) {
      const r = actRate(4, 'cactuar-king', ablatedLine(...name.split('+')));
      expect([name, r.wins, r.unfinished], name).toEqual([name, 4, 0]);
    }
    expect(ablatedLine('bare', 'zanmato-all')).not.toBe(carelessLine);
  });
});

describe('tier 1 at the shipped preset: every act is won, by every line', () => {
  for (const creature of tierActs(1)) {
    it(`${creature}: the advisor's line, the line with Yojimbo against every act, the line without him and the careless line win all ${SEEDS} seeds, none unfinished`, () => {
      for (const [name, line] of [['advisor', advisorLine], ['zanmato-all', ablatedLine('zanmato-all')], ['no-zanmato', ablatedLine('no-zanmato')], ['careless', carelessLine]] as const) {
        const r = actRate(SEEDS, creature, line);
        expect([name, r.wins, r.losses, r.escapes, r.unfinished], creature).toEqual([name, SEEDS, 0, 0, 0]);
      }
    });
  }

  it('the chain of the three: won by the advisor\'s line and the careless line on every seed (the carry between the acts, the kill counts included)', () => {
    for (const [name, line] of [['advisor', advisorLine], ['careless', carelessLine]] as const) {
      const r = chainRate(SEEDS, line, gauntletBuild, 1, tierActs(1));
      expect([name, r.wins, r.lostAt], name).toEqual([name, SEEDS, [0, 0, 0, 0]]);
    }
    const one = playChain(1, advisorLine, gauntletBuild, tierActs(1));
    expect(one.outcome).toBe('victory');
    expect(one.fights.map((f) => f.outcome)).toEqual(['victory', 'victory', 'victory']);
  });
});

describe('tier 2 at the shipped preset: Earth Eater, the Greater Sphere and Catastrophe', () => {
  for (const creature of ['earth-eater', 'catastrophe'] as const) {
    it(`${creature}: the advisor's line, the line with Yojimbo against tier 2, the line without him and the careless line win all ${SEEDS} seeds, none unfinished`, () => {
      for (const [name, line] of [['advisor', advisorLine], ['zanmato-t2', ablatedLine('zanmato-t2')], ['no-zanmato', ablatedLine('no-zanmato')], ['careless', carelessLine]] as const) {
        const r = actRate(SEEDS, creature, line);
        expect([name, r.wins, r.losses, r.escapes, r.unfinished], creature).toEqual([name, SEEDS, 0, 0, 0]);
      }
    });
  }

  it('greater-sphere: the advisor\'s line and the line with Yojimbo win all seeds; a line that never heals loses it about a third of the time (66 of 100 measured: Hydraulic Press kills whoever is under 4,687 HP)', () => {
    for (const [name, line] of [['advisor', advisorLine], ['zanmato-t2', ablatedLine('zanmato-t2')], ['no-zanmato', ablatedLine('no-zanmato')]] as const) {
      const r = actRate(SEEDS, 'greater-sphere', line);
      expect([name, r.wins, r.losses, r.unfinished]).toEqual([name, SEEDS, 0, 0]);
    }
    const careless = share(actRate(30, 'greater-sphere', carelessLine));
    expect(careless).toBeGreaterThan(0.4);
    expect(careless).toBeLessThan(0.85);
  });

  it('the chain of the three: the advisor\'s line wins every seed (100 of 100 measured; the Overdrive bar is what keeps the Greater Sphere from a Hydraulic Press the carried gauges would draw)', () => {
    const r = chainRate(SEEDS, advisorLine, gauntletBuild, 1, tierActs(2));
    expect([r.wins, r.lostAt]).toEqual([SEEDS, [0, 0, 0, 0]]);
    expect(playChain(1, advisorLine).fights.map((f) => f.outcome)).toEqual(Array(9).fill('victory')); // the whole chapter, the nine acts, on one seed
  });
});

describe("the tier-2 line's rules, one by one, on the real engine", () => {
  /** The command the line chooses for the first player input of a fight. */
  function firstChoice(seed: number, creature: 'earth-eater' | 'greater-sphere', line: ReturnType<typeof ablatedLine>, prepare: (e: ReturnType<typeof newEngine>) => void = () => undefined): { who: string; kind: string } {
    const engine = newEngine(seed, creature);
    prepare(engine);
    const d = nextInput(engine);
    const c = line(d, engine);
    return { who: d.actorId, kind: c?.kind ?? 'defend' };
  }

  it('Earth Eater standing: only Auron strikes (the others defend); down: everybody strikes; "eater-wait" defends while it lies; "no-eater-focus" lets the others strike standing', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const standing = firstChoice(seed, 'earth-eater', advisorLine);
      if (standing.who !== 'yuna') expect(standing.kind === 'defend', `seed ${seed}: ${standing.who}`).toBe(standing.who !== 'auron');
      const down = (e: ReturnType<typeof newEngine>): void => void (flags(e)[EATER_DOWN_FLAG] = true);
      const lying = firstChoice(seed, 'earth-eater', advisorLine, down);
      if (lying.who !== 'yuna') expect(['attack', 'ability', 'overdrive'], `seed ${seed}: ${lying.who}`).toContain(lying.kind); // Tidus's Quick Hit is an ability
      const waiting = firstChoice(seed, 'earth-eater', ablatedLine('eater-wait'), down);
      if (waiting.who !== 'yuna') expect(waiting.kind, `seed ${seed}: ${waiting.who}`).toBe('defend');
      const everyone = firstChoice(seed, 'earth-eater', ablatedLine('no-eater-focus'));
      if (everyone.who !== 'yuna') expect(['attack', 'ability'], `seed ${seed}: ${everyone.who}`).toContain(everyone.kind);
    }
  });

  it('the Greater Sphere: no Overdrive is spent on it (it answers a special with Hydraulic Press, 4,687 on each member); the ablation "sphere-od" spends one when the gauge is ready', () => {
    const full = (e: ReturnType<typeof newEngine>): void => {
      for (const id of ['tidus', 'auron']) {
        const c = actor(e, id);
        if (c.overdrive) c.overdrive.gauge = 100;
      }
    };
    let barred = 0;
    let spent = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const a = firstChoice(seed, 'greater-sphere', advisorLine, full);
      const b = firstChoice(seed, 'greater-sphere', ablatedLine('sphere-od'), full);
      if (a.who === 'tidus' || a.who === 'auron') {
        expect(a.kind, `seed ${seed}`).not.toBe('overdrive');
        barred++;
        if (b.kind === 'overdrive') spent++;
      }
    }
    expect(barred).toBeGreaterThan(0);
    expect(spent, 'the ablation spends it').toBeGreaterThan(0);
    expect(SHIPPED_LINE.odBarredAt).toEqual(['greater-sphere']);
    expect(typeof lineWith(SHIPPED_LINE)).toBe('function');
  });
});

describe('the levers (tier 1): the stat estimate moves the careless line off a cliff, and the advisor\'s line holds', () => {
  it('at a quarter of the stat caps the careless line loses the Cactuar King and Don Tonberry on nearly every seed, the advisor\'s line wins them (measured over 100 seeds: 6 and 0 against 96 and 100)', () => {
    const weak = withStatFraction(gauntletBuild, 0.25);
    expect(share(actRate(SEEDS, 'cactuar-king', carelessLine, weak))).toBeLessThanOrEqual(0.25);
    expect(share(actRate(SEEDS, 'don-tonberry', carelessLine, weak))).toBeLessThanOrEqual(0.15);
    expect(share(actRate(SEEDS, 'cactuar-king', advisorLine, weak))).toBeGreaterThanOrEqual(0.75); // 96 of 100 measured: the King's counters cost a member or two a fight
    expect(share(actRate(SEEDS, 'don-tonberry', advisorLine, weak))).toBeGreaterThanOrEqual(0.9);
    expect(share(actRate(SEEDS, 'jormungand', advisorLine, weak))).toBeGreaterThanOrEqual(0.9);
  });

  it('a party with no kill count takes Karma\'s teeth: Don Tonberry\'s walk-in costs the careless line nothing (the build holds the number, preflight GA5)', () => {
    const weakNoKills = withKills(withStatFraction(gauntletBuild, 0.25), 0);
    const weak = withStatFraction(gauntletBuild, 0.25);
    expect(share(actRate(SEEDS, 'don-tonberry', carelessLine, weakNoKills))).toBeGreaterThan(share(actRate(SEEDS, 'don-tonberry', carelessLine, weak)));
  });
});

describe('the levers (tier 2): the stat estimate is a cliff just under the caps, placed differently for each act; the Death ward and the armour are levers for single moves', () => {
  it('at 0.7 of the caps the advisor\'s line loses Earth Eater on every seed (0 of 100 measured; 100 of 100 at 0.8), at 0.65 the Greater Sphere (0 of 100; 94 at 0.7), and Catastrophe holds down to 0.53 (100 of 100; 0 of 100 at 0.45)', () => {
    expect(share(actRate(SEEDS, 'earth-eater', advisorLine, withStatFraction(gauntletBuild, 0.8)))).toBeGreaterThanOrEqual(0.9);
    expect(share(actRate(SEEDS, 'earth-eater', advisorLine, withStatFraction(gauntletBuild, 0.7)))).toBeLessThanOrEqual(0.1);
    expect(share(actRate(SEEDS, 'greater-sphere', advisorLine, withStatFraction(gauntletBuild, 0.65)))).toBeLessThanOrEqual(0.1);
    expect(share(actRate(SEEDS, 'catastrophe', advisorLine, withStatFraction(gauntletBuild, 0.55)))).toBeGreaterThanOrEqual(0.9);
    expect(share(actRate(SEEDS, 'catastrophe', advisorLine, withStatFraction(gauntletBuild, 0.45)))).toBeLessThanOrEqual(0.1);
  });

  it('a Death ward in place of the Ribbon stops Earth Eater\'s punch from killing (about 1.0 member lost a fight on the preset, 0.01 with it, 100 seeds), and costs tier 2 nothing', () => {
    const koByPunch = (party: typeof gauntletBuild): number => {
      let kos = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const run = playOne(seed, 'earth-eater', advisorLine, 1200, party);
        expect(run.outcome, `seed ${seed}`).toBe('victory');
        kos += run.events.filter((e) => e.type === 'ko' && e.sourceId === 'earth-eater').length;
      }
      return kos;
    };
    expect(koByPunch(gauntletBuild)).toBeGreaterThanOrEqual(4);
    expect(koByPunch(withDeathproof(gauntletBuild, 'ribbon'))).toBeLessThanOrEqual(2);
  });

  it('Auto-Protect is what makes the Greater Sphere\'s Hydraulic Press survivable: without it (a Death ward in its slot) the advisor\'s line wins about a third of the seeds (37 of 100 measured)', () => {
    const r = actRate(30, 'greater-sphere', advisorLine, withDeathproof(gauntletBuild, 'auto-protect'));
    expect(share(r)).toBeLessThan(0.6);
  });
});
