# r37-ui-floor: the interface lane (14 px floor, the phone coach badge, the HUD overlap cluster)

Branch `r37-ui-floor` from `origin/main` `d154486c`, worktree `D:/pyrefly-advisor-v4`, pushed, not merged, not deployed. Written
2026-10-03 by a Sonnet sub-agent of the driver session. No save-data file, no settings schema, no `SaveData.ts`; no
`docs/handoff/NOW.md`, `decisions.json`, `targets.json` or `public/art` touched. Layering held: no engine file; the presenter
change is one optional port call (rule 1).

Evidence scratch (headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, dev server on port 5900, stopped by PID at the end):
`D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor/` (`measure.mjs` text-floor walk, `lv35.mjs`, `hint.mjs`, `phonetarget.mjs`,
`ffx2hint.mjs`, `coachrow.mjs`, `intentgirls.mjs`, `sensor.mjs`, `odsub.mjs`, `x2change.mjs`, `shell.mjs`, `shellphone.mjs`, the
JSON runs and frames). Screenshots (target-vs-build pairs, JPEG) under `docs/screenshots/r37-ui-floor/`.

Honest framing: most of the cluster's carried issues were **already repaired by r35-fix-ui** (`docs/handoff/r35-fix-ui.md`) and
the critic's round 19 only "carried" them. Each was re-measured here against the current build; a defect that no longer
reproduces was not "fixed" again, and is listed as such.

## Items

| Key | Game case | What changed | Proof | critic-plan class | Left |
|---|---|---|---|---|---|
| PR-0321 (phone pause 12/13 px) | both | `--pu-fs` 14, `--pu-fs-v` 15 on the phone; `pause-phone.css`: brand on two tight lines, word rows and objectives take the empty bar cell back | 390x844 Ch I and Ch IV, every pause tab and the EYE CANDY page: 0 text nodes under 14 px, 0 clipped, 0 horizontal overflow; before/after frames `pause-phone-*.jpg` | deep after deploy | none for the phone pause |
| PR-0251 (4:3 HUD labels) | both (per game, each in its own selector) | new `hud-floor.css`: `--hud-floor` = 14.1 px / `--lb-scale`, each stage label `max(authored, floor)`; CTB name cap grows, Sensor chips to two columns and the plate rises 15 grid px | min 14 px, 0 under, at 1024x768, 1280x960, 1440x900 and 1600x900 in Ch I and Ch IV: first menu, seven submenus, the FFX target step. Before at 1280x960: FFX 9.8 px (31 under), FFX-2 9.3 px (21 under); at 1024x768 7.8 px. Frames `hud-*-before-after.jpg` | deep after deploy | Not measured: TEXT SIZE 115 with the floor, TEXT SIZE 130 at other sizes, chapters other than I and IV, the pause at 4:3. At 1024x768 the strategy guide drops its NEXT block (its own density ladder) and the advisor card reflows to two lines |
| PR-0302 (cure hint) | both | none needed: already 14.2 px (phone) and 15 px (desktop) in code | injected Zombie (Ch I) and Curse (Ch IV): phone head/body 14.2/14.2, 1280x960 15/15, hint over command rows, tip line, chips, advisor 0 px2 | n/a | none |
| LV-35-01 | FFX-2 only (the badge) | `coachIntentAvoid.markBox` = slab plus its "Gauges running" badge | Ch IV 390x844: badge over the intent card 5,632 px2 before, 0 after (12 px clear), steady over 12 samples; Ch I phone line clear (no badge). Frames `lv35-01-*.jpg` | deep after deploy | none |
| PR-0325 | both (measured in both) | `cmd-od-selected.css`: a selected `.ig-cmd--overdrive` row takes the accent fill and ink label (it lost the cascade to `.ig-cmd--overdrive`) | FFX Kimahri's OVERDRIVE list and FFX-2's CHANGE row, real keys, 1600x900: selected row `rgb(11,10,18)` before, `rgb(227,185,74)` / `rgb(247,182,217)` after, moves with the cursor. Frames `pr-0325-*.jpg` | deep after deploy | phone OD rows not measured (phone has its own sheets, excluded) |
| PR-0249 | FFX-2 only | `placeSlab` party tier (chrome, then the girls, then the other fighters; may rise above the natural row only to clear a girl's head box); `fighterBoxes` flags the party | 1600x900 and 2000x1012, Ch IV White Magic list: Rikku/Paine overlap 2,639/589 and 3,537/610 px2 before, 0 after, also 0 at the menu, on Shell and at the Cure target step (3.5 s settled). Frames `pr-0249-*.jpg` | deep after deploy | Not fully zero: a mid-transition frame of the Shell party step read 302+690 px2 (1600x900) and 3,660 px2 (2000x1012) once; the card's resting place also moves with the camera |
| PR-0104 (STALLED) | FFX-2 only | method check `docs/plans/pr-0104-method-check.md`, then `QueuedChips` + optional `HudPort.syncQueued` (CONTRACT-CHANGES) | real keys 1600x900 Wait, White Magic > Shell > all allies: chip first at 135 to 175 ms (before, first named at about 1.65 s); real taps 390x844: 153 to 166 ms; 14 px; chip stays while the command is queued (Wait holds the charge under the next menu) and goes 0.7 s after it ends. Frames `pr-0104-*.jpg` (the "before" half is the same frame with the chip hidden by a DOM script, labelled) | deep after deploy | the next review decides; a second failed attempt at this method goes to Bailey (method check section 4). Chip over a face in other chapters not measured |
| PR-0291 | FFX only | none | repaired by r35 U2 (`7da56510`); not re-run here | n/a | none |
| PR-0286 | both | none | repaired by r35 U3 (status line moves above the banner at 1280x960; phone did not reproduce); not re-run | n/a | none |
| PR-0303 | FFX phone | none | Ch I 390x844 target step with an injected Zombie, TEXT SIZE 100/115/130: hint docks above the chips, over the tap line 0, bar 0, confirm 0, card 0 px2 | n/a | none |
| PR-0304 | FFX-2 desktop | none | 80 s real-key play, Ch IV 1600x900, Curse injected on Paine, guide open: the hint was visible at 51 of 52 open-menu samples; the stand-in solo copy was seen while the guide faded | n/a | the one miss is a single sample, not traced |
| PR-0252 | FFX | none | Ch X 2000x1012 and 2560x1080, Ch I, Ch XII: coach over any command row and the selected row 0 px2 | n/a | see For Bailey 3 (first-run guide card over the advisor card) |
| PR-0271 | FFX | none | did not reproduce in r35 (three Attack and four Special turns, 0 frames); not re-run | n/a | none |
| PR-0276 | FFX-2 | none | repaired by r35 U6 (sticky header); not re-run | n/a | none |
| PR-0239 | FFX-2 (shared rail) | none | already repaired in round 15 text batch (`guide-inflight.ts`, `tests/unit/r29-rail-heal-inbound.test.ts`) | n/a | none |
| PR-0248 | FFX only | **not built** | Ch VII, real keys: the open Sensor card at rest covers Guardian B (37,489 px2 at 1600x900, 48,864 at 2000x1012) and the folded chip after a cancel still covers 5,590 / 3,934 px2 | n/a | For Bailey 1 |
| PR-0277 | FFX | **not built** | wording depends on the mechanics (raise then cure vs cure first), which the combat auditor owns; critic confidence low; the sentence is pinned by three advisor tests | n/a | For Bailey 2 |

Folded legibility items (PR-0295, 0288, 0246, 0250, 0247, 0296, 0237, FOC28-P02, 0293): 0288, 0246, 0250, 0247, 0296, 0237 and
FOC28-P02 were repaired in r35 (U5/U6 tables); not re-run. PR-0295 (four phone prep tabs show the letterboxed desktop board)
and PR-0293 (4K pause painting not full-bleed) were **not taken**: 0295 is a new phone page per tab (a look), 0293 is a
deliberate 1.25x cap in `PortraitStage` (stretching masters past it is a design decision).

## Gates

- `npx tsc --noEmit`: clean at the last code commit.
- Targeted: `hud-floor-css`, `cmd-od-selected-css`, `lv35-coach-badge-intent`, `ui-ffx2-intent-party-tier`,
  `ui-ffx2-queued-chip`, `presenter-queued-hud` (new) and the pause, HUD type-floor, status, intent, coach, presenter and
  command-menu files around them: all green.
- Full suite (`npx vitest run --testTimeout=60000 --maxWorkers=4`): 752 files passed, 5 skipped; 11,064 tests passed, 40 skipped, 1 todo; nothing failed.
- TEXT SIZE 130 % at 1280x960 (set through `app.save.setSettings`, an injected setting), Ch I and Ch IV: 0 text under 14 px; in Ch I the guide's MORE row touches the help slab (the existing grown-column behaviour), frame `ts/`.
- `node tools/orphans.mjs`: the same four as before (`placeholder-sprites`, `tidus`, `MessageBar`, `PartyPrep`); `QueuedChips.ts`
  is imported.
- Rule 7: `FFX2BattleHud.ts` (1,276 lines before) grew by 20 lines for the chip wiring; the chip itself is its own file.

## For Bailey

1. **PR-0248 (Ch VII Sensor card).** The Sensor card's resting place is over Guardian B in Chapter VII, and after a cancel the
   folded chip still touches him. D-249 (your pick 2026-09-27) folds the card while aiming **in Chapter III only** and says every
   other chapter keeps its card as approved. Extending that to Chapter VII (or moving the card's rest) changes an approved look:
   a yes or a pick?
2. **PR-0277 (advisor sentence).** The Ch I card can read "Phoenix Down -> Yuna, GUIDE'S PICK ... cure the Zombie first". Whether
   the order is raise-then-cure or cure-first is a combat call, not wording; I left the sentence alone (rule 6).
3. **First-run guide over the advisor card (new, FFX).** On a fresh profile at 2000x1012 in Chapter X the Auron "3 of 3" guide
   card (placed beside the ATTACK ring by `firstRunGuide.ts`, D-289) covers the lower part of the advisor card by about
   8,500 px2 (3,700 at 2560x1080). It is the approved O2 placement; say if the advisor should yield.
4. **The 4:3 HUD is small, not rebuilt.** The floor keeps every label at 14 px, but a 4:3 window still draws the 16:9 stage at
   the window's width. If 4:3 matters, a taller stage layout is a look and wants a mockup round.

## Next batch

Run the focused review on the candidate; the deep review (owed after deploy) should start with CHK-003 at 1280x960 and 390x844 in
all five chapters, the Sensor plate against the party rows and the CTB plates against the enemy at 4:3, and TEXT SIZE 130 with
the floor.

## Check (independent critic, 2026-10-03, Sonnet sub-agent; did not build this lane)

Checked tip `f8fe37be` (merge base `d154486c`; `origin/main` is `c69de96a`, which adds the r36fix merge, so a three-way
comparison was used: origin/main on port 6001, the merge base on 6003, the branch on 6002; all stopped by PID). Method:
headless Playwright (`PYREFLY_BROWSER=gpu`, seed 1, `gotoChapter` with cutscenes skipped, real keys and taps), one browser at
a time. Walker: every visible text node's effective px (computed size times ancestor scale), clipped leaf text, text-on-text
overlaps (more than 25% of the smaller box), off-window text; steps = first menu (coach up and down), seven submenus, the Attack
target step, the pause (every tab). Matrix: 5 chapters x 1024x768 / 1440x900 / 2000x1012 / 390x844 touch, TEXT SIZE 1.0 on branch
and origin/main; TEXT SIZE 1.15 on branch and the merge base (1024, 1440, 390). Scratch and frames:
`D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor-check/` (`chk.mjs`, `analyze.mjs`, `newov*.mjs`, `out/`).
Note: the TEXT SIZE setting takes 1, 1.15 or 1.3 (`TEXT_SIZES`), not 115 or 130; a first TEXT SIZE run with 115 changed nothing
and was discarded and redone with 1.15. The builder's "TEXT SIZE 130" run above probably did not apply either (unverified).
Port 6000 is blocked by Chromium (ERR_UNSAFE_PORT); 6001 to 6003 were used.

### Verdict per item

| Item | Verdict | Measured |
|---|---|---|
| tsc, orphans, layering | PASS | `npx tsc --noEmit` clean; orphans = the same four; the presenter change is one optional port call, no DOM or `three` |
| targeted vitest (280 files: pause, presenter, hud, ffx, ffx2, cmd, lv35, ui-, coach, intent, phone, advisor, guide) | PASS | 277 passed, 3 skipped (bench files), 2913 tests; the full suite is left to the integrator |
| game case in every commit | PASS | all six commits carry a "Game case" line |
| files under 400 lines | DISCLOSE | `CoachLayer.ts` 399 to 404 (+5, crosses the line); `FFX2BattleHud.ts` 1274 to 1288, `BattlePresenter.ts` 698 to 717, `FFXBattleHud.ts` +2 were already over |
| 14 px floor, Ch I (FFX) and Ch IV (FFX-2), 4 sizes, TEXT SIZE 1.0 and 1.15, pause at 4:3 | PASS | min 14.0 and 0 under 14 in every step (menu, 7 submenus, target, 8 pause tabs) at 1024x768, 1440x900, 2000x1012, 390x844; origin/main had 160 to 323 under 14 at 4:3 and 1440 |
| 14 px floor, Ch II, III, V | **FAIL** | Blocker 1 |
| phone pause floor + EYE CANDY page (PR-0321) | PASS for the floor | 390x844: 0 under 14 on every tab and the EYE CANDY page (origin/main: 39 under 14, min 12); 0 clipped; see Blocker 2 for the footer |
| 4:3 HUD labels (PR-0251) | PASS for Ch I and IV; FAIL as a whole | floor holds; collisions in Blocker 3 |
| PR-0302 / PR-0303 hint | not re-run | no code change there; the walker found no under-14 hint text |
| LV-35-01 | PASS | Ch IV 390x844: badge over the intent card 5,632 px2 on origin/main, 0 on the branch (12 px clear), steady over 12 samples; Ch V the same (5,632 to 0) |
| PR-0325 | PASS | FFX Kimahri OVERDRIVE, JUMP, MIGHTY GUARD, WHITE WIND: selected row `rgb(11,10,18)` to `rgb(227,185,74)` and moves with the cursor; FFX-2 CHANGE row `rgb(11,10,18)` to `rgb(247,182,217)`, ink label legible (frame viewed); phone not measured |
| PR-0249 (FFX-2) | PARTIAL, one regression | 1440x900: 0 px2 on every step (origin/main up to 9,254). 1600x900 and 2000x1012: menu and list 0, residual 257 / 626 px2 (1600) and 303 / 230 px2 (2000) at the Shell party step (origin/main 2,486 to 8,286); the 2000x1012 White Magic list read 3,837 px2 once and 0 on a rerun, so it is not always zero. 1024x768: menu and list 0 (was 501 to 1,306), but the Shell and Cure target steps are worse than the merge base for Rikku: Blocker 5 |
| PR-0104 (FFX-2) | PASS | real keys, Ch IV, Yuna Shell: chip first at 108 to 122 ms at 1600x900 and 1024x768, 14 px; real tap at 390x844 146 ms; no chip on origin/main; the chip lingers about 0.8 s after the charge ends (6.23 s against charge end 5.46 s); Ch V Pray is instant (no charge, no chip, correct); Ch IV Cure chip touches the guide card text by 284 px2 at 1600x900; a charging spell in Ch V was not measured |
| PR-0291, 0286, 0271, 0276, 0239, 0248, 0277 | not re-run | no code in this branch; PR-0248 and PR-0277 are honestly listed as not built |
| runtime errors | PASS | 0 page errors in all runs |

### Blockers

1. **The 14 px floor is not met in Chapters II, III and V** (the lane's acceptance is all five; the builder measured I and IV
   only). None of this is a regression (origin/main reads the same), but the acceptance is not met. Text still under 14 px,
   desktop: `.dbox__role` (the "Guardian", "Final Aeon", "Farplane" tag on a voice or dialogue box; Ch III and Ch V) 5.5 px at
   1024x768, 7.7 at 1440x900, 10.6 at 2000x1012; `.dbox__text` voice line 12 px at 1024 (Ch V); `.ig-ctb__tag` enemy-tile letter
   "A" / "B" (Ch III) 8.5 px at 1024x768, 12 at 1440x900; `.ig-banner__chip` "speaks" 10 px at 1024 (Ch III);
   `.ffx-sensor__unknown` "Sensor reads HP and weaknesses" (Ch II) 8 px at 1024x768, 11.3 at 1440x900. Phone 390x844: Ch III
   `.ffx-helpbar` ("Power Wave") 12 px; at TEXT SIZE 1.15 the Ch III and Ch V dialogue tags read 9.2 px. `hud-floor.css` lists
   the floored selectors by name; none of these is in it.
2. **Phone pause, 390x844, Chapters III and V: the 14 px tokens push a two-line objective into the footer** (regression against
   origin/main and the merge base). Ch V "DESTROY ALL FOUR OF VEGNAGUN'S PARTS": the last word's ink touches the ESC key box and
   sits on the "H PAINTING ONLY" line (text boxes overlap 209 px2 with ESC and 811 px2 with the legend, every tab). Ch III "DOWN BOTH
   YU PAGODAS AT ONCE" overlaps by 254 / 811 px2 with about 6 px of clear ink (tight, not touching). Before: about 10 px gap in both.
   Ch I, II and IV objectives do not collide. Frames `pz-ffx2-vegnagun-shuyin.png`, `pz-braskas-final-aeon.png`.
3. **FFX target step at 4:3 and 1440x900: new collisions from the bigger labels** (regression against origin/main and the merge
   base). Ch II at 1024x768 and 1440x900: the targeting hand now covers the end of the sensor toggle label "I YUNALESCA" (reads
   "I YUNALE"), which was whole before. Ch I at 1024x768: the hand covers the end of the advisor card line "IN WHITE MAGIC"
   (reads "IN WHITE MAG"), the reticle bracket crosses the Sensor card's name ("Mortiorch s"), and the party row's "OD" label
   ends at x=1026 on a 1024 px window (2 px clipped; origin/main kept it inside). Frames `c7.png`, `c8.png`, `c10.png`.
4. **Phone, Ch I Attack target step: the enemy name plate lands on the intent card** (regression against origin/main and the merge
   base, reproduced three times). The "Mortiorchis" plate is at y=118 on the branch against y=138 before, so it overprints the
   card's third line (1,494 px2 with the `746-842` row; 0 before). The cause is a 20 px shift of the target camera: the enemy's
   projected y at the target step is 156 on the branch and 176 on the merge base, while the first menu is identical (175 on both).
   Removing `hud-floor.css` at run time did not change it; the other changed files were not bisected. Frames `ph1-6002.png`
   against `ph1-6003.png`.
5. **PR-0249 at 1024x768 Shell and Cure target steps is worse for Rikku** (regression against the merge base; origin/main's camera
   also moved with r36fix, so it is not comparable there). Rikku's box covered: 9,075 to 15,413 px2 at the Shell step (full box),
   Yuna 20,468 to 20,195; Cure step Rikku 7,818 to 7,977. The ranking is meant to lower the party total; here it rises (35.6k against
   29.5k px2). Menu and list at 4:3 improved to 0.

### Disclosures (majors that are not regressions, or small)

- The FFX-2 first-run coach line (Ch IV 1024x768) sits at the top and covers the help bar text ("WHITE MAGI") on the branch;
  origin/main put it low with its badge. The state differed between the runs (timing), so it is not counted as a regression;
  first-run only.
- Ch V 1024x768: command list rows touch the party rows' text boxes by 90 to 220 px2 in the White Magic and Item lists (ink clear).
- The strategy guide drops its NEXT block at 1024x768 (the builder's own note; confirmed, ink clear).
- The PR-0104 chip lingers about 0.8 s after the charge ends and touches the guide card text in Ch IV at 1600x900 (284 px2).
- The walker's remaining overlap counts (pause options rows scrolled out of view, the music list over the objective, folded intent
  card rows) are in origin/main too, or are scrolled or folded content, and were not counted.
- TEXT SIZE 1.15: Ch I and IV hold 14 and add no new overlap against the merge base. TEXT SIZE 1.3 and the full suite were not run.
- The Ch III and Ch V dialogue-box findings (Blocker 1) come from a voice line shown at the first menu; the story box may live in a
  different sheet than the HUD one.

### Verdict

**Not ok to merge as is.** Five blockers: 1 (acceptance), 2, 3, 4 and 5 (regressions). The floor work is sound where the builder
measured it (Ch I and IV, every size, also at TEXT SIZE 1.15), and LV-35-01, PR-0325, PR-0104 and the 16:9 half of PR-0249
verify. A fix batch would add the listed selectors (and the story box) to the floor, give the phone pause footer a taller
reserve for a two-line objective, keep the 4:3 target step's hand, reticle and OD label off the larger labels, re-check the
PR-0249 ranking at 4:3, and bisect the 20 px phone target-camera shift.

## Repair cycle (2026-10-03, Sonnet sub-agent; one cycle, after the independent check above)

Method: headless Playwright (`PYREFLY_BROWSER=gpu`, seed 1), ports 6002 (branch) and 6003 (a `git archive d154486c` copy of the merge
base, parked afterwards at `F:/pyrefly-parked/2026-10-03/r37-ui-floor-merge-base-copy`), both stopped by PID. Scratch:
`D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor-check/` (`chk.mjs` floor walker, `fx-phone.mjs`, `g-*.mjs` probes, `ig-run.sh`) and
`.../r37-ui-floor-fix/`. Frames: `docs/screenshots/r37-ui-floor/repair-*.jpg`. Game case per item below.

| Blocker | Game case | Cause found | Fix | Proof after |
|---|---|---|---|---|
| 1 floor in Ch II, III, V | both (dbox, banner chip, phone); FFX only (CTB tag, Sensor lines) | the mid-battle line card is the dialogue box scaled 0.7 (`--lc-scale`), so its role tag and voice line printed at 5.5 to 12 px; the other labels were simply not in `hud-floor.css` | `line-card.css` (card: size / 0.7, band: 14.1 px, desktop only), `text-size.css` (same at 115 and 130 %, plus the phone bark that printed 9.2 px at 115), `hud-floor.css` (`.ffx-sensor__unknown/immune/failed`, `.ig-ctb__tag`, `.ig-banner__chip` per game), `phone-hud-parts.css` (`.ffx-helpbar` 14 px) | walker, all five chapters x 1024x768 / 1440x900 / 2000x1012 / 390x844 touch, menu + seven submenus + Attack target (+ every pause tab on the phone): min 14.0, **0 under 14** in all 20 runs, 0 page errors; the card in both places 14.1 px at 1024, 1440 (also 115 and 130 %) and 14 / 15 px on the phone at 100 and 115 %, text still inside its window; phone `.ffx-helpbar`, banner chip and CTB tag 14 px |
| 2 phone pause footer | both (shared pause) | the 3-line caption (0.4em tracking at 14 px) plus a 2-line objective ran into ESC and "H PAINTING ONLY" | caption tracking 0.2em, and `phoneFit.ts` raises the objective by `--pu-phone-obj-lift` only as far as the footer needs (12 px air); short objectives stay at the approved 82vh | Ch III and Ch V 390x844, every tab: 0 overlaps with ESC and the legend (was 209 / 811 and 254 / 811 px2); frames `repair-pause-phone-ch3/ch5-*.jpg` |
| 3 FFX target step 4:3 / 1440 | FFX only | (a) my own Sensor rise of 15 grid px also lifted the **folded** toggle into the hand's row; (b) the hand is docked to the enemy wherever it stands, and the floored cards are wider | folded card keeps its authored top; chips tighten 13 to 10.5 grid px as the type grows so the third row costs 7.5 not 15 and the card rises only that far; new `handClear.ts` moves the hand vertically the least that clears the advisor, Sensor and guide cards; "OD" steps in by half the floor growth | Ch I and Ch II at 1024x768 and 1440x900, Attack target step: "IN WHITE MAGIC" and "I YUNALESCA" whole, bracket clear of the Sensor name, 0 off-window text (the OD label was 2 px out); frame `repair-ffx-target-1024-ch1-ch2-after.jpg` |
| 4 phone Ch I target plate on the intent card | FFX only | **not a regression**: the target camera is bimodal on the unchanged merge base too (enemy projected y 156 or 176 from one run to the next, 3 of 6 runs on each build); in the 156 state the plate docked above the enemy onto the intent strip, which `panelRects` never listed. The branch's CSS is not involved (removing it at run time changed nothing) | the phone plate now treats the intent strip as a panel (`FFXBattleHud.applySelection`, plate docking only, formation untouched; desktop card hangs on the boss and is not listed) | 6 more runs: both camera states, plate 0 px2 on the card (in the 156 state it docks below the enemy at y 373); frame `repair-phone-target-plate-before-after.jpg`. The camera's two states are **left as found** (see For Bailey) |
| 5 PR-0249 at 1024x768 Shell / Cure | FFX-2 only | **not the party tier**: with the tier switched off the Shell step is the same. `placeSlab` only tries columns taken from obstacle edges; the floored cards moved the edges and the column that least covers Rikku (131) disappeared, so it took 177 | `placeSlab` (tiered only) also tries both walls and the chip-flush column (the `E HIDE` chip rides the slab's corner and is scored with it): more candidates can only improve the lexicographic minimum | 1024x768: menu, list, list-on-Shell 0; Shell step Rikku 9,046 (merge base) / 14,581 (before) to 3,712 px2, party total 29.7k / 35.2k to 24.9k; Cure step Rikku 7,461 / 7,687 to 3,942, total 29.4k / 29.5k to 26.1k; 1600x900 all five steps 0 px2; 2000x1012 menu, Shell list, Cure 0; the 2000x1012 White Magic list reads 3.7 to 3.8k px2 (the check saw 3,837 once) and the Shell step 256 + 565, both residues carried |

Gates: `npx tsc --noEmit` clean; new `tests/unit/r37-floor-repair.test.ts` (12) and the existing `hud-floor-css`, `pause-phone-fit`,
`ui-ffx2-intent-party-tier`; targeted run of 377 files (names containing pause, presenter, hud, ffx, cmd, lv35, ui-, coach, intent, phone,
advisor, guide, text-size, line-card, dialogue, target, sensor, r37): 373 passed, 4 skipped, 5,774 tests passed, nothing failed;
`node tools/orphans.mjs`: the same four; layering unchanged (no engine file touched).

For Bailey:
1. **The FFX phone target camera has two resting states** (enemy about 20 px apart) on the merge base and on this branch, chosen
   by something that differs from run to run (not traced: not CSS, not the branch's presenter change). It is a framing question
   for the camera owner, not part of this lane; the plate now survives either state.
2. **TEXT SIZE 130 at the floor** was still not measured in the Sensor / CTB / banner labels of Chapters II, III and V (the matrix
   ran at 100 %; the dialogue card was probed at 115 and 130 %).

## Re-check after the repair (independent critic, 2026-10-03, Sonnet sub-agent; did not build this lane)

Checked tip `30bf3a7e`. Three builds side by side: the branch on port 6002, the merge base `d154486c` (a `git archive` copy) on
6003, and `origin/main` `6b5ff02f` (a `git archive` copy, release 36 code) on 6001, all headless Playwright (`PYREFLY_BROWSER=gpu`,
seed 1, `gotoChapter` with cutscenes skipped, real keys, real taps on the phone), one browser at a time; the three servers were
stopped by PID. The walker is the one from the first check (every visible text node's effective px, clipped leaf text, text-on-text
overlaps over 25% of the smaller box, off-window text). Matrix: 5 chapters (Ch I `seymour-flux`, Ch II `yunalesca`, Ch III
`braskas-final-aeon` FFX; Ch IV `ffx2-bahamut`, Ch V `ffx2-vegnagun-shuyin` FFX-2) x 1024x768 / 1440x900 / 2000x1012 / 390x844 touch,
steps first menu (coach up and down), seven submenus, Attack target, and every pause tab at 1024x768 and 390x844; TEXT SIZE 1.0 on
all three builds, TEXT SIZE 1.15 (the "115" of the brief; the setting takes 1, 1.15, 1.3) on the branch and `origin/main` at 1024,
1440, 390, and 1.3 on the branch. Scratch and frames: `D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor-check/` (`chk2.mjs`,
`chk3.mjs`, `analyze2.mjs`, `analyze3.mjs`, `coach1.mjs`, `coach2.mjs`, `ph4.mjs`, `out2/`, `out3/`).

### Verdict per item

| Item | Verdict | Measured |
|---|---|---|
| `npx tsc --noEmit`, orphans, layering | PASS | clean; the same four orphans (`placeholder-sprites`, `tidus`, `MessageBar`, `PartyPrep`); the presenter change is one optional port call, no DOM or `three`; `HudPort.syncQueued` has its `CONTRACT-CHANGES` entry |
| targeted vitest | PASS | names pause, presenter, hud, ffx, cmd, lv35, ui-, coach, intent, phone, advisor, guide, text-size, line-card, dialogue, target, sensor, r37: 373 files passed, 4 skipped (377), 5,774 tests passed; the full suite is the integrator's |
| game case in every commit | PASS | all eight branch commits name their case |
| files under 400 lines | DISCLOSE | `CoachLayer.ts` 399 to 404 crosses the line; `BattlePresenter.ts` (698 to 717), `FFXBattleHud.ts`, `FFX2BattleHud.ts` and `pause-screen.css` were already over; every new file is under 400 |
| 14 px floor, five chapters, four sizes, TEXT SIZE 1.0, menu + 7 submenus + Attack target (+ every pause tab at 4:3 and on the phone) | PASS | 20 of 20 runs: min 14.0, 0 text nodes under 14 px, 0 page errors. `origin/main` and the merge base read 5.5 to 13.5 px with 32 to 343 nodes under 14 in the same cells (min 5.6 at 1024 in Ch III and V) |
| the same at TEXT SIZE 1.15 and 1.3 (1024, 1440, 390) | PASS for the floor | 15 of 15 runs at 1.15 and 15 of 15 at 1.3: min 14.0, 0 under 14; no new clipped leaf text against the merge base at 1.3 (phone Ch I and Ch V at 4:3 compared); see Blocker 3 for a clipped label |
| pause at 4:3 (1024x768) | PASS | 8 tabs in each chapter, 0 under 14, 0 clipped; only the music list scrolled out of view reads off-window (same on `origin/main`) |
| phone pause footer (Blocker 2 of the first check) | PASS | Ch III and Ch V two-line objectives: 0 text overlaps with ESC, "H PAINTING ONLY" or RESUME on every tab at 1.0, 1.15 and 1.3 (all five chapters, 15 runs); frame `out2/br-ffx2-vegnagun-shuyin-390x844-t-pause-chapter.png` read by eye, clear |
| Ch II, III, V floor (Blocker 1 of the first check) | PASS | `.dbox__role`, `.dbox__text`, `.ig-ctb__tag`, `.ig-banner__chip`, `.ffx-sensor__unknown`, `.ffx-helpbar` all at 14 or more in the walker, all four sizes, TEXT SIZE 1.0 / 1.15 / 1.3 |
| FFX target step at 1024 and 1440 (Blocker 3 of the first check) | PASS at TEXT SIZE 1.0; FAIL at 1.15 | Ch I and II, Attack target, 1.0: 0 new overlaps, 0 new off-window text, hand clear of "IN WHITE MAGIC" and "I YUNALESCA" (frame `out2/br-seymour-flux-1024x768-target.png` read by eye). At TEXT SIZE 1.15, 1024x768: see Blocker 3 |
| phone Ch I target plate on the intent card (Blocker 4 of the first check) | PASS for the card, FAIL for the hand | 3 runs each: plate against the intent card 0 px2 on the branch (the merge base docks it at y 117 to 139, over the card's last line); but see Blocker 2 |
| PR-0249 (FFX-2 enemy-move card off the girls) | PASS at 1440, 1600, 2000; DISCLOSE at 4:3 | card against the girls' boxes, px2, branch (merge base): 1600x900 menu, list, list-on-Shell, Cure all 0 (up to 19,887); Shell target step Rikku 314 + Paine 617 (16,654); 2000x1012 0 except the Shell step 255 + 278 (19,411); 1440x900 all 0 (up to 17,808). 1024x768: menu, list, list-on-Shell 0 (4.9k to 5.4k); the Shell and Cure target steps 24.7k and 25.7k px2 (Yuna 21.0k, Rikku 3.8k and 4.2k) against 23.7k and 24.1k on the merge base (Yuna 16.8k, Rikku 6.9k): the card has to sit on someone at 4:3, the total is about 4% worse, and the builder's "29.7k to 24.9k" for the merge base is not reproduced (23.7k here) |
| PR-0104 (queued-command chip) | PASS | real keys 1600x900, Yuna White Magic > Shell > all allies: chip "Shell" first at 126 ms, 14 px, held until the charge ended (4,199 ms); none on the merge base; real tap 390x844: 138 ms, 14 px, inside the window |
| LV-35-01 (phone coach badge) | PASS on the phone; the same change breaks desktop, Blocker 1 | Ch IV and Ch V 390x844: badge over the intent card 5,632 px2 on the merge base, 0 on the branch (12 px clear), steady over 12 samples; Ch I phone has no badge |
| PR-0325 (selected Overdrive row) | PASS | FFX Kimahri OVERDRIVE sub list (Jump, Mighty Guard, White Wind): the selected row is `rgb(227,185,74)` and moves with the cursor, the others `rgb(11,10,18)`; FFX-2 CHANGE row `rgb(247,182,217)` selected, `rgb(11,10,18)` not |
| PR-0302 / PR-0303 (cure hint) | PASS | injected Zombie (Ch I) and Curse (Ch IV): 14.2 px on the phone, 15 px at 1024x768, 0 px2 against the command rows, tip line, chips and advisor |
| PR-0251 (4:3 HUD labels) | PASS at 1.0, FAIL at 1.15 | floor holds in all five chapters; see Blocker 3 |
| other chapters (`seymour-anima-macalania`, `sin-fins-core`, `ffx2-ixion-djose`, `ff7-guard-scorpion`) at 1440x900 and 390x844, merge base against branch | PASS, with disclosures | no new overlap, clipped or off-window text except Blocker 1 in Ixion; FFX Ch VII and FFX-2 Ixion hold 14; FF7 reads the same as the merge base (16.5 px desktop; 63 nodes at 9.6 px on the phone on both builds: FF7 phone is not in scope, disclosed); the Sin core HUD still has 2 nodes at 12.6 and 13.5 px at 1440 (`.ffx-sinfin__calm`, `.ffx-sinfin__range--far`; the merge base had 15) |

### Blockers

1. **FFX-2 first-run coach card: its "Gauges running" badge is pushed off the top of the window and the card covers the help bar**
   (regression against `origin/main` and the merge base; game case FFX-2 only; deterministic). On a fresh profile in Chapter IV
   (`ffx2-bahamut`) the coach card sits at y 6 to 10 with its badge at y -20 to -24 (the badge is 26 px tall, so about 20 px is cut
   off) at 1024x768 and at 1600x900; the same at 1440x900 in Ixion (`ffx2-ixion-djose`, off-window text "Gauges running"). The merge
   base and `origin/main` put the card low (y 612 or 744) with the badge whole at both sizes (`coach1.mjs`, three builds, five sizes: the
   branch is fine at 1280x960, 1366x768 and 1280x720). At 1024x768 the card also covers the help bar's text ("WHITE MAGIC"
   cut to its first word; frame `out2/br-ffx2-bahamut-1024x768-menu.png` against `out3/base-ffx2-bahamut-1024x768-menu.png`). Cause
   (not bisected to one commit): at 1600x900 the floor made the move-advisor card 364x160 at (773,675) where it was 491x108 at
   (646,727), `markBox` now counts the 30 px badge above the line (a4e9a0b9), and the solver's result lands the line at the stage's
   top with the badge hanging above it; `keepMarkOffIntent` and `CoachMark` clamp the line but not the badge. This is the first thing
   a new player sees in the FFX-2 chapters, at the two most common desktop sizes. Fix: clamp the badge-inclusive box to the stage and
   re-check at 1024x768, 1440x900 and 1600x900.
2. **FFX phone Ch I Attack target step: the new plate placement hides the targeting hand** (regression; FFX only; 3 of 3 runs). The
   repair's plate docking puts "Mortiorchis" at (17,219) 119x36, left of the reticle; the pointing hand `.ffx-target__hand` is at
   (88,228) 44x30, so the plate covers it entirely (frame `out2/ph1-br-1.png`: no hand visible; the merge base shows the hand,
   `out2/ph1-mb-1.png`, and its plate sits over the intent strip instead). Fix: dock the plate where the hand is not, or move the hand
   with the plate (`FFXBattleHud.applySelection` plate docking, `handClear.ts`).
3. **TEXT SIZE 1.15 at 1024x768, FFX Ch I and Ch II: the party row's "OD" label runs off the right edge of the window** (regression
   against the merge base, which had none; FFX only; in the Attack target step and the submenus). The label box ends at x 1027 to
   1028 on a 1024 px window and the "D" is cut (crop `out2/crop-od-ts115.png`); at 1.3 "OD" and "Overdrive" are off-window in both
   chapters. The first check's Blocker 3 had the same label 2 px out at 1.0; the repair fixed 1.0 only. Ch III (FFX) and both FFX-2
   chapters do not show it.

### Disclosures (majors that are not regressions, or small)

- PR-0249 at 4:3 target steps: the card still lands on Yuna (21k px2); see the table. At 1600x900 and 2000x1012 the Shell target
  step keeps a residue of 0.3k to 0.6k px2 (a girl's head box).
- The Ch V line card (Braska "FARPLANE" box) at 1440x900 covers the lower party rows as before; with the 14 px role tag its text now
  touches the Paine row label (646 px2). The card position is unchanged.
- At 1024x768 the Ch V White Magic list's last row is half cut under the party rows and scrolls (the list is half a row shorter at the
  14 px floor); the Ch IV move card moves right to clear the girls and covers more of the enemy.
- Phone pause options page: the settings block shows about 3 of its rows before it scrolls (4 before); TEXT SIZE and EYE CANDY are
  one scroll away; no text overlaps in the visible region (the walker's `pause-options` overlaps are rows scrolled out of view).
- The phone target camera's two resting states (the builder's For Bailey 1) were seen again on the merge base: plate y 117 and 138.
- Not run: the full suite, TEXT SIZE 1.15 and 1.3 at 2000x1012, the chapters beyond the four spot-checked ones.
- The Sin core HUD (Ch XII) keeps 2 nodes under 14 px at 1440x900; the FF7 phone keeps 63 nodes at 9.6 px (both outside the five
  headline chapters and unchanged by this branch).

### Verdict

**Not ok to merge as is.** The floor itself is met everywhere asked for (five chapters, four sizes, TEXT SIZE 1.0 / 1.15 / 1.3, the 4:3
pause, the phone pause), and the repair holds for the first check's five blockers at TEXT SIZE 1.0 (Ch II, III, V floor; phone pause
footer; FFX 4:3 target collisions; PR-0249 at 4:3 no longer worse for Rikku in total; the phone plate off the intent card). Three
regressions remain: the FFX-2 first-run coach badge clipped at 1024x768, 1440x900 and 1600x900 (Blocker 1, the most visible), the phone
target hand hidden by the new plate (Blocker 2), and the "OD" label clipped at 4:3 at TEXT SIZE 1.15 and 1.3 (Blocker 3).

## Third attempt (2026-10-03, Sonnet sub-agent; after a written method check)

Rule 15 (two failed attempts): the method check is `docs/plans/r37-ui-floor-method-check.md` (what each blocker is, why the
two earlier fixes moved the problem, the binding constraint, the method, the measurement matrix). `origin/main` (`8d1e1605`,
release 37 integration) was merged into the branch first (`dd3a0b3e`; the one conflict, `CONTRACT-CHANGES.md`, kept both
entries; `ac560786` removes the markers a first resolution attempt left behind). Not merged into main, not deployed.

Evidence scratch (headless Playwright, `PYREFLY_BROWSER=gpu`, seed 1, 6100 = branch, 6101 = a `git archive` copy of
`origin/main`, both stopped by PID): `D:/Tools/pyrefly-scratch/2026-10-03/r37-ui-floor-3-tools/` (`chk3.mjs` walker, `matrix.sh`,
`ph-target.mjs`, `dbox.mjs`, `od-diag.mjs`, `hand-diag.mjs`, `out/`). Pairs: `docs/screenshots/r37-ui-floor/third-*.jpg`.

| Item | Game case | Cause | Fix | Proof (branch against origin/main, same cells) |
|---|---|---|---|---|
| FFX-2 first-run coach card cut (badge off the top, and off the right edge at 1440x900, which origin/main has too) | FFX-2 only (the badge); the clamp is both | `placeOffActors` solved the slab alone; the badge hangs 28 px above and runs 56 px wider | `coachActorAvoid.placeMarkOffActors` uses `markBox` (slab plus badge); new `keepMarkInStage` is the last word after every mover | Ch IV, Ixion, Ch V x 1024x768 / 1440x900 / 1600x900 / 2000x1012, fresh profile: 0 off-window text (origin/main: the badge at x 1468 on 1440 in Ch IV and Ixion); no cut at the top in any sample |
| Phone Ch I target step: plate on the intent card, then on the hand | FFX only | the plate dock did not know the hand; its height estimate (34) is 2 px short of the page's (36) | `handBox` joins the dock's panels (`TargetCursor.dockFor`); the intent strip is grown 4 px | 390x844, 12 runs over both camera states: plate on the card 0 px2 (origin/main 119 to 2,618), hand always visible, 0 px2 against hand, party, stack; frame `third-phone-target-plate-*` |
| OD label off the window at TEXT SIZE 1.15 / 1.3 on 1024 px | FFX only | the aim nudge `translateX(6%)` grows with TEXT SIZE; the OD word hangs 9.25 grid px past the list edge, 23.11 inside the stage | `hud-floor.css`: nudge `min(6%, (21.1px / text scale) - 9.25px)` in stage grid px | Ch I and II at 1024x768, TEXT SIZE 1.0 / 1.15 / 1.3, target step: 0 off-window text (before: OD ended at 1027 and 1033; now 1004 to 1020) |
| Hand over the Sensor card ("HP ???", Ch II) at TEXT SIZE 1.15 / 1.3 (found in this pass) | FFX only | the card settles after the cursor's layout (steered sideways, kept off the turn list), so the one-off clear used a stale card; and the old 90 px limit could not clear a taller card | `clearHandOfCards` is idempotent (`data-base-top`) and runs every frame the hand is up; `clearHandShift` takes the figure's vertical range instead of a fixed limit | Ch I to III x 1024x768 / 1440x900 / 2000x1012 x TEXT SIZE 1.0 / 1.15 / 1.3 (27 cells): hand against Sensor, advisor, guide, intent strip 0 px2; frame `third-hand-sensor-*` |
| 14 px floor, dialogue box role / text, phone pause objective against the footer | both | already fixed by the repair | not touched | 5 chapters x 390x844 / 1024x768 / 1440x900 / 2000x1012 x TEXT SIZE 1.0 / 1.15 / 1.3 (60 runs, menu, coach, seven submenus, target, every pause tab at 4:3 and on the phone): min 14.0, 0 under 14, 0 page errors. Dialogue role 14.1 and text 14.1 or more in Ch III and V (desktop, 115, 130 %; phone 14 / 15 at 100 %). Phone pause footer: 15 cells x 8 tabs, 0 text overlaps with ESC, RESUME, "H PAINTING ONLY". origin/main reads 4.8 to 13.5 px with 34 to 336 nodes under 14 in the same cells |

Gates: `npx tsc --noEmit` clean; full suite (`--maxWorkers=4`, run once) 11,324 passed, 41 skipped, 1 todo, nothing failed; `tests/unit/r37-floor-third.test.ts` (12) with the existing coach, cursor, hud-floor, sensor-steer
and `r37-floor-repair` files green; `node tools/orphans.mjs` the same four. Layering held (no engine file).

Disclosures (not regressions, or timing noise):
- The walker occasionally reads a frame with the pause screen open mid-walk (a stray Escape); those overlaps (the pause objective
  over HUD text, "Auron" tab over the CTB tag) are not HUD defects and vanish on a re-run of the same cell.
- The hand's tip touches the command stack's right edge by 200 to 300 px2 in Ch III at 1024x768, TEXT SIZE 1.15 in one of the
  target camera's two resting states; origin/main shows 308 px2 in the same cell.
- Ch IV / Ch V at 1024x768: the move card still lands on Yuna (PR-0249's 4:3 residue, disclosed before); the first-run line at
  Ixion 1024x768 still sits over the party rows' left end (origin/main identical). Both want a layout, not a clamp.
- Phone pause options page shows about 3 settings rows before it scrolls (disclosed in the re-check); the walker's `pause-options`
  overlaps there are rows under the scroll fade.
- Not run: TEXT SIZE 1.15 / 1.3 against origin/main beyond the cells above (the branch was compared with itself at 1.0 and
  nothing new appeared); chapters other than I to V.
