# Chapter — Evrae, on the deck of the *Fahrenheit* (FFX): engine and data

**Game case: FFX only** [AGENTS.md rule 14]. `research/ffx-evrae-airship.md` §0.4
fences the whole encounter in as many words — the airship distance mechanic "has
no X-2 counterpart" — and neither do Trigger Commands, the three-active /
three-reserve bench or the `Use` economy the fight is balanced around. The
absence test is `tests/unit/chapters/evrae-engine.test.ts`, last describe block.

The engine *capabilities* below are general additive plumbing in
`src/battle/ffx/**` and are **"both"** per `critic/CHECKS.md` CHK-020 — but every
one of them is inert until `state.flags['airship.range']` exists, which only this
encounter sets. `src/battle/ffx2/**` and `src/data/ffx2/**` are untouched.

Built to the paper preflight at `docs/plans/chapter-evrae-review.md` (verdict
PROCEED), against `research/ffx-evrae-airship.md`.

---

## Status: engine and data done, **not a playable chapter**

No scene, no story script, no art, no music — and the order widget (C-11) has not
been mocked up or approved, which AGENTS.md rule 9 requires before anything the
player sees is built. So `src/data/encounters.ts`, `src/data/chapter-meta.ts`,
`src/scenes/index.ts`, `src/engine/tactics/index.ts` and `src/data/guides/index.ts`
are **deliberately untouched** and the chapter-select grid keeps showing Evrae as
*Coming*.

The formation, the build and the tactic are reachable through the same dev-only
hook Macalania uses: `ENEMY_GROUPS_BY_ID['evrae-airship']` and the
`fahrenheitBuild` re-export in `src/data/ffx/index.ts`. That is what the unit and
strategy suites and the `window.__pyrefly` debug API look them up by.

`node tools/orphans.mjs` lists `src/engine/tactics/evrae.ts` as unimported. That
is expected and it is exactly where `seymour-anima-macalania.ts` sits: both
register in the integrator's single commit.

---

## What was built

### Engine capabilities — five, all additive, **no contract file touched**

The preflight expected two optional fields on `src/battle/common/types.ts` and one
`docs/CONTRACT-CHANGES.md` entry. **None was needed.** Every capability turned out
to be reachable through `ActorRuntime`, which `src/battle/ffx/state.ts` already
documents as engine-internal and not a contract file — the same route the
Macalania track took a day earlier.

| # | Capability | Where | Preflight's gap |
|---|---|---|---|
| 1 | **A non-combatant turn-taker.** `ActorRuntime.nonCombatant`; `engine.ts#checkEnd` scores victory on the fighters only. Cid gets a CTB row and the tie-break rank `turnQueue.ts` already reserves for the id `'cid'`, and never blocks a win | `state.ts`, `engine.ts` | E-1 |
| 2 | **Reach.** `targeting.ts#reachesAtRange`, called from `validTargets`; `commands.ts` writes `'Out of reach'` on both the ability rows and the item rows. Returns `true` unconditionally when the airship flag is unset, so every other chapter is byte-identical | `targeting.ts`, `commands.ts` | E-2 |
| 3 | **A ranged weapon as a character property.** `ActorRuntime.rangedWeapon`, set for Wakka at setup, read only inside `reachesAtRange` | `state.ts` | E-3 |
| 4 | **Trigger dispatch by id.** Both ends hard-coded `id === 'talk'`; now a `TriggerHandler` table keyed by trigger id, carrying `available`, `apply`, a disabled reason and a rejection message. `TriggerCommand.id` was already an arbitrary string, so no contract moved | `ai/index.ts`, `commands.ts`, `execute.ts` | E-4 |
| 5 | **A counter provoked by a status landing, and one provoked by being targeted.** `engine.ts` collects `status-add` targets beside `damage`, and `collectBossCounters` takes them as a defaulted fifth argument; `ActorRuntime.countsPartyTargetings` / `partyTargetings` count "the player pointed something at me", which includes a miss and a status-only command | `engine.ts`, `ai/reactions.ts`, `overdrive.ts`, `state.ts` | E-5 |

Existing bosses ignore the new argument and the new fields, so **Chapters 1–3 are
unchanged** — pinned by the last case in the absence block, which runs Chapter 1
and asserts no row is ever `'Out of reach'` and no airship flag exists.

### Two things the preflight expected to cost work, and did not

- **C-14, the Reflected self-Haste.** `targeting.ts#reflectBounceTarget` already
  picks a random living member of the *opposite* side with no self-target case,
  so Reflect on Evrae turns its self-Haste into a free Haste on a random party
  member with **no engine change at all**. The owner chose to keep it
  (2026-09-21), so it is pinned by a test rather than left to chance.
- **C-8, Stone Gaze's Slow bypassing Slowproof and Ribbon.** No `extra.script`
  escape hatch was needed. `statuses.ts#rollStatus` returns true for
  `chance >= 255` **before** it reads the resistance byte, and `applyStatus`
  refuses a Slow only when a *permanent* Haste is present — which is exactly SOS
  Haste and Auto-Haste, the two things the wiki says do block it. Both halves are
  pinned.

### Data

| File | What |
|---|---|
| `src/data/ffx/enemies/evrae.ts` | Evrae `m119` and Cid `m149`, every cell cited to §1 / §2 with its confidence tag |
| `src/data/ffx/enemies/evrae-abilities.ts` | The eight decompiled Evrae rows plus Guided Missiles |
| `src/data/ffx/builds/fahrenheit.ts` | Six members, **no Yuna, `aeons: []`** |
| `src/data/ffx/abilities/special-orders-evrae.ts` | The two Trigger Command menu markers |
| `src/battle/ffx/ai/evrae-rules.ts`, `evrae-counters.ts`, `evrae.ts` | The range state, the order queue, the missile economy, the two phases, the three counters, the two rotations |
| `src/engine/tactics/evrae.ts` | The intended line |

A new file, `special-orders-evrae.ts`, rather than two rows inside
`special-menu-markers.ts` — the shared marker file is another agent's, and ten
agents were in the tree. It merges into `src/data/ffx/index.ts` the same way.

---

## Owner-approved decisions, each AUTHORED and one line from being flipped

All in `src/battle/ffx/ai/evrae-rules.ts`, and exported as `EVRAE_ASSUMPTIONS` so
the guide and the end-state board can print them.

| # | Decision | Constant |
|---|---|---|
| C-7 / G-1 | A Trigger Command is **rank 3** | `ORDER_RANK` |
| C-7 / G-2 | A **redundant order still burns Cid's turn** | `REDUNDANT_ORDER_BURNS_TURN` |
| C-12 / G-5 | Swooping Scythe is **phase 2 only** | `SWOOP_PHASE_TWO_ONLY` |
| C-1 / G-3 | Aggro counter **6**, +1 magic / +2 physical, resets on fire, once per action | `GAZE_THRESHOLD` and friends |
| C-14 / G-8 | **Keep** the Reflected self-Haste | `KEEP_REFLECTED_SELF_HASTE` |
| C-13 / G-7 | **Do not** ship "delaying Evrae advances the Haste phase" | `DELAY_ADVANCES_HASTE_PHASE` |
| C-4 | Threaten defaults to immune | `threatenChance: 0` in the data file |
| C-5 | **Ship both**: the behaviour is Stone Gaze, the Scan text reproduces the lie | `scanText` in the data file |
| C-2 | Mix and every restorative reach at FAR; offensive items and Steal do not | the targeting rule in `reachesAtRange` |

`ORDER_RANK` is the number the preflight's R2 says the difficulty is most
sensitive to, and it has **no source at all** — the manoeuvre has no action row.

---

## Measured

Every number below came from running the real engine against the real data, not
from reading it [AGENTS.md hard rule 3].

### The data reproduces the research's own computed tables

Measured over 12 seeds with the party defending, per hit:

| Action | Measured | Research §7.2 / §2.2 |
|---|---|---|
| Poison Breath | 1,441 / **1,515** / 1,604 | 1,410 / **1,504** / 1,592 at MDef 15 |
| Photon Spray | 96 / **103** / 110 | 95 / **102** / 107 at MDef 15 |
| Guided Missiles | 187 / **197** / 211 | 187 / **200** / 211 |

### Acceptance cases

| Case | Result |
|---|---|
| **A-1 / A-4** — the shipped tactic, 40 contiguous seeds | **21 wins, 52.5 %** |
| **A-2** — the credible mistake, 20 seeds | **0 wins**, every one with Evrae above 28,000 of 32,000, inside ten turns |
| **A-3** — attacking at FAR in phase 2 | Swooping Scythe counters, range flips to NEAR, the dodge dies. §4.5's trap fires as designed |

**A-4's target is 90 % and the shipped line does not reach it.** The number is
reported rather than engineered and **no boss number was touched**
[`memory/boss-side-fix-needs-measured-options`]. Chapter 1 shipped at 73 % and
Macalania at 80 % under the same rule.

A-2 is the diagnostic one and it is emphatic. §9.1: *"If this wins, the fight has
no teeth and the range mechanic is decorative."* A competent first-timer who plays
well but ignores Cid — stays NEAR, never orders, swings, heals, revives — loses
20 of 20 with 88 % of the boss's bar still up. The range mechanic is the fight.

### The tuning history, because it is the useful part

Each step was a defect found by instrumenting a losing seed, not a threshold
nudged until the number moved.

| Change | Rate |
|---|---:|
| First shipped line | 27.5 % |
| + Lulu switched in at FAR for reach, heavier healing | **2.5 %** |
| + Reflect cast before Rikku leaves the field | 40.0 % |
| + Auron switched in when the wyrm closes | 45.0 % |
| + **stop casting reflectable spells into our own Reflect** | **52.5 %** |

The 2.5 % row is worth keeping. Switching Lulu in for reach also switched out the
**only member who owns Reflect**, so the 1/3-HP self-Haste landed on every seed
that reached phase 2 — a change that looked like pure upside and cost 25 points.

The last row is a defect the research predicted in as many words. §6.5 prices the
Reflect line at *"Lulu's spells bouncing back onto your own party"*, and measured
that is not a figure of speech: with her casting into a Reflected Evrae the party
took **5,312** damage from its own Watera on seed 2 and **4,367** on seed 18 —
in both cases more than Evrae's own melee dealt in the same battle.

---

## Open questions for Bailey

1. **The 52.5 % win rate.** Nineteen of the twenty remaining losses are in phase 2
   with Evrae between 5,700 and 10,900 of 32,000 — the party gets three quarters
   of the way and loses the endgame. Three candidates, **none of them measured
   yet**, and each is a different kind of answer:
   - the **party preset** (§9.3, C-17) is `[estimate]` by construction. Lulu's 700
     HP and Rikku's 880 are both one Poison Breath from death, and Photon Spray's
     eight independent hits punish the lowest bar on the field;
   - **`ORDER_RANK`** is an `[estimate]` with no source. At rank 2 an order costs
     a third less tempo and the dodge becomes reliable; at rank 4 it becomes
     nearly unaffordable. This is the single number R2 names;
   - the **line's own phase-2 behaviour** has no answer to a NEAR-locked Hasted
     wyrm beyond Power Break and the potion stack.
   The honest recommendation is to measure all three and bring you the numbers
   before anything is changed, rather than pick one now.
2. **`src/battle/ffx/engine.ts` is 503 lines**, over the 400-line house limit. It
   was 476 before this track and 503 after; the debt is not this chapter's, but
   this chapter made it worse by 27 lines. Worth a split, and it is not mine to
   make unilaterally while the tree is shared.
3. **The order widget (C-11) is still the chapter's highest risk** and nothing was
   built for it. `special-orders-evrae.ts` ships `name` equal to the id on
   purpose, per your "expose ids only". The recommended copy when the widget goes
   out is **"Pull back"** and **"Close in"** — "Move in" is single-source *and*
   reads as the player moving.

---

## Owed to other tracks

- **The integrator**: `encounters.ts`, `chapter-meta.ts`, `scenes/index.ts`,
  `tactics/index.ts`, `guides/index.ts`, `tracks/index.ts` + `THEMES.md` (the
  reserved `MusicKey` is `boss-evrae`), in one commit.
- **Presentation**: three messages in the engine are **placeholder copy** and
  belong to the story and widget tracks — `The Fahrenheit pulls back`,
  `The Fahrenheit closes in`, `Cid is out of missiles`.
- **Presentation**: the **Inhale telegraph is not wired to `ActorRuntime.charge`**.
  The banner plumbing exists (it drives the Mortiorchis ladder) and Inhale is a
  one-turn instance of the same thing; it was left alone rather than guessed at,
  because `TurnPreview.chargeStage` is a thing the player sees.
- **Presentation**: Photon Spray's eight retargeting hits land as eight `damage`
  events across up to three actors in one action (R5). The events carry
  `hitIndex` / `hitCount`; whether the HUD handles three concurrent ladders is
  unverified.
- **Art / audio**: O-1 to O-5 have not gone out. Nothing perceivable was built.

## How to run it

```
npx vitest run tests/unit/chapters/evrae-engine.test.ts   # 26 mechanic units + the absence tests
npx vitest run tests/unit/strategy-evrae.test.ts          # A-1, A-2, A-3
```
