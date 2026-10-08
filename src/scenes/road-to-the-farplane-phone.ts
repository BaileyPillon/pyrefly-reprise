import type { Object3D } from 'three';
import type { BattleCamera, CameraRig } from '../engine/BattleCamera.ts';
import { PHONE_BATTLE_QUERY } from '../ui/common/phoneBattle.ts';
import { findFigure } from './cavern-stolen-fayth-cast.ts';

// ---------------------------------------------------------------------------
// The Road to the Farplane on an upright phone: the idle camera per link (FFX-2 only)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Chapter XI's own framing; no
// other scene reads this module, and on a desktop (or any window the phone
// battle HUD does not take) it does nothing at all.
//
// On whose word: Bailey, 2026-09-26 ~13:00 EDT, "I'll go with all of your
// recommendations", answering PR-0201's options sheet
// (`docs/concepts/phone-2026-09-26/README.md`, `sheet-pr0201.jpg`): option A,
// "the phone camera pulls back per link so everyone stays whole; smaller
// fighters; desktop untouched".
//
// Why. The phone battle HUD (option B, Bailey 2026-09-25) shows a 390 px slice
// of the 16:9 render at the field's height and slides it toward the actor
// (`src/ui/common/phoneFraming.ts`). The Road's formation is about 1.4 slices
// wide, so no slide held everyone (round 13: Yuna gone in two links, Mindy
// half out). Option A dollies the phone's `idle` camera straight back, only
// as far as each link needs: Shiva and Anima at z 13.2 (about 72% of today's
// figure height), the three Sisters at z 15.5 (about 60%). The look point,
// the height, the fov and every other rig stay as they are; so do the
// formation, the painting and the slide. These are the values the option's
// frames were made with in the running renderer (the README, "How these were
// made"). Staging, not game data. (Anima's, since r3942-stage wave 2, is her own: see `ROAD_PHONE_IDLE_Z` and `ROAD_PHONE_ANIMA`.)
//
// How. The scene builds one of these when the battle HUD is the phone's; the
// loaded scene binds the battle camera (`SceneBuild.bindCamera`), and the
// scene's `update` asks which link is staged (the stage names each figure by
// its combatant id, as the Cloister's kill link finds Paragon) and replaces the
// camera's `idle` rig when the link changes. The latest link in chain order
// wins, so a fallen Shiva still fading out never holds the Sisters' framing,
// and a link with some Sisters already sent keeps its own.

/** The three links, in chain order. */
export type RoadLink = 'shiva' | 'sisters' | 'anima';
export const ROAD_LINK_ORDER: readonly RoadLink[] = ['shiva', 'sisters', 'anima'];

/**
 * How far back the phone's idle camera stands on each link (world z). Option A's frames for Shiva and the Sisters. **Anima's (r3942-stage wave 2, FFX-2 only, Bailey 2026-10-08,
 * "go with your recommendations", option 4 of the giants options sheet): she stands at 0.7 of her real height, 9.6 world units on the phone (`data/ffx2/fiend-stature.ts`), so
 * her camera stands at z 19.49 and looks up the figure ({@link ROAD_PHONE_ANIMA}); at 3.4 and z 13.2 she was the scene's boss height.**
 */
export const ROAD_PHONE_IDLE_Z: Readonly<Record<RoadLink, number>> = { shiva: 13.2, sisters: 15.5, anima: 19.49 };

/**
 * The rest of Anima's phone camera: where it stands (x, y) and what it looks at, solved with the options sheet's picture at 390x844 (option 4): the girls at the left (86 px), the
 * whole figure in the frame with her horns' tips under the intent strip's second line (its bottom at y 130 of the 520 px field; her top is at y 101). Lifting the picture 0.6 on its
 * pedestal to clear them was measured and does not hold: the menu clearance puts it back with a lens shift of 21 px (the girls' feet stand at y 473, the party plates at y 487), and the
 * girls only go 11 px lower.
 */
export const ROAD_PHONE_ANIMA = { x: -0.1, y: 2.35, lookAt: [0.19, 3.35, 9.55] } as const;

/** Which combatant ids field each link (the scene's `ROAD_IDS`, passed in to keep the import one-way). */
export type RoadLinkIds = Readonly<Record<RoadLink, readonly string[]>>;

/** The phone's idle rig for `link`: the desktop's, dollied straight back to that link's z (Anima's own: {@link ROAD_PHONE_ANIMA}). */
export function roadPhoneIdle(idle: CameraRig, link: RoadLink): CameraRig {
  if (link === 'anima') return { ...idle, position: [ROAD_PHONE_ANIMA.x, ROAD_PHONE_ANIMA.y, ROAD_PHONE_IDLE_Z.anima], lookAt: [...ROAD_PHONE_ANIMA.lookAt] };
  const p = idle.position;
  const [x, y] = Array.isArray(p) ? p : [p.x, p.y];
  return { ...idle, position: [x as number, y as number, ROAD_PHONE_IDLE_Z[link]] };
}

/** The latest link in chain order with a figure staged under `root`, or null when none is. */
export function roadLinkOf(root: Object3D | null, ids: RoadLinkIds): RoadLink | null {
  for (let i = ROAD_LINK_ORDER.length - 1; i >= 0; i--) {
    const link = ROAD_LINK_ORDER[i]!;
    if (ids[link].some((id) => findFigure(root, id) !== null)) return link;
  }
  return null;
}

/**
 * True when the phone battle HUD takes this window (its media query). Read once,
 * when the scene is built, as the Cloister reads its render aspect; false with no
 * window (a unit test, a worker).
 */
export function roadOnPhone(
  win: { matchMedia?: Window['matchMedia'] } | undefined = typeof window === 'undefined' ? undefined : window,
): boolean {
  return win?.matchMedia?.(PHONE_BATTLE_QUERY).matches === true;
}

/** The camera move when the link changes under an idle camera, ms. */
const RETARGET_MS = 600;

/** Keeps the battle camera's `idle` rig on the staged link's phone framing. */
export class RoadPhoneCamera {
  private camera: BattleCamera | null = null;
  private link: RoadLink | null = null;

  constructor(
    private readonly idle: CameraRig,
    private readonly ids: RoadLinkIds,
  ) {}

  /** The battle camera to drive, or null to let go of it. */
  bind(camera: BattleCamera | null): void {
    this.camera = camera;
    this.link = null;
  }

  /** The link whose framing the camera holds now (null before any is staged). */
  get current(): RoadLink | null {
    return this.link;
  }

  /** Call every frame with the three.js scene the stage parents its figures in. */
  update(root: Object3D | null): void {
    const cam = this.camera;
    if (!cam) return;
    const link = roadLinkOf(root, this.ids);
    if (!link || link === this.link) return;
    this.link = link;
    cam.addRig('idle', roadPhoneIdle(this.idle, link));
    if (cam.rigName === 'idle') void cam.moveTo('idle', RETARGET_MS, 'cubicInOut');
  }
}
