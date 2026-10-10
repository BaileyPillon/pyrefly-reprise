/**
 * **The seams of the merge of W2 (turn order, statuses, ticks) onto release candidate 1 (the game-script lanes)**
 * (re-parity RC2-W2; **FFX only**; `docs/handoff/re-parity-w2.md`, "Merged onto release candidate 1").
 *
 * A textual merge of these two lines compiles and still gets six things wrong without a conflict marker to say so; each is a
 * rule one side wrote against the other side's old code. Every test here fails if that seam is lost, and each was mutation-checked
 * (the change that breaks it is listed with the test).
 *
 * 1. **The boss openings sit on the kernel's opening.** The scripts' start hooks (Yojimbo, Isaaru's aeons, Genais, Sin's face; the
 *    possession fights; Macalania) write the boss at 0 and each party counter one or two ticks later, "after the engine's opening
 *    pass". That pass is the game's 26 fixed draws now, on byte counters the clock counts down, so the hooks' writes stand as they are:
 *    nothing is rebased (`normalise` is gone) and a counter pushed back stops at 255.
 * 2. **A monster's `postPoison` hook runs right after its own Poison tick**, which W2 moved into the end-of-turn kernel adapter
 *    (`adapt/ticks.ts#endOfTurn`); only a tick that took HP counts, and a passed turn takes none.
 * 3. **The scripts' `preTurn` hooks run after the start-of-turn tick and before Doom**, the game's order (its turn start calls the tick, VA
 *    0x007af4f0, then requests the pre-turn entry of the scripts, then Doom's tick, all inside VA 0x00792a90). The release-candidate line ran
 *    them first, before Regen's payout, because the tick was not the game's yet.
 * 4. **Threaten splits the game's can-act test in two.** The turn gate (`canAct`) does not refuse a Threatened character (W2: the pair
 *    is released as its turn opens, so it takes the turn); the gate of everything a script or an equipment reaction queues, the exe's
 *    `pp_BtlCanAct` with its not-Threatened flag (VA 0x007b24a0; every caller in the exe passes 1), does (`canQueueAction`: the boss
 *    scripts' `canQueue`, the enemy Cover, the orders).
 * 5. **The Mortiorchis is charged the dummy Command 150's recovery.** Every move the mount can perform is rank 3, the rank of the
 *    game's record 0x608c, so charging the performed move's rank (W2's recovery) equals charging the dummy's (AI-Seymour open
 *    item 8); the fixture row is the proof.
 *
 * (The hit scope that joins W2's `rank` and `records` to the scripts' `touched` is pinned by the type checker: a scope built
 * without one of them does not compile, `tests/unit/helpers/ffxStatus.ts` included.)
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import type { FFXCombatant } from '../../src/battle/common/types.ts';
import { registerFormationPreTurn, registerScriptHooks } from '../../src/battle/ffx/ai/hooks.ts';
import { canQueue } from '../../src/battle/ffx/ai/game-rolls.ts';
import { applyBossOpening } from '../../src/battle/ffx/ai/opening.ts';
import { canAct, canQueueAction, rankOf, rtOf } from '../../src/battle/ffx/state.ts';
import { onTurnEnd, onTurnStart } from '../../src/battle/ffx/ticks.ts';
import { seedInitialCtb } from '../../src/battle/ffx/turnQueue.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import commandStatus from '../fixtures/parity/ffx/command_status.json';
import { liveBattle } from './helpers/aiScript.ts';
import { giveStatus } from './helpers/ffxStatus.ts';

const partyIds = (ctx: { state: { activeIds: readonly string[]; reserveIds: readonly string[] } }): string[] => [
  ...ctx.state.activeIds,
  ...ctx.state.reserveIds,
];

describe('1. the boss openings sit on the kernel\'s opening', () => {
  it('Yojimbo opens at 0 and every party counter is the kernel\'s opening plus one (mutation: the hook rebasing, or not adding)', () => {
    const live = liveBattle('yojimbo-cavern', { party: yojimboCavernBuild });
    // The same battle again with its opening redone from the seed: the 26 draws the engine spent before the hook ran.
    const plain = liveBattle('yojimbo-cavern', { party: yojimboCavernBuild });
    plain.ctx.rng = new SeededRng(1);
    seedInitialCtb(plain.ctx, 'scripted');

    expect(rtOf(live.ctx, 'yojimbo').ctb).toBe(0);
    const ids = partyIds(live.ctx);
    expect(ids.length).toBe(7);
    for (const id of ids) expect(rtOf(live.ctx, id).ctb, id).toBe(Math.min(255, rtOf(plain.ctx, id).ctb + 1));
    // The opening really drew: the counters are not all the same number.
    expect(new Set(ids.map((id) => rtOf(plain.ctx, id).ctb)).size).toBeGreaterThan(1);
  });

  it('a counter the hook pushes back stops at 255, and nothing is rebased to the lowest (mutation: an unclamped add)', () => {
    const live = liveBattle('yojimbo-cavern', { party: yojimboCavernBuild });
    const [a, b, c] = partyIds(live.ctx) as [string, string, string];
    rtOf(live.ctx, a).ctb = 255;
    rtOf(live.ctx, b).ctb = 40;
    rtOf(live.ctx, c).ctb = 41;
    rtOf(live.ctx, 'yojimbo').ctb = 77;
    applyBossOpening(live.ctx, ['yojimbo']);
    expect([rtOf(live.ctx, 'yojimbo').ctb, rtOf(live.ctx, a).ctb, rtOf(live.ctx, b).ctb, rtOf(live.ctx, c).ctb]).toEqual([0, 255, 41, 42]);
  });
});

const SPY = 'zz-w2-rc1-merge-spy';
const poisonCalls: Array<{ id: string; hp: number }> = [];
registerScriptHooks(SPY, { postPoison: (_ctx, self) => void poisonCalls.push({ id: self.id, hp: self.hp }) });

/** A foe of a live Chapter I battle whose script is the spy, carrying the Poison byte a Poisoned enemy needs. */
function spyFoe(live: ReturnType<typeof liveBattle>): FFXCombatant {
  const foe = live.at('seymour-flux');
  const fields = foe.enemy!;
  for (const form of fields.forms) delete form.aiScriptId;
  fields.aiScriptId = SPY;
  fields.poisonTickPercent = 10;
  return foe;
}

describe('2. postPoison runs right after the monster\'s own Poison tick', () => {
  it('once, after the damage, for a Poisoned monster at the end of a turn that applied its results (mutation: the call dropped, or before the tick)', () => {
    poisonCalls.length = 0;
    const live = liveBattle('seymour-flux');
    const foe = spyFoe(live);
    giveStatus(foe, 'poison');
    const before = foe.hp;
    const tick = Math.floor((foe.stats.maxHp * 10) / 100);
    onTurnEnd(live.ctx, foe, true);
    expect(poisonCalls).toEqual([{ id: foe.id, hp: before - tick }]);
  });

  it('never for a passed turn, and never without Poison (mutation: the hook run whenever the turn ends)', () => {
    poisonCalls.length = 0;
    const live = liveBattle('seymour-flux');
    const foe = spyFoe(live);
    onTurnEnd(live.ctx, foe, true); // no Poison on him
    giveStatus(foe, 'poison');
    onTurnEnd(live.ctx, foe, false); // a passed turn (a sleeper's) takes no Poison tick
    expect(poisonCalls).toEqual([]);
    expect(foe.hp).toBe(foe.stats.maxHp);
  });

  it('never when the tick took nothing: a Poison byte of 0 (mutation: endOfTurn reporting a tick that did not fall)', () => {
    poisonCalls.length = 0;
    const live = liveBattle('seymour-flux');
    const foe = spyFoe(live);
    foe.enemy!.poisonTickPercent = 0;
    giveStatus(foe, 'poison');
    onTurnEnd(live.ctx, foe, true);
    expect(poisonCalls).toEqual([]);
    expect(foe.hp).toBe(foe.stats.maxHp);
  });
});

describe('3. the scripts\' preTurn hooks run after the start-of-turn tick and before Doom', () => {
  const seen: Array<{ actor: string; alive: boolean; tidusHp: number; ticks: number }> = [];
  let watching = false;
  registerFormationPreTurn((ctx, actor) => {
    if (!watching) return;
    const tidus = ctx.state.combatants['tidus'] as FFXCombatant;
    seen.push({ actor: actor.id, alive: actor.alive, tidusHp: tidus.hp, ticks: rtOf(ctx, 'tidus').regenTicks });
  });

  it('a pre-turn handler sees Regen\'s holder already paid and the counter already reset (mutation: the hooks run before the tick)', () => {
    const live = liveBattle('seymour-flux');
    const tidus = live.at('tidus');
    giveStatus(tidus, 'regen');
    tidus.hp = 100;
    rtOf(live.ctx, 'tidus').regenTicks = 40;
    watching = true;
    seen.length = 0;
    onTurnStart(live.ctx, live.at('auron'));
    watching = false;
    // The payout is (40 * maxHP >> 8) + 100 and the holder's counter starts again from 0.
    const paid = 100 + ((40 * tidus.stats.maxHp) >> 8) + 100;
    expect(seen).toEqual([{ actor: 'auron', alive: true, tidusHp: paid, ticks: 0 }]);
    expect(tidus.hp).toBe(paid);
  });

  it('and they run for an actor whose Doom reaches 0 on that very turn start (mutation: the hooks run after Doom\'s tick)', () => {
    const live = liveBattle('seymour-flux');
    const auron = live.at('auron');
    giveStatus(auron, 'doom', { turnsRemaining: 1 });
    watching = true;
    seen.length = 0;
    onTurnStart(live.ctx, auron);
    watching = false;
    expect(seen.map((x) => [x.actor, x.alive])).toEqual([['auron', true]]);
    expect(auron.alive, 'Doom took him after the hooks ran').toBe(false);
  });
});

describe('4. Threaten splits the can-act test in two', () => {
  it('a Threatened character takes its turn but queues nothing (mutation: Threaten back in canAct, or out of canQueueAction)', () => {
    const live = liveBattle('seymour-flux');
    const tidus = live.at('tidus');
    expect(canAct(tidus) && canQueueAction(tidus) && canQueue(tidus)).toBe(true);
    giveStatus(tidus, 'threaten');
    expect(canAct(tidus), 'the turn gate: Threaten does not take the turn').toBe(true);
    expect(canQueueAction(tidus), 'pp_BtlCanAct(.., 1, 1, 1) refuses a Threatened character').toBe(false);
    expect(canQueue(tidus), 'the boss scripts\' gate').toBe(false);
  });

  it('a sleeper loses both', () => {
    const live = liveBattle('seymour-flux');
    const tidus = live.at('tidus');
    giveStatus(tidus, 'sleep');
    expect(canAct(tidus)).toBe(false);
    expect(canQueueAction(tidus)).toBe(false);
  });
});

describe('5. the Mortiorchis is charged the dummy Command 150\'s recovery', () => {
  const rankOfRecord = (id: number): number | undefined => {
    const row = (commandStatus.rows as unknown as number[][]).find((r) => r[0] === id);
    return row?.[1];
  };

  it('the dummy record 0x608c is rank 3 and so is every move the mount can perform (mutation: one of them at another rank)', () => {
    expect(rankOfRecord(0x608c), 'record 0x608c in the fixture of the game\'s 979 records').toBe(3);
    const live = liveBattle('seymour-flux');
    for (const id of ['slowga-counter', 'full-life', 'cross-cleave', 'total-annihilation']) {
      const def = live.ctx.content.ability(id);
      expect(def, id).toBeDefined();
      expect(rankOf(def), `${id}: the rank the engine charges after the mount performs it`).toBe(3);
    }
  });

  it('a pass costs the same rank 3 (the engine\'s empty turn)', () => {
    expect(rankOf(undefined)).toBe(3);
  });
});
