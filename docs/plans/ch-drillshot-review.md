> **Status 2026-11-06: paper preflight DRAFT for plan row 37, not built.** Written by a Sonnet sub-agent of the release driver from `re-ffx2-bevelle-underground.md` (same folder). Under Bailey's blanket yes ("implement all unimplemented chapters please", ~00:30 EST; "yes on all these too", ~00:55 EST; "i'll go with all of your recommendations", 2026-10-31) every pick below is the recommendation, "driver's call, his to overturn", with the alternative named. Nothing was built, run in a browser or deployed.

# Paper preflight: hidden FFX-2 chapter 37, "The Guardians of the Bevelle Underground" (Georapella, Precepts Guard, Baralai), door word `drillshot`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`: a number is read the way the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.**

**Read:** `re-ffx2-bevelle-underground.md` ("RE §n" below; rows 262, 263, 175, the three AI scripts, the formations, the launch), `research/re-ffx2-fallen-maesters.md` and `docs/plans/ch-keeper-review.md` (the templates), `docs/handoff/ch-maesters.md` (the nearest FFX-2 precedent and its T0 findings), `src/battle/ffx2/ai/den-of-woe.ts` (the Baralai shade's AI, the template for row 175), `src/data/ffx2/builds/bevelle.ts`, `PLAN.md` sections 3, 7 and 8. Engine claims were read on `origin/main` `cd4aee3ce`.

**Verdict: PROCEED on data, AI and the small seams; everything Bailey will see or hear (the guardians' look, the arena variants, the stand-in music) is the recommended pick below, flagged for his veto (hard rule 9 satisfied by his blanket yes).**

## 1. Game case and sources

**Game case: FFX-2 only** (rule 14): ATB, dresspheres, the FFX-2 monster rows 262, 263, 175 and their three AI scripts; the "echo of Geosgaeno" the wiki mentions is a developer-label echo only (RE §2.3), so **nothing applies to FFX plan row 36**. The chapter registration, the door row and the party-size-independent plumbing are shared plumbing, "both" for CHK-020, inert elsewhere.

| Source | What it gives | Tag |
|---|---|---|
| RE note, `monster.bin` rows 262/263/175, `m262/m263/m175.src` and their compiled workers, `btl.txt`, event packages `stbv0300`, `stbv0700` | records, formations, whole AI, the launch sites | [R] (FFX2_Data.vbf, Steam build 25501027) |
| `src/data/ffx2/builds/bevelle.ts` | the Bahamut build (Yuna 23, Rikku 24, Paine 25), Chapter 2 build point | [estimate] build, sourced build point |
| `src/battle/ffx2/ai/den-of-woe.ts` D1 to D12 | Baralai's cycle, burst counter and low-HP rule for the shade (row 176) | [R] via `re-ffx2-ai-leblanc-den-ixion.md` |
| Candidates note, wiki | story weight; "Drill Shot after ten hits" | [W], agrees with [R] |

## 2. What the player experiences, turn by turn (plain words)

Everything below is the game's own rule set (RE §4 to §7) unless tagged `[derived]`.

**The chain.** Three fights, one after the other, a 15-second seam between them in which the girls' HP and MP are restored and a fallen girl stands (the Maesters chapter's pattern; `docs/handoff/ch-maesters.md` §1.2). Escape is off. **Order (pick BG1):** Georapella (Lv 17, 4,420 HP), Precepts Guard (Lv 21, 3,680 HP), Baralai (Lv 24, 3,380 HP): ascending level, the floors 3, 3 and 7 of the dungeon (the game's own order for the two floor-3 fights is unread, RE §10.1).

**Act 1, Georapella.** A tall guardian with 9,999 MP that does nothing but cast one party-wide Ga spell per turn in a fixed rotation (Thundaga, Waterga, Firaga, Blizzaga) starting at a random point; each is about 200 before Shell, a 3.3 s charge. Weak to Holy, null Gravity, immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Stop and Doom, so **Slow works** and stretches its pace. 4,420 HP at a 3.3 s cycle is a race the party should win without drama; **the lesson is Shell and a healer** (RE §6.2).

**Act 2, Precepts Guard.** Slower (4.4 s charges), more varied: every turn a third of the time **Demi (a quarter of every girl's current HP)**, otherwise Slow on the party, Death on one girl (chance 254), Osmose, or Drain, sometimes a Bio on one of them first (RE §6.3). Immune to Slow itself; take ATB damage and can be interrupted. **The lesson is Death-proofing and the Demi tax.**

**Act 3, Baralai.** The living Baralai, Lv 24, fast (AGI 135, 2.6 s between attacks), evasive (EVA 33). A seven-turn cycle: Attack, Attack, Glint (the party), a three-strike Chain Attack at Yuna, Rikku, Paine, Attack, **Looming Glacier (drains the most-MP girl's MP and Stops her)**, Demi or Attack. **Every tenth result landed on him, his next turn is Drill Shot: 75 percent of the maximum HP of the girl who made the latest result** (Protect halves it). Below a quarter of his HP he adds an Absorb one turn in four. **The lesson is the counter**: attack with the girl who can take the shot, or stop hitting him for a turn when the count is at nine (RE §6.4). He is blindable (unlike the shade).

**What ends it.** A clear of all three goes to the experiments' own store (never the save); a defeat on act 1 restarts the chapter, on acts 2 and 3 retries that act (Maesters rule). `[derived]`

## 3. Engine work

Each RE need is mapped to `origin/main` `cd4aee3ce`: **existing**, **partly**, **new**; sized `[estimate]` S under 1 agent-hour, M 1 to 3, L over 3. Host files at the 400-line cap (`encounters.ts` 399, `chapter-meta.ts` 396, `data/ffx/index.ts`, `setup.ts`) take net-zero edits only; new logic goes in new files.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Enemy records and move rows for 262, 263, 175 (stats, elements, resists, rewards with ids from RE §4.1) | **New data**; several move rows exist for the shade (0x4100 to 0x4103, 0x4040) | `data/ffx2/enemies/bevelle-guardians.ts`, `...-abilities.ts`, `command-records/`, `monster-records/` | M |
| 2 | Georapella: start draw and four-spell rotation; Osmose below 25 MP (dead branch) | **New script**, pattern `ai/fallen-maesters-a.ts` | `ai/bevelle-guardians.ts` | S |
| 3 | Precepts Guard: `% 3` then `% 5` draws, Bio-before-Drain double queue, Reflect gates | **New script**; double queue exists (the shade's Regen + normal move); `lacking(girls, 'reflect')` exists | same file | S to M |
| 4 | Baralai 1: seven-poll cycle, result counter at 10, Drill Shot at the latest attacker, Absorb extra below a quarter | **Partly**: `den-of-woe.ts` D1 to D5 is the template (`onResults`, latest attacker, queued second command) | same file; `DRILL_SHOT_AT` is a parameter | S |
| 5 | Percent formulas 4 and 7 (Demi 25 percent of current HP; Drill Shot 75 percent of max; Looming Glacier all max MP) | **Existing** (`kernel/damage.ts`) | data rows | none |
| 6 | Slow, Stop, Poison, Death statuses on girls | **Existing** | data rows | none |
| 7 | Holy weakness and Gravity null on a boss (element bytes) | **Existing** (`affinities`) | enemy defs | none |
| 8 | Interrupt and ATB damage allowed on bosses 262/263 (special bits 6, 9 clear) | **Partly**: bit 6 and bit 1 are read by `atb-engine.ts` (Maesters N8); **bit 9 (Interrupt immunity) to check** | `atb-engine.ts` | S |
| 9 | Death (accuracy formula 4, chance 254) lands per the status kernel | **Existing**; check the formula-4 accuracy is mapped | `kernel/status-inflict.ts` | S |
| 10 | Item ids for the three drop/steal rows (0x902e, 0x905a, 0x904e, 0x9072, 0x2024, 0x203a) | **New ids** (RE §4.1) | `monster-records/kill-rewards.ts` | S |
| 11 | Start positions for 227 and 229 (empty in the game) | stand-in constants, flagged `[inferred]` (Georapella's `pos` for 227; the Bahamut scene for 229) | `scenes/` | S |
| 12 | Chain plumbing: ids, number 37, door `drillshot`, meta, pause card, guide, story, tactic | **New**, via side tables and new files; the nearest precedents are Last Summoning (14 files) and Angra Mainyu (43 files) [`ch-keeper-review.md` §3 row 17] | many | M to L |
| 13 | **Reflect redirect** | **Not built** (Maesters T0 1); the guardians' Ga/Death/Bio/Slow/Drain are reflectable. **A known gap, not tuned** | `kernel/hit.ts` | RE's job |

**Order of dependence:** 1 before 2 to 4; 4 follows `den-of-woe.ts`; 12 last and in the wave integrator's commit (PLAN §7).

## 4. The party

- **The sourced build point is already in the repo:** `bevelleBuild` (Chapter 2, Bahamut's dungeon): Yuna 23 (White Mage), Rikku 24 (Dark Knight), Paine 25, accessories, Garment Grids, learned abilities, the `[estimate]` bag. **Pick BG2: use `bevelleBuild` unchanged.** The floors 3 and 7 come earlier in the same dungeon, so the levels may be a few lower in the game (RE §10.2); a lower-level variant is **not built** (rule 6: no source).
- **Holy is the guardians' weakness** and no member's kit gives it; nothing is added (rule 6).
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line is unwinnable or trivial, Bailey gets options with numbers.

## 5. The arena

- **`bevelle-underground` exists** (plate `backdrops/bevelle-underground.png`, depth map and `@2x`, scene registered; Bahamut's chamber: a machina cathedral with a venting pit). The game's rooms are "Under-Bevelle exterior" (floor 3, both guardians) and "artificial parts" (floor 7, Baralai) (RE §5.1): different places from Bahamut's.
- **Pick BG3 (recommended): reuse the plate for all three acts** (0 new plates; the stand-in is flagged in the chapter card text, as the Maesters/Cloister reuse was). Alternatives: (b) two derived floor variants of the same plate (one for the floor-3 exterior, one for the floor-7 corridor), +2 art hours; (c) three new plates, +6 hours. Camera rigs: the scene's existing rigs; the phone tier uses the scene's phone rigs if any.

## 6. New art needed

Poses follow the repo's boss sets (idle, attack, cast, hurt, ko; idle@2x).

| Asset | Images | Note |
|---|---:|---|
| Georapella (the FFX-2 look is unread; a guardian that only casts) | 5 | idle, cast (the Ga), hurt, ko, idle@2x; no attack pose (it never attacks) |
| Precepts Guard | 5 | idle, cast (Demi, Death, Slow, Bio, Drain, Osmose all read as casts), hurt, ko, idle@2x |
| Baralai (living, Praetor, staff) | 2 new + 4 recoloured | **`baralai-shade` exists (idle, cast, hurt, ko)**; recolour it to a living man (drop the pyrefly treatment) and paint **attack** and **glint/chain** poses (the shade has no attack pose); the staff is painted in (row 298 is a visual prop) |
| Backdrop | 0 | BG3 |
| Chapter card, thumbnail, pause plate | 3 | from the chosen look |
| **Total** | **about 14 to 16** | of which 4 are recolours; ComfyUI wall time serialises through the machine-wide render lock |

- Art route is the driver's (the approved pipeline; no Meshy, no 3D). Nobody queues ComfyUI here (rule 12 / NOW.md). Retail references are allowed since 2026-10-18; the painting that ships must match the approved painted look (rule 9, "new art matches the game's art"). Bailey alone approves a painting.

## 7. Presentation needs

New on screen: nothing mechanical beyond the Drill Shot count. **Pick BG4: no counter HUD** (the game shows none); the guide card says "the tenth hit calls Drill Shot" (our words, the Den shade's `baralai-count-seven` callout is the precedent: an entrance callout once). Layouts: the existing FFX-2 HUD at 1600 x 900 and 390 x 844; no new rails.

## 8. Music (flagged stand-ins; rule 13: only his ears judge)

`boss-bahamut` (FFX-2, the piano lament that already plays in this dungeon) for acts 1 and 2; `boss-den-of-woe` for act 3 (Baralai: "old comrades in the dark"). **Pick BG5; alternative:** one cue for the whole chain. `victory-ffx2` for the results.

## 9. Winnability and how it is measured

Copy `tests/unit/chapters/den-of-woe-bench.test.ts` and `fallen-maesters-bench.test.ts` (the FFX-2 bench harness): a tactic per act, first-try and within-five counts at 1.0 / 1.5 / 2.5 s a menu with `PYREFLY_MEASURE=1`, **never a boss number moved**. Figures to watch: Drill Shot (75 percent of a girl's max HP) against Yuna's HP; Demi's 25 percent per turn on the party; Georapella's 200 a girl per 3.3 s. A winnability line must be recorded before any ship.

## 10. Review class

By `critic/RUBRIC.md` §4 and the plan's §7: new hidden chapter + shared plumbing → **focused review before the wave's deploy, deep review after on the live build** (not the save-data class). The party build file `bevelle.ts` is not modified. `node tools/critic-plan.mjs --paths <the chapter's files>` on the lane's tree will say the exact class.

## 11. Picks (driver's call, his to overturn)

| # | Pick | Alternative |
|---|---|---|
| BG1 | order Georapella, Precepts Guard, Baralai; 15 s full-restore seams | game order unread; carry HP across acts |
| BG2 | `bevelleBuild` unchanged | lower-level variant (no source) |
| BG3 | reuse the `bevelle-underground` plate | two derived variants (+2 h) or three new plates (+6 h) |
| BG4 | no count HUD, one entrance callout | a visible counter (invented UI) |
| BG5 | `boss-bahamut` acts 1-2, `boss-den-of-woe` act 3 | one cue throughout |
| BG6 | row 176 is **not** rebuilt (chapter 15 keeps it) | none |
| BG7 | Oversoul scripts `o262`, `o263` **not built** (unreachable, RE §4.4) | none |
| BG8 | number **37**, word **`drillshot`** (PLAN §8, checked) | none |

## 12. Size (estimate, Sonnet agent-hours, counted as `ch-keeper-review.md` counts)

R 1 (the open items of RE §10 that change nothing built), B 11 (data and three scripts 6, chain and plumbing 5), A 5, I 7 = **about 24** (the plan's 30 less the 6 h of research this note did). Wave 2, the continuity tree (PLAN §6).

## 13. Top risks

1. **Drill Shot on Yuna** (75 percent max HP, Protect halves): the tactic must avoid giving the latest result to a squishy girl; the bench decides if the line is winnable.
2. **The guardians' look is unread** (the model files `chr/mon/m262`, `m263` were not opened); painting from a description risks a mismatch with the game. Mitigation: a one-frame look check from the archive's model data in a later lane, not in this one.
3. **Order and expected levels** are the weakest sourced points (RE §10.1, §10.2).
4. **Reflect gap**: the Ga spells bounce in the game when a girl has Reflect; here they do not. Disclosed, not tuned.
