import type { Clear } from './clearance.ts';
import type { ColossusPin } from './colossusPin.ts';
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
  /**
   * The chapter's slots now in force (`stageTable.ts`: the chapter and each side's move in world x and z, and the move of each fiend a row names
   * by its combatant id: `by`), or null (today's own slots).
   */
  stand: { chapter: string; party: [number, number]; enemy: [number, number]; by?: [string, number, number][]; follow?: true } | null;
  /** The table's pinned colossus master when the plan plays it (`colossusPin.ts`: the one answer and where the Sensor card stands), else null. */
  pin: ColossusPin | null;
  /** The tallest enemy's box in the chosen pose (CSS px): how big the boss draws. */
  bossPx: number;
  /** How long the last plan took on the main thread (ms): the prototype of option N took about 2 s, the table well under 100. */
  planMs: number;
  /** Each candidate the last plan tried (checks only). */
  tries: string[];
}
