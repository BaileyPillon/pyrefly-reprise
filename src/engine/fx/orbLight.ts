/**
 * Demo looks (dev flag only): the item orbs that exist, so the look layer can light the figures near the one that is on screen (`engine/look/relight/`). Nothing here
 * runs unless something reads it; both games (FFX's green orb and the foe's, FFX-2's white-blue spark).
 */
import type { ItemTone, P3 } from './ItemOrbFx.ts';

export interface OrbLightSource {
  /** Where the orb is now (world), or null when it is at rest. */
  readonly orbAt: P3;
  readonly active: boolean;
  /** Its colours and how strongly it is lit, 0..1. */
  readonly lightNow: { tone: ItemTone | 'spark'; k: number };
}

export const orbLights = new Set<OrbLightSource>();
