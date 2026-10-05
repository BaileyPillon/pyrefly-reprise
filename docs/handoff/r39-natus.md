# r39-natus: Natus's colossus framing returns from a per-chapter table, the same every run (PR-0331 for Natus, option N, round 21 card F)

Branch `r39-natus` (worktree `D:/pyrefly-r39-natus`), from `origin/main` 105105c3 (origin/main is now 6763fc24; nothing under `src/engine/fx/mix`, `src/ui/ffx/ffx-hud.css` or the two
stage-table tests changed in between, so the branch applies cleanly). **Not merged, not deployed, not reviewed.** Decisions: D-353 (option N waits "until it is deterministic"), D-316 and D-319
(the colossus master, Natus named), the round 21 judgment page card F, which Bailey accepted on 2026-10-04 ~18:35 EDT ("All your recommendations I'll listen later I'm at work right now"):
recommendation 2, "Natus only. Build option N as a per-chapter table so it works every time ... Braska's Final Aeon, Evrae and Yunalesca are unchanged."

**Game case: FFX only** (rule 14). Natus is Chapter X. The Sensor card is FFX's own HUD card (`.ffx-sensor`, `FFXBattleHud.ts`); FFX-2 shows an enemy on its boss strip and has no such card.
Where FFX seats the figures and which way the camera looks is `[absence]` in `research/battle-camera-perspectives.md` ("FFX: which side of the screen does the party stand on? Not stated anywhere
found"), so moving a camera and a card changes the picture and never a rule; FFX-2 is the game with free battle positions (`research/ffx-vs-ffx2-presentation.md`, the "arena turns" row), and it is
not touched. The phone is not touched either. Shared plumbing (`Framing`, `MaxMix`, `hudPanels`, the report) behaves as before for every fight that has no pin: compared below, FFX-2 Bahamut,
Yojimbo, Yunalesca, Braska's Final Aeon, Evrae and the phone come out the same.

## In one screen

First menu of Chapter X, real keys, headless GPU Chromium, branch 8 seeds per size, today (origin/main 105105c3 in a scratch worktree) 3 seeds. Natus's height is his painted height
(sprite pixels with alpha 0.35 or more), the product's own measure (round 19's record reads "Natus 212->506 px"). Min / median / max.

| | 1600x900 | 2000x1012 | 2560x1440 |
|---|---|---|---|
| **Natus's height, today** (colossus held off, `scale -1`) | 206 / 207 / 207 px | 239 / 240 / 241 | 329 / 331 / 331 |
| **Natus's height, branch** | **346 / 346 / 347 px** (1.67x) | **389 / 390 / 390** (1.62x) | **554 / 554 / 555** (1.67x) |
| Sensor card and advisor card over Natus's painted pixels | 0 % / 0 % | 0 % / 0 % | 0 % / 0 % |
| painted overlap between figures, branch | 0 px2 (8 of 8) | 0 (8 of 8) | 0 (8 of 8) |
| closest painted approach, any member to any fiend: today | 17.0 / 17.6 / 18.4 px | 19.6 / 19.8 / 24.3 | 24.0 / 25.5 / 26.5 |
| the same, branch | 37.3 / 39.1 / 43.6 | 43.0 / 44.3 / 48.1 | 60.6 / 63.1 / 67.4 |
| closest member to Natus himself (first menu, 3 seeds): today / branch | 30 / 156 px | 51 / 167 | 44 / 245 |
| party's largest share under a HUD panel: today / branch | 0 / 1.1 to 4.0 % | 2.6 to 2.7 / 0 to 0.7 | 0 / 1.7 to 3.0 |
| plans / live-check re-plans: today / branch | 1 / 1 and 1 / 0 | 1 / 1 and 1 / 0 | 1 / 1 and 1 / 0 |
| plan time on the main thread (the prototype of option N took about 2 s): today / branch | 146 to 153 / 12 to 31 ms | 105 to 130 / 12 to 34 | 129 to 135 / 12 to 59 |
| console errors | 0 | 0 | 0 |

- **Done:** 24 of 24 first menus play the table's master (`framing.pin` set, `scale 0.45`, one plan, no re-plan); 54 later-menu states (nine runs of six: three seeds at three sizes, each the first menu, the cursor
  on Mortibody and on Natus, the enemy-move read-out, menus 2 and 3) keep it with Natus at 346 to 347 / 389 to 390 / 554 to 556 px and no card over him; two whole fights (1600x900 seed 1 to the results
  screen, 2000x1012 seed 2 to the post-fight cutscene) plan once, never re-plan and end with 0 console errors. Natus never touches a party member in any of the 54 states (closest 117 / 131 / 186 px at the
  later menus). The critic's acceptance check for PR-0331 ("Natus at least 300 px tall at 1600x900 with Sensor card cover under 5 percent") reads 346 px and 0 % by the product's measure.
- **The size, read two ways:** the judgment page said "about 270 px"; that was the critic's by-eye reading of the Visual Options frames (runs 2 and 3, **BOSS SCALE step 0.45, the same step this table
  pins**). The same critic read today's Natus as 160 to 190 px (PR-0331) where the measure says 207 to 212, and round 19's full colossus as 470 where the measure says 506, so by-eye runs 0.77 to 0.93 of the
  measure: 346 px is about 270 to 320 by eye. One step larger (0.55) or smaller (0.25: 269 to 289 px, the plan's own box height in the sweep) is a table edit and a fresh proof; none is built (see "For Bailey").
- **Not the whole story:** windows of shape 1.7 to 2.45 only (16:10 and 4:3 play as today); TEXT SIZE other than 100 plays as today; Kimahri comes within 5 px of Mortibody (never Natus) at menu 2 or 3 in 4 of 9 runs and grazes him by 2 px2 in 1
  (today Yuna touches him at menu 3 in 6 of 9 runs, 54 to 485 px2); Tidus is up to 4.0 % under the command list at the first menu; a window resized mid-fight plans again and the new plan lands at the next action. Costs and limits below.
- **Telegraph key (D-340): not wired**: there is no Natus telegraph painting in `public/art` (the art install of release 38 left it out on purpose). The wiring is one row; steps below.

## What is in the branch

| File | What |
|---|---|
| `src/engine/fx/mix/colossusPin.ts` (new, 215 lines) | The pin: `ColossusPin` (one master and one card place), `PinClass` (the window shapes it was proved at), `pinFor`, `pinnedPose`/`pinnedLens` (the one candidate, no search), `cardBox`/`stageOf` (the HUD stage's letterbox maths), `pinSafe` (hand checks), `fitPinned` (the `Fit` the plan keeps and stops at), `paintedCover` and `pinnedExcess` (the card's cover counted on painted pixels), the `?natus=` override (checks only), `textSizeKey`, `SizeWatch` and `windowKey` (a resized window asks for a new plan). |
| `src/engine/fx/mix/stageTable.ts` | `CHAPTER_X` row: `colossus: [NATUS_PIN]`, no slot move (`party`/`enemy` 0), added to `ALL_ROWS`; `standFor`/`readStand` carry `colossus`. |
| `src/engine/fx/mix/framing.ts` (397 lines) | `decide` plays the pinned candidate when the row pins one for this window shape (single try, `fitPinned`, `pinnedExcess` as the card gate), else exactly today's search; `commit` keeps `pinned`; `liveCheck` never re-plans a pinned master; a TEXT SIZE change plans again; `cardPlace`; `probe` (checks only); `windowWatch`: a window that has stood at a new size for 0.4 s plans again; the report carries `pin`, `bossPx`, `planMs`. |
| `src/engine/fx/mix/separate.ts` (new) | `Framing.separate` moved out (the 400-line rule) with an optional `pinned` mode: the table's `apart` and `bossApart`, written once, one `plan()`. Without a pin it is the old method (an oracle test holds the old code beside it). |
| `src/engine/fx/mix/sensorPin.ts` (new) | `SensorPin`: writes `--ffx-sensor-px` and `--ffx-sensor-py` (the card's place minus its home, grid px) on `.ffx-sensor` while a pin stands; removes them the moment it ends. |
| `src/ui/ffx/ffx-hud.css` | `.ffx-sensor` `left`/`top` add the two variables beside the aim steer (`--ffx-sensor-dx`), the rail clear (`--ffx-sensor-cdx`) and the Omnis lift (`--ffx-sensor-dy`), which still apply on top. |
| `src/engine/fx/mix/hudPanels.ts` | `predictedPanels(..., onStage)`: the predicted panels as the HUD's letterboxed stage draws them (identical at 16:9). |
| `src/engine/fx/mix/MaxMix.ts`, `framingReport.ts` | `SensorPin` per frame, `natusProbe` debug hook (`__pyrefly.fx.mix.natusProbe("<nine numbers>")`), the report's three new fields. |
| `tests/unit/fx-mix-colossus-pin.test.ts` (27), `fx-mix-sensor-pin.test.ts` (5), `fx-mix-size-watch.test.ts` (8), `fx-mix-stage-table.test.ts` and `fx-mix-stage-hold.test.ts` (updated for Natus's row) | 80 tests in the five files. |
| `docs/screenshots/r39-natus/` | 24 frames: before, after and side by side for the first menu at three sizes, and the states at 1600x900 seed 1 (cursor on Mortibody, cursor on Natus, read-out on, menus 2 and 3). Today's build is the "before". |
| `docs/handoff/r39-natus-evidence/` | The raw tables behind the numbers: `first-menu.txt`, `later-menus.txt`, `fights.txt`, `unchanged.txt`, `resize.txt`. |

No shared contract (`docs/CONTRACTS.md`) is touched, so there is no `CONTRACT-CHANGES.md` entry. `node tools/orphans.mjs`: the three new modules are reachable (the 24 orphans are the ones main already has).

## The table, and why these numbers

```ts
const NATUS_PIN: PinClass = { aspect: [1.7, 2.45], pin: { frac: 0.45, blend: 0.65, back: 1.02, lens: [0.03, 0], apart: 0.75, bossApart: 0.4, card: [410, 4] } };
const CHAPTER_X: Row = { chapter: 'seymour-natus', boss: /^seymour-natus/, party: { right: 0, toward: 0 }, enemy: { right: 0, toward: 0 }, colossus: [NATUS_PIN] };
```

`frac` is BOSS SCALE's step (0.45, the one in the approved frames); `blend` and `back` are `clearance.ts`'s BLENDS and BACKS values (how far toward today's rig, how far it stands back); `lens` is the static
lens shift as a share of the canvas (0.03 is 48 px at 1600 wide); `apart` is the step the fiends take away from the party in world units (the party takes 0.3 of it the other way), `bossApart` Natus's own further
step (Mortibody stands in front of him, and 0.4 takes it off his ring: 1.7 % of Mortibody's pixels over Natus's ring became 0); `card` is the Sensor card's CSS `left` and `top` on the 640x360 HUD stage
(home is 436, 166), so it stands above Natus's head and is the same at every size of one shape. `aspect` is the window shapes the answer was proved at (width over height, inclusive): 1.78, 1.97 and 2.37 are inside it.

How it was found (checks only, nothing played): the probe hook asked the product's own planner for the plan each answer would make: 4,800 candidates at 1600x900, then six sizes (1440x900, 1600x900, 1920x1080,
2000x1012, 2560x1080, 2560x1440) of 1,764 each; one answer is clean at the five 16:9-to-21:9 sizes (2560x1080 is the narrow one, 40 of 1,764 candidates pass; the lens is decided by 2000x1012, where 0.035 fails and 0.03 passes).
Real-run grids over the lens and `apart` at the three sizes chose `apart` 0.75: 0.6 left Kimahri touching Mortibody at the later menus. The sweep and the proof harness are scratch (below).

## Why it is the same every run

1. **No search.** The old plan tried five BOSS SCALE steps by blends by backs by lens and picked at the edge of strict limits (a member 8 % under a panel against a 6 % limit, a plate-edge tolerance, discrete
   steps), so the same fight came out as today's rig or as 0.25, 0.45, 0.7 or 1 from run to run (`r38-restage.md`, "Natus (Chapter X), option N": five outcomes in ten runs at 2560x1440). The pin is ONE
   candidate: `pinnedPose` builds it from the master, `fitPinned` measures it, and it is kept or refused, never ranked against others.
2. **Hand checks, not the search's limits** (`pinSafe`): every figure at least 90 % in view, no party member more than 25 % under a panel, the party within 5 % of today's height floor, nobody inside a
   boss at rest (the rest gap), no member covered by a boss beyond the rule plus 5 %; and the card's gate counts painted pixels (`pinnedExcess`: under 5 % of a boss part's silhouette, under 2 % of a
   member's box), because a colossus's wings and ring fill their boxes with air. A pin that fails any of them is not played: the plan falls back to today's rig, which is always a candidate.
3. **No re-plan.** `liveCheck` leaves a pinned master alone (it reports, it never swaps); today's three re-plans a fight (`plans 3 / replans 2 or 3` at menu 3 in all 9 runs of today's build) are gone
   (`replans 0` in all 54 states). An arrival in the opening seconds still plans again (the roster rule, shared with today): the answer is the same each time (two runs show 3 plans, 0 re-plans). A window resized mid-fight plans again once it has stood at its new size for 0.4 s (`SizeWatch`), so the pin is judged for the window the player has, not the one the fight began in.
4. **The card's place is data.** Written as CSS variables, not searched at run time: the aim steer and the rail clear still apply on top, so the card still steps off a fiend the cursor is on.

## Proof (headless GPU Chromium, real keys, seeds in the file names; raw lines in `r39-natus-evidence/`)

**First menu** (table above): 24 of 24 pinned; Natus 346 to 347 / 389 to 390 / 554 to 555 px; cards over Natus 0 %; painted overlap 0; plans 1, re-plans 0; 0 console errors.

**Later menus, three seeds at three sizes** (today in brackets; both builds, same seeds):

| | 1600x900 | 2000x1012 | 2560x1440 |
|---|---|---|---|
| menu 2: party's largest share under a panel | 1.1 to 1.8 % (5.4 to 6.3) | 2.1 to 3.1 (7.4 to 8.9) | 1.1 to 1.3 (6.7 to 7.4) |
| menu 3: runs with any painted overlap | 1 of 3 (2 px2, Kimahri x Mortibody) (3 of 3; 54 to 190 px2, Yuna x Mortibody) | 0 of 3 (0 of 3, closest 8 to 10 px) | 0 of 3 (3 of 3; 151 to 485 px2) |
| menu 2 / menu 3: closest member to Mortibody (min of three) | 4.8 / 0 px (19.0 / 0) | 3.8 / 2.0 (25.0 / 8.0) | 11.5 / 1.0 (32.1 / 0) |
| closest member to Natus at any state | 117 px (29) | 131 (51) | 186 (44) |
| cards over Natus (Sensor, advisor, guide, read-out), all states | 0 | 0 | 0 |
| plans / re-plans at menu 3 | 1 or 3 / 0 (3 / 2 or 3) | 1 / 0 (3 / 3) | 1 or 3 / 0 (3 / 2 or 3) |

At 1600x900 seed 1 the card stands above Natus's head with the cursor on Natus, on Mortibody and with the read-out on; the read-out slab docks to the left of Natus and the advisor card keeps its band;
none covers him (frames `natus-1600x900-aim-*`, `intent-on`, `menu2`, `menu3`).

**Whole fights** (`fights.txt`): 1600x900 seed 1, 24 samples over 67 s to the results screen: Natus 346 to 422 px (his own poses move the painted box; the camera does not), one plan, no re-plan, `bossPx` 341
throughout, 0 % card cover, 0 console errors. 2000x1012 seed 2, 31 samples over 82 s to the post-fight cutscene: Natus 389 to 474 px, one plan, no re-plan, `bossPx` 383, 0 % cover, 0 errors.

**Other sizes the row covers** (first menu, two seeds): 1280x720 Natus 277 px (closest approach 32.5 to 33.5 px, party up to 4.0 % under a panel); 1366x768 295 to 296 px (34.5 to 34.7, 1.1 to 3.0 %);
1920x1080 416 px (46.7 to 47.8, 2.3 %); 2560x1080 416 to 417 px (43.7 to 47.3, Kimahri 0.9 to 1.2 %).

**Windows the row does not cover** (today's framing plays, the card stays home; the numbers equal today's build at the same window): 1440x900 (shape 1.6) Natus 206 px against 207; 1024x768 (shape 1.33) 169
against 170, with the card over Natus by 5.7 % and the party up to 12 % under a panel (today 11 %): today's own state, not touched. **The phone** (390x844, touch): the same decision as today in both
builds (`scale -1`, master (0, 5.1, 17.6)).

**Unchanged fights** (`unchanged.txt`, first menu, 1600x900): Yojimbo's cavern (3 seeds a side) `scale 0.25`, master (-0.02, 5.23, 18.3) in all six, lens (0, 0) or (0, -36) in both builds; FFX-2 Bahamut `scale 1`,
lens (-64, -36), master within 0.02 of today's in all six; Yunalesca and Evrae `scale -1`, same lens and master in all six; Braska's Final Aeon, nine runs a side: lens (64, -36) in 8 and (128, -36) in 1, in
**both** builds (the old search's own spread; an early comparison of three runs a side had shown the odd (128, -36) on the branch only). No Chapter-X-only code runs in any of them (`pin` false everywhere but Natus). The final code (with the resize watch) re-ran the first menus (9 of 9: 346 / 389 / 554 px, pinned), one run of the later states, the two uncovered windows, Yojimbo (2), FFX-2 Bahamut (2) and the phone: the same numbers.

**A window resized mid-fight** (`resize2.mjs`, `resize.txt`; seed 1: the window is resized with a command menu open, one real Attack is played, the next menu is read): 1600x900 pinned (Natus 347 px) -> 1440x900 today's framing (pin off, Natus 205 px, card home) -> 1600x900 pinned again (344 px, party 0.2 % under a panel) -> 1024x768 today's framing (176 px) -> 2000x1012 pinned (387 px); 0 console errors. A plan decided under an open menu waits for the first action (D-291: no cut while the player is choosing), so after a resize the old master stays up for the rest of that menu (at 1440x900 a member 18 % under a panel and the card 0.7 % over Natus, at 1024x768 a member 62 % under a panel) and the new one lands at the next action. Without the watch nothing asks for a plan on a resize (the live check does not re-plan a pinned master: read in the code, not measured separately), so the pin would have stayed for good; that is why `SizeWatch` exists.

## Where it stops, and what it costs

- **Window shapes.** Proved for 1.70 to 2.45 (16:9, 1.97, 21:9 and the 1280x720 to 2560x1440 sizes above). 16:10 (1440x900, 1280x800, 1680x1050, 1920x1200), 4:3 and wider than 2.45 play as today: at 16:10 the
  predicted panels put Tidus a third under the command list with this answer, so the pin is refused and the plan falls back. A second class row needs its own sweep (`natusProbe`); not built.
- **TEXT SIZE 115 or 130** (`data-text-size`): the card grows about its bottom-right corner, so its place is proved at 100 only; there the pin is off and a change of size plans again. The phone keeps its own fit.
- **Tidus** reads up to 4.0 % of his painted pixels under the command list at the first menu (1600x900 and 2560x1440; the old strict limit was 6 %, the hand check 25 %). The party stands about 0.2 world
  units further left than today (`apart` 0.75 moves the fiends right by 0.75 and the party left by 0.225).
- **Mortibody at the later menus.** Kimahri comes within 5 px of Mortibody at menu 2 or 3 in 4 of 9 runs (closest 1.0 px) and grazes him by 2 px2 in 1 (1600x900 seed 3, menu 3); today Yuna touches him at menu 3 in 6 of 9 runs (54 to 485 px2). More `apart`
  would push the party under the command list; not done.
- **A member down** lies flat and can sit partly under the command list: in the resize run (a test fight that only attacked, so two members fell) Tidus read 16 % under the list at menu 5 of 2000x1012; the hand check allows 25 %. Not measured over seeds.
- **The Sensor card** stands at the top (410, 4 on the stage) while the pin does, not in its usual place; the advisor card and the read-out slab dock around it by themselves (`solveAdvisorPlacement`).
- **Natus's painted height moves in a fight** with his own poses (346 to 474 px); the framing does not.
- 2560x1080 is the narrow one (40 of 1,764 candidates pass); it passes at the final answer in both seeds run.

## Natus's telegraph key (D-340): not wired

D-340 held Natus's telegraph "until PR-0331 settles his colossus master"; this branch settles the master, but the painting is not installed (`public/art/characters/seymour-natus/` has idle, hurt, cast and ko only;
`docs/handoff/art-install-2026-10-04.md` lists "a Natus telegraph (D-340)" as not installed), and the candidate (`tele-natus` cand-8) carries a disclosed weakness that needs Bailey's yes. When it is installed
(`characters/seymour-natus/telegraph.png` and sidecar, the approved-hashes entry) the wiring is one row of `HOLDS` in `src/engine/TelegraphHold.ts`: `['seymour-natus', new Set([<the headline move's ability id>])]`
(FFX only, like Flux and Braska's Final Aeon). Which move holds is for the driver and Bailey; the ids come from Natus's data.

## For Bailey (the driver relays)

1. **The size.** 346 px by the measure is the framing the Visual Options picture showed (step 0.45), read "about 270" by eye. If he wants it smaller or larger, that is one number (`frac`) and a re-proof; ask before building one.
2. **16:10 laptops** keep today's Natus framing until a second row is proved.
3. **Natus's telegraph** waits for the painting and his yes on its weakness.

## Records owed (the driver's; I did not touch NOW.md, the ledgers or the changelog)

`docs/target/decisions.json`: the D-353 / card F item, delivery "built on `r39-natus`, not merged", reaction named by Bailey: Natus only, a per-chapter table, deterministic; inferred (mine): the size, step 0.45.
PR-0331 (Natus only; Braska's Final Aeon, Evrae stay "today's framing", Yunalesca out): the acceptance check reads 346 px and 0 % by the measure. CHANGELOG and ACTIONS entries at the release that carries it. Critic plan for
the paths: DEEP (`node tools/critic-plan.mjs --paths ...`: 38 substantial checkpoints since the last deep review, FFX HUD and effects systems); the focused review before a deploy should include the three sizes' first menu,
the later menus, one whole fight, the unchanged fights and the phone.

## Paper preflight (rule 15, folded in; the brief's prototype handoff and the judgment card were the plan)

What can go wrong, and the check that covers it: a refused pin plays today's framing silently (the report's `pin` is null; it is set in all 24 first menus and all 54 later-menu states); the table goes stale if another lane moves Natus's slots or the HUD's
panels (`natusProbe` re-derives the answer in seconds; the unit tests pin the row and the card box against measured DOM boxes); the card's box constants follow its CSS (the same tests); a window resized mid-fight (`SizeWatch` plans again; `resize2.mjs`); layering (nothing in `src/battle/**`
or `BattlePresenter*` is touched; the new modules are in `src/engine/fx/mix`, presentation only, no engine state, no RNG, no timer); another chapter's plan (the `separate` oracle test, the five compared fights).

## Gates

- `npx tsc --noEmit`: exit 0 on the final code.
- Unit tests of this branch: `fx-mix-colossus-pin` 27, `fx-mix-sensor-pin` 5, `fx-mix-size-watch` 8, `fx-mix-stage-table` 28, `fx-mix-stage-hold` 12 = 80 of 80; the 46 files that import the mix or the framing: 759 of 759.
- Full suite (`node node_modules/vitest/vitest.mjs run --maxWorkers=3`, 807 files): 808 files (this branch adds one): 802 passed, 5 skipped, 1 failed; 11,855 tests passed, 46 skipped, 1 todo, 1 failed. The failure is `strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare", which hit the 15 s default timeout (18.3 s) on this loaded machine; the same test times out the same way on today's build (origin/main 105105c3 in a scratch worktree, 18.3 s), and the file passes 19 of 19 with `--testTimeout=120000` (wins 1 of 30, the bar is 1). It is an FFX-2 engine bench and nothing in this branch touches `src/battle/`. A first full run before the resize watch gave the same single failure (801 of 802 files).
- `node tools/orphans.mjs`: 24 orphans on the branch and 24 on today's build (1,223 modules against 1,220); the three new modules are reachable.
- Source files under 400 lines: `framing.ts` 397, `colossusPin.ts` 215, `MaxMix.ts` 330, `stageTable.ts` 196, `hudPanels.ts` 172, `separate.ts` 63, `sensorPin.ts` 48; the largest new test is 390.
- Real-input checks: headless GPU Chromium by real keys (the numbers above), on the final code for the first menus, the later states, the uncovered windows, the unchanged fights and the resize.
- Not run: the Playwright e2e specs (they need a production build and the shared preview; only `grand-summon-picker.spec.ts` names Natus, for the summon picker's third row). Not deployed; not pushed to main.

## Re-run it

- `?natus=off` on any page URL plays today's Natus framing (the card at home): the before frame. `?natus=<frac>,<blend>,<back>,<lens x>,<lens y>,<apart>,<boss apart>,<card left>,<card top>` plays that answer in Chapter X at any size (a sweep).
- `window.__pyrefly.fx.mix.snapshot().framing`: `pin` (the row played, else null), `bossPx`, `planMs`, `plans`, `replans`, `scale`, `fit`. `window.__pyrefly.fx.mix.natusProbe("<nine numbers>")` plans an answer without playing it.
- The proof harness is scratch, not committed: `D:/Tools/pyrefly-scratch/2026-10-04/r39-natus/cap` (`natus.mjs` first menus, `states.mjs` later menus, `fight.mjs` whole fights, `sweep.mjs` the probe sweep, `cmp.mjs` other chapters,
  `resize2.mjs` a window resized mid-fight, `agg.mjs`, `ranges.mjs`, `pairs.mjs` the tables, `mkframes.mjs` the frames) with `gaplib.mjs` and `inpage.mjs`; run lines in `PROGRESS.md` beside it. It walks to the first menu with `critic/runner/lib/route-*.mjs`.

## For the next agent

The servers I started (7210, 7211) are stopped. A second window shape, another chapter's pin (Braska's Final Aeon and Evrae are "unchanged" by Bailey's choice, not by a limit of the device) and Natus's telegraph are the
three natural next steps; each is a table row (and, for the telegraph, a painting).
