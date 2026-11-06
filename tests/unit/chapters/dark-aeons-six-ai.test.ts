/**
 * **The six other Dark Aeons' AI against the note** (`research/re-ffx-dark-aeons-six.md`, "RE six n"; FFX only; the hidden Dark Aeons chapter): every rule and every number of the six scripts
 * (`src/battle/ffx/ai/dark-aeons-six.ts`), pinned on a **fake context**, where each branch is driven by the raw draw and the gauges alone and the odds are counted over all 65,536 values of `GetRandomValue()` (the note's own
 * exact tallies, 4.1 to 4.6), and the hit hooks by their gate. The real engine's runs are `dark-aeons-six-engine.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import {
  IMPULSE_COUNTER, SIX_ROWS as ROW, SIX_SCRIPTS, animaHit, animaTurn, bahamutHit, bahamutTurn, ifritHit, ifritTurn, ixion1Hit, ixion1Turn, ixion2Hit, ixion2Turn, shivaHit, shivaTurn, valeforHit, valeforTurn,
} from '../../../src/battle/ffx/ai/dark-aeons-six.ts';
import { type HitEvent } from '../../../src/battle/ffx/ai/hit-script.ts';
import { peekReactions } from '../../../src/battle/ffx/ai/hooks.ts';
import { type AiContext } from '../../../src/battle/ffx/ai/types.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';

interface Fake {
  ctx: Ctx;
  draws: Array<[number, number]>;
  events: Array<{ type: string; from?: number; to?: number; cause?: string }>;
}

const dummy = (id: string, side: 'party' | 'enemy', gauge?: number): FFXCombatant =>
  ({ id, side, alive: true, hp: 1000, removed: false, statuses: {}, flags: {}, stats: { maxHp: 1000, agi: 100 }, ...(gauge !== undefined ? { overdrive: { gauge } } : {}) }) as unknown as FFXCombatant;

/** A battle with `living` party members and one Dark Aeon at `gauge`; every stream-2 draw answered `raw`, every stream-4 draw `pick`. */
function fake(opts: { boss: string; gauge: number; living?: number; raw?: number; pick?: number; inReaction?: boolean }): Fake {
  const draws: Array<[number, number]> = [];
  const events: Fake['events'] = [];
  const party = Array.from({ length: opts.living ?? 3 }, (_, i) => dummy(`m${i}`, 'party'));
  const combatants: Record<string, FFXCombatant> = Object.fromEntries(party.map((c) => [c.id, c]));
  combatants[opts.boss] = dummy(opts.boss, 'enemy', opts.gauge);
  const ctx = {
    state: { flags: {}, combatants, activeIds: party.map((c) => c.id), aeonId: null, enemyIds: [opts.boss] },
    rt: { actors: new Map(), inReaction: opts.inReaction === true },
    rng: {
      on: (stream: number) => ({
        int: (_lo: number, hi: number): number => {
          draws.push([stream, hi]);
          return stream === FfxStream.Script ? (opts.raw ?? 0) : Math.min(opts.pick ?? 0, hi);
        },
      }),
    },
    content: { ability: () => ({}) },
    emit: (e: Fake['events'][number]) => events.push(e),
  } as unknown as Ctx;
  return { ctx, draws, events };
}

const gaugeOf = (f: Fake, id: string): number => (f.ctx.state.combatants[id] as FFXCombatant).overdrive!.gauge;
const aiOf = (f: Fake, id: string): AiContext => ({ ctx: f.ctx, self: f.ctx.state.combatants[id] as FFXCombatant, memory: {} });
const rowOf = (c: Command | null): string => (c !== null && c.kind === 'ability' ? c.id : `(${c?.kind ?? 'none'})`);

/** The exact tally of one turn's rows over all 65,536 values of the draw. */
function tally(boss: string, turn: (ai: AiContext) => Command, gauge = 0): Record<string, number> {
  const out: Record<string, number> = {};
  for (let raw = 0; raw < 0x10000; raw++) {
    const f = fake({ boss, gauge, raw });
    const row = rowOf(turn(aiOf(f, boss)));
    out[row] = (out[row] ?? 0) + 1;
  }
  return out;
}

/** A hit event as the engine raises it: the Dark Aeon was hit by `m0`, with `lastDamage`. */
function hitOf(f: Fake, boss: string, hp = 1000): HitEvent {
  const target = f.ctx.state.combatants[boss] as FFXCombatant;
  target.hp = hp;
  return { ctx: f.ctx, target, attacker: f.ctx.state.combatants['m0'] as FFXCombatant, def: {} as never, lastDamage: 1, affectsHp: true };
}

describe('the scripts are registered under the ids the data names, both hooks', () => {
  it('seven AI scripts', () => {
    for (const id of Object.values(SIX_SCRIPTS)) expect(getAiScript(id), id).toBeDefined();
  });
});

describe("Dark Valefor's turn (RE six 4.1)", () => {
  it('a gauge of 100: Energy Blast on the whole front line, with no draw at all; the gauge is written 0 and NOTHING is added after an Overdrive', () => {
    const f = fake({ boss: 'dark-valefor', gauge: 100 });
    const c = valeforTurn(aiOf(f, 'dark-valefor'));
    expect([rowOf(c), c.targets]).toEqual([ROW.energyBlast, []]);
    expect(f.draws).toEqual([]);
    expect(gaugeOf(f, 'dark-valefor')).toBe(0);
  });

  it('below 100: one draw modulo 4: 16,384 Energy Ray (all), 16,384 Sonic Wings (one), 32,768 Attack (one) of the 65,536 values (exact); then +5', () => {
    expect(tally('dark-valefor', valeforTurn)).toEqual({ [ROW.energyRay]: 16_384, [ROW.sonicWings]: 16_384, [ROW.valeforAttack]: 32_768 });
    const f = fake({ boss: 'dark-valefor', gauge: 95, raw: 3 });
    valeforTurn(aiOf(f, 'dark-valefor'));
    expect(gaugeOf(f, 'dark-valefor'), 'capped at 100').toBe(100);
    const g = fake({ boss: 'dark-valefor', gauge: 0, raw: 0 });
    valeforTurn(aiOf(g, 'dark-valefor'));
    expect(gaugeOf(g, 'dark-valefor')).toBe(5);
  });

  it('a single-target move picks its victim with one stream-4 draw over the living front line, none for one living; the group moves draw none', () => {
    const run = (living: number, raw: number): Fake => {
      const f = fake({ boss: 'dark-valefor', gauge: 0, raw, living, pick: 1 });
      valeforTurn(aiOf(f, 'dark-valefor'));
      return f;
    };
    expect(run(3, 2).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    expect(run(2, 1).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 1]]);
    expect(run(1, 1).draws).toEqual([[FfxStream.Script, 0xffff]]);
    expect(run(3, 0).draws, 'Energy Ray is a group move').toEqual([[FfxStream.Script, 0xffff]]);
  });

  it('the hit: +15 while a counter is allowed (capped at 100); no counter; nothing when the hit is part of a reaction', () => {
    const f = fake({ boss: 'dark-valefor', gauge: 0 });
    valeforHit(hitOf(f, 'dark-valefor'));
    expect(gaugeOf(f, 'dark-valefor')).toBe(15);
    expect(peekReactions(f.ctx)).toEqual([]);
    const near = fake({ boss: 'dark-valefor', gauge: 96 });
    valeforHit(hitOf(near, 'dark-valefor'));
    expect(gaugeOf(near, 'dark-valefor')).toBe(100);
    const reaction = fake({ boss: 'dark-valefor', gauge: 0, inReaction: true });
    valeforHit(hitOf(reaction, 'dark-valefor'));
    expect(gaugeOf(reaction, 'dark-valefor'), 'a party counter-attack pays no gain').toBe(0);
  });

  it('the turn cadence: with no hits the Overdrive is her 21st turn (20 turns of +5)', () => {
    const f = fake({ boss: 'dark-valefor', gauge: 0, raw: 2 });
    const rows: string[] = [];
    for (let i = 0; i < 21; i++) rows.push(rowOf(valeforTurn(aiOf(f, 'dark-valefor'))));
    expect(rows.indexOf(ROW.energyBlast) + 1).toBe(21);
    expect(rows.slice(0, 20).every((r) => r === ROW.valeforAttack)).toBe(true);
  });
});

describe("Dark Ifrit's turn and counter (RE six 4.2)", () => {
  it('Meteor Strike on one every ordinary turn, with no stream-2 draw; Hellfire on all at 100; +10 a turn; the 11th turn with no hits', () => {
    const f = fake({ boss: 'dark-ifrit', gauge: 0, pick: 1 });
    const rows: string[] = [];
    for (let i = 0; i < 11; i++) rows.push(rowOf(ifritTurn(aiOf(f, 'dark-ifrit'))));
    expect(rows.slice(0, 10).every((r) => r === ROW.meteorStrike)).toBe(true);
    expect(rows[10]).toBe(ROW.hellfire);
    expect(gaugeOf(f, 'dark-ifrit')).toBe(0);
    expect(f.draws.every(([s]) => s === FfxStream.Picker), 'only picker draws').toBe(true);
    const g = fake({ boss: 'dark-ifrit', gauge: 100 });
    expect(ifritTurn(aiOf(g, 'dark-ifrit')).targets).toEqual([]);
  });

  it('the hit: his Attack at the attacker as a reaction, then +5; nothing at all when the hit is part of a reaction', () => {
    const f = fake({ boss: 'dark-ifrit', gauge: 0 });
    ifritHit(hitOf(f, 'dark-ifrit'));
    expect(gaugeOf(f, 'dark-ifrit')).toBe(5);
    const queued = peekReactions(f.ctx);
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ kind: 'command', ownerId: 'dark-ifrit', command: { kind: 'ability', id: ROW.ifritAttack, targets: ['m0'] }, requiresAlive: 'm0' });
    const none = fake({ boss: 'dark-ifrit', gauge: 0, inReaction: true });
    ifritHit(hitOf(none, 'dark-ifrit'));
    expect([gaugeOf(none, 'dark-ifrit'), peekReactions(none.ctx).length]).toEqual([0, 0]);
  });

  it('an aeon at 0 HP after the hit queues no counter (the game\'s queue drops it) but the gain still stands', () => {
    const f = fake({ boss: 'dark-ifrit', gauge: 0 });
    ifritHit(hitOf(f, 'dark-ifrit', 0));
    expect(peekReactions(f.ctx)).toEqual([]);
    expect(gaugeOf(f, 'dark-ifrit')).toBe(5);
  });

  it('an Asleep, Confused or Berserk aeon cannot counter and gains nothing (the gate `isCounterattackAllowed`)', () => {
    for (const status of ['sleep', 'confuse', 'berserk', 'threaten']) {
      const f = fake({ boss: 'dark-ifrit', gauge: 0 });
      (f.ctx.state.combatants['dark-ifrit'] as FFXCombatant).statuses = { [status]: { id: status } } as never;
      ifritHit(hitOf(f, 'dark-ifrit'));
      expect([gaugeOf(f, 'dark-ifrit'), peekReactions(f.ctx).length], status).toEqual([0, 0]);
    }
  });
});

describe("Dark Ixion's two scripts (RE six 4.3)", () => {
  it('first fight: Thundaja on one every ordinary turn (no draw), Aerospark on one at 100, +5; the 21st turn', () => {
    const f = fake({ boss: 'dark-ixion', gauge: 0, pick: 0 });
    const rows: string[] = [];
    for (let i = 0; i < 21; i++) rows.push(rowOf(ixion1Turn(aiOf(f, 'dark-ixion'))));
    expect(rows.indexOf(ROW.aerospark) + 1).toBe(21);
    expect(rows.slice(0, 20).every((r) => r === ROW.thundaja)).toBe(true);
    expect(f.draws.every(([s]) => s === FfxStream.Picker)).toBe(true);
  });

  it('first fight, the hit: his Attack (the one that can miss) at the attacker, then +10', () => {
    const f = fake({ boss: 'dark-ixion', gauge: 0 });
    ixion1Hit(hitOf(f, 'dark-ixion'));
    expect(gaugeOf(f, 'dark-ixion')).toBe(10);
    expect(peekReactions(f.ctx)[0]).toMatchObject({ ownerId: 'dark-ixion', command: { id: ROW.ixionAttack1, targets: ['m0'] } });
  });

  it('second fight: one draw modulo 3: 21,846 Aerospark, 43,690 Attack (exact); Thor\'s Hammer on all at 100; +10; the hit is +10 with no counter', () => {
    expect(tally('dark-ixion-2', ixion2Turn)).toEqual({ [ROW.aerospark]: 21_846, [ROW.ixionAttack2]: 43_690 });
    const f = fake({ boss: 'dark-ixion-2', gauge: 100 });
    const c = ixion2Turn(aiOf(f, 'dark-ixion-2'));
    expect([rowOf(c), c.targets, f.draws, gaugeOf(f, 'dark-ixion-2')]).toEqual([ROW.thorsHammer, [], [], 0]);
    const g = fake({ boss: 'dark-ixion-2', gauge: 0 });
    ixion2Hit(hitOf(g, 'dark-ixion-2'));
    expect([gaugeOf(g, 'dark-ixion-2'), peekReactions(g.ctx).length]).toEqual([10, 0]);
    const h = fake({ boss: 'dark-ixion-2', gauge: 0, raw: 2 });
    ixion2Turn(aiOf(h, 'dark-ixion-2'));
    expect(gaugeOf(h, 'dark-ixion-2')).toBe(10);
  });
});

describe("Dark Shiva (RE six 4.4)", () => {
  it('one draw modulo 3: 21,846 Heavenly Strike, 43,690 Attack (exact); Diamond Dust on all at 100; +10; the hit +10 with no counter', () => {
    expect(tally('dark-shiva', shivaTurn)).toEqual({ [ROW.heavenlyStrike]: 21_846, [ROW.shivaAttack]: 43_690 });
    const f = fake({ boss: 'dark-shiva', gauge: 100 });
    expect([rowOf(shivaTurn(aiOf(f, 'dark-shiva'))), f.draws.length, gaugeOf(f, 'dark-shiva')]).toEqual([ROW.diamondDust, 0, 0]);
    const g = fake({ boss: 'dark-shiva', gauge: 0 });
    shivaHit(hitOf(g, 'dark-shiva'));
    expect([gaugeOf(g, 'dark-shiva'), peekReactions(g.ctx).length]).toEqual([10, 0]);
  });
});

describe("Dark Bahamut (RE six 4.5)", () => {
  it('Attack on one every ordinary turn with no draw but the picker\'s; Mega Flare on all at 100; +10; the 11th turn', () => {
    const f = fake({ boss: 'dark-bahamut', gauge: 0 });
    const rows: string[] = [];
    for (let i = 0; i < 11; i++) rows.push(rowOf(bahamutTurn(aiOf(f, 'dark-bahamut'))));
    expect(rows.indexOf(ROW.megaFlare) + 1).toBe(11);
    expect(rows.slice(0, 10).every((r) => r === ROW.ifritAttack)).toBe(true);
    expect(f.draws.every(([s]) => s === FfxStream.Picker)).toBe(true);
  });

  it('twelve allowed hits in a row: the gauge 10, 20 ... 100 and Impulse on the whole front line on hits 5 and 10 (the interpreter\'s run), the private counter reset to 0 at five', () => {
    const f = fake({ boss: 'dark-bahamut', gauge: 0 });
    const impulses: number[] = [];
    const gauges: number[] = [];
    for (let hit = 1; hit <= 12; hit++) {
      const before = peekReactions(f.ctx).length;
      bahamutHit(hitOf(f, 'dark-bahamut'));
      gauges.push(gaugeOf(f, 'dark-bahamut'));
      if (peekReactions(f.ctx).length > before) impulses.push(hit);
    }
    expect(gauges).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100]);
    expect(impulses).toEqual([5, 10]);
    const queued = peekReactions(f.ctx)[0]!;
    expect(queued).toMatchObject({ kind: 'command', ownerId: 'dark-bahamut', command: { kind: 'ability', id: ROW.impulse, targets: ['m0', 'm1', 'm2'] } });
    const memory = (f.ctx.rt.actors.get('dark-bahamut') as { ai: Record<string, number> }).ai;
    expect(memory[IMPULSE_COUNTER]).toBe(2);
  });

  it('a hit that is not allowed (a party counter-attack) counts for neither the gauge nor the Impulse: alternating allowed and refused hits give Impulse on the ninth hit', () => {
    const f = fake({ boss: 'dark-bahamut', gauge: 0 });
    let impulse = 0;
    for (let hit = 1; hit <= 9; hit++) {
      const allowed = hit % 2 === 1;
      f.ctx.rt.inReaction = !allowed;
      const before = peekReactions(f.ctx).length;
      bahamutHit(hitOf(f, 'dark-bahamut'));
      if (peekReactions(f.ctx).length > before) impulse = hit;
    }
    expect(impulse).toBe(9);
    expect(gaugeOf(f, 'dark-bahamut')).toBe(50);
  });
});

describe("Dark Anima (RE six 4.6)", () => {
  it('one draw modulo 3: 21,846 Mega Graviton (all), 21,845 Pain (one), 21,845 Attack (one) of the 65,536 values (exact); Oblivion on all at 100 with nothing added; +10', () => {
    expect(tally('dark-anima', animaTurn)).toEqual({ [ROW.megaGraviton]: 21_846, [ROW.pain]: 21_845, [ROW.animaAttack]: 21_845 });
    const f = fake({ boss: 'dark-anima', gauge: 100 });
    const c = animaTurn(aiOf(f, 'dark-anima'));
    expect([rowOf(c), c.targets, f.draws, gaugeOf(f, 'dark-anima')]).toEqual([ROW.oblivion, [], [], 0]);
    const g = fake({ boss: 'dark-anima', gauge: 0, raw: 1 });
    animaTurn(aiOf(g, 'dark-anima'));
    expect(gaugeOf(g, 'dark-anima')).toBe(10);
  });

  it('the hit: +5 on every hit event with NO gate: a party counter-attack pays it too, and an aeon that cannot act still pays it; no counter', () => {
    const f = fake({ boss: 'dark-anima', gauge: 0, inReaction: true });
    animaHit(hitOf(f, 'dark-anima'));
    expect(gaugeOf(f, 'dark-anima')).toBe(5);
    (f.ctx.state.combatants['dark-anima'] as FFXCombatant).statuses = { sleep: { id: 'sleep' } } as never;
    animaHit(hitOf(f, 'dark-anima'));
    expect(gaugeOf(f, 'dark-anima')).toBe(10);
    expect(peekReactions(f.ctx)).toEqual([]);
  });
});
