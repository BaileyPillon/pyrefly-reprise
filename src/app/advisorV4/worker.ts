/**
 * **Advisor v4's Web Worker** (a Vite worker entry: `./wiring.ts` starts it with
 * `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`).
 *
 * A thin shell around `./core.ts`: it registers the data tables in this thread, feeds the core the
 * host's messages, and pauses through a `MessageChannel` (no 4 ms timer clamp) so a cancel is heard
 * between two simulated futures. It never sees the live battle, only the copy each job carries.
 *
 * Game case: FFX only for now (shared plumbing: the worker is game-neutral, the core is FFX's).
 */

import { registerBattleContent } from '../screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForNextLink } from '../screens/BattleScreenSetup.ts';
import type { EnemyGroupDef } from '../../battle/common/types.ts';
import { V4Core } from './core.ts';
import type { FromWorker, ToWorker } from './protocol.ts';

interface WorkerScope {
  postMessage(msg: FromWorker): void;
  onmessage: ((e: MessageEvent<ToWorker>) => void) | null;
}

const scope = self as unknown as WorkerScope;
const channel = new MessageChannel();
const waiting: Array<() => void> = [];
channel.port1.onmessage = (): void => waiting.shift()?.();

let registered: Promise<unknown> | null = null;

const core = new V4Core({
  post: (msg) => scope.postMessage(msg),
  pause: () =>
    new Promise<void>((resolve) => {
      waiting.push(resolve);
      channel.port2.postMessage(0);
    }),
  now: () => performance.now(),
  ready: async () => {
    registered ??= registerBattleContent();
    await registered;
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
  nextLink: (previous, next, state, seed) => setupForNextLink(previous, next, state, seed),
});

scope.onmessage = (e): void => {
  void core.receive(e.data);
};
