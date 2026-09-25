/**
 * Shared fixtures for the Chapter XIV tests (Isaaru's contest of aeons, the
 * Via Purifico): the ids, an engine on one link, a headless three-link chain on
 * the screen's own carry (`BattleScreenSetup.setupForNextLink`), and the
 * drive / read helpers. **FFX only.** Test-only.
 */

import type {
  AvailableCommand,
  BattleEngine,
  BattleSetup,
  BattleState,
  Command,
  Decision,
  FFXCombatant,
  FFXPartyBuild,
} from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { viaPurificoBuild } from '../../../src/data/ffx/builds/via-purifico.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

export const LINKS = ['isaaru-grothia', 'isaaru-pterya', 'isaaru-spathi'] as const;
export type LinkId = (typeof LINKS)[number];
export const ISAARU = 'isaaru';
export const GROTHIA = 'grothia';
export const PTERYA = 'pterya';
export const SPATHI = 'spathi';
/** The enemy aeon of each link. */
export const FOE: Record<LinkId, string> = { 'isaaru-grothia': GROTHIA, 'isaaru-pterya': PTERYA, 'isaaru-spathi': SPATHI };

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export function setupFor(link: LinkId, seed: number, party: FFXPartyBuild = viaPurificoBuild): BattleSetup {
  const group = ENEMY_GROUPS_BY_ID[link];
  if (!group) throw new Error(`${link} missing from the data layer`);
  return { game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
}

export function newEngine(link: LinkId = 'isaaru-grothia', seed = 1, party?: FFXPartyBuild): BattleEngine {
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupFor(link, seed, party));
  return engine;
}

export type Input = Extract<Decision, { kind: 'player-input' }>;
export const defend = (): Command => ({ kind: 'defend', targets: [] });

/** Drive until `stop` or the end, answering every player turn with `choose`. */
export function drive(engine: BattleEngine, choose: (d: Input) => Command, stop: (e: BattleEngine) => boolean = () => false, max = 6000): void {
  for (let i = 0; i < max; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}

/** Advance to the next player turn and return it (or `null` at the end). */
export function nextInput(engine: BattleEngine, max = 400): Input | null {
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'player-input') return d;
  }
  return null;
}

export function actor(engine: BattleEngine, id: string): FFXCombatant {
  return engine.state().combatants[id] as FFXCombatant;
}

export function row(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}

export function enabledRow(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  const r = row(commands, kind, id);
  return r?.enabled ? r : undefined;
}

export function summon(id: string): Command {
  return { kind: 'summon', id, targets: [] };
}

export function grandSummon(aeonId: string): Command {
  return { kind: 'overdrive', id: 'grand-summon', targets: [], extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId } } };
}

/** One link's outcome and the state it ended on. */
export interface LinkRun {
  link: LinkId;
  outcome: string;
  turns: number;
  state: BattleState;
}

/**
 * The three links back to back on the screen's own carry: HP, MP, gauges and
 * the bag, no heal between them (research §1.2). Link _n_ is seeded
 * `seed + n - 1`, as `runEncounterChain` seeds it.
 */
export function runChain(seed: number, choose: (link: LinkId, engine: BattleEngine, d: Input) => Command, party?: FFXPartyBuild): LinkRun[] {
  const runs: LinkRun[] = [];
  let setup = setupFor('isaaru-grothia', seed, party);
  for (let n = 0; n < LINKS.length; n++) {
    const link = LINKS[n]!;
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setup);
    drive(engine, (d) => choose(link, engine, d));
    const state = engine.state();
    const outcome = state.result?.outcome ?? 'unfinished';
    runs.push({ link, outcome, turns: state.turn, state });
    if (outcome !== 'victory' || !state.result?.nextGroupId) break;
    const next = ENEMY_GROUPS_BY_ID[state.result.nextGroupId];
    if (!next) throw new Error(`no group ${state.result.nextGroupId}`);
    setup = setupForNextLink(setup, next, state, seed + n + 1);
  }
  return runs;
}
