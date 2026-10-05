# r37-hotfix: FOC37-02 (Trigger Happy's three inputs) and PR-0341 (Chapter IX's first menu), after deep round 20

**Branch:** `r37-hotfix` (from `origin/main` `4b7adea6`, whose `src/` is byte-identical to live release 37, `cd9dbbb0`). Not merged, not deployed.
**Why:** `critic/rounds/round-20.json` says HOLD on FOC37-02, a major regression against release 36, and files PR-0341 (major,
unconfirmed) beside it. **Game case:** FOC37-02 **FFX-2 only** (Trigger Happy is the Gunner's X-2 ability, `research/ffx2-combat-core.md`
3.1); PR-0341 **FFX only** (the Cavern of the Stolen Fayth, Chapter IX; the one shared line is the mark in `BattleScreen.ts`, which
every other scene ignores). Every commit says its case. **critic-plan class** (`node tools/critic-plan.mjs --paths <the changed
files>`): **DEEP, after deploy** (focused review of the production candidate before the deploy; live verification, then the deep
review on the live build); **not the save-data class**. "Because 36 substantial checkpoints since the last deep review" is the plan's
own reason; each fix alone classes the same. Paper preflight: [docs/plans/r37-hotfix-review.md](../plans/r37-hotfix-review.md).

All browser numbers below are real input, headless Chromium (`PYREFLY_BROWSER=gpu`), against the **deployed bytes** of release 37
(`D:/pyrefly-rel37/dist-release`, bundle `BGBDEn_P`) and of release 36 (`D:/pyrefly-rel26c/dist-release`, `GO0eMOto`), and against a
production build of this branch (`vite build` into scratch, bundle `DhiL5vEz`), each served by `vite preview` on its own port.
Scripts, raw run files and frames: `D:/Tools/pyrefly-scratch/2026-10-03/r37-hotfix/` (`th-routes.mjs`, `pr0341.mjs`, `digest.mjs`,
`out/`). Evidence frames in the repo: `docs/screenshots/r37-hotfix/`.

## FOC37-02: Trigger Happy counts presses, and only the keyboard could press

**What round 20 found (and I re-measured on the deployed release 37, Chapter V, seed 1):** the press count decides the damage since
release 37, but `TriggerHappy.ts` heard only a `window` `keydown` of R / PageDown, said `MASH R1` to everyone, and had no pointer route
(its host layer is `pointer-events: none`); a pad's R1 is polled and dispatches no key event. Enter x3, pad R1 x3 and three touch taps
each gave `extra.trigger.hits` 0 and a single 118 or 119 hit.

**What is built** (`src/ui/ffx2/TriggerHappy.ts`, `src/ui/ffx2/minigames.css`):

| Input | Route | The overlay says |
|---|---|---|
| keyboard | `keydown` of `KeyR` / `PageDown`, the keys `Input.KEY_MAP` gives `r1` (unchanged) | `MASH R` |
| gamepad | button 5, `Input.PAD_MAP`'s `r1`, polled by the shared `RawInputWatcher` (`keyboard: false`, as FFX-2's own command menu uses it) | `MASH R1` |
| touch / mouse | `pointerdown` on the slab (the slab takes pointer events back from its host layer) | `MASH TAP` / `MASH CLICK` |

- The words follow the input in use: the device last pressed with, and before the first press the guess the other HUD hints make
  (touch screen, else a connected pad, else the keyboard). `data-input` on the slab names it for tests.
- One press per press on every route (a held key or a held R1 is one press); all three are gated by `rawInputSuspended()` (the pause);
  the pad watcher and both listeners are released when the window closes or on `cancel()`; the slab stops taking pointer events at once.
- **The guard the brief asked for:** an input with no route in this browser (no Gamepad API for a pad, no Pointer Events for a finger)
  never resolves to a silent 0; it takes the release-36 roll (`rollTriggerHappy`, 6 to 16). With all three routes present it cannot fire;
  an untouched window is still 0, and Enter still counts nothing (it is not the bound button).
- **One finding the brief did not name, needed for touch to be real:** on a 390x844 phone the enemy-intent card sat exactly on the
  Trigger Happy slab (both are in `#ui`'s stacking context; the card is `z-index: 2`, the slab had none), so the slab could be neither
  read nor tapped (`foc37-02-phone-before-after.jpg`, left). The slab is now `z-index: 15` (above the intent card 2, guide 3, advisor 4
  and the phone's guide chip 12; below the pause chip 40), and `document.elementFromPoint` at its left, centre and right is the slab
  (under release 37 the topmost element there was the intent card's `span.eint__amt`). This is a visible change: for the 1.8 to 2.6 s
  the window is open the slab is drawn over the guide / intent card on desktop too. FFX hides the guide card for its overlays
  (`overdriveFocus.ts`); I raised the slab instead because it needs no new rule. Bailey's call if he prefers the other.

**Measured, Chapter V (`ffx2-vegnagun-shuyin`), seed 1, Yuna a Gunner, Skill > Trigger Happy**; hits are `extra.trigger.hits` on the
command's `action-start`, "landed" the damage events Yuna's action then dealt:

| Route (presses) | Release 37 deployed | This branch | Overlay words (branch) |
|---|---|---|---|
| keyboard R (3) | 3 (landed 3) | **3** (3) | `MASH R` |
| keyboard R (12) | 12 (round 20) | **12** (12) | `MASH R` |
| pad R1, standard mapping button 5 (3) | 0 (landed 1, 118) | **3** (3) | `MASH R1` |
| pad R1 (12) | not run | **12** (12) | `MASH R1` |
| touch taps, 390x844 `hasTouch` + `isMobile` (3) | 0 (landed 1, 119) | **3** (3) | `MASH TAP` |
| touch taps (12) | not run | **12** (12) | `MASH TAP` |
| mouse clicks on the slab, 1600x900 (3 / 12) | not run | **3** / **12** | `MASH CLICK` (it starts as `MASH R` on a mouse-and-keyboard machine) |
| Enter (3) | 0 (landed 1, 118) | 0 (landed 1, 119): not the bound button | `MASH R` |

Chapter IV (`ffx2-bahamut`), this branch: keyboard R x3 = **3**, x12 = **12**, pad R1 x3 = **3**, touch x3 = **3**; the words are the
same. (The 12-press runs press at about 30 ms a press; a slower pace simply leaves the 1.8 s window sooner, which is the rule.)

**Autopilot digests, identical** (the unattended path through the real page: `gotoChapter(id, { auto: 'intended', speed: 'skip' })`,
sha256 of the whole battle log; release 37 deployed = this branch):

| Chapter, seed | Events | Digest (first 8 .. last 4) |
|---|---|---|
| IV, 1 | 2042 | `ec2eab04..7dc2` |
| V, 1 | 1434 | `e9240ffe..a52a` |
| IV, 2 | 2127 | `d5fb0717..e94c` |
| V, 2 | 1160 | `4534749b..9087` |

The engine and the seeded RNG are not touched (nothing under `src/battle` or `src/engine` changed). `random` is unseeded by design
(`Math.random`), so it has no digest; `attack` against Bahamut did not finish inside 9 minutes in either build (not investigated, not
this branch's).

**Tests** (`tests/unit/ui-ffx2-trigger-happy-input.test.ts`, 23): each route as the page drives it (real `KeyboardEvent`s, a stubbed
`navigator.getGamepads()` polled from `requestAnimationFrame`, `PointerEvent`s on the slab); the bound button pinned against the real
`src/app/Input.ts` (the keys that press are exactly the keys `Input` reports as `r1`; the pad buttons likewise, 0 to 16); the words per
input; the pause; the guard; teardown; the CSS rule. **13 of the 23 fail against the old `TriggerHappy.ts`** (checked by swapping the
file back and restoring it). The 5 existing tests in `ui-ffx2-trigger-happy.test.ts` pass unchanged.

## PR-0341: Chapter IX's Yojimbo and Daigoro were not drawn at the first menu

**Reproduced first, as the brief asked** (`pr0341.mjs`: every staged actor's `alpha`, `visible`, highest material opacity and
`stage.projectRect` every 50 ms from the moment the battle screen is up; fresh profile, seed 1, the critic's held-Enter skip; aligned to
the first `awaitingMenu`). Alpha at the first three frames after `awaitingMenu`, three runs at each size:

| Build | 1600x900 | 2000x1012 | When Yojimbo / Daigoro reach alpha 1 |
|---|---|---|---|
| Release 36 deployed | 3 of 3 drawn | 3 of 3 drawn | 8.5 / 9.0 s **before** the first menu |
| Release 37 deployed | **0 of 3** (Yojimbo 0, Daigoro 0, Ginnem 1) | **0 of 3** | 6.1 to 6.6 s / 5.6 to 6.1 s **after** the first menu |
| This branch | **3 of 3 drawn** (1 / 1 / 1) | **3 of 3 drawn** | never hidden |

It reproduces in 6 of 6 on release 37 and 0 of 6 on release 36, so release 37 introduced it. The host was **not idle** (other agents'
suites, servers and browsers were running; the lanes were listed in the process table), but a 4 to 6 s gap against a 0 of 6 / 6 of 6
split is not load.

**Cause (traced; the two suspects in the issue are cleared).** Not the Ginnem glow layer and not the A-7 backdrop: Ginnem is alpha 1
throughout. `cavern-stolen-fayth.ts` holds Daigoro and Yojimbo at alpha 0 ("not yet summoned") until a **rendered frame** has the
camera within 1.2 of the scene's `intro` rig, or `ARRIVAL_FALLBACK_MS` (9 s) after they are staged. Release 37's hurried opening
(PR-0061, the player skipped the pre-scene) cuts to `intro` and on to `idle` inside one tick, so no frame ever shows the opening shot
(`pr0341-cam.mjs`, per-frame camera: release 37 closest approach **2.439**, 0 frames within 1.2; release 36 closest **0.056**, 74
frames within 1.2). The first menu opens 4.6 to 5.6 s after staging, the 9 s fallback fires 5.5 to 6.6 s after that, and the blue
night-sakura tree and veil (the arrival) then plays in the middle of the first turn: that is also what the round's V20-02 frame shows.

**Fix** (`src/scenes/openingMark.ts` new, `cavern-stolen-fayth-arrival.ts`, `cavern-stolen-fayth.ts`, one line in `BattleScreen.ts`):
`BattleScreen` marks the loaded scene when `opts.openingHurry` is set, before anything is staged; the Cavern takes the mark when it
first sees the fight's figures and waits for nothing: they are on the field when the menu opens and the arrival is not played (a
hurried opening collapses every wait, the arrival among them). The wait itself is now the pure `ArrivalWait` (hold / go / rest).
Release 36's path is untouched: a scene played through, a retry and the skip speed behave as before.
The Cavern is the only scene that waits on the opening shot (a search of every `rigs.intro` use and every `onBeforeRender` probe
under `src/`: the others only snap a debug camera to `intro`), so no other chapter can be hidden at a hurried first menu this way.

**Measured on this branch:** the table above (alpha 1 at `+0/+1/+2` frames, 6 of 6; `yojimbo` and `daigoro` alpha 1 from the moment
they are staged), and the regression check: with the scene **tapped through** (not hurried) the arrival still plays and ends the
same way on all three builds (Yojimbo full 8.46 / 8.51 s before the first menu on this branch, 8.46 s on release 36, 8.50 s on
release 37; `fix-tap-*`, `r36-tap-*`, `r37-tap-*`). Frames: `pr0341-first-menu-1600x900.jpg`, `pr0341-first-menu-2000x1012.jpg`.

**Tests** (`tests/unit/chapters/cavern-hurried-arrival.test.ts`, 10): `ArrivalWait` (holds while the card is up, goes on the opening
shot, falls back at 9 s, a hurried opening waits for nothing and never "goes" late, a retry waits again, nothing before a fight),
`openingMark` (once, per scene), and the wiring between the three files. The scene factory cannot be built under jsdom (it paints
canvases), hence the pure class.

## Re-run recipe (everything above is reproducible from scratch)

From the worktree, with the `node_modules` and `public/art` junctions in place (`public/art` read-only; do not use `npm run build` for a
scratch build, its prebuild rewrites `public/art/manifest.json` through the junction):

```
node node_modules/vite/bin/vite.js build --outDir D:/Tools/pyrefly-scratch/2026-10-03/r37-hotfix/dist-hotfix      # this branch
node node_modules/vite/bin/vite.js preview --outDir <a dist> --port 6601 --host 127.0.0.1 --strictPort            # 6601 rel37, 6602 rel36, 6603 branch
cd D:/Tools/pyrefly-scratch/2026-10-03/r37-hotfix   # then, with PYREFLY_BROWSER=gpu:
node th-routes.mjs --port=6603 --label=fix --chapter=ffx2-vegnagun-shuyin --route=key|enter|pad|touch --presses=3|12
node pr0341.mjs --port=6603 --label=fix --size=1600x900 --run=1 [--tap]      # --tap: the scene tapped through, not hurried
node summarize-pr0341.mjs [filter]                                            # one line per run: alpha at +0/+1/+2 frames
node pr0341-cam.mjs --port=6602 --label=r36                                   # per-frame camera against the intro rig (the cause)
node digest.mjs --port=6603 --label=fix --chapter=ffx2-bahamut --strategy=intended --seed=1
```

The deployed bytes to compare against are `D:/pyrefly-rel37/dist-release` and `D:/pyrefly-rel26c/dist-release` (served read-only).
The 12-press runs must press at human mash speed (the scripts use about 30 ms): a slower pace leaves the 1.8 s window sooner, which is
the rule, not a defect (a first pass at 150 ms a press read 3 and 4 hits for that reason).

## Gates

- `node node_modules/typescript/bin/tsc --noEmit`: clean.
- Targeted: the two new files (33 tests), `ui-ffx2-trigger-happy`, the cavern suites (`cavern-scene`, `cavern-arrival-framing`,
  `cavern-hold-bottom`, `ginnem-glow`), `flow-opening-hurry`, `opening-hurry`, `presenter-opening-skip`: all pass.
- `node tools/orphans.mjs`: 24 orphaned, the same 24 as on `origin/main`; `openingMark.ts` is reachable.
- Full suite (`vitest run --maxWorkers=3 --testTimeout=60000`, once, at the end, in this worktree, junctions in place): **770 files passed,
  5 skipped (775); 11,306 tests passed, 41 skipped, 1 todo; 0 failed; exit 0; 754 s** (the host was busy with other agents' runs).
- House rule 7: `TriggerHappy.ts` 222 lines (was 140), `openingMark.ts` 34, `cavern-stolen-fayth.ts` 381 (was 383), `cavern-stolen-fayth-arrival.ts`
  375 (was 335); `BattleScreen.ts` was already over (925 to 927).
- No contract file touched (`docs/CONTRACTS.md`'s list), so no `CONTRACT-CHANGES` entry.

## Left (not done, for the driver)

1. **Lady Luck's reels overlay has both of these flaws** (keyboard-only `keydown`, Enter / Space / Z / NumpadEnter; drawn under the
   guide card on desktop; on a phone, by the same stacking, it should sit under the intent card too, which I did not measure). The brief said to leave r37-lady-luck's work alone, so
   `LadyLuckReels.ts` and its z-order are untouched; the fix has the same shape (pad via the watcher, `pointerdown`, a layer above
   the cards) and `.ffx2hud__minigame` is the host both share.
2. **The label is small on a phone**: `MASH TAP` is the shell's subtitle, computed 5.33 px and drawn 37 x 6 px at 390 wide (measured on
   the branch); it is the size `MASH R1` always had. A legibility change is Bailey's to see, so none was made.
3. The slab now draws over the guide / intent card while it is open (the FOC37-02 note above): visible, so worth Bailey's eye.
4. PR-0341 covers the **hurried** opening. A player who presses Confirm during a normal opening, after the first opening frame, still
   gets the arrival's own 1.3 s (the arrival has started and runs on): unchanged from release 36, not reproduced, not touched.
5. A pad R1 already held when the window opens counts once (a held key's repeat does not); negligible, not handled.
6. Deploy and the focused review of the production candidate are owed by the driver (class DEEP); nothing was deployed or merged.
