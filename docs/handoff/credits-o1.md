# Credits screen, option O1 (D-305)

**Decision.** Bailey, 2026-09-30 ~18:30 EDT: "I'll go with all of your recommendations please keep going",
which adopts the driver's recommendation O1: a CREDITS row under an ABOUT heading in the pause OPTIONS tab,
opening a scrolling credits panel. Approved target: `docs/concepts/credits-2026-09-30/credits.md` and the
`o1-options`, `o1-panel`, `o1-panel-end` frames at 1600x900 and 390x844 in that folder.

**Branch** `credits-o1` in `D:/pyrefly-r29-options`, from `5d812051` (main + music-v2 + sfx-v2). Not pushed.

**Game case: both.** One pause screen serves FFX (chapters 1-3 and the other FFX chapters), FFX-2 (4, 5 and the
other FFX-2 chapters) and FF7; the ABOUT/CREDITS rows are added for every game. The attribution list covers the
whole product's shipped audio, type and tools, so it is the same list in both games. The only per-game
difference is the pause's own styling: the panel's group headings use `--pu-accent` (= `--ig-accent`), gold in
FFX and pyre pink under `.ig--ffx2`, exactly as the pause's other accents already do. Checked in one FFX
chapter (`seymour-flux`) and one FFX-2 chapter (`ffx2-bahamut`).

## What was built, where

| Part | File |
|---|---|
| The audio sources a shipped file was made with, and which licences owe a credit (`requiresAttribution`) | `src/app/credits/audioSources.ts` |
| What the panel lists: MUSIC, SOUND EFFECTS, TYPE, ART AND TOOLS, REQUIRED first, then the README notice verbatim | `src/app/credits/creditsData.ts` |
| The panel: markup, scroll, fades, snapshot | `src/app/screens/pause/creditsPanel.ts` |
| Open / close / input while up (Up/Down scroll, Esc/cancel/Start/prompt close, L1/R1 or a tab close) | `src/app/screens/pause/PauseOverlays.ts` |
| ABOUT (a `sub` heading row) and CREDITS (a command) at the end of THIS ENCOUNTER | `src/app/screens/pause/panels.ts`, `markup.ts` |
| `credits` fires `openCredits` | `src/app/screens/pause/actions.ts` |
| Wiring, focus back to CREDITS, `credits` in the pause snapshot (file kept at 399 lines) | `src/app/screens/PauseScreen.ts` |
| Styles (own file: `pause-screen.css` is past the 400-line cap) | `src/ui/common/pause-credits.css` |
| Tests | `tests/unit/credits-attribution.test.ts`, `tests/unit/pause-credits.test.ts` |
| The CREDITS.md TODO replaced by where the lines now live | `docs/audio/CREDITS.md` |

Inputs: pointer and touch (tap the CREDITS row; tap `Esc BACK`; wheel or finger scrolls the list), keyboard and
pad (Down into OPTIONS, Up wraps to CREDITS, Confirm or Right opens; Up/Down scroll by 60% of the list's height,
with auto-repeat; Esc / X / Backspace, the pad's cancel or Start close). Closing returns the cursor **and** DOM
focus to the CREDITS row; the next Esc goes up to the strip and the one after resumes, as before. Q/E, L1/R1 or a
tab click close the panel and change tab. REDUCE MOTION on makes each scroll step instant (measured: 376 px after
two frames with it on; 0 px after two frames and 376 px settled with it off). Nothing is written to the save: the
row is a button, not a setting (`SaveData.ts` and the settings schema untouched).

## The attribution check (test)

The audio tools' machine-readable record (`sources.json` of the SFX set, the music-v2 renderers) lives outside
the repo, so `audioSources.ts` is the in-repo copy and the test holds three records against each other:
every section a source feeds exists and is non-empty in `public/audio/manifest.json`; every source whose licence
is CC BY or CC Sampling Plus has a REQUIRED line naming it with its licence; every line `docs/audio/CREDITS.md`
marks as owed (a CC BY / Sampling Plus licence cell, `**required**`, "Attribution required: yes", every line of a
"verbatim" block) matches a source that has a line. Proven by mutation: removing the glass-breaking line's source
made four cases fail; restoring it made all 31 pass.

**Cross-check of credits.md against the shipped sources: nothing that owes attribution is missing.** Checked:
`docs/audio/CREDITS.md` on this branch; `D:/Tools/downloads.md`; the SFX set's `sources.json` and `recipes.py`
(which file each shipped cue loads); the library folders the music-v2 renderers read (`arvedi`, `bigcat-cello`,
`black-and-blue-basses`, `derived` (Sonatina choir), `drskit`, `ir` (Voxengo), `jRhodes3d`, `salamander`,
`shinyguitar`, `surge-xt`, `vcsl`, `vsco2-ce-sfz`). Downloaded CC BY files that no shipped cue loads, so not
credited: `WWS_Bonfireburning`, `WWS_Fireoftheforge`, `WWS_Bloweroftheforge` (CC BY 4.0), `Glass_breaking_2` and
`_3` (CC BY 4.0), the Magic SFX Preview Pack (CC BY 3.0; the recipe hits for "Magic" are cue names only), and the
four Kevin MacLeod tracks (CC BY 4.0; calibration references in `ear-references`, never shipped). rubberduck's
creature pack appears in `recipes.py` only as a fallback if the grizzly file is missing (CC0 either way).

## Target vs build

| Frame | Target | Build |
|---|---|---|
| OPTIONS, 1600x900 | `docs/concepts/credits-2026-09-30/o1-options-1600x900.jpg` | `docs/screenshots/credits-o1-options-1600x900.png` |
| Panel top, 1600x900 | `o1-panel-1600x900.jpg` | `credits-o1-panel-1600x900.png` |
| Panel end, 1600x900 | `o1-panel-end-1600x900.jpg` | `credits-o1-panel-end-1600x900.png` |
| OPTIONS, 390x844 | `o1-options-390x844.jpg` | `credits-o1-options-390x844.png` |
| Panel top, 390x844 | `o1-panel-390x844.jpg` | `credits-o1-panel-390x844.png` |
| Panel end, 390x844 | `o1-panel-end-390x844.jpg` | `credits-o1-panel-end-390x844.png` |

FFX-2 builds of the same six: `docs/screenshots/credits-o1-ffx2-*.png` (Chapter IV, pink accents).

Distance from the target: layout, groups, order, type and prompts match. At 1600x900 the frame puts ABOUT at y 492 and CREDITS at
530; the build has 487 and 511 (CREDITS keeps the row height the other command rows use, not the frame's slightly
looser spacing). One
deliberate addition: the seven REQUIRED lines carry a quiet third line with the source (freepats, the SF2
converter, drumgizmo.org, Wikimedia Commons, and for the Arvedi hall the full title, eight authors, DOI and "decoded
to stereo, direct sound removed"), because CC BY 4.0 asks for the source and any change, and
`docs/audio/CREDITS.md`'s verbatim lines carry them. That makes the MUSIC group longer than the frame, so the
first screen ends at "Black And Blue Basses" rather than at ACE-Step. Bailey may prefer those notes shorter.

Measured headless (GPU Chromium, own dev server on 5347, stopped by PID), real keys and clicks, both chapters at
both sizes: no clipped text (every title, author, note, heading and the notice has scrollWidth <= clientWidth);
text inside the gutter (20..370 at 390 wide, the pause's own 20 px phone gutter, over the 16 px asked); panel
below the tab strip and above its prompts; heading clear of the tab strip and the brand; columns, objective and
the normal prompts hidden under the panel; font floor 14 px desktop, 12 px phone; wheel and keys both reach the
end; the notice is not cut. On the phone the ABOUT and CREDITS rows are rows 6 and 7 of THIS ENCOUNTER, past the
five-row phone budget, so they are kept visible explicitly and the existing phone lift raises the body clear of
the objective.

## Checks run

`npx tsc --noEmit` clean. The two new test files plus every pause / options / css / audio-manifest test: 51 files,
646 tests pass. `node tools/orphans.mjs`: 24 orphans before and after (the three new modules are reachable).
Full `npx vitest run`: 697 files pass, **1 fails and it is not this change**: `audio-shipped-files.test.ts`
"stays inside the shipping budget (85 MB)", on the base commit already (music-v2 + sfx-v2 at V0); Bailey's D-306
raises the budget to 90 MB, which is a separate change.

## Open items

1. **Links not verified** (from `credits.md` open point 3): VSCO 2 CE, VCSL, the Karoryfer packs, jRhodes3d,
   Surge XT, Voxengo, ComfyUI and the Animagine author have no recorded URL; the panel prints no link for them
   (courtesy lines). A lookup, not a download, before the milestone.
2. **three.js MIT notice** in the production bundle still not checked (`credits.md` point 4).
3. The panel's REQUIRED notes (above) are an addition to the approved frames; Bailey can ask for them shorter.
4. Pre-existing, not from this change: at 390x844 the FFX-2 brand line "PYREFLY REPRISE · FINAL FANTASY X-2"
   wraps to two lines (`credits-o1-ffx2-options-390x844.png`, top left).
5. Scratch harness (not committed): `D:/Tools/pyrefly-scratch/2026-09-30-rel35/credits-check.mjs`, with its JSON
   results beside it.
