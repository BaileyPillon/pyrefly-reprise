# Chapter IV first-menu framing race: the opening owns CHAPTER FRAMING's first plan

**Branch `ch4-camera`** (from `origin/r52-rc` 3c92b60cc), pushed; not merged, not deployed. **Game case: both** (shared opening plumbing: the presenter's opening, the battle-start card, the mix's CHAPTER FRAMING; AGENTS.md rule 14), **reproduced in FFX-2 Chapter IV** (Bahamut, a giant: the largest staging write there is). FFX CTB and FFX-2 Active and Wait timing are untouched (the engine does not tick before its first decision).

Credit: Codex's read-only trace `D:/Tools/echoes-coordination/codex-ch4-camera-trace.md` (cause chain with file and line; every claim re-checked against the code and the numbers below) and the survey `quality-leap-2/survey.md` finding 2.

## The defect

On a fresh profile the first command menu opened under a plan that had not landed. CHAPTER FRAMING's first plan (`fx/mix/framing.ts`) is decided on a calm frame and put on screen only when no menu is open, so it waited behind the open menu and was written onto figures already on screen at the first confirm: Bahamut 420 to 629 px (+50 percent, his card 100 px up), Yuna's card 31 px sideways. Not a camera cut (the camera had no cut at all): a staging write (`staging.ts` `write`, `framing.ts` `commit`).

## The cause, confirmed in the running game (instrumented, 19 + 6 runs; every line cites the base tree 3c92b60cc)

1. **The plan needs 0.6 s of frame time, the card and the opening run on the wall clock.** `framing.ts:145` decides when the roster is painted and calm and `time - sigAt >= 0.6`, where `time` is the sum of frame deltas (`App.tick` caps one frame). On a fresh profile the page is starved of frames for seconds (shader and texture work): in the unfitted instrumented run **12 frames** were drawn by the time the card left (stalls of 1.4 s and 2.1 s; the plan's `age` was 0.32 of 0.6); the fitted runs drew 38 to 55 frames, or had a slow card. The card holds on a `setTimeout` (`BattleStartBanner.ts:210`: 1.9 s, 0.7 s hurried), and in the fitted runs the plan landed only 0.2 to 0.4 s before the card left.
2. **A hurried opening starts the fight at once and Bahamut's first action makes the figures not calm.** The key route (a held Enter through the pre-scene) is a hurried opening (`openingHurry`): the sweep collapses, `battleStart` returns, and Bahamut's own opening attack starts the same moment (`cast`, life `act`; `stillActor` is false for a figure acting, `geometry.ts:126`) and holds eight seconds. With the plan not decided, it cannot be: **no calm frame**.
3. **Nothing waited for the plan before the first input.** `BattlePresenter.run` awaits `openOn` (`BattlePresenter.ts:367`) and then asks the engine for a decision; `chooseCommand` (`:580-603`) sets the pose, `settleForMenu` (`BattlePresenterBeats.ts:377`) returns at once on `idle` and opens the HUD. Paine's menu opened 2.3 s after the card and Yuna's followed it (open from 10.6 s to the end of the 18 s record), so the plan, when it decided at last (13.9 s in the traced run), was `pending` behind an open menu.
4. **The entrance's 3 s ceiling freed the boss under the menu.** `StageEntrances.PLAN_MAX_MS` (3000 ms of the stage clock since the figure was built, `StageEntrances.ts:65,276`) lets the boss in whatever is owed: Bahamut became visible, unfitted (410 px), 0.3 s after the first menu opened.
5. **The commit is an immediate write.** `framing.ts` `commit` (`:334`) releases and re-applies the staging (`staging.ts:188`) in one frame; `rigWatch.install` (`:124`) leaves a resting camera on the old rig until the next presenter move.

Before the fix, the same Chapter IV walk on the production build (fresh profile each run, the survey's method): **7 of 19 runs showed Bahamut unfitted (408 to 412 px, never 570 to 580) at the first menu** (the survey saw 9 of 19; one run of the 19 had to be repeated, it never left the title). In every one the plan was still undecided or pending; the instrumented run's pending plan was still behind an open menu 18 s in.

## The fix

The OPENING owns the plan (`fx/mix/openingGate.ts`; the wait is in the mix's frame clock, not the wall clock):

- **The battle-start card is the cover.** `BattleStartBanner` has an `until` option; `BattleScreen` passes `() => stage.planSettled()` for every card (the hurried one included). The card is held past its hold until the plan has landed (a press still dismisses it). The plan then commits through the normal update loop under the card, before the opening's sweep, with no menu open.
- **`BattlePresenterBeats.settleOpening`**, called by `BattlePresenter.openOn` after `playOpening`, waits again before the first decision is asked for (a hurried or skipped opening has no card left, and a Confirm press ends the card early), so Bahamut's first action cannot start before the plan is decided and the first menu cannot open under it. If the plan landed after the opening's last camera move, the camera (resting on the old idle rig; `RigWatch` adds no move) moves onto the master with the opening's own motion (a cut under REDUCE MOTION) before anything is offered. Nothing waits at `'skip'` speed.
- **Explicit verdicts** (`arrivalOf`): `owed`, `landed`, `retired`, `off` (the part is off or there is no rig), `unsupported` (no canvas or resting rig). Everything but `owed` is final.
- **A bounded fallback** (`PLAN_WAIT_S` 3, frame seconds, one frame at most 0.25): the gate calls `Framing.retire()`, which abandons a plan not yet on screen (decided or pending). The base presentation stands for the fight, consistent, and nothing lands later as a jump (the forced 9 s case below). A giant arriving or leaving (the next link) plans again, as it always did; a resized window, a switched part and TEXT SIZE re-plan as they did.
- **`StageEntrances.PLAN_MAX_MS` 3000 to 9000.** It is the net, not the verdict: the opening gives the verdict; the ceiling must outlast the opening's wait or it frees the boss before the plan can land.
- Kept as it was: the guard against geometry changes while a menu is open (`pending && !menu`), the approved giant framing targets (`giants.ts` rows and views), the live check and its three re-plans, FFX CTB and FFX-2 Active and Wait timing (the Wait top list keeps its running gauges). `framing.ts` is 393 lines (was 410, over the 400 rule): the lens shift's travel moved to `lensTravel.ts` unchanged.

What the player sees: nothing changes when the plan is early (the usual case on a warm profile). When the plan is late (a fresh profile) the card stays up until it lands (the longest seen: see the table) instead of leaving and handing a boss that re-sizes at the first confirm. **This is the one visible change; Bailey has not been shown it** (rule 9: it adds time to a card, never a new picture).

## The proof

Harness: scratch `D:/Tools/pyrefly-scratch/2026-10-17/ch4-camera/h/` (`run2.mjs` one run, `recorder2.mjs` the in-page record, `analyse2.mjs`, `timeline.mjs`, `jumps.mjs` the write at a commit, `summary.mjs` the tables, `batch.sh` and `matrix2.sh` the runs; `build.ps1` builds the production candidate in PowerShell because Git Bash rewrites `BASE_PATH=/`); the builds are `M:/pyrefly-ch4-builds/before` (r52-rc untouched), `after1` and `after2` (this branch, served on 5821 to 5823, stopped); headless GPU, one fresh browser per run, real key presses from the title (the survey's walk). A rAF recorder reads, every frame, the stage's figures (group scale, world x and z, alpha, placeholder, crossfade, tweens, pose, the content quad projected to canvas px), the camera, the card, the menu (the same test as `hudPanels.menuOpen`), the entrance gate, the engine's ticks and `__pyrefly.fx.mix.trace()` (the plan's flags). A staging write is a change of a figure's group scale or x with no tween on it, found from the world values (the camera is not in them); the defect is a plan that commits after the first menu opened, or a write of 24 px or a scale step on a figure on screen after it.

**Before and after, 19 fresh runs each, Chapter IV by the survey's walk (real keys from the title, a held Enter through the pre-scene: a hurried opening):**

| | runs | Bahamut unfitted (408 to 412 px, never 570 to 580) when the first menu opened | the plan on screen when the first menu opened |
|---|---|---|---|
| before (r52-rc, production build as it is) | 19 | **7** | 12 |
| after (this branch, production build, hardened) | 19 | **0** | 19 (committed about 0.3 s before the card left, under it, the boss still held) |

(The survey saw 9 of 19 in its sample; a first sample of this branch's build, before the wall-clock backstop was added, also read 19 of 19 fitted.) Engine ticks at the first menu: 52 before and 52 after (the gauges and the CTB order are not touched; 55 to 61 in the few runs where the frame the menu was seen on was a few ticks later).

**The staging write itself, with the player choosing on after the first confirm** (`--drive`: Attack on whatever menu is open for 16 s; the same build with the opening's wait switched off for the "before" rows, `__pyrefly.fx.mix.openingWait(false)`):

| | runs | the plan committed after the first menu | what changed on screen in that frame |
|---|---|---|---|
| before | 5 + 5 | 4 of 5 and 3 of 5 | Bahamut group scale 1 to 1.472, his box 416 to 623 px (+50 percent, centre +60 px); Yuna's box centre 60 px sideways and +24 px tall, Rikku 14 px, Paine 5 px; Bahamut at alpha 1 |
| after | 5 + 5 | **0 of 10** | the same write lands at 3.9 to 6.3 s, under the card, with Bahamut held (alpha 0.004) and nothing else on screen |

**The forced cases (Chapter IV, hurried, `--drive`; "before" = the wait switched off):**

| case | before | after |
|---|---|---|
| Bahamut's painting a placeholder for 4.5 s (a delayed roster beyond the normal handoff) | 3 of 3 plan after the first menu (408 to 411 px at the menu, 530 to 591 after) | 3 of 3 fitted, plan before the first menu (card held to the plan) |
| every party figure mid pose crossfade for 4 s (a crossfade beyond the handoff) | 2 of 2 plan after the first menu | 2 of 2 fitted before the first menu |
| placeholder for 9 s (**the fallback**: it outlasts the 3 s wait) | 3 of 3 plan after the first menu (548 to 581 px) | 3 of 3 **retired**: card held for the wait, boss 408 to 420 px (the base presentation), no plan ever, no staging write in 14 s of play after it |
| the card pressed (the own card, 350 ms in), placeholder 4.5 s, ordinary opening | no defect (the opening is long) | no defect; the plan lands 1.1 s after the card left, party visible (21 to 34 px step), boss held, before the first menu |

**Other openings and comfort, all on Chapter IV unless named (after only unless a before row is shown):** ordinary opening 3 of 3 fitted, plan 1.4 s before the card left; the card pressed 3 of 3; pressed twice (card and opening) 3 of 3; first menu left up 8 s 2 of 2; target cancel and re-entry 3 of 3; warm profile (the chapter played once first) 3 of 3; REDUCE MOTION 3 of 3 fitted, plan before the menu; **phone width 390x844 (touch): before 2 of 3 plan after the first menu with a write, after 0 of 3**.
**Another FFX-2 giant, Chapter XIII (Paragon):** before, **3 of 3 first menus were off their settled framing** (boss 1067 to 1122 px in the first menu against 581 to 606 settled: the plan landed after the opening's last camera move and left the camera on the old rig; the camera only arrived at the first action); after, 3 of 3 at 599 to 604 px (settled 584 to 616). **An FFX fight (Seymour Flux and Seymour Natus, CTB):** fitted before and after (503 and 392 px), the plan before the first menu in every run; the plan used to land 0.9 s after the card left in Flux (on screen, in the opening) and lands under the card now.

## Verification

- `npx tsc --noEmit` clean; unit tests in `tests/unit/engine/opening-plan-gate.test.ts` (15), `opening-plan-wiring.test.ts` (6), `presenter-opening-plan.test.ts` (5), `opening-card-until.test.ts` (5); `entrance-plan-owed.test.ts` follows the constant (one test stepped 4000 ms past a ceiling that is now 9000) and `entrance-plan-wiring.test.ts` accepts the extra imports. The full suite (1376 files, 21,897 tests) ran green but for 15 files that hit the 15 s test timeout under the load of three browser streams and other agents on the machine (the advisor floor and menu simulations, the art-sidecar and art-derive readers, the camera-program scan and the hard-link test among them); **all 15 re-run with a 170 s timeout: 15 of 15 files, 281 of 281 tests pass**. The two engine goldens (`ffx-engine-golden`, `ffx2-atb-golden`) pass.
- `node tools/orphans.mjs`: 1819 modules, 26 orphaned, the same 26 as the base tree (1817 modules); `openingGate.ts` and `lensTravel.ts` are reachable.

## Open

- The longest card hold the fix adds is `PLAN_WAIT_S` (3 s of frames) past the card's hold, then the plan is retired (a degraded but consistent frame). A pressed card hands the wait to the opening, which shows the party standing and the boss held until the plan lands (Yuna's box centre steps 21 to 34 px, before the first menu, not at it).
- The party is not held with the boss: in a pressed-card opening the party is on screen when the plan lands. Holding it too would need a mockup and Bailey's yes (rule 9).
- Nothing in the repo runs the harness; the section above is its readme. NOW.md, the CHANGELOG entry and the ledger rows (ACTIONS, DECISIONS) are the release driver's, not written here.
- Pre-existing and not touched: `liveCheck` re-plans (up to three, D-291) when a party member is found under a panel at a menu's opening, and commits at a later menu-free frame. It fired in every Flux run and every phone run above (a second plan 2 to 12 s after the first menu); in its commit frame no figure's scale or x moved in any of them. Chapter IV's giant (`this.giant`) and the table's Natus (pinned) never re-plan. If it ever writes staging at a confirm it is the same defect by another door and wants the same treatment.
