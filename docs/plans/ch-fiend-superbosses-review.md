# Paper preflight (draft): Chapter 53 (hidden) — The Fiend Arena Superbosses: Almighty Shinra and Major Numerus (FFX-2) — branch `ch-fiend-superbosses`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `ch-duelist-review.md` (the Cup, this chapter's neighbour), `ch-ifrit-review.md` and the wave-3 and wave-4 drafts: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-09 by a Sonnet sub-agent of the Echoes of Spira driver as the paper preflight of plan row 53 (wave 6, number 53, word `legion`) from its research note (`re-ffx2-fiend-arena-superbosses.md`, "RE §n" below). It is a **draft**: the driver takes or overturns each pick in section 9. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables; a seven-actor formation).

**Authority (relayed words, verbatim):** 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note; `origin/main` bc93b1fdd by `git show` (`src/data/chapter-ffx2-farplane-cup.ts`, `docs/handoff/ch-farplane-cup.md`, `src/battle/ffx2/ai/farplane-cup.ts`, `data/ffx2/builds/farplane-cup.ts`, `via-infinito.ts`, `adapt/mix.ts`, `data/ffx2/abilities/mix-results.ts`, `kernel/hit.ts`, `research/re-ffx2-farplane-cup.md`); Jegged and Gamer Guides on the Fiend Arena; the art mirror of release 75. Nothing was run, so rule 3 is owed by T0.

**Verdict: PROCEED, with the winnability named as the open risk.** The scripts are small and exact; the Cup chapter is the template; the new work is a seven-actor formation, four big paintings, and a fight the Lv 99 line may not win as built. Everything Bailey will see waits for the picks of section 9 (hard rule 9), which the driver takes under the delegation above.

> **Committed in stage 1 of the lane (2026-11-09).** The recommended column of section 9 (LG1 to LG11) is taken as the driver's call under Bailey's delegation, his to overturn. The stage reports and the handoff note (`docs/handoff/ch-fiend-superbosses.md`) say where the build departs from this paper plan.

## 1. Game case and sources

**Game case: FFX-2 only.** Rows 329 and 330 to 336 of the FFX-2 kernel table and their plain-text AI (RE §0, §1). The Cup chapter's Auron, Tidus and Seymour (rows 311, 317, 319) are not touched. Shared plumbing is "both" (CHK-020) and additive.

**Sources:** the kernel rows and the AI sources, equal to the compiled workers in command ids and moduli (RE §1); Gamer Guides and Jegged for the cups and the move lists (RE §6). **The plan's rows 53 and 63 corrected by the files:** the plan's "Numerus rows 330 to 333, seven actors, rows 330 to 336" is right (rows 334 to 336 are the body, pod and tail, not the Last Mission; plan row 63 is mis-aimed and should point at `lastmiss/kernel/lm_monster.bin`, an archive file that exists and is unread); the heads null five elements, not "absorb" anything; **research is done**.

## 2. What the player experiences (plain words)

Two bouts at the top of the Fiend Arena, the strongest things in Spira. Shinra, grown to full size, fights a girl-for-girl loop that a prepared party can read; the Major Numerus is four bodies on one frame, each with its own song, and the only safe answer to three of its moves is to not be standing there.

| Act | Foe (game rows) | HP | What it does (RE §3) | What it asks of the player |
|---:|---|---:|---|---|
| 1 | **Almighty Shinra** (329) | 275,000 | a six-beat loop: Clione (ten hits), Attack, Ultima, Attack, Full Break, Haste; Final Impact when he is low or already hasted | Protect and Shell first; Defense-piercing attacks (his DEF and MDEF are 255) |
| 2 | **Major Numerus** (330 to 333, with the body, pod and tail 334 to 336) | 555,555 / 666,666 / 666,666 / 777,777 | four heads at once: Unum's Sparklers and buffs and Radis Command; Duo's status coin flips and Venam Command; Tria's elemental magic and **Fulmen Command**; Quattour's Fireworks, Mortis Command, Meteor and Ultima | answer each Command's 4.5 s charge; elements are nulled, only non-elemental and Holy work; the fight ends when the last head falls |

**Seams.** One seam between the acts (the arena mends the girls), no story card. **Intent-board lines (our own words, numbers from the files):** Shinra "Six beats and round again: ten blows, a strike, Ultima, a strike, a break, haste. When he is low, the Impact: an eighth of everyone's life and magic, fourteen times." Numerus "Four heads, four rhythms. A Command takes four and a half seconds to charge and cannot be survived unprotected."

## 3. Engine work

Checked by reading `origin/main` bc93b1fdd.

| # | Item | Why | Size |
|---|---|---|---|
| E1 | `ai/shinra-almighty.ts`: the six-beat switch, the quarter/half HP tests, the Haste test | RE §3.1 | 1.5 h |
| E2 | `ai/numerus.ts`: four head scripts (seven, nine, nine and six polls; the coin flips on stream 2), the **monster-side "any ally lacks Shell/Protect"** search (Unum), the shared **death rule** (all four heads down sets the body and the pod to 0 HP and ends the fight) | RE §3.2 to §3.5, §2 | 5 h with tests |
| E3 | enemy defs: `x2-almighty-shinra`, `x2-numerus-unum/duo/tria/quattour`, `x2-numerus-body/pod/tail`; ability rows: Clione, Radis/Venam/Fulmen/Mortis Command, plus Holy and White Highwind if absent; **reuse** Final Impact, Ultima 0x3171, Flare, Black Sky, Meteor 0x4221, Absorb, Fireworks, Sparkler, Dispel, Shell, Protect, Break, Confuse, Demi, Slowga from the Cup/Trema/Paragon data; records and fixture `fiend_superbosses_rows.json` | RE §0, §4 | 6 h |
| E4 | a **seven-actor formation**: four visible targets with HP bars, three hidden parts (body and tail switch themselves off; the pod's targetability is unknown) | RE §2, §8 | 3 h + check |
| E5 | the **99,999 damage-limit bit** on the four Commands and the Fulmen Command's Thunder element | RE §4 | check |
| E6 | `SCENES` entry: none exists (no position file); uniform picks | RE §1 | 0 |

**Exists and is enough:** the chain loop and `restoresPartyOnEntry`; the Cup chapter's whole data and AI layer; multi-hit spread (Black Sky, Meteor, Clione, Final Impact); percent-of-max rows (f7, f4); parts that die together (Sin's, Vegnagun's four-part chain); the Mix system including **Miracle Drink** (`x2-mix-miracle-drink`: all allies Invincible, duration 15, about 8 s) and Final Wall; the Lv 99 line. **Not built, named:** the cups' rounds, rewards and recruiting (not in the files). Shared hot spots are the wave's integrator commit.

## 4. The party

**Recommended (LG3):** `viaInfinitoBuild` as the Cup chapter has it (a deep copy: Yuna and Paine Dark Knights, Rikku an Alchemist, Lv 99, Crystal Bangle and Rabite's Foot, ten Megalixirs, Light and Lunar Curtains, Remedies, no Phoenix Downs; Paine starts without the Break Damage Limit), **MEASURED**. Gamer Guides use a Lv 99 party of Dark Knights, an Alchemist and a Samurai for Nonpareil; the build's levels and kit are an `[estimate]`. **Kit options, measured as what-ifs (LG4):** (a) as built; (b) Rikku loops Miracle Drink (needs the recipe's ingredients in the bag: counts `[estimate]`); (c) Hero Drinks (the Den of Woe's pattern); (d) Thunder-proof accessories (NulShock Ring and kin) for Tria's Fulmen Command. **None is built unless the bench says the base cannot win and Bailey picks** (the Den of Woe precedent: 0 of 200 first tries led to the options sheet and his pick).

## 5. The arena

No Fiend Arena plate exists, and the cup is not in the files. **Recommended (LG5):** the Den of Woe's own stage as a flagged stand-in, exactly as the Cup chapter (DU5): human-sized foes, a clear boss spot; for the Numerus the four heads stand on the boss line and the body is hidden. **Alternative:** one painted "fiend-arena" plate (about 3 h of art; Bailey looks first).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Almighty Shinra** | none (a boy at full size, the Gullwings' Shinra; `ffx2-experiment` is another character) | 5 poses (idle, attack, cast, hurt, ko) |
| **The four Numerus heads** (Unum, Duo, Tria, Quattour) | none; four large heads on one frame, each with its own colour and stance (the Vegnagun and Sin parts are the staging precedent) | 4 heads x 4 poses (idle, cast, hurt, ko) = 16 |
| Body | one frame piece, optional | 2 |
| Pod, tail | hidden; no painting | 0 |
| Party | the Lv 99 line's paintings exist (`yuna-dark-knight`, `paine-dark-knight`, `rikku-alchemist`) | 0 |
| Plate | the Den stage | 0 (one optional) |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy). The art lane pilots one head and Bailey looks before the batch. **Alternative with less art:** the Numerus as one painted body with four glowing heads in a single sheet (4 poses): cheaper, less readable.

## 7. Presentation and music

The Valefor chapter's HUD for Shinra; for the Numerus four HP bars (one per head) and the Command charge shown as the existing cast bar on each head. **Music** (rule 13): stand-ins `boss-trema` (the Fiend Arena's superboss cue), `victory-ffx2`, field bed `scene-bevelle-underground`; no new cue. **Story:** our own words, one pre beat before Shinra, one seam, one post beat after the Numerus (`research/writing-bible.md`); the arena's announcer tone.

## 8. The winnability method, open questions, review class

**Method (measure, never tune; the Cup and Den of Woe benches'):** a vitest bench, advisor and naive lines, Wait and Active clocks, 200 seeds at bench speed and 40 at human speed, the base party and the four kit what-ifs of section 4. Report win rate, KOs, Commands survived, Miracle Drinks used, engine seconds. The sourced difficulty is "the hardest fights in the game" (Gamer Guides: ten to thirty minutes with an invulnerability loop); **a win rate near 0 for the base is a result, not a defect**, and goes to Bailey as an options sheet with the numbers. **Boss numbers are never touched.**

**Open items (RE §8):** how the arena launches the fights (not built); the pod's targetability (hidden); Unum alone (not built); the party's level and kit (estimate).

**Review class: DEEP** (shared registry tables, a new multi-part formation). The save-data class is not touched (hidden chapter, the experiments' own store). One release per wave: focused review before, deep after on the live build.

## 9. Build order, tracks, and the decisions (recommended picks; the alternative named)

| Track | Work | Hours |
|---|---|---:|
| T0 | engine checks by running it: the seven-actor formation, the death rule, the 99,999 bit on a Command, the status layer at Lv 99, Miracle Drink's recipe and duration | 2 |
| T1 | data: nine defs, new ability rows, records, fixture, the chain | 6 |
| T2 | the five AI scripts, the monster-side search, the death rule, their script tests | 6.5 |
| T3 | chapter record (id `ffx2-fiend-superbosses`, game `ffx2`, number 53, title "The Fiend Arena Superbosses"), meta, results, `fiendSuperbossBuild` | 3 |
| T4 | prep tip, guide page, tactic, sensor texts, door row (typed word `legion`, number 53) | 2.5 |
| T5 | story beats (our words) | 1.5 |
| T6 | art: Shinra, four heads, body (art lane, wall time on `RIG-RECORD`) | A20 |
| T7 | HUD seam for four bars, the bench and tests, the options sheet, handoff note, `CHANGELOG`; the integrator's tables are not this lane's | 9 |

**Total: R1 B21.5 A20 I9 = 51.5 h `[estimate]`** (the plan priced 72; the research is spent in the note and the Cup chapter's layer exists). Counted the way the Cup chapter counted.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| LG1 | Scope | **one chapter, two acts**: Shinra, then the Numerus, mended between | two chapters (+1 number, +4 h of plumbing) |
| LG2 | The Numerus formation | **all four heads, with the body, pod and tail**; the last head down ends the fight (the file's own rule) | Unum alone (Jegged's "Outer Plane Envoy"; not recommended) |
| LG3 | Party | `viaInfinitoBuild` as it is (the Cup's build), measured | a stronger kit as the shipped build (only if Bailey picks from the options sheet) |
| LG4 | Kit what-ifs | measured only: Miracle Drink loop, Hero Drinks, Thunder-proof gear | none shipped |
| LG5 | Arena | the Den of Woe's stage, flagged | a painted `fiend-arena` plate (+3 h, Bailey looks first) |
| LG6 | The cups | **not built** (not in the files) | none |
| LG7 | Art | Shinra + four heads + body, painted | the single-sheet Numerus (cheaper) |
| LG8 | Order | Shinra first, the Numerus last | the reverse |
| LG9 | Music | `boss-trema`, `victory-ffx2` | none needed |
| LG10 | Id, number, word | `ffx2-fiend-superbosses`, **53**, **`legion`** (re-checked 2026-11-09 against the 29 words on `origin/main` bc93b1fdd and the words the program plan reserves: ok) | `shinra` (its last letter `a` starts `angra`) and `numerus` (its last letter `s` starts `summon`) both fail the rule |
| LG11 | Oversoul forms | none exist for these rows (Oversoul id 0 on all five) | none |

## 10. Size and risks

1. **The Numerus may not be winnable by the base party:** the result is an options sheet for Bailey, not a tuned boss. The shipping rule of the Den of Woe applies (a chapter that "measures unwinnable" ships with the numbers and the options).
2. **A seven-actor formation** (four bars, hidden parts) is the one real engine item; T0 checks the engine's actor limit first.
3. **Art:** the biggest of the wave (A20); one pilot, a look, then the batch.
4. **Shared tables** conflict with the other wave lanes: the integrator's job.

## Corrections and findings

1. Rows 334 to 336 are the Numerus's body, pod and tail (the plan's row 63 is mis-aimed; its data is `lastmiss/kernel/lm_monster.bin`, unread).
2. The heads **null** Fire, Ice, Thunder, Water and Gravity (they absorb nothing); Holy and non-elemental damage work.
3. The four Commands carry the 99,999 bit; Fulmen Command is power 255.
4. The Numerus's own rule ends the fight when the last head dies.
5. Miracle Drink is in the engine (about 8 s a cast), but nothing in the files promises the guide's "30 minutes".
6. Shinra's and the Numerus's scripts carry no "battle too long" block.
