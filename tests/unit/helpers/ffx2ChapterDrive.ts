/**
 * Drive FFX-2 chapters 4 and 5 headlessly through the shipped
 * `intendedStrategy`, with a modelled human decision time `D` burned as Active
 * clock at every menu. **FFX-2 only.**
 *
 * Shared by the golden test (`ffx2-atb-golden.test.ts`) and the menu-ownership
 * suite (`ffx2-active-menu.test.ts`). `D` is an **input to a measurement, not
 * game data**; `D = 0` is the auto-battler's behaviour and the regression
 * control (`docs/plans/ffx2-active-menu-review.md`).
 */

import { createHash } from 'node:crypto';
import type { BattleEvent, BattleSetup, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../../src/battle/ffx2/index.ts';
import type { Ffx2EngineOptions } from '../../../src/battle/ffx2/internal.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../../src/data/ffx2/ids.ts';

const MAX_DECISIONS = 30_000;

export function ffx2Options(extra: Partial<Ffx2EngineOptions> = {}): Ffx2EngineOptions {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
    ...extra,
  };
}

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row =
    d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

export interface DriveResult {
  outcome: string | undefined;
  /** Every link's full event log, in order. */
  logs: BattleEvent[][];
  /** Game ticks across every link. */
  ticks: number;
  /** Menus the clock closed under the player (the owner could no longer answer). */
  invalidated: number;
  /** Submits that returned no events and left nothing held. */
  refused: number;
  /** Submits a chain-locked owner made that were held for the lock to lift. */
  held: number;
}

function runLink(engine: FFX2Engine, decisionMs: number, out: DriveResult): string | undefined {
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result.outcome;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      if (!engine.inputValid(d.actorId)) {
        out.invalidated += 1;
        continue;
      }
    }
    const picked = intendedStrategy(d.actorId, d.commands, engine);
    const events = engine.submit(picked ?? fallback(d));
    if (events.length === 0) {
      if (engine.heldCommand()) out.held += 1;
      else out.refused += 1;
    }
  }
  return undefined;
}

function empty(): DriveResult {
  return { outcome: undefined, logs: [], ticks: 0, invalidated: 0, refused: 0, held: 0 };
}

export function driveChapter4(seed: number, decisionMs: number, extra: Partial<Ffx2EngineOptions> = {}): DriveResult {
  const out = empty();
  const engine = new FFX2Engine(ffx2Options(extra));
  const group = data.ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
  if (!group) throw new Error('ffx2-bahamut missing');
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  out.outcome = runLink(engine, decisionMs, out);
  out.logs.push([...engine.state().log]);
  out.ticks += engine.state().ticks;
  return out;
}

export function driveChapter5(seed: number, decisionMs: number, extra: Partial<Ffx2EngineOptions> = {}): DriveResult {
  const out = empty();
  const engine = new FFX2Engine(ffx2Options(extra));
  const first = data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[0]!];
  if (!first) throw new Error('the Vegnagun chain is missing');
  let setup: BattleSetup = {
    game: 'ffx2',
    party: farplaneBuild,
    enemies: first,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  let group: EnemyGroupDef = first;
  let links = 0;
  for (;;) {
    const outcome = runLink(engine, decisionMs, out);
    out.logs.push([...engine.state().log]);
    out.ticks += engine.state().ticks;
    links += 1;
    out.outcome = outcome;
    if (outcome !== 'victory') break;
    const nextId = group.nextGroupId;
    if (!nextId) break;
    const next = data.ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error(`chain points at "${nextId}" with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return out;
}

/** sha256 of every event of every link, serialised in order. */
export function logHash(result: DriveResult): string {
  const h = createHash('sha256');
  for (const log of result.logs) h.update(JSON.stringify(log));
  return h.digest('hex').slice(0, 16);
}
