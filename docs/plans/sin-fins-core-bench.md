# Sin, Chapter XVII (the Fins and the Core): the bench at human pace (FFX only)

Package B of `docs/plans/sin-two-chapters-plan.md` §5 and REVIEW 13. **Game case: FFX only**
(`research/ffx-sin.md` §0.3: CTB, Cid's Trigger Command, the airship range, aeons, Armor and Mental Break).
Measured 2026-09-29 on branch `chapter-sin` (F, G, P and H merged, `e64ea2ee`). **Nothing was tuned**: no
boss number, no data row and no engine file was touched. The only files are tests, helpers and this note.

## Verdict

**Chapter XVII does not clear the project's 90 % bar as one chain, on either reading of "the intended line".**
The two candidates for the intended line are the research rows played as written ("sensible") and the move
advisor's top card (which plays the shipped tactic, `src/engine/tactics/sin-fins-core.ts`).

| Reading | Whole chain (links 1 to 3, carried) | Link 1 | Link 2 | Link 3 |
|---|---:|---:|---:|---:|
| Sensible, chain (each link on what the last left) | **13/200 (6.5 %)** | 200/200 | 200/200 | 13/200 |
| Sensible, each link rested | - | 200/200 (100 %) | 200/200 (100 %) | 157/200 (78.5 %) |
| Advisor card, chain | **1/200 (0.5 %)** | 190/200 | 83/190 (43.7 %) | 1/83 |
| Advisor card, each link rested | - | 190/200 (95 %) | 196/200 (98 %) | 165/200 (82.5 %) |
| Naive, chain and each link rested | 0/200 | 0/200 | 0/200 | 0/200 |

- **Links 1 and 2 clear the bar** for the sensible line (100 % each) and nearly for the card (95 % and 98 % rested).
- **Link 3 does not clear it even rested** (78.5 % and 82.5 %), and **the chain is far below it** (6.5 % and 0.5 %).
- **Naive loses clearly** (0/200 everywhere), as the plan asked. On the Fins it never wins because at FAR
  nobody in the opening three reaches the Fin: it Defends until the engine's 400-turn stalemate ends the fight.
- **What caps the chain is carry.** The sensible line wins link 3 78.5 % of the time on a rested party and 6.5 %
  on what links 1 and 2 leave. Every chain that reaches link 3 arrives with all seven members alive and a mean
  75 % HP (80 % for the card). A probe of the seam (seeds 1 to 3) showed the healers' and Auron's MP nearly spent
  as well.
- **The Core's counters end the sensible line's losses.** In link 3 they are the Core's four elemental counters
  (Fire, Blizzard, Thunder, Water); every action at the Core draws one on the front row (S-13, Gestahl's 100 %).
  The card's link-3 losses end on Genais's Sigh (see "Loss causes").
- **S-12 carries the chain.** With the wiki's Negation tunables off (a bound, not a proposal) the sensible chain
  is 91/200 (45.5 %) and the card's 29/200 (14.5 %). Rested link 3 moves only 78.5 to 84.5 % (sensible) and not at all
  for the card. Negation on also makes links 1 and 2 longer (413 engine turns per chain against 327 with it off),
  which is the likely route (the attrition the party carries into link 3); it was not traced further. It is a
  single-source formula with unclear units.
- **Length.** A sensible chain attempt is **413 engine turns** (131 + 145 + 138; a full clear 380) and 304 party
  actions; the card's is 436 (a full clear 490). Chapter III's first link is about 195. **The plan's estimate (§8 R2,
  "about 140 to 190 engine turns", and `sin-link4-bench.md`'s 133 party actions) was low by a factor of 2.2 (against
  its 190) to 2.9 (against its 140).**
  Each Fin alone (about 130 to 145 turns) is inside the project's longest line; the chain is about twice it.

What this is and is not: a report. Nothing here changes a boss, and the levers below are player-side options
for Bailey to weigh (rule 10: ideas need a yes), each measured once.

## Method

- **Engine and data:** the real FFX CTB engine and the chapter's own records (`sin-fins-core` from
  `getChapter`, `setupForChapter`, and for a chain the screen's own carry, `setupForNextLink`). Party:
  `sinFinsCoreBuild` (D-264's preset with Tidus's and Rikku's orders to Cid).
- **Seeds 1 to 200 per line, first try.** A chain uses `seed + link` for the next link, exactly as
  `drive.ts#runChapter` does. **Human pace equals bench speed**: CTB moves only on turns, so a slow player faces the
  same fight (`docs/plans/yojimbo-faithfulness-2026-09-26.md` §3).
- **Per link** means a rested start on that link (the build, full HP and MP, no statuses, `scripted` opening for
  links 2 and 3). **Chain** means links 1 to 3 in one run on the carried party state.
- **Reproduce it:** `PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-fins-core-bench.test.ts` prints
  every table here (about 17 minutes; the advisor line is the slow part). The link-4 bench is
  `PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-bench.test.ts`. **Without the variable a small
  smoke set runs in `npm test`** (4 seeds for XVII, 6 for XVIII), pinning only that every battle ends, that the
  switches do what they say, and that the advisor harness here agrees with `critic/bench/advisor-v3/drive.ts` (same
  decisions and links cleared on seeds 1 and 2).
- **Where the code is:** `tests/unit/helpers/sinFinsBench.ts` (the runner and the readings),
  `tests/unit/helpers/sinFinsPolicies.ts` (the lines), and the two test files.
- **What a loss is called:** `wipe:<ability>` names the action whose resolution KO'd the last standing member
  (a description, not the root cause: a Gravija leaves a quarter of everyone's HP and a later hit ends it);
  `escape` is the engine's 400-turn no-progress stalemate, kept as its own cause.
- **The pins** are only these: every battle ends in a victory, a defeat or the stalemate; the S-8, S-12 and seam
  switches do what they say; the advisor harness agrees with `drive.ts`. No target rate is pinned.

### The three lines

**Sensible** is research §8 rows 1 to 4, 6 and 9, as `sin-two-chapters-plan.md` §5 lists them.

- **Fins:** Tidus closes in, Auron casts Armor Break then Mental Break, Tidus pulls back (at most two trips a link);
  pull back when the core charges; at FAR only Wakka and Lulu reach, so they fire (Lulu drinks an Ether when dry);
  Yuna casts Protect on the centre member and Tidus casts Haste on one, both at FAR where Negation cannot strip them.
  A member who is not wanted in front swaps for one who is (a switch costs no turn).
- **Link 3:** Genais first, physicals only until it shells (a spell at it draws Waterga on the caster), then Lulu's
  Fire and the physicals into the shell, then Armor and Mental Break on the Core and everything at it.
- **Upkeep:** Phoenix Down on a KO, Soft on Petrify, Remedy on Confuse, Holy Water on Zombie, Curaga under 50 % with two
  hurt, Cura or a potion under 40 %. Overdrives are used when full.
- **Not modelled, named:** the Silence Grenade (it is not in the preset's bag, and Wakka's Silence Buster lasts a
  turn); row 5 (Bahamut through Gravija) and row 7 (Reflect against the Core's counters), which the brief left out.

**Naive** is the brief's line: Attack whatever is in reach and Defend otherwise; no orders to Cid, no Breaks, no
status care, no Overdrives; Curaga under 40 %; a Phoenix Down on a KO.

**Advisor card** presses the move advisor's top row each turn, the way `critic/bench/advisor-v3/scorecard.test.ts`
does (`buildAdvisorView` with the live options, then the first suggestion; the fallback Attack when there is none).
The advisor reads the process-wide content the game registers, so the bench calls `registerBattleContent()` first
(without it the card is empty and every Fin link stalls; the harness note is in the test).

**How the sensible line was settled (rule 15).** It was written from the rows and run once (chain 13/200, link 3
rested 167/200). Two refinement attempts followed, and each is kept as a labelled sensitivity rather than
folded in: a *top-up* (heal to 90 % in calm turns, 65 % once the Core acts) and a *careful* rest (at FAR, once a Fin is
under 15 % HP, stop hitting it and rotate every wounded member in through Yuna's Curaga). Neither moved the chain
(7 % and 3.5 %), so the method check is: the carry is the cap, not the line's care, and a third attempt would only
spend the healers' MP differently. A first version of the careful rest also rested at the top of link 3 and lost
every rested link-3 fight (Genais keeps hitting there), so link 3 is played as it comes.

## The numbers (200 seeds each)

### 1. Per link, a rested start on each

| Line | Link | Wins | Losses by cause | Mean turns | Mean party actions | Negation / fight | Gravija / fight (whiffs at FAR) | Genais shells / fight | Wins with Genais standing |
|---|---|---:|---|---:|---:|---:|---|---:|---:|
| sensible | 1 | 200/200 (100 %) | - | 130.6 | 99.1 | 2.1 | 0.9 (0.4) | - | - |
| sensible | 2 | 200/200 (100 %) | - | 129.1 | 98.5 | 2.7 | 1.2 (0.1) | - | - |
| sensible | 3 | 157/200 (78.5 %) | wipe:sin-core-blizzard 20, wipe:sin-core-fire 12, wipe:sin-core-water 7, wipe:sin-core-thunder 4 | 139.9 | 105.6 | 3.4 | 10.8 (0.0) | 1.0 | 0 |
| naive | 1 | 0/200 (0 %) | escape 200 | 400.0 | 303.0 | 0.0 | 0.0 (0.0) | - | - |
| naive | 2 | 0/200 (0 %) | escape 200 | 400.0 | 303.0 | 0.0 | 0.0 (0.0) | - | - |
| naive | 3 | 0/200 (0 %) | escape 132, wipe:sin-genais-sigh 62, wipe:defend 3, wipe:sin-core-blizzard 2, wipe:sin-core-fire 1 | 335.8 | 235.0 | 0.0 | 42.5 (0.0) | 1.1 | 0 |
| advisor card | 1 | 190/200 (95 %) | wipe:sin-fin-ram 10 | 249.5 | 161.7 | 2.6 | 5.4 (2.1) | - | - |
| advisor card | 2 | 196/200 (98 %) | wipe:sin-fin-smack 3, wipe:sin-fin-ram 1 | 242.4 | 159.7 | 3.1 | 5.8 (1.2) | - | - |
| advisor card | 3 | 165/200 (82.5 %) | wipe:sin-genais-sigh 30, wipe:sin-core-water 1, wipe:sin-core-thunder 1, wipe:sin-core-fire 1, wipe:sin-core-blizzard 1, escape 1 | 148.6 | 107.1 | 3.1 | 10.7 (0.0) | 1.3 | 0 |

- **Negation** is 2 to 3 a fight on the Fins and 3 in link 3. **Gravija** is about 1 a Fin fight for the sensible
  line (0.4 of them whiffed at FAR: the dodge worked) and 5 to 6 for the card, which stays NEAR longer (2.1 and 1.2
  whiffs a fight). In link 3 the Core fires about 11 Gravija a fight; none can whiff (no range).
- **Genais shells once a fight** (1.0 and 1.3). **No line ever won with Genais standing** (0 in every row).

### 2. The chain, and every switch both ways

| Line / switch | Chains won | Wins per link (of those that reached it) | Chains lost by cause | Mean turns per chain | Into link 3 |
|---|---:|---|---|---:|---|
| sensible: as built (FAR open, Negation on, build line-up) | 13/200 (6.5 %) | 200/200 → 200/200 → 13/200 | L3 wipe:sin-core-water 50, fire 44, thunder 41, blizzard 41, L3 escape 10, L3 wipe:sin-genais-sigh 1 | 413 (380 on a full clear) | 7.0 of 7 alive, mean 75 % HP |
| sensible: **S-8 NEAR open** | 18/200 (9 %) | 200/200 → 200/200 → 18/200 | L3 wipe:sin-core-thunder 50, fire 42, blizzard 42, water 33, L3 escape 8, L3 wipe:sin-genais-sigh 7 | 422 (390) | 7.0 of 7, 74 % |
| sensible: **S-12 Negation OFF** (a bound) | 91/200 (45.5 %) | 200/200 → 200/200 → 91/200 | L3 wipe:sin-core-water 28, blizzard 26, thunder 25, fire 25, L3 wipe:sin-genais-sigh 5 | 327 (319) | 7.0 of 7, 78 % |
| sensible: **seam, front row carries** | 16/200 (8 %) | 200/200 → 200/200 → 16/200 | L3 wipe:sin-core-thunder 44, blizzard 44, water 40, fire 37, L3 escape 14, L3 wipe:sin-genais-sigh 5 | 426 (403) | 7.0 of 7, 74 % |
| sensible: S-12 OFF and S-8 NEAR together | 93/200 (46.5 %) | 200/200 → 200/200 → 93/200 | L3 wipe:sin-core-fire 33, blizzard 33, water 19, thunder 18, L3 wipe:sin-genais-sigh 4 | 316 (313) | 7.0 of 7, 87 % |
| sensible: **the Core first** (row 6) | 0/200 (0 %) | 200/200 → 200/200 → 0/200 | L3 wipe:defend 96, wipe:sin-genais-venom 40, wipe:sin-genais-thrashing 27, and the Core's counters 37 | 399 (-) | 7.0 of 7, 75 % |
| sensible: top-up heals (sensitivity) | 14/200 (7 %) | 200/200 → 200/200 → 14/200 | L3 the Core's counters 162, wipe:sin-genais-sigh 16, escape 8 | 499 (423) | 7.0 of 7, 81 % |
| sensible: careful rest at FAR (sensitivity) | 7/200 (3.5 %) | 200/200 → 200/200 → 7/200 | L3 the Core's counters 156, wipe:sin-genais-sigh 23, escape 14 | 441 (384) | 7.0 of 7, 77 % |
| naive | 0/200 | 0/200 | L1 escape 200 | 400 | - |
| advisor card: as built | 1/200 (0.5 %) | 190/200 → 83/190 (43.7 %) → 1/83 | L2 wipe:sin-fin-ram 71, L3 wipe:sin-genais-sigh 49, L2 wipe:sin-fin-smack 35, L1 wipe:sin-fin-ram 10, L3 the Core's counters 29, L3 escape 4, L2 escape 1 | 436 (490) | 7.0 of 7, 80 % |
| advisor card: **S-8 NEAR open** | 8/200 (4 %) | 199/200 → 126/199 (63.3 %) → 8/126 | L2 wipe:sin-fin-ram 58, L3 wipe:sin-genais-sigh 58, L2 wipe:sin-fin-smack 15, L3 the Core's counters 45, L3 escape 11, other 4 | 468 (495) | 7.0 of 7, 78 % |
| advisor card: **S-12 Negation OFF** | 29/200 (14.5 %) | 200/200 → 198/200 → 29/198 | L3 wipe:sin-genais-sigh 90, L3 the Core's counters 74, L3 escape 5, L2 escape 2 | 326 (324) | 7.0 of 7, 90 % |
| advisor card: **seam, front row carries** | 0/200 (0 %) | 190/200 → 57/190 (30 %) → 0/57 | L2 wipe:sin-fin-ram 74, L2 wipe:sin-fin-smack 58, L3 wipe:sin-genais-sigh 49, L1 wipe:sin-fin-ram 10, other 9 | 432 (-) | 7.0 of 7, 79 % |

- **S-8 (open FAR or NEAR):** it moves nothing for the sensible line on the Fins (100 % either way) and only a
  little on the chain (6.5 % against 9 %). For the card it matters at link 2: rested, 98 % FAR against 88 % NEAR
  (link 1: 95 % against 99.5 %).
- **S-12 (Negation on or off):** the biggest lever in the table, and it is the least sourced (single source, unclear
  units). It is a bound: "off" is not a proposal.
- **The seam line-up (REVIEW 6):** both readings are within noise for the sensible line (6.5 % against 8 %). The
  card is worse when the front row carries (link 2: 30 % against 43.7 %); that was not traced.
- **Row 6, the Core while Genais stands:** 0/200 in this bench's version of the line. Only Wakka's swing reaches
  the Core (Lulu's magic is absorbed and the melee cannot reach), so in that line he swings alone at 36,000 HP while
  Genais's Venom and Thrashing wear the rest down (96 of the 200 wipes end on a Defend). Reported, not tuned.

### 3. Length against Chapter III's first link (about 195 engine turns)

| | Link 1 | Link 2 | Link 3 | Whole chain |
|---|---:|---:|---:|---:|
| Sensible (turns per attempt) | 131 | 145 | 138 | 413 (a full clear 380) |
| Advisor card | 250 | 164 | 74 (mostly a short, losing link 3) | 436 (a full clear 490) |
| The plan's estimate (§8 R2, `sin-link4-bench.md`) | - | - | - | 140 to 190 |

A single Fin is a normal-to-long fight (131 to 250 turns against 195). The chain is about **2.1 times** the
longest fight in the project. On the plan's own arithmetic the first pass (links 1 to 3 plus link 4's 75) is about
**490 engine turns**, not 215 to 265. That supports the split into two chapters (D-270) with a lot of room to spare,
and it puts the link-3 checkpoint (Q3) in play for XVII itself.

### 4. Per-link switches (a rested start on each link)

| Line | Switch | Link 1 | Link 2 | Link 3 |
|---|---|---:|---:|---:|
| sensible | as built | 200/200 (100 %) | 200/200 (100 %) | 157/200 (78.5 %) |
| sensible | S-8 NEAR | 200/200 (100 %) | 200/200 (100 %) | n/a (no Fin) |
| sensible | S-12 OFF | 200/200 (100 %) | 200/200 (100 %) | 169/200 (84.5 %) |
| advisor card | as built | 190/200 (95 %) | 196/200 (98 %) | 165/200 (82.5 %) |
| advisor card | S-8 NEAR | 199/200 (99.5 %) | 176/200 (88 %) | n/a (no Fin) |
| advisor card | S-12 OFF | 200/200 (100 %) | 200/200 (100 %) | 165/200 (82.5 %) |

### 4b. The Core's unsourced counter tunables (REVIEW 8), link 3 rested

| Line | Switch | Link 3 wins |
|---|---|---:|
| sensible | as built (100 % before and after Genais dies; an absorbed spell draws it) | 157/200 (78.5 %) |
| sensible | counter chance before Genais dies 50 % | 157/200 (78.5 %) |
| sensible | an absorbed spell draws no counter | 157/200 (78.5 %) |
| advisor card | as built | 165/200 (82.5 %) |
| advisor card | counter chance before Genais dies 50 % | 165/200 (82.5 %) |
| advisor card | an absorbed spell draws no counter | 165/200 (82.5 %) |

Neither switch changes a win count: the sensible line never targets the Core before Genais falls (physicals at
Genais, then the Core), and the card does so only when it can hit it. That is a measurement of the lines, not proof
the tunables are free: they only matter to a player who attacks the Core early (row 6, which loses regardless).
The loss causes at 50 % move a little for the card (Sigh 30 to 28; the counters 3 to 6).

### 5. Aeon reach at FAR (REVIEW 13)

Yuna summons the aeon on her first turn of link 1 and the rest of the party Defends; the aeon presses an Overdrive,
then an Attack, then an ability, when one reaches the Fin, and Defends when none does. Five seeds per row, with the
aeon's gauge as the preset has it (50 to 70) and with the bench filling it once. Rows are counted over every aeon
decision (Attack, ability and Overdrive rows offered; then those enabled and able to name the Fin).

| Aeon | Ship | Gauge | Aeon decisions | Rows offered | Enabled and reaching the Fin | Links won |
|---|---|---|---:|---|---|---:|
| Valefor | FAR | preset / filled | 895 / 890 | Attack, ability (and Overdrive once filled) | **none** | 0/5, 0/5 |
| Valefor | NEAR | preset / filled | 8 / 11 | the same | every one (Overdrive on 3 of 8 with the preset gauge, on all 11 once filled) | 0/5, 0/5 |
| Ifrit | FAR / NEAR | preset / filled | 850 / 845 (FAR), 12 / 16 (NEAR) | the same | FAR none; NEAR every one | 0/5 each |
| Ixion | FAR / NEAR | preset / filled | 806 / 801 (FAR), 11 / 10 (NEAR) | the same | FAR none; NEAR every one | 0/5 each |
| Shiva | FAR / NEAR | preset / filled | 1006 / 1001 (FAR), 8 / 9 (NEAR) | the same | FAR none; NEAR every one | 0/5 each |
| Bahamut | FAR / NEAR | preset / filled | 895 / 890 (FAR), 17 / 17 (NEAR) | the same | FAR none; NEAR every one | 0/5 each |

- **At FAR no aeon reaches a Fin with anything**: not the Attack (physical), not the ability rows, not the
  Overdrive even with a full gauge. The aeon sits through the 400-turn stalemate (about 850 to 1,000 decisions).
- **At NEAR everything reaches**, and an aeon left to fight alone is gone within 8 to 17 decisions over five seeds
  (the Fin's Ram and Gravija take it, not traced; the party only Defends and is then wiped): 0 links won in every
  row. Whether an aeon plus the party wins faster is the sensible line's question and is not modelled here.
- **§7.2 says guides summon Bahamut on the Fins.** The engine says that can only be at NEAR. That is unreconciled;
  the plan's Q list should name it (REVIEW 13). Across every sweep above the lines themselves summoned four times at
  FAR (274 aeon decisions, none with a row that reaches).
- The bench filling the gauge is a probe, not a play line; the preset's gauges are 50 to 70.

## Loss causes, in words

- **The sensible line's only losses are in link 3, and they end on the Core's counters.** After Genais falls the
  Core runs its free cycle and every swing at it draws Fire, Blizzard, Thunder or Water on the front row (about 400
  to 600 each in the traces read, S-13). In the turn-by-turn read of chain seed 6 the party is at a quarter of its HP
  after each Gravija (75 % of current HP, 10.8 a fight) and the counters and the next Gravija finish it. The chains
  that end in `escape` (10 of 200, 5 %) are the same fight with no new low in the Core's HP in 400 turns.
- **The card's link-3 losses end on Genais's Sigh** (30 rested, 49 in the chain): the last action before the wipe.
  Sigh is a party-wide magical hit with Darkness, and it lands while the party is low from Gravija and the shell's
  Cura fight. That is the last action, not a proven root cause.
- **The card's Fin losses are Ram and Smack** (10 at link 1; 71 and 35 at link 2 in the chain). It takes more Gravija
  a Fin fight than the sensible line (5.4 and 5.8 against 0.9 and 1.2) and carries that damage into the next link.
- **`escape`, the 400-turn stalemate,** is its own cause (naive: every Fin fight; a few link-3 chains for the others).

## What the plan asked to be reported

- **Wins and losses by cause, turns against Chapter III, Negation and Gravija counts, Gravija whiffs at FAR:** the
  tables above.
- **Survivors into link 3:** every chain that reached it had all seven alive (revives carry) at a mean 75 % HP
  (sensible), 80 % (card), 74 to 90 % under the switches. Auron's and Lulu's Overdrive gauges are usually full at the
  seam and the MP of Yuna, Auron and Lulu low (a probe of seeds 1 to 3): the carry is the cost, not the roster.
- **Genais shells and wins with Genais standing:** once a fight, and never a win with it standing.
- **S-8, S-12, S-1:** S-8 and S-12 above. S-1 (the 13th or the 12th turn) is link 4's, and the link-4 bench prints it
  for all three lines (`PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-bench.test.ts`):

  | Line | Giga-Graviton turn | Wins |
  |---|---:|---:|
  | sensible | 13 / 12 | 62/200 (31 %) / 7/200 (3.5 %), unchanged |
  | naive | 13 / 12 | 0/200 / 0/200, unchanged |
  | advisor card | 13 / 12 | **44/200 (22 %) / 4/200 (2 %)** |

## Options, if the numbers are to move (Bailey's to weigh; nothing here is built)

Each was measured above. The first is the only one that moves the chain by itself.

1. **A checkpoint at link 3 (Q3),** so a loss or a clear of links 1 and 2 does not carry: the rested link-3 rate is
   78.5 % (sensible) and 82.5 % (card). It is still under 90 %.
2. **Confirming S-12** (the Negation formula) against the game: "off" lifts the sensible chain from 6.5 % to 45.5 %.
3. **An aeon line** (an aeon takes the Core's Gravija and the counters that the front row takes now). The bench
   shows aeons do nothing to a Fin at FAR (section 5), so it would be a link-3 line, and it is not built.
4. **Listing XVII with its difficulty disclosed,** as the plan already offers for XVIII.

The link-4 numbers (31 % and 3.5 %) are unchanged and are in `sin-link4-bench.md`.

## Open, and not built

| # | Item | What it means for these numbers |
|---|---|---|
| S-12 | Negation's formula is single-source with unclear units | It carries the chain (6.5 % to 45.5 % when off). The guide labels it. |
| S-13 | The Core's counter chance before and after Genais dies, and whether an absorbed spell draws it | No win count changes; the lines rarely hit the Core early. Gestahl's "100 %" after Genais dies is the default. |
| S-8 | The Fins open FAR (Gestahl, GameFAQs) | Moves the card's link 2 (98 % against 88 %), not the sensible line's. |
| Q16 | The seam line-up | Both readings measured; within noise for the sensible line. Our estimate stays the build's. |
| REVIEW 13 | Aeons at FAR | Aeons reach nothing at FAR (attack, ability and Overdrive rows are all off); the guides' Bahamut on the Fins would have to be NEAR. Unreconciled with §7.2. |
| — | The sensible line does not use aeons or the Silence Grenade | It understates a player who plans an aeon finish or silences Genais. |
| — | The "careful" and "top-up" sensitivities are two attempts, not the best line | The carry is the cap, not the care; a third attempt was not made. |
