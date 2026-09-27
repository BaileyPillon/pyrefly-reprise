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
- Full `npm test`: 512 files pass, 4 skipped, 1 fails: `strategy-ffx2-bahamut` "heal-only route"
  times out (23 s against 15 s) under the full load, the same known timeout as on `main`; alone it
  passes 19/19. `ffx2-atb-golden` passes (6/6).
- `node tools/orphans.mjs`: 24, the same list as before (no FF7 module orphaned).
- Every touched shared file stayed under 400 lines or did not grow (`BattleScreen.ts` 931,
  `BattleScreenFlow.ts` 510, `ResultsScreen.ts` 388).

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

Every run asserts no uncaught page error. Frames: `docs/screenshots/ff7/game-<size>-<moment>.jpg`
(door, opening, turn, magic, target, tail-laser, limit-full, limit-window, victory, defeat, retry,
pad-open), `phoneA-390x844-*.jpg`. Sheets: `sheet-game-1600-a.jpg`, `sheet-game-1600-b.jpg`,
`sheet-game-390.jpg`, `sheet-phone-a-vs-b.jpg`, `sheet-game-vs-composite.jpg`
(`python tools/ff7-game-sheets.py`).

### Bundle (vite build to a scratch outDir, no public dir, gzip -9)

| | First load (entry JS + CSS), gzip | raw |
|---|---|---|
| `origin/main` 1a43fd7b (no FF7 code) | 811,018 B | 3,172,580 B |
| `ff7-integration` | 837,625 B | 3,251,622 B |
| Difference | **+26.6 kB** (JS +26.0, CSS +0.6) | +79 kB |

Under the 60 kB line, so the FF7 engine, HUD and stage stay static imports (engine check C4
closed by measurement). The M PLUS woff2 is not in the first load: the browser fetches it only
when the FF7 HUD draws text.

## Estimates that show (say "our estimate" to Bailey)

Everything in `docs/handoff/ff7-hud.md` and `ff7-engine.md` still stands. New here: the look of the
Change / Defend label beside the edge (FF7 draws the finger there; the small window is ours) and the
touch strips; the item name without the engine's "xN" with the count in its own column; results:
every member's row prints the full EXP (FF7 gives a member KO'd at the end 0; the result does not
say who stood), levels gained are not computed.

## Open

1. **Target vs build** (`sheet-game-1600-a/b.jpg`, `sheet-game-390.jpg`): windows, band, command
   window, finger, Magic grid with the MP window, the Limit colours and the Limit window match A+.
   Differences to judge: the real paintings and reactor instead of the target's placeholders; the
   Tail Laser frame shows one numeral (the other had already faded, the motion is our estimate) and
   no laser beam (spell effects are not built); a numeral lands where the figure's chest projects,
   which for Cloud is over the LIMIT header at 1600x900; on the phone the house PAUSE chip overlaps
   the top message window's corner.
2. **Upright phone framing**: the field is still the stage's 16:9 letterbox in the middle of the
   screen with an empty dark top half (stage handoff Open 3). A framing for portrait is an options
   question.
3. **Results and pause** are the house Ink & Gold screens with FF7 rows (recording off); an FF7
   results screen and pause would be new screens (rule 9: options first).
4. **Spell effects** (Bolt, Ice, Cure, Braver, Big Shot, Tail Laser) draw nothing of their own yet
   (options round); the house impact flash plays.
5. **Active mode's running gauges during animations**: the engine and the bracket support it, but no
   presenter ticks the clock during playback and no FF7 Config row can choose Active; Recommended
   is the only reachable mode.
6. Music stays `null` until an original FF7 cue exists and Bailey hears it.
7. `critic/policy.json` has no `ff7` game or `ff7-engine` system row yet (driver to-do from the
   architecture plan §2.4); `decisions.json` now allows `game: 'ff7'` (D-237, D-238, D-240).
8. The deep review for a new engine is owed after the deploy (architecture plan §2.4).

## Run it

In the worktree: `npx vite --port 6400 --base /pyrefly-reprise/`, open
`http://127.0.0.1:6400/pyrefly-reprise/`, go to chapter select, type LIMIT. The e2e:
`PREVIEW_PORT=6400 PYREFLY_BROWSER=gpu npx playwright test tests/e2e/ff7-guard-scorpion.spec.ts`
(reuses the running server). Stop the server by its port when done.
