# FFX-2 Wait mode, and Wait as the default

Track `ffx2-wait-mode`, 2026-09-22, a sub-agent of the orchestrator. **FFX-2 only**
(AGENTS.md rule 14): ATB Mode is an FFX-2 Config entry; FFX is CTB and has no clock under a
menu. Preflight: [docs/plans/ffx2-wait-mode-review.md](../plans/ffx2-wait-mode-review.md).

Bailey, verbatim, 2026-09-22 21:45 EDT, answering "chapter 5 at human speed: A ship
disclosed / B Slow default / C Wait mode / D other":

> "1. C Wait mode. Also I want the default to be wait mode instead of active mode please."

Recorded as **D-029** in `docs/target/decisions.json` (adopted); **D-009** (Active only, no
Wait toggle) is marked superseded by it, his words kept as he said them.

## 1. What changed

| Where | What |
|---|---|
| `src/battle/ffx2/active.ts` | `AtbMode = 'wait' \| 'active'`, `DEFAULT_ATB_MODE = 'wait'`, and the rule `clockHeldByMenu(mode, inputOwner)`. |
| `src/battle/ffx2/engine.ts`, `internal.ts`, `index.ts` | `Ffx2EngineOptions.atbMode` (default Wait), `setAtbMode` / `atbMode()` (survive `init`, like the ATB speed), and one guard at the top of `tick`: in Wait, while a `'player-input'` decision is out and unanswered, `tick` moves **nothing** (ATB, charge, recovery, every status timer, chain windows, enemy turns, carried ticks). |
| `src/engine/BattlePresenterActive.ts` | `activeClockEngine()` returns `null` for an engine in Wait, so no pump starts for that menu and the presenter takes the plain pre-Active path. A pump already running when the pause flips the row to WAIT stops at its next step without a tick (property 7). `BattlePresenter.ts` is untouched. |
| `src/app/SaveData.ts` | `Settings.ffx2Atb` default `'active'` to **`'wait'`**. The field already existed; **no migration, no version bump.** |
| `src/app/screens/BattleScreenWiring.ts` | `applyAtbMode` and `applyAtbConfig` (mode + speed). `createEngine` applies both at chapter start. |
| `src/app/screens/BattleScreen.ts` | One line: the pause-close hook calls `applyAtbConfig` instead of `applyAtbSpeed`, still before the presenter is released. Outside the brief's file list; it is the only caller of the hook. |
| `src/battle/common/types.ts` | Doc comment on `FFX2BattleEngine.tick` only (it said the fight runs in Active). `docs/CONTRACT-CHANGES.md` entry. |

The pause row itself (`X-2 BATTLE`, `ACTIVE`/`WAIT`) was already built and written by
`src/app/screens/pause/settings.ts` and `PauseScreenPanels.ts`; nothing in the engine read it
until now. Since the repair pass (§8) only an FFX-2 chapter prints it.

## 2. The reading built, and where the source differs

`research/ffx2-combat-core.md` §1.5 (`[single source]`): in Wait, time *runs* while the
top-level Main Command Window is open and freezes once a submenu (Item list, magic list,
Garment Grid) is entered. **Built: the clock holds for the whole time a command menu is open,
top level included**: the simplest reading the engine can keep on its own (it knows that a
menu is open, not which level the cursor is on), the engine's exact pre-Active behaviour, and
only ever more forgiving than the source. Preflight §2 has the reasoning. See §6 for the
question to Bailey.

## 3. Measured

- Chapter 4 and the chapter 5 chain, seeds 1-20, a human who reads every menu for 1.5 s,
  **Wait**: every event log byte-identical to the `D = 0` golden, **20/20 and 20/20 wins**,
  no menu invalidated, held or refused (`tests/unit/ffx2-atb-golden.test.ts`, the new Wait
  arm). Under Active at 1.5 s chapter 5 is 2/10 on seeds 1-10 (probe before the change) and
  5/40 in the release-09 measurement. So under the default, PR-0076's chapter 5 drop is gone
  by construction: in Wait no decision time reaches the clock.
- Active is unchanged: the Active `D = 1500` golden still matches, and a Wait-built engine
  switched to Active before its first decision reproduces it byte for byte.
- Chapter 6 (Leblanc) runs the same engine and the same rule: under Wait any decision time
  plays the `D = 0` fight (40/40 in `strategy-ffx2-leblanc.test.ts`'s table). Not
  separately golden-pinned.

## 4. Tests

New: `tests/unit/ffx2-wait-mode.test.ts` (10: default and round-trip; 6 s with a menu open
moves no tick, gauge or status duration, through `throughInput` and plain ticks; the ATB rows
hold with the owner full; the clock resumes on confirm; Active still runs; runtime switches
both ways; survives `init`; no pump for a Wait engine, none for FFX; a pump flipped to Wait
stops without a tick; an engine without `atbMode` reads as Active),
`tests/unit/pause-atb-mode.test.ts` (7: a fresh save reads WAIT; the row flips both ways and
persists across a reload; no migration; `applyAtbMode`, `applyAtbConfig`, `createEngine`;
FFX no-op). Changed: `ffx2-atb-golden.test.ts` (Wait arm + runtime switch arm),
`pause-play-time.test.ts` (the default is Wait), and the Active measurements now say Active
explicitly because the engine default moved: `helpers/ffx2ChapterDrive.ts` (defaults to
Active, `{ atbMode: 'wait' }` for the Wait arm), `ffx2-active-atb.test.ts`,
`ffx2-active-measure.test.ts`, `strategy-ffx2-leblanc.test.ts`. The first full-suite run
after the engine change **hung**: an idle Wait pump spun forever on the presenter tests'
instant sleep. That is why a Wait engine gets no pump at all (preflight §4 "As built").

## 5. Browser pass (real input, own Vite on 5617, `PYREFLY_BROWSER=gpu`, 1600x900, fresh save)

`.ffx2-wait-mode-browser-tmp.mjs` (agent scratch). Chapter 4, seed 7: engine `wait`, save
`wait`, Paine's menu open; **ticks 5628 → 5628 over 6 s of real clock, gauges unchanged**.
Enter, Enter: her turn starts, ticks 5628 → 13207. Pause, real keys to OPTIONS: `X-2 BATTLE`
reads **WAIT**; ArrowRight → **ACTIVE**; Escape: engine `active`, save `active`. The menu that
was open under the pause stayed still (13207 → 13207; **fixed in §8**, it now runs); answer it; on the next
menu the clock runs under it (18712 → 20757 over 1.5 s). Reload: the save still holds
`active`. Screenshots in `docs/screenshots/ffx2-wait-mode/`:
`ch4-wait-menu-open-3s.png`, `ch4-wait-menu-open-6s.png`, `ch4-wait-after-confirm.png`,
`ch4-pause-options-wait-default.png`, `ch4-pause-options-flipped-active.png`,
`ch4-active-clock-runs-under-menu.png`.

## 6. Open for Bailey

1. **Existing saves keep Active.** Only the default changed (no migration, as briefed). Every
   save written while Active was the default stores `ffx2Atb: 'active'`, and nothing tells a
   stored default from a choice, so **his own browser, and every returning player, stays on
   Active** until the X-2 BATTLE row is flipped once. A fresh save, or one from before the
   row existed, gets Wait. Options: leave it; or a one-time migration that sets every save to
   Wait once (a save-data change, deep review first).
2. **The faithful Wait split** (§2): clock running at the top-level command window, stopping
   in a submenu. Needs a small HUD port method in `src/ui/ffx2/**`; not built without his yes.
3. **The briefing's approved fourth line**, "In hers, *the clock does not wait*"
   (`src/ui/coach/coachCopy.ts`, Bailey-approved frame C1), is less true under a Wait
   default: the clock still runs between turns but stops at every menu. Not touched (approved
   copy, and it does not name Active as the only mode). The C1 tile's delivery note in
   `docs/target/targets.json` also still says the line waits on Active; not edited here.
   Options for him, none built: **A** keep the line (FFX-2's clock still runs between turns,
   which FFX's does not; only the menus wait); **B** show the fourth line only when his
   X-2 BATTLE row reads ACTIVE (under WAIT the briefing would end on line 3, whose closing
   dash then needs a new ending: copy); **C** new wording for the Wait default, drafted by an
   agent for his yes (for example "In hers, the clock runs between turns."). Rules 9 and 10:
   approved copy changes only on his word.
4. ~~A flip to ACTIVE lands from the next menu.~~ Fixed in the repair pass (§8): it lands on
   the menu open under the pause.
5. ~~The HUD indicator is not built.~~ Wrong: it was built (`FFX2BattleHud`, "ACTIVE — ATB
   RUNNING" / "WAIT — ATB HELD", over a live target cursor) with its state hardcoded to
   Active, so under the Wait default it lied. Fixed in §8.

## 7. Not done / noticed

- `critic/bench/leblanc/bench.test.ts` builds its own `FFX2Engine` options with no
  `atbMode`, so from now on its `D > 0` arms measure **Wait** (every arm plays the `D = 0`
  fight), not Active. One line (`atbMode: 'active'`) in its `engineOptions()` restores the
  Active measurement; not edited (outside this track's files). The `critic/scratch/**`
  probes have the same property.
- Save-data class: **release needs a deep review of the candidate before deploy**
  (`node tools/critic-plan.mjs --paths src/app/SaveData.ts` says DEEP).
- `engine.ts` grew 636 → 649 lines (over the house cap before this track; the policy is in
  `active.ts`).

## 8. Repair pass (after the adversarial verifier)

The verifier (`critic/scratch/ffx2-wait/`, report and ten shots) held the engine claims
true and refuted four brief checks; paper note first: `docs/plans/ffx2-wait-mode-review.md` §8.

| Failure | Root | Fix | Game case |
|---|---|---|---|
| MAJOR, introduced: in Wait the HUD chip read "ACTIVE — ATB RUNNING" over a held clock (ch. 4 seed 3, ch. 5 seed 7) | `FFX2BattleHud.atbMode` hardcoded `'active'`; nothing told the HUD; **and `withCoach` (every battle's HUD) forwarded none of the optional FFX-2 clock methods**, so the Active pump's `syncGauges` and `closeCommandMenu` never reached the real HUD either (pre-existing, live since release 08: under Active the bars moved only when an event played, and a torn-down menu's Esc claim was released only by its own promise) | optional `HudPort.setAtbMode`; the presenter tells the HUD the engine's mode when each FFX-2 menu opens and at every flip; `CoachedHud` forwards `syncGauges`, `closeCommandMenu`, `setAtbMode`; the HUD defaults to `DEFAULT_ATB_MODE` and repaints the chip when told | FFX-2 (forwarding: shared plumbing, no-op for FFX) |
| Flip to ACTIVE in the pause did not run the clock under the menu open under it | the Wait/Active fork was decided once per menu | `runMenuClock` (`BattlePresenterActive.ts`) parks a Wait menu on "answered, or the mode changed" (a promise, never a spin); `BattlePresenter.atbModeChanged()` wakes it, called by `BattleScreen`'s pause-close hook after `applyAtbConfig`; a pump flipped to Wait returns `'held'` and parks in the same loop | FFX-2 |
| Chapter 1 (FFX) pause printed X-2 BATTLE | `optionRows` lists it for every game | `optionsColumns` drops `ffx2Atb` unless the chapter is FFX-2 (like ATB SPEED) | both (rule 14) |
| Briefing line 4 "the clock does not wait" false under the Wait default | approved copy vs D-029 | **not changed: Bailey's decision**, options in §6.3; a note in `coachState.ts` | both (shared briefing) |
| Handoff said the indicator was not built | wrong | §6.5 corrected | docs |

Tests written first and seen failing: `tests/unit/ffx2-wait-mode-repair.test.ts` (7: real
presenter over real chapter 4 data; the HUD is told `wait` / `active`; Wait → ACTIVE under
the same open menu runs the clock, same owner, no re-ask, bars refreshed; ACTIVE → Wait holds
at once; an answered Wait menu plays its turn; abort releases a parked menu; the coach wrapper
forwards the three methods; `FFX2BattleHud` reads WAIT by default and repaints on a flip),
`pause-atb-mode.test.ts` (+2: no X-2 BATTLE row in FFX; FFX-2 keeps it with ATB SPEED under
it). Changed: `ffx2-wait-mode.test.ts` (the flipped pump now stops `'held'`),
`pause-remake.test.ts` case 7 (it asserted the FFX chapter printed `ffx2Atb`; now the FFX-2
chapter does and the FFX one does not).

**Browser, real keys** (own Vite on 5481, hmr off, `PYREFLY_BROWSER=gpu`, 1600x900, fresh
contexts, stopped by its PID; `.ffx2-wait-repair-browser-tmp.mjs`, report
`docs/screenshots/ffx2-wait-mode/repair-report.json`, 0 failures):
- Ch. 4 seed 3, fresh save, Paine, Attack, target cursor: chip visible, **"WAIT — ATB HELD"**,
  engine `wait`, ticks 10020 → 10020 over 3 s, 0 events (`repair-ch4-wait-target-chip.png`).
- Next menu (Rikku) open, pause, X-2 BATTLE WAIT → ACTIVE, Escape: **the same menu's clock
  runs**, ticks 23715 → 27432 over 2.5 s, 9 events, bars moved on screen, owner `rikku` in
  all 10 samples, menu still up.
- Under Active, target cursor: chip **"ACTIVE — ATB RUNNING"** (`repair-ch4-active-target-chip.png`).
- Flip back to WAIT under an open menu: ticks 34260 → 34260 over 2.5 s, 0 events.
- Ch. 1 (FFX) pause OPTIONS: master, music, SFX, text speed, guide, battle help; **no X-2
  BATTLE, no ATB SPEED** (`repair-ch1-ffx-pause-options.png`).

`npx tsc --noEmit` clean; full `npm test` 246 files, 5603 passed, 2 skipped. No new module
(orphans unchanged). `BattlePresenter.ts` grew 619 → 644 lines (over the house cap before this
track; the policy lives in `BattlePresenterActive.ts`, 261). Release: the presenter and coach
changes make the candidate DEEP by `critic-plan` (shared systems); `SaveData.ts` from the
build pass already requires a deep review **before** deploy.
