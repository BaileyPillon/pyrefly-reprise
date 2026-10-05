# r37-hotfix: paper preflight (critic-plan class DEEP after deploy, focused review before)

Two findings of deep round 20 (live release 37, main `cd9dbbb0`, verdict HOLD), one branch `r37-hotfix` from `origin/main`
(`4b7adea6`; `src/` is byte-identical to release 37). **Game case: FOC37-02 is FFX-2 only** (Trigger Happy is the Gunner's
X-2 ability; nothing under `src/battle` or `src/ui/ffx` changes). **PR-0341 is FFX only** (the Cavern of the Stolen Fayth,
Chapter IX; the one shared line is a one-line mark in `BattleScreen.ts` that every other scene ignores). Neither is the
save-data class (no `SaveData.ts`, no schema, no settings).

Written alongside the first build, not before it: the brief put the fix first. Every row below was then checked by running.

## What changes, and what could go wrong

| Change | Failure it could cause | How it is bounded |
|---|---|---|
| Trigger Happy listens to the pad (`RawInputWatcher`, button 5 = `Input.PAD_MAP` `r1`) and to `pointerdown` on the slab, beside its `keydown` | A press counted twice; a press counted behind the pause; a held R1 read as a stream | One route per device, each tagged with its device; `rawInputSuspended()` gates all three; the watcher is edge-detected (a held button is one press). `tests/unit/ui-ffx2-trigger-happy-input.test.ts` |
| The slab takes pointer events and rises to `z-index: 15` | It covers a HUD card for the 1.8 to 2.6 s the window is open; a layer above it still takes the tap | Measured on a 390x844 touch context: under release 37 the enemy-intent card sat exactly on the slab (the slab was unreadable and untappable); below the phone's pause chip (40). The Lady Luck reels' slab keeps the layer it had |
| The overlay names `R`, `R1`, `TAP` (or `CLICK`) by the input in use | A wrong guess before the first press | The guess is the one the other HUD hints make (coarse pointer, else a connected pad, else the keyboard); the first press corrects it |
| An input with no route here never answers 0 (the release-36 roll, `rollTriggerHappy`) | Free hits | Only fires when the active device has no route in this browser (no Gamepad API for a pad, no Pointer Events for a finger); with all three routes present it cannot fire; an untouched window is still 0 and Enter still counts nothing |
| Cavern: a hurried opening waits for nothing (`openingMark.ts`, `ArrivalWait`) | The arrival stops playing for a first-time player; the wait changes for the skip speed | The mark is set only when `opts.openingHurry` (PR-0061); a scene played through, a retry and the skip speed take the same path as before (measured: the tapped-through scene's arrival timeline equals release 36's and 37's to within 50 ms) |
| `ArrivalWait` replaces three closure variables in `cavern-stolen-fayth.ts` | A behaviour slip in the wait | The logic is the same three states, now pure and pinned by `tests/unit/chapters/cavern-hurried-arrival.test.ts` |

## What is not touched

The engine, the seeded RNG, every number, the unattended path (autopilot battle-log digests identical on Chapters IV and V, seeds 1
and 2), `src/app/Input.ts`, `src/ui/ffx/rawInput.ts`, Lady Luck's reels (`LadyLuckReels.ts` keeps its keyboard-only listener and
its z-order: a visual-pass item, not this branch), the arrival's own timeline and look.

## Review asks (focused before deploy, deep after)

1. FFX-2 Chapters IV and V, seed 1: keyboard R x3 = 3 hits and x12 = 12; a pad R1 x3 = 3; a 390x844 touch context with 3 taps = 3; the
   overlay names the key for the input; Enter still counts 0; the autopilot digests do not move.
2. FFX Chapter IX at 1600x900 and 2000x1012, seed 1, held-Enter skip: Yojimbo, Daigoro and Ginnem drawn in the first three frames after
   `awaitingMenu`, 3 of 3 runs; and with the scene tapped through, the night-sakura arrival still plays before the first menu.
3. CHK-020/021: the case is written (FOC37-02 FFX-2 only, PR-0341 FFX only) in the handoff and each commit.
