# FINAL FANTASY X — Isaaru's contest of aeons (Via Purifico, Bevelle): Implementation Reference

**Target project:** Pyrefly Reprise (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-09-24 ~21:50 EDT: "I'll also add Isaaru's contest of aeons at Beville and Gippal, in the Den of Woe as two additional chapters in addition to the ones I selected already". "Beville" is **Bevelle**. This file is the Isaaru half. It comes in addition to Seymour Omnis and Trema.
**Research date:** 2026-09-24
**Encounter:** **Isaaru's three aeons, in turn: Grothia (his Ifrit), Pterya (his Valefor), Spathi (his Bahamut)**, fought by Yuna alone with her own aeons, at the exit of the Via Purifico maze beneath Bevelle
**Bestiary entries:** #108 Grothia, #109 Pterya, #110 Spathi (wiki). Internal ids (decompile): **Isaaru `m248`**, **Grothia = `m284` "Ifrit#2"**, **Pterya = `m254` "Valefor"**, **Spathi = `m287` "Bahamut"**. Three formations: `bosses.isaaru_grothia` = `[isaaru, ifrit_2]`, `bosses.isaaru_pterya` = `[isaaru, valefor]`, `bosses.isaaru_spathi` = `[isaaru, bahamut]`, each with `forced_party: "y"`.
**Supersedes:** `research/ffx-isaaru-aeon-contest.md` (commit 4d7230f6, a wiki-only first pass). §0.4 lists what this file corrects in it. That file was left untouched. Whether to delete it is the driver's call.
**Recommendation (§12):** build it as its own **FFX-only** chapter of three links. The stats are strong: decompile, wiki, GameFAQs and Jegged agree on every HP. The AI is thin: the gauge rates are single-source and the Countdown start is disputed. Its identity is new to the anthology: the player commands only aeons, the mirror aeon is locked, and each fight has one learnable threat (Hellfire at the start, Mega Flare on a countdown). It also feeds Chapter X directly.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

These are the tags of `research/ffx-seymour-natus-highbridge.md` §0.1.

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read from the game's monster tables in the Grayfox96 FFX-RNG-tracker data files, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680` (the same commit as the Natus, Evrae and Yojimbo files), parsed with that repository's own code. |
| `[verified: N sources]` | N independent sources agree. |
| `[single source]` | Only one source says it. |
| `[derived]` | Computed by me from `[decompiled]` constants with the damage chain in `research/ffx-combat-core.md` §2. |
| `[estimate]` | My own design judgement, not a measured fact. |

### 0.2 What I did

1. Read `research/ffx-seymour-natus-highbridge.md` (the structure, and the story around this fight), `research/ffx-combat-core.md` §1.2, §2 and §6 (the CTB ticks, the damage chain, aeons, Shield/Boost, Grand Summon, the gauge persistence and the aeon stat model), and the earlier `research/ffx-isaaru-aeon-contest.md`.
2. Ran the tracker's **own Python modules, loaded into memory from the pinned commit** by an import hook. No repository file was written to disk (AGENTS.md rule 11), in the same way as the Natus research. Parsed `m248`, `m254`, `m284` and `m287`, every action row the tracker's `monster_actions.json` assigns them, and the three `isaaru_*` formations. **Sanity check:** the same loader returns Evrae `m119` as HP 32,000 / Def 0 / MDef 0 / Agi 20, exactly as `ffx-evrae-airship.md` §1 has it.
3. **Byte-diffed the PS2 and HD monster tables** for all four records. They are **byte-identical** (for comparison, Natus `m126` differs in one byte).
4. Read the Final Fantasy Wiki through `api.php?action=parse&prop=wikitext|revid` with a browser user agent. Page titles and revision ids are listed under Sources.
5. Cross-checked against GameFAQs (bover_87, *FFX Remaster Walkthrough*, the "Bevelle" page), Jegged (Walkthrough 23, "Via Purifico") and Auronlu's FFX game script, Chapter X. Ran the damage chain on the decompiled numbers against three aeon presets (§5). One guide figure checks the result: GameFAQs' "Mega Flare around 2,200, about 550 with Shield" (§5.3).
6. Read `public/art/characters/{valefor,ifrit,ixion,shiva,bahamut,anima,yojimbo}`, `docs/target/approved-hashes.json`, `docs/target/targets.json` and `docs/target/decisions.json` for the art state (§10). Read `src/data/ffx/builds/highbridge.ts`, `macalania.ts` and `gagazet.ts` **read-only** for the aeon preset the next chapter already ships (§6.4).

### 0.3 Game case (AGENTS.md rule 14)

**FFX only.** The duel happens during Yuna's pilgrimage, under CTB, with FFX aeons, FFX Overdrives, Shield/Boost and Grand Summon. In *Final Fantasy X-2*, Isaaru is a non-combat NPC: a tour guide at the Zanarkand ruins who may later return to Bevelle (wiki Isaaru, Bevelle). The X-2 cast has no aeons to summon. Nothing in this file transfers to an FFX-2 chapter. The X-2 afterlife of Isaaru and his brothers is recorded in §8.4 as colour only.

### 0.4 Corrections to the brief and to the earlier pass

| Said | What the sources say |
|---|---|
| Brief: "Isaaru's contest of aeons **at Bevelle**" | Correct city, but not in the city itself. The duel is in the **Via Purifico**, the prison beneath Bevelle, in the **last chamber of the maze ("Land") section, at the end of a red-lit hallway**, at the prison's exit `[verified: 4 sources: wiki Via Purifico + Bevelle, GameFAQs, Jegged]`. It is not on the Highbridge and not in Bevelle Temple. |
| Brief: "Yuna alone, with aeons only" | **Confirmed**, with one refinement. Yuna herself is on the field and **can be attacked** whenever no aeon is out. Both Grothia and Pterya have a separate attack reserved for her (§3, §4.2). The formation's forced party is `"y"` `[decompiled]`. |
| Brief: "the Natus research notes Bahamut fills his Overdrive here" | **Confirmed, and more specific:** it happens in the **Pterya** link, from taking her hits (GameFAQs), and the wiki says the same of Bahamut against Pterya. Chapter X already ships "Bahamut full" on that basis (`highbridge.ts`, B3 = b). |
| "Contest of aeons" as a name | That phrase is the story's name for the duel (wiki *Aeon (Final Fantasy X)*, *Bevelle*). **"A Contest Of Aeons" is also an OST track**, and the wiki lists it for **Yu Yevon's possessed aeons and Penance, not for this fight** (§9). Do not assume that track is the Isaaru cue. |
| Earlier pass: "Only aeons can act… the player's human party does not act" | Yuna acts: she has **Summon** and her **Grand Summon** Overdrive (Jegged), and the enemy aeons target her. Lulu, Kimahri and Auron are present in the story but take no part in the battle. |
| Earlier pass: Spathi pays "6,000 AP / 6,000 gil", the others 0 | That is **the wiki's figure only**. The **decompile has 0 gil / 0 AP on all three**. GameFAQs prints 0 / 0 for each aeon and says Yuna gains **5,000 AP for winning the duel**, "not awarded by any specific enemy". This is conflict I-1. |
| Earlier pass: Spathi is "flagged Tough" as a difficulty marker | On the wiki, "Tough" only means **not pushed back by Delay Attack / Delay Buster**. The decompile sets `immune_to_delay` on **all three** aeons anyway. |
| Earlier pass: Pterya's gauge "empties into nothing named" | Her Overdrive is **Energy Ray** (row 4:61, DC 26). Source: decompile, wiki abilities list, GameFAQs ("Energy Ray (but no Energy Blast)"). |
| Earlier pass: the maze traversal as a possible chapter shape (option C) | It is a design option, not research. §12 recommends against it. The sourced shape is **three back-to-back battles with no healing between them** (GameFAQs). |

---

## 1. The encounter and the rules of the duel

### 1.1 Shape

Isaaru is on the field as an enemy actor with 10 HP, **no actions** and Scan/Sensor immunity (§2.1). He summons **Grothia**, then **Pterya**, then **Spathi**. Each aeon is **a separate battle formation**, fought **back to back with no healing between them** `[decompiled formations + single source: GameFAQs "three battles… back-to-back, and neither Yuna nor her Aeon HP is healed between fights"]`. When Spathi falls, Isaaru stands aside and the party leaves (§8.2).

### 1.2 The rules, one by one

| Rule | Value | Confidence |
|---|---|---|
| **Who fights** | **Yuna alone** (`forced_party "y"`). Lulu, Kimahri and Auron, if found in the maze, are in the scene but not in the battle. | `[decompiled]` + GameFAQs + Jegged ("only Yuna will be fighting") `[verified: 3 sources]` |
| **What can hurt Isaaru's aeons** | Only aeons. Each enemy infobox reads "Can only be fought by aeons". GameFAQs: "you're limited to your Aeons". | wiki ×3 pages + GameFAQs `[verified: 2 sources]`. Whether Yuna's own Attack / Blk Magic is greyed out or merely useless is unstated (O-3). |
| **The mirror lock** | Yuna **cannot summon her own copy of the aeon she is facing**: no Ifrit against Grothia, no Valefor against Pterya, no Bahamut against Spathi. The lore reason: only one summoner can draw on a fayth at a time. | wiki Grothia + Spathi + Isaaru + Pterya ("Since Valefor herself is not available"), Jegged (Spathi), wiki *Aeon (FFX)* for the lore `[verified: 2 sources]` |
| **One aeon at a time** | The general FFX rule: a summon replaces the party. Dismiss returns Yuna, who can summon another aeon. | `ffx-combat-core.md` §6.1 `[verified: 2 sources]` for FFX in general. No source restates it for this fight. |
| **Yuna is a target** | With no aeon out, Grothia and Pterya attack Yuna with a dedicated move (§4.2) | wiki Grothia + Pterya, decompile rows `[verified: 2 sources]` |
| **Loss condition** | **Game Over if Yuna dies or runs out of aeons.** "This isn't a friendly contest", unlike Belgemine, who heals Yuna before each duel and gives a prize either way. | `[single source: GameFAQs]`. The Belgemine contrast is also on wiki *Belgemine*. |
| **No healing between the three links** | Yuna's HP and each aeon's HP and MP carry from link to link | `[single source: GameFAQs]` + the general persistence rule (`ffx-combat-core.md` §6.1, `[verified: 2 sources]`) |
| **A KO'd aeon stays down for the rest of the chain** | An aeon KO'd in one link cannot be summoned in the next | `[derived]` from the aeon-revive rule (`ffx-combat-core.md` §6.1: unavailable for a number of battles; the project ships `AEON_REVIVE_BATTLES = 3`) |
| **Gauges carry** | Aeon and Yuna Overdrive gauges persist between the links | `[derived]` from `ffx-combat-core.md` §6.5 (`[verified: 2 sources]` in general) |
| **Items, escape** | **Unsourced.** No source says whether Yuna may use items, and none mentions escape (the fight is a boss battle). | Open, O-3 |
| **Preemptive / ambush** | `forced_condition: "normal"` on all three formations | `[decompiled]` |

### 1.3 Which of Yuna's aeons can answer which link

Yuna owns **Valefor, Ifrit, Ixion, Shiva and Bahamut**. Bahamut was named at Bevelle Temple just before the trial (GameFAQs, "You'll be prompted to name a new Aeon (Default: Bahamut)"; wiki *Aeon (FFX)*; `ffx-seymour-natus-highbridge.md` §6.2). Anima, Yojimbo and the Magus Sisters come later `[verified: 3 sources]`.

| Link | Locked | Available |
|---|---|---|
| Grothia | Ifrit | Valefor, Ixion, Shiva, Bahamut |
| Pterya | Valefor | Ifrit, Ixion, Shiva, Bahamut |
| Spathi | Bahamut | Valefor, Ifrit, Ixion, Shiva |

---

## 2. Stat blocks

### 2.1 Isaaru (`m248`), the summoner

| Field | Value | Confidence |
|---|---:|---|
| HP / MP | 10 / 1 | `[decompiled]` + wiki *Isaaru (Final Fantasy X boss)* `[verified: 2 sources]` |
| Str / Def / Mag / MDef / Agi / Eva / Acc | 1 / 0 / 0 / 0 / 0 / 0 / 0 (the wiki prints 1s) | `[decompiled]` + wiki |
| Luck | 15 | `[decompiled]` + wiki |
| Overkill | 10 | `[decompiled]` + wiki |
| Actions | **none**: `monster_actions.json` `m248` is empty | `[decompiled]` |
| Sensor / Scan | immune | `[decompiled]` + wiki |
| Sleep / Silence / Dark | 20 (partial) | `[decompiled]` + wiki |
| Auto-Life | 255; Threaten byte 0 (**wiki: Immune**) | `[decompiled]`; conflict noted, moot |
| Poison tick | 2 (the wiki's "poison% 25" of 10 HP) | `[decompiled]` + wiki |
| Gil / AP / items | 0 / 0 / none; bribe-immune | `[decompiled]` + wiki |
| Doom count; wiki note | 3 (wiki infobox); the infobox also says "Can only be fought by aeons" | `[single source: wiki]`; both moot, since he never acts (added 2026-09-24, plan review R3) |

**How to build him:** a non-combat enemy actor that is shown but never acts. **Whether the player can target him is unsourced.** The wiki says only that "Yuna does not fight him directly" and that he is "internally programmed as an enemy". Recommend `[estimate]`: not targetable (O-4).

### 2.2 The three aeons, core stats

| Field | **Grothia** (`m284`) | **Pterya** (`m254`) | **Spathi** (`m287`) | Confidence |
|---|---:|---:|---:|---|
| Is | Isaaru's Ifrit | Isaaru's Valefor | Isaaru's Bahamut | wiki (all), Jegged, GameFAQs `[verified: 3 sources]` |
| HP | **8,000** | **12,000** | **20,000** | `[decompiled]` + wiki + GameFAQs + Jegged `[verified: 4 sources]` |
| MP | 600 | 1,000 | 1,500 | `[decompiled]` + wiki |
| Strength | 23 | 20 | 31 | `[decompiled]` + wiki |
| Defense | 10 | 10 | **0** (wiki 1) | `[decompiled]` + wiki |
| Magic | 21 | 18 | **38** | `[decompiled]` + wiki |
| Magic Defense | 0 (wiki 1) | 10 | 0 (wiki 1) | `[decompiled]` + wiki |
| Agility → base CTB | 18 → **11 ticks** | 21 → **10** | 20 → **10** | `[decompiled]` + wiki; ticks `[derived]` (combat-core §1.2) |
| Luck / Evasion / Accuracy | 15 / 0 / 0 (wiki Acc 1) | same | same | `[decompiled]` + wiki |
| Overkill threshold | 2,550 | 2,550 | 2,550 | `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]` |
| Gil / AP | 0 / 0 | 0 / 0 | **0 / 0** (wiki: 6,000 / 6,000) | conflict I-1 |
| Steal / drop / equipment / bribe | none / none / chance 0 / immune | same | same | `[decompiled]`; GameFAQs prints "Equipment Drop Rate 25%, Slots 0", which looks like an empty template (I-2) |
| Doom count | 5 | 5 | 5 | `[decompiled]` + wiki + GameFAQs |
| Zanmato byte | 0 | 3 (wiki "zanmato 4") | 0 | `[decompiled]`; moot, since Yuna does not own Yojimbo yet |
| Names in other versions | Kobushi "Fist" (JP; "Fist" on PS3 HD) | Tsubasa "Wing" | Tsurugi "Sword" | `[single source: wiki]` |

### 2.3 Elements

- **Grothia absorbs Fire.** Everything else is neutral `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]`. The wiki adds that he "will not heal himself" with his own Fira `[single source]`.
- **Pterya and Spathi:** neutral to everything `[decompiled]` + wiki + GameFAQs `[verified: 3 sources]`.
- **Jegged's "ice-based magics are the most effective against Grothia" is wrong:** Ice is neutral on him in the decompile, the wiki and GameFAQs. Do not teach it in hints.
- Yuna's aeons carry **Eater** auto-abilities for their own element (Ifrit Fire, Ixion Lightning, Shiva Ice) and no weaknesses `[decompiled: characters.json]`. So there is **no sourced "Shiva is weak to Fire"** rule. Grothia's Fira and Hellfire hit Shiva at neutral.

### 2.4 Status resistances (all three aeons alike)

| Status | Value | Note |
|---|---:|---|
| Death, Zombie, Petrify, Poison, all four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Dark, **Slow**, Scan, all four Distillers, **Eject**, Auto-Life | **255** | immune `[decompiled]` + wiki `[verified: 2 sources]` |
| **Threaten** | 0 in the byte, **Immune on the wiki**; Jegged: Spathi "is immune to the slowing effects of Heavenly Strike" | **Conflict I-3.** Shiva's Heavenly Strike carries Threaten at chance 100 (combat-core §6.3). Recommend treating them as immune (2 sources against the byte, the rule used for Natus N-3). |
| Doom | 0 | landable (GameFAQs lists Doom as the one vulnerability); nothing Yuna has can inflict it here |
| Shell, Protect, Reflect, Nul×4, Regen, Haste, Curse | 0 | landable |
| Flags | `immune_to_percentage_damage` (Demi), `immune_to_delay` (so **Sonic Wings' and Impulse's Delay do nothing**), `immune_to_slice`, `immune_to_bribe`, `immune_to_scan`, `immune_to_sensor` | `[decompiled]` + wiki (Demi, Delay, Bribe, Sensor, Scan Immune) `[verified: 2 sources]` |

---

## 3. Exact action data (decompiled rows)

### 3.0 A caution about shared records

**The three enemy records are shared with Belgemine's aeons.** The tracker's labels show it: `m254` Valefor has both an "Attack Aeon (Isaaru)" and an "Attack Aeon (Belgemine)" row, and `m284` Ifrit#2 has an "Attack (Belgemine First Turn)" row. Belgemine duels Ifrit on the Mi'ihen Highroad and fights Valefor and Bahamut at Remiem (wiki *Belgemine*). So **a row being in the record does not mean Isaaru's aeon uses it.** Below, each row is marked by whether a source ties it to this fight. The byte tables carry no AI script, so which rows Isaaru's AI calls comes from the wiki and the guides.

### 3.1 Grothia (`m284`)

| Row | Name | Target | Formula | DmgCon | Type | Rank | Notes | Used here? |
|---|---|---|---|---:|---|---:|---|---|
| 4:0 | **Attack Aeon** | random | Strength | 16 | Physical | 3 | accuracy 90, can crit, 10 % shatter | **Yes**: his attack on aeons (wiki, GameFAQs "basic physical") |
| 4:127 | **Attack** | random | Strength | 16 | Physical | 3 | **accuracy 120** | **Yes, on Yuna only.** Wiki: against Yuna he uses "an attack with increased accuracy that doesn't increase his Overdrive gauge" `[verified: 2 sources: decompile + wiki]` |
| 3:69 | **Fira** | random | Magic | 24 | Magical, Fire | 3 | reflectable, affected by Silence (he is Silence-immune), 10 % shatter, MP 8 | **Yes** (wiki, GameFAQs) `[verified: 3 sources]` |
| 4:94 | **Hellfire** (Overdrive) | party | **Magic** | **70** | **Other**, Fire | 3 | Magic formula, so **MDef applies**; type Other, so **Shell does not**. Fire, so **NulBlaze cancels it** (wiki strategy; combat-core §3) | **Yes** (wiki, GameFAQs, Jegged) `[verified: 3 sources]`; DC 70 on the wiki's enemy-ability table |
| 4:137 | Meteor Strike | random | Magic | 28 | Magical | 3 | | **No.** The wiki says Grothia "casts Fira instead of using Meteor Strike" |
| 4:98 | Attack (Belgemine First Turn) | random | Strength | 20 | Physical | 3 | always hits | No (Belgemine) |
| 4:230 | Hellfire → Anima | Anima | Magic | 70 | Other, Fire | 3 | | No (Yuna has no Anima here) |
| 4:140 / 4:116 | Summon / Die | | | | | | animation rows | — |

### 3.2 Pterya (`m254`)

| Row | Name | Target | Formula | DmgCon | Type | Rank | Notes | Used here? |
|---|---|---|---|---:|---|---:|---|---|
| 4:0 | **Attack Aeon (Isaaru)** | random | Strength | 16 | Physical | 3 | accuracy 90, crit, 10 % shatter | **Yes**: the tracker names it for Isaaru |
| 4:92 | **Attack** | random | Strength | **8** | Physical | 3 | **accuracy 60** | **Yes, on Yuna only.** Wiki: "reduced power and accuracy that won't fill her Overdrive gauge" `[verified: 2 sources]` |
| 4:93 | **Sonic Wings** | random | Strength | 8 | Physical | 3 | always hits, weak Delay | **Yes** (wiki, GameFAQs; wiki table "8") `[verified: 3 sources]` |
| 4:61 | **Energy Ray** (Overdrive) | party | Magic | **26** | **Magical** | 3 | non-elemental. **Shell halves it** because it is Magical, unlike Hellfire and Mega Flare. | **Yes** (wiki "26", GameFAQs) `[verified: 3 sources]` |
| 4:166 | Energy Blast | party | Magic | 40 | Other | 3 | | **No.** GameFAQs: "(but no Energy Blast)" |
| 4:127 | Attack Aeon (Belgemine) | random | Strength | 16 | Physical | 3 | accuracy 120 | No (Belgemine) |

### 3.3 Spathi (`m287`)

| Row | Name | Target | Formula | DmgCon | Type | Rank | Notes | Used here? |
|---|---|---|---|---:|---|---:|---|---|
| — | **Countdown** | — | — | — | — | — | "Counts down to Mega Flare" (wiki enemy-ability table, noted for Bahamut and Spathi). **Not a row in the tracker's list.** | **Yes** (wiki, GameFAQs, Jegged) `[verified: 3 sources]` |
| 4:95 | **Mega Flare** | party | **Magic** | **44** | **Other** | 3 | non-elemental. **MDef applies, Shell does not.** | **Yes** (wiki "44", GameFAQs, Jegged) `[verified: 3 sources]` |
| 4:127 | Attack | **Counter** | Strength | 16 | Physical | 3 | accuracy 120 | **Unconfirmed (I-4).** No source describes Spathi counterattacking. It may belong to Belgemine's Remiem Bahamut, which shares the record. |
| 4:173 | Impulse | **Counter**, party | Strength | 25 | Other | 3 | weak Delay | **Unconfirmed (I-4)**, as above |

### 3.4 Scan / Sensor

All three aeons and Isaaru are **Scan- and Sensor-immune** `[decompiled]` + wiki `[verified: 2 sources]`. There is **no Scan text** to paraphrase. A chapter "hint" line must be original.

---

## 4. AI script

The decompile holds no AI script. Everything here comes from the wiki (per-aeon pages), GameFAQs and Jegged.

### 4.1 Grothia

| Behaviour | Confidence |
|---|---|
| Attacks with 4:0 and casts Fira | wiki + GameFAQs `[verified: 2 sources]` |
| Has an Overdrive gauge. **When it is full, his next turn is Hellfire.** | wiki + GameFAQs `[verified: 2 sources]`; Jegged's account (Hellfire lands after Bahamut's Mega Flare fails to kill) fits it |
| **He starts the battle with a full gauge** | `[single source: wiki]`. Together with the row above, **his first turn is Hellfire.** Jegged is consistent with this but does not say it. |
| Gauge fill: **+5 % when he attacks, +3 % when he is targeted**; no fill from his attack on Yuna | `[single source: wiki]` |
| Against Yuna (no aeon out): 4:127 Attack, accuracy 120 | wiki + decompile `[verified: 2 sources]` |
| Does not heal himself with Fira, although he absorbs Fire | `[single source: wiki]` |
| **Fira versus Attack choice:** unstated | Open (O-5). Recommend an even split `[estimate]`, labelled. |

### 4.2 Pterya

| Behaviour | Confidence |
|---|---|
| Attack (4:0), Sonic Wings, Energy Ray as her Overdrive | wiki + GameFAQs `[verified: 2 sources]` |
| Gauge fill: **+10 % when she attacks, +15 % when she is targeted** | `[single source: wiki]` |
| Starting gauge | **Unsourced.** Recommend 0 `[estimate]` (the wiki calls out a full start only for Grothia). |
| Against Yuna: 4:92, DC 8, accuracy 60, no gauge fill | wiki + decompile `[verified: 2 sources]` |
| Attack versus Sonic Wings choice | Unstated (O-5). |

### 4.3 Spathi

| Behaviour | Confidence |
|---|---|
| **Does not attack on most of his turns: he counts down to Mega Flare, then starts again** | wiki + GameFAQs + Jegged `[verified: 3 sources]` |
| **The count starts at 5** ("counts down from five; when the count reaches zero, Mega Flare"). Jegged says "count down from 4 to 1, then Mega Flare". | wiki + GameFAQs say 5 `[verified: 2 sources]`; Jegged's 4→1 may be the visible numbers after a first "5" turn. **Conflict I-5**, build 5 and label it. |
| What "most of his turns" leaves room for (any other action) | Unstated. The tracker's counter rows (§3.3) are unconfirmed (I-4). |
| **Shield on the turn before Mega Flare** is the fight's answer. With Shield, the aeon takes "about 550". | wiki + GameFAQs + Jegged `[verified: 3 sources]`; the numbers are reproduced in §5.3 |

### 4.4 Chain rules

- On each aeon's defeat, Isaaru summons the next one as a new battle. There is no heal, and states carry (§1.2).
- The chain ends when Spathi falls `[verified: 3 sources]`. Isaaru has no fourth aeon: **no Ixion**, although Yuna met him at Djose. The wiki notes this ("he never uses Ixion") `[single source]`.

### 4.5 Reference pseudocode (sourced rules only; the `[estimate]` choices are labelled)

```
link 1  Grothia: gauge = 100                                   // [single source: wiki]
  turn: if no aeon out: Attack(4:127) -> Yuna; return          // no gauge gain
        if gauge >= 100: Hellfire -> field; gauge = 0; return
        choose Attack(4:0) or Fira(3:69) -> aeon                // split [estimate] (O-5)
        gauge += 5                                              // [single source]
  when targeted by the player: gauge += 3                      // [single source]

link 2  Pterya: gauge = 0                                       // [estimate] (unsourced)
  turn: if no aeon out: Attack(4:92) -> Yuna; return
        if gauge >= 100: Energy Ray -> field; gauge = 0; return
        choose Attack(4:0) or Sonic Wings(4:93) -> aeon          // [estimate] (O-5)
        gauge += 10
  when targeted: gauge += 15

link 3  Spathi: count = 5                                       // [verified: 2 sources] (I-5)
  turn: if count == 0: Mega Flare -> field; count = 5; return
        show count; count -= 1                                   // telegraph
  // Spathi against Yuna with no aeon out: UNSOURCED (O-6)

chain: on defeat of link n -> start link n+1 with every HP, MP, gauge and KO carried
lose:  Yuna KO, or no summonable aeon left                      // [single source: GameFAQs]
```

---

## 5. Damage summary `[derived]` (integer chain, combat-core §2, roll 16; low–high roll in brackets)

### 5.1 The aeon presets used

No source gives Yuna's stats or battle count at the Via Purifico. Three presets are computed. Every one is `[estimate]` on its inputs and `[derived]` in its arithmetic:

- **P1: the shipped Chapter X set.** `highbridge.ts` takes Valefor, Ifrit, Ixion and Shiva from `macalania.ts` and Bahamut from `gagazet.ts`: HP 1,146 / 1,515 / 1,513 / 1,342 / 1,398. This is what the *next* chapter already ships, so it is the natural choice for continuity (O-1).
- **P2: formula, estimated Yuna.** The growth formula (`ffx-combat-core.md` §6.4, the tracker's `calculate_aeon_stats`) applied to Yuna at HP 1,200, MP 220, Str 12, Def 10, Mag 32, MDef 34, Agi 12, Eva 30, Acc 8, Luck 17, at 200 battles. That Yuna is the lower half of the Gagazet row, as the Natus research first proposed.

| Aeon (P2) | HP | MP | Str | Def | Mag | MDef | Agi | base CTB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Valefor | 1,272 | 42 | 31 | 39 | 34 | 39 | 15 | 12 |
| Ifrit | 1,700 | 40 | 33 | 51 | 33 | 35 | 13 | 13 |
| Ixion | 1,692 | 45 | 36 | 44 | 32 | 49 | 11 | 14 |
| Shiva | 1,512 | 49 | 35 | 28 | 38 | 40 | 22 | 10 |
| Bahamut | 2,404 | 62 | 43 | 48 | 28 | 48 | 15 | 12 |

- **P3: the story floor.** The battle-count branch alone, with Yuna on the floor. At 180 to 209 battles: Valefor 1,127, Ifrit 1,512, Ixion 1,503, Shiva 1,342, Bahamut 2,139 HP. This is the weakest the aeons can be at that count.

### 5.2 Incoming, per hit (P1 | P2)

| Move | Valefor | Ifrit | Ixion | Shiva | Bahamut |
|---|---:|---:|---:|---:|---:|
| Grothia Attack (4:0) | 316 \| 306 | (locked) | 303 \| 294 | 347 \| 334 | 316 \| 284 |
| Grothia Fira | 441 \| 434 | (locked) | 410 \| 400 | 438 \| 431 | 428 \| 404 |
| **Grothia Hellfire** | **1,898 \| 1,867** (1,779–2,009) | (locked) | **1,765 \| 1,720** | **1,885 \| 1,854** | **1,840 \| 1,737** |
| Pterya Attack (4:0) | (locked) | 197 \| 189 | 207 \| 200 | 237 \| 228 | 215 \| 194 |
| Pterya Sonic Wings | (locked) | 98 \| 94 | 103 \| 100 | 118 \| 114 | 107 \| 97 |
| Pterya Energy Ray | (locked) | 411 \| 401 | 366 \| 357 | 391 \| 385 | 382 \| 361 |
| **Spathi Mega Flare** | **2,370 \| 2,332** (2,221–2,508) | **2,469 \| 2,409** | **2,203 \| 2,148** | **2,353 \| 2,315** | (locked) |

**What the table means for design:**
- **Hellfire kills every P1 aeon from full HP** (1,765 to 1,898 at roll 16 against 1,146 to 1,515 HP; the §5.2 table's cells; an earlier "1,977" here was an arithmetic slip, corrected 2026-09-24 by the plan review R9). In P2, only Bahamut survives it (2,404 HP against about 1,740), and Ixion misses surviving by a few dozen HP. Because Grothia **opens with a full gauge** (§4.1), **the first link's lesson is "Shield or NulBlaze on the first turn"**. This matches the wiki's own advice (NulBlaze on Shiva before Hellfire) and GameFAQs ("Just Shield if Hellfire is coming next").
- **Mega Flare kills every available aeon from full HP** in every preset, so the third link's lesson is to **Shield when the count reads 1**.
- Pterya is weak. Her Energy Ray is about a quarter of an aeon's HP, and "Bahamut… gets to full Overdrive just by eating Pterya's attacks" (GameFAQs). That is the source of Chapter X's "Bahamut full".

**Against Yuna herself** (P2's Yuna: Def 10, MDef 34, HP 1,200): Grothia's Attack 381, **Hellfire 1,946 (lethal)**, Pterya's Attack 130, Energy Ray 404, **Mega Flare 2,430 (lethal)**. Leaving Yuna without an aeon when an Overdrive is due is a Game Over (§1.2).

### 5.3 Check against the guides

- **GameFAQs: Mega Flare "around 2,200 damage"; with Shield, "about 550".** Derived: 2,148 to 2,469 at roll 16 across the four available aeons, and ÷4 = 537 to 617. **This reproduces the play figures**, which supports both the stat attribution and the Magic-formula reading of rows 4:95 and 4:94.
- **The wiki's "all aeons' Overdrives should be hitting the damage cap"** is **not** reproduced. The derived aeon Overdrives come to 3,164 to 4,717 (P1) and 3,222 to 6,540 (P2). Jegged agrees with the derived figures: "Mega Flare may not actually kill Grothia" (8,000 HP). Treat the wiki line as overstated (I-6).

### 5.4 Outgoing (roll 16; every Overdrive is Special Magic, so MDef is 0; the Piercing weapon zeroes Defense for Ifrit, Ixion, Shiva and Bahamut)

| Action | P1 | P2 | Hits to kill Grothia / Pterya / Spathi (P1) |
|---|---:|---:|---|
| Valefor Attack / Energy Ray | 525 / 3,300 | 782 / 4,324 | Attack only: 16 / (locked) / 36 |
| Ifrit Attack / Meteor Strike / Hellfire | 786 / 835 / 3,164 | 1,145 / 1,216 / 4,179 | Attack only: (locked) / 16 / 26 |
| Ixion Attack = Aerospark / Thor's Hammer | 953 / 3,273 | 1,477 / 3,952 | Attack: 9 / 13 / 21 |
| Shiva Attack / Heavenly Strike / Diamond Dust | 449 / 546 / **4,717** | 1,189 / 1,443 / 6,540 | Heavenly Strike: 15 / 22 / 37 |
| Bahamut Attack = Impulse / Mega Flare | 575 / 3,564 | 2,496 / 3,222 | Attack: 14 / 21 / (locked) |
| Tier-2 black magic by aeons (DC 24) | — | Shiva 1,573, Ifrit 1,221, Ixion 1,156 | Shiva's Blizzara also heals Shiva (she absorbs Ice) |

The three links are **long fights at P1 strength** (Spathi takes 21 to 37 basic hits between Mega Flares). **One stored Overdrive, or a Grand Summon, is worth three to eight turns.** That is why Jegged tells the player to "fully charge [Yuna's] Overdrive" before the hallway, and why every guide plans the aeon order around the gauges.

---

## 6. Yuna, her aeons, and the builds at this point

### 6.1 Story position

After the wedding, the leap and Valefor, the Chamber of the Fayth (Bahamut), the arrest and the trial, the guardians are thrown into the Via Purifico, split into two groups. Tidus, Wakka and Rikku go into the flooded sewer, which ends in Evrae Altana. Yuna goes into the maze, where she may find Kimahri, Auron and Lulu; **only Auron is required**. She then meets Isaaru at the exit. Both groups reunite on the Highbridge, where Seymour Natus waits `[verified: 3 sources: wiki Via Purifico, wiki Bevelle, Auronlu Ch. X]`. **This is the one stretch of the game where Yuna, not Tidus, leads on the field** (wiki Via Purifico, GameFAQs) `[verified: 2 sources]`.

### 6.2 Yuna

- **Solo** for the whole maze. GameFAQs advises summoning in the random battles and equipping status protection. The maze holds a **Lucid Ring** (Silence Ward, Confuse Ward, Poison Ward) for her `[verified: 2 sources: GameFAQs, wiki Via Purifico]`.
- **Overdrive: Grand Summon.** Jegged: charge it fully before the hallway, then open with a Grand-Summoned Bahamut's Mega Flare. Grand Summon fills the chosen aeon's gauge for that summon, and the stored gauge is restored afterwards (combat-core §5.4 / §6.5) `[single source for the tactic; verified for the mechanic]`.
- A **Save Sphere** stands just before the red hallway, and the hallway has only Maze Larva encounters `[single source: GameFAQs]`. The duel therefore starts with **full HP and MP** but with whatever gauges the maze left.
- Stats: **no source.** For continuity with Chapter X, see O-1. GameFAQs notes that Yuna is often near Rikku's grid at this point (Use, Steal; Reflect and Dispel nearby) `[single source]`. Chapter X decided that its Yuna does **not** know Reflect (B4 = b).

### 6.3 Aeon levels and gauges

- **Levels:** aeon stats follow Yuna's stats and the battle count (combat-core §6.4, `[verified: 3 sources]` for the model). §5.1 gives the three presets. No source gives this save's battle count.
- **Gauges:** persistent (combat-core §6.5). The in-fight fill model is the project's `[estimate]` (5× the character increment). The **enemy** gauge rates in §4 are the wiki's, not this model.
- **Sourced plans** that the chapter should make possible:

| Link | Sourced plan | Source |
|---|---|---|
| Grothia | **Shiva** (speed, evasion, Blizzara self-heal, **NulBlaze vs Hellfire**); save Bahamut for later; Valefor next (his attack often misses her) | wiki + GameFAQs `[verified: 2 sources]` |
| Grothia | Grand Summon **Bahamut**, Mega Flare, then Blizzaga | `[single source: Jegged]` (the Blizzaga-is-best part is wrong, §2.3) |
| Pterya | **Bahamut**: tanks her hits and fills his Overdrive | wiki + GameFAQs `[verified: 2 sources]`; Jegged adds Ixion with Thundara self-heal |
| Spathi | **Shield before Mega Flare**, then attack; Ifrit or Ixion with a full gauge (wiki); any aeon but Valefor (GameFAQs); Shiva with Blizzara heals (Jegged) | `[verified: 3 sources]` on Shield; the aeon choice varies |

### 6.4 The hand-off to Chapter X (already built)

`src/data/ffx/builds/highbridge.ts` (read, not edited) ships Chapter X with **Bahamut at 100** "(the Isaaru duel just before fills him)". The other four carry over from Chapter VII: Valefor 90, Ifrit 60, Ixion 60, **Shiva 0**. **If this chapter is built, it sits between VII and X in story order**, so Chapter X's gauges would read most truthfully as this chapter's **end** state. Whether to wire that (a campaign carry-over, or two authored presets that agree) is a design question (O-1). Shiva at 0 in Chapter X is also consistent with the sourced plan in which Shiva fights Grothia and spends Diamond Dust `[derived]`.

---

## 7. Arena: the last chamber of the Via Purifico maze

| Fact | Source |
|---|---|
| The Via Purifico is a prison beneath Bevelle where the condemned are left to die. Anyone who gets out is held to be purified of the crime. | wiki Via Purifico `[single source]` |
| The maze ("Land") sits above the flooded sewer | wiki Bevelle §Via Purifico `[single source]` |
| The boss room is reached at the **end of a reddish / red-lit hallway**, north of the central room with a Save Sphere | GameFAQs ("reddish hallway") + Jegged ("hallway with the red lights") `[verified: 2 sources]` |
| Isaaru waits in the **final chamber**, guarding the way out; a way up to the surface lies beyond it | Auronlu Ch. X + wiki Bevelle/Via Purifico ("at the dungeon's exit") `[verified: 2 sources]` |
| Warp glyphs (green arrows) and glowing floor tiles are the maze's furniture | Jegged + GameFAQs + wiki gallery captions `[verified: 2 sources]` (maze, not specifically the boss room) |

`research/visual-bible.md` has **no Via Purifico entry**, and its Bevelle lines describe the **FFX-2** underground, which does not settle an FFX scene (rule 14). The existing `src/scenes/bevelle-underground.ts` is the FFX-2 Bahamut arena, not this room. **The arena needs its own paper concept and an options round** (rule 9). Anything more specific than "stone prison, red light, a way up" must come from reference images looked at before the concepts, not from memory (rule 6), and the output must be original (rule 8).

---

## 8. Story: Isaaru and his brothers

Paraphrased from the wiki and Auronlu's script. **No line is transcribed.** The chapter must write original lines in the register of `research/writing-bible.md` (rule 8).

### 8.1 Who they are

- **Isaaru:** a summoner, aged 26 in FFX `[single source: wiki infobox]`. Devout, courteous, treats everyone as an equal, and has looked up to Lord Braska since childhood. Designed by Tetsuya Nomura. Appearance (wiki): brown hair, half-closed eyes, a white robe under a blue blouse with long white cuffs, a wide sea-green belt tied in a bow, and a black knee-length coat edged in sea green `[single source]`.
- **Maroda** and **Pacce:** his brothers and guardians. Maroda is the grown fighter. Pacce is a small boy who, Maroda says, should never have come on the pilgrimage (wiki Pacce) `[single source]`.

### 8.2 Beats

**Before (earlier chapters of the game, context only):**

1. **Djose Temple.** Yuna meets Isaaru, Maroda and Pacce. She kneels to him as the senior summoner. He tells of admiring Braska, and he warns Tidus that summoners have been vanishing (wiki Isaaru, Pacce) `[verified: 2 wiki pages]`.
2. **Home.** The Al Bhed had taken the brothers to keep them from dying on the pilgrimage. During the Guado attack they are freed. Isaaru and Dona send the Al Bhed who died protecting them, and all board the *Fahrenheit* (wiki Isaaru; Auronlu has the brothers' lines during the attack) `[verified: 2 sources]`.
3. **Orders.** They ride to the Calm Lands, go on to Bevelle, and Maester Kinoc calls on them to "deal with" the traitors (Auronlu Ch. X). This contradicts nothing in the Natus file: Kinoc is alive until the Highbridge.

**The duel (the chapter):**

4. **The maze.** Yuna alone. On the way in, a monk begs her pardon (Auronlu notes he only sounds like Isaaru). She finds Kimahri, Lulu and Auron, who says they must find the exit (Auronlu).
5. **The final chamber.** Isaaru recognises her, explains his orders, and holds that the temple's word is law even for Braska's daughter. If Lulu is with Yuna, she notices his guardians are missing, and he answers that he does this alone. He asks her forgiveness before summoning (Auronlu) `[single source]`.
6. **Three challenges.** He has one battle cry per aeon, as it enters (Auronlu + one quote on each of the three wiki aeon pages) `[verified: 2 sources]`. They are the natural hooks for the three link title cards.
7. **After.** He loses. Yuna steps forward to heal him and he refuses her. Lulu tells Yuna it is time to go. He points them to the way up. Yuna bows deeply. **Auron tells him his pilgrimage is over** (Auronlu; wiki Isaaru) `[verified: 2 sources]`.
8. **The Highbridge.** The reunion with Tidus, Wakka and Rikku, then Seymour, Kinoc's body, and Natus: **Chapter X**.

**After, in FFX (colour for the post-battle card):**

9. The brothers later stand at Bevelle's gate on the Highbridge. Maroda says the city is closed and cannot believe Yuna is a traitor. They say Isaaru is helping to guard the temples (wiki Maroda, Pacce, Isaaru, Bevelle) `[verified: 2 sources]`.

### 8.3 Where it sits among the chapters

| Chapter | Story point | Relation |
|---|---|---|
| VIII Evrae (built) | The *Fahrenheit* reaches Bevelle | Ends at the mooring chains as the bells ring; the wedding is not staged (`ffx-seymour-natus-highbridge.md` §8.1) |
| **This chapter** | The Via Purifico, Yuna's half | Between VIII and X |
| X Seymour Natus (built) | The Highbridge | Its planned pre-battle interlude narrates "Isaaru's contest of aeons" in one breath (§8.2 beat 6 there). If this chapter exists, **that line should point here or be trimmed** (O-7). |

Numbering follows registration order (D-058). The story order is VIII, then this chapter, then X.

### 8.4 FFX-2 afterlife (not for this chapter; rule 14)

Two years later, Isaaru works for Cid as a Zanarkand tour guide. Maroda has joined the Youth League, Isaaru leans New Yevon, and Pacce leads the Kinderguardians (wiki). None of it belongs in an FFX chapter except, at most, as an epilogue line the writing bible would have to approve.

---

## 9. Music

| Track | What the sources say | Confidence |
|---|---|---|
| **"Via Purifico"** (浄罪の路), by Nobuo Uematsu | The maze's field theme, OST disc 3 track 17. The HD Remaster swaps in the *Piano Collections* arrangement. | wiki OST + wiki *Via Purifico (theme)* `[verified: 2 sources]` |
| **"A Contest Of Aeons"** (召喚獣バトル), by Junya Nakano | Plays when **Yu Yevon's possessed aeons** are fought, and against **Penance** (Int/HD) | wiki OST + track page `[verified: 2 sources]`. **Not listed for Isaaru.** |
| **The battle cue for the Isaaru duel** | **No source names it.** | Open (O-8) |

**Do not transcribe, sample or arrange any of these** (rule 8). `docs/audio/THEMES.md` has no Isaaru or Via Purifico entry. An original cue (or a pick among existing project cues) goes through an **audio options round** that Bailey judges by ear (rules 9 and 13).

---

## 10. Art: what exists, and what can be derived

### 10.1 Yuna's aeons in `public/art/characters/`

| Aeon | Poses on disk | Verdict | Source of the verdict |
|---|---|---|---|
| **Shiva** | idle, attack, overdrive | **Approved** (board tile, `approved-hashes.json` "cast:shiva") | `docs/target/targets.json` group 2 |
| **Valefor, Ifrit, Ixion, Bahamut** | idle, attack, overdrive | **No separate verdict.** They **ship as Chapters I, VII and VIII use them** (D-089, Natus B13). | `docs/target/decisions.json` D-089; the board's note, "the other… aeons… have no verdict yet" |
| **Anima** | idle, attack, hurt, ko, overdrive | Reused as "the approved aeon idle" at Macalania (D-045). Not in `approved-hashes.json`. | D-045 |
| **Yojimbo** | idle, attack, overdrive | Chapter IX has its own boss painting and casts (Bailey's picks, 2026-09-24) | `approved-hashes.json` chapter:yojimbo sets |

**So the brief's "approved aeon paintings (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo)" is too broad:** on the board, only Shiva is approved. Valefor, Ifrit, Ixion and Bahamut are cleared to ship by D-089 without a verdict of their own. Anima and Yojimbo are not in this fight at all (§1.3).

### 10.2 Can Isaaru's aeons be derived from them?

- **The sources support the same look.** Pterya "is the same aeon as Valefor and uses the same attacks". The wiki illustrates Grothia with the Ifrit render and Pterya with the Valefor render `[single source: wiki]`. **No source describes any visual difference** between Isaaru's aeons and Yuna's.
- **The mirror lock makes reuse clean:** Yuna can never have her own Ifrit on the field against Grothia (the same holds for Pterya and Spathi). The same painting therefore **never appears on both sides at once** `[derived]`.
- **Recommendation `[estimate]`:** Grothia = the Ifrit painting, Pterya = the Valefor painting, Spathi = the Bahamut painting, all shown on the enemy side. All five sidecars are `facing: left`, like the boss paintings (`yunalesca-1`, `x2-shiva`, `ffx2-bahamut`), so check the engine's facing rule before assuming a flip. **What is missing:** these sets have **no hurt or KO pose** (only Anima has them), and an enemy that is defeated three times in a row will want one. There is also **no Spathi "Countdown" beat**. Whether to add those, or to add a small mark saying "this is Isaaru's aeon" (a name plate or a tint), is an **options-round question** (rule 9). **Do not repaint the approved Shiva, and do not alter the D-089 paintings in place** (targets.json note: never replace an approved painting on an agent judge's word).
- **Isaaru himself:** there is **no art** of him in `public/art/`, `docs/concepts/` or `tools/gen/`. He needs a field billboard (standing beside his aeon, per the wiki images) and a **speaker portrait**. Both are new concepts for an options round. The wiki gives his costume in words (§8.1). A look at reference images must come first (rule 6), and the result must stay original (rule 8).

---

## 11. Conflicts, gaps and the verify-before-shipping list

| # | Item | Status / what to do |
|---|---|---|
| I-1 | **Rewards:** decompile 0 gil / 0 AP on all three aeons; wiki Spathi 6,000 gil / 6,000 AP / 6,000 Overkill AP; GameFAQs 0 / 0 per aeon plus "5,000 AP for emerging victorious", awarded by no specific enemy | Unresolved. The decompile and GameFAQs agree on the per-enemy 0. **Recommend 5,000 AP to Yuna on winning** `[single source]`, labelled. Moot if the chapter awards no AP. |
| I-2 | GameFAQs: "Equipment Drop Rate 25%, Slots 0" on all three | Decompile drop chance 0; the GameFAQs line looks like a template default. No drops. |
| I-3 | **Threaten:** byte 0 (landable) against the wiki (Immune) and Jegged (Spathi immune to Heavenly Strike's effect) | Treat as **immune** (two sources against one byte; the same rule as Natus N-3). It matters because Shiva's Heavenly Strike carries Threaten. |
| I-4 | Spathi's record holds **counter** rows (Attack 4:127 "Counter", Impulse 4:173 "Counter Characters' Party") that no source describes | The record is shared with Belgemine's Remiem Bahamut (§3.0). **Do not build** until a second source shows Spathi countering. |
| I-5 | Countdown start: 5 (wiki, GameFAQs) against 4→1 (Jegged) | Build 5, labelled. The visible numbers can be checked against footage before shipping. |
| I-6 | Wiki: "all aeons' Overdrives should be hitting the damage cap" at this point | Not reproduced (3,164 to 6,540 derived; Jegged says Mega Flare may not kill Grothia's 8,000). Keep out of the hints. |
| I-7 | Jegged: ice is "most effective" on Grothia | Wrong: Ice is neutral (decompile + wiki + GameFAQs). Keep out of the hints. |
| I-8 | Isaaru's Threaten byte 0 against wiki Immune | Moot (he never acts). |
| I-9 | **Who gave the order**: Auronlu's Chapter X script has Isaaru name **Maester Kinoc**; the Personality section of the wiki's *Isaaru* page (revid 4026440) says **Mika** | Prefer the script: **Kinoc** (§8.2 beat 3). No writer should "correct" it to Mika (added 2026-09-24, plan review R10). |
| O-1 | **Yuna's and the aeons' preset and gauges.** P1 (Chapter X's shipped set) against P2 (the formula) against P3 (the floor); and whether Chapter X's aeon gauges become this chapter's end state | **Ask Bailey.** Recommend **P1 at the start with Chapter VII's carried gauges** (Valefor 90, Ifrit 60, Ixion 60, Shiva 0, **Bahamut at an [estimate] partial**, so the Pterya link can fill him as the sources say). The end state then reproduces Chapter X's B3 `[estimate]`. |
| O-2 | **Yuna's Grand Summon gauge at the start** (Jegged says to arrive full) | Design choice; decides whether the opening Grand Summon exists. |
| O-3 | Can Yuna use **items** or her own magic? Is Attack greyed out? Can she escape? | Unsourced. Recommend: Summon, Grand Summon (Overdrive) and Item available; Attack and Blk Magic unavailable against the aeons ("can only be fought by aeons"); no escape. All `[estimate]`, labelled. |
| O-4 | Is Isaaru targetable? | Unsourced; recommend not targetable `[estimate]`. |
| O-5 | Grothia's Attack/Fira split and Pterya's Attack/Sonic Wings split | Unsourced; an even split `[estimate]`. |
| O-6 | What Spathi does to Yuna when she has no aeon out | Unsourced. With the count running, the honest reading is that he keeps counting and Mega Flare hits Yuna at zero (lethal, §5.2) `[estimate]`. |
| O-7 | Chapter X's narration of this duel (its beat 6) once this chapter exists | Trim or re-point; a writing decision for the plan. |
| O-8 | The battle cue | Unsourced (§9). Audio options round. |
| O-9 | Pterya's starting gauge | Unsourced; recommend 0 `[estimate]`. |

---

## 12. Recommendation for the chapter (FFX only)

**Build it, as three links in one chapter, faithful to the source's shape: Grothia, then Pterya, then Spathi, back to back with no heal between them.** It is small and cheap to stage (one room, three reused aeon paintings, one new character). It is also the only chapter in which the player commands **nothing but aeons**. It has three clean, teachable threats, each confirmed by at least two sources:

1. **Grothia opens with Hellfire.** It kills almost any fresh aeon (§5.2), so the first decision is Shield, NulBlaze, or a sacrifice.
2. **Pterya is the breather,** and she is where Bahamut fills his gauge for the Highbridge.
3. **Spathi's visible countdown to Mega Flare.** Shield at 1, then fight. This is the CTB telegraph at its purest.

The **mirror lock** turns the three links into a resource puzzle: which aeon spends what, and where. It also carries the story's one sourced lore point (one summoner per fayth).

**Minimum mechanic list** (a check against the engine comes in the plan, by running it, not by grepping: rule 3):

1. A **Yuna-only formation** with Summon, Grand Summon and Dismiss (the last two exist in `src/battle/ffx`: `overdrive.ts`, `execute.ts`).
2. An **enemy-side summoner actor** that never acts and is not targetable (O-4).
3. **The mirror lock** on the Summon list, per link.
4. **Enemy aeon Overdrive gauges** with the wiki's fill rates, Grothia's full start, and the "no gain from attacking Yuna" rule. A scripted `overdriveGaugeGain` exists in `src/battle/ffx/scripted.ts` for the *target's* gauge. Whether an enemy-side gauge exists needs checking.
5. **Spathi's Countdown** as a visible counter to Mega Flare. A text search found only the Doom and aeon-revive counters, so confirm by running the engine.
6. **A three-battle chain** that carries HP, MP, gauges and KOs, with the loss rule "Yuna KO or no aeon left" (§1.2).
7. **Every stat, row and immunity exactly as §2 and §3**, including Hellfire and Mega Flare as Magic formula / type Other (MDef applies, Shell does not), Energy Ray as Magical (Shell applies), Grothia absorbing Fire, and Delay and Threaten doing nothing (I-3).

**Recommend against** folding in the maze traversal (the earlier pass's option C). It adds exploration the anthology does not have, and the sourced drama is in the final chamber.

**Before anything is built (rules 9 and 10):** end-state options for the Via Purifico chamber, Isaaru's billboard and speaker portrait, how the enemy aeons are marked (reuse as is, or with a name plate or tint), the missing hurt/KO poses, a HUD mockup of the mirror lock and Spathi's countdown, and a battle-cue sketch. Bailey also answers O-1, O-2 and O-3. None of these exists yet.

---

## Sources

**Decompile-derived data** (Grayfox96/FFX-RNG-tracker, pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`; modules and data files loaded into memory, nothing written to disk)

- https://github.com/Grayfox96/FFX-RNG-tracker
- `ffx_rng_tracker/data/data_files/ffx_mon_data.csv` and `ffx_mon_data_hd.csv`: `m248`, `m254`, `m284`, `m287` (and `m119` as the parser check)
- `ffx_rng_tracker/data/data_files/monster_actions.json` (`m248` empty; `m254`, `m284`, `m287`) and the action files 3 and 4 through the tracker's `actions.py`: rows 3:69; 4:0, 4:61, 4:92–95, 4:98, 4:115–116, 4:119, 4:127, 4:137, 4:139–140, 4:143, 4:166, 4:173, 4:230
- `ffx_rng_tracker/data/data_files/formations.json`: `bosses.isaaru_grothia`, `isaaru_pterya`, `isaaru_spathi`
- `ffx_rng_tracker/data/data_files/characters.json` (aeon Eater and Piercing auto-abilities), `constants.py` (`AEONS_STATS_CONSTANTS`, `ENCOUNTERS_YUNA_STATS`), `gamestate.py::calculate_aeon_stats`

**Final Fantasy Wiki** (via `api.php?action=parse&prop=wikitext|revid`, browser user agent; fetched 2026-09-24)

- Grothia, revid 3979432: https://finalfantasy.fandom.com/wiki/Grothia
- Pterya, revid 3979322: https://finalfantasy.fandom.com/wiki/Pterya
- Spathi, revid 4005169: https://finalfantasy.fandom.com/wiki/Spathi
- Isaaru, revid 4026440: https://finalfantasy.fandom.com/wiki/Isaaru
- Isaaru (Final Fantasy X boss), revid 3963146: https://finalfantasy.fandom.com/wiki/Isaaru_(Final_Fantasy_X_boss)
- Maroda, revid 4026439: https://finalfantasy.fandom.com/wiki/Maroda
- Pacce, revid 4036518: https://finalfantasy.fandom.com/wiki/Pacce
- Via Purifico, revid 4034460: https://finalfantasy.fandom.com/wiki/Via_Purifico
- Bevelle, revid 4008196: https://finalfantasy.fandom.com/wiki/Bevelle
- Belgemine, revid 3963149: https://finalfantasy.fandom.com/wiki/Belgemine
- Aeon (Final Fantasy X), revid 4029264: https://finalfantasy.fandom.com/wiki/Aeon_(Final_Fantasy_X)
- Valefor (Final Fantasy X), revid 4032533; Ifrit (Final Fantasy X), revid 4045233; Ixion (Final Fantasy X), revid 4031094; Shiva (Final Fantasy X), revid 4045203; Bahamut (Final Fantasy X), revid 4028158
- Final Fantasy X enemy abilities, revid 4008011 (reached through the Countdown, Mega Flare, Hellfire, Energy Ray, Sonic Wings and Fira ability redirects): https://finalfantasy.fandom.com/wiki/Final_Fantasy_X_enemy_abilities
- Final Fantasy X statuses, revid 4030921 ("Tough", reached through the Tough redirect)
- Final Fantasy X: Original Soundtrack, revid 4011106; A Contest Of Aeons, revid 3988626; Via Purifico (theme), revid 3967714

**Guides and script**

- GameFAQs, bover_87, *Final Fantasy X Remaster Walkthrough (PC)*, v1.3, "Bevelle" page (Via Purifico Maze; Grothia, Pterya, Spathi): https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/bevelle
- Jegged, FFX Walkthrough 23, "Via Purifico" ("Isaaru's Aeons" boss section): https://jegged.com/Games/Final-Fantasy-X/Walkthrough/23-Via-Purifico.html
- Auronlu, *FFX Game Script*, Chapter X: Bevelle (the Home lines, the Via Purifico, Isaaru's scene, the Highbridge): http://auronlu.istad.org/ffx-script/chapter-x-bevelle/

**Local prior research and files consulted (read-only):** `research/ffx-seymour-natus-highbridge.md` (structure; §6.2, §8), `research/ffx-combat-core.md` §1.2, §2, §3, §5.4, §6, `research/ffx-evrae-airship.md` §9.3, `research/ffx-seymour-flux.md` §7.3, `research/ffx-isaaru-aeon-contest.md` (the superseded first pass), `src/data/ffx/builds/highbridge.ts`, `macalania.ts`, `gagazet.ts`, `docs/target/approved-hashes.json`, `docs/target/targets.json`, `docs/target/decisions.json` (D-045, D-058, D-089), `public/art/characters/*/*.json`.

---

## 13. Verification log (2026-09-24)

| # | Claim | Check | Result |
|---:|---|---|---|
| 1 | Parser correctness | the same in-memory loader on Evrae `m119` against `ffx-evrae-airship.md` §1 | identical |
| 2 | PS2 vs HD | byte diff of `m248`, `m254`, `m284`, `m287` | all four byte-identical |
| 3 | HP 8,000 / 12,000 / 20,000 | decompile + wiki + GameFAQs + Jegged | agree |
| 4 | Str/Def/Mag/MDef/Agi of all three | decompile + wiki (wiki prints 1 for zeros) | agree |
| 5 | Overkill 2,550 each; Isaaru 10 HP | decompile + wiki (+ GameFAQs for the 2,550) | agree |
| 6 | Grothia absorbs Fire, the rest neutral; Demi, Delay, Slow, Eject immune | decompile + wiki + GameFAQs | agree; Threaten conflict I-3 |
| 7 | Three formations, forced party `y` | `formations.json` | `isaaru_grothia` / `_pterya` / `_spathi` |
| 8 | Fira 24, Hellfire 70, Energy Ray 26, Sonic Wings 8, Mega Flare 44 | decompiled rows + the wiki enemy-ability table | agree |
| 9 | Special attacks on Yuna (4:127 for Grothia, 4:92 for Pterya) | decompile accuracy/DmgCon against the wiki's "increased accuracy" / "reduced power and accuracy" | agree |
| 10 | Mega Flare "around 2,200", "about 550" with Shield | damage chain on P1/P2 aeons: 2,148–2,469, ÷4 = 537–617 | reproduces the play figures |
| 11 | Countdown to Mega Flare | wiki + GameFAQs (5), Jegged (4→1) | conflict I-5 |
| 12 | Rewards | decompile 0/0; GameFAQs 0/0 + 5,000 AP for the win; wiki Spathi 6,000/6,000 | conflict I-1 |
| 13 | Aeons owned: Valefor, Ifrit, Ixion, Shiva, Bahamut | GameFAQs (Bahamut named in Bevelle) + wiki *Aeon (FFX)* + Natus research §6.2 | agree |
| 14 | Mirror lock | wiki Grothia, Spathi, Isaaru, Pterya + Jegged + the lore line on wiki *Aeon (FFX)* | agree |
| 15 | Art on disk and its verdicts | `public/art/characters/`, `approved-hashes.json`, `targets.json`, D-089 | only Shiva board-approved; no Isaaru art anywhere |
| 16 | "A Contest Of Aeons" track use | wiki OST + track page | Yu Yevon's aeons and Penance; not Isaaru |
