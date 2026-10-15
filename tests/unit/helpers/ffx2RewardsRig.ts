/**
 * Rig for `parity-ffx2-rewards-engine.test.ts` (re-parity RC9, lane X2-C; **FFX-2 only**): a real engine with Chapter VI's three girls against a
 * real enemy group, and a probe that knocks a unit out through the engine's own HP path (`applyHpDelta`, where the KO resolution and so the reward
 * roll run), taps every draw of the generator, and reads the result record the way the battle-end check builds it. Nothing here imports the reward
 * kernel, the ledger or their adapter, so a wrong wiring shows as a difference.
 */

import type { GameStreams } from '../../../src/battle/common/streams.ts';
import type { BattleResult, BattleSetup, Command, EnemyGroupDef, FFX2MemberBuild, StatusId } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { performCommand } from '../../../src/battle/ffx2/execute.ts';
import type { EventDraft, Ffx2EngineOptions, Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { applyHpDelta, revive } from '../../../src/battle/ffx2/resolve-hp.ts';
import { buildResult } from '../../../src/battle/ffx2/results.ts';
import { bumpChain } from '../../../src/battle/ffx2/chain.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

/** A draw the generator made: its stream and its raw 31-bit value. */
export interface Tapped {
  stream: number;
  value: number;
}

export class RewardsProbe extends FFX2Engine {
  /** Every draw since the last {@link untap}, in order. */
  readonly taps: Tapped[] = [];

  /** The draws on the two streams the reward roll shares with the thefts. */
  get rewardDraws(): Tapped[] {
    return this.taps.filter((t) => t.stream === 10 || t.stream === 11);
  }

  get all(): Ffx2Unit[] {
    return this.units;
  }

  unit(id: string): Ffx2Unit {
    const u = this.units.find((x) => x.id === id);
    if (!u) throw new Error(`no unit ${id}`);
    return u;
  }

  /** The enemy whose data id is `enemyId` (a monster's unit id is its data id). */
  enemy(enemyId: string): Ffx2Unit {
    const u = this.units.find((x) => x.side === 'enemy' && x.id === enemyId);
    if (!u) throw new Error(`no enemy ${enemyId}`);
    return u;
  }

  /** Knock `target` out through the engine's own HP path (damage equal to its HP), as `source` struck it. */
  kill(target: Ffx2Unit, source = 'yuna'): void {
    applyHpDelta(this.resolveCtx(), target, target.hp, source);
  }

  /** Bring a knocked-out unit back (a Phoenix Down), then it can fall again. */
  raise(target: Ffx2Unit): void {
    revive(this.resolveCtx(), target, 1, 'test');
  }

  /** Play a command through the engine's own path (the charge already paid). */
  act(actor: Ffx2Unit, command: Command): EventDraft[] {
    const from = this.drafts.length;
    performCommand(this.env(), actor, command, true);
    return this.drafts.slice(from);
  }

  /** `target` has taken `hits` hits in a row inside one chain window (its chain counter and the best it ever reached are both `hits`). */
  chained(target: Ffx2Unit, hits: number): void {
    for (let i = 0; i < hits; i++) bumpChain(target, i, false);
  }

  /** The result record the battle-end check would build for `outcome` now. */
  result(outcome: BattleResult['outcome'] = 'victory'): BattleResult {
    return buildResult(this.units, this.battleState, outcome, 0);
  }

  /** Put a status on a unit the way a command would have, with no clock. */
  status(target: Ffx2Unit, id: StatusId): void {
    target.statuses[id] = { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
  }

  untap(): void {
    this.taps.length = 0;
  }

  /** The raw value of the `index`-th next draw of `stream`, read without taking it (the generator is put back exactly as it stood). */
  peek(stream: number, index = 0): number {
    const rng = this.rng as unknown as GameStreams;
    const state = rng.saveState();
    const tap = rng.tap;
    rng.tap = undefined;
    let value = 0;
    for (let i = 0; i <= index; i++) value = rng.draw(stream);
    rng.restoreState(state);
    rng.tap = tap;
    return value;
  }
}

/** The party of Chapter VI (Yuna, Rikku, Paine) against `group`, on a real engine whose draws are tapped. */
export function board(group: EnemyGroupDef | string, seed = 1, extra: Partial<Ffx2EngineOptions> = {}, dress: (member: FFX2MemberBuild) => FFX2MemberBuild = (member) => member): RewardsProbe {
  const def = typeof group === 'string' ? data.ENEMY_GROUPS_BY_ID[group] : group;
  if (def === undefined) throw new Error(`no formation ${String(group)}`);
  const engine = new RewardsProbe(ffx2Options(extra));
  const party = { ...chateauBuild, members: chateauBuild.members.map(dress) as typeof chateauBuild.members };
  const setup: BattleSetup = { game: 'ffx2', party, enemies: def, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  (engine as unknown as { rng: GameStreams }).rng.tap = (stream, value) => engine.taps.push({ stream, value });
  return engine;
}
