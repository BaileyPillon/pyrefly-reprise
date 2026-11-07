# Paper preflight (draft): Chapter 48 (hidden) — Shinryu, the Monster Arena's deep-water dragon (FFX) — branch `ch-shinryu`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`, `ch-penance-review.md` and the wave-3 drafts: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-07 by a Sonnet sub-agent of the release driver, as the paper preflight of plan row 48 (wave 4) from its research note (`re-ffx-shinryu.md`, "RE §n" below). It is a **draft**: the driver reads it, takes or overturns each pick in section 9, and a build lane starts from it. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables).

**Authority (relayed words, verbatim):** 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note; `origin/main` 63813367c by `git show` (`src/data/ffx/builds/penance.ts`, `celestial-weapons.ts`, `swimmers.ts`, `mirror-aeons.ts`; `data/chapter-flooded-ways.ts`, `flooded-ways-ids.ts`, `docs/handoff/ch-flooded-ways.md` and `r76b-art-install.md` for the water rule and plates; `data/chapter-penance.ts`); `PLAN.md` rows 35, 36, 48; the wave-3 draft `ch-weapon-review.md` for the Monster Arena chapter shape. Nothing was run, so rule 3 is owed by T0.

**Verdict: PROCEED.** One monster, three moves and a counter; the water rule, the swimmers' line-up, the Celestial weapons and the endgame caps exist. The one real question is the party, and the files answer it (summary 7 of the note). Everything Bailey will see waits for the picks of section 9 (hard rule 9), which the driver takes under the delegation above.

## 1. Game case and sources

**Game case: FFX only.** A Monster Arena original creation; CTB, the swimmers, FFX status rules. The shared plumbing is "both" (CHK-020) and additive.

**Sources:** the monster record and its 478-byte script, run on the real bytecode (RE §0, §2); the formation (in-water flag, camera-only script) (RE §0); the repo's water rule and Celestial weapons; Jegged's creation page (RE §1). **The plan's row 48 corrected by the files:** the "177 KB" is motion data (the script is tiny); the build is not row 36's (endgame swimmers: Tidus, Wakka, Rikku from the Penance preset), the plate is (`via-purifico-flooded-3` or `baaj-waterway`); research is done; the fight is a 21-hit race against a one-in-three Petrify, not a wall.

## 2. What the player experiences (plain words)

Three swimmers dive into the deep with the best weapons they have. Shinryu hangs in the water above them. He claws, he flares in eight small bursts across all three, and one turn in three he points a finger and a friend is turned to stone and shatters. Every blow that lands is answered with a claw. The player has to make about twenty-one 99,999-point hits before the third Eraser.

| Beat | What happens (RE §2) | What it asks of the player |
|---|---|---|
| Each Shinryu turn | one third **Shining** (8 hits of power 9 on all three), one third **Eraser** (Petrify 255 on one, shatter in water; Attack if only one is alive), one third **Attack** | Kill fast: every extra turn is a one-in-three chance to lose a swimmer for good |
| Every hit that takes HP | a **counter Attack** on the hitter | Auto-Protect/Haste and HP; a counter is small at the caps (about 700) |
| The race | 2,000,000 HP = 21 hits at the 99,999 cap | Celestial weapons (Break Damage Limit), Overdrives, Quick Hit, Mix |

**Seams.** One link, one arena, no second phase. A shattered swimmer does not return (the water rule); a loss is the chain's ordinary loss. **Intent-board lines (our own words, numbers from the file):** "One turn in three he turns a swimmer to stone, and in this water stone shatters. Win before the third." "Every blow he feels, he answers."

## 3. Engine work

Checked by reading `origin/main` 63813367c.

| # | Item | Why | Size |
|---|---|---|---|
| E1 | `ai/shinryu.ts`: the draw `% 3` (Shining, Eraser/Attack by living count, Attack) and the counter on any HP-taking hit | RE §2; modeled on the Omega/Ultima counter scripts | 1.5 h |
| E2 | Enemy def, monster record + fixture, the three ability rows (Attack, Eraser, Shining); loot: AP 50,000, Wings to Discovery / Dark Matter | RE §0, §3 | 3 h |
| E3 | **Petrify with chance 255 ignores Ribbon and Stoneproof**; in water it shatters | the Flooded Ways chapter has the shatter rule; whether chance 255 bypasses the autos is a T0 check | 1 h |
| E4 | **A boss HP bar with 21 segments** (HUD, section 7 option A) | a small chip over the boss HP widget | 2 h |
| E5 | **The party preset `shinryuBuild`** from the Penance preset's Tidus, Wakka, Rikku | `penance.ts` members + `celestial-weapons.ts` | 1.5 h |

**Exists and is enough:** the three-swimmer line-up with Escape/Flee/Switch off and the in-water shatter (`flooded-ways*.ts`), Break Damage Limit and the 99,999 cap, the Celestial weapon rows, the endgame caps and armour sets, the hidden-chapter scaffolding (record, meta, door, results, guide, tactic) and a single-link group. Shared hot spots are the wave's integrator commit.

## 4. The party

**Tidus, Wakka and Rikku, taken from the Penance preset (`penance.ts`): HP 9,999, MP 999, the seven other stats 255, Luck 85, Auto-Haste, Auto-Protect, Auto-Potion, Defense +20 percent, the Celestial weapons Caladbolg, World Champion and Godhand (Break Damage Limit built in), Penance's bag with Phoenix Downs; no Yuna, no bench, no aeons, Escape/Flee/Switch off.** Every number but the Celestial rows and the caps is an `[estimate]` (the Penance preset's own tag). **Why:** (1) the guides ask for exactly this ("properly levelled characters with their strongest weapons are a necessity", Jegged); (2) the repo already owns it; (3) it keeps the bench's levers in one file. **Alternatives:** the same trio with plain weapons plus Break Damage Limit (the bench's what-if: the same 99,999 cap, no Celestial HP formula); the Flooded Ways' Highbridge-cell swimmers (far too weak: 201 hits at 9,999). No Ribbon (Eraser ignores it).

## 5. The arena

The game's stage 106 is a sea stage (shared with the S.S. Liki and the arena tests); not rendered. **Recommended: `via-purifico-flooded-3` (the submerged variant, r76b) as the stand-in**, graded darker if the art lane has an hour; **alternatives:** `baaj-waterway` (pale stone, green light) or a new `deep-sea` plate (one plate; prompt and seed saved; replaces no approved painting).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Shinryu** | none (a long water dragon; Sin's parts and Evrae are the staging precedent for a large body) | 1 body x 5 poses (idle, attack, cast, hurt, ko); large |
| Plate | `via-purifico-flooded-3` | 0 (a deeper plate optional: 1) |
| Swimmers | the swim poses of the Flooded Ways chapter | 0 |
| Portrait | none needed | 0 |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy). The art lane pilots Shinryu (3 to 5 poses) and Bailey looks before a batch. ComfyUI wall time serialises through `RIG-RECORD`; the plan's A6 holds.

## 7. Presentation needs, and three layouts for the mockup lane (end state first, hard rule 9)

* **A. The wall in segments (recommended).** The boss bar is drawn as twenty-one cells of 99,999; each hit that lands knocks a cell, the counter of "hits to go" sits beside it; a thin Eraser tell (a flash on his hand) one beat before it fires. Reads at phone width; makes the race visible. Cheapest honest option.
* **B. The drowned court.** A bubble layer, swim bobbing and a rolling light shaft; no HUD change. More atmosphere (+3 h).
* **C. The card.** Title card and results card only. Lowest cost.

**Pick: A.** **Music** (rule 13): stand-ins: battle `boss-challenge` (the generic boss cue in our take), victory `victory-ffx`; alternative the Penance chapter's cue. No new cue; the audition page lists the choice. **Story:** our own words, three beats (the dive, a bark at the first Eraser, the surfacing), following `research/writing-bible.md`.

## 8. Winnability method, open questions, review class

**Method (measure, never tune; the Penance bench's, `tests/unit/helpers/penanceBot.ts`):** a vitest bench with a driver helper, 200 seeds at bench speed and 40 at human Wait-split speed. Rows: the shipping preset (Celestial weapons); the plain-weapon what-if; a no-Auto-Haste what-if. For each: win rate, Erasers landed and swimmers lost, hits to kill, engine seconds. **Reading the result:** the sourced difficulty is "a necessity: best gear" (G), no band; the Penance and Mirror Aeons precedent is Bailey's "not too easy not too hard" measured at **60 to 80 percent** on the shipping preset; if a row is far outside, the lever is the party (SH2), never a boss number.

**Open items (RE §6):** whether chance 255 bypasses Ribbon and Stoneproof in the engine (E3); the group read of the alive property (irrelevant to the build); the gear drop (not modelled); stage 106's look (the art lane).

**Review class: DEEP** (shared registry tables). The save-data class is not touched (hidden chapter, experiments' own store). One release per wave: focused review before, deep after on the live build.

## 9. Build order, tracks, and the decisions (recommended picks; the alternative named)

| Track | Work | Hours |
|---|---|---:|
| T0 | engine checks by running it: E3 (chance 255 vs Ribbon, shatter), the counter on any HP hit, the one-alive rule | 1 |
| T1 | data: record + fixture, enemy def, abilities, group (in-water, Escape/Flee/Switch off, Normal start), loot | 3 |
| T2 | `ai/shinryu.ts` and its script test (the exact 1/3 splits of `t-shinryu.out.txt`, the counter, the one-alive case) | 1.5 |
| T3 | `shinryuBuild` and the chapter record (`chapter-shinryu.ts`: id `shinryu`, game `ffx`, number 48, title "Shinryu", location "The Monster Arena — deep water"), meta, results | 2.5 |
| T4 | prep tip, guide page, tactic, scan/sensor texts, door row (typed word `shinryu`, number 48) | 1.5 |
| T5 | segmented boss bar (option A) | 2 |
| T6 | story beats (our words) | 1 |
| T7 | art: Shinryu (art lane, wall time on `RIG-RECORD`), optional deep plate | A6 |
| T8 | the bench and tests, handoff note, `CHANGELOG`, the integrator's tables (not this lane's) | 3 |

**Total: R0.5 B9 A6 I4 = 19.5 h** `[estimate]` (the plan priced 30; the 6 h of research are spent in the note; no new mechanic). Counted the way the Keeper preflight counts.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| SH1 | Scope | the one fight as the arena gives it (a single link) | add an unlock gauntlet of the three underwater fiends (Achelous, Maelspike, Splasher) as a prologue (not recommended: three more fights) |
| SH2 | Party | the Penance preset's Tidus, Wakka, Rikku with Celestial weapons (section 4) | plain weapons plus Break Damage Limit; measured as what-ifs |
| SH3 | Arena | `via-purifico-flooded-3` | `baaj-waterway`, or a new deep-sea plate |
| SH4 | Script text | **follow the script exactly**: the counter on every HP-taking hit, Eraser only with two or more alive; the intent board says so | none (a boss-side change needs a measured option and Bailey's yes) |
| SH5 | Eraser | Petrify 255 as the row has it; shatter in water (E3) | none |
| SH6 | Start | Normal start | a free first turn (not sourced) |
| SH7 | HUD | the segmented boss bar (option A) | the plain bar |
| SH8 | Music | stand-in `boss-challenge`, `victory-ffx` (rule 13) | the Penance cue |
| SH9 | Id, number, word | `shinryu`, **48**, **`shinryu`** (in the plan's pool; fits the door rule; re-run `door-check.mjs` at the integrator) | `leviathan` |

## 10. Size and risks

1. **E3 fails** (the engine lets Ribbon or Stoneproof stop a chance-255 Petrify): fix in the status step, additive and tested; the note says so.
2. **Too easy at the caps** (21 hits in about two of his turns) or **too hard for a thin preset**: the lever is SH2; no boss row moves.
3. **Art:** one large body (the pose-recipe lesson).
4. **Shared tables** conflict with the other wave-4 lanes: the integrator's job.

## Corrections and findings

1. The "177 KB script" is motion data; the script is 478 bytes of code and the formation script is camera only (RE §0).
2. The build is the Penance party's swimmers, not row 36's Highbridge cells; the plate is row 36's flooded Via Purifico (RE summary 7).
3. Shinryu counters every hit that takes HP, not only physical hits (RE §2).
4. With one member left, Eraser is replaced by Attack (RE §2).
