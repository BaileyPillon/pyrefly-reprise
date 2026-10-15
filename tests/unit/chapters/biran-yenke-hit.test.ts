/**
 * Biran and Yenke (the hidden FFX chapter): **the brothers' hit hook** (`onBrotherHit`; `research/re-ffx-biran-yenke.md` section 5.7; FFX only). Two things the RE review of 2026-10-14 pinned:
 *
 * 1. **The one random draw.** The game's script takes ONE draw of the shared script stream (stream 2), `GetRandomValue() mod 100`, on every non-lethal hit event on a brother (it picks a line of dialogue; the
 *    value starts at 200). The chapter shows no dialogue (the driver's decision) but keeps the draw, so the stream stands where the game's does. A lethal hit takes none.
 * 2. **The release is the script's own.** The guard is released only when Sentinel is on (DEF back to 30, Sentinel off); the hook never writes DEF otherwise. A lethal hit turns Sentinel off and nothing more.
 *
 * The cases call the hook on a real battle built by `buildBattle` (exact counts, no turn order in the way), then play one real exchange through the engine.
 *
 * **A real lethal blow is its own case** (the last describe; the RE session's last pass, 2026-10-15). The hand-set case above sets HP 0 and the `ko` status by hand, which is the state the hook never sees in the
 * game: `hit-apply.ts` holds the KO (`holdKo`) until after `onHit`, so a brother killed by the blow reaches the hook at HP 0 and still alive, and a test of `isAlive` let every lethal blow take the living branch.
 * That case drives Kimahri's Attack through the engine on a brother with 1 HP and reads stream 2 on the game's real 68-stream generator.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, FFXCombatant } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { buildBattle, type Ctx } from '../../../src/battle/ffx/index.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { runPreTurn } from '../../../src/battle/ffx/ai/hooks.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { ronsoAi } from '../../../src/battle/ffx/ai/biran-yenke.ts';
import { V12_LAST_ROLL, V12_START, lastRoll, onBrotherHit, raiseGuard } from '../../../src/battle/ffx/ai/biran-yenke-rules.ts';
import { FfxStream, makeFfxRng } from '../../../src/battle/ffx/adapt/streams.ts';
import { rngNextState } from '../../../src/battle/ffx/kernel/rng.ts';
import { has, isAlive, rtOf } from '../../../src/battle/ffx/state.ts';
import * as H from '../helpers/ronsoDrive.ts';

const { BIRAN, YENKE, KIM } = H;

/** A real battle whose random generator counts the draws taken from it (one stream, so every draw counts). */
function battle(seed = 1): { ctx: Ctx; log: BattleEvent[]; draws: () => number; reset: () => void } {
  const log: BattleEvent[] = [];
  const rng = new SeededRng(seed);
  let n = 0;
  const next = rng.next.bind(rng);
  rng.next = () => {
    n++;
    return next();
  };
  const ctx = buildBattle(H.setup(seed), rng, H.content, (e) => void log.push(e as BattleEvent));
  return { ctx, log, draws: () => n, reset: () => void (n = 0) };
}
const who = (ctx: Ctx, id: string): FFXCombatant => ctx.state.combatants[id] as FFXCombatant;

describe('every non-lethal hit on a brother takes exactly one script-stream draw (RE 5.7), a lethal one none', () => {
  it('starts at 200, then holds the last roll mod 100 (0 to 99), one draw a hit', () => {
    const { ctx, draws, reset } = battle(3);
    expect(lastRoll(ctx, who(ctx, BIRAN))).toBe(V12_START);
    expect(V12_START).toBe(200);
    reset();
    onBrotherHit(ctx, who(ctx, BIRAN));
    expect(draws()).toBe(1);
    const first = lastRoll(ctx, who(ctx, BIRAN));
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(100);
    expect(rtOf(ctx, BIRAN).ai[V12_LAST_ROLL]).toBe(first);
    expect(lastRoll(ctx, who(ctx, YENKE)), 'the other brother has his own').toBe(V12_START);
    for (let hit = 2; hit <= 20; hit++) {
      onBrotherHit(ctx, who(ctx, BIRAN));
      expect(draws(), `after hit ${hit}`).toBe(hit);
      expect(lastRoll(ctx, who(ctx, BIRAN))).toBeLessThan(100);
    }
  });

  it('takes the draw from the shared script stream, in the same place as the game: its value follows the seeded generator', () => {
    const a = battle(11);
    const b = battle(11);
    a.reset();
    b.reset();
    onBrotherHit(a.ctx, who(a.ctx, YENKE));
    onBrotherHit(b.ctx, who(b.ctx, YENKE));
    expect(lastRoll(a.ctx, who(a.ctx, YENKE))).toBe(lastRoll(b.ctx, who(b.ctx, YENKE)));
    expect(a.draws()).toBe(1);
  });

  it('a lethal hit draws nothing and stores nothing; it turns a Sentinel off and leaves DEF alone', () => {
    const { ctx, draws, reset, log } = battle(5);
    const yenke = who(ctx, YENKE);
    raiseGuard(ctx, yenke);
    expect(yenke.statuses['sentinel']).toBeDefined();
    expect(yenke.stats.def).toBe(254);
    yenke.hp = 0;
    yenke.statuses['ko'] = { id: 'ko', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    reset();
    onBrotherHit(ctx, yenke);
    expect(draws()).toBe(0);
    expect(lastRoll(ctx, yenke)).toBe(V12_START);
    expect(yenke.statuses['sentinel']).toBeUndefined();
    expect(log.some((e) => e.type === 'status-remove' && e.targetId === YENKE && e.status === 'sentinel')).toBe(true);
    expect(yenke.stats.def, 'the script writes DEF only on the living branch').toBe(254);
  });
});

describe("the release is the script's own: DEF is written only when Sentinel is on (RE 5.7)", () => {
  it('Sentinel on: DEF back to 30, Sentinel off, then the draw', () => {
    const { ctx, draws, reset } = battle(7);
    const yenke = who(ctx, YENKE);
    raiseGuard(ctx, yenke);
    reset();
    onBrotherHit(ctx, yenke);
    expect(yenke.stats.def).toBe(30);
    expect(yenke.statuses['sentinel']).toBeUndefined();
    expect(draws()).toBe(1);
  });

  it('Sentinel off: a DEF that is not 30 is left exactly as it is, and the draw is still taken', () => {
    const { ctx, draws, reset } = battle(7);
    const biran = who(ctx, BIRAN);
    biran.stats.def = 77; // the script never writes it here, whatever it is
    reset();
    onBrotherHit(ctx, biran);
    expect(biran.stats.def).toBe(77);
    expect(draws()).toBe(1);
  });
});

/** One brother's real turn: the pre-turn rules, then the script's command, run. */
function takeTurn(ctx: Ctx, id: string): void {
  const c = who(ctx, id);
  runPreTurn(ctx, c);
  const cmd = ronsoAi(aiContextFor(ctx, c));
  if (cmd) executeCommand(ctx, c, cmd, true);
}

describe('in a real exchange', () => {
  it("a plain Attack on Biran while they stand together: Yenke's guard is released by his own hit, and each brother hit takes one draw", () => {
    const { ctx, log, draws, reset } = battle(1);
    reset();
    // The attack's own rolls (hit, damage, crit) draw from the same one-stream generator, so count the hook's draw as the change in the stored value instead of the raw total.
    expect(lastRoll(ctx, who(ctx, YENKE))).toBe(V12_START);
    executeCommand(ctx, who(ctx, KIM), { kind: 'attack', targets: [BIRAN] }, true);
    expect(draws()).toBeGreaterThan(0);
    expect(who(ctx, YENKE).statuses['sentinel']).toBeUndefined();
    expect(who(ctx, YENKE).stats.def).toBe(30);
    expect(lastRoll(ctx, who(ctx, YENKE)), 'Yenke took the blow and so took the draw').toBeLessThan(100);
    expect(lastRoll(ctx, who(ctx, BIRAN)), 'Biran was named but not hit').toBe(V12_START);
    expect(log.filter((e) => e.type === 'damage')).toHaveLength(1);
  });

  it('a guarded plain Attack does 8 damage, the same blow with the brothers apart 400 to 520: under two percent, not a quarter (five seeds)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const guarded = battle(seed);
      executeCommand(guarded.ctx, who(guarded.ctx, KIM), { kind: 'attack', targets: [BIRAN] }, true);
      const guardedHit = guarded.log.find((e) => e.type === 'damage') as { targetId: string; amount: number };
      expect(guardedHit.targetId, `seed ${seed}`).toBe(YENKE); // Yenke stood in
      expect(guardedHit.amount, `seed ${seed}`).toBe(8);

      const apart = battle(seed);
      takeTurn(apart.ctx, BIRAN); // Thunder
      takeTurn(apart.ctx, BIRAN); // Bulldoze: apart
      apart.log.length = 0;
      executeCommand(apart.ctx, who(apart.ctx, KIM), { kind: 'attack', targets: [BIRAN] }, true);
      const open = apart.log.find((e) => e.type === 'damage') as { targetId: string; amount: number };
      expect(open.targetId, `seed ${seed}`).toBe(BIRAN);
      expect(open.amount, `seed ${seed}`).toBeGreaterThan(400);
      expect(open.amount, `seed ${seed}`).toBeLessThan(520);
      expect(guardedHit.amount / open.amount, `seed ${seed}`).toBeLessThan(0.03);
    }
  });
});

describe('a REAL lethal blow, driven through the engine, takes no draw of the script stream (RE 5.7)', () => {
  /** A battle on the game's own 68 streams, so stream 2 (the script stream) can be read by itself; the raw `GameStreams` is returned for its `states`. */
  function realStreams(seed: number): { ctx: Ctx; log: BattleEvent[]; script: () => number } {
    const log: BattleEvent[] = [];
    const rng = makeFfxRng(seed);
    const ctx = buildBattle(H.setup(seed), rng, H.content, (e) => void log.push(e as BattleEvent));
    return { ctx, log, script: () => rng.states[FfxStream.Script] ?? -1 };
  }
  /** Kimahri's plain Attack at Biran while the brothers stand together: Yenke stands guard and takes the blow, for 8 (the case above), with Sentinel on and DEF at 254. */
  const blow = (ctx: Ctx): void => void executeCommand(ctx, who(ctx, KIM), { kind: 'attack', targets: [BIRAN] }, true);

  it('a blow that leaves him standing moves stream 2 by exactly one draw; the blow that kills him moves it by none, releases nothing, and the death check then kills him', () => {
    // The control: the same blow on a brother with plenty of HP is a non-lethal hit event, the one draw of the game (and the guard is released by his own hit).
    for (const seed of [1, 2, 3]) {
      const c = realStreams(seed);
      const before = c.script();
      blow(c.ctx);
      const yenke = who(c.ctx, YENKE);
      const hits = c.log.filter((e) => e.type === 'damage');
      expect(hits, `seed ${seed}: one hit, on the guard`).toMatchObject([{ targetId: YENKE, amount: 8 }]);
      expect(yenke.hp, `seed ${seed}: he is still standing`).toBeGreaterThan(0);
      expect(c.script(), `seed ${seed}: one draw of stream 2`).toBe(rngNextState(FfxStream.Script, before));
      expect(lastRoll(c.ctx, yenke), `seed ${seed}: the roll is stored`).toBeLessThan(100);
      expect(yenke.stats.def, `seed ${seed}: released`).toBe(30);
    }

    // The case: Yenke has 1 HP, so the same 8-point blow is a real lethal one. Nothing is set by hand but his HP: the KO, if it comes, comes from the engine's own death check, after the hook.
    for (const seed of [1, 2, 3]) {
      const c = realStreams(seed);
      const yenke = who(c.ctx, YENKE);
      yenke.hp = 1;
      const before = c.script();
      blow(c.ctx);
      expect(c.log.filter((e) => e.type === 'damage'), `seed ${seed}: one hit, on the guard`).toMatchObject([{ targetId: YENKE, amount: 8 }]);
      expect(yenke.hp, `seed ${seed}`).toBe(0);
      expect(has(yenke, 'ko'), `seed ${seed}: the death check ran after the hook and he is down`).toBe(true);
      expect(isAlive(yenke), `seed ${seed}`).toBe(false);
      expect(c.script(), `seed ${seed}: stream 2 did not move`).toBe(before);
      expect(lastRoll(c.ctx, yenke), `seed ${seed}: nothing stored`).toBe(V12_START);
      expect(yenke.stats.def, `seed ${seed}: the script writes DEF only on the living branch, so the guard's 254 stays`).toBe(254);
      expect(yenke.statuses['sentinel'], `seed ${seed}: Sentinel is off`).toBeUndefined();
      expect(who(c.ctx, BIRAN).hp, `seed ${seed}: the other brother was not touched`).toBe(who(c.ctx, BIRAN).stats.maxHp);
    }
  });
});
