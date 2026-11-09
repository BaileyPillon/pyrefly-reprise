/**
 * The three fights on the real engine (FFX only; the hidden Omega Ruins chapter): each fight played to a result on three seeds, twice (the same seed gives the same fight), the damage of every move against the note's
 * arithmetic (`research/re-ffx-omega-ultima-nemesis.md` section 6, the endgame preset), the statuses, the rewards, the chain's heal, and the T0 questions the preflight left open (section 13): does the engine raise the
 * reply for the no-damage special commands, what happens to a blow that kills, and can a Phoenix Down stand a party that is all down at once (it cannot).
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { NM_COUNTER_FLAG, NM_STEP_FLAG, WEAPON_MOVES as M } from '../../../src/battle/ffx/ai/weapons-rules.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { omegaRuinsBuild } from '../../../src/data/ffx/builds/omega-ruins.ts';
import { NEMESIS_GROUP_ID, OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { advisorLine, carelessLine, playAct, playChain, withPhoenixDowns } from '../helpers/omegaRuinsBench.ts';
import * as H from '../helpers/omegaRuinsDrive.ts';

type Engine = ReturnType<typeof H.newEngine>;
type Result = Extract<ReturnType<Engine['nextDecision']>, { kind: 'battle-over' }>['result'];

const FRONT = ['tidus', 'yuna', 'lulu'];

/** Make the script stream answer `value` forever (so the foe's draw picks a known branch). */
function forceScript(engine: Engine, value: number): void {
  const ctx = H.ctxOf(engine);
  const real = ctx.rng.on.bind(ctx.rng);
  ctx.rng.on = ((stream: number) => (stream === FfxStream.Script ? ({ int: () => value } as unknown as ReturnType<typeof real>) : real(stream))) as typeof ctx.rng.on;
}

/** Play `engine` to its end with the careless line, returning the result. */
function resultOf(engine: Engine, max = 80): Result {
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result;
    if (d.kind === 'player-input') engine.submit(H.careless(d, engine) ?? H.defend());
  }
  throw new Error('no result');
}

/**
 * Every damage amount of `foe`'s moves in the log, by move, with the party kept up at `hp` (a number past anything the foe does: Armageddon is 99,999) and never defending: a Defend halves a physical blow, and the note's arithmetic
 * (RE 6) has none. The party only defends, and the Defend is taken off again before the foe's next turn (a Cheer would raise Defense, and a Scan only some members have).
 */
function damageBy(group: string, seed: number, until: (e: Engine) => boolean, party: FFXPartyBuild = omegaRuinsBuild, hp = 999_999): Map<string, number[]> {
  const e = H.newEngine(seed, group, party);
  const foe = e.state().enemyIds[0] as string;
  for (let i = 0; i < 6000 && !until(e); i++) {
    for (const id of e.state().activeIds) {
      const c = H.actor(e, id);
      c.stats.maxHp = c.hp = hp;
      delete (c.statuses as Record<string, unknown>)['defend'];
    }
    const d = e.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') e.submit(H.defend());
  }
  const out = new Map<string, number[]>();
  let cur = '';
  for (const ev of e.state().log as BattleEvent[]) {
    if (ev.type === 'action-start') cur = ev.actorId === foe ? (ev.abilityId ?? '') : '';
    else if (ev.type === 'damage' && cur !== '' && ev.targetId !== foe && ev.amount > 0) out.set(cur, [...(out.get(cur) ?? []), ev.amount]);
  }
  return out;
}

function merge(into: Map<string, number[]>, from: Map<string, number[]>): void {
  for (const [k, v] of from) into.set(k, [...(into.get(k) ?? []), ...v]);
}
const range = (a: number[] | undefined): [number, number] => [Math.min(...(a ?? [0])), Math.max(...(a ?? [0]))];

describe('each fight is played to a result on three seeds, twice, with the same fight each time', () => {
  it('Ultima Weapon falls to the first blow of the party (99,999 HP against a Break Damage Limit blow), Omega Weapon in eleven, on every seed', () => {
    for (const seed of [1, 2, 3]) {
      const a = playAct(seed, 0, carelessLine);
      const b = playAct(seed, 0, carelessLine);
      expect(a).toEqual(b);
      expect(a).toMatchObject({ outcome: 'victory', foeHp: 0, kos: 0 });
      expect(a.inputs).toBe(1);
      const o = playAct(seed, 1, carelessLine);
      expect(o).toEqual(playAct(seed, 1, carelessLine));
      expect(o).toMatchObject({ outcome: 'victory', foeHp: 0, kos: 0 });
      expect(o.inputs).toBe(11);
    }
  });

  it('Nemesis kills a party that only swings (the first Ultra Spark takes all three at once and a Phoenix Down cannot stand a party that is all down), and the careless line loses on every seed', () => {
    for (const seed of [1, 2, 3]) {
      const a = playAct(seed, 2, carelessLine);
      expect(a).toEqual(playAct(seed, 2, carelessLine));
      expect(a.outcome).toBe('defeat');
      expect(a.foeHp).toBeGreaterThan(7_000_000); // a Piercing weapon takes 2 to 3 million off before the first Spark, a plain one about 1.5 million
      expect(a.foeTurns).toBeLessThanOrEqual(4);
    }
  });

  it('the advisor line plays Nemesis to a result on three seeds, twice, the same each time', () => {
    for (const seed of [1, 2, 3]) {
      const a = playAct(seed, 2, advisorLine);
      expect(a).toEqual(playAct(seed, 2, advisorLine));
      expect(['victory', 'defeat']).toContain(a.outcome);
      expect(a.foeTurns).toBeGreaterThan(8);
    }
  }, 120_000);
});

describe('the damage of every move against the note\'s arithmetic (RE 6, the endgame preset; no Defend, the front line kept up)', () => {
  it('Ultima Weapon: its Attack never lands on a party with Evasion 255 (accuracy 120 less the Evasion, plus the Luck difference, leaves nothing to roll); Core Energy 112 to 127, Rain 74 to 83 each, Holy 294 to 332', () => {
    const seen = new Map<string, number[]>();
    let attacks = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      merge(seen, damageBy(ULTIMA_GROUP_ID, seed, (e) => H.foeActions(e).length >= 14));
    }
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const e = H.newEngine(seed, ULTIMA_GROUP_ID);
      H.runDefending(e, (en) => H.foeActions(en).length >= 14);
      attacks += H.foeActions(e).filter((a) => a === M.ultimaAttack).length;
    }
    expect(attacks).toBeGreaterThanOrEqual(12);
    expect(seen.get(M.ultimaAttack)).toBeUndefined(); // 0 hits in the 12 or more Attacks of the six seeds
    const core = range(seen.get(M.coreEnergy));
    expect(core[0]).toBeGreaterThanOrEqual(112 - 2);
    expect(core[1]).toBeLessThanOrEqual(127 + 2);
    const rain = range(seen.get(M.shimmeringRain));
    expect(rain[0]).toBeGreaterThanOrEqual(74 - 2);
    expect(rain[1]).toBeLessThanOrEqual(83 + 2);
    const holy = range(seen.get(M.holy));
    if (seen.get(M.holy)) {
      expect(holy[0]).toBeGreaterThanOrEqual(294 - 3);
      expect(holy[1]).toBeLessThanOrEqual(332 + 3);
    }
  });

  it('Omega Weapon: Core Energy 173 to 195, Rain 115 to 130, Nova 242 to 274, Ultima 287 to 324, Demi a quarter of current HP (2,499 from 9,999), Attack 221 to 249 (a critical doubles it)', () => {
    const seen = new Map<string, number[]>();
    for (let seed = 1; seed <= 14; seed++) merge(seen, damageBy(OMEGA_GROUP_ID, seed, (e) => H.foeActions(e).length >= 17, omegaRuinsBuild, 9_999));
    for (const id of [M.omegaAttack, M.coreEnergy, M.shimmeringRain, M.nova, M.ultima, M.demi]) expect(seen.get(id), id).toBeDefined();
    const within = (id: string, lo: number, hi: number): void => {
      const [a, b] = range(seen.get(id));
      expect(a, `${id} low`).toBeGreaterThanOrEqual(lo - 3);
      expect(b, `${id} high`).toBeLessThanOrEqual(hi + 3);
    };
    within(M.coreEnergy, 173, 195);
    within(M.shimmeringRain, 115, 130);
    within(M.nova, 242, 274);
    within(M.ultima, 287, 324);
    // The attack is capped at 99,999 and always hits; the plain blow is 221 to 249, a critical twice that. A Protect halves a physical blow, so the engine's values are the note's halved or not.
    const atk = seen.get(M.omegaAttack)!;
    for (const x of atk) expect(x >= 105 && x <= 252 || x >= 210 && x <= 504, `attack ${x}`).toBe(true);
    // Demi takes a quarter of current HP: 9,999 -> 2,499 (a member already hurt loses less)
    expect(Math.max(...seen.get(M.demi)!)).toBe(2_499);
  }, 120_000);

  it('Nemesis: Ethereal Cannon 19,069 to 21,532, Ultra Spark 27,950 to 31,560 each, Armageddon 99,999 each, Attack 13,975 to 15,780 less a Protect', () => {
    const seen = damageBy(NEMESIS_GROUP_ID, 3, (e) => H.foeActions(e).filter((a) => a === M.armageddon).length >= 4 && H.foeActions(e).includes(M.nemesisAttack));
    for (const id of [M.etherealCannon, M.ultraSpark, M.armageddon, M.nemesisAttack]) expect(seen.get(id), id).toBeDefined();
    const [cl, ch] = range(seen.get(M.etherealCannon));
    expect(cl).toBeGreaterThanOrEqual(19_069 - 5);
    expect(ch).toBeLessThanOrEqual(21_532 + 5);
    const [sl, sh] = range(seen.get(M.ultraSpark));
    expect(sl).toBeGreaterThanOrEqual(27_950 - 5);
    expect(sh).toBeLessThanOrEqual(31_560 + 5);
    expect(new Set(seen.get(M.armageddon))).toEqual(new Set([99_999]));
    // The Attack is 13,975 to 15,780 before a Protect; the party's armour casts Protect on itself, which halves a physical blow. Either reading is the note's number.
    for (const x of seen.get(M.nemesisAttack)!) expect((x >= 13_975 - 5 && x <= 15_780 + 5) || (x >= 6_987 - 5 && x <= 7_890 + 5), `Nemesis Attack ${x}`).toBe(true);
  }, 120_000);
});

describe('statuses', () => {
  it('Ribbon keeps Break off a party (the guides\' Stoneproof/Ribbon): over fourteen Ultima Weapon turns nobody is Petrified; without it, someone is', () => {
    const run = (party: FFXPartyBuild): number => {
      let petrified = 0;
      for (const seed of [1, 2, 3, 4]) {
        const e = H.newEngine(seed, ULTIMA_GROUP_ID, party);
        H.runDefending(e, (en) => H.foeActions(en).length >= 14);
        petrified += (e.state().log as BattleEvent[]).filter((ev) => ev.type === 'status-add' && ev.status === 'petrify').length;
      }
      return petrified;
    };
    expect(run(omegaRuinsBuild)).toBe(0);
    expect(run(withoutRibbon(omegaRuinsBuild))).toBeGreaterThan(0);
  });

  it('Ultra Spark puts Poison, Power Break and Curse on whoever lives through it; Ribbon stops the Poison only, and Slow does not stand on Auto-Haste', () => {
    for (const [party, landed] of [[withoutRibbon(omegaRuinsBuild), true], [omegaRuinsBuild, false]] as const) {
      const e = H.newEngine(2, NEMESIS_GROUP_ID, party);
      const ctx = H.ctxOf(e);
      ctx.state.flags[NM_STEP_FLAG] = 1; // the next non-Attack turn is the Spark
      ctx.state.flags[NM_COUNTER_FLAG] = 0;
      forceScript(e, 1);
      for (let i = 0; i < 200 && !H.foeActions(e).includes(M.ultraSpark); i++) {
        for (const id of FRONT) { const c = H.actor(e, id); c.stats.maxHp = c.hp = 999_999; }
        const d = e.nextDecision();
        if (d.kind === 'battle-over') throw new Error('the battle ended');
        if (d.kind === 'player-input') e.submit(H.defend());
      }
      expect(H.foeActions(e)).toContain(M.ultraSpark);
      for (const id of FRONT) {
        // Ribbon stops the Poison; the Power Break and the Curse (the extra word) are not among the ailments it stops.
      expect(H.has(H.actor(e, id), 'poison'), `${landed ? 'bare' : 'ribbon'} ${id} poison`).toBe(landed);
      for (const s of ['power-break', 'curse']) expect(H.has(H.actor(e, id), s), `${landed ? 'bare' : 'ribbon'} ${id} ${s}`).toBe(true);
      // Slow does not stand on a wearer of Auto-Haste in the engine (the armour's Haste holds), with Ribbon or without.
      expect(H.has(H.actor(e, id), 'slow'), `${landed ? 'bare' : 'ribbon'} ${id} slow`).toBe(false);
      expect(H.has(H.actor(e, id), 'haste'), `${landed ? 'bare' : 'ribbon'} ${id} haste`).toBe(true);
      }
    }
  });
});

function withoutRibbon(party: FFXPartyBuild): FFXPartyBuild {
  const bare = structuredClone(party);
  for (const m of bare.members) m.equipment.armor.autoAbilities = m.equipment.armor.autoAbilities.filter((a) => a !== 'ribbon');
  return bare;
}

describe('Nemesis kills the party unless a second life stands among them (the preflight\'s design fact, RE 6)', () => {
  /** Run Nemesis to its Ultra Spark with `prep` applied to the party first; returns the outcome of the fight if it ended. */
  function afterSpark(prep: (e: Engine) => void, seed = 1): { over: string | null; e: Engine } {
    const e = H.newEngine(seed, NEMESIS_GROUP_ID);
    const ctx = H.ctxOf(e);
    ctx.state.flags[NM_STEP_FLAG] = 1;
    ctx.state.flags[NM_COUNTER_FLAG] = 0;
    forceScript(e, 1);
    prep(e);
    for (let i = 0; i < 100; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') return { over: d.result.outcome, e };
      if (d.kind === 'player-input') {
        if (H.foeActions(e).includes(M.ultraSpark)) return { over: null, e };
        e.submit(H.defend());
      }
    }
    return { over: null, e };
  }

  it('with no Auto-Life on anyone, the Ultra Spark is a defeat at once: Auto-Phoenix needs a living member to use the Phoenix Down', () => {
    expect(afterSpark(() => undefined).over).toBe('defeat');
  });

  it('with Auto-Life on one member, the Spark takes all three but he stands again, and he stands the others up with his Phoenix Downs', () => {
    const r = afterSpark((e) => H.give(H.actor(e, 'yuna'), 'auto-life', 255));
    expect(r.over).toBeNull();
    expect(H.foeActions(r.e)).toContain(M.ultraSpark);
    expect(FRONT.filter((id) => H.actor(r.e, id).alive).length).toBeGreaterThanOrEqual(1);
    expect(H.has(H.actor(r.e, 'yuna'), 'auto-life')).toBe(false); // spent
  });

  it('Armageddon (the counter at 20) is 99,999 on each of them, through Protect, Shell and Shield alike', () => {
    const e = H.newEngine(4, NEMESIS_GROUP_ID);
    H.ctxOf(e).state.flags[NM_COUNTER_FLAG] = 20;
    for (const id of FRONT) { H.give(H.actor(e, id), 'shell'); H.give(H.actor(e, id), 'protect'); H.give(H.actor(e, id), 'auto-life', 255); H.actor(e, id).stats.maxHp = H.actor(e, id).hp = 999_999; }
    for (let i = 0; i < 50 && !H.foeActions(e).includes(M.armageddon); i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') throw new Error('the battle ended');
      if (d.kind === 'player-input') e.submit(H.defend());
    }
    const amounts = (e.state().log as BattleEvent[]).filter((ev) => ev.type === 'damage' && ev.targetId !== 'nemesis').slice(0, 3).map((ev) => (ev.type === 'damage' ? ev.amount : 0));
    expect(H.foeActions(e)[0]).toBe(M.armageddon);
    expect(amounts).toEqual([99_999, 99_999, 99_999]);
  });
});

describe('the T0 questions of the preflight (section 13), answered by the engine', () => {
  const answered = (events: readonly BattleEvent[]): boolean => events.some((x) => x.type === 'action-start' && x.actorId === 'nemesis' && x.abilityId === M.nemesisUltima);

  it('Q1: a special-class command that does no damage still raises the reply: Steal (Rikku in front) is answered by Ultima, as the note\'s list says', () => {
    const party = structuredClone(omegaRuinsBuild);
    party.activeSlots = ['rikku', 'yuna', 'lulu'];
    party.reserve = ['tidus', 'auron', 'wakka', 'kimahri'];
    const e = H.newEngine(2, NEMESIS_GROUP_ID, party);
    const d = H.inputFor(e, 'rikku');
    const steal = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'steal');
    expect(steal, 'Rikku\'s Steal is offered').toBeDefined();
    expect(answered(e.submit({ ...steal!.command, targets: ['nemesis'] } as Command))).toBe(true);
  });

  it('Q1: Scan (magical, no damage) and a plain Attack raise nothing', () => {
    const e = H.newEngine(2, NEMESIS_GROUP_ID);
    const d = H.inputFor(e, 'yuna');
    expect(answered(e.submit(H.row(d, 'ability', 'scan', 'nemesis')!))).toBe(false);
    const d2 = H.inputFor(e, 'tidus');
    expect(answered(e.submit(H.swing(d2, 'nemesis')!))).toBe(false);
  });

  it('Q1: a blow that kills Nemesis (an Overdrive at 1 HP) ends the fight and is answered by nothing: the dead take no turn', () => {
    const e = H.newEngine(2, NEMESIS_GROUP_ID);
    H.foeOf(e).hp = 1;
    H.actor(e, 'tidus').overdrive!.gauge = 100;
    const d = H.inputFor(e, 'tidus');
    const od = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes('nemesis'));
    expect(od).toBeDefined();
    expect(answered(e.submit({ ...od!.command, targets: ['nemesis'] } as Command))).toBe(false);
    const next = e.nextDecision();
    expect(next.kind).toBe('battle-over');
    expect(next.kind === 'battle-over' && next.result.outcome).toBe('victory');
  });

  it('Q2: Escape and Flee are in every menu of the three fights and enabled in none (the formations\' rows, and the chapter\'s pick for Nemesis)', () => {
    for (const group of [ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID]) {
      const d = H.nextInput(H.newEngine(1, group));
      const flights = d.commands.filter((c) => /^(escape|flee)$/i.test(c.label));
      expect(flights.map((c) => c.label.toLowerCase()).sort(), group).toEqual(['escape', 'flee']);
      for (const c of flights) expect(c.enabled, `${group} ${c.label}`).toBe(false);
    }
  });
});

describe('the rewards, and the chain\'s heal', () => {
  it('Ultima Weapon (killed by one blow, an overkill) pays 20,000 gil, 50,000 AP and six Lv. 3 Key Spheres (the record\'s 40,000 and three, doubled by an overkill\'s rule), and names the next link', () => {
    const r = resultOf(H.newEngine(1, ULTIMA_GROUP_ID));
    expect(r).toMatchObject({ outcome: 'victory', gil: 20_000, ap: 50_000, nextGroupId: OMEGA_GROUP_ID });
    expect(r.overkilled).toEqual(['ultima-weapon']);
    expect(r.drops).toEqual([{ itemId: 'lv-3-key-sphere', count: 6 }]);
  });

  it('Omega Weapon pays 30,000 gil, 60,000 AP and six Lv. 4 Key Spheres (an overkill); Nemesis 55,000 AP, no gil, and two Warp Spheres', () => {
    const r = resultOf(H.newEngine(1, OMEGA_GROUP_ID));
    expect(r).toMatchObject({ outcome: 'victory', gil: 30_000, ap: 60_000, nextGroupId: NEMESIS_GROUP_ID });
    expect(r.drops).toEqual([{ itemId: 'lv-4-key-sphere', count: 6 }]);
    const n = H.newEngine(1, NEMESIS_GROUP_ID);
    H.foeOf(n).hp = 1;
    const nr = resultOf(n);
    expect(nr).toMatchObject({ outcome: 'victory', gil: 0, ap: 55_000 });
    expect(nr.nextGroupId).toBeUndefined();
    expect(nr.drops).toEqual([{ itemId: 'warp-sphere', count: 2 }]);
  });

  it('the chain: Omega Weapon\'s fight opens on a whole party even after Ultima Weapon has hurt and felled them', () => {
    const first = H.setup(1, ULTIMA_GROUP_ID);
    const e1 = H.engineOf(first);
    for (const id of FRONT) H.actor(e1, id).hp = 100;
    H.actor(e1, 'lulu').hp = 0;
    H.actor(e1, 'lulu').alive = false;
    const r = resultOf(e1);
    expect(r.outcome).toBe('victory');
    const e2 = H.engineOf(H.nextAct(first, e1, OMEGA_GROUP_ID, 2));
    for (const id of FRONT) {
      const c = H.actor(e2, id);
      expect([id, c.alive, c.hp, c.mp], id).toEqual([id, true, c.stats.maxHp, c.stats.maxMp]);
    }
  });

  it('the whole chain with the careless line: Ultima and Omega fall, Nemesis ends it (a defeat in the third act)', () => {
    const chain = playChain(1, carelessLine);
    expect(chain.outcome).toBe('defeat-III');
    expect(chain.acts.map((a) => a.outcome)).toEqual(['victory', 'victory', 'defeat']);
  });

  it('a Phoenix Down stock of 99 changes nothing for the careless line (it is dead at the first Spark whatever it holds)', () => {
    expect(playAct(1, 2, carelessLine, withPhoenixDowns(omegaRuinsBuild, 99)).outcome).toBe('defeat');
  });
});
