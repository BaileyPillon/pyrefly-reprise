/**
 * **The folded Orders row in Sin's Fin fights** (FFX only; CHECK 4 C4-2, re-tested after main's PR-0236 merged into
 * `chapter-sin`). CHECK 4 saw Tidus's ORDERS open onto two greyed rows ("Pull back: Already far", "Close in:
 * Ordered") at FAR with Close in already ordered. PR-0236 (shared airship plumbing, `ui/ffx/AirshipOrders.ts`)
 * greys the folded row itself.
 *
 * This drives the real engine on the real Left and Right Fin formations (rule 3): on each of Tidus's turns with no
 * order standing he orders the other range, and on each of his turns with one standing (he can act again before
 * Cid carries it out) the folded row must be disabled with the reason "Ordered". Everyone else defends. The
 * standing-order case must actually occur, or the test proves nothing.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine } from '../../../src/battle/common/types.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { sinFinsCoreBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import { sinLeftFinGroup, sinRightFinGroup } from '../../../src/data/ffx/enemies/sin-fins.ts';
import { airshipMenuRows } from '../../../src/ui/ffx/AirshipOrders.ts';
import { content, defend } from '../helpers/sinUnits.ts';

function engineOn(group: typeof sinLeftFinGroup, seed: number): BattleEngine {
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.init({ game: 'ffx', party: sinFinsCoreBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return e;
}

describe('the folded Orders row in the Fin fights (C4-2 after PR-0236)', () => {
  it('Tidus with an order standing: Orders is greyed, reason "Ordered"; with none standing it is choosable', () => {
    const standing = { near: 0, far: 0 };
    let choosable = 0;
    for (const group of [sinLeftFinGroup, sinRightFinGroup]) {
      for (let seed = 1; seed <= 12; seed++) {
        const e = engineOn(group, seed);
        for (let i = 0; i < 160; i++) {
          const d = e.nextDecision();
          if (d.kind === 'battle-over') break;
          if (d.kind !== 'player-input') continue;
          if (d.actorId !== 'tidus') {
            e.submit(defend());
            continue;
          }
          const flags = e.state().flags as Record<string, unknown>;
          const range = flags['airship.range'];
          const folded = airshipMenuRows(d.commands, flags).find((c) => c.label === 'Orders');
          expect(folded, `${group.id} seed ${seed}`).toBeDefined();
          const order = flags['airship.order'];
          if (order === 'near' || order === 'far') {
            standing[range as 'near' | 'far']++;
            expect(folded!.enabled, `${group.id} seed ${seed} at ${String(range)}`).toBe(false);
            expect(folded!.disabledReason).toBe('Ordered');
            e.submit(defend());
            continue;
          }
          choosable++;
          expect(folded!.enabled).toBe(true);
          const want = range === 'far' ? 'close-in' : 'pull-back';
          const row = d.commands.find((c) => c.command.kind === 'trigger' && (c.command as { id?: string }).id === want);
          expect(row?.enabled, `${want} at ${String(range)}`).toBe(true);
          e.submit(row!.command);
        }
      }
    }
    expect(standing.near + standing.far).toBeGreaterThan(0);
    expect(choosable).toBeGreaterThan(0);
  });
});
