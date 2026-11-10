/**
 * **Don Tonberry against the note** (`research/re-ffx-monster-arena-creations.md` 3.9, "RE n"; FFX only; the hidden Gauntlet chapter's act 2): every branch and number of its script
 * (`src/battle/ffx/ai/gauntlet-don-tonberry.ts`) pinned on a **fake context** (the four Waddles, the Attack after them, Voodoo with an aeon, the draws), the Karma counter by its gates (the free hit after each Waddle, the
 * arrival, the aeon, the reaction), then the real engine: Karma is the attacker's kills x 100 (50,000 at the party's 500), three seeds (no error, an end reached, the digest of the event log recorded) and a battle with an
 * aeon out.
 */
import { describe, expect, it } from 'vitest';

import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import {
  TONBERRY_FREE_HIT, TONBERRY_WADDLES, TONBERRY_WADDLES_DONE, donTonberryHit, donTonberryTurn,
} from '../../../src/battle/ffx/ai/gauntlet-don-tonberry.ts';
import { GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, TONBERRY_WAYPOINT_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import type { HitEvent } from '../../../src/battle/ffx/ai/hit-script.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { type Fake, aiOf, bossOf, fakeArena, rowOf } from '../helpers/gauntletFake.ts';
import { actions, careless, digestOf, newEngine, playOne, row, turnActions } from '../helpers/gauntletDrive.ts';

const DON = GAUNTLET_IDS.donTonberry;

const hitOf = (f: Fake, attackerId = 'm0'): HitEvent => ({ ctx: f.ctx, target: bossOf(f, DON), attacker: bossOf(f, attackerId), def: {} as never, lastDamage: 1, affectsHp: true });
/** Hit it and read what was queued (and clear the queue): the row aimed at the attacker, or null. */
function answer(f: Fake, attackerId = 'm0'): { row: string; targets: string[] } | null {
  const before = peekReactions(f.ctx).length;
  donTonberryHit(hitOf(f, attackerId));
  if (peekReactions(f.ctx).length === before) return null;
  const r = takeReaction(f.ctx); // taken off as the drain does, so the next hit starts from an empty queue
  if (r === undefined || r.kind !== 'command') throw new Error('a command');
  return { row: rowOf(r.command as Command), targets: r.command.targets };
}

describe('the script is registered under the id the data names, both hooks', () => {
  it('the AI script and the hit hook', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.donTonberry)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.donTonberry).toBe('gauntlet-don-tonberry');
  });
});

describe("Don Tonberry's turn: four Waddles, then the Attack (RE n 3.9)", () => {
  it('turns 1 to 4 are Waddle on itself (no draw at all), counting v4 up to 4 and writing the waypoint 1 to 4 for the scene; turn 5 on is the Attack on one random living member', () => {
    expect(TONBERRY_WADDLES).toBe(4);
    const f = fakeArena({ boss: DON, pick: 1 });
    const ai = aiOf(f, DON);
    const rows: Array<[string, string[]]> = [];
    const waypoints: unknown[] = [];
    for (let i = 0; i < 7; i++) {
      const c = donTonberryTurn(ai);
      rows.push([rowOf(c), c?.targets ?? []]);
      waypoints.push(f.ctx.state.flags[TONBERRY_WAYPOINT_FLAG]);
    }
    expect(rows).toEqual([
      [ROW.waddle, [DON]], [ROW.waddle, [DON]], [ROW.waddle, [DON]], [ROW.waddle, [DON]],
      [ROW.tonberryAttack, ['m1']], [ROW.tonberryAttack, ['m1']], [ROW.tonberryAttack, ['m1']],
    ]);
    expect(waypoints).toEqual([1, 2, 3, 4, 4, 4, 4]);
    expect(ai.memory[TONBERRY_WADDLES_DONE]).toBe(4);
    // The four Waddles draw nothing; each Attack takes one picker draw (three living).
    expect(f.draws).toEqual([[FfxStream.Picker, 2], [FfxStream.Picker, 2], [FfxStream.Picker, 2]]);
  });

  it('no random value decides the move: the Waddles and the Attack are the same for every value of the script stream (it takes no GetRandomValue draw)', () => {
    for (const raw of [0, 1, 32_768, 65_535]) {
      const f = fakeArena({ boss: DON, raw });
      const ai = aiOf(f, DON);
      const seq = [0, 1, 2, 3, 4].map(() => rowOf(donTonberryTurn(ai)));
      expect(seq).toEqual([ROW.waddle, ROW.waddle, ROW.waddle, ROW.waddle, ROW.tonberryAttack]);
      expect(f.draws.filter(([stream]) => stream === FfxStream.Script)).toEqual([]);
    }
  });

  it('the Attack draws its victim from the living only, and with one living member draws nothing; with nobody left it passes', () => {
    const f = fakeArena({ boss: DON, living: 1 });
    const ai = aiOf(f, DON);
    ai.memory[TONBERRY_WADDLES_DONE] = 4;
    expect(donTonberryTurn(ai)?.targets).toEqual(['m0']);
    expect(f.draws).toEqual([]);
    const g = fakeArena({ boss: DON, living: 0 });
    const gi = aiOf(g, DON);
    gi.memory[TONBERRY_WADDLES_DONE] = 4;
    expect(donTonberryTurn(gi)).toBeNull();
  });
});

describe('with an aeon in the front line: Voodoo every turn, from the first (RE n 3.9)', () => {
  it('Voodoo on the aeon on turns 1 to 6, the Waddles are not started and the waypoint is never written', () => {
    const f = fakeArena({ boss: DON, aeon: true });
    const ai = aiOf(f, DON);
    const rows = [0, 1, 2, 3, 4, 5].map(() => {
      const c = donTonberryTurn(ai);
      return [rowOf(c), c?.targets];
    });
    expect(rows).toEqual(Array(6).fill([ROW.voodoo, ['valefor']]));
    expect(ai.memory[TONBERRY_WADDLES_DONE]).toBeUndefined();
    expect(f.ctx.state.flags[TONBERRY_WAYPOINT_FLAG]).toBeUndefined();
  });

  it('an aeon that comes out in the middle of the walk-in takes the Voodoo and leaves the Waddles where they were; when it goes home the walk goes on', () => {
    const waddling = fakeArena({ boss: DON });
    const ai = aiOf(waddling, DON);
    expect([rowOf(donTonberryTurn(ai)), rowOf(donTonberryTurn(ai))]).toEqual([ROW.waddle, ROW.waddle]);
    const withAeon = fakeArena({ boss: DON, aeon: true });
    const aeonAi = aiOf(withAeon, DON);
    aeonAi.memory[TONBERRY_WADDLES_DONE] = 2;
    expect(rowOf(donTonberryTurn(aeonAi))).toBe(ROW.voodoo);
    expect(aeonAi.memory[TONBERRY_WADDLES_DONE]).toBe(2);
    // The aeon is gone: the third Waddle.
    const after = fakeArena({ boss: DON });
    const afterAi = aiOf(after, DON);
    afterAi.memory[TONBERRY_WADDLES_DONE] = 2;
    expect(rowOf(donTonberryTurn(afterAi))).toBe(ROW.waddle);
    expect(afterAi.memory[TONBERRY_WADDLES_DONE]).toBe(3);
  });
});

describe('Karma: the counter while it walks in (RE n 3.9)', () => {
  it('before its first Waddle every hit is answered: Karma on the attacker', () => {
    const f = fakeArena({ boss: DON });
    expect(answer(f)).toEqual({ row: ROW.karma, targets: ['m0'] });
    expect(answer(f, 'm2')).toEqual({ row: ROW.karma, targets: ['m2'] });
  });

  it('after each of the four Waddles the first hit is free and the second is answered (v5 is set by the Waddle and cleared by the hit)', () => {
    const f = fakeArena({ boss: DON });
    const ai = aiOf(f, DON);
    const seen: Array<string | null> = [];
    for (let waddle = 1; waddle <= 3; waddle++) {
      donTonberryTurn(ai);
      expect(ai.memory[TONBERRY_FREE_HIT]).toBe(1);
      seen.push(answer(f)?.row ?? null, answer(f)?.row ?? null, answer(f)?.row ?? null);
      expect(ai.memory[TONBERRY_FREE_HIT]).toBe(0);
    }
    expect(seen).toEqual([null, ROW.karma, ROW.karma, null, ROW.karma, ROW.karma, null, ROW.karma, ROW.karma]);
  });

  it('once it has arrived (four Waddles) nothing answers a hit, though the first hit still clears the free-hit flag', () => {
    const f = fakeArena({ boss: DON });
    const ai = aiOf(f, DON);
    for (let i = 0; i < 4; i++) donTonberryTurn(ai);
    expect(ai.memory[TONBERRY_FREE_HIT]).toBe(1);
    expect([answer(f), answer(f), answer(f)]).toEqual([null, null, null]);
    expect(ai.memory[TONBERRY_FREE_HIT]).toBe(0);
  });

  it('with an aeon in the front line it answers nothing, but the free hit is still spent first (the free-hit test comes before the aeon test)', () => {
    const f = fakeArena({ boss: DON, aeon: true });
    const ai = aiOf(f, DON);
    ai.memory[TONBERRY_FREE_HIT] = 1;
    expect([answer(f, 'valefor'), answer(f, 'valefor')]).toEqual([null, null]);
    expect(ai.memory[TONBERRY_FREE_HIT]).toBe(0);
  });

  it('nothing while a reaction is already running (a counter never triggers one) and the free hit is not spent then; nothing from a sleeper; nothing for the blow that killed it', () => {
    const inReaction = fakeArena({ boss: DON, inReaction: true });
    const ai = aiOf(inReaction, DON);
    ai.memory[TONBERRY_FREE_HIT] = 1;
    expect(answer(inReaction)).toBeNull();
    expect(ai.memory[TONBERRY_FREE_HIT], 'the whole block is inside isCounterattackAllowed()').toBe(1);
    const asleep = fakeArena({ boss: DON });
    (bossOf(asleep, DON).statuses as Record<string, unknown>)['sleep'] = { id: 'sleep' };
    expect(answer(asleep)).toBeNull();
    const dead = fakeArena({ boss: DON, bossHp: 0 });
    expect(answer(dead)).toBeNull();
  });

  it('two hit events in one action (a Doublecast) get one answer: the engine drops the second reaction of the same owner', () => {
    const f = fakeArena({ boss: DON });
    donTonberryHit(hitOf(f));
    donTonberryHit(hitOf(f));
    expect(peekReactions(f.ctx)).toHaveLength(1);
  });
});

describe('the real engine: act 2 (Karma through the kernel, three seeds with the digests recorded, an aeon out)', () => {
  it('the first attack of a careless party draws Karma: 500 kills x 100 = 50,000 on the attacker, who falls (the pre-arrival counter)', () => {
    let karma = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const run = playOne(seed, 'don-tonberry', careless);
      const events = run.events;
      for (let i = 0; i < events.length; i++) {
        const e = events[i]!;
        if (e.type !== 'counter' || e.actorId !== DON || e.abilityId !== ROW.karma) continue;
        const dmg = events.slice(i + 1).find((x) => x.type === 'damage' && x.targetId === e.targetId);
        expect(dmg !== undefined && dmg.type === 'damage' ? dmg.amount : -1, `seed ${seed}`).toBe(50_000);
        karma++;
        break;
      }
    }
    expect(karma, 'Karma fired on every seed that attacked early').toBeGreaterThan(0);
  });

  it('it walks in over its first four turns (four Waddles, waypoints 1 to 4) and Karma never comes after the fourth', () => {
    for (const seed of [1, 2, 3]) {
      const run = playOne(seed, 'don-tonberry', careless);
      const mine = turnActions(run.events, DON); // its own turns, not the free Karmas a hit drew
      const firstFour = mine.slice(0, 4);
      if (mine.length >= 4) expect(firstFour, `seed ${seed}`).toEqual([ROW.waddle, ROW.waddle, ROW.waddle, ROW.waddle]);
      const arrivedAt = run.events.findIndex((e, i) => e.type === 'action-start' && e.actorId === DON && e.abilityId === ROW.waddle && run.events.slice(0, i).filter((x) => x.type === 'action-start' && x.actorId === DON && x.abilityId === ROW.waddle).length === 3);
      const late = arrivedAt < 0 ? [] : run.events.slice(arrivedAt + 1).filter((e) => e.type === 'counter' && e.actorId === DON && e.abilityId === ROW.karma);
      // The hit right after the fourth Waddle is free and nothing answers after it: no Karma once the fourth Waddle has been done.
      expect(late, `seed ${seed}`).toEqual([]);
    }
  });

  it('seeds 1, 2 and 3 end in a victory or a defeat; replaying a seed gives the same log (the digests are recorded in the stage report)', () => {
    for (const seed of [1, 2, 3]) {
      const a = playOne(seed, 'don-tonberry', careless);
      const b = playOne(seed, 'don-tonberry', careless);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(a.outcome);
      expect(a.digest).toBe(b.digest);
      expect(digestOf(a.events)).toBe(a.digest);
    }
  });

  it('with Valefor out, Don Tonberry casts Voodoo and never Karma (the aeon is the front line)', () => {
    let voodoo = 0;
    for (const seed of [1, 2, 3]) {
      const engine = newEngine(seed, 'don-tonberry');
      let summoned = false;
      for (let guard = 0; guard < 400; guard++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const summon = !summoned ? d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === 'Valefor') : undefined;
        if (summon !== undefined) {
          summoned = true;
          engine.submit({ ...summon.command, targets: [] } as Command);
          continue;
        }
        // Whatever acts next (the aeon, or a member if the aeon has gone) defends: the aeon stays and soaks the Voodoos.
        engine.submit(row(d, 'defend', undefined) ?? { kind: 'defend', targets: [] });
        if (actions(engine.state().log, DON).length >= 6) break;
      }
      const mine = actions(engine.state().log, DON);
      expect(mine.includes(ROW.karma), `seed ${seed}`).toBe(false);
      expect(mine.every((a) => a === ROW.voodoo || a === ROW.waddle || a === ROW.tonberryAttack), `seed ${seed}: ${mine.join(',')}`).toBe(true);
      voodoo += mine.filter((a) => a === ROW.voodoo).length;
    }
    expect(voodoo, 'Voodoo was cast with the aeon out').toBeGreaterThan(0);
  });

  it('the party carries a kill count for Karma only because the build says so: the same fight with no kills deals Karma 0 (the build, not the creature, holds the number)', () => {
    const engine = newEngine(1, 'don-tonberry');
    expect((engine.state().combatants['tidus'] as FFXCombatant).kills).toBe(500);
    expect((engine.state().combatants[DON] as FFXCombatant).kills).toBeUndefined();
  });
});
