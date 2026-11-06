> **Status 2026-11-06: paper preflight DRAFT for plan row 38, not built.** Written by a Sonnet sub-agent of the release driver from `re-ffx2-farplane-cup.md` (same folder). Under Bailey's blanket yes ("implement all unimplemented chapters please", ~00:30 EST; "yes on all these too", ~00:55 EST; "i'll go with all of your recommendations", 2026-10-31) every pick below is the recommendation, "driver's call, his to overturn", with the alternative named. Nothing was built, run in a browser or deployed.

# Paper preflight: hidden FFX-2 chapter 38, "The Farplane Cup" (Auron, Tidus, Seymour), door word `duelist`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`: "sourced" and "our estimate" stay apart; nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.**

**Read:** `re-ffx2-farplane-cup.md` ("RE §n" below), `research/re-ffx2-fallen-maesters.md` and `docs/plans/ch-keeper-review.md` (templates), `docs/handoff/ch-maesters.md` (FFX-2 precedent and T0 findings), `src/data/ffx2/builds/via-infinito.ts` (the Level 99 line), the candidates note (kept outside the repo), `PLAN.md` sections 3, 7, 8. Engine claims read on `origin/main` `cd4aee3ce`.

**Verdict: PROCEED on data and AI (small, exactly readable); the Cup's own structure (rounds, rewards, recruiting) is not in the files, so the chapter is three fixed duels, not a tournament (pick DU1).**

## 1. Game case and sources

**Game case: FFX-2 only** (rule 14). The three duelists are FFX characters appearing as **FFX-2 enemy rows with FFX-2 ability rows** in the ATB engine; no FFX engine, FFX chapter or FFX number is involved or changed (FFX Auron/Tidus/Seymour data in `src/data/ffx` is not read). The chapter registration, the door row and the plumbing are shared, "both" for CHK-020, inert elsewhere.

| Source | What it gives | Tag |
|---|---|---|
| RE note: `monster.bin` rows 311, 317, 319 (and 308 to 327), `m311/m317/m319.src` + compiled workers, `monmagic.bin`/`command.bin`/`item.bin` rows | records, whole AI, every move row | [R] (FFX2_Data.vbf, Steam 25501027) |
| RE §2 | Tidus = row 317 (settled from the symbols and the prop row) | [R] |
| RE §5 | the cup has **no formation row**; launch unread | [R] (negative) |
| Candidates note, wiki | "Farplane Cup", recruiting afterwards | [W], not in the files |
| `via-infinito.ts` | Level 99 line, Dark Knights + Alchemist | [verified: 3 sources] build |

## 2. What the player experiences, turn by turn (plain words)

**The chain (pick DU1).** Three duels, a 15-second seam between them (HP and MP restored, a fallen girl stands; the Maesters pattern), escape off. **Order (DU2): Auron, Tidus, Seymour** (the rows' own order). Each duelist stands alone in slot 1; the weapon props are visual.

**Duel 1, Auron (Lv 74, 187,500 HP, AGI 141).** He acts every 2.5 s. Each turn: Attack half the time; **Shooting Star** (an Eject at chance 254, 2.0 s charge), **Dragon Fang** (the whole party, about 3,600 before Defense, 2.5 s) or **Full Break** (a big physical hit that drops STR, MAG, DEF and MDEF by 2 stages) a sixth each (RE §6.2). Below a quarter of his HP he adds Mega-Potion heals (a fixed 2,000 to his side) and, if no girl can take Shooting Star, **Shin Zantetsu** (Death at 80 on the whole party); once at an eighth he drinks an X-Potion (at most 9,999). **The lesson is the Eject and the stage drops.**

**Duel 2, "????" (Tidus, Lv 73, 136,200 HP, AGI 224, the fastest).** **He opens with Blitz Ace**: nine hits of power 10 on one girl (about 2,300 each before Defense, so up to 20,000 raw, 1.6 s charge), then keeps himself hasted with Hastega and chooses between Attack, Spiral Cut (power 32), **Delay Buster** (a delay) and another Blitz Ace after more than four counted actions; he heals below a third and drinks a Hero Drink below a tenth (RE §6.3). He cannot be given Reflect. **The lesson is surviving the opening and breaking his Haste (Dispel).** His name is masked in the game's table; the HUD shows what pick DU3 says.

**Duel 3, Seymour (Lv 67, 145,500 HP, AGI 159).** A mage with an eight-way draw every turn: Demi (25 percent of every girl's current HP), Critical Attack, **Black Sky** (10 hits of about 900 over the party), **Meteor** (12 hits of about 2,200 over the party), a Shell/Protect/Break ladder (**Break petrifies at chance 80**), Magic Up ×5, Strength Up ×5 then Confuse, **Slowga**, Dispel; Ultima (9,784 before MDEF) below a quarter. He **absorbs Fire, Ice, Thunder, Water and Gravity and is weak to Holy** (RE §4.1, §6.4), so the party's black magic heals him. **The lesson is non-elemental damage and Shell.**

**What ends it.** A clear goes to the experiments' own store (never the save); a defeat on duel 1 restarts, on duels 2 and 3 retries that duel (Maesters rule). `[derived]`

## 3. Engine work

Mapped to `origin/main` `cd4aee3ce`: **existing**, **partly**, **new**; sized `[estimate]` S / M / L as in `ch-keeper-review.md`. Capped host files take net-zero edits; new logic in new files.

| # | Need | State | Files | Size |
|---:|---|---|---|---|
| 1 | Records for 311, 317, 319 (stats, absorbs, the full ailment wall, Silence/Darkness 250, Reflect immune on Tidus, Spellspring status) | **New data** | `data/ffx2/enemies/farplane-cup.ts`, `...-abilities.ts`, `monster-records/` | M |
| 2 | Move rows: Shooting Star 0x4208, Full Break 0x4206, Dragon Fang 0x4207, Blitz Ace 0x4205 (9 hits), Spiral Cut 0x4203, Meteor 0x4221, Slowga 0x421e, Black Sky 0x3088 (10 hits), Critical Attack 0x4015, Drain Attack 0x4010; party rows Shin Zantetsu 0x3078, Delay Buster 0x3070, Hastega 0x3177, Demi, Curaga, Dispel, Break, Confuse, Shell, Protect, Ultima 0x41fb | **New data**; the party rows exist as player abilities (`x2-*`): **verify an enemy can queue one** | command records | M |
| 3 | Three scripts (Auron 6/8-way draws with HP bands; Tidus's count and Haste rule; Seymour's 8-way with two counters) | **New**, pattern `ai/fallen-maesters-a.ts`, `den-of-woe.ts` | `ai/farplane-cup.ts` | M |
| 4 | Enemy item use: Mega-Potion 0x2003, X-Potion 0x2002 (9,999 cap bit), Hero Drink 0x203f, Dispel Tonic 0x2038 | **Existing** pattern (goons throw items) but these ids are new for enemies; **check** | `items/` | S |
| 5 | Absorb of four elements + Gravity (Seymour) | **Existing** (`affinities`); Gravity absorb check | enemy def | S |
| 6 | Accuracy formula 3 (Shooting Star) and Eject (Blow) at chance 254 on a girl | **Check**: the status kernel has Eject (shatter); formula 3 is unmapped in RE | `kernel/` | S to M |
| 7 | Multi-hit rows spread over random girls (Black Sky, Meteor): the row's "spread" flag | **Existing** (random-target flag 0x4000, used by Meteor 0x4236) | data | none |
| 8 | A search over the enemy side for "lacks Haste" (Tidus) and for Reflect on himself | **Partly**: `lacking` works on girls; extend to monsters | `ai/script-rolls.ts` | S |
| 9 | Break Damage Limit (the girls' damage needs it to move 136,200+ HP in reasonable time) | **Existing** (The End grid; Maesters T0 3: not on at the start; the build's walk is 4 Changes) | build | none |
| 10 | Chain plumbing: ids, number 38, door `duelist`, meta, pause card, guide, story, tactic | **New** via side tables | many | M to L |
| 11 | **Reflect redirect** | **Not built** (Maesters T0 1); irrelevant to these three (no Reflect on either side by their records) | `kernel/hit.ts` | RE's job |

## 4. The party

- **The Level 99 line:** `viaInfinitoBuild` (Yuna and Paine Dark Knights, Rikku an Alchemist, Rabite's Foot, Crystal Bangle, Break Damage Limit on Paine's The End; Chapter XIII/XV's sourced Lv 99 three, `[verified: 3 sources]`). **Pick DU4: use it unchanged**; the enemies are Lv 67 to 74, so this is an endgame check as the game's Cup is; nothing is levelled up or down.
- **Gaps (none filled):** the bag and the grid for the Cup (the build's are the Via Infinito's), the Holy source (none; Seymour's weakness stays unexploited), the Cup's reward/recruit rules.
- **Boss numbers are never tuned.** If the measured line is unwinnable or trivial, Bailey gets options with numbers (the safe first candidate: add Protect/Shell items to the bag, an `[estimate]`).

## 5. The arena

- **The Cup's own arena is unknown** (the cup has no formation or map in the files, RE §5). **Pick DU5 (recommended): the `farplane` plate** (`backdrops/farplane.png`, `farplane-abyss-provisional` also exists; the repo's Chapter V/XV arenas), named in the card as a stand-in ("the Farplane Cup" is the wiki's name). 0 new plates. Alternatives: (b) one new arena plate "Fiend Arena" (+3 art hours; no source says how it looks), (c) the Den of Woe plate.
- No phone rigs are assumed for a stand-in; the scene's existing rigs carry.

## 6. New art needed

The three duelists are **already painted as party characters**; as enemies they need the enemy-side facing (mirror/flip, the Den shades' method) and poses the chain uses. Style fit is unverified (candidates note).

| Asset | Images | Note |
|---|---:|---|
| Auron | 0 new | `auron` has attack, cast, critical, follow, hurt, idle, item, ko, ready, sleep, victory; used: idle, attack (Attack, Full Break), cast (Shooting Star, Dragon Fang), hurt, ko (fade-out death) |
| Tidus | 0 new | `tidus` has attack, cast, critical, defend, follow, hurt, idle, item, ko, ready, sleep, victory + od-energy-rain, od-slice-and-dice; Blitz Ace can use the overdrive attack pose |
| Seymour | 0 to 2 | `seymour-guest` (attack, cast, hurt, idle, item, ko, victory) fits; `seymour-natus`/`-omnis` are other forms; a **Meteor cast** pose is optional |
| Haste/Reflect auras, Shooting Star, Blitz Ace VFX | 0 | in code (the engine's VFX), as for the Maesters' hits |
| Backdrop | 0 | DU5 |
| Chapter card, thumbnail, pause plate | 3 | from the chosen look |
| **Total** | **about 3 to 5** | mostly cards; ComfyUI wall time near zero |

- A **name mask** for Tidus is presentation: DU3 below.

## 7. Presentation needs

New on screen: nothing mechanical beyond Tidus's Haste (an existing status) and Seymour's absorb readout (the existing damage-number "absorb" style). **DU3 (pick): show the game's masked name "????" during the fight and the real name in the results/post scene** (the game's own table has the mask; the reveal is our story beat); alternative: show "Tidus" plainly. Layouts: the existing FFX-2 HUD at 1600 x 900 and 390 x 844.

## 8. Music (flagged stand-ins; rule 13)

`boss-trema` (FFX-2, the superboss cue) for all three duels; `victory-ffx2` for results. **DU6; alternative:** `boss-den-of-woe` for Auron, `boss-shuyin` for Seymour. All flagged; Bailey's ears decide.

## 9. Winnability and how it is measured

Copy `tests/unit/chapters/fallen-maesters-bench.test.ts` (Lv 99 line, items, Darkness line) with a tactic per duel; sweeps at 1.0 / 1.5 / 2.5 s a menu (`PYREFLY_MEASURE=1`). Figures to watch: Tidus's opening Blitz Ace (about 2,300 per hit raw x 9) against a Lv 99 girl's HP (10,710 for Yuna and Paine, 5,106 for Rikku per the Maesters T0), Auron's Shooting Star (Eject), Seymour's Meteor and Black Sky spreads, and the **length** of 136,200 to 187,500 HP at the girls' damage with Break Damage Limit off at the start (9,999 cap per hit, 6,000 to 9,700 per Darkness cast: about 20 to 30 casts per duel). Never tune a number.

## 10. Review class

New hidden chapter + shared plumbing → **focused before the wave deploy, deep after on the live build**; not the save-data class. `node tools/critic-plan.mjs --paths <files>` on the lane's tree gives the exact class.

## 11. Picks (driver's call, his to overturn)

| # | Pick | Alternative |
|---|---|---|
| DU1 | three fixed duels with 15 s full-restore seams | a full "cup" with rounds (no source) |
| DU2 | order Auron, Tidus, Seymour | HP order or the wiki's (unsourced) |
| DU3 | masked name "????" during the fight, reveal after | "Tidus" shown plainly |
| DU4 | `viaInfinitoBuild` unchanged | a lower-level build (no source) |
| DU5 | `farplane` plate as a flagged stand-in | one new Fiend Arena plate (+3 h) or the Den plate |
| DU6 | `boss-trema` throughout | per-duel cues |
| DU7 | **Baralai/Nooj/Gippal (cup rows 321 to 323) not in this chapter** (they are plan-less copies of the shades; their digests are in RE §6.5) | an optional second chapter "38b", +14 h, AI digests done, art = the three shade paintings |
| DU8 | the Cup's recruiting and rewards **not built** (not in the files) | none |
| DU9 | number **38**, word **`duelist`** (PLAN §8, checked) | none |

## 12. Size (estimate, Sonnet agent-hours)

R 1 (the cup's launch, an optional follow-up; not needed to build), B 14 (data 5, three scripts 5, chain and plumbing 4), A 3, I 7 = **about 25** (the plan's 35 less 8 h research done and 3 h of art that existing paintings cover). Rows 42, 47 and 59 each lose their R (RE §6.5 holds Yaibal, Lucil, Elma, Garik, Brother, Buddy, Kimahri, Lulu). Wave 2, a hosted tree (PLAN §6).

## 13. Top risks

1. **Tidus's opening** (nine hits on one girl) and Seymour's **Meteor/Black Sky** could be unwinnable on the build's HP; the bench decides, and the answer is options for Bailey, not a tuned number.
2. **Duel length** with the damage cap on (136,200 to 187,500 HP).
3. **Formula 3 and Eject** (RE §9.3) may need a small status-kernel check.
4. **The Cup's real structure is unknown**: the chapter is a faithful trio of duels, not a tournament, and says so in its card.
5. **Style fit** of the party paintings used as enemies (unverified).
