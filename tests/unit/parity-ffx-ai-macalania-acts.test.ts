/**
 * **Re-parity, Chapter VII (2 of 2): the cover, the summon, Anima, her death and Talk** (FFX only).
 *
 * Rows of `research/re-ffx-ai-seymour.md` section 3 (tables 3.5 and 3.6); the rows that differ from the old AI are D-11 and
 * D-14 to D-18 of the note's section 6. The numbers are the interpreter's: the Guard coin (48.97 % for Guardian A), the
 * summon line at 3,000 (inclusive) or a lethal blow, Anima's +5 steps and Oblivion at 100, her arrival (counter 0, the
 * party +1). The first half is `parity-ffx-ai-macalania.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { rtOf, type Ctx } from '../../src/battle/ffx/state.ts';
import { baseCtb } from '../../src/battle/ffx/math.ts';
import { nextActor, predictTurnOrder } from '../../src/battle/ffx/turnQueue.ts';
import { onTurnEnd } from '../../src/battle/ffx/ticks.ts';
import { runMacalaniaPhaseHooks } from '../../src/battle/ffx/ai/macalania-acts.ts';
import { macalaniaTalkAvailable, consumeMacalaniaTalk } from '../../src/battle/ffx/ai/macalania-talk.ts';
import { macalaniaBuild } from '../../src/data/ffx/builds/macalania.ts';
import { act, at, exactHit, idOf, realCtx, status, withRng } from './helpers/seymourParity.ts';

const GROUP = 'seymour-anima-macalania';
const A = 'guado-guardian-a';
const B = 'guado-guardian-b';
const SEY = 'seymour-macalania';
const ANI = 'anima-macalania';

const fresh = (seed = 1) => realCtx(GROUP, seed, macalaniaBuild);
const phys = (amount = 100, extra: Partial<AbilityDef> = {}) => exactHit('phys-probe', amount, { damageType: 'physical', ...extra });
const mag = (amount = 100, extra: Partial<AbilityDef> = {}) => exactHit('mag-probe', amount, { damageType: 'magical', ...extra });
/** The damage a target took in these events: a heal is a negative `damage` event and does not count. */
const damageOn = (events: readonly BattleEvent[], id: string): number =>
  events.reduce((sum, e) => (e.type === 'damage' && e.targetId === id && e.amount > 0 ? sum + e.amount : sum), 0);

/** Skip the opening turns: the Shell and the two Protects are cast, as the first turns cast them. */
function opened(ctx: Ctx): void {
  ctx.state.flags['macalania.shelled'] = true;
  for (const id of [A, B]) ctx.state.flags[`macalania.protected.${id}`] = true;
}

describe('the Guard and the cover (m124 @0x42b; engine 0x78eef0; D-11)', () => {
  it('a physical command that names Seymour puts the Guard on A (coin true) or on B (coin false), and that Guardian takes the blow', () => {
    for (const [coin, taker, other] of [[75, A, B], [10, B, A]] as const) {
      const { ctx } = fresh();
      const rng = withRng(ctx, [coin]);
      const events = act(ctx, 'tidus', phys(100), [SEY]);
      expect(rng.spent.script).toBe(1);
      expect(damageOn(events, taker), `coin ${coin}`).toBeGreaterThan(0);
      expect(damageOn(events, other)).toBe(0);
      expect(at(ctx, SEY).hp).toBe(6000);
      expect(rtOf(ctx, taker).guardMark, 'cleared by its own hit').toBe(false);
    }
  });

  it('a sleeping Guardian is skipped; with both asleep nobody is marked and the blow reaches Seymour', () => {
    const { ctx } = fresh();
    at(ctx, A).statuses['sleep'] = status('sleep');
    withRng(ctx, [75]); // A would have been chosen
    expect(damageOn(act(ctx, 'tidus', phys(100), [SEY]), B)).toBeGreaterThan(0);

    const both = fresh().ctx;
    at(both, A).statuses['sleep'] = status('sleep');
    at(both, B).statuses['sleep'] = status('sleep');
    withRng(both, [75]);
    const events = act(both, 'tidus', phys(100), [SEY]);
    expect(damageOn(events, SEY)).toBeGreaterThan(0);
    expect(rtOf(both, A).guardMark).not.toBe(true);
  });

  it('magic is never covered, and spends no draw: only the damage type decides', () => {
    const { ctx } = fresh();
    const rng = withRng(ctx, [75]);
    const events = act(ctx, 'tidus', mag(100), [SEY]);
    expect(damageOn(events, SEY)).toBe(100);
    expect(rng.spent.script).toBe(0);
    expect(rtOf(ctx, A).guardMark).not.toBe(true);
  });

  it('with one Guardian left it is the one that is marked, A first, else B', () => {
    const onlyB = fresh().ctx;
    koActor(onlyB, at(onlyB, A));
    expect(damageOn(act(onlyB, 'tidus', phys(100), [SEY]), B)).toBeGreaterThan(0);
    const onlyA = fresh().ctx;
    koActor(onlyA, at(onlyA, B));
    expect(damageOn(act(onlyA, 'tidus', phys(100), [SEY]), A)).toBeGreaterThan(0);
  });

  it('when both hold the Guard, the one with more HP covers; one that cannot act does not', () => {
    const { ctx } = fresh();
    withRng(ctx, [75]);
    rtOf(ctx, A).guardMark = true;
    rtOf(ctx, B).guardMark = true;
    at(ctx, A).hp = 1500;
    at(ctx, B).hp = 2000;
    expect(damageOn(act(ctx, 'tidus', phys(50), [SEY]), B)).toBeGreaterThan(0);

    const asleep = fresh().ctx;
    withRng(asleep, [10]);
    rtOf(asleep, A).guardMark = true;
    rtOf(asleep, B).guardMark = true;
    at(asleep, A).hp = 1500;
    at(asleep, B).hp = 2000;
    at(asleep, B).statuses['sleep'] = status('sleep');
    expect(damageOn(act(asleep, 'tidus', phys(50), [SEY]), A)).toBeGreaterThan(0);
  });
});

describe('the summon (m124 @0x5be to 0x81c, table 3.5; D-17)', () => {
  function summoned(hpBefore: number, dealt: number, rest: (ctx: Ctx) => void = () => undefined) {
    const { ctx, events } = fresh();
    opened(ctx);
    at(ctx, SEY).hp = hpBefore;
    rest(ctx);
    const out = act(ctx, 'tidus', mag(dealt), [SEY]);
    return { ctx, events: out, all: events };
  }

  it('the line is 3,000 and inclusive: 3,000 summons, 3,001 does not', () => {
    expect(summoned(3300, 300).ctx.state.flags['macalania.animaSummoned']).toBe(true);
    expect(summoned(3301, 300).ctx.state.flags['macalania.animaSummoned']).toBe(false);
    expect(summoned(6000, 100).ctx.state.flags['macalania.act']).toBe(1);
  });

  it('a lethal blow before the summon is let through and is the summon: no cap, no floor, he stands on 6,000', () => {
    const { ctx, events } = summoned(6000, 9000);
    const seymour = at(ctx, SEY);
    expect(damageOn(events, SEY)).toBeGreaterThanOrEqual(6000);
    expect(events.some((e) => e.type === 'ko' && e.targetId === SEY)).toBe(false);
    expect(seymour.alive).toBe(true);
    expect(seymour.hp).toBe(6000);
    expect(seymour.stats.maxHp).toBe(6000);
    expect(ctx.rt.overkilled).not.toContain(SEY); // he did not die
    expect(ctx.state.flags['macalania.act']).toBe(2);
  });

  it('it clears Poison, the three Breaks and Slow (and nothing else), kills both Guardians, sets Magic 32, hides him and takes his turns', () => {
    const { ctx, events } = summoned(3100, 200, (c) => {
      for (const s of ['poison', 'magic-break', 'armor-break', 'mental-break', 'slow', 'shell', 'haste'] as const) at(c, SEY).statuses[s] = status(s);
    });
    const seymour = at(ctx, SEY);
    for (const s of ['poison', 'magic-break', 'armor-break', 'mental-break', 'slow'] as const) expect(seymour.statuses[s], s).toBeUndefined();
    expect(seymour.statuses['shell']).toBeDefined(); // not cleared by the summon
    expect(seymour.statuses['haste']).toBeDefined();
    for (const g of [A, B]) expect(at(ctx, g).alive, g).toBe(false);
    expect(events.filter((e) => e.type === 'ko').map((e) => (e as { targetId: string }).targetId).sort()).toEqual([A, B]);
    expect(seymour.stats.mag).toBe(32);
    expect(seymour.flags.untargetable).toBe(true);
    expect(rtOf(ctx, SEY).ordersOnly).toBe(true);
    expect(predictTurnOrder(ctx, 8).some((t) => t.actorId === SEY)).toBe(false);
    expect(macalaniaTalkAvailable(ctx, 'tidus')).toBe(false); // Talk is removed from Tidus, Yuna and Wakka
  });

  it('Anima arrives with counter 0 and each active party member\'s +1, so she acts first; her line is emitted after the reveal', () => {
    const { ctx, events } = summoned(3100, 200, (c) => {
      for (const id of c.state.activeIds) rtOf(c, id).ctb = 0;
    });
    const anima = at(ctx, ANI);
    expect(anima.removed).toBe(false);
    expect(anima.hp).toBe(18000);
    expect(rtOf(ctx, ANI).ctb).toBe(0);
    for (const id of ctx.state.activeIds) expect(rtOf(ctx, id).ctb, id).toBe(1);
    expect(nextActor(ctx)?.id).toBe(ANI);
    const types = events.map((e) => e.type);
    const trigger = events.findIndex((e) => e.type === 'script-trigger' && e.name === 'mac-anima-summon');
    expect(trigger).toBeGreaterThan(-1);
    expect(trigger).toBeGreaterThan(types.indexOf('part-restored'));
  });

  it('his HP is written back with a heal event the HUD can follow', () => {
    const { events } = summoned(3100, 200);
    const heal = events.find((e) => e.type === 'heal' && e.targetId === SEY);
    expect(heal).toMatchObject({ amount: 3100, cause: 'seymour-restored' }); // 2,900 left after the blow, written back to 6,000
  });

  it('a Poison tick on his own turn can take him to the line (the postPoison hook skips the "lost HP" test)', () => {
    const { ctx } = fresh();
    opened(ctx);
    const seymour = at(ctx, SEY);
    seymour.hp = 3100;
    seymour.statuses['poison'] = status('poison');
    onTurnEnd(ctx, seymour);
    expect(ctx.state.flags['macalania.animaSummoned']).toBe(true);
    expect(seymour.hp).toBe(6000);
  });

  it('the hit hook stops when the action took no HP: a heal on him does not summon', () => {
    const { ctx } = fresh();
    opened(ctx);
    at(ctx, SEY).hp = 2900; // below the line already (he cannot be, but the hook must still read "lost HP")
    act(ctx, 'tidus', mag(0), [SEY]);
    expect(ctx.state.flags['macalania.animaSummoned']).toBe(false);
  });
});

describe('Anima (m125 @0x21e, table 3.6; D-14, D-15)', () => {
  function anima() {
    const base = fresh();
    opened(base.ctx);
    act(base.ctx, 'tidus', mag(9000), [SEY]); // the summon
    return base;
  }

  it('Boost, Pain, Boost, Pain; each Pain adds 5 to her gauge and a Boost nothing', () => {
    const { ctx } = anima();
    const self = at(ctx, ANI);
    const ids: string[] = [];
    const gauges: number[] = [];
    for (let i = 0; i < 4; i++) {
      withRng(ctx, [i]);
      ids.push(idOf(chooseAiCommand(ctx, self)));
      gauges.push(self.overdrive?.gauge ?? -1);
    }
    expect(ids).toEqual(['anima-boost', 'anima-pain-boss', 'anima-boost', 'anima-pain-boss']);
    expect(gauges).toEqual([0, 5, 5, 10]);
  });

  it('Pain is aimed by the picker over the living front line; Boost goes on herself', () => {
    const { ctx } = anima();
    const self = at(ctx, ANI);
    expect(chooseAiCommand(ctx, self)?.targets).toEqual([ANI]);
    const rng = withRng(ctx, [4]);
    expect(chooseAiCommand(ctx, self)?.targets).toEqual(['yuna']);
    expect(rng.spent.picker).toBe(1);
  });

  it('at 100 the gauge goes to Oblivion on the whole front line and to 0 -- and that turn takes its place in the cycle', () => {
    const { ctx } = anima();
    const self = at(ctx, ANI);
    self.overdrive!.gauge = 100;
    ctx.state.flags['macalania.animaCycle'] = 1; // the next index would be Pain
    const command = chooseAiCommand(ctx, self);
    expect(idOf(command)).toBe('anima-oblivion');
    expect(command?.targets).toEqual([]);
    expect(self.overdrive?.gauge).toBe(0);
    expect(ctx.state.flags['macalania.animaCycle']).toBe(2);
    expect(idOf(chooseAiCommand(ctx, self))).toBe('anima-boost'); // index 2, not a Pain
  });

  it('every action that reaches her adds 5, once however many hits it makes, and a miss, a heal and a zero count too', () => {
    const { ctx } = anima();
    const self = at(ctx, ANI);
    const gauge = (): number => self.overdrive?.gauge ?? -1;
    act(ctx, 'tidus', mag(10), [ANI]);
    expect(gauge()).toBe(5);
    act(ctx, 'tidus', mag(10, { hits: 3 }), [ANI]);
    expect(gauge()).toBe(10);
    act(ctx, 'tidus', mag(0), [ANI]);
    expect(gauge()).toBe(15);
    const missed = act(ctx, 'tidus', mag(10, { canMiss: true, accuracy: 0 }), [ANI]);
    expect(missed.some((e) => e.type === 'miss')).toBe(true);
    expect(gauge()).toBe(20);
  });

  it('damage taken fills nothing by itself (her gauge mode is "aeons only") and her own turn adds nothing', () => {
    const { ctx } = anima();
    const self = at(ctx, ANI);
    withRng(ctx, [0]);
    chooseAiCommand(ctx, self); // a Boost turn
    expect(self.overdrive?.gauge).toBe(0);
  });

  it('on her death Seymour is re-initialised: full HP, no status of any kind, Magic 32, his counter at tick x 3, back in the queue', () => {
    const { ctx } = anima();
    const seymour = at(ctx, SEY);
    seymour.statuses['shell'] = status('shell');
    seymour.statuses['haste'] = status('haste');
    ctx.state.flags['macalania.elementStep'] = 2;
    act(ctx, 'tidus', mag(20_000), [ANI]);
    runMacalaniaPhaseHooks(ctx);
    expect(ctx.state.flags['macalania.act']).toBe(3);
    expect(at(ctx, ANI).removed).toBe(true);
    expect(Object.keys(seymour.statuses)).toEqual([]);
    expect(seymour.hp).toBe(6000);
    expect(seymour.stats.mag).toBe(32);
    expect(seymour.flags.untargetable).toBe(false);
    expect(rtOf(ctx, SEY).ordersOnly).toBe(false);
    expect(rtOf(ctx, SEY).ctb).toBe(baseCtb(seymour.stats.agi) * 3);
    expect(ctx.state.flags['macalania.elementStep']).toBe(2); // his cycle is untouched
    expect(idOf(chooseAiCommand(ctx, seymour))).toBe('mac-multi-watera'); // and he does not cast the Shell again
  });
});

describe('Talk (the formation\'s turn-start handlers, section 3.1; D-18)', () => {
  it('Tidus and Yuna can Talk only while present without Death, Petrify, Sleep or Silence; Wakka\'s is never gated by his own state', () => {
    const { ctx } = fresh();
    for (const who of ['tidus', 'yuna', 'wakka'] as const) expect(macalaniaTalkAvailable(ctx, who), who).toBe(true);
    for (const s of ['silence', 'sleep', 'petrify'] as const) {
      at(ctx, 'tidus').statuses[s] = status(s);
      at(ctx, 'wakka').statuses[s] = status(s);
      expect(macalaniaTalkAvailable(ctx, 'tidus'), `Tidus ${s}`).toBe(false);
      expect(macalaniaTalkAvailable(ctx, 'wakka'), `Wakka ${s}`).toBe(true);
      delete at(ctx, 'tidus').statuses[s];
      delete at(ctx, 'wakka').statuses[s];
    }
    koActor(ctx, at(ctx, 'yuna'));
    expect(macalaniaTalkAvailable(ctx, 'yuna')).toBe(false);
  });

  it('each of the three has one line, +10 Strength (Tidus) or +10 Magic Defense (Yuna, Wakka), and none after the summon', () => {
    const { ctx } = fresh();
    const tidus = at(ctx, 'tidus');
    const str = tidus.stats.str;
    expect(consumeMacalaniaTalk(ctx, tidus)).toBe(true);
    expect(tidus.stats.str).toBe(str + 10);
    expect(consumeMacalaniaTalk(ctx, tidus)).toBe(false);
    ctx.state.flags['macalania.act'] = 2;
    expect(macalaniaTalkAvailable(ctx, 'yuna')).toBe(false);
    expect(macalaniaTalkAvailable(ctx, 'kimahri')).toBe(false); // not this fight's table
  });
});
