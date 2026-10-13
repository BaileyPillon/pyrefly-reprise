/**
 * **Engine-level parity, the FFX command gate** (re-parity RC7 lane L-CMD; **FFX only**).
 *
 * The kernel file (`parity-ffx-command-gate.test.ts`) proves the MP cost, the usability gate, the cost check and the range filter against the game's own
 * machine code. This file proves the WIRING: it drives the engine's own `executeCommand`, `resolveDoublecast` and `availableCommands` on a few thousand
 * generated scenes and asserts that what the engine does equals an **independent oracle** that restates `research/re-ffx-command-gate.md` in its own
 * terms (`helpers/ffxCommandRig.ts`, which imports nothing from the kernels or the adapters):
 *
 * 1. the MP a cast costs (Half rounds up, the Booster doubles, One MP is 1 and 2 with the Booster, Spellspring is free), over every catalog ability;
 * 2. the Silence gate: only a record that carries the flag (all White and Black Magic, Scan and Esuna among them; not Summon, Doublecast or an Overdrive);
 * 3. the cost check at the start: a cast the user cannot pay, a Silenced cast and an Overdrive without a full gauge do not start and pay nothing;
 * 4. the range filter: a named target that is dead, gone or out of reach is dropped and nobody takes its place, the command fizzles and pays nothing,
 *    an item comes back, and only a player's own command shows the out-of-reach message and keeps the turn open;
 * 5. Doublecast: each cast is checked on its own (a target the first cast killed is not hit again and costs nothing);
 * 6. Flee runs the Coward hook only for members in the battle, alive and not Petrified; the menu lets a Silenced Yuna summon.
 *
 * Mutants of the production code that this file and the kernel files must catch are listed in the lane handoff (`docs/handoff/re-parity-rc7-cmd.md`).
 */

import { describe, expect, it, vi } from 'vitest';
import type { AbilityDef, AutoAbilityId, Command, StatusId } from '../../src/battle/common/types.ts';
import { ABILITIES } from '../../src/data/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { availableCommands } from '../../src/battle/ffx/commands.ts';
import { mpCostFor } from '../../src/battle/ffx/abilities.ts';
import { type Who, combatantOf, lcg, oracleCategory, oracleGated, oracleMpCost, rigOf } from './helpers/ffxCommandRig.ts';

// Record who the Coward hook ran for (the real hook still runs).
const hooked: string[] = [];
vi.mock('../../src/battle/ffx/gauge.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/battle/ffx/gauge.ts')>();
  return { ...real, gaugeOnEscape: (ctx: never, c: { id: string }) => (hooked.push(c.id), real.gaugeOnEscape(ctx, c as never)) };
});

const startedEvents = (events: ReadonlyArray<Record<string, unknown>>): number => events.filter((e) => e['type'] === 'action-start').length;

/** The catalog abilities this block can drive through a plain `ability` command: no special path of the executor (Doublecast, volley, orders, menu markers, MP drains). */
function plainAbilities(): AbilityDef[] {
  return Object.values(ABILITIES).filter((a) => {
    if (a.category === 'overdrive' || a.category === 'item' || a.category === 'summon') return false;
    if (a.flags.includes('drains-mp') || a.flags.includes('destroys-user')) return false;
    const x = a.extra ?? {};
    if (x['castsTwoBlackMagicSpells'] === true || x['volley'] === true || x['ordersActor'] !== undefined || x['opensSubmenu'] !== undefined) return false;
    if (x['resolvesAsCommandKind'] !== undefined || x['resolvesToOneOf'] !== undefined || x['statsFrom'] !== undefined || x['restoresPool'] !== undefined) return false;
    if (a.formula === 'none' && a.hits === 0) return false; // menu markers
    return a.minigame === undefined;
  });
}

describe('the MP a cast costs and the Silence gate, over the whole catalog', () => {
  const pool = plainAbilities();

  it('3,000 casts: the engine pays what the oracle says, and a refused cast starts nothing and pays nothing', () => {
    const r = lcg(20261013);
    const seen = { started: 0, silenced: 0, broke: 0, cheaper: 0, summonLikeFree: 0, scanGated: 0, enemySilenced: 0, boosterScan: 0 };
    for (let i = 0; i < 3000; i++) {
      const def = r.pick(pool);
      const enemySide = def.category === 'enemy' || r.chance(0.12);
      const autos: AutoAbilityId[] = [];
      if (!enemySide) {
        if (r.chance(0.4)) autos.push('half-mp-cost');
        if (r.chance(0.35)) autos.push('one-mp-cost');
        if (r.chance(0.4)) autos.push('magic-booster');
      }
      const statuses: StatusId[] = [];
      const silenced = r.chance(0.35);
      if (silenced) statuses.push('silence');
      const free = r.chance(0.1);
      if (free) statuses.push('mp-cost-zero');
      const facts = { half: autos.includes('half-mp-cost'), one: autos.includes('one-mp-cost'), booster: autos.includes('magic-booster'), free };
      const cost = enemySide ? 0 : oracleMpCost(def.mpCost, oracleCategory(def), facts);
      const mp = enemySide ? 50 : r.pick([0, Math.max(0, cost - 1), cost, cost, cost + 1, cost + 7, 200]);
      const userId = enemySide ? 'boss' : 'tidus';
      const rig = rigOf([
        { id: 'tidus', side: 'party', mp: enemySide ? 100 : mp, autos, statuses: enemySide ? [] : statuses },
        { id: 'yuna', side: 'party' },
        { id: 'boss', side: 'enemy', mp: 50, statuses: enemySide ? statuses : [] },
        { id: 'e2', side: 'enemy' },
      ]);
      const user = rig.byId.get(userId)!;
      const foe = enemySide ? 'tidus' : 'boss';
      const ally = enemySide ? 'boss' : 'yuna';
      let targets: string[] = [];
      if (def.targeting === 'single-enemy' || def.targeting === 'single-any') targets = [foe];
      else if (def.targeting === 'single-ally') targets = [ally === userId ? foe : ally];
      else if (def.targeting === 'self') targets = [userId];
      const command: Command = { kind: 'ability', id: def.id, targets };
      rig.ctx.rt.currentActorId = userId;
      const result = executeCommand(rig.ctx, user, command, true);

      const gated = oracleGated(def);
      const starts = !(silenced && gated) && (enemySide || mp >= cost);
      expect(result.rejected, `${def.id}: a refused cast is not a rejected command`).toBeUndefined();
      if (!starts) expect(result, `${def.id}: a cast that does not start spends the turn at rank 3 and does nothing (cost ${cost}, mp ${mp}, silenced ${silenced})`).toEqual({ rank: 3, damageDealt: 0 });
      expect(startedEvents(rig.events) > 0, `${def.id}: action-start`).toBe(starts);
      if (!enemySide) {
        expect(user.mp, `${def.id}: MP after (${JSON.stringify({ autos, cost, mp, starts })})`).toBe(starts ? mp - cost : mp);
        if (starts && cost !== def.mpCost) seen.cheaper += 1;
        if (starts && def.id === 'scan' && facts.booster) seen.boosterScan += 1;
      } else if (silenced && gated) seen.enemySilenced += 1;
      if (starts) seen.started += 1;
      else if (silenced && gated) seen.silenced += 1;
      else seen.broke += 1;
      if (silenced && gated && def.id === 'scan') seen.scanGated += 1;
    }
    expect(seen.started).toBeGreaterThan(500);
    expect(seen.silenced).toBeGreaterThan(100);
    expect(seen.broke).toBeGreaterThan(100);
    expect(seen.cheaper).toBeGreaterThan(100);
    expect(seen.enemySilenced).toBeGreaterThan(5);
  });

  it('the costs the note names: Esuna 5 is 3 under Half, Scan 1 is 1, One MP with the Booster is 2, Holy 85 is 43', () => {
    const cost = (id: string, autos: AutoAbilityId[]): number => mpCostFor(combatantOf({ id: 'u', side: 'party', autos }), ABILITIES[id]!);
    expect(cost('esuna', ['half-mp-cost'])).toBe(3);
    expect(cost('scan', ['half-mp-cost'])).toBe(1);
    expect(cost('fire', ['one-mp-cost', 'magic-booster'])).toBe(2);
    expect(cost('fire', ['half-mp-cost', 'magic-booster'])).toBe(4);
    expect(cost('holy', ['half-mp-cost'])).toBe(43);
    expect(cost('mug', ['magic-booster'])).toBe(10);
    expect(mpCostFor(combatantOf({ id: 'boss', side: 'enemy' }), ABILITIES['fire']!)).toBe(0);
  });

  it('Summon, Grand Summon and the Overdrives are not Silence-gated; Scan and the Magic are', () => {
    const rig = rigOf([{ id: 'yuna', side: 'party', statuses: ['silence'] }, { id: 'boss', side: 'enemy' }]);
    const yuna = rig.byId.get('yuna')!;
    for (const id of ['scan', 'esuna', 'fire', 'cure', 'ultima']) {
      const row = availableCommands(rig.ctx, { ...yuna, learnedAbilityIds: [id] }).find((c) => c.command.kind === 'ability');
      expect(row?.enabled, id).toBe(false);
      expect(row?.disabledReason, id).toBe('Silenced');
    }
    for (const id of ['doublecast', 'mug']) {
      const row = availableCommands(rig.ctx, { ...yuna, learnedAbilityIds: [id] }).find((c) => c.command.kind === 'ability');
      expect(row?.disabledReason, id).toBeUndefined();
    }
  });

  it('a Silenced Yuna is offered her aeons: the Summon row is enabled', () => {
    const rig = rigOf([{ id: 'yuna', side: 'party', statuses: ['silence'] }, { id: 'boss', side: 'enemy' }]);
    const aeon = combatantOf({ id: 'valefor', side: 'aeon', hp: 3000 });
    rig.ctx.rt.aeonRoster.set('valefor', aeon);
    const row = availableCommands(rig.ctx, rig.byId.get('yuna')!).find((c) => c.command.kind === 'summon');
    expect(row?.enabled).toBe(true);
    expect(row?.disabledReason).toBeUndefined();
  });
});

describe('an Overdrive needs a full gauge and no Curse when it starts', () => {
  const od = Object.values(ABILITIES).find((a) => a.category === 'overdrive' && a.minigame === undefined && a.targeting === 'single-enemy');
  const odAny = od ?? Object.values(ABILITIES).find((a) => a.category === 'overdrive' && a.targeting === 'single-enemy')!;

  const run = (who: Who): { fizzled: boolean; started: boolean; gauge: number | undefined } => {
    const rig = rigOf([who, { id: 'boss', side: 'enemy' }]);
    const user = rig.byId.get(who.id)!;
    rig.ctx.rt.currentActorId = who.id;
    const result = executeCommand(rig.ctx, user, { kind: 'overdrive', id: odAny.id, targets: ['boss'] }, true);
    return { fizzled: result.rank === 3 && result.damageDealt === 0 && startedEvents(rig.events) === 0, started: startedEvents(rig.events) > 0, gauge: user.overdrive?.gauge };
  };

  it('a party member: 100 starts and empties the bar; 99, a Curse, or no gauge at all do not start and keep it', () => {
    expect(run({ id: 'tidus', side: 'party', gauge: 100 })).toEqual({ fizzled: false, started: true, gauge: 0 });
    expect(run({ id: 'tidus', side: 'party', gauge: 99 })).toEqual({ fizzled: true, started: false, gauge: 99 });
    expect(run({ id: 'tidus', side: 'party', gauge: 100, statuses: ['curse'] })).toEqual({ fizzled: true, started: false, gauge: 100 });
    expect(run({ id: 'tidus', side: 'party' }).started).toBe(false);
  });

  it('an aeon\'s bar is 20 points wide: its full bar starts, one point short does not', () => {
    expect(run({ id: 'valefor', side: 'aeon', gauge: 100 }).started).toBe(true);
    expect(run({ id: 'valefor', side: 'aeon', gauge: 95 })).toEqual({ fizzled: true, started: false, gauge: 95 });
  });
});

describe('no retarget: a named target that is gone, dead or out of reach is dropped and the command fizzles', () => {
  const strike = (who: Who[], command: Command, setup?: (rig: ReturnType<typeof rigOf>) => void) => {
    const rig = rigOf(who);
    setup?.(rig);
    const user = rig.byId.get(who[0]!.id)!;
    rig.ctx.rt.currentActorId = user.id;
    const mp = user.mp;
    const result = executeCommand(rig.ctx, user, command, true);
    return { rig, result, user, mpPaid: mp - user.mp, started: startedEvents(rig.events) > 0, messages: rig.events.filter((e) => e['type'] === 'message').map((e) => e['text']) };
  };
  const party = (over: Partial<Who> = {}): Who => ({ id: 'tidus', side: 'party', ...over });

  it('a dead enemy: Attack and Fire start nothing and pay nothing, silently, and the turn passes', () => {
    for (const command of [{ kind: 'attack', targets: ['boss'] } as Command, { kind: 'ability', id: 'fire', targets: ['boss'] } as Command]) {
      const s = strike([party(), { id: 'boss', side: 'enemy', statuses: ['ko'] }, { id: 'e2', side: 'enemy' }], command);
      expect(s.started).toBe(false);
      expect(s.mpPaid).toBe(0);
      expect(s.result).toEqual({ rank: 3, damageDealt: 0 });
      expect(s.messages).toEqual([]);
      expect(s.rig.byId.get('e2')!.hp).toBe(5000); // nobody else was picked to take the blow
    }
  });

  it('a target that left the field, or that cannot be aimed at, is gone too', () => {
    expect(strike([party(), { id: 'boss', side: 'enemy', removed: true }, { id: 'e2', side: 'enemy' }], { kind: 'attack', targets: ['boss'] }).started).toBe(false);
    expect(strike([party(), { id: 'boss', side: 'enemy', statuses: ['eject'] }, { id: 'e2', side: 'enemy' }], { kind: 'attack', targets: ['boss'] }).started).toBe(false);
  });

  it('a dead ally: Cure fizzles, Life (which may target the dead) starts', () => {
    const who = [party({ mp: 100 }), { id: 'yuna', side: 'party', statuses: ['ko'] } as Who, { id: 'boss', side: 'enemy' } as Who];
    expect(strike(who, { kind: 'ability', id: 'cure', targets: ['yuna'] })).toMatchObject({ started: false, mpPaid: 0 });
    expect(strike(who, { kind: 'ability', id: 'life', targets: ['yuna'] }).started).toBe(true);
  });

  it('out of reach: a player\'s own Attack shows the existing message and keeps the turn open; an AI command or a reaction only passes', () => {
    const far: Who = { id: 'boss', side: 'enemy', distance: 1 };
    const own = strike([party(), far], { kind: 'attack', targets: ['boss'] });
    expect(own.result).toMatchObject({ rejected: true, rank: 0 });
    expect(own.messages).toEqual(['Out of reach']);
    expect(own.started).toBe(false);
    const ai = strike([party({ controller: 'ai' }), far], { kind: 'attack', targets: ['boss'] });
    expect(ai.result).toEqual({ rank: 3, damageDealt: 0 });
    expect(ai.messages).toEqual([]);
    const reaction = strike([party(), far], { kind: 'attack', targets: ['boss'] }, (rig) => void (rig.ctx.rt.inReaction = true));
    expect(reaction.result).toEqual({ rank: 3, damageDealt: 0 });
    expect(reaction.messages).toEqual([]);
    // Magic reaches a distant foe.
    expect(strike([party(), far], { kind: 'ability', id: 'fire', targets: ['boss'] }).started).toBe(true);
  });

  it('a multi-target spell with nobody left does not start and costs nothing; an empty aim still picks one legal target', () => {
    const wide = Object.values(ABILITIES).find((a) => a.targeting === 'all-enemies' && a.category === 'blackmagic' && a.mpCost > 0)!;
    const dead = [party(), { id: 'boss', side: 'enemy', statuses: ['ko'] } as Who, { id: 'e2', side: 'enemy', statuses: ['ko'] } as Who];
    const s = strike(dead, { kind: 'ability', id: wide.id, targets: [] });
    expect(s).toMatchObject({ started: false, mpPaid: 0 });
    expect(s.result).toEqual({ rank: 3, damageDealt: 0 });
    const picked = strike([party(), { id: 'boss', side: 'enemy' }, { id: 'e2', side: 'enemy' }], { kind: 'ability', id: 'fire', targets: [] });
    expect(picked.started).toBe(true);
    expect(picked.mpPaid).toBe(4);
  });

  it('an item is spent only when the command starts; one paid for in advance comes back when it does not', () => {
    const who = [party(), { id: 'yuna', side: 'party', statuses: ['ko'] } as Who, { id: 'boss', side: 'enemy' } as Who];
    const bag = (id: string, prepaid: boolean) => {
      const rig = rigOf(who, 7, [[id, 3]]);
      if (prepaid) rig.ctx.rt.prepaidItem = id;
      const user = rig.byId.get('tidus')!;
      rig.ctx.rt.currentActorId = 'tidus';
      const result = executeCommand(rig.ctx, user, { kind: 'item', id, targets: ['yuna'] }, true);
      return { stock: rig.ctx.rt.inventory.get(id), prepaid: rig.ctx.rt.prepaidItem, started: startedEvents(rig.events) > 0, fizzled: result.rank === 3 && result.damageDealt === 0 && startedEvents(rig.events) === 0 };
    };
    expect(bag('potion', false)).toEqual({ stock: 3, prepaid: undefined, started: false, fizzled: true }); // a Potion on the fallen: nothing starts, nothing is spent
    expect(bag('potion', true)).toEqual({ stock: 4, prepaid: undefined, started: false, fizzled: true }); // paid in advance: returned
    expect(bag('phoenix-down', false)).toMatchObject({ stock: 2, started: true }); // may target the dead
  });
});

describe('Doublecast: each cast is a sub-action with its own checks', () => {
  const lulu = (over: Partial<Who> = {}): Who => ({ id: 'lulu', side: 'party', mp: 100, learned: ['doublecast', 'fire'], ...over });
  const cast = (who: Who[], targets: string[]) => {
    const rig = rigOf(who);
    const user = rig.byId.get('lulu')!;
    rig.ctx.rt.currentActorId = 'lulu';
    executeCommand(rig.ctx, user, { kind: 'ability', id: 'doublecast', targets, wrappedId: 'fire' }, true);
    return { mp: user.mp, hits: rig.events.filter((e) => e['type'] === 'damage').length };
  };

  it('two casts on a living foe pay twice; a foe the first cast killed is not hit again and the second cast costs nothing', () => {
    expect(cast([lulu(), { id: 'boss', side: 'enemy' }], ['boss'])).toMatchObject({ mp: 92 });
    const killed = cast([lulu(), { id: 'boss', side: 'enemy', hp: 1 }, { id: 'e2', side: 'enemy' }], ['boss']);
    expect(killed.mp).toBe(96);
    expect(killed.hits).toBe(1);
  });

  it('Silenced, neither cast starts; with the MP for one cast, only one does', () => {
    expect(cast([lulu({ statuses: ['silence'] }), { id: 'boss', side: 'enemy' }], ['boss'])).toEqual({ mp: 100, hits: 0 });
    const poor = cast([lulu({ mp: 5 }), { id: 'boss', side: 'enemy' }], ['boss']);
    expect(poor.mp).toBe(1);
    expect(poor.hits).toBe(1);
  });
});

describe('Flee runs the Coward hook for the members who are in the battle, alive and not Petrified', () => {
  const flee = (who: Who[]): string[] => {
    hooked.length = 0;
    const rig = rigOf(who);
    rig.ctx.rt.canEscape = true;
    const user = rig.byId.get(who[0]!.id)!;
    rig.ctx.rt.currentActorId = user.id;
    executeCommand(rig.ctx, user, { kind: 'escape', targets: [], extra: { mode: 'party' } }, true);
    return [...hooked];
  };

  it('a fallen, a Petrified and an ejected member are skipped; the rest run it in line order', () => {
    const got = flee([
      { id: 'tidus', side: 'party', mode: 'coward', gauge: 0 },
      { id: 'yuna', side: 'party', statuses: ['ko'], mode: 'coward', gauge: 0 },
      { id: 'auron', side: 'party', statuses: ['petrify'], mode: 'coward', gauge: 0 },
      { id: 'kimahri', side: 'party', mode: 'coward', gauge: 0 },
      { id: 'wakka', side: 'party', statuses: ['eject'], mode: 'coward', gauge: 0 },
      { id: 'boss', side: 'enemy' },
    ]);
    expect(got).toEqual(['tidus', 'kimahri']);
  });

  it('a single Escape runs it for the escaper alone, whatever the roll (it draws once and succeeds on 191 of 256)', () => {
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      hooked.length = 0;
      const rig = rigOf([{ id: 'tidus', side: 'party', mode: 'coward', gauge: 0 }, { id: 'yuna', side: 'party', mode: 'coward', gauge: 0 }, { id: 'boss', side: 'enemy' }], seed);
      const user = rig.byId.get('tidus')!;
      rig.ctx.rt.currentActorId = 'tidus';
      executeCommand(rig.ctx, user, { kind: 'escape', targets: [], extra: { mode: 'single' } }, true);
      const ok = rig.events.some((e) => e['type'] === 'escape-attempt' && e['success'] === true);
      expect(hooked, `seed ${seed}`).toEqual(ok ? ['tidus'] : []);
      if (ok) wins += 1;
    }
    expect(wins).toBeGreaterThan(15);
    expect(wins).toBeLessThan(40);
  });
});
