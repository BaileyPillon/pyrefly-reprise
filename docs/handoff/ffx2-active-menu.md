# FFX-2 Active: the open menu keeps its owner, a chained girl keeps her command, and the Config ATB speed

**Game case: FFX-2 only** (chapters 4 and 5, and any later FFX-2 chapter). The
clock under an open menu is FFX-2's Active ATB (Bailey's D-009, *"For ffx-2 I choose
active"*, which stays: Active only, no Wait toggle). The lock is
`research/ffx2-combat-core.md` §1.7, *a chained target cannot start executing its own
action* `[verified: 2 sources]`. The speed is FFX-2's Config "ATB Mode and Speed"
(§1.2 `tickRate()`; `research/ffx-vs-ffx2-presentation.md:278`). FFX is CTB: no clock
under a menu, no chain lock, no tick rate. The pause row is printed in FFX-2 chapters
only; `tests/unit/pause-atb-speed.test.ts` and the browser pass check the FFX absence.

Answers critic round 08 **PR-0076** and **PR-0080** (the HOLD on the next candidate).
Preflight: `docs/plans/ffx2-active-menu-review.md` (written before the code, verdict
PROCEED). No boss was touched and no game data changed.

## 1. Commits

| Commit | What | Release class |
|---|---|---|
| `15385ab` | The two fixes: chain-locked owner keeps her menu; a command confirmed while chained is held and fires as her | FFX-2 ATB engine + presenter: focused before deploy, deep after |
| `27c3601` | The Config ATB speed lever in the engine (Slow / Normal / Fast), default Normal, byte-identical | same |
| `030d7e1` | Persistence (`Settings.ffx2AtbSpeed?`), the pause row, the engine wiring | **touches `src/app/SaveData.ts` → save-data class → deep review BEFORE deploy** (`critic/RUBRIC.md`, AGENTS.md "Release") |

**The split is deliberate.** The HOLD fix (`15385ab`, and `27c3601` if wanted) can ship on a
focused review without waiting on the save-data review the third commit owes.

## 2. What was wrong, from the code

`inputStillValid` required `canTakeTurn`, which fails on `isActionLocked`. So the instant
an enemy hit chained the menu's owner, the pump returned `'invalidated'`, the presenter
closed the menu, and `nextDecision()` opened the next ready girl's list in the same place,
cursor on row 0: PR-0080's 262 ms swap. The engine's own owner preference used the same
predicate, so even `nextDecision()` moved the owner. Four in five of the menus chapter 5
lost at human decision speed were exactly this (PR-0076).

## 3. What changed

**Engine (`src/battle/ffx2/active.ts`, `engine.ts`).**

- `ownsInput(unit)` = ready, can act, not an enemy still thinking: `canTakeTurn` minus the
  chain lock. Menu validity and the owner preference use it, so a chained owner keeps her
  menu; every other ready girl waits behind her (full bar in the ATB rows). KO, Stop,
  Sleep, Petrify, Berserk and battle-over still close the menu: those owners cannot answer.
- `submit` on a chained owner **holds** the command (`HeldCommand`, engine-internal like
  `inputOwner`; no event, state or save shape). It fires as her, and as nobody else, in the
  first sub-step after the window closes: under the Active pump (the pump plays it like an
  enemy turn) or on the Wait path (`nextDecision` / `tick`). Dropped unspent on KO / Stop /
  Sleep / Petrify / Berserk; an all-dead target set gives her a fresh menu, turn not spent.
- `heldCommand()` read-only, for tests and the measurement.
- Config speed: `ATB_SPEED_MULTIPLIER` in `constants.ts` is §1.2's own quotients
  (`0.53 / 0.71`, `1`, `0.53 / 0.42`, i.e. 0.7465 / 1 / 1.2619), `Ffx2EngineOptions.atbSpeed`
  (default `'normal'`), `setAtbSpeed()` / `atbSpeed()`. The rate is applied only where real
  ms cross into the engine (`tick`) and back out (`'waiting'`, elapsed ms), so the whole
  game clock scales as one (§1.2 "a single global tick rate"). At Normal every new multiply
  and divide is by exactly 1: bit-identical.

**Presenter (`src/engine/BattlePresenterActive.ts`).** No control-flow change was needed:
the pump already stops only when the menu settles or `inputValid` fails, and a chain lock
no longer fails it. `PumpStop` and the module comment now say so (property 6).
`BattlePresenter.ts` and `HudPort` are untouched; no contract file changed, so there is no
`docs/CONTRACT-CHANGES.md` entry.

**App (third commit).**

- `src/app/SaveData.ts`: `Settings.ffx2AtbSpeed?: 'slow' | 'normal' | 'fast'`. **Optional,
  no migration, not in `defaultSettings()`**: an absent value reads as Normal, the engine
  exactly as every existing save (Bailey's included) has always played.
  `tests/unit/pause-atb-speed.test.ts` pins that `migrate` leaves it undefined.
- `src/app/screens/pause/settings.ts`: `ATB_SPEEDS` and the `ffx2AtbSpeed` case, written
  through `save.setSettings` exactly like the volumes. Left / Right / Confirm step and wrap.
- `src/app/screens/pause/panels.ts` + `PauseView.ts`: `OptionsContext.game`; the `ATB SPEED`
  row (SLOW / NORMAL / FAST) under `X-2 BATTLE`, FFX-2 only, in the existing row style.
- `src/app/screens/BattleScreenWiring.ts`: `applyAtbSpeed(engine)` when the engine is built;
  `src/app/screens/BattleScreen.ts` calls it again as the pause closes, **before** the clock
  is released. A no-op for FFX.

## 4. Measured

`PYREFLY_MEASURE=1 npx vitest run tests/unit/ffx2-active-measure.test.ts` (40 seeds per arm,
the shipped `intendedStrategy`, fake clock; `D` is a modelled decision time charged at
every decision, an upper bound). New columns: commands held, runs by links cleared.
`PYREFLY_ATB_SPEED=slow|fast` adds a speed arm.

| arm | before (round 08) | after the fixes, Normal | after, Slow |
|---|---|---|---|
| ch4 D=0 | 40/40, 100.7 s | 40/40, 100.7 s (byte-identical) | 40/40 |
| ch4 D=1500 | 40/40, median 170.1 s, 510 menus invalidated | 40/40, **143.4 s, 15 invalidated**, 387 held | 40/40, 179.6 s real |
| ch4 D=4000 | 40/40, 229.7 s, 762 invalidated | 40/40, 159.3 s, 24 invalidated | 40/40 |
| ch5 D=0 | 40/40, 373.0 s | 40/40, 373.0 s (byte-identical) | 40/40 |
| ch5 D=1500 | **0/40**, 141.6 s, 948 invalidated | **4/40**, 860.1 s, 173 invalidated, 1494 held | 5/40 |
| ch5 D=4000 | 0/40, 126.8 s | 0/40, 498.0 s | 0/40 |

Chapter 5, runs by links cleared (tail / leg / body / head / Shuyin), D = 1500:

| | 0 | 1 | 2 | 3 | 4 | 5 (win) |
|---|---|---|---|---|---|---|
| before (measured on the pre-change tree, this session) | 19 | 17 | 0 | 3 | 1 | 0 |
| after, Normal | 1 | 6 | 1 | 19 | 9 | 4 |
| after, Slow | 3 | 8 | 0 | 21 | 2 | 5 |

**Honest reading.** The critic's acceptance check (a majority of chapter 5 seeds at
D = 1500) is **not met**: 4/40. The fixes removed 82 % of the lost menus and moved the
typical run from dying on the first or second link to reaching the Head, but the intended
line still loses there at a modelled 1.5 s per decision. That remaining gap is the balance
question PR-0076 always said was Bailey's; the player-side options measured so far are in §7.
Slow (0.746x) alone buys one seed.

## 5. Tests (each new engine/presenter case failed on the old code first)

- `tests/unit/ffx2-active-menu.test.ts` (6): the chained owner's menu stays valid; a
  command confirmed while chained is held and executes as her when the lock lifts (Active
  path) and on the Wait path, once; a held command whose owner is KO'd is dropped and never
  fires as anyone; the input owner never changes while she can answer, chained every step
  with every girl ready; **through the real `BattlePresenter`**, a chained owner's menu is
  never closed or re-opened for another girl and her answer lands on her. All six failed on
  `8e1192a` (the presenter case with `['paine', 'yuna']`, the swap itself).
- `tests/unit/ffx2-atb-golden.test.ts` (4): sha256 of every event log, chapter 4 and the
  chapter 5 chain, seeds 1-20 at D = 0 recorded **before** any change; seeds 1-10 at
  D = 1500 recorded after the fixes and before the lever; both again with `atbSpeed: 'normal'`
  explicit.
- `tests/unit/ffx2-atb-speed.test.ts` (10): the multipliers are the research's quotients;
  real ms → game ticks at each speed; elapsed ms stays real; the chain window runs on the same
  clock; the same seeds win at every speed at D = 0; the Wait path asks for real ms;
  `setAtbSpeed` mid-battle; survives `init` (chained links).
- `tests/unit/pause-atb-speed.test.ts` (7): the row in FFX-2, absent in FFX and when no game
  is named, steps and wraps, persists and reloads like the volumes, needs no migration, and
  `applyAtbSpeed` reaches an FFX-2 engine and is a no-op for FFX.
- `tests/unit/helpers/ffx2ChapterDrive.ts`: the shared chapter 4/5 driver.

## 6. Browser pass (real input, own Vite server on 5747, `PYREFLY_BROWSER=gpu`, 1600x900)

`.ffx2-active-menu-browser-tmp.mjs` (agent scratch). Chapter 4, seed 7: Paine's menu open,
Paine re-chained every 250 ms and both other girls ready: 12 samples over 3 s, **0 changes**
of rows (`Attack | Skill | Change | Item`) or owner, while the clock ran (ticks 5628 → 12712).
Enter, Enter: the first party turn-start is Paine's. Pause, real keys to OPTIONS: the ATB SPEED
row sits under X-2 BATTLE; ArrowRight twice reads NORMAL → FAST → SLOW; Escape: the engine
reads `slow` and the save holds `slow`. Chapter 1 (FFX control): no ATB SPEED row.
Screenshots: `docs/screenshots/ffx2-active-menu/ch4-chained-owner-menu-held.png`,
`ch4-held-command-landed.png`, `ch4-pause-options-atb-speed.png`,
`ch1-ffx-pause-options-no-atb-speed.png`.

## 7. Open for Bailey

1. **Chapter 5 at human speed is still his decision (PR-0076).** Re-measured after PR-0075 (release-09
   repair, `docs/handoff/release-09-repair.md`): 32/40 at 500 ms, 27/40 at 750, 11/40 at 1000, 5/40 at
   1500, 0/40 at 4000; the verifier refuted any claim that the HOLD is cleared. 0/40 → 4/40 at a modelled
   1.5 s per decision; the runs now die on the Head instead of the Tail. Player-side levers
   left, none built: a ready chime / clearer bar state; last-command repeat; leave it (the
   last fight, and the D model is an upper bound). The boss is not touched.
2. **The ATB SPEED row is something he sees (rule 9).** It uses the existing OPTIONS row
   style and no new layout, and it is a sourced Config entry, but it has not been shown to
   him as an option; it wants his yes before it is considered approved.
3. **Held timed-input commands** (Trigger Happy, Lady Luck reels confirmed while chained)
   resolve with the engine's seeded default roll, because an overlay cannot suspend a
   running clock under somebody else's menu. Rare. Alternative: refuse the hold for those
   two and reopen the menu when the lock lifts.
4. **Does retail's Config speed also scale the chain window?** Not sourced. The build
   scales the one global clock (the research's words); a first draft that kept the window in
   real seconds made Slow a balance change (chapter 5 at D = 0 fell to 37/40) and was dropped.
5. **Nothing on screen says a command is held.** The girl just waits with a full bar until
   her lock lifts. A HUD mark would be a new visible element (rule 9: options first).

## 8. Not done / noticed

- **`X-2 BATTLE  ACTIVE / WAIT` is a toggle that does nothing.** `Settings.ffx2Atb` is written
  by the pause row and read by nothing but the pause's own member meters; the engine always
  runs Active. It contradicts D-009 ("no Wait toggle") and a player who picks WAIT gets no
  relief. Not touched (outside this brief; removing a visible row is Bailey's call).
- A battle damage numeral (`131`) draws over the pause screen in
  `ch4-pause-options-atb-speed.png`: the damage-number layer sits above the pause overlay.
  Not this track's; noted for the pause owner.
- **House rule 7**: `src/battle/ffx2/engine.ts` 637 → 723 lines and `BattleScreen.ts`
  905 → 907, both already over 400 before this track (see `ffx2-active-atb.md` §7b); the new
  policy code went to `active.ts` (194) where it could.
- `npx tsc --noEmit` is clean at `030d7e1`. (During the build it briefly reported five
  unused imports in `tests/unit/ui-common-results.test.ts`, another agent's in-flight
  results work, since committed as `a202d16`.) Full unit suite: 232 files green.
- `docs/handoff/NOW.md` is the orchestrator's; not edited here.
