/**
 * **Re-parity, Chapter VII (1 of 2): the opening, Seymour's turn, the Guardians' turn and their Auto-Potion** (FFX only).
 *
 * Rows of `research/re-ffx-ai-seymour.md` section 3 (tables 3.3 and 3.4); the rows that differ from the old AI are D-09
 * to D-13 of the note's section 6. Each describe names the rows it pins. The numbers are the interpreter's: the Guardian's
 * 48.97 % do-nothing turn, the party pair (slot 1 left out by 21,846 of 65,536 values, slots 2 and 3 by 21,845), the
 * opening counters (monsters 0, Seymour 1, the party +2), the Hi-Potion line at 4,800. The second half is
 * `parity-ffx-ai-macalania-acts.test.ts`: the cover, the summon, Anima and Talk.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { summonAeon } from '../../src/battle/ffx/aeons.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { rtOf, type Ctx } from '../../src/battle/ffx/state.ts';
import { nextActor, predictTurnOrder } from '../../src/battle/ffx/turnQueue.ts';
import { pickPartyPair } from '../../src/battle/ffx/ai/slot-pair.ts';
import { macalaniaBuild } from '../../src/data/ffx/builds/macalania.ts';
import { act, at, counters, enemyTurn, exactHit, idOf, realCtx, status, withRng } from './helpers/seymourParity.ts';

const GROUP = 'seymour-anima-macalania';
const A = 'guado-guardian-a';
const B = 'guado-guardian-b';
const SEY = 'seymour-macalania';
const fresh = (seed = 1) => realCtx(GROUP, seed, macalaniaBuild);
const phys = (amount = 100, extra: Partial<AbilityDef> = {}) => exactHit('phys-probe', amount, { damageType: 'physical', ...extra });
const mag = (amount = 100, extra: Partial<AbilityDef> = {}) => exactHit('mag-probe', amount, { damageType: 'magical', ...extra });
/** Skip the opening turns: the Shell and the two Protects are cast, as the first turns cast them. */
function opened(ctx: Ctx): void {
  ctx.state.flags['macalania.shelled'] = true;
  for (const id of [A, B]) ctx.state.flags[`macalania.protected.${id}`] = true;
}

describe('the opening (the formation\'s start hook; D-09)', () => {
  it('every monster\'s counter is 0, Seymour\'s 1, and each party member\'s is raised by 2: both Guardians, Seymour, then the party', () => {
    const { ctx } = fresh();
    expect(rtOf(ctx, A).ctb).toBe(0);
    expect(rtOf(ctx, B).ctb).toBe(0);
    expect(rtOf(ctx, SEY).ctb).toBe(1);
    for (const id of [...ctx.state.activeIds, ...ctx.state.reserveIds]) expect(rtOf(ctx, id).ctb, id).toBeGreaterThanOrEqual(2);
    expect(predictTurnOrder(ctx, 3).map((t) => t.actorId)).toEqual([A, B, SEY]);
    expect(nextActor(ctx)?.id).toBe(A);
  });

  it('nobody opens buffed: Protect and Shell are real turns, cast on the first turn of each and never again', () => {
    const { ctx } = fresh();
    for (const id of [A, B, SEY]) expect(Object.keys(at(ctx, id).statuses), id).toEqual([]);

    const a = enemyTurn(ctx, A);
    expect(idOf(a.command)).toBe('protect');
    expect(a.command?.targets).toEqual([A]);
    expect(at(ctx, A).statuses['protect']).toBeDefined();
    enemyTurn(ctx, B);
    expect(at(ctx, B).statuses['protect']).toBeDefined();

    const s = enemyTurn(ctx, SEY);
    expect(idOf(s.command)).toBe('shell');
    expect(at(ctx, SEY).statuses['shell']).toBeDefined();
    expect(idOf(chooseAiCommand(ctx, at(ctx, SEY)))).toBe('mac-blizzara'); // the second turn is the first spell
  });
});

describe('Seymour\'s turn (m124 @0x13c, table 3.4; D-13)', () => {
  it('the spell set at the index, which moves on before the cast: Ice, Thunder, Water, Fire, and round again', () => {
    const { ctx } = fresh();
    opened(ctx);
    const seq = Array.from({ length: 8 }, () => idOf(chooseAiCommand(ctx, at(ctx, SEY))));
    expect(seq).toEqual([
      'mac-blizzara', 'mac-thundara', 'mac-watera', 'mac-fira', 'mac-blizzara', 'mac-thundara', 'mac-watera', 'mac-fira',
    ]);
  });

  it('act one: the -ra spell on a random living member, drawn the way the script draws: a mask draw, two for the pair, then the pick', () => {
    const { ctx } = fresh();
    opened(ctx);
    // Raw values: the mask picker, the left-out slot (mod 3), the coin, then the final picker. The final pick: 4 mod 3 = 1, Yuna.
    const rng = withRng(ctx, [0, 1, 75, 4]);
    const command = chooseAiCommand(ctx, at(ctx, SEY));
    expect(rng.spent).toEqual({ script: 2, picker: 2, other: 0 });
    expect(idOf(command)).toBe('mac-blizzara');
    expect(command?.targets).toEqual(['yuna']);
  });

  it('with two standing the script spends one coin and a mask draw; with one standing it spends nothing', () => {
    const { ctx } = fresh();
    opened(ctx);
    koActor(ctx, at(ctx, 'rikku'));
    const two = withRng(ctx, [0, 75, 1]);
    chooseAiCommand(ctx, at(ctx, SEY));
    expect(two.spent).toEqual({ script: 1, picker: 2, other: 0 });
    koActor(ctx, at(ctx, 'yuna'));
    const one = withRng(ctx, [9, 9, 9]);
    const command = chooseAiCommand(ctx, at(ctx, SEY));
    expect(one.calls).toHaveLength(0);
    expect(command?.targets).toEqual(['tidus']);
  });

  it('the party pair: the left-out slot is mod 3 of the draw, 21,846 / 21,845 / 21,845 of the 65,536 values; the coin orders the rest', () => {
    const { ctx } = fresh();
    const slots = ctx.state.activeIds;
    const leftOut = [0, 0, 0];
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [0, raw, 75]); // mask draw, the slot, the coin (true: ascending)
      const pair = pickPartyPair(ctx, 'macalania');
      const missing = slots.findIndex((id) => id !== pair?.[0] && id !== pair?.[1]);
      leftOut[missing] = (leftOut[missing] ?? 0) + 1;
    }
    expect(leftOut).toEqual([21_846, 21_845, 21_845]);

    let ascending = 0;
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [0, 0, raw]);
      const pair = pickPartyPair(ctx, 'macalania');
      if (pair && slots.indexOf(pair[0]) < slots.indexOf(pair[1])) ascending += 1;
    }
    expect(ascending).toBe(32_095); // 48.97 %, the script's coin
  });

  it('two standing: the pair is the two living slots, ordered by the coin; one standing: that member twice', () => {
    const { ctx } = fresh();
    const [t, y, r] = ctx.state.activeIds as [string, string, string];
    koActor(ctx, at(ctx, t)); // slot 1 down
    withRng(ctx, [0, 75]);
    expect(pickPartyPair(ctx, 'macalania')).toEqual([y, r]);
    withRng(ctx, [0, 10]);
    expect(pickPartyPair(ctx, 'macalania')).toEqual([r, y]);
    koActor(ctx, at(ctx, y));
    withRng(ctx, []);
    expect(pickPartyPair(ctx, 'macalania')).toEqual([r, r]);
  });

  it('with an aeon on the field he casts the -ga spell on it, the next element of the cycle, even where it absorbs the element', () => {
    const { ctx } = fresh();
    opened(ctx);
    summonAeon(ctx, 'yuna', 'shiva');
    const rng = withRng(ctx, [5, 5, 5]);
    const command = chooseAiCommand(ctx, at(ctx, SEY));
    expect(idOf(command)).toBe('mac-blizzaga'); // Shiva absorbs Ice; the script does not care
    expect(command?.targets).toEqual(['shiva']);
    expect(rng.calls).toHaveLength(0); // a single candidate everywhere: nothing drawn
    expect(idOf(chooseAiCommand(ctx, at(ctx, SEY)))).toBe('mac-thundaga'); // and the cycle moved on
  });

  it('he does nothing while Anima is out (mode 128)', () => {
    const { ctx } = fresh();
    opened(ctx);
    ctx.state.flags['macalania.act'] = 2;
    expect(chooseAiCommand(ctx, at(ctx, SEY))).toBeNull();
  });

  it('act three: the Multi- spell as two commands at the two slots of the pair, so two different members while two or more stand (D-13)', () => {
    const { ctx } = fresh();
    opened(ctx);
    ctx.state.flags['macalania.act'] = 3;
    const [t, y, r] = ctx.state.activeIds as [string, string, string];
    const rng = withRng(ctx, [0, 0, 75]); // mask, slot 1 left out, ascending: Yuna then Rikku
    const command = chooseAiCommand(ctx, at(ctx, SEY));
    expect(idOf(command)).toBe('mac-multi-blizzara');
    expect(command?.targets).toEqual([y, r]);
    expect(rng.spent).toEqual({ script: 2, picker: 1, other: 0 }); // no final pick in act three
    void t;

    // Played through: hit 1 on the first named member, hit 2 on the second.
    const played = withRng(ctx, [0, 1, 75]); // slot 2 left out: Tidus then Rikku
    ctx.state.flags['macalania.elementStep'] = 0;
    const turn = enemyTurn(ctx, SEY);
    void played;
    const hits = turn.events.filter((e) => e.type === 'damage');
    expect(hits.map((e) => (e as { targetId: string }).targetId)).toEqual([t, r]);
    expect(hits.map((e) => (e as { hitIndex: number }).hitIndex)).toEqual([0, 1]);
  });

  it('act three with one member standing: both halves land on that member', () => {
    const { ctx } = fresh();
    opened(ctx);
    ctx.state.flags['macalania.act'] = 3;
    koActor(ctx, at(ctx, 'tidus'));
    koActor(ctx, at(ctx, 'yuna'));
    at(ctx, 'rikku').hp = at(ctx, 'rikku').stats.maxHp = 99_999; // she must outlive the first half to meet the second
    const turn = enemyTurn(ctx, SEY);
    const hits = turn.events.filter((e) => e.type === 'damage') as Array<{ targetId: string }>;
    expect(hits.map((h) => h.targetId)).toEqual(['rikku', 'rikku']);
  });
});

describe('the Guardian\'s turn (m141 @0x12a, table 3.3; D-10)', () => {
  /** A Guardian that has opened, with the script fed `values`. */
  function turn(ctx: Ctx, who: string, values: number[]) {
    opened(ctx);
    const rng = withRng(ctx, values);
    return { command: chooseAiCommand(ctx, at(ctx, who)), rng };
  }

  it('row 2: Hi-Potion on Seymour when 4,800 is more than his HP, and never once it has been stolen from', () => {
    const { ctx } = fresh();
    at(ctx, SEY).hp = 4799;
    expect(idOf(turn(ctx, A, []).command)).toBe('guardian-hi-potion');
    at(ctx, SEY).hp = 4800;
    expect(idOf(turn(ctx, A, [75, 0]).command)).toBe('pass'); // no longer below the line
    at(ctx, SEY).hp = 100;
    rtOf(ctx, A).stealCount = 1;
    expect(idOf(turn(ctx, A, [75, 0]).command)).toBe('pass'); // stolen from: no potions
  });

  it('rows 3 and 4: Remedy on Seymour for Poison or Silence, then on itself, both returning before any draw; the steal does not gate them', () => {
    const { ctx } = fresh();
    rtOf(ctx, A).stealCount = 1;
    at(ctx, SEY).statuses['poison'] = status('poison');
    const first = turn(ctx, A, []);
    expect(first.command).toMatchObject({ id: 'guardian-remedy', targets: [SEY] });
    expect(first.rng.calls).toHaveLength(0);
    delete at(ctx, SEY).statuses['poison'];
    at(ctx, SEY).statuses['silence'] = status('silence');
    expect(idOf(turn(ctx, A, []).command)).toBe('guardian-remedy');
    delete at(ctx, SEY).statuses['silence'];
    at(ctx, A).statuses['silence'] = status('silence');
    expect(turn(ctx, A, []).command).toMatchObject({ id: 'guardian-remedy-self', targets: [A] });
  });

  it('row 5: 48.97 % of the draws end the turn with nothing cast, after a second draw that picks a spell it never casts', () => {
    const { ctx } = fresh();
    opened(ctx);
    let nothing = 0;
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [raw, 0]);
      if (chooseAiCommand(ctx, at(ctx, A)) === null) nothing += 1;
    }
    expect(nothing).toBe(32_095);
    const spent = turn(ctx, A, [75, 3]);
    expect(spent.command).toBeNull();
    expect(spent.rng.spent).toEqual({ script: 2, picker: 0, other: 0 });
  });

  it('rows 6 and 7: Remedy on Guardian A when it sleeps or is silenced, and on SEYMOUR (not on B) when B does', () => {
    const { ctx } = fresh();
    at(ctx, A).statuses['sleep'] = status('sleep');
    expect(turn(ctx, B, [10]).command).toMatchObject({ id: 'guardian-remedy', targets: [A] });
    delete at(ctx, A).statuses['sleep'];
    at(ctx, B).statuses['silence'] = status('silence');
    expect(turn(ctx, A, [10]).command).toMatchObject({ id: 'guardian-remedy', targets: [SEY] });
    delete at(ctx, B).statuses['silence'];
    at(ctx, B).statuses['sleep'] = status('sleep');
    expect(turn(ctx, A, [10]).command).toMatchObject({ id: 'guardian-remedy', targets: [SEY] });
  });

  it('row 8: mod 3 picks Blizzard, Thunder or Shremedy, aimed by the picker; a single candidate draws nothing', () => {
    const { ctx } = fresh();
    const want = ['guardian-blizzard', 'guardian-thunder', 'guardian-shremedy'];
    for (let r = 0; r < 3; r++) {
      const { command, rng } = turn(ctx, A, [10, r, 4]); // coin false, the spell, the victim (4 mod 3 = Yuna)
      expect(idOf(command)).toBe(want[r]);
      expect(command?.targets).toEqual(['yuna']);
      expect(rng.spent).toEqual({ script: 2, picker: 1, other: 0 });
    }
    const spells = [0, 0, 0];
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [10, raw, 0]);
      const i = want.indexOf(idOf(chooseAiCommand(ctx, at(ctx, A))));
      spells[i] = (spells[i] ?? 0) + 1;
    }
    expect(spells).toEqual([21_846, 21_845, 21_845]);
    koActor(ctx, at(ctx, 'tidus'));
    koActor(ctx, at(ctx, 'yuna'));
    const alone = turn(ctx, A, [10, 0]);
    expect(alone.command?.targets).toEqual(['rikku']);
    expect(alone.rng.spent.picker).toBe(0);
  });
});

describe('what reaches the Guardians: Auto-Potion (m141 @0x2cd, @0x34b; D-12)', () => {
  const potions = (events: readonly BattleEvent[], id = A): number => counters(events, id).filter((c) => c === 'guardian-auto-potion').length;

  it('any action that takes HP from a Guardian is answered once, whatever its type or its hit count, +1,000 HP at no CTB cost', () => {
    for (const probe of [phys(100), mag(100), mag(100, { hits: 3 })]) {
      const { ctx } = fresh();
      at(ctx, A).hp = 1000;
      const events = act(ctx, 'tidus', probe, [A]);
      expect(potions(events), probe.id).toBe(1);
      expect(at(ctx, A).hp).toBeGreaterThan(1000);
    }
  });

  it('it answers no heal, no zero, no killing blow and nothing once the Guardian has been stolen from', () => {
    const { ctx } = fresh();
    expect(potions(act(ctx, 'tidus', mag(0), [A]))).toBe(0);
    at(ctx, A).hp = 1000;
    expect(potions(act(ctx, 'tidus', mag(5000), [A]))).toBe(0); // dead
    expect(at(ctx, A).alive).toBe(false);

    const robbed = fresh().ctx;
    rtOf(robbed, B).stealCount = 1;
    expect(potions(act(robbed, 'tidus', mag(100), [B]), B)).toBe(0);
  });

  it('a Guardian that was asleep when the command named it is not answered, and a physical blow that woke it spends the mark', () => {
    const { ctx } = fresh();
    at(ctx, A).statuses['sleep'] = status('sleep');
    expect(potions(act(ctx, 'tidus', mag(100), [A]))).toBe(0); // asleep still
    expect(potions(act(ctx, 'tidus', phys(100), [A]))).toBe(0); // woken by this very blow: the mark was 255
    expect(at(ctx, A).statuses['sleep']).toBeUndefined();
    expect(potions(act(ctx, 'tidus', phys(100), [A]))).toBe(1); // the next one is answered
  });

  it('a Threatened Guardian does not answer', () => {
    const { ctx } = fresh();
    at(ctx, A).statuses['threaten'] = status('threaten');
    expect(potions(act(ctx, 'tidus', mag(100), [A]))).toBe(0);
  });

  it('once a Guardian has been stolen from, its steal chance is 0 from its next hit on', () => {
    const { ctx } = fresh();
    expect(at(ctx, A).enemy?.rewards.steal?.baseChance).toBe(100);
    rtOf(ctx, A).stealCount = 1; // a successful Steal
    act(ctx, 'tidus', mag(10), [A]);
    expect(at(ctx, A).enemy?.rewards.steal?.baseChance).toBe(0);
  });
});
