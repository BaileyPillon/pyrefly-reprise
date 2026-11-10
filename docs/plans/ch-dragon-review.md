# Paper preflight (draft): Chapter 51 (hidden) — Gullwings Chapter 1: Boris, Flame Dragon, Guardian Beast, YSLS-Zero (FFX-2) — branch `ch-gullwings-ch1`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `ch-ifrit-review.md`, `ch-farplane-cup-review.md` and the wave-3 and wave-4 drafts: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-09 by a Sonnet sub-agent of the Echoes of Spira driver as the paper preflight of plan row 51 (wave 5, number 51, word `dragon`) from its research note (`re-ffx2-gullwings-chapter1.md`, "RE §n" below). It is a **draft**: the driver takes or overturns each pick in section 9. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables).

**Authority (relayed words, verbatim):** 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note; `origin/main` bc93b1fdd by `git show` (`src/data/chapter-ffx2-bevelle-guardians.ts`, `chapter-ffx2-ifrit-kilika.ts`, `ffx2/builds/besaid.ts`, `bevelle.ts`, `kilika.ts`, `src/battle/ffx2/ai/script-rolls.ts`, `ifrit.ts`, `valefor.ts`, `dressphere-stats.ts`, `encounters.ts`); Jegged and Gamer Guides FFX-2 Chapter 1; the art mirror (release 75). Nothing was run, so rule 3 is owed by T0.

**Verdict: PROCEED.** Four short scripts, a chain shape the repo already has, no new mechanic. The only open design question is the party (no source), answered by measurement. Everything Bailey will see waits for the picks of section 9 (hard rule 9), which the driver takes under the delegation above.

## 1. Game case and sources

**Game case: FFX-2 only.** Four monster rows of the FFX-2 kernel (132, 122, 162, 47) and their plain-text AI, equal to the compiled workers (RE §1). The FFX Sanctuary Keeper (which the guides say the Flame Dragon recalls) is untouched. Shared plumbing (door table, registry, kill-reward items) is "both" (CHK-020) and additive.

**Sources:** the kernel rows and the AI sources (RE §0, §3); Jegged and Gamer Guides for places, party and order (RE §2, §6). **The plan's row 51 corrected by the files:** Sticky End is a one-shot (the guides say it loops); the Guardian Beast's Curse and Damocles Photon are one four-poll beat in two HP states, not two scripts; the time-out blocks are live in every scene; research is done. **YSLS-Zero also stands in a second scene (`stbv03_224`, Bevelle Underground) with the same script; this chapter uses the Kilika one.**

## 2. What the player experiences (plain words)

A hotspot run: four short fights in the order of the Gullwings' first chapter, the party mended between them. The tone is "early game": each boss teaches one thing.

| Act | Boss (game row) | HP | What he does (RE §3) | What it asks of the player |
|---:|---|---:|---|---|
| 1 | **Boris** (132, Lv 8) | 480 | three clawed attacks, then Sticky End (all three, about 50 each, may Stop), then claw three in four and Spider Bite one in four | Fire or Ice (weak to both); Power Break; a Remedy for Stop |
| 2 | **Flame Dragon** (122, Lv 16) | 980 | opens with Flame Breath on all, then strikes the healthiest girl | Blizzard (weak to Ice); Black Mage; heal; Sentinel on the healthiest girl |
| 3 | **Guardian Beast** (162, Lv 18) | 2,886 | three swipes then Curse; under a third of its HP Damocles Photon: half of everyone's max HP | any element (weak to five); White Mage; Shell; keep Curse off the Spherechanger |
| 4 | **YSLS-Zero** (47, Lv 11) | 1,935 | Haymaker (two hits) nearly half the time, Blast Punch (half of max HP, delays) one in five | Protect; Power Break; a healer every turn |

**Seams.** Three seams, no story card; each link enters at full HP and MP (the arena mends the girls, as the Cup and Guardians chapters). **Intent-board lines (our own words, numbers from the files):** Boris "After three claws he spits a web that hits all of you and may stop one. Then it is claws and the odd bite." Flame Dragon "The first thing it does is breathe. After that it hits whoever is healthiest." Guardian Beast "Three swipes, then a curse. When it is weak, half of everyone's life at once." YSLS-Zero "Half your life in one punch, and a double blow that almost finishes you. Keep a healer going every turn: neither Protect nor Shell blunts that punch." (as shipped; the draft said "Protect first", which the build's measure and the guide contradict: the punch is half of maximum HP, whatever the armour)

## 3. Engine work

Checked by reading `origin/main` bc93b1fdd.

| # | Item | Why | Size |
|---|---|---|---|
| E1 | `ai/boris.ts` (one-shot Sticky End, the 3/4–1/4 draw), `ai/flame-dragon.ts` (opener, `extremePick` max HP, the HP-under-100 second breath), `ai/guardian-beast.ts` (turn beat, `lacking(girls,'curse')`, the third-of-HP switch), `ai/ysls-zero.ts` (the nested draws, `extremePick` min/max HP, the farthest pick as a uniform pick) | RE §3; modeled on `ai/ifrit.ts`, `valefor.ts` | 4 h with their script tests |
| E2 | the shared "too long" helper with each boss's marks (Boris 135/140/145/150, Flame Dragon 140/150/155/160, Guardian Beast 180/190/195/200, YSLS-Zero 135/140/145/150) | RE §5; the Ifrit block ported | 1 h |
| E3 | enemy defs `x2-boris`, `x2-flame-dragon`, `x2-guardian-beast`, `x2-ysls-zero`, nine ability rows (the Attack no-cancel row exists), monster records and fixture `gullwings_ch1_rows.json` | RE §0, §4 | 3 h |
| E4 | percent-of-max-HP rows (Damocles Photon, Blast Punch) and the one-shot Stop of Sticky End: **check** that f7 reads the target's max HP and that Shell halves the former (Gamer Guides: "25 percent under Shell") | RE §4 | check |
| E5 | `SCENES.boris` (the girls at (0,0,-45), (15,0,-45), (-15,0,-45), Boris at (0,0,25)) | RE §0 | 0.5 h |

**Exists and is enough:** the chain loop (`nextGroupId`, `restoresPartyOnEntry`, `noSaveSphereCard`), the hidden-chapter door, results, guide and tactic scaffolding of the Cup and Guardians chapters, two-hit rows, the Curse and Stop statuses, `extremePick`. **Not in the engine, named:** a **per-act party** and a **per-act plate** (the chapter record has one `buildRef` and one `sceneKey`); both are handled by the picks below, with an additive seam as the alternative. Shared hot spots (the unions, the door table, `chapter-numbers.test.ts`, `route-pure.mjs`, `artNamespace.ts`, `CONTRACT-CHANGES.md`, `CHANGELOG.md`, `THEMES.md`) are the wave's integrator commit.

## 4. The party

**Recommended (DR2):** a new `chapter1Build` (`src/data/ffx2/builds/chapter1.ts`): Yuna a Gunner, Rikku a Thief, Paine a Warrior, with the Songstress, Black Mage and White Mage owned (the guides give the last two after Boris and the Flame Dragon; the Songstress is Yuna's from Luca), no Lady Luck, Samurai, Gun Mage, Berserker or Trainer. **Levels `[estimate]` (no source gives any below the Chapter 2 preset's 23/24/25): a starting guess of Lv 12/13/14, Paine ahead as in every preset; the engine's stat table extrapolates below its Lv 20 anchor.** Accessories and bag: the Red and White Rings of the guides, Potions, Hi-Potions, Remedies (a Stop answer), Phoenix Downs: counts `[estimate]`. **Why one build:** the chain has one `buildRef`, the repo pattern; the cost is that act 1 and 2 are easy for it, which is what both guides say of them. **Alternative (DR3):** an additive per-link build override read by the chain loop at re-init (about 3 h, a `CONTRACT-CHANGES` entry), levels stepping with the story; not recommended unless the bench shows acts 1 and 2 are trivial enough to bore.

## 5. The arena

**Recommended (DR4):** one plate for the chain, `zanarkand-dome` (stone ruins: it fits the Floating Ruins and the Zanarkand Ruins, and is a flagged stand-in for the Besaid cave and the Kilika approach). **Alternative:** per-act plates through an additive scene key on `EnemyGroupDef` (3 h) with `gagazet` for Boris, `ffx2-djose-chamber-standin` for the Besaid cave and the Kilika approach (the Valefor and Ifrit chapters' stand-in) and `zanarkand-dome` for the Beast: four stand-ins, two painted plates later (Besaid cave, Kilika approach, 2 plates).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Boris** | the `x2-aranea` painting recoloured and scaled (the game's Boris is a spider-fiend, model 0x1084) | 4 poses (idle, attack, hurt, ko) |
| **Flame Dragon** | new painting; **also serves the Zalamander (plan row 55, same model family, motion 0x1078) by recolour** | 5 poses (idle, attack, breath, hurt, ko) |
| **Guardian Beast** | new painting; **also serves Azi Dahaka (row 55, motion 0x10a2) by recolour and scale** | 5 poses (idle, attack, cast for the feather, hurt, ko) |
| **YSLS-Zero** | new painting (a machina fiend; YSLS-99 can recolour it later) | 5 poses |
| Party | the Chapter 1 dress paintings (`yuna-gunner`, `rikku-thief`, `paine-warrior`, `*-black-mage`, `*-white-mage`, `yuna-songstress`) exist | 0 |
| Plates | `zanarkand-dome` | 0 (two optional later) |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy). The art lane pilots one boss and Bailey looks before the batch (pose-recipe lesson). Total about 19 poses. **Alternative with less art:** Boris on the Aranea only and the three other fights as a first release behind a name; not recommended.

## 7. Presentation and music

The Valefor chapter's HUD, nothing new: the Guardian Beast's Curse and the Damocles beat shown as the existing intent line; no counter HUD. **Music** (rule 13): stand-ins `boss-ffx2-fallen-aeons`, `victory-ffx2`, field bed `scene-bevelle-underground`; no new cue. **Story:** our own words, one pre beat and one post beat per act (four short, `research/writing-bible.md`), the Gullwings' first-chapter tone.

## 8. The winnability method, open questions, review class

**Method (measure, never tune; the Valefor and Cup benches'):** a vitest bench with advisor and naive lines, on the Wait and Active clocks, 200 seeds at bench speed and 40 at human speed, party presets Lv 8 to 20 in steps. Report win rate, KOs, Stops, Curses, Damocles hits survived, engine seconds. The sourced difficulty is "Chapter 1": both guides call Boris and the Dragon easy and YSLS-Zero "difficult if insufficiently levelled"; if a row is far out the lever is the party level, never a boss number.

**Open items (RE §8):** the party's levels (U1, estimate), the Gun Mage (U4), the unread Oversoul forms (U3), the farthest pick without positions (U2).

**Review class: DEEP** (shared registry tables). The save-data class is not touched (hidden chapter, the experiments' own store). One release per wave: focused review before, deep after on the live build.

## 9. Build order, tracks, and the decisions (recommended picks; the alternative named)

| Track | Work | Hours |
|---|---|---:|
| T0 | engine checks by running it: f7 percent rows and Shell, the one-shot Stop, Curse as a target filter, stats below Lv 20, Haymaker's two hits | 1 |
| T1 | data: four defs, nine ability rows, records, fixture, group chain | 3 |
| T2 | four AI scripts, the shared "too long" helper, `SCENES.boris`, their script tests | 5 |
| T3 | chapter record (id `ffx2-gullwings-ch1`, game `ffx2`, number 51, title "Gullwings, Chapter 1"), meta, results, `chapter1Build` | 2.5 |
| T4 | prep tip, guide page, tactic, sensor texts, door row (typed word `dragon`, number 51) | 1.5 |
| T5 | story beats (our words, four acts) | 1 |
| T6 | art: Boris recolour, three new bosses (art lane, wall time on `RIG-RECORD`) | A8 |
| T7 | the bench and tests, handoff note, `CHANGELOG`; the integrator's tables are not this lane's | 3 |

**Total: R0.5 B14 A8 I3 = 25.5 h `[estimate]`** (the plan priced 36; the research is spent in the note; the template chapters exist). Counted the way the Ifrit and Cup chapters counted.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| DR1 | Scope | one chain of four acts in the hotspot order; the party mended between acts | two chapters (the two early fights, the two late ones); four chapters |
| DR2 | Party | new `chapter1Build`, Yuna Gunner, Rikku Thief, Paine Warrior, Black and White Mage owned, levels `[estimate]` starting at 12/13/14 and measured | the Chapter 2 preset (above the chapter; a measured what-if only) |
| DR3 | Per-act levels | one build for the chain | an additive per-link build override (+3 h, contract entry) |
| DR4 | Arena | one plate, `zanarkand-dome`, flagged | per-act plates through an additive scene key (+3 h; two painted plates later) |
| DR5 | The time-out blocks | **port them** (one shared helper, four tables, one test) | leave out and say so |
| DR6 | Oversoul forms | **not built** | a second pass (+8 h; scripts unread) |
| DR7 | Art | Boris recolour + three new bosses, two of which are reused by row 55 | zero-art stand-ins (not recommended) |
| DR8 | Music | `boss-ffx2-fallen-aeons`, `victory-ffx2` | none needed |
| DR9 | Id, number, word | `ffx2-gullwings-ch1`, **51**, **`dragon`** (re-checked 2026-11-09 against the 29 words on `origin/main` bc93b1fdd and the words PLAN.md reserves: ok) | `boris` |
| DR10 | Sticky End | follow the file (once), not the guide (looping) | the guide's loop |

## 10. Size and risks

1. **The party is the whole risk:** no source gives a Chapter 1 level; the bench fixes a band and the note says so.
2. **Acts 1 and 2 are easy by design** (the guides' own words): do not tune.
3. **Art:** four paintings, one recipe; the pilot comes first.
4. **Shared tables** conflict with the other wave lanes: the integrator's job.

## Corrections and findings

1. Sticky End is a one-shot; the guides' "looping" is wrong for the HD files.
2. The Guardian Beast's two attacks are two states of one beat (Curse until a third of its HP, then Damocles Photon), and a fully cursed party gets Attacks only until the switch.
3. The Flame Dragon's Tail Smash is commented out in its source and absent from the worker.
4. Every scene has a live "battle too long" block (135 to 200 polls); none is reachable.
5. The Flame Dragon and the Zalamander, and the Guardian Beast and Azi Dahaka, share a model family: one painting each pair.
