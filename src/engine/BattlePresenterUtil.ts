/**
 * Small pure helpers the playback loop leans on.
 *
 * Kept beside the loop rather than inside it so `BattlePresenter.ts` stays
 * under the house 400-line cap and reads as nothing but the protocol.
 */

import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEngine,
  BattleResult,
  Command,
  FFX2BattleEngine,
  FFXBattleEngine,
  TurnPreview,
} from '../battle/common/types.ts';
import type { BattleOutcome } from './BattlePresenter.ts';

/** FFX gives a CTB forecast; FFX-2 gives gauges. Either drives the HUD. */
export function previewOf(engine: BattleEngine, previewCommand?: Command): TurnPreview[] | AtbSnapshot {
  const ffx = engine as Partial<FFXBattleEngine>;
  if (typeof ffx.predictTurnOrder === 'function') {
    return ffx.predictTurnOrder(10, previewCommand);
  }
  const x2 = engine as Partial<FFX2BattleEngine>;
  if (typeof x2.gaugeSnapshot === 'function') return x2.gaugeSnapshot();
  return [];
}

export function firstEnabled(commands: AvailableCommand[]): Command | null {
  const row = commands.find((c) => c.enabled) ?? commands[0];
  if (!row) return null;
  const targets = row.command.targets.length ? row.command.targets : row.validTargets.slice(0, 1);
  return { ...row.command, targets } as Command;
}

export function outcomeOf(result: BattleResult | null): BattleOutcome {
  if (!result) return { kind: 'aborted' };
  if (result.outcome === 'defeat') return { kind: 'defeat', result };
  if (result.outcome === 'escape') return { kind: 'escape', result };
  return { kind: 'victory', result };
}
