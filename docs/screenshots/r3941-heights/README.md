# The FFX heights fix, before and after (r3941-heights, FFX only)

One build, seed 1, the first command menu, the clocks frozen. **Before** is `?stature=off` (the old equal heights), **after** is the default (each hero at his datamined ratio to Tidus: Tidus 1.000, Yuna 0.911, Auron 1.062, Kimahri 1.211, Wakka 1.201, Lulu 0.990, Rikku 0.911). Handoff: `docs/handoff/r3941-heights.md`. The numbers and their source: `research/ffx-character-heights.md`.

| File | What |
|---|---|
| `before-after-sheet.jpg`, `before-after-sheet-phone.jpg` | the contact sheets: every FFX chapter, before and after, at 1600x900 and at 390x844, labelled with the chapter, the party and its ratios |
| `chNN-<chapter>-1600x900-before-after.jpg`, `chNN-<chapter>-390x844-before-after.jpg` | one pair per FFX chapter and size at full resolution, each hero tagged (Chapters II, VIII and IX between them show all seven heroes; Chapter XIV's Yuna is named by her scene and does not change) |
| `lineup-before-after.jpg` | the seven heroes in one row in the engine's own stage (Chapter I's room, the scene's own camera), all equal above, the table below, a dashed line at Tidus's top |
| `lineup-before-after-option.jpg` | the same, with a third panel: the option that puts Kimahri's body (not his spear tip) at 1.211, which is 1.304 in his table row. Not built |
| `ffx2-untouched.jpg` | FFX-2 (Bahamut, Vegnagun and Shuyin, Leblanc) with the stature off and on: the same world heights, shadows and rings |
| `findings/` | the crops behind the composition findings: Chapter I (Yuna and the scan card), Chapter IX on the phone (Kimahri under the Zanmato gauge), Chapter II (Auron under the advisor's card), and the Kimahri 1.304 option in Chapters I, IX and X (before, as built, option) |
| `head-check/` | the CHK-026 head check: the harness's table, its summaries and the strips of knock-out swaps with the stature on |
| `before-after-numbers.md`, `.txt`, `.json` | the measurements: every figure's height on screen, the head room under each panel, the overlaps, the framing's camera and boss size |
| `tools/` | the scripts that made all of it (Playwright from node, Pillow): `capture.mjs` for the frames, `analyze.mjs`, `tables.mjs`, `pairs.py`, `sheet.mjs`, `crop.py`, `lineup.mjs`, `lineup-compose.py`, `triple.py`, `ffx2-compare.py`, `harness-table2.mjs`; the how-to is in the handoff's "Reproduce" section |
