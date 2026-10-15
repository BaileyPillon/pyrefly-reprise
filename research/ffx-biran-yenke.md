# FINAL FANTASY X — Biran and Yenke Ronso (Mt. Gagazet, the mountain gate): Implementation Reference

**Target project:** Pyrefly Reprise / Echoes of Spira (Vite + TypeScript + Three.js, painted 2.5D billboards over 3D dioramas)
**Request:** Bailey, 2026-10-15, in a cloud Claude Code session, verbatim: "Implement the unimplemented chapters please." and, minutes later, "I would like to add, don't just implement the unimplemented chapters. Implement the unimplemented chapters end-to-end please. It needs to be a finished product." The unimplemented chapters are D-536's (2026-10-07; D-520, D-838): **Biran and Yenke Ronso** (FFX, this file) and **Angra Mainyu** (FFX-2, `research/ffx2-angra-mainyu.md`).
**Research date:** 2026-10-15
**Encounter:** **Biran Ronso and Yenke Ronso**, one battle at the gate of Mt. Gagazet, **Kimahri alone** against the two Ronso. Monster records **m134** (Biran) and **m135** (Yenke); formation `biran_&_yenke`, forced party **`k`** (Kimahri) `[decompiled]`.
**Recommendation (§13):** build it, **FFX only**, as one hidden chapter of one link: Kimahri alone, the two Ronso guarding each other, Lancet teaching Ronso Rages mid-fight. Every move's numbers are the game's own rows; the two records are the game's; the stats the battle writes at its start and the fight's rules are the written sources' description, read through the web search tool (§0.2), modelled and tagged.

---

## 0. Provenance, method, and how to read this document

### 0.1 Confidence tags

| Tag | Meaning |
|---|---|
| `[decompiled]` | Read from the game's own monster and command tables as published in Grayfox96/FFX-RNG-tracker, **pinned commit `0acf1ac3190c4b75b6a8e9f02eb47897da20c680`** (the commit the Natus, Omnis, Yojimbo and Gui files use): `ffx_mon_data_hd.csv` and `ffx_mon_data.csv` rows 134 and 135, `ffx_command.csv`, `ffx_monmagic1.csv`, `ffx_monmagic2.csv`, `monster_actions.json` (`m134`, `m135`), `formations.json` (`biran_&_yenke`). Decoded **as data, with a decoder of my own** that follows the byte layout of the tracker's `monsters.py` and `actions.py` (read as text; the tracker's code was not run). PS2 and HD rows are byte-identical for these two monsters. |
| `[game table]` | The same field in `tests/fixtures/parity/ffx/command_records.json` (the Steam HD build 25501027's own battle-kernel tables, read by the re-parity lane: `research/re-ffx-commands.md` section 1). **Every command row of this fight agrees with the decompiled row in every column the fixture carries** (id, type, flags, damage class, formula, accuracy, power, hits, shatter, element). |
| `[search: N sources]` | Read through the **web search tool's summaries**, not the page itself (§0.2): N different pages, named by the summaries, say it. The FF Wiki counts once however many of its pages say it. |
| `[search: single source]` | One page only, through a summary. |
| `[derived]` | Computed by me from the rows and a sourced formula. |
| `[inferred]` | My reading of two or more facts together; stated with its reasoning. |
| `[estimate]` | My own design judgement, not a measured fact. |
| `[conflict]` | The sources disagree. Listed again in §11 with the resolution. |

### 0.2 What I did, and what this environment allowed

1. Read `AGENTS.md`, `docs/handoff/NOW.md`, the decisions D-520, D-536, D-838, D-842, D-843, D-846, D-848 (`docs/target/decisions.json`), `research/ffx-seymour-flux.md` §6.1 and §7 (the Kimahri preset this chapter starts from), `research/ffx-combat-core.md` (the Ronso Rage table), `research/writing-bible.md` §1.7 and §2.1, and the handoffs of the last four hidden chapters (`docs/handoff/ch-gui.md`, `ch-tourist-trap.md`, `ch-besaid-valefor.md`) as format and process models.
2. **Decoded the game's rows** (`[decompiled]`, above): both monster records in full, every command either script uses (§3), Lancet, Guard, Sentinel and Kimahri's twelve Ronso Rages. Cross-checked the command rows against the in-repo fixture (`[game table]`): no difference.
3. **The written sources.** This session runs in a cloud container whose network policy refused the wiki and guide hosts (`finalfantasy.fandom.com`, `gamefaqs.gamespot.com`, `jegged.com`, `strategywiki.org`, `gamerguides.com`, `lparchive.org`, `finalfantasy.neoseeker.com`: every connection answered 403 by the egress proxy), and the page-fetch tool could not resolve them either. The only route to them was the **web search tool**, whose results are a model's summary of the pages it found, naming them. I ran fourteen searches on this fight, phrased differently so that different pages were summarised, and kept a fact only when the summaries named the page it came from. **This is weaker than reading the page**, which is what the earlier research notes did; every such fact carries `[search: …]`, and **no number of the damage chain comes from a summary** (every move's formula, power, element and status bytes is a row). The formulas of §2.2 are the one place where a summary's transcription is load-bearing: they are listed first in the verify-before-shipping list (§11.2).
4. **Not read:** the battle scripts themselves (`m134`, `m135` and the formation's script). No game files exist in this environment. So the fight's *rules* (§4) are the written sources' description, built on the engine's own mechanisms where the game has one (the Cover search and the Sentinel stance, §4.4), and tagged. §12 is the question list for the reverse-engineering session, which can settle all of them from the scripts.

### 0.3 Game case (AGENTS.md rule 14)

**FFX only.** Biran and Yenke, Kimahri's Lancet and Ronso Rage, the CTB and the FFX status set exist only in *Final Fantasy X*. In *X-2* the Ronso are on Mt. Gagazet too (Garik and the Ronso youths, a different fight in a different game, `docs/plans/next-content-2026-09-27.md`); nothing here applies to it. The shared plumbing this chapter adds (one door row, the registry rows) is "both" as plumbing (CHK-020) and inert for every other chapter.

### 0.4 What the sources settle

| Question | Answer | Confidence |
|---|---|---|
| Who fights? | **Kimahri alone.** The formation's forced party is `k`. No Switch, no aeons, no other member. | `[decompiled]` + `[search: 4 sources]` |
| How many fights? | **One battle, two enemies**, both of which must fall. | `[decompiled]` (formation of two) |
| Their stats? | The records hold the same placeholder block for both (HP 9,999, Str 25, Mag 30, Agi 32); **the battle writes HP, Strength, Magic and Agility from Kimahri's own stats when it starts** (§2.2). | `[decompiled]` for the records; the formulas `[search: 4 sources]` with two `[conflict]`s |
| What do they do? | Biran: Thunder, Blizzard, Bulldoze; Mighty Guard once when low; Berserk on himself when Yenke has fallen. Yenke: Fire Breath, Aqua Breath, Bulldoze; White Wind once when low; Haste on himself when Biran has fallen. | which commands and on whom: `[decompiled]` (`monster_actions.json`); the order and the triggers `[search: 3 sources]` |
| What can Lancet teach? | Biran: **Self-Destruct, Thrust Kick, Doom, Mighty Guard**; Yenke: **Fire Breath, Stone Breath, Aqua Breath, White Wind**. Mighty Guard and White Wind only **after the Ronso has used it**. Nova and Bad Breath cannot be learned here. | `[search: 4 sources]` + the in-repo `research/ffx-seymour-flux.md` §6.1 `[verified: 2 sources]` |
| What does the guarding do? | While the two stand side by side, each **takes the physical blows aimed at the other** and normal attacks do little; **Bulldoze moves the user to the other row**, and while they stand on different rows the guarding stops. | `[search: 4 sources]`; the exact reduction `[conflict]` (§4.4) |

---

## 1. The sequence at a glance

| # | Beat | Source |
|---|---|---|
| 1 | Out of the Calm Lands, the party reaches the gate of Mt. Gagazet, the Ronso's sacred mountain. Maester **Kelk Ronso** bars the way, then lets Yuna pass, moved by her resolve to finish the pilgrimage. | `[search: 2 sources]` (FF Wiki *Mt. Gagazet*, *Kimahri Ronso*) |
| 2 | **Biran and Yenke** step out for Kimahri. Their quarrel is old: Biran beat Kimahri years ago, Kimahri would not accept the defeat, and **Biran broke Kimahri's horn**; he has called him "hornless" since. | `[search: 2 sources]` (FF Wiki *Biran Ronso*, *Kimahri Ronso*) |
| 3 | **Kimahri fights the two of them alone.** | `[decompiled]` (forced party `k`) + `[search: 4 sources]` |
| 4 | Kimahri wins. The two **accept the defeat honourably and respect him again**; the Ronso swear to hold the gate against anyone who would follow Yuna to stop her. | `[search: 2 sources]` |
| 5 | Further up the mountain (our Chapter I), the party finds the Ronso dead on the Prominence, Biran and Yenke among them (`research/writing-bible.md` E1, `research/visual-bible.md` §1.22.4). | in-repo `[verified: 2 sources]` |

---

## 2. Enemy stat blocks

### 2.1 The records (`m134` Biran, `m135` Yenke) `[decompiled]`

| Field | Biran (`m134`) | Yenke (`m135`) |
|---|---|---|
| HP / MP (record) | 9,999 / 200 | 9,999 / 200 |
| Overkill threshold | 2,500 | 2,500 |
| Str / Def / Mag / MDef (record) | 25 / **30** / 30 / **10** | 25 / **30** / 30 / **10** |
| Agi / Luck / Eva / Acc (record) | 32 / **15** / **0** / **100** | 32 / **15** / **0** / **100** |
| Flags (bytes 40, 41) | 0x04 (immune to Life), 0x07 (Delay, Slice, Bribe) | the same |
| Poison tick | 10 % of max HP | the same |
| Elements | neutral to all five | neutral to all five |
| Doom counter | 20 | 20 |
| Zanmato level byte | 3 | 3 |
| Forced action (Provoke / Berserk) | **0x60a5 Bulldoze** | none (0x0000) |
| Ronso Rage byte (134-135) | **0** | **0** |
| Menu list (bytes 80-111) | 0x60a2, 0x60a3, 0x60a1, 0x60a4, 0x60a5 | the same |

The bold fields are the ones the battle does not overwrite (§2.2); the wiki's and GamerGuides' stat blocks agree with them (Defense 30, Magic Defense 10, Luck 15, Accuracy 100, Evasion "1", which is the record's 0 after the battle clamps every stat to 1 to 255) `[search: 2 sources]`. **The Ronso Rage byte is 0 on both**: what Lancet teaches here is not the record's (the battle's own script sets it, §4.5).

### 2.2 The stats the battle writes from Kimahri's `[search: 4 sources]`, with conflicts

All four sources (the FF Wiki's two boss pages, a GameFAQs board thread that posts the formulas, Game8's boss guide, and the Let's Play Archive's quotation of an older wiki copy) say the same thing in outline: **HP comes from Kimahri's Strength and Magic, Strength and Magic come from Kimahri's HP, Agility from Kimahri's Agility; everything else is the record's.** The summaries transcribe the wiki's formulas as:

```
V1  = Kimahri.STR^3
V2  = Kimahri.MAG^3
V3  = (V1 + V2) / 2 * 16 / 15
HPv = (V3 / 32 + 30) * 586 / 730
Biran.HP = HPv * 8        Yenke.HP = HPv * 6
K   = (Kimahri.HP - 644) / 200                    (whole steps; "current HP" in Game8's reading)
Biran.STR = [11, 12, 13, 15, 17, 19, 21, 22, 23, 24, 25, 27][min(K, 11)]
Yenke.MAG = a table from 8 (K = 0) to 22 (K >= 11); the steps between were not legible in any summary
Biran.MAG = Yenke.MAG / 2
Biran.AGI = Kimahri.AGI - 4      Yenke.AGI = Kimahri.AGI - 8
```

- **`586 / 730` is FFX's defence factor for Defense 30** (`(730 - (30*51 - 30*30/11)/10) / 730` = 585.2 / 730) `[derived]`, the Ronso's own record value: the HP is about eight (Biran) and six (Yenke) of an average of Kimahri's physical and magical blows against them. That is why the fight scales: it is built to take the same number of blows whatever Kimahri's build. A GameFAQs poster says the factor is "accurate at low and high defenses, but off by 1 at the middle numbers" `[search: single source]`.
- `[conflict]` **16/15 or 15/16.** The wiki has `16/15`; the GameFAQs thread writes `15/16` `[search: single source each]`. **Used: 16/15** (the wiki's, the page the other sources quote). With the preset below the difference is Biran 3,208 or 2,840 HP.
- `[conflict]` **Yenke ×6 or ×8.** The current wiki and the GameFAQs thread have ×6; the LP Archive's quotation of an older wiki copy has ×8 `[search]`. **Used: ×6** (two sources against one older copy).
- `[conflict]` **Yenke's Agility: Kimahri −8 or −6.** Game8 and the LP Archive say −8, the GameFAQs thread −6 `[search]`. **Used: −8.**
- `[inferred]` **Yenke's Strength: half of Biran's.** The summaries say "Biran's Magic is half of Yenke's" and cut off Yenke's Strength line; StrategyWiki's damage figures ("Bulldoze does about 600 from Biran and 75 from Yenke") `[search: single source]` fit only a Yenke Strength near half Biran's: at Strength 27 against an average Kimahri the Strength formula gives about 550 to 600, at 13 about 75 `[derived]`.
- `[estimate]` **Yenke's Magic at K = 8.** The table's ends are 8 and 22; at K = 8 both a straight line between them and the shape of Biran's own Strength table (index 8 is three quarters of the way up) give **18**. Used: 18. Biran's Magic is then 9.
- Neoseeker's "Biran's HP is a third greater than Kimahri's" `[search: single source]` matches none of the others and is not used.

**With this chapter's Kimahri** (§5: Str 26, Mag 22, HP 2,310, Agi 18; K = 8) `[derived]`:

| | HP | MP | Str | Def | Mag | MDef | Agi | Luck | Eva | Acc |
|---|---|---|---|---|---|---|---|---|---|---|
| Biran | **3,208** | 200 | **23** | 30 | **9** | 10 | **14** | 15 | 0 | 100 |
| Yenke | **2,406** | 200 | **11** | 30 | **18** | 10 | **10** | 15 | 0 | 100 |

(Integer steps: `V3` = floor(14,112 × 16 / 15) = 15,052; `HPv` = floor((floor(15,052 / 32) + 30) × 586 / 730) = 401.) The chapter computes these from the Kimahri it is given, so a change of preset moves them as the game would; the table is pinned by a test.

### 2.3 Elements and statuses `[decompiled]`

Neutral to Fire, Ice, Thunder, Water and Holy. Immune (255): Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect, Slow, Eject, Auto-Life; **Berserk: Yenke 255, Biran 0** (Biran berserks himself, §4.3). Land at their byte (0 = no resistance): the four Breaks, Threaten, Shell, Protect, the four Nuls, Regen, Haste; **Doom lands** (counter 20); Stone Breath's Petrify does not (255).

### 2.4 Rewards `[decompiled]`

| | Biran | Yenke |
|---|---|---|
| AP (Overkill) | 4,500 (6,750) | 4,500 (6,750) |
| Gil | 1,500 | 1,500 |
| Drop (chance 255) | Return Sphere ×1, rare Friend Sphere ×1; ×2 on an Overkill | the same |
| Steal (chance 255) | Lv. 3 Key Sphere ×1, rare ×2 | the same |
| Bribe | Potion ×1, but **immune to Bribe** | the same |
| Equipment drop chance | 255 ("Biran and Yenke always drop equipment", the tracker's notes) | the same |

The Return and Friend Spheres are "one of the very few places" to get them `[search: 2 sources]`. The equipment piece is not modelled (as for Gui: the results screen has no row for a gear drop).

### 2.5 Sensor and Scan text

Ours, in the house style (`research/writing-bible.md` §5.3): no stats, no numbers, under 20 words. In the data files.

---

## 3. Exact action data (decoded rows) `[decompiled]` + `[game table]`

### 3.1 The commands each script uses, and on whom (`monster_actions.json`)

| Who | Command | Row | Target as the table lists it |
|---|---|---|---|
| Biran | Thunder | 0x3043 (the party's own) | a random character |
| Biran | Blizzard | 0x3041 (the party's own) | a random character |
| Biran | Mighty Guard | **0x3072 (Kimahri's own Ronso Rage row)** | the monsters' party, **or** himself |
| Biran | Berserk | 0x400f | himself |
| Biran, Yenke | Bulldoze | 0x60a5 | a random character |
| Yenke | Haste | 0x3036 (the party's own) | himself |
| Yenke | White Wind | **0x3070 (Kimahri's own Ronso Rage row)** | the monsters' party, **or** himself |
| Yenke | Fire Breath | 0x60a2 | the characters' party |
| Yenke | Aqua Breath | 0x60a3 | the characters' party |

The two-target rows are the game's "both when together, himself when apart" (§4.2). **0x60a1 (a monster White Wind, Magic formula, power 80) and 0x60a4 (a monster Mighty Guard, Shell and Protect only) are on both menu lists but in neither script** `[decompiled]`: the Ronso use Kimahri's own rows, which is what makes them learnable by Lancet.

### 3.2 The rows

| Row | Name | Rank | MP | Formula | Power | Element | Damage type | Statuses | Other |
|---|---|---|---|---|---|---|---|---|---|
| 0x3043 | Thunder | 3 | 4 | Magic | 12 | Thunder | magical | — | Reflectable, Silence-gated |
| 0x3041 | Blizzard | 3 | 4 | Magic | 12 | Ice | magical | — | Reflectable, Silence-gated |
| 0x3072 | Mighty Guard | 4 | 0 | Magic | 0 | — | other | Shell 254, Protect 254, NulTide/Blaze/Shock/Frost 254 (one charge each) | — |
| 0x3070 | White Wind | 3 | 0 | Healing | 40 | — | other | — | heals |
| 0x3036 | Haste | 4 | 8 | CTB | 8 | — | magical | Haste 254 | Reflectable |
| 0x400f | Berserk | 3 | 0 | none | 0 | — | magical | **Berserk, chance 120** (certain) | — |
| 0x60a5 | Bulldoze | 3 | 0 | Strength | 16 | — | **physical** | — | can crit; always hits |
| 0x60a2 | Fire Breath | 3 | 0 | Magic | 16 | Fire | other | — | all characters; always hits |
| 0x60a3 | Aqua Breath | 3 | 0 | Magic | 16 | Water | other | — | all characters; always hits |

Every row's accuracy formula is 0 (**always hits**: `canMiss: false`, AGENTS.md rule 5). Bulldoze is the only physical move, so it is the only one Protect, Defend or Sentinel reduce on Kimahri.

### 3.3 Kimahri's side

**Lancet** (0x3020): rank 2, Magic formula (the engine runs its known formula 4, pinned in `tests/unit/data-ffx-command-records.test.ts`), power 6, **drains HP and MP**, damage type other (the guarding does not touch it). His twelve Ronso Rages are the in-repo rows 0x3068 to 0x3073 (`src/data/ffx/abilities/overdrive-kimahri-*.ts`); every one of them is damage type "other", so **no Ronso Rage is a physical blow either**: the guarding (§4.4) catches only his Attack.

---

## 4. The fight's rules

### 4.1 Their turns `[search: 3 sources]`, `[conflict]` on Biran's order

- **Yenke:** Fire Breath, Aqua Breath, Bulldoze, in that order, and again `[search: 2 sources]`.
- **Biran:** "alternates between Thunder and Blizzard, with Bulldoze in between" `[search: 2 sources]`, which one forum post spells as **Thunder, Bulldoze, Blizzard, Bulldoze**, round again; another guide lists "Bulldoze, Blizzard and Thunder" `[search: single source]`. **Used: Thunder, Bulldoze, Blizzard, Bulldoze** (the explicit four-step loop agrees with "alternates, Bulldoze in between").

### 4.2 Low HP: Mighty Guard and White Wind, once each `[search: 3 sources]`; `[conflict]` on the threshold

When **Biran** falls **below 25 % of his HP** he casts **Mighty Guard**, once; when **Yenke** does, **White Wind**, once. While the two stand together the spell covers both; **while they are apart it covers only the caster** (Mighty Guard "will not target Yenke when separated"; White Wind "will not heal Biran when separated") `[search: 2 sources]`, which is exactly the two target entries of the game's table (§3.1). Game8 says 50 % `[search: single source]`; the wiki and StrategyWiki say 25 %. **Used: 25 %.** These are the only turns on which Mighty Guard and White Wind can be learned (§4.5): to learn both, bring **both** below a quarter while both live.

### 4.3 When one falls `[search: 3 sources]` + `[decompiled]`

- **Yenke falls first:** Biran **casts Berserk on himself** (0x400f, certain), and from then on only Bulldozes (his forced action, §2.1), hitting hard (StrategyWiki: "about 1,000") `[search: single source]`. A Berserk Biran never casts Mighty Guard, so it can no longer be learned.
- **Biran falls first:** Yenke **casts Haste on himself** (0x3036).
- One summary had these the other way round; **the game's table settles it**: Berserk is in Biran's script and Haste in Yenke's, and only Biran can be berserked (Yenke's Berserk byte is 255) `[decompiled]`.

### 4.4 Guarding each other, and Bulldoze `[search: 4 sources]`; the reduction `[conflict]`

- While the two **stand side by side**, each covers the other: a normal attack on one is taken by the other, and does little damage ("normal attack will be ineffective, because they will automatically guard each other and greatly reduce the damage"; "reducing your attacks to about 30 damage to the wrong target"; "Guard causes regular attacks to deal 1/4 of their regular damage") `[search: 4 sources]`.
- **Bulldoze moves its user to the other row** (front to back and back to front). **If one has used it and the other not, the guarding means nothing** and Kimahri's attacks do full damage `[search: 3 sources]`. So the guide's line: Lancet and Overdrives (which the guarding does not touch) until a Bulldoze separates them, then attack.
- **The game's own mechanism, which this chapter uses** `[inferred]`: FFX's **Cover** search (`pp_BtlFindCover`, `src/battle/ffx/kernel/cover.ts`, proven against the game's code) already steps a monster holding **Guard** or **Sentinel** in for its partner on a single-target physical blow, and the **Sentinel** stance halves the physical damage its holder takes (`kernel/modifiers.ts#defendSentinelMod`). Both stances end on the holder's own turn unless the gear grants them (`kernel/turn-ticks.ts`), so the script re-grants it each turn while the two are together. **Model:** while both stand on the same row, each Ronso holds **Sentinel** (re-granted at each of his turns; taken off both as soon as their rows differ or one falls): the blow goes to the partner at half damage, and with Mighty Guard's Protect up, at a quarter (the "1/4" of one source). The script's own stance (Guard, Sentinel or Defend) is §12's first question; the switch is one constant.

### 4.5 What Lancet teaches `[search: 4 sources]`, the order `[inferred]`, the gauge `[single source]`

- Biran teaches **Self-Destruct, Thrust Kick, Doom** and, once he has used it, **Mighty Guard**; Yenke teaches **Fire Breath, Stone Breath, Aqua Breath** and, once he has used it, **White Wind**. One Lancet that lands teaches one Rage Kimahri does not have yet; a Lancet on a Ronso with nothing left to teach only drains.
- **Order** `[inferred]`: every summary lists each Ronso's Rages in the same order, which is ascending command order (Biran 0x306b, 0x306c, 0x306f, 0x3072; Yenke 0x3069, 0x306d, 0x306e, 0x3070). The script's own pick (the record's Ronso Rage byte is 0, so the script writes it) is §12's second question. Used: the first Rage in that order Kimahri does not know.
- **"If Kimahri learns a new Overdrive using Lancet, his Overdrive meter automatically fills"** `[single source: FF Wiki *Overdrive (Final Fantasy X)*]`, already quoted by `research/ffx-seymour-flux.md` §7.9.2 and used by Chapter I's preset.
- What is learned lasts **for the chapter only** (a hidden chapter writes nothing to the save).

### 4.6 What the fight does not have

No escape (a boss formation). No Talk line. Nothing changes between the two Ronso's numbers but §2.2. **Self-Destruct by Kimahri** ejects him; the engine ends a battle whose whole party is ejected as an **escape** (`engine-end.ts`), which the game's own result for this fight is not established (§12, question 5): the guide says not to.

---

## 5. The party: Kimahri alone

- **Forced party `k`** `[decompiled]`. The build is **Chapter I's Kimahri** (`src/data/ffx/builds/gagazet.ts`; `research/ffx-seymour-flux.md` §7.3 `[estimate]`: HP 2,100 / max 2,310 with the armlet's HP+10 %, MP 130, Str 26, Def 22, Mag 22, MDef 16, Agi 18, Luck 18, Eva 14, Acc 14; Kimahri's Spear with Piercing and Sensor; Glorious Armlet with HP+10 %) **minus what this duel teaches him and the Flux-only Talk**: the same method as Chapter IX's `yojimbo-cavern.ts`. Chapter I's preset assumes he arrives at the Prominence with Mighty Guard and White Wind learned here; this chapter is that lesson.
- **Ronso Rages at the start:** Jump only `[estimate]`: Chapter I's preset lists Jump, Mighty Guard and White Wind, and the last two are this fight's.
- **Gauge:** Stoic at 45 % `[estimate]`: `research/ffx-seymour-flux.md` C-16's figure for a Kimahri who has not learned anything on the mountain yet.
- **Items:** Chapter I's bag (`gagazet-kit.ts`, `[estimate]`), which a solo Kimahri can use.

---

## 6. Arena

The gate of Mt. Gagazet, at the foot of the climb, before the Prominence. The project has one painted Gagazet plate (`scenes/gagazet.ts`, Chapter I's Prominence); it stands in for the gate (§9).

---

## 7. Story: beats only (paraphrased; no line transcribed)

As §1. The voices are `research/writing-bible.md` §1.7 (Kimahri: three to eight words, third person, concrete nouns, speaks after a silence, one to three lines a scene) and §2.1 (FFX grammar: understate, then one unguarded line, then cut). Biran and Yenke speak in the Ronso register the wiki describes (proud, blunt, calling Kimahri "hornless"); every line is ours.

---

## 8. Music

The game plays **"Servants of the Mountain"**, Mt. Gagazet's own theme, through this fight rather than a battle theme `[search: single source]`, and **"Hymn of the Fayth — The Ronso"** after it `[search: single source]`. The project never quotes the game's score (rule 8); it has its own Gagazet bed, `scene-gagazet` (Chapter I's establishing cue), and FFX boss cues. §13 names the pick.

---

## 9. Art: what exists

No painting of Biran or Yenke exists in the approved set (the visual bible specifies the three slain Ronso's corpse poses for Chapter I's opening, `research/visual-bible.md` §1.22.4, and their colours: Biran's fur grey-blue with a blond mane, the largest; Yenke light, brown-haired, a dark horn, leather on forearms and chest only). §13 says what stands in.

---

## 10. What the FFX engine has and what it lacks

Has: Lancet's drain (HP and MP); all twelve Ronso Rages as Kimahri's own Overdrive rows and their picker; a one-member party (Chapter XIV is Yuna alone) and `noSwitch`; Cover and Sentinel on monster slots (the game's own search); Doom with a monster counter; Berserk's forced action; per-actor AI memory and hit hooks; two enemies with their own scripts. **Lacks:** an enemy that teaches a Rage (the record byte is read nowhere, `learnsRonsoRage` on Lancet is read nowhere), the gauge rule on learning, the Ronso's own rows (`command-records/enemies.ts`), their scripts, and a solo Kimahri build.

---

## 11. Conflicts, gaps and the verify-before-shipping list

### 11.1 Conflicts and how each was resolved

| # | Conflict | Resolution |
|---|---|---|
| B-1 | HP factor 16/15 (wiki) or 15/16 (GameFAQs thread) | 16/15, the wiki's |
| B-2 | Yenke's HP ×6 (wiki, GameFAQs) or ×8 (older wiki copy) | ×6 |
| B-3 | Yenke's Agility −8 (Game8, LP Archive) or −6 (GameFAQs) | −8 |
| B-4 | Mighty Guard and White Wind below 25 % (wiki, StrategyWiki) or 50 % (Game8) | 25 % |
| B-5 | Biran's order: Thunder, Bulldoze, Blizzard, Bulldoze (forum, "alternates with Bulldoze between") or "Bulldoze, Blizzard, Thunder" (one guide) | the four-step loop |
| B-6 | Who berserks and who hastes | the game's table: Biran Berserk, Yenke Haste |
| B-7 | The guarding's reduction: "a quarter", "about 30 damage", "greatly" | the engine's Cover with Sentinel (half; a quarter under Protect), §4.4 |

### 11.2 Verify before shipping (read the pages, or the scripts)

1. The §2.2 formulas, transcribed by a summary: the exact constants (16/15, 586/730, ÷32, +30), the integer order, and **Yenke's Magic table** (only its ends, 8 and 22, were legible).
2. Yenke's Strength (inferred as half of Biran's).
3. Whether "Kimahri's HP" in `K` is current or maximum HP (Game8 says current: a hurt Kimahri meets weaker Ronso).
4. Biran's turn order (B-5) and the 25 % threshold (B-4).

### 11.3 Not modelled, said plainly

The equipment piece each Ronso drops; the Overkill drop doubling for the spheres beyond what the results screen already pays; the Ronso walking to their new row on screen (the row is shown by the guard's status, §13).

---

## 12. Open questions for the game data (for the reverse-engineering session)

1. Which stance does the script give the two while together: Guard (0x1000), Sentinel (0x2000) or Defend (0x800), and when is it given and taken?
2. What does the script write to the Ronso Rage byte, and when (after each Lancet, after each use of Mighty Guard and White Wind)? Is the order the ascending command order?
3. The exact stat formulas of §2.2 and Yenke's Magic table.
4. The exact HP threshold for Mighty Guard and White Wind, and the turn order of each script.
5. The result of the battle when Kimahri ejects himself with Self-Destruct while a Ronso stands.
6. Whether a Berserk Biran's Bulldoze carries Berserk's damage bonus in the game's formula (the engine applies its own Berserk rule).

---

## 13. Recommendation for the chapter (FFX only)

Build it as **one hidden chapter, one link**: Kimahri alone, Biran and Yenke with the rows above, their stats written from Kimahri's at setup, the scripts of §4, Lancet teaching with the gauge rule, the guarding as the engine's Cover with Sentinel. It is the "tutorial for the tool that saves you from Total Annihilation" that `research/ffx-seymour-flux.md` §6.1 called for, and the reason Chapter I's Kimahri arrives with Mighty Guard. Hidden behind a typed word like its siblings (D-848: play first, then list), provisional art from approved paintings, an existing cue by reference, and every item of §11.2 and §12 written into the handoff.

---

## Sources

Read as data (decoded with my own reader):
- Grayfox96/FFX-RNG-tracker, commit 0acf1ac3190c4b75b6a8e9f02eb47897da20c680: `ffx_rng_tracker/data/data_files/ffx_mon_data_hd.csv`, `ffx_mon_data.csv` (rows 134, 135), `ffx_command.csv`, `ffx_monmagic1.csv`, `ffx_monmagic2.csv`, `monster_actions.json` (`m134`, `m135`), `formations.json` (`biran_&_yenke`), `notes/anypercent/drops_notes.txt` (the equipment drop note); byte layout from `monsters.py` and `actions.py`, read as text.
- In repo: `tests/fixtures/parity/ffx/command_records.json` (the Steam HD build's command tables).

Read through the web search tool's summaries (2026-10-15; the pages themselves were refused by this session's network policy):
- https://finalfantasy.fandom.com/wiki/Biran_Ronso_(boss) and https://finalfantasy.fandom.com/wiki/Yenke_Ronso_(boss)
- https://finalfantasy.fandom.com/wiki/Biran_Ronso , https://finalfantasy.fandom.com/wiki/Yenke_Ronso , https://finalfantasy.fandom.com/wiki/Kimahri_Ronso , https://finalfantasy.fandom.com/wiki/Mt._Gagazet , https://finalfantasy.fandom.com/wiki/Ronso_Rage
- https://gamefaqs.gamespot.com/boards/643146-final-fantasy-x-x-2-hd-remaster/68913316 ("What are the exact formulae for determining Biran's and Yenke's stats?")
- https://game8.co/games/Final-Fantasy-X/archives/269210
- https://lparchive.org/Final-Fantasy-X-(by-The-Dark-Id)/Update%2098/
- https://strategywiki.org/wiki/Final_Fantasy_X/Mt._Gagazet
- https://www.gamerguides.com/final-fantasy-x-hd/guide/bestiary/bosses/biran-ronso
- https://eip.gg/ffx-x2/guides/kimahri-overdrive-ronso-rage/ ; https://jegged.com/Games/Final-Fantasy-X/Overdrives/Ronso-Rage.html ; https://jegged.com/Games/Final-Fantasy-X/Walkthrough/26-Mt-Gagazet.html
- https://samurai-gamers.com/final-fantasy-x-x2-hd-remaster/biran-and-yenke-ronso-boss-guide/
- https://finalfantasy.neoseeker.com/wiki/Biran_Ronso (the outlier HP line, not used)

## Verification log (2026-10-15)

- The two records were decoded from both the PS2 and the HD tables: identical. Every command row of §3.2 was compared with the in-repo fixture of the Steam build: identical in every column the fixture holds.
- The stats of §2.2 with this chapter's Kimahri were computed by hand above and are pinned by the chapter's data test against the code's own computation.
- The derived damage checks of §2.2 (Biran's Bulldoze about 550 to 600 at Strength 27, Yenke's about 75 at 13) use the Strength formula of `research/ffx-combat-core.md` §2.
