/**
 * **Every door word of the chapter board, in the order the table `CHAPTER_DOORS` (`src/app/screens/frontend/chapterDoors.ts`) holds them, with the game of its chapter.** One line per door, kept in ONE place so a new chapter's merge adds
 * one line here and edits no other test: `chapter-doors.test.ts` pins the table to this list, and the older door suites (`gagazet-door`, `summon-door`, `yojimbo-door`) read their neighbours from it.
 *
 * A word is Bailey's to pick and never changes. The comments name each hidden chapter's number and game (rule 14).
 * Game case: shared plumbing (both).
 */
export const DOORS_IN_ORDER: ReadonlyArray<readonly [word: string, game: 'ff7' | 'ffx' | 'ffx2']> = [
  ['limit', 'ff7'],
  ['leblanc', 'ffx2'],
  ['experiment', 'ffx2'],
  ['mushroom', 'ffx'],
  ['fayth', 'ffx'],
  ['daigoro', 'ffx2'],
  ['valefor', 'ffx2'],
  ['gagazet', 'ffx'],
  ['angra', 'ffx2'], // the Angra Mainyu lane's (hidden chapter 26), merged in release candidate r49-rc
  ['yojimbo', 'ffx'], // the Mirror Aeons chapter's (27)
  ['summon', 'ffx'], // The Last Summoning's (hidden chapter 28)
  ['keeper', 'ffx'], // the Spectral Keeper's (hidden chapter 29)
  ['infinito', 'ffx2'], // the Fallen Maesters' (hidden chapter 30)
  ['yrp', 'ffx2'], // the hidden 3D Bahamut's (chapter 31, 2026-11-02)
  ['waker', 'ffx2'], // the Wind Waker chapter's (hidden chapter 32, a placeholder word until 2026-11-02)
  ['gear', 'ffx2'], // the anime chapter's (hidden chapter 33, 2026-11-06)
  ['darkaeon', 'ffx'], // the Dark Aeons' (hidden chapter 34, 2026-11-06)
  ['judgment', 'ffx'], // the hidden Penance chapter's (chapter 35, 2026-11-06)
  ['geosgaeno', 'ffx'], // the hidden Flooded Ways' (chapter 36, 2026-11-06)
];

/** The words alone, in the table's order. */
export const DOOR_WORDS_IN_ORDER: readonly string[] = DOORS_IN_ORDER.map(([word]) => word);
