# FINAL FANTASY X-2 — Angra Mainyu (Bikanel Desert, the excavation camp): Implementation Reference

**Target project:** Pyrefly Reprise / Echoes of Spira (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-10-15, in a cloud Claude Code session, verbatim: "Implement the unimplemented chapters please." and, minutes later, "I would like to add, don't just implement the unimplemented chapters. Implement the unimplemented chapters end-to-end please. It needs to be a finished product." The unimplemented chapters are D-536's (2026-10-07; D-520, D-838): **Biran and Yenke Ronso** (FFX, `research/ffx-biran-yenke.md`) and **Angra Mainyu** (FFX-2, this file).
**Research date:** 2026-10-15
**Encounter:** **Angra Mainyu** with his two arms, **Tawrich** (right) and **Zarich** (left), the Chapter 5 fight at the Al Bhed excavation camp in the Bikanel Desert, after the mission "Find the Ten Gatekeepers".
**Recommendation (§13):** build it, **FFX-2 only**, as one hidden chapter of one link: the body with two arms as parts (the arms never decide the battle), the arms' immunities as the engine's permanent statuses, Perdition's Flame on its sourced shape, the arms revived with Full-Life while Angra has the MP for it, and the Chapter 5 party preset. **This chapter is the weakest-sourced of the project**: no game row was read for any of the three monsters (§0.2), so every number below is a written source read through the web search tool's summaries, a shared game row that stands in, or an estimate, and each is tagged.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| `[search: N sources]` | Read through the **web search tool's summaries**, not the page itself (§0.2): N different pages, named by the summaries, say it. The FF Wiki counts once however many of its pages say it. |
| `[search: single source]` | One page only, through a summary. |
| `[game table]` | A row of the game's own command table already in this repository (`src/data/ffx2/command-records/*.ts`, laid from `tests/fixtures/parity/ffx2/command_rows.json`, the Steam HD build's tables): **a row another monster uses**, which stands in here (`[stand-in]` says so wherever it is used). No row of Angra Mainyu's, Tawrich's or Zarich's own was read. |
| `[derived]` | Computed from the rows and a sourced number. |
| `[inferred]` | My reading of two or more facts together; stated with its reasoning. |
| `[estimate]` | My own design judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §11 with the resolution. |
| `[garbled]` | A summary saw the number on the page but could not tell which field it belongs to. |

### 0.2 What I did, and what this environment allowed

1. Read `AGENTS.md`, `docs/handoff/NOW.md`, the decisions D-520, D-536, D-838, D-842, D-843, D-846 and D-848 (`docs/target/decisions.json`), `research/ffx2-combat-core.md` (§3538, the random multi-hit rule), the Chapter 5 preset (`src/data/ffx2/builds/farplane.ts`, `research/ffx2-vegnagun-shuyin.md` §6 and §7), and the handoffs of the two hidden FFX-2 chapters built last (`docs/handoff/ch-tourist-trap.md`, `ch-besaid-valefor.md`).
2. **No game data for these monsters exists in this environment.** The FFX-2 fixtures in the repository (`tests/fixtures/parity/ffx2/`) hold the rows of the listed chapters' monsters and of the Experiment, the Tourist Trap and Valefor; none of Angra Mainyu, Tawrich or Zarich (checked by name and by content). The FFX tracker the FFX chapter used has no FFX-2 tables, and the one public FFX-2 data parser the search found (Karifean/FFXDataParser) reads extracted game files this environment does not have; nothing was downloaded (AGENTS.md rule 11).
3. **The written sources.** This session's network policy refused the wiki and guide hosts (`finalfantasy.fandom.com`, `gamefaqs.gamespot.com`, `jegged.com`, `strategywiki.org`, `gamerguides.com`, `finalfantasy.neoseeker.com`, `en.wikipedia.org`: every connection answered 403 or 000 by the egress proxy), and the page-fetch tool could not resolve them either. The only route was the **web search tool**, whose results are a model's summary of the pages it found, naming them. I ran eleven searches on this fight, phrased differently so that different pages were summarised, and kept a fact only when a summary named the page it came from. **This is weaker than reading the page**: every such fact carries `[search: …]`. The number of the damage chain that rests on a summary alone is Perdition's Flame's (§3.1); it is first in the verify-before-shipping list (§11.2).
4. **Not read:** any battle script. The fight's *rules* (§4) are the written sources' description, built on the engine's own mechanisms where the game has one (parts, Full-Life, the permanent Null Magic and Null Physical statuses, a random ten-hit fractional attack), and tagged. §12 is the question list for the reverse-engineering session.

### 0.3 Game case (AGENTS.md rule 14)

**FFX-2 only.** Angra Mainyu, the Bikanel excavation, ATB, dresspheres and the FFX-2 status set exist only in *Final Fantasy X-2*. There is no Angra Mainyu in FFX (the name belongs to unrelated monsters in FFXI and other series, which every search result about them was set aside for). The shared plumbing this chapter adds (one door row, the registry rows) is "both" as plumbing (CHK-020) and inert for every other chapter.

### 0.4 What the sources settle

| Question | Answer | Confidence |
|---|---|---|
| Who fights? | **Angra Mainyu** and his two arms, **Tawrich** (the right arm) and **Zarich** (the left). Killing the arms is optional: the body is the boss. | `[search: 3 sources]` |
| How many fights? | **One battle.** (Before Chapter 5 he roams the dig sites as an encounter that cannot be won: he ejects the party. Not built.) | `[search: 3 sources]` |
| His numbers? | **333,444 HP**, **9,999 MP**, level 47; Defense 97, Magic 124, Magic Defense 114, Agility 68. Strength 73 or 23. | HP `[search: 5 sources]`; the rest `[search: 2 sources]` with two `[conflict]`s (§2.1) |
| The arms? | **5,440 HP** each (or 5,540), 9,999 MP; Tawrich level 38, Zarich level 36. **Tawrich is immune to magic, Zarich to physical blows**, permanently. | HP `[conflict]`; immunities `[search: 3 sources]` |
| What does he do? | **Perdition's Flame** (ten hits on random girls, each taking **3/16 of her maximum HP**), **Demi**, **Flare**, **Curaga**; **Full-Life** on a fallen arm; **Osmose** when he lacks the MP to revive. | `[search: 3 sources]`; the turn rules `[search]` with `[conflict]`s (§4) |
| The arms' moves? | Tawrich: **Punch** and **Bloody Breath** (Confusion, Silence, Darkness, Poison). Zarich: the **-ara and -aga** spells of four elements and **Glimmer of Despair** (drains the party's MP and lowers Strength, Magic, Defense and Magic Defense one stage). | `[search: 2 sources]` each |
| How is he beaten? | Two Dark Knights cast **Darkness** (it reaches all three and passes both arms' immunities) while a healer keeps the party up; **keep the arms down** so Perdition's Flame cannot come; Protect and Reflect help. | `[search: 4 sources]` |

---

## 1. The sequence at a glance

| # | Beat | Source |
|---|---|---|
| 1 | The Al Bhed dig in the Bikanel Desert under Nhadala; in Chapters 1 to 3 a huge fiend roams the dig sites: Picket warns of something approaching, a red arrow crosses the map, and if it reaches the Gullwings it ejects them (it cannot be beaten then). | `[search: 2 sources]` (FF Wiki *Bikanel*, *Angra Mainyu (Final Fantasy X-2)*; StrategyWiki *Digging at Bikanel*) |
| 2 | Chapter 5: a sandstorm rages over the Cactuar Nation. The mission "Find the Ten Gatekeepers" opens; finding the ten Cactuar Gatekeepers calms the storm. | `[search: 2 sources]` |
| 3 | The Gatekeepers ward the fiend away from their home, and it **attacks the Al Bhed excavation camp** instead; the Gullwings must stop it. | `[search: 3 sources]` (FF Wiki, StrategyWiki, Neoseeker) |
| 4 | The fight. | — |
| 5 | After: not described by any summary `[gap]`; the chapter's close is ours (§7). | — |

---

## 2. Enemy stat blocks

### 2.1 Angra Mainyu `[search: 2 sources]` unless tagged

| Field | Value | Confidence |
|---|---|---|
| Level | 47 | `[search: 2 sources]` (Neoseeker, Final Fantasy Kingdom) |
| HP | **333,444** | `[search: 5 sources]` (FF Wiki, Neoseeker, StrategyWiki, GamerGuides, a fan site); one GameFAQs post says it "can be as low as somewhere in the 266k range" when earlier dig encounters wore it down `[search: single source]`: the chapter starts it full. |
| MP | **9,999** | `[search: 3 sources]`; `[conflict]` one GameFAQs post says 6,666 (§11) |
| Strength | 73 (Neoseeker) or **23** (Final Fantasy Kingdom) | `[conflict]`, **inert**: none of his moves reads Strength (§3) |
| Defense / Magic / Magic Defense / Agility | 97 / 124 / 114 / 68 | `[search: 2 sources]` |
| Evasion / Accuracy / Luck | 0 / 2 / 0 | `[search: 2 sources]`; Accuracy is inert (no move of his rolls to hit) |
| EXP / AP / Gil | 5,000 / 30 / 5,000 | `[search: 2 sources]` |
| Pilfer Gil | 2,000 | `[search: 2 sources]` |
| Steal | **Megalixir** (rare: none) | `[search: 2 sources]` |
| Drop | **Ribbon** (rare: none) | `[search: 3 sources]` (the two stat pages and the Ribbon accessory page; already in `research/ffx2-vegnagun-shuyin.md` line 984) |
| Elements | no weakness, no resistance; **Gravity: immune** | `[search: 3 sources]` (GamerGuides, GameFAQs, Neoseeker; the FF Wiki's table is garbled) |
| Statuses | **Darkness: immune** | `[search: single source]` (FF Wiki); the rest of his list is not in any summary `[gap]` (§12) |

### 2.2 Tawrich, the right arm

| Field | Value | Confidence |
|---|---|---|
| Level | 38 | `[search: 2 sources]` |
| HP | **5,440** (FF Wiki, and a guide's "the two arms at 5,440 HP each") or 5,540 (Neoseeker) | `[conflict]` (§11) |
| MP | 9,999 | `[search: 2 sources]` |
| Strength, Defense, Magic, Magic Defense, Agility, Evasion, Accuracy, Luck | **unassigned**: the pages hold the values 85, 99, 42 and 113 but the summaries could not tell which field each is in; the FF Wiki's text says his **Magic Defense is very low** | `[garbled]`; used as `[estimate]` (§2.4) |
| Auto-status | **Null Magic**, permanent: immune to magical attacks | `[search: 3 sources]` (FF Wiki *Final Fantasy X-2 statuses*, Jegged, GameFAQs) |
| Rewards | **none**: each time he falls, Angra Mainyu revives him | `[search: 2 sources]` |

### 2.3 Zarich, the left arm

| Field | Value | Confidence |
|---|---|---|
| Level | 36 | `[search: single source]` (FF Wiki) |
| HP | **5,440** or 5,540 | `[conflict]`, as Tawrich |
| MP | 9,999 | `[search: 2 sources]` |
| Defense / Agility / Accuracy | 70 / 82 / 99 | `[search: single source]` (FF Wiki) |
| Strength, Magic, Magic Defense, Evasion, Luck | not legible in any summary | `[gap]`; used as `[estimate]` (§2.4) |
| Auto-status | **Null Physical**, permanent: immune to physical attacks | `[search: 3 sources]` |
| Rewards | **none** (revived by Angra Mainyu) | `[search: 2 sources]` |

### 2.4 The arms' unsourced numbers `[estimate]`

The arms' unread fields are filled by one stated method, so that a verified row is a one-line change per field:

- **Tawrich** takes the four legible values in the order the FF Wiki's FFX-2 stat box prints its fields (Strength, Defense, Magic, Magic Defense, Agility, then Evasion, Accuracy, Luck), skipping Magic Defense, which the page says is very low: **Strength 85, Defense 99, Magic 42, Agility 113**; **Magic Defense 1** (the floor of "very low"); **Evasion 0, Luck 0** (Angra Mainyu's); **Accuracy 99** (Zarich's sourced value, the same family).
- **Zarich** keeps his three sourced values and takes Tawrich's figures with the roles swapped, since he is the casting arm: **Magic 85, Magic Defense 99, Strength 42**; **Evasion 0, Luck 0**.

Their effect on the fight: Tawrich's Strength and Zarich's Magic set the size of the arms' blows (§3.2, §3.3); everything else either never matters (their Defense and Magic Defense stand behind immunities Darkness passes, §4.4) or barely does. The bench measures the fight with these numbers; the verify list names them.

---

## 3. The moves

### 3.1 Angra Mainyu

| Move | What the sources say | How the chapter builds it |
|---|---|---|
| **Perdition's Flame** | **Ten hits on random party members, each taking 3/16 of the target's maximum HP** (18.75 %; GamerGuides' "16.75 %" is a typo of the same fraction) `[search: 3 sources: StrategyWiki, Jegged, FF Wiki]`; "a fractional, non-elemental physical attack" `[search: single source]`; raising a girl's HP does not soften it (it is a fraction of her maximum) `[search: 2 sources]`; Pernicious Powder does not weaken it `[search: single source]` | Formula 7 (target maximum HP × power / 16), **power 3, ten hits, random targets** (the engine's random multi-hit, `research/ffx2-combat-core.md` §3538 `[verified: 3 sources]`), **physical class** (so **Protect halves each hit**, the FFX-2 kernel's step for class 1), never misses `[estimate]`. The shape is Trema's Meteor's (row 0x4128: formula 7, random targets, twelve hits of 2/16) `[game table, stand-in]`. |
| **Demi** | "deals damage based on current HP" `[search: 2 sources]` | The shared Demi row **0x3082** (formula 4, power 4: a quarter of current HP, Gravity, on all) `[game table, stand-in]`: Paragon, Trema, Cindy and the Left Redoubt use it. |
| **Flare** | in his list `[search: 2 sources]`; Reflect bounces it back `[search: single source]` | The shared monster Flare **0x41fa** (magic formula, power 30, one target, reflectable) `[game table, stand-in]`: the Nodes and the Right Redoubt use it. |
| **Curaga** | in his list `[search: 2 sources]` | The party's Curaga **0x30b5** (healing formula, power 38) on **himself** `[game table, stand-in]` `[estimate: the target]`. |
| **Full-Life** | revives a fallen arm `[search: 4 sources]`; costs MP: "he will try to cast Full-Life and fail, or drain small amounts of MP from you until he has enough to cast Full-Life again" `[search: 2 sources]` | The shared monster Full-Life **0x4069** (Vegnagun's Core and Redoubts) `[game table, stand-in]`, **60 MP** (the party's Full-Life cost; the monster's own MP cost is not read) `[estimate]`. |
| **Osmose** | drains MP `[search: 3 sources]`; his fallback when the arms are down and he lacks the MP for Full-Life `[search: 2 sources]`; with the party out of MP "it gets stuck in a loop that greatly reduces its damage" `[search: single source]` | The monster Osmose **0x406d** (MP class, formula 4, power 3: 3/16 of the target's current MP, absorbed) `[game table, stand-in]`: Leblanc uses it. |

### 3.2 Tawrich

| Move | Sources | Built as |
|---|---|---|
| **Punch** | a basic physical hit `[search: 2 sources]` | Strength formula, power 16 (the house's monster Attack, `research/ffx2-combat-core.md`), physical, rolls to hit `[estimate]` |
| **Bloody Breath** | inflicts **Confusion, Silence, Darkness and Poison** `[search: 2 sources: Jegged, his Scan text]` | On every girl, no damage, each status at chance 50 `[estimate: the chance and the target are not in any summary]` |

### 3.3 Zarich

| Move | Sources | Built as |
|---|---|---|
| **Fira, Blizzara, Thundara, Watera** | his list `[search: single source: Neoseeker]` | The shared monster -ara rows **0x41ed to 0x41f0** (power 12, one girl) `[game table, stand-in]`: Leblanc, the female goons and Ixion use them. |
| **Firaga, Blizzaga, Thundaga, Waterga** | his list `[search: single source]` | The shared monster -aga rows **0x41f1 to 0x41f4** (power 19, one girl) `[game table, stand-in]`: Mindy, the Nodes and Shiva use them. |
| **Glimmer of Despair** | "drains the party's MP and lowers their Strength, Magic, Defense and Magic Defense by one level each" `[search: 2 sources: FF Wiki enemy abilities, Jegged]`; "while Zarich is alive he uses attacks that drain your party's MP" `[search: single source]` | On every girl: MP class, formula 4, power 3 (3/16 of current MP) `[estimate]`, and one stage down of the four stats `[search]` |

---

## 4. The fight's rules

### 4.1 Angra Mainyu's turn `[search]`, `[conflict]`, `[estimate]` where marked

What the sources give:

- "It will start by using Perdition's Flame at the beginning of the fight, and again 7 turns later. Otherwise, it has weighted random choices between Demi, Flare, Perdition's Flame and Curaga." `[search: single source: a walkthrough]`; another summary found nothing confirming the seven-turn rule.
- "Perdition's Flame can only be performed when both arms are alive" `[search: 2 sources]`; one forum thread says he used it with one arm `[conflict]`; one GameFAQs poster saw it once with both arms down and explains it: "if he readies PF while both assistants are alive, he'll use it even if they're dead by the time his cast bar is full" `[search: single source]`.
- "When one or more heads are dead, it will cast Full-Life on one" `[search: single source]`; he revives the arms `[search: 4 sources]`.
- "When the arms are dead and the boss lacks MP for Full-Life, it will cast Osmose" `[search: 2 sources]`.

**Model** (the order is `[inferred]` from those lines; the weights are `[estimate]`):

| # | Condition | Action |
|---|---|---|
| 1 | an arm is down, and he has the 60 MP | **Full-Life** on it (Tawrich first when both are down) |
| 2 | an arm is down, and he lacks the MP | **Osmose** on a random girl |
| 3 | both arms stand, and his Flame is due (his first turn, or the seventh of his turns since the last Flame) | **Perdition's Flame**; the count starts again |
| 4 | otherwise | one of **Demi**, **Flare** (one random girl) and **Curaga** (himself), at equal odds `[estimate]` |

A Flame chosen while both arms stand **goes off even if they fall during its cast** (the engine decides at the turn, as the poster describes). His Flame is never chosen with an arm down (the two-source reading of the conflict). The weights of row 4 and whether Perdition's Flame is also in that random pool (the walkthrough lists it there) are §12's second question: the model keeps the Flame on its clock alone, so that keeping the arms down is the whole lesson, which every strategy source teaches.

### 4.2 The arms' turns `[estimate]`

No source gives the arms' order or odds. **Tawrich**: Punch two turns in three, Bloody Breath one in three. **Zarich**: Glimmer of Despair one turn in five; otherwise an -ara spell (two in five) or an -aga spell (two in five) of a random element, on a random girl. Both are §12's third question.

### 4.3 What decides the battle

**Only Angra Mainyu has to fall** (the arms are parts and grant nothing, §2.2): the battle ends when the body does, whoever stands `[search: 3 sources]` + the engine's own rule for parts.

### 4.4 Immunities and Darkness

Tawrich's permanent Null Magic and Zarich's permanent Null Physical are the engine's **group-2 statuses `null-magic` and `null-physical`**, given as permanent auto-statuses (the Vegnagun Nodes' precedent). **The Dark Knight's Darkness passes both** (its row's damage flags are 0: it is neither physical nor magical), which is why the sources call it "one of the few abilities that can hit all three targets" `[search: single source]` and build the whole fight on it `[search: 4 sources]`.

### 4.5 What the fight does not have

No escape (a boss). No timer. No HP phases in any source. His HP carried from the dig encounters (§2.1) is not modelled: the chapter's fight is fresh.

---

## 5. The party: the Chapter 5 preset

The Gullwings meet him in Chapter 5, the band the project's **Chapter 5 preset** already models: `src/data/ffx2/builds/farplane.ts` (`research/ffx2-vegnagun-shuyin.md` §6; levels 46, 48 and 50; Yuna White Mage, Rikku and Paine Dark Knights; Crystal Bangles; the bag of the Farplane chain). It is the party every strategy source describes: "two Dark Knights cast Darkness on the arms while an Alchemist uses Mega-Potions" `[search: 2 sources]`, a healer "the whole fight" `[search: single source]`. **The preset is used as it is** (no stat moves): it is the same estimate Chapters V, XI and the Experiment stand on, so the fight is measured against a party already reviewed elsewhere.

---

## 6. Arena

The Al Bhed excavation camp in the Bikanel Desert `[search: 3 sources]`. **No painting of Bikanel exists in the approved set.** The stand-in is the Machine Faction's grounds plate (`backdrops/ffx2-experiment-grounds`, the hidden Experiment's): a dig site of the same kind (machina, lamps, cables, crates), itself provisional (`src/data/experiment-plates.ts`). A desert plate is an art step for Bailey's pick (AGENTS.md rule 9).

---

## 7. Story: beats only (paraphrased; no line transcribed)

As §1. The voices are `research/writing-bible.md`'s FFX-2 voices (Yuna, Rikku, Paine; the Gullwings' banter). Nhadala and the camp are named by the sources; every line is ours. The close (§1 beat 5) is ours: the camp is safe and the dig can go on.

---

## 8. Music

"The aeon battle theme, **'Aeons'**, plays during the fight" `[search: single source: FF Wiki]`. The project never plays the game's score (rule 8); its own original in that role is **`boss-ffx2-fallen-aeons`**, the cue Chapter XI, Ixion at Djose, the Tourist Trap and Valefor at Besaid already play.

---

## 9. Art: what exists

**No painting of Angra Mainyu, Tawrich or Zarich exists**, and no summary describes his look (`[gap]`; the FF Wiki carries concept art that no summary described). The stand-ins: his body painted from the approved **`x2-anima`** set (Chapter XI's possessed Anima, a dark giant of the same game, shown in a new place); the arms as **figure-less parts** on his painting (the D-044 mechanism Vegnagun's Redoubts and Bulwarks use: a ring and a plate, no painting). A painted Angra Mainyu is an art step for Bailey's pick.

---

## 10. What the FFX-2 engine has and what it lacks

Has: parts that never decide victory (`results.ts`); the shared monster Full-Life with `can-target-dead`; permanent auto-statuses (`EnemyDef.autoStatuses`, Dispel leaves them); `null-magic` and `null-physical` read by the damage pipeline; random multi-hit with one target per hit (`hitPlan.ts`); formula 7 (maximum HP × power / 16); Protect halving a physical-class hit whatever its formula; Darkness's damage flags 0 passing both immunities; MP-class damage and absorption (Osmose); per-unit AI memory and a shared flag map; enemy MP spent on a cast (`resolve.ts`), with nothing stopping a cast he cannot afford (the script gates it). **Lacks:** the three monsters, their scripts, Perdition's Flame, Bloody Breath, Glimmer of Despair and Angra's self-Curaga as abilities, and a Ribbon item for the drop (`'ribbon'` is an accessory id, not an item; FFX-2 pays every drop on a win).

---

## 11. Conflicts, gaps and the verify-before-shipping list

### 11.1 Conflicts and how each was resolved

| # | Conflict | Resolution |
|---|---|---|
| A-1 | Strength 73 (Neoseeker) or 23 (Final Fantasy Kingdom) | 73; **inert** (no move of his reads Strength) |
| A-2 | MP 9,999 (FF Wiki, Neoseeker, a guide) or 6,666 (one GameFAQs post) | 9,999 |
| A-3 | The arms' HP 5,440 (FF Wiki, a guide) or 5,540 (Neoseeker) | 5,440 |
| A-4 | Perdition's Flame needs both arms (two sources) or one (one forum thread) | both; a Flame begun with both still goes off if they fall during the cast (the poster's explanation) |
| A-5 | "Seven turns later" (one walkthrough) or no fixed rhythm (nothing confirms it) | the seven-turn clock, his own turns |
| A-6 | 3/16 per hit (three sources) or 16.75 % (GamerGuides) | 3/16; 16.75 is a typo of 18.75 |

### 11.2 Verify before shipping (read the pages, or the rows)

1. **Perdition's Flame**: the fraction (3/16), the ten hits, the damage class (physical: Protect halves it), and its accuracy.
2. The arms' stats (§2.4: Tawrich's four garbled values, Zarich's Strength, Magic and Magic Defense) and their HP (A-3).
3. The turn rules of §4.1 and the arms' odds (§4.2); the MP cost of his Full-Life.
4. Bloody Breath's chance and targets; Glimmer of Despair's MP fraction.
5. Angra Mainyu's status list beyond Darkness.

### 11.3 Not modelled, said plainly

The dig encounters of Chapters 1 to 3 (an unwinnable ejection) and the HP they wear off him; Pilfer Gil's own roll beyond what the engine already pays; any reward for the arms (none exists).

---

## 12. Open questions for the game data (for the reverse-engineering session)

1. Angra Mainyu's, Tawrich's and Zarich's monster rows: every stat, the status bytes, the elements, the steal and drop slots.
2. Angra Mainyu's script: the order of his checks, the Flame's clock, the weights of his random pool, and whether the Flame is also in that pool.
3. The arms' scripts: their odds and targets.
4. The command rows of Perdition's Flame, Bloody Breath, Glimmer of Despair, and of the Demi, Flare, Curaga, Full-Life and Osmose he uses (the stand-ins of §3 are other monsters' rows).
5. The MP cost of his Full-Life.

---

## 13. Recommendation for the chapter (FFX-2 only)

Build it as **one hidden chapter, one link**: Angra Mainyu with Tawrich and Zarich as parts, the moves of §3 on their stand-in rows and estimates, the turn model of §4, the Chapter 5 preset, the "Aeons" role played by our own cue, provisional art (the `x2-anima` painting, figure-less arms, the Machine Faction's grounds plate), hidden behind a typed word like its siblings (D-848: play first, then list), and **every item of §11.2 and §12 written into the handoff**: this chapter should not be listed before the reverse-engineering session has read the three rows and the script.

---

## Sources

Read through the web search tool's summaries (2026-10-15; the pages themselves were refused by this session's network policy):
- https://finalfantasy.fandom.com/wiki/Angra_Mainyu_(Final_Fantasy_X-2) ; https://finalfantasy.fandom.com/wiki/Tawrich ; https://finalfantasy.fandom.com/wiki/Zarich ; https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_enemy_abilities ; https://finalfantasy.fandom.com/wiki/Final_Fantasy_X-2_statuses ; https://finalfantasy.fandom.com/wiki/Bikanel
- https://finalfantasy.neoseeker.com/wiki/Angra_Mainyu_(FFX-2) ; https://finalfantasy.neoseeker.com/wiki/Tawrich ; https://finalfantasy.neoseeker.com/wiki/Zarich
- https://www.finalfantasykingdom.net/finalfantasyx2bosses.php
- https://strategywiki.org/wiki/Final_Fantasy_X-2/Chapter_5/Bikanel_Desert ; https://strategywiki.org/wiki/Final_Fantasy_X-2/Digging_at_Bikanel
- https://jegged.com/Games/Final-Fantasy-X-2/Walkthrough/Chapter-5/58-Bikanel-Desert.html
- https://www.gamerguides.com/final-fantasy-x-2/guide/walkthrough/chapter-5/bikanel
- https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/69422955 ; https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/69803607 ; https://gamefaqs.gamespot.com/pc/190170-final-fantasy-x-x-2-hd-remaster/faqs/81757/bikanel-desert-ch-5
- https://www.finalfantasyforums.net/threads/angra-mainyu-tt-tt-final-fantasy-x-2.32656/ ; https://steamcommunity.com/app/359870/discussions/0/598519514348401470/
- https://www.flickr.com/photos/74529773@N07/7025010129 (the arms: "Tawrich, right arm"; Zarich "the same, but mirrored")

In the repository (the stand-in rows): `src/data/ffx2/command-records/enemies.ts` and `party.ts` (Demi 0x3082, Flare 0x41fa, Curaga 0x30b5, Full-Life 0x4069, Osmose 0x406d, the -ara rows 0x41ed to 0x41f0 and the -aga rows 0x41f1 to 0x41f4, Trema's Meteor 0x4128), laid from `tests/fixtures/parity/ffx2/command_rows.json`.

## Verification log (2026-10-15)

- Every stand-in row of §3 was read from the repository's own record table (each is pinned against the Steam build's fixture by `tests/unit/data-ffx2-command-records.test.ts`).
- The model's behaviour (the Flame's clock, the revives, the Osmose fallback, the immunities and Darkness passing them, Protect halving the Flame, the parts never deciding the battle) is pinned on the real engine by `tests/unit/chapters/angra-mainyu-*.test.ts`.
