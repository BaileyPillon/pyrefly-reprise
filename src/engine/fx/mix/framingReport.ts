import type { Clear } from './clearance.ts';
import type { MasterClass } from './masters.ts';

/** What the MAX mix's CHAPTER FRAMING reports (`__pyrefly.fx.mix.snapshot().framing`; captures and checks). Moved out of `framing.ts` (the 400-line rule). */
export interface FramingReport {
  cls: MasterClass;
  colossus: boolean;
  /**
   * Does this fight get the colossus master and BOSS SCALE where the window allows it (a colossus boss that is not Vegnagun
   * or Sin)? Known from the first decision whatever the switches say; the EYE CANDY page reads it to say whether a phone
   * held upright costs CHAPTER FRAMING anything here. Null until the first decision.
   */
  colossusFight: boolean | null;
  plans: number;
  replans: number;
  todayPx: number;
  floorPx: number;
  scale: number;
  fit: { ok: boolean; partyPx: number; overlap: number; bossCover: number; blend: number; back: number; lens: [number, number]; figs: Clear['figs']; gate: number; down: Clear['down'] } | null;
  /** The plate the frame shows (share of the frame missing the painting; 0 = all painting): the chosen pose and today's rig; null with no plate. */
  plate: { chosen: number; today: number; corners: number; todayCorners: number; restGap: number } | null;
  live: { ok: boolean; partyPx: number; overlap: number; bossCover: number; figs: Clear['figs']; down: Clear['down'] } | null;
  staging: Record<string, { k: number; dx: number; sx?: number; sz?: number }>;
  /** The opt-restage prototype's solve (`restage.ts`, `?stage=`); absent with the flag off. */
  restage?: { move: string; goal: string; t: number; note: string; evals: { t: number; gap: number; clean: boolean; colossus: boolean; why?: string }[]; ms: number };
  /** Option N (`sensorPlace.ts`): where the Sensor card is steered to (viewport px), or null when it stays at its pinned place. */
  sensorTo?: { l: number; r: number; t: number; b: number } | null;
  /** Each candidate the last plan tried (checks only). */
  tries: string[];
}
