# r37-scenes: Ginnem's glow, the plate wings, the hurried opening

Branch `r37-scenes`, from `c69de96a` (main). Worktree `D:/pyrefly-iter2-b6`. Not merged, not deployed, NOW.md and the target registry untouched
(the integrator's). **critic-plan class: DEEP after deploy** (live + focused + deep; no save-data class, so no `-savedata` branch; the paper
preflight is `docs/plans/r37-scenes-review.md`). Ports used: 5951 (dev), 5952 and 5953 (production previews of this branch and of main); 5950 was
held by another agent's preview and was left alone. All three of mine are stopped (by PID) at the end.

| key | game case | what changed | proof | what is left |
|---|---|---|---|---|
| A-9 Lady Ginnem's glow | **FFX only** (Chapter IX; no FFX-2 chapter stands in the cavern) | A breathing cool halo (her silhouette blurred wide, tinted cool white, body cut out) and a shell of pyrefly motes born on her outline (the A-5 `PyreflyEmitter`), live in the battle (`scenes/cavern-stolen-fayth-glow.ts`, laid over her staged actor through `PaintedActor.contentQuad`) and in the post scene's DOM (`app/screens/cutsceneAura.ts`). Switches (`engine/fx/unsentGlowPlan.ts`): LIVING PAINTINGS look via the EYE CANDY seam, `?fxsub=-glow`, phone tier 60 % motes, LOW EFFECTS 30 % and a still halo, **REDUCE MOTION a still halo and no motes**. No settings row added. Outline finder `engine/fx/unsentOutline.ts` (pure). Commit 0849b415 | `docs/screenshots/r37-scenes/a9-ginnem-target-vs-build.jpg` (the approved card beside the build, post scene and battle); `a9-post-scene-{1600x900,2000x1012,390x844,reduce-motion-1600x900}.png`; `a9-battle-{on,reduce-motion,look-off}.png`; real keys through Ch IX; `__pyrefly.fx.snapshot().ginnemGlow` in each state in a dev and a production build (on: halo breathes 0.57-0.95, about 120 motes; reduce motion: halo fixed 0.75, 0 motes; LOW: 35 motes; look off: halo hidden); `tests/unit/ginnem-glow.test.ts` (13) | PR-0319 (her figure reads as standing in Yojimbo's line under the colossus master) is not touched; the glow only makes her read as unsent. Her painting still carries its baked rim and 140 static motes (the O-3 B pick); the solid version lives in the art backup, so the baked ones can go when Bailey wants the live layer alone |
| PR-0300 plate edge at wide windows | **FFX-2 only**: Chapter XV runs on `den-of-woe` (its chapter file's `sceneKey: 'bevelle-underground'` is a stale placeholder; the shipped wrapper registers `den-of-woe`); Chapters IV and XIII run on `bevelle-underground`. No FFX chapter uses either scene | Plate wings (`scenes/plateWings.ts`): the plate's outer strip mirrored 18 units out each side, same depth, grade and focus; the rigs (approved framing solves) are not moved. `Backdrop.adopt`; `BackdropFocus` patches `backdrop-wing-*`. Commit e3ca4021 | `plateEdges` over each scene's own rig table: at 2000x1012 the den's intro and enemy rigs put the plane's edge at **0.94** (the round's 0.953; 0.87 at 2.37), Bevelle's enemy, action and Bahamut rigs at 0.93-0.96, party rigs showed the left edge; with wings every rig, both sides, at 1.5, 16:9, 1.976 and 2.37 is covered (`tests/unit/plate-wings.test.ts`). Captures: `pr0300-xv-intro-2000x1012-before-after.jpg`, `pr0300-xv-{intro-2000x1012,party-2000x1012,intro-1440x900,intro-390x844}-after.png` | The mirror leaves a faint symmetrical chevron in the lower right of XV's plate at 2000x1012 (the plate's own blue shape doubled), see For Bailey. Chapter V (Farplane, `farplane.ts`, waits for r21) and VI (Leblanc, 6-7 % margin in the round) have the same geometry and were not touched: one `addPlateWings` call each when their lanes want it. The measure of the opening burst on the critic's own harness (per-column luma over the real seam) was not re-run; the geometry above is the proof |
| PR-0061 hold-skip entry pace | **both** (card, sweep and flow hand-off are shared plumbing) | **Method check written first** (`docs/plans/pr-0061-method-check.md`, round-19 addendum). A pre-scene the player hurried (held Confirm past the hold-to-skip time, Escape or pause "Skip Scene", or `startSkipped`) gives the **first** link's opening the Confirm press made for them, and the card holds 0.7 s instead of 1.9 s. `CutsceneScreen.hurriedByPlayer` to `BattleScreenFlow` to `BattleScreenOptions.openingHurry` to an `OpeningHurry` one-shot on `MomentOverlay` to `playOpening` (hurry set before the first beat). Chained-link openings, a scene played through, a retry, a run with no scene: unchanged. Commit 378f5ad4 | The round's own protocol (`sH-hold.mjs`: Enter held until the scene ends, then released), production builds served on their own ports, fresh profile per run, base c69de96a against this branch: **I 11.6-12.4 s to 3.9-4.2 s; IV 13.0-13.3 s to 5.9-6.4 s (Bahamut acts first: the fight); VII 11.4-11.6 s to 4.5-4.6 s**. A scene tapped through still gets the full opening (6.6 s measured). `docs/screenshots/r37-scenes/pr0061-hold-skip-first-menu-before-after.jpg`; `presenter-opening-skip`, `opening-hurry`, `flow-opening-hurry` tests | **Under 3 s is not reachable by the opening**: the scene's own 1.1-1.5 s plus the load's 2.1-2.3 s (with REDUCE MOTION's cut entry the battle is up at 3.6 s: the load, not the transition) are 3.2-3.8 s. The lever left is A-3's warm-on-card-focus load (`ChapterSelectScreen.ts`, `battlePreload.ts`), not this lane's files. The Escape/pause "Skip Scene" row shares `skipByPlayer()` with the hold but was not driven by keys here (the row is on a tab the harness did not reach) |
| PR-0301 | both (FFX-2 seams measured) | **Not changed.** A question for Bailey | see For Bailey 1 | |

## Gates

`npx tsc --noEmit` clean. Targeted: `ginnem-glow` (13), `plate-wings` (5), `presenter-opening-skip` (7), `opening-hurry` (3), `flow-opening-hurry` (5),
the cutscene, scene, backdrop, focus and den/bevelle files (174 tests across 21 files) pass. `node tools/orphans.mjs`: 24 orphans, the same as main.
House rule 7: no file that was under 400 lines went over; the files already over grew a little (`BattleScreen.ts`, `bevelle-underground.ts`,
`BattleScreenFlow.ts`, `CutsceneScreen.ts`, `Backdrop.ts`); every new file is under 400. Full suite: see the last section.

## For Bailey

1. **PR-0301, the longer opening at a chain seam (not changed; measured by r34fix-seams, re-read here).** The FFX-2 seam opening takes about 6.0 s instead of
   the old 3.8 s (calm camera +1.7 s, steady pacing +0.4 s), and seam to first menu goes from 11.7 s to 14.2 s in XV (+2.5 s); XI 3.8 s to 6.1 s. Both causes are
   picks of yours (calm camera D-291, steady pacing D-294). Three ways to answer (`docs/handoff/r34fix-seams.md`, askBailey): keep it; keep calm for the
   per-turn camera but play the opening at the old camera speed (about 4.2 s at a seam); or shorten only chain seams (a name plate alone, about
   1-1.5 s, an estimate until built). The PR-0061 change leaves seams alone on purpose.
2. **The hurried card is 0.7 s, not gone.** A player who skipped the scene still sees the chapter card for 0.7 s (a press dismisses it). Dropping it for
   them would save 0.3-1.0 s more and remove an approved screen: your call. Likewise whether a hurried player should get the FFX shatter entry the A-2
   table gives "a skipped scene" (today every scene gets the blur in FFX).
3. **The wing's mirror seam** at 2000x1012 in XV (a doubled blue shape, lower right) is visible if you look. The alternatives are a painted extension of the
   plate (an art-lane job; approved paintings stay) or moving the intro and enemy rigs (changes the approved framing). Say which, or accept it.
4. **Her baked glow** (A-9): the live layer sits on top of the O-3 B painting's own baked rim and 140 static motes. Removing the baked ones means
   installing the solid painting from the art backup (`public/art` is read-only for this lane, and the painting is not approved either way).
5. **XV's `sceneKey` is a stale placeholder** (`chapter-ffx2-den-of-woe.ts` says `bevelle-underground`; the shipped wrapper says `den-of-woe`). Harmless today;
   worth one line when someone next touches that file.

## Full suite

`npx vitest run --testTimeout=60000 --maxWorkers=4` on the final tree: **753 files passed, 5 skipped (758); 11,089 tests passed, 40 skipped, 1 todo; nothing failed**
(worktree junctions in place for `public/art`, so the three art-dependent files run too).

## Check (independent critic, 2026-10-03; tip checked `a6bfaf66`)

Method: production builds of the branch tip and of main `c69de96a` (the plate scenes, `Backdrop.ts` and the renderer are unchanged between live release 35 `ef3f6bbf` and
`c69de96a`, so main is live's plate edge) served on their own ports (6030, 6031; both stopped by PID), headless Chromium on the GPU, one browser at a time, real
chapters. Camera forced to each rig once the first menu was up with the DOM hidden, so only the canvas shows; HUD-on captures separately. Scratch and scripts:
`D:/Tools/pyrefly-scratch/2026-10-03/r37-b6chk/`. Evidence: `docs/screenshots/r37-scenes/check/`.

| item | verdict | what I saw |
|---|---|---|
| A-9 Ginnem's glow (FFX only, Ch IX) | **PASS** | Post scene at 1600x900 and 390x844: cool halo plus a mote shell on her outline, face clear, close to the approved B card. States read from `__pyrefly.fx.snapshot().ginnemGlow` in a production build: on = halo breathes 0.55 to 0.94, 118-124 motes (72 at 390x844, the 60 % phone tier); REDUCE MOTION (OS preference) = halo fixed 0.75, 0 motes, post-scene halo fixed; LOW = 34-37 motes, still halo; `?fxsub=-glow` = halo hidden, 0 motes, aura `display:none`. No page errors in any run; the fight still reaches results (skip speed, `intended`). |
| PR-0300 plate wings (FFX-2 only) | **PASS with a visible-seam disclosure** | XV (real battle, den plate): main shows a hard black band on the plate's right edge in the intro/action rigs and on the left in party/victory at 2000x1012, and a wide band at 2560x1080; with wings every rig at both windows is filled. 1440x900 and 390x844: pixel-for-pixel the same as main (wings not in view). IV (Bahamut, bevelle plate): main's black bands at 2560x1080 are filled. The seam is visible at 1:1, see disclosure 1. |
| PR-0061 hurried entry (both) | **PASS** | Production, fresh profile per run, card chosen with `trigger('select:')` then real Enter, Enter held through the pre-scene and released at its end, no further key. First menu, main then branch: I (FFX) 9.96 s to 3.22 s, IV (FFX-2) 12.01 s to 4.81 s, VII (FFX) 9.93 s to 3.61 s. A scene tapped through (never held 550 ms): I 7.8-9.4 s on main, 7.9-10.3 s on the branch (run-to-run noise, same spread), IV 8.85 s and 8.86 s: unchanged, no leak. Under 3 s is not reached (confirms the handoff). |
| Regressions against main / live in touched chapters | none found | Ch I, IV, VII, IX, XV entered and fought on both builds; no page error; Ch XIII (Trema) captured at four windows, identical to main. |
| Layering, size, contracts | PASS, one note | `unsentOutline.ts`, `unsentGlowPlan.ts`, `OpeningSkip.ts` import no DOM and no `three`; `BattlePresenterPorts.ts` gains one optional method (CONTRACT-CHANGES entry present for `SceneBuild.pixelScaled` and `CutsceneFigure.aura`). New files all under 400. `src/scenes/index.ts` went from exactly 400 to 401 lines (one loop line); `BattleScreen.ts`, `bevelle-underground.ts`, `Backdrop.ts`, `BattlePresenterPorts.ts`, `BattleScreenFlow.ts`, `CutsceneScreen.ts` were already over and grew by 5 to 20. |
| Game case in every commit | PASS, one wrong claim | All four commits state it. The PR-0300 commit and this note say Chapters IV **and XIII** play on `bevelle-underground`; they do not, see disclosure 2. |
| `npx tsc --noEmit` | clean | exit 0 |
| Targeted vitest | pass | the five new/changed files (33 tests) and 122 related files (1,493 tests: cutscene, backdrop, den, opening, moments, FX, scene, HUD families) |
| `node tools/orphans.mjs` | 24 orphans | the same count as main; none of the new modules is listed |

**Blockers: none.**

**Disclosures (none is a regression; each is a major or minor to carry):**

1. **The mirrored strip is visible at 1:1 where a bright object straddles the plate edge.** XV at 2000x1012 (intro rig, lower right) shows a doubled blue shape as a
   chevron, and at 2560x1080 the same chevron plus mirrored light-dots; against a hard black band the wing is clearly the better of the two, and in the dark plate it
   is subtle (`seam-xv-*.jpg`). IV is worse: at 2560x1080 the idle rig (the rig a fight rests on) doubles the edge lantern into a white-hot symmetrical pair, and the
   action/enemy/Bahamut rigs at 2000x1012 double a lantern too (`seam-iv-idle-2560-left-main-vs-branch.jpg`, `check-iv-2560-main-above-branch-below.jpg`). The
   handoff discloses only XV's chevron; the lantern doubling in IV is not in it. Fix options for Bailey: a darker or fading wing, a painted extension (art lane), or accept.
2. **Chapter XIII does not use the wings.** `chapter-trema-ship.ts` puts Trema on `via-infinito` (the Cloister 100 scene), with `bevelle-underground` only the stale
   placeholder in `chapter-ffx2-trema.ts`; the same class of stale key as XV's. The wings therefore reach IV and XV only; XIII at 2560x1080 and 2000x1012 shows no
   band on main or branch. The PR-0300 commit message, the handoff table and `bevelle-underground.ts`'s comment ("Chapters IV and XIII") should say IV only.
3. **`goto('scene-den-of-woe')` shows the Bevelle lantern plate, not the shipped Den plate** (the chapter's own flow shows the blue Den). A capture script that
   uses the scene screen will measure the wrong plate for XV.
4. **Ginnem's painting already carries a baked halo and motes**, so with the live layer off the post scene still shows a soft halo; the live layer's visible addition is
   the breathing and the large soft motes (a few drift beside her hair; none sat on her face in my captures). PR-0319 is untouched, as the handoff says.
5. **Not driven by me:** the Escape / pause "Skip Scene" path (the hold path and tapped path were); the opening burst measured per column on the critic's own harness
   (I judged the edge from 1:1 crops of forced rigs instead); a deep-review pass on Chapters V and VI (they have the same geometry and were not touched).
6. House rule 7: `scenes/index.ts` is now 401 lines (see the table).
