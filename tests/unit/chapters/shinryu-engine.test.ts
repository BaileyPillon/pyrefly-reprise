/**
 * The hidden Shinryu chapter on the real engine (FFX only, `research/re-ffx-shinryu.md` "RE n"; the paper preflight's T0 checks, `docs/plans/ch-shinryu-review.md` section 9): the turn (a draw mod 3 and the exact
 * splits), the counter on every blow that takes HP, the one-alive rule, the Eraser (Petrify at 255, a shatter in the water, **and not stopped by Ribbon or Stoneproof: the T0 check E3**), Shining's eight hits, the numbers against
 * the preset, the win and its rewards, and determinism. Nothing is mocked; scripted draws only where a test is about a single decision.
 */

import { describe, expect, it } from 'vitest';

import type { AbilityDef, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/index.ts';
import { shinryuTurn } from '../../../src/battle/ffx/ai/shinryu.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { shinryuBuild } from '../../../src/data/ffx/builds/shinryu.ts';
import { ScriptedRng, groupOf, liveBattle } from '../helpers/aiScript.ts';
import { SHINRYU, SWIMMERS, actionList, actor, defend, give, has, inputFor, log, newEngine, nextInput, row, shinryu, shinryuActions, swing } from '../helpers/shinryuDrive.ts';

const ATTACK = 'shinryu-attack';
const ERASER = 'shinryu-eraser';
const SHINING = 'shinryu-shining';

/** A turn of Shinryu's on the shipped data with the script's one draw set to `roll` and only `living` of the three swimmers standing. */
function turnWith(roll: number, living: readonly string[] = SWIMMERS) {
  const t = liveBattle('shinryu', { party: shinryuBuild });
  const rng = new ScriptedRng();
  t.ctx.rng = rng;
  for (const id of SWIMMERS) if (!living.includes(id)) give(t.at(id), 'ko'), (t.at(id).alive = false), (t.at(id).hp = 0);
  rng.wide.push(roll);
  const cmd = shinryuTurn(aiContextFor(t.ctx, t.at(SHINRYU)));
  return { t, rng, cmd };
}
const idOf = (cmd: ReturnType<typeof turnWith>['cmd']): string => (cmd === null ? 'pass' : cmd.kind === 'ability' ? cmd.id : cmd.kind);

describe('the engine fights the note\'s formation', () => {
  it('Shinryu at 2,000,000 HP, Tidus, Wakka and Rikku in front and nobody on the bench, a water battle, no Escape', () => {
    const engine = newEngine(1);
    expect(shinryu(engine).hp).toBe(2_000_000);
    expect(engine.state().activeIds).toEqual(['tidus', 'wakka', 'rikku']);
    expect(engine.state().flags['battle.inWater']).toBe(true);
    const menu = inputFor(engine, 'tidus');
    expect(menu.commands.some((c) => c.command.kind === 'escape' && c.enabled)).toBe(false);
  });

  it('the party opens in every seed: Shinryu\'s first turn is 15 ticks away against the hasted swimmers\' 4 to 9 (the Auron turn-order line is true: 0 of 500 seeds in the note\'s probe, 200 here)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 2000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'player-input') {
          expect(log(engine).some((e) => e.type === 'action-start'), `seed ${seed}: an action before the first menu`).toBe(false);
          break;
        }
        if (d.kind === 'battle-over') break;
      }
    }
  });
});

describe('the turn: one draw mod 3 (RE 2), the splits exact', () => {
  const tally = (living: readonly string[]): Record<string, number> => {
    const out: Record<string, number> = {};
    for (let roll = 0; roll < 60; roll++) {
      const id = idOf(turnWith(roll, living).cmd);
      out[id] = (out[id] ?? 0) + 1;
    }
    return out;
  };

  it('with three alive: Shining, Eraser and Attack a third each (draws 0 to 59: 20 each)', () => {
    expect(tally(['tidus', 'wakka', 'rikku'])).toEqual({ [SHINING]: 20, [ERASER]: 20, [ATTACK]: 20 });
  });

  it('with two alive: the same third each', () => {
    expect(tally(['tidus', 'rikku'])).toEqual({ [SHINING]: 20, [ERASER]: 20, [ATTACK]: 20 });
  });

  it('with ONE alive the Eraser is never used: Shining a third and Attack two thirds (the draw 1 becomes the Attack on the living one)', () => {
    expect(tally(['wakka'])).toEqual({ [SHINING]: 20, [ATTACK]: 40 });
    const { cmd } = turnWith(1, ['wakka']);
    expect(cmd).toMatchObject({ kind: 'ability', id: ATTACK, targets: ['wakka'] });
  });

  it('Shining is aimed at nobody in particular (the front line); the Eraser and the Attack name one living member', () => {
    expect(turnWith(0).cmd).toMatchObject({ id: SHINING, targets: [] });
    const eraser = turnWith(1).cmd!;
    expect(eraser.targets).toHaveLength(1);
    expect(SWIMMERS as readonly string[]).toContain(eraser.targets[0]);
    expect(turnWith(2).cmd!.targets).toHaveLength(1);
  });

  it('the Eraser and the Attack never name a member who is down', () => {
    for (let roll = 1; roll <= 2; roll++) for (const living of [['tidus', 'wakka'], ['wakka', 'rikku'], ['rikku']]) {
      const cmd = turnWith(roll, living).cmd!;
      expect(living, `${roll} ${living}`).toContain(cmd.targets[0]);
    }
  });

  it('the real script on seeded runs: a third each while two or more stand, and not one Eraser once a single swimmer is left', () => {
    // The party only defends (Wakka's Evade & Counter answers now and then, which is not a wound Shinryu is asked about) and is topped up, so Shinryu's turns run on: the Eraser shatters members as it goes.
    const byLiving: Record<number, Record<string, number>> = { 1: {}, 2: {}, 3: {} };
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 120; i++) {
        try { nextInput(engine, true); } catch { break; }
        engine.submit(defend());
        if (shinryuActions(engine).length >= 24) break;
      }
      const standing = new Set<string>(SWIMMERS);
      for (const e of log(engine)) {
        if (e.type === 'message' && / shatters$/.test(e.text)) standing.delete(e.text.replace(/ shatters$/, '').toLowerCase());
        if (e.type === 'action-start' && e.actorId === SHINRYU) {
          const tally = byLiving[standing.size]!;
          tally[e.abilityId ?? ''] = (tally[e.abilityId ?? ''] ?? 0) + 1;
        }
      }
    }
    const sum = (t: Record<string, number>): number => Object.values(t).reduce((s, n) => s + n, 0);
    const wide: Record<string, number> = { [SHINING]: (byLiving[3]![SHINING] ?? 0) + (byLiving[2]![SHINING] ?? 0), [ERASER]: (byLiving[3]![ERASER] ?? 0) + (byLiving[2]![ERASER] ?? 0), [ATTACK]: (byLiving[3]![ATTACK] ?? 0) + (byLiving[2]![ATTACK] ?? 0) };
    const total = sum(wide);
    expect(total).toBeGreaterThanOrEqual(300);
    for (const id of [SHINING, ERASER, ATTACK]) {
      expect(wide[id]! / total, id).toBeGreaterThan(0.27);
      expect(wide[id]! / total, id).toBeLessThan(0.4);
    }
    expect(sum(byLiving[1]!), 'the sample reached the one-alive case').toBeGreaterThanOrEqual(50);
    expect(byLiving[1]![ERASER] ?? 0, 'no Eraser with one swimmer left').toBe(0);
    const lone = byLiving[1]!;
    expect(lone[ATTACK]! / sum(lone), 'two thirds Attack and a third Shining').toBeGreaterThan(0.55);
    expect(lone[ATTACK]! / sum(lone)).toBeLessThan(0.78);
  });
});

describe('the counter: an Attack on whoever dealt HP damage (RE 2)', () => {
  it('every party blow that takes HP is answered by one Attack on the one who struck, and nothing else is', () => {
    const engine = newEngine(5);
    const d = inputFor(engine, 'wakka');
    const before = log(engine).length;
    engine.submit(swing(d)!);
    nextInput(engine, true);
    const events = log(engine).slice(before);
    const counters = events.filter((e) => e.type === 'counter' && e.actorId === SHINRYU);
    expect(counters).toHaveLength(1);
    expect(counters[0]).toMatchObject({ actorId: SHINRYU, targetId: 'wakka' });
    const list = actionList(events);
    expect(list[0]).toBe('wakka:attack');
    expect(list[1]).toBe(`shinryu:${ATTACK}`);
    const answered = events.find((e) => e.type === 'damage' && e.sourceId === SHINRYU);
    expect(answered).toMatchObject({ targetId: 'wakka' });
  });

  it('a heal that leaves it unwounded and a miss draw nothing: a Potion thrown at it is no counter', () => {
    const engine = newEngine(5);
    const d = inputFor(engine, 'rikku');
    const before = log(engine).length;
    const potion = row(d, 'item', 'x-potion', SHINRYU) ?? row(d, 'item', 'potion', SHINRYU);
    if (potion === null) return; // the engine aims restoratives at the party only (an existing item rule): nothing to test
    engine.submit(potion);
    nextInput(engine, true);
    expect(log(engine).slice(before).filter((e) => e.type === 'counter' && e.actorId === SHINRYU)).toHaveLength(0);
  });

  it('the blow that kills it draws no answer, and the battle is won', () => {
    const engine = newEngine(5);
    shinryu(engine).hp = 20;
    const d = inputFor(engine, 'tidus');
    const before = log(engine).length;
    engine.submit(swing(d)!);
    const outcome = engine.nextDecision();
    expect(outcome.kind).toBe('battle-over');
    expect(log(engine).slice(before).filter((e) => e.type === 'counter' && e.actorId === SHINRYU)).toHaveLength(0);
  });

  it('a counter never triggers another counter: a blow that is itself a counterattack of the party (the Celestial weapons\' Evade & Counter) is not answered, and the killing blow is not answered', () => {
    let sawPartyCounter = false;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const engine = newEngine(seed);
      for (let i = 0; i < 200; i++) {
        let d;
        try { d = nextInput(engine, false); } catch { break; }
        engine.submit(swing(d) ?? defend());
      }
      const events = log(engine);
      const blows = events.filter((e) => e.type === 'damage' && e.targetId === SHINRYU).length;
      const answers = events.filter((e) => e.type === 'counter' && e.actorId === SHINRYU).length;
      const partyCounters = events.filter((e) => e.type === 'counter' && e.actorId !== SHINRYU).length;
      expect(blows, `seed ${seed}: every blow is the 99,999 cap`).toBe(21);
      // Every ordered blow but the last is answered; a party counterattack is a blow nobody ordered and draws no answer.
      expect([blows - partyCounters, blows - partyCounters - 1], `seed ${seed}`).toContain(answers);
      if (partyCounters > 0) sawPartyCounter = true;
    }
    expect(sawPartyCounter, 'the sample met at least one counterattack of the party').toBe(true);
  });
});

describe('the Eraser: Petrify at 255 (RE 3), a shatter in the water', () => {
  const eraser = (t: ReturnType<typeof liveBattle>): AbilityDef => t.ctx.content.ability(ERASER)!;

  it('in the water a landed Eraser removes the swimmer from the fight at once: 0 HP, off the field, Petrify and Eject, "shatters"', () => {
    const t = liveBattle('shinryu', { party: shinryuBuild });
    resolveAbility(t.ctx, t.at(SHINRYU), eraser(t), ['rikku']);
    const rikku = t.at('rikku');
    expect(rikku.hp).toBe(0);
    expect(rikku.alive).toBe(false);
    expect(rikku.removed).toBe(true);
    expect(has(rikku, 'petrify')).toBe(true);
    expect(has(rikku, 'eject')).toBe(true);
    expect(t.events.some((e) => e.type === 'message' && e.text === 'Rikku shatters')).toBe(true);
    expect(t.events.some((e) => e.type === 'damage' && e.targetId === 'rikku')).toBe(false); // no "0" numeral
    expect(t.at('tidus').alive && t.at('wakka').alive).toBe(true);
  });

  /** The Eraser with the record's own shatter byte (100) taken off: a Petrify that is only a Petrify, so the water flag is the one thing that can break the stone. */
  const withoutShatterByte = (t: ReturnType<typeof liveBattle>): AbilityDef => ({ ...eraser(t), shatterChance: 0, record: { ...eraser(t).record!, shatter: 0 } });

  it('FINDING: the row carries its own shatter byte (100), so the Eraser erases even on dry land (the formation without the water flag), as its name says', () => {
    const group = groupOf('shinryu');
    delete group.inWater;
    const t = liveBattle('shinryu', { party: shinryuBuild, group });
    expect(t.ctx.state.flags['battle.inWater']).not.toBe(true);
    resolveAbility(t.ctx, t.at(SHINRYU), eraser(t), ['rikku']);
    const rikku = t.at('rikku');
    expect(has(rikku, 'petrify')).toBe(true);
    expect(has(rikku, 'eject')).toBe(true);
    expect(rikku.removed).toBe(true);
  });

  it('control: with the shatter byte taken off, dry land leaves the Petrified member in the fight, and the water flag alone breaks him', () => {
    const dryGroup = groupOf('shinryu');
    delete dryGroup.inWater;
    const dry = liveBattle('shinryu', { party: shinryuBuild, group: dryGroup });
    resolveAbility(dry.ctx, dry.at(SHINRYU), withoutShatterByte(dry), ['rikku']);
    expect(has(dry.at('rikku'), 'petrify')).toBe(true);
    expect(has(dry.at('rikku'), 'eject')).toBe(false);
    expect(dry.at('rikku').removed).not.toBe(true);
    const wet = liveBattle('shinryu', { party: shinryuBuild });
    resolveAbility(wet.ctx, wet.at(SHINRYU), withoutShatterByte(wet), ['rikku']);
    expect(has(wet.at('rikku'), 'eject')).toBe(true);
    expect(wet.at('rikku').removed).toBe(true);
  });

  /** A party with Ribbon and Stoneproof on everyone's armour (in place of Auto-Potion and Defense +20 percent). */
  function warded(abilities: Array<'ribbon' | 'stoneproof'>): FFXPartyBuild {
    const party = structuredClone(shinryuBuild);
    for (const m of party.members) m.equipment.armor = { ...m.equipment.armor, slots: 4, autoAbilities: ['auto-haste', 'auto-protect', ...abilities, ...(abilities.length === 1 ? (['auto-potion'] as const) : [])] };
    return party;
  }

  for (const ward of [['ribbon'], ['stoneproof'], ['ribbon', 'stoneproof']] as Array<Array<'ribbon' | 'stoneproof'>>) {
    it(`T0 (E3): ${ward.join(' and ')} on the swimmer is on (a chance-254 Petrify cannot land), and the Eraser's 255 still lands and shatters`, () => {
      const t = liveBattle('shinryu', { party: warded(ward) });
      const tidus: FFXCombatant = t.at('tidus');
      expect(tidus.immunities['petrify'], 'the ward is on: the Petrify resistance byte is 255').toBe(255);
      // The control: the same row with the chance at 254 meets the ward and does nothing.
      const base = eraser(t);
      const control: AbilityDef = { ...base, id: 'shinryu-eraser-254', statusEffects: [{ status: 'petrify', chance: 254, duration: 254 }], record: { ...base.record!, chances: [[2, 254]] } };
      resolveAbility(t.ctx, t.at(SHINRYU), control, ['tidus']);
      expect(has(tidus, 'petrify'), 'chance 254 is stopped by the ward').toBe(false);
      expect(tidus.alive).toBe(true);
      // The Eraser: chance 255 ignores the ward (the status step: "the chance is 255, or the resistance is not 255 and ...").
      resolveAbility(t.ctx, t.at(SHINRYU), base, ['tidus']);
      expect(has(tidus, 'petrify'), 'chance 255 lands through the ward').toBe(true);
      expect(tidus.removed).toBe(true);
      expect(tidus.hp).toBe(0);
    });
  }
});

describe('Shining: eight hits, each on a random member, magical, capped at 9,999 (RE 3)', () => {
  const shining = (seed: number) => {
    const t = liveBattle('shinryu', { party: shinryuBuild, seed });
    resolveAbility(t.ctx, t.at(SHINRYU), t.ctx.content.ability(SHINING)!, []);
    return t.events.filter((e) => e.type === 'damage');
  };

  it('eight damage events a cast, and over 30 seeds they land on more than one member (a hit re-rolls its target)', () => {
    const spread = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const hits = shining(seed);
      expect(hits, `seed ${seed}`).toHaveLength(8);
      for (const h of hits) if (h.type === 'damage') spread.add(h.targetId);
    }
    expect([...spread].sort()).toEqual(['rikku', 'tidus', 'wakka']);
  });

  it('with one swimmer standing all eight hit him', () => {
    const t = liveBattle('shinryu', { party: shinryuBuild });
    for (const id of ['tidus', 'wakka']) give(t.at(id), 'ko'), (t.at(id).alive = false), (t.at(id).hp = 0);
    resolveAbility(t.ctx, t.at(SHINRYU), t.ctx.content.ability(SHINING)!, []);
    const hits = t.events.filter((e) => e.type === 'damage');
    expect(hits).toHaveLength(8);
    expect(new Set(hits.map((h) => (h.type === 'damage' ? h.targetId : '')))).toEqual(new Set(['rikku']));
  });
});

describe('the numbers against the preset (RE 4, arithmetic on the kernels)', () => {
  const ranges = (() => {
    const attack: number[] = [];
    const shiningHits: number[] = [];
    const blows: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 200; i++) {
        let d;
        try { d = nextInput(engine, false); } catch { break; }
        engine.submit(swing(d) ?? defend());
      }
      let who: string | undefined;
      for (const e of log(engine)) {
        if (e.type === 'action-start') who = e.abilityId ?? `${e.actorId}:${e.command.kind}`;
        if (e.type === 'damage' && e.sourceId === SHINRYU && !e.crit && who === ATTACK) attack.push(e.amount);
        if (e.type === 'damage' && e.sourceId === SHINRYU && who === SHINING) shiningHits.push(e.amount);
        if (e.type === 'damage' && e.targetId === SHINRYU) blows.push(e.amount);
      }
    }
    return { attack, shiningHits, blows };
  })();

  it('every party blow is exactly 99,999 (the cap; the Celestial formula needs no defence term), so 21 end it', () => {
    expect(ranges.blows.length).toBeGreaterThan(200);
    expect(new Set(ranges.blows)).toEqual(new Set([99_999]));
    expect(Math.ceil(2_000_000 / 99_999)).toBe(21);
  });

  it('the Attack and the counter: 328 to 370 against the capped party with Protect (the note), 20 percent less with Defense +20 percent: 263 to 296', () => {
    expect(ranges.attack.length).toBeGreaterThan(100);
    expect(Math.min(...ranges.attack)).toBeGreaterThanOrEqual(262);
    expect(Math.max(...ranges.attack)).toBeLessThanOrEqual(296);
  });

  it('one hit of Shining: 75 to 84 against MDEF 255 (the note)', () => {
    expect(ranges.shiningHits.length).toBeGreaterThan(80);
    expect(Math.min(...ranges.shiningHits)).toBeGreaterThanOrEqual(75);
    expect(Math.max(...ranges.shiningHits)).toBeLessThanOrEqual(84);
  });
});

describe('the win: AP, no gil, the drops', () => {
  it('a win pays 50,000 AP (Overkill included), no gil, and the drop slot: Wings to Discovery or Dark Matter, doubled by the Overkill the killing blow is', () => {
    const engine = newEngine(9);
    shinryu(engine).hp = 20;
    const d = inputFor(engine, 'tidus');
    engine.submit(swing(d)!);
    const over = engine.nextDecision();
    expect(over.kind).toBe('battle-over');
    if (over.kind !== 'battle-over') return;
    expect(over.result.outcome).toBe('victory');
    expect(over.result.gil ?? 0).toBe(0);
    expect(over.result.ap).toBe(50_000);
    expect(over.result.drops).toHaveLength(1);
    const drop = over.result.drops[0]!;
    expect(['wings-to-discovery', 'dark-matter']).toContain(drop.itemId);
    expect(drop.count).toBe(2); // the blow that ends it is the 99,999 cap, which is its Overkill threshold
  });
});

describe('determinism', () => {
  it('the same seed gives the same battle, and a different seed a different one', () => {
    const run = (seed: number): string => {
      const engine = newEngine(seed);
      for (let i = 0; i < 80; i++) {
        let d;
        try { d = nextInput(engine, false); } catch { break; }
        engine.submit(swing(d) ?? defend());
      }
      return actionList(log(engine)).join('|') + `|${actor(engine, 'tidus').hp},${actor(engine, 'wakka').hp},${actor(engine, 'rikku').hp}`;
    };
    expect(run(7)).toBe(run(7));
    const many = new Set([1, 2, 3, 4, 5, 6].map(run));
    expect(many.size).toBeGreaterThan(1);
  });
});
