/**
 * Shared fixtures for the Chapter XVIII tests (`sin-face`, Sin: the Face, link 4: Overdrive Sin over
 * Bevelle): an engine on the formation with the chapter's party, the drive and
 * read helpers, and the two bench policies. **FFX only.** Test-only.
 *
 * The content registry is wired the way the running game wires it (every FFX
 * ability and item), as the other FFX benches do (`isaaruUnits.ts`).
 */

import type {
  AvailableCommand,
  BattleEngine,
  BattleSetup,
  Command,
  Decision,
  FFXCombatant,
  FFXPartyBuild,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { sinFahrenheitBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';

export const SIN = 'overdrive-sin';
export const GROUP = 'overdrive-sin';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export function setupFor(seed: number, party: FFXPartyBuild = sinFahrenheitBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[GROUP];
  if (!group) throw new Error(`${GROUP} missing from the data layer`);
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

/** A fresh engine on Overdrive Sin. `lastTurn` overrides S-1 (12 or 13) for a measurement. */
export function newEngine(seed = 1, lastTurn?: number, party?: FFXPartyBuild): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupFor(seed, party));
  if (lastTurn !== undefined) (engine.state().flags as Record<string, unknown>)['sin.gigaGravitonTurn'] = lastTurn;
  return engine;
}

export type Input = Extract<Decision, { kind: 'player-input' }>;

/** Drive until the end (or `max` decisions), answering every player turn with `choose`. */
export function drive(engine: BattleEngine, choose: (d: Input) => Command, max = 6000): void {
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}

export function actor(engine: BattleEngine, id: string): FFXCombatant {
  return engine.state().combatants[id] as FFXCombatant;
}

export function flag(engine: BattleEngine, key: string): unknown {
  return engine.state().flags[key];
}

export function row(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}

export function enabledRow(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  const r = row(commands, kind, id);
  return r?.enabled ? r : undefined;
}

/** A row pointed at Sin, when it can be. */
export function atSin(r: AvailableCommand | undefined): Command | null {
  if (!r || !r.enabled || !r.validTargets.includes(SIN)) return null;
  return { ...r.command, targets: [SIN] } as Command;
}

export const defend = (): Command => ({ kind: 'defend', targets: [] });
