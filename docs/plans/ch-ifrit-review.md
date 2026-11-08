# Paper preflight (draft): Chapter 46 (hidden) — Ifrit at Kilika Temple (FFX-2) — branch `ch-ifrit-kilika`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-besaid-valefor-review.md` (this chapter's twin), `ch-keeper-review.md` and the wave-3 drafts: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-07 by a Sonnet sub-agent of the release driver, as the paper preflight of plan row 46 (wave 4) from its research note (`re-ffx2-ifrit-kilika.md`, "RE §n" below). It is a **draft**: the driver takes or overturns each pick in section 9. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables).

**Authority (relayed words, verbatim):** 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note; `origin/main` 63813367c by `git show` (`src/data/chapter-ffx2-valefor-besaid.ts`, `data/ffx2/enemies/valefor.ts`, `battle/ffx2/ai/valefor.ts`, `data/ffx2/builds/besaid.ts`, `djose.ts`); `research/ffx2-fallen-aeons.md` §7.1; the art mirror. Nothing was run, so rule 3 is owed by T0.

**Verdict: PROCEED.** One boss, one script of 300 lines of source, a template chapter already in the repo, no new mechanic. Everything Bailey will see waits for the picks of section 9 (hard rule 9), which the driver takes under the delegation above.

## 1. Game case and sources

**Game case: FFX-2 only.** The mission "Pest Control" (FFX-2 Chapter 3): ATB, dresspheres, the FFX-2 monster row 165. The FFX Ifrit (Fist, Grothia, Dark Ifrit) is untouched. The shared plumbing is "both" (CHK-020) and additive.

**Sources:** the kernel row and the plain-text AI source, equal to its compiled worker in command ids, modulus and scene constant (RE §0, §2); `research/ffx2-fallen-aeons.md` §7.1 (SinirothX and the wiki's AI dump, `[verified: 2 sources]`), which the row matches field for field; the mission order from `ffx2-ixion-djose.md` §1.1. **The plan's row 46 corrected by the files:** the "possessed-aeon pattern of chapter 11" is not the pattern; it is the Valefor (chapter 24) action-counter pattern with different increments; research is done; the "time-out" block is live in this scene (RE §3).

## 2. What the player experiences (plain words)

In the Chamber of the Fayth at Kilika, pyreflies have taken the fire aeon. Ifrit alone faces the Gullwings. He hits, throws Firaga at all three, and builds a rage the girls can read: three Meteor Strikes at the one standing farthest back, then Hellfire on everyone.

| Beat | What happens (RE §2) | What it asks of the player |
|---|---|---|
| Opening | Attack two turns in three, Firaga on all three one in three; each action fills his gauge by 7 | Hit Ice-weak: Blizzard or Ice-based attacks; **do not use Fire** (he absorbs it and is healed) |
| Meteor 1, 2, 3 | on the first turn the gauge is at 30, 60 and 90: Meteor Strike on the girl farthest from him | The farthest girl takes the hit: guard or keep her topped |
| Hellfire | at 100 the gauge and the Meteor count reset and everyone takes Hellfire (a 180-count cast) | Burst before it, or shell and heal through it |
| Too long | after about 180 of his turns he escalates; after 200 Time Up Meteor ends it | not met in a normal fight |

**Seams.** One link, no second act, no retry rule beyond the engine's ordinary loss. **Intent-board lines (our own words, numbers from the file):** "Every action warms him by seven, every blow he takes by five. At thirty, sixty and ninety he sends Meteor Strike at whoever stands farthest back. At a hundred, Hellfire on all three." "Fire heals him. Ice does not."

## 3. Engine work

Checked by reading `origin/main` 63813367c.

| # | Item | Why | Size |
|---|---|---|---|
| E1 | `ai/ifrit.ts`: the gauge (+7 ordinary, +5 per hit), the Meteor count (3), the four-way pick and the "too long" block (thresholds 180/190/195/200) | RE §2, §3; modeled on `ai/valefor.ts` | 2 h |
| E2 | Enemy def `x2-ifrit` and the four ability rows (Attack no-cancel, Firaga on all, Meteor Strike, Hellfire) + the five announcement/Time-Up rows; the monster record (`records-ifrit.ts`, fixture `ifrit_kilika_rows.json`) | RE §0, §1 | 2.5 h |
| E3 | Free Firaga from "uses no MP" | RE §0 (an automatic status; MP 9,999 does it already) | check |

**Exists and is enough:** the action-counter AI shape, the near-weighted pick with positions (`SCENES` table in `script-rolls.ts`: add `kilika` with the start positions of RE §0), the farthest-girl pick (Valefor's Sonic Wings), the chain/chapter record, hidden-chapter door, results, guide and tactic scaffolding of the Valefor chapter. Shared hot spots (the unions, the door table, `chapter-numbers.test.ts`, `route-pure.mjs`, `artNamespace.ts`, `CONTRACT-CHANGES.md`, `CHANGELOG.md`, `THEMES.md`) are the wave's integrator commit.

## 4. The party

**The Chapter 2 preset carried into Chapter 3 (`besaidBuild`, a deep copy of `bevelleBuild`: Yuna White Mage Lv 23, Rikku Dark Knight Lv 24, Paine Warrior Lv 25), plus the Samurai dressphere owned** (the guides put it in the temple on the way to him; `djose.ts` owns it at the end of Chapter 3). **No kit options.** `[estimate]` for the levels (no source gives them; Ifrit is Lv 23). **Why:** it is the Valefor chapter's party, so the two Chapter 3 temples compare; Kilika and Besaid can be done in either order. **Alternatives:** wear Samurai on Paine (measured as a what-if); the Djose preset (Lv 32/33/34) as a harder what-if. Neither is recommended; both are measured.

## 5. The arena

No Kilika Chamber plate exists. **Recommended:** `ffx2-djose-chamber-standin` (Bailey's approved Djose plate), flagged as a stand-in exactly as the Valefor chapter does. **Alternative:** a warm-graded derivation `ffx2-kilika-chamber` from it (a fire-lit grade; one plate, prompt and seed saved, replaces no approved painting).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Ifrit, possessed look** `x2-ifrit` | the `ifrit` master restyled by the recipe that produced `x2-ixion`, `x2-shiva`, `x2-anima` | 4 poses (idle, attack, hurt, ko); cast and overdrive reuse the `ifrit` poses until a verdict |
| Plate | `ffx2-djose-chamber-standin` | 0 (derivation optional: 1 plate) |
| Party | the Chapter 3 dresspheres exist | 0 |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy). The art lane pilots the restyle and Bailey looks before a batch. **Alternative with zero art:** the `ifrit` master as is (the Valefor chapter's route), at the cost of leaving the possessed set unfinished.

## 7. Presentation and music

One layout, no options round needed (the chapter is a single link): the Valefor chapter's HUD with Ifrit's gauge shown as the counter; the three Meteors as three small pips. **Music** (rule 13): stand-ins: battle `boss-ffx2-fallen-aeons` (the cue Chapters XI, XVI and Besaid play), victory `victory-ffx2`; no new cue. **Story:** our own words, three beats (pre, a bark at the first Hellfire, post), following `research/writing-bible.md`.

## 8. The winnability method, open questions, review class

**Method (measure, never tune; the Valefor bench's):** a vitest bench, advisor line and naive line, on the Wait and Active clocks, action time on and off, 200 seeds at bench speed and 40 at human speed, party presets as in section 4. Report win rate, KOs, Hellfires taken, Meteor victims, engine seconds. The sourced difficulty is a story-mission boss one level above the preset; the band is the driver's (the Valefor chapter's measured band is the precedent); if a row is far out, the lever is the party (BD2), never a boss number.

**Open items (RE §6):** the exact guest test of the "too long" counter (always true in this mission); Samurai worn or only owned (measured); the farthest-girl pick if positions move (the engine tracks none).

**Review class: DEEP** (shared registry tables). The save-data class is not touched (hidden chapter, experiments' own store). One release per wave: focused review before, deep after on the live build.

## 9. Build order, tracks, and the decisions (recommended picks; the alternative named)

| Track | Work | Hours |
|---|---|---:|
| T0 | engine checks by running it: the gauge and Meteor cycle (19-action cycle), the farthest pick, the free Firaga | 1 |
| T1 | data: record, enemy def, abilities, group | 2.5 |
| T2 | `ai/ifrit.ts` and its script test (cycle with and without hits, thresholds, the too-long block) | 2 |
| T3 | chapter record (`chapter-ffx2-ifrit-kilika.ts`: id `ffx2-ifrit-kilika`, game `ffx2`, number 46, title "Ifrit", location "Kilika Temple — Chamber of the Fayth", `buildRef` the Besaid preset + Samurai, music), meta, results | 2 |
| T4 | prep tip, guide page, tactic, scan/sensor text, door row (typed word `ifrit`, number 46) | 1.5 |
| T5 | story beats (our words) | 1 |
| T6 | art: `x2-ifrit` restyle (art lane, wall time on `RIG-RECORD`) | A3 |
| T7 | the bench and tests, handoff note, `CHANGELOG`, the integrator's tables (not this lane's) | 2.5 |

**Total: R0.5 B9 A3 I3.5 = 16 h `[estimate]`** (the plan priced 17; the research is spent in the note; the template chapter exists). Counted the way the Valefor chapter counted.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| IF1 | Scope | one link, the mission as the game has it | add Valefor and Ixion as a trio (separate chapters exist; not recommended) |
| IF2 | Party | `besaidBuild` + Samurai owned | Samurai worn; the Djose preset (harder); all measured |
| IF3 | The too-long block | **port it** (about 15 lines, one test) | leave it out and say so (Valefor's route) |
| IF4 | Script text | follow the script exactly (the Meteor does not add to the gauge) | none |
| IF5 | Art | `x2-ifrit` restyle | the `ifrit` master as is (zero art) |
| IF6 | Arena | `ffx2-djose-chamber-standin` | a warm-graded `ffx2-kilika-chamber` |
| IF7 | Music | `boss-ffx2-fallen-aeons`, `victory-ffx2` | none needed |
| IF8 | Id, number, word | `ffx2-ifrit-kilika`, **46**, **`ifrit`** (in the plan's pool; fits the door rule; re-run the door-word check at the integrator) | `kilika` |

## 10. Size and risks

1. **The gauge detail** (Meteor does not add): pinned by T0 and the cycle test.
2. **Too easy or too hard for the preset:** the lever is the party, never Ifrit.
3. **Art:** one restyle, the pose-recipe lesson (pilot, look, then batch).
4. **Shared tables** conflict with the other three wave-4 lanes: the integrator's job.

## Corrections and findings

1. The possessed pattern of the plan is the Valefor counter pattern; Ifrit's increments are +7 and +5.
2. A 19-action cycle with no hits; the Meteor and the Hellfire add nothing to the gauge.
3. The too-long block is live in this scene (Valefor's is not).
4. Row 165 equals the Fallen Aeons note's block and adds MP 9,999, ACC 95, the statuses, the special word.
