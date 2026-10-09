# r3942-giants-ffx: real sizes for the FFX giants, wave 2 (branch `r3942-giants-ffx`, from `origin/r3942-stage` 0284bf85)

**Game case: FFX only** (Chapters I, III, X and XVII; FFX-2 has none of these fiends, and nothing here touches an FFX-2 file). Bailey, 2026-10-08 (~13:55 EDT), after the giants options study: **"I'll go with all of your recommendations"**, which took the study's pick for each chapter (below). Bailey, 2026-10-08 (~14:30 EDT, a standing preference, relayed by the coordinator mid-lane): **"The way the battles are framed now being right next to each other is kinda dumb ... it looked way better before."** He chose **original spacing, real sizes**, everywhere: real sizes and Flux's camera nudge stand, no boss or part may stand nearer the party than it does on live today, the Yu Pagodas behind the aeon are further back and so fine, and a pick that only works by bringing a figure nearer stops and is reported. One pick does (Natus on a desktop): it is built, switched off, and reported in "What needs the framing engine". **(Superseded by the repair of 2026-10-08, below: the one line was applied, the switch is on, and Natus plays at his real size with no figure nearer than live.)**

**Head:** after the repair of 2026-10-08 the code head is `0976af98` and the branch tip is the commit that adds the repair's section and sheet (`git log -1 r3942-giants-ffx`), pushed as `origin/r3942-giants-ffx`; the lane's own, before the repair, were `006a2a40` (code) and `b8f01e2e` (tip). **Merge check (the lane's, at its own code head; the repair's is in its section below):** `git merge-tree --write-tree` of the branch against `origin/r3942-stage` (`b8aa906f`, the FFX-2 giants lane's commits on top of 0284bf85): clean, tree `942fb8dfc097bb4b4c52c6c4d9cd91b300b0eed9` (computed at the code head; the note, the patch and the sheet are new files). **Not touched:** `src/battle/**`, `src/data/**/enemies/**`, any golden test, `src/engine/fx/mix/**` and `src/data/ffx2/**` (the FFX-2 giants lane owns them; the repair, on the brief of 2026-10-08, changes `masters.ts` and `framing.ts`: section 2 of the repair, below), `docs/handoff/NOW.md`, `DECISIONS.md`, `ACTIONS.md` (the driver records the rows).

## Repair of 2026-10-08 (after the independent check of b8f01e2e; FFX only, Chapters I, III, X and XVII)

An independent verifier (evidence: `D:/Tools/pyrefly-scratch/2026-10-08/verify-x/`) found one regression the branch introduced, one pick it had not delivered, one number it had quoted for the wrong thing, and four nits. This section says what each came to. The sections below it are the lane's own, kept as written; where the repair overturned a statement, the statement is marked **(superseded by the repair)** and says so. **Game case: FFX only** throughout (Chapters I, III, X and XVII; the advisor tip and the framing engine's one line are FFX paths: FFX-2's HUD never withholds its card and plays its giants under `giants.ts`; no FFX-2 file is touched and `git merge-tree` against `origin/r3942-stage` is clean). One shared file is touched: `src/ui/common/MoveAdvisor.ts` (FFX and FFX-2 both import it), so `node tools/critic-plan.mjs` classes the change **DEEP, games both** (obligations live + focused + deep); its new branch is taken only for `data-zone="tip"`, which only the FFX HUD writes, so FFX-2's card is unchanged by construction, and the FFX-2 suites pass. **Nothing is deployed and no review has been run** (`deploy + review owed`).

**How it was measured.** Headless Playwright from node on the real GPU, seed 1, the first command menu of Chapters I, III, X and XVII (link 3), at 1600x900, 1440x900, 1024x768 and 390x844, against the live build (`https://echoesofspira.com`, `a021787a`, bundle `index-cUSnFK7q.js`, unchanged from the first capture to the last) and this branch on a dev server, **with the Sensor card up, as a player has it** (the lane's captures hid it, which is why its tables could not see what follows). Scripts, outside the repo: `D:/Tools/pyrefly-scratch/2026-10-08/giants-ffx-fix/` (`cap-final.mjs` the capture, `report.mjs` the tables below, `make-sheet-fix.mjs` the sheet, `probe-solves.mjs` the advisor's solver input at every fresh solve, `solve-solves.mjs` and `free-boxes.mjs` the real solver run offline on it). The sheet: `docs/screenshots/r3942-giants-ffx/repair-before-after.jpg`. The dev server (port 5301) is stopped. Two environment notes: the worktree has no `public/fx` (the gitignored depth plates), so the final captures and the final browser runs were taken with a temporary junction to the main tree's `public/fx` (removed afterwards; without it Chapters I and III draw no depth parallax, which moves no figure and no number below); and the repo's `playwright.config.ts` previews a production build, which this repair did not make, so the e2e file was run from a copy of that config without its web server, aimed at the dev server (`D:/Tools/pyrefly-scratch/2026-10-08/giants-ffx-fix/playwright.dev-5301.config.ts`, which belongs in `tools/` to resolve its paths).

### 1. MAJOR, introduced by the branch: the NEXT BEST MOVE card and its N chip were gone in Chapters I and III

**What was wrong.** At the first menu of both chapters, at every desktop shape (the verifier's 16 of 16 captures; mine, 14 of 14 at seven shapes before the fix), `advisorZone` found no box and `FFXBattleHud.placeAdvisor` took the card down, and the chip with it (`advisorChipFollow`): no advice at all on a default setting. The code's own comment called the case unreachable ("never withheld"). The cause is arithmetic, measured on the page's own solver input (`probe-adv.mjs`, the real solver run offline on it by `free-boxes.mjs`): the strategy guide holds the top left, and the sky between its rail and the fight, where the card stood on live (164 x 70 grid px at 1600x900), is the fight's now (Flux 6.0 and Mortiorchis 3.3 units; the aeon 6.9 and two pagodas at 5.7 and 6.3). The largest clear boxes left on Chapter I at 1600x900 are 344 x 32 and 190 x 40 along the top, 62 x 109 between the guide and Mortiorchis and 84 x 45 under the turn list; the designed card needs 147 x 83 (its 132 and the shear, plus 11 for its chip), the short card 145 x 71, the compact 95 x 83, the Sin strip 140 x 45. Nothing the lane's checks measured could say so: its harness hid the Sensor card and measured the fiends, the party and the intent card, not the advisor, and the unit suite asserts arithmetic on boards somebody wrote down.

**Staging the figures could not fix it, so the solver's rules did.** Moving Mortiorchis right until a card fits (the real solver, the page's boards): a compact 80-wide card needs +34 grid px at 1600x900 (about one world unit: close to live's own x, 1.03), +66 at 1440x900, +50 at 1024x768; the designed card needs +86, +118 and +102 (2.6 world units at 1600x900: Mortiorchis at x 2.5, nearly on Flux, whose x is 3.54). Chapter III's left pagoda would need +66 to +106 grid px (2.5 to 4 world units) for a compact card and the whole group +118 to +158 for the designed one. Those are not stagings Bailey picked, and a figure 2.6 units sideways is a different composition.

**What was built: the tip.** One row of the card, on whatever clear ground is left: `NEXT  Tidus  Hastega -> the party  IN WHITE MAGIC  30 MP`, with the `N` chip as a key-only badge on its left. It is the bare rung of the card's density ladder laid out as a row (`src/ui/common/move-advisor-tip.css`), 13.2 grid px tall at 1600x900, 13.7 at 1024x768, 16.0 with TEXT SIZE 130 on that window (measured; the solver allows 18). It prints the lead move only: the runner-up, the effect, the reason, the warning and the board's note are the full card's. The move is rigid and the target gives way with an ellipsis; what does not fit comes off whole, never cut through a word or a glyph: the chips first (last first), then the actor's name, then the arrow and the target together (`MoveAdvisor.fitTipRow`; found on the 4:3 picture of Chapter III, where the bar read "Tidus Stamina Tonic -" with its arrow clipped to a dash). `src/ui/ffx/advisorTip.ts` solves the box with the designed card's own clearances and keeps off the guide's G and scroll chips and the PAUSE chip too (`AdvisorZoneInput.keepOff`, which no other pass reads); `advisorStrip.advisorZone(input, strip, tip)` runs it after the designed passes and the Sin strip decline, so no chapter whose card is placed today can move. The HUD asks for it in every fight **except while the enemy-move read-out (E) is open**: a read-out that takes the band takes the card with it, as the tests that pin it say. When the player folds the guide with G, or in a frame with room, the full card returns as ever (the card's ladder starts over when it leaves the tip: tested). N puts the bar away (the chip then reads "N best move" where the badge was) and brings it back.

**Where the tip stands, and why it does not move.** The first answer (the clear box nearest the command stack) put the bar on the top of the stage, in the left column or on the deck depending on the submenu and on where the party had stepped, so it jumped from keypress to keypress. It now stands on **the top row of the stage whenever that row is wide enough for the whole bar** (160 grid px): the highest such box, the leftmost of those; failing one, the widest (Chapter III at 1024x768, whose top is 144 wide beside the left pagoda, stands on the deck under the party). The command stack is solved as if it were always at its fullest (`COMMAND_STACK_AT_REST`), so the ground a submenu frees is not the bar's. And **it reads the fighters where the camera's shot comes to rest** (`FFXBattleHud.enemySpriteRectsAtRest`, `AdvisorZoneInput.enemiesAtRest`, read by the tip alone): for the first seconds of a decision the camera is still gliding to the menu shot, a fighter's live painted box is 25 to 30 grid px higher than it settles (Mortiorchis's top at y 24 against 52), and the top row is 21 tall, so a solve in that moment found the row blocked and the held placement put the bar in the bottom right **for the whole decision at some turns**. Found by watching the second and third decisions of Chapter I (the solver's input recorded at every fresh solve: `probe-solves.mjs`); fixed by solving against the live silhouette carried by its head's way to where it rests, which is the live box exactly once the camera has settled. The designed card's input, the key and the snapping are untouched.

**The numbers** (table A below): the tip is on screen in Chapters I and III at every desktop shape (1600x900 to 1024x768; the pictures are on the sheet), where live has the full card; the same pass gives a card to Chapter XVII link 3 at 1440x900 and 1024x768, where **live has none** (measured: 31 of 33 first menus of the 11 FFX chapters at three shapes show a card on live; the two without are these). Tests: `tests/unit/ui-ffx-advisor-tip.test.ts` (30 tests: eight measured boards with the page's own held zones pinned, the second decision of Chapter I as the camera comes to rest, the top row and the stability cases, the read-out case, a board the designed passes serve unchanged, a wall, the chips, the HUD placing the tip and reading the resting fighters, N, and the card printing the bare rung at the next decision, leaving the tip, dropping what does not fit); one fixture of `ui-ffx-hud-safe-zones.test.ts` (the 54-px clear band that "docks the chip" held a tip) was lowered to a 14-px band; and **`tests/e2e/advisor-present.spec.ts`** (39 browser tests: every FFX chapter at 1600x900, 1440x900 and 1024x768, the card and its chip up at the first menu, clear of every panel and fighter, N away and back; the two tip chapters again at the next decision, one row and **where it was**). Run against a dev server: **39 passed in 18.1 minutes on the committed code (`0976af98`)**, the next-decision tests included; the run before the fitting ladder's last pass and the lazy resting list passed 39 of 39 too (19.5 minutes).

**What it costs, said plainly.** In Chapters I and III the player has a one-row bar, not the card, and the bar's look is the repair's own (inferred, not picked: it is on the sheet for Bailey's reaction). The full card is one keypress away (G folds the guide and it returns, as before). **An alternative, not built** because it changes a panel Bailey did not mention: fold the guide to its tab (the machinery exists: `StrategyGuide`'s squeezed state, PR-0389, which does it in FFX-2 at large text) and give the card the guide's rail, about 64 tall and 130 to 200 wide at every shape (measured offline on the page's boards); it would put the guide off by default at the first menu of two chapters and change `tests/e2e/guide-sheet.spec.ts`'s FFX case. Bailey's call; the picture would be a one-step mockup first (AGENTS.md rule 9).

### 2. The pick not delivered: Natus at his real size

`HIGHBRIDGE_REAL_SIZE` is **true** and BOSS SCALE's 2.2 entry for `seymour-natus` and `braskas-final-aeon` in `src/engine/fx/mix/masters.ts` is **retired** (the one line of `docs/handoff/r3942-giants-ffx-masters.patch`, applied; the file is kept as the record). For Braska's chapter it changes nothing (BOSS SCALE was not played there: his colossus master fails every step of the plan at his size; the aeon and both pagodas read the same, 540, 362 and 382 px on a desktop); it also closes the standing risk that the entry grew him past Bailey's 75 percent in some plan. The eight tests that failed (exactly the lane's count: six BOSS SCALE cases in `fx-mix-boss-scale`, `fx-mix-fail-closed` and `fx-mix-party-stature`, and the lane's two) now say what is measured: Natus and the aeon have no target (null), Evrae (2.4, measured k 2.44 at the cases' stage, 2.21 at the lock case's) is the sized colossus the cases use, the switch is on (4.455 and 1.912 from `giantFigureHeights`), and the old `it.todo` is a test that `scaleTarget` names neither. **The framing engine needed one more line, which the lane could not see with the switch off** (`src/engine/fx/mix/framing.ts`): at 1440x900 and 1024x768 the pinned colossus master is not proved (`NATUS_PIN`'s aspects are [1.7, 2.45]), so the plan plays today's rig and then tries the party stepped toward the fiends, 0.35 and 0.7 world units, and takes the first that passes or else the least bad. On live the 0.35 step plays; with Natus at his real size neither passed cleanly (the worst of the two came out a hair apart, 0.17 and 0.17), the pick flipped from one run to the next, and when it was the larger step it stood the party 0.35 nearer his side than live's step does: **0.12 nearer to Natus and 0.06 to Mortibody at 1440x900**. A fight whose table row pins a colossus master now tries the 0.35 step only (the search for every other fight, and the pinned master at the shapes the table proves, are as they were); Chapter X is the one FFX chapter with such a row, so it is the one chapter whose plan reaches that line, and no `fx-mix-*` pin says anything of it (measured below: 0.00 at all four shapes, three runs at the two unproved shapes). **Measured (tables B and C):** Natus 4.455 on every shape; reads **1.63 at 1600x900 (the study's 1.63 to the hundredth)**, 1.67 at 1440x900, 1.70 at 1024x768, 1.68 on the phone (study 1.64), 387, 376, 311 and 214 px; Mortibody 0.71 to 0.74 (study 0.72). **Spacing is unchanged: the ground distance to the nearest member and to the party's centre is the same as live's to the hundredth for both fiends at all four shapes (8 rows, +0.00)**: 8.23 and 6.74 at 1600x900, 7.57 and 6.36 at 1440x900 and 1024x768, 7.70 and 6.44 on the phone. Nothing is cut and no panel or intent card is over him. **A finding the lane could not make: live's Natus is 2.43 units at 1440x900, 1024x768 and on the phone** (BOSS SCALE grows him to 3.98 only at 1600x900, where the pin's table has proved the shape), so the real size is 1.83 times as tall at those three and +12 percent at 1600x900.

### 3. Chapter I's party: 91 percent, 85 percent, and why both are right

The pick quoted "party 91 percent of live". That is the study's measure: the mean standing height of the three heroes, **Kimahri counted by his body**, over the same mean on live. It is 91 percent at 1600x900 on this branch (the Sensor card up; the lane's 92 had it hidden), 88 at 1440x900, 85 at 1024x768 and 79 on the phone. But the heroes' own heights differ in this build (Yuna 1.658 and Kimahri 2.373 against 1.82 all round on live: the heights lane), so the mean is not one figure shrunk. **Tidus, whose height is 1.82 in both builds, is the clean measure: 85 percent at 1600x900, 82 at 1440x900, 79 at 1024x768, 73 on the phone** (the verifier's 86 and 73). That is what the study's own camera gives: it stands 1.15 times as far from the party, one over 1.15 being 87 percent. Flux's top is 49 px under the frame's top at 1600x900 (60 at 1440x900, 59 at 1024x768); a camera tweak could use some of that and win a few points at the price of his head grazing the frame and a re-run of the lane's rig search at every shape, so it is **disclosed, not tweaked**: nobody stands nearer the party either way (a camera moves nobody in the world), and the pick's picture is the one built.

### 4. The nits

- **Genais nearer at 16:10 and 4:3: fixed.** Live's formation solver puts him at x -0.915 (1600x900), -1.109 (1440x900), -1.300 (1024x768), -0.820 (phone), all at z -4.1, and a pin is one spot: the lane's (-0.93, -4.1) stood 0.02 to 0.04 nearer the party than live at the last two. **The pin is (-0.93, -4.3)**: 0.2 further back, which is the one move that is no nearer at any shape and the smallest on screen (his height 4.913 and the spot's x are the lane's; at 1600x900 he reads 2.09 over the party, the study 2.12). Measured (table C): the ground distance from his feet to the nearest member is **1.80 against live's 1.60, 1.61, 1.64 and 1.61** at 1600x900, 1440x900, 1024x768 and the phone (+0.20, +0.19, +0.16, +0.19), and to the party's centre **3.30 against 3.12, 3.20, 3.30 and 3.07** (+0.19, +0.10, +0.00, +0.23): no shape has him nearer. The Core's pin moved from x 5.89 to **5.90** because it stood 0.008 nearer Auron than live's at 16:10 and 4:3 (live's x is 5.87 to 5.90 by shape, 5.75 on a phone); it is now no nearer anywhere (table C: the nearest member +0.02, +0.00, +0.00 and +0.11, the party's centre +0.02, +0.00, +0.00 and +0.12). `evrae-airship-sin.ts` says why; two tests name the pins.
- **The Core nearly off the right edge on phones: disclosed.** 94 percent of it is outside the phone's slice (80 percent on live, table E): its spot is a world position, and any move that brings it into the slice brings it nearer the party (the nearest member, Auron, is 4.76 away; the party's centre 6.76), which is the one thing Bailey ruled out. The slice is `phoneFraming.ts`'s.
- **The pagodas dwarf the 4.1-unit aeons in Chapter III's links 2 to 4: disclosed, a decision for Bailey.** The pagodas (5.7 and 6.3) keep their pins and sizes in every link; the possessed aeons and Yu Yevon keep 4.1, no pick (`research/ffx-bfa-yu-yevon.md` 9.5: their real sizes and formations were not read). Scaling them needs a measurement and Bailey's yes.
- **`gagazet.ts` and `dreams-end.ts` over 400 lines: the lane's growth removed, the files not split.** They were 876 and 1,701 lines before this branch (the house rule was already broken) and 908 and 1,763 with it. The lane's additions that are data (`GAGAZET_PARTY_HEIGHT` and `GAGAZET_STAGING`; `DREAMS_END_PARTY_HEIGHT`, `_ROW_SHIFT`, `_BFA_PIN`, `_STAGING` and the pagodas' pins) are in `src/scenes/gagazet-giants.ts` (33 lines) and `dreams-end-giants.ts` (61), re-exported by the scenes so no importer changed; what stays in the scenes is the rigs and their comments. They are 888 and 1,714 lines now (12 and 13 over their base). A split to 400 lines would be a refactor of 888 and 1,714 lines of painting code for no change on screen: not practical here, and not what the check found wrong.

- **The designed card's zone can still vary from run to run: disclosed, not changed.** Chapter XVII link 3's card at 1440x900 came out a designed compact card in one capture and a tip in another (table A shows the later). The held placement is solved whenever a panel's rect changes (the party panel slides, the Sensor card folds, the turn list moves), and for the first seconds of a decision the camera is still gliding, so the fighters' live boxes it reads are not where they settle; only the tip reads them where the shot rests. Live's HIDDEN rows in this chapter are the same effect. Shared placement plumbing for both games, so not touched here; the e2e asks only that a card is up.

### Verified (the repair)

- `node node_modules/typescript/bin/tsc --noEmit` clean, and `-p tsconfig.e2e.json` clean (the e2e file). `node tools/orphans.mjs`: the same 24 old orphans, none new.
- Touched tests: `ui-ffx-advisor-tip` 30, `ui-ffx-hud-safe-zones` 64 and a todo, `ffx-giant-stature`, `chapters/natus-ship-scene`, the three `fx-mix-*` files, all green. A mutation check: with `enemySpriteRectsAtRest` made to return the live list, exactly the HUD wiring test fails.
- **The full unit suite** (`--testTimeout=60000`): the first run, while two capture runs and another agent's workers shared the machine, had 9 timeouts in tooling tests (`artifact-manifest`, `audio-manifest-io`, `critic-*`, `exp-art-sync`, `r39-hires-install`, `verify-live-beacon`); the second, on a quieter one, **925 files passed, 2 failed (an audio-manifest write race and a 30-battle FFX-2 Bahamut bench that timed out at 60 s: 13,795 tests passed, 2 failed, 46 skipped, 1 todo, 473 s)**, and both pass alone in 21 s (35 of 35). Neither is near a file this repair touched.
- `tests/e2e/advisor-present.spec.ts`: **39 passed in 18.1 minutes** against the dev server on the committed code (`0976af98`): every FFX chapter at 1600x900, 1440x900 and 1024x768, and the two tip chapters at their next decision with the tip where it was (the assertion is in this run). The run before the fitting ladder's last pass and the lazy resting list passed 39 of 39 too (19.5 minutes).
- `git merge-tree --write-tree origin/r3942-stage <head>`: clean (the stage tip moved from `d674a9e2` to `5a5e8710` during the repair; the second check is the last).
- Servers: the one dev server of the repair (port 5301) is stopped; no other server, preview or headless browser of mine is left.

### The tables (the repair's measured set; the live build `a021787a`; "wu" world units)

#### A. The advisor card at the first menu (live -> after)

| chapter | shape | live card | after card |
|---|---|---|---|
| I Flux | 1600x900 | shown shelf 410x175 px, chip up | shown tip 572x33 px, chip up |
| I Flux | 1440x900 | shown compact 255x214 px, chip up | shown tip 515x31 px, chip up |
| I Flux | 1024x768 | shown compact 172x138 px, chip up | shown tip 287x22 px, chip up |
| I Flux | 390x844 | shown open 374x44 px, chip DOWN | shown open 374x44 px, chip DOWN |
| III Braska | 1600x900 | shown shelf 386x196 px, chip up | shown tip 540x33 px, chip up |
| III Braska | 1440x900 | shown shelf 359x188 px, chip up | shown tip 313x30 px, chip up |
| III Braska | 1024x768 | shown shelf 292x128 px, chip up | shown tip 229x22 px, chip up |
| III Braska | 390x844 | shown open 374x44 px, chip DOWN | shown open 374x44 px, chip DOWN |
| X Natus | 1600x900 | shown shelf 457x151 px, chip up | shown shelf 457x151 px, chip up |
| X Natus | 1440x900 | shown shelf 332x165 px, chip up | shown shelf 353x165 px, chip up |
| X Natus | 1024x768 | shown shelf 243x106 px, chip up | shown shelf 248x106 px, chip up |
| X Natus | 390x844 | shown compact 374x44 px, chip DOWN | shown free 374x44 px, chip DOWN |
| XVII Genais | 1600x900 | shown compact 585x94 px, chip up | shown compact 248x214 px, chip up |
| XVII Genais | 1440x900 | HIDDEN (zone free), chip down | shown compact 223x200 px, chip up |
| XVII Genais | 1024x768 | HIDDEN (zone free), chip down | shown tip 366x22 px, chip up |
| XVII Genais | 390x844 | shown open 374x44 px, chip DOWN | shown open 374x44 px, chip DOWN |

#### B. Ratios over the party (the study's definition: standing px over the party's mean, Kimahri by his body), world heights and px

| chapter | fiend | shape | height live -> after (wu) | standing px live -> after | ratio live -> after | the pick (study) |
|---|---|---|---|---|---|---|
| I Flux | seymour-flux | 1600x900 | 4.100 -> 6.017 | 366 -> 500 | 1.28 -> 1.93 | 1.94 |
| I Flux | mortiorchis | 1600x900 | 2.255 -> 3.309 | 203 -> 273 | 0.71 -> 1.05 | 1.07 |
| I Flux | seymour-flux | 1440x900 | 4.100 -> 6.017 | 363 -> 486 | 1.29 -> 1.96 |  |
| I Flux | mortiorchis | 1440x900 | 2.255 -> 3.309 | 202 -> 266 | 0.72 -> 1.07 |  |
| I Flux | seymour-flux | 1024x768 | 4.100 -> 6.017 | 310 -> 404 | 1.29 -> 1.99 |  |
| I Flux | mortiorchis | 1024x768 | 2.255 -> 3.309 | 172 -> 221 | 0.72 -> 1.09 |  |
| I Flux | seymour-flux | 390x844 | 4.100 -> 6.017 | 187 -> 230 | 1.41 -> 2.19 | 2.26 |
| I Flux | mortiorchis | 390x844 | 2.255 -> 3.309 | 103 -> 126 | 0.78 -> 1.20 |  |
| III Braska | braskas-final-aeon | 1600x900 | 4.100 -> 6.919 | 337 -> 540 | 1.14 -> 1.82 | 1.83 |
| III Braska | yu-pagoda-left | 1600x900 | 2.255 -> 5.701 | 199 -> 362 | 0.67 -> 1.22 | 1.22 |
| III Braska | yu-pagoda-right | 1600x900 | 2.255 -> 6.310 | 188 -> 382 | 0.64 -> 1.29 | 1.29 |
| III Braska | braskas-final-aeon | 1440x900 | 4.100 -> 6.919 | 329 -> 540 | 1.16 -> 1.82 |  |
| III Braska | yu-pagoda-left | 1440x900 | 2.255 -> 5.701 | 194 -> 362 | 0.69 -> 1.22 |  |
| III Braska | yu-pagoda-right | 1440x900 | 2.255 -> 6.310 | 184 -> 382 | 0.65 -> 1.29 |  |
| III Braska | braskas-final-aeon | 1024x768 | 4.100 -> 6.919 | 288 -> 461 | 1.14 -> 1.82 |  |
| III Braska | yu-pagoda-left | 1024x768 | 2.255 -> 5.701 | 170 -> 309 | 0.67 -> 1.22 |  |
| III Braska | yu-pagoda-right | 1024x768 | 2.255 -> 6.310 | 161 -> 326 | 0.64 -> 1.29 |  |
| III Braska | braskas-final-aeon | 390x844 | 4.100 -> 6.919 | 168 -> 252 | 1.37 -> 2.34 | 2.54 |
| III Braska | yu-pagoda-left | 390x844 | 2.255 -> 5.701 | 107 -> 186 | 0.87 -> 1.73 | 1.74 |
| III Braska | yu-pagoda-right | 390x844 | 2.255 -> 6.310 | 100 -> 194 | 0.81 -> 1.80 | 1.91 |
| X Natus | seymour-natus | 1600x900 | 3.980 -> 4.455 | 345 -> 387 | 1.55 -> 1.63 | 1.63 |
| X Natus | mortibody | 1600x900 | 1.700 -> 1.912 | 151 -> 170 | 0.68 -> 0.71 | 0.72 |
| X Natus | seymour-natus | 1440x900 | 2.430 -> 4.455 | 202 -> 376 | 0.96 -> 1.67 |  |
| X Natus | mortibody | 1440x900 | 1.700 -> 1.912 | 146 -> 164 | 0.69 -> 0.73 |  |
| X Natus | seymour-natus | 1024x768 | 2.430 -> 4.455 | 166 -> 311 | 0.97 -> 1.70 |  |
| X Natus | mortibody | 1024x768 | 1.700 -> 1.912 | 120 -> 135 | 0.70 -> 0.74 |  |
| X Natus | seymour-natus | 390x844 | 2.430 -> 4.455 | 120 -> 214 | 0.94 -> 1.68 | 1.64 |
| X Natus | mortibody | 390x844 | 1.700 -> 1.912 | 87 -> 93 | 0.68 -> 0.73 |  |
| XVII Genais | sinspawn-genais | 1600x900 | 4.100 -> 4.913 | 451 -> 532 | 1.76 -> 2.09 | 2.12 |
| XVII Genais | sin-core | 1600x900 | 4.100 -> 3.008 | 393 -> 289 | 1.53 -> 1.14 | 1.11 |
| XVII Genais | sinspawn-genais | 1440x900 | 4.100 -> 4.913 | 452 -> 532 | 1.76 -> 2.09 |  |
| XVII Genais | sin-core | 1440x900 | 4.100 -> 3.008 | 393 -> 288 | 1.53 -> 1.14 |  |
| XVII Genais | sinspawn-genais | 1024x768 | 4.100 -> 4.913 | 386 -> 454 | 1.77 -> 2.09 |  |
| XVII Genais | sin-core | 1024x768 | 4.100 -> 3.008 | 335 -> 246 | 1.53 -> 1.14 |  |
| XVII Genais | sinspawn-genais | 390x844 | 4.100 -> 4.913 | 205 -> 243 | 1.83 -> 2.18 | 2.25 |
| XVII Genais | sin-core | 390x844 | 4.100 -> 3.008 | 204 -> 151 | 1.82 -> 1.35 | 1.38 |

#### C. Spacing: ground distance (x, z) from each fiend's feet to the nearest party member and to the party's centre, live -> after

| chapter | fiend | shape | nearest member | party centre | verdict (nearer = shrinks by more than 0.01) |
|---|---|---|---|---|---|
| I Flux | seymour-flux | 1600x900 | 7.75 -> 7.75 (+0.00) | 9.07 -> 9.07 (+0.00) | not nearer |
| I Flux | mortiorchis | 1600x900 | 6.75 -> 6.79 (+0.03) | 8.25 -> 8.33 (+0.08) | not nearer |
| I Flux | seymour-flux | 1440x900 | 7.40 -> 7.57 (+0.17) | 8.78 -> 8.92 (+0.14) | not nearer |
| I Flux | mortiorchis | 1440x900 | 6.62 -> 6.77 (+0.15) | 8.15 -> 8.32 (+0.17) | not nearer |
| I Flux | seymour-flux | 1024x768 | 7.40 -> 7.75 (+0.35) | 8.78 -> 9.07 (+0.29) | not nearer |
| I Flux | mortiorchis | 1024x768 | 6.62 -> 6.79 (+0.17) | 8.15 -> 8.33 (+0.18) | not nearer |
| I Flux | seymour-flux | 390x844 | 7.75 -> 7.75 (+0.00) | 9.07 -> 9.07 (+0.00) | not nearer |
| I Flux | mortiorchis | 390x844 | 6.75 -> 6.79 (+0.03) | 8.25 -> 8.33 (+0.08) | not nearer |
| III Braska | braskas-final-aeon | 1600x900 | 9.42 -> 9.55 (+0.14) | 10.85 -> 10.98 (+0.13) | not nearer |
| III Braska | yu-pagoda-left | 1600x900 | 6.99 -> 13.29 (+6.30) | 8.59 -> 15.00 (+6.41) | not nearer |
| III Braska | yu-pagoda-right | 1600x900 | 9.59 -> 16.45 (+6.86) | 10.94 -> 17.80 (+6.86) | not nearer |
| III Braska | braskas-final-aeon | 1440x900 | 9.42 -> 9.55 (+0.14) | 10.85 -> 10.98 (+0.13) | not nearer |
| III Braska | yu-pagoda-left | 1440x900 | 6.99 -> 13.29 (+6.30) | 8.59 -> 15.00 (+6.41) | not nearer |
| III Braska | yu-pagoda-right | 1440x900 | 9.59 -> 16.45 (+6.86) | 10.94 -> 17.80 (+6.86) | not nearer |
| III Braska | braskas-final-aeon | 1024x768 | 9.42 -> 9.55 (+0.14) | 10.85 -> 10.98 (+0.13) | not nearer |
| III Braska | yu-pagoda-left | 1024x768 | 6.99 -> 13.29 (+6.30) | 8.59 -> 15.00 (+6.41) | not nearer |
| III Braska | yu-pagoda-right | 1024x768 | 9.59 -> 16.45 (+6.86) | 10.94 -> 17.80 (+6.86) | not nearer |
| III Braska | braskas-final-aeon | 390x844 | 7.68 -> 7.97 (+0.29) | 9.23 -> 9.56 (+0.33) | not nearer |
| III Braska | yu-pagoda-left | 390x844 | 4.18 -> 10.96 (+6.78) | 5.88 -> 12.68 (+6.80) | not nearer |
| III Braska | yu-pagoda-right | 390x844 | 7.60 -> 13.57 (+5.97) | 8.80 -> 14.96 (+6.15) | not nearer |
| X Natus | seymour-natus | 1600x900 | 8.23 -> 8.23 (+0.00) | 8.58 -> 8.58 (+0.00) | not nearer |
| X Natus | mortibody | 1600x900 | 6.74 -> 6.74 (+0.00) | 7.02 -> 7.02 (+0.00) | not nearer |
| X Natus | seymour-natus | 1440x900 | 7.57 -> 7.57 (+0.00) | 7.85 -> 7.85 (+0.00) | not nearer |
| X Natus | mortibody | 1440x900 | 6.36 -> 6.36 (+0.00) | 6.69 -> 6.69 (+0.00) | not nearer |
| X Natus | seymour-natus | 1024x768 | 7.57 -> 7.57 (+0.00) | 7.85 -> 7.85 (+0.00) | not nearer |
| X Natus | mortibody | 1024x768 | 6.36 -> 6.36 (+0.00) | 6.69 -> 6.69 (+0.00) | not nearer |
| X Natus | seymour-natus | 390x844 | 7.70 -> 7.70 (+0.00) | 7.97 -> 7.97 (+0.00) | not nearer |
| X Natus | mortibody | 390x844 | 6.44 -> 6.44 (+0.00) | 6.76 -> 6.76 (+0.00) | not nearer |
| XVII Genais | sinspawn-genais | 1600x900 | 1.60 -> 1.80 (+0.20) | 3.12 -> 3.30 (+0.19) | not nearer |
| XVII Genais | sin-core | 1600x900 | 4.74 -> 4.76 (+0.02) | 6.74 -> 6.76 (+0.02) | not nearer |
| XVII Genais | sinspawn-genais | 1440x900 | 1.61 -> 1.80 (+0.19) | 3.20 -> 3.30 (+0.10) | not nearer |
| XVII Genais | sin-core | 1440x900 | 4.76 -> 4.76 (+0.00) | 6.76 -> 6.76 (+0.00) | not nearer |
| XVII Genais | sinspawn-genais | 1024x768 | 1.64 -> 1.80 (+0.16) | 3.30 -> 3.30 (+0.00) | not nearer |
| XVII Genais | sin-core | 1024x768 | 4.76 -> 4.76 (+0.00) | 6.76 -> 6.76 (+0.00) | not nearer |
| XVII Genais | sinspawn-genais | 390x844 | 1.61 -> 1.80 (+0.19) | 3.07 -> 3.30 (+0.23) | not nearer |
| XVII Genais | sin-core | 390x844 | 4.65 -> 4.76 (+0.11) | 6.64 -> 6.76 (+0.12) | not nearer |

36 rows, 0 nearer.

#### D. The party's size on screen, live -> after (Tidus alone: his world height is the same in both builds; the mean counts Kimahri by his body, the study's definition)

| chapter | shape | Tidus standing px | Tidus share | mean px (study definition) | mean share |
|---|---|---|---|---|---|
| I Flux | 1600x900 | 322 -> 274 | 85% | 285 -> 260 | 91% |
| I Flux | 1440x900 | 317 -> 261 | 82% | 281 -> 248 | 88% |
| I Flux | 1024x768 | 271 -> 213 | 79% | 240 -> 203 | 85% |
| I Flux | 390x844 | 147 -> 108 | 73% | 133 -> 105 | 79% |
| III Braska | 1600x900 | 320 -> 330 | 103% | 296 -> 296 | 100% |
| III Braska | 1440x900 | 305 -> 330 | 108% | 283 -> 296 | 105% |
| III Braska | 1024x768 | 273 -> 281 | 103% | 253 -> 253 | 100% |
| III Braska | 390x844 | 131 -> 116 | 88% | 123 -> 108 | 87% |
| X Natus | 1600x900 | 229 -> 229 | 100% | 222 -> 238 | 107% |
| X Natus | 1440x900 | 218 -> 218 | 100% | 210 -> 225 | 107% |
| X Natus | 1024x768 | 177 -> 177 | 100% | 171 -> 183 | 107% |
| X Natus | 390x844 | 133 -> 123 | 93% | 128 -> 127 | 100% |
| XVII Genais | 1600x900 | 316 -> 316 | 100% | 256 -> 254 | 99% |
| XVII Genais | 1440x900 | 316 -> 315 | 100% | 256 -> 254 | 99% |
| XVII Genais | 1024x768 | 269 -> 269 | 100% | 219 -> 217 | 99% |
| XVII Genais | 390x844 | 131 -> 131 | 100% | 112 -> 112 | 99% |

#### E. The frame and the HUD over each fiend (cut by the screen edge / HUD panels over its painted box / the enemy-intent card on it), live -> after

| chapter | fiend | shape | cut by the frame | HUD over it | intent card on it |
|---|---|---|---|---|---|
| I Flux | seymour-flux | 1600x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| I Flux | mortiorchis | 1600x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| I Flux | seymour-flux | 1440x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| I Flux | mortiorchis | 1440x900 | 0% -> 0% | 1% -> 1% | 0% -> 0% |
| I Flux | seymour-flux | 1024x768 | 0% -> 0% | 17% -> 16% | 0% -> 0% |
| I Flux | mortiorchis | 1024x768 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| I Flux | seymour-flux | 390x844 | 0% -> 0% | 0% -> 0% | 13% -> 8% |
| I Flux | mortiorchis | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| III Braska | braskas-final-aeon | 1600x900 | 0% -> 0% | 16% -> 0% | 0% -> 0% |
| III Braska | yu-pagoda-left | 1600x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| III Braska | yu-pagoda-right | 1600x900 | 0% -> 0% | 5% -> 0% | 0% -> 0% |
| III Braska | braskas-final-aeon | 1440x900 | 0% -> 0% | 30% -> 5% | 0% -> 0% |
| III Braska | yu-pagoda-left | 1440x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| III Braska | yu-pagoda-right | 1440x900 | 0% -> 0% | 48% -> 19% | 0% -> 0% |
| III Braska | braskas-final-aeon | 1024x768 | 0% -> 0% | 37% -> 16% | 0% -> 0% |
| III Braska | yu-pagoda-left | 1024x768 | 0% -> 0% | 0% -> 2% | 0% -> 0% |
| III Braska | yu-pagoda-right | 1024x768 | 0% -> 0% | 90% -> 56% | 0% -> 0% |
| III Braska | braskas-final-aeon | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| III Braska | yu-pagoda-left | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| III Braska | yu-pagoda-right | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | seymour-natus | 1600x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | mortibody | 1600x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | seymour-natus | 1440x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | mortibody | 1440x900 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | seymour-natus | 1024x768 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | mortibody | 1024x768 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | seymour-natus | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| X Natus | mortibody | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 0% |
| XVII Genais | sinspawn-genais | 1600x900 | 0% -> 0% | 19% -> 18% | 0% -> 0% |
| XVII Genais | sin-core | 1600x900 | 0% -> 0% | 17% -> 10% | 0% -> 0% |
| XVII Genais | sinspawn-genais | 1440x900 | 0% -> 0% | 25% -> 23% | 0% -> 0% |
| XVII Genais | sin-core | 1440x900 | 9% -> 0% | 16% -> 16% | 0% -> 0% |
| XVII Genais | sinspawn-genais | 1024x768 | 0% -> 0% | 33% -> 27% | 0% -> 0% |
| XVII Genais | sin-core | 1024x768 | 29% -> 19% | 24% -> 26% | 0% -> 0% |
| XVII Genais | sinspawn-genais | 390x844 | 0% -> 0% | 0% -> 0% | 0% -> 20% |
| XVII Genais | sin-core | 390x844 | 80% -> 94% | 0% -> 0% | 0% -> 0% |

**Merge check (against the stage branch as it stands, `origin/r3942-stage` `5a5e8710`):** **clean** at the code head `0976af98`: `git merge-tree --write-tree origin/r3942-stage 0976af98` exits 0, tree `45e9e0c3425c9fe5bb247605978e9b95c481250a`; the commit that adds this section and the sheet changes no code. (The stage branch moved from `d674a9e2` to `5a5e8710`, the FFX-2 phone cure-hint card, while the repair ran; the first check was clean too.) The repair touches one folder the FFX-2 giants lane also works in, `src/engine/fx/mix/`: `masters.ts` (one hunk, a line the stage branch does not change) and `framing.ts` (one line and its comment, between two hunks the stage branch changes, the comment above `today0` and the plate lines below `tries`, with unchanged lines on both sides: no conflict).

---

## What was picked and what was built (one commit per chapter, the game case in every one)

| Chapter | Game | Commit | The pick (Bailey, "all of your recommendations") | What is built |
|---|---|---|---|---|
| I Gagazet (Seymour Flux, Mortiorchis) | FFX only | 104137e2, spacing in 7c12ef1c | Flux at **60 percent** of his real size (real 100 units, 5.29 times the party; study 1.94 over the party, party 91 percent); Mortiorchis scales with him; the study's camera nudge | Flux 6.017 world units (was 4.1) at his own spot; Mortiorchis 3.309 (was 2.255, 0.55 of him) 0.22 further back; the `idle` rig 1.0 left, 0.62 higher, 1.75 back (7.6 degrees down, was 9.0), the `action` and `enemy` rigs back with it |
| III Dream's End (Braska's Final Aeon, the Yu Pagodas) | FFX only | e77a59c5, spacing in 7c12ef1c | the aeon at **75 percent** of his real size (live 92, a lower bound), the two Yu Pagodas in the game's own arrangement behind him (60 either side, 70 behind) at real sizes (about 76 and 84, lower bounds); retire or re-point his BOSS SCALE entry (study 1.83 over the party, party 101 percent) | the aeon 6.919 (was 4.1), the pagodas 5.701 and 6.31 (were 2.255), 4.51 either side and 5.26 behind him, hung 0.96; the low colossus camera; the aeon's pin 0.45 further back; **no engine change needed** (BOSS SCALE is not played here, below; the masters patch retires the aeon's entry too, so that nothing can ever grow him past 75 percent) |
| X Highbridge (Seymour Natus, Mortibody) | FFX only | b77fbd47, switched off in 7c12ef1c | Natus at **real size** (46.2 units, 2.45 times the party) at today's camera and spot (study 1.63 desktop, 0.94 to 1.64 phone); retire or re-point his BOSS SCALE entry | the real size is **built and switched off** (`HIGHBRIDGE_REAL_SIZE = false`): 4.455 and Mortibody 1.912 (`highbridgeHeights(true)`), his turning ring follows his size; on a desktop it cannot play without the framing engine's one line, or it stands him nearer the party than live **(superseded by the repair: the line is applied and the switch is on)** |
| XVII link 3 (Sinspawn Genais, Sin's Core) | FFX only | 7fa12c97, file length in c8daf7aa | Genais **+20 percent** and the Core **-27 percent** to real size at today's spots; the Fins unchanged | Genais 4.913 and the Core 3.008 (both were 4.1), pinned at the spots they stood on; the Fins and the head have no row |
| Not built (no pick) | | | Yunalesca, Evrae, Seymour Omnis, Overdrive Sin's head, Yojimbo, anything FFX-2 | nothing |

Beyond the four chapter commits the lane has three, where the brief asked for one per chapter: 7c12ef1c (Bailey's standing preference applied to three chapters at once), c8daf7aa (`evrae-airship-deck.ts` back under 400 lines: the Sin commit had taken it from 397 to 404) and 006a2a40 (three numbers quoted in comments and research corrected, "Open and disclosed"). `gagazet.ts` (908 lines) and `dreams-end.ts` (1763) were over 400 before this lane and are not split here.

**New data and code.** `src/data/ffx/fiend-stature.ts` gains `FFX_GIANT_STATURE` (the live PS2 silhouettes, `share` = Bailey's pick, `lowerBound`, `confidence`, the static law and the engine height field for comparison only, the pagodas' `stand`), `FFX_GIANT_FOLLOWER` (Mortiorchis 0.55 of Flux, Mortibody 0.4293 of Natus) and `giantHeight`, `giantStand`, `giantFigureHeights`; it is separate from wave 1's `FFX_FIEND_STATURE`, which is raw mesh x C and is right for upright figures (a giant spreads in the default pose: Braska's Final Aeon reads 204.7 by that law and 92 on the PS2 screen, Genais 80.3 and 49). Scenes: `gagazet.ts` (heights, Mortiorchis's pin, the rigs), `dreams-end.ts` (heights, three pins, the rigs and `DREAMS_END_ROW_SHIFT`), `highbridge.ts` and `highbridge-ring.ts` (the switch, `highbridgeHeights`, the ring's `followScale`), `evrae-airship-deck.ts` and `evrae-airship-sin.ts` (the deck plate's optional `staging`, the Sin plate's heights and pins; Evrae's plate and the head's carry none). Research (method, disc, model ids, ranges, the tag, the confidence, what was not found, what the build does with it): `research/ffx-seymour-flux.md` section 13, `ffx-bfa-yu-yevon.md` section 9, `ffx-seymour-natus-highbridge.md` section 13, `ffx-sin.md` section 13. Tests: `tests/unit/ffx-giant-stature.test.ts` (31 and a todo), `chapters/natus-ship-scene.test.ts` (12), `chapters/gagazet-boss-spots.test.ts`, `chapters/leblanc-scene.test.ts`, `ffx-fiend-stature.test.ts`.

**Sources and how sure.** The live heights are the sizes lane's second pass (`D:/Tools/pcsx2-ffx/re/dumps/boss-sizes.json`, `D:/Tools/rea/FINDINGS-sizes.md` section 4; the original NTSC-U disc SLUS-20312, CRC BB3D833A, PCSX2 v2.8.2): `[single source: own measurement]`, the static law `[datamined: FFX HD Remaster build 25501027, bind pose, one reader]`. **Braska's Final Aeon (92) and the Yu Pagodas (75.8 and 83.9) are lower bounds** (the silhouettes run into the HELP banner and the HUD's band; the twins' two reads differ by 10 percent), so the build's three-quarters is a share of a number that is, if anything, small. **Flux's scale is shaky** (an independent check: 10 percent or more; medium-low): his 0.6 is a size to judge on the screen, not a measurement to defend to the pixel. Natus, Genais and the Core are medium. The pagodas' hang above the floor (12.8 game units) is the options study's and ours, not read; Mortiorchis has no mesh to measure and Mortibody adds nothing to Natus's silhouette, so both follow their boss at the share they stood at before.

## The numbers, on screen

First command menu of each chapter (Sin: link 3's), seed 1, headless real-GPU Chromium, clocks frozen; LIVE = https://echoesofspira.com (release 39.4.1), AFTER = this branch on a dev server. "Ratio" is a fiend's standing height (feet to feet plus world height, projected through the camera) over the party's mean standing height on screen (Kimahri counted by his body, x 0.9287): the options study's own definition (`D:/Tools/pyrefly-scratch/2026-10-08/giants/ffx/analyze.mjs`); "party px" is that mean, and the percentage is the party's size against live's. "Real" is the model's own ratio over the same party at one distance (the research sections). The Chapter X rows are twice: the branch as it stands (the switch off: as the base branch, whose party is 107 percent of live's from the heights lane) and the **end state** (the switch on and the one BOSS SCALE line retired in a scratch copy, below). **(Superseded by the repair: the end state is the build's now, and the repair's own tables, below, are the measured set; this lane's tables are kept as it wrote them.)** The sheet: `docs/screenshots/r3942-giants-ffx/before-after.jpg` (its Chapter X "after" is the end state).


#### 1600x900

| chapter | fiend | height live to after (world units) | standing px live to after | ratio over party live to after | real | HUD over the fiend live to after | intent card on its head live to after | party px live to after | planned camera live | planned camera after |
|---|---|---|---|---|---|---|---|---|---|---|
| I Gagazet (Flux) | seymour-flux | 4.100 to 6.017 | 363 to 500 | 1.29 to 1.93 | 5.29 | 0% to 0% | 0% to 0% | 282 to 260 (92%) | -0.41, 3.22, 10.06 | -1.11, 3.68, 11.40 |
| I Gagazet (Flux) | mortiorchis | 2.255 to 3.309 | 201 to 273 | 0.71 to 1.05 |  | 0% to 0% | 0% to 0% | 282 to 260 (92%) | -0.41, 3.22, 10.06 | -1.11, 3.68, 11.40 |
| III Dream's End (Braska) | braskas-final-aeon | 4.100 to 6.919 | 337 to 540 | 1.14 to 1.82 | 5.11 | 16% to 0% | 0% to 0% | 296 to 296 (100%) | 0.37, 2.80, 10.26 | -1.30, 1.21, 10.41 |
| III Dream's End (Braska) | yu-pagoda-left | 2.255 to 5.701 | 199 to 362 | 0.67 to 1.22 | 4.21 | 0% to 0% | 0% to 0% | 296 to 296 (100%) | 0.37, 2.80, 10.26 | -1.30, 1.21, 10.41 |
| III Dream's End (Braska) | yu-pagoda-right | 2.255 to 6.310 | 189 to 382 | 0.64 to 1.29 | 4.66 | 5% to 0% | 0% to 0% | 296 to 296 (100%) | 0.37, 2.80, 10.26 | -1.30, 1.21, 10.41 |
| X Highbridge (Natus), as the branch stands (switch off) | seymour-natus | 3.962 to 3.980 | 344 to 345 | 1.55 to 1.45 | 2.45 | 0% to 0% | 0% to 0% | 222 to 238 (107%) | 0.96, 3.64, 18.22 | 0.96, 3.66, 18.20 |
| X Highbridge (Natus), as the branch stands (switch off) | mortibody | 1.700 to 1.700 | 151 to 151 | 0.68 to 0.63 |  | 0% to 0% | 0% to 0% | 222 to 238 (107%) | 0.96, 3.64, 18.22 | 0.96, 3.66, 18.20 |
| X Highbridge (Natus), end state (switch on, BOSS SCALE retired in a scratch copy) | seymour-natus | 3.962 to 4.455 | 344 to 387 | 1.55 to 1.63 | 2.45 | 0% to 0% | 0% to 0% | 222 to 238 (107%) | 0.96, 3.64, 18.22 | 0.99, 3.66, 18.20 |
| X Highbridge (Natus), end state (switch on, BOSS SCALE retired in a scratch copy) | mortibody | 1.700 to 1.912 | 151 to 170 | 0.68 to 0.71 |  | 0% to 0% | 0% to 0% | 222 to 238 (107%) | 0.96, 3.64, 18.22 | 0.99, 3.66, 18.20 |
| XVII link 3 (Genais, Core) | sinspawn-genais | 4.100 to 4.913 | 451 to 540 | 1.76 to 2.12 | 2.72 | 18% to 19% | 0% to 0% | 256 to 254 (99%) | -0.55, 1.46, 9.39 | -0.57, 1.48, 9.40 |
| XVII link 3 (Genais, Core) | sin-core | 4.100 to 3.008 | 393 to 288 | 1.53 to 1.14 | 1.67 | 17% to 9% | 0% to 0% | 256 to 254 (99%) | -0.55, 1.46, 9.39 | -0.57, 1.48, 9.40 |

#### 390x844

| chapter | fiend | height live to after (world units) | standing px live to after | ratio over party live to after | real | HUD over the fiend live to after | intent card on its head live to after | party px live to after | planned camera live | planned camera after |
|---|---|---|---|---|---|---|---|---|---|---|
| I Gagazet (Flux) | seymour-flux | 4.100 to 6.017 | 187 to 230 | 1.41 to 2.19 | 5.29 | 0% to 0% | 13% to 8% | 133 to 105 (79%) | -0.27, 4.55, 11.88 | -1.09, 5.99, 15.72 |
| I Gagazet (Flux) | mortiorchis | 2.255 to 3.309 | 103 to 126 | 0.78 to 1.20 |  | 0% to 0% | 0% to 0% | 133 to 105 (79%) | -0.27, 4.55, 11.88 | -1.09, 5.99, 15.72 |
| III Dream's End (Braska) | braskas-final-aeon | 4.100 to 6.919 | 167 to 252 | 1.37 to 2.34 | 5.11 | 0% to 0% | 0% to 0% | 122 to 108 (88%) | -0.40, 3.14, 14.13 | -2.86, 2.66, 15.93 |
| III Dream's End (Braska) | yu-pagoda-left | 2.255 to 5.701 | 106 to 186 | 0.87 to 1.72 | 4.21 | 0% to 0% | 0% to 0% | 122 to 108 (88%) | -0.40, 3.14, 14.13 | -2.86, 2.66, 15.93 |
| III Dream's End (Braska) | yu-pagoda-right | 2.255 to 6.310 | 99 to 194 | 0.82 to 1.80 | 4.66 | 0% to 0% | 0% to 0% | 122 to 108 (88%) | -0.40, 3.14, 14.13 | -2.86, 2.66, 15.93 |
| X Highbridge (Natus), as the branch stands (switch off) | seymour-natus | 2.430 to 2.430 | 121 to 121 | 0.94 to 0.88 | 2.45 | 0% to 0% | 0% to 0% | 128 to 137 (107%) | -0.03, 5.08, 17.59 | -0.02, 5.11, 17.59 |
| X Highbridge (Natus), as the branch stands (switch off) | mortibody | 1.700 to 1.700 | 87 to 87 | 0.68 to 0.64 |  | 0% to 0% | 0% to 0% | 128 to 137 (107%) | -0.03, 5.08, 17.59 | -0.02, 5.11, 17.59 |
| X Highbridge (Natus), end state (switch on, BOSS SCALE retired in a scratch copy) | seymour-natus | 2.430 to 4.455 | 121 to 214 | 0.94 to 1.68 | 2.45 | 0% to 0% | 0% to 0% | 128 to 127 (99%) | -0.03, 5.08, 17.59 | -0.04, 5.94, 18.36 |
| X Highbridge (Natus), end state (switch on, BOSS SCALE retired in a scratch copy) | mortibody | 1.700 to 1.912 | 87 to 93 | 0.68 to 0.73 |  | 0% to 0% | 0% to 0% | 128 to 127 (99%) | -0.03, 5.08, 17.59 | -0.04, 5.94, 18.36 |
| XVII link 3 (Genais, Core) | sinspawn-genais | 4.100 to 4.913 | 206 to 246 | 1.83 to 2.20 | 2.72 | 0% to 0% | 3% to 17% | 112 to 112 (99%) | -0.98, 1.37, 13.12 | -0.99, 1.39, 13.12 |
| XVII link 3 (Genais, Core) | sin-core | 4.100 to 3.008 | 204 to 150 | 1.82 to 1.35 | 1.67 | 0% to 0% | 0% to 0% | 112 to 112 (99%) | -0.98, 1.37, 13.12 | -0.99, 1.39, 13.12 |

**Against the study** (its picture for each pick, `D:/Tools/pyrefly-scratch/2026-10-08/giants/ffx/results`; ratio over the party and the party's share of today):

| Chapter | Desktop: build | Desktop: study | Phone: build | Phone: study |
|---|---|---|---|---|
| I Flux | 1.93, party 92 percent, Mortiorchis 1.05 | 1.94, 91 percent, Mortiorchis 1.07 | 2.19, 79 percent | 2.26, 74 percent |
| III Braska | 1.82, party 100 percent, pagodas 1.22 and 1.29 | 1.83, 101 percent, pagodas 1.22 and 1.29 | 2.34, 88 percent, pagodas 1.72 and 1.80 | 2.54, 79 percent, pagodas 1.74 and 1.91 |
| X Natus, end state | 1.63, 387 px, party 107 percent, Mortibody 0.71 | 1.63, 388 px, 107 percent, Mortibody 0.72 | 1.68, 214 px, party 99 percent | 1.64, 107 percent |
| X Natus, as the branch stands | 1.45 (live's picture; the party's size is the heights lane's) | not built | 0.88 | not built |
| XVII Genais and Core | 2.12 and 1.14, 540 and 288 px, party 99 percent | 2.12 and 1.11, 99 percent | 2.20 and 1.35, party 99 percent | 2.25 and 1.38, 99 percent |

The study's Core stood 1.35 units nearer the right edge (it moved the Core); this build keeps its spot, so it reads 1.14 against 1.11. On the phone Braska reads 2.34 against the study's 2.54 with the party at 88 percent against 79: the study's phone camera stood back further. Nothing is cut at either size in any row (the clip column of the captures is 0 except the Core on the phone, below).

## Bailey's standing preference: the spacing audit

**The rule:** no boss or part stands nearer the party than on live. **The measure:** the ground distance (x and z, in world units) from each fiend's feet to the nearest party member and to the party's centre, read from the same captures (`actors[id].pos`), live against the branch; the tool is `near.mjs` (the listing is at the end of this note). A figure is "nearer" if either distance shrinks by more than 0.01.

| Chapter | Fiend | Nearest member, desktop live to after | Party centre, desktop live to after | Nearest member, phone live to after | Party centre, phone live to after |
|---|---|---|---|---|---|
| I | Seymour Flux | 7.75 to 7.75 | 9.07 to 9.07 | 7.75 to 7.75 | 9.07 to 9.07 |
| I | Mortiorchis | 6.75 to 6.79 | 8.25 to 8.33 | 6.75 to 6.79 | 8.25 to 8.33 |
| III | Braska's Final Aeon | 9.42 to 9.55 | 10.85 to 10.98 | 7.69 to 7.97 | 9.24 to 9.56 |
| III | Yu Pagoda, left | 6.99 to 13.29 | 8.59 to 15.00 | 4.17 to 10.96 | 5.88 to 12.68 |
| III | Yu Pagoda, right | 9.59 to 16.45 | 10.94 to 17.80 | 7.65 to 13.57 | 8.84 to 14.96 |
| X (as the branch stands, and the end state) | Natus | 8.23 to 8.23 | 8.58 to 8.58 | 7.70 to 7.70 | 7.97 to 7.97 |
| X (as the branch stands, and the end state) | Mortibody | 6.74 to 6.74 | 7.02 to 7.02 | 6.44 to 6.44 | 6.76 to 6.76 |
| XVII | Sinspawn Genais | 1.60 to 1.60 | 3.10 to 3.12 | 1.61 to 1.60 | 3.06 to 3.12 |
| XVII | Sin's Core | 4.71 to 4.76 | 6.71 to 6.75 | 4.63 to 4.76 | 6.62 to 6.75 |

At these two shapes none is nearer (Genais is 0.01 nearer the nearest member on the phone, inside the tool's tolerance: the pin is the desktop spot, and live's phone spot was 0.13 further right); one other shape differs, below. The audit found two things nearer and the lane fixed them (7c12ef1c): Mortiorchis, moved left with the bigger Flux, was 0.19 nearer Kimahri (it stands 0.22 further back, z -7.82), and the aeon's first pin was 0.24 nearer the nearest member than live's desktop spot (it is z -8.45 now); the pagodas stand behind him, 6 to 7 units further back than live's. Chapter X's real size fails the audit without the engine line (below), so it is off. **Other window shapes:** Flux and Braska at five more desktop shapes, and Chapter XVII link 3 at three (live against this branch, first command menu, seed 1, the same audit; Chapter X is off, so it is live's picture at every shape): **Flux and Braska: nothing is nearer at any of the five.** Flux's spot is live's at every shape and Mortiorchis stands 0.03 to 0.17 further from the nearest member; the aeon stands 0.13 to 0.14 further and the pagodas 6.3 and 6.9 further, the same at every shape. The sizes hold across the shapes (Flux reads 1.93 to 1.99 over the party, live 1.26 to 1.29; the aeon 1.78 to 1.82, live 1.11 to 1.16), nothing is cut, and the HUD covers the figures no more than on live. **BOSS SCALE is not played in Braska's chapter at any shape** (the framing record's scale is -1: at his size the colossus master fails every step of the plan and the plan plays the scene's own rig). The party shrinks to 83 to 92 percent of live's in Flux's chapter (88 at the common 16:9 and 16:10 shapes; the study's 91 at 1600x900), where the rig stands back for his height.

| window | Flux ratio live to after | party px, share of live | Flux and Mortiorchis: smallest change in distance to the nearest member | aeon ratio live to after | pagodas after | party share | HUD over the aeon and the right pagoda, live to after | aeon and pagodas: smallest change in distance to the nearest member | BOSS SCALE played |
|---|---|---|---|---|---|---|---|---|---|
| 1280x720 | 1.29 to 1.96 | 225 to 199 (88%) | +0.00 | 1.14 to 1.82 | 1.22 and 1.29 | 100% | 24% and 28% to 0% and 7% | +0.13 | no |
| 1440x900 | 1.29 to 1.96 | 281 to 248 (88%) | +0.14 | 1.16 to 1.82 | 1.22 and 1.29 | 105% | 30% and 45% to 5% and 19% | +0.13 | no |
| 1024x768 | 1.28 to 1.99 | 244 to 203 (83%) | +0.17 | 1.14 to 1.82 | 1.22 and 1.29 | 100% | 37% and 90% to 16% and 56% | +0.13 | no |
| 1920x1080 | 1.29 to 1.93 | 338 to 312 (92%) | +0.00 | 1.14 to 1.82 | 1.22 and 1.29 | 100% | 16% and 5% to 0% and 0% | +0.13 | no |
| 2560x1080 | 1.26 to 1.93 | 354 to 312 (88%) | +0.11 | 1.11 to 1.78 | 1.18 and 1.25 | 100% | 2% and 0% to 0% and 0% | +0.13 | no |

**(Superseded by the repair: Genais's pin is (-0.93, -4.3) and the Core's x is 5.90, and nothing is nearer at any of the four shapes of the repair's proof; the lane's text follows as it wrote it.)** **Chapter XVII link 3 (Genais and the Core) at 1280x720, 1024x768 and 2560x1080: nothing is nearer at 1280x720 and 2560x1080, and at 1024x768 (4:3) Genais is 0.04 nearer the nearest member and 0.18 nearer the party's centre than live.** The party does not move with the window in this chapter (Tidus (0.10, 0.90), Yuna (-0.95, -2.50) and Auron (2.20, -2.30) at every shape, live and branch), but live's solver places Genais per shape (x -0.88 at 1600x900, -0.92 at 1280x720 and 2560x1080, -0.80 on the phone, **-1.30 at 1024x768**) and a pin is one spot: the branch's -0.93 is within 0.01 of live's nearest-member distance at every shape but the 4:3 one. A pin at -1.30 would be no nearer anywhere, and 0.4 units further left than live at the common shapes (the nearest member 1.64 and the party's centre 3.30 against live's 1.60 and 3.10); it is not done, because it changes the common shapes to fix an uncommon one. Say if Bailey wants it the other way. The Core is no nearer at any shape (+0.01 to +0.12) and at 1024x768 the frame cuts 19 percent of it (live 29).

| window | Genais ratio live to after | Core ratio live to after | party share | Genais: change in distance to the nearest member, to the party centre | Core: the same | Core cut by the frame live to after | verdict |
|---|---|---|---|---|---|---|---|
| 1280x720 | 1.76 to 2.12 | 1.53 to 1.14 | 99% | -0.00, +0.00 | +0.01, +0.01 | 0% to 0% | none nearer |
| 1024x768 | 1.77 to 2.12 | 1.53 to 1.14 | 99% | -0.04, -0.18 | -0.01, -0.01 | 29% to 19% | **Genais nearer** (live stands at x -1.30, the pin at -0.93) |
| 2560x1080 | 1.76 to 2.12 | 1.53 to 1.14 | 99% | -0.00, +0.00 | +0.01, +0.01 | 0% to 0% | none nearer |

## What needs the framing engine (Chapter X, Natus on a desktop)

**(Done by the repair of 2026-10-08, section 2 above: the patch is applied, the six BOSS SCALE cases and the lane's two are re-pointed to measured values, `HIGHBRIDGE_REAL_SIZE` is true, and the framing engine's party-step search needed one more line the lane could not see with the switch off. What follows is the lane's text, kept for the reasoning.)**

**The pick cannot play without `src/engine/fx/mix/masters.ts`, a file the FFX-2 giants lane owns.** `scaleTarget` names `seymour-natus` and `braskas-final-aeon` for BOSS SCALE 2.2. On live Natus is drawn 2.43 and BOSS SCALE grows him to about 3.96 on a desktop; at his real size (4.455) the pinned colossus master (CHAPTER FRAMING's `NATUS_PIN`, the row's step apart of 0.75 and his own 0.4) fails: BOSS SCALE grows a master's Natus a further 1.14 (to about 5.07), the Sensor card pinned above him then covers 17 percent of his painted pixels against the 5 percent the pin allows, the plan falls back to the scene's own idle rig with the figures on the scene's pins, and the row's step apart is lost. Measured on the final code with the switch on and `masters.ts` untouched (a scratch server on port 5233 that swaps the one constant at serve time; the captures are `switch-only/`): on a desktop BOSS SCALE is not played (the framing record's scale is -1), the chapter row's pin is lost (his dx 1.15 and Mortibody's 0.75 are gone from the staging, the party takes 0.7 to the right instead of 0.22 to the left), the camera stands higher (y 5.24 against 3.66), and he stands at x 2.90 against live's 4.05 and Mortibody at 1.35 against 2.10: 1.15 and 0.75 units nearer along the screen, **0.79 and 0.43 nearer the nearest party member** (8.23 to 7.45 and 6.74 to 6.31; 0.83 and 0.38 nearer the party's centre), with Kimahri in front of his lower robes. That is the nearness Bailey ruled out, so `HIGHBRIDGE_REAL_SIZE` is `false` and the chapter is as live (the capture shows 0.00 differences). On a phone neither BOSS SCALE nor the pin plays (the phone keeps the scene's rig and its own fit), so the real size reads 1.68 there in either state of the engine.

**The one line** (`docs/handoff/r3942-giants-ffx-masters.patch`, `git apply --ignore-whitespace` after `--check`; it applies to 0284bf85's file and to `origin/r3942-stage`'s, which has not changed `masters.ts`):

```diff
-  if (/^(seymour-natus|braskas-final-aeon)/.test(id)) return 2.2;
```

It retires BOSS SCALE for both. For Braska it changes nothing (BOSS SCALE is not played in his chapter: at his size the colossus master fails every step of the plan at the first menu, a party member stands inside his painted silhouette and Yuna and the right pagoda stand under panels, so the plan plays the scene's own rig; read at six window shapes) and the patch changes nothing in his picture: the aeon and both pagodas read the same to the pixel as unpatched on the patched server with the final code (540, 362 and 382 px on a desktop; 252, 186 and 194 on a phone), with the same camera and party size. The line is not the whole job: six BOSS SCALE test cases in the FFX-2 lane's folder name Natus as the colossus they size (below).

**To turn Natus on:** (1) apply the patch; (2) in the FFX-2 lane's tests, re-point the six BOSS SCALE cases that use Natus as their sized colossus (found by applying the patch and the switch in a scratch checkout of the merged tree and running the full suite: these six and this lane's two in step 3 fail, and nothing else does, the nine files that need `docs/concepts`, which that checkout left out, aside): `fx-mix-boss-scale.test.ts` (the targets case that expects 2.2 for `seymour-natus` and `braskas-final-aeon`; "takes the full target whatever the step says"; the two lock cases, "a boss locked at the drawn scale stays at it" and "the phase key follows the sized bosses"), `fx-mix-fail-closed.test.ts` ("every other FFX colossus and Bahamut still is one") and `fx-mix-party-stature.test.ts` ("BOSS SCALE's factor for a colossus ... step by step"); Evrae (2.4) and Bahamut (2.0) are the other sized colossi; (3) set `HIGHBRIDGE_REAL_SIZE = true` in `src/scenes/highbridge.ts` and change this lane's two tests that name the switch (`ffx-giant-stature.test.ts` "switched OFF" and `natus-ship-scene.test.ts` "each enemy's slot is the record's own") and the `it.todo` (it names the masters change); (4) run the chapter capture (below) and the spacing audit, and expect the end-state numbers in the tables: desktop 4.455 units, ratio 1.63, 387 px, the party 107 percent of live's, 0.00 spacing difference; phone 1.68, 214 px, party 99 percent. Retiring only Natus's entry (leaving the aeon's) fails the same six, and leaves a BOSS SCALE entry that would grow the aeon past Bailey's 75 percent in any plan where his colossus master passes (none does at the six shapes read, but it is a standing risk), so the patch retires both.

**The proof of the end state** was taken on a scratch dev server (port 5202, stopped) that serves a patched copy of `masters.ts` and the worktree's `highbridge.ts` with the one constant swapped at serve time: `D:/Tools/pyrefly-scratch/2026-10-08/giants-ffx-build/dev-patched2.config.mjs`. The repository's two files are untouched. The ring: `NatusRing(height, followScale)`; on, it follows the group scale a plan puts on him (before, BOSS SCALE grew him and the ring stayed the size of a 2.43-unit one, about 40 percent too small).

## Notes by chapter

**I (FFX only).** Flux's spot is live's, (3.54, 0, -7.6). The camera backs off for his 6.017 (from the old rig his head would stand about 85 px above the 1600x900 frame): `idle` is also the parallax stack's reference (`CAMERA_REF` [-1.0, 3.668, 11.25]), the `action` and `enemy` rigs stand at about its distance and aim at him, and the painting's top edge (y 12.7 at z -48) is what limits how high any of them can look. The first search of the rigs left a void band at the painting's top and a parallax layer's edge in view; the shipped rigs keep the top of the view at or under 12.6 at the painting's depth and the layer edge out of the frame (the rig pictures are in `D:/Tools/pyrefly-scratch/2026-10-08/giants-ffx-build/rigs/`). On a phone the slice fit stands the camera back (11.9 to 15.7) and the party is 79 percent of live's; the study's phone was 74.

**III (FFX only).** The group stands in the game's arrangement under the study's low colossus camera (`idle` at [-1.65, 1.2, 9.85]); CHAPTER FRAMING's Chapter III row (2026-10-04, option 1: the boss 2.6 right and 0.95 back at the menus) still plays on a desktop and its moves are read from `stageTable.ts` by the test, which fails if the row or the rig moves under the pins. The aeon's pin is (2.03, 0, -8.45); the pagodas' are the aeon's final place plus the game's stand less what the row adds to each. **Links 2 to 4** (the possessed aeons, Yu Yevon) are the same scene: the pagodas keep their size and pins, the fiend in front of them keeps its 4.1 (no pick), so Yu Yevon and a possessed Valefor now read small beside the pagodas (the pictures are `link2/` in the scratch folder; the group is whole, the left pagoda's base stands behind the party's heads in them). The pagodas' hang (0.96) is the study's, ours and not read.

**X (FFX only).** Built, off, and what it needs is above. **(Superseded by the repair: on.)** With the switch on the heights are `highbridgeHeights(true)` = 4.455 and 1.912 (Mortibody 0.4293 of him, the share it stood at on a desktop before: 1.7 against the 3.96 BOSS SCALE gave him).

**XVII (FFX only).** Link 3's deck is at NEAR in both builds, as in the study; the harness puts it there for both (the range a run arrives with depends on the last Fin and the dev server's timing, and the Framing's stale plan can leave the camera at FAR). Genais and the Core are pinned at (-0.93, -4.1) and (5.89, -5.3) **(superseded by the repair: (-0.93, -4.3) and (5.90, -5.3), see section 4)**: the formation solver spreads figures by height and would otherwise put the taller Genais between and the Core on his left. The Fins and Overdrive Sin's head are not in the table; the Evrae deck and the head's plate publish nothing new. **Disclosed:** on a phone the Core stands at the right edge of the slice, 79 percent outside it on the live build and 95 percent now that it is smaller (its spot is today's); and the intent card covers 17 percent of Genais's box on a phone (3 percent live, the bigger box under the same card).

## Method and harness

Headless Playwright from node, `PYREFLY_BROWSER=gpu` (real-GPU Chromium), a dev server on port 5201 that does not watch the art, seed 1, the clocks frozen, the first command menu of each chapter (Sin: link 3's, through the real chain with the earlier links' fiends left at 1 HP in the page), 1600x900 and 390x844; live is https://echoesofspira.com. The browser pane and Chrome were not used. Scripts (outside the repo): `D:/Tools/pyrefly-scratch/2026-10-08/giants-ffx-build/` (`cap.mjs` the capture, `an.mjs` the study's metrics, `near.mjs` the spacing audit, `numbers.mjs` the tables above, `make-sheet.mjs` the sheet, `dev.config.mjs` and `dev-patched2.config.mjs` the servers, `pre-near.js` the Sin deck's range). The captures: `live/`, `after/`, `patched-after2/`, `shapes-live/`, `shapes-after/`.

`near.mjs` (the whole tool):

```js
// near.mjs: Bailey's standing preference (2026-10-08 ~14:30 EDT, via the coordinator): no boss or part stands NEARER the party than it does on live today.
//   node near.mjs <live.json> <after.json>   -> per fiend present in both: its ground distance (x, z) to the nearest party member and to the party's centre, live and after, and a verdict.
import fs from 'node:fs';

const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const ground = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

export function nearness(live, after) {
  const party = (d) => d.activeIds.filter((id) => d.actors[id]).map((id) => d.actors[id].pos);
  const pl = party(live), pa = party(after);
  const centre = (ps) => [ps.reduce((s, p) => s + p[0], 0) / ps.length, 0, ps.reduce((s, p) => s + p[2], 0) / ps.length];
  const rows = [];
  for (const [id, a] of Object.entries(after.actors)) {
    if (a.side === 'party') continue;
    const l = live.actors[id];
    if (!l) continue;
    const dl = Math.min(...pl.map((p) => ground(l.pos, p))), da = Math.min(...pa.map((p) => ground(a.pos, p)));
    const cl = ground(l.pos, centre(pl)), ca = ground(a.pos, centre(pa));
    rows.push({ id, live: dl, after: da, d: da - dl, liveCentre: cl, afterCentre: ca, dCentre: ca - cl, livePos: l.pos, afterPos: a.pos, ok: da >= dl - 0.01 && ca >= cl - 0.01 });
  }
  return rows;
}

if (process.argv[1] && process.argv[1].endsWith('near.mjs')) {
  const [lf, af] = process.argv.slice(2);
  for (const r of nearness(load(lf), load(af))) {
    console.log(`${r.id.padEnd(20)} nearest party member ${r.live.toFixed(2)} -> ${r.after.toFixed(2)} (${r.d >= 0 ? '+' : ''}${r.d.toFixed(2)}); party centre ${r.liveCentre.toFixed(2)} -> ${r.afterCentre.toFixed(2)} (${r.dCentre >= 0 ? '+' : ''}${r.dCentre.toFixed(2)})  ${r.ok ? 'NOT NEARER' : '*** NEARER ***'}   live ${r.livePos.map((v) => v.toFixed(2)).join(',')} after ${r.afterPos.map((v) => v.toFixed(2)).join(',')}`);
  }
}
```

## Verified

- `node node_modules/typescript/bin/tsc --noEmit` (TypeScript 7.0.2) is clean at the branch tip, after the last code change (c8daf7aa) and the comment-only corrections (006a2a40). Each chapter commit carries only the checks for the chapters built so far (the giants test file was split per commit), and its own touched tests pass.
- Touched tests: `ffx-giant-stature` 31 and a todo, `chapters/natus-ship-scene` 12, `chapters/gagazet-boss-spots` 3, `chapters/leblanc-scene` 11, `ffx-fiend-stature` 11, the Evrae deck, hold-party, resize, E1-H slot, crossfade, Sin-listed and load-time-gates tests (117 tests across those eight files after the deck trim).
- **The full unit suite, once, on `006a2a40` (the code head), `--testTimeout=60000`: 931 files, 926 passed and 5 skipped; 13,764 tests passed, 46 skipped, 2 todo; no failure and no timeout** (272 s, in this worktree with the art linked from `D:/pyrefly-r39-int`). It includes the golden engine digests (`ffx-engine-golden` 18, `ffx2-atb-golden` 6, `ff7-golden` 3) and the benches that run: none changed, none re-pinned, and nothing in `src/battle/**`, `src/data/**/enemies/**` or a golden file is in the diff of this lane. The two todos are this lane's (the masters change) and the one that was there before.
- `node tools/orphans.mjs`: 24 orphaned modules, the old ones (voice presets, sprite templates, `BlobShadow`, `SpriteActor`, ...); `fiend-stature.ts` and the scene files are not among them.
- **The merged tree** (a scratch sparse checkout of the code head with `origin/r3942-stage` `b8aa906f` merged, uncommitted, in `D:/Tools/pyrefly-scratch/2026-10-08/giants-ffx-build/merge-check`, removed afterwards; `docs/screenshots` and `docs/concepts` left out to save 6 GB): `tsc --noEmit` clean but for the six `pause-living-portrait-*` tests whose imports are in `docs/concepts`; the full suite 938 files, 924 passed and 9 failed, the nine all for the missing `docs/concepts` files (the six living-portrait tests, `pause-remake`, `art-ref-defaults`, `macalania-party-layout`: each reads a file under `docs/concepts` and passes in this worktree), 13,736 tests passed and no other failure. The four FFX chapters at 1600x900 and 390x844 on a dev server on that tree (port 5234, stopped) read **the same as this branch's in every size and every spot** (standing px within 0.3, ground positions identical, the party's size the same, the cameras within 0.03) **but one: Chapter III at 1600x900 plans with a 36 px vertical lens shift (the framing record's fit not ok) where this branch alone passes without one.** Braska's plan at that shape is marginal: this branch makes the same 36 px shift at 1440x900 (and 43, 29 and 31 px at 1920x1080, 1280x720 and 1024x768); live has it at 1600x900 too (with a 64 px sideways shift). The picture is the same picture 36 px higher (the aeon's top 16 px from the frame's top, was 53; nothing cut); no sheet was made of it, and the scratch captures are `merged/` (`merged/braska-pair.jpg` is the two side by side).
- The pictures: headless Playwright from node on the real GPU (`PYREFLY_BROWSER=gpu`), seed 1, clocks frozen, so no frame-rate-timed check was made (a ComfyUI art run was using the GPU); the browser pane and Chrome were not used. Dev servers on 5201 (this branch), 5202 (the end-state config), 5233 (the switch-only config) and 5234 (the merged tree) were started by this lane and **stopped by their ports** at the end; no Vite or headless-Chromium process of this lane is left. (Port 5203 was held by someone else's server when the switch-only config was first tried there: its captures were discarded and the run redone on 5233.)

## Open and disclosed

- **For the driver and Bailey:** Chapter X's real size waits for the one line in `masters.ts` (the FFX-2 giants lane's folder). Say when the patch may be applied and the switch turned on; the numbers it gives are in the tables. **(Superseded by the repair: applied and on, by the brief of 2026-10-08 that asked for it; `masters.ts` is one hunk the FFX-2 lane's branch does not touch.)**
- **Judge the sizes by eye:** the aeon and the pagodas are floors, Flux's scale is 10 percent or more uncertain, the pagodas' hang and Mortiorchis's and Mortibody's shares are ours.
- **Links 2 to 4 of Chapter III:** the pagodas now tower over the possessed aeons and Yu Yevon (4.1 units, no pick). Whether those fiends scale is a decision for Bailey.
- **(Superseded by the repair: fixed by the pin at -4.3.)** **Chapter XVII at a 4:3 window (1024x768) is the one place anything stands nearer than live:** Genais, 0.04 nearer the nearest member and 0.18 nearer the party's centre, because live's solver puts him at x -1.30 there and a pin is one spot (-0.93). The other four shapes tested for this chapter (1600x900, 1280x720, 2560x1080 and the phone) are within 0.01 of live by the nearest member or further. The alternative, a pin at -1.30, is in the audit section; not done. Bailey's call.
- **Phone, Chapter XVII:** the Core stands 95 percent outside the slice (79 percent live), and the intent card covers 17 percent of Genais's box (3 percent live).
- **Numbers corrected after the commits:** the Chapter III scene comment and research text gave the aeon's distance from Auron as 9.46 (desktop) and 7.93 (phone); the captures say 9.55 and 7.97 (live 9.42 and 7.69). The Chapter I research text gave the `idle` rig as 0.65 higher, 2.0 back and 9.6 degrees before; the code says 0.62, 1.75 and 9.0. The commit message of e77a59c5 says 1.86 and 2.41 for the aeon (measured before the pin moved 0.45 back; 7c12ef1c has the final 1.82 and 2.34).
- **Commit trailers** say `Claude Sonnet 5.5` (the agent that wrote them), not the `Opus 5.5` line in the brief.
- The art is linked read-only from `D:/pyrefly-r39-int/public/art` into the worktree `D:/pyrefly-r3942-giants-ffx` (a junction, with `node_modules`); never `git worktree remove` it before removing both junctions with `cmd /c rmdir`.
- Not run: a deploy, a review workflow (`critic-plan` would class this as a presentation change across four FFX chapters; it needs a focused review before a deploy), the PCSX2 check beyond the sizes lane's.
