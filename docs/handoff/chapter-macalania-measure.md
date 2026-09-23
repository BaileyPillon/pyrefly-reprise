# Chapter 7 (Seymour and Anima, Macalania Temple) — measured

**Game case: FFX only** [AGENTS.md rule 14]. Chapter 7 and its Chapter 1
control are both FFX (CTB); this note never touches an FFX-2 file.

**What this answers:** now that Chapter 7 is registered end to end
(`62b4927`, template `c473de8` "How Leblanc was done"), does the shipped
intended line still hold, and what does the move-advisor card's own top row
do against it — the same two questions `docs/handoff/chapter-leblanc-measure.md`
and `critic/bench/advisor-v2` already asked of the other chapters, asked of
this one, with Chapter 1 (Seymour Flux) as the control so a shared-plumbing
regression cannot hide behind "only the new chapter moved."

**Bench:** `critic/bench/macalania/bench.test.ts` (+ its own
`vitest.config.ts`, same pattern as `critic/bench/leblanc` and
`critic/bench/advisor-v2`). Run:

```
PYREFLY_MEASURE=1 npx vitest run --config critic/bench/macalania/vitest.config.ts
```

Method: forty contiguous seeds per chapter, headless, no DOM, no `three`
(`src/battle/ffx/**` and the tactic file are pure per hard rule 1). Two
drivers per chapter — (a) `intendedStrategy`, which now resolves
`seymourAnimaMacalania` for this group's four combatant ids through
`tacticFor` (`src/engine/BattlePresenterTactics.ts`), the chapter's own
shipped line; (b) the move-advisor's own top row, pressed every turn and
nothing else (a decline is counted, never laundered through the intended
line, same rule `advisor-v2/harness.ts` follows). **Nothing here was tuned**
(hard rule 6; memory "boss-side fix needs measured options") — this bench
reproduces the engine handoff's number to prove the harness and this
session's build agree, then reports what it measures.

---

## 1. Reproduction — does the engine handoff's number reproduce?

| chapter | driver | wins | rate | median turns | KOs | declines |
|---|---|---|---|---|---|---|
| seymour-anima-macalania | intended | **36/40** | **90.0%** | 99.5 | 4 | 0 |
| seymour-anima-macalania | advisor-top-row | 39/40 | 97.5% | 103 | 1 | 0 |
| seymour-flux (control) | intended | 26/40 | 65.0% | 60.5 | 14 | 0 |
| seymour-flux (control) | advisor-top-row | 27/40 | 67.5% | 66.5 | 13 | 0 |

**The intended-line row reproduces `docs/handoff/chapter-macalania-engine.md`
§1's "A-1, current" number exactly: 36/40, 90.0%** (the party-wide Nul fix
already landed and is unchanged by registration — `src/data/encounters.ts`,
`chapter-meta.ts`, the story registry, the tactic registration under all four
combatant ids and the guide entry changed nothing about how the fight itself
plays, as they shouldn't have). **The Chapter 1 control reproduces
`docs/handoff/advisor-v2.md`'s own number for that chapter** (26/40 = 65.0%,
inside its published 62.5–67.5% band; the chapter's own line wins 65%). Both
reproductions hold: this bench's harness and this session's build are
trustworthy, and the advisor row below is measuring the chapter, not a
harness drift.

---

## 2. The advisor's top row beats the chapter's own line here

Chapter 7 is the one chapter measured so far where the card's unmodified top
row (39/40, 97.5%) **out-performs** the chapter's own shipped tactic (36/40,
90.0%) — both comfortably clear `chapter-macalania-engine.md`'s 85% bar,
unlike the still-open five points that tactic itself falls short of the
90%-with-party-wide-Nul ceiling it does reach. The advisor's planner
(`buildAdvisorView` with `planner: true`) evidently reaches the same
party-wide-Nul-shaped answer plus something the fixed, published tactic
rotation does not — median turns and KOs are close between the two drivers
(99.5 vs 103 turns; 4 vs 1 KO), so this is not a faster clear, it is fewer
losses. This bench does not investigate which single decision the advisor
makes differently (out of scope for a measure-only track; hard rule 6 — no
tuning follows from this note); it is reported as a fact for whoever next
touches `seymourAnimaMacalania` or the advisor's FFX planner.

Chapter 1 moves in the same small direction under the advisor (27/40 vs
26/40 intended) as it already does in `docs/handoff/advisor-v2.md`'s own
62.5→67.5% band — consistent with that chapter's advisor number, not a new
finding.

---

## 3. Verdict

**Chapter 7's shipped intended line reproduces exactly (36/40, 90.0%,
`docs/handoff/chapter-macalania-engine.md` §1) and clears its own 85% target**;
the move-advisor's top row clears it by a wider margin (39/40, 97.5%) without
any change to either the tactic or the advisor in this session. Chapter 1's
control reproduces its own published band. Nothing was tuned (hard rule 6).
Chapter 7 stays **LOCKED as Coming** on chapter select regardless of this
result — its art is CANDIDATE, not approved (see
`docs/handoff/chapter-macalania.md`), and Anima's arrival staging is recorded
as `reaction.inferred` in `docs/target/targets.json`, awaiting Bailey's yes,
per AGENTS.md rule 9. No option list is offered here because nothing failed
its bar; this is a measure-only note.

Raw per-seed output: `critic/bench/macalania/results.json`, committed
alongside this note, same as `critic/bench/advisor-v2/results*.json`;
regenerate with the command above.
