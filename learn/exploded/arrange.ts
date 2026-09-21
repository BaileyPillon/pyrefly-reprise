/**
 * Stage placement for site C (`docs/plans/learning-sites.md` "C · exploded/"):
 * where a piece sits at `explode` 0 (`home`) and around `explode` 0.6
 * (`burst`) — `learn/shared/layout.ts` interpolates the rest.
 *
 * The stage box is 1000 x 560 units, centred on the origin. The six on-screen
 * layers stack along z in the frame's own order — `home` puts every one of
 * them at z 0 (the finished, assembled frame); `burst` spreads them from
 * -240 to +240, back (backdrop) to front (HUD), matching the depth order in
 * `docs/concepts/atlas/c-scene-exploded/build.mjs`'s verified frames. The
 * three non-visual layers are rails beneath the stage box — they never
 * animate with the explode, because they were never part of the picture.
 *
 * An asset tile "sits at its layer" (its home and burst are its layer's, per
 * the brief): `tileBurst` adds a small deterministic fan-out, from the
 * tile's own id, so many tiles sharing one layer are not exactly coincident
 * before `pack.ts` gives each one a real inventory slot near `explode` 1.
 */

import type { Vec3 } from '../shared/model.ts';
import { LAYER_SYSTEMS } from './layers.ts';

export const STAGE_BOX = { width: 1000, height: 560 } as const;

/** Back to front — index 0 is furthest from the camera, matching `LAYERS`' own order 1-6. */
const ON_SCREEN_ORDER = [
  'backdrop-painting',
  'light-atmosphere',
  'boss-billboard',
  'party-billboards',
  'effects',
  'hud-ink-gold',
] as const;

const NON_VISUAL_ORDER = ['battle-engine', 'presenter', 'music-sound'] as const;

// Every system above must be one of LAYER_SYSTEMS' ids, and vice versa — a
// mismatch here would silently drop a layer from the stage.
const declaredIds = new Set(LAYER_SYSTEMS.map((system) => system.id));
const placedIds = new Set<string>([...ON_SCREEN_ORDER, ...NON_VISUAL_ORDER]);
if (declaredIds.size !== placedIds.size || [...declaredIds].some((id) => !placedIds.has(id))) {
  throw new Error('arrange.ts: ON_SCREEN_ORDER + NON_VISUAL_ORDER must name exactly LAYER_SYSTEMS’ ids');
}

const BURST_SPAN = 240;
const RAIL_Y = STAGE_BOX.height / 2 + 40;
const RAIL_GAP = 72;

function onScreenIndex(systemId: string): number | undefined {
  const index = ON_SCREEN_ORDER.indexOf(systemId as (typeof ON_SCREEN_ORDER)[number]);
  return index === -1 ? undefined : index;
}

function nonVisualIndex(systemId: string): number | undefined {
  const index = NON_VISUAL_ORDER.indexOf(systemId as (typeof NON_VISUAL_ORDER)[number]);
  return index === -1 ? undefined : index;
}

/** A layer's resting position: on screen, the assembled frame (z 0); a rail, its fixed spot beneath it. */
export function layerHome(systemId: string): Vec3 {
  if (onScreenIndex(systemId) !== undefined) return { x: 0, y: 0, z: 0 };
  return layerBurst(systemId);
}

/** A layer's pulled-apart position: on screen, spread -240..+240 in z; a rail does not move. */
export function layerBurst(systemId: string): Vec3 {
  const onScreen = onScreenIndex(systemId);
  if (onScreen !== undefined) {
    const step = (BURST_SPAN * 2) / (ON_SCREEN_ORDER.length - 1);
    return { x: 0, y: 0, z: Math.round(-BURST_SPAN + step * onScreen) };
  }

  const rail = nonVisualIndex(systemId);
  if (rail !== undefined) {
    return { x: 0, y: Math.round(RAIL_Y + rail * RAIL_GAP), z: 0 };
  }

  return { x: 0, y: 0, z: 0 };
}

/** FNV-1a, for a small deterministic fan-out — not a security hash, just a stable scatter. */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const GOLDEN_ANGLE_RADIANS = 2.399963229728653;

/** An asset tile's resting position: its layer's own (the brief: "asset tiles sit at their layer"). */
export function tileHome(systemId: string): Vec3 {
  return layerHome(systemId);
}

/** An asset tile's pulled-apart position: its layer's, fanned out by a small offset from `tileId`. */
export function tileBurst(systemId: string, tileId: string): Vec3 {
  const base = layerBurst(systemId);
  const seed = hashString(tileId);
  const angle = seed * GOLDEN_ANGLE_RADIANS;
  const radius = 6 * Math.sqrt((seed % 400) + 1);

  if (onScreenIndex(systemId) !== undefined) {
    return { x: base.x + Math.cos(angle) * radius, y: base.y + Math.sin(angle) * radius, z: base.z };
  }

  // Rails read as a horizontal strip beneath the stage, so tiles fan out along x only.
  return { x: base.x + Math.cos(angle) * radius * 4, y: base.y, z: base.z };
}
