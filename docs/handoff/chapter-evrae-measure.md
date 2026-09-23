# Chapter 8 (Evrae, on the deck of the *Fahrenheit*) — measured

**Game case: FFX only** [AGENTS.md rule 14]. Evrae is CTB (`src/battle/ffx/**`);
this note never touches an FFX-2 file.

**What this answers**, the same three questions
`docs/handoff/chapter-leblanc-measure.md` and `critic/bench/macalania` already
asked of the other new chapters: (a) does the engine handoff's own number for
the shipped `intendedStrategy` reproduce in a fresh session's build; (b) what
does the move-advisor card's top row, pressed every turn and nothing else, do
against this fight; (c) Chapter 1 (Seymour Flux, Gagazet) as the control, so a
change in shared advisor or engine plumbing cannot hide behind "only the new
chapter moved."

**Bench:** `critic/bench/evrae/bench.test.ts` (+ its own `vitest.config.ts`,
same pattern as `critic/bench/macalania`). Run:

```
PYREFLY_MEASURE=1 npx vitest run --config critic/bench/evrae/vitest.config.ts
```

Method, identical to `critic/bench/macalania/bench.test.ts`: forty contiguous
seeds per arm, headless, no browser, no DOM. `evrae-airship` resolves the
shipped `evrae` tactic (`src/engine/tactics/index.ts`) for `EVRAE_ID`;
`seymour-flux` is Chapter 1, run the same way as its own control in
`critic/bench/macalania`. **Nothing was tuned to get either number below**
(hard rule 6; memory "boss-side fix needs measured options").

---

## 1. The three arms

| chapter | driver | wins | rate | median turns | KOs | escapes | declines | losing seeds |
|---|---|---:|---:|---:|---:|---:|---:|---|
| evrae-airship | intended | **39/40** | **97.5%** | 98 | 1 | 0 | 0 | 25 |
| evrae-airship | advisor-top-row | **0/40** | **0.0%** | 483.5 | 3 | 37 | 0 | all 40 |
| seymour-flux (control) | intended | 26/40 | 65.0% | 60.5 | 14 | 0 | 0 | 1,3,10,12,14,15,16,18,20,22,25,27,29,36 |
| seymour-flux (control) | advisor-top-row | 27/40 | 67.5% | 66.5 | 13 | 0 | 0 | 1,3,7,10,15,16,18,20,22,27,29,31,36 |

**(a) reproduces exactly.** `docs/handoff/chapter-evrae-engine.md`'s reach-gate
fix pass measured the shipped tactic at **97.5% (39/40), seed 25 the one
loss** — this bench's `intended` row on `evrae-airship` is byte-identical:
39/40, 97.5%, seed 25. The harness and this session's build agree with the
engine work before trusting anything else here.

**(c) reproduces exactly too.** `seymour-flux` intended/advisor-top-row here
(26/40 65.0% / 27/40 67.5%, same losing-seed sets) is byte-identical to
`critic/bench/macalania/results.json`'s Chapter 1 control row. Shared advisor
and engine plumbing has not moved between that session and this one.

---

## 2. (b) is a real, reportable failure — not a bug in the bench

The advisor-top-row arm goes to **0/40**, and it is worth saying plainly why,
since it is a different shape of loss than the intended line's one miss.
Probing seed 1 directly (`buildAdvisorView`, top suggestion, every decision):

- The advisor never once suggests a **range order** (Cid's "pull back" /
  "close in"). Over 370 decisions in the seed-1 run its command mix is
  `{ trigger: 32, attack: 1, item: 65, ability: 270, switch: 2 }` — no `order`
  kind at all.
- Because the range never changes, the fight settles into a long war of
  attrition instead of the intended NEAR-heal / FAR-dodge rhythm
  (`docs/handoff/chapter-evrae-engine.md` §"A-2 is the diagnostic one": *"stays
  NEAR, never orders ... loses 20 of 20 with 88% of the boss's bar still
  up"*).
- Here the outcome is usually **`escape`**, not `defeat`: seed 1 ends at turn
  481 with `outcome: "escape"` after 370 player decisions, and 37 of 40 seeds
  in this arm end the same way (3 end in `defeat`). This reads as the
  engine's own stalemate/long-fight handling ending the encounter, not a
  crash or a bench artifact — the run completes cleanly every time
  (`unresolved` count is 0 across all 160 runs in this bench).

This is exactly the risk `docs/handoff/chapter-evrae-engine.md`'s open
question 3 named: *"The order widget (C-11) is still the chapter's highest
risk and nothing was built for it."* The generic move-advisor has no notion
of this chapter's bespoke range/order mechanic, so a player who only ever
presses the top-row suggestion never engages it — matching the shape (not the
exact outcome label) of the A-2 acceptance case already on record. **Nothing
was tuned in response**; this is reported, not fixed, because the fix belongs
to the advisor or the order-widget track, not to a measurement session, and
because the order widget itself is still unapproved (docs/target/targets.json,
`reaction.inferred`, awaiting Bailey).

---

## 3. Verdict

**(a) the shipped intended line reproduces the engine handoff's number exactly:
97.5% (39/40), seed 25 the only loss.** No boss number was touched to get
there or to keep it. **(c) the Chapter 1 control reproduces its own prior
number exactly**, so the harness and this build are trustworthy. **(b) the
move-advisor's top row alone cannot clear this fight (0/40)** because it never
issues a range order, the chapter's central mechanic — a real gap, not a
regression, and one this track does not have the mandate to close.

This does not block anything: the chapter ships LOCKED as Coming regardless
(art is CANDIDATE), and the advisor gap is a known, disclosed limitation of a
chapter whose defining mechanic (the order widget) has no built UI yet and no
approved design. Options for whoever picks this up next:

1. **Leave it disclosed.** The intended line is what the chapter is measured
   and balanced against (§9.1's own 90% bar, cleared at 97.5%); the advisor's
   blind spot here is no different in kind from any other boss-specific
   mechanic a generic top-row driver cannot see.
2. **Teach the advisor about range orders** once the order widget itself is
   built and approved — before that, there is no player-facing surface for
   the advisor to point at, so building advisor awareness now would be
   guessing at UI that does not exist yet (rule 9, end state first).
3. Do nothing further to the bench; it already reproduces both numbers this
   session needed and its 0/40 finding is now on record for whoever builds
   the order widget or the advisor's mechanic awareness next.

Nothing here recommends one option over another to Bailey; the intended
line's 97.5% is the number this chapter ships measured against.
