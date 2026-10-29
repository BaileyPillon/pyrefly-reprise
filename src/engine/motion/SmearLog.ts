/**
 * THE PLANNED-SMEAR LOG (conference demo, motion pass, lane "core", step 2; pure: no `three`, no DOM; both games).
 *
 * Every cut the engine plans as a smear is written here, once, when the pose blend that carries it begins: who, from which painting to which, in which style, how long the window is and when
 * (`performance.now()` of the page). The continuity harness reads it back (`window.__pyrefly.smearLog()`, `critic/runner/lib/continuity-smear.mjs`) and excuses a fast swap in CHK-027 ONLY when it
 * matches an entry here: same figure, same pair of paintings, the swap inside the window. Bailey, 2026-10-22: "Yes, only planned smears." Every other fast swap stays a jerk.
 *
 * `kind` says what was smeared: `plane` (a painting set's cross-fade replaced by a cut) or `rig` (a rig's variant flip, which a smear covers).
 */
import { CUT_AT } from './SmearPlan.ts';

export interface PlannedSmear {
  /** `performance.now()` (ms) when the window began: the first frame of the pose blend. */
  at: number;
  /** The figure (the combatant id the stage knows it by). */
  actor: string;
  /** The painting (or rig key) going out and the one coming in. */
  from: string;
  to: string;
  style: 'paint' | 'blur';
  /** The window's length, ms. */
  cutMs: number;
  /** A rig only: the length of the key move the window sits in (the flip, and so the cut, is at half of it, and the harness sees the change of key when the move BEGINS, at `at`). */
  moveMs?: number;
  /** The pair's outline overlap and head distance (a share of the figure's height) the plan was made from; null where unknown. */
  overlap: number | null;
  anchorDistance: number | null;
  /** The figure's speed (body heights a second) and the smear's strength (0 to 1). */
  speed: number;
  strength: number;
  /** Did the cut carry the light flash? */
  flash: boolean;
  /** The engine KNOWS this pair is a big change though it could not read an outline for it (a standing body and the lying one of a knock-out: a plane laid on the floor has no footprint): the harness's `loggedAsBig` reads it. */
  big?: boolean;
  /** MF-06: the class of swap that asked for this cut on its cause (`SwapSwitch.SwapClass`); absent for a cut the speed gate planned. */
  cause?: string;
  /** MF-18 (`CutAnchor.ts`): the cut was anchored: the incoming plane was drawn back by `share` of the figure's height (so the step at the cut is the cap) and eased home over `ms`. Absent when the step was under the cap or `?cutanchor` is today. */
  glide?: { share: number; ms: number };
  kind: 'plane' | 'rig';
  /** When the cut itself falls (`at` plus the window's cut point, or half the move of a rig), ms. */
  cutAt: number;
}

const CAP = 4000; // a ten-minute fight plans about 400 cuts (Yunalesca): the harness reads the whole log at the end, so a short one drops the first cuts and reads them as snaps
const log: PlannedSmear[] = [];

/** Write one planned smear (the cut's own time is filled in). */
export function noteSmear(rec: Omit<PlannedSmear, 'cutAt'>): PlannedSmear {
  const full: PlannedSmear = { ...rec, cutAt: rec.at + (rec.moveMs ?? rec.cutMs) * CUT_AT };
  if (log.length >= CAP) log.shift();
  log.push(full);
  return full;
}

/** The planned smears, oldest first (a copy); `reset` empties the log. */
export function smearLog(reset = false): PlannedSmear[] {
  const out = log.slice();
  if (reset) log.length = 0;
  return out;
}

/** Tests: empty the log. */
export function resetSmearLog(): void {
  log.length = 0;
}
