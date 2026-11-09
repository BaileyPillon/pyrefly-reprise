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
  ['drillshot', 'ffx2'], // the hidden Bevelle Guardians' (chapter 37, 2026-11-06)
  ['duelist', 'ffx2'], // the hidden Farplane Cup's (chapter 38, 2026-11-06)
  ['beast', 'ffx'], // the hidden Sanctuary Keeper's (chapter 39, 2026-11-06)
  ['wraith', 'ffx2'], // the hidden Yuna's Ballad's (chapter 40, 2026-11-06)
  ['shinryu', 'ffx'], // the hidden Shinryu's (chapter 48, 2026-11-07)
];

/** The words alone, in the table's order. */
export const DOOR_WORDS_IN_ORDER: readonly string[] = DOORS_IN_ORDER.map(([word]) => word);

/**
 * The allowance of a door suite's pair test ("the first word to finish wins when two are typed in a row"): it mounts three real boards for every other door, so it grows with the number of doors. Now 30 s a door (it was 15),
 * 180 s at the least (it was 315 s at twenty-one doors; **raised to 30 s a door on 2026-11-08, 750 s at twenty-five: in a loaded full run of the Shinryu lane `valefor-door`'s pair test took 559.8 s against 360 s at 24 doors, 193 s alone; the review of that lane and its handoff section 4 (b) called a flat 30 s a door the right allowance, and the cost still grows with every door the next wave adds**). Measured at twenty-one doors: 15 to 28 s a suite when three door suites run together, but 180 to 250 s a suite when all twelve run together on three workers (jsdom mounts
 * fight for the CPU), and 193 s for the pair test of one suite in the one full-suite run (3,125 s on three workers, the long benches running beside it): the old 180 s allowance of fifteen doors was not enough. A hang still fails, later.
 */
export const DOOR_PAIR_TEST_TIMEOUT_MS = Math.max(180_000, DOORS_IN_ORDER.length * 30_000);

/**
 * The allowance of a door suite's LOOP test (one that mounts a real board for every door: "a wrong letter resets", "each word opens its own chapter and nothing else", the phone-tier suites' "every other door opens"): it grows with the
 * number of doors too, because each board is a jsdom mount. 10 s a door, 120 s at the least (210 s at twenty-one doors); a test that mounts two boards for every door (both tiers) takes twice this. The vitest default (15 s then, 60 s
 * now: `vitest.config.ts`) is a flat number and the cost is linear in the doors, so the loops carry their own: 15 s was enough for fifteen doors on a quiet machine and not for twenty-one on a loaded one. In the one full run with
 * the CPU at about 96 percent from other work, `yojimbo-door` took 32.6 s, `r74-hidden-3d-phone-doors` 25.6 s and `gagazet-door` 19.6 s for one such test each (7 s alone), and `maesters-door` came within a second of its 15 s.
 * A hang still fails, later.
 */
export const DOOR_LOOP_TEST_TIMEOUT_MS = Math.max(120_000, DOORS_IN_ORDER.length * 10_000);
