# Chapter 6 (The Leblanc Syndicate) under Active ATB — measured

**Game case: FFX-2 only** [AGENTS.md rule 14]. Chapter 6 is FFX-2; this note
never touches an FFX chapter or FFX-only file.

**What this answers:** now that Chapter 6 is registered end to end
(`c473de8`) and plays under D-009's **Active** ATB (no Wait toggle,
`docs/handoff/ffx2-active-atb.md`), does the shipped intended line still win
when a real human, not an instant auto-battler, is answering the menus? Same
question `docs/handoff/ffx2-active-atb.md` and `docs/handoff/chapter-leblanc-engine.md`
§1 already asked of Chapters 4, 5 and 6 respectively — this note re-runs it in
one fresh session, one harness, one build, with Chapter 4 as the control, and
then goes one step further: it probes *how fast* a human would have to answer
for the line to hold, since the headline arms fail.

**Bench:** `critic/bench/leblanc/bench.test.ts` (+ its own `vitest.config.ts`,
same pattern as `critic/bench/advisor-v2`). Run:

```
PYREFLY_MEASURE=1 npx vitest run --config critic/bench/leblanc/vitest.config.ts
```

Method, identical to `tests/unit/ffx2-active-measure.test.ts`: forty
contiguous seeds per arm, the shipped `intendedStrategy` (which resolves to
`ffx2Leblanc` for this chapter's bosses, `src/engine/tactics/index.ts`), a
fake clock, no browser. `D` is a **modelled human decision time — an input to
a measurement, not game data**: at every `'player-input'` decision the driver
hands the engine `D` ms of `throughInput` clock, then submits the strategy's
pick. `D = 0` is today's behaviour and the regression control. Chapter 6 is
the whole three-act mission, chained through the same `setupForNextLink` the
real chapter screen uses (Act I → Act II → Act III, one pool of HP/MP/items —
`docs/handoff/chapter-leblanc-engine.md` §"Where the difficulty actually
lives"). **Nothing was tuned to get any of these numbers** (hard rule 6,
memory "boss-side fix needs measured options").

---

## 1. The three headline arms (control + Chapter 6)

| chapter | D | wins | median s | worst s | player turns | enemy actions | KOs | menus invalidated | commands refused |
|---|---|---|---|---|---|---|---|---|---|
| ch4 Bahamut (control) | 0 ms | **40/40** | 100.7 | 108.0 | 47 | 19 | 1 | 0 | 0 |
| ch4 Bahamut (control) | 1500 ms | **40/40** | 170.1 | 196.1 | 51 | 30 | 1 | 510 | 0 |
| ch4 Bahamut (control) | 4000 ms | **40/40** | 229.7 | 262.2 | 55 | 42 | 1 | 762 | 0 |
| ch6 Leblanc | 0 ms | **40/40** | 74.2 | 151.3 | 45 | 22 | 8 | 0 | 0 |
| ch6 Leblanc | 1500 ms | **4/40** | 185.9 | 328.0 | 57 | 81 | 10 | 755 | 4 |
| ch6 Leblanc | 4000 ms | **0/40** | 176.2 | 435.9 | 28 | 37 | 10 | 531 | 0 |

The Chapter 4 row is **byte-identical** to `docs/handoff/ffx2-active-atb.md`
§2 (same 40/40, 40/40, 40/40; same medians 100.7/170.1/229.7): the control
reproduces, so the harness and this session's build are trustworthy. The
Chapter 6 row is **byte-identical** to `docs/handoff/chapter-leblanc-engine.md`
§1's A1 line (40/40, 4/40, 0/40): registering the chapter end to end
(`src/data/encounters.ts`, chapter-meta, story registry, tactics, guide,
coming-chapters) changed nothing about how the fight itself plays, as it
shouldn't have.

**Chapter 4 survives Active. Chapter 6 does not**, for the shipped intended
line, matching the pattern `docs/handoff/ffx2-active-atb.md` already found for
Chapter 5 (40/40 → 0/40 at both non-zero arms). Chapter 6 sits between the
two: it holds a little ground at 1.5 s (4/40, not 0/40) but is gone by 4 s.

---

## 2. Why it fails: not a new mechanic, three fights on one pool

`docs/handoff/chapter-leblanc-engine.md` already named the shape: Act III
alone from full HP is a 12-turn, single-fight win; the mission is hard because
it is **three chained fights sharing one pool of HP, MP and items**, not
because any one room's stat block is hard. Active ATB adds a second,
independent tax on top of that pool: `menus invalidated` climbs from 0 at
D = 0 ms to 531–755 at the non-zero arms (a menu reopening after a chain-lock
or a KO, per `docs/handoff/ffx2-active-atb.md` §2's own reading of that
counter), and every reopened menu is time the enemies keep acting under. Three
short fights amplify a per-decision tax that one long fight (Chapter 4) can
absorb.

---

## 3. Measured options — how fast would a human have to answer?

Since the line fails at both human-shaped arms, this session probed decision
times *below* 1500 ms with the same bench, same seeds, same harness — to
answer "how fast" rather than leaving it at "not this fast":

| chapter | D | wins | median s | worst s | player turns | enemy actions | KOs | menus invalidated | commands refused |
|---|---|---|---|---|---|---|---|---|---|
| ch6 Leblanc | 500 ms | **35/40 (87.5%)** | 124.6 | 323.3 | 60 | 35 | 8 | 175 | 2 |
| ch6 Leblanc | 750 ms | **25/40 (62.5%)** | 181.6 | 283.1 | 71 | 68 | 10 | 358 | 2 |
| ch6 Leblanc | 1000 ms | **12/40 (30.0%)** | 197.1 | 822.8 | 70 | 89 | 10 | 603 | 3 |
| ch6 Leblanc | 1250 ms | **5/40 (12.5%)** | 180.7 | 475.9 | 61 | 75 | 9 | 599 | 5 |

The win rate does not fall off a cliff at one point; it degrades steadily
from 100% (D=0) through 87.5% (D=500) down to single digits by D=1250, and it
is already 4/40 at the shipped 1500 ms arm. **`docs/handoff/chapter-leblanc-engine.md`'s
own bar is ≥ 90%, which only the D = 0 ms arm clears** — even the fastest arm
measured here (500 ms) falls short of it. These four extra rows are, like the
three headline arms, **measured, not modelled from a formula** — the harness
charges the full `D` at every decision including reflex-fast re-offers after
an invalidation, so every row here is an upper bound on real cost, the same
caveat `docs/handoff/ffx2-active-atb.md` §2 notes for its own arms.

### An option this note did *not* measure, and why

`research/ffx2-combat-core.md` §2.6 sources a real, canon **Config "ATB
Mode and Speed"** setting (Slow / Normal / Fast; Slow = 0.746×, Normal = 1×,
Fast = 1.262× on the global tick rate). If it existed as a build, Slow would
lengthen every enemy's action interval and every status duration by the same
factor, which would blunt exactly the tax this chapter is failing under. **It
is not built** — no lever for it exists anywhere in `src/battle/ffx2/**`
today (`TICK_RATE_BASE` in `src/battle/ffx2/constants.ts` is a fixed
constant, not a Config-driven multiplier), and building one is real engine
work this bench-and-measure track was not asked to do and did not do. It is
named here, sourced, as a real option the owner could ask for — build it,
then measure it the same way — not claimed as measured.

---

## 4. Verdict

**The shipped Chapter 6 intended line does not clear the ≥90% bar at any
human-shaped decision time this session measured.** It is not a regression
this track caused (the D = 0 control and the A1 headline numbers both
reproduce `chapter-leblanc-engine.md` exactly) and it is not unique to this
chapter — Chapter 5 already ships with the identical shape (0/40 at both
non-zero arms) under the same D-009 "Active only" decision. Per hard rule 6
and the standing rule in memory, **nothing was tuned in response.**

This is Bailey's call, not a builder's, per D-009. Options, each with its own
measured result from §1 and §3 above:

1. **Ship as designed, disclosed.** Same posture already shipped for Chapter
   5: Active is D-009's decision, both X-2 chapters are hard under it, and
   that is the mechanic working as chosen, not a bug. Measured: 40/40 at
   D=0, 4/40 at 1500 ms, 0/40 at 4000 ms.
2. **Ask for the canon Config ATB-Speed lever to be built**, then measure it
   on Chapter 6 the same way. Sourced and real (`research/ffx2-combat-core.md`
   §2.6), not a boss-number change, but genuinely unbuilt — this is a
   build-then-measure item, not a number available today.
3. **Leave Chapter 6 off Active ATB is not on the table** — D-009 says
   "Active only, no Wait toggle," project-wide; a per-chapter exception would
   be a new decision for Bailey, not an engineering call.

Nothing here recommends one of these over the others; that choice is D-009's
and it is the owner's, same as it was for Chapter 5.
