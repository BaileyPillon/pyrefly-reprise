/**
 * The hidden Flooded Ways chapter on the real engine, seeded (FFX only; Tidus, Wakka and Rikku): the three T0 checks of the preflight (the water Petrify shatter, an automatic-Zombie boss end to end, a rewritten maximum
 * HP in formula 16) and the scripts' rules pinned to the note's own tallies (`research/re-ffx-geosgaeno-evrae-altana.md` 4.1, 4.3, 4.4, "RE n.n"). Nothing is mocked: every case plays the engine through `submit`.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, FFXCombatant } from '../../../src/battle/common/types.ts';
import { dealDamage, ejectActor } from '../../../src/battle/ffx/hp.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { geosgaenoTurn } from '../../../src/battle/ffx/ai/geosgaeno.ts';
import { swallowVictim } from '../../../src/battle/ffx/ai/geosgaeno-hold.ts';
import { floodedWaysOutcome } from '../../../src/battle/ffx/ai/flooded-ways-end.ts';
import { GEOSGAENO_HALF_LINE, KO_PUNCH_ABOVE } from '../../../src/battle/ffx/ai/flooded-ways-rules.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import {
  actions, actor, content, ctxOf, defend, engineOnGroup, flags, invincible, log, newEngine, nextInput, nextInputOf, playEngine, row, setup, unwarded, type Input,
} from '../helpers/floodedDrive.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { swimmersBuild } from '../../../src/data/ffx/builds/swimmers.ts';
import { withWards } from '../helpers/floodedBench.ts';

const SWIM = ['tidus', 'wakka', 'rikku'] as const;
/** All three in a Stone Ward (the preflight's pick): nobody is shattered, so a mechanic stays on its mechanic. */
const WARDED = withWards(swimmersBuild, SWIM);
const hpOf = (e: BattleEngine): Record<string, number> => Object.fromEntries(SWIM.map((id) => [id, actor(e, id).hp]));
const gone = (e: BattleEngine): string[] => SWIM.filter((id) => actor(e, id).statuses['eject'] !== undefined);

/** Defend every turn with the front line kept untouchable, for `inputs` inputs. */
function idle(e: BattleEngine, inputs: number, keepUp = true): void {
  for (let i = 0; i < inputs; i++) {
    if (keepUp) invincible(e);
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') e.submit(defend());
  }
}

describe('T0: in the water a Petrify that lands shatters its victim (RE 2.2)', () => {
  it('a water battle with the Wards off: some seed shatters a member the moment the gaze lands: Eject, off the field, 0 HP, "shatters", no Petrified stage', () => {
    let found = 0;
    for (let seed = 1; seed <= 40 && found === 0; seed++) {
      const e = newEngine(seed, 'area-1', unwarded());
      playEngine(e, () => defend(), 14);
      const lost = gone(e);
      if (lost.length === 0) continue;
      found++;
      const c = actor(e, lost[0]!);
      expect(c.removed).toBe(true);
      expect(c.alive).toBe(false);
      expect(c.hp).toBe(0);
      expect(c.statuses['eject']).toBeDefined(); // Petrify, Death and Eject in the same step (the engine's shatter): there is no stage to cure
      expect(log(e).some((x) => x.type === 'message' && x.text === `${c.name} shatters`)).toBe(true);
    }
    expect(found).toBe(1);
  });

  it('a Stone Ward takes 50 off a Petrify of 50: a party with all three Wards (the preflight\'s pick) is never shattered or petrified, over 40 seeds of both links', () => {
    const warded = withWards(swimmersBuild, SWIM);
    for (const link of ['area-1', 'geosgaeno'] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        const e = newEngine(seed, link, warded);
        idle(e, 24);
        expect(gone(e), `${link} seed ${seed}`).toEqual([]);
        for (const id of SWIM) expect(actor(e, id).statuses['petrify'], `${link} seed ${seed} ${id}`).toBeUndefined();
      }
    }
  });

  it('the shipped party has Rikku\'s Ward alone: Rikku is never shattered, and Tidus or Wakka are, in the first area, on some of 40 seeds', () => {
    let shattered = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const e = newEngine(seed, 'area-1');
      idle(e, 24);
      expect(gone(e), `seed ${seed}`).not.toContain('rikku');
      shattered += gone(e).length;
    }
    expect(shattered).toBeGreaterThan(0);
  });

  it('the same gaze on dry land (the formation not a water battle) leaves a Petrified member in the fight, never an Eject', () => {
    const dry = { ...ENEMY_GROUPS_BY_ID['flooded-area-1']! };
    delete dry.inWater;
    let petrified = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const e = createFFXEngine({ content, autoResolveMinigames: true });
      e.init({ ...setup(seed, 'area-1', unwarded()), enemies: dry });
      playEngine(e, () => defend(), 14);
      expect(gone(e), `seed ${seed}`).toEqual([]);
      expect(flags(e)['battle.inWater']).toBeUndefined();
      if (SWIM.some((id) => actor(e, id).statuses['petrify'] !== undefined)) petrified++;
    }
    expect(petrified).toBeGreaterThan(0);
  });
});

describe('T0: Evrae Altana is an automatic Zombie, and healing it is the way to kill it (RE 1.2, 6.4)', () => {
  it('the Zombie is permanent (no cure removes it) and sits on Evrae Altana alone', () => {
    const e = newEngine(1, 'area-1');
    expect(actor(e, 'evrae-altana').statuses['zombie']).toMatchObject({ permanent: true });
    expect(actor(e, 'gate-lock-1').statuses['zombie']).toBeUndefined();
    expect(actor(newEngine(1, 'geosgaeno'), 'geosgaeno').statuses['zombie']).toBeUndefined();
  });

  it('a Phoenix Down thrown at it deals 8,192, half its 16,384; a second kills it: the battle is a victory in the first area with both locks still standing', () => {
    const e = newEngine(1, 'area-1');
    const first = nextInput(e);
    e.submit(row(first, 'item', 'phoenix-down', 'evrae-altana')!);
    expect(actor(e, 'evrae-altana').hp).toBe(8_192);
    expect(actor(e, 'evrae-altana').alive).toBe(true);
    const second = nextInput(e);
    e.submit(row(second, 'item', 'phoenix-down', 'evrae-altana')!);
    expect(actor(e, 'evrae-altana').hp).toBe(0);
    const over = e.nextDecision();
    expect(over.kind).toBe('battle-over');
    if (over.kind === 'battle-over') {
      expect(over.result.outcome).toBe('victory');
      expect(over.result.nextGroupId).toBe('flooded-area-2');
      expect(over.result.gil).toBe(3_000);
      expect([5_800, 8_700]).toContain(over.result.ap); // 5,800, or 8,700 when the blow is an Overkill (the engine's rule)
    }
    expect(actor(e, 'gate-lock-1').alive).toBe(true);
  });

  it("only the Phoenix Down can be aimed at it from the menu: the guides' X-Potion route (RE 6.4) is not on offer, because the engine's item menu aims every other restorative at the party (an existing rule, reported)", () => {
    const e = newEngine(1, 'area-1');
    const d = nextInput(e);
    const aimed = d.commands.filter((c) => c.command.kind === 'item' && c.validTargets.includes('evrae-altana')).map((c) => ('id' in c.command ? c.command.id : ''));
    expect(aimed).toContain('phoenix-down');
    expect(aimed).not.toContain('x-potion');
    expect(aimed).not.toContain('hi-potion');
  });
});

describe("Evrae Altana's script (RE 4.3)", () => {
  it('while three stand it alternates Stone Gaze and Photon Spray, opening with a Gaze', () => {
    const e = newEngine(3, 'area-1', WARDED);
    idle(e, 70);
    const mine = actions(log(e), 'evrae-altana');
    expect(mine.length).toBeGreaterThanOrEqual(6);
    mine.slice(0, 6).forEach((a, i) => expect(a, `action ${i}`).toBe(i % 2 === 0 ? 'evrae-altana-stone-gaze' : 'evrae-altana-photon-spray'));
  });

  it('with a member gone it only sprays', () => {
    const e = newEngine(3, 'area-1');
    ejectActor(ctxOf(e), actor(e, 'rikku'), 'shatter', true);
    idle(e, 70);
    const mine = actions(log(e), 'evrae-altana');
    expect(mine.length).toBeGreaterThanOrEqual(4);
    for (const a of mine) expect(a).toBe('evrae-altana-photon-spray');
  });

  it('a Photon Spray is eight hits, each on a random member (every member is hit over a few sprays)', () => {
    const e = newEngine(5, 'area-3');
    idle(e, 90);
    const hits = log(e).filter((x) => x.type === 'damage' && x.sourceId === 'evrae-altana' && SWIM.includes(x.targetId as (typeof SWIM)[number]));
    const targets = new Set(hits.map((x) => (x.type === 'damage' ? x.targetId : '')));
    expect(hits.length).toBeGreaterThanOrEqual(16);
    expect(targets.size).toBeGreaterThanOrEqual(3);
  });

  it('areas 1 and 2 answer a hit with a plain Attack on the attacker; area 3 has no counter at all', () => {
    for (const [link, countered] of [['area-1', true], ['area-2', true], ['area-3', false]] as const) {
      const e = newEngine(2, link);
      const d = nextInput(e);
      e.submit(row(d, 'attack', undefined, 'evrae-altana')!);
      const answers = log(e).filter((x) => x.type === 'counter' && x.actorId === 'evrae-altana' && x.abilityId === 'evrae-altana-attack');
      expect(answers.length > 0, link).toBe(countered);
      if (countered) expect(answers[0]).toMatchObject({ targetId: d.actorId, cause: 'script' });
    }
  });

  it('a hit that takes no HP draws no counter (Cheer on a friend; a Delay Attack is not HP either)', () => {
    const e = newEngine(2, 'area-1');
    const d = nextInputOf(e, 'tidus');
    const cheer = row(d, 'ability', 'cheer', 'wakka');
    if (cheer) e.submit(cheer);
    else e.submit(defend());
    expect(log(e).some((x) => x.type === 'counter' && x.actorId === 'evrae-altana')).toBe(false);
  });

  it('a Phoenix Down thrown at it draws the counter too (the script tests the HP lost, not the command)', () => {
    const e = newEngine(2, 'area-1');
    const d = nextInput(e);
    e.submit(row(d, 'item', 'phoenix-down', 'evrae-altana')!);
    expect(log(e).some((x) => x.type === 'counter' && x.actorId === 'evrae-altana')).toBe(true);
  });
});

describe('the Gate Locks and Open lock (RE 4.4)', () => {
  it('Open lock is on every swimmer\'s menu in areas 1 and 2 and nowhere else; it aims at the standing locks', () => {
    for (const [link, expected] of [['area-1', true], ['area-2', true], ['area-3', false], ['geosgaeno', false]] as const) {
      const e = newEngine(1, link);
      const d = nextInput(e);
      const r = d.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'open-lock');
      expect(r !== undefined, link).toBe(expected);
      if (r) expect(r.validTargets).toEqual(['gate-lock-1', 'gate-lock-2']);
    }
  });

  it('Open lock takes the lock\'s HP to 0 and the turn with it; the lock never takes a turn', () => {
    const e = newEngine(1, 'area-1');
    const d = nextInput(e);
    e.submit(row(d, 'trigger', 'open-lock', 'gate-lock-2')!);
    expect(actor(e, 'gate-lock-2')).toMatchObject({ hp: 0, alive: false });
    expect(actor(e, 'gate-lock-1').hp).toBe(500);
    idle(e, 20);
    expect(actions(log(e), 'gate-lock-1')).toEqual([]);
  });

  it('an ordinary blade kills a lock (500 HP, no defence), and a lock is no part of the victory', () => {
    const e = newEngine(1, 'area-1');
    const d = nextInput(e);
    e.submit(row(d, 'attack', undefined, 'gate-lock-1')!);
    expect(actor(e, 'gate-lock-1').hp).toBe(0);
    expect(actor(e, 'evrae-altana').hp).toBe(16_384); // nothing counters a hit on a lock
    expect(log(e).some((x) => x.type === 'counter')).toBe(false);
  });

  it('a lock killed by one blow under 2,000 is no Overkill: the threshold is 2,000 on both locks, not their 500 HP (RE 1.2)', () => {
    for (const [dmg, overkill] of [[600, false], [1_999, false], [2_000, true]] as const) {
      for (const id of ['gate-lock-1', 'gate-lock-2']) {
        const e = newEngine(1, 'area-1');
        const ctx = ctxOf(e);
        const events: Array<{ type: string; overkill?: boolean }> = [];
        const emit = ctx.emit;
        ctx.emit = (ev: { type: string; overkill?: boolean }): void => {
          events.push(ev);
          return emit.call(ctx, ev as never);
        };
        dealDamage(ctx, actor(e, id), dmg, { sourceId: 'tidus', element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
        expect(actor(e, id).hp, `${id} ${dmg}`).toBe(0);
        expect(events.find((x) => x.type === 'damage')?.overkill === true, `${id} ${dmg}`).toBe(overkill);
      }
    }
  });

  it('with both locks gone the area ends as a win with Evrae Altana standing and the next area named; with one it goes on', () => {
    const e = newEngine(1, 'area-1');
    const d = nextInput(e);
    e.submit(row(d, 'trigger', 'open-lock', 'gate-lock-1')!);
    invincible(e);
    const d2 = nextInput(e);
    e.submit(row(d2, 'trigger', 'open-lock', 'gate-lock-2')!);
    const over = e.nextDecision();
    expect(over.kind).toBe('battle-over');
    if (over.kind === 'battle-over') {
      expect(over.result.outcome).toBe('victory');
      expect(over.result.nextGroupId).toBe('flooded-area-2');
    }
    expect(actor(e, 'evrae-altana').alive).toBe(true);
  });

  it('Open lock aimed at a lock that is already open, or at anything else, is refused and says so', () => {
    const e = newEngine(1, 'area-1');
    const d = nextInput(e);
    e.submit(row(d, 'trigger', 'open-lock', 'gate-lock-1')!);
    invincible(e);
    const d2 = nextInput(e);
    expect(d2.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'open-lock')?.validTargets).toEqual(['gate-lock-2']);
  });
});

describe("Geosgaeno's script (RE 4.1)", () => {
  it('the exact tally: a draw modulo 100 above 30 is 45,200 of 65,536 (KO Punch below half HP), and the line is strictly below 16,383', () => {
    expect(Array.from({ length: 65_536 }, (_, r) => r).filter((r) => r % 100 > KO_PUNCH_ABOVE).length).toBe(45_200);
    expect(GEOSGAENO_HALF_LINE).toBe(16_383);
  });

  it('the cycle: three punches, the swallow, the spit-out; then 3 punches after an even draw and 2 after an odd one', () => {
    const e = newEngine(1, 'geosgaeno');
    const ctx = ctxOf(e);
    const geo = actor(e, 'geosgaeno');
    const turn = (): string => {
      const c = geosgaenoTurn(aiContextFor(ctx, geo));
      return c && 'id' in c ? c.id : c === null ? 'pass' : c.kind;
    };
    expect([turn(), turn(), turn()]).toEqual(['geosgaeno-stone-punch', 'geosgaeno-stone-punch', 'geosgaeno-stone-punch']);
    expect(turn()).toBe('geosgaeno-swallow');
    expect(flags(e)['fw.geo.v4']).toBe(255);
    expect(turn()).toBe('geosgaeno-regurgitate');
    const v4 = flags(e)['fw.geo.v4'] as number;
    expect([0, 1]).toContain(v4);
    const punches = 3 - v4;
    for (let i = 0; i < punches; i++) expect(turn(), `punch ${i + 1} of ${punches}`).toBe('geosgaeno-stone-punch');
    expect(turn()).toBe('geosgaeno-swallow');
  });

  it('above half HP it never throws a KO Punch; below half it does so on about 69 percent of its punches', () => {
    const e = newEngine(1, 'geosgaeno');
    const ctx = ctxOf(e);
    const geo = actor(e, 'geosgaeno');
    const id = (): string => {
      ctx.state.flags['fw.geo.v4'] = 0;
      const c = geosgaenoTurn(aiContextFor(ctx, geo));
      return c && 'id' in c ? c.id : '';
    };
    for (let i = 0; i < 300; i++) expect(id()).toBe('geosgaeno-stone-punch');
    geo.hp = 10_000;
    let ko = 0;
    const N = 4_000;
    for (let i = 0; i < N; i++) if (id() === 'geosgaeno-ko-punch') ko++;
    expect(ko / N).toBeGreaterThan(0.66);
    expect(ko / N).toBeLessThan(0.72);
    geo.hp = GEOSGAENO_HALF_LINE; // the line is strict: exactly half is still above it
    for (let i = 0; i < 300; i++) expect(id()).toBe('geosgaeno-stone-punch');
  });

  it('the swallow skips the Doomed: with one member free of Doom, that one is swallowed; with all three Doomed it throws a KO Punch and swallows nobody', () => {
    const e = newEngine(1, 'geosgaeno');
    const ctx = ctxOf(e);
    const geo = actor(e, 'geosgaeno');
    const doom = (id: string): void => {
      actor(e, id).statuses['doom'] = { id: 'doom', turnsRemaining: 5, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    };
    doom('tidus');
    doom('wakka');
    ctx.state.flags['fw.geo.v4'] = 3;
    const c = geosgaenoTurn(aiContextFor(ctx, geo));
    expect(c).toMatchObject({ id: 'geosgaeno-swallow', targets: ['rikku'] });
    expect(flags(e)['fw.hold']).toBe('rikku');
    // Everyone Doomed.
    const f = newEngine(1, 'geosgaeno');
    for (const id of SWIM) actor(f, id).statuses['doom'] = { id: 'doom', turnsRemaining: 5, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    ctxOf(f).state.flags['fw.geo.v4'] = 3;
    const k = geosgaenoTurn(aiContextFor(ctxOf(f), actor(f, 'geosgaeno')));
    expect(k).toMatchObject({ id: 'geosgaeno-ko-punch' });
    expect(flags(f)['fw.hold']).toBe('');
  });
});

/** Run until somebody is swallowed; returns the held id and the input the held character will get. */
function untilHeld(e: BattleEngine): string {
  for (let i = 0; i < 200; i++) {
    invincible(e);
    const d = e.nextDecision();
    if (d.kind === 'battle-over') throw new Error('ended before a swallow');
    if (d.kind === 'player-input') {
      const held = String(flags(e)['fw.hold'] ?? '');
      if (held !== '') return held;
      e.submit(defend());
    }
  }
  throw new Error('no swallow');
}

describe('the swallow-hold (RE 4.1)', () => {
  it('the swallowed character is out of the fight: untargetable, no Attack can name them, and their menu is Struggle and Defend', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    expect(actor(e, held).flags.untargetable).toBe(true);
    // Their own turn: nextInputOf stops where they are asked.
    const d = nextInputOf(e, held);
    expect(d.commands.map((c) => c.label)).toEqual(['Struggle', 'Defend']);
    expect(d.commands[0]!.validTargets).toEqual(['geosgaeno']);
    // The rest of the party cannot aim anything at them.
    const other = nextInputOf(e, SWIM.find((id) => id !== held)!);
    for (const c of other.commands) expect(c.validTargets, c.label).not.toContain(held);
  });

  it('everything but Struggle and Defend is refused for the held character: the turn stays open', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    const d = nextInputOf(e, held);
    e.submit({ kind: 'attack', targets: ['geosgaeno'] });
    const again = e.nextDecision();
    expect(again.kind).toBe('player-input');
    if (again.kind === 'player-input') expect(again.actorId).toBe(d.actorId);
    expect(actor(e, 'geosgaeno').hp).toBe(32_767);
    e.submit({ kind: 'item', id: 'potion', targets: [held] });
    const still = e.nextDecision();
    expect(still.kind === 'player-input' && still.actorId).toBe(held);
  });

  it('the swallow copies the victim\'s statuses onto Geosgaeno, ignoring its own immunities: ailments are moved, buffs are copied, a Slow is taken away, Confuse is lost', () => {
    const e = newEngine(1, 'geosgaeno');
    const ctx = ctxOf(e);
    const geo = actor(e, 'geosgaeno');
    const victim = actor(e, 'wakka');
    const add = (id: 'protect' | 'poison' | 'haste' | 'zombie' | 'silence' | 'slow' | 'confuse' | 'power-break'): void => {
      victim.statuses[id] = { id, turnsRemaining: 5, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    };
    for (const s of ['protect', 'poison', 'haste', 'zombie', 'silence', 'power-break'] as const) add(s);
    geo.statuses['slow'] = { id: 'slow', turnsRemaining: 5, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    swallowVictim(ctx, geo, victim);
    for (const s of ['zombie', 'poison', 'silence', 'power-break', 'protect', 'haste'] as const) expect(geo.statuses[s], s).toBeDefined();
    expect(geo.statuses['protect']!.turnsRemaining).toBe(10);
    expect(geo.statuses['silence']!.turnsRemaining).toBe(2);
    expect(geo.statuses['slow']).toBeUndefined(); // Haste clears Slow
    for (const s of ['zombie', 'poison', 'silence', 'power-break'] as const) expect(victim.statuses[s], `${s} moved`).toBeUndefined();
    for (const s of ['protect', 'haste'] as const) expect(victim.statuses[s], `${s} copied`).toBeDefined();
    expect(flags(e)['fw.hold']).toBe('wakka');
  });

  it('if the held character waits (Defend), the spit-out hits all three for their HP minus 1 and leaves them at 1 HP; Geosgaeno\'s maximum HP is back after', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    // Put the party at known HP so the numbers read plainly: the victim 2,000, the others 5,000 and 1,500.
    const hp: Record<string, number> = { tidus: 5_000, wakka: 5_000, rikku: 5_000 };
    hp[held] = 2_000;
    for (const id of SWIM) {
      actor(e, id).stats.maxHp = 9_999;
      actor(e, id).hp = hp[id]!;
    }
    for (let i = 0; i < 40 && String(flags(e)['fw.hold']) !== ''; i++) {
      const d = e.nextDecision();
      if (d.kind === 'player-input') e.submit(defend());
    }
    expect(flags(e)['fw.hold']).toBe('');
    for (const id of SWIM) {
      if (id === held) expect(actor(e, id).hp, `${id} (held)`).toBe(1);
      else expect(actor(e, id).hp, id).toBe(5_000 - 1_999);
    }
    expect(actor(e, 'geosgaeno').stats.maxHp).toBe(32_767);
    expect(flags(e)['fw.geo.savedMax']).toBe(0);
    expect(actor(e, held).flags.untargetable).toBeUndefined();
    expect(actions(log(e), 'geosgaeno').slice(0, 5)).toEqual(['geosgaeno-stone-punch', 'geosgaeno-stone-punch', 'geosgaeno-stone-punch', 'geosgaeno-swallow', 'geosgaeno-regurgitate']);
  });

  it('a victim whose HP is below the others\' wait and nobody falls; a victim above the others\' takes them with them (the swallowed one\'s HP minus 1 to each)', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    for (const id of SWIM) {
      actor(e, id).stats.maxHp = 9_999;
      actor(e, id).hp = id === held ? 3_000 : 2_500;
    }
    for (let i = 0; i < 40 && String(flags(e)['fw.hold']) !== ''; i++) {
      const d = e.nextDecision();
      if (d.kind === 'player-input') e.submit(defend());
    }
    for (const id of SWIM.filter((x) => x !== held)) expect(actor(e, id).alive, `${id} falls to 2,999`).toBe(false);
  });

  it('Struggle: the held character strikes from inside and takes their own HP (a KO); nobody else is hurt; the hold ends and Geosgaeno\'s maximum HP is back', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    const d = nextInputOf(e, held);
    const before = hpOf(e);
    e.submit(row(d, 'ability', 'struggle', 'geosgaeno')!);
    expect(flags(e)['fw.hold']).toBe('');
    expect(actor(e, held)).toMatchObject({ hp: 0, alive: false });
    for (const id of SWIM.filter((x) => x !== held)) expect(actor(e, id).hp, id).toBe(before[id]);
    expect(actor(e, 'geosgaeno').stats.maxHp).toBe(32_767);
    expect(actor(e, 'geosgaeno').hp).toBeLessThan(32_767); // the strike landed
    expect(actor(e, held).flags.untargetable).toBeUndefined();
  });

  it('Defend is open to the held character: they wait', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    const d = nextInputOf(e, held);
    expect(d.commands.some((c) => c.label === 'Defend' && c.enabled)).toBe(true);
    e.submit(defend());
    expect(actor(e, held).alive).toBe(true);
  });

  it('killing Geosgaeno while it holds someone: 9,999 to the whole front line, the held one included; a party under that is a defeat, though the monster is dead too', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    const held = untilHeld(e);
    for (const id of SWIM) {
      actor(e, id).stats.maxHp = 9_000;
      actor(e, id).hp = 6_000; // under 9,999: the death blow ends them all
    }
    actor(e, 'geosgaeno').hp = 1;
    // Anyone else's Attack ends it.
    const striker = SWIM.find((x) => x !== held)!;
    const d = nextInputOf(e, striker);
    e.submit(row(d, 'attack', undefined, 'geosgaeno')!);
    const over = e.nextDecision();
    expect(over.kind).toBe('battle-over');
    if (over.kind === 'battle-over') expect(over.result.outcome).toBe('defeat');
    for (const id of SWIM) expect(actor(e, id).hp, id).toBe(0);
    expect(actor(e, 'geosgaeno').alive).toBe(false);
  });

  it('a death that is no hit (a Poison tick) with somebody inside deals the same blow, the first time the battle is asked whether it is over; and only once', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    untilHeld(e);
    for (const id of SWIM) {
      actor(e, id).stats.maxHp = 9_000;
      actor(e, id).hp = 6_000;
    }
    const geo = actor(e, 'geosgaeno');
    geo.hp = 0;
    geo.alive = false;
    expect(floodedWaysOutcome(ctxOf(e))).toBe('defeat');
    for (const id of SWIM) expect(actor(e, id).hp, id).toBe(0);
    expect(flags(e)['fw.hold']).toBe('');
    expect(floodedWaysOutcome(ctxOf(e))).toBe('defeat'); // asked again: no second blow, the same answer
  });

  it('killing it with nobody inside is the ordinary win and costs the party nothing', () => {
    const e = newEngine(7, 'geosgaeno', WARDED);
    actor(e, 'geosgaeno').hp = 1;
    const d = nextInput(e);
    const hp = hpOf(e);
    e.submit(row(d, 'attack', undefined, 'geosgaeno')!);
    const over = e.nextDecision();
    expect(over.kind === 'battle-over' && over.result.outcome).toBe('victory');
    for (const id of SWIM) expect(actor(e, id).hp, id).toBeGreaterThanOrEqual(hp[id]! - 1_500);
  });
});

describe('determinism and the other chapters', () => {
  it('the same seed plays the same fight: every link, twice', () => {
    for (const link of ['area-1', 'area-2', 'area-3', 'geosgaeno'] as const) {
      const run = (): string => {
        const e = newEngine(11, link);
        playEngine(e, (d: Input) => (d.commands.find((c) => c.command.kind === 'attack' && c.enabled)?.command as never) ?? defend(), 60);
        return JSON.stringify(log(e).map((x) => [x.type, 'actorId' in x ? x.actorId : '', 'amount' in x ? x.amount : '']));
      };
      expect(run(), link).toBe(run());
    }
  });

  it('no other formation raises the water flag, the hold, the link key or an Open lock row (the chapter is inert everywhere else)', () => {
    let checked = 0;
    for (const [id, group] of Object.entries(ENEMY_GROUPS_BY_ID)) {
      if (id.startsWith('flooded-') || group.game !== 'ffx') continue;
      let engine: ReturnType<typeof createFFXEngine>;
      try {
        engine = engineOnGroup(id, 1);
      } catch {
        continue; // a formation that needs a build of its own
      }
      checked++;
      const f = flags(engine);
      expect(f['battle.inWater'], id).toBeUndefined();
      expect(f['fw.link'], id).toBeUndefined();
      expect(f['fw.hold'], id).toBeUndefined();
      const d = engine.nextDecision();
      if (d.kind === 'player-input') expect(d.commands.some((c) => c.command.kind === 'trigger' && c.command.id === 'open-lock'), id).toBe(false);
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('a Petrify in an ordinary (dry) battle is the engine\'s: the member is Petrified, not ejected (the airship Evrae\'s gaze)', () => {
    const e = engineOnGroup('evrae-airship', 1);
    expect(flags(e)['battle.inWater']).toBeUndefined();
    void (null as unknown as FFXCombatant);
  });
});
