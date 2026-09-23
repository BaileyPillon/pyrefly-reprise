# Paper preflight: FFX-2 Wait mode, and Wait as the default

Paper preflight under `critic/RUBRIC.md` §4 / AGENTS.md rule 15, written **before** any
product code. Track: `ffx2-wait-mode`. `node tools/critic-plan.mjs --paths
src/battle/ffx2/engine.ts,src/app/SaveData.ts,src/engine/BattlePresenterActive.ts` classes
the change **DEEP** (FFX-2 ATB engine, battle presenter, save data and settings), and the
save-data class means **a deep review of the candidate BEFORE deploy**. Written 2026-09-22
by a sub-agent of the orchestrator.

Bailey's decision, verbatim (2026-09-22 21:45 EDT, answering "chapter 5 at human speed:
A ship disclosed / B Slow default / C Wait mode / D other"):

> "1. C Wait mode. Also I want the default to be wait mode instead of active mode please."

It supersedes D-009 ("For ffx-2 I choose active." — Active only, no Wait toggle).

**Verdict: PROCEED.**

## 1. Game case (rule 14): FFX-2 only

| Piece | Case | Why |
|---|---|---|
| Wait mode in the engine and the pump | **FFX-2 only** | ATB Mode is an FFX-2 Config entry (`research/ffx2-combat-core.md` §1.5; `research/ffx-vs-ffx2-presentation.md:278`, "ATB Mode and Speed"). FFX is CTB: nothing moves while a menu is open, there is no clock to stop. `activeClockEngine()` already returns `null` for the FFX engine; `tests/unit/ffx-no-active-clock.test.ts` stays the absence test. |
| The `X-2 BATTLE ACTIVE/WAIT` pause row | **FFX-2 only** as behaviour; the options list is shared pause plumbing | The row already exists and is written; this track makes the engine read it. |
| `Settings.ffx2Atb` default | **FFX-2 only** | Only the FFX-2 engine reads it. |

## 2. What the research says Wait does, and where it disagrees with the brief

`research/ffx2-combat-core.md` §1.5, "Active vs Wait mode":

- **Active** `[single source: Split Infinity G0913]`: time never stops, including in the
  item list or a magic submenu (built, D-009, `docs/handoff/ffx2-active-atb.md`).
- **Wait** `[single source]`: *time runs while the top-level Main Command Window is open,
  but freezes the moment any submenu is entered* (Item list, White Magic list, Garment Grid
  screen). The on-screen indicator reads "Active mode" / "Wait mode" (§1.5; the HUD layout
  row at line 3176).
- §1.1 phase table, same source: "in **Wait** mode time freezes as soon as a submenu is
  entered".
- **Automatic Wait** `[single source]`: long animations freeze time in either mode. Already
  structural (the pump does not run during `play`; `BattlePresenterActive.ts` property 5).

**The research disagrees with the brief on one detail:** the source says the clock keeps
running at the *top-level* command window and stops only once a submenu (or the Garment
Grid) is entered. The brief asks for the clock to stop from the moment the menu opens.

**The reading built: the clock stops for the whole time a command menu is open**, top
level included, from the moment the menu opens to confirm. Why this, written down:

1. It is the simplest reading that the engine can honour on its own. The engine and the
   pump know *that* a menu is open (the input owner), not *which level* of it the cursor is
   on; the top-level/submenu split needs a new HUD port method in `src/ui/ffx2/**`, which
   this track does not own.
2. It is exactly the engine's behaviour before Active existed (round 05 PR-0046 measured
   `ticks 8189 -> 8189` over 2013 ms with the chapter 4 menu open), so it is already
   proven on every chapter, and at any decision time it reproduces the `D = 0` golden
   byte for byte (section 5, I3).
3. The difference is small in play (the top-level window is one keypress deep: Attack or
   a submenu), and it only ever makes Wait more forgiving, which is what Bailey chose it
   for.

**Open question for Bailey** (in the handoff): the faithful split, where the clock keeps
running at the top-level window and stops in a submenu. Not built without his yes. The
"Active mode" / "Wait mode" HUD indicator is also unbuilt (the HUD is not this track's).

## 3. The engine change (`src/battle/ffx2/active.ts`, `engine.ts`, `internal.ts`)

- `Ffx2EngineOptions.atbMode?: 'wait' | 'active'`, **default `'wait'`**. New type
  `AtbMode` in `active.ts`.
- `FFX2Engine.setAtbMode(mode)` / `atbMode()`, changeable mid-battle (the pause row), and
  surviving `init` like `setAtbSpeed`.
- The rule, in one pure predicate `clockHeldByMenu(mode, inputOwner)` in `active.ts`:
  under `'wait'`, while an input owner is set (a `'player-input'` decision has been handed
  out and not yet answered), **`tick()` advances nothing**: no ATB, no CTIM/RECTIM, no
  status clock (Regen, Poison, durations), no chain window, no enemy turn, and no
  `carriedTicks` banked. It returns `flush()` (empty). This holds for `tick(ms)` and
  `tick(ms, { throughInput: true })` alike: in Wait there is no path that moves the clock
  under a menu.
- The owner is cleared on submit (including the held/refused branches), on
  `battle-over`, and on the next `nextDecision()` when the next actor is not a player, so
  the clock resumes on confirm and never stays frozen by a stale owner.
- The 15385ab rules (held command, owner never changes under the thumb) stay as they are
  for Active and are harmless in Wait: with no tick under a menu, nothing can chain, KO or
  Stop the owner while she chooses, so `held` is never set and `inputValid` never flips.
- `engine.ts` is at 636 lines (over the house cap since before this track, split once by
  349712f); it gains only the option plumbing and one guard line in `tick`. The policy is
  in `active.ts`.

## 4. The presenter (`src/engine/BattlePresenterActive.ts`)

- `ActiveClockEngine` gains an optional `atbMode?(): 'wait' | 'active'`.
- The pump keeps running for every FFX-2 menu (so a runtime switch lands at once), but
  **each step asks the mode first**: under `'wait'` it does not call `tick` at all, moves
  `last` to now (so the time spent in Wait is never banked and handed over later), and
  refreshes the gauges. Flip to ACTIVE in the pause while a menu is open: on close the
  next pump step ticks through input exactly as 15385ab did. Flip to WAIT: the next step
  stops ticking.
- An engine without `atbMode` (an older test double) reads as Active: the pump's old
  behaviour, byte for byte.

**As built (changed during the build, 2026-09-22):** an idle Wait pump spins forever on an
unscaled sleep that resolves at once (the `'skip'` speed, every presenter test double),
which the first full-suite run caught as a hang. So a Wait engine gets **no pump at all**:
`activeClockEngine()` returns `null` for it, once per menu, and the presenter takes the
plain pre-Active path (`await` the command). A pump already running when the pause flips
the row to WAIT returns `'settled'` at its next step without calling `tick`. A flip to
ACTIVE lands from the next menu, not the one open under the pause (disclosed in the
handoff). `BattlePresenter.ts` itself is untouched.

## 5. Invariants, and the tests that pin them (each fails on today's code first)

| # | Invariant | Test |
|---|---|---|
| I1 | Wait: with a menu open, `ticks`, `elapsedMs`, every gauge and every status duration are identical before and after 6 s of `tick(ms, {throughInput})` and of plain `tick(ms)` | `tests/unit/ffx2-wait-mode.test.ts` |
| I2 | Wait: on confirm the clock resumes (the next `'waiting'` tick advances) | same |
| I3 | Wait golden: chapters 4 and 5, seeds 1-20, at `D = 1500` are **byte-identical to the `D = 0` golden** and 20/20 | `tests/unit/ffx2-atb-golden.test.ts` (new arm) |
| I4 | Active golden unchanged (`D = 1500` arm) with `atbMode: 'active'`; a Wait-built engine switched to Active before the first decision reproduces it byte for byte | same |
| I5 | The ATB rows during a Wait menu: the owner's bar full, every other bar frozen (snapshot equal before and after) | `ffx2-wait-mode.test.ts` |
| I6 | The engine default is `'wait'`; `setAtbMode` round-trips | same |
| I7 | A Wait engine gets no pump (`activeClockEngine` → `null`); a pump flipped to Wait mid-menu stops at the next step without a tick | `ffx2-wait-mode.test.ts` (fake engine + fake clock) |
| I8 | A fresh `SaveStore` reports `ffx2Atb: 'wait'`; the pause row flips and persists across reload | `tests/unit/pause-play-time.test.ts`, `pause-atb-mode.test.ts` |
| I9 | `BattleScreenWiring.applyAtbMode` pushes the setting to an FFX-2 engine, no-op on FFX and `null`; `createEngine` applies it at chapter start; the pause close applies it before the clock is released | `pause-atb-mode.test.ts` |
| I10 | FFX untouched | the FFX suite, `ffx-no-active-clock.test.ts` |

## 6. Settings (`src/app/SaveData.ts`)

`Settings.ffx2Atb: 'active' | 'wait'` **already exists** (the X-2 BATTLE row writes it; until
now nothing in the engine read it). The only change is its default, `'active'` to
`'wait'`, in `defaultSettings()`. **No migration, no schema version bump.** Consequence,
disclosed: `migrate` merges the stored settings over the defaults, and a save written since
the row existed stores the old default `'active'` explicitly, so **an existing save keeps
Active** until the player flips the row once; a fresh save, or a save from before the row,
gets Wait. Telling "stored because it was the default" from "chosen" is impossible from the
blob, and a one-time flip would be a migration, which the brief rules out. This goes to
Bailey as an open question (his own browser is such a save).

Applied at chapter start (`createEngine` calls `applyAtbMode` beside `applyAtbSpeed`) and
when the pause closes, before the presenter is released (`BattleScreen.ts` calls the
Wiring hook in `onPause(false)`, one line beside `applyAtbSpeed`).

## 7. What could regress in chapters 4, 5 and 6, and how it is checked

- **Every automated run** (auto-battle, e2e, critic captures) runs at zero decision time:
  no tick is attempted under a menu, so Wait and Active produce the same log. Pinned by
  the `D = 0` golden, unchanged.
- **Tests and benches that measure Active** drive the engine with
  `tick(D, { throughInput: true })` on a `new FFX2Engine(...)`: under the new default they
  would silently measure Wait. The shared test helper `ffx2ChapterDrive.ts` and every
  Active test set `atbMode: 'active'` explicitly. `critic/bench/leblanc/bench.test.ts` and
  `critic/bench/ffx2-active` are outside this track: flagged in the handoff.
- **Chapter 6 (Leblanc)** runs the same engine: `strategy-ffx2-leblanc.test.ts` measures
  under Active explicitly; a Wait arm at human speed is the D=0 result.
- **The pause-close order**: `applyAtbMode` runs before `setPresenterPaused(false)`, so
  the first pump step after the pause already sees the new mode.
- The browser pass: chapter 4 on a fresh save, a menu open for 6 s with ticks unchanged,
  confirm advances them, the OPTIONS row reads WAIT, flip to ACTIVE and the clock runs
  under the menu.
