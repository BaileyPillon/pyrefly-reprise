# Paper preflight (draft): Chapter 47 (hidden) — Garik Ronso and the Youths, Mt. Gagazet summit (FFX-2) — branch `ch-lionheart`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`, `ch-besaid-valefor-review.md` and the wave-3 drafts: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-07 by a Sonnet sub-agent of the release driver, as the paper preflight of plan row 47 (wave 4) from its research note (`re-ffx2-garik-ronso.md`, "RE §n" below). It is a **draft**: the driver reads it, takes or overturns each pick in section 9, and a build lane starts from it. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables).

**Authority (relayed words, verbatim):** 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note; `origin/main` 63813367c by `git show` (`src/data/chapter-ffx2-valefor-besaid.ts`, `data/ffx2/builds/djose.ts`, `besaid.ts`, `battle/ffx2/ai/leblanc-syndicate.ts` for Not-So-Mighty Guard, `den-of-woe.ts` for the two-variant groups, `data/ffx2/enemies/trema-options.ts` and `experiment-levels.ts` for chapter-level options, `battle/ffx2/abilities-core.ts` for Curse); `PLAN.md` rows 47 and section 5; the art mirror. Nothing was run, so rule 3 is owed by T0.

**Verdict: PROCEED.** The research settles the plan's one open question: the earlier "answer" is a score that selects one of two scenes, and the game gives both. Two small scripts, ten ability rows, one new chapter setting. Everything Bailey will see waits for the picks of section 9 (hard rule 9), which the driver takes under the delegation above.

## 1. Game case and sources

**Game case: FFX-2 only.** The Chapter 3 mission "Battle Blockade" at the top of Mt. Gagazet: ATB, dresspheres, status Curse as "cannot change dressphere", FFX-2 rows 181 and 182. The Cup Garik (row 324, Lv 67) is the Fiend Arena's, plan row 38; the FFX Ronso are another monster. Shared plumbing is "both" (CHK-020), additive.

**Sources:** two kernel rows and two plain-text AI sources, each equal to its compiled worker in command ids, modulus and the two scene constants (RE §0, §2); the two formations; the event packages that count the answers and launch the scene (RE §1); Jegged FFX-2 Chapters 1 to 3 for the guide view (RE §1). **The plan's row 47 corrected by the files:** the "dialogue answer" is a saved score, not a stat scale; the choice is *two scenes* (one Youth and a friendly Garik, or two Youths and a hostile one); research is done (the 10-18 notes' "skip" reason is answered); the rows 181 and 182 are not changed by row 38's Cup version.

## 2. What the player experiences (plain words)

On the mountain top Garik, who has shut the teleporters and waits with his lance across the path, tests the Gullwings. He is either a stern friend or an enemy, and the mountain remembers which.

| Scene | Who is there | What happens (RE §2) | What it asks of the player |
|---|---|---|---|
| **Hostile** (`mtgz10_228`, the default) | Garik + **2 Ronso Youths**, 15,000 HP in all | Garik **curses any Black Mage** with Bane Lance, Blinds, and **casts Mighty Guard on his whole side every seventh turn**; each Youth empties a girl's MP (MP Blowout) one turn in eight | Do not stand in Black Mage; Dispel or Confuse the guards; break the Youths first |
| **Friendly** (`mtgz10_229`, "high Ronso trust") | Garik + **1 Youth**, 10,940 HP | Garik **buffs himself on a fixed beat** (Protect, Shell) and attacks; the Youth only attacks | A sparring bout: brisk, safe |

**Seams.** One link, one scene; the result is a win or the engine's ordinary loss. **Intent-board lines (our own words, numbers from the file):** Garik hostile: "He seals the Black Mage first (Curse), and every seventh turn he guards his whole side: Shell, Protect, Regen, Haste and higher Defense, Magic Defense and Evasion." Garik friendly: "A bout, not a battle: Protect on his first turn, Shell on his fifth, otherwise only blows." Youth: "One turn in eight it drinks a girl's MP."

**The setting.** *Ronso trust: low (the hostile fight) or high (the friendly bout).* The tooltip says: "In the game this follows how you answered the Ronso on Mt. Gagazet." **Default: low** (the game requires every conversation answered well to reach the friendly bout; RE §1).

## 3. Engine work

Checked by reading `origin/main` 63813367c.

| # | Item | Why | Size |
|---|---|---|---|
| E1 | `ai/garik.ts`: Garik's two modes (hostile: Bane Lance on the first Black Mage without Curse in the order Yuna, Rikku, Paine; the seventh-turn Mighty Guard; Blind or Attack on `% 4`; friendly: the eight-poll Protect/Shell beat starting at 3) and the Youth's two modes (`% 8` MP Blowout) and the shared "too long" block | RE §2; modeled on `leblanc-syndicate.ts` and `valefor.ts` | 3 h |
| E2 | Enemy defs `x2-garik`, `x2-ronso-youth`, two groups (hostile, friendly), eight ability rows (Attack, Bane Lance, Blind, Mighty Guard on all monsters, own Shell and Protect, MP Blowout, the five too-long rows), two monster records + fixture | RE §0, §3 | 3 h |
| E3 | **Targeting by dressphere and by Curse**: "the first girl wearing Black Mage who lacks Curse" and "a girl who is not Darkened" | `ctx.girls()` and `lacking(girls, status)` exist (`script-rolls.ts`); the dressphere test is the unknown — T0 proves it | 1 h |
| E4 | **MP-damage row with a target pick by most MP** | the Maesters and Den of Woe have MP rows; `extremeId(..., 'max')` exists | 0.5 h |
| E5 | **A chapter-level option "Ronso trust"** selecting which of the two groups launches | `trema-options.ts` and `experiment-levels.ts` are the precedents | 2 h |
| E6 | Confuse making a monster pick from its move list (the guides' Mighty Guard learning trick) | the Gun Mage learning beat is out of scope; whether confused enemies use their waza list is a T0 check | check |

**Exists and is enough:** the hidden-chapter scaffolding of the Valefor chapter (record, meta, door, results, guide, tactic), Mighty Guard on all monsters (Not-So-Mighty Guard), the multi-body groups, per-unit memory for the counters, the uniform pick where the scene has no positions. Shared hot spots are the wave's integrator commit.

## 4. The party

**The Chapter 3 end preset `djoseBuild`** (Yuna Lv 32, Rikku Lv 33, Paine Lv 34; Samurai and Lady Luck owned; the Chapter 3 bag), unmodified. **Why:** the mission sits late in Chapter 3 (after the Trainer scene and Bevelle, the Calm Lands), so the end-of-chapter preset is the nearest sourced build; the preset also owns Confuse's prerequisite abilities no more than the guides ask. `[estimate]` for the levels (no source gives one at the summit). **Alternatives:** `besaidBuild` (Chapter 2 carried: harder), a Lv 40 variant (easier). Measured, not recommended.

## 5. The arena

The summit of Mt. Gagazet. `gagazet` and `gagazet-ronso` exist (the FFX Ronso chapter's; the summit proper has none, per the wave-2 notes). **Recommended: `gagazet` with a snow-and-wind grade as the stand-in**, flagged; **alternative:** derive `gagazet-summit` (one plate; prompt and seed saved; replaces no approved painting).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Garik Ronso** | none | 1 body x 4 poses (idle, attack, hurt, ko); the lance is baked in; two palettes not needed |
| **Ronso Youth** | `biran-ronso` and `yenke-ronso` (FFX) recoloured or redrawn to the FFX-2 look; style fit unverified | 1 body x 4 poses, one variant (so the hostile pair read as two) |
| Plate | `gagazet` + grade | 0 to 1 |
| Party | the Chapter 3 dresspheres exist | 0 |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy). The art lane pilots Garik and one Youth (3 to 5 poses) and Bailey looks before a batch. ComfyUI wall time serialises through `RIG-RECORD`; the plan's A6 holds (A5 here).

## 7. Presentation and music

One layout, no options round for the fight itself (a single link). The one visible choice is the option of section 2. **Music** (rule 13): stand-ins: battle `boss-ffx2-fallen-aeons` (the brass-and-drums duel cue), alternative the Ronso chapter's cue; victory `victory-ffx2`. **Story:** our own words, three beats (Garik's challenge, a bark at the first Mighty Guard, his words after the bout), following `research/writing-bible.md`; the friendly bout's words are warmer (two variants of one line).

## 8. Winnability method, open questions, review class

**Method (measure, never tune):** a vitest bench, advisor line and naive line, Wait and Active clocks, 200 seeds at bench speed and 40 at human speed, for each outcome (hostile, friendly) on the preset and on the two alternatives. Report win rate, KOs, Curse landed, Mighty Guards cast, engine seconds. The sourced difficulty is "not too difficult" (G), so the bench confirms "easy to moderate", not a band; the lever is the party (GA3), never a script.

**Open items (RE §6):** which answer is which and whether the two chapters' scores add: not needed (the setting offers the outcomes); the MP Blowout target set (read as the girl with the most MP); the dressphere test (E3).

**Review class: DEEP** (shared registry tables). The save-data class is not touched (hidden chapter, experiments' own store; the option is a chapter setting kept in the experiments' store, confirm at T7). One release per wave.

## 9. Build order, tracks, and the decisions (recommended picks; the alternative named)

| Track | Work | Hours |
|---|---|---:|
| T0 | engine checks by running it: E3, E6, Curse on Black Mages, Mighty Guard on all monsters | 1 |
| T1 | data: two records + fixture, enemy defs, two groups, ability rows | 3 |
| T2 | `ai/garik.ts` and its script tests (the 8-poll beat; the 7-poll guard; `% 4` and `% 8`) | 3 |
| T3 | the chapter record (`chapter-ffx2-garik-ronso.ts`: id `ffx2-garik-ronso`, game `ffx2`, number 47, title "Garik Ronso", location "Mt. Gagazet — the summit", `buildRef` `djoseBuild`), meta, the option (E5), results | 3 |
| T4 | prep tip, guide page, tactic, scan/sensor texts, door row (typed word `lionheart`, number 47) | 2 |
| T5 | story beats (our words) | 1 |
| T6 | art: Garik, one Youth, optional plate (art lane, wall time on `RIG-RECORD`) | A5 |
| T7 | the bench and tests, handoff note, `CHANGELOG`, the integrator's tables (not this lane's) | 2.5 |

**Total: R0.5 B10 A5 I3.5 = 19 h** `[estimate]` (the plan priced 28; research is spent in the note; no new mechanic beyond a two-value option). Counted the way the Valefor chapter counted.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| GA1 | Scope | the Chapter 3 summit fight, both outcomes | hostile only (no option, -2 h) |
| GA2 | The "answer" | a two-value chapter option, default low (hostile) | both back to back as two acts (not the game's rule); or fixed high |
| GA3 | Party | `djoseBuild` | `besaidBuild`; a Lv 40 variant; measured as what-ifs |
| GA4 | Script text | **follow each script exactly**, including the friendly Garik's fixed beat and no Mighty Guard | none (a boss-side change needs a measured option and Bailey's yes) |
| GA5 | The "too long" block | port it (about 15 lines, one test) | leave it out and say so |
| GA6 | Arena | `gagazet` with a summit grade | derive `gagazet-summit` |
| GA7 | Art | Garik new; Youths from the Ronso brothers | all three new |
| GA8 | Music | `boss-ffx2-fallen-aeons`, `victory-ffx2` (rule 13) | the Ronso chapter's cue |
| GA9 | Id, number, word | `ffx2-garik-ronso`, **47**, **`lionheart`** (in the plan's pool; fits the door rule; re-run `door-check.mjs` at the integrator) | `ronso` |
| GA10 | Mighty Guard learning | out of scope (a Gun Mage beat of the guides) | a note on the tactic page only |

## 10. Size and risks

1. **The dressphere/Curse test** (E3): if the engine has no "current dressphere" read for a script, add it (small, additive).
2. **The option** is a new chapter setting: it must stay out of the save schema (confirm at T7).
3. **Two scenes, one script**: tests must run both with the same seed.
4. **Art:** two bodies; the pose-recipe lesson (pilot first).
5. **Shared tables** conflict with the other wave-4 lanes: the integrator's job.

## Corrections and findings

1. The "skip" reason is a score that picks a scene (RE §1); both outcomes are the game's, so no new default invented.
2. Friendly Garik has no Mighty Guard and no Bane Lance; the guides' "never on his own" is the script (RE §2.2).
3. The Youths are delayable; Garik is not (special words).
4. Row 324 (Cup Garik) is a different, much stronger fight (Lv 67, 88,000 HP); its script is a variant in row 38.
5. A live "too long" block exists in both scenes.
