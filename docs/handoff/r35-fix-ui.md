# r35-fix-ui: the interface lane of release 35 (six items from round 18b, the visual pass and the release 34 reviews)

Branch `r35-fix-ui` from `c675f29b` (rel35 = main `e1a46221` + vis-fix), worktree `D:/pyrefly-fb-camera`.
Not pushed, not merged, not deployed (the driver does that). No save-data file, no settings schema, no
`SaveData.ts` touched: release 35 stays out of the save-data class. Presentation only (rule 1): no engine file,
no RNG.

Evidence scratch (headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, dev server on port 5650 stopped by PID
afterwards): `D:/Tools/pyrefly-scratch/2026-10-02-rel35/ui/` (`glib.mjs` the shared harness, `splash.mjs`,
`u2.mjs`, `u2x2.mjs`, `u3.mjs`, `u4.mjs`, `u5a.mjs`, `u5c.mjs`, `u6*.mjs`, the logs, and `ev/<run>/` for the frames).
Four screenshots in `docs/screenshots/r35-fix-ui-1..4-*.png`.

| Item | Outcome | Commit | Game case |
|---|---|---|---|
| U1 splash layering (VP-1001-32, -33, -36) | fixed; PR-0271's party-action part did not reproduce; the phone Thundara flash part not taken | `7477d2f4`, `c5213373` | both (shared splash layer); Sin clock FFX only |
| U2 cure hint (PR-0291, PR-0290) | both fixed | `7da56510` | PR-0291 FFX only; PR-0290 FFX-2 only |
| U3 status message line (PR-0286, PR-0285) | fixed (queue and merge); banner overlap fixed at 1280x960, not reproducible on the phone | `59c4d93b` | both (shared line) |
| U4 FFX-2 command help (PR-0305) | fixed | `924fbfab` | FFX-2 only |
| U5 panels over text and figures | four of six fixed, two not reproduced | `b3413b14` | see the table below |
| U6 clipped labels | all seven measured clean after; FOC28-P02 closed by its test | `fb3e6fbf`, `c5213373` | see the table below |

How the cut-ins were reached: a real Attack from the first menu (menu closed, an action in flight), then the splash
through the real port (`battle().stage.fx.actionOpen`, **INJECTED**, labelled so), pinned at its hold frame; and one
**natural** Mega Flare in Ch IV (an intended-strategy run, the presenter's own splash 95 s in). The measurement is
every visible element under `#ui` against the rotated band polygon (the slab's own geometry), 6 px sampling.

## U1: the HUD printed through the splash band

**Cause.** The splash is the screen root's first child at z 0, so the HUD (above it) ghosts through the band: the FFX
acting fade leaves the turn order, enemy card and Sensor at 0.16 over the title, FFX-2's panels and CHARGING slab were
opaque, Sin's clock, the Mouth Open card and the status smoke drew over the Dragon Fang art, and on the 390 px frame the
painting covers most of the slab so the ink title sat on dark paint.

**Fix (opacity and paint only, nothing moves, D-291).** `OverdriveSplashLayer` marks `<html>` with `fxc-splash-live`
from `play()` to the end of the splash; `overdrive-splash.css` takes `.sgd .mad .eint .ig-ctb .ffx-sensor .ffx-omr
.ffx-zg .ffx2hud__command .ig-cutin__info .coach-mark .ffx-sinhud > * .stm-layer .pf-mom__slab` to opacity 0
(`!important`, to beat the acting fade and the status marks' inline opacity). The title gets a halo in the slab's own
colour (invisible on the slab): `min(0.14em, 5px)` on desktop, `min(0.3em, 7px)` on the phone.

**Before and after, 1600x900.**

| Chapter | Before (elements in the band) | After |
|---|---|---|
| I (FFX, Mega Flare, injected) | turn order 19 elements at 0.16 opacity, the Sensor card (22 elements) | none (one leftover numeral from the previous hit, 9 % inside) |
| III (FFX, Natus, injected) | not measured before | none |
| IV (FFX-2, **natural** Mega Flare) | CHARGING slab over MEGA (critic frame), guide, intent card | only the full-frame vignette `.pf-mom__vig` |
| IV (injected, CHARGING slab forced on by DOM) | intent card (20 elements) | none |
| IX (FFX, Zanmato, injected) | turn order, Sensor, command area, coach | the command area, a coach card and a fading turn-cut-in portrait remain (see open item 1) |
| XVI (FFX-2, Aerospark, injected) | intent card 15 elements, guide | one leftover `+38` numeral |
| XVIII (FFX, Sin, Dragon Fang, injected) | turn order 19, Sin clock, Gaze pill | none |

Phone, 390x844, Ch I Mighty Guard at 300 ms, ink title against what touches the glyphs (median luminance contrast):
**1.82 before, 9.86 after** (`contrast.py`). Ch IV phone: the title sits on the pink slab and the halo shows as a light
outline (crop in `ev/ffx2-bahamut-390x844-touch-final/crop-on.png`). The metric is crude where the art is dark all round;
the crop is the better evidence.

PR-0271 (Sin clock over Yuna's face in party actions): **did not reproduce.** Ch XVIII seed 1, three Attack turns and
four Special turns by Tidus, Auron and Yuna, 60 ms frames for 5 s each: the clock, Gaze pill and Fin plate against the
three party figures' projected rects intersected in 0 frames. The splash part of PR-0271 (clock over Auron's Dragon Fang)
is fixed above.

## U2: the cure-hint card

- **FFX (PR-0291).** Ch I, 1600x900, Items list aimed at the Zombie Yuna, real keys. Before: the red warning slab at
  [69,328,452,57] overprinted the guide's NEXT line (1,122 + 2,812 + 300 + 1,272 px² of guide text under it; the plain
  help slab too). After: 0 px², card and slab read as in the approved O3 frame
  (`docs/screenshots/r35-fix-ui-2-o3-zombie-guide-slab.png`). Cause: the guide shows at least its first block whatever its
  chrome, so the in-guide hint card pushed that block under the slot the help slab owns. `guideOverCommands` now counts
  `.ffx-cmd-info` as a row (the one-sentence card first), and if two frames in a row still overlap the card stands alone in
  the guide (`.sgd--hint-alone`, `status-o3.css`), as the O3 frame draws it.
- **FFX-2 (PR-0290).** The phone Curse (and Silence) short hints named only Holy Water / Echo Screen. Now
  "Paine is cursed: Holy Water, Esuna or a Remedy cures it." Ch IV, 390x844: two lines, 14.3 px, covers 0 px² of command
  rows, tap line, bar and chips (`u2x2.mjs`). Desktop unchanged (15.2 px, three lines, 0). PR-0302 and PR-0303 (FFX phone
  tap line): their unit tests stay green (`status-o3-hint-place`); I did not re-measure the FFX phone target step in a
  browser this session.

## U3: the status message line

Ch I seed 1, Hastega on the party then Lance of Atrophy, 100 ms frames, three sizes.

| | Before | After |
|---|---|---|
| Hastega | three lines (Tidus / Tidus and Yuna / Kimahri) | one line that grows to "Tidus, Yuna and Kimahri were hasted." (events 0.4 s apart, merge window 900 ms) |
| "Yuna became a Zombie." | 5,292 ms; her mark landed at about 3,368 ms (lag 1.9 s) | 3,368 ms, **the same frame as her mark** (`statusLooks.marks.snapshot()`) |
| vs the dialogue banner, 1280x960 | line [533,179] under the plate [26,98,586,216]: 53x28 px overlap | moved above the plate (y 65) |

Rules now: a newer different event takes the screen once the current line has been up 450 ms; a line still waiting is
dropped for a newer one; one line otherwise keeps its two seconds. The phone overlap of PR-0286 did not reproduce (the
phone banner sits at the foot, the line above the party cards); the helper (`statusLineBanner.ts`) handles any plate
overlap. The banner overlap was shown with the captures-only `statusLooks.message.hold` (INJECTED line) while the real
dialogue banner was up. Tests: `u3-status-line-merge.test.ts`.

## U4: FFX-2 command help (PR-0305)

Ch IV. Before, 1600x900: after BATTLE HELP was turned off from the pause (INJECTED setting, same field as the OPTIONS
row, with a real Esc round trip) the band stayed `hidden: false` with "ATTACK Physical damage"; at 390x844 the hidden
band kept its sentence, which the phone's foot line reads. After, both sizes: hidden on the first frame after the pause
closes, text empty; with help on the line follows the highlighted row at every decision (six decisions per size).
`commandHelpSync.ts` holds the latest label and sentence and re-applies them every frame. `FFX2BattleHud.ts` 1,276 to
1,274 lines.

## U5: panels over text and figures

| Case | Reproduced? | Result |
|---|---|---|
| FFX-2 phone, Ch IV and XVI: coach over the intent line | yes, 21,080 px² at 390x844 | coach steps off the intent card on the phone too: Ch IV 0 px² (the line lands at y 142). Ch XVI shares the code; not re-run after |
| FFX phone, Ch XVII: FAR plate over the intent line | yes, 5,920 px² | plate and Gaze pill sit under the card (`--sin-under`): 0 px² |
| FFX-2 desktop, Ch XV: status line over "Glint" | yes, 872 px² over the boss name | line steps below the card: 0 px² |
| FFX Ch VII: Sensor card over Guardian B after a cancel | yes, 44,715 px² | the card folds to its chip when the aim that opened it ends: the card is gone; the chip still touches the bounding box by 4,584 px² (see open item 2) |
| FFX-2 Ch IV targeting: intent card over the White Mage | **no**: the card sits on Bahamut's eye line (x 868 to 1242), the girls stand at x 350 to 700 | left alone |
| FFX Ch X 2000x1012: coach over TALK | **no**: the coach is at x 871 to 1271, the stack at x 69 to 461 | left alone |

## U6: clipped labels

Each label measured as `scrollWidth` against `clientWidth` (or the glyph box against the viewport) before and after, at
the size its issue names.

| Label | Before | After |
|---|---|---|
| Board title "Sin: the Fins and the Core" (1600x900, 2000x1012) | 230 over 206 (ellipsis) | one step down (`fe-card__name--long`, 18k): fits, cleared card included |
| Board pips (XIV read KIV, VIII "VII'") | numerals filled the slanted pip edge to edge | side padding and a 3.5k slant: 0 cut of 18 pips; the last pip ends at the strip's edge (842 of 842; 947 of 947 at 2000) |
| Phone results caption (long locations) | "DECK OF THE FAHRENHEIT, THEN SIN'S BACK..." 480 over 308 | wraps into the page's two columns, 308 of 308 (also Highbridge, Garden of Pain) |
| Phone foot help ("A one-off action...", Switch sentence) | one line, 472 px wide at 390 | two lines at 14 px, clear of the SWITCH row |
| Phone confirm "ATTACK -> GUADO GUARDIAN A" | 290 over 270 ("TTACK") | two balanced lines in the 52 px button (270 of 270) |
| FFX-2 Item list header after a wheel tick | title 16 px above the box | sticky, visible; the fold mark sits under it |
| Ch VII arrival tags at 390 (FFX only) | "Cannot be targeted" to x 425, "Anima" to x 413 | clamped inside the window (13 of 13 samples) |
| FOC28-P02 Grand Summon subtitle | listed open in 18b | **closed**: `grand-summon-phone-subtitle.test.ts` passes (r29 measured 14 px, scrollWidth = clientWidth); I did not reopen the picker in a browser (it needs the labelled `openMinigame` hook) |

The Anima arrival camera is not touched. "Game case": board and results caption both games; foot line and confirm button
FFX phone (the foot rule is shared with FFX-2, where it only wraps); item list FFX-2 only; Ch VII tags FFX only.

## Gates

- `npx tsc --noEmit` clean.
- Tests I added: `r35-ui-splash-hint`, `u3-status-line-merge`, `u4-command-help-sync`, `r35-ui-labels`, `r35-ui-panels`
  (all green). Full `npx vitest run --testTimeout=60000` at the last code commit: **733 files passed, 5 skipped; 10,825 tests passed** (the first full run had one failure, `inkgold-scoping`, fixed in `41759c1f`).
- `node tools/orphans.mjs`: the four existing orphans only (`placeholder-sprites`, `tidus`, `MessageBar`, `PartyPrep`);
  `statusLineBanner.ts` and `commandHelpSync.ts` are imported.
- Rule 7: no file over 400 lines grew. `FFX2BattleHud.ts` 1,276 to 1,274, `FFXBattleHud.ts` 1,668 to 1,668; the
  sticky header and the caption rule went to `command-window-header.css` and `results-fit.css` rather than into
  `ffx2-hud.css` (1,181) and `results-phone.css` (404).
- Servers: the dev server on 5650 stopped by PID; headless browsers closed.

## Open items

1. **Ch IX cut-in (injected).** The injected Zanmato frame still has the command area, a coach card and the fading turn
   cut-in portrait of the next turn in the band. That state is an artefact of the injection (the splash and the next
   menu's cut-in overlapped); a real splash plays with the menu closed. I did not reach a natural Ch IX cut-in.
   Ch XVII was not run on the final build either (the clock is the same HUD as Ch XVIII, which is clean).
2. **Ch VII Sensor chip** still touches Guardian B's bounding box by 4,584 px² after a cancel (it is the one-line `I`
   chip, the reopen affordance). Hiding it entirely would remove the reopen key; I did not take that decision.
3. **Phone Thundara milky flash (VP-1001-36, last clause)** is not a plain opacity cap (it is the screen-flash and grade
   path), so I left it.
4. **U5 not reproduced:** the Ch IV targeting intent card over the girls and the Ch X coach over TALK (above). If the
   critic has frames, the rects will say which state they were in.
5. **Ch XVI coach (phone)** shares the Ch IV fix and was measured only before.

## askBailey

1. FFX-2's command window now fades for the splash's ~0.85 s (it ran onto the band in a natural Mega Flare, Active ATB
   keeps it open). Fine, or should it stay and the band yield?
2. The ink splash titles now carry a halo in the slab's colour (invisible on the slab, a sticker edge only where the title
   meets the painting). Fine, or phone only?
3. With the Zombie/Curse hint card in the guide, the guide now yields to the card (card alone) when it would otherwise
   run under the help slab. That is the approved O3 frame; say if you would rather keep the guide's NEXT block and let the
   card be shorter.

## Check (independent, 2026-10-02)

A second agent re-ran the branch at `430f3280` in the same worktree. It did not build this lane and tried to break it.
Dev server on port 5661, stopped by PID afterwards. Headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, one browser at
a time. Harness and logs are in `D:/Tools/pyrefly-scratch/2026-10-02-rel35/ui-check/`: a copy of `glib.mjs` repointed to
5661, plus `u4chk.mjs`, `u1life.mjs`, `nb.mjs`, `sinfin.mjs`, `stline.mjs` and `u6res.mjs`, which are new and
independent.

**Gates (re-run):**
- `tsc` clean.
- `vitest run --testTimeout=60000`: 733 files passed (5 skipped); 10,825 tests passed (40 skipped, 1 todo).
- `orphans`: the same four.
- Rule 7: only `FFXBattleHud.ts` (1,668 to 1,668) and `FFX2BattleHud.ts` (1,276 to 1,274) are over 400, and neither grew.
- `git diff c675f29b..430f3280 -- src/battle` is empty.
- `SaveData.ts`, the settings schema, `public/` and `docs/target/` are untouched.
- `verify-approved.mjs`: 469 ok, 0 mismatched, 0 missing.

**Claims confirmed by running:**
- **U1 natural Ch IV Mega Flare, 1600x900.** Seen at 94.8 s. Only the full-frame grain, vignette and `.pf-mom__vig` are in the band.
- **U1 injected cut-ins** (Ch I Mega Flare, Ch XVIII Dragon Fang, Ch XVI Aerospark): no HUD panel in the band. Leftovers are one damage numeral in Ch I (153, opacity 0.42) and `+38` in Ch XVI.
- **U1 lifecycle (new check).** In a natural Ch IV run:
  - `fxc-splash-live` is on `<html>` only while the splash shows.
  - The command window, intent card and guide drop to 0 during the splash and return to 1 within 0.54 s after it.
  - On a second splash skipped with a real Enter, the class is gone at once and the panels return.
- **U2.**
  - FFX Ch I, 1600x900: no guide text under the red Zombie slab (`hits: []`).
  - FFX-2 Ch IV phone: the Curse hint lists Holy Water, Esuna or a Remedy in 2 lines at 14.3 px and covers 0 command rows.
- **U3.**
  - Hastega reads as one line that grows to "Tidus, Yuna and Kimahri were hasted.".
  - "Yuna became a Zombie." appears at 3,379 ms, the same frame as her mark.
  - At 1280x960 the line sits at y 65 to 92, above the banner plate (top 98): 0 overlap, and nothing else is under it (crop checked).
- **U4, real pause clicks** (the BATTLE HELP row clicked in the pause; no injected setting):
  - 1600x900: help OFF hides the band on every frame after resume, text empty. Help ON brings it back and it follows the highlight. It tracked the row at four later decisions.
  - 390x844: with help OFF the foot line reads "YUNA" with no stale sentence; with help ON the sentence returns.
- **U5.**
  - Ch XVI phone coach: y 142 to 302, clear of the intent card (60 to 130). This is the case the builder did not re-run.
  - Ch XV: "Paine was stopped." is under the Glint card (0 px²).
  - Ch VII Sensor: folds to its chip after a cancel; the chip still touches Guardian B (4,584 px², as the note says).
- **U6.**
  - Board: 0 clipped pips at 1600 and 2000, and the last pip ends on the strip edge (842/842, 947/947).
  - FFX-2 Item header: stays sticky and visible after wheel scrolls.
  - Phone confirm "ATTACK → GUADO GUARDIAN A": 270/270.
  - Phone results caption on a native Ch XVII ending (no injection): two columns, 308/308, no neighbour overlap.
  - Phone foot line in Ch I: no clip and no overlap with command rows while walking every row.

**Findings:**
1. **Status line drops a waiting line (regression against live, PLAUSIBLE, both games).**
   - The new `StatusMessageLine` replaces any line still waiting with the newer one.
   - The real class was fed the presenter's own spacing: `status-remove` sleeps `TIMING.status * 0.4` (88 ms), and `status-add` sleeps `TIMING.status` (220 ms).
     - Three removals 88 ms apart (an Esuna or Remedy on Poison + Silence + Darkness) showed "no longer poisoned" and "can see again". The Silence line was never shown.
     - Three adds 220 ms apart showed Poison and Darkness only.
   - Live queued up to four lines. Reachable from the data: Braska's Final Aeon's "Curse" puts five line-bearing statuses (Curse, Poison, Sleep, Silence, Darkness) on one party member in one action, and Evrae's Stone Gaze puts two (Petrify, Slow).
   - A 240 s intended run of Ch III did not draw that move, so this is not caught in a live battle.
   - Suggested repair: keep a short FIFO of distinct waiting lines, each shown for at least `MIN_SHOW_MS`, instead of one replaceable slot.
2. **Phone splash: the status hint card prints through the band** (FFX-2 Ch IV, 390x844; not a regression).
   - `.sthint` stands alone on the phone stage, outside the faded `.sgd`.
   - It sits at opacity 1 over the lower slab, 98 % inside the band (`ev/ffx2-bahamut-390x844-touch-chk/splash-chk.png`).
   - It is not on the fade list.
3. **Ch XVII phone Fin plate:** it still overlaps the enemy-move card in a transient way.
   - Seen in 3 of 334 samples at 200 ms (worst 4,440 px²) when the card grows: `--sin-under` read 104 px while the card's bottom was at 116 px.
   - Cause: the 250 ms throttle.
   - Steady state is 0.
4. **Title halo.** On FFX's ivory slab it is invisible. On FFX-2's pink slab it shows as a light outline at both sizes, because `--fxc-slab2` (#ffe3f1) is not the slab's middle colour (#f7b6d9). The note says "invisible on the slab".
   - This is a paint change to the D-287 splash look.
   - It is already askBailey 2; it stays undecided until Bailey answers.
5. **FFX-2 phone coach.** Stepped off the intent strip, it now covers figures in Ch XVI: Ixion 16,720 px², and Yuna, Rikku and Paine 1,890 to 2,450 px² each. This is a trade-off of the U5 fix (the card is first-time only and fades).
6. **Evidence label.** The third panel of `docs/screenshots/r35-fix-ui-3-phone-labels.png` shows an injected "· CLEARED" caption on a Defeat page, and the panel does not say it was injected.
7. **Rule 14.** Commit `430f3280` (docs only) carries no game-case line.
8. **Not verified here:**
   - Ch VII arrival tags: no arrival in a 40 s phone watch. The pure `tagCentreX` and its tests stand.
   - The FFX-2 phone White Magic list: its last row (DISPEL) touches the one-line foot by 90 px². The foot's one-line position is unchanged from the base, so this is not from this branch.

**Verdict:** U1, U2, U4 and U6 hold as claimed. U3 holds for the cases it names, but it introduces finding 1. U5 holds at steady state (finding 3). No approved painting changed. Layering and the save-data class are clean.
