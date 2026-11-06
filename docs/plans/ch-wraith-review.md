> **Status 2026-11-06: paper preflight DRAFT for plan row 40, not built.** Written by a Sonnet sub-agent of the release driver from `re-ffx2-yunas-ballad.md` (same folder). Under Bailey's blanket yes ("implement all unimplemented chapters please", ~00:30 EST; "yes on all these too", ~00:55 EST; "i'll go with all of your recommendations", 2026-10-31) every pick below is the recommendation, "driver's call, his to overturn", with the alternative named. Nothing was built, run in a browser or deployed.

# Paper preflight: hidden FFX-2 chapter 40, "Yuna's Ballad" (possessed Rikku and Paine, Yuna alone), door word `wraith`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`: "sourced" and "our estimate" stay apart; nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.**

**Read:** `re-ffx2-yunas-ballad.md` ("RE §n" below), `research/ffx2-gippal-den-of-woe.md` (the wiki-level Den, §2, §3, §4.4), `research/re-ffx2-ai-leblanc-den-ixion.md` §4, `docs/handoff/chapter-den-of-woe-ship.md`, `docs/plans/den-of-woe-bench.md`, `src/data/ffx2/builds/den-of-woe.ts`, `src/battle/common/types.ts:2967` (`FFX2PartyBuild`), `src/battle/ffx2/setup.ts:295,336`, `PLAN.md` sections 3, 7, 8. Engine claims read on `origin/main` `cd4aee3ce`.

**Verdict: PROCEED, but this is not the 14-hour filler the plan priced.** The two scripts are tiny; **the real work is a one-girl party** (RE §9.1). The plan's "shade rows to find in the kernel" resolved to rows 254 and 256, **possessed friends, not shades**.

## 1. Game case and sources

**Game case: FFX-2 only** (rule 14): ATB, dresspheres, FFX-2 rows 254 and 256. Nothing applies to FFX or FF7. The chapter registration and the door row are shared plumbing, "both" for CHK-020, inert elsewhere. **The one shared-contract change** (a party of one to three girls, §3 row 1) is additive and logged in `CONTRACT-CHANGES.md`; the FFX-2 chapters keep exactly three.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `monster.bin` rows 254 to 257, `m254.src`, `m256.src` + compiled workers, `item.bin` rows, the event `kino1300` | records, whole AI, both launches | [R] (FFX2_Data.vbf, Steam 25501027) |
| `research/ffx2-gippal-den-of-woe.md` §2, §4.4, §8 | "Yuna alone" duels, Yuna's Ballad, HP over the five fights | [W]/[J] wiki-level, 3 sources |
| `denOfWoePartyBuild` | Yuna's Chapter V kit with the two options on | `[estimate]` build, sourced build point (repo note G-12: no source gives a player level) |

## 2. What the player experiences, turn by turn (plain words)

**The chain.** Two duels back to back, Yuna alone (pick YB1), escape off. **HP and MP carry from the first duel to the second** (pick YB2; the game's five Den fights have no break, wiki-level); a defeat in the second retries it from the entry state of that duel (the Den's own `checkpointOnEntry` seam is the precedent).

**Duel 1, Rikku (Lv 53, 7,800 HP, AGI 82, MDEF 82, EVA 18).** Possessed, throwing her kit at her friend. Every turn: **Spider Attack (two hits of power 16) 40 percent**; **Grenade on the party (187 to 211, Protect halves) 20 percent**; and one of four elemental throws **(Bomb Core Fire, Arctic Wind Ice, Lightning Marble Thunder, Dragon Scale Water), 10 percent each, 281 to 317 constant** (RE §6.2). She acts every 3.4 s (a throw) or 4.2 s (an Attack). She can be put to **Sleep, Slow, Confuse, Berserk and blinded** (RE §4.2); under Confusion she throws the weak versions (18 to 21 and 75 to 84). **The lesson is that Rikku's damage is constant, so the answer is time and status.**

**Duel 2, Paine (Lv 58, 9,200 HP, AGI 51, DEF 70, MDEF 7).** One move, on the girl with the highest HP, every 6.8 s: Attack (attacker term 417). She is slow and her magic defence is 7: **spells hurt her, blades do not** (DEF 70). All the same ailments land. **The lesson is the right dressphere.**

**What ends it.** A clear goes to the experiments' own store; the post scene is "Freed, Rikku and Paine rejoin" from the repo's Den story draft (pick YB5). `[derived]`

## 3. Engine work

Mapped to `origin/main` `cd4aee3ce`: **existing**, **partly**, **new**; sized `[estimate]` S / M / L as in `ch-keeper-review.md`. Capped host files take net-zero edits.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | **A party of one girl** | **New.** `FFX2PartyBuild.members` is a 3-tuple type (`types.ts:2969`, a contract file: additive change + `CONTRACT-CHANGES.md` entry); `setup.ts` already loops over `party.members` (`:295`, `:336`) so the core may accept a shorter list; the HUD's three slots, the presenter's formation positions and the end-of-battle check are the unknowns. **A T0 probe (a Vitest building a one-member party and running polls) decides the size** | `types.ts`, `setup.ts`, `ui/ffx2/`, `engine/` | L (M if the probe is clean) |
| 2 | Records for 254, 256 and the nine rows (Spider Attack 0x40c7, the five items, Paine's Attack) | **New data** | `data/ffx2/enemies/yunas-ballad.ts`, `...-abilities.ts`, `monster-records/` | S to M |
| 3 | Rikku's draw `% 10` (target picked first), Paine's highest-HP Attack | **New**, pattern `ai/den-of-woe.ts` | `ai/yunas-ballad.ts` | S |
| 4 | Enemy item use (five throw items, formula 8): item rows exist (`x2-item-grenade` 0x2011 for the goons); the four elemental throws are new ids | **Partly** | `items/`, enemy abilities | S |
| 5 | Confusion picks from the record list (the weak items) | **Check** whether the engine's confusion draws from the record list; if not, the weak versions are unreachable and are simply not built (disclosed in the card, pick YB9) | `adapt/` | S |
| 6 | Sleep, Slow, Confuse, Berserk landing on a boss with those bytes at 0 | **Existing** | none | none |
| 7 | HP/MP carry between the two links (no heal seam) | **Partly**: the Den's link seam; Trema's `checkpointOnEntry` | `enemies/` | S |
| 8 | Yuna's kit and dressphere for the duels (pick YB3) | data | `builds/yunas-ballad.ts` (a copy of `denOfWoePartyBuild` with one member) | S |
| 9 | Chain plumbing: ids, number 40, door `wraith`, meta, pause card, guide, story, tactic | **New** via side tables | many | M |
| 10 | **Reflect redirect** | not built (Maesters T0 1); irrelevant here (no Reflect on either side) | none | none |

**Fallback if row 1 proves expensive (pick YB4 alternative):** two ejected placeholder girls (Rikku and Paine start with an Eject-class "absent" status so the engine keeps three slots). It is cheaper to code but shows two empty slots; **not recommended** unless the probe is bad.

## 4. The party

- **Yuna alone** (wiki-level, 3 sources; RE §1 says no file shows it). **Pick YB3: Yuna from `denOfWoePartyBuild`** (the Chapter V preset with both kit options on: level 54, Hero Drinks 3, the kit the Den chapter was measured with), dressphere chosen by the build (White Mage as the Chapter V preset has her; the guides name White Mage for Protect, Warrior for Breaks, Dark Knight). **A player-facing choice of dressphere is the existing party-prep screen's job** and costs nothing if the one-girl party passes through it; **otherwise the build fixes it**. Alternative: a Level-99 Yuna (no source).
- **Gaps, none filled:** the bag for the duels (the Den's), the level (repo note G-12), the HP carry rule (wiki-level).
- **Boss numbers are never tuned.** If the measured line is unwinnable or trivial (Rikku's constant 300 against a Lv 54 Yuna's HP, Paine at one blow per 6.8 s), Bailey gets options with numbers.

## 5. The arena

- **`den-of-woe` exists** (plate `backdrops/den-of-woe.png` + `@2x`, scene `scenes/den-of-woe.ts` with the boss spot for each shade; the O-3 A plate Bailey picked). The two fights are in the same map ("natural parts b", `kino13`) as the shades, so **this is the game's own room**: 0 new plates. **Pick YB6: reuse it as is.** The scene's boss spot is built for a shade's height (2.57 to 2.79); Rikku and Paine are human size, so the spot needs a height entry (S).

## 6. New art needed

The two girls are **already painted as party members**; the work is the enemy-side facing and the "possessed" treatment (the `baralai-shade` method applied to existing paintings).

| Asset | Images | Note |
|---|---:|---|
| Possessed Rikku | 4 to 5 | tint (pyrefly glow, cold eyes) of `rikku` (attack, cast, critical, follow, hurt, idle, item, ko, ready, sleep, steal, victory): needs **idle, attack (Spider Attack), item (the throw), hurt, ko (fade-out)** mirrored to face Yuna |
| Possessed Paine | 4 | tint of `paine-warrior` (attack, cast, critical, defend, follow, hurt, idle, item, ko, ready, sleep, victory + twirls): idle, attack, hurt, ko mirrored |
| Yuna | 0 | `yuna-white-mage`/`-dark-knight`/`-warrior` full sets exist |
| Weapon props (row 255 x2, row 257) | 0 | painted into the poses (the rows are invisible actors) |
| Throw VFX, Grenade burst | 0 | in code |
| Chapter card, thumbnail, pause plate | 3 | |
| **Total** | **about 11 to 12** | all derived from existing paintings by the house recolour/derive method; no new ComfyUI composition |

- Retail references are allowed since 2026-10-18; the paintings must match the approved painted look. Bailey alone approves a painting. The possession treatment is a house choice to show Bailey (the repo note says no source describes how the illusions look).

## 7. Presentation needs

New on screen: **one girl instead of three** (a single-slot party panel, the command menu for one, the camera framing for one) and the possession tint. **Pick YB7: the one-girl framing is the Den camera rig with the party arc reduced to one position** (S); the phone tier uses the Den's phone rigs. Layouts: the existing FFX-2 HUD at 1600 x 900 and 390 x 844.

## 8. Music (flagged stand-in; rule 13)

`boss-den-of-woe` (FFX-2, "old comrades in the dark", the cue of the place) for both duels. **YB8; alternative:** `boss-shuyin` (the grief theme) for Paine only.

## 9. Winnability and how it is measured

Copy `tests/unit/chapters/den-of-woe-bench.test.ts` and `den-of-woe-options-bench.test.ts` (the human-speed harness and the `PYREFLY_MEASURE=1` sweeps), with a solo-Yuna tactic: for Rikku, a status line (Sleep, Slow, Confuse) plus Protect; for Paine, a black-magic line (DEF 70, MDEF 7). Figures to watch: Rikku's expected damage per action (~300 constant), Yuna's HP at the Den build's level, the length of 7,800 + 9,200 HP at one girl's damage. **Never tune a boss number**; options with numbers if the line is unwinnable.

## 10. Review class

New hidden chapter + **one additive change to a shared contract** (`types.ts`) → **focused review before the wave deploy, deep after on the live build**; the contract change is "both" plumbing (inert for the three-girl chapters, pinned by an absence test and a digest test of the existing FFX-2 battles). Not the save-data class. `node tools/critic-plan.mjs --paths <files>` on the lane's tree gives the exact class.

## 11. Picks (driver's call, his to overturn)

| # | Pick | Alternative |
|---|---|---|
| YB1 | two solo-Yuna duels as a hidden chapter (a precursor of the shades, separate from chapter 15) | prefix them to chapter 15 (changes a shipped, benched chapter) |
| YB2 | HP and MP carry from duel 1 to duel 2 | restore between |
| YB3 | Yuna from `denOfWoePartyBuild` | Level-99 Yuna (no source) |
| YB4 | build a real one-girl party | two ejected placeholder girls |
| YB5 | post scene from the repo's Den story draft | none |
| YB6 | reuse the `den-of-woe` scene and plate | none |
| YB7 | the Den rig with one party position | a dedicated rig |
| YB8 | `boss-den-of-woe` throughout | `boss-shuyin` for Paine |
| YB9 | confusion-weak items **not built** unless the probe shows confusion draws from the record list | build them regardless (needs a list-based confusion) |
| YB10 | number **40**, word **`wraith`** (PLAN §8, checked) | none |

## 12. Size (estimate, Sonnet agent-hours)

R 1, B 11 (one-girl party 6, data and two scripts 3, chain and plumbing 2), A 3, I 6 = **about 21**, against the plan's 14 (R3 B5 A2 I4). The extra is the party seam. **This changes PLAN.md's wave-2 total by about +7 h.** Wave 2 filler stays; ride the pilgrim lane's worktree (PLAN §6).

## 13. Top risks

1. **The one-girl party** (HUD, presenter, end-of-battle) is a shared-contract change: if the T0 probe is bad, take the YB4 fallback.
2. **Yuna's level** has no source (G-12); the build is the Den's.
3. **Party size in the real game** rests on the wiki; no file shows it (RE §10.1).
4. **The possession look** is our invention (to show Bailey).
