# r34fix-tap-hint: the phone tap that killed a Zombie ally, and the cure-hint card (round 18b)

Branch `r34fix-tap-hint` from `95e62e38` (rel34 before the audio fold), worktree
`D:/pyrefly-fb-camera`. Not pushed, not merged, not deployed (the driver does that).
Issues: round 18b PR-0264 (major), PR-0302, PR-0303, PR-0304 (polish), full text in
`critic/rounds/round-18b.json` on main.

Evidence scratch (headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, dev server on port
5400, stopped afterwards): `D:/Tools/pyrefly-scratch/2026-10-01-rel34/tap-hint/` (`ev-before/`,
`ev-final*/`; the critic's own scripts `sF-flux.mjs`, `sO3b.mjs` copied there, plus
`sX2tap.mjs`; `sum.mjs` prints the tables below).

| PR | Outcome | Commit | Game case |
|---|---|---|---|
| PR-0264 | fixed | `3b3999e9` | both (shared target plumbing) |
| PR-0302 | fixed | `094c038e` | both |
| PR-0303 | fixed (with a placement departure from the O3 phone frame, see askBailey 1) | `4e80c662` | both in code; only FFX takes the fallback |
| PR-0304 | fixed (cause was not the suspected one) | `2a8ce0f7` | FFX-2 in effect, code shared |

## PR-0264: a tap on a dimmed target confirmed it (fixed)

**Before (reproduced on 95e62e38):** 390x844 touch, Ch I, Kimahri Items > Hi-Potion (aimed
at Tidus), one tap on Yuna's figure: Yuna 750 HP to 0, KO, no forecast, no warning.

**Fix:** `src/ui/common/touchTapAim.ts` keeps the type of the latest `pointerdown` (capture,
on `window`). A click within 1.5 s of a touch or pen press, at a candidate that is not the
aimed one, only aims it. Then the O3 guard rails show, the same as after a swipe or an arrow
key. A second tap on the aimed figure, or CONFIRM, Enter or the pad commits. The FFX menu
(`CommandMenu.tryConfirmTargetById`) uses this for the bracket tap and for the CTB tile tap.
The FFX-2 menu (the cursor's click) uses it too. This is what the phone's own hint says:
"Tap another ally to switch". The mouse, keys and pad are unchanged.

**After (real input):**
- FFX 390x844 touch: first tap on Yuna shows "HI-POTION -1000 KO", the red warning in the
  target card and `stwarn-go` on CONFIRM ("HI-POTION -> YUNA"). HP stays 750. A second tap, or
  the CONFIRM button, uses it (HP 0, as the engine says).
  Screenshot: `docs/screenshots/r34fix-tap-hint-1-ffx-phone-first-tap-aims.png`.
- FFX-2 390x844 touch, Ch IV, Item > Potion (aimed at Yuna): first tap on Rikku moves the aim
  ("POTION -> RIKKU", no action), and the second tap commits.
  Screenshot: `docs/screenshots/r34fix-tap-hint-2-x2-phone-first-tap-aims.png`.
- Desktop 1600x900, unchanged: the arrows show the forecast and HP stays 750. A mouse click on
  Yuna still confirms at once (HP 0). That is the fb-0929 `guard` option, still off; see
  askBailey 2.

**Tests:** `tests/unit/pr0264-touch-tap-aim.test.ts` covers the helper, the FFX-2 menu, and
that a mouse click is unchanged. The FFX-2 case fails without the fix. A touch case on a real
Zombie Kimahri board was added to `tests/unit/fb0929-zombie-warning.test.ts`.

## PR-0302: the cure hint under 14 px (fixed)

The stage card now floors its stage px at `15 / --lb-scale`. It only grows where it was small.
The floor is 15, not 14, because the rendered-size read (box over offsetHeight) loses up to
5 % on a 9-px head. The phone card is 14.2 px and follows TEXT SIZE (FFX `data-text-size`,
FFX-2 `data-text-size-wide`, off per D-220 Q4).

Head / body effective px (critic `sO3b.mjs`, real keys and taps):

| Size | Before | After |
|---|---|---|
| 390x844 FFX / FFX-2 | 9.0 / 10.9 | 14.4 / 14.3 |
| 390x844 FFX TEXT SIZE 115 / 130 | 9.0 / 10.9 | 16.6 / 16.4, 18.9 / 18.4 |
| 1280x960 FFX / FFX-2 | 10.2 / 12.1 | 15.2 / 14.9, 15.2 / 14.8 |
| 1600x900 both | 12.8 / 15.2 | 14.2 / 15.2 |
| 2000x1012 both | 14.4 / 17.1 | 14.9 / 17.1 |
| 1600x900 FFX TEXT SIZE 130 | | 18.5 / 19.7 |

Command rows covered: 0 at every size. The card fits its box (`scrollFits`) everywhere.
Screenshot: `docs/screenshots/r34fix-tap-hint-4-ffx-1280x960-hint-floor.png`.

## PR-0303: the hint over the phone tap line (fixed)

**Before:** FFX 390x844 target step. The card sat at [8,685,374x59] and the tap line at
[8,727,374x17], an overlap of 6,241 px2.

There is no room in that column at 14 px. The target card, the hint, the tap line and
Back/Confirm need about 280 px, and the panel under the chips has 286 px including the 38-px
bottom margin. So the hint now stays under the target card only when it fits above the tap
line (or the bar). Otherwise it keeps the command menu's slot just above the party chips, where
it already sat one step earlier.

**After:** 0 px2 over the tap line, CONFIRM, the target card and the forecast, at TEXT SIZE 100,
115 and 130. FFX-2 (shorter card) keeps the under-card slot with 0 overlap.

**Disclosed:** in that slot the card covers the bottom corners of the aimed bracket and the
figures' feet, as it already does at the command menu. The name plate, the hand and the
forecast stay clear (see screenshot 1).

## PR-0304: the FFX-2 hint gone at some girls' menus with the guide open (fixed)

**Traced by running it.** The suspected cause (a collapsed or empty guide panel) is not what
happens. FFX-2's ATB plays an action while a menu is open. A-15's fade
(`src/ui/ffx2/actionFade.ts`) then puts `ffx2-actfade` (opacity 0) on the guide's
`.sgd__stack`, and the hint is a child of that stack, so it fades too.

**Before:** 1600x900 keys, Ch IV, 8 sampled girls' decisions. Yuna (twice) and Rikku had no
visible hint, with the stack faded.

**Fix:** while the stack carries the fade class, a solo copy shows in the hint's own stage
slot (the guide-folded slot). The copy in the guide stays put, so the guide's fit and the
fade's own box never change, and nothing flickers.

**After:** all 8 decisions show the hint (5 in the guide, 3 solo), with 0 console errors.
The commit message says 9 (6 + 3). It is 8; there is no amend.
Screenshot: `docs/screenshots/r34fix-tap-hint-3-x2-1600x900-solo-hint.png`.

## Gates

- `npx tsc --noEmit`: clean.
- Touched and related vitest files: 10 files, 149 tests, all green.
- Full `npx vitest run --testTimeout=60000`: 709 files passed, 5 skipped; 10,619 tests passed.
- `node tools/orphans.mjs`: `touchTapAim.ts` is reachable, and the 24 orphans are older.
- Rule 7: `ffx/CommandMenu.ts` stays at 865 lines and `ffx2/CommandMenu.ts` at 622 (each
  import line came out of a merged import or comment). New files are under 400 lines.
- No engine file was touched (rule 1). The forecast numbers are the engine's.
- I stopped the server I started, on port 5400.

## askBailey

1. **PR-0303 placement.** The approved O3 phone frame (`o3-vs-build-ffx-phone.jpg`) draws the
   hint under the target card, over the "Tap another ally" line. The fix moves it, on FFX, to
   the menu slot above the party chips at the target step. Alternatives: (a) keep it under the
   card and drop the tap line while a hint is up; (b) a one-line hint at the target step; or
   (c) move Back/Confirm into the 38-px bottom margin (fits only at TEXT SIZE 100).
2. **Desktop mouse click on a Zombie ally** still confirms at once. That is fb-0929's `guard`
   option (`?zombiewarn=guard`), built and off. The phone now aims first. Should the mouse
   match?
3. **The phone tap is now aim-then-confirm for every target that is not aimed**, enemies
   included, as the hint has always said. A tap on the aimed figure still commits at once.

## Not done / noticed

- The phone target card's red warning (`.stwarn`) is 13 px and the desktop slab is 6.8 stage
  px (about 17 at 1600x900, about 13.6 at 1280x960). Neither is in these PRs, so I left them.
- The fb-0929 `guard` and `word` options are unchanged and still off.

## Check (independent, 2026-10-01)

I did not build this. I checked `r34fix-tap-hint` at `5bedfa52` against base `95e62e38`. Each
base number below I reproduced myself on a `git archive` copy of `95e62e38`. Method: headless
Playwright, `PYREFLY_BROWSER=gpu`, seed 1, real keys and taps, and the critic's own `sO3b.mjs`
and `sA-firstrun.mjs`, plus my scripts `sTap.mjs`, `sX2solo.mjs` and `sX2tap2.mjs`. The dev
servers were on ports 5411 (base) and 5410 (candidate), one at a time, and both are stopped.
Evidence is in `D:/Tools/pyrefly-scratch/2026-10-01-rel34/chk-tap-hint/` (`ev-base*`, `ev-cand*`).

**Verdict: one blocker.** The four fixes hold, but PR-0302 brings in a regression against base.

### BLOCKER: on the FFX desktop, the guide panel now covers the first command row

At 1280x720 and 1280x960 the larger in-guide hint makes the guide panel taller. Its MORE
footer, and at TEXT SIZE 115 and 130 the panel itself, then lie over the first command row
(TALK at Kimahri's Zombie menu, the first item row at the target step). Measured by
`guideVsCmd` (overlap of `.sgd__stack` / `.sgd__panel` / `.sgd__more` with each `.ig-cmd`),
Ch I, decision 3:

| Size | Base | Candidate |
|---|---|---|
| 1280x720 | 0 | 3,649 px2: MORE over the top 14 px of TALK; a tap there lands on `sgd__more` |
| 1280x960 | 0 | 3,649 px2: the same |
| 1280x960 TEXT SIZE 115 | 0 | 7,374 px2: the panel reaches 43 px into TALK, and its centre point is `sgd__more` |
| 1280x960 TEXT SIZE 130 | 0 | 9,490 px2: the TALK label is hidden under the guide |
| 1600x900 TEXT SIZE 130 | 0 | 1,591 px2 (a 3-px sliver) |
| 1920x1080 TEXT SIZE 130 | 0 | 350 px2 (a hairline) |
| 1600x900, 2000x1012, FFX-2 1280x960 | 0 | 0 |

Side by side: `ev-base2/o3-ffx-1280x960-ts130/10-menu-hint.png` (TALK clear) against
`ev-cand2/o3-ffx-1280x960-ts130/10-menu-hint.png` (TALK under the panel). The critic's
`maxCovered` stays 0 because it measures only the hint's own box against the rows, not the
guide that holds it. The game case is FFX only (FFX-2 measured clear). This breaks the
PR-0302 acceptance ("no overlap ... command rows") and the PR-0282 rule, and it is a
regression against live in the changed area.

### The four PRs, as I re-ran them

- **PR-0264: fixed (FFX and FFX-2 by touch).**
  - Base, 390x844, FFX: one tap on the dimmed Yuna took her from 750 HP to 0 (KO). There was
    no forecast and no warning.
  - Candidate, 390x844, FFX: the first tap aims her. The forecast "HI-POTION −1000 KO", the
    `.stwarn` in the card and `stwarn-go` on "HI-POTION → YUNA" all show, and HP stays 750.
    A second tap on the figure, or CONFIRM, uses the potion (HP 0, the engine's own result).
    BACK leaves HP at 750.
  - Pausing at the aimed step (tapping the pause chip) covers the hint. Resuming keeps the
    aim and the HP.
  - FFX-2, 390x844, Potion: the first tap on Rikku only aims her, and the second commits
    (`yuna>rikku:Potion`).
  - The desktop mouse is unchanged in both games: a click commits at once (FFX Hi-Potion on
    Zombie Yuna: HP 0), as stated (askBailey 2).
- **PR-0302: fixed for the hint itself.** Head / body px matched the builder at every size I
  measured:
  - 390x844, both games: 14.4 / 14.3.
  - FFX TEXT SIZE 115 / 130: 16.6 / 16.4 and 18.9 / 18.4.
  - 1280x960: 15.2 / 14.9.
  - 1600x900: 14.2 / 15.2.
  - 2000x1012: 14.9 / 17.1.
  - 1280x720: 15.2 / 14.9.

  The card fits its box everywhere. See the blocker above for the guide around it.
- **PR-0303: fixed.**
  - Base: 6,241 px2 over the tap line.
  - Candidate: 0 over the tap line, CONFIRM, BACK, the target card, the forecast and the
    warning, at TEXT SIZE 100, 115 and 130 and with REDUCE MOTION on.
  - FFX-2 phone: 0. It keeps the under-card slot.
  - The placement departure from O3 is still Bailey's call (askBailey 1).
- **PR-0304: fixed.**
  - Base, 1600x900: 2 of 9 sampled decisions, plus the ATTACK menu, had no visible hint.
    Base, 2000x1012: 1 of 9.
  - Candidate, sampled every 150 ms over about 2 minutes of play: at 1600x900, 1 of 244
    open-decision samples had no hint (59 had the solo copy). At 2000x1012, 2 of 185. With
    REDUCE MOTION on, 2 of 152.
  - The gaps are single frames as the guide stack fades back in after the solo hides. I am
    noting them, not filing them.
  - The solo copy never met an acting figure's zone, the advisor, the command stack or the
    boss bar. It touched the enemy-intent panel's left edge in 1 or 2 samples (up to 282
    px2, under 3 px).
  - It never shows with BATTLE HELP OFF.
  - The pause covers it (`pause-with-solo.jpg`).

### Neighbouring flows

- **First-run O2 (FFX, 390x844 touch, fresh profile).** Steps 1 to 3 run as before.
  - Ch I has two enemies, and ATTACK opens aimed at Mortiorchis, not Seymour Flux.
  - A new player told "Tap ATTACK, then tap who it hits" who taps Seymour now only moves the
    aim. A second tap attacks, where before one tap did.
  - This matches the target hint ("Tap another enemy to switch"), but the first-run line
    reads as one tap. It is an owner question (it extends askBailey 3).
- **FFX-2 chain seams.** `sSeamStop.mjs ffx2-fallen-aeons`: 2 seams, 0 stalls, the fight
  reached the results screen, and there were 0 console errors.
- **BATTLE HELP OFF** (FFX and FFX-2 phone, FFX-2 desktop): no hint and no solo copy.
- **REDUCE MOTION** (FFX phone, FFX-2 desktop): as with it off.
- **TEXT SIZE 115 / 130:** see the tables. The only problem is the blocker.
- **A transition note, not a regression.** On the FFX-2 phone, one sampler frame (about 200 ms)
  had "Paine was cursed." over the newly docked hint before the line moved up.

### Gates (re-run by me)

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000`: 709 files passed (5 skipped), 10,619 tests passed.
- `node tools/orphans.mjs`: 24 orphans, all old; `touchTapAim.ts` is reachable.
- Rule 1: `git diff 95e62e38..5bedfa52 -- src/battle src/engine src/app` is empty, and
  `SaveData.ts` and the settings schema are untouched.
- Rule 7: `ffx/CommandMenu.ts` is 865 lines and `ffx2/CommandMenu.ts` 622, the same as base.
  The new files and the touched files are under 400.
- Rule 14: every commit names its game case.

### Re-measured "noticed, not changed" items (still under 14 px, not in these PRs)

- The FFX phone target card's `.stwarn` is 12.9 px.
- The FFX desktop red slab is 13.6 px at 1280x960.

### Also found (not product code)

`critic/runner/lib/route-ui.mjs` `confirmTarget` on touch taps the wanted figure once and
returns `confirmed: true`. After PR-0264 that tap only aims when the figure is not already
aimed, so touch routes in the review runners will need a second tap or a CONFIRM tap. If they
do not get one, a touch review can stall or misreport its picks.

## Repair (2026-10-01, the check's blocker)

**Cause, measured on `1150fb8f`.** The FFX guide's rail is fixed (stage y 44 to 115, 71 grid px).
`StrategyGuide.refit` counts the in-guide hint as chrome and always shows at least its first block.
At 1280x960 and TEXT SIZE 130 the floored hint was 71 px tall, the whole rail, so the slab
(130 px) and the MORE row ran down over TALK. TEXT SIZE also scales the guide's column, so the
15-px floor was multiplied a second time: 19.7 rendered px where 15 was the goal.

**Fix (one commit, no revert).** Two parts:

1. `status-o3.css`: inside the guide, the floor is divided by `--pyr-ts`. The card reads
   max(its O3 size x TEXT SIZE, 15 px). At 1600x900 and wider that is exactly base's in-guide card.
2. `statusHintCard.ts` `guideOverCommands`: after the card is placed, and before the frame paints,
   rendered rects check whether the guide's slab or MORE row reaches a command row under the
   column. If so, the card carries the rule's one-sentence form, the form the phone card and
   the second hint already use. It is held for that card, so it switches once and never flickers.
   A new card, a resize or a TEXT SIZE change starts from the full rule again.
   FFX-2 runs the same code but never trips it (measured).

**Re-run of the check's cases** (critic `sO3b.mjs` with the checker's `guideVsCmd`, headless
GPU, seed 1, port 5400, now stopped). Overlap of the guide with a command row, in px2. FFX is
Ch I decision 3, and the target step after it.

| Size | Base | Before repair | After (menu / target) | Hint head / body px | Form |
|---|---|---|---|---|---|
| 1280x720 | 0 | 3,649 | 0 / 0 | 15.2 / 15.2 | short |
| 1280x960 | 0 | 3,649 | 0 / 0 | 15.2 / 15.2 | short |
| 1280x960 TEXT SIZE 115 | 0 | 7,374 | 0 / 0 | 15.2 / 15.2 | short |
| 1280x960 TEXT SIZE 130 | 0 | 9,490 | 0 / 0 | 15.8 / 15.8 | short |
| 1600x900 TEXT SIZE 130 | 0 | 1,591 | 0 / 0 | 16.6 / 19.7 | full |
| 1920x1080 TEXT SIZE 130 | 0 | 350 | 0 / 0 | 19.9 / 23.7 | full |
| 1366x768 | | | 0 / 0 | 14.4 / 15.2 | short |
| 1600x900, TEXT SIZE 115 | 0 | 0 | 0 / 0 | 14.2 / 15.2, 14.6 / 17.5 | full |
| 2000x1012 | 0 | 0 | 0 / 0 | 14.9 / 17.1 | full |
| FFX-2 1280x960, 1600x900 | 0 | 0 | 0 (also the ATTACK menu) | 15.2 / 14.8, 14.2 / 15.2 | full |
| Phones (FFX, FFX TEXT SIZE 130, FFX-2) | | | tap line 0 | 14.4 / 14.3, 18.9 / 18.4, 14.4 / 14.3 | as before |

The critic's `maxCovered` is 0 everywhere, every card fits its box, and there were 0 console
errors. Screenshot: `docs/screenshots/r34fix-tap-hint-5-ffx-1280x960-ts130-guide-clear.png`
(TALK clear). Evidence: `D:/Tools/pyrefly-scratch/2026-10-01-rel34/repair-tap-hint/`
(`ev-before`, `ev-final`; `sum.cjs` prints the table).

**Gates.** `npx tsc --noEmit` is clean. The full `vitest run --testTimeout=60000` passed: 709
files (5 skipped) and 10,623 tests. Four new tests are in `status-o3-hint-place.test.ts`.
Orphans: 24, all old. No engine file was touched, and every file is under 400 lines.

**For Bailey (taste, not decided).** At 1280-wide desktops (and at 1600x900 / 1920x1080 only
where the full rule would still reach a row), the in-guide Zombie card with the guide open reads
"Healing hurts a Zombie. Holy Water or a Remedy cures it; Esuna does not." It drops the
Phoenix Down clause. The target step's forecast and red warning still say a Phoenix Down
KOs. The approved O3 frames are at 1600x900, where the full rule still shows.

**Noticed, not changed (in base too).** The guide's slab (NEXT) already runs over the help
slab's top line ("A one-off action this encounter offers") at 1280x960, in base as well.
