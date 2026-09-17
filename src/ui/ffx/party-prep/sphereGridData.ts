/**
 * The Sphere Grid **loader** the rest of the tab reads.
 *
 * `src/data/ffx/sphere-grid/` ships two JSON files and no TypeScript module
 * (there is no `src/data/ffx/sphere-grid.ts`), so everything the UI needs —
 * typing, indexing, adjacency, the node palette, the sphere-id and stat-field
 * mappings, and the per-character baseline routes — is assembled here rather
 * than by editing the data files, which belong to the data agents.
 *
 * Sources
 * -------
 * - `standard-grid.json` — 860 nodes / 881 links / 98 clusters with x/y
 *   layout, derived from Grayfox96's FFX Sphere Grid viewer (MIT; see the
 *   dataset's own README and LICENSE file).
 * - `standard-routes.json` — per-character `startNode`, `position`, `walk`,
 *   `visited`, `activated`, `unlocked` and `historicalActivationSpheres` for
 *   a coherent ordinary route. This is what turns the builds' placeholder
 *   `position: 'tidus-sphere-30'` strings into real node ids: without it the
 *   panel has nowhere to stand and nothing lit, which is exactly what the
 *   grey blob in `docs/screenshots/42b-sphere-grid.png` was.
 *
 * Palette: `research/visual-bible.md` §5.4 ("Node stat colours"), extended
 * with two colours the bible's table omits — Accuracy and Evasion. The older
 * revision of this tab reused Agility's and Defense's, which made four stats
 * indistinguishable; they get their own here so the legend actually reads.
 */

import type { StatBlock } from '../../../battle/common/types.ts';
import gridJson from '../../../data/ffx/sphere-grid/standard-grid.json';
import routesJson from '../../../data/ffx/sphere-grid/standard-routes.json';

// ---------------------------------------------------------------- the graph

export type NodeKind = 'empty' | 'lock' | 'ability' | 'stat';

/** One node of `standard-grid.json`, narrowed to the fields the UI uses. */
export interface GridNode {
  id: number;
  x: number;
  y: number;
  cluster: number;
  /** `"Strength +1"`, `"Lv. 2 Lock"`, `"Cheer"`, `"Empty Node"`. */
  name: string;
  /** `"STRENGTH"`, `"L_2_LOCK"`, `"WHITE_MAGIC"`, `"EMPTY_NODE"` — drives the palette. */
  appearance: string;
  kind: NodeKind;
  /** Sphere family needed to activate: `power` | `speed` | `mana` | `ability` | `fortune` | `key1`..`key4`. */
  sphere: string | null;
  lockLevel: number | null;
  /** `maxHp` | `maxMp` | `str` | `def` | `mag` | `mdef` | `agi` | `luck` | `accuracy` | `evasion`. */
  stat: string | null;
  value: number;
  links: number[];
}

interface GridJson {
  nodes: GridNode[];
  links: Array<{ a: number; b: number }>;
  counts: { nodes: number; links: number; clusters: number };
}

const GRID = gridJson as unknown as GridJson;

export const NODES: readonly GridNode[] = GRID.nodes;
export const LINKS: readonly { a: number; b: number }[] = GRID.links;

export const NODE_BY_ID: ReadonlyMap<number, GridNode> = new Map(NODES.map((n) => [n.id, n]));

/**
 * Undirected adjacency. `standard-grid.json` carries the same edge twice —
 * once in each node's `links` array and once in the top-level `links` list —
 * so both are folded in and de-duplicated rather than trusting either alone.
 */
export const NEIGHBOURS: ReadonlyMap<number, readonly number[]> = (() => {
  const map = new Map<number, Set<number>>();
  const add = (a: number, b: number): void => {
    if (a === b) return;
    let set = map.get(a);
    if (!set) map.set(a, (set = new Set()));
    set.add(b);
  };
  for (const node of NODES) for (const other of node.links) add(node.id, other);
  for (const link of LINKS) {
    add(link.a, link.b);
    add(link.b, link.a);
  }
  const out = new Map<number, readonly number[]>();
  for (const [id, set] of map) out.set(id, [...set].filter((n) => NODE_BY_ID.has(n)));
  return out;
})();

export function neighboursOf(id: number): readonly number[] {
  return NEIGHBOURS.get(id) ?? [];
}

/** Bounding box of the whole grid in its own layout units. */
export const BOUNDS = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of NODES) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
})();

// --------------------------------------------------------- baseline routes

/** One character's entry in `standard-routes.json`. */
export interface GridRoute {
  startNode: number;
  position: number;
  walk: number[];
  visited: number[];
  activated: number[];
  unlocked: number[];
  abilities: string[];
  historicalActivationSpheres: Record<string, number>;
  bankedSphereLevels: number;
}

interface RoutesJson {
  characters: Record<string, GridRoute>;
}

const ROUTES = (routesJson as unknown as RoutesJson).characters;

export function routeFor(characterId: string): GridRoute | null {
  return ROUTES[characterId] ?? null;
}

// ------------------------------------------------------------- the palette

/**
 * Fill colour per node appearance [visual-bible §5.4]. ACCURACY and EVASION
 * are this module's own additions — see the file header.
 */
const APPEARANCE_COLOR: Record<string, string> = {
  HP: '#7ee8b0',
  MP: '#8fd0f0',
  STRENGTH: '#f28a6a',
  DEFENSE: '#c8d4e4',
  MAGIC: '#b48fe0',
  MAGIC_DEFENSE: '#8fa4bc',
  AGILITY: '#f2d24a',
  LUCK: '#fff0a8',
  ACCURACY: '#ffcf7a',
  EVASION: '#9fe4d2',
  SPECIAL: '#f2c21e',
  SKILL: '#f2c21e',
  WHITE_MAGIC: '#e8f0ff',
  BLACK_MAGIC: '#c8a0ff',
  EMPTY_NODE: '#4e5a70',
};

/** Lv.1–4 locks, darkest for the deepest lock so the four read apart. */
const LOCK_COLOR: Record<number, string> = {
  1: '#e0585e',
  2: '#c7343c',
  3: '#9d2730',
  4: '#6f1b24',
};

export const GRID_INK = {
  /** Starfield ground [visual-bible §5.4]. */
  space: '#08101e',
  star: '#2e3a56',
  /** Unactivated node fill / ring. */
  dormantFill: '#141a28',
  dormantRing: '#4e5a70',
  travelledLink: '#f2c21e',
  untravelledLink: '#3a4456',
  reachableA: '#f2c21e',
  reachableB: '#fff0a8',
  paper: '#f4f1e8',
} as const;

export function nodeColor(node: GridNode): string {
  if (node.kind === 'lock') return LOCK_COLOR[node.lockLevel ?? 1] ?? LOCK_COLOR[1]!;
  return APPEARANCE_COLOR[node.appearance] ?? '#9fc4e8';
}

/** The legend, in the order the strip under the grid prints it. */
export const LEGEND: ReadonlyArray<{ label: string; color: string }> = [
  { label: 'HP', color: APPEARANCE_COLOR['HP']! },
  { label: 'MP', color: APPEARANCE_COLOR['MP']! },
  { label: 'STR', color: APPEARANCE_COLOR['STRENGTH']! },
  { label: 'DEF', color: APPEARANCE_COLOR['DEFENSE']! },
  { label: 'MAG', color: APPEARANCE_COLOR['MAGIC']! },
  { label: 'MDF', color: APPEARANCE_COLOR['MAGIC_DEFENSE']! },
  { label: 'AGI', color: APPEARANCE_COLOR['AGILITY']! },
  { label: 'LCK', color: APPEARANCE_COLOR['LUCK']! },
  { label: 'ACC', color: APPEARANCE_COLOR['ACCURACY']! },
  { label: 'EVA', color: APPEARANCE_COLOR['EVASION']! },
  { label: 'ABL', color: '#f2c21e' },
  { label: 'LOCK', color: LOCK_COLOR[2]! },
  { label: 'EMPTY', color: APPEARANCE_COLOR['EMPTY_NODE']! },
];

// ------------------------------------------------- spheres, stats, labels

/**
 * Grid sphere family -> the id it carries in `FFXPartyBuild.sphereInventory`
 * (`SphereGridState.spheres` uses the same ids, per its doc comment:
 * "`power-sphere`, `lv-1-key-sphere`, ...").
 */
const SPHERE_ITEM_ID: Record<string, string> = {
  power: 'power-sphere',
  speed: 'speed-sphere',
  mana: 'mana-sphere',
  ability: 'ability-sphere',
  fortune: 'fortune-sphere',
  key1: 'lv-1-key-sphere',
  key2: 'lv-2-key-sphere',
  key3: 'lv-3-key-sphere',
  key4: 'lv-4-key-sphere',
};

/** Display name per sphere family, for the pouch strip and the tooltip. */
const SPHERE_LABEL: Record<string, string> = {
  power: 'Power Sphere',
  speed: 'Speed Sphere',
  mana: 'Mana Sphere',
  ability: 'Ability Sphere',
  fortune: 'Fortune Sphere',
  key1: 'Lv.1 Key Sphere',
  key2: 'Lv.2 Key Sphere',
  key3: 'Lv.3 Key Sphere',
  key4: 'Lv.4 Key Sphere',
};

/** Short tag for the 20x20 pouch chips [visual-bible §5.4 "Sphere inventory"]. */
const SPHERE_TAG: Record<string, string> = {
  power: 'PWR',
  speed: 'SPD',
  mana: 'MNA',
  ability: 'ABL',
  fortune: 'FTN',
  key1: 'K1',
  key2: 'K2',
  key3: 'K3',
  key4: 'K4',
};

/** The pouch strip's fixed order — the ten families the grid can ask for. */
export const SPHERE_FAMILIES: readonly string[] = ['power', 'speed', 'mana', 'ability', 'fortune', 'key1', 'key2', 'key3', 'key4'];

export function sphereItemId(family: string | null): string | null {
  return family ? (SPHERE_ITEM_ID[family] ?? null) : null;
}
export function sphereLabel(family: string): string {
  return SPHERE_LABEL[family] ?? family;
}
export function sphereTag(family: string): string {
  return SPHERE_TAG[family] ?? family.slice(0, 3).toUpperCase();
}
/** The colour a sphere family's chip and its nodes share. */
export function sphereColor(family: string): string {
  if (family === 'power') return APPEARANCE_COLOR['STRENGTH']!;
  if (family === 'speed') return APPEARANCE_COLOR['AGILITY']!;
  if (family === 'mana') return APPEARANCE_COLOR['MAGIC']!;
  if (family === 'ability') return '#f2c21e';
  if (family === 'fortune') return APPEARANCE_COLOR['LUCK']!;
  const lvl = Number(family.slice(3));
  return LOCK_COLOR[lvl] ?? LOCK_COLOR[2]!;
}

/** Grid stat key -> the `StatBlock` field it adds to. */
const STAT_FIELD: Record<string, keyof StatBlock> = {
  maxHp: 'maxHp',
  maxMp: 'maxMp',
  str: 'str',
  def: 'def',
  mag: 'mag',
  mdef: 'mdef',
  agi: 'agi',
  luck: 'luck',
  accuracy: 'acc',
  evasion: 'eva',
};

export function statField(stat: string | null): keyof StatBlock | null {
  return stat ? (STAT_FIELD[stat] ?? null) : null;
}

const STAT_TAG: Record<string, string> = {
  maxHp: 'HP',
  maxMp: 'MP',
  str: 'STR',
  def: 'DEF',
  mag: 'MAG',
  mdef: 'MDF',
  agi: 'AGI',
  luck: 'LCK',
  accuracy: 'ACC',
  evasion: 'EVA',
};

/** `'agi'` -> `'AGI'`, for the tooltip and the node caption. */
export function statTag(stat: string | null): string {
  return stat ? (STAT_TAG[stat] ?? stat.toUpperCase()) : '';
}

/** The short caption drawn beside a node on the canvas. */
export function nodeLabel(node: GridNode): string {
  if (node.kind === 'stat' && node.stat) return `${STAT_TAG[node.stat] ?? node.stat}+${node.value}`;
  if (node.kind === 'ability') return node.name;
  if (node.kind === 'lock') return `Lv.${node.lockLevel ?? '?'}`;
  return '';
}

/** The sentence the tooltip and the caption line print. */
export function nodeEffect(node: GridNode): string {
  if (node.kind === 'stat' && node.stat) return `${node.name} — permanent +${node.value} ${STAT_TAG[node.stat] ?? node.stat}`;
  if (node.kind === 'ability') return `${node.name} — learns the ability`;
  if (node.kind === 'lock') return `Lv.${node.lockLevel ?? '?'} Lock — blocks the path until opened`;
  return 'Empty Node — nothing to activate; it only carries the path';
}

/** `"Power Sphere"`, or `null` for an empty node. */
export function nodeCostLabel(node: GridNode): string | null {
  return node.sphere ? sphereLabel(node.sphere) : null;
}
