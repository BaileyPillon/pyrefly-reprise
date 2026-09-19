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
 * Both data layers publish a finished index (`src/data/ffx/index.ts`,
 * `src/data/ffx2/index.ts`), so this is plain imports. It started as a module
 * harvester written while the FFX index did not exist yet.
 */

import { registerFFXAbilities, registerFFXItems, registerFFXMixRecipes } from '../../battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS, MIX_RECIPES } from '../../data/ffx/index.ts';
import * as data from '../../data/ffx2/index.ts';
import {
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
  type Ffx2EngineOptions,
} from '../../battle/ffx2/index.ts';

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
  ffxSource: 'index' | 'none';
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
  const abilities = ALL_ABILITIES.filter((a) => a.game === 'ffx');
  const items = Object.values(ITEMS).filter((i) => i.game === 'ffx');
  registerFFXAbilities(abilities);
  registerFFXItems(items);
  // Rikku's Mix table [ffx-combat-core §5.9]. `MIX_RECIPES` shipped with the
  // data layer and had no reader anywhere, so `MixResult.resultAbilityId` was
  // `null` on every path and Mix — her Overdrive in all three FFX builds —
  // spent a full gauge and produced no event at all. This is the same
  // data-to-engine join the two lines above make [registry.ts addMixRecipes].
  registerFFXMixRecipes(MIX_RECIPES);
  report = { ...report, abilitiesFfx: abilities.length, itemsFfx: items.length, ffxSource: 'index' };
}

// ---------------------------------------------------------------- FFX-2 side

async function loadFfx2Content(): Promise<void> {
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
