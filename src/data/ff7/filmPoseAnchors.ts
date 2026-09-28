/**
 * Where each Film party pose stands, so every painted key registers on the idle's stance (FF7 only).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Read by the FF7 staging (`src/scenes/sector1-reactor-staging.ts`,
 * `poseShiftPx`); no FFX or FFX-2 art has an entry.
 *
 * Why: the Film installer (`docs/concepts/ff7-art-2026-09-27/film-set/scripts/install.py`) centred each plane on
 * its candidate's `anchorX`, which is the stance's middle on the idle but the rear foot on Barret's aim and fire,
 * so a swap from idle to aim jumped his body about 120 px right at 1600x900 (the phase-3 judge's repair item 1).
 * The locked PNGs stay as installed; the stage shifts each plane by these amounts instead.
 *
 * Measured by `docs/concepts/ff7-art-2026-09-27/film-set/scripts/anchors.py` on the installed files: the stance
 * centre is the mean of the two boots' sole centres, and each shift (in that painting's own pixels, + = right)
 * puts it where the idle's is, divided by the pose's `scale`. Barret's fire is an edit of his aim, so it registers
 * on the aim by the best overlap of the legs (the swap between the two does not step). Checked by
 * `tests/unit/ff7-judge-repair.test.ts` against the PNGs when the art is on disk.
 *
 * Not game data: measurements of our own paintings [estimate: measured by anchors.py; where each member stands is
 * the staging's, research/ff7-battle-staging.md §5 (the rows), with the sides switched by Bailey's D-262].
 */

/** Per art id, per pose (the sidecar's state), the shift in the painting's own pixels. */
export const FF7_FILM_POSE_SHIFT_PX: Readonly<Record<string, Readonly<Record<string, number>>>> = Object.freeze({
  'ff7-film-cloud': Object.freeze({ idle: 0, windup: -46, attack: 219, follow: 72, victory: 2, spin: -48, back: -52, hurt: -26 }),
  'ff7-film-barret': Object.freeze({ idle: 0, aim: -213, attack: -203, victory: -7, punch: 10, hurt: 6 }),
});

/**
 * Barret's gun muzzle in his aim and fire paintings, as fractions of the painting's opaque box (x from its left,
 * y from its top): the rightmost opaque column of the upper half (anchors.py). The shot's muzzle flash and Big
 * Shot's orb start there (`src/engine/spellfx/ff7/effects-ff7-party.ts`).
 */
export const FF7_FILM_MUZZLE: Readonly<Record<'aim' | 'attack', readonly [number, number]>> = Object.freeze({
  aim: [1.0, 0.272],
  attack: [1.0, 0.271],
});
