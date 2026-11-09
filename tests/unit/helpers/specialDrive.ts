/**
 * Drive a Special Dress Up headlessly on the real FFX-2 engine (FFX-2 only; the `specialDressUp` switch is passed ON here, it is OFF in every build).
 *
 * - {@link openSpecial} opens a link on a chapter's real party and group with the switch on.
 * - {@link walkTo} plays the girl's own turns along her real Garment Grid (the Change rows the menu offers, by breadth-first search over the grid's links) until she is offered her Special.
 * - {@link intoSpecial} then picks the Special Dress Up row.
 *
 * Everything the other girls and the foe do is the engine's. A test may rig the girls (`immortal`) so the foe's script cannot end the walk before it is done; that is an input to a measurement, never game data.
 */

import type { BattleSetup, Command, Decision, EnemyGroupDef, FFX2Combatant, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { adjacentNodes } from '../../../src/battle/ffx2/garment-grids.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { garmentGridRegistryFrom } from '../../../src/battle/ffx2/index.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { logOf, makeInvincible, nextInput, topUp, type AngraEv } from './angraMainyuDrive.ts';

export { logOf, makeInvincible, nextInput, topUp, type AngraEv };

export type Input = Extract<Decision, { kind: 'player-input' }>;
export type Unit = FFX2Combatant & { aiMemory?: Record<string, unknown>; sdsp?: { role: string; special: string } };

const grids = garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS));

export interface Open {
  build: FFX2PartyBuild;
  group: EnemyGroupDef;
  seed: number;
  /** Switch on (default true). */
  specials?: boolean;
  immortal?: boolean;
  atbMode?: 'wait' | 'active';
  /** A rig the test applies after init (an input to a measurement). */
  setup?: (engine: FFX2Engine) => void;
}

export function openSpecial(o: Open): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: o.atbMode ?? 'wait', ...((o.specials ?? true) ? { specialDressUp: true } : {}) }));
  engine.setSeed(o.seed);
  const setup: BattleSetup = { game: 'ffx2', party: structuredClone(o.build), enemies: o.group, triggers: [], seed: o.seed, condition: 'normal', canEscape: false };
  engine.init(setup);
  if (o.immortal) for (const id of ['yuna', 'rikku', 'paine']) makeInvincible(unit(engine, id));
  o.setup?.(engine);
  return engine;
}

export const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;

/** The rows of a decision that are spherechanges. */
export const changeRows = (d: Input) => d.commands.filter((c) => c.command.kind === 'spherechange');

/** The node a change row steps to. */
export const toNodeOf = (row: { command: Command }): number => (row.command as unknown as { extra: { toNode: number } }).extra.toNode;

/** The Special Dress Up row of a decision, if it is offered. */
export function specialRow(d: Input) {
  return d.commands.find((c) => c.command.kind === 'spherechange' && (c.command.extra as { specialDressUp?: boolean }).specialDressUp === true);
}

/** The node a girl must step to next to reach a node with a dressphere she has not worn, by breadth-first search over her real grid; `null` when every dressphere is worn. */
export function nextStep(engine: FFX2Engine, girlId: string, gridNodes: Array<string | null>): { node: number; dress: string } | null {
  const u = unit(engine, girlId);
  const sphere = u.dresspheres!;
  const grid = grids.get(sphere.garmentGrid.id)!;
  const worn = new Set(sphere.garmentGrid.wornThisBattle);
  const goal = (n: number): boolean => gridNodes[n] != null && !worn.has(gridNodes[n] as string);
  const first = new Map<number, number>();
  const seen = new Set<number>([sphere.garmentGrid.nodePosition]);
  let frontier = adjacentNodes(grid, sphere.garmentGrid.nodePosition).map((a) => a.node);
  for (const n of frontier) first.set(n, n);
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const n of frontier) {
      if (seen.has(n)) continue;
      seen.add(n);
      if (goal(n) && gridNodes[n]) return { node: first.get(n) as number, dress: gridNodes[n] as string };
      for (const a of adjacentNodes(grid, n)) if (!seen.has(a.node)) { if (!first.has(a.node)) first.set(a.node, first.get(n) as number); next.push(a.node); }
    }
    frontier = next;
  }
  return null;
}

/** The dresses on a girl's nodes as the engine laid them (what `gridNodeContents` made of her owned list). */
export function nodesOf(engine: FFX2Engine, girlId: string): Array<string | null> {
  // The menu rows name the dress on each adjacent node; the full layout is rebuilt from the build the same way the engine does (`setup.ts#gridNodeContents`).
  const u = unit(engine, girlId);
  const sphere = u.dresspheres!;
  const grid = grids.get(sphere.garmentGrid.id)!;
  const owned = [sphere.current, ...sphere.owned.filter((d) => d !== sphere.current && !['floral-fallal', 'machina-maw', 'full-throttle'].includes(d))];
  return Array.from({ length: grid.nodes }, (_, i) => owned[i] ?? null);
}

export interface Walk {
  /** The decision that offers the Special Dress Up row (the girl's), or null if the battle ended or the budget ran out first. */
  input: Input | null;
  /** How many Changes she made. */
  changes: number;
}

/**
 * Play until `girl` is offered her Special Dress Up. On her turns she makes the next Change toward a dressphere she has not worn; every other girl defends; `immortal` tops the party up before each answer.
 */
export function walkTo(engine: FFX2Engine, girlId: string, opts: { immortal?: boolean; maxDecisions?: number; other?: (d: Input, engine: FFX2Engine) => Command | null; nodes?: Array<string | null> } = {}): Walk {
  const nodes = opts.nodes ?? nodesOf(engine, girlId); // `nodes`: the layout read at the start, for a second walk (`nodesOf` lays out from the dress she wears NOW)
  let changes = 0;
  for (let i = 0; i < (opts.maxDecisions ?? 3000); i++) {
    const d = nextInput(engine);
    if (d === null) return { input: null, changes };
    if (opts.immortal) topUp(engine);
    // a rig: the foe's Curse would shut the Change menu (it does in the real game; Holy Water is the answer), so the walk test lifts it where the foe puts it on and picks the row the menu greyed for it
    const rig = opts.immortal === true && d.actorId === girlId;
    if (rig) delete unit(engine, girlId).statuses.curse;
    if (d.actorId === girlId) {
      if (specialRow(d)) return { input: d, changes };
      const step = nextStep(engine, girlId, nodes);
      const row = step ? changeRows(d).find((r) => toNodeOf(r) === step.node && (r.enabled || rig)) : undefined;
      if (row) {
        changes += 1;
        engine.submit(row.command);
        continue;
      }
      engine.submit({ kind: 'defend', targets: [] });
      continue;
    }
    engine.submit(opts.other?.(d, engine) ?? { kind: 'defend', targets: [] });
  }
  return { input: null, changes };
}

/** Pick the Special Dress Up row of the walk's decision. */
export function intoSpecial(engine: FFX2Engine, d: Input): void {
  const row = specialRow(d);
  if (!row) throw new Error('no Special Dress Up row on the decision');
  engine.submit(row.command);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Playing the parts
// ---------------------------------------------------------------------------------------------------------------------------------

/** The rows of a decision that are abilities, by ability id. */
export const abilityRow = (d: Input, id: string) => d.commands.find((c) => c.command.kind === 'ability' && (c.command as { id: string }).id === id && c.enabled);

/** A command from a row, aimed at `targets` (empty = the menu's default). */
export const aimed = (row: { command: Command }, targets: string[] = []): Command => ({ ...row.command, targets }) as Command;

const HEALS = ['white-pollen', 'hp-repair', 'stamina'];
const REVIVES = ['all-life', 'revival', 'reboot'];
const BUFFS = ['tough-nuts', 'hard-leaves', 'shellter', 'protector', 'steel-feather', 'diamond-feather'];
const BEST = ['great-whirl', 'vajra', 'sword-dance', 'flare-whirl', 'shockstorm', 'shockwave', 'fiers', 'aestus', 'heat-whirl', 'floral-bomb', 'homing-ray', 'howitzer'];

/**
 * A bot standing in for a player on a Special's three parts (a measurement input, never game data): a fallen part is raised first, then a part below half is mended, then each buff is cast once, then the
 * strongest attack the part's menu offers is thrown at the foe (the plain attack when none of those is offered). `cast` remembers the buffs already on the party.
 */
export function partsPolicy(boss: string, cast: Set<string> = new Set()): (d: Input, engine: FFX2Engine) => Command {
  return (d, engine) => {
    const party = d.actorId.length > 0 ? engine.state().activeIds.map((id) => unit(engine, id)) : [];
    const find = (names: string[], suffix = '') => {
      for (const n of names) {
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && new RegExp(`-${n}(-[a-z]+)?$`).test((c.command as { id: string }).id) && c.validTargets.length > 0 && suffix === '');
        if (row) return row;
      }
      return undefined;
    };
    const fallen = party.find((p) => !p.alive);
    const revive = fallen ? find(REVIVES) : undefined;
    if (revive && fallen && revive.validTargets.includes(fallen.id)) return aimed(revive, [fallen.id]);
    const hurt = party.filter((p) => p.alive).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    const heal = hurt && hurt.hp / hurt.stats.maxHp < 0.5 ? find(HEALS) : undefined;
    if (heal && hurt && heal.validTargets.includes(hurt.id)) return aimed(heal, [hurt.id]);
    for (const n of BUFFS) {
      const row = find([n]);
      if (row && !cast.has(n)) {
        cast.add(n);
        return aimed(row, row.targeting === 'self' ? [d.actorId] : []);
      }
    }
    const best = find(BEST);
    if (best) return aimed(best, best.targeting === 'single-enemy' || best.targeting === 'single-any' ? [boss] : []);
    const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    return attack ? aimed(attack, [boss]) : { kind: 'defend', targets: [] };
  };
}
