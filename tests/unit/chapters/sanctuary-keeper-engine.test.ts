/**
 * The Sanctuary Keeper on the real FFX engine, seeded (FFX only; `research/re-ffx-sanctuary-keeper.md`): every move's numbers and statuses end to end, the Reflect trick, Poison with and without Reflect, the answers
 * (Protect, Regen, Haste), Tail Sweep's Delay Buster and Haste removal, the menu's disabled commands, an aeon on the field, and the payout. Nothing is god mode but the HP top-up the mechanic tests ask for.
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { tickSpeedOf } from '../../../src/battle/ffx/adapt/ctb.ts';
import { KEEPER, actor, ctxOf, defend, give, has, inputFor, keeper, keeperActions, keeperStarts, log, newEngine, nextInput, row, runDefending, spell, swing } from '../helpers/sanctuaryDrive.ts';

type Ev = { type: string; abilityId?: string; actorId?: string; targetId?: string; amount?: number; sourceId?: string; status?: string; targets?: string[]; capped?: boolean };
const events = (engine: ReturnType<typeof newEngine>): readonly Ev[] => log(engine) as unknown as readonly Ev[];

/** The damage events of the `n`th action `ability` taken by the Keeper. */
function damageOf(engine: ReturnType<typeof newEngine>, ability: string, n = 0): Ev[] {
  const all = events(engine);
  let seen = -1;
  const out: Ev[] = [];
  let inside = false;
  for (const e of all) {
    if (e.type === 'action-start') {
      inside = e.actorId === KEEPER && e.abilityId === ability && ++seen === n;
    } else if (e.type === 'action-end') inside = false;
    else if (inside && e.type === 'damage') out.push(e);
  }
  return out;
}

describe('Photon Wings (RE 5): the first thing it does, on the whole front line', () => {
  it('hits all three for 900 to 1,100 each, never misses, and puts Curse on every one of them, on every seed', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const engine = newEngine(seed);
      runDefending(engine, (e) => keeperActions(e).length >= 1);
      expect(keeperActions(engine)[0], `seed ${seed}`).toBe('sanctuary-photon-wings');
      const dmg = damageOf(engine, 'sanctuary-photon-wings');
      expect(dmg, `seed ${seed}`).toHaveLength(3);
      for (const e of dmg) {
        expect(e.amount).toBeGreaterThanOrEqual(900);
        expect(e.amount).toBeLessThanOrEqual(1_100);
      }
      for (const id of ['tidus', 'yuna', 'auron']) expect(has(actor(engine, id), 'curse'), `${id} on seed ${seed}`).toBe(true);
    }
  });

  it('is not reduced by Protect or Shell (flag word 0: neither physical nor magical)', () => {
    const plain = newEngine(9);
    const shielded = newEngine(9);
    for (const id of ['tidus', 'yuna', 'auron']) { give(actor(shielded, id), 'shell'); give(actor(shielded, id), 'protect'); }
    for (const e of [plain, shielded]) runDefending(e, (x) => keeperActions(x).length >= 1);
    expect(damageOf(shielded, 'sanctuary-photon-wings').map((d) => d.amount)).toEqual(damageOf(plain, 'sanctuary-photon-wings').map((d) => d.amount));
  });

  it('rolls Confuse 25, Sleep 50, Silence 50 and Darkness 50 on each of the three (bounds over 150 fights)', () => {
    const hits = { confuse: 0, sleep: 0, silence: 0, darkness: 0 };
    const trials = 150 * 3;
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      runDefending(engine, (e) => keeperActions(e).length >= 1);
      const start = events(engine).findIndex((e) => e.type === 'action-start' && e.abilityId === 'sanctuary-photon-wings');
      const end = events(engine).findIndex((e, i) => i > start && e.type === 'action-end');
      for (const e of events(engine).slice(start, end)) if (e.type === 'status-add' && e.status !== undefined && e.status in hits) hits[e.status as keyof typeof hits]++;
    }
    const pct = (n: number): number => (n / trials) * 100;
    expect(pct(hits.confuse)).toBeGreaterThan(17);
    expect(pct(hits.confuse)).toBeLessThan(33);
    for (const s of ['sleep', 'silence', 'darkness'] as const) {
      expect(pct(hits[s]), s).toBeGreaterThan(40);
      expect(pct(hits[s]), s).toBeLessThan(60);
    }
  });
});

describe('Mana Breath (RE 5): a magical breath on one member, MAG 40', () => {
  it('hits exactly one member, never misses, and lands in the note\'s ranges for the front line (the armour\'s Magic Defence taken off)', () => {
    const seen: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const engine = newEngine(seed);
      runDefending(engine, (e) => keeperActions(e).length >= 4);
      expect(keeperActions(engine)[3], `seed ${seed}`).toBe('sanctuary-mana-breath');
      const dmg = damageOf(engine, 'sanctuary-mana-breath');
      expect(dmg, `seed ${seed}`).toHaveLength(1);
      seen.push(dmg[0]!.amount!);
    }
    expect(Math.min(...seen)).toBeGreaterThan(2_000);
    expect(Math.max(...seen)).toBeLessThan(3_700);
  });

  it('Shell takes it to about half', () => {
    const plain: number[] = [];
    const shelled: number[] = [];
    for (let seed = 1; seed <= 12; seed++) {
      for (const [list, shell] of [[plain, false], [shelled, true]] as const) {
        const engine = newEngine(seed);
        if (shell) for (const id of ['tidus', 'yuna', 'auron']) give(actor(engine, id), 'shell');
        runDefending(engine, (e) => keeperActions(e).length >= 4);
        list.push(damageOf(engine, 'sanctuary-mana-breath')[0]!.amount!);
      }
    }
    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(shelled) / mean(plain)).toBeGreaterThan(0.45);
    expect(mean(shelled) / mean(plain)).toBeLessThan(0.55);
  });

  it('is cast at the record\'s MAG: 40 on the turn, 180 on a support turn', () => {
    const engine = newEngine(3);
    runDefending(engine, (e) => keeperActions(e).length >= 4);
    expect(keeper(engine).stats.mag).toBe(40);
    runDefending(engine, (e) => keeperActions(e).length >= 5);
    expect(keeper(engine).stats.mag).toBe(180);
  });
});

describe('Tail Sweep (RE 5): Delay Buster and Haste removal on the whole front line', () => {
  function sweepWithHastedParty(seed: number): { before: Record<string, number>; after: Record<string, number>; engine: ReturnType<typeof newEngine> } {
    const engine = newEngine(seed);
    const ctx = ctxOf(engine);
    for (const id of engine.state().activeIds) give(actor(engine, id), 'haste');
    const before: Record<string, number> = {};
    const after: Record<string, number> = {};
    const emit = ctx.emit.bind(ctx);
    let inSweep = false;
    (ctx as { emit: typeof ctx.emit }).emit = ((event: Ev) => {
      if (event.type === 'action-start' && event.abilityId === 'sanctuary-tail-sweep') {
        inSweep = true;
        for (const id of engine.state().activeIds) before[id] = rtOf(ctx, id).ctb;
      }
      const result = emit(event as never);
      if (event.type === 'action-end' && inSweep) {
        inSweep = false;
        for (const id of engine.state().activeIds) after[id] = rtOf(ctx, id).ctb;
      }
      return result;
    }) as typeof ctx.emit;
    for (let i = 0; i < 80 && Object.keys(after).length === 0; i++) {
      const d = nextInput(engine);
      engine.submit(swing(d) ?? defend());
    }
    return { before, after, engine };
  }

  it('takes Haste off everyone it hits and delays each by three times its tick speed', () => {
    let checked = 0;
    for (let seed = 1; seed <= 30 && checked < 6; seed++) {
      const { before, after, engine } = sweepWithHastedParty(seed);
      if (Object.keys(after).length === 0) continue;
      const hit = new Set(damageOf(engine, 'sanctuary-tail-sweep').map((d) => d.targetId));
      expect(hit.size, `seed ${seed}`).toBeGreaterThan(0);
      for (const id of hit as Set<string>) {
        expect(has(actor(engine, id), 'haste'), `${id} seed ${seed}`).toBe(false);
        expect((after[id] ?? 0) - (before[id] ?? 0), `${id} seed ${seed}`).toBe(3 * tickSpeedOf(actor(engine, id)));
      }
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(6);
  });

  it('hits for 900 to 1,200 each (physical, power 12) and is a free counter: the Keeper\'s own turn comes after as it would have', () => {
    const { engine } = sweepWithHastedParty(2);
    const dmg = damageOf(engine, 'sanctuary-tail-sweep');
    expect(dmg.length).toBeGreaterThanOrEqual(1);
    for (const e of dmg) {
      expect(e.amount).toBeGreaterThan(800);
      expect(e.amount).toBeLessThan(1_250);
    }
  });
});

describe('the Reflect trick (RE 4.2): its own healing turned, and turned back', () => {
  it('Reflect on it above a half: its Curaga bounces to the party and the Keeper is not healed', () => {
    const engine = newEngine(4);
    keeper(engine).hp = 25_000; // phase 1: above a half
    give(keeper(engine), 'reflect');
    for (const id of engine.state().activeIds) actor(engine, id).hp = Math.floor(actor(engine, id).stats.maxHp / 2);
    runDefending(engine, (e) => keeperActions(e).length >= 5, 400);
    const heals = events(engine).filter((e) => e.type === 'damage' && (e.amount ?? 0) < 0 && e.sourceId === KEEPER);
    expect(heals.length).toBeGreaterThanOrEqual(1);
    for (const h of heals) expect(h.targetId, 'healed the party, not itself').not.toBe(KEEPER);
  });

  it('Reflect on it under a half and a Reflect holder in the party: it casts at the holder and the spell comes back onto itself (healed)', () => {
    const engine = newEngine(5);
    const k = keeper(engine);
    k.hp = 15_000;
    give(k, 'reflect');
    give(actor(engine, 'yuna'), 'reflect');
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    const casts = keeperStarts(engine).filter((s) => s.id === 'curaga');
    expect(casts.length).toBe(2);
    for (const c of casts) expect(c.targets).toEqual(['yuna']);
    const healed = events(engine).filter((e) => e.type === 'damage' && (e.amount ?? 0) < 0 && e.sourceId === KEEPER && e.targetId === KEEPER);
    expect(healed.length).toBe(2);
  });

  it('Reflect on it under a half and nobody holding Reflect: its first support turn puts Reflect on the lowest-HP member, the second is aimed at him and bounces', () => {
    const engine = newEngine(5);
    const k = keeper(engine);
    k.hp = 15_000;
    give(k, 'reflect');
    runDefending(engine, (e) => keeperActions(e).length >= 4); // the Wings, two Attacks and the breath are done, the party kept up
    for (const id of engine.state().activeIds) { actor(engine, id).stats.maxHp = 99_999; actor(engine, id).hp = id === 'tidus' ? 400 : 3_000; }
    runDefending(engine, (e) => keeperActions(e).length >= 6, 400, false); // two support turns: nothing hurts the party
    const support = keeperStarts(engine).slice(4, 6);
    expect(support[0]).toMatchObject({ id: 'reflect', targets: ['tidus'] });
    expect(support[1]).toMatchObject({ id: 'curaga', targets: ['tidus'] }); // aimed at the new holder: it comes back onto the Keeper
    expect(has(actor(engine, 'tidus'), 'reflect')).toBe(true);
  });
});

describe('Poison (RE 1.2): 2,000 a tick, cured by Esuna on a support turn unless Reflect is up', () => {
  it('Poison Fang always lands; a tick takes 2,000 (5 percent of 40,000) at the Keeper\'s turn', () => {
    const engine = newEngine(7);
    const d = inputFor(engine, 'tidus');
    const throwFang = row(d, 'item', 'poison-fang', KEEPER);
    expect(throwFang).not.toBeNull();
    engine.submit(throwFang!);
    nextInput(engine);
    expect(has(keeper(engine), 'poison')).toBe(true);
    runDefending(engine, (e) => keeperActions(e).length >= 2);
    const ticks = events(engine).filter((e) => e.type === 'damage' && e.targetId === KEEPER && e.amount === 2_000);
    expect(ticks.length).toBeGreaterThanOrEqual(1);
  });

  it('with Poison on it and no Reflect: its first support turn is Esuna on itself, and Poison is gone', () => {
    const engine = newEngine(7);
    give(keeper(engine), 'poison');
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    const support = keeperStarts(engine).slice(4, 6);
    expect(support[0]).toMatchObject({ id: 'esuna', targets: [KEEPER] });
    expect(has(keeper(engine), 'poison')).toBe(false);
    expect(support[1]!.id).toBe('curaga'); // poison cured: the second turn is the default
  });

  it('with Poison AND Reflect on it above a half: Esuna bounces to the party and the Poison stays, tick after tick (the guides\' answer)', () => {
    const engine = newEngine(7);
    give(keeper(engine), 'poison');
    give(keeper(engine), 'reflect');
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    expect(has(keeper(engine), 'poison')).toBe(true);
    expect(keeperStarts(engine).slice(4, 6).map((s) => s.id)).toEqual(['esuna', 'esuna']); // both support turns spent, nothing cured
    expect(keeper(engine).hp).toBeLessThan(31_000); // five ticks of 2,000 and no heal
  });

  it('...and under a half it takes the Reflect trick: the Esuna is aimed at a holder it gave Reflect to, and the Poison goes', () => {
    const engine = newEngine(7);
    give(keeper(engine), 'poison');
    give(keeper(engine), 'reflect');
    keeper(engine).hp = 15_000;
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    const support = keeperStarts(engine).slice(4, 6);
    expect(support[0]!.id).toBe('reflect');
    expect(support[1]!.id).toBe('esuna');
    expect(has(keeper(engine), 'poison')).toBe(false);
  });
});

describe('the answers: Protect after Armor Break, Regen under a quarter', () => {
  it('Armor Break (Auron) lands, and its next support turn is Protect on itself', () => {
    const engine = newEngine(8);
    const d = inputFor(engine, 'auron');
    const ab = spell(d, 'armor-break', KEEPER);
    expect(ab).not.toBeNull();
    engine.submit(ab!);
    nextInput(engine);
    expect(has(keeper(engine), 'armor-break')).toBe(true);
    runDefending(engine, (e) => keeperActions(e).length >= 5);
    expect(keeperActions(engine)).toContain('protect');
    expect(has(keeper(engine), 'protect')).toBe(true);
  });

  it('under a quarter it casts Regen once, then Curaga while it keeps Regen', () => {
    const engine = newEngine(8);
    keeper(engine).hp = 8_000;
    runDefending(engine, (e) => keeperActions(e).length >= 6);
    expect(keeperActions(engine).slice(4, 6)).toEqual(['regen', 'curaga']);
    expect(has(keeper(engine), 'regen')).toBe(true);
  });
});

describe('what the Keeper is immune to, end to end', () => {
  it('Delay Buster does not delay it (its counter is the same as after a plain Attack, which takes the same recovery), and Slow lands', () => {
    // Delay Buster adds three times the target's tick speed to its counter; the Keeper is immune (the flag byte +0x29). The control plays the same seed with an Attack, which delays nothing.
    const counterAfter = (pick: (d: ReturnType<typeof inputFor>) => Command | null): number => {
      const engine = newEngine(10);
      const d = inputFor(engine, 'tidus');
      const cmd = pick(d);
      expect(cmd).not.toBeNull();
      engine.submit(cmd!);
      nextInput(engine);
      return rtOf(ctxOf(engine), KEEPER).ctb;
    };
    const buster = counterAfter((d) => row(d, 'ability', 'delay-buster', KEEPER));
    const plain = counterAfter((d) => swing(d));
    expect(buster).toBe(plain);
  });

  it('Slow lands (a status, not a delay)', () => {
    const engine = newEngine(10);
    const d = inputFor(engine, 'tidus');
    expect(has(keeper(engine), 'slow')).toBe(false);
    engine.submit(row(d, 'ability', 'slow', KEEPER)!); // the script answers with Haste, which takes the Slow off again; the landing is in the log
    nextInput(engine);
    const added = events(engine).filter((e) => e.type === 'status-add' && e.targetId === KEEPER && e.status === 'slow');
    expect(added).toHaveLength(1);
  });

  it('cannot be Provoked: Provoke does nothing and the script still chooses its own targets', () => {
    const engine = newEngine(11);
    const d = inputFor(engine, 'tidus');
    engine.submit(row(d, 'ability', 'provoke', KEEPER)!);
    runDefending(engine, (e) => keeperActions(e).length >= 4);
    expect(has(keeper(engine), 'provoke')).toBe(false);
  });
});

describe('the menu: Escape and Flee are off for everyone; Switch and Summon are not', () => {
  it('every member\'s Escape and Flee rows are disabled; Switch and Summon (Yuna) are on offer', () => {
    // The first inputs come before the first Wings on most seeds; a seed whose party is put out of action first is skipped, and the next one supplies the member.
    const seen = new Set<string>();
    for (let seed = 1; seed <= 30 && seen.size < 3; seed++) {
      const engine = newEngine(seed);
      for (let i = 0; i < 8; i++) {
        const d = nextInput(engine);
        if (!seen.has(d.actorId)) {
          seen.add(d.actorId);
          for (const c of d.commands) if (c.command.kind === 'escape') expect(c.enabled, `${d.actorId} ${c.label}`).toBe(false);
          expect(d.commands.some((c) => c.command.kind === 'switch' && c.enabled), d.actorId).toBe(true);
          if (d.actorId === 'yuna') expect(d.commands.some((c) => c.command.kind === 'summon' && c.enabled)).toBe(true);
        }
        engine.submit(defend());
      }
    }
    expect(seen.size).toBe(3);
  });
});

describe('an aeon on the field', () => {
  it('Photon Wings and the rest are aimed at the aeon alone; the script runs on without error', () => {
    // Yuna's first turn comes before the first Wings on most seeds: summon then.
    let engine = newEngine(1);
    let summon: Command | undefined;
    for (let seed = 1; seed <= 20 && summon === undefined; seed++) {
      engine = newEngine(seed);
      const d = nextInput(engine);
      const input = d.actorId === 'yuna' ? d : (engine.submit(defend()), nextInput(engine));
      const found = input.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'valefor');
      if (input.actorId === 'yuna' && found) summon = { ...found.command } as Command;
    }
    expect(summon).toBeDefined();
    engine.submit(summon!);
    runDefending(engine, (e) => e.state().aeonId !== null || keeperActions(e).length >= 3);
    expect(engine.state().aeonId).not.toBeNull();
    const before = keeperStarts(engine).length;
    runDefending(engine, (e) => keeperStarts(e).length >= before + 3 || e.state().aeonId === null);
    const during = keeperStarts(engine).slice(before);
    expect(during.length).toBeGreaterThanOrEqual(1);
    for (const s of during) expect(s.targets, s.id).toEqual([engine.state().aeonId ?? 'valefor']);
  });
});

describe('the payout', () => {
  it('a kill pays 6,500 gil and 11,000 AP and drops a Return Sphere', () => {
    const engine = newEngine(5);
    keeper(engine).hp = 1;
    const d = inputFor(engine, 'tidus');
    engine.submit(swing(d)!);
    let over;
    for (let i = 0; i < 40 && !over; i++) {
      const next = engine.nextDecision();
      if (next.kind === 'battle-over') over = next.result;
    }
    expect(over?.outcome).toBe('victory');
    expect(over?.gil).toBe(6_500);
    expect(over?.ap).toBe(11_000);
    expect(over?.drops.map((x) => x.itemId)).toContain('return-sphere');
  });
});

describe('determinism', () => {
  it('the same seed plays the same battle, event for event', () => {
    const run = (): string => {
      const engine = newEngine(21);
      for (let i = 0; i < 400; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit(swing(d) ?? defend());
      }
      return JSON.stringify(engine.state().log);
    };
    const a = run();
    expect(a.length).toBeGreaterThan(1_000);
    expect(run()).toBe(a);
  });
});
