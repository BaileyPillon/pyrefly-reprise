/**
 * **The Yu Pagodas follow their own script** (re-parity, AI lane B; FFX only; Chapter III).
 *
 * The decision tables are `research/re-ffx-ai-yunalesca-bfa.md` section 4 (m173 = `yu-pagoda-right`, m174 = `yu-pagoda-left`);
 * the engine rule they rely on is section 1.1 (`onHit` once per target per sub-action) with `LastDamageTakenHP` of section 1.6.
 * Rows P1 to P5 of the note's section 9:
 *
 *   P1 who gets the Power Wave (Braska's Final Aeon always; a possessed aeon only while its gauge is under 100, otherwise
 *      last turn's command repeats; Yu Yevon always)
 *   P2 the Curse / Osmose split when the partner is down (m173 above 30, m174 above 70 of `mod 100`)
 *   P3 the revival delay: two or three of its own turns (a draw), one if it is Slowed
 *   P4 the revival pool: everything it absorbed in the life that just ended, overkill included, compounding across lives
 *   P5 the Power Wave's gauge on a possessed aeon (15 to 33; Yojimbo 5 to 14)
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { resolveDuePartRevivals } from '../../src/battle/ffx/hp.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { recoveryTicks } from '../../src/battle/ffx/turnQueue.ts';
import { buildPossessedAeonChain } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { rng: ScriptedRng };

/** A battle on the shipped data with a scripted random stream. */
function fight(groupId: string): Fight {
  const live = liveBattle(groupId);
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, rng };
}

/** Take a Pagoda off the field the way its destruction does (`hp.ts#koActor`), without arming a return. */
function down(t: Fight, id: string): void {
  const c = t.at(id);
  c.hp = 0;
  c.alive = false;
  c.removed = true;
}

/** A fixed blow of `power x 50` per hit (capped at 9,999) that cannot miss. */
function blow(power: number, hits = 1): AbilityDef {
  return ability({
    id: `blow-${power}x${hits}`, name: 'blow', category: 'skill', formula: 'fixed-no-variance', power, damageType: 'physical',
    hits, canMiss: false, targeting: 'single-enemy',
  });
}

describe('who the Pagoda heals while its partner stands (P1; m173 @0x020E and the battle switch)', () => {
  it('Braska’s Final Aeon: Power Wave on him, always, with no draw', () => {
    const t = fight('braskas-final-aeon');
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      const command = chooseAiCommand(t.ctx, t.at(id));
      expect([idOf(command), targetsOf(command)]).toEqual(['power-wave-bfa', ['braskas-final-aeon']]);
    }
    expect(t.rng.calls).toEqual([]);
  });

  it('a possessed aeon: Power Wave on the aeon while its Overdrive gauge is under 100, then last turn’s command again', () => {
    const t = fight('possessed-valefor');
    const pagoda = t.at('yu-pagoda-right');
    const aeonMemory = rtOf(t.ctx, 'possessed-valefor').ai;
    aeonMemory['aeon.gauge'] = 99;
    const first = chooseAiCommand(t.ctx, pagoda);
    expect([idOf(first), targetsOf(first)]).toEqual(['power-wave-aeon', ['possessed-valefor']]);
    aeonMemory['aeon.gauge'] = 100;
    const repeat = chooseAiCommand(t.ctx, pagoda);
    expect([idOf(repeat), targetsOf(repeat)], 'the script queues whatever v5 and v6 still hold').toEqual(['power-wave-aeon', ['possessed-valefor']]);
    expect(t.rng.calls).toEqual([]);
  });

  it('repeats a Curse on the old target when the partner is back and the aeon’s gauge is full', () => {
    const t = fight('possessed-valefor');
    const pagoda = t.at('yu-pagoda-right');
    down(t, 'yu-pagoda-left');
    t.rng.feed(1, 99); // the pick (Yuna) and a roll of 99 mod 100 > 30: Curse
    const curse = chooseAiCommand(t.ctx, pagoda);
    expect([idOf(curse), targetsOf(curse)]).toEqual(['yu-pagoda-curse', ['yuna']]);
    t.at('yu-pagoda-left').removed = false;
    t.at('yu-pagoda-left').alive = true;
    rtOf(t.ctx, 'possessed-valefor').ai['aeon.gauge'] = 100;
    const again = chooseAiCommand(t.ctx, pagoda);
    expect([idOf(again), targetsOf(again)]).toEqual(['yu-pagoda-curse', ['yuna']]);
  });

  it('has nothing to queue on its very first turn when the aeon’s gauge is already full', () => {
    const t = fight('possessed-valefor');
    rtOf(t.ctx, 'possessed-valefor').ai['aeon.gauge'] = 100;
    expect(chooseAiCommand(t.ctx, t.at('yu-pagoda-left'))).toBeNull();
  });

  it('Yu Yevon: Power Wave on him, always', () => {
    const t = fight('yu-yevon');
    const command = chooseAiCommand(t.ctx, t.at('yu-pagoda-left'));
    expect([idOf(command), targetsOf(command)]).toEqual(['power-wave-aeon', ['yu-yevon']]);
  });
});

describe('what the Pagoda does while its partner is down (P2; draws: the pick, then GetRandomValue)', () => {
  it('picks a random living actor first and rolls second: m173 casts Curse above 30, Osmose otherwise', () => {
    for (const [roll, spell] of [[30, 'osmose'], [31, 'yu-pagoda-curse'], [130, 'osmose'], [131, 'yu-pagoda-curse']] as const) {
      const t = fight('braskas-final-aeon');
      down(t, 'yu-pagoda-left');
      t.rng.feed(2);
      t.rng.wide.push(roll);
      const command = chooseAiCommand(t.ctx, t.at('yu-pagoda-right'));
      expect([idOf(command), targetsOf(command)], `roll ${roll}`).toEqual([spell, ['auron']]);
      expect(t.rng.calls).toEqual([[0, 2], [0, 0xffff]]);
    }
  });

  it('m174 casts Curse above 70 of mod 100 and Osmose otherwise', () => {
    for (const [roll, spell] of [[70, 'osmose'], [71, 'yu-pagoda-curse'], [199, 'yu-pagoda-curse'], [170, 'osmose']] as const) {
      const t = fight('braskas-final-aeon');
      down(t, 'yu-pagoda-right');
      t.rng.wide.push(roll);
      expect(idOf(chooseAiCommand(t.ctx, t.at('yu-pagoda-left'))), `roll ${roll}`).toBe(spell);
    }
  });

  it('splits 68.97 and 28.98 percent over all 65,536 draws (the note’s tallies, 69.18 and 29.24 on its sample)', () => {
    const cursed = (id: string, partner: string): number => {
      const t = fight('braskas-final-aeon');
      down(t, partner);
      let count = 0;
      for (let raw = 0; raw <= 0xffff; raw++) {
        t.rng.wide.push(raw);
        if (idOf(chooseAiCommand(t.ctx, t.at(id))) === 'yu-pagoda-curse') count += 1;
      }
      return count;
    };
    expect(cursed('yu-pagoda-right', 'yu-pagoda-left') / 65536).toBeCloseTo(0.6897, 4);
    expect(cursed('yu-pagoda-left', 'yu-pagoda-right') / 65536).toBeCloseTo(0.2898, 4);
  });

  it('does nothing when nobody is left to aim at', () => {
    const t = fight('braskas-final-aeon');
    down(t, 'yu-pagoda-left');
    for (const id of ['tidus', 'yuna', 'auron']) t.at(id).alive = false;
    expect(chooseAiCommand(t.ctx, t.at('yu-pagoda-right'))).toBeNull();
  });
});

describe('destruction, the pool and the return (P3, P4; m173 f3 @0x03FD)', () => {
  const pendingOf = (t: Fight) => t.ctx.rt.pendingPartRevivals;
  const parts = (t: Fight, kind: BattleEvent['type']): BattleEvent[] => t.events.filter((e) => e.type === kind);

  it('goes down on the hit that takes it to 0 HP and comes back with the damage it absorbed, overkill included (P4)', () => {
    const t = fight('braskas-final-aeon');
    const pagoda = t.at('yu-pagoda-right');
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']); // 9,999 against 5,000 HP
    expect([pagoda.alive, pagoda.removed]).toEqual([false, true]);
    expect(parts(t, 'part-destroyed')).toHaveLength(1);
    expect(pendingOf(t)).toHaveLength(1);
    expect(pendingOf(t)[0]?.maxHp, 'the whole 9,999 of the blow, not 5,000 plus the excess').toBe(9_999);
  });

  it('counts every point it took in the life, not only the killing blow, and the pool compounds across lives', () => {
    const t = fight('braskas-final-aeon');
    const pagoda = t.at('yu-pagoda-right');
    const full = pagoda.hp;
    resolveAbility(t.ctx, t.at('tidus'), blow(40), ['yu-pagoda-right']);
    const first = full - pagoda.hp;
    expect(first).toBeGreaterThan(0);
    expect(pagoda.alive).toBe(true);
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']); // 9,999 more
    expect(pendingOf(t)[0]?.maxHp).toBe(first + 9_999);

    // It returns whole at that pool and the pool starts again from 0.
    const pool = first + 9_999;
    t.ctx.state.ticks = pendingOf(t)[0]!.atTicks;
    resolveDuePartRevivals(t.ctx);
    expect([pagoda.alive, pagoda.hp, pagoda.stats.maxHp]).toEqual([true, pool, pool]);
    expect(parts(t, 'part-restored')).toHaveLength(1);
    resolveAbility(t.ctx, t.at('tidus'), blow(200, 3), ['yu-pagoda-right']); // 29,997 in one action: more than its pool
    expect(pendingOf(t)[0]?.maxHp, 'the second life paid 29,997, so the third is larger still').toBe(29_997);
  });

  it('never subtracts a heal from the pool, and ignores a command that does not touch HP', () => {
    const t = fight('braskas-final-aeon');
    const pagoda = t.at('yu-pagoda-right');
    const full = pagoda.hp;
    resolveAbility(t.ctx, t.at('tidus'), blow(40), ['yu-pagoda-right']);
    const first = full - pagoda.hp;
    const hurt = pagoda.hp;
    resolveAbility(t.ctx, t.at('yuna'), t.ctx.content.ability('cure')!, ['yu-pagoda-right']);
    expect(pagoda.hp, 'the Cure healed it').toBeGreaterThan(hurt);
    resolveAbility(t.ctx, t.at('yuna'), ability({ id: 'poke', name: 'poke', category: 'skill', targeting: 'single-enemy', canMiss: false }), ['yu-pagoda-right']);
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']);
    expect(pendingOf(t)[0]?.maxHp, 'the first blow + 9,999: the heal took nothing away and the poke added nothing').toBe(first + 9_999);
  });

  it('Zanmato sets the pool to the life’s maximum before the blow is added', () => {
    const t = fight('braskas-final-aeon');
    const zanmato = ability({ id: 'zanmato', name: 'Zanmato', category: 'overdrive', targeting: 'single-enemy', canMiss: false });
    resolveAbility(t.ctx, t.at('tidus'), blow(40), ['yu-pagoda-right']); // 2,000
    resolveAbility(t.ctx, t.at('tidus'), zanmato, ['yu-pagoda-right']);
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']);
    expect(pendingOf(t)[0]?.maxHp, 'v7 := v8 (5,000), then + 9,999').toBe(14_999);
  });

  it('hides for two or three of its own turns on a draw: under 50 is three (50.03 percent of the 65,536 draws)', () => {
    for (const [roll, turns] of [[49, 3], [50, 2], [149, 3], [150, 2]] as const) {
      const t = fight('braskas-final-aeon');
      const pagoda = t.at('yu-pagoda-right');
      const untilTurn = rtOf(t.ctx, pagoda.id).ctb;
      const recovery = recoveryTicks(pagoda, 3);
      t.rng.wide.push(roll);
      resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']);
      expect(pendingOf(t)[0]?.atTicks, `roll ${roll}`).toBe(t.ctx.state.ticks + untilTurn + (turns - 1) * recovery);
    }
    let three = 0;
    for (let raw = 0; raw <= 0xffff; raw++) if (raw % 100 < 50) three += 1;
    expect(three / 65536).toBeCloseTo(0.5003, 4);
  });

  it('comes back at its first own turn when it is Slowed, and a Slow also doubles its recovery', () => {
    const t = fight('braskas-final-aeon');
    const pagoda = t.at('yu-pagoda-right');
    pagoda.statuses['slow'] = { id: 'slow', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    const untilTurn = rtOf(t.ctx, pagoda.id).ctb;
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']);
    expect(pendingOf(t)[0]?.atTicks).toBe(t.ctx.state.ticks + untilTurn);
    expect(t.rng.calls.filter(([, hi]) => hi === 0xffff), 'a Slowed Pagoda takes no draw for its delay').toEqual([]);
  });

  it('pays its rank-3 delay from the moment it was due, however late the clock reaches it', () => {
    const t = fight('braskas-final-aeon');
    const pagoda = t.at('yu-pagoda-right');
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']);
    const due = pendingOf(t)[0]!.atTicks;
    const recovery = recoveryTicks(pagoda, 3);
    t.ctx.state.ticks = due; // found exactly on time: the whole delay is still to run
    resolveDuePartRevivals(t.ctx);
    expect(rtOf(t.ctx, pagoda.id).ctb).toBe(recovery);

    const later = fight('braskas-final-aeon');
    resolveAbility(later.ctx, later.at('tidus'), blow(200), ['yu-pagoda-right']);
    later.ctx.state.ticks = pendingOf(later)[0]!.atTicks + 7; // the clock moves between turns, so it is found 7 ticks late
    resolveDuePartRevivals(later.ctx);
    expect(rtOf(later.ctx, pagoda.id).ctb, 'and 7 of the delay have already run').toBe(recovery - 7);
  });

  it('leaves the partner free to act on the party once one is down', () => {
    const t = fight('braskas-final-aeon');
    resolveAbility(t.ctx, t.at('tidus'), blow(200), ['yu-pagoda-right']);
    const partner = chooseAiCommand(t.ctx, t.at('yu-pagoda-left'));
    expect(idOf(partner)).toMatch(/^(yu-pagoda-curse|osmose)$/);
  });
});

describe('the Power Wave’s gauge on a possessed aeon (P5; m163 f4 @0x03F0)', () => {
  const wave = (t: Fight, aeon: string): void =>
    void resolveAbility(t.ctx, t.at('yu-pagoda-right'), t.ctx.content.ability('power-wave-aeon')!, [aeon]);
  const gaugeOf = (t: Fight, aeon: string): unknown => rtOf(t.ctx, aeon).ai['aeon.gauge'];

  it('adds mod 10 plus 15 and a second mod 10: 15 to 33, mean 24', () => {
    for (const [first, second, gain] of [[0, 0, 15], [9, 9, 33], [3, 7, 25]] as const) {
      const t = fight('possessed-valefor');
      t.rng.wide.push(first, second);
      wave(t, 'possessed-valefor');
      expect(gaugeOf(t, 'possessed-valefor'), `${first} and ${second}`).toBe(gain);
    }
    let total = 0;
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) total += 15 + a + b;
    expect(total / 100).toBe(24);
  });

  it('adds only mod 10 plus 5 for the possessed Yojimbo: 5 to 14', () => {
    const live = liveBattle('possessed-yojimbo', { group: buildPossessedAeonChain(['yojimbo'])[0] });
    const rng = new ScriptedRng();
    live.ctx.rng = rng;
    const t: Fight = { ...live, rng };
    t.rng.wide.push(9);
    wave(t, 'possessed-yojimbo');
    expect(gaugeOf(t, 'possessed-yojimbo')).toBe(14);
  });
});
