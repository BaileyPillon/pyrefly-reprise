# Paper preflight — Move Advisor v2 (the per-turn planner)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: docs only, 5–10 minutes of paper before
> anything is built. Nothing in this pass changes shipped code.
>
> **Owner's words, 2026-09-21:** *"the move advisor needs to be way smarter and way
> more aware of what is going on turn by turn and what character you are
> controlling."* Earlier, on the live build: *"im controlling tidus but the advisor
> is telling me to use poison fang? how does that make sense? and what about
> reviving yuna?"*
>
> **Verdict: PROCEED**, with three conditions in §11.

Written 2026-09-21. History read: `docs/handoff/fix3-advisor.md` (all four passes plus
the pre-release pass and the browser half), `critic/rounds/round-06.json` PR-0006,
`src/engine/tactics/advisor*.ts`, `guide.ts`, both engines' public API
(`src/battle/common/types.ts` §BattleEngine, `ffx/simulate.ts`, `ffx2/simulate.ts`,
`ffx/intent.ts`, `ffx2/intent.ts`, `ffx/turnQueue.ts`).

---

## 1. Game case (AGENTS.md rule 14)

**Both**, with two named game-only parts. The advisor is one card over two engines and
"advise the character whose turn it is, from what is true this turn" is a property of
*advice*, not of CTB or ATB — the same reading `critic/CHECKS.md` CHK-020 and pass 4 of
the handoff already took for `advisor-guard.ts`.

| Part | Case | Why, from the sources |
|---|---|---|
| Planner, evaluation, the cited sentence, the prior rule, silence | **both** | shared plumbing; measured defects exist in ch1/ch3 (FFX) and ch4 (FFX-2) |
| **Tempo** term = CTB tick delta from `predictTurnOrder(n, previewCommand)` | **FFX only** | `predictTurnOrder` is on `FFXBattleEngine`, not on `FFX2BattleEngine` (`types.ts:2274-2286`); X-2 has no turn list to lose position in |
| **Gauge time** term = ATB ticks an action costs against the enemies' gauges | **FFX-2 only** | `gaugeSnapshot()` / `AtbSnapshot` is X-2's half of the same interface; FFX has no clock running under the menu |
| The Zombie / Full-Life reading in the sentence | **FFX only** | X-2's data layer defines no `zombie` anywhere (`src/data/ffx2/**`, `src/battle/ffx2/**`); already gated on `state.game === 'ffx'` in `advisor-floor.ts` |
| "Advice must be ready instantly and update as the board changes" | **FFX-2 only** | Active ATB (Bailey, 2026-09-21: Active only, no Wait toggle); FFX's CTB stops for the menu |

Absence test for the build: an X-2 card must never print the word *Full-Life* or a CTB
tempo claim; an FFX card must never print a gauge-time claim. Both are one assertion
each over all five chapters, in the pattern `advisor-floor.test.ts` already uses.

---

## 2. What is actually wrong — measured, not argued (hard rule 3)

Everything below was produced this session by running the real engines headless, with
the shipped tactics and the shipped advisor, through the harness
`tests/unit/advisor-noop-guard.test.ts` already uses (`createFFXEngine` / `FFX2Engine`,
`CHAPTERS`, `buildAdvisorView`, `intendedStrategy`). Scratch files were removed after
the run; every command needed to reproduce is in §10.

### 2.1 Following the card loses Chapter 3 outright, and costs Chapter 2 a seed

Six seeds per chapter, two drivers. *intended* = `intendedStrategy` (the auto-battler,
i.e. the chapter's own line). *guided* = a bot that presses the advisor's top row every
turn — the route Bailey's complaint and PR-0006 describe.

| Chapter | intended (6 seeds) | guided (6 seeds) | decisions int / guided |
|---|---|---|---|
| 1 Seymour Flux (FFX) | 4 W / 2 L | 4 W / 2 L | 239 / 239 |
| 2 Yunalesca (FFX) | **6 W** | **5 W / 1 L** | 921 / 1 074 |
| 3 Braska's Final Aeon (FFX) | **6 W** | **0 W — 4 defeats, 2 stalemates** | 840 / 1 433 |
| 4 Bahamut (FFX-2) | 6 W | 6 W | 287 / 287 |
| 5 Vegnagun → Shuyin (FFX-2) | 6 W | 6 W | 129 / 142 |

A "stalemate" is the engine's own watchdog: 400 turns with no progress ends the battle
as `escape` with *"The battle cannot be won from here."* (`ffx/engine.ts:459-464`).

Chapter 3 is the ticket. A player who follows the card through it **cannot win**, and
the fight takes 70 % more decisions on the way to losing. This matches and extends the
handoff's own note (pass 4, "Also measured, not in this ticket": 0 W over twelve seeds
either side of the no-op guard).

### 2.2 The root cause: the preview answers a probabilistic branch at its median, and
the advisor then scores the fight's winning move as the worst thing on the board

Chapter 3 seed 1, the first four decisions where the card diverges from the chapter's
line — every one of them is Tidus, and every one of them is the same move:

```
decision  7 Tidus  guide=item:x-potion->Tidus   intended=ability:slow->Yu Pagoda
decision 12 Tidus  guide=item:x-potion->Yuna    intended=ability:slow->Yu Pagoda
decision 14 Tidus  guide=ability:cheer->Tidus   intended=ability:slow->Yu Pagoda
decision 16 Tidus  guide=ability:cheer->Tidus   intended=ability:slow->Yu Pagoda
```

Probing the same decisions through the advisor's own machinery:

```
decision 7: target Yu Pagoda  statuses={}          <- NOT already slowed
  sim(roll:'mid'): rejected=false damageToEnemies=0 statusChanges=[]
  changesNothing=true   scoreOutcome=-3018
  advisor top = "X-Potion" score=6492
```

and the same three lines at decisions 12, 14 and 16 (`Cheer`, score 900, wins).

Then the engine, playing the chapter's line for real:

```
seed 1: slow attempts=2  status-add slow = 2, both on a Yu Pagoda | victory, 207 turns
seed 2: slow attempts=4  status-add slow = 2, both on a Yu Pagoda | victory, 210 turns
seed 3: slow attempts=5  status-add slow = 2, both on a Yu Pagoda | victory, 223 turns
```

So: **Slow lands** — 2 of 2, 2 of 4, 2 of 5 attempts — and getting it onto both pagodas
is how the fight is won. The preview, which answers every branch roll at its median
(`ffx/simulate.ts` `RollPolicyRng`, and the handoff's pass 4 says so in as many words),
reports **zero** status changes, so:

1. `scoreOutcome` applies `WASTED_TURN_PENALTY` (−3 000) and lands on −3 018; and
2. `changesNothing` classes it *inert* and `buildAdvisorView` sorts it behind every row
   that does something.

The chapter's designed, sourced, winning move is penalised twice for being a coin flip,
and the card answers "what do I press" with Cheer. **This is the same defect family as
PR-0006 with the sign reversed**: PR-0006 was the chapter line surviving when it did
nothing; this is the chapter line being dropped when it does the one thing that wins.
Any planner that keeps a single median read of a probabilistic outcome inherits it.

### 2.3 The two older halves, still open

- **One ply.** The scorer reads one resolved action on a throwaway board. Nothing in it
  can see that Slow on a pagoda pays off over twenty turns, that spending Yuna's turn
  now costs the party the Holy Water it needs at the phase change, or that a raise
  lands the ally back in the path of a telegraphed sweep two actions later. The revive
  rules (`advisor-revive.ts` + `advisor-forecast.ts`) are the *only* place the advisor
  looks past its own action today, and they were built for one yes/no question.
- **The prior is a pin, not a prior.** `tacticSuggestion` puts the chapter's line at row
  1 whenever this actor can press it; the ranking only re-orders behind it. The handoff
  has left the question "may a much higher simulated score outrank the pinned pick?"
  open for Bailey across three passes (Mega Phoenix priced at 11 300 against the line's
  555, and the line still won). **Bailey has now answered it: yes.**

---

## 3. What the code can and cannot be handed (the constraint that shapes the design)

The advisor is given a `BattleState` and a `Decision`, never an engine
(`buildAdvisorView(state, decision, options)`; the HUDs call it from `sync`). Neither
engine exposes a fork, a snapshot or a restore. So a "clone the engine and roll the
horizon" planner has exactly three honest substrates, and they are not the same in the
two games:

| | FFX | FFX-2 |
|---|---|---|
| Board (HP, statuses, forms, flags) | in `BattleState` | in `BattleState` |
| Enemy AI scratch | **not carried** — `rt.actors[*].ai`, `charge` live in the runtime; `ctxFromState` (`advisor-forecast.ts:120`) rebuilds what it can and the charge ladder is read back out of the log | **carried** — `setup.ts:248` does `combatants[unit.id] = unit`, and `Ffx2Unit extends FFX2Combatant`, so `aiMemory`, `pendingCommand`, `thinkingTicks` and `atb` are all *in the public state* |
| Turn tempo | **not carried** — CTB counters are `rt.actors[*].ctb`; but `predictTurnOrder(n, previewCommand)` is on the engine facade and already answers "what does this command do to the turn list" | **carried** — `atb` per combatant, plus `gaugeSnapshot()` |
| Running the real enemy AI on a hypothetical board | `predictEnemyIntent` on a rebuilt `Ctx` — 3 samples/enemy, ≤3 enemies, **1.48 ms mean / 2.09 ms p95** measured | `predictFFX2EnemyIntent` straight from state — **0.60 ms mean / 1.69 ms p95** measured |

**Consequence, and it is the main design decision in this document:** a true multi-ply
tree search would need a forkable engine, which does not exist and which is a change to
`src/battle/common/types.ts` — a `docs/CONTRACTS.md` file. That is a separate track (§9,
question 2). What *is* available today is a real, affordable **1.5-ply** horizon:

> the actor's action, resolved by the engine's own damage chain across the roll band —
> then the real enemy AI's next telegraphed action, scored as a predicted consequence on
> the resulting board.

That is enough for every failure in §2 and for the brief's "the boss's next big move
survived". It is not enough for "play out the rest of the round"; the plan says so
rather than pretending otherwise.

---

## 4. The design

Five new pure, DOM-free modules beside the existing ones, each under the 400-line house
cap, driven from `buildAdvisorView`. Nothing in `src/battle/**` changes.

### 4.1 `advisor-plan.ts` — the planner

```ts
export interface PlanRequest {
  state: Readonly<BattleState>;
  actorId: CombatantId;            // the character the player is controlling, always
  commands: readonly AvailableCommand[]; // THIS turn's menu, nothing else
  prior: Command | null;           // the chapter line, via recommendedCommand()
  options: AdvisorOptions;
  budget: PlanBudget;              // counts, not milliseconds — see 4.6
}
export interface PlanResult {
  ranked: PlannedMove[];           // best first; [] means "say nothing"
  facts: BoardFact[];              // only facts a simulation or the forecast proved
  confidence: 'certain' | 'likely' | 'gamble';
}
```

**Stage 1 — enumerate, from the menu only.** Candidates are `row × target` drawn from
`decision.commands`: `row.enabled`, `onTheMenu(state.game, row.command)`,
`ownedRow(...) !== null`, and every aimed id in that row's own `validTargets`. This is
today's gate and it is not loosened — it is the thing that makes "never names a move
the actor cannot press" true by construction rather than by test. Measured branching:
**42.5 enabled rows mean, 55 max (FFX ch1); 15.5 mean, 17 max (FFX-2 ch4)**.

Aiming stays `aimCandidates`, widened by two entries and capped at 4 (from 3): *the ally
the forecast says is about to die*, and *the target the prior names*.

**Stage 2 — shortlist.** Every candidate gets one `simulate*Command(roll:'mid')` and
today's `scoreOutcome`, exactly as now. Keep the top **K = 8 (FFX) / 6 (FFX-2)**, plus
the prior's candidate unconditionally. **Nothing is dropped for being inert at this
stage** — that classification moves to stage 3, because the median roll is precisely
what got Chapter 3 wrong (§2.2).

**Stage 3 — the roll band, then the horizon.** For each shortlisted candidate:

- resolve it at **three roll weights** — `low`, `mid`, `high` — and take the expectation
  with weights 0.25 / 0.5 / 0.25. A 40 %-chance Slow lands in the `high` read, so it
  scores as the 40 % it is instead of as a wasted turn. `changesNothing` is rewritten to
  take the whole band: **inert only when every weight is empty.**
- then ask the real enemy AI what it does to the resulting board, through
  `forecastFromState` on the post-action state (FFX-2: straight from state; FFX: through
  `ctxFromState`). `AdvisorIntent.estimate.perTarget[{targetId, amount, lethal}]` is
  already exactly the "does the party survive the boss's next big move" input, and it
  costs 1.5 ms / 0.6 ms.
- the post-action forecast is re-run for the **top 3 only**; the rest reuse the
  pre-action forecast, tagged `forecast:pre`, and **a pre-action forecast may never be
  cited in the sentence as a post-action fact**.

### 4.2 `advisor-eval.ts` — the transparent evaluation

One vector, every term named, each term emitting a `BoardFact` carrying the number that
produced it and *what proved it* (`'sim' | 'forecast' | 'state' | 'turnOrder'`):

| # | Term | Read from |
|---|---|---|
| 1 | party alive and healthy after the forecast's action | expected HP per ally minus `estimate.perTarget.amount`; `lethal` is a large negative |
| 2 | statuses that matter **now** | existing `CURE_VALUE` / `INFLICT_VALUE` tables; the Zombie-before-a-Full-Life reading stays FFX-only and sourced [ffx-seymour-flux §4.8, §3.3] |
| 3 | boss's next big move survived | term 1 restricted to the telegraphed action; `charge.turnsLeft` from the forecast |
| 4 | damage and phase progress | expected damage across the band; a phase threshold crossed is worth more than the raw HP |
| 5 | resources kept for the phase that needs them | MP (existing `MP_WEIGHT`) plus item counts read from `state.flags['inventory:<id>']`, weighted against what the chapter's later phase needs |
| 6 | **tempo (FFX)** | `predictTurnOrder(10, previewCommand)` tick-value delta — the engine's own answer, not a model of it |
| 6′ | **gauge time (FFX-2)** | `atb` on the state's own combatants + `AtbSnapshot`: how many enemy gauge fills this action costs |
| 7 | the prior | see 4.3 |

Terms 6 / 6′ are the only ones that need something the advisor is not handed today. The
fix is one optional provider on `AdvisorOptions`:
`turnOrder?: (previewCommand?: Command) => TurnPreview[]`, supplied by the HUD (the
presenter already computes exactly this — `BattlePresenterUtil.previewOf(engine, cmd)` —
and hands the *result* to `HudPort.sync`). **When it is absent the tempo term is zero and
tempo is never cited.** Neither `HudPort.ts` nor `AdvisorOptions` is a contract file, so
this is additive and cheap; and the planner is complete without it, which keeps the
tests engine-only.

### 4.3 The prior: names the plan, breaks ties, never pins

`recommendedCommand` still runs first and is still the only thing that decides *what the
chapter is about*. Then:

- the prior's candidate gets `PRIOR_BONUS` — large enough to win every tie and to hold
  through evaluation noise;
- another candidate takes the top row only when it beats the prior by `PRIOR_MARGIN`
  (a ratio, not a constant, so it reads the same at Chapter 1's numbers and Chapter 3's);
- **the prior is never demoted for being probabilistic** — it is inert only if it is
  inert at every roll weight (§4.1);
- when a non-prior move wins, the card says so in one clause: the long plan is named,
  and the reason this turn is different is the cited fact.

This is Bailey's answer to the three-pass-old open question, in code: *the ranking may
outrank the guide.* The auto-battler is untouched, so §2.1's `intended` column stays the
baseline the acceptance bar is measured against.

### 4.4 `advisor-say.ts` — one sentence, every claim re-derivable

The sentence is assembled from at most two `BoardFact`s, never from a per-chapter
template. Shape: *what is true on the board* → *therefore this move* → *what it buys*.

> "Yuna is down and Zombied: Holy Water first, the next Full-Life would kill her."
> "Both pagodas act on the same clock as Braska: Slow the unslowed one — it lands about
> two times in five, and it is how this fight gets shorter."

Rules, all testable:

- every fact cites a value the same simulation / forecast produced, with its source tag;
- a fact from a `forecast:pre` read may not be worded as a consequence of the action;
- the confidence word is **inside the sentence** — *certain* (every roll weight agrees
  and the forecast is `'scripted'`), *likely* (a majority), *gamble* (the branch decides
  it) — because a confidence **chip** is new paint on a card with no approved target
  (§11, condition 3);
- no fact clears its threshold → the sentence is `''`. **Silent rather than wrong** is
  the existing rule of `noteFor` and it is kept verbatim.

### 4.5 What does not change

The hard gate (`ownedRow` + `onTheMenu`), the actor binding, `advisor-menu.ts`'s
per-game submenu chips, `advisor-floor.ts`'s "an ally on the floor always gets an
answer", `advisor-revive.ts`'s pricing, `guide.ts`, `intendedStrategy`, and every
engine file. `MoveAdvisor.ts` keeps its channels: the planner fills `reason`, `warning`
and `note`, and adds no new element.

### 4.6 Speed, and why the budget is counts rather than milliseconds

Measured today, per decision, on this machine:

| | FFX ch1 | FFX-2 ch4 |
|---|---|---|
| `buildAdvisorView` mean | **9.98 ms** | **3.42 ms** |
| p95 / max | 14.41 / 16.74 ms | 6.71 / 8.31 ms |
| candidates considered (mean) | 57.4 (cap 60) | 25.2 |
| one `forecastFromState` | 1.48 ms | 0.60 ms |

One `simulate*Command` therefore costs ≈ 0.17 ms. Projected v2, per decision:

- stage 2 with `MAX_SIMULATIONS` cut 60 → 40: ≈ 7 ms (FFX) / 3 ms (FFX-2)
- stage 3 roll band: K(8) × 2 extra rolls × 0.17 ≈ 2.7 ms / 2.0 ms
- stage 3 post-action forecasts, top 3 only: 3 × 1.5 ≈ 4.5 ms / 1.8 ms

**Budget: 15 ms typical, 25 ms ceiling (FFX); 8 ms typical, 12 ms ceiling (FFX-2).**

The budget is expressed and enforced as **work counts** (simulations, forecasts,
candidates), *not* as a wall-clock deadline: a clock-based cut would make the card's
answer depend on how busy the machine is, which breaks determinism under the seed and
would make every acceptance run unreproducible. A wall-clock guard exists only as a
last-resort circuit breaker that falls back to the stage-2 answer, and the test config
disables it. **This is a named risk (§8, R-2) and the one thing most likely to be got
wrong in the build.**

Caching: one plan per `(state.nextSeq, actorId)`. The FFX-2 Active pump runs at 20 Hz
through `syncGauges`, which must **never** trigger a re-plan; only `showDecision` does.

### 4.7 Active ATB (FFX-2 only — rule 14)

Under Active the clock runs while the menu is open (Bailey, 2026-09-21: Active only).
So the plan is painted in two beats:

1. **beat 1, on open:** stage 2 only — 3.4 ms measured, i.e. on screen in the same
   frame. The card is correct, just not yet deep.
2. **beat 2:** stages 3–5, painted when they land. If `state.nextSeq` moved under it the
   result is discarded rather than painted, so a stale plan can never reach the card —
   the failure mode PR-0055 refuted from the browser side and which must not be
   re-introduced.

FFX gets one beat: CTB stops for the menu, so there is nothing to race.

---

## 5. Files

**New** (all pure, all under 400 lines, all `src/engine/tactics/`):

- `advisor-plan.ts` — enumeration, shortlist, roll band, horizon, budget. ~220 lines.
- `advisor-eval.ts` — the seven terms and `BoardFact`. ~200 lines.
- `advisor-say.ts` — the sentence, the confidence word, the silence rule. ~150 lines.
- `advisor-roll.ts` — the three-weight expectation and the band-aware inert test. ~90.

**Changed:**

- `advisor.ts` — `buildAdvisorView` delegates ordering and the note to the planner;
  the hard gate and the floor note stay where they are. Net: smaller, not larger.
- `advisor-guard.ts` — `changesNothing` gains a band overload (`readonly (SimOutcome|null)[]`);
  the single-outcome signature stays so its nine existing tests keep meaning what they
  mean.
- `src/ui/common/MoveAdvisor.ts` — **preferably untouched.** Touching it makes the
  change "global layout, input and boot" for `critic-plan` (§7).
- *Optional, other track:* `src/ui/ffx/FFXBattleHud.ts`, `src/ui/ffx2/FFX2BattleHud.ts`,
  `src/engine/HudPort.ts` — pass the `turnOrder` provider. Additive; the planner works
  without it.

**Tests:**

- `tests/unit/advisor-plan.test.ts` — the acceptance bot at **6 seeds** (suite-safe).
- `tests/unit/advisor-plan-recovery.test.ts` — the seeded bad states.
- `tests/unit/advisor-sentence.test.ts` — every cited fact re-derived; silence.
- `tests/unit/advisor-plan-budget.test.ts` — work-count caps; the same board planned
  twice gives the identical view; determinism across a fresh process.
- `tests/unit/advisor-noop-guard.test.ts` — extended with the Chapter 3 Slow board as a
  regression (the card must not answer Cheer there).
- `critic/bench/advisor-v2/` — the **40-seed × 5-chapter** run, under its own vitest
  config, the way `critic/rounds/round-06/bench/` already does it. Measured cost basis:
  6 seeds × 5 chapters guided = 7.5 s wall today; 40 seeds at v2's ~2.5× work ≈ 2 min.
  That does not belong in a 110-file `npm test`.

**Docs:** `docs/handoff/fix3-advisor.md` (a pass-5 section), `docs/handoff/NOW.md`, and
`docs/CONTRACT-CHANGES.md` only if the `turnOrder` seam ends up touching a contract file
(on the plan above, it does not).

---

## 6. Acceptance — how each clause in the brief is checked

| Brief's clause | The check | Baseline to beat (measured, §2.1, 6 seeds) |
|---|---|---|
| a bot that follows the card wins each chapter ≥ intended − 5 pts over 40 seeds | `critic/bench/advisor-v2/`, both drivers, same seeds, same harness | ch1 67 %, ch2 100 %, **ch3 100 %**, ch4 100 %, ch5 100 % → bars 62 / 95 / **95** / 95 / 95 |
| recovers from a seeded bad state in each chapter | inject via the chapter's own opening plus a scripted prefix of commands (an ally KO'd, a status on, MP spent), then run guided to an outcome | today ch3 guided = 0 W from a *clean* start, so this is the sharper bar |
| never names a move the actor cannot press | already true by construction (`ownedRow` + `onTheMenu`), asserted every decision of every seed | `advisor-menu.test.ts` pattern |
| never recommends a no-op | band-aware `changesNothing` at every decision — and the ch3 Slow board asserted *not* to be a no-op | 226 caught today; must stay ≥ 0 false positives |
| its sentence is true of the board | every `BoardFact` re-derived from the same `SimOutcome` / forecast inside the assertion | new |
| fast | work-count caps asserted; wall time reported, not asserted | 9.98 / 3.42 ms today |
| deterministic under the seed | same seed twice → byte-identical `AdvisorView`, in-process and across processes | new |
| silent rather than wrong | no sentence without a cleared fact; no `forecast:pre` fact worded as a consequence | `advisor-note.test.ts` rules (b)–(d) |

**The one that decides whether this shipped:** Chapter 3 guided has to go from **0 of 6**
to **at least 38 of 40**. If the build cannot clear that, the honest outcome is to ship
the §2.2 repair alone (the roll band) and re-preflight the rest — see §11.

---

## 7. Which review this needs

`node tools/critic-plan.mjs --paths …` was run twice:

- advisor files only (`advisor.ts`, `advisor-plan.ts`, `advisor-eval.ts`, `advisor-say.ts`,
  `advisor-guard.ts`) → **DEEP**, `because: a deep review is still owed from 8f48237`;
  systems *move advisor and enemy intent*; targets *fight*; checks CHK-004, 005, 007,
  016, 017, 020, 021.
- the same plus `src/ui/common/MoveAdvisor.ts` → **DEEP on its own merits**,
  `because: src/ui/common/MoveAdvisor.ts: global layout, input and boot is a shared
  system`; adds CHK-002, 003, 008, 009, 015 and the *pause / phone / presentation*
  targets.

Both games, all five chapters. Obligations either way: `live + focused + deep`.
**Keeping `MoveAdvisor.ts` untouched is worth real money on the review**, which is why
§4.4 routes the sentence through the channels the card already paints.

---

## 8. Risks

| | Risk | Weight | Mitigation |
|---|---|---|---|
| R-1 | The roll band changes *every* score, so chapters 1, 2, 4 and 5 can regress while 3 is fixed. | **high** | the 40-seed bench is run before and after, per chapter; a regression anywhere is a stop, not a trade |
| R-2 | A wall-clock budget silently breaks determinism under the seed. | **high** | budget is work counts; the clock is a circuit breaker only, disabled in tests; asserted by the same-seed-twice test |
| R-3 | FFX's rebuilt `Ctx` has no CTB counters and no AI scratch, so an FFX horizon is approximate. | medium | the forecast already ships on exactly this basis and says why (`advisor-forecast.ts` header); tempo comes from `predictTurnOrder` when wired, and is **not cited** when it is not |
| R-4 | Cost creeps past the budget on a wide FFX menu (55 rows measured). | medium | `MAX_SIMULATIONS` 60 → 40, K = 8, post-action forecast for the top 3 only; the budget test fails the build, not the frame rate |
| R-5 | Active ATB: a plan painted after the board moved. | medium | `(nextSeq, actorId)` cache key, two-beat paint, discard on mismatch; `syncGauges` never re-plans |
| R-6 | The prior loosening makes the card and the auto-battler teach different fights — the thing three passes deliberately would not do without Bailey. | medium | Bailey answered it 2026-09-21; the margin is a ratio and the sentence always names the long plan; the bot's win rate against `intended` is the guard rail |
| R-7 | The sentence over-claims from a `forecast:pre` read. | medium | source tags on every fact + an assertion per decision |
| R-8 | Chapter 3 might need more than 1.5 plies. | medium | if the bench cannot clear 38/40 after the roll band and the prior fix, stop and re-preflight rather than deepening the horizon by feel (rule 15's two-attempt cap) |
| R-9 | Shared tree: `advisor*.ts` is this track's, but `MoveAdvisor.ts` and both HUDs belong to other tracks in flight. | low | do not touch them; the optional `turnOrder` seam is a follow-up ticket |

---

## 9. Questions for Bailey

1. **The confidence word.** The brief asks the card to be honest about *certain /
   likely / gamble*. The advisor card has **no approved target tile** — the board's own
   "waiting" list says so: *"Move advisor, enemy next-move panel and defeat screen …
   exist only in your words or mine. One mockup of each would settle what right looks
   like."* So: may the word ride **inside the sentence** now (no new paint, buildable
   this build), with the chip waiting for the advisor-card options round you are already
   owed? That is what this plan assumes.
2. **A forkable engine.** A true multi-ply search needs `fork()` on both engines — a
   change to `src/battle/common/types.ts`, a contract file, and its own track. This plan
   does not need it and does not ask for it. Worth queueing separately, or leave it?
3. **Chapter 3's line.** Slow lands about 2 times in 5 and the fight is won by getting it
   onto both pagodas. The card will therefore sometimes tell you to spend a turn on a
   coin flip and say so in those words. Is that the voice you want, or should the card
   prefer the certain-but-slower line and only mention the gamble?

---

## 10. How to reproduce every number in §2

From the repo root, Node 24, using the harness in `tests/unit/advisor-noop-guard.test.ts`
(engines built with `createFFXEngine` / `FFX2Engine` from `CHAPTERS`, driven decision by
decision, `intendedStrategy(actorId, commands, engine)` for the *intended* column and
`buildAdvisorView(...).suggestions[0].command` for the *guided* column):

- **§2.1** six seeds (1–6) per chapter per driver, `MAX_STEPS` 30 000, outcome tallied
  from `Decision.kind === 'battle-over'`.
- **§2.2 divergence** the same loop, logging both drivers' picks side by side without
  submitting the intended one.
- **§2.2 probe** at each divergence: `simulateFFXCommand(state, actorId, intended,
  {roll:'mid', content})`, then `changesNothing(...)` and `scoreOutcome(...)`.
- **§2.2 landings** the intended route, counting `status-add` events with
  `status === 'slow'` in `engine.state().log`.
- **§4.6 cost** `performance.now()` around `buildAdvisorView` over the first 60 decisions
  of ch1 and ch4 at seed 1; `forecastFromState` timed 20× on a live board.

The scratch test files were deleted after the run; §5's `critic/bench/advisor-v2/`
turns them into the permanent version.

---

## 11. Verdict — **PROCEED**, with three conditions

The defect is real, measured, and larger than the ticket said: following the card does
not merely waste turns, it **loses Chapter 3 six times out of six** while the chapter's
own line wins six out of six. The root cause is identified to a single line of
behaviour (a probabilistic branch answered at its median, then penalised twice), and the
fix for it is small and testable on its own. The wider planner is affordable inside the
measured budget without any change to `src/battle/**` or to any contract file.

1. **Build the §2.2 repair first and land it green on its own** — the roll band plus the
   band-aware inert test — and re-run the 40-seed bench before writing a line of
   `advisor-plan.ts`. If that alone moves Chapter 3 to 38/40, the planner is a smaller
   job than this document assumes and should be re-scoped.
2. **The budget is work counts, not milliseconds** (R-2). Determinism under the seed is
   not negotiable; it is what every acceptance number in §6 rests on.
3. **No new paint on the card** (§4.4, question 1): the confidence word rides inside the
   sentence and `MoveAdvisor.ts` stays untouched until the advisor-card options round
   Bailey is already owed. That keeps rule 9 satisfied and keeps `critic-plan` off
   "global layout, input and boot".

Stop-and-report triggers (rule 15): two failed attempts at the Chapter 3 bar; any
regression in chapters 1, 2, 4 or 5 that survives one repair; the budget test going red
twice.
