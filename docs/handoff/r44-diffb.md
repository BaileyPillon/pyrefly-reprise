# r44-diffb: Chapter XIII's move advisor follows the chapter's own line (DIFF-B, PR-0227)

Branch `r44-diffb-thumbs` (this note covers its first commit, 323a861b; the chapter board's thumbnails, the other approved change on the branch, are `docs/handoff/r44-thumbs.md`), built on `origin/r43-rc` 7b2582e7.
Approved by Bailey on 2026-10-12 at about 23:15 EDT ("I'll go with all of your recommendations", the driver's list item "DIFF-B: the Chapter XIII advisor change", decision 61c).
**Game case: FFX-2 only, Chapter XIII (Paragon, then Trema).** Chapters V and XV and every FFX chapter keep the card they had. No rule, boss, party, kit or timer number changes; no row is added to a menu; only the order of the card's rows does. Not deployed; nothing here is live.

## What the option was, and what is built

The options page (`critic/scratch/ffx2-difficulty-2026-10-12/index.html`, harness `critic/bench/r43/` of the scratch worktree `D:/pyrefly-r43-options`) measured two players of Chapter XIII at the house human pace: one presses the card's top row (45.5 %), one presses `intendedStrategy`, the chapter's own tactic on the live board, "the line" (63.5 %). They agree on 97.5 % of decisions; the rest are where the card loses its 18 points. DIFF-B is the second player: **on a Chapter XIII board the card's top row is the line**.

- `src/engine/tactics/advisor-line.ts` (new): `lineFirstOn(board, options)`. True only when `tacticFor(board)` is Chapter XIII's `ffx2Trema` (the lookup the line itself uses: game first, then the boss on the enemy side), the switch `ADVISOR_LINE_FIRST` is on, and no explicit look-ahead pick (`AdvisorOptions.lift`, advisor v4's) was passed.
- `src/engine/tactics/advisor.ts` (`buildAdvisorView`, about 20 lines): when `lineFirstOn`, (1) the tactic row is read off the **live** board, as the measured player and the auto-battler read it, not the board projected for a command in flight; (2) after every other re-ordering has run, the line's row, if it passes the same hard gate as always (`tacticRow`, `pressable`, `wastedRevive`), is put on top and `override` is cleared, so no row is described as "instead of the long plan". The second row is untouched: with a girl down and a non-raise on top, the raise still sits beneath with its caution.
- `AdvisorOptions.lineFirst` (measurement and tests only; the HUD never passes it) switches the rule on or off for one call, so one binary measures before and after (the cache is bypassed when it is passed). `ADVISOR_LINE_FIRST = false` is the whole change off in one edit.

Why the card left the line (30 seeds, 66 of 2,978 decisions, `critic/bench/r44-diffb/` diagnostic): the first family of rules whose removal alone gave the line back was the planner's re-orderings 45 times (the lethal-save override above all: a heal that saves a girl from the enemy's telegraphed hit goes over a line that attacks or presses Darkness; also the proved save, the revive priority, the race lift), advisor v3's 20 times (the projected board, which differs from the live one on 8 of the 66; and the drop of a heal while one is in flight), the proved save alone once. A line the actor cannot press (not offered, or aimed at someone the row cannot reach) still stays off the card: the ranking stands then.

## Re-measured on this branch (the options page's harness, 200 seeds, 1 to 200, 95 % Wilson intervals)

Pace "human": Wait with its split, 0.5 s on the top list with the clock running, 1.0 s held in a submenu (the house model). "Instant": no time on any menu. "Card before" is the card of r43-rc (`lineFirst: false`); "card after" is this build; "line" is `intendedStrategy` (the page's row).

| | | card before | **card after** | the line |
|---|---|---|---|---|
| **XIII** Paragon, Trema | human pace | 91/200 = 45.5 % (38.7 to 52.4) | **127/200 = 63.5 %** (56.6 to 69.9) | 127/200 = 63.5 % |
| **XIII** Paragon, Trema | instant decisions | 122/200 = 61.0 % (54.1 to 67.5) | **147/200 = 73.5 %** (67.0 to 79.1) | 147/200 = 73.5 % |
| V Vegnagun, Shuyin | human pace | 191/200 = 95.5 % (91.7 to 97.6) | 191/200 = 95.5 % | 187/200 = 93.5 % |
| XV Den of Woe | human pace | 200/200 = 100.0 % (98.1 to 100) | 200/200 = 100.0 % | 199/200 = 99.5 % |

- The before cells reproduce the options page to the seed (45.5 %, 61.0 %, 95.5 %, 100 %), so the harness and the base agree.
- **After the change the card plays the line exactly**: the outcome of every one of the 200 seeds equals the line's, at both paces. At human pace 56 seeds turn from a loss into a win and 20 from a win into a loss (net +36, +18.0 points); at instant decisions 39 and 14 (net +25).
- **Chapters V and XV are unchanged, not merely within noise**: all 200 result rows (outcome, links, decisions, minutes, menus closed, refused) are identical before and after, for both chapters.
- Agreement with the line: before, 66 of 2,978 decisions differ (2.2 %, 30 seeds; the page: 156 of 6,364); after, 0 of 6,024 (40 seeds).
- Raw rows: `D:/Tools/pyrefly-scratch/r44-results/m-A.jsonl`, `m-B.jsonl`, `m-C.jsonl` (3,600 runs); the compact record is `docs/handoff/r44-diffb-results.json`.

## Tests

`tests/unit/advisor-line-first.test.ts` (7): the gate (on for Chapter XIII's board and for no other listed chapter, FFX or FFX-2; switchable; a v4 lift is left on top); **the card's pick equals the line's pick in the decisions that differed** (seeds 1, 2, 3 and 7 played with the card that did not follow the line, so the run visits the boards where the two parted; at every one of more than 400 decisions the shipped card is the line, and the old card parted from it on 7); the line is read off the live board where the projected one differs (seed 7); a line the actor cannot press stays off the card; Chapters V and XV give a byte-identical card with the rule on and off at every decision of three seeds. The 13 advisor and guide files around it (227 tests) pass; `node tools/orphans.mjs` is unchanged (36).

## Reproduce

```
R44_JOBS='[{"chapter":"ffx2-trema","arm":"house","driver":"card","from":1,"to":200}]' R44_OUT=<file.jsonl> \
node node_modules/vitest/vitest.mjs run --maxWorkers=2 --config critic/bench/r44-diffb/vitest.config.ts critic/bench/r44-diffb/measure.test.ts
```
Drivers: `card`, `card-before`, `line`; `topMs`/`heldMs` 0 for instant. `disagree.test.ts` counts the decisions where the card's top row differs from the line (`R44_DIS_CH`, `R44_DIS_SEEDS`). The harness is the options page's, copied (`drivex.ts` and `disagree.test.ts` unchanged but for the header and the output folder); `npm test` does not include `critic/bench/`.

## Not done / for the driver

- Nothing deployed. The card's wording is unchanged; where the card now puts a plain attack over a heal that would have saved someone, the sentence under it describes the attack. That is the option as measured; whether Chapter XIII's guide should say "the card follows the line" is a copy question for Bailey.
- DIFF-C (ATB SPEED: FAST, with or without DIFF-B, 83.5 % on the page) was not part of the yes and is untouched.
