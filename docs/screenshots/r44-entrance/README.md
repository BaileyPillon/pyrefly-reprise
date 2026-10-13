# r44-entrance: before and after strips of the three entrances round 25 named, and one clip of Paragon

Branch `r44-entrance` (off `origin/r43-rc` 7b2582e7), 2026-10-13. Game case: both (shared plumbing); the three bosses are Overdrive Sin (FFX, Chapter XVIII), Paragon (FFX-2, Chapter XIII) and
Anima (FFX-2, Chapter XI, link 3, at the Save Sphere's seam). Handoff: [docs/handoff/r44-entrance.md](../../handoff/r44-entrance.md).

All frames are the game's own WebGL canvas, 1600 by 900, recorded in headless Chromium on the GPU (`PYREFLY_BROWSER=gpu`) at 60 fps, seed 1, with the first-link opening as a player gets it.
The HTML (the battle-start card, the Save Sphere's wash, the HUD) is not on the canvas, so these strips show what the continuity probe sees, which is where PR-0380 was found; a player sees the
same canvas under the card or the wash and then the opening.

| | before: the live site, https://echoesofspira.com (build a061e9dc, bundle index-Chs9J3OY) | after: this branch (dev server, built on r43-rc 7b2582e7) |
|---|---|---|
| Overdrive Sin | [sin-before.jpg](sin-before.jpg): 8 consecutive frames at 60 fps. The small boss stands far off for 1.7 s, then in ONE frame (+0 ms) the head is placed (scale 3.471, 14.23 units high, depth -30). | [sin-after.jpg](sin-after.jpg): 8 frames across the 883 ms gather, the last one whole. Held (nothing on the canvas) through the same placement, then pyreflies gather and the head comes up from the top behind the burn edge. |
| Paragon | [paragon-before.jpg](paragon-before.jpg): 8 consecutive frames. A small Paragon (-50, -33 ms), then in ONE frame (-17 ms) CHAPTER FRAMING's plan makes him 3.047 times as big; the camera follows a frame later. | [paragon-after.jpg](paragon-after.jpg): 8 frames across the 900 ms gather. Held through the plan, then the golden armour is built head first with the pyreflies streaming in. [paragon-entrance.mp4](paragon-entrance.mp4) is the same moment in motion (2.7 s, 1280 by 720, 60 fps, 0.7 MB). |
| Anima | [anima-before.jpg](anima-before.jpg): 8 consecutive frames. A small Anima behind the party (-50 to -17 ms), then in ONE frame (+0 ms) the plan makes her 2.824 times as big (under the Save Sphere's wash, which is not on the canvas). | [anima-after.jpg](anima-after.jpg): 8 frames across the 883 ms gather. Held through the card, the plan lands unseen about 0.6 s after the swap, and she gathers at her final size as the card ends. |

How they were made (scratch scripts, not committed: `D:/Tools/pyrefly-scratch/r44/` and `tools/zz-r44-capture.tmp.mjs`): the debug API plays the chapter (`gotoChapter`, seed 1; the seam run plays the intended
auto strategy at FAST speed to the second Save Sphere card and at NORMAL speed from it), an in-page `MediaRecorder` records the canvas while a per-frame log reads every stage figure's alpha, dissolve, scale,
place and the entrance snapshot. The live Sin run was slowed (700 ms of latency on every request after boot) so its placement, which a fast build does within the first frames, falls inside the recording. The video is
aligned to the log by the opening's camera cut (after) and by the frame the figure's size jumps (before, found by the region's frame-to-frame change and checked by eye). The after strips of Sin and Paragon were made with
the final tuning; Anima's too.

The numbers behind them (the real `PaintedActor`, the continuity harness's own `figureTrack` and `detectJerks`, `tests/unit/engine/entrance-jerk.test.ts`) and the browser's first-menu timing are in the handoff note.
