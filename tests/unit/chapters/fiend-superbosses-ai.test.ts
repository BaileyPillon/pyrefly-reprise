/**
 * The five scripts of the Fiend Arena Superbosses (Almighty Shinra and the four heads of the Major Numerus; the hidden FFX-2 chapter 53): poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/shinra-almighty.ts` and `numerus.ts` are the game's own order (`m329` to `m333`; `research/re-ffx2-fiend-arena-superbosses.md` sections 2 and 3, the sources read again for this stage).
 * What this file pins, each fact tagged `[RE]`:
 *
 * 1. **Shinra** [RE 3.1]: the six-poll loop (Clione, Attack, Ultima or Final Impact under a quarter, Attack, Full Break or Fireworks under a half, Haste or Final Impact when hasted), no random number, the thresholds at
 *    the exact edge, the counter back to 0.
 * 2. **Unum** [RE 3.2]: seven polls; the monster-side search for Shell and Protect (the living heads only, himself included, the parts and the fallen not), the draw that search spends, White Highwind under an eighth.
 * 3. **Duo** [RE 3.3] and **Tria** [RE 3.4]: the coin (`random() mod 2`: a one takes the first move of a pair, a zero the second, read from the source), the draw order (coin, then the search), the polls with no coin.
 * 4. **Quattour** [RE 3.5]: nine polls, no random number.
 * 5. **The death rule** [RE 2]: the dying head sets the body and the pod to 0 HP when the other three heads are at 0, and does nothing otherwise.
 * 6. **The draws**: `random() mod n` is stream 2 (0 to 0xFFFF), a target search is stream 4 (0 to 0x7FFFFFFF) and draws only with two or more candidates; `[inferred]` the single-girl picks are uniform (pick S2-1).
 */
import { describe, expect, it } from 'vitest';

import type { AbilityDef } from '../../../src/battle/common/types.ts';
import { aiScriptFor, aiScriptIds } from '../../../src/battle/ffx2/ai/index.ts';
import {
  COIN_MODULUS, DUO_BEATS, DUO_COUNT, QUATTOUR_BEATS, QUATTOUR_COUNT, TRIA_BEATS, TRIA_COUNT, UNUM_COUNT,
  numerusDeathEntry, numerusScripts, otherHeadsDown, x2NumerusDuoScript, x2NumerusQuattourScript, x2NumerusTriaScript, x2NumerusUnumScript,
} from '../../../src/battle/ffx2/ai/numerus.ts';
import { SHINRA_COUNT, shinraAlmightyScripts, x2AlmightyShinraScript } from '../../../src/battle/ffx2/ai/shinra-almighty.ts';
import { mem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { ALL_BOSS_ABILITIES } from '../../../src/data/ffx2/enemies/index.ts';
import { act1ShinraGroup, act2NumerusGroup } from '../../../src/data/ffx2/enemies/fiend-superbosses.ts';
import * as ids from '../../../src/data/fiend-superbosses-ids.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const A = ids.FS_ABILITY;
const ABILITIES: ReadonlyMap<string, AbilityDef> = new Map(ALL_BOSS_ABILITIES.map((a) => [a.id, a]));
const ROLL: [number, number] = [0, 0xffff];
const SEARCH: [number, number] = [0, 0x7fffffff];

/** A status, the way the engine lays one (a bare instance). */
function give(unit: Ffx2Unit, status: string): void {
  unit.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
}

const HP = { shinra: 275_000, unum: 555_555, duo: 666_666, tria: 666_666, quattour: 777_777 } as const;
const shinra = (hp?: number): Bench => bench(enemy(ids.X2_ALMIGHTY_SHINRA_ID, HP.shinra, { mp: 999, ...(hp !== undefined ? { hp } : {}) }), ids.SHINRA_SCRIPT_ID);

/** The act-2 formation as units: the four heads on slots 0 to 3 and the three parts (flagged) after them. `self` is the head under test. */
function formation(): { heads: Ffx2Unit[]; parts: Ffx2Unit[]; all: Ffx2Unit[] } {
  const heads = [
    enemy(ids.X2_NUMERUS_UNUM_ID, HP.unum, { mp: 999, slot: 0 }), enemy(ids.X2_NUMERUS_DUO_ID, HP.duo, { mp: 999, slot: 1 }),
    enemy(ids.X2_NUMERUS_TRIA_ID, HP.tria, { mp: 999, slot: 2 }), enemy(ids.X2_NUMERUS_QUATTOUR_ID, HP.quattour, { mp: 999, slot: 3 }),
  ];
  const parts = [ids.X2_NUMERUS_BODY_ID, ids.X2_NUMERUS_POD_ID, ids.X2_NUMERUS_TAIL_ID].map((id, i) => {
    const part = enemy(id, 1, { slot: 4 + i });
    part.flags.isPart = true;
    return part;
  });
  return { heads, parts, all: [...heads, ...parts] };
}
const HEAD_INDEX = { unum: 0, duo: 1, tria: 2, quattour: 3 } as const;
type Head = keyof typeof HEAD_INDEX;
const SCRIPT_OF: Record<Head, string> = { unum: ids.UNUM_SCRIPT_ID, duo: ids.DUO_SCRIPT_ID, tria: ids.TRIA_SCRIPT_ID, quattour: ids.QUATTOUR_SCRIPT_ID };

/** A bench for one head, with the other three heads and the three parts beside it. `hp` sets the head's own HP. */
function head(which: Head, hp?: number): Bench & { f: ReturnType<typeof formation> } {
  const f = formation();
  const self = f.heads[HEAD_INDEX[which]]!;
  if (hp !== undefined) self.hp = hp;
  const b = bench(self, SCRIPT_OF[which], f.all.filter((u) => u !== self));
  return Object.assign(b, { f });
}
/** The girl the uniform search picks for a raw value (all three standing). */
const pick = (raw: number): string => ['yuna', 'rikku', 'paine'][raw % 3]!;

describe('the ids the scripts name are the data files\'', () => {
  it('the five script ids are registered (not the idle fallback) and the enemy data names them; the three parts run the idle script', () => {
    for (const id of [ids.SHINRA_SCRIPT_ID, ids.UNUM_SCRIPT_ID, ids.DUO_SCRIPT_ID, ids.TRIA_SCRIPT_ID, ids.QUATTOUR_SCRIPT_ID]) expect(aiScriptFor(id).id, id).toBe(id);
    expect(aiScriptIds()).toEqual(expect.arrayContaining([ids.SHINRA_SCRIPT_ID, ids.UNUM_SCRIPT_ID, ids.DUO_SCRIPT_ID, ids.TRIA_SCRIPT_ID, ids.QUATTOUR_SCRIPT_ID]));
    expect(shinraAlmightyScripts.map((s) => s.id)).toEqual([ids.SHINRA_SCRIPT_ID]);
    expect(numerusScripts.map((s) => s.id)).toEqual([ids.UNUM_SCRIPT_ID, ids.DUO_SCRIPT_ID, ids.TRIA_SCRIPT_ID, ids.QUATTOUR_SCRIPT_ID]);
    expect(act1ShinraGroup.enemies.map((e) => e.aiScriptId)).toEqual([ids.SHINRA_SCRIPT_ID]);
    expect(act2NumerusGroup.enemies.map((e) => e.aiScriptId)).toEqual([ids.UNUM_SCRIPT_ID, ids.DUO_SCRIPT_ID, ids.TRIA_SCRIPT_ID, ids.QUATTOUR_SCRIPT_ID]);
    expect((act2NumerusGroup.parts ?? []).map((p) => p.aiScriptId)).toEqual(['idle', 'idle', 'idle']);
    expect(aiScriptFor('idle').id).toBe('idle');
  });

  it('every move a script can queue is a registered ability, and a girl-aimed move is a single-target row while a party-aimed one is not', () => {
    const queued = new Set<string>([A.clione, A.attack, A.ultimaShinra, A.finalImpact, A.fullBreak, A.fireworks, A.haste, A.radisCommand, A.sparkler, A.dispel, A.shell, A.whiteHighwind, A.protect]);
    for (const beats of [DUO_BEATS, TRIA_BEATS, QUATTOUR_BEATS]) {
      for (const beat of beats) {
        for (const move of beat) {
          queued.add(move.id);
          const targeting = ABILITIES.get(move.id)?.targeting;
          expect(targeting, move.id).toBeDefined();
          if (move.aim === 'girl') expect(targeting, `${move.id} is aimed at a girl`).toBe('single-enemy');
          else expect(['all-enemies', 'random-enemy'], `${move.id} is aimed at the party`).toContain(targeting);
        }
      }
    }
    for (const id of queued) expect(ABILITIES.has(id), id).toBe(true);
    expect(queued.size).toBe(35); // the 35 moves of the five scripts (stage 1: 22 reused by id, 13 new)
    expect(Object.values(A).sort()).toEqual([...queued].sort());
  });
});

describe('Almighty Shinra [RE 3.1]', () => {
  const LOOP = [A.clione, A.attack, A.ultimaShinra, A.attack, A.fullBreak, A.haste];

  it('a loop of six polls at full HP: Clione, Attack, Ultima, Attack, Full Break, Haste; then it starts over', () => {
    const b = shinra();
    const seen: string[] = [];
    for (let i = 0; i < 13; i++) seen.push(b.id(b.poll(0, 0))!); // a search value of 0 whenever one is drawn
    b.rng.drain();
    expect(seen).toEqual([...LOOP, ...LOOP, A.clione]);
    expect(mem(b.self, SHINRA_COUNT)).toBe(1);
  });

  it('the sixth poll: no Haste on him, Haste on himself; hasted, Final Impact on the party; either way the counter is back to 0', () => {
    const plain = shinra();
    for (let i = 0; i < 5; i++) plain.poll(0, 0);
    const c = plain.poll();
    expect([plain.id(c), plain.targets(c)]).toEqual([A.haste, [ids.X2_ALMIGHTY_SHINRA_ID]]);
    expect(mem(plain.self, SHINRA_COUNT)).toBe(0);
    expect(plain.id(plain.poll())).toBe(A.clione);

    const hasted = shinra();
    give(hasted.self, 'haste');
    for (let i = 0; i < 5; i++) hasted.poll(0, 0);
    const f = hasted.poll();
    expect([hasted.id(f), hasted.targets(f)]).toEqual([A.finalImpact, []]);
    expect(mem(hasted.self, SHINRA_COUNT)).toBe(0);
    expect(hasted.id(hasted.poll())).toBe(A.clione);
  });

  it('the third poll: Final Impact below a quarter of 275,000 (68,749 or less), Ultima at 68,750 and above', () => {
    for (const [hp, id] of [[68_749, A.finalImpact], [68_750, A.ultimaShinra], [1, A.finalImpact], [275_000, A.ultimaShinra]] as const) {
      const b = shinra(hp);
      b.poll(0, 0);
      b.poll(0, 0);
      expect(b.id(b.poll()), `hp ${hp}`).toBe(id);
    }
  });

  it('the fifth poll: Fireworks on the party below a half (137,499 or less), a Full Break on one girl at 137,500 and above', () => {
    for (const [hp, id, targets] of [[137_499, A.fireworks, []], [137_500, A.fullBreak, ['paine']]] as const) {
      const b = shinra(hp);
      for (let i = 0; i < 4; i++) b.poll(2, 2);
      const c = b.poll(2);
      expect([b.id(c), b.targets(c)], `hp ${hp}`).toEqual([id, targets]);
    }
    // Under a quarter every poll takes both low branches: Clione, Attack, Final Impact, Attack, Fireworks, Haste.
    const low = shinra(60_000);
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) seen.push(low.id(low.poll(0, 0))!);
    expect(seen).toEqual([A.clione, A.attack, A.finalImpact, A.attack, A.fireworks, A.haste]);
  });

  it('no random() at all: only the Attacks and the Full Break draw, one stream-4 search each; the party moves and Haste draw nothing', () => {
    const b = shinra();
    const log: Array<[string, number]> = [];
    for (let i = 0; i < 6; i++) {
      b.rng.drain();
      b.rng.calls.length = 0;
      const c = b.poll(4);
      log.push([b.id(c)!, b.rng.calls.length]);
      if (b.rng.calls.length > 0) expect(b.rng.calls).toEqual([SEARCH]);
    }
    expect(log).toEqual([[A.clione, 0], [A.attack, 1], [A.ultimaShinra, 0], [A.attack, 1], [A.fullBreak, 1], [A.haste, 0]]);
  });

  it('the single-girl picks: the uniform search over the living girls in slot order; one girl left means no draw; none left means no move and the counter stays', () => {
    for (const raw of [0, 1, 2, 3, 4, 5, 1_000_001]) {
      const b = shinra();
      b.poll(); // Clione
      expect(b.targets(b.poll(raw)), `raw ${raw}`).toEqual([pick(raw)]);
    }
    const two = shinra();
    two.girls[0].alive = false;
    two.poll();
    expect(two.targets(two.poll(3))).toEqual(['paine']); // Rikku and Paine: 3 mod 2 = 1
    const one = shinra();
    one.girls[0].alive = false;
    one.girls[2].alive = false;
    one.poll();
    one.rng.calls.length = 0;
    expect(one.targets(one.poll())).toEqual(['rikku']);
    expect(one.rng.calls).toHaveLength(0);

    const none = shinra();
    none.poll();
    for (const g of none.girls) g.alive = false;
    expect(none.poll()).toBeNull();
    expect(mem(none.self, SHINRA_COUNT)).toBe(1);
    expect(none.rng.calls).toHaveLength(0);
  });

  it('he has no death entry, no reaction and no other hook', () => {
    expect(x2AlmightyShinraScript.onDeath).toBeUndefined();
    expect(x2AlmightyShinraScript.onResult).toBeUndefined();
    expect(x2AlmightyShinraScript.counter).toBeUndefined();
  });
});

describe('Unum [RE 3.2]', () => {
  it('seven polls with Shell and Protect on every head: Radis Command, Sparkler, Dispel, then Sparkler four times; the loop starts over with the Command', () => {
    const b = head('unum');
    for (const h of b.f.heads) {
      give(h, 'shell');
      give(h, 'protect');
    }
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) seen.push(b.id(b.poll(0, 0))!);
    expect(seen).toEqual([A.radisCommand, A.sparkler, A.dispel, A.sparkler, A.sparkler, A.sparkler, A.sparkler, A.radisCommand]);
    expect(mem(b.self, UNUM_COUNT)).toBe(1);
  });

  it('the third poll: a monster without Shell means Shell on the monster side (no target named); the seventh: without Protect, Protect', () => {
    const b = head('unum');
    for (let i = 0; i < 3; i++) b.poll(0, 0);
    const shell = b.poll(0);
    expect([b.id(shell), b.targets(shell)]).toEqual([A.shell, []]);
    b.poll(0); // poll 4, Sparkler
    b.poll(0); // poll 5, Sparkler
    const prot = b.poll(0);
    expect([b.id(prot), b.targets(prot)]).toEqual([A.protect, []]);
    expect(mem(b.self, UNUM_COUNT)).toBe(0);
  });

  it('the monster-side test counts the living heads, himself among them: one head short of Shell is enough; the body, pod and tail, a fallen head and a removed one are not asked', () => {
    const shellPoll = (setup: (b: ReturnType<typeof head>) => void): string => {
      const b = head('unum');
      for (const h of b.f.heads) give(h, 'shell');
      setup(b);
      for (let i = 0; i < 3; i++) b.poll(0, 0);
      return b.id(b.poll(0, 0))!;
    };
    expect(shellPoll(() => undefined), 'every head shelled').toBe(A.sparkler);
    expect(shellPoll((b) => delete b.self.statuses['shell']), 'Unum himself lacks it').toBe(A.shell);
    expect(shellPoll((b) => delete b.f.heads[3]!.statuses['shell']), 'Quattour lacks it').toBe(A.shell);
    expect(shellPoll((b) => { for (const p of b.f.parts) delete p.statuses['shell']; }), 'only the parts lack it').toBe(A.sparkler);
    expect(shellPoll((b) => { const duo = b.f.heads[1]!; delete duo.statuses['shell']; duo.alive = false; duo.hp = 0; }), 'a fallen head lacks it').toBe(A.sparkler);
    expect(shellPoll((b) => { const tria = b.f.heads[2]!; delete tria.statuses['shell']; tria.removed = true; }), 'a removed head lacks it').toBe(A.sparkler);
  });

  it('the search spends a draw only with two or more candidates lacking the status, and the pick is thrown away', () => {
    const polls = (lacking: number): Array<[number, number]> => {
      const b = head('unum');
      b.f.heads.forEach((h, i) => { if (i >= lacking) give(h, 'shell'); });
      for (let i = 0; i < 3; i++) b.poll(0, 0);
      b.rng.drain();
      b.rng.calls.length = 0;
      const c = b.poll(0); // exactly one value queued: a second draw would run the rig dry and throw
      expect(b.id(c), `${lacking} lacking`).toBe(lacking > 0 ? A.shell : A.sparkler);
      return [...b.rng.calls];
    };
    expect(polls(1)).toEqual([]); // one candidate: nothing is drawn
    expect(polls(2)).toEqual([SEARCH]);
    expect(polls(4)).toEqual([SEARCH]);
    // None lacking: no check draw, the Sparkler's own search draw (three girls).
    expect(polls(0)).toEqual([SEARCH]);
  });

  it('the fifth poll: White Highwind on the monster side below an eighth of 555,555 (69,443 or less), a Sparkler at 69,444 and above', () => {
    for (const [hp, id] of [[69_443, A.whiteHighwind], [69_444, A.sparkler], [1, A.whiteHighwind]] as const) {
      const b = head('unum', hp);
      for (let i = 0; i < 4; i++) b.poll(0, 0);
      const c = b.poll(0);
      expect([b.id(c), b.targets(c)], `hp ${hp}`).toEqual(id === A.whiteHighwind ? [id, []] : [id, ['yuna']]);
    }
  });

  it('Radis Command, Sparkler and Dispel each take one girl by the uniform search; with no girl standing he has no move and the counter stays', () => {
    const b = head('unum');
    expect(b.targets(b.poll(1))).toEqual(['rikku']);
    expect(b.targets(b.poll(2))).toEqual(['paine']);
    expect([b.id(b.poll(0)), b.rng.calls.length]).toEqual([A.dispel, 3]);
    const none = head('unum');
    for (const g of none.girls) g.alive = false;
    expect(none.poll()).toBeNull();
    expect(mem(none.self, UNUM_COUNT)).toBe(0);
    expect(none.rng.calls).toHaveLength(0);
  });
});

describe('the coin heads: Duo [RE 3.3] and Tria [RE 3.4]', () => {
  /** The pairs as the source writes them: [if-branch (a coin of 1), else-branch (a coin of 0)]. A null else-branch means no coin. */
  const DUO: Array<[string, string | null]> = [
    [A.blackSky, A.bio], [A.flare, A.break], [A.ultima, A.confuse], [A.sleep, A.demi], [A.berserk, A.blackSky], [A.blind, A.flare], [A.ultima, A.silence], [A.slowga, A.demi], [A.venamCommand, null],
  ];
  const TRIA: Array<[string, string | null]> = [[A.firaga, A.holy], [A.blizzaga, A.holy], [A.fulmenCommand, null], [A.thundaga, A.holy], [A.waterga, A.holy], [A.absorb, null]];
  const SINGLE_GIRL = new Set<string>([A.flare, A.break, A.confuse, A.sleep, A.berserk, A.blind, A.silence, A.holy, A.absorb]);

  for (const [name, which, pairs] of [['Duo', 'duo', DUO], ['Tria', 'tria', TRIA]] as const) {
    it(`${name}: at each poll with a pair, random() mod 2 of 1 (or any odd value) takes the first move and 0 (or any even) the second; the draws are the coin, then the search for a single-girl move`, () => {
      pairs.forEach(([first, second], beat) => {
        for (const [coin, id] of second === null ? [[0, first]] as const : [[1, first], [3, first], [65_535, first], [0, second], [2, second], [65_534, second]] as const) {
          const b = head(which);
          for (let i = 0; i < beat; i++) {
            b.rng.drain();
            b.poll(1, 0); // earlier polls: coin 1 and a search value of 0 (the values a poll does not use are dropped before the next)
          }
          b.rng.drain();
          b.rng.calls.length = 0;
          const c = b.poll(...(second === null ? [] : [coin]), ...(SINGLE_GIRL.has(id) ? [1] : []));
          expect(b.id(c), `${name} poll ${beat}, coin ${coin}`).toBe(id);
          const expectedCalls: Array<[number, number]> = [];
          if (second !== null) expectedCalls.push(ROLL);
          if (SINGLE_GIRL.has(id)) expectedCalls.push(SEARCH);
          expect(b.rng.calls, `${name} poll ${beat}, coin ${coin}: draws`).toEqual(expectedCalls);
          expect(b.targets(c), `${name} poll ${beat}: targets`).toEqual(SINGLE_GIRL.has(id) ? ['rikku'] : []);
        }
      });
    });
  }

  it('the tables equal the lists above, move for move (the independent restatement of the source)', () => {
    const flat = (beats: readonly (readonly { id: string }[])[]): Array<[string, string | null]> => beats.map((b) => [b[0]!.id, b[1]?.id ?? null]);
    expect(flat(DUO_BEATS)).toEqual(DUO);
    expect(flat(TRIA_BEATS)).toEqual(TRIA);
    expect(COIN_MODULUS).toBe(2);
  });

  it('Duo: nine polls and back; the ninth is the Venam Command on the party with no coin and the counter returns to 0; 18 polls make two identical turns of the loop when the coin is always 1', () => {
    const b = head('duo');
    const seen: string[] = [];
    for (let i = 0; i < 18; i++) {
      b.rng.drain();
      seen.push(b.id(b.poll(1, 0))!);
    }
    expect(seen).toEqual([...DUO.map(([first]) => first), ...DUO.map(([first]) => first)]);
    expect(mem(b.self, DUO_COUNT)).toBe(0);
    const last = head('duo');
    for (let i = 0; i < 8; i++) last.poll(0, 0);
    last.rng.calls.length = 0;
    const c = last.poll();
    expect([last.id(c), last.targets(c), last.rng.calls.length]).toEqual([A.venamCommand, [], 0]);
  });

  it('Tria: six polls and back; Fulmen Command at the third with no draw at all, the Absorb at the sixth with a search and no coin', () => {
    const b = head('tria');
    b.poll(1); // Firaga (coin 1)
    b.poll(1); // Blizzaga
    b.rng.calls.length = 0;
    const fulmen = b.poll();
    expect([b.id(fulmen), b.targets(fulmen), b.rng.calls.length]).toEqual([A.fulmenCommand, [], 0]);
    b.poll(1);
    b.poll(1);
    b.rng.calls.length = 0;
    const absorb = b.poll(2);
    expect([b.id(absorb), b.targets(absorb), b.rng.calls]).toEqual([A.absorb, ['paine'], [SEARCH]]);
    expect(mem(b.self, TRIA_COUNT)).toBe(0);
    b.rng.calls.length = 0;
    expect(b.id(b.poll(1))).toBe(A.firaga);
  });

  it('with no girl standing neither head has a move or draws a number', () => {
    for (const which of ['duo', 'tria'] as const) {
      const b = head(which);
      for (const g of b.girls) g.alive = false;
      expect(b.poll(), which).toBeNull();
      expect(b.rng.calls, which).toHaveLength(0);
      expect(mem(b.self, which === 'duo' ? DUO_COUNT : TRIA_COUNT), which).toBe(0);
    }
  });
});

describe('Quattour [RE 3.5]', () => {
  const LOOP = [A.fireworks, A.mortisCommand, A.absorb, A.meteor, A.fireworks, A.absorb, A.ultima, A.fireworks, A.absorb];

  it('nine polls and back, no random() anywhere: only the three Absorbs draw (one search each); the party moves name no target', () => {
    const b = head('quattour');
    const seen: Array<[string, string[], number]> = [];
    for (let i = 0; i < 18; i++) {
      b.rng.drain();
      b.rng.calls.length = 0;
      const c = b.poll(1);
      seen.push([b.id(c)!, b.targets(c), b.rng.calls.length]);
    }
    expect(seen.map(([id]) => id)).toEqual([...LOOP, ...LOOP]);
    for (const [id, targets, draws] of seen) {
      if (id === A.absorb) expect([targets, draws], id).toEqual([['rikku'], 1]);
      else expect([targets, draws], id).toEqual([[], 0]);
    }
    expect(mem(b.self, QUATTOUR_COUNT)).toBe(0);
    expect(QUATTOUR_BEATS.every((beat) => beat.length === 1)).toBe(true);
  });

  it('with no girl standing he has no move', () => {
    const b = head('quattour');
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(mem(b.self, QUATTOUR_COUNT)).toBe(0);
  });
});

describe('the death rule [RE 2]', () => {
  const HEADS: Head[] = ['unum', 'duo', 'tria', 'quattour'];

  for (const dying of HEADS) {
    it(`${dying} falling with the other three heads at 0 HP sets the body and the pod to 0 HP and leaves the tail; with any other head standing it does nothing`, () => {
      const b = head(dying);
      b.self.hp = 0;
      b.self.alive = false;
      for (const h of b.f.heads) if (h !== b.self) h.hp = 0;
      expect(otherHeadsDown(b.ctx.units, b.self.id)).toBe(true);
      aiScriptFor(SCRIPT_OF[dying]).onDeath!(b.ctx, undefined);
      expect(b.f.parts.map((p) => p.hp)).toEqual([0, 0, 1]);
      expect(b.f.parts.map((p) => p.alive)).toEqual([true, true, true]); // a store, not a knock-out (the setter runs no KO routine)

      for (const standing of HEADS.filter((h) => h !== dying)) {
        const c = head(dying);
        c.self.hp = 0;
        c.self.alive = false;
        for (const [i, h] of c.f.heads.entries()) if (h !== c.self && i !== HEAD_INDEX[standing]) h.hp = 0;
        expect(otherHeadsDown(c.ctx.units, c.self.id), `${standing} standing`).toBe(false);
        aiScriptFor(SCRIPT_OF[dying]).onDeath!(c.ctx, undefined);
        expect(c.f.parts.map((p) => p.hp), `${standing} standing`).toEqual([1, 1, 1]);
      }
    });
  }

  it('a formation that holds only Unum (the single-head reading of Jegged, not built) passes at once; a missing body or pod is skipped without error', () => {
    const lone = enemy(ids.X2_NUMERUS_UNUM_ID, HP.unum, { mp: 999 });
    const body = enemy(ids.X2_NUMERUS_BODY_ID, 1);
    body.flags.isPart = true;
    const b = bench(lone, ids.UNUM_SCRIPT_ID, [body]);
    lone.hp = 0;
    expect(otherHeadsDown(b.ctx.units, lone.id)).toBe(true);
    expect(() => numerusDeathEntry(b.ctx)).not.toThrow();
    expect(body.hp).toBe(0);
  });

  it('all four heads carry the entry and Shinra does not', () => {
    for (const s of [x2NumerusUnumScript, x2NumerusDuoScript, x2NumerusTriaScript, x2NumerusQuattourScript]) expect(s.onDeath, s.id).toBe(numerusDeathEntry);
    expect(aiScriptFor(ids.SHINRA_SCRIPT_ID).onDeath).toBeUndefined();
  });
});
