/**
 * Wiring the **data tables** into the two engines, once per boot.
 *
 * This is the join the layering rule deliberately leaves open. `src/battle/**`
 * may not import `src/data/**` (`docs/ARCHITECTURE.md`), so each engine ships a
 * registry it expects the app to fill:
 *
 * - **FFX** owns a process-wide registry seeded with its core actions;
 *   `registerFFXAbilities` / `registerFFXItems` add the real records and
 *   `FFXEngine` clones the result at `init()`.
 * - **FFX-2** takes its registries by injection, built from the data tables
 *   through `src/battle/ffx2/adapters.ts`.
 *
 * Until this module ran, every FFX battle resolved against `CORE_ABILITIES`
 * alone: bosses could only auto-attack, the party had no magic, items or
 * Overdrives, and any encounter whose script depends on a real rotation —
 * Yunalesca's above all — could never reach a decision.
 *
 * `src/data/ffx/index.ts` is being written as this lands, so the FFX side reads
 * whatever is on disk: the index when it exists, otherwise every module under
 * `src/data/ffx/**`, harvesting anything shaped like an `AbilityDef` or an
 * `ItemDef`. Both paths go through the same harvester, so the eventual index
 * needs no special case here.
 */

import type { AbilityDef, ItemDef } from '../../battle/common/types.ts';
import { registerFFXAbilities, registerFFXItems } from '../../battle/ffx/index.ts';
import {
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
  type Ffx2EngineOptions,
} from '../../battle/ffx2/index.ts';

type Loader = () => Promise<Record<string, unknown>>;

/** The FFX index, once the data agent lands it. Empty until then. */
const ffxIndexModule = import.meta.glob('../../data/ffx/index.ts') as Record<string, Loader>;
/** Every FFX data module, as the fallback source. */
const ffxDataModules = import.meta.glob('../../data/ffx/**/*.ts') as Record<string, Loader>;

// ---------------------------------------------------------------- duck types

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** An `AbilityDef` is recognisable by its required discriminating fields. */
function isAbilityDef(v: unknown): v is AbilityDef {
  if (!isRecord(v)) return false;
  return (
    typeof v['id'] === 'string' &&
    typeof v['name'] === 'string' &&
    (v['game'] === 'ffx' || v['game'] === 'ffx2') &&
    typeof v['category'] === 'string' &&
    typeof v['formula'] === 'string' &&
    typeof v['damageType'] === 'string' &&
    Array.isArray(v['flags'])
  );
}

/** An `ItemDef` carries an `effect` and the menu flags; it has no formula. */
function isItemDef(v: unknown): v is ItemDef {
  if (!isRecord(v)) return false;
  return (
    typeof v['id'] === 'string' &&
    typeof v['name'] === 'string' &&
    (v['game'] === 'ffx' || v['game'] === 'ffx2') &&
    v['effect'] !== undefined &&
    typeof v['usableInBattle'] === 'boolean'
  );
}

interface Harvest {
  abilities: Map<string, AbilityDef>;
  items: Map<string, ItemDef>;
}

/**
 * Pull every ability and item out of an arbitrary module shape.
 *
 * Data files ship all of them: a bare `export const cure: AbilityDef`, an
 * `ABILITIES: Record<id, AbilityDef>`, an `ALL_ABILITIES: AbilityDef[]`, and a
 * `default` object whose values are any of those. Recursing a few levels with
 * a seen-set covers the lot without caring which shape a given file chose.
 */
function harvest(value: unknown, out: Harvest, seen: Set<object>, depth = 0): void {
  if (depth > 3 || !isRecord(value) || seen.has(value)) return;
  seen.add(value);

  if (isAbilityDef(value)) {
    out.abilities.set(value.id, value);
    return;
  }
  if (isItemDef(value)) {
    out.items.set(value.id, value);
    return;
  }
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    harvest(child, out, seen, depth + 1);
  }
}

// -------------------------------------------------------------------- report

export interface ContentReport {
  /** Ability records registered for FFX, on top of the engine's core four. */
  abilitiesFfx: number;
  itemsFfx: number;
  abilitiesFfx2: number;
  itemsFfx2: number;
  dresspheresFfx2: number;
  garmentGridsFfx2: number;
  /** Where the FFX records came from. */
  ffxSource: 'index' | 'modules' | 'none';
}

let report: ContentReport = {
  abilitiesFfx: 0,
  itemsFfx: 0,
  abilitiesFfx2: 0,
  itemsFfx2: 0,
  dresspheresFfx2: 0,
  garmentGridsFfx2: 0,
  ffxSource: 'none',
};

let wiring: Promise<ContentReport> | null = null;
let ffx2Options: Ffx2EngineOptions = {};

// ------------------------------------------------------------------ FFX side

async function loadFfxContent(): Promise<void> {
  const out: Harvest = { abilities: new Map(), items: new Map() };
  const seen = new Set<object>();
  let source: ContentReport['ffxSource'] = 'none';

  const indexLoader = Object.values(ffxIndexModule)[0];
  if (indexLoader) {
    try {
      harvest(await indexLoader(), out, seen);
      if (out.abilities.size) source = 'index';
    } catch (err) {
      console.warn('[content] src/data/ffx/index.ts failed to load; falling back', err);
    }
  }

  // No index yet, or it yielded nothing: read the tree directly.
  if (!out.abilities.size) {
    seen.clear();
    for (const [path, load] of Object.entries(ffxDataModules)) {
      try {
        harvest(await load(), out, seen);
      } catch (err) {
        console.warn(`[content] ${path} failed to load; skipping`, err);
      }
    }
    if (out.abilities.size) source = 'modules';
  }

  const abilities = [...out.abilities.values()].filter((a) => a.game === 'ffx');
  const items = [...out.items.values()].filter((i) => i.game === 'ffx');
  registerFFXAbilities(abilities);
  registerFFXItems(items);

  report = { ...report, abilitiesFfx: abilities.length, itemsFfx: items.length, ffxSource: source };
}

// ---------------------------------------------------------------- FFX-2 side

async function loadFfx2Content(): Promise<void> {
  // FFX-2's index is a finished contract, so this side is a plain import.
  const data = await import('../../data/ffx2/index.ts');
  const abilities = Object.values(data.ABILITIES);
  const items = Object.values(data.ITEMS);
  // Standard spheres only, as `adapters.ts` documents. A special dressphere is
  // not a `DataDressphere` — it has no flat command set or ability list, just
  // three independently-commanded parts — and the engine owns that swap in
  // `spherechange.ts` rather than resolving it through this registry.
  const dresspheres = Object.values(data.STANDARD_DRESSPHERES);

  ffx2Options = {
    abilities: abilityRegistryFrom(abilities),
    items: itemRegistryFrom(items),
    dresspheres: dressphereRegistryFrom(dresspheres),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
  };

  report = {
    ...report,
    abilitiesFfx2: abilities.length,
    itemsFfx2: items.length,
    dresspheresFfx2: dresspheres.length,
    garmentGridsFfx2: Object.keys(data.GARMENT_GRIDS).length,
  };
}

/**
 * Populate both engines' content. Idempotent — the first call does the work and
 * every later one awaits the same promise.
 */
export function registerBattleContent(): Promise<ContentReport> {
  if (wiring) return wiring;
  wiring = (async () => {
    await Promise.all([
      loadFfxContent().catch((err) => console.warn('[content] FFX content failed to wire', err)),
      loadFfx2Content().catch((err) => console.warn('[content] FFX-2 content failed to wire', err)),
    ]);
    return report;
  })();
  return wiring;
}

/** The registries `FFX2Engine` is constructed with. Empty before wiring. */
export function ffx2EngineOptions(): Ffx2EngineOptions {
  return ffx2Options;
}

/** What is registered right now, for `__pyrefly.wiring()`. */
export function contentReport(): ContentReport {
  return report;
}
