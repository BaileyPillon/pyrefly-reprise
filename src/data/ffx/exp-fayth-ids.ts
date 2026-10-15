/**
 * The ids of the hidden Fayth chapter (FFX only; `../chapter-exp-fayth.ts`), in a module with no imports so that the door, the scene, the pyrefly canon and the chapter record can all name them
 * without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds; the door must not import the scene). The same shape as the
 * Sinspawn Gui chapter's (`./sinspawn-gui-ids.ts`).
 *
 * Game case: FFX only. The chapter is Chapter VIII's Evrae fight (`research/ffx-evrae-airship.md`) shown with FFX's own battle camera (D-632).
 */

/** The chapter's id: its key in the experiments' store and the id the board's door settles on. */
export const EXP_FAYTH_ID = 'exp-fayth' as const;

/** The chapter's scene key: the Fahrenheit's deck over Chapter VIII's plate, with a camera director on it (`../../scenes/exp-fayth-deck.ts`). It names the scene, not a file: there is no `backdrops/exp-fayth-deck.png`. */
export const EXP_FAYTH_SCENE = 'exp-fayth-deck' as const;

/**
 * The painting the chapter stands in front of: Chapter VIII's deck plate (`public/art/backdrops/evrae-airship-deck.png`), **by reference** (FOC46-04). Every lookup that builds a backdrop path from a chapter's scene key
 * (the party prep's wash, the pre-battle scene's backdrop, the battle preload, the battle-start card) goes through `plateKeyOfScene` (`../art/scenePlate.ts`), which answers this for {@link EXP_FAYTH_SCENE}; no art
 * is copied or made. The stem is the deck scene's own plate (`EVRAE_DECK_PLATE`) and Chapter VIII's `sceneKey`: `tests/unit/chapters/exp-fayth-plate.test.ts` pins all three.
 */
export const EXP_FAYTH_PLATE = 'evrae-airship-deck' as const;
