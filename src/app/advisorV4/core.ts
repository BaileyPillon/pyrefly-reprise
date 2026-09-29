/**
 * **Advisor v4's worker, without the worker**: everything the Web Worker does, as a plain class
 * the unit tests drive in-process (`./worker.ts` is the thin shell that feeds it messages).
 *
 * One job:
 *
 *  1. Rebuild the battle from the serialized copy it was handed (`FFXEngine.restore`). The live
 *     battle is on another thread; nothing here can reach it [AGENTS.md rule 1].
 *  2. With `advance`, play the copy on to the next player menu. In CTB the board a menu opens on
 *     is fixed at the previous press [research/ffx-combat-core.md §1.1], and a copy handed the
 *     battle's random state reaches it exactly (`tests/unit/ffx-engine-fork.test.ts`).
 *  3. v3's card for that board, exactly as the HUD computes it (`buildAdvisorView`, FFX's options).
 *  4. The search (`searchSteps`) at the device's budget, one future at a time, pausing every few
 *     ms so a cancel or a newer job is heard; it stops at `capMs`.
 *  5. The answer is the finished card: v3's, or v3's with the search's pick on top (`lift`).
 *
 * Game case: FFX only (the copy is an FFX engine); the search and the protocol are shared.
 */

import type { BattleSetup, EnemyGroupDef } from '../../battle/common/types.ts';
import { FFXEngine } from '../../battle/ffx/index.ts';
import { buildAdvisorView, type AdvisorOptions, type AdvisorView } from '../../engine/tactics/advisor.ts';
import { boardKey } from '../../engine/tactics/advisor-v4/key.ts';
import { budgetConfig } from '../../engine/tactics/advisor-v4/presets.ts';
import type { NextLink, Input } from '../../engine/tactics/advisor-v4/rollout.ts';
import { searchSteps, type SearchResult } from '../../engine/tactics/advisor-v4/search.ts';
import type { FromWorker, NoAnswer, SearchJob, SearchStats, ToWorker } from './protocol.ts';

export interface CoreDeps {
  post(msg: FromWorker): void;
  /** Give the event loop a turn (a cancel or a newer job may be waiting). */
  pause(): Promise<void>;
  now(): number;
  /** The data tables registered in this thread (`registerBattleContent`). */
  ready(): Promise<void>;
  /** The chain's later links' groups, in order (`findEnemyGroup`). */
  chainAfter(setup: BattleSetup): Promise<EnemyGroupDef[]>;
  /** The screen's own link carry (`setupForNextLink`). */
  nextLink: NextLink;
}

/** The options the FFX HUD's card is computed with (it passes none). */
const FFX_CARD_OPTIONS: AdvisorOptions = {};
/** Pause at least this often, in ms of work. */
const SLICE_MS = 12;
/** Most engine steps to reach the next menu (a CTB round of enemy turns is a handful). */
const MAX_ADVANCE = 20_000;

export class V4Core {
  private latest = 0;
  private readonly cancelled = new Set<number>();

  constructor(private readonly deps: CoreDeps) {}

  /** One message from the host. */
  receive(msg: ToWorker): Promise<void> | void {
    if (msg.type === 'cancel') {
      this.cancelled.add(msg.job);
      return;
    }
    this.latest = Math.max(this.latest, msg.job);
    return this.run(msg).catch((err: unknown) => {
      this.deps.post({ type: 'none', job: msg.job, reason: 'error', message: String((err as Error)?.stack ?? err) });
    });
  }

  private stop(job: number, t0: number, capMs: number): NoAnswer['reason'] | null {
    if (this.cancelled.has(job)) return 'cancelled';
    if (job !== this.latest) return 'superseded';
    if (this.deps.now() - t0 > capMs) return 'timeout';
    return null;
  }

  private async run(msg: SearchJob): Promise<void> {
    const { deps } = this;
    const t0 = deps.now();
    await deps.ready();
    const engine = FFXEngine.restore(msg.snapshot, { autoResolveMinigames: true });
    let d = engine.nextDecision();
    for (let i = 0; msg.advance && d.kind === 'resolved' && i < MAX_ADVANCE; i++) d = engine.nextDecision();
    const tAdvanced = deps.now();
    if (d.kind === 'battle-over') return deps.post({ type: 'none', job: msg.job, reason: 'battle-over' });
    if (d.kind !== 'player-input') return deps.post({ type: 'none', job: msg.job, reason: 'no-menu' });
    const decision: Input = d;
    const state = engine.state();
    const key = boardKey(state, decision.actorId, decision.commands);
    const card = { actorId: decision.actorId, commands: decision.commands };
    const v3 = buildAdvisorView(state, card, FFX_CARD_OPTIONS);
    const tV3 = deps.now();
    const setup = msg.snapshot.setup;
    const chain = setup ? { setup, next: await deps.chainAfter(setup), nextLink: deps.nextLink } : null;
    const steps = searchSteps(engine, state, decision, v3, FFX_CARD_OPTIONS, budgetConfig(msg.budget), chain);
    let result: SearchResult | null = null;
    let slice = deps.now();
    for (;;) {
      const why = this.stop(msg.job, t0, msg.capMs);
      if (why) return deps.post({ type: 'none', job: msg.job, reason: why });
      const r = steps.next();
      if (r.done) {
        result = r.value;
        break;
      }
      if (deps.now() - slice >= SLICE_MS) {
        await deps.pause();
        slice = deps.now();
      }
    }
    const tSearched = deps.now();
    let view: AdvisorView | null = v3;
    let switched = false;
    let unliftable = false;
    if (result.switched && result.command) {
      const lifted = buildAdvisorView(state, card, { ...FFX_CARD_OPTIONS, lift: result.command });
      const top = lifted?.suggestions[0]?.command;
      if (top && JSON.stringify(top) === JSON.stringify(result.command)) {
        view = lifted;
        switched = true;
      } else {
        unliftable = true;
      }
    }
    const tEnd = deps.now();
    const stats: SearchStats = {
      totalMs: tEnd - t0,
      advanceMs: tAdvanced - t0,
      v3Ms: tV3 - tAdvanced,
      searchMs: tSearched - tV3,
      liftMs: tEnd - tSearched,
      simDecisions: result.simDecisions,
      candidates: result.candidates,
      ...(result.skipped ? { skipped: result.skipped } : {}),
      ...(switched ? { origin: result.origin } : {}),
      ...(unliftable ? { unliftable } : {}),
    };
    this.cancelled.delete(msg.job);
    deps.post({ type: 'result', job: msg.job, key, view, switched, stats });
  }
}
