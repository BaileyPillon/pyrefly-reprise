# Sin, Chapter XVII (the Fins and the Core): the bench at human pace (FFX only)

Package B of `docs/plans/sin-two-chapters-plan.md` §5 and REVIEW 13. **Game case: FFX only**
(`research/ffx-sin.md` §0.3: CTB, Cid's Trigger Command, the airship range, aeons, Armor and Mental Break).
Measured 2026-09-29 on branch `chapter-sin` (F, G, P and H merged, `e64ea2ee`), and re-measured the same morning
after the link-3 cause was found. **Nothing was tuned**: no boss number and no data row changed. The re-run follows
two fixes (the bench line's dry Auron; the status carry's Max HP x2 and SOS, `BattleScreenSetup.ts`), CHECK 2's
liveness fix (`ticks.ts`, link 3 only) and the link-3 checkpoint switch, built OFF.

## Verdict

**Re-measured 2026-09-29 (~05:00 to 07:00 EDT) after the link-3 cause was found and two defects were fixed.** The
first run (13/200 for the sensible chain, 1/200 for the card) is in git history at `e76c7d0e`. See "Link 3, rested
against carried" below for the cause.

**Chapter XVII still does not clear the project's 90 % bar as one chain, on either reading of "the intended line".**
The two candidates for the intended line are the research rows played as written ("sensible") and the move advisor's
top card (which plays the shipped tactic, `src/engine/tactics/sin-fins-core.ts`).

| Reading | Whole chain (links 1 to 3, carried) | Link 1 | Link 2 | Link 3 |
|---|---:|---:|---:|---:|
| Sensible, chain (each link on what the last left) | **51/200 (25.5 %)** (was 13/200) | 200/200 | 200/200 | 51/200 |
| Sensible, each link rested | - | 200/200 (100 %) | 200/200 (100 %) | 162/200 (81 %) (was 78.5 %) |
| Advisor card, chain | **6/200 (3 %)** (was 1/200) | 190/200 | 85/190 (44.7 %) | 6/85 |
| Advisor card, each link rested | - | 190/200 (95 %) | 196/200 (98 %) | 166/200 (83 %) |
| Naive, chain and each link rested | 0/200 | 0/200 | 0/200 | 0/200 |

- **Links 1 and 2 clear the bar** for the sensible line (100 % each) and nearly for the card (95 % and 98 % rested).
- **Link 3 does not clear it even rested** (81 % and 83 %), and **the chain is far below it** (25.5 % and 3 %).
- **Naive loses clearly** (0/200 everywhere). On the Fins nobody in its opening three reaches the Fin at FAR, so it
  Defends into the engine's 400-turn stalemate.
- **What still caps the chain is the carry, and it is faithful:** links 1 and 2 spend the X-Potions (10 in the bag, 0.1
  left on average) and most of Auron's and Lulu's MP. Refilling the X-Potions alone at the seam takes carried link 3 from
  25.5 % to 62.5 %; refilling items and MP together takes it to 76 % (rested: 81 %). HP, statuses, Overdrive gauges and
  aeons do not matter, and nothing leaks across the seam (see below).
- **The Core's counters still end the sensible line's losses** (every action at the Core draws Fire, Blizzard, Thunder or
  Water on the front row, S-13). The card's link-3 losses end mostly on Genais's Sigh.
- **S-12 is still the biggest lever and the least sourced:** with the Negation tunables off (a bound, not a proposal) the
  sensible chain is 88/200 (44 %) and the card's 93/200 (46.5 %).
- **Length:** a sensible chain attempt is **380 engine turns** (131 + 139 + 110; a full clear 382); the card's 467
  (a full clear 487). Chapter III's first link is about 195; the plan's estimate was 140 to 190.
- **The link-3 checkpoint** (built OFF, `SIN_LINK3_CHECKPOINT`, an adaptation): it does **not** raise the chance of
  winning within 3 or 5 attempts for the sensible line (57 % and 74.5 % against 55.5 % and 76 %), because a retry
  replays the same spent party; it **halves the time** to a win (531 engine turns against 948). For the card it adds
  a little (13.5 % against 11.5 % within 5). Section 7.

What this is and is not: a report. Nothing here changes a boss, and the levers below are player-side options
for Bailey to weigh (rule 10: ideas need a yes), each measured once.

## Link 3, rested against carried: the cause (2026-09-29)

**The puzzle:** the sensible line won link 3 78.5 % of the time from a rested start and 6.5 % when carried, although
every chain arrived with 7/7 alive at a mean 75 % HP.

**What was dumped** (seeds 1 to 20, the setup and the state at link-3 entry, carried against rested; scratch probe
`tests/unit/zz-scratch/zz-l3-cause.test.ts`, data in `D:/Tools/pyrefly-scratch/overnight-0929/sin-l3/`):

- **Identical on every seed:** every `state.flags` key and value at entry (`sin.genais.*`, `sin.core.*` start at
  `step 0`, `inactive`, `counterStep 0`, `down false`; no `airship.*`, no `sin.fin.*`, no `sin.turn*` left behind),
  Genais and the Core (20,000 and 36,000 HP, no statuses), the five aeons (HP, MP, gauges, no statuses), the front row
  (Tidus, Yuna, Auron) and no aeon on the field. The same carried setup on a fresh engine and on the chain's reused
  engine gives the same results (3/40 both).
- **Different:** HP (7/7 alive, several members under half), statuses (only `critical`, Haste and Protect carried),
  Overdrive gauges (mostly higher than the preset), **MP** (mean Auron 8 of 100, Lulu 117 of 300, Yuna 227 of 320) and
  **items** (mean X-Potions 0.1 of 10, Hi-Potions 9.3 of 20, Ethers 1.0 of 3; Phoenix Downs 9.8 of 10, Turbo Ethers 2 of
  2, Mega-Phoenixes 2 of 2 untouched).

**First finding, a bench-line defect (fixed): the line Defended a dry Auron for the rest of link 3.** Armor Break and
Mental Break cost 12 MP; links 1 and 2 leave Auron at 4 to 16. The line's Core phase was "Armor Break, else Defend",
then "Mental Break, else Defend", so on a carried party Auron cast one Break at most and then Defended every turn
(seed 4: 30-odd Defends in a row into the stalemate) with two Turbo Ethers in the bag. Rested, he has 100 MP and the
defect never shows. It is exactly "a policy that behaves differently on carried state". Fixed in
`tests/unit/helpers/sinFinsPolicies.ts` (`breakRow`: short of 12 MP he drinks an Ether, Turbo Ether or Elixir; with
nothing to drink he swings), pinned by a smoke test on the carried seam. **Effect: the sensible chain 13/200 (6.5 %) →
51/200 (25.5 %); rested link 3 78.5 % → 81 %.**

**What is left is faithful attrition** (research §1.2 `[verified: 3 sources]`: HP, MP, statuses and gauges carry, and
spent items stay spent). One factor of the carried entry set back to the rested build at a time, 200 seeds, same
link-3 seed (`PYREFLY_SIN_BENCH=1`, section 6 of the bench):

| Link-3 entry | Link 3 wins |
|---|---:|
| carried as is | 51/200 (25.5 %) |
| HP refilled | 62/200 (31 %) |
| statuses as rested | 41/200 (20.5 %) |
| Overdrive gauges as rested | 46/200 (23 %) |
| aeons as rested | 51/200 (25.5 %) |
| Ethers refilled | 51/200 (25.5 %) |
| MP refilled | 78/200 (39 %) |
| items refilled | 111/200 (55.5 %) |
| **X-Potions refilled** (only) | **125/200 (62.5 %)** |
| items and MP refilled | 152/200 (76 %) |
| the rested build (all of it) | 162/200 (81 %) |

- **The X-Potions are the largest single factor**: the line's non-Yuna members heal with an X-Potion under 40 % HP, and
  links 1 and 2 use all ten. Link 3's Core fight (about 11 Gravija a fight, each to a quarter of current HP, and a
  counter on every swing) is where the party needs them. MP is the second (Yuna's Curaga, Lulu's Fire into the shell,
  Auron's Breaks). Together they close most of the gap (76 % against 81 %).
- **Before the line fix** the same A/B read (40 seeds): carried 3/40, Auron's MP alone 10/40, items and MP 32/40,
  rested 35/40. The Auron defect sat on top of the same attrition.
- **Verdict: FAITHFUL** for what remains. The party really spends what the research says it carries. Nothing is tuned.
  Whether a real player spends fewer X-Potions on the Fins (Yuna's Curaga at FAR costs MP instead) is a line
  question; the two recorded sensitivities that heal differently (top-up 25 %, careful 15 %) do not beat the plain
  line.

**Second finding, a carry defect (fixed; FFX only, Sin links 2 and 3):** the status carry copied **Max HP x2** (a
Stamina Tonic) without the ceiling it had raised, so a carried Tonic sat on the base max HP (the HP above it clamped
away), and when it came off (a KO) the engine halved the **base**: the card's seed 23 revived Tidus at 1,623 of 3,246
instead of 6,492. The carry now takes the live doubled ceiling with the status (`BattleScreenSetup.carriedFfxState`), and
derives the SOS status (`critical`) from the carried HP, as it does KO, so the setup has nothing to correct: a fresh
engine (a checkpoint retry builds one) threw on the old carried state. Tests: `sin-carry.test.ts` (6). **Effect: the
card's chain 1/200 → 6/200, and the card with S-12 off 29/200 → 93/200** (the card drinks Stamina Tonics; the sensible
line never does, so its numbers are unchanged by this fix).

**Third, noticed while proving it (not changed; shared FFX plumbing, pre-existing):** `FFXEngine.init` builds the battle
before it keeps the new context, so an event the setup emits (an SOS add or remove) goes to the **previous** battle's
log on a reused engine and throws on a fresh one. With the carry now consistent the setup emits nothing on any carried
state measured (200 sensible and 18 card entries on a fresh engine: 0 throws).

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
rested 167/200). **2026-09-29: a third fix, a defect rather than a refinement:** a dry Auron Defended out link 3 instead
of drinking for his Breaks ("Link 3, rested against carried"); fixed, it moved the chain to 51/200. Two refinement attempts followed, and each is kept as a labelled sensitivity rather than
folded in: a *top-up* (heal to 90 % in calm turns, 65 % once the Core acts) and a *careful* rest (at FAR, once a Fin is
under 15 % HP, stop hitting it and rotate every wounded member in through Yuna's Curaga). Neither moved the chain
(7 % and 3.5 %), so the method check is: the carry is the cap, not the line's care, and a third attempt would only
spend the healers' MP differently. A first version of the careful rest also rested at the top of link 3 and lost
every rested link-3 fight (Genais keeps hitting there), so link 3 is played as it comes.

## The numbers (200 seeds each; re-measured 2026-09-29 after the line and carry fixes, as the bench prints them)

Sections 1 to 4b are the bench's own output (`PYREFLY_SIN_BENCH=1`), pasted as printed. Section 5 did not change (it
plays its own probe line on link 1). The first run's condensed tables are in git history (`e76c7d0e`).

### 1. Per link (a rested start on each link, first try)
| Line | Link | Wins | Losses by cause | Mean turns | Mean party actions | Negation / fight | Gravija / fight (whiffs at FAR) | Genais shells / fight | Wins with Genais standing |
|---|---|---:|---|---:|---:|---:|---|---:|---:|
| sensible | 1 | 200/200 (100 %) | - | 130.6 | 99.1 | 2.1 | 0.9 (0.4) | - | - |
| sensible | 2 | 200/200 (100 %) | - | 129.1 | 98.5 | 2.7 | 1.2 (0.1) | - | - |
| sensible | 3 | 162/200 (81 %) | wipe:sin-core-blizzard 19, wipe:sin-core-fire 10, wipe:sin-core-water 5, wipe:sin-core-thunder 4 | 138.3 | 104.4 | 3.4 | 10.7 (0.0) | 1.0 | 0 |
| naive | 1 | 0/200 (0 %) | escape 200 | 400.0 | 303.0 | 0.0 | 0.0 (0.0) | - | - |
| naive | 2 | 0/200 (0 %) | escape 200 | 400.0 | 303.0 | 0.0 | 0.0 (0.0) | - | - |
| naive | 3 | 0/200 (0 %) | escape 135, wipe:sin-genais-sigh 62, wipe:defend 3 | 342.2 | 236.3 | 0.0 | 45.1 (0.0) | 1.1 | 0 |
| advisor card | 1 | 190/200 (95 %) | wipe:sin-fin-ram 10 | 249.5 | 161.7 | 2.6 | 5.4 (2.1) | - | - |
| advisor card | 2 | 196/200 (98 %) | wipe:sin-fin-smack 3, wipe:sin-fin-ram 1 | 242.4 | 159.7 | 3.1 | 5.8 (1.2) | - | - |
| advisor card | 3 | 166/200 (83 %) | wipe:sin-genais-sigh 30, wipe:sin-core-water 1, wipe:sin-core-fire 1, wipe:sin-core-blizzard 1, escape 1 | 149.8 | 108.1 | 3.1 | 10.8 (0.0) | 1.3 | 0 |

### 2. The chain (links 1 to 3 on the carried state) and the switches, both ways
| Line / switch | Chains won | Wins per link (of those that reached it) | Chains lost by cause | Mean turns per chain | Into link 3 |
|---|---:|---|---|---:|---|
| sensible: as built (FAR open, Negation on, build line-up) | 51/200 (25.5 %) | 200/200 (100 %) → 200/200 (100 %) → 51/200 (25.5 %) | L3 wipe:sin-core-fire 40, L3 wipe:sin-core-thunder 36, L3 wipe:sin-core-water 35, L3 wipe:sin-core-blizzard 32, L3 wipe:sin-genais-sigh 6 | 380 (382 on a full clear) | 7.0 of 7 alive, mean 75 % HP (n 200) |
| sensible: S-8 NEAR open | 55/200 (27.5 %) | 200/200 (100 %) → 200/200 (100 %) → 55/200 (27.5 %) | L3 wipe:sin-core-thunder 40, L3 wipe:sin-core-fire 38, L3 wipe:sin-core-blizzard 37, L3 wipe:sin-core-water 23, L3 wipe:sin-genais-sigh 7 | 378 (380 on a full clear) | 7.0 of 7 alive, mean 75 % HP (n 200) |
| sensible: S-12 Negation OFF (a bound) | 88/200 (44 %) | 200/200 (100 %) → 200/200 (100 %) → 88/200 (44 %) | L3 wipe:sin-core-water 28, L3 wipe:sin-core-thunder 27, L3 wipe:sin-core-blizzard 27, L3 wipe:sin-core-fire 25, L3 wipe:sin-genais-sigh 5 | 326 (319 on a full clear) | 7.0 of 7 alive, mean 78 % HP (n 200) |
| sensible: seam: front row carries (REVIEW 6) | 52/200 (26 %) | 200/200 (100 %) → 200/200 (100 %) → 52/200 (26 %) | L3 wipe:sin-core-blizzard 40, L3 wipe:sin-core-water 39, L3 wipe:sin-core-fire 35, L3 wipe:sin-core-thunder 29, L3 wipe:sin-genais-sigh 5 | 382 (376 on a full clear) | 7.0 of 7 alive, mean 74 % HP (n 200) |
| naive: as built (FAR open, Negation on, build line-up) | 0/200 (0 %) | 0/200 (0 %) → 0/0 (0 %) → 0/0 (0 %) | L1 escape 200 | 400 (- on a full clear) | 0.0 of 7 alive, mean 0 % HP (n 0) |
| advisor card: as built (FAR open, Negation on, build line-up) | 6/200 (3 %) | 190/200 (95 %) → 85/190 (44.7 %) → 6/85 (7.1 %) | L2 wipe:sin-fin-ram 68, L2 wipe:sin-fin-smack 36, L3 wipe:sin-genais-sigh 32, L3 escape 17, L1 wipe:sin-fin-ram 10, L3 wipe:sin-core-water 8, L3 wipe:sin-core-thunder 8, L3 wipe:sin-core-fire 7, L3 wipe:sin-core-blizzard 6, L3 wipe:sin-genais-thrashing 1, L2 escape 1 | 467 (487 on a full clear) | 7.0 of 7 alive, mean 71 % HP (n 85) |
| advisor card: S-8 NEAR open | 13/200 (6.5 %) | 199/200 (99.5 %) → 128/199 (64.3 %) → 13/128 (10.2 %) | L2 wipe:sin-fin-ram 51, L3 wipe:sin-genais-sigh 51, L3 escape 28, L2 wipe:sin-fin-smack 20, L3 wipe:sin-core-blizzard 15, L3 wipe:sin-core-water 8, L3 wipe:sin-core-fire 7, L3 wipe:sin-core-thunder 5, L3 wipe:sin-genais-venom 1, L1 wipe:sin-fin-ram 1 | 505 (498 on a full clear) | 7.0 of 7 alive, mean 78 % HP (n 128) |
| advisor card: S-12 Negation OFF (a bound) | 93/200 (46.5 %) | 200/200 (100 %) → 198/200 (99 %) → 93/198 (47 %) | L3 wipe:sin-genais-sigh 68, L3 escape 16, L3 wipe:sin-core-water 8, L3 wipe:sin-core-thunder 5, L3 wipe:sin-core-blizzard 4, L3 wipe:sin-core-fire 4, L2 escape 2 | 358 (320 on a full clear) | 7.0 of 7 alive, mean 90 % HP (n 198) |
| advisor card: seam: front row carries (REVIEW 6) | 0/200 (0 %) | 190/200 (95 %) → 45/190 (23.7 %) → 0/45 (0 %) | L2 wipe:sin-fin-smack 73, L2 wipe:sin-fin-ram 71, L3 wipe:sin-genais-sigh 37, L1 wipe:sin-fin-ram 10, L3 wipe:sin-genais-thrashing 3, L3 wipe:pray 2, L3 escape 2, L3 wipe:sin-core-fire 1, L2 escape 1 | 441 (- on a full clear) | 7.0 of 7 alive, mean 71 % HP (n 45) |
| sensible: the Core first (row 6) | 0/200 (0 %) | 200/200 (100 %) → 200/200 (100 %) → 0/200 (0 %) | L3 wipe:defend 93, L3 wipe:sin-genais-venom 37, L3 wipe:sin-genais-thrashing 32, L3 wipe:sin-core-fire 12, L3 wipe:sin-core-water 12, L3 wipe:sin-core-thunder 9, L3 wipe:sin-core-blizzard 5 | 394 (- on a full clear) | 7.0 of 7 alive, mean 75 % HP (n 200) |
| sensible: top-up heals (a sensitivity) | 50/200 (25 %) | 200/200 (100 %) → 200/200 (100 %) → 50/200 (25 %) | L3 wipe:sin-core-thunder 37, L3 wipe:sin-core-blizzard 35, L3 wipe:sin-core-water 32, L3 wipe:sin-core-fire 31, L3 wipe:sin-genais-sigh 15 | 462 (432 on a full clear) | 7.0 of 7 alive, mean 81 % HP (n 200) |
| sensible: careful: rests at FAR before each Fin's last blow (a sensitivity) | 30/200 (15 %) | 200/200 (100 %) → 200/200 (100 %) → 30/200 (15 %) | L3 wipe:sin-core-thunder 46, L3 wipe:sin-core-blizzard 45, L3 wipe:sin-core-water 42, L3 wipe:sin-core-fire 22, L3 wipe:sin-genais-sigh 15 | 400 (390 on a full clear) | 7.0 of 7 alive, mean 77 % HP (n 200) |
| sensible: S-12 OFF and S-8 NEAR together | 93/200 (46.5 %) | 200/200 (100 %) → 200/200 (100 %) → 93/200 (46.5 %) | L3 wipe:sin-core-blizzard 33, L3 wipe:sin-core-fire 32, L3 wipe:sin-core-water 20, L3 wipe:sin-core-thunder 18, L3 wipe:sin-genais-sigh 4 | 316 (313 on a full clear) | 7.0 of 7 alive, mean 87 % HP (n 200) |

### 3. Length
Chapter III's first link is about 195 engine turns (`docs/plans/sin-link4-bench.md`); every figure here is engine turns (every actor).
- sensible: link 1 131, link 2 139, link 3 110 turns (chain attempts that reached each).
- advisor card: link 1 250, link 2 164, link 3 146 turns (chain attempts that reached each).

### 4. Per-link switches (a rested start on each link)
| Line | Switch | Link 1 | Link 2 | Link 3 |
|---|---|---:|---:|---:|
| sensible | as built | 200/200 (100 %) | 200/200 (100 %) | 162/200 (81 %) |
| sensible | S-8 NEAR | 200/200 (100 %) | 200/200 (100 %) | n/a (no Fin) |
| sensible | S-12 OFF | 200/200 (100 %) | 200/200 (100 %) | 169/200 (84.5 %) |
| advisor card | as built | 190/200 (95 %) | 196/200 (98 %) | 166/200 (83 %) |
| advisor card | S-8 NEAR | 199/200 (99.5 %) | 176/200 (88 %) | n/a (no Fin) |
| advisor card | S-12 OFF | 200/200 (100 %) | 200/200 (100 %) | 165/200 (82.5 %) |

### 4b. The Core's counter tunables (S-13, REVIEW 8), link 3 with a rested start
| Line | Switch | Link 3 wins | Losses by cause |
|---|---|---:|---|
| sensible | as built (counter 100 % before and after Genais dies; an absorbed spell draws it) | 162/200 (81 %) | wipe:sin-core-blizzard 19, wipe:sin-core-fire 10, wipe:sin-core-water 5, wipe:sin-core-thunder 4 |
| sensible | counter chance before Genais dies 50 % | 162/200 (81 %) | wipe:sin-core-blizzard 19, wipe:sin-core-fire 10, wipe:sin-core-water 5, wipe:sin-core-thunder 4 |
| sensible | an absorbed spell draws no counter | 162/200 (81 %) | wipe:sin-core-blizzard 19, wipe:sin-core-fire 10, wipe:sin-core-water 5, wipe:sin-core-thunder 4 |
| advisor card | as built (counter 100 % before and after Genais dies; an absorbed spell draws it) | 166/200 (83 %) | wipe:sin-genais-sigh 30, wipe:sin-core-water 1, wipe:sin-core-fire 1, wipe:sin-core-blizzard 1, escape 1 |
| advisor card | counter chance before Genais dies 50 % | 164/200 (82 %) | wipe:sin-genais-sigh 28, wipe:sin-core-blizzard 3, wipe:sin-core-water 2, escape 1, wipe:sin-core-fire 1, wipe:sin-core-thunder 1 |
| advisor card | an absorbed spell draws no counter | 166/200 (83 %) | wipe:sin-genais-sigh 30, wipe:sin-core-water 1, wipe:sin-core-fire 1, wipe:sin-core-blizzard 1, escape 1 |

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

### 6. Link 3, one factor of the entry state at a time (sensible line)

The table is in "Link 3, rested against carried" above (the bench prints it as section 6).

### 7. Retries: the link-3 checkpoint off (as shipped) and on (an adaptation, `SIN_LINK3_CHECKPOINT`)

Up to five attempts per seed, 200 seeds. Attempt _k_ reseeds its base as `seed + 10000 k` (the flow reseeds a retry).
Off, every retry starts at the Left Fin on the build. On, once an attempt has entered link 3, every later retry opens
link 3 on the setup captured on entering it (HP, MP, statuses, gauges, and the items it had then), the D-217 shape
(`BattleChainCheckpoint.resumeSetup`, seed `base + 2`). `runWithRetries` in `tests/unit/helpers/sinFinsBench.ts`.

| Line | Checkpoint | Within 1 | Within 3 | Within 5 | Mean engine turns to a win (winners) | Link-3 retries won / tried |
|---|---|---:|---:|---:|---:|---:|
| sensible | off (as shipped) | 51/200 (25.5 %) | 111/200 (55.5 %) | 152/200 (76 %) | 948 | - |
| sensible | **ON** | 51/200 (25.5 %) | 114/200 (57 %) | 149/200 (74.5 %) | **531** | 98 / 409 (24 %) |
| advisor card | off (as shipped) | 6/200 (3 %) | 15/200 (7.5 %) | 23/200 (11.5 %) | 1,291 | - |
| advisor card | **ON** | 6/200 (3 %) | 16/200 (8 %) | 27/200 (13.5 %) | **1,010** | 14 / 448 (3.1 %) |

- **For the sensible line the checkpoint changes the time, not the odds.** Links 1 and 2 are 100 %, so a retry from
  the Left Fin rebuilds the same kind of spent party a retry at link 3 replays; a link-3 retry wins 24 % of the time,
  as a first link 3 does (25.5 %). What it saves is the two Fin fights: **531 engine turns to a win against 948**.
- **For the card it adds a little** (13.5 % against 11.5 % within five; 1,010 turns against 1,291), because its losses
  at link 2 (44.7 %) are skipped once it has reached link 3. Its link-3 retries win 3.1 %.
- **Within one attempt nothing changes** (the first attempt is the same run either way; pinned by
  `sin-checkpoint.test.ts`).
- It is **an adaptation**, not a sourced rule: research §1.2 has no break and no save between links 1 and 3. The switch
  ships **false**; Q3's default ("back to the Left Fin") stands until Bailey says otherwise.

## Loss causes, in words

- **The sensible line's only losses are in link 3, and they end on the Core's counters.** After Genais falls the
  Core runs its free cycle and every swing at it draws Fire, Blizzard, Thunder or Water on the front row (about 400
  to 600 each in the traces read, S-13). In the turn-by-turn read of chain seed 6 the party is at a quarter of its HP
  after each Gravija (75 % of current HP, 10.8 a fight) and the counters and the next Gravija finish it. Carried, the
  X-Potions that would answer it were spent on the Fins (section 6). Before the Auron fix 10 chains of 200 ended in
  `escape` (a dry Auron Defending beside a Core nobody could Break); after it, none do.
- **The card's link-3 losses end on Genais's Sigh** (30 rested, 32 in the chain): the last action before the wipe.
  Sigh is a party-wide magical hit with Darkness, and it lands while the party is low from Gravija and the shell's
  Cura fight. That is the last action, not a proven root cause.
- **The card's Fin losses are Ram and Smack** (10 at link 1; 68 and 36 at link 2 in the chain). It takes more Gravija
  a Fin fight than the sensible line (5.4 and 5.8 against 0.9 and 1.2) and carries that damage into the next link.
- **`escape`, the 400-turn stalemate,** is its own cause (naive: every Fin fight; a few link-3 chains for the others).

## What the plan asked to be reported

- **Wins and losses by cause, turns against Chapter III, Negation and Gravija counts, Gravija whiffs at FAR:** the
  tables above.
- **Survivors into link 3:** every chain that reached it had all seven alive (revives carry) at a mean 75 % HP
  (sensible), 71 % (card), 74 to 90 % under the switches. What they carry is in "Link 3, rested against carried":
  the X-Potions and MP spent, not the roster.
- **Genais shells and wins with Genais standing:** once a fight, and never a win with it standing.
- **S-8, S-12, S-1:** S-8 and S-12 above. S-1 (the 13th or the 12th turn) is link 4's, and the link-4 bench prints it
  for all three lines (`PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-bench.test.ts`):

  | Line | Giga-Graviton turn | Wins |
  |---|---:|---:|
  | sensible | 13 / 12 | 62/200 (31 %) / 7/200 (3.5 %), unchanged |
  | naive | 13 / 12 | 0/200 / 0/200, unchanged |
  | advisor card | 13 / 12 | **44/200 (22 %) / 4/200 (2 %)** |

  (Link 4 was not re-run on 2026-09-29: none of the day's fixes touch it; its 6-seed smoke passes.)

## Options, if the numbers are to move (Bailey's to weigh; nothing here is built)

Each was measured above.

1. **The link-3 checkpoint (Q3), now BUILT and OFF** (`SIN_LINK3_CHECKPOINT` in `src/data/ffx/enemies/sin-genais-core.ts`,
   an adaptation in D-217's shape). It replays the carried entry state, so it does not lift the odds for the sensible line
   (74.5 % against 76 % within five attempts) but halves the time to a win (531 engine turns against 948); the card gains
   a little (13.5 % against 11.5 %). Section 7.
2. **Confirming S-12** (the Negation formula) against the game: "off" lifts the sensible chain from 25.5 % to 44 % and
   the card's from 3 % to 46.5 %.
3. **An aeon line** (an aeon takes the Core's Gravija and the counters that the front row takes now). The bench
   shows aeons do nothing to a Fin at FAR (section 5), so it would be a link-3 line, and it is not built.
4. **Listing XVII with its difficulty disclosed,** as the plan already offers for XVIII.

The link-4 numbers (31 % and 3.5 %) are unchanged and are in `sin-link4-bench.md`.

## Open, and not built

| # | Item | What it means for these numbers |
|---|---|---|
| S-12 | Negation's formula is single-source with unclear units | The biggest lever (sensible chain 25.5 % to 44 % when off; card 3 % to 46.5 %). The guide labels it. |
| S-13 | The Core's counter chance before and after Genais dies, and whether an absorbed spell draws it | No win count changes; the lines rarely hit the Core early. Gestahl's "100 %" after Genais dies is the default. |
| S-8 | The Fins open FAR (Gestahl, GameFAQs) | Moves the card's link 2 (98 % against 88 %), not the sensible line's. |
| Q16 | The seam line-up | Both readings measured; within noise for the sensible line. Our estimate stays the build's. |
| REVIEW 13 | Aeons at FAR | Aeons reach nothing at FAR (attack, ability and Overdrive rows are all off); the guides' Bahamut on the Fins would have to be NEAR. Unreconciled with §7.2. |
| — | The sensible line does not use aeons or the Silence Grenade | It understates a player who plans an aeon finish or silences Genais. |
| — | The "careful" and "top-up" sensitivities are two attempts, not the best line | The carry is the cap, not the care (top-up 25 %, careful 15 % against 25.5 %). A line that saves the X-Potions for link 3 was not tried. |
| — | `FFXEngine.init` sends setup-time events to the previous battle's log (a fresh engine throws) | Pre-existing shared FFX plumbing, not changed. The carry is now consistent, so no measured carried state emits at setup. |
