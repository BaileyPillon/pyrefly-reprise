# Release 37 integration (branch rel37-int, 2026-10-03)

Integrator pass for release 37, built by a Sonnet sub-agent of the driver session in worktree `D:/pyrefly-r29-text`, from
`origin/main` 6b5ff02f (release 36 was main c69de96a, bundle GO0eMOto; the commits since are records and a plan).
**Nothing here is deployed and no release was cut**: the driver cuts release 37 later from `D:/pyrefly-rel26c`. The lane `ui-floor`
FAILED its check and is **not merged** (see "Not merged").

## What merged, in order (each a `--no-ff` merge, `npx tsc --noEmit` clean after every one)

| # | Branch @ tip | Merge sha | Game case | What it is |
|---|---|---|---|---|
| 1 | r37-sourcemaps @ 96488afd | d167c9ce | both (delivery plumbing) | PR-0328 / D-335: no source map ships; scratch build has 0 `.map` files ([r37-sourcemaps.md](r37-sourcemaps.md)) |
| 2 | portraits-live @ 8a16f072 | ae7ce252 | both (parts per plate; FF7 stays static) | The living portraits on the Until Dawn pause (D-021, D-143 A2, D-320, D-321) ([portraits-live.md](portraits-live.md)) |
| 3 | r37-slots @ d529e06f | 7b312a77 | both, each by its own rule | The Overdrive / Special key painting and the boss telegraph painting slots; no visible change until art is installed ([r37-slots.md](r37-slots.md)) |
| 4 | audio-ear @ 52b072d0 (local branch, one commit) | d6874417 | both (tools only) | `tools/audio/ear/`: the automated ear, a screen not a verdict; touches nothing under `src/` |
| 5 | r37-scenes @ 2ad3267b | d86b1df5 | A-9 Ginnem FFX only; PR-0300 plate wings FFX-2 only (Ch IV, XV); PR-0061 hurried opening both | [r37-scenes.md](r37-scenes.md) |
| 6 | r37-small @ c029e9ef | dea70c99 | D-216/D-248 FFX only; D-247 FFX only; D-249 Q12 FFX-2 Ch XI only; the rest per row | [r37-small.md](r37-small.md) |
| 7 | r37-living-backdrops @ 162fd05d | 6fd0187f | both (defocus shared, each room its own game's) | A-7 backdrops with a floor and a sky ([r37-living-backdrops.md](r37-living-backdrops.md)) |
| 8 | r37-lady-luck @ ea03472e | 4b2168fe | FFX-2 only | Lady Luck's reels: sourced pay table, the Dud, a menu ability can carry a minigame outcome ([r37-lady-luck.md](r37-lady-luck.md)) |
| 9 | r37-sin-advisor @ 9297a9d8 | ca8f3786 | PR-0261 both (tool), overlays FFX only; PR-0269 FFX only | Route harness and the Sin advisor ([r37-sin-advisor.md](r37-sin-advisor.md)) |
| 10 | r37-mix-polish @ afd5c8c2 | e5999700 | per item (PR-0313 and the dressphere items FFX-2 only) | MAX mix polish PR-0313 to PR-0320, PR-0327 ([r37-mix-polish.md](r37-mix-polish.md)) |

One conflict in the whole range: `docs/CONTRACT-CHANGES.md` at the lady-luck merge (both sides added a top entry). Resolved by keeping
both entries unchanged, the lady-luck entry above the r37-scenes `pixelScaled` entry (newest-first file, no text edited). No merge touched
`docs/handoff/NOW.md` (checked after every merge with `git diff origin/main HEAD -- docs/handoff/NOW.md`: empty).

## Gates (all on the merged tip e5999700 plus the decisions commit)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean after each merge and at the tip |
| Full suite `npx vitest run --testTimeout=60000 --maxWorkers=6` | **768 files passed, 5 skipped (773); 11,272 tests passed, 41 skipped, 1 todo; 0 failed**, 199 s (log `D:/Tools/pyrefly-scratch/2026-10-03/rel37-int-vitest.txt`) |
| `node tools/orphans.mjs` | 1203 modules, 24 orphaned: the same 24 as the r36 check (`r36check/orphans.log`); **no new orphan** |
| Approved-art verifier (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`, `ROOT` = this tree) | 591 ok, 0 mismatched, 0 missing (approved 543, judge-locked rest) |
| `node tools/audio/qa.mjs --strict` | exit 0 (clean) |
| `node tools/critic-plan.mjs` | **review DEEP; before deploy FOCUSED; after deploy live verification then the DEEP review (this build owes it); obligations live + focused + deep; NOT the save-data class** (no `SaveData.ts`, schema or migration in the range: the deep review comes after the deploy). Shared systems named: audio routing, shared combat core, FFX CTB and FFX-2 ATB engines, battle presenter, asset loader, chapter registry, global layout, build configuration. 18 chapters, both games, 23 checks (CHK-001 to CHK-023 except CHK-014, plus CHK-B1). 95 shipped files, 194 with no product effect. Previous build c69de96a. |
| Scratch production build (`npx vite build --outDir D:/Tools/pyrefly-scratch/2026-10-03/rel37-int/dist`, never `dist/`), fx assets restored (16 files copied from the backup, `fx-assets verify` PASS) | 1,444 files, **0 `.map` files**, **776,753,213 bytes**; headroom 23,246,787 under 800,000,000 |
| Same build with the living-portrait parts installed at `art/portrait-parts/` (a release-time step, see below) | 1,637 files, **779,832,255 bytes**; headroom **20,167,745** (before `artifact-manifest.json`) |
| Headless smoke, one per game, on that build (`D:/Tools/pyrefly-scratch/2026-10-03/rel37-int/smoke/smoke.mjs`; static server on 6070, stopped by PID; PYREFLY_BROWSER=gpu; 1600x900; real keys) | Ch I (seymour-flux, FFX) and Ch IV (ffx2-bahamut, FFX-2): title, chapter select, party prep, cutscene skip, battle; a submenu then Escape returns to the menu; Attack selected by real arrows and confirmed; the battle log grew with the real action (Ch I: Tidus 155 to Mortiorchis; Ch IV: Rikku 120 to Bahamut); the next player menu came back. 16 of 16 steps, **0 console errors, 0 page errors, 0 responses of 400 or more**, load to ready 282 ms. Reports and frames in `.../rel37-int/smoke/out/` |

### One thing the smoke found (living portraits, not a code fault)

Without the portrait parts in the build, opening the pause logs **two console errors** (404 on `art/portrait-parts/manifest.json`
and `portrait-parts/manifest.json`); the pause falls back to the static plate. The parts are local-only art and go in at release time
(`portraits-live.md`, "Install at release time"): copy `D:/pyrefly-fb-camera/public/portrait-parts/` to
`public/art/portrait-parts/` in the release tree (about 3.08 MB). With them installed the same smoke has 0 errors. The release cut must
install the parts, or the live pause logs those 404s; headroom with them is 20.17 MB.

## Not merged

`ui-floor` (FAILED its check): the FFX-2 first-run coach clips in Chapter IV at the two most common desktop sizes (a new player's first
screen), so it stays out. TEXT SIZE takes 1, 1.15 or 1.3, not 115 or 130 (the builder's 130 run probably never applied).

## Disclosures from the checks (carry into the focused review; majors are not regressions unless marked)

### scenes
- The mirrored plate strip is visible at 1:1. In Ch IV the doubled lantern is the clearest case (idle rig at 2560x1080; the action, enemy and Bahamut rigs at 2000x1012). Ch XV shows a chevron and mirrored dots; the handoff discloses only XV's chevron.
- Ch XIII (Trema) is not covered by the wings: its shipped scene is via-infinito. The PR-0300 commit message, the handoff table and a `bevelle-underground.ts` comment wrongly say IV and XIII. XIII showed no edge band on main either.
- `goto('scene-den-of-woe')` shows the Bevelle lantern plate, not the real Den plate, so a capture script that uses the scene screen measures the wrong plate for XV.
- Ginnem's painting already carries a baked halo and motes: with the live layer off the post scene still shows a soft halo. A few large soft motes drift beside her hair; none sat on her face in the checker's captures.
- The Escape and pause Skip Scene path was not driven, only the hold and tap paths. Ch XV's opening burst was judged from 1:1 crops of forced rigs, not per column on the critic's harness. The chapter card was picked with `trigger('select:')`; real Enter for everything after.
- `src/scenes/index.ts` is now 401 lines (house rule 7) and six already-over files grew.

### small-approved
- D-247 text says Chapter III is the Macalania Woods pursuit, but in the code that is Chapter VII. The 0.6 card applies only to the Talk beat in Braska's Final Aeon.
- The title cue is silent, not synth, on a slow first load: about half the runs at 300 ms latency and all runs at 900 ms and above.
- The PR-0258 doc comment and handoff mention Natus x2/x4, but `seymour-natus.ts` ships `drops: []`, so that row has no effect in the engine. The comment in `seymour-flux.ts` saying there is no field for the overkill drop is now stale. Documentation only.
- The builder's Bulwark scratch test was vacuous, so its 40/40 figure is not evidence. The checker's 60/60 run with a working control is, and the conclusion (no difficulty change) stands.
- EYE CANDY dim labels measure 3.12:1 on a phone over Yuna's bright painting, against a 3.0 bar.
- House rule 7: four files already over 400 lines on main grew (`coachCopy.ts` 403 to 414, `AudioManager.ts` 634 to 664, `FFX2BattleHud.ts` 1274 to 1282, `advisor.ts` +1).
- The disc coach line is raised after the menu's own listener registers, unlike the other marks. It works on real keys with one Enter and no leak.
- origin/main had moved six commits since this branch was cut; the merge into rel37-int had no conflict.

### living-backdrops
- Plates are not bit-identical at rest in any new room: a thin edge-only difference of 0.2 to 1.7 mean out of 255 (the Farplane is now 0.32).
- The defocus pulses with the drift (0 to full over about 12 s) and is 0 at rest. The approved frame has it on all the time.
- `src/engine/Backdrop.ts` is 495 lines, as on origin/main.
- Real chapters were reached through the debug `gotoChapter`. LOW EFFECTS was forced with `?fxtier=low`, not the settings row. Live release 35 was not run; the merge-base build d154486c stands in.
- The Farplane at-rest comparison against the merge-base build reads 0.81 mean, with a cross-run noise floor of about 0.55.

### lady-luck
- **MAJOR (visual, new surface):** the reel overlay at top-left is covered by the guide card, which is drawn on top of it. Reel 1 (red7) is dimmed and the DUD warning is half hidden. Slot 1 decides the Cherry tier. A human could not reach this before, so it is not a regression. Fix: raise the overlay above the guide, or hide the guide while a minigame is open.
- **MAJOR (scope, balance, FFX-2 only):** a human's Trigger Happy press count is now honoured. On c69de96a, answers of hits=3 and hits=12 both resolved as 14 hits (the engine's roll); on the branch they resolve as 3 and 12. Gunner players in Chapters 4 and 5 who mash fewer than about 14 times in the 1.8 s window now do less than live. Shipped autopilot strategies are unaffected. Documented in `CONTRACT-CHANGES.md` and is the faithful rule, but nobody ran it in a browser.
- Escape does nothing at the reel overlay; the run is committed once the charge bar empties. Pre-existing, unchanged.
- The Dud lands at 70 to 79 percent of current HP, not a flat 75 percent, because of the step-7 randomiser used by every percent-current ability.
- `BattlePresenter.ts` (747) and `types.ts` (2693) were already over 400 lines and the branch grew them by 49 and 13.
- Estimates labelled by the builder and not sourced: reel Long CT tier, Shin-Zantetsu/Magicide/Clean Slate CT tiers, Auto-Life targeting, the re-aiming rule for a payload meant for the other side.
- An autopilot or auto spin is a blind roll, about 9 in 10 a Dud. No shipped strategy opens a reel.
- Builder commits are co-authored as Claude Sonnet 5.5, not the Opus line some briefs name; harmless.

### sin-advisor
- Swordplay hits are marginal under load. In the checker's XVII run the first Swordplay (Spiral Cut) took 3 Enters, all logged 0.1 to 0.8 points just outside the gold zone, yet the engine recorded success true. `pressLog.inZone` is an estimate and `engine.extra` is the truth.
- The one `minigameConfirm` fallback Enter in the XVII run was Lulu's Fire Fury (turn 180), an overlay deliberately left on the old Enter-after-3-s path, not a stray press on a Bushido or Swordplay overlay.
- Not re-measured by the checker: the XVIII 200-seed link-4 bench (code unchanged), the worker-path v3/v4 reads. The full suite is this integration's, and it passed.
- Chapter XVII still does not reach the 90% bar as one chain: Genais's Sigh on link 3 is the largest remaining loss. Eye Drops or Esuna in the Sin preset is a data change that needs Bailey's yes.

### mix-polish
- Paine's dressphere changes get no shot in Ch XI and Ch XVI (shotMs 0, the PR-0309 clean-frame check), the same as the control.
- FFX-2 Ch IV at 2000x1012: a KO'd Yuna lies 100% under the 'ACTS NEXT' Bahamut intent card. The control does the same. PR-0318 only avoids the status rows, so this is not new.
- `BattlePresenter.ts` (703) and `CommandMenu.ts` (626) were already over the 400-line rule on main (698 and 622). The branch adds 5 and 4 lines.
- Each dressphere change with the shot up now takes about one second longer. The builder already put this to Bailey.
- PR-0315 is done but not shown fixed: the double image could not be reproduced on this build with the pin off.
- The roughly 5 MB twirl-key download at battle start, desktop full tier only, is confirmed by request count.

### portraits-live (from the brief)
- Disclose the pale iris edge on Yuna X-2 and Wakka (the checker's finding; the parts are Bailey's D-320 picks, a re-pick is Bailey's).

## For Bailey (gathered from the lanes)

- **scenes:** Ch IV's mirror seam is the one to look at: crop `seam-iv-idle-2560-left-main-vs-branch.jpg` in `docs/screenshots/r37-scenes/check`. Choose between a darker or fading wing, a painted plate extension (art lane), or accepting the doubled lantern. At 16:9 and 1440x900 nothing changes. Ch XIII is not fixed by this branch and showed no edge band on main; whether it needs anything is your call. The handoff's four questions stand (PR-0301 seam openings, the 0.7 s card, the wing seam, the baked glow).
- **small-approved:** D-247: did you mean Chapter III's Talk beat (Braska's Final Aeon), or the Macalania Woods pursuit that the decision text names? More beats on the small card is one name in `SMALL_CARD_BEATS`. The title cue now plays only from the sprite and is silent if the sprite is slow to load: acceptable, or keep the arcade synth as a fallback? Four builder questions stay open: PR-0289, PR-0032, PR-0329, and whether the Mix and Grand Summon rows should also drop "timed input".
- **living-backdrops:** the defocus is 0 at rest and only appears while the camera drifts; leave it so, or constant and light at rest as the approved frame has it? The foreground snow bank from the approved target is still not built; it needs a depth-ordering decision and a mockup first.
- **lady-luck:** the pay table matches research 3.12 for all 432 stops, in a real fight with the keyboard, under Wait and Active ATB; the shipped Chapter V line does not move (188/200 before and after). Look at the reel overlay hidden behind the guide card (a small z-order fix for the visual pass) and at the Trigger Happy side effect (faithful, but human Gunner players do less damage than live unless they mash about 14 or more times).
- **sin-advisor:** Chapter XVII's card chain went from about 4% to about 48% on the same bench by playing the sensible line's priorities; nothing about Sin or the Fins changed (D-282 untouched). If you would rather the card teach the old, harder line, the changes are in one commit, e9ac8010. Decision: add Eye Drops or Esuna to the Sin preset for Genais's Sigh (a data change, needs your yes)? The builder's commit trailers say Claude Sonnet 5.5, not the Opus 5.5 the brief asked for.
- **mix-polish:** pacing of the held shot: it holds to the full 1.6 s; the alternatives are to shorten `HeldShots.MIN_HOLD` to the twirl's 0.8 s or keep the old half-second cut. Whether the phone should get the dressphere shot is undecided (closed there now). Flux's crown headroom (PR-0317) lives in the action camera's push and the lens shift, and is yours to pick. Next-batch candidates: Paine getting a shot, a KO'd body clear of the enemy-intent card.
- **ui-floor (not merged):** the FFX-2 first-run coach clipping is the first thing a new player sees in Chapter IV at the two most common desktop sizes, so it should be fixed before that lane merges. TEXT SIZE takes 1, 1.15 or 1.3.
- **portrait parts:** they must be installed into the release tree's `public/art/portrait-parts/` at the cut (about 3.08 MB; see above), or the live pause logs two 404 console errors.

## Decisions delivery updated in this commit

`docs/target/decisions.json`: D-216, D-248, D-247 and D-335 now read `delivery: implemented` (built on rel37-int, not deployed; D-247's
chapter question is open); D-249 stays `in-progress` with the Q12 build (be8e4bea, FFX-2 Chapter XI only) noted, Q11 still owed.
`tests/unit/critic-policy-adoptions.test.ts` passes (12 tests).

## Layout facts

Files over 400 lines that the lanes grew or crossed (house rule 7) are listed in the lane disclosures above; the integrator wrote no source code.
