import type { Texture } from 'three';
import type { GovernedPainting, GovernedStage } from './ArtMeasure.ts';

/**
 * The art governor's internal records and tuning constants (release 39, "r39-hires-engine"; both games, shared plumbing). Split out of `ArtGovernor.ts` to keep it under the
 * house line limit: `Entry` is what the governor holds per painting, `Need` one wanted load.
 */

export interface Entry {
  texture: Texture;
  painted: GovernedPainting['painted'];
  url: string;
  /** The master the texture holds now. */
  scale: number;
  /** What it was first seen holding, and the image to go back to. */
  baseScale: number;
  baseImage: unknown;
  /** GPU megabytes (with mips) once it has been drawn; 0 until then. */
  mb: number;
  lastSeen: number;
  px1x: number;
  /** The scale being loaded or waiting to be swapped in (0 = none). */
  loading: number;
  failed: Set<number>;
  /** The time (ms) the live camera first wanted a bigger master than it holds (-1 = it does not now). */
  needSince: number;
  /** The upload in progress for the master being loaded (release 39.1), and when it was asked for (ms). */
  staged: GovernedStage | null;
  askedAt: number;
  /** The painting left the field while a stage was running: the stage is cancelled, and that is not a failed load. */
  dropped: boolean;
  /** Uploaded ahead of its first draw and not drawn since: speculative GPU memory, counted against the warm cap (`ArtMemory.ts`). */
  warm: boolean;
  /** A warm-up of this painting was asked for once (success, failure or no room): it is not asked for again. */
  warmTried: boolean;
  /** Megabytes a speculative load in the air (a warm-up, a sibling's upgrade) will hold once resident: counted in the warm pool from the moment it is asked for. */
  pendingMB: number;
}

export interface Need {
  entry: Entry;
  want: number;
  /** 0 for a painting on screen (biggest magnification first), 1 for a sibling pose or a warm-up. */
  rank: number;
  px1x: number;
  /** Not an upgrade: upload the master the painting already holds, ahead of its first draw (release 39.1). */
  warm?: boolean;
}

/** How long (ms) a painting counts as "on screen" after it was last drawn, for eviction. */
export const SEEN_WINDOW_MS = 750;
export const MAX_LOADS = 2;
/** Release 39.1: one load more than `MAX_LOADS` may be in the air when it is for a figure on screen, so a live need never waits behind a warm-up or a sibling's upgrade. */
export const URGENT_EXTRA = 1;
/**
 * How long (ms) a live need must last before a master is fetched for it: a punch or a shake bounces a figure to twice its size for a
 * third of a second, and a download that lands after it is bytes for nothing. Time, not frames, so a 144 or 240 Hz screen waits as
 * long as a 60 Hz one. A planned view (`anticipate`) is not asked to wait.
 */
export const PERSIST_MS = 300;
/** How often (ms) the memory budget is checked besides after each swap. */
export const EVICT_EVERY_MS = 250;
/** A little over the measured number: the plane's yaw and the camera's sway only shrink it, but the measure is taken a frame late. */
export const SAFETY = 1.04;
