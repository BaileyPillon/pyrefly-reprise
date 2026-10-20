# r59-advisor-line: the move advisor stops recommending a losing line (FFX), and the continuity check knows a front view

Branch `r59-fixes`. Decisions 145 (the card) and 146 (the head measure), driver picks delegated under Bailey's 2026-10-19 "i'll go with all of your recommendations" and his 2026-09-18 criticism of "advisor errors". Not deployed; no review run.
**Game case.** The card change is **FFX only** (FFX Chapter XIV and the Mirror Aeons chapter; FFX-2 Chapter XIII keeps DIFF-B's, `r44-diffb.md`). The head measure is **both games** (review tooling).

## 1. The card (decision 145)

### What was wrong
The measurement (`critic/bench/r59-advisor/sweep.ts`, one node process, 40 seeds a chapter, the card's first row pressed every turn on the engine against `intendedStrategy`, the chapter's tactic) found three separate causes in FFX Chapter XIV (Isaaru via Purifico; 13 of 40 won against the tactic's 35):

1. **The card did not follow the line.** It was the simulated ranking (it spent Yuna's full Grand Summon gauge on a lesser aeon; Bailey's 2026-09-21 ruling is that the ranking may outrank the guide, so this stays true everywhere the ranking was not losing).
2. **The card did not name the aeon of a Grand Summon.** The line is "Grand Summon: Shiva"; the row the card printed was "Grand Summon" with no aeon and the command carried none, so a player (and the review route, which picks the picker row the card's text names) got the picker's default, Valefor. With only (1) fixed the card still won 14 of 40.
3. **The line read off the state is not the line the auto-battler plays.** Chapter XIV's Shield timing asks the engine's CTB forecast (`predictTurnOrder`); the card reads the line on a state-only engine, where the forecast is missing, so 10 of 298 picks (8 seeds) differed (Shiva's first turn: Shield instead of Diamond Dust). It did not change the win count (35 of 40 either way) but the card was not the tactic's move.

### What changed
- `src/engine/tactics/advisor-line.ts`: `LINE_FIRST_CHAPTERS = ['ffx2-trema', 'isaaru-via-purifico', 'mirror-aeons']`, read from the tactic registry; `lineFirstOn` is no longer FFX-2 only. A chapter is added only when the card wins clearly less than the line over a seed-paired sweep (below), not because it has a tactic. The line's row goes on top over every re-ordering of the ranking (DIFF-B's rule); where the tactic names nothing the actor can press the ranking stands. An explicit look-ahead pick (advisor v4's `lift`) still goes on top of any card.
- `advisor.ts`: `AdvisorOptions.lineEngine` (a read-only engine handle, used only to read the line on a line-first board, only when its event counter equals the card's board); `grandSummonLabel` (a named Grand Summon is carried as the tactic composed it and printed `Grand Summon: Shiva`, line-first boards only). `guide.ts#recommendedCommand` takes the optional engine.
- `FFXBattleHud.setLineEngine` (called by `createHud`; `MoveAdvisor.setAdvisorOptions`) and `advisorV4/core.ts` (the worker's restored engine) hand the engine over. `critic/bench/advisor-v3/drive.ts#liveAdvisorOptions` mirrors the HUD. The review route keeps reading the card: `route-pure.mjs#rowLabelOf` turns "Grand Summon: Shiva" into the menu row "Grand Summon" (the aeon is then picked in the list from the card's text, as before).
- Nothing else about the card moves: scoring, sentences, the second row, every other chapter. 160 listed-chapter runs and 90 hidden-chapter runs outside the set were replayed with the code after the change and are identical (outcome, links, decisions) to the code before it.

### The sweep (40 seeds, seeds 1 to 40; "card before" is the card with the rule off, `lineFirst: false`, so one binary measures both; "the tactic" is `intendedStrategy` on the live engine; the card is the plain follower, no look-ahead)
| chapter | game | card before | card after | the tactic | card after vs tactic (paired: only card / only tactic, exact sign test p) |
|---|---|---:|---:|---:|---|
| I Seymour Flux | FFX | 40 | 40 | 40 | 0 / 0 |
| II Yunalesca | FFX | 35 | 35 | 37 | 2 / 4, p 0.69 |
| III Braska's Final Aeon | FFX | 39 | 39 | 39 | 0 / 0 |
| IV Bahamut | FFX-2 | 40 | 40 | 40 | 0 / 0 |
| V Vegnagun, Shuyin | FFX-2 | 40 | 40 | 40 | 0 / 0 |
| VI Leblanc | FFX-2 | 40 | 40 | 39 | 1 / 0 |
| VII Macalania | FFX | 36 | 36 | 39 | 1 / 4, p 0.38 |
| VIII Evrae | FFX | 40 | 40 | 39 | 1 / 0 |
| IX Yojimbo | FFX | 40 | 40 | 39 | 1 / 0 |
| X Natus | FFX | 40 | 40 | 38 | 2 / 0 |
| XI Fallen Aeons | FFX-2 | 40 | 40 | 40 | 0 / 0 |
| XII Omnis | FFX | 40 | 40 | 38 | 2 / 0 |
| XIII Trema | FFX-2 | 23 | 23 | 23 | 0 / 0 (DIFF-B on in both columns after; the card now equals the line) |
| **XIV Isaaru via Purifico** | **FFX** | **13** | **35** | 35 | **0 / 0** |
| XV Den of Woe | FFX-2 | 40 | 40 | 37 | 3 / 0 |
| XVI Ixion at Djose | FFX-2 | 40 | 40 | 40 | 0 / 0 |
| XVII Sin: Fins and Core | FFX | 34 | 34 | 36 | 1 / 3, p 0.63 |
| XVIII Sin: Face | FFX | 40 | 40 | 40 | 0 / 0 |
| **Mirror Aeons** | **FFX** | **3** | **9** | 24 | 0 / 15 (see "for the driver") |
Hidden chapters (40 seeds, card before against the tactic; the card after is the same code path, 90 runs checked identical): Leblanc preview 40 / 39, the Experiment (FFX-2) **40 / 18**, Sinspawn Gui 40 / 40, Fayth 40 / 39, Tourist Trap 40 / 39, Valefor at Besaid 40 / 40, Biran and Yenke 40 / 40, Angra Mainyu 38 / 39, Last Summoning 40 / 40.

### What the player sees in the browser (FFX shows advisor v4's look-ahead on top of the card)
`card-v4` runs the v3 card, then v4's search at the shipped `mini` budget and the lifted card, in process, as `advisorV4/core.ts` does. Chapter XIV, 40 seeds: **27 of 40 before, 39 of 40 after** (v4 was already rescuing some of the lost boards; the tactic wins 35). Mirror Aeons, 10 seeds: see section 3.

### Ablations (Chapter XIV, 40 seeds)
Rule on, aeon named, line read on the state alone (no engine handle): 35 of 40 (so the engine handle changes the picks, not the count). Mirror Aeons: card alone 3 before, 9 after; with the line played wherever the card is silent (Yojimbo's and the Magus Sisters' menus print no card, `advisor-aeons.ts`, by design: the payment screen needs Bailey's mockup) 14 before, **24 after = the tactic's 24**.

### For the driver
- **Mirror Aeons**: the remaining gap (9 against 24 as a plain follower) is the silent card on Yojimbo's and the Sisters' menus, where the line pays Yojimbo and orders the Sisters. That is the decision recorded in `advisor-aeons.ts` (a new screen needs its mockup and Bailey's word); not touched.
- **The Experiment (FFX-2 hidden chapter)**: the card wins 40 of 40 and the tactic (the auto-battler, and so the guide's NEXT line) only 18 of 40. The ranking is right and the line is the weak one; nothing to do on the card. A tactic refit is a chapter-lane job.
- **Chapter XIII (Trema)**: on this build the card with DIFF-B's rule off wins 23 of 40, as the line does (release 44 measured 91 of 200 against 127 of 200); with the rule on, card and line agree seed for seed. DIFF-B stays on; it no longer moves the count at 40 seeds. Not investigated why (the build changed since; the per-command action time of r56 is one candidate).
- **First card of a battle**: with the rule on or off, the first card built on a battle's first menu differs from the second built on the same board (Chapter VII seed 1, Rikku: Steal, then Petrify Grenade; identical at the commit before this change, checked on a `git archive` copy). Not investigated; the sweeps take the first card, as the HUD does.

### Tests
`tests/unit/advisor-line-first-ffx.test.ts` (new: the gate, the card is the line at every decision of 3 seeds played with the old card, Chapter XIV 3 of 10 before and at least 8 of 10 after, four other chapters unchanged with the rule on and off), `advisor-line-first.test.ts` (the gate list), `advisor-v4-worker.test.ts` (the worker's card names the aeon), `ui-move-advisor.test.ts` (`setLineEngine`), `r29-text.test.ts` (the Chapter XIV card's label is now `Grand Summon: Shiva`), `critic-route-harness.test.ts` (`rowLabelOf`).

## 2. The head measure (decision 146)
The continuity check compared a rig's `head` part between two keys. Lulu's `defend` and `od-fury` draw a front-view upper body (`fdef`, `fod`; `front` in format v2) and shrink the side head to 0.8, so the mesh read **0.80 going in and 1.25 coming out** (a 25 percent head jump; four changes of key in a fight). Now:
- the page-side reader names the head variant part drawn at a real size (`rg.hv`; `continuity.rig.headVariants`, `variantMinArea` 0.02 of the idle plane: a version 1 rig stores the part as an always-visible speck of 0.0009, drawn it is 0.24);
- a change of key whose two ends do not show the same head is `metric: 'variant'`: no mesh ratio, judged by the head the registration gives the key (`docs/target/pose-measure.json`, `ruled.headRatio`, handed to `analyzeRun` as `measure`) against the key's class band (0.85 to 1.15);
- measured on the five shipped rigs' own `rig.json`, every key played (`critic-continuity-rig-real.test.ts`): Lulu **defend 0.959, od-fury 1.029** (inside the band, no head failure; before 0.80 and 1.25 FAIL); her other keys keep the one head part and are read by the mesh as before (cast, critical, item, victory, ready, sleep and ko still read 3 to 14 percent, reported). **Kimahri's follow key still FAILS CHK-026 on its height, 1.2885 of the idle's (stature-high; PR-0462, spear bone scale 1.327), with or without the registration records**; the refit stays the rig lane's.
- Details: `critic/CHECKS.md` CHK-026 R59-D146, `critic/runner/lib/README.md`.

## 3. Mirror Aeons through advisor v4 (browser flow)
Seeds 1 to 10, `card-v4` against `card-before-v4`, the plain follower (it presses Attack where the card is silent): **1 of 10 before, 4 of 10 after** (the tactic wins 7 of the same ten, and 24 of 40). The gap that is left is the silent aeon menus, as above.

## Reproduce
```
node --experimental-transform-types --disable-warning=ExperimentalWarning critic/bench/r59-advisor/sweep.ts \
     --chapters=isaaru-via-purifico --drivers=card-before,card,line,card-v4,card-before-v4 --from=1 --to=40 --out=<file.jsonl>
```
Drivers: `card`, `card-before`, `line`, `card-state-line`, `card-or-line`, `card-before-or-line`, `card-v4`, `card-before-v4`; `--chapters=hidden` for the hidden experiments. Plain node, one process, resumable. Raw rows of this note: `D:/Tools/pyrefly-scratch/2026-10-19/r59-advisor/` (`before40.jsonl`, `after-all.jsonl`, `hidden40.jsonl`, `abl40.jsonl`, `v4-isaaru.jsonl`).
