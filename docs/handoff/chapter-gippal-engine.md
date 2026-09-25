# Handoff — Chapter XV, the Den of Woe: engine, data, AI (FFX-2 only)

**Branch `chapter-gippal-0925`** in the worktree `D:/pyrefly-ch-gippal`, off main 4f2481f2. Not
pushed, not merged, not deployed. Bailey, 2026-09-25: "I'll go with all your recommendations"
(GP1–GP18, `docs/plans/chapter-gippal-review.md` after its Review; options in
`docs/concepts/chapters/gippal/`).

**Game case: FFX-2 only** (rule 14): the shades, their AI and the FFX-2 status set. The
registration and the chain carry are shared plumbing behind a flag only the Den sets; Chapters 5, 6
and XI are pinned byte-identical to 4f2481f2 (`tests/unit/chapters/den-of-woe-carry.test.ts`).

## What is built

| Piece | Where |
|---|---|
| The three shades, Baralai → Gippal → Nooj, §3 stat blocks with their tags | `src/data/ffx2/enemies/den-of-woe.ts` |
| Their 20 actions, §4 | `src/data/ffx2/enemies/den-of-woe-abilities.ts` |
| Their AI, §4.1–§4.3, in the source's branch order | `src/battle/ffx2/ai/den-of-woe.ts` |
| GP3 a, the full carry (statuses, worn dressphere, grid progress) | `src/app/screens/BattleScreenCarry.ts`, flag `EnemyGroupDef.carriesFullPartyState` |
| GP10 a, exact Lightfall / Bullseye / Drill Shot / Greedy Aura | `extra.noVariance` in `src/battle/ffx2/formulas.ts` |
| Bullseye cannot kill | `extra.cannotKill`, same file |
| GP-G3, Greedy Aura's MP half of **max** MP | `extra.mpFractionOfMax` in `src/battle/ffx2/aeon-effects.ts` |
| Looming Glacier, MP to 0 + Stop | `resolve.ts` runs riders after a "set to" hit |
| Registered, **unlisted**, number 15 | `src/data/chapter-ffx2-den-of-woe.ts`, `src/data/chapters-unlisted.ts` |
| Story beats, a draft for Bailey | `docs/plans/gippal-story-draft.md` (not in `src/story`) |

Party and bag: the Chapter V preset as it stands (GP5 a, GP6 a). No checkpoint: a loss anywhere
retries from Baralai (GP4, built as a). Scene `bevelle-underground` and cue `boss-shuyin` are
labelled placeholders (T5, GP16 stand-in b). `window.__pyrefly.gotoChapter('ffx2-den-of-woe')`
reaches it; chapter select does not show it.

## Measured (200 seeds, bench speed, Wait; 40 at human speed under Active)

The full table is in the commit body and printed by `tests/unit/chapters/den-of-woe-bench.test.ts`.
Headline: Baralai 199/200 and Gippal 157/200 on the intended line from full; **Nooj 24–33/200**;
the whole Den **12–26/200**, lost at Nooj in three runs out of four at bench speed. At +8 levels (a
what-if, not shipped) the Den is 34/200; at 1.5 s a menu under Active it is 0/40, and there most
runs are lost at **Gippal** (Baralai 4, Gippal 32, Nooj 4). Nothing was tuned.

**Repair pass (2026-09-25, after the verifier).** Stop, Protect, Shell and Regen are timed statuses
in `research/ffx2-combat-core.md` §2.8, so the shades' casts of them no longer last forever:
Looming Glacier's Stop and Not-So-Mighty Guard's three buffs are 100 units (53.0 s), Baralai's Regen
spell 50 (26.5 s), each the published player value of its nearest analogue and tagged `[estimate]`
(`DEN_STOP_DURATION`, `DEN_GUARD_DURATION`, `DEN_REGEN_DURATION`). Darkness and Silence stay
`Infinite`, as the source says. Re-measured: every intended, what-if and human-speed row is
unchanged; only the wrong lines on Baralai moved (magic 0 -> 1, all-out 4 -> 5 of 200). On the
engine, Stop now runs out (42 expiries on Baralai's magic line, seeds 1-20) and the Guard and Regen
expire when the clock is run (`den-of-woe-engine.test.ts`). `resolve.ts` is back to its base length
(470 lines, rule 7).

## Open, for Bailey (none decided here)

1. **GP4 c and GP5/GP6 with the numbers:** retry from Baralai (built) or from the lost link; a
   higher level; Dark Matter or Hero Drinks in the bag.
2. **The shades' status durations** are unpublished. Built (repair pass) as the nearest published
   player values, `[estimate]`: Stop 100 units (53.0 s; the sources say Stop always times out),
   Protect/Shell/Regen from Not-So-Mighty Guard 100, the Regen spell 50. Looming Glacier still lands
   every fifth Baralai turn at chance 254, so Remedy stays the answer; a permanent reading would be
   the Chapter XI precedent instead. Bailey's call.
3. **Drill Shot waits for Baralai's next turn** (no enemy out-of-turn path in the FFX-2 engine,
   GP-G4); the counter counts damaging actions and Regen payouts (GP11 a).

## Findings for the driver (not fixed here)

- **`spherechange.ts#refreshDerivedStats` drops accessory bonuses.** Only `setup.ts#buildMember`
  applies `withAccessories`; after any spherechange a girl loses Crystal Bangle's +100 % max HP etc.
  Shared FFX-2 engine, every chapter; a full carry re-derives with accessories at the next link.
- **`fixed-no-variance` still rolls step 7** (plan GP-G2), shipped Alchemist mixes included;
  GP10 b is the separate, disclosed change.

## Next

Integrator: serialise the `ChapterId` / `Chapter.number` widening with Omnis, Trema and Isaaru.
Then art (O-1 B, O-2, O-3 A), the Den scene (T5), the guide and tactic (T7), the HUD chips (T8,
O-4 B), the cue (T9, O-5), the story script from the draft (T6), a real-input run and screenshots,
focused review, deploy, deep review on live.
