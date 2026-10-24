/**
 * THE REAL KNOCK-OUT AND VICTORY (conference demo, integration 2, 2026-10-22; `?curves=real` and `?curves=real-snappy`, `RealMotion.ts`). Pure: no `three`, no DOM, no clock. Every function answers
 * undefined (today's, or the house curves', numbers play) unless a real mode is on in a demo chapter and the real-motion table has the figure; the figure is named by its combatant id (the party's
 * ids are their art ids' stems in both chapters: `tidus`, `yuna`, `rikku`, `paine`; `RealMotion.realKeyOf` reads either).
 *
 * - **The fall** ({@link realFallMs}): how long the body takes to reach the floor, the real clip's floor impact (Tidus 1.0 s, Rikku 1.6 s, Bahamut 1.07 s); the house fall is 300 ms.
 * - **The buckle** ({@link realBuckleMs}): how long the standing figure buckles before the cross to the lying painting (`KoFall.fallRun`'s hold), the same impact less the cross.
 * - **The cheer** ({@link realCheerShape}): FFX's victory pose is a crouch and then a spring to its highest lift, at the real clip's pace (Tidus: a 0.37 s crouch, up by 1.1 s, lift 8 percent of his
 *   height); the painting is a still, so only the crouch, the spring and the landing are the body's. FFX-2's Chapter IV withholds the pose (`MomentsPlan.standDownShape`), so no FFX-2 row is read.
 *
 * Game cases (AGENTS.md rule 14): the chapter's game picks the table (FFX in Chapter I, FFX-2 in Chapter IV). The real modes' knock-out is read for both games; the cheer for FFX only.
 */
import { curvesGame, realKind } from './CurvesSwitch.ts';
import { CHEER_OPTIONS, swapAt, type CheerShape } from './MomentsPlan.ts';
import { realKoOf, realVictoryOf } from './RealMotion.ts';

/** The real floor impact of a figure's knock-out in a real mode, ms; undefined outside one or for a figure the table does not cover. */
export function realFallMs(name: string): number | undefined {
  return realKind() ? realKoOf(curvesGame(), name)?.floorImpactMs : undefined;
}

/** The real buckle (the hold before the cross to the lying painting), ms: the floor impact less the cross; undefined outside a real mode. */
export function realBuckleMs(name: string, crossMs: number): number | undefined {
  const impact = realFallMs(name);
  return impact === undefined ? undefined : Math.max(0, impact - Math.max(0, crossMs));
}

/** The longest and the shortest a real cheer's crouch may take as a share of the whole move (a real crouch is a tenth to a third of the rise). */
const ANTICIPATION_MIN = 0.1;
const ANTICIPATION_MAX = 0.4;

/** The real cheer of a FFX figure (the crouch, then the spring to its highest at the real lift), or undefined (the house cheer plays). */
export function realCheerShape(game: 'ffx' | 'ffx2', name: string): CheerShape | undefined {
  if (!realKind() || game !== 'ffx') return undefined;
  const v = realVictoryOf(game, name);
  if (!v || v.riseMs === undefined || v.liftMaxShare === undefined || !(v.riseMs > 0)) return undefined;
  const anticipation = Math.min(ANTICIPATION_MAX, Math.max(ANTICIPATION_MIN, (v.crouchMs ?? 0) / v.riseMs));
  const options = { ...CHEER_OPTIONS, anticipation };
  return { height: Math.max(0, v.liftMaxShare), ms: v.riseMs, swapU: swapAt(options), options };
}
