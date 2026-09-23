# Paper preflight: FFX-2 Wait, the faithful split (top level runs, submenus hold)

Track `ffx2-wait-split`, the D-029 follow-up 2 that Bailey deferred to release 10
("1, 2, 3 I'll take your recommendations on all please", 2026-09-23 00:00 EDT).
Deep-class paper preflight (rule 15). `critic-plan --paths` over section 11's files: **DEEP**,
focused review before deploy, deep on the live build; no save-data change. 2026-09-23, paper only.

## Recommendation

**Build it in full, but ship it switched OFF until Bailey says yes once more, with the numbers
below in front of him.** The old preflight recommended deferring the split partly on the claim
that "the difference is small in play" (`ffx2-wait-mode-review.md` §2, point 3). **Measured
today, that claim is wrong.** Under the split, every millisecond a player spends on the
top-level command list is Active clock. Chapter 5 falls from 40/40 (Wait today) to **32/40 at
0.5 s** on the top-level list and **11/40 at 1 s**; chapter 6 falls to **16/40 at 1 s** (section 4).
D-029 was chosen *because* Active cost chapter 5 at human speed (5/40). So the split gives back
part of what Bailey chose Wait to fix. That is a new fact, and he should decide on it once:
**A** faithful split as the Wait behaviour, or **B** keep today's whole-menu hold. Nothing gets
tuned either way (see the memory note "boss-side fix needs measured options").
The build is small and lands dark: one engine option (`waitSplit`, default `false` until he
answers), a menu-level signal, the approved coach line moved to the moment it is true. **A**:
flip the default and re-run section 9. **B**: the code stays dark, or is removed.

## 1. Sources (quoted)

- `research/ffx2-combat-core.md` §1.5, line 212, **Wait** `[single source]`: "Time runs while
  the top-level Main Command Window is open, but **freezes the moment any submenu is entered**
  (Item list, White Magic list, Garment Grid screen, etc.)."
- Same file, line 51 (phase table): "in **Wait** mode time freezes as soon as a submenu is
  entered". Line 2173 (Garment Grid): "In Wait mode, entering this screen freezes time."
- Line 211, **Active** `[single source: Split Infinity G0913]`: "Time never stops, including
  while browsing the item list or a magic submenu."
- `research/ffx-vs-ffx2-presentation.md` line 212: "Active mode: time runs. Wait mode: time
  freezes on entering a submenu." Line 219: "in Wait mode time pauses while a sub-menu is open".
- **Silent in every source:** target selection. Reading: it is *inside* a command, below the
  top list, so it holds (the source's "any submenu" depth rule). INFERRED; goes in the ask. The
  indicator reads only "Active mode" / "Wait mode" (line 3176): the setting, not the clock.

## 2. Game case (rule 14): FFX-2 only

ATB Mode is an FFX-2 Config entry (`ffx-vs-ffx2-presentation.md` line 278). FFX is CTB and has
no clock to split. `clockEngine()` returns `null` for FFX; `tests/unit/ffx-no-active-clock.test.ts`
remains the absence test. The HudPort hook and the CoachLayer forwarding are shared plumbing
("both", CHK-020) but do nothing for FFX: the FFX HUD never emits a menu level.

## 3. Exact semantics, every state (Wait + `waitSplit`; Active is unchanged)

| State | Clock | Notes |
|---|---|---|
| Top-level command list (`CommandMenu` view `'top'`) | **runs** (Active path: `tick(dt,{throughInput})`) | Enemies act, statuses tick, chain windows close; the machinery from 15385ab and PR-0076/0080 becomes reachable under Wait |
| Submenu (`'sub'`: Skill lists, Item, **Change** = our Garment Grid) | **held** | source lines 212, 2173 |
| Target selection (`'target'`, from top or sub) | **held** | INFERRED (sources silent) |
| Item | sub then target: held | Item is a group row, so it is always `'sub'` |
| Spherechange | held from the moment the Change submenu opens | Change is always a submenu (`CommandMenu.ts` "the one exception") |
| Cancel / back | target to sub: stays held. Sub or target to top: **resumes**, measured from the moment of the keypress | nothing held is banked |
| Top-level leaf with no targets (Defend etc.) | runs until confirm | no deep level is ever entered |
| Chain seam (§1.7) | a chain window runs at top level and holds deeper. An owner chained at top level keeps her menu; a confirm while chained is **held** and fires as her once the window closes (`HeldCommand`, PR-0080) | Unreachable under today's Wait; ordinary under the split |
| Owner KO / Stop / Sleep / Petrify / Berserk at top level | menu abandoned (`'invalidated'`), same as Active | `inputStillValid` |
| Targets gone (a kill at top level, then Attack) | refuse and reopen, turn not spent (`allTargetsGone`) | same as Active |
| Chapter-link seam (`carriedParty`) | menu level resets with `inputOwner` at `init` | |
| Pause (Esc at top level) | held; the pump parks on `pauseGate` | **known leak, section 8** |
| Mode flip in the pause | Active to Wait while in a submenu: holds at once. Wait to Active: runs at once (`atbModeChanged` wake) | unchanged |
| Automatic Wait (animations) | held in both modes (the pump does not run inside `play`) | unchanged |

## 4. What it costs: measured, and why the measurement is exact

**Equivalence (the core invariant).** A deep level ticks nothing (`clockHeldByMenu` returns
`flush()`), so for a decision with top-level dwell `T` and total time `D >= T`, the split's
event log is **byte-identical to Active at `D = T`**. The Wait split therefore needs no new
simulator: the Active bench at `T` *is* the split at any `D`. Probe (the Wait bench copied into
`scratchpad/paper-wait-split/split-bench.test.ts`, Active arms, 40 seeds, `intendedStrategy`):

| T on the top list | ch4 Bahamut | ch5 Vegnagun | ch6 Leblanc | ch5 menus invalidated / held |
|---|---|---|---|---|
| 0 (= Wait today, any D) | 40/40, 100.5 s | 40/40, 379.1 s | 40/40, 92.7 s | 0 / 0 |
| 250 ms | 40/40 | **37/40** | 40/40 | 70 / 357 |
| 500 ms | 40/40 | **32/40** | 39/40 | 80 / 531 |
| 1000 ms | 40/40 | **11/40** | **16/40** | 134 / 1101 |
| 1500 ms | 40/40 | 5/40 | 9/40 | 155 / 1323 |
| 4000 ms | 40/40 | 0/40 | 4/40 | 187 / 1605 |

(Ch. 6's D = 0 median is 92.7 s now, 76.6 s in the committed `results-wait-vs-active.json`:
Leblanc data moved, re-baseline.) Where a real player spends `T` is unknown: one who reads the
fight *on* the top list gets Active's difficulty; one who presses a row at once and thinks inside
it gets today's Wait. Section 9 reports both ends.

## 5. Engine (`src/battle/ffx2/active.ts`, `engine.ts`, `internal.ts`)

- `type MenuLevel = 'top' | 'deep'` in `active.ts` (local, **not** `common/types.ts`, so no
  contract change). `Ffx2EngineOptions.waitSplit?: boolean`, default `false` (the dark launch).
- `FFX2Engine.setMenuLevel(level)` / `menuLevel()`. The level is **reset to `'deep'`** (held)
  whenever a new `inputOwner` is handed out, and cleared with the owner (submit, battle-over,
  `init`). **Why held is the default:** a HUD that never reports a level (the FFX HUD, a test
  double, a wrapper that forgets to forward: the CoachedHud bug hit twice, repair §8.1 and
  PR-0090) degrades to today's whole-menu hold, which is forgiving and proven. It must never
  degrade to Active.
- `clockHeldByMenu(mode, owner, level, split)`: `mode === 'wait' && owner !== null &&
  (!split || level !== 'top')`. At `split` false it is exactly today's predicate.
- `engine.ts` gets only the option, two methods, the resets and the guard's arguments. Fix the
  `clockHeldByMenu` comment: "nothing can reach the owner" is false under the split.

## 6. Presenter (`BattlePresenterActive.ts`, `BattlePresenter.ts`, `HudPort.ts`)

- `ActiveClockEngine` gains optional `clockHeld?(): boolean` (the engine's own predicate, one
  truth). `runMenuClock` / `runActivePump` switch on `clockHeld()` instead of `modeOf() ===
  'wait'`; an engine without it keeps the `modeOf` behaviour byte for byte.
- `HudPort.onMenuLevel?(listener: (level: MenuLevel) => void): () => void` (optional, FFX-2 HUD
  only). The presenter subscribes when an FFX-2 menu opens and unsubscribes on settle. The listener
  (a) stamps `levelAt = now()`, (b) calls `engine.setMenuLevel`, (c) wakes a parked menu (reuse
  the `wakeMenuClock` path).
- **Exact edge timing.** Going deep mid-step, the pump ticks `min(levelAt, at) - last`, then
  parks; back to top it restarts with `last = levelAt`. No submenu time ticked, none banked.
- `ran` turns true on the first top-level tick, so the pre-submit `inputValid` gate applies.

## 7. HUD, the coach and the approved line

- `CommandMenu.ts`: `deps.onLevel?.(view === 'top' ? 'top' : 'deep')` in `renderTop`,
  `renderSub` and `renderTargets`. `FFX2BattleHud` implements `onMenuLevel` and uses the level for
  its chip. **CoachedHud must forward `onMenuLevel`** (and tap it, below).
- **Chip:** under the split, "WAIT — ATB HELD" on the top list would be false. It becomes
  "WAIT — ATB RUNNING" at top and "WAIT — ATB HELD" deeper. Both are existing words, but the
  pairing is new: INFERRED on the tile, and part of the one ask.
- **Bailey's approved line (12:40 EDT, verbatim): "Bar's full, she's up! Take your time, nobody
  moves while you're picking."** It is the `ffx2-gauge` mark under Wait, first time only, raised
  today when the menu opens. That moment is the top list, where the split runs the clock, so the
  line would be **false as shown**. Keeping it true without changing a word:
  1. Under Wait + split, CoachLayer raises `ffx2-gauge` at the **first `'deep'` event** of an
     FFX-2 menu, after any in-flight `play()` settles (so no enemy is visibly moving under it),
     and not at open.
  2. It **fades early on a `'top'` event** or when the menu settles. It is visible only while
     nothing moves.
  3. `markSeen` only once raised: a first turn spent on the top list (Defend) leaves it for later.
  4. The badge "Menu's up · gauges holding" rides with the mark, so it is true too. Active, or
     the split off: unchanged.
- **Also half-true under the split:** the drafted briefing line 4 "In hers, the clock holds while
  you choose" (INFERRED). Needs his wording if A; same ask; not reworded in the build. The
  approved line is not yet in `coachCopy.ts` (being wired elsewhere); build on top of that.

## 8. Pause, and a leak this track makes reachable under Wait

Probed through the real `runActivePump` with a fake clock: a 10 s pause between two steps hands
`tick` **250 ms** (`dts [50, 250]`, the `MAX_STEP_MS` clamp): Active has leaked up to 250 ms per
pause since 15385ab, and the split lets it reach a Wait player pausing from the top list. Fix
here: a pause epoch bumped by the pause-close hook (beside `atbModeChanged`); a step spanning an
epoch change resets `last` and ticks 0. FFX-2 both modes; FFX has no pump.

## 9. Re-measure plan (chapters 5 and 6; 4 as control) at D = 0 / 1500 / 4000 ms

Extend `critic/bench/ffx2-wait/bench.test.ts` (outside `tests/unit`, run with
`PYREFLY_MEASURE=1`) with a `split` mode and a top-dwell `T` per arm. The driver does
`setMenuLevel('top'); tick(T,{throughInput}); setMenuLevel('deep'); tick(D-T,{throughInput})`.
Arms, 40 seeds each, chapters 4, 5, 6:
`D ∈ {0, 1500, 4000}` × `T ∈ {0, 250, 500, 1000, D}` (with `T <= D`). `T = 0` must equal today's
Wait rows and `T = D` must equal the Active rows, **byte for byte** (log hash). The headline row
for Bailey is `T = 500` (a quick reader) and `T = D` (thinks on the top list). Write the result
beside the old one (`results-wait-split.json`); do not overwrite `results-wait-vs-active.json`.

## 10. Risks

1. **Difficulty** (section 4): the reason for the Bailey gate. Never tune a boss to compensate.
2. **A forgotten forward makes the split silently inert.** Harmless by design (held default),
   but the feature would look built and do nothing. Test it through `withCoach`, not the bare HUD.
3. **Stale targets:** a kill on the top list before Attack is refuse-and-reopen (Active's path).
4. **Coach race:** a mark over an enemy animation reads false; 7.1 (after `play`) covers it.
5. **Goldens:** `D = 0`, every Wait arm and every Active golden stay byte-identical (the level
   is `'top'` only when a HUD or driver says so). 6. **House cap:** `engine.ts` 649 and
   `BattlePresenter.ts` 648 are over already; policy goes in `active.ts` / `BattlePresenterActive.ts`.

## 11. Build steps, owning files, tests, acceptance (for the building agent)

**Game case: FFX-2 only** (plumbing "both", inert for FFX). Owning files:
`src/battle/ffx2/active.ts`, `engine.ts`, `internal.ts`; `src/engine/BattlePresenterActive.ts`,
`BattlePresenter.ts`, `HudPort.ts`; `src/ui/ffx2/CommandMenu.ts`, `FFX2BattleHud.ts`;
`src/ui/coach/CoachLayer.ts`; `tests/unit/helpers/ffx2ChapterDrive.ts`; `critic/bench/ffx2-wait/`.
Check `git status` first: `BattlePresenter.ts` and `BattlePresenterPorts.ts` carry another
agent's uncommitted edits. Read their handoff and continue from it; do not start them over.

1. Tests first, seen red: `tests/unit/ffx2-wait-split.test.ts`. (a) With the split, a top-level
   `tick(2000,{throughInput})` advances ticks and a `'deep'` tick does not. (b) The level resets to
   `'deep'` on each new owner. (c) With `waitSplit: false` a top-level report changes nothing.
   (d) The equivalence: ch5 seeds 1-5, split `(D=1500, T=500)` log hash equals Active `D=500`, and
   `T=0` equals the Wait golden.
2. `ffx2-wait-split-presenter.test.ts` (fake engine + fake clock, through `withCoach`): the deep
   edge ticks exactly `levelAt - last`; back to top restarts from `levelAt`; a pause epoch hands
   0 ms (fails today with 250); a flip to Active while deep runs at once.
3. `ui-ffx2-menu-level.test.ts` (jsdom): `CommandMenu` emits top → deep (Skill) → top (Esc) → deep
   (Attack → target) → top (Esc: `pendingFrom`). The chip text changes at each emit.
4. `ui-coach-wait-split.test.ts`: under Wait + split, `ffx2-gauge` is not raised at open, is
   raised on the first deep event with Bailey's exact words, fades on top, and is seen only once
   raised. Under Active and with the split off: unchanged.
5. Build sections 5 to 8. `npx tsc --noEmit`; the touched test files; `node tools/orphans.mjs`;
   full `npm test`; the bench (section 9) run once with `PYREFLY_MEASURE=1`.
6. Browser, real input (ch. 4 fresh save, then ch. 5): top list ticks rise over 2 s; Skill
   submenu 3 s with ticks unchanged; Esc back and the ticks rise; Attack → target cursor held;
   chip text at each; the coach line appears on the first submenu entry, not at open.
   Screenshots in `docs/screenshots/ffx2-wait-split/`.
7. Acceptance: all of the above are green, the equivalence hashes match, and the bench table is
   in the handoff (`docs/handoff/ffx2-wait-mode.md` §10). The default stays `waitSplit: false`
   until Bailey answers A or B, and D-029 `followUp` item 2 records his words.

## Review (adversarial, 2026-09-23, paper only)

Verdict: **sound. Keep the dark launch and put the A/B ask to Bailey.** Re-ran the author's Active-at-T bench from a copy (`paper-review/wait/`).
- CONFIRMED, exact: ch5 40 / 32 / 11 / 5 / 0 and ch6 40 / 39 / 16 / 9 / 4 at T = 0 / 500 / 1000 / 1500 / 4000 ms. Ch4 is 40 in every arm. The invalidated / held counts match (80/531, 134/1101).
- CAVEAT: round 09's independent Active bench on the real chain path gives different numbers: ch5 **2/40** and ch6 **14/40** at 1.5 s, with 250-460 refused submits. Show Bailey the direction and name the harness. Do not quote one number as the truth.
- CONFIRMED (sources): ffx2-combat-core lines 51, 211, 212 and 2173, and presentation lines 212, 219 and 278 say what is quoted. Target selection is correctly marked INFERRED.
- CORRECTED: the "indicator" quote is **ffx2-combat-core.md** line 3176, not the presentation file (which has 465 lines).
- CORRECTED: Bailey's line **is** already in `src/ui/coach/coachCopy.ts:200` (`FFX2_GAUGE_BODY_WAIT`, committed; D-030). Build on it.
- CONFIRMED: `MAX_STEP_MS = 250` (`BattlePresenterActive.ts:80`), so the 250 ms pause leak is plausible. Settle it with the section 11 step 2 test.
- CONFIRMED: D-029 follow-up 2 is "deferred, build the split next release". The new A/B question is a new fact, correctly routed to Bailey (rule 10). The chip pairing is correctly INFERRED.
- Builder: `CommandMenu.ts` (616) and `FFX2BattleHud.ts` (1225) are also over the cap, and `BattlePresenter.ts` is now 651. Put new logic in new or small files. Do not tune any boss.
