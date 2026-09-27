# FINAL FANTASY X-2 — Ixion at Djose Temple, the Chapter 3 finale, and Yuna's fall into the Farplane

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-27 ~11:00 EDT, "I'll go with all of your recommendations", accepting item 24 of the driver's list: start the research and concept frames for Sin (FFX) and Ixion at Djose (FFX-2). Decision D-252 in `docs/target/decisions.json`. The recommendation sheet is `docs/plans/next-content-2026-09-27.md` (Chapter B). This file is the Ixion half. Sin is FFX and is researched separately.
**Research date:** 2026-09-27
**Game case (AGENTS.md rule 14):** **FFX-2 only.** Everything here is FFX-2 data (ATB, dresspheres, Garment Grids, the fallen-aeon action counter). The FFX Ixion (Yuna's aeon, `ffx-combat-core.md` §6, shipped in the FFX chapters under D-089) shares the name, Aerospark and Thor's Hammer, and **nothing else**: different stats, different AI, different element on Thor's Hammer (§10 IX-2). Nothing here transfers to an FFX chapter.
**Recommendation (§1.3):** **One boss link, Ixion, followed by a scripted story close:** Ixion's last charge, Yuna's fall, the meeting with Shuyin in the Farplane Abyss, and the four whistles. The fight is short and well sourced; the scene is the reason to make the chapter. Nothing is built until Bailey picks from the options rounds (rules 9 and 10). Six questions for Bailey are in §9.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

The tags follow `research/ffx2-trema.md` §0.1 and `research/ffx2-fallen-aeons.md` §0.1.

| Tag | Meaning |
|---|---|
| `[SinirothX]` | SinirothX, *Enemy Encyclopedia* (GameFAQs FAQ 31807, v1.3): a stat, attack and AI dump taken from the game's data. The ranked first FFX-2 source in this repo. Its `<...>` brackets mark changes in the International version; **Ixion's entry has none**. |
| `[verified: N sources]` | N independent sources agree. The FF Wiki counts once, however many of its pages say it. **Split_Infinity (GameFAQs) and GamerGuides are the same author, Damir Kolar, so together they count once.** |
| `[single source]` | Only one source says it. |
| `[derived]` | I computed it from sourced constants. |
| `[estimate]` / **our estimate** | My own judgement, not a measured fact. "Our estimate" is the label Bailey asked for (D-214, 2026-09-25) when a GameFAQs reading is preferred but not confirmed by a second source. |
| `[conflict]` | The sources disagree. Listed again in §10 with what to do. |

**Source preference.** Bailey, 2026-09-25: "I especially like gamefaqs". Where sources conflict and nothing in-game settles it, this file recommends the GameFAQs reading and labels it **our estimate** until it is verified.

### 0.2 What I did

1. Read the repo first (read only): `docs/plans/next-content-2026-09-27.md`, `research/ffx2-fallen-aeons.md` (§7.1 already carries a short Ixion entry and conflict F-8), `research/ffx2-trema.md` (house format), `research/ffx2-combat-core.md` (§2 damage flowchart, §4.3 Garment Grids, Zantetsu formula), `research/ffx2-bahamut.md` §4 (dressphere ownership at the end of Chapter 2), `research/visual-bible.md` (Ixion's look), `src/battle/ffx2/ai/fallen-aeons.ts` (the shipped action counter), the `public/art` listings, `docs/target/approved-hashes.json` and `docs/target/decisions.json` (D-089, D-252).
2. Read **GameFAQs** with a headless Playwright script (Chromium, from node; no browser pane, no extension) into scratch on D: (`D:/Tools/pyrefly-scratch/ixion-djose/`): SinirothX 31807, Split_Infinity 26832 and 25872, Blackestmage 28684, bremen 26991, Paradisio 27115, nemes1ss 27786, KG21 27415, agent_0042 27214, Ryu_Kaze 42601, zero_six 28832. KeyBlade999 69206 (HD) stopped with HTTP 403 after page 4, before Chapter 3; it is not used.
3. Read the **FF Wiki** through `api.php?action=parse&prop=wikitext|revid` with a browser user agent. Titles and revision ids are under Sources.
4. Read **GamerGuides**' HD page for the Djose mission and **FFExodus**' Chapter 3 Djose and Chapter 4 Celsius diary pages with the same headless script.
5. Compared every stat, AI, reward and story field across the sources and wrote down each disagreement (§10). Nothing was saved in the repo except this file, and no file was downloaded into the project.

### 0.3 Which versions exist, and what changes for Ixion

| Version | Ixion changes | Source |
|---|---|---|
| **Original** (PS2, 2003–2004) | Base data. | SinirothX |
| **International + Last Mission** (PS2, Japan, 2004) | **No change to the story Ixion**: SinirothX's entry has no `<>` brackets. Adds a separate **Fiend Arena Ixion** (Lv 63, 56,000 HP), unlocked by finishing Machina Striker's fiend tale. | SinirothX (story and Colosseum entries); wiki *Ixion (Final Fantasy X-2)* `[verified: 2 sources]` |
| **HD Remaster** (2014 onward) | Built on International. Nothing Ixion-specific found. | wiki; GamerGuides HD |

**The Fiend Arena Ixion is a separate block (§3.2).** It has no story. Do not mix its numbers with the Djose fight.

---

## 1. The answer: where and when, what corrects the brief, what the chapter is

### 1.1 Where and when

- **Where:** Djose Temple, at the top of the Cloister of Trials. The temple is the Machine Faction's headquarters in FFX-2 `[verified: 3 sources — wiki Djose Temple and Machine Faction, Blackestmage, FFExodus]`. The formation is `Djose Temple - Fayth - BOSS 229 Ixion 1`, Chapter 3 `[SinirothX]`.
- **Which room, exactly, is a conflict** (§10 IX-4): the Chamber of the Fayth (Paradisio; GamerGuides "towards the Fayth"; SinirothX's formation zone "Fayth") or the antechamber in front of it, with the girls entering the Chamber only after the fight (Blackestmage). Every source agrees that the hole and Yuna's fall happen in the **Chamber of the Fayth**, where the fayth statue used to stand.
- **When:** the end of Chapter 3. The mission **"No Way Djose"** is compulsory and opens after "Protect Besaid Temple!" (Valefor) and "Pest Control" (Kilika, Ifrit) are done `[verified: 3 sources — wiki Djose Temple mission notes, ffx2-fallen-aeons.md §0.3, GamerGuides]`. Beating Ixion and watching the Farplane scene ends Chapter 3 `[verified: 5 sources — Split_Infinity 25872, Blackestmage, bremen, KG21, GamerGuides]`.
- **Why the temple needs the Gullwings:** with Gippal gone (he left after Baralai with Nooj; the Bevelle scene of Chapter 3), the Machine Faction cannot hold the temple `[verified: 2 sources — Blackestmage, wiki Djose Temple]`. Fiends pour out of the Chamber of the Fayth, and the temple's machina have fused with fiends `[verified: 2 sources — wiki Djose Temple, FFExodus]`. At first the Faction does not want the Gullwings' help, then relents, and an Al Bhed tells Rikku that Gippal is missing `[single source: wiki Djose Temple]`.

### 1.2 What corrects or sharpens the brief (`next-content-2026-09-27.md` Chapter B)

| # | The brief says | What the sources say | Status |
|---|---|---|---|
| C1 | "attack or Thundara twice, then Aerospark" | Correct: turns 1 and 2 are Normal Attack or Thundara on all, turn 3 is Aerospark, repeat. The split between Attack and Thundara is F-8. | `[verified: 2 sources]` for the shape; split in §4.3 |
| C2 | "Aerospark takes 5/8 of the target's current HP" | Correct. SinirothX calls it fractional and it can break the damage limit. | `[verified: 3 sources]` |
| C3 | "At 100 it Recharges (200 HP and 200 MP), and Thor's Hammer follows at once" | Recharge and Thor's Hammer are **two consecutive Ixion actions**: SinirothX "(1) Recharge; (2) go to zero and Thor's Hammer". Split_Infinity: heal as soon as you see Recharge, because the next attack is Thor's Hammer. So the party gets its ATB turns in between; how many depends on speed. | `[verified: 3 sources]`; the window's length is not published |
| C4 | "Thor's Hammer, which cannot be absorbed" | GameFAQs splits: SinirothX's data lists **Lightning**; Split_Infinity says **non-elemental**, "not lightning based". The wiki and GamerGuides say non-elemental. | `[conflict]` §10 IX-2 (was F-5) |
| C5 | "a machina-fused Ixion painting" | Only FFExodus says **Ixion himself** has fused with machina. The wiki and FFExodus both say the temple's **fiends** merged with the machina. | `[single source]` for Ixion; §6.2 |
| C6 | "Ixion's last charge knocks Yuna into the Farplane" | Right, and it happens **after** the battle is won: Ixion rises again and charges (or explodes in, depending on the source) while the girls look into the hole. | `[verified: 4 sources]`; one dissent (§10 IX-6) |

### 1.3 Recommendation: one link, then the story close

1. **The fight is one body with a clean, learnable tell.** The three-step cycle and the Recharge → Thor's Hammer warning are the whole lesson (brief: "You spend that warning turn getting ready"). A second link would dilute it, and the game has none: the only other fight on that visit is the random fiends and the pedestal-puzzle battles (Haunt, Pairika, Tomb) `[verified: 3 sources — Split_Infinity 25872, GamerGuides, SinirothX formations 040–043, EVENT 221–224]`, which are not boss content.
2. **The scene is the payload.** Yuna's fall, Shuyin mistaking her for Lenne, Baralai's reveal, the Crimson Spheres, "I'm all alone" and the four whistles are the best beat in FFX-2's Chapter 3 (brief). Every step is sourced by three or more guides (§7).
3. **The engine is nearly there.** The fallen-aeon action counter already ships in `src/battle/ffx2/ai/fallen-aeons.ts` (Chapter XI), including the FA8 switch for what "attacked" means (§4.4).
4. **Leave out** the Chapter 5 Djose content (the Experiment machina, `BOSS 225–229 Experiment`, Chapter 5) and the Fiend Arena Ixion. Neither is Ixion's story.

`[estimate]` for the recommendation as a whole; each reason above is sourced.

---

## 2. The shape of the chapter

| Step | What happens | Source |
|---|---|---|
| 0 | (Context only.) Earlier in Chapter 3, in the Bevelle Underground, Shuyin's spirit leaves Nooj and enters Baralai; Baralai drops into the hole where Vegnagun was, and Nooj and Gippal follow him. Crimson Sphere 1 is left on the floor. | Blackestmage, bremen, wiki Shuyin and Gippal `[verified: 3 sources]`. Whether the player must see it before Djose is not established; KG21 and bremen both do Bevelle first. |
| 1 | The Gullwings answer Djose's call; mission "No Way Djose" ("Eliminate the fiends that have appeared inside Djose Temple!"); the Al Bhed Primer is given. | Split_Infinity 25872, Blackestmage, bremen, Paradisio, GamerGuides, wiki `[verified: 5 sources]` |
| 2 | (Context only; not a link.) Through the temple: a lift, a jump over a pit of broken machina, five pedestals, one of which drops the lightning barrier (the others start fights). | Split_Infinity, Blackestmage, bremen, GamerGuides, FFExodus `[verified: 4 sources]` |
| 3 | Up the stairs: a short scene. Blackestmage: Ixion is attacking two Al Bhed, then turns on the girls. | Blackestmage `[single source]` for the Al Bhed; bremen and Split_Infinity "a quick scene" |
| 4 | **The link: Ixion.** Rikku opens with "This can't be happening." Music "Aeons". | §4; quote `[verified: 2 sources — SinirothX, agent_0042]`; music §6.3 |
| 5 | Mission complete: Unwavering Guard Garment Grid. | §3.1 rewards |
| 6 | The girls look into the hole where the fayth used to stand. Ixion rises and charges; Rikku and Paine leap aside and Yuna is thrown into the hole. | §7.1 |
| 7 | **The Farplane Abyss** (FMV, then a short controllable stretch): Shuyin, Lenne, Baralai, Nooj and Gippal, Crimson Spheres 2 and 3, "I'm all alone", the whistles. | §7.2 |
| 8 | Yuna wakes in the Bevelle Underground (Vegnagun's chamber). "Chapter 3 Complete". Chapter 4 opens on the Celsius. | §7.2 step 12 |

---

## 3. Stat blocks

### 3.1 Ixion, Djose Temple (story version; bestiary #180 on the wiki)

| Field | Value | Confidence |
|---|---:|---|
| Level | 28 | SinirothX + wiki `[verified: 2 sources]` |
| **HP** | **12,380** | SinirothX, wiki, Split_Infinity (and GamerGuides), bremen, Blackestmage, Paradisio, FFExodus, zero_six `[verified: 8 sources]` |
| MP | 9,999 | SinirothX, wiki, Split_Infinity, bremen, Paradisio, zero_six `[verified: 6 sources]` |
| STR / MAG / DEF / MDEF | 62 / 21 / 106 / 82 | SinirothX + wiki `[verified: 2 sources]` (the wiki's order is the same here; its Magic↔Defense swap appears only on the Fiend Arena block, §3.2) |
| Agility / Evasion / Luck / Accuracy | 138 / 35 / 4 / 0 | SinirothX + wiki (the wiki has no Accuracy field) `[verified: 2 sources]` |
| Thinking Period | 0 | SinirothX (undefined unit, as for every aeon; not implemented) |
| EXP / AP / Gil | 2,600 / 15 / 1,800 | SinirothX, wiki, Split_Infinity, bremen, FFExodus, zero_six, GamerGuides `[verified: 6 sources]` |
| Pilfer gil | 3,000 | SinirothX, wiki, bremen, FFExodus `[verified: 4 sources]`; zero_six 2,330 (IX-9) |
| Elements | **absorbs Lightning, weak to Water, immune to Gravity**; Fire, Ice, Holy neutral | SinirothX, wiki, Split_Infinity, zero_six, Paradisio, GamerGuides `[verified: 5 sources]` |
| Status immunities | Instant Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Stop, Doom, Delay, Interrupt, fractional damage; Zantetsu resistance 80; the wiki adds Bribe | SinirothX + wiki + Split_Infinity `[verified: 3 sources]` |
| **Not immune to** | **Slow and every Break** (Power, Magic, Armor, Mental, and the other stat downs) | Split_Infinity ("bust it up with all breaks... It can also be slowed down"), GamerGuides (opens with the four Breaks), Paradisio ("All but slow and stat downs"), SinirothX's list (neither is on it) `[verified: 4 sources]` |
| Auto-status | none | SinirothX (no line); the "Spellspring" line just above it belongs to Ifrit |
| Drop / rare drop | Soul of Thamasa / Soul of Thamasa (100 %) | SinirothX, wiki, Split_Infinity, bremen, FFExodus, zero_six `[verified: 6 sources]` |
| Steal / rare steal | Sprint Shoes / Sprint Shoes; steal rate 128 (about 50 %) | SinirothX, wiki, Split_Infinity, bremen `[verified: 4 sources]`; GamerGuides "rare: None" (IX-9) |
| Bribe | not possible | SinirothX, Split_Infinity, wiki |
| Scan | "An aeon that once fought alongside Yuna." | SinirothX + zero_six (the same line on every FFX-2 aeon) |
| **Mission reward** | **Unwavering Guard** Garment Grid; Crimson Spheres 2 and 3 come in the scene | wiki Djose Temple, Split_Infinity, Blackestmage, bremen, Paradisio, GamerGuides `[verified: 5 sources]` |

**Reward items, for the results screen** (wiki *Final Fantasy X-2 accessories*, revid 3940120) `[single source]`: Soul of Thamasa strengthens spells by 150 %, doubles MP cost, Magic +15. Sprint Shoes: act at the start of battle, Haste, Agility +10. **Unwavering Guard** (wiki *Garment Grid*, revid 3998878): equip Def +15 / MDef +15; Yellow and Blue gates Def +15 each, Red and Green gates MDef +15 each. The same wiki row credits it to Ixion and, wrongly, to "Pest Control" (IX-10).

**Instant death:** Zantetsu uses combat-core's Status 3 formula (`ffx2-combat-core.md` §2.6a). At resistance 80 against Lv 28, a Lv 30 Samurai's chance is 0, and a Lv 35 one's is about 0.2 % `[derived]`. Treat Ixion as immune in practice.

### 3.2 Ixion, Fiend Arena (International / HD only; do not use)

| Field | SinirothX (Colosseum) | Wiki |
|---|---:|---:|
| Level / HP / MP | 63 / 56,000 / 9,999 | same |
| STR / MAG / DEF / MDEF | 147 / **101 / 88** / 57 | 147 / **88 / 101** / 57 |
| Luck / Accuracy | **182 / 17** | Luck 17 / "Accuracy 182" |
| Abilities | Quick Attack, Critical Attack, Delay Buster, Drain Attack, Aerospark, Thor's Hammer (magic, **DC 76**), Thundaga | same list |

The wiki's Fiend Arena block repeats the two transcription faults `ffx2-trema.md` §12.1 found on Paragon and Ultima Weapon: **Magic and Defense swapped, and Luck printed as Accuracy** `[derived: the same pattern]`. It does not touch the story block, whose wiki values match SinirothX field for field. Recorded here so that no one copies the arena numbers.

---

## 4. Actions and AI

Damage constants (DC) are `[SinirothX]`. The formulas are `research/ffx2-combat-core.md` §2 (SinirothX's flowchart).

### 4.1 Actions

| Action | Effect | DC / type | Sources |
|---|---|---|---|
| Normal Attack | one target | 16, physical, can break the damage limit | SinirothX; Split_Infinity "'Smash'", zero_six "'Horn Slash'" (guide nicknames; the data name is Normal Attack) |
| **Thundara** | **all targets**, Lightning, 12 MP | 12, magic | Targets all: SinirothX's AI ("Thundara on all characters"), Split_Infinity, zero_six, wiki `[verified: 4 sources]`. SinirothX's attack list says "one character"; its AI and every other source say all. |
| **Aerospark** | one target, **5/8 of current HP** | fractional, can break the damage limit | SinirothX, wiki, Split_Infinity (62.5 %), GamerGuides `[verified: 3 sources, Kolar once]`. No element listed. Split_Infinity: it cannot be reduced in any way. Never kills a target on its own `[derived]`. |
| **Recharge** | Ixion restores **200 HP and 200 MP** to himself | "constant" (SinirothX); Split_Infinity calls it a Lightning-element spell on itself | SinirothX, wiki, Split_Infinity, bremen, zero_six `[verified: 5 sources]` for 200 / 200 |
| **Thor's Hammer** | **all targets**, Ixion's Overdrive | 30, magic; element in IX-2 | SinirothX (DC, Lightning); wiki, Split_Infinity, GamerGuides (non-elemental) `[conflict]` |

**Checks against what players saw** `[derived]`, with Ixion at Lv 28, Str 62, Mag 21 and SinirothX's flowchart:

- **Normal Attack:** 181 to 205 against Defense 40. Split_Infinity saw about 200, bremen about 150 (a higher Defense). Consistent.
- **Thundara:** 150 to 169 against MDef 35 if it is **not** halved for hitting everyone; at most 97 even against MDef 0 if it is. Split_Infinity saw "150" on everyone. So the all-party Thundara is **not halved** `[derived from one observation]`. Combat-core's step 15 halves only Black and White magic cast on all, and this fits.
- **Thor's Hammer:** 935 to 1,057 against MDef 35, unhalved; at most about 606 even against MDef 0 if it were halved. bremen saw "around 1000", and Split_Infinity (who recommends Shell) about 700. Both need the unhalved value `[derived from two observations]`.
- **Aerospark:** Blackestmage's 5,000 HP Paine lost about 3,400 (5/8 of 5,000 is 3,125); bremen saw about 1,200. Consistent with 5/8 of current HP.

The engine check this implies: an enemy's all-target Thundara and Thor's Hammer must **not** take the multi-target halving. This is a question for the preset bench, not a change made here.

### 4.2 AI `[SinirothX]`, prose matching on the wiki

```
Basic pattern:
(1) 3/4 Normal Attack, 1/4 Thundara on all characters
(2) 3/4 Normal Attack, 1/4 Thundara on all characters
(3) Aerospark
(4) back to (1)
Action Count (AC):
  +5 when Ixion performs an attack   (+10 when it is Aerospark)
  +5 when Ixion is hit by an attack
  AC >= 100:  (1) Recharge
              (2) AC = 0 and Thor's Hammer
```

- **The shape** (two turns of Attack-or-Thundara, then Aerospark; the counter; Recharge then Thor's Hammer at 100) agrees across SinirothX and the wiki `[verified: 2 sources]`.
- **The counter's increments** (+5, +10 for Aerospark, +5 when hit) agree across SinirothX and the wiki `[verified: 2 sources]`. The wiki words the hit trigger as "being targeted" (§4.4).
- **Recharge is the tell.** Thor's Hammer is Ixion's next action after Recharge `[verified: 3 sources — SinirothX, wiki ("immediately follows up"), Split_Infinity ("next attack coming is Thor's Hammer")]`.

### 4.3 F-8 settled for the build: the Attack / Thundara split is 3/4 : 1/4 (our estimate)

| Reading | Source | Kind |
|---|---|---|
| **3/4 Normal Attack, 1/4 Thundara on all** | SinirothX (GameFAQs 31807) | a data dump; the ranked FFX-2 source |
| 2/3 Normal Attack, 1/3 Thundara | FF Wiki *Ixion (Final Fantasy X-2)* revid 3979438 | prose, no dump, no citation |
| (no split given) | Split_Infinity, GamerGuides, bremen, Blackestmage, Paradisio, zero_six, FFExodus | — |

**Decision for the build: 3/4 : 1/4, labelled our estimate.** Reasons:

1. **GameFAQs first** (Bailey, 2026-09-25), and the GameFAQs source here is the data dump itself.
2. **The wiki's 2/3 : 1/3 looks copied from the sibling aeons.** Valefor (2/3 Attack, 1/3 Sonic Wings) and Ifrit (2/3 Attack, 1/3 Firaga) really are 2/3 : 1/3 in SinirothX, and the wiki's Ifrit page carries a verbatim AI dump that matches SinirothX line for line. The Ixion page has only prose, in the same sentence shape `[estimate for the mechanism]`.
3. No other source gives a split, so the reading stays `[single source]` until a second dump or a counted real-game sample exists.

**What it changes** `[derived]`: over the two free turns of a cycle, Thundara comes up 0.5 times on average under 3/4 : 1/4 and 0.67 times under 2/3 : 1/3. That is one Thundara on everyone every 6 Ixion turns against every 4.5. Small, and all-party chip damage either way. **Keep the other reading one constant away** for the bench, as FA8 does.

**The only way to settle it** is to count: a Steam HD session, or captured footage, logging at least a few hundred of Ixion's free turns. `research/observed-trema-steam-2026-09-25.md` records that there is no FFX-2 save on the machine; reaching Djose needs a Chapter 3 save.

### 4.4 How the counter meets the party `[derived unless tagged]`

- **Ixion alone** adds 20 per three-turn cycle (5 + 5 + 10). With no hits at all, AC reaches 100 at the end of the fifth cycle: Recharge on his 16th turn, Thor's Hammer on his 17th.
- **Each hit adds 5.** A party landing one hit per Ixion turn reaches 100 in about 9 of his turns; two hits per turn, in about 6.
- **Split_Infinity's pattern** ("Once it uses Aerospark for the fourth time, it'll use Recharge on next turn") matches the counter only if the party landed about 4 hits across Ixion's first 12 turns. It is one player's observation of one fight, **not a rule**; do not build it.
- **What counts as a hit** is the same open question as the other fallen aeons: SinirothX says "gets hit by an attack", the wiki says "being targeted". Chapter XI shipped Bailey's pick **FA8 a** (every hostile action aimed at the aeon, hit or miss), with `fallenAeonsAcTrigger = 'damaged'` as the switch (`src/battle/ffx2/ai/fallen-aeons.ts`). The same reading applies here unless Bailey says otherwise (§9 Q4).
- **Unsourced** (no source says; do not invent):
  - whether each hit of a multi-hit ability or of a chain adds 5;
  - whether Recharge itself adds 5 (moot: the counter is zeroed on the next action);
  - where the basic cycle resumes after Thor's Hammer (step 1, or where it left off).

### 4.5 What the guides do against it (each is a strategy the preset should allow)

- **Two Dark Knights and a White Mage**; Shell (and Protect) on everyone, then the White Mage becomes a third Dark Knight. Heal to full the moment Recharge appears. Breaks and Slow both land. (Split_Infinity)
- **Dark Knight + White Mage or Alchemist + Dark Knight or Berserker**; Protect or Light Curtain, Darkness, Howl then Berserk; the **Thunder Spawn** grid absorbs lightning; Water attacks (Waterstrike) for the weakness. (wiki)
- **Two Dark Knights and an Alchemist**, chained Darkness and Mega-Potions. (Paradisio)
- **Water**: the Warrior's Liquid Steel, the Black Mage's Watera and Waterga; steal the Sprint Shoes first; Alchemist support. (Blackestmage)
- **Mighty Guard or Shell and Protect** first, then the four Breaks; NulShock Rings help only against Thundara. (GamerGuides)
- **Trainer Paine's HP Flurry**; keep everyone near full. (bremen)

Water and lightning as the lesson `[verified: 4 sources]`; Shell before Thor's Hammer `[verified: 2 sources, Kolar once, plus the wiki's Protect]`; Darkness `[verified: 3 sources]`.

---

## 5. The party and builds at that point

- **Party:** Yuna, Rikku and Paine, fixed.
- **Level:** no guide gives a number at Djose. Anchors: Ixion is Lv 28; the Chapter 3 Valefor and Ifrit are Lv 22 and 23 `[SinirothX]`; bremen's party was Lv 28 at the Chapter 2 Bevelle visit `[single source]`; our shipped Chapter 2 Bahamut preset is Lv 23–25 (`src/data/ffx2/builds/bevelle.ts`). **A band of Lv 30–36, Paine ≥ Rikku ≥ Yuna, is our estimate.** It needs its own preset, built and benched like the others.
- **Stats are a function of dressphere and level only**, except Trainer, Mascot and the special dresspheres (`ffx2-combat-core.md` §5.1) `[verified: 2 sources]`.
- **Dresspheres owned by the end of Chapter 3** (on top of the Chapter 2 list in `ffx2-bahamut.md` §4.3: Gunner, Thief, Warrior, Songstress, Black Mage, White Mage, Dark Knight, and usually Gun Mage and Alchemist):

| Dressphere | At Djose? | How | Confidence |
|---|---|---|---|
| **Samurai** | **Yes** | Kilika Temple, Chapter 3, on the way to Ifrit | wiki *Dressphere*, ffx2-fallen-aeons.md §7.1, nemes1ss `[verified: 3 sources]` |
| Berserker | if done | After the Lake Macalania mission, Chapter 3 | wiki *Dressphere*; ffx2-bahamut.md §4.3 `[verified: 2 sources]` |
| Lady Luck | if won | Beat Shinra at Sphere Break in Luca, Chapter 3 (or Chapter 5) | wiki *Dressphere*; ffx2-bahamut.md `[verified: 2 sources]` |
| Trainer | if earned | Kimahri gives it in Chapter 3 if Yuna answered him correctly in Chapter 2 | wiki *Dressphere*; ffx2-bahamut.md `[verified: 2 sources]` |
| Mascot | **No** | Episode Complete everywhere (endgame) | wiki *Dressphere* |
| Floral Fallal / Machina Maw / Full Throttle | optional | Chapter 2 sources (ffx2-bahamut.md §4.3) | `[verified: 2 sources]` |

- **Garment Grids:** combat-core §4.3 lists what a Chapter 3 party realistically has. **Thunder Spawn** (Lightning Eater; a chest on Luca's dock 5, Chapters 1, 2 or 5) is the grid the wiki names for this fight. **Unwavering Guard is the reward, so it is not in the preset.**
- **The guides' parties** (§4.5) all use Dark Knight as the damage, with a White Mage or Alchemist healing. The **Songstress** matters for the story (§7), not for the fight.
- **Art on disk for the party** (`public/art/characters/`): Dark Knight, White Mage and Gunner for all three girls; Alchemist for Rikku; Warrior for Yuna and Paine (per `ffx2-trema.md` §5); `yuna-songstress` has attack, cast, dance, item, ko, victory and idle. The Songstress poses other than idle are listed in `docs/target/approved-hashes.json`. No Samurai or Berserker paintings were checked here.

---

## 6. Arena, the characters' look, music

### 6.1 Arena

- **The Chamber of the Fayth at Djose, in FFX-2:** the fayth statue has been ripped out, and a hole in the middle of the floor leads down to the Farplane `[verified: 3 sources — wiki Djose Temple ("a deep hole in the middle of the Chamber of the Fayth where the fayth statue used to be"), wiki Chamber of the Fayth (Vegnagun tore the statues out; tunnels to the Farplane), FFExodus ("the gaping hole where it looks like the Fayth had been ripped out")]`. The wiki's *Chamber of the Fayth* page has a picture captioned "The hole in Djose Temple's Chamber of the Fayth" (not viewed).
- **The temple around it:** Machine Faction equipment inside a trashed temple; a pit of broken machina in the Cloister; the pedestal room and a barrier of lightning `[verified: 3 sources — FFExodus, bremen, Blackestmage]`. The FFX temple's lightning-held stone shell (wiki) is the exterior.
- **Where the fight itself is staged** is open (IX-4). For a concept frame, **the Chamber with the hole in view** serves both readings, because the fall happens there `[estimate]`.
- **Nearest assets on disk:** none for Djose. `public/art/backdrops/farplane.png` (listed in `approved-hashes.json` as `scene:farplane`) is the Chapter 5 Farplane. Whether it can serve for the Abyss scene is an art-options question for Bailey (rule 9), not a decision here.

### 6.2 The characters' look

- **Ixion (FFX-2):** the same aeon as FFX's: a unicorn with a long golden horn, dark blue hide, grey mane and tail, gold bracers on the forelegs (`visual-bible.md` §1, wiki FFX Ixion) `[single source]`. FFExodus alone says the Djose Ixion "had melded with machina" `[single source]`. The wiki says the temple's fiends merged with the machina, and says nothing of Ixion's own look. The wiki's battle picture "Ixion fought.jpg" was not viewed. **Before the painting pilot, look at that picture (read only, no download)** to see whether machina parts are visible. The house's "possessed" treatment (`ffx2-bahamut/idle.json`: violet glow and veins) is a house-style choice, not canon (`ffx2-fallen-aeons.md` §8, F-12).
- **On disk:** `public/art/characters/ixion/` (idle, attack, overdrive) is the **FFX** Ixion, shipped in the FFX chapters by D-089 without a separate verdict. An FFX-2 variant is new art (rule 8, original work only).
- **Shuyin:** `shuyin/idle` and `portrait:shuyin` are in `approved-hashes.json`. **Lenne:** `portraits/lenne.png` is approved; `characters/lenne/idle` exists, not in the hash list. **Baralai:** `baralai-shade/idle` is approved as a *shade* for the Den of Woe (translucent); the Farplane scene shows the real, possessed Baralai, so the shade may not serve. **Nooj and Gippal:** only shade art (Nooj's shade idle is not approved). All of this is for the options round to decide.

### 6.3 Music

| Moment | Track (FFX-2 OST) | Source |
|---|---|---|
| **Ixion battle** | **"Aeons"** (1:07; *Shōkanjū*) | wiki OST page `[single source]` (the same line as `ffx2-fallen-aeons.md` §6) |
| Djose Temple (field) | "The Machina Faction" (1:56) | wiki Djose Temple + wiki OST (one wiki) `[single source]` |
| The Farplane | "The Farplane Abyss" (2:23) | wiki OST `[single source]` |
| **The Shuyin scene** | **not stated by any source** | unsourced |

Reference only: THEMES.md rules apply, and nothing is quoted. The game already has an original FFX-2 aeon cue, `boss-ffx2-aeon` ("Static Coronation"; `ffx2-fallen-aeons.md` §6 lists where it plays). Whether this chapter reuses it, and what plays under the Abyss scene, is Bailey's call by ear (rules 9 and 13).

---

## 7. Story: Yuna's fall and the Farplane Abyss, in order

### 7.1 The fall (after the battle is won)

- The girls go to the hole where the fayth used to be. **Ixion, apparently beaten, rises and charges**; Rikku and Paine dodge to either side and Yuna is thrown into the hole (FFExodus). Ixion "unleashes one last attack" that sends her in (Blackestmage). He comes into the room "in an explosion", knocking Yuna in (Paradisio). The wiki has him explode after being defeated, which makes her fall. `[verified: 4 sources]` for "Ixion's last action puts Yuna in the hole".
- **Dissent:** bremen writes that Yuna "will jump down the hole" `[single source]`. Outvoted 4 to 1; IX-6.

### 7.2 The Farplane Abyss, step by step

| # | Beat | Sources |
|---|---|---|
| 1 | Yuna falls through a white void and lands in a beautiful, strange place: the Farplane (the guides call the spot the Farplane Abyss). It is an FMV ("CG sequence"). | Blackestmage, Paradisio, FFExodus; "Farplane Abyss": bremen, KG21, wiki *Crimson Sphere* `[verified: 4 sources]` |
| 2 | Yuna is **in the Songstress dressphere**; Paradisio sees spirits escape from the outfit. | Blackestmage ("wakes up in her Songstress dressphere"), Paradisio, wiki *Shuyin* and *Farplane* ("dressed in her Songstress dressphere") `[verified: 3 sources]`. FFExodus's diary says "garment grid" instead; the others outvote it. |
| 3 | A young man who looks like Tidus comes out of the fog. Yuna feels it is Him, and it is not. | Blackestmage, Paradisio, FFExodus `[verified: 3 sources]` |
| 4 | He names himself **Shuyin** and calls her **"Lenne"**. | Blackestmage, bremen, Paradisio, FFExodus, wiki *Shuyin*, *Lenne*, *Farplane* `[verified: 5 sources]` |
| 5 | He speaks of the world failing them, of having failed to protect her, and of **Vegnagun** as the way to end it. | Blackestmage (paraphrase), bremen ("seems to be using Vegnagun"), wiki *Shuyin* (quoted line, "Shuyin to Yuna, thinking she's Lenne") `[verified: 3 sources]` |
| 6 | He embraces her. **Lenne's feelings hold Yuna still**: she cannot move, and she feels Lenne's love for him. | Embrace: Blackestmage `[single source]`. Unable to move: *Ultimania* via Ryu_Kaze's translation (GameFAQs 42601) `[single source, citing the Ultimania]`. Feeling Lenne's love: wiki *Farplane* `[single source]`. |
| 7 | **Nooj and Gippal** arrive, and "Shuyin" turns out to be **Baralai**, possessed. | Blackestmage, Paradisio, bremen, wiki *Shuyin*, *Gippal*, *Farplane* `[verified: 4 sources]` |
| 8 | Baralai (Shuyin) goes on, deeper into the Farplane. | Blackestmage ("leaves in the magical pit"), bremen, wiki *Farplane* ("escapes deep into the Farplane") `[verified: 3 sources]` |
| 9 | Nooj and Gippal give Yuna **Crimson Spheres 2 and 3**, for Paine, and go after him. Gippal and Nooj tell her to "take care of things topside". | Spheres: Blackestmage, Paradisio, bremen, wiki *Farplane* and *Crimson Sphere* `[verified: 4 sources]`. The line: wiki *Gippal* `[single source]`. |
| 10 | Control returns. Yuna is alone, wanders, falls to her knees: **"I'm all alone."** | bremen, Split_Infinity 25872, KG21, nemes1ss, GamerGuides, FFExodus, wiki *Farplane* ("comes close to giving up") `[verified: 6 sources]` |
| 11 | **The whistle.** Press X at once: a whistle; a yellow, ghost-like figure appears (Tidus's spirit); keep pressing; after **four** whistles Yuna runs after it onto a glittering yellow bridge. | Four whistles and the X presses: Split_Infinity 25872, Blackestmage, bremen, KG21, nemes1ss, GamerGuides, FFExodus, Paradisio `[verified: 7 sources]`. Yellow ghost and bridge: bremen `[single source]`; "His spirit appears and leads her out": wiki *Farplane*. |
| 12 | Yuna wakes in **Vegnagun's chamber, Bevelle Underground**. Chapter 3 Complete. | Blackestmage, bremen, Paradisio ("back in Bevelle"), wiki *Farplane* ("back to the Bevelle Underground") `[verified: 4 sources]`. **Dissent:** FFExodus's diary "woke up on the Celsius" (IX-7). |
| 13 | (Chapter 4, context.) Aboard the Celsius the others were worried; the dress she wears is Lenne's; Crimson Records 2 and 3 are watched on the ship. | Blackestmage, Paradisio, FFExodus `[verified: 3 sources]` |

**The four whistles are a completion flag.** Hearing all four counts toward 100 % (Djose's Chapter 3 total is 2.2 %, KG21) and is one of the three conditions for the good ending (`research/ffx2-vegnagun-shuyin.md` §ending table; Blackestmage; bremen) `[verified: 3 sources]`. In our game it would be an **interactive beat**, the player pressing a key to whistle; whether it is one, and what it unlocks, is a design question (§9 Q5).

**Unsourced:** the exact dialogue of the Abyss scene. The guides paraphrase it; the wiki quotes one line. **No full transcript was found**, and GameFAQs has no FFX-2 game script. Our dialogue will be written separately anyway (`research/writing-bible.md`); these beats are for staging and tone.

### 7.3 Lines (game text; short, reference only)

- Rikku, at the start of the battle: "This can't be happening." `[verified: 2 sources — SinirothX quote pattern, agent_0042 Battle Quotes List]`
- Yuna, alone in the Abyss: "I'm all alone." `[verified: 6 sources]`
- No victory quote after Ixion is listed by agent_0042.

### 7.4 Why it fits Pyrefly

It is where FFX-2 turns: Yuna meets the face she has been hunting for, and it is someone else's grief wearing it. It sets up our Chapter 5 (Vegnagun, Shuyin, Lenne), and the whistle answers FFX's ending. `[estimate]`: a note on theme, not a sourced claim.

---

## 8. Minimum mechanic list (FFX-2 only)

1. **A fixed three-step cycle** with a weighted pick on steps 1 and 2 (3/4 : 1/4, F-8, one constant) and Aerospark on step 3.
2. **The action counter** from `fallen-aeons.ts`: +5 per action, **+10 for Aerospark**, +5 per hit under the FA8 reading; at 100, Recharge, then zero and Thor's Hammer on the next action.
3. **Recharge:** +200 HP and +200 MP to Ixion. It is also the tell, so the HUD or the battle log must make it legible (a concept-frame question).
4. **Fractional damage on current HP** (Aerospark, 5/8), not reduced by Protect or Shell (Split_Infinity; our estimate).
5. **Absorb Lightning, Water weakness, Gravity immunity**; Breaks and Slow land; Thor's Hammer's element per IX-2.
6. **Enemy all-target magic without the multi-target halving** (§4.1 checks). Check what the engine does today; do not change it here.
7. **The post-battle scene**: Ixion's scripted charge, the fall, the Abyss (existing Shuyin and Lenne art where Bailey approves it), and possibly the whistle beat.
8. **Victory pose:** the wiki's list of fights without a pose (Bahamut, Shuyin, the Via Infinito bosses) does not name Ixion, so the girls pose `[single source, by omission; our estimate]`. Then the scene takes over.
9. **Before any of this is built:** end-state options for the Recharge warning, the Thor's Hammer frame, Yuna's fall and the Abyss (rule 9), a painting pilot for the FFX-2 Ixion, and a music sketch (rule 13).

---

## 9. Questions for Bailey (none decided here)

| # | Question | Options | My lean `[estimate]` |
|---|---|---|---|
| **Q1** | Thor's Hammer's element (IX-2) | (a) Non-elemental: Split_Infinity (GameFAQs), the wiki, GamerGuides; Lightning Eater and NulShock do not help. (b) Lightning: SinirothX's data; the Thunder Spawn grid would absorb his Overdrive. | **(a)**, labelled our estimate. It is what players report seeing, and GameFAQs' own boss guide insists on it. |
| **Q2** | The Attack / Thundara split (F-8) | 3/4 : 1/4 (SinirothX, GameFAQs) or 2/3 : 1/3 (wiki) | **3/4 : 1/4**, our estimate (§4.3). |
| **Q3** | Where the fight is staged (IX-4) | The Chamber of the Fayth with the hole in view, or the antechamber and then a walk into the Chamber | **The Chamber**: SinirothX's zone name, two walkthroughs, and the fall needs the hole anyway. |
| **Q4** | What counts as "hit" for the counter | The FA8 a reading Chapter XI ships (every hostile action aimed at Ixion), or landed damage only | **FA8 a**, for consistency with Chapter XI. |
| **Q5** | The whistle | (a) A playable beat: press to whistle, four times; (b) a cutscene; (c) left out | **(a)**, as a moment, not a hidden flag. What it unlocks, if anything, is a separate question. |
| **Q6** | Ixion's look | FFX Ixion as is; a possessed variant (the house's violet treatment); a machina-fused variant (FFExodus only) | Look at the wiki's battle picture first (read only), then an options round. |

---

## 10. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| **F-8** | Attack / Thundara split: 3/4 : 1/4 (SinirothX) vs 2/3 : 1/3 (wiki prose). | **Settled for the build as 3/4 : 1/4, our estimate** (§4.3). One constant; the other reading stays available for the bench. Verify by counting in the Steam HD game. |
| **IX-2** (was F-5) | Thor's Hammer's element: Lightning (SinirothX) vs non-elemental, "not lightning based" (Split_Infinity), "cannot be absorbed" (wiki), non-elemental (GamerGuides). | **Open; Q1.** GameFAQs disagrees with itself: the dump against the boss guide. Observed behaviour outvotes the dump 2 to 1 (Kolar once). If it must ship before Bailey answers: non-elemental, our estimate. |
| IX-3 | Recharge's type: "constant" (SinirothX) vs a Lightning spell on itself (Split_Infinity). | Irrelevant to the result (Ixion absorbs Lightning either way, and the amount is 200 / 200). Build it as a flat 200 / 200. |
| **IX-4** | Which room holds the fight: the antechamber, then the Chamber after (Blackestmage) vs the Chamber (Paradisio, GamerGuides, SinirothX's zone "Fayth"). bremen and FFExodus are ambiguous. | **Open; Q3.** A Steam HD session with a Chapter 3 save would settle it. |
| IX-5 | Split_Infinity's "Recharge after the fourth Aerospark" vs the counter model. | The counter model (SinirothX + wiki) wins; Split's is one fight's observation (§4.4). |
| IX-6 | Yuna's fall: knocked in by Ixion's last charge (FFExodus, Blackestmage, Paradisio, wiki) vs she jumps (bremen). | Use **knocked in** `[verified: 4 sources]`. |
| IX-7 | Where Yuna wakes: Vegnagun's chamber in the Bevelle Underground (Blackestmage, bremen, Paradisio, wiki) vs the Celsius (FFExodus). | Use **the Bevelle Underground** `[verified: 4 sources]`; Chapter 4 then starts on the Celsius. |
| IX-8 | Is Ixion himself fused with machina? FFExodus only. | `[single source]`; Q6. |
| IX-9 | Minor reward fields: pilfer gil 3,000 (four sources) vs 2,330 (zero_six); rare steal Sprint Shoes (four sources) vs none (GamerGuides). | Use 3,000 and Sprint Shoes. Irrelevant unless Steal is in the chapter. |
| IX-10 | The wiki's *Garment Grid* table credits Unwavering Guard to "Defeat Ixion and complete the 'Pest Control' mission"; "Pest Control" is Kilika's mission. The wiki's *Djose Temple* page and five guides give it for "No Way Djose". | Use **No Way Djose**. |
| IX-11 | Multi-target halving on enemy all-target magic. | `[derived]` from two observations: not halved (§4.1). Check the engine before the bench. |
| IX-12 | Counter details: multi-hit and chain hits, Recharge's own +5, where the cycle resumes after Thor's Hammer. | **Unsourced.** Do not invent; if a choice is forced, restart the cycle at step 1 and label it our estimate. |
| IX-13 | The Abyss dialogue and the music under it. | **Unsourced.** Beats only (§7.2); our dialogue is written separately; the cue is Bailey's call by ear. |
| IX-14 | Party level at Djose. | No source; Lv 30–36 is our estimate (§5). Build the preset and bench it, as for every chapter. |
| IX-15 | Damage in numbers from guides (Split's 150 / 200 / 700, bremen's 150 / 1,200 / 1,000) depend on the writer's party. | Compute from the DCs once the preset exists (§4.1 did it only as a consistency check); do not ship guide figures as data. |

---

## Sources

**GameFAQs** (FFX-2, PS2; read with a headless Playwright script into scratch on D:, 2026-09-27)

- SinirothX, *Enemy Encyclopedia* v1.3, FAQ 31807: entries Ixion, Ixion (Colosseum), Valefor, Ifrit; the damage flowchart; the formation table (Djose Temple, Chapter 3 and 5). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/31807
- Split_Infinity (Damir Kolar), *Boss Guide*, FAQ 26832, G0625–G0627 (Valefor, Ifrit, Ixion). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26832
- Split_Infinity (Damir Kolar), *Guide and Walkthrough* ("Cool Rikku", 2011), FAQ 25872, Storyline Mission 11 (G1111). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/25872
- Blackestmage, *Guide and Walkthrough* (2006), FAQ 28684: Chapter 3 Bevelle and Djose, Chapter 4 Celsius, the endings. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28684
- bremen, *Guide and Walkthrough* v1.8, FAQ 26991: §[139] Bevelle (Chapter 2), §[158] Djose Temple, the Chapter 3 checklist. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/26991
- Paradisio, *Guide and Walkthrough* v1.0, FAQ 27115: Djose Temple, Chapter 4 opening. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27115
- nemes1ss, *Perfect Game Walkthrough* v2.02, FAQ 27786: Djose Temple 2.2. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27786
- KG21, *Optimal 100% Story Completion Guide* v5.0, FAQ 27415: Chapter 3 Bevelle and Djose. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27415
- agent_0042, *Battle Quotes List*, FAQ 27214. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/27214
- Ryu_Kaze, *Ultimania Translations* v1.00, FAQ 42601: "Lenne & Shuyin" (Ultimania pp. 86–87). https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/42601
- zero_six (hardcore rpg gamer), *Enemy Database* v0.80, FAQ 28832: Ixion. https://gamefaqs.gamespot.com/ps2/562386-final-fantasy-x-2/faqs/28832
- Not used: KeyBlade999, *FFX-2 FAQ/Walkthrough* (HD), FAQ 69206: HTTP 403 after page 4, before Chapter 3.

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext|revid`, browser user agent; fetched 2026-09-27)

- Ixion (Final Fantasy X-2), revid 3979438: https://finalfantasy.fandom.com/wiki/Ixion_(Final_Fantasy_X-2)
- Valefor (Final Fantasy X-2), revid 3979327; Ifrit (Final Fantasy X-2), revid 3979434 (for F-8)
- Djose Temple, revid 4034469: https://finalfantasy.fandom.com/wiki/Djose_Temple
- Chamber of the Fayth, revid 3989780: https://finalfantasy.fandom.com/wiki/Chamber_of_the_Fayth
- Farplane (Final Fantasy X), revid 3998715: https://finalfantasy.fandom.com/wiki/Farplane_(Final_Fantasy_X)
- Shuyin, revid 4044072: https://finalfantasy.fandom.com/wiki/Shuyin
- Lenne, revid 4015007: https://finalfantasy.fandom.com/wiki/Lenne
- Gippal, revid 3972827: https://finalfantasy.fandom.com/wiki/Gippal
- Machine Faction, revid 3739302: https://finalfantasy.fandom.com/wiki/Machine_Faction
- Crimson Sphere, revid 3739340: https://finalfantasy.fandom.com/wiki/Crimson_Sphere
- Final Fantasy X-2 enemy abilities, revid 3998493 (Aerospark, Recharge, Thor's Hammer, Thundara rows)
- Thor's Hammer (ability), revid 3926912: https://finalfantasy.fandom.com/wiki/Thor%27s_Hammer_(ability)
- Aerospark, revid 3906133: https://finalfantasy.fandom.com/wiki/Aerospark
- Garment Grid, revid 3998878 (Thunder Spawn, Unwavering Guard)
- Final Fantasy X-2 accessories, revid 3940120 (Soul of Thamasa, Sprint Shoes)
- Dressphere, revid 4045630: https://finalfantasy.fandom.com/wiki/Dressphere
- Final Fantasy X-2 victory poses, revid 3955034
- Final Fantasy X-2: Original Soundtrack, revid 3984616

**Walkthroughs**

- GamerGuides (Damir Kolar), *Final Fantasy X-2 HD Remaster*, "Djose (Mission)" (Chapter 3) and "Aboard the Celsius" (Chapter 4): https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-3/djose-mission
- FFExodus, FFX-2 walkthrough, Chapter 3 Djose Temple and Chapter 4 Celsius diaries: http://www.ffexodus.com/ffx2/walkthrough33.php , http://www.ffexodus.com/ffx2/walkthrough34.php

**Local files consulted (read only):** `docs/plans/next-content-2026-09-27.md`, `research/ffx2-fallen-aeons.md` (§6, §7.1, §8, §9), `research/ffx2-trema.md` (format, §12.1), `research/ffx2-combat-core.md` (§2, §2.6a, §4.3, §5.1), `research/ffx2-bahamut.md` §4, `research/ffx2-vegnagun-shuyin.md` (ending table), `research/visual-bible.md` §1, `src/battle/ffx2/ai/fallen-aeons.ts`, `src/data/ffx2/builds/bevelle.ts`, `public/art/characters/` and `public/art/backdrops/` listings, `docs/target/approved-hashes.json`, `docs/target/decisions.json` (D-089, D-252).

---

## 11. Verification log (2026-09-27)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Ixion is the Chapter 3 finale at Djose Temple | SinirothX formation "Djose Temple - Fayth - BOSS 229 Ixion 1" (Ch. 3); wiki; five walkthroughs | agree |
| 2 | HP 12,380, MP 9,999, EXP 2,600, AP 15, Gil 1,800 | SinirothX, wiki, Split_Infinity, bremen, Blackestmage, Paradisio, FFExodus, zero_six, GamerGuides | agree |
| 3 | Stats 62 / 21 / 106 / 82, Agi 138, Eva 35, Luck 4 | SinirothX vs wiki | agree (the wiki's swap is only on the Fiend Arena block) |
| 4 | Absorb Lightning, weak Water, immune Gravity | SinirothX, wiki, Split_Infinity, zero_six, Paradisio, GamerGuides | agree |
| 5 | Breaks and Slow land | SinirothX's immunity list, Split_Infinity, GamerGuides, Paradisio | agree |
| 6 | Three-step cycle; the counter (+5, +10 Aerospark, +5 hit); Recharge then Thor's Hammer | SinirothX vs wiki vs Split_Infinity | agree; the split differs (F-8); Split's "fourth Aerospark" is an observation (IX-5) |
| 7 | Aerospark 5/8 of current HP | SinirothX, wiki, Split_Infinity, GamerGuides; Blackestmage's 3,400 of 5,000 | agree |
| 8 | Thor's Hammer's element | SinirothX Lightning vs Split_Infinity, wiki, GamerGuides non-elemental | conflict (IX-2) |
| 9 | Normal Attack, Thundara and Thor's Hammer numbers | Derived with SinirothX's flowchart vs Split_Infinity and bremen observations | consistent; implies no multi-target halving (IX-11) |
| 10 | Rewards: Unwavering Guard, Soul of Thamasa, Sprint Shoes, Crimson Spheres 2 and 3 | wiki (three pages), Split_Infinity, Blackestmage, bremen, Paradisio, GamerGuides | agree; the wiki grid table's mission name is wrong (IX-10) |
| 11 | The fall: Ixion's last action puts Yuna in the hole | FFExodus, Blackestmage, Paradisio, wiki vs bremen | 4 to 1 (IX-6) |
| 12 | The Abyss scene's order (steps 1–12) | Blackestmage, bremen, Paradisio, FFExodus, wiki (Shuyin, Lenne, Farplane, Gippal, Crimson Sphere), Ultimania translation | agree on order; where Yuna wakes 4 to 1 (IX-7) |
| 13 | Four whistles after "I'm all alone" | Split_Infinity 25872, Blackestmage, bremen, KG21, nemes1ss, GamerGuides, FFExodus, Paradisio | agree |
| 14 | Rikku's battle line | SinirothX quote pattern vs agent_0042 | agree |
| 15 | Samurai in Chapter 3 at Kilika | wiki *Dressphere*, ffx2-fallen-aeons.md, nemes1ss | agree |
| 16 | Music "Aeons" in the battle | wiki OST | single source |
