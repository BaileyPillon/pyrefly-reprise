import type { PlateLayout } from '../DepthPlates.ts';
import type { LampSpec } from '../Lamps.ts';
import type { QuadFieldSpec } from '../QuadField.ts';
import type { HazeSpec } from '../Haze.ts';
import type { ShadowSpec } from '../Figures.ts';
import type { ReflectSpec } from '../FloorReflection.ts';
import type { FocusSpec } from '../PlateFocus.ts';

/**
 * Option B "Living Paintings": one room's recipe. Every number here is staging (ours), tuned by
 * eye on the captures; what may exist in a room follows `engine/pyreflyCanon.ts` and the research
 * (no pyreflies are added anywhere by option B).
 */
export interface RoomSpec {
  key: string;
  game: 'ffx' | 'ffx2';
  /** Depth plates: desktop, and the phone tier (fewer, smaller). */
  plates: PlateLayout;
  phonePlates: PlateLayout;
  lamps: LampSpec;
  /** Particle fields in world space: `near` ones draw over the figures. */
  fields: QuadFieldSpec[];
  haze: HazeSpec[];
  shadow: ShadowSpec;
  /** A-7 plate defocus: which plate is in focus and the cap on the blur (defaults: the nearest upright plate, `FOCUS_MAX_BIAS`). */
  focus?: FocusSpec;
  /** Floor reflection; the patch defaults to the room's own lit ground when there is one. */
  reflect?: Omit<ReflectSpec, 'center' | 'size'> & Partial<Pick<ReflectSpec, 'center' | 'size'>>;
  /** Electric arcs anchored on painting pixels (u right, v down), each on its own plate. */
  arcs?: { at: Array<[number, number]>; reach: number; width: number; color: number; every: number; offset?: [number, number, number] };
  /** Distant lightning: every `every` seconds (min, max), the plates flash toward `tint` by `peak`. */
  lightning?: { every: [number, number]; tint: [number, number, number]; peak: number };
  /** Dust in a lamp's light: painting pixel (u, v), the box size, and the field. */
  lampDust?: Array<{ at: [number, number]; box: [number, number, number]; field: Omit<QuadFieldSpec, 'min' | 'size'> }>;
}

/** Plate render slots: plate k draws at -90 + 3k, its lamps at +1, and a haze sheet can take +2. */
export const between = (plate: number): number => -90 + plate * 3 + 2;
/** Over the lit ground, under the figures. */
export const OVER_GROUND = -45;
/** Over the figures (near weather). */
export const NEAR = 40;
