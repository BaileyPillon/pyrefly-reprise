# r31-access: OPTIONS accessibility A2 (D-285, PR-0032)

Branch `r31-access` (worktree `D:/pyrefly-r29-input`), 2026-09-29. Bailey, 2026-09-29
~10:30 EDT: *"all your recommendations, full speed ahead"*; recommendation 3 was option
A2 of `docs/concepts/r29-options/options.html`: REDUCE MOTION + LOW EFFECTS + TEXT SIZE
100 / 115 / 130 %.

**Game case: both.** The rows, the save field, the flags and the camera are shared
plumbing (pause, `SaveData`, both games' stage). The 130 % HUD layout that ships is
FFX's (the frame was drawn on FFX Chapter I). The FFX-2 HUD and the pause at 130 % are
built behind a switch that ships **off** (D-220 Q4, below).

**Save-data class.** `Settings.textSize` is a new field (`src/app/SaveData.ts`), so this
change needs the **deep review before deploy** (AGENTS.md "Release"; CHK-024).

## What was built

| Part | Where |
|---|---|
| Three rows under TEXT SPEED, in the mock's order and words: TEXT SIZE (meter + `100%`), REDUCE MOTION, LOW EFFECTS (`ON`/`OFF`) | `PauseScreenPanels.optionRows` |
| Left / Right step TEXT SIZE and clamp at 100 and 130 % (as TEXT SPEED); Confirm and a tap step up and **wrap** to 100 %, so a touch-only phone is never stuck at 130 %; the two toggles flip on any of them | `pause/settings.ts` (`adjustSetting(..., press)`), `pause/actions.ts`, `PauseScreen.activate` |
| `textSize: 1 \| 1.15 \| 1.3`, default 1; migration coerces anything else to 1 and a non-boolean flag to its default; no `SAVE_VERSION` bump (the `battleHelp` precedent) | `src/app/saveComfort.ts`, `SaveData.ts` (+13 lines; it was already over the cap) |
| The settings on `<html>` from the first frame: `data-text-size`, `--pyr-ts`, `data-reduce-motion`, `data-low-effects` (and `data-text-size-wide` only while the Q4 switch is on) | `src/app/applyComfort.ts`, called by `SaveStore` at construction, on every `setSettings`, and after a two-tab merge |
| TEXT SIZE, FFX desktop HUD: each panel grows as a unit from its pinned corner (individual `scale`), the command list shows 4 rows at 130 % and 5 at 115 % and scrolls, the turn queue shows 5, the enemy card steps up and left; the advisor's type grows inside the box its solver finds, and the solver keeps the grown help slab clear; Zanmato gauge and Omnis readout grow too | `src/ui/common/text-size.css`, `src/ui/common/hudTextSize.ts`, `CommandMenu.ts` (2 call sites), `FFXBattleHud.ts` (1 line) |
| TEXT SIZE, FFX phone HUD: command labels, badges, the TIP line, GUIDE and the footer grow; the party card's name and numbers cap at 115 % with a gap before MP | `text-size.css` |
| TEXT SIZE, dialogue card: line, name, role tag, chapter eyebrow and key strip grow; the card keeps its size | `text-size.css` |
| REDUCE MOTION in battle (D-220 Q2 option (a)): rig changes are cuts; shake, punch, push, roll and the idle sway stop; every awaited camera move still takes its own ms (no pace change, FFX-2 Active included); hit jitter on the figures stops; the Ink & Gold wipe/cut-in and the cutscene fx follow the row, not only the OS query; every `prefers-reduced-motion` CSS block is mirrored under `[data-reduce-motion]` | `src/engine/ComfortCamera.ts` (`StillCamera`), `BattleCamera.swayOff`, `PaintedActor.still`, `BattlePresenterStage` (`comfort` option), `app/screens/battleComfort.ts`, `inkgold/wipe.ts`, `cutsceneFx.ts`, `ui/common/comfort.css`, `pause/PauseView.ts` (portrait stage follows the row live) |
| LOW EFFECTS: hit sparks draw 30 % of their particles | `VFX.SparkBurst.emit(..., share)`, `BattlePresenterStage` |

### Who reads each flag (the set, after this change)

- **reduceMotion**: battle camera (new: `StillCamera` + sway), figure hit shake (new),
  spell effects' `low` tier (`battleSpellFx.ts`, existing), moments' attack roll
  (`BattleMoments.rollOnHit`, existing), `MomentOverlay`/entry transitions (existing),
  Ink & Gold wipe, swirl and cut-in (new: they read `data-reduce-motion`), cutscene fx
  (new), title motes and parallax (existing), pause portrait stage (now live) and smooth
  scroll (existing), coach marks and briefing fades (existing), FF7 opening/swirl
  (existing, through `prefersReducedMotion`), all mirrored CSS blocks (new).
- **lowEffects**: spell effects' `low` tier (existing), pyreflies (existing, through the
  spell-effects tier), hit sparks (new), title motes count (existing), entry transitions
  (existing), FF7 effects (existing).
- Not changed on purpose: the renderer's bloom pass (an art-direction change nobody
  drew), screen flashes (that is REDUCE FLASHES, not in A2; its softness is D-220 Q7,
  still open).

## How it was proven

- `npx tsc --noEmit` clean; `tsc -p tsconfig.e2e.json` clean.
- New unit tests, all green: `save-comfort-migration.test.ts` (21: the **live release-29
  save**, `tests/fixtures/saves/release-29.json`, exported from that build's own
  SaveStore, keeps every chapter, best time, play time, coach id and setting, gains only
  `textSize: 1`, and is on `<html>` at construction; garbage values; idempotence),
  `pause-comfort-rows.test.ts` (7: rows in order in both games; keys, taps and a gamepad
  through the real `Input`), `comfort-presenters.test.ts` (10: `StillCamera` on and off;
  the real `BattleCamera` cuts at once, still resolves after its 600 ms, does not sway or
  shake; sparks share; wipe; command list 4 rows at 130 %; solver slot).
  `pause-remake.test.ts` updated for the new row order.
- Full `vitest run`: 9 767 passed, 2 failed, neither touched by this change:
  `ui-portrait-face-crop` (4 FFX-2 dressphere paintings on disk with no measured head row:
  art in the shared `public/art`, fails alone too) and `strategy-ffx2-bahamut` heal-only
  route (a timing-heavy simulation; passes alone).
- `node tools/orphans.mjs`: 24 orphans, none of them new (every new module has an importer).
- **Production build** (`vite build`, served by `vite preview` on 8811), new e2e
  `tests/e2e/accessibility-a2.spec.ts`, 5/5: real keys at 1600x900 (Esc, E to OPTIONS,
  Down, Right x2, Enter x2) set 130 %, REDUCE MOTION and LOW EFFECTS, and after a reload
  they are on `<html>` before any pause; real taps at 390x844 (pause chip, OPTIONS, the
  rows) step TEXT SIZE 115 → 130 → 100 and flip both toggles; at 130 % no clipped text and
  no overlapping panels in the FFX HUD, the pause and the dialogue card at 1600x900 and
  2000x1012, and none in the phone HUD at 390x844 (labels at 20.8 px, party names capped at
  19.55 px). Also green on the same build: `pause.spec.ts`, `pause-p-toggle.spec.ts`,
  `save-upgrade.spec.ts` (11/11).
- Sweeps (scratch probes) over all nine FFX chapters at 1600x900 (115 and 130 %),
  2000x1012 (130 %) and 390x844 (130 %): no clipped text, no panel overlaps, smallest HUD
  type 14.1 px at 130 % (11.97 px at 100 % before), 13.6 px on the phone. The longest
  story line (78 characters injected, the longest in the scripts is 61) stays inside the
  card at 1280x720, 1600x900 and 390x844.
- REDUCE MOTION measured on the production build: the camera drifts 0.01835 world units
  over 150 frames at the command menu with the row off, **0.00000** with it on.
- Frames, `docs/screenshots/r31-access/` (script `capture.mjs` beside them), each beside
  its target: `desk-options-keys-{100,115}.jpg` ↔ `r29-options/shots/desk-A2.jpg`;
  `phone-options-taps-{100,130}.jpg` ↔ `phone-A2.jpg`; `desk-hud-{100,115,130}.jpg`,
  `wide-hud-130.jpg` ↔ `accessibility-2026-09-26/desk-hud-130.jpg`; `phone-hud-{100,130}.jpg`
  ↔ `phone-hud-130.jpg`; `{desk,wide,phone}-dbox-*.jpg` ↔ `*-dbox-130.jpg`.

## Not done, and what differs from the target

1. **The move advisor folds at 130 % in Chapters I, IX and XII** (1600x900 and 2000x1012):
   once the guide grows, no box is left that is clear of every panel and fighter, so the
   solver declines and PR-0130 hides the card with its chip. At 115 % it shows in all nine.
   The target frame drew the advisor at 130 % in Chapter I, but partly over Mortiorchis
   (the mock held it at its 100 % place). Options for Bailey: (a) accept the fold at 130 %
   (the guide's NEXT line still names the move); (b) let the advisor overlap an enemy's
   body (not face or weapon) at 130 %, as the frame drew it; (c) cap the guide at 115 %
   when TEXT SIZE is 130 %. Nothing chosen here.
2. **D-220 Q4 (FFX-2 HUD and pause at 130 %) is still open**, so both stay at 100 % in
   this build (`TEXT_SIZE_WIDE_SCOPE = false` in `app/applyComfort.ts`). The CSS is built
   (`text-size-wide.css`) and the frames Q4 asks for are made from the real build with
   `?textsize=wide`: `q4-desk-pause-130-not-shipped.jpg`, `q4-phone-pause-130-not-shipped.jpg`,
   `q4-desk-x2hud-130-not-shipped.jpg`. The FFX-2 pass is a first cut (panel scaling only):
   in the Bahamut frame the enemy-intent board opens over Yuna and folds the guide, so it
   needs its own solver work after Bailey's look. The FFX-2 phone HUD is not scaled.
3. **Phone TIP line**: at 130 % it wraps "· White Magic" to a second line (the frame shows
   one line); readable, not clipped.
4. The FFX-2 top help band (`ffx2-cmd-info`, 11.7 px) and the enemy-move card on the phone
   keep their type, as the target frames do.
5. REDUCE FLASHES, REMAP CONTROLS and the comfort card (options A3 / C) are not part of A2.
6. The pause's `Kimahri` tab label measures 11 px wider than its box at 100 % already
   (pre-existing; not visible, it is the tab's dot).

## Scratch

Probe scripts `.r31-*-tmp.mjs` in the worktree root were moved to
`F:/pyrefly-parked/2026-09-29/r31-access/` (see `MOVED.txt` there).

## CHECK (independent checker, 2026-09-29 ~13:00 EDT)

Checked commit `3077d5bf` on `r31-access` without building any of it. **Verdict: no blockers.** Two majors are disclosed (below). This is a save-data change, so the deep review before deploy is still owed.

**Re-run here:**
- `npx tsc --noEmit` and `tsc -p tsconfig.e2e.json`: clean.
- The four touched unit files pass, 94 of 94: `save-comfort-migration`, `pause-comfort-rows`, `comfort-presenters` and `pause-remake`.
- Wider run of every `pause-*`, `save-*`, `comfort*` and advisor test: 891 passed, 2 failed. Neither failure comes from this change:
  - `ui-portrait-face-crop` fails because head rows are missing in the shared art. main `1475ff6b` measures the Rikku and Paine head rows.
  - `strategy-ffx2-bahamut` heal-only fails even alone here, but only on the 15 s vitest timeout on this CPU-capped PC. The branch changes nothing under `src/battle` or `src/data`.
- `node tools/orphans.mjs`: 24 orphans, none of them new.
- Fresh `vite build` of this commit, then Playwright headless with the GPU on port 8910: `accessibility-a2` 5/5, `pause` 5/5 and `save-upgrade` 2/2. That is 12 of 12.

**Own probe on the same production build** (port 8911; script parked at `F:/pyrefly-parked/2026-09-29/r31-access-check/`):
- **Release-29 save:** the save from `tests/fixtures/saves/release-29.json` was put into localStorage before boot. `<html>` came up with `data-text-size="100"`, `data-reduce-motion` and `data-low-effects` before any pause.
- **Real keys:** Esc, E to OPTIONS, then Down to TEXT SIZE.
  - The rows read TEXT SPEED 1.5x, TEXT SIZE 100%, REDUCE MOTION ON, LOW EFFECTS ON, STRATEGY GUIDE OFF, BATTLE HELP ON. This matches the mock's order.
  - Right three times stops at 130 %.
- **Saved after that write:** every release-29 setting is unchanged, including volumes 0.55/0.4/0.6, textSpeed 1.5, ffx2Atb active/fast, guideVisible false, and both comfort flags. The save gained only `textSize: 1.3`. Chapters, best times, turns and coach ids are intact. Attempts and play time rose only because the probe entered Chapter I.
- **REDUCE MOTION:** the camera drifted 0.0000 world units over 150 frames at the Chapter I command menu with it on. The control (row off, no OS preference) drifted 0.0396.
- **Evrae airship range shift** (`evrae-airship-director.ts` calls `moveTo` on the raw `BattleCamera`, outside `StillCamera`): measured with REDUCE MOTION on, the camera position did not move at all over 120 frames. There is no glide to report.

**Target against build:**
- `desk-options-keys-115.jpg` has the same rows, words and values as `r29-options/shots/desk-A2.jpg`. The layout is mirrored, as the pause does for Kimahri's portrait.
- `desk-hud-130.jpg` matches `accessibility-2026-09-26/desk-hud-130.jpg` for the guide, enemy card, turn queue, party card and command list, **except the move advisor**. See major 1.

**Merge:** `git merge-tree` against `origin/main` (8dce5e75) and against local `main` (1475ff6b): no conflicts.

**Findings:**
1. **MAJOR, disclosed.** At 130 % the move advisor card folds in Chapters I, IX and XII. The target frame shows it. Bailey chooses (a), (b) or (c) from "Not done" item 1. It is a defect in a brand-new setting, off by default, and not a regression at 100 %.
2. **MAJOR, disclosed.** A2 says TEXT SIZE "grows the battle HUD, dialogue and menus". This build leaves the FFX-2 battle HUD and the pause at 100 % (`TEXT_SIZE_WIDE_SCOPE = false`) until D-220 Q4 is answered. This follows the D-220 record, which says Q4 needs pictures first; the three `q4-*-not-shipped.jpg` frames are ready for Bailey. Until then an FFX-2 player at 130 % gets larger dialogue only.
3. **Minor.** Rule 7: eight files that were already over 400 lines grew by 1 to 11 lines. `SaveData.ts` went from 562 to 573. `PauseScreen.ts` was and stays at exactly 400. Every new file is under the cap.
4. **Minor.** The phone TIP line wraps at 130 % (disclosed, not clipped).
