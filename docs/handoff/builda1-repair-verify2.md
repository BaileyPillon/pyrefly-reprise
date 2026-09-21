# Build A.1 repair — adversarial verification

The first pass's findings are `docs/handoff/builda1-repair-verify.json` (verdicts:
PR-0004 / PR-0023 / PR-0024 confirmed, PR-0003 partial, PR-0009 not fixed).

## Round 04 repair, second pass (2026-09-20)

**Verdict: both refuted repairs now hold. Nothing else changed hands.**
No product code was edited in this pass; only the scratch rigs under
`critic/scratch/builda1-repair/` were added to.

Tree: `main` at `ee49fc3` (guide) over `82e924a` (results).
`npx tsc --noEmit` clean (exit 0). ONE full `npx vitest run`: **162 files,
4290/4290 green**, 29.4 s — up from the 4279 baseline by the two repair commits'
own new cases. Browser mode **gpu** for every run (`PYREFLY_BROWSER=gpu`,
`tools/browser-mode.mjs`); no black canvas, no fallback needed. Dev server
`npx vite --port 5196`, shut down afterwards by its listening PID (not
`taskkill /IM node.exe`). `dist/` untouched, nothing built, nothing deployed,
`D:/pyrefly-release` never touched.

### PR-0009 — CONFIRMED FIXED (major, both games)

Re-ran my own rig `b4-final.mjs` unchanged, real keyboard input through
`critic/rounds/round-04/r4-flow.mjs`, glyph line boxes read with one `Range` per
text node (never a block-container rect): FFX Chapter 1 at 1600x900 and
2000x1012, FFX-2 Chapter 4 at 1600x900 and 2000x1012, FFX Chapter 3 at 1280x720.
**Zero sliced lines and zero MORE-chip / glyph intersections at all five.** The
chip's `top` now equals the slab's `bottom` exactly at every size — it is a flow
row, not an overlay.

`b4-final.mjs` itself carried a units bug in one derived field, and it is the
same bug class PR-0009 is about, so it is on the record here: its
`contentBottom` subtracted the panel's *computed* `padding-bottom` (authored,
never scaled: 6px) from a *screen-space* rect bottom, inflating every reported
gap by `6 x (scale - 1)` — that is the 8–11 px "gap" in the first pass's
failures, which was never 3.4 stage units of real error. `b5-units.mjs` is the
same MEASURE with that one line corrected (`padding-bottom x scale`, the scale
recovered from two unrounded rects over the unrounded computed padding), plus
the MORE row's effective type size and a G toggle-off/on. Re-measured live:

| case | scale (recovered / `min(w/640,h/360)`) | slab bottom | nearest glyph bottom | gap | sliced | lines below edge | chip over glyphs | MORE effective px |
|---|---|---|---|---|---|---|---|---|
| FFX Ch.1 1600x900 | 2.5000 / 2.5000 | 226.91 | 226.91 (`Hastega`) | **0.00 px** | 0 | 0 | 0 | 17.50 |
| FFX-2 Ch.4 2000x1012 | 2.8111 / 2.8111 | 467.78 | 467.83 (`Shell halves Impulse and Meg…`) | **0.05 px** | 0 | 0 | 0 | 19.68 |
| FFX Ch.3 1280x720 | 2.0000 / 2.0000 | 181.53 | 181.53 (`Stamina Tonic`) | **0.00 px** | 0 | 0 | 0 | 14.00 |

The slab's edge lands on the type, not on the leading below it, and it lands
there because the box can only ever end where a block ended. G hides the rail
(panel height 0) and re-opens it to the same clean fit at all three.

Two further confirmations fall out of the same numbers:

* `stageScale()`'s precision claim is real. The recovered factor matches
  `min(w/640, h/360)` to four decimals, while `b4`'s old
  `rect.height / offsetHeight` returned 2.486 / 2.7954 / 1.9888 for the same
  three stages — the whole-pixel `offsetHeight` rounding the builder named as
  the second root cause, independently reproduced on my rig.
* The FFX half of the acceptance matrix is reachable, as the first pass said:
  Chapters 1 and 3 both reach a populated command row once the waiter presses
  Enter on every poll (the BATTLE START banner needs it). No stall.

Visual check, two crops at 1600x900 (`out/p2-crop-ffx-ch1.png`,
`out/p2-crop-ffx2-ch4.png`): FFX ends on "Hastega → the party" with MORE on its
own plate below; FFX-2 ends on "x0.083." with the same. Neither word is cut and
nothing is printed over type. Case **both**, as the builder states: no game
branch in the fix but the accent edge, and both HUDs mount the same rail.

### PR-0003 reserve clause — CONFIRMED FIXED (major, FFX only)

`v6-reserve.test.ts` re-run unchanged over Chapter 1 seeds 1–12 on the real
engine (`seymour-flux`, `gagazetBuild`, `intendedStrategy`): **no misses**, where
the first pass listed seeds 3, 8 and 12. Because an all-green sweep can pass
vacuously, `v7-reserve-positive.test.ts` prints the underlying cases:

```
seed  3 (defeat):  auron turns=1  alive=false apEligible=false row=true award=0 levelDelta=0
seed  8 (victory): auron turns=2  alive=false apEligible=false row=true award=0 levelDelta=0
seed 12 (defeat):  auron turns=14 alive=false apEligible=false row=true award=0 levelDelta=0
seeds 4-7, 9, 11:  auron alive, apEligible, row=true award=10000 levelDelta=7
acted-but-AP-ineligible/dead reserve cases: 3, of which now have a row: 3
```

The three exact cases the first pass refuted on are the three that now carry a
row, at 0 AP and no Sphere Level — the ledger admits the member without
granting the award §10.1 denies. AP eligibility is unchanged for the survivors.
The additive `BattleResult.turnsTaken` has its `docs/CONTRACT-CHANGES.md` entry.
Live FFX defeat results screen (Chapter 1, 1600x900, played to a real turn-9
loss, `out/ffx-ch1-1600x900-results.png`): "Defeat / TURNS 9", Tidus S.LV 30
0/695 AP, Yuna S.LV 32 0/820 AP, Kimahri S.LV 25 0/442 AP.

### Left open (not defects in these two repairs)

* The MORE row is exactly 14.0 effective CSS px at 1280x720 — at the legibility
  floor with no margin, as the builder flagged. Worth a px next time that file
  is open; not a failure of the acceptance check.
* A second, independent deep-review obligation for the build still stands; this
  pass settles only PR-0009 and PR-0003.

Rigs and raw output: `critic/scratch/builda1-repair/` — `b4-final.mjs`
(unchanged), `b5-units.mjs`, `v6-reserve.test.ts` (unchanged),
`v7-reserve-positive.test.ts`, `vitest.scratch.config.ts`, and `out/` with
`b4-*.json`, `b5-*.json` and the six screenshots.
