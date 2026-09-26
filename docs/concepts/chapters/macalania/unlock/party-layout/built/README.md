# Chapter VII party layout: every option built, the pick is one constant (repair cycle 1)

**Game case: FFX only** (AGENTS.md rule 14): Chapter VII's own staging under the FFX Ink & Gold
command stack. No FFX-2 scene or HUD, and no shared file, is touched.

**Status:** the pick is still Bailey's (open pick 3, `MACALANIA_OPEN_PICKS` 'party-layout'; AGENTS.md
rules 9 and 10). Nothing Bailey sees has changed: the scene still stands on today's layout.

## What changed

- `src/scenes/macalania-temple-layout.ts` holds the sheet's four options as staging data (current,
  A, B recommended, C; exactly `../layouts.json`), and `MACALANIA_PARTY_LAYOUT`, which stays
  `'current'` until Bailey picks.
- `src/scenes/macalania-temple.ts` reads its party slots 0 to 2 and its staging switches
  (`holdParty`; `enemySpots` for B) from the option in force, into both `MACALANIA_TEMPLE_SLOTS` and
  the build. The fiends' light pools follow a pinned spot.
- `tests/unit/chapters/macalania-party-layout.test.ts` pins the options to the sheet, that the scene
  stands on the option in force, that the constant is `'current'` exactly while the pick is open (it
  cannot land half-way), and that the chapter cannot be unlocked while the layout is `'current'`.

**Landing Bailey's pick:** set `MACALANIA_PARTY_LAYOUT` to the picked id, drop the 'party-layout' row
from `MACALANIA_OPEN_PICKS` (and its id from the ship test's list), record the decision. Nothing else.

## Proof, measured on the built scene (not staged in the page)

`prove.mjs` answers the layout module with the constant set to each option, in the page only
(Playwright route, the same one-line change the pick makes), on a private GPU Vite (:5700, HMR and
the watcher off), `gotoChapter` from a fresh load (no key on the title; the chapter is locked), real
Enter through the pre-battle dialogue and the first-time hint. `data-<option>.json` holds every
figure's place, the share of its head and torso (top 45%) under the command rows, the worst panel
over it and `visibilityInFrame()`. 16 runs, 0 console errors, 0 bad responses.

First menu, head and torso under the command rows / visibility in frame:

| | size | Tidus | Yuna | Rikku | Guardian A | Seymour | Guardian B |
|---|---|---|---|---|---|---|---|
| current | 1600x900 | **38% / 0.51** | **71% / 0.21** | 0% / 0.85 | 0.82 | 0.81 | 0.82 |
| current | 1280x720 | **45% / 0.45** | **65% / 0.27** | 0% / 0.86 | 0.82 | 0.84 | 0.82 |
| current | 2000x1012 | **43% / 0.47** | **70% / 0.23** | 0% / 0.94 | 0.78 | 0.81 | 0.82 |
| A | 1600x900 | 0% / 1.00 | 0% / 0.42 | 0% / 1.00 | 0.39 | 0.74 | 0.82 |
| **B** | 1600x900 | 0% / 1.00 | 0% / 0.64 | 0% / 0.95 | 0.57 | 0.44 | 0.87 |
| **B** | 1280x720 | 0% / 1.00 | 0% / 0.65 | 0% / 0.97 | 0.56 | 0.43 | 0.86 |
| **B** | 2000x1012 | 0% / 1.00 | 0% / 0.62 | 0% / 0.97 | 0.56 | 0.43 | 0.86 |
| C | 1600x900 | **31% / 0.59** | 0% / 1.00 | 0% / 0.52 | 0.41 | 0.81 | 0.83 |

B, whose figures are all held or pinned, reproduces the sheet's numbers within 0.01. The others move
a little from run to run, because their fiends (A, C) or their party (current) are not held: A's
Seymour 0.74 here against the sheet's 0.63, today's Tidus 38 to 45% against the sheet's 40 to 47%.
A and C at the other sizes are in the JSON. On the phone (390x844) no option has a party member under the rows; B keeps Seymour and
Guardian A whole in the frame (Guardian B 36% in view; current 0% for Seymour).

**The rest of the fight under B** (the sheet's "not measured before the pick"): two full wins with
real keys from the title, the lock flipped in the page only (`../../rehearsal/rehearse.mjs`, env
`MACALANIA_LAYOUT=b`), at 1600x900 and 390x844: Anima arrives, is dismissed, Seymour falls, results,
board and reload, 0 console errors, 0 bad responses. Act two (`b-act-two-1600x900.jpg` against
`current-act-two-1600x900.jpg`, the same moment on today's layout): the party 1.00 / 0.71 / 1.00
(today 0.43 / 0.19 / 0.57), Anima 0.82 (today 1.00), Seymour after his step back 0.41 (today 0.75):
under B he steps back to [1.1, 0, -8.3] and stands partly behind Anima's left side, face clear. At
his fall the body close-up (`b-seymour-down-1600x900.jpg`) shows the swapped-in Auron cut by the
bottom edge where today's layout shows him whole. These two are B's disclosed costs beyond the
sheet's; neither is a number from the game.
