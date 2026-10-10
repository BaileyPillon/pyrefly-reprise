/**
 * The ids of the hidden Fayth chapter (FFX only; `../chapter-exp-fayth.ts`), in a module with no imports so that the door, the scene, the pyrefly canon and the chapter record can all name them
 * without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds; the door must not import the scene). The same shape as the
 * Sinspawn Gui chapter's (`./sinspawn-gui-ids.ts`).
 *
 * Game case: FFX only. The chapter is Chapter VIII's Evrae fight (`research/ffx-evrae-airship.md`) shown with FFX's own battle camera (D-632).
 */

/** The chapter's id: its key in the experiments' store and the id the board's door settles on. */
export const EXP_FAYTH_ID = 'exp-fayth' as const;

/** The chapter's scene key: the Fahrenheit's deck over Chapter VIII's plate, with a camera director on it (`../../scenes/exp-fayth-deck.ts`). */
export const EXP_FAYTH_SCENE = 'exp-fayth-deck' as const;
