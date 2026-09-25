# FINAL FANTASY X-2 — Gippal in the Den of Woe: the encounter, the gauntlet around it, and which fight is the chapter

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24 ~21:50 EDT: "I'll also add Isaaru's contest of aeons at Beville and Gippal, in the Den of Woe as two additional chapters in addition to the ones I selected already". This file covers the Gippal half. Isaaru at Bevelle is a separate FFX research file.
**Research date:** 2026-09-24
**Game case (AGENTS.md rule 14):** **FFX-2 only.** Every number here is FFX-2 data (ATB, dresspheres, Blue Bullets). Nothing transfers to FFX. The Crimson Squad backstory happens during FFX's Operation Mi'ihen, but it is told only in FFX-2 and no FFX fight comes from it.
**Supersedes** the wiki-only first pass committed in 4d7230f6 (same request). Everything in it is kept and now cross-checked against a second source. Its option letters were A = Gippal alone, B = all five fights, C = a Gippal-centred middle stretch. The letters below differ: A = alone, B = the three shades, C = all five.
**Recommendation (§1.3):** **Candidate B: the three shades, Baralai → Gippal → Nooj, back to back with HP carried over, Gippal in the middle.** That is how the game stages him. If Bailey wants exactly what he named, Candidate A (Gippal alone) is fully sourced and small. Neither is built until Bailey says yes (rules 9 and 10).

---

## 0. Corrections to the brief

These change what the chapter is. Each is sourced in the sections below.

| # | The brief assumed | What the sources say | Sources |
|---|---|---|---|
| C-1 | The Den of Woe is "in the Djose area" | It is a **sealed cave under Mushroom Rock Road**, entered from the bottom of the ravine. The Japanese name is literally "Mushroom Rock Road: Sealed Cave", and the game's formation table calls it "Sealed Cave". Djose Temple is the Machine Faction's headquarters, where Gippal is met in the story and where he is captured for the Creature Creator after the Den. | wiki *Den of Woe*, *Mushroom Rock Road*, *Crimson Squad*; SinirothX formation table; GamerGuides; FFExodus `[verified: 4 sources]` |
| C-2 | A chapter-3-style story fight | **Chapter 5, optional** (a bonus dungeon). The door opens only with all **ten Crimson Spheres**; three of them are missable, and two sit in the Via Infinito, which opens in Chapter 5. | wiki *Den of Woe*, *Crimson Sphere*; FFExodus; GamerGuides `[verified: 3 sources]` |
| C-3 | The player fights Gippal | The player fights **an illusion of Gippal** made of pyreflies: his **anger** from the massacre two years earlier, fused with pyreflies. The real Gippal is not in the Den. | scan text in SinirothX and wiki `[verified: 2 sources]`; wiki *Den of Woe*, *Gippal*; FFExodus diary |
| C-4 | Gippal might be the chapter's centrepiece | Gippal is the **fourth of five bosses fought without a break**: possessed Rikku, possessed Paine, then the shades of Baralai, **Gippal**, and **Nooj**. Nooj is last and the hardest (23,800 HP, Lightfall for 5,000 to all). Gippal is fought alone, as one body. | wiki *Den of Woe* and the five boss pages; Split_Infinity G0631–G0635; FFExodus; GamerGuides `[verified: 4 sources]` |
| C-5 | Gippal "drops" Mortar | Mortar is a **Gun Mage Blue Bullet**, learned by being hit by it. Gippal is its only source (plus his Fiend Arena version in International / HD). He uses Mortar **only below 1/3 HP**, and then at 1/5 odds per turn, so learning it means getting him low with a Gun Mage in his firing arc. His actual drop is **Kaiser Knuckles**. | SinirothX (Gippal AI; Blue Bullet table), wiki *Blue Bullet* and *Gippal (boss)*, `ffx2-combat-core.md` §"Blue Bullets" `[verified: 2 sources]` for the source and the trigger |

---

## 0.1 Provenance, method, and how to read this document

### Confidence tags

Same tags as `research/ffx2-fallen-aeons.md` §0.1.

| Tag | Meaning |
|---|---|
| `[SinirothX]` | SinirothX, *Enemy Encyclopedia* (GameFAQs FAQ 31807): a stat, attack and AI dump hacked from the game data. Ranked first for FFX-2 in this repo (`ffx2-vegnagun-shuyin.md`, "Primary data source ranking"). |
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say the same thing. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from sourced constants. |
| `[estimate]` | My own judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §9 with what to do. |

### What I did

1. Read `research/ffx2-fallen-aeons.md` (structure), `research/ffx2-combat-core.md` (Blue Bullets, Mortar row), `research/ffx2-vegnagun-shuyin.md` §6 and §9 (Chapter 5 party, Nooj / Gippal / Baralai beats), `research/visual-bible.md` §1.23.5 (Gippal's look), `research/writing-bible.md` §1.20 (Gippal's voice), `docs/target/decisions.json` D-043 (Nooj portrait), and the `public/art/characters/` listing. Nothing in `src/`, `public/art` or `docs/target` was changed.
2. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext` with a browser user agent (plain pages return HTTP 402). Titles and revision ids are in Sources.
3. Read, into memory only, SinirothX's *Enemy Encyclopedia* and Split_Infinity's *Boss Guide* on GameFAQs, FFExodus's Chapter 5 Mushroom Rock Road page (walkthrough43), and GamerGuides' HD walkthrough page "The Den of Woe". Scratch lived under `D:/Tools/pyrefly-scratch/gippal/` and was not added to the repo. No downloads.
4. Cross-checked every stat block against the other sources and wrote each disagreement down (§9).

---

## 1. The answer: what the Den of Woe offers, and which fight is the chapter

### 1.1 The Den in one paragraph

Two years before FFX-2, on the day of Operation Mi'ihen, Maester Kinoc sent the Crimson Squad candidates into a cave under Mushroom Rock Road as their "final test". His real aim was to investigate rumours of a giant machina there (it was Vegnagun, projected by Shuyin). Shuyin's despair, held in the cave's pyreflies, possessed the candidates and they killed one another. Only Nooj, Baralai, Gippal and their sphere recorder Paine got out. Kinoc then ordered them killed and the cave sealed `[single source: wiki Den of Woe, Crimson Squad, Crimson Sphere pages, all citing Final Fantasy X-2 Ultimania Omega p. 080]`. In Chapter 5 the Gullwings open the seal with Paine's ten Crimson Sphere recordings. The pyreflies show Yuna Shuyin's memory of Vegnagun and of Lenne's death, possess Rikku and Paine, and then raise shades of the three men `[verified: 3 sources: wiki, FFExodus diary, GamerGuides]`.

### 1.2 The candidates at a glance

| | A. Gippal alone | **B. The three shades** (Baralai → Gippal → Nooj) | C. The whole Den (5 fights) |
|---|---|---|---|
| Fights | 1 | 3 back to back, full party, no rest | 2 solo duels as Yuna (possessed Rikku, possessed Paine), then B |
| HP | 14,800 | 12,220 / 14,800 / 23,800 | 7,800 / 9,200, then B |
| What it teaches | A fixed five-step cycle that breaks into a random, harder set below 1/3 HP; Bullseye (9/16 of current HP to everyone in a 140° arc); Mortar as a learnable Blue Bullet | Three different shapes: Baralai punishes magic (Looming Glacier, Silence, Absorb) and counts hits to Drill Shot; Gippal as in A; Nooj is attrition with one 5,000-damage Lightfall near the end. Resource management across the three. | B plus a solo phase where Yuna fights her own friends |
| Story | Loses its context: in the game he is one of three shades raised together | **The shades are one idea:** sorrow (Baralai), anger (Gippal), despair (Nooj), each "fused with pyreflies" `[verified: 2 sources: scan texts]` | The fullest version, and the emotional core (Yuna vs Rikku and Paine, "Yuna's Ballad") |
| Data quality | **Complete.** SinirothX full block and AI; wiki stats; three guides agree on HP and behaviour | Complete for all three. Baralai AI in SinirothX and wiki (agree except one weight); Nooj AI in SinirothX, Split_Infinity and wiki (agree except the Lightfall trigger, §9 G-2) | Complete. Rikku has an AI dump in two sources; Paine has one attack |
| New engine needs | Arc targeting (or a documented all-party simplification), HP-threshold AI switch, Blue Bullet learning if Mortar is to be taught | A + HP-carrying gauntlet (the Road chapter already plans one, `src/data/ffx2/enemies/fallen-aeons-road.ts` FA3), hit counter → Drill Shot, once-only HP trigger | B + a one-member party and possessed party members as enemies |
| Art on disk | Nothing for Gippal | Nooj: speaker portrait picked (D-043, portrait only); Gippal and Baralai: nothing | B + Rikku and Paine dressphere paintings exist (possessed variants would be derived); Shuyin and Lenne paintings exist for the vision |

### 1.3 Recommendation: Candidate B, Gippal as the middle link

`[estimate]`; each reason is sourced.

1. **It is how the game stages him.** Gippal is second-to-last of a chain fought "without a break in between" (wiki), with Nooj "fought directly after" (wiki *Gippal (boss)*; Split_Infinity: "final bout, which will commence shortly"). Taking Gippal alone cuts the thread.
2. **The three are one idea and one arena.** Sorrow, anger, despair; the same shades that appear in the ending as three whole men (`ffx2-vegnagun-shuyin.md` §9, beats 18, 25, 29). A chapter of the three prepares that ending without overlapping it.
3. **Three different puzzles, not one.** Baralai drains MP and counts hits; Gippal rotates a readable pattern until low HP; Nooj forces a 5,000-HP floor once. All three guides converge on the same answer (Dark Knights on Darkness plus a healer, §5), which suits a chapter that builds a plan across links.
4. **The data is as strong as the fallen-aeons chapter:** every block from SinirothX, confirmed by the wiki and three walkthroughs on HP, EXP, gil and items.
5. **Gippal stays the named star:** he is the only source of Mortar, and the middle link is where the chapter can teach it.

**If Bailey wants one fight,** Candidate A is complete and small. **Candidate C** (solo Yuna duels first) is the most faithful and the most moving, but it needs a one-member party and possessed Rikku / Paine as enemies; show it as an option, do not assume it.

**Open design questions for Bailey (not decided here):** whether HP and status carry between links (faithful: yes; §2), whether the chapter includes the solo duels (C), and whether Mortar is actually learnable in our build (it is a party-side ability; see §10).

---

## 2. Where, when, and the shape of the gauntlet

- **Where:** a hidden cave in the Mushroom Rock Ravine, below Mushroom Rock Road; entered at the bottom of the ravine going north `[verified: 3 sources: wiki Den of Woe and Mushroom Rock Road, GamerGuides, FFExodus]`.
- **When:** Chapter 5, optional. The door needs all ten Crimson Spheres `[verified: 3 sources]`. Sphere 9 (Ormi and Logos, Chapter 1) and sphere 7 (Nooj, outside the Den, Chapter 2) are missable if the Den is not visited in those chapters; sphere 5 (Leblanc on the *Celsius*, Chapter 4) is missable too; spheres 6 and 8 are in the Via Infinito (Cloister 0 and after Aranea at Cloister 20) `[single source: wiki Crimson Sphere]`. So the Den can open only in Chapter 5 `[derived]`, after at least 20 floors of the Via Infinito `[derived; GamerGuides says the same in passing]`.
- **Inside:** a linear path with two forks to a rectangular clearing at the centre `[single source: GamerGuides]`. Random encounters are always Crimson Shadows (1, 2 or 3) `[verified: 2 sources: wiki, SinirothX formation table]`.
- **At the centre:** the pyreflies swarm; Shuyin's vision; then five bosses in this order **without a break**: Rikku, Paine, Baralai, **Gippal**, Nooj `[verified: 4 sources: wiki, Split_Infinity, FFExodus, GamerGuides]`.
- **Who fights (original PS2):** **Yuna alone** against Rikku and Paine; Rikku and Paine join her for the last three `[verified: 3 sources: wiki, GamerGuides, Split_Infinity ("Now that you can command all girls")]`. In International / HD, hired fiends change who fights (wiki); not relevant to us.
- **HP between links:** carried over (no break, and every guide advises healing before the finishing blow on Gippal because Nooj follows at once) `[verified: 2 sources: wiki Gippal (boss), Split_Infinity]`.
- **Formations** `[SinirothX]`: `Sealed Cave - BOSS 228 Rikku`, `229 Paine`, `227 Baralai`, `226 Gippal`, `225 Nooj`. Each lists extra `Weapon[..]` entries (Gippal: two). They are almost certainly the bosses' weapon props, not targets `[estimate]`; no guide mentions a second target, and the wiki and all three guides treat every fight as one enemy.
- **Rewards:** the **Supreme Light** Garment Grid for clearing all five `[verified: 2 sources: wiki Garment Grid ("Chapter 5 - Den of Woe: Defeat all bosses"), GamerGuides]`; an Episode Complete for Mushroom Rock `[verified: 2 sources: wiki, FFExodus]`. Finishing without skipping scenes lets the Creature Creator capture Baralai in Bevelle, Gippal at Djose Temple and Nooj at Mushroom Rock Road `[single source: wiki]`.

---

## 3. Stat blocks

Common facts: all five are Gravity-immune; none can be bribed where the wiki lists Bribe; "Cannot escape" on the three shades (wiki). Accuracy 0 is a real FFX-2 value, not missing data (`ffx2-bahamut.md` §1.1). SinirothX also prints **Oversoul** values for each; Oversoul cannot trigger in a one-off boss fight and no guide mentions it, so they are left out. **Do not mix in the Fiend Arena versions** (International / HD, Youth League Tournament): Gippal there is Lv 72 with 134,700 HP, Baralai 125,000, Nooj 178,000, each with different AI (wiki; SinirothX "Colosseum" entries). They are postgame arena data with no story.

### 3.1 Gippal (shade), bestiary #241

| Field | Value | Confidence |
|---|---:|---|
| Level | 56 | SinirothX + wiki `[verified: 2 sources]` |
| **HP** | **14,800** | SinirothX, wiki, Split_Infinity, FFExodus, GamerGuides `[verified: 5 sources]` |
| MP | 235 | SinirothX, wiki, Split_Infinity, FFExodus, GamerGuides `[verified: 5 sources]` |
| STR / MAG / DEF / MDEF | 73 / 55 / 68 / 33 | SinirothX + wiki `[verified: 2 sources]` |
| Agility / Evasion / Luck / Accuracy | 118 / 23 / 6 / 0 | SinirothX + wiki (wiki omits Accuracy) |
| EXP / AP / Gil / Pilfer gil | 1,200 / 5 / 5,000 / 15,000 | SinirothX, wiki, FFExodus; Split_Infinity and GamerGuides for EXP / AP / gil `[verified: 3 sources]` |
| Elements | all neutral; Gravity immune | SinirothX, wiki, Split_Infinity, GamerGuides |
| Immune | Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, **Slow**, Stop, Doom, Delay, Interrupt, fractional damage | SinirothX + wiki + Split_Infinity `[verified: 3 sources]`, except **fractional damage**: the wiki infobox has no fractional row (it lists "multi attack"), so fractional rests on SinirothX + Split_Infinity (`%DMG`) `[verified: 2 sources]` (corrected 2026-09-24, plan review item 4). The **Breaks are not on the list**, so they land `[derived]`. |
| Zantetsu resistance | 160 | SinirothX + wiki |
| Drop / rare drop | **Kaiser Knuckles** / Kaiser Knuckles | SinirothX, wiki, Split_Infinity, GamerGuides; FFExodus prints Magical Dances Vol. 1 `[conflict]` §9 G-4 |
| Steal | White Lore (both), steal rate 128 | SinirothX + wiki + Split_Infinity + FFExodus |
| Scan | His anger at meeting Shuyin's despair two years ago, fused with pyreflies (paraphrase) | SinirothX + wiki |
| Blue Bullet | **Mortar** (the only source outside his Fiend Arena version) | SinirothX Blue Bullet table + wiki `[verified: 2 sources]` |

### 3.2 The rest of the Den

| Field | **Rikku** (#237) | **Paine** (#238) | **Baralai** shade (#240) | **Nooj** shade (#242) | Crimson Shadow (#212) |
|---|---:|---:|---:|---:|---:|
| Level | 53 | 58 | 52 | 63 | 36 |
| **HP** | **7,800** | **9,200** | **12,220** | **23,800** | 2,020 |
| MP | 92 | 55 | 720 | 720 | 114 |
| STR / MAG | 42 / 39 | 56 / 16 | 68 / 67 | 75 / 101 | 44 / 42 |
| DEF / MDEF | 31 / 82 | 70 / 7 | 67 / 26 | **144 / 103** | 62 / 10 |
| Agility | 82 | 51 | 112 | 121 | 52 |
| Evasion / Luck | 18 / 12 | 0 / 10 | 12 / 6 | 0 / 8 | 0 (SinirothX) or 13 (wiki) / 2 |
| EXP / AP | 800 / 3 | 800 / 3 | 1,200 / 5 | 1,800 / 10 | 340 / 1 |
| Gil / Pilfer gil | 200 / 300 | 200 / 300 | 200 / 300 | **30,000** / 20,000 | 30 / 200 |
| Extra immunities (beyond Gravity, Death, Petrify, Silence, Poison, Curse, Eject, Stop, Doom, Delay, Interrupt, fractional) | none: **Sleep, Darkness, Confuse, Berserk, Slow land** | same as Rikku | + Sleep, Darkness, Confuse, Berserk, Slow | + Sleep, Darkness, Confuse, Berserk, Slow | Stop, Sleep, Darkness, Confuse, Berserk; not Slow |
| Zantetsu | 80 | 80 | 160 | 200 | 0 |
| Drop | Black Lore | Champion Belt | Crystal Ball | Magical Dances Vol. 1 | Hi-Potion (rare ×2) |
| Steal | Bushido Lore | Sword Lore | Nature's Lore | Arcane Lore | Phoenix Down (rare ×2) |
| Scan | believes Yuna is an armed guard holding her at gunpoint | same text | his **sorrow** fused with pyreflies | his **despair** fused with pyreflies | an echo of the candidates' fear, transcribed by pyreflies |

Sources: every cell is SinirothX + wiki `[verified: 2 sources]`; HP, MP, EXP, AP and gil also match Split_Infinity, FFExodus and GamerGuides `[verified: 5 sources]` except the conflicts in §9 (Baralai HP typo on the wiki, G-1; Nooj gil, G-3; minor guide typos G-6). Paine's evasion is blank on the wiki; SinirothX prints 0.

---

## 4. Actions and AI

Damage constants (DC) are `[SinirothX]`; the damage formulas are in `research/ffx2-combat-core.md`. The guides' observed damage depends on the writer's party; do not ship it as data (§9 G-8).

### 4.1 Gippal

| Action | Effect | DC / type | Sources |
|---|---|---|---|
| Normal Attack (a kick, per Split_Infinity) | one target, physical | 16 | SinirothX; Split_Infinity about 300 observed |
| **Grinder** | one target, physical, **ignores Defense** | 14 | SinirothX, wiki, Split_Infinity, GamerGuides `[verified: 3 sources]`; wiki 509–574 observed |
| **Bullseye** | every character in a **140° arc in front of him** loses **9/16 of current HP**; cannot kill | fractional | SinirothX, wiki (arc and 9/16), GamerGuides, Split_Infinity (56.25 %) `[verified: 4 sources]` |
| **Mortar** | every character in the 140° arc, physical, **ignores Defense** | 22 | SinirothX + wiki `[verified: 2 sources]`; wiki 800–904 observed |
| Potion Plus | restores 600 HP to himself | constant | SinirothX, wiki, GamerGuides, Split_Infinity |
| Flash Bomb | all characters, 46–52 damage, Darkness (chance 50) | randomized constant | SinirothX + wiki `[verified: 2 sources]` |
| Hush Grenade | all characters, 46–52 damage, Silence (chance 50) | randomized constant | SinirothX + wiki `[verified: 2 sources]` |

**AI** `[verified: 2 sources for the cycle: SinirothX, Split_Infinity; the low-HP set: SinirothX, with FFExodus and the wiki describing the same shift in prose]`:

```
HP >= 1/3 max:
  15/16  Action 1 = next step of the cycle:
         Grinder -> Normal Attack -> Grinder -> Normal Attack -> Bullseye -> (repeat)
  1/32   Flash Bomb
  1/32   Hush Grenade
HP < 1/3 max (below 4,934 of 14,800 [derived]):
  1/5 each  Normal Attack, Bullseye, Grinder, Mortar
  1/15 each Potion Plus, Flash Bomb, Hush Grenade
No counterattacks, no action counter.
```

The wiki page has no AI dump for Gippal; its prose matches. FFExodus's "below 5,000 HP every attack he does is devastating" fits the 1/3 line `[derived: 14,800 / 3 = 4,933]`. Split_Infinity says Mortar starts **below 75 %** `[conflict]` §9 G-2.

`[derived]` design facts: Bullseye cannot kill; the cycle is readable (Split_Infinity: heal after the second kick is wasted before a Bullseye); the danger arrives with the low-HP set, where Mortar and Bullseye together are 2 in 5 turns.

### 4.2 Baralai (shade)

Actions `[SinirothX + wiki]`: Normal Attack (DC 16); Triple Attack (3 random hits, DC 12 each); **Glint** (everyone within 5 m of him, or one character if none is in range, physical, DC 20); **Looming Glacier** (one character's MP to 0 and Stop); **Drill Shot** (one character loses 3/4 of max HP); Absorb (3/16 of current HP and MP); Not-So-Mighty Guard (Protect, Shell, Regen on himself); Silence (one or all characters, chance 75); Regen (40 MP).

```
Cycle: (1) Normal Attack  (2) Glint  (3) Triple Attack (Normal Attack if one character is left)
       (4) Looming Glacier on the highest-MP character not in Stop (else highest MP)
       (5) Silence on all characters if MP >= 20, else Absorb on the highest-MP character
       (6) repeat
HP < 1/3 max: 1/4 chance of: if he has Regen -> Not-So-Mighty Guard;
              else Regen (Absorb on the highest-MP character if MP <= 59)
Counter: +1 when hit or when his HP changes; at 8, reset and Drill Shot the last attacker
```

`[verified: 2 sources: SinirothX, wiki AI dump]`. Small differences: the wiki puts a further 1/4 on Not-So-Mighty Guard; SinirothX prints "Reflected" there and flags it himself as a likely typo for Regen. Drill Shot at **8 hits** in both; Split_Infinity and GamerGuides say 10, which is the Bevelle fight's number `[conflict]` §9 G-5.

### 4.3 Nooj (shade)

Actions `[SinirothX]`: Normal Attack 1 (one character, physical, DC 16); Normal Attack 2 (one character, **magic that ignores Magic Defense**, DC 20; the wiki names it **Rippling Chroma**, Split_Infinity calls it a floor shot); **Greedy Aura** (every character loses 3/16 of **max** HP and MP); **Lightfall** (5,000 damage to every character, constant, can break the damage limit).

```
Cycle: Attack 1 -> Attack 1 -> Attack 2 -> Attack 1 -> Greedy Aura -> repeat
HP <= 2,999: Lightfall (once per fight)
```

Cycle `[verified: 3 sources: SinirothX, Split_Infinity, wiki ("every five turns")]`. Lightfall trigger `[conflict]` §9 G-2. Whether Greedy Aura heals him: the wiki says it "damages and drains"; SinirothX types it as damage only `[conflict, minor]`.

### 4.4 Rikku and Paine (possessed), and the Crimson Shadow

- **Rikku** `[verified: 2 sources: SinirothX, wiki AI dump]`: Normal Attack is **two hits** (DC 16 ×2). Basic: 1/3 Normal Attack, 2/9 Grenade (187–211 to all), 1/9 each Bomb Core (Fire), Arctic Wind (Ice), Lightning Marble, Dragon Scale (Water), each 281–317 to one character, constant damage. Under Confuse she uses the weak versions (18–21 and 75–84).
- **Paine** `[verified: 2 sources: SinirothX, wiki]`: one attack, a sword strike (DC 16) that does not stagger; a second version only under Berserk.
- **Crimson Shadow** `[verified: 2 sources]`: Normal Attack only (DC 16).

---

## 5. The party and builds at that point

- **Party:** Yuna, Rikku, Paine with Chapter 5 dresspheres and grids. No source gives a player level for the Den. The Den opens only after at least 20 Via Infinito floors (§2), so the Chapter 5 preset in `ffx2-vegnagun-shuyin.md` §6 (Lv 45–52, itself `[estimate]`) is the floor; the bosses are Lv 52–63. Do not invent a separate level; if the chapter needs one, it is an `[estimate]` to put to Bailey.
- **What the sources bring:**
  - **Two Dark Knights on Darkness plus a healer** (White Mage with Curaga, or Alchemist) for Baralai, Gippal and Nooj: Split_Infinity, GamerGuides, wiki (Nooj), FFExodus (Baralai, Gippal) `[verified: 4 sources]`. Darkness ignores Defense and cannot be blinded or silenced out.
  - **Protect first:** Light Curtain (wiki) or the Gun Mage's Mighty Guard (GamerGuides) against Grinder, Mortar and Baralai's staff.
  - **Baralai:** avoid relying on MP (Looming Glacier, Silence, Absorb); Split_Infinity steals his MP as a Thief to stop Regen and the Guard.
  - **Nooj:** more than 5,000 max HP on everyone before Lightfall, or Invincible from a Dark Matter mix (wiki, GamerGuides); an Alchemist because Greedy Aura drains MP; FFExodus recommends the Machina Maw or Full Throttle specials.
  - **Solo duels (C):** White Mage on Yuna's grid for Protect, Warrior Breaks, or Dark Knight (GamerGuides); Sleep, Slow, Confuse and Berserk all land on Rikku and Paine (Split_Infinity; confirmed by the immunity lists).
- **Hit rule:** FFX-2's accuracy model applies (`ffx2-combat-core.md`). Gippal's evasion 23 and Rikku's 18 are the only places physical misses matter; GamerGuides notes Yuna missing Rikku often.

---

## 6. Arena, beats, and music

### 6.1 Arena

- A pyrefly-filled cave under the ravine: a linear tunnel with two forks, then a **rectangular clearing** at the centre where the bosses are fought `[single source: GamerGuides]`. The wiki gallery has captioned stills (the entrance, the Den, the three shades, YRP turned on each other, possessed Rikku attacking Yuna); images not fetched.
- **No scene in `src/scenes/` fits.** This is a new arena and needs end-state options first (rule 9).

### 6.2 Beat sheet (paraphrased; our own dialogue gets written separately)

| # | Beat | Source |
|---|---|---|
| 1 | Ten Crimson Spheres open the sealed door in the ravine; Paine warns it is dangerous. | FFExodus diary; wiki |
| 2 | The tunnel; Crimson Shadows, echoes of the candidates who died here. | wiki; SinirothX scan |
| 3 | At the centre the pyreflies swarm the party and show Shuyin's memory: his attempt on Vegnagun and his and Lenne's death. | wiki Den of Woe and Shuyin |
| 4 | Rikku and Paine are possessed and turn on Yuna, who fights them alone ("Yuna's Ballad"). Their scan: each thinks Yuna is a guard holding her at gunpoint. | wiki; SinirothX / wiki scan; Split_Infinity; GamerGuides |
| 5 | Freed, Rikku and Paine rejoin; the pyreflies raise shades of Baralai, Gippal and Nooj. | wiki; FFExodus diary |
| 6 | Baralai, then **Gippal**, then Nooj, back to back. | four sources, §2 |
| 7 | The three escape; they conclude that Shuyin's feelings caused the Crimson Squad deaths. Paine promises to save Baralai from Shuyin. | wiki Shuyin, Mushroom Rock Road |

### 6.3 Music

- **"The Crimson Squad"** (3:05): the Den of Woe's location theme and the Crimson Sphere recordings `[single source: wiki OST, Den of Woe, Crimson Squad pages]`.
- **"Nightmare in the Den"** (1:20): Shuyin's spectral assault / vision `[single source: wiki OST, Den of Woe]`.
- **"Yuna's Ballad"**: the Rikku and Paine duels `[single source: wiki Den of Woe]`.
- **"Shuyin's Theme"** (3:41): also listed as playing at the Den `[single source: wiki OST, Shuyin]`.
- **The battle theme for Baralai, Gippal and Nooj is not in any source I read.** Do not guess it; our game uses original cues anyway, and which cue this chapter gets is Bailey's call by ear (rule 13).

---

## 7. Art: what exists and what is new

Nothing was generated for this file.

| Subject | On disk | For the chapter |
|---|---|---|
| **Gippal** | nothing | **New.** Look in `visual-bible.md` §1.23.5 (Al Bhed, green spiral-pupil eyes, patch over the **right** eye, short spiky blond hair, armour over a blue jumpsuit, purple overalls, indigo boots, a large machina mortar with a rounded saw blade) `[single source: wiki]`. A **shade** treatment on top of it is a house choice to show Bailey, not canon; no source I read describes how the illusions look in-game. |
| **Baralai** | nothing | New (B and C). |
| **Nooj** | speaker portrait option C picked (D-043); no battle billboard | New battle billboard (B and C), derived from the approved portrait's identity. |
| Rikku, Paine | party dressphere paintings (`rikku-*`, `paine-*`) | Only for C: possessed enemy variants, derived from the approved pixels (the house method in `docs/plans/art-method-r3/METHOD-CHECK.md`), facing the enemy side. |
| Shuyin, Lenne | painted | The vision (beat 3). |
| Crimson Shadow | nothing | Only if the chapter includes the tunnel. |
| The Den of Woe | nothing | New arena. |

---

## 8. Relationship to the other chapters

- **Trema** (the other new FFX-2 chapter, `research/ffx2-trema.md`) is next to Nooj in the bestiary and nothing more; no overlap.
- **Our Chapter 5 (Vegnagun, Shuyin)** uses Nooj, Gippal and Baralai as people in the finale. This chapter is their shades earlier in the same chapter of the game; the ending's reunion (beats 18, 25) gains from it.
- **The Road to the Farplane chapter** (`ffx2-fallen-aeons.md`) already plans the HP-carrying gauntlet (FA3) this chapter would reuse.

---

## 9. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| **G-1** | **Baralai shade HP:** SinirothX, Split_Infinity, FFExodus and GamerGuides print **12,220**; the wiki infobox prints 1,220. | A dropped digit on the wiki. Use **12,220** `[verified: 4 sources]`. |
| **G-2** | **Low-HP triggers.** Gippal's Mortar: below **1/3 HP** (SinirothX; FFExodus's "below 5,000") vs below 75 % (Split_Infinity). Nooj's Lightfall: at **2,999 HP or less** (SinirothX, wiki, FFExodus) vs when crossing 75 % (Split_Infinity, GamerGuides: "17,850"). | Use the data dump's lines, 1/3 and 2,999, and tag them. **The conflict is weaker than first stated** (plan review item 8, 2026-09-24): Split_Infinity's wording is ambiguous (for Baralai's Guard he writes "lose more than 75 % HP", which is SinirothX's below-1/3 region), so only GamerGuides' 17,850 reads 75 % literally. The dump's values stand, with two to three sources each. If Bailey wants certainty, it is a PCSX2 check (the reference setup exists). |
| G-3 | Nooj's gil: 30,000 (SinirothX, Split_Infinity, FFExodus, GamerGuides) vs 3,000 (wiki). | Use 30,000. Matters only if the results screen shows gil. |
| G-4 | Gippal's drop: Kaiser Knuckles (SinirothX, wiki, Split_Infinity, GamerGuides) vs Magical Dances Vol. 1 (FFExodus, the same as Nooj's). | Use Kaiser Knuckles; FFExodus looks like a copy error. |
| G-5 | Baralai shade's Drill Shot count: 8 (SinirothX, wiki) vs 10 (Split_Infinity, GamerGuides). | Use 8; the guides repeat the Bevelle number. |
| G-6 | Guide typos: Rikku pilfer gil 3,000 (FFExodus; 300 elsewhere), Rikku AP 23 (GamerGuides; 3 elsewhere), GamerGuides lists Nooj's steal and drop swapped and says Greedy Aura is 3/8. | Ignore; the dump and the wiki agree. |
| G-7 | Greedy Aura: damage only (SinirothX) or a drain that heals Nooj (wiki). | Open, minor. Build damage only and tag it until checked. |
| G-8 | Observed damage figures (Grinder about 500, Mortar about 800–900, Nooj's magic shot about 1,400–1,600). | Party-dependent. Compute from the DCs with `ffx2-combat-core.md` once the preset exists. |
| G-9 | **Arc and radius targeting** (Bullseye and Mortar hit a 140° arc in front of Gippal; Glint hits a 5 m radius). | Our FFX-2 engine has no positions I could find. Either build positions or simplify to "all characters" and write the simplification down as a deviation for Bailey. |
| G-10 | The `Weapon[..]` entries in the formations (§2). | `[estimate]`: weapon props. No source says they are targets. |
| G-11 | The battle music for the three shades. | Unsourced (§6.3). |
| G-12 | Party level at the Den. | Unsourced; `[estimate]` only (§5). |
| G-13 | How the shades look (tint, transparency). | Unsourced; a house choice to show Bailey (§7). |
| G-14 | The Ultimania backstory (Kinoc's motive, the same day as Operation Mi'ihen). | Wiki citing *Ultimania Omega* p. 080; I did not read the book. Treat as `[single source]`. |

---

## 10. Minimum mechanic list for Candidate B (FFX-2 only)

1. **An HP-carrying gauntlet of three links** (reuse the Road chapter's FA3 plan). Faithful: no rest and no save between links.
2. **HP-threshold AI switches:** Gippal's cycle to random set below 1/3; Nooj's one-time Lightfall at 2,999 HP; Baralai's below-1/3 Regen / Guard branch.
3. **A hit counter** on Baralai (+1 per hit or HP change, Drill Shot at 8 on the last attacker).
4. **Fractional and constant damage:** Bullseye 9/16 of current HP; Drill Shot 3/4 of max HP; Greedy Aura 3/16 of max HP and MP; Lightfall 5,000 flat, able to break the damage limit; Looming Glacier MP to 0 plus Stop.
5. **Defense-ignoring physical** (Grinder, Mortar) and **Magic-Defense-ignoring magic** (Nooj's second attack).
6. **Arc / radius targeting** or the documented simplification (§9 G-9).
7. **Mortar as a learnable Blue Bullet** only if Bailey wants the teach moment: `src/data/ffx2/abilities/gun-mage.ts` transcribes only some Blue Bullets, and I did not find learning-on-hit in the engine. Check before promising it.
8. **Before any of this is built:** end-state options to Bailey for the Den arena, Gippal, Baralai and Nooj as shades, the gauntlet rule, the chapter's scope (A, B or C), and the music cue (rules 9, 10 and 13).

---

## Sources

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext`, browser user agent; fetched 2026-09-24)

- Den of Woe, revid 3797694: https://finalfantasy.fandom.com/wiki/Den_of_Woe
- Gippal (boss), revid 3956604: https://finalfantasy.fandom.com/wiki/Gippal_(boss)
- Gippal, revid 3972827: https://finalfantasy.fandom.com/wiki/Gippal
- Rikku (boss), revid 3989551: https://finalfantasy.fandom.com/wiki/Rikku_(boss)
- Paine (boss), revid 3955526: https://finalfantasy.fandom.com/wiki/Paine_(boss)
- Baralai (boss), revid 3967145: https://finalfantasy.fandom.com/wiki/Baralai_(boss)
- Nooj (boss), revid 3956546: https://finalfantasy.fandom.com/wiki/Nooj_(boss)
- Crimson Shadow, revid 3918041: https://finalfantasy.fandom.com/wiki/Crimson_Shadow
- Crimson Sphere, revid 3739340: https://finalfantasy.fandom.com/wiki/Crimson_Sphere
- Crimson Squad, revid 3878641: https://finalfantasy.fandom.com/wiki/Crimson_Squad
- Blue Bullet, revid 3998597 (the title "Mortar (Final Fantasy X-2)" redirects here): https://finalfantasy.fandom.com/wiki/Blue_Bullet
- Final Fantasy X-2 enemy abilities, revid 3998493: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities
- Final Fantasy X-2: Original Soundtrack, revid 3984616: https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2:_Original_Soundtrack
- Mushroom Rock Road, revid 4034471: https://finalfantasy.fandom.com/wiki/Mushroom_Rock_Road
- Shuyin, revid 4044072: https://finalfantasy.fandom.com/wiki/Shuyin
- Garment Grid, revid 3998878 (Supreme Light row; "Supreme Light (Final Fantasy X-2)" redirects here): https://finalfantasy.fandom.com/wiki/Garment_Grid
- Final Fantasy X-2 accessories, revid 3940120 (Kaiser Knuckles row; the Kaiser Knuckles title redirects here): https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_accessories

**GameFAQs** (read into memory, 2026-09-24)

- SinirothX, *Final Fantasy X-2 Enemy Encyclopedia* (PS2), FAQ 31807: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807 — entries Rikku, Paine, Baralai, Baralai (Pyrefly Form), Gippal, Nooj, Crimson Shadow; the Blue Bullet source table; the formation table ("Sealed Cave" BOSS 225–229).
- Split_Infinity, *Final Fantasy X-2 Boss Guide* (PS2), FAQ 26832: https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26832 — sections G0631 (Rikku) to G0635 (Nooj).

**Walkthroughs**

- FFExodus, FFX-2 walkthrough, Chapter 5 Mushroom Rock Road (Den of Woe diary and boss boxes): http://www.ffexodus.com/ffx2/walkthrough43.php
- GamerGuides (Damir Kolar), *Final Fantasy X-2 HD Remaster* walkthrough, "The Den of Woe": https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/the-den-of-woe

**Local files consulted (read only):** `research/ffx2-fallen-aeons.md`, `research/ffx2-combat-core.md`, `research/ffx2-vegnagun-shuyin.md` (§6, §9), `research/visual-bible.md` §1.23.5, `research/writing-bible.md` §1.20, `research/ffx2-leblanc-syndicate.md` (Flash Bomb note), `docs/target/decisions.json` (D-043), `public/art/characters/` listing, `src/scenes/` listing, `src/data/ffx2/abilities/gun-mage.ts`, `src/data/ffx2/enemies/fallen-aeons-road.ts` (header only).

---

## 11. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | The Den is under Mushroom Rock Road, not Djose | wiki Den of Woe infobox (region, Japanese name), Mushroom Rock Road, Crimson Squad; SinirothX "Sealed Cave"; GamerGuides; FFExodus page title | agree |
| 2 | Chapter 5, optional, ten Crimson Spheres | wiki Den of Woe, Crimson Sphere; FFExodus; GamerGuides | agree |
| 3 | Order and no break: Rikku, Paine, Baralai, Gippal, Nooj | wiki; Split_Infinity index; FFExodus; GamerGuides | agree |
| 4 | Yuna alone for the first two | wiki; GamerGuides; Split_Infinity | agree |
| 5 | HP of all five bosses | SinirothX, wiki, Split_Infinity, FFExodus, GamerGuides | agree except the wiki's Baralai (G-1) |
| 6 | Gippal's AI cycle | SinirothX vs Split_Infinity | identical order |
| 7 | Gippal's low-HP set and Mortar trigger | SinirothX vs FFExodus vs Split_Infinity | 1/3 in two, 75 % in one (G-2) |
| 8 | Mortar only from Gippal; Blue Bullet; 99 MP | SinirothX Blue Bullet table; wiki Blue Bullet; `ffx2-combat-core.md` | agree |
| 9 | Baralai shade AI and the 8-hit Drill Shot | SinirothX vs wiki AI dump | agree (one weight differs, noted) |
| 10 | Nooj cycle and Lightfall | SinirothX, Split_Infinity, wiki | cycle agrees; trigger differs (G-2) |
| 11 | Supreme Light for clearing the Den | wiki Garment Grid, GamerGuides | agree |
| 12 | Music | wiki OST, Den of Woe, Crimson Squad, Shuyin | one wiki; the shades' battle theme unsourced |
| 13 | Art on disk | `public/art/characters/` listing, D-043 | Gippal and Baralai absent; Nooj portrait only |
