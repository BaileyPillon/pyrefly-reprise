# Move Advisor v2 — the card stopped losing Chapter 3

Written 2026-09-21 by the advisor-v2 builder. Plan:
[`docs/plans/advisor-v2-review.md`](../plans/advisor-v2-review.md) (PROCEED, three
conditions). History: [`fix3-advisor.md`](fix3-advisor.md) passes 1–4,
`critic/rounds/round-06.json` PR-0006.

> **Bailey, 2026-09-21:** *"the move advisor needs to be way smarter and way more
> aware of what is going on turn by turn and what character you are controlling."*
> Earlier, on the live build: *"im controlling tidus but the advisor is telling me to
> use poison fang? how does that make sense? and what about reviving yuna?"*

**Game case (AGENTS.md rule 14): BOTH**, with two game-only terms named in §6.
Command identity, the ownership gate, "do not call a coin flip nothing", the budget,
the cache and the prior are all properties of *advice*, not of CTB or ATB. Each game
keeps its own odds formula and its own absence tests.

---

## 1. What was actually wrong

Three defects, all found by running the engines and none of them visible by reading
the code. The plan predicted one of them.

### 1.1 A switch's incoming member was not part of its identity

FFX offers one switch row per benched character — "Wakka", "Lulu", "Rikku",
"Kimahri". They share a `kind`, carry no `id` and aim at nobody, so on
`kind`/`id`/`targets` alone **every switch is the same command**. `sameCommand` was
what `tacticSuggestion` used to find the chapter line among the already-simulated
candidates, so Chapter 3's line *"put Lulu in"* matched the first switch in the list
and the card said **Wakka**. The party drifted to Wakka and Rikku, Lulu never cast,
and Braska's Final Aeon ran to the engine's 400-turn watchdog. `ownedRow` already
distinguished them by `extra.inId`; `sameCommand` did not, and it is the one that
picks the row.

### 1.2 The ownership gate refused a meta command's aim

Lulu's Doublecast is offered as `{ label: 'Doublecast', enabled: true, validTargets:
['lulu'] }` — the row aims at its own caster, because pressing it opens the two
spells that pick the enemy. Chapter 3's tactic returns `ability:doublecast ->
braskas-final-aeon`, which the engine accepts and resolves; `ownedRow` refused it,
because the boss is not in the row's `validTargets`. So on **every Lulu turn of
Chapter 3** the card silently threw the chapter's line away and fell back to its
simulated ranking — an X-Potion, a Lunar Curtain, a NulBlaze.

`advisor.ts#metaRowFor` is the narrowest shape that covers it: the row must exist, be
enabled, match kind and id exactly, and offer **only the actor itself**. A row that
lists real targets is still held to every one of them.

### 1.3 A coin flip was priced as a wasted turn (the plan's §2.2)

A preview answers every *branch* roll at its median, so Slow at ~40 % reports as
*nothing happened*. `scoreOutcome` then charged `WASTED_TURN_PENALTY` and
`changesNothing` classed the row inert, so the chapter's winning move sorted behind
everything that did something.

**The plan's proposed fix does not work and this is worth recording.** It assumed a
`roll: 'max'` read would land a 40 % status and that the repair was an expectation
over three simulations. Measured: `ffx/simulate.ts#RollPolicyRng.int` pins hit, crit,
status and escape draws to the median at **every** policy, deliberately, so a printed
damage range can never silently include a critical. Three simulations would have
produced three identical status reports and cost ~2.7 ms per decision to do it.

So `advisor-roll.ts` bands over the **probability**, not the roll. The odds come from
each engine's own formula, are pure functions of the chance byte and the target's
resistance, and cost nothing: FFX reuses `battle/ffx/estimate.ts#statusOdds` (already
the enemy-intent panel's source); FFX-2 mirrors `battle/ffx2/resolve.ts#applyRiders`
through the engine's own exported `statusChanceLinear`.

Two further readings were needed and both were measured, not argued:

- **A status already on the target cannot land**, whatever the odds byte says — both
  engines' `applyStatus` refuse a non-stacking status that is present, so no roll is
  taken. Without this, Shell/Protect/Regen/the four Nul spells (chance byte 254 =
  100 %) were worth +300 instead of −3 000 on an already-buffed party.
- **The simulation decides who the action reached.** An aim is a request, not a
  result: Yunalesca carries Reflect, so Yuna's NulBlaze aimed at Tidus resolves as a
  `status-add` on **Yunalesca**. Pricing a certain-to-land buff on somebody the spell
  never reached took Chapter 2 from 33 wins in 40 to 18. The filter reads the
  outcome's own events, excluding `miss` (a nullified hit did not take effect) and
  the caster's own `mp-damage` (what the action costs — leaving it in emptied
  Chapter 3's band and cost two seeds).

---

## 2. Measured: 40 seeds, 5 chapters, 3 drivers

`critic/bench/advisor-v2/` — run it with

```
npx vitest run --config critic/bench/advisor-v2/vitest.config.ts
```

`BENCH_SEEDS`, `BENCH_CHAPTERS`, `BENCH_DRIVERS`, `BENCH_TAG` narrow it. Raw output:
`critic/bench/advisor-v2/results-baseline.json` (before) and `results-final.json`
(after). Full run: ~55 s.

*intended* = `intendedStrategy`, the chapter's own line, the baseline.
*v1* = a bot pressing the shipped card's top row every turn.
*v2* = the same bot on this build.

| Chapter | intended | v1 (before) | **v2 (after)** | bar (intended − 5) |
|---|---|---|---|---|
| 1 Seymour Flux (FFX) | 65.0 % | 62.5 % | **67.5 %** | 60.0 ✅ |
| 2 Yunalesca (FFX) | 97.5 % | 82.5 % | **85.0 %** | 92.5 ❌ — §5 |
| 3 Braska's Final Aeon (FFX) | 97.5 % | **0.0 %** | **97.5 %** | 92.5 ✅ |
| 4 Bahamut (FFX-2) | 100 % | 100 % | **100 %** | 95.0 ✅ |
| 5 Vegnagun → Shuyin (FFX-2) | 100 % | 100 % | **97.5 %** | 95.0 ✅ |

**Median turns** (intended / v1 / v2):

| Chapter | intended | v1 | v2 |
|---|---|---|---|
| 1 | 60.5 | 60.5 | 66.5 |
| 2 | 205 | 246.5 | 247.5 |
| 3 | 215.5 | **448.5** | **216** |
| 4 | 76 | 76 | 76 |
| 5 | 42 | 42 | 43 |

Chapter 3 is the headline: **0 of 40 → 39 of 40**, and its median falls from 448
turns (thirty defeats and ten watchdog stalemates) to 216, which is the chapter
line's own figure. Chapter 1 now beats its own auto-battler by two seeds.

**Decision latency**, p50 / p95 ms, v2:

| | ch1 | ch2 | ch3 | ch4 | ch5 |
|---|---|---|---|---|---|
| p50 | 2.34 | 1.39 | 3.63 | 2.45 | 3.45 |
| p95 | 3.39 | 2.27 | 5.10 | 3.50 | 4.68 |

Against the plan's budgets of 15 ms typical / 25 ms ceiling (FFX) and 8 / 12 (FFX-2).
The work-count ceilings (`advisor-plan.ts#budgetFor`) are a frame guard, not a cut the
player meets.

**Recovery**, `tests/unit/advisor-plan-recovery.test.ts`: every chapter is walked five
turns under a deliberately wasteful driver (never a heal, never a revive, never an
attack if anything else is offered) and the card then takes the fight from there. On
all five, in both games: it answers every turn, never names a row the actor cannot
press, never goes silent, and the fight resolves. An ally on the floor always gets an
answer, asserted on boards the *player* made.

---

## 3. What was built

New, all pure and DOM-free, all under the 400-line house cap, all in
`src/engine/tactics/`:

| File | What |
|---|---|
| `advisor-roll.ts` | the probability band, the band-aware inert test, the confidence word |
| `advisor-eval.ts` | the 1.5-ply evaluation and `BoardFact` |
| `advisor-plan.ts` | the work-count budget, the plan cache, the prior |
| `advisor-say.ts` | the sentence, its four rules, the citation audit |

Changed: `advisor.ts` (`metaRowFor`, `sameCommand`, the band in `scoreOutcome` and in
the useful/inert split, the evaluation, the prior, the cache, the sentence).
**`src/ui/common/MoveAdvisor.ts` is untouched** — plan condition 3, and it keeps
`critic-plan` off "global layout, input and boot".

Nothing in `src/battle/**` changed. No contract file changed.

### The horizon is 1.5 plies, and why

Neither engine exposes a fork, and `simulate*Command` returns an *outcome*, not a
resulting board — so there is no post-action state to run a second ply on, and
manufacturing one would mean a hand-rolled `BattleState` clone that drifts from the
engine's the first time somebody adds a field. What is honestly available is: our
action resolved by the engine's own damage chain, then the real enemy AI's telegraphed
next action applied against the HP our action leaves behind. Both halves are real
engine output; the join is arithmetic on two measured numbers, and every fact carries
which of the two it came from. One forecast per decision, shared by every candidate.

### The prior: a fact, not a ratio

Bailey answered the three-pass-old question on 2026-09-21: the ranking **may** outrank
the guide. Measured, a score ratio alone is not a bar — with the override on a bare
`beatsPrior`, **Chapter 1 fell from 25 wins to 4 and Chapter 2 to zero**, because a
bigger damage number is available on almost every turn of a fight that is not won by
damage. That is exactly the "card and panel teach different fights" failure three
passes refused to risk.

So the override is gated on a **named, proved fact**: the challenger saves somebody the
enemy's telegraphed next action would kill, and the line does not. With that gate
Chapter 1 goes the other way — 25 wins to 27, past the chapter line's own 26. When it
fires, the sentence names the long plan in the same breath. Live, Chapter 4:

> *"Rikku lives through Mega Flare, and Mega Flare is worth about 1345; the long plan
> is still Magic Break."*

### The sentence

At most two `BoardFact`s, no per-chapter template, every figure re-derivable from the
same `SimOutcome` and forecast (`tests/unit/advisor-sentence.test.ts` re-runs both and
checks them). Context kinds (`incoming`, `phase`, `tempo`) may never **lead** — that
was caught in test, where a raise aimed at a downed Yuna came back as *"Lance of
Atrophy is worth about 755"*: correctly measured, and an answer to a question nobody
asked. When nothing stronger clears, the sentence is `''` and the shipped per-move
reason stands: **silent rather than wrong**.

The confidence word rides **inside** the sentence. A chip would be new paint on a card
with no approved target tile (AGENTS.md rule 9; the end-state board's waiting list still
owes a mockup of the advisor card), so that is a question for Bailey, not a build.

---

## 4. Browser pass (real input, both games)

Dev server on :5762, `PYREFLY_BROWSER=gpu`, 1600×900, keyboard input into the app's
own handler. Screenshots: `docs/screenshots/advisor-v2-ch1.png`,
`docs/screenshots/advisor-v2-ch4.png`.

**Chapter 1** — the card follows the acting character turn by turn:

```
t1  Tidus    Hastega -> the party   "It puts Haste on the party, and Lance of Atrophy is worth about 755."
t4  Kimahri  Mighty Guard -> party  "It puts Protect on the party, and Lance of Atrophy is worth about 745."
t7  Kimahri  Phoenix Down -> Tidus  "Only Tidus can cast Haste - stand Tidus up."
t3  Tidus    Hastega -> the party   (second attempt)
t7  Tidus    Phoenix Down -> Yuna   "Only Yuna can call an aeon, revive or heal - stand Yuna up."
```

**Chapter 4** — the override and its long-plan clause, per character:

```
t2   Yuna   Shell -> the party   "It puts Shell on the party."
t8   Yuna   Hi-Potion -> Rikku   "Rikku lives through Mega Flare, and Mega Flare is worth about 1610; the long plan is still Shell."
t10  Rikku  Hi-Potion -> Rikku   "... the long plan is still Darkness."
t15  Paine  Hi-Potion -> Rikku   "... the long plan is still Magic Break."
```

---

## 5. Chapter 2 cannot reach the bar, and the reason is measured

85.0 % against the chapter line's 97.5 %. It is an improvement on the shipped card's
82.5 %, and it is **not** a planner problem.

Census over eight seeds of Chapter 2 (1 412 decisions): the card diverged from the
chapter's line on **319** of them, and **all 319 of 319** were the same thing — the
line calls for `defend`, and *"`defend` is **not on the FFX menu at all** — it is a
base action, not a row"* [`ffx-combat-core` §1.3/§4.2, `advisor-menu.ts#onTheMenu`].
The substitutions the card makes instead are Attack (74), Cheer (49), Dispel (47),
Guard (29), Remedy (26), Mega-Potion (19)…

So `intendedStrategy` wins Chapter 2 with a move **no player can press**, and the card
is correct to decline it — `advisor.test.ts` has pinned that behaviour since
2026-09-19. The 12.5-point gap is the size of that menu hole, not of the advice.

**This is a question for Bailey (§7), not something to tune.** Never tune a boss.

---

## 6. Rule 14: the game-only parts, and the absence tests

| Part | Case | Why |
|---|---|---|
| planner, band, evaluation, sentence, prior, budget, cache | **both** | properties of advice; measured defects in ch1/ch2/ch3 (FFX) and ch4 (FFX-2) |
| FFX status odds via `estimate.ts#statusOdds` | **FFX only** | X-2 has no `estimate.ts`; adding one is a `src/battle/**` change this track does not own |
| FFX-2 status odds via `statusChanceLinear` | **FFX-2 only** | `resolve.ts#applyRiders` is X-2's own rule [ffx2-combat-core §2.6a] |
| tempo term (`predictTurnOrder`) | **FFX only** | it is on `FFXBattleEngine`; X-2 has no turn list to lose position in |
| gauge-time term | **FFX-2 only** | *not built* — no host supplies it, see §7 |

**Absences asserted, not assumed:**

- `advisor-plan.test.ts` — FFX-2 fields no `switch` row and no self-only meta row, so
  neither of §1.1's and §1.2's repairs can leak into a game without those shapes.
- `advisor-sentence.test.ts` — no card in either game cites a tempo fact or a
  `turnOrder` source while no host supplies the provider, and no reason line mentions
  turn order or a gauge.

---

## 7. For Bailey

1. **Chapter 2's Defend.** The chapter's line spends Yuna's turns on Defend, which
   FFX's command window does not paint, so the auto-battler wins with a move the
   player has no key for and the card has to answer with something else 319 times in
   1 412 decisions. Two honest fixes, and they are yours to pick: give FFX a Defend
   row (a new screen element, so it wants a mockup first), or change Yunalesca's line
   to something pressable. Nothing was changed either way.
2. **The confidence chip.** *certain / likely / gamble* rides inside the sentence
   today. A chip is new paint on a card that has never had a mockup. Do you want the
   advisor-card options round now, or later?
3. **Chapter 3's voice.** Slow lands about two in five and the fight is won by
   landing it twice. The card will therefore sometimes tell you to spend a turn on a
   coin flip, and say so — *"Slow on Yu Pagoda lands about 40 times in 100 — a
   gamble, and the one the chapter is built on."* Is that the voice you want, or
   should it prefer the certain-but-slower line?
4. **A forkable engine.** A true multi-ply search needs `fork()` on both engines — a
   change to `src/battle/common/types.ts`, a contract file, and its own track. Not
   needed for anything above. Queue it, or leave it?

## 8. Known limitations

- **Active ATB staleness (FFX-2).** The card is painted once when the decision opens;
  under Active the clock keeps running, so a survival claim can be true when it is
  written and stale a second later. The plan's §4.7 two-beat paint would fix it and
  needs `src/ui/ffx2/FFX2BattleHud.ts`, which is another track's. The cache
  (`(game, nextSeq, actorId)` + a board digest) already stops the 20 Hz `syncGauges`
  pump re-planning, which was the other half of R-5.
- **The `turnOrder` provider is unwired.** `AdvisorOptions.turnOrder` exists, the
  tempo term reads it, and no HUD passes it yet; with it absent the term is zero and
  is never cited. Wiring it is a one-line change in each FFX HUD and belongs to that
  track.
- **`advisor.ts` is 1 663 lines**, over the 400-line house cap. It was 1 308 before
  this track; the four new files carry everything that could be moved out without
  touching the card's own gate. Splitting the rest is its own commit.

## 9. Files

```
src/engine/tactics/advisor-roll.ts      new
src/engine/tactics/advisor-eval.ts      new
src/engine/tactics/advisor-plan.ts      new
src/engine/tactics/advisor-say.ts       new
src/engine/tactics/advisor.ts           changed
tests/unit/advisor-plan.test.ts         new
tests/unit/advisor-plan-recovery.test.ts new
tests/unit/advisor-sentence.test.ts     new
tests/unit/advisor.test.ts              changed (the licensed override)
tests/unit/advisor-ownership.test.ts    changed (meta rows count as owned)
tests/unit/advisor-noop-guard.test.ts   changed (band-aware; ch3 regression added)
critic/bench/advisor-v2/                new (harness, bench, config, results)
docs/screenshots/advisor-v2-ch1.png     new
docs/screenshots/advisor-v2-ch4.png     new
```

`npx tsc --noEmit` clean for these files; `npm test` 206 files / 5 035 tests green;
`node tools/orphans.mjs` reports nothing under `src/engine/tactics/`.
