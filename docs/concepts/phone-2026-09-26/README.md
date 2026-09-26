# Phone options round, 2026-09-26: PR-0201 and PR-0001

Two phone design issues from deep review round 13 (`critic/rounds/round-13.json`). The fix
agents stopped on both because each one needs a design choice (AGENTS.md rule 9). Nothing
in `src/` is built or changed here. Bailey picks, and only then does a build start.

- `sheet-pr0201.jpg`: Chapter XI framing on a phone (FFX-2 only)
- `sheet-pr0001.jpg`: Victory and Defeat results on a phone (both games)

## How these were made

- **Real frames.** Everything comes from the live build (release 19,
  https://baileypillon.github.io/pyrefly-reprise/). Settings: headless Chromium on the GPU
  (`PYREFLY_BROWSER=gpu`), 390 x 844 with touch emulation, device scale 2, seed 1, muted,
  and the chapter entered through `__pyrefly.gotoChapter`. No local server was started.
- **PR-0201 options.** A and B were made inside the running renderer:
  - A: the `idle` camera rig was dollied back from the console.
  - B: the fighters were moved to closer spots from the console.
  - For both, the ATB clock was held with the menu open, and the first-time coach card was hidden.
  - C: the same real frame with an HTML overlay for the edge tabs.
  - The "today" frames are round 13's own evidence (`20-link-2.png`, `20-link-3.png`).
- **PR-0001 options.** These are HTML mockups (`results-mock.html?v=A|B|C&o=victory|defeat`) rendered by
  Playwright at 390 x 844. They use the game's own fonts (`public/fonts`), our own art
  (`public/art/portraits/yuna-x2.png`, `characters/tidus/hurt.png`, the party portraits) and
  the strings from the two real results screens captured from the live build. A text sweep
  of every mockup finds no text node under 14 px, and every button is 58 px tall.
- Our own art only. Nothing was downloaded.

## PR-0201: Chapter XI frames Yuna and Mindy out of the picture (FFX-2 only)

**Game case.** FFX-2 only: Chapter XI's Road scene (`src/scenes/road-to-the-farplane.ts`).
Option C alone would touch the shared phone HUD, and that part would be "both" unless it
is limited to this chapter.

**Today.** The phone shows a 390 px slice of the 924 px, 16:9 render and slides it toward
whoever acts (`src/ui/common/phoneFraming.ts`, phone HUD option B).

- The Road's formation spans about 1.4 slices: party x -2.48 to -0.33, Sisters x 0.95 to 3.0.
- With three Sisters, no slide holds everyone.
- Round 13 saw Yuna gone in the Sisters and Anima links and Mindy half out.
- When Yuna herself acts, she is whole but Cindy and Mindy fall off (`pr0201-sisters-today-yuna-acting.jpg`).

| | Option | How it plays | Cost / trade |
|---|---|---|---|
| **A** (recommended) | **Pull back on the phone** | The phone's idle camera steps back only as far as each link needs: Shiva and Anima at about 72% of today's figure height (camera z 13.2), the Sisters at about 60% (z 15.5). Everyone is whole in every link, and nothing else moves. | Small. One phone camera per link, in the scene file only; desktop is unchanged. The fighters are smaller than approved frame B, the same kind of trade FOC16-05 flagged in the Cloister (about 50% there). Widening the field of view instead ran off the bottom of the painting, which is why A dollies the camera. |
| **B** | **Close ranks on the phone** | On a phone the girls stand about 1 m to the right and the foes about 1 m to the left and in. The camera and figure size are as today (97 to 100%). Everyone is whole. | Small. Phone-only spots, in the scene file only (staging, no game data). The figures crowd: Paine's sword crosses Sandy and Cindy is tucked behind. Phone and desktop fights stand differently. |
| **C** | **Party first, foes as edge tabs** | The frame always keeps the three girls whole at full size. Off-window foes get an ink edge tab with their name. Tapping the tab (or aiming) slides the field to that foe, as aiming already does. | Small to medium. A tab layer in the shared phone HUD. Fails CHK-011 as written at the command menu, so it needs Bailey's word to change the rule. |

**Recommendation: A.** It is the only option where every fighter is whole in every link
with nothing overlapping and desktop untouched. If the 60% Sisters link feels too small,
a hybrid is available: a little of B's closer spots for that link only, so it needs only
the 72% pull-back.

Frames: `pr0201-{shiva,sisters,anima}-{A,B,C}.jpg`, `pr0201-{sisters,anima}-today.jpg`.

## PR-0001: the phone Victory and Defeat results are a letterboxed miniature (both games)

**Game case.** Both. `src/app/screens/ResultsScreen.ts` is shared, and each game keeps its
own accent (FFX gold, FFX-2 pink; a defeat has no accent).

**Today.** The page is the 640 x 360 grid (`LetterboxStage.createStage`) scaled to 390 px:

- The card is about 390 x 220 in the middle of the screen.
- Member details come out at about 3 px and labels at about 4 px.
- CONFIRM and RETRY are about 12 px tall.
- Turning the phone does not fix it. At 844 x 390 the grid scales only to 1.08, so the
  smallest text is about 5 px (`pr0001-*-landscape-today.jpg`).

This issue is STALLED (open in rounds 12 and 13). These options are the method change
that RUBRIC section 8 asks for: a layout decision instead of another scaling fix.

| | Option | How it plays | Cost / trade |
|---|---|---|---|
| **A** | **Stacked page** | The painting is a slanted band on top, then the paper page: title, full ledger, every member row. It scrolls 36 to 97 px under a pinned CONFIRM / RETRY dock with a MORE BELOW cue. Same pattern as the approved prep card (PR-0127 A). | Medium. A phone branch of the results screen (DOM order and CSS); desktop keeps its stage. It scrolls, and the painting becomes a strip. |
| **B** (recommended) | **Full-bleed painting, ink sheet** | The victory portrait, or the dimmed fallen pose on a loss, fills the phone. The title sits over it, the spoils are four ink tallies, the party are chips (gain on a victory, S.LV on a loss), and CONFIRM / RETRY are pinned at the thumb. One screen. | Medium. The same phone branch, plus a face-safe crop per portrait (the wedge already has measured crops). The per-member dressphere / AP detail line is dropped on phone. |
| **C** | **Compact card, party folded** | A short painting band, the title and the four headline numbers large, and one PARTY ▾ row of faces that opens the member list. CONFIRM / RETRY are pinned. One screen. | The smallest change. The per-member gains hide behind a tap; this is the folding pattern Bailey passed over for the prep card. |

**Recommendation: B.** The results are a moment rather than a form, so the painting should
carry it ("faithful core, showpiece surface"). Every number stays readable at 14 px or more,
it fits one screen, and the buttons are thumb-size. Choose A if every member's detail line
must stay.

Frames: `pr0001-{victory,defeat}-{today,A,B,C}.jpg`, `pr0001-*-A-full.jpg` (A's whole
scrolled page), `pr0001-*-landscape-today.jpg`.

Numbers shown:

- The victory frames use round 13's real clear time, 12:36.
- The live capture of the same victory, played fast-forward, reads 0:18.
- The defeat (29 turns, RESULTS · 0:03) is a fast-forwarded automated loss in Chapter XII.

## What stays in every option

- The approved phone battle HUD B: the rail, gauges, intent line, party plates and commands.
- The Ink & Gold look: Cormorant italic titles, Chakra Petch tracked labels, Rajdhani
  numbers, skewed slabs, grain, one accent per context, and no gold on a defeat.
- Every game number, as the engine produced it.

## Board

Both issues are on `docs/target/targets.json`, group "Phone layout, 390 × 844", as
`verdict` tiles ("Needs your verdict"), with the sheets as their pictures.
