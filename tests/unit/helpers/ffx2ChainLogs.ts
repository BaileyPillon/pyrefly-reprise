/**
 * Every link's event log of an FFX-2 chain driven by the shipped
 * `intendedStrategy` at zero decision time, hashed — for pinning "nothing that
 * already plays moved" across an engine change. **FFX-2 only.** Test-only.
 *
 * Chapters 4 and 5 are already pinned by `ffx2-atb-golden.test.ts`; this covers
 * the chains that golden does not (Chapter 6, Chapter XI), and the Den itself.
 */

import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options, logHash, type DriveResult } from './ffx2ChapterDrive.ts';

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** Drive the chain starting at `firstGroupId` to its end or a loss; hash every link's log. */
export function chainLogHash(firstGroupId: string, party: FFX2PartyBuild, seed: number): { hash: string; outcome: string | undefined } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const first = data.ENEMY_GROUPS_BY_ID[firstGroupId];
  if (!first) throw new Error(`no formation ${firstGroupId}`);
  let group: EnemyGroupDef = first;
  let setup: BattleSetup = { game: 'ffx2', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  const out: DriveResult = { outcome: undefined, logs: [], ticks: 0, invalidated: 0, refused: 0, held: 0 };
  for (let links = 1; ; links++) {
    let outcome: string | undefined;
    for (let i = 0; i < 30_000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = d.result.outcome;
        break;
      }
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
    }
    out.logs.push([...engine.state().log]);
    out.outcome = outcome;
    if (outcome !== 'victory' || !group.nextGroupId) break;
    const next = data.ENEMY_GROUPS_BY_ID[group.nextGroupId];
    if (!next) break;
    setup = setupForNextLink(setup, next, engine.state(), seed + links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return { hash: logHash(out), outcome: out.outcome };
}
