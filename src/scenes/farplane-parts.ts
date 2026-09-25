/**
 * Vegnagun's staging at the Farplane (FFX-2 only, Chapter 5): the figure-less
 * parts' anchors and the body's own standing spot. Split out of `farplane.ts`
 * so that file does not grow (house rule 7). None of these numbers is game
 * data; they are staging, measured against the camera.
 */

import type { PartAnchors } from '../engine/PartAnchors.ts';

/**
 * Vegnagun's figure-less parts (FFX-2 only, Chapter 5). Bailey picked Bulwark
 * C*, Redoubt C* and Node C on 2026-09-24 (D-044): no painting of their own,
 * so no hooded-cone placeholder (PR-0095). Plan and pixel sources:
 * `docs/plans/vegnagun-parts-wiring.md` §3-§4; `src/engine/PartAnchors.ts`.
 *
 * - **Bulwarks**: ground rings on the body painting's own feet
 *   (`vegnagun-body/idle.png`, 1213x827, baselineY 811, contentTop 7). Right
 *   is the near foreleg's foot at (160, 811), Left the far leg's at (1110, 811);
 *   both aim the cursor at the chest point (170, 560).
 * - **Redoubts**: upright rings on the head painting (`vegnagun-head/idle.png`,
 *   1216x832, baselineY 830, contentTop 0): Right on the tusk at (330, 510),
 *   Left on the jaw at (560, 680). The Left one is a guess; the painting shows
 *   one tusk.
 * - **Nodes**: research §2 says only "Nodes hang far overhead". The offsets from
 *   the leg's feet are staging, not game data (research open issue 14 calls the
 *   §4.3 geometry unsourced): y 9 / 10.5 / 9 from §4.3.2's own design, dx and dz
 *   chosen here. All three project above the top edge at every rig; the HUD's
 *   edge markers (`src/ui/ffx2`) are what show them.
 *
 * Right and Left are told apart by combatant id, as `vegnagun-body.ts` and
 * `vegnagun-head.ts` name them, never by slot.
 */
const BODY_PAINT = { width: 1213, height: 827, baselineY: 811, contentTop: 7 } as const;
const HEAD_PAINT = { width: 1216, height: 832, baselineY: 830, contentTop: 0 } as const;

export const FARPLANE_PART_ANCHORS: PartAnchors = {
  'bulwark-r': { mode: 'onParent', px: [160, 811], chestPx: [170, 560], paint: BODY_PAINT, ring: { radius: 0.55, ground: true } },
  'bulwark-l': { mode: 'onParent', px: [1110, 811], chestPx: [1110, 560], paint: BODY_PAINT, ring: { radius: 0.55, ground: true } },
  'redoubt-r': { mode: 'onParent', px: [330, 510], paint: HEAD_PAINT, ring: { radius: 0.42, ground: false } },
  'redoubt-l': { mode: 'onParent', px: [560, 680], paint: HEAD_PAINT, ring: { radius: 0.36, ground: false } },
  'node-a': { mode: 'overhead', offset: [2.0, 9.0, -1.5] },
  'node-b': { mode: 'overhead', offset: [3.0, 10.5, 0.0] },
  'node-c': { mode: 'overhead', offset: [2.0, 9.0, 1.5] },
};

/**
 * Where Vegnagun's **body** is drawn at link 3 (combatant id `vegnagun-body`).
 *
 * With its Bulwarks figure-less (D-044) the body is the only figure the
 * formation holds, so it fell to `ENEMY_SLOTS[0]`, which is solved for the
 * tail: at 1600x900 (GPU, seed 1, first menu) it ran x 479..1124, right behind
 * Rikku and Paine, and the Right Bulwark's ring and bracket landed on the
 * party. A pinned figure is never slid (`layProneFigures`), so the spot is
 * where the painting is drawn.
 *
 * Bailey picked option C of `docs/concepts/layout/ch5-vegnagun-staging/` on
 * 2026-09-25 ("I'll go with all your recommendations"): 4.35 left of live's
 * frame (76f587c3, drawn centred on x ~7.15) and 2 deeper, so the Left
 * Bulwark's ring and name plate, which ride the far leg's foot, stand clear of
 * the FFX-2 command window instead of under it (measured at 1600x900 in the
 * option sheet: ring x 1073-1153 against the window's 1246; the Body about 8%
 * smaller than live's). Staging, not game data.
 */
export const FARPLANE_ENEMY_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  'vegnagun-body': [2.8, 0, -12.0],
};

/** What `buildFarplaneScene` publishes onto its `SceneBuild` (`SceneStaging`). */
export const FARPLANE_STAGING = { partAnchors: FARPLANE_PART_ANCHORS, enemySpots: FARPLANE_ENEMY_SPOTS } as const;
