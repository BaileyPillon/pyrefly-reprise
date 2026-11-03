/**
 * The Keeper's hit counter and its answers, pinned where a mutation pass of the ch-keeper review found nothing watching (FFX only; `research/re-ffx-spectral-keeper.md` sections 4.3 to 4.5, the engine in
 * `src/battle/ffx/ai/spectral-keeper.ts`): the aeon gains (+1 on each Keeper turn, +2 on each damaging hit) and their order against the arming test, a miss that counts for nothing but still draws the sweep, and the
 * Keeper's answer to a counter-attack being dropped while the counter still counts. Also: Move cannot name the aeon rock, and a Circle goes back to being off the clock after its blast.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent } from '../../../src/battle/common/types.ts';
import { armCircle, setHitCount, setMinesLive } from '../../../src/battle/ffx/platforms.ts';
import {
  KEEPER, actionList, actor, circleId, ctxOf, defend, events, flags, inputFor, invincible, keeperActions, move, newEngine, nextInput, party, row, swing,
} from '../helpers/keeperDrive.ts';

const count = (engine: BattleEngine): number => flags(engine)['plat.count'] as number;
const sweeps = (engine: BattleEngine): number => keeperActions(engine).filter((a) => a === 'keeper-attack-all').length;

/** Yuna calls the first aeon the menu offers; the aeon is made sturdy so the counter is the only thing that moves. */
function withAeon(seed: number): BattleEngine {
  const engine = newEngine(seed);
  const d = inputFor(engine, 'yuna');
  engine.submit(d.commands.find((c) => c.command.kind === 'summon' && c.enabled)!.command);
  const aeonId = engine.state().aeonId!;
  const aeon = actor(engine, aeonId);
  aeon.stats.maxHp = 999_999;
  aeon.hp = 999_999;
  return engine;
}

/** The next input is the aeon's (the party is frozen while it is out). */
function aeonInput(engine: BattleEngine): ReturnType<typeof nextInput> {
  const d = nextInput(engine, false);
  expect(d.actorId).toBe(engine.state().aeonId);
  return d;
}

describe('with an aeon out, the counter gains 1 on each Keeper turn and 2 on each damaging hit (RE 4.4)', () => {
  it('a hit adds 2: one for the damage and one more for the aeon being out', () => {
    const engine = withAeon(101);
    setHitCount(ctxOf(engine), 0);
    const d = aeonInput(engine);
    engine.submit(swing(d)!);
    const hit = events(engine).filter((e) => e.type === 'damage' && e.targetId === KEEPER);
    expect(hit.length).toBeGreaterThan(0);
    expect(count(engine)).toBe(2);
  });

  it('a Keeper turn adds 1 (and nothing else moves the counter while the aeon only defends)', () => {
    const engine = withAeon(102);
    setHitCount(ctxOf(engine), 0);
    const attacks = (): number => keeperActions(engine).filter((x) => x === 'keeper-aeon-attack').length;
    const seen: number[] = [];
    for (let i = 0; i < 40 && seen.length < 3; i++) {
      const before = attacks();
      nextInput(engine, false); // the Keeper's own turns resolve on the way to the next input
      if (attacks() > before) seen.push(count(engine));
      engine.submit(defend());
    }
    expect(seen.length).toBe(3);
    expect(seen).toEqual([1, 2, 3]); // one per Keeper turn, no reset below the threshold
  });

  it('the gain comes BEFORE the arming test: at 3, the Keeper\'s next turn makes it 4 and lays the rock\'s mine at once', () => {
    const engine = withAeon(103);
    setHitCount(ctxOf(engine), 3);
    setMinesLive(ctxOf(engine), 0);
    for (let i = 0; i < 40 && !keeperActions(engine).includes('keeper-glyph-mine'); i++) {
      nextInput(engine, false);
      engine.submit(defend());
    }
    const acts = keeperActions(engine);
    expect(acts[0], 'the first Keeper turn after the count was set').toBe('keeper-glyph-mine');
    const lay = events(engine).find((e) => e.type === 'action-start' && e.abilityId === 'keeper-glyph-mine') as Extract<BattleEvent, { type: 'action-start' }>;
    expect(lay.targets).toEqual([circleId(7)]);
    expect(count(engine)).toBe(0); // reset by the lay
    expect(flags(engine)['plat.mines']).toBe(1);
  });
});

describe('a miss counts for nothing and still draws the sweep (RE 4.5: "a missed HP-class attack still draws a sweep")', () => {
  /** Plays seeds until Tidus's swing at an untouchable-looking Keeper misses; returns that engine and what the swing wrote. */
  function missed(): { engine: BattleEngine; since: number } {
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      actor(engine, KEEPER).stats.eva = 255;
      const d = inputFor(engine, 'tidus');
      const since = events(engine).length;
      engine.submit(swing(d)!);
      const mine = events(engine).slice(since);
      if (mine.some((e) => e.type === 'miss' && e.targetId === KEEPER) && !mine.some((e) => e.type === 'damage' && e.targetId === KEEPER)) return { engine, since };
    }
    throw new Error('no seed missed');
  }

  it('the counter does not move, the sweep still comes', () => {
    const { engine, since } = missed();
    expect(count(engine)).toBe(0);
    const after = events(engine).slice(since);
    expect(after.some((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'keeper-attack-all')).toBe(true);
  });
});

describe('the Keeper\'s answer to a counter-attack is dropped, but the counter-attack still counts (RE 4.5, last paragraph)', () => {
  it('Tidus\'s Counterattack answers the tail: +1 on the counter and no sweep for it', () => {
    let found = false;
    for (let seed = 1; seed <= 60 && !found; seed++) {
      const engine = newEngine(seed);
      for (const id of party) { const c = actor(engine, id); if (c.equipment) c.equipment.armor = { name: 'Test Shield', slots: 1, autoAbilities: ['counterattack'] }; }
      // Defend until the Keeper's tail has landed (nobody swings: the only damage to the Keeper can be the counter).
      let tailAt = -1;
      for (let i = 0; i < 40 && tailAt < 0; i++) {
        invincible(engine);
        nextInput(engine);
        engine.submit(defend());
        tailAt = events(engine).findIndex((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'keeper-berserk-tail');
      }
      if (tailAt < 0) continue;
      const stretch: BattleEvent[] = [];
      for (const e of events(engine).slice(tailAt)) {
        if (e.type === 'turn-start') break;
        stretch.push(e);
      }
      const answered = stretch.some((e) => e.type === 'counter' && e.cause === 'counterattack');
      if (!answered) continue; // Berserk (the tail's own status) or a miss stopped this seed's counter
      found = true;
      expect(stretch.some((e) => e.type === 'damage' && e.targetId === KEEPER), 'the counter hurt the Keeper').toBe(true);
      expect(count(engine), 'it counts').toBe(1);
      expect(stretch.some((e) => e.type === 'action-start' && e.actorId === KEEPER && e.abilityId === 'keeper-attack-all'), 'and draws no sweep').toBe(false);
      expect(sweeps(engine)).toBe(0);
    }
    expect(found, 'some seed lets the counter answer').toBe(true);
  });
});

describe('Move and the Circles (RE 3)', () => {
  it('Move cannot name the aeon rock (platform 7): the party stands on the ring and the rock is only the aeon\'s stage', () => {
    const engine = newEngine(111);
    const d = inputFor(engine, 'tidus');
    expect(move(d, 7)).toBeNull();
    const targets = d.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'move')!.validTargets;
    expect(targets).not.toContain(circleId(7));
    expect(targets.every((id) => /^spectral-circle-[1-6]$/.test(id))).toBe(true);
    // and the aeons, who stand on no platform, get no Move row at all
    const a = withAeon(112);
    const ad = aeonInput(a);
    expect(ad.commands.some((c) => c.command.kind === 'trigger')).toBe(false);
    expect(row(ad, 'trigger', 'move')).toBeNull();
  });

  it('after its blast a Circle is off the clock again (no turn, not on the turn list)', () => {
    const engine = newEngine(113);
    const ctx = ctxOf(engine);
    armCircle(ctx, circleId(3)); // Auron stands on 3
    setMinesLive(ctx, 1);
    for (let i = 0; i < 80 && !actionList(events(engine)).includes(`${circleId(3)}:keeper-mine-blast`); i++) {
      invincible(engine);
      const n = engine.nextDecision();
      if (n.kind === 'player-input') engine.submit(defend());
    }
    expect(actionList(events(engine))).toContain(`${circleId(3)}:keeper-mine-blast`);
    expect(engine.predictTurnOrder(40).some((p) => p.actorId === circleId(3))).toBe(false);
  });
});
