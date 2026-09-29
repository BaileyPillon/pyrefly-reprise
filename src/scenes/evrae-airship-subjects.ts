/**
 * **Who the Fahrenheit's range director stages at NEAR and FAR, and how big (FFX only).**
 *
 * Game case: FFX only [AGENTS.md rule 14]: the airship range is Chapter VIII's and Chapter XVII's (Evrae, then
 * Sin's two Fins), and nothing here is read by an FFX-2 chapter. Pure data plus two flag readers: no `three`, no
 * DOM, so the director, the tests and a preview all read one table.
 *
 * **Evrae** keeps exactly what it had: NEAR at the stage's boss height, FAR at the head-ratio width
 * (`farWorldWidth`), and the Inhale telegraph (`breath-charge`) at NEAR only, read from `airship.breathCharged`.
 *
 * **The Fins** are the driver's picks (D-279, delegated by Bailey; Fin A, each arm painted on its own:
 * `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md`). Each is placed where its picked painting has it:
 * the sidecar's `frameFraction` (the sprite's box in its 2352x1344 frame) and `baselineY` give the ground point,
 * which is cast from that range's `idle` rig onto Evrae's depth for the range (NEAR z -4.7, FAR z -30), and the
 * world height is the frame's height at that depth times `baselineY / 1344` (INSTALL.md "Scale and anchor" did
 * the same at Evrae's own spot). The spots and heights below were solved with three's camera maths on
 * RANGE_STAGING, **derived, not measured in the engine**, then looked at in the browser. So the NEAR arm rises
 * from behind the rail with its cut edge off the right of the frame, and the FAR body is Sin's own, colossal even
 * at range, level as painted: a Fin is **upright** (its wide FAR painting is never laid to rest as a prone body
 * would be). While `sin.fin.charged` holds ("Core gathers energy."), the idle slot shows the painting with the
 * core lit, at either range (the Fin's own telegraph, research §9.3). A state the art manifest does not list is
 * never asked for, so a Fin whose files are not installed keeps the stage's silhouette at Evrae's sizes.
 */

import { SIN_FIN_CHARGED, SIN_LEFT_FIN_ID, SIN_RIGHT_FIN_ID } from '../battle/ffx/ai/sin-ids.ts';
import {
  breathChargedOf,
  EVRAE_WORLD_HEIGHT,
  farWorldWidth,
  RANGE_STAGING,
  type AirshipFlags,
  type AirshipRange,
} from './evrae-airship-range.ts';

type Spot = readonly [number, number, number];

export interface RangeSubject {
  /** The folder under `public/art/characters/`. */
  readonly artId: string;
  /** The actor-group scale at NEAR (1 = the stage's boss height, `EVRAE_WORLD_HEIGHT`). */
  readonly nearScale: number;
  /** Where the subject stands at each range (its ground point). */
  readonly spot: Readonly<Record<AirshipRange, Spot>>;
  /** True for a subject whose wide paintings are never laid to rest as a prone body (the Fins). */
  readonly upright: boolean;
  /** The FAR painting's drawn width in world units. */
  readonly farWidth: number;
  /** The telegraph flag: while it holds, the idle slot shows `charge[range]` when there is one. */
  readonly chargedOf: (state: AirshipFlags | null | undefined) => boolean;
  /** The telegraph painting per range, or absent where the subject has none. */
  readonly charge: Partial<Readonly<Record<AirshipRange, string>>>;
  /**
   * True when a state must be listed in the art manifest before it is loaded. Evrae's `breath-charge` was
   * loaded on a missing manifest too (its original rule); the Fins are strict.
   */
  readonly strict: boolean;
}

/** The Fin's telegraph: "Core gathers energy." until Gravija lands or whiffs (`sin-fins-rules.ts`). */
export function finChargedOf(state: AirshipFlags | null | undefined): boolean {
  return state?.flags?.[SIN_FIN_CHARGED] === true;
}

/** One range of one Fin: its ground point, its world height, and the painting's pixels (width, baseline row). */
interface FinRange {
  readonly spot: Spot;
  readonly height: number;
  readonly widthPx: number;
  readonly baselinePx: number;
}

/** One Fin's numbers, solved from its sidecars (see the header); the FAR width follows from its pixels. */
function fin(artId: string, near: FinRange, far: FinRange): RangeSubject {
  return {
    artId,
    nearScale: near.height / EVRAE_WORLD_HEIGHT,
    farWidth: (far.height * far.widthPx) / far.baselinePx,
    spot: { near: near.spot, far: far.spot },
    upright: true,
    chargedOf: finChargedOf,
    charge: { near: 'charge-near', far: 'charge-far' },
    strict: true,
  };
}

/** The Left Fin (link I): NEAR 1030x1036 (baseline 1019), bleeds right; FAR 1654x590 (baseline 573). */
export const LEFT_FIN_SUBJECT = fin(
  'sin-left-fin',
  { spot: [5.57, -0.94, -4.7], height: 6.79, widthPx: 1030, baselinePx: 1019 },
  { spot: [6.99, -1.59, -30], height: 12.03, widthPx: 1654, baselinePx: 573 },
);
/** The Right Fin (link II): NEAR 982x947 (baseline 930), bleeds top and right; FAR 1166x532 (baseline 515), bleeds right. */
export const RIGHT_FIN_SUBJECT = fin(
  'sin-right-fin',
  { spot: [5.75, 0.19, -4.7], height: 6.21, widthPx: 982, baselinePx: 930 },
  { spot: [13.64, 1.09, -30], height: 10.83, widthPx: 1166, baselinePx: 515 },
);

/** Evrae, as it has always been staged (Chapter VIII). */
export function evraeSubject(artId = 'evrae', worldHeight = EVRAE_WORLD_HEIGHT): RangeSubject {
  return {
    artId,
    nearScale: 1,
    farWidth: farWorldWidth(worldHeight),
    spot: { near: RANGE_STAGING.near.evrae, far: RANGE_STAGING.far.evrae },
    upright: false,
    chargedOf: breathChargedOf,
    charge: { near: 'breath-charge' },
    strict: false,
  };
}

/** The subject for a combatant id the director binds; anything else is staged as Evrae is. */
export function rangeSubjectFor(foeId: string | undefined, artId = 'evrae', worldHeight = EVRAE_WORLD_HEIGHT): RangeSubject {
  if (foeId === SIN_LEFT_FIN_ID) return LEFT_FIN_SUBJECT;
  if (foeId === SIN_RIGHT_FIN_ID) return RIGHT_FIN_SUBJECT;
  return evraeSubject(artId, worldHeight);
}
