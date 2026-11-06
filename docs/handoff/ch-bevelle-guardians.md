# The Guardians of the Bevelle Underground: Georapella, the Precepts Guard and Baralai (a hidden FFX-2 chapter, number 37)

**Branch `ch-bevelle-guardians`** (from `origin/r75-boss-art` 2aa42f7a7), pushed; **not deployed, not merged into any release candidate.** **Game case: FFX-2 only** (AGENTS.md rule 14): ATB, dresspheres, the FFX-2 monster rows 262, 263 and 175 and their three AI scripts; no FFX or FF7 file changes behaviour. The registry rows, the door row and three kill-reward item names are shared plumbing, "both" (CHK-020), inert for every other chapter.
**Status: built, hidden, two of three guardians unpainted (placeholders), the story a draft, the music a stand-in.** The chapter opens only by a typed word (`drillshot`). Listing it waits for Bailey's word.
Written 2026-11-06 by a Sonnet sub-agent of the release driver (plan row 37, wave 2, tree `D:/pyrefly-continuity`; the research note `research/re-ffx2-bevelle-underground.md` and the paper preflight `docs/plans/ch-drillshot-review.md` are committed with it).

Authority: Bailey, relayed by the driver, 2026-11-06 ~00:30 EST "implement all unimplemented chapters please", ~00:55 EST "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations". **Every pick in section 5 is a driver's call, "his to overturn", with its alternative.**

## 1. Play it

1. From the title, reach the chapter-select board. Type **`drillshot`** (any case, letters at most 2 s apart; the board shows no hint). It opens the chapter's party prep itself, with no card and no sound before it. The first letter D is the board's `right` key, so the cursor takes ONE step for it; the R is `r1` (ignored), the S is claimed by the word, the last letter T is bound to nothing. On a phone the long-press field on the "Chapter select" label takes the same word.
2. Enter starts the chapter: a pre scene (our draft, section 8), then **act 1, Georapella** (floor 3, Lv 17). After her fall a seam (the pyreflies in the corridor mend the girls), then **act 2, the Precepts Guard** (floor 3, Lv 21), another seam (the stair down, floor 7, and a man who counts every blow), then **act 3, Baralai** (floor 7, Lv 24), then the post scene. Each link opens at full HP and MP with a fallen girl standing and **no Save Sphere card**; items spent stay spent; statuses and the worn dressphere do not carry. A defeat on act 2 or 3 retries **that act**; a defeat on act 1 starts the chapter over. Escape is off.
3. A clear goes to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save: no save change, no migration. The party is the Bahamut chapter's Chapter 2 three (Yuna 23 White Mage, Rikku 24 Dark Knight, Paine 25 Warrior).

## 2. What it is

| Act | Guardian (game row) | Lv | HP | What it does (the game's own script, poll by poll) |
|---|---|---:|---:|---|
| 1 | **Georapella** (262) | 17 | 4,420 | MP 9,999, MAG 1. Only casts: one Ga spell on the whole party a turn, in a ring Thundaga, Waterga, Firaga, Blizzaga from a seeded start point (a 3.3 s charge); about 90 to 100 on Yuna, 130 to 145 on Rikku, 195 to 215 on Paine unshelled, exactly half under Shell. Weak to Holy, null Gravity; **Slow lands on it** |
| 2 | **Precepts Guard** (263) | 21 | 3,680 | MP 9,999. Each poll: Demi on the party a third of the time (a quarter of every girl's CURRENT HP); else Slow on the party (2/15), **Death on one girl (2/15, lands and kills)**, Osmose (2/15) or Drain (4/15, half of them preceded by a Bio on a girl). Weak to Holy; **immune to Slow**; can be delayed and interrupted |
| 3 | **Baralai** (175) | 24 | 3,380 | AGI 135 (a move every 2.6 s), EVA 33. A seven-poll cycle: Attack, Attack, Glint (the party), a three-strike Chain Attack at Yuna, Rikku, Paine, Attack, **Looming Glacier** (takes all the MP of the not-yet-stopped girl who has the most, and Stops her), Demi (or an Attack below 40 MP). **Every tenth result landed on him calls Drill Shot on the girl who landed the latest one: exactly three quarters of her MAXIMUM HP** (Protect halves it, Shell does not). Below a quarter of his HP, one poll in four adds an Absorb. **Can be blinded and poisoned** (unlike the Den of Woe shade), immune to Slow and Stop |

Rewards: the rows' EXP, Gil, AP (1, 1 and 10) and Pilfer Gil; the drops NulTide Ring, Regen Bangle and Pearl Necklace (always); the steals Water Gem, Mana Tablet and Charm Bangle.

## 3. The data and its sources (rule 6: nothing invented)

Every number is `research/re-ffx2-bevelle-underground.md` (the RE lane, 2026-11-06, `monster.bin` rows 262, 263 and 175 and the move rows of the normal scripts), tagged `[RE §n]` in the files. **`tests/fixtures/parity/ffx2/bevelle_guardians_rows.json`** holds the three monsters and the 18 distinct move rows as decoded fields with their file offsets; the chapter lane **read them again from the kernel tables** (not from the note's prose) and `tests/unit/chapters/bevelle-guardians-data.test.ts` (58 tests) compares the enemy data, the monster records, the command records and the kill-reward rows to it field by field.

**Where the note's prose and the rows or sources differ, the row or source wins** (listed so nobody trusts the prose):
- **Baralai can be POISONED as well as blinded**: the note's §4.2 says only Darkness reads 0 on row 175; the row's group-1 byte for Poison (5) reads 0 too. Pinned.
- **The Precepts Guard's Bio goes to ANY living girl without Reflect**, not only one who also lacks Poison: the shipped source tests "does some girl lack Poison" with a search whose pick it throws away, then searches the living for a girl lacking Reflect. Pinned (`bevelle-guardians-ai.test.ts`).
- **Every discarded search still draws** from the search stream when it had two or more candidates (the Precepts Guard's three per poll that ends in Death, Osmose or Drain). The draw counts are pinned; they change which numbers come next, never what a move does.
- **The Death tax cannot be guarded against here**: Death (chance 254, accuracy formula 4) landed on 30 of 30 seeds on a girl with no protection, and the party has no Death-proofing and the engine no Reflect redirect. The words say "raise her" (a Phoenix Down), not "guard".

**Gaps, named (not invented):**
- **Item ids** are the rows' own and are named from the engine's item tables (`battle/ffx2/adapt/mix.ts` MIX_ITEM_IDS for Water Gem 0x2024 and Mana Tablet 0x203a; the accessory ids NulTide Ring 0x902e, Pearl Necklace 0x904e, Regen Bangle 0x905a join `KILL_ITEM_ID`, Charm Bangle 0x9072 was there). **Water Gem, Mana Tablet and Charm Bangle had no `ItemDef` row**, and the full run's `ffx2-steal-item-names` test wants one for every steal id: `data/ffx2/items/held.ts` now has three held-only rows (names from the game's tables, price 0 and listed in `UNSOURCED_PRICE_IDS`, no effect read), so a stolen one prints its name and sits in the bag but cannot be used. Giving the two consumables their effects is the item lane's job.
- **Positions.** Georapella's scene ships start positions (the girls at (-43, 29), (-50, 10), (-27, 43), Georapella at (4.4, -3.2); `GEORAPELLA_SCENE`, the game's own). The Precepts Guard's and Baralai's scenes ship EMPTY position files: the Precepts Guard uses Georapella's (`PRECEPTS_GUARD_SCENE`), Baralai the Bahamut scene's (`BARALAI_SCENE`, `SCENES.bahamut`), both `[inferred]`. Alternative: a uniform search (`searchUniform`, a one-line change each).
- **Action time** (animation length) and **stature** of the three are unread: the per-command span with its fallback stands; every guardian stands at the stage's default boss height.
- **The Oversoul versions** (`o262`, `o263`) are not built (BG7: their families have one member each and kill counts of 4 and 6, so they cannot be reached).

## 4. Engine work and what the checks found

No engine file changed. The guardians' moves are rows the repo already runs: Demi 0x3082, Bio 0x3085, Death 0x3087 and Drain 0x3081 (the Dark Knight's), Slow 0x406c (the Left Redoubt's), Osmose 0x406d (the Leblanc Syndicate's), and Baralai's Attack, Chain Attack, Glint, Looming Glacier, Drill Shot and Absorb (the Den of Woe shade's rows: `command-records/bevelle-guardians.ts` borrows them by name, and the data test pins each to the freshly read fixture). Only the four Ga rows 0x41f1 to 0x41f4 are written new (the Angra Mainyu chapter's Zarich holds the same rows aimed at one girl). The three scripts (`battle/ffx2/ai/bevelle-guardians.ts`) are new; Baralai's is the shade's shape with a simpler cycle, a threshold of 10 and a different low-HP line.

Findings, each pinned by a test:
1. **Yuna, a White Mage, has no Attack row** (`attackOf` answers a defend for her): in the Bahamut preset she can heal and buff and cannot make a result on a guardian. This shapes the bench (section 6).
2. **A Gunner Yuna wins Baralai 98 times in 100**; her first menu offers the Change (one link away on her grid, across the green gate: a menu row, nothing written to her). The kit as given has the answer; the bots that keep her a White Mage win 62.
3. **The count is not the problem**: the Drill Shot is survivable at full health (1,379 on Rikku, 1,279 on Paine, 517 on Yuna / 969 HP as a Gunner), Protect halves it, and holding the blows back to spare it costs more than it saves (section 6).
4. **Two-command polls run on consecutive turns** (the Precepts Guard's Bio then Drain; Baralai's low-HP Absorb then the cycle's move): the engine runs one command a turn on this base, so the second waits for the guardian's next turn (the Den of Woe shade's way); the game runs the batch back to back and takes the recovery from the last record. A fight can end between the two. A timing row for the RE session, not tuned.
5. **Reflect is data only** (the engine has no `pp_reflect_redirect`; `docs/handoff/ch-maesters.md` T0 finding 1): the Ga spells, Death, Bio, Slow and Drain are reflectable in the game and would bounce off a girl with Reflect; here they land. Disclosed, not tuned.

## 5. The picks (the driver's, under Bailey's blanket yes; each with its alternative, his to overturn)

| # | Question | Pick | Alternative |
|---|---|---|---|
| BG1 | order and shape | **Georapella, Precepts Guard, Baralai (ascending level); three fresh links, 15 s-class seams that mend the party** (`nextGroupId`, `restoresPartyOnEntry`, `noSaveSphereCard` on links 2 and 3) | the game's own order (unread, RE §10.1); HP carried across acts |
| BG2 | party | **`bevelleBuild` unchanged** (a deep copy), measured | a lower-level variant (no source); the Château or Djose build (section 6 gives the numbers, not built) |
| BG3 | arena | **the `bevelle-underground` plate for all three acts** (0 new plates) | two derived floor variants (+2 h), three new plates (+6 h) |
| BG4 | the count | **no counter HUD**; the entrance line is in the second seam ("He counts every blow"), plus ONE AI-emitted callout when the count reaches nine ("Nine. The next blow calls the drill.") | a visible counter (invented UI) |
| BG5 | music | **`boss-bahamut` acts 1 and 2, `boss-den-of-woe` act 3** (flagged stand-ins, Bailey's ears) | one cue throughout |
| BG6 | row 176 | **not rebuilt** (chapter 15 keeps the shade) | none |
| BG7 | Oversoul | **`o262`, `o263` not built** | none |
| BG8 | number and word | **37, `drillshot`** (plan §8, checked; `chapter-doors.test.ts` is the authority) | any |
| BG9 | Bio's target | **the source's reading** (any living girl without Reflect) | the note's prose (also lacks Poison) |
| BG10 | two-command polls | **the second command at the next poll** (the shade's way) | a true batch (needs an engine seam) |
| BG11 | positions | **Georapella's own; the others' `[inferred]` stand-ins** | uniform searches |
| BG12 | art | **Georapella and the Precepts Guard: their own sprite keys, the presenter's placeholder; Baralai: the Den of Woe shade's painting (`baralai-shade`); the card thumbnail and the pause plate: Chapter IV's** (section 7) | a rig from stills; waiting for paintings |
| BG13 | Death | **words say raise her** (a Phoenix Down) | port the Reflect redirect (RE) |
| BG14 | the words | **a draft in our words**: all three girls fight Baralai (the game has Paine fight him alone, `research/ffx2-bahamut.md` §5), Baralai says `Lady Yuna` and withdraws, the guardians have no story of their own | Paine alone against Baralai (one fight, a different party) |
| BG15 | the prep tip | **one 148-character form that fits the card's band** ("Shell against Georapella. Phoenix Downs for Death. Baralai's tenth blow calls Drill Shot on whoever lands it: Protect her. Change Yuna to a Gunner.") | a longer tip with a short form in `chapter-prep-tips.ts` |
| BG16 | what the tip advises | **Protect and the Change, not "stop at nine"**: the bench says holding back costs more than the shot (section 6) | the preflight's "count and stop" lesson |

## 6. Difficulty: measured, not tuned

`tests/unit/chapters/bevelle-guardians-bench.test.ts` (11 tests; 100 seeds a cell in the suite, `PYREFLY_BENCH_SEEDS=<n>` for more) and `node --experimental-transform-types tools/bevelle-guardians-bench.mjs --seeds 200` print the table. A *line* is a test input standing in for a player (`tests/unit/helpers/bevelleGuardiansDrive.ts`): **defend** (nobody does anything), **attack** (everyone strikes, nobody heals), **careful** (Rikku opens with a Lunar Curtain and a Light Curtain, Phoenix Downs raise the fallen, Cura or a Hi-Potion below 45 percent, Rikku's Darkness while she has the HP, otherwise Attack), **counter** (careful plus: from eight blows on him only Paine strikes), **change** (careful, but Yuna Changes to a Gunner on her first turn and then strikes, healing with Hi-Potions), **changeCount** (change plus the counting). Wait ATB, bench speed. 200 seeds (seeds 1 to 200):

| Act | Line | Wins | Girl KOs a fight | Minutes a fight | Drill Shots a fight | on Yuna / Rikku / Paine |
|---|---|---:|---:|---:|---:|---|
| 1 Georapella | defend | 0 | 3.00 | 1.70 | | |
| | attack | **200** | 0.58 | 0.96 | | |
| | careful | **200** | 0.00 | 1.05 | | |
| 2 Precepts Guard | defend | 0 | 3.00 | 2.69 | | |
| | attack | 158 | 1.16 | 1.41 | | |
| | careful | **197** | 1.06 | 1.32 | | |
| | change | 198 | 0.76 | 1.00 | | |
| 3 Baralai | defend | 0 | 3.00 | 1.82 | 0 | |
| | attack | 53 | 2.65 | 1.81 | 0.95 | 0 / 0 / 190 |
| | careful | **123** | 3.71 | 2.80 | 0.98 | 0 / 56 / 141 |
| | counter | 113 | 4.37 | 3.00 | 0.81 | 0 / 0 / 161 |
| | **change** | **196** | 0.30 | 1.30 | 1.04 | 130 / 8 / 70 |
| | changeCount | 182 | 0.89 | 1.84 | 1.09 | 0 / 3 / 215 |

**What that says, plainly.** Act 1 is a race the party wins without drama (as the preflight predicted: Georapella only casts, about 100 a girl a spell, and 4,420 HP at a 3.3 s cycle). Act 2 is the Death tax: a girl falls in about one fight in one (Death lands and kills, nothing guards against it), a Phoenix Down raises her, and the careful line wins 197 of 200. **Act 3 is the real fight and its lever is not the count but the healer**: with Yuna a White Mage (690 HP, no Attack row, never a result on him) the simple lines win 27 to 62 percent; the cycle (Chain Attack, Glint, Demi, an Attack at the soft girl) is the threat, 3.7 KOs a fight. **One menu row changes it: Yuna's Change to a Gunner wins 196 of 200** (and her shots can fall on her now, 130 of 208, 969 HP as a Gunner, 75 percent of that is survivable at full health). **Holding the blows back to count costs more than it saves** (changeCount 182 against 196, the fight runs longer), so the tip says Protect the girl who lands the tenth and Change Yuna, not "stop at nine".

**Options with numbers for Bailey** (none built; the party is the only lever and the boss is never touched): other SOURCED party builds on the same fights, the careful line, 100 seeds, never tuned:

| Build | Act 2 careful | Act 3 careful | Act 3 attack |
|---|---:|---:|---:|
| Château (Lv 20 / 21 / 22; Yuna Gunner, Rikku Thief, Paine Warrior; earlier in Chapter 2) | 100 | **99** | 52 |
| **Bevelle (Lv 23 / 24 / 25; the shipped one)** | 99 | 62 | 29 |
| Djose (Lv 32 / 33 / 34; Chapter 3's end, too late for these floors) | 100 | 100 | 98 |

The lower-level Château party beats Baralai better than the shipped one because its Yuna is a Gunner with an Attack row and more HP; the shipped build's White Mage is the weak seat. Option A (the pick): keep the Bahamut preset and let the Change be the answer (the tip says so). Option B: seat Yuna as a Gunner at the start (about 98 of 100; one line in `builds/bevelle-guardians.ts`). Option C: the Château party (no source says which the floors expect, RE §10.2). The hidden chapter is nobody's trap either way.

## 7. ART NEEDS (nothing below was painted here; nobody queued ComfyUI: rule 12, Bailey alone approves a painting)

Style reference: the approved painted set (the Bahamut chapter's plate `backdrops/bevelle-underground.png`, the Den of Woe shade's `characters/baralai-shade/`, the FFX-2 boss sets), the painted 2.5D look, facing left toward the party, a sidecar JSON each (`width`, `height`, `baselineY`, `pose`, `facing`, `nonBiped`). Sprite keys: `x2-georapella`, `x2-precepts-guard`, and (when the living Baralai is painted) `x2-baralai`.

| Subject (key) | Poses (masters) | Notes |
|---|---|---|
| **Georapella** `x2-georapella` | idle, cast (the Ga), hurt, ko; idle @2x (5 images; no attack pose, it never attacks) | a tall guardian that only casts; the FFX-2 look is unread (RE risk 2): a one-frame look check from the archive's model data first |
| **Precepts Guard** `x2-precepts-guard` | idle, cast (Demi, Death, Slow, Bio, Drain, Osmose all read as casts), hurt, ko; idle @2x (5) | "Guardian Beast 3" by the developers' label |
| **Baralai, the living Praetor** `x2-baralai` | idle, attack, cast, glint/chain, hurt, ko; idle @2x (2 new poses: attack, glint/chain; 4 recoloured from `baralai-shade`, dropping the pyrefly treatment; the staff is painted in) | today `baralai-shade` stands in (`ids.BARALAI_SPRITE`; change one constant and the registration) |
| the card, the pause plate | `chapter-ffx2-bevelle-guardians` (thumbnail), `pause/ffx2-bevelle-guardians` (hero plate) | today Chapter IV's (`chapter-ffx2-bahamut`, `pause/ch4-ffx2-bahamut`) stand in |
| the arena | none (BG3) | alternatives in section 5 |

About 14 to 16 images in all. On install (the art lane's step, not this one's): the sidecars, a row for each subject in `tools/posescale/subjects.json`, the mirror's `manifest.json` rebuilt (`node tools/gen/manifest.mjs --root=<mirror>`), `src/data/art/poseRegistrationFoes.ts` regenerated by `tools/posescale/measure.py table` (generated, never edited by hand), `ids.GEORAPELLA_SPRITE` / `PRECEPTS_GUARD_SPRITE` / `BARALAI_SPRITE` and the meta's `heroArt` and the record's `thumbnailKey` pointed at the new keys. **Music:** none new; Bailey's ears decide the two stand-in cues (rule 13).

## 8. The story draft

`src/story/scripts/ffx2-bevelle-guardians.ts`: **a DRAFT for Bailey to read before it ships** (BG14). A pre scene on floor 3 (eight lines); two seams (the corridor's pyreflies mend the girls; the second ends with Baralai, who says `Lady Yuna`, and Paine's "He counts every blow. Mind how many you land."), about 13 and 14 seconds with the player's hands off; three callouts (Georapella's first Ga, the Precepts Guard's first Death, and the AI's own "Nine. The next blow calls the drill."); a post scene (Baralai apologises once and steps back into the dark; one sincere exchange; the joke restored; something large turns over far below). Our words over the sourced beats; no line of the game's dialogue. `tests/unit/chapters/bevelle-guardians-story.test.ts` (17) holds the lint, the cast, the rations, the triggers and the budgets.

## 9. Browser job specs

**J0, run (headless Chromium, `PYREFLY_BROWSER=gpu`, a dev server on its own port, the review-browser lock; `tools/bevelle-guardians-smoke.mjs`):** the real-key smoke of act 1 to its result, section 10.

All at 1600x900 and 390x844, headless Chromium from node (the lock applies), a production build when the integrator cuts one; the debug API (`window.__pyrefly`) may set the guardian's HP low to reach the later links. Every prediction is from the engine tests, not from a browser, unless J0 says so.

| Job | Steps | Prediction |
|---|---|---|
| **J1 board** | type `drillshot` on the board; also on a phone through the long-press field | party prep opens for "The Bevelle Guardians", numeral EXP; the board still draws nineteen cards; the cursor takes one step for the D and no more; nothing is written under any key |
| **J2 prep and pre scene** | read the prep card, Enter, play the pre scene | the hero art is Chapter IV's pause plate; the tip box fits (about five lines); the pre scene is eight lines over the plate with the bed `scene-bevelle-underground`; the last line starts the battle |
| **J3 act 1** | first menu; Shell; win | the boss strip names Georapella; the sprite is the procedural placeholder (seen in J0: a dark hooded cone with one glowing eye, no console warning and no pose-file request); a Ga spell hits all three (about 100 / 140 / 205 unshelled) |
| **J4 act 2** | Demi; Death; a Phoenix Down | Demi takes a quarter of each girl's current HP; Death kills the girl it names; the Phoenix Down raises her |
| **J5 act 3** | the first Glint; Looming Glacier; the tenth blow | Glint hits all three; Yuna's MP goes to 0 and she is Stopped; the callout "Nine. The next blow calls the drill." plays once at the ninth result; Drill Shot takes 1,279 off Paine (639 under Protect) |
| **J6 seams and retry** | win act 1, win act 2; lose act 3 | each seam plays about 13 or 14 s with the hands off, then the next act opens with the girls whole and no Save Sphere card; a defeat on act 3 retries act 3, on act 1 starts over |
| **J7 pause and phone** | pause on each act; 390x844 | the chapter tab with three objectives ("Get past Georapella", "Get past the Precepts Guard", "Defeat Baralai"); the snapshots resolve (the plate, the shade's idle, Paine's portrait); on the phone the placeholder stands on the boss spot clear of the command list |
| **J8 console** | the whole run | no error and no 404 (J0: none in act 1) |

## 10. The smoke run (J0)

`tools/bevelle-guardians-smoke.mjs`, headless Chromium with `PYREFLY_BROWSER=gpu` against a Vite dev server on its own port (5237, stopped by its PID afterwards; no production build, the art is the r64 mirror through `public/art`), under the machine-wide browser lock (it waited its turn behind two art lanes' GPU renders), seed 7, 1600 x 900, **real keys only, no state edit**. Run twice: the first run passed every gameplay check and failed two log-reading checks of the SMOKE script itself (it read the next link's fresh log after the chain had moved on; fixed in the script, nothing in the game); the second is clean:

- **OK, exit 0, 14 checks.** The board holds nineteen cards, none for the chapter and no EXP numeral; the typed word `drillshot` opens party prep and it holds (the T cannot start the fight); the prep card names "The Bevelle Guardians" with its subtitle and tip; the pre scene plays by Enter; the battle opens with Georapella alone at 4,420 HP and Yuna, Rikku and Paine; **22 party commands by real keys (Yuna 8, Rikku 7, Paine 7)** take Georapella to her fall; she cast eight Ga spells, **Waterga, Firaga, Blizzaga, Thundaga, Waterga, Firaga, Blizzaga, Thundaga: the ring from a seeded start, in order**; the seam fired once (`georapella-fallen`, after `first-ga`) and **act 2 opened with the Precepts Guard on the field and all three girls at full HP and MP** (the corridor mended them); **no console error, no 4xx or 5xx, no console warning, and no request for a missing art file** (the presenter draws a procedural silhouette for the two unpainted keys without asking for pose files).
- Screenshots (committed): `docs/screenshots/ch-bevelle-guardians/desk-0-board.jpg`, `desk-1-party-prep.jpg`, `desk-2-pre-scene.jpg`, `desk-3-first-menu.jpg`, `desk-3a-first-menu-clear.jpg`, `desk-4-first-ga.jpg` (a Thundaga over the party, the Enemy Intent card reading 129-145 / 128-145 / 274-308 before Shell), `desk-5-georapella-down.jpg` (the Precepts Guard, "Demi 172 / 459 / 426, 25 percent HP" on the card), `desk-6-act-2-first-menu.jpg`.
- What it looks like today: Georapella and the Precepts Guard are the presenter's procedural **dark hooded cone with one glowing eye**, standing on the Bevelle plate with the violet floor ring; legible and in place, and plainly a stand-in. Baralai (act 3) was not reached by this job (the first fight was the brief): his shade painting is predicted, not seen.
- **Not run:** the phone tier (390 x 844), acts 2 and 3 to a result, the seams' pictures, a defeat and retry, the pause screen. J1 to J8 below are the specs for them.

## 11. Files and merge hot spots

New: `src/data/bevelle-guardians-ids.ts`, `chapter-ffx2-bevelle-guardians.ts`, `chapter-meta-ffx2-bevelle-guardians.ts`; `src/data/ffx2/enemies/{bevelle-guardians,bevelle-guardians-abilities}.ts`; `src/data/ffx2/builds/bevelle-guardians.ts`; `src/data/ffx2/monster-records/records-bevelle-guardians.ts`; `src/data/ffx2/command-records/bevelle-guardians.ts`; `src/battle/ffx2/ai/bevelle-guardians.ts`; `src/app/screens/frontend/drillshotDoor.ts`; `src/story/scripts/ffx2-bevelle-guardians.ts`; the fixture `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json`; the helper `tests/unit/helpers/bevelleGuardiansDrive.ts`; seven test files (`chapters/bevelle-guardians-{ai,bench,data,engine,flow,story}.test.ts`, `drillshot-door.test.ts`); the tools `tools/bevelle-guardians-bench.mjs` and `tools/bevelle-guardians-smoke.mjs`; `research/re-ffx2-bevelle-underground.md`, `docs/plans/ch-drillshot-review.md`.

Shared files touched (all additive; **likely conflicts with the other new-chapter lanes, in order**):
1. `src/data/encounters.ts`: `ChapterId` gains `'ffx2-bevelle-guardians'`, `ListedChapterId` excludes it, `Chapter.number` gains `37` (**take the union with the other lanes' edits of the same line**; 399 of 400 lines, no line added).
2. `src/data/chapters-experiments.ts`, `src/data/chapter-meta.ts` (one import folded onto the Maesters' import line to stay at 399), `src/app/screens/frontend/chapterDoors.ts` (the LAST row of the table and one import); `tests/unit/chapter-doors.test.ts` (the word list, the game list: `drillshot` last), `critic-route-doors.test.ts`, the neighbour lists of `gagazet-door`, `yojimbo-door` and `summon-door`, `chapter-numbers.test.ts`; `critic/runner/lib/route-pure.mjs` (one row).
3. `src/battle/ffx2/ai/index.ts`, `data/ffx2/enemies/index.ts`, `command-records/index.ts`, `monster-records/records.ts` (registration lines); `monster-records/kill-rewards.ts` (three rows), `battle/ffx2/adapt/kill-rewards.ts` (`KILL_ITEM_ID`: 0x902e, 0x904e, 0x905a), `data/ffx2/items/held.ts` (three held-only rows: Water Gem, Mana Tablet, Charm Bangle, price 0 in `UNSOURCED_PRICE_IDS`), `tests/fixtures/parity/ffx2/kill_reward_rows.json` (three rows), `tests/unit/parity-ffx2-rewards-data.test.ts` (the names of the three drops), `ffx2-steal-item-names.test.ts` (the unsourced-price list).
3a. The pinned lists the full run found, each one edit: `audio-music-batch2-2026-10-12.test.ts` (the chapter's row in the table of beds and cues; `boss-den-of-woe` gains the chapter as a second owner), `audio-music-elevenlabs-2026-10-10.test.ts` (the chapter in the skip list of the "no other chapter names a new cue" loop: it plays Chapter IV's cue by reference), `ffx2-hit-reaction-wiring.test.ts` (the three bodies join the list without damage-clip frame counts), `chapters/experiment-flow.test.ts` (the no-save-card flag list gains the two links), `data-ffx2-monster-records.test.ts` (the guardians' rows skip the shared fixture: they have their own).
4. `tests/unit/chapters/prep-tip-band.test.ts` ("33 of them") and `prep-tip-short-forms.test.ts` ("33 - 10"): the chapter counts move with every new hidden chapter (**take the sum of the lanes' increments**).
5. `docs/CONTRACT-CHANGES.md`: the entry on top. **`CHANGELOG.md` and NOW.md are not edited** (the integrator writes the release entry; the lines are in section 13).

Not touched: `scenes/bevelle-underground.ts`, `builds/bevelle.ts`, `den-of-woe*.ts`, any engine file. No source file added is over 400 lines (the longest, `ai/bevelle-guardians.ts`, is 328); two new test files are over 400 (the AI test 513, the door test 464), as many of the repository's tests are.

## 12. Tests and checks

- `node node_modules/typescript/bin/tsc --noEmit`: clean (and `-p tsconfig.e2e.json`). `node tools/orphans.mjs`: 24 orphaned of 2,354 modules, the same 24 as before, none of this lane's (the helper and the tools are test or tool files).
- **This chapter's tests: AI 33, data 58, engine 21, flow 12, story 17, bench 11, door 23 = 175**, all green; plus the pinned lists of the shared tests named in section 11 (items 2 to 4 and 3a). The bench rows in section 6 are the 200-seed run of `tools/bevelle-guardians-bench.mjs` (the suite runs 100 a cell; the bench file took about 65 s alone, 137 s under the full run's load).
- **The full suite, twice, on the final tree's ancestors** (`npx vitest run --maxWorkers=3`, 1,978 files, about 45 minutes each):
  - **Run 1** (before the pinned lists were fixed): 1,936 files passed, 31 skipped, **11 failed with 13 tests**; 30,557 tests passed, 252 skipped, 1 todo. Every failure explained: **nine were this lane's registry rows** and are fixed in `d4ff6393d` (the two audio routing tables, the ElevenLabs "no other chapter" loop, the hit-reaction exemption list, the no-save-card flag list, the monster-row fixture skip, the citations tag on the enemies file, the steal-item names for three steals with no `ItemDef` row, and the door test's own "unrelated word", `drizzle`, which holds a Z, the board's confirm key: it picked Yunalesca); **two were this lane's own data tests**, which ran while the wording was being changed (stale, green after); **two are not this lane's and fail the same on the base tip**: `booth-b4-last-rows` (it wants `docs/screenshots/booth-b4-last-plate-grade.png`, which this tree's sparse checkout leaves out: `git ls-files -v` marks it `S`) and `chapters/boss-art-r75` "nothing under src/ names any of them" (`src/data/chapter-spectral-keeper.ts`, which this lane never touched, names `ch29-spectral-keeper-card` in a comment).
  - **Run 2** (after the fixes, before the last two docs commits): **1,945 files passed, 31 skipped, 2 failed; 30,571 tests passed, 252 skipped, 1 todo, 2 failed (30,826).** The two failures are the two above, unchanged. The art-mirror class of release 75 (`tests/unit/chapters/boss-art-r75*.test.ts`, this tree's `public/art` is the r64 mirror) shows only that one failure; the other art tests there are skipped on a mirror without the files.
- `node tools/critic-plan.mjs --paths <the shipped src files>` classes the change **DEEP** (the FFX-2 engine, the chapter registry and a new chapter are each a deep row): a focused review of the production candidate before a deploy, then live verification and the deep review on the live build. Not save-data class (`SaveData.ts` untouched). Ship it with the other wave-2 chapters to share one deep review (the deploy cap).
- Each test file's assertions were run against the real engine first (probes in the lane's scratch), not written from the note: the numbers in sections 2, 4 and 6 are what the engine produced.

## 13. CHANGELOG lines (FFX-2 only unless tagged; for the integrator's release entry)

- **FFX-2 only (new hidden chapter 37, "The Bevelle Guardians", not on the board):** Georapella and the Precepts Guard on floor 3 and Baralai on floor 7 of the Bevelle Underground as three fresh fights in a row, opened by typing `drillshot` on chapter select: the game's own rows and scripts, the Chapter 2 party of the Bahamut fight, the corridor's pyreflies mending the party between acts. Georapella and the Precepts Guard have no paintings yet (placeholders), Baralai wears the Den of Woe shade's, the story is a draft, the music is a stand-in.
- **FFX-2 only:** Baralai calls Drill Shot on the girl who lands his tenth blow (three quarters of her maximum HP); the Precepts Guard's Death lands and kills.
- **Both games (shared plumbing, nothing a player sees):** three more game item names in the kill-reward table (NulTide Ring, Pearl Necklace, Regen Bangle).

## 14. Open questions (for Bailey, or for the RE session where it says so)

1. **Is act 3 right?** Measured: 62 percent for a careful White Mage party, 98 percent when Yuna Changes to a Gunner. Play it first; the options are in section 6.
2. **The paintings and the card (section 7)** and the story draft's read (section 8): Bailey's.
3. **Order and levels (RE §10.1, §10.2):** which floor-3 fight the game puts first, and the party's levels there. A live save at floor 3 settles it.
4. **Two-command polls (finding 4)** and **Reflect (finding 5)**: RE's.
5. **Water Gem, Mana Tablet and Charm Bangle** are held-only rows with no effect and no price (section 3).
6. **Listing the chapter and the Oversoul versions** wait for his word (BG7, the board).
