/**
 * **Advisor v4's worker, in this process**: the real `V4Core` behind a `WorkerLike`, with every
 * message copied by `structuredClone` both ways (what `postMessage` does), so the unit tests and the
 * worker-path scorecard run the game's exact protocol without a thread.
 *
 * `idle()` resolves once every message posted so far has been answered (measurement only).
 *
 * Game case: FFX only (the worker is FFX's for now).
 */

import type { EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { V4Core, type CoreDeps } from '../../../src/app/advisorV4/core.ts';
import type { WorkerLike } from '../../../src/app/advisorV4/host.ts';
import type { FromWorker, ToWorker } from '../../../src/app/advisorV4/protocol.ts';

export class InProcWorker implements WorkerLike {
  onmessage: ((e: { data: FromWorker }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  terminated = false;
  readonly received: ToWorker[] = [];
  readonly sent: FromWorker[] = [];
  private chain: Promise<void> = Promise.resolve();
  private readonly core: V4Core;

  constructor(deps: Partial<CoreDeps> = {}) {
    this.core = new V4Core({
      post: (msg) => {
        if (this.terminated) return;
        const copy = structuredClone(msg);
        this.sent.push(copy);
        this.onmessage?.({ data: copy });
      },
      pause: () => new Promise<void>((resolve) => setImmediate(resolve)),
      now: () => performance.now(),
      ready: async () => {
        await registerBattleContent();
      },
      chainAfter: async (setup) => {
        const out: EnemyGroupDef[] = [];
        for (let id = setup.enemies.nextGroupId; id && out.length < 12; ) {
          const g = await findEnemyGroup(id);
          if (!g) break;
          out.push(g);
          id = g.nextGroupId;
        }
        return out;
      },
      nextLink: (p, g, s, seed) => setupForNextLink(p, g, s, seed),
      ...deps,
    });
  }

  postMessage(msg: ToWorker): void {
    if (this.terminated) return;
    const copy = structuredClone(msg);
    this.received.push(copy);
    // Like a real worker: the message is handled on a later task, never inside the caller.
    const run = new Promise<void>((resolve) => setImmediate(resolve)).then(() => (this.terminated ? undefined : this.core.receive(copy)));
    this.chain = Promise.all([this.chain, run]).then(() => undefined);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Every message posted so far has been handled. */
  async idle(): Promise<void> {
    for (;;) {
      const c = this.chain;
      await c;
      if (c === this.chain) return;
    }
  }
}
