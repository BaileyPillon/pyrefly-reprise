/**
 * Adapters from the FFX-2 **data** shapes to the engine's registries.
 *
 * `src/battle/**` must not import `src/data/**` (`docs/ARCHITECTURE.md`,
 * "Layering rule"), and the data agent's `DressphereDef` / `GarmentGridDef` are
 * explicitly "not a shared contract — internal to `src/data/ffx2/**`". So every
 * parameter here is **structurally typed**: the app wires the two together at
 * boot and neither folder imports the other.
 *
 * ```ts
 * import { FFX2_ABILITIES } from './data/ffx2/abilities/index.ts';
 * import { STANDARD_DRESSPHERES } from './data/ffx2/dresspheres/index.ts';
 * import { GARMENT_GRIDS } from './data/ffx2/garment-grids/index.ts';
 *
 * const engine = new FFX2Engine({
 *   abilities: abilityRegistryFrom(FFX2_ABILITIES),
 *   dresspheres: dressphereRegistryFrom(STANDARD_DRESSPHERES, statsFn),
 *   garmentGrids: garmentGridRegistryFrom(GARMENT_GRIDS),
 * });
 * ```
 *
 * Anything a registry does not know still falls back to this folder's own
 * research-cited baseline, so a half-transcribed data file degrades gracefully.
 */

import type { AbilityDef, GateColour, ItemDef, StatBlock } from '../common/types.ts';
import type {
  AbilityRegistry,
  DressphereDef,
  DressphereRegistry,
  DressphereStats,
  GarmentGridDef,
  GarmentGridRegistry,
  GateBonus,
  ItemRegistry,
} from './internal.ts';
import { dressphereStats } from './dressphere-stats.ts';

/** A list or an id-keyed record — data files ship both shapes. */
type Collection<T> = readonly T[] | Readonly<Record<string, T>>;

function toArray<T>(source: Collection<T>): T[] {
  return Array.isArray(source) ? [...source] : Object.values(source as Record<string, T>);
}

/** Wrap an ability table. Ids the table lacks fall through to the baseline. */
export function abilityRegistryFrom(source: Collection<AbilityDef>): AbilityRegistry {
  const byId = new Map(toArray(source).map((a) => [a.id, a]));
  return { get: (id) => byId.get(id) };
}

/** Wrap an item table. `ItemDef.effect` is an `AbilityId` (CONTRACT-CHANGES §7). */
export function itemRegistryFrom(source: Collection<ItemDef>): ItemRegistry {
  const byId = new Map(toArray(source).map((i) => [i.id, i]));
  return { get: (id) => byId.get(id) };
}

/** The data agent's dressphere shape, duck-typed. */
export interface DataDressphere {
  id: string;
  name: string;
  /** Top-level command set. The three spheres with no Attack simply omit it. */
  commands?: readonly string[];
  longRange?: boolean;
  abilities?: ReadonlyArray<{ abilityId: string }>;
}

/**
 * Wrap a dressphere table.
 *
 * `hasAttack` is read off the command set, because Songstress, White Mage and
 * Black Mage genuinely have **no Attack command** [ffx2-combat-core §3.4–3.6]
 * and the menu must not offer them one. The Thief's twice-striking Attack
 * (§3.2) is applied by id, since it is a property of the sphere rather than of
 * the ability record.
 */
export function dressphereRegistryFrom(
  source: Collection<DataDressphere>,
  stats: DressphereStats = dressphereStats,
): DressphereRegistry {
  const byId = new Map<string, DressphereDef>();
  for (const def of toArray(source)) {
    if (!def) continue;
    const commands = def.commands ?? [];
    byId.set(def.id, {
      id: def.id,
      name: def.name,
      abilityIds: (def.abilities ?? []).map((a) => a.abilityId),
      hasAttack: commands.length === 0 || commands.some((c) => c.toLowerCase() === 'attack'),
      longRange: def.longRange ?? false,
      attackHits: def.id === 'thief' ? 2 : 1,
    });
  }
  return { get: (id) => byId.get(id), stats };
}

/** The data agent's Garment Grid shape, duck-typed. */
export interface DataGarmentGrid {
  id: string;
  /** 2–6. */
  nodeCount: number;
  /** Which gate colours exist on this Grid, 0–4. */
  gateColours?: readonly GateColour[];
  equip?: DataGridEffect;
  gateEffects?: ReadonlyArray<{ gates: readonly GateColour[]; effect: DataGridEffect }>;
}

export interface DataGridEffect {
  description?: string;
  statBonus?: Partial<Record<'str' | 'mag' | 'def' | 'mdef', number>>;
  /** §4.1 stacking quirk: pays once per gate passed, not once total. */
  perGatePassed?: boolean;
  grantsAbilityIds?: readonly string[];
  autoAbilityTags?: readonly string[];
}

/** Recognised "<skillset> wait down" tags are worth -40% CT. §1.3 */
const WAIT_DOWN_PERCENT = 40;

function toBonus(gates: readonly GateColour[], effect: DataGridEffect): GateBonus {
  const stats: Partial<StatBlock> = {};
  for (const [key, value] of Object.entries(effect.statBonus ?? {})) {
    if (typeof value === 'number') stats[key as keyof StatBlock] = value;
  }
  const tags = effect.autoAbilityTags ?? [];
  const waitDown = tags.some((t) => t.includes('wait-down') || t.includes('wait down'));
  const bdl = tags.some((t) => t.includes('break-damage-limit'));

  return {
    gates: [...gates],
    ...(Object.keys(stats).length > 0 ? { stats } : {}),
    ...(effect.grantsAbilityIds?.length ? { abilities: [...effect.grantsAbilityIds] } : {}),
    ...(waitDown ? { waitDownPercent: WAIT_DOWN_PERCENT } : {}),
    ...(bdl ? { breaksDamageLimit: true } : {}),
    ...(effect.perGatePassed ? { perGate: true } : {}),
    ...(effect.description ? { label: effect.description } : {}),
  };
}

/**
 * Wrap a Garment Grid table.
 *
 * The data shape publishes a node count and a gate *set*, not a link topology —
 * which is all the source publishes too — so the links are laid out as a ring
 * with one gate per successive link. Adjacency ("one link away") and gate
 * accumulation, the two things the rules key off, come out right; only the
 * exact route is an `[estimate]`. See `garment-grids.ts` for the same note.
 */
export function garmentGridRegistryFrom(source: Collection<DataGarmentGrid>): GarmentGridRegistry {
  const byId = new Map<string, GarmentGridDef>();
  for (const grid of toArray(source)) {
    if (!grid) continue;
    const nodes = Math.max(2, Math.min(6, grid.nodeCount));
    const gates = grid.gateColours ?? [];
    const links: GarmentGridDef['links'] = [];
    for (let i = 0; i < nodes; i++) {
      if (nodes === 2 && i === 1) break;
      const gate = gates[i];
      links.push({ from: i, to: (i + 1) % nodes, gates: gate ? [gate] : [] });
    }
    const bonuses: GateBonus[] = [];
    if (grid.equip) bonuses.push(toBonus([], grid.equip));
    for (const entry of grid.gateEffects ?? []) bonuses.push(toBonus(entry.gates, entry.effect));
    byId.set(grid.id, { id: grid.id, nodes, links, bonuses });
  }
  return { get: (id) => byId.get(id) };
}
