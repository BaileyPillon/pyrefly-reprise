# FINAL FANTASY X-2 — The fallen aeons: every possessed-aeon fight, and which one is the chapter

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24: "I'll pick your recommendations plus Yojimbo." The third new chapter is an FFX-2 chapter against the aeons possessed by Shuyin's pyreflies, reusing the approved aeon paintings where they fit.
**Research date:** 2026-09-24
**Game case (AGENTS.md rule 14):** **FFX-2 only.** Every number here is FFX-2 data (ATB, dresspheres, action counters). None of it transfers to the FFX aeons, the FFX Dark Aeons or the Yu Yevon possessed aeons (`research/ffx-bfa-yu-yevon.md`).
**Recommendation (§1.2):** **Candidate A — the Road to the Farplane gauntlet, Chapter 5: Shiva, then the Magus Sisters, then Anima.** Three story-mandatory fights in one place, the strongest data of any candidate, three different puzzles, and the approved Shiva painting plus the existing Farplane scene already cover a large share of the art.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

The tags follow `research/ffx-yojimbo.md` §0.1 and `research/ffx2-vegnagun-shuyin.md`.

| Tag | Meaning |
|---|---|
| `[SinirothX]` | SinirothX, *Enemy Encyclopedia* (GameFAQs FAQ 31807): a stat, attack and AI dump hacked from the game's data. The FFX-2 research files already rank it first (`ffx2-vegnagun-shuyin.md`, "Primary data source ranking"). |
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say the same thing. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from sourced constants. |
| `[estimate]` | My own judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §9 with what to do. |

### 0.2 What I did

1. Read `research/ffx-yojimbo.md` (structure, and its §8.2 on the FFX-2 Yojimbo), `research/ffx2-bahamut.md` (the Chapter 2 aeon, already built as our Chapter 4), `research/ffx2-vegnagun-shuyin.md` §6 and §9.1 (the Chapter 5 party and the descent), `research/visual-bible.md` §1.22.6 (Magus Sisters looks), `docs/handoff/art3-aeons.md` and `docs/target/approved-hashes.json` (which paintings exist and which are approved).
2. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext` with a browser user agent (plain pages return HTTP 402). Titles and revision ids are in Sources.
3. Read, into memory only, the SinirothX *Enemy Encyclopedia* and Split_Infinity's *Boss Guide* on GameFAQs (both reachable today; earlier sessions got 403), FFExodus's FFX-2 walkthrough pages 22 to 49, and GamerGuides' FFX-2 HD walkthrough pages for Besaid, Kilika and Djose (Chapter 3) and the Road to the Farplane (Chapter 5). Nothing was saved to the repo; scratch lived under `D:/Tools/pyrefly-scratch/fallen-aeons/`.
4. Cross-checked every stat block field against the other sources and wrote each disagreement down (§9).

### 0.3 Which aeons FFX-2 actually has you fight

The FF Wiki's FFX-2 aeon list is **Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, and the Magus Sisters (Cindy, Sandy, Mindy)** `[verified: 2 sources — wiki Aeon (Final Fantasy X) page, SinirothX bestiary index 164–173]`. The player cannot summon aeons in FFX-2; all of them are enemies. The lore: Shuyin possesses the fayth and sends their aeons against the temples, and fiends pour out of the Chambers of the Fayth through tunnels he dug to the Farplane `[verified: 2 sources — wiki Aeon, Shuyin and Farplane pages; FFExodus Ch. 3 diaries]`.

| Aeon | Where | Chapter | Story or optional | Battle formation `[SinirothX]` |
|---|---|---|---|---|
| **Bahamut** | Bevelle Underground | 2 (chapter finale) | story | `Under Bevelle - Ooinaru Sonzai Mae - BOSS 229 Bahamut 1`. **Already our Chapter 4** (`research/ffx2-bahamut.md`). |
| **Valefor** | Besaid Temple, Chamber of the Fayth | 3 | story: mission "Protect Besaid Temple!" is compulsory | `Besaid Temple - Fayth - BOSS 229 Valefor 1` |
| **Ifrit** | Kilika Temple, Chamber of the Fayth | 3 | story: mission "Pest Control" is compulsory | `Kilika Temple - Fayth - BOSS 229 Ifrit 1` |
| **Ixion** | Djose Temple, Chamber of the Fayth | 3 (chapter finale; opens only after Besaid and Kilika) | story: mission "No Way Djose" is compulsory | `Djose Temple - Fayth - BOSS 229 Ixion 1` |
| **Yojimbo** | Cavern of the Stolen Fayth | 3 or 5 | **optional** (mission "Tourist Trap") | `Cavern of Stolen Fayth - BOSS 229 Yojimbo 1 Daigoro 1`. Covered in `research/ffx-yojimbo.md` §8.2. |
| **Shiva** | Road to the Farplane, first large platform | 5 | story | `Farplane - BOSS 229 Shiva 1` |
| **Magus Sisters** | Road to the Farplane, second large platform | 5 | story | `Farplane - BOSS 228 Mindy 1 Sandy 1 Cindy 1` |
| **Anima** | Road to the Farplane, third large platform | 5 | story | `Farplane - BOSS 227 Anima 1` |

Compulsory status: wiki Besaid Temple, Kilika Temple and Djose Temple pages (mission notes), with GamerGuides and FFExodus walking all three as the main path `[verified: 2 sources]`. Chapter 5 order Shiva → Magus Sisters → Anima: wiki Farplane page, FFExodus, GamerGuides `[verified: 3 sources]`.

**Not candidates:** the International / HD **Fiend Arena** versions of every aeon (unlocked through fiend tales; stronger stat blocks, different AI; the wiki prints them as a second section on each aeon's page). They are postgame arena content with no story. Do not mix their numbers with the story versions.

---

## 1. The answer: which fight is the chapter

### 1.1 The candidates at a glance

| | **A. Road to the Farplane gauntlet** (Ch. 5) | B. The temple trio (Ch. 3) | B′. Ixion alone (Ch. 3 finale) | C. Yojimbo (Ch. 3/5) |
|---|---|---|---|---|
| Fights | Shiva → Magus Sisters (3 bodies) → Anima | Valefor, Ifrit, Ixion (three separate missions in three temples) | Ixion | Yojimbo + Daigoro |
| Story | Mandatory. The last act before the finale; Yuna faces three of her own aeons in a row (she opens each fight with an apology or with dismay `[SinirothX quote patterns]`). Ends in the Farplane Glen with the Leblanc Syndicate. | Mandatory, but spread across Besaid (Wakka and Beclem), Kilika (the Youth League / New Yevon standoff) and Djose (Gippal's missing Machine Faction) | Mandatory. Ixion's last charge knocks Yuna into the Farplane, where Shuyin mistakes her for Lenne and Tidus's whistle leads her out. The strongest single beat. | Optional side mission |
| HP | 14,800 / 9,788 + 10,330 + 12,240 / 36,000 | 8,430 / 8,820 / 12,380 | 12,380 | 22,000 |
| Data quality | **Best.** SinirothX full blocks and AI for all five bodies; wiki AI dumps for Shiva and Anima, prose AI for the Sisters that matches; three guides for stats and behaviour | Good. SinirothX + wiki (Ifrit has a wiki AI dump; Valefor and Ixion prose only) + 3 guides | Same as B | Good (`ffx-yojimbo.md` §8.2; SinirothX now confirms the action counter) |
| Mechanics | Three different asks: an action counter with Stop and a Fire weakness; a three-body fight where killing **any one** sister disarms Delta Attack; a 36,000-HP attrition fight with stacking status and a Holy weakness | Three action-counter bosses of one shape (build to an Overdrive, heal before it) | One action-counter boss with a fixed Recharge → Thor's Hammer tell | Action counter to a party-to-1-HP Zanmato |
| Art already on disk | **Shiva approved** (hash-recorded). Anima painted (verdict unclear, §8). Farplane scene exists (`src/scenes/farplane.ts`, used by Chapter 5). **New: the three Magus Sisters.** | Valefor, Ifrit, Ixion painted, **none approved**. Three new temple chambers. The FFX-2 Ixion is fused with machina `[single source]`, so a new variant. | Ixion painting unapproved + machina variant + Djose chamber | Approved `yojimbo-cavern` + `daigoro` idles (from the FFX chapter) |

### 1.2 Recommendation: Candidate A, the Road to the Farplane gauntlet

**Build Shiva → Magus Sisters → Anima as one FFX-2 chapter of three links**, provisionally Chapter XI after Yojimbo (IX) and Seymour Natus (X). The recommendation is `[estimate]`; each reason is sourced.

1. **It is the fallen-aeons story in one place.** Chapter 3 spreads its aeons over three temples and three unrelated local plots. Chapter 5 puts three possessed aeons on one road, back to back, on the way to Vegnagun. `ffx2-vegnagun-shuyin.md` §9.1 already sets the tone of this stretch as mournful: these were Yuna's own aeons.
2. **Its data is the strongest.** Every body has a SinirothX block with damage constants and an AI script. Shiva's and Anima's AI also appear as wiki dumps that match SinirothX exactly. The Magus Sisters' AI matches between SinirothX and three wiki pages. HP agrees across five sources (SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity).
3. **Three different puzzles, not one repeated.** Shiva teaches the action counter and Stop protection. The Sisters are a target-priority puzzle: Delta Attack needs all three alive, so the first kill disarms it (§4.2). Anima is attrition: 36,000 HP, stacking stat-downs from Pain, a Holy weakness. The temple trio (B) is three versions of the first.
4. **The art bill is smaller than it looks.** Shiva is approved. Anima is painted. The Farplane already has a scene for Chapter 5, and the Road is its approach. The real new art is the three Sisters, which `research/visual-bible.md` §1.22.6 already describes.
5. **It sits next to a finished chapter without overlapping it.** The Road comes right before the Heart of the Farplane (Vegnagun, our Chapter 5). It is a different area of the Farplane, and none of its fights appears in Chapter 5.

**If Bailey wants one fight rather than three,** the choice is **B′, Ixion** at Djose: the best story beat of any single aeon fight, but on an unapproved painting that needs a machina-fused variant. **Yojimbo (C)** stays optional content; if wanted, it is a fourth, separate fight, not a link of the Road.

**Open design question for Bailey (not decided here):** what happens between links. GamerGuides (HD) says to save and heal at a Save Sphere after Shiva, and to walk back to the previous Save Sphere after the Sisters. FFExodus (PS2) says there is no save point until the Farplane Glen `[conflict]`, §9 F-1. The faithful answer is therefore either "full restore between links" or "HP and status carry over". Present both as options.

---

## 2. Candidate A — where, when, and the shape of the gauntlet

- **When:** Chapter 5, after the Gullwings decide to follow Nooj, Gippal and the possessed Baralai into the Farplane. The party drops through the hole under a temple's fayth statue. There are **five routes** (Besaid, Kilika, Djose, Bevelle Underground, Calm Lands / Cavern of the Stolen Fayth), each with its own traversal gimmick; taking all five earns the Megiddo Garment Grid `[verified: 2 sources — FFExodus Ch. 5 Farplane, ffx2-vegnagun-shuyin.md §9.1]`.
- **The road:** a long, linear path with one intersection, then **three large platforms**, one boss on each `[single source: GamerGuides]`. FFExodus puts the three fights "at the end of the path" in its summary but has Shiva mid-path on the Djose route `[conflict, minor]`.
- **Order:** Shiva, then the Magus Sisters, then Anima `[verified: 3 sources]`. Three separate formations (`BOSS 229`, `228`, `227`) `[SinirothX]`.
- **After Anima:** a scene, then the **Farplane Glen** (the flower meadow). Leblanc, Ormi and Logos wait there, eyeing the path down; Leblanc sells items. The party returns to the *Celsius* before the Heart of the Farplane `[verified: 3 sources — FFExodus, GamerGuides, ffx2-vegnagun-shuyin.md §9.1]`.
- **Reward of note:** Anima's defeat awards the **Immortal Soul** Garment Grid `[verified: 2 sources — wiki Anima, GamerGuides]`.
- **Unknown:** whether the three aeons fight you again on the second to fifth routes. No source says. §9 F-2.

---

## 3. Candidate A — stat blocks

Common to every story aeon: MP 9,999; **Gravity immune**; immune to Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Stop, Doom, Delay, Interrupt and fractional damage; cannot be bribed; no Oversoul `[verified: 2 sources — SinirothX, wiki; Split_Infinity's immunity lists agree]`. Accuracy 0 is a real FFX-2 value, not missing data (`ffx2-bahamut.md` §1.1).

### 3.1 Shiva (bestiary #181)

| Field | Value | Confidence |
|---|---:|---|
| Level | 41 | SinirothX + wiki `[verified: 2 sources]` |
| HP | **14,800** | SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity `[verified: 5 sources]` |
| STR / MAG / DEF / MDEF | 69 / 58 / 74 / **183** | SinirothX + wiki `[verified: 2 sources]` |
| Agility | **119** (SinirothX) / 124 (wiki) | `[conflict]` §9 F-3 |
| Evasion / Luck / Accuracy | 58 / 6 / 0 | SinirothX + wiki (wiki omits Accuracy) |
| EXP / AP / Gil / Pilfer gil | 8,000 / 15 / 2,000 / 5,000 | SinirothX, wiki, FFExodus `[verified: 3 sources]` |
| Elements | **Fire weak, Ice absorb**, Gravity immune | all five sources |
| Extra immunities | none beyond the common list: **Slow and the Breaks land** (Split_Infinity and GamerGuides both recommend Power and Magic Break; FFExodus recommends Slow) | SinirothX + 3 guides |
| Zantetsu resistance | 80 | SinirothX + wiki |
| Drop / rare drop | Crystal Gloves / Regal Crown | SinirothX, wiki, FFExodus, Split_Infinity |
| Steal | Snow Ring (both), steal rate 128 | SinirothX + wiki |
| Scan | "An aeon that once fought alongside Yuna." | SinirothX + wiki |

### 3.2 The Magus Sisters (Sandy #186, Cindy, Mindy)

The wiki prints bestiary #181 for both Cindy and Mindy, which cannot be right (Shiva is #181). Not needed for the build.

| Field | **Sandy** (mantis) | **Cindy** (ladybug) | **Mindy** (bee) | Confidence |
|---|---:|---:|---:|---|
| Level | 45 | 46 | 44 | SinirothX + wiki |
| **HP** | **10,330** | **12,240** | **9,788** | SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity `[verified: 5 sources]` |
| STR / MAG | 40 / 17 | 38 / 9 | 28 / 8 | SinirothX + wiki |
| DEF / MDEF | 83 / 84 | **172 / 133** | 72 / 121 | SinirothX + wiki |
| Agility | 83 | 72 | 89 | SinirothX + wiki |
| **Evasion** | 33 | 4 | **76** | SinirothX + wiki. Split_Infinity: Sandy's and Mindy's evasion is the main difficulty. |
| Luck / Accuracy | 4 / 0 | 4 / 0 | 4 / 0 | SinirothX (+ wiki for Luck) |
| EXP / Gil / Pilfer gil | 3,000 / 1,000 / 3,000 each | | | SinirothX, wiki, GamerGuides `[verified: 3 sources]` |
| **AP** | 8 each (wiki, GamerGuides, Split_Infinity); **15** each (SinirothX); Cindy 0 in the printed guides' walkthrough (wiki note; FFExodus prints 0 EXP / AP / gil for Cindy) | | | `[conflict]` §9 F-4 |
| Elements | neutral to all; Gravity immune | | | all sources |
| Extra immunities | **Slow and every stat modifier** (the Breaks do not land), Reflect | | | SinirothX + wiki + Split_Infinity |
| Zantetsu | 150 | 150 | 150 | SinirothX + wiki |
| Drop / rare | Pixie Dust / Crystal Gloves | Faerie Earrings / Pixie Dust | Faerie Earrings / Faerie Earrings | SinirothX + wiki + GamerGuides |
| Steal | Potpourri | White Cape | Chaos Shock | SinirothX + wiki |
| "Thinking Period" | 30 | 30 | 30 (0 on every other aeon) | `[SinirothX]` only; meaning not documented, do not implement until understood |

### 3.3 Anima (bestiary #183)

| Field | Value | Confidence |
|---|---:|---|
| Level | 43 | SinirothX + wiki |
| HP | **36,000** | SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity `[verified: 5 sources]` |
| STR / MAG / DEF / MDEF | 32 / 33 / 84 / 42 | SinirothX + wiki |
| Agility / Evasion / Luck | 133 / 0 / 5 | SinirothX + wiki (wiki omits Evasion) |
| EXP / AP / Gil / Pilfer gil | 6,000 / 15 / 2,000 / 4,000 | SinirothX, wiki, FFExodus `[verified: 3 sources]` |
| Elements | **Fire, Ice, Lightning, Water halved; Holy weak**; Gravity immune (the wiki prints *Absorb* for Gravity) | SinirothX + Split_Infinity + GamerGuides for the halves and Holy; Gravity `[conflict, minor]` |
| Extra immunities | **Slow, every stat modifier, Reflect** | SinirothX + wiki |
| Zantetsu | 110 | SinirothX + wiki |
| Drop / Steal | Tetra Band / Fury Shock (steal rate 128) | SinirothX + wiki + FFExodus |
| Reward | Immortal Soul Garment Grid | wiki + GamerGuides |

---

## 4. Candidate A — actions and AI

"Action Count" (AC) is the FFX-2 aeons' shared device: a hidden counter that rises on the boss's own actions and when it is attacked, and fires the aeon's Overdrive at 100 `[verified: 2 sources]`. It is **not** FFX's Overdrive gauge. Damage constants (DC) are `[SinirothX]`; the damage formulas are in `research/ffx2-combat-core.md`.

### 4.1 Shiva

| Action | Effect | DC / type | Source |
|---|---|---|---|
| Normal Attack ("Kick") | one target, physical | 16 | SinirothX; about 400 observed (Split_Infinity) |
| Blizzaga | one target, Ice, magic, 24 MP | 19 | SinirothX + wiki; about 500 (Split_Infinity) |
| Triple Attack | 3 hits on random targets, physical | 12 ×3 | SinirothX + wiki |
| **Heavenly Strike** | **halves one target's current HP and MP, Stop** (chance 30) | fractional | SinirothX, wiki, GamerGuides, Split_Infinity `[verified: 4 sources]` |
| **Diamond Dust** | whole party, magic | 26 | SinirothX says **Ice element**; wiki, GamerGuides and Split_Infinity all say **non-elemental** (Ice Eater does not absorb it) `[conflict]` §9 F-5; about 1,000 to all (Split_Infinity) |

**AI** `[verified: 2 sources — SinirothX, wiki AI dump, identical]`:

```
AC 0–64:   1/2 Normal Attack, 1/4 Blizzaga, 1/4 Heavenly Strike
AC 65–99:  1/2 Blizzaga, 1/4 Triple Attack, 1/4 Heavenly Strike
AC >= 100: AC = 0, Diamond Dust
AC += 3 when she uses any attack except Diamond Dust; AC += 5 when she is attacked
```

`[derived]`: with no hits taken she needs 34 of her own actions to reach 100; each party attack is worth almost two of her turns, so an aggressive party brings Diamond Dust sooner. Split_Infinity and FFExodus call her unpredictable, which fits the random split inside each band.

### 4.2 The Magus Sisters

| Sister | Action | Effect | DC / type |
|---|---|---|---|
| Sandy | Normal Attack | one target, physical | 16 |
| Sandy | **Razzia** | one target, magic | 16 |
| Cindy | **Camisade** | one target, physical | 16 |
| Cindy | Absorb | drains 3/16 of one target's current HP and MP | fractional |
| Cindy | Demi | whole party loses 1/4 of current HP, Gravity, 10 MP | fractional |
| Cindy | Regen | Regen on one sister, 40 MP | status |
| Cindy | **Not-So-Mighty Guard** | Protect, Shell and Regen on all three sisters | status |
| Cindy | White Highwind | heals all sisters by 3/8 of max HP and cures their ailments and stat changes | fractional |
| Mindy | **Passado** | one target; see the conflict below | fractional |
| Mindy | Firaga / Blizzaga / Thundaga / Waterga | one target, element, magic, 24 MP | 19 |
| all three | **Delta Attack** | whole party to **1 HP** and **0 MP** (SinirothX prints "remaining HP − 1" and mentions only HP) | constant |

Sources: SinirothX + wiki Cindy / Sandy / Mindy pages + wiki enemy-ability table + GamerGuides + Split_Infinity. Delta Attack's HP effect is `[verified: 4 sources]`; the MP part is wiki-only.

**Passado** `[conflict]` §9 F-6: SinirothX "1/16 of remaining HP, 15 times"; wiki "reduces HP by 15/16"; Split_Infinity and GamerGuides "takes 81.5% of current HP". All agree it cannot kill.

**AI** `[verified: 2 sources — SinirothX and the wiki pages agree on every threshold and weight]`:

```
Sandy:  3/4 Normal Attack, 1/4 Razzia
Mindy:  1/3 Passado, 1/6 each of Firaga / Blizzaga / Thundaga / Waterga
Cindy:  turn 1 Not-So-Mighty Guard; turns 2–8 "Action 1"; then back to turn 1
        Action 1: if all three sisters are alive and all are below 1/4 of max HP -> White Highwind
                  else 1/4 each Camisade / Absorb / Demi / Regen
Each sister's AC += 5 when her turn passes, when she is attacked, and when Regen heals her.
Cindy's AC += 5 more when she uses Absorb.
When all three sisters are alive and every AC >= 100: all ACs = 0, Delta Attack.
```

**The design fact of this fight:** Delta Attack needs all three alive. Killing **any one** sister removes it for the rest of the fight `[verified: 4 sources]`. The guides disagree about who to kill first: the wiki and GamerGuides say Mindy (lowest HP); Split_Infinity says Cindy (the buffs and heals); FFExodus says Mindy, then Sandy. Darkness (Dark Knight) hits all three and cannot be evaded, which is why most guides build around it.

### 4.3 Anima

| Action | Effect | DC / type | Source |
|---|---|---|---|
| Normal Attack ("Stare") | one target, magic that **ignores Magic Defense**, Poison (chance 25) | 10 | SinirothX + wiki; GamerGuides calls it unblockable |
| **Pain** | one target, magic; Silence, Darkness, Itchy (each chance 120) and **−1 level** to Strength, Magic, Defense, Magic Defense, Accuracy, Evasion | 16 | SinirothX + wiki + GamerGuides `[verified: 3 sources]`. Not instant death, unlike FFX. |
| **Oblivion** | 16 hits on random party members | 5 ×16 | SinirothX says **physical**; Split_Infinity and GamerGuides treat it as magical (Shell advice); wiki says non-elemental `[conflict]` §9 F-7 |

**AI** `[verified: 2 sources — SinirothX, wiki AI dump]`:

```
4/5 Normal Attack (random target), 1/5 Pain (random target)
AC += 5 when she attacks or is attacked
AC >= 100: AC = 0, Oblivion
```

Pain's stat-downs stack across the fight, and Remedy clears them (Split_Infinity) `[single source]`.

---

## 5. Candidate A — the party and builds at that point

- **Party:** Yuna, Rikku, Paine, with every dressphere, Garment Grid and special dressphere available by Chapter 5. Use the Chapter 5 preset work in `research/ffx2-vegnagun-shuyin.md` §6 (Lv 45–52 is that file's finale estimate, `[estimate]`). The Road comes directly before the finale and its bosses are Lv 41–46, so the same preset fits. Do not invent a separate level.
- **What the sources actually bring** (each is a strategy the chapter should allow):
  - **Two Dark Knights on Darkness plus a White Mage or Alchemist healer.** Split_Infinity uses it for all three fights, GamerGuides for all three, the wiki for the Sisters and Anima `[verified: 3 sources]`.
  - **Mighty Guard** (Gun Mage Blue Bullet) or Protect + Shell at the start of each fight (GamerGuides) `[single source]`.
  - **Shiva:** Stop protection (Ribbon, Kinesis Badge, Auto-Haste, the Thief's Stopproof), Fire (Firaga, Flametongue, Fire Breath), Breaks `[verified: 3 sources]`.
  - **Magus Sisters:** kill one sister first; Dispel on Not-So-Mighty Guard; Paine's Full Throttle Sword Dance; Samurai Spare Change (about 300,000 gil) as an instant kill on Mindy `[verified: 2 sources for Spare Change — Split_Infinity, GamerGuides]`.
  - **Anima:** Ribbons; Holy (Warrior's Excalibur, Trainer's Kogoro Holy); Shell early; Remedy after Pain `[verified: 3 sources]`.
- **Hit rule:** FFX-2's accuracy model applies (`ffx2-combat-core.md`). Sandy's and Mindy's evasion (33, 76) is the only place in this chapter where physical misses matter. Darkness does not miss.

---

## 6. Candidate A — arena, beats, and music

### 6.1 Arena

- **The Road to the Farplane:** floating stone paths over a bright void, route gimmicks by temple (island rides, fire geysers, platform ordering, straight hops, teleporters), then three **large platforms** for the bosses `[verified: 2 sources — FFExodus, GamerGuides]`. The wiki's Farplane gallery holds concept art and screenshots titled "Road to the Farplane" and "Path to the Farplane" (images, not fetched).
- The Glen at the end is the flower meadow already described in `ffx2-vegnagun-shuyin.md` §10.4.
- **Reuse:** `src/scenes/farplane.ts` (Chapter 5's Farplane) is the natural base. Whether the Road gets its own dressing of that scene or a new scene is an art-options question for Bailey (rule 9).

### 6.2 Beat sheet (paraphrased; our own dialogue gets written separately)

| # | Beat | Source |
|---|---|---|
| 1 | The Gullwings drop through a temple's fayth hole into the Farplane, following Nooj, Gippal and the possessed Baralai. | wiki Farplane; `ffx2-vegnagun-shuyin.md` §9.1 |
| 2 | The linear road; one side branch with Mega-Potions. | GamerGuides |
| 3 | **Shiva** on the first platform. Yuna is caught by surprise at the start. | SinirothX quote pattern |
| 4 | A Save Sphere (HD) or none (PS2). | `[conflict]` F-1 |
| 5 | **The Magus Sisters** on the second platform. Yuna's dismay that they have fallen too. | SinirothX quote pattern |
| 6 | **Anima** on the third platform. Yuna asks her forgiveness. | SinirothX quote pattern |
| 7 | A scene, then the Farplane Glen; Leblanc, Ormi and Logos waiting; back to the *Celsius*. | FFExodus, GamerGuides |

FFExodus's diary voice for this stretch has Yuna hoping she was done fighting her corrupted allies. It is a guide's paraphrase, not game text, but it gives the tone.

### 6.3 Music

- **"Aeons"** (FFX-2 OST, 1:07) plays in the battles against the aeons `[single source: wiki FFX-2 OST page; the Cavern page cited in ffx-yojimbo.md is the same wiki]`. **Bahamut** is the exception with "Yuna's Ballad" (`ffx2-bahamut.md` §5.4).
- **"The Farplane Abyss"** is the Farplane field theme `[verified: 2 sources — wiki Farplane and OST pages]`.
- Our game already has an original FFX-2 aeon cue, `boss-ffx2-aeon` ("Static Coronation", used by Chapters 4 and 6). Whether this chapter reuses it or gets its own cue is Bailey's call by ear (rule 13).

---

## 7. The other candidates — full data

### 7.1 Candidate B — the Chapter 3 temple trio

All three are story-compulsory missions (§0.3). Stats `[verified: 2 sources — SinirothX, wiki]`; HP, EXP, AP, gil and items also match FFExodus, GamerGuides and Split_Infinity.

| Field | **Valefor** (#178) | **Ifrit** (#179) | **Ixion** (#180) |
|---|---:|---:|---:|
| Where | Besaid Temple | Kilika Temple | Djose Temple (Ch. 3 finale) |
| Level | 22 | 23 | 28 |
| HP | 8,430 | 8,820 | 12,380 |
| STR / MAG / DEF / MDEF | 97 / 11 / 76 / 20 | 82 / 22 / 98 / 49 | 62 / 21 / 106 / 82 |
| AGI / EVA / Luck | 125 / 25 / 3 | 114 / 14 / 2 | 138 / 35 / 4 |
| EXP / AP / Gil / Pilfer | 1,500 / 15 / 1,200 / 1,500 | 1,800 / 15 / 1,300 / 1,800 | 2,600 / 15 / 1,800 / 3,000 |
| Elements | neutral | **Fire absorb, Ice weak** | **Lightning absorb, Water weak** |
| Breaks and Slow | land | land | land |
| Drop | Moon Bracer | Angel Earrings | Soul of Thamasa |
| Steal | Healing Spring ×4 (rare ×6) | Fiery Gleam | Sprint Shoes |

**Valefor** `[verified: 2 sources — SinirothX, wiki prose]`: Normal Attack (DC 16), Sonic Wings (MP damage on the character furthest away, DC 2), Energy Ray (everyone in a 160° arc in front of her, magic, DC 20), Energy Blast (all, magic, DC 25). Basic: 2/3 Normal Attack, 1/3 Sonic Wings. AC +5 when she acts or is attacked; Energy Ray on crossing 30 and 60; at 100, AC = 0 and Energy Blast. (The wiki's "after 6 / 12 / 20 counts" is the same 30 / 60 / 100 at 5 per count.)

**Ifrit** `[verified: 2 sources — SinirothX, wiki AI dump]`: Normal Attack (DC 16), Meteor Strike (the character furthest away, magic, DC 25), Firaga (all, Fire, DC 19), Hellfire (all, Fire, DC 24). Basic: 2/3 Normal Attack, 1/3 Firaga on all. AC +7 when he acts, +5 when he is hit; Meteor Strike on crossing 30, 60 and 90; at 100, AC = 0 and Hellfire. The Samurai dressphere is found in the temple on the way to him `[verified: 2 sources — GamerGuides, wiki Dressphere]`.

**Ixion** `[SinirothX]` + wiki prose: Normal Attack (DC 16), Thundara (all, Lightning, DC 12), Aerospark (5/8 of one target's current HP), Recharge (restores 200 HP and 200 MP to himself), Thor's Hammer (all, DC 30). Basic cycle: turns 1 and 2 are Normal Attack or Thundara on all, turn 3 is Aerospark, repeat. The split is **3/4 : 1/4 (SinirothX) or 2/3 : 1/3 (wiki)** `[conflict]` §9 F-8. AC +5 per action or hit, +10 for Aerospark; at 100, Recharge, then AC = 0 and Thor's Hammer. **Thor's Hammer's element:** SinirothX says Lightning; wiki, Split_Infinity and GamerGuides say non-elemental and not absorbable `[conflict]` §9 F-5. **Story:** after he falls, Ixion rises once more and charges; Yuna falls into the hole where the fayth stood, meets Shuyin (who takes her for Lenne) and is led out by Tidus's whistle (the "press X four times" good-ending flag) `[verified: 3 sources — wiki Farplane and Shuyin pages, FFExodus, GamerGuides]`. The FFExodus diary says this Ixion has merged with machina `[single source]`.

Music for all three: "Aeons" `[single source: wiki OST]`.

**Why not the chapter:** the three fights are one boss shape three times; they need three different temple chambers and three new paintings (none of Valefor, Ifrit or Ixion is approved); and each local plot (Beclem and Wakka; the Awesome Sphere standoff; the Machine Faction) needs its own setup. Ixion alone (B′) is the fallback if Bailey wants one fight.

### 7.2 Candidate C — Yojimbo (optional, "Tourist Trap")

See `research/ffx-yojimbo.md` §8.2 for the full block. New today: **SinirothX confirms the action counter** there (+8 per turn, bands 0–29 / 30–69 / 70–99, Zanmato at 100) and every weight in that table, so that file's open item **Y-8 is now `[verified: 2 sources]`**. SinirothX also gives Wakizashi DC 16 and 13, Daigoro DC 16 (it follows through even if Yojimbo is hit), and Zanmato as "remaining HP and MP − 1". The formation has Daigoro as a separate body (`Yojimbo 1 Daigoro 1`). Not a link of the Road (different location); an optional extra only.

### 7.3 Bahamut — already built

Chapter 2 story aeon, our Chapter 4 (`ffx2-bahamut`). SinirothX matches `research/ffx2-bahamut.md` (HP 8,400; turn-scripted Curse, three attacks, Impulse twice, a countdown from 5, Mega Flare). Nothing to add.

---

## 8. Art: which paintings can serve

What `docs/target/approved-hashes.json` records and what is on disk in `public/art/characters/` (nothing there was changed):

| Subject | On disk | Approved? | For this chapter |
|---|---|---|---|
| **Shiva** | idle, attack, overdrive | **Yes** — set `cast:shiva` (tile "Shiva summoned in an FFX chapter") | **Serves.** Its sidecar says `facing: left`, the enemy side. Needs a **possessed treatment** and **hurt / ko** states, which do not exist. Derive them from the approved pixels (`docs/plans/art-method-r3/METHOD-CHECK.md`); do not re-render. |
| **Anima** | idle, attack, hurt, ko, overdrive | **Unclear.** Not in `approved-hashes.json`. The Macalania tile in `targets.json` calls the idle "board-approved"; the board note says aeons "have no verdict yet". `art3-aeons.md` calls the idle an approximation, not the canon two-part body. | **Ask Bailey** whether it is approved before deriving from it. Needs a possessed treatment. |
| **Magus Sisters** | nothing | — | **Three new subjects.** Looks from `visual-bible.md` §1.22.6: Sandy tall and slim, red praying-mantis armour; Cindy rotund, blue-and-red ladybug armour; Mindy the smallest, orange bee armour, hovers `[single source]`. Needs an options round (rule 9). |
| Valefor, Ifrit, Ixion | idle, attack, overdrive each | No verdict | Only for Candidate B. Ixion would need a machina-fused variant. |
| Yojimbo | `yojimbo-cavern/idle` + `daigoro/idle` | **Yes** — set `chapter:yojimbo:2026-09-24` | Only for Candidate C. Both already face the enemy side (`facing: left`). The old `yojimbo/*` painting is not approved (D-054). |
| Bahamut (X-2) | `ffx2-bahamut/*` | built for Chapter 4 | Not needed. |

**How the possessed look is done in this house.** `ffx2-bahamut/idle.json` renders from the FFX Bahamut idle as the reference (`refWeight 0.45`) with violet glow, glowing purple veins, a dark violet aura, "corrupted, possessed" in the prompt. That is the precedent for a Shiva and an Anima variant. **No source verifies** that the FFX-2 in-game models are recoloured: the guides' "Dark Shiva" is a nickname (the in-game name is plain "Shiva" per SinirothX), and `ffx2-bahamut.md` §6.1 already records the recolour as unverified. Treat the violet treatment as a house-style choice to show Bailey, not as canon.

---

## 9. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| **F-1** | **Between links:** GamerGuides (HD) has Save Spheres between the platforms (free healing); FFExodus (PS2) says no save point until the Glen. | **Open, and a design question.** Show Bailey both: full restore between links, or HP and status carry over. |
| F-2 | Do the three aeons fight again on the second to fifth routes? | No source says. Irrelevant to one chapter; noted for completeness. |
| F-3 | Shiva Agility: SinirothX 119, wiki 124. | Use **119** (SinirothX is this repo's ranked FFX-2 source) and tag it. |
| F-4 | Magus Sisters AP: 8 each (wiki, GamerGuides, Split_Infinity) against 15 each (SinirothX); Cindy 0 in the printed guides' walkthrough. | Three sources say 8. AP matters only if the results screen shows it. |
| **F-5** | **Diamond Dust and Thor's Hammer elements:** SinirothX lists Ice and Lightning; three sources each say the attacks are non-elemental and not absorbable. | **Open.** Observed behaviour outvotes the data dump 3 to 1, but SinirothX is the dump. Do not build absorb behaviour on either until checked; if it must ship, non-elemental as a labelled `[estimate]`. |
| **F-6** | **Passado:** "1/16 of remaining HP ×15" (SinirothX) vs "reduces HP by 15/16" (wiki) vs "81.5% of current HP" (Split_Infinity, GamerGuides). | **Open.** Fifteen compounding hits of 1/16 leave 37.9% `[derived]`, so no two readings agree. It never kills in any source. Do not invent a fourth number; ask Bailey or find a second data dump. |
| F-7 | Oblivion: physical (SinirothX) vs magical (Split_Infinity; GamerGuides' Shell advice). Decides whether Protect or Shell reduces it. | **Open.** Same treatment as F-5. |
| F-8 | Ixion's basic split: 3/4 : 1/4 (SinirothX) vs 2/3 : 1/3 (wiki). | Only for Candidate B. Use SinirothX and tag it. |
| F-9 | Delta Attack and MP: SinirothX lists only "remaining HP − 1"; the wiki says HP to 1 and MP to 0. | Single source for the MP half. |
| F-10 | Magus Sisters "Thinking Period 30" (every other aeon 0). | Meaning undocumented. Do not implement. |
| F-11 | Anima painting's approval status (§8). | Ask Bailey. |
| F-12 | Whether the FFX-2 aeon models are recoloured. | Unverified; see §8. |
| F-13 | Damage in numbers. The guides give observed values (Shiva's Kick about 400, Blizzaga about 500, Diamond Dust about 1,000; Anima's Oblivion about 600 to all), but they depend on the writer's party. | Compute from the DCs with `ffx2-combat-core.md` once the preset exists; do not ship guide figures as data. |

---

## 10. Minimum mechanic list for Candidate A (FFX-2 only)

1. **The action counter** as an engine feature: per-boss increments on its own action and on being attacked (Shiva +3 / +5; each Sister +5 per turn, hit or Regen tick, Cindy +5 more on Absorb; Anima +5 / +5), and the Overdrive at 100. The Chapter 3 aeons, Yojimbo and the Fiend Arena use the same device, so it pays off later. Check first whether `src/battle/ffx2` already has one (the Bahamut chapter is turn-scripted, not counter-driven).
2. **Heavenly Strike:** half of current HP and MP plus Stop at chance 30.
3. **A three-body boss with a shared Overdrive:** Delta Attack needs all three alive and all three counters at 100; the first death disables it for good.
4. **Cindy's buff and heal logic:** Not-So-Mighty Guard on her first turn and every eighth turn after; White Highwind when all three are alive and below 1/4.
5. **Pain's stacking stat-downs** (−1 level on six stats per hit), cleared by Remedy.
6. **Elements, immunities and stats exactly as §3.** Shiva (and the Chapter 3 aeons) take Breaks and Slow; the Sisters and Anima do not.
7. **Before any of this is built:** end-state options to Bailey for the Road arena, the three Sisters, the possessed treatment of Shiva and Anima, the between-links rule (F-1) and the music cue (rules 9 and 13).

---

## Sources

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext`, browser user agent; fetched 2026-09-24)

- Valefor (Final Fantasy X-2), revid 3979327: https://finalfantasy.fandom.com/wiki/Valefor_(Final_Fantasy_X-2)
- Ifrit (Final Fantasy X-2), revid 3979434: https://finalfantasy.fandom.com/wiki/Ifrit_(Final_Fantasy_X-2)
- Ixion (Final Fantasy X-2), revid 3979438: https://finalfantasy.fandom.com/wiki/Ixion_(Final_Fantasy_X-2)
- Shiva (Final Fantasy X-2), revid 3980319: https://finalfantasy.fandom.com/wiki/Shiva_(Final_Fantasy_X-2)
- Bahamut (Final Fantasy X-2), revid 3980324: https://finalfantasy.fandom.com/wiki/Bahamut_(Final_Fantasy_X-2)
- Anima (Final Fantasy X-2), revid 3980331: https://finalfantasy.fandom.com/wiki/Anima_(Final_Fantasy_X-2)
- Yojimbo (Final Fantasy X-2), revid 3980334: https://finalfantasy.fandom.com/wiki/Yojimbo_(Final_Fantasy_X-2)
- Cindy (Final Fantasy X-2), revid 3980350: https://finalfantasy.fandom.com/wiki/Cindy_(Final_Fantasy_X-2)
- Mindy (Final Fantasy X-2), revid 3980352: https://finalfantasy.fandom.com/wiki/Mindy_(Final_Fantasy_X-2)
- Sandy (Final Fantasy X-2), revid 3980354: https://finalfantasy.fandom.com/wiki/Sandy_(Final_Fantasy_X-2)
- Aeon (Final Fantasy X), revid 4029264: https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)
- Final Fantasy X-2 enemies, revid 3979315: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemies
- Final Fantasy X-2 enemy abilities, revid 3998493: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities
- Shuyin, revid 4044072: https://finalfantasy.fandom.com/wiki/Shuyin
- Farplane (Final Fantasy X), revid 3998715: https://finalfantasy.fandom.com/wiki/Farplane_(Final_Fantasy_X)
- Besaid Temple, revid 4034548: https://finalfantasy.fandom.com/wiki/Besaid_Temple
- Kilika Temple, revid 4034363: https://finalfantasy.fandom.com/wiki/Kilika_Temple
- Djose Temple, revid 4034469: https://finalfantasy.fandom.com/wiki/Djose_Temple
- Final Fantasy X-2: Original Soundtrack, revid 3984616: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack
- Dressphere, revid 4045630: https://finalfantasy.fandom.com/wiki/Dressphere

**GameFAQs** (read into memory, 2026-09-24)

- SinirothX, *Final Fantasy X-2 Enemy Encyclopedia* (PS2), FAQ 31807: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807 — entries Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo, Sandy, Cindy, Mindy; bestiary index 164–174; formation table (Besaid / Kilika / Djose Temple Fayth, Farplane BOSS 227–229, Cavern of Stolen Fayth).
- Split_Infinity, *Final Fantasy X-2 Boss Guide* (PS2), FAQ 26832: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26832 — sections G0622 (Yojimbo), G0625–G0627 (Valefor, Ifrit, Ixion), G0650–G0652 (Shiva, Magus Sisters, Anima).

**Walkthroughs**

- FFExodus, FFX-2 walkthrough: Chapter 3 Calm Lands, Besaid, Kilika, Djose Temple and Chapter 5 Farplane — http://www.ffexodus.com/ffx2/walkthrough28.php, walkthrough30.php, walkthrough31.php, walkthrough33.php, walkthrough49.php
- GamerGuides (Damir Kolar), *Final Fantasy X-2 HD Remaster* walkthrough — https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-3/besaid , …/chapter-3/kilika , …/chapter-3/djose-mission , …/chapter-5/road-to-the-farplane

**Local files consulted:** `research/ffx-yojimbo.md`, `research/ffx2-bahamut.md`, `research/ffx2-vegnagun-shuyin.md` (§6, §9.1, §10.4), `research/ffx2-combat-core.md`, `research/visual-bible.md` §1.22.6, `research/ffx-bfa-yu-yevon.md`, `docs/handoff/art3-aeons.md`, `docs/target/approved-hashes.json`, `docs/target/targets.json` (read only), `public/art/characters/*/idle.json` sidecars, `src/data/encounters.ts` and `src/audio/tracks/index.ts` (read only).

---

## 11. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | FFX-2's aeon roster is the ten bodies in §0.3 | wiki Aeon page list + SinirothX bestiary index 164–173 | agree |
| 2 | Formation ids and locations | SinirothX formation table | Besaid / Kilika / Djose "Fayth - BOSS 229"; Farplane BOSS 227 Anima, 228 Sisters, 229 Shiva; Cavern BOSS 229 Yojimbo + Daigoro |
| 3 | Chapter 3 temple missions are compulsory | wiki Besaid, Kilika, Djose pages | all three say compulsory |
| 4 | Road order Shiva → Sisters → Anima | wiki Farplane, FFExodus, GamerGuides | agree |
| 5 | HP of all nine story aeon bodies | SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity | agree on every value |
| 6 | Shiva and Anima AI | SinirothX vs wiki AI dumps | identical |
| 7 | Magus Sisters AI and the Delta Attack condition | SinirothX vs wiki (three pages) | identical; the condition also in GamerGuides and Split_Infinity |
| 8 | Ifrit AI | SinirothX vs wiki AI dump | identical |
| 9 | Valefor thresholds | SinirothX 30 / 60 / 100 at +5 vs wiki 6 / 12 / 20 counts | same values |
| 10 | FFX-2 Yojimbo action counter (+8, bands, Zanmato at 100) | SinirothX vs wiki | identical; closes `ffx-yojimbo.md` Y-8 |
| 11 | Elements | SinirothX vs wiki vs guides | agree except F-5 (two Overdrive elements) and Anima's Gravity (immune vs absorb) |
| 12 | Music "Aeons" in aeon battles | wiki OST page | single source |
| 13 | Shiva approved; Anima not hash-recorded; Sisters unpainted | `approved-hashes.json`, `public/art/characters/` listing | as §8 |
