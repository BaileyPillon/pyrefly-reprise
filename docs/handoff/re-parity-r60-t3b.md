# Re-parity r60 t3b: the foe cursor opens on the game's first foe (`cursorStartFoe` ships ON)

Status: **built, tested and committed on branch `re-parity-r60-t3b`** (from `6db09ac86`, the r59 tip); pushed to `origin/re-parity-r60-t3b` (the tip: `git rev-parse origin/re-parity-r60-t3b`).
**Game case: FFX only** (AGENTS.md rule 14). Nothing in `src/battle/ffx2`, `src/ui/ffx2` or FF7 changed; `ffx2-atb-golden` and `ff7-golden` are byte-identical to `6db09ac86`. No boss number and no party number was changed.

Bailey's word: his pick for t3b was "measure first". Live session 8 measured it on 2026-10-20 (slot 57, Macalania - Road, a battle of three foes); the release driver recorded the result as decision 158 (delegated) and asked for this r60 tip.

## 1. The measurement ([M], live session 8, 2026-10-20, save slot 57)

The FFX target-cursor probe (`sampler_ffx_live_v3.py`, the level's step flag and the candidate block) logged, for the first Attack of the battle (events log of the run, `D:/Tools/ffx-hd/observe/2026-10-20-live8/ffx_a/events.log`, lines 19 to 23):

```
TARGET STEP opened: depth=1 user=1 lvstep=1 side=foes count=3 idx=0 mask=[20] allies=3 foes=3 switch=1
TARGET STEP idx 0 -> 1: ... side=foes count=3 idx=1 mask=[21]
TARGET STEP idx 1 -> 2: ... side=foes count=3 idx=2 mask=[22]
TARGET STEP idx 2 -> 0: ... side=foes count=3 idx=0 mask=[20]
TARGET STEP closed (depth=0 lvstep=0)
```

So the foe cursor opens on foe index 0 (mask bit 20 = monster slot 0x14 = formation index 0), and Right steps through slot order with wrap (0, 1, 2, 0). That is what item `cursorStartFoe` (t3b) of `src/battle/ffx/target-step-parity.ts` implements: a foe-first command opens on `foes[0]` of the foe list in formation order (`ctx.state.enemyIds`). It was left off in r55 RE "until a live frame confirms the order" (`live/2026-10-18-live-plan.md`, t3b).

## 2. The change

- `src/battle/ffx/target-step-parity.ts`: `TARGET_STEP_PARITY` is now `{ on: true, skip: ['sideSwitch'] }` (was `['cursorStartFoe', 'sideSwitch']`). The header, the switch's doc comment and the comment in `recordStep` cite the measurement and decision 158. No other source line changed.
- What the player sees: the first attack (and every foe-first command: Attack, the Breaks, Steal, the black magic, Provoke, Talk, Pull back and Cancel order, the single-foe Overdrives, the random-foe Overdrives against one foe, Scan, Lancet, Poison Fang, Candle of Life, Dispel) opens its cursor on the first foe in formation order, not on the foe standing leftmost on screen. Chapter I: the cursor opens on **Seymour Flux**, not on Mortiorchis, his mount. Dispel (foe side first, may also point at allies) opens on the first foe, not on the first candidate.
- Legality, resolution, the strategies, the advisor and the coach read `validTargets` only and are untouched; the start is presentation.

## 3. Tests re-pinned (each with a one-line note in the file)

| File | What moved | Note |
|---|---|---|
| `tests/unit/parity-ffx-shipped-switches.test.ts` | the switch table row; the module-defaults test now expects `{ on: true, skip: ['sideSwitch'] }` and `cursorStartFoe` ON; the Chapter I target-step test now expects Tidus's Attack `start` = `seymour-flux` (enemyIds `['seymour-flux', 'mortiorchis']`), still no `switchTo` | the shipped-state pin |
| `tests/unit/ui-ffx-shipped-switches.test.ts` | header comment; **new** real-key test: Chapter I, Tidus's Attack, with a projector that puts the mount leftmost on screen, still opens the cursor on `seymour-flux` | HUD half of the same pin |
| `tests/unit/ui-ffx-doublecast-hud.test.ts` | `toRoundTwo()` stepped on blind (`Enter`) to "the first target the cursor opens on", which was Yu Pagoda A (leftmost on screen); the cursor now opens on the boss (formation index 0), so cast 1 landed on Braska's Final Aeon and two assertions ("Fira > Yu Pagoda", "Cast 2 ... Yu Pagoda A") moved. The rig now steps `ArrowLeft` to Yu Pagoda A on purpose, as a player would; every assertion is unchanged | 2 tests moved, 0 assertions edited |
| `tests/unit/parity-ffx-target-step.test.ts` | wording only: the "as shipped" comments and two test titles said cursorStartFoe was off in the build; they now call the skipped path "the r55 state, kept as the OFF-path check". The OFF-path tests (`on(['cursorStartFoe'])`) are kept and still pass | no value moved (the file pins every switch OFF through `pinSwitchesToPreR55`) |
| `tests/unit/helpers/pinPreR55Switches.ts` | comment only | |

`ui-ffx-target-step-parity.test.ts` and `ffx-lone-target-step.test.ts` pin the switches explicitly and did not move.

## 4. Proofs

**Revert proof (only the switch line put back).**
- The ORIGINAL (HEAD) `parity-ffx-shipped-switches` and `ui-ffx-doublecast-hud` files, copied to scratch test files: against the new line 4 tests fail (the module-defaults pin, the Chapter I foe-start pin, and the two doublecast assertions); with the one line put back (`skip: ['cursorStartFoe', 'sideSwitch']`) all of them pass (9 + 12) and so does the fixed `ui-ffx-doublecast-hud` (12). The source was restored afterwards (`git diff` shows the one-line change).
- The NEW `parity-ffx-shipped-switches` and `ui-ffx-shipped-switches` against the old line: 3 fail with the old values returning (switch `skip` has `cursorStartFoe`, Chapter I Attack has no `targetStep`, the HUD cursor opens on `mortiorchis`, the leftmost foe on screen).
- In-process overlay (`setTargetStepParity(true, ['cursorStartFoe', 'sideSwitch'])`, scratch test): shipped, Chapter I Tidus Attack `start` = `seymour-flux` and the HUD cursor on `seymour-flux`; overlay, no `start` and the HUD cursor on `mortiorchis`.

**Checks.** `tsc --noEmit` clean; `node tools/orphans.mjs` unchanged (no module added).

**Goldens.** `ffx-engine-golden` (18), `chapters/last-summoning-iii-pin` (17), `ffx2-atb-golden` (6), `ff7-golden` (3) all pass, and none of their test files or fixtures differs from `6db09ac86` (`git diff 6db09ac86 -- <those files> tests/fixtures` is empty), so every digest equals the one pinned at the base.

**12-seed identity (Chapters I, III, VII, XIV = seymour-flux, braskas-final-aeon, seymour-anima-macalania, isaaru-via-purifico; seeds 13 to 24; 48 plays; the intended strategy; base = `6db09ac86` through the in-process overlay of `target-step-parity.ts`, the lab is a copy of `rc11/r55-re-check-evidence/lab2.mjs`)**: outcomes, links won (141 = 141), party turns (4509 = 4509), engine turns (7307 = 7307), party KOs (20 = 20), event counts (42,812 = 42,812), refusals (0 = 0), final victories (45 = 45), **event-log hash, legal-rows hash (rows without `targetStep`) and HUD target-mode hash: 0 of 48 plays differ**. Only the full row digest (which includes `targetStep.start`) differs, in 48 of 48 plays. A check on the tip over 86,603 rows with a step found 30,258 foe starts; the 948 that are not `candidates[0]` are all Dispel (`single-any`, allies listed first), whose start is the first foe.

**Chapter I.** The engine's Attack row for Tidus: `targetStep = { candidates: ['seymour-flux', 'mortiorchis'], start: 'seymour-flux' }`; through the real `CommandMenu` with real `KeyboardEvent`s (Attack, Enter) the cursor's active target is `seymour-flux` even when the projector puts Mortiorchis leftmost on screen (`ui-ffx-shipped-switches.test.ts`). With the old line it opened on `mortiorchis`.

**Test counts.** 106 files, 1,392 tests passed, 1 todo, 0 failing in the final state: 88 files for everything that opens the FFX target cursor or reads `targetStep` / `preferredTargets` / the advisor and coach with FFX rows (the five shipped-switch and target-step files, the `critic-route-*` files, the `advisor-*`, `coach-*`, `ffx-*` and `ui-ffx-*` files, the chapter presenter files) = 1,169 passed + 1 todo (first run: 2 failed in `ui-ffx-doublecast-hud`, fixed as above, file re-run 12 of 12); plus 18 files (the four goldens and 14 files that drive FFX rows with a cursor) = 223 passed. No full suite was run (the release driver does that). No art-only failure showed in these files.

## 5. Open items

- **The arrows still step in on-screen order, not slot order.** The live log shows Right going 0, 1, 2, 0 through slot order; `TargetCursor.step` walks the projected left-to-right order. Decision 158 was about the start only, so this was not changed. Whether the two orders differ for a shipped formation (in the Chapter I test the projector puts the mount leftmost, so the cursor's Right from Seymour goes to the mount in both orders, but a three-foe formation can differ) is a question for a later track; it would change the HUD (`TargetCursor`), not the engine.
- **Chapter I's formation order rests on our data.** The live measurement proves the start index (0, slot 0x14) in a three-foe random battle; "Seymour Flux is slot 0x14, Mortiorchis the next" is `ctx.state.enemyIds` from the encounter data (the enemy group's order). A check of the Seymour Flux formation's slot order against the install's formation record would close it; nothing was found that contradicts it.
- The start is the first foe **in the row's candidate order**; if foe 0 is KO'd the first living foe is used (`foeList` and `validTargets` hold the living foes). Not separately measured live.

## 6. CHANGELOG line (FFX only)

FFX: the first attack in a fight with several enemies now opens its cursor on the enemy the original game opens on (for example Seymour, not his mount, in Chapter I), as measured in the real game.
