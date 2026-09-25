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
the whole Den **12–26/200**, lost at Nooj in three runs out of four. At +8 levels (a what-if, not
shipped) the Den is 34/200; at 1.5 s a menu under Active it is 0/40. Nothing was tuned.

## Open, for Bailey (none decided here)

1. **GP4 c and GP5/GP6 with the numbers:** retry from Baralai (built) or from the lost link; a
   higher level; Dark Matter or Hero Drinks in the bag.
2. **Looming Glacier's Stop duration** is unpublished; it is `0` (until cured), the Chapter XI
   precedent. With chance 254 it lands every fifth Baralai turn, so Remedy is essential.
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
