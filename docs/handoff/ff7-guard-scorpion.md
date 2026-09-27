# FF7 Guard Scorpion: the hidden experiment, integrated and turned on (FF7 only)

Branch `ff7-integration` (worktree `D:/pyrefly-ff7-int`), 2026-09-27: `origin/ff7-engine` merged
into `ff7-plumbing` (the HUD), then `origin/main` (already contained). Not merged into `main`, not
deployed. **Game case: FF7 only** (AGENTS.md rule 14). Shared files touched are labelled
"shared plumbing (both + FF7)" below; each answers `'ff7'` on its own line and leaves the FFX and
FFX-2 paths as they were.

On whose word: Bailey, 2026-09-27, verbatim: "ff7 screen layout ill go with a but it needs to be
EVEN more faithful than a but remember it is specific to the ff7 encounters not ffx or ffx-2 ..."
(D-237), "also the secret door to guard scorpion i really like your ideas there i will go with it"
(D-238), "full speed ahead please. godspeed. ill go with all your recommendations." (D-240, with the
driver's recommendations: M PLUS Rounded 1c body face; stretch on 16:9; Cloud's hint verbatim with
"it's"; the phone layout by the real-input check; music silent; no door sign).

## How to open it

On chapter select:

- **Keyboard:** type `L I M I T` (letters at most about 2 s apart).
- **Phone or mouse:** tap the small "Chapter select" label at the top **seven times** within about 4 s.
- **Gamepad:** `L1 R1 L1 R1 Select` (on a keyboard `F R F R M`).

The fight opens with the chapters' own transition (the battle swirl) and no other sign. No card,
no count, no ribbon: the board still has 15 tiles and "of 15". Victory shows the results panel and
returns to the board with the cursor where it was. Defeat shows the defeat panel: **RETRY** goes
straight back in with a new seed (`seed + 1000`), **CHAPTER SELECT** returns. The pause's QUIT and
RESTART work as in the chapters. Nothing writes `pyrefly-reprise:save:v1`; attempts, clears, best
time and play time go to `pyrefly-reprise:experiments:v1`.

Controls in the fight (FF7's): arrows move, Enter / Space / Z confirm, Esc / X / Backspace back,
**left on the command window = Change, right = Defend** (manual p. 18), H = SELECT (help). Taps: a
row chooses; a figure aims, a second tap confirms; an unmarked strip beside the command window's
left / right edge moves the finger to Change / Defend, a second tap chooses it.

## What is built

| Area | What | Files |
|---|---|---|
| Switch | `FF7_EXPERIMENT_READY = true` | `src/app/experiments/ff7Flag.ts` |
| Flow | The loop: swirl in, fight, results or defeat panel, RETRY reseeds, CHAPTER SELECT returns; nothing touches the save | `src/app/screens/BattleScreenExperiment.ts`, one call in `BattleScreenFlow.ts` (shared plumbing) |
| HUD on the engine | Command window from the engine's rows: Attack or Limit, Magic (the engine's category `'magic'`, MP costs, targeting), the blank Summon slot, Item with the engine bag's counts; Change and Defend off the window's edges | `src/ui/ff7/ff7MenuModel.ts`, `ff7MenuHtml.ts`, `Ff7CommandMenu.ts`; `createHud('ff7', field, engine)` in `BattleScreenWiring.ts` |
| Messages | Ability names up top (not Attack; not Raise Tail / Drop Tail, whose script name is blank "<>", gs §5.2), "Locked On Target", the three hint lines verbatim with the game's "it's", each opening with a quote mark and no speaker name (spec §3.3) | `src/ui/ff7/Ff7BattleHud.ts` |
| Gauges | Limit (`limit-gauge` events, 0 to 255, blink when full) and TIME (the engine's `gaugeSnapshot` through `sync` / `syncGauges`), damage / heal / "Miss" numerals, KO through `syncVitals`, the Barrier boxes empty (unsourced fills) | already in the HUD; now fed by the real engine |
| Clock | The presenter brackets every played burst with `engine.setAnimating(true/false)` (only engines that have it: FF7); the HUD reports `'top'` / `'deep'` so Wait and Recommended hold as core §2.5 says; FF7's default mode is **Recommended** | `src/engine/BattlePresenterAnimating.ts` (new, shared plumbing, inert without `setAnimating`), one line in `BattleScreen.ts` |
| Tail | The raised tail's painting swap and shift (the stage hook from `ff7-engine`) | unchanged |
| Screen | FF7 gets no Ink & Gold battle-start card and no Ink & Gold moments (name slab, letterbox) (spec §7 #15, §8); spell effects draw nothing until their options round (the stage's plain impact still lands) | `BattleScreen.ts`, `battleSpellFx.ts` (shared plumbing) |
| Results | The house results panel with recording off: EXP to each member, AP "PER MATERIA", gil, the Assault Gun; FF7 rows (`LV n · 10 AP to k MATERIA`); the clear time from FF7's own clock | `src/ui/ff7/ff7ResultRows.ts`; `resultsMath.ts`, `ResultsScreen.ts` (shared plumbing) |
| Audit sites | `abilityFactsFor('ff7')` has no rows (no FFX-2 facts), the pause's IN THIS FIGHT column is empty for FF7 | `battleAbilityFacts.ts`, `pause/meters.ts` (shared plumbing) |
| Phone | Two adaptations of the A+ target; **B is the default** (see below); `?ff7phone=a` shows A | `src/ui/ff7/ff7Geometry.ts`, `Ff7PartyRows.ts` |

Settled by Bailey's picks: body face **M PLUS Rounded 1c** (OFL, `public/fonts/ff7/`), the band
**stretches** on 16:9 (no pillarbox), the hint **verbatim**, **music silent** (`null` cues), **no
door sign**.

### Phone layout: B (real-input check, 390x844, taps)

Both were played by taps in the same fight (`sheet-phone-a-vs-b.jpg`). **B reads better**: each
status row carries its name ("Cloud 176/ 316 37"), so a row reads across as FF7's own rows do; in
A the names sit in their own window at other heights than the HP rows, so on a turn nothing on
the HP line says whose it is. B's smaller band also leaves the fighters' feet clear of the command
window. A's larger type (cap 16 px against B's 13) is its one advantage; B's type still reads at
arm's length in the frames.

## Checks

- `npx tsc --noEmit` clean; `npx tsc --noEmit -p tsconfig.e2e.json` clean.
- FF7 unit suites (22 files) pass, including the new `tests/unit/ff7-integration.test.ts` (12:
  the command window from the real engine, Change / Defend by keys and taps and the engine taking
  them, item counts from the bag, quoted dialogue and nameless tail moves, the animation bracket
  and Recommended's hold, an engine without `setAnimating` left untouched, the flow's results
  panel, RETRY with `seed + 1000`, CHAPTER SELECT, `skipResults`).
- Repair pass: the FF7 unit suites (22 files, 343 tests) and `enemy-action-pose` pass, including the new
  `tests/unit/ff7-repair.test.ts` (15: every fighter's feet above the band and heads under the
  message window through a real three.js camera, the diagonal, the painting's bottom at 72 %, no
  turn rings for FF7 and a gold one for FFX, the melee run and the run back, Barret firing in
  place, Braver running, the boss's stand-ins, no motion port for FFX / FFX-2, the presenter's
  order (motion before the wind-up, the run back before idle), the warnings as one block and the
  bracket holding on them, the held Limit gauge, the numeral clamp, Change / Defend over whole
  fields, phone B's names once).
- Full `npm test` (repair pass): 513 files pass, 4 skipped, 1 fails: `strategy-ffx2-bahamut`
  "heal-only route" times out (21 s against 15 s) under the full load, the known timeout also on
  `main`; alone it passes 19/19. `ffx2-atb-golden` passes (6/6); `critic-policy-adoptions` 12/12.
- `node tools/orphans.mjs`: 24, the same list as before (no FF7 module orphaned).
- Every touched shared file stayed under 400 lines or did not grow (`BattleScreen.ts` 931,
  `BattleScreenFlow.ts` 510, `ResultsScreen.ts` 391, `BattlePresenterStage.ts` 746,
  `BattlePresenterPorts.ts` 413, one shorter).

### Real input (`tests/e2e/ff7-guard-scorpion.spec.ts`, one headless GPU Chromium)

1. 1600x900, keys: L I M I T, the fight, Bolt while the tail is down, Defend while it is up, one
   deliberate hit into the raised tail (the Tail Laser frame), Limits when full; victory; results;
   Enter; the board: same snapshot (15 tiles, order, cursor, beaten of total), same words, the main
   save key byte-identical, the experiments store shows the clear.
2. 390x844, touch: seven taps on the label; the same play by taps (Defend by the edge strip);
   victory; the board as it was.
3. 1600x900, keys: attacking every turn into the raised tail loses; the defeat panel; RETRY is a
   new fight at `seed + 1000`; lose again; CHAPTER SELECT; the board as it was; the store shows
   2 attempts, 0 clears.
4. 1600x900, pad: L1 R1 L1 R1 Select on a stand-in pad (`navigator.getGamepads`) opens the fight.
5. 390x844: phone A by taps, for the layout comparison.

Repair pass: runs 1 and 2 also assert that the three warnings are one block (the top window's
line after "Attack while it's tail's up!" is "It's gonna counterattack with its laser.") and run 1
that Cloud reached the strike point (`game-*-melee-strike.jpg`).

Every run asserts no uncaught page error. Frames: `docs/screenshots/ff7/game-<size>-<moment>.jpg`
(door, opening, turn, magic, target, hint-2, hint-3, melee-strike, tail-laser, defend, limit-full,
limit-window, victory, defeat, retry, pad-open), `phoneA-390x844-*.jpg`. Sheets: `sheet-game-1600-a.jpg`, `sheet-game-1600-b.jpg`,
`sheet-game-390.jpg`, `sheet-phone-a-vs-b.jpg`, `sheet-game-vs-composite.jpg`
(`python tools/ff7-game-sheets.py`).

### Bundle (vite build to a scratch outDir, no public dir, gzip -9)

| | First load (entry JS + CSS), gzip | raw |
|---|---|---|
| `origin/main` 1a43fd7b (no FF7 code) | 811,018 B | 3,172,580 B |
| `ff7-integration` (integration) | 837,625 B | 3,251,622 B |
| `ff7-integration` after the repair pass | 839,075 B | 3,255,629 B |
| Difference against main | **+28.1 kB** (the repair adds 1.5 kB) | +83 kB |

Under the 60 kB line, so the FF7 engine, HUD and stage stay static imports (engine check C4
closed by measurement). The M PLUS woff2 is not in the first load: the browser fetches it only
when the FF7 HUD draws text.

## Repair pass: the FF7 purist review (scored 6.8), 2026-09-27

Every major fixed except the two that need Bailey's options round (5 and 7), where the stand-in the
review asked for is built; the minors fixed except 9 and 15 (options) and 17 (kept, flagged).
Game case: **FF7 only**; the four shared files touched are shared plumbing (both + FF7), inert for
FFX and FFX-2 (each takes its FF7 path from a scene switch, a deps field or the game id).

| # | Item | What changed | Files |
|---|---|---|---|
| 1 | Camera: the band hid every fighter below the knees | The fixed camera is raised (y 3.1, z 13.8) and pitched down 8.47 degrees; the painting is turned square to that view and lifted so its floor ends at 72 % of the frame, its crown cropped. At 1600x900 Cloud's feet are at about 66 %, Barret's 59 %, the boss's 62 %: every fighter whole above the band (71 %). Our estimate, solved against the A+ target's raised look. | `src/scenes/sector1-reactor-staging.ts`, `sector1-reactor.ts` |
| 2 | Numerals on the band | Follows from 1; also the numeral anchor is clamped 1.5 numeral heights above the band (and a phone's command window). | `src/ui/ff7/ff7Marks.ts` |
| 3 | Formation: Barret in front of Cloud | Both front row at the same x (4.1), side by side in depth (Cloud z 0.9 downstage, Barret z -1.9 upstage), so from the raised camera they read as a diagonal (Barret's feet about 70 px higher, 90 px nearer the middle). The back row still steps right. | `sector1-reactor-staging.ts` |
| 4 | Melee Attack had no run-up | New presenter port `actionMotion` (optional deps field, called by the beats at action-start and action-end). FF7's: a member whose weapon is not Long Range (Cloud) runs to a strike point in front of the target for a physical action (Attack, Braver), the house wind-up strikes there, the numeral lands, and he runs back. Barret (Gatling Gun, Long Range) fires from his spot. Timings ours. | `src/engine/BattlePresenterMotion.ts` (new), `BattlePresenterBeats.ts`, `BattlePresenterPorts.ts` (one field, file shorter than before); `src/app/screens/BattleScreenFf7Motion.ts`, `BattleScreenGameDeps.ts` (new); `BattleScreen.ts` (same line count) |
| 5 | Enemy abilities have no animation | Stand-ins until the options round: Rifle kicks the body back (-0.35), Scorpion Tail lunges forward (1.1), Tail Laser braces back (-0.5), on top of the house counter lunge. **The effects options round is still owed** (see Open). | `BattleScreenFf7Motion.ts` |
| 6 | Hint lines split by other actions | The three warnings are one block: the HUD's top window never cuts or splits dialogue (an action name waits after its last line), and the animation bracket holds the burst that said dialogue, still animating, until every line has shown (`dialogueShown`). The e2e asserts line 3 follows line 2 with nothing between, at both sizes. | `src/ui/ff7/Ff7HelpLine.ts`, `Ff7BattleHud.ts`, `src/engine/BattlePresenterAnimating.ts`, one argument in `BattleScreen.ts` |
| 7 | House results and defeat | FF7's results rows drop the "x2 PARTY" tag, the clear-time chip (it reads "RESULTS" alone) and NEW BEST. Victory poses (original art) and an FF7 results screen in the blue window material are **the options round still owed**. | `ResultsScreen.ts`, `ui/common/resultsPage.ts`, `resultsPhone.ts` (shared plumbing; FFX and FFX-2 always have a clock, their output is unchanged) |
| 8 | Ground rings on the phone | Scene switch `turnRings: false` (FF7's staging only): no turn ring under any figure; the triangle is the only marker. | `src/scenes/types.ts`, `BattlePresenterStage.ts` (same line count), staging |
| 9 | Phone framing | Not changed (options; see Open). The raised camera made the phone's figures smaller (the whole 16:9 field is shown in the upright letterbox). | |
| 10 | PAUSE chip | For FF7 the chip is an unmarked corner tap zone (opacity 0): nothing drawn on desktop or phone, Esc / Start still pause, a click or tap on the corner still does. | `BattleScreen.ts` (class on the same line), `src/ui/ff7/ff7-screen.css` (new) |
| 11 | Right window spacing | On a desktop every status column sits at its own u as a fraction of the width (spec §5.2): HP 720, max ends 1020, MP 1035-1180, LIMIT 1195-1375, TIME 1385-1565, gauges 180 x 36 px. | `src/ui/ff7/ff7Geometry.ts` |
| 12 | Defend / Change cut words | On a desktop Change reaches to the names window's left edge (the whole name), Defend to the end of the HP field; on a phone the label keeps a pad inside the frame. | `src/ui/ff7/ff7MenuHtml.ts` |
| 13 | Limit gauge before the blow | During a burst the band keeps each gauge where the last full sync left it until that member's own `limit-gauge` event, which the engine emits right after the damage (the engine's state is already the burst's end). | `Ff7BattleHud.ts` |
| 14 | Command window position | FF7's measured box 72-131 u: 360-655 px at 1600, text at 390; the Magic grid's columns at 78 / 130 / 174 u. | `ff7Geometry.ts` |
| 15 | Door and opening | No change (Bailey's picks); noted as approved departures on D-238 and D-240 in `docs/target/decisions.json`, with the FF7 swirl and camera intro as the options to offer. | |
| 16 | Phone B names twice | Phone B's names window keeps only its BARRIER column; each name shows once, at the left of its status row. | `src/ui/ff7/Ff7PartyRows.ts` |
| 17 | SELECT help echoes the name | Kept; flagged as our estimate in the spec's in-game-check list (§9 #4). | `docs/plans/ff7-hud-faithful-a-spec.md` |

Sheets: `sheet-repair-1600.jpg` (before vs after: framing, the Tail Laser numerals, the results
rows), `sheet-repair-moments.jpg` (the warnings' lines 2 then 3; Cloud at the strike point; Defend
over the whole HP field), `sheet-repair-390.jpg` (the phone before vs after), plus the re-shot
`sheet-game-*.jpg`. New frames: `game-1600x900-{hint-2,hint-3,melee-strike,defend}.jpg` and the
same at 390x844.

## Estimates that show (say "our estimate" to Bailey)

Everything in `docs/handoff/ff7-hud.md` and `ff7-engine.md` still stands. New here: the look of the
Change / Defend label beside the edge (FF7 draws the finger there; the small window is ours) and the
touch strips; the item name without the engine's "xN" with the count in its own column; results:
every member's row prints the full EXP (FF7 gives a member KO'd at the end 0; the result does not
say who stood), levels gained are not computed. From the repair pass: the raised camera's height,
pitch and the painting's lift; the party's depth spread; the melee run's strike point (1.4 x the
target's height in front of it), its timings (460 ms there, 400 ms back) and which actions run; the
boss's stand-in lunges; the numeral clamp.

## Open

1. **Options owed to Bailey (rule 9), cheapest first:**
   - **FF7 action effects** (review item 5): the Tail Laser beam from the raised tail across both
     members, the Scorpion Tail strike, the Search Scope lock-on; then Bolt / Ice / Cure and the two
     Limits. Today: the stand-in lunges and the house impact flash.
   - **FF7 results screen** (item 7): blue four-corner windows, the EXP and AP rows, the Gil and
     Items window, and victory poses (a new "win" painting per fighter); Game Over for a wipe.
   - **Upright phone framing** (item 9): (a) a taller crop with the camera moved in on the fight so
     the fighters fill the width, (b) the top message window moved down onto the scene, (c) keep
     the letterbox. Since the raised camera, the phone shows the whole field small (Cloud about
     50 px tall) with dark bands above and below.
   - **Opening** (item 15): an FF7-style battle swirl for the FF7 fight only, and a short camera
     intro; today the chapters' own transition, by Bailey's pick.
2. **Target vs build**: windows, band, command window, finger, Magic grid with the MP window, the
   Limit colours and the Limit window match A+; the field is now framed like the target (raised,
   everyone whole above the band). Differences to judge: the real paintings instead of the
   target's placeholders; no laser beam or spell effects (item 1 above).
3. **Pause** is the house Ink & Gold screen with FF7 rows; an FF7 pause would be a new screen
   (options first).
4. **Active mode's running gauges during animations**: the engine and the bracket support it, but no
   presenter ticks the clock during playback and no FF7 Config row can choose Active; Recommended
   is the only reachable mode.
5. Music stays `null` until an original FF7 cue exists and Bailey hears it (approved departure).
6. `critic/policy.json` has no `ff7` game or `ff7-engine` system row yet (driver to-do from the
   architecture plan §2.4); `decisions.json` allows `game: 'ff7'` (D-237, D-238, D-240).
7. The deep review for a new engine is owed after the deploy (architecture plan §2.4).

## Run it

In the worktree: `npx vite --port 6400 --base /pyrefly-reprise/`, open
`http://127.0.0.1:6400/pyrefly-reprise/`, go to chapter select, type LIMIT. The e2e:
`PREVIEW_PORT=6400 PYREFLY_BROWSER=gpu npx playwright test tests/e2e/ff7-guard-scorpion.spec.ts`
(reuses the running server). Stop the server by its port when done.
