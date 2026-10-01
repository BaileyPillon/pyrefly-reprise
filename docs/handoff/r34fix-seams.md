# r34fix-seams: the FFX-2 chain seams of deep round 18b (PR-0300, PR-0301)

Branch `r34fix-seams`, from `95e62e38` (rel34 before the audio fold). Status: **PR-0300 fixed**,
**PR-0301 diagnosed** (all of it comes from two approved picks, so nothing was changed; three
questions for Bailey below).

Harness (scratch, not product code): `D:/Tools/pyrefly-scratch/2026-10-01-rel34/seams/seam.mjs`.
Headless Playwright, `PYREFLY_BROWSER=gpu`, a dev server of this worktree on port 5440. It plays the
chapter by **real keys** (Enter picks the first row and confirms the target) with one labelled
injection: at each open decision every living enemy is set to 1 HP (party under 50 % refilled), so
each link reaches its seam in a few turns. It records the presenter phase at rAF resolution
(`moment:battle-start` start and end), seam to first open menu, and a burst of screenshots after
each link change with the rightmost column whose mean luma is above 6, as a fraction of the width
(the round's acceptance metric). `--stop` keeps a girl Stopped through the seams (labelled
injection, the round's Stop lane). Outputs: `.../seams/out/<tag>-<chapter>-<size>-s<seed>/run.json`.

## PR-0300: black right-edge band at the Chapter XV seams. FIXED (e55cbf40)

**Reproduced on 95e62e38** (XV, 1600x900, seed 1): seam 1->2 and 2->3 both, 7 of 10 frames under
95 %, worst 0.79 (the round's 21-25 % band), at 0 to 1.5 s and again at 3.2 to 4.3 s.

**Cause, bisected by look** (`?fx=`, same lane): off 0.997, `a` 0.993, `b` 0.996, `c` 0.904,
`a,c` 0.79. Eye-candy C's victory arc (C9, `SpectacleFx.victory`: -12 degrees of yaw, a rise and a
7 % push about the party centre, eased in over 2.2 s) was never let go: `orbit` stayed at k = 1 until
the screen was disposed. A single fight ends on the results screen so nobody saw it, but at a chain
seam the next link's opening and the whole next link were framed through the held arc, pivoting on
the old party centre. In XV that swings the floor plate's right edge into frame with black beyond.
CINEMA LIGHT's grade darkens the plate's dim edge further (0.90 -> 0.79). The calm camera is not the
cause (`?cam=current` shows it too, as the round found). Live 32 had no option C, hence full-bleed.

**Fix** (presentation only, rule 1 holds): `playOpening` (`src/engine/OpeningSkip.ts`, the one entry
of every opening, first link and each chained link) first calls `fxOpening`
(`src/engine/fx/c/presenterHooks.ts`), which asks the stage's option-C port to drop the held arc
(`SpectacleFx.opening`), whether or not C is on at that instant. The opening's own cut to its rig is
then the frame the player sees. The victory hold itself is unchanged (the arc still eases in and
holds through the victory beat and the seam gap).

**After** (same lane, real keys):

| Chapter | Size | Seeds | Camera | Frames under 95 % | Worst |
|---|---|---|---|---|---|
| XV | 1600x900 | 1, 2 | default (calm) | 0 / 324 | 0.989 |
| XV | 1600x900 | 1, 2 | `?cam=current` | 0 / 326 | 0.981 |
| XI | 1600x900 | 1 | default | 0 / 119 | 1.000 |
| VI | 1600x900 | 1 | default | 0 / 127 | 1.000 |
| XV | 2000x1012 | 1, 2 | default | 54 / 295, first 0.8 s only | 0.940 |
| XV | 2000x1012 | 1, 2 | `?cam=current` | 129 / 312 | 0.935 |

The 2000x1012 residue is **not this defect**: with every look off and the old camera and pacing
(`?fx=off&cam=current&pace=current`, which is live 32's presentation) the same seams sit at
0.945-0.953, i.e. the plate deck ends at about 94-95 % of a 1.98 aspect frame at the intro rig.
It is pre-existing scene geometry (`src/scenes/bevelle-underground.ts`, the scene XV borrows), a
hair under the round's 95 % line; CINEMA LIGHT's grade moves the dim edge from about 0.95 to 0.94.
Left open (see "Still open"), because widening an approved scene's plate deck is its own change.

Screenshot: `docs/screenshots/r34fix-seams-pr0300-xv-seam-1600x900.png` (before 95e62e38 / after,
seam 1->2 at +0 and +1.5 s; the after frame also shows Gippal's name plate, which the held arc had
pushed out of frame).

Tests: `tests/unit/fx-c-seam-orbit.test.ts` (a real `SpectacleFx`: the arc is still on the camera
4.8 s after the victory without the call; after `opening()` the camera sits exactly on its rig;
`fxOpening` reaches the port with C off and is a no-op without one; `playOpening` drops the arc
before the opening's first shot at normal and skip speed).

**Game case: both.** Shared presenter plumbing and option C (CHK-020): the held arc applied to every
chained fight in either game; the band was seen in FFX-2 Chapter XV (and VI).

Rule 7: `SpectacleFx.ts` stays at 399 lines (the `enabled` method went to one line to make room),
`presenterHooks.ts` 140, `OpeningSkip.ts` 60; no file over 400 grew.

## PR-0301: the FFX-2 seam opening runs longer than on live. DIAGNOSED, not changed

**Correction to the round's numbers first.** The round's `moment:battle-start` of 0.6-0.75 s on
live 32 against 2.9-3.1 s is the *tail* of the moment: its harness noted the moment only after the
3 s screenshot sequence it takes at each link change (`sSeamStop2.mjs` calls `g.seq(...)` before the
moment probe). Measured at rAF resolution from its start, the opening is about **3.8 s** with live
32's presentation and **6.0 s** on the candidate: the regression is real, **+2.2 s per seam**, and
seam to first menu grows by about +2.6 s (11.65 -> 14.2 s in XV), matching the round's +2.5-3 s.

**Per change, timed** (XV, 1600x900, seed 1, mean of seams 1->2 and 2->3, same lane):

| Configuration | Opening | Seam -> menu | Contribution |
|---|---|---|---|
| `?pace=current&cam=current` (live 32's presentation) | 3.80 s | 11.65 s | baseline |
| `?cam=current` (steady pacing on, D-294) | 4.18 s | 12.35 s | pacing **+0.38 s** |
| `?pace=current` (calm camera on, D-291) | 5.47 s | 13.42 s | calm camera **+1.67 s** |
| default (both, as shipped in release 33) | 6.02 s | 14.23 s | together **+2.22 s** |
| default, `?fx=off` (eye candy D off) | 5.98 s | 14.21 s | eye candy **0** |
| default, a girl Stopped through both seams (r33-fix PR-0281 path) | 6.02 s | 14.28 s | r33-fix tween change **0** |

Chapter XI confirms it: 3.82 s with `pace=current&cam=current` against 6.05 s default (one
earlier XI run read 6.56 s on seam 1->2 with a single screenshot in 600 ms, a load hitch; the repeat
read 3.84 s).

**Where the time goes.** The opening (`BattleMoments.battleStart`) is a run of camera moves: the
hold on `idle` (`openHold`), the push onto the boss (`revealPush`), the name plate, the release and
the move home (`returnOut` twice). The calm preset (`src/engine/CameraPreset.ts`) plays every rig move
at least 1.8 times as long (at least 700 ms, capped at 20 deg/s) and every held push 1.6 times as
long; steady pacing stretches FFX-2 waits by 1.1. Both apply to the opening exactly as they do to
the per-turn camera. Nothing waits on a tween or a fade that no pick asked for, so per the brief
nothing was changed. A Confirm press still ends the opening at once (PR-0061).

The same stretch applies to every FFX opening too (calm and steady are both-games picks; FFX steady
is x1.2), not only to FFX-2 seams; it is just most felt at a chain seam, where it repeats.

### askBailey (PR-0301)

1. The FFX-2 chain seam opening now takes about 6.0 s instead of 3.8 s (calm camera +1.7 s, steady
   pacing +0.4 s; Confirm skips it). Keep it as is?
2. Or keep calm for the turn-by-turn camera but play the **opening** at the old camera speed
   (about 4.2 s at a seam, both games), or at the old camera and pacing (3.8 s, as live 32)?
3. Or shorten only **chain seams** (first link keeps the full opening): for example drop the party
   slide and the push at a seam and show just the next boss's name plate (about 1-1.5 s, an
   estimate until built and measured)?

## Still open (not fixed here)

- **Wide-aspect plate margin in XV (pre-existing, not a regression).** At 2000x1012 the plate
  deck of `bevelle-underground` ends at about 94-95 % of the width for the first 0.8 s of a seam
  (default camera) and for most of the opening with `?cam=current`; the same with every look off.
  The round's PR-0300 acceptance line (95 % at 2000x1012) is therefore not met there by 0.5-1.5 %.
  A fix would widen the plate deck or clamp the intro rig at wide aspects: a scene change for its
  own lane, both games' wide-screen framing to be checked.

## Gates

`npx tsc --noEmit` clean; `tests/unit/fx-c-seam-orbit.test.ts`, `fx-c-spectacle.test.ts`,
`presenter-opening-skip.test.ts` pass; full `npx vitest run --testTimeout=60000`: 709 files passed,
5 skipped (10,614 tests); `node tools/orphans.mjs`: 24 orphans, all pre-existing, none added.
Dev server on 5440 stopped.
