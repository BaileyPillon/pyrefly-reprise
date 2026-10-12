# r43-textfloor proof frames (PR-0356, PR-0391)

Branch `r43-textfloor` (from origin/main `5a4c92b1`, live `a061e9dc`), 2026-10-12. Every frame is a JPEG from headless GPU Chromium (`PYREFLY_BROWSER=gpu`), a fresh
browser per window size and screen, seed 1, a fresh profile (so the first-run guide and the Sphere Grid's first-time card are on screen, as they are for a new player),
reached by real keys and pointer clicks; Chapter I, IV, IX and XII battles through `gotoChapter`. `before/` is a `git archive` export of origin/main served on its own port,
`after/` is this branch; both were measured with the same probe (`tools/text-floor-probe.mjs`: font-size times every ancestor's scale), so a number is comparable across the two.

Names: `<screen>-<window>-<step>.jpg`. Screens: `prep-ffx` (Chapter I party prep), `prep-ffx2` (Chapter IV), `results-ffx`, `battle-ch9` (Yojimbo's gauge, first menu),
`battle-ch12` (Omnis's disc strip, first menu), `battle-ch1-sensor` (the Sensor card opened with I: the six affinity chips), `pause-ffx`, `board` (chapter select, 390x844),
`prep-ffx-first` and `prep-ffx2-first` (the opening tab on a phone).

What to look at:

- `prep-ffx-*-tab2-stats`: the hint strip (`PARTY . TABS . ENTER BEGINS THE BATTLE . ESC BACK`), the roster-slot roles (WARRIOR, SUMMONER, STOIC) and the first-run guide's "ESC SKIP THE GUIDE":
  12.2 and 12 px before, 14.1 and 14 after. `prep-ffx-*-tab3-sphere-grid-card-closed`: the M and H key chips (11.7 px before).
- `results-ffx-*-results`: the member sub-lines ("S.LV 39 . 1,231/1,386 AP") and the NEW BEST and +N S.Lv tags (12.2 to 13.3 px before).
- `battle-ch9-*-first-menu`: "DAIGORO", "+ KOZUKA", "+ WAKIZASHI" under the gauge (12.2 px at 1600x900 before). `battle-ch12-*-first-menu`: the disc strip, ABSORBS, WEAK, ENEMY INTENT and
  COLOUR ORDER: OUR ESTIMATE (12 and 13 px before).
- `battle-ch1-sensor-3840x2160-sensor-open` and `-2560x1440-`: the six chips on one row printing over each other before, two rows of three after.
- `pause-ffx-3840x2160-tab1-Tidus`, `pause-ffx-3440x1440-tab1-Tidus` (after only): the pause at the sizes where the plate is capped at 1.25x. The painting is not magnified or softened (D-450); the
  window is filled by the blurred extension (`.pause__art--extended::before`, 4070x2290 at 3840x2160). `critic/CHECKS.md` CHK-002 names the case.
- `*-390x844-*`: the phone is unchanged (the floor is off under 1280x720); the first-run guide on the board and the prep opening tab read 14 px on a phone now (10 to 13.5 px before).

## Numbers

Smallest text on the screen and the most elements under 14 px in any one step, before -> after; "new overprint / cut" is text boxes that overprint or text cut by its own box that the
baseline step did not have.

| screen | window | steps | smallest text before -> after (px) | elements under 14 px, worst step before -> after | new overprint / cut |
|---|---|---|---|---|---|
| battle-ch1-sensor | 2560x1440 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 1280x720 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 1600x900 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 2000x1012 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch1-sensor | 3840x2160 | 2 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch12 | 1024x768 | 1 | 7.68 -> 7.68 | 18 -> 15 | 0 / 0 |
| battle-ch12 | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch12 | 1280x720 | 1 | 9.6 -> 14 | 14 -> 0 | 0 / 0 |
| battle-ch12 | 1600x900 | 1 | 12 -> 14 | 5 -> 0 | 0 / 0 |
| battle-ch12 | 2000x1012 | 1 | 13.49 -> 14 | 1 -> 0 | 0 / 0 |
| battle-ch12 | 3840x2160 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch9 | 1024x768 | 1 | 7.82 -> 7.82 | 5 -> 4 | 0 / 0 |
| battle-ch9 | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| battle-ch9 | 1280x720 | 1 | 9.78 -> 14 | 5 -> 0 | 0 / 0 |
| battle-ch9 | 1600x900 | 1 | 12.22 -> 14 | 3 -> 0 | 0 / 0 |
| battle-ch9 | 2000x1012 | 1 | 13.74 -> 14 | 3 -> 0 | 0 / 0 |
| battle-ch9 | 3840x2160 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| board | 390x844 | 1 | 10 -> 14 | 4 -> 0 | 2 / 0 |
| pause-ffx | 390x844 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 1280x720 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 1600x900 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 2000x1012 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| pause-ffx | 3840x2160 | 8 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 1024x768 | 5 | 7.82 -> 7.82 | 88 -> 85 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 1280x720 | 5 | 9.78 -> 14 | 43 -> 0 | 6 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 1600x900 | 5 | 12 -> 14 | 15 -> 0 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 2000x1012 | 5 | 12 -> 14 | 13 -> 0 | 0 / 0 |
| prep-ffx (all tabs but Sphere Grid) | 3840x2160 | 5 | 12 -> 14 | 3 -> 0 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 1024x768 | 2 | 7.49 -> 7.49 | 98 -> 95 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 1280x720 | 2 | 9.36 -> 9.36 | 81 -> 70 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 1600x900 | 2 | 11.7 -> 14 | 31 -> 0 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 2000x1012 | 2 | 12 -> 14 | 14 -> 0 | 0 / 0 |
| prep-ffx (Sphere Grid tab) | 3840x2160 | 2 | 12 -> 14 | 3 -> 0 | 0 / 0 |
| prep-ffx-first | 390x844 | 1 | 10 -> 14 | 4 -> 0 | 0 / 0 |
| prep-ffx2 | 1280x720 | 5 | 9.78 -> 14 | 55 -> 0 | 6 / 0 |
| prep-ffx2 | 1600x900 | 5 | 12 -> 14 | 15 -> 0 | 0 / 0 |
| prep-ffx2 | 2000x1012 | 5 | 12 -> 14 | 13 -> 0 | 0 / 0 |
| prep-ffx2 | 3840x2160 | 5 | 12 -> 14 | 3 -> 0 | 0 / 0 |
| prep-ffx2-first | 390x844 | 1 | 10 -> 14 | 4 -> 0 | 0 / 0 |
| results-ffx | 1024x768 | 1 | 7.82 -> 7.82 | 18 -> 18 | 0 / 0 |
| results-ffx | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| results-ffx | 1280x720 | 1 | 9.78 -> 14.1 | 17 -> 0 | 0 / 0 |
| results-ffx | 1600x900 | 1 | 12.23 -> 14.1 | 6 -> 0 | 0 / 0 |
| results-ffx | 2000x1012 | 1 | 13.75 -> 14.1 | 3 -> 0 | 0 / 0 |
| results-ffx | 3840x2160 | 1 | 29.34 -> 29.34 | 0 -> 0 | 0 / 0 |
| results-ffx2 | 390x844 | 1 | 14 -> 14 | 0 -> 0 | 0 / 0 |
| results-ffx2 | 1280x720 | 1 | 9.78 -> 14.1 | 17 -> 0 | 0 / 0 |
| results-ffx2 | 1600x900 | 1 | 12.23 -> 14.1 | 4 -> 0 | 0 / 0 |
| results-ffx2 | 2000x1012 | 1 | 13.75 -> 14.1 | 3 -> 0 | 1 / 0 |
| results-ffx2 | 3840x2160 | 1 | 29.34 -> 29.34 | 0 -> 0 | 0 / 0 |

The 1024x768 rows are the control: the floor is off below a 1280x720 window by design, so the prep, results and Chapter IX and XII sizes are the authored ones there; the 3 fewer elements
under 14 px on prep and 1 and 3 fewer on Chapters IX and XII are the first-run guide's fixed-px text (14 px now) and the strategy guide's document head, whose floor is not gated.
The "6 new overprint" on the 1280x720 prep rows is the CHAPTER tab's hint wrapping "SCROLL" to a second line (the probe reports the two-line run's union box). The Sphere Grid tab of `prep-ffx` reads 14 px from 1600x900
(its legend and card were drawn on that frame); between 1280x720 and 1599x899 it keeps its authored sizes, which is why `prep-ffx` at 1280x720 still lists elements under 14 px.

Two more windows were swept on this branch only (no frames kept; the counts are in `inbetween-1366x768-1440x900.json`): 1366x768 and 1440x900, the common laptop sizes between the verified ones. Every swept screen reads 0
elements under 14 px at both (prep tabs of both games except the Sphere Grid, results, Chapter IX, Chapter XII); the Sphere Grid tab, whose floor starts at 1600x900, reads 47 (smallest 9.98 px) and 40
(10.53 px) elements under 14 px there, as disclosed in `docs/handoff/r43-textfloor.md`.
