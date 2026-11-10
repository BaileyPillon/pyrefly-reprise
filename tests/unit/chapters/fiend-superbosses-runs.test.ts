/**
 * The Fiend Arena Superbosses on the real engine with their real scripts (stage 2 of the lane): each act on three seeds, the Lv 99 line as the Farplane Cup builds it (`viaInfinitoBuild`, a deep copy per run), no
 * engine change, no boss touched. **FFX-2 only** [AGENTS.md rule 14]. The scripts have their own file (`fiend-superbosses-ai.test.ts`); the data and the engine checks of stage 1 have theirs. This file pins:
 *
 * 1. **The scripts on their own clocks** [RE 3]: the girls are Invincible and only defend, so the foes act for as long as the test wants. Shinra's first twelve actions are the loop (the Haste at the sixth, the Final Impact
 *    at the twelfth because he is hasted); Quattour's first eighteen are the loop twice; Unum's Shell reaches the four heads and no part; every pair move of Duo and Tria is one of its two.
 * 2. **The acts played to an end** by the Darkness line (an input to a measurement, `fiendSuperbossDrive.ts`), the real HP: **no error, an end reached** (the cap of 20 minutes of battle time is named in the helper and
 *    never reached here), the event log's hash pinned. The base party LOSES every one of the six runs within 9 seconds of battle time (Clione, or the first Fireworks and Commands): a RESULT for the stage 4 bench and the
 *    options sheet, not a defect, and no boss number is touched.
 * 3. **The same line with Invincible girls topped up at every decision**: act 1 is won (171 to 364 seconds of battle time), act 2 is lost on all three seeds, to Petrify: Duo's Break (chance 80) lands on the whole line
 *    through Invincible, a status the rig does not stop. `[measured]`, one number per run.
 * 4. **The death rule on the real engine** [RE 2]: the heads at 1 HP and killed one at a time in the game's order; the body and the pod hold 1 HP until the fourth head falls, then read 0 HP, alive, with no knock-out
 *    event; the tail is untouched; the fight ends in victory.
 *
 * 5. **The Thunder-proof seam of stage 1** is a rig: the girls' lightning affinity set by the test turns the Fulmen Command into half, nothing or healing (the bench's what-if needs no engine change; only a shipped accessory would).
 *
 * A pinned hash is the digest of every event of the run; it changes when the data, a script, the Lv 99 line or the engine changes. A later stage that changes any of them updates the numbers below on purpose, after reading
 * why the log moved.
 */
import { describe, expect, it } from 'vitest';

import {
  CAP_TICKS, GIRLS, attackOf, damageOn, darknessLine, eventHash, forcedAct, girlsOf, headlineOf, move, openAct, outcomeOf, playToEnd, playUntilActed, startsOf, targetsOf, topUp, unit,
  type Act, type RunResult,
} from '../helpers/fiendSuperbossDrive.ts';
import { FS_ABILITY as A, NUMERUS_HEAD_IDS, NUMERUS_PART_IDS, X2_ALMIGHTY_SHINRA_ID, X2_NUMERUS_DUO_ID, X2_NUMERUS_QUATTOUR_ID, X2_NUMERUS_TRIA_ID, X2_NUMERUS_UNUM_ID } from '../../../src/data/fiend-superbosses-ids.ts';
import { logOf } from '../helpers/angraMainyuDrive.ts';

const SEEDS = [1, 2, 3] as const;
const ACTS: Act[] = [1, 2];

/** Scenario 1, defend line, Invincible girls: the run stops when Shinra has acted 12 times (act 1) or Quattour 18 (act 2). */
const DEFEND: Record<string, { ticks: number; hash: string }> = {
  '1-1': { ticks: 1263, hash: '2b817b2910d18742' }, '1-2': { ticks: 1267, hash: 'bf7d177473c4f2f4' }, '1-3': { ticks: 1264, hash: '83213aaec706cfc5' },
  '2-1': { ticks: 3011, hash: '0a284fb9434da8bc' }, '2-2': { ticks: 3486, hash: '71b09519349268cb' }, '2-3': { ticks: 3494, hash: 'ec44d7659154cc77' },
};
/** Scenario 2, the Darkness line, the real HP. */
const DARKNESS: Record<string, RunResult> = {
  '1-1': { outcome: 'defeat', ticks: 172, decisions: 11, hash: '374094f81ebdb358' }, '1-2': { outcome: 'defeat', ticks: 530, decisions: 34, hash: '40aee8b2cfd77f71' },
  '1-3': { outcome: 'defeat', ticks: 173, decisions: 6, hash: 'b85d8299debca706' }, '2-1': { outcome: 'defeat', ticks: 232, decisions: 18, hash: 'e1dc6cd8f4ef64ea' },
  '2-2': { outcome: 'defeat', ticks: 246, decisions: 20, hash: '5b424152c69f2029' }, '2-3': { outcome: 'defeat', ticks: 233, decisions: 16, hash: '0cf5a41e356b9b99' },
};
/** Scenario 3, the Darkness line, Invincible girls topped up at each decision. */
const IMMORTAL: Record<string, RunResult> = {
  '1-1': { outcome: 'victory', ticks: 10456, decisions: 932, hash: 'aa29a25452294407' }, '1-2': { outcome: 'victory', ticks: 21823, decisions: 1932, hash: '3672c0daa8fd10ff' },
  '1-3': { outcome: 'victory', ticks: 10246, decisions: 938, hash: 'db0a7de417630f9e' }, '2-1': { outcome: 'defeat', ticks: 13422, decisions: 1853, hash: '4ce99a2ae1e7b193' },
  '2-2': { outcome: 'defeat', ticks: 3965, decisions: 641, hash: '5c72a86e5687f1e9' }, '2-3': { outcome: 'defeat', ticks: 9915, decisions: 1269, hash: '20b41422d07362b5' },
};

/** Ids only: the move a start event names, without its targets. */
const idsOf = (starts: string[]): string[] => starts.map((s) => s.split('>')[0] as string);

describe('the scripts on their own clocks (Invincible girls that only defend) [RE 3]', () => {
  for (const seed of SEEDS) {
    it(`act 1, seed ${seed}: Shinra's first twelve actions are the loop with the Haste at the sixth and the Final Impact at the twelfth; the log's hash is pinned`, () => {
      const engine = openAct(1, seed, { immortal: true });
      expect(playUntilActed(engine, X2_ALMIGHTY_SHINRA_ID, 12, undefined, { immortal: true, maxDecisions: 20000 })).toBe(true);
      const starts = startsOf(engine, X2_ALMIGHTY_SHINRA_ID);
      expect(idsOf(starts).slice(0, 12)).toEqual([
        A.clione, A.attack, A.ultimaShinra, A.attack, A.fullBreak, A.haste,
        A.clione, A.attack, A.ultimaShinra, A.attack, A.fullBreak, A.finalImpact, // hasted at the twelfth poll: the Final Impact instead of a second Haste
      ]);
      expect(starts[5]).toBe(`${A.haste}>${X2_ALMIGHTY_SHINRA_ID}`);
      for (const i of [1, 3, 4, 7, 9, 10]) expect(starts[i]).toMatch(/>(yuna|rikku|paine)$/); // the Attacks and the Full Break name one girl
      for (const i of [0, 2, 6, 8, 11]) expect(starts[i]).not.toContain('>'); // the party moves name none
      expect({ ticks: engine.state().ticks, hash: eventHash(engine) }, 'pinned').toEqual(DEFEND[`1-${seed}`]);
    });

    it(`act 2, seed ${seed}: Quattour runs his loop twice, Unum's Shell and Protect reach the four heads, Duo and Tria take only the moves of their pairs; the log's hash is pinned`, () => {
      const engine = openAct(2, seed, { immortal: true });
      expect(playUntilActed(engine, X2_NUMERUS_UNUM_ID, 4, undefined, { immortal: true, maxDecisions: 20000 })).toBe(true);
      // Unum's fourth action is the Shell: right after it the four heads carry Shell and the three parts do not.
      expect(idsOf(startsOf(engine, X2_NUMERUS_UNUM_ID)).slice(0, 4)).toEqual([A.radisCommand, A.sparkler, A.dispel, A.shell]);
      for (const id of NUMERUS_HEAD_IDS) expect(unit(engine, id).statuses['shell'], id).toBeDefined();
      for (const id of NUMERUS_PART_IDS) expect(unit(engine, id).statuses['shell'], id).toBeUndefined();

      expect(playUntilActed(engine, X2_NUMERUS_QUATTOUR_ID, 18, undefined, { immortal: true, maxDecisions: 20000 })).toBe(true);
      const unum = idsOf(startsOf(engine, X2_NUMERUS_UNUM_ID));
      expect(unum.slice(0, 7)).toEqual([A.radisCommand, A.sparkler, A.dispel, A.shell, A.sparkler, A.sparkler, A.protect]);
      const quattour = idsOf(startsOf(engine, X2_NUMERUS_QUATTOUR_ID)).slice(0, 18);
      const loop = [A.fireworks, A.mortisCommand, A.absorb, A.meteor, A.fireworks, A.absorb, A.ultima, A.fireworks, A.absorb];
      expect(quattour).toEqual([...loop, ...loop]);
      const pairs = {
        duo: [[A.blackSky, A.bio], [A.flare, A.break], [A.ultima, A.confuse], [A.sleep, A.demi], [A.berserk, A.blackSky], [A.blind, A.flare], [A.ultima, A.silence], [A.slowga, A.demi], [A.venamCommand]],
        tria: [[A.firaga, A.holy], [A.blizzaga, A.holy], [A.fulmenCommand], [A.thundaga, A.holy], [A.waterga, A.holy], [A.absorb]],
      } as const;
      for (const [head, table] of [[NUMERUS_HEAD_IDS[1], pairs.duo], [NUMERUS_HEAD_IDS[2], pairs.tria]] as const) {
        const seen = idsOf(startsOf(engine, head));
        expect(seen.length, head).toBeGreaterThanOrEqual(table.length);
        seen.forEach((id, i) => expect(table[i % table.length] as readonly string[], `${head} action ${i}`).toContain(id));
      }
      expect({ ticks: engine.state().ticks, hash: eventHash(engine) }, 'pinned').toEqual(DEFEND[`2-${seed}`]);
    });
  }
});

describe('each act played to an end by the Darkness line [RE 4, 5]', () => {
  for (const act of ACTS) {
    for (const seed of SEEDS) {
      it(`act ${act}, seed ${seed}, the real HP: no error, an end reached, the run pinned`, () => {
        const result = playToEnd(openAct(act, seed), darknessLine(act));
        expect(result.outcome).not.toBe('cap');
        expect(result.ticks).toBeLessThan(CAP_TICKS);
        expect(result, 'pinned').toEqual(DARKNESS[`${act}-${seed}`]);
        expect(result.outcome, 'the base party loses (measured, not tuned)').toBe('defeat');
      });

      it(`act ${act}, seed ${seed}, Invincible girls topped up at every decision: no error, an end reached, the run pinned`, () => {
        const result = playToEnd(openAct(act, seed, { immortal: true }), darknessLine(act), { immortal: true });
        expect(result.outcome).not.toBe('cap');
        expect(result, 'pinned').toEqual(IMMORTAL[`${act}-${seed}`]);
        expect(result.outcome).toBe(act === 1 ? 'victory' : 'defeat');
      });
    }
  }

  it('act 2 is lost with Invincible girls to Petrify, which the Invincible status does not stop', () => {
    const engine = openAct(2, 3, { immortal: true });
    const result = playToEnd(engine, darknessLine(2), { immortal: true });
    expect(result.outcome).toBe('defeat');
    const girls = ['yuna', 'rikku', 'paine'].map((id) => unit(engine, id));
    expect(girls.every((g) => g.statuses['petrify'] !== undefined)).toBe(true);
    const petrified = logOf(engine).filter((e) => e.type === 'status-add' && e.status === 'petrify');
    expect(petrified.length).toBeGreaterThanOrEqual(3);
    expect([...new Set(petrified.map((e) => e.sourceId))]).toEqual([X2_NUMERUS_DUO_ID]); // Duo's Break, chance 80
  });
});

describe('the death rule on the real engine [RE 2]', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: the heads at 1 HP fall one at a time; the body and the pod keep their 1 HP until the fourth falls, then read 0, alive, with no knock-out event; the tail is untouched; victory`, () => {
      const engine = openAct(2, seed, {
        immortal: true,
        setup: (e) => {
          for (const id of NUMERUS_HEAD_IDS) unit(e, id).hp = 1;
        },
      });
      const parts = (): number[] => NUMERUS_PART_IDS.map((id) => unit(engine, id).hp);
      const trace: string[] = [];
      for (let i = 0; i < 4000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        topUp(engine);
        engine.submit(attackOf(d, headlineOf(engine, 2)));
        const down = targetsOf(2).filter((id) => !unit(engine, id).alive).length;
        trace.push(`${down}:${parts().join(',')}`);
        if (down < 4) expect(parts(), `with ${down} heads down the parts are untouched`).toEqual([1, 1, 1]);
      }
      expect(outcomeOf(engine)).toBe('victory');
      expect(parts()).toEqual([0, 0, 1]);
      expect(NUMERUS_PART_IDS.map((id) => unit(engine, id).alive)).toEqual([true, true, true]);
      expect(trace.some((t) => t.startsWith('3:'))).toBe(true); // three heads were down before the fourth: the heads fell one at a time
      const kos = logOf(engine).filter((e) => e.type === 'ko').map((e) => e.targetId ?? e.actorId);
      expect([...kos].sort()).toEqual([...NUMERUS_HEAD_IDS].sort()); // the four heads only; a part's store is not a knock-out
      expect(headlineOf(engine, 2)).toBe(NUMERUS_HEAD_IDS[0]); // nothing is left standing: the headline falls back to the first head
    });
  }
});

describe('the kit seam of stage 1 (Thunder-proofing) is a rig, not an engine change [stage 1 T0 seam 1]', () => {
  /** One Fulmen Command (Tria, forced) at the real HP with the girls' Thunder affinity set by the test: the damage on each girl and her state afterwards. */
  function fulmen(affinity?: 'resist' | 'immune' | 'absorb'): Array<{ id: string; amount: number; hp: number; up: boolean }> {
    const { group, queues } = forcedAct(2);
    const engine = openAct(2, 1, {
      group,
      setup: (e) => {
        if (affinity) for (const g of girlsOf(e)) g.affinities.lightning = affinity; // the element is `lightning`; the engine reads the four affinity bytes from this table (`adapt/words.ts#affinityBytes`)
      },
    });
    queues[X2_NUMERUS_TRIA_ID]!.push(move(A.fulmenCommand, []));
    expect(playUntilActed(engine, X2_NUMERUS_TRIA_ID, 1)).toBe(true);
    return GIRLS.map((id) => ({ id, amount: damageOn(engine, id)[0]!.amount ?? 0, hp: unit(engine, id).hp, up: unit(engine, id).alive }));
  }

  it('the Fulmen Command is 57,845 / 99,999 / 62,112 and puts all three down; with Thunder at "resist" it is half, still lethal; "immune" makes it 0 and all three stand; "absorb" turns it into healing', () => {
    const base = fulmen();
    expect(base.map((r) => r.amount)).toEqual([57_845, 99_999, 62_112]);
    expect(base.map((r) => r.up)).toEqual([false, false, false]);
    const half = fulmen('resist');
    expect(half.map((r) => r.amount)).toEqual([28_922, 58_637, 31_056]);
    expect(half.map((r) => r.up)).toEqual([false, false, false]);
    const proof = fulmen('immune');
    expect(proof.map((r) => [r.amount, r.hp, r.up])).toEqual([[0, 10_710, true], [0, 5_106, true], [0, 10_710, true]]);
    const heal = fulmen('absorb');
    expect(heal.map((r) => r.amount)).toEqual([-57_845, -99_999, -62_112]);
    expect(heal.map((r) => r.up)).toEqual([true, true, true]);
  });
});
