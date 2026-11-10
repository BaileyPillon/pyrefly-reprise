/**
 * Gullwings, Chapter 1 (FFX-2's four hotspot missions, the hidden chapter): the four fights on the REAL engine, seeded. **FFX-2 only** [AGENTS.md rule 14]. Every number here is what the engine produced when this file was
 * written (probes first, assertions second), not the note's prose: the T0 checks of the paper preflight (`docs/plans/ch-dragon-review.md` §9), run by running it (hard rule 3).
 *
 * 1. **Each fight, three seeds**: the chapter's party (with the shipped advisor line) wins every act; with nobody acting the boss's own script runs on the real clock, in its own order: Boris's three Spider Attacks, one
 *    Sticky End, then no more; the Dragon's breath first; the Beast's Attack, Attack, Attack, Curse; YSLS-Zero's moves from its own list only.
 * 2. **The two fractions of maximum HP (formula 7)**: Damocles Photon takes exactly half of each girl's maximum HP, and Shell halves it (it is magical); Blast Punch takes exactly half of one girl's maximum HP and neither
 *    Protect nor Shell changes it (damage flags 0). (Blast Punch's delay is the row's strong-delay bit, pinned in `gullwings-ch1-data.test.ts`.)
 * 3. **Sticky End**: 46 to 52 a girl, whatever the girl; a Stop with a counter of 20; a Remedy frees a Stopped girl.
 * 4. **Curse**: lands on the girl it names; a cursed girl's menu offers no Change; Holy Water lifts it and the Change returns.
 * 5. **Haymaker never misses and hits twice; Spider Attack hits twice and can miss**; Flame Breath is Fire on all three and Shell halves it.
 * 6. **The elements**: Boris is weak to Fire and Ice (and not Thunder); the Flame Dragon is weak to Ice and takes half from Fire; the Beast is weak to Fire, Ice, Thunder and Water; YSLS-Zero to none.
 * 7. **Time Up Meteor** is 12 hits of 10,000 on everyone, and ends the fight.
 * 8. **The stat table below Lv 20** (the T0 finding, `dressphere-stats.ts`): the girls' HP at Lv 12 / 13 / 14 are the first segment's extrapolation (576, 630, 741), below a Lv 20 girl's.
 */
import { describe, expect, it } from 'vitest';

import {
  ACTS, GIRLS, bossOf, driveAct, forced, girlsOf, levelsBuild, logOf, moveCmd, openAct, unit, type Act, type Ev,
} from '../helpers/gullwingsCh1Drive.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { Command, Decision } from '../../../src/battle/common/types.ts';
import { GULLWINGS_ABILITY as A } from '../../../src/battle/ffx2/ai/gullwings-ch1.ts';
import { gullwingsCh1Groups } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** A permanent status on a unit, as the engine stores one (a rig: the engine's own Shell and Protect are spells the Gunner and the Warrior do not have). */
function give(engine: FFX2Engine, id: string, status: string): void {
  (unit(engine, id).statuses as Record<string, unknown>)[status] = { id: status, turnsRemaining: null, ticksRemaining: null, counter: 0, accumulator: 0, charges: null, stacks: 0, permanent: true };
}

interface PlayOptions {
  /** Every girl defends; stop when this holds on the log. */
  until: (log: readonly Ev[]) => boolean;
  seed?: number;
  /** Runs once after the engine opens. */
  setup?: (engine: FFX2Engine) => void;
  /** The girls' answer to a menu (default: defend). */
  turn?: (d: Input, engine: FFX2Engine) => Command | null;
  keepFull?: boolean;
  maxDecisions?: number;
}

/** A forced act: the boss's script returns `queue`, then nothing; the girls defend (or `turn`). Returns the engine and how it ended. */
function play(act: Act, queue: Command[], opts: PlayOptions): { engine: FFX2Engine; outcome?: string } {
  const f = forced(act);
  const engine = openAct(act, opts.seed ?? 1, { group: f.group });
  f.forced.queue.push(...queue);
  opts.setup?.(engine);
  for (let i = 0; i < (opts.maxDecisions ?? 4000) && !opts.until(logOf(engine)); i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { engine, outcome: String(d.result.outcome) };
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (opts.keepFull) for (const g of girlsOf(engine)) if (g.alive) g.hp = g.stats.maxHp;
    engine.submit(opts.turn?.(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return { engine };
}

const bossActions = (act: Act) => (log: readonly Ev[]): number => log.filter((e) => e.type === 'action-end' && e.actorId === bossOf(act)).length;
const damageOn = (engine: FFX2Engine, target: string): number[] => logOf(engine).filter((e) => e.type === 'damage' && e.targetId === target).map((e) => e.amount ?? 0);

const yslsSeen: string[] = [];

describe('each fight, three seeds, on the real engine', () => {
  it.each([1, 2, 3])('seed %i: the shipped advisor line wins all four acts (the chapter\'s party, no state edit)', (seed) => {
    for (const act of ACTS) {
      const r = driveAct(act, 'advisor', seed);
      expect(r.outcome, `act ${act + 1} seed ${seed}`).toBe('victory');
      expect(r.bossHp, `act ${act + 1}`).toBe(0);
      const own = new Set(gullwingsCh1Groups[act]!.enemies[0]!.abilityIds);
      for (const id of r.order) expect(own.has(id), `${bossOf(act)} used ${id}`).toBe(true);
    }
  });

  it.each([1, 2, 3])('seed %i: with nobody acting, Boris plays Spider Attack x3, Sticky End once, then only Spider Attack or Spider Bite for the whole fight (a party that only defends loses)', (seed) => {
    const r = driveAct(0, 'defend', seed);
    expect(r.outcome).toBe('defeat');
    expect(r.order.slice(0, 4)).toEqual([A.spiderAttack, A.spiderAttack, A.spiderAttack, A.stickyEnd]);
    expect(r.order.filter((id) => id === A.stickyEnd)).toHaveLength(1);
    expect(r.order.slice(4).every((id) => id === A.spiderAttack || id === A.spiderBite)).toBe(true);
    expect(r.order.length).toBeGreaterThan(20);
  });

  it.each([1, 2, 3])('seed %i: with nobody acting, the Flame Dragon opens with Flame Breath and then only Attacks; the Beast plays Attack x3 then Curse; YSLS-Zero plays Haymaker, Blast Punch and both Attacks', (seed) => {
    const dragon = driveAct(1, 'defend', seed);
    expect(dragon.order[0]).toBe(A.flameBreath);
    expect(dragon.order.slice(1).every((id) => id === A.flameDragonAttack)).toBe(true);
    const beast = driveAct(2, 'defend', seed);
    expect(beast.order.slice(0, 4)).toEqual([A.guardianBeastAttack, A.guardianBeastAttack, A.guardianBeastAttack, A.curse]);
    expect(beast.order.filter((id) => id === A.damoclesPhoton)).toHaveLength(0); // it is never hurt: the Photon needs it under a third
    const ysls = driveAct(3, 'defend', seed);
    const four = new Set<string>([A.haymaker, A.blastPunch, A.yslsAttack, A.yslsAttackNoCancel]);
    expect(ysls.order.length).toBeGreaterThan(3);
    for (const id of ysls.order) expect(four.has(id), id).toBe(true);
    expect(ysls.order).toContain(A.haymaker); // nearly half of its polls
    yslsSeen.push(...ysls.order);
  });

  it('...and over the three seeds YSLS-Zero used all four of its moves', () => {
    expect(new Set<string>(yslsSeen)).toEqual(new Set<string>([A.haymaker, A.blastPunch, A.yslsAttack, A.yslsAttackNoCancel]));
  });

  it('the Beast, hurt under a third, plays the Photon in place of the Curse: a party that strikes it down to 900 and then defends sees Damocles Photon and no Curse after', () => {
    const engine = openAct(2, 4);
    unit(engine, 'x2-guardian-beast').hp = 900;
    let guard = 0;
    while (guard++ < 4000) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      for (const g of girlsOf(engine)) g.hp = g.stats.maxHp;
      engine.submit({ kind: 'defend', targets: [] });
      if (logOf(engine).filter((e) => e.type === 'action-start' && e.actorId === 'x2-guardian-beast').length >= 9) break;
    }
    const order = logOf(engine).filter((e) => e.type === 'action-start' && e.actorId === 'x2-guardian-beast').map((e) => e.abilityId);
    expect(order.slice(0, 4)).toEqual([A.guardianBeastAttack, A.guardianBeastAttack, A.guardianBeastAttack, A.damoclesPhoton]);
    expect(order).not.toContain(A.curse);
  });
});

describe('the two fractions of maximum HP (formula 7)', () => {
  it('Damocles Photon takes exactly half of every girl\'s maximum HP (floor), all three at once', () => {
    const { engine } = play(2, [moveCmd(A.damoclesPhoton)], { until: (log) => bossActions(2)(log) >= 1 });
    const max = GIRLS.map((id) => unit(engine, id).stats.maxHp);
    expect(max).toEqual([576, 630, 741]);
    expect(GIRLS.map((id) => damageOn(engine, id))).toEqual(max.map((m) => [Math.floor(m / 2)]));
  });

  it('Shell halves the Photon (it is magical): half of half, to the point; Protect changes nothing', () => {
    const shelled = play(2, [moveCmd(A.damoclesPhoton)], { until: (log) => bossActions(2)(log) >= 1, setup: (e) => GIRLS.forEach((id) => give(e, id, 'shell')) }).engine;
    const protectedOnly = play(2, [moveCmd(A.damoclesPhoton)], { until: (log) => bossActions(2)(log) >= 1, setup: (e) => GIRLS.forEach((id) => give(e, id, 'protect')) }).engine;
    const max = GIRLS.map((id) => unit(shelled, id).stats.maxHp);
    GIRLS.forEach((id, i) => {
      const half = Math.floor(max[i]! / 2);
      expect(damageOn(shelled, id)[0], `${id} under Shell`).toBeGreaterThanOrEqual(Math.floor(half / 2) - 1);
      expect(damageOn(shelled, id)[0], `${id} under Shell`).toBeLessThanOrEqual(Math.ceil(half / 2) + 1);
      expect(damageOn(protectedOnly, id)[0], `${id} under Protect`).toBe(half);
    });
  });

  it('Blast Punch takes exactly half of ONE girl\'s maximum HP; neither Protect nor Shell changes it (its damage flags are 0)', () => {
    for (const status of [undefined, 'protect', 'shell'] as const) {
      const { engine } = play(3, [moveCmd(A.blastPunch, ['paine'])], { until: (log) => bossActions(3)(log) >= 1, setup: (e) => (status ? give(e, 'paine', status) : undefined) });
      expect(damageOn(engine, 'paine'), `Paine ${status ?? 'bare'}`).toEqual([Math.floor(unit(engine, 'paine').stats.maxHp / 2)]);
      expect(damageOn(engine, 'yuna')).toEqual([]);
      expect(damageOn(engine, 'rikku')).toEqual([]);
    }
  });
});

describe('Sticky End and the Stop', () => {
  it('hits all three for 46 to 52 each, on every seed and whichever girl (a fixed formula with variance, power 1)', () => {
    const seen: number[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const { engine } = play(0, [moveCmd(A.stickyEnd)], { seed, until: (log) => bossActions(0)(log) >= 1 });
      for (const id of GIRLS) {
        const hits = damageOn(engine, id);
        expect(hits, `seed ${seed} ${id}`).toHaveLength(1);
        seen.push(hits[0]!);
      }
    }
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(46);
    expect(Math.max(...seen)).toBeLessThanOrEqual(52);
  });

  it("Stop lands on some girls and not others, with a counter of 20 and the web's source on the instance; the rate over 100 seeds is measured: the row's 40 is a base lowered 5 per level the girl is above Boris (Lv 8 against 12 to 14: 20, 15 and 10 in 101, about one girl in seven), not four in ten", () => {
    let stops = 0;
    let trials = 0;
    let counter = -1;
    for (let seed = 1; seed <= 100; seed++) {
      const { engine } = play(0, [moveCmd(A.stickyEnd)], { seed, until: (log) => bossActions(0)(log) >= 1 });
      for (const e of logOf(engine) as readonly (Ev & { instance?: { counter?: number; sourceAbilityId?: string } })[]) {
        if (e.type === 'status-add' && e.status === 'stop') {
          stops++;
          counter = e.instance?.counter ?? -1;
          expect(e.instance?.sourceAbilityId).toBe(A.stickyEnd);
        }
      }
      trials += 3;
    }
    console.info(`[gullwings ch1 engine] Sticky End: Stop on ${stops} of ${trials} girls (${((100 * stops) / trials).toFixed(1)} percent)`);
    expect(stops / trials).toBeGreaterThan(0.08);
    expect(stops / trials).toBeLessThan(0.28);
    expect(counter).toBe(20);
  });

  it('a Remedy frees a Stopped girl: the Stop is gone at once, and the girl can act again', () => {
    const { engine } = play(0, [], {
      until: (log) => log.some((e) => e.type === 'status-remove' && e.status === 'stop'),
      setup: (e) => give(e, 'paine', 'stop'),
      turn: (d, engine) => {
        if (d.actorId === 'yuna') {
          const row = d.commands.find((c) => c.enabled && c.command.kind === 'item' && (c.command as { id?: string }).id === 'x2-remedy');
          return row ? ({ ...row.command, targets: ['paine'] } as Command) : null;
        }
        void engine;
        return null;
      },
    });
    expect((unit(engine, 'paine').statuses as Record<string, unknown>)['stop']).toBeUndefined();
    expect(logOf(engine).some((e) => e.type === 'status-remove' && e.targetId === 'paine' && e.status === 'stop')).toBe(true);
  });
});

describe('Curse', () => {
  const curseOnYuna = (): FFX2Engine => play(2, [moveCmd(A.curse, ['yuna'])], { until: (log) => bossActions(2)(log) >= 1 }).engine;

  it('lands on the girl it names, and a cursed girl\'s menu offers no Change; Holy Water lifts the Curse and the Change returns', () => {
    const engine = curseOnYuna();
    expect((unit(engine, 'yuna').statuses as Record<string, unknown>)['curse']).toBeDefined();
    const menu = (id: string): Input | null => {
      for (let i = 0; i < 4000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') return null;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind === 'player-input') {
          if (d.actorId === id) return d;
          engine.submit({ kind: 'defend', targets: [] });
        }
      }
      return null;
    };
    const cursed = menu('yuna');
    expect(cursed).not.toBeNull();
    expect(cursed!.commands.filter((c) => c.enabled && c.command.kind === 'spherechange')).toHaveLength(0);
    const holy = cursed!.commands.find((c) => c.enabled && c.command.kind === 'item' && (c.command as { id?: string }).id === 'x2-holy-water');
    expect(holy, 'Holy Water is in the bag').toBeDefined();
    engine.submit({ ...holy!.command, targets: ['yuna'] } as Command);
    for (let i = 0; i < 4000 && (unit(engine, 'yuna').statuses as Record<string, unknown>)['curse'] !== undefined; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      else if (d.kind === 'battle-over') break;
    }
    expect((unit(engine, 'yuna').statuses as Record<string, unknown>)['curse'], 'Holy Water lifted it').toBeUndefined();
    const again = menu('yuna');
    expect(again!.commands.filter((c) => c.enabled && c.command.kind === 'spherechange').length, 'the Change returns').toBeGreaterThan(0);
  });

  it('Curse on a girl does no damage', () => {
    const engine = curseOnYuna();
    expect(damageOn(engine, 'yuna')).toEqual([]);
  });
});

describe('Haymaker, Spider Attack, Flame Breath', () => {
  it('Haymaker never misses over 300 uses and always lands two hits; Spider Attack lands two hits and can miss', () => {
    let hay = 0;
    let hayMiss = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const queue = Array.from({ length: 10 }, () => moveCmd(A.haymaker, ['paine']));
      const { engine } = play(3, queue, { seed, until: (log) => bossActions(3)(log) >= 10, keepFull: true });
      const log = logOf(engine);
      hay += log.filter((e) => e.type === 'action-start' && e.abilityId === A.haymaker).length;
      hayMiss += log.filter((e) => e.type === 'miss' && e.targetId === 'paine').length;
      const hits = log.filter((e) => e.type === 'damage' && e.targetId === 'paine').length;
      const uses = log.filter((e) => e.type === 'action-start' && e.abilityId === A.haymaker).length;
      expect(hits, `seed ${seed}`).toBe(2 * uses);
    }
    expect(hay).toBe(300);
    expect(hayMiss).toBe(0);
    let spiderHits = 0;
    let spiderMisses = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const queue = Array.from({ length: 10 }, () => moveCmd(A.spiderAttack, ['rikku']));
      const { engine } = play(0, queue, { seed, until: (log) => bossActions(0)(log) >= 10, keepFull: true });
      const log = logOf(engine);
      spiderHits += log.filter((e) => e.type === 'damage' && e.targetId === 'rikku').length;
      spiderMisses += log.filter((e) => e.type === 'miss' && e.targetId === 'rikku').length;
    }
    expect(spiderHits).toBeGreaterThan(300);
    console.info(`[gullwings ch1 engine] Spider Attack on Rikku: ${spiderHits} hits and ${spiderMisses} misses over 300 uses (two hits each)`);
  });

  it('Flame Breath hits all three girls once with Fire, and Shell halves it', () => {
    const bare = play(1, [moveCmd(A.flameBreath)], { until: (log) => bossActions(1)(log) >= 1 }).engine;
    const shelled = play(1, [moveCmd(A.flameBreath)], { until: (log) => bossActions(1)(log) >= 1, setup: (e) => GIRLS.forEach((id) => give(e, id, 'shell')) }).engine;
    for (const id of GIRLS) {
      const a = damageOn(bare, id);
      const b = damageOn(shelled, id);
      expect(a, id).toHaveLength(1);
      expect(b, id).toHaveLength(1);
      expect(b[0]!, `${id}: Shell`).toBeLessThan(a[0]!);
      expect(Math.abs(b[0]! - a[0]! / 2), `${id}: about half`).toBeLessThanOrEqual(a[0]! * 0.1);
    }
    expect(unit(bare, 'x2-flame-dragon').mp).toBe(620 - 30); // 30 MP paid
  });
});

describe('the elements (Rikku, changed to a Black Mage, casts each at a boss that cannot act)', () => {
  /** Mean damage of `spell` on `act`'s boss over 10 seeds (the boss is idle: a forced script with an empty queue). */
  function mean(act: Act, spell: string): number {
    let sum = 0;
    let n = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { engine } = play(act, [], {
        seed,
        until: (log) => log.filter((e) => e.type === 'damage' && e.targetId === bossOf(act)).length >= 3,
        setup: (e) => {
          unit(e, bossOf(act)).hp = 1_000_000;
          unit(e, bossOf(act)).stats.maxHp = 1_000_000;
        },
        keepFull: true,
        turn: (d) => {
          if (d.actorId !== 'rikku') return null;
          const change = d.commands.find((c) => c.enabled && c.command.kind === 'spherechange' && (c.command as { extra?: { toDressphere?: string } }).extra?.toDressphere === 'black-mage');
          if (change) return { ...change.command, targets: [] } as Command;
          const cast = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && (c.command as { id?: string }).id === spell);
          return cast ? ({ ...cast.command, targets: [bossOf(act)] } as Command) : null;
        },
        maxDecisions: 6000,
      });
      const hits = logOf(engine).filter((e) => e.type === 'damage' && e.targetId === bossOf(act)).map((e) => e.amount ?? 0);
      for (const h of hits) {
        sum += h;
        n++;
      }
    }
    expect(n, `${spell} on ${bossOf(act)} landed`).toBeGreaterThan(5);
    return sum / n;
  }

  it('Boris takes more from Fire and Ice than from Thunder (weak to the first two)', () => {
    const fire = mean(0, 'x2-black-mage-fire');
    const ice = mean(0, 'x2-black-mage-blizzard');
    const thunder = mean(0, 'x2-black-mage-thunder');
    expect(fire).toBeGreaterThan(thunder * 1.2);
    expect(ice).toBeGreaterThan(thunder * 1.2);
  });

  it('the Flame Dragon takes most from Ice, least from Fire (weak, then normal, then half)', () => {
    const ice = mean(1, 'x2-black-mage-blizzard');
    const thunder = mean(1, 'x2-black-mage-thunder');
    const fire = mean(1, 'x2-black-mage-fire');
    expect(ice).toBeGreaterThan(thunder * 1.2);
    expect(fire).toBeLessThan(thunder * 0.8);
  });

  it('the Guardian Beast is weak to Fire, Ice, Thunder and Water alike; YSLS-Zero to none (the four spells land the same, to the variance)', () => {
    const beast = ['fire', 'blizzard', 'thunder', 'water'].map((s) => mean(2, `x2-black-mage-${s}`));
    const ysls = ['fire', 'blizzard', 'thunder', 'water'].map((s) => mean(3, `x2-black-mage-${s}`));
    expect(Math.max(...beast) / Math.min(...beast)).toBeLessThan(1.15);
    expect(Math.max(...ysls) / Math.min(...ysls)).toBeLessThan(1.15);
    // ...and the Beast's weakness shows against its own Defense-free Magic Defense (3): the same spell does more to it than to YSLS-Zero (Magic Defense 3 too, but no weakness).
    expect(beast[0]!).toBeGreaterThan(ysls[0]! * 1.2);
  });
});

describe('Time Up Meteor', () => {
  it('is 12 hits of 10,000 on everyone: the party is gone and the fight is a defeat', () => {
    const { engine, outcome } = play(0, [moveCmd(A.timeUpMeteor)], { until: (log) => bossActions(0)(log) >= 1 });
    expect(outcome === 'defeat' || girlsOf(engine).every((g) => !g.alive)).toBe(true);
    const hits = logOf(engine).filter((e) => e.type === 'damage' && e.targetId === 'yuna').length;
    expect(hits).toBeGreaterThan(0);
    expect(Math.max(...logOf(engine).filter((e) => e.type === 'damage' && e.targetId === 'yuna').map((e) => e.amount ?? 0))).toBeGreaterThanOrEqual(570);
  });
});

describe('the stat table below Lv 20 (T0)', () => {
  it('the chapter\'s girls at Lv 12 / 13 / 14 have 576, 630 and 741 HP (the first segment of the Gunner, Thief and Warrior tables, run down), under a Lv 20 girl\'s 862, 896 and 1,002', () => {
    const engine = openAct(0, 1);
    expect(girlsOf(engine).map((g) => g.stats.maxHp)).toEqual([576, 630, 741]);
    const twenty = openAct(0, 1, { build: levelsBuild(20, 20, 20) });
    expect(girlsOf(twenty).map((g) => g.stats.maxHp)).toEqual([862, 896, 1002]);
  });
});
