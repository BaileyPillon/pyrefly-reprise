# Advisor v4: method check and look-ahead prototype

Written 2026-09-28 on branch `advisor-v4` (from main d89541b6). Rule 15 method check: the advisor has
been rebuilt three times for the same complaint (fix3, v2, v3), so the next idea is measured as a
prototype before anything is built into the game. **No product behaviour changed**: the only `src/`
edit is an additive `FFXEngine.fork` that nothing in a battle calls.

> **Bailey, 2026-09-27:** *"the advisor needs to be WAY WAY smarter please"*

**Game case (rule 14).** The look-ahead is **both** games: it is a property of the advice, and it
was measured on every listed FFX and FFX-2 chapter. What differs by game is how a simulated future
is played. FFX is CTB: nothing moves while a menu is open and the turn order is the engine's own
[research/ffx-combat-core.md §1.1]. FFX-2 is ATB: the clock runs at the house human pace, and
commands charge while other menus open [research/ffx2-combat-core.md §1.1, §1.3]. The
recommendation also differs by game (§6).

---

## 0. The answer

**A look-ahead search is much stronger than v3, on both games, with no chapter worse.** It is too
slow for the 50 ms blocking budget, though. It needs 0.2 to 2 s of desktop compute per decision,
and every version cheap enough to fit 50 ms lost to v3. So it can be built, but only as a
background search.

**Scorecard, 40 seeds a chapter, v3 against the v4 prototype** (same tree, same drive, FFX-2 at
the house pace; `node critic/bench/advisor-v4/table.mjs v4f`):

| | FFX (9 chapters) | FFX-2 (7 chapters) | All |
|---|---:|---:|---:|
| v3 (main) | 310 / 360 | 207 / 280 | **517 / 640** |
| v4 prototype | **346 / 360** | **239 / 280** | **585 / 640** |

Per chapter, v3 → v4: **I 19 → 38**, II 37 → 39, III 39 → 40, IV 40 → 40, V 36 → 37, VI 40 → 40,
VII 37 → 39, VIII 40 → 40, IX 40 → 40, X 38 → 38, XI 37 → 40, **XII 25 → 33**, **XIII 1 → 16**,
XIV 35 → 39, **XV 13 → 26**, XVI 40 → 40. **No chapter is lower.** Seed by seed, v4 wins 82 runs
that v3 loses and loses 14 that v3 wins. Lethal-save misses stay about where v3 has them (§4).
v4 never offers a row that is not on the menu or is badly aimed (0 everywhere). It costs
**0.2 to 2 s per decision at the p95 on this desktop** (v3: 2 to 18 ms).

**Recommendation: build it, FFX first, as a background search that falls back to v3's card whenever
it has not finished.** §6 has the details. In short: run the search off the main thread and start it while the
previous turn animates (FFX's engine knows the next board before the menu opens). Show v3's card
exactly as today, and put v4's pick on top only when the search finished in time. On a phone, use
the smaller budget (§5). FFX-2 follows once the timing has been measured in the browser.

---

## 1. The route so far, and what v3 left open

- **v2** (2026-09-21) ranks one decision at a time. Each legal row is resolved once on a throwaway
  copy of the battle and scored by a hand-weighted sum, 1.5 plies deep. The chapter's own line stays
  on top unless a challenger proves `saves-from-lethal`.
- **v3** (2026-09-27, on main) is the same ranker on a *projected* board (FFX-2: whatever is
  already in flight lands first), plus revive priority and `FFX2Engine.fork`
  (docs/plans/advisor-v3-method-check.md). It scores 517 of 640 on the scorecard. It fixed both
  defects Bailey named, but FFX barely moved: the card still loses I (19 of 40), XII Omnis (25),
  XIV Isaaru (35) and a few seeds elsewhere.
- **Why a ranker stops there.** A per-turn score asks what one press does to the board as it
  stands. Where the card loses, the deciding choice pays off many turns later (in Chapter I it is
  the very first move, §3), and no weight on a one-ply score can see that. v3's method check said
  so and named the next step: a search, but only after it stops losing Chapters III and V.

## 2. Why the naive search lost, and what fixed each cause

v3's prototype C used 10 candidates, 2 futures and a 6-decision horizon, scored by v2's hand
weights, and put the best candidate on top. It won XI and moved Isaaru, but it lost **Chapter III
(10 → 1 of 10)** and **Chapter V (10 → 4)**. This prototype rebuilt it on the fork and pulled it
apart. Seeds 1 to 10 of III and V, where v3 wins 10 of 10 on both:

| Search (all on the same fork, the same rails) | III | V | What it shows |
|---|---:|---:|---|
| **naive**: 2 futures, 6 decisions deep, argmax, a won link counts as a won chapter | **0/10** (0 links won; 4 stalemates) | **5/10** | Reproduces v3's C (1/10, 4/10) |
| naive, but played **to the end of the chapter** | 8/10 | **2/10** | The horizon fixes most of III. On V, 2 futures and argmax are noise |
| naive horizon (6), but **v4's switching rule** (8 futures, margin, confirmation) | 5/10 | 9/10 | The rule fixes V. A 6-deep horizon still loses III |
| **v4** (whole chapter + the rule) | **10/10** | **10/10** | Both causes removed |

Three causes (the first two measured on their own):

1. **A short horizon on a hand-made value stalls.** Looking 6 to 20 decisions ahead, "keep the
   party healthy" beats "make progress". Chapter III's first link needs about 195 turns, and the
   naive search never won it. Even with a careful switching rule, a 12-deep budget search stalled
   **15 of 20** Chapter VII runs into the engine's stalemate stop (`run1-sweep-b1`). A 20-deep
   search lost Evrae seeds that v3 wins (17 of 20 against 20). **Fix: play every future to the end
   of the chapter** (0.12 to 0.18 ms per simulated decision, so a whole Yunalesca fight costs
   about 20 ms).
2. **Two futures and an argmax move the card on noise.** The naive search replaced v3's pick on
   53 % of Chapter III's decisions. **Fix: rollout policy improvement, made conservative.** v3's
   top row stands unless a challenger (a) beats it on the mean by 0.04, (b) is *clearly* better
   (by more than 0.05) in more of 8 paired futures than it is clearly worse, and (c) holds on 16
   fresh futures (at least 2 more clear wins out of 24). Without (c), one lost future in eight still
   moved the card: Chapter II went **37 → 31** with fixed seeds (`run1-ceiling-a`) and **37 → 34**
   with board seeds (the unconfirmed run, from its log). With (c), II is **39**.
3. **A won link is not a won chapter.** III has 7 links, V is a chain, and the screen carries HP,
   MP, statuses and the Overdrive gauge from one link into the next (`setupForNextLink`). **Fix:
   futures play through the chain**, built exactly the way the screen builds it. This one is fixed
   by design and was not isolated. The first full-horizon run valued a won link as a won chapter
   and still won III 39 of 40 (`run1-ceiling-b`), so it was not the main cause on these chapters.

The same seeds for every decision were a fourth, smaller cause. They replayed the same 8 lucky or
unlucky streams over a whole fight. Seeds are now derived from the board, so the same board always
gets the same answer and a new board gets new futures.

## 3. The design (prototype, `critic/bench/advisor-v4/`)

For one decision, FFX or FFX-2:

1. **v3's card is computed exactly as the HUD computes it.** Its top row is the **default** the
   search has to beat. v4 never writes text. It only ever puts a different row on top, and only a
   row the rails allow.
2. **Rails, kept exactly** (`candidates.ts`, `search.ts`):
   - a top row with the proved `saves-from-lethal` fact stands, with no search (Bailey's
     2026-09-21 rule);
   - a top row that raises a fallen ally stands (v3's revive priority, for the Sisters' White
     Mage);
   - candidates are only enabled rows the menu paints, aimed at a target the row offers (FOC22-02);
   - a raise that Bailey's refusal rule speaks for (`reviveRisk`) is never a candidate;
   - FFX-2: nothing already on its way. That means v3's rule (`alreadyOnItsWay`, read on the real
     board) and two stricter checks from the scorecard's own readings: no support row with the same
     kind and id as a command in flight, and none whose every effect a command in flight already
     delivers.
3. **Candidates**: v3's top row and runner-up, the chapter's line for this actor, and the best four
   other rows by v2's one-step score (one simulation each). Seven at most.
4. **Futures** (`rollout.ts`): each candidate is pressed on a **fork** of the live battle
   (`FFXEngine.fork`, new here, and `FFX2Engine.fork`). The fork then plays on with the chapter's
   own line as the default policy, to the end of the chapter, carrying each won link into the next
   (`setupForNextLink`). The line costs 0.01 ms a decision, and the engine 0.12 to 0.18 ms. FFX-2
   forks run the ATB clock at the house human pace (Wait split, 0.5 s top / 1.0 s held). Every
   candidate gets the same 8 futures (common random numbers).
5. **Value** (`value.ts`): a won chapter is 0.9 plus 0.1 × the party's health, and a loss or a
   stalemate is 0. A capped horizon (only in the budget variants) stops on a damage-race value, and
   every later link counts as a whole enemy side still to beat.
6. **The switching rule** (§2, cause 2). If the challenger does not pass it, v3's card stands.

**Never the real battle** (rule 1): the search runs on forks only, each with its own random stream,
and the live engine is only read. It is bounded by counts, never by a clock.
`critic/bench/advisor-v4/purity.test.ts` runs the full search at every decision and presses v3's
row: Chapters XIV, I and XI end on the same log, byte for byte, as without the search (the fork
plays later links; FFX-2 forks run the clock). `tests/unit/ffx-engine-fork.test.ts` proves the new
FFX fork the way v3 proved the FFX-2 one: a fork given the battle's random state ends on the real
log, byte for byte, on all nine FFX chapters at up to four points each; two forks with one seed
agree; and forking leaves the battle's state and stream alone.

**What the search found** (a census of its switches, seeds 1 to 8 or 12):

- **I Seymour Flux**: nearly the whole gain is one move. On the first turn the line says Hastega
  (or Holy Water). The search says **Slow on Seymour Flux**, which wins 7 of 8 futures against 2 of
  8, and it does so on every seed traced (12 of 12). In the engine Slow lands, and the CTB order
  shows Seymour's turns thinning out. **The research disagrees with itself here**:
  `ffx-seymour-flux.md` §1.3 lists Slow as `255 Immune` in one row and as `0 Landable` in the
  "Haste / Slow / Shell ..." row. The engine follows the second. Chapter I's jump from 19 to 38
  rests on which row is right, so it needs a check in the Steam copy before the card teaches it
  (rule 6: the engine data is not this track's to change).
- **XII Omnis**: Mental and Power Break on Omnis instead of Attack, Cura instead of Curaga (MP),
  Omnis rather than a Mortiphasm, and holding the Overdrive for the right turn.
- **XIV Isaaru**: Shield on our aeon instead of attacking Spathi.
- **XV Den of Woe**: fewer Darkness casts (each one costs the Dark Knight HP), and a Megalixir or
  Mega-Potion on Yuna instead.

## 4. The numbers

### 4.1 The scorecard, per chapter

40 seeds a chapter, everything else as the v3 scorecard (`critic/bench/advisor-v3/`). The v3
column reproduces main's merged scorecard exactly (517). v4 is the ceiling budget (`CEILING`:
8 futures, 4 ranked rows, confirmation on 16 more), run as `v4f-*` in `results/`.

| Chapter | Game | v3 wins | v4 wins | Seeds v4 won and v3 lost / the reverse | Lethal-save miss v3 → v4 | Missed revive v3 → v4 | Dup strict / same v3 → v4 | Not on menu / bad aim v4 | Switched / decisions | v4 ms p50 / p95 / p99 |
|---|---|---:|---:|---|---|---|---|---|---|---|
| I | FFX | 19/40 | **38/40** | +19 / −0 | 0 → 0 | 398 → 475 | n/a | 0 / 0 | 48 / 1943 | 247 / 485 / 689 |
| II | FFX | 37/40 | **39/40** | +3 / −1 | 0 → 0 | 4 → 7 | n/a | 0 / 0 | 534 / 6988 | 616 / 1207 / 1530 |
| III | FFX | 39/40 | **40/40** | +1 / −0 | 1 → 0 | 8 → 1 | n/a | 0 / 0 | 248 / 8127 | 1178 / 2369 / 2933 |
| IV | FFX-2 | 40/40 | **40/40** | +0 / −0 | 0 → 0 | 0 → 0 | 0 / 0 → 0 / 0 | 0 / 0 | 0 / 1917 | 168 / 313 / 335 |
| V | FFX-2 | 36/40 | **37/40** | +4 / −3 | 77 → 92 | 6 → 4 | 58 / 8 → 49 / 10 | 0 / 0 | 447 / 5604 | 722 / 1794 / 1991 |
| VI | FFX-2 | 40/40 | **40/40** | +0 / −0 | 54 → 57 | 3 → 3 | 10 / 42 → 5 / 43 | 0 / 0 | 477 / 3100 | 462 / 941 / 1042 |
| VII | FFX | 37/40 | **39/40** | +2 / −0 | 21 → 25 | 16 → 7 | n/a | 0 / 0 | 66 / 1947 | 168 / 442 / 547 |
| VIII | FFX | 40/40 | **40/40** | +0 / −0 | 0 → 0 | 1 → 0 | n/a | 0 / 0 | 36 / 2729 | 192 / 402 / 601 |
| IX | FFX | 40/40 | **40/40** | +0 / −0 | 2 → 2 | 2 → 2 | n/a | 0 / 0 | 5 / 716 | 312 / 603 / 890 |
| X | FFX | 38/40 | **38/40** | +2 / −2 | 0 → 3 | 1 → 0 | n/a | 0 / 0 | 118 / 1948 | 172 / 459 / 521 |
| XI | FFX-2 | 37/40 | **40/40** | +3 / −0 | 7 → 9 | 5 → 0 | 2 / 2 → 4 / 2 | 0 / 0 | 73 / 3190 | 430 / 943 / 1320 |
| XII | FFX | 25/40 | **33/40** | +12 / −4 | 14 → 7 | 188 → 105 | n/a | 0 / 0 | 473 / 4352 | 538 / 1475 / 1675 |
| XIII | FFX-2 | 1/40 | **16/40** | +16 / −1 | 0 → 6 | 0 → 0 | 0 / 0 → 3 / 0 | 0 / 0 | 1120 / 7642 | 844 / 2935 / 3489 |
| XIV | FFX | 35/40 | **39/40** | +5 / −1 | 0 → 0 | 0 → 0 | n/a | 0 / 0 | 61 / 1350 | 84 / 231 / 312 |
| XV | FFX-2 | 13/40 | **26/40** | +15 / −2 | 26 → 33 | 11 → 18 | 14 / 9 → 14 / 12 | 0 / 0 | 473 / 1816 | 217 / 449 / 510 |
| XVI | FFX-2 | 40/40 | **40/40** | +0 / −0 | 2 → 1 | 1 → 0 | 2 / 2 → 2 / 2 | 0 / 0 | 77 / 1574 | 191 / 432 / 544 |
| **All** | | **517/640** | **585/640** | | | | | | | |

How to read the other columns:

- **Lethal-save miss** is the v3 scorecard's arithmetic reading: the forecast kills an ally, some
  row keeps them alive, and the top row does not. v4 never moves a top row whose own facts carry
  the proof. The reading is recomputed on the board as it stands, though (v3's facts are computed
  on the projected board on FFX-2), so a few misses can be v4 switches; the rest are different
  boards along different runs. This prototype did not split the two. Per 1,000 decisions, v3 → v4:
  V 14.8 → 16.4, VI 18.9 → 18.4, VII 10.2 → 12.8, X 0 → 1.5, XI 2.2 → 2.8, XII 3.4 → 1.6,
  XIII 0 → 0.8, XV 18.9 → 18.2, IX 2.8 on both; every other chapter 0 to 0.1. v3's method check showed
  this reading over-counts on FFX-2 (a heal that cannot land in time); the fork-tested reading
  should gate the build (§6).
- **Missed revive** on I is almost all Bailey's refusal rule (the board kills them again at once).
  v4 keeps every refusal, and its runs are longer because it wins more of them (1,943 decisions
  against 1,410). On XII it falls from 188 to 105, and on XV it rises from 11 to 18. v4 keeps
  every raise v3 puts on top and only moves rows that raise nobody, so each v4 miss is a board
  where v3's own card missed too.
- **Duplicates** (FFX-2): by construction, a row v4 puts on top is never a scorecard duplicate. Its
  rails use the scorecard's own two readings. What is left are v3's own top rows that v4 kept, on
  different boards: same-move V 8 → 10, XIII 0 → 3, XV 9 → 12.
- **Switched**: v4 put a different row on top in **7.7 %** of 54,943 decisions. That is 0 % on IV,
  about 2.5 % on I (one move, §3), and 26 % on XV.

### 4.2 Budgets: what less search keeps

The same prototype with fewer futures. Wins on seeds 1 to 20, where every budget ran:

| Budget | Futures per decision, at most | I | II | III | V | VII | X | XI | XII | XIV | XV | Sum |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| v3 | 0 | 10 | 20 | 19 | 19 | 20 | 18 | 20 | 13 | 19 | 7 | 165 |
| v4 ceiling (8 futures, 4 ranked rows, confirm 16) | 88 | 18 | 19 | 20 | 19 | 20 | 19 | 20 | 15 | 19 | 14 | **183** |
| lean (4 futures, 2 ranked rows, confirm 8) | 36 | 17 | 19 | 20 | 19 | 20 | 20 | 19 | 18 | 19 | 12 | **183** |
| mini (2 futures, 1 ranked row, confirm 4) | 16 | 17 | 19 | 20 | 17 | 20 | 18 | 20 | 13 | 20 | 12 | 176 |

**Lean matches the ceiling at about 40 % of the cost.** Mini keeps Chapter I, XIV and XV but
loses XII's gain, and it is 2 short of v3 on V. A 20-seed difference of one or two runs is noise:
XII moved 15 → 18 between two budgets that should rank the other way.

The search that fits 50 ms is worse than v3. From the first measurement: 3 futures, a 12-decision
horizon, damage-race leaf, p95 25 to 51 ms (`run1-sweep-b1`). Against v3 on seeds 1 to 20 it
went XII 12 vs 13, VII **2** vs 20 (15 stalemates), X 20 vs 18, XIV 15 vs 19, VIII 16 vs 20:
65 against 90.

## 5. The cost, and what a phone allows

Measured in node on this desktop (Ryzen 7 7800X3D). The 40-seed runs above shared the machine
with up to twelve other processes, so their milliseconds run high. The quieter run below measured
seed 41 of every chapter with four processes at a time.

Milliseconds per decision (the whole card: v3 plus the search), p95, seed 41 of every chapter
(`lat-*` in `results/`; the 40-seed runs read up to about 1.5x higher):

| | v3 | mini | lean | ceiling |
|---|---|---|---|---|
| FFX, shortest to longest fight (XIV ... III) | 2 to 9 | 37 to 333 | 99 to 761 | 160 to 1,970 |
| FFX-2 (XVI ... V) | 6 to 18 | 57 to 326 | 128 to 688 | 363 to 1,833 |
| Simulated player decisions per decision, mean | 0 | 125 to 866 | 405 to 2,176 | 837 to 6,144 |

- **Where the time goes.** Rollouts, almost all of it, and the rollouts are the engine: 0.12 to
  0.18 ms per simulated decision including the enemies' turns (the line itself is 0.01 ms; a fork
  is 0.3 ms). The cost follows the length of the fight left, which is why III and Yunalesca are
  the slowest.
- **The 50 ms desktop budget is not met by any version that helps.** Mini's p95 is under 50 ms only
  on Isaaru. The one run that fit (p95 25 to 51 ms) is 25 runs worse than v3 (§4.2).
- **A phone.** v3's handoff measured the card at 4 to 8 ms in the desktop browser and 33 ms at 4x
  CPU throttle, the house phone proxy, so assume about 4x slower. The 50 ms phone budget is about
  12 ms of desktop compute, which is v3 alone. **A phone cannot run the search blocking.** In the
  background, a 1 s window on a phone buys about 250 ms of desktop compute. That covers mini's p95
  on every chapter but III (333) and V (326), and lean's p50 on most. Mini is the phone budget, with
  v3's card whenever the search has not finished.
- **Node and the browser.** v3's numbers were within a few ms of each other in node and in the
  browser at 1600x900. The browser has not been measured for v4 (a build task, §6).

## 6. Recommendation

**Build it or not: build it, FFX first.** It is the first change since v2 that moves the FFX
chapters the card loses: I 19 → 38, XII 25 → 33, XIV 35 → 39, and no chapter lower. On FFX-2 it
also takes XIII from 1 to 16 and XV from 13 to 26. It is not a patch on the ranker, so it does not
repeat the fix3, v2, v3 pattern (a new weight per named defect). It is v3's own card, overruled only
when the futures say so, clearly and twice.

**Where it helps**: long fights decided by an early or repeated choice (I's opening Slow, XII's
Breaks and MP, XIV's Shield, XV's HP-costing Darkness, XIII). **Where it does nothing**: fights the
card already wins (IV, VI, VIII, IX, XVI switch 0 to 15 % of the time and win the same). **Where to
watch**: V (+1 net, with 3 seeds lost), X (±2), and the FFX-2 lethal reading.

**How** (a build plan, not built here):

1. **Engine**: keep `FFXEngine.fork` as it is here (additive, not on the facade, tested). The FFX HUD
   hands the engine to the advisor, as the FFX-2 HUD has since v3.
2. **Off the main thread.** The engines and the advisor import no DOM (rule 1), and a fork is one
   `structuredClone`, the same one `postMessage` performs. So the search can run in a Web Worker on
   a copy of the battle and send back one command.
3. **FFX: search while the turns animate.** In CTB nothing the player does between a press and
   the next menu changes that menu's board, so the board is fixed at the press. A fork given the
   engine's random state reaches it exactly; the fidelity test proves that, byte for byte. The
   search can therefore start at the press and use every animation until the next menu opens (the
   pressed command, the enemies' turns). The exception is an Overdrive minigame, where the player's
   own input decides the outcome, so there the search starts after it. The window has not been
   measured; measuring it in the browser is the build's first task.
4. **The card never waits and never changes under the player.** At menu open the card shows
   v4's pick if the search finished, and v3's card otherwise. A card that updates after it appears,
   or a "thinking" state, would be new design and needs Bailey's pick first (rule 9). The recommended
   build needs neither.
5. **Budget by device, by counts, not a clock** (the same board gives the same card on one device):
   lean on desktop, mini on a phone, with v3 as the fallback.
6. **FFX-2 second.** The board is only known when a gauge fills, so the window is the girl's own
   time on the top list (0.5 s at the house pace). Desktop lean fits that at the median on every
   FFX-2 chapter, and at the p95 on all but V and XIII; a phone does not. Measure it in the browser first. Gate on the fork-tested lethal reading
   (v3 §6b), not the arithmetic one.

**Before building**: Bailey's yes (the card's top row will overrule the strategy guide's line more
often); the Steam check on Slow and Seymour Flux (§3); `node tools/critic-plan.mjs --paths` on
the build (advisor and presenter wiring). Not needed: any engine change beyond `fork`, any new text
on the card.

## 7. For Bailey

- Nothing you can see has changed. This is a measured prototype on a branch, not a build. v3 is
  still what the game shows.
- If built, the card looks the same; only the move on top changes. The one new behaviour a player
  could notice is that the top row can differ from the strategy guide's line more often (the search
  overrules the line when its futures say so). That needs your yes before it is built. A "the
  advisor is thinking" state or a card that changes after it appears would be new design (rule 9),
  and the recommended build avoids both.
- Worth one check in the real game (Steam copy, with your OK to take the screen): does **Slow land
  on Seymour Flux**? Our research lists it both ways (§3, "What the search found"). The engine lands
  it, and that one move accounts for almost all of Chapter I's jump from 19 to 38.

## Checks run

- `npx tsc --noEmit` clean. The bench also type-checks clean under the repo's strict config.
- `tests/unit/ffx-engine-fork.test.ts` (new) and `tests/unit/ffx2-engine-fork.test.ts` pass.
  `critic/bench/advisor-v4/purity.test.ts` passes (3 chapters, both games, with the search at
  every decision). The v3 scorecard's own purity check still passes with the drive's new
  read-only `chain` field.
- The full unit suite in this worktree fails only files that read `public/art/` (absent in a
  worktree: `ui-portrait-face-crop`, `chapter-meta*`, the `chapters/*-ship*` art checks and
  others). One more, `strategy-ffx2-bahamut`, timed out under load and passes alone. Nothing in
  a battle calls the new `fork`, and no engine golden changed.
- `src/battle/ffx/engine.ts` was already over the 400-line house limit (465). `fork` adds 26 lines;
  a build that keeps it should split the file.

## Files

```
src/battle/ffx/engine.ts                        FFXEngine.fork (additive; nothing in a battle calls it)
tests/unit/ffx-engine-fork.test.ts               fidelity and determinism of the FFX fork
critic/bench/advisor-v4/search.ts                the v4 decision: rails, futures, switching rule
critic/bench/advisor-v4/candidates.ts            candidates and rails
critic/bench/advisor-v4/rollout.ts               one simulated future (both games, through the chain)
critic/bench/advisor-v4/value.ts                 the value of a board
critic/bench/advisor-v4/presets.ts               every budget measured here
critic/bench/advisor-v4/scorecard.test.ts        v3 against v4 on the v3 scorecard's chapters, drive and readings
critic/bench/advisor-v4/purity.test.ts           the search leaves the battle exactly as it found it
critic/bench/advisor-v4/table.mjs                the tables in this file, from results/
critic/bench/advisor-v4/vitest.config.ts         runs the bench outside npm test
critic/bench/advisor-v4/results/*.json           every run quoted here: v4f-* the final prototype, lean-* / mini-* the
                                                 budgets, lat-* the quieter timing, naive-* / abl-* §2, v4c-* without
                                                 confirmation, run1-* the first measurement, v3-* v3 on IV VI XIII XVI
critic/bench/advisor-v3/drive.ts                 + the chain in the decision context (read only)
critic/bench/advisor-v3/metrics.ts               + two readings exported for the v4 rails
docs/plans/advisor-v4-method-check.md            this file
```

Run it:

```
node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/scorecard.test.ts
  env: V4_CHAPTERS=<ids> V4_FIRST_SEED=1 V4_SEEDS=40 V4_DRIVERS=v3,v4 V4_CONFIG=ceiling|lean|mini|... V4_TAG=<name>
node critic/bench/advisor-v4/table.mjs v4f        (or lean, mini, v4c, run1-ceiling)
```
