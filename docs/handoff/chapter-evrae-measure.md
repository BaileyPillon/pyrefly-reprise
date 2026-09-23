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
| evrae-airship | advisor-top-row (before the fix pass) | **0/40** | **0.0%** | 483.5 | 3 | 37 | 0 | all 40 |
| evrae-airship | advisor-top-row (after the fix pass, 2026-09-23) | **26/40** | **65.0%** | 86 | 14 | 0 | 0 | 1,4,6,9,10,21,22,26,27,32,34,36,37,39 |
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

## 2. (b) The advisor failure, and why: CORRECTED 2026-09-23

**This section's first version was wrong.** It said the advisor "never once suggests a range
order" and that the 0/40 came from the range never changing. An adversarial verifier ran the
real engine (`critic/scratch/evrae/probe/probe3.test.ts`, seeds 1 to 5) and refuted it: the
card suggested range orders often, and the ship sat FAR for 367 of 370 decisions. The real
causes, each proved by running the engine and each fixed with a test that failed first
(`tests/unit/chapters/evrae-advisor.test.ts`, `tests/unit/advisor-stack-cap.test.ts`):

1. **The preview could not see Wakka's reach.** `simulate.ts#runtimeFor` rebuilt the engine
   runtime from `BattleState` and lost `ActorRuntime.rangedWeapon`, so Wakka's Attack at FAR
   (the one physical swing that reaches, research §4.3) previewed as `action-start,
   action-end` and nothing else. The no-op guard then correctly, on what it was shown, put the
   chapter's own line ("Attack") behind every other row: Wakka's top row was Attack on 0 of
   125 to 161 FAR turns. Fix: `markEvraeRuntime` in `evrae-rules.ts`, shared by the setup hook
   and the preview.
2. **A buff at its stack cap was priced as possible.** `advisor-roll.ts` priced every
   stacking buff at its 254 chance byte; FFX's `applyStatus` refuses a sixth stack
   (`statuses.ts:187`). Aim or Cheer on a capped target topped the card 208 to 272 times a
   run. Fix: a capped stacking buff is `blocked` in the band, with each game's own ceiling
   (FFX 5, FFX-2 `STAT_STACK_MAX` 10).
3. **The card named orders the widget refuses.** "Pull back" while already FAR or already
   ordered FAR topped the card 29 to 66 times a run; the order widget greys that row out
   ("Already far" / "Ordered"), so the player could not press it. Fix: one rule,
   `engine/tactics/airship-orders.ts#airshipOrderRefusal`, read by the widget and by the
   advisor's hard gate (`advisor-menu.ts#pressable`). The engine keeps a redundant order
   legal (owner decision C-7 / G-2).

With the three fixed, the verifier's probe reads, seeds 1 to 5: 0 capped-buff tops on the
card's own targets (Cheer on a party with one member below five still tops, correctly),
0 refused orders, Wakka's Attack on top on 12 to 18 of his FAR turns, 3 wins and 2 defeats,
no stalemate. The Evrae HP no longer freezes.

## 3. Verdict (fix pass)

**(a) and (c) still reproduce exactly** after the fix pass: intended 39/40 (seed 25), Chapter
1 control 26/40 and 27/40 with the same losing seeds, and the Evrae rows were byte-identical
again after the `engine.ts` house-style move. **(b) the card's top row now wins 26 of 40
(65.0%)** where it won none, with 0 stalemates (37 before). The 14 losses are defeats. The
shared advisor change (the stack cap) was measured on chapters 1 to 5 with
`critic/bench/advisor-v2` (advisor arm, 40 seeds, before and after): 27, 37, 39, 40, 38 wins,
identical. Nothing was tuned and no boss number changed.

What is still open: the chapter's line asks for Defend when nothing reaches (`harmlessTurn`),
and FFX's command window has no Defend row, so on those turns the card shows its best
simulated row instead of the line. That is a design question about the tactic, not a
measurement one, and it is recorded in `docs/handoff/chapter-evrae.md`.
