# FINAL FANTASY X — Biran Ronso and Yenke Ronso (Kimahri's solo trial, the Mountain Gate): the written sources, and where the game's own file overrules them

**Target project:** Pyrefly Reprise / Echoes of Spira (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-10-07 (D-536, his blanket yes to the driver's recommendation): "Biran and Yenke Ronso (FFX, Kimahri's solo trial)"; 2026-10-14, relayed by the driver: "Please work on finishing the unimplemented chapters STAT".
**Research date:** 2026-10-14
**Encounter:** **Biran Ronso** and **Yenke Ronso** at the Mountain Gate of Mt. Gagazet, between Kelk Ronso's leave to pass and the mountain trail. Kimahri fights both **alone**. FFX only.
**What this file is:** the digest of the *written* sources and the chapter's reading of them. **Every number of the fight and every rule of the two scripts is the game's own and lives in [re-ffx-biran-yenke.md](re-ffx-biran-yenke.md)** (cited below as "RE section n"); nothing here repeats them, and where the walkthrough and the game's file differ the file decides (AGENTS.md rule 6). The guide cites this file for what the written sources say and the RE note for what the game does.

---

## 0. Provenance, method, and how to read this document

| Tag | Meaning |
|---|---|
| `[game file]` | Read from the game's own files by the reverse-engineering session and set down in `re-ffx-biran-yenke.md`. It is the game itself, so it decides. |
| `[verified: N sources]` | N independent written sources agree. |
| `[single source: X]` | Only one written source says it. |
| `[conflict]` | The written source and the game's file differ; listed again in §8. |
| `[estimate]` | Our own design judgement, not a measured fact. |

**Game case (AGENTS.md rule 14): FFX only.** The brothers, Kimahri's Lancet learning and the Ronso Rages are FFX's. FFX-2's Gagazet mission (Garik and the Youths) is a different fight and shares nothing with this one.

**Method.** (1) The Mt. Gagazet page of Jegged's FFX walkthrough, the "Biran and Yenke" boss battle at the Mountain Gate, fetched twice on 2026-10-14; the two reads agreed. It is summarised here in our words and not copied. (2) This repository's Kimahri notes: `ffx-seymour-flux.md` §6.1, §7.1 and §7.9.2, `ffx-combat-core.md` §2.7 and §5.8, and `visual-bible.md` §1.22.4. (3) The RE note, merged into this branch, read in full. No retail image was looked at or saved.

---

## 1. The fight at a glance

| # | Beat | Source | Tag |
|---|---|---|---|
| 1 | **Where and when.** The party has Kelk Ronso's leave to pass; Kimahri then faces Biran and Yenke at the Mountain Gate; the mountain trail, the monuments of the fallen summoners and Wantz's shop come after. | `ffx-seymour-flux.md` §7.1; Jegged | `[verified: 2 sources]` |
| 2 | **Kimahri alone.** The two brothers fight Kimahri by himself; the battle is won when both have fallen and lost when Kimahri falls. | Jegged; the party rules are RE section 4 | `[single source: Jegged]` for the walkthrough, `[game file]` for the rules |
| 3 | **The point of the fight is what Kimahri learns.** The brothers are the teachers of the Ronso Rages that the Flux fight afterwards leans on (Mighty Guard above all). The walkthrough's advice is to learn every ability Kimahri lacks with Lancet, then wear the pair down with Lancet and the Rages; the order they fall in matters. | `ffx-seymour-flux.md` §6.1; `ffx-combat-core.md` §5.8; Jegged | `[verified: 2 sources]` |

---

## 2. What Kimahri learns

- **Lancet learns a Ronso Rage from a target that carries one that Kimahri does not know**, and **a newly learned Rage fills his Overdrive gauge at once** (`ffx-combat-core.md` §2.7 and §5.8; `ffx-seymour-flux.md` §7.9.2). `[verified: 2 sources]`
- **Biran carries** Thrust Kick, Self-Destruct and Doom, and Mighty Guard once he has used it himself. **Yenke carries** Fire Breath, Aqua Breath and Stone Breath, and White Wind once he has used it himself. `[verified: 2 sources]` (`ffx-seymour-flux.md` §6.1 and Jegged); the order the game offers them in, and the gate on the two "after use" Rages, are RE section 7. `[game file]`
- **How many a cast teaches.** The walkthrough says to learn "every ability" with Lancet and does not say whether one cast teaches all of them. The game's file offers **one Rage a cast**, the first on the brother's list that Kimahri lacks (RE section 7). `[game file]`
- **The "after use" gate is narrow.** The brother's Rage becomes teachable from the moment he queues it at half strength, and only if the other brother is still alive then (RE sections 5.2 and 7). `[game file]` This is why the guide tells the player to bring a brother under half, give him a turn, and Lancet him again.
- **The repository's older teacher list was incomplete.** `ffx-combat-core.md` §5.8 listed White Wind's teachers without Yenke; `ffx-seymour-flux.md` §6.1 already had him. The combat-core row now lists him with the gate (RE section 8). `[game file]`

## 3. The guard between the brothers

- **The walkthrough:** each brother uses Guard on the other, so ordinary attacks do about a quarter of their usual damage; a Bulldoze that leaves the brothers on opposite sides of Kimahri ends the effect. `[single source: Jegged]`
- **The game's file:** a **defence swap**. When Kimahri's plain Attack is aimed at one brother while both stand on the same side, the other brother's defence is raised and a Sentinel status is set on him; the blow is taken in his place, and the effect is released the next time that brother is hit. Rages, Jump, Lancet and items are **not** turned aside (the gate is a command-id property read that only the plain Attack passes: RE section 5.6, including the quirk). Every Bulldoze moves its user to the other side, so the brothers are "apart" whenever their sides differ, which one Bulldoze can start and another can end (RE section 5.3). `[game file]`
- **What the chapter does:** it builds the file's rule, in the engine's own Sentinel cover, and the guide says only what the file says (a plain Attack is wasted while they stand together; Rages are not turned aside; apart, the blow lands in full). It says nothing about "a quarter". **Measured on the real engine with the shipped preset** (five seeds, `tests/unit/chapters/biran-yenke-hit.test.ts`): a guarded plain Attack does 8 damage, the same blow with the brothers apart 440 to 480 depending on the damage roll (the RE review measured 436 at one roll), which is under two percent and not a quarter; the numbers come from DEF 254 plus Sentinel against the game's defence term. `[conflict]`, closed in §8 (row 2).

## 4. When one brother falls

- **The walkthrough:** if Biran falls first, Yenke is Hasted for the rest of the fight; if Yenke falls first, Biran goes Berserk, and **a Berserk Biran cannot teach**, so learn Biran's Rages before Yenke falls. `[single source: Jegged]`
- **The game's file:** Biran dead: Yenke's magic rises by a quarter, he Hastes himself on his next turn and his speed is retuned against Kimahri's. Yenke dead: Biran's strength rises by a quarter, he goes Berserk (a Bulldoze every turn, the side swapping each time) and casts no more Thunder or Blizzard. The surviving brother's pending half-HP action is cancelled (RE sections 5.4 and 5.5). `[game file]`
- **Whether a Berserk Biran teaches** is the one place the two disagree outright: the file's Biran still teaches Thrust Kick, Self-Destruct and Doom, and only Mighty Guard (his half-HP Rage) is lost with the cancelled action. `[conflict]`, §8 row 1.
- **The advice true under both readings:** learn Biran's Rages, Mighty Guard first of all, before Yenke falls. That is what the guide says; it does not say what a Berserk Biran will or will not teach.

## 5. Each brother's own Rage at half strength

- **The walkthrough:** each brother casts his Rage once, after he has lost HP: Biran Mighty Guard, Yenke White Wind. `[single source: Jegged]`
- **The game's file:** on the first turn after a brother drops below half of his maximum HP, and only while the other brother is alive, he queues his own Rage instead of his cycle; **if the two stand on the same side it covers both of them**, otherwise only himself (RE sections 5.2, 5.3 and 6). The two Rages are Kimahri's own Rage rows, with the brother's gauge forced to full to pay for them (RE section 6). `[game file]`

## 6. Strength and loot

- **HP.** The walkthrough gives no number and says their HP varies with the party's level. `[single source: Jegged]` The game's file agrees in kind and is exact: the brothers' HP, Strength, Magic and Speed are set at the start of the battle from **Kimahri's own** (RE section 3), so no printed number could be true of every Kimahri. **The guide prints none.** `[game file]`
- **Rewards.** Steal: Lv. 3 Key Sphere. Drops: Return Sphere (common), Friend Sphere (rare). The walkthrough and the file agree; the quantities, odds and AP are RE section 2. `[verified: 2 sources]`
- **Not modelled, so not promised:** the gear the brothers drop (the game gives each a gear drop; the engine has no gear record for it), and the Steal in this build (Kimahri's preset here has no Steal command).

## 7. Look and size

- Biran: tall and muscular, grey-blue fur, a blond mane, an intact horn (the largest of the Ronso), leather on torso, arms and legs and a loincloth. Yenke: tall and muscular, lighter fur, brown hair, a **dark** horn, leather on the forearms and chest only (bare upper arms). `visual-bible.md` §1.22.4. `[single source: FF Wiki]`
- **Height.** A standard adult Ronso, Kimahri's own (the base sheet in `visual-bible.md` §1.22.4 is Kimahri's); the datamined top of a Ronso is 1.211 of Tidus's with the horn (`data/ffx/party-stature.ts`). `[estimate]` for the brothers, `[game file]` for Kimahri's.
- The paintings of the two brothers in this build are **provisional candidates**; Bailey alone approves a painting.

---

## 8. Where the written sources and the game's file differ

| # | Question | The written source | The game's file | The chapter follows |
|---|---|---|---|---|
| 1 | Can a Berserk Biran teach? | Jegged: no, so learn his Rages before Yenke falls | He still teaches the three Rages he offers from the start; his Mighty Guard is lost because the half-HP action is cancelled when Yenke falls (RE sections 5.4, 5.5, 7) | **The file.** The guide's advice (learn Biran's Rages before Yenke falls, Mighty Guard first) is true under both; the disagreement is in the handoff, not on the player's page. |
| 2 | How much does a guarded blow do? | Jegged: about a quarter of the usual damage | The partner's defence is raised and Sentinel set, the blow lands on the partner and the effect is released on the next hit on him (RE section 5.6); only the plain Attack, only when the brothers share a side | **The file.** The engine's Sentinel cover; no "quarter" anywhere (measured: 8 guarded against 440 to 480 unguarded, under two percent). |
| 3 | Does one Lancet teach every Rage a brother has? | Silent ("learn every ability") | One a cast, the first on the list that Kimahri lacks (RE section 7) | **The file.** |
| 4 | What is their HP? | Varies with the party's level, no number | Set from Kimahri's own numbers at the start (RE section 3), with a worked example | **The file.** The guide prints no HP. |
| 5 | Who teaches White Wind? | (`ffx-combat-core.md` §5.8 omitted Yenke; `ffx-seymour-flux.md` §6.1 and Jegged have him) | Yenke, first on his list, gated on his own half-HP White Wind (RE sections 7 and 8) | **The file.** The combat-core row now lists him. |
| 6 | Does Biran's half-HP Rage need Yenke alive? | Silent | Yes: if either brother dies with the half-HP action pending, it is cancelled and the Rage is never offered (RE sections 5.4 and 7) | **The file.** |

## 9. What the chapter takes from this

1. **The fight is the game's own** (RE note): the stats derived from Kimahri's, the two scripts, the move rows, the rewards, Kimahri alone. This file adds nothing to the numbers.
2. **The written sources shape the words only:** the guide card and page follow Jegged's page in our own words and order (learn with Lancet, then wear the pair down with Lancet and the Rages), correct wherever the file speaks, and cite this file for the walkthrough's claims and the RE note for the game's.
3. **Kimahri's party** is the Seymour Flux chapter's preset, as the driver decided, with Mighty Guard, White Wind and Self-Destruct taken off (they are what this fight teaches) and the gauge at about 45 percent (`ffx-seymour-flux.md` C-16, the figure the Cavern chapter already uses): `data/ffx/builds/kimahri-trial.ts`, said so in the chapter's notes and the handoff.
4. **Open after this file** (carried by the handoff): the Mountain Gate painting (the stage reuses Chapter I's valley), the two brothers' paintings (provisional), the fight's music cue (no source names it; the generic boss cue is borrowed), the listing on the board, and the gear drop and Steal that this build does not model.
